"use strict";
const fs = require("fs"), path = require("path"), http = require("http"), assert = require("assert/strict");
const { chromium } = require(process.env.PW || "playwright"), D = require("../js/data"), Core = require("../js/engine");
const ROOT = path.resolve(__dirname, ".."), equipped = fs.existsSync(path.join(ROOT, "js/equipements.js"));
const server = http.createServer((req, res) => {
  const f = path.resolve(ROOT, "." + new URL(req.url, "http://localhost").pathname.replace(/\/$/, "/index.html"));
  if (!f.startsWith(ROOT + path.sep)) return res.writeHead(403).end();
  fs.readFile(f, (e, b) => { if (e) return res.writeHead(404).end(); res.setHeader("Content-Type", ({ ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".webp": "image/webp", ".woff2": "font/woff2" })[path.extname(f)] || "application/octet-stream"); res.end(b); });
});
function fixture(preview) {
  const E = preview ? Core.withData(require("../js/equipements").createData(D, { fullGame: true })).createEngine() : Core.createEngine();
  for (const id of ["manche", "corde", "cabane"]) E.learn(id, true); E.add("cabane", 2); E.domExtSet("lisiere", "bois", "cabane", 2);
  Object.assign(E.state.made, { manche: 1, corde: 10, cabane: 2 }); E.state.pass.plaine = { done: true, paid: {} }; E.newCycle();
  const s = E.state; s.introSeen = true; s.meta.forcedDone = true; s.flags.ver = D.VERSION;
  Object.assign(s.settings, { tuto: false, sound: false, visiteurs: false });
  for (const [id, n] of Object.entries(E.ruinCost("cabane"))) E.add(id, n * 10);
  return E.serialize();
}
async function main() {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}) });
  let checks = 0; const check = (v, msg) => { assert.ok(v, msg); checks++; };
  try {
    for (const preview of equipped ? [false, true] : [false]) for (const width of [320, 390, 980]) {
      const ctx = await browser.newContext({ viewport: { width, height: 950 }, serviceWorkers: "block" }), p = await ctx.newPage(), errors = [];
      p.on("pageerror", e => errors.push(e.message));
      await p.addInitScript(({ raw, key }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, raw); }, { raw: fixture(preview), key: preview ? "eclat.preview.craft.v1" : "eclat.save.v1" });
      await p.goto("http://127.0.0.1:" + server.address().port + "/index.html" + (preview ? "" : "?atelier=classique"));
      await p.waitForFunction(() => !!window.__eclat);
      for (let i = 0; i < 15; i++) { await p.waitForTimeout(120); await p.evaluate(() => window.__eclat.closeModal()); }
      check((await p.locator(".goal-card").textContent()).includes("Terre familière"), "objectif regroupé " + width);
      await p.locator("[data-reprise]").click(); await p.waitForTimeout(550);
      check((await p.locator("#modal").innerText()).includes("À dépenser ou réserver"), "coût affiché " + width);
      check(await p.evaluate(() => window.__eclat.E.count("cabane") === 0), "aucune dépense avant validation " + width);
      await p.locator('[data-m="repriseSelect"]').first().click();
      check(await p.locator('[data-m="repriseApply"]').isDisabled(), "désélection sans action " + width);
      await p.locator('[data-m="repriseSelect"]').first().click();
      check(await p.locator('[data-m="repriseApply"]').isEnabled(), "sélection actualise devis " + width);
      await p.locator('[data-m="repriseApply"]').click();
      check((await p.locator("#modal").innerText()).includes("2 opération(s) lancée(s)"), "validation et retour lisible " + width);
      check(await p.evaluate(() => window.__eclat.E.domExt("lisiere", "bois").u.cabane === 2), "pose correcte " + width);
      check(await p.locator('[data-m="repriseApply"]').isDisabled(), "double lancement empêché " + width);
      check(await p.locator("#modal .modal-box").evaluate(el => el.scrollWidth <= el.clientWidth + 1), "fenêtre contenue " + width);
      check(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "page contenue " + width);
      if (process.env.REPRISE_SHOTS) { fs.mkdirSync(process.env.REPRISE_SHOTS, { recursive: true }); await p.locator("#modal").screenshot({ path: path.join(process.env.REPRISE_SHOTS, (preview ? "equipe" : "classique") + "-reprise-" + width + ".png") }); }
      check(errors.length === 0, errors.join("; ")); await ctx.close();
    }
    console.log(checks + " contrôles navigateur de reprise réussis.");
  } finally { await browser.close(); server.close(); }
}
main().catch(e => { console.error(e); server.close(); process.exitCode = 1; });
