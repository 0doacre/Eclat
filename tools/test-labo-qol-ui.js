/* Labo : confort de jeu. Une matière à 0 en stock se pose quand même sur l'établi (le moteur dit ce qui manque) ;
 * les métiers, outils et gestes sans recette à découvrir ne sont plus montrés, sauf celui d'une recette préparée.
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
function fixture(toutConnu) {
  const E = Core.createEngine(), s = E.state;
  s.age = 6; s.cycle = 2; s.meta.forcedDone = true; s.introSeen = true; s.flags.ver = D.VERSION;
  Object.assign(s.settings, { tuto: false, sound: false, visiteurs: false });
  for (const z of D.ZONES) s.zones[z.id] = true;
  for (const [id, it] of Object.entries(D.ITEMS)) {
    if (it.t === "res") { s.seen[id] = true; s.inv[id] = id === "bois" ? 0 : 20; }
    if (toutConnu && it.r) s.known[id] = true;
  }
  E.recalc();
  return E.serialize();
}
async function ouvre(raw) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block", reducedMotion: "reduce" }), p = await ctx.newPage(), errors = [];
  p.on("pageerror", e => errors.push(e.message));
  await p.addInitScript(r => { localStorage.setItem("eclat.save.v1", r); localStorage.setItem("eclat.style.carnet-defaut", "1"); localStorage.setItem("eclat.preview.style", "vivant"); Math.random = () => .99; }, raw);
  await p.goto("http://127.0.0.1:" + server.address().port + "/index.html");
  await p.waitForFunction(() => !!window.__eclat);
  for (let i = 0; i < 5; i++) { await p.waitForTimeout(80); await p.evaluate(() => window.__eclat.closeModal()); }
  await p.locator('#tabs [data-tab="labo"]').click(); await p.waitForTimeout(400);
  return { p, ctx, errors };
}
const choix = p => p.evaluate(() => ({ metiers: [...document.querySelectorAll(".ae-metiers button")].map(b => b.textContent.trim()), outils: [...document.querySelectorAll(".ae-outil")].map(b => b.getAttribute("aria-label")) }));
async function run() {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});

  { // matière à 0 en stock
    const { p, ctx, errors } = await ouvre(fixture(false));
    await p.locator('.ae-chip[data-ae="filtre"][data-value="tout"]').click();
    const bois = p.locator("#ae-item-bois");
    ok(await p.evaluate(() => window.__eclat.E.count("bois")) === 0, "le bois est bien à 0");
    ok(!await bois.isDisabled(), "une matière à 0 reste cliquable");
    await bois.click();
    ok((await p.locator("#ae-slot-0").textContent()).includes("Bois"), "elle se pose sur l'établi");
    await p.locator('.ae-actions [data-ae="forge"]').click(); await p.waitForTimeout(250);
    ok(/Il manque/.test(await p.locator("#ae-result").textContent()), "le moteur dit ce qui manque");
    const avant = await choix(p);
    ok(avant.metiers.length >= 4, "au début, tous les métiers ont encore à découvrir : " + avant.metiers.join(","));
    ok(!errors.length, "erreurs JS " + errors.join(";")); await ctx.close();
  }
  { // tout est connu : les outils épuisés disparaissent, sauf celui d'une recette préparée
    const { p, ctx, errors } = await ouvre(fixture(true));
    const sans = await choix(p);
    ok(!sans.outils.includes("Percuteur de pierre"), "Percuteur de pierre épuisé : masqué " + sans.outils.join(","));
    await p.evaluate(() => { const g = window.__eclat; Object.assign(g.E.state.flags.equipmentBench, { metier: "artisanat", eq: "percuteur_pierre", mode: "tailler", slots: [], prepared: "manche" }); g.render(true); });
    await p.waitForTimeout(400);
    ok((await choix(p)).outils.includes("Percuteur de pierre"), "l'outil d'une recette préparée reste affiché");
    ok(!errors.length, "erreurs JS " + errors.join(";")); await ctx.close();
  }
  console.log(checks + " contrôles du confort du Labo réussis.");
}
run().catch(e => { console.error(e); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); server.close(); });
