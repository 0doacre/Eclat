/* Le Comptoir : le plafond mou de la conversion des écus, les demandes du Troqueur (quantité selon la production du joueur)
 * et ses ouvertures (il passe par à-coups, une série de demandes par ouverture). */
"use strict";
const assert = require("assert/strict");
const D = require("../js/data.js");
const { createEngine } = require("../js/engine.js");

let T = 1e12, passed = 0;
const mk = (graine) => {
  const E = createEngine({ now: () => T, rand: () => 0.99 });
  if (graine) E.state.meta.graine = graine;
  E.state.zones.plaine = true;
  return E;
};
function test(n, fn) {
  try { fn(); passed++; console.log("  ✓ " + n); }
  catch (e) { console.log("  ✗ " + n + "\n    " + (e.stack || e)); process.exitCode = 1; }
}
const BLOC = D.TROQUEUR.bloc * 1000;
/* avance l’horloge jusqu’au début du prochain bloc où le Troqueur est (ou n’est pas) ouvert */
function aller(E, ouvert) {
  T = Math.ceil(T / BLOC) * BLOC + 1000;
  for (let i = 0; i < 200 && E.troqueurHoraire().ouvert !== ouvert; i++) T += BLOC;
  assert.equal(E.troqueurHoraire().ouvert, ouvert);
}
/* un joueur à l’âge `age` qui récolte `bois` à `taux` par seconde (extracteurs) et connaît quelques pièces */
function joueur(graine) {
  const E = mk(graine);
  E.state.age = 1;
  for (const id of ["manche", "corde", "laniere", "aiguille"]) { E.state.known[id] = true; E.state.made[id] = 10; }
  E.state.zones.plaine = true;
  return E;
}

console.log("Comptoir : plafond mou, demandes, ouvertures");

test("plafond mou : plein tarif jusqu’aux Traces des passages, un quart au-delà, plancher de 3", () => {
  const E = mk();
  const base = E.traceBasePrice(7); // 100 × 1,8^7
  const ecus = (n) => n * base + 1;
  const d = E.ecusDetail(ecus(83), 7, 30);
  assert.deepEqual([d.brut, d.seuil, d.trace, d.plafonne], [83, 30, 43, true]);
  assert.equal(E.ecusToTraces(ecus(20), 7, 30), 20, "sous le seuil : plein tarif");
  assert.equal(E.ecusToTraces(ecus(30), 7, 30), 30, "au seuil");
  assert.equal(E.ecusToTraces(310 * E.traceBasePrice(11) + 1, 11, 48), 48 + Math.floor((310 - 48) * 0.25), "la mine de bauxite d’une nuit");
  // aucun passage : le plancher
  assert.equal(E.ecusToTraces(ecus(2), 7, 0), 2);
  assert.equal(E.ecusToTraces(ecus(11), 7, 0), 3 + 2);
  assert.equal(E.ecusDetail(0, 7, 5).trace, 0);
  assert.equal(E.ecusDetail(ecus(10), 7, 30).plafonne, false);
});

test("la relève applique le plafond avec les Traces des passages du cycle", () => {
  const E = mk();
  E.state.pass.plaine = { paid: {}, done: true };
  E.state.pass.riviere = { paid: {}, done: true };
  const P = E.releveGain();
  assert.equal(P, 5);
  E.state.age = 3;
  const base = E.traceBasePrice(3);
  E.state.ecus = 100 * base + 1;
  const t0 = E.state.meta.traces;
  E.newCycle();
  assert.equal(E.state.meta.traces - t0, P + 5 + Math.floor(95 * 0.25));
});

test("les horaires du Troqueur : mêmes pour une même graine, jamais plus de 3 blocs fermés de suite, ouvert la plupart du temps", () => {
  const a = mk(1234), b = mk(1234), c = mk(99);
  let ouverts = 0, serie = 0, maxSerie = 0, differe = 0;
  const N = 2000;
  for (let k = 0; k < N; k++) {
    const t = 1e12 + k * BLOC + 5;
    const ha = a.troqueurHoraire(t), hb = b.troqueurHoraire(t), hc = c.troqueurHoraire(t);
    assert.deepEqual(ha, hb);
    if (ha.ouvert !== hc.ouvert) differe++;
    if (ha.ouvert) { ouverts++; serie = 0; } else { serie++; maxSerie = Math.max(maxSerie, serie); }
  }
  assert.ok(maxSerie <= D.TROQUEUR.maxFerme, "blocs fermés de suite : " + maxSerie);
  assert.ok(ouverts / N > 0.5 && ouverts / N < 0.85, "part ouverte : " + (ouverts / N).toFixed(2));
  assert.ok(differe > N * 0.2, "une autre graine, d’autres horaires");
});

test("l’horaire donne la fin de l’ouverture ou le début de la prochaine, sur une frontière de bloc", () => {
  const E = mk(777);
  for (let k = 0; k < 300; k++) {
    const t = 1e12 + k * BLOC * 0.77;
    const h = E.troqueurHoraire(t);
    const bord = h.ouvert ? h.fin : h.ouvre;
    assert.equal(bord % BLOC, 0);
    assert.ok(bord > t);
    // juste avant le bord : même état ; au bord : l’état change
    assert.equal(E.troqueurHoraire(bord - 1).ouvert, h.ouvert);
    assert.equal(E.troqueurHoraire(bord).ouvert, !h.ouvert);
  }
});

test("une série de demandes par ouverture : pas de renouvellement tant qu’il est là, rien quand il est parti, une nouvelle série à son retour", () => {
  const E = joueur(777);
  aller(E, true);
  const fin = E.troqueurHoraire().fin;
  E.add("bois", 50); E.add("fibre", 50);
  E.state.dom.ext["lisiere:bois"] = { z: "lisiere", res: "bois", u: { cabane: 5 }, on: true }; E.state.inv.cabane = 5;
  E.state.dom.ext["lisiere:fibre"] = { z: "lisiere", res: "fibre", u: { fibre_1: 5 }, on: true }; E.state.inv.fibre_1 = 5;
  E.recalc();
  const serie1 = E.troqueurAsks().map((a) => a && a.id);
  assert.ok(serie1.length > 0, "des demandes à l’ouverture");
  assert.equal(E.state.comptoir.next, fin, "valable jusqu’à la fermeture");
  // il livre la première ; la place reste vide, même longtemps après (avant la fermeture)
  const ask = E.state.comptoir.asks[0];
  E.add(ask.id, ask.n);
  assert.ok(E.deliverAsk(0).ok);
  T += Math.min(fin - T - 1000, 2 * 3600 * 1000);
  E.update();
  assert.equal(E.state.comptoir.asks[0], null, "pas de renouvellement dans la même ouverture");
  assert.deepEqual(E.state.comptoir.asks.slice(1).map((a) => a && a.id), serie1.slice(1));
  // fermeture : plus rien, et une heure de retour
  T = fin + 1000;
  E.update();
  assert.equal(E.troqueurHoraire().ouvert, false);
  assert.deepEqual(E.troqueurAsks(), []);
  assert.equal(E.state.comptoir.next, E.troqueurHoraire().ouvre);
  assert.equal(E.troqueurCount(), 0);
  // retour : une nouvelle série
  T = E.troqueurHoraire().ouvre + 1000;
  E.update();
  assert.ok(E.troqueurAsks().length > 0 && E.state.comptoir.asks.every(Boolean), "nouvelle série complète");
});

test("hors ligne : une absence qui traverse une fermeture retrouve une série du bon moment", () => {
  const E = joueur(4242);
  aller(E, true);
  E.state.dom.ext["lisiere:bois"] = { z: "lisiere", res: "bois", u: { cabane: 3 }, on: true }; E.state.inv.cabane = 3; E.recalc();
  E.troqueurAsks();
  const avant = E.state.comptoir.next;
  T += 30 * 3600 * 1000;
  E.catchUp(30 * 3600);
  const h = E.troqueurHoraire();
  assert.equal(E.state.comptoir.next, h.ouvert ? h.fin : h.ouvre);
  assert.ok(E.state.comptoir.next > avant);
  if (!h.ouvert) assert.deepEqual(E.state.comptoir.asks, []);
});

test("la quantité demandée suit la production du joueur, jamais davantage que la durée prévue", () => {
  const E = joueur(1);
  E.state.dom.ext["lisiere:bois"] = { z: "lisiere", res: "bois", u: { cabane: 10 }, on: true }; E.state.inv.cabane = 10;
  E.recalc();
  for (const tr of [1, 2, 5, 14]) {
    const minutes = Math.max(D.TROQUEUR.minMin, Math.min(D.TROQUEUR.minMax, D.TROQUEUR.minParTrace * tr));
    const n = E.troqueurQuantite("manche", tr); // 3 bois par manche
    assert.ok(n >= 1);
    const bois = E.extOut(E.domExt("lisiere", "bois")) + E.tapYieldOf("bois") * D.TROQUEUR.main;
    assert.ok((n * 3) / bois <= minutes * 60 + 1e-6, "tr " + tr + " : " + n + " manches prennent plus de " + minutes + " min");
    assert.ok((n * 3) / bois >= minutes * 60 * 0.8, "et pas beaucoup moins (arrondi à deux chiffres)");
  }
  // plus de production, plus de quantité
  const a = E.troqueurQuantite("manche", 2);
  E.state.dom.ext["lisiere:bois"].u.cabane = 20; E.state.inv.cabane = 20;
  assert.ok(E.troqueurQuantite("manche", 2) > a);
});

test("pas de demande pour un objet dont une matière est inaccessible au joueur", () => {
  const E = joueur(1);
  E.state.age = 2;
  for (const id of ["brique", "eclat"]) { E.state.known[id] = true; E.state.made[id] = 3; }
  // la Rivière est fermée : l’argile de la brique et le silex de l’éclat sont inaccessibles
  assert.equal(E.troqueurQuantite("brique", 1), 0);
  assert.equal(E.troqueurQuantite("eclat", 1), 0);
  assert.ok(E.troqueurQuantite("manche", 1) > 0, "le bois de la Lisière, lui, se récolte");
  aller(E, true);
  assert.ok(E.troqueurAsks().every((a) => !a || (a.id !== "brique" && a.id !== "eclat")));
  // la Rivière s’ouvre : la brique devient demandable
  E.state.zones.riviere = true;
  assert.ok(E.troqueurQuantite("brique", 1) > 0);
});

test("la quantité d’une demande reste réaliste à tous les âges (jamais plus de 90 minutes de production)", () => {
  // un joueur avancé : toutes les terres ouvertes, des extracteurs sur toutes les matières
  const E = mk(5);
  E.state.age = 10;
  for (const z of D.ZONES) if (!z.secret) E.state.zones[z.id] = true;
  const Dm = E.deposits();
  for (const d of Dm) {
    const ext = E.extFor(d.res, d.z)[0];
    if (!ext) continue;
    E.state.inv[ext] = (E.state.inv[ext] || 0) + 6;
    E.domExtSet(d.z, d.res, ext, 6);
  }
  E.recalc();
  let vus = 0;
  for (const id in D.ITEMS) {
    const it = D.ITEMS[id];
    if (!it.r || it.sec || it.t === "tool" || it.t === "stat" || it.t === "upg" || it.t === "ext" || it.t === "mach" || it.t === "curio" || it.t === "relic") continue;
    const n = E.troqueurQuantite(id, 9);
    if (n >= 1) { vus++; assert.ok(n < 1e7, id + " " + n); }
  }
  assert.ok(vus > 50, "la plupart des pièces sont demandables : " + vus);
});

test("sauvegarde : l’état des demandes est gardé tel quel, la forme ne change pas", () => {
  const E = joueur(31);
  aller(E, true);
  E.state.dom.ext["lisiere:bois"] = { z: "lisiere", res: "bois", u: { cabane: 4 }, on: true }; E.state.inv.cabane = 4; E.recalc();
  E.troqueurAsks();
  const F = mk();
  F.load(E.serialize());
  assert.deepEqual(F.state.comptoir, E.state.comptoir);
  assert.deepEqual(Object.keys(F.state.comptoir).sort(), ["asks", "next", "sold", "traces"]);
});

console.log(passed + " tests du Comptoir réussis.");
