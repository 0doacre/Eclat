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
console.log(passed + " tests de la renaissance réussis.");
