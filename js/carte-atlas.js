/* Présentation de l’Atlas vivant. Aucune règle métier : les états viennent de
 * Carte/Engine. Le fond sans texte est révélé par bandes géographiques ; les
 * lieux, passages et commandes restent de vrais éléments accessibles. */
(function () {
  "use strict";
  const W = 400, H = 2600, SKY_BOTTOM = 1100;
  const GEO = {
    lisiere: { x: 204, y: 1880, top: 1653, bottom: 2100 },
    plaine: { x: 140, y: 1580, top: 1510, bottom: 1653 },
    riviere: { x: 268, y: 1430, top: 1341, bottom: 1510 },
    collines: { x: 140, y: 1260, top: 1185, bottom: 1341 },
    mine: { x: 270, y: 1110, top: 1042, bottom: 1185 },
    caveau: { x: 200, y: 2250, top: 2143, bottom: 2380, secret: true },
    desert: { x: 140, y: 960, top: 886, bottom: 1042 },
    gisement: { x: 270, y: 820, top: 756, bottom: 886 },
    montagnes: { x: 140, y: 680, top: 600, bottom: 756 },
    orbite: { x: 250, y: 875, top: 650, bottom: 1100, sky: true },
    lune: { x: 220, y: 500, top: 330, bottom: 650, sky: true },
    mercure: { x: 200, y: 170, top: 0, bottom: 330, sky: true }
  };
  // Un feuillet céleste plus ample, sans changer l’échelle du paysage terrestre.
  Object.values(GEO).filter(g => !g.sky).forEach(g => { g.y += 500; g.top += 500; g.bottom += 500; });
  const HINT = {
    plaine: "des herbes hautes, au loin", riviere: "le bruit d’une rivière",
    collines: "des collines, vers le nord", mine: "des galeries, peut-être",
    desert: "du sable à perte de vue", gisement: "une odeur de bitume",
    montagnes: "des pics brisés", orbite: "plus haut que le ciel",
    lune: "la Lune", mercure: "tout près du Soleil"
  };
  const PLACES = [[128, -38], [292, 8], [90, 42], [240, 55], [70, -10], [325, -38]];
  function enabled() {
    const sheet = document.getElementById("atlasStylesheet");
    return !!sheet && !sheet.disabled;
  }
  function isVivant() {
    return window.EclatStyleMode === "vivant" || document.documentElement.getAttribute("data-style-mode") === "vivant";
  }
  function create({ E, D, esc, use, lieuState, chip }) {
    const order = () => D.ZONES.filter(z => !z.secret && GEO[z.id]).map(z => z.id);
    function layout() {
      const open = D.ZONES.filter(z => E.zoneOpen(z.id) && GEO[z.id]).map(z => z.id);
      const ahead = order().filter(z => !E.zoneOpen(z));
      const first = ahead[0];
      const north = Math.min(...open.filter(z => !GEO[z].secret).map(z => GEO[z].top), GEO.lisiere.top);
      const views = document.getElementById("views"), heading = document.querySelector(".atlas-carte .atlas-map-heading"), tabs = document.getElementById("tabs");
      const width = views ? Math.min(W * 1.4, views.clientWidth) : W;
      const fill = views ? (views.clientHeight - (heading ? heading.offsetHeight : 96) - (tabs ? tabs.offsetHeight : 72) - 12) * W / Math.max(1, width) : 470;
      return { open, first, bottom: open.includes("caveau") ? H + 340 : H,
        top: Math.max(0, Math.min(H - Math.max(470, Math.ceil(fill)), north - 155)) };
    }
    // Deux frontières d’une même bande utilisent exactement la même courbe :
    // pas de couture entre régions ouvertes, même pour un état non contigu.
    function region(g) {
      const points = y => Array.from({ length: 41 }, (_, i) => [i * 10, y + 8 * Math.sin(i * .42) + 4 * Math.sin(i * .91)]);
      const pts = points(g.top).concat(g.bottom === H ? [[400, H], [0, H]] : points(g.bottom).reverse());
      return pts.map((p, i) => (i ? "L" : "M") + p[0] + " " + p[1].toFixed(2)).join(" ") + "Z";
    }
    const button = (attr, label, body, cls = "") => '<g class="a-button ' + cls + '" ' + attr + ' role="button" tabindex="0" aria-label="' + esc(label) + '">' + body + '</g>';
    function name(z) {
      const g = GEO[z], Z = E.ZONES[z];
      const lines = Z.n === "La Plaine des Hautes Herbes" ? ["La Plaine des", "Hautes Herbes"] : [Z.n];
      const y = g.top + (z === "lisiere" ? 70 : g.sky ? 30 : 27);
      const text = lines.map((line, i) => '<tspan x="200" dy="' + (i ? 21 : 0) + '">' + esc(line) + '</tspan>').join("");
      return button('data-cz="' + z + '"', Z.n + " : ouvrir dans le Domaine",
        '<rect class="a-hit" x="35" y="' + (y - 26) + '" width="330" height="' + Math.max(58, lines.length * 25) + '" rx="7"/>' +
        '<text class="a-name" x="200" y="' + y + '">' + text + '</text>', "a-region" + (g.sky ? " a-celestial-node" : ""));
    }
    function place(z, k) {
      const st = lieuState(z, k);
      if (st === "later") return "";
      const g = GEO[z], p = PLACES[k % PLACES.length], x = p[0];
      const y = g.top + (z === "lisiere" ? 180 : 80) + Math.floor(k / 2) * (z === "lisiere" ? 85 : 57);
      const ex = E.ZONES[z].exps[k], hidden = ex.hidden && st !== "done" && st !== "active";
      const label = hidden ? "Lieu caché" : ex.n;
      const states = { done: "exploré", active: "en cours", next: "à explorer", locked: "verrouillé" };
      const icons = window.ECLAT_ICONS || { places: {}, ui: {} };
      const icon = st === "locked" ? icons.ui.verrou : icons.places[ex.id] || icons.ui.exploration;
      // Nom lisible du prochain lieu uniquement ; les autres ont leur nom
      // accessible et une infobulle, sans couvrir le paysage de cartouches.
      const visible = st === "next" || st === "active";
      const title = '<title>' + esc(label + " · " + states[st]) + '</title>';
      return button('data-cl="' + z + ":" + k + '"', E.ZONES[z].n + " : " + label + ", " + states[st],
        title + '<circle class="a-hit" cx="' + x + '" cy="' + y + '" r="29"/>' +
        '<circle class="a-pin" cx="' + x + '" cy="' + y + '" r="15"/>' + (st === "done" ? '<path class="a-check" d="M' + (x - 6) + ' ' + y + ' l4 5 9 -11"/>' : use(icon, x, y, 18)) +
        (st === "active" ? '<circle class="a-active" cx="' + x + '" cy="' + y + '" r="21"/>' : "") +
        (visible ? '<text class="a-place-name" x="' + (x > 200 ? x - 23 : x + 23) + '" y="' + (y + 5) + '" text-anchor="' + (x > 200 ? "end" : "start") + '">' + esc(label) + '</text>' : ""), "a-place " + st + (g.sky ? " a-celestial-node" : ""));
    }
    function fog(open) {
      const closed = '<g class="a-fog" mask="url(#atlas-closed)" aria-hidden="true">' +
        '<rect x="0" y="1100" width="400" height="1500" class="a-fog-ground"/>' +
        '<rect width="400" height="1100" class="a-fog-space"/>' +
        '<g class="a-fog-drift"><rect x="-40" y="1060" width="480" height="1580" fill="url(#atlas-clouds)"/>' +
        '<rect x="-40" y="1060" width="480" height="1580" fill="url(#atlas-clouds-back)" opacity=".55"/>' +
        '<rect x="-40" y="-40" width="480" height="1180" fill="url(#atlas-clouds)" opacity=".28"/></g></g>';
      const edges = open.filter(z => !GEO[z].secret && !open.some(other => GEO[other].bottom === GEO[z].top)).map(z => {
        const g = GEO[z];
        if (g.top === 0) return "";
        return '<g class="a-fog-front' + (g.sky ? ' a-fog-edge-space' : '') + '" mask="url(#atlas-mist-' + z + ')" aria-hidden="true">' +
          '<g filter="url(#atlas-mist-warp)"><image class="a-fog-edge" href="assets/atlas/brume-v1.webp" x="-40" y="' + (g.top - 168) + '" width="480" height="240" preserveAspectRatio="none"/>' +
          '<image class="a-fog-edge a-fog-counter" href="assets/atlas/brume-v1.webp" x="-40" y="' + (g.top - 138) + '" width="480" height="200" preserveAspectRatio="none" opacity=".38"/></g></g>';
      }).join("");
      return closed + edges;
    }
    function passage(z) {
      const p = E.passInfo(z), g = GEO[z];
      if (!p || !p.ready || !g) return "";
      const y = g.bottom - 17, label = "Passage · " + Math.floor(p.frac * 100) + " %";
      return button('data-cp="' + z + '"', "Passage vers " + E.ZONES[z].n + " : " + Math.floor(p.frac * 100) + " %",
        '<rect class="a-pass-bg" x="111" y="' + (y - 29) + '" width="178" height="58" rx="9"/>' +
        '<text class="a-pass-text" x="200" y="' + (y + 5) + '" data-cpl="' + z + '">' + label + '</text>', "a-pass");
    }
    function view() {
      const { open, first, top, bottom } = layout(), known = open.filter(z => !GEO[z].secret);
      const total = order().length;
      const north = Math.min(...open.filter(z => !GEO[z].secret).map(z => GEO[z].top), GEO.lisiere.top);
      let s = '<div class="carte atlas-carte">' + chip() +
        '<header class="atlas-map-heading"><div class="atlas-map-title"><h2>Atlas vivant</h2><span>' + known.length + ' / ' + total + ' terres</span></div>' +
        '<div class="atlas-map-actions"><button type="button" data-map-go="lisiere" title="Recentrer la carte sur ton camp">' +
        '<svg class="gi" aria-hidden="true"><use href="#gi-campfire"/></svg>Camp</button><button type="button" title="Recentrer la carte sur la frontière des terres connues" data-map-go="' + (first || known[known.length - 1]) + '">' +
        '<svg class="gi" aria-hidden="true"><use href="#gi-compass"/></svg>Frontière</button>' +
        '<button type="button" data-map-legend aria-label="Lire la légende de la carte">Légende</button></div></header>' +
        '<svg class="carte-svg atlas-world" width="400" height="' + (bottom - top) + '" viewBox="0 ' + top + ' 400 ' + (bottom - top) + '" role="group" aria-label="Atlas des terres : camp, lieux et passages">' +
        '<defs><clipPath id="atlas-known">' + open.filter(z => !GEO[z].sky && !GEO[z].secret).map(z => '<path d="' + region(GEO[z]) + '"/>').join("") + '</clipPath>' +
        '<clipPath id="atlas-sky-known">' + open.filter(z => GEO[z].sky).map(z => '<path data-sky-band="' + z + '" d="' + region(GEO[z]) + '"/>').join("") + '</clipPath>' +
        '<mask id="atlas-closed" maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="2600"><rect width="400" height="2600" fill="white"/>' +
        open.filter(z => !GEO[z].secret).map(z => '<path d="' + region(GEO[z]) + '" fill="black"/>').join("") + '</mask>' +
        '<pattern id="atlas-clouds" width="400" height="300" patternUnits="userSpaceOnUse"><image href="assets/atlas/brume-v1.webp" width="400" height="300" preserveAspectRatio="none"/></pattern>' +
        '<pattern id="atlas-clouds-back" width="480" height="360" patternUnits="userSpaceOnUse" patternTransform="translate(120 85)"><image href="assets/atlas/brume-v1.webp" width="480" height="360" preserveAspectRatio="none"/></pattern>' +
        '<filter id="atlas-mist-warp" x="-10%" y="-15%" width="120%" height="130%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency=".012 .026" numOctaves="2" seed="7" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="14" xChannelSelector="R" yChannelSelector="G"/></filter>' +
        open.filter(z => !GEO[z].secret && GEO[z].top > 0).map(z => {
          const y = GEO[z].top;
          return '<linearGradient id="atlas-mist-fade-' + z + '" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="' + (y - 168) + '" y2="' + (y + 72) + '"><stop stop-color="white" stop-opacity="0"/><stop offset=".3" stop-color="white" stop-opacity=".65"/><stop offset=".58" stop-color="white"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient><mask id="atlas-mist-' + z + '" maskUnits="userSpaceOnUse" x="0" y="' + (y - 168) + '" width="400" height="240"><rect y="' + (y - 168) + '" width="400" height="240" fill="url(#atlas-mist-fade-' + z + ')"/></mask>';
        }).join('') +
        '<linearGradient id="atlas-paper" x2="0" y2="1"><stop stop-color="#e8e7de"/><stop offset="1" stop-color="#f2ecdc"/></linearGradient>' +
        '<linearGradient id="atlas-night" x1="0" x2="0" y1="0" y2="1100" gradientUnits="userSpaceOnUse"><stop stop-color="#101e2c"/><stop offset=".87" stop-color="#193341"/><stop offset="1" stop-color="#e8e7de"/></linearGradient>' +
        '<linearGradient id="atlas-reveal-fade" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="' + (north - 12) + '" y2="' + (north + 48) + '"><stop stop-color="black"/><stop offset="1" stop-color="white"/></linearGradient>' +
        '<mask id="atlas-soft-edge"><rect width="400" height="2600" fill="url(#atlas-reveal-fade)"/></mask></defs>' +
        '<rect class="a-paper" x="0" y="0" width="400" height="' + bottom + '" fill="url(#atlas-paper)"/>' +
        '<rect width="400" height="1100" fill="url(#atlas-night)" aria-hidden="true"/>' +
        '<image class="a-landscape" href="assets/atlas/monde-vivant-v1.webp" x="0" y="1100" width="400" height="1500" preserveAspectRatio="none" clip-path="url(#atlas-known)" mask="url(#atlas-soft-edge)" aria-hidden="true"/>' +
        (open.some(z => GEO[z].sky) ? '<image class="a-celestial-art" href="assets/atlas/feuillet-celeste-v1.webp" x="0" y="0" width="400" height="1100" preserveAspectRatio="none" clip-path="url(#atlas-sky-known)" aria-hidden="true"/>' : '') + fog(open);
      // La brume est opaque en territoire fermé. Les contours sont un dessin
      // anonyme, pas une version translucide des lieux encore inaccessibles.
      if (first) {
        const g = GEO[first], y = g.bottom - 105;
        const words = HINT[first] || "une terre inconnue";
        s += button('data-cf="' + first + '"', words + " : découvrir ce qui ouvre le passage",
          '<rect class="a-frontier-hit" x="28" y="' + (y - 27) + '" width="300" height="60" rx="8"/>' +
          '<text class="a-hint" x="178" y="' + (y + 9) + '">' + esc(words) + '</text>', "a-frontier" + (g.sky ? " a-celestial-node" : ""));
      }
      open.forEach(z => {
        const g = GEO[z];
        if (g.secret) s += '<g class="a-underground" aria-hidden="true"><rect x="12" y="2630" width="376" height="280" rx="8"/><text x="200" y="2620">Sous les terres</text></g>';
        s += name(z);
        (E.ZONES[z].exps || []).forEach((_, k) => { s += place(z, k); });
      });
      s += button('data-camp', "Ton camp : ouvrir le Domaine",
        '<circle class="a-hit" cx="204" cy="2500" r="29"/><circle class="a-camp-pin" cx="204" cy="2500" r="17"/>' +
        use("campfire", 204, 2500, 21) + '<text class="a-place-name" x="231" y="2506">Camp</text>', "a-camp");
      E.passPending().forEach(z => { s += passage(z); });
      s += '<g class="a-north' + (top < SKY_BOTTOM ? ' a-north-space' : '') + '" aria-hidden="true" transform="translate(367 ' + (top + 42) + ')"><text y="-14">N</text><path d="M0 -5 l-5 23 5 -5 5 5Z"/></g>';
      return s + '</svg></div>';
    }
    function focusY(z) {
      const { open, top, bottom } = layout(), g = GEO[z] || GEO[open[open.length - 1]] || GEO.lisiere;
      return Math.max(0, Math.min(1, (g.y - top) / (bottom - top)));
    }
    return { view, focusY, GEO };
  }
  window.EclatAtlas = { create, enabled, isVivant };
})();
