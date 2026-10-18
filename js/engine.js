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
  const SAVE_VERSION = 4;
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

  /* Géométrie de l’Usine : directions 0 → droite, 1 → bas, 2 → gauche, 3 → haut.
   * La Réserve occupe les cases de -RES à RES autour de l’origine. */
  const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1];
  const RES = 1;
  const FAB_R0 = 7, FAB_RMAX = 13;
  const ck = (x, y) => x + "," + y;
  const isRes = (x, y) => Math.abs(x) <= RES && Math.abs(y) <= RES;
  const touchesRes = (x, y) => (Math.abs(x) === RES + 1 && Math.abs(y) <= RES) || (Math.abs(y) === RES + 1 && Math.abs(x) <= RES);
  const FAB_KINDS = { belt: 1, port: 1, split: 1, cross: 1, mach: 1, ext: 1, site: 1 };
  const freshFab = () => ({ r: FAB_R0, c: {}, seq: 0, ms: {} });

  /* Les gisements : chaque terre a sa parcelle sur la carte de la Fabrique, avec
   * une case par ressource (celles qu’on y récolte, et celles que produisent ses
   * extracteurs). Positions fixes : la carte est la même d’une partie à l’autre,
   * et elle s’étend à chaque nouvelle terre. */
  const PATCH = {
    lisiere: [0, -7], plaine: [8, 0], riviere: [0, 8], collines: [-9, 0], mine: [9, -9], desert: [-10, 9],
    gisement: [10, 10], montagnes: [-11, -10], orbite: [0, -16], lune: [17, 0], mercure: [0, 17], caveau: [-17, 0]
  };
  const EXTS = Object.keys(D.ITEMS).filter((id) => D.ITEMS[id].t === "ext");
  const DEPOSITS = {}; // "x,y" → { res, z, hand }
  const DEP_AT = {}; // zone → ressource → "x,y"
  D.ZONES.forEach((z, i) => {
    const list = z.res.slice();
    EXTS.forEach((id) => { if (D.ITEMS[id].z === z.id) for (const r in D.ITEMS[id].p) if (!list.includes(r)) list.push(r); });
    const far = 20 + i * 3;
    const [cx, cy] = PATCH[z.id] || [Math.round(Math.cos(i * 2.4) * far), Math.round(Math.sin(i * 2.4) * far)];
    DEP_AT[z.id] = {};
    list.forEach((r, j) => {
      const k = ck(cx - (list.length - 1) + 2 * j, cy);
      if (DEPOSITS[k]) throw new Error("Deux gisements au même endroit : " + k);
      DEPOSITS[k] = { res: r, z: z.id, hand: z.res.includes(r) };
      DEP_AT[z.id][r] = k;
    });
  });
  /* un extracteur posé met tout son effort sur la matière de sa case */
  const extRate = (id, r) => { const p = D.ITEMS[id] && D.ITEMS[id].p; return p && p[r] ? p[r] * Object.keys(p).length : 0; };

  function freshState(now) {
    return {
      v: SAVE_VERSION, t: now, start: now,
      inv: {}, seen: {}, made: {}, known: {}, hints: {},
      intu: 3, zones: { lisiere: true }, flags: {}, frags: {}, secrets: {},
      exp: { active: null, done: {} }, age: 0,
      fab: freshFab(), pins: {}, track: null, gt: { id: null, p: 0 }, tried: {},
      hand: { q: [], p: 0 }, studied: {},
      proj: {}, endings: {},
      arche: [], term: [], notes: [],
      stats: { taps: 0, crafts: 0, tries: 0, play: 0 },
      cycle: 1, echoes: 0, meta: { endings: {}, capsule: false },
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
    return o;
  }

  /* Disposition des anciennes lignes : une sortie, un tapis qui fait le tour de la
   * Réserve puis y rentre, et les machines posées tout autour, tournées vers lui.
   * Elles se servent sur le tapis et y déposent ce qu’elles fabriquent. */
  function fabFromLines(lines) {
    const fab = freshFab();
    const live = lines.filter((L) => L && D.ITEMS[L.r] && D.ITEMS[L.m] && D.ITEMS[L.m].t === "mach" && L.n > 0);
    if (!live.length) return { fab, placed: 0, left: 0 };
    // une ligne qui fabrique l’ingrédient d’une autre passe avant elle sur le tapis
    const order = [], done = {};
    const visit = (L, depth) => {
      if (done[L.r] === 2 || depth > 50) return;
      done[L.r] = 1;
      const ing = D.ITEMS[L.r].r ? D.ITEMS[L.r].r[1] : {};
      live.forEach((M) => { if (M !== L && ing[M.r] !== undefined && done[M.r] !== 1) visit(M, depth + 1); });
      if (done[L.r] !== 2) { done[L.r] = 2; live.filter((M) => M.r === L.r).forEach((M) => order.includes(M) || order.push(M)); }
    };
    live.forEach((L) => visit(L, 0));
    const put = (x, y, e) => (fab.c[ck(x, y)] = e);
    put(RES + 1, 0, { k: "port", d: 0, f: null });
    const ring = [];
    for (let y = 0; y <= 2; y++) ring.push([3, y, 1]);
    ring.push([3, 3, 2]);
    for (let x = 2; x >= -2; x--) ring.push([x, 3, 2]);
    ring.push([-3, 3, 3]);
    for (let y = 2; y >= -2; y--) ring.push([-3, y, 3]);
    ring.push([-3, -3, 0]);
    for (let x = -2; x <= 2; x++) ring.push([x, -3, 0]);
    ring.push([3, -3, 1], [3, -2, 1], [3, -1, 2], [2, -1, 2]);
    ring.forEach(([x, y, d]) => put(x, y, { k: "belt", d }));
    const slots = [];
    for (let y = 0; y <= 3; y++) slots.push([4, y, 2]);
    for (let x = 3; x >= -3; x--) slots.push([x, 4, 3]);
    for (let y = 3; y >= -3; y--) slots.push([-4, y, 0]);
    for (let x = -3; x <= 3; x++) slots.push([x, -4, 1]);
    for (let y = -3; y <= -1; y++) slots.push([4, y, 2]);
    let placed = 0;
    order.forEach((L, i) => {
      const sl = slots[i];
      if (!sl) return;
      put(sl[0], sl[1], { k: "mach", id: "M" + ++fab.seq, m: L.m, r: L.r, d: sl[2], n: Math.max(1, Math.floor(L.n)), on: L.on !== false, cap: Math.max(0, Math.floor(L.cap) || 0) });
      placed++;
    });
    return { fab, placed, left: order.length - placed };
  }

  function createEngine(opts) {
    opts = opts || {};
    const now = opts.now || (() => Date.now());
    const rand = opts.rand || Math.random;
    const listeners = {};
    const E = { D, RECIPES, ZONES, RES_ZONE, MACHINES, keyOf, SAVE_VERSION, DX, DY };
    let S = freshState(now());
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

    /* ------------------------------------------------------ récolte */
    function tapYield(res, zid) {
      const c = E.cache();
      return (item(res).b || 1) * (c.tap[res] || 1) * (c.tap[zid] || 1) * (c.tap["*"] || 1) * c.echo;
    }
    E.tapYield = tapYield;
    E.tap = function (res, zid) {
      zid = zid || RES_ZONE[res];
      if (!zoneOpen(zid) || !ZONES[zid].res.includes(res)) return 0;
      const n = tapYield(res, zid);
      add(res, n);
      S.stats.taps++;
      return n;
    };
    /* production des extracteurs posés pour une matière (par seconde) */
    E.rate = (res) => {
      let r = 0;
      const c = E.cache();
      for (const k in S.fab.c) {
        const e = S.fab.c[k];
        const st = e.k === "ext" && e.res === res && machStat[e.id];
        if (!st) continue;
        if (st.s === "ok") r += extOut(e, c);
        else if (st.s === "sat") r += E.beltCap();
        else if (st.s === "jam") r += st.avg;
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
      const ch = 0.04 * E.stars(it.id);
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
      if (e.zone) unlockZone(e.zone);
      if (e.once && e.once.intu) S.intu += e.once.intu;
      if (it.sec) {
        S.intu += 2;
        addSecret(id);
      }
      if (e.capsule) S.meta.capsule = true;
      if (e.fireworks) E.emit("fx", "fireworks");
      if (e.arche && !S.flags.arche) { S.flags.arche = true; archeSay("radio"); }
      if (e.decode) decodeSignal();
      if (D.EVENTS[id]) E.emit("event", { id, txt: D.EVENTS[id] });
      if (id === "cerf_volant" || id === "boussole") E.emit("struct");
      E.emit("discover", id);
    }

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
        learn(id);
        const res = craft(id, 1, true);
        E.emit("crafted", id, res);
        return Object.assign({ kind: "craft", id, fresh: true }, res);
      }
      const t = temperature(g, ids);
      const pool = D.FAIL[g] || D.FAIL.assembler;
      const names = ids.map((i) => item(i).n.toLowerCase());
      const x = names.length > 1 ? names.slice(0, -1).join(", ") + " et " + names[names.length - 1] : names[0];
      const flav = pool[Math.floor(rand() * pool.length)].replace(/\{x\}/g, x);
      const mem = remember(g, ids);
      return { kind: "fail", temp: t.temp, why: t.why, msg: flav.charAt(0).toUpperCase() + flav.slice(1), mem };
    };

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
        const gather = it.t === "res" && zid && zoneOpen(zid);
        if (!it.r || gather) { missing[x] = (missing[x] || 0) + qty; return; }
        if (!S.known[x]) { locked[x] = true; missing[x] = (missing[x] || 0) + qty; return; }
        const b = blocker(x);
        if (b) { blocked[x] = b; if (b.why !== "owned") missing[x] = (missing[x] || 0) + qty; return; }
        const n = root ? qty : Math.ceil(qty / it.r[2]);
        crafts[x] = (crafts[x] || 0) + n;
        depth[x] = Math.max(depth[x] || 0, d);
        const cost = isScaled(it) ? totalCost(x, n) : (() => { const c = {}; for (const i in it.r[1]) c[i] = it.r[1][i] * n; return c; })();
        for (const i in cost) need(i, cost[i], d + 1, false);
        if (!root) { const surplus = n * it.r[2] - qty; if (surplus > 0) avail[x] = (avail[x] || 0) + surplus; }
      }
      need(id, isUnique(item(id)) ? 1 : times, 0, true);
      for (const k in missing) missing[k] = Math.ceil(missing[k] - 1e-9);
      const steps = Object.keys(crafts).sort((a, b) => depth[b] - depth[a]).map((x) => [x, crafts[x]]);
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

    /* ------------------------------------------------------ les mains
     * Fabriquer à la main prend du temps : une pièce après l’autre, dans l’ordre de
     * la file. Les matières sont mises de côté sur l’établi dès la mise en file (les
     * machines ne peuvent plus les prendre) et rendues si on annule. Les sous-composants
     * d’une fabrication en chaîne restent sur l’établi jusqu’à l’étape qui s’en sert. */
    const H = D.HAND;
    /* une pièce seule ; les gestes d’un âge passé vont plus vite */
    function handTime(id) {
      const it = item(id);
      const k = isUnique(it) ? H.unique : isScaled(it) ? H.scaled : 1;
      const old = Math.pow(H.old, Math.max(0, S.age - (it.a || 0)));
      return (H.base + H.age * (it.a || 0)) * Math.max(0.3, 1 - H.star * E.stars(id)) * k * old;
    }
    E.handTime = handTime;
    /* répéter le même geste va de plus en plus vite : n pièces d’affilée prennent t × n^batch */
    const stepTime = (id, n) => handTime(id) * Math.pow(n, H.batch);
    E.batchTime = stepTime;
    /* pièces de `id` encore à faire dans la file */
    function queued(id) {
      let n = 0;
      S.hand.q.forEach((j) => j.s.forEach((s, i) => { if (s[0] === id && i >= j.i) n += s[1] - (i === j.i ? j.k : 0); }));
      return n;
    }
    E.queued = queued;
    /* temps restant ; pour la première de la file, S.hand.p est le temps déjà passé sur l’étape en cours */
    function jobTime(j, first) {
      let t = 0;
      j.s.forEach((s, i) => { if (i >= j.i) t += stepTime(s[0], s[1]); });
      return Math.max(0, t - (first ? S.hand.p : 0));
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
    /* met une fabrication dans la file ; avec `chain`, ses sous-composants aussi */
    E.queue = function (id, times, chain) {
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
      const j = { id, s: steps, i: 0, k: 0, b: bench };
      S.hand.q.push(j);
      E.emit("hand", { kind: "add", job: j });
      return { ok: true, job: j, time: jobTime(j, S.hand.q.length === 1) };
    };
    E.cancelJob = function (idx) {
      const j = S.hand.q[idx];
      if (!j) return false;
      for (const i in j.b) add(i, j.b[i]);
      S.hand.q.splice(idx, 1);
      if (idx === 0) S.hand.p = 0;
      E.emit("hand", { kind: "cancel", job: j });
      return true;
    };
    /* la file, pour l’affichage : pour chaque fabrication, l’étape en cours et le temps restant */
    E.handInfo = function () {
      let t = 0;
      const jobs = S.hand.q.map((j, n) => {
        const s = j.s[Math.min(j.i, j.s.length - 1)], left = jobTime(j, n === 0);
        t += left;
        const tot = j.s.reduce((a, x) => a + stepTime(x[0], x[1]), 0);
        return { id: j.id, n: j.s[j.s.length - 1][1], step: s[0], k: j.k, of: s[1], i: j.i, steps: j.s.length, left, at: t, wait: !!j.w, tot };
      });
      return { jobs, left: t, full: S.hand.q.length >= H.max };
    };
    function finishJob(j, offline) {
      for (const i in j.b) add(i, j.b[i]);
      S.hand.q.shift();
      S.hand.p = 0;
      if (!offline) E.emit("hand", { kind: "done", job: j });
    }
    function handStep(dt, offline) {
      let left = dt, guard = 0;
      while (left > 1e-9 && S.hand.q.length && guard++ < 5000) {
        const j = S.hand.q[0];
        if (j.i >= j.s.length) { finishJob(j, offline); continue; }
        const x = j.s[j.i][0], n = j.s[j.i][1], it = item(x), t = handTime(x), total = t * Math.pow(n, H.batch);
        // la q-ième pièce de l’étape est finie au bout de t × q^batch secondes
        const p = Math.min(S.hand.p + left, total);
        const due = (p >= total - 1e-9 ? n : Math.min(n, Math.floor(Math.pow(p / t, 1 / H.batch) + 1e-9))) - j.k;
        if (due < 1) { left -= p - S.hand.p; S.hand.p = p; continue; }
        // plusieurs pièces d’un coup, sauf pour les objets dont le prix monte à chaque exemplaire
        const m = isScaled(it) || isUnique(it) ? 1 : due;
        const cost = isScaled(it) ? costFor(x, count(x)) : totalCost(x, m);
        if (blocker(x) && blocker(x).why !== "owned" || !take(cost, j.b)) { j.w = 1; return; }
        j.w = 0;
        const tm = Math.min(total, t * Math.pow(j.k + m, H.batch));
        left -= Math.max(0, tm - S.hand.p);
        S.hand.p = Math.max(S.hand.p, tm);
        const last = j.i === j.s.length - 1;
        const r = makeIt(x, m, offline || !last, last ? null : j.b);
        j.k += m;
        if (!offline) E.emit("handdone", { id: x, n: r.n, bonus: r.bonus, first: r.first, last });
        if (j.k >= n) { j.i++; j.k = 0; S.hand.p = 0; }
        if (j.i >= j.s.length) finishJob(j, offline);
      }
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
          if (req && req[0] !== "@") return walk(req, d + 1) || { id: req, why: "zone", z: zid };
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

    /* ------------------------------------------------------ l’Usine
     * Une grille avec, au centre, la Réserve (le stock du joueur). Les sorties
     * posées contre la Réserve envoient sur les tapis ce que les machines
     * réclament. Une machine se sert sur les tapis qui la touchent ou qui entrent
     * dedans, et pose sa production sur la case devant elle. Ce qui arrive au bout
     * d’un tapis qui entre dans la Réserve rejoint le stock.
     * Le calcul se fait de machine à machine, pas objet par objet : il donne le
     * même résultat jeu ouvert ou fermé. Les objets qui roulent sur les tapis ne
     * sont que l’image de ces échanges (voir E.fabDrain). */
    const machStat = {}; // état des machines (non sauvegardé)
    let G = null; // graphe de l’usine, recalculé à chaque modification
    let fabLog = []; // échanges récents, pour l’animation
    let fabQuiet = false;

    E.automatable = (id) => {
      const it = item(id);
      return !!(it && it.r && S.known[id] && !isUnique(it) && !isScaled(it));
    };
    /* la carte s’étend jusqu’aux parcelles des terres ouvertes */
    let patchMemo = { key: "", r: 0 };
    function patchR() {
      const key = Object.keys(S.zones).join();
      if (patchMemo.key === key) return patchMemo.r;
      let r = 0;
      for (const k in DEPOSITS) {
        if (!S.zones[DEPOSITS[k].z]) continue;
        const i = k.indexOf(",");
        r = Math.max(r, Math.abs(+k.slice(0, i)), Math.abs(+k.slice(i + 1)));
      }
      patchMemo = { key, r: r ? r + 3 : 0 };
      return patchMemo.r;
    }
    const fabR = () => Math.max(S.fab.r || FAB_R0, Math.min(FAB_RMAX, 5 + S.age), patchR());
    const inGrid = (x, y) => { const R = fabR(); return Math.abs(x) <= R && Math.abs(y) <= R; };
    const cellAt = (x, y) => S.fab.c[ck(x, y)];
    E.fabR = fabR;
    E.inGrid = inGrid;
    E.isRes = isRes;
    E.touchesRes = touchesRes;
    E.fabCell = (x, y) => (isRes(x, y) ? { k: "res" } : cellAt(x, y) || null);
    /* --- gisements et extracteurs */
    const depAt = (x, y) => { const d = DEPOSITS[ck(x, y)]; return d && S.zones[d.z] ? d : null; };
    E.deposit = depAt;
    E.deposits = () => Object.keys(DEPOSITS).filter((k) => S.zones[DEPOSITS[k].z]).map((k) => {
      const i = k.indexOf(",");
      return Object.assign({ x: +k.slice(0, i), y: +k.slice(i + 1) }, DEPOSITS[k]);
    });
    /* la parcelle d’une terre, ouverte ou non (pour dessiner la brume des terres à venir) */
    E.zonePatch = (zid) => Object.keys(DEP_AT[zid] || {}).map((r) => {
      const k = DEP_AT[zid][r], i = k.indexOf(",");
      return { x: +k.slice(0, i), y: +k.slice(i + 1), res: r };
    });
    E.EXTS = EXTS;
    E.extRate = extRate;
    E.extFor = (r) => EXTS.filter((t) => extRate(t, r) > 0);
    E.extUnits = function () {
      const out = {};
      EXTS.forEach((t) => (out[t] = { own: Math.floor(count(t)), used: 0 }));
      for (const k in S.fab.c) {
        const e = S.fab.c[k];
        if (e.k === "ext") for (const t in e.u) if (out[t]) out[t].used += e.u[t];
      }
      return out;
    };
    /* production d’une exploitation, par seconde */
    function extOut(e, c) {
      let r = 0;
      for (const t in e.u) {
        const it = item(t);
        if (it) r += e.u[t] * extRate(t, e.res) * (c.auto[it.z] || 1) * (c.auto["*"] || 1) * c.echo;
      }
      return r;
    }
    E.extOut = (e) => extOut(e, E.cache());
    /* récolter à la main sur la case d’un gisement */
    E.tapDeposit = (x, y) => { const d = depAt(x, y); return d && d.hand ? E.tap(d.res, d.z) : 0; };
    function fabChanged() { G = null; E.emit("fab"); }
    function forgetFab() {
      for (const k in machStat) delete machStat[k];
      G = null;
      fabLog = [];
      E.emit("fab");
    }
    function machById(id) {
      for (const k in S.fab.c) if (S.fab.c[k].id === id) return S.fab.c[k];
      return null;
    }
    E.machById = machById;
    E.machines = function () {
      const out = {};
      MACHINES.forEach((m) => (out[m] = { own: Math.floor(count(m)), used: 0, spd: item(m).spd }));
      for (const k in S.fab.c) { const e = S.fab.c[k]; if (e.k === "mach" && out[e.m]) out[e.m].used += e.n; }
      return out;
    };
    E.hasFactory = () => EXTS.some((t) => count(t) > 0 || S.known[t]) || MACHINES.some((m) => count(m) > 0) || Object.keys(S.fab.c).length > 0;
    /* ce qu’un tapis porte au plus, par seconde ; et ce que la Réserve laisse sortir, en tout */
    E.beltCap = () => D.BELT.cap[Math.min(S.age, D.BELT.cap.length - 1)] * E.cache().aspd;
    E.resOutCap = () => E.beltCap() * D.BELT.out;
    E.machRate = (e) => (e && e.n > 0 && item(e.m) ? (e.n * item(e.m).spd) / 60 * E.cache().aspd : 0);
    const buf = (id) => S.fab.ms[id] || (S.fab.ms[id] = { p: 0, b: {}, o: 0 });
    E.machBuf = buf;
    E.machInfo = (id) => machStat[id] || { s: "wait", avg: 0 };

    /* Suit le chemin de ce qui sort d’une case (x, y) vers la direction d. */
    function trace(x, y, d, self) {
      const nodes = [], cons = {}, out = { nodes, cons, res: null, ents: [] };
      const seen = {};
      const q = [{ x: x + DX[d], y: y + DY[d], d, p: -1 }];
      const reach = (id, at) => { if (id !== self && !(id in cons)) cons[id] = at; };
      while (q.length) {
        const s = q.shift();
        if (isRes(s.x, s.y)) {
          // la case d’où l’on entre dans la Réserve : chacune porte au plus un tapis de débit
          const k = s.p < 0 ? ck(x, y) : ck(nodes[s.p].x, nodes[s.p].y);
          if (!out.res) out.res = { at: s.p };
          if (!out.ents.some((en) => en.k === k)) out.ents.push({ at: s.p, k });
          continue;
        }
        const e = inGrid(s.x, s.y) ? cellAt(s.x, s.y) : null;
        if (!e || e.k === "port" || e.k === "ext") continue;
        if (e.k === "mach" || e.k === "site") { reach(e.id, s.p); continue; }
        if (e.k === "belt" && e.d === (s.d + 2) % 4) continue; // tapis à contresens
        const key = e.k === "cross" ? ck(s.x, s.y) + ":" + (s.d % 2) : ck(s.x, s.y);
        if (seen[key]) continue;
        seen[key] = true;
        const i = nodes.push({ x: s.x, y: s.y, p: s.p }) - 1;
        if (e.k === "belt") {
          for (let k = 0; k < 4; k++) {
            const n = cellAt(s.x + DX[k], s.y + DY[k]);
            if (n && (n.k === "mach" || n.k === "site")) reach(n.id, i);
          }
          q.push({ x: s.x + DX[e.d], y: s.y + DY[e.d], d: e.d, p: i });
        } else if (e.k === "cross") q.push({ x: s.x + DX[s.d], y: s.y + DY[s.d], d: s.d, p: i });
        else if (e.k === "split") {
          for (let k = 0; k < 4; k++) if (k !== (s.d + 2) % 4) q.push({ x: s.x + DX[k], y: s.y + DY[k], d: k, p: i });
        }
      }
      return out;
    }
    /* Qui alimente qui, et dans quel ordre calculer les machines. */
    function graph() {
      if (G) return G;
      const prods = {}, sup = {}, pos = {};
      for (const k in S.fab.c) {
        const e = S.fab.c[k];
        if (e.k !== "mach" && e.k !== "port" && e.k !== "ext") continue;
        const [x, y] = k.split(",").map(Number);
        if (e.k === "port" && !touchesRes(x, y)) continue;
        const id = e.k === "port" ? "P" + k : e.id;
        pos[id] = { x, y };
        const t = trace(x, y, e.d, e.k === "port" ? null : e.id);
        prods[id] = { id, e, x, y, t };
        for (const c in t.cons) (sup[c] = sup[c] || []).push(id);
      }
      // les machines qui en alimentent d’autres passent d’abord
      const ms = Object.keys(prods).filter((id) => prods[id].e.k === "mach");
      const indeg = {};
      ms.forEach((id) => (indeg[id] = (sup[id] || []).filter((p) => prods[p].e.k === "mach").length));
      const order = [], ready = ms.filter((id) => !indeg[id]);
      while (ready.length) {
        const id = ready.shift();
        order.push(id);
        for (const c in prods[id].t.cons) if (indeg[c] !== undefined && --indeg[c] === 0) ready.push(c);
      }
      ms.forEach((id) => { if (!order.includes(id)) order.push(id); }); // boucles
      const exts = Object.keys(prods).filter((id) => prods[id].e.k === "ext");
      const sites = [];
      for (const k in S.fab.c) {
        const e = S.fab.c[k];
        if (e.k !== "site") continue;
        const [x, y] = k.split(",").map(Number);
        pos[e.id] = { x, y };
        sites.push(e.id);
      }
      G = { prods, sup, pos, order, exts, sites };
      return G;
    }
    E.fabGraph = graph;
    const supplies = (P, i) => (P.e.k === "port" ? !P.e.f || P.e.f === i : P.e.k === "ext" ? P.e.res === i : P.e.r === i);
    const outOf = (e) => (e.k === "ext" ? e.res : e.r);

    function logFlow(from, to, i, q) {
      if (fabQuiet || !(q > 0)) return;
      fabLog.push({ from, to, i, q });
      if (fabLog.length > 600) fabLog.splice(0, fabLog.length - 600);
    }
    E.fabDrain = () => { const l = fabLog; fabLog = []; return l; };

    function pull(cid, i, need, g) {
      const B = buf(cid), srcs = g.sup[cid] || [];
      const take = (pid, q) => { B.b[i] = (B.b[i] || 0) + q; need -= q; logFlow(pid, cid, i, q); };
      // d’abord ce que posent les machines et les extracteurs voisins, ensuite le stock
      for (const pid of srcs) {
        const P = g.prods[pid];
        if (P.e.k === "port" || outOf(P.e) !== i) continue;
        const PB = buf(pid), q = Math.min(need, PB.o);
        if (q > 0) { PB.o -= q; take(pid, q); }
        if (need <= 1e-9) return;
      }
      for (const pid of srcs) {
        const P = g.prods[pid];
        if (P.e.k !== "port" || !supplies(P, i)) continue;
        const q = Math.min(need, S.inv[i] || 0, portLeft);
        if (q > 0) { add(i, -q); portLeft -= q; take(pid, q); }
        if (need <= 1e-9) return;
      }
    }
    function produce(id, k) {
      const it = item(id);
      const bonus = bonusFor(it, k);
      const first = !(S.made[id] > 0);
      S.made[id] = (S.made[id] || 0) + k;
      S.stats.crafts += k;
      if (!S.known[id]) learn(id, true);
      if (first) onFirstCraft(id);
      if (S.track && S.track.id === id) { S.track = null; E.emit("tracked", id); E.emit("struct"); }
      if (!S.flags.lineDone) { S.flags.lineDone = true; E.emit("struct"); }
      return it.r[2] * (k + bonus);
    }
    function runMachine(e, g, dt, c) {
      const st = machStat[e.id] || (machStat[e.id] = { s: "wait", avg: 0, miss: null });
      const B = buf(e.id);
      let made = 0;
      const done = (s) => { st.s = s; st.avg += (1 - Math.exp(-dt / 5)) * (made / dt - st.avg); };
      if (!e.on) return done("off");
      const it = item(e.r), M = item(e.m);
      if (!it || !it.r) return done("norec");
      if (!(e.n > 0) || !M) return done("idle");
      const b = blocker(e.r);
      if (b) { st.b = b; return done("blocked"); }
      const lane = E.beltCap(), outQ = it.r[2], rate = Math.min((e.n * M.spd / 60) * c.aspd, lane / outQ);
      const P = g.prods[e.id], ing = it.r[1], srcs = g.sup[e.id] || [];
      const ncons = Object.keys(P.t.cons).length;
      if (!P.t.res && !ncons) return done("noout");
      // un ingrédient qu’aucun tapis n’apporte : inutile d’attendre
      let link = null;
      for (const i in ing) if (!srcs.some((p) => supplies(g.prods[p], i))) (link = link || {})[i] = "link";
      if (link) {
        st.miss = link;
        for (const i in ing) if (!link[i] && (B.b[i] || 0) < ing[i]) st.miss[i] = "stock";
        B.p = Math.min(B.p, 1);
        return done("starved");
      }
      // ce qu’elle a posé ne part pas (tapis plein, ou machines suivantes qui ne prennent pas tout)
      if (B.o >= Math.max(outQ * 4, lane * (dt + 2))) return done("jam");
      B.p += rate * dt;
      let want = Math.floor(B.p + 1e-9);
      if (e.cap > 0) {
        const room = e.cap - count(e.r) - B.o;
        if (room <= 0) { B.p = Math.min(B.p, 1); return done("cap"); }
        want = Math.min(want, Math.ceil(room / outQ));
      }
      // la machine se sert au passage : de quoi faire ce qu’elle doit, et deux d’avance
      for (const i in ing) {
        const need = (Math.max(0, want) + 2) * ing[i] - (B.b[i] || 0);
        if (need > 1e-9) pull(e.id, i, need, g);
      }
      if (want <= 0) return done(st.s === "starved" || st.s === "ok" ? st.s : "ok");
      let k = want;
      for (const i in ing) k = Math.min(k, Math.floor((B.b[i] || 0) / ing[i] + 1e-9));
      if (k > 0) {
        for (const i in ing) { B.b[i] -= k * ing[i]; if (B.b[i] < 1e-9) delete B.b[i]; }
        B.p -= k;
        made = k;
        B.o += produce(e.r, k);
      }
      if (k < want) {
        B.p = Math.min(B.p, 1);
        st.miss = {};
        for (const i in ing) {
          if ((B.b[i] || 0) >= ing[i]) continue;
          st.miss[i] = portLeft <= 1e-9 && (S.inv[i] || 0) >= 1 ? "slow" : "stock";
        }
        return done("starved");
      }
      st.miss = null;
      return done("ok");
    }
    function runExt(e, g, dt, c) {
      const st = machStat[e.id] || (machStat[e.id] = { s: "wait", avg: 0 });
      const B = buf(e.id);
      let made = 0;
      const done = (s) => { st.s = s; st.avg += (1 - Math.exp(-dt / 5)) * (made / dt - st.avg); };
      if (!e.on) return done("off");
      const rate = extOut(e, c);
      if (!(rate > 0)) return done("idle");
      const P = g.prods[e.id];
      if (!P.t.res && !Object.keys(P.t.cons).length) return done("noout");
      // un tapis ne porte pas plus que son débit ; et rien ne s’entasse si ça ne part pas
      const lane = E.beltCap(), want = Math.min(rate, lane) * dt;
      made = Math.max(0, Math.min(want, Math.max(4, lane * (dt + 2)) - B.o));
      B.o += made;
      return done(made < want * 0.98 ? "jam" : rate > lane * 1.001 ? "sat" : "ok");
    }
    let portLeft = 0; // ce que la Réserve peut encore laisser sortir pendant ce pas
    let satEnts = {}; // cases d’entrée dans la Réserve qui débordent
    function runFab(dt) {
      const g = graph();
      if (!g.order.length && !g.exts.length && !g.sites.length) { satEnts = {}; return; }
      const c = E.cache();
      portLeft = E.resOutCap() * dt;
      for (const id of g.exts) runExt(g.prods[id].e, g, dt, c);
      for (const id of g.order) runMachine(g.prods[id].e, g, dt, c);
      for (const id of g.sites) runSite(machById(id), g, dt);
      // ce qui arrive à la Réserve rejoint le stock, dans la limite de ce que porte
      // chaque tapis qui y entre : d’abord une part égale à chacun, puis le reste
      const cap = E.beltCap() * dt, room = {}, users = {};
      const outs = g.exts.concat(g.order).filter((id) => g.prods[id].t.ents.length && buf(id).o > 1e-9);
      outs.forEach((id) => g.prods[id].t.ents.forEach((en) => { room[en.k] = cap; users[en.k] = (users[en.k] || 0) + 1; }));
      for (let pass = 0; pass < 2; pass++) {
        for (const id of outs) {
          const P = g.prods[id], B = buf(id), r = outOf(P.e);
          for (const en of P.t.ents) {
            if (!(B.o > 1e-9)) break;
            const q = Math.min(B.o, pass ? room[en.k] : Math.min(room[en.k], cap / users[en.k]));
            if (!(q > 0)) continue;
            B.o -= q;
            room[en.k] -= q;
            add(r, q);
            logFlow(id, "res", r, q);
          }
          if (P.e.k === "ext" && !S.flags.extDone) { S.flags.extDone = true; E.emit("struct"); }
        }
      }
      if (!fabQuiet) {
        satEnts = {};
        outs.forEach((id) => { if (buf(id).o > 1e-6) g.prods[id].t.ents.forEach((en) => { if (room[en.k] <= cap * 0.02) satEnts[en.k] = 1; }); });
      }
    }
    /* Un chantier de Grand Œuvre se sert sur les tapis qui le touchent, comme une
     * machine : de quoi avancer l’étape en cours, un tapis de débit par matière. */
    function runSite(e, g, dt) {
      if (!e) return;
      const st = machStat[e.id] || (machStat[e.id] = { s: "wait", avg: 0 });
      const P = D.PROJECTS[e.p];
      if (!P || !projVisible(e.p)) { st.s = "idle"; return; }
      const ps = projState(e.p), step = P.steps[ps.step];
      if (!step) { st.s = "done"; return; }
      if (!step.cost) { st.s = "act"; return; } // mise à feu, mélodie : ça se décide ailleurs
      if (step.need && !S.frags[step.need]) { st.s = "need"; return; }
      const B = buf(e.id), lane = E.beltCap() * dt, srcs = g.sup[e.id] || [];
      let got = 0, done = true;
      st.miss = null;
      for (const i in step.cost) {
        const left = step.cost[i] - (ps.paid[i] || 0);
        if (left <= 1e-9) continue;
        if (!srcs.some((p) => supplies(g.prods[p], i))) (st.miss = st.miss || {})[i] = "link";
        else pull(e.id, i, Math.min(left, lane) - (B.b[i] || 0), g);
        const q = Math.min(B.b[i] || 0, left);
        if (q > 0) { B.b[i] -= q; if (B.b[i] < 1e-9) delete B.b[i]; ps.paid[i] = (ps.paid[i] || 0) + q; got += q; }
        if ((ps.paid[i] || 0) < step.cost[i] - 1e-6) done = false;
      }
      st.avg += (1 - Math.exp(-dt / 5)) * (got / dt - st.avg);
      if (done) {
        ps.step++; ps.paid = {};
        E.emit("projstep", { pid: e.p, step: ps.step - 1 });
        E.emit("struct");
        if (ps.step >= P.steps.length) endGame(P.end);
        st.s = "ok";
        return;
      }
      st.s = got > 0 ? "ok" : st.miss && Object.keys(st.miss).length === Object.keys(step.cost).filter((i) => (ps.paid[i] || 0) < step.cost[i]).length ? "nolink" : "starved";
    }
    E.siteOf = (pid) => {
      for (const k in S.fab.c) if (S.fab.c[k].k === "site" && S.fab.c[k].p === pid) { const i = k.indexOf(","); return { x: +k.slice(0, i), y: +k.slice(i + 1), e: S.fab.c[k] }; }
      return null;
    };
    /* les cases d’où un tapis plein entre dans la Réserve */
    E.fabSat = () => satEnts;
    /* Débits des machines (par seconde, moyenne glissante). */
    E.flows = function () {
      const prod = {}, cons = {};
      for (const k in S.fab.c) {
        const e = S.fab.c[k];
        const st = e.k === "mach" && machStat[e.id];
        const it = st && st.avg > 1e-6 && item(e.r);
        if (!it || !it.r) continue;
        prod[e.r] = (prod[e.r] || 0) + st.avg * it.r[2];
        for (const i in it.r[1]) cons[i] = (cons[i] || 0) + st.avg * it.r[1][i];
      }
      return { prod, cons };
    };

    /* --- construction */
    const portDir = (x, y) => (x === RES + 1 ? 0 : x === -RES - 1 ? 2 : y === RES + 1 ? 1 : 3);
    const intoRes = (x, y, d) => isRes(x + DX[d], y + DY[d]);
    function placeWhy(k, x, y, o) {
      if (!inGrid(x, y)) return "out";
      if (isRes(x, y)) return "res";
      if (cellAt(x, y)) return "taken";
      if (k === "port" && !touchesRes(x, y)) return "port";
      if (k === "site" && (!D.PROJECTS[o.p] || !projVisible(o.p))) return "kind";
      if (k === "site" && E.siteOf(o.p)) return "siteone";
      if (k === "mach") {
        const ms = E.machines();
        if (!ms[o.m]) return "kind";
        if (ms[o.m].own - ms[o.m].used < 1) return "nomach";
      }
      return null;
    }
    E.fabWhy = (k, x, y, o) => placeWhy(k, x, y, o || {});
    E.fabPlace = function (k, x, y, o) {
      o = o || {};
      const why = placeWhy(k, x, y, o);
      if (why) return { ok: false, why };
      let e;
      if (k === "belt") e = { k, d: (o.d | 0) % 4 };
      else if (k === "port") e = { k, d: o.d !== undefined && !intoRes(x, y, o.d) ? o.d : portDir(x, y), f: E.automatable(o.f) || (item(o.f) && S.seen[o.f]) ? o.f : null };
      else if (k === "split" || k === "cross") e = { k };
      else if (k === "mach") e = { k, id: "M" + ++S.fab.seq, m: o.m, r: E.automatable(o.r) ? o.r : null, d: (o.d | 0) % 4, n: 1, on: true, cap: 0 };
      else if (k === "site") e = { k, id: "S:" + o.p, p: o.p };
      else return { ok: false, why: "kind" };
      S.fab.c[ck(x, y)] = e;
      fabChanged();
      return { ok: true, e };
    };
    /* Pose ou réoriente des tapis le long d’un tracé [{x, y, d}]. */
    E.fabDraw = function (path) {
      let n = 0;
      for (const p of path) {
        if (!inGrid(p.x, p.y) || isRes(p.x, p.y)) continue;
        const e = cellAt(p.x, p.y);
        if (!e) { S.fab.c[ck(p.x, p.y)] = { k: "belt", d: p.d }; n++; }
        else if (e.k === "belt" && e.d !== p.d) { e.d = p.d; n++; }
      }
      if (n) fabChanged();
      return n;
    };
    function refund(id) {
      const B = S.fab.ms[id];
      if (B) {
        for (const i in B.b) if (B.b[i] > 0) add(i, B.b[i]);
        const e = machById(id);
        if (e && B.o > 0 && item(outOf(e))) add(outOf(e), B.o);
      }
      delete S.fab.ms[id];
      delete machStat[id];
    }
    E.fabRotate = function (x, y) {
      const e = cellAt(x, y);
      if (!e || e.d === undefined) return null;
      e.d = (e.d + 1) % 4;
      if (e.k === "port" && intoRes(x, y, e.d)) e.d = (e.d + 1) % 4;
      fabChanged();
      return e;
    };
    E.fabRemove = function (x, y) {
      const e = cellAt(x, y);
      if (!e) return null;
      if (e.k === "mach" || e.k === "ext") refund(e.id);
      if (e.k === "site") { const B = S.fab.ms[e.id]; if (B) for (const i in B.b) if (B.b[i] > 0) add(i, B.b[i]); delete S.fab.ms[e.id]; }
      delete S.fab.c[ck(x, y)];
      fabChanged();
      return e;
    };
    /* Réglages d’une machine : recette, nombre, type, marche, stock visé. */
    E.fabSet = function (id, patch) {
      const e = machById(id);
      if (!e) return null;
      if (patch.r !== undefined && patch.r !== e.r && (patch.r === null || E.automatable(patch.r))) {
        refund(id);
        e.r = patch.r;
      }
      if (patch.m && patch.m !== e.m && item(patch.m) && item(patch.m).t === "mach") {
        const ms = E.machines();
        const free = ms[patch.m].own - ms[patch.m].used;
        if (free < 1) return e;
        e.m = patch.m;
        e.n = Math.min(e.n, free);
      }
      if (patch.n !== undefined) {
        const ms = E.machines();
        const max = ms[e.m].own - (ms[e.m].used - e.n);
        e.n = Math.max(1, Math.min(Math.floor(patch.n), max));
      }
      if (patch.on !== undefined) e.on = !!patch.on;
      if (patch.cap !== undefined) e.cap = Math.max(0, Math.floor(patch.cap) || 0);
      if (patch.d !== undefined) e.d = patch.d % 4;
      fabChanged();
      return e;
    };
    /* Annuler : l’usine revient à une copie antérieure. Les machines qui
     * disparaissent ou changent de recette rendent leur contenu au stock. */
    E.fabSnapshot = () => JSON.stringify(S.fab.c);
    E.fabRestore = function (snap) {
      let c;
      try { c = JSON.parse(snap); } catch (e) { return false; }
      if (!c || typeof c !== "object") return false;
      const was = {};
      for (const k in c) if (c[k].id) was[c[k].id] = outOf(c[k]);
      for (const k in S.fab.c) {
        const e = S.fab.c[k];
        if (e.id && (!(e.id in was) || was[e.id] !== outOf(e))) refund(e.id);
      }
      S.fab.c = c;
      const ms = E.machines(), us = E.extUnits();
      for (const k in c) {
        const e = c[k];
        if (e.k === "mach" && ms[e.m] && ms[e.m].used > ms[e.m].own) { ms[e.m].used -= e.n; delete c[k]; }
        if (e.k === "ext") for (const t in e.u) if (us[t] && us[t].used > us[t].own) { const x = Math.min(e.u[t], us[t].used - us[t].own); e.u[t] -= x; us[t].used -= x; if (!e.u[t]) delete e.u[t]; }
      }
      fabChanged();
      return true;
    };
    /* --- extracteurs sur les gisements */
    E.fabExtWhy = function (x, y, t) {
      const dep = depAt(x, y);
      if (!dep) return "nodep";
      if (!extRate(t, dep.res)) return "wrongext";
      const e = cellAt(x, y);
      if (e && e.k !== "ext") return "taken";
      const u = E.extUnits()[t];
      if (!u || u.own - u.used < 1) return "noext";
      return null;
    };
    /* pose n extracteurs du type t sur le gisement (x, y) ; crée l’exploitation au besoin */
    E.fabPlaceExt = function (x, y, t, n) {
      const why = E.fabExtWhy(x, y, t);
      if (why) return { ok: false, why };
      const dep = depAt(x, y), u = E.extUnits()[t];
      let e = cellAt(x, y), fresh = false;
      if (!e) { e = { k: "ext", id: "X" + ++S.fab.seq, res: dep.res, u: {}, d: 0, on: true }; S.fab.c[ck(x, y)] = e; fresh = true; }
      e.u[t] = (e.u[t] || 0) + Math.max(1, Math.min(u.own - u.used, Math.floor(n || 1)));
      fabChanged();
      return { ok: true, e, fresh };
    };
    /* nombre d’extracteurs d’un type dans une exploitation */
    E.fabSetExt = function (id, t, n) {
      const e = machById(id);
      if (!e || e.k !== "ext" || !extRate(t, e.res)) return null;
      const u = E.extUnits()[t], cur = e.u[t] || 0;
      const v = Math.max(0, Math.min(Math.floor(n), u ? u.own - u.used + cur : cur));
      if (v) e.u[t] = v; else delete e.u[t];
      fabChanged();
      return e;
    };
    /* Trace un tapis depuis ce qui est posé en (x, y) jusqu’à la Réserve, ou jusqu’à
     * un tapis qui y mène, et tourne la sortie vers lui. Évite les gisements. */
    E.fabLink = function (x, y) {
      const src = cellAt(x, y);
      if (!src || src.d === undefined || src.k === "belt") return { ok: false, why: "kind" };
      if (src.id) { const P = graph().prods[src.id]; if (P && P.t.res) return { ok: true, n: 0 }; }
      // combien de producteurs entrent déjà dans la Réserve par chaque case
      const g = graph(), users = {};
      for (const id in g.prods) g.prods[id].t.ents.forEach((en) => (users[en.k] = (users[en.k] || 0) + 1));
      const memo = {};
      const entryOf = (cx, cy, din) => {
        const k = cx + "," + cy + "," + din;
        if (!(k in memo)) { const t = trace(cx - DX[din], cy - DY[din], din, src.id || null); memo[k] = t.ents.length ? t.ents[0].k : null; }
        return memo[k];
      };
      /* entrer dans la Réserve ne coûte rien ; rejoindre un tapis qui y mène coûte
       * d’autant plus qu’il est chargé (un tapis ne porte qu’un certain débit) ; -1 : impossible */
      const joinCost = (cx, cy, d) => {
        if (isRes(cx, cy)) return 0;
        const e = cellAt(cx, cy);
        if (!e || e.k !== "belt" || e.d === (d + 2) % 4) return -1;
        const k = entryOf(cx, cy, d);
        return k === null ? -1 : 2 + 6 * (users[k] || 0);
      };
      // plus court chemin sur les cases libres (Dijkstra, petit tas binaire)
      const R = fabR(), dist = {}, prev = {}, heap = [];
      const pushH = (n) => {
        heap.push(n);
        for (let i = heap.length - 1; i > 0;) { const j = (i - 1) >> 1; if (heap[j].c <= heap[i].c) break; [heap[i], heap[j]] = [heap[j], heap[i]]; i = j; }
      };
      const popH = () => {
        const top = heap[0], last = heap.pop();
        if (heap.length) {
          heap[0] = last;
          for (let i = 0; ;) {
            const l = 2 * i + 1, r = l + 1;
            let m = i;
            if (l < heap.length && heap[l].c < heap[m].c) m = l;
            if (r < heap.length && heap[r].c < heap[m].c) m = r;
            if (m === i) break;
            [heap[i], heap[m]] = [heap[m], heap[i]]; i = m;
          }
        }
        return top;
      };
      const free = (cx, cy) => Math.abs(cx) <= R && Math.abs(cy) <= R && !isRes(cx, cy) && !cellAt(cx, cy);
      // les gisements restent libres, et le tour de la Réserve aussi (place des sorties)
      const cost = (cx, cy) => (DEPOSITS[ck(cx, cy)] ? 8 : touchesRes(cx, cy) ? 4 : 1);
      for (let d = 0; d < 4; d++) {
        const nx = x + DX[d], ny = y + DY[d], jc = joinCost(nx, ny, d);
        if (jc >= 0) pushH({ c: jc, end: { d0: d, direct: true } });
        if (!free(nx, ny)) continue;
        const k = ck(nx, ny), c0 = cost(nx, ny);
        if (dist[k] === undefined || c0 < dist[k]) { dist[k] = c0; prev[k] = { d0: d }; pushH({ x: nx, y: ny, c: c0 }); }
      }
      let end = null;
      while (heap.length) {
        const u = popH();
        if (u.end) { end = u.end; break; }
        const uk = ck(u.x, u.y);
        if (u.c > dist[uk]) continue;
        for (let d = 0; d < 4; d++) {
          const vx = u.x + DX[d], vy = u.y + DY[d], jc = joinCost(vx, vy, d);
          if (jc >= 0) pushH({ c: u.c + jc, end: { x: u.x, y: u.y, d } });
          if (!free(vx, vy)) continue;
          const vk = ck(vx, vy), c = u.c + cost(vx, vy);
          if (dist[vk] === undefined || c < dist[vk]) { dist[vk] = c; prev[vk] = { x: u.x, y: u.y, d }; pushH({ x: vx, y: vy, c }); }
        }
      }
      if (!end) return { ok: false, why: "nopath" };
      if (end.direct) { src.d = end.d0; fabChanged(); return { ok: true, n: 0 }; }
      const path = [{ x: end.x, y: end.y, d: end.d }];
      let k = ck(end.x, end.y);
      while (prev[k] && prev[k].x !== undefined) { const p = prev[k]; path.unshift({ x: p.x, y: p.y, d: p.d }); k = ck(p.x, p.y); }
      src.d = prev[k].d0;
      E.fabDraw(path);
      fabChanged();
      return { ok: true, n: path.length };
    };
    /* Pose un extracteur là où il manque le plus (et relie sa case si elle est
     * nouvelle). Sert au bot de simulation et à la mise à jour des anciennes parties. */
    E.fabAutoExt = function (t, noLink) {
      const it = item(t);
      if (!it || it.t !== "ext") return null;
      const spots = Object.keys(it.p).map((r) => {
        const k = DEP_AT[it.z] && DEP_AT[it.z][r];
        if (!k) return null;
        const i = k.indexOf(","), x = +k.slice(0, i), y = +k.slice(i + 1);
        if (E.fabExtWhy(x, y, t)) return null;
        const e = cellAt(x, y);
        return { x, y, r, have: e ? e.u[t] || 0 : 0, p: it.p[r] };
      }).filter(Boolean);
      if (!spots.length) return null;
      // viser ce que donneraient tous les extracteurs s’ils travaillaient partout,
      // en couvrant d’abord les matières qui ne sont pas encore extraites
      const target = {}, cur = {};
      EXTS.forEach((u) => { const n = Math.floor(count(u)); for (const r in item(u).p) target[r] = (target[r] || 0) + n * item(u).p[r]; });
      for (const k in S.fab.c) { const e = S.fab.c[k]; if (e.k === "ext") for (const u in e.u) cur[e.res] = (cur[e.res] || 0) + e.u[u] * extRate(u, e.res); }
      spots.forEach((sp) => {
        const d = (target[sp.r] || 0) - (cur[sp.r] || 0);
        sp.score = (cur[sp.r] ? 0 : 1000) + Math.abs(d) - Math.abs(d - extRate(t, sp.r));
      });
      spots.sort((a, b) => b.score - a.score);
      const sp = spots[0], res = E.fabPlaceExt(sp.x, sp.y, t, 1);
      if (res.ok && res.fresh && !noLink) E.fabLink(sp.x, sp.y);
      return res;
    };
    /* mise à jour d’une partie d’avant la v4 : tous les extracteurs sont posés puis reliés */
    function placeOldExtractors() {
      let placed = 0;
      const power = (t) => Object.values(item(t).p).reduce((a, b) => a + b, 0);
      EXTS.slice().sort((a, b) => power(b) - power(a)).forEach((t) => { const n = Math.floor(count(t)); for (let i = 0; i < n; i++) if (E.fabAutoExt(t, true)) placed++; });
      const list = Object.keys(S.fab.c).filter((k) => S.fab.c[k].k === "ext").map((k) => k.split(",").map(Number))
        .sort((a, b) => Math.abs(a[0]) + Math.abs(a[1]) - Math.abs(b[0]) - Math.abs(b[1]));
      let linked = 0;
      list.forEach(([x, y]) => { if (E.fabLink(x, y).ok) linked++; });
      S.flags.fab4 = { placed, sites: list.length, linked };
    }
    E.fabSetPort = function (x, y, f) {
      const e = cellAt(x, y);
      if (!e || e.k !== "port") return null;
      e.f = f && item(f) ? f : null;
      fabChanged();
      return e;
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

    /* Nouveau cycle : le Semeur suivant s’éveille. On garde le savoir. */
    E.newCycle = function () {
      const old = S;
      const n = freshState(now());
      n.known = old.known; n.hints = old.hints; n.frags = old.frags; n.secrets = old.secrets; n.studied = old.studied || {};
      n.seen = old.seen; n.meta = old.meta; n.settings = old.settings; n.pins = old.pins || {};
      n.fab.r = old.fab ? old.fab.r : FAB_R0;
      n.cycle = (old.cycle || 1) + 1;
      n.echoes = Object.values(old.meta.endings).reduce((a, b) => a + b, 0);
      n.intu = 3 + Math.floor(old.intu / 2);
      n.introSeen = true;
      n.stats = Object.assign({}, old.stats);
      if (old.meta.capsule) {
        n.flags.capsuleMsg = true;
        Object.assign(n.inv, { bois: 60, fibre: 60, caillou: 40, manche: 10, corde: 10 });
      }
      S = n;
      forgetFab();
      recalc();
      E.emit("cycle", n.cycle);
      E.emit("struct");
    };

    /* ------------------------------------------------------ temps */
    function step(dt, offline) {
      const c = E.cache();
      for (const r in c.rates) add(r, c.rates[r] * dt);
      runFab(dt);
      handStep(dt, offline);
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
      S.stats.play += dt;
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
      dt = Math.min(dt, OFFLINE_CAP);
      const before = Object.assign({}, S.inv);
      const chunk = dt > 600 ? 10 : 1;
      let left = dt;
      fabQuiet = true;
      while (left > 0) { const d = Math.min(chunk, left); step(d, true); left -= d; }
      fabQuiet = false;
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
    /* Usine d’une sauvegarde : ce qui est illisible est mis de côté, pas jeté. */
    function checkFab(o) {
      const f = o.fab && typeof o.fab === "object" ? o.fab : freshFab();
      if (typeof f.c !== "object" || !f.c) f.c = {};
      if (typeof f.ms !== "object" || !f.ms) f.ms = {};
      f.r = Math.max(FAB_R0, Math.min(40, Math.floor(f.r) || FAB_R0));
      f.seq = Math.floor(f.seq) || 0;
      const sitesSeen = {};
      for (const k in f.c) {
        const e = f.c[k], m = /^(-?\d+),(-?\d+)$/.exec(k);
        let ok = m && e && FAB_KINDS[e.k] && !isRes(+m[1], +m[2]);
        if (ok && e.k === "mach") {
          ok = !!(D.ITEMS[e.m] && D.ITEMS[e.m].t === "mach" && typeof e.id === "string");
          if (ok && e.r && !D.ITEMS[e.r]) e.r = null;
          if (ok) { e.n = Math.max(1, Math.floor(e.n) || 1); e.d = (e.d | 0) & 3; e.cap = Math.max(0, Math.floor(e.cap) || 0); e.on = e.on !== false; }
          const n = ok && +e.id.slice(1);
          if (n > f.seq) f.seq = n;
        }
        if (ok && e.k === "ext") {
          ok = typeof e.id === "string" && !!D.ITEMS[e.res] && !!e.u && typeof e.u === "object";
          if (ok) {
            for (const t in e.u) {
              const n = Math.max(0, Math.floor(e.u[t]) || 0);
              if (!D.ITEMS[t] || D.ITEMS[t].t !== "ext" || !extRate(t, e.res) || !n) delete e.u[t]; else e.u[t] = n;
            }
            e.d = (e.d | 0) & 3; e.on = e.on !== false;
            const n = +e.id.slice(1);
            if (n > f.seq) f.seq = n;
          }
        }
        if (ok && (e.k === "belt" || e.k === "port")) e.d = (e.d | 0) & 3;
        if (ok && e.k === "site") {
          ok = !!D.PROJECTS[e.p] && !sitesSeen[e.p];
          if (ok) { sitesSeen[e.p] = true; e.id = "S:" + e.p; }
        }
        if (ok && e.k === "port" && e.f && !D.ITEMS[e.f]) e.f = null;
        if (!ok) {
          o.orphans = o.orphans || {};
          (o.orphans.fab = o.orphans.fab || {})[k] = e;
          delete f.c[k];
        } else if (m) f.r = Math.max(f.r, Math.abs(+m[1]), Math.abs(+m[2]));
      }
      o.fab = f;
    }
    /* File des mains d’une sauvegarde : une fabrication illisible est annulée et
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
        j.i = Math.max(0, Math.min(j.s.length, Math.floor(j.i) || 0));
        j.k = Math.max(0, Math.floor(j.k) || 0);
        keep.push(j);
      });
      o.hand = { q: keep, p: keep.length ? Math.max(0, Number(h.p) || 0) : 0 };
      if (!o.studied || typeof o.studied !== "object") o.studied = {};
    }
    function parseSave(src) {
      const o = typeof src === "string" ? JSON.parse(src) : JSON.parse(JSON.stringify(src));
      if (!o || typeof o !== "object" || !o.inv || typeof o.inv !== "object") throw new Error("Ce n’est pas une sauvegarde d’Éclat.");
      migrate(o);
      const base = freshState(now());
      for (const k in base) if (o[k] === undefined || o[k] === null && k !== "track") o[k] = base[k];
      o.meta = Object.assign({ endings: {}, capsule: false }, o.meta);
      o.settings = Object.assign({ sound: true, vibe: true }, o.settings);
      o.exp = Object.assign({ active: null, done: {} }, o.exp);
      o.stats = Object.assign({ taps: 0, crafts: 0, tries: 0, play: 0 }, o.stats);
      o.gt = { id: o.gt && o.gt.id || null, p: (o.gt && o.gt.p) || 0 };
      if (!o.tried || typeof o.tried !== "object") o.tried = {};
      checkHand(o);
      checkFab(o);
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
      forgetFab();
      recalc();
      if (S.flags.fab4 === "todo") placeOldExtractors();
      E.emit("struct");
      return true;
    };
    E.reset = function () { S = freshState(now()); forgetFab(); recalc(); E.emit("struct"); };
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

  const API = { createEngine, freshState, migrate, SAVE_VERSION, DX, DY, RES };
  root.EclatEngine = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
