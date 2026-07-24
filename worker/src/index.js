const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-migration-key",
};

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const PBKDF2_ITERATIONS = 210000;

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

/* ---- crypto helpers ---- */

function bufToB64Url(buf) {
  var bytes = new Uint8Array(buf);
  var bin = "";
  for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64UrlToBuf(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  var bin = atob(str);
  var bytes = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  var diff = 0;
  for (var i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function pbkdf2(password, salt, iterations) {
  var keyMaterial = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  var bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt, iterations: iterations, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return new Uint8Array(bits);
}

async function hashPassword(password) {
  var salt = crypto.getRandomValues(new Uint8Array(16));
  var hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
  return PBKDF2_ITERATIONS + "$" + bufToB64Url(salt) + "$" + bufToB64Url(hash);
}

async function verifyPassword(password, stored) {
  if (!stored || typeof stored !== "string") return false;
  var parts = stored.split("$");
  if (parts.length !== 3) return false;
  var iterations = parseInt(parts[0], 10);
  if (!iterations) return false;
  var salt = b64UrlToBuf(parts[1]);
  var expected = b64UrlToBuf(parts[2]);
  var actual = await pbkdf2(password, salt, iterations);
  return timingSafeEqual(actual, expected);
}

async function hmacSign(data, secret) {
  var key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  var sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return bufToB64Url(sig);
}

async function createSessionToken(env, username, role) {
  var payload = { u: username, r: role, exp: Date.now() + SESSION_TTL_MS };
  var data = bufToB64Url(new TextEncoder().encode(JSON.stringify(payload)));
  var sig = await hmacSign(data, env.SESSION_SECRET);
  return data + "." + sig;
}

async function verifySessionToken(token, env) {
  if (!token || typeof token !== "string") return null;
  var dot = token.lastIndexOf(".");
  if (dot === -1) return null;
  var data = token.slice(0, dot);
  var sig = token.slice(dot + 1);
  var expectedSig = await hmacSign(data, env.SESSION_SECRET);
  if (!timingSafeEqual(b64UrlToBuf(sig), b64UrlToBuf(expectedSig))) return null;
  var payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(b64UrlToBuf(data)));
  } catch (e) {
    return null;
  }
  if (!payload || typeof payload.exp !== "number" || Date.now() > payload.exp) return null;
  return payload;
}

async function getSession(request, env) {
  var auth = request.headers.get("Authorization") || "";
  var m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  return await verifySessionToken(m[1], env);
}

async function requireAuth(request, env) {
  return await getSession(request, env);
}

// Re-checks against D1 (not just the token) so a role change/deletion takes
// effect immediately instead of waiting out the token's 30-day lifetime.
async function requireAdmin(request, env) {
  var session = await getSession(request, env);
  if (!session) return null;
  var row = await env.DB.prepare("SELECT username, role FROM users WHERE username = ?").bind(session.u).first();
  if (!row || row.role !== "admin") return null;
  return row;
}

function publicUser(row) {
  return { username: row.username, role: row.role };
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

    /* ---- auth ---- */

    if (path === "/auth/login" && method === "POST") {
      let body;
      try { body = await request.json(); } catch (e) { return json({ error: "invalid json" }, 400); }
      const username = String(body.username || "").trim();
      const password = String(body.password || "");
      if (!username || !password) return json({ error: "username and password are required" }, 400);
      const row = await env.DB.prepare("SELECT * FROM users WHERE username = ?").bind(username).first();
      const ok = row && await verifyPassword(password, row.password_hash);
      if (!ok) return json({ error: "invalid username or password" }, 401);
      const token = await createSessionToken(env, row.username, row.role);
      return json({ token: token, username: row.username, role: row.role });
    }

    if (path === "/auth/register" && method === "POST") {
      let body;
      try { body = await request.json(); } catch (e) { return json({ error: "invalid json" }, 400); }
      const username = String(body.username || "").trim();
      const password = String(body.password || "");
      if (!username || !password) return json({ error: "username and password are required" }, 400);
      if (password.length < 4) return json({ error: "password must be at least 4 characters" }, 400);
      const existing = await env.DB.prepare("SELECT username FROM users WHERE username = ?").bind(username).first();
      if (existing) return json({ error: "username already exists" }, 409);
      const passwordHash = await hashPassword(password);
      const role = "viewer"; // self-registration can never grant admin
      await env.DB.prepare("INSERT INTO users (username, password_hash, role) VALUES (?,?,?)").bind(username, passwordHash, role).run();
      const token = await createSessionToken(env, username, role);
      return json({ token: token, username: username, role: role }, 201);
    }

    if (path === "/auth/me" && method === "GET") {
      const session = await requireAuth(request, env);
      if (!session) return json({ error: "unauthorized" }, 401);
      const row = await env.DB.prepare("SELECT username, role FROM users WHERE username = ?").bind(session.u).first();
      if (!row) return json({ error: "unauthorized" }, 401);
      return json(publicUser(row));
    }

    // One-time helper to migrate legacy plaintext `password` values into
    // `password_hash` after `ALTER TABLE users ADD COLUMN password_hash TEXT`.
    // Guarded by a secret set only for the duration of the migration; no-ops
    // once the legacy column no longer has anything left to migrate.
    if (path === "/internal/migrate-passwords" && method === "POST") {
      const key = request.headers.get("x-migration-key");
      if (!key || !env.MIGRATION_KEY || key !== env.MIGRATION_KEY) return json({ error: "not found" }, 404);
      let rows;
      try {
        rows = (await env.DB.prepare("SELECT username, password FROM users WHERE password IS NOT NULL AND (password_hash IS NULL OR password_hash = '')").all()).results;
      } catch (e) {
        return json({ migrated: 0, note: "legacy password column not present (already migrated?)" });
      }
      let migrated = 0;
      for (const row of rows) {
        const hash = await hashPassword(row.password);
        await env.DB.prepare("UPDATE users SET password_hash = ? WHERE username = ?").bind(hash, row.username).run();
        migrated++;
      }
      let columnDropped = false;
      try {
        await env.DB.prepare("ALTER TABLE users DROP COLUMN password").run();
        columnDropped = true;
      } catch (e) {
        // older SQLite/D1 versions may not support DROP COLUMN; drop it manually if so.
      }
      return json({ migrated: migrated, columnDropped: columnDropped });
    }

    if (path === "/products" && method === "GET") {
      const { results } = await env.DB.prepare("SELECT * FROM products").all();
      return json(results);
    }

    if (path === "/products" && method === "POST") {
      if (!(await requireAdmin(request, env))) return json({ error: "unauthorized" }, 401);
      let body;
      try { body = await request.json(); } catch (e) { return json({ error: "invalid json" }, 400); }
      const product = await insertProduct(env, body);
      return json(product, 201);
    }

    if (path === "/products/bulk" && method === "POST") {
      if (!(await requireAdmin(request, env))) return json({ error: "unauthorized" }, 401);
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
      if (!(await requireAdmin(request, env))) return json({ error: "unauthorized" }, 401);
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
      if (!(await requireAdmin(request, env))) return json({ error: "unauthorized" }, 401);
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
      if (!(await requireAdmin(request, env))) return json({ error: "unauthorized" }, 401);
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
      if (!(await requireAdmin(request, env))) return json({ error: "unauthorized" }, 401);
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
      if (!(await requireAdmin(request, env))) return json({ error: "unauthorized" }, 401);
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
      if (!(await requireAdmin(request, env))) return json({ error: "unauthorized" }, 401);
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

    if (path === "/contacts" && method === "GET") {
      const { results } = await env.DB.prepare("SELECT * FROM contacts").all();
      return json(results);
    }

    if (path === "/contacts" && method === "POST") {
      if (!(await requireAdmin(request, env))) return json({ error: "unauthorized" }, 401);
      let body;
      try { body = await request.json(); } catch (e) { return json({ error: "invalid json" }, 400); }
      const contact = {
        id: genId(),
        name: String(body.name || "").trim(),
        department: String(body.department || "").trim(),
        phone: String(body.phone || "").trim(),
        address: String(body.address || "").trim(),
      };
      if (!contact.name || !contact.phone) return json({ error: "name and phone are required" }, 400);
      await env.DB.prepare(
        "INSERT INTO contacts (id, name, department, phone, address) VALUES (?,?,?,?,?)"
      ).bind(contact.id, contact.name, contact.department, contact.phone, contact.address).run();
      return json(contact, 201);
    }

    const contactIdMatch = path.match(/^\/contacts\/([^/]+)$/);
    if (contactIdMatch && method === "DELETE") {
      if (!(await requireAdmin(request, env))) return json({ error: "unauthorized" }, 401);
      const id = decodeURIComponent(contactIdMatch[1]);
      const res = await env.DB.prepare("DELETE FROM contacts WHERE id = ?").bind(id).run();
      if (!res.meta || res.meta.changes === 0) return json({ error: "not found" }, 404);
      return json({ ok: true });
    }

    if (path === "/users" && method === "GET") {
      if (!(await requireAuth(request, env))) return json({ error: "unauthorized" }, 401);
      const { results } = await env.DB.prepare("SELECT username, role FROM users").all();
      return json(results.map(publicUser));
    }

    if (path === "/users" && method === "POST") {
      if (!(await requireAdmin(request, env))) return json({ error: "unauthorized" }, 401);
      let body;
      try { body = await request.json(); } catch (e) { return json({ error: "invalid json" }, 400); }
      const username = String(body.username || "").trim();
      const password = String(body.password || "");
      const role = body.role === "admin" ? "admin" : "viewer";
      if (!username || !password) return json({ error: "username and password are required" }, 400);
      if (password.length < 4) return json({ error: "password must be at least 4 characters" }, 400);
      const existing = await env.DB.prepare("SELECT username FROM users WHERE username = ?").bind(username).first();
      if (existing) return json({ error: "username already exists" }, 409);
      const passwordHash = await hashPassword(password);
      await env.DB.prepare("INSERT INTO users (username, password_hash, role) VALUES (?,?,?)").bind(username, passwordHash, role).run();
      return json({ username: username, role: role }, 201);
    }

    const userIdMatch = path.match(/^\/users\/([^/]+)$/);
    if (userIdMatch && method === "DELETE") {
      if (!(await requireAdmin(request, env))) return json({ error: "unauthorized" }, 401);
      const username = decodeURIComponent(userIdMatch[1]);
      const res = await env.DB.prepare("DELETE FROM users WHERE username = ?").bind(username).run();
      if (!res.meta || res.meta.changes === 0) return json({ error: "not found" }, 404);
      return json({ ok: true });
    }

    return json({ error: "not found" }, 404);
  },
};
