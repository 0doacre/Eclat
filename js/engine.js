/* ÉCLAT — moteur de jeu.
 * Aucune dépendance au DOM : le même code tourne dans le navigateur et dans les
 * scripts de validation / simulation (tools/).
 */
(function (root) {
  "use strict";
  const D = root.ECLAT_DATA || (typeof require !== "undefined" ? require("./data.js") : null);

  const BASE_GESTES = ["assembler", "tresser", "tailler"];
  const UNIQUE = { tool: 1, stat: 1, upg: 1, curio: 1 };
  const OFFLINE_CAP = 12 * 3600; // secondes
  const MASTERY = [10, 50, 250, 1000];
  const HINT_COST = [1, 1, 2];
  const SAVE_VERSION = 1;

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
  /* zone(s) d’origine de chaque ressource */
  const RES_ZONE = {};
  D.ZONES.forEach((z) => z.res.forEach((r) => (RES_ZONE[r] = RES_ZONE[r] || z.id)));

  function freshState(now) {
    return {
      v: SAVE_VERSION, t: now, start: now,
      inv: {}, seen: {}, made: {}, known: {}, hints: {},
      intu: 3, zones: { lisiere: true }, flags: {}, frags: {}, secrets: {},
      exp: { active: null, done: {} }, age: 0,
      auto: [], autoAcc: {}, proj: {}, endings: {},
      arche: [], term: [], notes: [],
      stats: { taps: 0, crafts: 0, tries: 0, play: 0 },
      cycle: 1, echoes: 0, meta: { endings: {}, capsule: false },
      settings: { sound: true, vibe: true },
      pipAcc: 0, intuAcc: 0, moon: 0, introSeen: false
    };
  }

  function createEngine(opts) {
    opts = opts || {};
    const now = opts.now || (() => Date.now());
    const rand = opts.rand || Math.random;
    const listeners = {};
    const E = { D, RECIPES, ZONES, RES_ZONE, keyOf };
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
    E.item = item; E.has = has; E.count = count; E.isUnique = isUnique;

    function add(id, n) {
      if (!n) return;
      S.inv[id] = (S.inv[id] || 0) + n;
      if (S.inv[id] < 1e-9) S.inv[id] = 0;
      if (n > 0 && !S.seen[id]) { S.seen[id] = true; E.emit("struct"); }
    }
    E.add = add;

    /* -------------------------------------------------- effets dérivés */
    function recalc() {
      const c = { st: {}, heat: 0, tap: {}, auto: {}, intu: 0, exp: 1, pip: 0, slots: 0, aspd: 1, rates: {}, sky: false, arche: false, term: false, signal: false };
      const mulInto = (dst, src) => { for (const k in src) dst[k] = (dst[k] || 1) * src[k]; };
      for (const id in S.inv) {
        if (!(S.inv[id] > 0)) continue;
        const it = item(id); if (!it) continue;
        const e = it.e;
        if (e && (isUnique(it) || it.t === "auto")) {
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
          if (e.slots) c.slots += e.slots * S.inv[id];
          if (e.sky) c.sky = true;
          if (e.arche) c.arche = true;
          if (e.term) c.term = true;
          if (e.signal) c.signal = true;
        }
      }
      c.heat = c.st.chauffer ? c.st.chauffer.heat || 0 : 0;
      if (S.flags.lucioles) c.auto["*"] = (c.auto["*"] || 1) * 1.25;
      c.echo = 1 + 0.5 * (S.echoes || 0);
      // production des extracteurs
      for (const id in S.inv) {
        const it = item(id);
        if (!it || it.t !== "ext" || !(S.inv[id] > 0)) continue;
        const m = (c.auto[it.z] || 1) * (c.auto["*"] || 1) * c.echo;
        for (const r in it.p) c.rates[r] = (c.rates[r] || 0) + it.p[r] * S.inv[id] * m;
      }
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
    E.rate = (res) => E.cache().rates[res] || 0;

    /* ------------------------------------------------------ coûts */
    function costFor(id, k) {
      const it = item(id), base = it.r[1];
      if (it.t !== "ext" && it.t !== "auto") return base;
      const f = Math.pow(it.s || 1.15, k);
      const out = {};
      for (const i in base) out[i] = Math.ceil(base[i] * f);
      return out;
    }
    /* coût total de `times` fabrications à partir de l’état courant */
    function totalCost(id, times) {
      const it = item(id), tot = {};
      if (it.t === "ext" || it.t === "auto") {
        const owned = count(id);
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
      if (it.t === "ext" || it.t === "auto") {
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
      // chefs-d’œuvre : chance de lot bonus selon la maîtrise
      let bonus = 0;
      if (it.t === "comp" || it.t === "res") {
        const ch = 0.04 * E.stars(id);
        if (ch > 0) {
          if (times <= 200) for (let k = 0; k < times; k++) { if (rand() < ch) bonus++; }
          else bonus = Math.floor(times * ch + rand());
        }
      }
      const out = it.r[2] * (times + bonus);
      const first = !(S.made[id] > 0);
      S.made[id] = (S.made[id] || 0) + times;
      S.stats.crafts += times;
      add(id, out);
      if (!S.known[id]) learn(id, true);
      if (first) onFirstCraft(id);
      if (isUnique(it) || it.t === "ext" || it.t === "auto") { recalc(); E.emit("struct"); }
      if (!quiet) E.emit("crafted", id, { n: out, bonus: bonus * it.r[2], first });
      return { ok: true, n: out, bonus: bonus * it.r[2], first };
    }
    E.craft = craft;

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
        const it = item(id);
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
        const wasKnown = !!S.known[id];
        if (!wasKnown) learn(id);
        const res = craft(id, 1, true);
        E.emit("crafted", id, res);
        return Object.assign({ kind: "craft", id, fresh: !wasKnown }, res);
      }
      const t = temperature(g, ids);
      const pool = D.FAIL[g] || D.FAIL.assembler;
      const names = ids.map((i) => item(i).n.toLowerCase());
      const x = names.length > 1 ? names.slice(0, -1).join(", ") + " et " + names[names.length - 1] : names[0];
      const flav = pool[Math.floor(rand() * pool.length)].replace(/\{x\}/g, x);
      return { kind: "fail", temp: t.temp, why: t.why, msg: flav.charAt(0).toUpperCase() + flav.slice(1) };
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

    /* ------------------------------------------------------ indices */
    E.hintCost = (id) => HINT_COST[S.hints[id] || 0] || 0;
    E.revealHint = function (id) {
      const lvl = S.hints[id] || 0;
      if (S.known[id] || lvl >= 3) return false;
      const cost = HINT_COST[lvl];
      if (S.intu < cost) return false;
      S.intu -= cost;
      S.hints[id] = lvl + 1;
      if (lvl + 1 >= 3) learn(id, true);
      E.emit("struct");
      return true;
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

    E.objective = function () {
      for (const [id, txt] of D.OBJECTIVES) if (!(S.made[id] > 0)) return { id, txt };
      return null;
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

    /* ------------------------------------------------------ automatisation */
    E.slots = () => E.cache().slots;
    E.toggleAuto = function (id) {
      const i = S.auto.indexOf(id);
      if (i >= 0) { S.auto.splice(i, 1); E.emit("struct"); return false; }
      const it = item(id);
      if (!it || !it.r || isUnique(it) || it.t === "auto" || !S.known[id]) return false;
      if (S.auto.length >= E.slots()) return false;
      S.auto.push(id);
      E.emit("struct");
      return true;
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
      n.known = old.known; n.hints = old.hints; n.frags = old.frags; n.secrets = old.secrets;
      n.seen = old.seen; n.meta = old.meta; n.settings = old.settings;
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
      recalc();
      E.emit("cycle", n.cycle);
      E.emit("struct");
    };

    /* ------------------------------------------------------ temps */
    function step(dt, offline) {
      const c = E.cache();
      for (const r in c.rates) add(r, c.rates[r] * dt);
      if (S.auto.length) {
        for (const id of S.auto.slice()) {
          S.autoAcc[id] = (S.autoAcc[id] || 0) + c.aspd * dt;
          const want = Math.floor(S.autoAcc[id]);
          if (want <= 0) continue;
          S.autoAcc[id] -= want;
          const n = Math.min(want, maxCraftable(id, want));
          if (n > 0) craft(id, n, true);
        }
      }
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

    /* Avance le temps jusqu’à maintenant. Gère aussi le hors-ligne. */
    E.update = function () {
      const t = now();
      let dt = (t - S.t) / 1000;
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
    E.load = function (str) {
      const o = typeof str === "string" ? JSON.parse(str) : str;
      if (!o || typeof o !== "object" || !o.inv) throw new Error("Sauvegarde invalide");
      const base = freshState(now());
      for (const k in base) if (o[k] === undefined) o[k] = base[k];
      o.meta = Object.assign({ endings: {}, capsule: false }, o.meta);
      o.settings = Object.assign({ sound: true, vibe: true }, o.settings);
      S = o;
      recalc();
      E.emit("struct");
      return true;
    };
    E.reset = function () { S = freshState(now()); recalc(); E.emit("struct"); };
    E.exportSave = () => {
      const s = E.serialize();
      return typeof btoa !== "undefined" ? btoa(unescape(encodeURIComponent(s))) : Buffer.from(s, "utf8").toString("base64");
    };
    E.importSave = (b64) => {
      const s = typeof atob !== "undefined" ? decodeURIComponent(escape(atob(b64.trim()))) : Buffer.from(b64.trim(), "base64").toString("utf8");
      return E.load(s);
    };

    recalc();
    return E;
  }

  const API = { createEngine, freshState };
  root.EclatEngine = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
