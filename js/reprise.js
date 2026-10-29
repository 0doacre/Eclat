/* Le plan mémorise des installations, jamais des ressources ni des commandes.
 * Un devis isolé simule les prix du moteur ; seule sa validation dépense. */
(function (root) {
  "use strict";
  const LIMIT = 24;
  const natural = n => Number.isFinite(n) ? Math.max(0, Math.min(100000, Math.floor(n))) : 0;
  function attach(E, createEngine) {
    const D = E.D, state = () => E.state;
    function rows() {
      if (!state().meta.reprise && state().cycle > 1 && Object.keys(E.ruins()).length) {
        const inferred = [];
        for (const [id, n] of Object.entries(E.ruins())) {
          const it = D.ITEMS[id]; if (!it) continue;
          if (it.t === "ext") {
            const z = D.ZONES.find(z => !z.secret && E.zoneDeps(z.id).some(d => E.extOk(id, z.id, d.res)));
            if (z) inferred.push({ id, n, z: z.id, res: E.zoneDeps(z.id).find(d => E.extOk(id, z.id, d.res)).res });
          } else if (["auto", "mach", "stat"].includes(it.t)) inferred.push({ id, n });
        }
        state().meta.reprise = { inferred: true, cycle: state().cycle - 1, depth: 0, rows: inferred, objectifs: [] };
      }
      const p = state().meta.reprise;
      if (!p || !Array.isArray(p.rows)) return [];
      const seen = new Set();
      return p.rows.slice(0, 128).filter(r => {
        if (!r || !D.ITEMS[r.id] || !D.ITEMS[r.id].r || !natural(r.n)) return false;
        if (r.z && (!E.ZONES[r.z] || E.ZONES[r.z].secret || !E.zoneDeps(r.z).some(d => d.res === r.res) || !E.extOk(r.id, r.z, r.res))) return false;
        if (!r.z && !["tool", "stat", "upg", "auto", "mach"].includes(D.ITEMS[r.id].t)) return false;
        const key = r.id + ":" + (r.z || "") + ":" + (r.res || "");
        if (seen.has(key)) return false;
        seen.add(key); return true;
      }).map(r => ({ id: r.id, n: natural(r.n), z: r.z || null, res: r.res || null, selected: r.selected !== false }));
    }
    function snapshot() {
      const s = state(), list = [];
      for (const e of Object.values(s.dom.ext)) if (E.ZONES[e.z] && !E.ZONES[e.z].secret) {
        for (const [id, n] of Object.entries(e.u)) if (natural(n)) list.push({ id, n: natural(n), z: e.z, res: e.res });
      }
      for (const [id, it] of Object.entries(D.ITEMS)) if (it.r && !it.sec && !it.path && ["tool", "stat", "upg", "auto", "mach"].includes(it.t) && E.count(id) > 0) {
        list.push({ id, n: E.isUnique(it) ? 1 : natural(E.count(id)) });
      }
      const previous = s.meta.reprise;
      // Une relève courte ne remplace pas un plan plus avancé.
      const depth = D.ZONES.filter(z => !z.secret && E.zoneOpen(z.id)).length;
      if (!previous || depth >= (previous.depth || 0)) s.meta.reprise = {
        cycle: s.cycle, depth, rows: list.slice(0, 128),
        objectifs: E.milestones().flat().filter(m => m.done && m.ob.k === "craft").map(m => m.ob.id)
      };
    }
    const newCycle = E.newCycle;
    E.newCycle = function () { if (E.canReleve()) snapshot(); return newCycle(); };
    E.repriseRows = rows;
    E.repriseSelect = (i, value) => {
      const clean = rows(); if (!clean[i]) return;
      clean[i].selected = !!value; state().meta.reprise.rows = clean;
    };
    function placed(r) { const e = E.domExt(r.z, r.res); return e && e.u[r.id] || 0; }
    function pending(r) {
      if (!r.z) return E.queued(r.id);
      // Un exemplaire déjà commandé, même sans destination, doit d'abord arriver.
      // Cette prudence évite de réserver deux fois les mêmes extracteurs.
      return E.queued(r.id);
    }
    function remaining(r) { return Math.max(0, r.n - (r.z ? placed(r) : E.count(r.id)) - pending(r)); }
    // Garder la référence et ses indices stables pour les devis et les relèves suivantes.
    // Seule la vue de travail se raccourcit ; une commande reste visible jusqu'à sa livraison.
    E.reprisePending = () => rows().map((r, i) => ({ ...r, i,
      left: Math.max(0, r.n - (r.z ? placed(r) : E.count(r.id)))
    })).filter(r => r.left > 0);
    E.repriseStatus = r => {
      if (r.z && !E.zoneOpen(r.z)) return "Terre à rouvrir";
      if (!remaining(r)) return (r.z ? placed(r) : E.count(r.id)) >= r.n ? "Reconstitué" : "Commandes en cours";
      if (r.z && E.freeExt(r.id) > 0) return "Prêt à poser";
      if (E.ruins()[r.id]) return "Ruine à réparer";
      if (!state().known[r.id]) return "Recette à retrouver";
      return "À reconstruire";
    };
    function candidate(r) {
      if (!r.selected || r.z && !E.zoneOpen(r.z) || !remaining(r)) return null;
      if (r.z && E.freeExt(r.id) > 0) return { kind: "place", cost: {} };
      if (E.ruins()[r.id]) {
        const rep = E.ruinResolve ? E.ruinResolve(r.id) : null;
        if (rep && rep.ok) return { kind: "repair", cost: rep.cost };
        if (Object.entries(E.ruinCost(r.id)).every(([id, n]) => E.count(id) >= n)) return { kind: "repair", cost: E.ruinCost(r.id) };
        return null;
      }
      if (!state().known[r.id] || E.blocker(r.id)) return null;
      const p = E.plan(r.id, 1);
      return p.ok ? { kind: "order", cost: p.used } : null;
    }
    function perform(r, kind) {
      if (kind === "place") { const before = placed(r); E.domExtSet(r.z, r.res, r.id, before + 1); return placed(r) > before; }
      if (kind === "order") return E.order(r.id, 1, r.z ? "x:" + r.z + ":" + r.res : undefined).ok;
      const before = r.z ? Object.fromEntries(Object.entries(state().dom.ext).map(([k, e]) => [k, e.u[r.id] || 0])) : {};
      if (!E.repair(r.id).ok) return false;
      if (r.z) {
        // Réorienter seulement l'exemplaire que repair vient de poser automatiquement.
        for (const [k, e] of Object.entries(state().dom.ext)) if ((e.u[r.id] || 0) > (before[k] || 0) && (e.z !== r.z || e.res !== r.res)) E.domExtSet(e.z, e.res, r.id, (e.u[r.id] || 0) - 1);
        if (E.freeExt(r.id) > 0) E.domExtSet(r.z, r.res, r.id, placed(r) + 1);
      }
      return true;
    }
    E.repriseQuote = () => {
      const clone = createEngine({ now: () => state().t, rand: () => .99 });
      clone.load(E.serialize());
      const quote = { cycle: state().cycle, plan: JSON.stringify(rows()), actions: [], cost: {} };
      // Quelques passages suffisent ; pas d'attente ni de fabrication instantanée.
      for (let pass = 0; pass < LIMIT; pass++) {
        let progress = false;
        for (const [i, r] of clone.repriseRows().entries()) {
          if (quote.actions.length >= LIMIT) break;
          const a = clone.repriseCandidate(r);
          if (!a || !clone.reprisePerform(r, a.kind)) continue;
          quote.actions.push({ i, kind: a.kind, cost: { ...a.cost } });
          for (const [id, n] of Object.entries(a.cost)) quote.cost[id] = (quote.cost[id] || 0) + n;
          progress = true;
        }
        if (!progress || quote.actions.length >= LIMIT) break;
      }
      return quote;
    };
    // Les primitives restent communes au devis et à sa validation.
    E.repriseCandidate = candidate; E.reprisePerform = perform;
    E.repriseApply = quote => {
      if (!quote || quote.cycle !== state().cycle || quote.plan !== JSON.stringify(rows())) return { ok: false, applied: 0 };
      let applied = 0;
      for (const a of quote.actions.slice(0, LIMIT)) {
        const r = rows()[a.i], current = r && candidate(r);
        if (!current || current.kind !== a.kind || Object.entries(current.cost).some(([id, n]) => n > (a.cost[id] || 0))) continue;
        if (perform(r, a.kind)) applied++;
      }
      return { ok: true, applied, skipped: quote.actions.length - applied };
    };
    E.repriseGoal = g => {
      const p = state().meta.reprise;
      if (!g || state().track || !p || !Array.isArray(p.objectifs) || g.ob.k !== "craft" || !state().known[g.ob.id] || !p.objectifs.includes(g.ob.id)) return null;
      const z = E.recetteTerre(g.ob.id);
      const steps = (E.milestones()[state().age] || []).filter(m => m.ob.k === "craft" && p.objectifs.includes(m.ob.id) && E.recetteTerre(m.ob.id) === z);
      if (steps.length < 2) return null;
      return { n: z ? E.ZONES[z].n : "l’atelier", steps, done: steps.filter(m => m.done).length };
    };
  }
  const API = { attach };
  root.EclatReprise = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
