#!/usr/bin/env node
/* Tests du moteur : mécaniques de base, secrets, chemin caché, fins, sauvegarde. */
"use strict";
const assert = require("assert");
const D = require("../js/data.js");
const fs = require("fs");
const path = require("path");
const { createEngine, migrate, SAVE_VERSION } = require("../js/engine.js");
const fixture = (f) => fs.readFileSync(path.join(__dirname, "fixtures", f), "utf8");

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


console.log("Sauvegardes (compatibilité)");
test("une sauvegarde v1 se charge sans rien perdre", () => {
  for (const f of fs.readdirSync(path.join(__dirname, "fixtures")).filter((x) => x.startsWith("save-v1"))) {
    const raw = fixture(f);
    const old = JSON.parse(raw);
    const E = mk();
    E.load(raw);
    const S = E.state;
    assert.strictEqual(S.v, SAVE_VERSION, f);
    for (const k in old.inv) assert.strictEqual(S.inv[k], old.inv[k], f + " : stock de " + k);
    for (const k in old.known) assert.ok(S.known[k], f + " : recette " + k);
    for (const k in old.made) assert.strictEqual(S.made[k], old.made[k], f + " : fabriqué " + k);
    assert.strictEqual(S.age, old.age); assert.strictEqual(S.intu, old.intu);
    assert.deepStrictEqual(S.zones, old.zones); assert.deepStrictEqual(S.frags, old.frags);
    assert.strictEqual(S.flags.news, "2", "annonce des nouveautés");
    assert.strictEqual(raw, fixture(f), "la chaîne d’origine n’est pas modifiée");
    T += 5000; E.update(); // le jeu tourne
  }
});
test("les chaînes d’assemblage v1 deviennent des lignes de la Fabrique", () => {
  const E = mk();
  E.load(fixture("save-v1-age10-chaines.json"));
  const L = E.state.lines;
  assert.strictEqual(L.length, 2);
  assert.deepStrictEqual(L.map((l) => [l.r, l.m, l.n]), [["plaque_fer", "chaine", 1], ["bobine", "chaine", 1]]);
  assert.ok(E.state.auto === undefined);
  const before = E.count("plaque_fer");
  for (let i = 0; i < 20; i++) { T += 100; E.update(); }
  assert.ok(E.count("plaque_fer") > before, "la ligne produit");
});
test("sauvegarde illisible ou d’une version future : erreur, rien n’est touché", () => {
  const E = mk();
  E.tap("bois");
  assert.throws(() => E.load("pas du json"));
  assert.throws(() => E.load('{"v":99,"inv":{}}'), /plus récente/);
  assert.throws(() => E.load('{"foo":1}'));
  assert.strictEqual(E.count("bois"), 1, "l’état courant est intact");
});
test("objets inconnus mis de côté, pas perdus", () => {
  const E = mk();
  E.load(JSON.stringify({ v: 2, inv: { bois: 5, objet_futur: 3 }, known: { objet_futur: true } }));
  assert.strictEqual(E.count("bois"), 5);
  assert.strictEqual(E.state.orphans.inv.objet_futur, 3);
  assert.ok(!E.state.known.objet_futur);
});
test("import : fichier JSON ou ancien code base64", () => {
  const E = mk(); E.tap("bois");
  const json = E.serialize(), b64 = E.exportSave();
  const A = mk(); A.importSave(json); assert.strictEqual(A.count("bois"), 1);
  const B = mk(); B.importSave(b64); assert.strictEqual(B.count("bois"), 1);
});

console.log("Fabrication en chaîne, Fabrique, guidage");
test("plan récursif : feu de camp depuis les matières premières", () => {
  const E = mk();
  E.add("bois", 100); E.add("fibre", 100); E.add("caillou", 100);
  ["manche", "corde", "archet", "feu"].forEach((k) => (E.state.known[k] = true));
  const p = E.plan("feu");
  assert.ok(p.ok, JSON.stringify(p));
  assert.deepStrictEqual(p.steps.map((s) => s[0]), ["manche", "corde", "archet", "feu"].filter((x) => p.steps.find((s) => s[0] === x)).sort((a, b) => p.steps.findIndex((s) => s[0] === a) - p.steps.findIndex((s) => s[0] === b)));
  assert.strictEqual(p.steps[p.steps.length - 1][0], "feu");
  const r = E.craftPlan("feu");
  assert.ok(r.done); assert.ok(E.has("feu"));
});
test("plan : matières manquantes et recettes inconnues", () => {
  const E = mk();
  E.state.known.archet = true; E.state.known.manche = true;
  const p = E.plan("archet", 2);
  assert.ok(!p.ok);
  assert.deepStrictEqual(p.locked, ["corde"]);
  assert.strictEqual(p.missing.bois, 6);
  assert.strictEqual(E.craftPlan("archet").done, false);
});
test("maxPlan : nombre de fabrications en chaîne possibles", () => {
  const E = mk();
  E.add("bois", 30); E.add("fibre", 30);
  E.state.known.manche = E.state.known.corde = E.state.known.archet = true;
  assert.strictEqual(E.maxPlan("archet"), 5); // 3 bois + 6 fibres par archet : les fibres limitent
});
test("Fabrique : ligne, vitesse, stock maximal, manque", () => {
  const E = mk();
  E.add("automate_bois", 2); E.state.known.manche = true;
  E.add("bois", 30);
  const L = E.addLine("manche");
  assert.strictEqual(L.m, "automate_bois"); assert.strictEqual(L.n, 1);
  assert.ok(E.state.flags.lineDone);
  E.setLine(L.id, { n: 5 });
  assert.strictEqual(L.n, 2, "pas plus que les machines possédées");
  for (let i = 0; i < 300; i++) { T += 100; E.update(); } // 30 s à 12/min
  assert.strictEqual(E.count("manche"), 6);
  E.setLine(L.id, { cap: 7 });
  for (let i = 0; i < 300; i++) { T += 100; E.update(); }
  assert.strictEqual(E.count("manche"), 7); assert.strictEqual(E.lineInfo(L.id).s, "full");
  E.setLine(L.id, { cap: 0 });
  for (let i = 0; i < 300; i++) { T += 100; E.update(); }
  assert.strictEqual(E.count("bois"), 0); assert.strictEqual(E.lineInfo(L.id).s, "starved");
  assert.deepStrictEqual(E.lineInfo(L.id).miss, { bois: 3 });
  assert.ok(!E.automatable("feu") && !E.automatable("cabane"), "pas d’objets uniques ni d’extracteurs");
});
test("guidage : la prochaine étape d’un objectif", () => {
  const E = mk();
  ["manche", "corde"].forEach((k) => { E.state.known[k] = true; E.state.made[k] = 1; });
  E.state.exp.done.lisiere = 1;
  assert.deepStrictEqual([E.guide().ob.id, E.guide().step], ["feu", "archet"]);
  // lingot de cuivre → il faut un four → des briques → un feu → un archet (inconnu)
  assert.strictEqual(E.nextStep("lingot_cuivre").id, "archet");
  stations(E, ["feu"]);
  E.state.known.four = true;
  // briques → argile (rivière fermée) → outre → peau (plaine fermée) → épieu
  assert.strictEqual(E.nextStep("lingot_cuivre").id, "epieu");
});
test("objectifs : un joueur avancé ne retombe pas sur le tutoriel", () => {
  const E = mk();
  E.load(fixture("save-v1-age7.json"));
  const ob = E.objective();
  assert.ok(ob && ob.i > D.OBJECTIVES.findIndex((o) => Array.isArray(o) && o[0] === "moteur_vapeur"), JSON.stringify(ob));
});
test("réminiscences : indices gratuits quand on bloque", () => {
  const E = mk();
  let hints = [];
  E.on("guidehint", (h) => hints.push(h.lvl));
  for (let i = 0; i < 4000; i++) { T += 100; E.update(); }
  assert.deepStrictEqual(hints, [1, 2, 3]);
  assert.ok(E.state.known.manche, "la recette finit par être révélée");
});
test("suivi : se termine quand l’objet est fabriqué", () => {
  const E = mk();
  E.setTrack("manche"); assert.strictEqual(E.state.track.id, "manche");
  E.add("bois", 3); E.craft("manche");
  assert.strictEqual(E.state.track, null);
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
