/* Le jeu dans l’appareil : ce que le bouton Retour décide. Le reste (historique, titre, clavier) est dans tools/test-appareil-ui.js. */
"use strict";
const assert = require("assert/strict");
const fs = require("fs"), path = require("path");
const { decisionRetour, ONGLETS } = require("../js/appareil.js");

let passed = 0;
function test(n, fn) {
  try { fn(); passed++; console.log("  ✓ " + n); }
  catch (e) { console.log("  ✗ " + n + "\n    " + (e.stack || e)); process.exitCode = 1; }
}
const base = { fenetre: { ouverte: false }, onglet: "domaine", dernierRetour: 0, maintenant: 10000 };
console.log("Le jeu dans l’appareil (0.26)");
test("Retour ferme une fenêtre ouverte, quel que soit l’écran", () => {
  assert.equal(decisionRetour({ ...base, onglet: "carnet", fenetre: { ouverte: true, fermable: true } }), "fermer");
});
test("Retour ne ferme pas une fenêtre qu’on ne peut pas fermer d’un geste, et ne quitte pas non plus", () => {
  assert.equal(decisionRetour({ ...base, fenetre: { ouverte: true, fermable: false } }), "rester");
});
test("Retour ramène au Domaine depuis un autre écran", () => {
  for (const o of ONGLETS.filter((x) => x !== "domaine")) assert.equal(decisionRetour({ ...base, onglet: o }), "domaine", o);
});
test("au Domaine, la première fois on prévient, la seconde (dans les 2,5 s) on quitte", () => {
  assert.equal(decisionRetour(base), "prevenir");
  assert.equal(decisionRetour({ ...base, dernierRetour: 8000 }), "quitter");
  assert.equal(decisionRetour({ ...base, dernierRetour: 7000 }), "prevenir", "trop tard : on prévient de nouveau");
});
test("les raccourcis suivent l’ordre de la barre d’onglets de la page", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const tabs = [...html.matchAll(/<nav id="tabs">([\s\S]*?)<\/nav>/g)][0][1].match(/data-tab="(\w+)"/g).map((x) => x.slice(10, -1));
  assert.deepEqual(ONGLETS, tabs);
});
test("le module est dans la page et dans le cache hors ligne", () => {
  const root = path.resolve(__dirname, "..");
  assert.ok(/js\/appareil\.js/.test(fs.readFileSync(path.join(root, "index.html"), "utf8")));
  assert.ok(/js\/appareil\.js/.test(fs.readFileSync(path.join(root, "sw.js"), "utf8")));
});
console.log(passed + " tests de l’appareil réussis.");
