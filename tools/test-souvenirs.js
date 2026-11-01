/* Le retour de mémoire (0.65) : après une relève, chaque âge se relit dans le Carnet. */
"use strict";
const assert = require("assert/strict");
const D = require("../js/data.js");
const { createEngine } = require("../js/engine.js");

let passed = 0;
function test(n, fn) {
  try { fn(); passed++; console.log("  ✓ " + n); }
  catch (e) { console.log("  ✗ " + n + "\n    " + (e.stack || e)); process.exitCode = 1; }
}
function partie(age) {
  const E = createEngine({ now: () => 2e12, rand: () => 0.99 });
  E.state.age = age;
  for (const [id, it] of Object.entries(D.ITEMS)) if (it.r && it.a <= age && !it.sec && !it.path) E.state.known[id] = true;
  return E;
}
console.log("Retour de mémoire");
test("un texte par âge, bien écrit", () => {
  assert.equal(D.SOUVENIRS.ages.length, D.AGES.length);
  const tout = [D.SOUVENIRS.intro, D.SOUVENIRS.pages, D.SOUVENIRS.relire, D.SOUVENIRS.tout, D.SOUVENIRS.atelier, ...D.SOUVENIRS.ages];
  for (const t of tout) {
    assert.ok(t && t.length > 8, t);
    assert.ok(!/[\u2014\u2013]/.test(t), "pas de tiret long : " + t);
    assert.ok(!t.includes("'"), "apostrophe courbe : " + t);
    assert.ok(!/non pas|ce n’est pas .* c’est/i.test(t), "pas de fausse contradiction : " + t);
  }
  for (const t of D.SOUVENIRS.ages) assert.ok(t.length <= 140, "une ou deux phrases courtes : " + t);
});
test("premier cycle ou partie d’avant : rien à relire", () => {
  const E = partie(5);
  assert.deepEqual(E.agesARetrouver(), []);
  E.state.cycle = 2; // pas de S.souvenirs : tout est considéré relu
  assert.deepEqual(E.agesARetrouver(), []);
  assert.ok(E.retrouvee("manche"));
});
test("la relève vide les souvenirs, les recettes restent connues", () => {
  const E = partie(5);
  E.state.cycle = 1; E.state.souvenirs = undefined;
  const avant = Object.keys(E.state.known).length;
  E.newCycle();
  assert.equal(E.state.cycle, 2);
  assert.deepEqual(E.state.souvenirs, {});
  assert.equal(Object.keys(E.state.known).length, avant, "les recettes sont gardées");
});
test("après une relève, les âges atteints sont à relire, pas les suivants", () => {
  const E = partie(3);
  E.state.cycle = 2; E.state.souvenirs = {};
  const r = E.agesARetrouver();
  assert.ok(r.length > 0 && r.every((a) => a <= E.state.age + 1), "âges à relire : " + r);
  assert.ok(!E.retrouvee("manche"), "une recette du Bois attend d’être relue");
  assert.ok(E.retrouvee("bas_fourneau") || D.ITEMS.bas_fourneau.a > 4, "un âge lointain n’est pas concerné");
});
test("relire un âge rend ses recettes, et une seule fois", () => {
  const E = partie(3);
  E.state.cycle = 2; E.state.souvenirs = {};
  assert.equal(E.retrouver(0), true);
  assert.ok(E.retrouvee("manche"));
  assert.equal(E.retrouver(0), false, "déjà relu");
  assert.ok(!E.agesARetrouver().includes(0));
});
test("tout relire", () => {
  const E = partie(6);
  E.state.cycle = 2; E.state.souvenirs = {};
  assert.ok(E.agesARetrouver().length > 1);
  E.retrouver("tout");
  assert.deepEqual(E.agesARetrouver(), []);
});
test("un nouvel âge atteint pendant le cycle se relit à son tour", () => {
  const E = partie(5);
  E.state.cycle = 2; E.state.souvenirs = {};
  E.retrouver("tout");
  assert.deepEqual(E.agesARetrouver(), []);
  E.state.age = 6;
  for (const [id, it] of Object.entries(D.ITEMS)) if (it.r && it.a === 6 && !it.sec && !it.path) E.state.known[id] = true;
  assert.deepEqual(E.agesARetrouver(), [6, 7].filter((a) => Object.keys(E.state.known).some((id) => D.ITEMS[id].a === a && D.ITEMS[id].r && !D.ITEMS[id].sec && !D.ITEMS[id].path)));
});
test("la sauvegarde garde les souvenirs, et une partie d’avant n’a rien à relire", () => {
  const E = partie(4);
  E.state.cycle = 2; E.state.souvenirs = { 0: true };
  const raw = E.serialize();
  const F = createEngine({ now: () => 2e12, rand: () => 0.99 });
  F.load(raw);
  assert.deepEqual(F.state.souvenirs, { 0: true });
  const G = partie(4);
  G.state.cycle = 2;
  const g = createEngine({ now: () => 2e12, rand: () => 0.99 });
  g.load(G.serialize());
  assert.deepEqual(g.agesARetrouver(), [], "pas de souvenirs enregistrés : tout est relu");
});
console.log(passed + " tests du retour de mémoire réussis.");
