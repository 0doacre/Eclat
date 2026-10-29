/* La Lisière se précise avec les explorations. Les illustrations se déduisent
 * des acquis existants : aucun état de collection parallèle dans la sauvegarde. */
(function () {
  "use strict";
  const BASE = "assets/carnet/discoveries/";
  const STUDIES = {
    grotte: { index: 1, number: "II", name: "La Grotte aux Mains", note: "Une paroi et ses empreintes, gardées dans le carnet.", alt: "Étude d’une paroi calcaire portant des empreintes de mains à l’ocre rouge." },
    cercle: { index: 2, number: "III", name: "Le Cercle de Pierres", note: "Vu d’en haut, le cercle se dessine dans la clairière.", alt: "Vue aérienne d’un cercle de pierres anciennes dans une clairière de la forêt." }
  };
  function create({ E, A, esc, openModal }) {
    let recent = null, frame = 0, stopSound = null, soundKey = "";
    const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const clamp = (v) => Math.max(0, Math.min(1, v));
    function acquired(id, index) {
      const s = E.state, f = (E.RECIT && E.RECIT.expFrag || {})["lisiere:" + id];
      const page = { chene: "p01", grotte: "p03" }[id];
      return (s.exp.done.lisiere || 0) > index || !!(s.frags[id] || (f && s.frags[f])) ||
        !!(page && s.livre && s.livre.p && s.livre.p[page]);
    }
    function state() { return { chene: acquired("chene", 0), ...Object.fromEntries(Object.entries(STUDIES).map(([id, study]) => [id, acquired(id, study.index)])) }; }
    E.on("expdone", (r) => {
      if (r.z === "lisiere" && (r.x.id === "chene" || STUDIES[r.x.id]) && !r.silent && !r.revisit && r.fragNew) {
        recent = { id: r.x.id, at: 0, expires: Date.now() + 60000 };
      }
    });
    E.on("cycle", () => { recent = null; });
    function sceneHTML() {
      const s = state();
      return '<figure class="carnet-landscape carnet-lisiere" data-carnet-scene>' +
        '<div class="lisiere-scene" role="img" aria-label="' + esc(s.chene ? "La Lisière découverte, avec le camp au premier plan." : "Le camp au premier plan, devant une forêt encore esquissée.") + '">' +
        '<div class="lisiere-sketch" aria-hidden="true"></div><img class="lisiere-color" src="assets/carnet/lands/lisiere.webp" alt="" decoding="async" style="opacity:' + (s.chene ? 1 : 0) + '">' +
        '<div class="lisiere-camp" aria-hidden="true"></div>' +
        '<svg class="lisiere-pencil" viewBox="0 0 600 400" aria-hidden="true"><path data-carnet-path="chene" pathLength="1" d="M170 350 C198 349 220 330 247 328 S310 311 337 306 S380 308 405 275"/><path data-carnet-path="grotte" pathLength="1" d="M181 338 C158 322 147 302 139 278 S123 247 106 233"/><path data-carnet-path="cercle" pathLength="1" d="M198 330 C230 305 263 292 273 267 S265 233 240 239 C220 245 212 264 231 272 S276 266 291 243"/></svg></div>' +
        '<figcaption data-carnet-caption>' + (s.chene ? "I · Le Grand Chêne" : "Le camp · La forêt reste à découvrir") + '</figcaption></figure>';
    }
    function studyHTML() {
      const s = state(), active = E.state.exp.active;
      return Object.entries(STUDIES).map(([id, study]) => {
        if (!s[id] && !(active && active.z === "lisiere" && active.i === study.index)) return "";
        const reveal = recent && recent.id === id && !reduced() ? ' style="clip-path:inset(100% 0 0 0)"' : "";
        return '<div class="carnet-studies" data-carnet-study="' + id + '"' + (s[id] ? '' : ' data-pending="true"') + '>' +
          '<p class="carnet-fieldnote">' + esc(s[id] ? study.note : "Une nouvelle étude se prépare dans la marge…") + '</p>' +
          (s[id] ? '<figure' + reveal + '><button class="carnet-study-button" data-carnet-plate="' + id + '" aria-label="Examiner la planche : ' + esc(study.name) + '"><img src="' + BASE + id + '.webp" alt="' + esc(study.alt) + '" loading="lazy" decoding="async"></button><figcaption>' + study.number + ' · ' + esc(study.name) + '</figcaption></figure>' : '<div class="carnet-study-pending" aria-hidden="true"></div>') + '</div>';
      }).join("");
    }
    function hush() { if (stopSound) stopSound(); stopSound = null; }
    function visible(el) {
      if (!el || !el.isConnected || document.hidden || !el.getClientRects().length || document.querySelector("#modal:not(.hidden)")) return false;
      const r = el.getBoundingClientRect();
      return r.bottom > 0 && r.top < innerHeight;
    }
    function update() {
      frame = 0;
      const el = document.querySelector('#v-domaine:not(.hidden) [data-carnet-scene]');
      const s = state(), xp = E.expProgress(), active = xp && xp.z === "lisiere" && xp.i < 3 ? xp : null;
      const studyId = recent ? recent.id : active && Object.keys(STUDIES).find((id) => STUDIES[id].index === active.i);
      const target = studyId && document.querySelector('[data-carnet-study="' + studyId + '"]');
      if (window.EclatStyleMode !== "vivant" || !el || !visible(target || el)) { hush(); return; }
      if (recent && !s[recent.id]) recent = null;
      if (recent && Date.now() > recent.expires) recent = null;
      if (recent && !recent.at) recent.at = performance.now();
      let reveal = recent && !reduced() ? clamp((performance.now() - recent.at) / 4000) : 1;
      const finishing = recent && reveal < 1;
      const paint = s.chene ? (finishing && recent.id === "chene" ? .6 + .4 * reveal : 1) : active && active.i === 0 ? .6 * active.p : 0;
      const image = el.querySelector('.lisiere-color');
      image.style.opacity = paint ? "1" : "0";
      image.style.maskImage = paint >= 1 ? "none" : 'radial-gradient(ellipse ' + (paint * 180).toFixed(1) + '% ' + (paint * 180).toFixed(1) + '% at 72% 40%,#000 58%,transparent 73%)';
      el.querySelector('.lisiere-sketch').style.opacity = String(.28 * (1 - paint));
      el.querySelectorAll('[data-carnet-path]').forEach((path) => {
        const id = path.dataset.carnetPath, done = s[id], working = active && active.i === (id === "chene" ? 0 : STUDIES[id].index);
        const p = done ? 1 : working ? active.p : 0;
        path.style.strokeDashoffset = String(1 - p); path.style.opacity = p ? ".7" : "0";
      });
      document.querySelectorAll('[data-carnet-study] figure').forEach((study) => {
        const p = finishing && recent.id === study.parentElement.dataset.carnetStudy ? reveal : 1;
        study.style.clipPath = p >= 1 ? "none" : 'inset(' + ((1 - p) * 100).toFixed(1) + '% 0 0 0)';
      });
      const key = active ? active.i + ":" + E.state.exp.active.t0 : finishing ? "found:" + recent.id + recent.at : "";
      if (key !== soundKey) {
        hush(); soundKey = key;
        if (key && !reduced() && A.pencil) stopSound = A.pencil(finishing ? 3.5 : 1.8);
      }
      if (recent && !finishing) recent = null;
      if (active || finishing) frame = requestAnimationFrame(update);
    }
    function live() { if (!frame) update(); }
    function click(target) {
      const b = target.closest('[data-carnet-plate]');
      if (!b) return false;
      const id = b.dataset.carnetPlate, study = STUDIES[id];
      if (!study || !state()[id]) return true;
      hush();
      openModal({ html: '<div class="kicker">Carnet · Étude ' + study.number + '</div><h2>' + esc(study.name) + '</h2><img class="carnet-plate-detail" src="' + BASE + id + '.webp" alt="' + esc(study.alt) + '"><div class="acts"><button class="btn pri" data-m="close">Refermer</button></div>' });
      return true;
    }
    document.addEventListener("visibilitychange", () => { if (document.hidden) hush(); });
    return { sceneHTML, studyHTML, live, click };
  }
  window.EclatDecouvertesCarnet = { create };
})();
