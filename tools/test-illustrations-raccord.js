"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm"), assert = require("assert/strict");
const D = require("../js/data"), Core = require("../js/engine"), root = path.resolve(__dirname, "..");
const window = {}, document = { addEventListener() {} };
const context = vm.createContext({ window, document, Date, URL });
for (const file of ["illustrations", "decouvertes-carnet", "passerelle-chantier"]) vm.runInContext(fs.readFileSync(path.join(root, "js", file + ".js"), "utf8"), context);
const registry = window.ECLAT_ILLUSTRATIONS, sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
for (const [id, item] of Object.entries(D.ITEMS)) if (item.a === 2 || item.a === 3) {
  assert(registry.hasItem(id), "illustration : " + id);
  assert(fs.existsSync(path.join(root, registry.getItem(id))), id);
  assert(sw.includes('"' + registry.getItem(id) + '"'), "précache : " + id);
}
for (const id of ["argile", "silex", "sable", "malachite", "cassiterite"]) {
  assert(registry.hasSource(id), id);
  assert(sw.includes('"' + registry.getSource(id) + '"'), id);
}
const cases = [
  ["riviere", "gue", "galet", 0], ["riviere", "carcasse", "carcasse", 1], ["riviere", "escalier", "escalier", 2],
  ["collines", "rails", "rails", 0], ["collines", "sommet", "vue", 1], ["collines", "nid", "nid", 2]
];
for (const [zone, id, fragment, index] of cases) {
  const E = Core.createEngine();
  const view = window.EclatDecouvertesCarnet.create({ E, A: {}, esc: String, openModal() {}, zone });
  assert(!view.studyHTML().includes('data-carnet-plate="' + id + '"'), "pas de révélation avant exploration : " + id);
  E.state.frags[fragment] = true;
  assert(view.studyHTML().includes('data-carnet-plate="' + id + '"'), "mémoire de fragment : " + id);
  delete E.state.frags[fragment];
  const current = E.RECIT.expFrag[zone + ":" + id] || fragment;
  E.state.frags[current] = true;
  assert(view.studyHTML().includes('data-carnet-plate="' + id + '"'), "fragment actuel : " + id);
  delete E.state.frags[current];
  E.state.exp.active = { z: zone, i: index };
  assert(view.studyHTML().includes('data-pending="true"'), "étude en préparation : " + id);
  assert(!view.studyHTML().includes('data-carnet-plate="' + id + '"'), "pas d’image pendant exploration : " + id);
  E.state.exp.active = null;
  const page = Object.entries(E.RECIT.pages).find(([, p]) => (p.src || []).some(s => s.k === "exp" && s.at === zone + ":" + id));
  assert(page, id);
  E.state.livre = { p: { [page[0]]: true } };
  assert(view.studyHTML().includes('data-carnet-plate="' + id + '"'), "mémoire du carnet après relève : " + id);
  assert(sw.includes('"assets/carnet/discoveries/' + id + '.webp"'), "précache découverte : " + id);
}
const E = Core.createEngine();
assert.equal(window.EclatPasserelle.html(E), "", "chantier caché avant disponibilité");
E.state.zones.riviere = true;
const before = E.serialize();
assert(window.EclatPasserelle.html(E).includes('data-passerelle-target="1"'), "passerelle conservée dans une ancienne partie");
assert.equal(E.serialize(), before, "illustration sans modification de sauvegarde");
for (const id of ["berges", "passerelle-charpente", "passerelle-terminee"]) assert(sw.includes('"assets/carnet/passages/' + id + '.webp"'), id);
console.log("✓ illustrations : inventaire, fichiers hors ligne, découvertes cachées et mémoire des sauvegardes");
