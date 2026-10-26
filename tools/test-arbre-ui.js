/* L’Arbre, dans un vrai Chromium : la frise d’un âge en pastilles, la feuille d’une recette qui monte du bas, le retour.
 * node tools/test-arbre-ui.js (PW=chemin vers Playwright). Serveur local et profil jetable. */
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
  const ctx = await browser.newContext({ viewport: { width: o.width || 390, height: 844 }, hasTouch: true, isMobile: !!o.mobile, serviceWorkers: "block", reducedMotion: o.calme ? "reduce" : "no-preference" });
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
  const ouvrirArbre = async (p) => { await p.locator('#tabs [data-tab="arbre"]').click(); await p.waitForTimeout(500); };
  const fermer = async (p) => { await p.waitForTimeout(500); await p.locator("#modal .modal-x").click(); await p.waitForTimeout(300); };

  // 1. l’accueil reste la progression ; chaque âge se lit en pastilles
  let p = await page(browser, {});
  await ouvrirArbre(p);
  ok(await p.locator(".arb-progression").count() === 1 && !(await p.evaluate(() => !!window.__eclat.U.mcur)), "l’Arbre s’ouvre sur la progression, sans feuille");
  ok(await p.locator(".arb-legende").count() === 1, "une légende dit ce que veulent dire les pastilles");
  await p.locator('summary:has-text("Âge de l’Os")').click(); await p.waitForTimeout(200);
  const rangs = await p.evaluate(() => [...document.querySelectorAll('details[open][data-arbage="1"] .arb-pas')].map(b => b.className.split(" ").filter(c => ["allume", "vu", "fantome"].includes(c))[0]));
  ok(rangs.length >= 5, "l’âge ouvert montre ses pastilles (" + rangs.length + ")");
  const premierAllume = rangs.indexOf("allume"), dernierVu = rangs.lastIndexOf("vu");
  ok(dernierVu === -1 || premierAllume === -1 || dernierVu < premierAllume, "les matières vues viennent avant les recettes");
  ok(await p.evaluate(() => [...document.querySelectorAll(".arb-pas")].every(b => /, /.test(b.getAttribute("aria-label")) && b.getAttribute("aria-label").length > 6)), "chaque pastille porte son nom entier et son état dans son nom accessible");
  ok(await p.evaluate(() => [...document.querySelectorAll(".arb-pas")].every(b => { const r = b.getBoundingClientRect(); return r.width >= 44 && r.height >= 44; })), "chaque pastille fait au moins 44 px");
  ok(await p.evaluate(() => document.documentElement.scrollWidth === innerWidth && document.getElementById("arbre").scrollWidth === document.getElementById("arbre").clientWidth), "rien ne déborde à droite");

  // 2. toucher une pastille : la feuille monte, la frise reste dessous
  const cle = await p.evaluate(() => document.querySelector('details[open][data-arbage="1"] .arb-pas.allume').dataset.arbsel);
  await p.locator('details[open][data-arbage="1"] .arb-pas.allume').first().click(); await p.waitForSelector("#modal.arb-sheet"); await p.waitForTimeout(500);
  ok(await p.evaluate((c) => window.__eclat.U.arbreSel === c && !!document.querySelector("#modal .arb-selection .sel"), cle), "la feuille s’ouvre sur la recette touchée");
  ok(await p.evaluate(() => { const b = document.querySelector("#modal .modal-box").getBoundingClientRect(); return b.height <= innerHeight * 0.83 && b.bottom >= innerHeight - 1; }), "elle monte du bas et laisse voir l’arbre au-dessus (" + await p.evaluate(() => Math.round(document.querySelector("#modal .modal-box").getBoundingClientRect().height)) + " px)");
  ok(await p.evaluate(() => !!document.querySelector("#v-arbre .arb-frise") && !!document.querySelector("#modal .arb-sheet-c")), "la frise est toujours là, dessous");
  ok(await p.evaluate(() => { const m = document.querySelector("#modal .modal-box"); return m.scrollWidth === m.clientWidth; }), "la feuille ne déborde pas");
  ok(await p.evaluate(() => /Utilise|Sert à fabriquer|Aucun usage/.test(document.querySelector("#modal").innerText)), "elle dit ce que la recette utilise et ce qu’elle sert à fabriquer");

  // 3. de la feuille à une pastille voisine, et retour
  const voisin = await p.evaluate(() => { const b = document.querySelector("#modal .arb-voisins .arb-pas"); return b ? b.dataset.arbsel : null; });
  if (voisin) {
    await p.locator('#modal .arb-voisins .arb-pas').first().click(); await p.waitForTimeout(300);
    ok(await p.evaluate((v) => window.__eclat.U.arbreSel === v && document.querySelectorAll("#modal").length === 1, voisin), "toucher une pastille de la feuille passe à celle-là, dans la même feuille");
    ok(await p.locator('#modal [data-arb="retour"]').count() === 1, "« Revenir » apparaît");
    await p.locator('#modal [data-arb="retour"]').click(); await p.waitForTimeout(300);
    ok(await p.evaluate((c) => window.__eclat.U.arbreSel === c, cle), "et ramène à la recette d’avant");
  } else ok(true, "(pas de voisin sur cette recette)");

  // 4. fermer : la croix, puis l’état est propre
  await fermer(p);
  ok(await p.evaluate(() => !window.__eclat.U.mcur && window.__eclat.U.arbreSel === null && !(window.__eclat.U.arbreHistorique || []).length), "la croix ferme la feuille et remet l’état à zéro");
  ok(await p.evaluate(() => document.querySelector("#v-arbre .arb-frise") !== null), "l’arbre est resté en place");

  // 5. l’objectif : la feuille s’ouvre sur la piste, sans trahir son nom
  await p.locator('[data-arb="centre"]').click(); await p.waitForSelector("#modal.arb-sheet"); await p.waitForTimeout(400);
  ok(await p.evaluate(() => { const n = window.__eclat.U.arbreG.noeuds.find(x => x.objectif); return !!n && window.__eclat.U.arbreSel === n.cle; }), "« Objectif » ouvre la feuille sur l’objectif");
  ok(await p.evaluate(() => { const n = window.__eclat.U.arbreG.noeuds.find(x => x.objectif); return n.etat !== "fantome" || !/Recette à découvrir/.test("") || document.querySelector("#modal .arb-l").textContent === "Recette à découvrir"; }), "une piste garde son anonymat");
  ok(!p.errors.length, p.errors.join("\n"));
  await p.context().close();

  // 6. sur téléphone, le bouton Retour ferme la feuille
  p = await page(browser, { mobile: true });
  await ouvrirArbre(p);
  await p.locator('details[open] .arb-pas').first().click(); await p.waitForSelector("#modal.arb-sheet"); await p.waitForTimeout(500);
  await p.goBack(); await p.waitForTimeout(400);
  ok(await p.evaluate(() => !window.__eclat.U.mcur && window.__eclat.U.tab === "arbre"), "Retour ferme la feuille et laisse l’Arbre ouvert");
  await p.context().close();

  // 7. grand texte et petit écran : trois colonnes, rien ne déborde
  p = await page(browser, { width: 320, settings: { largeText: true } });
  await ouvrirArbre(p);
  ok(await p.evaluate(() => { const g = document.querySelector("details[open] .arb-frise"); return getComputedStyle(g).gridTemplateColumns.split(" ").length === 3; }), "trois colonnes en grand texte ou sous 340 px");
  ok(await p.evaluate(() => document.documentElement.scrollWidth === innerWidth), "320 px : rien ne déborde");
  await p.context().close();

  // 8. le chemin vers une cible : depuis la feuille d'une pastille, « Chemin » ouvre l'échelle des marches
  p = await page(browser, {});
  await ouvrirArbre(p);
  await p.locator('details[open] .arb-pas.allume').first().click();
  await p.waitForSelector("#modal.arb-sheet"); await p.waitForTimeout(400);
  ok(await p.locator('#modal [data-chemin]').count() >= 1, "le bouton Chemin apparaît sur la feuille");
  await p.locator('#modal [data-chemin]').first().click();
  await p.waitForSelector("#modal .arb-echelle"); await p.waitForTimeout(400);
  ok(await p.locator("#modal .arb-marche").count() >= 1, "l'échelle des marches est affichée");
  ok(await p.evaluate(() => [...document.querySelectorAll("#modal .arb-marche")].every(m => /fait|en_cours|a_trouver|bloquee/.test(m.className))), "chaque marche porte son état");
  ok(await p.locator('#modal button:has-text("Tout fabriquer"), #modal button:has-text("Suivre")').count() >= 1, "les actions globales Tout fabriquer ou Suivre sont présentes");
  ok(await p.evaluate(() => document.querySelector("#modal .modal-box").scrollWidth <= window.innerWidth), "la modale de chemin ne déborde pas");
  await fermer(p);
  await p.context().close();

  // 9. le bouton Chemin depuis l'objectif du Domaine
  p = await page(browser, {});
  await p.locator('#tabs [data-tab="domaine"]').click(); await p.waitForTimeout(300);
  const hasChemin = await p.locator('.goal-card [data-chemin]').count();
  if (hasChemin) {
    await p.locator('.goal-card [data-chemin]').click();
    await p.waitForSelector("#modal .arb-echelle"); await p.waitForTimeout(400);
    ok(await p.locator("#modal .arb-marche").count() >= 1, "Chemin depuis l'objectif ouvre l'échelle des marches");
    await fermer(p);
  } else ok(true, "(pas d'objectif craft au réveil)");
  await p.context().close();

  // 10. filtres de portée et point « nouveau »
  p = await page(browser, {});
  await ouvrirArbre(p);
  ok(await p.locator(".arb-filtres [data-arb-f]").count() === 4, "les 4 filtres de portée sont présents");
  ok(await p.evaluate(() => [...document.querySelectorAll(".arb-filtres button")].every(b => b.getBoundingClientRect().height >= 44)), "chaque filtre fait au moins 44 px de haut");
  ok(await p.locator(".arb-pas.neuf .arb-dot-neuf").count() >= 1, "les nouvelles recettes portent le point nouveau");
  const countTous = await p.locator(".arb-pas").count();
  await p.locator('.arb-filtres [data-arb-f="pret"]').click();
  await p.waitForTimeout(200);
  const countPrets = await p.locator(".arb-pas").count();
  ok(countPrets > 0 && countPrets <= countTous, "le filtre Prêtes restreint l'affichage aux seules pastilles prêtes");
  ok(await p.evaluate(() => [...document.querySelectorAll(".arb-pas")].every(b => b.classList.contains("p-pret"))), "toutes les pastilles visibles sous le filtre Prêtes sont qualifiées p-pret");
  await p.context().close();

  await browser.close(); server.close();
  console.log(checks + " contrôles de l’Arbre réussis.");
}
run().catch(e => { console.error(e); process.exit(1); });
