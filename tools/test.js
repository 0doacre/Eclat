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
/* une partie neuve */
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
test("découvrir coûte peu : une grosse recette s’inscrit sans rien prendre", () => {
  const E = mk();
  E.add("archet", 1); E.add("bois", 30); E.add("caillou", 20);
  const r = E.attempt("assembler", ["archet", "bois", "caillou"]);
  assert.strictEqual(r.kind, "learn"); assert.strictEqual(r.missing, null); assert.ok(r.fresh);
  assert.ok(E.state.known.feu);
  assert.strictEqual(E.count("bois"), 30, "rien n’est pris");
  assert.ok(!(E.state.made.feu > 0));
  // une petite découverte sort tout de suite
  const m = E.attempt("tailler", ["bois"]);
  assert.strictEqual(m.kind, "craft");
});
test("échecs : écrits à la main pour les essais probables, avec les bons articles", () => {
  const E = mk();
  for (const k in D.FAIL_ONE) {
    const [g, ids] = k.split(":"), list = ids.split("+");
    assert.ok(!E.RECIPES[E.keyOf(g, list)], "« " + k + " » est une vraie recette");
    assert.deepStrictEqual(list.slice().sort(), list, "« " + k + " » : matières dans l’ordre");
    list.forEach((i) => assert.ok(D.ITEMS[i], i));
  }
  assert.strictEqual(E.failText("tresser", ["caillou"]), D.FAIL_ONE["tresser:caillou"]);
  assert.strictEqual(E.the("os"), "l’os"); assert.strictEqual(E.the("fibre"), "les fibres"); assert.strictEqual(E.the("hache_pierre"), "la hache de pierre");
  assert.strictEqual(E.the("helium3"), "l’hélium-3"); assert.strictEqual(E.the("charbon"), "le charbon");
  const t = E.failText("tremper", ["fibre"]);
  assert.ok(!/\{|\}/.test(t) && /^[A-ZÀ-Ý]/.test(t), t);
  assert.strictEqual(E.failText("tremper", ["fibre"]), t, "la même tentative, la même phrase");
  for (const g in D.FAIL) D.FAIL[g].forEach((x) => assert.ok(!/\{[^x}][^}]*\}/.test(x.replace(/\{[^{}|]*\|[^{}]*\}/g, "")), "modèle mal formé : " + x));
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
  assert.ok(!E.zoneOpen("plaine"), "l’épieu rend le passage possible, il ne l’ouvre pas");
  assert.ok(E.passInfo("plaine").ready);
  assert.strictEqual(E.craft("epieu").why, "owned");
});
test("passages : on verse en plusieurs fois, la terre s’ouvre une fois tout payé", () => {
  const E = mk();
  stations(E, ["feu"]);
  assert.strictEqual(E.passPour("plaine").ok, false, "pas avant l’épieu");
  force(E, "epieu");
  const cost = E.passCost("plaine");
  // le guidage mène au passage
  const ob = E.objective();
  assert.strictEqual(ob.k, "pass"); assert.strictEqual(ob.z, "plaine");
  E.state.inv = {}; E.add("bois", 50);
  const r1 = E.passPour("plaine");
  assert.ok(r1.ok && !r1.done); assert.strictEqual(E.count("bois"), 0);
  assert.ok(E.passInfo("plaine").frac > 0 && E.passInfo("plaine").frac < 1);
  for (const i in cost) E.add(i, cost[i]);
  const r2 = E.passPour("plaine");
  assert.ok(r2.done); assert.ok(E.zoneOpen("plaine"));
  assert.strictEqual(E.count("bois"), 50, "seul le reste est pris");
  assert.strictEqual(E.releveGain(), D.PASSAGES.plaine.tr);
  assert.ok(E.canReleve());
  // tant qu’un passage n’est pas payé, la prochaine étape vers la Rivière le dit
  const G = mk(); stations(G, ["feu"]); force(G, "epieu");
  assert.strictEqual(G.nextStep("argile").why, "pass");
});
test("plan : une pièce prise en partie au stock se fabrique avant celles qui s’en servent", () => {
  const E = mk();
  for (const k in D.ITEMS) E.state.known[k] = true;
  stations(E, ["enclume_bronze", "creuset", "four", "feu", "enclume_pierre"]);
  E.add("lingot_bronze", 5); E.add("lingot_cuivre", 200); E.add("lingot_etain", 200); E.add("caillou", 5000); E.add("bois", 5000); E.add("corde", 500); E.add("manche", 500); E.add("charbon", 500);
  const steps = E.plan("automate_bronze", 1).steps.map((x) => x[0]);
  steps.forEach((x, k) => Object.keys(D.ITEMS[x].r[1]).forEach((i) => { const j = steps.indexOf(i); assert.ok(j < 0 || j < k, i + " avant " + x + " : " + steps); }));
  assert.ok(E.queue("automate_bronze", 1, true).ok);
  run(E, 300);
  assert.strictEqual(E.count("automate_bronze"), 1); assert.strictEqual(E.state.hand.q.length, 0, "la file ne reste pas bloquée");
});
test("relève : on garde le savoir, on gagne des Traces ; la Mémoire des mains", () => {
  const E = mk();
  stations(E, ["feu"]);
  force(E, "epieu");
  for (const i in E.passCost("plaine")) E.add(i, E.passCost("plaine")[i]);
  E.passPour("plaine");
  E.state.flags.tuto = { done: { debut: true }, c: null, i: 0 }; E.state.flags.tip_full = true; E.state.flags.extDone = true;
  const known = Object.keys(E.state.known).length, tap0 = E.tap("bois");
  E.newCycle();
  const S = E.state;
  assert.strictEqual(S.meta.traces, D.PASSAGES.plaine.tr);
  assert.strictEqual(Object.keys(S.known).length, known, "le Carnet est gardé");
  assert.ok(!E.zoneOpen("plaine") && !S.pass.plaine, "les terres repartent de zéro");
  assert.strictEqual(S.flags.tuto.done.debut, true, "le tutoriel déjà vu ne revient pas");
  assert.ok(S.flags.tip_full && !S.flags.extDone);
  assert.strictEqual(E.releveGain(), 0); assert.ok(!E.canReleve());
  // acheter : récolte ×2, paquetage
  assert.ok(E.memBuy("recolte")); assert.strictEqual(S.meta.traces, 0);
  assert.ok(!E.memBuy("paquetage"), "plus de Traces");
  assert.strictEqual(E.tap("bois"), tap0 * 2);
  S.meta.traces = 100;
  assert.ok(E.memBuy("paquetage") && E.memBuy("paquetage") && E.memBuy("raccourci"));
  E.newCycle();
  assert.strictEqual(E.state.inv.cabane, 1, "le paquetage : une cabane");
  assert.ok(E.state.made.manche && E.state.made.cabane, "ce qu’il donne compte comme fait");
  assert.notStrictEqual(E.objective().id, "manche", "l’étape « manche » est passée");
  assert.ok(E.state.inv.bois >= 60);
  assert.ok(E.zoneOpen("plaine") && E.has("epieu"), "le raccourci ouvre la Plaine");
  assert.strictEqual(E.releveGain(), 0, "un passage offert ne rapporte rien");
  assert.strictEqual(E.memLvl("recolte"), 1, "la Mémoire est gardée");
  // chemins connus : les passages coûtent moins
  E.state.meta.traces = 10; const c0 = E.passCost("riviere").bois;
  assert.ok(E.memBuy("chemins")); assert.ok(E.passCost("riviere").bois < c0);
});
test("relève : une réminiscence déjà lue ne revient pas", () => {
  const E = mk();
  let n = 0; E.on("event", () => n++);
  stations(E, []); E.add("bois", 30); E.add("caillou", 20); E.add("archet", 1); E.state.known.feu = true;
  assert.ok(E.craft("feu").ok); assert.strictEqual(n, 1, "« Seuil 1 » la première fois");
  E.state.pass.plaine = { paid: {}, done: true };
  E.newCycle();
  E.add("bois", 30); E.add("caillou", 20); E.add("archet", 1);
  assert.ok(E.craft("feu").ok); assert.strictEqual(n, 1, "pas une deuxième fois");
  // une partie d’avant : les réminiscences des objets déjà faits comptent comme lues
  const raw = JSON.parse(E.serialize()); delete raw.meta.ev; raw.made.feu = 1;
  const F = mk(); F.load(JSON.stringify(raw)); assert.ok(F.state.meta.ev.feu);
});
test("passages : une partie d’avant garde ses terres ouvertes, comptées comme franchies", () => {
  const E = mk();
  const raw = JSON.parse(E.serialize());
  delete raw.pass; delete raw.meta.traces; delete raw.meta.mem;
  raw.zones = { lisiere: true, plaine: true, riviere: true };
  const F = mk(); F.load(JSON.stringify(raw));
  assert.ok(F.zoneOpen("riviere"));
  assert.ok(F.state.pass.plaine.done && F.state.pass.riviere.done);
  assert.strictEqual(F.releveGain(), D.PASSAGES.plaine.tr + D.PASSAGES.riviere.tr);
  assert.strictEqual(F.state.meta.traces, 0); assert.deepStrictEqual(F.state.meta.mem, {});
});
/* pose une cabane sur le gisement de bois de la Lisière et la relie à la Réserve */
test("extracteurs : coût croissant, posés sur un gisement, la récolte va à la Réserve", () => {
  const E = mk();
  const c0 = E.costFor("cabane").fibre;
  force(E, "cabane");
  assert.ok(E.costFor("cabane").fibre > c0);
  const b = E.count("bois");
  T += 4000; E.update();
  assert.strictEqual(E.count("bois"), b, "rangée dans le stock, une cabane ne récolte rien");
  const r = E.domExtAdd("lisiere", "bois", 1);
  assert.deepStrictEqual([r.ok, r.placed, r.queued, r.t], [true, 1, 0, "cabane"]);
  T += 100; E.update();
  const b1 = E.count("bois");
  T += 4000; E.update();
  assert.ok(Math.abs(E.count("bois") - b1 - 4 * 1.2) < 0.01, "une cabane sur le bois : 0,4 × 3 matières = 1,2/s");
  assert.ok(E.state.flags.extDone);
  assert.ok(Math.abs(E.rate("bois") - 1.2) < 1e-9);
  assert.strictEqual(E.machInfo("lisiere:bois").s, "ok");
});
test("gisements : récolte à la main, règles de pose", () => {
  const E = mk();
  const ds = E.deposits();
  assert.deepStrictEqual(ds.map((d) => d.res).sort(), ["bois", "caillou", "charbon", "fibre"], "la Lisière seule au départ");
  assert.ok(ds.find((d) => d.res === "bois").hand && !ds.find((d) => d.res === "charbon").hand);
  assert.strictEqual(E.tap("bois", "lisiere"), 1);
  assert.strictEqual(E.tap("charbon", "lisiere"), 0, "le charbon ne se ramasse pas à la main");
  assert.strictEqual(E.domExtAdd("lisiere", "bois", 1).why, "noext", "aucun extracteur connu");
  E.add("cabane", 2); E.add("charbonniere", 1); E.add("collets", 1);
  assert.strictEqual(E.domExtSet("lisiere", "bois", "charbonniere", 1), null, "une meule ne fait pas de bois");
  assert.strictEqual(E.domExtSet("plaine", "os", "collets", 1), null, "pas sur une terre fermée");
  assert.ok(E.domExtSet("lisiere", "charbon", "charbonniere", 1));
  const e = E.domExtSet("lisiere", "bois", "cabane", 5);
  assert.strictEqual(e.u.cabane, 2, "pas plus que les cabanes possédées");
  assert.strictEqual(E.extUnits().cabane.used, 2);
  assert.strictEqual(E.freeExt("cabane"), 0);
  assert.strictEqual(E.domExtSet("lisiere", "bois", "cabane", 0), null, "à zéro, le gisement est libéré");
  assert.strictEqual(E.extUnits().cabane.used, 0);
  E.state.zones.plaine = true;
  assert.ok(E.deposits().some((d) => d.z === "plaine" && d.res === "os"), "chaque terre ouverte apporte ses gisements");
  E.domExtSet("lisiere", "bois", "cabane", 1);
  E.domExtToggle("lisiere", "bois");
  run(E, 2);
  assert.strictEqual(E.machInfo("lisiere:bois").s, "off");
});
test("un extracteur ne travaille que sur sa terre ; une ancienne pose ailleurs rentre chez elle", () => {
  const E = mk();
  ["plaine", "riviere", "collines", "mine", "desert"].forEach((z) => (E.state.zones[z] = true));
  E.add("nasse", 3); E.add("tamis", 1); E.add("cabane", 1); E.state.known.nasse = true;
  assert.strictEqual(E.domExtSet("desert", "sable", "nasse", 1), null, "des nasses ne vont pas au désert");
  assert.strictEqual(E.domExtSet("collines", "caillou", "cabane", 1), null, "une cabane reste à la Lisière");
  assert.deepStrictEqual(E.extFor("sable", "desert").sort(), ["excavatrice", "tamis"]);
  assert.strictEqual(E.extChoice("sable", "desert").t, "tamis");
  // un Carnet hérité connaît la scierie, mais on ne peut payer qu’une cabane : le bouton propose la cabane
  const G = mk();
  G.state.known.cabane = G.state.known.hutte = G.state.known.scierie = true;
  assert.strictEqual(G.extChoice("bois", "lisiere").t, "cabane", "rien de payable : le plus simple");
  for (const i in D.ITEMS.cabane.r[1]) G.add(i, D.ITEMS.cabane.r[1][i] * 5);
  assert.strictEqual(G.extChoice("bois", "lisiere").t, "cabane", "payable : la cabane, pas la scierie");
  assert.strictEqual(E.domExtAdd("collines", "caillou", 1).why, "noext");
  // une sauvegarde d’avant la 5.3 : trois nasses posées sur le sable du désert
  const o = JSON.parse(E.serialize());
  o.dom.ext["desert:sable"] = { z: "desert", res: "sable", u: { nasse: 3 }, on: true };
  const F = mk();
  F.load(JSON.stringify(o));
  assert.ok(!F.domExt("desert", "sable"), "plus rien d’étranger au désert");
  const back = F.deposits().filter((d) => d.z === "riviere").reduce((a, d) => a + (((F.domExt(d.z, d.res) || { u: {} }).u.nasse) || 0), 0);
  assert.strictEqual(back, 3, "les trois nasses sont reposées à la Rivière");
  assert.strictEqual(F.count("nasse"), 3, "aucune perdue");
  assert.ok(!F.state.flags.reExt);
});
test("« +1 » : un extracteur libre est posé, sinon les mains le fabriquent puis le posent", () => {
  const E = mk();
  E.state.known.cabane = true;
  E.add("manche", 50); E.add("corde", 50); E.add("fibre", 200);
  const r = E.domExtAdd("lisiere", "fibre", 2);
  assert.deepStrictEqual([r.ok, r.placed, r.queued], [true, 0, 2], JSON.stringify(r));
  assert.strictEqual(E.domQueued("x:lisiere:fibre"), 2);
  run(E, Math.ceil(E.handInfo().left) + 2);
  assert.strictEqual(E.domExt("lisiere", "fibre").u.cabane, 2, "posées une fois finies");
  assert.strictEqual(E.domQueued("x:lisiere:fibre"), 0);
  assert.strictEqual(E.domExtAdd("lisiere", "bois", 1).placed, 0);
  const F = mk();
  F.state.known.cabane = true;
  const q = F.domExtAdd("lisiere", "bois", 1);
  assert.ok(!q.ok && q.missing, "rien pour la fabriquer : " + JSON.stringify(q));
});
test("machines : celle qui fait un ingrédient passe avant celle qui s’en sert", () => {
  const E = mk();
  E.add("automate_bois", 2);
  stations(E, ["etabli"]);
  ["manche", "corde", "archet"].forEach((k) => (E.state.known[k] = true));
  E.add("bois", 100); E.add("corde", 100);
  const B = E.domMachAdd("archet").e; // ajoutée la première
  E.domMachAdd("manche");
  run(E, 120);
  assert.ok(E.count("archet") > 0, "des archets, faits avec les manches de l’autre machine");
  assert.ok(E.state.made.manche > 0);
  assert.notStrictEqual(E.machInfo(B.id).s, "norec");
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
  E.domExtAdd("lisiere", "bois", 1);
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
const FIXTURES = fs.readdirSync(path.join(__dirname, "fixtures")).filter((x) => /^save-v\d/.test(x));
test("les sauvegardes v1 à v5 se chargent sans rien perdre", () => {
  assert.ok(FIXTURES.some((f) => /^save-v5/.test(f)));
  for (const f of FIXTURES) {
    const raw = fixture(f);
    const old = JSON.parse(raw);
    const E = mk();
    E.load(raw);
    const S = E.state;
    assert.strictEqual(S.v, SAVE_VERSION, f);
    for (const k in old.inv) assert.ok(S.inv[k] >= old.inv[k] - 1e-9, f + " : stock de " + k);
    for (const k in old.known) assert.ok(S.known[k], f + " : recette " + k);
    for (const k in old.made) assert.strictEqual(S.made[k], old.made[k], f + " : fabriqué " + k);
    assert.strictEqual(S.age, old.age); assert.strictEqual(S.intu, old.intu);
    assert.deepStrictEqual(S.zones, old.zones); assert.deepStrictEqual(S.frags, old.frags);
    assert.strictEqual(S.flags.news, "6", "annonce des nouveautés");
    assert.ok(S.dom && !S.fab && !S.settings.usine);
    assert.strictEqual(raw, fixture(f), "la chaîne d’origine n’est pas modifiée");
    T += 5000; E.update(); // le jeu tourne
  }
});
const machs = (E) => E.state.dom.mach;
test("les chaînes d’assemblage v1 deviennent des machines du Domaine", () => {
  const E = mk();
  E.load(fixture("save-v1-age10-chaines.json"));
  assert.deepStrictEqual(machs(E).map((e) => [e.r, e.m, e.n]).sort(), [["bobine", "chaine", 1], ["plaque_fer", "chaine", 1]]);
  assert.ok(E.state.auto === undefined && E.state.lines === undefined);
  const before = E.count("plaque_fer");
  for (let i = 0; i < 20; i++) { T += 100; E.update(); }
  assert.ok(E.count("plaque_fer") > before, "la machine produit");
});
test("les lignes v2 deviennent des chaînes du Domaine", () => {
  const raw = fixture("save-v2-age7-fabrique.json");
  const old = JSON.parse(raw);
  const E = mk();
  E.load(raw);
  const got = machs(E).map((e) => [e.r, e.m, e.n, e.on, e.cap]).sort();
  const want = old.lines.map((L) => [L.r, L.m, L.n, L.on, L.cap]).sort();
  assert.deepStrictEqual(got, want, "réglages conservés");
  assert.deepStrictEqual(E.state.flags.fab3, { placed: 5, left: 0 });
  E.add("bois", 100); E.add("plaque_cuivre", 50); E.add("lingot_fer", 50);
  const b = { fil: E.count("fil_cuivre"), clous: E.count("clous"), manche: E.count("manche") };
  for (let i = 0; i < 300; i++) { T += 100; E.update(); }
  assert.ok(E.count("fil_cuivre") > b.fil && E.count("clous") > b.clous && E.count("manche") > b.manche, "tout produit");
  assert.strictEqual(E.machInfo(machs(E).find((e) => e.r === "corde").id).s, "off");
});
test("v4 : les extracteurs d’avant sont posés et produisent autant", () => {
  for (const f of ["save-v1-age7.json", "save-v1-age10-chaines.json", "save-v2-age7-fabrique.json", "save-v3-age7-usine.json"]) {
    const raw = fixture(f), old = JSON.parse(raw);
    const E = mk();
    E.load(raw);
    const S = E.state, info = S.flags.fab4;
    const owned = E.EXTS.reduce((a, t) => a + Math.floor(old.inv[t] || 0), 0);
    assert.strictEqual(info.placed, owned, f + " : tous posés");
    // production totale : celle d’avant (extracteurs « tout seuls »), à 10 % près
    let before = 0;
    E.EXTS.forEach((t) => { const it = D.ITEMS[t]; for (const r in it.p) before += it.p[r] * Math.floor(old.inv[t] || 0); });
    let after = 0;
    for (const k in S.dom.ext) { const e = S.dom.ext[k]; for (const t in e.u) after += e.u[t] * E.extRate(t, e.res); }
    assert.ok(Math.abs(after - before) / before < 0.1, f + " : " + before.toFixed(1) + " → " + after.toFixed(1));
    run(E, 2);
    for (const k in S.dom.ext) assert.strictEqual(E.machInfo(k).s, "ok", f + " : " + k);
  }
});
test("machines : une chaîne produit, s’arrête au stock visé, réclame ce qui manque", () => {
  const E = mk();
  assert.strictEqual(E.domMachAdd("manche").why, "norec", "recette inconnue");
  E.state.known.manche = true;
  assert.strictEqual(E.domMachAdd("manche").why, "nomach", "il faut posséder la machine");
  E.add("automate_bois", 2); E.add("bois", 30);
  const m = E.domMachAdd("manche").e;
  assert.deepStrictEqual([m.m, m.n, m.on], ["automate_bois", 1, true]);
  E.domMachSet(m.id, { n: 5 });
  assert.strictEqual(m.n, 2, "pas plus que les machines possédées");
  assert.strictEqual(E.domMachAdd("manche").why, "nomach", "plus de machine libre");
  run(E, 30); // 30 s à 12/min
  assert.strictEqual(E.count("manche"), 6);
  assert.ok(E.state.flags.lineDone);
  E.domMachSet(m.id, { cap: 7 });
  run(E, 30);
  assert.strictEqual(E.count("manche"), 7); assert.strictEqual(E.machInfo(m.id).s, "cap");
  E.domMachSet(m.id, { cap: 0 });
  run(E, 60);
  assert.ok(E.count("bois") < 3); assert.strictEqual(E.machInfo(m.id).s, "starved");
  assert.deepStrictEqual(E.machInfo(m.id).miss, { bois: "stock" });
  const bois = E.count("bois") + (E.machBuf(m.id).b.bois || 0);
  E.domMachRemove(m.id);
  assert.ok(Math.abs(E.count("bois") - bois) < 1e-9, "ce qui restait dans la machine revient au stock");
  assert.strictEqual(machs(E).length, 0);
  assert.ok(!E.automatable("feu") && !E.automatable("cabane"), "pas d’objets uniques ni d’extracteurs");
});
test("« + » sur une chaîne : les machines libres d’abord, les mains font le reste", () => {
  const E = mk();
  E.state.known.manche = true; E.state.known.automate_bois = true;
  E.add("automate_bois", 2);
  const m = E.domMachAdd("manche").e;
  E.add("engrenage_bois", 100); E.add("corde", 100); E.add("caillou", 500);
  const r = E.domMachMore(m.id, 3);
  assert.deepStrictEqual([r.ok, r.added, r.queued], [true, 1, 2], JSON.stringify(r));
  assert.strictEqual(m.n, 2);
  assert.strictEqual(E.domQueued("m:" + m.id), 2);
  run(E, Math.ceil(E.handInfo().left) + 2);
  assert.strictEqual(m.n, 4, "les automates fabriqués rejoignent la chaîne");
});
test("Domaine : production hors ligne et sauvegarde", () => {
  const E = mk();
  E.add("automate_bois", 1); E.state.known.manche = true; E.add("bois", 2000);
  E.domMachAdd("manche");
  E.add("cabane", 1); E.domExtSet("lisiere", "fibre", "cabane", 1);
  T += 3600 * 1000; E.update(); // une heure à 6/min
  assert.ok(Math.abs(E.count("manche") - 360) <= 2, "≈ 360 manches : " + E.count("manche"));
  const E2 = mk();
  E2.load(E.serialize());
  assert.deepStrictEqual(E2.state.dom, E.state.dom);
  const o = JSON.parse(E.serialize());
  o.dom.ext["lisiere:laser"] = { u: { cabane: 1 } };
  o.dom.ext["nulle-part:bois"] = { u: { cabane: 1 } };
  o.dom.ext["lisiere:bois"] = { u: { cabane: 3, inconnu: 2, charbonniere: 1 } };
  o.dom.mach.push({ id: "M99", m: "laser", r: "manche", n: 1 }, { id: "M98", m: "automate_bois", r: "inconnu", n: 4 });
  o.dom.site = { inconnu: { on: true } };
  E2.load(JSON.stringify(o));
  const D2 = E2.state.dom;
  assert.deepStrictEqual(Object.keys(D2.ext), ["lisiere:fibre"], "une seule cabane : elle reste sur la fibre");
  assert.deepStrictEqual(D2.mach.map((e) => e.id), [E.state.dom.mach[0].id], "pas plus de machines que possédées");
  assert.deepStrictEqual(D2.site, {});
  assert.deepStrictEqual(Object.keys(E2.state.orphans.dom).sort(),
    ["ext:lisiere:bois:charbonniere", "ext:lisiere:bois:inconnu", "ext:lisiere:laser", "ext:nulle-part:bois", "mach:M98", "mach:M99", "site:inconnu"], "mis de côté, pas jetés");
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
  const e = E.domExtSet("lisiere", "bois", "cabane", 1);
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
  E.learn("corde");
  for (let i = 0; i < 7; i++) E.queue(i % 2 ? "corde" : "manche", 1); // en alternance : chacune a sa place
  assert.strictEqual(E.state.hand.q.length, 8);
  assert.strictEqual(E.queue("corde", 1).why, "full");
});
test("mains : la même pièce demandée plusieurs fois d’affilée s’allonge au lieu d’empiler", () => {
  const E = mk();
  E.state.known.manche = true; E.add("bois", 60);
  for (let i = 0; i < 4; i++) assert.ok(E.queue("manche", 1).ok);
  assert.deepStrictEqual(E.state.hand.q.map((j) => j.s[0][1]), [1, 3], "la première est en cours, les trois suivantes n’en font qu’une");
  run(E, 30);
  assert.strictEqual(E.count("manche"), 4);
  assert.strictEqual(E.count("bois"), 60 - 12);
});
test("mains : ×10 cabanes depuis les matières premières, en une seule fabrication", () => {
  const E = mk();
  ["manche", "corde", "cabane"].forEach((k) => (E.state.known[k] = true));
  E.add("bois", 2000); E.add("fibre", 2000);
  const max = E.maxPlan("cabane");
  assert.ok(max >= 10, "Max : " + max);
  assert.ok(E.queue("cabane", 10, true).ok);
  assert.strictEqual(E.state.hand.q.length, 1, "une seule ligne dans la file");
  run(E, 900);
  assert.strictEqual(E.count("cabane"), 10);
});
test("mains : en chaîne avec tout en stock, la même pièce s’allonge aussi", () => {
  const E = mk();
  E.state.known.manche = true; E.add("bois", 60);
  for (let i = 0; i < 3; i++) assert.ok(E.queue("manche", 1, true).ok);
  assert.deepStrictEqual(E.state.hand.q.map((j) => j.s[0][1]), [1, 2]);
});
test("mains : trois extracteurs en chaîne d’affilée sortent tous (le prix monte pour chacun)", () => {
  const E = mk();
  ["manche", "corde", "cabane"].forEach((k) => (E.state.known[k] = true));
  E.add("bois", 500); E.add("fibre", 500);
  for (let i = 0; i < 3; i++) assert.ok(E.queue("cabane", 1, true).ok, "mise en file " + (i + 1));
  run(E, 120);
  assert.strictEqual(E.state.hand.q.length, 0, "la file s’est vidée : " + JSON.stringify(E.state.hand.q.map((j) => [j.id, j.i, j.k, j.w])));
  assert.strictEqual(E.count("cabane"), 3);
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

test("Grand Œuvre alimenté : il se sert dans la Réserve, au débit de l’âge", () => {
  const E = mk();
  assert.strictEqual(E.domSite("inconnu", true), null);
  E.state.flags.arche = true; E.state.age = 12; E.recalc();
  assert.ok(E.domSite("dyson", true));
  assert.ok(E.siteOn("dyson"));
  E.add("supra", 400); E.add("metal_mercure", 60000); E.add("regolithe", 20000);
  run(E, 5);
  const ps = E.projState("dyson");
  const paid = Object.values(ps.paid);
  assert.ok(paid.some((v) => v > 0) && paid.every((v) => v <= E.siteRate() * 5 + 1e-6), "au débit de l’âge : " + JSON.stringify(ps.paid));
  assert.strictEqual(E.machInfo("S:dyson").s, "ok");
  ps.paid = { supra: 380, metal_mercure: 49990, regolithe: 12500 };
  let step = null;
  E.on("projstep", (x) => (step = x));
  run(E, 1);
  assert.deepStrictEqual(step, { pid: "dyson", step: 0 });
  assert.strictEqual(ps.step, 1, "étape suivante");
  E.domSite("dyson", false);
  const before = JSON.stringify(ps.paid);
  run(E, 2);
  assert.strictEqual(JSON.stringify(ps.paid), before, "à l’arrêt, il ne prend plus rien");
});
test("une machine prend au stock et y range ce qu’elle fait, deux pièces d’avance en main", () => {
  const E = mk();
  E.add("automate_bois", 1); E.state.known.manche = true; E.add("bois", 30);
  const m = E.domMachAdd("manche").e;
  run(E, 30); // 30 s à 6/min
  assert.strictEqual(E.count("manche"), 3);
  assert.strictEqual(E.count("bois"), 30 - 3 * 3 - 6, "trois manches faits, deux d’avance dans la machine");
  assert.strictEqual(E.machInfo(m.id).s, "ok");
  run(E, 90);
  assert.strictEqual(E.count("manche"), 10, "tout le bois y est passé");
  assert.strictEqual(E.machInfo(m.id).s, "starved");
  assert.deepStrictEqual(E.machInfo(m.id).miss, { bois: "stock" });
});
test("un extracteur remplit le stock sans plafond, la main aussi", () => {
  const E = mk();
  E.add("cabane", 20);
  const x = E.domExtSet("lisiere", "bois", "cabane", 10), out = E.extOut(x);
  const b0 = E.count("bois");
  run(E, 10);
  assert.ok(Math.abs(E.count("bois") - b0 - out * 10) < 1e-6, "tout arrive : " + (E.count("bois") - b0));
  assert.strictEqual(E.machInfo("lisiere:bois").s, "ok");
  E.add("bois", 1e6);
  assert.ok(E.tap("bois") > 0);
});
test("production : la récolte des extracteurs et ce que font et prennent les machines", () => {
  const E = mk();
  E.add("cabane", 2);
  const x = E.domExtSet("lisiere", "bois", "cabane", 2);
  E.add("automate_bois", 1); E.state.known.manche = true; E.add("bois", 30);
  assert.ok(E.domMachAdd("manche").ok);
  run(E, 60);
  const p = E.production(), bois = p.find((y) => y.id === "bois"), manche = p.find((y) => y.id === "manche");
  const out = E.extOut(x);
  assert.ok(Math.abs(bois.in - out) < out * 0.05, "bois récolté : " + bois.in + " / " + out);
  assert.ok(Math.abs(bois.out - 0.3) < 0.03, "le bois que prend l’automate (6/min × 3) : " + bois.out);
  assert.ok(Math.abs(manche.in - 0.1) < 0.01, "les manches : " + manche.in);
});
test("relève : le Domaine repart de zéro", () => {
  const E = mk();
  E.add("cabane", 1); E.domExtSet("lisiere", "bois", "cabane", 1);
  E.add("automate_bois", 1); E.state.known.manche = true; E.domMachAdd("manche");
  E.newCycle();
  assert.deepStrictEqual(E.state.dom, { ext: {}, mach: [], site: {}, ms: {}, seq: 0 });
  run(E, 1);
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

test("jalons : chaque âge en a plusieurs, le compte est cohérent", () => {
  const m = mk().milestones();
  assert.ok(m[1].length >= 4, "l’âge de l’Os a ses étapes : " + m[1].map((x) => x.ob.id || x.ob.n));
  // la première étape de l’Os fait entrer dans l’Os (pas une étape d’un autre âge)
  assert.strictEqual(D.ITEMS[m[1][0].ob.id].a, 1);
});
test("âge accompli : toutes ses étapes faites, un peu d’Intuition, une seule fois", () => {
  const E = mk();
  const S = E.state, before = S.intu;
  E.milestones()[0].forEach((x) => { if (x.ob.k === "craft") S.made[x.ob.id] = 1; });
  S.exp.done.lisiere = 1; S.flags.extDone = true; S.pass.plaine = { paid: {}, done: true };
  E.checkAges();
  assert.ok(S.flags.ages[0], "l’âge du Bois est accompli");
  assert.strictEqual(S.intu, before + D.AGE_DONE);
  E.checkAges();
  assert.strictEqual(S.intu, before + D.AGE_DONE, "pas deux fois");
  assert.ok(!S.flags.ages[1]);
  // une ancienne partie : ses âges finis sont marqués sans récompense
  const raw = JSON.parse(E.serialize());
  delete raw.flags.ages; raw.intu = 5;
  const F = mk(); F.load(JSON.stringify(raw));
  assert.ok(F.state.flags.ages[0]); assert.strictEqual(F.state.intu, 5);
});
const extTotals = (cells) => { const o = {}; cells.forEach((e) => { if (e.u && (e.k === undefined || e.k === "ext")) for (const t in e.u) o[t] = (o[t] || 0) + e.u[t]; }); return o; };
const machList = (list) => list.map((e) => [e.id, e.m, e.r || null, e.n, e.on !== false, e.cap || 0].join(" ")).sort();
test("v4 → v6 : les extracteurs et les machines de l’usine passent dans le Domaine", () => {
  const raw = fixture("save-v4-age8-carte.json"), old = JSON.parse(raw);
  const E = mk();
  E.load(raw);
  const S = E.state, cells = Object.values(old.fab.c);
  assert.deepStrictEqual(extTotals(Object.values(S.dom.ext)), extTotals(cells), "autant d’extracteurs de chaque type");
  assert.deepStrictEqual(machList(S.dom.mach), machList(cells.filter((e) => e.k === "mach")), "les mêmes machines, mêmes réglages");
  assert.deepStrictEqual(S.orphans.fab5.c, old.fab.c, "l’ancienne usine est gardée de côté");
  // la récolte par matière est la même
  const rate = (list) => { const o = {}; list.forEach((e) => { if (e.u && e.k !== "mach") for (const t in e.u) o[e.res] = (o[e.res] || 0) + e.u[t] * E.extRate(t, e.res); }); return o; };
  assert.deepStrictEqual(rate(Object.values(S.dom.ext)), rate(cells.filter((e) => e.k === "ext")));
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
test("v5 → v6 : rien ne se perd, ce qui était en route revient au stock", () => {
  const raw = fixture("save-v5-age8-usine.json"), old = JSON.parse(raw);
  const E = mk();
  E.load(raw);
  const S = E.state, cells = Object.values(old.fab.c), ms = old.fab.ms;
  assert.strictEqual(old.v, 5);
  assert.ok(cells.some((e) => e.k === "belt") && cells.some((e) => e.k === "split"), "une vraie usine avancée");
  assert.deepStrictEqual(extTotals(Object.values(S.dom.ext)), extTotals(cells));
  assert.deepStrictEqual(machList(S.dom.mach), machList(cells.filter((e) => e.k === "mach")));
  const want = Object.assign({}, old.inv);
  const put = (i, v) => { if (v > 0) want[i] = (want[i] || 0) + v; };
  cells.forEach((e) => {
    const B = e.id && ms[e.id];
    if (!B) return;
    if (e.k === "ext") put(e.res, B.o);
    if (e.k === "mach" && e.r) { put(e.r, B.o); assert.deepStrictEqual(S.dom.ms[e.id].b, B.b, "ce qu’a en main " + e.id); }
    if (e.k === "site") for (const i in B.b) put(i, B.b[i]);
  });
  for (const i in want) assert.ok(Math.abs((S.inv[i] || 0) - want[i]) < 1e-6, i + " : " + S.inv[i] + " / " + want[i]);
  assert.ok(E.siteOn("dyson"), "le chantier devient un Grand Œuvre alimenté");
  assert.ok(!("usine" in S.settings));
  assert.deepStrictEqual(S.orphans.fab5, old.fab);
  run(E, 5);
  Object.keys(S.dom.ext).forEach((k) => assert.strictEqual(E.machInfo(k).s, "ok", k));
});

console.log("Compétences et action qui tourne");
test("gestes : l’expérience vient de ce qu’on fait à la main, un niveau rend plus rapide", () => {
  const E = mk();
  assert.strictEqual(E.skill("tailler").lvl, 1);
  const t0 = E.handTime("manche");
  E.state.known.manche = true; E.add("bois", 600);
  assert.ok(E.queue("manche", 100).ok);
  run(E, 400);
  const k = E.skill("tailler");
  assert.ok(k.xp >= 100 * E.xpOf("manche") - 1e-9, "100 manches : " + k.xp);
  assert.ok(k.lvl > 1);
  assert.ok(E.handTime("manche") < t0, "plus rapide");
  // une machine ne donne pas d’expérience
  const xp = k.xp;
  E.add("automate_bois", 1); E.add("bois", 300); E.domMachAdd("manche");
  run(E, 60);
  assert.strictEqual(E.skill("tailler").xp, xp);
  // paliers : une chance de pièce en plus
  E.state.skills.tresser = E.XP_T[25];
  assert.strictEqual(E.skill("tresser").perks, 2);
  assert.ok(Math.abs(E.perkChance("tresser") - 2 * D.SKILL.perk) < 1e-9);
  let lv = null;
  E.on("level", (x) => (lv = x));
  E.state.skills.assembler = E.XP_T[10] - 1;
  E.gainXp("assembler", 1);
  assert.deepStrictEqual(lv, { g: "assembler", lvl: 10, perk: true });
});
test("récolte à la main : de l’expérience, et un rendement qui monte", () => {
  const E = mk();
  const y0 = E.tap("bois", "lisiere");
  assert.strictEqual(E.skill("recolte").xp, 1);
  E.state.skills.recolte = E.XP_T[50];
  assert.ok(Math.abs(E.tap("bois", "lisiere") - y0 * 1.49) < 1e-9, "niveau 50 : ×1,49");
});
test("action qui tourne : ramasser en continu, même jeu fermé", () => {
  const E = mk();
  assert.strictEqual(E.startAct({ k: "harv", z: "plaine", res: "os" }), null, "pas sur une terre fermée");
  E.startAct({ k: "harv", z: "lisiere", res: "bois" });
  run(E, 60);
  assert.ok(Math.abs(E.count("bois") - 40) <= 1, "une prise toutes les 1,5 s : " + E.count("bois"));
  assert.strictEqual(E.actInfo().got, E.count("bois"));
  const b = E.count("bois");
  T += 3600 * 1000; E.update();
  assert.ok(E.count("bois") - b > 2000, "une heure dehors : " + (E.count("bois") - b));
  E.stopAct();
  assert.strictEqual(E.state.act, null);
});
test("action qui tourne : refaire une recette en boucle, jusqu’à ce qu’il manque de quoi", () => {
  const E = mk();
  E.state.known.manche = true;
  assert.strictEqual(E.startAct({ k: "make", id: "feu" }), null, "pas un objet unique ni inconnu");
  E.add("bois", 30);
  let stop = null;
  E.on("actstop", (x) => (stop = x));
  E.startAct({ k: "make", id: "manche" });
  assert.ok(E.state.hand.q.some((j) => j.loop), "une série dans la file");
  run(E, 120);
  assert.strictEqual(E.count("manche"), 10, "tout le bois y est passé");
  assert.ok(stop && stop.why === "missing", JSON.stringify(stop));
  assert.strictEqual(E.state.act, null);
  // en chaîne : des cordes faites en route pour des collets
  const F = mk();
  ["corde", "collets"].forEach((k) => (F.state.known[k] = true));
  stations(F, ["etabli"]);
  F.add("fibre", 400); F.add("os", 50); F.add("manche", 50);
  if (D.ITEMS.collets.r) {
    F.startAct({ k: "make", id: "collets" });
    run(F, 300);
    assert.ok((F.state.made.collets || 0) >= 1, "des collets : " + JSON.stringify(F.state.made));
  }
});
test("compétences et action : sauvegarde, relève", () => {
  const E = mk();
  E.state.skills.tailler = 5000; E.state.skills.recolte = 300;
  E.startAct({ k: "harv", z: "lisiere", res: "fibre" });
  const F = mk();
  F.load(E.serialize());
  assert.deepStrictEqual(F.state.skills, E.state.skills);
  assert.strictEqual(F.state.act.res, "fibre");
  const o = JSON.parse(E.serialize());
  o.skills.inconnu = 5; o.skills.tailler = "x"; o.act = { k: "make", id: "laser" };
  F.load(JSON.stringify(o));
  assert.deepStrictEqual(F.state.skills, { recolte: 300 });
  assert.strictEqual(F.state.act, null);
  E.state.pass.plaine = { paid: {}, done: true };
  E.newCycle();
  assert.deepStrictEqual(E.state.skills, { tailler: 500, recolte: 30 }, "un dixième reste");
  assert.strictEqual(E.state.act, null);
});

console.log(passed + " tests réussis" + (process.exitCode ? ", des échecs." : "."));
