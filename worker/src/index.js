const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-admin-key",
};

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: Object.assign({ "Content-Type": "application/json" }, CORS_HEADERS),
  });
}

function genId() {
  return "p-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}

function autoSku() {
  return "CUS-" + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 90 + 10);
}

function requireAdmin(request, env) {
  const key = request.headers.get("x-admin-key");
  return key && env.ADMIN_KEY && key === env.ADMIN_KEY;
}

function nullableNumber(v) {
  return (v === null || v === undefined || v === "") ? null : Number(v);
}

function sanitizeProduct(body) {
  return {
    cat: String(body.cat || ""),
    name: String(body.name || "").trim(),
    sku: String(body.sku || "").trim(),
    price: Number(body.price) || 0,
    oldPrice: nullableNumber(body.oldPrice),
    price2: nullableNumber(body.price2),
    price3: nullableNumber(body.price3),
    unit: String(body.unit || "").trim(),
    stock: Number(body.stock) || 0,
    vat: body.vat === "novat" ? "novat" : "vat",
    image: String(body.image || ""),
  };
}

async function insertProduct(env, item) {
  const p = Object.assign({ id: genId() }, sanitizeProduct(item));
  if (!p.sku) p.sku = autoSku();
  await env.DB.prepare(
    "INSERT INTO products (id, cat, name, sku, price, oldPrice, price2, price3, unit, stock, vat, image) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)"
  ).bind(p.id, p.cat, p.name, p.sku, p.price, p.oldPrice, p.price2, p.price3, p.unit, p.stock, p.vat, p.image).run();
  return p;
}

async function upsertProductByName(env, item) {
  const sanitized = sanitizeProduct(item);
  const existing = await env.DB.prepare("SELECT * FROM products WHERE name = ?").bind(sanitized.name).first();
  if (existing) {
    const merged = Object.assign({}, existing, {
      cat: sanitized.cat || existing.cat,
      price: sanitized.price,
      price2: sanitized.price2,
      price3: sanitized.price3,
      unit: sanitized.unit || existing.unit,
      stock: sanitized.stock,
      vat: sanitized.vat,
    });
    await env.DB.prepare(
      "UPDATE products SET cat=?, price=?, price2=?, price3=?, unit=?, stock=?, vat=? WHERE id=?"
    ).bind(merged.cat, merged.price, merged.price2, merged.price3, merged.unit, merged.stock, merged.vat, existing.id).run();
    return { product: merged, action: "updated" };
  }
  const product = await insertProduct(env, item);
  return { product: product, action: "created" };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    const method = request.method;

    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (path === "/products" && method === "GET") {
      const { results } = await env.DB.prepare("SELECT * FROM products").all();
      return json(results);
    }

    if (path === "/products" && method === "POST") {
      if (!requireAdmin(request, env)) return json({ error: "unauthorized" }, 401);
      let body;
      try { body = await request.json(); } catch (e) { return json({ error: "invalid json" }, 400); }
      const product = await insertProduct(env, body);
      return json(product, 201);
    }

    if (path === "/products/bulk" && method === "POST") {
      if (!requireAdmin(request, env)) return json({ error: "unauthorized" }, 401);
      let body;
      try { body = await request.json(); } catch (e) { return json({ error: "invalid json" }, 400); }
      if (!Array.isArray(body)) return json({ error: "expected an array" }, 400);
      const created = [];
      const updated = [];
      for (const item of body) {
        const result = await upsertProductByName(env, item);
        if (result.action === "created") created.push(result.product);
        else updated.push(result.product);
      }
      return json({ created: created, updated: updated }, 201);
    }

    const idMatch = path.match(/^\/products\/([^/]+)$/);
    if (idMatch && (method === "PUT" || method === "PATCH")) {
      if (!requireAdmin(request, env)) return json({ error: "unauthorized" }, 401);
      const id = decodeURIComponent(idMatch[1]);
      let body;
      try { body = await request.json(); } catch (e) { return json({ error: "invalid json" }, 400); }
      const existing = await env.DB.prepare("SELECT * FROM products WHERE id = ?").bind(id).first();
      if (!existing) return json({ error: "not found" }, 404);

      const merged = Object.assign({}, existing);
      ["cat", "name", "sku", "unit", "vat", "image"].forEach(function (k) {
        if (body[k] !== undefined) merged[k] = String(body[k]);
      });
      if (body.price !== undefined) merged.price = Number(body.price) || 0;
      if (body.stock !== undefined) merged.stock = Number(body.stock) || 0;
      if (body.oldPrice !== undefined) merged.oldPrice = nullableNumber(body.oldPrice);
      if (body.price2 !== undefined) merged.price2 = nullableNumber(body.price2);
      if (body.price3 !== undefined) merged.price3 = nullableNumber(body.price3);

      await env.DB.prepare(
        "UPDATE products SET cat=?, name=?, sku=?, price=?, oldPrice=?, price2=?, price3=?, unit=?, stock=?, vat=?, image=? WHERE id=?"
      ).bind(merged.cat, merged.name, merged.sku, merged.price, merged.oldPrice, merged.price2, merged.price3, merged.unit, merged.stock, merged.vat, merged.image, id).run();
      return json(merged);
    }

    if (idMatch && method === "DELETE") {
      if (!requireAdmin(request, env)) return json({ error: "unauthorized" }, 401);
      const id = decodeURIComponent(idMatch[1]);
      const res = await env.DB.prepare("DELETE FROM products WHERE id = ?").bind(id).run();
      if (!res.meta || res.meta.changes === 0) return json({ error: "not found" }, 404);
      return json({ ok: true });
    }

    return json({ error: "not found" }, 404);
  },
};
