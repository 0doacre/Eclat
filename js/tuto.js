/* ÉCLAT — le tutoriel : des souvenirs qui guident la main.
 * Il avance par chapitres. Un chapitre se lance quand une chose devient possible
 * et n’a pas encore été faite (une cabane à poser, une roue à ouvrir…) ; chacune
 * de ses étapes éclaire l’endroit à toucher et attend que ce soit fait. Rien
 * n’est bloqué : on peut toucher ailleurs, passer, ou couper le tutoriel. */
(function () {
  "use strict";

  function create(api) {
    const { E, D, A, U, esc, fmtNum, Usine, Roue, save } = api;
    const S = () => E.state;
    const TABS = { carte: "la Carte", atelier: "l’Atelier", carnet: "le Carnet", journal: "le Journal", cosmos: "le Cosmos" };
    const GAP = 8000; // entre deux chapitres

    /* ------------------------------------------------------------ petits repères */
    const has = (id) => (S().inv[id] || 0) >= 1;
    const cells = () => Object.values(S().fab.c);
    const any = (k) => cells().some((e) => e.k === k);
    const modalOpen = () => !!document.querySelector(".modal:not(.hidden)");
    function deposit(res) {
      const d = E.zonePatch("lisiere").find((p) => p.res === res);
      return d ? { cell: [d.x, d.y] } : null;
    }
    function landmark(zid, i) {
      const g = Usine.zonesOnMap().find((z) => z.id === zid), m = g && g.marks[i];
      return m ? { cell: [m.x, m.y] } : null;
    }
    const linked = () => { const g = E.fabGraph(); return cells().some((e) => e.k === "ext" && g.prods[e.id] && g.prods[e.id].t.res); };
    const fed = () => { const g = E.fabGraph(); return cells().some((e) => e.k === "mach" && e.r && (g.sup[e.id] || []).length > 0); };
    /* une entrée de la Réserve qui déborde, ou un extracteur qui récolte plus que son tapis ne porte */
    function satCell() {
      const k = Object.keys(E.fabSat())[0];
      if (k) { const i = k.indexOf(","); return { cell: [+k.slice(0, i), +k.slice(i + 1)], ent: true }; }
      for (const key in S().fab.c) {
        const e = S().fab.c[key];
        if (e.k === "ext" && E.machInfo(e.id).s === "sat") { const i = key.indexOf(","); return { cell: [+key.slice(0, i), +key.slice(i + 1)], ent: false }; }
      }
      return null;
    }
    /* une matière de l’Atelier qui cache encore des recettes : celle-là vaut la peine d’être étudiée */
    function studyTile() {
      const tiles = Array.from(document.querySelectorAll("[data-inv]"));
      const ok = tiles.find((t) => Object.keys(D.ITEMS).some((k) => D.ITEMS[k].r && D.ITEMS[k].r[1][t.dataset.inv] !== undefined && !S().known[k]));
      return ok || null;
    }
    const lone = () => Object.keys(D.PROJECTS).find((p) => E.projVisible(p) && !E.siteOf(p) && E.projState(p).step < D.PROJECTS[p].steps.length);

    /* ------------------------------------------------------------ les chapitres
     * when : quand il commence ; still : tant qu’il a un sens (sinon il s’arrête).
     * Une étape : tab (l’onglet où elle se passe), at (ce qu’elle montre : un
     * sélecteur, un élément, ou { cell: [x, y] } sur la carte), text, done (fini ?),
     * next (bouton « Suivant »), dim (assombrir autour, oui par défaut s’il y a une
     * cible), modal (elle se passe dans une fenêtre), roue (dans la roue). */
    const CH = [
      { id: "debut", n: "Premiers gestes",
        when: () => !S().known.manche && S().age === 0 && !S().stats.crafts,
        steps: [
          { tab: "carte", at: () => deposit("bois"), text: "Touche le bois pour en ramasser. Garde le doigt appuyé : tu ramasses sans t’arrêter.",
            done: () => (S().inv.bois || 0) >= 3 || S().known.manche },
          { tab: "atelier", go: "Tu en as assez pour un premier outil. Ouvre l’Atelier.", at: ".gestes",
            text: "Ici, une recette, c’est un geste et des matières. Le geste Tailler est déjà choisi.", next: true, done: () => S().known.manche || U.slots.some(Boolean) },
          { tab: "atelier", at: () => (U.slots.includes("bois") ? null : '[data-inv="bois"]'), text: "Pose du bois sur l’établi : touche-le.",
            done: () => U.slots.includes("bois") || S().known.manche },
          { tab: "atelier", at: () => (U.geste === "tailler" ? "#forge" : '[data-g="tailler"]'), text: () => (U.geste === "tailler" ? "Œuvre !" : "Reprends le geste Tailler."),
            done: () => S().known.manche },
          { tab: "atelier", at: "#result", done: () => S().known.corde, text: "Un manche ! Une découverte sort tout de suite et s’inscrit dans ton Carnet. Refaire une recette connue prend un peu de temps : tes mains travaillent une pièce après l’autre.", next: true },
          { tab: "carte", go: "Retourne sur la Carte.", at: ".goal-card", text: "L’objectif, en haut, te dit quoi chercher ensuite. 🏁 montre tout ce qu’il y a à faire à cet âge.", next: true, done: () => S().known.corde },
          { text: "À toi de chercher, maintenant : de quoi lier les choses entre elles. Ramasse des fibres, puis essaie des gestes à l’Atelier. Le thermomètre te dit si tu chauffes, et chaque essai nouveau réveille des souvenirs.",
            free: true, done: () => S().known.corde },
          { text: "Bien trouvé. C’est tout le jeu : chercher, découvrir, puis faire travailler le monde pour toi. L’objectif te guide, et ❓ explique le reste.", next: true }
        ] },
      { id: "lieux", n: "Les lieux",
        when: () => { const ob = E.objective(); return U.tab === "carte" && ob && ob.k === "exp" && !S().exp.active && !Object.keys(S().exp.done).length; },
        still: () => !S().exp.active && !Object.keys(S().exp.done).length,
        steps: [
          { tab: "carte", at: () => landmark("lisiere", 0), text: "Ce grand chêne t’attire. Touche-le.",
            done: () => !!document.querySelector('.u-sheet:not(.hidden) [data-u="exp"]') },
          { tab: "carte", at: '.u-sheet:not(.hidden) [data-u="exp"]', alt: "Touche le chêne 🧭, puis Explorer.",
            text: "Explore-le. Ça avance tout seul pendant que tu fais autre chose, et ça raconte un bout de l’histoire.", done: () => !!S().exp.active }
        ] },
      { id: "cabane", n: "Ta première cabane",
        when: () => U.tab === "carte" && has("cabane") && !any("ext"),
        still: () => !S().flags.extDone,
        steps: [
          { tab: "carte", at: '.u-tools [data-tool="ext"]', text: "Ta cabane peut récolter à ta place, même jeu fermé. Prends l’outil Extracteur.",
            done: () => Usine.tool() === "ext" || any("ext") },
          { tab: "carte", at: () => deposit("bois"), text: "Touche le bois pour y poser ta cabane.", done: () => any("ext") },
          { tab: "carte", at: '.u-sheet:not(.hidden) [data-u="link"]', alt: "Touche ta cabane, puis « Relier à la Réserve ».",
            text: "Sa récolte doit rejoindre la Réserve. Touche « Relier à la Réserve » : le tapis se pose tout seul.", done: linked },
          { tab: "carte", text: "Les tapis portent la récolte jusqu’à la Réserve. Tu peux aussi en tracer au doigt avec l’outil ➜.", next: true }
        ] },
      { id: "mains", n: "Tes mains",
        when: () => Date.now() - lastQueue < 15000 && (U.tab === "atelier" || U.tab === "carte"),
        steps: [
          { at: () => (document.querySelector("#hands .hands") ? "#hands" : document.querySelector("#handMini:not(.hidden)") ? "#handMini" : null),
            text: "Ce que tu fabriques à la main passe par ta file ✋ : une pièce après l’autre, même jeu fermé. Répéter un geste va de plus en plus vite, et ✕ annule en rendant les matières.", next: true }
        ] },
      { id: "roue", n: "La roue",
        when: () => U.tab === "carte" && Object.keys(S().known).length >= 5 && !S().flags.roueSeen,
        steps: [
          { tab: "carte", at: ".u-fab", text: "🛠️ La roue : toutes tes recettes connues, sans quitter la carte. Ouvre-la.", done: () => Roue.isOpen() || S().flags.roueSeen },
          { roue: true, at: ".rw-wheel", text: "Choisis une famille, puis une recette : ses boutons apparaissent dessous. Au centre, ta file ✋. Une machine ou un extracteur prêts se posent ensuite d’un geste (📍).", next: true,
            done: () => Roue.touched() }
        ] },
      { id: "automate", n: "Ton automate",
        when: () => U.tab === "carte" && E.MACHINES.some(has) && !any("mach"),
        still: () => !S().flags.lineDone,
        steps: [
          { tab: "carte", at: '.u-tools [data-tool="mach"]', text: "Ton automate refait un geste à ta place. Prends l’outil Machine.", done: () => Usine.tool() === "mach" || any("mach") },
          { tab: "carte", at: () => ({ cell: [0, 0], span: 5 }), text: "Touche une case vide près de la Réserve pour la poser, puis choisis ce qu’elle fabrique.", free: true,
            done: () => cells().some((e) => e.k === "mach" && e.r) },
          { tab: "carte", at: '.u-tools [data-tool="port"]', text: "Il lui faut des matières. Prends l’outil Sortie et pose-la contre la Réserve.", done: () => any("port") },
          { tab: "carte", at: '.u-tools [data-tool="tapis"]', text: "Avec l’outil Tapis, pars de la flèche de la sortie et glisse le doigt jusqu’à longer ta machine : elle se servira au passage.", done: fed },
          { tab: "carte", text: "Ce qu’elle fabrique sort par sa petite flèche. Tournée vers la Réserve, ça y rentre tout seul ; sinon, trace un tapis jusqu’à elle.", next: true },
          { tab: "carte", text: "Astuce : la Réserve ne laisse sortir qu’un petit débit. Pour aller plus vite, amène à tes machines leurs matières directement depuis les gisements.", next: true }
        ] },
      { id: "etude", n: "Étudier une matière",
        when: () => U.tab === "atelier" && S().intu >= 1 && !Object.keys(S().studied).length && Object.keys(S().known).length >= 4 && !!studyTile(),
        still: () => !Object.keys(S().studied).length,
        steps: [
          { tab: "atelier", at: studyTile, text: "Appuie longuement sur une matière : sa fiche s’ouvre.",
            done: () => !!document.querySelector('.modal:not(.hidden) [data-m="study"]') || Object.keys(S().studied).length > 0 },
          { modal: true, at: '.modal:not(.hidden) [data-m="study"]', back: 0,
            text: "Étudie-la avec un peu d’Intuition ✨ : tu sauras avec quels gestes elle cache encore des recettes.", done: () => Object.keys(S().studied).length > 0 },
          { tab: "atelier", text: "Une matière étudiée porte un ✦ quand elle réagit avec le geste choisi. À toi de trouver avec quoi.", next: true }
        ] },
      { id: "jalons", n: "Les jalons",
        when: () => U.tab === "carte" && S().age >= 1 && !S().flags.milesSeen && !!document.querySelector("[data-miles]"),
        steps: [
          { tab: "carte", at: "[data-miles]", text: "🏁 Les jalons de l’âge : tout ce qu’il y a à faire, d’un coup d’œil. Touche-les quand tu ne sais plus par où continuer.",
            next: true, done: () => !!S().flags.milesSeen }
        ] },
      { id: "debit", n: "Un tapis qui déborde",
        when: () => U.tab === "carte" && !!satCell(),
        end: () => { S().flags.tip_sat = true; },
        steps: [
          { tab: "carte", at: satCell, next: true,
            text: () => { const c = satCell(), cap = fmtNum(E.beltCap()); return c && !c.ent
              ? "Ce gisement récolte plus que son tapis ne porte : " + cap + " objets par seconde au plus, à cet âge. Les extracteurs en trop ici travailleraient mieux sur un autre gisement, et les tapis iront plus vite aux âges suivants."
              : "Ce tapis déborde : il porte au plus " + cap + " objets par seconde à cet âge. Fais entrer un deuxième tapis dans la Réserve, avec un 🔀 répartiteur sur le chemin par exemple."; } }
        ] },
      { id: "chantier", n: "Un Grand Œuvre",
        when: () => !!lone() && !any("site") && !!document.querySelector('#tabs [data-tab="cosmos"]:not(.hidden)'),
        still: () => !!lone() && !any("site"),
        end: () => { S().flags.tip_site = true; },
        steps: [
          { tab: "cosmos", go: "Un Grand Œuvre t’attend. Ouvre le Cosmos.", at: '[data-ct="oeuvres"]', text: "Ouvre les Grands Œuvres.", done: () => U.cosmosTab === "oeuvres" },
          { tab: "cosmos", at: "[data-site]", text: "Il se construit sur la Carte : pose son chantier, puis amène-lui ses matières par tapis, depuis une sortie de la Réserve ou tes machines.",
            done: () => any("site") }
        ] }
    ];

    /* ------------------------------------------------------------ état (sauvegardé dans la partie) */
    function state() {
      const f = S().flags;
      if (!f.tuto || typeof f.tuto !== "object") f.tuto = { done: {}, c: null, i: 0 };
      if (!f.tuto.done) f.tuto.done = {};
      return f.tuto;
    }
    const enabled = () => S().settings.tuto !== false;
    let lastEnd = 0, lastQueue = 0, shownKey = "", stepAt = 0, revealed = "", revealAt = 0, raf = 0, mini = false;
    const chapter = () => CH.find((c) => c.id === state().c) || null;
    const active = () => enabled() && !!chapter();

    function finish(ch, quietly) {
      const T = state();
      T.done[ch.id] = true;
      T.c = null; T.i = 0;
      if (ch.end) ch.end();
      lastEnd = Date.now();
      if (!quietly) A.click();
      hide();
      save();
    }
    function advance() {
      const T = state(), ch = chapter();
      T.i++;
      stepAt = 0;
      mini = false;
      if (!ch || T.i >= ch.steps.length) { if (ch) finish(ch); return; }
      A.click();
      save();
    }

    /* ------------------------------------------------------------ la bulle */
    let el = null, chip = null;
    function mount() {
      if (el) return;
      el = document.createElement("div");
      el.className = "tuto hidden";
      el.innerHTML = '<div class="tu-spot"></div><div class="tu-bub" role="status"><div class="tu-k"></div><p class="tu-t"></p><div class="tu-acts"></div></div>';
      document.body.appendChild(el);
      // réduite, la bulle devient une pastille 💭 dans la barre du haut : elle ne recouvre plus rien
      chip = document.getElementById("tutoMini");
      if (chip) chip.addEventListener("click", () => { mini = false; stepAt = Date.now(); shownKey = ""; A.click(); });
      el.addEventListener("click", (ev) => {
        const b = ev.target.closest("[data-t]");
        if (!b) return;
        if (b.dataset.t === "next") advance();
        else if (b.dataset.t === "skip") { const ch = chapter(); if (ch) finish(ch); }
        else if (b.dataset.t === "min") { mini = true; shownKey = ""; }
      });
    }
    function hide() {
      if (el) el.classList.add("hidden");
      if (chip) chip.classList.add("hidden");
      cancelAnimationFrame(raf); raf = 0;
      shownKey = "";
    }
    /* la bande d’écran libre : sous la barre du haut, au-dessus des onglets, des outils de la carte et d’une fiche ouverte */
    function band() {
      const top = document.getElementById("top"), tabs = document.getElementById("tabs");
      let lo = top ? top.getBoundingClientRect().bottom : 0, hi = tabs ? tabs.getBoundingClientRect().top : window.innerHeight;
      document.querySelectorAll(".u-tools, .u-sheet:not(.hidden)").forEach((n) => { const r = n.getBoundingClientRect(); if (r.height && r.top < hi) hi = r.top; });
      return { lo, hi };
    }
    /* une cible dans une page qui défile (Atelier, Carnet…) n’est montrée que si elle est vraiment à l’écran */
    const scrolls = (t) => !!(t && t.el && t.el.closest("#views") && !t.el.closest("#v-carte"));
    function inBand(r) { const b = band(); return r.top >= b.lo - 1 && r.bottom <= b.hi + 1; }
    function resolve(at) {
      let t = typeof at === "function" ? at() : at;
      if (!t) return null;
      if (typeof t === "string") t = document.querySelector(t);
      if (!t) return null;
      if (t.cell) return { cell: t.cell, span: t.span };
      const r = t.getBoundingClientRect();
      if (!r.width || !r.height) return null;
      return { el: t, r };
    }
    function rectOf(target) {
      if (!target) return null;
      if (target.cell) {
        const r = Usine.cellRect(target.cell[0], target.cell[1]), k = target.span || 1;
        if (!r) return null;
        // une case, ou plusieurs autour d’elle (la Réserve et ses abords)
        const w = r.width * k, h = r.height * k, left = r.left + r.width / 2 - w / 2, top = r.top + r.height / 2 - h / 2;
        return { left, top, width: w, height: h, right: left + w, bottom: top + h };
      }
      return target.el.getBoundingClientRect();
    }
    /* place le projecteur et la bulle ; relancé à chaque image tant qu’une étape est affichée */
    function place(view) {
      const spot = el.querySelector(".tu-spot"), bub = el.querySelector(".tu-bub");
      let r = rectOf(view.target);
      if (r && scrolls(view.target) && !inBand(r)) r = null; // pas encore à l’écran : on attend qu’elle y soit
      const W = window.innerWidth, H = window.innerHeight;
      bub.style.width = Math.min(340, W - 24) + "px";
      const bw = bub.offsetWidth, bh = bub.offsetHeight;
      if (!r) {
        // sans cible, la bulle se pose en bas de la bande libre : l’objectif, en haut, reste lisible
        const b = band();
        spot.style.display = "none";
        bub.style.left = Math.round((W - bw) / 2) + "px";
        bub.style.bottom = "auto";
        bub.style.top = Math.max(b.lo + 8, b.hi - bh - 10) + "px";
        bub.classList.remove("up");
        bub.style.setProperty("--ax", "-100px");
        return;
      }
      const pad = 6;
      spot.style.display = "block";
      spot.classList.toggle("nodim", view.dim === false);
      spot.style.left = r.left - pad + "px";
      spot.style.top = r.top - pad + "px";
      spot.style.width = r.width + pad * 2 + "px";
      spot.style.height = r.height + pad * 2 + "px";
      const cx = r.left + r.width / 2, below = r.top + r.height / 2 < H * 0.5;
      const left = Math.max(12, Math.min(W - bw - 12, cx - bw / 2));
      bub.style.left = left + "px";
      bub.style.bottom = "auto";
      // une cible dans une fiche ou une fenêtre : la bulle passe au-dessus du panneau entier, pour en laisser le texte lisible
      const box = view.target.el && view.target.el.closest(".u-sheet, .modal-box");
      const over = box ? box.getBoundingClientRect().top : r.top - pad;
      const room = box && over - 12 - bh >= band().lo + 4 ? over : r.top - pad;
      bub.style.top = (below ? Math.min(H - bh - 8, r.bottom + pad + 12) : Math.max(8, room - 12 - bh)) + "px";
      bub.classList.toggle("up", !below);
      bub.style.setProperty("--ax", Math.max(16, Math.min(bw - 16, cx - left)) + "px");
    }
    function show(view, key) {
      mount();
      const bub = el.querySelector(".tu-bub");
      if (mini) {
        el.classList.add("hidden");
        cancelAnimationFrame(raf); raf = 0;
        if (chip && chip.classList.contains("hidden")) { chip.classList.remove("hidden"); chip.title = view.text; }
        shownKey = key;
        return;
      }
      if (chip) chip.classList.add("hidden");
      if (shownKey !== key) {
        shownKey = key;
        const ch = chapter(), T = state();
        el.querySelector(".tu-k").textContent = "💭 " + ch.n + (ch.steps.length > 1 ? " · " + (T.i + 1) + "/" + ch.steps.length : "");
        el.querySelector(".tu-t").innerHTML = esc(view.text);
        el.querySelector(".tu-acts").innerHTML = '<button class="tu-b" data-t="skip">Passer</button>' +
          (view.free ? '<button class="tu-b" data-t="min">Réduire</button>' : "") + (view.next ? '<button class="tu-b pri" data-t="next">Suivant</button>' : "");
        el.classList.remove("hidden");
        bub.classList.remove("pop"); void bub.offsetWidth; bub.classList.add("pop");
      }
      cancelAnimationFrame(raf);
      const loop = () => { if (!el.classList.contains("hidden")) { place(view); raf = requestAnimationFrame(loop); } };
      loop();
    }

    /* ------------------------------------------------------------ le pas de temps (4 fois par seconde) */
    function tick() {
      // ce que le joueur a déjà fait seul n’a plus besoin d’être montré
      if (S().hand.q.length) lastQueue = Date.now();
      if (Roue.isOpen()) S().flags.roueSeen = true;
      if (!enabled() || !S().introSeen) { hide(); return; }
      const T = state();
      let ch = chapter();
      if (!ch) {
        // un nouveau chapitre ? pas pendant une fenêtre, ni juste après le précédent
        if (modalOpen() || Roue.isOpen() || Date.now() - lastEnd < (lastEnd ? GAP : 1500)) { hide(); return; }
        ch = CH.find((c) => !T.done[c.id] && c.when());
        if (!ch) { hide(); return; }
        T.c = ch.id; T.i = 0; stepAt = 0; mini = false;
        save();
      }
      // un chapitre qui n’a plus lieu d’être s’efface, tant qu’on ne l’a pas commencé
      if (T.i === 0 && ch.still && !ch.still()) { finish(ch, true); return; }
      const s = ch.steps[T.i];
      if (!s) { finish(ch); return; }
      if (s.done && s.done()) { advance(); return; }
      if (s.back !== undefined && !modalOpen()) { T.i = s.back; stepAt = 0; return; }
      // où se passe l’étape
      if (s.roue && !Roue.isOpen()) { advance(); return; }
      if ((modalOpen() && !s.modal) || (Roue.isOpen() && !s.roue)) { hide(); return; }
      // une explication qu’on a laissée en changeant d’onglet : tant pis, on n’y ramène pas
      if (s.next && !s.go && s.tab && U.tab !== s.tab) { advance(); return; }
      // un chapitre pas encore entamé ne rappelle pas vers un autre onglet : il attend qu’on y revienne
      if (T.i === 0 && !s.go && s.tab && U.tab !== s.tab) { hide(); return; }
      let view;
      if (s.tab && U.tab !== s.tab && !s.modal) {
        view = { target: resolve('#tabs [data-tab="' + s.tab + '"]'), text: s.go || "Ouvre " + TABS[s.tab] + "." };
      } else {
        const target = resolve(s.at);
        const text = typeof s.text === "function" ? s.text() : s.text;
        view = { target, text: !target && s.alt ? s.alt : text, next: s.next, free: s.free, dim: s.free ? false : s.dim };
        // on amène la cible à l’écran : une fois en douceur, puis on insiste un court moment
        // (la page peut s’être redessinée entre-temps) tant qu’elle n’y est pas
        const key = ch.id + ":" + T.i;
        if (target && revealed !== key) {
          revealed = key; revealAt = Date.now();
          if (target.cell) Usine.reveal(target.cell[0], target.cell[1]);
          else if (scrolls(target) && !inBand(target.r)) target.el.scrollIntoView({ block: "center", behavior: "smooth" });
        } else if (target && scrolls(target) && !inBand(target.r) && Date.now() - revealAt > 800 && Date.now() - revealAt < 3000) {
          target.el.scrollIntoView({ block: "center" });
        }
      }
      if (!stepAt) stepAt = Date.now();
      // une étape où l’on cherche longtemps se fait discrète au bout d’un moment
      if (!view.free) mini = false;
      else if (!mini && Date.now() - stepAt > 9000) mini = true;
      show(view, ch.id + ":" + T.i + ":" + (view.target ? "t" : "n") + ":" + (mini ? 1 : 0) + ":" + view.text);
    }

    /* ------------------------------------------------------------ réglages */
    function setEnabled(v) {
      S().settings.tuto = !!v;
      if (!v) { const T = state(); T.c = null; T.i = 0; hide(); }
      save();
    }
    function restart() {
      const T = state();
      T.done = {}; T.c = null; T.i = 0;
      S().flags.roueSeen = false; S().flags.milesSeen = false;
      S().settings.tuto = true;
      lastEnd = 0;
      save();
    }
    const doneCount = () => CH.filter((c) => state().done[c.id]).length;
    return { tick, active, setEnabled, restart, enabled, chapters: () => CH.map((c) => ({ id: c.id, n: c.n, done: !!state().done[c.id] })), doneCount };
  }

  window.EclatTuto = { create };
})();
