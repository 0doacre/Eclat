#!/usr/bin/env node
/* Mesures de l’arbre des connaissances (js/arbre.js) : ce qu’on voit, à quel point c’est dense, et
 * les tailles lues dans la feuille de styles. Sert de ligne de base : chaque lot qui retouche l’arbre
 * la compare à ses propres mesures (voir docs/revue/arbre-mesures.md).
 *   node tools/arbre-mesures.js              affiche le tableau
 *   node tools/arbre-mesures.js --json       la même chose, lisible par un autre programme
 *   node tools/arbre-mesures.js --ecrire     met le tableau dans docs/revue/arbre-mesures.md
 *   node tools/arbre-mesures.js --check      garde-fou de l’outil (état « tout connu », sans seuil de qualité)
 *   --fenetre LxH                            fenêtre pour « nœuds par écran » (390x510 par défaut)
 * Sans navigateur. La partie qui en demande un est dans tools/arbre-mesures-ui.js. */
"use strict";
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const D = require("../js/data.js");
const { createEngine } = require("../js/engine.js");
const Arb = require("../js/arbre.js");

const ROOT = path.join(__dirname, "..");
const I = D.ITEMS;
const FICHIER = path.join(ROOT, "docs/revue/arbre-mesures.md");
const DEBUT = "<!-- mesures:debut -->", FIN = "<!-- mesures:fin -->";

/* ------------------------------------------------------------------ les trois états */
const mk = () => createEngine({ now: () => 3e12, rand: () => 0.5 });
const ETATS = {
  "neuve": () => mk(),
  "avancée": () => { const E = mk(); E.load(fs.readFileSync(path.join(ROOT, "tools/fixtures/save-v5-age8-usine.json"), "utf8")); return E; },
  "tout connu": () => {
    const E = mk();
    for (const id in I) if (I[id].r && !I[id].sec && !I[id].path) E.learn(id, true);
    E.state.age = D.AGES.length - 1;
    for (const id in I) if (!I[id].path && !I[id].sec) E.state.seen[id] = true;
    return E;
  }
};

/* ------------------------------------------------------------------ la feuille de styles */
function lireCss() {
  const css = fs.readFileSync(path.join(ROOT, "css/arbre.css"), "utf8");
  const regle = (sel) => {
    const m = css.match(new RegExp("(?:^|\\n)" + sel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*\\{([^}]*)\\}"));
    if (!m) throw new Error("règle introuvable dans css/arbre.css : " + sel);
    return m[1];
  };
  const px = (corps, prop, nom) => {
    const m = corps.match(new RegExp("(?:^|[;\\s])" + prop + ":\\s*(?:max\\()?\\s*([0-9.]+)(?:px)?"));
    if (!m) throw new Error("valeur introuvable dans css/arbre.css : " + nom + " " + prop);
    return Number(m[1]);
  };
  const police = (corps, nom) => {
    const m = corps.match(/font:\s*\d+\s+([0-9.]+)px/);
    if (!m) throw new Error("police introuvable dans css/arbre.css : " + nom);
    return Number(m[1]);
  };
  const lab = regle(".arb-l"), age = regle(".arb-age"), trait = regle(".arb-t"), tete = regle(".arb-tete .btn"), bas = regle(".arb-bascule button"), vue = regle(".arb-vue");
  const opac = trait.match(/color-mix\(.*?\s(\d+)%/);
  const marge = vue.match(/-\s*(\d+)px\)/);
  if (!opac) throw new Error("opacité des traits introuvable dans css/arbre.css");
  if (!marge) throw new Error("marge de la vue introuvable dans css/arbre.css");
  return {
    noeud: Arb.NODE,
    policeEtiquette: police(lab, ".arb-l"), largeurEtiquette: px(lab, "width", ".arb-l"),
    policeAge: police(age, ".arb-age"),
    traitEpaisseur: px(trait, "stroke-width", ".arb-t"), traitOpacite: Number(opac[1]),
    cibleBoutonHaut: px(tete, "min-height", ".arb-tete .btn"), cibleBascule: px(bas, "min-height", ".arb-bascule button"),
    margeVue: Number(marge[1]), hauteurMiniVue: px(vue, "height", ".arb-vue")
  };
}

/* ------------------------------------------------------------------ géométrie */
function courbe(t) { // la courbe de rendu() (M x1 y1 C x1 my x2 my x2 y2), en 8 segments
  const my = (t.y1 + t.y2) / 2, pts = [];
  for (let i = 0; i <= 8; i++) {
    const u = i / 8, v = 1 - u;
    pts.push([v * v * v * t.x1 + 3 * v * v * u * t.x1 + 3 * v * u * u * t.x2 + u * u * u * t.x2,
      v * v * v * t.y1 + 3 * v * v * u * my + 3 * v * u * u * my + u * u * u * t.y2]);
  }
  return pts;
}
const orient = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
function seCoupent(p1, p2, p3, p4) {
  const d1 = orient(p3, p4, p1), d2 = orient(p3, p4, p2), d3 = orient(p1, p2, p3), d4 = orient(p1, p2, p4);
  return ((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0)) && d1 !== 0 && d2 !== 0 && d3 !== 0 && d4 !== 0;
}
function croisements(traits) {
  const c = traits.map(courbe);
  let n = 0;
  for (let i = 0; i < traits.length; i++) for (let j = i + 1; j < traits.length; j++) {
    const a = traits[i], b = traits[j];
    if (a.de === b.de || a.de === b.a || a.a === b.de || a.a === b.a) continue; // un nœud en commun : ils se touchent, ils ne se croisent pas
    let coupe = false;
    for (let s = 0; s < 8 && !coupe; s++) for (let u = 0; u < 8 && !coupe; u++) coupe = seCoupent(c[i][s], c[i][s + 1], c[j][u], c[j][u + 1]);
    if (coupe) n++;
  }
  return n;
}
function parEcran(lay, L, H) {
  const ys = lay.noeuds.map((n) => n.y);
  if (!ys.length) return { min: 0, moy: 0, max: 0, fenetres: 0 };
  const haut = Math.min(...ys), bas = Math.max(...ys);
  const de = Math.max(0, haut - 60), a = Math.max(de, Math.min(lay.h - H, bas - H + 60));
  const compte = [];
  for (let y0 = de; y0 <= a + 1e-6; y0 += 20) compte.push(lay.noeuds.filter((n) => n.x >= 0 && n.x <= L && n.y >= y0 && n.y <= y0 + H).length);
  if (!compte.length) compte.push(lay.noeuds.filter((n) => n.y <= de + H).length);
  return { min: Math.min(...compte), moy: compte.reduce((s, x) => s + x, 0) / compte.length, max: Math.max(...compte), fenetres: compte.length };
}
const mediane = (v) => { const s = v.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

/* ------------------------------------------------------------------ la mesure d’un état */
function mesurer(E, opt) {
  const L = opt.largeur, H = opt.hauteur;
  const t0 = process.hrtime.bigint();
  const g = Arb.graphe(E, D);
  const msGraphe = Number(process.hrtime.bigint() - t0) / 1e6;
  // à froid : un second objet de données donne un nouveau cache à catalogue()
  const D2 = Object.assign({}, D);
  const t1 = process.hrtime.bigint();
  Arb.mise_en_page(g, D2);
  const msFroid = Number(process.hrtime.bigint() - t1) / 1e6;
  Arb.mise_en_page(g, D);
  const chauds = [];
  for (let i = 0; i < 20; i++) { const t = process.hrtime.bigint(); Arb.mise_en_page(g, D); chauds.push(Number(process.hrtime.bigint() - t) / 1e6); }
  const lay = Arb.mise_en_page(g, D);
  const html = Arb.rendu(lay, { icon: () => "", esc: (s) => String(s), txt: { fantome: "" } });
  const nb = (e) => lay.noeuds.filter((n) => n.etat === e).length;
  const visibles = lay.traits.filter((t) => !t.loin);
  const ageDe = {};
  lay.noeuds.forEach((n) => { ageDe[n.cle] = n.age; });
  const verticale = lay.traits.map((t) => Math.abs(t.y2 - t.y1));
  const saute = (liste) => liste.filter((t) => Math.abs(ageDe[t.a] - ageDe[t.de]) >= 2).length;
  const droits = (liste) => liste.filter((t) => Math.abs(t.x1 - t.x2) < Arb.PX / 2).length;
  const sur100 = (a, b) => (b ? Math.round((1000 * a) / b) / 10 : 0);
  return {
    noeuds: { total: lay.noeuds.length, allumes: nb("allume"), vus: nb("vu"), fantomes: nb("fantome") },
    traits: { total: lay.traits.length, visibles: visibles.length, cachesParLoin: lay.traits.length - visibles.length,
      htmlLoin: (html.match(/class="arb-t[^"]*\bloin\b/g) || []).length },
    monde: { largeur: lay.w, hauteur: Math.round(lay.h), bandes: lay.bandes.length },
    parEcran: Object.assign({ fenetre: L + "×" + H }, parEcran(lay, L, H)),
    liens: {
      verticaleMoyenne: Math.round(verticale.reduce((s, x) => s + x, 0) / Math.max(1, verticale.length)),
      verticaleMax: Math.round(Math.max(0, ...verticale)),
      droitsPct: sur100(droits(lay.traits), lay.traits.length), droitsVisiblesPct: sur100(droits(visibles), visibles.length),
      sautentDeuxAgesPct: sur100(saute(lay.traits), lay.traits.length), sautentVisiblesPct: sur100(saute(visibles), visibles.length)
    },
    croisements: croisements(visibles),
    mise_en_page_ms: { graphe: Math.round(msGraphe * 10) / 10, froid: Math.round(msFroid * 10) / 10, chaud: Math.round(mediane(chauds) * 100) / 100 },
    _lay: lay
  };
}

/* ------------------------------------------------------------------ affichage */
function tableau(res, css, opt) {
  const noms = Object.keys(res);
  const lignes = [];
  const ligne = (nom, f) => lignes.push("| " + nom + " | " + noms.map((n) => f(res[n])).join(" | ") + " |");
  lignes.push("| Mesure | " + noms.join(" | ") + " |");
  lignes.push("|---|" + noms.map(() => "---:").join("|") + "|");
  ligne("Nœuds (total)", (r) => r.noeuds.total);
  ligne("dont allumés / vus / fantômes", (r) => r.noeuds.allumes + " / " + r.noeuds.vus + " / " + r.noeuds.fantomes);
  ligne("Traits (total)", (r) => r.traits.total);
  ligne("Traits visibles sans toucher", (r) => r.traits.visibles);
  ligne("Traits cachés (sautent plus d’un âge)", (r) => r.traits.cachesParLoin);
  ligne("Monde à l’échelle 1 (L × H, px)", (r) => r.monde.largeur + " × " + r.monde.hauteur);
  ligne("Bandes d’âge", (r) => r.monde.bandes);
  ligne("Nœuds par écran de " + opt.largeur + "×" + opt.hauteur + " (min / moy / max)", (r) => r.parEcran.min + " / " + (Math.round(r.parEcran.moy * 10) / 10) + " / " + r.parEcran.max);
  ligne("Longueur verticale des traits (moy / max, px)", (r) => r.liens.verticaleMoyenne + " / " + r.liens.verticaleMax);
  ligne("Traits droits (tous / visibles, %)", (r) => r.liens.droitsPct + " / " + r.liens.droitsVisiblesPct);
  ligne("Traits qui traversent une bande entière (tous / visibles, %)", (r) => r.liens.sautentDeuxAgesPct + " / " + r.liens.sautentVisiblesPct);
  ligne("Croisements de traits visibles", (r) => r.croisements);
  ligne("Mise en page : graphe, à froid, à chaud (ms)", (r) => r.mise_en_page_ms.graphe + " / " + r.mise_en_page_ms.froid + " / " + r.mise_en_page_ms.chaud);
  const styles = [
    "",
    "Lu dans `css/arbre.css` et `js/arbre.js` :",
    "",
    "| Valeur | Mesure |",
    "|---|---:|",
    "| Côté d’un nœud (`Arbre.NODE`) | " + css.noeud + " px |",
    "| Police des étiquettes de nœud (`.arb-l`) | " + css.policeEtiquette + " px, sur " + css.largeurEtiquette + " px de large |",
    "| Police des noms d’âge (`.arb-age`) | " + css.policeAge + " px |",
    "| Traits (`.arb-t`) | " + css.traitEpaisseur + " px, " + css.traitOpacite + " % |",
    "| Bouton du haut de l’arbre (`.arb-tete .btn`) | " + css.cibleBoutonHaut + " px de haut au moins |",
    "| Interrupteur Liste / Arbre | " + css.cibleBascule + " px de haut au moins |",
    "| Hauteur de la vue (`.arb-vue`) | écran moins l’en-tête, la barre d’onglets et " + css.margeVue + " px de marges (300 px au moins : " + css.hauteurMiniVue + ") |"
  ];
  return lignes.concat(styles).join("\n");
}

function commit() { try { return execSync("git rev-parse --short HEAD", { cwd: ROOT, stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); } catch (e) { return null; } }

function main() {
  const arg = process.argv.slice(2);
  const val = (nom, defaut) => { const i = arg.indexOf(nom); return i >= 0 ? arg[i + 1] : defaut; };
  const f = (val("--fenetre", "390x510")).split("x").map(Number);
  const opt = { largeur: f[0] || 390, hauteur: f[1] || 510 };
  const css = lireCss();
  const noms = arg.includes("--check") ? ["tout connu"] : Object.keys(ETATS);
  const res = {};
  noms.forEach((n) => { res[n] = mesurer(ETATS[n](), opt); });

  if (arg.includes("--check")) {
    const r = res["tout connu"], lay = r._lay;
    const probleme = [];
    if (!(r.noeuds.total > 0)) probleme.push("aucun nœud");
    if (!(r.noeuds.allumes > 100)) probleme.push("trop peu de nœuds allumés dans l’état « tout connu » : " + r.noeuds.allumes);
    if (!(r.monde.hauteur > 0 && r.monde.largeur > 0)) probleme.push("monde vide");
    if (!(r.mise_en_page_ms.froid < 500 && r.mise_en_page_ms.chaud < 500)) probleme.push("mise en page trop lente (> 500 ms)");
    const cles = {};
    lay.noeuds.forEach((n) => { cles[n.cle] = 1; });
    lay.traits.forEach((t) => { if (!cles[t.de] || !cles[t.a]) probleme.push("trait vers un nœud absent : " + t.de + " → " + t.a); });
    if (!(css.policeEtiquette > 0 && css.noeud > 0)) probleme.push("valeurs de la feuille de styles introuvables");
    if (probleme.length) { console.error("✗ arbre-mesures : " + probleme.join(" ; ")); process.exit(1); }
    console.log("✓ arbre-mesures : " + r.noeuds.total + " nœuds, " + r.traits.total + " traits, mise en page " + r.mise_en_page_ms.froid + " ms à froid.");
    return;
  }

  Object.values(res).forEach((r) => { delete r._lay; });
  if (arg.includes("--json")) { console.log(JSON.stringify({ version: D.VERSION, fenetre: opt, css, etats: res }, null, 2)); return; }
  const md = tableau(res, css, opt);
  if (arg.includes("--ecrire")) {
    const date = new Date().toISOString().slice(0, 10);
    const tete = "# L’arbre des connaissances : mesures\n\nÉtat des lieux chiffré de la vue « Arbre » du Carnet (`node tools/arbre-mesures.js --ecrire`).\n\n" +
      "Version du jeu : " + D.VERSION + " · commit : " + (commit() || "inconnu") + " · date : " + date + ".\n\n" +
      "Les mesures sont celles de la mise en page à l’échelle 1, sans navigateur. « Nœuds par écran » compte les centres de nœuds dans une fenêtre glissée par pas de 20 px entre le premier et le dernier nœud. " +
      "Les trois états : une partie neuve, `tools/fixtures/save-v5-age8-usine.json`, et une partie où toutes les recettes sont apprises (âge maximal).\n\n";
    const bloc = DEBUT + "\n" + md + "\n" + FIN;
    let reste = "";
    if (fs.existsSync(FICHIER)) {
      const ancien = fs.readFileSync(FICHIER, "utf8");
      const i = ancien.indexOf(FIN);
      if (i >= 0) reste = ancien.slice(i + FIN.length);
    }
    fs.mkdirSync(path.dirname(FICHIER), { recursive: true });
    fs.writeFileSync(FICHIER, tete + bloc + reste.replace(/^\n*/, "\n\n").replace(/\s*$/, "\n"));
    console.log("écrit : " + path.relative(ROOT, FICHIER));
    return;
  }
  console.log(md);
}

if (require.main === module) main();
module.exports = { ETATS, mesurer, lireCss, croisements, parEcran };
