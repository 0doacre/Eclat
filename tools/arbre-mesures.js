#!/usr/bin/env node
/* Mesures du contenu visible de l’arbre des connaissances (js/arbre.js).
 *   node tools/arbre-mesures.js              affiche le tableau
 *   node tools/arbre-mesures.js --json       la même chose, lisible par un autre programme
 *   node tools/arbre-mesures.js --ecrire     met le tableau dans docs/revue/arbre-mesures.md
 *   node tools/arbre-mesures.js --check      garde-fou de l’outil (état « tout connu », sans seuil de qualité)
 * La largeur, les cartes et le défilement se mesurent dans tools/arbre-mesures-ui.js
 * et tools/test-ux.js, dans un navigateur. Les positions historiques ne décrivent plus l’interface. */
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

/* La géométrie du graphe historique n’est plus celle de l’interface.
 * Mesurer ici le contenu visible ; le navigateur mesure la largeur et les cartes. */
function mesurer(E) {
  const t = performance.now(), g = Arb.graphe(E, D);
  const par = new Set(g.noeuds.map((n) => n.cle));
  for (const l of g.traits) if (!par.has(l.de) || !par.has(l.a)) throw Error('Lien vers un objet absent');
  let amont = 0, aval = 0;
  for (const n of g.noeuds) { const v = Arb.voisinage(g, n.cle); amont = Math.max(amont, v.amont.length); aval = Math.max(aval, v.aval.length); }
  return { objets: g.noeuds.length, recettes: g.compte, pistes: g.noeuds.filter((n) => n.etat === 'fantome').length,
    relations: g.traits.length, ingredientsMax: amont, usagesMax: aval, calculMs: Math.round(performance.now() - t) };
}
function main() {
  const etats = Object.fromEntries(Object.entries(ETATS).map(([n, fn]) => [n, mesurer(fn())]));
  if (process.argv.includes('--check')) {
    if (etats['tout connu'].recettes < 100 || etats['tout connu'].calculMs > 500) throw Error('Contenu incomplet ou calcul trop lent');
    console.log('✓ arbre-mesures : contenu et voisinages cohérents dans les trois états.');return;
  }
  if (process.argv.includes('--json')) { console.log(JSON.stringify({version:D.VERSION,etats},null,2));return; }
  const md = ['| État | Objets visibles | Recettes connues | Relations | Ingrédients max. | Usages max. |','|---|---:|---:|---:|---:|---:|',
    ...Object.entries(etats).map(([n,r]) => '| '+[n,r.objets,r.recettes,r.relations,r.ingredientsMax,r.usagesMax].join(' | ')+' |')].join('\n');
  if (process.argv.includes('--ecrire')) {
    const old = fs.readFileSync(FICHIER,'utf8'), debut='<!-- mesures-verticales:debut -->', fin='<!-- mesures-verticales:fin -->';
    const bloc=debut+'\n'+md+'\n'+fin;
    fs.writeFileSync(FICHIER,old.includes(debut)?old.replace(new RegExp(debut+'[\\s\\S]*?'+fin),bloc):old+'\n\n## Vue verticale : contenu\n\n'+bloc+'\n');
  }
  console.log(md);
}
if (require.main === module) main();
module.exports = { ETATS, mesurer };
