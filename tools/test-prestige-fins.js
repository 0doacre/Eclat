/* Tests unitaires et d'intégration : Deuxième couche de prestige liée aux fins (0.35.0) */
"use strict";

const assert = require("assert");
const { createEngine } = require("../js/engine.js");
const D = require("../js/data.js");

function test(name, fn) {
  try {
    fn();
    console.log("  ✓ " + name);
  } catch (e) {
    console.error("  ✗ " + name);
    console.error(e);
    process.exit(1);
  }
}

console.log("Deuxième couche de prestige (Règles d'Écho des fins) :");

test("5 règles d'Écho définies dans D.ECHOS_FINS, alignées avec D.ENDINGS", () => {
  assert.ok(D.ECHOS_FINS, "D.ECHOS_FINS existe");
  const endKeys = Object.keys(D.ENDINGS);
  const echoKeys = Object.keys(D.ECHOS_FINS);
  assert.strictEqual(echoKeys.length, 5);
  assert.strictEqual(endKeys.length, 5);
  endKeys.forEach((k) => {
    const echo = D.ECHOS_FINS[k];
    assert.ok(echo, "Écho présent pour " + k);
    assert.strictEqual(echo.id, k);
    assert.ok(echo.n && echo.n.length > 0, "Nom pour " + k);
    assert.ok(echo.ic && echo.ic.length > 0, "Icône pour " + k);
    assert.ok(echo.d && echo.d.length > 0, "Description pour " + k);
  });
});

test("hasEchoFin initialement faux, puis vrai dès qu'une fin est atteinte ou enregistrée", () => {
  const E = createEngine();
  assert.strictEqual(E.hasEchoFin("aube"), false);
  assert.strictEqual(E.hasEchoFin("brasier"), false);
  assert.strictEqual(E.hasEchoFin("exode"), false);
  assert.strictEqual(E.hasEchoFin("silence"), false);
  assert.strictEqual(E.hasEchoFin("retour"), false);

  E.state.meta.endings.aube = 1;
  assert.strictEqual(E.hasEchoFin("aube"), true);
  assert.strictEqual(E.activeEchoesFins().includes("aube"), true);
});

test("Règle Aube (Foyer Perpétuel) : geste Chauffer actif d'emblée à 600 °C et bonus thermique", () => {
  const E0 = createEngine();
  assert.strictEqual(E0.gesteOK("chauffer"), false, "Sans station ni fin Aube, pas de Chauffer");
  assert.strictEqual(E0.heat(), 0);

  const E1 = createEngine();
  E1.state.meta.endings.aube = 1;
  E1.recalc();
  assert.strictEqual(E1.gesteOK("chauffer"), true, "Chauffer actif dès l'éveil avec Aube");
  assert.strictEqual(E1.heat(), 600, "Chaleur de base à 600 °C sans feu de camp");

  // Si on fabrique le feu de camp (600 °C de base), la station gagne +200 °C => 800 °C
  E1.state.inv.feu = 1;
  E1.recalc();
  assert.strictEqual(E1.heat(), 800, "Station de chauffe dopée de +200 °C");
});

test("Règle Brasier (L'Onde de Choc) : -15 % sur le coût des passages et récolte renforcée", () => {
  const E0 = createEngine();
  const c0 = E0.passCost("plaine");

  const E1 = createEngine();
  E1.state.meta.endings.brasier = 1;
  const c1 = E1.passCost("plaine");

  for (const item in c0) {
    assert.ok(c1[item] <= c0[item], "Coût du passage réduit ou égal");
    if (c0[item] > 1) {
      assert.strictEqual(c1[item], Math.max(1, Math.ceil(c0[item] * 0.85)));
    }
  }
});

test("Règle Exode (La Voie des Étoiles) : explorations accélérées (×2) et veille 24 h", () => {
  const E0 = createEngine();
  assert.strictEqual(E0.expMult(), 1);

  const E1 = createEngine();
  E1.state.meta.endings.exode = 1;
  E1.recalc();
  assert.strictEqual(E1.expMult(), 2, "Vitesse d'exploration doublée");

  // Veille hors ligne plafonnée à 24 h (86400 s) au lieu de 12 h (43200 s)
  const dtSim = 100000;
  const caught0 = E0.catchUp(dtSim);
  assert.strictEqual(caught0, 12 * 3600, "Plafond standard à 12 h");

  const caught1 = E1.catchUp(dtSim);
  assert.strictEqual(caught1, 24 * 3600, "Plafond étendu à 24 h avec l'Écho de l'Exode");
});

test("Règle Silence (L'Écho Cosmique) : régénération passive +3 Intuition/min et coûts divisés par 2", () => {
  const E0 = createEngine();
  const cStudy0 = E0.studyCost("bois");
  const cDecipher0 = E0.decipherCost("manche");

  const E1 = createEngine();
  E1.state.meta.endings.silence = 1;
  E1.recalc();

  const cStudy1 = E1.studyCost("bois");
  assert.ok(cStudy1 <= cStudy0, "Coût d'étude réduit");

  const cDecipher1 = E1.decipherCost("manche");
  if (cDecipher0 !== null) {
    assert.strictEqual(cDecipher1, Math.max(1, Math.ceil(cDecipher0 / 2)), "Déchiffrage divisé par deux");
  }

  // Régénération passive
  assert.strictEqual(E1.cache().intu, 3, "+3 Intuition par minute dans le cache");
});

test("Règle Retour (L'Éveil Partagé) : vitesse des machines +25 % et premier exemplaire à la main non requis", () => {
  const E0 = createEngine();
  assert.strictEqual(E0.cache().aspd, 1);

  const E1 = createEngine();
  E1.state.meta.endings.retour = 1;
  E1.recalc();
  assert.strictEqual(E1.cache().aspd, 1.25, "Vitesse des machines dopée de +25 %");
});

test("Persistance immuable à travers la relève des Semeurs", () => {
  const E = createEngine();
  E.state.meta.endings.aube = 1;
  E.state.meta.endings.exode = 1;
  E.recalc();

  assert.strictEqual(E.hasEchoFin("aube"), true);
  assert.strictEqual(E.hasEchoFin("exode"), true);

  // Simuler la relève (nouveau cycle)
  E.state.pass.plaine = { done: true, free: false };
  E.state.cycle = 1;
  // Déclencher le nouveau cycle
  const nouveauState = E.serialize();
  const ESuivant = createEngine();
  ESuivant.load(nouveauState);

  assert.strictEqual(ESuivant.hasEchoFin("aube"), true, "Aube conservée après chargement");
  assert.strictEqual(ESuivant.hasEchoFin("exode"), true, "Exode conservée après chargement");
  assert.strictEqual(ESuivant.expMult(), 2, "Effet mécanique toujours actif après relève");
  assert.strictEqual(ESuivant.heat(), 600, "Chauffer toujours actif après relève");
});

test("Miroir du cycle : jalons de vitesse par terre, comparaison au cycle précédent et record", () => {
  const E = createEngine();
  const S = E.state;
  E.step(1800, false); // 30 min de jeu actif au cycle 1
  S.exp.done.lisiere = 2;
  S.pass.plaine = { paid: {}, done: false };
  const cost1 = E.passCost("plaine");
  for (const k in cost1) S.inv[k] = cost1[k];
  E.passPour("plaine");
  assert.strictEqual(S.stats.splits.plaine, 1800, "La Plaine est franchie à 1800 s au cycle 1");

  E.newCycle();
  assert.strictEqual(E.state.meta.lastSplits.plaine, 1800, "Le temps du cycle 1 est archivé dans lastSplits");
  assert.strictEqual(E.state.meta.bestSplits.plaine, 1800, "Le record initial est de 1800 s");
  const mWake = E.cycleMirror();
  assert.strictEqual(mWake.isJustWoken, true, "Juste après la relève, le miroir affiche le bilan du cycle achevé");

  E.step(720, false); // 12 min au cycle 2
  E.state.pass.plaine = { paid: {}, done: false };
  const cost2 = E.passCost("plaine");
  for (const k in cost2) E.state.inv[k] = cost2[k];
  E.passPour("plaine");
  const m2 = E.cycleMirror();
  const rPlaine = m2.rows.find((r) => r.z === "plaine");
  assert.ok(rPlaine, "La ligne de la Plaine figure dans le miroir du cycle 2");
  assert.strictEqual(rPlaine.cur, 720);
  assert.strictEqual(rPlaine.prev, 1800);
  assert.strictEqual(rPlaine.speedup, 2.5, "Accélération ×2,5 calculée entre 1800 s et 720 s");
  assert.strictEqual(rPlaine.isRecord, true, "Nouveau record détecté");
});

test("Récit d’éveil sur les ruines : chaque ruine réparée livre son écho atmosphérique", () => {
  const E = createEngine();
  E.state.meta.ruins.cabane = 2;
  const cost = E.ruinCost("cabane");
  for (const k in cost) E.state.inv[k] = cost[k] * 2;
  const r1 = E.repair("cabane");
  assert.strictEqual(r1.ok, true);
  assert.ok(r1.echo && r1.echo.includes("frêne"), "Écho atmosphérique propre à la cabane");
  assert.strictEqual(r1.firstInCycle, true, "Première réparation du cycle signalée");
  const r2 = E.repair("cabane");
  assert.strictEqual(r2.ok, true);
  assert.strictEqual(r2.firstInCycle, false, "Seconde réparation du même ouvrage dans le cycle ne répète pas le toast");
});

console.log("✓ Tous les tests de la deuxième couche de prestige sont réussis.");
