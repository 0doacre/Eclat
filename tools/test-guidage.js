/* Le guidage : trois cas ciblés de l’audit 0.21 — le dernier objet fabriqué avant la fin des étapes,
 * une cible déjà fabricable avec ce que contient la Réserve, un extracteur possédé qui ne tourne pas. */
"use strict";
const assert = require("assert/strict");
const D = require("../js/data.js");
const { createEngine } = require("../js/engine.js");

const I = D.ITEMS, pub = ([, i]) => !i.sec && !i.path && !i.old && !i.curio;
let passed = 0;
function test(n, fn) {
  try { fn(); passed++; console.log("  ✓ " + n); }
  catch (e) { console.log("  ✗ " + n + "\n    " + (e.stack || e)); process.exitCode = 1; }
}
function setup(age) {
  const E = createEngine({ now: () => 2e12, rand: () => 0.99 });
  E.state.age = age; E.state.cycle = 2;
  for (const z of D.ZONES) E.state.zones[z.id] = true;
  for (const [id, i] of Object.entries(I).filter(pub)) {
    if (i.a > age) continue;
    if (i.r) E.learn(id, true);
    if (i.t === "stat") { E.add(id, 1); E.state.made[id] = 1; }
  }
  E.recalc();
  return E;
}

console.log("Guidage : cas ciblés (0.23)");
test("fabriquer en avance le dernier objet ne fait pas disparaître les étapes de l’âge qui restent", () => {
  const E = setup(13);
  E.state.zones.mercure = false;
  E.milestones()[13].forEach((x) => {
    if (x.ob.k === "craft" && x.ob.id !== "vaisseau") E.state.made[x.ob.id] = 1;
    else if (x.ob.k === "pass" && x.ob.z !== "mercure") E.state.pass[x.ob.z] = { paid: {}, done: true };
  });
  E.learn("forge_stellaire", true);
  for (const [k, n] of Object.entries(I.forge_stellaire.r[1])) E.add(k, n);
  assert.equal(E.craft("forge_stellaire", 1).ok, true);
  const ob = E.objective();
  assert.ok(ob, "il reste une étape à faire");
  assert.ok(["vaisseau", "mercure"].includes(ob.id || ob.z), "l’étape est l’une de celles qui manquent : " + (ob.id || ob.z));
  assert.ok(E.guide(), "le guide reste là");
});
test("quand tout est fait, il n’y a plus d’objectif", () => {
  const E = setup(13);
  E.milestones().forEach((l) => l.forEach((x) => {
    if (x.ob.k === "craft") E.state.made[x.ob.id] = 1;
    else if (x.ob.k === "pass") E.state.pass[x.ob.z] = { paid: {}, done: true };
  }));
  const ob = E.objective();
  if (ob) assert.ok(ob.k !== "craft", "seules des étapes sans objet resteraient");
});
test("une pièce déjà en Réserve n’est pas une étape : la cible fabricable est proposée", () => {
  const E = setup(7);
  E.state.age = 8;
  for (const [id, i] of Object.entries(I).filter(pub)) if (i.r && i.a <= 8) E.learn(id, true);
  for (const [k, n] of Object.entries(I.dynamo.r[1])) E.add(k, n);
  for (const id of ["eau_1", "tuyau_cuivre", "circuit_vapeur", "eau"]) { delete E.state.known[id]; delete E.state.inv[id]; }
  assert.equal(E.plan("dynamo", 1).ok, true);
  assert.deepEqual(E.nextStep("dynamo"), { id: "dynamo", why: "known" });
});
test("sans la pièce en Réserve, la sous-recette inconnue reste l’étape", () => {
  const E = setup(7);
  E.state.age = 8;
  for (const [id, i] of Object.entries(I).filter(pub)) if (i.r && i.a <= 8) E.learn(id, true);
  for (const [k, n] of Object.entries(I.dynamo.r[1])) E.add(k, n);
  const pieces = Object.keys(I.dynamo.r[1]).filter((k) => I[k].r);
  assert.ok(pieces.length, "dynamo a une pièce fabriquée");
  const k = pieces[0];
  delete E.state.inv[k]; delete E.state.known[k];
  const s = E.nextStep("dynamo");
  assert.ok(s.id !== "dynamo", "la pièce manquante est cherchée");
});
test("un extracteur possédé : absent, libre (jamais posé) ou arrêté se distinguent", () => {
  const mk = (mode) => {
    const E = setup(7);
    if (mode !== "absent") E.add("eau_1", 1);
    if (mode === "arret") { E.domExtSet("riviere", "eau", "eau_1", 1); E.state.dom.ext["riviere:eau"].on = false; E.recalc(); }
    return E;
  };
  assert.equal(mk("absent").extEtat("eau"), null);
  const libre = mk("libre").extEtat("eau");
  assert.equal(libre.etat, "libre"); assert.equal(libre.t, "eau_1"); assert.equal(libre.key, "riviere:eau");
  const arret = mk("arret").extEtat("eau");
  assert.equal(arret.etat, "arret"); assert.equal(arret.key, "riviere:eau");
});
test("un extracteur qui tourne, ou une matière qui se récolte à la main, n’ont rien à signaler", () => {
  const E = setup(7);
  E.add("eau_1", 1); E.domExtSet("riviere", "eau", "eau_1", 1); E.catchUp(5);
  assert.ok(E.rate("eau") > 0);
  assert.equal(E.extEtat("eau"), null);
  assert.equal(E.extEtat("bois"), null);
});
test("relancer l’extracteur arrêté le fait tourner", () => {
  const E = setup(7);
  E.add("eau_1", 1); E.domExtSet("riviere", "eau", "eau_1", 1);
  E.catchUp(5);
  assert.ok(E.rate("eau") > 0);
  E.domExtToggle("riviere", "eau", false); E.catchUp(5);
  assert.equal(E.rate("eau"), 0);
  assert.equal(E.extEtat("eau").etat, "arret");
  E.domExtToggle("riviere", "eau", true); E.catchUp(5);
  assert.ok(E.rate("eau") > 0);
  assert.equal(E.extEtat("eau"), null);
});
// Une sauvegarde au point d’une quête, sans donner les terres d’après.
function avant(id, age) {
  const E = setup(age), S = E.state;
  for (const o of D.OBJECTIVES) {
    if (Array.isArray(o) && o[0] === id || o.k === "pass" && o.z === id) break;
    if (Array.isArray(o)) S.made[o[0]] = 1;
    else if (o.k === "pass") S.pass[o.z] = { paid: {}, done: true };
    else if (o.k === "exp") S.exp.done[o.z] = D.ZONES.find((z) => z.id === o.z).exps.findIndex((x) => x.id === o.x) + 1;
    else if (o.k === "ext") S.flags.extDone = true;
    else if (o.k === "line") S.flags.lineDone = true;
  }
  return E;
}
test("le parcours ne revient jamais à un âge antérieur", () => {
  let age = 0;
  for (const o of D.OBJECTIVES) if (Array.isArray(o)) {
    assert.ok(I[o[0]].a >= age, o[0] + " revient en arrière");
    age = I[o[0]].a;
  }
});
test("Collines : une recette nécessaire au paiement est guidée, puis ses ingrédients aussi", () => {
  const E = avant("collines", 2), S = E.state;
  S.zones.collines = false; S.zones.mine = false;
  S.pass.collines = { paid: {}, done: false };
  delete S.known.brique;
  assert.equal(E.objective().z, "collines");
  assert.equal(E.guide().step, "brique");
  assert.equal(E.guide().passageCost, true);
  assert.equal(E.scenarioQuest().targetId, "brique");
  E.learn("brique", true);
  assert.equal(E.guide().step, null, "le paiement reprend une fois la recette connue");
  assert.equal(E.scenarioQuest().ready, false, "un passage n’est pas une recette à fabriquer");
});
test("payer en partie ne réclame que le solde, pas le prix total", () => {
  const E = avant("collines", 2), S = E.state;
  S.pass.collines = { paid: { brique: E.passCost("collines").brique - 1 }, done: false };
  delete S.known.brique; E.add("brique", 1);
  assert.equal(E.guide().step, null);
});
test("la mine de plomb précède le lingot et se fabrique avant de quitter le Désert", () => {
  const E = avant("galene_1", 9), S = E.state;
  for (const z of ["gisement", "montagnes", "orbite", "lune", "mercure"]) S.zones[z] = false;
  assert.equal(E.objective().id, "galene_1");
  for (const [id, n] of Object.entries(I.galene_1.r[1])) E.add(id, n);
  assert.equal(E.scenarioQuest().targetId, "galene_1");
  assert.equal(E.scenarioQuest().ready, true);
  assert.equal(E.craft("galene_1", 1).ok, true);
  assert.equal(E.objective().id, "lingot_plomb");
  assert.equal(E.extEtat("galene").etat, "libre");
  assert.equal(E.extEtat("galene").key, "collines:galene");
  E.domExtSet("collines", "galene", "galene_1", 1); E.catchUp(10);
  assert.ok(E.count("galene") >= 3);
  assert.equal(E.craft("lingot_plomb", 1).ok, true);
  assert.equal(S.zones.gisement, false, "le pétrole n’est pas requis pour le plomb");
});
test("une ancienne partie déjà au lingot retrouve la mine manquante dans les Quêtes", () => {
  const E = avant("lingot_plomb", 9), S = E.state;
  delete S.made.galene_1; delete S.known.galene_1;
  for (const [id, n] of Object.entries(I.galene_1.r[1])) E.add(id, n);
  assert.equal(E.objective().id, "galene_1");
  assert.equal(E.guide().step, "galene_1");
  assert.equal(E.scenarioQuest().targetId, "galene_1");
  assert.equal(E.scenarioQuest().ready, false, "la mine est à découvrir d’abord");
  E.learn("galene_1", true);
  assert.equal(E.scenarioQuest().ready, true);
  assert.equal(E.scenarioQuest().targetId, "galene_1", "le bouton fabrique le prérequis, pas le lingot impossible");
});
test("les Quêtes proposent la sous-recette guidée, pas une cible finale impossible", () => {
  const E = avant("galene_1", 9), S = E.state;
  delete S.known.moteur_elec;
  assert.equal(E.objective().id, "galene_1");
  assert.equal(E.guide().step, "moteur_elec");
  assert.equal(E.scenarioQuest().targetId, "moteur_elec");
});
test("une mine libre signale son gisement au-dessus des terres anciennes masquées, même après rechargement", () => {
  const fs = require("fs"), vm = require("vm");
  const ctx = { window: {}, URL, document: { baseURI: "http://localhost/", addEventListener() {} } };
  vm.runInNewContext(fs.readFileSync(require.resolve("../js/decouvertes-carnet.js"), "utf8"), ctx);
  vm.runInNewContext(fs.readFileSync(require.resolve("../js/domaine.js"), "utf8"), ctx);
  const initial = avant("lingot_plomb", 9);
  for (const z of ["gisement", "montagnes", "orbite", "lune", "mercure", "caveau"]) initial.state.zones[z] = false;
  initial.add("galene_1", 1);
  const E = createEngine({ now: () => 2e12, rand: () => 0.99 }); E.load(initial.serialize());
  const U = { compact: () => false, domAll: false, domOpen: null };
  const api = new Proxy({ E, D, U, top: () => "", esc: String, icon: () => "", fmt: String, perMin: String, fmtTime: String, itemPill: (id) => id }, {
    get: (o, k) => k in o ? o[k] : () => ""
  });
  const Dom = ctx.window.EclatDomaine.create(api);
  let h = Dom.view();
  assert.ok(!h.includes('id="dt-collines"'), "les Collines sont masquées dans cet état");
  assert.ok(h.includes('data-new-deposit="collines:galene"'));
  assert.ok(h.includes('data-gz="collines"'));
  assert.ok(h.includes('data-xadd="collines:galene"'));
  assert.ok(h.indexOf('data-new-deposit="collines:galene"') < h.indexOf('id="dt-desert"'), "le rappel précède les terres");
  E.domExtSet("collines", "galene", "galene_1", 1);
  h = Dom.view();
  assert.ok(!h.includes('data-new-deposit="collines:galene"'), "le rappel disparaît après la pose");
});
test("la fenêtre Quêtes mène à l’Atelier puis au gisement, avec des commandes de modale", () => {
  const fs = require("fs"), vm = require("vm"), ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(require.resolve("../js/quetes.js"), "utf8"), ctx);
  const E = avant("galene_1", 9), S = E.state;
  delete S.known.galene_1;
  for (const [id, n] of Object.entries(I.galene_1.r[1])) E.add(id, n);
  let modal, tab, closed = false;
  const api = new Proxy({ E, D, U: {}, esc: String, icon: () => "", itemPill: (id) => id,
    openModal: (o) => { modal = o; }, closeModal: () => { closed = true; }, setTab: (t) => { tab = t; }
  }, { get: (o, k) => k in o ? o[k] : () => "" });
  const Q = ctx.window.EclatQuetes.create(api);
  Q.openQuestsModal();
  assert.ok(modal.html.includes('data-m="qresume" data-tab="atelier"'));
  modal.on.qresume({ dataset: { tab: "atelier" } });
  assert.equal(tab, "atelier"); assert.equal(closed, true);
  E.learn("galene_1", true); Q.openQuestsModal();
  assert.ok(modal.html.includes('data-m="qmake" data-id="galene_1"'));
  E.craft("galene_1", 1); Q.openQuestsModal();
  assert.ok(modal.html.includes('data-gz="collines"'));
  assert.ok(modal.html.includes('attend d’être posé'));
});
test("le Gisement guide le masque puis la Plateforme avant les Pics", () => {
  const E = avant("masque", 11), S = E.state;
  assert.equal(E.objective().id, "masque");
  S.made.masque = 1;
  assert.equal(E.objective().x, "plateforme_r");
  assert.equal(E.guide().step, null);
  assert.equal(E.startExp("gisement").ok, true);
  E.state.exp.active.t0 -= E.state.exp.active.dur;
  E.catchUp(1);
  assert.equal(E.objective().id, "dynamite");
});
test("un lieu avec un équipement absent mène à sa recette même si elle est déjà connue", () => {
  const E = avant("masque", 11);
  // Une sauvegarde a sauté l'étape du masque mais doit encore explorer.
  delete E.state.made.masque;
  const original = E.objective;
  E.objective = () => ({ k: "exp", z: "gisement", x: "plateforme_r" });
  const g = E.guide();
  assert.equal(g.pour, "masque");
  assert.ok(g.step);
  E.objective = original;
});
test("disponibilité de fabrication : mêmes règles que la commande, sans dépense", () => {
  const E = createEngine(); E.learn("manche", true);
  const before = E.serialize(), status = E.orderStatus("manche", 10);
  assert.equal(status.ok, true, "les matières premières peuvent arriver plus tard");
  assert.equal(E.serialize(), before);
  assert.equal(E.order("manche", 10).ok, status.ok);
  E.learn("cabane", true);
  const blocked = E.orderStatus("cabane", 10);
  assert.equal(blocked.ok, false, "les constructions croissantes demandent leurs matières");
  assert.equal(E.order("cabane", 10).why, blocked.why);
  assert.equal(E.orderStatus("radio", 1).ok, false, "une recette inconnue reste à découvrir");
});
test("le passage propose le solde à fabriquer et retire les matières déposées", () => {
  const fs = require("fs"), vm = require("vm"), ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(require.resolve("../js/quetes.js"), "utf8"), ctx);
  const E = avant("collines", 2), cost = E.passCost("collines");
  E.state.pass.collines = { done: false, paid: { caillou: cost.caillou, brique: cost.brique - 12 } };
  E.state.inv.brique = 3; E.state.known.brique = true;
  const api = new Proxy({ E, D, U: {}, esc: String, fmt: String, icon: () => "", zoneName: z => z }, { get: (o, k) => k in o ? o[k] : () => "" });
  const Q = ctx.window.EclatQuetes.create(api), h = Q.passHTML("collines");
  assert.ok(h.includes('data-tree="brique" data-n="9"'));
  assert.ok(!h.includes('data-goto="caillou"'));
  assert.ok(h.includes('data-goto="argile"'));
});
test("le passage propose directement de fabriquer l’objet connu requis par le prochain lieu inexploré", () => {
  const fs = require("fs"), vm = require("vm"), ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(require.resolve("../js/quetes.js"), "utf8"), ctx);
  const E = createEngine({ now: () => 2e12, rand: () => 0.99 }), S = E.state;
  for (const id of ["manche", "corde", "archet", "feu", "cabane", "epieu", "charbon", "torche"]) { S.known[id] = true; }
  S.inv.feu = 1;
  S.flags.extDone = true;
  S.exp.done.lisiere = 1; // Le Grand Chêne fait, reste La Grotte aux Mains (cost: { torche: 1 })
  S.pass.plaine = { done: false, paid: E.passCost("plaine") };
  const api = new Proxy({ E, D, U: {}, esc: String, fmt: String, icon: () => "", zoneName: z => z }, { get: (o, k) => k in o ? o[k] : () => "" });
  const Q = ctx.window.EclatQuetes.create(api), h = Q.passHTML("plaine");
  assert.ok(h.includes('data-chain="torche"'), "le passage propose directement de fabriquer la torche requise par la Grotte");
});
test("découverte accompagnée : la carte d’objectif et l’établi indiquent le nombre de ressources et les actions d’indice", () => {
  const fs = require("fs"), vm = require("vm"), ctx = { window: {}, document: { querySelector: () => null, addEventListener: () => {} } };
  vm.runInNewContext(fs.readFileSync(require.resolve("../js/quetes.js"), "utf8"), ctx);
  vm.runInNewContext(fs.readFileSync(require.resolve("../js/atelier.js"), "utf8"), ctx);
  const E = createEngine();
  E.state.intu = 10;
  E.state.hints.manche = 1;
  E.state.gt = { id: "manche", p: 6 };
  const U = { geste: "tresser", slots: [null, null, null], openAges: {} };
  const api = new Proxy({
    E, D, U, Tuto: { active: () => false },
    esc: String, fmt: String, icon: () => "", gIc: () => "", gesteChip: (id) => D.ITEMS[id].r[0],
    mainIngredient: (id) => Object.keys(D.ITEMS[id].r[1])[0],
    memoryHTML: (m) => m ? '<div class="memo-bar">' + m.p + '/' + m.next + '</div>' : ""
  }, { get: (o, k) => k in o ? o[k] : () => "" });
  const Q = ctx.window.EclatQuetes.create(api);
  const Atel = ctx.window.EclatAtelier.create(api);
  const card = Q.goalCard();
  assert.ok(card.includes("1 ressource"), "la carte d’objectif indique le nombre de ressources");
  const atel = Atel.viewAtelier();
  assert.ok(atel.includes("1 ressource"), "l’encart de l’Atelier indique le nombre de ressources");
  assert.ok(atel.includes('data-apply-hint="manche"'), "le bouton Poser l’indice sur l’établi est proposé dès le niveau d’indice 1");
  assert.ok(atel.includes('data-goal-decipher="manche"'), "le bouton Déchiffrer est accessible directement depuis l’Atelier");
  assert.ok(atel.includes("memo-bar"), "la jauge de réminiscence reste visible dans l’encart d’objectif de l’Atelier");
});
test("cadences d’atelier : les machines au repos maintiennent le stock jusqu’au seuil et cèdent la priorité aux commandes", () => {
  const E = createEngine();
  E.learn("manche", true);
  E.learn("corde", true);
  E.state.made.manche = 1;
  E.state.made.corde = 1;
  E.state.inv.automate_bois = 1;
  E.state.inv.bois = 200;
  E.state.inv.fibre = 200;
  E.state.inv.manche = 48;

  const r = E.setCadence("manche", 50, true);
  assert.equal(r.ok, true, "la cadence est activée");
  assert.equal(E.machines().automate_bois.used, 1, "l’automate au repos prend la cadence");
  assert.equal(E.machines().automate_bois.cad, 1, "compté comme affecté à une cadence");
  assert.ok(E.flows().prod.manche > 0, "le flux de production reflète la cadence active");

  // Une commande manuelle prend immédiatement la priorité sur la machine
  E.order("corde", 5);
  assert.equal(E.machines().automate_bois.cad, 0, "la commande prioritaire reprend la machine");
  assert.equal(E.machines().automate_bois.byRec.corde, 1, "la machine travaille sur la commande");
  E.cancelJob(0);
  assert.equal(E.machines().automate_bois.cad, 1, "une fois la commande annulée ou finie, la machine reprend la cadence");

  // Avancer le temps jusqu'à atteindre le plafond de 50 manches
  E.step(30);
  assert.ok(E.state.inv.manche >= 50, "le stock a atteint le plafond de 50");
  const cadInfo = E.cadences().find((c) => c.id === "manche");
  assert.equal(cadInfo.status, "full", "la cadence passe à l’état seuil atteint");
  assert.equal(E.machines().automate_bois.used, 0, "la machine retourne au repos une fois le seuil atteint");

  // Sauvegarde et rechargement préservent la cadence
  const saved = E.serialize();
  const E2 = createEngine();
  E2.load(saved);
  assert.equal(E2.cadences().length, 1);
  assert.equal(E2.cadences()[0].cap, 50);
});
console.log(passed + " tests du guidage réussis.");
