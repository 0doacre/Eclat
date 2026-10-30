/* 0.44 : l'énergie agit — machines et travailleurs ralentissent avec le manque, jamais sous le plancher, jamais les mains. */
"use strict";
const assert = require("assert/strict");
const D = require("../js/data.js");
const { createEngine } = require("../js/engine.js");
const Ateliers = require("../js/ateliers.js");
let passed = 0;
function test(n, fn) {
  try { fn(); passed++; console.log("  ✓ " + n); }
  catch (e) { console.log("  ✗ " + n + "\n    " + (e.stack || e)); process.exitCode = 1; }
}
const T = D.ATELIERS, base = T.baseCh, plancher = T.plancherEnergie;
function jeu() {
  let t = 2e12;
  const E = createEngine({ now: () => t, rand: () => 0.99 });
  E.state.age = 5;
  for (const z of D.ZONES) E.state.zones[z.id] = true;
  for (const [id, it] of Object.entries(D.ITEMS)) if (it.r && it.a <= 5 && !it.sec && !it.path) E.learn(id, true);
  E.recalc(); E.state.ecus = 1e9;
  const avance = (s) => { for (let i = 0; i < s; i++) { t += 1000; E.update(); } };
  return { E, A: Ateliers.create({ E, D }), avance };
}
function embauche(E, avance) {
  E.add("bois", 50000); E.state.made.manche = 1;
  for (let i = 0; i < 3; i++) assert.equal(E.embaucher("artisanat", "apprenti").ok, true);
  E.setCadence("manche", 100000, true);
  avance(3);
  return "manche";
}
console.log("Énergie (0.44)");
test("le plancher du jeu est 0,5", () => assert.equal(plancher, 0.5));
test("sans demande, le facteur est 1", () => { const { E, avance } = jeu(); avance(3); assert.equal(E.energieFacteur(), 1); });
test("la demande dépasse l'offre : le facteur suit offre / demande, jamais sous le plancher", () => {
  const { E, A, avance } = jeu(); embauche(E, avance);
  try {
    T.baseCh = 1; E.energieRecalc();
    const e = A.energie();
    assert.ok(e.demande > e.offre, "demande " + e.demande + " offre " + e.offre);
    assert.equal(E.energieFacteur(), Math.max(plancher, Math.min(1, e.offre / e.demande)));
    assert.equal(E.energieFacteur(), e.facteur);
    T.baseCh = 1e6; E.energieRecalc();
    assert.equal(E.energieFacteur(), 1);
    T.baseCh = 1; T.plancherEnergie = 0.2; E.energieRecalc();
    assert.ok(E.energieFacteur() >= 0.2 && E.energieFacteur() < 0.5);
  } finally { T.baseCh = base; T.plancherEnergie = plancher; }
});
test("le manque ralentit les travailleurs dans la même proportion, pas les mains", () => {
  const { E, avance } = jeu(); embauche(E, avance);
  const fabrique = (baseCh) => { T.baseCh = baseCh; E.energieRecalc(); const a = E.count("manche"); avance(30); return { f: E.energieFacteur(), n: E.count("manche") - a }; };
  try {
    const plein = fabrique(1e6), juste = fabrique(1);
    assert.equal(plein.f, 1); assert.ok(juste.f < 1 && juste.f >= plancher);
    assert.ok(juste.n < plein.n, "moins de manches : " + juste.n + " contre " + plein.n);
    assert.ok(juste.n > 0.3 * plein.n);
  } finally { T.baseCh = base; }
});
test("l'énergie n'écrit rien dans la sauvegarde", () => {
  const { E, avance } = jeu(); embauche(E, avance);
  assert.ok(!JSON.stringify(E.state).includes("energie"));
});
console.log(passed + " tests de l’énergie réussis.");
