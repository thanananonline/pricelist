// Generates a password_hash value in the exact format the Worker expects
// (worker/src/index.js: hashPassword/verifyPassword), so you can seed or
// reset an account's password via `wrangler d1 execute` without ever
// putting the plaintext password in a committed file.
//
// Usage:
//   node worker/scripts/hash-password.mjs 'your password'

const webcrypto = globalThis.crypto;
const subtle = webcrypto.subtle;
const ITERATIONS = 100000; // must match worker/src/index.js PBKDF2_ITERATIONS (Workers caps PBKDF2 at 100000)

function bufToB64Url(buf) {
  return Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function pbkdf2(password, salt, iterations) {
  const keyMaterial = await subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await subtle.deriveBits({ name: "PBKDF2", salt, iterations, hash: "SHA-256" }, keyMaterial, 256);
  return new Uint8Array(bits);
}

async function hashPassword(password) {
  const salt = webcrypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, ITERATIONS);
  return `${ITERATIONS}$${bufToB64Url(salt)}$${bufToB64Url(hash)}`;
}

const password = process.argv[2];
if (!password) {
  console.error("Usage: node worker/scripts/hash-password.mjs '<password>'");
  process.exit(1);
}

const hash = await hashPassword(password);
console.log(hash);
