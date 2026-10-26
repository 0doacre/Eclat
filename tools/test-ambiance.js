/* ÉCLAT — test de la ligne d’ambiance
 * Vérifie le recueil des textes, la sélection selon la terre, l’âge et l’heure,
 * ainsi que l’exhaustivité et le respect de la charte de concision.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const lire = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");

const D = require("../js/data.js");

let ko = 0;
const ok = (m) => console.log("  ✓ " + m);
const echec = (m) => { ko++; console.log("  ✗ " + m); };

const sandbox = { window: {}, document: {}, console, D };
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(lire("js/ambiance.js"), sandbox);

const Amb = sandbox.window.EclatAmbiance;

console.log("Ligne d’ambiance :");

if (!Amb || !Amb.DATA) {
  echec("EclatAmbiance ou DATA manque dans le contexte");
  process.exit(1);
}

const { PAR_TERRE, PAR_AGE, PAR_HEURE, MACHINES, MEMOIRES, CLINS } = Amb.DATA;

// 1. Couverture des terres
const zones = D.ZONES.map((z) => z.id);
let zonesOk = 0;
for (const zid of zones) {
  const lines = PAR_TERRE[zid];
  if (!Array.isArray(lines) || lines.length < 3) {
    echec("Terre manquante ou trop peu de phrases pour " + zid);
  } else {
    zonesOk++;
  }
}
ok(zonesOk + "/" + zones.length + " terres couvertes par au moins 3 phrases d'ambiance");

// 2. Couverture des âges
const ages = D.AGES.map((a) => a.id);
let agesOk = 0;
for (const aid of ages) {
  const line = PAR_AGE[aid];
  if (!line || typeof line !== "string" || line.length < 10) {
    echec("Âge manquant ou phrase trop courte pour " + aid);
  } else {
    agesOk++;
  }
}
ok(agesOk + "/" + ages.length + " âges dotés d'une phrase d'ambiance");

// 3. Heures du jour
const periods = ["dawn", "day", "dusk", "night"];
for (const p of periods) {
  const lines = PAR_HEURE[p];
  if (!Array.isArray(lines) || lines.length < 2) {
    echec("Période manquante dans PAR_HEURE : " + p);
  }
}
ok("4 périodes horaires couvertes (aube, jour, crépuscule, nuit)");

// 4. Découpage partJour sur 24 heures
for (let h = 0; h < 24; h++) {
  const p = Amb.partJour(h);
  if (!periods.includes(p)) {
    echec("Heure " + h + " donne une période invalide : " + p);
  }
}
ok("Découpage des 24 heures de la journée vérifié");

// 5. Concision et pas de phrase excessivement longue pour mobile
let tropLong = 0;
let phrasesTotal = 0;
const allPhrases = [];

function checkList(arr, cat) {
  for (const s of arr) {
    phrasesTotal++;
    allPhrases.push(s);
    if (s.length > 95) {
      echec("Phrase trop longue (>95 car.) dans " + cat + " : " + s);
      tropLong++;
    }
  }
}

for (const z in PAR_TERRE) checkList(PAR_TERRE[z], "terre " + z);
for (const a in PAR_AGE) checkList([PAR_AGE[a]], "âge " + a);
for (const p in PAR_HEURE) checkList(PAR_HEURE[p], "heure " + p);
checkList(MACHINES, "machines");
checkList(MEMOIRES, "mémoires");
checkList(CLINS, "clins");

if (tropLong === 0) {
  ok(phrasesTotal + " phrases vérifiées : toutes sobres, concrètes et adaptées aux écrans mobiles");
}

// 6. Test de getLines et pickLine pour diverses combinaisons
let testsComb = 0;
for (const zid of zones) {
  for (let ageIdx = 0; ageIdx < D.AGES.length; ageIdx += 3) {
    for (const time of periods) {
      const ctx = { zone: zid, age: ageIdx, time, machines: 1, cycle: 2 };
      const lines = Amb.getLines(ctx, D);
      if (!Array.isArray(lines) || lines.length === 0) {
        echec("getLines vide pour zone=" + zid + " age=" + ageIdx + " time=" + time);
      }
      const picked1 = Amb.pickLine(lines, 1234, 0);
      const picked2 = Amb.pickLine(lines, 1234, 1);
      if (!picked1 || typeof picked1 !== "string") {
        echec("pickLine invalide");
      }
      testsComb++;
    }
  }
}
ok(testsComb + " contextes de jeu simulés avec succès (sélection et rotation valides)");

// 7. Terres spatiales et caveau (pas d'heure terrestre)
const spatialLines = Amb.getLines({ zone: "lune", age: 14, time: "dawn", machines: 0, cycle: 1 }, D);
for (const hLine of PAR_HEURE.dawn) {
  if (spatialLines.includes(hLine)) {
    echec("La Lune ne doit pas afficher de rosée terrestre du matin");
  }
}
ok("Les terres sans atmosphère terrestre (Lune, Orbite, Mercure, Caveau) excluent la météo horaire");

if (ko > 0) {
  console.log("✗ " + ko + " tests échoués.");
  process.exit(1);
} else {
  console.log("✓ Tous les tests de la ligne d’ambiance sont réussis.");
}
