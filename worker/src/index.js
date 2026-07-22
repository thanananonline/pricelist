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

function sizeLabelFor(bytes) {
  const kb = bytes / 1024;
  return kb > 1024 ? (kb / 1024).toFixed(1) + " MB" : kb.toFixed(0) + " KB";
}

async function loadFolders(env, kind) {
  const foldersRes = await env.DB.prepare("SELECT * FROM folders WHERE kind = ?").bind(kind).all();
  const filesRes = await env.DB.prepare("SELECT * FROM files WHERE kind = ?").bind(kind).all();
  const filesByFolder = {};
  filesRes.results.forEach(function (f) {
    if (!filesByFolder[f.folder_id]) filesByFolder[f.folder_id] = [];
    filesByFolder[f.folder_id].push({ id: f.id, name: f.name, sizeLabel: f.size_label });
  });
  return foldersRes.results.map(function (f) {
    return { id: f.id, name: f.name, files: filesByFolder[f.id] || [] };
  });
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

    if (path === "/folders" && method === "GET") {
      const kind = url.searchParams.get("kind");
      if (!kind) return json({ error: "kind is required" }, 400);
      const folders = await loadFolders(env, kind);
      return json(folders);
    }

    if (path === "/folders" && method === "POST") {
      if (!requireAdmin(request, env)) return json({ error: "unauthorized" }, 401);
      let body;
      try { body = await request.json(); } catch (e) { return json({ error: "invalid json" }, 400); }
      const kind = String(body.kind || "");
      const name = String(body.name || "").trim();
      if (!kind || !name) return json({ error: "kind and name are required" }, 400);
      const id = genId();
      await env.DB.prepare("INSERT INTO folders (id, kind, name) VALUES (?,?,?)").bind(id, kind, name).run();
      return json({ id: id, name: name, files: [] }, 201);
    }

    const folderIdMatch = path.match(/^\/folders\/([^/]+)$/);
    if (folderIdMatch && method === "DELETE") {
      if (!requireAdmin(request, env)) return json({ error: "unauthorized" }, 401);
      const id = decodeURIComponent(folderIdMatch[1]);
      const filesRes = await env.DB.prepare("SELECT * FROM files WHERE folder_id = ?").bind(id).all();
      for (const f of filesRes.results) {
        await env.FILES.delete(f.r2_key);
      }
      await env.DB.prepare("DELETE FROM files WHERE folder_id = ?").bind(id).run();
      const res = await env.DB.prepare("DELETE FROM folders WHERE id = ?").bind(id).run();
      if (!res.meta || res.meta.changes === 0) return json({ error: "not found" }, 404);
      return json({ ok: true });
    }

    if (path === "/files" && method === "POST") {
      if (!requireAdmin(request, env)) return json({ error: "unauthorized" }, 401);
      let form;
      try { form = await request.formData(); } catch (e) { return json({ error: "invalid form data" }, 400); }
      const file = form.get("file");
      const folderId = String(form.get("folderId") || "");
      const kind = String(form.get("kind") || "");
      if (!file || !folderId || !kind) return json({ error: "file, folderId, kind are required" }, 400);
      const folder = await env.DB.prepare("SELECT id FROM folders WHERE id = ?").bind(folderId).first();
      if (!folder) return json({ error: "folder not found" }, 404);
      const id = genId();
      const r2Key = kind + "/" + folderId + "/" + id;
      await env.FILES.put(r2Key, file.stream(), { httpMetadata: { contentType: file.type || "application/pdf" } });
      const sizeLabel = sizeLabelFor(file.size);
      const name = file.name || "document.pdf";
      await env.DB.prepare(
        "INSERT INTO files (id, folder_id, kind, name, size_label, r2_key) VALUES (?,?,?,?,?,?)"
      ).bind(id, folderId, kind, name, sizeLabel, r2Key).run();
      return json({ id: id, name: name, sizeLabel: sizeLabel }, 201);
    }

    const fileIdMatch = path.match(/^\/files\/([^/]+)$/);
    if (fileIdMatch && method === "DELETE") {
      if (!requireAdmin(request, env)) return json({ error: "unauthorized" }, 401);
      const id = decodeURIComponent(fileIdMatch[1]);
      const row = await env.DB.prepare("SELECT * FROM files WHERE id = ?").bind(id).first();
      if (!row) return json({ error: "not found" }, 404);
      await env.FILES.delete(row.r2_key);
      await env.DB.prepare("DELETE FROM files WHERE id = ?").bind(id).run();
      return json({ ok: true });
    }

    if (fileIdMatch && method === "GET") {
      const id = decodeURIComponent(fileIdMatch[1]);
      const row = await env.DB.prepare("SELECT * FROM files WHERE id = ?").bind(id).first();
      if (!row) return json({ error: "not found" }, 404);
      const obj = await env.FILES.get(row.r2_key);
      if (!obj) return json({ error: "file content not found" }, 404);
      const dl = url.searchParams.get("dl") === "1";
      return new Response(obj.body, {
        status: 200,
        headers: Object.assign({
          "Content-Type": "application/pdf",
          "Content-Disposition": (dl ? "attachment" : "inline") + "; filename*=UTF-8''" + encodeURIComponent(row.name),
          "Cache-Control": "public, max-age=31536000",
        }, CORS_HEADERS),
      });
    }

    return json({ error: "not found" }, 404);
  },
};
