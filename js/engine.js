/* ÉCLAT — moteur de jeu.
 * Aucune dépendance au DOM : le même code tourne dans le navigateur et dans les
 * scripts de validation / simulation (tools/).
 */
(function (root) {
  "use strict";
  const D = root.ECLAT_DATA || (typeof require !== "undefined" ? require("./data.js") : null);

  const BASE_GESTES = ["assembler", "tresser", "tailler"];
  const UNIQUE = { tool: 1, stat: 1, upg: 1, curio: 1 };
  const SCALED = { ext: 1, auto: 1, mach: 1 };
  const OFFLINE_CAP = 12 * 3600; // secondes
  const MASTERY = [10, 50, 250, 1000];
  const SAVE_VERSION = 6;
  /* clés de l’état qui référencent des objets : nettoyées des identifiants inconnus au chargement */
  const ITEM_MAPS = ["inv", "seen", "made", "known", "hints", "pins", "studied"];

  const keyOf = (g, ids) => g + "|" + ids.slice().sort().join(",");

  /* Index des recettes : "geste|a,b,c" -> id de l’objet produit */
  const RECIPES = {};
  for (const id in D.ITEMS) {
    const it = D.ITEMS[id];
    it.id = id;
    if (it.r) {
      const k = keyOf(it.r[0], Object.keys(it.r[1]));
      if (RECIPES[k]) throw new Error("Recette en double : " + k + " (" + RECIPES[k] + " / " + id + ")");
      RECIPES[k] = id;
    }
  }
  const ZONES = {};
  D.ZONES.forEach((z) => (ZONES[z.id] = z));
  /* zone d’origine de chaque ressource */
  const RES_ZONE = {};
  D.ZONES.forEach((z) => z.res.forEach((r) => (RES_ZONE[r] = RES_ZONE[r] || z.id)));
  const MACHINES = Object.keys(D.ITEMS).filter((id) => D.ITEMS[id].t === "mach").sort((a, b) => D.ITEMS[a].spd - D.ITEMS[b].spd);
  /* Les gisements de chaque terre : ce qu’on y récolte à la main, puis ce que
   * produisent les extracteurs de la terre. */
  const EXTS = Object.keys(D.ITEMS).filter((id) => D.ITEMS[id].t === "ext");
  const ZONE_DEPS = {}; // zone → [{ res, hand }]
  D.ZONES.forEach((z) => {
    const list = z.res.slice();
    EXTS.forEach((id) => { if (D.ITEMS[id].z === z.id) for (const r in D.ITEMS[id].p) if (!list.includes(r)) list.push(r); });
    ZONE_DEPS[z.id] = list.map((r) => ({ res: r, hand: z.res.includes(r) }));
  });
  const extKey = (z, res) => z + ":" + res;
  /* un extracteur posé met tout son effort sur la matière de son gisement */
  const extRate = (id, r) => { const p = D.ITEMS[id] && D.ITEMS[id].p; return p && p[r] ? p[r] * Object.keys(p).length : 0; };
  /* un extracteur ne travaille que sur les gisements de sa propre terre */
  const extOk = (id, z, r) => !!(D.ITEMS[id] && D.ITEMS[id].z === z && extRate(id, r) > 0);
  /* Où étaient ces gisements sur la grille de l’ancienne usine (sauvegardes v4 et
   * v5) : ne sert plus qu’à la migration, pour savoir ce qu’exploitait chaque case. */
  const OLD_PATCH = {
    lisiere: [0, -7], plaine: [8, 0], riviere: [0, 8], collines: [-9, 0], mine: [9, -9], desert: [-10, 9],
    gisement: [10, 10], montagnes: [-11, -10], orbite: [0, -16], lune: [17, 0], mercure: [0, 17], caveau: [-17, 0]
  };
  const OLD_DEPOSITS = {}; // "x,y" → { z, res }
  D.ZONES.forEach((z, i) => {
    const far = 20 + i * 3, deps = ZONE_DEPS[z.id];
    const [cx, cy] = OLD_PATCH[z.id] || [Math.round(Math.cos(i * 2.4) * far), Math.round(Math.sin(i * 2.4) * far)];
    deps.forEach((d, j) => (OLD_DEPOSITS[(cx - (deps.length - 1) + 2 * j) + "," + cy] = { z: z.id, res: d.res }));
  });
  /* profondeur d’une recette (0 pour une matière brute) : sert à faire tourner les
   * machines qui font un ingrédient avant celles qui l’utilisent */
  const DEPTH = {};
  const depthOf = (id, seen) => {
    if (DEPTH[id] !== undefined) return DEPTH[id];
    const it = D.ITEMS[id];
    if (!it || !it.r || seen[id]) return 0;
    seen[id] = true;
    let d = 0;
    for (const i in it.r[1]) d = Math.max(d, depthOf(i, seen) + 1);
    return (DEPTH[id] = d);
  };
  for (const id in D.ITEMS) depthOf(id, {});
  const freshDom = () => ({ ext: {}, mach: [], site: {}, ms: {}, seq: 0 });

  function freshState(now) {
    return {
      v: SAVE_VERSION, t: now, start: now,
      inv: {}, seen: {}, made: {}, known: {}, hints: {},
      intu: 3, zones: { lisiere: true }, flags: { ages: {} }, frags: {}, secrets: {},
      exp: { active: null, done: {} }, age: 0,
      dom: freshDom(), pins: {}, track: null, gt: { id: null, p: 0 }, tried: {}, pass: {},
      hand: { q: [], p: 0 }, studied: {}, skills: {}, act: null,
      proj: {}, endings: {},
      ecus: 0, comptoir: { sold: {}, traces: 0 },
      arche: [], term: [], notes: [],
      stats: { taps: 0, crafts: 0, tries: 0, play: 0 },
      cycle: 1, echoes: 0, meta: { endings: {}, capsule: false, traces: 0, tracesTotal: 0, mem: {}, ev: {}, ruins: {} },
      settings: { sound: true, vibe: true },
      pipAcc: 0, intuAcc: 0, moon: 0, introSeen: false
    };
  }

  /* Migration d’une sauvegarde vers la version courante. Ne supprime jamais
   * de donnée du joueur : ce qui n’a plus d’usage est rangé dans `orphans`. */
  function migrate(o) {
    const from = o.v || 1;
    if (from > SAVE_VERSION) throw new Error("Sauvegarde d’une version plus récente du jeu (v" + from + ")");
    if (from < 2) {
      // v1 : les « chaînes d’assemblage » automatisaient des recettes via `auto`.
      // v2 : elles deviennent des machines de la Fabrique, chacune affectée à une ligne.
      o.flags = o.flags || {};
      o.lines = [];
      o.lineSeq = 0;
      const slots = Math.floor((o.inv && o.inv.chaine) || 0);
      (o.auto || []).slice(0, slots).forEach((r) => {
        if (D.ITEMS[r]) o.lines.push({ id: "L" + ++o.lineSeq, r, m: "chaine", n: 1, on: true, cap: 0, acc: 0 });
      });
      if (o.lines.length) o.flags.lineDone = true;
      delete o.auto;
      delete o.autoAcc;
      o.pins = {};
      o.track = null;
      o.gt = { id: null, t: 0 };
      o.flags.news = "2";
      o.v = 2;
    }
    if (from < 3) {
      // v3 : la Fabrique devient une usine sur grille. Chaque ligne de production
      // devient une machine posée le long d’un tapis qui fait le tour de la Réserve.
      o.flags = o.flags || {};
      const r = fabFromLines(o.lines || []);
      o.fab = r.fab;
      if (r.placed || r.left) o.flags.fab3 = { placed: r.placed, left: r.left };
      delete o.lines;
      delete o.lineSeq;
      o.flags.news = "3";
      o.v = 3;
    }
    if (from < 4) {
      // v4 : les extracteurs ne récoltent plus « tout seuls » : ils travaillent posés
      // sur les gisements de la Fabrique. Ceux du joueur y sont posés et reliés à la
      // Réserve au chargement (voir E.load), pour que rien ne s’arrête.
      o.flags = o.flags || {};
      if (EXTS.some((t) => o.inv && o.inv[t] >= 1)) o.flags.fab4 = "todo";
      o.flags.news = "4";
      o.v = 4;
    }
    if (from < 5) {
      // v5 : la file des mains et l’étude des matières (ajoutées vides au chargement).
      // Un Grand Œuvre commencé garde ce qui a été versé ; il se poursuit désormais
      // par un chantier posé sur la carte, ce que la fenêtre des nouveautés explique.
      o.flags = o.flags || {};
      const proj = o.proj && typeof o.proj === "object" ? o.proj : {};
      if (Object.keys(proj).some((p) => proj[p] && (proj[p].step > 0 || Object.keys(proj[p].paid || {}).length))) o.flags.v5proj = true;
      o.flags.news = "5";
      o.v = 5;
    }
    if (from < 6) {
      // v6 : plus de grille ni de tapis. Les extracteurs, les machines et les chantiers
      // passent dans le Domaine (voir domFromFab) ; l’ancienne usine est gardée de côté.
      o.flags = o.flags || {};
      o.dom = domFromFab(o);
      if (o.fab && o.fab.c && Object.keys(o.fab.c).length) { o.orphans = o.orphans || {}; o.orphans.fab5 = o.fab; }
      delete o.fab;
      if (o.settings && typeof o.settings === "object") delete o.settings.usine;
      o.flags.news = "6";
      o.v = 6;
    }
    return o;
  }

  /* v2 → v3 : chaque ligne de production devenait une machine posée sur la grille
   * de l’usine. La grille n’existe plus : on ne garde que les machines, que la v6
   * range dans le Domaine (voir domFromFab). */
  function fabFromLines(lines) {
    const fab = { c: {}, ms: {}, seq: 0 };
    const live = lines.filter((L) => L && D.ITEMS[L.r] && D.ITEMS[L.m] && D.ITEMS[L.m].t === "mach" && L.n > 0);
    live.forEach((L, i) => {
      fab.c["L" + i] = { k: "mach", id: "M" + ++fab.seq, m: L.m, r: L.r, n: Math.max(1, Math.floor(L.n)), on: L.on !== false, cap: Math.max(0, Math.floor(L.cap) || 0) };
    });
    return { fab, placed: live.length, left: 0 };
  }

  /* rend au stock d’une sauvegarde ce qui était en route (ou le met de côté si l’objet n’existe plus) */
  function backToInv(o, b) {
    if (!b || typeof b !== "object") return;
    for (const i in b) {
      const v = Number(b[i]);
      if (!(v > 0)) continue;
      if (D.ITEMS[i]) o.inv[i] = (o.inv[i] || 0) + v;
      else { o.orphans = o.orphans || {}; (o.orphans.inv = o.orphans.inv || {})[i] = (o.orphans.inv[i] || 0) + v; }
    }
  }
  /* v5 → v6 : la grille disparaît. Chaque exploitation rejoint son gisement, chaque
   * machine devient une chaîne du Domaine, chaque chantier un Grand Œuvre alimenté.
   * Ce que les extracteurs et les chantiers avaient en main rejoint la Réserve. */
  function domFromFab(o) {
    const dom = freshDom(), f = o.fab;
    if (!f || typeof f !== "object" || !f.c || typeof f.c !== "object") return dom;
    const ms = f.ms && typeof f.ms === "object" ? f.ms : {};
    dom.seq = Math.max(0, Math.floor(f.seq) || 0);
    const hasDep = (z, res) => !!z && !!ZONE_DEPS[z] && ZONE_DEPS[z].some((d) => d.res === res);
    for (const k in f.c) {
      const e = f.c[k];
      if (!e || typeof e !== "object") continue;
      const B = typeof e.id === "string" && ms[e.id] && typeof ms[e.id] === "object" ? ms[e.id] : null;
      if (e.k === "ext" && e.u && typeof e.u === "object") {
        let dep = OLD_DEPOSITS[k];
        if (!dep || dep.res !== e.res) {
          // une case qui n’était pas sur son gisement : la terre de ses extracteurs, sinon la première qui l’a
          const z = Object.keys(e.u).map((t) => D.ITEMS[t] && D.ITEMS[t].z).concat([RES_ZONE[e.res]]).find((x) => hasDep(x, e.res)) ||
            D.ZONES.map((x) => x.id).find((x) => hasDep(x, e.res));
          dep = z ? { z, res: e.res } : null;
        }
        if (dep) {
          const x = dom.ext[extKey(dep.z, dep.res)] || (dom.ext[extKey(dep.z, dep.res)] = { z: dep.z, res: dep.res, u: {}, on: false });
          for (const t in e.u) { const n = Math.floor(e.u[t]) || 0; if (n > 0) x.u[t] = (x.u[t] || 0) + n; }
          x.on = x.on || e.on !== false;
        }
        if (B && e.res) backToInv(o, { [e.res]: B.o });
      } else if (e.k === "mach" && typeof e.id === "string") {
        o.flags = o.flags || {};
        o.flags.mach57 = true;
        if (B) {
          backToInv(o, B.b);
          if (e.r) backToInv(o, { [e.r]: B.o });
        }
      } else if (e.k === "site" && typeof e.p === "string") {
        dom.site[e.p] = { on: true };
        if (B) backToInv(o, B.b);
      }
    }
    return dom;
  }

  function createEngine(opts) {
    opts = opts || {};
    const now = opts.now || (() => Date.now());
    const rand = opts.rand || Math.random;
    const listeners = {};
    const E = { D, RECIPES, ZONES, RES_ZONE, MACHINES, keyOf, SAVE_VERSION };
    let S = freshState(now());
    S.meta.parcours = 1;
    let C = null; // caches dérivés de l’état

    /* ------------------------------------------------------- événements */
    E.on = (evt, fn) => { (listeners[evt] = listeners[evt] || []).push(fn); };
    E.emit = (evt, a, b) => { (listeners[evt] || []).forEach((fn) => fn(a, b)); };
    Object.defineProperty(E, "state", { get: () => S });

    /* --------------------------------------------------------- outils */
    const item = (id) => D.ITEMS[id];
    const has = (id) => (S.inv[id] || 0) > 0;
    const count = (id) => S.inv[id] || 0;
    const isUnique = (it) => !!UNIQUE[it.t] || (it.t === "relic" && !!it.r);
    const isScaled = (it) => !!SCALED[it.t];
    E.item = item; E.has = has; E.count = count; E.isUnique = isUnique; E.isScaled = isScaled;

    function add(id, n) {
      if (!n) return;
      S.inv[id] = (S.inv[id] || 0) + n;
      if (S.inv[id] < 1e-9) S.inv[id] = 0;
      if (n > 0) markSeen(id);
    }
    /* l’ordre de découverte, pour trier les matières (les anciennes parties ont « true ») */
    function markSeen(id) {
      if (!S.seen[id]) { S.seen[id] = (S.seenSeq = (S.seenSeq || 0) + 1); E.emit("struct"); }
    }
    E.add = add;

    /* -------------------------------------------------- effets dérivés */
    function recalc() {
      const c = { st: {}, heat: 0, tap: {}, auto: {}, intu: 0, exp: 1, pip: 0, aspd: 1, rates: {}, sky: false, arche: false, term: false, signal: false };
      const mulInto = (dst, src) => { for (const k in src) dst[k] = (dst[k] || 1) * src[k]; };
      for (const id in S.inv) {
        if (!(S.inv[id] > 0)) continue;
        const it = item(id); if (!it) continue;
        const e = it.e;
        if (e && isUnique(it)) {
          if (e.st) e.st.forEach((s) => {
            const cur = c.st[s.g] || (c.st[s.g] = { lvl: 0 });
            if (s.heat) cur.heat = Math.max(cur.heat || 0, s.heat);
            cur.lvl = Math.max(cur.lvl, s.lvl || 1);
          });
          if (e.tap) mulInto(c.tap, e.tap);
          if (e.auto) mulInto(c.auto, e.auto);
          if (e.intu) c.intu += e.intu;
          if (e.exp) c.exp *= e.exp;
          if (e.pip) c.pip += e.pip;
          if (e.aspd) c.aspd *= e.aspd;
          if (e.sky) c.sky = true;
          if (e.arche) c.arche = true;
          if (e.term) c.term = true;
          if (e.signal) c.signal = true;
        }
      }
      c.heat = c.st.chauffer ? c.st.chauffer.heat || 0 : 0;
      if (S.flags.lucioles) c.auto["*"] = (c.auto["*"] || 1) * 1.25;
      c.echo = 1 + 0.5 * (S.echoes || 0);
      C = c;
      return c;
    }
    E.recalc = recalc;
    E.cache = () => C || recalc();

    /* ------------------------------------------------------ gestes */
    function gesteOK(g) {
      if (BASE_GESTES.includes(g)) return true;
      if (g === "accorder") return !!S.flags.berceuse && has("flute");
      return !!E.cache().st[g];
    }
    E.gesteOK = gesteOK;
    E.gestes = () => D.GESTE_ORDER.filter(gesteOK);
    E.heat = () => E.cache().heat;
    E.level = (g) => (E.cache().st[g] ? E.cache().st[g].lvl : 0);

    /* station (non secrète) la moins avancée qui satisfait un geste, une chaleur, un niveau */
    function stationFor(g, heat, lvl) {
      let best = null;
      for (const id in D.ITEMS) {
        const it = D.ITEMS[id];
        if (!it.e || !it.e.st || it.sec) continue;
        for (const s of it.e.st) {
          if (s.g !== g || (heat && (s.heat || 0) < heat) || (lvl && (s.lvl || 1) < lvl)) continue;
          if (!best || it.a < D.ITEMS[best].a) best = id;
        }
      }
      return best;
    }
    E.stationFor = stationFor;

    /* ------------------------------------------------------ zones */
    function zoneOpen(zid) { return !!S.zones[zid]; }
    E.zoneOpen = zoneOpen;
    E.openZones = () => D.ZONES.filter((z) => zoneOpen(z.id));
    function unlockZone(zid) {
      if (S.zones[zid]) return;
      S.zones[zid] = true;
      E.emit("zone", zid);
      E.emit("struct");
    }

    /* ------------------------------------------------------ Mémoire des mains (voir docs/PROGRESSION.md)
     * Les améliorations que les Semeurs se transmettent, achetées avec les Traces. */
    const MEM = {};
    D.MEMOIRE.forEach((m) => (MEM[m.id] = m));
    const memLvl = (id) => (S.meta && S.meta.mem && S.meta.mem[id]) || 0;
    const memV = (id) => MEM[id].v(memLvl(id));
    E.memLvl = memLvl;
    E.memV = memV;
    E.memCost = (id) => MEM[id].cost[memLvl(id)]; // undefined : au maximum
    E.memBuy = function (id) {
      const m = MEM[id], c = m && m.cost[memLvl(id)];
      if (c === undefined || S.meta.traces < c) return false;
      S.meta.traces -= c;
      S.meta.mem[id] = memLvl(id) + 1;
      recalc();
      E.emit("struct");
      return true;
    };

    /* ------------------------------------------------------ passages
     * L’objet qui ouvrait une terre rend son passage possible ; la terre s’ouvre quand
     * le passage est payé. On verse depuis la Réserve, en plusieurs fois si besoin. */
    const PASS = D.PASSAGES;
    function reachZone(zid) {
      if (!PASS[zid]) return unlockZone(zid);
      const p = S.pass[zid] || (S.pass[zid] = { paid: {}, done: false });
      if (p.done) return unlockZone(zid);
      E.emit("passage", zid);
      E.emit("struct");
    }
    E.passCost = function (zid) {
      const k = memV("chemins"), out = {};
      for (const i in PASS[zid].cost) out[i] = Math.max(1, Math.ceil(PASS[zid].cost[i] * k));
      return out;
    };
    /* où en est un passage : possible (l’objet est fait), payé, ce qui reste */
    E.passInfo = function (zid) {
      const P = PASS[zid], p = S.pass[zid];
      if (!P) return null;
      const cost = E.passCost(zid), paid = (p && p.paid) || {}, left = {};
      let need = 0, got = 0;
      for (const i in cost) {
        const g = Math.min(cost[i], paid[i] || 0);
        need += cost[i]; got += g;
        if (g < cost[i]) left[i] = cost[i] - g;
      }
      return { z: zid, P, cost, paid, left, ready: !!p, done: !!(p && p.done), frac: need ? got / need : 1, can: Object.keys(left).some((i) => (S.inv[i] || 0) >= 1) };
    };
    E.passPending = () => Object.keys(PASS).filter((z) => S.pass[z] && !S.pass[z].done);
    E.passPour = function (zid) {
      const p = S.pass[zid];
      if (!p || p.done) return { ok: false };
      const cost = E.passCost(zid), gave = {};
      for (const i in cost) {
        const g = Math.min(Math.floor(S.inv[i] || 0), cost[i] - (p.paid[i] || 0));
        if (g > 0) { add(i, -g); p.paid[i] = (p.paid[i] || 0) + g; gave[i] = g; }
      }
      const done = Object.keys(cost).every((i) => (p.paid[i] || 0) >= cost[i]);
      if (done) {
        p.done = true;
        E.emit("passdone", { z: zid, tr: PASS[zid].tr });
        unlockZone(zid);
        checkAges();
      }
      E.emit("struct");
      return { ok: Object.keys(gave).length > 0, gave, done };
    };
    /* ------------------------------------------------------ la relève
     * Ce qu’un nouveau Semeur gagnerait maintenant : les Traces des passages franchis. */
    E.releveGain = () => Object.keys(S.pass || {}).reduce((a, z) => a + (S.pass[z].done && !S.pass[z].free && PASS[z] ? PASS[z].tr : 0), 0);
    E.canReleve = () => E.releveGain() > 0 || Object.keys(S.endings || {}).length > 0;

    /* ------------------------------------------------------ récolte */
    /* ------------------------------------------------------ compétences
     * Une par geste, et la récolte. L’expérience vient de ce qu’on fait soi-même. */
    const SK = D.SKILL;
    const SKILLS = D.GESTE_ORDER.concat(["recolte"]);
    const XP_T = [0, 0]; // XP_T[L] : expérience totale pour atteindre le niveau L
    for (let L = 2, acc = 0; L <= SK.max; L++) { acc += Math.floor(L - 1 + 300 * Math.pow(2, (L - 1) / 7)) / 4; XP_T[L] = Math.floor(acc * SK.k); }
    const levelOf = (xp) => { let L = 1; while (L < SK.max && xp >= XP_T[L + 1]) L++; return L; };
    const lvl = (g) => levelOf((S.skills && S.skills[g]) || 0);
    E.SKILLS = SKILLS;
    E.XP_T = XP_T;
    E.skill = function (g) {
      const xp = (S.skills && S.skills[g]) || 0, L = levelOf(xp), lo = XP_T[L], hi = L < SK.max ? XP_T[L + 1] : lo;
      return { g, xp, lvl: L, lo, hi, frac: hi > lo ? (xp - lo) / (hi - lo) : 1, perks: SK.perks.filter((p) => L >= p).length, next: SK.perks.find((p) => p > L) || null };
    };
    /* plus rapide à chaque niveau ; une chance de pièce en plus à chaque palier */
    const skillSpeed = (g) => 1 + SK.speed * (lvl(g) - 1);
    const perkChance = (g) => SK.perk * SK.perks.filter((p) => lvl(g) >= p).length;
    E.skillSpeed = skillSpeed;
    E.perkChance = perkChance;
    function gainXp(g, n) {
      if (!(n > 0) || !SKILLS.includes(g)) return;
      const before = lvl(g);
      S.skills[g] = (S.skills[g] || 0) + n;
      const after = lvl(g);
      if (after > before) E.emit("level", { g, lvl: after, perk: SK.perks.includes(after) });
    }
    E.gainXp = gainXp;
    /* l’expérience d’une pièce : le temps qu’elle demande à la main, en somme */
    const xpOf = (id) => { const it = item(id); return Math.max(1, Math.round(SK.xp * (H.base + H.age * (it.a || 0)) * (isUnique(it) ? H.unique : isScaled(it) ? H.scaled : 1))); };
    E.xpOf = xpOf;

    function tapYield(res, zid) {
      const c = E.cache();
      return (item(res).b || 1) * (c.tap[res] || 1) * (c.tap[zid] || 1) * (c.tap["*"] || 1) * c.echo * memV("recolte") * skillSpeed("recolte");
    }
    E.tapYield = tapYield;
    E.tap = function (res, zid) {
      zid = zid || RES_ZONE[res];
      if (!zoneOpen(zid) || !ZONES[zid].res.includes(res)) return 0;
      let n = tapYield(res, zid);
      if (!(n > 0)) return 0;
      // coup de chance : la récolte double, et l’interface fait des étincelles
      E.lastCrit = rand() < D.CRIT.chance + D.CRIT.up * memLvl("oeil");
      if (E.lastCrit) { n *= D.CRIT.mult; S.stats.crits = (S.stats.crits || 0) + 1; }
      add(res, n);
      S.stats.taps++;
      gainXp("recolte", SK.tapXp);
      return n;
    };
    E.tapYieldOf = (res) => { const z = RES_ZONE[res]; return z && zoneOpen(z) ? tapYield(res, z) : 0; };
    /* ce que récoltent les extracteurs pour une matière (par seconde) */
    E.rate = (res) => {
      let r = 0;
      const c = E.cache();
      for (const k in S.dom.ext) {
        const e = S.dom.ext[k];
        if (e.res === res && machStat[k] && machStat[k].s === "ok") r += extOut(e, c);
      }
      return r;
    };

    /* ------------------------------------------------------ coûts */
    function costFor(id, k) {
      const it = item(id), base = it.r[1];
      if (!isScaled(it)) return base;
      const f = Math.pow(it.s || 1.15, k);
      const out = {};
      for (const i in base) out[i] = Math.ceil(base[i] * f);
      return out;
    }
    /* coût total de `times` fabrications, la première étant la n° `from` (par défaut : ce qu’on possède) */
    function totalCost(id, times, from) {
      const it = item(id), tot = {};
      if (isScaled(it)) {
        const owned = from === undefined ? count(id) : from;
        for (let k = 0; k < times; k++) {
          const c = costFor(id, owned + k);
          for (const i in c) tot[i] = (tot[i] || 0) + c[i];
        }
      } else for (const i in it.r[1]) tot[i] = it.r[1][i] * times;
      return tot;
    }
    E.costFor = (id) => costFor(id, count(id));
    E.totalCost = totalCost;

    /* Pourquoi une recette ne peut-elle pas être réalisée ? */
    function blocker(id) {
      const it = item(id), r = it.r, o = r[3] || {};
      if (!gesteOK(r[0])) return { why: "geste", g: r[0] };
      if (o.heat && E.heat() < o.heat) return { why: "heat", heat: o.heat };
      if (o.lvl && E.level(r[0]) < o.lvl) return { why: "lvl", lvl: o.lvl };
      if (isUnique(it) && (S.made[id] || 0) > 0) return { why: "owned" };
      return null;
    }
    E.blocker = blocker;
    /* la station qui lèverait ce blocage (four plus chaud, enclume plus dure, station du geste) */
    E.blockStation = function (id, b) {
      b = b || blocker(id);
      const g = item(id).r[0];
      if (!b) return null;
      if (b.why === "heat") return stationFor("chauffer", b.heat, 0);
      if (b.why === "lvl") return stationFor(g, 0, b.lvl);
      if (b.why === "geste" && !(D.GESTES[g] && D.GESTES[g].secret)) return stationFor(g, 0, 0);
      return null;
    };

    function missingFor(id, times) {
      const tot = totalCost(id, times), miss = {};
      let any = false;
      for (const i in tot) {
        const lack = tot[i] - (S.inv[i] || 0);
        if (lack > 1e-9) { miss[i] = Math.ceil(lack); any = true; }
      }
      return any ? miss : null;
    }
    E.missingFor = missingFor;

    function maxCraftable(id, cap) {
      cap = cap || 100000;
      const it = item(id);
      if (!it || !it.r || blocker(id)) return 0;
      if (isUnique(it)) return missingFor(id, 1) ? 0 : 1;
      if (isScaled(it)) {
        let n = 0;
        const left = Object.assign({}, S.inv);
        while (n < Math.min(cap, 500)) {
          const c = costFor(id, count(id) + n);
          let ok = true;
          for (const i in c) if ((left[i] || 0) < c[i]) { ok = false; break; }
          if (!ok) break;
          for (const i in c) left[i] -= c[i];
          n++;
        }
        return n;
      }
      let n = cap;
      for (const i in it.r[1]) n = Math.min(n, Math.floor((S.inv[i] || 0) / it.r[1][i] + 1e-9));
      return Math.max(0, n);
    }
    E.maxCraftable = maxCraftable;

    E.stars = (id) => { const m = S.made[id] || 0; let s = 0; MASTERY.forEach((t) => { if (m >= t) s++; }); return s; };
    E.MASTERY = MASTERY;

    /* ------------------------------------------------------ fabrication */
    function learn(id, silent) {
      if (S.known[id]) return false;
      S.known[id] = true;
      const it = item(id);
      if (!silent && !it.sec) S.intu += 1;
      E.emit("learn", id);
      E.emit("struct");
      return true;
    }
    E.learn = learn;

    /* chefs-d’œuvre : chance de lot bonus selon la maîtrise */
    function bonusFor(it, times) {
      let bonus = 0;
      if (it.t !== "comp" && it.t !== "res") return 0;
      const ch = 0.04 * E.stars(it.id) + (it.r ? perkChance(it.r[0]) : 0);
      if (ch > 0) {
        if (times <= 200) for (let k = 0; k < times; k++) { if (rand() < ch) bonus++; }
        else bonus = Math.floor(times * ch + rand());
      }
      return bonus;
    }

    function craft(id, times, quiet) {
      times = Math.max(1, Math.floor(times || 1));
      const it = item(id);
      if (!it || !it.r) return { ok: false, why: "none" };
      const b = blocker(id);
      if (b) return { ok: false, why: b.why, info: b };
      if (isUnique(it)) times = 1;
      const miss = missingFor(id, times);
      if (miss) return { ok: false, why: "qty", missing: miss };
      const tot = totalCost(id, times);
      for (const i in tot) add(i, -tot[i]);
      return makeIt(id, times, quiet);
    }
    E.craft = craft;
    /* les matières sont déjà prises : on fabrique. Avec `bench`, le résultat reste sur
     * l’établi (sous-composant d’une fabrication en chaîne) au lieu d’aller au stock. */
    function makeIt(id, times, quiet, bench) {
      const it = item(id);
      const bonus = bonusFor(it, times);
      const out = it.r[2] * (times + bonus);
      const first = !(S.made[id] > 0);
      S.made[id] = (S.made[id] || 0) + times;
      S.stats.crafts += times;
      gainXp(it.r[0], xpOf(id) * times);
      if (bench && !isUnique(it) && !isScaled(it)) {
        bench[id] = (bench[id] || 0) + out;
        markSeen(id);
      } else add(id, out);
      if (!S.known[id]) learn(id, true);
      if (first) onFirstCraft(id);
      if (isUnique(it) || isScaled(it)) { recalc(); E.emit("struct"); }
      if (S.track && S.track.id === id) { S.track = null; E.emit("tracked", id); E.emit("struct"); }
      if (!quiet) E.emit("crafted", id, { n: out, bonus: bonus * it.r[2], first });
      return { ok: true, n: out, bonus: bonus * it.r[2], first };
    }

    function onFirstCraft(id) {
      const it = item(id);
      const e = it.e || {};
      if (!it.sec && !it.path && it.a > S.age) setAge(it.a);
      if (e.zone) reachZone(e.zone);
      if (e.once && e.once.intu) S.intu += e.once.intu;
      if (it.sec) {
        S.intu += 2;
        addSecret(id);
      }
      if (e.capsule) S.meta.capsule = true;
      if (e.fireworks) E.emit("fx", "fireworks");
      if (e.arche && !S.flags.arche) { S.flags.arche = true; archeSay("radio"); }
      if (e.decode) decodeSignal();
      if (D.EVENTS[id] && !S.meta.ev[id]) { S.meta.ev[id] = 1; E.emit("event", { id, txt: D.EVENTS[id] }); }
      if (id === "cerf_volant" || id === "boussole") E.emit("struct");
      E.emit("discover", id);
      checkAges();
    }

    /* Un âge accompli : toutes ses étapes faites, même celles qu’on peut sauter.
     * Un peu d’Intuition en récompense, une fois par âge et par cycle. silent : sans
     * récompense (une ancienne partie, dont les âges finis le sont depuis longtemps). */
    function checkAges(silent) {
      const got = S.flags.ages || (S.flags.ages = {});
      E.milestones().forEach((l, a) => {
        if (!l || got[a] || !l.every((x) => x.done)) return;
        got[a] = 1;
        if (silent) return;
        S.intu += D.AGE_DONE;
        E.emit("ageDone", { a, intu: D.AGE_DONE });
      });
    }
    E.checkAges = checkAges;

    function setAge(a) {
      S.age = a;
      E.emit("age", a);
      if (S.flags.arche && D.ARCHE["age" + a]) archeSay("age" + a);
    }

    function addSecret(id) {
      if (S.secrets[id]) return false;
      S.secrets[id] = true;
      E.emit("secret", id);
      return true;
    }
    E.addSecret = addSecret;

    /* Tentative libre à l’Atelier : le cœur du jeu.
     * Retourne {kind: craft|learn|blocked|owned|fail, ...} */
    E.attempt = function (g, ids) {
      ids = Array.from(new Set(ids.filter(Boolean)));
      if (!ids.length) return { kind: "empty" };
      if (!gesteOK(g)) return { kind: "nogeste" };
      S.stats.tries++;
      const id = RECIPES[keyOf(g, ids)];
      if (id) {
        const b = blocker(id);
        if (b && b.why === "owned") return { kind: "owned", id };
        if (b) {
          const fresh = learn(id);
          return { kind: "blocked", id, info: b, temp: 4, fresh };
        }
        const miss = missingFor(id, 1);
        if (miss) {
          const fresh = learn(id);
          return { kind: "learn", id, missing: miss, fresh, temp: 4 };
        }
        // une découverte se fabrique sur-le-champ ; une recette connue part dans la file des mains
        if (S.known[id]) {
          const q = E.queue(id, 1);
          return q.ok ? { kind: "queued", id, time: q.time } : { kind: "busy", id, why: q.why };
        }
        // découvrir coûte peu : ce qui coûte cher s’inscrit sans rien prendre, on choisit ensuite
        const cost = totalCost(id, 1);
        if (Object.values(cost).reduce((a, b) => a + b, 0) > D.DISCOVER_FREE) {
          learn(id);
          return { kind: "learn", id, missing: null, fresh: true, temp: 4, cost };
        }
        learn(id);
        const res = craft(id, 1, true);
        E.emit("crafted", id, res);
        return Object.assign({ kind: "craft", id, fresh: true }, res);
      }
      const t = temperature(g, ids);
      const mem = remember(g, ids);
      return { kind: "fail", temp: t.temp, why: t.why, msg: failText(g, ids), mem };
    };

    /* les matières avec leur article : « le bois », « l’os », « les fibres » */
    const GF = new Set(D.GENRE.f.split(" ")), GP = new Set(D.GENRE.p.split(" "));
    function the(id) {
      const n = item(id).n, low = n.charAt(0).toLowerCase() + n.slice(1);
      if (GP.has(id)) return "les " + low;
      if (/^[aeiouyœæ]/i.test(low.normalize("NFD")) || /^hélium/i.test(low)) return "l’" + low;
      return (GF.has(id) ? "la " : "le ") + low;
    }
    E.the = the;
    /* Une phrase d’échec : écrite à la main pour les essais les plus probables, sinon tirée
     * d’un modèle du geste (toujours la même pour la même tentative). */
    function failText(g, ids) {
      const sorted = ids.slice().sort(), key = g + ":" + sorted.join("+");
      const x = ids.length > 1 ? ids.slice(0, -1).map(the).join(", ") + " et " + the(ids[ids.length - 1]) : the(ids[0]);
      const plural = ids.length > 1 || GP.has(ids[0]);
      let t = D.FAIL_ONE[key];
      if (!t && ids.length === 1 && D.FAIL_SOLO[g]) t = D.FAIL_SOLO[g];
      if (!t) {
        const pool = D.FAIL[g] || D.FAIL.assembler;
        let h = 0;
        for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0;
        t = pool[h % pool.length];
      }
      t = t.replace(/\{([^{}|]*)\|([^{}]*)\}/g, (m, one, many) => (plural ? many : one)).replace(/\{x\}/g, x);
      // une majuscule en tête de chaque phrase (pas après « … », qui suspend la phrase)
      return t.charAt(0).toUpperCase() + t.slice(1).replace(/([.!?] )(\p{Ll})/gu, (m, p, c) => p + c.toUpperCase());
    }
    E.failText = failText;

    /* Thermomètre d’intuition : à quel point la tentative est-elle proche
     * d’une recette encore inconnue (et réalisable avec des matières déjà vues) ? */
    function temperature(g, ids) {
      let best = { temp: 0, why: "froid" };
      const set = new Set(ids);
      for (const k in RECIPES) {
        const rid = RECIPES[k];
        if (S.known[rid]) continue;
        const it = item(rid);
        if (it.path && !gesteOK("accorder")) continue;
        const rg = it.r[0];
        if (!gesteOK(rg)) continue;
        const rs = Object.keys(it.r[1]);
        if (!rs.every((i) => S.seen[i])) continue;
        const inter = rs.filter((i) => set.has(i)).length;
        if (!inter) continue;
        let t = 0, why = "";
        const same = inter === rs.length && set.size === rs.length;
        if (rg === g) {
          if (inter === set.size && rs.length - set.size === 1) { t = 3; why = "manque"; }
          else if (inter === rs.length && set.size - rs.length === 1) { t = 3; why = "trop"; }
          else { t = 2; why = "tiede"; }
        } else if (same) { t = 3; why = "geste"; }
        else { t = 1; why = "frais"; }
        if (t > best.temp) best = { temp: t, why };
        if (best.temp === 3) break;
      }
      return best;
    }
    E.temperature = temperature;

    /* Recettes connues qui utilisent toutes les matières données (raccourcis de l’Atelier). */
    E.knownWith = function (ids) {
      ids = ids.filter(Boolean);
      if (!ids.length) return [];
      return Object.keys(S.known).filter((id) => {
        const it = item(id);
        return it && it.r && ids.every((i) => it.r[1][i] !== undefined);
      });
    };
    E.usesOf = (id) => Object.keys(D.ITEMS).filter((k) => D.ITEMS[k].r && D.ITEMS[k].r[1][id] !== undefined);

    /* ------------------------------------------------------ planification récursive
     * Que faut-il fabriquer (sous-composants compris) pour obtenir `times` fois `id` ?
     * Retourne les étapes dans l’ordre (les plus profondes d’abord), les matières
     * manquantes, les recettes inconnues et les recettes bloquées. */
    E.plan = function (id, times) {
      times = Math.max(1, Math.floor(times || 1));
      const avail = Object.assign({}, S.inv);
      const crafts = {}, depth = {}, missing = {}, blocked = {}, locked = {}, used = {};
      let guard = 0;
      function need(x, qty, d, root) {
        if (++guard > 5000 || d > 40) return;
        const it = item(x);
        if (!root) {
          const have = avail[x] || 0;
          const use = Math.min(have, qty);
          if (use > 0) used[x] = (used[x] || 0) + use;
          avail[x] = have - use;
          qty -= use;
          if (qty <= 1e-9) return;
        }
        const zid = RES_ZONE[x];
        const gather = !root && it.t === "res" && zid && zoneOpen(zid); // le charbon se récolte, mais « Fabriquer » le fabrique
        if (!it.r || gather) { missing[x] = (missing[x] || 0) + qty; return; }
        if (!S.known[x]) { locked[x] = true; missing[x] = (missing[x] || 0) + qty; return; }
        const b = blocker(x);
        if (b) { blocked[x] = b; if (b.why !== "owned") missing[x] = (missing[x] || 0) + qty; return; }
        const n = root ? qty : Math.ceil(qty / it.r[2]);
        crafts[x] = (crafts[x] || 0) + n;
        depth[x] = Math.max(depth[x] || 0, d);
        const cost = isScaled(it) ? totalCost(x, n, count(x) + queued(x)) : (() => { const c = {}; for (const i in it.r[1]) c[i] = it.r[1][i] * n; return c; })();
        for (const i in cost) need(i, cost[i], d + 1, false);
        if (!root) { const surplus = n * it.r[2] - qty; if (surplus > 0) avail[x] = (avail[x] || 0) + surplus; }
      }
      need(id, isUnique(item(id)) ? 1 : times, 0, true);
      for (const k in missing) missing[k] = Math.ceil(missing[k] - 1e-9);
      // chaque fabrication après celles qui lui fournissent des pièces (un tri par profondeur
      // ne suffit pas : une pièce prise en partie au stock n’a pas sa profondeur mise à jour)
      const order = [], seenO = {};
      const visit = (x) => {
        if (seenO[x]) return;
        seenO[x] = true;
        const it = item(x);
        Object.keys(it.r[1]).filter((i) => crafts[i]).sort((a, b) => depth[b] - depth[a]).forEach(visit);
        order.push(x);
      };
      Object.keys(crafts).sort((a, b) => depth[b] - depth[a]).forEach(visit);
      const steps = order.map((x) => [x, crafts[x]]);
      return { ok: !Object.keys(missing).length && !Object.keys(blocked).length, id, times, steps, missing, blocked, locked: Object.keys(locked), used };
    };
    /* Exécute un plan complet ; ne fait rien s’il manque quoi que ce soit. */
    E.craftPlan = function (id, times) {
      const p = E.plan(id, times);
      if (!p.ok) return Object.assign({ done: false }, p);
      let made = 0;
      for (const [x, n] of p.steps) {
        const r = craft(x, n, x !== id);
        if (!r.ok) return Object.assign({ done: false, failed: x }, p);
        made += n;
      }
      return Object.assign({ done: true, made }, p);
    };
    /* Nombre maximal de fabrications possibles en chaîne avec le stock actuel. */
    E.maxPlan = function (id, cap) {
      const it = item(id);
      if (!it || !it.r || !E.plan(id, 1).ok) return 0;
      if (isUnique(it)) return 1;
      let lo = 1, hi = Math.min(cap || 100000, isScaled(it) ? 200 : 100000);
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        if (E.plan(id, mid).ok) lo = mid; else hi = mid - 1;
      }
      return lo;
    };

    /* ------------------------------------------------------ les mains et les commandes
     * Une commande (dans S.hand.q) rassemble un objet, une quantité, ses étapes s
     * (des plus profondes aux plus proches, comme les donne E.plan) et son établi b.
     * Les matières disponibles sont mises sur l’établi dès le départ, et ce qui manque
     * y est tiré au fil des récoltes. Les machines libres et les mains y travaillent
     * ensemble. */
    const H = D.HAND;
    const machPool = []; // une entrée par machine possédée : { m, job, sIdx, rec }
    let hWork = { job: null, sIdx: -1, rec: null };

    /* une pièce seule ; les gestes d’un âge passé vont plus vite */
    function handTime(id) {
      const it = item(id);
      const k = isUnique(it) ? H.unique : isScaled(it) ? H.scaled : 1;
      const old = Math.pow(H.old, Math.max(0, S.age - (it.a || 0)));
      return (H.base + H.age * (it.a || 0)) * Math.max(0.3, 1 - H.star * E.stars(id)) * k * old * memV("mains") / (it.r ? skillSpeed(it.r[0]) : 1);
    }
    E.handTime = handTime;
    /* répéter le même geste va de plus en plus vite : n pièces d’affilée prennent t × n^batch */
    const stepTime = (id, n) => handTime(id) * Math.pow(n, H.batch);
    E.batchTime = stepTime;

    function stepDone(j, idx) {
      if (j.done && j.done[idx] !== undefined) return j.done[idx];
      return idx < j.i ? j.s[idx][1] : idx === j.i ? j.k : 0;
    }
    function syncJobPos(j) {
      if (!j.done || j.done.length !== j.s.length) {
        j.done = j.s.map((s, idx) => (idx < j.i ? s[1] : idx === j.i ? j.k : 0));
      }
      if (!j.hMade || j.hMade.length !== j.s.length) j.hMade = j.done.slice();
      if (!j.sp || j.sp.length !== j.s.length) j.sp = j.s.map(() => 0);
      if (!j.mAcc || j.mAcc.length !== j.s.length) j.mAcc = j.s.map(() => 0);
      if (!j.miss || typeof j.miss !== "object") j.miss = {};
      let i = 0;
      while (i < j.s.length && j.done[i] >= j.s[i][1]) i++;
      j.i = i;
      j.k = i < j.s.length ? j.done[i] : 0;
    }

    /* pièces de `id` encore à faire dans la file */
    function queued(id) {
      let n = 0;
      S.hand.q.forEach((j) => j.s.forEach((s, i) => {
        if (s[0] === id) n += Math.max(0, s[1] - stepDone(j, i));
      }));
      return n;
    }
    E.queued = queued;

    function machUnitRate(m, c) {
      const M = item(m);
      return M ? (M.spd / 60) * (c || E.cache()).aspd * memV("mach") : 0;
    }
    function machReadyFor(m, rec) {
      if (!E.automatable(rec) || !E.machCan(m, rec)) return false;
      if (D.COMMANDES && D.COMMANDES.firstByHand && !(S.made[rec] > 0)) return false;
      if (blocker(rec)) return false;
      return true;
    }
    function anyOwnedMachReadyFor(rec) {
      return MACHINES.some((m) => Math.floor(count(m)) >= 1 && machReadyFor(m, rec));
    }
    /* durée estimée d’une étape (n unités de x) avec les machines capables disponibles */
    function estStepTime(x, n, freeOnly) {
      if (!(n > 0)) return 0;
      const c = E.cache();
      let mRate = 0;
      if (E.automatable(x) && !blocker(x)) {
        MACHINES.forEach((m) => {
          if (!E.machCan(m, x)) return;
          const cnt = freeOnly ? freeMach(m) : Math.floor(count(m));
          if (cnt > 0) mRate += cnt * machUnitRate(m, c);
        });
      }
      if (!(mRate > 0)) return stepTime(x, n);
      const firstHand = D.COMMANDES && D.COMMANDES.firstByHand && !(S.made[x] > 0);
      if (firstHand) {
        const t1 = handTime(x);
        if (n <= 1) return t1;
        const hRest = Math.max(1e-6, stepTime(x, n) - t1);
        const hRate = (n - 1) / hRest;
        return t1 + (n - 1) / (hRate + mRate);
      }
      const hTotal = Math.max(1e-6, stepTime(x, n));
      const hRate = n / hTotal;
      return n / (hRate + mRate);
    }
    /* durée approximative d’une commande de n exemplaires de id avec les machines libres */
    E.orderTime = function (id, times) {
      const p = E.plan(id, times);
      if (!p.steps.length) return handTime(id);
      return p.steps.reduce((a, [x, n]) => a + estStepTime(x, n, false), 0);
    };
    /* temps restant sur une commande en file */
    function jobTime(j, first) {
      syncJobPos(j);
      let t = 0;
      j.s.forEach((s, idx) => {
        const rem = Math.max(0, s[1] - j.done[idx] - (j.sp[idx] || 0));
        if (rem <= 0) return;
        const full = estStepTime(s[0], s[1], false);
        t += full * (rem / s[1]);
      });
      if (first && S.hand.p > 0 && !MACHINES.some((m) => Math.floor(count(m)) > 0)) {
        let raw = 0;
        j.s.forEach((s, i) => { if (i >= j.i) raw += stepTime(s[0], s[1]); });
        return Math.max(0, raw - S.hand.p);
      }
      return Math.max(0, t);
    }
    /* prend `cost` sur l’établi d’abord, puis dans le stock ; rien s’il manque quelque chose */
    function take(cost, bench) {
      for (const i in cost) if ((bench[i] || 0) + (S.inv[i] || 0) + 1e-9 < cost[i]) return false;
      for (const i in cost) {
        const b = Math.min(bench[i] || 0, cost[i]);
        if (b > 0) { bench[i] -= b; if (bench[i] < 1e-9) delete bench[i]; }
        if (cost[i] - b > 1e-9) add(i, -(cost[i] - b));
      }
      return true;
    }
    /* tire vers l’établi des commandes ce qui est arrivé en Réserve, et pose les
     * extracteurs libres de la bonne terre sur les gisements des matières manquantes */
    function pullOrderInputs() {
      let units = null; // extracteurs libres, calculés une fois et seulement s’il manque quelque chose
      S.hand.q.forEach((j) => {
        syncJobPos(j);
        for (const res in j.miss) {
          const pull = Math.min(j.miss[res], S.inv[res] || 0);
          if (pull > 1e-9) {
            add(res, -pull);
            j.b[res] = (j.b[res] || 0) + pull;
            j.miss[res] -= pull;
          }
          if (!(j.miss[res] > 1e-9)) { delete j.miss[res]; continue; }
          if (!units) {
            units = E.extUnits();
            units.free = EXTS.some((t) => units[t].own > units[t].used);
          }
          if (!units.free) continue;
          D.ZONES.forEach((z) => {
            if (!zoneOpen(z.id) || !(ZONE_DEPS[z.id] || []).some((d) => d.res === res)) return;
            E.extFor(res, z.id).sort((a, b) => extRate(b, res) - extRate(a, res)).forEach((t) => {
              const free = units[t].own - units[t].used;
              if (free < 1) return;
              units[t].used += assignExt(z.id, res, t, free);
              if (!S.flags.extDone) { S.flags.extDone = true; checkAges(); E.emit("struct"); }
            });
          });
          units.free = EXTS.some((t) => units[t].own > units[t].used);
        }
      });
    }
    function syncMachPool() {
      const want = [];
      MACHINES.slice().reverse().forEach((m) => {
        const n = Math.floor(count(m));
        for (let i = 0; i < n; i++) want.push(m);
      });
      machPool.length = want.length;
      for (let i = 0; i < want.length; i++) {
        if (!machPool[i] || machPool[i].m !== want[i]) {
          machPool[i] = { m: want[i], job: null, sIdx: -1, rec: null };
        }
      }
    }
    /* combien d’unités de l’étape (j, sIdx) peuvent être alimentées par l’établi (après
     * ce qui est déjà réservé par d’autres étapes en cours sur j) */
    function affordableUnits(j, sIdx, reserved) {
      const rec = j.s[sIdx][0], it = item(rec);
      const b = blocker(rec);
      if (b && b.why !== "owned") return 0;
      const cost = isScaled(it) ? costFor(rec, count(rec)) : it.r[1];
      let maxU = j.s[sIdx][1] - j.done[sIdx];
      if (maxU <= 0) return 0;
      if (isScaled(it) || isUnique(it)) maxU = Math.min(maxU, 1);
      for (const i in cost) {
        const avail = Math.max(0, (j.b[i] || 0) - (reserved[i] || 0)) + (S.inv[i] || 0);
        maxU = Math.min(maxU, Math.floor((avail + 1e-9) / cost[i]));
      }
      return Math.max(0, maxU);
    }
    /* répartit les machines possédées et les mains sur les étapes prêtes des commandes */
    function assignWorkers() {
      syncMachPool();
      machPool.forEach((w) => { w.job = null; w.sIdx = -1; w.rec = null; });
      hWork = { job: null, sIdx: -1, rec: null };
      if (!S.hand.q.length) return;

      const jobResv = S.hand.q.map(() => ({}));
      const stepMachs = S.hand.q.map((j) => { syncJobPos(j); return j.s.map(() => 0); });

      // 1. Les machines : par priorité de commande, puis étape la plus profonde
      const idle = {}; // une sorte de machine qui n’a rien trouvé : les suivantes de la même sorte non plus
      machPool.forEach((w) => {
        if (idle[w.m]) return;
        idle[w.m] = true;
        for (let jIdx = 0; jIdx < S.hand.q.length; jIdx++) {
          const j = S.hand.q[jIdx], resv = jobResv[jIdx];
          for (let sIdx = 0; sIdx < j.s.length; sIdx++) {
            const rec = j.s[sIdx][0];
            if (!machReadyFor(w.m, rec)) continue;
            const aff = affordableUnits(j, sIdx, resv);
            if (aff < 1) continue;
            w.job = j; w.sIdx = sIdx; w.rec = rec;
            idle[w.m] = false;
            stepMachs[jIdx][sIdx]++;
            const cost = item(rec).r[1];
            for (const i in cost) resv[i] = (resv[i] || 0) + cost[i];
            return;
          }
        }
      });

      // 2. Les mains : d’abord ce qu’aucune machine ne peut faire, sinon comme une machine de plus
      for (let pass = 0; pass < 2 && !hWork.job; pass++) {
        for (let jIdx = 0; jIdx < S.hand.q.length && !hWork.job; jIdx++) {
          const j = S.hand.q[jIdx], resv = jobResv[jIdx];
          for (let sIdx = 0; sIdx < j.s.length; sIdx++) {
            const rec = j.s[sIdx][0];
            if (j.done[sIdx] >= j.s[sIdx][1]) continue;
            if (pass === 0 && anyOwnedMachReadyFor(rec)) continue;
            // Sur une étape où des machines travaillent déjà, les mains peuvent aider sur la même unité
            const checkResv = stepMachs[jIdx][sIdx] > 0 ? {} : resv;
            const aff = affordableUnits(j, sIdx, checkResv);
            if (aff < 1) continue;
            hWork = { job: j, sIdx, rec };
            if (stepMachs[jIdx][sIdx] === 0) {
              const it = item(rec), cost = isScaled(it) ? costFor(rec, count(rec)) : it.r[1];
              for (const i in cost) resv[i] = (resv[i] || 0) + cost[i];
            }
            break;
          }
        }
      }

      // 3. Une commande sur laquelle personne ne peut avancer est en attente
      S.hand.q.forEach((j, jIdx) => {
        const anyM = stepMachs[jIdx].some((n) => n > 0);
        const anyH = hWork.job === j;
        j.w = anyM || anyH ? 0 : 1;
      });
    }

    /* Lance une commande (avec planification récursive des sous-composants).
     * Démarre même s’il manque des matières premières : elles seront tirées de la Réserve. */
    E.order = function (id, times, to) {
      times = Math.max(1, Math.floor(times || 1));
      const it = item(id);
      if (!it || !it.r || !S.known[id]) return { ok: false, why: "none" };
      const b = blocker(id);
      if (b) return { ok: false, why: b.why, info: b };
      if (S.hand.q.length >= H.max) return { ok: false, why: "full" };
      if (isUnique(it)) {
        times = 1;
        if (queued(id) > 0) return { ok: false, why: "queued" };
      }
      const p = E.plan(id, times);
      if (p.locked.length || Object.keys(p.blocked).length) return { ok: false, why: "plan", plan: p };
      if (!p.steps.length) return { ok: false, why: "none" };
      // un extracteur ou une machine coûte plus cher à chaque exemplaire : pas de commande à crédit
      if (isScaled(it) && !p.ok) return { ok: false, why: "plan", plan: p };
      const bench = {};
      for (const i in p.used) {
        bench[i] = p.used[i];
        add(i, -bench[i]);
      }
      const miss = {};
      for (const i in p.missing) if (p.missing[i] > 0) miss[i] = p.missing[i];
      const last = S.hand.q[S.hand.q.length - 1];
      if (p.steps.length === 1 && last && S.hand.q.length > 1 && last.id === id && last.s.length === 1 && !stepDone(last, 0) && !isScaled(it) && !isUnique(it) && (last.to || null) === (to || null)) {
        last.s[0][1] += times;
        for (const i in bench) last.b[i] = (last.b[i] || 0) + bench[i];
        last.miss = last.miss || {};
        for (const i in miss) last.miss[i] = (last.miss[i] || 0) + miss[i];
        pullOrderInputs();
        assignWorkers();
        E.emit("hand", { kind: "add", job: last });
        return { ok: true, job: last, time: jobTime(last, false), missing: Object.keys(last.miss).length ? Object.assign({}, last.miss) : null, merged: true };
      }
      const j = {
        id, s: p.steps, i: 0, k: 0,
        done: p.steps.map(() => 0), hMade: p.steps.map(() => 0), sp: p.steps.map(() => 0), mAcc: p.steps.map(() => 0),
        b: bench, miss
      };
      if (typeof to === "string") j.to = to;
      S.hand.q.push(j);
      pullOrderInputs();
      assignWorkers();
      E.emit("hand", { kind: "add", job: j });
      return { ok: true, job: j, time: jobTime(j, S.hand.q.length === 1), missing: Object.keys(j.miss).length ? Object.assign({}, j.miss) : null };
    };

    /* met une fabrication dans la file ; avec `chain`, ses sous-composants aussi.
     * `to` : le gisement ("x:zone:res") où poser ce qui sortira */
    E.queue = function (id, times, chain, to) {
      times = Math.max(1, Math.floor(times || 1));
      const it = item(id);
      if (!it || !it.r || !S.known[id]) return { ok: false, why: "none" };
      if (S.hand.q.length >= H.max) return { ok: false, why: "full" };
      if (isUnique(it)) {
        times = 1;
        if (queued(id) > 0) return { ok: false, why: "queued" };
      }
      let steps, bench = {};
      if (chain) {
        const p = E.plan(id, times);
        if (!p.ok) return { ok: false, why: "plan", plan: p };
        steps = p.steps;
        for (const i in p.used) bench[i] = p.used[i];
      } else {
        const b = blocker(id);
        if (b) return { ok: false, why: b.why, info: b };
        bench = totalCost(id, times, count(id) + queued(id));
        const miss = {};
        let any = false;
        for (const i in bench) if ((S.inv[i] || 0) + 1e-9 < bench[i]) { miss[i] = Math.ceil(bench[i] - (S.inv[i] || 0)); any = true; }
        if (any) return { ok: false, why: "qty", missing: miss };
        steps = [[id, times]];
      }
      for (const i in bench) add(i, -bench[i]);
      // la même pièce, déjà en attente juste avant : on l’allonge au lieu d’empiler (taper vite = ×N)
      const last = S.hand.q[S.hand.q.length - 1];
      if (steps.length === 1 && last && S.hand.q.length > 1 && last.id === id && last.s.length === 1 && !stepDone(last, 0) && !isScaled(it) && !isUnique(it) && (last.to || null) === (to || null)) {
        last.s[0][1] += times;
        for (const i in bench) last.b[i] = (last.b[i] || 0) + bench[i];
        assignWorkers();
        E.emit("hand", { kind: "add", job: last });
        return { ok: true, job: last, time: jobTime(last, false), merged: true };
      }
      const j = {
        id, s: steps, i: 0, k: 0,
        done: steps.map(() => 0), hMade: steps.map(() => 0), sp: steps.map(() => 0), mAcc: steps.map(() => 0),
        b: bench, miss: {}
      };
      if (typeof to === "string") j.to = to;
      S.hand.q.push(j);
      assignWorkers();
      E.emit("hand", { kind: "add", job: j });
      return { ok: true, job: j, time: jobTime(j, S.hand.q.length === 1) };
    };
    E.cancelJob = function (idx) {
      const j = S.hand.q[idx];
      if (!j) return false;
      for (const i in j.b) add(i, j.b[i]);
      S.hand.q.splice(idx, 1);
      if (idx === 0) S.hand.p = 0;
      assignWorkers();
      E.emit("hand", { kind: "cancel", job: j });
      return true;
    };
    /* la file des commandes, pour l’affichage : étape en cours, temps restant, ce qui manque et qui y travaille */
    E.handInfo = function () {
      assignWorkers();
      let t = 0;
      const jobs = S.hand.q.map((j, n) => {
        syncJobPos(j);
        const s = j.s[Math.min(j.i, j.s.length - 1)], left = jobTime(j, n === 0);
        t += left;
        const tot = Math.max(1e-6, j.s.reduce((a, x) => a + estStepTime(x[0], x[1], false), 0));
        const totalCrafts = j.s.reduce((a, x) => a + x[1], 0);
        const doneCrafts = j.s.reduce((a, x, idx) => a + j.done[idx] + (j.sp[idx] || 0), 0);
        const machs = {};
        machPool.forEach((w) => {
          if (w.job !== j) return;
          const cur = machs[w.m] || (machs[w.m] = { n: 0, rec: w.rec });
          cur.n++;
        });
        const stepList = j.s.map(([sid, sn], idx) => {
          const hands = hWork.job === j && hWork.sIdx === idx;
          let mCnt = 0;
          const machByType = {};
          machPool.forEach((w) => {
            if (w.job === j && w.sIdx === idx) {
              mCnt++;
              machByType[w.m] = (machByType[w.m] || 0) + 1;
            }
          });
          return { id: sid, n: sn, done: j.done[idx], hands, machs: mCnt, machByType };
        });
        const activeStep = (hWork.job === j && hWork.rec) || (Object.values(machs)[0] && Object.values(machs)[0].rec) || s[0];
        const miss = j.miss && Object.keys(j.miss).length ? Object.assign({}, j.miss) : null;
        return {
          id: j.id, n: j.s[j.s.length - 1][1],
          done: j.done[j.s.length - 1], finalDone: j.done[j.s.length - 1],
          total: totalCrafts, doneCrafts,
          step: activeStep, k: j.k, of: s[1], i: j.i, steps: stepList,
          frac: totalCrafts ? Math.min(1, doneCrafts / totalCrafts) : 0,
          left, at: t, wait: !!j.w, tot, miss,
          hand: hWork.job === j ? hWork.rec : null,
          machs
        };
      });
      return { jobs, left: t, full: S.hand.q.length >= H.max };
    };
    function finishJob(j, offline) {
      for (const i in j.b) add(i, j.b[i]);
      const idx = S.hand.q.indexOf(j);
      if (idx >= 0) S.hand.q.splice(idx, 1);
      if (idx === 0) S.hand.p = 0;
      if (!offline) E.emit("hand", { kind: "done", job: j });
    }
    function workStep(dt, offline) {
      let left = dt, guard = 0;
      const c = E.cache();
      while (left > 1e-9 && S.hand.q.length && guard++ < 20000) {
        pullOrderInputs();
        // Nettoyer les commandes déjà terminées
        let cleaned = false;
        for (let i = 0; i < S.hand.q.length; i++) {
          const j = S.hand.q[i];
          syncJobPos(j);
          if (j.i >= j.s.length) { finishJob(j, offline); cleaned = true; break; }
        }
        if (cleaned) continue;

        assignWorkers();

        // Quelles étapes (j, sIdx) ont au moins un travailleur actif ?
        const active = [];
        S.hand.q.forEach((j) => {
          j.s.forEach((s, sIdx) => {
            const rec = s[0];
            const hOn = hWork.job === j && hWork.sIdx === sIdx;
            let mRate = 0, mCnt = 0;
            machPool.forEach((w) => {
              if (w.job === j && w.sIdx === sIdx) { mRate += machUnitRate(w.m, c); mCnt++; }
            });
            if (!hOn && !mCnt) return;
            let hRate = 0, hDur = 0;
            if (hOn) {
              const q = (j.hMade[sIdx] || 0) + 1;
              hDur = Math.max(1e-6, handTime(rec) * (Math.pow(q, H.batch) - Math.pow(q - 1, H.batch)));
              hRate = 1 / hDur;
            }
            const rate = hRate + mRate;
            if (rate > 1e-9) {
              const needTime = Math.max(0, (1 - (j.sp[sIdx] || 0)) / rate);
              active.push({ j, sIdx, rec, hOn, hRate, hDur, mRate, mCnt, rate, needTime });
            }
          });
        });

        if (!active.length) break;

        // on avance jusqu’à la prochaine pièce finie, mais jamais par pas plus petits que
        // `quant` : les machines rapides finissent alors plusieurs pièces d’un coup
        const quant = offline ? 1 : 0.1;
        let stepDt = Infinity;
        active.forEach((a) => { if (a.needTime < stepDt) stepDt = a.needTime; });
        stepDt = Math.max(0, Math.min(left, Math.max(stepDt, quant)));
        left -= stepDt;

        for (const a of active) {
          const { j, sIdx, rec, hOn, mRate, mCnt, rate } = a;
          j.sp[sIdx] = (j.sp[sIdx] || 0) + rate * stepDt;
          if (mCnt > 0) {
            j.mAcc[sIdx] = (j.mAcc[sIdx] || 0) + mRate * stepDt;
            j.byMach = j.byMach || {};
            j.byMach[rec] = true;
            if (!S.flags.lineDone) { S.flags.lineDone = true; checkAges(); E.emit("struct"); }
          }
          if (hOn && S.hand.q[0] === j && sIdx === j.i) {
            const t = handTime(rec);
            S.hand.p = t * Math.pow(j.hMade[sIdx] + Math.min(1, j.sp[sIdx]), H.batch);
          }
          if (j.sp[sIdx] + 1e-9 >= 1) {
            const it = item(rec);
            const one = isScaled(it) || isUnique(it);
            let k = Math.min(Math.floor(j.sp[sIdx] + 1e-9), j.s[sIdx][1] - j.done[sIdx], one ? 1 : Infinity);
            const unit = isScaled(it) ? costFor(rec, count(rec)) : it.r[1];
            for (const i in unit) k = Math.min(k, Math.floor(((j.b[i] || 0) + (S.inv[i] || 0) + 1e-9) / unit[i]));
            j.sp[sIdx] = Math.min(1, Math.max(0, j.sp[sIdx] - Math.max(k, 1)));
            if (!(k >= 1) || !take(isScaled(it) ? unit : totalCost(rec, k), j.b)) { j.w = 1; continue; }
            const last = sIdx === j.s.length - 1;
            // les pièces payées par l’avance des machines sont à elles, le reste aux mains
            const km = mCnt > 0 ? (hOn ? Math.min(k, Math.floor(j.mAcc[sIdx] + 1e-9)) : k) : 0, kh = k - km;
            if (km > 0) {
              j.mAcc[sIdx] = Math.max(0, j.mAcc[sIdx] - km);
              const out = produce(rec, km);
              if (!last && !one) { j.b[rec] = (j.b[rec] || 0) + out; markSeen(rec); }
              else add(rec, out);
              if (!offline) E.emit("handdone", { id: rec, n: out, bonus: out - it.r[2] * km, first: false, last, mach: true });
            }
            if (kh > 0) {
              j.hMade[sIdx] = (j.hMade[sIdx] || 0) + kh;
              const r = makeIt(rec, kh, offline || !last, last ? null : j.b);
              if (!offline) E.emit("handdone", { id: rec, n: r.n, bonus: r.bonus, first: r.first, last });
            }
            if (last && j.to) deliver(j.to, rec, k);
            j.done[sIdx] += k;
            syncJobPos(j);
            if (S.hand.q[0] === j && j.done[sIdx] >= j.s[sIdx][1]) S.hand.p = 0;
            if (j.i >= j.s.length) finishJob(j, offline);
          }
        }
      }
      pullOrderInputs();
      assignWorkers();
    }

    /* ------------------------------------------------------ l’action qui tourne
     * Récolter une matière en continu (▶). Continue jeu fermé. */
    E.startAct = function (a) {
      if (!a || a.k !== "harv") return null;
      if (!zoneOpen(a.z) || !ZONES[a.z].res.includes(a.res)) return null;
      S.act = { k: "harv", z: a.z, res: a.res, p: 0, got: 0 };
      E.emit("act", S.act);
      runAct(0, false);
      return S.act;
    };
    E.stopAct = function (why) {
      if (!S.act) return;
      const a = S.act;
      S.act = null;
      E.emit("actstop", { act: a, why: why || "stop" });
    };
    E.actInfo = function () {
      const a = S.act;
      if (!a || a.k !== "harv") return null;
      return { k: "harv", z: a.z, res: a.res, frac: a.p, dur: SK.harvest / skillSpeed("recolte"), got: a.got };
    };
    function runAct(dt, offline) {
      const a = S.act;
      if (!a) return;
      if (a.k === "harv") {
        if (!zoneOpen(a.z)) { E.stopAct("zone"); return; }
        a.p += dt * skillSpeed("recolte") / SK.harvest;
        while (a.p >= 1) { a.p -= 1; a.got += E.tap(a.res, a.z); }
        return;
      }
      E.stopAct("stop");
      void offline;
    }

    /* ------------------------------------------------------ étude des matières
     * Contre un peu d’Intuition, on étudie une matière : on sait alors, pour chaque
     * geste connu, combien de recettes encore inconnues s’en servent (parmi celles
     * qu’on peut tenter avec des matières déjà vues). À l’Atelier, les matières
     * étudiées qui réagissent avec le geste choisi sont marquées. */
    E.studyCost = (id) => 1 + Math.floor((item(id).a || 0) / 4);
    E.study = function (id) {
      if (!item(id) || S.studied[id] || !S.seen[id]) return false;
      const c = E.studyCost(id);
      if (S.intu < c) return false;
      S.intu -= c;
      S.studied[id] = 1;
      E.emit("struct");
      return true;
    };
    E.reactions = function (id) {
      const out = {};
      for (const k in RECIPES) {
        const rid = RECIPES[k], it = item(rid);
        if (S.known[rid] || it.r[1][id] === undefined) continue;
        if (it.path && !gesteOK("accorder")) continue;
        if (!gesteOK(it.r[0]) || !Object.keys(it.r[1]).every((i) => S.seen[i])) continue;
        out[it.r[0]] = (out[it.r[0]] || 0) + 1;
      }
      return out;
    };

    /* ------------------------------------------------------ carnet */
    E.carnet = function () {
      const out = [];
      for (let a = 0; a <= Math.min(S.age + 1, D.AGES.length - 1); a++) {
        const list = [];
        for (const id in D.ITEMS) {
          const it = D.ITEMS[id];
          if (!it.r || it.a !== a || it.path) continue;
          if (it.sec && !S.known[id]) continue;
          list.push(id);
        }
        out.push({ age: a, ids: list });
      }
      return out;
    };
    E.pathRecipes = () => Object.keys(D.ITEMS).filter((id) => D.ITEMS[id].path);
    E.togglePin = function (id) {
      if (S.pins[id]) delete S.pins[id]; else S.pins[id] = true;
      E.emit("struct");
      return !!S.pins[id];
    };
    E.setTrack = function (id) {
      S.track = id && (!S.track || S.track.id !== id) ? { id } : null;
      E.emit("struct");
      return S.track;
    };

    /* ------------------------------------------------------ objectifs et guidage */
    function normObj(o, i) {
      if (Array.isArray(o)) return { i, k: "craft", id: o[0], txt: o[1] };
      return Object.assign({ i }, o);
    }
    function objDone(o) {
      if (Array.isArray(o)) return (S.made[o[0]] || 0) > 0;
      if (o.k === "exp") return (S.exp.done[o.z] || 0) > ZONES[o.z].exps.findIndex((x) => x.id === o.x);
      if (o.k === "line") return !!S.flags.lineDone;
      if (o.k === "ext") return !!S.flags.extDone;
      if (o.k === "pass") return !!(S.pass && S.pass[o.z] && S.pass[o.z].done) || (!PASS[o.z] && zoneOpen(o.z));
      return true;
    }
    /* Le premier objectif non atteint après le plus avancé déjà atteint :
     * un joueur avancé ne revient jamais sur une étape d’apprentissage qu’il a sautée. */
    E.objective = function () {
      let last = -1;
      D.OBJECTIVES.forEach((o, i) => { if (objDone(o)) last = i; });
      for (let i = last + 1; i < D.OBJECTIVES.length; i++) if (!objDone(D.OBJECTIVES[i])) return normObj(D.OBJECTIVES[i], i);
      return null;
    };
    /* Les jalons : les objectifs rangés par âge (une action prend l’âge de l’objet qui la précède). */
    E.milestones = function () {
      const out = [];
      let a = 0;
      D.OBJECTIVES.forEach((o, i) => {
        const n = normObj(o, i);
        if (n.k === "craft") a = item(n.id).a;
        (out[a] = out[a] || []).push({ i, ob: n, done: objDone(o) });
      });
      return out;
    };
    /* Prochaine étape concrète vers un objet : une sous-recette inconnue, une station
     * qui manque, ou la clé d’une zone fermée. */
    function nextStep(target) {
      const seen = {};
      function walk(id, d) {
        if (d > 14 || seen[id]) return null;
        seen[id] = true;
        const it = item(id);
        if (!it) return null;
        const zid = RES_ZONE[id];
        if (zid && zoneOpen(zid)) return null; // se récolte
        if (!it.r) {
          // matière première d’une zone fermée : il faut la clé de la zone
          const req = zid && ZONES[zid].req;
          if (req && req[0] !== "@") return walk(req, d + 1) || (S.pass[zid] && !S.pass[zid].done ? { id: req, why: "pass", z: zid } : { id: req, why: "zone", z: zid });
          return null;
        }
        // sinon (y compris le charbon avant les Profondeurs) : on la fabrique
        if (isUnique(it) && (S.made[id] || 0) > 0) return null;
        const g = it.r[0], o = it.r[3] || {};
        if (g !== "accorder" && (!gesteOK(g) || (o.heat && E.heat() < o.heat) || (o.lvl && E.level(g) < o.lvl))) {
          const st = stationFor(g, o.heat, o.lvl);
          if (st && st !== id) return walk(st, d + 1) || { id: st, why: "station" };
        }
        for (const i of Object.keys(it.r[1])) {
          const w = walk(i, d + 1);
          if (w) return w;
        }
        if (!S.known[id]) return { id, why: "unknown" };
        return null;
      }
      return walk(target, 0) || { id: target, why: S.known[target] ? "known" : "unknown" };
    }
    E.nextStep = nextStep;
    E.guide = function () {
      const ob = E.objective();
      if (!ob) return null;
      if (ob.k !== "craft") return { ob, step: null };
      const s = nextStep(ob.id);
      return { ob, step: s.id, why: s.why };
    };
    /* Réminiscences : des indices gratuits et progressifs, gagnés en cherchant.
     * Chaque combinaison nouvelle essayée à l’Atelier (et qui ne donne rien) fait
     * remonter des souvenirs sur l’étape en cours ; d’autant plus qu’elle s’en
     * approche (même geste, ingrédients en commun). Attendre ne donne rien, refaire
     * le même essai non plus. */
    function remember(g, ids) {
      const k = keyOf(g, ids);
      if (S.tried[k]) return 0;
      S.tried[k] = 1;
      const gd = E.guide();
      if (!gd || !gd.step || S.known[gd.step]) return 0;
      const it = item(gd.step);
      let pts = 1;
      if (it.r[0] === g) pts++;
      ids.forEach((i) => { if (it.r[1][i] !== undefined) pts++; });
      if (S.gt.id !== gd.step) S.gt = { id: gd.step, p: 0 };
      S.gt.p += pts;
      const lvl = S.hints[gd.step] || 0;
      let target = 0;
      D.GUIDE.tries.forEach((n, i) => { if (S.gt.p >= n) target = i + 1; });
      if (target > lvl) {
        S.hints[gd.step] = target;
        if (target >= 3) learn(gd.step, true);
        E.emit("guidehint", { id: gd.step, lvl: target });
        E.emit("struct");
      }
      return pts;
    }
    /* où en sont les souvenirs de l’étape en cours : { p, next } (points, seuil suivant) */
    E.memory = function () {
      const gd = E.guide();
      if (!gd || !gd.step || S.known[gd.step]) return null;
      const lvl = S.hints[gd.step] || 0, p = S.gt.id === gd.step ? S.gt.p || 0 : 0;
      const next = D.GUIDE.tries[lvl];
      return next === undefined ? null : { id: gd.step, p, prev: lvl ? D.GUIDE.tries[lvl - 1] : 0, next, lvl };
    };

    /* ------------------------------------------------------ explorations */
    E.nextExp = function (zid) {
      const z = ZONES[zid];
      const i = S.exp.done[zid] || 0;
      if (!z.exps || i >= z.exps.length) return null;
      const x = z.exps[i];
      const locked = x.need && !(S.made[x.need] > 0);
      return { x, i, locked };
    };
    E.expMult = () => E.cache().exp;
    E.startExp = function (zid) {
      if (S.exp.active) return { ok: false, why: "busy" };
      const n = E.nextExp(zid);
      if (!n || n.locked) return { ok: false, why: "none" };
      const x = n.x;
      if (x.cost) {
        for (const i in x.cost) if (count(i) < x.cost[i]) return { ok: false, why: "cost", missing: i };
        for (const i in x.cost) add(i, -x.cost[i]);
      }
      S.exp.active = { z: zid, i: n.i, t0: now(), dur: (x.dur * 1000) / E.expMult() };
      E.emit("struct");
      return { ok: true };
    };
    E.expProgress = function () {
      const a = S.exp.active;
      if (!a) return null;
      return { z: a.z, i: a.i, p: Math.min(1, (now() - a.t0) / a.dur), left: Math.max(0, (a.t0 + a.dur - now()) / 1000) };
    };
    function finishExp(silent) {
      const a = S.exp.active;
      const x = ZONES[a.z].exps[a.i];
      S.exp.active = null;
      S.exp.done[a.z] = (S.exp.done[a.z] || 0) + 1;
      const rw = x.rw || {};
      if (rw.inv) for (const i in rw.inv) add(i, rw.inv[i]);
      if (rw.item) for (const i in rw.item) add(i, rw.item[i]);
      if (rw.intu) S.intu += rw.intu;
      if (rw.flag) S.flags[rw.flag] = true;
      if (rw.flag === "caveau") unlockZone("caveau");
      if (rw.secret) addSecret(rw.secret);
      let fragNew = false;
      if (rw.frag) fragNew = addFrag(rw.frag, true);
      E.emit("expdone", { z: a.z, x, frag: rw.frag, fragNew, silent });
      checkAges();
      E.emit("struct");
    }

    function addFrag(fid, quiet) {
      if (S.frags[fid]) return false;
      S.frags[fid] = true;
      S.intu += 1;
      if (S.flags.arche && D.ARCHE[fid]) archeSay(fid);
      if (!quiet) E.emit("frag", fid);
      return true;
    }
    E.addFrag = addFrag;

    /* ------------------------------------------------------ ARCHE */
    function archeSay(key) {
      const lines = D.ARCHE[key];
      if (!lines) return;
      lines.forEach((t) => S.arche.push({ t: now(), txt: t }));
      if (S.arche.length > 200) S.arche.splice(0, S.arche.length - 200);
      E.emit("arche", key);
    }
    E.archeSay = archeSay;

    /* ------------------------------------------------------ ciel */
    E.tapMoon = function () {
      S.moon = (S.moon || 0) + 1;
      if (S.moon >= 7 && addSecret("lune7")) {
        S.intu += 3;
        return "Tu fixes la Lune longtemps. Près de la mer de la Tranquillité, un point lumineux clignote : trois longs, trois courts. Quelqu’un a laissé une lumière allumée. (+3 ✨)";
      }
      return null;
    };
    E.listen = function () {
      if (!E.cache().signal) return { ok: false };
      let fresh = false;
      if (!S.flags.signal) {
        S.flags.signal = true;
        add("signal_brut", 1);
        fresh = true;
        if (S.flags.arche) archeSay("signal");
        E.emit("struct");
      }
      return { ok: true, fresh, decoded: !!S.flags.decoded };
    };
    function decodeSignal() {
      S.flags.decoded = true;
      addFrag("signal", true);
      if (S.flags.arche) archeSay("decode");
      E.emit("decoded");
    }

    /* ------------------------------------------------------ flûte */
    E.playNote = function (n) {
      S.notes.push(n);
      if (S.notes.length > 16) S.notes.shift();
      for (const mid in D.MELODIES) {
        const m = D.MELODIES[mid].notes;
        if (S.notes.length < m.length) continue;
        const tail = S.notes.slice(-m.length);
        if (tail.every((v, i) => v === m[i])) { S.notes = []; return melody(mid); }
      }
      return null;
    };
    function melody(mid) {
      const fresh = addSecret(mid);
      if (mid === "appel" && !S.flags.lucioles) { S.flags.lucioles = true; recalc(); }
      if (mid === "berceuse") S.flags.berceuse = true;
      if (mid === "frere" && fresh) S.intu += 2;
      if (fresh && mid !== "frere") S.intu += 2;
      let ending = null;
      if (mid === "berceuse") {
        const ps = projState("chant");
        const st = D.PROJECTS.chant.steps[ps.step];
        if (projVisible("chant") && st && st.melody === "berceuse") {
          ps.step++;
          ending = endGame("retour");
        }
      }
      E.emit("melody", mid, fresh);
      E.emit("struct");
      return { id: mid, fresh, ending };
    }

    /* ------------------------------------------------------ terminal */
    E.terminal = function (raw) {
      const cmd = String(raw || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();
      let out;
      if (!cmd) return [];
      if (cmd === "aide" || cmd === "help" || cmd === "?") out = D.TERMINAL.aide;
      else if (cmd === "effacer" || cmd === "clear" || cmd === "cls") { S.term = []; return []; }
      else if (cmd === "promethee" || cmd === "prometheus") {
        const fresh = addSecret("cpromethee");
        if (fresh) S.intu += 2;
        addFrag("promethee");
        out = "CODE ACCEPTÉ. OUVERTURE DE protocole_promethee.txt…\n" + D.FRAGS.promethee.t;
      } else if (cmd === "1969") {
        if (addSecret("c1969")) S.intu += 3;
        out = "« NOUS SOMMES VENUS EN PAIX, AU NOM DE TOUTE L’HUMANITÉ. »\nCETTE PHRASE NE FIGURE DANS AUCUNE DE MES DIRECTIVES. ELLE DEVRAIT.";
      } else if (cmd === "xyzzy" || cmd === "plugh") {
        if (addSecret("cxyzzy")) S.intu += 3;
        out = "Rien ne se passe.\n…\nEnfin, presque. (+3 ✨)";
      } else if (cmd === "iris" || cmd === "vahl" || cmd === "iris vahl") {
        out = S.frags.berceuse || S.frags.iris_lune
          ? "DR IRIS VAHL. CONCEPTRICE D’ARCHE ET DU PROTOCOLE PROMÉTHÉE.\nSTATUT : DÉCÉDÉE (AN 41 APRÈS L’EXODE).\nDERNIER ORDRE ENREGISTRÉ : « Prends soin d’eux. »"
          : "DOSSIER VAHL : ACCÈS RESTREINT.";
      } else if (cmd === "signal") {
        out = S.flags.decoded ? "SIGNAL DÉCODÉ PAR UN DISPOSITIF NON AUTORISÉ.\nCONTENU : « NOUS RENTRONS À LA MAISON. »\n…JE NE SAIS PLUS QUOI EN PENSER."
          : S.flags.signal ? "ENREGISTREMENT ACQUIS. CONTENU : MOTIF MÉLODIQUE RÉPÉTITIF. INTENTION : INCONNUE." : "AUCUN ENREGISTREMENT. UTILISE UN RADIOTÉLESCOPE.";
      } else if (cmd === "lena" || cmd === "lena vahl") {
        out = "LENA VAHL. PASSAGÈRE, ARCHE 12. STATUT : INCONNU. DISTANCE : 11,9 ANNÉES-LUMIÈRE… OU MOINS.";
      } else if (D.TERMINAL[cmd]) out = D.TERMINAL[cmd];
      else out = "COMMANDE INCONNUE. TAPE « AIDE ».";
      const lines = ["> " + raw].concat(out.split("\n"));
      S.term.push(...lines);
      if (S.term.length > 120) S.term.splice(0, S.term.length - 120);
      E.emit("struct");
      return lines;
    };

    /* ------------------------------------------------------ le Domaine
     * Chaque terre ouverte a ses gisements. On y pose des extracteurs, qui versent
     * leur récolte dans la Réserve. Les machines sont rangées en chaînes (une
     * recette, un type de machine, un nombre) : elles se servent dans la Réserve et
     * y déposent ce qu’elles font. Un Grand Œuvre « alimenté » se sert seul dans la
     * Réserve, à un débit qui dépend de l’âge. Rien ne dépend d’une position.
     * Le calcul se fait par pas de temps : il donne le même résultat jeu ouvert ou
     * fermé. */
    const machStat = {}; // état des gisements et des chantiers (non sauvegardé)
    let order = null;
    function domChanged() { order = null; E.emit("dom"); }
    function forgetDom() {
      for (const k in machStat) delete machStat[k];
      order = null;
      machPool.length = 0;
      hWork.job = null; hWork.sIdx = -1; hWork.rec = null;
      E.emit("dom");
    }
    E.machInfo = (k) => machStat[k] || { s: "wait", avg: 0 };

    E.automatable = (id) => {
      const it = item(id);
      return !!(it && it.r && S.known[id] && !isUnique(it) && !isScaled(it));
    };

    /* --- gisements et extracteurs */
    E.EXTS = EXTS;
    E.extRate = extRate;
    E.extKey = extKey;
    E.zoneDeps = (z) => ZONE_DEPS[z] || [];
    E.deposits = () => {
      const out = [];
      D.ZONES.forEach((z) => { if (zoneOpen(z.id)) ZONE_DEPS[z.id].forEach((d) => out.push({ z: z.id, res: d.res, hand: d.hand, key: extKey(z.id, d.res) })); });
      return out;
    };
    E.extOk = extOk;
    E.extFor = (r, z) => EXTS.filter((t) => (z ? extOk(t, z, r) : extRate(t, r) > 0));
    E.extUnits = function () {
      const out = {};
      EXTS.forEach((t) => (out[t] = { own: Math.floor(count(t)), used: 0 }));
      for (const k in S.dom.ext) { const u = S.dom.ext[k].u; for (const t in u) if (out[t]) out[t].used += u[t]; }
      return out;
    };
    const freeExt = (t) => { const u = E.extUnits()[t]; return u ? Math.max(0, u.own - u.used) : 0; };
    E.freeExt = freeExt;
    /* production d’une exploitation, par seconde */
    function extOut(e, c) {
      let r = 0;
      for (const t in e.u) {
        const it = item(t);
        if (it) r += e.u[t] * extRate(t, e.res) * (c.auto[it.z] || 1) * (c.auto["*"] || 1) * c.echo * memV("extr");
      }
      return r;
    }
    E.extOut = (e) => extOut(e, E.cache());
    E.domExt = (z, res) => S.dom.ext[extKey(z, res)] || null;
    /* le type d’extracteur que pose le bouton « + cabane » : le plus productif parmi
     * ceux qui attendent d’être posés, sinon le plus productif qu’on peut fabriquer
     * tout de suite, sinon le plus simple qu’on connaisse (un Carnet hérité d’une
     * relève connaît des extracteurs bien trop chers pour le début) */
    E.extChoice = function (res, z) {
      const types = E.extFor(res, z).sort((a, b) => extRate(b, res) - extRate(a, res));
      const free = types.find((t) => freeExt(t) >= 1);
      if (free) return { t: free, free: freeExt(free) };
      const known = types.filter((t) => S.known[t]);
      if (!known.length) return null;
      const can = known.find((t) => E.plan(t, 1).ok);
      return { t: can || known[known.length - 1], free: 0 };
    };
    /* pose jusqu’à n extracteurs libres du type t sur un gisement ; renvoie combien */
    function assignExt(z, res, t, n) {
      if (!zoneOpen(z) || !(ZONE_DEPS[z] || []).some((d) => d.res === res) || !extOk(t, z, res)) return 0;
      const k = Math.min(Math.floor(n), freeExt(t));
      if (!(k >= 1)) return 0;
      const key = extKey(z, res), e = S.dom.ext[key] || (S.dom.ext[key] = { z, res, u: {}, on: true });
      e.u[t] = (e.u[t] || 0) + k;
      domChanged();
      return k;
    }
    /* « +1 », « ×10 » : pose ce qui est libre, et fait fabriquer le reste par les
     * mains, qui le poseront ici une fois fini */
    E.domExtAdd = function (z, res, n, t) {
      n = Math.max(1, Math.floor(n || 1));
      const ch = t ? { t } : E.extChoice(res, z);
      if (!ch || !extOk(ch.t, z, res)) return { ok: false, why: "noext" };
      t = ch.t;
      const placed = assignExt(z, res, t, n);
      if (placed >= n) return { ok: true, placed, queued: 0, t };
      const q = E.queue(t, n - placed, true, "x:" + extKey(z, res));
      if (!q.ok) return { ok: placed > 0, placed, queued: 0, t, why: q.why, missing: q.missing || (q.plan && q.plan.missing) };
      return { ok: true, placed, queued: n - placed, t };
    };
    /* nombre exact d’extracteurs d’un type sur un gisement (0 les retire) */
    E.domExtSet = function (z, res, t, n) {
      if (!zoneOpen(z) || !extOk(t, z, res) || !(ZONE_DEPS[z] || []).some((d) => d.res === res)) return null;
      const key = extKey(z, res);
      let e = S.dom.ext[key];
      const cur = (e && e.u[t]) || 0, v = Math.max(0, Math.min(Math.floor(n) || 0, cur + freeExt(t)));
      if (!e) {
        if (!v) return null;
        e = S.dom.ext[key] = { z, res, u: {}, on: true };
      }
      if (v) e.u[t] = v; else delete e.u[t];
      if (!Object.keys(e.u).length) { delete S.dom.ext[key]; delete machStat[key]; }
      domChanged();
      return S.dom.ext[key] || null;
    };
    E.domExtToggle = function (z, res, on) {
      const e = S.dom.ext[extKey(z, res)];
      if (!e) return null;
      e.on = on === undefined ? !e.on : !!on;
      domChanged();
      return e;
    };
    /* Pose un extracteur libre sur le gisement de sa terre où il manque le plus.
     * Sert au bot de simulation et aux parties d’avant la v4, dont les extracteurs
     * ne travaillaient sur aucun gisement. */
    E.domAutoExt = function (t) {
      const it = item(t);
      if (!it || it.t !== "ext" || freeExt(t) < 1 || !zoneOpen(it.z)) return null;
      const spots = ZONE_DEPS[it.z].filter((d) => extRate(t, d.res) > 0).map((d) => ({ r: d.res }));
      if (!spots.length) return null;
      // viser ce que donneraient tous les extracteurs s’ils travaillaient partout,
      // en couvrant d’abord les matières qui ne sont pas encore extraites
      const target = {}, cur = {};
      EXTS.forEach((u) => { const n = Math.floor(count(u)); for (const r in item(u).p) target[r] = (target[r] || 0) + n * item(u).p[r]; });
      for (const k in S.dom.ext) { const e = S.dom.ext[k]; for (const u in e.u) cur[e.res] = (cur[e.res] || 0) + e.u[u] * extRate(u, e.res); }
      spots.forEach((sp) => {
        const d = (target[sp.r] || 0) - (cur[sp.r] || 0);
        sp.score = (cur[sp.r] ? 0 : 1000) + Math.abs(d) - Math.abs(d - extRate(t, sp.r));
      });
      spots.sort((a, b) => b.score - a.score);
      return assignExt(it.z, spots[0].r, t, 1) ? { z: it.z, res: spots[0].r } : null;
    };
    function placeOldExtractors() {
      let placed = 0;
      const power = (t) => Object.values(item(t).p).reduce((a, b) => a + b, 0);
      EXTS.slice().sort((a, b) => power(b) - power(a)).forEach((t) => { const n = freeExt(t); for (let i = 0; i < n; i++) if (E.domAutoExt(t)) placed++; });
      S.flags.fab4 = { placed };
    }

    /* --- machines */
    E.machines = function () {
      assignWorkers();
      const out = {};
      MACHINES.forEach((m) => (out[m] = { own: Math.floor(count(m)), used: 0, spd: item(m).spd, byRec: {} }));
      machPool.forEach((w) => {
        if (w.job !== null && out[w.m]) {
          out[w.m].used++;
          if (w.rec) out[w.m].byRec[w.rec] = (out[w.m].byRec[w.rec] || 0) + 1;
        }
      });
      return out;
    };
    const freeMach = (m) => { const x = E.machines()[m]; return x ? Math.max(0, x.own - x.used) : 0; };
    E.freeMach = freeMach;
    E.hasFactory = () => EXTS.some((t) => count(t) > 0 || S.known[t]) || MACHINES.some((m) => count(m) > 0) ||
      Object.keys(S.dom.ext).length > 0 || S.hand.q.length > 0;
    E.machRate = (m) => (item(m) && item(m).t === "mach" ? machUnitRate(m) : 0);
    E.machCan = function (m, r) {
      const it = item(r), M = item(m);
      if (!it || !it.r || !M) return false;
      return Object.keys(it.r[1] || {}).length <= (M.ing !== undefined ? M.ing : 1);
    };
    E.machFor = function (r) {
      return MACHINES.find((m) => E.machCan(m, r)) || null;
    };
    /* ce que les mains ont fini pour un gisement y est posé */
    function deliver(to, id, n) {
      const it = item(id);
      if (!it || typeof to !== "string") return;
      if (to.slice(0, 2) === "x:" && it.t === "ext") {
        const i = to.indexOf(":", 2);
        assignExt(to.slice(2, i), to.slice(i + 1), id, n);
      }
    }
    /* pièces encore attendues pour un gisement ("x:zone:res") */
    E.domQueued = (to) => {
      let n = 0;
      S.hand.q.forEach((j) => {
        if (j.to !== to) return;
        const s = j.s[j.s.length - 1];
        const done = j.done ? j.done[j.s.length - 1] : (j.i === j.s.length - 1 ? j.k : 0);
        n += Math.max(0, s[1] - done);
      });
      return n;
    };

    /* --- chantiers des Grands Œuvres */
    E.domSite = function (pid, on) {
      if (!D.PROJECTS[pid]) return null;
      if (on) S.dom.site[pid] = { on: true };
      else { delete S.dom.site[pid]; delete machStat["S:" + pid]; }
      domChanged();
      return S.dom.site[pid] || null;
    };
    E.siteOn = (pid) => !!(S.dom.site[pid] && S.dom.site[pid].on);
    E.siteRate = () => D.SITE_RATE[Math.min(S.age, D.SITE_RATE.length - 1)] * E.cache().aspd;

    /* --- le calcul */
    function produce(id, k) {
      const it = item(id);
      const bonus = bonusFor(it, k);
      const first = !(S.made[id] > 0);
      S.made[id] = (S.made[id] || 0) + k;
      S.stats.crafts += k;
      if (!S.known[id]) learn(id, true);
      if (first) onFirstCraft(id);
      if (S.track && S.track.id === id) { S.track = null; E.emit("tracked", id); E.emit("struct"); }
      if (!S.flags.lineDone) { S.flags.lineDone = true; checkAges(); E.emit("struct"); }
      return it.r[2] * (k + bonus);
    }
    function runExt(key, e, dt, c) {
      const st = machStat[key] || (machStat[key] = { s: "wait", avg: 0 });
      let made = 0;
      const done = (s) => { st.s = s; st.avg += (1 - Math.exp(-dt / 5)) * (made / dt - st.avg); };
      if (!e.on) return done("off");
      const rate = extOut(e, c);
      if (!(rate > 0)) return done("idle");
      made = rate * dt;
      add(e.res, made);
      if (!S.flags.extDone) { S.flags.extDone = true; checkAges(); E.emit("struct"); }
      return done("ok");
    }
    /* Un Grand Œuvre alimenté se sert dans la Réserve : de quoi avancer l’étape en
     * cours, au plus `siteRate` par seconde et par matière. */
    function runSite(pid, dt) {
      const st = machStat["S:" + pid] || (machStat["S:" + pid] = { s: "wait", avg: 0 });
      const P = D.PROJECTS[pid];
      if (!P || !projVisible(pid)) { st.s = "idle"; return; }
      const ps = projState(pid), step = P.steps[ps.step];
      if (!step) { st.s = "done"; return; }
      if (!step.cost) { st.s = "act"; return; } // mise à feu, mélodie : ça se décide ailleurs
      if (step.need && !S.frags[step.need]) { st.s = "need"; return; }
      const lane = E.siteRate() * dt;
      let got = 0, done = true;
      st.miss = null;
      for (const i in step.cost) {
        const left = step.cost[i] - (ps.paid[i] || 0);
        if (left > 1e-9) {
          const q = Math.min(left, lane, S.inv[i] || 0);
          if (q > 0) { add(i, -q); ps.paid[i] = (ps.paid[i] || 0) + q; got += q; } else (st.miss = st.miss || {})[i] = "stock";
        }
        if ((ps.paid[i] || 0) < step.cost[i] - 1e-6) done = false;
      }
      st.avg += (1 - Math.exp(-dt / 5)) * (got / dt - st.avg);
      if (done) {
        ps.step++; ps.paid = {};
        E.emit("projstep", { pid, step: ps.step - 1 });
        E.emit("struct");
        if (ps.step >= P.steps.length) endGame(P.end);
        st.s = "ok";
        return;
      }
      st.s = got > 0 ? "ok" : "starved";
    }
    function runDom(dt) {
      const c = E.cache();
      for (const k in S.dom.ext) runExt(k, S.dom.ext[k], dt, c);
      for (const p in S.dom.site) if (S.dom.site[p].on) runSite(p, dt);
    }

    /* --- ce qui entre et sort, par seconde */
    E.flows = function () {
      const prod = {}, cons = {};
      assignWorkers();
      machPool.forEach((w) => {
        if (w.job === null || !w.rec) return;
        const it = item(w.rec);
        if (!it || !it.r) return;
        const r = machUnitRate(w.m);
        prod[w.rec] = (prod[w.rec] || 0) + r * it.r[2];
        for (const i in it.r[1]) cons[i] = (cons[i] || 0) + r * it.r[1][i];
      });
      return { prod, cons };
    };
    /* Tout ce que le Domaine fait entrer et sortir, par matière (par seconde, en moyenne) :
     * la récolte des extracteurs et ce que font les machines, moins ce qu’elles consomment. */
    E.production = function () {
      const f = E.flows(), inn = Object.assign({}, f.prod);
      for (const k in S.dom.ext) {
        const e = S.dom.ext[k], st = machStat[k];
        if (st && st.s === "ok" && st.avg > 1e-6) inn[e.res] = (inn[e.res] || 0) + st.avg;
      }
      const ids = Object.keys(inn).concat(Object.keys(f.cons).filter((k) => !(k in inn)));
      return ids.map((id) => ({ id, in: inn[id] || 0, out: f.cons[id] || 0, net: (inn[id] || 0) - (f.cons[id] || 0) }))
        .sort((a, b) => b.in - a.in || b.out - a.out);
    };

    /* ------------------------------------------------------ grands œuvres */
    function projVisible(pid) {
      const p = D.PROJECTS[pid];
      if (p.req === "arche") return !!S.flags.arche;
      return (S.made[p.req] || 0) > 0;
    }
    function projState(pid) { return S.proj[pid] || (S.proj[pid] = { step: 0, paid: {} }); }
    E.projVisible = projVisible;
    E.projState = projState;
    E.contribute = function (pid) {
      if (!projVisible(pid)) return { ok: false };
      const p = D.PROJECTS[pid], ps = projState(pid);
      const st = p.steps[ps.step];
      if (!st || !st.cost) return { ok: false };
      if (st.need && !S.frags[st.need]) return { ok: false, why: "need" };
      let gave = 0, done = true;
      for (const i in st.cost) {
        const left = st.cost[i] - (ps.paid[i] || 0);
        const g = Math.min(left, Math.floor(count(i)));
        if (g > 0) { add(i, -g); ps.paid[i] = (ps.paid[i] || 0) + g; gave += g; }
        if ((ps.paid[i] || 0) < st.cost[i]) done = false;
      }
      let ending = null;
      if (done) {
        ps.step++; ps.paid = {};
        if (ps.step >= p.steps.length) ending = endGame(p.end);
      }
      E.emit("struct");
      return { ok: gave > 0 || done, gave, done, ending };
    };
    E.fire = function (pid) {
      const p = D.PROJECTS[pid], ps = projState(pid);
      const st = p.steps[ps.step];
      if (!st || !st.fire) return null;
      ps.step++;
      return endGame(p.end);
    };
    function endGame(eid) {
      const first = !S.endings[eid];
      S.endings[eid] = true;
      S.meta.endings[eid] = (S.meta.endings[eid] || 0) + 1;
      const en = D.ENDINGS[eid];
      const extra = (en.extra || []).filter((x) => S.frags[x.frag]).map((x) => x.t);
      const res = { id: eid, first, extra };
      E.emit("ending", res);
      E.emit("struct");
      return res;
    }
    E.endingsCount = () => Object.keys(S.meta.endings).length;

    /* ----------------------------------------------------------- LE COMPTOIR
     * Marché tenu par le Troqueur dans la Plaine : on vend ce qui encombre la
     * Réserve contre des écus, et on achète des Traces et des matières premières. */
    const VAL_CACHE = {};
    function valueOf(id) {
      if (VAL_CACHE[id] !== undefined) return VAL_CACHE[id];
      const it = D.ITEMS[id];
      if (!it) return 0;
      if (it.r) {
        const [, ing, qty] = it.r;
        let sum = 0;
        for (const i in ing) sum += valueOf(i) * ing[i];
        return (VAL_CACHE[id] = (sum / (qty || 1)) * D.COMPTOIR.work);
      }
      if (it.t === "res") {
        return (VAL_CACHE[id] = D.COMPTOIR.raw * Math.pow(D.COMPTOIR.rawAge, it.a || 0));
      }
      return (VAL_CACHE[id] = 0);
    }
    E.value = valueOf;

    E.sellable = function (id) {
      const it = D.ITEMS[id];
      if (!it) return false;
      if (it.t !== "res" && it.t !== "comp") return false;
      if (isUnique(it)) return false;
      return true;
    };

    E.soldCount = (id) => (S.comptoir && S.comptoir.sold && S.comptoir.sold[id]) || 0;

    E.unitPrice = function (id) {
      const v = valueOf(id);
      if (!(v > 0)) return 0;
      const q = E.soldCount(id), sat = D.COMPTOIR.sat;
      return v / (1 + q / sat);
    };

    E.sellQuote = function (id, n) {
      n = Math.floor(Number(n));
      if (!(n > 0) || !E.sellable(id)) return 0;
      const v = valueOf(id);
      if (!(v > 0)) return 0;
      const q = E.soldCount(id), sat = D.COMPTOIR.sat;
      return v * sat * Math.log((sat + q + n) / (sat + q));
    };

    E.sell = function (id, n) {
      n = Math.floor(Number(n));
      if (!(n > 0)) return { ok: false, why: "qty" };
      if (!E.sellable(id)) return { ok: false, why: "unsellable" };
      if (count(id) < n) return { ok: false, why: "missing" };
      const ecus = E.sellQuote(id, n);
      add(id, -n);
      S.ecus = (S.ecus || 0) + ecus;
      S.comptoir = S.comptoir || { sold: {}, traces: 0 };
      S.comptoir.sold = S.comptoir.sold || {};
      S.comptoir.sold[id] = (S.comptoir.sold[id] || 0) + n;
      E.emit("sold", { id, n, ecus });
      E.emit("struct");
      return { ok: true, n, ecus };
    };

    E.traceCost = function () {
      const k = (S.comptoir && S.comptoir.traces) || 0;
      const C = D.COMPTOIR;
      return C.trace * Math.pow(C.traceAge, S.age || 0) * Math.pow(C.traceUp, k);
    };

    E.buyTrace = function () {
      const cost = E.traceCost();
      if ((S.ecus || 0) < cost) return { ok: false, why: "ecus", need: cost };
      S.ecus -= cost;
      S.comptoir = S.comptoir || { sold: {}, traces: 0 };
      S.comptoir.traces = (S.comptoir.traces || 0) + 1;
      S.meta.traces = (S.meta.traces || 0) + 1;
      S.meta.tracesTotal = (S.meta.tracesTotal || 0) + 1;
      E.emit("bought", { kind: "trace", ecus: cost });
      E.emit("struct");
      return { ok: true, ecus: cost };
    };

    function canBuyRes(id) {
      const it = D.ITEMS[id];
      if (!it || it.t !== "res") return false;
      return D.ZONES.some((z) => zoneOpen(z.id) && z.res.includes(id));
    }
    E.canBuyRes = canBuyRes;

    E.buyResCost = (id, n) => (Math.floor(Number(n)) || 0) * D.COMPTOIR.buy * valueOf(id);

    E.buyableRes = function () {
      const seen = {}, list = [];
      D.ZONES.forEach((z) => {
        if (!zoneOpen(z.id)) return;
        z.res.forEach((r) => {
          if (!seen[r]) { seen[r] = true; list.push(r); }
        });
      });
      return list;
    };

    E.buyRes = function (id, n) {
      n = Math.floor(Number(n));
      if (!(n > 0)) return { ok: false, why: "qty" };
      if (!canBuyRes(id)) return { ok: false, why: "unavailable" };
      const cost = E.buyResCost(id, n);
      if ((S.ecus || 0) < cost) return { ok: false, why: "ecus", need: cost };
      S.ecus -= cost;
      add(id, n);
      E.emit("bought", { kind: "res", id, n, ecus: cost });
      E.emit("struct");
      return { ok: true, id, n, ecus: cost };
    };

    E.comptoirOpen = () => zoneOpen(D.COMPTOIR.zone);

    /* Nouveau cycle : le Semeur suivant s’éveille. On garde le savoir. */
    E.newCycle = function () {
      const old = S;
      const gain = E.releveGain();
      old.meta.traces = (old.meta.traces || 0) + gain;
      old.meta.tracesTotal = (old.meta.tracesTotal || 0) + gain;
      const cap = (D.RUINES && D.RUINES.cap) || 3;
      const ruins = {};
      EXTS.concat(MACHINES).forEach((id) => {
        const cnt = Math.floor(old.inv[id] || 0);
        if (cnt > 0) ruins[id] = Math.min(cnt, cap);
      });
      old.meta.ruins = ruins;
      const n = freshState(now());
      n.known = old.known; n.hints = old.hints; n.frags = old.frags; n.secrets = old.secrets; n.studied = old.studied || {};
      n.seen = old.seen; n.meta = old.meta; n.meta.ruins = Object.assign({}, ruins); n.settings = old.settings; n.pins = old.pins || {};
      n.cycle = (old.cycle || 1) + 1;
      n.echoes = Object.values(old.meta.endings).reduce((a, b) => a + b, 0);
      n.intu = Math.max(3, old.intu); // l’Intuition se garde, comme le Carnet
      // les mains se souviennent un peu : une part de l’expérience reste
      for (const g in old.skills || {}) n.skills[g] = Math.floor((old.skills[g] || 0) * D.SKILL.keep);
      n.introSeen = true;
      n.stats = Object.assign({}, old.stats);
      // le tutoriel déjà vu, les conseils déjà lus et la version vue ne reviennent pas
      for (const k in old.flags) if (k === "tuto" || k === "ver" || k === "milesSeen" || k === "roueSeen" || k.indexOf("tip_") === 0) n.flags[k] = old.flags[k];
      if (old.meta.capsule) {
        n.flags.capsuleMsg = true;
        Object.assign(n.inv, { bois: 60, fibre: 60, caillou: 40, manche: 10, corde: 10 });
      }
      S = n;
      // la Mémoire des mains : le paquetage, et les terres déjà connues
      // ce que le paquetage donne compte comme déjà fait (les étapes « manche », « corde »… passent)
      D.PAQUETAGE.slice(0, memLvl("paquetage")).forEach((kit) => { for (const i in kit) { add(i, kit[i]); if (item(i).r) S.made[i] = Math.max(S.made[i] || 0, 1); } });
      ["plaine", "riviere"].slice(0, memLvl("raccourci")).forEach((z) => {
        const tool = ZONES[z].req;
        S.inv[tool] = 1; S.made[tool] = 1; markSeen(tool);
        S.age = Math.max(S.age, item(tool).a || 0);
        S.pass[z] = { paid: {}, done: true, free: true };
        S.zones[z] = true;
      });
      forgetDom();
      recalc();
      E.emit("cycle", n.cycle);
      E.emit("struct");
    };

    /* Première renaissance obligatoire (fin du tutoriel) */
    E.canForcedReleve = () => !!(S.meta && S.meta.parcours && !S.meta.forcedDone && S.cycle === 1 && S.flags && S.flags.extDone && S.exp && S.exp.done && S.exp.done.lisiere >= 1);
    E.forcedReleve = function () {
      if (S.meta.forcedDone || S.cycle !== 1) return false;
      S.meta.forcedDone = true;
      const gift = (D.PARCOURS && D.PARCOURS.gift) || 3;
      S.meta.traces = (S.meta.traces || 0) + gift;
      S.meta.tracesTotal = (S.meta.tracesTotal || 0) + gift;
      E.newCycle();
      return true;
    };

    /* Les ruines : ce qu’un Semeur a construit attend le suivant */
    E.ruins = function () {
      const out = {};
      for (const id in (S.meta && S.meta.ruins) || {}) {
        if (S.meta.ruins[id] > 0) out[id] = S.meta.ruins[id];
      }
      return out;
    };
    E.ruinCost = function (id) {
      const it = item(id);
      if (!it || !it.r || !it.r[1]) return {};
      const part = (D.RUINES && D.RUINES.part) || 0.1;
      const cost = {};
      for (const k in it.r[1]) cost[k] = Math.ceil(it.r[1][k] * part);
      return cost;
    };
    E.repair = function (id) {
      const it = item(id);
      if (!it || !(S.meta && S.meta.ruins && S.meta.ruins[id] > 0)) return { ok: false, why: "noruin" };
      const cost = E.ruinCost(id);
      const missing = {};
      for (const k in cost) {
        const have = S.inv[k] || 0;
        if (have < cost[k]) missing[k] = cost[k] - have;
      }
      if (Object.keys(missing).length > 0) return { ok: false, why: "missing", missing };
      for (const k in cost) S.inv[k] -= cost[k];
      add(id, 1);
      S.meta.ruins[id] -= 1;
      if (S.meta.ruins[id] <= 0) delete S.meta.ruins[id];
      if (it.t === "ext") E.domAutoExt(id);
      recalc();
      domChanged();
      E.emit("struct");
      return { ok: true, id, cost };
    };
    E.ruinName = function (id) {
      const it = item(id);
      if (!it) return id;
      if (it.ruine) return it.ruine;
      if (it.t === "mach") return (it.sn || it.n) + " rouillé";
      return (it.sn || it.n) + " en ruine";
    };

    /* ------------------------------------------------------ temps */
    function step(dt, offline) {
      const c = E.cache();
      for (const r in c.rates) add(r, c.rates[r] * dt);
      pullOrderInputs();
      runDom(dt);
      pullOrderInputs();
      runAct(dt, offline);
      workStep(dt, offline);
      if (!offline && c.pip > 0) {
        S.pipAcc += c.pip * dt;
        const open = [];
        D.ZONES.forEach((z) => { if (zoneOpen(z.id)) z.res.forEach((r) => open.push([r, z.id])); });
        while (S.pipAcc >= 1 && open.length) {
          S.pipAcc -= 1;
          const [r, z] = open[Math.floor(rand() * open.length)];
          add(r, tapYield(r, z));
        }
      }
      if (c.intu > 0) {
        S.intuAcc += (c.intu / 60) * dt;
        if (S.intuAcc >= 1) { const k = Math.floor(S.intuAcc); S.intu += k; S.intuAcc -= k; }
      }
      if (!offline) S.stats.play += dt; // le temps passé à jouer, pas l’absence
    }
    E.step = step;

    /* Avance le temps jusqu’à maintenant. Gère aussi le hors-ligne. */
    E.update = function () {
      const t = now();
      const dt = (t - S.t) / 1000;
      S.t = t;
      if (!(dt > 0)) return 0;
      if (dt > 5) return E.catchUp(dt);
      step(dt, false);
      if (S.exp.active && t >= S.exp.active.t0 + S.exp.active.dur) finishExp(false);
      return dt;
    };

    E.catchUp = function (dt) {
      dt = Math.min(dt, memV("veille") * 3600 || OFFLINE_CAP);
      const before = Object.assign({}, S.inv);
      const chunk = dt > 600 ? 10 : 1;
      let left = dt;
      while (left > 0) { const d = Math.min(chunk, left); step(d, true); left -= d; }
      let exp = null;
      if (S.exp.active && now() >= S.exp.active.t0 + S.exp.active.dur) { exp = S.exp.active; finishExp(true); }
      const gains = {};
      for (const k in S.inv) {
        const g = S.inv[k] - (before[k] || 0);
        if (g >= 1) gains[k] = g;
      }
      E.emit("offline", { dt, gains, exp });
      return dt;
    };

    /* ------------------------------------------------------ sauvegarde */
    E.serialize = () => JSON.stringify(S);
    /* Lit une sauvegarde (chaîne JSON ou objet), la migre et la valide.
     * Ne modifie l’état courant que si tout s’est bien passé. */
    /* Domaine d’une sauvegarde : ce qui est illisible est mis de côté, pas jeté.
     * Les anciens groupes fixes de machines (S.dom.mach) sont dissous : leurs
     * tampons retournent à la Réserve et les machines restent possédées, au repos. */
    function checkDom(o) {
      const d = o.dom && typeof o.dom === "object" ? o.dom : freshDom();
      const aside = (k, v) => { o.orphans = o.orphans || {}; (o.orphans.dom = o.orphans.dom || {})[k] = v; };
      if (!d.ext || typeof d.ext !== "object") d.ext = {};
      if (!d.site || typeof d.site !== "object") d.site = {};
      d.seq = Math.max(0, Math.floor(d.seq) || 0);
      for (const k in d.ext) {
        const e = d.ext[k], i = k.indexOf(":"), z = k.slice(0, i), res = k.slice(i + 1);
        if (!e || typeof e !== "object" || !e.u || typeof e.u !== "object" || !(ZONE_DEPS[z] || []).some((x) => x.res === res)) {
          aside("ext:" + k, e); delete d.ext[k]; continue;
        }
        e.z = z; e.res = res; e.on = e.on !== false;
        for (const t in e.u) {
          const n = Math.max(0, Math.floor(e.u[t]) || 0);
          if (!D.ITEMS[t] || D.ITEMS[t].t !== "ext" || !extRate(t, res) || !n) { if (n) aside("ext:" + k + ":" + t, n); delete e.u[t]; }
          // posé sur une autre terre que la sienne (permis avant la 5.3) : il rentre chez lui au chargement
          else if (D.ITEMS[t].z !== z) { const m = (o.flags.reExt = o.flags.reExt || {}); m[t] = (m[t] || 0) + n; delete e.u[t]; }
          else e.u[t] = n;
        }
        if (!Object.keys(e.u).length) delete d.ext[k];
      }
      // jamais plus d’extracteurs posés qu’on n’en possède
      const own = (t) => Math.floor(Number(o.inv[t]) || 0), used = {};
      for (const k in d.ext) for (const t in d.ext[k].u) {
        const v = Math.min(d.ext[k].u[t], Math.max(0, own(t) - (used[t] || 0)));
        used[t] = (used[t] || 0) + v;
        if (v) d.ext[k].u[t] = v; else delete d.ext[k].u[t];
      }
      for (const k in d.ext) if (!Object.keys(d.ext[k].u).length) delete d.ext[k];
      const recById = {};
      if (Array.isArray(d.mach) && d.mach.length > 0) {
        o.flags = o.flags || {};
        o.flags.mach57 = true;
        d.mach.forEach((e, idx) => {
          if (!e || typeof e !== "object" || !D.ITEMS[e.m] || D.ITEMS[e.m].t !== "mach" || (e.r && (!D.ITEMS[e.r] || !D.ITEMS[e.r].r))) {
            aside("mach:" + ((e && e.id) || idx), e);
          } else if (e.id && e.r) {
            recById[e.id] = e.r;
          }
        });
      }
      if (d.ms && typeof d.ms === "object") {
        for (const id in d.ms) {
          const B = d.ms[id];
          if (B && typeof B === "object") {
            backToInv(o, B.b);
            if (B.o && typeof B.o === "object") backToInv(o, B.o);
            else if (Number(B.o) > 0 && recById[id]) backToInv(o, { [recById[id]]: Number(B.o) });
            o.flags = o.flags || {};
            o.flags.mach57 = true;
          }
        }
      }
      d.mach = [];
      d.ms = {};
      for (const p in d.site) {
        if (!D.PROJECTS[p]) { aside("site:" + p, d.site[p]); delete d.site[p]; } else d.site[p] = { on: !!d.site[p] && d.site[p].on !== false };
      }
      o.dom = d;
    }
    /* File des commandes d’une sauvegarde : une commande illisible est annulée et
     * ses matières rendues au stock (ou mises de côté si l’objet n’existe plus). */
    function checkHand(o) {
      const h = o.hand && typeof o.hand === "object" ? o.hand : {};
      const q = Array.isArray(h.q) ? h.q : [];
      const keep = [];
      const refund = (b) => {
        if (!b || typeof b !== "object") return;
        for (const i in b) {
          const v = Number(b[i]);
          if (!(v > 0)) continue;
          if (D.ITEMS[i]) o.inv[i] = (o.inv[i] || 0) + v;
          else { o.orphans = o.orphans || {}; (o.orphans.inv = o.orphans.inv || {})[i] = (o.orphans.inv[i] || 0) + v; }
        }
      };
      q.forEach((j) => {
        const ok = j && typeof j === "object" && D.ITEMS[j.id] && Array.isArray(j.s) && j.s.length &&
          j.s.every((s) => Array.isArray(s) && D.ITEMS[s[0]] && D.ITEMS[s[0]].r && s[1] >= 1) && j.b && typeof j.b === "object";
        if (!ok || keep.length >= D.HAND.max) { refund(j && j.b); return; }
        for (const i in j.b) if (!D.ITEMS[i] || !(Number(j.b[i]) > 0)) { refund({ [i]: j.b[i] }); delete j.b[i]; }
        j.s = j.s.map((s) => [s[0], Math.floor(s[1])]);
        if (Array.isArray(j.done) && j.done.length === j.s.length) {
          j.done = j.done.map((d, idx) => Math.max(0, Math.min(j.s[idx][1], Math.floor(Number(d)) || 0)));
        } else {
          const i0 = Math.max(0, Math.min(j.s.length, Math.floor(j.i) || 0));
          const k0 = Math.max(0, Math.floor(j.k) || 0);
          j.done = j.s.map((s, idx) => idx < i0 ? s[1] : idx === i0 ? Math.min(s[1], k0) : 0);
        }
        if (Array.isArray(j.hMade) && j.hMade.length === j.s.length) {
          j.hMade = j.hMade.map((d, idx) => Math.max(0, Math.min(j.done[idx], Math.floor(Number(d)) || 0)));
        } else {
          j.hMade = j.done.slice();
        }
        if (Array.isArray(j.sp) && j.sp.length === j.s.length) {
          j.sp = j.sp.map((v) => Math.max(0, Number(v) || 0));
        } else {
          j.sp = j.s.map(() => 0); // l’ancien S.hand.p comptait des secondes : la pièce en cours repart de zéro
        }
        if (Array.isArray(j.mAcc) && j.mAcc.length === j.s.length) {
          j.mAcc = j.mAcc.map((v) => Math.max(0, Number(v) || 0));
        } else {
          j.mAcc = j.s.map(() => 0);
        }
        const cleanMiss = {};
        if (j.miss && typeof j.miss === "object") {
          for (const k in j.miss) {
            const v = Number(j.miss[k]);
            if (D.ITEMS[k] && v > 0) cleanMiss[k] = v;
          }
        }
        j.miss = cleanMiss;
        let cur = j.done.findIndex((d, idx) => d < j.s[idx][1]);
        if (cur < 0) cur = j.s.length;
        j.i = cur;
        j.k = cur < j.s.length ? j.done[cur] : 0;
        if (typeof j.to !== "string") delete j.to;
        delete j.loop;
        keep.push(j);
      });
      o.hand = { q: keep, p: 0 };
      if (!o.studied || typeof o.studied !== "object") o.studied = {};
    }
    function parseSave(src) {
      const o = typeof src === "string" ? JSON.parse(src) : JSON.parse(JSON.stringify(src));
      if (!o || typeof o !== "object" || !o.inv || typeof o.inv !== "object") throw new Error("Ce n’est pas une sauvegarde d’Éclat.");
      migrate(o);
      const hadPass = !!o.pass && typeof o.pass === "object";
      const base = freshState(now());
      for (const k in base) if (o[k] === undefined || o[k] === null && k !== "track") o[k] = base[k];
      o.meta = Object.assign({ endings: {}, capsule: false, traces: 0, tracesTotal: 0 }, o.meta);
      if (!o.meta.mem || typeof o.meta.mem !== "object") o.meta.mem = {};
      // les réminiscences déjà lues (avant qu’on les retienne) : celles des objets déjà faits
      if (!o.meta.ev || typeof o.meta.ev !== "object") { o.meta.ev = {}; for (const id in o.made || {}) if (o.made[id] > 0 && D.EVENTS[id]) o.meta.ev[id] = 1; }
      if (!o.meta.ruins || typeof o.meta.ruins !== "object" || Array.isArray(o.meta.ruins)) {
        o.meta.ruins = {};
      } else {
        const ruins = {};
        for (const id in o.meta.ruins) {
          const n = Math.floor(Number(o.meta.ruins[id]));
          if (Number.isFinite(n) && n > 0) {
            if (D.ITEMS[id]) ruins[id] = n;
            else { o.orphans = o.orphans || {}; (o.orphans.ruins = o.orphans.ruins || {})[id] = n; }
          }
        }
        o.meta.ruins = ruins;
      }
      // avant les passages : chaque terre déjà ouverte compte comme passage franchi
      if (!hadPass) {
        o.pass = {};
        for (const z in o.zones || {}) if (o.zones[z] && D.PASSAGES[z]) o.pass[z] = { paid: {}, done: true };
      }
      o.settings = Object.assign({ sound: true, vibe: true }, o.settings);
      o.exp = Object.assign({ active: null, done: {} }, o.exp);
      o.stats = Object.assign({ taps: 0, crafts: 0, tries: 0, play: 0 }, o.stats);
      o.gt = { id: o.gt && o.gt.id || null, p: (o.gt && o.gt.p) || 0 };
      if (!o.tried || typeof o.tried !== "object") o.tried = {};
      const ec = Number(o.ecus);
      o.ecus = Number.isFinite(ec) && ec >= 0 ? ec : 0;
      const cp = o.comptoir;
      if (!cp || typeof cp !== "object" || Array.isArray(cp)) {
        o.comptoir = { sold: {}, traces: 0 };
      } else {
        const sold = {};
        if (cp.sold && typeof cp.sold === "object" && !Array.isArray(cp.sold)) {
          for (const id in cp.sold) {
            const q = Number(cp.sold[id]);
            if (Number.isFinite(q) && q > 0) sold[id] = q;
          }
        }
        const tr = Math.max(0, Math.floor(Number(cp.traces)) || 0);
        o.comptoir = { sold, traces: tr };
      }
      checkHand(o);
      checkDom(o);
      // compétences et action en cours : des nombres, et une action qui a un sens
      if (!o.skills || typeof o.skills !== "object") o.skills = {};
      for (const g in o.skills) { const v = Number(o.skills[g]); if (!(v >= 0) || !(D.GESTES[g] || g === "recolte")) delete o.skills[g]; else o.skills[g] = v; }
      const a = o.act;
      if (a && !(a.k === "harv" && ZONES[a.z] && D.ITEMS[a.res])) o.act = null;
      if (o.act && o.act.k === "harv") { o.act.p = Math.max(0, Math.min(1, Number(o.act.p) || 0)); o.act.got = Number(o.act.got) || 0; }
      // identifiants inconnus (objets retirés) : mis de côté, jamais perdus
      ITEM_MAPS.forEach((k) => {
        if (!o[k] || typeof o[k] !== "object") return;
        for (const id in o[k]) if (!D.ITEMS[id]) {
          o.orphans = o.orphans || {};
          (o.orphans[k] = o.orphans[k] || {})[id] = o[k][id];
          delete o[k][id];
        }
      });
      if (o.track && !D.ITEMS[o.track.id]) o.track = null;
      if (o.exp.active && !(ZONES[o.exp.active.z] && ZONES[o.exp.active.z].exps[o.exp.active.i])) o.exp.active = null;
      if (typeof o.age !== "number" || o.age < 0 || o.age >= D.AGES.length) o.age = 0;
      return o;
    }
    E.parseSave = parseSave;
    E.load = function (src) {
      const o = parseSave(src);
      S = o;
      forgetDom();
      recalc();
      if (S.flags.fab4 === "todo") placeOldExtractors();
      if (S.flags.reExt) {
        for (const t in S.flags.reExt) for (let i = 0; i < S.flags.reExt[t]; i++) if (!E.domAutoExt(t)) break;
        delete S.flags.reExt;
      }
      if (!S.flags.ages) checkAges(true); // une partie d’avant les âges accomplis
      E.emit("struct");
      return true;
    };
    E.reset = function () { S = freshState(now()); S.meta.parcours = 1; forgetDom(); recalc(); E.emit("struct"); };
    E.exportSave = () => {
      const s = E.serialize();
      return typeof btoa !== "undefined" ? btoa(unescape(encodeURIComponent(s))) : Buffer.from(s, "utf8").toString("base64");
    };
    /* Accepte un fichier JSON comme un ancien code base64. */
    E.decodeSave = (txt) => {
      const t = String(txt || "").trim();
      if (t[0] === "{") return t;
      return typeof atob !== "undefined" ? decodeURIComponent(escape(atob(t))) : Buffer.from(t, "base64").toString("utf8");
    };
    E.importSave = (txt) => E.load(E.decodeSave(txt));

    recalc();
    return E;
  }

  const API = { createEngine, freshState, migrate, SAVE_VERSION };
  root.EclatEngine = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
