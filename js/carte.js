/* ÉCLAT — la Carte : le monde dessiné à l’encre, qui se lit de bas en haut.
 * La Lisière en bas, l’espace tout en haut. Les terres ouvertes sont dessinées et
 * nommées ; les deux suivantes se devinent sous la brume ; le reste est hachuré.
 * On y navigue (terres, lieux à explorer, passages) ; on n’y construit rien. */
(function () {
  "use strict";

  const W = 400, H = 1900;
  /* centre, rayons et teinte de chaque terre ; `sky` : dessinée comme un astre */
  const GEO = {
    lisiere: { x: 200, y: 1780, rx: 150, ry: 78, c: "#a9c48a" },
    plaine: { x: 125, y: 1605, rx: 120, ry: 72, c: "#e6d68a" },
    riviere: { x: 268, y: 1445, rx: 122, ry: 74, c: "#a9cdd8" },
    collines: { x: 132, y: 1285, rx: 120, ry: 72, c: "#bdd0a0" },
    mine: { x: 268, y: 1125, rx: 112, ry: 68, c: "#b39d86" },
    caveau: { x: 92, y: 1095, rx: 52, ry: 40, c: "#a9c6ea" },
    desert: { x: 132, y: 965, rx: 125, ry: 72, c: "#ecd6a2" },
    gisement: { x: 270, y: 805, rx: 115, ry: 68, c: "#a39b90" },
    montagnes: { x: 140, y: 645, rx: 125, ry: 78, c: "#cfcfcf" },
    orbite: { x: 255, y: 450, rx: 120, ry: 44, c: "#c9d3e6", sky: "ring" },
    lune: { x: 130, y: 290, rx: 62, ry: 62, c: "#dcdcd4", sky: "disc" },
    mercure: { x: 272, y: 130, rx: 44, ry: 44, c: "#e6b98a", sky: "disc" }
  };
  /* ce qu’on devine d’une terre avant d’y être */
  const VAGUE = {
    plaine: "des herbes hautes, au loin", riviere: "le bruit d’une rivière", collines: "des collines, vers le nord",
    mine: "des galeries, peut-être", desert: "du sable à perte de vue", gisement: "une odeur de bitume",
    montagnes: "des pics brisés", orbite: "plus haut que le ciel", lune: "la Lune", mercure: "tout près du Soleil"
  };
  /* où poser les lieux d’une terre, autour de son centre (en fraction des rayons) */
  const SPOTS = [[-0.55, -0.35], [0.5, -0.4], [0.05, 0.42], [-0.2, 0.05], [-0.72, 0.28], [0.68, 0.2]];
  const DECO = { lisiere: 5, plaine: 4, riviere: 0, collines: 3, mine: 2, desert: 3, gisement: 2, montagnes: 3, caveau: 1 };

  function create(api) {
    const { E, D, U, esc, fmt, fmtTime, toast, openModal, passHTML, goDomaine, expWhy } = api;
    const I = D.ITEMS;
    const S = () => E.state;
    const GI = window.ECLAT_ICONS || { zones: {}, places: {}, ui: {} };
    const use = (name, x, y, s, cls) => name ? '<use href="#gi-' + name + '" x="' + (x - s / 2).toFixed(1) + '" y="' + (y - s / 2).toFixed(1) + '" width="' + s + '" height="' + s + '"' + (cls ? ' class="' + cls + '"' : "") + "/>" : "";

    /* une forme de terre : une ellipse cabossée, toujours la même pour une terre donnée */
    function blob(g, seed) {
      const n = 14, pts = [];
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2, k = 1 + 0.13 * Math.sin(seed * 7.3 + i * 2.1) + 0.07 * Math.sin(seed * 3.1 + i * 5.7);
        pts.push([g.x + Math.cos(a) * g.rx * k, g.y + Math.sin(a) * g.ry * k]);
      }
      let d = "";
      for (let i = 0; i < n; i++) {
        const p = pts[i], q = pts[(i + 1) % n], m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
        d += (i ? " Q" : "M" + ((pts[n - 1][0] + p[0]) / 2).toFixed(1) + " " + ((pts[n - 1][1] + p[1]) / 2).toFixed(1) + " Q") + p[0].toFixed(1) + " " + p[1].toFixed(1) + " " + m[0].toFixed(1) + " " + m[1].toFixed(1);
      }
      return d + " Z";
    }
    const order = () => D.ZONES.filter((z) => !z.secret).map((z) => z.id);
    function state() {
      const st = S(), open = D.ZONES.filter((z) => E.zoneOpen(z.id)).map((z) => z.id);
      const ahead = order().filter((z) => !E.zoneOpen(z)).slice(0, 2);
      return { st, open, ahead };
    }
    /* l’état d’un lieu : fait, en cours, possible, bloqué ou à venir */
    function lieuState(z, i) {
      const st = S(), done = st.exp.done[z] || 0, act = st.exp.active;
      const xc = E.ZONES[z].exps[i];
      if (xc && xc.cote) { // un lieu d’à côté : invisible tant qu’une fouille ne l’a pas ouvert
        const c = E.coteEtat(z, xc.id);
        if (act && act.z === z && act.i === i) return "active";
        if (c === 2) return "done";
        if (c !== 1) return "later";
        return xc.need && !E.hasExpReq(xc.need) ? "locked" : "next";
      }
      if (i < done) return "done";
      if (act && act.z === z && act.i === i) return "active";
      if (i > done) return "later";
      const n = E.nextExp(z);
      if (!n) return "later";
      return n.locked ? "locked" : "next";
    }

    /* ------------------------------------------------------------ dessin */
    function view() {
      const { open, ahead } = state();
      const seen = open.concat(ahead);
      const explored = open.length;
      const total = order().length;
      const top = Math.min.apply(null, seen.map((z) => GEO[z].y - GEO[z].ry - 60));
      const atlas = document.getElementById("atlasStylesheet") && !document.getElementById("atlasStylesheet").disabled;
      const crop = Math.max(0, Math.floor(top - 70));
      const mapTop = atlas ? crop : 0;
      const mapHeight = H - mapTop;
      const frontier = ahead[0] || open[open.length - 1] || "lisiere";
      let s = '<div class="carte">' + chip() + (atlas ? '<div class="atlas-map-heading"><span class="atlas-map-kicker">✧ ATLAS DES TERRES CONNUES</span><strong>Le monde se dévoile</strong><span class="atlas-map-sub">' + explored + ' terres découvertes sur ' + total + ' · Suis les sentiers vers l’inconnu</span><div class="atlas-map-actions"><button type="button" data-map-go="lisiere">⌂ Mon camp</button><button type="button" data-map-go="' + frontier + '">✧ La frontière</button></div></div>' : "") + '<svg class="carte-svg" viewBox="0 ' + mapTop + " " + W + " " + mapHeight + '" data-atlas-top="' + crop + '" role="group" aria-label="Carte du monde : les lieux, les passages et ton camp se parcourent au clavier">' +
        "<defs>" +
        '<pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><line x1="0" y1="0" x2="0" y2="7" class="c-hatch"/></pattern>' +
        '<linearGradient id="fogEdge" x1="0" y1="0" x2="0" y2="1"><stop offset="0.75" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
        '<mask id="fogMask"><rect x="0" y="0" width="' + W + '" height="' + Math.max(0, top + 90) + '" fill="url(#fogEdge)"/></mask>' +
        "</defs>";
      // le ciel commence au-dessus des montagnes : quelques étoiles
      s += '<g class="c-stars">' + Array.from({ length: 46 }, (_, i) => { const x = (i * 97.3) % W, y = (i * 53.7) % 560; return '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (i % 3 ? 0.9 : 1.5) + '"/>'; }).join("") + "</g>";
      s += '<path class="c-horizon" d="M0 560 Q 100 548 200 556 T 400 552"/>';
      if (atlas) s += landscape(seen, open) + terrain(seen, open) + compass(mapTop);
      // les chemins entre terres déjà ouvertes
      const ord = order();
      for (let i = 1; i < ord.length; i++) {
        const a = ord[i - 1], b = ord[i];
        if (E.zoneOpen(a) && E.zoneOpen(b)) s += '<path class="c-road" d="' + road(a, b) + '"/>';
      }
      ahead.forEach((z, k) => { s += fogZone(z, k === 0); });
      open.forEach((z) => { s += zoneArt(z); });
      // la brume : tout ce qui est plus haut que ce qu’on devine
      if (top > 0) s += '<rect x="0" y="0" width="' + W + '" height="' + (top + 90) + '" fill="url(#hatch)" mask="url(#fogMask)" class="c-fog"/>';
      E.passPending().forEach((z) => { s += passArt(z); });
      s += "</svg>" + (atlas ? '<div class="atlas-map-footer"><span>✦ Terre découverte</span><span>◌ Terre à explorer</span><span>⋯ Passage</span></div>' : "") + "</div>";
      return s;
    }
    /* Paysage continu entre les terres réellement découvertes. */
    function landscape(seen, open) {
      const known = new Set(open);
      const lands = seen.filter((z) => known.has(z) && GEO[z] && !GEO[z].sky);
      let h = '<g class="atlas-landscape" aria-hidden="true">';
      for (let i = 1; i < lands.length; i++) {
        const a = GEO[lands[i - 1]], b = GEO[lands[i]], m = (a.y + b.y) / 2;
        h += '<path class="atlas-valley" d="M' + (a.x - a.rx * .7) + ' ' + a.y +
          ' C' + (a.x - 80) + ' ' + m + ' ' + (b.x - 80) + ' ' + m +
          ' ' + (b.x - b.rx * .7) + ' ' + b.y + '"/>';
        h += '<path class="atlas-valley atlas-valley-outer" d="M' + (a.x + a.rx * .7) + ' ' + a.y +
          ' C' + (a.x + 80) + ' ' + m + ' ' + (b.x + 80) + ' ' + m +
          ' ' + (b.x + b.rx * .7) + ' ' + b.y + '"/>';
      }
      lands.forEach((z) => {
        const g = GEO[z];
        for (let k = 0; k < 3; k++) {
          const y = g.y + g.ry + 20 + k * 11;
          h += '<path class="atlas-contour-wide" d="M-15 ' + (y - 8) +
            ' Q80 ' + (y + 13) + ' 160 ' + (y - 7) + ' T415 ' + (y + 4) + '"/>';
        }
      });
      return h + '</g>';
    }
    /* Paysage de fond : des repères de fantasy, uniquement autour des terres
       accessibles. Le reste demeure réellement inconnu. */
    function terrain(seen, open) {
      const known = new Set(open);
      let h = '<g class="atlas-terrain" aria-hidden="true">';
      seen.forEach((z, i) => {
        if (!known.has(z)) return;
        const g = GEO[z];
        if (!g || g.sky) return;
        const x = g.x, y = g.y, rx = g.rx, ry = g.ry;
        // Une gravure topographique qui épouse le contour des terres.
        for (let k = 0; k < 4; k++) {
          const a = k * 12 + 13;
          h += '<path class="atlas-contour" d="M' + (x - rx - 12) + ' ' + (y + ry + a) +
            ' Q' + x + ' ' + (y + ry + a + 28) + ' ' + (x + rx + 12) + ' ' + (y + ry + a) + '"/>';
        }
        const left = Math.max(16, x - rx - 24), right = Math.min(382, x + rx + 18);
        if (z === "lisiere" || z === "plaine" || z === "collines") {
          // Bosquets sur les marges de la terre, jamais sur les lieux cliquables.
          for (let k = 0; k < 3; k++) {
            const tx = k % 2 ? right : left + k * 7;
            const ty = y - 35 + k * 19;
            h += '<path class="atlas-forest" d="M' + tx + ' ' + ty +
              ' l9 -16 9 16 h-5 l7 10 h-19 l7 -10 M' + (tx + 9) + ' ' + (ty + 10) + ' v9"/>';
          }
        }
        if (z === "riviere") {
          h += '<path class="atlas-water" d="M' + left + ' ' + (y - 66) +
            ' Q' + (x - 48) + ' ' + (y - 5) + ' ' + x + ' ' + (y - 62) +
            ' T' + right + ' ' + (y + 60) + '"/>';
          h += '<path class="atlas-water atlas-water-thin" d="M' + (left + 12) + ' ' + (y - 66) +
            ' Q' + (x - 35) + ' ' + (y - 5) + ' ' + (x + 12) + ' ' + (y - 62) +
            ' T' + (right + 10) + ' ' + (y + 60) + '"/>';
        }
        if (z === "collines" || z === "montagnes" || z === "mine" || z === "gisement") {
          for (let k = 0; k < 3; k++) {
            const mx = left + k * 19, my = y + 35 + k * 8;
            h += '<path class="atlas-ridge" d="M' + mx + ' ' + my +
              ' l17 -25 15 25 13 -17 14 17"/>';
          }
        }
        if (z === "desert") {
          for (let k = 0; k < 4; k++) {
            const dy = y + 30 + k * 12;
            h += '<path class="atlas-dune" d="M' + left + ' ' + dy +
              ' q22 -20 45 0 t45 0 t45 0"/>';
          }
        }
        // Petits jalons de découverte sur les sentiers du monde.
        if (i > 0 && known.has(seen[i - 1])) {
          const p = GEO[seen[i - 1]];
          if (p) h += '<circle class="atlas-waypoint" cx="' + ((p.x + x) / 2) +
            '" cy="' + ((p.y + y) / 2) + '" r="3"/>';
        }
      });
      return h + '</g>';
    }
    /* Rose des vents placée au sommet du territoire visible. */
    function compass(mapTop) {
      const y = mapTop + 46;
      return '<g class="atlas-compass" aria-hidden="true" transform="translate(354 ' + y + ')">' +
        '<circle r="24"/><circle r="18"/>' +
        '<path d="M0 -19 L5 0 0 19 -5 0Z"/>' +
        '<path class="atlas-compass-needle" d="M0 -19 L5 0 0 0Z"/>' +
        '<text x="0" y="-29">N</text></g>';
    }
    /* l’expédition longue en cours : une ligne en haut de la Carte (se touche pour recevoir ou pour voir) */
    function chip() {
      const f = E.fouilleEnCours && E.fouilleEnCours();
      if (!f) return "";
      const U_ = ((E.RECIT || {}).fouille || {}).ui || {};
      return '<button class="carte-fouille' + (f.pret ? " pret" : "") + '" data-fouille>🧭 ' + esc(U_.chip || "") + " · " + esc(f.x.n) + " · " +
        (f.pret ? esc(U_.chipPret || "") : esc(U_.chipReste || "") + ' <b data-fl>' + fmtTime(f.left) + "</b>") + "</button>";
    }
    function road(a, b) {
      const A = GEO[a], B = GEO[b], mx = (A.x + B.x) / 2 + (A.x < B.x ? -30 : 30), my = (A.y + B.y) / 2;
      return "M" + A.x + " " + (A.y - A.ry * 0.5) + " Q" + mx + " " + my + " " + B.x + " " + (B.y + B.ry * 0.5);
    }
    /* Les illustrations des terres (assets/terres/<id>-carte.webp) : taille réelle de chaque image, pour la caler dans l’ellipse de la terre */
    const ART = { lisiere: [745, 407], plaine: [715, 334], riviere: [443, 274], collines: [445, 305], mine: [417, 326], desert: [438, 299], gisement: [419, 304], montagnes: [477, 385], orbite: [272, 187], lune: [374, 275], mercure: [265, 199], caveau: [246, 185] };
    function artImage(z, g) {
      const a = ART[z];
      if (!a) return "";
      const k = Math.min((g.rx * 2 * 1.12) / a[0], (g.ry * 2 * 1.25) / a[1]), w = a[0] * k, h = a[1] * k;
      return '<image class="c-art" href="assets/terres/' + z + '-carte.webp" x="' + (g.x - w / 2).toFixed(1) + '" y="' + (g.y - h / 2).toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h.toFixed(1) + '" preserveAspectRatio="xMidYMid meet" aria-hidden="true"/>';
    }
    function zoneArt(z) {
      const g = GEO[z], Z = E.ZONES[z], i = D.ZONES.indexOf(Z);
      if (!g) return "";
      let s = '<g class="c-zone" data-cz="' + z + '">';
      if (ART[z]) s += '<ellipse class="c-hit" cx="' + g.x + '" cy="' + g.y + '" rx="' + g.rx + '" ry="' + g.ry + '"/>' + artImage(z, g);
      else if (g.sky === "disc") s += '<circle class="c-land" cx="' + g.x + '" cy="' + g.y + '" r="' + g.rx + '" style="--zc:' + g.c + '"/>' + craters(g, i);
      else if (g.sky === "ring") s += '<ellipse class="c-ring" cx="' + g.x + '" cy="' + g.y + '" rx="' + g.rx + '" ry="' + g.ry + '"/><circle class="c-land" cx="' + (g.x - g.rx * 0.9) + '" cy="' + (g.y + 30) + '" r="70" style="--zc:#9fc1d9"/>';
      else s += '<path class="c-land" d="' + blob(g, i + 1) + '" style="--zc:' + g.c + '"/>';
      if (z === "riviere" && !ART[z]) s += '<path class="c-river" d="M' + (g.x - g.rx * 1.05) + " " + (g.y + 10) + " C " + (g.x - 40) + " " + (g.y - 40) + ", " + (g.x + 30) + " " + (g.y + 50) + ", " + (g.x + g.rx * 1.05) + " " + (g.y - 6) + '"/>';
      const n = ART[z] ? 0 : DECO[z] || 0, dz = GI.zones[z];
      for (let k = 0; k < n; k++) {
        const a = (k / Math.max(1, n)) * Math.PI * 2 + i, r = 0.5 + 0.2 * ((k * 37) % 3) / 2;
        s += use(dz, g.x + Math.cos(a) * g.rx * r, g.y + Math.sin(a) * g.ry * r * 0.8, 16 + (k % 2) * 6, "c-deco");
      }
      s += '<text class="c-name" x="' + g.x + '" y="' + (g.y - g.ry - 10) + '" role="button" tabindex="0" aria-label="' + esc(Z.n) + ' : ouvrir dans le Domaine">' + esc(Z.n) + "</text>";
      if (z === "lisiere") s += '<g class="c-camp" data-camp role="button" tabindex="0" aria-label="Ton camp : ouvrir le Domaine">' + use(GI.items.feu || "campfire", g.x + 4, g.y + 26, 26) + '<text class="c-small" x="' + (g.x + 4) + '" y="' + (g.y + 52) + '">ton camp</text></g>';
      (Z.exps || []).forEach((x, k) => { s += lieuArt(z, k); });
      return s + "</g>";
    }
    function craters(g, i) {
      return [[-0.3, -0.2, 0.18], [0.35, 0.1, 0.13], [-0.05, 0.4, 0.1]].map((c, k) => '<circle class="c-crater" cx="' + (g.x + c[0] * g.rx) + '" cy="' + (g.y + c[1] * g.ry) + '" r="' + (c[2] * g.rx * (1 + ((i + k) % 2) * 0.2)).toFixed(1) + '"/>').join("");
    }
    function lieuArt(z, k) {
      const g = GEO[z], sp = SPOTS[k % SPOTS.length], x = g.x + sp[0] * g.rx, y = g.y + sp[1] * g.ry;
      const stt = lieuState(z, k), x0 = E.ZONES[z].exps[k];
      if (stt === "later") return "";
      const ic = stt === "locked" ? GI.ui.verrou : GI.places[x0.id] || GI.ui.exploration;
      const ETAT = { done: "exploré", active: "en cours", next: "à explorer", locked: "verrouillé" };
      const nom = x0.hidden && stt !== "done" && stt !== "active" ? "lieu caché" : x0.n;
      return '<g class="c-lieu ' + stt + '" data-cl="' + z + ":" + k + '" role="button" tabindex="0" aria-label="' + esc(E.ZONES[z].n + " : " + nom + ", " + (ETAT[stt] || "")) + '"><circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="16"/>' + use(ic, x, y, 20) +
        (stt === "done" ? '<circle class="c-tick" cx="' + (x + 12).toFixed(1) + '" cy="' + (y - 12).toFixed(1) + '" r="5"/>' : "") +
        (stt === "active" ? '<circle class="c-pulse" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="20"/>' : "") + "</g>";
    }
    function fogZone(z, first) {
      const g = GEO[z];
      if (!g) return "";
      const i = D.ZONES.findIndex((x) => x.id === z);
      const shape = g.sky === "disc" ? '<circle cx="' + g.x + '" cy="' + g.y + '" r="' + g.rx + '"' : g.sky === "ring" ? '<ellipse cx="' + g.x + '" cy="' + g.y + '" rx="' + g.rx + '" ry="' + g.ry + '"' : '<path d="' + blob(g, i + 1) + '"';
      return '<g class="c-ahead" data-cf="' + z + '" role="button" tabindex="0" aria-label="' + esc(first ? VAGUE[z] || "Une terre inconnue" : "Une terre inconnue") + '">' + shape + ' class="c-mist"/>' + shape + ' class="c-mist-h" fill="url(#hatch)"/>' +
        (first ? '<text class="c-vague" x="' + g.x + '" y="' + g.y + '">' + esc(VAGUE[z] || "une terre inconnue") + "</text>" : "") + "</g>";
    }
    function passArt(z) {
      const p = E.passInfo(z), g = GEO[z];
      if (!p || !p.ready || !g) return "";
      const ord = order(), prev = ord[ord.indexOf(z) - 1], P = GEO[prev] || GEO.lisiere;
      const x = (P.x + g.x) / 2, y = (P.y - P.ry + g.y + g.ry) / 2;
      const label = "Passage · " + Math.floor(p.frac * 100) + " %";
      const w = 18 + label.length * 7.2;
      return '<path class="c-pathway" d="M' + P.x + " " + (P.y - P.ry * 0.6) + " L" + g.x + " " + (g.y + g.ry * 0.6) + '"/>' +
        '<g class="c-pass" data-cp="' + z + '" role="button" tabindex="0" aria-label="Passage vers ' + esc(E.ZONES[z].n) + " : " + Math.floor(p.frac * 100) + ' %"><rect x="' + (x - w / 2).toFixed(1) + '" y="' + (y - 15) + '" width="' + w.toFixed(1) + '" height="30" rx="15"/>' +
        '<text x="' + x.toFixed(1) + '" y="' + (y + 5) + '" data-cpl="' + z + '">' + label + "</text></g>";
    }

    /* ------------------------------------------------------------ fiches */
    function lieuSheet(z, i) {
      const st = S(), Z = E.ZONES[z], x = Z.exps[i], stt = lieuState(z, i);
      const hidden = x.hidden && stt !== "done" && stt !== "active";
      let h = '<div class="kicker">' + esc(Z.n) + "</div><h2>" + (hidden ? "???" : esc(x.n)) + "</h2>";
      let fouille = null;
      if (stt === "done") {
        const f = x.rw && x.rw.frag && D.FRAGS[x.rw.frag];
        h += '<p class="small">Exploré.' + (f ? " Tu en as rapporté « " + esc(f.n) + " » (Journal)." : "") + "</p>";
        fouille = fouilleHTML(z, i, x);
        h += fouille;
      } else if (stt === "active") {
        const p = E.expProgress();
        h += '<p class="small">En route… <b data-xl>' + (p ? fmtTime(p.left) : "") + '</b></p><div class="bar"><i data-xp style="width:' + (p ? (p.p * 100).toFixed(1) : 0) + '%"></i></div>';
      } else if (stt === "locked") {
        const n = E.nextExp(z);
        const reqStr = x.hidden ? x.hidden : (typeof n.x.need === "string" && I[n.x.need] ? "Il te faut : " + I[n.x.need].n + "." : Array.isArray(n.x.need) ? "Il te faut : " + n.x.need.map((id) => (I[id] ? I[id].n : id)).join(", ") + "." : "Ce lieu garde son secret pour l’instant.");
        h += '<p class="small">' + esc(reqStr) + "</p>";
      } else {
        const lack = x.cost ? Object.keys(x.cost).filter((k) => (st.inv[k] || 0) < x.cost[k]) : [];
        h += '<p class="small">' + fmtTime(x.dur / E.expMult()) + " de marche" + (x.cost ? ", et il faut " + Object.keys(x.cost).map((k) => x.cost[k] + " " + esc(I[k].n.toLowerCase())).join(", ") : "") + ".</p>";
        if (lack.length) h += '<p class="small why">Il te manque : ' + lack.map((k) => fmt(x.cost[k] - Math.floor(st.inv[k] || 0)) + " " + esc(I[k].n.toLowerCase())).join(", ") + ".</p>";
      }
      openModal({
        html: h + '<div class="acts">' + (stt === "next" ? '<button class="btn pri' + (expWhy(z) ? " nope" : "") + '" data-m="go">Explorer</button>' : "") + '<button class="btn" data-m="close">Fermer</button></div>',
        on: {
          go: () => { api.explore(z, x.cote ? x.id : undefined); },
          fouille: (b) => { api.fouiller(z, i, Number(b.dataset.lvl)); }
        }
      });
    }
    /* « Fouiller de nouveau » : les trois durées, le niveau où l’on en est, ce qu’on y a entendu */
    function fouilleHTML(z, i, x) {
      const F = ((E.RECIT || {}).fouille) || {}, U_ = F.ui || {}, N = D.FOUILLE.niveaux, niv = E.fouilleNiveau(z, x.id);
      const en = E.fouilleEnCours();
      let h = '<h3 class="sub" style="margin-top:12px">' + esc(U_.titre || "") + "</h3><p class=\"small muted\">" + esc(U_.aide || "") + "</p>";
      h += '<div class="fouille-niv">' + N.map((n, k) => {
        const lvl = k + 1, ouvert = lvl <= niv + 1, fait = lvl <= niv, occupe = !!en;
        return '<button class="btn small' + (ouvert && !occupe ? " pri" : " nope") + '" data-m="fouille" data-lvl="' + lvl + '">' + esc(n.n) + " · " + fmtDuree(n.s) + (fait ? " ✓" : "") + "</button>";
      }).join("") + "</div>";
      if (en) h += '<p class="small why">' + esc(U_.busy || "") + "</p>";
      else if (niv === 0) h += '<p class="tiny muted">' + esc(U_.avant1 || "") + "</p>";
      else if (niv === 1) h += '<p class="tiny muted">' + esc(U_.avant2 || "") + "</p>";
      const heard = E.fouillePhrases(z, x.id);
      if (heard.length) h += '<h3 class="sub" style="margin-top:10px">' + esc(U_.entendu || "") + "</h3>" + heard.map((p) => '<p class="small serif">' + esc(p.t) + "</p>").join("");
      return h;
    }
    const fmtDuree = (s) => (s >= 3600 ? Math.round(s / 3600) + " h" : Math.round(s / 60) + " min");
    function passSheet(z) {
      const html = () => '<div class="kicker">Passage</div><h2>Vers ' + esc(E.ZONES[z].n) + "</h2>" + passHTML(z) + '<div class="acts"><button class="btn" data-m="close">Fermer</button></div>';
      openModal({ html: html(), refresh: html });
    }
    function fogSheet(z) {
      const st = S(), Z = E.ZONES[z], req = I[Z.req], p = E.passInfo(z);
      const known = req && (st.known[Z.req] || req.a <= st.age + 1);
      let h = '<div class="kicker">Sous la brume</div><h2>' + (known ? esc(Z.n) : esc(VAGUE[z] || "Une terre inconnue")) + "</h2>";
      if (p && p.ready) { passSheet(z); return; }
      h += '<p class="small">' + (known ? "Pour y aller, il te faut d’abord : <b>" + esc(req.n) + "</b>." : "Un objet que tu ne connais pas encore y mène.") + "</p>";
      if (known && p) h += '<p class="small muted">Ensuite, le passage <b>' + esc(p.P.n) + "</b> : " + Object.keys(p.cost).map((i) => fmt(p.cost[i]) + " " + esc(I[i].n.toLowerCase())).join(", ") + ".</p>";
      openModal({
        html: h + '<div class="acts">' + (known ? '<button class="btn" data-m="rec">Voir la recette</button>' : "") + '<button class="btn pri" data-m="close">Fermer</button></div>',
        on: { rec: () => { setTimeout(() => api.goto(Z.req), 60); } }
      });
    }

    /* ------------------------------------------------------------ gestes */
    function click(t) {
      let b;
      if ((b = t.closest("[data-map-go]"))) {
        const g = GEO[b.dataset.mapGo], svg = document.querySelector("#v-carte .carte-svg");
        const scroller = document.getElementById("views");
        if (g && svg && scroller) {
          const box = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
          const y = box.top + (g.y - vb.y) * (box.height / vb.height);
          const viewport = scroller.getBoundingClientRect();
          const target = scroller.scrollTop + y - viewport.top - viewport.height * .52;
          scroller.scrollTo({ top: Math.max(0, target), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
        }
        return true;
      }
      if ((b = t.closest("[data-fouille]"))) {
        api.A.click();
        const f = E.fouilleEnCours();
        if (f && f.pret) api.recolter();
        else if (f) { const i = E.ZONES[f.z].exps.findIndex((e) => e.id === f.x.id); lieuSheet(f.z, i); }
        return true;
      }
      if ((b = t.closest("[data-cl]"))) { const [z, i] = b.dataset.cl.split(":"); api.A.click(); lieuSheet(z, Number(i)); return true; }
      if ((b = t.closest("[data-cp]"))) { api.A.click(); passSheet(b.dataset.cp); return true; }
      if ((b = t.closest("[data-cf]"))) { api.A.click(); fogSheet(b.dataset.cf); return true; }
      if (t.closest("[data-camp]")) { api.A.click(); goDomaine("lisiere"); return true; }
      if ((b = t.closest("[data-cz]"))) { api.A.click(); goDomaine(b.dataset.cz); return true; }
      return false;
    }
    function live(root) {
      if (!root) return;
      const fl = root.querySelector("[data-fl]"), f = E.fouilleEnCours && E.fouilleEnCours();
      if (fl && f) fl.textContent = fmtTime(f.left);
      root.querySelectorAll("[data-cpl]").forEach((el) => { const p = E.passInfo(el.dataset.cpl); if (p) el.textContent = "Passage · " + Math.floor(p.frac * 100) + " %"; });
    }
    function sig() {
      const st = S();
      const fe = E.fouilleEnCours ? E.fouilleEnCours() : null;
      return [D.ZONES.filter((z) => E.zoneOpen(z.id)).map((z) => z.id).join(), JSON.stringify(st.exp.done), st.exp.active ? st.exp.active.z + st.exp.active.i : "",
        JSON.stringify(st.meta.cotes || {}), fe ? fe.z + fe.x.id + fe.lvl + (fe.pret ? "!" : "") : "",
        E.passPending().map((z) => { const p = E.passInfo(z); return z + (p && p.ready ? 1 : 0); }).join(), D.ZONES.map((z) => { const n = E.nextExp(z.id); return n && n.locked ? 1 : 0; }).join("")].join("|");
    }
    /* la terre à montrer en arrivant : celle qu’on demande, sinon la dernière ouverte */
    function focusY(z) {
      const open = D.ZONES.filter((x) => E.zoneOpen(x.id)).map((x) => x.id);
      const g = GEO[z] || GEO[open[open.length - 1]] || GEO.lisiere;
      const atlas = document.getElementById("atlasStylesheet") && !document.getElementById("atlasStylesheet").disabled;
      if (!atlas) return g.y / H;
      const seen = open.concat(order().filter((id) => !E.zoneOpen(id)).slice(0, 2));
      const top = Math.min(...seen.map((id) => GEO[id].y - GEO[id].ry - 60));
      const crop = Math.max(0, Math.floor(top - 70));
      return Math.max(0, Math.min(1, (g.y - crop) / (H - crop)));
    }
    return { view, live, sig, click, focusY };
  }

  window.EclatCarte = { create };
})();
