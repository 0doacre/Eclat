/* 0.43.1 : la saveur d'une découverte (texte de recette, introduction d'un geste nouveau). */
"use strict";
const assert = require("assert/strict");
const D = require("../js/data.js");
const { createEngine } = require("../js/engine.js");
let passed = 0;
function test(n, fn) {
  try { fn(); passed++; console.log("  ✓ " + n); }
  catch (e) { console.log("  ✗ " + n + "\n    " + (e.stack || e)); process.exitCode = 1; }
}
const jeu = () => createEngine({ now: () => 2e12, rand: () => 0.5 });
console.log("Saveur de découverte (0.43.1)");
test("les emplacements existent et leurs textes tiennent en 220 signes", () => {
  assert.equal(typeof D.SAVEUR, "object"); assert.equal(typeof D.SAVEUR_GESTE, "object");
  for (const [id, t] of Object.entries(D.SAVEUR)) { assert.ok(D.ITEMS[id] && D.ITEMS[id].r, "recette inconnue : " + id); assert.ok(t.length <= 220, id + " : " + t.length + " signes"); }
  for (const [g, t] of Object.entries(D.SAVEUR_GESTE)) { assert.ok(D.GESTES[g], "geste inconnu : " + g); assert.ok(t.length <= 220, g); }
});
test("sans texte écrit, la saveur d'une recette est sa description", () => {
  const E = jeu();
  for (const [id, it] of Object.entries(D.ITEMS)) if (it.r && !it.sec && !D.SAVEUR[id]) assert.equal(E.saveurDecouverte(id).recette, it.d, id);
});
test("un texte écrit remplace la description", () => {
  const E = jeu(); D.SAVEUR.epieu = "Une pointe durcie au feu.";
  try { assert.equal(E.saveurDecouverte("epieu").recette, "Une pointe durcie au feu."); } finally { delete D.SAVEUR.epieu; }
});
test("un geste de départ n'a pas d'introduction", () => {
  const E = jeu();
  for (const g of ["assembler", "construire", "tresser", "tailler"]) {
    const id = Object.keys(D.ITEMS).find((k) => D.ITEMS[k].r && !D.ITEMS[k].sec && D.ITEMS[k].r[0] === g);
    assert.equal(E.saveurDecouverte(id).geste, null, g);
  }
});
test("un geste nouveau s'introduit la première fois seulement", () => {
  const E = jeu();
  const ids = Object.keys(D.ITEMS).filter((k) => D.ITEMS[k].r && !D.ITEMS[k].sec && D.ITEMS[k].r[0] === "marteler");
  assert.ok(ids.length >= 1);
  const g = E.saveurDecouverte(ids[0]).geste;
  assert.equal(g.id, "marteler"); assert.equal(g.n, D.GESTES.marteler.n); assert.equal(g.texte, D.GESTES.marteler.d);
  assert.ok(ids.length >= 2);
  E.state.made[ids[0]] = 1;
  assert.notEqual(E.saveurDecouverte(ids[0]).geste, null, "la recette elle-même ne compte pas");
  assert.equal(E.saveurDecouverte(ids[1]).geste, null, "le geste est déjà compris");
});
test("un texte de geste écrit remplace sa description", () => {
  const E = jeu(); D.SAVEUR_GESTE.marteler = "Le métal cède.";
  try { const id = Object.keys(D.ITEMS).find((k) => D.ITEMS[k].r && !D.ITEMS[k].sec && D.ITEMS[k].r[0] === "marteler"); assert.equal(E.saveurDecouverte(id).geste.texte, "Le métal cède."); } finally { delete D.SAVEUR_GESTE.marteler; }
});
test("un identifiant inconnu ne casse rien", () => {
  assert.deepEqual(jeu().saveurDecouverte("nimportequoi"), { recette: "", geste: null });
});
console.log(passed + " tests réussis");
