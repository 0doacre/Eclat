/* Les terres se précisent avec les explorations. Les illustrations se déduisent
 * des acquis existants : aucun état de collection parallèle dans la sauvegarde. */
(function () {
  "use strict";
  const BASE = "assets/carnet/discoveries/";
  const PRIMARY = {
    lisiere: { id: "chene", name: "Le Grand Chêne", known: "La Lisière découverte, avec le camp au premier plan.", unknown: "Le camp au premier plan, devant une forêt encore esquissée.", caption: "Le camp · La forêt reste à découvrir", path: "M170 350 C198 349 220 330 247 328 S310 311 337 306 S380 308 405 275", origin: "72% 40%" },
    plaine: { id: "champ_os", name: "Le Champ des Os", known: "La Plaine des Hautes Herbes découverte, avec des os au bord des rochers.", unknown: "La Plaine des Hautes Herbes encore esquissée au crayon.", caption: "Des herbes hautes · La plaine reste à découvrir", path: "M95 325 C160 302 195 330 258 307 S348 286 389 300 S462 327 495 296", origin: "80% 70%" }
  };
  const ALL_STUDIES = {
    lisiere: {
      grotte: { index: 1, number: "II", name: "La Grotte aux Mains", note: "Une paroi et ses empreintes, gardées dans le carnet.", alt: "Étude d’une paroi calcaire portant des empreintes de mains à l’ocre rouge.", path: "M181 338 C158 322 147 302 139 278 S123 247 106 233" },
      cercle: { index: 2, number: "III", name: "Le Cercle de Pierres", note: "Vu d’en haut, le cercle se dessine dans la clairière.", alt: "Vue aérienne d’un cercle de pierres anciennes dans une clairière de la forêt.", path: "M198 330 C230 305 263 292 273 267 S265 233 240 239 C220 245 212 264 231 272 S276 266 291 243" }
    },
    plaine: {
      tumulus: { index: 1, number: "II", name: "Le Tumulus", note: "Une entrée de pierre, sous les herbes de la plaine.", alt: "Étude d’un tumulus herbeux et de son entrée sombre bordée de pierres.", path: "M350 306 C323 282 311 251 275 237 S224 219 185 216" }
    }
  };
  function create({ E, A, esc, openModal, zone = "lisiere" }) {
    const primary = PRIMARY[zone], STUDIES = ALL_STUDIES[zone];
    let recent = null, frame = 0, stopSound = null, soundKey = "";
    const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const clamp = (v) => Math.max(0, Math.min(1, v));
    function acquired(id, index) {
      const s = E.state, key = zone + ":" + id, f = (E.RECIT && E.RECIT.expFrag || {})[key];
      const reward = E.ZONES[zone].exps[index].rw.frag;
      return (s.exp.done[zone] || 0) > index || !!(s.frags[id] || s.frags[reward] || (f && s.frags[f])) ||
        Object.entries(E.RECIT && E.RECIT.pages || {}).some(([pid, page]) => s.livre && s.livre.p && s.livre.p[pid] && (page.src || []).some((src) => src.k === "exp" && src.at === key));
    }
    function state() { return { [primary.id]: acquired(primary.id, 0), ...Object.fromEntries(Object.entries(STUDIES).map(([id, study]) => [id, acquired(id, study.index)])) }; }
    E.on("expdone", (r) => {
      if (r.z === zone && (r.x.id === primary.id || STUDIES[r.x.id]) && !r.silent && !r.revisit && r.fragNew) {
        recent = { id: r.x.id, at: 0, expires: Date.now() + 60000 };
      }
    });
    E.on("cycle", () => { recent = null; });
    function sceneHTML() {
      const s = state();
      const paths = { [primary.id]: primary.path, ...Object.fromEntries(Object.entries(STUDIES).map(([id, study]) => [id, study.path])) };
      const sketch = new URL(BASE + zone + '-esquisse.webp', document.baseURI).href;
      return '<figure class="carnet-landscape carnet-discovery-land carnet-' + zone + '" data-carnet-scene="' + zone + '" data-contempler="' + zone + '" tabindex="0" role="button" aria-label="Contempler l’aquarelle : ' + esc(primary.name) + '" title="Agrandir et contempler l’aquarelle : ' + esc(primary.name) + '" style="--carnet-sketch:url(' + esc(sketch) + ')">' +
        '<div class="lisiere-scene" role="img" aria-label="' + esc(s[primary.id] ? primary.known : primary.unknown) + '">' +
        '<div class="lisiere-sketch" aria-hidden="true"></div><img class="lisiere-color" src="assets/carnet/lands/' + zone + '.webp" alt="" decoding="async" style="opacity:' + (s[primary.id] ? 1 : 0) + '">' +
        (zone === "lisiere" ? '<div class="lisiere-camp" aria-hidden="true"></div>' : '') +
        '<svg class="lisiere-pencil" viewBox="0 0 600 400" aria-hidden="true">' + Object.entries(paths).map(([id, path]) => '<path data-carnet-path="' + id + '" pathLength="1" d="' + path + '"/>').join('') + '</svg></div>' +
        '<figcaption data-carnet-caption>' + esc(s[primary.id] ? "I · " + primary.name : primary.caption) + '</figcaption></figure>';
    }
    function studyHTML() {
      const s = state(), active = E.state.exp.active;
      return Object.entries(STUDIES).map(([id, study]) => {
        if (!s[id] && !(active && active.z === zone && active.i === study.index)) return "";
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
      const el = document.querySelector('#v-domaine:not(.hidden) [data-carnet-scene="' + zone + '"]');
      const land = el && el.closest('.carnet-terre');
      const s = state(), xp = E.expProgress(), active = xp && xp.z === zone && xp.i <= Object.keys(STUDIES).length ? xp : null;
      const studyId = recent ? recent.id : active && Object.keys(STUDIES).find((id) => STUDIES[id].index === active.i);
      const target = studyId && land && land.querySelector('[data-carnet-study="' + studyId + '"]');
      if (window.EclatStyleMode !== "vivant" || !el || !visible(target || el)) { hush(); return; }
      if (recent && !s[recent.id]) recent = null;
      if (recent && Date.now() > recent.expires) recent = null;
      if (recent && !recent.at) recent.at = performance.now();
      let reveal = recent && !reduced() ? clamp((performance.now() - recent.at) / 4000) : 1;
      const finishing = recent && reveal < 1;
      const paint = s[primary.id] ? (finishing && recent.id === primary.id ? .6 + .4 * reveal : 1) : active && active.i === 0 ? .6 * active.p : 0;
      const image = el.querySelector('.lisiere-color');
      image.style.opacity = paint ? "1" : "0";
      image.style.maskImage = paint >= 1 ? "none" : 'radial-gradient(ellipse ' + (paint * 180).toFixed(1) + '% ' + (paint * 180).toFixed(1) + '% at ' + primary.origin + ',#000 58%,transparent 73%)';
      el.querySelector('.lisiere-sketch').style.opacity = String(.28 * (1 - paint));
      el.querySelectorAll('[data-carnet-path]').forEach((path) => {
        const id = path.dataset.carnetPath, done = s[id], working = active && active.i === (id === primary.id ? 0 : STUDIES[id].index);
        const p = done ? 1 : working ? active.p : 0;
        path.style.strokeDashoffset = String(1 - p); path.style.opacity = p ? ".7" : "0";
      });
      land.querySelectorAll('[data-carnet-study] figure').forEach((study) => {
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
      if (!b || !b.closest('#dt-' + zone)) return false;
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
