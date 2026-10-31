/* Comptes en ligne : le jeu normal (établi par postes) doit proposer la connexion quand un serveur est configuré,
 * et la couper seulement en mode test. Le serveur est simulé : rien ne part sur le réseau. Playwright requis. */
"use strict";
const fs = require("fs"), path = require("path"), http = require("http"), assert = require("assert/strict");
const { chromium } = require(process.env.PW || "playwright");
const ROOT = path.resolve(__dirname, ".."), MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".webp": "image/webp", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  const file = path.resolve(ROOT, "." + new URL(req.url, "http://localhost").pathname.replace(/\/$/, "/index.html"));
  if (!file.startsWith(ROOT + path.sep)) return res.writeHead(403).end();
  fs.readFile(file, (e, b) => { if (e) return res.writeHead(404).end(); res.setHeader("Content-Type", MIME[path.extname(file)] || "application/octet-stream"); res.end(b); });
});
let browser, checks = 0;
const ok = (v, m) => { assert.ok(v, m); checks++; };
const CLOUD = "https://eclat-comptes.golder-sylvain.workers.dev";
async function run() {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  for (const [nom, query, attendu] of [["jeu normal", "", true], ["ancien établi (?atelier=classique)", "?atelier=classique", true]]) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block", reducedMotion: "reduce" }), p = await ctx.newPage(), errors = [], appels = [];
    p.on("pageerror", e => errors.push(e.message));
    await p.route(CLOUD + "/**", route => { appels.push(route.request().method() + " " + new URL(route.request().url()).pathname); route.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify({ ok: true, slots: [] }) }); });
    await p.goto("http://127.0.0.1:" + server.address().port + "/index.html" + query);
    await p.waitForFunction(() => !!window.__eclat);
    for (let i = 0; i < 5; i++) { await p.waitForTimeout(80); await p.evaluate(() => window.__eclat.closeModal()); }
    ok(await p.evaluate(() => window.__eclat.Cloud.configured()) === attendu, nom + " : serveur configuré = " + attendu);
    await p.locator("#menuBtn").click(); await p.waitForTimeout(250);
    await p.locator('[data-m="account"]').click(); await p.waitForTimeout(400);
    const texte = await p.locator(".modal:not(.hidden)").textContent();
    ok(!/Pas encore de comptes/.test(texte), nom + " : la fenêtre ne dit pas « Pas encore de comptes »");
    ok(await p.locator('.modal:not(.hidden) input').count() > 0, nom + " : un formulaire de connexion est proposé");
    ok(!errors.length, nom + " : erreurs JS " + errors.join(";")); await ctx.close();
  }
  console.log(checks + " contrôles des comptes en ligne réussis.");
}
run().catch(e => { console.error(e); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); server.close(); });
