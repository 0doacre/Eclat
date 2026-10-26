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
      return '<div class="card acc goal-hint"><div class="small"><span class="step-badge">✦ Nouvelle recette</span> ' + (it.h ? "<i>« " + esc(it.h) + " »</i>" : "<b>Recette à trouver</b>") + "</div>" +
        (lvl >= 1 ? '<div class="tiny muted">💭 L’action : ' + gesteChip(id) + "</div>" : "") +
        (lvl >= 2 ? '<div class="tiny muted">💭 Une des ressources : ' + icon(mainIngredient(id), "sm") + " " + esc(I[mainIngredient(id)].n) + "</div>" : "") + "</div>";
    }
    function viewAtelier() {
      const st = S();
      let h = subTabs("atelier", "machines", "Découvrir", "Machines");
      if (!E.gesteOK(U.geste)) U.geste = "tailler";
      if (!(st.stats.crafts > 0) && !Tuto.active()) h += '<div class="tip">1. Choisis une <b>action</b>. 2. Pose des <b>ressources</b> sur l’établi. 3. Lance l’action. Pour commencer : <b>Tailler</b> + <b>Bois</b>.</div>';
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
      if (niveauxTip) h += '<div class="sub-row"><span class="tiny muted">Le petit chiffre sur chaque action est son niveau. Il monte quand tu fabriques à la main.</span><button class="btn small ghost" data-skills title="Le niveau de chaque action et de la récolte">Niveaux</button><button class="btn small ghost" data-tip="tip_niveaux" title="Fermer cette astuce">Compris</button></div>';
      h += pinsHTML();
      // une seule rangée, qu’on fait glisser : le haut de l’Atelier laisse la place aux ressources
      const nG = D.GESTE_ORDER.filter((g) => E.gesteOK(g)).length + 1, wG = ($("#views") && $("#views").clientWidth || 360) - 24;
      h += '<div class="gestes' + (nG * 74 > wG ? " more" : "") + '">';
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
      const mat = st.age >= 11 ? " m-labo" : st.age >= 6 ? " m-metal" : st.age >= 3 ? " m-pierre" : "";
      h += '<div class="card bench' + mat + '" id="bench"><div class="heat small"><span>' + esc(heat) + "</span>" +
        (st.stats.crafts > 0 && !niveauxTip ? '<button class="bench-clear" data-skills title="Le niveau de chaque action et de la récolte">Niveaux</button>' : "") +
        (U.slots.some(Boolean) ? '<button class="bench-clear" data-clear aria-label="Vider l’établi">✕ Vider</button>' : "") + '</div><div class="slots">';
      U.slots.forEach((id, i) => {
        if (i) h += '<span class="plus-sep">+</span>';
        if (id) h += '<button class="slot full" data-slot="' + i + '">' + icon(id) + '<span class="sn">' + esc(I[id].n) + '</span><span class="tiny muted" data-c="' + id + '">' + fmt(st.inv[id] || 0) + "</span></button>";
        else h += '<button class="slot" data-slot="' + i + '" title="Poser une ressource ici" aria-label="Emplacement libre : poser une ressource"><span class="plus">+</span></button>';
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
      const nAct = (o.filter !== "tout" ? 1 : 0) + (o.sort !== "age" ? 1 : 0), filtreNom = (INV_FILTERS.find(([k]) => k === o.filter) || ["", ""])[1];
      const totalStock = Object.keys(st.inv).reduce((acc, k) => acc + (st.inv[k] || 0), 0);
      const inv = invItems();
      h += '<div class="sub-row"><h3 class="sub">Tes ressources</h3><button type="button" class="btn small ghost' + (U.invFiche ? " on" : "") + '" data-fichemode aria-pressed="' + (U.invFiche ? "true" : "false") + '" title="Un appui sur une ressource ouvre sa fiche (comme un appui long)">ⓘ Fiches</button>' +
        (many ? '<span class="tiny muted">' + inv.length + (inv.length > 1 ? " ressources" : " ressource") + (o.filter !== "tout" ? " · " + esc(filtreNom) : "") + " · " + fmt(totalStock) + " au total</span>" : "") +
        "</div>" + studyAllHTML() +
        // la recherche reste affichée ; le tri et les filtres se rangent derrière « Filtres » (le chiffre dit combien sont actifs) et s’ouvrent sur place
        (many ? '<div class="inv-tools"><div class="search"><input id="iq" type="search" aria-label="Chercher une ressource" placeholder="Chercher une ressource…" value="' + esc(U.iq || "") + '" autocomplete="off" spellcheck="false">' +
        (U.iq ? '<button class="search-clear" data-clear-search="iq" aria-label="Effacer">✕</button>' : "") + '</div>' +
        '<button type="button" class="btn small ghost inv-fbtn' + (nAct ? " on" : "") + '" data-filtres aria-expanded="' + (U.invPanel ? "true" : "false") + '" aria-controls="invpanel" aria-label="Tri et filtres' + (nAct ? ", " + nAct + (nAct > 1 ? " actifs" : " actif") : "") + '">Filtres' + (nAct ? ' <b class="inv-fn">' + nAct + "</b>" : "") + (U.invPanel ? " ▴" : " ▾") + "</button></div>" +
        (U.invPanel ? '<div class="inv-panel" id="invpanel"><label class="tiny muted" for="isort">Trier par</label>' +
          '<select id="isort" title="Trier les ressources" aria-label="Trier les ressources">' + INV_SORTS.map(([k, n]) => '<option value="' + k + '"' + (o.sort === k ? " selected" : "") + ">" + n + "</option>").join("") + "</select>" +
          '<div class="filters wrap" role="group" aria-label="Filtrer">' + INV_FILTERS.map(([k, n, ic]) => {
            const cnt = counts[k] || 0;
            return '<button data-if="' + k + '" title="' + (INV_FT[k] || "") + '" class="' + (o.filter === k ? "on" : "") + '" aria-pressed="' + (o.filter === k) + '">' + (ic ? ic + " " : "") + n + '<span class="f-cnt">' + cnt + "</span></button>";
          }).join("") + "</div>" + (nAct ? '<button type="button" class="btn small ghost" data-fclear>Tout effacer</button>' : "") + "</div>" : "") : "");
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
        return '<button class="inv' + (sel ? " sel" : "") + (st.inv[id] >= 1 ? "" : " zero") + (I[id].t === "relic" ? " relic" : "") + (spent ? " spent" : "") + '" data-inv="' + id + '" title="' + esc(spent ? "Plus rien à trouver avec cette ressource, pour l’instant" : I[id].n + " : ouvrir sa fiche") + '" aria-label="' + esc(I[id].n) + ' : ouvrir sa fiche"' + ">" +
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
          : (U.iq || o.filter !== "tout" ? "Aucun résultat pour cette recherche ou ces filtres." : !(st.stats.crafts > 0) ? "Le bois récolté apparaîtra ici." : "Aucune ressource disponible. Récolte dans le Domaine pour remplir ta Réserve.");
        h += '<p class="small muted center" style="padding:16px 0">' + emptyMsg + "</p>";
      } else if (Object.keys(st.known).length >= 3 && !st.flags.tip_inv_lp) {
        h += '<div class="sub-row" style="margin-top:8px"><span class="tiny dim">Appui long sur une ressource (ou « ⓘ Fiches », ou la touche « i ») : ouvre sa fiche (♥ favori, 🔍 étudier). Une ressource étudiée porte un ✦ quand elle réagit avec l’action choisie.</span><button class="btn small ghost" data-tip="tip_inv_lp">Compris</button></div>';
      }
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
    const INV_FT = {
      tout: "Toutes tes ressources",
      flow: "Celles qui entrent ou sortent en ce moment",
      res: "Les ressources brutes, récoltées telles quelles",
      comp: "Les pièces fabriquées à l’Atelier",
      geste: "Celles qui servent à l’action choisie",
      fav: "Celles que tu as marquées d’un ♥",
      new: "Celles qu’aucune recette connue n’utilise encore",
      try: "Les ressources étudiées qui cachent encore une recette"
    };
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
      return '<div class="pin">' + icon(id, "sm") + '<span class="grow pn link-txt" data-goto="' + id + '">' + esc(it.n) + (uniq ? "" : ' <span class="tiny muted" data-c="' + id + '">(' + fmt(st.inv[id] || 0) + ")</span>") + "</span>" +
        (owned ? '<span class="tiny muted">✓</span>' : '<button class="btn small pri pin-make" data-cr="' + id + '" data-n="1" title="Fabriquer : ' + esc(it.n) + '" aria-label="Fabriquer : ' + esc(it.n) + '">⚡ +1</button>') + "</div>";
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
      const body = resultBody(U.last);
      // le résultat se garde après un essai, et se réduit d’un appui
      return body && U.last && S().stats.crafts >= 3 ? body + '<button class="btn small ghost result-x" data-resclose aria-label="Réduire le résultat">▴ Réduire</button>' : body;
    }
    function resultBody(r) {
      if (!r && S().stats.crafts >= 3) return ""; // déjà appris : la carte vide ne garde pas sa place (voir .result:empty)
      if (!r) return '<p class="small muted">Choisis une action, pose jusqu’à trois ressources, puis lance l’action choisie. Le <b>thermomètre</b> indique si tu approches d’une recette.</p>';
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
        if (made > 0 && !q) { U.last = { kind: "craft", id: r.id, n: made, fresh: !r.made0 }; return resultBody(U.last); }
        const miss = q ? null : E.missingFor(r.id, 1);
        const head = '<div class="row">' + icon(r.id, "lg") + '<div class="grow">' + (r.fresh ? '<span class="new">Recette trouvée</span>' : "") + '<div class="rname">' + esc(I[r.id].n) + "</div>";
        if (q) return head + '<div class="small">✋ Commande ajoutée · Suivi au-dessus des onglets.</div></div></div>';
        // tout est là : le prix est affiché avant de fabriquer (une découverte ne prend jamais un gros stock d’office)
        if (!miss) return head + descHTML(I[r.id]) + (fxText(r.id) ? '<div class="small" style="color:var(--good);margin-top:4px">' + esc(fxText(r.id)) + "</div>" : "") +
          '<div class="row wrap small" style="margin-top:8px"><span class="muted">Ressources nécessaires (disponibles) :</span>' + ingHTML(E.costFor(r.id), { check: true, link: true }) + "</div>" +
          '<div class="row wrap" style="margin-top:8px">' + craftBtns(r.id) + "</div></div></div>";
        return head + '<div class="small">Recette découverte. Ressources manquantes :</div><div class="row wrap small" style="margin-top:4px;gap:4px">' +
          Object.keys(miss).map((i) => itemPill(i, { qty: miss[i], lack: true })).join("") + "</div>" +
          '<div class="row wrap" style="margin-top:8px"><button class="btn small pri" data-chain="' + r.id + '">⚡ Tout fabriquer</button><button class="btn small" data-tree="' + r.id + '">🌳 Détail</button><button class="btn small" data-track="' + r.id + '">🎯 Suivre</button></div></div></div>';
      }
      if (r.kind === "blocked") {
        const b = r.info;
        let msg = "Il te manque un outil.";
        if (b.why === "heat") msg = "Température insuffisante. Il faut au moins " + fmtHeat(b.heat) + " (tu atteins " + fmtHeat(E.heat()) + ").";
        if (b.why === "lvl") msg = U.geste === "marteler" ? "Ton enclume n’est pas assez dure pour ce métal." : "Il faudrait bien plus de puissance.";
        const st = b.why === "heat" ? E.stationFor("chauffer", b.heat) : b.why === "lvl" ? E.stationFor(I[r.id].r[0], 0, b.lvl) : null;
        return thermo(4) + '<div class="row" style="margin-top:6px">' + icon(r.id) + '<div class="grow"><b>' + esc(I[r.id].n) + '</b><div class="small">' + esc(msg) + "</div>" +
          (st ? '<div class="small" style="display:flex;align-items:center;gap:6px;margin-top:4px">Station nécessaire : ' + itemPill(st) + "</div>" : "") +
          (r.fresh ? '<div class="tiny muted">Recette notée dans le Carnet.</div>' : "") + "</div></div>";
      }
      if (r.kind === "owned") return '<p class="small">Tu possèdes déjà <b>' + esc(I[r.id].n) + "</b>.</p>";
      if (r.kind === "queued" || r.kind === "busy") {
        const it = I[r.id];
        const done = r.kind === "queued" && !E.queued(r.id);
        const msg = done ? "✓ Fabriqué : la pièce est rangée dans ta Réserve."
          : r.kind === "queued" ? "✋ Commande ajoutée. Durée estimée : " + fmtTime(r.time) + "."
          : r.why === "full" ? "Commandes au maximum. Une place se libère à la fin d’une commande."
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
      if (E.isUnique(it)) return '<button class="btn small pri" data-cr="' + id + '" data-n="1" title="Commander 1 exemplaire, pièces comprises">Fabriquer</button>';
      // le prix d’un extracteur ou d’une machine monte à chaque exemplaire : pas de ×1000
      const sizes = E.isScaled(it) ? [10] : (D.COMMANDES && D.COMMANDES.sizes) || [10, 50, 100, 1000];
      const lbl = E.isScaled(it) ? "Construire" : "Fabriquer";
      return '<button class="btn small pri" data-cr="' + id + '" data-n="1" title="Commander 1 exemplaire, pièces comprises">' + lbl + "</button>" +
        sizes.map((sz) => '<button class="btn small" data-cr="' + id + '" data-n="' + sz + '" title="Commander ' + sz + ' exemplaires d’un coup, pièces comprises">×' + sz + "</button>").join("") +
        '<button class="btn small" data-cr="' + id + '" data-n="max" title="Tout ce que ta Réserve permet, pièces comprises">Max</button>';
    }

    /* ------------------------------------------------------------ CARNET */
    /* la quantité du Carnet : choisie une fois (en haut, elle reste visible en défilant), mémorisée, appliquée au bouton « Fabriquer » de chaque recette */
    const cqSizes = () => [1].concat((D.COMMANDES && D.COMMANDES.sizes) || [10, 50, 100, 1000], ["max"]);
    const cqNow = () => { const q = S().flags.carnetQty; return cqSizes().includes(q) ? q : 1; };
    /* la quantité mémorisée, ramenée à ce que cette recette accepte (une pièce unique : 1 ; un extracteur ou une machine : pas de ×50 ni plus) */
    function cqFor(it) {
      const q = cqNow();
      if (E.isUnique(it)) return 1;
      if (E.isScaled(it)) return q === 1 || q === 10 || q === "max" ? q : 10;
      return q;
    }
    function cqBarHTML() {
      const q = cqNow();
      return '<div class="qtybar" role="group" aria-label="Quantité à fabriquer"><span class="tiny muted">Quantité</span>' +
        cqSizes().map((n) => '<button type="button" class="chipq' + (n === q ? " on" : "") + '" data-qty="' + n + '" title="' + (n === "max" ? "Tout ce que ta Réserve permet" : n === 1 ? "Un seul exemplaire" : n + " exemplaires d’un coup") + '" aria-pressed="' + (n === q) + '">' + (n === "max" ? "Max" : "×" + n) + "</button>").join("") + "</div>";
    }
    function carnetBook() {
      const st = S(), book = E.carnet().map((s) => ({ age: s.age, ids: s.ids.slice() }));
      for (const id of Object.keys(st.known)) {
        const it = I[id]; if (!it || !it.r || it.path) continue;
        let sec = book.find((s) => s.age === it.a);
        if (!sec) { sec = { age: it.a, ids: [] }; book.push(sec); }
        if (!sec.ids.includes(id)) sec.ids.push(id);
      }
      return book;
    }
    function ageNavHTML(book) {
      if (U.q || U.carnetFilter === "ext" || book.length <= 1) return "";
      const st = S();
      const sorted = book.filter((s) => s.ids.some((id) => !I[id].sec && passFilter(id) && !hiddenOwned(id))).sort((a, b) => a.age - b.age);
      if (sorted.length <= 1) return "";
      const anyOpen = sorted.some((s) => U.carnetFilter !== "tout" || (U.openAges[s.age] !== undefined ? U.openAges[s.age] : s.age >= st.age));
      return '<div class="age-nav" role="navigation" aria-label="Accès rapide aux âges">' +
        '<button type="button" class="age-pill age-all" data-age-all title="' + (anyOpen ? "Replier tous les âges" : "Déplier tous les âges") + '" aria-label="' + (anyOpen ? "Replier tous les âges" : "Déplier tous les âges") + '">' + (anyOpen ? "▴ Plier" : "▾ Déplier") + "</button>" +
        sorted.map((s) => {
          const ag = D.AGES[s.age];
          const cur = s.age === st.age;
          return '<button type="button" class="age-pill' + (cur ? " cur" : "") + '" data-age-jump="' + s.age + '" style="--ac:' + ag.c + '" title="' + esc(ag.n) + '" aria-label="Aller à : ' + esc(ag.n) + '">Âge ' + (s.age + 1) + "</button>";
        }).join("") + "</div>";
    }
    function viewCarnet() {
      const st = S();
      const all = Object.keys(st.known).filter((id) => I[id] && I[id].r && !I[id].sec).length;
      const col1 = !!(st.settings && st.settings.carnet1Col);
      const dense = U.compact();
      let h = '<div class="carnet-head"><div class="grow"><h2 class="title">Carnet</h2>' +
        '<p class="small muted">' + all + (all > 1 ? " recettes apprises" : " recette apprise") + "</p></div>" +
        "</div>";
      if (!st.flags.tip_carnet) h += '<div class="tip">Retrouve tes recettes et choisis un lot à fabriquer. ×10 répète la recette dix fois ; les pièces intermédiaires sont fabriquées avec la commande. Les indices des autres recettes restent dans <b>À découvrir</b>. <button class="btn small ghost" data-tip="tip_carnet" title="Fermer cette astuce">Compris</button></div>';
      h += '<div class="search"><input id="cq" type="search" aria-label="Chercher une recette ou une ressource" placeholder="Chercher une recette ou une ressource…" value="' + esc(U.q || "") + '" autocomplete="off" spellcheck="false">' +
        (U.q ? '<button class="search-clear" data-clear-search="cq" aria-label="Effacer">✕</button>' : '') + '</div>';
      if (U.carnetFilter !== "unk") h += cqBarHTML();
      const CF_T = { tout: "Toutes les recettes que tu connais", pret: "Celles que ta Réserve couvre entièrement, pièces comprises", craft: "Celles dont les pièces manquantes peuvent encore être fabriquées", unk: "Celles qu’il te reste à découvrir", ext: "Les bâtiments qui récoltent à ta place", tool: "Les outils et leurs améliorations", mach: "Les machines qui fabriquent seules", pin: "Tes épingles, en haut de l’Atelier" };
      h += '<div class="filters">' + [["tout", "Apprises"], ["pret", "⚡ Prêtes"], ["craft", "Réalisables"], ["unk", "À découvrir"], ["ext", "Extracteurs"], ["tool", "Outils"], ["mach", "Machines"], ["pin", "★ Épinglées"]].map(([k, n]) =>
        '<button data-cf="' + k + '" title="' + (CF_T[k] || "") + '" class="' + (U.carnetFilter === k ? "on" : "") + '">' + n + "</button>").join("") + "</div>";
      h += ageNavHTML(carnetBook());
      return h + '<div id="clist" class="' + (col1 ? "cols-1" : "cols-2") + (dense ? " carnet-dense" : "") + '">' + carnetList() + "</div>";
    }

    /* Arbre vertical : largeur du téléphone, défilement natif, voisinage d’une recette. */
    const Arb = typeof window !== "undefined" ? window.EclatArbre : null;
    function arbreEl() { return document.getElementById("v-arbre"); }
    function arbreEtat(n) {
      if (n.etat === "fantome") return "À découvrir";
      if (n.etat === "allume") return S().made[n.id] > 0 ? "Déjà fabriqué" : "Recette découverte";
      return I[n.id].r ? "Recette à découvrir" : "Ressource découverte";
    }
    function arbreCarte(n, centre) {
      const fant = n.etat === "fantome";
      const tag = centre ? "article" : "button";
      return '<' + tag + (centre ? ' tabindex="-1" aria-label="' + esc(fant ? "Recette à découvrir" : n.n) + '"' : ' type="button" data-arbsel="' + esc(n.cle) + '" title="Ouvrir cette branche : ses ingrédients et ses usages"') +
        ' class="arb-card ' + n.etat + (centre ? " sel" : "") + '" data-arbn="' + esc(n.cle) + '">' +
        (fant ? '<span class="arb-inconnu" aria-hidden="true">?</span>' : icon(n.id, "sm")) +
        '<span class="arb-card-corps"><span class="arb-l">' + esc(fant ? "Recette à découvrir" : n.n) + '</span>' +
        '<span class="arb-status">' + esc(arbreEtat(n)) + '</span>' +
        (n.objectif ? '<span class="arb-objectif">Objectif</span>' : '') + '</span></' + tag + '>';
    }
    /* la place d’une pastille dans son âge : les matières d’abord, puis les recettes de la moins profonde à la plus profonde, les pistes à la fin */
    function arbreRang(n, g) {
      if (n.etat === "fantome") return 99;
      if (n.etat === "vu") return 0;
      const it = I[n.id], dans = new Set(g.noeuds.filter((x) => x.age === n.age).map((x) => x.id));
      let d = 0;
      for (const k in it.r[1]) if (dans.has(k) && k !== n.id) { const x = g.noeuds.find((m) => m.id === k); d = Math.max(d, x ? arbreRang(x, { noeuds: g.noeuds.filter((m) => m.id !== n.id) }) : 0); }
      return 1 + d;
    }
    /* une pastille de la frise : une icône, un nom court, un état écrit pour le lecteur d’écran */
    function arbrePastille(n) {
      const fant = n.etat === "fantome", nom = fant ? "Recette à découvrir" : n.n;
      return '<button type="button" class="arb-pas ' + n.etat + (n.objectif ? " obj" : "") + '" data-arbsel="' + esc(n.cle) + '" data-arbn="' + esc(n.cle) + '" aria-label="' + esc(nom + ", " + arbreEtat(n).toLowerCase() + (n.objectif ? ", objectif" : "")) + '" title="Ouvrir : ses ingrédients et ses usages">' +
        (fant ? '<span class="arb-inconnu" aria-hidden="true">?</span>' : icon(n.id, "sm")) + '<span class="arb-pas-n" aria-hidden="true">' + esc(fant ? "?" : nom) + '</span></button>';
    }
    function arbreResultats(q) {
      q = norm(q || "").trim();
      if (!q) return '<p class="small muted">Cherche une recette ou une ressource que tu connais.</p>';
      const hits = (U.arbreG ? U.arbreG.noeuds : []).filter((n) => n.id && norm(n.n).includes(q));
      hits.sort((a, b) => (norm(a.n).startsWith(q) ? 0 : 1) - (norm(b.n).startsWith(q) ? 0 : 1) || a.n.localeCompare(b.n, "fr"));
      return hits.length ? hits.slice(0, 8).map((n) => arbreCarte(n, false)).join("") : '<p class="small muted">Rien de tel parmi ce que tu connais.</p>';
    }
    function arbreBarre(g) {
      return '<div class="arb-barre"><button type="button" class="btn small" data-arb="ensemble" aria-pressed="' + !U.arbreSel + '" title="Ta progression : ton âge, tes étapes et le prochain objectif">Progression</button>' +
        '<button type="button" class="btn small" data-arb="centre" title="Ton objectif du moment, et ce qu’il demande">Objectif</button>' +
        '<button type="button" class="btn small ghost" data-arb="chercher" aria-label="Chercher dans l’arbre" aria-expanded="' + !!U.arbreChercher + '">🔍</button></div>' +
        '<div class="arb-chercher" role="search"' + (U.arbreChercher ? '' : ' hidden') + '><label for="arbq">Chercher dans l’arbre</label>' +
        '<input id="arbq" type="search" placeholder="Recette ou ressource" value="' + esc(U.arbreQ || '') + '" autocomplete="off" spellcheck="false">' +
        '<div id="arbres" class="arb-grille" aria-live="polite">' + arbreResultats(U.arbreQ) + '</div></div>';
    }
    function arbreEnsemble(g) {
      const etapes = E.milestones()[g.age] || [], faites = etapes.filter((x) => x.done).length;
      const objectif = g.noeuds.find((n) => n.objectif), ob = E.objective();
      let h = '<header class="arb-entete"><h2>Ta progression</h2></header><section class="arb-progression"><h3>' + esc(D.AGES[g.age].n) + '</h3>' +
        '<p>' + faites + ' / ' + etapes.length + ' étapes accomplies</p><progress value="' + faites + '" max="' + Math.max(1, etapes.length) + '" aria-label="Étapes accomplies dans cet âge"></progress>';
      if (objectif) h += '<h3>Prochain objectif</h3>' + arbreCarte(objectif, false);
      else if (ob) h += '<h3>Prochain objectif</h3><p>' + esc(ob.txt || ob.n || 'Poursuivre l’exploration') + '</p>';
      else h += '<p>Tu as accompli les objectifs proposés.</p>';
      h += '</section><h3 class="arb-parcours-titre">Tes découvertes par âge</h3><div class="arb-legende" aria-hidden="true"><span><i class="allume"></i>trouvée</span><span><i class="vu"></i>matière vue</span><span><i class="fantome"></i>à trouver</span><span><i class="obj"></i>objectif</span></div>';
      for (let a = 0; a <= g.max; a++) {
        const ns = g.noeuds.filter((n) => n.age === a);
        const ouverts = U.arbreAges || {};
        const ouvert = ouverts[a] !== undefined ? ouverts[a] : a === Math.min(g.age, g.max);
        h += '<details class="arb-age-groupe" data-arbage="' + a + '"' + (ouvert ? ' open' : '') + '><summary><span>' + esc(D.AGES[a].n) + '</span><span class="arb-age-compte">' + ns.filter((n) => n.etat === 'allume').length + ' connue' + (ns.filter((n) => n.etat === 'allume').length > 1 ? 's' : '') + '</span></summary>';
        const rang = new Map(ns.map((n) => [n.cle, arbreRang(n, g)]));
        ns.sort((x, y) => rang.get(x.cle) - rang.get(y.cle) || (x.n || "").localeCompare(y.n || "", "fr"));
        h += (ns.length ? '<div class="arb-frise">' + ns.map(arbrePastille).join('') + '</div>' : '<p class="small muted">Rien découvert pour l’instant.</p>') + '</details>';
      }
      if (g.max < D.AGES.length - 1) h += '<p class="small muted">Les autres âges se dévoileront au fil de tes découvertes.</p>';
      return h;
    }
    function arbreBranche(g, cle) {
      const v = Arb.voisinage(g, cle);
      if (!v) return arbreEnsemble(g);
      const n = v.centre, it = n.id && I[n.id];
      let h = '<header class="arb-entete">' + ((U.arbreHistorique || []).length ? '<button type="button" class="btn small ghost" data-arb="retour" title="Revenir à la recette d’avant">← Revenir</button>' : '') + '<p class="small muted">' + esc(D.AGES[n.age].n) + '</p></header>';
      if (v.amont.length) {
        h += '<section class="arb-etape" aria-labelledby="arb-ingredients"><h3 id="arb-ingredients">' + (n.etat === 'fantome' ? 'Une piste pour commencer' : 'Utilise') + '</h3><div class="arb-frise arb-voisins">' + v.amont.map(arbrePastille).join('') + '</div></section><div class="arb-fleche" aria-hidden="true">↓</div>';
      }
      h += '<section class="arb-selection" aria-label="Objet sélectionné">' + arbreCarte(n, true) + '<div class="arb-actions">';
      const cibleId = n.id || (n.objectif && E.objective() && E.objective().k === 'craft' ? E.objective().id : null);
      if (cibleId) h += '<button type="button" class="btn small" data-chemin="' + esc(cibleId) + '" title="Chemin : la route complète jusqu’à l’objet">Chemin</button>';
      if (n.etat === 'allume') h += '<button type="button" class="btn small" data-carnet-rec="' + esc(n.id) + '">Ouvrir la recette dans le Carnet</button>';
      else if (it) h += '<button type="button" class="btn small" data-goto="' + esc(n.id) + '">Voir la fiche</button>';
      h += '</div>';
      if (n.etat === 'fantome' || (n.etat !== 'allume' && it.r)) h += '<p class="small muted">' + (n.etat === 'fantome' ? 'Essaie avec les ressources que tu as étudiées à l’Atelier.' : 'La recette reste à découvrir à l’Atelier.') + '</p>';
      h += '</section>';
      if (v.aval.length) {
        const connus = v.aval.filter((p) => p.etat !== 'fantome'), inconnus = v.aval.length - connus.length;
        const visibles = U.arbreTout ? connus : connus.slice(0, 8);
        h += '<div class="arb-fleche" aria-hidden="true">↓</div><section class="arb-etape" aria-labelledby="arb-usages"><h3 id="arb-usages">Sert à fabriquer</h3><div class="arb-frise arb-voisins">' + visibles.map(arbrePastille).join('') + '</div>';
        if (connus.length > visibles.length) h += '<button type="button" class="btn small wide" data-arb="tout" title="Afficher tous les usages connus">Voir les ' + connus.length + ' usages connus</button>';
        if (inconnus) h += '<p class="small arb-pistes">' + inconnus + (inconnus > 1 ? ' autres recettes restent à découvrir.' : ' autre recette reste à découvrir.') + '</p>';
        h += '</section>';
      } else h += '<p class="small muted">Aucun usage découvert pour le moment.</p>';
      return h;
    }
    function arbreBati(el) {
      if (!el || !Arb) return;
      const v = el.querySelector('#arbre'), scroll = v ? v.scrollTop : 0;
      const focus = document.activeElement, action = focus && focus.dataset && focus.dataset.arb;
      const recherche = focus && focus.id === 'arbq', caret = recherche ? focus.selectionStart : null;
      const ancien = U.arbreG && U.arbreG.noeuds.find((n) => n.cle === U.arbreSel);
      const signature = arbreSignature(Arb.graphe(E, D));
      U.arbreG = Arb.graphe(E, D);
      // une piste (fantôme) change de clé quand l’arbre change : la feuille ouverte sur elle se ferme
      if (U.arbreSel && ((ancien && ancien.etat === 'fantome' && el.dataset.sig !== signature) || !U.arbreG.noeuds.some((n) => n.cle === U.arbreSel))) { U.arbreSel = null; U.arbreHistorique = []; if (U.mcur && U.mcur.arbre) closeModal(); }
      el.innerHTML = arbreBarre(U.arbreG) + '<div id="arbre" class="arb-vue" tabindex="0" aria-label="Arbre des connaissances, défilement vertical">' + arbreEnsemble(U.arbreG) + '</div>';
      el.dataset.sig = arbreSignature(U.arbreG);
      el.querySelector('#arbre').scrollTop = scroll;
      el.querySelectorAll('details[data-arbage]').forEach((d) => d.addEventListener('toggle', () => { if (d.isConnected) (U.arbreAges || (U.arbreAges = {}))[d.dataset.arbage] = d.open; }));
      iconize(el);
      if (recherche) { const q = el.querySelector('#arbq'); q.focus({ preventScroll: true }); if (caret !== null) q.setSelectionRange(caret, caret); }
      if (action) { const b = el.querySelector('[data-arb="' + action + '"]'); if (b) b.focus({ preventScroll: true }); }
    }
    /* la feuille : la branche d’une recette dans une fenêtre qui monte du bas, l’arbre reste dessous. Une pastille de la feuille la fait passer à celle-là. */
    function arbreFeuille() {
      const o = { html: '<div class="arb-sheet-c">' + arbreBranche(U.arbreG, U.arbreSel) + '</div>', cls: 'arb-sheet', arbre: true,
        onClose: () => { U.arbreSel = null; U.arbreHistorique = []; U.arbreTout = false; } };
      if (U.mcur && U.mcur.arbre) { swapModal(o); const box = document.querySelector('#modal .modal-box'); if (box) box.insertAdjacentHTML('afterbegin', '<button class="modal-x" data-m="close" aria-label="Fermer">✕</button>'); }
      else openModal(o);
    }
    function arbreChoisir(cle, historique) {
      if (!U.arbreG || !U.arbreG.noeuds.some((n) => n.cle === cle)) return;
      if (historique && U.arbreSel && U.arbreSel !== cle) (U.arbreHistorique || (U.arbreHistorique = [])).push(U.arbreSel);
      U.arbreSel = cle; U.arbreTout = false;
      if (U.arbreChercher) { U.arbreChercher = false; U.arbreQ = ''; arbreBati(arbreEl()); }
      arbreFeuille();
      const c = document.querySelector('#modal .arb-selection .sel');
      if (c) c.focus({ preventScroll: true });
    }
    function arbreOuvrir(id) { if (!Arb) return; U.arbreVoirId = id || null; setTab('arbre'); }
    function arbreRendre(el) {
      if (!Arb) return;
      const id = U.arbreVoirId; U.arbreVoirId = null;
      const g = Arb.graphe(E, D);
      const premier = !el.firstElementChild;
      if (premier) U.arbreSel = null;
      if (!el.firstElementChild || el.dataset.sig !== arbreSignature(g)) arbreBati(el);
      if (id) { U.arbreHistorique = []; arbreChoisir(id); }
    }
    function arbreSignature(g) {
      return Arb.sig(g) + '|' + (E.milestones()[S().age] || []).map((x) => x.done ? 1 : 0).join('') + '|' + (E.objective() || {}).i + '|' + g.noeuds.map((n) => S().made[n.id] > 0 ? 1 : 0).join('');
    }
    function arbreMaj() {
      const el = arbreEl(); if (!el || !Arb || U.tab !== 'arbre') return;
      const g = Arb.graphe(E, D);
      if (el.dataset.sig !== arbreSignature(g)) arbreBati(el);
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('input', (e) => { if (e.target.id === 'arbq') { U.arbreQ = e.target.value; const r = document.getElementById('arbres'); if (r) { r.innerHTML = arbreResultats(U.arbreQ); iconize(r); } } });
      document.addEventListener('click', (e) => {
        const b = e.target.closest && e.target.closest('[data-arb], [data-arbsel], [data-arbre-obj], [data-carnet-rec], [data-situer], [data-chemin], [data-ch-craft], [data-ch-harv], [data-ch-voir], [data-ch-atelier]');
        if (!b) return;
        if (b.dataset.chCraft) {
          e.stopPropagation(); A.click();
          chainCraft(b, b.dataset.chCraft, 1);
          const modalBox = document.querySelector("#modal .modal-box");
          if (modalBox && U.cheminId) { modalBox.innerHTML = treeHTML(U.cheminId, U.cheminTimes || 1); iconize(modalBox); }
          return;
        }
        if (b.dataset.chHarv) {
          e.stopPropagation(); A.click();
          const res = b.dataset.chHarv, zid = E.RES_ZONE ? E.RES_ZONE[res] : null;
          closeModal();
          if (zid && E.zoneOpen && E.zoneOpen(zid)) { setTab('domaine'); if (E.harvest) E.harvest(zid, res); }
          return;
        }
        if (b.dataset.chVoir) {
          e.stopPropagation(); A.click();
          closeModal();
          if (S().known[b.dataset.chVoir]) showInCarnet(b.dataset.chVoir);
          return;
        }
        if (b.hasAttribute('data-ch-atelier')) {
          e.stopPropagation(); A.click();
          closeModal();
          setTab('atelier');
          return;
        }
        if (b.dataset.chemin) { e.stopPropagation(); A.click(); openTree(b.dataset.chemin, 1); return; }
        if (b.dataset.carnetRec) { e.stopPropagation(); if (U.mcur && U.mcur.arbre) closeModal(); if (S().known[b.dataset.carnetRec]) showInCarnet(b.dataset.carnetRec); return; }
        if (b.dataset.situer) { e.stopPropagation(); if (S().known[b.dataset.situer] && arbreVisible(b.dataset.situer)) arbreOuvrir(b.dataset.situer); return; }
        if (b.hasAttribute('data-arbre-obj')) { e.stopPropagation(); arbreOuvrir(objectifCle()); return; }
        if (!b.closest('#v-arbre, .arb-sheet-c')) return;
        e.stopPropagation(); A.click();
        if (b.dataset.arbsel) { arbreChoisir(b.dataset.arbsel, true); return; }
        const a = b.dataset.arb, el = arbreEl();
        if (a === 'chercher') {
          U.arbreChercher = !U.arbreChercher; const p = el.querySelector('.arb-chercher'); p.hidden = !U.arbreChercher; b.setAttribute('aria-expanded', U.arbreChercher);
          if (U.arbreChercher) el.querySelector('#arbq').focus();
          return;
        }
        if (a === 'centre') { const cle = objectifCle(); if (cle) { U.arbreHistorique = []; arbreChoisir(cle); return; } }
        if (a === 'retour' && (U.arbreHistorique || []).length) { arbreChoisir(U.arbreHistorique.pop()); return; }
        if (a === 'tout') { U.arbreTout = true; arbreFeuille(); return; }
        U.arbreSel = null; U.arbreHistorique = [];
        if (U.mcur && U.mcur.arbre) closeModal();
        arbreBati(el);
        el.querySelector('#arbre').scrollTop = 0;
      }, true);
    }
    E.on('learn', () => { U.arbreNeuf = null; });

    function objectifCle() {
      if (!Arb) return null;
      const n = Arb.graphe(E, D).noeuds.find((x) => x.objectif);
      return n ? n.cle : null;
    }
    const arbreVisible = (id) => !!(Arb && I[id] && I[id].r && I[id].a <= S().age + 1 && !I[id].sec && !I[id].path && I[id].t !== "curio" && I[id].t !== "relic");
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
      Object.keys(S().known).forEach((id) => { if (I[id] && I[id].r && !ids.includes(id)) ids.push(id); });
      if (E.gesteOK("accorder")) E.pathRecipes().forEach((id) => ids.push(id));
      return [...new Set(ids)];
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
      if (E.gesteOK("accorder") || E.pathRecipes().some((id) => st.known[id])) {
        const ids = E.pathRecipes().filter((id) => E.gesteOK('accorder') || st.known[id]).filter(keep);
        if (ids.length) h += '<details class="card age-sec" open><summary><span class="ic" style="border-color:#b36bff">🎵</span><span class="an">La Résonance</span></summary><div class="list">' + ids.map(recCard).join("") + "</div></details>";
      }
      // les extracteurs se rangent par bâtiment (Bûcheron, Cueilleur…), niveau après niveau, plutôt que par âge
      if (U.carnetFilter === "ext") {
        (D.LIGNES || []).forEach((L) => {
          const ids = L.niv.map((v) => v.id).filter(keep);
          if (!ids.length) return;
          const kn = L.niv.filter((v) => st.known[v.id]).length;
          h += '<details class="card age-sec" open><summary><span class="ic">' + L.ic + '</span><span class="an">' + esc(L.n) + '</span><span class="cnt">' + kn + "/" + L.niv.length + '</span></summary><div class="list">' + ids.map(recCard).join("") + "</div></details>";
        });
        return h || '<p class="small muted center">Aucun extracteur connu pour l’instant.</p>';
      }
      const book = carnetBook();
      const order = book.map((b, i) => i).sort((a, b) => {
        const rank = (x) => (book[x].age === st.age ? 0 : book[x].age === st.age + 1 ? 1 : book[x].age < st.age ? 2 + st.age - book[x].age : 2 + D.AGES.length + book[x].age);
        return rank(a) - rank(b);
      });
      for (const k of order) {
        const sec = book[k];
        const ids = sec.ids.filter((id) => !I[id].sec).filter(keep);
        if (!ids.length) continue;
        const ag = D.AGES[sec.age];
        const kn = sec.ids.filter((id) => st.known[id] && !I[id].sec).length;
        const open = U.carnetFilter !== "tout" || (U.openAges[sec.age] !== undefined ? U.openAges[sec.age] : sec.age >= st.age);
        h += '<details class="card age-sec" data-age="' + sec.age + '"' + (open ? " open" : "") + '><summary><span class="ic" style="background:' + ag.c + "22;border-color:" + ag.c + '66">' + (sec.age + 1) +
          '</span><span class="an">' + ag.n + '</span><span class="cnt">' + (U.carnetFilter === 'unk' ? ids.length + ' à découvrir' : kn + ' apprises') + '</span></summary><div class="list">' + ids.map(recCard).join("") + "</div></details>";
      }
      const secrets = Object.keys(I).filter((id) => I[id].sec && st.known[id] && I[id].r).filter(keep);
      if (secrets.length) h += '<details class="card age-sec"' + (U.carnetFilter !== "tout" ? " open" : "") + '><summary><span class="ic">🗝️</span><span class="an">Curiosités</span><span class="cnt">' + secrets.length + '</span></summary><div class="list">' + secrets.map(recCard).join("") + "</div></details>";
      if (!h) h = '<p class="small muted center">Rien ici pour l’instant.</p>';
      if (nHidden || U.showOwned) h += '<p class="center"><button class="btn small ghost" data-owned title="Masquer ou montrer les objets déjà fabriqués">' + (U.showOwned ? "Cacher les objets déjà possédés" : "Voir les " + nHidden + " objets déjà possédés") + "</button></p>";
      return h;
    }
    function passFilter(id) {
      const st = S(), it = I[id];
      if (U.carnetFilter === "tout") return !!st.known[id];
      if (U.carnetFilter === "unk") return !st.known[id];
      if (U.carnetFilter === "pret" || U.carnetFilter === "craft") {
        const lot = window.EclatCarnet.lot(E, D, id, cqNow());
        if (!lot || !lot.n || !E.ageOK(id) || E.blocker(id)) return false;
        return U.carnetFilter === 'pret' ? Object.entries(lot.cout).every(([k, n]) => (st.inv[k] || 0) + 1e-9 >= n) : lot.plan.ok;
      }
      if (U.carnetFilter === "prod") return st.known[id] && ["ext", "upg", "mach", "tool", "stat"].includes(it.t);
      if (U.carnetFilter === "ext") return st.known[id] && it.t === "ext";
      if (U.carnetFilter === "tool") return st.known[id] && ["tool", "upg"].includes(it.t);
      if (U.carnetFilter === "mach") return st.known[id] && ["mach", "stat"].includes(it.t);
      if (U.carnetFilter === "pin") return !!st.known[id] && !!st.pins[id];
      return true;
    }
    function carnetLotHTML(id, lot) {
      lot = lot || window.EclatCarnet.lot(E, D, id, cqNow());
      if (!lot) return '';
      if (!lot.n) return '<p class="small muted">Max : aucun lot disponible avec ta Réserve actuelle.</p><div class="rl lot-cout">' + gesteChip(id) + ingHTML(E.costFor(id), { check: true, link: true }) + '</div>';
      const p = lot.plan, manques = Object.keys(p.missing), connus = {};
      manques.forEach((k) => { if (S().seen[k] || S().known[k] || lot.cout[k]) connus[k] = p.missing[k]; });
      let h = '<p class="lot-titre"><b>Lot ×' + fmt(lot.n) + '</b> · ' + fmt(lot.sortie) + (lot.sortie > 1 ? ' pièces produites' : ' pièce produite') +
        (lot.duree !== null ? ' <span class="tiny muted">· ⏱ ' + fmtTime(lot.duree) + '</span>' : '') + '</p>' +
        '<div class="rl lot-cout">' + gesteChip(id) + ingHTML(lot.cout, { check: true, link: true }) + '</div>';
      if (p.locked.length) h += '<p class="small why">Une recette intermédiaire reste à découvrir.</p>';
      else if (Object.keys(p.blocked).length) h += '<p class="small why">Une étape intermédiaire est bloquée. Consulte le détail du lot.</p>';
      if (Object.keys(connus).length) h += '<div class="small lot-manques"><span>À réunir :</span>' + ingHTML(connus, { link: true }) + '</div>';
      if (manques.length > Object.keys(connus).length) h += '<p class="small why">Une ressource encore inconnue est nécessaire.</p>';
      if (!manques.length && !Object.keys(p.blocked).length && !p.locked.length && p.steps.length > 1) h += '<p class="tiny muted lot-note">Avec fabrication des pièces intermédiaires.</p>';
      return h;
    }
    function carnetLive() {
      if (Date.now() - (U.carnetP || 0) < 1000) return;
      U.carnetP = Date.now();
      if (U.carnetFilter === 'pret' || U.carnetFilter === 'craft') {
        const sig = visibleRecipes().filter(passFilter).filter((id) => !hiddenOwned(id)).sort().join('|');
        if (sig !== U.carnetFiltreSig) { U.carnetFiltreSig = sig; const l = document.getElementById('clist'); if (l) { l.innerHTML = carnetList(); iconize(l); } }
      }
      document.querySelectorAll('#v-carnet [data-carnet-lot]').forEach((el) => {
        if (!el.getClientRects().length) return;
        const id = el.dataset.carnetLot, lot = window.EclatCarnet.lot(E, D, id, cqNow()), h = carnetLotHTML(id, lot);
        if (el._lotHTML !== h) { el.innerHTML = h; el._lotHTML = h; iconize(el); }
        const rec = el.closest('.rec'), ready = lot.n > 0 && E.ageOK(id) && !E.blocker(id) && lot.plan.ok, badge = rec.querySelector('.badge-ready');
        rec.classList.toggle('can-craft', ready);
        if (ready && !badge) rec.querySelector('.rt').insertAdjacentHTML('beforeend', '<span class="badge-ready">⚡ Lot prêt</span>');
        else if (!ready && badge) badge.remove();
      });
    }
    function recCard(id) {
      const st = S(), it = I[id];
      if (!st.known[id]) {
        const lvl = st.hints[id] || 0;
        const ing = Object.keys(it.r[1]);
        const big = mainIngredient(id);
        const shown = nameShown(id, U.named);
        return '<div class="rec unknown" data-rec="' + id + '" data-goto="' + id + '" title="Ouvrir sa fiche : ce qu’il faut pour la trouver"><div class="rh"><span class="ic unk">?</span><div class="grow" data-goto="' + id + '"><div class="rt">' + (shown ? esc(it.n) : '<span class="hid">???</span>') + badgeHTML(id) + '</div><div class="tiny muted">' + esc(fxText(id)) + "</div></div></div>" +
          (it.h ? '<div class="riddle small" style="margin-top:6px">« ' + esc(it.h) + " »</div>" : "") +
          '<div class="rl tiny muted">Action : ' + (lvl >= 1 ? gesteChip(id) : "?") + " · Ressource : " + (lvl >= 2 ? '<span class="ing">' + icon(big, "sm") + esc(I[big].n) + "</span>" : "?") + " · " + ing.length + " ressource" + (ing.length > 1 ? "s" : "") + "</div></div>";
      }
      const uniq = E.isUnique(it);
      const owned = uniq && (st.made[id] || 0) > 0;
      const stars = E.stars(id);
      const lot = window.EclatCarnet.lot(E, D, id, cqNow());
      const readyCraft = !owned && E.ageOK(id) && lot.n > 0 && lot.plan.ok;
      let h = '<div class="rec' + (owned ? " owned" : "") + (readyCraft ? " can-craft" : "") + '" data-rec="' + id + '"><div class="rh">' + icon(id) + '<div class="grow" data-goto="' + id + '"><div class="rt">' + esc(it.n) + badgeHTML(id) + (readyCraft ? '<span class="badge-ready">⚡ Lot prêt</span>' : '') + "</div>" +
        (stars ? '<div class="stars">' + "★".repeat(stars) + "</div>" : "") + '</div>' +
        (readyCraft && cqFor(it) !== 1 ? '<button class="btn mini pri quick-make" data-cr="' + id + '" data-n="1" title="Fabriquer 1 exemplaire">⚡ +1</button>' : '') +
        '<div class="small muted" data-c="' + id + '">' + (uniq ? (owned ? "✓" : "") : fmt(st.inv[id] || 0)) + "</div>" +
        '<button class="pinb' + (st.pins[id] ? " on" : "") + '" data-pin="' + id + '" title="Épingler cette recette en haut de l’Atelier" aria-label="Épingler cette recette en haut de l’Atelier">' + (st.pins[id] ? "★" : "☆") + "</button></div>";
      const fx = fxText(id);
      if (fx) h += '<div class="fx">' + esc(fx) + (E.isScaled(it) ? ' · <span class="muted">Construits : ' + Math.floor(st.inv[id] || 0) + "</span>" : "") + "</div>";
      else if (E.isScaled(it)) h += '<div class="tiny muted" style="margin-top:3px">Construits : ' + Math.floor(st.inv[id] || 0) + "</div>";
      if (!owned) h += '<div class="carnet-lot" data-carnet-lot="' + id + '">' + carnetLotHTML(id) + '</div>';
      const situerBtn = arbreVisible(id) ? '<button type="button" class="btn small ghost icon-act carnet-situer" data-situer="' + id + '" title="Situer dans l’Arbre" aria-label="Situer dans l’Arbre">🌿</button>' : "";
      if (!owned) {
        const b = E.blocker(id);
        if (!E.ageOK(id)) h += '<div class="rec-foot"><div class="why">Recette conservée. Fabrication disponible : ' + esc(D.AGES[it.a].n) + '.</div>' + (situerBtn ? '<div class="acts carnet-acts">' + situerBtn + '</div>' : '') + '</div>';
        else if (b && b.why !== "owned") h += '<div class="rec-foot"><div class="why">' + cap1(needText(id, b, true)) + "</div>" + (situerBtn ? '<div class="acts carnet-acts">' + situerBtn + '</div>' : '') + "</div>";
        else {
          const qn = cqFor(it), lbl = E.isScaled(it) ? "Construire" : "Fabriquer";
          const treeLbl = lot.n ? "Détail du lot" : "Détail de la recette";
          h += '<div class="acts carnet-acts"><button class="btn small pri make" data-cr="' + id + '" data-n="' + qn + '" data-lbl="' + lbl + '" title="Commander cette quantité, pièces comprises">' + lbl + (qn === 1 ? "" : qn === "max" ? " Max" : " ×" + qn) + "</button>" +
            '<button class="btn small ghost icon-act" data-tree="' + id + '" data-n="' + qn + '" title="Les étapes de cette commande, et ce qu’il manque" aria-label="' + treeLbl + '">🌳</button>' +
            (st.track && st.track.id === id ? '<button class="btn small ghost icon-act auto-on" data-untrack title="Ne plus suivre" aria-label="Suivi">🎯</button>' : '<button class="btn small ghost icon-act" data-track="' + id + '" title="Suivre cette recette" aria-label="Suivre">🎯</button>') +
            situerBtn + "</div>";
        }
      } else if (situerBtn) {
        h += '<div class="acts carnet-acts">' + situerBtn + '</div>';
      }
      return h + "</div>";
    }

    /* pourquoi on ne peut pas fabriquer (n fois, en chaîne ou non), en une phrase */
    function whyNot(id, n, chain) {
      const it = I[id], b = E.blocker(id);
      if (E.handInfo().full) return "Commandes au maximum. Une place se libère à la fin d’une commande.";
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
        if (free < 0) { toast("Établi plein. Touche un emplacement pour le vider."); return; }
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
        if (r.fresh) { setTimeout(() => A.discover(), 180); fete({ id: r.id, kick: "Nouvelle découverte", title: I[r.id].n, sub: fxText(r.id), tier: I[r.id].sec ? 2 : 1 }); }
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
      if (r.kind === "queued") return "✋ " + n(r.id) + " : fin estimée dans " + fmtTime(r.time) + ".";
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
      // une commande de dix exemplaires ou plus : le guide n’a plus à l’expliquer
      if (n >= 10) S().flags.cmdBig = true;
      const r = E.order(id, n);
      if (!r.ok) {
        if (r.why === "plan") { openTree(id, n); return false; }
        A.fail(0);
        toast(r.why === "full" ? "Limite atteinte : " + D.HAND.max + " commandes au maximum." : r.why === "queued" ? esc(I[id].n) + " : déjà en cours." : whyNot(id, n, true));
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
        toast("⚡ " + esc(I[id].n) + ", avec " + sub + " pièce" + (sub > 1 ? "s" : "") + " à fabriquer avant : fin estimée dans " + fmtTime(r.time) + ".");
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
      if (!h.jobs.length) return '<span class="hh">✋</span><span class="grow tiny muted">Aucune commande en cours.</span>';
      const j = h.jobs[0], it = I[j.id];
      const missTxt = jobMissTag(j);
      const what = missTxt ? '<span style="color:var(--bad)">' + esc(missTxt) + "</span>"
        : j.wait ? '<span style="color:var(--bad)">en attente de mains ou de machines</span>'
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
      return '<div class="kicker">Tes mains</div><h2>Actions et récolte</h2><p class="small muted">Fabriquer à la main et récolter rapportent de l’expérience dans l’action correspondante. Chaque niveau rend l’action 1 % plus rapide (pour la récolte : 1 % de ressources en plus). Aux niveaux ' + D.SKILL.perks.join(", ") + ", tu gagnes une chance d’avoir une pièce en plus. À la relève, tu gardes un dixième de ta progression.</p>" +
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
      return '<div class="kicker">Commandes</div><h2>' + (hi.left > 0 ? "Fin estimée dans ~" + fmtTime(hi.left) : "Commandes en cours") + '</h2><div class="picklist">' +
        hi.jobs.map((j, i) => {
          const w = jobWorkersTag(j), miss = jobMissTag(j);
          const sub = [];
          if (w) sub.push(w);
          if (miss) sub.push(miss);
          else if (j.wait) sub.push("en attente de mains ou de machines");
          else sub.push("fin estimée dans ~" + fmtTime(i ? j.at : j.left));
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
            if (j && E.cancelJob(i)) { A.click(); toast("Commande annulée : " + esc(I[j.id].n) + ". Ressources restituées."); }
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
    /* Chemin complet vers une cible : échelle verticale des marches, de la plus profonde à la cible. */
    function treeHTML(id, n) {
      const times = Math.max(1, n || 1);
      const r = Arb && Arb.route ? Arb.route(E, D, id, times) : null;
      if (!r) return '<p class="small muted">Chemin introuvable.</p>';
      const st = S();
      let h = '<div class="kicker">Chemin vers la cible</div><div class="row items-center">' +
        (r.cible.anon ? '<span class="arb-inconnu" aria-hidden="true" style="font-size:20px;width:40px;height:40px">?</span>' : icon(id, "lg")) +
        '<div class="grow"><h2 style="margin:0">' + esc(r.cible.nom) + "</h2>" +
        '<div class="arb-chemin-prog"><span>' + r.compte.faites + ' / ' + r.compte.total + ' marches franchies</span>' +
        '<span>' + (r.pret ? '✓ Prêt' : 'En préparation') + '</span></div></div></div>';

      if (I[id] && !E.isUnique(I[id]) && !r.cible.anon) {
        h += '<div class="row" style="margin-top:6px"><button class="mini" data-m="tn" data-d="-1" title="Un de moins">−</button>' +
          '<b style="min-width:40px;text-align:center">×' + fmt(times) + '</b>' +
          '<button class="mini" data-m="tn" data-d="1" title="Un de plus">+</button>' +
          '<button class="btn small ghost" data-m="tmax" title="Nombre maximum selon la Réserve">Max</button></div>';
      }

      h += '<div class="arb-echelle" role="list" aria-label="Marches vers la cible">';
      r.marches.forEach((m, idx) => {
        const num = idx + 1;
        const isCible = !!m.isTarget;
        const etatLabel = m.etat === "fait" ? "Fait" : m.etat === "en_cours" ? "En cours" : m.etat === "a_trouver" ? "À trouver" : "Bloquée";
        h += '<div class="arb-marche ' + m.etat + (isCible ? ' cible' : '') + '" role="listitem">' +
          '<div class="arb-marche-rail"><span class="arb-marche-num">' + (m.etat === "fait" ? "✓" : num) + '</span></div>' +
          '<div class="arb-marche-corps"><div class="arb-marche-entete">' +
          (m.anon ? '<span class="arb-inconnu" aria-hidden="true" style="width:24px;height:24px;font-size:14px">?</span>' : icon(m.id, "sm")) +
          '<span class="arb-marche-nom">' + esc(m.nom) + '</span>' +
          (m.quantite > 1 ? '<span class="muted small">×' + fmt(m.quantite) + '</span>' : '') +
          '<span class="arb-badge ' + m.etat + '">' + etatLabel + '</span></div>';

        if (m.requis) {
          h += '<div class="arb-marche-requis">' + esc(m.requis) + '</div>';
        } else if (m.type === "res" && m.etat !== "fait" && !m.anon) {
          h += '<div class="arb-marche-manque">En stock : ' + fmt(m.enStock) + ' / ' + fmt(m.quantite) + '</div>';
        } else if (m.type === "craft" && m.etat !== "fait" && !m.anon) {
          h += '<div class="arb-marche-manque">Possédé : ' + fmt(m.enStock) + ' / ' + fmt(m.quantite) + '</div>';
        }
        h += '</div><div class="arb-marche-act">';

        if (m.action === "fabriquer") {
          const ready = m.id && S().known[m.id] && !E.blocker(m.id) && E.missingFor(m.id, 1) === null;
          h += '<button type="button" class="btn small' + (ready ? ' pri' : '') + '" data-ch-craft="' + esc(m.id) + '"' + (ready ? '' : ' disabled') + ' title="' + (ready ? 'Fabriquer immédiatement' : 'Ingrédients manquants') + '">Fabriquer</button>';
        } else if (m.action === "recolter") {
          h += '<button type="button" class="btn small" data-ch-harv="' + esc(m.id) + '" title="Récolter cette ressource">Récolter</button>';
        } else if (m.action === "voir") {
          if (m.anon) {
            h += '<button type="button" class="btn small ghost" data-ch-atelier="1" title="Découvrir cette recette à l’Atelier">Atelier</button>';
          } else if (I[m.id] && I[m.id].r) {
            h += '<button type="button" class="btn small ghost" data-ch-voir="' + esc(m.id) + '" title="Voir la recette dans le Carnet">Voir</button>';
          } else {
            h += '<button type="button" class="btn small ghost" data-goto="' + esc(m.id) + '" title="Voir la fiche">Fiche</button>';
          }
        }
        h += '</div></div>';
      });
      h += '</div>';

      h += '<div class="arb-chemin-pied acts"><button class="btn" data-m="close">Fermer</button>' +
        (st.track && st.track.id === id ? '<button class="btn ghost" data-m="untrack" title="Ne plus suivre cet objet">Ne plus suivre</button>' : '<button class="btn" data-m="track" title="Suivre cet objet en haut du Domaine">🎯 Suivre</button>') +
        '<button class="btn pri" data-m="go"' + (r.peutToutFabriquer ? '' : ' disabled') + ' title="Lancer la fabrication en chaîne de toutes les étapes">⚡ Tout fabriquer (×' + fmt(times) + ')</button></div>';
      return h;
    }
    function openTree(id, n) {
      let times = Math.max(1, n || 1);
      U.cheminId = id;
      U.cheminTimes = times;
      const renderChemin = () => {
        U.cheminTimes = times;
        const box = document.querySelector("#modal .modal-box");
        if (box) { box.innerHTML = treeHTML(id, times); iconize(box); }
      };
      openModal({
        html: treeHTML(id, times),
        cls: "arb-chemin-modal",
        on: {
          tn: (b) => { times = Math.max(1, times + Number(b.dataset.d) * (times >= 100 ? 10 : 1)); renderChemin(); return true; },
          tmax: () => { times = Math.max(1, E.maxPlan(id)); renderChemin(); return true; },
          track: () => { E.setTrack(id); toast("🎯 Suivi : <b>" + esc(I[id] ? I[id].n : "Objet") + "</b> (en haut du Domaine)"); render(true); renderChemin(); return true; },
          untrack: () => { E.setTrack(null); render(true); renderChemin(); return true; },
          go: (b) => { chainCraft(b, id, times); closeModal(); }
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
      const nav = (k, extra) => '<button class="ing link" data-m="nav" data-id="' + k + '" title="Ouvrir sa fiche">' + (st.seen[k] || st.known[k] ? icon(k, "sm") : '<span class="ic sm unk">?</span>') + esc(I[k].n) + (extra || "") + "</button>";
      const isWtcItalic = U.wtcItalic;
      if (isWtcItalic) U.wtcItalic = false;
      let h = '<div class="rwin"' + (isWtcItalic ? ' style="font-style:italic"' : "") + '><div class="row">' + (known || !it.r || st.seen[id] ? icon(id, "lg") : '<span class="ic lg unk">?</span>') +
        '<div class="grow"><div class="kicker">' + TYPE[it.t] + (D.AGES[it.a] ? " · " + esc(D.AGES[it.a].n) : "") + "</div><h2 style=\"margin:0\">" + (nameShown(id) ? esc(it.n) : "Recette inconnue") + "</h2>" +
        (E.stars(id) ? '<div class="stars" title="Maîtrise : fabriqué ' + fmt(st.made[id] || 0) + ' fois">' + "★".repeat(E.stars(id)) + ' <span class="tiny muted">maîtrise</span></div>' : "") + "</div>" +
        (!uniq && !E.isScaled(it) && (st.inv[id] || 0) > 0 ? '<button class="pinb fav' + (favs()[id] ? " on" : "") + '" data-m="fav" aria-label="Ressource favorite" title="Ressource favorite (en tête de liste à l’Atelier)">' + (favs()[id] ? "♥" : "♡") + "</button>" : "") +
        (it.r && known ? '<button class="pinb' + (st.pins[id] ? " on" : "") + '" data-m="pin" aria-label="Épingler la recette en haut de l’Atelier" title="Épingler la recette en haut de l’Atelier">' + (st.pins[id] ? "★" : "☆") + "</button>" : "") + "</div>";
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
                return '<button class="ring ' + (ok ? "ok" : "lack") + '" data-m="nav" data-id="' + k + '" title="Ouvrir sa fiche : ce qu’il faut, et ce que tu as">' + icon(k, "sm") +
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
                '<button class="btn small ghost" data-m="tree" title="Détail : les étapes de la commande et ce qu’il manque">🌳 Détail</button>' + (st.track && st.track.id === id ? "" : '<button class="btn small ghost" data-m="track" title="Suivre : ce qui manque s’affiche en haut du Domaine, avec le temps estimé">🎯 Suivre</button>') + "</div>";
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
        (it.r && known ? '<button class="btn ghost" data-m="carnet" title="Voir sa recette dans le Carnet">📖 Carnet</button>' : "") + (known && arbreVisible(id) ? '<button class="btn ghost" data-m="arbre" title="Voir ses ingrédients et ses usages dans l’arbre">🌳 Voir dans l’arbre</button>' : "") + '<button class="btn pri" data-m="close">Fermer</button></div></div>';
      const redraw = () => { if (U.mcur && U.mcur.rec) swapModal(recipeModal()); };
      return {
        rec: true,
        html: h,
        onClose: () => { U.rstack = []; },
        on: {
          nav: (b) => { recipeNav(b.dataset.id); return true; },
          back: () => { U.rstack.pop(); A.page(); swapModal(recipeModal()); return true; },
          rfrom: () => { const f = U.rfrom; U.rfrom = null; closeModal(); if (f) setTimeout(f, 80); return true; },
          zone: (b) => { const z = b.dataset.z; if (E.zoneOpen(z)) { U.zone = z; setTimeout(() => { setTab("domaine"); Dom.focusZone(z); }, 60); } else { toast("Terre non atteinte."); return true; } },
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

    return { arbreMaj, arbreOuvrir, arbreRendre, viewAtelier, viewCarnet, viewMachines, carnetList, carnetLive, whyNot, putInSlot, forge, craftFrom, chainCraft, handsHTML, handSig, startHarvest, actBar, skillName, openSkills, openHands, openTree, goto, openItemInfo };
  }

  window.EclatAtelier = { create };
})();
