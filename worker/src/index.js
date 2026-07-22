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

function sanitizeProduct(body) {
  return {
    cat: String(body.cat || ""),
    name: String(body.name || "").trim(),
    sku: String(body.sku || "").trim(),
    price: Number(body.price) || 0,
    oldPrice: (body.oldPrice === null || body.oldPrice === undefined || body.oldPrice === "") ? null : Number(body.oldPrice),
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
    "INSERT INTO products (id, cat, name, sku, price, oldPrice, unit, stock, vat, image) VALUES (?,?,?,?,?,?,?,?,?,?)"
  ).bind(p.id, p.cat, p.name, p.sku, p.price, p.oldPrice, p.unit, p.stock, p.vat, p.image).run();
  return p;
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
      for (const item of body) {
        created.push(await insertProduct(env, item));
      }
      return json(created, 201);
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
      if (body.oldPrice !== undefined) {
        merged.oldPrice = (body.oldPrice === null || body.oldPrice === "") ? null : Number(body.oldPrice);
      }

      await env.DB.prepare(
        "UPDATE products SET cat=?, name=?, sku=?, price=?, oldPrice=?, unit=?, stock=?, vat=?, image=? WHERE id=?"
      ).bind(merged.cat, merged.name, merged.sku, merged.price, merged.oldPrice, merged.unit, merged.stock, merged.vat, merged.image, id).run();
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
