/* Les chaînes de l’eau et des polymères : récolte, commandes, progression et sauvegardes. */
"use strict";
const assert = require("assert/strict"), path = require("path"), { execFileSync } = require("child_process");
const D = require("../js/data.js"), { createEngine } = require("../js/engine.js");
let passed = 0;
function test(n, fn) {
  try { fn(); passed++; console.log("  ✓ " + n); }
  catch (e) { console.log("  ✗ " + n + "\n    " + e.stack); process.exitCode = 1; }
}
function partie(age) {
  let t = 2e12;
  const E = createEngine({ now: () => t, rand: () => 0.99 });
  E.state.age = age;
  for (const z of D.ZONES) E.state.zones[z.id] = true;
  for (const [id, it] of Object.entries(D.ITEMS)) {
    if (it.a > age || it.sec || it.path) continue;
    if (it.r) E.learn(id, true);
    if (it.t === "stat") { E.add(id, 1); E.state.made[id] = 1; }
  }
  E.recalc();
  return { E, avancer: (s) => { for (let k = 0; k < s * 10; k++) { t += 100; E.update(); } } };
}
test("eau et soufre : extracteurs, récolte et retour hors ligne", () => {
  for (const [age, res, ext, z] of [[7, "eau", "eau_1", "riviere"], [11, "soufre", "soufre_1", "collines"]]) {
    const { E, avancer } = partie(age);
    assert.ok(!D.ZONES.some((x) => x.res.includes(res)), "pas de récolte à la main");
    assert.strictEqual(E.deposits().find((x) => x.res === res).hand, false);
    assert.strictEqual(E.tap(res), 0);
    E.add(ext, 1); assert.ok(E.domExtSet(z, res, ext, 1));
    avancer(30); assert.ok(E.count(res) > 0, "l’extracteur récolte");
    const raw = E.serialize(), F = createEngine({ now: () => E.state.t + 120000, rand: () => 0.99 });
    assert.ok(F.load(raw)); F.update();
    assert.ok(F.count(res) > E.count(res), "le retour d’absence rapporte la ressource");
    assert.strictEqual(F.state.age, age);
  }
});
test("le guide mène à la pompe ou à la soufrière avant leur ressource", () => {
  for (const [age, cible, ext] of [[7, "circuit_vapeur", "eau_1"], [11, "caoutchouc", "soufre_1"]]) {
    const { E } = partie(age);
    assert.strictEqual(E.nextStep(cible).id, ext);
    E.add(ext, 1);
    assert.strictEqual(E.nextStep(cible).id, cible, "aucun cycle de prérequis");
  }
});
test("une commande de moteurs fabrique le circuit et consomme l’eau annoncée", () => {
  const { E, avancer } = partie(7);
  // Réserve de ressources brutes seulement : toutes les pièces restent à fabriquer.
  for (const [id, it] of Object.entries(D.ITEMS)) if (it.t === "res" && it.a <= 7) E.add(id, 10000);
  const p = E.plan("moteur_vapeur", 2);
  assert.ok(p.ok);
  assert.ok(p.steps.some((x) => x[0] === "circuit_vapeur"));
  assert.strictEqual(p.used.eau, 24);
  const eau = E.count("eau");
  assert.ok(E.order("moteur_vapeur", 2).ok); avancer(300);
  assert.strictEqual(E.count("moteur_vapeur"), 2);
  assert.strictEqual(E.count("eau"), eau - 24);
  assert.strictEqual(E.state.hand.q.length, 0);
});
test("le caoutchouc et le refroidissement passent par le naphta et le soufre", () => {
  const { E, avancer } = partie(11);
  for (const [id, it] of Object.entries(D.ITEMS)) if (it.t === "res" && it.a <= 11) E.add(id, 100000);
  const p = E.plan("refroidissement", 1);
  assert.ok(p.ok);
  for (const id of ["naphta", "caoutchouc", "joint_souple", "tuyau_souple", "echangeur"]) assert.ok(p.steps.some((x) => x[0] === id), id);
  assert.ok(p.used.soufre > 0 && p.used.petrole > 0 && p.used.eau === 120);
  const soufre = E.count("soufre"), eau = E.count("eau");
  assert.ok(E.order("refroidissement", 1).ok); avancer(600);
  assert.strictEqual(E.count("refroidissement"), 1);
  assert.strictEqual(E.count("soufre"), soufre - p.used.soufre);
  assert.strictEqual(E.count("eau"), eau - 120);
  assert.strictEqual(E.cache().aspd, 1.5);
  E.add("recuperation_vapeur", 1); E.recalc();
  assert.strictEqual(E.cache().aspd, 1.875, "les deux améliorations se multiplient");
});
test("les nouveaux objectifs retiennent l’âge courant et ne font pas reculer une ancienne partie", () => {
  const { E } = partie(7);
  E.milestones()[7].forEach((x) => { E.state.made[x.ob.id] = 1; });
  E.state.made.dynamo = 1; delete E.state.made.recuperation_vapeur;
  E.avancerAge(); assert.strictEqual(E.state.age, 7);
  assert.strictEqual(E.objective().id, "recuperation_vapeur");
  E.state.made.recuperation_vapeur = 1; E.avancerAge();
  assert.strictEqual(E.state.age, 8);
  const { E: F } = partie(12);
  F.state.flags.ages = { 7: 1, 11: 1 }; F.state.intu = 123;
  F.add("moteur_vapeur", 3); F.add("caoutchouc", 8);
  const raw = JSON.parse(F.serialize());
  // Forme d’une partie 0.20 : version 10, aucun des nouveaux objets.
  raw.v = 10;
  for (const id of ["eau_1", "circuit_vapeur", "recuperation_vapeur", "soufre_1", "naphta", "refroidissement"])
    for (const k of ["known", "made", "seen", "inv"]) delete raw[k][id];
  const G = createEngine({ now: () => F.state.t }); assert.ok(G.load(JSON.stringify(raw)));
  assert.strictEqual(G.state.age, 12); assert.strictEqual(G.state.intu, 123);
  assert.strictEqual(G.count("moteur_vapeur"), 3); assert.strictEqual(G.count("caoutchouc"), 8);
  assert.ok(G.state.flags.ages[7] && G.state.flags.ages[11]);
  assert.ok(!G.state.known.naphta && !G.state.known.eau_1);
});
test("les commandes 0.20 gardent leurs ingrédients, leur quantité et leur avance après deux chargements", () => {
  const avant = { moteur_vapeur: { chaudiere: 1, piston: 2, engrenage_acier: 4 }, plastique: { petrole: 3 },
    resine: { petrole: 2, bois: 6 }, caoutchouc: { petrole: 2, charbon: 1 } };
  for (const machines of [false, true]) for (const [id, ing] of Object.entries(avant)) {
    const { E } = partie(11), it = D.ITEMS[id];
    E.add(id, it.r[2]); E.state.made[id] = 1;
    if (machines) E.add("presse_vapeur", 1);
    const raw = JSON.parse(E.serialize()); raw.v = 10;
    raw.hand.q = [{ id, s: [[id, 3]], i: 0, k: 1, done: [1], hMade: [1], sp: [0.4], mAcc: [0],
      b: Object.fromEntries(Object.entries(ing).map(([k, n]) => [k, n * 2])), miss: {} }];
    delete raw.known.circuit_vapeur; delete raw.known.naphta;
    const { E: F, avancer } = partie(11); F.load(JSON.stringify(raw));
    assert.ok(F.state.hand.q[0].recettes020);
    assert.strictEqual(F.state.hand.q[0].sp[0], 0.4);
    const save = F.serialize(); F.load(save); // le drapeau survit en version 11
    assert.strictEqual(F.state.hand.q[0].done[0], 1);
    avancer(600);
    assert.strictEqual(F.count(id), 3 * it.r[2], id + "/machines=" + machines);
    assert.strictEqual(F.state.hand.q.length, 0, "la commande finit sans les nouveaux ingrédients");
    const p = F.plan(id, 1);
    assert.ok(p.locked.includes(id === "moteur_vapeur" ? "circuit_vapeur" : "naphta"), "les commandes suivantes utilisent la nouvelle chaîne");
  }
});
test("une nouvelle commande ne se fusionne pas avec un lot au prix 0.20", () => {
  const { E } = partie(11);
  E.add("bois", 30); E.order("manche", 2);
  E.add("caoutchouc", 2); E.order("joint_souple", 1); // un lot normal devant l’ancien lot
  const raw = JSON.parse(E.serialize()); raw.v = 10;
  raw.hand.q.push({ id: "plastique", s: [["plastique", 2]], i: 0, k: 0, b: { petrole: 6 }, miss: {} });
  E.load(JSON.stringify(raw)); E.add("naphta", 6);
  const n = E.state.hand.q.length;
  assert.ok(E.order("plastique", 2).ok);
  assert.strictEqual(E.state.hand.q.length, n + 1);
  assert.ok(!E.state.hand.q.at(-1).recettes020);
});
test("le bot finit avec et sans durée manuelle ; ses durées correspondent aux âges affichés", () => {
  const secondes = (s) => { const m = s.match(/(?:(\d+)h)?(\d+)m(\d+)s/); return +(m[1] || 0) * 3600 + +m[2] * 60 + +m[3]; };
  for (const mains of [false, true]) {
    const env = { ...process.env }; delete env.STOP_AGE; delete env.DUMP; delete env.OBJ; delete env.MAINS;
    if (mains) env.MAINS = "1";
    const out = execFileSync(process.execPath, [path.join(__dirname, "sim.js")], { env, encoding: "utf8", timeout: 60000 });
    assert.ok(out.includes("★ FIN :") && !out.includes("pas de fin"));
    assert.match(out, /eau_1×\d+/); assert.match(out, /soufre_1×\d+/);
    const rows = out.split(/\r?\n/).filter((s) => /^  Âge (du|de|des|Spatial|Stellaire)/.test(s));
    assert.strictEqual(rows.length, D.AGES.length);
    const temps = rows.map((s) => s.match(/(?:\d+h)?\d+m\d+s/g).map(secondes));
    assert.strictEqual(temps[0][0], 0);
    for (let a = 0; a < temps.length - 1; a++) assert.strictEqual(temps[a][1], temps[a + 1][0] - temps[a][0], D.AGES[a].n);
    const fin = secondes(out.split(/\r?\n/).find((s) => s.includes("★ FIN :")));
    assert.strictEqual(temps.reduce((s, x) => s + x[1], 0), fin);
  }
});
console.log(passed + " tests de densité réussis.");
