/* ÉCLAT — la Roue : fabriquer d’où l’on est.
 * Un menu circulaire. Premier tour : les familles de recettes connues. Dans une
 * famille, ses recettes en anneau (celles qu’on peut faire tout de suite d’abord)
 * et, au centre, celle qu’on a choisie. Tout part dans la file de « Tes mains » ;
 * une machine ou un extracteur prêts se posent ensuite dans le Domaine. */
(function () {
  "use strict";

  function create(api) {
    const { E, A, D, esc, fmt, fmtNum, fmtTime, icon, toast, goto, floater, vibe, elCenter, norm, gesteChip, fxText, openTree, onPlace } = api;
    const I = D.ITEMS;
    const S = () => E.state;
    const PER = 10; // recettes par tour de roue
    const CATS = [
      { k: "fav", ic: "★", n: "Raccourcis" },
      { k: "mach", ic: "⚙️", n: "Machines", t: { mach: 1 } },
      { k: "ext", ic: "⛏️", n: "Extracteurs", t: { ext: 1 } },
      { k: "stat", ic: "🏛️", n: "Stations", t: { stat: 1 } },
      { k: "tool", ic: "🔧", n: "Outils", t: { tool: 1, upg: 1 } },
      { k: "comp", ic: "🧩", n: "Pièces", t: { comp: 1, res: 1 } },
      { k: "curio", ic: "🗝️", n: "Curiosités", t: { curio: 1, relic: 1 } },
      { k: "hand", ic: "✋", n: "Tes mains" }
    ];
    const W = { el: null, open: false, cat: null, page: 0, sel: null, job: null, q: "", only: null, title: "", list: [], sig: "", order: null };

    /* ------------------------------------------------------------ les recettes */
    const owned = (id) => E.isUnique(I[id]) && S().made[id] > 0;
    const known = () => Object.keys(S().known).filter((id) => I[id] && I[id].r && !owned(id));
    function favIds() {
      const st = S(), out = [];
      const g = E.guide();
      if (g && g.step && st.known[g.step]) out.push(g.step);
      if (st.track && st.known[st.track.id]) out.push(st.track.id);
      Object.keys(st.pins).forEach((id) => out.push(id));
      return out.filter((id, i) => I[id] && I[id].r && !owned(id) && out.indexOf(id) === i);
    }
    /* 0 : faisable tout de suite ; 1 : faisable en chaîne ; 2 : pas encore */
    const rank = (id) => (E.maxCraftable(id, 1) > 0 ? 0 : E.plan(id, 1).ok ? 1 : 2);
    function itemsOf() {
      let ids;
      if (W.q) { const q = norm(W.q); ids = known().filter((id) => norm(I[id].n).includes(q)); }
      else if (W.only) ids = W.only.filter((id) => S().known[id] && !owned(id));
      else if (W.cat === "fav") return favIds();
      else { const c = CATS.find((x) => x.k === W.cat); ids = c && c.t ? known().filter((id) => c.t[I[id].t]) : []; }
      // l’ordre est fixé à l’arrivée dans la famille : une recette ne change pas de place
      // parce qu’on vient d’en fabriquer (les nouvelles s’ajoutent à la fin)
      const key = (W.q ? "q:" + W.q : W.only ? "only:" + W.only.join() : "cat:" + W.cat);
      if (!W.order || W.order.key !== key) {
        const r = {};
        ids.forEach((id) => (r[id] = rank(id)));
        W.order = { key, ids: ids.slice().sort((a, b) => r[a] - r[b] || I[b].a - I[a].a || I[a].n.localeCompare(I[b].n)) };
      } else ids.forEach((id) => { if (!W.order.ids.includes(id)) W.order.ids.push(id); });
      return W.order.ids.filter((id) => ids.includes(id));
    }
    function catCount(c) {
      if (c.k === "hand") return S().hand.q.length;
      if (c.k === "fav") return favIds().length;
      return known().filter((id) => c.t[I[id].t]).length;
    }
    const inRing = () => W.q || W.only || (W.cat && W.cat !== "hand");

    /* ------------------------------------------------------------ dessin */
    function ring(list, fn) {
      const n = list.length;
      return list.map((x, i) => '<div class="rw-slot" style="--a:' + (-90 + (360 * i) / n).toFixed(2) + "deg;--i:" + i + '">' + fn(x, i) + "</div>").join("");
    }
    function hubHTML() {
      const hi = E.handInfo();
      if (W.sel) {
        const it = I[W.sel];
        return icon(W.sel, "lg") + '<span class="rw-hn">' + (E.isUnique(it) ? "" : '<span data-rc="' + W.sel + '">' + fmt(S().inv[W.sel] || 0) + "</span> en stock") + "</span>";
      }
      if (W.cat === "hand" || (!inRing() && !W.cat)) {
        return '<span class="rw-hi">✋</span><span class="rw-hn" data-rh>' + (hi.jobs.length ? hi.jobs.length + " en cours · " + fmtTime(hi.left) : "Tes mains sont libres") + "</span>";
      }
      const c = CATS.find((x) => x.k === W.cat);
      const pages = Math.ceil(W.list.length / PER);
      return '<span class="rw-hi">' + (W.q ? "🔍" : c ? c.ic : "🛠️") + '</span><span class="rw-hn">' + (pages > 1 ? W.page + 1 + " / " + pages : W.list.length + " recette" + (W.list.length > 1 ? "s" : "")) + "</span>";
    }
    function wheelHTML() {
      if (inRing()) W.list = itemsOf();
      let h = '<button class="rw-hub" data-r="hub" aria-label="Retour">' + hubHTML() + "</button>";
      if (inRing()) {
        const pages = Math.max(1, Math.ceil(W.list.length / PER));
        if (W.page >= pages) W.page = pages - 1;
        const vis = W.list.slice(W.page * PER, W.page * PER + PER);
        if (!vis.length) h += '<p class="rw-empty">' + (W.q ? "Aucune recette connue ne correspond." : W.cat === "fav" ? "Épingle des recettes (☆) pour les retrouver ici." : "Rien ici pour l’instant.") + "</p>";
        h += ring(vis, (id) => {
          const r = rank(id);
          const have = S().inv[id] || 0;
          return '<button class="rw-it ' + (r === 0 ? "ok" : r === 1 ? "chain" : "no") + (W.sel === id ? " on" : "") + '" data-r="it" data-id="' + id + '" aria-label="' + esc(I[id].n) + '">' + icon(id) +
            (E.isUnique(I[id]) || have < 1 ? "" : '<i class="b" data-rc="' + id + '">' + fmt(have) + "</i>") + '<span class="rw-in">' + esc(I[id].n) + "</span></button>";
        });
        if (pages > 1) h += '<button class="rw-pg l" data-r="pg" data-d="-1" aria-label="Précédentes">‹</button><button class="rw-pg r" data-r="pg" data-d="1" aria-label="Suivantes">›</button>';
      } else if (W.cat === "hand") {
        const jobs = E.handInfo().jobs;
        if (!jobs.length) h += '<p class="rw-empty">Rien en cours. Choisis une recette pour t’y mettre.</p>';
        h += ring(jobs, (j, i) => '<button class="rw-it job' + (W.job === i ? " on" : "") + (i ? "" : " cur") + '" data-r="job" data-i="' + i + '" aria-label="' + esc(I[j.id].n) + '">' + icon(j.id) +
          '<svg class="rw-pr" viewBox="0 0 36 36"><circle cx="18" cy="18" r="16" pathLength="100" stroke-dasharray="' + (i ? 0 : (100 * (1 - j.left / j.tot)).toFixed(1)) + ' 100" data-jp="' + i + '"/></svg>' +
          (E.isUnique(I[j.id]) ? "" : '<i class="b">×' + fmt(j.n) + "</i>") + '<span class="rw-in">' + esc(I[j.id].n) + "</span></button>");
      } else {
        const cats = CATS.filter((c) => catCount(c) > 0 || c.k === "fav");
        h += ring(cats, (c) => '<button class="rw-it rw-cat" data-r="cat" data-k="' + c.k + '" aria-label="' + c.n + '"><span class="rw-ci">' + c.ic + '</span><span class="rw-cn">' + c.n + '</span><i class="b">' + catCount(c) + "</i></button>");
      }
      return h;
    }
    function costHTML(id) {
      const cost = E.costFor(id);
      return Object.keys(cost).map((k) => {
        const have = S().inv[k] || 0;
        return '<span class="rw-ing' + (have + 1e-9 < cost[k] ? " lack" : "") + '" data-r="info" data-id="' + k + '">' + icon(k, "sm") + "<i>" + fmt(cost[k]) + ' <small data-rn="' + k + '" data-q="' + cost[k] + '">(' + fmt(have) + ")</small></i></span>";
      }).join("");
    }
    function detailHTML() {
      const st = S();
      if (W.cat === "hand" && W.job !== null) {
        const j = E.handInfo().jobs[W.job];
        if (!j) { W.job = null; return detailHTML(); }
        const it = I[j.id];
        return '<div class="rw-dh">' + icon(j.id, "sm") + "<b>" + esc(it.n) + "</b>" + (E.isUnique(it) ? "" : " ×" + fmt(j.n)) + "</div>" +
          '<p class="tiny muted" data-rj>' + jobLine(j) + '</p><div class="rw-acts"><button class="btn small" data-r="cancel">✕ Annuler</button><span class="tiny muted">Les matières reviennent dans ta Réserve.</span></div>';
      }
      if (!W.sel) {
        if (W.cat === "hand") return '<p class="tiny muted">Touche une fabrication pour la voir ou l’annuler. Elles se font l’une après l’autre, même jeu fermé.</p>';
        if (inRing()) return '<p class="tiny muted">Touche une recette. Bordure verte : tout est là. Pointillés : faisable, tes mains feront d’abord ses pièces.</p>';
        return '<p class="tiny muted">Choisis une famille de recettes. Au centre, ta file ✋ ; en haut, la recherche.</p>';
      }
      const id = W.sel, it = I[id], b = E.blocker(id);
      let h = '<div class="rw-dh">' + icon(id, "sm") + "<b>" + esc(it.n) + "</b>" + '<span class="grow"></span>' +
        '<button class="rw-mini' + (st.pins[id] ? " on" : "") + '" data-r="pin" aria-label="Épingler">' + (st.pins[id] ? "★" : "☆") + '</button><button class="rw-mini" data-r="info" data-id="' + id + '" aria-label="Fiche">ⓘ</button></div>';
      if (fxText(id)) h += '<p class="tiny rw-fx">' + esc(fxText(id)) + "</p>";
      h += '<div class="rw-cost">' + gesteChip(id) + costHTML(id) + "</div>";
      if (b && b.why !== "owned") {
        h += '<p class="why">' + (b.why === "heat" ? "Il faut une chaleur de " + fmtNum(b.heat) + " °C." : b.why === "lvl" ? "Il faut une station plus solide." : "Tu ne maîtrises pas encore ce geste.") + "</p>";
        return h;
      }
      const t = E.handTime(id);
      h += '<div class="rw-acts">';
      if (E.isUnique(it)) h += '<button class="btn small pri" data-r="q" data-n="1">Fabriquer</button>';
      else h += '<button class="btn small pri" data-r="q" data-n="1">' + (E.isScaled(it) ? "Fabriquer" : "×1") + '</button><button class="btn small" data-r="q" data-n="10">×10</button><button class="btn small" data-r="q" data-n="max">Max</button>';
      if (it.t === "mach" || it.t === "ext") h += '<button class="btn small" data-r="place">📍 Poser <span data-rf></span></button>';
      h += "</div>" + '<p class="tiny muted rw-t">✋ ' + fmtTime(t) + " la pièce" + (E.isUnique(it) || E.isScaled(it) ? "" : ", plus vite en série") + '<span class="rw-miss" data-rmiss></span></p>';
      return h;
    }
    const jobLine = (j) => (j.wait ? "Il manque des matières : elles sont parties ailleurs." : j.steps > 1 ? "Étape " + (j.i + 1) + "/" + j.steps + " : " + esc(I[j.step].n) + " " + fmt(j.k) + "/" + fmt(j.of) : fmt(j.k) + "/" + fmt(j.of)) +
      " · prêt dans " + fmtTime(j.at);
    function titleText() {
      if (W.title && !W.q) return W.title;
      if (W.q) return "Recherche";
      const c = CATS.find((x) => x.k === W.cat);
      return c ? c.n : "Fabriquer";
    }
    function render() {
      if (!W.el) return;
      W.el.querySelector(".rw-title").textContent = titleText();
      W.el.querySelector(".rw-wheel").innerHTML = wheelHTML();
      W.el.querySelector(".rw-detail").innerHTML = detailHTML();
      W.sig = sig();
      live();
    }
    // on ne redessine que si la file ou le savoir changent ; le reste bouge en place (live)
    const sig = () => S().hand.q.map((j) => j.id + ":" + j.s.length).join("|") + "#" + Object.keys(S().known).length;

    /* ce qui bouge sans tout redessiner : stocks, boutons, file */
    function live() {
      if (!W.open || !W.el) return;
      const st = S(), hi = E.handInfo();
      W.el.querySelectorAll("[data-rc]").forEach((el) => (el.textContent = fmt(st.inv[el.dataset.rc] || 0)));
      W.el.querySelectorAll('.rw-it[data-r="it"]').forEach((el) => el.classList.toggle("ok", E.maxCraftable(el.dataset.id, 1) > 0));
      W.el.querySelectorAll("[data-rn]").forEach((el) => {
        const have = st.inv[el.dataset.rn] || 0, q = Number(el.dataset.q);
        el.textContent = "(" + fmt(have) + ")";
        el.closest(".rw-ing").classList.toggle("lack", have + 1e-9 < q);
      });
      const rh = W.el.querySelector("[data-rh]");
      if (rh) rh.textContent = hi.jobs.length ? hi.jobs.length + " en cours · " + fmtTime(hi.left) : "Tes mains sont libres";
      const rj = W.el.querySelector("[data-rj]"), jj = W.job !== null && hi.jobs[W.job];
      if (rj && jj) rj.innerHTML = jobLine(jj);
      W.el.querySelectorAll("[data-jp]").forEach((c) => { const j = hi.jobs[+c.dataset.jp]; if (j && +c.dataset.jp === 0) c.setAttribute("stroke-dasharray", (100 * (1 - j.left / j.tot)).toFixed(1) + " 100"); });
      if (W.sel) {
        // les boutons fabriquent aussi les pièces qui manquent
        const id = W.sel, max = E.maxPlan(id), direct = E.maxCraftable(id, 1) >= 1;
        W.el.querySelectorAll('[data-r="q"]').forEach((b) => {
          const n = b.dataset.n;
          b.disabled = hi.full || (n === "max" ? max < 1 : n === "1" ? max < 1 : !E.plan(id, Number(n)).ok);
          if (n === "max") b.textContent = "Max" + (max > 1 ? " (" + fmt(max) + ")" : "");
        });
        // un bouton grisé dit pourquoi
        const ms = W.el.querySelector("[data-rmiss]");
        if (ms) ms.textContent = E.queued(id) > 0 ? " · en route dans tes mains" : hi.full ? " · tes mains sont pleines" : direct ? "" : max >= 1 ? " · tes mains feront d’abord les pièces" : " · il manque ce qui est en rouge";
        const pl = W.el.querySelector('[data-r="place"]');
        if (pl) {
          const free = freeOf(id);
          pl.disabled = free < 1;
          pl.querySelector("[data-rf]").textContent = free > 0 ? "(" + free + ")" : "";
        }
      }
    }
    function freeOf(id) {
      const it = I[id];
      if (it.t === "mach") { const m = E.machines()[id]; return m ? m.own - m.used : 0; }
      if (it.t === "ext") { const u = E.extUnits()[id]; return u ? u.own - u.used : 0; }
      return 0;
    }

    /* ------------------------------------------------------------ actions */
    function queue(btn, n, chain) {
      const id = W.sel;
      if (n === "max") n = E.maxPlan(id);
      if (!(n >= 1)) return;
      A.init();
      const r = E.queue(id, n, chain);
      if (!r.ok) {
        if (r.why === "plan") { openTree(id, n); return; }
        A.fail && A.fail(0);
        toast(r.why === "full" ? "Tes mains sont occupées : " + D.HAND.max + " fabrications en attente, c’est le maximum." : r.why === "queued" ? esc(I[id].n) + " : c’est déjà en route." : "Il manque des matières.");
        return;
      }
      A.click();
      vibe(10);
      const p = elCenter(btn);
      floater("✋ " + fmtTime(r.time), p.x, p.y - 16, "var(--muted)");
      render();
    }
    function onClick(ev) {
      const t = ev.target;
      if (t === W.el) { close(); return; } // le fond
      const b = t.closest("[data-r]");
      if (!b) return;
      const r = b.dataset.r;
      if (r === "close") close();
      else if (r === "hub") {
        A.click();
        if (W.sel) W.sel = null;
        else if (W.job !== null) W.job = null;
        else if (W.q) { W.q = ""; W.el.querySelector("#rwq").value = ""; }
        else if (W.only) { W.only = null; W.title = ""; W.cat = null; }
        else if (W.cat) W.cat = null;
        else W.cat = "hand";
        W.page = 0;
        render();
      } else if (r === "cat") { A.click(); W.cat = b.dataset.k; W.page = 0; W.sel = null; W.job = null; render(); }
      else if (r === "it") { A.click(); W.sel = W.sel === b.dataset.id ? null : b.dataset.id; render(); }
      else if (r === "job") { A.click(); W.job = W.job === +b.dataset.i ? null : +b.dataset.i; render(); }
      else if (r === "pg") {
        const pages = Math.ceil(W.list.length / PER);
        W.page = (W.page + Number(b.dataset.d) + pages) % pages;
        A.page ? A.page() : A.click();
        render();
      } else if (r === "q") queue(b, b.dataset.n === "max" ? "max" : Number(b.dataset.n), true);
      else if (r === "pin") { E.togglePin(W.sel); A.click(); render(); }
      else if (r === "info") goto(b.dataset.id);
      else if (r === "place") { const id = W.sel; close(); onPlace(I[id].t, id); }
      else if (r === "cancel") {
        const j = S().hand.q[W.job];
        if (j && E.cancelJob(W.job)) { A.click(); toast("Annulé : " + esc(I[j.id].n) + ". Les matières sont revenues dans ta Réserve."); }
        W.job = null;
        render();
      }
    }

    /* ------------------------------------------------------------ ouverture */
    function mount() {
      if (W.el) return;
      W.el = document.createElement("div");
      W.el.className = "roue hidden";
      W.el.setAttribute("role", "dialog");
      W.el.setAttribute("aria-label", "Fabriquer");
      W.el.innerHTML = '<div class="rw-top"><input id="rwq" type="search" placeholder="Chercher une recette connue…" autocomplete="off" spellcheck="false"><button class="rw-x" data-r="close" aria-label="Fermer">✕</button></div>' +
        '<div class="rw-title"></div><div class="rw-wheel"></div><div class="rw-detail"></div>';
      document.body.appendChild(W.el);
      W.el.addEventListener("click", onClick);
      W.el.querySelector("#rwq").addEventListener("input", (ev) => { W.q = ev.target.value.trim(); W.page = 0; W.sel = null; render(); });
      document.addEventListener("keydown", (ev) => { if (ev.key === "Escape" && W.open && !document.querySelector(".modal:not(.hidden)")) close(); });
    }
    /* o : { cat, only: [ids], title, sel } */
    function open(o) {
      o = o || {};
      mount();
      Object.assign(W, { open: true, cat: o.cat || null, only: o.only || null, title: o.title || "", sel: o.sel || null, job: null, page: 0, q: "", order: null });
      W.el.querySelector("#rwq").value = "";
      W.el.classList.remove("hidden");
      A.page ? A.page() : A.click();
      render();
    }
    function close() {
      if (!W.open) return;
      W.open = false;
      W.el.classList.add("hidden");
    }
    function refresh() {
      if (!W.open) return;
      if (sig() !== W.sig) render();
      else live();
    }
    return { open, close, refresh, isOpen: () => W.open, touched: () => W.open && !!(W.cat || W.sel || W.q || W.only) };
  }

  window.EclatRoue = { create };
})();
