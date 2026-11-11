#!/usr/bin/env node
/* Audit sans modifier les règles : structure, ou rythme sur le vrai simulateur.
 * node tools/audit-equilibre.js --structure
 * node tools/audit-equilibre.js --profil base --minutes 360
 * node tools/audit-equilibre.js --profil memoire --minutes 240
 * node tools/audit-equilibre.js --profil veilleur --minutes 120
 * La sortie JSON peut être conservée par redirection. Recettes connues, sans machines
 * posées : ce sont des scénarios de comparaison, pas des durées de partie humaine. */
'use strict';
const D = require('../js/data');
const engine = require('../js/engine');
const profils = {
  base: { minutes: 360, args: [] },
  memoire: { minutes: 240, args: ['--mem', 'recolte=2,extr=2,mains=2'] },
  veilleur: { minutes: 120, args: ['--joueur', 'veilleur'] }
};
const args = process.argv.slice(2);
let profil = null, minutes = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--structure') continue;
  if (args[i] === '--profil') { profil = args[++i]; continue; }
  if (args[i] === '--minutes') { minutes = Number(args[++i]); continue; }
  throw new Error('Option inconnue : ' + args[i]);
}
if (profil && !profils[profil]) throw new Error('Profil attendu : base, memoire ou veilleur');
if (minutes !== null && !(minutes > 0 && Number.isFinite(minutes))) throw new Error('--minutes doit être positif');
const E = engine.createEngine();
const publicRecipe = (it) => it.r && !it.sec && !it.path && !it.old && !it.curio && !['curio', 'relic'].includes(it.t);
const structure = {
  ages: D.AGES.map((a, i) => ({ id: a.id, nom: a.n,
    recettes: Object.values(D.ITEMS).filter((it) => it.a === i && publicRecipe(it)).length,
    jalons: (E.milestones()[i] || []).map((x) => x.ob.id || x.ob.z || x.ob.k) })),
  terres: D.ZONES.filter((z) => !z.secret).map((z) => ({ id: z.id, nom: z.n,
    cle: z.req || null, ageCle: z.req ? D.ITEMS[z.req].a : 0,
    ressources: z.res.map((id) => ({ id, ageAffiche: D.ITEMS[id].a,
      premierUsageRecette: Object.values(D.ITEMS).filter((it) => publicRecipe(it) && it.r[1][id]).reduce((min, it) => Math.min(min, it.a), Infinity) })).map((r) => ({ ...r, premierUsageRecette: Number.isFinite(r.premierUsageRecette) ? r.premierUsageRecette : null })),
    passage: D.PASSAGES[z.id] || null })),
  gisementsTardifs: E.deposits().filter((d) => !d.hand)
};
// Les dépôts ne comprennent normalement que les terres ouvertes au départ.
structure.gisementsTardifs = D.ZONES.flatMap((z) => E.zoneDeps(z.id).filter((d) => !d.hand).map((d) => ({ terre: z.id, ressource: d.res,
  extracteurs: E.extFor(d.res, z.id).map((id) => ({ id, age: D.ITEMS[id].a })) })));
const result = { version: D.VERSION, structure };
if (profil) {
  const entrees = [{ age: 0, actif: 0 }], original = engine.createEngine;
  engine.createEngine = (...a) => {
    const e = original(...a);
    e.on('age', (age) => entrees.push({ age, actif: e.state.stats.play / 60 }));
    return e;
  };
  try {
    // Le simulateur reçoit la fabrique instrumentée, sans changer le moteur.
    const { play, lire } = require('./sim-passages');
    const p = profils[profil], options = ['--minutes', String(minutes || p.minutes), ...p.args];
    const r = play(lire(options));
    result.simulation = { profil, options, minutesActives: r.minutes, minutesEcoulees: r.ecoule,
      ages: entrees.map((x, i) => ({ age: D.AGES[x.age].id, entree: x.actif,
        duree: (entrees[i + 1] ? entrees[i + 1].actif : r.minutes) - x.actif, termine: i + 1 < entrees.length })),
      passages: r.rows.map((x) => ({ terre: x.z, actif: x.t, ecoule: x.ecoule, age: D.AGES[x.age].id,
        objetClePret: x.prete, depuisObjetCle: x.prete === undefined ? null : x.t - x.prete })),
      ageFinal: D.AGES[r.age].id, objectif: r.E.objective(), passageRestant: r.mur, gels: r.gels };
  } finally { engine.createEngine = original; }
}
console.log(JSON.stringify(result, null, 2));
