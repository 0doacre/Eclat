/* Atelier : la section À construire de chaque métier (outils, stations, améliorations, extracteurs, machines).
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
function fixture() {
  const E = Core.createEngine(), s = E.state;
  s.age = 6; s.cycle = 2; s.meta.forcedDone = true; s.introSeen = true; s.flags.ver = D.VERSION;
  Object.assign(s.settings, { tuto: false, sound: false, visiteurs: false });
  for (const z of D.ZONES) s.zones[z.id] = true;
  for (const [id, it] of Object.entries(D.ITEMS)) {
    if (it.t === "res") { s.seen[id] = true; s.inv[id] = 500; }
    if (it.r && it.a <= 6 && !it.sec && !it.path) s.known[id] = true;
  }
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
  await p.evaluate(() => { const g = window.__eclat; g.U.atelierSel = "construction"; g.U.prodSel = null; });
  await p.locator('#tabs [data-tab="atelier"]').click(); await p.waitForTimeout(500);
  if (process.env.DBG) console.log(await p.evaluate(() => ({ tab: window.__eclat.U.tab, sel: window.__eclat.U.atelierSel, h: document.querySelector("#v-atelier").innerText.slice(0, 1500) })));
  ok(await p.locator('#v-atelier [data-construiresheet="1"]').count() === 1, "le métier donne accès à À construire");
  await p.locator('#v-atelier [data-construiresheet="1"]').click();
  ok(await p.locator('#v-atelier .auto-feuille[aria-label="À construire"] .a-construire').count() === 1, "la feuille À construire s'ouvre");
  const n = await p.locator(".a-construire-ligne").count();
  ok(n > 0, "des chantiers sont listés (" + n + ")");
  ok(await p.locator('.a-construire-ligne [data-cr]').count() > 0, "chaque chantier a un bouton de construction");
  const verbes = await p.locator(".a-construire-ligne .btn.pri").allTextContents();
  ok(verbes.some(t => /Construire/.test(t)), "le verbe est « Construire » : " + verbes.slice(0, 3).join(","));
  // la page du métier se lit de haut en bas : aucun bloc ne recouvre le suivant (0.65.4)
  ok(await p.locator("#v-atelier .prod .a-construire").count() === 0, "la liste reste dans sa feuille");
  const recouvre = await p.evaluate(() => { const kids = [...document.querySelectorAll("#v-atelier .prod > *")].filter((e) => e.getBoundingClientRect().height > 0 && getComputedStyle(e).position !== "fixed"); const bad = []; for (let i = 0; i + 1 < kids.length; i++) { const a = kids[i].getBoundingClientRect(), b = kids[i + 1].getBoundingClientRect(); if (a.bottom > b.top + 2) bad.push(kids[i].className + " > " + kids[i + 1].className); } return bad; });
  ok(recouvre.length === 0, "aucun bloc de la page du métier n'en recouvre un autre : " + recouvre.join(" ; "));
  const cible = await p.evaluate(() => { const g = window.__eclat; return [...document.querySelectorAll(".a-construire-ligne")].map(e => e.dataset.construire).find(id => g.E.orderStatus(id, 1).ok && !g.E.isScaled(g.E.item(id))); });
  if (cible) {
    await p.locator('.a-construire-ligne[data-construire="' + cible + '"] [data-cr][data-n="1"]').first().click(); await p.waitForTimeout(600);
    ok(await p.evaluate((id) => !!(window.__eclat.E.queued(id) || window.__eclat.E.state.made[id]), cible), "un appui construit " + cible);
  }
  const feuille = p.locator('#v-atelier .auto-feuille[aria-label="À construire"]');
  const avant = await feuille.locator('.auto-tete').boundingBox();
  await feuille.locator('.auto-corps').evaluate(e => { e.scrollTop = e.scrollHeight; });
  const apres = await feuille.locator('.auto-tete').boundingBox();
  ok(avant && apres && Math.abs(avant.y - apres.y) < 1, "le titre reste fixe pendant le défilement");
  await feuille.locator('[data-construiresheet="0"]').click();
  ok(await feuille.count() === 0, "la feuille se ferme");
  ok(!errors.length, "erreurs JS " + errors.join(";"));
  await ctx.close();
  console.log(checks + " contrôles des À construire réussis.");
}
run().catch(e => { console.error(e); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); server.close(); });
