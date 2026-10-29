/* La renaissance : ce qu’on reprend vite après une relève (réparer les ruines, ce que la réparation compte pour les étapes). */
"use strict";
const assert = require("assert/strict");
const D = require("../js/data.js");
const { createEngine } = require("../js/engine.js");

let passed = 0;
function test(n, fn) {
  try { fn(); passed++; console.log("  ✓ " + n); }
  catch (e) { console.log("  ✗ " + n + "\n    " + (e.stack || e)); process.exitCode = 1; }
}
const mk = () => createEngine({ now: () => 1e12, rand: () => 0.5 });
/* un Semeur qui a des cabanes, des extracteurs et des machines, puis la relève */
function apresRelève() {
  const E = mk();
  E.state.zones.plaine = true;
  const poss = { cabane: 2, fibre_1: 2, caillou_1: 2, automate_bois: 1 };
  for (const id in poss) { if (!D.ITEMS[id]) continue; E.state.inv[id] = poss[id]; E.state.known[id] = true; }
  E.recalc();
  E.newCycle();
  return E;
}

console.log("Renaissance : réparer, et ce que ça compte");
test("après la relève, ce que le Semeur possédait attend en ruine", () => {
  const E = apresRelève();
  const r = E.ruins();
  assert.ok(r.cabane >= 1 || Object.keys(r).length > 0, JSON.stringify(r));
});
test("réparer une ruine compte comme fabriquer : l’étape « fabrique une cabane » est faite", () => {
  const E = apresRelève();
  const id = Object.keys(E.ruins()).find((x) => D.ITEMS[x].t === "ext");
  assert.ok(id, "une ruine d’extracteur");
  assert.ok(!(E.state.made[id] > 0), "pas encore fabriqué ce cycle");
  for (const k in E.ruinCost(id)) E.state.inv[k] = (E.state.inv[k] || 0) + E.ruinCost(id)[k];
  assert.equal(E.repair(id).ok, true);
  assert.ok(E.state.made[id] >= 1, "fabriqué");
  assert.ok(E.state.seen[id], "vu");
});
test("« tout réparer » relève toutes les ruines que la Réserve permet, et seulement celles-là", () => {
  const E = apresRelève();
  const ids = Object.keys(E.ruins());
  const total = ids.reduce((n, id) => n + E.ruins()[id], 0);
  assert.equal(E.repairAll(ids), 0, "Réserve vide : rien");
  // de quoi tout relever
  for (const id of ids) { const c = E.ruinCost(id); for (const k in c) E.state.inv[k] = (E.state.inv[k] || 0) + c[k] * E.ruins()[id]; }
  assert.equal(E.repairAll(ids), total);
  assert.equal(Object.keys(E.ruins()).length, 0);
});
test("« tout réparer » s’arrête quand la Réserve ne suffit plus", () => {
  const E = apresRelève();
  const id = Object.keys(E.ruins()).find((x) => D.ITEMS[x].t === "ext");
  const c = E.ruinCost(id);
  for (const k in c) E.state.inv[k] = c[k]; // une seule réparation
  const avant = E.ruins()[id];
  assert.ok(avant >= 1);
  assert.equal(E.repairAll([id]), 1);
  assert.equal(E.ruins()[id] || 0, avant - 1);
});
test("Piste 2 : les stations de travail restent aussi en ruine (plafonnées à 1) et leur réparation compte comme fabrication", () => {
  const E = mk();
  E.state.zones.plaine = true;
  E.state.inv.four = 1;
  E.state.inv.creuset = 1;
  E.state.known.four = true;
  E.state.known.creuset = true;
  E.recalc();
  E.newCycle();
  const r = E.ruins();
  assert.equal(r.four, 1, "le four est en ruine");
  assert.equal(r.creuset, 1, "le creuset est en ruine");
  const c = E.ruinCost("creuset");
  for (const k in c) E.state.inv[k] = (E.state.inv[k] || 0) + c[k];
  assert.equal(E.repair("creuset").ok, true);
  assert.equal(E.count("creuset"), 1);
  assert.equal(E.state.made.creuset, 1, "réparer la station vaut fabrication pour les étapes");
  assert.ok(!E.ruins().creuset, "plus de ruine après réparation");
});
test("Piste 2 : Raccourci s’étend sur 4 niveaux (jusqu’aux Collines et aux Profondeurs) et Sentier reconnu (-30 %) réduit les passages connus", () => {
  const rac = D.MEMOIRE.find((m) => m.id === "raccourci");
  assert.deepEqual(rac.cost, [6, 15, 35, 75]);
  const E = mk();
  // Cycle 1 long jusqu'aux Profondeurs (âge 4)
  E.state.age = 4;
  for (const z of ["plaine", "riviere", "collines", "mine"]) {
    E.state.zones[z] = true;
    E.state.pass[z] = { paid: {}, done: true };
  }
  const baseCollines = E.passCost("collines");
  const baseDesert = E.passCost("desert");
  E.newCycle();
  assert.equal(E.state.meta.maxAge, 4);
  assert.equal(E.state.meta.passEver.collines, true);
  assert.ok(!E.state.meta.passEver.desert);
  const discCollines = E.passCost("collines");
  const apresDesert = E.passCost("desert");
  for (const k in baseCollines) {
    assert.ok(discCollines[k] < baseCollines[k], "remise Sentier reconnu (-30 %) sur " + k);
  }
  assert.deepEqual(apresDesert, baseDesert, "aucune remise sur une terre jamais franchie");
  // Raccourci niveau 3 ouvre Plaine, Rivière et Collines + donne pioche_pierre et hache_pierre
  E.state.meta.mem.raccourci = 3;
  E.newCycle();
  assert.equal(E.state.zones.collines, true);
  assert.equal(E.count("pioche_pierre"), 1);
  assert.equal(E.count("hache_pierre"), 1);
});
test("Piste 1 & 4 : en rattrapage après une longue partie, pas d’alerte de relève prématurée, pas de fatigue, et bonus Mémoire fraîche", () => {
  const E1 = mk();
  const tCycle1 = E1.handTime("four");
  // Le joueur pousse son cycle 1 jusqu'à l'âge 5 (Acier / Désert)
  E1.state.age = 5;
  for (const z of ["plaine", "riviere", "collines", "mine", "desert"]) {
    E1.state.zones[z] = true;
    E1.state.pass[z] = { paid: {}, done: true };
  }
  E1.newCycle();
  assert.equal(E1.isCatchingUp(), true, "le cycle 2 démarre en rattrapage du front pionnier (âge 5)");
  // Le joueur franchit Plaine + Rivière + Collines pendant son rattrapage (+7 Traces en attente)
  for (const z of ["plaine", "riviere", "collines"]) {
    E1.state.zones[z] = true;
    E1.state.pass[z] = { paid: {}, done: true };
  }
  E1.state.age = 3;
  assert.ok(E1.releveGain() >= 6, "au moins 6 Traces gagnées en chemin");
  assert.equal(E1.isCatchingUp(), true, "toujours en rattrapage (3 < maxAge 5)");
  assert.equal(E1.shouldSuggestReleve(), null, "aucune suggestion de relève tant qu’on rattrape son front pionnier");
  // Piste 4 : pas de pénalité de fatigue, et façonnage plus rapide qu'au cycle 1 grâce à la Mémoire fraîche
  const tCatchup = E1.handTime("four");
  assert.ok(tCatchup < tCycle1, "Mémoire fraîche accélère le façonnage pendant le rattrapage (" + tCatchup + " < " + tCycle1 + ")");
  // Même si le joueur lance une grosse commande en lot (×10 cabanes > 30 s), pas d'alerte
  ["manche", "corde", "cabane"].forEach((k) => (E1.state.known[k] = true));
  E1.add("bois", 2000); E1.add("fibre", 2000);
  assert.ok(E1.queue("cabane", 10, true).ok);
  assert.equal(E1.shouldSuggestReleve(), null, "un lot ×10 ou en chaîne ne déclenche pas d’alerte de relève");
  // Une fois que le joueur a dépassé son front pionnier (âge 7 > max(1+2*2, 5+1)=6 et toutes les anciennes terres rouvertes)
  for (const z of ["mine", "desert", "marais"]) {
    E1.state.zones[z] = true;
    E1.state.pass[z] = { paid: {}, done: true };
  }
  E1.state.age = 7;
  assert.equal(E1.isCatchingUp(), false, "front pionnier dépassé");
  const sug = E1.shouldSuggestReleve();
  assert.ok(sug && sug.gain > 0, "la relève est proposée une fois le front pionnier dépassé");
});
console.log(passed + " tests de la renaissance réussis.");
