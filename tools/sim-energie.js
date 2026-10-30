#!/usr/bin/env node
/* 0.44, étape de simulation : l'énergie ne ralentit encore rien. Ce banc joue les mêmes joueurs automatiques que
 * tools/sim-passages.js et lit, toutes les 10 s de jeu, ce que dit l'écran de l'énergie (offre, demande, rapport),
 * pour voir combien de temps un joueur réaliste serait en manque si le manque ralentissait les machines et les ouvriers.
 * Il ne change rien au jeu.
 *
 *   node tools/sim-energie.js [--minutes 120] [--joueurs tapeur,veilleur,…] [--json]
 */
"use strict";
const EngineMod = require("../js/engine.js");
const D = require("../js/data.js");
const Ateliers = require("../js/ateliers.js");
const orig = EngineMod.createEngine;
let sonde = null, plancher = null; // plancher : null = l’énergie ne ralentit rien ; sinon facteur = max(plancher, offre / demande)
EngineMod.createEngine = function (opts) {
  const E = orig(opts);
  const A = Ateliers.create({ E, D });
  const up = E.update;
  let n = 0, cache = 1, tourne = false;
  if (plancher !== null) E.energieFacteur = function () {
    if (tourne) return cache;
    if (n % 10 !== 0 && cache !== undefined && E._fac === n) return cache;
    tourne = true;
    try { cache = Math.max(plancher, A.energie().ratio); } finally { tourne = false; }
    E._fac = n; return cache;
  };
  E.update = function () {
    const r = up.apply(this, arguments);
    if (sonde && ++n % 100 === 0) { // 100 pas de 100 ms
      const e = A.energie(), ms = E.machines(), tr = E.travailleurs();
      let ouvriers = 0;
      for (const f in tr) ouvriers += tr[f].usedApp + tr[f].usedOuv;
      let machines = 0;
      D.ATELIERS.paliers.forEach((p) => { if (ms[p.id]) machines += ms[p.id].used; });
      sonde.push({ age: E.state.age, offre: e.offre, demande: e.demande, ratio: e.ratio, machines, ouvriers });
    }
    return r;
  };
  return E;
};
const Sim = require("./sim-passages.js");
const arg = (k, d) => { const i = process.argv.indexOf(k); return i < 0 ? d : process.argv[i + 1]; };
const minutes = +arg("--minutes", 120), noms = (arg("--joueurs", "") || Object.keys(Sim.JOUEURS).join(",")).split(",").filter(Boolean);
const json = process.argv.includes("--json");
const planchers = (arg("--planchers", "") || "").split(",").filter(Boolean).map(Number);
const res = {};
/* le temps (minutes de jeu actif) où chaque passage est franchi, avec ou sans ralentissement */
if (planchers.length) {
  for (const nom of noms) {
    const lignes = {};
    for (const p of [null].concat(planchers)) {
      plancher = p; sonde = [];
      const r = Sim.play(Sim.appliquerJoueur(Object.assign({}, Sim.lire(["--minutes", String(minutes)])), nom, {}));
      lignes[p === null ? "aucun" : "plancher " + p] = r.rows.filter((x) => !x.offert).map((x) => x.z + " " + x.t.toFixed(1));
    }
    console.log("\n" + nom + " (minutes de jeu actif au franchissement de chaque passage)");
    for (const k in lignes) console.log("  " + k.padEnd(14) + lignes[k].join(" · "));
  }
  process.exit(0);
}
plancher = null;
for (const nom of noms) {
  sonde = [];
  const o = Sim.appliquerJoueur(Object.assign({}, Sim.lire(["--minutes", String(minutes)])), nom, {});
  Sim.play(o);
  const s = sonde.filter((x) => x.demande > 0);
  const manque = s.filter((x) => x.ratio < 1);
  const parAge = {};
  sonde.forEach((x) => { const a = parAge[x.age] = parAge[x.age] || { n: 0, avecDemande: 0, manque: 0, pire: 1, demandeMax: 0, offre: 0, machines: 0, ouvriers: 0 }; a.n++; if (x.demande > 0) a.avecDemande++; if (x.ratio < 1) a.manque++; a.pire = Math.min(a.pire, x.ratio); a.demandeMax = Math.max(a.demandeMax, x.demande); a.offre = Math.max(a.offre, x.offre); a.machines = Math.max(a.machines, x.machines); a.ouvriers = Math.max(a.ouvriers, x.ouvriers); });
  res[nom] = { echantillons: sonde.length, avecDemande: s.length, enManque: manque.length, pire: sonde.length ? Math.min(...sonde.map((x) => x.ratio)) : 1, parAge };
}
if (json) console.log(JSON.stringify(res, null, 2));
else {
  for (const nom of noms) {
    const r = res[nom];
    console.log("\n" + nom + " : " + r.echantillons + " relevés, demande > 0 : " + r.avecDemande + ", en manque : " + r.enManque + ", pire rapport : " + r.pire.toFixed(2));
    console.log("  âge  relevés  demande>0  manque  pire  demande max  offre  machines  travailleurs");
    Object.keys(r.parAge).forEach((a) => { const x = r.parAge[a]; console.log("  " + String(a).padStart(3) + "  " + String(x.n).padStart(7) + "  " + String(x.avecDemande).padStart(9) + "  " + String(x.manque).padStart(6) + "  " + x.pire.toFixed(2) + "  " + String(x.demandeMax).padStart(11) + "  " + String(x.offre).padStart(5) + "  " + String(x.machines).padStart(8) + "  " + String(x.ouvriers).padStart(12)); });
  }
}
