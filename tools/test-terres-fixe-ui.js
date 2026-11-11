/* Terres : un écran fixe. Rien ne défile aux tailles de téléphone ; les états de la terre sont des pastilles dont le texte s'ouvre à la demande ;
 * les actions sont au pouce, au-dessus du nom de la terre ; rien ne passe sous la barre d'onglets.
 * Playwright requis. PW et CHROMIUM facultatifs. */
"use strict";
const fs = require("fs"), path = require("path"), http = require("http"), assert = require("assert/strict");
const { chromium } = require(process.env.PW || "playwright"), D = require("../js/data"), Core = require("../js/engine");
const ROOT = path.resolve(__dirname, ".."), MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".webp": "image/webp", ".woff2": "font/woff2", ".png": "image/png" };
const server = http.createServer((req, res) => {
  const file = path.resolve(ROOT, "." + new URL(req.url, "http://localhost").pathname.replace(/\/$/, "/index.html"));
  if (!file.startsWith(ROOT + path.sep)) return res.writeHead(403).end();
  fs.readFile(file, (e, b) => { if (e) return res.writeHead(404).end(); res.setHeader("Content-Type", MIME[path.extname(file)] || "application/octet-stream"); res.end(b); });
});
let browser, checks = 0;
const ok = (v, m) => { assert.ok(v, m); checks++; };
/* du plus petit téléphone servi au plus grand ; 390 × 700 est la hauteur utile d'un écran de 844 px avec ses barres */
const TAILLES = [[320, 568], [360, 640], [390, 700], [390, 844], [430, 932]];
/* une partie à l'âge donné : terres ouvertes jusqu'à la dernière nommée, recettes connues, ressources en réserve */
function partie(age, jusqua, avecGisement) {
  const E = Core.createEngine(), s = E.state;
  s.age = age; s.cycle = 2; s.meta.forcedDone = true; s.introSeen = true; s.flags.ver = D.VERSION; s.stats.crafts = 12;
  Object.assign(s.settings, { tuto: false, sound: false, visiteurs: false });
  for (const z of D.ZONES) { s.zones[z.id] = true; if (z.id === jusqua) break; }
  for (const [id, it] of Object.entries(D.ITEMS)) {
    if (it.t === "res" && it.a <= age) { s.seen[id] = true; s.inv[id] = 20; }
    if (it.r && it.a <= age && !it.sec && !it.path) { s.known[id] = true; s.made[id] = 1; }
  }
  if (avecGisement) { s.known.soufre_1 = true; s.seen.soufre_1 = true; s.inv.soufre_1 = 1; } /* une soufrière libre : pastille « gisement à exploiter » et astuce */
  E.recalc(); return E.serialize();
}
const MESURE = () => {
  const q = (s) => document.querySelector(s), r = (e) => e && e.getBoundingClientRect();
  const v = q(".view.on"), vs = q("#views"), corps = q("#v-domaine .terre-corps"), act = r(q("#v-domaine .terre-actions")), plaque = r(q("#v-domaine .terre-tete")), onglets = r(q("#tabs")), bulle = r(q("#v-domaine .terre-bulle:not([hidden])"));
  const petites = [...document.querySelectorAll("#v-domaine .terre-etat > button, #v-domaine .terre-actions > button, #v-domaine .terre-tete button")].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && (b.width < 44 || b.height < 44); }).map((e) => e.className);
  const hors = [...document.querySelectorAll("#v-domaine .terre-etat > *, #v-domaine .terre-actions > *, #v-domaine .terre-gisements button")].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && (b.left < -1 || b.right > innerWidth + 1); }).length;
  return { page: Math.max(v.scrollHeight - v.clientHeight, vs.scrollHeight - vs.clientHeight), corps: corps.scrollHeight - corps.clientHeight, largeur: document.documentElement.scrollWidth - innerWidth,
    actionsBas: act ? act.bottom : 0, plaqueHaut: plaque.top, plaqueBas: plaque.bottom, ongletsHaut: onglets.top, bulleBas: bulle ? bulle.bottom : 0, petites, hors };
};
async function ouvre(W, H, sauvegarde, zone) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, hasTouch: true, isMobile: true, serviceWorkers: "block", reducedMotion: "reduce" }), p = await ctx.newPage(), errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.addInitScript((r) => { localStorage.setItem("eclat.save.v1", r); localStorage.setItem("eclat.style.carnet-defaut", "1"); }, sauvegarde);
  await p.goto(URL_JEU); await p.waitForFunction(() => !!window.__eclat);
  for (let i = 0; i < 6; i++) { await p.waitForTimeout(80); await p.evaluate(() => window.__eclat.closeModal()); }
  await p.locator('#tabs [data-tab="domaine"]').click({ force: true });
  await p.evaluate((z) => { const g = window.__eclat; g.U.zone = z; g.render(true); }, zone); await p.waitForTimeout(300);
  return { ctx, p, errors };
}
let URL_JEU = "";
async function run() {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  URL_JEU = "http://127.0.0.1:" + server.address().port + "/index.html";
  const bronze = partie(4, "desert", false), tard = partie(8, "gisement", true);

  /* 1. le cadre : aucune terre ne défile, à aucune taille ; rien ne se recouvre */
  for (const [W, H] of TAILLES) for (const [sauvegarde, zones] of [[bronze, ["lisiere", "plaine", "riviere", "collines", "mine", "desert"]], [tard, ["gisement"]]]) for (const zone of zones) {
    const { ctx, p, errors } = await ouvre(W, H, sauvegarde, zone), tag = zone + " à " + W + " × " + H, m = await p.evaluate(MESURE);
    ok(m.page === 0, tag + " : la page ne défile pas (" + m.page + " px)");
    ok(m.corps === 0, tag + " : le corps de la terre tient sans défiler (" + m.corps + " px)");
    ok(m.largeur <= 0 && m.hors === 0, tag + " : rien ne dépasse en largeur");
    ok(m.plaqueBas <= m.ongletsHaut && (!m.actionsBas || m.actionsBas <= m.plaqueHaut), tag + " : actions, nom de la terre et onglets ne se recouvrent pas");
    ok(m.petites.length === 0, tag + " : cibles de 44 px au moins (" + m.petites.join(", ") + ")");
    ok(errors.length === 0, tag + " : aucune erreur de page (" + errors.join(" ; ") + ")");
    await ctx.close();
  }

  /* 2. les pastilles d'état : le texte à la demande, puis l'action */
  for (const [W, H] of [[320, 568], [390, 700]]) {
    const { ctx, p, errors } = await ouvre(W, H, tard, "gisement"), tag = "Gisement Noir à " + W + " × " + H;
    ok(await p.locator("#v-domaine .terre-etat .terre-pastille").count() === 4, tag + " : quatre pastilles (règle, lieux, astuce, gisement)");
    ok(await p.locator("#v-domaine .terre-corps :is(.terre-regle, .dom-tip), #v-domaine .terres > .dom-nouveau-gisement").count() === 0, tag + " : plus de bloc de texte empilé dans la page");
    for (const cle of ["regle", "lieu", "astuce", "gis:collines:soufre"]) {
      await p.locator('#v-domaine [data-terre-bulle="' + cle + '"]').click();
      const b = p.locator('#v-domaine .terre-bulle[data-bulle="' + cle + '"]');
      ok(await b.isVisible() && await p.locator("#v-domaine .terre-bulle:not([hidden])").count() === 1, tag + " : la pastille « " + cle + " » ouvre sa bulle, et elle seule");
      const m = await p.evaluate(MESURE);
      ok(m.page === 0 && m.bulleBas <= m.ongletsHaut && await b.evaluate((e) => e.scrollHeight - e.clientHeight) <= 2, tag + " : la bulle « " + cle + " » tient dans l'écran");
      ok(await p.locator('#v-domaine [data-terre-bulle="' + cle + '"]').getAttribute("aria-expanded") === "true", tag + " : état annoncé (aria-expanded)");
    }
    /* un appui ailleurs referme la bulle */
    await p.locator("#v-domaine .terres-rangee").click({ position: { x: 300, y: 10 }, force: true });
    ok(await p.locator("#v-domaine .terre-bulle:not([hidden])").count() === 0, tag + " : un appui ailleurs referme la bulle");
    /* l'astuce : « Compris » la retire */
    await p.locator('#v-domaine [data-terre-bulle="astuce"]').click();
    await p.locator('#v-domaine .terre-bulle:not([hidden]) [data-tip]').click();
    ok(await p.locator('#v-domaine [data-terre-bulle="astuce"]').count() === 0, tag + " : l'astuce comprise disparaît");
    /* le gisement à exploiter : la pose se fait depuis la bulle, et la pastille s'en va */
    await p.locator('#v-domaine [data-terre-bulle="gis:collines:soufre"]').click();
    await p.locator('#v-domaine .terre-bulle:not([hidden]) [data-xadd="collines:soufre"]').click();
    ok(await p.evaluate(() => !!window.__eclat.E.domExt("collines", "soufre")), tag + " : l'extracteur est posé depuis la bulle");
    ok(await p.locator('#v-domaine [data-terre-bulle^="gis:"]').count() === 0, tag + " : la pastille du gisement disparaît après la pose");
    ok(errors.length === 0, tag + " : aucune erreur de page (" + errors.join(" ; ") + ")");
    await ctx.close();
  }

  /* 3. les actions au pouce : explorer, puis l'exploration en cours au même endroit ; la maîtrise dans son panneau */
  for (const [W, H] of [[320, 568], [390, 700]]) {
    const { ctx, p, errors } = await ouvre(W, H, bronze, "lisiere"), tag = "Lisière à " + W + " × " + H;
    const hautBandeau = await p.evaluate(() => document.querySelector("#top").getBoundingClientRect().height);
    ok(await p.evaluate(() => { const b = document.querySelector("#v-domaine .terre-actions [data-exp]").getBoundingClientRect(), g = document.querySelector("#v-domaine .terre-actions [data-exp] .gi").getBoundingClientRect(); return b.left >= 0 && b.right <= innerWidth && g.left >= b.left && g.width > 0; }), tag + " : le bouton « Explorer » tient dans la rangée, son signe reste visible");
    await p.locator("#dt-lisiere .terre-actions [data-exp]").click();
    await p.waitForFunction(() => !!window.__eclat.E.state.exp.active && !!document.querySelector("#v-domaine .terre-actions > .dom-lieu [data-xl]"));
    const m = await p.evaluate(MESURE);
    ok(m.page === 0 && m.corps === 0, tag + " : l'exploration en cours ne fait rien défiler");
    ok(await p.evaluate((h) => document.querySelector("#top").getBoundingClientRect().height <= h + 1 && document.querySelector("#v-domaine .terre-actions [data-xl]").getBoundingClientRect().right <= innerWidth, hautBandeau), tag + " : le temps restant se lit dans la rangée d'actions, le bandeau ne grandit pas");
    await p.evaluate(() => { window.__eclat.E.state.exp.active = null; window.__eclat.render(true); });
    await p.locator('#v-domaine .terre-actions [data-terre-panel="maitrise"]').click();
    const pan = await p.evaluate(() => { const d = document.querySelector("#v-domaine .terres-panneau"), c = d && d.querySelector(".terres-panneau-corps"), f = d && d.querySelector('[data-terre-panel=""]').getBoundingClientRect(); c.scrollTop = c.scrollHeight; const dernier = c.lastElementChild.lastElementChild.getBoundingClientRect(); return { ouvert: !!d.querySelector("details.terre-maitrise[open]"), fermer: f.top >= 0 && f.bottom <= innerHeight, finVisible: dernier.bottom <= document.querySelector("#tabs").getBoundingClientRect().top + 1 }; });
    ok(pan.ouvert && pan.fermer, tag + " : le panneau de maîtrise s'ouvre, objectifs dépliés, « Fermer » à l'écran");
    ok(pan.finVisible, tag + " : la fin du panneau se lit au-dessus de la barre d'onglets");
    await p.locator('#v-domaine .terres-panneau [data-terre-panel=""]').click();
    ok(await p.locator("#v-domaine .terres-panneau").count() === 0, tag + " : le panneau se referme");
    /* le chemin vers la terre voisine */
    await p.locator('#v-domaine .terre-actions [data-gz="plaine"]').click();
    await p.waitForFunction(() => window.__eclat.U.zone === "plaine" && !!document.querySelector("#dt-plaine"));
    ok((await p.evaluate(MESURE)).page === 0, tag + " : le sentier mène à la Plaine, qui ne défile pas non plus");
    ok(errors.length === 0, tag + " : aucune erreur de page (" + errors.join(" ; ") + ")");
    await ctx.close();
  }
  console.log(checks + " contrôles de l'écran fixe des Terres réussis.");
}
run().then(() => { browser.close(); server.close(); }, (e) => { console.error(e); if (browser) browser.close(); server.close(); process.exitCode = 1; });
