/* ÉCLAT — le tutoriel : des souvenirs qui guident la main.
 * Il avance par chapitres. Un chapitre se lance quand une chose devient possible
 * et n’a pas encore été faite (une cabane à poser, un automate à régler…) ; chacune
 * de ses étapes éclaire l’endroit à toucher et attend que ce soit fait. Rien
 * n’est bloqué : on peut toucher ailleurs, passer, ou couper le tutoriel. */
(function () {
  "use strict";

  function create(api) {
    const { E, D, A, U, esc, save } = api;
    const S = () => E.state;
    const TABS = { domaine: "le Domaine", carte: "la Carte", atelier: "l’Atelier", carnet: "le Carnet, dans l’Atelier", journal: "le Journal", cosmos: "le Cosmos, dans le Journal" };
    const GAP = 8000; // entre deux chapitres

    /* ------------------------------------------------------------ petits repères */
    const has = (id) => (S().inv[id] || 0) >= 1;
    const anyExt = () => Object.keys(S().dom.ext).length > 0;
    const modalOpen = () => !!document.querySelector(".modal:not(.hidden)");
    /* une matière de l’Atelier qui cache encore des recettes : celle-là vaut la peine d’être étudiée */
    function studyTile() {
      const tiles = Array.from(document.querySelectorAll("[data-inv]"));
      const ok = tiles.find((t) => Object.keys(D.ITEMS).some((k) => D.ITEMS[k].r && D.ITEMS[k].r[1][t.dataset.inv] !== undefined && !S().known[k]));
      return ok || null;
    }
    const lone = () => Object.keys(D.PROJECTS).find((p) => E.projVisible(p) && !E.siteOn(p) && E.projState(p).step < D.PROJECTS[p].steps.length);

    /* ------------------------------------------------------------ les chapitres
     * when : quand il commence ; still : tant qu’il a un sens (sinon il s’arrête).
     * Une étape : tab (l’onglet où elle se passe), at (ce qu’elle montre : un
     * sélecteur ou un élément), text, done (fini ?), next (bouton « Suivant »),
     * dim (assombrir autour, oui par défaut s’il y a une cible), modal (elle se
     * passe dans une fenêtre). */
    const CH = [
      { id: "debut", n: "Premiers gestes",
        when: () => !S().known.manche && S().age === 0 && !S().stats.crafts,
        steps: [
          { tab: "domaine", at: '[data-harv="lisiere:bois"]', text: "Touche le bois pour en récolter. Garde le doigt appuyé : tu récoltes sans t’arrêter.",
            done: () => (S().inv.bois || 0) >= 3 || S().known.manche },
          { tab: "atelier", go: "Tu en as assez pour un premier outil. Ouvre l’Atelier.", at: ".gestes",
            text: "Ici, une recette, c’est un geste et des matières. Le geste Tailler est déjà choisi.", next: true, done: () => S().known.manche || U.slots.some(Boolean) },
          { tab: "atelier", at: () => (U.slots.includes("bois") ? null : '[data-inv="bois"]'), text: "Pose du bois sur l’établi : touche-le.",
            done: () => U.slots.includes("bois") || S().known.manche },
          { tab: "atelier", at: () => (U.geste === "tailler" ? "#forge" : '[data-g="tailler"]'), text: () => (U.geste === "tailler" ? "Touche le gros bouton pour fabriquer !" : "Reprends le geste Tailler."),
            done: () => S().known.manche },
          { tab: "atelier", at: "#result", done: () => S().known.corde, text: "Un manche ! Une petite découverte sort tout de suite et s’inscrit dans ton Carnet. Refaire une recette connue prend un peu de temps : tes mains travaillent une pièce après l’autre.", next: true },
          { tab: "domaine", go: "Retourne au Domaine.", at: ".goal-card", text: "L’objectif, en haut, te dit quoi chercher ensuite. 🏁 montre tout ce qu’il y a à faire à cet âge.", next: true, done: () => S().known.corde },
          { text: "À toi de chercher, maintenant : de quoi lier les choses entre elles. Récolte des fibres, puis essaie des gestes à l’Atelier. Le thermomètre te dit si tu chauffes, et chaque essai nouveau réveille des souvenirs.",
            free: true, done: () => S().known.corde },
          { text: "Bien trouvé. L’objectif, en haut, donne la suite ; ❓ explique le reste.", next: true }
        ] },
      { id: "lieux", n: "Les lieux",
        when: () => { const ob = E.objective(); return (U.tab === "domaine" || U.tab === "carte") && ob && ob.k === "exp" && !S().exp.active && !Object.keys(S().exp.done).length; },
        still: () => !S().exp.active && !Object.keys(S().exp.done).length,
        steps: [
          { tab: "carte", go: "Un lieu t’attend sur la Carte. Ouvre-la.", at: '[data-cl="lisiere:0"]', text: "Ce grand chêne t’attire. Touche-le.",
            done: () => !!document.querySelector('.modal:not(.hidden) [data-m="go"]') || !!S().exp.active },
          { modal: true, at: '.modal:not(.hidden) [data-m="go"]', back: 0,
            text: "Explore-le. Ça avance tout seul pendant que tu fais autre chose, et ça raconte un bout de l’histoire.", done: () => !!S().exp.active }
        ] },
      { id: "cabane", n: "Ta première cabane",
        when: () => U.tab === "domaine" && has("cabane") && !anyExt(),
        still: () => !S().flags.extDone,
        steps: [
          { tab: "domaine", at: '[data-xadd="lisiere:bois"]', text: "Ta cabane peut récolter à ta place, même jeu fermé. Touche « + cabane » sur le bois pour l’y poser.", done: anyExt },
          { tab: "domaine", text: "Elle verse sa récolte dans la Réserve. Le même bouton en pose d’autres ; s’il ne t’en reste plus à poser, tes mains en fabriquent une, puis la posent.", next: true }
        ] },
      { id: "passage", n: "Un passage",
        when: () => U.tab === "domaine" && E.passPending().length > 0 && !S().meta.tracesTotal && !!document.querySelector(".goal-card [data-pour], .dom-pass [data-pour]"),
        still: () => E.passPending().length > 0,
        steps: [
          { tab: "domaine", at: () => (document.querySelector(".goal-card [data-pour]") ? ".goal-card [data-pour]" : ".dom-pass [data-pour]"),
            text: "🚧 Une nouvelle terre t’attend, mais il faut d’abord franchir son passage. Verse ici ce qu’il demande : tout ce que tu donnes reste acquis, même en plusieurs fois.",
            done: () => E.passPending().some((z) => E.passInfo(z).frac > 0) || !E.passPending().length },
          { tab: "domaine", text: "Récolte, fabrique, puis reviens verser. Chaque passage franchi laisse des ✦ Traces : un jour, elles serviront à ton successeur.", next: true }
        ] },
      { id: "mains", n: "Tes mains",
        when: () => Date.now() - lastQueue < 15000 && (U.tab === "atelier" || U.tab === "domaine"),
        steps: [
          { at: () => (document.querySelector("#actbar:not(.hidden)") ? "#actbar" : null),
            text: "Ce que tu fabriques à la main s’affiche ici, au-dessus des onglets : une pièce après l’autre. Touche la barre pour voir la file ou annuler.", next: true }
        ] },
      { id: "boucle", n: "En boucle",
        when: () => U.tab === "domaine" && S().stats.crafts >= 3 && !S().act && !!document.querySelector(".goal-card [data-loop]"),
        steps: [
          { tab: "domaine", at: ".goal-card [data-loop]", next: true,
            text: "⟳ En boucle : tes mains refont cette recette tant qu’il y a de quoi, même jeu fermé. ▶ sur un gisement fait pareil pour la récolte. Une seule chose tourne à la fois." }
        ] },
      { id: "automate", n: "Ton automate",
        when: () => U.tab === "domaine" && E.MACHINES.some(has) && !S().dom.mach.length && !!document.querySelector("[data-mnew]"),
        still: () => !S().flags.lineDone,
        steps: [
          { tab: "domaine", at: "[data-mnew]", text: "Ton automate refait un geste à ta place. Touche « Mettre au travail » et choisis ce qu’il fabrique.",
            done: () => S().dom.mach.some((e) => e.r) },
          { tab: "domaine", text: "Il se sert dans la Réserve et y range ce qu’il fait. Touche sa ligne pour le régler ; + ajoute une machine de plus sur la même recette.", next: true }
        ] },
      { id: "comptoir", n: "Le Comptoir",
        when: () => U.tab === "domaine" && E.zoneOpen(D.COMPTOIR.zone) && !Object.keys((S().comptoir && S().comptoir.sold) || {}).length && !!document.querySelector("#dcomptoir"),
        still: () => !Object.keys((S().comptoir && S().comptoir.sold) || {}).length,
        steps: [
          { tab: "domaine", at: "#dcomptoir", text: "Le Troqueur s’installe dans la Plaine : un vieil automate qui achète tout. Touche « Ouvrir le Comptoir ».",
            done: () => modalOpen() || Object.keys((S().comptoir && S().comptoir.sold) || {}).length > 0 },
          { modal: true, at: () => (document.querySelector('.modal:not(.hidden) [data-m="sell"]') ? '.modal:not(.hidden) [data-m="sell"]' : null),
            text: "Vends ce qui encombre ta Réserve contre des écus. Plus tu vends d’une même matière, plus son prix baisse.",
            done: () => Object.keys((S().comptoir && S().comptoir.sold) || {}).length > 0 }
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
      { id: "jalons", n: "Les étapes",
        when: () => U.tab === "domaine" && S().age >= 1 && !S().flags.milesSeen && !!document.querySelector("[data-miles]"),
        steps: [
          { tab: "domaine", at: "[data-miles]", text: "🏁 Les étapes de l’âge : tout ce qu’il y a à faire, d’un coup d’œil. Touche-les quand tu ne sais plus par où continuer.",
            next: true, done: () => !!S().flags.milesSeen }
        ] },
      { id: "chantier", n: "Un Grand Œuvre",
        when: () => U.tab === "domaine" && !!lone() && !!document.querySelector(".dom-oeuvre [data-feed]"),
        still: () => !!lone(),
        end: () => { S().flags.tip_site = true; },
        steps: [
          { tab: "domaine", at: ".dom-oeuvre [data-feed]", text: "Un Grand Œuvre demande des quantités énormes. Touche « Alimenter » : il se servira seul dans la Réserve. Tu peux aussi verser d’un coup.",
            done: () => !lone() }
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
    const fits = () => true;
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
      return { lo, hi };
    }
    /* une cible dans une page qui défile (Atelier, Carnet…) n’est montrée que si elle est vraiment à l’écran */
    const scrolls = (t) => !!(t && t.el && t.el.closest("#views"));
    function inBand(r) { const b = band(); return r.top >= b.lo - 1 && r.bottom <= b.hi + 1; }
    function resolve(at) {
      let t = typeof at === "function" ? at() : at;
      if (!t) return null;
      if (typeof t === "string") t = document.querySelector(t);
      if (!t) return null;
      const r = t.getBoundingClientRect();
      if (!r.width || !r.height) return null;
      return { el: t, r };
    }
    function rectOf(target) {
      if (!target) return null;
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
        const n = ch.steps.filter(fits).length, at = ch.steps.slice(0, T.i + 1).filter(fits).length;
        el.querySelector(".tu-k").textContent = "💭 " + ch.n + (n > 1 ? " · " + at + "/" + n : "");
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
      if (!enabled() || !S().introSeen) { hide(); return; }
      const T = state();
      let ch = chapter();
      if (!ch) {
        // un nouveau chapitre ? pas pendant une fenêtre, ni juste après le précédent
        if (modalOpen() || Date.now() - lastEnd < (lastEnd ? GAP : 1500)) { hide(); return; }
        ch = CH.find((c) => !T.done[c.id] && c.when());
        if (!ch) { hide(); return; }
        T.c = ch.id; T.i = 0; stepAt = 0; mini = false;
        save();
      }
      // un chapitre qui n’a plus lieu d’être s’efface, tant qu’on ne l’a pas commencé
      if (T.i === 0 && ch.still && !ch.still()) { finish(ch, true); return; }
      while (ch.steps[T.i] && !fits(ch.steps[T.i])) T.i++;
      const s = ch.steps[T.i];
      if (!s) { finish(ch); return; }
      if (s.done && s.done()) { advance(); return; }
      if (s.back !== undefined && !modalOpen()) { T.i = s.back; stepAt = 0; return; }
      // où se passe l’étape
      if (modalOpen() && !s.modal) { hide(); return; }
      // une explication qu’on a laissée en changeant d’onglet : tant pis, on n’y ramène pas
      if (s.next && !s.go && s.tab && U.tab !== s.tab) { advance(); return; }
      // un chapitre pas encore entamé ne rappelle pas vers un autre onglet : il attend qu’on y revienne
      if (T.i === 0 && !s.go && s.tab && U.tab !== s.tab) { hide(); return; }
      let view;
      if (s.tab && U.tab !== s.tab && !s.modal) {
        // le Carnet est une page de l’Atelier, le Cosmos une page du Journal
        const par = { carnet: "atelier", cosmos: "journal" }[s.tab];
        const sel = par && U.tab === par ? '[data-tab2="' + s.tab + '"]' : '#tabs [data-tab="' + (par || s.tab) + '"]';
        view = { target: resolve(sel), text: s.go || "Ouvre " + TABS[s.tab] + "." };
      } else {
        const target = resolve(s.at);
        const text = typeof s.text === "function" ? s.text() : s.text;
        view = { target, text: !target && s.alt ? s.alt : text, next: s.next, free: s.free, dim: s.free ? false : s.dim };
        // on amène la cible à l’écran : une fois en douceur, puis on insiste un court moment
        // (la page peut s’être redessinée entre-temps) tant qu’elle n’y est pas
        const key = ch.id + ":" + T.i;
        if (target && revealed !== key) {
          revealed = key; revealAt = Date.now();
          if (scrolls(target) && !inBand(target.r)) target.el.scrollIntoView({ block: "center", behavior: "smooth" });
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
      S().flags.milesSeen = false;
      S().settings.tuto = true;
      lastEnd = 0;
      save();
    }
    const doneCount = () => CH.filter((c) => state().done[c.id]).length;
    return { tick, active, setEnabled, restart, enabled, chapters: () => CH.map((c) => ({ id: c.id, n: c.n, done: !!state().done[c.id] })), doneCount };
  }

  window.EclatTuto = { create };
})();
