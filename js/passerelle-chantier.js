/* La Passerelle suit les vrais apports vers la Rivière, sans progression parallèle. */
(function () {
  "use strict";
  const sessions = new WeakMap(), BASE = "assets/carnet/passages/";
  const clamp = n => Math.max(0, Math.min(1, n));
  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const phase = p => p >= 1 ? "La Passerelle est ouverte" : p <= 0 ? "Deux berges à relier" : p < .35 ? "Les pieux prennent place" : p < .75 ? "La charpente se lie" : "Le tablier rejoint l’autre rive";
  const vars = p => '--passerelle-structure:' + clamp(p / .6).toFixed(4) + ';--passerelle-deck:' + clamp((p - .6) / .4).toFixed(4);
  function html(E) {
    const info = E.passInfo("riviere");
    if (!info || (!info.ready && !info.done && !E.zoneOpen("riviere"))) return "";
    const target = info.done || E.zoneOpen("riviere") ? 1 : clamp(info.frac);
    const session = sessions.get(E), pending = session && session.pending;
    const p = pending && pending.to === target && !reduced() ? session.value : target;
    return '<figure class="passerelle-chantier" data-passerelle-target="' + target + '" style="' + vars(p) + '"><div class="passerelle-scene" role="img" aria-label="La Passerelle : ' + Math.floor(target * 100) + ' % des travaux réalisés.">' +
      '<img src="' + BASE + 'berges.webp" alt="" loading="lazy" decoding="async">' +
      '<img class="passerelle-structure" src="' + BASE + 'passerelle-charpente.webp" alt="" loading="lazy" decoding="async">' +
      '<img class="passerelle-deck" src="' + BASE + 'passerelle-terminee.webp" alt="" loading="lazy" decoding="async"></div>' +
      '<figcaption><span data-passerelle-phase>' + phase(target) + '</span><span>' + Math.floor(target * 100) + ' %</span></figcaption></figure>';
  }
  function create({ E, A }) {
    const session = { pending: null, value: 0 };
    sessions.set(E, session);
    let frame = 0, state = E.state;
    E.on("passerellework", o => {
      session.value = session.pending ? session.value : o.from;
      session.pending = { from: session.value, to: o.to, focus: o.focus, at: 0, expires: Date.now() + 60000 };
    });
    document.addEventListener("click", ev => {
      const b = ev.target.closest && ev.target.closest('[data-passerelle-replay]');
      if (!b || window.EclatStyleMode !== "vivant" || !E.zoneOpen("riviere")) return;
      A.init(); session.pending = null;
      E.emit("passerellework", { from: 0, to: 1, focus: true });
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
      const scenes = [...document.querySelectorAll('[data-passerelle-target]')];
      let pending = session.pending;
      if (pending && Date.now() > pending.expires) session.pending = pending = null;
      if (pending && pending.focus && !pending.at && !document.querySelector('#modal:not(.hidden)')) {
        const scene = document.querySelector('#dt-plaine [data-passerelle-target], #dpass-riviere [data-passerelle-target]');
        if (scene && scene.getClientRects().length) { pending.focus = false; scene.scrollIntoView({ block: "center", behavior: "auto" }); }
      }
      if (!scenes.some(visible)) return;
      if (pending && !pending.at) { pending.at = performance.now(); if (!reduced() && A.pathWork) A.pathWork(pending.to); }
      const t = pending && !reduced() ? clamp((performance.now() - pending.at) / (pending.to === 1 ? 2400 : 1600)) : 1;
      if (pending) session.value = pending.from + (pending.to - pending.from) * t * t * (3 - 2 * t);
      scenes.forEach(el => {
        const target = Number(el.dataset.passerelleTarget), work = pending && target === pending.to;
        const p = work ? session.value : target;
        el.style.setProperty('--passerelle-structure', clamp(p / .6));
        el.style.setProperty('--passerelle-deck', clamp((p - .6) / .4));
        el.classList.toggle('is-working', !!(work && t < 1 && !reduced()));
        el.querySelector('[data-passerelle-phase]').textContent = phase(p);
      });
      if (pending && t < 1) frame = requestAnimationFrame(update);
      else session.pending = null;
    }
    return { live: () => { if (!frame) update(); } };
  }
  window.EclatPasserelle = { html, create };
})();
