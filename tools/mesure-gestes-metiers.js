#!/usr/bin/env node
/* Mesure du recouvrement des gestes et des ingrédients entre les métiers (docs/revue/probleme-gestes-metiers.md).
 *   node tools/mesure-gestes-metiers.js
 * Lecture seule : ne change rien. À relancer après chaque reclassement de recette. */
"use strict";
const D = require("../js/data.js");
const { createEngine } = require("../js/engine.js");
const E = createEngine({ now: () => 2e12, rand: () => 0.5 });
const I = D.ITEMS;
const METIERS = D.ATELIERS.familles.map((f) => f.id);
const parGeste = {}, ing = {};
for (const [id, it] of Object.entries(I)) {
  if (!it.r || it.sec || it.path) continue;
  const f = E.atelierDe(id), g = it.r[0];
  (parGeste[g] = parGeste[g] || {})[f] = (parGeste[g][f] || 0) + 1;
  for (const k in it.r[1]) (ing[k] = ing[k] || new Set()).add(f);
}
const pad = (s, n) => String(s).padStart(n);
console.log("GESTE".padEnd(14) + METIERS.map((m) => pad(m.slice(0, 6), 7)).join("") + "  métiers");
Object.keys(parGeste).sort((a, b) => Object.keys(parGeste[b]).length - Object.keys(parGeste[a]).length).forEach((g) => {
  console.log(g.padEnd(14) + METIERS.map((m) => pad(parGeste[g][m] || ".", 7)).join("") + "  " + Object.keys(parGeste[g]).length);
});
const nb = {};
Object.values(ing).forEach((s) => { nb[s.size] = (nb[s.size] || 0) + 1; });
console.log("\nIngrédients par nombre de métiers qui les utilisent : " + JSON.stringify(nb));
console.log("Utilisés par 3 métiers ou plus : " + Object.values(ing).filter((s) => s.size >= 3).length + " sur " + Object.keys(ing).length);
