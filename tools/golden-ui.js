/* Référence de rendu de l’interface (hors « npm test » : il demande Playwright).
 * Sert à vérifier qu’un remaniement de js/ui.js ne change pas un octet de ce qu’on voit.
 *
 *   PW=$(npm root -g)/playwright node tools/golden-ui.js write <dossier>   écrit la référence
 *   PW=$(npm root -g)/playwright node tools/golden-ui.js check <dossier>   compare à la référence
 *
 * Un serveur doit déjà servir le dépôt : setsid npx http-server -p 8768 -s -c-1 . (URL= pour changer).
 * Quatre parties (neuve ; tools/fixtures/save-v5-age8-usine.json ; une partie enrichie en Node : Livre,
 * signes, fouille en cours, fins, curiosités ; la même après une relève, dons proposés), l’heure et l’aléa
 * figés. Le tour clique les onglets, sous-onglets et fenêtres, et écrit pour chaque écran le HTML de
 * #app, #modal, #toasts et #visiteurs. Les erreurs de la console sont écrites aussi : elles font partie de la référence.
 * Code de sortie 1 au premier écart (check) ou si une erreur de page survient. */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require(process.env.PW || "playwright");
const ROOT = path.join(__dirname, "..");
const D = require(path.join(ROOT, "js/data.js"));
const { createEngine } = require(path.join(ROOT, "js/engine.js"));

const [mode, dir] = process.argv.slice(2);
if (!/^(write|check)$/.test(mode || "") || !dir) { console.error("usage : node tools/golden-ui.js write|check <dossier>"); process.exit(2); }
const URL = process.env.URL || "http://localhost:8768/index.html";
const T0 = Date.UTC(2026, 9, 20, 10, 0, 0); // l’heure figée de toutes les parties

/* ------------------------------------------------------------ les parties */
function partieRiche() {
  const E = createEngine({ now: () => T0, rand: () => 0.42 });
  E.load(fs.readFileSync(path.join(ROOT, "tools/fixtures/save-v5-age8-usine.json"), "utf8"));
  const st = E.state;
  const R = E.RECIT;
  st.introSeen = true;
  st.flags.ver = D.VERSION;
  st.livre = st.livre || { p: {}, vu: {} };
  Object.keys(R.pages).slice(0, 6).forEach((id, i) => { st.livre.p[id] = 1; if (i < 2) st.livre.vu[id] = 0; });
  Object.keys(R.signes).slice(0, 6).forEach((id, i) => E.seeSigne(id, "Page " + (i + 1)));
  E.addCurio("konami");
  st.meta.endings = st.meta.endings || {};
  st.ecus = 1234;
  // une fouille en cours, sur le premier lieu qui l’accepte
  for (const z of Object.keys(E.ZONES)) {
    const exps = E.ZONES[z].exps || [];
    let ok = false;
    for (let i = 0; i < exps.length && !ok; i++) ok = E.fouilleLancer(z, i, 1).ok;
    if (ok) break;
  }
  return E;
}
const PARTIES = [
  ["neuve", null],
  ["usine", fs.readFileSync(path.join(ROOT, "tools/fixtures/save-v5-age8-usine.json"), "utf8")],
  ["riche", partieRiche().serialize()],
  ["releve", (() => { const E = partieRiche(); E.newCycle(); return E.serialize(); })()]
];

/* ------------------------------------------------------------ le tour */
async function tour(b, nom, raw) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block", hasTouch: false, locale: "fr-FR", timezoneId: "Europe/Paris" });
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push("pageerror : " + e.message));
  p.on("console", (m) => { if (m.type() === "error") errs.push("console : " + m.text()); });
  await p.addInitScript(([t0, s]) => {
    const RD = Date;
    class FD extends RD { constructor(...a) { if (a.length) super(...a); else super(t0); } static now() { return t0; } }
    window.Date = FD;
    Math.random = () => 0.42;
    if (!sessionStorage.getItem("golden")) {
      sessionStorage.setItem("golden", "1");
      localStorage.clear();
      if (s) localStorage.setItem("eclat.save.v1", s);
    }
    document.addEventListener("DOMContentLoaded", () => {
      const st = document.createElement("style");
      st.textContent = "*,*::before,*::after{animation:none!important;transition:none!important}";
      document.head.appendChild(st);
    });
  }, [T0, raw]);
  await p.goto(URL);
  await p.waitForTimeout(2000);

  const shots = [];
  let n = 0;
  const wait = (ms) => p.waitForTimeout(ms || 550);
  const snap = async (name) => {
    const html = await p.evaluate(() => ["#app", "#modal", "#toasts", "#visiteurs"].map((s) => { const el = document.querySelector(s); return el ? el.outerHTML : ""; }).join("\n\n"));
    shots.push([String(n++).padStart(3, "0") + "-" + name, html]);
  };
  const absent = (name) => { shots.push([String(n++).padStart(3, "0") + "-" + name, "(absent)"]); };
  /* toucher le premier élément visible qui répond au sélecteur ; faux s’il n’y en a pas */
  const tap = async (sel) => {
    const loc = p.locator(sel).filter({ visible: true }).first();
    if (!(await loc.count())) return false;
    // l’heure est figée : une fenêtre resterait « toute fraîche » et ignorerait les clics (450 ms de garde)
    await p.evaluate(() => { if (window.__eclat) window.__eclat.U.mAt = 0; });
    await loc.click({ timeout: 2000 }).catch(() => {});
    await wait();
    return true;
  };
  const step = async (name, sel) => { if (await tap(sel)) await snap(name); else absent(name); };
  const modalOpen = () => p.evaluate(() => !document.querySelector("#modal").classList.contains("hidden"));
  const closeAll = async (name) => {
    for (let k = 0; k < 10 && (await modalOpen()); k++) {
      if (name) await snap(name + "-" + k);
      await p.evaluate(() => window.__eclat.closeModal());
      await wait(700);
    }
  };
  const tab = (t) => step("onglet-" + t, '#tabs [data-tab="' + t + '"]');

  await snap("demarrage");
  await closeAll("ouverture");
  await snap("accueil");

  // le Domaine
  await tab("domaine");
  await step("fiche-gisement", "#v-domaine [data-gsheet]"); await closeAll();
  if (await tap("#v-domaine [data-comptoir]")) {
    await snap("comptoir");
    for (const t of ["vendre", "acheter", "demandes", "parler"]) await step("comptoir-" + t, '#modal [data-m="ctab"][data-t="' + t + '"]');
    await closeAll();
  } else absent("comptoir");

  // la Carte
  await tab("carte");
  await step("carte-lieu", "#v-carte [data-cl]"); await closeAll();
  await step("carte-brume", "#v-carte [data-cf]"); await closeAll();
  await step("carte-passage", "#v-carte [data-cp]"); await closeAll();

  // l’Atelier : un geste, deux matières, l’œuvre
  await tab("atelier");
  await step("atelier-geste", "#v-atelier [data-g]:not(.on)");
  await step("atelier-matiere-1", "#v-atelier .inv");
  await step("atelier-matiere-2", "#v-atelier .inv >> nth=1");
  await step("atelier-oeuvre", "#v-atelier #forge");
  await step("atelier-vider", "#v-atelier [data-clear]");
  await step("atelier-mains", "#v-atelier [data-hopen]"); await closeAll();
  await step("atelier-niveaux", "#v-atelier [data-skills]"); await closeAll();
  {
    const loc = p.locator("#v-atelier .inv").filter({ visible: true }).first();
    if (await loc.count()) {
      const bx = await loc.boundingBox();
      await p.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2);
      await p.mouse.down(); await wait(800); await p.mouse.up(); await wait();
      await snap("fiche-objet");
      await closeAll();
    } else absent("fiche-objet");
  }
  await step("onglet-carnet", '#v-atelier [data-tab2="carnet"]');
  if (await tap("#v-carnet [data-goto]")) {
    await snap("carnet-fiche");
    await step("fiche-lien", '#modal [data-m="nav"]');
    await step("fiche-retour", '#modal [data-m="back"]');
    await step("fiche-suivre", '#modal [data-m="track"]');
    await step("fiche-arbre", '#modal [data-m="tree"]');
    await closeAll("fiche-arbre-ouvert");
  } else absent("carnet-fiche");
  await step("carnet-arbre", "#v-carnet [data-tree]"); await closeAll();
  if (await p.locator("#v-carnet #cq").count()) { await p.fill("#v-carnet #cq", "fer"); await wait(); await snap("carnet-recherche"); await p.fill("#v-carnet #cq", ""); await wait(); }
  await step("onglet-machines", '#v-carnet [data-tab2="machines"]');
  await step("retour-atelier", '[data-tab2="atelier"]');

  // le Journal et le Cosmos
  if (await tap('#tabs [data-tab="journal"]')) {
    await snap("onglet-journal");
    const jts = await p.$$eval("#v-journal [data-jt]", (l) => l.map((x) => x.dataset.jt));
    for (const jt of jts) {
      await step("journal-" + jt, '#v-journal [data-jt="' + jt + '"]');
      if (jt === "signes") { await step("journal-signe", "#v-journal [data-s]"); await closeAll(); }
      if (jt === "livre") { await step("journal-page", "#v-journal [data-page]"); await closeAll(); }
      if (jt === "fragments") { await step("journal-fragment", "#v-journal [data-frag]"); await closeAll(); }
    }
    if (await tap('#v-journal [data-tab2="cosmos"]')) {
      await snap("onglet-cosmos");
      const cts = await p.$$eval("#v-cosmos [data-ct]", (l) => l.map((x) => x.dataset.ct));
      for (const ct of cts) await step("cosmos-" + ct, '#v-cosmos [data-ct="' + ct + '"]');
    } else absent("onglet-cosmos");
  } else absent("onglet-journal");
  await tab("domaine");

  // le haut de l’écran
  await step("age-etapes", "#ageBtn"); await closeAll();
  await step("intuition", "#intuBtn"); await closeAll();
  if (await tap("#questBtn")) {
    await snap("quetes");
    for (const t of ["scenario", "rituals", "troqueur"]) await step("quetes-" + t, '#modal [data-mqtab="' + t + '"]');
    await closeAll();
  } else absent("quetes");
  await step("memoire", "#memBtn"); await closeAll();

  // le menu
  await step("menu", "#menuBtn");
  for (const k of ["sound", "sound", "vibe", "vibe", "visiteurs", "visiteurs"]) await step("menu-" + k, '#modal [data-m="' + k + '"]');
  await closeAll();
  for (const k of ["help", "news", "credits", "saves", "account", "mem", "reset"]) {
    await tap("#menuBtn");
    await step("menu-" + k, '#modal [data-m="' + k + '"]');
    if (k === "account") { await wait(800); await snap("menu-account-suite"); }
    await closeAll();
  }

  // la relève : la fenêtre, l’éveil, la Mémoire après, les dons
  if (nom === "riche") {
    await tap("#memBtn");
    await step("releve", '#modal [data-m="releve"]');
    await step("releve-go", '#modal [data-m="go"]');
    await closeAll("apres-releve");
    await wait(800);
    await closeAll("eveil");
    await snap("domaine-apres-releve");
  }
  if (nom === "releve" || nom === "riche") {
    await step("dons", "#v-domaine [data-dons]");
    await step("don-pris", '#modal [data-m="don"]');
    await closeAll();
    await snap("domaine-don-pris");
  }
  // un visiteur de passage : on avance le temps de jeu pour qu’il vienne, puis on le touche
  // (le tutoriel coupé depuis le menu : sa bulle le retiendrait)
  await tab("domaine");
  await tap("#menuBtn");
  await step("menu-tuto", '#modal [data-m="tuto"]');
  await closeAll("apres-tuto");
  await p.evaluate(() => { window.__eclat.E.state.stats.play = 1e9; });
  await wait(500);
  await p.evaluate(() => { window.__eclat.E.state.stats.play = 2e9; });
  await wait(1000);
  await snap("visiteur");
  // (sans animation, il attend hors de l’écran : on le touche par le DOM)
  if (await p.evaluate(() => { const v = document.querySelector("#visiteurs .visiteur"); if (v) v.click(); return !!v; })) { await wait(); await snap("visiteur-touche"); }
  else absent("visiteur-touche");
  await ctx.close();
  return { shots, errs };
}

/* ------------------------------------------------------------ écrire, comparer */
const clean = (h) => h.replace(/\b1[6-9]\d{11}\b/g, "<t>").replace(/></g, ">\n<");
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium" });
  let ecarts = 0, total = 0, erreurs = 0;
  for (const [nom, raw] of PARTIES) {
    const { shots, errs } = await tour(b, nom, raw);
    const d = path.join(dir, nom);
    shots.push(["erreurs", errs.join("\n")]);
    erreurs += errs.filter((e) => e.startsWith("pageerror")).length;
    if (mode === "write") {
      fs.rmSync(d, { recursive: true, force: true });
      fs.mkdirSync(d, { recursive: true });
      shots.forEach(([k, h]) => fs.writeFileSync(path.join(d, k + ".html"), clean(h)));
    } else {
      const ref = fs.existsSync(d) ? fs.readdirSync(d).sort() : [];
      const got = shots.map(([k]) => k + ".html");
      if (ref.join() !== got.join()) { ecarts++; console.log("✗ " + nom + " : écrans différents (" + ref.length + " attendus, " + got.length + " obtenus)"); }
      shots.forEach(([k, h]) => {
        const f = path.join(d, k + ".html");
        if (!fs.existsSync(f)) return;
        if (fs.readFileSync(f, "utf8") !== clean(h)) {
          ecarts++;
          fs.mkdirSync(path.join(dir, "_obtenu", nom), { recursive: true });
          fs.writeFileSync(path.join(dir, "_obtenu", nom, k + ".html"), clean(h));
          console.log("✗ " + nom + "/" + k);
        }
      });
    }
    total += shots.length;
    if (errs.length) console.log("  " + nom + " : " + errs.length + " erreur(s) de console : " + errs[0]);
  }
  await b.close();
  console.log(mode === "write" ? "Référence écrite : " + total + " écrans." : ecarts ? ecarts + " écart(s) sur " + total + " écrans." : "Rendu identique : " + total + " écrans.");
  process.exit(ecarts || erreurs ? 1 : 0);
})();
