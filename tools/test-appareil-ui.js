/* Le jeu dans l’appareil, dans un vrai Chromium (mobile) : le bouton Retour, le titre de l’onglet, le clavier, l’installation, l’écran allumé.
 * node tools/test-appareil-ui.js (PW=chemin vers Playwright). Serveur local et profil jetable. */
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
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: o.mobile !== false, isMobile: o.mobile !== false, serviceWorkers: "block" });
  const p = await ctx.newPage();
  p.errors = []; p.on("pageerror", e => p.errors.push(e.message));
  await p.addInitScript(raw => { localStorage.setItem("eclat.save.v1", raw); }, save(o.settings));
  if (o.init) await p.addInitScript(o.init);
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
const tab = (p) => p.evaluate(() => window.__eclat.U.tab);
const modal = (p) => p.evaluate(() => !!window.__eclat.U.mcur);
async function run() {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});

  // 1. le bouton Retour
  let p = await page(browser, {});
  const url0 = p.url();
  await p.locator("#menuBtn").click(); await p.waitForTimeout(550);
  ok(await modal(p), "le menu est ouvert");
  await p.goBack(); await p.waitForTimeout(300);
  ok(p.url() === url0 && !(await modal(p)), "Retour ferme la fenêtre et laisse le jeu ouvert");
  await p.locator('#tabs [data-tab="atelier"]').click(); await p.waitForTimeout(300);
  await p.goBack(); await p.waitForTimeout(300);
  ok(p.url() === url0 && (await tab(p)) === "domaine", "Retour ramène au Domaine depuis l’Atelier");
  await p.goBack(); await p.waitForTimeout(300);
  ok(p.url() === url0, "au Domaine, la première fois, le jeu reste ouvert");
  ok(await p.evaluate(() => [...document.querySelectorAll("#toasts .toast")].some(t => /Retour encore/.test(t.textContent))), "et prévient qu’un second Retour quitte");
  await p.goBack(); await p.waitForTimeout(500);
  ok(p.url() !== url0, "la seconde fois, il quitte (" + p.url() + ")");
  await p.context().close();

  // 2. sur un ordinateur, le bouton Retour du navigateur reste le sien
  p = await page(browser, { mobile: false });
  ok(await p.evaluate(() => history.length) <= 2, "aucune entrée d’historique ajoutée sur ordinateur");
  await p.context().close();

  // 3. les raccourcis du clavier
  p = await page(browser, { mobile: false });
  await p.keyboard.press("3"); await p.waitForTimeout(200);
  ok((await tab(p)) === "atelier", "la touche 3 ouvre l’Atelier");
  await p.keyboard.press("2"); await p.waitForTimeout(200);
  ok((await tab(p)) === "carte", "la touche 2 ouvre la Carte");
  await p.keyboard.press("1"); await p.waitForTimeout(200);
  ok((await tab(p)) === "domaine", "la touche 1 revient au Domaine");
  await p.locator('#tabs [data-tab="carnet"]').click(); await p.waitForTimeout(300);
  await p.locator("#cq").focus(); await p.keyboard.type("3"); await p.waitForTimeout(200);
  ok((await tab(p)) === "carnet" && (await p.locator("#cq").inputValue()) === "3", "on peut taper un chiffre dans une recherche sans changer d’écran");
  await p.locator("#cq").blur();
  await p.locator("#menuBtn").click(); await p.waitForTimeout(550);
  await p.keyboard.press("2"); await p.waitForTimeout(200);
  ok((await tab(p)) === "carnet", "pas de raccourci pendant qu’une fenêtre est ouverte");
  await p.context().close();

  // 4. le titre de l’onglet quand le jeu est caché
  p = await page(browser, {});
  await p.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => true }); window.__eclat.E.emit("fouillePrete", {}); window.__eclat.E.emit("handdone", { id: "manche", n: 1 }); });
  ok(await p.evaluate(() => /^\(2\) /.test(document.title)), "le titre compte ce qui est fini : " + await p.title());
  await p.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => false }); document.dispatchEvent(new Event("visibilitychange")); });
  ok(await p.evaluate(() => !/^\(/.test(document.title)), "il se tait au retour");
  await p.context().close();

  // 5. installer le jeu
  p = await page(browser, {});
  await p.locator("#menuBtn").click(); await p.waitForTimeout(550);
  ok(await p.locator('#modal [data-m="installer"]').count() === 0, "pas de bouton d’installation quand l’appareil ne la propose pas");
  await p.locator("#modal .modal-x").click(); await p.waitForTimeout(500);
  await p.evaluate(() => { let appele = 0; const ev = new Event("beforeinstallprompt", { cancelable: true }); ev.prompt = () => { appele++; window.__installAppele = appele; }; ev.userChoice = Promise.resolve({ outcome: "accepted" }); window.dispatchEvent(ev); });
  await p.locator("#menuBtn").click(); await p.waitForTimeout(550);
  ok(await p.locator('#modal [data-m="installer"]').count() === 1, "le bouton « Installer le jeu » apparaît quand l’appareil le propose");
  await p.locator('#modal [data-m="installer"]').click(); await p.waitForTimeout(300);
  ok(await p.evaluate(() => window.__installAppele === 1), "il lance l’invite d’installation");
  await p.context().close();

  // 6. l’écran allumé
  p = await page(browser, { init: () => { window.__wl = { demandes: 0, relaches: 0 }; Object.defineProperty(navigator, "wakeLock", { configurable: true, value: { request: async () => { window.__wl.demandes++; const l = new EventTarget(); l.release = async () => { window.__wl.relaches++; l.dispatchEvent(new Event("release")); }; return l; } } }); } });
  await p.locator("#menuBtn").click(); await p.waitForTimeout(550);
  ok(await p.locator('#modal [data-m="ecran"]').getAttribute("role") === "switch", "l’interrupteur « Garder l’écran allumé » est dans le menu");
  await p.locator('#modal [data-m="ecran"]').click(); await p.waitForTimeout(300);
  ok(await p.evaluate(() => window.__wl.demandes === 1 && window.__eclat.E.state.settings.ecranAllume === true), "il demande le verrou d’écran");
  await p.locator('#modal [data-m="ecran"]').click(); await p.waitForTimeout(300);
  ok(await p.evaluate(() => window.__wl.relaches === 1 && window.__eclat.E.state.settings.ecranAllume === false), "il le relâche quand on coupe");
  ok(!p.errors.length, p.errors.join("\n"));
  await p.context().close();

  // 7. sans wake lock, pas d’interrupteur
  p = await page(browser, { init: () => { Object.defineProperty(navigator, "wakeLock", { configurable: true, value: undefined }); } });
  await p.locator("#menuBtn").click(); await p.waitForTimeout(550);
  ok(await p.locator('#modal [data-m="ecran"]').count() === 0, "pas d’interrupteur d’écran allumé quand l’appareil ne sait pas le faire");
  await p.context().close();

  await browser.close(); server.close();
  console.log(checks + " contrôles de l’appareil réussis.");
}
run().catch(e => { console.error(e); process.exit(1); });
