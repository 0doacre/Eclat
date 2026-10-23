/* Tests du serveur des comptes, avec le vrai code du jeu (js/cloud.js) côté client.
 *   node --no-warnings server/test.js */
import assert from "node:assert";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
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
await test("trois emplacements par compte, indépendants", async () => {
  ip = "7.7.7.7";
  const a = device();
  await a.register("Trois", "mot de passe");
  assert.ok((await a.push(SAVE)).ok, "sans précision, l’emplacement 1");
  const r2 = await a.push(SAVE + "2", { slot: 2 });
  assert.ok(r2.ok && r2.slot === 2 && r2.rev === 1);
  assert.ok((await a.push(SAVE + "3", { slot: 3 })).ok);
  const list = await a.slots();
  assert.deepStrictEqual(list.map((x) => x.slot), [1, 2, 3]);
  assert.strictEqual(list[0].rev, 1, "l’emplacement 2 ne touche pas au 1");
  assert.strictEqual((await a.pull()).text, SAVE, "pull() lit l’emplacement actif");
  assert.strictEqual((await a.pull(2)).text, SAVE + "2");
  assert.strictEqual((await a.pull(3)).text, SAVE + "3");
  const anon = await fetchTo("https://comptes.example/api/saves", { method: "GET" });
  assert.strictEqual(anon.status, 401, "la liste demande une session");
  await rejects(a.push(SAVE, { slot: 4 }), 400);
  await rejects(a.push(SAVE, { slot: 0 }), 400);
  const b = device();
  await b.login("Trois", "mot de passe");
  assert.deepStrictEqual((await b.slots()).map((x) => x.slot), [1, 2, 3], "un autre appareil voit les trois");
  assert.strictEqual((await b.pull(3)).text, SAVE + "3");
  await a.erase(3);
  assert.deepStrictEqual((await a.slots()).map((x) => x.slot), [1, 2]);
  assert.strictEqual(await a.pull(3), null);
  assert.ok((await a.push(SAVE + "3 bis", { slot: 3 })).ok, "un emplacement vidé peut resservir");
});
await test("l’emplacement actif reçoit les envois", async () => {
  ip = "9.9.9.9";
  const a = device();
  await a.register("Actif", "mot de passe");
  await a.push(SAVE);
  a.useSlot(2);
  const r = await a.push(SAVE + " actif");
  assert.strictEqual(r.slot, 2);
  assert.strictEqual((await a.pull(1)).text, SAVE);
  assert.strictEqual((await a.pull(2)).text, SAVE + " actif");
  assert.strictEqual((await a.pull()).text, SAVE + " actif", "pull() suit l’emplacement actif");
});
await test("changement de mot de passe : les trois emplacements sont rechiffrés", async () => {
  ip = "10.10.10.10";
  const a = device();
  await a.register("Triple", "premier secret");
  await a.push(SAVE);
  await a.push(SAVE + "2", { slot: 2 });
  await a.push(SAVE + "3", { slot: 3 });
  await a.changePassword("premier secret", "second secret", SAVE + "!");
  const b = device();
  await b.login("Triple", "second secret");
  assert.strictEqual((await b.pull(1)).text, SAVE + "!");
  assert.strictEqual((await b.pull(2)).text, SAVE + "2");
  assert.strictEqual((await b.pull(3)).text, SAVE + "3");
  await rejects(device().login("Triple", "premier secret"), 401);
});
await test("serveur pas encore mis à jour : la connexion marche encore", async () => {
  ip = "11.11.11.11";
  // imitation d’un serveur d’avant les emplacements : pas de /api/saves, une seule sauvegarde
  const oldFetch = async (url, o) => {
    const u = new URL(url);
    if (u.pathname === "/api/saves") return new Response(JSON.stringify({ error: "route" }), { status: 404 });
    const opts = Object.assign({}, o);
    if (o.body && (u.pathname === "/api/save" || u.pathname === "/api/password")) {
      const b = JSON.parse(o.body);
      delete b.slot;
      if (u.pathname === "/api/password") delete b.saves;
      opts.body = JSON.stringify(b);
    }
    return fetchTo(u.origin + u.pathname, opts);
  };
  const dev = () => Cloud.create({ server: () => "https://comptes.example", storage: memStore(), fetch: oldFetch });
  const a = dev();
  await a.register("Ancien", "mot de passe");
  await a.push(SAVE);
  assert.deepStrictEqual((await a.slots()).map((x) => x.slot), [1]);
  assert.ok(a.account().legacy, "le jeu sait qu’il parle à l’ancien serveur");
  await a.changePassword("mot de passe", "autre secret", SAVE + "!");
  const b = dev();
  await b.login("Ancien", "autre secret");
  assert.strictEqual((await b.slots()).length, 1);
  assert.strictEqual((await b.pull(1)).text, SAVE + "!", "la sauvegarde a bien été rechiffrée");
});
await test("migration d’une base à une seule sauvegarde", async () => {
  const db = new DatabaseSync(":memory:");
  db.exec("CREATE TABLE users (id INTEGER PRIMARY KEY, pseudo TEXT, display TEXT, auth TEXT, salt TEXT, created INTEGER);" +
    "CREATE TABLE saves (user INTEGER PRIMARY KEY, data TEXT NOT NULL, iv TEXT NOT NULL, rev INTEGER NOT NULL, updated INTEGER NOT NULL);");
  db.exec("INSERT INTO users VALUES (1, 'vieux', 'Vieux', 'a', 's', 0)");
  db.exec("INSERT INTO saves VALUES (1, 'z:ancien', 'iv0', 4, 123)");
  db.exec(readFileSync(new URL("./migration-2.sql", import.meta.url), "utf8"));
  const rows = db.prepare("SELECT user, slot, data, iv, rev, updated FROM saves").all().map((r) => Object.assign({}, r));
  assert.deepStrictEqual(rows, [{ user: 1, slot: 1, data: "z:ancien", iv: "iv0", rev: 4, updated: 123 }], "la partie existante devient l’emplacement 1");
  db.exec("INSERT INTO saves VALUES (1, 2, 'z:deux', 'iv1', 1, 456)");
  assert.strictEqual(db.prepare("SELECT COUNT(*) AS n FROM saves WHERE user = 1").get().n, 2);
  assert.throws(() => db.exec("INSERT INTO saves VALUES (1, 4, 'z:x', 'iv', 1, 1)"), "un quatrième emplacement est refusé");
});
console.log(passed + " tests réussis" + (process.exitCode ? ", des échecs." : "."));
