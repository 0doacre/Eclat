/* Tests du serveur des comptes, avec le vrai code du jeu (js/cloud.js) côté client.
 *   node --no-warnings server/test.js */
import assert from "node:assert";
import { createRequire } from "node:module";
import worker from "./worker.js";
import { localD1 } from "./d1-local.js";

const require = createRequire(import.meta.url);
const Cloud = require("../js/cloud.js");

const env = { DB: localD1(), ALLOWED_ORIGIN: "https://jeu.example" };
let ip = "1.1.1.1";
const fetchTo = async (url, o) => {
  const req = new Request(url, Object.assign({}, o, { headers: Object.assign({ origin: "https://jeu.example", "cf-connecting-ip": ip }, o.headers) }));
  return worker.fetch(req, env);
};
function memStore() { const m = {}; return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => (m[k] = String(v)), removeItem: (k) => delete m[k] }; }
const device = () => Cloud.create({ server: () => "https://comptes.example", storage: memStore(), fetch: fetchTo });

let passed = 0;
async function test(name, fn) {
  try { await fn(); passed++; console.log("  ✓ " + name); }
  catch (e) { console.log("  ✗ " + name + "\n    " + (e.stack || e)); process.exitCode = 1; }
}
const rejects = async (p, status) => { try { await p; } catch (e) { assert.strictEqual(e.status, status, e.message); return e; } assert.fail("aurait dû échouer"); };
const SAVE = JSON.stringify({ v: 3, inv: { bois: 12 }, age: 4, lore: "é à ç — ✨".repeat(200) });

console.log("Serveur des comptes");
await test("santé et CORS", async () => {
  const r = await fetchTo("https://comptes.example/api/health", { method: "GET" });
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.headers.get("access-control-allow-origin"), "https://jeu.example");
  const o = await worker.fetch(new Request("https://comptes.example/api/health", { headers: { origin: "https://pirate.example" } }), env);
  assert.strictEqual(o.headers.get("access-control-allow-origin"), null, "origine refusée");
});
await test("création de compte, envoi, récupération sur un autre appareil", async () => {
  const a = device();
  const acc = await a.register("Iris_7", "un mot de passe solide");
  assert.strictEqual(acc.pseudo, "Iris_7");
  assert.strictEqual(await a.pull(), null, "pas encore de sauvegarde");
  const r = await a.push(SAVE);
  assert.ok(r.ok && r.rev === 1);
  // le serveur ne voit que du chiffré
  const row = await env.DB.prepare("SELECT data FROM saves").first();
  assert.ok(!row.data.includes("bois") && row.data.startsWith("z:"));
  const u = await env.DB.prepare("SELECT auth FROM users").first();
  assert.ok(!u.auth.includes("solide"));
  const b = device();
  await b.login("iris_7", "un mot de passe solide"); // la casse du pseudo ne compte pas
  const p = await b.pull();
  assert.strictEqual(p.text, SAVE);
  assert.strictEqual(p.rev, 1);
});
await test("pseudo pris, mauvais mot de passe, pseudo invalide", async () => {
  await rejects(device().register("IRIS_7", "autre chose encore"), 409);
  await rejects(device().login("Iris_7", "pas le bon"), 401);
  await rejects(device().login("Inconnu", "pas le bon"), 401);
  await rejects(device().register("a", "un mot de passe"), 400);
  await rejects(device().register("<script>", "un mot de passe"), 400);
});
await test("deux appareils : pas d’écrasement silencieux", async () => {
  const a = device(), b = device();
  await a.register("Lena", "arche douze !");
  await a.push(SAVE);
  await b.login("Lena", "arche douze !");
  const pb = await b.pull();
  b.adopt(pb.rev, pb.updated);
  assert.ok((await b.push(SAVE + " ")).ok, "B envoie sa version");
  const c = await a.push(SAVE + "  ");
  assert.ok(c.conflict && c.rev === 2, "A est prévenu au lieu d’écraser");
  assert.ok((await a.push(SAVE + "  ", { force: true })).ok, "A choisit de garder la sienne");
  assert.strictEqual((await b.pull()).text, SAVE + "  ");
});
await test("changement de mot de passe : rechiffrement, anciennes sessions fermées", async () => {
  const a = device(), b = device();
  await a.register("Semeur", "premier secret");
  await a.push(SAVE);
  await b.login("Semeur", "premier secret");
  await a.changePassword("premier secret", "second secret", SAVE + "!");
  await rejects(b.pull(), 401);
  await rejects(device().login("Semeur", "premier secret"), 401);
  const c = device();
  await c.login("Semeur", "second secret");
  assert.strictEqual((await c.pull()).text, SAVE + "!");
  await rejects(a.changePassword("faux", "troisième", SAVE), 403);
});
await test("trop d’essais : blocage", async () => {
  ip = "2.2.2.2";
  await device().register("Cible", "le vrai mot");
  for (let i = 0; i < 8; i++) await rejects(device().login("Cible", "faux " + i), 401);
  await rejects(device().login("Cible", "le vrai mot"), 429);
  ip = "3.3.3.3";
  await rejects(device().login("Cible", "le vrai mot"), 429, "le pseudo reste bloqué depuis une autre adresse");
});
await test("trop de comptes depuis une même adresse", async () => {
  ip = "4.4.4.4";
  for (let i = 0; i < 5; i++) await device().register("Robot" + i, "mot de passe");
  await rejects(device().register("Robot9", "mot de passe"), 429);
});
await test("déconnexion et suppression du compte", async () => {
  ip = "5.5.5.5";
  const a = device();
  await a.register("Partant", "au revoir !!");
  await a.push(SAVE);
  const b = device();
  await b.login("Partant", "au revoir !!");
  await b.logout();
  assert.strictEqual(b.account(), null);
  await rejects(a.deleteAccount("mauvais"), 403);
  await a.deleteAccount("au revoir !!");
  await rejects(device().login("Partant", "au revoir !!"), 401);
  assert.strictEqual(await env.DB.prepare("SELECT COUNT(*) AS n FROM saves s JOIN users u ON u.id = s.user WHERE u.pseudo = 'partant'").first().then((r) => r.n), 0);
});
await test("sauvegarde trop lourde ou jeton invalide", async () => {
  ip = "6.6.6.6";
  const a = device();
  await a.register("Lourd", "mot de passe");
  const tok = a.account().token;
  const big = await fetchTo("https://comptes.example/api/save", { method: "PUT", headers: { "content-type": "application/json", authorization: "Bearer " + tok }, body: JSON.stringify({ data: "x".repeat(1100000), iv: "abc", rev: 0 }) });
  assert.strictEqual(big.status, 400);
  const bad = await fetchTo("https://comptes.example/api/save", { method: "GET", headers: { authorization: "Bearer " + "0".repeat(64) } });
  assert.strictEqual(bad.status, 401);
});
console.log(passed + " tests réussis" + (process.exitCode ? ", des échecs." : "."));
