"use strict";
const assert = require("assert/strict"), fs = require("fs"), vm = require("vm");
const D = require("../js/data"), T = require("../js/territoires"), { createEngine } = require("../js/engine");
let count = 0;
function test(n, f) { try { f(); count++; console.log("  ✓ " + n); } catch (e) { console.error("  ✗ " + n, e); process.exitCode = 1; } }
const mk = () => createEngine({ now: () => 2e12, rand: () => .99 });
function complete(E, z) {
  E.state.zones[z] = true;
  const t = E.terreMaitrise(z), r = T.RULES[z];
  for (const p of t.phases) for (const id of p.ids || []) E.state.made[id] = p.cible || 1;
  E.state.exp.done[z] = Math.max(...r.lieux.map(x => E.ZONES[z].exps.findIndex(e => e.id === x))) + 1;
  E.state.territoires.produit[z] = t.phases[3].cible;
}
function relevePossible(E) { E.state.pass.plaine = { done: true, paid: {} }; }
function extractor(E, z = "lisiere", res = "bois", id = "cabane") {
  E.state.zones[z] = true; E.state.inv[id] = 1; E.state.known[id] = 1; E.recalc();
  assert.equal(E.domExtAdd(z, res, 1, id).ok, true);
  return E.domExt(z, res);
}
test("onze terres principales, aucune recette secrète ni appartenance double", () => {
  assert.equal(Object.keys(T.RULES).length, 11);
  const E = mk(), used = new Set();
  for (const [z, r] of Object.entries(T.RULES)) {
    assert.ok(E.ZONES[z] && !E.ZONES[z].secret);
    for (const id of [...r.outils, ...r.ouvrage, r.serie, ...r.recettes]) assert.ok(D.ITEMS[id] && D.ITEMS[id].r && !D.ITEMS[id].sec && !D.ITEMS[id].path, z + ": " + id);
    for (const id of r.recettes) { assert.ok(!used.has(id), id); used.add(id); assert.equal(E.recetteTerre(id), z); }
    for (const x of r.lieux) { const e = E.ZONES[z].exps.find(e => e.id === x); assert.ok(e && !e.hidden && !e.show); }
  }
});
test("chaque terre peut atteindre 100 % sans secret, sans frontière et sans tout le Carnet", () => {
  for (const z of Object.keys(T.RULES)) {
    const E = mk(); complete(E, z); const t = E.terreMaitrise(z);
    assert.equal(t.pourcent, 100, z); assert.equal(t.gagne, true); assert.equal(t.frontiere, false);
    assert.equal(Object.keys(E.state.known).length, 0); assert.equal(Object.keys(E.state.secrets).length, 0);
  }
});
test("aucun gain sur une terre fermée ou un simple Carnet hérité", () => {
  const E = mk(); for (const id of Object.keys(D.ITEMS)) E.state.known[id] = 1;
  assert.equal(E.terresTransmission().length, 0);
  complete(E, "desert"); delete E.state.zones.desert;
  assert.equal(E.terreMaitrise("desert").gagne, false);
});
test("les 100 % restent acquis dans le cycle et survivent au rechargement", () => {
  const E = mk(); complete(E, "lisiere"); E.terresCheck();
  E.state.made = {}; E.state.territoires.produit.lisiere = 0;
  const F = mk(); assert.equal(F.load(E.serialize()), true);
  assert.equal(F.terreMaitrise("lisiere").pourcent, 100);
});
test("le bonus arrive à la relève, une seule fois par terre et par cycle", () => {
  const E = mk(); relevePossible(E); complete(E, "lisiere");
  for (let i = 0; i < 3; i++) E.terresTransmission();
  assert.equal(E.terreBonus("lisiere"), 1);
  E.newCycle(); assert.equal(E.terreBonus("lisiere"), 1.05);
  assert.equal(E.terreMaitrise("lisiere").pret, false);
  relevePossible(E); E.newCycle(); assert.equal(E.terreBonus("lisiere"), 1.05);
});
test("aucune attribution par un appel de nouveau cycle sans relève disponible", () => {
  const E = mk(); complete(E, "lisiere"); E.newCycle(); assert.equal(E.terreBonus("lisiere"), 1);
});
test("dix maîtrises donnent +50 % additifs, puis le plafond reste stable", () => {
  const E = mk();
  for (let i = 1; i <= 12; i++) {
    relevePossible(E); complete(E, "lisiere"); E.newCycle();
    assert.equal(E.state.meta.terres.lisiere, Math.min(10, i));
    assert.equal(E.terreBonus("lisiere"), 1 + Math.min(10, i) * .05);
  }
});
test("plusieurs terres se transmettent ensemble sans modifier les Traces", () => {
  const E = mk(); relevePossible(E); complete(E, "lisiere"); complete(E, "plaine");
  const gain = E.releveGain(); E.newCycle();
  assert.equal(E.state.meta.traces, gain); assert.equal(E.terreBonus("lisiere"), 1.05); assert.equal(E.terreBonus("plaine"), 1.05);
});
test("la première relève obligatoire transmet aussi une terre accomplie", () => {
  const E = mk(); relevePossible(E); complete(E, "lisiere");
  assert.equal(E.forcedReleve(), true); assert.equal(E.terreBonus("lisiere"), 1.05);
});
test("le bonus d'extraction est local, effectif et ne double pas via les ingrédients", () => {
  const E = mk(), e = extractor(E), rate = E.extOut(e);
  E.state.meta.terres.lisiere = 10;
  assert.equal(E.extOut(e), rate * 1.5);
  assert.equal(E.terreBonus("plaine"), 1); assert.equal(E.recetteTerreBonus("laniere"), 1);
  assert.equal(E.recetteTerreBonus("inconnu"), 1);
});
test("les mains accélèrent réellement de 50 % sans réduire le temps de moitié", () => {
  const E = mk(), base = E.handTime("corde"), unrelated = E.handTime("laniere");
  E.state.meta.terres.lisiere = 10;
  assert.equal(E.handTime("corde"), base / 1.5); assert.equal(E.handTime("laniere"), unrelated);
  assert.equal(E.batchTime("corde", 100), base / 1.5 * Math.pow(100, D.HAND.batch));
});
test("les machines accélèrent selon la recette, pas selon l'âge ni l'origine de la machine", () => {
  const E = mk(), a = E.machRate("automate_bois", "corde"), b = E.machRate("automate_bois", "laniere");
  E.state.meta.terres.lisiere = 10;
  assert.equal(E.machRate("automate_bois", "corde"), a * 1.5);
  assert.equal(E.machRate("automate_bois", "laniere"), b);
  assert.equal(E.machRate("automate_bois"), E.machRate("automate_bois", "inconnu"));
});
test("la production des objectifs compte le travail réel, y compris hors ligne, sans les achats ni les cadeaux", () => {
  const E = mk(), e = extractor(E); E.add("bois", 10000);
  assert.equal(E.state.territoires.produit.lisiere, 0);
  E.step(10); const n = E.state.territoires.produit.lisiere;
  assert.ok(n > 0); assert.ok(Math.abs(n - E.extOut(e) * 10) < 1e-8);
  E.catchUp(20); assert.ok(E.state.territoires.produit.lisiere > n);
  e.on = false; const before = E.state.territoires.produit.lisiere; E.step(10);
  assert.equal(E.state.territoires.produit.lisiere, before);
});
test("une ancienne sauvegarde conserve stocks, commandes, passages et acquis sans bonus inventé", () => {
  const E = mk(); E.add("bois", 123); relevePossible(E);
  const raw = JSON.parse(E.serialize()); delete raw.territoires; delete raw.meta.terres;
  const F = mk(); assert.equal(F.load(raw), true);
  assert.equal(F.count("bois"), 123); assert.equal(F.releveGain(), 2);
  assert.equal(F.terreBonus("lisiere"), 1); assert.equal(F.terreMaitrise("lisiere").pret, false);
});
test("les données importées sont bornées et les identifiants inconnus ignorés", () => {
  const E = mk(), raw = JSON.parse(E.serialize());
  raw.meta.terres = { lisiere: 300, desert: -8, plaine: "10", lune: 3.8, fantome: 10 };
  raw.territoires = { produit: { lisiere: -20, plaine: "999", riviere: 8e20 }, accompli: { lisiere: "true", desert: true, fantome: true } };
  E.load(raw); assert.equal(E.terreBonus("lisiere"), 1.5); assert.equal(E.terreBonus("desert"), 1); assert.equal(E.terreBonus("plaine"), 1);
  assert.equal(E.state.meta.terres.lune, 3); assert.equal(E.state.meta.terres.fantome, undefined);
  assert.equal(E.state.territoires.produit.lisiere, 0); assert.equal(E.state.territoires.produit.plaine, 0);
  assert.equal(E.state.territoires.produit.riviere, 1e9); assert.equal(E.state.territoires.accompli.lisiere, undefined);
});
test("les objectifs du Désert évoluent après transmission, sans exiger les secrets", () => {
  const E = mk(); E.state.zones.desert = true;
  assert.equal(E.terreMaitrise("desert").chapitre, "Première installation");
  for (const [rang, name, id] of [[1, "La précision", "acier_trempe"], [4, "La vapeur", "moteur_vapeur"], [7, "Les circuits", "ordinateur"]]) {
    E.state.meta.terres.desert = rang; const t = E.terreMaitrise("desert");
    assert.equal(t.chapitre, name); assert.ok(t.phases[2].ids.includes(id)); assert.ok(!t.pret);
  }
});
test("le bilan annonce le même gain que le moteur et le garde après rechargement", () => {
  const E = mk(); relevePossible(E); complete(E, "desert");
  assert.match(T.transmissionHTML(E, String), /\+0 % → \+5 %/);
  E.newCycle(); const F = mk(); F.load(E.serialize());
  assert.equal(F.terreBonus("desert"), 1.05);
  assert.match(T.transmissionHTML(F, String), /\+5 %/);
  assert.doesNotMatch(T.transmissionHTML(F, String), /→/);
});
test("l'aperçu ne déverrouille ni la frontière ni les ressources suivantes", () => {
  const E = mk(); complete(E, "desert"); const before = JSON.stringify(E.state.pass);
  const html = T.html(E, "desert", String);
  assert.match(html, /Horizon/); assert.match(html, /Gisement Noir/); assert.match(html, /100 %/);
  assert.equal(E.zoneOpen("gisement"), false); assert.equal(JSON.stringify(E.state.pass), before);
  assert.equal(T.html(E, "caveau", String), "");
});
test("les tarifs des frontières et les paramètres de Gemini sont conservés", () => {
  const E = mk(), cost = E.passCost("gisement"), h = E.handTime("processeur");
  E.state.meta.terres.lisiere = 10;
  assert.deepEqual(E.passCost("gisement"), cost); assert.equal(E.handTime("processeur"), h);
  assert.equal(D.HAND.ageCurve, 1.08); assert.equal(D.HAND.machDecay, 1.08);
});
test("l'interface du Domaine est compatible avec un ancien module de test et charge le nouveau composant", () => {
  const ctx = { window: { EclatTerritoires: T }, document: { baseURI: "https://example.test/" }, URL, setTimeout: () => {} };
  vm.runInNewContext(fs.readFileSync(require.resolve("../js/domaine"), "utf8"), ctx);
  assert.equal(typeof ctx.window.EclatDomaine.create, "function");
  assert.match(fs.readFileSync(require.resolve("../index.html"), "utf8"), /js\/territoires.js/);
});
test("un nouveau départ efface les bonus puis permet une nouvelle transmission", () => {
  const E = mk(); E.state.meta.terres.lisiere = 5; E.reset();
  assert.equal(E.terreBonus("lisiere"), 1); assert.equal(E.terreMaitrise("lisiere").pourcent, 0);
  relevePossible(E); complete(E, "lisiere"); E.newCycle(); assert.equal(E.terreBonus("lisiere"), 1.05);
});
console.log(count + " tests de maîtrise territoriale réussis.");
