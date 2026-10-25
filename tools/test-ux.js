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
  // Arbre vertical : cartes lisibles, largeur fixe, navigation et défilement natifs.
  for (const width of [320, 360, 390, 430]) for (const large of [false, true]) {
    p = await page(width, true, large);
    const nom = width + '/' + large + ' arbre';
    await p.locator('#tabs [data-tab="arbre"]').click();
    await p.locator('#arbre').waitFor({state:'visible'});
    await p.locator('[data-arb="ensemble"]').click();
    const mesure = await p.evaluate(() => {
      const v = document.getElementById('arbre'), r = v.getBoundingClientRect();
      const cards = [...v.querySelectorAll('details[open] .arb-card')];
      return { largeur:v.clientWidth, contenu:v.scrollWidth, ecran:innerWidth,
        fin:r.bottom, nav:document.getElementById('tabs').getBoundingClientRect().top,
        polices:cards.map(c=>parseFloat(getComputedStyle(c.querySelector('.arb-l')).fontSize)),
        texteCoupe:cards.some(c=>c.scrollWidth>c.clientWidth),
        cibles:[...document.querySelectorAll('.arb-barre button')].map(c=>{const b=c.getBoundingClientRect();return Math.min(b.width,b.height);}) };
    });
    ok(mesure.contenu===mesure.largeur && mesure.largeur<=width, nom+' : contenu à la largeur du téléphone');
    ok(mesure.fin<=mesure.nav+1,nom+' : aucun contenu sous les onglets');
    ok(mesure.polices.length>0 && mesure.polices.every(n=>n>=14) && !mesure.texteCoupe,nom+' : noms lisibles sans troncature');
    ok(mesure.cibles.every(n=>n>=43.9),nom+' : cibles de 44 px');
    // La molette reste un déplacement vertical, même avec une composante latérale.
    await p.locator('#arbre').evaluate(v=>{v.scrollTop=0;});
    await p.locator('#arbre').hover();await p.mouse.wheel(100,450);await p.waitForTimeout(200);
    ok(await p.evaluate(()=>{const v=document.getElementById('arbre');return v.scrollTop>0&&v.scrollLeft===0;}),nom+' : défilement vertical sans dérive latérale');
    await p.locator('[data-arb="chercher"]').click();await p.locator('#arbq').fill('bobine');
    await p.locator('#arbres [data-arbsel="bobine"]').click();
    ok(await p.locator('.arb-selection .arb-l').innerText()==='Bobine de cuivre',nom+' : sélection depuis la recherche');
    ok(await p.locator('#arb-ingredients').count()===1,nom+' : ingrédients présents');
    ok(await p.evaluate(()=>{const v=document.getElementById('arbre'),c=v.querySelector('.sel');return v.scrollWidth===v.clientWidth&&c.getBoundingClientRect().width<=v.clientWidth&&getComputedStyle(v).touchAction==='pan-y';}),nom+' : branche contenue et geste vertical natif');
    await p.locator('[data-arbsel="fil_cuivre"]').first().click();
    ok((await p.locator('.arb-selection .arb-l').innerText()).includes('Fil de cuivre'),nom+' : navigation vers un ingrédient');
    await p.locator('[data-arb="retour"]').click();
    ok((await p.locator('.arb-selection .arb-l').innerText()).includes('Bobine'),nom+' : retour dans la branche');
    // Un redimensionnement conserve la recette choisie et ne crée pas d’axe horizontal.
    await p.setViewportSize({width:width===320?430:320,height:700});await p.waitForTimeout(100);
    ok(await p.evaluate(()=>{const v=document.getElementById('arbre');return v.scrollWidth===v.clientWidth&&v.querySelector('.sel').dataset.arbn==='bobine';}),nom+' : largeur recalculée après redimensionnement');
    ok(!p.errors.length,p.errors.join('\n'));await p.context().close();
  }
  // Accessibilité (0.15.8) : le clavier, les noms, la Carte, l’alternative à l’appui long, et les contrastes mesurés.
  p = await page(390, true);
  await p.locator('#tabs [data-tab="atelier"]').click(); await p.waitForTimeout(300);
  await p.locator("#v-atelier .inv").first().focus(); await p.keyboard.press("Enter"); await p.waitForTimeout(250);
  ok(await p.evaluate(() => window.__eclat.U.slots.some(Boolean) && document.activeElement.classList.contains("inv")), "Clavier : Entrée pose la ressource sur l’établi et le focus reste sur elle");
  await p.keyboard.press("i"); await p.waitForTimeout(500);
  ok(await p.evaluate(() => !document.querySelector("#modal").classList.contains("hidden")), "Clavier : « i » ouvre la fiche de la ressource, sans appui long");
  await p.evaluate(() => window.__eclat.closeModal()); await p.waitForTimeout(200);
  await p.evaluate(() => { window.__eclat.U.slots = [null, null, null]; });
  await p.locator("[data-fichemode]").click();
  await p.locator("#v-atelier .inv").first().click(); await p.waitForTimeout(500);
  ok(await p.evaluate(() => !document.querySelector("#modal").classList.contains("hidden") && !window.__eclat.U.slots.some(Boolean)), "« ⓘ Fiches » : un appui ouvre la fiche au lieu de poser (alternative à l’appui long)");
  await p.evaluate(() => window.__eclat.closeModal()); await p.waitForTimeout(200);
  for (const tab of ["domaine", "carte", "atelier", "arbre", "carnet", "journal"]) {
    await p.locator('#tabs [data-tab="' + tab + '"]').click(); await p.waitForTimeout(350);
    const mal = await p.evaluate(() => {
      const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
      const nom = (e) => (e.getAttribute("aria-label") || e.getAttribute("title") || e.innerText || e.textContent || "").trim();
      const racine = document.querySelector(".view.on");
      return [...racine.querySelectorAll("button, [role=button], a, input, select")].filter(vis).filter((e) => !nom(e)).map((e) => e.outerHTML.slice(0, 80))
        .concat([...racine.querySelectorAll("[data-goto]")].filter(vis).filter((e) => !(e.tagName === "BUTTON" || e.getAttribute("tabindex") !== null)).map((e) => "non focalisable : " + e.outerHTML.slice(0, 60)));
    });
    ok(!mal.length, "Accessibilité : " + tab + " : contrôles sans nom ou hors clavier " + JSON.stringify(mal));
  }
  await p.locator('#tabs [data-tab="carte"]').click(); await p.waitForTimeout(400);
  const lieu = p.locator('#v-carte [data-cl][tabindex="0"]').first();
  ok(await p.locator('#v-carte svg [role="button"][aria-label]').count() >= 3, "Carte : lieux, terres et camp sont des boutons nommés");
  await lieu.focus(); await p.keyboard.press("Enter"); await p.waitForTimeout(500);
  ok(await p.evaluate(() => !document.querySelector("#modal").classList.contains("hidden")), "Carte : Entrée sur un lieu ouvre sa fiche");
  await p.evaluate(() => window.__eclat.closeModal());
  // contrastes : chaque texte à 4,5:1 au moins sur les fonds, dans les six époques et les deux thèmes, sur toutes les couleurs d’âge
  const faibles = await p.evaluate((ages) => {
    const cv = document.createElement("canvas").getContext("2d");
    const rgb = (c) => { cv.clearRect(0, 0, 1, 1); cv.fillStyle = "#000"; cv.fillStyle = c; cv.fillRect(0, 0, 1, 1); const d = cv.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2]]; };
    const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const cr = (a, b) => { const la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); };
    const mal = [];
    for (const dark of [false, true]) for (const ep of ["pigments", "papyrus", "enluminure", "registre", "quadrille", "bord"]) {
      document.body.classList.toggle("theme-dark", dark); document.body.dataset.ep = ep;
      const lire = (v) => { const e = document.createElement("i"); e.style.color = "var(" + v + ")"; document.body.appendChild(e); const c = getComputedStyle(e).color; e.remove(); return rgb(c); };
      const fonds = ["--bg", "--bg2", "--panel", "--panel2"].map(lire);
      for (const t of ["--text", "--muted", "--dim", "--good", "--bad", "--intu"]) { const c = lire(t); for (const f of fonds) { const r = cr(c, f); if (r < 4.5) mal.push((dark ? "Veillée " : "Jour ") + ep + " " + t + " " + r.toFixed(2)); } }
      for (const a of ages) { document.body.style.setProperty("--age", a); const r = cr(lire("--acc"), lire("--bg")); if (r < 4.5) mal.push((dark ? "Veillée " : "Jour ") + ep + " accent " + a + " " + r.toFixed(2)); }
      document.body.style.removeProperty("--age");
    }
    document.body.classList.remove("theme-dark");
    return mal;
  }, D.AGES.map((a) => a.c));
  ok(!faibles.length, "Contrastes : textes sous 4,5:1 " + JSON.stringify(faibles.slice(0, 6)));
  ok(!p.errors.length, p.errors.join("\n")); await p.context().close();
  // Retrouver dans l’arbre : la recherche mène au nœud, et « prêtes » montre ce qu’on peut fabriquer (sans jamais nommer un fantôme).
  p = await page(390, true);
  await p.locator('#tabs [data-tab="arbre"]').click();
  await p.waitForTimeout(500);
  await p.locator('[data-arb="ensemble"]').click();
  ok(await p.evaluate(() => document.querySelectorAll(".arb-card.pret").length > 0 && document.querySelectorAll(".arb-card.pret").length < document.querySelectorAll(".arb-card.allume").length), "Arbre : des recettes prêtes sont marquées, pas toutes");
  await p.locator('[data-arb="prets"]').click(); await p.waitForTimeout(500);
  ok(await p.evaluate(() => document.querySelectorAll(".arb-card").length > 0 && [...document.querySelectorAll("#arbre .arb-card")].every(c => c.classList.contains("pret"))), "Arbre : Fabricables ne montre que les recettes disponibles");
  await p.locator('[data-arb="prets"]').click();
  await p.locator('[data-arb="chercher"]').click();
  await p.locator("#arbq").fill("bobine");
  ok(await p.evaluate(() => [...document.querySelectorAll("#arbres button")].map((b) => b.dataset.arbsel).join() === "bobine"), "Arbre : la recherche trouve la recette connue");
  await p.locator("#arbq").fill("zzzz");
  ok(await p.evaluate(() => document.querySelectorAll("#arbres button").length === 0 && /Rien de tel/.test(document.getElementById("arbres").innerText)), "Arbre : sans résultat, un message");
  await p.locator("#arbq").fill("");
  await p.locator("#arbq").fill("a");
  ok(await p.evaluate(() => [...document.querySelectorAll("#arbres button")].every((b) => !/^f\d/.test(b.dataset.arbsel))), "Arbre : la recherche ne propose jamais un fantôme");
  await p.locator("#arbq").fill("bobine");
  await p.locator("#arbres button").first().click();
  await p.waitForTimeout(500);
  ok(await p.evaluate(() => document.querySelector(".arb-card.sel").dataset.arbn === "bobine" && document.querySelector(".arb-chercher").hidden && !!document.querySelector("#arb-ingredients")), "Arbre : toucher le résultat ouvre la branche");
  await p.locator('[data-arb="chercher"]').click(); await p.locator('#arbq').fill('manche');
  await p.locator('#arbres [data-arbsel="manche"]').click();
  const nbUsages = await p.evaluate(() => window.EclatArbre.voisinage(window.__eclat.U.arbreG, 'manche').aval.filter(n=>n.etat!=='fantome').length);
  ok(nbUsages > 6 && await p.locator('[aria-labelledby="arb-usages"] .arb-card').count() === 6, 'Arbre : les nombreux usages commencent par six cartes');
  await p.locator('[data-arb="tout"]').click();
  ok(await p.locator('[aria-labelledby="arb-usages"] .arb-card').count() === nbUsages, 'Arbre : tous les usages connus restent accessibles');
  await p.evaluate(() => { const b=document.createElement('button'); b.dataset.arbreObj=''; document.querySelector('#views').appendChild(b);b.click(); });
  ok(await p.evaluate(() => { const n=window.__eclat.U.arbreG.noeuds.find(n=>n.objectif);return !!n&&document.querySelector('.arb-card.sel').dataset.arbn===n.cle; }), 'Objectif → arbre : la bonne carte est sélectionnée');
  await p.locator('[data-arb="prets"]').click();
  await p.evaluate(() => { const s=window.__eclat.E.state; for(const x of Object.values(s.dom.ext))x.on=false; s.act=null; s.inv={}; });
  await p.waitForFunction(() => !document.querySelector('#arbre .arb-card'),null,{timeout:4000});
  ok((await p.locator('#arbre').innerText()).includes('Aucune recette fabricable'), 'Arbre : le filtre suit une Réserve qui se vide');
  ok(!p.errors.length, p.errors.join("\n")); await p.context().close();
  // Depuis la fiche d’un objet : « Voir dans l’arbre » ouvre la vue sur lui, choisi
  p = await page(390, true);
  await p.evaluate(() => { document.querySelector("#views").insertAdjacentHTML("beforeend", '<button id="essai-goto" data-goto="manche"></button>'); });
  await p.locator("#essai-goto").evaluate((b) => b.click());
  await p.locator('#modal [data-m="arbre"]').waitFor({ state: "visible" }); await p.waitForTimeout(500); // la fenêtre finit de s’ouvrir
  await p.locator('#modal [data-m="arbre"]').click();
  await p.locator("#v-arbre #arbre").waitFor({ state: "visible" }); await p.waitForTimeout(500);
  ok(await p.evaluate(() => { const s = document.querySelector("#arbre .arb-card.sel"); return !!s && s.dataset.arbn === "manche" && !!document.querySelector("#arb-ingredients"); }), "Fiche → arbre : la recette et ses ingrédients sont affichés");
  ok(await p.evaluate(() => { const s = document.querySelector("#arbre .arb-card.sel").getBoundingClientRect(), v = document.getElementById("arbre").getBoundingClientRect(); return s.top >= v.top && s.bottom <= v.bottom; }), "Fiche → arbre : la sélection reste visible");
  ok(await p.evaluate(() => document.getElementById("arbre").scrollWidth === document.getElementById("arbre").clientWidth), "La branche tient dans la largeur de l’écran");
  ok(await p.evaluate(() => document.body.dataset.tab === "arbre"), "Fiche → arbre : on est sur l’onglet Arbre");
  ok(!p.errors.length, p.errors.join("\n")); await p.context().close();
  p = await page(390, true);
  await p.locator('#tabs [data-tab="carnet"]').click();
  await layout(p, "Carnet (liste)");
  await p.locator('#cq').fill('manche');
  const quantity = await p.evaluate(() => window.__eclat.E.state.made.manche || 0);
  // la quantité se choisit une fois, se mémorise, et « Fabriquer » la lance en un appui
  await p.locator('.qtybar [data-qty="10"]').click();
  ok(await p.evaluate(() => window.__eclat.E.state.flags.carnetQty === 10 && document.querySelector('[data-cr="manche"].make').textContent.trim() === "Fabriquer ×10"), "Carnet : la quantité choisie est mémorisée et lue sur le bouton");
  ok(await p.evaluate(() => { const q = document.querySelector(".qtybar").getBoundingClientRect(), r = document.querySelector('[data-cr="manche"].make').closest(".rec").getBoundingClientRect(); return q.height >= 44 && r.height < 200; }), "Carnet : sélecteur de quantité de 44 px, carte de recette sur une seule rangée d’actions");
  await p.locator('[data-cr="manche"][data-n="10"]').click();
  ok(await p.evaluate(n => window.__eclat.E.queued('manche') > 0 || window.__eclat.E.state.made.manche > n, quantity), "Commande ×10 depuis le Carnet");
  await p.locator('#actbar [data-ab="hands"]').click(); await p.waitForTimeout(500);
  ok(await p.locator('#modal').innerText().then(t => t.includes('Manche')), "La barre de commande ouvre ses détails");
  await p.keyboard.press('Escape'); await p.waitForTimeout(100);
  await p.locator('#tabs [data-tab="atelier"]').click(); await p.locator('#tabs [data-tab="carnet"]').click();
  ok(await p.evaluate(() => window.__eclat.E.state.flags.carnetQty === 10 && document.querySelector(".chipq.on").dataset.qty === "10"), "Carnet : la quantité reste après un changement d’onglet");
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
    st.meta.parcours = true; st.meta.forcedDone = false; st.cycle = 1; st.flags.extDone = true; st.exp.done.lisiere = 1; st.pass.plaine = { paid: {}, done: true };
    st.known.manche = 1;
    window.__eclat.E.emit("struct");
  });
  await p.waitForFunction(() => !document.querySelector("#modal").classList.contains("hidden") && /Fin du premier cycle/.test(document.querySelector("#modal").innerText), null, { timeout: 5000 });
  ok(!p.errors.length, "Première relève : la fenêtre s’ouvre sans erreur " + p.errors.join(" | "));
  // une interface de jeu : ce qu’on gagne, ce qu’on garde, ce qui repart de zéro, et le bouton tout de suite (pas de récit à attendre)
  ok(await p.evaluate(() => { const t = document.querySelector("#modal").innerText, b = document.querySelector('#modal [data-m="go"]').getBoundingClientRect(); return /Tu gagnes/i.test(t) && /Tu gardes/i.test(t) && /Repart de zéro/i.test(t) && /Traces/.test(t) && /Mémoire des mains/.test(t) && !/nuit tombe/i.test(t) && b.height >= 43.9 && b.bottom <= innerHeight; }), "Première relève : la fenêtre dit ce qu’on gagne, garde et perd, sans récit, et le bouton est là tout de suite");
  await p.waitForTimeout(500); // la garde anti-tap des fenêtres (450 ms)
  await p.locator('#modal [data-m="go"]').click();
  await p.waitForFunction(() => window.__eclat.E.state.cycle === 2, null, { timeout: 5000 });
  ok(await p.evaluate(() => window.__eclat.E.state.known.manche > 0 && window.__eclat.E.state.meta.forcedDone), "Première relève : le cycle 2 commence, le savoir est conservé");
  ok(!p.errors.length, "Première relève : aucune erreur après le relais " + p.errors.join(" | "));
  // le rappel du Domaine : un autre Semeur a pris le relais, ce qui est gardé, les Traces à dépenser ; il s’efface quand elles sont dépensées
  for (let i = 0; i < 8; i++) { await p.waitForTimeout(250); await p.evaluate(() => window.__eclat.closeModal()); }
  await p.locator('#tabs [data-tab="domaine"]').click(); await p.waitForTimeout(400);
  ok(await p.evaluate(() => { const e = document.querySelector(".dom-reveil"); return !!e && /Un autre Semeur a pris le relais/.test(e.innerText) && /\d+ ✦ Traces/.test(e.innerText) && /recette/.test(e.innerText); }), "Rappel après l’éveil : « Un autre Semeur a pris le relais », recettes gardées et Traces à dépenser");
  ok(await p.evaluate(() => document.querySelector(".dom-reveil").getBoundingClientRect().height >= 43.9), "Rappel après l’éveil : cible d’au moins 44 px");
  await p.evaluate(() => { window.__eclat.E.state.meta.traces = 0; window.__eclat.render(true); }); await p.waitForTimeout(300);
  ok(await p.evaluate(() => !document.querySelector(".dom-reveil")), "Rappel après l’éveil : il s’efface quand les Traces sont dépensées");
  await p.context().close();
  // Le guide du passage : un lieu demande une torche dont la recette est inconnue, la carte d’objectif le dit et propose « Tenter »
  p = await page(390, false);
  await p.evaluate(() => {
    const E = window.__eclat.E, s = E.state;
    for (const id of ["manche", "corde", "archet", "feu", "cabane", "epieu"]) { E.learn(id, true); s.made[id] = 1; }
    s.inv.feu = 1; E.recalc(); s.flags.extDone = true; s.pass.plaine = { paid: {}, done: false }; s.exp.done = { lisiere: 1 }; s.meta.parcours = 1;
    window.__eclat.render(true);
  });
  await p.waitForTimeout(500);
  ok(await p.evaluate(() => { const c = document.querySelector(".goal-card"); return !!c && /Pour explorer le prochain lieu, il te faut une torche/.test(c.innerText) && !!c.querySelector('[data-gotab="atelier"]'); }), "Passage : la carte d’objectif dit qu’il faut une torche et propose « Tenter »");
  ok(!p.errors.length, p.errors.join("\n")); await p.context().close();
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
      // tri et filtres rangés derrière « Filtres » : rien n’est affiché d’avance, l’ouverture est sur place, un choix la referme
      ok(await p.evaluate(() => !document.querySelector("#v-atelier .filters") && !!document.querySelector("[data-filtres]") && document.querySelector("[data-filtres]").getBoundingClientRect().height >= 43.9), width + " : les filtres sont rangés, le bouton « Filtres » fait 44 px");
      await p.locator("[data-filtres]").click();
      ok(await p.evaluate(() => { const b = [...document.querySelectorAll("#invpanel [data-if]")]; return b.length === 8 && b.every((x) => x.getBoundingClientRect().height >= 43.9) && document.querySelector("[data-filtres]").getAttribute("aria-expanded") === "true"; }), width + " : le panneau s’ouvre sur place avec les 8 filtres de 44 px");
      const avant = await p.evaluate(() => document.querySelectorAll("#v-atelier .inv").length);
      await p.locator('#invpanel [data-if="comp"]').click(); await p.waitForTimeout(250);
      ok(await p.evaluate((n) => !document.getElementById("invpanel") && document.querySelectorAll("#v-atelier .inv").length < n && /Filtres\s*1/.test(document.querySelector("[data-filtres]").innerText) && document.activeElement.hasAttribute("data-filtres"), avant), width + " : un filtre choisi referme le panneau, le bouton dit « 1 » et garde le focus");
      await p.locator("[data-filtres]").click(); await p.locator("[data-fclear]").click(); await p.waitForTimeout(250);
      ok(await p.evaluate((n) => document.querySelectorAll("#v-atelier .inv").length === n && !/Filtres\s*1/.test(document.querySelector("[data-filtres]").innerText), avant), width + " : « Tout effacer » rend toute la liste");
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
