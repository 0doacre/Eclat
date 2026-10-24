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
test("positions stables (un nouveau nœud ne déplace pas les autres) et sans chevauchement", () => {
  const E = charge("save-v5-age8-usine.json");
  const L1 = Arb.mise_en_page(Arb.graphe(E, D), D);
  const cible = Object.keys(I).find((id) => I[id].r && !I[id].path && !I[id].sec && !E.state.known[id] && I[id].a <= E.state.age);
  E.learn(cible);
  E.state.seen[cible] = 1;
  const L2 = Arb.mise_en_page(Arb.graphe(E, D), D);
  const p2 = {};
  L2.noeuds.forEach((n) => { if (n.id) p2[n.id] = n; });
  L1.noeuds.filter((n) => n.id).forEach((n) => { assert.strictEqual(p2[n.id].x, n.x, n.id); assert.strictEqual(p2[n.id].y, n.y, n.id); });
  assert.ok(p2[cible], "la nouvelle recette apparaît");
  for (const L of [L2, Arb.mise_en_page(Arb.graphe(avancee(), D), D)]) {
    for (let i = 0; i < L.noeuds.length; i++) for (let j = i + 1; j < L.noeuds.length; j++) {
      const a = L.noeuds[i], b = L.noeuds[j];
      assert.ok(Math.abs(a.x - b.x) >= a.w || Math.abs(a.y - b.y) >= a.h + 20, "chevauchement : " + a.cle + " / " + b.cle);
    }
    L.noeuds.forEach((n) => { const b = L.bandes[n.age]; assert.ok(n.y - n.h / 2 >= b.y && n.y + n.h / 2 <= b.y + b.h, "dans sa bande d’âge"); });
  }
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

console.log(passed + " tests de l’arbre réussis" + (process.exitCode ? ", des échecs." : "."));
