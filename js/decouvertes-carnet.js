/* La Lisière se précise avec les explorations. Les illustrations se déduisent
 * des acquis existants : aucun état de collection parallèle dans la sauvegarde. */
(function () {
  "use strict";
  const BASE = "assets/carnet/discoveries/";
  function create({ E, A, esc, openModal }) {
    let recent = null, frame = 0, stopSound = null, soundKey = "";
    const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const clamp = (v) => Math.max(0, Math.min(1, v));
    function acquired(id, index) {
      const s = E.state, f = (E.RECIT && E.RECIT.expFrag || {})["lisiere:" + id];
      return (s.exp.done.lisiere || 0) > index || !!(s.frags[id] || (f && s.frags[f])) ||
        !!(s.livre && s.livre.p && s.livre.p[id === "chene" ? "p01" : "p03"]);
    }
    function state() { return { chene: acquired("chene", 0), grotte: acquired("grotte", 1) }; }
    E.on("expdone", (r) => {
      if (r.z === "lisiere" && ["chene", "grotte"].includes(r.x.id) && !r.silent && !r.revisit && r.fragNew) {
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
        '<svg class="lisiere-pencil" viewBox="0 0 600 400" aria-hidden="true"><path data-carnet-path="chene" pathLength="1" d="M170 350 C198 349 220 330 247 328 S310 311 337 306 S380 308 405 275"/><path data-carnet-path="grotte" pathLength="1" d="M181 338 C158 322 147 302 139 278 S123 247 106 233"/></svg></div>' +
        '<figcaption data-carnet-caption>' + (s.chene ? "I · Le Grand Chêne" : "Le camp · La forêt reste à découvrir") + '</figcaption></figure>';
    }
    function studyHTML() {
      const s = state(), active = E.state.exp.active;
      if (!s.grotte && !(active && active.z === "lisiere" && active.i === 1)) return "";
      return '<div class="carnet-studies" data-carnet-study' + (s.grotte ? '' : ' data-pending="true"') + '>' +
        '<p class="carnet-fieldnote">' + (s.grotte ? "Une paroi et ses empreintes, gardées dans le carnet." : "Une nouvelle étude se prépare dans la marge…") + '</p>' +
        (s.grotte ? '<figure><button class="carnet-study-button" data-carnet-plate="grotte" aria-label="Examiner la planche de la Grotte aux Mains"><img src="' + BASE + 'grotte.webp" alt="Étude d’une paroi calcaire portant des empreintes de mains à l’ocre rouge." loading="lazy" decoding="async"></button><figcaption>II · La Grotte aux Mains</figcaption></figure>' : '<div class="carnet-study-pending" aria-hidden="true"></div>') + '</div>';
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
      if (window.EclatStyleMode !== "vivant" || !visible(el)) { hush(); return; }
      const s = state(), xp = E.expProgress(), active = xp && xp.z === "lisiere" && xp.i < 2 ? xp : null;
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
        const id = path.dataset.carnetPath, done = s[id], working = active && active.i === (id === "chene" ? 0 : 1);
        const p = done ? 1 : working ? active.p : 0;
        path.style.strokeDashoffset = String(1 - p); path.style.opacity = p ? ".7" : "0";
      });
      const study = document.querySelector('[data-carnet-study] figure');
      if (study) {
        const p = finishing && recent.id === "grotte" ? reveal : 1;
        study.style.clipPath = p >= 1 ? "none" : 'inset(' + ((1 - p) * 100).toFixed(1) + '% 0 0 0)';
      }
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
      if (!state().grotte) return true;
      hush();
      openModal({ html: '<div class="kicker">Carnet · Étude II</div><h2>La Grotte aux Mains</h2><img class="carnet-plate-detail" src="' + BASE + 'grotte.webp" alt="Paroi calcaire portant des empreintes de mains à l’ocre rouge."><div class="acts"><button class="btn pri" data-m="close">Refermer</button></div>' });
      return true;
    }
    document.addEventListener("visibilitychange", () => { if (document.hidden) hush(); });
    return { sceneHTML, studyHTML, live, click };
  }
  window.EclatDecouvertesCarnet = { create };
})();
