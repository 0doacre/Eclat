/* ÉCLAT — l’objectif, les étapes de l’âge, le suivi et les Quêtes.
 * La carte d’objectif et sa prochaine action, le passage en cours, le suivi d’une
 * recette ; la fenêtre des Quêtes (scénario, rituels, Troqueur) et sa puce du haut. */
(function () {
  "use strict";

  function create(api) {
    const {
      E, A, D, U, esc, fmt, fmtTime, cap1, needText, icon, itemPill, ingHTML, gesteChip, mainIngredient, isRawGather,
      zoneName, floater, elCenter, toast, vibe, openModal, closeModal, swapModal, render, save
    } = api;
    const S = () => E.state;
    const I = D.ITEMS;
    const $ = (s, r) => (r || document).querySelector(s);

    /* ------------------------------------------------------------ OBJECTIF ET SUIVI
     * affichés par-dessus la carte */
    function goalCard() {
      const st = S();
      const g = E.guide();
      if (!g) {
        return st.flags.arche ? '<div class="card acc goal-card compact"><div class="lbl">Objectif</div><div class="name">Choisis ton Grand Œuvre</div><div class="small">Il t’attend dans le Domaine, et dans l’onglet Cosmos du Journal.</div></div>' : "";
      }
      const ob = g.ob;
      const open = goalOpen();
      const title = ob.k === "craft" ? esc(I[ob.id].n) : esc(ob.n);
      // le compteur suit toujours l’âge où l’on est, même quand l’objectif vise déjà le suivant
      const ml = E.milestones()[st.age] || [], md = ml.filter((x) => x.done).length;
      const sum = E.questSummary ? E.questSummary() : { rituals: [], hasReady: false };
      const rits = sum.rituals || [];
      const doneRits = rits.filter((r) => r.claimed).length;
      let h = '<div class="card acc goal-card' + (open ? "" : " compact") + '"><div class="ghead-row"><button class="ghead" data-goalt><span class="lbl">📜 Scénario</span><span class="gname">' + title + '</span><span class="zt">' + (open ? "▴" : "▾") + "</span></button>" +
        '<button class="gmiles" data-open-quests title="Ouvrir les quêtes">📜 Quêtes ' + (doneRits < 3 ? '<span class="qdot' + (sum.hasReady ? '' : ' hidden') + '">●</span>' : '✓') + '</button>' +
        (ml.length ? '<button class="gmiles' + (md === ml.length ? " ok" : "") + '" data-miles title="Les étapes de cet âge">🏁 ' + (md === ml.length ? "✓" : "étapes " + md + "/" + ml.length) + "</button>" : "") + "</div>";
      if (ml.length) {
        const pct = Math.round((md / ml.length) * 100);
        h += '<div class="gprog-row" data-miles title="Progression de cet âge : ' + md + '/' + ml.length + ' étapes faites">' +
          '<div class="gprog-track"><i style="width:' + pct + '%;background:' + esc(D.AGES[st.age].c) + '"></i></div>' +
          '<span class="gprog-txt">' + (md === ml.length ? '★ Âge accompli' : esc(D.AGES[st.age].n) + ' · ' + md + '/' + ml.length + ' étapes') + '</span></div>';
      }
      h += nextAction(g);
      if (!open) return h + "</div>";
      // le détail, à la demande
      h += '<div class="gdetail small">' + esc(ob.txt || "") + "</div>";
      if (ob.k === "craft") {
        const it = I[ob.id];
        if (it.h && !st.known[ob.id]) h += '<div class="riddle small">« ' + esc(it.h) + " »</div>";
        if (g.step !== ob.id && I[g.step]) h += '<div class="tiny muted" style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin-top:4px">Il faut d’abord : ' + itemPill(g.step) + "</div>";
        if (st.known[ob.id]) h += '<div class="row wrap" style="margin-top:6px"><button class="btn small ghost" data-tree="' + ob.id + '">Détail</button>' + (st.track && st.track.id === ob.id ? "" : '<button class="btn small ghost" data-track="' + ob.id + '">Suivre</button>') + "</div>";
        const z = it.e && it.e.zone;
        if (z && D.PASSAGES[z] && !(st.pass[z] && st.pass[z].done)) {
          const c = E.passCost(z);
          h += '<div class="tiny muted" style="margin-top:6px">Ensuite, le passage <b>' + esc(D.PASSAGES[z].n) + "</b> vers " + esc(zoneName(z)) + " : " + Object.keys(c).map((i) => itemPill(i, { qty: c[i] })).join("") + ".</div>";
        }
      }
      return h + "</div>";
    }
    /* La prochaine chose à faire pour l’objectif, en une ligne : ramasser ce qui manque
     * (ici même), fabriquer d’un geste (les pièces intermédiaires comprises), ou aller
     * découvrir une recette à l’Atelier. Rien à retenir. */
    function nextAction(g) {
      const st = S(), ob = g.ob;
      const line = (inner) => '<div class="gact">' + inner + "</div>";
      if (ob.k === "exp") {
        if (st.exp.active) return line('<span class="small">🧭 En route… <b data-xl></b></span>');
        return line('<button class="btn small pri" data-exp="' + ob.z + '">🧭 Explorer</button><span class="tiny muted">' + esc(E.ZONES[ob.z].n) + "</span>");
      }
      if (ob.k === "pass") return passHTML(ob.z);
      if (ob.k === "ext") {
        const d = E.deposits().find((x) => { const c = E.extChoice(x.res, x.z); return c && (c.free > 0 || E.plan(c.t, 1).ok); });
        return d ? line('<button class="btn small pri" data-xadd="' + d.key + '" data-n="1">Poser ' + esc(I[E.extChoice(d.res, d.z).t].n.toLowerCase()) + " sur " + esc(I[d.res].n.toLowerCase()) + "</button>") : line('<span class="small">' + esc(ob.txt) + "</span>");
      }
      if (ob.k === "line") {
        const rec = st.known.manche && st.made.manche > 0 ? "manche" : Object.keys(st.known).find((k) => st.made[k] > 0 && E.automatable(k) && E.machCan("automate_bois", k));
        return line(rec ? '<button class="btn small pri" data-cr="' + rec + '" data-n="10">Commander : ' + esc(I[rec].n) + ' ×10</button>' : '<span class="small">' + esc(ob.txt) + "</span>");
      }
      const id = g.step, it = I[id];
      if (!it) return "";
      if (!st.known[id]) {
        const lvl = st.hints[id] || 0;
        return line('<div class="grow" data-goto="' + id + '"><div class="small"><span class="step-badge">✦ Étape clé</span> ' + (it.h ? "<i>« " + esc(it.h) + " »</i>" : "<b>Une recette nouvelle</b>") + "</div>" +
          (lvl >= 1 ? '<div class="tiny muted">💭 L’action : ' + gesteChip(id) + "</div>" : "") +
          (lvl >= 2 ? '<div class="tiny muted">💭 Une des ressources : ' + icon(mainIngredient(id), "sm") + " " + esc(I[mainIngredient(id)].n) + "</div>" : "") +
          '</div><button class="btn small pri" data-gotab="atelier">Tenter</button>');
      }
      if (E.queued(id) > 0) return line('<span class="small">✋ En cours de fabrication : ' + esc(it.n.toLowerCase()) + ".</span>");
      const b = E.blocker(id);
      if (b && b.why !== "owned") return line('<span class="small">' + cap1(needText(id, b, true)) + ".</span>");
      if (b && b.why === "owned") return "";
      const p = E.plan(id, 1);
      if (p.ok) {
        const parts = p.steps.filter((x) => x[0] !== id).map((x) => esc(I[x[0]].n.toLowerCase()));
        return line('<button class="btn pri gmake" data-chain="' + id + '">Fabriquer : ' + esc(it.n) + (parts.length ? ' <span class="tiny">(avec ' + parts.join(", ") + ")</span>" : "") + "</button>");
      }
      // ce qui manque : d’abord ce qui se ramasse à la main, ici même
      const miss = Object.keys(p.missing);
      const hand = miss.find((k) => isRawGather(k) && E.ZONES[E.RES_ZONE[k]].res.includes(k));
      if (hand) {
        const z = E.RES_ZONE[hand], tot = Math.ceil((st.inv[hand] || 0) + p.missing[hand]);
        return '<div class="gis gact">' + '<button class="gis-ic hand" data-harv="' + z + ":" + hand + '" aria-label="Récolter : ' + esc(I[hand].n) + '">' + icon(hand) + "</button>" +
          '<div class="grow"><div class="small">Il manque <b data-gleft="' + hand + '" data-q="' + tot + '">' + fmt(p.missing[hand]) + "</b> " + esc(I[hand].n.toLowerCase()) + " pour " + esc(it.n.toLowerCase()) + '.</div><div class="tiny muted">Touche l’icône, ou ▶ pour récolter en continu.</div></div>' +
          (st.act && st.act.k === "harv" && st.act.res === hand ? '<span class="tiny muted">en cours…</span>' : '<button class="btn small" data-hloop="' + z + ":" + hand + '">▶</button>') + "</div>";
      }
      const ext = miss.find((k) => isRawGather(k));
      if (ext) return line('<span class="small" style="display:inline-flex;align-items:center;flex-wrap:wrap;gap:4px">Il manque ' + itemPill(ext, { qty: p.missing[ext], lack: true }) + " : cette ressource ne se récolte pas à la main. Pose un extracteur sur son gisement.</span>");
      return line('<span class="small" style="display:inline-flex;align-items:center;flex-wrap:wrap;gap:4px">Il manque : ' + miss.map((k) => itemPill(k, { qty: p.missing[k], lack: true })).join("") + ".</span>");
    }
    /* ce qui change la carte d’objectif (pour la redessiner au bon moment) */
    function goalSig() {
      const g = E.guide();
      if (!g || g.ob.k !== "craft") return g ? g.ob.k + (g.ob.z || "") + (S().exp.active ? 1 : 0) : "";
      const p = I[g.step] && S().known[g.step] ? E.plan(g.step, 1) : null;
      const a = S().act;
      return g.step + ":" + (S().hints[g.step] || 0) + (p ? (p.ok ? 1 : Object.keys(p.missing).join()) : "?") + E.queued(g.step) + goalOpen() + (a ? a.k + (a.id || a.res) : "");
    }
    /* l’objectif déplié ou non : pendant un Suivi, il reste replié (on peut le rouvrir un moment) pour laisser voir le Domaine */
    function goalOpen() {
      const st = S();
      if (st.track && I[st.track.id]) return !!U.goalPeek;
      return !!st.settings.goalOpen;
    }
    /* les jalons : ce qu’il y a à faire à chaque âge, et le premier pas vers le suivant */
    function mileName(ob) {
      if (ob.k === "craft") return itemPill(ob.id);
      return (ob.k === "exp" ? "🧭 " : ob.k === "ext" ? "⛏️ " : ob.k === "pass" ? "🚧 " : "🏭 ") + esc(ob.n);
    }
    function openMilestones() {
      const st = S(), ms = E.milestones(), cur = E.objective();
      st.flags.milesSeen = true;
      const curAgeList = ms[st.age] || [];
      const curDone = curAgeList.filter((x) => x.done).length;
      const curPct = curAgeList.length ? Math.round((curDone / curAgeList.length) * 100) : 0;
      let h = '<div class="kicker">Les étapes de l’Âge</div><h2>' + esc(D.AGES[st.age].n) + '</h2>' +
        '<div class="miles-top-bar"><div class="bar" style="margin:4px 0 6px"><i style="width:' + curPct + '%;background:' + esc(D.AGES[st.age].c) + '"></i></div>' +
        '<div class="row between tiny muted"><span>Progression de l’époque : <b>' + curDone + ' / ' + curAgeList.length + '</b></span><span>' + (curDone === curAgeList.length ? '★ Accompli' : curPct + ' %') + '</span></div></div>' +
        '<p class="small muted">Chaque âge a ses étapes. Fais-les toutes et l’âge est <b>accompli</b> : +' + D.AGE_DONE + " ✨ Intuition. Certaines sont facultatives : tu peux passer à l’âge suivant sans elles, et revenir les faire quand tu veux.</p>";
      ms.forEach((list, a) => {
        if (!list || a > st.age + 1) return;
        const done = list.filter((x) => x.done).length, next = a === st.age + 1, full = done === list.length;
        const shown = next ? list.filter((x) => !x.done).slice(0, 1) : list;
        if (!shown.length) return;
        const open = a === st.age || next || (!full && cur && list.some((x) => x.i === cur.i));
        h += '<details class="miles' + (full ? " full" : "") + '"' + (open ? " open" : "") + "><summary><b>" + (next ? "Vers l’âge suivant" : esc(D.AGES[a].n)) + '</b> <span class="tiny muted">' + (next ? esc(D.AGES[a].n) : full ? "✓ accompli" : done + " sur " + list.length) + "</span></summary>" +
          shown.map((x) => '<div class="mile' + (x.done ? " done" : cur && cur.i === x.i ? " cur" : "") + '"><span class="mk">' + (x.done ? "✓" : cur && cur.i === x.i ? "➜" : "○") + "</span>" + mileName(x.ob) + (cur && cur.i === x.i && !x.done ? ' <span class="badge" style="background:var(--acc);color:#fff">En cours</span>' : "") + "</div>").join("") + "</details>";
      });
      openModal({ reopen: openMilestones, html: h + '<div class="acts"><button class="btn pri" data-m="close">Fermer</button></div>' });
    }
    const WHY_STEP = { station: "Il te faut d’abord :", zone: "Il te faut d’abord atteindre une nouvelle terre. Elle s’ouvre avec :", pass: "Il te faut d’abord ouvrir le passage vers une nouvelle terre :", unknown: "Prochaine étape :" };
    /* un passage vers une terre : ce qu’il coûte, ce qui est déjà déposé, et le bouton pour déposer */
    function passHTML(z) {
      const p = E.passInfo(z), st = S();
      if (!p || !p.ready) return "";
      return '<div class="passbox"><div class="small"><b>🚧 ' + esc(p.P.n) + '</b> <span class="tiny muted">' + Math.floor(p.frac * 100) + ' %</span></div><div class="tiny muted">' + esc(p.P.t) + "</div>" +
        '<div class="bar pass"><i style="width:' + (p.frac * 100).toFixed(1) + '%"></i></div>' +
        (p.done ? "" : '<div class="row wrap" style="margin:6px 0"><button class="btn small pri' + (p.can ? "" : " nope") + '" data-pour="' + z + '">🚧 Déposer</button><span class="tiny muted">Une fois franchi : +' + p.P.tr + " ✦ Traces pour la prochaine relève</span></div>") +
        '<div class="passcost small">' +
        Object.keys(p.cost).map((i) => {
          const got = Math.min(p.cost[i], p.paid[i] || 0), ok = got >= p.cost[i], eta = passEta(p, i), have = st.inv[i] || 0;
          return '<div class="ing link' + (ok ? " paid" : "") + '" data-goto="' + i + '">' + icon(i, "sm") + "<b>" + esc(I[i].n) + "</b> " + fmt(got) + " / " + fmt(p.cost[i]) + " déposés" +
            (ok ? " ✓" : ' <span class="tiny muted">· tu en as ' + fmt(have) + (eta === "prêt" ? " : de quoi finir" : eta ? " · encore " + eta : "") + "</span>") + "</div>";
        }).join("") + "</div></div>";
    }
    /* combien de temps avant d’avoir de quoi payer une matière, à la production actuelle (extracteurs, machines) */
    function passEta(p, i) {
      const need = (p.left[i] || 0) - (S().inv[i] || 0);
      if (need <= 0) return "prêt";
      const x = E.production().find((y) => y.id === i), r = x ? x.net : 0;
      return r > 1e-6 ? "≈ " + fmtTime(need / r) : "";
    }
    function pour(z, btn) {
      const r = E.passPour(z), p = E.passInfo(z);
      if (!r.ok) {
        A.fail(0);
        toast("Ressources manquantes : tu n’as rien à déposer pour l’instant. Il faut encore " + Object.keys(p.left).map((k) => fmt(p.left[k]) + " " + esc(I[k].n)).join(", ") + ".", { key: "pour" });
        return;
      }
      A.click(); vibe(10);
      const pt = elCenter(btn);
      if (!r.done) floater("🚧 " + Math.floor(p.frac * 100) + " %", pt.x, pt.y - 16, "var(--good)");
      render(true);
    }
    function stepBox(id, why, isTarget) {
      const st = S(), it = I[id];
      if (why === "pass") { const z = E.passPending().find((x) => E.ZONES[x].req === id); if (z) return '<div class="stepbox"><div class="tiny muted">' + WHY_STEP.pass + "</div>" + passHTML(z) + "</div>"; }
      let h = '<div class="stepbox">';
      if (!isTarget) h += '<div class="tiny muted">' + (WHY_STEP[why] || "Prochaine étape :") + '</div><div class="row" style="margin:4px 0">' + itemPill(id) + '</div>' + (it.h && !st.known[id] ? '<div class="riddle small">« ' + esc(it.h) + " »</div>" : "");
      if (!st.known[id]) {
        const lvl = st.hints[id] || 0;
        if (lvl >= 1) h += '<div class="memo">💭 L’action : ' + gesteChip(id) + "</div>";
        if (lvl >= 2) { const m = mainIngredient(id); h += '<div class="memo">💭 Une des ressources : ' + icon(m, "sm") + " " + esc(I[m].n) + "</div>"; }
      } else {
        const b = E.blocker(id);
        h += '<div class="rl small">' + gesteChip(id) + ingHTML(E.costFor(id), { check: true, link: true }) + "</div>";
        if (!b) h += '<div class="row wrap" style="margin-top:6px"><button class="btn small pri" data-chain="' + id + '">⚡ Fabriquer</button><button class="btn small" data-tree="' + id + '">🌳 Détail</button>' +
          (st.track && st.track.id === id ? "" : '<button class="btn small" data-track="' + id + '">🎯 Suivre</button>') + "</div>";
      }
      return h === '<div class="stepbox">' ? "" : h + "</div>";
    }

    /* la jauge des souvenirs : elle avance avec chaque combinaison nouvelle essayée */
    function memoryHTML(m, gain) {
      if (!m) return "";
      const f = Math.max(0, Math.min(1, (m.p - m.prev) / (m.next - m.prev)));
      const what = (["l’action", "une des ressources", "la recette entière"][m.lvl] || "") + (I[m.id] ? " de « " + I[m.id].n + " »" : "");
      return '<div class="memory"><div class="row between tiny"><span>💭 Souvenirs' + (gain ? ' <b class="gain">' + gain + "</b>" : "") + "</span><span class=\"muted\">prochain : " + what + "</span></div>" +
        '<div class="bar"><i style="width:' + (f * 100).toFixed(0) + '%"></i></div>' +
        (gain ? "" : '<div class="tiny dim">Chaque nouvelle combinaison tentée à l’Atelier réveille des souvenirs, surtout si elle se rapproche de ce que tu cherches.</div>') + "</div>";
    }
    function trackerHTML() {
      const t = S().track;
      if (!t || !I[t.id]) return "";
      const id = t.id, p = E.plan(id, 1);
      const ready = p.ok;
      let h = '<div class="card track' + (ready ? " ready" : "") + '"><div class="row between"><div class="lbl">🎯 Suivi d’artisanat</div><button class="btn small ghost" data-untrack title="Arrêter le suivi">✕</button></div>' +
        '<div class="row" style="margin:4px 0 6px">' + itemPill(id) + "</div>";
      if (E.queued(id) > 0) return h + '<div class="small">✋ En cours de fabrication…</div></div>';
      if (ready) return h + '<div class="small" style="color:var(--good);font-weight:600">✓ Toutes les ressources sont réunies !</div><button class="btn small pri ready-pulse" style="margin-top:6px;width:100%" data-chain="' + id + '">⚡ Fabriquer ' + esc(I[id].n) + '</button></div>';
      const f = E.flows();
      const cost = I[id].r ? E.costFor(id) : {};
      if (Object.keys(cost).length > 0) {
        h += '<div class="row wrap" style="gap:4px;margin-bottom:6px">' + Object.keys(cost).map((k) => {
          const have = S().inv[k] || 0, req = cost[k], ok = have >= req;
          return '<span class="ing ' + (ok ? "paid" : "lack") + '" data-goto="' + k + '">' + icon(k, "sm") + esc(I[k].n) + ' ' + fmt(have) + '/' + fmt(req) + (ok ? ' ✓' : '') + '</span>';
        }).join("") + '</div>';
      }
      Object.keys(p.missing).forEach((k) => {
        if (p.locked.includes(k) || p.blocked[k]) return;
        const need = p.missing[k];
        const have = Math.floor(S().inv[k] || 0);
        const net = E.rate(k) + (f.prod[k] || 0) - (f.cons[k] || 0);
        const eta = net > 0 ? "≈ " + fmtTime(need / net) : isRawGather(k) ? "à récolter" : "";
        h += '<div class="cost-row" data-goto="' + k + '">' + icon(k, "sm") + '<span class="grow">' + esc(I[k].n) + '</span><span class="tiny" style="color:var(--bad)">il manque ' + fmt(need) + '</span><span class="tiny muted eta">' + eta + "</span></div>";
        void have;
      });
      p.locked.forEach((k) => { h += '<div class="why" style="display:flex;align-items:center;gap:6px">Recette inconnue : ' + itemPill(k, { unk: true }) + "</div>"; });
      Object.keys(p.blocked).forEach((k) => { const b = p.blocked[k]; h += '<div class="why" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">' + itemPill(k) + " : " + needText(k, b, true) + "</div>"; });
      return h + "</div>";
    }

    function questChip() {
      const qBtn = $("#questBtn");
      if (!qBtn) return;
      const sum = E.questSummary();
      const qSub = $("#questSub");
      const qDot = $("#questDot");
      const rits = sum.rituals;
      const doneRits = rits.filter((r) => r.claimed).length;
      if (qSub) qSub.textContent = doneRits + "/3";
      if (qDot) {
        if (sum.hasReady) {
          qDot.classList.remove("hidden");
          qBtn.classList.add("ready");
        } else {
          qDot.classList.add("hidden");
          qBtn.classList.remove("ready");
        }
      }
    }

    /* les jours de présence : un compteur discret, jamais une série */
    function joursHTML() {
      const J = E.jours();
      if (!(J.n > 0)) return "";
      const c = J.cadeau, nx = E.jourProchain();
      const gift = c ? [c.intu ? c.intu + " ✨" : "", c.tr ? c.tr + " ✦" : ""].filter(Boolean).join(" et ") : "";
      return '<div class="jours"><b>Jour ' + J.n + "</b>" + (gift ? ' <span class="tiny muted">· ton cadeau : ' + gift + "</span>" : "") +
        (c && c.t ? '<div class="tiny muted"><i>' + esc(c.t) + "</i></div>" : "") +
        (nx ? '<div class="tiny dim">Un cadeau plus gros au jour ' + nx + ".</div>" : "") + "</div>";
    }
    function openQuestsModal(initialTab) {
      U.questTab = initialTab || U.questTab || "scenario";
      const makeHTML = () => {
        const sum = E.questSummary();
        const sc = sum.scenario;
        const rits = sum.rituals;
        const tq = sum.troqueur;
        const rep = E.troqueurRep();
        const tab = U.questTab;

        let h = '<h2>Quêtes</h2>';
        h += '<div class="quest-tabs">' +
          '<button class="' + (tab === "scenario" ? "on" : "") + '" data-mqtab="scenario">📜 Scénario' + (sc.ready ? ' <span class="qdot"></span>' : '') + '</button>' +
          '<button class="' + (tab === "rituals" ? "on" : "") + '" data-mqtab="rituals">🕯️ Rituels' + (sum.readyRitual ? ' <span class="qdot"></span>' : '') + '</button>' +
          '<button class="' + (tab === "troqueur" ? "on" : "") + '" data-mqtab="troqueur">⚖️ Troqueur' + (sum.payableAsk ? ' <span class="qdot"></span>' : '') + '</button>' +
          '</div>';

        if (tab === "scenario") {
          h += '<div class="quest-hero">' +
            '<div class="quest-chapter">' + esc(sc.chapter) + ' · ' + esc(sc.ageName) + '</div>' +
            '<div class="quest-titre">' + (sc.ob && sc.ob.n ? esc(sc.ob.n) : sc.targetId ? esc(I[sc.targetId].n) : "Objectif en cours") + '</div>' +
            (sc.txt ? '<div class="small muted" style="margin-bottom:8px"><i>« ' + esc(sc.txt) + ' »</i></div>' : '') +
            (sc.targetId ? '<div style="margin:8px 0">' + itemPill(sc.targetId) + '</div>' : '') +
            (sc.ready ? '<div class="small" style="color:var(--good);font-weight:600">✓ Prêt à fabriquer !</div><button class="btn pri" style="margin-top:8px;width:100%" data-m="qmake" data-id="' + sc.targetId + '">⚡ Fabriquer maintenant</button>'
              : sc.missKeys && sc.missKeys.length ? '<div class="small" style="display:flex;align-items:center;flex-wrap:wrap;gap:4px;margin-top:6px"><span class="muted">Il manque :</span> ' + sc.missKeys.map((k) => itemPill(k, { qty: sc.missing[k], lack: true })).join("") + '</div>' : '') +
            '</div>';
        } else if (tab === "rituals") {
          h += joursHTML();
          h += '<div class="small muted" style="margin-bottom:8px">Trois rituels renouvelés chaque jour. Réclame tes récompenses une fois les objectifs atteints :</div>';
          rits.forEach((r, idx) => {
            const pct = Math.min(100, Math.floor((r.prog / r.target) * 100));
            const rewTxt = r.reward.tr ? '+' + r.reward.tr + ' ✦ Traces' : r.reward.intu ? '+' + r.reward.intu + ' ✨ Intuition' : '+' + r.reward.ecus + ' écus';
            h += '<div class="ritual-card' + (r.done ? ' done' : '') + (r.claimed ? ' claimed' : '') + '">' +
              '<div class="ritual-head"><span class="ritual-ic">' + r.ic + '</span><div class="grow"><div class="ritual-title">' + esc(r.n) + '</div><div class="tiny muted">' + esc(r.d) + '</div></div>' +
              '<span class="reward-tag">' + rewTxt + '</span></div>' +
              '<div class="ritual-prog-bar"><i style="width:' + pct + '%"></i></div>' +
              '<div class="ritual-foot"><span class="tiny muted">' + fmt(r.prog) + ' / ' + fmt(r.target) + ' (' + pct + ' %)</span>' +
              (r.claimed ? '<span class="tiny" style="color:var(--good);font-weight:600">✓ Réclamé</span>'
                : r.done ? '<button class="btn small pri ready-pulse" data-m="claimrit" data-idx="' + idx + '">🎁 Réclamer</button>'
                : '<span class="tiny muted">En cours</span>') +
              '</div></div>';
          });
        } else if (tab === "troqueur") {
          h += '<div class="troqueur-rank">' +
            '<div class="troqueur-rank-name">⚖️ ' + esc(rep.cur.n) + ' (Rang ' + rep.cur.lvl + ')</div>' +
            '<div class="tiny muted">Contrats honorés : <b>' + rep.cnt + '</b>' + (rep.cur.bonus ? ' · +' + rep.cur.bonus + ' ✦ bonus par contrat' : '') + (rep.next ? ' · encore ' + (rep.next.req - rep.cnt) + ' pour ' + esc(rep.next.n) : ' · rang maximum') + '</div>' +
            '</div>';
          if (!E.comptoirOpen()) {
            h += '<p class="small muted center" style="padding:15px 0">Le Comptoir du Troqueur s’ouvrira lorsque tu auras atteint sa terre.</p>';
          } else if (!tq.length) {
            h += '<p class="small muted center" style="padding:15px 0">Aucune commande pour l’instant. Le Troqueur prépare de nouvelles demandes.</p>';
          } else {
            tq.forEach((ask, idx) => {
              if (!ask) return;
              const have = S().inv[ask.id] || 0, can = have >= ask.n;
              h += '<div class="contract-row">' +
                '<div class="row between"><div style="display:flex;align-items:center;gap:6px">' + itemPill(ask.id, { qty: ask.n }) + '</div><span class="small" style="font-weight:700;color:#ffd36b">+' + (ask.tr + (rep.cur.bonus || 0)) + ' ✦</span></div>' +
                '<div class="row between tiny" style="margin-top:4px"><span class="' + (can ? 'muted' : 'bad') + '">En réserve : ' + fmt(have) + ' / ' + fmt(ask.n) + '</span>' +
                '<button class="btn mini' + (can ? ' pri' : '') + '" data-m="delivask" data-idx="' + idx + '"' + (can ? '' : ' disabled') + '>Livrer</button></div>' +
                '</div>';
            });
          }
        }

        h += '<div class="acts" style="margin-top:12px"><button class="btn ghost" data-m="close">Fermer</button></div>';
        return h;
      };

      const modalObj = {
        html: makeHTML(),
        refresh: makeHTML,
        on: {
          claimrit: (b) => {
            const idx = Number(b.dataset.idx);
            const res = E.claimRitual(idx);
            if (res.ok) {
              A.secret ? A.secret() : A.click();
              vibe([20, 60, 20]);
              toast("🎁 Récompense de rituel obtenue !", { key: "rit" });
              save();
              render(true);
              swapModal(Object.assign(modalObj, { html: makeHTML() }));
            }
            return true;
          },
          delivask: (b) => {
            const idx = Number(b.dataset.idx);
            const res = E.deliverAsk(idx);
            if (res.ok) {
              A.click();
              vibe(15);
              toast("✦ +" + (res.ask.tr + (res.bonus || 0)) + " Traces !", { key: "troqueur" });
              save();
              render(true);
              swapModal(Object.assign(modalObj, { html: makeHTML() }));
            }
            return true;
          },
          qmake: (b) => {
            const id = b.dataset.id;
            closeModal();
            craftChain(id, 1);
            return true;
          }
        }
      };
      openModal(modalObj);
    }

    return { goalCard, goalSig, goalOpen, openMilestones, passHTML, pour, memoryHTML, trackerHTML, questChip, openQuestsModal };
  }

  window.EclatQuetes = { create };
})();
