#!/usr/bin/env node
/* Tests des visiteurs de passage (calendrier, hors ligne, lot, réglage, sauvegarde). */
"use strict";
const assert = require("assert");
const D = require("../js/data.js");
const { createEngine } = require("../js/engine.js");

let T = 2e12, passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log("  ✓ " + name); }
  catch (e) { console.log("  ✗ " + name + "\n    " + (e.stack || e)); process.exitCode = 1; }
}
/* un moteur dont rand() sort d'une file (puis 0.99) */
function mk(queue) {
  const q = (queue || []).slice();
  const E = createEngine({ now: () => T, rand: () => (q.length ? q.shift() : 0.99) });
  E.state.zones.plaine = true;
  return E;
}
/* du temps de jeu actif : de petites touches de 1 s */
function jouer(E, s) { for (let i = 0; i < s; i++) { T += 1000; E.update(); } }
const ctx = (o) => Object.assign({ bloque: false, zone: "lisiere", hour: 12 }, o);

console.log("Visiteurs de passage");
test("les données : 5 à 7 visiteurs, la luciole seulement la nuit", () => {
  const L = D.VISITEURS.liste;
  assert.ok(L.length >= 5 && L.length <= 7);
  assert.deepStrictEqual(L.find((x) => x.id === "luciole").tps, ["night"]);
  L.forEach((x) => assert.ok(x.t && x.n && x.tps.length));
});
test("calendrier : le premier est tiré entre 8 et 20 minutes de jeu, puis le suivant", () => {
  const E = mk([0.5, 0.0, 0.0, 0.5]);
  assert.strictEqual(E.visiteurPoll(ctx()), null, "le premier appel pose seulement la date");
  const p0 = E.state.stats.play;
  assert.strictEqual(E.state.visiteur.next, p0 + 480 + 0.5 * 720);
  jouer(E, 838);
  assert.strictEqual(E.visiteurPoll(ctx()), null, "pas encore");
  jouer(E, 4);
  const v = E.visiteurPoll(ctx());
  assert.ok(v && v.id && v.aria && v.dur > 0, "il arrive");
  assert.strictEqual(E.state.visiteur.next - E.state.stats.play, 480, "le suivant, rand = 0 : 8 minutes");
  assert.strictEqual(E.state.stats.visiteursVus, 1);
  assert.strictEqual(E.visiteurPoll(ctx()), null, "un seul à la fois");
});
test("calendrier : bornes 480 s et 1 200 s", () => {
  const lo = mk([0]); lo.visiteurPoll(ctx());
  assert.strictEqual(lo.state.visiteur.next - lo.state.stats.play, 480);
  const hi = mk([0.999999]); hi.visiteurPoll(ctx());
  const d = hi.state.visiteur.next - hi.state.stats.play;
  assert.ok(d > 1199 && d <= 1200);
});
test("aucune apparition hors ligne ni pendant le rattrapage", () => {
  const E = mk([0, 0]);
  E.visiteurPoll(ctx());
  const play = E.state.stats.play;
  T += 5 * 3600 * 1000; // cinq heures d'absence
  E.update();
  assert.strictEqual(E.state.stats.play, play, "l'absence ne compte pas comme du jeu");
  assert.strictEqual(E.visiteurPoll(ctx()), null);
  assert.strictEqual(E.state.stats.visiteursVus, 0);
  // pendant le rattrapage lui-même
  let pendant = "rien";
  E.on("offline", () => { pendant = E.visiteurPoll(ctx()); });
  T += 3600 * 1000; E.update();
  assert.ok(pendant === null || pendant === "rien");
});
test("pas pendant une fenêtre ni le tutoriel (l'écran dit « bloqué »), il attend", () => {
  const E = mk([0, 0, 0]);
  E.visiteurPoll(ctx());
  jouer(E, 500);
  assert.strictEqual(E.visiteurPoll(ctx({ bloque: true })), null);
  assert.strictEqual(E.state.stats.visiteursVus, 0);
  assert.ok(E.visiteurPoll(ctx()), "dès que l'écran est libre");
});
test("selon l'heure et la terre", () => {
  const E = mk();
  const ids = (z, h) => E.visiteursPossibles(z, h).map((x) => x.id);
  assert.ok(!ids("lisiere", 12).includes("luciole"));
  assert.ok(ids("lisiere", 23).includes("luciole"));
  assert.ok(!ids("lisiere", 3).includes("oiseau"));
  assert.ok(ids("lisiere", 19).includes("chauve"));
  assert.ok(!ids("lisiere", 12).includes("chauve"));
  assert.ok(!ids("lisiere", 12).includes("colporteur"), "le colporteur ne passe pas à la Lisière");
  assert.ok(ids("plaine", 12).includes("colporteur"));
  assert.deepStrictEqual(ids("orbite", 12), [], "pas de passant sans ciel");
  assert.deepStrictEqual(ids(null, 12), []);
  // tous les visiteurs peuvent sortir quelque part
  D.VISITEURS.liste.forEach((x) => {
    const ok = ["lisiere", "plaine", "riviere", "collines", "desert", "montagnes"].some((z) => [0, 7, 12, 19, 23].some((h) => ids(z, h).includes(x.id)));
    assert.ok(ok, x.id);
  });
});
test("le lot : de la matière de la terre (≈ 90 s de récolte), un peu d'Intuition", () => {
  const E = mk([0, 0, 0, 0.99, 0]);
  E.visiteurPoll(ctx());
  jouer(E, 485);
  const v = E.visiteurPoll(ctx({ hour: 12 }));
  assert.ok(v);
  const intu = E.state.intu;
  const lot = E.visiteurToucher(v.id);
  assert.ok(lot && lot.res && lot.zone === "lisiere");
  assert.ok(E.ZONES.lisiere.res.includes(lot.res));
  const attendu = Math.max(1, Math.round(90 * (E.skillSpeed("recolte") / D.SKILL.harvest) * E.tapYield(lot.res, "lisiere")));
  assert.strictEqual(lot.qty, attendu);
  assert.ok(lot.qty >= 30 && lot.qty < 400, "ordre de grandeur : " + lot.qty);
  assert.strictEqual(E.state.intu, intu + 1);
  assert.strictEqual(E.state.stats.visiteurs, 1);
  assert.strictEqual(E.visiteurToucher(v.id), null, "on ne prend pas deux fois");
});
test("on ne touche pas un visiteur qui n'est pas là", () => {
  const E = mk();
  assert.strictEqual(E.visiteurToucher("oiseau"), null);
  assert.strictEqual(E.state.stats.visiteurs, 0);
});
test("manqué : rien ne change, rien ne se perd", () => {
  const E = mk([0, 0, 0]);
  E.visiteurPoll(ctx());
  jouer(E, 485);
  const v = E.visiteurPoll(ctx());
  const inv = JSON.stringify(E.state.inv), intu = E.state.intu;
  E.visiteurPartir();
  assert.strictEqual(JSON.stringify(E.state.inv), inv);
  assert.strictEqual(E.state.intu, intu);
  assert.strictEqual(E.visiteurToucher(v.id), null);
  assert.strictEqual(E.state.stats.visiteurs, 0);
});
/* seul le colporteur est possible : on peut donc fixer rand() et regarder ce qu'il laisse */
function colporteur(rv) {
  const E = createEngine({ now: () => T, rand: () => rv });
  E.state.zones.plaine = true;
  E.state.stats.play = 100; E.state.visiteur.next = 50;
  return E;
}
function seul(id, fn) {
  const liste = D.VISITEURS.liste;
  D.VISITEURS.liste = liste.filter((x) => x.id === id);
  try { fn(); } finally { D.VISITEURS.liste = liste; }
}
test("très rare : une page du Livre que le Comptoir vend (colporteur seulement)", () => seul("colporteur", () => {
  const E = colporteur(0);
  assert.strictEqual(E.visiteurPoll(ctx({ zone: "plaine" })).id, "colporteur");
  const l = E.visiteurToucher("colporteur");
  assert.ok(l.page && E.hasPage(l.page));
  assert.ok(D.RECIT.pages[l.page].src.some((s) => s.k === "buy"));
}));
test("pas de page si le Comptoir est fermé", () => seul("colporteur", () => {
  const F = colporteur(0);
  F.visiteurPoll(ctx({ zone: "plaine" }));
  F.state.zones.plaine = false;
  assert.ok(!F.visiteurToucher("colporteur").page);
}));
test("très rare : un clin d'œil, une seule fois, jamais avec une page", () => seul("colporteur", () => {
  const E = colporteur(0.03);
  E.visiteurPoll(ctx({ zone: "plaine" }));
  const c1 = E.visiteurToucher("colporteur");
  assert.ok(c1.clin && !c1.page);
  E.state.visiteur.next = 50;
  E.visiteurPoll(ctx({ zone: "plaine" }));
  const c2 = E.visiteurToucher("colporteur");
  assert.ok(!c2.clin, "pas deux fois le même");
  assert.strictEqual(E.state.stats.visiteursClins, 1);
}));
test("rarement un petit objet : une pièce déjà fabriquée", () => seul("oiseau", () => {
  const F = createEngine({ now: () => T, rand: () => 0.05 });
  F.state.made.manche = 3; F.state.stats.play = 100; F.state.visiteur.next = 50;
  F.visiteurPoll(ctx());
  const l = F.visiteurToucher("oiseau");
  assert.strictEqual(l.objet, "manche");
  assert.ok(F.count("manche") >= 1);
}));
test("les clins d'œil : aucun nom propre réel, phrases courtes", () => {
  D.VISITEURS.liste.forEach((x) => {
    if (!x.clin) return;
    assert.ok(!/Zelda|Link|Navi|Mario|Sonic|Castlevania|Dracula|Minecraft/i.test(x.clin), x.id);
    assert.ok(x.clin.length < 160, x.id);
    assert.ok(!x.clin.includes("—"), x.id);
  });
});
test("désactiver : plus aucun visiteur ; rallumer ne le fait pas tomber tout de suite", () => {
  const E = mk([0, 0, 0, 0, 0.5]);
  E.visiteurPoll(ctx());
  jouer(E, 485);
  E.setVisiteurs(false);
  assert.strictEqual(E.visiteurActif(), false);
  jouer(E, 2000);
  assert.strictEqual(E.visiteurPoll(ctx()), null);
  E.setVisiteurs(true);
  assert.strictEqual(E.visiteurPoll(ctx()), null, "pas tout de suite");
  assert.ok(E.state.visiteur.next > E.state.stats.play);
});
test("sauvegarde : compteurs et réglage gardés ; une ancienne partie reçoit les champs par défaut", () => {
  const E = mk();
  E.state.stats.visiteurs = 4; E.state.stats.visiteursVus = 7; E.state.settings.visiteurs = false;
  E.state.visiteur = { next: 123, clins: { renard: 1 } };
  const F = createEngine({ now: () => T });
  F.load(E.serialize());
  assert.strictEqual(F.state.stats.visiteurs, 4);
  assert.strictEqual(F.state.stats.visiteursVus, 7);
  assert.strictEqual(F.state.settings.visiteurs, false);
  assert.deepStrictEqual(F.state.visiteur, { next: 123, clins: { renard: 1 } });
  const o = JSON.parse(E.serialize());
  delete o.visiteur; delete o.settings.visiteurs; delete o.stats.visiteurs; delete o.stats.visiteursVus;
  const G = createEngine({ now: () => T });
  G.load(JSON.stringify(o));
  assert.strictEqual(G.state.settings.visiteurs, true);
  assert.strictEqual(G.state.stats.visiteurs, 0);
  assert.strictEqual(G.state.stats.visiteursVus, 0);
  assert.strictEqual(G.state.visiteur.next, 0);
  assert.strictEqual(G.state.stats.taps, E.state.stats.taps, "rien d'autre ne bouge");
});

console.log(passed + " tests de visiteurs réussis" + (process.exitCode ? ", des échecs." : "."));
