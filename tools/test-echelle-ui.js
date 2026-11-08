#!/usr/bin/env node
/* L'échelle de texte (docs/GRAMMAIRE-V2.md, §5) : sur chaque écran principal, chaque texte visible a une famille, une taille et une graisse de l'échelle.
 *   PW=<dossier>/node_modules/playwright node tools/test-echelle-ui.js [--rapport]   (--rapport : liste les écarts au lieu d'échouer)
 * Famille : Alegreya Sans, ou IM Fell English pour les titres (17 px et plus). Tailles : 11, 13, 15, 17, 20, 24, 28 (tolérance 0,6 px).
 * Graisses : 400, 600, 700. Les icônes, les textes cachés et la barre d'onglets du bas ne comptent pas. */
"use strict";
const fs = require("fs"), path = require("path"), http = require("http"), assert = require("assert/strict");
const { chromium } = require(process.env.PW || "playwright");
const D = require("../js/data.js");
const { createEngine } = require("../js/engine.js");
const ROOT = path.resolve(__dirname, "..");
const RAPPORT = process.argv.includes("--rapport");
const TAILLES = [11, 13, 15, 17, 20, 24, 28], GRAISSES = [400, 600, 700];
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".webp": "image/webp", ".woff2": "font/woff2", ".json": "application/json", ".jpg": "image/jpeg", ".png": "image/png" };
function partie() {
  const E = createEngine(), s = E.state;
  s.age = 4; s.cycle = 1; s.meta.forcedDone = true; s.introSeen = true; s.flags.ver = D.VERSION; s.stats.crafts = 12;
  Object.assign(s.settings, { tuto: false, sound: false, visiteurs: false });
  for (const z of D.ZONES) { s.zones[z.id] = true; if (z.id === "desert") break; }
  for (const [id, it] of Object.entries(D.ITEMS)) {
    if (it.t === "res" && it.a <= 4) { s.seen[id] = true; s.inv[id] = 20; }
    if (it.r && it.a <= 4 && !it.sec && !it.path) { s.known[id] = true; s.made[id] = 1; }
  }
  s.ecus = 1500; s.intu = 40; E.recalc(); return E.serialize();
}
const server = http.createServer((req, res) => {
  const f = path.resolve(ROOT, "." + new URL(req.url, "http://x").pathname.replace(/\/$/, "/index.html"));
  if (!f.startsWith(ROOT + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(f, (e, d) => { if (e) { res.writeHead(404).end(); return; } res.setHeader("Content-Type", MIME[path.extname(f)] || "application/octet-stream"); res.end(d); });
});
/* ce que la page déclare en texte visible : [famille, taille, graisse, exemple] */
const RELEVE = () => {
  const out = [];
  const racine = document.querySelector("#modal:not(.hidden) .modal-box") || document.querySelector(".view.on");
  const zones = [racine, document.querySelector("#top")].filter(Boolean);
  for (const z of zones) for (const e of z.querySelectorAll("*")) {
    if (e.closest("svg, #tabs, .gi")) continue;
    let t = ""; for (const n of e.childNodes) if (n.nodeType === 3) t += n.textContent;
    t = t.trim(); if (!t) continue;
    const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue;
    const c = getComputedStyle(e); if (c.visibility === "hidden" || c.display === "none" || +c.opacity === 0) continue;
    if (r.width <= 1.5 && r.height <= 1.5) continue;
    out.push([c.fontFamily.split(",")[0].replace(/["']/g, "").trim(), Math.round(parseFloat(c.fontSize) * 10) / 10, +c.fontWeight, t.slice(0, 26), e.tagName.toLowerCase() + (e.className && typeof e.className === "string" ? "." + e.className.trim().split(/s+/).slice(0, 3).join(".") : "")]);
  }
  return out;
};
const ECRANS = [
  ["Terres", "domaine", []], ["Étude", "labo", []], ["Atelier", "atelier", []],
  ["Journal", "journal", []], ["Fragments", "journal", ['[data-jt="fragments"]']], ["Progression", "arbre", []], ["Secrets", "arbre", ['[data-pt="secrets"]']], ["Gestes", "arbre", ['[data-pt="gestes"]']],
  ["Menu", "domaine", ["#menuBtn"]], ["Quêtes", "domaine", ['#v-domaine [data-quetes]']],
];
(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const browser = await chromium.launch();
  const ecarts = [];
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, serviceWorkers: "block", reducedMotion: "reduce" });
  for (const [nom, tab, clics] of ECRANS) {
    const p = await ctx.newPage();
    await p.addInitScript((r) => { localStorage.setItem("eclat.save.v1", r); localStorage.setItem("eclat.style.carnet-defaut", "1"); }, partie());
    await p.goto("http://127.0.0.1:" + server.address().port + "/index.html");
    await p.waitForFunction(() => !!window.__eclat);
    for (let i = 0; i < 8; i++) { await p.waitForTimeout(80); await p.evaluate(() => window.__eclat.closeModal()); }
    await p.locator('#tabs [data-tab="' + tab + '"]').click(); await p.waitForTimeout(400);
    for (const sel of clics) { await p.locator(sel).first().click(); await p.waitForTimeout(500); }
    for (const [fam, px, w, ex, cls] of await p.evaluate(RELEVE)) {
      const mauvais = [];
      if (!/^(Alegreya Sans|IM Fell English)$/.test(fam)) mauvais.push("famille " + fam);
      else if (fam === "IM Fell English" && px < 17) mauvais.push("IM Fell sous 17 px");
      if (!TAILLES.some((t) => Math.abs(t - px) <= 0.6)) mauvais.push("taille " + px);
      if (!GRAISSES.includes(w)) mauvais.push("graisse " + w);
      if (mauvais.length) ecarts.push(RAPPORT ? cls + " | " + mauvais.join(", ") + " | " + nom + " : " + ex : nom + " : « " + ex + " » " + mauvais.join(", "));
    }
    await p.close();
  }
  await browser.close(); server.close();
  const uniques = [...new Set(ecarts)];
  if (RAPPORT) { console.log(uniques.length + " écarts sur " + ECRANS.length + " écrans"); uniques.slice(0, 200).forEach((l) => console.log("  " + l)); return; }
  assert.equal(uniques.length, 0, uniques.length + " texte(s) hors échelle :\n  " + uniques.slice(0, 25).join("\n  "));
  console.log("Échelle de texte : " + ECRANS.length + " écrans, aucun écart.");
})().catch((e) => { console.error(e.message); process.exit(1); });
