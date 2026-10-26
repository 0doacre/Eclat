#!/usr/bin/env node
/* Bot de simulation : joue une partie complète avec le vrai moteur et une
 * horloge virtuelle, pour mesurer le rythme de progression.
 *   node tools/sim.js [tapsParSeconde=4] [projet=dyson] [graine=1]
 * MAINS=1 : fabriquer à la main prend du temps (comme la file « Tes mains ») ;
 * les machines possédées aident pour ce qui s’automatise, de façon idéale
 * (sans tapis à poser). Sans MAINS, tout se fabrique instantanément : une borne basse.
 */
"use strict";
const D = require("../js/data.js");
const { createEngine } = require("../js/engine.js");

const TAPS = Number(process.argv[2] || 4);
const PROJECT = process.argv[3] || "dyson";
let seed = Number(process.argv[4] || 1);
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);

let T = 0;
const E = createEngine({ now: () => T, rand: rnd });
const S = () => E.state;
const I = D.ITEMS;
const HAND = new Set(D.ZONES.flatMap((z) => z.res));
const MAX_T = 12 * 3600;
const log = [];
const ageAt = {};
const MAINS = !!process.env.MAINS;
let busyUntil = 0, busyTotal = 0, handTotal = 0, lastMach = -1e9;
/* crafts par seconde des machines possédées, si on pouvait les mettre toutes à l’ouvrage */
const machRate = () => E.MACHINES.reduce((a, m) => a + Math.floor(S().inv[m] || 0) * I[m].spd / 60, 0) * E.cache().aspd;
/* RELEVE=<âge> : à cet âge, le bot fait la relève, répare les ruines dès qu’il le peut, rejoue, et on mesure le temps du rattrapage */
const RELEVE = process.env.RELEVE !== undefined ? Number(process.env.RELEVE) : null;
let releveAt = null, relevePending = false, cycle2At = {};
E.on("age", (a) => {
  if (RELEVE !== null && S().cycle >= 2) { cycle2At[a] = T / 1000 - releveAt; if (a >= RELEVE) stopNow = true; return; }
  if (RELEVE !== null && a >= RELEVE && releveAt === null) { releveAt = T / 1000; relevePending = true; }
});
E.on("age", (a) => { if (RELEVE !== null && S().cycle >= 2) return; ageAt[a] = T / 1000; if (process.env.STOP_AGE && a >= Number(process.env.STOP_AGE)) stopNow = true; });
let stopNow = false;
const objAt = [];
const OBJ = new Set(D.OBJECTIVES.filter(Array.isArray).map((o) => o[0]));
E.on("discover", (id) => { if (OBJ.has(id)) objAt.push([id, T / 1000]); });
const fmtT = (s) => { s = Math.round(s); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return (h ? h + "h" : "") + String(m).padStart(h ? 2 : 1, "0") + "m" + String(s % 60).padStart(2, "0") + "s"; };

/* station la moins avancée qui satisfait un besoin de geste/chaleur/niveau */
function stationFor(g, heat, lvl) {
  let best = null;
  for (const id in I) {
    const it = I[id];
    if (!it.e || !it.e.st || it.sec) continue;
    for (const s of it.e.st) {
      if (s.g !== g) continue;
      if (heat && (s.heat || 0) < heat) continue;
      if (lvl && (s.lvl || 1) < lvl) continue;
      if (!best || it.a < I[best].a) best = id;
    }
  }
  return best;
}

/* Planifie les besoins pour un ensemble de cibles : déficits de matières
 * premières et objets bloquants (stations, zones). */
function plan(targets, fromEmpty) {
  const avail = fromEmpty ? {} : Object.assign({}, S().inv);
  const raw = {};
  const blockers = [];
  function need(id, qty, depth) {
    if (depth > 30) return;
    const have = avail[id] || 0;
    if (have >= qty - 1e-9) { avail[id] = have - qty; return; }
    avail[id] = 0;
    const d = qty - have;
    const it = I[id];
    const zid = E.RES_ZONE[id];
    if (zid && E.zoneOpen(zid)) {
      // Une ressource sans récolte à la main demande d’abord son extracteur.
      // Sinon un investissement (scierie, par exemple) peut attendre indéfiniment de l’eau.
      if (!HAND.has(id) && E.rate(id) <= 0) {
        const ext = E.extFor(id, zid).sort((a, b) => I[a].a - I[b].a)[0];
        if (ext) { blockers.push(ext); return; }
      }
      raw[id] = (raw[id] || 0) + d; return;
    }
    if (it.r) {
      const [g, ing, out, o = {}] = it.r;
      if (!E.gesteOK(g) || (o.heat && E.heat() < o.heat) || (o.lvl && E.level(g) < o.lvl)) {
        const st = g === "accorder" ? null : stationFor(g, o.heat, o.lvl);
        if (st) blockers.push(st);
        return;
      }
      if (E.isUnique(it) && S().made[id] > 0) return;
      const crafts = E.isScaled(it) ? 1 : Math.ceil(d / out);
      const cost = E.isScaled(it) ? E.costFor(id) : null;
      for (const i in ing) need(i, cost ? cost[i] : ing[i] * crafts, depth + 1);
      return;
    }
    if (zid) { blockers.push(E.ZONES[zid].req); return; }
    blockers.push(id);
  }
  for (const id in targets) need(id, targets[id], 0);
  return { raw, blockers };
}

/* Fabrique récursivement ce qui est possible pour approcher la cible. */
function produce(id, qty, depth) {
  depth = depth || 0;
  if (depth > 30) return;
  if (MAINS && busyUntil > T) return; // les mains sont prises : on récolte en attendant
  const it = I[id];
  if ((S().inv[id] || 0) >= qty - 1e-9) return;
  if (!it.r) return;
  const zid = E.RES_ZONE[id];
  if (zid && E.zoneOpen(zid) && it.t === "res") return;
  if (E.blocker(id)) return;
  const unit = E.isScaled(it);
  const crafts = unit ? 1 : Math.ceil((qty - (S().inv[id] || 0)) / it.r[2]);
  const cost = unit ? E.costFor(id) : null;
  for (const i in it.r[1]) produce(i, cost ? cost[i] : it.r[1][i] * crafts, depth + 1);
  const n = Math.min(crafts, E.maxCraftable(id, crafts));
  if (n > 0) {
    if (MAINS) {
      const h = E.batchTime(id, n), auto = E.automatable(id) ? machRate() : 0;
      const d = n / (n / h + auto);
      busyUntil = Math.max(busyUntil, T) + d * 1000;
      busyTotal += d; handTotal += h;
    }
    E.craft(id, n, true);
    // un extracteur ne travaille que posé sur un gisement
    if (it.t === "ext") for (let k = 0; k < n; k++) E.domAutoExt(id);
  }
}

function tapsCost(raw) {
  let t = 0;
  for (const r in raw) t += raw[r] / E.tapYield(r, E.RES_ZONE[r]);
  return t;
}

/* Valeur (en « tapes économisées par seconde ») d’un investissement. */
function benefit(id, deficit) {
  const it = I[id], c = E.cache();
  let b = 0;
  const e = it.e || {};
  if (it.t === "ext") {
    const m = (c.auto[it.z] || 1) * (c.auto["*"] || 1) * c.echo;
    for (const r in it.p) {
      const w = deficit[r] ? 1 : 0.25;
      b += (it.p[r] * m / E.tapYield(r, E.RES_ZONE[r])) * w;
    }
  }
  if (e.auto) {
    const rates = {};
    for (const r in E.RES_ZONE) if (E.rate(r) > 0) rates[r] = E.rate(r);
    for (const r in rates) {
      const z = E.RES_ZONE[r];
      const mult = (e.auto[z] || 1) * (e.auto["*"] || 1);
      if (mult > 1) b += (rates[r] * (mult - 1)) / E.tapYield(r, z) * (deficit[r] ? 1 : 0.5);
    }
  }
  if (e.tap) {
    let share = 0, tot = 0;
    for (const r in deficit) {
      const z = E.RES_ZONE[r];
      const mult = (e.tap[r] || 1) * (e.tap[z] || 1) * (e.tap["*"] || 1);
      tot += deficit[r];
      if (mult > 1) share += deficit[r] * (mult - 1);
    }
    if (tot > 0) b += TAPS * share / tot;
  }
  return b;
}

let interim = null;
let interimBase = 0;
let lastEval = -1e9;
let projDone = false;
let endT = null;

function currentTargets() {
  if (interim) return { [interim]: E.isUnique(I[interim]) ? 1 : (S().inv[interim] || 0) + 1 };
  const ob = E.objective();
  if (ob && ob.k === "exp") return null; // les explorations sont lancées à chaque tour
  if (ob && ob.k === "ext") { if (S().inv.cabane >= 1 && !Object.keys(S().dom.ext).length) E.domAutoExt("cabane"); return { bois: (S().inv.bois || 0) + 1 }; }
  if (ob && ob.k === "pass") { S().pass[ob.z].done = true; S().zones[ob.z] = true; E.recalc(); return null; }
  if (ob && ob.k === "line") {
    // une commande : un automate qui aide à faire des manches
    S().known.manche = true;
    S().made.manche = Math.max(1, S().made.manche || 0);
    if (S().inv.automate_bois >= 1 && !S().hand.q.length) E.order("manche", 5);
    return { bois: (S().inv.bois || 0) + 15 };
  }
  if (ob) return { [ob.id]: 1 };
  const ps = E.projState(PROJECT);
  const st = D.PROJECTS[PROJECT].steps[ps.step];
  if (!st) return null;
  if (st.fire) { E.fire(PROJECT); return null; }
  if (st.melody) { st.melody && D.MELODIES[st.melody].notes.forEach((n) => E.playNote(n)); return null; }
  const t = {};
  for (const i in st.cost) {
    const left = st.cost[i] - (ps.paid[i] || 0);
    if (left > 0) t[i] = Math.min(left, I[i].t === "res" ? 1e9 : 50);
  }
  return t;
}

E.on("ending", (r) => { projDone = true; endT = T / 1000; log.push(fmtT(T / 1000) + "  ★ FIN : " + D.ENDINGS[r.id].n); });

function considerInvest(deficit, goalTaps) {
  // un joueur humain construit toujours au moins deux exemplaires de chaque extracteur disponible
  for (const id in I) {
    const it = I[id];
    if (it.t !== "ext" || it.a > S().age || !E.zoneOpen(it.z) || (S().inv[id] || 0) >= 2) continue;
    const p = plan({ [id]: (S().inv[id] || 0) + 1 });
    if (p.blockers.length) continue;
    interim = id; interimBase = S().inv[id] || 0; return;
  }
  if (MAINS && busyUntil - T > 120000 && T - lastMach > 180000) {
    // les mains sont débordées : une machine de plus, la meilleure qu’on sache faire
    const m = E.MACHINES.filter((x) => S().known[x] || I[x].a <= S().age).sort((a, b) => I[b].spd - I[a].spd).find((x) => !plan({ [x]: (S().inv[x] || 0) + 1 }).blockers.length);
    if (m) { interim = m; interimBase = S().inv[m] || 0; lastMach = T; return; }
  }
  if (goalTaps < 40) return;
  let best = null;
  for (const id in I) {
    const it = I[id];
    if (!it.r || it.sec || it.path) continue;
    if (!(it.t === "ext" || it.t === "upg" || (it.t === "tool" && it.e && it.e.tap))) continue;
    if (E.isUnique(it) && S().made[id] > 0) continue;
    if (it.t === "ext" && !E.zoneOpen(it.z)) continue;
    if (it.a > S().age) continue;
    const p = plan({ [id]: 1 });
    if (p.blockers.length) continue;
    const full = plan({ [id]: 1 }, true);
    if (full.blockers.length) continue;
    const cost = tapsCost(full.raw);
    const b = benefit(id, deficit);
    if (b <= 0) continue;
    const payback = cost / b;
    if (payback < 400 && (!best || payback < best.pb)) best = { id, pb: payback };
  }
  if (best) { interim = best.id; interimBase = S().inv[best.id] || 0; }
}

for (T = 0; T < MAX_T * 1000 && !projDone && !stopNow; T += 1000) {
  E.update();
  if (relevePending) { relevePending = false; E.newCycle(); interim = null; }
  if (RELEVE !== null && S().cycle >= 2) for (const id of Object.keys(E.ruins())) E.repair(id);
  for (const z of E.passPending()) { S().pass[z].done = true; S().zones[z] = true; E.recalc(); }
  // explorations
  if (!S().exp.active) for (const z of E.openZones()) {
    const n = E.nextExp(z.id);
    if (n && !n.locked) {
      if (n.x.cost) for (const i in n.x.cost) produce(i, n.x.cost[i]);
      if (E.startExp(z.id).ok) break;
    }
  }
  if (interim && ((E.isUnique(I[interim]) && S().made[interim] > 0) || (!E.isUnique(I[interim]) && interimBase < (S().inv[interim] || 0)))) interim = null;
  let targets = currentTargets();
  if (!targets) continue;
  // contribuer au projet
  if (!E.objective() && !interim) E.contribute(PROJECT);
  let p = plan(targets);
  let guard = 0;
  while (p.blockers.length && guard++ < 10) {
    const b = p.blockers[0];
    if (!b || (S().made[b] > 0 && E.isUnique(I[b]))) break;
    targets = { [b]: 1 };
    p = plan(targets);
  }
  for (const id in targets) produce(id, targets[id]);
  p = plan(targets);
  if (T - lastEval > 10000) {
    lastEval = T;
    if (!interim) considerInvest(p.raw, tapsCost(p.raw));
  }
  // tapes
  const raws = Object.keys(p.raw);
  for (let k = 0; k < TAPS && raws.length; k++) {
    let best = null, bs = -1;
    for (const r of raws) {
      const left = p.raw[r] - E.rate(r) * 20;
      const sc = left / E.tapYield(r, E.RES_ZONE[r]);
      if (sc > bs) { bs = sc; best = r; }
    }
    if (best && bs > 0) { const g = E.tap(best); p.raw[best] -= g; }
  }
  for (const id in targets) produce(id, targets[id]);
}

if (process.env.DUMP) {
  S().introSeen = true;
  S().t = Date.now();
  require("fs").writeFileSync(process.env.DUMP, E.serialize());
}
if (RELEVE !== null) {
  if (process.env.DEBUG_RELEVE) console.log("  fin : T=" + fmtT(T / 1000) + " cycle " + S().cycle + " âge " + S().age + " objectif " + JSON.stringify(E.objective()) + " ruines " + JSON.stringify(E.ruins()) + " stop " + stopNow + " inv " + JSON.stringify(S().inv).slice(0, 300) + " cibles " + JSON.stringify(currentTargets()) + " plan " + JSON.stringify(plan(currentTargets() || {})) + " zones " + JSON.stringify(S().zones));
  console.log("Relève à l’âge " + RELEVE + " (" + D.AGES[RELEVE].n + ") : première fois en " + fmtT(releveAt) + ".");
  console.log("  Rattrapage après la relève (ruines réparées dès que possible, aucun achat de Mémoire) :");
  for (const a of Object.keys(cycle2At).map(Number).sort((x, y) => x - y)) console.log("    âge " + a + " " + D.AGES[a].n.padEnd(24) + fmtT(cycle2At[a]).padStart(8) + "  (première fois : " + fmtT(ageAt[a] === undefined ? 0 : ageAt[a]) + ")");
  if (process.env.OBJ) { let prev = releveAt; objAt.filter(([, t]) => t >= releveAt).forEach(([id, t]) => { console.log("      · " + id.padEnd(18) + fmtT(t - releveAt).padStart(8) + "  (+" + fmtT(t - prev) + ")"); prev = t; }); }
  const rejoint = cycle2At[RELEVE];
  console.log(rejoint === undefined ? "  ✗ l’âge " + RELEVE + " n’est pas rejoint" : "  Rattrapé en " + fmtT(rejoint) + ", soit " + Math.round(100 * rejoint / releveAt) + " % de la première fois.");
  process.exit(0);
}
console.log("Simulation : " + TAPS + " tapes/s, projet " + PROJECT);
console.log("  Âge                            Entrée   Temps dans cet âge");
for (let a = 0; a < D.AGES.length; a++) {
  const entree = a === 0 ? 0 : ageAt[a], sortie = ageAt[a + 1];
  if (entree === undefined) continue;
  const duree = fmtT((sortie === undefined ? (endT === null ? T / 1000 : endT) : sortie) - entree);
  console.log("  " + D.AGES[a].n.padEnd(24) + fmtT(entree).padStart(10) + "   " + duree + (sortie === undefined && !projDone ? " (en cours)" : ""));
}
if (process.env.OBJ) { let prev = 0; objAt.forEach(([id, t]) => { console.log("    · " + id.padEnd(18) + fmtT(t).padStart(10) + "  (+" + fmtT(t - prev) + ")"); prev = t; }); }
log.forEach((l) => console.log("  " + l));
if (!projDone) {
  if (!stopNow) process.exitCode = 1;
  console.log("  ✗ pas de fin après " + fmtT(T / 1000) + ". Objectif : " + JSON.stringify(E.objective()) + " intérim : " + interim);
  const ps = E.projState(PROJECT);
  console.log("  étape projet : " + ps.step + " payé " + JSON.stringify(ps.paid));
  const tg = currentTargets();
  console.log("  cibles : " + JSON.stringify(tg) + " plan : " + JSON.stringify(plan(tg || {})));
}
const exts = Object.keys(I).filter((id) => I[id].t === "ext" && S().inv[id] > 0).map((id) => id + "×" + S().inv[id]);
console.log("  extracteurs : " + exts.join(", "));
console.log("  production/s : " + Object.keys(E.RES_ZONE).concat(["charbon"]).filter((r, i, a) => a.indexOf(r) === i && E.rate(r) > 0).map((r) => r + " " + E.rate(r).toFixed(1)).join(", "));
if (MAINS) console.log("  mains occupées : " + fmtT(busyTotal) + " (" + fmtT(handTotal) + " sans les machines) · machines : " + E.MACHINES.map((m) => m + "×" + Math.floor(S().inv[m] || 0)).join(", "));
console.log("  fabrications : " + S().stats.crafts + " · tapes : " + S().stats.taps + " · fragments : " + Object.keys(S().frags).length);
