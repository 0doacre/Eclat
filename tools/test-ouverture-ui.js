/* L’ouverture d’une partie neuve, dans un vrai Chromium : le choix du guide se fait dans la première fenêtre, un seul appel à l’action à la fois, des mots d’interface.
 * node tools/test-ouverture-ui.js (PW=chemin vers Playwright). Serveur local et profil jetable. */
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
async function neuve(browser) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, serviceWorkers: "block" });
  const p = await ctx.newPage();
  p.errors = []; p.on("pageerror", e => p.errors.push(e.message));
  await p.goto("http://127.0.0.1:" + server.address().port);
  await p.waitForFunction(() => !!window.__eclat);
  await p.waitForSelector("#modal:not(.hidden) [data-m=close]"); await p.waitForTimeout(600);
  return p;
}
const texte = (p, sel) => p.evaluate((s) => (document.querySelector(s) || {}).textContent || "", sel);
async function run() {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});

  // 1. la première fenêtre porte le choix du guide
  let p = await neuve(browser);
  ok(/Ouvrir les yeux/.test(await texte(p, "#modal")) && /Sans guide/.test(await texte(p, "#modal")), "la première fenêtre propose « Ouvrir les yeux » et « Sans guide »");
  ok(await p.locator('#modal [data-m="sansguide"]').count() === 1, "le bouton « Sans guide » est là");
  // 2. avec le guide : plus de bulle d’accueil, le premier chapitre est celui de la récolte
  await p.locator("#modal .btn.pri").click(); await p.waitForTimeout(2200);
  ok(await p.evaluate(() => window.__eclat.U.mcur === null), "la fenêtre se ferme");
  const bulle = await texte(p, ".tuto:not(.hidden)");
  ok(!/Guide-moi|Je me débrouille|Bienvenue/.test(bulle), "plus de bulle d’accueil (« " + bulle.replace(/\s+/g, " ").slice(0, 60) + " »)");
  ok(/Récolter/.test(bulle), "la première bulle montre où récolter");
  // 3. la carte d’objectif parle comme une interface
  const carte = await texte(p, ".goal-card");
  ok(/Objectif/.test(carte) && !/Scénario|Étape clé|Tenter/.test(carte), "la carte dit « Objectif », sans Scénario, Étape clé ni Tenter");
  ok(/Nouvelle recette/.test(carte), "le badge dit « Nouvelle recette »");
  ok(await p.evaluate(() => { const b = document.querySelector('.goal-card [data-gotab="atelier"]'); return !!b && b.textContent.trim() === "Atelier"; }), "le bouton dit « Atelier »");
  // 4. un seul appel à l’action : la bulle ne recouvre pas le bouton de la carte
  ok(await p.evaluate(() => { const t = document.querySelector(".tuto:not(.hidden) .tu-bub"), b = document.querySelector('.goal-card [data-gotab="atelier"]'); if (!t || !b) return false; const r = t.getBoundingClientRect(), c = b.getBoundingClientRect(); return c.bottom < r.top || c.top > r.bottom || c.right < r.left || c.left > r.right; }), "la bulle du guide ne couvre pas le bouton de l’objectif");
  ok(!p.errors.length, p.errors.join("\n"));
  await p.context().close();

  // 5. sans guide : rien ne se pose sur l’écran, et le menu le dit
  p = await neuve(browser);
  await p.locator('#modal [data-m="sansguide"]').click(); await p.waitForTimeout(2200);
  ok(await p.evaluate(() => window.__eclat.U.mcur === null), "la fenêtre se ferme");
  ok(await p.locator(".tuto:not(.hidden)").count() === 0, "aucune bulle de guide");
  await p.locator("#menuBtn").click(); await p.waitForTimeout(550);
  ok(await p.locator('#modal [data-m="tuto"]').getAttribute("aria-checked") === "false", "le menu montre le guide désactivé");
  await p.context().close();

  await browser.close(); server.close();
  console.log(checks + " contrôles de l’ouverture réussis.");
}
run().catch(e => { console.error(e); process.exit(1); });
