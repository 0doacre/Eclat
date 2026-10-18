#!/usr/bin/env node
/* Tests du moteur : mécaniques de base, secrets, chemin caché, fins, sauvegarde. */
"use strict";
const assert = require("assert");
const D = require("../js/data.js");
const fs = require("fs");
const path = require("path");
const { createEngine, migrate, SAVE_VERSION } = require("../js/engine.js");
const fixture = (f) => fs.readFileSync(path.join(__dirname, "fixtures", f), "utf8");

let T = 1e12;
const mk = () => createEngine({ now: () => T, rand: () => 0.99 });
let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log("  ✓ " + name); }
  catch (e) { console.log("  ✗ " + name + "\n    " + (e.stack || e)); process.exitCode = 1; }
}
/* donne tout ce qu’il faut pour fabriquer `id` (récursivement, en trichant sur les matières premières) */
function force(E, id, n) {
  const it = D.ITEMS[id];
  for (const i in it.r[1]) E.add(i, it.r[1][i] * (n || 1) * 10);
  const r = E.craft(id, n || 1);
  assert.ok(r.ok, "fabrication de " + id + " : " + JSON.stringify(r));
}
const run = (E, s) => { for (let i = 0; i < s * 10; i++) { T += 100; E.update(); } };
function stations(E, list) { list.forEach((s) => { E.add(s, 1); E.state.made[s] = 1; }); E.recalc(); }

console.log("Moteur");
test("récolte et rendement de base", () => {
  const E = mk();
  assert.strictEqual(E.tap("bois"), 1);
  assert.strictEqual(E.tap("os"), 0, "zone fermée");
  assert.strictEqual(E.count("bois"), 1);
});
test("tentative : fabrication, apprentissage, échec", () => {
  const E = mk();
  for (let i = 0; i < 3; i++) E.tap("bois");
  const r = E.attempt("tailler", ["bois"]);
  assert.strictEqual(r.kind, "craft"); assert.strictEqual(r.id, "manche"); assert.ok(r.fresh);
  assert.strictEqual(E.count("manche"), 1);
  assert.strictEqual(E.state.intu, 4, "+1 intuition à la découverte");
  const l = E.attempt("tresser", ["fibre"]);
  assert.strictEqual(l.kind, "learn"); assert.deepStrictEqual(l.missing, { fibre: 3 });
  assert.ok(E.state.known.corde);
  const f = E.attempt("tresser", ["caillou"]);
  assert.strictEqual(f.kind, "fail");
});
test("thermomètre : mauvais geste / ingrédient manquant", () => {
  const E = mk();
  ["bois", "fibre", "caillou", "manche", "corde"].forEach((i) => (E.state.seen[i] = true));
  assert.strictEqual(E.temperature("tailler", ["fibre"]).why, "geste", "fibres + tresser = corde");
  assert.strictEqual(E.temperature("assembler", ["manche"]).temp, 3, "archet : il manque la corde");
  assert.strictEqual(E.temperature("tresser", ["bois"]).why, "geste", "le manche (tailler + bois) est encore inconnu");
  E.state.known.manche = true;
  assert.strictEqual(E.temperature("tresser", ["bois"]).temp, 0);
});
test("chaleur insuffisante = Brûlant, recette notée", () => {
  const E = mk();
  stations(E, ["feu"]);
  E.state.seen.malachite = E.state.seen.charbon = true;
  const r = E.attempt("chauffer", ["malachite", "charbon"]);
  assert.strictEqual(r.kind, "blocked"); assert.strictEqual(r.info.heat, 1100);
  assert.ok(E.state.known.lingot_cuivre);
});
test("objets uniques et zones", () => {
  const E = mk();
  stations(E, ["feu"]);
  force(E, "epieu");
  assert.ok(E.zoneOpen("plaine"));
  assert.strictEqual(E.craft("epieu").why, "owned");
});
/* pose une cabane sur le gisement de bois de la Lisière et la relie à la Réserve */
function cabane(E) {
  const d = E.deposits().find((x) => x.res === "bois");
  assert.ok(E.fabPlaceExt(d.x, d.y, "cabane").ok);
  assert.ok(E.fabLink(d.x, d.y).ok);
  return E.fabCell(d.x, d.y);
}
test("extracteurs : coût croissant, posés sur un gisement, reliés à la Réserve", () => {
  const E = mk();
  const c0 = E.costFor("cabane").fibre;
  force(E, "cabane");
  assert.ok(E.costFor("cabane").fibre > c0);
  const b = E.count("bois");
  T += 4000; E.update();
  assert.strictEqual(E.count("bois"), b, "rangée dans le stock, une cabane ne récolte rien");
  const d = E.deposits().find((x) => x.res === "bois");
  E.fabPlaceExt(d.x, d.y, "cabane");
  const e = E.fabCell(d.x, d.y);
  T += 1000; E.update();
  assert.strictEqual(E.machInfo(e.id).s, "noout", "rien ne sort sans tapis");
  assert.ok(E.fabLink(d.x, d.y).ok);
  T += 100; E.update();
  const b1 = E.count("bois");
  T += 4000; E.update();
  assert.ok(Math.abs(E.count("bois") - b1 - 4 * 1.2) < 0.01, "une cabane sur le bois : 0,4 × 3 matières = 1,2/s");
  assert.ok(E.state.flags.extDone);
  assert.ok(Math.abs(E.rate("bois") - 1.2) < 1e-9);
});
test("gisements : récolte à la main, règles de pose", () => {
  const E = mk();
  const ds = E.deposits();
  assert.deepStrictEqual(ds.map((d) => d.res).sort(), ["bois", "caillou", "charbon", "fibre"], "la Lisière seule au départ");
  const bois = ds.find((d) => d.res === "bois"), charbon = ds.find((d) => d.res === "charbon");
  assert.strictEqual(E.tapDeposit(bois.x, bois.y), 1);
  assert.strictEqual(E.count("bois"), 1);
  assert.strictEqual(E.tapDeposit(charbon.x, charbon.y), 0, "le charbon ne se ramasse pas à la main");
  assert.strictEqual(E.fabExtWhy(bois.x, bois.y, "cabane"), "noext");
  E.add("cabane", 2); E.add("charbonniere", 1);
  assert.strictEqual(E.fabExtWhy(bois.x, bois.y, "charbonniere"), "wrongext");
  assert.strictEqual(E.fabExtWhy(0, 4, "cabane"), "nodep");
  assert.ok(E.fabPlaceExt(charbon.x, charbon.y, "charbonniere").ok);
  const e = E.fabPlaceExt(bois.x, bois.y, "cabane").e;
  E.fabSetExt(e.id, "cabane", 5);
  assert.strictEqual(e.u.cabane, 2, "pas plus que les cabanes possédées");
  assert.strictEqual(E.extUnits().cabane.used, 2);
  E.state.zones.plaine = true;
  assert.ok(E.deposits().some((d) => d.res === "os"), "chaque terre ouverte apporte sa parcelle");
  assert.ok(E.fabR() >= 12, "la carte s’agrandit");
});
test("le tracé automatique évite les gisements et rejoint un tapis existant", () => {
  const E = mk();
  E.add("cabane", 2);
  const ds = E.deposits(), bois = ds.find((d) => d.res === "bois"), fibre = ds.find((d) => d.res === "fibre");
  E.fabPlaceExt(bois.x, bois.y, "cabane");
  const r1 = E.fabLink(bois.x, bois.y);
  assert.ok(r1.ok && r1.n > 0);
  for (const k in E.state.fab.c) { const [x, y] = k.split(",").map(Number); if (E.state.fab.c[k].k === "belt") assert.ok(!E.deposit(x, y), "pas de tapis sur un gisement"); }
  E.fabPlaceExt(fibre.x, fibre.y, "cabane");
  const before = Object.keys(E.state.fab.c).length;
  assert.ok(E.fabLink(fibre.x, fibre.y).ok);
  const g = E.fabGraph();
  assert.ok(g.prods[E.fabCell(fibre.x, fibre.y).id].t.res, "la fibre arrive à la Réserve");
  assert.ok(Object.keys(E.state.fab.c).length - before <= r1.n, "le second tracé profite du premier");
});
test("un extracteur nourrit directement une machine", () => {
  const E = mk();
  E.add("cabane", 1); E.add("automate_bois", 1); E.state.known.manche = true;
  const bois = E.deposits().find((d) => d.res === "bois");
  E.fabPlaceExt(bois.x, bois.y, "cabane");
  E.fabSetExt(E.fabCell(bois.x, bois.y).id, "cabane", 1);
  // le tapis descend de la case du bois et passe contre l’automate avant la Réserve
  E.fabDraw([{ x: bois.x, y: bois.y + 1, d: 1 }, { x: bois.x, y: bois.y + 2, d: 1 }, { x: bois.x, y: bois.y + 3, d: 1 }, { x: bois.x, y: bois.y + 4, d: 0 }, { x: bois.x + 1, y: bois.y + 4, d: 0 }, { x: bois.x + 2, y: bois.y + 4, d: 1 }, { x: bois.x + 2, y: bois.y + 5, d: 1 }]);
  E.fabSet(E.fabCell(bois.x, bois.y).id, { d: 1 });
  const m = E.fabPlace("mach", bois.x + 1, bois.y + 2, { m: "automate_bois", r: "manche", d: 2 }).e;
  run(E, 60);
  assert.ok(E.state.made.manche >= 5, "des manches, sans passer par le stock : " + E.state.made.manche);
  assert.ok(E.fabDrain().some((f) => f.to === m.id && f.i === "bois" && f.from[0] === "X"));
});
test("maîtrise : chefs-d’œuvre", () => {
  const E = createEngine({ now: () => T, rand: () => 0 });
  E.add("bois", 3000);
  E.craft("manche", 60);
  assert.strictEqual(E.stars("manche"), 2);
  const r = E.craft("manche", 10);
  assert.ok(r.bonus > 0);
});
test("explorations : coût, durée, fragment", () => {
  const E = mk();
  assert.ok(E.startExp("lisiere").ok);
  assert.strictEqual(E.startExp("lisiere").why, "busy");
  T += 16000; E.update();
  assert.ok(E.state.frags.chene);
  assert.strictEqual(E.startExp("lisiere").why, "cost", "la grotte demande une torche");
});
test("hors-ligne : rattrapage plafonné à 12 h", () => {
  const E = mk();
  force(E, "cabane");
  cabane(E);
  T += 100; E.update();
  const b = E.count("bois");
  let off = null;
  E.on("offline", (o) => (off = o));
  T += 48 * 3600 * 1000; E.update();
  assert.ok(off && off.dt === 12 * 3600);
  assert.ok(Math.abs(E.count("bois") - b - 1.2 * 12 * 3600) < 15, "12 h à 1,2 bois/s : " + (E.count("bois") - b));
});
test("sauvegarde : aller-retour et export base64", () => {
  const E = mk();
  E.tap("bois"); E.state.flags.x = 1;
  const s = E.exportSave();
  const E2 = mk();
  E2.importSave(s);
  assert.strictEqual(E2.count("bois"), 1); assert.strictEqual(E2.state.flags.x, 1);
  assert.throws(() => E2.load("{}"));
});


console.log("Sauvegardes (compatibilité)");
test("les sauvegardes v1, v2, v3 et v4 se chargent sans rien perdre", () => {
  for (const f of fs.readdirSync(path.join(__dirname, "fixtures")).filter((x) => /^save-v[1234]/.test(x))) {
    const raw = fixture(f);
    const old = JSON.parse(raw);
    const E = mk();
    E.load(raw);
    const S = E.state;
    assert.strictEqual(S.v, SAVE_VERSION, f);
    for (const k in old.inv) assert.strictEqual(S.inv[k], old.inv[k], f + " : stock de " + k);
    for (const k in old.known) assert.ok(S.known[k], f + " : recette " + k);
    for (const k in old.made) assert.strictEqual(S.made[k], old.made[k], f + " : fabriqué " + k);
    assert.strictEqual(S.age, old.age); assert.strictEqual(S.intu, old.intu);
    assert.deepStrictEqual(S.zones, old.zones); assert.deepStrictEqual(S.frags, old.frags);
    assert.strictEqual(S.flags.news, "5", "annonce des nouveautés");
    assert.strictEqual(raw, fixture(f), "la chaîne d’origine n’est pas modifiée");
    T += 5000; E.update(); // le jeu tourne
  }
});
const machs = (E) => Object.values(E.state.fab.c).filter((e) => e.k === "mach");
test("les chaînes d’assemblage v1 deviennent des machines de l’usine", () => {
  const E = mk();
  E.load(fixture("save-v1-age10-chaines.json"));
  assert.deepStrictEqual(machs(E).map((e) => [e.r, e.m, e.n]).sort(), [["bobine", "chaine", 1], ["plaque_fer", "chaine", 1]]);
  assert.ok(E.state.auto === undefined && E.state.lines === undefined);
  const before = E.count("plaque_fer");
  for (let i = 0; i < 20; i++) { T += 100; E.update(); }
  assert.ok(E.count("plaque_fer") > before, "la machine produit");
});
test("les lignes v2 deviennent des machines le long d’un tapis", () => {
  const raw = fixture("save-v2-age7-fabrique.json");
  const old = JSON.parse(raw);
  const E = mk();
  E.load(raw);
  const got = machs(E).map((e) => [e.r, e.m, e.n, e.on, e.cap]).sort();
  const want = old.lines.map((L) => [L.r, L.m, L.n, L.on, L.cap]).sort();
  assert.deepStrictEqual(got, want, "réglages conservés");
  assert.deepStrictEqual(E.state.flags.fab3, { placed: 5, left: 0 });
  const g = E.fabGraph();
  machs(E).forEach((e) => assert.ok((g.sup[e.id] || []).some((p) => p[0] === "P"), e.r + " est alimentée par la sortie"));
  machs(E).forEach((e) => assert.ok(g.prods[e.id].t.res, e.r + " renvoie vers la Réserve"));
  // le fil de cuivre passe avant… rien ne le consomme ici, mais l’ordre suit le tapis
  E.add("bois", 100); E.add("plaque_cuivre", 50); E.add("lingot_fer", 50);
  const b = { fil: E.count("fil_cuivre"), clous: E.count("clous"), manche: E.count("manche") };
  for (let i = 0; i < 300; i++) { T += 100; E.update(); }
  assert.ok(E.count("fil_cuivre") > b.fil && E.count("clous") > b.clous && E.count("manche") > b.manche, "tout produit");
  assert.strictEqual(E.machInfo(machs(E).find((e) => e.r === "corde").id).s, "off");
});
test("v4 : les extracteurs d’avant sont posés, reliés, et produisent autant", () => {
  for (const f of ["save-v1-age7.json", "save-v1-age10-chaines.json", "save-v2-age7-fabrique.json", "save-v3-age7-usine.json"]) {
    const raw = fixture(f), old = JSON.parse(raw);
    const E = mk();
    E.load(raw);
    const S = E.state, info = S.flags.fab4;
    const owned = E.EXTS.reduce((a, t) => a + Math.floor(old.inv[t] || 0), 0);
    assert.strictEqual(info.placed, owned, f + " : tous posés");
    assert.strictEqual(info.linked, info.sites, f + " : tous reliés");
    // production totale : celle d’avant (extracteurs « tout seuls »), à 10 % près
    let before = 0;
    E.EXTS.forEach((t) => { const it = D.ITEMS[t]; for (const r in it.p) before += it.p[r] * Math.floor(old.inv[t] || 0); });
    let after = 0;
    for (const k in S.fab.c) { const e = S.fab.c[k]; if (e.k === "ext") for (const t in e.u) after += e.u[t] * E.extRate(t, e.res); }
    assert.ok(Math.abs(after - before) / before < 0.1, f + " : " + before.toFixed(1) + " → " + after.toFixed(1));
    run(E, 2);
    for (const k in S.fab.c) if (S.fab.c[k].k === "ext") assert.strictEqual(E.machInfo(S.fab.c[k].id).s, "ok", f + " : " + k);
  }
});
/* une petite usine : sortie → machine → tapis → Réserve */
function miniUsine(E, r, m) {
  assert.ok(E.fabPlace("port", 2, 0).ok);
  const p = E.fabPlace("mach", 3, 0, { m: m || "automate_bois", r, d: 3 });
  assert.ok(p.ok, JSON.stringify(p));
  E.fabDraw([{ x: 3, y: -1, d: 2 }, { x: 2, y: -1, d: 2 }]);
  return p.e;
}
test("usine : règles de construction", () => {
  const E = mk();
  assert.strictEqual(E.fabPlace("port", 4, 4).why, "port", "une sortie touche la Réserve");
  assert.strictEqual(E.fabPlace("belt", 0, 0, { d: 0 }).why, "res");
  assert.strictEqual(E.fabPlace("mach", 3, 3, { m: "automate_bois" }).why, "nomach", "il faut posséder la machine");
  assert.strictEqual(E.fabPlace("belt", 99, 0, { d: 0 }).why, "out");
  E.add("automate_bois", 1);
  assert.ok(E.fabPlace("mach", 3, 3, { m: "automate_bois" }).ok);
  assert.strictEqual(E.fabPlace("mach", 4, 4, { m: "automate_bois" }).why, "nomach", "une seule machine possédée");
  assert.strictEqual(E.fabPlace("belt", 3, 3, { d: 0 }).why, "taken");
  const p = E.fabPlace("port", -2, 1).e;
  assert.strictEqual(p.d, 2, "la sortie regarde loin de la Réserve");
  E.fabRotate(-2, 1); assert.strictEqual(p.d, 3);
  E.fabRotate(-2, 1); assert.strictEqual(p.d, 1, "jamais vers la Réserve");
});
test("usine : une machine produit, s’arrête au stock visé, réclame ce qui manque", () => {
  const E = mk();
  E.state.age = 3; // des sorties assez rapides pour ne pas la freiner
  E.add("automate_bois", 2); E.state.known.manche = true;
  E.add("bois", 30);
  const m = miniUsine(E, "manche");
  E.fabSet(m.id, { n: 5 });
  assert.strictEqual(m.n, 2, "pas plus que les machines possédées");
  run(E, 30); // 30 s à 12/min
  assert.strictEqual(E.count("manche"), 6);
  assert.ok(E.state.flags.lineDone);
  E.fabSet(m.id, { cap: 7 });
  run(E, 30);
  assert.strictEqual(E.count("manche"), 7); assert.strictEqual(E.machInfo(m.id).s, "cap");
  E.fabSet(m.id, { cap: 0 });
  run(E, 60);
  assert.ok(E.count("bois") < 3); assert.strictEqual(E.machInfo(m.id).s, "starved");
  assert.deepStrictEqual(E.machInfo(m.id).miss, { bois: "stock" });
  E.fabRemove(2, 0);
  run(E, 1);
  assert.deepStrictEqual(E.machInfo(m.id).miss, { bois: "link" }, "plus rien ne l’alimente");
  const bois = E.count("bois");
  E.fabRemove(3, 0);
  assert.ok(E.count("bois") >= bois, "ce qui restait dans la machine revient au stock");
  assert.ok(!E.automatable("feu") && !E.automatable("cabane"), "pas d’objets uniques ni d’extracteurs");
});
test("usine : une machine en alimente une autre par un tapis", () => {
  const E = mk();
  E.add("automate_bois", 2);
  stations(E, ["etabli"]);
  ["manche", "corde", "archet"].forEach((k) => (E.state.known[k] = true));
  E.add("bois", 100); E.add("corde", 100);
  // la sortie envoie bois et cordes sur un tapis qui fait un crochet puis rentre dans la Réserve ;
  // A (manches) se sert dessus et pose ses manches sur la partie retour, qui passe devant B (archets)
  E.fabPlace("port", 2, 0); // → (3,0)
  E.fabDraw([{ x: 3, y: 0, d: 0 }, { x: 4, y: 0, d: 0 }, { x: 5, y: 0, d: 1 }, { x: 5, y: 1, d: 1 }, { x: 5, y: 2, d: 2 },
    { x: 4, y: 2, d: 2 }, { x: 3, y: 2, d: 2 }, { x: 2, y: 2, d: 3 }, { x: 2, y: 1, d: 2 }]);
  const A = E.fabPlace("mach", 4, 1, { m: "automate_bois", r: "manche", d: 1 }).e; // pose en (4,2)
  const B = E.fabPlace("mach", 3, 1, { m: "automate_bois", r: "archet", d: 2 }).e; // pose en (2,1)
  const g = E.fabGraph();
  assert.ok(g.sup[B.id].includes(A.id), "B se sert sur le tapis de A");
  assert.ok(g.sup[B.id].includes("P2,0"), "B touche aussi le tapis de la sortie");
  assert.ok(g.order.indexOf(A.id) < g.order.indexOf(B.id));
  const manches = E.count("manche");
  run(E, 120);
  assert.ok(E.count("archet") > 0, "des archets arrivent");
  assert.ok(E.state.made.manche > 0 && E.count("manche") >= manches);
  const fl = E.fabDrain();
  assert.ok(fl.some((f) => f.from === A.id && f.to === B.id && f.i === "manche"), "les manches passent de A à B");
});
test("usine : sortie bouchée, la machine s’arrête", () => {
  const E = mk();
  E.add("automate_bois", 1); E.state.known.manche = true; E.add("bois", 300);
  E.fabPlace("port", 2, 0);
  const m = E.fabPlace("mach", 3, 0, { m: "automate_bois", r: "manche", d: 0 }).e; // rien devant
  run(E, 120);
  assert.strictEqual(E.machInfo(m.id).s, "noout");
  assert.ok(E.machBuf(m.id).o <= 4, "elle n’accumule pas sans fin");
  assert.ok(E.count("bois") > 250);
});
test("usine : production hors ligne et sauvegarde", () => {
  const E = mk();
  E.add("automate_bois", 1); E.state.known.manche = true; E.add("bois", 2000);
  miniUsine(E, "manche");
  T += 3600 * 1000; E.update(); // une heure à 6/min
  assert.ok(Math.abs(E.count("manche") - 360) <= 2, "≈ 360 manches : " + E.count("manche"));
  assert.strictEqual(E.fabDrain().length, 0, "pas d’animation pour le temps passé dehors");
  const E2 = mk();
  E2.load(E.serialize());
  assert.deepStrictEqual(E2.state.fab.c, E.state.fab.c);
  E2.load(JSON.stringify(Object.assign(JSON.parse(E.serialize()), { fab: { r: 7, c: { "5,5": { k: "laser" }, "0,0": { k: "belt", d: 0 }, "4,4": { k: "belt", d: 1 } } } })));
  assert.deepStrictEqual(Object.keys(E2.state.fab.c), ["4,4"]);
  assert.deepStrictEqual(Object.keys(E2.state.orphans.fab).sort(), ["0,0", "5,5"], "cases illisibles mises de côté");
});
test("sauvegarde illisible ou d’une version future : erreur, rien n’est touché", () => {
  const E = mk();
  E.tap("bois");
  assert.throws(() => E.load("pas du json"));
  assert.throws(() => E.load('{"v":99,"inv":{}}'), /plus récente/);
  assert.throws(() => E.load('{"foo":1}'));
  assert.strictEqual(E.count("bois"), 1, "l’état courant est intact");
});
test("objets inconnus mis de côté, pas perdus", () => {
  const E = mk();
  E.load(JSON.stringify({ v: 2, inv: { bois: 5, objet_futur: 3 }, known: { objet_futur: true } }));
  assert.strictEqual(E.count("bois"), 5);
  assert.strictEqual(E.state.orphans.inv.objet_futur, 3);
  assert.ok(!E.state.known.objet_futur);
});
test("import : fichier JSON ou ancien code base64", () => {
  const E = mk(); E.tap("bois");
  const json = E.serialize(), b64 = E.exportSave();
  const A = mk(); A.importSave(json); assert.strictEqual(A.count("bois"), 1);
  const B = mk(); B.importSave(b64); assert.strictEqual(B.count("bois"), 1);
});

console.log("Fabrication en chaîne, Fabrique, guidage");
test("plan récursif : feu de camp depuis les matières premières", () => {
  const E = mk();
  E.add("bois", 100); E.add("fibre", 100); E.add("caillou", 100);
  ["manche", "corde", "archet", "feu"].forEach((k) => (E.state.known[k] = true));
  const p = E.plan("feu");
  assert.ok(p.ok, JSON.stringify(p));
  assert.deepStrictEqual(p.steps.map((s) => s[0]), ["manche", "corde", "archet", "feu"].filter((x) => p.steps.find((s) => s[0] === x)).sort((a, b) => p.steps.findIndex((s) => s[0] === a) - p.steps.findIndex((s) => s[0] === b)));
  assert.strictEqual(p.steps[p.steps.length - 1][0], "feu");
  const r = E.craftPlan("feu");
  assert.ok(r.done); assert.ok(E.has("feu"));
});
test("plan : matières manquantes et recettes inconnues", () => {
  const E = mk();
  E.state.known.archet = true; E.state.known.manche = true;
  const p = E.plan("archet", 2);
  assert.ok(!p.ok);
  assert.deepStrictEqual(p.locked, ["corde"]);
  assert.strictEqual(p.missing.bois, 6);
  assert.strictEqual(E.craftPlan("archet").done, false);
});
test("maxPlan : nombre de fabrications en chaîne possibles", () => {
  const E = mk();
  E.add("bois", 30); E.add("fibre", 30);
  E.state.known.manche = E.state.known.corde = E.state.known.archet = true;
  assert.strictEqual(E.maxPlan("archet"), 5); // 3 bois + 6 fibres par archet : les fibres limitent
});
test("guidage : la prochaine étape d’un objectif", () => {
  const E = mk();
  ["manche", "corde"].forEach((k) => { E.state.known[k] = true; E.state.made[k] = 1; });
  E.state.exp.done.lisiere = 1;
  assert.deepStrictEqual([E.guide().ob.id, E.guide().step], ["feu", "archet"]);
  // lingot de cuivre → il faut un four → des briques → un feu → un archet (inconnu)
  assert.strictEqual(E.nextStep("lingot_cuivre").id, "archet");
  stations(E, ["feu"]);
  E.state.known.four = true;
  // briques → argile (rivière fermée) → outre → peau (plaine fermée) → épieu
  assert.strictEqual(E.nextStep("lingot_cuivre").id, "epieu");
});
test("objectifs : un joueur avancé ne retombe pas sur le tutoriel", () => {
  const E = mk();
  E.load(fixture("save-v1-age7.json"));
  const ob = E.objective();
  assert.ok(ob && ob.i > D.OBJECTIVES.findIndex((o) => Array.isArray(o) && o[0] === "moteur_vapeur"), JSON.stringify(ob));
});
test("réminiscences : on les gagne en cherchant, pas en attendant", () => {
  const E = mk();
  let hints = [];
  E.on("guidehint", (h) => hints.push(h.lvl));
  for (let i = 0; i < 4000; i++) { T += 100; E.update(); }
  assert.deepStrictEqual(hints, [], "rester inactif ne débloque rien");
  // l’étape : un manche (tailler + bois). Chaque essai nouveau rapporte, d’autant plus qu’il s’en approche
  assert.strictEqual(E.attempt("assembler", ["bois"]).mem, 2, "un ingrédient en commun");
  assert.strictEqual(E.attempt("assembler", ["bois"]).mem, 0, "le même essai ne rapporte plus");
  assert.strictEqual(E.attempt("tailler", ["fibre"]).mem, 2, "le bon geste");
  assert.strictEqual(E.attempt("tresser", ["caillou"]).mem, 1, "un essai sans rapport");
  E.attempt("assembler", ["bois", "fibre"]);
  assert.deepStrictEqual(hints, [1], "le geste revient : " + JSON.stringify(E.memory()));
  assert.deepStrictEqual(E.memory().next, 14);
  // on continue de chercher : toutes les combinaisons de trois gestes et de quatre matières
  const mats = ["bois", "fibre", "caillou", "os"], tries = [];
  for (const g of ["assembler", "tresser", "tailler"]) for (let m = 1; m < 16; m++) tries.push([g, mats.filter((x, i) => m & (1 << i))]);
  let n = 0;
  for (const [g, ids] of tries) { if (E.state.known.manche) break; if (E.attempt(g, ids).mem) n++; }
  assert.ok(n >= 6, "il faut chercher un moment : " + n + " essais");
  assert.deepStrictEqual(hints, [1, 2, 3]);
  assert.ok(E.state.known.manche, "la recette finit par être révélée");
});
test("suivi : se termine quand l’objet est fabriqué", () => {
  const E = mk();
  E.setTrack("manche"); assert.strictEqual(E.state.track.id, "manche");
  E.add("bois", 3); E.craft("manche");
  assert.strictEqual(E.state.track, null);
});

console.log("Secrets");
test("recettes secrètes", () => {
  const E = mk();
  stations(E, ["feu"]);
  E.add("fibre", 5); E.state.seen.fibre = true;
  const r = E.attempt("chauffer", ["fibre"]);
  assert.strictEqual(r.id, "galette"); assert.ok(E.state.secrets.galette);
});
test("codes du terminal", () => {
  const E = mk();
  E.terminal("XYZZY"); E.terminal("1969"); E.terminal("Prométhée");
  assert.ok(E.state.secrets.cxyzzy && E.state.secrets.c1969 && E.state.secrets.cpromethee);
  assert.ok(E.state.frags.promethee);
  E.terminal("effacer"); assert.strictEqual(E.state.term.length, 0);
});
test("la Lune, sept fois", () => {
  const E = mk();
  for (let i = 0; i < 6; i++) assert.strictEqual(E.tapMoon(), null);
  assert.ok(E.tapMoon()); assert.ok(E.state.secrets.lune7);
});
test("flûte : l’Appel des Lucioles augmente la production", () => {
  const E = mk();
  force(E, "cabane");
  const e = cabane(E);
  const r0 = E.extOut(e);
  [2, 2, 3, 1, 5, 2, 4].forEach((n) => E.playNote(n));
  assert.ok(E.state.flags.lucioles);
  assert.ok(Math.abs(E.extOut(e) - r0 * 1.25) < 1e-9);
});

console.log("Chemin caché — Le Chant");
test("de la boussole à la fin « Le Retour »", () => {
  const E = mk();
  stations(E, ["feu", "four", "bas_fourneau", "enclume_pierre", "enclume_bronze", "creuset", "pioche_bronze", "pioche_pierre",
    "outre", "epieu", "tour", "dynamo", "lithographe", "ordinateur", "radiotelescope", "four_arc"]);
  ["plaine", "riviere", "collines", "mine"].forEach((z) => (E.state.zones[z] = true));
  // la boussole ouvre la Porte Scellée
  force(E, "boussole");
  assert.ok(E.state.secrets.boussole);
  E.state.exp.done.mine = 1;
  assert.ok(E.startExp("mine").ok);
  T += 200 * 1000; E.update();
  assert.ok(E.zoneOpen("caveau")); assert.ok(E.state.secrets.caveau);
  // le Caveau : cuves, chambre d’Iris, cœur d’ARCHE
  for (let k = 0; k < 3; k++) {
    E.add("torche", 3);
    assert.ok(E.startExp("caveau").ok, "exploration du caveau " + k);
    T += 300 * 1000; E.update();
  }
  assert.ok(E.state.frags.cuves && E.state.frags.berceuse && E.state.frags.coeur);
  assert.strictEqual(E.count("partition"), 1);
  // la berceuse sur la flûte débloque Accorder
  force(E, "flute");
  assert.ok(!E.gesteOK("accorder"));
  D.MELODIES.berceuse.notes.forEach((n) => E.playNote(n));
  assert.ok(E.gesteOK("accorder"));
  // diapason, cristaux, signal, traducteur
  for (let i = 0; i < 400; i++) E.tap("resonite");
  force(E, "diapason", 30);
  force(E, "cristal_chantant", 2);
  assert.ok(E.listen().fresh);
  assert.strictEqual(E.count("signal_brut"), 1);
  force(E, "traducteur");
  assert.ok(E.state.flags.decoded && E.state.frags.signal);
  assert.ok(E.projVisible("chant"));
  // Le Chant
  let ending = null;
  E.on("ending", (r) => (ending = r));
  D.PROJECTS.chant.steps.forEach((s) => { if (s.cost) { for (const k in s.cost) E.add(k, s.cost[k]); assert.ok(E.contribute("chant").done); } });
  assert.strictEqual(E.projState("chant").step, 3);
  D.MELODIES.berceuse.notes.forEach((n) => E.playNote(n));
  assert.ok(ending && ending.id === "retour");
});
test("Brise-Monde : mise à feu", () => {
  const E = mk();
  E.state.flags.arche = true;
  let ending = null;
  E.on("ending", (r) => (ending = r));
  D.PROJECTS.brisemonde.steps.forEach((s) => { if (s.cost) { for (const k in s.cost) E.add(k, s.cost[k]); E.contribute("brisemonde"); } });
  E.fire("brisemonde");
  assert.strictEqual(ending.id, "brasier");
});
test("nouveau cycle : on garde le savoir, on gagne des échos", () => {
  const E = mk();
  E.state.flags.arche = true;
  D.PROJECTS.dyson.steps.forEach((s) => { for (const k in s.cost) E.add(k, s.cost[k]); E.contribute("dyson"); });
  assert.ok(E.state.endings.aube);
  E.state.known.manche = true; E.state.frags.chene = true; E.state.meta.capsule = true;
  E.newCycle();
  const S = E.state;
  assert.strictEqual(S.cycle, 2); assert.strictEqual(S.echoes, 1);
  assert.ok(S.known.manche && S.frags.chene); assert.ok(!S.endings.aube); assert.ok(S.meta.endings.aube);
  assert.ok(S.count === undefined && E.count("manche") === 10, "capsule temporelle");
  assert.strictEqual(E.tapYield("bois", "lisiere"), 1.5);
});

test("mains : une pièce après l’autre, matières mises de côté", () => {
  const E = mk();
  E.add("bois", 20); E.learn("manche");
  const t = E.handTime("manche");
  const r = E.queue("manche", 3);
  assert.ok(r.ok);
  assert.strictEqual(E.count("bois"), 11, "le bois est pris dès la mise en file");
  assert.ok(Math.abs(r.time - E.batchTime("manche", 3)) < 1e-9);
  assert.ok(r.time < 3 * t, "répéter le geste va plus vite");
  E.step(t * 1.5);
  assert.strictEqual(E.count("manche"), 1, "une pièce finie");
  assert.ok(E.cancelJob(0));
  assert.strictEqual(E.count("bois"), 17, "les deux pièces pas faites rendent leur bois");
  assert.strictEqual(E.state.hand.q.length, 0);
  assert.strictEqual(E.queue("manche", 10).why, "qty");
  E.state.age = 5;
  assert.ok(Math.abs(E.handTime("manche") - t * Math.pow(D.HAND.old, 5)) < 1e-9, "les gestes anciens vont plus vite");
});
test("mains : en chaîne, les sous-composants restent sur l’établi", () => {
  const E = mk();
  E.add("bois", 10); E.add("fibre", 12); E.add("manche", 4);
  ["manche", "corde", "archet"].forEach((i) => E.learn(i));
  const r = E.queue("archet", 2, true);
  assert.ok(r.ok, JSON.stringify(r));
  assert.strictEqual(E.count("manche"), 2, "deux manches du stock réservés");
  assert.strictEqual(E.count("fibre"), 0, "de quoi tresser quatre cordes");
  E.step(r.time + 0.01);
  assert.strictEqual(E.count("archet"), 2);
  assert.strictEqual(E.count("corde"), 0, "les cordes ont servi aux archets");
  assert.strictEqual(E.count("manche"), 2);
  assert.strictEqual(E.state.hand.q.length, 0);
});
test("mains : découverte immédiate, recette connue dans la file, outil unique une seule fois", () => {
  const E = mk();
  E.add("bois", 30);
  assert.strictEqual(E.attempt("tailler", ["bois"]).kind, "craft", "première fois : tout de suite");
  const q = E.attempt("tailler", ["bois"]);
  assert.strictEqual(q.kind, "queued");
  assert.strictEqual(E.count("manche"), 1);
  E.step(q.time);
  assert.strictEqual(E.count("manche"), 2);
  E.add("fibre", 100); E.learn("panier");
  assert.ok(E.queue("panier", 1).ok);
  assert.strictEqual(E.queue("panier", 1).why, "queued");
  for (let i = 0; i < 7; i++) E.queue("manche", 1);
  E.learn("corde");
  assert.strictEqual(E.queue("corde", 1).why, "full");
});
test("mains : la file survit à la sauvegarde et avance pendant l’absence", () => {
  const E = mk();
  E.add("bois", 30); E.learn("manche");
  E.queue("manche", 8);
  const txt = E.serialize();
  const F = mk();
  F.load(txt);
  assert.strictEqual(F.count("bois"), 6);
  T += 60000;
  F.update();
  assert.strictEqual(F.count("manche"), 8);
  assert.strictEqual(F.state.hand.q.length, 0);
});
test("sauvegarde : une fabrication illisible rend ses matières", () => {
  const E = mk();
  const o = JSON.parse(E.serialize());
  o.inv.bois = 1;
  o.hand = { q: [{ id: "objet_disparu", s: [["objet_disparu", 2]], i: 0, k: 0, b: { bois: 5, truc_inconnu: 2 } }, { id: "manche", s: [["manche", 1]], i: 0, k: 0, b: { bois: 3 } }], p: 0.2 };
  E.load(o);
  assert.strictEqual(E.count("bois"), 6, "le bois mis de côté revient");
  assert.strictEqual(E.state.orphans.inv.truc_inconnu, 2, "l’inconnu est mis de côté, pas jeté");
  assert.strictEqual(E.state.hand.q.length, 1);
});
test("étude des matières : ce qui réagit, contre de l’Intuition", () => {
  const E = mk();
  ["bois", "fibre", "caillou"].forEach((i) => E.add(i, 1));
  assert.deepStrictEqual(E.reactions("bois"), { tailler: 1 }, "le manche");
  E.learn("manche");
  E.add("manche", 1);
  assert.ok(E.reactions("manche").tresser >= 1, "le panier");
  const before = E.state.intu;
  assert.ok(E.study("manche"));
  assert.strictEqual(E.state.intu, before - E.studyCost("manche"));
  assert.ok(!E.study("manche"), "une seule fois");
  assert.ok(!E.study("os"), "pas une matière jamais vue");
});

test("tapis : un tapis ne porte pas plus que son débit", () => {
  const E = mk();
  E.add("cabane", 20);
  assert.ok(E.fabPlaceExt(-3, -7, "cabane", 10).ok);
  assert.ok(E.fabLink(-3, -7).ok);
  const x = E.fabCell(-3, -7), cap = E.beltCap();
  assert.ok(E.extOut(x) > cap, "dix cabanes récoltent plus qu’un tapis de l’âge du Bois ne porte");
  const b0 = E.count("bois");
  run(E, 20);
  const got = E.count("bois") - b0;
  assert.ok(got <= cap * 20 + 1e-6 && got > cap * 18, "au débit du tapis : " + got);
  assert.strictEqual(E.machInfo(x.id).s, "sat");
  assert.ok(Math.abs(E.rate("bois") - cap) < 1e-9, "la production affichée est celle qui arrive");
  E.state.age = 7;
  run(E, 5);
  assert.strictEqual(E.machInfo(x.id).s, "ok", "à l’âge 7, les tapis suivent");
});
test("tapis : chaque entrée dans la Réserve a son débit, le tracé automatique en ouvre une nouvelle", () => {
  const E = mk();
  E.state.age = 3;
  E.add("cabane", 20);
  E.fabPlaceExt(-3, -7, "cabane", 7); E.fabLink(-3, -7);
  E.fabPlaceExt(-1, -7, "cabane", 7); E.fabLink(-1, -7);
  const g = E.fabGraph(), X = E.fabCell(-3, -7), Y = E.fabCell(-1, -7);
  assert.notStrictEqual(g.prods[X.id].t.ents[0].k, g.prods[Y.id].t.ents[0].k, "deux entrées distinctes");
  const cap = E.beltCap();
  assert.ok(E.extOut(X) < cap && E.extOut(X) * 2 > cap, "chacune passe seule, pas les deux ensemble");
  run(E, 5);
  assert.deepStrictEqual(E.fabSat(), {});
});
test("tapis : deux gisements sur le même tapis, l’entrée commune déborde", () => {
  const E = mk();
  E.state.age = 3;
  E.add("cabane", 20);
  E.fabPlaceExt(-3, -7, "cabane", 7); E.fabCell(-3, -7).d = 1;
  E.fabPlaceExt(-1, -7, "cabane", 7); E.fabCell(-1, -7).d = 1;
  // le bois descend sur un tapis qui passe sous la fibre, puis file vers la Réserve
  E.fabDraw([{ x: -3, y: -6, d: 0 }, { x: -2, y: -6, d: 0 }, { x: -1, y: -6, d: 0 }, { x: 0, y: -6, d: 1 },
    { x: 0, y: -5, d: 1 }, { x: 0, y: -4, d: 1 }, { x: 0, y: -3, d: 1 }, { x: 0, y: -2, d: 1 }]);
  const g = E.fabGraph(), X = E.fabCell(-3, -7), Y = E.fabCell(-1, -7);
  assert.strictEqual(g.prods[X.id].t.ents[0].k, "0,-2");
  assert.strictEqual(g.prods[Y.id].t.ents[0].k, "0,-2", "la même entrée");
  const cap = E.beltCap(), b0 = E.count("bois"), f0 = E.count("fibre");
  run(E, 20);
  const got = E.count("bois") - b0 + E.count("fibre") - f0;
  assert.ok(got <= cap * 20 + 1e-6 && got > cap * 18, "un seul tapis de débit : " + got);
  assert.ok(Math.abs(E.count("bois") - b0 - (E.count("fibre") - f0)) < cap, "partagé à parts égales");
  assert.deepStrictEqual(E.fabSat(), { "0,-2": 1 });
  assert.strictEqual(E.machInfo(X.id).s, "jam");
  // un répartiteur ouvre une deuxième entrée : tout passe
  E.fabRemove(0, -4);
  assert.ok(E.fabPlace("split", 0, -4).ok);
  E.fabDraw([{ x: 1, y: -4, d: 1 }, { x: 1, y: -3, d: 1 }, { x: 1, y: -2, d: 1 }]);
  E.fabRemove(-1, -4);
  assert.strictEqual(E.fabGraph().prods[X.id].t.ents.length, 2);
  const b1 = E.count("bois"), f1 = E.count("fibre");
  run(E, 20);
  const got2 = E.count("bois") - b1 + E.count("fibre") - f1;
  assert.ok(got2 > (E.extOut(X) + E.extOut(Y)) * 19, "deux entrées : toute la récolte passe (" + got2 + ")");
});
test("la Réserve ne laisse sortir qu’un certain débit, toutes sorties confondues", () => {
  const E = mk();
  E.add("automate_bois", 2); E.state.known.manche = true;
  E.add("bois", 1000);
  const m = miniUsine(E, "manche");
  run(E, 60);
  const out = E.resOutCap();
  assert.ok(1000 - E.count("bois") <= out * 60 + 1e-6, "pas plus que la porte de la Réserve");
  assert.ok(E.count("manche") > 0);
  void m;
});

test("chantier d’un Grand Œuvre : posé sur la carte, nourri par tapis", () => {
  const E = mk();
  assert.strictEqual(E.fabPlace("site", 4, 0, { p: "dyson" }).why, "kind", "pas avant d’avoir le projet");
  E.state.flags.arche = true;
  E.state.age = 12;
  E.recalc();
  assert.ok(E.fabPlace("site", 4, 0, { p: "dyson" }).ok);
  assert.strictEqual(E.fabPlace("site", 5, 3, { p: "dyson" }).why, "siteone", "un seul chantier par Grand Œuvre");
  E.add("supra", 400); E.add("metal_mercure", 60000); E.add("regolithe", 20000);
  run(E, 2);
  assert.strictEqual(E.machInfo("S:dyson").s, "nolink", "aucun tapis ne l’atteint");
  assert.ok(E.fabPlace("port", 2, 0).ok);
  E.fabDraw([{ x: 3, y: 0, d: 0 }]);
  run(E, 10);
  const ps = E.projState("dyson");
  const paid = Object.values(ps.paid).reduce((a, b) => a + b, 0);
  assert.ok(paid > 0 && paid <= E.resOutCap() * 10 + 1e-6, "au débit des sorties de la Réserve : " + paid);
  assert.strictEqual(E.machInfo("S:dyson").s, "ok");
  ps.paid = { supra: 380, metal_mercure: 49990, regolithe: 12500 };
  let step = null;
  E.on("projstep", (x) => (step = x));
  run(E, 1);
  assert.deepStrictEqual(step, { pid: "dyson", step: 0 });
  assert.strictEqual(ps.step, 1, "étape suivante");
  // sauvegarde : le chantier reste, un chantier inconnu est mis de côté
  const o = JSON.parse(E.serialize());
  o.fab.c["6,6"] = { k: "site", id: "S:inconnu", p: "inconnu" };
  const F = mk();
  F.load(o);
  assert.ok(F.siteOf("dyson"));
  assert.ok(F.state.orphans.fab["6,6"]);
  assert.strictEqual(F.fabRemove(4, 0).k, "site");
});
test("jalons : les objectifs rangés par âge", () => {
  const E = mk();
  const m = E.milestones();
  assert.ok(m[0].length >= 4, "l’âge du Bois a ses jalons");
  assert.ok(m[0].some((x) => x.ob.k === "ext"), "installer la cabane fait partie de l’âge du Bois");
  assert.ok(!m[0][0].done);
  E.add("bois", 3); E.attempt("tailler", ["bois"]);
  assert.ok(E.milestones()[0][0].done);
  const all = m.reduce((a, l) => a + (l ? l.length : 0), 0);
  assert.strictEqual(all, D.OBJECTIVES.length);
});

test("v4 → v5 : l’usine, les souvenirs et les Grands Œuvres restent tels quels", () => {
  const raw = fixture("save-v4-age8-carte.json"), old = JSON.parse(raw);
  const E = mk();
  E.load(raw);
  const S = E.state;
  assert.deepStrictEqual(S.fab.c, old.fab.c, "chaque case de l’usine");
  assert.deepStrictEqual(S.hints, old.hints, "les indices déjà obtenus");
  assert.deepStrictEqual(S.hand, { q: [], p: 0 });
  assert.deepStrictEqual(S.studied, {});
  assert.ok(!S.flags.v5proj, "pas de Grand Œuvre commencé");
  const o = JSON.parse(raw);
  o.flags.arche = true; o.proj = { dyson: { step: 1, paid: { panneau_dyson: 120 } } };
  const F = mk();
  F.load(o);
  assert.ok(F.state.flags.v5proj, "on prévient le joueur");
  assert.deepStrictEqual(F.projState("dyson"), { step: 1, paid: { panneau_dyson: 120 } }, "ce qui a été versé reste acquis");
});

console.log(passed + " tests réussis" + (process.exitCode ? ", des échecs." : "."));
