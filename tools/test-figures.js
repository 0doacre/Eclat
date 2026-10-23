#!/usr/bin/env node
/* Tests des Figures du Cosmos : positions, nombre d'étoiles, rien de spoilé. */
"use strict";
const assert = require("assert");
const D = require("../js/data.js");
const { createEngine } = require("../js/engine.js");
const Fig = require("../js/constellations.js");
const { signeSVG } = require("../js/signes.js");

let T = 3e12, passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log("  ✓ " + name); }
  catch (e) { console.log("  ✗ " + name + "\n    " + (e.stack || e)); process.exitCode = 1; }
}
const mk = () => createEngine({ now: () => T, rand: () => 0.99 });
const TXT = { pale: "pâle", compris: "compris : {mot}", inconnu: "pas compris" };
const rendre = (data) => Fig.render(Fig.layout(data), { signeSVG, txt: TXT });
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

console.log("Figures du Cosmos");
test("partie neuve : une étoile pâle pour le premier lieu repéré, aucun signe", () => {
  const E = mk();
  const f = E.figures();
  assert.deepStrictEqual(f.signes, []);
  assert.strictEqual(f.stars.length, 1);
  assert.strictEqual(f.stars[0].etat, "pale");
  assert.strictEqual(f.stars[0].z, "lisiere");
});
test("nombre d'étoiles = fragments trouvés + lieux repérés ; un fragment non trouvé et non repéré est absent", () => {
  const E = mk();
  E.state.exp.done.lisiere = 1;
  E.state.frags.chene2 = 1;
  E.state.frags.promethee = 1; // archivé : pas d'étoile
  const f = E.figures();
  const trouves = E.visibleFrags().filter((id) => E.state.frags[id]);
  const reperes = f.stars.filter((s) => s.etat === "pale");
  assert.strictEqual(f.stars.filter((s) => s.etat === "allumee").length, trouves.length);
  assert.strictEqual(f.stars.length, trouves.length + reperes.length);
  assert.ok(f.stars.some((s) => s.id === "chene2" && s.etat === "allumee"));
  assert.ok(f.stars.some((s) => s.id === "grotte2" && s.etat === "pale"), "le lieu suivant est repéré");
  assert.ok(!f.stars.some((s) => s.id === "cercle"), "un lieu caché ne se devine pas");
  assert.ok(!f.stars.some((s) => s.id === "poings" || s.id === "tumulus2"), "une terre fermée n'a pas d'étoile");
  assert.ok(!f.stars.some((s) => s.id === "promethee"), "archivé");
  // une terre de plus
  E.state.zones.plaine = true;
  const g = E.figures();
  assert.strictEqual(g.stars.length, f.stars.length + 1);
});
test("pas de texte, pas de nom pour une étoile pâle", () => {
  const E = mk();
  const f = E.figures();
  const s = f.stars[0];
  assert.deepStrictEqual(Object.keys(s).sort(), ["etat", "id", "rang", "z"]);
  const nom = D.FRAGS[s.id].n;
  const html = rendre(f);
  assert.ok(!html.includes(nom), "le nom du fragment ne sort pas");
  assert.ok(!JSON.stringify(f).includes(D.FRAGS[s.id].t.slice(0, 30)), "ni son texte");
  const E2 = mk();
  E2.state.exp.done.lisiere = 1; E2.state.frags.chene2 = 1;
  const f2 = E2.figures();
  f2.stars.forEach((x) => assert.ok(!("t" in x) && !("lore" in x), "aucun texte de fragment"));
});
test("un signe pas compris : ni mot, ni réponse dans les données de rendu", () => {
  const E = mk();
  E.seeSigne("main", "lisiere");
  E.seeSigne("machine", "lisiere");
  E.state.signes.machine.lu = true;
  const f = E.figures();
  const main = f.signes.find((s) => s.id === "main"), machine = f.signes.find((s) => s.id === "machine");
  assert.deepStrictEqual(Object.keys(main).sort(), ["h", "id", "lieux", "lu"]);
  assert.strictEqual(machine.mot, "machine");
  const def = D.RECIT.signes.main;
  const lay = Fig.layout(f);
  const sMain = lay.signes.find((s) => s.id === "main");
  assert.strictEqual(sMain.mot, "");
  const json = JSON.stringify(lay) + JSON.stringify(f);
  assert.ok(!json.includes(def.m), "le mot brouillé non plus");
  def.ok.forEach((h) => assert.ok(!json.includes(h), "ni les empreintes des réponses"));
  const html = Fig.render(lay, { signeSVG, txt: TXT });
  assert.ok(html.includes('data-s="main"') && html.includes('data-s="machine"'));
  assert.ok(html.includes("compris : machine"));
  assert.ok(!html.includes("compris : main") && !html.includes(">main<"));
  assert.strictEqual((html.match(/fig-mot/g) || []).length, 1, "un seul mot : celui du signe compris");
});
test("positions stables : mêmes données, mêmes positions ; un ajout ne déplace pas ce qui est là", () => {
  const E = mk();
  E.state.exp.done.lisiere = 1; E.state.frags.chene2 = 1; E.state.zones.plaine = true;
  const a = Fig.layout(E.figures()), b = Fig.layout(E.figures());
  assert.deepStrictEqual(a, b);
  const avant = {};
  a.zones.forEach((Z) => Z.stars.forEach((s) => { avant[s.id] = [s.x, s.y]; }));
  E.state.frags.grotte2 = 1; E.state.exp.done.lisiere = 2;
  const c = Fig.layout(E.figures());
  c.zones.forEach((Z) => Z.stars.forEach((s) => { if (avant[s.id]) assert.deepStrictEqual([s.x, s.y], avant[s.id], s.id); }));
  // le hash ne dépend que de l'identifiant
  assert.strictEqual(Fig.hash("chene2"), Fig.hash("chene2"));
  assert.notStrictEqual(Fig.hash("chene2"), Fig.hash("grotte2"));
});
test("tout est affiché : jamais de chevauchement gênant, dans les 320 px", () => {
  // le ciel le plus chargé : tous les fragments visibles trouvés, tous les signes vus, tous compris
  const E = mk();
  const stars = [];
  const cpt = {};
  E.visibleFrags().forEach((f) => { const z = D.FRAGS[f].z; cpt[z] = cpt[z] === undefined ? 0 : cpt[z] + 1; stars.push({ id: f, z, etat: "allumee", rang: cpt[z], n: "x" }); });
  const signes = Object.keys(D.RECIT.signes).map((id, i) => ({ id, h: D.RECIT.signes[id].h, lu: i % 2 === 0, mot: D.RECIT.signes[id].mot, lieux: ["l" + (i % 4)] }));
  const lay = Fig.layout({ stars, signes, noms: {} });
  const pts = [];
  lay.zones.forEach((Z) => Z.stars.forEach((s) => pts.push(s)));
  assert.strictEqual(pts.length, stars.length);
  for (let i = 0; i < pts.length; i++) {
    assert.ok(pts[i].x >= 22 && pts[i].x <= 298 && pts[i].y >= 22 && pts[i].y <= lay.hZones - 22, pts[i].id + " dans le cadre");
    for (let j = i + 1; j < pts.length; j++) assert.ok(dist(pts[i], pts[j]) >= 40, pts[i].id + " / " + pts[j].id + " : " + dist(pts[i], pts[j]).toFixed(1));
  }
  const sg = lay.signes;
  assert.strictEqual(sg.length, signes.length);
  for (let i = 0; i < sg.length; i++) {
    assert.ok(sg[i].x >= 46 && sg[i].x <= 274 && sg[i].y <= lay.hSignes - 30);
    for (let j = i + 1; j < sg.length; j++) assert.ok(dist(sg[i], sg[j]) >= 80, sg[i].id + " / " + sg[j].id);
  }
});
test("les signes vus au même endroit se rapprochent", () => {
  const h = [1, 2, 3];
  const mkS = (id, lieux) => ({ id, h, lu: false, lieux });
  const ids = ["a", "b", "c", "d", "e", "f"];
  // sans lien : six isolés ; avec un lieu commun entre a et f : ils deviennent voisins dans la grille
  const sans = Fig.layout({ stars: [], signes: ids.map((i) => mkS(i, ["l-" + i])) });
  const avec = Fig.layout({ stars: [], signes: ids.map((i) => mkS(i, i === "a" || i === "f" ? ["commun"] : ["l-" + i])) });
  const d = (lay) => { const m = {}; lay.signes.forEach((s) => { m[s.id] = s; }); return dist(m.a, m.f); };
  assert.ok(d(avec) <= d(sans), "plus proches ou égaux");
  assert.ok(d(avec) < 130, "voisins : " + d(avec).toFixed(0));
  assert.strictEqual(avec.liens.length, 1);
});
test("le rendu : des boutons (clavier), des cibles, rien de vivant", () => {
  const E = mk();
  E.seeSigne("main", "lisiere");
  const html = rendre(E.figures());
  assert.ok(/<button type="button" class="fig-star pale"/.test(html));
  assert.ok(/<button type="button" class="fig-signe pale"/.test(html));
  assert.ok(/data-fgz="lisiere"/.test(html));
  assert.ok(!/<canvas/.test(html));
  assert.ok(!html.includes("—"));
});

console.log(passed + " tests de figures réussis" + (process.exitCode ? ", des échecs." : "."));
