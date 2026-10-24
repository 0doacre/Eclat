/* Parcours mobiles de confort. PW=chemin vers Playwright ; CHROMIUM=facultatif.
 * node tools/test-ux.js. Serveur local et profils jetables, aucune partie personnelle.
 * UX_SHOTS=dossier facultatif pour les captures de contrôle à 390 px. */
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
let browser, checks = 0;
function ok(value, message) { assert.ok(value, message); checks++; }
function save(advanced, large) {
  const E = createEngine();
  if (advanced) E.load(fs.readFileSync(path.join(ROOT, "tools/fixtures/save-v5-age8-usine.json"), "utf8"));
  const st = E.state;
  st.t = Date.now(); st.introSeen = true; st.flags.ver = D.VERSION;
  Object.assign(st.settings, { tuto: false, sound: false, visiteurs: false, largeText: large, theme: large ? "dark" : "light" });
  return E.serialize();
}
async function page(width, advanced, large = false) {
  const ctx = await browser.newContext({ viewport: { width, height: width === 320 ? 568 : 844 }, hasTouch: true, serviceWorkers: "block", reducedMotion: "reduce" });
  const p = await ctx.newPage();
  p.errors = []; p.on("pageerror", e => p.errors.push(e.message));
  await p.addInitScript(raw => { localStorage.setItem("eclat.save.v1", raw); }, save(advanced, large));
  await p.goto("http://127.0.0.1:" + server.address().port);
  await p.waitForFunction(() => !!window.__eclat);
  // Les cadeaux de retour/migrations sont hors du parcours mesuré.
  for (let i = 0; i < 12; i++) {
    await p.waitForTimeout(150);
    if (await p.locator("#modal").evaluate(e => e.classList.contains("hidden"))) break;
    await p.evaluate(() => window.__eclat.closeModal());
  }
  await p.waitForFunction(() => !document.querySelector("#app").inert);
  return p;
}
async function shot(p, name) {
  if (!process.env.UX_SHOTS) return;
  fs.mkdirSync(process.env.UX_SHOTS, { recursive: true });
  await p.screenshot({ path: path.join(process.env.UX_SHOTS, name + ".png") });
}
async function layout(p, name) {
  const r = await p.evaluate(() => {
    const nodes = [...document.querySelectorAll('#top button, .view.on .btn, .view.on .mini, .view.on .gis-body, .view.on .filters button, .view.on .subtabs button, .view.on [data-cvue], .view.on [data-jt], #tabs button')];
    return { overflow: document.documentElement.scrollWidth - innerWidth,
      small: nodes.filter(e => { const r = e.getBoundingClientRect(); return r.height > 0 && (r.width < 43.9 || r.height < 43.9); }).map(e => e.textContent.trim()),
      age: document.querySelector('#ageName').scrollWidth - document.querySelector('#ageName').clientWidth };
  });
  ok(r.overflow <= 0, name + " : débordement horizontal " + r.overflow);
  ok(!r.small.length, name + " : cibles < 44 px " + r.small.join(", "));
  ok(r.age <= 0, name + " : nom de l’âge tronqué");
}
async function run() {
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  // Premier manche depuis un Atelier vide : récolter, sélectionner le bois, tailler.
  let p = await page(390, false);
  await shot(p, "debut-domaine");
  await p.locator('#tabs [data-tab="atelier"]').click();
  await p.locator('.starter-harvest [data-hloop]').click();
  await p.waitForFunction(n => window.__eclat.E.count("bois") >= n, D.ITEMS.manche.r[1].bois);
  await p.locator('[data-inv="bois"]').click();
  await p.locator('#forge').click();
  await p.waitForFunction(() => window.__eclat.E.state.made.manche >= 1);
  ok(await p.evaluate(() => window.__eclat.U.tab === "atelier"), "Premier manche sans quitter l’Atelier");
  await p.locator('#actbar [data-ab="harvest"]').click();
  ok(await p.evaluate(() => window.__eclat.U.tab === "domaine" && !window.__eclat.U.mcur), "La barre de récolte ouvre le Domaine, pas les commandes vides");
  await p.locator('[data-hloop="lisiere:bois"]').click();
  ok(await p.evaluate(() => !window.__eclat.E.state.act), "Arrêter termine la récolte");
  const before = await p.evaluate(() => window.__eclat.E.count("bois"));
  await p.locator('[data-harv="lisiere:bois"]').focus(); await p.keyboard.press("Enter");
  ok(await p.evaluate(n => window.__eclat.E.count("bois") > n, before), "Récolte manuelle au clavier");
  ok(!p.errors.length, p.errors.join("\n")); await p.context().close();
  for (const width of [320, 360, 390, 430]) for (const large of [false, true]) {
    p = await page(width, true, large);
    const crowdedHeader = await p.evaluate(() => {
      const buttons = [...document.querySelectorAll('#top button.hidden')];
      buttons.forEach(b => b.classList.remove('hidden'));
      const overflow = document.documentElement.scrollWidth - innerWidth;
      buttons.forEach(b => b.classList.add('hidden'));
      return overflow;
    });
    ok(crowdedHeader <= 0, 'En-tête avec exploration, compte et conseil : ' + width + ' déborde de ' + crowdedHeader);
    for (const tab of ["domaine", "carte", "atelier", "carnet", "journal"]) {
      await p.locator('#tabs [data-tab="' + tab + '"]').click();
      await layout(p, width + "/" + large + "/" + tab);
      if (width === 390 && !large) await shot(p, "avance-" + tab);
    }
    await p.locator('#tabs [data-tab="domaine"]').click();
    await p.evaluate(() => { document.querySelector('#views').scrollTop = 420; });
    const scroll = await p.locator('#views').evaluate(e => e.scrollTop);
    await p.locator('#tabs [data-tab="atelier"]').click();
    await p.locator('#tabs [data-tab="domaine"]').click();
    ok(Math.abs(await p.locator('#views').evaluate(e => e.scrollTop) - scroll) <= 1, "Défilement conservé " + width);
    await p.locator('#menuBtn').focus(); await p.keyboard.press("Enter");
    await p.waitForTimeout(500);
    ok(await p.locator('#app').evaluate(e => e.inert), "Arrière-plan inerte pendant le menu");
    await p.keyboard.press("Shift+Tab");
    ok(await p.evaluate(() => document.querySelector('#modal').contains(document.activeElement)), "Focus dans le menu");
    await p.keyboard.press("Escape"); await p.waitForTimeout(100);
    ok(await p.evaluate(() => !document.querySelector('#app').inert && document.activeElement.id === 'menuBtn'), "Retour du focus après Échap");
    ok(!p.errors.length, p.errors.join("\n"));
    await p.context().close();
  }
  // Les écrans avancés qui partagent les commandes et la pile de fenêtres.
  p = await page(390, true);
  await p.locator('#tabs [data-tab="carnet"]').click();
  await p.locator('[data-cvue="arbre"]').click();
  ok(await p.locator('#arbre').isVisible(), "Arbre du Carnet disponible");
  await layout(p, "Carnet arbre"); await shot(p, "avance-arbre");
  await p.locator('[data-cvue="liste"]').click();
  await p.locator('#cq').fill('manche');
  const quantity = await p.evaluate(() => window.__eclat.E.state.made.manche || 0);
  await p.locator('[data-cr="manche"][data-n="10"]').click();
  ok(await p.evaluate(n => window.__eclat.E.queued('manche') > 0 || window.__eclat.E.state.made.manche > n, quantity), "Commande ×10 depuis le Carnet");
  await p.locator('#actbar [data-ab="hands"]').click(); await p.waitForTimeout(500);
  ok(await p.locator('#modal').innerText().then(t => t.includes('Manche')), "La barre de commande ouvre ses détails");
  await p.keyboard.press('Escape'); await p.waitForTimeout(100);
  await p.locator('#memBtn').click(); await p.waitForTimeout(500);
  await p.locator('#modal [data-m="releve"]').click(); await p.waitForTimeout(600);
  const confirm = await p.locator('#modal').innerText();
  ok(/conservé/i.test(confirm) && /remis à zéro/i.test(confirm), "La relève expose ce qui reste et ce qui est perdu");
  await shot(p, "releve-confirmation");
  await p.keyboard.press('Escape'); await p.waitForTimeout(100);
  await p.locator('#menuBtn').click(); await p.waitForTimeout(500);
  await p.locator('#modal [data-m="saves"]').click(); await p.waitForTimeout(600);
  ok(await p.locator('#modal [data-m="dl"]').isVisible(), "Export de sauvegarde accessible");
  const downloadPromise = p.waitForEvent('download');
  await p.locator('#modal [data-m="dl"]').click();
  const download = await downloadPromise;
  ok(download.suggestedFilename().endsWith('.json'), "Export au format JSON");
  const exported = fs.readFileSync(await download.path(), 'utf8');
  const restored = createEngine(); restored.load(exported);
  ok(restored.state.known.manche && restored.state.age === 7, "Export réimportable sans perte de recettes ni d’âge");
  ok(!p.errors.length, p.errors.join('\n')); await p.context().close();
  console.log("UX mobile : " + checks + " contrôles réussis.");
}
run().catch(e => { console.error(e); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); server.close(); });
