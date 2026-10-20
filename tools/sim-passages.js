#!/usr/bin/env node
/* Simulateur d’équilibrage : un joueur automatique joue le VRAI moteur, sans écran,
 * avec une horloge virtuelle (pas de 100 ms), pour mesurer en combien de minutes de
 * jeu actif il franchit chaque passage (Plaine, Rivière, Collines…), avec ou sans
 * améliorations de la Mémoire des mains. Sert à régler D.PASSAGES[z].cost et .tr.
 * (tools/sim.js, lui, est l’ancien bot qui joue une partie complète jusqu’à une fin.)
 *
 *   node tools/sim-passages.js [--minutes 120] [--mem recolte=1,extr=2,…]
 *                     [--offline H] [--compare] [--reflexion 20] [--carnet N]
 *                     [--taps 4] [--retour 120] [--journal] [--cout riviere=2,collines=3] [--cycles N]
 *
 *   --mem       niveaux de la Mémoire (ids de D.MEMOIRE) ; la relève est simulée (newCycle)
 *   --offline H après chaque passage, une absence de H heures (le jeu tourne seul, E.catchUp)
 *   --compare   4 profils côte à côte : aucune mémoire · recolte=1 · recolte=2,extr=2,mains=2 ·
 *               recolte=3,extr=4,mains=3,paquetage=2,raccourci=1
 *   --reflexion secondes de réflexion par recette jamais faite (20) ; --carnet N : les recettes
 *               des âges ≤ N sont déjà connues (−1 : aucune ; avec une mémoire : 4, car une
 *               relève a déjà eu lieu) ; --taps : appuis par seconde (4) ; --retour : voir ci-dessous
 *   --journal   affiche l’heure de chaque objectif atteint (pour voir où le joueur coince)
 *   --cout z=k  multiplie par k le prix du passage z (en mémoire seulement : data.js reste intact)
 *   --cycles N  enchaîne N cycles de --minutes chacun : relève (newCycle) puis achats de Mémoire
 *               automatiques dans l’ordre ACHATS, avec les Traces gagnées ; le Carnet reste acquis
 *
 * Le joueur simulé (simple, réaliste, pas optimal) :
 *  - il connaît toutes les recettes (E.learn), mais perd --reflexion secondes (sans récolter) à
 *    chaque recette qu’il fait pour la première fois, sous-pièces comprises ;
 *  - il récolte à la main --taps fois par seconde, sur la matière brute qui lui manque le plus
 *    pour son but (sinon bois, fibres, pierre à tour de rôle), dans la terre qui rend le plus ;
 *  - il suit l’objectif du jeu (E.objective) : il met en file ce qu’il faut (E.queue en chaîne),
 *    lance les explorations, verse dans les passages dès qu’il peut ; il prépare l’objectif suivant
 *    quand le sien est entièrement réuni ; les étapes « automate » sont ignorées (pas de machines) ;
 *  - il investit : extracteur, outil ou amélioration de récolte, un à la fois, quand l’achat
 *    se rembourse en moins de --retour secondes (coût en secondes de récolte à la main ÷ gain)
 *    et qu’il reste assez à récolter ; l’extracteur va sur le gisement de la matière demandée ;
 *    les matières de cet achat passent avant le gros besoin, et un achat trop long est abandonné ;
 *  - une fabrication en chaîne que le moteur fige (voir brain) est annulée puis refaite pièce par pièce ;
 *  - il joue sans interruption (hors --offline). La « minute » des tableaux est du jeu actif.
 * Le moteur n’est jamais modifié. Le fichier s’importe aussi : { play, lire, PROFILS }. */
"use strict";
const D = require("../js/data.js");
const { createEngine } = require("../js/engine.js");
const I = D.ITEMS;

const PROFILS = [
  { nom: "aucune", mem: {} },
  { nom: "recolte=1", mem: { recolte: 1 } },
  { nom: "r2 e2 m2", mem: { recolte: 2, extr: 2, mains: 2 } },
  { nom: "r3 e4 m3 p2 rac1", mem: { recolte: 3, extr: 4, mains: 3, paquetage: 2, raccourci: 1 } }
];

/* Ordre des achats de Mémoire avec --cycles (strict : si les Traces ne suffisent pas, on économise) */
const ACHATS = ["recolte", "mains", "recolte", "paquetage", "extr", "mains", "raccourci", "recolte", "extr", "paquetage", "raccourci",
  "mains", "recolte", "extr", "extr", "chemins", "recolte", "mains", "extr", "chemins", "chemins", "mains", "recolte", "extr"];

/* ------------------------------------------------------------------ options */
function lire(argv) {
  const o = { minutes: 120, mem: {}, offline: 0, compare: false, reflexion: 20, carnet: null, taps: 4, retour: 120, journal: false, cout: {}, cycles: 1 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i], val = () => argv[++i];
    if (a === "--minutes") o.minutes = +val();
    else if (a === "--mem") {
      val().split(",").filter(Boolean).forEach((p) => {
        const [k, v] = p.split("="), m = D.MEMOIRE.find((x) => x.id === k);
        if (!m || !(+v >= 0) || +v > m.cost.length) throw new Error("--mem : « " + p + " » inconnu (ids : " + D.MEMOIRE.map((x) => x.id + "≤" + x.cost.length).join(" ") + ")");
        if (+v > 0) o.mem[k] = +v;
      });
    }
    else if (a === "--offline") o.offline = +val();
    else if (a === "--compare") o.compare = true;
    else if (a === "--reflexion") o.reflexion = +val();
    else if (a === "--carnet") o.carnet = +val();
    else if (a === "--taps") o.taps = +val();
    else if (a === "--retour") o.retour = +val();
    else if (a === "--journal") o.journal = true;
    else if (a === "--cycles") o.cycles = Math.max(1, Math.floor(+val()));
    else if (a === "--cout") val().split(",").filter(Boolean).forEach((p) => { // --cout riviere=2,collines=3
      const [z, v] = p.split("=");
      if (!D.PASSAGES[z] || !(+v > 0)) throw new Error("--cout : « " + p + " » inconnu (passages : " + Object.keys(D.PASSAGES).join(" ") + ")");
      o.cout[z] = +v;
    });
    else throw new Error("option inconnue : " + a + " (voir l’en-tête de tools/sim-passages.js)");
  }
  return o;
}

/* ------------------------------------------------------------------ une partie */
function play(o) {
  let T = 1e12;
  const T0 = T, E = createEngine({ now: () => T, rand: () => 0.5 }), S = () => E.state;
  for (const id in I) if (I[id].r && !I[id].sec && !I[id].path) E.learn(id, true); // il connaît tout
  const avecMem = Object.keys(o.mem).length > 0;
  if (avecMem) { S().meta.mem = Object.assign({}, o.mem); E.recalc(); E.newCycle(); } // paquetage, raccourci
  const carnet = o.carnet === null ? (avecMem ? 4 : -1) : o.carnet;
  const decouvert = new Set(Object.keys(I).filter((id) => I[id].r && I[id].a <= carnet)); // recettes déjà faites

  let rows = [], traces = 0, prete = {}, debut = 0, pense0 = 0; // le cycle en cours (prete : minute où l’objet-clé rend le passage possible)
  let absent = 0, partir = false, pense = 0, penseTotal = 0;
  const minutes = () => (T - T0 - absent) / 60000, cyc = () => minutes() - debut;
  const ouverts = () => { for (const z in S().pass) if (S().pass[z].done) rows.push({ z, t: 0, age: S().age, traces: 0, offert: true }); };
  ouverts();
  E.on("passage", (z) => { if (prete[z] === undefined) prete[z] = cyc(); });
  E.on("passdone", ({ z, tr }) => {
    traces += tr; rows.push({ z, t: cyc(), age: S().age, traces, prete: prete[z], pense: penseTotal / 60 - pense0 });
    if (o.offline > 0) partir = true;
  });

  /* objectifs du jeu, avec leur indice (E.objective ne sait pas regarder plus loin) */
  const objs = D.OBJECTIVES.map((x, i) => (Array.isArray(x) ? { i, k: "craft", id: x[0] } : Object.assign({ i }, x)));
  const fait = (x) => x.k === "craft" ? S().made[x.id] > 0
    : x.k === "pass" ? !!(S().pass[x.z] && S().pass[x.z].done)
    : x.k === "exp" ? (S().exp.done[x.z] || 0) > E.ZONES[x.z].exps.findIndex((e) => e.id === x.x)
    : x.k === "line" ? !!S().flags.lineDone : !!S().flags.extDone;
  /* l’objectif en cours puis le suivant ; on saute les machines et la pose de l’extracteur
   * (elle se fait toute seule), et l’exploration qui avance déjà */
  function etapes() {
    const ob = E.objective(), out = [];
    for (let i = ob ? ob.i : objs.length; i < objs.length && out.length < 2; i++) {
      const x = objs[i];
      if (fait(x) || x.k === "line" || x.k === "ext" || (x.k === "exp" && S().exp.active)) continue;
      out.push(x);
    }
    return out;
  }

  /* ---- matières : où récolter, combien ça coûte en secondes de main ---- */
  let need = {}, urgent = {}, planned = {}, invest = null, rr = 0, tapAcc = 0, attente = 0, gels = 0;
  let evite = new Set(); // investissements abandonnés (trop longs à réunir) pour ce cycle
  const plat = new Set(); // objets dont la fabrication en chaîne s’est figée
  function bestZone(r) {
    let best = null, by = 0;
    for (const z of E.openZones()) if (z.res.includes(r) && E.tapYield(r, z.id) > by) { by = E.tapYield(r, z.id); best = z.id; }
    return best;
  }
  const handRate = (r) => (bestZone(r) ? o.taps * E.tapYield(r, bestZone(r)) : 0); // unités par seconde à la main
  const gathered = (id) => I[id].t === "res" && E.RES_ZONE[id] && E.zoneOpen(E.RES_ZONE[id]);
  /* matières brutes d’un objet fabriqué de zéro */
  function leaves(id, qty, out, d) {
    out = out || {}; d = d || 0;
    if (!I[id].r || gathered(id) || d > 12) { out[id] = (out[id] || 0) + qty; return out; }
    const n = Math.ceil(qty / I[id].r[2]), cost = E.isScaled(I[id]) ? E.totalCost(id, n) : null;
    for (const i in I[id].r[1]) leaves(i, cost ? cost[i] : I[id].r[1][i] * n, out, d + 1);
    return out;
  }
  const secs = (lv) => Object.keys(lv).reduce((a, r) => a + (handRate(r) ? lv[r] / handRate(r) : Infinity), 0);

  /* ---- ordres : ce qu’il faut avoir (id, qty) → récolte à faire, ou mise en file ---- */
  function queue(id, k, chaine) {
    const frais = (chaine === false ? [id] : E.plan(id, k).steps.map((s) => s[0])).filter((x) => !decouvert.has(x));
    if (!E.queue(id, k, chaine !== false).ok) return;
    frais.forEach((x) => decouvert.add(x));
    pense += frais.length * o.reflexion; penseTotal += frais.length * o.reflexion;
  }
  function order(id, qty, depth) {
    const it = I[id], d = Math.ceil(qty - E.count(id) - E.queued(id) - 1e-9);
    if (d <= 0) return;
    if (gathered(id)) { need[id] = (need[id] || 0) + d; return; }
    if (!it.r) return; // matière d’une terre fermée : le passage ou l’objet-clé s’en occupe
    const s = E.nextStep(id); // station, objet-clé d’une terre… à faire d’abord
    if (s.why === "pass") return;
    if (s.id !== id) { if ((depth || 0) < 8) order(s.id, 1, (depth || 0) + 1); return; }
    const times = E.isUnique(it) ? 1 : d;
    if (plat.has(id)) { // chaîne figée : les ingrédients d’abord, puis la pièce quand ils sont en stock
      const c = E.totalCost(id, times);
      if ((depth || 0) < 10) for (const i in c) order(i, c[i], (depth || 0) + 1);
      const k = Math.min(times, E.maxCraftable(id, times));
      if (k >= Math.min(times, 6)) queue(id, k, false);
      return;
    }
    const p = E.plan(id, times);
    for (const m in p.missing) if (gathered(m)) need[m] = (need[m] || 0) + p.missing[m];
    if (p.ok) return queue(id, times);
    const k = E.isUnique(it) ? 0 : E.maxPlan(id, times); // en plusieurs fois s’il y en a beaucoup
    if (k >= Math.min(times, 6)) queue(id, k);
  }
  function souhaits(x) {
    if (!x) return [];
    // l’objectif demande de FABRIQUER l’objet (S.made) : le stock du paquetage ne compte pas
    if (x.k === "craft") return [[x.id, S().made[x.id] > 0 ? 1 : E.count(x.id) + 1]];
    const n = x.k === "exp" && E.nextExp(x.z);
    return n && n.x.id === x.x ? Object.entries(n.x.cost || {}) : [];
  }

  /* ---- investir : extracteurs, outils et améliorations de récolte ---- */
  function gain(id, total) { // secondes de main économisées par seconde (et la matière visée)
    const it = I[id], e = it.e || {};
    let g = 0, res = null;
    if (it.t === "ext") {
      for (const r in it.p) {
        const dep = E.deposits().find((d) => d.z === it.z && d.res === r);
        if (!need[r] || !dep || !handRate(r)) continue;
        const v = E.extOut({ u: { [id]: 1 }, res: r }) / handRate(r);
        if (v > g) { g = v; res = r; }
      }
      return { g, res };
    }
    for (const r in need) {
      const h = handRate(r), z = bestZone(r);
      if (!h) continue;
      const mt = e.tap ? (e.tap[r] || 1) * (e.tap[z] || 1) * (e.tap["*"] || 1) : 1;
      const ma = e.auto ? (e.auto[E.RES_ZONE[r]] || 1) * (e.auto["*"] || 1) : 1;
      g += (mt - 1) * (need[r] / h / total) + (ma - 1) * E.rate(r) / h;
    }
    return { g, res: null };
  }
  function chooseInvest() {
    const total = Object.keys(need).reduce((a, r) => a + (handRate(r) ? need[r] / handRate(r) : 0), 0); // reste à récolter, en s
    let best = null;
    if (total < 10) return null;
    for (const id in I) {
      const it = I[id];
      if (!it.r || it.sec || it.path || it.a > S().age || (it.e && it.e.zone) || !["ext", "tool", "upg"].includes(it.t)) continue;
      if (it.t !== "ext" && (!it.e || !(it.e.tap || it.e.auto))) continue;
      if (E.isUnique(it) && S().made[id] > 0 || evite.has(id)) continue;
      const g = gain(id, total);
      if (!(g.g > 0) || E.nextStep(id).id !== id) continue;
      const pb = secs(leaves(id, 1)) / g.g; // temps de remboursement
      if (pb <= o.retour && total >= pb && (!best || pb < best.pb)) best = { id, pb, base: E.count(id), t0: minutes() };
      if (best && best.id === id) planned[id] = g.res;
    }
    return best;
  }
  /* un extracteur fabriqué se pose sur le gisement de la matière demandée */
  function place() {
    const U = E.extUnits();
    for (const t of E.EXTS) {
      const n = U[t].own - U[t].used;
      if (n < 1) continue;
      const deps = E.deposits().filter((d) => d.z === I[t].z && E.extRate(t, d.res) > 0)
        .sort((a, b) => (b.res === planned[t]) - (a.res === planned[t]) || (need[b.res] || 0) - (need[a.res] || 0) || E.extRate(t, b.res) - E.extRate(t, a.res));
      if (deps.length) E.domExtSet(deps[0].z, deps[0].res, t, ((E.domExt(deps[0].z, deps[0].res) || { u: {} }).u[t] || 0) + n);
    }
  }

  /* ---- la tête du joueur : une fois par demi-seconde ---- */
  function brain() {
    need = {};
    /* défaut du moteur : une fabrication en chaîne peut se figer (étape placée avant sa sous-pièce).
     * Comme un joueur, il l’annule au bout de 5 s et la refait pièce par pièce. */
    const j0 = S().hand.q[0];
    attente = j0 && j0.w ? attente + 0.5 : 0;
    if (attente >= 5) { plat.add(j0.id); E.cancelJob(0); attente = 0; gels++; }
    const [a, b] = etapes();
    if (invest && (E.count(invest.id) > invest.base || minutes() - invest.t0 > 4)) { // fait, ou abandonné au bout de 4 min
      if (E.count(invest.id) <= invest.base) evite.add(invest.id);
      invest = null;
    }
    const W = [];
    E.passPending().forEach((z) => { const p = E.passInfo(z); for (const i in p.left) W.push([i, p.left[i]]); });
    souhaits(a).forEach((w) => W.push(w));
    W.forEach(([id, q]) => order(id, q));
    const gros = need;
    need = {};
    if (invest) order(invest.id, invest.base + 1); // petit achat : ses besoins passent avant le gros besoin
    urgent = need;
    need = gros;
    for (const r in urgent) need[r] = (need[r] || 0) + urgent[r];
    if (!Object.keys(need).length && !E.passPending().length) souhaits(b).forEach(([id, q]) => order(id, q)); // il prépare la suite
    if (a && a.k === "exp" && !S().exp.active) E.startExp(a.z);
    E.passPending().forEach((z) => E.passPour(z)); // il verse dès qu’il peut
    place();
    if (!invest) invest = chooseInvest();
  }
  function tapOnce() {
    let best = null, sc = -Infinity;
    const pick = (src) => {
      for (const r in src) {
        const y = bestZone(r) && E.tapYield(r, bestZone(r));
        if (src[r] <= 0 || !y) continue;
        const s = (src[r] - E.rate(r) * 15) / y; // ce que les extracteurs apporteront n’est pas à récolter
        if (s > sc) { sc = s; best = r; }
      }
    };
    pick(urgent);
    if (!best) pick(need);
    if (!best) { best = ["bois", "fibre", "caillou"][rr++ % 3]; } // à tour de rôle
    const g = E.tap(best, bestZone(best));
    if (need[best] > 0) need[best] -= g;
    if (urgent[best] > 0) urgent[best] -= g;
  }

  /* ---- le mur : le prochain passage, versé en partie ou pas encore possible ---- */
  function mur() {
    const ob = E.objective(), pend = E.passPending()[0], z = pend || (objs.find((x) => x.k === "pass" && !fait(x)) || {}).z;
    return z && { z, info: E.passInfo(z), objectif: ob && (ob.n || ob.id) };
  }
  /* la relève : Traces gagnées, puis achats de Mémoire dans l’ordre, tant que les Traces suffisent */
  function releve() {
    E.newCycle();
    for (const id of ACHATS) if (!E.memBuy(id) && E.memCost(id) !== undefined) break;
    need = {}; urgent = {}; planned = {}; invest = null; evite = new Set(); rows = []; traces = 0; prete = {}; debut = minutes(); pense0 = penseTotal / 60;
    ouverts();
  }

  /* ---- la boucle : pas de 100 ms, 4 appuis par seconde ---- */
  const cycles = [];
  let objPrec = -1;
  for (let c = 1; ; c++) {
    for (let step = 0; cyc() < o.minutes; step++) {
      T += 100;
      E.update();
      if (o.journal && step % 10 === 0) { // --journal : l’heure de chaque objectif franchi
        const ob = E.objective();
        if (ob && ob.i !== objPrec) { objPrec = ob.i; console.log("  " + mm(cyc()) + " min  objectif " + String(ob.i).padStart(2) + " : " + (ob.id || ob.n)); }
      }
      if (partir) { partir = false; T += o.offline * 3600e3; absent += o.offline * 3600e3; E.update(); } // absence : E.catchUp
      if (pense > 0) { pense -= 0.1; continue; } // il réfléchit à l’Atelier : ni décision ni récolte
      if (step % 5 === 0) brain();
      tapAcc += o.taps / 10;
      for (; tapAcc >= 1; tapAcc--) tapOnce();
    }
    cycles.push({ rows, traces, mem: Object.assign({}, S().meta.mem), mur: mur() });
    if (c >= o.cycles || !E.canReleve()) break;
    if (o.journal) console.log("  --- relève " + c + " : +" + E.releveGain() + " Traces");
    releve();
  }

  /* ---- bilan (fin du dernier cycle) ---- */
  const ext = {};
  E.EXTS.forEach((t) => { if (E.count(t) >= 1) ext[t] = Math.floor(E.count(t)); });
  const stocks = Object.keys(S().inv).filter((i) => I[i] && I[i].t === "res" && S().inv[i] >= 1).sort((a, b) => S().inv[b] - S().inv[a]).slice(0, 8).map((i) => i + " " + Math.floor(S().inv[i]));
  const rend = ["bois", "fibre", "caillou", "os", "cuir", "argile", "silex", "sable", "malachite", "fer_min"].filter((i) => gathered(i) && bestZone(i))
    .map((i) => i + " " + Math.round(handRate(i)) + "|" + Math.round(E.rate(i)));
  const last = cycles[cycles.length - 1];
  return { E, cycles, rows: last.rows, traces: last.traces, mur: last.mur, ext, stocks, rend, age: S().age, minutes: cyc(), absent: absent / 60, penseTotal, gels, taps: S().stats.taps, crafts: S().stats.crafts };
}

/* ------------------------------------------------------------------ affichage */
const nomPass = (z) => D.PASSAGES[z].n + " (" + z + ")";
const mm = (t) => t.toFixed(1).padStart(6);
const memTxt = (m) => (Object.keys(m).length ? Object.keys(m).map((k) => k + "=" + m[k]).join(",") : "aucune");
function murTxt(r) {
  if (!r.mur) return "aucun passage en vue";
  const p = r.mur.info, left = p && p.ready ? Object.entries(p.left).map(([i, q]) => i + " " + q).join(", ") : "";
  return nomPass(r.mur.z) + (p && p.ready ? " versé à " + Math.round(p.frac * 100) + " %, reste : " + left : " pas encore possible, objectif : " + r.mur.objectif);
}
function afficher(o, r) {
  console.log("Joueur simulé : " + o.taps + " appuis/s · réflexion " + o.reflexion + " s" +
    " · mémoire : " + memTxt(o.mem) + " · " + o.minutes + " min de jeu actif" + (o.offline ? " · absence de " + o.offline + " h après chaque passage" : ""));
  console.log("\n  Passage                         Minute  Durée dont réfl. Versé en  Âge                   Traces");
  let prev = 0, prevP = 0;
  r.rows.forEach((x) => {
    console.log("  " + nomPass(x.z).padEnd(32) + (x.offert ? "offert".padStart(6) : mm(x.t)) + (x.offert ? "".padStart(21) : mm(x.t - prev) + mm(x.pense - prevP) + "  " + mm(x.t - x.prete)) + "  " +
      D.AGES[x.age].n.padEnd(22) + String(x.traces).padStart(4) + (x.offert ? "  (raccourci : pas de Traces)" : ""));
    if (!x.offert) { prev = x.t; prevP = x.pense; }
  });
  if (!r.rows.length) console.log("  (aucun passage franchi)");
  console.log("\n  Mur à " + r.minutes.toFixed(0) + " min : " + murTxt(r));
  console.log("  Stocks : " + r.stocks.join(", "));
  console.log("  Récolte par seconde (main|extracteurs) : " + r.rend.join(", "));
  console.log("  Extracteurs : " + (Object.keys(r.ext).map((t) => t + "×" + r.ext[t]).join(", ") || "aucun") + " · Traces gagnées par les passages : " + r.traces);
  console.log("  Réflexion cumulée : " + (r.penseTotal / 60).toFixed(1) + " min · appuis : " + r.taps + " · fabrications : " + r.crafts + (r.absent ? " · absences : " + r.absent.toFixed(0) + " h" : "") +
    (r.gels ? " · chaînes figées par le moteur, refaites pièce par pièce : " + r.gels : ""));
}
function afficherCycles(o, r) {
  console.log("Joueur simulé : " + o.cycles + " cycles de " + o.minutes + " min de jeu actif · réflexion " + o.reflexion + " s (une fois par recette, le Carnet reste acquis)");
  r.cycles.forEach((c, i) => {
    console.log("\n  Cycle " + (i + 1) + " · mémoire : " + memTxt(c.mem) + " · Traces gagnées : " + c.traces);
    console.log("    " + (c.rows.map((x) => x.z + " " + (x.offert ? "offert" : x.t.toFixed(1))).join(" · ") || "aucun passage franchi"));
    console.log("    mur : " + murTxt(c));
  });
}
function comparer(o) {
  const res = PROFILS.map((p) => play(Object.assign({}, o, { mem: p.mem, cycles: 1 })));
  console.log("Comparaison (" + o.minutes + " min de jeu actif" + (o.offline ? " · absence " + o.offline + " h après chaque passage" : "") + " · réflexion " + o.reflexion + " s, carnet connu jusqu’à l’âge 4 avec une mémoire)\n");
  console.log("  " + "Minute du passage".padEnd(30) + PROFILS.map((p) => p.nom.padStart(18)).join(""));
  Object.keys(D.PASSAGES).forEach((z) => {
    if (!res.some((r) => r.rows.some((x) => x.z === z))) return;
    console.log("  " + (z + " (+" + D.PASSAGES[z].tr + ")").padEnd(30) + res.map((r) => { const x = r.rows.find((y) => y.z === z); return (x ? (x.offert ? "offert" : x.t.toFixed(1)) : "—").padStart(18); }).join(""));
  });
  const ligne = (nom, f) => console.log("  " + nom.padEnd(30) + res.map((r) => String(f(r)).padStart(18)).join(""));
  ligne("Traces gagnées (passages)", (r) => r.traces);
  ligne("Âge atteint", (r) => D.AGES[r.age].id);
  ligne("Extracteurs posés", (r) => Object.values(r.ext).reduce((a, b) => a + b, 0));
  ligne("Réflexion (min)", (r) => (r.penseTotal / 60).toFixed(1));
  console.log("\n  Mur à " + o.minutes + " min :");
  res.forEach((r, i) => console.log("   " + PROFILS[i].nom.padEnd(18) + murTxt(r)));
}

if (require.main === module) {
  try {
    const o = lire(process.argv.slice(2));
    for (const z in o.cout) for (const i in D.PASSAGES[z].cost) D.PASSAGES[z].cost[i] = Math.max(1, Math.round(D.PASSAGES[z].cost[i] * o.cout[z]));
    if (o.compare) comparer(o); else if (o.cycles > 1) afficherCycles(o, play(o)); else afficher(o, play(o));
  } catch (e) { console.error(e.message); process.exitCode = 1; }
}
module.exports = { play, lire, PROFILS };
