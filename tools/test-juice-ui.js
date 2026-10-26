/* Le jus à l’écran, dans un vrai Chromium : un appui se voit, une curiosité rare prend l’écran, un visiteur attrapé éclate.
 * node tools/test-juice-ui.js (PW=chemin vers Playwright). Serveur local et profil jetable. */
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
async function page(browser, o) {
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

  // 1. un appui se voit : le bouton s’enfonce, un anneau part du doigt
  let p = await page(browser, {});
  const tab = p.locator('#tabs [data-tab="carnet"]');
  const box = await tab.boundingBox();
  await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await p.mouse.down();
  ok(await p.evaluate(() => !!document.querySelector("#fx .jring")), "un anneau part du doigt à l’appui");
  ok(await tab.evaluate(e => e.classList.contains("jpress")), "le bouton s’enfonce pendant l’appui");
  await p.mouse.up();
  await p.waitForTimeout(100);
  ok(await tab.evaluate(e => !e.classList.contains("jpress")), "il se relâche");
  ok(!p.errors.length, p.errors.join("\n"));

  // 2. une curiosité rare prend l’écran (palier 3) : fête, rayons, secousse, voile
  await p.evaluate(() => window.__eclat.E.addCurio("poudre_rouge"));
  await p.waitForSelector(".cele.t3 .crays");
  ok(await p.evaluate(() => document.querySelector(".cele.t3 .cn").textContent === "Poudre rouge"), "la fête de la poudre rouge s’affiche");
  ok(await p.evaluate(() => document.getElementById("app").classList.contains("jshake")), "l’écran tremble à l’arrivée");
  ok(await p.evaluate(() => !!document.querySelector("#fx .jflash") || document.querySelectorAll("#fx .jring").length > 0), "un choc visible accompagne l’arrivée");
  const dur = await p.evaluate(() => parseInt(getComputedStyle(document.querySelector(".cele")).getPropertyValue("--ms"), 10));
  ok(dur >= 4000, "elle dure assez pour être vue (" + dur + " ms)");
  ok(await p.evaluate(() => !!document.querySelector("#toasts .toast-gold")), "le message doré reste aussi");
  await p.waitForTimeout(500);
  ok(await p.evaluate(() => !document.getElementById("app").classList.contains("jshake")), "la secousse s’arrête");
  await p.waitForFunction(() => !document.querySelector(".cele"), null, { timeout: 7000 });
  await p.context().close();

  // 3. un palier 2 est plus discret que le 3
  p = await page(browser, {});
  await p.evaluate(() => window.__eclat.E.addCurio("fouet"));
  await p.waitForSelector(".cele.t2");
  ok(await p.evaluate(() => !document.querySelector(".cele .crays")), "pas de rayons au palier 2");
  await p.context().close();

  // 4. « réduire les animations » : ni anneau, ni secousse, mais la fête et son message restent
  p = await page(browser, { calme: true });
  const b2 = await p.locator('#tabs [data-tab="carnet"]').boundingBox();
  await p.mouse.move(b2.x + 10, b2.y + 10); await p.mouse.down(); await p.mouse.up();
  ok(await p.evaluate(() => !document.querySelector("#fx .jring")), "pas d’anneau avec « réduire les animations »");
  await p.evaluate(() => window.__eclat.E.addCurio("poudre_rouge"));
  await p.waitForSelector(".cele.t3");
  ok(await p.evaluate(() => !document.getElementById("app").classList.contains("jshake")), "pas de secousse avec « réduire les animations »");
  ok(await p.evaluate(() => !!document.querySelector(".cele .cn").textContent), "le message reste");
  await p.context().close();

  // 5. un visiteur attrapé éclate : pop, étincelles, gain qui monte
  p = await page(browser, { settings: { visiteurs: true } });
  await p.evaluate(() => { const st = window.__eclat.E.state; st.stats.play = 1000; st.visiteur = Object.assign(st.visiteur || {}, { next: 1 }); window.__eclat.U.tab = "domaine"; });
  await p.waitForSelector(".visiteur", { timeout: 25000 });
  const gain0 = await p.evaluate(() => window.__eclat.E.state.stats.visiteurs);
  await p.locator(".visiteur").evaluate(e => e.click());
  await p.waitForFunction(g => window.__eclat.E.state.stats.visiteurs > g, gain0);
  ok(await p.evaluate(() => !!document.querySelector("#fx .spark")), "des étincelles éclatent là où il était");
  ok(await p.evaluate(() => !!document.querySelector("#fx .float")), "le gain monte depuis lui");
  ok(await p.evaluate(() => !!document.querySelector("#fx .jring")), "un anneau s’étend");
  ok(!p.errors.length, p.errors.join("\n"));
  await p.context().close();

  await browser.close(); server.close();
  console.log(checks + " contrôles du jus réussis.");
}
run().catch(e => { console.error(e); process.exit(1); });
