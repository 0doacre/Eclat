/* La friction, dans un vrai Chromium : après une relève, les ruines tiennent dans un bloc replié sous ce qui se récolte, et un bouton relève tout ce qui est possible.
 * node tools/test-friction-ui.js (PW=chemin vers Playwright). Serveur local et profil jetable. */
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
  E.newCycle();
  const st = E.state;
  st.t = Date.now(); st.introSeen = true; st.flags.ver = D.VERSION;
  Object.assign(st.settings, { tuto: false, sound: false, visiteurs: false, vibe: false, theme: "light" }, extra || {});
  return E.serialize();
}
async function page(browser, o) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, serviceWorkers: "block" });
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
  await p.waitForFunction(() => !document.querySelector("#app").inert && window.__eclat.U.live);
  return p;
}
async function run() {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});

  // 1. après la relève : ce qui se récolte d’abord, les ruines ensuite, repliées quand rien n’est à portée
  let p = await page(browser, {});
  await p.locator('#tabs [data-tab="domaine"]').click(); await p.waitForTimeout(500);
  const n = await p.evaluate(() => Object.keys(window.__eclat.E.ruins()).length);
  ok(n > 3, "la relève laisse des ruines (" + n + ")");
  ok(await p.locator("#dt-lisiere .dom-ruines").count() === 1, "un seul bloc de ruines sur la Lisière");
  ok(await p.evaluate(() => { const t = document.querySelector("#dt-lisiere"); const g = t.querySelector(".gis"), r = t.querySelector(".dom-ruines"); return !!(g.compareDocumentPosition(r) & Node.DOCUMENT_POSITION_FOLLOWING); }), "le bloc de ruines est sous les gisements");
  ok(await p.evaluate(() => !document.querySelector("#dt-lisiere .dom-ruines").open), "replié tant que rien n’est à portée");
  ok(await p.evaluate(() => /ruines? à relever/.test(document.querySelector("#dt-lisiere .dom-ruines summary").textContent)), "son titre dit ce que c’est");
  const h = await p.evaluate(() => document.querySelector("#dt-lisiere .dom-ruines").getBoundingClientRect().height);
  ok(h < 70, "replié, le bloc ne prend qu’une ligne (" + Math.round(h) + " px) au lieu d’une carte par ruine");
  ok(await p.locator('#dt-lisiere [data-repair-all]').count() === 0, "pas de « Tout réparer » quand rien n’est à portée");

  // 2. on déplie ; il reste plié ou déplié au redessin
  await p.locator("#dt-lisiere .dom-ruines summary").click(); await p.waitForTimeout(200);
  ok(await p.evaluate(() => document.querySelector("#dt-lisiere .dom-ruines").open), "il se déplie");
  await p.evaluate(() => window.__eclat.render(true)); await p.waitForTimeout(200);
  ok(await p.evaluate(() => document.querySelector("#dt-lisiere .dom-ruines").open), "et le reste après un nouveau dessin");

  // 3. de quoi réparer : le bloc s’ouvre de lui-même, « Tout réparer » relève ce qui est possible, et compte pour les étapes
  await p.evaluate(() => { const { E } = window.__eclat; for (const id of Object.keys(E.ruins())) { const c = E.ruinCost(id); for (const k in c) E.state.inv[k] = (E.state.inv[k] || 0) + c[k] * E.ruins()[id]; } });
  await p.evaluate(() => { window.__eclat.U.ruinesOpen = {}; window.__eclat.render(true); }); await p.waitForTimeout(300);
  ok(await p.evaluate(() => document.querySelector("#dt-lisiere .dom-ruines").open), "ouvert d’emblée quand on peut réparer");
  ok(await p.evaluate(() => /à portée/.test(document.querySelector("#dt-lisiere .dom-ruines summary").textContent)), "le titre le dit : « à portée »");
  const avant = await p.evaluate(() => Object.keys(window.__eclat.E.ruins()).length);
  await p.locator("#dt-lisiere [data-repair-all]").click(); await p.waitForTimeout(300);
  const apres = await p.evaluate(() => ({ r: Object.keys(window.__eclat.E.ruins()).length, made: window.__eclat.E.state.made.cabane || window.__eclat.E.state.made.scierie || 0 }));
  ok(apres.r < avant, "des ruines sont relevées (" + avant + " → " + apres.r + ")");
  ok(await p.locator("#dt-lisiere .dom-ruines").count() === 0, "plus de ruines sur la Lisière, plus de bloc");
  ok(!p.errors.length, p.errors.join("\n"));
  await p.context().close();

  // 4. le Comptoir est joignable depuis le menu
  p = await page(browser, {});
  await p.evaluate(() => { window.__eclat.E.state.zones.plaine = true; });
  await p.locator("#menuBtn").click(); await p.waitForTimeout(550);
  ok(await p.locator('#modal [data-m="comptoir"]').count() === 1, "« Le Comptoir » est dans le menu quand la Plaine est ouverte");
  await p.locator('#modal [data-m="comptoir"]').click(); await p.waitForTimeout(900);
  ok(await p.evaluate(() => /Comptoir/.test(document.querySelector("#modal").textContent)), "il ouvre le Comptoir, depuis n’importe quel écran");
  await p.context().close();

  await browser.close(); server.close();
  console.log(checks + " contrôles de la friction réussis.");
}
run().catch(e => { console.error(e); process.exit(1); });
