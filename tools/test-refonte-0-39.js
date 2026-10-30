/* Refonte 0.39 : la première pièce offerte, la chaîne manquante, la liste des apprentis. */
"use strict";
const assert = require("assert/strict");
const D = require("../js/data.js");
const { createEngine } = require("../js/engine.js");

let passed = 0;
function test(n, fn) {
  try { fn(); passed++; console.log("  ✓ " + n); }
  catch (e) { console.log("  ✗ " + n + "\n    " + (e.stack || e)); process.exitCode = 1; }
}
function fresh(age) {
  const E = createEngine({ now: () => 2e12, rand: () => 0.99 });
  E.state.age = age;
  for (const z of D.ZONES) if (z.id === "plaine") E.state.zones[z.id] = true;
  for (const g of Object.keys(D.GESTES || {})) E.state.gestes && (E.state.gestes[g] = E.state.gestes[g] || { xp: 0 });
  return E;
}
const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);
/* une trouvaille ordinaire, plus chère que la gratuité d’essai : le Papier (8 matières, âge 7) */
const CIBLE = "papier";
function essai(E) {
  const it = D.ITEMS[CIBLE], ids = Object.keys(it.r[1]);
  ids.forEach((i) => { E.state.seen[i] = true; });
  return E.attempt(it.r[0], ids);
}

console.log("Refonte 0.39 : moteur");
test("la constante existe et reste raisonnable", () => {
  assert.ok(D.PREMIERE_PIECE && D.PREMIERE_PIECE.max >= D.DISCOVER_FREE && D.PREMIERE_PIECE.max <= 60);
});
test("une trouvaille chère mais ordinaire s’inscrit sans rien prendre, et une pièce est offerte", () => {
  const E = fresh(7), it = D.ITEMS[CIBLE];
  assert.ok(Object.values(it.r[1]).reduce((a, b) => a + b, 0) > D.DISCOVER_FREE);
  const r = essai(E);
  assert.equal(r.kind, "learn");
  assert.equal(r.offered, true);
  assert.equal(Math.floor(E.state.inv[CIBLE]), it.r[2] || 1);
  assert.equal(E.state.made[CIBLE], 1);
  assert.equal(E.state.inv.fibre || 0, 0, "aucune matière n’a été prise");
});
test("une seule fois : la deuxième fois, rien de plus n’est offert", () => {
  const E = fresh(7);
  essai(E);
  const n = E.state.inv[CIBLE];
  essai(E);
  assert.equal(E.state.inv[CIBLE], n);
});
test("rien n’est offert quand c’est désactivé", () => {
  const save = D.PREMIERE_PIECE.max;
  D.PREMIERE_PIECE.max = 0;
  try {
    const E = fresh(7), r = essai(E);
    assert.equal(r.kind, "learn");
    assert.ok(!r.offered);
    assert.ok(!(E.state.inv[CIBLE] > 0));
  } finally { D.PREMIERE_PIECE.max = save; }
});
test("jamais d’objet unique, à prix croissant ou secret offert", () => {
  const E = fresh(14);
  for (const [id, it] of Object.entries(D.ITEMS)) {
    if (!it.r) continue;
    if (E.isUnique(it) || E.isScaled(it) || it.sec || it.path) assert.equal(E.state.inv[id] || 0, 0);
  }
});
test("la chaîne manquante : vide quand tout est connu, sinon les intermédiaires jamais vus", () => {
  const E = fresh(8);
  const lourd = Object.keys(D.ITEMS).find((id) => D.ITEMS[id].r && D.ITEMS[id].a <= 8 && Object.keys(D.ITEMS[id].r[1]).some((i) => D.ITEMS[i] && D.ITEMS[i].r));
  assert.ok(lourd);
  const m = E.chaineManquante(lourd);
  assert.ok(Array.isArray(m) && m.length >= 1);
  m.forEach((i) => assert.ok(D.ITEMS[i].r && !E.state.known[i]));
  m.forEach((i) => { E.state.known[i] = true; });
  const m2 = E.chaineManquante(lourd);
  m2.forEach((i) => assert.ok(!m.includes(i)));
});
test("la liste des apprentis est cohérente (ordres + machines + blocages)", () => {
  const E = fresh(8);
  const a = E.apprentis();
  assert.deepEqual(Object.keys(a).sort(), ["bloques", "eligible", "machines", "ordres"]);
  assert.equal(a.ordres.length, 0);
  assert.equal(a.bloques, 0);
});
console.log(passed + " tests de la refonte 0.39 réussis.");

console.log("Refonte 0.39 : la page");
const fs = require("fs"), path = require("path");
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
test("la barre d’onglets a cinq onglets : Terres, Labo, Atelier, Progression, Journal", () => {
  const nav = [...html.matchAll(/<nav id="tabs">([\s\S]*?)<\/nav>/g)][0][1];
  assert.deepEqual(nav.match(/data-tab="(\w+)"/g).map((x) => x.slice(10, -1)), ["domaine", "labo", "atelier", "arbre", "journal"]);
  assert.deepEqual([...nav.matchAll(/<span>([^<]+)<\/span>/g)].map((x) => x[1]), ["Terres", "Labo", "Atelier", "Progression", "Journal"]);
});
test("chaque onglet a sa vue, et les sous-pages (Atlas, Carnet, Machines) gardent la leur", () => {
  for (const v of ["domaine", "labo", "atelier", "arbre", "journal", "carte", "carnet", "machines"]) assert.ok(html.includes('id="v-' + v + '"'), v);
});
test("les feuilles de style de la refonte sont chargées, dans l’ordre, après celles de la 0.38", () => {
  const i = (f) => html.indexOf('href="css/' + f + '"');
  for (const f of ["terres.css", "labo.css", "atelier-production.css", "refonte-0-39.css"]) assert.ok(i(f) > 0, f);
  assert.ok(i("carnet-peint.css") < i("terres.css") && i("terres.css") < i("labo.css") && i("labo.css") < i("atelier-production.css") && i("atelier-production.css") < i("refonte-0-39.css"));
});
test("les icônes d’onglets pointent vers des symboles qui existent", () => {
  const svg = fs.readFileSync(path.join(__dirname, "..", "assets", "refonte-0-39", "onglets.svg"), "utf8");
  for (const id of [...html.matchAll(/onglets\.svg#([\w-]+)/g)].map((x) => x[1])) assert.ok(svg.includes('id="' + id + '"'), id);
});
console.log(passed + " tests de la refonte 0.39 réussis (au total).");
