/* Un chantier visible, déduit des apports du passage existant. Aucun état métier ajouté. */
(function () {
  "use strict";
  const sessions = new WeakMap(), BASE = "assets/carnet/passages/";
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function phase(p) {
    return p >= 1 ? "Le Sentier des Herbes est ouvert" : p <= 0 ? "Un passage à dégager" : p < .35 ? "Les ronces cèdent" : p < .75 ? "Le sol se dégage" : "Le sentier prend forme";
  }
  function vars(p) { return '--sentier-bramble:' + clamp(p / .65).toFixed(4) + ';--sentier-grass:' + clamp((p - .25) / .75).toFixed(4); }
  function html(E) {
    const p = E.passInfo("plaine");
    if (!p || (!p.ready && !p.done && !E.zoneOpen("plaine"))) return "";
    const target = p.done || E.zoneOpen("plaine") ? 1 : clamp(p.frac);
    const session = sessions.get(E), pending = session && session.pending;
    const initial = pending && pending.to === target && !reduced() ? session.value : target;
    return '<figure class="sentier-chantier" data-sentier-target="' + target + '" style="' + vars(initial) + '"><div class="sentier-scene" role="img" aria-label="Le Sentier des Herbes : ' + Math.floor(target * 100) + ' % des travaux réalisés.">' +
      '<img class="sentier-ground" src="' + BASE + 'base.webp" alt="" loading="lazy" decoding="async">' +
      '<img class="sentier-grass" src="' + BASE + 'herbes-sentier.webp" alt="" loading="lazy" decoding="async">' +
      '<img class="sentier-bramble sentier-left" src="' + BASE + 'ronces-gauche.webp" alt="" loading="lazy" decoding="async">' +
      '<img class="sentier-bramble sentier-right" src="' + BASE + 'ronces-droite.webp" alt="" loading="lazy" decoding="async">' +
      '<span class="sentier-soil" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span></div>' +
      '<figcaption><span data-sentier-phase>' + phase(target) + '</span><span class="sentier-percent">' + Math.floor(target * 100) + ' %</span></figcaption></figure>';
  }
  function create({ E, A }) {
    const session = { pending: null, value: 0 };
    sessions.set(E, session);
    let frame = 0, state = E.state;
    E.on("sentierwork", (o) => {
      const from = session.pending ? session.value : o.from;
      session.value = from;
      session.pending = { from, to: o.to, focus: o.focus, at: 0, expires: Date.now() + 60000 };
    });
    document.addEventListener("click", (ev) => {
      const b = ev.target.closest && ev.target.closest('[data-sentier-replay]');
      if (!b || window.EclatStyleMode !== "vivant" || !E.zoneOpen("plaine")) return;
      A.init();
      session.pending = null;
      E.emit("sentierwork", { from: 0, to: 1, focus: true });
    });
    function visible(el) {
      if (!el.isConnected || !el.getClientRects().length) return false;
      const modal = document.querySelector('#modal:not(.hidden)');
      if (modal && !modal.contains(el)) return false;
      const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight;
    }
    function update() {
      frame = 0;
      if (state !== E.state) { state = E.state; session.pending = null; }
      if (document.hidden || window.EclatStyleMode !== "vivant") return;
      const scenes = [...document.querySelectorAll('[data-sentier-target]')];
      let pending = session.pending;
      if (pending && Date.now() > pending.expires) session.pending = pending = null;
      if (pending && pending.focus && !pending.at && !document.querySelector('#modal:not(.hidden)')) {
        const scene = document.querySelector('#dt-lisiere [data-sentier-target], #dpass-plaine [data-sentier-target]');
        if (scene && scene.getClientRects().length) { pending.focus = false; scene.scrollIntoView({ block: "center", behavior: "auto" }); }
      }
      const shown = scenes.filter(visible);
      if (!shown.length) return;
      if (pending && !pending.at) { pending.at = performance.now(); if (!reduced() && A.pathWork) A.pathWork(pending.to); }
      const t = pending && !reduced() ? clamp((performance.now() - pending.at) / (pending.to === 1 ? 2400 : 1600)) : 1;
      const eased = t * t * (3 - 2 * t);
      if (pending) session.value = pending.from + (pending.to - pending.from) * eased;
      scenes.forEach((el) => {
        const target = Number(el.dataset.sentierTarget), work = pending && target === pending.to;
        const p = work ? session.value : target;
        el.style.setProperty('--sentier-bramble', clamp(p / .65).toFixed(4));
        el.style.setProperty('--sentier-grass', clamp((p - .25) / .75).toFixed(4));
        el.classList.toggle('is-working', !!(work && t < 1 && !reduced()));
        el.querySelector('[data-sentier-phase]').textContent = phase(p);
      });
      if (pending && t < 1) frame = requestAnimationFrame(update);
      else session.pending = null;
    }
    return { live: () => { if (!frame) update(); } };
  }
  window.EclatSentier = { html, create };
})();
