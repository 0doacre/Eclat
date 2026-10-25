/* ÉCLAT — le test des boutons : aucun bouton de l’interface ne reste sans explication.
 *
 * Lit docs/boutons.json et docs/boutons.md, écrits par tools/boutons.js dans un vrai
 * navigateur, et échoue sur chaque bouton dont l’explication est « rien », sauf s’il
 * figure dans tools/boutons-ok.json avec une raison. Pas de navigateur ici : npm test
 * reste rapide.
 *
 * Après un changement d’interface, refaire l’inventaire puis relancer le test :
 *   node tools/boutons.js
 *   node tools/test-boutons.js
 */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const lire = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const MAX_EXCEPTIONS = 20;

let ko = 0;
const echec = (msg) => { ko++; console.log("  ✗ " + msg); };
const ok = (msg) => console.log("  ✓ " + msg);

for (const f of ["docs/boutons.json", "docs/boutons.md", "tools/boutons-ok.json"]) {
  if (!fs.existsSync(path.join(ROOT, f))) {
    console.log("✗ " + f + " manque : lancer node tools/boutons.js (Playwright + Firefox).");
    process.exit(1);
  }
}

const rows = JSON.parse(lire("docs/boutons.json"));
const md = lire("docs/boutons.md");
const exceptions = JSON.parse(lire("tools/boutons-ok.json"));

/* un inventaire vide ou tronqué passerait le test sans rien vérifier */
if (!Array.isArray(rows) || rows.length < 100) {
  console.log("✗ docs/boutons.json ne contient que " + (rows.length || 0) + " boutons : inventaire incomplet, relancer node tools/boutons.js.");
  process.exit(1);
}

/* les exceptions : peu, avec une raison, et encore utiles */
const parRepere = new Map(rows.map((r) => [r.repere, r]));
if (exceptions.length > MAX_EXCEPTIONS) {
  echec(exceptions.length + " exceptions dans tools/boutons-ok.json : au-delà de " + MAX_EXCEPTIONS + ", c’est l’interface qu’il faut expliquer, pas la liste qu’il faut allonger.");
}
for (const e of exceptions) {
  if (!e.repere || !e.raison || e.raison.trim().length < 8) { echec("exception sans repère ou sans raison : " + JSON.stringify(e)); continue; }
  const r = parRepere.get(e.repere);
  if (!r) { echec("exception pour un bouton qui n’existe plus : " + e.repere + " (" + e.raison + ")"); continue; }
  // une exception ne sert plus à rien si une info-bulle, un lecteur d’écran ou le guide l’explique ;
  // qu’un mot du bouton traîne dans la fiche Aide ne suffit pas à l’expliquer
  if (r.explique !== "rien" && r.explique !== "fiche Aide") echec("exception inutile, ce bouton est déjà expliqué (" + r.explique + ") : " + e.repere);
}

/* le cœur : chaque bouton a une explication, ou une exception assumée */
const permis = new Set(exceptions.map((e) => e.repere));
const nus = rows.filter((r) => r.explique === "rien" && !permis.has(r.repere));
for (const r of nus) echec("sans explication : " + r.partie + " · " + r.ecran + " · « " + r.label + " » " + r.repere);
if (!nus.length) ok(rows.length + " boutons, tous expliqués ou exceptés");

/* le tableau publié et la liste doivent dire la même chose */
const m = md.match(/\| Sans explication \| (\d+) \|/);
const nusTotal = rows.filter((r) => r.explique === "rien").length;
if (!m) echec("docs/boutons.md n’a pas sa ligne « Sans explication » : relancer node tools/boutons.js.");
else if (Number(m[1]) !== nusTotal) echec("docs/boutons.md annonce " + m[1] + " boutons sans explication, la liste en compte " + nusTotal + " : relancer node tools/boutons.js.");
else ok("docs/boutons.md et docs/boutons.json d’accord (" + nusTotal + " sans explication, " + exceptions.length + " exception" + (exceptions.length > 1 ? "s" : "") + ")");

if (ko) { console.log("✗ " + ko + " problème" + (ko > 1 ? "s" : "") + " de boutons."); process.exit(1); }
