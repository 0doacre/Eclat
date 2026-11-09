#!/usr/bin/env node
/* Capture d'écrans du jeu avec Playwright (partie du Bronze, recettes connues, ressources en réserve).
 *   PW=<dossier>/node_modules/playwright node tools/capture-pw.js <sortie.png> [--w 390] [--h 844] [--tab domaine] [--clic "sel||sel"] [--js "code"]
 * Sert à regarder un écran ou une fenêtre sans lancer les tests. Le moteur n'est pas modifié. */
"use strict";
const fs = require("fs"), path = require("path"), http = require("http");
const { chromium } = require(process.env.PW || "playwright");
const D = require("../js/data.js");
const { createEngine } = require("../js/engine.js");
const ROOT = path.resolve(__dirname, "..");
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".webp": "image/webp", ".woff2": "font/woff2", ".json": "application/json", ".jpg": "image/jpeg", ".png": "image/png" };
const arg = (n, d) => { const i = process.argv.indexOf("--" + n); return i > 0 ? process.argv[i + 1] : d; };
const sortie = process.argv[2], W = +arg("w", 390), H = +arg("h", 844), tab = arg("tab", "domaine"), clics = (arg("clic", "") || "").split("||").filter(Boolean), js = arg("js", "");
function partie(age) {
  const E = createEngine(), s = E.state;
  s.age = age; s.cycle = 2; s.meta.forcedDone = true; s.introSeen = true; s.flags.ver = D.VERSION; s.stats.crafts = 12;
  Object.assign(s.settings, { tuto: false, sound: false, visiteurs: false });
  for (const z of D.ZONES) { s.zones[z.id] = true; if (z.id === "desert") break; }
  for (const [id, it] of Object.entries(D.ITEMS)) {
    if (it.t === "res" && it.a <= age) { s.seen[id] = true; s.inv[id] = 20; }
    if (it.r && it.a <= age && !it.sec && !it.path) { s.known[id] = true; s.made[id] = 1; }
  }
  s.ecus = 1500; s.intu = 40; E.recalc(); return E.serialize();
}
const server = http.createServer((req, res) => {
  const f = path.resolve(ROOT, "." + new URL(req.url, "http://x").pathname.replace(/\/$/, "/index.html"));
  if (!f.startsWith(ROOT + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(f, (e, d) => { if (e) { res.writeHead(404).end(); return; } res.setHeader("Content-Type", MIME[path.extname(f)] || "application/octet-stream"); res.end(d); });
});
(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, hasTouch: W < 700, serviceWorkers: "block", reducedMotion: "reduce" });
  const p = await ctx.newPage(); p.on("pageerror", (e) => console.log("PAGEERR", e.message.slice(0, 200))); p.on("response", (r) => { if (r.status() >= 400) console.log("HTTP", r.status(), r.url().slice(-60)); });
  await p.addInitScript((r) => { localStorage.setItem("eclat.save.v1", r); localStorage.setItem("eclat.style.carnet-defaut", "1"); }, partie(4));
  await p.goto("http://127.0.0.1:" + server.address().port + "/index.html");
  await p.waitForFunction(() => !!window.__eclat);
  for (let i = 0; i < 8; i++) { await p.waitForTimeout(100); await p.evaluate(() => window.__eclat.closeModal()); }
  await p.locator('#tabs [data-tab="' + tab + '"]').click(); await p.waitForTimeout(500);
  for (const sel of clics) { await p.locator(sel).first().click(); await p.waitForTimeout(600); }
  if (js) { await p.evaluate(js); await p.waitForTimeout(500); }
  if (arg("dump", "")) console.log(await p.evaluate((q) => [...document.querySelectorAll(q)].slice(0, 12).map((e) => e.tagName + "." + String(e.className) + " | " + (e.textContent || "").trim().slice(0, 30)).join(" ; "), arg("dump", "")));
  await p.screenshot({ path: sortie });
  await b.close(); server.close();
})().catch((e) => { console.error(e.message.split("\n")[0]); process.exit(1); });
