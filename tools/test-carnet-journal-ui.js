/* Carnet rangé dans le Journal : onglet Recettes, lecture seule, renvoi vers l'Atelier du métier.
 * Playwright requis (comme test:ux). PW et CHROMIUM facultatifs. */
"use strict";
const fs = require("fs"), path = require("path"), http = require("http"), assert = require("assert/strict");
const { chromium } = require(process.env.PW || "playwright"), D = require("../js/data"), Core = require("../js/engine");
const ROOT = path.resolve(__dirname, ".."), MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".webp": "image/webp", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  const file = path.resolve(ROOT, "." + new URL(req.url, "http://localhost").pathname.replace(/\/$/, "/index.html"));
  if (!file.startsWith(ROOT + path.sep)) return res.writeHead(403).end();
  fs.readFile(file, (e, b) => { if (e) return res.writeHead(404).end(); res.setHeader("Content-Type", MIME[path.extname(file)] || "application/octet-stream"); res.end(b); });
});
let browser, checks = 0;
const ok = (v, m) => { assert.ok(v, m); checks++; };
function fixture(souvenirs) {
  const E = Core.createEngine(), s = E.state;
  s.age = 6; s.cycle = 2; s.meta.forcedDone = true; s.introSeen = true; s.flags.ver = D.VERSION;
  Object.assign(s.settings, { tuto: false, sound: false, visiteurs: false });
  for (const z of D.ZONES) s.zones[z.id] = true;
  for (const [id, it] of Object.entries(D.ITEMS)) {
    if (it.t === "res") { s.seen[id] = true; s.inv[id] = 500; }
    if (it.r && it.a <= 6 && !it.sec && !it.path) s.known[id] = true;
  }
  if (souvenirs) s.souvenirs = {};
  E.recalc();
  return E.serialize();
}
async function run() {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block", reducedMotion: "reduce" }), p = await ctx.newPage(), errors = [];
  p.on("pageerror", e => errors.push(e.message));
  await p.addInitScript(r => { localStorage.setItem("eclat.save.v1", r); localStorage.setItem("eclat.style.carnet-defaut", "1"); }, fixture());
  await p.goto("http://127.0.0.1:" + server.address().port + "/index.html");
  await p.waitForFunction(() => !!window.__eclat);
  for (let i = 0; i < 5; i++) { await p.waitForTimeout(80); await p.evaluate(() => window.__eclat.closeModal()); }
  ok(await p.locator('#tabs [data-tab="journal"]').isVisible(), "l'onglet Journal est là dès qu'on connaît des recettes");
  ok(await p.locator('#tabs [data-tab="atelier"] ~ * , #tabs [data-tab="atelier"]').count() > 0, "l'Atelier est toujours là");
  await p.locator('#tabs [data-tab="journal"]').click(); await p.waitForTimeout(400);
  ok(await p.evaluate(() => window.__eclat.U.tab) === "carnet", "le Journal sans histoire s'ouvre sur les Recettes");
  ok(await p.locator('#tabs [data-tab="journal"].on').count() === 1, "l'onglet Journal reste allumé");
  ok((await p.locator("#v-carnet .journal-sw").textContent()).includes("Recettes"), "la rangée d'onglets du Journal porte « Recettes »");
  ok(await p.locator("#v-carnet [data-cr]").count() === 0, "plus de bouton Fabriquer dans le Carnet");
  ok(await p.locator("#v-carnet [data-aller]").count() > 0, "chaque recette renvoie à l'Atelier");
  ok(await p.locator('#v-atelier .subtabs [data-tab2="carnet"]').count() === 0, "l'Atelier n'a plus le Carnet dans ses onglets");
  const id = await p.locator("#v-carnet [data-aller]").first().getAttribute("data-aller");
  const metier = await p.evaluate((i) => window.__eclat.E.atelierDe(i), id);
  await p.locator("#v-carnet [data-aller]").first().click(); await p.waitForTimeout(500);
  ok(await p.evaluate(() => window.__eclat.U.tab) === "atelier", "le bouton ouvre l'Atelier");
  ok(await p.evaluate(() => window.__eclat.U.atelierSel) === metier, "sur le métier de la recette : " + metier);
  await p.locator('#tabs [data-tab="journal"]').click(); await p.waitForTimeout(300);
  await p.evaluate(() => { const g = window.__eclat; g.E.state.frags = g.E.state.frags || {}; });
  await p.locator("#menuBtn").click(); await p.waitForTimeout(500);
  const href = await p.locator("#m-ecrire").getAttribute("href");
  ok(href && href.startsWith("mailto:") && href.includes("Version"), "le menu propose « Nous écrire » avec la version dans le message : " + href);
  ok(!errors.length, "erreurs JS " + errors.join(";"));
  await ctx.close();
  { // après une relève : le Carnet se relit âge par âge
    const c2 = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block", reducedMotion: "reduce" }), q = await c2.newPage(), err2 = [];
    q.on("pageerror", e => err2.push(e.message));
    await q.addInitScript(r => { localStorage.setItem("eclat.save.v1", r); localStorage.setItem("eclat.style.carnet-defaut", "1"); }, fixture(true));
    await q.goto("http://127.0.0.1:" + server.address().port + "/index.html");
    await q.waitForFunction(() => !!window.__eclat);
    for (let i = 0; i < 5; i++) { await q.waitForTimeout(80); await q.evaluate(() => window.__eclat.closeModal()); }
    await q.locator('#tabs [data-tab="atelier"]').click(); await q.waitForTimeout(400);
    ok(await q.locator("#v-atelier .souvenir-note").count() === 1, "l'Atelier dit que des recettes reviendront en relisant le Carnet");
    await q.locator('#v-atelier .souvenir-note [data-tab2="carnet"]').click(); await q.waitForTimeout(400);
    ok(await q.locator("#v-carnet .carnet-retrouve").count() === 1, "le Carnet s'ouvre sur « Tu retrouves ton carnet »");
    const fermes = await q.locator("#v-carnet .age-oubli").count();
    ok(fermes >= 3, "les âges sont fermés : " + fermes);
    ok(await q.locator("#v-carnet .rec").count() === 0, "aucune recette avant d'avoir relu");
    await q.locator("#v-carnet .age-oubli [data-souvenir]").first().click(); await q.waitForTimeout(400);
    ok(await q.locator("#v-carnet .age-oubli").count() === fermes - 1, "relire un âge l'ouvre");
    ok(await q.locator("#v-carnet .souvenir-texte").count() >= 1, "la phrase de l'âge s'affiche");
    await q.locator('#v-carnet [data-souvenir="tout"]').click(); await q.waitForTimeout(400);
    ok(await q.locator("#v-carnet .age-oubli").count() === 0 && await q.locator("#v-carnet .carnet-retrouve").count() === 0, "tout relire ouvre tout et retire le bandeau");
    await q.locator('#tabs [data-tab="atelier"]').click(); await q.waitForTimeout(300);
    ok(await q.locator("#v-atelier .souvenir-note").count() === 0, "plus de note à l'Atelier");
    ok(!err2.length, "erreurs JS " + err2.join(";"));
    await c2.close();
  }
  console.log(checks + " contrôles du Carnet dans le Journal réussis.");
}
run().catch(e => { console.error(e); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); server.close(); });
