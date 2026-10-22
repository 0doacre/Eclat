/* ÉCLAT — Écriture des Anciens : dessin des signes et rendu des jetons.
 * Un signe est formé de trois points reliés par un trait de gauche à droite,
 * chaque point ayant une hauteur de 1 (bas) à 5 (haut).
 */
(function (root) {
  "use strict";

  const svgCache = new Map();

  function yOf(hVal) {
    const v = Math.max(1, Math.min(5, Math.round(Number(hVal) || 1)));
    return 20 - (v - 1) * 4;
  }

  function signeSVG(h, taille) {
    if (!Array.isArray(h) || h.length < 3) return "";
    const key = h[0] + "," + h[1] + "," + h[2] + "@" + (taille || "");
    if (svgCache.has(key)) return svgCache.get(key);

    const x1 = 4, y1 = yOf(h[0]);
    const x2 = 12, y2 = yOf(h[1]);
    const x3 = 20, y3 = yOf(h[2]);

    const sz = taille ? ' width="' + taille + '" height="' + taille + '"' : ' width="1.2em" height="1.2em"';
    const svg = '<svg class="signe-svg"' + sz + ' viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M ' + x1 + ' ' + y1 + ' L ' + x2 + ' ' + y2 + ' L ' + x3 + ' ' + y3 + '" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle cx="' + x1 + '" cy="' + y1 + '" r="2" fill="currentColor"/>' +
      '<circle cx="' + x2 + '" cy="' + y2 + '" r="2" fill="currentColor"/>' +
      '<circle cx="' + x3 + '" cy="' + y3 + '" r="2" fill="currentColor"/>' +
      '</svg>';

    svgCache.set(key, svg);
    return svg;
  }

  function renderSigneToken(id, opts) {
    opts = opts || {};
    const recit = opts.recit || {};
    const def = recit.signes && recit.signes[id];
    const esc = opts.esc || ((s) => String(s));
    if (def) {
      if (typeof opts.seeSigne === "function") {
        opts.seeSigne(id, opts.lieu);
      }
      const stSigne = opts.state && opts.state.signes && opts.state.signes[id];
      if (stSigne && stSigne.lu) {
        return '<span class="signe lu" data-s="' + esc(id) + '">' + esc(def.mot) + '</span>';
      }
      return '<span class="signe" data-s="' + esc(id) + '">' + signeSVG(def.h) + '</span>';
    }
    return '<span class="signe" data-s="' + esc(id) + '">◇</span>';
  }

  /* Une lecture : la phrase en français d’une ligne de signes, gardée brouillée
   * (base64) dans les données. Elle ne s’affiche que si tous les signes de la
   * ligne sont compris. lectureLigne(ligne brute, { recit, state }) → texte ou "". */
  function deb64(s) {
    try {
      const bin = (typeof atob === "function") ? atob(s) : Buffer.from(s, "base64").toString("binary");
      return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
    } catch (e) {
      return "";
    }
  }

  function lectureLigne(ligne, opts) {
    opts = opts || {};
    const recit = opts.recit || {};
    const lectures = recit.lectures;
    if (!ligne || !Array.isArray(lectures) || !lectures.length) return "";
    const ids = [];
    String(ligne).replace(/\[([a-zA-Z0-9_\u00C0-\u017F-]+)\]/g, (m, id) => { ids.push(id); return m; });
    if (!ids.length) return "";
    const signes = (opts.state && opts.state.signes) || {};
    for (const id of ids) {
      if (!recit.signes || !recit.signes[id] || !signes[id] || !signes[id].lu) return "";
    }
    for (const lec of lectures) {
      if (lec && lec.l && lec.fr && String(ligne).indexOf(lec.l) >= 0) return deb64(lec.fr);
    }
    return "";
  }

  const Signes = {
    signeSVG,
    renderSigneToken,
    lectureLigne
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = Signes;
  }
  root.signeSVG = signeSVG;
  root.renderSigneToken = renderSigneToken;
  root.lectureLigne = lectureLigne;
  root.EclatSignes = Signes;
})(typeof globalThis !== "undefined" ? globalThis : this);
