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
  // L’arbre en plein écran (0.14.0) : ouverture et fermeture, surface utile, rail des âges, étiquettes, cibles, entrée depuis une fiche.
  for (const [width, large] of [[390, false], [390, true], [320, false], [320, true]]) {
    p = await page(width, true, large);
    const nom = width + " " + (large ? "Veillée + grand texte" : "Jour") + " arbre";
    const surfaceMin = width === 320 ? 360 : 650;
    await p.locator('#tabs [data-tab="carnet"]').click();
    await p.locator('[data-cvue="arbre"]').click();
    await p.locator("#arbplein").waitFor({ state: "visible" });
    await p.waitForTimeout(300);
    ok(await p.evaluate(() => document.activeElement && document.activeElement.dataset.arb === "fermer"), nom + " : le focus va sur le retour");
    ok(await p.evaluate(() => document.querySelector("#app").inert), nom + " : l’arrière-plan est inerte");
    const m = await p.evaluate(() => {
      const v = document.getElementById("arbre"), vr = v.getBoundingClientRect();
      const bar = [...document.querySelectorAll("#arbplein .arb-barre button")].map((b) => { const r = b.getBoundingClientRect(); return { t: b.getAttribute("aria-label") || b.textContent.trim(), w: r.width, h: r.height }; });
      const vus = [...document.querySelectorAll("#arbre .arb-n .arb-l, #arbre .arb-l")].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.bottom > vr.top && r.top < vr.bottom && r.right > vr.left && r.left < vr.right; });
      const k = window.__eclat.U.arbreVue.k;
      return { surface: v.clientHeight, k, bar, etiquettes: vus.length, plusPetite: Math.min(...vus.map((e) => parseFloat(getComputedStyle(e).fontSize) * k)), debord: document.documentElement.scrollWidth - innerWidth };
    });
    ok(m.surface >= surfaceMin, nom + " : surface utile " + m.surface + " px (au moins " + surfaceMin + ")");
    ok(m.bar.every((b) => b.w >= 43.9 && b.h >= 43.9), nom + " : cibles de la barre < 44 px " + JSON.stringify(m.bar.filter((b) => b.w < 43.9 || b.h < 43.9)));
    ok(m.k === 1 && m.etiquettes > 3 && m.plusPetite >= 11, nom + " : étiquettes de " + m.plusPetite + " px à l’échelle " + m.k + " (" + m.etiquettes + " visibles)");
    ok(m.debord <= 0, nom + " : débordement horizontal " + m.debord);
    // le rail : toucher un âge y amène la vue, et le repère « au centre » suit
    await p.locator('#arbplein [data-arbage="2"]').click();
    await p.waitForTimeout(450);
    ok(await p.evaluate(() => { const b = document.querySelector("#arbplein .arb-rb.centre"); return !!b && b.dataset.arbage === "2"; }), nom + " : le rail amène la vue à l’âge touché");
    await p.locator('#arbplein [data-arbage="2"]').focus(); await p.keyboard.press("ArrowUp");
    ok(await p.evaluate(() => document.activeElement.dataset.arbage === "3"), nom + " : le rail se parcourt aux flèches");
    // − puis + : les trois niveaux
    await p.locator('#arbplein [data-arb="moins"]').click(); await p.locator('#arbplein [data-arb="moins"]').click(); await p.waitForTimeout(200);
    ok(await p.evaluate(() => document.getElementById("arbre").dataset.niv === "loin" && !document.querySelector("#arbre .arb-loin").hidden), nom + " : niveau loin, les âges et leur compte");
    const loin = await p.evaluate(() => [...document.querySelectorAll("#arbre .arb-lb:not(.futur)")].map((b) => ({ n: parseFloat(getComputedStyle(b.querySelector(".arb-lb-n")).fontSize), h: b.getBoundingClientRect().height })));
    ok(loin.length >= 8 && loin.every((b) => b.n >= 12), nom + " : noms d’âge d’au moins 12 px au niveau loin");
    ok(await p.evaluate(() => { const v = document.getElementById("arbre"), l = document.querySelector("#arbre .arb-loin"); return l.scrollHeight <= v.clientHeight + 1; }), nom + " : les âges tiennent sans défilement");
    await p.locator('#arbplein [data-arbband="5"]').click(); await p.waitForTimeout(450);
    ok(await p.evaluate(() => document.getElementById("arbre").dataset.niv !== "loin"), nom + " : toucher une bande vient dessus");
    // Échap ferme et rend le focus au bouton qui a ouvert
    await p.keyboard.press("Escape"); await p.waitForTimeout(100);
    ok(await p.evaluate(() => !document.getElementById("arbplein") && !document.querySelector("#app").inert && document.activeElement.dataset.cvue === "arbre"), nom + " : Échap ferme et rend le focus");
    ok(!p.errors.length, p.errors.join("\n")); await p.context().close();
  }
  // Depuis la fiche d’un objet : « Voir dans l’arbre » ouvre la vue sur lui, choisi
  p = await page(390, true);
  await p.evaluate(() => { document.querySelector("#views").insertAdjacentHTML("beforeend", '<button id="essai-goto" data-goto="manche"></button>'); });
  await p.locator("#essai-goto").evaluate((b) => b.click());
  await p.locator('#modal [data-m="arbre"]').waitFor({ state: "visible" }); await p.waitForTimeout(500); // la fenêtre finit de s’ouvrir
  await p.locator('#modal [data-m="arbre"]').click();
  await p.locator("#arbplein").waitFor({ state: "visible" }); await p.waitForTimeout(500);
  ok(await p.evaluate(() => { const s = document.querySelector("#arbre .arb-n.sel"); return !!s && s.dataset.arbn === "manche" && !document.querySelector("#arbre .arb-fiche").hidden; }), "Fiche → arbre : le nœud est choisi et son bandeau ouvert");
  ok(await p.evaluate(() => { const s = document.querySelector("#arbre .arb-n.sel").getBoundingClientRect(), v = document.getElementById("arbre").getBoundingClientRect(), f = document.querySelector("#arbre .arb-fiche").getBoundingClientRect(); return s.top >= v.top && s.bottom <= f.top + 1; }), "Fiche → arbre : le bandeau ne recouvre pas le nœud");
  ok(await p.evaluate(() => document.querySelector("#arbre .arb-fiche").getBoundingClientRect().height <= 140), "Le bandeau reste bas");
  await p.keyboard.press("Escape"); await p.waitForTimeout(100);
  ok(!p.errors.length, p.errors.join("\n")); await p.context().close();
  p = await page(390, true);
  await p.locator('#tabs [data-tab="carnet"]').click();
  await layout(p, "Carnet (liste)");
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
