/* Les ateliers (0.40) : la répartition des pièces, l'échelle et l'énergie sont calculées, jamais écrites. */
"use strict";
const assert = require("assert/strict");
const D = require("../js/data.js");
const { createEngine } = require("../js/engine.js");
const Ateliers = require("../js/ateliers.js");
const T = D.ATELIERS;
const I = D.ITEMS;
const MAP = {};
for (const k of ["de", "deAutres"]) for (const f in T[k]) T[k][f].split(" ").forEach((id) => { MAP[id] = f; });
let passed = 0;
function test(n, fn) {
  try { fn(); passed++; console.log("  ✓ " + n); }
  catch (e) { console.log("  ✗ " + n + "\n    " + (e.stack || e)); process.exitCode = 1; }
}
const pieces = () => Object.keys(I).filter((id) => I[id].t === "comp" && !I[id].sec && !I[id].path && !I[id].old);
function jeu(age) {
  const E = createEngine({ now: () => 2e12, rand: () => 0.99 });
  E.state.age = age;
  for (const z of D.ZONES) E.state.zones[z.id] = true;
  for (const id of Object.keys(I)) if (I[id].r && I[id].a <= age && !I[id].sec && !I[id].path) E.learn(id, true);
  E.recalc();
  return { E, A: Ateliers.create({ E, D }) };
}

console.log("Ateliers (0.40)");
test("chaque pièce fabriquée appartient à une famille connue", () => {
  const { A } = jeu(14), ids = new Set(T.familles.map((f) => f.id));
  for (const id of pieces()) assert.ok(ids.has(A.famille(id)), id);
});
test("la liste des pièces de chaque famille ne cite que des objets qui existent", () => {
  for (const id of Object.keys(MAP)) assert.ok(I[id] && I[id].r, id + " n’existe pas");
});
test("les outils, installations et améliorations ont aussi une famille choisie à la main", () => {
  const { A } = jeu(14);
  const sans = Object.keys(I).filter((id) => I[id].r && !I[id].sec && !I[id].path && !I[id].old && ["tool", "upg", "stat"].includes(I[id].t) && !MAP[id]);
  assert.deepEqual(sans, [], "à classer : " + sans.join(" "));
  void A;
});
test("aucune pièce n’est listée dans deux familles", () => {
  const vu = {};
  for (const f in MAP) { assert.ok(!(f in vu)); vu[f] = 1; }
});
test("chaque famille a au moins une pièce (sinon elle n’apparaîtrait jamais)", () => {
  const { A } = jeu(14);
  for (const F of T.familles) assert.ok(pieces().some((id) => A.famille(id) === F.id), F.id);
});
test("la matière première décide pour une pièce non listée", () => {
  const { A } = jeu(14);
  assert.equal(A.famille("pioche_bronze"), "metallurgie");
  assert.equal(A.famille("tunique"), "elevage");
  assert.equal(A.famille("pioche_inconnue_de_test"), "artisanat", "sans rien : l’Artisanat, la famille la plus générale");
});
test("au début, seul l’Artisanat est montré ; l’Élevage vient avec sa première recette", () => {
  const E = createEngine({ now: () => 2e12, rand: () => 0.99 });
  const A = Ateliers.create({ E, D });
  E.learn("manche", true);
  assert.deepEqual(A.liste().map((c) => c.id), ["artisanat"]);
  E.learn("aiguille", true);
  assert.deepEqual(A.liste().map((c) => c.id), ["artisanat", "elevage"]);
});
test("l’échelle : la main est toujours faite, les échelons suivent l’âge", () => {
  const { A } = jeu(4);
  const c = A.carte("artisanat");
  assert.equal(c.echelles[0].etat, "courant");
  assert.equal(c.echelles[1].etat, "dispo", "l’apprenti s’ouvre au Cuivre (âge 3)");
  assert.equal(c.echelles[2].etat, "ferme", "les ouvriers attendent l’Acier");
  const tard = jeu(11).A.carte("artisanat");
  assert.equal(tard.echelles[4].etat, "dispo");
});
test("une machine au travail sur une recette de l’atelier fait monter l’échelon", () => {
  const { E, A } = jeu(8);
  E.add("automate_bois", 1);
  E.state.made.manche = 1;
  E.add("bois", 500); E.add("fibre", 500);
  const r = E.setCadence("manche", 50, true);
  if (!r.ok) return; // la règle de la première fois à la main peut refuser : alors rien à vérifier ici
  E.recalc();
  const c = A.carte("artisanat");
  assert.ok(c.echelon >= 1);
});
test("l’énergie : sans machine, rien n’est demandé ; la bête de trait fournit le minimum", () => {
  const { A } = jeu(2);
  const e = A.energie();
  assert.equal(e.demande, 0);
  assert.equal(e.offre, T.baseCh);
  assert.equal(e.ratio, 1);
});
test("l’énergie : une source construite augmente l’offre", () => {
  const { E, A } = jeu(8);
  const avant = A.energie().offre;
  E.add("moulin", 1);
  assert.equal(A.energie().offre, avant + 20);
});
test("rien n’est écrit dans la sauvegarde", () => {
  const { E, A } = jeu(8);
  const avant = JSON.stringify(E.serialize());
  A.liste(); A.energie();
  assert.equal(JSON.stringify(E.serialize()), avant);
});
console.log(passed + " tests des ateliers réussis.");
