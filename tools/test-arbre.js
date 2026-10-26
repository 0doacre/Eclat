#!/usr/bin/env node
/* Tests de l’arbre des connaissances (js/arbre.js) : ce qui se voit, rien de plus ; positions stables. */
"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const D = require("../js/data.js");
const { createEngine } = require("../js/engine.js");
const Arb = require("../js/arbre.js");

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log("  ✓ " + name); }
  catch (e) { console.log("  ✗ " + name + "\n    " + (e.stack || e)); process.exitCode = 1; }
}
const I = D.ITEMS;
const FIX = path.join(__dirname, "fixtures");
const mk = () => createEngine({ now: () => 3e12, rand: () => 0.5 });
function charge(f) { const E = mk(); E.load(fs.readFileSync(path.join(FIX, f), "utf8")); return E; }
function avancee() { const E = charge("save-v5-age8-usine.json"); E.state.intu = 1e6; E.studyAll(); return E; }
function tout(E) {
  const g = Arb.graphe(E, D), lay = Arb.mise_en_page(g, D);
  // l’icône du test écrit l’identifiant et le nom : s’ils fuient, on le voit
  const html = Arb.rendu(lay, { icon: (id) => '<i data-ic="' + id + '">' + I[id].n + "</i>", esc: (s) => String(s), txt: { fantome: "pas trouvée" } });
  return { g, lay, html };
}
/* un objet dont la joueuse n’a jamais rien su */
const inconnu = (E, id) => !E.state.known[id] && !E.state.seen[id];
function sansFuite(E) {
  const { g, lay, html } = tout(E);
  const data = JSON.stringify(g) + JSON.stringify(lay);
  for (const id in I) {
    if (!inconnu(E, id)) continue;
    assert.ok(!data.includes('"' + id + '"'), "l’id d’un objet inconnu apparaît dans les données : " + id);
    assert.ok(!html.includes('"' + id + '"'), "l’id d’un objet inconnu apparaît dans le rendu : " + id);
    assert.ok(!html.includes(">" + I[id].n + "<"), "le nom d’un objet inconnu apparaît : " + I[id].n);
  }
  g.noeuds.filter((n) => n.etat === "fantome").forEach((n, i) => {
    assert.deepStrictEqual(Object.keys(n).sort(), ["age", "cle", "etat", "objectif"], "un fantôme ne porte rien d’autre");
    assert.ok(/^f\d+$/.test(n.cle), "identifiant anonyme");
  });
  const cles = {};
  g.noeuds.forEach((n) => { cles[n.cle] = n; });
  g.traits.forEach((t) => assert.ok(cles[t.de] && cles[t.a], "un trait vers un nœud absent"));
  g.noeuds.forEach((n) => {
    assert.ok(n.age <= Math.min(E.state.age + 1, D.AGES.length - 1), "rien au-delà de l’âge suivant");
    if (n.id) { const it = I[n.id]; assert.ok(!((it.sec || it.t === "curio" || it.t === "relic") && !E.state.known[n.id]), "un objet secret, une curiosité ou une relique inconnus ne se montrent pas"); }
  });
  return { g, lay, html };
}

console.log("Arbre des connaissances");
test("partie neuve : presque rien, aucun nom ni identifiant d’objet inconnu", () => {
  const E = mk();
  const { g } = sansFuite(E);
  assert.ok(g.noeuds.filter((n) => n.etat === "fantome").length <= 1, "seulement le fantôme de l’objectif");
  assert.strictEqual(g.compte, 0);
});
test("partie avancée, tout étudié : aucune fuite, aucun secret ni curiosité inconnus", () => {
  const E = avancee();
  const { g } = sansFuite(E);
  assert.ok(g.noeuds.some((n) => n.etat === "allume"));
  assert.ok(g.noeuds.filter((n) => n.etat === "fantome").length > 1);
});
test("fantômes : seulement l’objectif tant que rien n’est étudié ; jamais une recette « possible »", () => {
  const E = charge("save-v5-age8-usine.json");
  E.state.studied = {};
  const g = Arb.graphe(E, D);
  const f = g.noeuds.filter((n) => n.etat === "fantome");
  assert.ok(f.length <= 1);
  f.forEach((n) => assert.ok(n.objectif));
});
test("fantômes : chacun part d’une ressource étudiée, autant que ses recettes cachées (au plus E.reactions)", () => {
  const E = avancee();
  const g = Arb.graphe(E, D), obj = {};
  g.noeuds.forEach((n) => { if (n.objectif) obj[n.cle] = 1; });
  const parSource = {};
  g.traits.filter((t) => t.pointille && !obj[t.a]).forEach((t) => {
    assert.ok(E.state.studied[t.de], "un fantôme sur une ressource non étudiée : " + t.de);
    parSource[t.de] = (parSource[t.de] || 0) + 1;
  });
  g.noeuds.filter((n) => n.etude).forEach((n) => {
    const r = E.reactions(n.id), tot = Object.values(r).reduce((s, x) => s + x, 0);
    assert.strictEqual(parSource[n.id] || 0, n.etude, "la pastille dit le nombre de fantômes");
    assert.ok(n.etude <= tot);
  });
  // une ressource étudiée de plus ajoute ses fantômes, une non étudiée n’en a aucun
  const E2 = charge("save-v5-age8-usine.json");
  E2.state.studied = {};
  const x = Object.keys(E2.state.seen).find((id) => E2.usesLeft(id) > 0 && !I[id].sec);
  E2.state.studied[x] = 1;
  const g2 = Arb.graphe(E2, D);
  assert.ok(g2.traits.filter((t) => t.pointille && t.de === x).length > 0);
  assert.ok(g2.traits.filter((t) => t.pointille).every((t) => t.de === x || g2.noeuds.find((n) => n.cle === t.a).objectif));
});
test("un fantôme et un nœud allumé du même âge ont le même gabarit", () => {
  const { lay, html } = tout(avancee());
  const f = lay.noeuds.find((n) => n.etat === "fantome");
  const a = lay.noeuds.find((n) => n.etat === "allume" && n.age === f.age) || lay.noeuds.find((n) => n.etat === "allume");
  assert.strictEqual(f.w, a.w); assert.strictEqual(f.h, a.h);
  assert.ok(f.w >= 44, "44 px au moins");
  const fb = html.match(/<button[^>]*class="arb-n fantome[^"]*"[^>]*>(.*?)<\/button>/);
  assert.ok(fb && fb[1] === "", "un fantôme est une case vide");
  const styles = html.match(/<button[^>]*class="arb-n[^"]*"[^>]*style="([^"]*)"/g).map((s) => s.match(/style="([^"]*)"/)[1].replace(/[-\d.]+px/g, "N").replace(/#[0-9a-f]+/i, "C"));
  assert.strictEqual(new Set(styles).size, 1, "même style pour tous les nœuds, à la position et à la couleur d’âge près");
});
test("positions stables (un nouveau nœud garde les colonnes et l’ordre des autres) et sans chevauchement", () => {
  const E = charge("save-v5-age8-usine.json");
  const L1 = Arb.mise_en_page(Arb.graphe(E, D), D);
  const cible = Object.keys(I).find((id) => I[id].r && !I[id].path && !I[id].sec && !E.state.known[id] && I[id].a <= E.state.age);
  E.learn(cible);
  E.state.seen[cible] = 1;
  const L2 = Arb.mise_en_page(Arb.graphe(E, D), D);
  const p2 = {};
  L2.noeuds.forEach((n) => { if (n.id) p2[n.id] = n; });
  // une rangée qui se remplit peut pousser une bande vers le haut, mais rien ne change de colonne ni d’ordre
  const vieux = L1.noeuds.filter((n) => n.id);
  vieux.forEach((n) => assert.strictEqual(p2[n.id].x, n.x, n.id));
  for (const a of vieux) for (const b of vieux) if (a.y < b.y) assert.ok(p2[a.id].y < p2[b.id].y, a.id + " passe sous " + b.id);
  assert.ok(p2[cible], "la nouvelle recette apparaît");
  for (const L of [L2, Arb.mise_en_page(Arb.graphe(avancee(), D), D)]) {
    for (let i = 0; i < L.noeuds.length; i++) for (let j = i + 1; j < L.noeuds.length; j++) {
      const a = L.noeuds[i], b = L.noeuds[j];
      assert.ok(Math.abs(a.x - b.x) >= a.w || Math.abs(a.y - b.y) >= a.h + 20, "chevauchement : " + a.cle + " / " + b.cle);
    }
    L.noeuds.forEach((n) => { const b = L.bandes[n.age]; assert.ok(n.y - n.h / 2 >= b.y && n.y + n.h / 2 <= b.y + b.h, "dans sa bande d’âge"); });
  }
});
test("lisible : pas de place pour l’invisible, les âges lointains en un bandeau", () => {
  const E = charge("save-v5-age8-usine.json");
  const g = Arb.graphe(E, D), lay = Arb.mise_en_page(g, D);
  assert.strictEqual(lay.bandes.length, g.max + 1, "une bande par âge visible, pas plus");
  assert.ok(lay.futur && lay.futur.de === g.max + 2 && lay.futur.a === D.AGES.length);
  // aucune rangée vide : chaque rangée d’une bande porte au moins un nœud
  lay.bandes.forEach((b) => {
    const ys = new Set(lay.noeuds.filter((n) => n.age === b.age).map((n) => n.y));
    const rangees = Math.round((b.h - 36) / Arb.PY);
    assert.ok(ys.size >= rangees, "rangée vide dans l’âge " + (b.age + 1));
  });
  assert.ok(lay.h < 3600, "l’arbre d’une partie à l’âge 8 tient en " + lay.h + " px");
  // au dernier âge, plus de bandeau
  const E2 = mk();
  E2.state.age = D.AGES.length - 1;
  assert.strictEqual(Arb.mise_en_page(Arb.graphe(E2, D), D).futur, null);
});
test("un trait qui saute plus d’un âge est caché ; toucher un bout l’allume", () => {
  const E = avancee();
  const g = Arb.graphe(E, D), lay = Arb.mise_en_page(g, D), par = {};
  lay.noeuds.forEach((n) => { par[n.cle] = n; });
  lay.traits.forEach((t) => {
    const saut = Math.abs(par[t.a].age - par[t.de].age);
    assert.strictEqual(t.loin, saut > 1 && !par[t.a].objectif, t.de + " → " + t.a);
  });
  const t = lay.traits.find((x) => x.loin);
  assert.ok(t, "une partie avancée a des traits lointains");
  const L = Arb.liens(lay, t.a);
  assert.ok(L.amont.includes(t.de) && L.traits.includes(lay.traits.indexOf(t)));
  assert.ok(Arb.liens(lay, t.de).aval.includes(t.a));
  const html = Arb.rendu(lay, { esc: String });
  assert.ok(html.includes('class="arb-t loin" data-t="' + lay.traits.indexOf(t) + '"') || html.includes('class="arb-t pointille loin" data-t="' + lay.traits.indexOf(t) + '"'));
});
test("mise en page en moins de 100 ms quand toutes les recettes sont connues", () => {
  const E = mk();
  E.state.age = D.AGES.length - 1;
  for (const id in I) { if (I[id].r) E.state.known[id] = true; E.state.seen[id] = 1; E.state.studied[id] = 1; }
  const t = process.hrtime.bigint();
  const lay = Arb.mise_en_page(Arb.graphe(E, D), D);
  Arb.rendu(lay, { esc: String });
  const ms = Number(process.hrtime.bigint() - t) / 1e6;
  assert.ok(ms < 100, ms + " ms");
  assert.ok(lay.noeuds.length > 150);
});
test("les anciennes sauvegardes se chargent et donnent un arbre", () => {
  for (const f of fs.readdirSync(FIX).filter((x) => /\.json$/.test(x))) {
    const E = charge(f);
    const { g, lay } = sansFuite(E);
    assert.ok(g.noeuds.length > 0 && lay.noeuds.length === g.noeuds.length, f);
  }
});
test("l’empreinte change avec une découverte, pas sans", () => {
  const E = charge("save-v5-age8-usine.json");
  const s1 = Arb.sig(Arb.graphe(E, D));
  assert.strictEqual(Arb.sig(Arb.graphe(E, D)), s1);
  E.learn(Object.keys(I).find((id) => I[id].r && !I[id].path && !I[id].sec && !E.state.known[id] && I[id].a <= E.state.age));
  assert.notStrictEqual(Arb.sig(Arb.graphe(E, D)), s1);
});

/* ---- 0.14.0 : le niveau « loin », les carrefours, la mise en page inchangée ---- */
test("le niveau « loin » compte les recettes trouvées de chaque âge, sans rien dire d’inconnu", () => {
  for (const E of [mk(), avancee(), charge("save-v5-age8-usine.json")]) {
    const g = Arb.graphe(E, D), L = Arb.loin(g, D);
    L.bandes.forEach((b) => {
      const n = g.noeuds.filter((x) => x.age === b.age && x.etat === "allume").length;
      assert.strictEqual(b.trouvees, n, "âge " + b.age);
      assert.deepStrictEqual(Object.keys(b).sort(), ["age", "atteint", "c", "nom", "objectif", "trouvees"], "une bande ne porte que son âge, son nom, sa couleur et son compte");
    });
    const data = JSON.stringify(L);
    for (const id in I) if (inconnu(E, id)) {
      assert.ok(!data.includes('"' + id + '"') && !data.includes('"' + I[id].n + '"'), "un objet inconnu apparaît au niveau loin : " + id);
    }
    assert.strictEqual(L.bandes.length, g.max + 1, "les âges atteints plus un");
    assert.strictEqual(L.bandes[0].age, g.max, "du plus récent au plus ancien");
  }
});
test("les carrefours viennent des données seules, pas de la partie", () => {
  const c = Arb.carrefours(D), s = JSON.stringify(Object.keys(c).sort());
  assert.ok(Object.keys(c).length > 5 && Object.keys(c).length < 80, String(Object.keys(c).length));
  assert.strictEqual(JSON.stringify(Object.keys(Arb.carrefours(D)).sort()), s, "déterministe");
  charge("save-v5-age8-usine.json"); avancee();
  assert.strictEqual(JSON.stringify(Object.keys(Arb.carrefours(D)).sort()), s, "indépendant de la partie");
  for (const id in c) assert.ok(I[id] && !I[id].path, id);
});
test("la mise en page reste stable (empreinte des positions, trois états ; recalée en 0.21 pour l’eau et les polymères)", () => {
  const crypto = require("crypto");
  const { ETATS } = require("./arbre-mesures.js");
  const attendu = { "neuve": "6c2188da81e5 n=1", "avancée": "5b8ff3a319db n=83", "tout connu": "8f3f660389fd n=233" };
  for (const n of Object.keys(attendu)) {
    const lay = Arb.mise_en_page(Arb.graphe(ETATS[n](), D), D);
    const s = lay.noeuds.map((x) => [x.age, x.etat, x.x, x.y].join(",")).join(";");
    assert.strictEqual(crypto.createHash("sha256").update(s).digest("hex").slice(0, 12) + " n=" + lay.noeuds.length, attendu[n], n);
  }
});

test("voisinage : ingrédients au-dessus, usages en dessous, sans relations indirectes", () => {
  const E = avancee(), g = Arb.graphe(E, D);
  for (const n of g.noeuds) {
    const v = Arb.voisinage(g, n.cle);
    assert.strictEqual(v.centre, n);
    assert.deepStrictEqual(v.amont.map((x) => x.cle).sort(), [...new Set(g.traits.filter((t) => t.a === n.cle).map((t) => t.de))].sort());
    assert.deepStrictEqual(v.aval.map((x) => x.cle).sort(), [...new Set(g.traits.filter((t) => t.de === n.cle).map((t) => t.a))].sort());
  }
  assert.strictEqual(Arb.voisinage(g, "absent"), null);
});
test("voisinage : une piste garde son anonymat, même dans une partie avancée", () => {
  const g = Arb.graphe(avancee(), D), ns = g.noeuds.filter((n) => n.etat === "fantome");
  assert.ok(ns.length);
  for (const n of ns) {
    const v = Arb.voisinage(g, n.cle);
    assert.strictEqual(v.centre.id, undefined);
    assert.strictEqual(v.centre.n, undefined);
    assert.ok(v.amont.every((p) => g.noeuds.includes(p)));
    assert.ok(v.aval.every((p) => g.noeuds.includes(p)));
  }
});

/* ---- 0.30.0 : le chemin vers une cible (l’échelle des marches) ---- */
test("chemin vers une cible : échelle de la plus profonde à la cible", () => {
  const E = avancee();
  const r = Arb.route(E, D, "scierie", 1);
  assert.ok(r && r.marches.length >= 5, "route de scierie complète");
  assert.strictEqual(r.cible.nom, I.scierie.n);
  assert.strictEqual(r.cible.times, 1);
  const derniere = r.marches[r.marches.length - 1];
  assert.strictEqual(derniere.id, "scierie");
  assert.ok(derniere.isTarget);
  // La première marche est une matière première profonde (sans recette)
  const premiere = r.marches[0];
  assert.strictEqual(premiere.type, "res");
  assert.ok(!I[premiere.id].r);
});

test("chemin : les 4 états (fait, en_cours, a_trouver, bloquee) et leurs actions", () => {
  const E = mk();
  E.learn("manche");
  E.state.seen.bois = 1;
  // 1. manche sans bois : bois [en_cours, recolter], manche [en_cours, fabriquer]
  let r = Arb.route(E, D, "manche", 1);
  assert.strictEqual(r.marches[0].id, "bois");
  assert.strictEqual(r.marches[0].etat, "en_cours");
  assert.strictEqual(r.marches[0].action, "recolter");
  assert.strictEqual(r.marches[1].id, "manche");
  assert.strictEqual(r.marches[1].etat, "en_cours");
  assert.strictEqual(r.marches[1].action, "fabriquer");
  assert.strictEqual(r.pret, false);

  // 2. avec du bois en stock : bois [fait, recolter], manche [en_cours, fabriquer], pret true
  E.state.inv.bois = 10;
  r = Arb.route(E, D, "manche", 1);
  assert.strictEqual(r.marches[0].etat, "fait");
  assert.strictEqual(r.marches[1].etat, "en_cours");
  assert.strictEqual(r.pret, true);

  // 3. recette bloquée (lingot de bronze au début) : bloquee, avec explication « Requis : ... »
  E.learn("lingot_bronze");
  r = Arb.route(E, D, "lingot_bronze", 1);
  const cibleBloquee = r.marches.find((m) => m.id === "lingot_bronze");
  assert.strictEqual(cibleBloquee.etat, "bloquee");
  assert.strictEqual(cibleBloquee.action, "voir");
  assert.ok(cibleBloquee.requis && cibleBloquee.requis.startsWith("Requis : "), cibleBloquee.requis);

  // 4. recette inconnue : a_trouver, nom « Recette à trouver », anon true, aucun id
  r = Arb.route(E, D, "chariot", 1);
  const cibleInconnue = r.marches[r.marches.length - 1];
  assert.strictEqual(cibleInconnue.etat, "a_trouver");
  assert.strictEqual(cibleInconnue.nom, "Recette à trouver");
  assert.strictEqual(cibleInconnue.ic, "?");
  assert.strictEqual(cibleInconnue.id, undefined);
  assert.strictEqual(cibleInconnue.anon, true);
});

test("chemin : réutilise le Suivi existant (E.setTrack)", () => {
  const E = avancee();
  assert.strictEqual(Arb.route(E, D, "chariot", 1).suivi, false);
  E.setTrack("chariot");
  assert.strictEqual(Arb.route(E, D, "chariot", 1).suivi, true);
  E.setTrack(null);
  assert.strictEqual(Arb.route(E, D, "chariot", 1).suivi, false);
});

test("chemin : règle absolue d’anonymat sur toutes les cibles possibles", () => {
  const E = mk();
  for (const id in I) {
    const r = Arb.route(E, D, id, 1);
    assert.ok(r, id);
    const data = JSON.stringify(r);
    for (const x in I) {
      if (!inconnu(E, x)) continue;
      assert.ok(!data.includes('"' + x + '"'), "l'id d'un objet inconnu apparaît dans la route : " + x + " pour cible " + id);
      assert.ok(!data.includes('"' + I[x].n + '"'), "le nom d'un objet inconnu apparaît dans la route : " + I[x].n + " pour cible " + id);
    }
  }
});

test("portée : qualification d’un nœud (pret, presque, bloque)", () => {
  const E = mk();

  // 1. Un fantôme est toujours bloqué
  assert.strictEqual(Arb.portee({ etat: "fantome" }, E, D), "bloque");

  // 2. Ressource brute sans recette
  // Avec stock -> pret
  E.state.inv.bois = 5;
  assert.strictEqual(Arb.portee({ etat: "vu", id: "bois" }, E, D), "pret");
  // Sans stock mais zone ouverte -> presque
  E.state.inv.bois = 0;
  assert.strictEqual(Arb.portee({ etat: "vu", id: "bois" }, E, D), "presque");
  // Sans stock et zone fermée -> bloque
  assert.strictEqual(Arb.portee({ etat: "vu", id: "or_pepite" }, E, D), "bloque");

  // 3. Recette de craft
  // Ingrédients manquants mais tous connus et récoltables en zone ouverte -> presque
  E.learn("manche");
  E.state.inv.bois = 0;
  assert.strictEqual(Arb.portee({ etat: "allume", id: "manche" }, E, D), "presque");

  // Ingrédients réunis dans la Réserve -> pret
  E.state.inv.bois = 10;
  assert.strictEqual(Arb.portee({ etat: "allume", id: "manche" }, E, D), "pret");

  // Recette bloquée par sous-recette inconnue -> bloque
  E.learn("archet");
  delete E.state.known.corde;
  assert.strictEqual(Arb.portee({ etat: "allume", id: "archet" }, E, D), "bloque");

  // Recette bloquée par manque de station / chaleur -> bloque
  E.learn("lingot_bronze");
  assert.strictEqual(Arb.portee({ etat: "allume", id: "lingot_bronze" }, E, D), "bloque");

  // Objet unique déjà fabriqué -> bloque
  E.learn("feu");
  E.state.made.feu = 1;
  assert.strictEqual(Arb.portee({ etat: "allume", id: "feu" }, E, D), "bloque");
});

test("portée : cohérence globale sur une partie avancée et sans fuite", () => {
  const E = avancee();
  const g = Arb.graphe(E, D);
  const counts = { pret: 0, presque: 0, bloque: 0 };
  for (const n of g.noeuds) {
    const p = Arb.portee(n, E, D);
    assert.ok(["pret", "presque", "bloque"].includes(p), "valeur de portée valide : " + p);
    counts[p]++;
  }
  assert.ok(counts.pret > 0, "il y a des recettes prêtes");
  assert.ok(counts.bloque > 0, "il y a des recettes bloquées (uniques faites, fantôme)");
  assert.strictEqual(counts.pret + counts.presque + counts.bloque, g.noeuds.length, "tous les nœuds sont classés");
});

console.log(passed + " tests de l’arbre réussis" + (process.exitCode ? ", des échecs." : "."));
