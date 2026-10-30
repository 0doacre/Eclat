/* 0.41 : apprentis et ouvriers par atelier, embauchés en écus ; l'ancienne boucle de l'argent est retirée. */
"use strict";
const assert = require("assert/strict");
const D = require("../js/data.js");
const { createEngine } = require("../js/engine.js");
const Ateliers = require("../js/ateliers.js");
const TR = D.TRAVAILLEURS;
let passed = 0;
function test(n, fn) {
  try { fn(); passed++; console.log("  ✓ " + n); }
  catch (e) { console.log("  ✗ " + n + "\n    " + (e.stack || e)); process.exitCode = 1; }
}
let t;
function jeu(age) {
  t = 2e12;
  const E = createEngine({ now: () => t, rand: () => 0.99 });
  E.state.age = age;
  for (const z of D.ZONES) E.state.zones[z.id] = true;
  for (const [id, it] of Object.entries(D.ITEMS)) if (it.r && it.a <= age && !it.sec && !it.path) E.learn(id, true);
  E.recalc();
  return { E, A: Ateliers.create({ E, D }) };
}
const avance = (E, s) => { for (let i = 0; i < s; i++) { t += 1000; E.update(); } };

console.log("Travailleurs (0.41)");
test("pas d'apprenti avant son âge", () => {
  const { E } = jeu(2);
  E.state.ecus = 1000;
  assert.equal(E.embaucher("artisanat", "apprenti").why, "age");
});
test("embaucher coûte des écus, de plus en plus à chaque embauche", () => {
  const { E } = jeu(5);
  E.state.ecus = 1000;
  const c1 = E.coutEmbauche("artisanat", "apprenti");
  assert.equal(c1, TR.apprenti.cout);
  assert.equal(E.embaucher("artisanat", "apprenti").ok, true);
  assert.equal(E.state.ecus, 1000 - c1);
  assert.equal(E.coutEmbauche("artisanat", "apprenti"), Math.round(TR.apprenti.cout * TR.apprenti.croiss));
  assert.equal(E.state.ateliers.artisanat.app, 1);
});
test("sans assez d'écus : refusé, rien n'est débité", () => {
  const { E } = jeu(5);
  E.state.ecus = 5;
  const r = E.embaucher("artisanat", "apprenti");
  assert.equal(r.ok, false); assert.equal(r.why, "ecus");
  assert.equal(E.state.ecus, 5);
  assert.equal(E.state.ateliers.artisanat, undefined);
});
test("un nombre maximum par atelier", () => {
  const { E } = jeu(5);
  E.state.ecus = 1e9;
  for (let i = 0; i < TR.apprenti.max; i++) assert.equal(E.embaucher("metallurgie", "apprenti").ok, true);
  assert.equal(E.embaucher("metallurgie", "apprenti").why, "max");
});
test("une famille inconnue ou sans recette connue ne peut pas embaucher", () => {
  const { E } = jeu(5);
  E.state.ecus = 1e9;
  assert.equal(E.embaucher("nimporte", "apprenti").why, "inconnu");
  const vide = jeu(5).E; vide.state.known = {}; vide.state.ecus = 1e9;
  assert.equal(vide.embaucher("artisanat", "apprenti").why, "vide");
});
test("un apprenti fabrique, pour son atelier seulement, à la moitié de la vitesse des mains", () => {
  const { E } = jeu(5);
  E.state.ecus = 1000;
  for (const [id, n] of Object.entries({ bois: 500, fibre: 500, os: 500, cuir: 500 })) E.add(id, n);
  E.state.made.manche = 1; E.state.made.aiguille = 1;
  assert.equal(E.embaucher("artisanat", "apprenti").ok, true);
  assert.equal(E.setCadence("manche", 20, true).ok, true, "une recette de l'artisanat se confie à l'apprenti");
  const avant = E.count("manche");
  avance(E, 60);
  assert.ok(E.count("manche") > avant, "l'apprenti a fabriqué des manches");
  assert.equal(E.setCadence("aiguille", 20, true).ok === true && E.cadences().find((c) => c.id === "aiguille").status === "nomach", true, "l'élevage n'a pas d'apprenti : pas de travailleur capable");
});
test("l'apprenti est plus lent qu'un ouvrier", () => {
  const faire = (kind) => {
    const { E } = jeu(8);
    E.state.ecus = 1e6;
    E.add("bois", 5000);
    E.state.made.manche = 1;
    assert.equal(E.embaucher("artisanat", kind).ok, true);
    E.setCadence("manche", 10000, true);
    const a = E.count("manche");
    avance(E, 120);
    return E.count("manche") - a;
  };
  assert.ok(faire("ouvrier") > faire("apprenti"));
});
test("les travailleurs au travail demandent des chevaux", () => {
  const { E, A } = jeu(8);
  E.state.ecus = 1e6;
  E.add("bois", 5000);
  E.state.made.manche = 1;
  E.embaucher("artisanat", "ouvrier");
  E.setCadence("manche", 10000, true);
  avance(E, 5);
  assert.ok(A.energie().demande >= TR.ouvrier.ch);
});
test("migration : l'apprenti de l'établi devient l'apprenti de l'Élevage, l'avance revient dans la bourse", () => {
  const { E } = jeu(5);
  const o = JSON.parse(E.serialize());
  o.ecus = 10;
  o.atelierEconomy = { v: 1, hired: true, working: true, budget: 7, merchant: true, sold: 40, tax: 3 };
  const F = createEngine({ now: () => 2e12, rand: () => 0.99 });
  F.load(JSON.stringify(o));
  assert.equal(F.state.ateliers.elevage.app, 1);
  assert.equal(F.state.ecus, 17);
  assert.equal(F.state.atelierEconomy, undefined, "l'ancienne boucle n'existe plus dans la partie");
});
test("une partie sans ateliers ni ancienne boucle se charge intacte", () => {
  const { E } = jeu(5);
  const o = JSON.parse(E.serialize());
  delete o.ateliers;
  const F = createEngine({ now: () => 2e12, rand: () => 0.99 });
  F.load(JSON.stringify(o));
  assert.deepEqual(F.state.ateliers, {});
});
test("une sauvegarde abîmée est remise d'aplomb (valeurs hors limites, famille inconnue)", () => {
  const { E } = jeu(5);
  const o = JSON.parse(E.serialize());
  o.ateliers = { artisanat: { app: 99, ouv: -3 }, fantome: { app: 1, ouv: 1 }, elevage: "oups" };
  const F = createEngine({ now: () => 2e12, rand: () => 0.99 });
  F.load(JSON.stringify(o));
  assert.deepEqual(F.state.ateliers, { artisanat: { app: TR.apprenti.max, ouv: 0 } });
});
test("l'équipe se lit dans la carte de l'atelier", () => {
  const { E, A } = jeu(8);
  E.state.ecus = 1e6;
  E.embaucher("artisanat", "apprenti"); E.embaucher("artisanat", "ouvrier");
  const c = A.carte("artisanat");
  assert.equal(c.apprentis, 1); assert.equal(c.ouvriers, 1);
  assert.equal(c.echelon, 0, "les travailleurs ne font pas monter l'échelle des machines");
  assert.ok(c.embauches.every((e) => ["apprenti", "ouvrier"].includes(e.kind)));
});
test("l'ancienne vente automatique n'existe plus", () => {
  const { E } = jeu(5);
  E.add("laniere", 50);
  assert.ok(!E.merchantSell || E.merchantSell(50).ok === false);
  assert.equal(E.count("laniere"), 50);
});
console.log(passed + " tests des travailleurs réussis.");
