#!/usr/bin/env node
/* Grand texte (T9) : une seule échelle, --sb-texte, posée par body.large-text.
 *  - la taille calculée d'un texte de liste, de fiche et de bouton grandit d'au moins 12 % ;
 *  - --rapport liste les textes lus qui ne grandissent pas de 10 % ;
 *  - avec Grand texte, aucune vue ne défile en entier aux cinq tailles ; seule la zone du milieu peut glisser.
 * Playwright requis. PW et CHROMIUM facultatifs.   node tools/test-grand-texte-ui.js [--rapport] */
"use strict";
const fs = require("fs"), path = require("path"), http = require("http"), assert = require("assert/strict");
const { chromium } = require(process.env.PW || "playwright"), D = require("../js/data"), Core = require("../js/engine");
const ROOT = path.resolve(__dirname, ".."), RAPPORT = process.argv.includes("--rapport");
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".webp": "image/webp", ".woff2": "font/woff2", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg" };
const server = http.createServer((req, res) => {
  const file = path.resolve(ROOT, "." + new URL(req.url, "http://localhost").pathname.replace(/\/$/, "/index.html"));
  if (!file.startsWith(ROOT + path.sep)) return res.writeHead(403).end();
  fs.readFile(file, (e, b) => { if (e) return res.writeHead(404).end(); res.setHeader("Content-Type", MIME[path.extname(file)] || "application/octet-stream"); res.end(b); });
});
let checks = 0;
const ok = (v, m) => { assert.ok(v, m); checks++; };
const TAILLES = [[320, 568], [360, 640], [390, 700], [390, 844], [430, 932]];
function partie() {
  const E = Core.createEngine(), s = E.state;
  s.introSeen = true; s.flags.ver = D.VERSION; s.t = Date.now(); s.age = 4; s.cycle = 2; s.meta.forcedDone = true; s.stats.crafts = 12;
  Object.assign(s.settings, { tuto: false, sound: false, visiteurs: false });
  for (const z of D.ZONES) { s.zones[z.id] = true; if (z.id === "desert") break; }
  for (const [id, it] of Object.entries(D.ITEMS)) {
    if (it.t === "res" && it.a <= 4) { s.seen[id] = true; s.inv[id] = 40; }
    if (it.r && it.a <= 4 && !it.sec && !it.path) { s.known[id] = true; s.made[id] = 1; }
  }
  s.ecus = 1500; s.intu = 40; E.recalc(); return E.serialize();
}
const defile = () => {
  const v = document.querySelector(".view.on"), vs = document.querySelector("#views");
  return Math.max(v.scrollHeight - v.clientHeight, vs.scrollHeight - vs.clientHeight, document.scrollingElement.scrollHeight - innerHeight);
};
/* les textes lus de l'écran (ou de la fenêtre ouverte) : nœuds gardés pour mesurer avant et après */
const PRISE = () => {
  const racine = document.querySelector("#modal:not(.hidden) .modal-box") || document.querySelector(".view.on");
  const zones = [racine, document.querySelector("#top")].filter(Boolean), els = [];
  for (const z of zones) for (const e of z.querySelectorAll("*")) {
    if (e.closest("svg, #tabs, .gi, .ic, .an, .fi, .ico-seule")) continue;
    let t = ""; for (const n of e.childNodes) if (n.nodeType === 3) t += n.textContent;
    t = t.trim(); if (!/[\p{L}\d]/u.test(t)) continue;
    const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue;
    const c = getComputedStyle(e); if (c.visibility === "hidden" || c.display === "none" || +c.opacity === 0) continue;
    if (e.matches("button, a, [role=button]") || e.closest("button")) e.dataset.t9 = "bouton"; else if (e.closest(".modal-box")) e.dataset.t9 = "fiche"; else e.dataset.t9 = "liste";
    els.push(e);
  }
  window.__t9 = els; return els.length;
};
const TAILLE = () => window.__t9.map(e => [parseFloat(getComputedStyle(e).fontSize), e.dataset.t9, (e.textContent || "").trim().slice(0, 24), e.tagName.toLowerCase() + "." + String(e.className || "").trim().split(/\s+/).slice(0, 2).join(".")]);
async function ouvreCarnet(p) {
  await p.locator('#tabs [data-tab="journal"]').click(); await p.waitForTimeout(300);
  if (!await p.locator("#v-carnet .rec-tile").count()) await p.locator('[data-tab2="carnet"]').click();
  await p.waitForTimeout(300);
}
async function run() {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const url = "http://127.0.0.1:" + server.address().port + "/index.html";
  const ECRANS = {
    terres: async p => { await p.locator('#tabs [data-tab="domaine"]').click(); },
    etude: async p => { await p.locator('#tabs [data-tab="labo"]').click(); },
    atelier: async p => { await p.evaluate(() => { const g = window.__eclat; g.U.atelierSel = null; g.U.prodSel = null; }); await p.locator('#tabs [data-tab="atelier"]').click(); },
    metier: async p => { await p.locator('#tabs [data-tab="atelier"]').click(); await p.evaluate(() => { const g = window.__eclat; g.U.atelierSel = "artisanat"; g.U.prodSel = null; g.render(true); }); },
    progression: async p => { await p.locator('#tabs [data-tab="arbre"]').click(); },
    journal: async p => { await p.locator('#tabs [data-tab="journal"]').click(); await p.evaluate(() => { window.__eclat.U.journalTab = "fragments"; window.__eclat.render(true); }); },
    carnet: async p => { await ouvreCarnet(p); },
    fiche: async p => { await ouvreCarnet(p); await p.locator("#v-carnet .rec-tile").first().click(); },
    menu: async p => { await p.locator("#menuBtn").click(); },
  };
  const rapport = [], rat = { liste: [], fiche: [], bouton: [] };
  for (const [w, h] of TAILLES) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, serviceWorkers: "block" });
    for (const [nom, aller] of Object.entries(ECRANS)) {
      const p = await ctx.newPage(), errors = []; p.on("pageerror", e => errors.push(e.message));
      await p.addInitScript(r => { localStorage.setItem("eclat.save.v1", r); localStorage.setItem("eclat.style.carnet-defaut", "1"); }, partie());
      await p.goto(url); await p.waitForFunction(() => !!window.__eclat);
      for (let i = 0; i < 6; i++) { await p.waitForTimeout(60); await p.evaluate(() => window.__eclat.closeModal()); }
      await aller(p); await p.waitForTimeout(450);
      const tag = w + "x" + h + " · " + nom + " : ";
      await p.evaluate(() => { const g = window.__eclat; g.E.state.settings.largeText = false; g.U.applyLargeText(); }); await p.waitForTimeout(150); await p.evaluate(PRISE); const avant = await p.evaluate(TAILLE);
      await p.evaluate(() => { const g = window.__eclat; g.E.state.settings.largeText = true; g.U.applyLargeText(); }); await p.waitForTimeout(250);
      const apres = await p.evaluate(TAILLE);
      ok(!errors.length, tag + "aucune erreur de page : " + errors[0]);
      if (!/^(menu|fiche)$/.test(nom)) { const d = await p.evaluate(defile); ok(d <= 1, tag + "avec Grand texte, la vue ne défile pas (" + d + " px)"); }
      if (w === 390 && h === 844) avant.forEach((a, i) => {
        const r = apres[i][0] / a[0]; rat[a[1]].push(r);
        if (r < 1.1) rapport.push(nom + " | " + a[3] + " | « " + a[2] + " » " + a[0] + " -> " + apres[i][0]);
      });
      await p.close();
    }
    await ctx.close();
  }
  await browser.close(); server.close();
  const mediane = a => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
  for (const k of ["liste", "fiche", "bouton"]) {
    const m = mediane(rat[k]); console.log(k + " : " + rat[k].length + " textes, rapport médian " + m.toFixed(3) + ", minimum " + Math.min(...rat[k]).toFixed(3));
    if (!RAPPORT) ok(m >= 1.12, "texte de " + k + " : la taille grandit d'au moins 12 % (médiane " + m.toFixed(3) + ")");
  }
  const non = [...new Set(rapport)];
  if (RAPPORT) { console.log(non.length + " textes qui ne grandissent pas de 10 %"); non.forEach(l => console.log("  " + l)); return; }
  console.log("Grand texte : " + checks + " contrôles, " + non.length + " texte(s) sous +10 %.");
}
run().catch(e => { console.error(e.message); process.exit(1); });
