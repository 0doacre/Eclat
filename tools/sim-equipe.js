#!/usr/bin/env node
/* 0.54, simulation d'équilibrage des travailleurs généralistes : les joueurs automatiques de tools/sim-passages.js n'embauchent jamais, donc
 * la production libre des travailleurs (D.TRAVAILLEURS.generalistes) ne se voit pas. Ce banc ajoute un EMPLOYEUR : toutes les 10 s de jeu il reçoit
 * des écus (le Comptoir n'est pas joué par le robot) et embauche, un travailleur à la fois, dans le métier qui en a le moins. On joue ensuite la
 * même partie avec la production libre éteinte, à 30 % (le réglage par défaut) et à 100 % (le pire cas), et on compare le temps de chaque passage.
 * Critère de l'étude : la production libre ne doit pas avancer un passage de plus de 10 %.
 *
 *   node tools/sim-equipe.js [--minutes 120] [--joueurs tapeur,veilleur,…] [--ecus 80] [--max 2] [--seuils 30,100]
 *     --ecus : écus reçus par minute de jeu actif (80 : une embauche d'apprenti toutes les quelques minutes au début)
 *     --sans-energie : l'énergie ne ralentit plus rien (isole l'effet des chevaux que les travailleurs consomment)
 *     --max  : travailleurs (apprentis + ouvriers) au plus par métier
 * Le moteur n'est jamais modifié. */
"use strict";
const EngineMod = require("../js/engine.js");
const D = require("../js/data.js");
const orig = EngineMod.createEngine;
const cfg = { generalistes: true, seuil: null, ecus: 80, max: 2, employeur: true };
let embauches = 0;
EngineMod.createEngine = function (opts) {
  const E = orig(opts);
  const up = E.update;
  let n = 0;
  D.TRAVAILLEURS.generalistes = cfg.generalistes;
  if (process.argv.includes("--sans-energie")) D.ATELIERS.plancherEnergie = 1; // l'énergie ne ralentit rien : pour isoler son effet
  E.update = function () {
    const r = up.apply(this, arguments);
    if (cfg.employeur && ++n % 100 === 0) { // toutes les 10 s de jeu (pas de 100 ms)
      const S = E.state;
      S.ecus = (S.ecus || 0) + cfg.ecus / 6;
      const fams = D.ATELIERS.familles.map((f) => f.id);
      if (cfg.seuil !== null) fams.forEach((f) => { if ((E.seuilAtelier(f)) !== cfg.seuil) E.setSeuilAtelier(f, cfg.seuil); });
      const eff = (f) => ((S.ateliers && S.ateliers[f]) || {});
      const total = (f) => (eff(f).app || 0) + (eff(f).ouv || 0);
      for (const f of fams.slice().sort((a, b) => total(a) - total(b))) {
        if (total(f) >= cfg.max) continue;
        for (const kind of ["ouvrier", "apprenti"]) {
          if (E.embaucher(f, kind).ok) { embauches++; return r; }
        }
      }
    }
    return r;
  };
  return E;
};
const Sim = require("./sim-passages.js");
const arg = (k, d) => { const i = process.argv.indexOf(k); return i < 0 ? d : process.argv[i + 1]; };
const minutes = +arg("--minutes", 120), noms = (arg("--joueurs", "") || Object.keys(Sim.JOUEURS).join(",")).split(",").filter(Boolean);
cfg.ecus = +arg("--ecus", cfg.ecus); cfg.max = +arg("--max", cfg.max);
const seuils = arg("--seuils", "30,100").split(",").map(Number);
const json = process.argv.includes("--json");

function jouer(nom, generalistes, seuil) {
  cfg.generalistes = generalistes; cfg.seuil = seuil; embauches = 0;
  const r = Sim.play(Sim.appliquerJoueur(Object.assign({}, Sim.lire(["--minutes", String(minutes)])), nom, {}));
  const fait = r.E.state.equipe && r.E.state.equipe.fait ? Object.values(r.E.state.equipe.fait).reduce((a, f) => a + Object.values(f).reduce((b, n) => b + n, 0), 0) : 0;
  return { rows: r.rows.filter((x) => !x.offert), embauches, crafts: r.crafts, age: r.age, fait: Math.round(fait) };
}
const out = {};
for (const nom of noms) {
  const sans = jouer(nom, false, null);
  const res = { sans: sans.rows.map((x) => [x.z, +x.t.toFixed(1)]), embauches: sans.embauches, variantes: {} };
  for (const s of seuils) {
    const avec = jouer(nom, true, s);
    const lignes = sans.rows.map((x) => { const y = avec.rows.find((z) => z.z === x.z); return { z: x.z, sans: x.t, avec: y ? y.t : null, ecart: y ? (y.t / x.t - 1) * 100 : null }; });
    const ok = lignes.filter((l) => l.ecart !== null);
    res.variantes[s] = { passages: lignes, moyenne: ok.reduce((a, l) => a + l.ecart, 0) / (ok.length || 1), pire: ok.length ? Math.min(...ok.map((l) => l.ecart)) : 0, fabrications: avec.crafts, fabricationsSans: sans.crafts, faitLibre: avec.fait };
  }
  out[nom] = res;
}
if (json) console.log(JSON.stringify(out, null, 2));
else {
  console.log("Production libre des travailleurs : temps de chaque passage, sans / avec (écart en %, négatif = plus rapide). " + minutes + " min de jeu actif, " + cfg.ecus + " écus/min, au plus " + cfg.max + " travailleurs par métier.");
  for (const nom of noms) {
    const r = out[nom];
    console.log("\n" + nom + " (" + r.embauches + " embauches)");
    for (const s of seuils) {
      const v = r.variantes[s];
      console.log("  seuil " + String(s).padStart(3) + " % : moyenne " + v.moyenne.toFixed(1) + " %, plus fort gain " + v.pire.toFixed(1) + " % · fabrications " + v.fabricationsSans + " → " + v.fabrications + " (dont " + v.faitLibre + " par la production libre)");
      console.log("    " + v.passages.map((l) => l.z.slice(0, 6) + " " + l.sans.toFixed(1) + "→" + (l.avec === null ? "—" : l.avec.toFixed(1)) + " (" + (l.ecart === null ? "—" : (l.ecart > 0 ? "+" : "") + l.ecart.toFixed(0) + " %") + ")").join(" · "));
    }
  }
}
