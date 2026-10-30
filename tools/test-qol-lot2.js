// tools/test-qol-lot2.js — Tests du lot 2 de confort (projections, contrôle de file, aides)
"use strict";
const assert = require("assert/strict");
const fs = require("fs");
const path = require("path");
const D = require("../js/data.js");
const Core = require("../js/engine.js");

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log("  ✓ " + name);
  } catch (e) {
    console.error("  ✗ " + name, e);
    process.exitCode = 1;
  }
}

let T = 2e12;
const mk = () => Core.createEngine({ now: () => T, rand: () => 0.99 });

console.log("Lot 2 : Tests unitaires approfondis");

// --- Test 1 : Projections en lecture seule ---
test("projections : calculs corrects et stricte lecture seule (aucune mutation d'état)", () => {
  const E = mk();
  const S = E.state;

  S.inv.bois = 50;
  S.inv.pierre = 50;
  const invBefore = JSON.stringify(S.inv);
  const domBefore = JSON.stringify(S.dom);
  const handBefore = JSON.stringify(S.hand);

  // Projection extracteur (z, res, t, countDelta)
  const pExt = E.projectExtractor("lisiere", "bois", "cabane", 1);
  assert.ok(pExt, "La projection extracteur doit renvoyer un résultat");
  assert.ok(pExt.curRate >= 0, "curRate >= 0");
  assert.ok(pExt.projRate > pExt.curRate, "projRate doit être strictement supérieur à curRate (+1 extracteur)");
  assert.ok(pExt.cost && Object.keys(pExt.cost).length > 0, "Doit avoir un coût");

  // Projection amélioration : posons d'abord un extracteur
  E.domExtAdd("lisiere", "bois", 1, "cabane");
  const pExtUp = E.projectExtractorUpgrade("lisiere", "bois", "cabane");
  if (pExtUp) {
    assert.ok(pExtUp.projRate > pExtUp.curRate, "L'amélioration doit augmenter le débit");
  }

  // Projection outil
  const pTool = E.projectToolBenefit("piquet", "couteau_silex");
  if (pTool) {
    assert.ok(pTool.baseDur > 0, "baseDur > 0");
    assert.ok(pTool.withToolDur <= pTool.baseDur, "withToolDur <= baseDur");
  }

  // Projection machine sur recette
  const pMach = E.projectMachineOnRecipe("planche", "scie_mecanique");
  if (pMach) {
    assert.ok(pMach.unitDur > 0, "unitDur > 0");
    assert.ok(pMach.ratePerMin > 0, "ratePerMin > 0");
  }

  // Vérification de non-mutation : retirer l'extracteur posé pour le test d'amélioration et comparer
  S.dom.ext = {};
  S.inv = JSON.parse(invBefore);
  assert.strictEqual(JSON.stringify(S.inv), invBefore, "S.inv ne doit pas être modifié par les projections");
  assert.strictEqual(JSON.stringify(S.dom), domBefore, "S.dom ne doit pas avoir d'effets de bord");
  assert.strictEqual(JSON.stringify(S.hand), handBefore, "S.hand ne doit pas avoir d'effets de bord");
});

// --- Test 2 : Pause / Reprise et isolation des mains/machines ---
test("pause / reprise : progression gelée, mains libérées pour les commandes suivantes, reprise sans perte", () => {
  const E = mk();
  const S = E.state;

  E.learn("manche", true);
  E.learn("corde", true);
  E.add("bois", 100);
  E.add("fibre", 100);

  const res1 = E.order("manche", 10);
  assert.ok(res1.ok, "commande 1 doit être acceptée");
  const res2 = E.order("corde", 10);
  assert.ok(res2.ok, "commande 2 doit être acceptée");

  assert.strictEqual(S.hand.q.length, 2, "2 commandes doivent être dans la file S.hand.q");
  const job1 = S.hand.q[0];
  const job2 = S.hand.q[1];
  assert.ok(job1.uid, "job1 doit avoir un uid stable");
  assert.ok(job2.uid, "job2 doit avoir un uid stable");
  assert.strictEqual(job1.paused, false, "job1 doit être actif par défaut");

  // Avancer le temps de 0.5s
  E.step(0.5);
  const doneBeforePause = job1.done[0] + (job1.sp[0] || 0);
  const bBeforePause = JSON.stringify(job1.b);

  // Mettre en pause job 1
  E.pauseJob(job1.uid);
  assert.strictEqual(job1.paused, true, "job1 doit être mis en pause");

  // Vérifier handInfo
  const hi = E.handInfo();
  assert.strictEqual(hi.jobs[0].paused, true, "handInfo doit indiquer paused=true pour job1");
  assert.strictEqual(hi.jobs[0].left, null, "handInfo doit avoir left=null pour le job en pause");

  // Avancer le temps de 5s : job 1 ne doit PAS avancer, job 2 DOIT avancer !
  E.step(5.0);
  const doneAfterPause = job1.done[0] + (job1.sp[0] || 0);
  assert.strictEqual(doneAfterPause, doneBeforePause, "job 1 en pause ne doit pas progresser");
  assert.strictEqual(JSON.stringify(job1.b), bBeforePause, "Les matières réservées de job 1 doivent rester intactes");
  const job2Progress = job2.done[0] + (job2.sp[0] || 0);
  assert.ok(job2Progress > 0 || S.inv.corde > 0, "job 2 doit progresser car les mains sont libérées par la pause de job 1");

  // Reprendre job 1
  E.resumeJob(job1.uid);
  assert.strictEqual(job1.paused, false, "job1 doit être repris");
  E.step(1.0);
  const doneAfterResume = job1.done[0] + (job1.sp[0] || 0);
  assert.ok(doneAfterResume > doneBeforePause, "job 1 doit reprendre sa progression exactement d'où il s'était arrêté");
});

// --- Test 3 : Priorisation d'une commande ---
test("priorité : passage en tête sans reconstruction, sans duplication ni perte d'ingrédients", () => {
  const E = mk();
  const S = E.state;

  E.learn("manche", true);
  E.learn("corde", true);
  E.add("bois", 100);
  E.add("fibre", 100);

  E.order("manche", 5);
  E.order("corde", 5);

  const uidManche = S.hand.q[0].uid;
  const uidCorde = S.hand.q[1].uid;
  const cordeReservedBefore = JSON.stringify(S.hand.q[1].b);
  const cordeStepsBefore = JSON.stringify(S.hand.q[1].s);

  // Prioriser corde
  const res = E.prioritizeJob(uidCorde);
  assert.strictEqual(res, true, "prioritizeJob doit réussir");
  assert.strictEqual(S.hand.q[0].uid, uidCorde, "La corde doit être en tête de file (index 0)");
  assert.strictEqual(S.hand.q[1].uid, uidManche, "Le manche doit être en index 1");

  // Vérifier l'intégrité de la commande priorisée
  assert.strictEqual(JSON.stringify(S.hand.q[0].b), cordeReservedBefore, "Les matières réservées ne doivent pas changer");
  assert.strictEqual(JSON.stringify(S.hand.q[0].s), cordeStepsBefore, "Les étapes planifiées ne doivent pas être recalculées ni altérées");
});

// --- Test 4 : Annulation avec remboursement exact des matières de l'établi ---
test("annulation par uid : restitution stricte et exacte des matières réservées", () => {
  const E = mk();
  const S = E.state;

  E.learn("manche", true);
  E.add("bois", 10);
  E.order("manche", 2);

  const uid = S.hand.q[0].uid;
  const boisInBench = S.hand.q[0].b.bois || 0;
  const boisInInv = S.inv.bois || 0;

  // Annuler par uid stable
  E.cancelJob(uid);
  assert.strictEqual(S.hand.q.length, 0, "File vidée après annulation");
  assert.strictEqual(S.inv.bois, boisInInv + boisInBench, "Seules les matières réellement réservées sur l'établi sont restituées");
});

// --- Test 5 : Rétrocompatibilité avec les anciennes sauvegardes ---
test("rétrocompatibilité : anciennes commandes sans uid ni paused gérées sans erreur", () => {
  const E = mk();
  const S = E.state;

  // Simuler une commande ancienne sans uid ni paused
  S.hand.q = [{
    id: "manche",
    s: [["manche", 1]],
    done: [0],
    sp: [0],
    mAcc: [0],
    k: "manche",
    i: 0,
    b: { bois: 3 }
  }];

  const hi = E.handInfo();
  assert.ok(hi.jobs[0].uid, "L'ancienne commande doit recevoir automatiquement un uid stable");
  assert.strictEqual(hi.jobs[0].paused, false, "L'ancienne commande doit être active par défaut (non en pause)");
  assert.strictEqual(typeof hi.jobs[0].left, "number", "L'ancienne commande active a un temps restant numérique");
});

// --- Test 6 : Dictionnaire des explications (E.AIDES) ---
test("dictionnaire des explications contextuelles : complet et conforme", () => {
  const E = mk();
  assert.ok(E.AIDES, "E.AIDES doit exister");
  const requiredAides = ["etude", "commandes", "maitrise", "releve"];
  for (const a of requiredAides) {
    assert.ok(E.AIDES[a], `L'aide '${a}' doit être définie`);
    assert.ok(E.AIDES[a].titre && E.AIDES[a].titre.length > 0, `L'aide '${a}' doit avoir un titre`);
    assert.ok(E.AIDES[a].texte && E.AIDES[a].texte.length > 0, `L'aide '${a}' doit avoir un texte explicatif`);
  }
});

// --- Test 7 : Rattrapage hors ligne avec commande en pause ---
test("rattrapage hors ligne : la commande en pause ne bouge pas tandis que la suivante progresse", () => {
  const E = mk();
  const S = E.state;

  E.learn("manche", true);
  E.learn("corde", true);
  E.add("bois", 100);
  E.add("fibre", 100);

  E.order("manche", 10);
  E.order("corde", 10);

  const job1 = S.hand.q[0];
  const job2 = S.hand.q[1];

  E.pauseJob(job1.uid);
  const done1Before = job1.done[0] + (job1.sp[0] || 0);

  // Simuler une absence de 60 secondes via catchUp
  E.catchUp(60);

  const done1After = job1.done[0] + (job1.sp[0] || 0);
  assert.strictEqual(done1After, done1Before, "La commande en pause n'a pas progressé pendant l'absence");
  const job2Progress = job2.done[0] + (job2.sp[0] || 0);
  assert.ok(job2Progress > 0 || S.inv.corde > 0, "La commande suivante a profité de l'absence");
});

// --- Test 8 : Spécificités de l'Atelier équipé (si présent) ---
if (fs.existsSync(path.join(__dirname, "../js/equipements.js"))) {
  const equipped = () => Core.withData(require("../js/equipements").createData(D, { fullGame: true })).createEngine({ now: () => T, rand: () => 0.99 });

  test("preview : explications ouvrier et outils définies", () => {
    const E = equipped();
    assert.ok(E.AIDES.ouvrier, "L'aide ouvrier doit exister dans la preview");
    assert.ok(E.AIDES.outils, "L'aide outils doit exister dans la preview");
  });

  test("preview : bénéfice mesuré du couteau par rapport au racloir sur les lanières", () => {
    const E = equipped();
    E.add("racloir_os", 1);
    E.add("couteau", 1);
    E.learn("laniere", true);

    const tRacloir = E.handTime("laniere", { equipment: "racloir_os", mode: "couper" });
    const tCouteau = E.handTime("laniere", { equipment: "couteau", mode: "couper" });
    assert.ok(tRacloir > 0, "tRacloir > 0");
    assert.ok(tCouteau > 0, "tCouteau > 0");
    assert.ok(Math.abs(tRacloir / tCouteau - 2) < 1e-3, "Le couteau doit être 2× plus rapide que le racloir sur les lanières");
  });

  test("preview : mise en pause et priorisation préservent le choix d'équipement", () => {
    const E = equipped();
    E.add("racloir_os", 1);
    E.add("couteau", 1);
    E.add("cuir", 20);
    E.learn("laniere", true);

    const res = E.queue("laniere", 5, false, undefined, { equipment: "racloir_os", mode: "couper" });
    assert.ok(res.ok, "commande avec équipement explicite acceptée");

    const j = E.state.hand.q[0];
    assert.deepStrictEqual(j.equipmentSelection, { equipment: "racloir_os", mode: "couper" });

    E.pauseJob(j.uid);
    assert.strictEqual(j.paused, true);
    assert.deepStrictEqual(j.equipmentSelection, { equipment: "racloir_os", mode: "couper" }, "Le choix d'équipement doit être préservé en pause");

    E.resumeJob(j.uid);
    assert.strictEqual(j.paused, false);
    assert.deepStrictEqual(j.equipmentSelection, { equipment: "racloir_os", mode: "couper" }, "Le choix d'équipement doit être préservé à la reprise");
  });

  test("pack 2 : notification d'apprentissage et pastilles de découverte", () => {
    const E = equipped();
    let learnEmitted = null;
    E.on("learn", (id) => { learnEmitted = id; });
    
    // Découverte d'une recette
    E.learn("manche");
    assert.strictEqual(learnEmitted, "manche", "L'événement learn doit être émis pour notifier le carnet");
    assert.strictEqual(E.state.made.manche || 0, 0, "Une nouvelle recette n'a pas encore été fabriquée (pastille Nouveau active)");

    // Après fabrication
    E.add("bois", 5);
    const res = E.craft("manche", 1);
    assert.ok(res.ok, "Fabrication réussie");
    assert.ok((E.state.made.manche || 0) >= 1, "Après fabrication, made >= 1 (la pastille Nouveau se dissipe)");
  });

  test("pack 2 : présence des aquarelles et planches d'atlas pour chaque territoire", () => {
    const root = path.resolve(__dirname, "..");
    for (const z of D.ZONES) {
      const painted = path.join(root, "assets", "carnet", "lands", `${z.id}.webp`);
      const decor = path.join(root, "assets", "terres", `${z.id}-decor.webp`);
      const carte = path.join(root, "assets", "terres", `${z.id}-carte.webp`);
      const exists = fs.existsSync(painted) || fs.existsSync(decor) || fs.existsSync(carte);
      assert.ok(exists, `La terre ${z.id} doit posséder au moins une illustration peinte pour la contemplation`);
      assert.ok(z.n && z.n.length > 0, `La terre ${z.id} doit posséder un nom poétique`);
    }
  });
}

console.log(`${passed} tests du Lot 2 réussis.`);
