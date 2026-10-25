#!/usr/bin/env node
/* Vérifie la cohérence du contenu : références, doublons, objets utiles,
 * et que chaque recette est atteignable depuis le début de partie. */
"use strict";
const D = require("../js/data.js");
const { createEngine } = require("../js/engine.js");

const errors = [];
const warns = [];
const err = (m) => errors.push(m);
const warn = (m) => warns.push(m);

const E = createEngine(); // lève une erreur si deux recettes ont la même clé
const I = D.ITEMS;
const Z = {};
D.ZONES.forEach((z) => (Z[z.id] = z));

const UNIQUE = new Set(["tool", "stat", "upg", "curio"]);
const used = {};

for (const id in I) {
  const it = I[id];
  if (!it.n) err(id + " : pas de nom");
  if (!it.ic && !it.sym) err(id + " : pas d’icône");
  if (typeof it.a !== "number" || it.a < 0 || it.a >= D.AGES.length) err(id + " : âge invalide");
  if (it.r) {
    const [g, ing, n] = it.r;
    if (!D.GESTES[g]) err(id + " : geste inconnu " + g);
    if (!(n > 0)) err(id + " : quantité produite invalide");
    if (Object.keys(ing).length > 3) err(id + " : plus de 3 ingrédients");
    for (const i in ing) {
      if (!I[i]) err(id + " : ingrédient inconnu " + i);
      else {
        used[i] = (used[i] || 0) + 1;
        if (UNIQUE.has(I[i].t)) err(id + " : utilise un objet unique comme ingrédient (" + i + ")");
        if (I[i].t === "ext" || I[i].t === "auto" || I[i].t === "mach") err(id + " : utilise un extracteur ou une machine comme ingrédient (" + i + ")");
      }
      if (!(ing[i] > 0)) err(id + " : quantité invalide pour " + i);
    }
    if (!it.sec && !it.curio && !it.path && !it.h) warn(id + " : pas d’indice (h)");
  }
  if (it.t === "mach" && !(it.spd > 0)) err(id + " : machine sans vitesse (spd)");
  if (it.t === "ext") {
    if (!Z[it.z]) err(id + " : zone d’extracteur inconnue " + it.z);
    for (const r in it.p) if (!I[r]) err(id + " : produit une ressource inconnue " + r);
  }
  const e = it.e || {};
  if (e.zone && !Z[e.zone]) err(id + " : débloque une zone inconnue " + e.zone);
  for (const k of ["tap", "auto"]) if (e[k]) for (const t in e[k]) if (t !== "*" && !I[t] && !Z[t]) err(id + " : cible " + k + " inconnue " + t);
  if (e.st) e.st.forEach((s) => { if (!D.GESTES[s.g]) err(id + " : station pour geste inconnu " + s.g); });
}

/* objets fabriqués mais jamais utilisés ni utiles */
for (const id in I) {
  const it = I[id];
  if ((it.t === "comp" || it.t === "res") && !used[id] && !it.sec) {
    const inProject = Object.values(D.PROJECTS).some((p) => p.steps.some((s) => s.cost && s.cost[id]));
    const inExp = D.ZONES.some((z) => z.exps.some((x) => x.cost && x.cost[id]));
    if (!inProject && !inExp && !(it.e && it.e.zone)) warn(id + " : composant jamais utilisé");
  }
}

for (const z of D.ZONES) {
  z.res.forEach((r) => { if (!I[r]) err("zone " + z.id + " : ressource inconnue " + r); });
  if (z.req && z.req[0] !== "@" && !I[z.req]) err("zone " + z.id + " : prérequis inconnu " + z.req);
  if (z.req && z.req[0] !== "@" && !(I[z.req].e && I[z.req].e.zone === z.id)) err("zone " + z.id + " : " + z.req + " ne débloque pas cette zone");
  z.exps.forEach((x) => {
    if (x.need) {
      if (typeof x.need === "string") {
        if (!I[x.need]) err("exploration " + x.id + " : prérequis inconnu " + x.need);
      } else if (Array.isArray(x.need)) {
        x.need.forEach((it) => { if (!I[it]) err("exploration " + x.id + " : prérequis inconnu " + it); });
      } else if (typeof x.need !== "object") {
        err("exploration " + x.id + " : prérequis invalide");
      }
    }
    if (x.cost) for (const i in x.cost) if (!I[i]) err("exploration " + x.id + " : coût inconnu " + i);
    const rw = x.rw || {};
    if (rw.frag && !D.FRAGS[rw.frag]) err("exploration " + x.id + " : fragment inconnu " + rw.frag);
    for (const k of ["inv", "item"]) if (rw[k]) for (const i in rw[k]) if (!I[i]) err("exploration " + x.id + " : récompense inconnue " + i);
  });
}
for (const pid in D.PROJECTS) {
  const p = D.PROJECTS[pid];
  if (!D.ENDINGS[p.end]) err("œuvre " + pid + " : fin inconnue");
  p.steps.forEach((s) => { if (s.cost) for (const i in s.cost) if (!I[i]) err("œuvre " + pid + " : coût inconnu " + i); });
}
// les passages : une terre existante, ouverte par un objet, des coûts connus, des Traces
for (const z in D.PASSAGES) {
  const P = D.PASSAGES[z];
  if (!Z[z]) err("passage vers une terre inconnue " + z);
  else if (!Z[z].req || !I[Z[z].req]) err("passage " + z + " : aucun objet n’ouvre cette terre");
  for (const i in P.cost) if (!I[i]) err("passage " + z + " : coût inconnu " + i);
  if (!(P.tr > 0)) err("passage " + z + " : pas de Traces");
}
D.MEMOIRE.forEach((m) => { if (!m.cost.length || typeof m.v !== "function") err("mémoire " + m.id + " : mal formée"); });
D.OBJECTIVES.forEach((o) => {
  if (Array.isArray(o)) { if (!I[o[0]]) err("objectif inconnu " + o[0]); return; }
  if (o.k === "exp") { if (!Z[o.z] || !Z[o.z].exps.find((x) => x.id === o.x)) err("objectif d’exploration inconnu " + o.z + "/" + o.x); }
  else if (o.k === "pass") { if (!D.PASSAGES[o.z]) err("objectif de passage inconnu " + o.z); }
  else if (o.k !== "line" && o.k !== "ext") err("type d’objectif inconnu " + o.k);
  if (!o.txt || !o.n) err("objectif " + o.k + " sans texte");
});
D.SECRETS.forEach((s) => {
  if (s.k === "recette" && !(I[s.id] && I[s.id].sec)) err("secret " + s.id + " : pas une recette secrète");
  if (s.k === "mélodie" && !D.MELODIES[s.id]) err("secret " + s.id + " : mélodie inconnue");
});
for (const id in I) if (I[id].sec && !I[id].curio && !D.SECRETS.find((s) => s.id === id)) err(id + " : recette secrète absente de la liste des secrets");
for (const id in D.EVENTS) if (!I[id]) err("événement pour objet inconnu " + id);

/* ---------------------------------------------------------- atteignabilité */
const have = new Set();       // objets obtenus au moins une fois
const zones = new Set(["lisiere"]);
const flags = new Set();
const gestes = new Set(["assembler", "tresser", "tailler"]);
let heat = 0;
const lvl = {};
const order = [];
let changed = true;
while (changed) {
  changed = false;
  // ressources des zones ouvertes
  for (const z of D.ZONES) {
    if (!zones.has(z.id)) continue;
    z.res.forEach((r) => { if (!have.has(r)) { have.add(r); changed = true; } });
    z.exps.forEach((x) => {
      if (x.need && !have.has(x.need)) return;
      if (x.cost && !Object.keys(x.cost).every((i) => have.has(i))) return;
      const rw = x.rw || {};
      if (rw.item) for (const i in rw.item) if (!have.has(i)) { have.add(i); changed = true; }
      if (rw.flag && !flags.has(rw.flag)) { flags.add(rw.flag); changed = true; }
    });
  }
  if (flags.has("caveau") && !zones.has("caveau")) { zones.add("caveau"); changed = true; }
  if (have.has("radiotelescope") && !have.has("signal_brut")) { have.add("signal_brut"); changed = true; }
  if (have.has("flute") && flags.has("caveau") && !gestes.has("accorder")) { gestes.add("accorder"); changed = true; }
  // les ressources que seul un extracteur récolte (uranium, galène) : une fois l’extracteur fabriqué, dans une terre ouverte
  for (const id in I) {
    const it = I[id];
    if (it.t !== "ext" || !have.has(id) || !(it.zs || [it.z]).some((z) => zones.has(z))) continue;
    for (const r in it.p) if (!have.has(r)) { have.add(r); changed = true; }
  }
  for (const id in I) {
    const it = I[id];
    if (!it.r || have.has(id)) continue;
    const [g, ing, , o = {}] = it.r;
    if (!gestes.has(g)) continue;
    if (o.heat && heat < o.heat) continue;
    if (o.lvl && (lvl[g] || 0) < o.lvl) continue;
    if (!Object.keys(ing).every((i) => have.has(i))) continue;
    have.add(id); order.push(id); changed = true;
    const e = it.e || {};
    if (e.zone) zones.add(e.zone);
    if (e.st) e.st.forEach((s) => {
      gestes.add(s.g);
      if (s.g === "chauffer") heat = Math.max(heat, s.heat || 0);
      lvl[s.g] = Math.max(lvl[s.g] || 0, s.lvl || 1);
    });
  }
}
for (const id in I) if (!have.has(id) && !I[id].curio && !I[id].old) err("inatteignable : " + id);
for (const pid in D.PROJECTS) D.PROJECTS[pid].steps.forEach((s) => { if (s.cost) for (const i in s.cost) if (!have.has(i)) err("œuvre " + pid + " : " + i + " inatteignable"); });

/* l’âge d’une recette ne doit pas être inférieur à celui de ses ingrédients */
for (const id in I) {
  const it = I[id];
  if (!it.r || it.sec || it.path) continue;
  for (const i in it.r[1]) if (I[i].a > it.a && !I[i].sec && !I[i].path) warn(id + " (âge " + it.a + ") utilise " + i + " (âge " + I[i].a + ")");
}

const nRecipes = Object.values(I).filter((it) => it.r).length;
console.log("Objets : " + Object.keys(I).length + " · recettes : " + nRecipes + " · zones : " + D.ZONES.length +
  " · fragments : " + Object.keys(D.FRAGS).length + " · secrets : " + D.SECRETS.length);
warns.forEach((w) => console.log("  ⚠ " + w));
if (errors.length) {
  errors.forEach((e) => console.log("  ✗ " + e));
  console.log(errors.length + " erreur(s).");
  process.exit(1);
}
console.log("✓ Contenu valide.");
