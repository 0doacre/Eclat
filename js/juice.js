/* ÉCLAT — le « jus » : ce que le jeu fait sentir quand on le touche ou qu’il se passe quelque chose de rare.
 * Un appui se voit (le bouton s’enfonce, un anneau part du doigt) ; un moment rare s’entend, se voit
 * et se sent d’autant plus qu’il est rare (les trois paliers de PALIERS). Rien n’est obligatoire :
 * « réduire les animations » garde la couleur et le message, le son et les vibrations ont leurs réglages. */
(function (root) {
  "use strict";

  /* palier : 1 = une trouvaille, 2 = une rareté, 3 = un moment qui se raconte.
   * ms : la durée de la fête ; sparks : étincelles ; rings : anneaux de choc ; flash : voile de couleur (0 à 1) ;
   * shake : secousse de l’écran, en pixels ; vibre : motif des vibrations ; fireworks : des gerbes en plus. */
  const PALIERS = {
    1: { ms: 1900, sparks: 34, rings: 1, flash: 0, shake: 0, vibre: [12, 40, 24], fireworks: 0 },
    2: { ms: 2900, sparks: 56, rings: 2, flash: 0.22, shake: 4, vibre: [18, 40, 30, 40, 50], fireworks: 0 },
    3: { ms: 4400, sparks: 90, rings: 3, flash: 0.5, shake: 8, vibre: [30, 50, 30, 50, 60, 60, 120], fireworks: 4 }
  };
  const palier = (n) => PALIERS[Math.max(1, Math.min(3, Math.floor(n) || 1))];

  /* ce qui répond à l’appui : les boutons, les icônes qu’on touche, les liens de la page */
  const PRESSABLE = 'button, [role="button"], .btn, .inv, .item-pill, .ing.link, .cost-row[data-goto], .age-pill, .gis-ic, [data-goto]';
  const EXCLU = ".visiteur, .toast, #fx, .cele";

  function create(api) {
    const { A, U, S, vibe, motionOK } = api;
    const doc = root.document;
    const fx = () => doc.getElementById("fx");
    let lastRing = 0;

    function el(cls, css) {
      const d = doc.createElement("div");
      d.className = cls;
      if (css) for (const k in css) d.style.setProperty(k, css[k]);
      return d;
    }
    function ring(x, y, color, size, ms) {
      const f = fx();
      if (!f || !motionOK()) return;
      const r = el("jring", { left: x + "px", top: y + "px", "--s": (size || 56) + "px", "--c": color || "var(--acc)", "--ms": (ms || 520) + "ms" });
      f.appendChild(r);
      setTimeout(() => r.remove(), (ms || 520) + 60);
    }
    function flash(color, force) {
      const f = fx();
      if (!f || !motionOK() || !(force > 0)) return;
      const d = el("jflash", { "--c": color || "#fff", "--o": String(force) });
      f.appendChild(d);
      setTimeout(() => d.remove(), 600);
    }
    function shake(px) {
      const app = doc.getElementById("app");
      if (!app || !motionOK() || !(px > 0)) return;
      app.style.setProperty("--shake", px + "px");
      app.classList.remove("jshake"); void app.offsetWidth; app.classList.add("jshake");
      clearTimeout(U.shakeT);
      U.shakeT = setTimeout(() => app.classList.remove("jshake"), 480);
    }
    /* le choc d’un moment rare : anneaux, voile, secousse, coup sourd, vibrations */
    function impact(tier, x, y, color) {
      const p = palier(tier);
      if (tier >= 2) { A.boom && A.boom(tier); }
      for (let i = 0; i < p.rings; i++) setTimeout(() => ring(x, y, color, 120 + i * 90, 700 + i * 120), i * 140);
      flash(color, p.flash);
      shake(p.shake);
      if (tier >= 2) vibe(p.vibre);
    }
    /* un appui : le bouton s’enfonce, un petit anneau part du doigt */
    function press() {
      doc.addEventListener("pointerdown", (ev) => {
        if (ev.pointerType === "mouse" && ev.button !== 0) return;
        const t = ev.target && ev.target.closest ? ev.target.closest(PRESSABLE) : null;
        if (!t || t.matches(EXCLU) || t.closest(EXCLU) || t.disabled || t.getAttribute("aria-disabled") === "true") return;
        t.classList.add("jpress");
        const off = () => { t.classList.remove("jpress"); doc.removeEventListener("pointerup", off, true); doc.removeEventListener("pointercancel", off, true); };
        doc.addEventListener("pointerup", off, true);
        doc.addEventListener("pointercancel", off, true);
        setTimeout(off, 700);
        const now = root.performance.now();
        if (now - lastRing > 70) { lastRing = now; ring(ev.clientX, ev.clientY, "var(--acc)", 46, 380); }
        if (S().settings && S().settings.vibe) vibe(5);
      }, true);
    }
    return { press, ring, flash, shake, impact, palier };
  }

  const J = { PALIERS, palier, create };
  root.EclatJuice = J;
  if (typeof module !== "undefined" && module.exports) module.exports = J;
})(typeof window !== "undefined" ? window : globalThis);
