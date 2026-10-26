/* ÉCLAT — test des gestes remarqués (succès discrets)
 * Vérifie l’exhaustivité des définitions, la détection des accomplissements,
 * l’horodatage diégétique et la persistance à la relève et à la sauvegarde.
 */
"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const D = require("../js/data.js");
const { createEngine } = require("../js/engine.js");

let ko = 0;
const ok = (m) => console.log("  ✓ " + m);
const echec = (m) => { ko++; console.log("  ✗ " + m); };

console.log("Gestes remarqués (succès discrets) :");

// 1. Définitions et intégrité
const G = D.GESTES_REMARQUES;
if (!G || typeof G !== "object") {
  echec("D.GESTES_REMARQUES manquant");
  process.exit(1);
}

const ids = Object.keys(G);
if (ids.length < 20) {
  echec("Moins de 20 gestes remarqués définis : " + ids.length);
} else {
  ok(ids.length + " gestes remarqués définis");
}

for (const id of ids) {
  const g = G[id];
  if (!g.n || typeof g.n !== "string") echec("Nom manquant pour " + id);
  if (!g.ic || typeof g.ic !== "string") echec("Icône manquante pour " + id);
  if (!g.t || typeof g.t !== "string") echec("Description manquante pour " + id);
  if (!g.hint || typeof g.hint !== "string") echec("Indice manquant pour " + id);
  if (typeof g.when !== "function") echec("Condition when manquante pour " + id);
  if (g.t.length > 90) echec("Description trop longue pour " + id + " : " + g.t);
}
ok("Chaque geste possède son nom, son icône, son fait concis, son indice et sa condition");

// 2. Détection progressive des gestes dans le moteur
const E = createEngine();
E.checkGestes();
assert.strictEqual(E.hasGeste("premiers_pas"), false, "Pas encore accompli au départ");
assert.strictEqual(E.hasNewGeste(), false, "Aucun geste nouveau au départ");

// Tailler un manche
E.state.made.manche = 1;
E.checkGestes();
assert.strictEqual(E.hasGeste("premiers_pas"), true, "Premiers pas validé après avoir taillé un manche");
assert.strictEqual(E.hasNewGeste(), true, "Geste marqué comme non vu");

// Vérification de l'horodatage
const stamp = E.stampOf("g:premiers_pas");
assert.ok(Array.isArray(stamp) && stamp.length === 3, "Horodatage enregistré pour le geste");
assert.strictEqual(stamp[1], 1, "Cycle 1 enregistré");
assert.strictEqual(stamp[2], 0, "Âge du Bois (0) enregistré");
ok("Horodatage diégétique [date, cycle, âge] enregistré lors de l'accomplissement");

// Lecture des gestes
E.readGestes();
assert.strictEqual(E.hasNewGeste(), false, "Le point de nouveauté s'éteint après lecture");
ok("Marquage de consultation (hasNewGeste / readGestes)");

// Allumer un feu
E.state.made.feu = 1;
E.checkGestes();
assert.strictEqual(E.hasGeste("premier_feu"), true, "Première flamme validée après le feu");

// Franchir la Plaine
E.state.zones.plaine = true;
E.checkGestes();
assert.strictEqual(E.hasGeste("premiere_plaine"), true, "Première frontière validée avec la Plaine");

// 3. Persistance à la relève (newCycle)
E.newCycle();
assert.strictEqual(E.state.cycle, 2, "Cycle 2");
assert.strictEqual(E.hasGeste("premiers_pas"), true, "Les gestes précédents sont conservés à la relève");
assert.strictEqual(E.hasGeste("premiere_releve"), true, "La relève des mains se valide automatiquement au cycle 2");
ok("Persistance et validation automatique à travers la relève des Semeurs");

// 4. Aller-retour de sauvegarde (serialize / load)
const saved = E.serialize();
const E2 = createEngine();
E2.load(saved);
assert.strictEqual(E2.hasGeste("premiers_pas"), true, "Survivance après chargement de sauvegarde");
assert.strictEqual(E2.hasGeste("premiere_releve"), true, "Relève gardée après chargement");
const list = E2.gestesList();
assert.strictEqual(list.length, ids.length, "La liste complète des gestes est restituée");
const doneInList = list.filter((x) => x.done).map((x) => x.id);
assert.ok(doneInList.includes("premiers_pas"));
assert.ok(doneInList.includes("premiere_releve"));
ok("Sauvegarde et chargement vérifiés (état, métadonnées et liste UI)");

if (ko > 0) {
  console.log("✗ " + ko + " tests échoués.");
  process.exit(1);
} else {
  console.log("✓ Tous les tests des gestes remarqués sont réussis.");
}
