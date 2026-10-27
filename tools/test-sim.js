#!/usr/bin/env node
/* Tests du simulateur de passages (tools/sim-passages.js) : les anciennes options ne changent pas d’un chiffre,
 * les séances et les types de joueur se comportent comme annoncé. Rapide : une trentaine de secondes au plus. */
"use strict";
const assert = require("assert");
const { play, lire, JOUEURS } = require("./sim-passages.js");

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log("  ✓ " + name); }
  catch (e) { console.log("  ✗ " + name + "\n    " + (e.stack || e)); process.exitCode = 1; }
}
const r3 = (x) => Math.round(x * 1000) / 1000;
const lignes = (r) => r.rows.map((x) => [x.z, r3(x.t), x.traces, x.offert ? 1 : 0]);
const jouer = (...args) => play(lire(args));

console.log("Simulateur de passages : types de joueur et séances");

/* Les valeurs ci-dessous ont été relevées sur `main` avant les séances et les types de joueur (puis recalées aux 0.17 et 0.18, un extracteur par ressource :
 * les temps bougent de moins de 1 %) :
 * les valeurs sont déterministes ; le parcours Bronze/Fer est recalé en 0.36 pour la variante B. */
test("non-régression : 30 min sans option", () => {
  assert.deepStrictEqual(lignes(jouer("--minutes", "30")), [["plaine", 5.835, 2, 0], ["riviere", 17.485, 5, 0]]);
});
test("non-régression : 30 min avec une mémoire", () => {
  assert.deepStrictEqual(lignes(jouer("--minutes", "30", "--mem", "recolte=2,extr=2,mains=2")),
    [["plaine", 0.785, 2, 0], ["riviere", 6.743, 5, 0], ["collines", 13.11, 10, 0], ["mine", 21.393, 18, 0], ["desert", 28.46, 30, 0]]);
});
test("non-régression : --offline 2 après chaque passage", () => {
  const r = jouer("--minutes", "40", "--offline", "2");
  assert.deepStrictEqual(lignes(r), [["plaine", 5.835, 2, 0], ["riviere", 11.035, 5, 0], ["collines", 27.86, 10, 0]]);
  assert.strictEqual(Math.round(r.absent), 6, "trois passages, deux heures chacun : six heures d’absence");
});
test("non-régression : deux cycles", () => {
  const r = jouer("--minutes", "20", "--cycles", "2");
  assert.deepStrictEqual(r.cycles.map((c) => c.rows.map((x) => [x.z, r3(x.t)])), [[["plaine", 5.835], ["riviere", 17.485]], [["plaine", 1.427], ["riviere", 14.468]]]);
});

test("les types de joueur sont bien formés", () => {
  const noms = Object.keys(JOUEURS);
  assert.deepStrictEqual(noms.slice(0, 4), ["tapeur", "veilleur", "explorateur", "paresseux"]);
  noms.forEach((n) => {
    const j = JOUEURS[n];
    assert.ok(typeof j.desc === "string" && j.desc.length > 5, n + " : une description");
    ["taps", "reflexion", "retour"].forEach((k) => assert.ok(Number.isFinite(j[k]) && j[k] > 0, n + " : " + k + " positif"));
    assert.strictEqual(typeof j.fouilles, "boolean", n + " : fouilles");
    if (j.sessions) assert.ok(j.sessions.actif > 0 && j.sessions.absent > 0, n + " : séances bien formées");
  });
  assert.strictEqual(JOUEURS.tapeur.sessions, null, "le tapeur joue sans interruption");
});

test("--joueur : le profil, et les options données à la main l’emportent", () => {
  const o = lire(["--joueur", "veilleur"]);
  assert.strictEqual(o.taps, 3);
  assert.deepStrictEqual(o.sessions, { actif: 5, absent: 4 });
  const p = lire(["--joueur", "veilleur", "--taps", "2", "--sessions", "10/1"]);
  assert.strictEqual(p.taps, 2);
  assert.deepStrictEqual(p.sessions, { actif: 10, absent: 1 });
  assert.strictEqual(p.reflexion, 20, "ce qui n’est pas donné vient du profil");
  assert.strictEqual(lire(["--joueur", "tapeur", "--sessions", "5/4"]).sessions.actif, 5, "l’ordre des options ne compte pas");
});
test("les erreurs de saisie sont dites", () => {
  assert.throws(() => lire(["--joueur", "inconnu"]), /types : tapeur veilleur/);
  assert.throws(() => lire(["--sessions", "cinq"]), /A\/H/);
  assert.throws(() => lire(["--sessions", "5/0"]), /A\/H/);
});

test("le veilleur : cinq minutes de jeu, quatre heures d’absence, et ainsi de suite", () => {
  const r = jouer("--joueur", "veilleur", "--minutes", "30");
  const n = r.absent / 4;
  assert.ok(Number.isInteger(n) && n > 0, "un nombre entier de séances : " + r.absent + " h");
  assert.strictEqual(n, Math.floor((r.minutes - 1e-6) / 5), "une absence par séance de 5 minutes de jeu actif (" + n + " pour " + r.minutes + " min)");
  assert.ok(Math.abs(r.ecoule - (r.minutes + r.absent * 60)) < 1e-6, "temps écoulé = jeu actif + absences");
});
test("le temps écoulé d’un passage = le temps actif + les absences d’avant", () => {
  const r = jouer("--joueur", "veilleur", "--minutes", "40");
  assert.ok(r.rows.length >= 2, "au moins deux passages");
  r.rows.forEach((x) => {
    const abs = x.ecoule - x.t;
    assert.ok(abs >= -1e-9 && abs <= r.absent * 60 + 1e-6, "absence avant le passage dans les bornes");
    assert.ok(Math.abs(abs / 240 - Math.round(abs / 240)) < 1e-6, "un nombre entier de séances de 4 h : " + abs / 60 + " h");
  });
  for (let i = 1; i < r.rows.length; i++) assert.ok(r.rows[i].ecoule >= r.rows[i - 1].ecoule, "le temps écoulé ne recule pas");
});
test("sans interruption (tapeur), écoulé = actif et aucune absence", () => {
  const r = jouer("--joueur", "tapeur", "--minutes", "30");
  assert.strictEqual(r.absent, 0);
  r.rows.forEach((x) => assert.ok(Math.abs(x.ecoule - x.t) < 1e-9));
});
test("--sessions l’emporte sur --offline", () => {
  const a = jouer("--minutes", "30", "--offline", "2", "--sessions", "5/4");
  const b = jouer("--minutes", "30", "--sessions", "5/4");
  assert.deepStrictEqual(a.rows.map((x) => [x.z, r3(x.t), r3(x.ecoule)]), b.rows.map((x) => [x.z, r3(x.t), r3(x.ecoule)]));
  assert.strictEqual(a.absent, b.absent);
});
test("déterminisme : deux exécutions, exactement les mêmes nombres", () => {
  const a = jouer("--joueur", "veilleur", "--minutes", "30"), b = jouer("--joueur", "veilleur", "--minutes", "30");
  assert.deepStrictEqual(a.rows.map((x) => [x.z, x.t, x.ecoule, x.traces]), b.rows.map((x) => [x.z, x.t, x.ecoule, x.traces]));
  assert.strictEqual(a.taps, b.taps);
  assert.strictEqual(a.crafts, b.crafts);
});
test("les séances repartent de zéro à chaque relève", () => {
  const r = jouer("--joueur", "veilleur", "--minutes", "20", "--cycles", "2");
  assert.strictEqual(r.cycles.length, 2);
  r.cycles.forEach((c) => c.rows.forEach((x) => assert.ok(x.ecoule >= x.t - 1e-9)));
});

/* Le vrai premier parcours (--parcours) : partie neuve, découverte par des essais, relève obligatoire, achat, cycle 2. */
const parcours = (pol, achat, graine) => jouer("--parcours", "--minutes", "30", "--decouverte", pol, "--achat", achat || "recolte", "--graine", String(graine || 1));
const plaine2 = (r) => (r.rows.find((x) => x.z === "plaine" && !x.offert) || {}).t;
test("premier parcours : la relève obligatoire est prise, puis le cycle 2 franchit la Plaine", () => {
  const r = parcours("enigme");
  assert.ok(r.rel && r.rel.t > 3 && r.rel.t < 10, "relève une fois la Plaine franchie, entre 3 et 10 min : " + (r.rel && r.rel.t));
  assert.ok(r.rel.essais >= 5, "la Plaine demande de découvrir plusieurs recettes (dont la torche)");
  assert.ok(plaine2(r) > 0, "la Plaine est franchie au cycle 2");
  assert.strictEqual(r.E.state.meta.forcedDone, true);
  assert.strictEqual(r.E.state.cycle, 2);
});
test("premier parcours : le joueur découvre vraiment (aucune recette connue d’avance), les essais viennent du moteur", () => {
  const r = parcours("guide");
  assert.ok(r.rel.essais >= r.rel.connues, "au moins un essai par recette découverte");
  assert.ok(r.rel.connues >= 4 && r.rel.connues <= 12, "quelques recettes apprises au cycle 1 : " + r.rel.connues);
  assert.ok(r.rel.essais > 5, "bien plus d’un essai par recette quand on cherche");
});
test("premier parcours : la découverte compte (l’énigme résolue d’emblée est la plus rapide jusqu’à la Plaine)", () => {
  const tot = (pol) => { const r = parcours(pol); return r.rel.t + plaine2(r); };
  const e = tot("enigme"), g = tot("guide"), h = tot("hasard");
  assert.ok(e < g && e < h, "l’énigme résolue d’emblée est la plus rapide : " + [e, g, h].map(r3).join(" / "));
});
test("premier parcours : le premier achat de Mémoire change le cycle 2 (Mains calleuses avant la Plaine)", () => {
  assert.ok(plaine2(parcours("enigme", "recolte")) < plaine2(parcours("enigme", "aucun")), "Mains calleuses accélère la Plaine");
});
test("premier parcours : déterminisme (même graine, mêmes nombres) et la graine change le hasard", () => {
  const a = parcours("hasard", "recolte", 2), b = parcours("hasard", "recolte", 2), c = parcours("hasard", "recolte", 5);
  assert.deepStrictEqual([a.rel.t, a.essais, plaine2(a)], [b.rel.t, b.essais, plaine2(b)]);
  assert.notDeepStrictEqual([a.rel.t, a.essais, a.rel.essaisPar], [c.rel.t, c.essais, c.rel.essaisPar], "deux graines, deux parcours");
});
test("premier parcours : --decouverte et --achat inconnus sont dits", () => {
  assert.throws(() => lire(["--parcours", "--decouverte", "x"]), /enigme, guide ou hasard/);
  assert.throws(() => lire(["--parcours", "--achat", "x"]), /--achat/);
});

console.log(passed + " tests du simulateur réussis" + (process.exitCode ? ", des échecs." : "."));
