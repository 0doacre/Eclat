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
async function pageBrut(width, o) {
  const ctx = await browser.newContext({ viewport: { width, height: width === 320 ? 568 : 844 }, hasTouch: true, serviceWorkers: "block", reducedMotion: "reduce" });
  const q = await ctx.newPage();
  q.errors = []; q.on("pageerror", e => q.errors.push(e.message));
  await q.addInitScript(raw => { localStorage.setItem("eclat.save.v1", raw); }, saveOpt(o));
  await q.goto("http://127.0.0.1:" + server.address().port);
  await q.waitForFunction(() => !!window.__eclat);
  return q;
}
/* la partie avancée, avec une version d’origine, une absence (en secondes) et le guide à la demande */
function saveOpt(o) {
  const E = createEngine();
  E.load(fs.readFileSync(path.join(ROOT, "tools/fixtures/save-v5-age8-usine.json"), "utf8"));
  const st = E.state;
  st.t = Date.now() - (o.absent || 0) * 1000; st.introSeen = true; st.flags.ver = o.ver || D.VERSION;
  Object.assign(st.settings, { tuto: !!o.tuto, sound: false, visiteurs: false, largeText: false, theme: "light" });
  return E.serialize();
}
const inter = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
async function etatFenetres(q) {
  return q.evaluate(() => {
    const m = document.querySelector("#modal"), visible = !m.classList.contains("hidden"), h = visible && m.querySelector("h2");
    const tu = document.querySelector(".tuto:not(.hidden)"), bub = tu && tu.querySelector(".tu-bub");
    const box = (e) => { const r = e.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom }; };
    return { visible, titre: h ? h.textContent : "", bulle: !!tu, rect: bub ? box(bub) : null,
      onglets: box(document.getElementById("tabs")), entete: box(document.getElementById("top")), file: window.__eclat.U.fen.attente() };
  });
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
  // L’onglet Arbre (0.15.0) : entre l’Atelier et le Carnet, surface utile, rail des âges, étiquettes, cibles, entrée depuis une fiche.
  for (const [width, large] of [[390, false], [390, true], [320, false], [320, true]]) {
    p = await page(width, true, large);
    const nom = width + " " + (large ? "Veillée + grand texte" : "Jour") + " arbre";
    const surfaceMin = width === 320 ? 360 : 650;
    ok(await p.evaluate(() => [...document.querySelectorAll("#tabs button:not(.hidden)")].map((b) => b.dataset.tab).join() === "domaine,carte,atelier,arbre,carnet,journal"), nom + " : l’onglet Arbre est entre l’Atelier et le Carnet");
    await p.locator('#tabs [data-tab="arbre"]').click();
    await p.locator("#v-arbre #arbre").waitFor({ state: "visible" });
    await p.waitForTimeout(300);
    ok(await p.evaluate(() => !document.querySelector("#app").inert && !document.querySelector("[data-cvue]")), nom + " : un onglet, pas une fenêtre ; plus d’interrupteur dans le Carnet");
    ok(await p.evaluate(() => { const t = document.querySelector("#tabs").getBoundingClientRect(), v = document.getElementById("arbre").getBoundingClientRect(); return v.bottom <= t.top + 1 && v.width <= innerWidth + 1; }), nom + " : l’arbre s’arrête au-dessus des onglets");
    ok(await p.evaluate(() => getComputedStyle(document.querySelector("#arbre .arb-t:not(.loin)")).opacity === "0.6"), nom + " : traits à 60 % quand rien n’est choisi");
    const m = await p.evaluate(() => {
      const v = document.getElementById("arbre"), vr = v.getBoundingClientRect();
      const bar = [...document.querySelectorAll("#v-arbre .arb-barre button")].map((b) => { const r = b.getBoundingClientRect(); return { t: b.getAttribute("aria-label") || b.textContent.trim(), w: r.width, h: r.height }; });
      const vus = [...document.querySelectorAll("#arbre .arb-n .arb-l, #arbre .arb-l")].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.bottom > vr.top && r.top < vr.bottom && r.right > vr.left && r.left < vr.right; });
      const k = window.__eclat.U.arbreVue.k;
      return { surface: v.clientHeight, k, bar, etiquettes: vus.length, plusPetite: Math.min(...vus.map((e) => parseFloat(getComputedStyle(e).fontSize) * k)), debord: document.documentElement.scrollWidth - innerWidth };
    });
    ok(m.surface >= surfaceMin, nom + " : surface utile " + m.surface + " px (au moins " + surfaceMin + ")");
    ok(m.bar.every((b) => b.w >= 43.9 && b.h >= 43.9), nom + " : cibles de la barre < 44 px " + JSON.stringify(m.bar.filter((b) => b.w < 43.9 || b.h < 43.9)));
    ok(m.k === 1 && m.etiquettes > 3 && m.plusPetite >= 11, nom + " : étiquettes de " + m.plusPetite + " px à l’échelle " + m.k + " (" + m.etiquettes + " visibles)");
    ok(m.debord <= 0, nom + " : débordement horizontal " + m.debord);
    const rail = await p.evaluate(() => [...document.querySelectorAll("#v-arbre .arb-rb")].map((b) => { const r = b.getBoundingClientRect(); return { w: r.width, h: r.height }; }));
    ok(rail.length === 13 && rail.every((b) => b.w >= 43.9 && b.h >= 43.9), nom + " : les âges de la réglette font au moins 44 px " + JSON.stringify(rail.filter((b) => b.w < 43.9 || b.h < 43.9)));
    // le rail : toucher un âge y amène la vue, et le repère « au centre » suit
    await p.locator('#v-arbre [data-arbage="2"]').click();
    await p.waitForTimeout(450);
    ok(await p.evaluate(() => { const b = document.querySelector("#v-arbre .arb-rb.centre"); return !!b && b.dataset.arbage === "2"; }), nom + " : le rail amène la vue à l’âge touché");
    await p.locator('#v-arbre [data-arbage="2"]').focus(); await p.keyboard.press("ArrowUp");
    ok(await p.evaluate(() => document.activeElement.dataset.arbage === "3"), nom + " : le rail se parcourt aux flèches");
    // − puis + : les trois niveaux
    await p.locator('#v-arbre [data-arb="moins"]').click(); await p.locator('#v-arbre [data-arb="moins"]').click(); await p.waitForTimeout(200);
    ok(await p.evaluate(() => document.getElementById("arbre").dataset.niv === "loin" && !document.querySelector("#arbre .arb-loin").hidden), nom + " : niveau loin, les âges et leur compte");
    const loin = await p.evaluate(() => [...document.querySelectorAll("#arbre .arb-lb:not(.futur)")].map((b) => ({ n: parseFloat(getComputedStyle(b.querySelector(".arb-lb-n")).fontSize), h: b.getBoundingClientRect().height })));
    ok(loin.length >= 8 && loin.every((b) => b.n >= 12), nom + " : noms d’âge d’au moins 12 px au niveau loin");
    ok(await p.evaluate(() => { const v = document.getElementById("arbre"), l = document.querySelector("#arbre .arb-loin"); return l.scrollHeight <= v.clientHeight + 1; }), nom + " : les âges tiennent sans défilement");
    await p.locator('#v-arbre [data-arbband="5"]').click(); await p.waitForTimeout(450);
    ok(await p.evaluate(() => document.getElementById("arbre").dataset.niv !== "loin"), nom + " : toucher une bande vient dessus");
    // largeur de l’appli, déplacement conservé : l’arbre ne dépasse pas l’écran et se glisse
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), nom + " : pas de débordement horizontal");
    ok(!p.errors.length, p.errors.join("\n")); await p.context().close();
  }
  // Depuis la fiche d’un objet : « Voir dans l’arbre » ouvre la vue sur lui, choisi
  p = await page(390, true);
  await p.evaluate(() => { document.querySelector("#views").insertAdjacentHTML("beforeend", '<button id="essai-goto" data-goto="manche"></button>'); });
  await p.locator("#essai-goto").evaluate((b) => b.click());
  await p.locator('#modal [data-m="arbre"]').waitFor({ state: "visible" }); await p.waitForTimeout(500); // la fenêtre finit de s’ouvrir
  await p.locator('#modal [data-m="arbre"]').click();
  await p.locator("#v-arbre #arbre").waitFor({ state: "visible" }); await p.waitForTimeout(500);
  ok(await p.evaluate(() => { const s = document.querySelector("#arbre .arb-n.sel"); return !!s && s.dataset.arbn === "manche" && !document.querySelector("#arbre .arb-fiche").hidden; }), "Fiche → arbre : le nœud est choisi et son bandeau ouvert");
  ok(await p.evaluate(() => { const s = document.querySelector("#arbre .arb-n.sel").getBoundingClientRect(), v = document.getElementById("arbre").getBoundingClientRect(), f = document.querySelector("#arbre .arb-fiche").getBoundingClientRect(); return s.top >= v.top && s.bottom <= f.top + 1; }), "Fiche → arbre : le bandeau ne recouvre pas le nœud");
  ok(await p.evaluate(() => document.querySelector("#arbre .arb-fiche").getBoundingClientRect().height <= 140), "Le bandeau reste bas");
  ok(await p.evaluate(() => document.body.dataset.tab === "arbre"), "Fiche → arbre : on est sur l’onglet Arbre");
  ok(!p.errors.length, p.errors.join("\n")); await p.context().close();
  p = await page(390, true);
  await p.locator('#tabs [data-tab="carnet"]').click();
  await layout(p, "Carnet (liste)");
  await p.locator('#cq').fill('manche');
  const quantity = await p.evaluate(() => window.__eclat.E.state.made.manche || 0);
  // la quantité se choisit une fois, se mémorise, et « Fabriquer » la lance en un appui
  await p.locator('.qtybar [data-qty="10"]').click();
  ok(await p.evaluate(() => window.__eclat.E.state.flags.carnetQty === 10 && document.querySelector('[data-cr="manche"]').textContent.trim() === "Fabriquer ×10"), "Carnet : la quantité choisie est mémorisée et lue sur le bouton");
  ok(await p.evaluate(() => { const q = document.querySelector(".qtybar").getBoundingClientRect(), r = document.querySelector('[data-cr="manche"]').closest(".rec").getBoundingClientRect(); return q.height >= 44 && r.height < 200; }), "Carnet : sélecteur de quantité de 44 px, carte de recette sur une seule rangée d’actions");
  await p.locator('[data-cr="manche"][data-n="10"]').click();
  ok(await p.evaluate(n => window.__eclat.E.queued('manche') > 0 || window.__eclat.E.state.made.manche > n, quantity), "Commande ×10 depuis le Carnet");
  await p.locator('#tabs [data-tab="atelier"]').click(); await p.locator('#tabs [data-tab="carnet"]').click();
  ok(await p.evaluate(() => window.__eclat.E.state.flags.carnetQty === 10 && document.querySelector(".chipq.on").dataset.qty === "10"), "Carnet : la quantité reste après un changement d’onglet");
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
  // 0.13.3 : les fenêtres du lancement et du retour d’absence
  for (const width of [390, 320]) {
    // une partie qui revient d’une version précédente, après 400 s, le guide actif : les fenêtres passent une à une, le guide attend
    p = await pageBrut(width, { ver: "0.12.0", absent: 400, tuto: true });
    const vus = [], rects = [];
    for (let i = 0; i < 70; i++) {
      await p.waitForTimeout(100);
      const s = await etatFenetres(p);
      if ((s.visible || s.file.length) && s.bulle) ok(false, width + " : une bulle de tutoriel pendant une fenêtre ou une file");
      if (s.rect) rects.push(s);
      if (s.visible && !vus.includes(s.titre)) { vus.push(s.titre); await p.waitForTimeout(450); await p.evaluate(() => window.__eclat.closeModal()); }
    }
    ok(vus.length === 2 && vus[0] === "Ta partie a été conservée" && vus[1] === "Bon retour !", width + " : les fenêtres passent dans l’ordre, une à une (" + vus.join(" ; ") + ")");
    ok(!p.errors.length, p.errors.join("\n")); await p.context().close();

    // une absence de 90 s n’ouvre aucune fenêtre, un message discret suffit
    p = await pageBrut(width, { absent: 90 });
    let fenetre = false, message = false;
    for (let i = 0; i < 30; i++) {
      await p.waitForTimeout(100);
      if (await p.evaluate(() => { const m = document.querySelector("#modal"); return !m.classList.contains("hidden") && /Bon retour/.test(m.innerText); })) fenetre = true;
      if (await p.locator('#toasts [data-k="absence"]').count()) message = true;
    }
    ok(!fenetre, width + " : 90 s d’absence n’ouvrent pas « Bon retour »");
    ok(message, width + " : 90 s d’absence disent ce qui a été récolté, sans fenêtre");
    ok(!p.errors.length, p.errors.join("\n")); await p.context().close();

    // une absence de 400 s ouvre « Pendant ton absence »
    p = await pageBrut(width, { absent: 400 });
    let retour = false;
    for (let i = 0; i < 60 && !retour; i++) {
      await p.waitForTimeout(100);
      const s = await etatFenetres(p);
      if (s.visible && s.titre === "Bon retour !") retour = true;
      else if (s.visible) { await p.waitForTimeout(450); await p.evaluate(() => window.__eclat.closeModal()); }
    }
    ok(retour, width + " : 400 s d’absence ouvrent « Bon retour »");
    await p.context().close();

    // pendant une bulle de tutoriel, chaque onglet répond, et la bulle ne couvre ni la barre d’onglets ni l’en-tête
    p = await pageBrut(width, { tuto: true });
    for (let i = 0; i < 20; i++) { // les nouveautés d’une partie migrée passent d’abord
      await p.waitForTimeout(150);
      if (await p.evaluate(() => !document.querySelector("#modal").classList.contains("hidden"))) { await p.waitForTimeout(450); await p.evaluate(() => window.__eclat.closeModal()); }
      else if (!(await p.evaluate(() => window.__eclat.U.fen.attente().length))) break;
    }
    await p.waitForFunction(() => !!document.querySelector(".tuto:not(.hidden)"), null, { timeout: 8000 });
    const s0 = await etatFenetres(p);
    ok(s0.bulle && !inter(s0.rect, s0.onglets) && !inter(s0.rect, s0.entete), width + " : la bulle ne couvre ni les onglets ni l’en-tête");
    for (const tab of ["carte", "atelier", "carnet", "journal", "domaine"]) {
      await p.locator('#tabs [data-tab="' + tab + '"]').tap();
      await p.waitForTimeout(250);
      ok(await p.evaluate(x => window.__eclat.U.tab === x, tab), width + " : l’onglet " + tab + " répond pendant une bulle");
      const s = await etatFenetres(p);
      if (s.rect) ok(!inter(s.rect, s.onglets) && !inter(s.rect, s.entete), width + " : bulle hors de la barre et de l’en-tête sur " + tab);
    }
    ok(!p.errors.length, p.errors.join("\n")); await p.context().close();
  }
  // La première relève (cycle 1, premier parcours fini) : la fenêtre s’ouvre, le relais se passe, le savoir reste.
  p = await page(390, false);
  await p.evaluate(() => {
    const st = window.__eclat.E.state;
    st.meta.parcours = true; st.meta.forcedDone = false; st.cycle = 1; st.flags.extDone = true; st.exp.done.lisiere = 1;
    st.known.manche = 1;
    window.__eclat.E.emit("struct");
  });
  await p.waitForFunction(() => !document.querySelector("#modal").classList.contains("hidden") && /La nuit tombe/.test(document.querySelector("#modal").innerText), null, { timeout: 5000 });
  ok(!p.errors.length, "Première relève : la fenêtre s’ouvre sans erreur " + p.errors.join(" | "));
  await p.waitForTimeout(3400); // le bouton apparaît en fondu
  await p.locator('#modal [data-m="go"]').click();
  await p.waitForFunction(() => window.__eclat.E.state.cycle === 2, null, { timeout: 5000 });
  ok(await p.evaluate(() => window.__eclat.E.state.known.manche > 0 && window.__eclat.E.state.meta.forcedDone), "Première relève : le cycle 2 commence, le savoir est conservé");
  ok(!p.errors.length, "Première relève : aucune erreur après le relais " + p.errors.join(" | ")); await p.context().close();
  // L’Atelier court (0.15.5) : les actions tiennent sur une rangée, la première rangée de ressources et le gros bouton sont dans la première vue ;
  // sur très petit écran, une ressource touchée fait venir le petit établi, avec son bouton, sans remonter.
  for (const [width, haut] of [[390, 844], [320, 568]]) {
    p = await page(width, true);
    await p.locator('#tabs [data-tab="atelier"]').click();
    await p.evaluate(() => { const s = window.__eclat.E.state; s.flags.tip_niveaux = true; window.__eclat.U.last = null; window.__eclat.render(true); });
    await p.waitForTimeout(300);
    const m = await p.evaluate(() => {
      const nav = document.querySelector("#tabs").getBoundingClientRect().top, r = (s) => { const e = document.querySelector(s); return e ? e.getBoundingClientRect() : null; };
      const g = r(".gestes"), f = r("#forge"), t = r("#v-atelier [data-inv]");
      return { nav, gestes: g && g.height, forge: f && f.bottom, tuile: t && t.bottom };
    });
    ok(m.gestes <= 90, width + " : les actions tiennent sur une rangée (" + m.gestes + " px)");
    if (width === 390) {
      ok(m.forge <= m.nav && m.tuile <= m.nav + 1, width + " : le gros bouton (" + Math.round(m.forge) + ") et une rangée de ressources (" + Math.round(m.tuile) + ") tiennent au-dessus des onglets (" + Math.round(m.nav) + ")");
    } else {
      await p.locator("#v-atelier [data-inv]").first().scrollIntoViewIfNeeded();
      await p.locator("#v-atelier [data-inv]").first().tap();
      await p.waitForTimeout(300);
      const mb = await p.evaluate(() => { const e = document.querySelector("#mbench"), b = document.querySelector("#mbench [data-forge]"); if (!e || e.classList.contains("hidden") || !b) return null; const r = b.getBoundingClientRect(); return { top: r.top, h: r.height, w: r.width }; });
      ok(mb && mb.h >= 43.9 && mb.top >= 0, width + " : une ressource touchée fait venir le petit établi et son bouton " + JSON.stringify(mb));
    }
    ok(!p.errors.length, p.errors.join("\n")); await p.context().close();
  }
  // Une commande qui attend une ressource : la feuille des commandes dit d’où elle vient et mène à son gisement.
  p = await page(390, true);
  await p.locator('#tabs [data-tab="atelier"]').click();
  await p.evaluate(() => { const E = window.__eclat.E; E.state.inv = {}; E.order("manche", 500); });
  await p.locator('#actbar [data-ab="hands"]').click();
  await p.locator("#modal .limit").first().waitFor({ state: "visible" });
  ok(await p.evaluate(() => /Bois/.test(document.querySelector("#modal .limit").innerText)), "Commande bloquée : la ressource limitante est nommée");
  await p.waitForTimeout(500);
  await p.locator("#modal [data-gz]").first().click();
  await p.waitForFunction(() => document.body.dataset.tab === "domaine" && document.querySelector("#modal").classList.contains("hidden"), null, { timeout: 3000 });
  ok(!p.errors.length, "Commande bloquée : « Aller au gisement » mène au Domaine sans erreur " + p.errors.join(" | ")); await p.context().close();
  console.log("UX mobile : " + checks + " contrôles réussis.");
}
run().catch(e => { console.error(e); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); server.close(); });
