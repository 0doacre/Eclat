/* ÉCLAT — le Domaine : tout ce qui produit, en une page qui défile.
 * Les terres ouvertes (la plus récente en premier) et leurs gisements, les chaînes
 * de machines, le passage en cours et le Grand Œuvre. Le moteur fait le calcul ;
 * ici on affiche, et on traduit les gestes du joueur en appels au moteur. */
(function () {
  "use strict";

  const CAPS = [0, 10, 50, 100, 200, 500, 1000, 5000, 20000, 100000];
  const SHOWN = 2; // terres dépliées d’office ; les plus anciennes se replient

  function create(api) {
    const { E, A, D, U, esc, fmt, fmtNum, fmtTime, icon, toast, openModal, closeModal, norm, vibe, floater, passHTML, render, quiet } = api;
    const I = D.ITEMS;
    const S = () => E.state;
    const perTime = (v) => (v >= 1 ? fmtNum(v) + "/s" : v * 60 >= 0.1 ? fmtNum(v * 60) + "/min" : fmtNum(v * 3600) + "/h");
    const plural = (n, w) => n + " " + w + (n > 1 ? "s" : "");
    /* « cabane de cueillette » → « cabanes » : le premier mot suffit dans une ligne */
    const shortName = (id, n) => { const w = I[id].n.split(/[ ’']/)[0].toLowerCase(); return n > 1 && !/[sx]$/.test(w) ? w + "s" : w; };

    /* ------------------------------------------------------------ données */
    function openZones() { return D.ZONES.filter((z) => E.zoneOpen(z.id)).map((z) => z.id); }
    /* un gisement se montre s’il se récolte à la main, s’il est exploité, ou si on connaît de quoi l’exploiter */
    function depShown(z, d) {
      if (d.hand || E.domExt(z, d.res)) return true;
      return E.extFor(d.res).some((t) => S().known[t] || E.count(t) >= 1);
    }
    function depRate(z, res) {
      const e = E.domExt(z, res);
      return e && E.machInfo(E.extKey(z, res)).s === "ok" ? E.extOut(e) : 0;
    }
    function zoneRate(z) { return E.zoneDeps(z).reduce((a, d) => a + depRate(z, d.res), 0); }

    /* ------------------------------------------------------------ la page */
    function view() {
      const st = S(), zs = openZones().reverse();
      let h = '<div class="dom">';
      h += api.top();
      if (Object.keys(st.known).length >= 5) h += '<div class="dom-bar"><button class="btn small ghost" data-roue>Fabriquer une pièce</button></div>';
      const tip = hint();
      if (tip) h += '<div class="dom-tip">' + tip + "</div>";
      const all = U.domAll || zs.length <= SHOWN + 1;
      zs.forEach((z, i) => { if (all || i < SHOWN || U.domOpen === z) h += terreHTML(z); });
      if (!all) {
        const rest = zs.filter((z, i) => i >= SHOWN && U.domOpen !== z);
        if (rest.length) {
          const r = rest.reduce((a, z) => a + zoneRate(z), 0);
          h += '<button class="dom-more" data-dall>' + plural(rest.length, "autre terre") + (r > 0 ? " · +" + perTime(r) + " en tout" : "") + '<span>ouvrir ▸</span></button>';
        }
      } else if (zs.length > SHOWN + 1) h += '<button class="dom-more" data-dall>Replier les terres anciennes<span>▴</span></button>';
      h += machinesHTML();
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

    function terreHTML(z) {
      const st = S(), Z = E.ZONES[z];
      const deps = E.zoneDeps(z).filter((d) => depShown(z, d));
      let h = '<section class="dom-terre" id="dt-' + z + '"><div class="dom-th"><h3>' + esc(Z.n) + "</h3>" + lieuHTML(z) + "</div>";
      deps.forEach((d) => { h += gisHTML(z, d); });
      if (!deps.some((d) => d.hand) && !deps.some((d) => E.domExt(z, d.res)) && deps.length) h += '<p class="tiny muted">Rien ne s’y ramasse à la main : il faut des extracteurs.</p>';
      void st;
      return h + "</section>";
    }
    /* le prochain lieu à explorer sur la terre, ou l’exploration en cours */
    function lieuHTML(z) {
      const st = S(), Z = E.ZONES[z], n = (Z.exps || []).length;
      if (!n) return "";
      const done = st.exp.done[z] || 0, act = st.exp.active;
      if (act && act.z === z) {
        const p = E.expProgress();
        return '<div class="dom-lieu"><span class="tiny">🧭 ' + esc(Z.exps[act.i].n) + ' · <b data-xl>' + (p ? fmtTime(p.left) : "") + '</b></span><div class="bar"><i data-xp style="width:' + (p ? (p.p * 100).toFixed(1) : 0) + '%"></i></div></div>';
      }
      const nx = E.nextExp(z);
      if (!nx) return '<span class="tiny muted">' + done + "/" + n + " lieux</span>";
      if (nx.locked) return '<span class="tiny muted">' + done + "/" + n + " lieux · 🔒 " + esc(nx.x.hidden ? "un lieu caché" : "il faut " + I[nx.x.need].n.toLowerCase()) + "</span>";
      return '<button class="btn small" data-exp="' + z + '">🧭 ' + esc(nx.x.hidden ? "???" : nx.x.n) + "</button>";
    }
    function gisHTML(z, d) {
      const st = S(), res = d.res, key = E.extKey(z, res), e = E.domExt(z, res);
      const ch = E.extChoice(res), q = E.domQueued("x:" + key);
      const info = E.machInfo(key), rate = depRate(z, res);
      const used = e ? Object.keys(e.u).map((t) => shortName(t, e.u[t]) + " ×" + e.u[t]).join(", ") : "";
      let sub = fmt(st.inv[res] || 0);
      sub = '<span data-c="' + res + '">' + sub + "</span> en réserve" + (used ? " · " + esc(used) : "") + (q ? " · " + q + " en fabrication" : "");
      const right = e && info.s === "off" ? '<span class="dom-rate off">en pause</span>'
        : rate > 0 ? '<span class="dom-rate" data-rate="' + key + '">+' + perTime(rate) + "</span>"
        : d.hand ? '<span class="dom-rate hand">à la main</span>' : "";
      let btns = "";
      if (ch) {
        const free = E.freeExt(ch.t), can = free >= 1 || E.plan(ch.t, 1).ok;
        btns = '<button class="mini' + (can ? "" : " nope") + '" data-xadd="' + key + '" data-n="1" title="' + esc(I[ch.t].n) + '" aria-label="Un extracteur de plus : ' + esc(I[ch.t].n) + '">+1</button>';
        if (e || free >= 2) btns += '<button class="mini' + (free >= 10 || E.plan(ch.t, 10 - Math.min(free, 9)).ok ? "" : " nope") + '" data-xadd="' + key + '" data-n="10" aria-label="Dix de plus">×10</button>';
      }
      return '<div class="gis" data-gis="' + key + '">' +
        '<button class="gis-ic' + (d.hand ? " hand" : "") + '"' + (d.hand ? ' data-harv="' + key + '" aria-label="Récolter : ' + esc(I[res].n) + '"' : ' tabindex="-1"') + ">" + icon(res) + "</button>" +
        '<div class="gis-body" data-gsheet="' + key + '"><div class="gis-l1"><b>' + esc(I[res].n) + "</b>" + right + "</div>" +
        '<div class="gis-l2 tiny muted">' + sub + "</div></div>" +
        (btns ? '<div class="gis-b">' + btns + "</div>" : "") + "</div>";
    }

    /* ------------------------------------------------------------ machines */
    const MST = {
      ok: "en marche", wait: "démarre", off: "en pause", norec: "sans recette", idle: "aucune machine",
      starved: "il lui manque des matières", cap: "stock visé atteint", blocked: "il manque une station"
    };
    function machLine(e) {
      const info = E.machInfo(e.id), it = I[e.r];
      if ((info.s === "ok" || info.s === "wait") && it) {
        const r = E.machRate(e);
        return "+" + perTime(r * it.r[2]) + " · prennent " + Object.keys(it.r[1]).map((k) => perTime(r * it.r[1][k]) + " " + esc(I[k].n.toLowerCase())).join(", ");
      }
      if (info.s === "starved" && info.miss) return "il manque : " + Object.keys(info.miss).map((k) => esc(I[k].n.toLowerCase())).join(", ");
      if (info.s === "cap") return "stock visé atteint (" + fmt(e.cap) + ")";
      if (info.s === "blocked" && info.b) return info.b.why === "heat" ? "il faut plus de chaleur" : "il manque la station";
      return MST[info.s] || "";
    }
    function machinesHTML() {
      const st = S(), ms = E.machines();
      const owned = E.MACHINES.filter((m) => ms[m].own > 0);
      if (!owned.length && !st.dom.mach.length) return "";
      let h = '<section class="dom-card dom-mach"><h3>Machines</h3>';
      st.dom.mach.forEach((e) => {
        const info = E.machInfo(e.id), lvl = info.s === "ok" || info.s === "wait" ? "good" : info.s === "off" || info.s === "cap" ? "dim" : "warn";
        h += '<div class="mrow" data-msheet="' + e.id + '">' + icon(e.r || e.m) +
          '<div class="grow"><div class="mrow-t"><b>' + e.n + " " + esc(shortName(e.m, e.n)) + "</b> → " + (I[e.r] ? esc(I[e.r].n) : '<i class="muted">choisir</i>') + "</div>" +
          '<div class="tiny ' + lvl + '" data-mline="' + e.id + '">' + machLine(e) + "</div></div>" +
          '<button class="mini" data-mn="' + e.id + '" data-v="-1" aria-label="Une machine de moins"' + (e.n > 1 ? "" : " disabled") + '>−</button><button class="mini' + (E.freeMach(e.m) >= 1 || E.plan(e.m, 1).ok ? "" : " nope") + '" data-mn="' + e.id + '" data-v="1" aria-label="Une machine de plus">+</button></div>';
      });
      const free = owned.filter((m) => E.freeMach(m) >= 1);
      if (free.length) h += '<button class="dom-free" data-mnew>' + free.map((m) => icon(m, "sm") + " " + E.freeMach(m) + " " + esc(shortName(m, E.freeMach(m)))).join(" · ") + " au repos<span>nouvelle chaîne ▸</span></button>";
      return h + "</section>";
    }

    /* ------------------------------------------------------------ Grand Œuvre */
    function oeuvreHTML(pid) {
      const P = D.PROJECTS[pid], ps = E.projState(pid), step = P.steps[ps.step], st = S(), on = E.siteOn(pid);
      let h = '<section class="dom-card dom-oeuvre"><h3>' + P.ic + " " + esc(P.n) + '</h3><div class="tiny muted">Étape ' + (ps.step + 1) + " sur " + P.steps.length + " · " + esc(step.n) + "</div>";
      if (step.cost) {
        h += Object.keys(step.cost).map((k) => {
          const paid = ps.paid[k] || 0;
          return '<div class="cost-row" data-goto="' + k + '">' + icon(k, "sm") + '<span class="grow">' + esc(I[k].n) + '</span><span class="tiny" data-sp="' + pid + ":" + k + '">' + fmt(paid) + " / " + fmt(step.cost[k]) +
            '</span><div class="bar"><i style="width:' + (100 * paid / step.cost[k]).toFixed(1) + '%"></i></div></div>';
        }).join("");
        if (step.need && !st.frags[step.need]) h += '<p class="why">Il faut d’abord atteindre ' + esc(D.FRAGS[step.need].n) + ".</p>";
        else h += '<div class="row wrap" style="margin-top:8px"><button class="btn small pri" data-contrib="' + pid + '">Verser</button>' +
          '<button class="btn small' + (on ? " on" : "") + '" data-feed="' + pid + '">' + (on ? "Alimenté ✓" : "Alimenter") + "</button>" +
          '<span class="tiny muted">' + (on ? "Il se sert seul dans la Réserve, " + fmtNum(E.siteRate()) + " par seconde et par matière au plus." : "Alimenté, il se sert seul dans la Réserve.") + "</span></div>";
      } else if (step.fire) h += '<p class="small">Tout est prêt. La décision se prend dans le Cosmos.</p>';
      else if (step.melody) h += '<p class="small">Il ne reste qu’à jouer <b>' + esc(D.MELODIES[step.melody].n) + "</b> sur la flûte (Journal).</p>";
      return h + "</section>";
    }

    /* ------------------------------------------------------------ production */
    function prodHTML() {
      const P = E.production().filter((x) => x.in > 1e-4 || x.out > 1e-4), st = S();
      if (!P.length) return "";
      return '<details class="dom-card dom-prod"' + (U.prodOpen ? " open" : "") + ' data-prod><summary>Tout ce qui entre et sort, par matière</summary>' +
        '<div class="u-pr u-ph tiny muted"><span class="grow">Matière</span><span>entre</span><span>sort</span><span>stock</span></div>' +
        P.slice(0, 30).map((x) => '<div class="u-pr" data-goto="' + x.id + '">' + icon(x.id, "sm") + '<span class="grow ell">' + esc(I[x.id].n) + "</span>" +
          "<b>" + (x.in > 1e-4 ? "+" + perTime(x.in) : "") + "</b><i>" + (x.out > 1e-4 ? "−" + perTime(x.out) : "") + '</i><span data-c="' + x.id + '">' + fmt(st.inv[x.id] || 0) + "</span></div>").join("") + "</details>";
    }

    /* ------------------------------------------------------------ conseils */
    function hint() {
      if (quiet && quiet()) return null; // le tutoriel parle déjà
      const st = S(), us = E.extUnits(), ms = E.machines();
      const exts = Object.keys(st.dom.ext).length, freeE = E.EXTS.filter((t) => us[t].own - us[t].used > 0);
      const vet = st.cycle > 1;
      if (!exts && !freeE.length && !st.dom.mach.length) return !vet && st.stats.taps < 20 ? "Touche l’icône du bois pour en ramasser. Garde le doigt appuyé : tu ramasses sans t’arrêter." : null;
      if (freeE.length && !st.flags.tip_freeExt) {
        const t = freeE[0], n = us[t].own - us[t].used;
        return "Tu as " + plural(n, esc(shortName(t, 1))) + " qui attend" + (n > 1 ? "ent" : "") + " : touche <b>+1</b> sur un gisement pour " + (n > 1 ? "les" : "la") + " poser. " +
          '<button class="btn small ghost" data-tip="tip_freeExt">Compris</button>';
      }
      const own = E.MACHINES.some((m) => ms[m].own > 0);
      if (own && !st.dom.mach.length) return "Ta machine attend : touche <b>nouvelle chaîne</b> et choisis ce qu’elle fabrique.";
      if (st.dom.mach.some((e) => !e.r)) return "Une de tes machines n’a pas de recette : touche-la pour en choisir une.";
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
            if (v > 0 && E.freeExt(t) < 1) feedback(E.domExtAdd(z, res, 1, t), t); else { E.domExtSet(z, res, t, cur + v); A.click(); }
            return redraw();
          },
          toggle: () => { E.domExtToggle(z, res); A.click(); return redraw(); },
          clear: () => { const x = E.domExt(z, res); if (x) Object.keys(x.u).forEach((t) => E.domExtSet(z, res, t, 0)); A.click(); render(true); }
        }
      });
    }
    function extHTML(key) {
      const i = key.indexOf(":"), z = key.slice(0, i), res = key.slice(i + 1);
      const e = E.domExt(z, res), us = E.extUnits(), info = E.machInfo(key), dep = E.zoneDeps(z).find((d) => d.res === res);
      const types = E.extFor(res).filter((t) => us[t].own > 0 || (e && e.u[t]) || S().known[t]);
      const rate = depRate(z, res);
      let h = '<div class="sheet-h">' + icon(res) + '<div class="grow"><h2>' + esc(I[res].n) + '</h2><div class="tiny muted">' + esc(E.ZONES[z].n) + "</div></div></div>";
      h += '<p class="small">' + (!e ? "Aucun extracteur ici pour l’instant." : info.s === "off" ? "En pause." : rate > 0 ? "Récolte " + perTime(rate) + ", même quand le jeu est fermé." : "Démarre…") + "</p>";
      if (types.length) {
        h += '<div class="sheet-rows">' + types.map((t) => {
          const own = us[t].own, free = own - us[t].used, cur = (e && e.u[t]) || 0;
          return '<div class="u-row">' + icon(t, "sm") + '<span class="grow small">' + esc(I[t].n) + '<br><span class="tiny muted">' + perTime(E.extRate(t, res)) + " chacun · " + plural(free, "libre") + "</span></span>" +
            '<button class="mini" data-m="eu" data-t="' + t + '" data-v="-1"' + (cur ? "" : " disabled") + ">−</button><b>" + cur + '</b><button class="mini" data-m="eu" data-t="' + t + '" data-v="1">+</button></div>';
        }).join("") + "</div>";
      } else h += '<p class="small muted">Aucun extracteur que tu connais ne sait récolter ça. Le Carnet te dira peut-être lequel chercher.</p>';
      if (dep && dep.hand) h += '<p class="tiny muted">Tu peux aussi récolter à la main : touche son icône dans le Domaine, ou garde le doigt dessus.</p>';
      h += '<div class="acts">' + (e ? '<button class="btn" data-m="toggle">' + (e.on ? "Pause" : "Reprendre") + '</button><button class="btn ghost" data-m="clear">Tout retirer</button>' : "") + '<button class="btn pri" data-m="close">Fermer</button></div>';
      return h;
    }
    /* ce qu’un « +1 » a fait : posé, mis aux mains, ou pourquoi rien */
    function feedback(r, t, at) {
      if (r.placed || r.queued) {
        A.click(); vibe(8);
        if (at) floater((r.placed ? "+" + r.placed + " " : "") + (r.queued ? "✋ " + r.queued : ""), at.x, at.y - 14, "var(--good)");
        if (r.queued && !r.placed) toast("✋ Tes mains fabriquent " + plural(r.queued, esc(shortName(t, 1))) + " : " + (r.queued > 1 ? "elles seront posées" : "elle sera posée") + " ici une fois finie" + (r.queued > 1 ? "s" : "") + ".", { key: "xq" });
        return;
      }
      A.fail(0);
      const miss = r.missing ? Object.keys(r.missing).map((k) => fmt(r.missing[k]) + " " + esc(I[k].n.toLowerCase())).join(", ") : "";
      toast(r.why === "full" ? "Tes mains sont déjà bien occupées : attends qu’une fabrication se termine." :
        r.why === "noext" ? "Tu ne connais encore aucun extracteur pour ça." :
          "Pas de quoi fabriquer " + esc(I[t].n.toLowerCase()) + (miss ? " : il manque " + miss : "") + ".", { key: "xq" });
    }
    function listPicker(title, sub, ids, cb) {
      openModal({
        html: "<h2>" + esc(title) + "</h2>" + (sub ? '<p class="small muted">' + sub + "</p>" : "") +
          '<div class="search"><input id="dpq" type="search" placeholder="Chercher…" autocomplete="off"></div>' +
          '<div class="picklist">' + ids.map((id) => '<button class="pick" data-m="pick" data-id="' + id + '" data-n="' + esc(norm(I[id].n)) + '">' + icon(id, "sm") +
            '<span class="grow">' + esc(I[id].n) + '</span><span class="tiny muted">' + esc(D.AGES[I[id].a].n.replace("Âge ", "")) + "</span></button>").join("") + "</div>" +
          '<div class="acts"><button class="btn" data-m="close">Annuler</button></div>',
        onOpen: (box) => {
          const inp = box.querySelector("#dpq");
          inp.addEventListener("input", () => {
            const q = norm(inp.value);
            box.querySelectorAll(".pick[data-n]").forEach((b) => b.classList.toggle("hidden", !!q && !b.dataset.n.includes(q)));
          });
        },
        on: { pick: (b) => cb(b.dataset.id || null) }
      });
    }
    const recipes = () => Object.keys(S().known).filter(E.automatable).sort((a, b) => I[b].a - I[a].a || I[a].n.localeCompare(I[b].n));
    function newChain(m) {
      listPicker("Que doit-elle fabriquer ?", "Les recettes que tu connais et qui se répètent. La machine se sert dans la Réserve et y range ce qu’elle fait.", recipes(), (id) => {
        const r = E.domMachAdd(id, m);
        if (!r.ok) { A.fail(0); toast("Aucune machine libre.", { key: "mq" }); return; }
        A.craft ? A.craft("usiner") : A.click();
        render(true);
      });
    }
    function machSheet(id) {
      const redraw = () => { const b = mbox(); if (!E.machById(id)) { closeModal(); render(true); return true; } if (b) b.innerHTML = machHTML(id); render(true); return true; };
      openModal({
        html: machHTML(id),
        onOpen: (box) => box.addEventListener("change", (ev) => {
          const s = ev.target.dataset.ms;
          if (!s || !U.mcur || U.mcur.mach !== id) return;
          if (s === "type") E.domMachSet(id, { m: ev.target.value });
          if (s === "cap") E.domMachSet(id, { cap: Number(ev.target.value) });
          A.click(); redraw();
        }),
        mach: id,
        on: {
          recipe: () => { setTimeout(() => listPicker("Que doit-elle fabriquer ?", "", recipes(), (r) => { E.domMachSet(id, { r }); A.craft ? A.craft("usiner") : A.click(); render(true); setTimeout(() => machSheet(id), 80); }), 60); },
          n: (b) => { more(id, Number(b.dataset.v)); return redraw(); },
          on: () => { const e = E.machById(id); E.domMachSet(id, { on: !e.on }); A.click(); return redraw(); },
          rm: () => { E.domMachRemove(id); A.click(); render(true); }
        }
      });
    }
    function machHTML(id) {
      const e = E.machById(id);
      if (!e) return "";
      const it = I[e.r], ms = E.machines(), info = E.machInfo(id);
      const types = E.MACHINES.filter((m) => ms[m].own > 0 || m === e.m);
      let h = '<div class="sheet-h">' + icon(e.m) + '<div class="grow"><h2>' + esc(I[e.m].n) + (e.n > 1 ? " ×" + e.n : "") + '</h2><div class="tiny muted">' + esc(machLine(e)) + "</div></div></div>";
      h += '<button class="u-recipe" data-m="recipe">' + (it ? icon(e.r) + '<span class="grow">' + esc(it.n) + "</span>" : '<span class="grow">Choisir une recette</span>') + "<span>▾</span></button>";
      if (it) h += '<div class="u-ins">' + Object.keys(it.r[1]).map((k) => '<span class="u-in' + (info.miss && info.miss[k] ? " no" : "") + '" data-goto="' + k + '">' + icon(k, "sm") + "<i>" + fmt(it.r[1][k]) + "</i></span>").join("") +
        '<span class="u-arrow">→</span><span class="u-in">' + icon(e.r, "sm") + "<i>" + fmt(it.r[2]) + "</i></span></div>";
      h += '<div class="u-row"><span class="tiny muted">Machines</span><button class="mini" data-m="n" data-v="-1"' + (e.n > 1 ? "" : " disabled") + ">−</button><b>" + e.n + '</b><button class="mini" data-m="n" data-v="1">+</button>' +
        (types.length > 1 ? '<select data-ms="type" aria-label="Type de machine">' + types.map((m) => '<option value="' + m + '"' + (m === e.m ? " selected" : "") + ">" + esc(I[m].n) + " (" + (ms[m].own - ms[m].used + (m === e.m ? e.n : 0)) + ")</option>").join("") + "</select>" : "") + "</div>" +
        '<div class="u-row"><span class="tiny muted">S’arrêter quand le stock atteint</span><select data-ms="cap" aria-label="Stock visé">' + CAPS.map((v) => '<option value="' + v + '"' + (v === e.cap ? " selected" : "") + ">" + (v ? fmt(v) : "jamais") + "</option>").join("") +
        (CAPS.includes(e.cap) ? "" : '<option value="' + e.cap + '" selected>' + fmt(e.cap) + "</option>") + "</select></div>";
      h += '<div class="acts"><button class="btn" data-m="on">' + (e.on ? "Pause" : "Reprendre") + '</button><button class="btn ghost" data-m="rm">Retirer</button><button class="btn pri" data-m="close">Fermer</button></div>';
      return h;
    }
    function more(id, v, at) {
      const e = E.machById(id);
      if (!e) return;
      if (v < 0) { E.domMachSet(id, { n: e.n - 1 }); A.click(); render(true); return; }
      const r = E.domMachMore(id, 1);
      if (r.added || r.queued) {
        A.click(); vibe(8);
        if (at) floater(r.added ? "+1" : "✋", at.x, at.y - 14, "var(--good)");
        if (r.queued) toast("✋ Tes mains fabriquent " + esc(I[e.m].n.toLowerCase()) + " : elle rejoindra la chaîne une fois finie.", { key: "mq" });
      } else feedback(r, e.m);
      render(true);
    }

    /* ------------------------------------------------------------ récolte à la main */
    let hold = null;
    function harvest(btn) {
      const key = btn.dataset.harv, i = key.indexOf(":"), z = key.slice(0, i), res = key.slice(i + 1);
      const n = E.tap(res, z);
      if (!n) return;
      A.tap(res); vibe(5);
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
        const ch = E.extChoice(res);
        if (!ch) return true;
        const r = E.domExtAdd(z, res, Number(b.dataset.n) || 1);
        const rc = b.getBoundingClientRect();
        feedback(r, ch.t, { x: rc.left + rc.width / 2, y: rc.top });
        render(true);
        return true;
      }
      if ((b = t.closest("[data-gsheet]"))) { A.click(); extSheet(b.dataset.gsheet); return true; }
      if ((b = t.closest("[data-mn]"))) { const rc = b.getBoundingClientRect(); more(b.dataset.mn, Number(b.dataset.v), { x: rc.left + rc.width / 2, y: rc.top }); return true; }
      if ((b = t.closest("[data-msheet]"))) { A.click(); machSheet(b.dataset.msheet); return true; }
      if (t.closest("[data-mnew]")) { A.click(); newChain(); return true; }
      if (t.closest("[data-dall]")) { U.domAll = !U.domAll; U.domOpen = null; A.click(); render(true); return true; }
      if ((b = t.closest("[data-feed]"))) {
        const pid = b.dataset.feed;
        E.domSite(pid, !E.siteOn(pid));
        A.click(); render(true);
        return true;
      }
      if ((b = t.closest("[data-contrib]"))) {
        const r = E.contribute(b.dataset.contrib);
        if (r.ok) { A.click(); vibe(10); } else { A.fail(0); toast("Rien à verser pour l’instant : la Réserve n’a aucune des matières demandées.", { key: "contrib" }); }
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
      root.querySelectorAll("[data-mline]").forEach((el) => { const e = E.machById(el.dataset.mline); if (e) el.textContent = machLine(e); });
      root.querySelectorAll("[data-sp]").forEach((el) => {
        const [pid, k] = el.dataset.sp.split(":"), P = D.PROJECTS[pid], ps = E.projState(pid), step = P && P.steps[ps.step];
        if (step && step.cost && step.cost[k]) el.textContent = fmt(ps.paid[k] || 0) + " / " + fmt(step.cost[k]);
      });
    }
    /* signature de ce qui change la mise en page : on ne redessine que si elle change */
    function sig() {
      const st = S(), ms = E.machines();
      return [openZones().join(), JSON.stringify(st.dom.ext), st.dom.mach.map((e) => e.id + e.r + e.n + e.on + e.m + E.machInfo(e.id).s).join(),
        Object.keys(st.dom.site).join(), E.EXTS.map((t) => E.freeExt(t)).join(), E.MACHINES.map((m) => ms[m].own).join(),
        st.hand.q.length, st.exp.active ? st.exp.active.z : "", E.passPending().join(), U.domAll, Object.values(st.dom.ext).map((e) => e.on).join()].join("|");
    }

    /* une terre précise : on la déplie et on la montre */
    function focusZone(z) {
      U.domOpen = z;
      render(true);
      setTimeout(() => { const el = document.getElementById("dt-" + z); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }, 30);
    }
    /* un extracteur ou une machine vient d’être fabriqué ailleurs (la Roue) : on le pose */
    function placeExt(t) {
      const r = E.domAutoExt(t);
      if (r) { toast(esc(I[t].n) + " posée sur " + esc(I[r.res].n.toLowerCase()) + " (" + esc(E.ZONES[r.z].n) + ").", { key: "xq" }); focusZone(r.z); }
      else toast(esc(I[t].n) + " : touche +1 sur le gisement de ton choix pour la poser.", { key: "xq" });
    }
    function placeMach(m) {
      const ex = S().dom.mach.find((e) => !e.r && e.m === m);
      if (ex) { machSheet(ex.id); return; }
      newChain(m);
    }

    /* « une machine pour ça » depuis une recette : une chaîne de plus, si une machine est libre */
    function chainFor(r) {
      const x = E.domMachAdd(r);
      if (x.ok) { toast("Nouvelle chaîne : " + esc(I[x.e.m].n.toLowerCase()) + " → " + esc(I[r].n.toLowerCase()) + ".", { key: "mq" }); render(true); return; }
      A.fail(0);
      toast(x.why === "nomach" ? "Il te faut une machine libre (un automate de bois, pour commencer)." : "Cette recette ne se confie pas à une machine.", { key: "mq" });
    }

    return { view, live, sig, click, down, up, focusZone, placeExt, placeMach, chainFor, extSheet, machSheet };
  }

  window.EclatDomaine = { create };
})();
