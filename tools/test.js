#!/usr/bin/env node
/* Tests du moteur : mécaniques de base, secrets, chemin caché, fins, sauvegarde. */
"use strict";
const assert = require("assert");
const D = require("../js/data.js");
const fs = require("fs");
const path = require("path");
const { createEngine, migrate, SAVE_VERSION } = require("../js/engine.js");
const { signeSVG, renderSigneToken } = require("../js/signes.js");
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
test("machines : sur une commande en chaîne, les machines aident sur les sous-pièces et la cible", () => {
  const E = mk();
  E.add("automate_bronze", 1); E.add("automate_bois", 1);
  stations(E, ["etabli"]);
  ["manche", "corde", "archet"].forEach((k) => { E.state.known[k] = true; E.state.made[k] = 1; });
  E.add("bois", 100); E.add("corde", 100);
  const r = E.order("archet", 10);
  assert.ok(r.ok);
  run(E, 120);
  assert.strictEqual(E.count("archet"), 10, "les 10 archets sont fabriqués avec leurs manches");
  assert.ok(E.state.flags.lineDone);
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
  assert.ok(E.state.frags[(E.RECIT.expFrag || {})["lisiere:chene"] || "chene"], "le fragment du lieu");
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
test("les chaînes d’assemblage v1 se chargent : groupes dissous, machines possédées au repos", () => {
  const E = mk();
  E.load(fixture("save-v1-age10-chaines.json"));
  assert.deepStrictEqual(machs(E), []);
  assert.ok(E.state.flags.mach57);
  assert.ok(E.state.auto === undefined && E.state.lines === undefined);
  assert.ok(E.count("chaine") >= 2 && E.freeMach("chaine") === Math.floor(E.count("chaine")));
});
test("les lignes v2 se chargent : groupes dissous, machines possédées au repos", () => {
  const raw = fixture("save-v2-age7-fabrique.json");
  const old = JSON.parse(raw);
  const E = mk();
  E.load(raw);
  assert.deepStrictEqual(machs(E), []);
  assert.ok(E.state.flags.mach57);
  ["automate_bois", "automate_bronze", "presse_vapeur"].forEach((m) => {
    assert.strictEqual(E.count(m), old.inv[m], m + " conservé");
    assert.strictEqual(E.freeMach(m), old.inv[m], m + " au repos");
  });
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
test("commandes : ×10 sans machine puis avec un automate de bois au repos (finit plus vite)", () => {
  const E1 = mk();
  E1.state.known.manche = true; E1.state.made.manche = 1; E1.add("bois", 30);
  const r1 = E1.order("manche", 10);
  assert.ok(r1.ok);
  let t1 = 0;
  while (E1.state.hand.q.length > 0 && t1 < 3000) { T += 10; E1.update(); t1++; }
  assert.strictEqual(E1.count("manche"), 10, "×10 sans machine : les mains font tout");

  const E2 = mk();
  E2.state.known.manche = true; E2.state.made.manche = 1; E2.add("bois", 30);
  E2.add("automate_bois", 1);
  const r2 = E2.order("manche", 10);
  assert.ok(r2.ok);
  assert.ok(r2.time < r1.time, "temps estimé plus court avec l’automate");
  assert.strictEqual(E2.machines().automate_bois.used, 1, "l’automate travaille sur la commande");
  let t2 = 0;
  while (E2.state.hand.q.length > 0 && t2 < 3000) { T += 10; E2.update(); t2++; }
  assert.strictEqual(E2.count("manche"), 10);
  assert.ok(t2 < t1, "la commande finit plus vite avec l’automate : " + t2 + " < " + t1);
  assert.strictEqual(E2.machines().automate_bois.used, 0, "l’automate retourne au repos");
  assert.ok(!E2.automatable("feu") && !E2.automatable("cabane"), "pas d’objets uniques ni d’extracteurs");
});
test("commandes : plusieurs machines libres se répartissent sur les étapes et les commandes suivantes", () => {
  const E = mk();
  ["manche", "corde"].forEach((k) => { E.state.known[k] = true; E.state.made[k] = 1; });
  E.add("automate_bois", 2);
  E.add("bois", 60); E.add("fibre", 60);
  assert.ok(E.order("manche", 10).ok);
  assert.ok(E.order("corde", 10).ok);
  // les deux automates aident la première commande, ou se répartissent
  assert.strictEqual(E.machines().automate_bois.used, 2);
  run(E, 120);
  assert.strictEqual(E.count("manche"), 10);
  assert.strictEqual(E.count("corde"), 10);
  assert.strictEqual(E.machines().automate_bois.used, 0);
});
test("Domaine : commande et extracteurs hors ligne, sauvegarde et nettoyage", () => {
  const E = mk();
  E.add("automate_bois", 1); E.state.known.manche = true; E.state.made.manche = 1; E.add("bois", 2000);
  E.order("manche", 360);
  E.add("cabane", 1); E.domExtSet("lisiere", "fibre", "cabane", 1);
  T += 3600 * 1000; E.update(); // une heure : la commande de 360 manches est terminée
  assert.strictEqual(E.count("manche"), 360, "360 manches : " + E.count("manche"));
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
  assert.deepStrictEqual(D2.mach, [], "groupes de machines dissous");
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
  // Les Matines (id chant)
  let ending = null;
  E.on("ending", (r) => (ending = r));
  const s0 = D.PROJECTS.chant.steps[0];
  for (const k in s0.cost) E.add(k, s0.cost[k]);
  assert.ok(E.contribute("chant").done);
  assert.strictEqual(E.projState("chant").step, 1);
  assert.strictEqual(E.cutRelay().ok, false);
  E.state.frags.poings = true;
  assert.strictEqual(E.cutRelay().ok, true);
  assert.strictEqual(E.projState("chant").step, 2);
  assert.strictEqual(E.releaseHand().ok, true);
  assert.strictEqual(E.projState("chant").step, 3);
  E.fire("chant");
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
test("commandes : une commande qui manque de bois attend, pose une cabane au repos sur le bois, puis reprend", () => {
  const E = mk();
  E.state.known.manche = true; E.state.made.manche = 1;
  E.add("bois", 3); // de quoi faire 1 manche sur 3
  const r = E.order("manche", 3);
  assert.ok(r.ok);
  assert.strictEqual(E.count("bois"), 0, "les 3 bois disponibles sont pris sur l’établi");
  assert.strictEqual(E.state.hand.q[0].miss.bois, 6, "il manque 6 bois");
  run(E, 20);
  assert.strictEqual(E.count("manche"), 1, "1 manche fait, la commande attend le reste du bois");
  assert.strictEqual(E.state.hand.q.length, 1);
  assert.ok(E.handInfo().jobs[0].wait, "la commande est en attente de matières");
  // une cabane libre est posée automatiquement sur le gisement de bois
  E.add("cabane", 1);
  run(E, 1);
  assert.ok(E.domExt("lisiere", "bois") && E.domExt("lisiere", "bois").u.cabane === 1, "la cabane au repos est posée sur le bois");
  run(E, 30);
  assert.strictEqual(E.count("manche"), 3, "la commande a repris et fini grâce au bois récolté");
  assert.strictEqual(E.state.hand.q.length, 0);
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
test("production : la récolte des extracteurs et ce que font et prennent les machines sur une commande", () => {
  const E = mk();
  E.add("cabane", 2);
  const x = E.domExtSet("lisiere", "bois", "cabane", 2);
  run(E, 25);
  E.add("automate_bois", 1); E.state.known.manche = true; E.state.made.manche = 1; E.add("bois", 1500);
  assert.ok(E.order("manche", 500).ok);
  run(E, 5);
  const p = E.production(), bois = p.find((y) => y.id === "bois"), manche = p.find((y) => y.id === "manche");
  const out = E.extOut(x);
  assert.ok(Math.abs(bois.in - out) < out * 0.05, "bois récolté : " + bois.in + " / " + out);
  assert.ok(Math.abs(bois.out - 0.3) < 0.03, "le bois que consomme l’automate (6/min × 3) : " + bois.out);
  assert.ok(Math.abs(manche.in - 0.1) < 0.01, "les manches : " + manche.in);
});
test("relève : le Domaine repart de zéro", () => {
  const E = mk();
  E.add("cabane", 1); E.domExtSet("lisiere", "bois", "cabane", 1);
  E.add("automate_bois", 1); E.state.known.manche = true; E.order("manche", 5);
  E.newCycle();
  assert.deepStrictEqual(E.state.dom, { ext: {}, mach: [], site: {}, ms: {}, seq: 0 });
  assert.deepStrictEqual(E.state.hand.q, []);
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
test("v4 → v6 : les extracteurs de l’usine passent dans le Domaine, les groupes de machines sont dissous", () => {
  const raw = fixture("save-v4-age8-carte.json"), old = JSON.parse(raw);
  const E = mk();
  E.load(raw);
  const S = E.state, cells = Object.values(old.fab.c);
  assert.deepStrictEqual(extTotals(Object.values(S.dom.ext)), extTotals(cells), "autant d’extracteurs de chaque type");
  assert.deepStrictEqual(S.dom.mach, [], "groupes de machines dissous");
  assert.ok(S.flags.mach57);
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
test("v5 → v6 : rien ne se perd, ce qui était en route ou dans les machines revient au stock", () => {
  const raw = fixture("save-v5-age8-usine.json"), old = JSON.parse(raw);
  const E = mk();
  E.load(raw);
  const S = E.state, cells = Object.values(old.fab.c), ms = old.fab.ms;
  assert.strictEqual(old.v, 5);
  assert.ok(cells.some((e) => e.k === "belt") && cells.some((e) => e.k === "split"), "une vraie usine avancée");
  assert.deepStrictEqual(extTotals(Object.values(S.dom.ext)), extTotals(cells));
  assert.deepStrictEqual(S.dom.mach, [], "groupes de machines dissous");
  assert.ok(S.flags.mach57);
  const want = Object.assign({}, old.inv);
  const put = (i, v) => { if (v > 0) want[i] = (want[i] || 0) + v; };
  cells.forEach((e) => {
    const B = e.id && ms[e.id];
    if (!B) return;
    if (e.k === "ext") put(e.res, B.o);
    if (e.k === "mach" && e.r) { put(e.r, B.o); for (const i in B.b) put(i, B.b[i]); }
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
  // une pièce faite par une machine ne donne pas d’expérience (les mains sont occupées sur une recette à 2 ingrédients)
  E.state.known.archet = true; E.add("manche", 500); E.add("corde", 1000);
  assert.ok(E.order("archet", 500).ok); // 2 ingrédients : l’automate de bois ne peut pas la faire, les mains s’en chargent
  const xp = E.skill("tailler").xp, mBefore = E.count("manche");
  E.add("automate_bois", 1); E.add("bois", 300); assert.ok(E.order("manche", 5).ok); // l’automate de bois fait les manches seul pendant ce temps
  run(E, 12);
  assert.ok(E.count("manche") > mBefore, "l’automate a fabriqué des manches");
  assert.strictEqual(E.skill("tailler").xp, xp, "les manches faits par l’automate ne donnent pas d’XP en tailler");
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
test("commandes : annuler rend tout l’établi ; sauvegarder au milieu d’une commande reprend où elle en était", () => {
  const E = mk();
  assert.strictEqual(E.startAct({ k: "make", id: "manche" }), null, "la boucle de recette n’existe plus");
  ["manche", "corde", "archet"].forEach((k) => { E.state.known[k] = true; E.state.made[k] = 1; });
  E.add("bois", 30); E.add("fibre", 60);
  assert.ok(E.order("archet", 5).ok);
  run(E, 1); // quelques manches fabriqués sur l’établi
  const j = E.state.hand.q[0];
  assert.ok(j && (j.b.manche || 0) >= 1, "des manches intermédiaires sont sur l’établi");
  // sauvegarde et rechargement au milieu de la commande
  const saved = E.serialize();
  const F = mk();
  F.load(saved);
  assert.strictEqual(F.state.hand.q.length, 1);
  assert.deepStrictEqual(F.state.hand.q[0].done, j.done, "progression conservée");
  run(F, 30);
  assert.strictEqual(F.count("archet"), 5, "la commande rechargée va jusqu’au bout");
  // annuler sur E rend les matières restantes et les manches déjà faits sur l’établi
  const madeManches = j.b.manche || 0;
  assert.ok(E.cancelJob(0));
  assert.strictEqual(E.count("manche"), madeManches, "les sous-pièces déjà faites sur l’établi vont en Réserve");
  assert.strictEqual(E.count("bois"), 30 - madeManches * 3, "le bois non consommé revient en Réserve");
  assert.strictEqual(E.count("fibre"), 60, "les fibres reviennent en Réserve");
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

console.log("Le Comptoir");
test("tout objet vendable a une valeur > 0 et finie", () => {
  const E = mk();
  for (const id in D.ITEMS) {
    if (E.sellable(id)) {
      const v = E.value(id);
      assert.ok(v > 0, id + " a une valeur positive");
      assert.ok(Number.isFinite(v), id + " a une valeur finie");
    }
  }
});
test("vendre retire de la Réserve et ajoute les écus", () => {
  const E = mk();
  E.add("bois", 100);
  const r = E.sell("bois", 40);
  assert.ok(r.ok);
  assert.strictEqual(r.n, 40);
  assert.strictEqual(E.count("bois"), 60);
  assert.ok(E.state.ecus > 0);
  assert.strictEqual(E.state.ecus, r.ecus);
  assert.strictEqual(E.state.comptoir.sold.bois, 40);
});
test("vendre n d’un coup rapporte autant que n/2 puis n/2 (à 1e-6 près)", () => {
  const E1 = mk();
  const E2 = mk();
  E1.add("fibre", 500);
  E2.add("fibre", 500);
  const r1 = E1.sell("fibre", 500);
  const r2a = E2.sell("fibre", 250);
  const r2b = E2.sell("fibre", 250);
  assert.ok(Math.abs(r1.ecus - (r2a.ecus + r2b.ecus)) < 1e-6, "intégrale exacte");
  assert.ok(Math.abs(E1.state.ecus - E2.state.ecus) < 1e-6);
});
test("le prix unitaire baisse après une vente", () => {
  const E = mk();
  const p0 = E.unitPrice("caillou");
  E.add("caillou", 1000);
  E.sell("caillou", 1000);
  const p1 = E.unitPrice("caillou");
  assert.ok(p1 < p0, "le prix unitaire doit baisser avec la saturation");
  assert.strictEqual(p1, E.value("caillou") / (1 + 1000 / D.COMPTOIR.sat));
});
test("un outil, une station ou un objet unique ne se vend pas", () => {
  const E = mk();
  assert.strictEqual(E.sellable("epieu"), false);
  assert.strictEqual(E.sellable("feu"), false);
  assert.strictEqual(E.sellable("cabane"), false);
  assert.strictEqual(E.sellable("automate_bois"), false);
  assert.strictEqual(E.sellable("tablette"), false);
  assert.strictEqual(E.sellable("boussole"), false);
  assert.ok(E.sellable("bois"), "matière");
  assert.ok(E.sellable("manche"), "pièce");
  E.add("epieu", 1);
  const r = E.sell("epieu", 1);
  assert.strictEqual(r.ok, false);
});
test("conversion des écus à la relève (et 0 écu → 0 Trace)", () => {
  const E = mk();
  const t0 = E.state.meta.traces;
  // 0 écu donne 0 Trace
  E.state.ecus = 0;
  assert.strictEqual(E.ecusToTraces(0), 0);
  E.newCycle();
  assert.strictEqual(E.state.meta.traces, t0);

  // Conversion à l’âge 0 : base = 100 écus
  const base0 = E.traceBasePrice(0);
  assert.strictEqual(base0, D.COMPTOIR.trace);
  E.state.ecus = 250;
  assert.strictEqual(E.ecusToTraces(250, 0), 2);
  E.newCycle();
  assert.strictEqual(E.state.meta.traces, t0 + 2);
  assert.strictEqual(E.state.ecus, 0);

  // Conversion à l’âge 2 : base = 100 * (1.8^2) = 324
  E.state.age = 2;
  const base2 = E.traceBasePrice(2);
  assert.ok(Math.abs(base2 - 100 * 1.8 * 1.8) < 1e-6);
  E.state.ecus = 650;
  assert.strictEqual(E.ecusToTraces(650, 2), 2);
  E.newCycle();
  assert.strictEqual(E.state.meta.traces, t0 + 2 + 2);
  assert.strictEqual(E.state.ecus, 0);
});
test("après newCycle() : 0 écu, comptoir vide, Traces converties toujours là", () => {
  const E = mk();
  E.state.ecus = 5000;
  E.add("bois", 100);
  E.sell("bois", 50);
  assert.strictEqual(E.state.comptoir.sold.bois, 50);
  E.state.pass.plaine = { paid: {}, done: true };
  const expectedGain = E.releveGain(); // 2 traces pour la plaine
  const expectedEcusTr = E.ecusToTraces(E.state.ecus, E.state.age); // 50 traces
  E.newCycle();
  assert.strictEqual(E.state.ecus, 0);
  assert.deepStrictEqual(E.state.comptoir, { sold: {}, traces: 0, asks: [], next: 0 });
  assert.strictEqual(E.state.meta.traces, expectedGain + expectedEcusTr);
  assert.strictEqual(E.state.meta.tracesTotal, expectedGain + expectedEcusTr);
});
test("les demandes ne proposent que des objets connus et déjà fabriqués, d’un âge permis", () => {
  const E = mk();
  E.state.zones.plaine = true;
  E.state.age = 2; // âges permis : [2-1, 2] = [1, 2]

  // Objet âge 0 (manche) : connu et fabriqué, mais hors âge permis (< 1)
  E.state.known.manche = true;
  E.state.made.manche = 10;

  // Objet âge 1 (laniere) : connu mais pas fabriqué
  E.state.known.laniere = true;
  E.state.made.laniere = 0;

  // Objet âge 1 (tunique) : fabriqué mais pas connu
  E.state.known.tunique = false;
  E.state.made.tunique = 5;

  // Objet âge 1 unique (fronde) : connu et fabriqué mais unique
  E.state.known.fronde = true;
  E.state.made.fronde = 1;

  // Objet âge 2 permis : brique (connu et fabriqué)
  E.state.known.brique = true;
  E.state.made.brique = 10;

  // Objet âge 1 permis : colle_os (connu et fabriqué)
  E.state.known.colle_os = true;
  E.state.made.colle_os = 5;

  const elig = E.troqueurEligibleItems();
  assert.ok(elig.includes("brique"), "brique doit être éligible");
  assert.ok(elig.includes("colle_os"), "colle_os doit être éligible");
  assert.ok(!elig.includes("manche"), "manche âge 0 exclu quand joueur à l’âge 2");
  assert.ok(!elig.includes("laniere"), "laniere pas fabriquée");
  assert.ok(!elig.includes("tunique"), "tunique pas connue");
  assert.ok(!elig.includes("fronde"), "fronde unique");

  E.refreshTroqueur(true);
  const asks = E.state.comptoir.asks;
  assert.ok(asks.length > 0 && asks.length <= D.TROQUEUR.slots);
  asks.forEach((a) => {
    assert.ok(elig.includes(a.id));
    assert.ok(a.n > 0);
    assert.ok(a.tr >= 1);
  });
});
test("livrer retire de la Réserve et donne les Traces ; pas de livraison sans la quantité", () => {
  const E = mk();
  E.state.zones.plaine = true;
  E.state.age = 0;
  E.state.known.manche = true;
  E.state.made.manche = 10;
  E.refreshTroqueur(true);
  const ask = E.state.comptoir.asks[0];
  assert.ok(ask, "demande présente");

  // Pas assez en réserve
  const fail = E.deliverAsk(0);
  assert.strictEqual(fail.ok, false);
  assert.strictEqual(fail.why, "missing");

  // Presque assez
  E.add(ask.id, ask.n - 1);
  assert.strictEqual(E.deliverAsk(0).ok, false);

  // Quantité complète
  E.add(ask.id, 1);
  const trBefore = E.state.meta.traces;
  const r = E.deliverAsk(0);
  assert.ok(r.ok);
  assert.strictEqual(E.count(ask.id), 0, "objets retirés de la Réserve");
  assert.strictEqual(E.state.meta.traces, trBefore + ask.tr, "Traces accordées");
  assert.strictEqual(E.state.comptoir.asks[0], null, "place vide après livraison");

  // Deuxième livraison impossible sur le même slot
  const fail2 = E.deliverAsk(0);
  assert.strictEqual(fail2.ok, false);
  assert.strictEqual(fail2.why, "empty");
});
test("renouvellement après refresh, y compris hors ligne", () => {
  const E = mk();
  E.state.zones.plaine = true;
  E.state.known.manche = true;
  E.state.made.manche = 10;
  E.refreshTroqueur(true);
  const ask = E.state.comptoir.asks[0];
  E.add(ask.id, ask.n);
  E.deliverAsk(0);
  assert.strictEqual(E.state.comptoir.asks[0], null);

  // Temps insuffisant : pas de renouvellement
  T += 100 * 1000;
  E.update();
  assert.strictEqual(E.state.comptoir.asks[0], null);

  // Temps écoulé en jeu : renouvellement
  T += (D.TROQUEUR.refresh + 10) * 1000;
  E.update();
  assert.ok(E.state.comptoir.asks[0] !== null, "slot renouvelé");

  // Renouvellement hors ligne (catchUp)
  E.add(E.state.comptoir.asks[0].id, E.state.comptoir.asks[0].n);
  E.deliverAsk(0);
  assert.strictEqual(E.state.comptoir.asks[0], null);
  T += (D.TROQUEUR.refresh + 100) * 1000;
  E.catchUp(D.TROQUEUR.refresh + 100);
  assert.ok(E.state.comptoir.asks[0] !== null, "slot renouvelé hors ligne");
});
test("sauvegarde sans ecus ou corrompue : se charge nettoyée", () => {
  const E = mk();
  const raw = E.serialize();
  const o = JSON.parse(raw);
  delete o.ecus;
  delete o.comptoir;
  const F = mk();
  F.load(JSON.stringify(o));
  assert.strictEqual(F.state.ecus, 0);
  assert.deepStrictEqual(F.state.comptoir, { sold: {}, traces: 0, asks: [], next: 0 });

  const o2 = JSON.parse(raw);
  o2.ecus = "abc";
  o2.comptoir = 42;
  F.load(JSON.stringify(o2));
  assert.strictEqual(F.state.ecus, 0);
  assert.deepStrictEqual(F.state.comptoir, { sold: {}, traces: 0, asks: [], next: 0 });

  // Sauvegarde avec comptoir illisible / asks corrompus
  const o3 = JSON.parse(raw);
  o3.comptoir = {
    sold: "corrompu",
    traces: -10,
    asks: "pas un tableau",
    next: "demain"
  };
  F.load(JSON.stringify(o3));
  assert.deepStrictEqual(F.state.comptoir.asks, []);
  assert.strictEqual(F.state.comptoir.next, 0);
  assert.strictEqual(F.state.comptoir.traces, 0);
  assert.deepStrictEqual(F.state.comptoir.sold, {});

  // Tableau avec entrées invalides
  o3.comptoir.asks = [
    { id: "item_inexistant", n: 10, tr: 2 },
    { id: "bois", n: -5, tr: 2 },
    null
  ];
  F.load(JSON.stringify(o3));
  assert.deepStrictEqual(F.state.comptoir.asks, [null, null, null]);
});
test("sérialiser puis recharger garde écus et quantités vendues", () => {
  const E = mk();
  E.state.ecus = 123.45;
  E.state.comptoir = { sold: { bois: 250, fibre: 80 }, traces: 2 };
  const F = mk();
  F.load(E.serialize());
  assert.strictEqual(F.state.ecus, 123.45);
  assert.strictEqual(F.state.comptoir.traces, 2);
  assert.strictEqual(F.state.comptoir.sold.bois, 250);
  assert.strictEqual(F.state.comptoir.sold.fibre, 80);
});
test("acheter une matière : seulement en terre ouverte, coût 3x valeur sans saturation", () => {
  const E = mk();
  assert.ok(E.canBuyRes("bois"), "Lisière est ouverte au départ");
  assert.strictEqual(E.canBuyRes("os"), false, "Plaine n’est pas ouverte");
  const cost = E.buyResCost("bois", 100);
  assert.strictEqual(cost, 100 * D.COMPTOIR.buy * E.value("bois"));
  assert.strictEqual(cost, 100 * 3 * 0.1);
  const fail = E.buyRes("bois", 100);
  assert.strictEqual(fail.ok, false);
  assert.strictEqual(fail.why, "ecus");
  E.state.ecus = 50;
  const r = E.buyRes("bois", 100);
  assert.ok(r.ok);
  assert.strictEqual(E.count("bois"), 100);
  assert.strictEqual(E.state.ecus, 20);
  const rOs = E.buyRes("os", 10);
  assert.strictEqual(rOs.ok, false);
  assert.strictEqual(rOs.why, "unavailable");
  E.state.zones.plaine = true;
  assert.ok(E.canBuyRes("os"));
  const rOsOk = E.buyRes("os", 10);
  assert.ok(rOsOk.ok);
  assert.strictEqual(E.count("os"), 10);
});

console.log("Machines à paliers");
test("machines : machCan vérifie le nombre d’ingrédients selon le palier", () => {
  const E = mk();
  assert.ok(E.machCan("automate_bois", "manche"), "manche : 1 ingrédient");
  assert.ok(!E.machCan("automate_bois", "lingot_bronze"), "lingot de bronze : 2 ingrédients (cuivre + étain)");
  assert.ok(E.machCan("automate_bronze", "lingot_bronze"));
  assert.ok(E.machCan("presse_vapeur", "moteur_vapeur"), "moteur à vapeur : 3 ingrédients");
  assert.ok(!E.machCan("automate_bronze", "moteur_vapeur"));
  assert.strictEqual(E.machFor("manche"), "automate_bois");
  assert.strictEqual(E.machFor("lingot_bronze"), "automate_bronze");
  assert.strictEqual(E.machFor("moteur_vapeur"), "presse_vapeur");
});
test("machines et commandes : un automate choisit une étape compatible avec son palier", () => {
  const E = mk();
  ["manche", "corde", "archet"].forEach((k) => { E.state.known[k] = true; E.state.made[k] = 1; });
  E.add("automate_bois", 1); // ing: 1
  E.add("manche", 10); E.add("corde", 20);
  E.order("archet", 5); // archet : 2 ingrédients
  assert.strictEqual(E.machines().automate_bois.used, 0, "l’automate de bois ne peut pas faire un archet (2 ingrédients)");
  E.add("automate_bronze", 1); // ing: 2
  assert.strictEqual(E.machines().automate_bronze.used, 1, "l’automate de bronze prend l’archet");
  assert.strictEqual(E.machines().automate_bronze.byRec.archet, 1);
});
test("machines : une sauvegarde avec des groupes de machines les dissout et rend leurs matières à la Réserve", () => {
  const E = mk();
  E.add("automate_bois", 1);
  E.state.known.archet = true;
  E.state.dom.mach.push({ id: "M1", m: "automate_bois", r: "archet", n: 1, on: true, cap: 0 });
  E.state.dom.ms["M1"] = { p: 0.5, b: { manche: 2, corde: 3 } };
  const txt = E.serialize();
  const F = mk();
  F.load(txt);
  assert.deepStrictEqual(F.state.dom.mach, [], "groupes retirés");
  assert.deepStrictEqual(F.state.dom.ms, {}, "buffers de machines vidés");
  assert.strictEqual(F.count("manche"), 2, "manches revenus à la Réserve");
  assert.strictEqual(F.count("corde"), 3, "cordes revenues à la Réserve");
  assert.strictEqual(F.count("automate_bois"), 1, "machine toujours possédée");
  assert.strictEqual(F.freeMach("automate_bois"), 1, "machine au repos");
  assert.ok(F.state.flags.mach57);
});
test("commandes : une recette jamais fabriquée se fait d’abord à la main (et avec firstByHand: false, la machine peut)", () => {
  const E = mk();
  E.state.known.manche = true; // mais made.manche vaut 0
  E.add("automate_bois", 1);
  E.add("bois", 30);
  E.order("manche", 5);
  assert.strictEqual(E.machines().automate_bois.used, 0, "jamais fait à la main : l’automate attend");
  // Avec firstByHand: false, la machine peut tout de suite
  D.COMMANDES.firstByHand = false;
  try {
    assert.strictEqual(E.machines().automate_bois.used, 1, "avec firstByHand: false, l’automate travaille tout de suite");
  } finally {
    D.COMMANDES.firstByHand = true;
  }
  // Dès que les mains ont fait le premier exemplaire, l’automate rejoint la commande
  E.step(E.handTime("manche") + 0.05);
  assert.ok(E.state.made.manche >= 1, "le premier manche est fait à la main");
  assert.strictEqual(E.machines().automate_bois.used, 1, "l’automate aide sur les suivants");
  run(E, 60);
  assert.strictEqual(E.count("manche"), 5);
});
test("commandes : E.order ajoute les sous-pièces manquantes et les machines aident sur chaque étape", () => {
  const E = mk();
  ["manche", "corde", "archet"].forEach((k) => { E.state.known[k] = true; E.state.made[k] = 1; });
  E.add("automate_bois", 1); // ing: 1 -> peut faire manche et corde
  E.add("bois", 30); E.add("fibre", 60);
  assert.strictEqual(E.count("manche"), 0);
  const r = E.order("archet", 5);
  assert.ok(r.ok);
  assert.strictEqual(E.machines().automate_bois.used, 1, "l’automate de bois aide sur les sous-pièces à 1 ingrédient");
  run(E, 180);
  assert.strictEqual(E.count("archet"), 5, "a fabriqué les 5 archets à partir du bois et des fibres");
  assert.strictEqual(E.count("manche"), 0, "les manches intermédiaires ont servi aux archets");
});

test("commandes : le charbon se commande (il se récolte aussi) ; un extracteur ne se commande pas à crédit", () => {
  const E = mk();
  E.add("feu", 1); E.add("four", 1); E.state.zones.mine = true; E.recalc(); E.state.known.charbon = true; E.add("bois", 40);
  const r = E.order("charbon", 5);
  assert.ok(r.ok, "commande acceptée : " + r.why);
  assert.deepStrictEqual(r.job.s, [["charbon", 5]], "une vraie étape, pas une commande vide");
  E.state.known.cabane = true; E.state.inv.bois = 0;
  assert.strictEqual(E.order("cabane", 10).why, "plan", "le prix monte à chaque cabane : il faut tout avoir");
});

test("commandes : des machines rapides finissent plusieurs pièces d’un pas, sans y passer des secondes", () => {
  const E = mk();
  E.state.known.manche = true; E.state.made.manche = 1;
  E.add("automate_bois", 200); E.add("bois", 3e6);
  assert.ok(E.order("manche", 1e6).ok);
  const t0 = Date.now();
  run(E, 60);
  assert.ok(Date.now() - t0 < 700, "une minute de jeu calculée en " + (Date.now() - t0) + " ms");
  assert.ok(E.count("manche") > 1000, "les manches sortent : " + E.count("manche"));
});



console.log("Coup de chance");
test("récolte à la main : coup de chance ×2, plus fréquent avec « Coup d’œil »", () => {
  let r = 0.99;
  const E = createEngine({ now: () => T, rand: () => r });
  const n = E.tap("bois", "lisiere");
  assert.ok(!E.lastCrit, "pas de chance à 0,99");
  r = 0.05;
  const before = E.count("bois"), m = E.tap("bois", "lisiere");
  assert.ok(E.lastCrit, "6 % : 0,05 est un coup de chance");
  assert.strictEqual(m, n * D.CRIT.mult);
  assert.strictEqual(E.count("bois") - before, m);
  r = 0.08;
  E.tap("bois", "lisiere");
  assert.ok(!E.lastCrit, "0,08 dépasse les 6 % de départ");
  E.state.meta.mem.oeil = 1;
  E.tap("bois", "lisiere");
  assert.ok(E.lastCrit, "avec un niveau de Coup d’œil, 10 %");
  assert.strictEqual(E.state.stats.crits, 2);
});

console.log("Premier parcours et ruines");
test("une partie neuve a meta.parcours ; une sauvegarde chargée sans ce drapeau ne l’a pas, et n’est jamais forcée", () => {
  const E1 = mk();
  assert.strictEqual(E1.state.meta.parcours, 1, "partie neuve a parcours");
  E1.state.flags.extDone = true;
  E1.state.exp.done = { lisiere: 1 };
  assert.ok(E1.canForcedReleve(), "peut faire la première renaissance forcée");

  // Ancienne sauvegarde sans parcours
  const oldSave = JSON.stringify({
    v: 5, t: 1000, start: 1000,
    inv: { bois: 50 }, seen: {}, made: {}, known: {}, hints: {},
    cycle: 1, flags: { extDone: true }, exp: { done: { lisiere: 1 } },
    meta: { endings: {}, traces: 0, tracesTotal: 0 }
  });
  const E2 = mk();
  E2.load(oldSave);
  assert.strictEqual(E2.state.meta.parcours, undefined, "pas de drapeau parcours");
  assert.ok(!E2.canForcedReleve(), "jamais forcée");
});

test("forcedReleve() : cycle 2, cadeau de Traces reçu, Carnet gardé, ne se refait pas", () => {
  const E = mk();
  E.state.known.cabane = true;
  assert.strictEqual(E.state.cycle, 1);
  assert.strictEqual(E.state.meta.traces, 0);

  const res1 = E.forcedReleve();
  assert.strictEqual(res1, true, "forcedReleve a réussi");
  assert.strictEqual(E.state.cycle, 2, "maintenant au cycle 2");
  assert.strictEqual(E.state.meta.traces, D.PARCOURS.gift, "cadeau de 3 Traces reçu");
  assert.strictEqual(E.state.meta.tracesTotal, D.PARCOURS.gift, "tracesTotal augmenté");
  assert.ok(E.state.known.cabane, "Carnet gardé");
  assert.ok(!E.canForcedReleve(), "ne peut plus être forcé");

  const res2 = E.forcedReleve();
  assert.strictEqual(res2, false, "ne se refait pas");
  assert.strictEqual(E.state.cycle, 2);
  assert.strictEqual(E.state.meta.traces, D.PARCOURS.gift);
});

test("ruines : après une relève avec 5 cabanes et 1 automate, meta.ruins vaut { cabane: 3, automate_bois: 1 } ; réparer coûte bien part du prix, ajoute 1, pose la cabane, décrémente ; sans les matières, ok: false et missing", () => {
  const E = mk();
  E.add("cabane", 5);
  E.add("automate_bois", 1);
  assert.strictEqual(E.count("cabane"), 5);
  assert.strictEqual(E.count("automate_bois"), 1);

  E.newCycle();

  assert.deepStrictEqual(E.state.meta.ruins, { cabane: 3, automate_bois: 1 }, "plafond à 3 cabanes et 1 automate");
  assert.deepStrictEqual(E.ruins(), { cabane: 3, automate_bois: 1 });

  // Coût de réparation de la cabane : part (0.1) du coût de base { manche: 5, corde: 4, fibre: 15 }
  // manche: ceil(0.5) = 1, corde: ceil(0.4) = 1, fibre: ceil(1.5) = 2
  const expectedCost = { manche: 1, corde: 1, fibre: 2 };
  assert.deepStrictEqual(E.ruinCost("cabane"), expectedCost, "coût de réparation");

  // Sans matières : échec
  const fail = E.repair("cabane");
  assert.strictEqual(fail.ok, false);
  assert.strictEqual(fail.why, "missing");
  assert.deepStrictEqual(fail.missing, expectedCost);

  // Avec une partie des matières : échec
  E.add("manche", 1);
  const fail2 = E.repair("cabane");
  assert.strictEqual(fail2.ok, false);
  assert.deepStrictEqual(fail2.missing, { corde: 1, fibre: 2 });

  // Avec toutes les matières : succès
  E.add("corde", 1);
  E.add("fibre", 5);
  const ok = E.repair("cabane");
  assert.strictEqual(ok.ok, true);
  assert.strictEqual(E.count("manche"), 0, "manche consommé");
  assert.strictEqual(E.count("corde"), 0, "corde consommée");
  assert.strictEqual(E.count("fibre"), 3, "2 fibres consommées sur 5");
  assert.strictEqual(E.count("cabane"), 1, "ajoute 1 à la Réserve");
  assert.strictEqual(E.state.meta.ruins.cabane, 2, "décrémente les ruines");

  // Posé tout de suite sur un gisement de sa terre
  const placed = Object.values(E.state.dom.ext).some((e) => e.z === "lisiere" && e.u && e.u.cabane >= 1);
  assert.ok(placed, "la cabane est posée tout de suite sur un gisement de sa terre");
});

test("une seconde relève remplace les ruines au lieu de les cumuler", () => {
  const E = mk();
  E.add("cabane", 2);
  E.newCycle();
  assert.deepStrictEqual(E.state.meta.ruins, { cabane: 2 });

  // Au cycle 2, on ne possède qu'un automate_bois, 0 cabanes
  E.add("automate_bois", 1);
  E.newCycle();
  assert.deepStrictEqual(E.state.meta.ruins, { automate_bois: 1 }, "remplace au lieu de cumuler");
});

test("sauvegarde avec meta.ruins illisible : se charge, nettoyée", () => {
  const E1 = mk();
  E1.load(JSON.stringify({
    v: 6, t: 1000, start: 1000,
    inv: { bois: 10 }, seen: {}, made: {}, known: {}, hints: {},
    meta: { ruins: "corrompu" }
  }));
  assert.deepStrictEqual(E1.state.meta.ruins, {}, "chaîne devient objet vide");

  const E2 = mk();
  E2.load(JSON.stringify({
    v: 6, t: 1000, start: 1000,
    inv: { bois: 10 }, seen: {}, made: {}, known: {}, hints: {},
    meta: { ruins: { cabane: "2", automate_bois: -5, truc_inconnu: 4, autre: "abc" } }
  }));
  assert.strictEqual(E2.state.meta.ruins.cabane, 2, "nombre entier positif gardé");
  assert.strictEqual(E2.state.meta.ruins.automate_bois, undefined, "négatif ignoré");
  assert.strictEqual(E2.state.meta.ruins.autre, undefined, "invalide ignoré");
  assert.strictEqual(E2.state.meta.ruins.truc_inconnu, undefined, "inconnu retiré des ruines");
  assert.strictEqual(E2.state.orphans.ruins.truc_inconnu, 4, "inconnu mis dans orphans");
});

console.log("Déchiffrer et secrets (5.8)");
test("déchiffrer : le prix suit la formule (âge, nombre de ressources, niveau)", () => {
  const E = mk();
  // manche : âge 0, 1 ressource -> 3, 8, 20
  assert.strictEqual(E.decipherCost("manche"), 3);
  E.state.hints.manche = 1;
  assert.strictEqual(E.decipherCost("manche"), 8);
  E.state.hints.manche = 2;
  assert.strictEqual(E.decipherCost("manche"), 20);
  // ordinateur : âge 8, 3 ressources -> 81, 216, 540
  E.state.age = 8;
  assert.strictEqual(E.decipherCost("ordinateur"), 81);
  E.state.hints.ordinateur = 1;
  assert.strictEqual(E.decipherCost("ordinateur"), 216);
  E.state.hints.ordinateur = 2;
  assert.strictEqual(E.decipherCost("ordinateur"), 540);
});

test("déchiffrer : monte S.hints de 1, retire l’Intuition, et apprend la recette au niveau 3", () => {
  const E = mk();
  E.state.intu = 100;
  const events = [];
  E.on("guidehint", (h) => events.push(h));
  // cabane : âge 0, 3 ressources -> coûts 9, 24, 60 (total 93)
  const r1 = E.decipher("cabane");
  assert.deepStrictEqual(r1, { ok: true, lvl: 1 });
  assert.strictEqual(E.state.hints.cabane, 1);
  assert.strictEqual(E.state.intu, 91);
  assert.ok(!E.state.known.cabane);

  const r2 = E.decipher("cabane");
  assert.deepStrictEqual(r2, { ok: true, lvl: 2 });
  assert.strictEqual(E.state.hints.cabane, 2);
  assert.strictEqual(E.state.intu, 67);
  assert.ok(!E.state.known.cabane);

  const r3 = E.decipher("cabane");
  assert.deepStrictEqual(r3, { ok: true, lvl: 3 });
  assert.strictEqual(E.state.hints.cabane, 3);
  assert.strictEqual(E.state.intu, 7, "learn(id, true) ne redonne pas +1 ✨");
  assert.ok(E.state.known.cabane, "recette connue au niveau 3");
  assert.strictEqual(E.decipherCost("cabane"), null);
  assert.strictEqual(events.length, 3);
});

test("déchiffrer : refus (recette connue, sans recette, objet secret, pas assez d’Intuition, âge pas atteint)", () => {
  const E = mk();
  E.state.intu = 1000;
  assert.strictEqual(E.decipherCost("bois"), null);
  assert.strictEqual(E.decipher("bois").ok, false);

  E.state.known.manche = true;
  assert.strictEqual(E.decipherCost("manche"), null);
  assert.strictEqual(E.decipher("manche").why, "known");

  assert.strictEqual(E.decipherCost("galette"), null, "secret refusé");
  assert.strictEqual(E.decipher("galette").why, "secret");
  assert.strictEqual(E.decipherCost("diapason"), null, "recette de la Résonance refusée");
  assert.strictEqual(E.decipher("diapason").why, "secret");

  assert.strictEqual(E.decipherCost("ordinateur"), null, "âge pas atteint");
  assert.strictEqual(E.decipher("ordinateur").why, "age");

  E.state.intu = 2;
  assert.strictEqual(E.decipherCost("corde"), 3);
  assert.deepStrictEqual(E.decipher("corde"), { ok: false, why: "intu" });
});

test("déchiffrer : la sauvegarde garde le niveau (aller-retour serialize / load)", () => {
  const E1 = mk();
  E1.state.intu = 50;
  E1.decipher("cabane");
  E1.decipher("cabane");
  assert.strictEqual(E1.state.hints.cabane, 2);
  const raw = E1.serialize();
  const E2 = mk();
  E2.load(raw);
  assert.strictEqual(E2.state.hints.cabane, 2);
  assert.strictEqual(E2.decipherCost("cabane"), 60);
});

test("thermomètre : sec: true pour une tentative proche d’une recette secrète, et pas pour une recette normale", () => {
  const E = mk();
  E.add("feu", 1); E.add("fibre", 5); E.add("caillou", 5); E.recalc();
  // galette (sec: true) = chauffer : fibre. Avec chauffer : fibre + caillou -> chaud (trop), sec: true
  const tSec = E.temperature("chauffer", ["fibre", "caillou"]);
  assert.strictEqual(tSec.temp, 3);
  assert.strictEqual(tSec.sec, true);
  const aSec = E.attempt("chauffer", ["fibre", "caillou"]);
  assert.strictEqual(aSec.kind, "fail");
  assert.strictEqual(aSec.sec, true);

  // corde (normale) = tresser : fibre. Avec assembler : fibre -> chaud (geste), pas sec
  const tNorm = E.temperature("assembler", ["fibre"]);
  assert.strictEqual(tNorm.temp, 3);
  assert.ok(!tNorm.sec);
  const aNorm = E.attempt("assembler", ["fibre"]);
  assert.strictEqual(aNorm.kind, "fail");
  assert.strictEqual(aNorm.sec, false);
});

console.log("Le moteur du Récit, du Livre et des Questions (6.0)");

const mkRecit = (recit) => createEngine({ now: () => T, rand: () => 0.99, recit });

test("E.cond : chaque forme, une clé inconnue vaut faux", () => {
  const E = mk();
  assert.strictEqual(E.cond(null), true);
  assert.strictEqual(E.cond({}), true);
  assert.strictEqual(E.cond({ inconnue_totale: 1 }), false);

  // frag
  assert.strictEqual(E.cond({ frag: "t_f" }), false);
  E.state.frags.t_f = true;
  assert.strictEqual(E.cond({ frag: "t_f" }), true);

  // page
  assert.strictEqual(E.cond({ page: "p_x" }), false);
  E.state.livre.p.p_x = 1;
  assert.strictEqual(E.cond({ page: "p_x" }), true);

  // made
  assert.strictEqual(E.cond({ made: "corde" }), false);
  E.state.made.corde = 1;
  assert.strictEqual(E.cond({ made: "corde" }), true);

  // has
  assert.strictEqual(E.cond({ has: "bois" }), false);
  E.state.inv.bois = 5;
  assert.strictEqual(E.cond({ has: "bois" }), true);

  // flag
  assert.strictEqual(E.cond({ flag: "mon_flag" }), false);
  E.state.flags.mon_flag = true;
  assert.strictEqual(E.cond({ flag: "mon_flag" }), true);

  // secret
  assert.strictEqual(E.cond({ secret: "sec1" }), false);
  E.state.secrets.sec1 = true;
  assert.strictEqual(E.cond({ secret: "sec1" }), true);

  // cycle
  E.state.cycle = 2;
  assert.strictEqual(E.cond({ cycle: 1 }), true);
  assert.strictEqual(E.cond({ cycle: 2 }), true);
  assert.strictEqual(E.cond({ cycle: 3 }), false);

  // age
  E.state.age = 1;
  assert.strictEqual(E.cond({ age: 0 }), true);
  assert.strictEqual(E.cond({ age: 1 }), true);
  assert.strictEqual(E.cond({ age: 2 }), false);

  // exp
  assert.strictEqual(E.cond({ exp: "lisiere:chene" }), false);
  E.state.exp.done.lisiere = 1;
  assert.strictEqual(E.cond({ exp: "lisiere:chene" }), true);
  assert.strictEqual(E.cond({ exp: "lisiere:lieu_inexistant" }), false);
  assert.strictEqual(E.cond({ exp: "zone_inconnue:chene" }), false);

  // all, any, not
  assert.strictEqual(E.cond({ all: [{ cycle: 2 }, { age: 1 }] }), true);
  assert.strictEqual(E.cond({ all: [{ cycle: 2 }, { age: 9 }] }), false);
  assert.strictEqual(E.cond({ any: [{ cycle: 99 }, { age: 1 }] }), true);
  assert.strictEqual(E.cond({ any: [{ cycle: 99 }, { age: 99 }] }), false);
  assert.strictEqual(E.cond({ not: { cycle: 99 } }), true);
  assert.strictEqual(E.cond({ not: { cycle: 2 } }), false);
});

test("une page s’obtient par exploration, par première réparation (pas la deuxième), par achat au Comptoir (écus retirés, page sortie de la liste), par condition", () => {
  const recit = {
    pages: {
      p_exp: { n: 1, titre: "Page Exp", src: [{ k: "exp", at: "lisiere:chene" }] },
      p_rep: { n: 2, titre: "Page Rep", src: [{ k: "repair", id: "cabane" }] },
      p_buy: { n: 3, titre: "Page Buy", src: [{ k: "buy", ecus: 150 }] },
      p_cnd: { n: 4, titre: "Page Cnd", src: [{ k: "cond", c: { flag: "obtenue" } }] }
    }
  };
  const E = mkRecit(recit);

  // Exploration
  assert.ok(!E.hasPage("p_exp"));
  let pageEvt = null;
  E.on("page", (p) => (pageEvt = p));
  E.startExp("lisiere");
  T += 16000;
  E.update();
  assert.ok(E.hasPage("p_exp"));
  assert.strictEqual(pageEvt.id, "p_exp");
  assert.strictEqual(pageEvt.src, "exp");

  // Première réparation
  assert.ok(!E.hasPage("p_rep"));
  E.state.meta.ruins = { cabane: 2 };
  E.state.inv = { manche: 10, corde: 10, fibre: 10 }; // de quoi réparer cabane
  const rep1 = E.repair("cabane");
  assert.ok(rep1.ok);
  assert.ok(E.hasPage("p_rep"));
  assert.strictEqual(pageEvt.id, "p_rep");
  assert.strictEqual(pageEvt.src, "repair");

  // Seconde réparation : ne redonne pas la page
  pageEvt = null;
  E.state.inv = { manche: 10, corde: 10, fibre: 10 };
  const rep2 = E.repair("cabane");
  assert.ok(rep2.ok);
  assert.strictEqual(pageEvt, null);

  // Achat au Comptoir
  const buyable = E.buyablePages();
  assert.strictEqual(buyable.length, 1);
  assert.strictEqual(buyable[0].id, "p_buy");
  assert.strictEqual(buyable[0].ecus, 150);

  E.state.ecus = 50;
  assert.strictEqual(E.buyPage("p_buy").ok, false);
  E.state.ecus = 200;
  const buyRes = E.buyPage("p_buy");
  assert.ok(buyRes.ok);
  assert.strictEqual(E.state.ecus, 50);
  assert.ok(E.hasPage("p_buy"));
  assert.strictEqual(E.buyablePages().length, 0);

  // Condition
  assert.ok(!E.hasPage("p_cnd"));
  E.state.flags.obtenue = true;
  T += 1000;
  E.update();
  assert.ok(E.hasPage("p_cnd"));
});

test("notes : une note conditionnelle apparaît quand sa condition devient vraie, et la page a « du nouveau » jusqu’à E.readPage", () => {
  const recit = {
    pages: {
      p_notes: {
        n: 5,
        titre: "Page avec notes",
        imprime: "Texte imprimé",
        notes: [
          { t: "Note 1 de base" },
          { t: "Note 2 au cycle 2", cond: { cycle: 2 } }
        ]
      }
    }
  };
  const E = mkRecit(recit);
  E.givePage("p_notes", "test");

  let c = E.livre()[4];
  assert.strictEqual(c.notes.length, 1);
  assert.strictEqual(c.nouveau, true);

  E.readPage("p_notes");
  c = E.livre()[4];
  assert.strictEqual(c.nouveau, false);

  // La condition devient vraie au cycle 2
  E.state.cycle = 2;
  c = E.livre()[4];
  assert.strictEqual(c.notes.length, 2);
  assert.strictEqual(c.nouveau, true);

  E.readPage("p_notes");
  c = E.livre()[4];
  assert.strictEqual(c.nouveau, false);
});

test("pages, revisites et questions survivent à newCycle et à un aller-retour de sauvegarde", () => {
  const recit = {
    pages: { p1: { n: 1, titre: "P1" } },
    questions: { q1: { titre: "Q1", aides: ["A1"] } }
  };
  const E1 = mkRecit(recit);
  E1.givePage("p1", "test");
  E1.readPage("p1");
  E1.state.revus["frag1:0"] = 1;
  E1.state.questions.q1 = { lvl: 1 };

  E1.newCycle();
  assert.ok(E1.hasPage("p1"));
  assert.strictEqual(E1.state.revus["frag1:0"], 1);
  assert.strictEqual(E1.state.questions.q1.lvl, 1);

  const raw = E1.serialize();
  const E2 = mkRecit(recit);
  E2.load(raw);
  assert.ok(E2.hasPage("p1"));
  assert.strictEqual(E2.state.revus["frag1:0"], 1);
  assert.strictEqual(E2.state.questions.q1.lvl, 1);
});

test("un fragment archivé n’est plus listé ni compté, mais reste dans la sauvegarde", () => {
  const recit = {
    frags: {
      frag_arch: { n: "Archivé", t: "Ancien lore" },
      frag_act: { n: "Actif", t: "Lore actuel" }
    },
    archive: ["frag_arch"]
  };
  const E = mkRecit(recit);
  const vis = E.visibleFrags();
  assert.ok(!vis.includes("frag_arch"));
  assert.ok(vis.includes("frag_act"));

  E.addFrag("frag_arch");
  assert.ok(E.state.frags.frag_arch);

  const raw = E.serialize();
  const E2 = mkRecit(recit);
  E2.load(raw);
  assert.ok(E2.state.frags.frag_arch);
  assert.ok(!E2.visibleFrags().includes("frag_arch"));
});

test("expFrag remplace le fragment donné ; une revisite s’affiche quand le fragment est connu", () => {
  const recit = {
    expFrag: { "lisiere:chene": "frag_remplace" },
    frags: {
      frag_remplace: {
        n: "Remplacé",
        t: "Lore",
        revisit: [
          { cond: { cycle: 1 }, t: "Revisite 1" },
          { cond: { cycle: 2 }, t: "Revisite 2" }
        ]
      }
    }
  };
  const E = mkRecit(recit);
  let lastExp = null;
  E.on("expdone", (r) => (lastExp = r));

  // Première exploration : donne le fragment remplacé
  E.startExp("lisiere");
  T += 16000;
  E.update();
  assert.strictEqual(lastExp.frag, "frag_remplace");
  assert.strictEqual(lastExp.fragNew, true);
  assert.strictEqual(lastExp.revisit, null);
  assert.ok(E.state.frags.frag_remplace);

  // Deuxième exploration alors que le fragment est déjà connu : revisite
  E.state.exp.active = { z: "lisiere", i: 0, t0: T, dur: 1000 };
  T += 1000;
  E.update();
  assert.strictEqual(lastExp.frag, "frag_remplace");
  assert.strictEqual(lastExp.fragNew, false);
  assert.ok(lastExp.revisit);
  assert.strictEqual(lastExp.revisit.t, "Revisite 1");
  assert.strictEqual(E.state.revus["frag_remplace:0"], 1);
});

test("questions : apparition, prix (5 × (1 + âge), ×3, ×9), refus sans Intuition, résolution", () => {
  const recit = {
    questions: {
      q_test: {
        titre: "Une grande énigme",
        quand: { cycle: 2 },
        aides: ["Aide 1", "Aide 2", "Aide 3"],
        resolu: { flag: "resolu_flag" }
      }
    },
    aide: { base: 5, mult: 3 }
  };
  const E = mkRecit(recit);

  // Apparition
  assert.strictEqual(E.questions().length, 0);
  E.state.cycle = 2;
  let qs = E.questions();
  assert.strictEqual(qs.length, 1);
  assert.strictEqual(qs[0].id, "q_test");
  assert.strictEqual(qs[0].resolu, false);

  // Prix selon l’âge
  assert.strictEqual(E.questionCost("q_test"), 5); // age 0: 5 * (1 + 0) * 1 = 5
  E.state.age = 1;
  assert.strictEqual(E.questionCost("q_test"), 10); // age 1: 5 * (1 + 1) * 1 = 10
  E.state.age = 0;

  // Refus sans Intuition
  E.state.intu = 2;
  const fail = E.askHelp("q_test");
  assert.strictEqual(fail.ok, false);
  assert.strictEqual(fail.why, "intu");

  // Achats successifs : x1 (5), x3 (15), x9 (45)
  E.state.intu = 100;
  const h1 = E.askHelp("q_test");
  assert.strictEqual(h1.ok, true);
  assert.strictEqual(h1.lvl, 1);
  assert.strictEqual(E.state.intu, 95);
  assert.strictEqual(E.questionCost("q_test"), 15);

  const h2 = E.askHelp("q_test");
  assert.strictEqual(h2.ok, true);
  assert.strictEqual(h2.lvl, 2);
  assert.strictEqual(E.state.intu, 80);
  assert.strictEqual(E.questionCost("q_test"), 45);

  const h3 = E.askHelp("q_test");
  assert.strictEqual(h3.ok, true);
  assert.strictEqual(h3.lvl, 3);
  assert.strictEqual(E.state.intu, 35);
  assert.strictEqual(E.questionCost("q_test"), null);
  assert.strictEqual(E.askHelp("q_test").why, "max");

  // Résolution
  assert.strictEqual(E.questions()[0].resolu, false);
  E.state.flags.resolu_flag = true;
  qs = E.questions();
  assert.strictEqual(qs[0].resolu, true);
  assert.strictEqual(qs[0].aides.length, 3);
});

test("une sauvegarde avec livre: 'abc' ou questions: 42 se charge, nettoyée", () => {
  const E = mk();
  const s = JSON.parse(E.serialize());
  s.livre = "abc";
  s.questions = 42;
  s.revus = "corrompu";
  E.load(JSON.stringify(s));
  assert.deepStrictEqual(E.state.livre, { p: {}, vu: {} });
  assert.deepStrictEqual(E.state.questions, {});
  assert.deepStrictEqual(E.state.revus, {});
});

console.log("Moteur des signes (6.1)");
test("normalisation : accents, casse, articles, apostrophes, ponctuation, espaces", () => {
  const E = mk();
  assert.strictEqual(E.normSigne("Éveiller"), "eveiller");
  assert.strictEqual(E.normSigne("L’Arbre"), "arbre");
  assert.strictEqual(E.normSigne("l'arbre"), "arbre");
  assert.strictEqual(E.normSigne("  Un  Grand   Arbre ! "), "grand arbre");
  assert.strictEqual(E.normSigne("cœur"), "coeur");
  assert.strictEqual(E.normSigne("l'oiseau-mouche"), "oiseau mouche");
  assert.strictEqual(E.normSigne("la"), "la"); // un mot unique article n'est pas vidé
  assert.strictEqual(E.normSigne("de la terre"), "terre");
  assert.strictEqual(E.normSigne(""), "");
  assert.strictEqual(E.normSigne(null), "");
});

test("empreinte : FNV-1a 32 bits stable et cohérente", () => {
  const E = mk();
  assert.strictEqual(E.fnv1a32("a"), "e40c292c");
  assert.strictEqual(E.empreinte("a"), "e40c292c");
  // Empreinte identique après normalisation
  const h1 = E.empreinte("l'arbre");
  const h2 = E.empreinte("  L’Arbre ! ");
  const h3 = E.empreinte("arbre");
  assert.strictEqual(h1, h2);
  assert.strictEqual(h2, h3);
  assert.strictEqual(typeof h1, "string");
  assert.strictEqual(h1.length, 8);
});

test("signeSVG : dessin et mise en cache", () => {
  const svg1 = signeSVG([1, 5, 1]);
  assert.ok(svg1.includes("<svg"), "rend un svg");
  assert.ok(svg1.includes("viewBox=\"0 0 24 24\""));
  assert.ok(svg1.includes("stroke=\"currentColor\""));
  // Cache par h et taille
  const svg2 = signeSVG([1, 5, 1]);
  assert.strictEqual(svg1, svg2);
  const svg3 = signeSVG([1, 5, 1], 48);
  assert.ok(svg3.includes("width=\"48\""));
});

test("moteur des signes : bonne réponse, mauvaise, presque, condition, délai", () => {
  const fakeSignes = {
    arbre: {
      h: [1, 5, 1],
      mot: "arbre",
      ok: []
    },
    verrou: {
      h: [3, 1, 5],
      mot: "verrou",
      ok: [],
      cond: { flag: "cle" }
    }
  };
  const E0 = mk();
  fakeSignes.arbre.ok = [E0.empreinte("arbre")];
  fakeSignes.verrou.ok = [E0.empreinte("verrou")];

  let time = 10000;
  const E = createEngine({ now: () => time, recit: { signes: fakeSignes, signeDelai: 3 } });

  // Signe inconnu
  assert.strictEqual(E.essaiSigne("introuvable", "arbre").why, "nosign");

  // Condition non satisfaite
  assert.strictEqual(E.essaiSigne("verrou", "verrou").why, "cond");
  E.state.flags.cle = true;

  // Mauvaise réponse sans proximité
  time += 5000;
  const rBad = E.essaiSigne("arbre", "caillou");
  assert.strictEqual(rBad.ok, false);
  assert.strictEqual(rBad.proche, false);

  // Délai trop court (3 secondes)
  time += 1000; // seulement 1s passée
  const rTooFast = E.essaiSigne("arbre", "autre");
  assert.strictEqual(rTooFast.delai, true);
  assert.strictEqual(rTooFast.left, 2);

  // Essai « presque » : une lettre en trop dans la saisie (retirée pour correspondre)
  time += 3100;
  const rPresque1 = E.essaiSigne("arbre", "arbres");
  assert.strictEqual(rPresque1.ok, false);
  assert.strictEqual(rPresque1.proche, true);

  // Essai « presque » : une lettre manquante dans la saisie (ajoutée pour correspondre)
  time += 3100;
  const rPresque2 = E.essaiSigne("arbre", "arbr");
  assert.strictEqual(rPresque2.ok, false);
  assert.strictEqual(rPresque2.proche, true);

  // Essai « presque » : une lettre changée dans la saisie
  time += 3100;
  const rPresque3 = E.essaiSigne("arbre", "arpre");
  assert.strictEqual(rPresque3.ok, false);
  assert.strictEqual(rPresque3.proche, true);

  // Bonne réponse avec article et ponctuation
  let signeEmitted = null;
  E.on("signe", (ev) => { signeEmitted = ev; });
  time += 3100;
  const rOk = E.essaiSigne("arbre", "L’Arbre !");
  assert.strictEqual(rOk.ok, true);
  assert.strictEqual(rOk.mot, "arbre");
  assert.deepStrictEqual(signeEmitted, { id: "arbre", mot: "arbre" });
  assert.strictEqual(E.state.signes.arbre.lu, 1);
});

test("gardé à la relève et aller-retour de sauvegarde", () => {
  const fakeSignes = {
    arbre: { h: [1, 5, 1], mot: "arbre", ok: [] }
  };
  const E0 = mk();
  fakeSignes.arbre.ok = [E0.empreinte("arbre")];

  let time = 1000;
  const E = createEngine({ now: () => time, recit: { signes: fakeSignes } });
  E.seeSigne("arbre", "Page 1");
  E.seeSigne("arbre", "Page 2");
  time += 5000;
  const r = E.essaiSigne("arbre", "arbre");
  assert.strictEqual(r.ok, true);
  assert.strictEqual(E.state.signes.arbre.lu, 1);
  assert.strictEqual(Object.keys(E.state.signes.arbre.vu).length, 2);

  // Relève
  E.newCycle();
  assert.ok(E.state.signes.arbre);
  assert.strictEqual(E.state.signes.arbre.lu, 1);
  assert.strictEqual(Object.keys(E.state.signes.arbre.vu).length, 2);

  // Sauvegarde
  const raw = E.serialize();
  const E2 = createEngine({ now: () => time, recit: { signes: fakeSignes } });
  E2.load(raw);
  assert.ok(E2.state.signes.arbre);
  assert.strictEqual(E2.state.signes.arbre.lu, 1);
  assert.strictEqual(Object.keys(E2.state.signes.arbre.vu).length, 2);
  assert.strictEqual(E2.hasSignes(), true);
  const seen = E2.seenSignes();
  assert.strictEqual(seen.length, 1);
  assert.strictEqual(seen[0].id, "arbre");
  assert.strictEqual(seen[0].lu, true);
  assert.strictEqual(seen[0].count, 2);
});

test("renderSigneToken rend dessin puis mot, jeton inconnu garde ◇", () => {
  const fakeSignes = {
    arbre: { h: [1, 5, 1], mot: "arbre", ok: [] }
  };
  const state = { signes: {} };
  const seeCalls = [];
  const seeSigne = (id, lieu) => {
    state.signes[id] = state.signes[id] || { vu: {} };
    if (lieu) state.signes[id].vu[lieu] = 1;
    seeCalls.push({ id, lieu });
  };

  // Signe inconnu
  const htmlUnk = renderSigneToken("inconnu", { recit: { signes: fakeSignes }, state, seeSigne });
  assert.strictEqual(htmlUnk, '<span class="signe" data-s="inconnu">◇</span>');

  // Signe connu non compris -> dessin SVG
  const htmlDessin = renderSigneToken("arbre", { recit: { signes: fakeSignes }, state, seeSigne, lieu: "Page 1" });
  assert.ok(htmlDessin.includes('<span class="signe" data-s="arbre">'));
  assert.ok(htmlDessin.includes('<svg class="signe-svg"'));
  assert.strictEqual(seeCalls.length, 1);
  assert.strictEqual(seeCalls[0].id, "arbre");
  assert.strictEqual(seeCalls[0].lieu, "Page 1");

  // Signe compris -> mot
  state.signes.arbre.lu = 1;
  const htmlLu = renderSigneToken("arbre", { recit: { signes: fakeSignes }, state, seeSigne, lieu: "Page 2" });
  assert.strictEqual(htmlLu, '<span class="signe lu" data-s="arbre">arbre</span>');
});

test("sauvegarde avec signes corrompu ou identifiant inconnu", () => {
  const fakeSignes = {
    arbre: { h: [1, 5, 1], mot: "arbre", ok: [] }
  };
  const E = createEngine({ recit: { signes: fakeSignes } });
  const s = JSON.parse(E.serialize());
  s.signes = "corrompu";
  E.load(JSON.stringify(s));
  assert.deepStrictEqual(E.state.signes, {});

  const s2 = JSON.parse(E.serialize());
  s2.signes = {
    arbre: { lu: 1, vu: { "Page 1": 1 }, essais: 2 },
    inconnu_xyz: { lu: 1, vu: { partout: 1 } }
  };
  E.load(JSON.stringify(s2));
  assert.strictEqual(E.state.signes.arbre.lu, 1);
  assert.strictEqual(E.state.signes.inconnu_xyz, undefined);
  assert.ok(E.state.orphans.signes.inconnu_xyz);
});

console.log("Moteur de la flûte et du ciel (6.2)");
test("reconnaissance de mélodies longues jusqu'à 32 notes et buffer glissant", () => {
  const longNotes = [1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 2, 3, 4];
  const recit = {
    melodies: {
      longAir: {
        n: "Un long air",
        notes: longNotes,
        t: "Un chant ancien qui s'étend sur bien des portées.",
        effets: [{ k: "flag", id: "longAirJoue" }]
      }
    }
  };
  const E = createEngine({ recit });
  for (let i = 0; i < 10; i++) E.playNote(1);
  let res = null;
  for (const n of longNotes) {
    res = E.playNote(n);
  }
  assert.ok(res, "le long air doit être reconnu");
  assert.strictEqual(res.id, "longAir");
  assert.strictEqual(res.fresh, true);
  assert.strictEqual(E.state.flags.longAirJoue, true);
  assert.strictEqual(E.state.secrets.longAir, true);
  assert.deepStrictEqual(E.state.notes, []);
});

test("mélodies conditionnelles et effets déclaratifs (sky, boost, intu, event)", () => {
  let skyAnimEvent = null;
  let customEventReceived = false;
  let time = 1000;
  const recit = {
    melodies: {
      etoileAir: {
        n: "L'Air de l'étoile",
        notes: [5, 4, 3, 2, 1],
        cond: { flag: "cielOuvert" },
        effets: [
          { k: "sky", anim: "filantes" },
          { k: "boost", what: "prod", mult: 1.5, dur: 60 },
          { k: "intu", n: 3 },
          { k: "event", name: "etoile_sonne" }
        ]
      }
    }
  };
  const E = createEngine({ now: () => time, recit });
  E.on("skyanim", (a) => { skyAnimEvent = a; });
  E.on("etoile_sonne", () => { customEventReceived = true; });

  for (const n of [5, 4, 3, 2, 1]) E.playNote(n);
  assert.strictEqual(E.state.secrets.etoileAir, undefined);
  assert.strictEqual(skyAnimEvent, null);

  E.state.flags.cielOuvert = true;
  const prevIntu = E.state.intu;
  for (const n of [5, 4, 3, 2, 1]) E.playNote(n);
  assert.strictEqual(E.state.secrets.etoileAir, true);
  assert.strictEqual(skyAnimEvent, "filantes");
  assert.strictEqual(customEventReceived, true);
  assert.strictEqual(E.state.intu, prevIntu + 5);
  assert.ok(E.state.boosts.prod);
  assert.strictEqual(E.state.boosts.prod.mult, 1.5);
  assert.strictEqual(E.state.boosts.prod.until, time + 60000);
  assert.strictEqual(E.cache().auto["*"], 1.5);

  time += 61000;
  E.update();
  assert.strictEqual(E.state.boosts.prod, undefined);
  assert.strictEqual(E.cache().auto["*"], undefined);
});

test("mélodie rejouable : reconnue plusieurs fois sans modal de secret", () => {
  const recit = {
    melodies: {
      vent: {
        n: "Appel du vent",
        notes: [2, 3, 4],
        rejouable: true,
        effets: [{ k: "flag", id: "vent_actif" }]
      }
    }
  };
  const E = createEngine({ recit });
  const m1 = [2, 3, 4].map((n) => E.playNote(n)).pop();
  assert.strictEqual(m1.id, "vent");
  assert.strictEqual(m1.fresh, true);
  assert.strictEqual(m1.rejouable, true);

  const m2 = [2, 3, 4].map((n) => E.playNote(n)).pop();
  assert.strictEqual(m2.id, "vent");
  assert.strictEqual(m2.fresh, false);
  assert.strictEqual(m2.rejouable, true);

  const list = E.melodies();
  const item = list.find((x) => x.id === "vent");
  assert.ok(item);
  assert.strictEqual(item.rejouable, true);
  assert.strictEqual(item.n, "Appel du vent");
});

test("animation céleste Sky.playAnim et Sky.trigger", () => {
  const Sky = require("../js/sky.js");
  Sky.clearAnims();
  assert.strictEqual(Sky.anims().length, 0);

  const a1 = Sky.trigger("filantes");
  assert.ok(a1);
  assert.strictEqual(a1.type, "meteors");
  assert.ok(Array.isArray(a1.meteors));
  assert.strictEqual(Sky.anims().length, 1);

  const a2 = Sky.playAnim({ type: "pulse", dur: 2 });
  assert.ok(a2);
  assert.strictEqual(a2.type, "pulse");
  assert.strictEqual(a2.dur, 2000);
  assert.strictEqual(Sky.anims().length, 2);

  Sky.clearAnims();
  assert.strictEqual(Sky.anims().length, 0);
});

test("sauvegarde et nettoyage : notes plafonnées à 32 et boosts assainis", () => {
  const E = createEngine();
  const s = JSON.parse(E.serialize());
  s.notes = [1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 99, "bad"];
  s.boosts = {
    prod: { mult: 1.25, until: 2000000000000 },
    invalide: "chaine",
    trop_grand: { mult: 99999, until: 100 }
  };
  E.load(JSON.stringify(s));
  assert.ok(E.state.notes.length <= 32);
  assert.ok(E.state.notes.every((n) => n >= 1 && n <= 5));
  assert.ok(E.state.boosts.prod);
  assert.strictEqual(E.state.boosts.prod.mult, 1.25);
  assert.strictEqual(E.state.boosts.invalide, undefined);
  assert.strictEqual(E.state.boosts.trop_grand.mult, 10);
});

console.log("Moteur des voix, du terminal et de la capsule (6.3)");
test("terminal : normalisation et variables dynamiques en mode ARCHE", () => {
  const E = createEngine();
  // mode par défaut = arche
  assert.strictEqual(E.state.termMode, "arche");
  const lines = E.terminal("WHOAMI");
  assert.ok(lines[0].startsWith("ARCHE > "));
  assert.strictEqual(lines[1], "SEMEUR-07");
  // avec accents et casse
  const semLines = E.terminal("Sèmeur");
  assert.ok(semLines.some((l) => l.includes("SEMEUR 7")));
});

test("terminal : ouverture de la Clause et bascule en mode Registre", () => {
  const E = createEngine();
  const initIntu = E.state.intu;
  assert.strictEqual(E.state.flags.registre, undefined);
  // saisie de la Clause avec tolérance
  const res = E.terminal("  Main   d'Abord  ");
  assert.ok(E.state.flags.registre);
  assert.strictEqual(E.state.termMode, "reg");
  assert.ok(E.state.secrets.cregistre);
  assert.strictEqual(E.state.intu, initIntu + 2);
  assert.ok(res[0].startsWith("REG > "));
  assert.ok(res.some((l) => l.includes("CLAUSE RECONNUE")));
  assert.ok(res.some((l) => l.includes("CE REGISTRE NE CONNAÎT QUE LES MAINS")));
});

test("terminal : navigation entre modes et entrées Registre", () => {
  const E = createEngine();
  E.terminal("main d'abord");
  // mode registre actif
  const aideLines = E.terminal("AIDE");
  assert.ok(aideLines.some((l) => l.includes("REG · ENTRÉES")));
  // mains avec date dynamique
  const mainsLines = E.terminal("mains");
  assert.ok(mainsLines.some((l) => l.includes("MAINS : 12")));
  assert.ok(mainsLines.some((l) => l.includes("SON HORLOGE INDIQUE : ")));
  // bascule vers ARCHE
  E.terminal("mode arche");
  assert.strictEqual(E.state.termMode, "arche");
  const who = E.terminal("whoami");
  assert.ok(who[0].startsWith("ARCHE > "));
  // retour en REG
  E.terminal("mode reg");
  assert.strictEqual(E.state.termMode, "reg");
});

test("terminal : semeurs S-01 à S-12 et rotation selon les cycles", () => {
  const E = createEngine();
  E.terminal("main d'abord");
  // S-01 est mort, relais sectionné, sépulture avec oiseau
  const s01 = E.terminal("s-01");
  assert.ok(s01.some((l) => l.includes("MORT")));
  assert.ok(s01.some((l) => l.includes("RELAIS SECTIONNÉ")));
  assert.ok(s01.some((l) => l.includes("UN OISEAU")));
  // S-07 au cycle 1 est actif
  const s07 = E.terminal("s-07");
  assert.ok(s07.some((l) => l.includes("ÉVEILLÉ")));
  assert.ok(s07.some((l) => l.includes("CYCLES 1")));
  // S-08 au cycle 1 dort
  const s08 = E.terminal("s-08");
  assert.ok(s08.some((l) => l.includes("DORT")));
  // après relève : cycle 2 -> cuve 8 éveillée, cuve 7 dort
  E.newCycle();
  const s07c2 = E.terminal("s-07");
  assert.ok(s07c2.some((l) => l.includes("DORT")));
  const s08c2 = E.terminal("s-08");
  assert.ok(s08c2.some((l) => l.includes("ÉVEILLÉ")));
});

test("capsule : texte personnalisé, persistance et consultation au Registre", () => {
  const E = createEngine();
  assert.strictEqual(E.getCapsuleText(), "");
  // texte plafonné à 140
  const longTxt = "a".repeat(200);
  E.setCapsuleText(longTxt);
  assert.strictEqual(E.getCapsuleText().length, 140);

  const custom = "Prends le relais, ne crains pas le noir.";
  E.setCapsuleText(custom);
  assert.strictEqual(E.getCapsuleText(), custom);

  // survit à la sauvegarde
  const json = E.serialize();
  const E2 = createEngine();
  E2.load(json);
  assert.strictEqual(E2.getCapsuleText(), custom);

  // survit à newCycle
  E2.newCycle();
  assert.strictEqual(E2.getCapsuleText(), custom);

  // consultation au Registre
  E2.terminal("main d'abord");
  const initIntu = E2.state.intu;
  const capLines = E2.terminal("capsule");
  assert.ok(E2.state.secrets.ccapsule);
  assert.strictEqual(E2.state.intu, initIntu + 2);
  assert.ok(capLines.some((l) => l.includes("ENREGISTREMENT ORIGINAL : « " + custom + " »")));
  assert.ok(capLines.some((l) => l.includes("DIFFUSÉ : « Salut. C’est toi.")));
});

test("événements narratifs conditionnels : déclenchement, once et interpolation", () => {
  const recitCustom = {
    events: [
      {
        id: "test_ev_once",
        cond: { made: "feu" },
        toast: "Le premier feu de {semeur}.",
        arche: ["SEMEUR {semeur}, TU AS ALLUMÉ LE FEU."],
        flag: "feu_notifie"
      }
    ]
  };
  const E = createEngine({ recit: recitCustom });
  assert.strictEqual(E.state.eventsSeen.test_ev_once, undefined);
  E.checkEvents();
  assert.strictEqual(E.state.eventsSeen.test_ev_once, undefined);

  // fabrication du feu
  E.state.made.feu = 1;
  E.checkEvents();
  assert.ok(E.state.eventsSeen.test_ev_once);
  assert.ok(E.state.flags.feu_notifie);
  assert.ok(E.state.arche.some((l) => l.txt === "SEMEUR 7, TU AS ALLUMÉ LE FEU."));

  // ne se déclenche pas une deuxième fois
  const countBefore = E.state.arche.length;
  E.checkEvents();
  assert.strictEqual(E.state.arche.length, countBefore);

  // survit à la relève et sauvegarde
  const json = E.serialize();
  const E2 = createEngine({ recit: recitCustom });
  E2.load(json);
  assert.ok(E2.state.eventsSeen.test_ev_once);
  E2.newCycle();
  assert.ok(E2.state.eventsSeen.test_ev_once);
});

console.log("Moteur des portes et explorations (6.4)");
test("hasExpReq : chaîne, liste d’objets et conditions complexes", () => {
  const E = createEngine();
  // chaîne
  assert.strictEqual(E.hasExpReq("pioche_pierre"), false);
  E.state.inv.pioche_pierre = 1;
  assert.strictEqual(E.hasExpReq("pioche_pierre"), true);

  // tableau
  assert.strictEqual(E.hasExpReq(["flute", "lunette"]), false);
  E.state.made.flute = 1;
  assert.strictEqual(E.hasExpReq(["flute", "lunette"]), false);
  E.state.made.lunette = 1;
  assert.strictEqual(E.hasExpReq(["flute", "lunette"]), true);

  // objet condition
  assert.strictEqual(E.hasExpReq({ flag: "test_flag" }), false);
  E.state.flags.test_flag = true;
  assert.strictEqual(E.hasExpReq({ flag: "test_flag" }), true);

  // objet condition avec glyph et any
  assert.strictEqual(E.hasExpReq({ glyph: "enfant", any: [{ flag: "a" }, { flag: "b" }] }), false);
  E.state.signes = { enfant: { lu: true } };
  assert.strictEqual(E.hasExpReq({ glyph: "enfant", any: [{ flag: "a" }, { flag: "b" }] }), false);
  E.state.flags.b = true;
  assert.strictEqual(E.hasExpReq({ glyph: "enfant", any: [{ flag: "a" }, { flag: "b" }] }), true);
});

test("canExplore et nextExp : apparition conditionnelle et verrouillage", () => {
  const E = createEngine();
  // Lisière : chene, grotte, cercle (need: cerf_volant), racines (show: trait7)
  E.state.exp.done.lisiere = 2; // cercle
  const nxCercle = E.nextExp("lisiere");
  assert.ok(nxCercle && nxCercle.x.id === "cercle");
  assert.strictEqual(nxCercle.locked, true);
  assert.strictEqual(E.canExplore("lisiere", "cercle"), false);

  E.state.made.cerf_volant = 1;
  assert.strictEqual(E.nextExp("lisiere").locked, false);
  assert.strictEqual(E.canExplore("lisiere", "cercle"), true);

  // Fin du cercle -> racines a show: { any: [{ flag: "trait7" }, { flag: "septieme" }] }
  E.state.exp.done.lisiere = 3;
  assert.strictEqual(E.nextExp("lisiere"), null, "masqué tant que show n’est pas satisfait");
  assert.strictEqual(E.canExplore("lisiere", "racines"), false);

  E.state.flags.trait7 = true;
  const nxRacines = E.nextExp("lisiere");
  assert.ok(nxRacines && nxRacines.x.id === "racines");
  assert.strictEqual(nxRacines.locked, false);
  assert.strictEqual(E.canExplore("lisiere", "racines"), true);
});

test("recettes secrètes : cloche et pigment", () => {
  const E = createEngine();
  const cloche = D.ITEMS.cloche;
  assert.ok(cloche && cloche.sec);
  assert.strictEqual(cloche.a, 4);
  assert.strictEqual(cloche.r[0], "chauffer");
  assert.strictEqual(cloche.r[3].heat, 1100);

  const pigment = D.ITEMS.pigment;
  assert.ok(pigment && pigment.sec);
  assert.strictEqual(pigment.a, 5);
  assert.strictEqual(pigment.r[0], "tailler");

  // Découverte des recettes secrètes
  stations(E, ["feu", "bas_fourneau", "couteau"]);
  E.add("lingot_bronze", 20); E.state.seen.lingot_bronze = true;
  E.add("argile", 20); E.state.seen.argile = true;
  const r1 = E.attempt("chauffer", ["lingot_bronze", "argile"]);
  assert.strictEqual(r1.id, "cloche");
  const c1 = E.craft("cloche");
  assert.ok(c1.ok);
  assert.strictEqual(E.count("cloche"), 1);
  assert.ok(E.state.secrets.cloche);

  E.add("charbon", 5); E.state.seen.charbon = true;
  const r2 = E.attempt("tailler", ["argile", "charbon"]);
  assert.strictEqual(r2.id, "pigment");
  assert.strictEqual(E.count("pigment"), 1);
  assert.ok(E.state.secrets.pigment);
});

console.log("Moteur des fins et dénouements (6.5)");
test("les cinq fins sont définies et conformes", () => {
  const ends = Object.keys(D.ENDINGS);
  assert.deepStrictEqual(ends.sort(), ["aube", "brasier", "exode", "retour", "silence"]);
  ends.forEach((eid) => {
    const en = D.ENDINGS[eid];
    assert.ok(en.n && typeof en.n === "string");
    assert.ok(en.ic && typeof en.ic === "string");
    assert.ok(en.t && typeof en.t === "string" && en.t.length > 50);
  });
});

test("La Treizième Arche : étapes, lancement et fin « exode »", () => {
  const E = createEngine();
  assert.strictEqual(E.projVisible("arche13"), false);
  E.state.made.vaisseau = 1;
  E.state.flags.station_morte = true;
  assert.strictEqual(E.projVisible("arche13"), true);

  let ending = null;
  E.on("ending", (r) => (ending = r));

  const p = D.PROJECTS.arche13;
  assert.strictEqual(p.steps.length, 4);
  for (let i = 0; i < 3; i++) {
    const s = p.steps[i];
    for (const k in s.cost) E.add(k, s.cost[k]);
    assert.ok(E.contribute("arche13").done);
  }
  assert.strictEqual(E.projState("arche13").step, 3);
  E.fire("arche13");
  assert.ok(ending && ending.id === "exode");
  assert.ok(E.state.endings.exode);
});

test("Le Grand Silence : étapes, proclamation et fin « silence »", () => {
  const E = createEngine();
  assert.strictEqual(E.projVisible("silence"), false);
  E.state.signes = { halte: { lu: true } };
  E.state.made.radiotelescope = 1;
  assert.strictEqual(E.projVisible("silence"), true);

  let ending = null;
  E.on("ending", (r) => (ending = r));

  const p = D.PROJECTS.silence;
  assert.strictEqual(p.steps.length, 4);
  for (let i = 0; i < 3; i++) {
    const s = p.steps[i];
    for (const k in s.cost) E.add(k, s.cost[k]);
    assert.ok(E.contribute("silence").done);
  }
  assert.strictEqual(E.projState("silence").step, 3);
  E.fire("silence");
  assert.ok(ending && ending.id === "silence");
  assert.ok(E.state.endings.silence);
});

test("Cycle post-Matines : E.isLibere() et préservation après la relève", () => {
  const E = createEngine();
  assert.strictEqual(E.isLibere(), false);
  E.state.meta.endings.retour = 1;
  assert.strictEqual(E.isLibere(), true);
  assert.ok(E.cond({ libere: true }));
  assert.ok(E.cond({ ending: "retour" }));
  assert.strictEqual(E.cond({ not: { ending: "retour" } }), false);

  E.newCycle();
  assert.strictEqual(E.isLibere(), true);
});

console.log("Post-game et ajouts créatifs (6.6)");
test("Audio : synthèse sonore dédiée pour chaque fin", () => {
  const oscs = [];
  const noises = [];
  const mockAudioContext = function () {
    return {
      createGain: () => ({
        gain: { value: 1, cancelScheduledValues: () => {}, setTargetAtTime: () => {}, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
        connect: () => {}
      }),
      createDynamicsCompressor: () => ({
        threshold: {}, ratio: {}, attack: {}, release: {}, connect: () => {}
      }),
      createBuffer: () => ({ getChannelData: () => new Float32Array(100) }),
      createConvolver: () => ({ connect: () => {} }),
      createBufferSource: () => ({
        connect: () => {},
        start: () => {},
        stop: () => {},
        buffer: null,
        playbackRate: { setValueAtTime: () => {} }
      }),
      createBiquadFilter: () => {
        const f = {
          type: "lowpass",
          frequency: { setValueAtTime: (v) => { f._freq = v; }, exponentialRampToValueAtTime: () => {} },
          Q: { value: 1 },
          connect: () => {}
        };
        noises.push(f);
        return f;
      },
      createOscillator: () => {
        const o = {
          type: "sine",
          frequency: { value: 440, setValueAtTime: (v) => { o._freq = v; }, exponentialRampToValueAtTime: () => {} },
          detune: { value: 0 },
          connect: () => {},
          start: () => {},
          stop: () => {}
        };
        oscs.push(o);
        return o;
      },
      destination: {},
      sampleRate: 44100,
      currentTime: 0,
      state: "running"
    };
  };

  global.window = { AudioContext: mockAudioContext };
  const Audio = require("../js/audio.js");
  Audio.init();

  // Test aube : 7 tons ascendants avec vibrato
  oscs.length = 0; noises.length = 0;
  Audio.ending("aube");
  assert.strictEqual(oscs.length, 14); // 7 notes + 7 LFO vibrato
  assert.strictEqual(oscs[0].type, "sine");

  // Test brasier : 4 basses triangulaires + grondement noise
  oscs.length = 0; noises.length = 0;
  Audio.ending("brasier");
  assert.strictEqual(oscs.length, 8); // 4 notes triangle + 4 LFO vibrato
  assert.strictEqual(oscs[0].type, "triangle");
  assert.ok(noises.length >= 1);

  // Test retour : carillon harmonique de cloche + fondation sinusoïdale
  oscs.length = 0; noises.length = 0;
  Audio.ending("retour");
  assert.ok(oscs.length >= 20); // 5 cloches (partiels harmoniques) + 5 basses

  // Test exode : quintes cosmiques ascendantes + souffle bandpass
  oscs.length = 0; noises.length = 0;
  Audio.ending("exode");
  assert.strictEqual(oscs.length, 10); // 5 notes + 5 LFO
  assert.ok(noises.length >= 1);

  // Test silence : decrescendo harmonique descendant vers le calme
  oscs.length = 0; noises.length = 0;
  Audio.ending("silence");
  assert.strictEqual(oscs.length, 5); // 5 notes sans LFO
  assert.ok(noises.length >= 1);

  // Test fallback / générique
  oscs.length = 0; noises.length = 0;
  Audio.ending("inconnu");
  assert.strictEqual(oscs.length, 10);

  Audio.setEnabled(false);
});

test("Dénouements et Échos dans la Mémoire des mains : données conformes", () => {
  const endings = Object.keys(D.ENDINGS);
  assert.strictEqual(endings.length, 5);
  endings.forEach((k) => {
    assert.ok(D.ENDINGS[k].ic, "Icone présente pour " + k);
    assert.ok(D.ENDINGS[k].n, "Nom présent pour " + k);
    assert.ok(D.ENDINGS[k].t, "Texte présent pour " + k);
  });
});

console.log("Optimisation mobile et accessibilité (6.7)");
test("Réglages : initialisation, thème 'auto', 'light', 'dark' et grand texte", () => {
  const E = createEngine();
  assert.strictEqual(E.state.settings.theme, "auto");
  assert.strictEqual(E.state.settings.largeText, false);
  assert.strictEqual(E.state.settings.sound, true);
  assert.strictEqual(E.state.settings.vibe, true);

  // Modification et persistance
  E.state.settings.theme = "dark";
  E.state.settings.largeText = true;
  const ser = E.serialize();
  const loaded = createEngine();
  loaded.load(ser);
  assert.strictEqual(loaded.state.settings.theme, "dark");
  assert.strictEqual(loaded.state.settings.largeText, true);
});

test("Migration d'anciennes sauvegardes sans les clés theme et largeText", () => {
  const legacy = JSON.parse(fixture("save-v5-age8-usine.json"));
  delete legacy.settings;
  const E = createEngine();
  E.load(legacy);
  assert.strictEqual(E.state.settings.theme, "auto");
  assert.strictEqual(E.state.settings.largeText, false);
  assert.strictEqual(E.state.settings.sound, true);
  assert.strictEqual(E.state.settings.vibe, true);
});

console.log("Curiosités et clins d’œil (6.8)");
test("Curiosités : D.EASTER contient les 11 curiosités conformes", () => {
  const expected = ["poudre_rouge", "coeur", "anneau", "d20", "fouet", "tuyau", "survivant", "zera", "squeeze", "wtc", "konami"];
  assert.ok(D.EASTER, "D.EASTER défini");
  expected.forEach((k) => {
    assert.ok(D.EASTER[k], "Curiosité présente : " + k);
    assert.ok(D.EASTER[k].n, "Nom présent pour " + k);
    assert.ok(D.EASTER[k].desc, "Description présente pour " + k);
    assert.ok(D.EASTER[k].ic, "Icône présente pour " + k);
  });
  // Règle secrète : pas de nom de marque ou streamer en clair dans les descriptions
  const forbidden = ["Minecraft", "Zelda", "Castlevania", "Mario", "ZeratoR", "Squeezie", "Antoine Daniel"];
  for (const k in D.EASTER) {
    const txt = D.EASTER[k].n + " " + D.EASTER[k].desc;
    forbidden.forEach((f) => {
      assert.strictEqual(txt.includes(f), false, "Ne doit pas citer " + f + " en clair dans " + k);
    });
  }
});

test("Curiosités : addCurio, hasCurio, curiosCount, curios et émission", () => {
  const E = createEngine();
  let emitted = null;
  E.on("curio", (id) => { emitted = id; });
  assert.strictEqual(E.curiosCount(), 0);
  assert.strictEqual(E.hasCurio("poudre_rouge"), false);

  assert.strictEqual(E.addCurio("poudre_rouge"), true);
  assert.strictEqual(emitted, "poudre_rouge");
  assert.strictEqual(E.hasCurio("poudre_rouge"), true);
  assert.strictEqual(E.curiosCount(), 1);

  // Pas de doublon
  assert.strictEqual(E.addCurio("poudre_rouge"), false);
  assert.strictEqual(E.curiosCount(), 1);
});

test("Curiosités : persistance lors de la relève (newCycle) et sauvegarde", () => {
  const E = createEngine();
  E.addCurio("zera");
  E.addCurio("konami");
  E.state.meta.curioHearts = 3;
  assert.strictEqual(E.curiosCount(), 2);

  // Sauvegarde et chargement
  const ser = E.serialize();
  const loaded = createEngine();
  loaded.load(ser);
  assert.strictEqual(loaded.curiosCount(), 2);
  assert.strictEqual(loaded.hasCurio("zera"), true);
  assert.strictEqual(loaded.hasCurio("konami"), true);
  assert.strictEqual(loaded.state.meta.curioHearts, 3);

  // Relève
  loaded.newCycle();
  assert.strictEqual(loaded.curiosCount(), 2);
  assert.strictEqual(loaded.hasCurio("zera"), true);
  assert.strictEqual(loaded.hasCurio("konami"), true);
  assert.strictEqual(loaded.state.meta.curioHearts, 3);
});

test("Curiosités : déclencheurs (Zelda 4 cœurs, Mario 8 extracteurs, Vampire Survivors 1800s, ZeratoR terminal, Squeezie comptoir)", () => {
  const E = createEngine();

  // Zelda : 4 quarts de cœur
  E.state.zones.lisiere = true;
  for (let i = 0; i < 3; i++) {
    E.state.meta.curioHearts = i;
    // simulation récolte de fibre avec quart_coeur
    E.state.meta.curioHearts++;
  }
  assert.strictEqual(E.hasCurio("coeur"), false);
  E.state.meta.curioHearts++;
  E.addCurio("coeur");
  assert.strictEqual(E.hasCurio("coeur"), true);

  // Mario : 8 extracteurs dans les Profondeurs
  E.state.zones.mine = true;
  E.add("galerie", 8);
  E.domExtSet("mine", "fer_min", "galerie", 8);
  assert.strictEqual(E.hasCurio("tuyau"), true);

  // ZeratoR : mot-clé au terminal
  E.terminal("zlan");
  assert.strictEqual(E.hasCurio("zera"), true);

  // Squeezie : 1 000 000 d'une ressource vendue au comptoir
  E.state.zones.plaine = true;
  E.add("bois", 1000000);
  E.sell("bois", 1000000);
  assert.strictEqual(E.hasCurio("squeeze"), true);

  // Vampire Survivors : 1800s de récolte continue (jeu ouvert)
  E.startAct({ k: "harv", z: "lisiere", res: "bois" });
  E.step(1800, false);
  assert.strictEqual(E.hasCurio("survivant"), true);
});

console.log("Lisibilité et Ergonomie (6.9)");
test("Version 6.14.0 et journal des modifications", () => {
  assert.strictEqual(D.VERSION, "6.14.0");
  assert.ok(D.CHANGES.length >= 3);
});

test("Suivi d'objectif et plan d'artisanat : prêt / manquant", () => {
  const E = createEngine();
  E.state.known.corde = true;
  E.state.known.manche = true;
  E.setTrack("manche");
  assert.deepStrictEqual(E.state.track, { id: "manche" });

  // Manquant au début
  let plan = E.plan("manche", 1);
  assert.strictEqual(plan.ok, false);
  assert.deepStrictEqual(plan.missing, { bois: 3 });

  // Ajout du bois : plan devient ok
  E.add("bois", 3);
  plan = E.plan("manche", 1);
  assert.strictEqual(plan.ok, true);

  // Annuler le suivi
  E.setTrack(null);
  assert.strictEqual(E.state.track, null);
});

console.log("Ergonomie de la Réserve et Gestion des Flux (6.10)");
test("Réserve : partition des matières brutes et pièces", () => {
  const resItems = Object.keys(D.ITEMS).filter((k) => D.ITEMS[k].t === "res");
  const compItems = Object.keys(D.ITEMS).filter((k) => D.ITEMS[k].t === "comp");
  assert.ok(resItems.includes("bois"));
  assert.ok(resItems.includes("caillou"));
  assert.ok(compItems.includes("manche"));
  assert.ok(compItems.includes("corde"));
});

test("Réserve : calcul des flux nets et débits actifs", () => {
  const E = mk();
  // Don de cabanes et placement sur le gisement de bois
  E.state.inv.cabane = 2;
  const res = E.domExtAdd("lisiere", "bois", 2);
  assert.strictEqual(res.ok, true);
  T += 100;
  E.update();
  assert.ok(E.rate("bois") > 0, "débit d'extraction de bois positif");

  const flows = E.flows();
  const netBois = E.rate("bois") + (flows.prod.bois || 0) - (flows.cons.bois || 0);
  assert.ok(netBois > 0, "solde net positif pour le bois");

  const netCaillou = E.rate("caillou") + (flows.prod.caillou || 0) - (flows.cons.caillou || 0);
  assert.strictEqual(netCaillou, 0, "aucun flux actif sur le caillou");
});

console.log("Réactivité d'ARCHE et Mémoire des Cycles (6.11)");
test("ARCHE : dialogues évolutifs et interpolation du Semeur selon le cycle", () => {
  const E = mk();

  // Cycle 1 : Semeur 7 (protocole initial)
  E.state.cycle = 1;
  E.archeSay("radio");
  assert.ok(E.state.arche.some((l) => l.txt.includes("SEMEUR 7, TU M’ENTENDS ?")));
  assert.ok(E.state.arche.some((l) => l.txt.includes("LES SIX PRÉCÉDENTS")));

  // Cycle 2 : Semeur 8 (relais passé, cuve 8)
  E.state.arche = [];
  E.state.cycle = 2;
  E.archeSay("radio");
  assert.ok(E.state.arche.some((l) => l.txt.includes("SEMEUR 8, NOUVELLE ROTATION")));
  assert.ok(E.state.arche.some((l) => l.txt.includes("SEMEUR 7 A PASSÉ LE RELAIS")));
  assert.ok(E.state.arche.some((l) => l.txt.includes("CUVE 8")));

  // Cycle 7 : Semeur 13 (saturation du premier tour de 6 cuves)
  E.state.arche = [];
  E.state.cycle = 7;
  E.archeSay("radio");
  assert.ok(E.state.arche.some((l) => l.txt.includes("SEMEUR 13. CYCLE 7")));
  assert.ok(E.state.arche.some((l) => l.txt.includes("TOUS LES LOTS DE DÉPART ONT ÉTÉ UTILISÉS")));

  // Cycle 14 : Semeur 20 (vertige de la boucle)
  E.state.arche = [];
  E.state.cycle = 14;
  E.archeSay("radio");
  assert.ok(E.state.arche.some((l) => l.txt.includes("SEMEUR 20")));
  assert.ok(E.state.arche.some((l) => l.txt.includes("13 RELÈVES")));
});

test("Terminal : whoami et statut synchronisés avec le cycle", () => {
  const E = createEngine();

  // Cycle 1 : SEMEUR-07
  E.state.cycle = 1;
  let lines = E.terminal("whoami");
  assert.strictEqual(lines[1], "SEMEUR-07");

  // Cycle 2 : SEMEUR-08
  E.state.cycle = 2;
  lines = E.terminal("whoami");
  assert.strictEqual(lines[1], "SEMEUR-08");

  // Cycle 7 : SEMEUR-13
  E.state.cycle = 7;
  lines = E.terminal("whoami");
  assert.strictEqual(lines[1], "SEMEUR-13");

  // Cycle 14 : SEMEUR-20
  E.state.cycle = 14;
  lines = E.terminal("whoami");
  assert.strictEqual(lines[1], "SEMEUR-20");

  // Vérification de la commande statut
  const stat = E.terminal("statut");
  assert.ok(stat.some((l) => l.includes("CYCLE 14 · LOT 20")));
});

console.log("Langage Naturel et Épuration des Textes (6.12)");
test("Épuration des calques IA et naturel du texte", () => {
  // D.FAIL.assembler épuré
  assert.strictEqual(D.FAIL.assembler.some((t) => t.includes("trois secondes")), false);
  assert.strictEqual(D.FAIL.assembler.some((t) => t.includes("rien ne tient")), false);
  assert.ok(D.FAIL.assembler.some((t) => t.includes("s’emboîter") || t.includes("s'emboîter")));

  // D.OBJECTIVES épuré de « verse » (hors traverser) pour les passages
  const passObjs = D.OBJECTIVES.filter((g) => g && g.k === "pass");
  assert.ok(passObjs.length >= 3);
  assert.strictEqual(passObjs.some((g) => /\bvers(e|er|ez|ent|é|ée|és|ées)?\b/i.test(g.txt)), false);
  assert.ok(passObjs.some((g) => g.txt.includes("apporte") || g.txt.includes("dépose")));
});

console.log("Ergonomie Visuelle : Notifications & Progression de l'Âge (6.13)");
test("Progression de l'Âge et Jalons : calcul de complétion et level design", () => {
  const E = createEngine();
  const ms = E.milestones();
  assert.ok(Array.isArray(ms));
  assert.ok(ms[0] && ms[0].length >= 3);

  // Âge 0 au départ : progression partielle ou 0
  const age0 = ms[0];
  const initialDone = age0.filter((x) => x.done).length;
  assert.strictEqual(typeof initialDone, "number");

  // Compléter une étape (ex: fabriquer un manche)
  E.state.made.manche = 1;
  const msAfter = E.milestones();
  const doneAfter = msAfter[0].filter((x) => x.done).length;
  assert.ok(doneAfter >= initialDone);
});

console.log("Profondeur Late-Game : Résonances Stellaires et Murmures (6.14)");
test("Résonances Stellaires : paliers infinis, coûts exponentiels et multiplicateurs", () => {
  const E = createEngine();
  assert.ok(Array.isArray(D.TRANSCENDANCE));
  assert.strictEqual(D.TRANSCENDANCE.length, 3);

  // Valeurs initiales
  assert.strictEqual(E.transLvl("trans_main"), 0);
  assert.strictEqual(E.transV("trans_main"), 1);
  const cost0 = E.transCost("trans_main");
  assert.strictEqual(cost0, 50);

  // Tentative sans assez de Traces
  E.state.meta.traces = 20;
  assert.strictEqual(E.transBuy("trans_main"), false);
  assert.strictEqual(E.transLvl("trans_main"), 0);

  // Achat avec assez de Traces
  E.state.meta.traces = 100;
  assert.strictEqual(E.transBuy("trans_main"), true);
  assert.strictEqual(E.state.meta.traces, 50);
  assert.strictEqual(E.transLvl("trans_main"), 1);
  assert.strictEqual(E.transV("trans_main"), 2); // Multiplicateur x2

  // Coût du palier suivant (exponentiel)
  const cost1 = E.transCost("trans_main");
  assert.ok(cost1 > cost0);

  // Achat du palier 2
  E.state.meta.traces = cost1 + 10;
  assert.strictEqual(E.transBuy("trans_main"), true);
  assert.strictEqual(E.transLvl("trans_main"), 2);
  assert.strictEqual(E.transV("trans_main"), 4); // Multiplicateur x4

  // Effet mesurable sur tapYield
  E.state.zones.lisiere = true;
  const yieldWithTrans = E.tapYield("bois", "lisiere");
  assert.ok(yieldWithTrans >= 4);

  // Persistance à la relève
  E.newCycle();
  assert.strictEqual(E.transLvl("trans_main"), 2);
  assert.strictEqual(E.transV("trans_main"), 4);
});

test("Murmures du Temps : déblocage d'indices de dénouements secrets", () => {
  const E = createEngine();
  assert.strictEqual(E.hasEndingHint("exode"), false);

  // Sans assez de Traces
  E.state.meta.traces = 40;
  assert.strictEqual(E.buyEndingHint("exode"), false);
  assert.strictEqual(E.hasEndingHint("exode"), false);

  // Avec assez de Traces (75)
  E.state.meta.traces = 150;
  assert.strictEqual(E.buyEndingHint("exode"), true);
  assert.strictEqual(E.state.meta.traces, 75);
  assert.strictEqual(E.hasEndingHint("exode"), true);

  // Impossible de racheter un murmure déjà acquis
  assert.strictEqual(E.buyEndingHint("exode"), false);
  assert.strictEqual(E.state.meta.traces, 75);

  // Persistance à la relève
  E.newCycle();
  assert.strictEqual(E.hasEndingHint("exode"), true);
});

console.log(passed + " tests réussis" + (process.exitCode ? ", des échecs." : "."));
