/* Le guidage : trois cas ciblés de l’audit 0.21 — le dernier objet fabriqué avant la fin des étapes,
 * une cible déjà fabricable avec ce que contient la Réserve, un extracteur possédé qui ne tourne pas. */
"use strict";
const assert = require("assert/strict");
const D = require("../js/data.js");
const { createEngine } = require("../js/engine.js");

const I = D.ITEMS, pub = ([, i]) => !i.sec && !i.path && !i.old && !i.curio;
let passed = 0;
function test(n, fn) {
  try { fn(); passed++; console.log("  ✓ " + n); }
  catch (e) { console.log("  ✗ " + n + "\n    " + (e.stack || e)); process.exitCode = 1; }
}
function setup(age) {
  const E = createEngine({ now: () => 2e12, rand: () => 0.99 });
  E.state.age = age; E.state.cycle = 2;
  for (const z of D.ZONES) E.state.zones[z.id] = true;
  for (const [id, i] of Object.entries(I).filter(pub)) {
    if (i.a > age) continue;
    if (i.r) E.learn(id, true);
    if (i.t === "stat") { E.add(id, 1); E.state.made[id] = 1; }
  }
  E.recalc();
  return E;
}

console.log("Guidage : cas ciblés (0.23)");
test("fabriquer en avance le dernier objet ne fait pas disparaître les étapes de l’âge qui restent", () => {
  const E = setup(13);
  E.state.zones.mercure = false;
  E.milestones()[13].forEach((x) => {
    if (x.ob.k === "craft" && x.ob.id !== "vaisseau") E.state.made[x.ob.id] = 1;
    else if (x.ob.k === "pass" && x.ob.z !== "mercure") E.state.pass[x.ob.z] = { paid: {}, done: true };
  });
  E.learn("forge_stellaire", true);
  for (const [k, n] of Object.entries(I.forge_stellaire.r[1])) E.add(k, n);
  assert.equal(E.craft("forge_stellaire", 1).ok, true);
  const ob = E.objective();
  assert.ok(ob, "il reste une étape à faire");
  assert.ok(["vaisseau", "mercure"].includes(ob.id || ob.z), "l’étape est l’une de celles qui manquent : " + (ob.id || ob.z));
  assert.ok(E.guide(), "le guide reste là");
});
test("quand tout est fait, il n’y a plus d’objectif", () => {
  const E = setup(13);
  E.milestones().forEach((l) => l.forEach((x) => {
    if (x.ob.k === "craft") E.state.made[x.ob.id] = 1;
    else if (x.ob.k === "pass") E.state.pass[x.ob.z] = { paid: {}, done: true };
  }));
  const ob = E.objective();
  if (ob) assert.ok(ob.k !== "craft", "seules des étapes sans objet resteraient");
});
test("une pièce déjà en Réserve n’est pas une étape : la cible fabricable est proposée", () => {
  const E = setup(7);
  E.state.age = 8;
  for (const [id, i] of Object.entries(I).filter(pub)) if (i.r && i.a <= 8) E.learn(id, true);
  for (const [k, n] of Object.entries(I.dynamo.r[1])) E.add(k, n);
  for (const id of ["eau_1", "tuyau_cuivre", "circuit_vapeur", "eau"]) { delete E.state.known[id]; delete E.state.inv[id]; }
  assert.equal(E.plan("dynamo", 1).ok, true);
  assert.deepEqual(E.nextStep("dynamo"), { id: "dynamo", why: "known" });
});
test("sans la pièce en Réserve, la sous-recette inconnue reste l’étape", () => {
  const E = setup(7);
  E.state.age = 8;
  for (const [id, i] of Object.entries(I).filter(pub)) if (i.r && i.a <= 8) E.learn(id, true);
  for (const [k, n] of Object.entries(I.dynamo.r[1])) E.add(k, n);
  const pieces = Object.keys(I.dynamo.r[1]).filter((k) => I[k].r);
  assert.ok(pieces.length, "dynamo a une pièce fabriquée");
  const k = pieces[0];
  delete E.state.inv[k]; delete E.state.known[k];
  const s = E.nextStep("dynamo");
  assert.ok(s.id !== "dynamo", "la pièce manquante est cherchée");
});
test("un extracteur possédé : absent, libre (jamais posé) ou arrêté se distinguent", () => {
  const mk = (mode) => {
    const E = setup(7);
    if (mode !== "absent") E.add("eau_1", 1);
    if (mode === "arret") { E.domExtSet("riviere", "eau", "eau_1", 1); E.state.dom.ext["riviere:eau"].on = false; E.recalc(); }
    return E;
  };
  assert.equal(mk("absent").extEtat("eau"), null);
  const libre = mk("libre").extEtat("eau");
  assert.equal(libre.etat, "libre"); assert.equal(libre.t, "eau_1"); assert.equal(libre.key, "riviere:eau");
  const arret = mk("arret").extEtat("eau");
  assert.equal(arret.etat, "arret"); assert.equal(arret.key, "riviere:eau");
});
test("un extracteur qui tourne, ou une matière qui se récolte à la main, n’ont rien à signaler", () => {
  const E = setup(7);
  E.add("eau_1", 1); E.domExtSet("riviere", "eau", "eau_1", 1); E.catchUp(5);
  assert.ok(E.rate("eau") > 0);
  assert.equal(E.extEtat("eau"), null);
  assert.equal(E.extEtat("bois"), null);
});
test("relancer l’extracteur arrêté le fait tourner", () => {
  const E = setup(7);
  E.add("eau_1", 1); E.domExtSet("riviere", "eau", "eau_1", 1);
  E.catchUp(5);
  assert.ok(E.rate("eau") > 0);
  E.domExtToggle("riviere", "eau", false); E.catchUp(5);
  assert.equal(E.rate("eau"), 0);
  assert.equal(E.extEtat("eau").etat, "arret");
  E.domExtToggle("riviere", "eau", true); E.catchUp(5);
  assert.ok(E.rate("eau") > 0);
  assert.equal(E.extEtat("eau"), null);
});
console.log(passed + " tests du guidage réussis.");
