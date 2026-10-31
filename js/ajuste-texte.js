/* 0.47.1 : un texte qui ne tient pas sur la largeur de son bouton rétrécit (jusqu'à 70 %) au lieu de faire grandir le bouton ou d'être coupé.
 * Sont concernés les contrôles d'une seule ligne : boutons du haut, pastilles, filtres, chips, tout élément marqué data-fit. */
(function () {
  "use strict";
  const SELECTEUR = "[data-fit], .terres-pastille, #top .chip, .arb-filtres button, .ae-chip:not(.ae-outil), .age-pill, .atel-etat";
  const MIN = 0.7;
  function ajuste(el) {
    if (!el.offsetParent) return;
    el.style.fontSize = "";
    if (el.scrollWidth <= el.clientWidth + 1) return;
    const base = parseFloat(getComputedStyle(el).fontSize) || 14;
    let f = 1;
    while (f > MIN && el.scrollWidth > el.clientWidth + 1) { f = Math.max(MIN, f - 0.06); el.style.fontSize = (base * f).toFixed(2) + "px"; }
  }
  function tout(racine) {
    (racine || document).querySelectorAll(SELECTEUR).forEach(ajuste);
    // les chips du haut portent leur texte dans .cv : on ajuste aussi ces blocs
    (racine || document).querySelectorAll("#top .chip .cv b, #top .chip .cv small").forEach((e) => { e.style.fontSize = ""; const c = e.closest(".chip"); if (c && e.scrollWidth > c.clientWidth - 6) { const base = parseFloat(getComputedStyle(e).fontSize) || 11; e.style.fontSize = Math.max(base * MIN, base * (c.clientWidth - 6) / e.scrollWidth).toFixed(2) + "px"; } });
  }
  let t = 0;
  function plusTard() { if (t) return; t = requestAnimationFrame(() => { t = 0; tout(); }); }
  function init() {
    tout();
    const obs = new MutationObserver(plusTard);
    ["views", "top", "modal"].forEach((id) => { const n = document.getElementById(id); if (n) obs.observe(n, { childList: true, subtree: true, characterData: true }); });
    window.addEventListener("resize", plusTard);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(plusTard);
  }
  window.EclatAjusteTexte = { tout, ajuste };
  if (typeof document !== "undefined") { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init(); }
})();
