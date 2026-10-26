/* L’affichage, dans un vrai Chromium : les réglages du menu (compact, deux colonnes) changent bien le Domaine et le Carnet, y compris sur téléphone.
 * node tools/test-affichage-ui.js (PW=chemin vers Playwright). Serveur local et profil jetable. */
"use strict";
const fs = require("fs"), path = require("path"), http = require("http"), assert = require("assert/strict");
const { chromium } = require(process.env.PW || "playwright");
const ROOT = path.resolve(__dirname, "..");
const D = require("../js/data.js");
const { createEngine } = require("../js/engine.js");
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".webp": "image/webp", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  const file = path.resolve(ROOT, "." + new URL(req.url, "http://localhost").pathname.replace(/\/$/, "/index.html"));
  if (!file.startsWith(ROOT + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (err, data) => { if (err) { res.writeHead(404).end(); return; } res.setHeader("Content-Type", MIME[path.extname(file)] || "application/octet-stream"); res.end(data); });
});
let checks = 0;
function ok(v, m) { assert.ok(v, m); checks++; }
function save(extra) {
  const E = createEngine();
  E.load(fs.readFileSync(path.join(ROOT, "tools/fixtures/save-v5-age8-usine.json"), "utf8"));
  const st = E.state;
  st.t = Date.now(); st.introSeen = true; st.flags.ver = D.VERSION;
  Object.assign(st.settings, { tuto: false, sound: false, visiteurs: false, vibe: false, theme: "light" }, extra || {});
  return E.serialize();
}
async function page(browser, set, o2) {
  const o = { settings: set || {} };
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, serviceWorkers: "block", reducedMotion: o.calme ? "reduce" : "no-preference" });
  const p = await ctx.newPage();
  p.errors = []; p.on("pageerror", e => p.errors.push(e.message));
  await p.addInitScript(raw => { localStorage.setItem("eclat.save.v1", raw); }, save(o.settings));
  await p.goto("http://127.0.0.1:" + server.address().port);
  await p.waitForFunction(() => !!window.__eclat);
  for (let i = 0; i < 12; i++) {
    await p.waitForTimeout(150);
    if (await p.locator("#modal").evaluate(e => e.classList.contains("hidden"))) break;
    await p.evaluate(() => window.__eclat.closeModal());
  }
  await p.waitForFunction(() => !document.querySelector("#app").inert);
  await p.waitForFunction(() => window.__eclat.U.live);
  return p;
}
async function run() {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const menu = async (p) => { await p.locator("#menuBtn").click(); await p.waitForTimeout(550); };
  const sw = (p, k) => p.locator('#modal [data-m="' + k + '"]');

  // 1. le menu : les réglages d’affichage y sont, les anciens boutons des pages n’y sont plus
  let p = await page(browser, {});
  await p.locator('#tabs [data-tab="domaine"]').click();
  ok(await p.locator("[data-dom-dense]").count() === 0, "plus de bouton « vue dense » dans le Domaine");
  await p.locator('#tabs [data-tab="carnet"]').click(); await p.waitForTimeout(300);
  ok(await p.locator("[data-cvue]").count() === 0, "plus de boutons de vue dans le Carnet");
  await menu(p);
  for (const k of ["compact", "carnet2", "largeText", "sound", "vibe", "visiteurs", "tuto"]) ok(await sw(p, k).getAttribute("role") === "switch", k + " : un interrupteur");
  ok(await sw(p, "compact").getAttribute("aria-checked") === "false", "compact éteint au départ");
  ok(await sw(p, "carnet2").getAttribute("aria-checked") === "true", "deux colonnes par défaut");
  ok((await sw(p, "compact").textContent()) === "Désactivé", "mêmes mots partout : Désactivé");

  // 2. le Carnet sur deux colonnes marche sur téléphone
  await p.locator("#modal .modal-x").click(); await p.waitForTimeout(500);
  const cols = () => p.evaluate(() => { const l = document.querySelector("#clist .age-sec[open] > .list, #clist > .list.flat, #clist .age-sec > .list"); return l ? getComputedStyle(l).gridTemplateColumns.split(" ").length : 0; });
  ok(await cols() === 2, "deux colonnes à 390 px (" + await cols() + ")");
  const box = await p.evaluate(() => { const r = document.querySelector("#clist .rec"); const b = r.getBoundingClientRect(); return { w: b.width, over: document.documentElement.scrollWidth > innerWidth + 1 }; });
  ok(!box.over, "pas de défilement horizontal en deux colonnes");
  await menu(p); await sw(p, "carnet2").click(); await p.waitForTimeout(150);
  ok(await sw(p, "carnet2").getAttribute("aria-checked") === "false" && await sw(p, "carnet2").textContent() === "Désactivé", "l’interrupteur suit");
  await p.locator("#modal .modal-x").click(); await p.waitForTimeout(500);
  ok(await cols() === 1, "une colonne une fois coupé");
  ok(await p.evaluate(() => window.__eclat.E.state.settings.carnet1Col === true), "le réglage est gardé dans la partie");

  // 3. l’affichage compact resserre le Domaine et le Carnet
  await p.locator('#tabs [data-tab="domaine"]').click(); await p.waitForTimeout(400);
  const h0 = await p.evaluate(() => document.querySelector(".gis").getBoundingClientRect().height);
  ok(await p.evaluate(() => !document.querySelector(".dom.dom-dense")), "pas compact au départ");
  await menu(p); await sw(p, "compact").click(); await p.waitForTimeout(150);
  await p.locator("#modal .modal-x").click(); await p.waitForTimeout(500);
  ok(await p.evaluate(() => !!document.querySelector(".dom.dom-dense")), "le Domaine passe en compact");
  const h1 = await p.evaluate(() => document.querySelector(".gis").getBoundingClientRect().height);
  ok(h1 < h0 - 10, "la rangée d’un gisement est plus basse (" + Math.round(h0) + " → " + Math.round(h1) + " px)");
  ok(await p.evaluate(() => [...document.querySelectorAll(".gis-b .mini")].every(b => b.getBoundingClientRect().height >= 40 && b.getBoundingClientRect().width >= 40)), "les boutons gardent une cible tactile d’au moins 40 px");
  ok(await p.evaluate(() => [...document.querySelectorAll(".gis-b .mini")].every(b => (b.getAttribute("aria-label") || "").length > 0)), "les boutons réduits ont toujours leur nom pour le lecteur d’écran");
  await p.locator('#tabs [data-tab="carnet"]').click(); await p.waitForTimeout(400);
  ok(await p.evaluate(() => !!document.querySelector("#clist.carnet-dense")), "le Carnet passe en compact aussi");
  ok(await p.evaluate(() => window.__eclat.E.state.settings.compact === true), "un seul réglage dans la partie");
  ok(!p.errors.length, p.errors.join("\n"));
  await p.context().close();

  // 4. une ancienne partie qui avait la vue dense reste en compact
  p = await page(browser, { domDense: true });
  await p.locator('#tabs [data-tab="domaine"]').click(); await p.waitForTimeout(400);
  ok(await p.evaluate(() => !!document.querySelector(".dom.dom-dense")), "une ancienne partie en vue dense reste compacte");
  await menu(p);
  ok(await sw(p, "compact").getAttribute("aria-checked") === "true", "et le menu le dit");
  await sw(p, "compact").click(); await p.waitForTimeout(150);
  ok(await p.evaluate(() => { const s = window.__eclat.E.state.settings; return s.compact === false && s.domDense === undefined; }), "l’ancien réglage est remplacé");
  await p.context().close();

  // 5. le menu tient dans l’écran et se lit : rien ne déborde, des sections, un nom pour chaque bouton
  p = await page(browser, {});
  await menu(p);
  ok(await p.evaluate(() => [...document.querySelectorAll("#modal .menu-sec > h3")].map(h => h.textContent).join("|")) === "Affichage|Son et vibrations|Jeu|Ma partie|Aide", "les cinq sections du menu");
  ok(await p.evaluate(() => [...document.querySelectorAll("#modal .modal-box button")].every(b => (b.title || b.getAttribute("aria-label") || b.textContent.trim()).length > 0)), "chaque bouton du menu a un nom");
  ok(await p.evaluate(() => { const m = document.querySelector("#modal .modal-box"); return m.scrollWidth <= m.clientWidth + 1; }), "le menu ne déborde pas à droite");
  ok(await p.evaluate(() => !/Tout recommencer|Veillée|Coupé|Oui|Non/.test(document.querySelector("#modal .modal-box").textContent)), "le vocabulaire est celui de l’interface");
  await p.context().close();

  await browser.close(); server.close();
  console.log(checks + " contrôles de l’affichage réussis.");
}
run().catch(e => { console.error(e); process.exit(1); });
