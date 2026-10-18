#!/usr/bin/env node
/* Tests du moteur : mécaniques de base, secrets, chemin caché, fins, sauvegarde. */
"use strict";
const assert = require("assert");
const D = require("../js/data.js");
const { createEngine } = require("../js/engine.js");

let T = 1e12;
const mk = () => createEngine({ now: () => T, rand: () => 0.99 });
let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log("  ✓ " + name); }
  catch (e) { console.log("  ✗ " + name + "\n    " + (e.stack || e)); process.exitCode = 1; }
}
/* donne tout ce qu’il faut pour fabriquer `id` (récursivement, en trichant sur les matières premières) */
function force(E, id, n) {
  const it = D.ITEMS[id];
  for (const i in it.r[1]) E.add(i, it.r[1][i] * (n || 1) * 10);
  const r = E.craft(id, n || 1);
  assert.ok(r.ok, "fabrication de " + id + " : " + JSON.stringify(r));
}
function stations(E, list) { list.forEach((s) => { E.add(s, 1); E.state.made[s] = 1; }); E.recalc(); }

console.log("Moteur");
test("récolte et rendement de base", () => {
  const E = mk();
  assert.strictEqual(E.tap("bois"), 1);
  assert.strictEqual(E.tap("os"), 0, "zone fermée");
  assert.strictEqual(E.count("bois"), 1);
});
test("tentative : fabrication, apprentissage, échec", () => {
  const E = mk();
  for (let i = 0; i < 3; i++) E.tap("bois");
  const r = E.attempt("tailler", ["bois"]);
  assert.strictEqual(r.kind, "craft"); assert.strictEqual(r.id, "manche"); assert.ok(r.fresh);
  assert.strictEqual(E.count("manche"), 1);
  assert.strictEqual(E.state.intu, 4, "+1 intuition à la découverte");
  const l = E.attempt("tresser", ["fibre"]);
  assert.strictEqual(l.kind, "learn"); assert.deepStrictEqual(l.missing, { fibre: 3 });
  assert.ok(E.state.known.corde);
  const f = E.attempt("tresser", ["caillou"]);
  assert.strictEqual(f.kind, "fail");
});
test("thermomètre : mauvais geste / ingrédient manquant", () => {
  const E = mk();
  ["bois", "fibre", "caillou", "manche", "corde"].forEach((i) => (E.state.seen[i] = true));
  assert.strictEqual(E.temperature("tailler", ["fibre"]).why, "geste", "fibres + tresser = corde");
  assert.strictEqual(E.temperature("assembler", ["manche"]).temp, 3, "archet : il manque la corde");
  assert.strictEqual(E.temperature("tresser", ["bois"]).why, "geste", "le manche (tailler + bois) est encore inconnu");
  E.state.known.manche = true;
  assert.strictEqual(E.temperature("tresser", ["bois"]).temp, 0);
});
test("chaleur insuffisante = Brûlant, recette notée", () => {
  const E = mk();
  stations(E, ["feu"]);
  E.state.seen.malachite = E.state.seen.charbon = true;
  const r = E.attempt("chauffer", ["malachite", "charbon"]);
  assert.strictEqual(r.kind, "blocked"); assert.strictEqual(r.info.heat, 1100);
  assert.ok(E.state.known.lingot_cuivre);
});
test("objets uniques et zones", () => {
  const E = mk();
  stations(E, ["feu"]);
  force(E, "epieu");
  assert.ok(E.zoneOpen("plaine"));
  assert.strictEqual(E.craft("epieu").why, "owned");
});
test("extracteurs : coût croissant et production", () => {
  const E = mk();
  const c0 = E.costFor("cabane").fibre;
  force(E, "cabane");
  assert.ok(E.costFor("cabane").fibre > c0);
  const b = E.count("bois");
  T += 4000; E.update();
  assert.ok(E.count("bois") > b + 1.5, "la cabane produit");
});
test("maîtrise : chefs-d’œuvre", () => {
  const E = createEngine({ now: () => T, rand: () => 0 });
  E.add("bois", 3000);
  E.craft("manche", 60);
  assert.strictEqual(E.stars("manche"), 2);
  const r = E.craft("manche", 10);
  assert.ok(r.bonus > 0);
});
test("explorations : coût, durée, fragment", () => {
  const E = mk();
  assert.ok(E.startExp("lisiere").ok);
  assert.strictEqual(E.startExp("lisiere").why, "busy");
  T += 16000; E.update();
  assert.ok(E.state.frags.chene);
  assert.strictEqual(E.startExp("lisiere").why, "cost", "la grotte demande une torche");
});
test("hors-ligne : rattrapage plafonné à 12 h", () => {
  const E = mk();
  force(E, "cabane");
  const b = E.count("bois");
  let off = null;
  E.on("offline", (o) => (off = o));
  T += 48 * 3600 * 1000; E.update();
  assert.ok(off && off.dt === 12 * 3600);
  assert.ok(Math.abs(E.count("bois") - b - 0.4 * 12 * 3600) < 5);
});
test("sauvegarde : aller-retour et export base64", () => {
  const E = mk();
  E.tap("bois"); E.state.flags.x = 1;
  const s = E.exportSave();
  const E2 = mk();
  E2.importSave(s);
  assert.strictEqual(E2.count("bois"), 1); assert.strictEqual(E2.state.flags.x, 1);
  assert.throws(() => E2.load("{}"));
});

console.log("Secrets");
test("recettes secrètes", () => {
  const E = mk();
  stations(E, ["feu"]);
  E.add("fibre", 5); E.state.seen.fibre = true;
  const r = E.attempt("chauffer", ["fibre"]);
  assert.strictEqual(r.id, "galette"); assert.ok(E.state.secrets.galette);
});
test("codes du terminal", () => {
  const E = mk();
  E.terminal("XYZZY"); E.terminal("1969"); E.terminal("Prométhée");
  assert.ok(E.state.secrets.cxyzzy && E.state.secrets.c1969 && E.state.secrets.cpromethee);
  assert.ok(E.state.frags.promethee);
  E.terminal("effacer"); assert.strictEqual(E.state.term.length, 0);
});
test("la Lune, sept fois", () => {
  const E = mk();
  for (let i = 0; i < 6; i++) assert.strictEqual(E.tapMoon(), null);
  assert.ok(E.tapMoon()); assert.ok(E.state.secrets.lune7);
});
test("flûte : l’Appel des Lucioles augmente la production", () => {
  const E = mk();
  force(E, "cabane");
  const r0 = E.rate("bois");
  [2, 2, 3, 1, 5, 2, 4].forEach((n) => E.playNote(n));
  assert.ok(E.state.flags.lucioles);
  assert.ok(Math.abs(E.rate("bois") - r0 * 1.25) < 1e-9);
});

console.log("Chemin caché — Le Chant");
test("de la boussole à la fin « Le Retour »", () => {
  const E = mk();
  stations(E, ["feu", "four", "bas_fourneau", "enclume_pierre", "enclume_bronze", "creuset", "pioche_bronze", "pioche_pierre",
    "outre", "epieu", "tour", "dynamo", "lithographe", "ordinateur", "radiotelescope", "four_arc"]);
  ["plaine", "riviere", "collines", "mine"].forEach((z) => (E.state.zones[z] = true));
  // la boussole ouvre la Porte Scellée
  force(E, "boussole");
  assert.ok(E.state.secrets.boussole);
  E.state.exp.done.mine = 1;
  assert.ok(E.startExp("mine").ok);
  T += 200 * 1000; E.update();
  assert.ok(E.zoneOpen("caveau")); assert.ok(E.state.secrets.caveau);
  // le Caveau : cuves, chambre d’Iris, cœur d’ARCHE
  for (let k = 0; k < 3; k++) {
    E.add("torche", 3);
    assert.ok(E.startExp("caveau").ok, "exploration du caveau " + k);
    T += 300 * 1000; E.update();
  }
  assert.ok(E.state.frags.cuves && E.state.frags.berceuse && E.state.frags.coeur);
  assert.strictEqual(E.count("partition"), 1);
  // la berceuse sur la flûte débloque Accorder
  force(E, "flute");
  assert.ok(!E.gesteOK("accorder"));
  D.MELODIES.berceuse.notes.forEach((n) => E.playNote(n));
  assert.ok(E.gesteOK("accorder"));
  // diapason, cristaux, signal, traducteur
  for (let i = 0; i < 400; i++) E.tap("resonite");
  force(E, "diapason", 30);
  force(E, "cristal_chantant", 2);
  assert.ok(E.listen().fresh);
  assert.strictEqual(E.count("signal_brut"), 1);
  force(E, "traducteur");
  assert.ok(E.state.flags.decoded && E.state.frags.signal);
  assert.ok(E.projVisible("chant"));
  // Le Chant
  let ending = null;
  E.on("ending", (r) => (ending = r));
  D.PROJECTS.chant.steps.forEach((s) => { if (s.cost) { for (const k in s.cost) E.add(k, s.cost[k]); assert.ok(E.contribute("chant").done); } });
  assert.strictEqual(E.projState("chant").step, 3);
  D.MELODIES.berceuse.notes.forEach((n) => E.playNote(n));
  assert.ok(ending && ending.id === "retour");
});
test("Brise-Monde : mise à feu", () => {
  const E = mk();
  E.state.flags.arche = true;
  let ending = null;
  E.on("ending", (r) => (ending = r));
  D.PROJECTS.brisemonde.steps.forEach((s) => { if (s.cost) { for (const k in s.cost) E.add(k, s.cost[k]); E.contribute("brisemonde"); } });
  E.fire("brisemonde");
  assert.strictEqual(ending.id, "brasier");
});
test("nouveau cycle : on garde le savoir, on gagne des échos", () => {
  const E = mk();
  E.state.flags.arche = true;
  D.PROJECTS.dyson.steps.forEach((s) => { for (const k in s.cost) E.add(k, s.cost[k]); E.contribute("dyson"); });
  assert.ok(E.state.endings.aube);
  E.state.known.manche = true; E.state.frags.chene = true; E.state.meta.capsule = true;
  E.newCycle();
  const S = E.state;
  assert.strictEqual(S.cycle, 2); assert.strictEqual(S.echoes, 1);
  assert.ok(S.known.manche && S.frags.chene); assert.ok(!S.endings.aube); assert.ok(S.meta.endings.aube);
  assert.ok(S.count === undefined && E.count("manche") === 10, "capsule temporelle");
  assert.strictEqual(E.tapYield("bois", "lisiere"), 1.5);
});

console.log(passed + " tests réussis" + (process.exitCode ? ", des échecs." : "."));
