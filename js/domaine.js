/* ÉCLAT — le Domaine : tout ce qui produit, en une page qui défile.
 * Les terres ouvertes (la plus récente en premier) et leurs gisements, les chaînes
 * de machines, le passage en cours et le Grand Œuvre. Le moteur fait le calcul ;
 * ici on affiche, et on traduit les gestes du joueur en appels au moteur. */
(function () {
  "use strict";

  const CAPS = [0, 10, 50, 100, 200, 500, 1000, 5000, 20000, 100000];
  const SHOWN = 2; // terres dépliées d’office ; les plus anciennes se replient

  function create(api) {
    const { E, A, D, U, esc, fmt, fmtNum, fmtTime, perMin, needText, deZone, sparks, icon, toast, openModal, closeModal, norm, vibe, floater, passHTML, render, quiet } = api;
    const uiSigne = api.uiSigne || (() => "");
    const recitInline = api.recitInline || ((t) => esc(t));
    const itemPill = api.itemPill || ((id) => esc(id));
    const I = D.ITEMS;
    const S = () => E.state;
    const perTime = perMin;
    const plural = (n, w) => n + " " + w + (n > 1 ? "s" : "");
    /* le nom court d’un extracteur ou d’une machine, accordé : « 1 cabane », « 3 meules » */
    const nm = (id, n) => (n > 1 ? I[id].pl || I[id].n.toLowerCase() : I[id].sn || I[id].n.toLowerCase());
    const many = (id, n) => n + " " + nm(id, n);
    /* « Âge de l’Électricité » → « Électricité » */
    const ageShort = (a) => D.AGES[a].n.replace(/^Âge (du |de la |de l’|des |de )?/, "");

    /* ------------------------------------------------------------ données */
    function openZones() { return D.ZONES.filter((z) => E.zoneOpen(z.id)).map((z) => z.id); }
    /* un gisement se montre s’il se récolte à la main, s’il est exploité, ou si on connaît de quoi l’exploiter */
    function depShown(z, d) {
      if (d.hand || E.domExt(z, d.res)) return true;
      return E.extFor(d.res, z).some((t) => S().known[t] || E.count(t) >= 1);
    }
    function depRate(z, res) {
      const e = E.domExt(z, res);
      return e && E.machInfo(E.extKey(z, res)).s === "ok" ? E.extOut(e) : 0;
    }
    function zoneRate(z) { return E.zoneDeps(z).reduce((a, d) => a + depRate(z, d.res), 0); }

    /* ------------------------------------------------------------ la page */
    function view() {
      const st = S(), zs = openZones().reverse();
      let h = '<div class="dom' + (U.domDense ? " dom-dense" : "") + '">';
      h += api.top();
      if (zs.length > 1) h += '<div class="dom-ctrls"><button class="chip ghost" data-dom-dense title="Basculer entre affichage compact et normal">' + (U.domDense ? "↕️ Vue normale" : "🤏 Vue dense") + "</button></div>";
      const tip = hint();
      if (tip) h += '<div class="dom-tip">' + tip + "</div>";
      const all = U.domAll || zs.length <= SHOWN + 1;
      zs.forEach((z, i) => { if (all || i < SHOWN || U.domOpen === z) h += terreHTML(z); });
      if (!all) {
        const rest = zs.filter((z, i) => i >= SHOWN && U.domOpen !== z);
        if (rest.length) {
          const r = rest.reduce((a, z) => a + zoneRate(z), 0);
          h += '<button class="dom-more" data-dall>' + plural(rest.length, "autre terre") + (r > 0 ? " · +" + perTime(r) + " en tout" : "") + '<span>voir ▾</span></button>';
        }
      } else if (zs.length > SHOWN + 1) h += '<button class="dom-more" data-dall>Replier les terres anciennes<span>▴</span></button>';
      h += domaineMachinesSummary();
      if (E.zoneOpen(D.COMPTOIR.zone)) h += comptoirHTML();
      E.passPending().forEach((z) => {
        const p = E.passInfo(z);
        if (p && p.ready) h += '<section class="dom-card dom-pass" id="dpass-' + z + '"><h3>Vers ' + esc(E.ZONES[z].n) + "</h3>" + passHTML(z) + "</section>";
      });
      for (const pid in D.PROJECTS) if (E.projVisible(pid) && E.projState(pid).step < D.PROJECTS[pid].steps.length) h += oeuvreHTML(pid);
      h += prodHTML();
      const q = D.AGES[st.age].q;
      if (q) h += '<p class="dom-epi">« ' + esc(q) + " »</p>";
      return h + "</div>";
    }

    function ruinHTML(id, count) {
      const st = S(), it = I[id];
      const cost = E.ruinCost(id);
      const can = Object.keys(cost).every((k) => (st.inv[k] || 0) >= cost[k]);
      const costTxt = Object.keys(cost).map((k) => itemPill(k, { qty: cost[k], lack: (st.inv[k] || 0) < cost[k] })).join(" ");
      const name = E.ruinName(id);
      return '<div class="dom-ruine" data-druin="' + id + '">' +
        '<div class="grow"><div class="small"><b>' + esc(name) + "</b> · réparer : " + costTxt + "</div>" +
        (count > 1 ? '<div class="tiny muted">' + count + " ruines à cet endroit</div>" : "") +
        "</div>" +
        '<button class="btn small' + (can ? " pri" : " nope") + '" data-repair="' + id + '">Réparer</button>' +
        "</div>";
    }

    /* la règle de la terre, en une ligne : ce qui la distingue des autres */
    function regleHTML(z) {
      const r = E.regle(z);
      if (!r) return "";
      const ok = r.etat === "ok";
      return '<p class="dom-regle' + (ok ? " ok" : r.etat === "gene" ? " gene" : "") + '"><b>' + esc(r.n) + "</b> · " + esc(ok && r.ok ? r.ok : r.t) + "</p>";
    }
    /* les terres qui ont un décor illustré (assets/terres/<id>-decor.webp) */
    const DECORS = { lisiere: 1, plaine: 1, riviere: 1, collines: 1, mine: 1, desert: 1, gisement: 1, montagnes: 1, orbite: 1, lune: 1, mercure: 1 };
    function terreHTML(z) {
      const st = S(), Z = E.ZONES[z];
      const deps = E.zoneDeps(z).filter((d) => depShown(z, d));
      const decor = DECORS[z] ? ' style="--decor:url(' + new URL('assets/terres/' + z + '-decor.webp', document.baseURI).href + ')"' : "";
      let h = '<section class="dom-terre' + (decor ? " a-decor" : "") + '" id="dt-' + z + '"' + decor + '><div class="dom-th"><h3>' + esc(Z.n) + "</h3>" + lieuHTML(z) + "</div>";
      const ruins = E.ruins();
      for (const id in ruins) {
        const it = I[id];
        if (it && it.t === "ext" && it.z === z && ruins[id] > 0) h += ruinHTML(id, ruins[id]);
      }
      h += regleHTML(z);
      deps.forEach((d) => { h += gisHTML(z, d); });
      if (!deps.some((d) => d.hand) && !deps.some((d) => E.domExt(z, d.res)) && deps.length) h += '<p class="tiny muted">Ici, rien ne se récolte à la main : pose des extracteurs.</p>';
      void st;
      return h + "</section>";
    }
    /* le prochain lieu à explorer sur la terre, ou l’exploration en cours */
    function lieuHTML(z) {
      const st = S(), Z = E.ZONES[z], exps = Z.exps || [];
      if (!exps.length) return "";
      const done = st.exp.done[z] || 0, act = st.exp.active;
      const visible = exps.filter((x, idx) => idx < done || !x.show || E.cond(x.show));
      const n = visible.length;
      if (act && act.z === z) {
        const p = E.expProgress();
        return '<div class="dom-lieu"><span class="tiny">🧭 ' + esc(Z.exps[act.i].n) + ' · <b data-xl>' + (p ? fmtTime(p.left) : "") + '</b></span><div class="bar"><i data-xp style="width:' + (p ? (p.p * 100).toFixed(1) : 0) + '%"></i></div></div>';
      }
      const nx = E.nextExp(z);
      if (!nx) return '<span class="tiny muted">' + done + "/" + n + " lieux</span>";
      if (nx.locked) {
        const reqStr = nx.x.hidden ? nx.x.hidden : (typeof nx.x.need === "string" && I[nx.x.need] ? "il faut " + I[nx.x.need].n.toLowerCase() : Array.isArray(nx.x.need) ? "il faut " + nx.x.need.map((id) => (I[id] ? I[id].n.toLowerCase() : id)).join(", ") : "lieu verrouillé");
        return '<span class="tiny muted">' + done + "/" + n + " lieux · 🔒 " + esc(reqStr) + "</span>";
      }
      return '<button class="btn small" data-exp="' + z + '">🧭 Explorer · ' + esc(nx.x.hidden ? "???" : nx.x.n) + "</button>";
    }
    function gisHTML(z, d) {
      const st = S(), res = d.res, key = E.extKey(z, res), e = E.domExt(z, res);
      const ch = E.extChoice(res, z), q = E.domQueued("x:" + key);
      const info = E.machInfo(key), rate = depRate(z, res);
      const used = e ? Object.keys(e.u).map((t) => many(t, e.u[t])).join(", ") : "";
      let sub = fmt(st.inv[res] || 0);
      sub = 'Tu en as <span data-c="' + res + '">' + sub + "</span>" + (used ? " · " + esc(used) : "") + (q ? " · " + q + " en cours" : "");
      const right = e && info.s === "off" ? '<span class="dom-rate off">⏸ en pause</span>'
        : rate > 0 ? '<span class="dom-rate" data-rate="' + key + '">+' + perTime(rate) + "</span>"
        : d.hand ? '<span class="dom-rate hand">🖐️ à la main</span>' : "";
      let btns = "";
      if (d.hand) {
        const on = st.act && st.act.k === "harv" && st.act.res === res && st.act.z === z;
        btns += '<button class="mini' + (on ? " on" : "") + '" data-hloop="' + key + '" aria-label="' + (on ? "Arrêter de récolter" : "Récolter en continu") + '" title="' + (on ? "Arrêter" : "Récolter en continu") + '">' + (on ? "■" : "▶") + "</button>";
      }
      if (ch) {
        const free = E.freeExt(ch.t), can = free >= 1 || E.plan(ch.t, 1).ok;
        btns += '<button class="mini lbl' + (can ? "" : " nope") + '" data-xadd="' + key + '" data-n="1" title="Poser : ' + esc(I[ch.t].n) + '" aria-label="Poser : ' + esc(I[ch.t].n) + '">+ ' + esc(nm(ch.t, 1)) + "</button>";
      }
      return '<div class="gis" data-gis="' + key + '">' +
        '<button class="gis-ic' + (d.hand ? " hand" : "") + '"' + (d.hand ? ' data-harv="' + key + '" aria-label="Récolter : ' + esc(I[res].n) + '"' : ' tabindex="-1"') + ">" + icon(res) + "</button>" +
        '<div class="gis-body" data-gsheet="' + key + '"><div class="gis-l1"><b>' + esc(I[res].n) + "</b>" + right + "</div>" +
        '<div class="gis-l2 tiny muted">' + sub + "</div></div>" +
        (btns ? '<div class="gis-b">' + btns + "</div>" : "") + "</div>";
    }

    /* ------------------------------------------------------------ machines & commandes */
    function machTierDesc(m) {
      const M = I[m];
      if (!M) return "";
      return M.ing === 1 ? "recettes à 1 ingrédient" : "recettes à " + M.ing + " ingrédients au plus";
    }
    function domaineMachinesSummary() {
      const st = S(), ms = E.machines();
      const owned = E.MACHINES.filter((m) => ms[m].own > 0);
      const machRuins = Object.keys(E.ruins()).filter((id) => I[id] && I[id].t === "mach");
      const qLen = st.hand.q.length;
      if (!owned.length && !qLen && !machRuins.length) return "";
      const work = E.MACHINES.reduce((a, m) => a + ms[m].used, 0);
      const rest = E.MACHINES.reduce((a, m) => a + E.freeMach(m), 0);
      const parts = [];
      if (qLen) parts.push(plural(qLen, "commande"));
      if (owned.length) parts.push(work + " " + (work > 1 ? "machines" : "machine") + " au travail · " + rest + " au repos");
      if (machRuins.length) parts.push("🛖 ruines");
      return '<button class="dom-more dom-mach-link" data-tab2="machines" data-dmach>⚙️ ' +
        parts.join(" · ") + " · <span>voir ▸</span></button>";
    }
    function jobWorkersText(j) {
      const parts = [];
      j.steps.forEach((st) => {
        if (st.done >= st.n) return;
        const w = [];
        if (st.hands) w.push("✋ mains");
        const mTypes = Object.keys(st.machByType || {});
        mTypes.forEach((m) => w.push(many(m, st.machByType[m])));
        if (w.length) parts.push(w.join(" + ") + " → " + I[st.id].n.toLowerCase() + " (" + st.done + "/" + st.n + ")");
      });
      return parts.join(" · ");
    }
    function jobMissingText(j) {
      const keys = Object.keys(j.miss || {}).filter((k) => j.miss[k] > 1e-9);
      if (!keys.length) return "";
      return "il manque : " + keys.map((k) => fmt(Math.ceil(j.miss[k])) + " " + I[k].n.toLowerCase()).join(", ");
    }
    function machinesView() {
      const hi = E.handInfo(), ms = E.machines();
      const owned = E.MACHINES.filter((m) => ms[m].own > 0);
      let h = '<div class="dom dom-mach-tab">';
      h += '<h2 class="title" style="margin-top:0">Machines &amp; commandes</h2>';
      h += '<p class="small muted" style="margin-top:-8px;margin-bottom:12px">Tes mains et tes machines travaillent ensemble sur les commandes lancées depuis l’Atelier.</p>';
      const ruins = E.ruins();
      for (const id in ruins) {
        const it = I[id];
        if (it && it.t === "mach" && ruins[id] > 0) h += ruinHTML(id, ruins[id]);
      }

      h += '<h3 class="sub" style="margin-top:8px">Commandes en cours</h3>';
      if (hi && hi.jobs.length) {
        hi.jobs.forEach((j, idx) => {
          const it = I[j.id];
          const pct = Math.min(100, 100 * (j.frac || 0));
          const workTxt = jobWorkersText(j);
          const missTxt = jobMissingText(j);
          h += '<section class="dom-card mach-card" data-order-idx="' + idx + '">';
          h += '<div class="row between" style="align-items:center;gap:8px">' +
            '<div class="row grow" style="align-items:center;gap:8px">' + icon(j.id, "sm") +
            '<div class="grow"><b>' + esc(it.n) + (j.n > 1 ? " ×" + fmt(j.n) : "") + '</b>' +
            '<span class="tiny muted"> · ' + fmt(j.finalDone) + "/" + fmt(j.n) + (j.left > 0 && !j.wait ? " · ~" + fmtTime(j.left) : "") + '</span></div></div>' +
            '<button class="btn small ghost" data-mcancel="' + idx + '">Annuler</button>' +
            '</div>';
          h += '<div class="bar" style="margin:6px 0"><i data-opbar="' + idx + '" style="width:' + pct.toFixed(1) + '%"></i></div>';
          if (workTxt) h += '<div class="tiny good">' + esc(workTxt) + '</div>';
          if (missTxt) h += '<div class="tiny warn">' + esc(missTxt) + '</div>';
          else if (j.wait && !workTxt) h += '<div class="tiny muted">attend une main ou une machine</div>';
          if (j.steps.length > 1) {
            h += '<div class="tiny muted" style="margin-top:4px">' +
              j.steps.map((s) => (s.done >= s.n ? "✓ " : s.hands || s.machs ? "▸ " : "") + esc(I[s.id].n.toLowerCase()) + " " + s.done + "/" + s.n).join(" → ") +
              '</div>';
          }
          h += '</section>';
        });
      } else {
        h += '<p class="small muted" style="padding:6px 0 12px">Aucune commande en cours. Tu peux en lancer une depuis l’Atelier ou le Carnet (×10, ×50, ×100, ×1000).</p>';
      }

      h += '<h3 class="sub" style="margin-top:16px">Tes machines</h3>';
      if (owned.length) {
        owned.forEach((m) => {
          const info = ms[m], rest = Math.max(0, info.own - info.used);
          const recs = Object.keys(info.byRec || {});
          const workDesc = recs.length
            ? recs.map((r) => info.byRec[r] + " sur " + I[r].n.toLowerCase()).join(", ")
            : "0 au travail";
          h += '<section class="dom-card dom-mach-rest" data-mach-type="' + m + '" style="margin-bottom:8px">' +
            '<div class="row between" style="align-items:center">' +
            '<div class="row" style="align-items:center;gap:8px">' +
            icon(m) +
            '<div><b>' + esc(many(m, info.own)) + '</b>' +
            '<div class="tiny muted">' + esc(machTierDesc(m)) + '</div>' +
            '<div class="tiny ' + (info.used > 0 ? "good" : "muted") + '">' +
            (info.used > 0 ? esc(workDesc) + (rest > 0 ? " · " + rest + " au repos" : "") : rest + " au repos") +
            '</div></div></div>' +
            '</div></section>';
        });
      } else {
        h += '<p class="small muted" style="padding:6px 0">Tu n’as pas encore de machine. La première se découvre à l’Atelier : l’automate de bois.</p>';
      }
      h += '</div>';
      return h;
    }

    /* ------------------------------------------------------------ Le Comptoir */
    function comptoirHTML() {
      const st = S();
      const phrases = [
        "« Encore toi. Montre-moi ce que tu as en trop. »",
        "Le Troqueur fait tinter ses écus en les comptant. Il n’a jamais l’air pressé.",
        "« Le bois ne vaut presque rien. Ce que tu en fais, si. »"
      ];
      const phrase = phrases[(st.cycle + st.age) % phrases.length];
      const count = E.troqueurCount ? E.troqueurCount() : 0;
      const askLine = count === 0 ? "Aucune demande du Troqueur" : count === 1 ? "1 demande du Troqueur" : count + " demandes du Troqueur";
      return '<section class="dom-card dom-comptoir" id="dcomptoir">' +
        '<h3>🪙 Le Comptoir</h3>' +
        '<p class="small muted">' + esc(phrase) + '</p>' +
        '<div class="small" style="margin-top:6px"><b>' + esc(askLine) + '</b></div>' +
        '<div class="row wrap between" style="align-items:center;margin-top:8px">' +
        '<span class="small"><b>' + fmt(st.ecus || 0) + '</b> écus</span>' +
        '<button class="btn small pri" data-comptoir>Ouvrir le Comptoir</button>' +
        '</div></section>';
    }

    function comptoirSheet(tab) {
      let curTab = tab || "vendre";
      const mbox = () => document.querySelector("#modal .modal-box");

      function sellRowHTML(id) {
        const have = S().inv[id] || 0;
        const p = E.unitPrice(id);
        const n10 = Math.max(1, Math.floor(have * 0.1));
        const n50 = Math.max(1, Math.floor(have * 0.5));
        const nAll = Math.max(0, have - 100);
        const q10 = E.sellQuote(id, n10);
        const q50 = E.sellQuote(id, n50);
        const qAll = nAll > 0 ? E.sellQuote(id, nAll) : 0;
        return '<div class="comptoir-row" data-sline="' + id + '">' +
          '<div class="comptoir-head" data-goto="' + id + '" role="button" tabindex="0" title="' + esc(I[id].n) + ' (toucher pour inspecter)">' + icon(id, "sm") +
          '<div class="grow"><b>' + esc(I[id].n) + '</b><span class="tiny muted"> · tu en as <span data-c="' + id + '">' + fmt(have) + '</span></span></div>' +
          '<span class="tiny muted">' + fmtNum(p) + ' écu l’unité</span></div>' +
          '<div class="comptoir-btns">' +
          '<button class="btn mini" data-m="sell" data-id="' + id + '" data-n="' + n10 + '" title="Vendre 10 %"><b>10 %</b> <small>+' + fmtNum(q10) + '</small></button>' +
          '<button class="btn mini" data-m="sell" data-id="' + id + '" data-n="' + n50 + '" title="Vendre la moitié"><b>La moitié</b> <small>+' + fmtNum(q50) + '</small></button>' +
          '<button class="btn mini" data-m="sell" data-id="' + id + '" data-n="' + nAll + '"' + (nAll <= 0 ? ' disabled' : '') + ' title="Tout vendre, sauf 100"><b>Tout sauf 100</b> <small>' + (nAll > 0 ? '+' + fmtNum(qAll) : '−') + '</small></button>' +
          '</div></div>';
      }

      function buyResRowHTML(id) {
        const have = S().inv[id] || 0;
        const c1 = E.buyResCost(id, 1);
        const c100 = E.buyResCost(id, 100);
        const c1000 = E.buyResCost(id, 1000);
        const ecus = S().ecus || 0;
        return '<div class="comptoir-row" data-bline="' + id + '">' +
          '<div class="comptoir-head" data-goto="' + id + '" role="button" tabindex="0" title="' + esc(I[id].n) + ' (toucher pour inspecter)">' + icon(id, "sm") +
          '<div class="grow"><b>' + esc(I[id].n) + '</b><span class="tiny muted"> · tu en as <span data-c="' + id + '">' + fmt(have) + '</span></span></div>' +
          '<span class="tiny muted">' + fmtNum(c1) + ' écu l’unité</span></div>' +
          '<div class="comptoir-btns">' +
          '<button class="btn mini" data-m="buyres" data-id="' + id + '" data-n="100"' + (ecus < c100 ? ' disabled' : '') + '>+100 <small>' + fmt(c100) + ' écus</small></button>' +
          '<button class="btn mini" data-m="buyres" data-id="' + id + '" data-n="1000"' + (ecus < c1000 ? ' disabled' : '') + '>+1 000 <small>' + fmt(c1000) + ' écus</small></button>' +
          '</div></div>';
      }

      function buyPageRowHTML(p) {
        const ecus = S().ecus || 0;
        const can = ecus >= p.ecus;
        return '<div class="comptoir-row" data-bpage="' + esc(p.id) + '">' +
          '<div class="comptoir-head"><span class="sheet-ic" style="font-size:20px">📖</span>' +
          '<div class="grow"><b>' + (p.feuillet ? "Une feuille pliée" : "Page n° " + p.n) + '</b>' +
          (p.titre ? '<span class="tiny muted"> · ' + esc(p.titre) + '</span>' : '') +
          '</div>' +
          '<span class="tiny muted">' + fmt(p.ecus) + ' écus</span></div>' +
          '<div class="comptoir-btns">' +
          '<button class="btn mini' + (can ? ' pri' : '') + '" data-m="buypage" data-id="' + esc(p.id) + '"' + (can ? '' : ' disabled') + '>' +
          '<b>Acheter</b> <small>' + fmt(p.ecus) + ' écus</small></button>' +
          '</div></div>';
      }

      function askRowHTML(ask, i) {
        if (!ask) {
          return '<div class="comptoir-row" style="opacity:0.6;border-style:dashed">' +
            '<p class="small muted center" style="margin:4px 0">Emplacement vide · demande livrée</p></div>';
        }
        const have = S().inv[ask.id] || 0;
        const can = have >= ask.n;
        return '<div class="comptoir-row" data-aline="' + i + '">' +
          '<div class="comptoir-head" data-goto="' + ask.id + '" role="button" tabindex="0" title="' + esc(I[ask.id].n) + ' (toucher pour inspecter)">' + icon(ask.id, "sm") +
          '<div class="grow"><b>' + esc(I[ask.id].n) + '</b><span class="tiny muted"> · <span data-c="' + ask.id + '">' + fmt(have) + '</span> / ' + fmt(ask.n) + ' en poche</span></div>' +
          '<span class="small" style="font-weight:700">+' + ask.tr + ' ✦</span></div>' +
          '<div class="comptoir-btns">' +
          '<button class="btn mini' + (can ? ' pri' : '') + '" data-m="deliver" data-idx="' + i + '"' + (can ? '' : ' disabled') + '>' +
          '<b>Livrer</b> <small>contre +' + ask.tr + ' ✦</small></button>' +
          '</div></div>';
      }

      function comptoirModalHTML() {
        const st = S();
        let h = '<div class="sheet-h"><span class="sheet-ic">🪙</span><div class="grow"><h2>Le Comptoir</h2><div class="tiny muted">Le Troqueur · <span data-cecus>' + fmt(st.ecus || 0) + '</span> écus</div></div></div>';
        // à l’ouverture, ce que le Troqueur dit et ce que porte le bois du comptoir (données du récit)
        const parole = uiSigne("comptoir", "Le Comptoir");
        if (parole) h += '<div class="comptoir-signe lore small">' + parole + '</div>';
        h += '<div class="subtabs">' +
          '<button class="' + (curTab === "vendre" ? "on" : "") + '" data-m="ctab" data-t="vendre">Vendre</button>' +
          '<button class="' + (curTab === "acheter" ? "on" : "") + '" data-m="ctab" data-t="acheter">Acheter</button>' +
          '<button class="' + (curTab === "demandes" ? "on" : "") + '" data-m="ctab" data-t="demandes">Demandes</button>' +
          '<button class="' + (curTab === "parler" ? "on" : "") + '" data-m="ctab" data-t="parler">Parler</button>' +
          '</div>';

        if (curTab === "vendre") {
          const items = Object.keys(st.inv)
            .filter((id) => E.sellable(id) && (st.inv[id] || 0) >= 1)
            .sort((a, b) => E.sellQuote(b, st.inv[b]) - E.sellQuote(a, st.inv[a]));
          if (!items.length) {
            h += '<p class="small muted center" style="padding:20px 0" id="sell-empty">Rien à vendre dans ta Réserve pour l’instant. Récolte des ressources ou fabrique des pièces.</p>';
          } else {
            h += '<div class="comptoir-list" id="sell-list">' + items.map(sellRowHTML).join("") + '</div>';
          }
        } else if (curTab === "acheter") {
          const buyable = E.buyableRes();
          if (buyable.length) {
            h += '<div class="comptoir-list">' + buyable.map(buyResRowHTML).join("") + '</div>';
          } else {
            h += '<p class="small muted center" style="padding:20px 0">Aucune ressource disponible à l’achat pour l’instant.</p>';
          }
          const buyPages = E.buyablePages ? E.buyablePages() : [];
          if (buyPages.length) {
            h += '<h3 class="sub" style="margin-top:16px">Pages</h3>';
            h += '<div class="comptoir-list">' + buyPages.map(buyPageRowHTML).join("") + '</div>';
          }
        } else if (curTab === "parler") {
          const TR = (E.RECIT && E.RECIT.troc) || {};
          const last = E.troqueurDernier ? E.troqueurDernier() : null;
          h += '<div class="troc-parole">' + (last
            ? '<p class="serif">' + String(recitInline(last.t, "Le Comptoir")).replace(/\n/g, "<br>") + "</p>"
            : '<p class="small muted"><i>' + esc(TR.intro || "") + "</i></p>") + "</div>";
          h += '<p class="tiny muted center">' + esc(TR.consigne || "") + "</p>";
          h += '<div class="troc-themes">' + E.troqueurThemes().map((th) =>
            '<button class="btn small' + (th.dispo ? " pri" : " nope") + '" data-m="parler" data-th="' + esc(th.id) + '">' + esc(th.n) + "</button>").join("") + "</div>";
        } else if (curTab === "demandes") {
          const asks = E.troqueurAsks ? E.troqueurAsks() : [];
          const next = (st.comptoir && st.comptoir.next) || 0;
          const leftSec = Math.max(0, Math.ceil((next - Date.now()) / 1000));
          if (!asks.length) {
            h += '<p class="small muted center" style="padding:20px 0">Le Troqueur n’a pas de demande pour l’instant. Fabrique des objets de ton âge.</p>';
          } else {
            h += '<div class="comptoir-list">' + asks.map(askRowHTML).join("") + '</div>';
          }
          if (next > 0) {
            h += '<p class="tiny muted center" style="margin:10px 0 6px">Prochain renouvellement dans ' + fmtTime(leftSec) + '.</p>';
          }
        }

        h += '<div class="acts"><button class="btn pri" data-m="close">Fermer</button></div>';
        return h;
      }

      function redraw() {
        const b = mbox();
        if (b) b.innerHTML = comptoirModalHTML();
        render(true);
        return true;
      }

      openModal({
        reopen: () => comptoirSheet(curTab), // revenir ici depuis une fiche ouverte d’une pastille
        html: comptoirModalHTML(),
        refresh: () => comptoirModalHTML(),
        on: {
          ctab: (b) => {
            curTab = b.dataset.t;
            A.click();
            return redraw();
          },
          parler: (b) => {
            const r = E.troqueurParle(b.dataset.th);
            if (r.ok && !r.vide) A.page(); else A.click();
            return redraw();
          },
          sell: (b) => {
            const id = b.dataset.id, n = Number(b.dataset.n);
            const r = E.sell(id, n);
            if (!r.ok) {
              A.fail(0);
              toast("Impossible de vendre : " + (r.why === "missing" ? "tu n’en as plus assez." : "quantité invalide."), { key: "comptoir" });
              return redraw();
            }
            A.click(); vibe(8);
            toast("+" + fmtNum(r.ecus) + " écus (" + esc(I[id].n) + ")", { key: "comptoir" });
            const box = mbox();
            if (box) {
              const ecEl = box.querySelector("[data-cecus]");
              if (ecEl) ecEl.textContent = fmt(S().ecus || 0);
              const row = box.querySelector('[data-sline="' + id + '"]');
              if (row) {
                if ((S().inv[id] || 0) <= 0) {
                  row.remove();
                  const list = box.querySelector("#sell-list");
                  if (list && !list.children.length) {
                    list.outerHTML = '<p class="small muted center" style="padding:20px 0" id="sell-empty">Rien à vendre dans ta Réserve pour l’instant. Récolte des ressources ou fabrique des pièces.</p>';
                  }
                } else {
                  row.outerHTML = sellRowHTML(id);
                }
              }
            }
            render(true);
            return true;
          },
          deliver: (b) => {
            const idx = Number(b.dataset.idx);
            const r = E.deliverAsk(idx);
            if (!r.ok) {
              A.fail(0);
              toast("Impossible de livrer : " + (r.why === "missing" ? "tu n’en as plus assez." : "demande indisponible."), { key: "comptoir" });
              return redraw();
            }
            A.click(); vibe(10);
            toast("✦ +" + r.ask.tr + " Trace" + (r.ask.tr > 1 ? "s" : "") + " !", { key: "comptoir" });
            return redraw();
          },
          buyres: (b) => {
            const id = b.dataset.id, n = Number(b.dataset.n);
            const r = E.buyRes(id, n);
            if (!r.ok) {
              A.fail(0);
              toast("Pas assez d’écus.", { key: "comptoir" });
              return redraw();
            }
            A.click(); vibe(8);
            toast("Acheté : " + fmt(n) + " " + esc(I[id].n) + ".", { key: "comptoir" });
            return redraw();
          },
          buypage: (b) => {
            const id = b.dataset.id;
            const r = E.buyPage(id);
            if (!r.ok) {
              A.fail(0);
              toast("Pas assez d’écus.", { key: "comptoir" });
              return redraw();
            }
            A.click(); vibe(8);
            return redraw();
          }
        }
      });
    }

    /* ------------------------------------------------------------ Grand Œuvre */
    function oeuvreHTML(pid) {
      const P = D.PROJECTS[pid], ps = E.projState(pid), step = P.steps[ps.step], st = S(), on = E.siteOn(pid);
      let h = '<section class="dom-card dom-oeuvre"><h3>' + P.ic + " " + esc(P.n) + '</h3>' + '<img class="oeuvre-art" src="assets/oeuvres/' + encodeURIComponent(pid) + '.webp" alt="" loading="lazy" decoding="async">' + (["dyson", "brisemonde"].includes(pid) && ps.step < 4 ? '<img class="oeuvre-step-art" src="assets/oeuvres/' + pid + '-' + (ps.step + 1) + '.webp" alt="" loading="lazy" decoding="async">' : "") + '<div class="tiny muted">Étape ' + (ps.step + 1) + " sur " + P.steps.length + " · " + esc(step.n) + "</div>";
      if (step.cost) {
        h += Object.keys(step.cost).map((k) => {
          const paid = ps.paid[k] || 0;
          return '<div class="cost-row" data-goto="' + k + '" role="button" tabindex="0" title="' + esc(I[k].n) + ' (toucher pour inspecter)">' + icon(k, "sm") + '<span class="grow">' + esc(I[k].n) + '</span><span class="tiny" data-sp="' + pid + ":" + k + '">' + fmt(paid) + " / " + fmt(step.cost[k]) +
            '</span><div class="bar"><i style="width:' + (100 * paid / step.cost[k]).toFixed(1) + '%"></i></div></div>';
        }).join("");
        if (step.need && !st.frags[step.need]) h += '<p class="why">Il faut d’abord atteindre ' + esc(D.FRAGS[step.need].n) + ".</p>";
        else h += '<div class="row wrap" style="margin-top:8px"><button class="btn small pri" data-contrib="' + pid + '">Fournir</button>' +
          '<button class="btn small' + (on ? " on" : "") + '" data-feed="' + pid + '">' + (on ? "Alimenté ✓" : "Alimenter") + "</button>" +
          '<span class="tiny muted">' + (on ? "Il se sert seul dans la Réserve : au plus " + perMin(E.siteRate()) + " pour chaque ressource." : "Une fois alimenté, il se sert seul dans la Réserve.") + "</span></div>";
      } else if (step.action === "relais") {
        const CH = (E.RECIT && E.RECIT.chant) || {};
        if (st.frags.coeur && st.frags.poings) h += '<p class="small">' + esc(CH.pret || "") + '</p>';
        else h += '<p class="why">' + esc(CH.manque || "") + '</p>';
      } else if (step.scene === "lacher") {
        h += '<p class="small">' + esc(((E.RECIT && E.RECIT.chant) || {}).lacher || "") + '</p>';
      } else if (step.fire) h += '<p class="small">Tout est prêt. La décision se prend dans le Cosmos.</p>';
      else if (step.melody) {
        const m = (D.MELODIES && D.MELODIES[step.melody]) || (E.allMelodies && E.allMelodies()[step.melody]);
        h += '<p class="small">Il ne reste qu’à jouer <b>' + esc(m ? m.n : step.melody) + "</b> sur la flûte (Journal).</p>";
      }
      return h + "</section>";
    }

    /* ------------------------------------------------------------ production */
    function prodHTML() {
      const P = E.production().filter((x) => x.in > 1e-4 || x.out > 1e-4), st = S();
      if (!P.length) return "";
      return '<details class="dom-card dom-prod"' + (U.prodOpen ? " open" : "") + ' data-prod><summary>Tout ce qui entre et sort, par ressource</summary>' +
        '<div class="u-pr u-ph tiny muted"><span class="grow">Ressource</span><span>entre</span><span>sort</span><span>réserve</span></div>' +
        P.slice(0, 30).map((x) => '<div class="u-pr" data-goto="' + x.id + '" role="button" tabindex="0" title="' + esc(I[x.id].n) + ' (toucher pour inspecter)">' + icon(x.id, "sm") + '<span class="grow ell">' + esc(I[x.id].n) + "</span>" +
          "<b>" + (x.in > 1e-4 ? "+" + perTime(x.in) : "") + "</b><i>" + (x.out > 1e-4 ? "−" + perTime(x.out) : "") + '</i><span data-c="' + x.id + '">' + fmt(st.inv[x.id] || 0) + "</span></div>").join("") + "</details>";
    }

    /* ------------------------------------------------------------ conseils */
    function hint() {
      if (quiet && quiet()) return null; // le tutoriel parle déjà
      const st = S(), us = E.extUnits();
      const exts = Object.keys(st.dom.ext).length, freeE = E.EXTS.filter((t) => us[t].own - us[t].used > 0);
      const vet = st.cycle > 1;
      if (!exts && !freeE.length && !st.hand.q.length) return null; // l’objectif dit quoi faire
      void vet;
      if (freeE.length && !st.flags.tip_freeExt) {
        const t = freeE[0], n = us[t].own - us[t].used;
        return "Tu as " + esc(many(t, n)) + " à poser : touche <b>+ " + esc(nm(t, 1)) + "</b> sur un gisement " + esc(deZone(I[t].z)) + ". " +
          '<button class="btn small ghost" data-tip="tip_freeExt">Compris</button>';
      }
      const lone = Object.keys(D.PROJECTS).find((pid) => E.projVisible(pid) && !E.siteOn(pid) && E.projState(pid).step < D.PROJECTS[pid].steps.length);
      if (lone && !st.flags.tip_site) return "Ton Grand Œuvre peut se servir seul dans la Réserve : touche <b>Alimenter</b>. " + '<button class="btn small ghost" data-tip="tip_site">Compris</button>';
      return null;
    }

    /* ------------------------------------------------------------ fiches */
    const mbox = () => document.querySelector("#modal .modal-box");
    function extSheet(key) {
      const i = key.indexOf(":"), z = key.slice(0, i), res = key.slice(i + 1);
      const redraw = () => { const b = mbox(); if (b) b.innerHTML = extHTML(key); render(true); return true; };
      openModal({
        html: extHTML(key),
        refresh: () => extHTML(key),
        on: {
          eu: (b) => {
            const t = b.dataset.t, v = Number(b.dataset.v), cur = ((E.domExt(z, res) || { u: {} }).u[t]) || 0;
            if (v > 0 && E.freeExt(t) < v) feedback(E.domExtAdd(z, res, v, t), t); else { E.domExtSet(z, res, t, cur + v); A.click(); }
            return redraw();
          },
          toggle: () => { E.domExtToggle(z, res); A.click(); return redraw(); },
          clear: () => { const x = E.domExt(z, res); if (x) Object.keys(x.u).forEach((t) => E.domExtSet(z, res, t, 0)); A.click(); render(true); }
        }
      });
    }
    /* les seuils d’un gisement (D.SEUILS) : « 7 / 10 extracteurs, puis ×1,25 », ou pourquoi il n’y en a pas */
    function seuilHTML(e) {
      const q = E.seuil(e), x = (v) => "×" + String(Math.round(v * 100) / 100).replace(".", ",");
      if (q.sans) return '<p class="tiny muted">Cette terre n’a pas de seuils : le courant emporte déjà ce qui s’entasse.</p>';
      if (!q.prochain) return '<p class="tiny muted">Les quatre seuils sont passés : production ' + x(q.mult) + ".</p>";
      const prev = D.SEUILS.paliers[q.k - 1] || 0;
      return '<div class="seuil"><div class="tiny muted">' + q.n + " / " + q.prochain + " extracteurs, puis " + x(q.pas) + (q.k ? " · production déjà " + x(q.mult) : "") +
        '</div><div class="bar"><i style="width:' + Math.min(100, Math.max(0, ((q.n - prev) / (q.prochain - prev)) * 100)).toFixed(0) + '%"></i></div></div>';
    }
    function extHTML(key) {
      const i = key.indexOf(":"), z = key.slice(0, i), res = key.slice(i + 1);
      const e = E.domExt(z, res), us = E.extUnits(), info = E.machInfo(key), dep = E.zoneDeps(z).find((d) => d.res === res);
      const types = E.extFor(res, z).filter((t) => us[t].own > 0 || (e && e.u[t]) || S().known[t]);
      const rate = depRate(z, res);
      let h = '<div class="sheet-h">' + icon(res) + '<div class="grow"><h2>' + esc(I[res].n) + '</h2><div class="tiny muted">' + esc(E.ZONES[z].n) + "</div></div></div>";
      h += '<p class="small">' + (!e ? "Aucun extracteur ne travaille ici." : info.s === "off" ? "En pause." : rate > 0 ? "Les extracteurs posés ici récoltent " + perTime(rate) + ", même quand le jeu est fermé." : "Démarrage…") + "</p>";
      h += seuilHTML(e);
      if (types.length) {
        h += '<p class="tiny muted">Les extracteurs ' + esc(deZone(z)) + " : chacun récolte seulement le gisement où tu le poses.</p>";
        h += '<div class="sheet-rows">' + types.map((t) => {
          const own = us[t].own, free = own - us[t].used, cur = (e && e.u[t]) || 0;
          return '<div class="u-row">' + icon(t, "sm") + '<span class="grow small">' + esc(I[t].n) + '<br><span class="tiny muted">' + perTime(E.extRate(t, res)) + " par extracteur · " + (own ? "tu en as " + own + ", " + free + " à poser" : "à fabriquer : touche +") + "</span></span>" +
            '<button class="mini" data-m="eu" data-t="' + t + '" data-v="-1"' + (cur ? "" : " disabled") + ">−</button><b>" + cur + '</b><button class="mini" data-m="eu" data-t="' + t + '" data-v="1" aria-label="Un de plus">+</button>' +
            '<button class="mini" data-m="eu" data-t="' + t + '" data-v="10" aria-label="Dix de plus">+10</button></div>';
        }).join("") + "</div>";
      } else h += '<p class="small muted">Tu ne connais encore aucun extracteur pour ce gisement. Il faut d’abord le découvrir à l’Atelier, comme toute recette.</p>';
      if (dep && dep.hand) h += '<p class="tiny muted">Tu peux aussi récolter à la main : touche son icône dans le Domaine, ou garde le doigt dessus.</p>';
      if (z === "mine") {
        const total = e ? Object.values(e.u).reduce((a, b) => a + b, 0) : 0;
        if (total >= 8 && E.addCurio) E.addCurio("tuyau");
        if (E.hasCurio && E.hasCurio("tuyau")) {
          h += '<p class="small" style="color:var(--good)">🟩 Un tuyau vert dépasse de la roche. Tu n’y descends pas.</p>';
        }
      }
      h += '<div class="acts">' + (e ? '<button class="btn" data-m="toggle">' + (e.on ? "Pause" : "Reprendre") + '</button><button class="btn ghost" data-m="clear">Tout retirer</button>' : "") + '<button class="btn pri" data-m="close">Fermer</button></div>';
      return h;
    }
    /* ce qu’un « +1 » a fait : posé, mis aux mains, ou pourquoi rien */
    function feedback(r, t, at) {
      if (r.placed || r.queued) {
        A.click(); vibe(8);
        if (r.placed && at) sparks(at.x, at.y, 10, "#ffd36b");
        if (at) floater((r.placed ? "+" + r.placed + " " : "") + (r.queued ? "✋ " + r.queued : ""), at.x, at.y - 14, "var(--good)");
        if (r.queued) toast("✋ Tes mains fabriquent " + esc(many(t, r.queued)) + " pour ce gisement.", { key: "xq" });
        return;
      }
      A.fail(0);
      const miss = r.missing ? Object.keys(r.missing).map((k) => fmt(r.missing[k]) + " " + esc(I[k].n.toLowerCase())).join(", ") : "";
      toast(r.why === "full" ? "Tes mains sont occupées : attends la fin de la commande en cours." :
        r.why === "noext" ? "Tu ne connais encore aucun extracteur pour ce gisement." :
          "Pas de quoi fabriquer " + esc(I[t].n.toLowerCase()) + (miss ? " : il manque " + miss : "") + ".", { key: "xq" });
    }

    /* ------------------------------------------------------------ récolte à la main */
    let hold = null;
    function harvest(btn) {
      const key = btn.dataset.harv, i = key.indexOf(":"), z = key.slice(0, i), res = key.slice(i + 1);
      const n = E.tap(res, z);
      if (!n) return;
      const crit = E.lastCrit;
      A.tap(res); vibe(crit ? [8, 30, 14] : 5);
      if (crit) {
        const rc = btn.getBoundingClientRect(), x = rc.left + rc.width / 2, y = rc.top + rc.height / 2;
        sparks(x, y, 16, "#ffd36b");
        floater("×2 !", x, y - 26, "#ffd36b");
        if (A.discover) A.discover();
      }
      const row = btn.closest(".gis");
      let c = row && row.querySelector(".hcount");
      const now = performance.now();
      if (c && now - (Number(c.dataset.t) || 0) < 1200) c.dataset.n = Number(c.dataset.n) + n;
      else {
        if (c) c.remove();
        c = document.createElement("div");
        c.className = "hcount";
        c.dataset.n = n;
        if (row) row.appendChild(c);
      }
      c.dataset.t = now;
      c.textContent = "+" + fmt(Number(c.dataset.n)) + " " + I[res].n;
      c.classList.toggle("crit", crit);
      c.classList.remove("bump"); void c.offsetWidth; c.classList.add("bump");
      clearTimeout(c._tm);
      c._tm = setTimeout(() => { c.classList.add("out"); setTimeout(() => c.remove(), 400); }, 1100);
      const v = row && row.querySelector('[data-c="' + res + '"]');
      if (v) v.textContent = fmt(S().inv[res] || 0);
      btn.classList.remove("pop"); void btn.offsetWidth; btn.classList.add("pop");
    }
    function down(ev) {
      const btn = ev.target.closest("[data-harv]");
      if (!btn) return false;
      ev.preventDefault();
      try { btn.setPointerCapture(ev.pointerId); } catch (e) { /* pas de capture possible */ }
      A.init && A.init();
      U.holding = true;
      harvest(btn);
      const h = { id: ev.pointerId, btn };
      h.tm = setTimeout(function rep() { if (hold !== h) return; harvest(btn); h.tm = setTimeout(rep, 140); }, 380);
      hold = h;
      return true;
    }
    function up(ev) {
      if (!hold || (ev && ev.pointerId !== hold.id)) return;
      clearTimeout(hold.tm);
      hold = null;
      U.holding = false;
      render();
    }

    /* ------------------------------------------------------------ clics */
    function click(t) {
      let b;
      if (t.closest("[data-harv]")) return true; // géré à l’appui
      if ((b = t.closest("[data-xadd]"))) {
        const key = b.dataset.xadd, i = key.indexOf(":"), z = key.slice(0, i), res = key.slice(i + 1);
        const ch = E.extChoice(res, z);
        if (!ch) return true;
        const r = E.domExtAdd(z, res, Number(b.dataset.n) || 1);
        const rc = b.getBoundingClientRect();
        feedback(r, ch.t, { x: rc.left + rc.width / 2, y: rc.top });
        render(true);
        return true;
      }
      if ((b = t.closest("[data-gsheet]"))) { A.click(); extSheet(b.dataset.gsheet); return true; }
      if ((b = t.closest("[data-mcancel]"))) {
        E.cancelJob(Number(b.dataset.mcancel));
        A.click();
        render(true);
        return true;
      }
      if ((b = t.closest("[data-comptoir]"))) { A.click(); comptoirSheet(b.dataset.comptoir || "vendre"); return true; }
      if (t.closest("[data-dall]")) { U.domAll = !U.domAll; U.domOpen = null; A.click(); render(true); return true; }
      if (t.closest("[data-dom-dense]")) { U.domDense = !U.domDense; A.click(); vibe(8); render(true); return true; }
      if ((b = t.closest("[data-feed]"))) {
        const pid = b.dataset.feed;
        E.domSite(pid, !E.siteOn(pid));
        A.click(); render(true);
        return true;
      }
      if ((b = t.closest("[data-contrib]"))) {
        const r = E.contribute(b.dataset.contrib);
        if (r.ok) { A.click(); vibe(10); } else { A.fail(0); toast("Ressources manquantes : tu n’as rien à déposer pour ce chantier.", { key: "contrib" }); }
        render(true);
        return true;
      }
      if ((b = t.closest("[data-proj-act]"))) {
        const pid = b.dataset.projAct;
        if (pid === "chant") {
          const r = E.cutRelay();
          if (r.ok) { A.click(); vibe(30); toast("⚡ Le relais est coupé. Dans ta poitrine, quelque chose s’est tu."); render(true); }
          else { A.fail(0); toast(esc(((E.RECIT && E.RECIT.chant) || {}).manque || "")); }
        }
        return true;
      }
      if ((b = t.closest("[data-proj-scene]"))) {
        if (typeof api.openStillnessScene === "function") api.openStillnessScene();
        return true;
      }
      if ((b = t.closest("[data-repair]"))) {
        const id = b.dataset.repair;
        const r = E.repair(id);
        if (r.ok) {
          A.init(); A.click(); vibe([10, 30]);
          const it = I[id];
          if (it.t === "ext") toast("<b>" + esc(I[id].n) + "</b> : réparation faite, de nouveau au travail.", { key: "repair" });
          else toast("<b>" + esc(I[id].n) + "</b> : réparation faite. Elle est au repos, dans l’onglet Machines.", { key: "repair" });
        } else {
          A.fail(0);
          if (r.missing) toast("Il manque encore : " + Object.keys(r.missing).map((m) => r.missing[m] + " " + esc(I[m].n.toLowerCase())).join(", ") + ".", { key: "repair" });
          else toast("Impossible de réparer.", { key: "repair" });
        }
        render(true);
        return true;
      }
      if (t.closest("[data-prod]") && t.closest("summary")) { U.prodOpen = !t.closest("details").open; return false; }
      return false;
    }

    /* ------------------------------------------------------------ rafraîchir sans redessiner */
    function live(root) {
      if (!root) return;
      root.querySelectorAll("[data-rate]").forEach((el) => {
        const key = el.dataset.rate, i = key.indexOf(":"), r = depRate(key.slice(0, i), key.slice(i + 1));
        el.textContent = r > 0 ? "+" + perTime(r) : "";
      });
      const hi = E.handInfo();
      root.querySelectorAll("[data-opbar]").forEach((el) => {
        const idx = Number(el.dataset.opbar), j = hi && hi.jobs[idx];
        if (j) el.style.width = Math.min(100, 100 * (j.frac || 0)).toFixed(1) + "%";
      });
      root.querySelectorAll("[data-sp]").forEach((el) => {
        const [pid, k] = el.dataset.sp.split(":"), P = D.PROJECTS[pid], ps = E.projState(pid), step = P && P.steps[ps.step];
        if (step && step.cost && step.cost[k]) el.textContent = fmt(ps.paid[k] || 0) + " / " + fmt(step.cost[k]);
      });
    }
    /* signature de ce qui change la mise en page : on ne redessine que si elle change */
    function sig() {
      const st = S(), ms = E.machines();
      return [api.topSig ? api.topSig() : "", openZones().join(), JSON.stringify(st.dom.ext),
        Object.keys(st.dom.site).join(), E.EXTS.map((t) => E.freeExt(t)).join(), E.MACHINES.map((m) => ms[m].own + ":" + ms[m].used).join(),
        st.hand.q.length, st.exp.active ? st.exp.active.z : "", st.act ? st.act.k + (st.act.res || st.act.id) : "", E.passPending().join(), U.domAll, Object.values(st.dom.ext).map((e) => e.on).join(),
        (E.zoneOpen(D.COMPTOIR.zone) ? "cp" + Math.floor(st.ecus || 0) + "a" + (E.troqueurCount ? E.troqueurCount() : 0) : ""), JSON.stringify(E.ruins())].join("|");
    }

    /* une terre précise : on la déplie et on la montre */
    function focusZone(z) {
      U.domOpen = z;
      render(true);
      setTimeout(() => { const el = document.getElementById("dt-" + z); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }, 30);
    }
    /* un extracteur vient d’être fabriqué ailleurs (Atelier, Carnet) : on le pose */
    function placeExt(t) {
      const r = E.domAutoExt(t);
      if (r) { toast(esc(I[t].n) + " au travail : " + esc(I[r.res].n.toLowerCase()) + ", " + esc(E.ZONES[r.z].n) + ".", { key: "xq" }); focusZone(r.z); }
      else toast(esc(I[t].n) + " : touche « + " + esc(nm(t, 1)) + " » sur un gisement " + esc(deZone(I[t].z)) + ".", { key: "xq" });
    }
    function placeMach(m) {
      toast(esc(I[m].n) + " : au repos, jusqu’à ta prochaine commande.", { key: "mq" });
    }

    function machSig() {
      const ms = E.machines(), hi = E.handInfo();
      return [
        (hi ? hi.jobs.map((j) => j.id + ":" + j.n + ":" + j.finalDone + ":" + j.wait + ":" + JSON.stringify(j.miss) + ":" + j.steps.map((s) => s.done + ":" + (s.hands ? 1 : 0) + ":" + s.machs).join(",")).join(";") : ""),
        E.MACHINES.map((m) => ms[m].own + ":" + ms[m].used + ":" + JSON.stringify(ms[m].byRec)).join(),
        JSON.stringify(E.ruins())
      ].join("|");
    }

    return { view, live, sig, machSig, click, down, up, focusZone, placeExt, placeMach, extSheet, comptoirSheet, machinesView };
  }

  window.EclatDomaine = { create };
})();
