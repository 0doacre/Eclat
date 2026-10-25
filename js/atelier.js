/* ÉCLAT — l’Atelier et le Carnet.
 * L’établi (gestes, emplacements, matières, résultat), le Carnet et les Machines ;
 * l’œuvre et les commandes, les mains, l’action qui tourne, les niveaux des gestes ;
 * les fiches d’objets et l’arbre de fabrication. */
(function () {
  "use strict";

  function create(api) {
    const {
      E, A, D, U, Dom, Tuto, esc, norm, fmt, fmtTime, fmtHeat, perMin, cap1, needText, limitHTML, zoneName, GI, gi, gIc, icon,
      iconize, itemPill, TYPE, TYPE_HINT, badgeHTML, itD, descHTML, fxList, fxText, ingHTML, gesteChip, mainIngredient,
      floater, sparks, fete, elCenter, toast, vibe, openModal, closeModal, swapModal, render, save, setTab, subTabs,
      uiSigne, memoryHTML
    } = api;
    const S = () => E.state;
    const I = D.ITEMS;
    const $ = (s, r) => (r || document).querySelector(s);

    /* ------------------------------------------------------------ ATELIER */
    /* l’étape clé de l’objectif, quand sa recette reste à trouver : la piste déjà donnée dans le Domaine (rien de plus) reste sous les yeux à l’établi */
    function goalHint() {
      const g = E.guide();
      if (!g || g.ob.k !== "craft") return "";
      const id = g.step, it = I[id], lvl = S().hints[id] || 0;
      if (!it || S().known[id]) return "";
      return '<div class="card acc goal-hint"><div class="small"><span class="step-badge">✦ Étape clé</span> ' + (it.h ? "<i>« " + esc(it.h) + " »</i>" : "<b>Une recette nouvelle</b>") + "</div>" +
        (lvl >= 1 ? '<div class="tiny muted">💭 L’action : ' + gesteChip(id) + "</div>" : "") +
        (lvl >= 2 ? '<div class="tiny muted">💭 Une des ressources : ' + icon(mainIngredient(id), "sm") + " " + esc(I[mainIngredient(id)].n) + "</div>" : "") + "</div>";
    }
    function viewAtelier() {
      const st = S();
      let h = subTabs("atelier", "machines", "Découvrir", "Machines");
      if (!E.gesteOK(U.geste)) U.geste = "tailler";
      if (!(st.stats.crafts > 0) && !Tuto.active()) h += '<div class="tip">1. Choisis une <b>action</b>. 2. Touche des <b>ressources</b> pour les poser sur l’établi. 3. Touche le <b>gros bouton</b>. Pour commencer : <b>Tailler</b> + <b>Bois</b>.</div>';
      // Le premier essai reste possible sans un aller-retour au Domaine.
      const firstWood = I.manche.r[1].bois;
      if (!(st.stats.crafts > 0) && E.count("bois") < firstWood) {
        const gathering = st.act && st.act.k === "harv" && st.act.res === "bois";
        h += '<div class="tip starter-harvest">' + (gathering
          ? 'Le bois arrive : ' + fmt(E.count("bois")) + '/' + firstWood + '. Attends d’en avoir ' + firstWood + ', touche sa tuile ci-dessous, puis <b>Tailler</b>.'
          : '<span>Il te faut ' + firstWood + ' bois pour commencer.</span><button class="btn pri" data-hloop="lisiere:bois">▶ Récolter du bois</button>') + '</div>';
      }
      h += goalHint();
      // l’explication des niveaux se lit une fois ; ensuite le bouton « Niveaux » rejoint l’établi et ne prend plus de ligne
      const niveauxTip = st.stats.crafts > 0 && !st.flags.tip_niveaux;
      if (niveauxTip) h += '<div class="sub-row"><span class="tiny muted">Le petit chiffre sur chaque action est son niveau. Il monte quand tu fabriques à la main.</span><button class="btn small ghost" data-skills>Niveaux</button><button class="btn small ghost" data-tip="tip_niveaux">Compris</button></div>';
      h += pinsHTML();
      h += '<div class="gestes">';
      let locks = 0;
      for (const g of D.GESTE_ORDER) {
        const G = D.GESTES[g];
        if (!E.gesteOK(g)) {
          if (G.secret || locks >= 1) continue; // une seule case « ??? » : assez pour annoncer la suite
          locks++;
          h += '<button class="geste lock" data-lock="' + g + '"><span class="gi">?</span><span class="gn">???</span></button>';
          continue;
        }
        h += '<button class="geste' + (U.geste === g ? " on" : "") + (G.secret ? " secret" : "") + '" data-g="' + g + '"><span class="gi">' + gIc(g) + '</span><span class="gn">' + G.n + "</span>" + (st.stats.crafts > 0 ? '<i class="glv">' + E.skill(g).lvl + "</i>" : "") + "</button>";
      }
      h += "</div>";
      const G = D.GESTES[U.geste];
      let heat = G.d;
      if (U.geste === "chauffer" || U.geste === "allier") heat = "🌡️ Ta meilleure chaleur : " + fmtHeat(E.heat());
      else if ((U.geste === "marteler" || U.geste === "electriser") && E.level(U.geste) > 1) heat = G.d + " (niveau " + E.level(U.geste) + ")";
      const mat = st.age >= 9 ? " m-labo" : st.age >= 6 ? " m-metal" : st.age >= 3 ? " m-pierre" : "";
      h += '<div class="card bench' + mat + '" id="bench"><div class="heat small"><span>' + esc(heat) + "</span>" +
        (st.stats.crafts > 0 && !niveauxTip ? '<button class="bench-clear" data-skills>Niveaux</button>' : "") +
        (U.slots.some(Boolean) ? '<button class="bench-clear" data-clear aria-label="Vider l’établi">✕ Vider</button>' : "") + '</div><div class="slots">';
      U.slots.forEach((id, i) => {
        if (i) h += '<span class="plus-sep">+</span>';
        if (id) h += '<button class="slot full" data-slot="' + i + '">' + icon(id) + '<span class="sn">' + esc(I[id].n) + '</span><span class="tiny muted" data-c="' + id + '">' + fmt(st.inv[id] || 0) + "</span></button>";
        else h += '<button class="slot" data-slot="' + i + '"><span class="plus">+</span></button>';
      });
      // le signe gravé sur le bouton reste à toucher même quand le bouton attend des ressources
      const mark = uiSigne("fabriquer", "L’Atelier");
      h += '</div><div class="forge-wrap"><button class="forge-btn" id="forge">' + gIc(U.geste) + " " + G.n.toUpperCase() + "</button>" +
        (mark ? '<span class="forge-mark">' + mark + "</span>" : "") + "</div></div>";
      h += '<div id="mbench" class="mbench hidden"><span class="mg">' + gIc(U.geste) + "</span>" +
        U.slots.map((id, i) => '<button class="mslot" data-slot="' + i + '">' + (id ? icon(id, "sm") : "+") + "</button>").join("") +
        '<button class="mforge" data-forge>' + gIc(U.geste) + " " + esc(G.n) + "</button></div>";
      h += '<div class="card result" id="result">' + resultHTML() + "</div>";
      const sugg = E.knownWith(U.slots).filter((id) => !(U.last && U.last.id === id)).slice(0, 6);
      if (sugg.length) {
        h += '<h3 class="sub">Recettes connues avec ces ressources</h3><div class="pins">' + sugg.map(quickRow).join("") + "</div>";
      }
      const o = invOpts();
      const counts = invCounts();
      // recherche, tri et filtres quand il y a de quoi chercher
      const many = Object.keys(st.seen).length >= 8 || !!U.iq || o.filter !== "tout";
      const totalStock = Object.keys(st.inv).reduce((acc, k) => acc + (st.inv[k] || 0), 0);
      const inv = invItems();
      h += '<div class="sub-row"><h3 class="sub">Tes ressources</h3>' +
        (many ? '<span class="tiny muted">' + inv.length + (inv.length > 1 ? " ressources" : " ressource") + " · " + fmt(totalStock) + " au total</span>" : "") +
        "</div>" + studyAllHTML() +
        (many ? '<div class="inv-tools"><div class="search"><input id="iq" type="search" placeholder="Chercher une ressource…" value="' + esc(U.iq || "") + '" autocomplete="off" spellcheck="false">' +
        (U.iq ? '<button class="search-clear" data-clear-search="iq" aria-label="Effacer">✕</button>' : "") + '</div>' +
        '<select id="isort" aria-label="Trier">' + INV_SORTS.map(([k, n]) => '<option value="' + k + '"' + (o.sort === k ? " selected" : "") + ">" + n + "</option>").join("") + "</select></div>" +
        '<div class="filters">' + INV_FILTERS.map(([k, n, ic]) => {
          const cnt = counts[k] || 0;
          return '<button data-if="' + k + '" class="' + (o.filter === k ? "on" : "") + '">' + (ic ? ic + " " : "") + n + '<span class="f-cnt">' + cnt + "</span></button>";
        }).join("") + "</div>" : "");
      const flows = E.flows();
      const tile = (id) => {
        const sel = U.slots.includes(id), fav = favs()[id];
        const rxs = st.studied[id] && E.reactions(id), rx = rxs && rxs[U.geste];
        const spent = rxs && !Object.keys(rxs).length;
        const inR = E.rate(id) + (flows.prod[id] || 0);
        const outR = flows.cons[id] || 0;
        const net = inR - outR;
        const hasFlow = Math.abs(net) >= 1e-4;
        const flowCls = net > 1e-4 ? " pos" : net < -1e-4 ? " neg" : "";
        const flowTxt = net > 1e-4 ? "+" + perMin(net) : net < -1e-4 ? "-" + perMin(-net) : "";
        return '<button class="inv' + (sel ? " sel" : "") + (st.inv[id] >= 1 ? "" : " zero") + (I[id].t === "relic" ? " relic" : "") + (spent ? " spent" : "") + '" data-inv="' + id + '"' + (spent ? ' title="Plus rien à trouver avec cette ressource, pour l’instant"' : "") + ">" +
          (fav ? '<i class="fav">♥</i>' : "") +
          (rx ? '<i class="rx" title="Réagit avec cette action">✦' + (rx > 1 ? rx : "") + "</i>" : "") +
          icon(id) +
          '<span class="c" data-c="' + id + '">' + fmt(st.inv[id] || 0) + '</span>' +
          '<span class="c-flow' + flowCls + (hasFlow ? "" : " hidden") + '" data-flow="' + id + '">' + flowTxt + '</span>' +
          '<span class="n">' + esc(I[id].n) + "</span></button>";
      };
      if (!many) h += '<div class="inv-grid">' + inv.map(tile).join("") + "</div>";
      else if (o.sort === "age" && !U.iq) {
        // rangées par âge, les favorites en tête
        const groups = {};
        inv.forEach((id) => { const k = favs()[id] ? -1 : I[id].a; (groups[k] = groups[k] || []).push(id); });
        Object.keys(groups).map(Number).sort((a, b) => a - b).forEach((k) => {
          h += '<div class="inv-age">' + (k < 0 ? "♥ Favorites" : esc(D.AGES[k].n)) + '</div><div class="inv-grid">' + groups[k].map(tile).join("") + "</div>";
        });
      } else h += '<div class="inv-grid">' + inv.map(tile).join("") + "</div>";
      if (!inv.length) {
        const emptyMsg = o.filter === "fav" ? "Aucune ressource favorite. Appui long sur une ressource pour la marquer d’un ♥."
          : o.filter === "flow" ? "Aucun flux actif en ce moment. Pose des extracteurs ou lance des machines."
          : (U.iq || o.filter !== "tout" ? "Rien ne correspond." : !(st.stats.crafts > 0) ? "Le bois récolté apparaîtra ici." : "Rien ici. Va récolter dans le Domaine.");
        h += '<p class="small muted center" style="padding:16px 0">' + emptyMsg + "</p>";
      } else if (Object.keys(st.known).length >= 3) h += '<p class="tiny dim center" style="margin-top:8px">Appui long sur une ressource : ouvre sa fiche (♥ pour la garder en tête de liste, 🔍 pour l’étudier). Une ressource étudiée porte un ✦ quand elle réagit avec l’action choisie, et pâlit quand elle n’a plus rien à donner.</p>';
      return h;
    }
    /* Étudier tout : une ligne au-dessus des ressources tant qu’il en reste deux à étudier. */
    function studyAllHTML() {
      const st = S(), sa = E.studyAllCost();
      if (sa.n < 2 || Object.keys(st.studied).length < 1) return "";
      const lack = st.intu < sa.c;
      return '<div class="study-all"><button class="btn small" data-study-all' + (lack ? " disabled" : "") + '>🔍 Étudier tout · ✨' + fmt(sa.c) + '</button><span class="tiny muted">' +
        (lack ? "Il te manque " + fmt(sa.c - st.intu) + " ✨ pour étudier les " + sa.n + " ressources." : sa.n + " ressources pas encore étudiées. Ensuite, le filtre 🔍 À tenter montre celles qui servent encore.") + "</span></div>";
    }
    const INV_SORTS = [
      ["age", "Par âge"],
      ["qty", "Plus nombreuses"],
      ["flow", "⚡ Flux actifs"],
      ["deficit", "⚠️ En déficit"],
      ["name", "Nom (A → Z)"],
      ["new", "Dernières trouvées"]
    ];
    const INV_FILTERS = [
      ["tout", "Tout", ""],
      ["flow", "En flux", "⚡"],
      ["res", "Brutes", "🪨"],
      ["comp", "Pièces", "⚙️"],
      ["geste", "Action", "✦"],
      ["fav", "Favoris", "♥"],
      ["new", "Inutilisées", "✨"],
      ["try", "À tenter", "🔍"]
    ];
    function invCounts() {
      const st = S(), fv = favs(), flows = E.flows();
      const used = {}, forG = {};
      for (const id in st.known) {
        const r = I[id] && I[id].r;
        if (!r) continue;
        for (const i in r[1]) { used[i] = true; if (r[0] === U.geste) forG[i] = true; }
      }
      const all = Array.from(new Set(Object.keys(st.inv).concat(Object.keys(st.seen)))).filter((id) => {
        const it = I[id];
        return it && (st.inv[id] >= 1 || st.seen[id]) && !E.isUnique(it) && !E.isScaled(it);
      });
      const c = { tout: all.length, flow: 0, res: 0, comp: 0, geste: 0, fav: 0, new: 0, try: 0 };
      for (const id of all) {
        const it = I[id];
        const hasFlow = (E.rate(id) + (flows.prod[id] || 0) > 1e-4) || ((flows.cons[id] || 0) > 1e-4);
        if (hasFlow) c.flow++;
        if (it.t === "res") c.res++;
        else c.comp++;
        if (forG[id]) c.geste++;
        if (fv[id]) c.fav++;
        if (!used[id]) c.new++;
        if (st.studied[id] && E.usesLeft(id)) c.try++;
      }
      return c;
    }
    const invOpts = () => Object.assign({ sort: "age", filter: U.invFilter || "tout" }, S().settings.inv, { filter: U.invFilter || (S().settings.inv && S().settings.inv.filter) || "tout" });
    const favs = () => S().settings.favs || (S().settings.favs = {});
    function quickRow(id) {
      const st = S(), it = I[id];
      const uniq = E.isUnique(it), owned = uniq && st.made[id] > 0;
      return '<div class="pin">' + icon(id, "sm") + '<span class="grow pn link-txt" data-goto="' + id + '">' + esc(it.n) + (uniq ? "" : ' <span class="tiny muted" data-c="' + id + '">' + fmt(st.inv[id] || 0) + "</span>") + "</span>" +
        (owned ? '<span class="tiny muted">✓ possédé</span>' : '<button class="btn small" data-cr="' + id + '" data-n="1">' + "Fabriquer" + "</button>") + "</div>";
    }
    function pinsHTML() {
      const ids = Object.keys(S().pins).filter((id) => I[id] && I[id].r && S().known[id]);
      if (!ids.length) return "";
      return '<h3 class="sub" style="margin-top:4px">★ Épinglées</h3><div class="pins">' + ids.map(quickRow).join("") + "</div>";
    }
    function invItems() {
      const st = S(), o = invOpts(), q = norm(U.iq || ""), fv = favs();
      const flows = E.flows();
      const inRate = (id) => E.rate(id) + (flows.prod[id] || 0);
      const outRate = (id) => flows.cons[id] || 0;
      const netRate = (id) => inRate(id) - outRate(id);
      const actFlow = (id) => inRate(id) + outRate(id);

      const used = {}, forG = {};
      for (const id in st.known) {
        const r = I[id] && I[id].r;
        if (!r) continue;
        for (const i in r[1]) { used[i] = true; if (r[0] === U.geste) forG[i] = true; }
      }
      const byAge = (a, b) => I[a].a - I[b].a || (I[a].t === "res" ? -1 : 0) - (I[b].t === "res" ? -1 : 0) || I[a].n.localeCompare(I[b].n);
      const sorts = {
        age: byAge,
        name: (a, b) => I[a].n.localeCompare(I[b].n),
        qty: (a, b) => (st.inv[b] || 0) - (st.inv[a] || 0) || byAge(a, b),
        flow: (a, b) => actFlow(b) - actFlow(a) || Math.abs(netRate(b)) - Math.abs(netRate(a)) || byAge(a, b),
        deficit: (a, b) => {
          const netA = netRate(a), netB = netRate(b);
          const defA = netA < -1e-4 ? 1 : (outRate(a) > 0 && (st.inv[a] || 0) < 10 ? 0.5 : 0);
          const defB = netB < -1e-4 ? 1 : (outRate(b) > 0 && (st.inv[b] || 0) < 10 ? 0.5 : 0);
          if (defB !== defA) return defB - defA;
          if (netA !== netB) return netA - netB;
          return (st.inv[a] || 0) - (st.inv[b] || 0) || byAge(a, b);
        },
        new: (a, b) => (+st.seen[b] || 0) - (+st.seen[a] || 0) || byAge(b, a)
      };
      // une matière déjà eue reste dans la liste à 0 : sa place ne bouge pas, et on peut encore la poser sur l’établi
      // (une recette comprise propose alors de fabriquer ce qui manque)
      return Array.from(new Set(Object.keys(st.inv).concat(Object.keys(st.seen)))).filter((id) => {
        const it = I[id];
        if (!it || !(st.inv[id] >= 1 || st.seen[id])) return false;
        if (E.isUnique(it) || E.isScaled(it)) return false;
        if (q && !norm(it.n).includes(q)) return false;
        if (o.filter === "fav") return !!fv[id];
        if (o.filter === "flow") return inRate(id) > 1e-4 || outRate(id) > 1e-4;
        if (o.filter === "geste") return !!forG[id];
        if (o.filter === "res") return it.t === "res";
        if (o.filter === "comp") return it.t !== "res";
        if (o.filter === "new") return !used[id];
        if (o.filter === "try") return !!st.studied[id] && E.usesLeft(id) > 0;
        return true;
      }).sort((a, b) => (o.sort !== "age" ? (fv[b] ? 1 : 0) - (fv[a] ? 1 : 0) : 0) || (sorts[o.sort] || byAge)(a, b));
    }
    const WHY = {
      froid: "Rien à façonner avec cette combinaison pour l’instant.",
      frais: "L’une de ces ressources s’emploie ailleurs, avec une autre action ou d’autres ressources.",
      tiede: "Cette action et ces ressources s’accordent bien. Cherche encore.",
      manque: "Bonne action, mais il manque une ressource.",
      trop: "Bonne action, mais l’une de ces ressources est superflue.",
      geste: "Les bonnes ressources, mais pas la bonne action."
    };
    function thermo(t) {
      const T = D.TEMPS[t];
      return '<div class="thermo"><div class="row between"><span class="tname" style="color:' + T.c + '">' + T.n + '</span></div><div class="tbar"><i class="tmark" style="left:' +
        (6 + t * 22) + '%"></i></div></div>';
    }
    function resultHTML() {
      const r = U.last;
      if (!r && S().stats.crafts >= 3) return ""; // déjà appris : la carte vide ne garde pas sa place (voir .result:empty)
      if (!r) return '<p class="small muted">Choisis une action, pose jusqu’à trois ressources, puis touche le gros bouton. Le <b>thermomètre</b> dit si tu t’approches d’une recette.</p>';
      if (r.kind === "craft") {
        const it = I[r.id];
        let h = '<div class="row" style="align-items:flex-start">' + icon(r.id, "lg") + '<div class="grow">' +
          (r.fresh ? '<span class="new">Nouvelle découverte</span>' : "") +
          '<div class="rname">' + esc(it.n) + (E.isUnique(it) ? "" : " <span class='muted'>+" + fmt(r.n) + "</span>") + (r.bonus ? ' <span class="small" style="color:var(--intu)">★ chef-d’œuvre +' + fmt(r.bonus) + "</span>" : "") + "</div>" +
          descHTML(it) + (fxText(r.id) ? '<div class="small" style="color:var(--good);margin-top:4px">' + esc(fxText(r.id)) + "</div>" : "") + "</div></div>";
        if (!E.isUnique(it)) {
          h += '<div class="row wrap" style="margin-top:10px"><span class="small muted">' + gesteChip(r.id) + "</span>" + ingHTML(E.costFor(r.id), { check: true, link: true }) + "</div>";
          h += '<div class="row wrap" style="margin-top:8px">' + craftBtns(r.id) + "</div>";
        }
        return h;
      }
      if (r.kind === "learn") {
        // la carte suit ce qui se passe ensuite : en route dans tes mains, fabriqué, ou ce qui manque encore
        const made = (S().made[r.id] || 0) - (r.made0 || 0), q = E.queued(r.id);
        if (made > 0 && !q) { U.last = { kind: "craft", id: r.id, n: made, fresh: !r.made0 }; return resultHTML(); }
        const miss = q ? null : E.missingFor(r.id, 1);
        const head = '<div class="row">' + icon(r.id, "lg") + '<div class="grow">' + (r.fresh ? '<span class="new">Recette trouvée</span>' : "") + '<div class="rname">' + esc(I[r.id].n) + "</div>";
        if (q) return head + '<div class="small">✋ Tes mains s’y mettent. La recette est dans tes commandes.</div></div></div>';
        // tout est là : le prix est affiché avant de fabriquer (une découverte ne prend jamais un gros stock d’office)
        if (!miss) return head + descHTML(I[r.id]) + (fxText(r.id) ? '<div class="small" style="color:var(--good);margin-top:4px">' + esc(fxText(r.id)) + "</div>" : "") +
          '<div class="row wrap small" style="margin-top:8px"><span class="muted">Tu as tout ce qu’il faut. Il te faut :</span>' + ingHTML(E.costFor(r.id), { check: true, link: true }) + "</div>" +
          '<div class="row wrap" style="margin-top:8px">' + craftBtns(r.id) + "</div></div></div>";
        return head + '<div class="small">Tu connais la recette, mais il te manque :</div><div class="row wrap small" style="margin-top:4px;gap:4px">' +
          Object.keys(miss).map((i) => itemPill(i, { qty: miss[i], lack: true })).join("") + "</div>" +
          '<div class="row wrap" style="margin-top:8px"><button class="btn small pri" data-chain="' + r.id + '">⚡ Tout fabriquer</button><button class="btn small" data-tree="' + r.id + '">🌳 Détail</button><button class="btn small" data-track="' + r.id + '">🎯 Suivre</button></div></div></div>';
      }
      if (r.kind === "blocked") {
        const b = r.info;
        let msg = "Il te manque un outil.";
        if (b.why === "heat") msg = "Tu chauffes, mais rien ne prend. Il faut au moins " + fmtHeat(b.heat) + " (tu atteins " + fmtHeat(E.heat()) + ").";
        if (b.why === "lvl") msg = U.geste === "marteler" ? "Ton enclume n’est pas assez dure pour ce métal." : "Il faudrait bien plus de puissance.";
        const st = b.why === "heat" ? E.stationFor("chauffer", b.heat) : b.why === "lvl" ? E.stationFor(I[r.id].r[0], 0, b.lvl) : null;
        return thermo(4) + '<div class="row" style="margin-top:6px">' + icon(r.id) + '<div class="grow"><b>' + esc(I[r.id].n) + '</b><div class="small">' + esc(msg) + "</div>" +
          (st ? '<div class="small" style="display:flex;align-items:center;gap:6px;margin-top:4px">Il te faudrait : ' + itemPill(st) + "</div>" : "") +
          (r.fresh ? '<div class="tiny muted">Recette notée dans le Carnet.</div>' : "") + "</div></div>";
      }
      if (r.kind === "owned") return '<p class="small">Tu possèdes déjà <b>' + esc(I[r.id].n) + "</b>.</p>";
      if (r.kind === "queued" || r.kind === "busy") {
        const it = I[r.id];
        const done = r.kind === "queued" && !E.queued(r.id);
        const msg = done ? "✓ Fabriqué : la pièce est rangée dans ta Réserve."
          : r.kind === "queued" ? "✋ Tes mains s’y mettent. Fini dans " + fmtTime(r.time) + "."
          : r.why === "full" ? "Tes mains sont occupées. Attends la fin de la commande en cours."
          : r.why === "queued" ? "Déjà en cours." : "Impossible pour l’instant.";
        return '<div class="row" style="align-items:flex-start">' + icon(r.id, "lg") + '<div class="grow"><div class="rname">' + esc(it.n) + '</div><div class="small">' + msg + "</div>" +
          (E.isUnique(it) ? "" : '<div class="row wrap" style="margin-top:8px">' + craftBtns(r.id) + "</div>") + "</div></div>";
      }
      if (r.kind === "fail") {
        const m = E.memory();
        return thermo(r.temp) + '<p class="small" style="margin-top:8px">' + esc(r.msg) + '</p><p class="tiny muted">' + WHY[r.why] + "</p>" +
          (r.sec ? '<p class="small sec-heat">Une chaleur étrange : ce mélange cache quelque chose.</p>' : "") +
          (r.mem ? memoryHTML(m, "+" + r.mem) : m && !r.mem ? '<p class="tiny dim">Tu avais déjà tenté cette combinaison : aucun souvenir ne revient.</p>' : "");
      }
      return "";
    }
    function craftBtns(id) {
      const it = I[id];
      if (E.isUnique(it)) return '<button class="btn small pri" data-cr="' + id + '" data-n="1">Fabriquer</button>';
      // le prix d’un extracteur ou d’une machine monte à chaque exemplaire : pas de ×1000
      const sizes = E.isScaled(it) ? [10] : (D.COMMANDES && D.COMMANDES.sizes) || [10, 50, 100, 1000];
      const lbl = E.isScaled(it) ? "Construire" : "Fabriquer";
      return '<button class="btn small pri" data-cr="' + id + '" data-n="1">' + lbl + "</button>" +
        sizes.map((sz) => '<button class="btn small" data-cr="' + id + '" data-n="' + sz + '">×' + sz + "</button>").join("") +
        '<button class="btn small" data-cr="' + id + '" data-n="max">Max</button>';
    }

    /* ------------------------------------------------------------ CARNET */
    function viewCarnet() {
      const st = S();
      const book = E.carnet();
      let known = 0, total = 0;
      book.forEach((s) => s.ids.forEach((id) => { if (!I[id].sec) { total++; if (st.known[id]) known++; } }));
      let h = '<h2 class="title">Carnet</h2>';
      if (!st.flags.tip_carnet) h += '<div class="tip">Le Carnet garde toutes tes recettes. <b>Fabriquer, ×10, ×50, ×100, ×1000, Max</b> lancent une commande : les pièces qui manquent sont fabriquées aussi, et tes machines t’aident. 🎯 <b>Suivre</b> montre ce qui manque en haut du Domaine. <button class="btn small ghost" data-tip="tip_carnet">Compris</button></div>';
      // le compte suit les âges à ta portée ; après une relève, le Carnet entier reste acquis (« en tout »)
      const all = Object.keys(st.known).filter((id) => I[id] && I[id].r && !I[id].sec).length;
      h += '<p class="small muted">' + known + (known > 1 ? " recettes découvertes" : " recette découverte") + " sur " + total + " jusqu’à cet âge" + (all > known ? " · " + all + " dans ton Carnet en tout" : "") + "</p>";
      h += '<div class="search"><input id="cq" type="search" placeholder="Chercher une recette ou une ressource…" value="' + esc(U.q || "") + '" autocomplete="off" spellcheck="false">' +
        (U.q ? '<button class="search-clear" data-clear-search="cq" aria-label="Effacer">✕</button>' : '') + '</div>';
      h += '<div class="filters">' + [["tout", "Tout"], ["pret", "⚡ Prêtes"], ["craft", "Réalisables"], ["unk", "À découvrir"], ["prod", "Équipement"], ["pin", "★ Épinglées"]].map(([k, n]) =>
        '<button data-cf="' + k + '" class="' + (U.carnetFilter === k ? "on" : "") + '">' + n + "</button>").join("") + "</div>";
      return h + '<div id="clist">' + carnetList() + "</div>";
    }

    /* ------------------------------------------------------------ ARBRE (0.11)
     * L’onglet « Arbre » : js/arbre.js décide de ce qui se voit et le place ;
     * ici, l’interrupteur, le cadre qu’on glisse et qu’on pince, et les touches. */
    const Arb = typeof window !== "undefined" ? window.EclatArbre : null;
    const ARB_TXT = { plein: "Arbre des connaissances", fantome: "Recette pas encore trouvée", toucher: "Pas encore trouvée. Essaie avec ce qui est autour.",
      futur: (de, a) => (de === a ? "Âge " + a : "Âges " + de + " à " + a) + " · encore loin",
      legende: "Légende", rail: "Aller à un âge", loin: "Éloigner", pres: "Rapprocher", centrer: "Centrer",
      trouvee: (n) => n + (n > 1 ? " recettes trouvées" : " recette trouvée"), aucune: "Aucune recette trouvée pour l’instant",
      lg: ["Une recette trouvée.", "Une matière que tu as déjà vue.", "Une recette pas encore trouvée.", "Ton objectif.", "Un trait qui saute des âges : touche une case pour le voir."] };
    /* l’échelle de la vue, et ses trois niveaux : loin (les âges et leur compte), milieu (les icônes), près (les noms) */
    const ARB_K = [0.3, 2];
    const ARB_NIV = { loin: 0.3, milieu: 0.7, pres: 1 }; // l’échelle où l’on tombe en changeant de niveau
    const ARB_LOIN = 0.5, ARB_PRES = 1;                    // en dessous : loin ; jusqu’à 1 : milieu ; à partir de 1 : près
    const ARB_RAIL = 44;                                   // la largeur de la réglette des âges (la vue la laisse libre)
    const arbreNiveau0 = (k) => (k < ARB_LOIN ? "loin" : k < ARB_PRES - 0.001 ? "milieu" : "pres");
    /* l’onglet Arbre : une barre fine, la vue qu’on glisse, la réglette des âges, le niveau « loin », la légende, le bandeau du nœud choisi */
    function arbreBarreHTML(g) {
      const n = g.compte;
      const txt = n ? ARB_TXT.trouvee(n) : ARB_TXT.aucune;
      return '<div class="arb-barre">' +
        '<span class="arb-compte" aria-label="' + esc(txt) + '">' + (n ? "<b>" + n + '</b><span class="arb-cpt-t"> ' + esc(n > 1 ? "recettes trouvées" : "recette trouvée") + "</span>" : '<span class="arb-cpt-t">' + esc(ARB_TXT.aucune) + "</span>") + "</span>" +
        '<button type="button" class="btn small ghost" data-arb="moins" aria-label="' + esc(ARB_TXT.loin) + '">−</button><button type="button" class="btn small ghost" data-arb="plus" aria-label="' + esc(ARB_TXT.pres) + '">+</button>' +
        '<button type="button" class="btn small ghost" data-arb="centre">' + esc(ARB_TXT.centrer) + '</button>' +
        '<button type="button" class="btn small ghost" data-arb="legende" aria-label="' + esc(ARB_TXT.legende) + '" aria-expanded="' + (U.arbreLegende ? "true" : "false") + '">?</button></div>';
    }
    function arbreLoinHTML(loin) {
      let h = '<div class="arb-loin" hidden>';
      if (loin.futur) h += '<div class="arb-lb futur">' + esc(ARB_TXT.futur(loin.futur.de, loin.futur.a)) + "</div>";
      loin.bandes.forEach((b) => {
        h += '<button type="button" class="arb-lb' + (b.atteint ? "" : " suivant") + (b.objectif ? " obj" : "") + '" data-arbband="' + b.age + '" style="--ac:' + esc(b.c) + '">' +
          '<span class="arb-lb-n">' + (b.age + 1) + " · " + esc(b.nom) + '</span><span class="arb-lb-p" aria-hidden="true">' + "●".repeat(Math.min(b.trouvees, 40)) + "</span>" +
          '<span class="arb-lb-c">' + (b.trouvees ? esc(ARB_TXT.trouvee(b.trouvees)) : "") + "</span></button>";
      });
      return h + "</div>";
    }
    function arbreRailHTML() {
      let h = '<div class="arb-rail" role="group" aria-label="' + esc(ARB_TXT.rail) + '">';
      for (let a = D.AGES.length - 1; a >= 0; a--) h += '<button type="button" class="arb-rb" data-arbage="' + a + '" aria-label="' + esc(D.AGES[a].n) + '" style="--ac:' + esc(D.AGES[a].c) + '"><span>' + (a + 1) + "</span></button>";
      return h + "</div>";
    }
    function arbreLegendeHTML() {
      const sym = ['<span class="arb-n allume" aria-hidden="true"></span>', '<span class="arb-n vu" aria-hidden="true"></span>', '<span class="arb-n fantome" aria-hidden="true"></span>',
        '<span class="arb-n fantome obj" aria-hidden="true"></span>', '<svg viewBox="0 0 26 26" aria-hidden="true"><path class="arb-t" d="M13 2 C13 9 13 17 13 24"/></svg>'];
      return '<div class="arb-legende" role="note"' + (U.arbreLegende ? "" : " hidden") + ">" + ARB_TXT.lg.map((l, i) => '<p class="arb-lg">' + sym[i] + "<span>" + esc(l) + "</span></p>").join("") + "</div>";
    }
    function arbreVueHTML(g, lay) {
      return '<div class="arb-vue" id="arbre">' + Arb.rendu(lay, { icon: (id) => icon(id), esc, neuf: U.arbreNeuf, txt: ARB_TXT, car: Arb.carrefours(D) }) +
        arbreLoinHTML(Arb.loin(g, D)) + '<div class="arb-ici" aria-hidden="true"></div>' + arbreRailHTML() + '<div class="arb-rb-tip" hidden></div>' + arbreLegendeHTML() + '<div class="arb-fiche" hidden></div></div>';
    }
    const arbreEl = () => document.getElementById("v-arbre");
    const arbreSig = (g) => Arb.sig(g) + "|" + (U.arbreNeuf || "");
    /* va à l’onglet Arbre ; avec un id d’objet, il s’ouvre sur lui (choisi), sinon sur l’objectif ou la dernière découverte */
    function arbreOuvrir(id) {
      if (!Arb || typeof document === "undefined") return;
      U.arbreVoirId = id || null;
      setTab("arbre");
    }
    /* appelé par render() quand l’onglet est à l’écran : on ne redessine que si l’arbre a changé, la vue (glissée, zoomée) reste où elle était */
    function arbreRendre(el) {
      if (!Arb) return;
      const g = Arb.graphe(E, D), id = U.arbreVoirId;
      U.arbreVoirId = null;
      if (!id && el.firstElementChild && el.dataset.sig === arbreSig(g)) return;
      arbreBati(el, id, !U.arbreVue);
    }
    function arbreBati(el, id, centrer) {
      const g = Arb.graphe(E, D), lay = Arb.mise_en_page(g, D);
      const actif = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.arb : null;
      U.arbreLay = lay;
      el.innerHTML = arbreBarreHTML(g) + arbreVueHTML(g, lay);
      el.dataset.sig = arbreSig(g);
      U.arbreNeuf = null; // l’éclat d’une découverte ne se joue qu’une fois
      const n = id && lay.noeuds.find((x) => x.cle === id);
      if (centrer || !U.arbreVue) arbreCentrer(lay, g);
      arbreMonter(el.querySelector(".arb-vue"));
      if (n) arbreChoisir(n.cle, true);
      else if (U.arbreSel && lay.noeuds.some((x) => x.cle === U.arbreSel)) arbreChoisir(U.arbreSel);
      else U.arbreSel = null;
      if (actif && !centrer) { const b = el.querySelector('[data-arb="' + actif + '"]'); if (b) b.focus({ preventScroll: true }); }
    }
    /* appelé régulièrement : si quelque chose a changé dans l’arbre (une découverte), on le redessine */
    function arbreMaj() {
      const el = arbreEl();
      if (!el || !Arb || U.tab !== "arbre") return;
      if (el.dataset.sig === arbreSig(Arb.graphe(E, D))) return;
      arbreBati(el, null, false);
    }
    function arbreClavier(e) {
      const rb = e.target.closest && e.target.closest("#v-arbre .arb-rb");
      if (rb && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
        e.preventDefault();
        const bs = Array.from(document.querySelectorAll("#v-arbre .arb-rb")), i = bs.indexOf(rb) + (e.key === "ArrowUp" ? -1 : 1);
        if (bs[i]) bs[i].focus({ preventScroll: true });
      }
    }
    /* la réglette des âges : amène la vue à un âge */
    function arbreAller(a) {
      const v = document.getElementById("arbre"), o = U.arbreVue, lay = U.arbreLay;
      if (!v || !o || !lay) return;
      if (o.k < ARB_LOIN) o.k = ARB_NIV.milieu; // depuis le niveau « loin », on vient plus près
      const b = lay.bandes.find((x) => x.age === a);
      const y = b ? b.y + b.h / 2 : lay.futur ? lay.futur.h / 2 : 0;
      o.ty = v.clientHeight / 2 - y * o.k;
      const m = v.firstElementChild;
      if (m) { m.classList.add("glisse"); setTimeout(() => m.classList.remove("glisse"), 320); }
      arbrePoser(v);
    }
    /* de loin à près et retour : − et + passent d’un niveau à l’autre (puis + continue jusqu’à l’échelle 2) */
    function arbreNiveau(dir) {
      const o = U.arbreVue;
      if (!o) return;
      const L = [ARB_NIV.loin, ARB_NIV.milieu, ARB_NIV.pres], i = arbreNiveau0(o.k) === "loin" ? 0 : arbreNiveau0(o.k) === "milieu" ? 1 : 2;
      const cible = dir > 0 ? (i < 2 ? L[i + 1] : Math.min(ARB_K[1], o.k * 1.25)) : (o.k > ARB_PRES + 0.02 ? ARB_PRES : i > 0 ? L[i - 1] : ARB_K[0]);
      arbreZoom(cible / o.k);
    }
    /* Toucher un nœud le choisit : ses traits s’allument (même ceux qui sautent des âges), le reste
     * s’efface, et un bandeau dit de quoi il est fait et à quoi il sert. Le toucher encore ouvre sa fiche. */
    function arbreChoisir(cle, voir) {
      const v = document.getElementById("arbre"), lay = U.arbreLay;
      if (!v || !lay) return;
      const m = v.querySelector(".arb-monde"), f = v.querySelector(".arb-fiche");
      m.querySelectorAll(".sel, .lie").forEach((x) => x.classList.remove("sel", "lie", "amont", "aval"));
      const n = cle && lay.noeuds.find((x) => x.cle === cle);
      U.arbreSel = n ? cle : null;
      m.classList.toggle("focus", !!n);
      if (!n) { f.hidden = true; f.innerHTML = ""; return; }
      const L = Arb.liens(lay, cle);
      const el = (k) => m.querySelector('[data-arbn="' + k + '"]');
      el(cle).classList.add("sel");
      L.amont.forEach((k) => { const x = el(k); if (x) x.classList.add("lie"); });
      L.aval.forEach((k) => { const x = el(k); if (x) x.classList.add("lie"); });
      L.traits.forEach((i) => { const t = m.querySelector('[data-t="' + i + '"]'); if (t) t.classList.add("lie", lay.traits[i].a === cle ? "amont" : "aval"); });
      f.innerHTML = arbreFiche(n, L);
      f.hidden = false;
      // le nœud reste visible au-dessus du bandeau ; venu d’une puce, il vient au milieu
      const o = U.arbreVue, sy = n.y * o.k + o.ty, sx = n.x * o.k + o.tx;
      if (voir || sy < 40 || sy > v.clientHeight - f.offsetHeight - 50 || sx < 20 || sx > v.clientWidth - 20) arbreVoir(n);
    }
    const arbPuce = (id, q) => '<button type="button" class="arb-puce" data-arbsel="' + esc(id) + '">' + icon(id, "sm") + (q > 1 ? "<b>" + fmt(q) + "</b> " : "") + esc(I[id].n) + "</button>";
    function arbreFiche(n, L) {
      if (n.etat === "fantome") {
        const src = L.amont.filter((k) => I[k]);
        return '<div class="arb-f-tete"><span class="ic sm unk">?</span><b class="grow">' + esc(ARB_TXT.fantome) + '</b><button type="button" class="btn small ghost" data-arbsel="" aria-label="Fermer">✕</button></div>' +
          '<p class="arb-f-l small muted">' + (n.objectif ? "Ton objectif. " : "") + esc(ARB_TXT.toucher) + "</p>" +
          (src.length ? '<div class="arb-f-l"><span class="arb-f-k">Part de</span>' + src.map((k) => arbPuce(k)).join("") + "</div>" : "");
      }
      const it = I[n.id], par = {};
      U.arbreLay.noeuds.forEach((x) => { par[x.cle] = x; });
      let h = '<div class="arb-f-tete">' + icon(n.id, "sm") + '<b class="grow">' + esc(it.n) + "</b>" +
        '<button type="button" class="btn small" data-goto="' + esc(n.id) + '">Fiche</button><button type="button" class="btn small ghost" data-arbsel="" aria-label="Fermer">✕</button></div>';
      if (it.r && n.etat === "allume") {
        const G = D.GESTES[it.r[0]], ing = it.r[1];
        h += '<div class="arb-f-l"><span class="arb-f-k">' + (G ? gIc(it.r[0]) + " " + esc(G.n) : "Fait de") + "</span>" +
          Object.keys(ing).map((k) => (I[k] && par[k] ? arbPuce(k, ing[k]) : '<span class="arb-puce off">' + (I[k] && (S().seen[k] || S().known[k]) ? esc(I[k].n) : "?") + "</span>")).join("") + "</div>";
      } else h += '<p class="arb-f-l small muted">Une ressource : elle se récolte, ou s’obtient sans recette connue.</p>';
      const usages = L.aval.filter((k) => par[k] && par[k].etat !== "fantome");
      const f = L.aval.length - usages.length;
      if (usages.length || f) h += '<div class="arb-f-l"><span class="arb-f-k">Sert à</span>' + usages.map((k) => arbPuce(k)).join("") +
        (f ? '<span class="arb-puce fant">✦ ' + f + (f > 1 ? " recettes à trouver" : " recette à trouver") + "</span>" : "") + "</div>";
      else if (it.r) h += '<p class="arb-f-l small muted">Ne sert encore à aucune recette trouvée.</p>';
      return h;
    }
    /* amène un nœud au milieu de la vue (au-dessus du bandeau) */
    function arbreVoir(n) {
      const v = document.getElementById("arbre"), o = U.arbreVue;
      if (!v || !o) return;
      const f = v.querySelector(".arb-fiche"), bas = f && !f.hidden ? f.offsetHeight : 0;
      o.tx = (v.clientWidth - ARB_RAIL) / 2 - n.x * o.k; o.ty = (v.clientHeight - bas) / 2 - n.y * o.k;
      const m = v.firstElementChild;
      if (m) { m.classList.add("glisse"); setTimeout(() => m.classList.remove("glisse"), 320); }
      arbrePoser(v);
    }
    function arbreCentrer(lay, g) {
      const v = document.getElementById("arbre"), c = Arb.centre(lay, g);
      const vw = v ? v.clientWidth : 360, vh = v ? v.clientHeight : 480, k = ARB_NIV.pres;
      U.arbreVue = arbreBorne({ k, tx: (vw - ARB_RAIL) / 2 - c.x * k, ty: vh / 2 - c.y * k }, vw, vh);
    }
    function arbreBorne(o, vw, vh) {
      const lay = U.arbreLay;
      if (!lay) return o;
      const W = lay.w * o.k, H = lay.h * o.k, marge = 60;
      // le bandeau du nœud choisi couvre le bas de la vue : on peut faire monter l’arbre au-dessus
      const f = document.querySelector("#arbre .arb-fiche"), bas = f && !f.hidden ? f.offsetHeight : 0;
      const libre = vw - ARB_RAIL; // la réglette des âges prend le bord droit
      o.tx = W <= libre ? (libre - W) / 2 : Math.min(8, Math.max(libre - W - 8, o.tx));
      o.ty = H <= vh - bas ? (vh - bas - H) / 2 : Math.min(marge, Math.max(vh - H - marge - bas, o.ty));
      return o;
    }
    function arbrePoser(v) {
      v = v || document.getElementById("arbre");
      if (!v || !U.arbreVue) return;
      const o = arbreBorne(U.arbreVue, v.clientWidth, v.clientHeight), m = v.firstElementChild;
      if (m) { m.style.transform = "translate(" + Math.round(o.tx) + "px," + Math.round(o.ty) + "px) scale(" + o.k + ")"; m.style.setProperty("--k", o.k); }
      const niv = arbreNiveau0(o.k);
      if (v.dataset.niv !== niv) { v.dataset.niv = niv; const lo = v.querySelector(".arb-loin"); if (lo) lo.hidden = niv !== "loin"; }
      // la réglette : l’âge où l’on est (plein), l’âge au milieu de la vue (cerclé), les âges encore loin (estompés)
      const lay0 = U.arbreLay;
      if (lay0) {
        const rail0 = v.querySelector(".arb-rail");
        const bc = niv === "loin" ? null : Arb.bandeA(lay0, (v.clientHeight / 2 - o.ty) / o.k);
        v.querySelectorAll(".arb-rb").forEach((b) => {
          const a = +b.dataset.arbage;
          b.classList.toggle("ici", a === S().age);
          b.classList.toggle("centre", !!bc && bc.age === a);
          b.classList.toggle("lointain", !lay0.bandes.some((x) => x.age === a));
        });
        // réglette qui défile : l’âge au milieu de la vue (ou l’âge atteint) reste à l’écran
        const defile0 = !!rail0 && rail0.scrollHeight > rail0.clientHeight + 1;
        if (rail0) rail0.classList.toggle("defile", defile0);
        if (defile0) {
          const cb = v.querySelector(".arb-rb.centre") || v.querySelector(".arb-rb.ici");
          if (cb) rail0.scrollTop = cb.offsetTop - (rail0.clientHeight - cb.offsetHeight) / 2;
        }
      }
      // l’âge sous le haut de la vue reste écrit, même au milieu d’une longue bande
      const ici = v.querySelector(".arb-ici"), lay = U.arbreLay;
      if (ici && lay) {
        const b = Arb.bandeA(lay, (24 - o.ty) / o.k);
        const cache = !b || niv === "loin" || (b.y * o.k + o.ty > -4); // l’étiquette de la bande est déjà à l’écran
        ici.hidden = cache;
        if (b && !cache) { ici.textContent = (b.age + 1) + " · " + b.nom; ici.style.setProperty("--ac", b.c); }
      }
    }
    function arbreZoom(f, px, py) {
      const v = document.getElementById("arbre"), o = U.arbreVue;
      if (!v || !o) return;
      if (px === undefined) { px = (v.clientWidth - ARB_RAIL) / 2; py = v.clientHeight / 2; }
      const k = Math.max(ARB_K[0], Math.min(ARB_K[1], o.k * f));
      o.tx = px - (px - o.tx) * k / o.k; o.ty = py - (py - o.ty) * k / o.k; o.k = k;
      arbrePoser(v);
    }
    function arbreMonter(v) {
      if (!v) return;
      arbrePoser(v);
      const pts = new Map();
      let base = null;
      const rel = (e) => { const r = v.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
      const debut = () => {
        const p = Array.from(pts.values()), o = U.arbreVue;
        if (p.length === 1) base = { x: p[0].x, y: p[0].y, tx: o.tx, ty: o.ty, k: o.k };
        else if (p.length >= 2) base = { mx: (p[0].x + p[1].x) / 2, my: (p[0].y + p[1].y) / 2, d: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) || 1, tx: o.tx, ty: o.ty, k: o.k };
      };
      v.addEventListener("pointerdown", (e) => {
        if (e.button > 0 || e.target.closest(".arb-fiche, .arb-rail, .arb-legende")) return;
        pts.set(e.pointerId, rel(e));
        if (pts.size === 1) U.arbreGlisse = false;
        debut();
      });
      v.addEventListener("pointermove", (e) => {
        if (!pts.has(e.pointerId) || !base) return;
        pts.set(e.pointerId, rel(e));
        const p = Array.from(pts.values()), o = U.arbreVue;
        if (p.length === 1) {
          const dx = p[0].x - base.x, dy = p[0].y - base.y;
          if (!U.arbreGlisse && Math.hypot(dx, dy) < 7) return;
          if (!U.arbreGlisse) { U.arbreGlisse = true; v.classList.add("tient"); try { v.setPointerCapture(e.pointerId); } catch (er) { /* rien */ } }
          o.tx = base.tx + dx; o.ty = base.ty + dy;
        } else {
          U.arbreGlisse = true;
          const mx = (p[0].x + p[1].x) / 2, my = (p[0].y + p[1].y) / 2, d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) || 1;
          const k = Math.max(ARB_K[0], Math.min(ARB_K[1], base.k * d / base.d));
          o.k = k; o.tx = mx - (base.mx - base.tx) * k / base.k; o.ty = my - (base.my - base.ty) * k / base.k;
        }
        arbrePoser(v);
      });
      const fin = (e) => { pts.delete(e.pointerId); v.classList.remove("tient"); debut(); };
      v.addEventListener("pointerup", fin);
      v.addEventListener("pointercancel", fin);
      // la réglette des âges : le doigt la parcourt, la vue saute à l’âge touché, une pastille dit lequel
      const rail = v.querySelector(".arb-rail");
      if (rail) {
        const tip = v.querySelector(".arb-rb-tip");
        // petit écran : les âges gardent 44 px et la réglette défile ; on ne la parcourt plus d’un trait, on touche un âge
        const defile = () => rail.scrollHeight > rail.clientHeight + 1;
        let actif = false;
        const ageAt = (e) => { const r = rail.getBoundingClientRect(), n = D.AGES.length; return n - 1 - Math.max(0, Math.min(n - 1, Math.floor((e.clientY - r.top) / r.height * n))); };
        const va = (e) => {
          const a = ageAt(e), r = rail.getBoundingClientRect();
          arbreAller(a);
          tip.hidden = false; tip.textContent = (a + 1) + " · " + D.AGES[a].n; tip.style.top = Math.max(18, Math.min(r.height - 18, e.clientY - r.top)) + "px";
        };
        rail.addEventListener("pointerdown", (e) => { if (e.button > 0 || defile()) return; actif = true; U.arbreRail = true; try { rail.setPointerCapture(e.pointerId); } catch (er) { /* rien */ } va(e); e.preventDefault(); });
        rail.addEventListener("pointermove", (e) => { if (actif) va(e); });
        const finRail = () => { actif = false; tip.hidden = true; setTimeout(() => { U.arbreRail = false; }, 50); };
        rail.addEventListener("pointerup", finRail);
        rail.addEventListener("pointercancel", finRail);
      }
      v.addEventListener("wheel", (e) => { if (e.target.closest(".arb-fiche")) return; e.preventDefault(); const p = rel(e); arbreZoom(e.deltaY < 0 ? 1.15 : 1 / 1.15, p.x, p.y); }, { passive: false });
      // au clavier : le nœud qui prend le focus vient dans le cadre
      v.addEventListener("focusin", (e) => {
        const b = e.target.closest(".arb-n"), o = U.arbreVue;
        if (!b || !o) return;
        v.scrollLeft = 0; v.scrollTop = 0;
        const x = (parseFloat(b.style.left) + 24) * o.k + o.tx, y = (parseFloat(b.style.top) + 24) * o.k + o.ty;
        if (x < 30 || y < 30 || x > v.clientWidth - 30 || y > v.clientHeight - 30) { o.tx += v.clientWidth / 2 - x; o.ty += v.clientHeight / 2 - y; arbrePoser(v); }
      });
    }
    if (typeof document !== "undefined") {
      document.addEventListener("keydown", arbreClavier, true);
      // en capture : un doigt qui a glissé n’ouvre pas de fiche en relâchant
      document.addEventListener("click", (e) => {
        const t = e.target, b = t.closest && t.closest("[data-arb], [data-arbre-obj], .arb-vue");
        if (!b) return;
        if (b.dataset.arbreObj !== undefined) { e.stopPropagation(); A.click(); arbreOuvrir(objectifCle()); return; }
        if (b.dataset.arb) {
          e.stopPropagation(); A.click();
          const a = b.dataset.arb;
          if (a === "centre") { if (U.arbreLay) { arbreCentrer(U.arbreLay, Arb.graphe(E, D)); arbrePoser(); } }
          else if (a === "legende") {
            U.arbreLegende = !U.arbreLegende;
            const lg = document.querySelector("#v-arbre .arb-legende"); if (lg) lg.hidden = !U.arbreLegende;
            b.setAttribute("aria-expanded", U.arbreLegende ? "true" : "false");
          } else arbreNiveau(a === "plus" ? 1 : -1);
          return;
        }
        const ab = t.closest("[data-arbage], [data-arbband]");
        if (ab && !U.arbreRail) {
          e.stopPropagation(); A.click();
          if (ab.dataset.arbband !== undefined) { const o = U.arbreVue; if (o) o.k = ARB_NIV.milieu; arbreAller(+ab.dataset.arbband); }
          else arbreAller(+ab.dataset.arbage);
          return;
        }
        if (ab) { e.stopPropagation(); return; }
        if (U.arbreGlisse) { U.arbreGlisse = false; e.stopPropagation(); e.preventDefault(); return; }
        const sel = t.closest("[data-arbsel]");
        if (sel) { e.stopPropagation(); A.click(); arbreChoisir(sel.dataset.arbsel || null, !!sel.dataset.arbsel); return; }
        if (t.closest(".arb-fiche")) return; // « Fiche » : l’écouteur commun ouvre la fiche de l’objet
        const nb = t.closest("[data-arbn]");
        if (nb) {
          e.stopPropagation();
          const n = U.arbreLay && U.arbreLay.noeuds.find((x) => x.cle === nb.dataset.arbn);
          if (n && n.id && U.arbreSel === n.cle) { goto(n.id); return; } // deuxième toucher : la fiche
          A.click(); arbreChoisir(nb.dataset.arbn);
          return;
        }
        if (U.arbreSel) { e.stopPropagation(); arbreChoisir(null); } // toucher le vide : on lâche
      }, true);
    }
    E.on("learn", (id) => { if (I[id] && !I[id].path) U.arbreNeuf = id; });
    /* le nœud de l’objectif en cours (case vide ou recette trouvée), pour ouvrir l’arbre dessus */
    function objectifCle() {
      if (!Arb) return null;
      const n = Arb.graphe(E, D).noeuds.find((x) => x.objectif);
      return n ? n.cle : null;
    }
    const arbreVisible = (id) => !!(Arb && I[id] && I[id].r && !I[id].sec && !I[id].path && I[id].t !== "curio" && I[id].t !== "relic");
    /* fin ARBRE */

    function viewMachines() {
      let h = subTabs("atelier", "machines", "Découvrir", "Machines");
      h += Dom.machinesView ? Dom.machinesView() : "";
      return h;
    }
    function visibleRecipes() {
      const st = S();
      const ids = [];
      E.carnet().forEach((s) => s.ids.forEach((id) => ids.push(id)));
      if (E.gesteOK("accorder")) E.pathRecipes().forEach((id) => ids.push(id));
      return ids;
    }
    function hiddenOwned(id) {
      const it = I[id];
      return !U.showOwned && E.isUnique(it) && S().made[id] > 0 && U.carnetFilter !== "pin";
    }
    /* Le nom d’une recette encore inconnue reste caché (on cherche sans savoir ce qui va sortir),
     * sauf si le jeu l’a déjà dit : objectif, étape d’un âge, prochaine étape, objet déjà vu. */
    function namedSet() {
      const st = S(), out = {}, g = E.guide();
      E.milestones().forEach((l, a) => { if (l && a <= st.age + 1) l.forEach((x) => { if (x.ob.k === "craft") out[x.ob.id] = 1; }); });
      if (g && g.step) out[g.step] = 1;
      if (st.track) out[st.track.id] = 1;
      return out;
    }
    const nameShown = (id, set) => { const st = S(); return !!(st.known[id] || st.seen[id] || !I[id].r || (set || namedSet())[id]); };
    function carnetList() {
      const st = S();
      const q = norm(U.q);
      U.named = namedSet();
      let nHidden = 0;
      const keep = (id) => { if (!passFilter(id)) return false; if (hiddenOwned(id)) { nHidden++; return false; } return true; };
      let h = "";
      if (q) {
        const ids = visibleRecipes().filter((id) => {
          const it = I[id];
          if (!nameShown(id, U.named)) return false; // un nom caché ne se trouve pas en cherchant
          if (norm(it.n).includes(q)) return true;
          if (!st.known[id]) return false;
          return Object.keys(it.r[1]).some((i) => norm(I[i].n).includes(q));
        }).filter(passFilter);
        h += ids.length ? '<div class="list flat">' + ids.map(recCard).join("") + "</div>" : '<p class="small muted center">Aucune recette ne correspond.</p>';
        return h;
      }
      if (E.gesteOK("accorder")) {
        const ids = E.pathRecipes().filter(keep);
        if (ids.length) h += '<details class="card age-sec" open><summary><span class="ic" style="border-color:#b36bff">🎵</span><span class="an">La Résonance</span></summary><div class="list">' + ids.map(recCard).join("") + "</div></details>";
      }
      const book = E.carnet();
      const order = book.map((b, i) => i).sort((a, b) => {
        const rank = (x) => (book[x].age === st.age ? 0 : book[x].age === st.age + 1 ? 1 : 2 + (st.age - book[x].age));
        return rank(a) - rank(b);
      });
      for (const k of order) {
        const sec = book[k];
        const ids = sec.ids.filter((id) => !I[id].sec).filter(keep);
        if (!ids.length) continue;
        const ag = D.AGES[sec.age];
        const kn = sec.ids.filter((id) => st.known[id] && !I[id].sec).length;
        const all = sec.ids.filter((id) => !I[id].sec).length;
        const open = U.carnetFilter !== "tout" || (U.openAges[sec.age] !== undefined ? U.openAges[sec.age] : sec.age >= st.age);
        h += '<details class="card age-sec" data-age="' + sec.age + '"' + (open ? " open" : "") + '><summary><span class="ic" style="background:' + ag.c + "22;border-color:" + ag.c + '66">' + (sec.age + 1) +
          '</span><span class="an">' + ag.n + '</span><span class="cnt">' + kn + "/" + all + '</span></summary><div class="list">' + ids.map(recCard).join("") + "</div></details>";
      }
      const secrets = Object.keys(I).filter((id) => I[id].sec && st.known[id] && I[id].r).filter(keep);
      if (secrets.length) h += '<details class="card age-sec"' + (U.carnetFilter !== "tout" ? " open" : "") + '><summary><span class="ic">🗝️</span><span class="an">Curiosités</span><span class="cnt">' + secrets.length + '</span></summary><div class="list">' + secrets.map(recCard).join("") + "</div></details>";
      if (!h) h = '<p class="small muted center">Rien ici pour l’instant.</p>';
      if (nHidden || U.showOwned) h += '<p class="center"><button class="btn small ghost" data-owned>' + (U.showOwned ? "Cacher les objets déjà possédés" : "Voir les " + nHidden + " objets déjà possédés") + "</button></p>";
      return h;
    }
    function passFilter(id) {
      const st = S(), it = I[id];
      if (U.carnetFilter === "tout") return true;
      if (U.carnetFilter === "pret") return st.known[id] && !E.missingFor(id, 1) && (!E.isUnique(it) || (st.made[id] || 0) === 0);
      if (U.carnetFilter === "unk") return !st.known[id];
      if (U.carnetFilter === "craft") return st.known[id] && (E.maxCraftable(id, 1) > 0 || E.plan(id, 1).ok);
      if (U.carnetFilter === "prod") return st.known[id] && ["ext", "upg", "mach", "tool", "stat"].includes(it.t);
      if (U.carnetFilter === "pin") return !!st.pins[id];
      return true;
    }
    function recCard(id) {
      const st = S(), it = I[id];
      if (!st.known[id]) {
        const lvl = st.hints[id] || 0;
        const ing = Object.keys(it.r[1]);
        const big = mainIngredient(id);
        const shown = nameShown(id, U.named);
        return '<div class="rec unknown" data-rec="' + id + '" data-goto="' + id + '"><div class="rh"><span class="ic unk">?</span><div class="grow" data-goto="' + id + '"><div class="rt">' + (shown ? esc(it.n) : '<span class="hid">???</span>') + badgeHTML(id) + '</div><div class="tiny muted">' + esc(fxText(id)) + "</div></div></div>" +
          (it.h ? '<div class="riddle small" style="margin-top:6px">« ' + esc(it.h) + " »</div>" : "") +
          '<div class="rl tiny muted">Action : ' + (lvl >= 1 ? gesteChip(id) : "?") + " · Ressource : " + (lvl >= 2 ? '<span class="ing">' + icon(big, "sm") + esc(I[big].n) + "</span>" : "?") + " · " + ing.length + " ressource" + (ing.length > 1 ? "s" : "") + "</div></div>";
      }
      const uniq = E.isUnique(it);
      const owned = uniq && (st.made[id] || 0) > 0;
      const stars = E.stars(id);
      const readyCraft = st.known[id] && !owned && !E.missingFor(id, 1);
      let h = '<div class="rec' + (owned ? " owned" : "") + (readyCraft ? " can-craft" : "") + '" data-rec="' + id + '"><div class="rh">' + icon(id) + '<div class="grow" data-goto="' + id + '"><div class="rt">' + esc(it.n) + badgeHTML(id) + (readyCraft ? '<span class="badge-ready">⚡ Prêt</span>' : '') + "</div>" +
        (stars ? '<div class="stars">' + "★".repeat(stars) + "</div>" : "") + '</div>' +
        (readyCraft ? '<button class="btn mini pri quick-make" data-cr="' + id + '" data-n="1" title="Fabriquer 1 exemplaire">⚡ +1</button>' : '') +
        '<div class="small muted" data-c="' + id + '">' + (uniq ? (owned ? "✓" : "") : fmt(st.inv[id] || 0)) + "</div>" +
        '<button class="pinb' + (st.pins[id] ? " on" : "") + '" data-pin="' + id + '" aria-label="Épingler">' + (st.pins[id] ? "★" : "☆") + "</button></div>";
      if (!owned) h += '<div class="rl">' + gesteChip(id) + ingHTML(E.costFor(id), { check: true, link: true }) + "</div>";
      const fx = fxText(id);
      if (fx) h += '<div class="fx">' + esc(fx) + "</div>";
      if (E.isScaled(it)) h += '<div class="tiny muted" style="margin-top:4px">Construits : ' + Math.floor(st.inv[id] || 0) + "</div>";
      if (!owned) {
        const b = E.blocker(id);
        if (b && b.why !== "owned") h += '<div class="why">' + cap1(needText(id, b, true)) + "</div>";
        else {
          h += '<div class="acts">' + craftBtns(id) +
            '<button class="btn small ghost" data-tree="' + id + '" title="Détail">🌳 Détail</button>' +
            (st.track && st.track.id === id ? '<button class="btn small ghost auto-on" data-untrack title="Ne plus suivre">🎯 Suivi</button>' : '<button class="btn small ghost" data-track="' + id + '" title="Suivre">🎯 Suivre</button>') + "</div>";
        }
      }
      return h + "</div>";
    }

    /* pourquoi on ne peut pas fabriquer (n fois, en chaîne ou non), en une phrase */
    function whyNot(id, n, chain) {
      const it = I[id], b = E.blocker(id);
      if (E.handInfo().full) return "Tes mains sont occupées : attends la fin de la commande en cours.";
      if (b && b.why === "owned") return "Tu possèdes déjà " + esc(it.n) + ".";
      if (!E.ageOK(id)) return esc(it.n) + " vient d’un âge que tu n’as pas encore atteint.";
      if (b) return esc(it.n) + " : " + esc(needText(id, b)) + ".";
      const names = (m) => Object.keys(m).map((k) => fmt(m[k]) + " " + esc(I[k].n)).join(", ");
      if (chain) {
        const p = E.plan(id, n);
        const raw = {};
        for (const k in p.missing) if (!p.locked.includes(k)) raw[k] = p.missing[k];
        return (Object.keys(raw).length ? "Il manque " + names(raw) + "." : "") +
          (p.locked.length ? " Recette encore inconnue : " + p.locked.map((k) => esc(I[k].n)).join(", ") + "." : "") || "Impossible pour l’instant.";
      }
      const m = E.missingFor(id, n);
      return m ? "Il manque " + names(m) + "." : "Impossible pour l’instant.";
    }

    /* ============================================================ ACTIONS */
    function putInSlot(id) {
      const i = U.slots.indexOf(id);
      if (i >= 0) { U.slots[i] = null; }
      else {
        const free = U.slots.indexOf(null);
        if (free < 0) { toast("L’établi est plein : touche un emplacement pour le vider."); return; }
        U.slots[free] = id;
      }
      A.click();
      U.anchor = '[data-inv="' + id + '"]'; U.anchorAt = performance.now();
      render(true);
    }

    function forge() {
      A.init();
      const ids = U.slots.filter(Boolean);
      if (!ids.length) return;
      const g = U.geste;
      U.forging = true;
      const r = E.attempt(g, ids);
      U.forging = false;
      U.last = r;
      if (r.kind === "learn") r.made0 = S().made[r.id] || 0;
      if (U.fromMini) toast(resultLine(r), { key: "forge" });
      const bench = $("#bench");
      const p = elCenter($("#forge"));
      strike(g, bench, r.kind === "craft" || r.kind === "queued");
      if (r.kind === "queued") {
        A.click();
        if (bench) { bench.classList.remove("glow"); void bench.offsetWidth; bench.classList.add("glow"); }
      } else if (r.kind === "busy") {
        A.fail(0);
      } else if (r.kind === "craft") {
        A.craft(g);
        if (r.fresh) { setTimeout(() => A.discover(), 180); fete({ id: r.id, kick: "Nouvelle découverte", title: I[r.id].n, sub: fxText(r.id) }); }
        sparks(p.x, p.y - 40, r.fresh ? 26 : 12);
        vibe(r.fresh ? [10, 40, 20] : 12);
        if (bench) { bench.classList.remove("glow"); void bench.offsetWidth; bench.classList.add("glow"); }
      } else if (r.kind === "learn" || r.kind === "blocked") {
        A.fail(4); if (r.fresh) setTimeout(() => A.discover(), 150);
        // trouver la recette, c’est déjà découvrir : la fabriquer viendra après
        if (r.fresh && !I[r.id].sec) {
          vibe([10, 40, 20]);
          fete({ id: r.id, kick: "Recette trouvée", title: I[r.id].n, sub: r.kind === "blocked" ? "Inscrite dans ton Carnet. " + cap1(needText(r.id, r.info)) + "." : "Inscrite dans ton Carnet, à fabriquer quand tu veux." });
        }
      } else {
        A.fail(r.temp || 0);
        vibe(20);
        if (bench) { bench.classList.remove("shake"); void bench.offsetWidth; bench.classList.add("shake"); }
        // « Brûlant » : la bonne combinaison, il ne manque que la chaleur
        if (r.temp === 4) {
          const th = $(".thermo .tmark") || bench;
          if (th) { const q = elCenter(th); sparks(q.x, q.y, 10, "#ff4a3c"); }
          vibe([8, 30, 8]);
        }
      }
      render(true);
    }

    /* le résultat d’un essai en une ligne (quand la carte de résultat est hors de l’écran) */
    function resultLine(r) {
      const n = (id) => "<b>" + esc(I[id].n) + "</b>";
      if (r.kind === "craft") return r.fresh ? "✨ Nouvelle découverte : " + n(r.id) : "+" + fmt(r.n) + " " + n(r.id);
      if (r.kind === "queued") return "✋ " + n(r.id) + " : fini dans " + fmtTime(r.time) + ".";
      if (r.kind === "learn") return "📖 Recette trouvée : " + n(r.id) + (r.missing ? ". Il manque " + Object.keys(r.missing).map((k) => fmt(r.missing[k]) + " " + esc(I[k].n)).join(", ") + "." : ". À fabriquer quand tu veux.");
      if (r.kind === "blocked") return "🔥 " + n(r.id) + " : " + needText(r.id, r.info, true) + ".";
      if (r.kind === "owned") return "Tu possèdes déjà " + n(r.id) + ".";
      if (r.kind === "busy") return "Tes mains sont occupées.";
      if (r.kind === "fail") return "<b>" + D.TEMPS[r.temp || 0].n + "</b> · " + esc(WHY[r.why] || "") + (r.sec ? " · Une chaleur étrange : ce mélange cache quelque chose." : "");
      return "";
    }
    /* l’outil du geste s’abat sur l’établi */
    function strike(g, bench, ok) {
      const fx = $("#fx");
      if (!fx || !bench || !bench.animate) return;
      const r = bench.getBoundingClientRect();
      const el = document.createElement("div");
      el.className = "strike";
      el.innerHTML = gIc(g);
      el.style.left = r.left + r.width / 2 - 27 + "px";
      el.style.top = r.top + 38 + "px";
      fx.appendChild(el);
      const swing = ["chauffer", "electriser", "graver", "synthetiser", "transmuter", "accorder"].includes(g)
        ? [{ transform: "scale(.4)", opacity: 0 }, { transform: "scale(1.25)", opacity: 1, offset: 0.45 }, { transform: "scale(1)", opacity: 0 }]
        : [{ transform: "translate(40px,-50px) rotate(55deg)", opacity: 0 }, { transform: "translate(18px,-30px) rotate(40deg)", opacity: 1, offset: 0.3 },
          { transform: "translate(0,6px) rotate(-18deg)", opacity: 1, offset: 0.55 }, { transform: "translate(6px,-6px) rotate(-6deg)", opacity: 0 }];
      el.animate(swing, { duration: ok ? 560 : 420, easing: "ease-in" }).onfinish = () => el.remove();
    }
    function celebrate(btn, id, n, bonus) {
      const p = elCenter(btn);
      A.craft(I[id].r[0]);
      floater("+" + fmt(n) + " " + I[id].n, p.x, p.y - 16, "var(--good)");
      if (bonus) setTimeout(() => floater("★ +" + fmt(bonus), p.x, p.y - 30, "var(--intu)"), 200);
      sparks(p.x, p.y, 8);
      vibe(10);
    }
    function craftFrom(btn) {
      const id = btn.dataset.cr;
      const n = btn.dataset.n === "max" ? E.maxPlan(id) : Number(btn.dataset.n);
      if (n > 0) handQueue(btn, id, n, true);
      else toast(whyNot(id, 1, true), { key: "nope" });
    }
    function chainCraft(btn, id, times) { handQueue(btn, id, times || 1, true); }
    /* toute commande part dans la file des commandes, où mains et machines avancent ensemble */
    function handQueue(btn, id, n) {
      A.init();
      const r = E.order(id, n);
      if (!r.ok) {
        if (r.why === "plan") { openTree(id, n); return false; }
        A.fail(0);
        toast(r.why === "full" ? "Tes mains sont occupées : " + D.HAND.max + " commandes au maximum." : r.why === "queued" ? esc(I[id].n) + " : déjà en cours." : whyNot(id, n, true));
        return false;
      }
      A.click();
      const p = elCenter(btn);
      floater("✋ " + fmtTime(r.time), p.x, p.y - 16, "var(--muted)");
      const missKeys = r.missing ? Object.keys(r.missing).filter((k) => r.missing[k] > 1e-9) : [];
      const sub = r.job.s.length - 1;
      if (missKeys.length) {
        const mTxt = missKeys.map((k) => fmt(Math.ceil(r.missing[k])) + " " + esc(I[k].n.toLowerCase())).join(", ");
        toast("✋ Commande lancée : <b>" + esc(I[id].n) + "</b>" + (n > 1 ? " ×" + fmt(n) : "") + " · il manque : " + mTxt + ".");
      } else if (sub > 0) {
        toast("⚡ " + esc(I[id].n) + ", avec " + sub + " pièce" + (sub > 1 ? "s" : "") + " à fabriquer avant : fini dans " + fmtTime(r.time) + ".");
      }
      render(true);
      return true;
    }
    function jobWorkersTag(j) {
      const parts = [];
      if (j.hand) parts.push("✋");
      for (const m in j.machs || {}) {
        const w = j.machs[m], it = I[m];
        const lbl = it ? (w.n > 1 ? it.pl || (it.sn || it.n.toLowerCase()) + "s" : it.sn || it.n.toLowerCase()) : m;
        parts.push(w.n + " " + lbl);
      }
      return parts.join(" + ");
    }
    function jobMissTag(j) {
      const ks = Object.keys(j.miss || {}).filter((k) => j.miss[k] > 1e-9);
      if (!ks.length) return "";
      return "il manque : " + ks.map((k) => fmt(Math.ceil(j.miss[k])) + " " + I[k].n.toLowerCase()).join(", ");
    }
    /* la file de « Tes mains » : ce qui est en cours, ce qui attend */
    function handsHTML() {
      const h = E.handInfo();
      if (!h.jobs.length) return '<span class="hh">✋</span><span class="grow tiny muted">Tes mains sont libres.</span>';
      const j = h.jobs[0], it = I[j.id];
      const missTxt = jobMissTag(j);
      const what = missTxt ? '<span style="color:var(--bad)">' + esc(missTxt) + "</span>"
        : j.wait ? '<span style="color:var(--bad)">attend une main ou une machine</span>'
        : j.steps.length > 1 ? "étape " + (j.i + 1) + "/" + j.steps.length + " · " + esc(I[j.step].n) : E.isUnique(it) ? "" : fmt(j.done) + "/" + fmt(j.n);
      const pct = Math.min(100, 100 * (j.frac || 0));
      return '<span class="hh">✋</span>' + icon(j.id, "sm") + '<div class="grow hmain" data-hopen><div class="small ell"><b>' + esc(it.n) + "</b>" + (E.isUnique(it) ? "" : " ×" + fmt(j.n)) +
        ' <span class="tiny muted">' + what + '</span></div><div class="bar"><i data-hp style="width:' + pct.toFixed(1) + '%"></i></div></div>' +
        '<span class="tiny muted" data-hl="0">' + fmtTime(j.left) + "</span>" + (h.jobs.length > 1 ? '<button class="hmore" data-hopen>+' + (h.jobs.length - 1) + "</button>" : "") +
        '<button class="hx" data-hcancel="0" aria-label="Annuler">✕</button>';
    }
    /* ------------------------------------------------------------ l’action qui tourne */
    function startHarvest(key) {
      A.init();
      const i = key.indexOf(":"), z = key.slice(0, i), res = key.slice(i + 1);
      if (S().act && S().act.k === "harv" && S().act.res === res && S().act.z === z) { E.stopAct(); A.click(); render(true); return; }
      if (!E.startAct({ k: "harv", z, res })) { A.fail(0); toast(esc(I[res].n) + " ne se récolte pas à la main.", { key: "act" }); return; }
      A.click();
      toast("▶ Récolte en continu : " + esc(I[res].n.toLowerCase()) + ".", { key: "act" });
      render(true);
    }
    /* la barre au-dessus des onglets : la commande en tête de file, ou la récolte continue */
    function actBar() {
      const bar = $("#actbar"), a = E.actInfo(), hi = E.handInfo();
      if (!a && !hi.jobs.length) { if (!bar.classList.contains("hidden")) { bar.classList.add("hidden"); bar.dataset.sig = ""; document.body.classList.remove("has-act"); } return; }
      bar.classList.remove("hidden");
      document.body.classList.add("has-act");
      let sig, frac, line;
      if (hi.jobs.length) {
        const j = hi.jobs[0], w = jobWorkersTag(j), miss = jobMissTag(j);
        sig = "j:" + j.id + ":" + j.n + ":" + w + ":" + miss + ":" + hi.jobs.length + (a ? ":h" : "");
        frac = j.frac !== undefined ? j.frac : (j.tot ? 1 - j.left / j.tot : 0);
        line = E.isUnique(I[j.id]) ? fmtTime(j.left) : fmt(j.done) + "/" + fmt(j.n) + (miss ? " · " + miss : "");
      } else {
        sig = "h:" + a.z + ":" + a.res; frac = a.frac; line = "+" + fmt(a.got);
      }
      if (bar.dataset.sig !== sig) {
        bar.dataset.sig = sig;
        let ic, name;
        if (hi.jobs.length) {
          const j = hi.jobs[0], w = jobWorkersTag(j);
          ic = icon(j.id, "sm");
          name = "Commande · " + esc(I[j.id].n) + (E.isUnique(I[j.id]) ? "" : " ×" + fmt(j.n)) +
            (w ? " · " + esc(w) : "") +
            (hi.jobs.length > 1 ? ' <span class="tiny muted">+' + (hi.jobs.length - 1) + "</span>" : "");
        } else {
          ic = icon(a.res, "sm");
          name = "Récolte · " + esc(I[a.res].n);
        }
        bar.innerHTML = '<button class="ab-main" data-ab="' + (hi.jobs.length ? "hands" : "harvest") + '" aria-label="' + (hi.jobs.length ? "Voir les commandes en cours" : "Voir le gisement : " + esc(I[a.res].n)) + '">' + ic + '<span class="ab-t"><span class="ab-n">' + name + '</span><span class="ab-bar"><i></i></span></span><b class="ab-c"></b></button>' +
          (a ? '<button class="ab-x" data-ab="stop" aria-label="Arrêter la récolte : ' + esc(I[a.res].n) + '">■</button>' : "");
        iconize(bar);
      }
      bar.querySelector(".ab-bar i").style.width = (Math.max(0, Math.min(1, frac)) * 100).toFixed(1) + "%";
      bar.querySelector(".ab-c").textContent = line;
    }
    /* les gestes et la récolte : niveaux, ce qu’ils donnent, le prochain palier */
    function skillName(g) { return g === "recolte" ? D.SKILL_RECOLTE.n : D.GESTES[g].n; }
    function skillsHTML() {
      const st = S();
      const shown = E.SKILLS.filter((g) => g === "recolte" || E.gesteOK(g) || (st.skills[g] || 0) > 0);
      return '<div class="kicker">Tes mains</div><h2>Actions et récolte</h2><p class="small muted">Chaque pièce fabriquée à la main fait progresser son action, et chaque récolte fait progresser la récolte. Chaque niveau rend l’action 1 % plus rapide (pour la récolte : 1 % de ressources en plus). Aux niveaux ' + D.SKILL.perks.join(", ") + ", tu gagnes une chance d’avoir une pièce en plus. À la relève, tu gardes un dixième de ta progression.</p>" +
        '<div class="skills">' + shown.map((g) => {
          const k = E.skill(g);
          return '<div class="skill"><span class="sk-ic">' + (g === "recolte" ? gi(GI.ui && GI.ui.recolte || "sickle") : gIc(g)) + '</span><div class="grow"><div class="row between"><b>' + esc(skillName(g)) + '</b><span class="sk-l">niv. ' + k.lvl + "</span></div>" +
            '<div class="bar"><i style="width:' + (k.frac * 100).toFixed(1) + '%"></i></div><div class="tiny muted">' + (k.lvl < D.SKILL.max ? fmt(k.hi - k.xp) + " d’expérience avant le niveau " + (k.lvl + 1) : "Niveau maximal") +
            (k.perks ? " · pièce en plus : " + Math.round(E.perkChance(g) * 100) + " %" : "") + (k.next ? " · palier au niveau " + k.next : "") + "</div></div></div>";
        }).join("") + '</div><div class="acts"><button class="btn pri" data-m="close">Fermer</button></div>';
    }
    function openSkills() { openModal({ html: skillsHTML() }); }
    /* la liste des commandes en détail : ce qui est en cours, qui y travaille, ce qui manque, et de quoi annuler */
    function handsSheet() {
      const hi = E.handInfo();
      if (!hi.jobs.length) return '<div class="kicker">Commandes</div><h2>Aucune commande en cours</h2><div class="acts"><button class="btn pri" data-m="close">Fermer</button></div>';
      return '<div class="kicker">Commandes</div><h2>' + (hi.left > 0 ? "Fini dans ~" + fmtTime(hi.left) : "Commandes en cours") + '</h2><div class="picklist">' +
        hi.jobs.map((j, i) => {
          const w = jobWorkersTag(j), miss = jobMissTag(j);
          const sub = [];
          if (w) sub.push(w);
          if (miss) sub.push(miss);
          else if (j.wait) sub.push("attend une main ou une machine");
          else sub.push("fini dans ~" + fmtTime(i ? j.at : j.left));
          // ce qui bloque : d’où vient la ressource qui manque, et un accès à son gisement
          const lim = Object.keys(j.miss || {}).filter((k) => j.miss[k] > 1e-9).slice(0, 2).map((k) => limitHTML(k, j.miss[k])).join("");
          return '<div class="pick">' + icon(j.id, "sm") + '<span class="grow">' + esc(I[j.id].n) + (E.isUnique(I[j.id]) ? "" : " ×" + fmt(j.n) + " (" + fmt(j.done) + "/" + fmt(j.n) + ")") +
            '<br><span class="tiny muted">' + esc(sub.join(" · ")) + "</span>" + lim + "</span>" +
            '<button class="mini" data-m="hc" data-i="' + i + '" aria-label="Annuler">✕</button></div>';
        }).join("") +
        '</div><p class="tiny muted">Annuler une commande rend ses ressources à la Réserve.</p><div class="acts"><button class="btn pri" data-m="close">Fermer</button></div>';
    }
    function openHands() {
      openModal({
        html: handsSheet(), refresh: handsSheet,
        on: {
          hc: (b) => {
            const i = Number(b.dataset.i), j = S().hand.q[i];
            if (j && E.cancelJob(i)) { A.click(); toast("Annulé : " + esc(I[j.id].n) + ". Matières restituées."); }
            const box = $("#modal .modal-box");
            box.innerHTML = handsSheet(); iconize(box);
            render(true);
            return true;
          }
        }
      });
    }
    const handSig = () => S().hand.q.map((j) => j.id + ":" + j.i + ":" + j.k + ":" + (j.w ? 1 : 0) + ":" + JSON.stringify(j.miss)).join("|");
    function studyHTML(id) {
      const st = S();
      if (!st.studied[id]) {
        const c = E.studyCost(id);
        return '<div class="study"><button class="btn small" data-m="study"' + (st.intu < c ? " disabled" : "") + ">🔍 Étudier · ✨" + c + '</button><span class="tiny muted">Pour savoir avec quelles actions la tenter.</span></div>';
      }
      const r = E.reactions(id), gs = D.GESTE_ORDER.filter((g) => r[g]);
      return '<div class="study"><span class="tiny muted">🔍 Étudiée.</span> ' + (gs.length ? '<span class="tiny muted">Encore à trouver :</span> ' + gs.map((g) => '<span class="g">' + gIc(g) + " " + D.GESTES[g].n + " · " + r[g] + "</span>").join(" ")
        : '<span class="tiny muted">Rien de plus à tenter avec tes actions et tes ressources, pour l’instant.</span>') + "</div>";
    }
    /* Détail récursif d’une recette : étapes, matières utilisées, ce qui manque. */
    function treeHTML(id, n) {
      const p = E.plan(id, n), st = S();
      // un extracteur ou une machine (prix qui monte) ne se commande qu’avec tout en main
      const canLaunch = !E.blocker(id) && !p.locked.length && !Object.keys(p.blocked).length && (p.ok || !E.isScaled(I[id]));
      let h = '<div class="kicker">Tout ce qu’il faut fabriquer</div><div class="row">' + icon(id, "lg") + '<div class="grow"><h2 style="margin:0">' + esc(I[id].n) + "</h2>";
      if (!E.isUnique(I[id])) h += '<div class="row" style="margin-top:6px"><button class="mini" data-m="tn" data-d="-1">−</button><b style="min-width:40px;text-align:center">×' + fmt(n) + '</b><button class="mini" data-m="tn" data-d="1">+</button><button class="btn small ghost" data-m="tmax">Max</button></div>';
      h += "</div></div>";
      h += '<h3 class="sub">Étapes</h3><div class="tsteps">' + p.steps.map(([x, k]) => '<div class="tstep">' + D.GESTES[I[x].r[0]].ic + ' <span class="tiny muted">' + D.GESTES[I[x].r[0]].n + "</span> " + icon(x, "sm") + " <b>" + esc(I[x].n) + '</b> <span class="muted">× ' + fmt(k) + "</span></div>").join("") + "</div>";
      const used = Object.keys(p.used);
      if (used.length) h += '<h3 class="sub">Pris dans la Réserve</h3><div class="row wrap small">' + used.map((k) => '<span class="ing">' + icon(k, "sm") + fmt(p.used[k]) + " " + esc(I[k].n) + "</span>").join("") + "</div>";
      const miss = Object.keys(p.missing).filter((k) => !p.locked.includes(k) && !p.blocked[k]);
      if (miss.length) h += '<h3 class="sub" style="color:var(--bad)">' + (E.isScaled(I[id]) ? "Il manque" : "Il manque (pris dans la Réserve au fur et à mesure)") + '</h3><div class="row wrap small">' + miss.map((k) => '<span class="ing lack">' + icon(k, "sm") + fmt(p.missing[k]) + " " + esc(I[k].n) + "</span>").join("") + "</div>";
      if (p.locked.length) h += '<p class="why">Recettes encore inconnues : ' + p.locked.map((k) => esc(I[k].n)).join(", ") + "</p>";
      const bl = Object.keys(p.blocked);
      if (bl.length) h += '<p class="why">' + bl.map((k) => esc(I[k].n) + " : " + needText(k, p.blocked[k], true)).join(" · ") + "</p>";
      h += '<div class="acts"><button class="btn" data-m="close">Fermer</button>' + (st.track && st.track.id === id ? "" : '<button class="btn" data-m="track">🎯 Suivre</button>') +
        '<button class="btn pri" data-m="go"' + (canLaunch ? "" : " disabled") + ">⚡ Commander (×" + fmt(n) + ")</button></div>";
      return h;
    }
    function openTree(id, n) {
      let times = Math.max(1, n || 1);
      openModal({
        html: treeHTML(id, times),
        on: {
          tn: (b) => { times = Math.max(1, times + Number(b.dataset.d) * (times >= 100 ? 10 : 1)); $("#modal .modal-box").innerHTML = treeHTML(id, times); return true; },
          tmax: () => { times = Math.max(1, E.maxPlan(id)); $("#modal .modal-box").innerHTML = treeHTML(id, times); return true; },
          track: () => { E.setTrack(id); toast("🎯 Suivi : <b>" + esc(I[id].n) + "</b> (en haut du Domaine)"); },
          go: (b) => { chainCraft(b, id, times); }
        }
      });
    }

    /* Aller à la recette d’un objet dans le Carnet (ou à sa zone s’il se récolte). */
    /* ------------------------------------------------------------ fenêtres de recettes
     * Toucher un objet ouvre sa fiche ; ses ingrédients, ce qu’il sert à fabriquer
     * et sa station sont cliquables. ← revient à la fiche précédente. */
    function goto(id) {
      if (!I[id]) return;
      // Curiosité : Anneau sans fard
      if (id === "anneau_lourd" && E.count("anneau_lourd") > 0) {
        E.take("anneau_lourd", E.count("anneau_lourd"));
        E.addCurio("anneau");
        toast("Il est très lourd pour sa taille. Tu le reposes.");
        render(true);
        return;
      }
      // Curiosité : Dé à vingt faces
      if (id === "de_vingt") {
        const st = S();
        st.meta = st.meta || {};
        st.meta.d20Rolls = (st.meta.d20Rolls || 0) + 1;
        const roll = st.meta.d20Rolls === 1 ? 20 : (Math.floor(Math.random() * 20) + 1);
        toast("🎲 Tu le lances : " + roll + ".");
      }
      // Curiosité : WTC (Antoine Daniel) - 10 ouvertures en moins de 20s
      const now = Date.now();
      if (U.inspectHist && U.inspectHist.id === id) {
        U.inspectHist.times = U.inspectHist.times.filter((t) => now - t <= 20000);
        U.inspectHist.times.push(now);
        if (U.inspectHist.times.length >= 10) {
          if (E.addCurio("wtc")) {
            U.wtcItalic = true;
          }
        }
      } else {
        U.inspectHist = { id, times: [now] };
      }
      U.rstack = [id];
      swapModal(recipeModal());
    }
    function recipeNav(id) {
      if (!I[id]) return;
      U.rstack = (U.rstack || []).concat(id).slice(-30);
      A.page();
      swapModal(recipeModal());
    }
    const recHere = () => (U.rstack && U.rstack.length ? U.rstack[U.rstack.length - 1] : null);
    function recipeModal() {
      const id = recHere(), it = I[id], st = S();
      const known = !!st.known[id], visible = known || visibleRecipes().includes(id) || !it.r;
      const uniq = E.isUnique(it), owned = uniq && (st.made[id] || 0) > 0;
      const nav = (k, extra) => '<button class="ing link" data-m="nav" data-id="' + k + '">' + (st.seen[k] || st.known[k] ? icon(k, "sm") : '<span class="ic sm unk">?</span>') + esc(I[k].n) + (extra || "") + "</button>";
      const isWtcItalic = U.wtcItalic;
      if (isWtcItalic) U.wtcItalic = false;
      let h = '<div class="rwin"' + (isWtcItalic ? ' style="font-style:italic"' : "") + '><div class="row">' + (known || !it.r || st.seen[id] ? icon(id, "lg") : '<span class="ic lg unk">?</span>') +
        '<div class="grow"><div class="kicker">' + TYPE[it.t] + (D.AGES[it.a] ? " · " + esc(D.AGES[it.a].n) : "") + "</div><h2 style=\"margin:0\">" + (nameShown(id) ? esc(it.n) : "Recette inconnue") + "</h2>" +
        (E.stars(id) ? '<div class="stars" title="Maîtrise : fabriqué ' + fmt(st.made[id] || 0) + ' fois">' + "★".repeat(E.stars(id)) + ' <span class="tiny muted">maîtrise</span></div>' : "") + "</div>" +
        (!uniq && !E.isScaled(it) && (st.inv[id] || 0) > 0 ? '<button class="pinb fav' + (favs()[id] ? " on" : "") + '" data-m="fav" aria-label="Ressource favorite" title="Ressource favorite (en tête de liste à l’Atelier)">' + (favs()[id] ? "♥" : "♡") + "</button>" : "") +
        (it.r && known ? '<button class="pinb' + (st.pins[id] ? " on" : "") + '" data-m="pin" aria-label="Épingler la recette" title="Épingler la recette en haut de l’Atelier">' + (st.pins[id] ? "★" : "☆") + "</button>" : "") + "</div>";
      if (!visible) {
        h += '<p class="small muted">Un objet d’un âge que tu n’as pas encore atteint. Avance dans le jeu pour en savoir plus.</p>';
      } else {
        // d’abord ce que fait l’objet (la couche « jeu »), puis le récit, à part
        if (known || !it.r) {
          if (it.u) h += '<p class="small">' + esc(it.u) + "</p>";
          else if (TYPE_HINT[it.t]) h += '<p class="tiny muted">' + TYPE_HINT[it.t] + "</p>";
          if (it.d) h += '<p class="serif rdesc"><i>' + esc(itD(it)) + "</i></p>";
        }
        // l’effet en vert, sauf ce que la ligne « jeu » dit déjà
        const plain = (t) => t.toLowerCase().replace(/[^a-zà-ÿ0-9]+/g, " ").trim();
        const fx = fxList(id).filter((f) => !(it.u && plain(it.u).includes(plain(f))));
        if (fx.length) h += '<p class="small" style="color:var(--good)">' + esc(fx.join(" · ")) + "</p>";
        const f = E.flows();
        const inR = E.rate(id) + (f.prod[id] || 0);
        const outR = f.cons[id] || 0;
        const netR = inR - outR;
        let flowInfo = "";
        if (inR > 1e-4 || outR > 1e-4) {
          const netStr = (netR > 1e-4 ? "+" : netR < -1e-4 ? "-" : "") + perMin(Math.abs(netR));
          const color = netR > 1e-4 ? "var(--good)" : netR < -1e-4 ? "var(--bad)" : "var(--muted)";
          flowInfo = ' · Solde : <b style="color:' + color + '">' + netStr + "</b>" +
            (inR > 1e-4 && outR > 1e-4 ? ' <span class="tiny muted">(+' + perMin(inR) + " / -" + perMin(outR) + ")</span>" : "");
        }
        h += '<p class="small muted">' + (uniq ? (owned ? "Tu le possèdes." : "Tu ne l’as pas encore.") : "Tu en as <b>" + fmt(st.inv[id] || 0) + "</b>" + flowInfo) + "</p>";
        const zid = E.RES_ZONE[id];
        if (zid) h += '<div class="row wrap small">Se récolte dans : <button class="ing link" data-m="zone" data-z="' + zid + '">' + (GI.zones && GI.zones[zid] ? gi(GI.zones[zid]) : E.ZONES[zid].ic) + " " + esc(zoneName(zid)) + "</button>" +
          (E.zoneOpen(zid) ? "" : ' <span class="tiny muted">(terre pas encore atteinte)</span>') + "</div>";
        if (it.r) {
          h += '<h3 class="sub">Recette</h3>';
          if (known) {
            const cost = E.costFor(id);
            h += '<div class="rrow">' + gesteChip(id) + '<span class="muted">donne ' + fmt(it.r[2]) + "</span></div>" +
              '<div class="rings">' + Object.keys(cost).map((k) => {
                const have = st.inv[k] || 0, lack = have + 1e-9 < cost[k];
                const ok = !lack;
                const canMake = lack && I[k].r && E.plan(k, Math.ceil(cost[k] - have)).ok;
                return '<button class="ring ' + (ok ? "ok" : "lack") + '" data-m="nav" data-id="' + k + '">' + icon(k, "sm") +
                  '<span class="grow">' + esc(I[k].n) + (canMake ? ' <span class="can-make">(prêt à fabriquer)</span>' : "") + '</span>' +
                  '<span class="tiny">' + fmt(have) + " / " + fmt(cost[k]) + (ok ? " ✓" : "") + '</span><span class="go">›</span></button>';
              }).join("") + "</div>";
            const b = E.blocker(id), opt = it.r[3] || {};
            const station = b && b.why === "heat" ? E.stationFor("chauffer", b.heat, 0) : b && b.why === "lvl" ? E.stationFor(it.r[0], 0, b.lvl) : b && b.why === "geste" && it.r[0] !== "accorder" ? E.stationFor(it.r[0], 0, 0) : null;
            if (b && b.why !== "owned") h += '<p class="why">' + (station ? "Il faut d’abord : " + nav(station) + (b.why === "heat" ? " (" + fmtHeat(b.heat) + ")" : "") : cap1(needText(id, b))) + "</p>";
            else if (opt.heat || opt.lvl) {
              const sta = opt.heat ? E.stationFor("chauffer", opt.heat, 0) : E.stationFor(it.r[0], 0, opt.lvl);
              if (sta) h += '<p class="tiny muted">Station : ' + nav(sta) + (S().made[sta] || E.count(sta) >= 1 ? " ✓ tu l’as" : "") + "</p>";
            }
            if (E.automatable(id)) {
              const mneed = E.machFor(id);
              if (mneed && I[mneed]) h += '<p class="small muted">Machine : ' + esc(I[mneed].n) + " ou mieux</p>";
            }
            if (!owned && !b) {
              h += '<div class="row wrap rbtns">' + craftBtns(id).replace(/data-cr=/g, 'data-m="cr" data-cr=') +
                '<button class="btn small ghost" data-m="tree">🌳 Détail</button>' + (st.track && st.track.id === id ? "" : '<button class="btn small ghost" data-m="track">🎯 Suivre</button>') + "</div>";
            }
          } else {
            const lvl = st.hints[id] || 0, big = mainIngredient(id), n = Object.keys(it.r[1]).length;
            if (it.h) h += '<div class="riddle small">« ' + esc(it.h) + " »</div>";
            h += '<p class="small muted">Action : ' + (lvl >= 1 ? gesteChip(id) : "?") + " · " + n + " ressource" + (n > 1 ? "s" : "") + (lvl >= 2 ? " dont " + nav(big) : "") + "</p>";
            const dc = E.decipherCost(id);
            if (dc !== null) {
              const rev = ["Révèle l’action.", "Révèle une des ressources.", "Révèle la recette entière."][lvl];
              const ok = st.intu >= dc;
              h += '<div class="decipher"><button class="btn small' + (ok ? " pri" : "") + '" data-m="decipher"' + (ok ? "" : " disabled") + ">✨ Déchiffrer : " + dc + " ✨</button>" +
                '<div class="tiny muted">' + rev + (ok ? "" : " Pas assez d’Intuition (tu as " + Math.floor(st.intu) + " ✨).") + "</div></div>";
            }
            const m = E.memory();
            if (m && m.id === id) h += memoryHTML(m);
            else h += '<p class="tiny muted">À toi de la trouver à l’Atelier. Étudier les ressources aide à savoir quoi tenter.</p>';
          }
        }
        const uses = Object.keys(I).filter((k) => I[k].r && I[k].r[1][id] !== undefined);
        const ku = uses.filter((k) => st.known[k]), unk = uses.length - ku.length;
        if (uses.length) {
          // à ta portée : le geste maîtrisé et toutes les matières déjà vues ; les autres viendront plus tard
          const now = Object.values(E.reactions(id)).reduce((a, b) => a + b, 0), later = unk - now;
          const unkTxt = (now ? now + " à trouver dès maintenant" : "") + (now && later ? ", " : "") + (later ? later + " plus tard" : "");
          h += '<h3 class="sub">Sert à fabriquer</h3><div class="row wrap">' + ku.map((k) => nav(k)).join("") +
            (unk ? '<span class="tiny muted">' + (ku.length ? "et d’autres recettes encore inconnues : " : "Recettes encore inconnues : ") + unkTxt + "</span>" : "") + "</div>";
          if (unk && st.seen[id]) h += studyHTML(id);
        }
      }
      if (E.hasCurio && E.hasCurio("wtc")) {
        h += '<p class="small muted center" style="font-style:italic">« On coupe ? »</p>';
      }
      const back = U.rstack.length > 1;
      h += '<div class="acts">' + (back ? '<button class="btn" data-m="back">← ' + esc(I[U.rstack[U.rstack.length - 2]].n) + "</button>" : U.rfrom ? '<button class="btn" data-m="rfrom">← Retour</button>' : "") +
        (it.r && known ? '<button class="btn ghost" data-m="carnet">📖 Carnet</button>' : "") + (known && arbreVisible(id) ? '<button class="btn ghost" data-m="arbre">🌳 Voir dans l’arbre</button>' : "") + '<button class="btn pri" data-m="close">Fermer</button></div></div>';
      const redraw = () => { if (U.mcur && U.mcur.rec) swapModal(recipeModal()); };
      return {
        rec: true,
        html: h,
        onClose: () => { U.rstack = []; },
        on: {
          nav: (b) => { recipeNav(b.dataset.id); return true; },
          back: () => { U.rstack.pop(); A.page(); swapModal(recipeModal()); return true; },
          rfrom: () => { const f = U.rfrom; U.rfrom = null; closeModal(); if (f) setTimeout(f, 80); return true; },
          zone: (b) => { const z = b.dataset.z; if (E.zoneOpen(z)) { U.zone = z; setTimeout(() => { setTab("domaine"); Dom.focusZone(z); }, 60); } else { toast("Tu n’as pas encore atteint cette terre."); return true; } },
          cr: (b) => { craftFrom(b); redraw(); return true; },
          chain: (b) => { const r = E.plan(id, 1); if (!r.ok) { setTimeout(() => openTree(id, 1), 60); return; } chainCraft(b, id, 1); redraw(); return true; },
          tree: () => { setTimeout(() => openTree(id, 1), 60); },
          track: () => { E.setTrack(id); A.click(); toast("🎯 Suivi : <b>" + esc(it.n) + "</b> (en haut du Domaine)"); redraw(); return true; },
          pin: () => { E.togglePin(id); A.click(); redraw(); return true; },
          fav: () => { const f = favs(); if (f[id]) delete f[id]; else f[id] = 1; A.click(); redraw(); if (U.tab === "atelier") render(true); return true; },
          study: () => { if (E.study(id)) { A.discover(); if (U.tab === "atelier") render(true); } redraw(); return true; },
          decipher: () => { const r = E.decipher(id); if (r.ok) { if (r.lvl >= 3) A.discover(); save(); render(true); } redraw(); return true; },
          carnet: () => { setTimeout(() => showInCarnet(id), 60); },
          arbre: () => { setTimeout(() => arbreOuvrir(id), 60); }
        }
      };
    }
    function showInCarnet(id) {
      const it = I[id];
      U.q = ""; U.carnetFilter = "tout"; U.openAges[it.a] = true;
      if (E.isUnique(it) && S().made[id] > 0) U.showOwned = true;
      setTab("carnet");
      setTimeout(() => { const el = $('[data-rec="' + id + '"]'); if (el) { el.scrollIntoView({ block: "center", behavior: "smooth" }); flash(el); } }, 60);
    }
    function flash(el) { el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash"); }
    const openItemInfo = (id) => goto(id);

    return { arbreMaj, arbreOuvrir, arbreRendre, viewAtelier, viewCarnet, viewMachines, carnetList, whyNot, putInSlot, forge, craftFrom, chainCraft, handsHTML, handSig, startHarvest, actBar, skillName, openSkills, openHands, openTree, goto, openItemInfo };
  }

  window.EclatAtelier = { create };
})();
