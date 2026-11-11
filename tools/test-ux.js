/* R4 (docs/REFONTE-ECRANS-0-39.md) : les vues principales (Terres, Labo, Atelier) tiennent dans la hauteur disponible,
 * à deux tailles de téléphone, sur une partie à l'âge 1, 5 et 9. Elles ne débordent pas non plus en largeur.
 * Playwright requis. PW et CHROMIUM facultatifs. L'ancien parcours (avant la refonte 0.39) est dans tools/test-ux-avant-0-39.js. */
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
const AGES = [0, 4, 8], TAILLES = [[390, 844], [320, 568]], VERBOSE = !!process.env.UX_VERBOSE;
/* Ce que chaque vue déborde en hauteur, en pixels, mesuré le 1er novembre 2026 (0.65.4). La règle R1 voudrait 0 partout ; le Labo défile encore
 * (l'établi, ses boutons et le résultat dépassent d'un écran de téléphone). Les Terres sont un écran fixe depuis novembre 2026 (voir tools/test-terres-fixe-ui.js). Ces plafonds empêchent d'empirer ;
 * les baisser à mesure que les écrans sont resserrés. Aperçu sobriété (0.66) : le Labo tient dans 390 × 844, la page d'un métier tient presque dans un écran. */
const PLAFOND = { "390x844": { Terres: 0, Labo: 0, Atelier: 0, Métier: 60 }, "320x568": { Terres: 0, Labo: 270, Atelier: 0, Métier: 400 } };
/* une partie à l'âge donné : les recettes des âges atteints sont connues, des ressources en réserve */
function partie(age) {
  const E = Core.createEngine(), s = E.state;
  s.age = age; s.cycle = 1; s.meta.forcedDone = true; s.introSeen = true; s.flags.ver = D.VERSION; s.stats.crafts = 5;
  Object.assign(s.settings, { tuto: false, sound: false, visiteurs: false });
  for (const z of D.ZONES) if (D.ITEMS && (age >= 4 || ["lisiere", "plaine"].includes(z.id))) s.zones[z.id] = true;
  for (const [id, it] of Object.entries(D.ITEMS)) {
    if (it.t === "res" && it.a <= age) { s.seen[id] = true; s.inv[id] = 40; }
    if (it.r && it.a <= age && !it.sec && !it.path) { s.known[id] = true; s.made[id] = 1; }
  }
  E.recalc(); return E.serialize();
}
const MESURE = () => {
  const v = document.querySelector(".view.on"), vs = document.querySelector("#views");
  return { id: v.id, vue: v.scrollHeight - v.clientHeight, vues: vs.scrollHeight - vs.clientHeight, largeur: document.documentElement.scrollWidth - innerWidth };
};
async function run() {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const url = "http://127.0.0.1:" + server.address().port + "/index.html";
  for (const [w, h] of TAILLES) for (const age of AGES) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true, serviceWorkers: "block", reducedMotion: "reduce" }), p = await ctx.newPage(), errors = [];
    p.on("pageerror", e => errors.push(e.message));
    await p.addInitScript(r => { localStorage.setItem("eclat.save.v1", r); localStorage.setItem("eclat.style.carnet-defaut", "1"); }, partie(age));
    await p.goto(url); await p.waitForFunction(() => !!window.__eclat);
    for (let i = 0; i < 6; i++) { await p.waitForTimeout(80); await p.evaluate(() => window.__eclat.closeModal()); }
    for (const [tab, nom] of [["domaine", "Terres"], ["labo", "Labo"], ["atelier", "Atelier"], ["atelier", "Métier"]]) {
      await p.evaluate((m) => { const g = window.__eclat; g.U.atelierSel = m ? "artisanat" : null; g.U.prodSel = null; }, nom === "Métier");
      await p.locator('#tabs [data-tab="' + tab + '"]').click(); await p.waitForTimeout(450);
      const m = await p.evaluate(MESURE), tag = w + "x" + h + " · âge " + (age + 1) + " · " + nom;
      if (VERBOSE) console.log(tag, JSON.stringify(m));
      ok(m.largeur <= 0, tag + " : débordement en largeur de " + m.largeur + " px");
      const max = PLAFOND[w + "x" + h][nom];
      ok(Math.max(m.vue, m.vues) <= max + 1, tag + " : la vue défile de " + Math.max(m.vue, m.vues) + " px (plafond " + max + ")");
    }
    ok(!errors.length, w + " âge " + (age + 1) + " : erreurs JS " + errors.join(";"));
    await ctx.close();
  }
  console.log(checks + " contrôles de tenue des vues réussis.");
}
run().catch(e => { console.error(e); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); server.close(); });
