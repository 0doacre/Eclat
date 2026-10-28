"use strict";
const assert = require("assert/strict"), D = require("../js/data"), { createEngine } = require("../js/engine");
const mk = () => createEngine({ now: () => 2e12, rand: () => .99 });
let count = 0;
function test(name, f) { try { f(); count++; console.log("✓ " + name); } catch (e) { console.error(name, e); process.exitCode = 1; } }
function prepared() {
  const E = mk(); for (const id of ["manche", "corde", "cabane"]) E.learn(id, true); E.add("cabane", 2); E.domExtSet("lisiere", "bois", "cabane", 2);
  E.state.made.panier = 1; E.state.made.cabane = 2; E.state.made.corde = 10;
  E.state.pass.plaine = { done: true, paid: {} }; E.newCycle(); return E;
}
function fund(E) { for (const id of Object.keys(D.ITEMS)) if (!D.ITEMS[id].r) E.add(id, 10000); for (const [id, n] of Object.entries(E.ruinCost("cabane"))) E.add(id, n * 10); }
test("snapshot exact, devis sans dépense, réparations et pose payées une seule fois", () => {
  const E = prepared(); assert.equal(E.repriseRows().find(r => r.id === "cabane").n, 2); fund(E);
  const before = E.serialize(), q = E.repriseQuote(); assert.equal(E.serialize(), before); assert.equal(q.actions.length, 2);
  const stock = { ...E.state.inv }; assert.deepEqual(E.repriseApply(q), { ok: true, applied: 2, skipped: 0 });
  assert.equal(E.domExt("lisiere", "bois").u.cabane, 2);
  for (const [id, n] of Object.entries(q.cost)) assert.equal(E.count(id), stock[id] - n);
  assert.equal(E.repriseApply(q).applied, 0); assert.equal(E.repriseQuote().actions.length, 0);
});
test("aucune dépense différée et la sélection survit au rechargement", () => {
  const E = prepared(); const before = E.serialize(); assert.equal(E.repriseQuote().actions.length, 0); assert.equal(E.serialize(), before);
  E.repriseSelect(0, false); fund(E); const F = mk(); F.load(E.serialize());
  assert.equal(F.repriseRows()[0].selected, false); assert.equal(F.repriseQuote().actions.length, 0);
});
test("un devis refuse une autre relève, une autre sélection et un coût devenu supérieur", () => {
  const E = prepared(); fund(E); const q = E.repriseQuote();
  E.repriseSelect(0, false); assert.equal(E.repriseApply(q).ok, false);
  E.repriseSelect(0, true); E.state.cycle++; assert.equal(E.repriseApply(q).ok, false); E.state.cycle--;
  for (const id of Object.keys(q.cost)) E.state.inv[id] = 0;
  assert.equal(E.repriseApply(q).applied, 0);
});
test("les constructions commandées ne sont pas dupliquées ni achevées instantanément", () => {
  const E = prepared(); E.state.meta.ruins = {}; fund(E); E.learn("corde", true); E.learn("manche", true);
  const q = E.repriseQuote(); assert.ok(q.actions.some(a => a.kind === "order"));
  assert.ok(E.repriseApply(q).applied > 0); assert.ok(E.queued("cabane") > 0); assert.equal(E.count("cabane"), 0);
  assert.equal(E.repriseQuote().actions.length, 0);
});
test("les commandes mises en pause par le lot 2 gardent leurs matières et ne sont pas dupliquées", () => {
  const E = prepared(); E.state.meta.ruins = {}; fund(E);
  E.repriseApply(E.repriseQuote());
  const job = E.state.hand.q[0]; assert.ok(job);
  E.pauseJob(job.uid); const before = E.serialize();
  assert.equal(E.repriseQuote().actions.length, 0); assert.equal(E.serialize(), before);
  assert.equal(job.paused, true);
});
test("terres fermées, commandes et installations personnelles sont préservées", () => {
  const E = prepared(); fund(E); E.add("fibre_1", 1); E.domExtSet("lisiere", "fibre", "fibre_1", 1);
  const q = E.repriseQuote(); E.repriseApply(q);
  assert.equal(E.domExt("lisiere", "fibre").u.fibre_1, 1);
  assert.equal(E.domExt("lisiere", "bois").u.cabane, 2);
  E.state.meta.reprise.rows = [{ id: "cabane", n: 1, z: "plaine", res: "cuir" }];
  assert.equal(E.repriseQuote().actions.length, 0);
});
test("un cycle court conserve la référence la plus avancée, un reset efface le plan", () => {
  const E = prepared(); E.state.meta.reprise.depth = 10; E.state.pass.plaine = { done: true, paid: {} }; E.newCycle();
  assert.equal(E.repriseRows()[0].n, 2); assert.equal(E.state.meta.reprise.cycle, 1); E.reset(); assert.equal(E.repriseRows().length, 0);
});
test("les objectifs familiers se regroupent sans masquer une découverte ou un suivi", () => {
  const E = prepared(); const g = { ob: { k: "craft", id: "corde" } };
  assert.ok(E.repriseGoal(g)); assert.equal(E.repriseGoal({ ob: { k: "craft", id: "feu" } }), null);
  E.state.track = { id: "panier" }; assert.equal(E.repriseGoal(g), null);
});
test("une ancienne partie retrouve ses ruines et les identifiants invalides sont ignorés", () => {
  const E = mk(); E.state.cycle = 6; E.state.meta.ruins = { cabane: 2 };
  assert.equal(E.repriseRows().length, 1); assert.equal(E.state.meta.reprise.inferred, true);
  E.state.meta.reprise.rows.push(null, { id: "inconnu", n: 10 }, { id: "cabane", n: Infinity, z: "lisiere", res: "bois" });
  const F = mk(); F.load(E.serialize()); assert.equal(F.repriseRows().length, 1);
});
console.log(count + " tests de reprise réussis.");
