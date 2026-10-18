/* ÉCLAT — les paysages des Terres.
 * Chaque zone a son décor en SVG (ciel, reliefs, sol, détails), avec le jour et
 * la nuit selon l’heure réelle. Les ressources, les extracteurs et l’exploration
 * sont posés par-dessus par l’interface (ui.js). */
(function () {
  "use strict";

  /* hasard reproductible : le même décor à chaque affichage */
  function rng(seed) {
    let s = 0;
    for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) | 0;
    return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  }
  const f1 = (v) => Math.round(v * 10) / 10;

  function grad(id, stops, vertical) {
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="' + (vertical === false ? 1 : 0) + '" y2="' + (vertical === false ? 0 : 1) + '">' +
      stops.map((s) => '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' + (s[2] !== undefined ? ' stop-opacity="' + s[2] + '"' : "") + "/>").join("") + "</linearGradient>";
  }
  /* une ligne de crêtes : points réguliers, hauteur aléatoire, lissée */
  function ridge(r, y, amp, step, color, op) {
    let d = "M0 250 L0 " + f1(y + (r() - 0.5) * amp);
    for (let x = step; x <= 400 + step; x += step) {
      const px = x - step / 2, py = y + (r() - 0.5) * amp;
      d += " Q" + f1(px) + " " + f1(py - amp * 0.3) + " " + f1(x) + " " + f1(y + (r() - 0.5) * amp);
    }
    return '<path d="' + d + ' L400 250 Z" fill="' + color + '"' + (op ? ' opacity="' + op + '"' : "") + "/>";
  }
  function peaks(r, y, amp, n, color, snow) {
    let d = "M0 250 L0 " + y, s = "";
    const w = 400 / n;
    for (let i = 0; i < n; i++) {
      const x0 = i * w, top = y - amp * (0.5 + r() * 0.5), tx = x0 + w * (0.3 + r() * 0.4);
      d += " L" + f1(tx) + " " + f1(top) + " L" + f1(x0 + w) + " " + f1(y - r() * amp * 0.2);
      if (snow) s += '<path d="M' + f1(tx) + " " + f1(top) + " L" + f1(tx - w * 0.12) + " " + f1(top + amp * 0.22) + " L" + f1(tx + w * 0.02) + " " + f1(top + amp * 0.16) + " L" + f1(tx + w * 0.13) + " " + f1(top + amp * 0.24) + ' Z" fill="' + snow + '"/>';
    }
    return '<path d="' + d + ' L400 250 Z" fill="' + color + '"/>' + s;
  }
  function trees(r, y, n, h, color) {
    let s = "";
    for (let i = 0; i < n; i++) {
      const x = r() * 420 - 10, hh = h * (0.7 + r() * 0.6), w = hh * 0.42;
      s += '<path d="M' + f1(x) + " " + f1(y - hh) + " L" + f1(x - w) + " " + f1(y) + " L" + f1(x + w) + " " + f1(y) + ' Z" fill="' + color + '"/>';
    }
    return s;
  }
  function stars(r, n, maxY) {
    let s = "";
    for (let i = 0; i < n; i++) s += '<circle class="tw" style="animation-delay:' + f1(-r() * 4) + 's" cx="' + f1(r() * 400) + '" cy="' + f1(r() * maxY) + '" r="' + f1(0.4 + r() * 1.1) + '" fill="#fff"/>';
    return s;
  }
  function tufts(r, y0, y1, n, color) {
    let s = "";
    for (let i = 0; i < n; i++) {
      const x = r() * 400, y = y0 + r() * (y1 - y0), h = 4 + r() * 6;
      s += '<path d="M' + f1(x - 3) + " " + f1(y) + " Q" + f1(x - 2) + " " + f1(y - h) + " " + f1(x - 4) + " " + f1(y - h * 1.3) + " M" + f1(x) + " " + f1(y) + " L" + f1(x + 1) + " " + f1(y - h * 1.4) + " M" + f1(x + 3) + " " + f1(y) + " Q" + f1(x + 3) + " " + f1(y - h) + " " + f1(x + 6) + " " + f1(y - h * 1.1) + '" stroke="' + color + '" stroke-width="1.2" fill="none" stroke-linecap="round"/>';
    }
    return s;
  }
  function pebbles(r, y0, y1, n, colors) {
    let s = "";
    for (let i = 0; i < n; i++) s += '<ellipse cx="' + f1(r() * 400) + '" cy="' + f1(y0 + r() * (y1 - y0)) + '" rx="' + f1(1.5 + r() * 4) + '" ry="' + f1(1 + r() * 2) + '" fill="' + colors[i % colors.length] + '"/>';
    return s;
  }

  /* moment de la journée, selon l’heure de l’appareil */
  function daypart(h) {
    if (h < 6 || h >= 21) return "night";
    if (h < 8) return "dawn";
    if (h >= 18) return "dusk";
    return "day";
  }
  const SKY = {
    day: ["#7fb2d9", "#cfe3e8"], dawn: ["#5f6f9e", "#f2b48a"], dusk: ["#4b4a7a", "#f09a6b"], night: ["#0b1026", "#26304f"]
  };

  /* le décor de chaque zone : renvoie le contenu du SVG (viewBox 400 × 250) */
  const ART = {
    lisiere(r, p) {
      return sky(p) + sun(p, 300, 46) + ridge(r, 118, 18, 50, "#4a6b52", 0.7) + trees(r, 128, 34, 46, "#2f4a35") +
        ridge(r, 140, 8, 60, "#3f5f2e") + trees(r, 150, 14, 62, "#24391f") +
        '<rect y="150" width="400" height="100" fill="url(#gr-lisiere)"/>' + tufts(r, 160, 245, 40, "#6f9a48") + pebbles(r, 165, 240, 12, ["#8d8574", "#6e695d"]);
    },
    plaine(r, p) {
      return sky(p) + sun(p, 90, 40) + ridge(r, 128, 12, 80, "#8a9a6a", 0.6) + ridge(r, 142, 6, 70, "#a39a5a") +
        '<rect y="148" width="400" height="102" fill="url(#gr-plaine)"/>' + tufts(r, 150, 245, 90, "#d8c27a") + tufts(r, 170, 245, 50, "#b49a52");
    },
    riviere(r, p) {
      return sky(p) + sun(p, 320, 38) + ridge(r, 120, 16, 60, "#5c7a6a", 0.7) + trees(r, 132, 18, 30, "#3c5a44") +
        '<rect y="136" width="400" height="114" fill="#7a6a4c"/>' +
        '<path d="M0 168 C80 158 140 182 220 172 S340 160 400 170 L400 206 C320 214 260 196 180 206 S60 214 0 204 Z" fill="url(#wa-riviere)"/>' +
        '<g class="ripples" stroke="#d8f0ff" stroke-width="1.2" opacity=".55" fill="none"><path d="M40 182 q10 -3 20 0"/><path d="M150 190 q12 -3 24 0"/><path d="M270 180 q10 -3 20 0"/><path d="M330 194 q8 -2 16 0"/><path d="M90 198 q10 -3 20 0"/></g>' +
        pebbles(r, 140, 166, 16, ["#a08f78", "#5d554a", "#b9a98f"]) + pebbles(r, 208, 248, 18, ["#a08f78", "#5d554a", "#c3a27a"]);
    },
    collines(r, p) {
      return sky(p) + sun(p, 70, 42) + ridge(r, 110, 30, 110, "#6b8f6a", 0.7) + ridge(r, 132, 26, 90, "#4f7a4a") +
        '<path d="M60 150 q30 -20 60 -6 M230 140 q40 -18 80 -2 M150 170 q20 -10 50 -2" stroke="#2f8f5b" stroke-width="3" fill="none" opacity=".7"/>' +
        ridge(r, 156, 14, 70, "#5f7f3f") + '<rect y="165" width="400" height="85" fill="url(#gr-collines)"/>' +
        tufts(r, 168, 245, 30, "#86a85a") + pebbles(r, 170, 245, 14, ["#7d7f86", "#5c5e66"]);
    },
    mine(r) {
      let st = "";
      for (let i = 0; i < 16; i++) { const x = r() * 400, h = 10 + r() * 34, w = 4 + r() * 8; st += '<path d="M' + f1(x - w) + " 0 L" + f1(x) + " " + f1(h) + " L" + f1(x + w) + ' 0 Z" fill="#1c1612"/>'; }
      for (let i = 0; i < 10; i++) { const x = r() * 400, h = 8 + r() * 22, w = 5 + r() * 8, y = 170 + r() * 10; st += '<path d="M' + f1(x - w) + " " + f1(y) + " L" + f1(x) + " " + f1(y - h) + " L" + f1(x + w) + " " + f1(y) + ' Z" fill="#2a211b"/>'; }
      return '<rect width="400" height="250" fill="url(#sk-mine)"/>' + '<ellipse cx="200" cy="120" rx="180" ry="90" fill="#5a3a22" opacity=".35"/>' +
        '<path class="glow" d="M40 90 q30 10 50 -6 t60 8 M260 70 q24 14 60 4 M300 130 q20 -8 46 6" stroke="#ff9a4a" stroke-width="2.4" fill="none" opacity=".75"/>' +
        st + '<rect y="172" width="400" height="78" fill="#241c17"/>' + pebbles(r, 178, 246, 20, ["#3d332b", "#4a3d33"]);
    },
    desert(r, p) {
      let g = "";
      for (let i = 0; i < 14; i++) { const x = r() * 400, y = 160 + r() * 80, s = 3 + r() * 6; g += '<path class="glint" style="animation-delay:' + f1(-r() * 5) + 's" d="M' + f1(x) + " " + f1(y - s) + " L" + f1(x + s * 0.5) + " " + f1(y) + " L" + f1(x) + " " + f1(y + s * 0.4) + " L" + f1(x - s * 0.6) + " " + f1(y) + ' Z" fill="#cfefff" opacity=".8"/>'; }
      return sky(p, ["#e9b07a", "#f6dcb0"]) + sun(p, 330, 50, "#fff3c4") +
        '<g fill="#a88a5a" opacity=".55"><rect x="60" y="112" width="10" height="26"/><rect x="74" y="104" width="8" height="34"/><rect x="250" y="116" width="14" height="22"/><rect x="268" y="110" width="6" height="28"/></g>' +
        ridge(r, 136, 14, 100, "#d9a96a") + ridge(r, 160, 18, 130, "#e7bd7f") + '<rect y="190" width="400" height="60" fill="#e9c48a"/>' + g;
    },
    gisement(r, p) {
      const der = (x, h) => '<g stroke="#15121a" stroke-width="2" fill="none"><path d="M' + x + " 140 L" + (x + 8) + " " + (140 - h) + " L" + (x + 16) + ' 140"/><path d="M' + (x + 2) + " " + (140 - h * 0.35) + " L" + (x + 14) + " " + (140 - h * 0.35) + " M" + (x + 4) + " " + (140 - h * 0.65) + " L" + (x + 12) + " " + (140 - h * 0.65) + '"/></g>';
      return sky(p, ["#5a5468", "#a39a9a"]) + ridge(r, 128, 10, 90, "#4a4450", 0.8) + der(70, 46) + der(300, 58) + der(350, 34) +
        '<path class="flame" d="M308 82 q4 -12 0 -20 q8 8 4 20 Z" fill="#ff9b3d"/>' +
        '<rect y="140" width="400" height="110" fill="#3b3433"/>' +
        '<ellipse cx="120" cy="190" rx="70" ry="14" fill="#0b0909"/><ellipse cx="300" cy="215" rx="60" ry="11" fill="#0b0909"/><ellipse cx="120" cy="186" rx="40" ry="3" fill="#7d6aa0" opacity=".4"/>' +
        pebbles(r, 150, 245, 12, ["#2a2424", "#4c4343"]);
    },
    montagnes(r, p) {
      return sky(p, ["#8fa9c8", "#dfe7ee"]) + sun(p, 80, 34) + peaks(r, 150, 110, 5, "#6c7686", "#eef3f8") + peaks(r, 170, 70, 7, "#4f5866", "#dfe6ee") +
        '<path d="M120 120 l14 22 l-8 10 l16 20 M260 110 l-10 20 l12 12 l-6 24" stroke="#2a2f38" stroke-width="1.6" fill="none"/>' +
        '<rect y="178" width="400" height="72" fill="#5a5f66"/>' + pebbles(r, 182, 246, 18, ["#8a8f96", "#41454b", "#9c6a4a"]);
    },
    orbite(r) {
      return '<rect width="400" height="250" fill="#04050c"/>' + stars(r, 90, 250) +
        '<circle cx="200" cy="560" r="400" fill="url(#ea-orbite)"/><circle cx="200" cy="560" r="404" fill="none" stroke="#8fd0ff" stroke-width="5" opacity=".35"/>' +
        '<g class="drift" fill="#8b8f99"><rect x="60" y="60" width="10" height="4" transform="rotate(20 65 62)"/><rect x="300" y="40" width="14" height="5" transform="rotate(-30 307 42)"/><circle cx="340" cy="110" r="3"/><rect x="120" y="120" width="6" height="6"/></g>';
    },
    lune(r) {
      let c = "";
      for (let i = 0; i < 9; i++) { const x = r() * 400, y = 170 + r() * 70, w = 10 + r() * 26; c += '<ellipse cx="' + f1(x) + '" cy="' + f1(y) + '" rx="' + f1(w) + '" ry="' + f1(w * 0.28) + '" fill="#6d6d72"/><ellipse cx="' + f1(x) + '" cy="' + f1(y - w * 0.05) + '" rx="' + f1(w * 0.8) + '" ry="' + f1(w * 0.2) + '" fill="#58585d"/>'; }
      return '<rect width="400" height="250" fill="#030308"/>' + stars(r, 70, 150) +
        '<circle cx="310" cy="56" r="26" fill="#2c6fb5"/><path d="M296 44 q10 -6 18 2 q-4 10 -14 8 Z M314 62 q8 0 10 8 q-8 4 -12 -2 Z" fill="#4f9a5a"/><circle cx="310" cy="56" r="26" fill="none" stroke="#bfe4ff" stroke-width="2" opacity=".5"/>' +
        ridge(r, 150, 12, 120, "#8a8a90") + '<rect y="158" width="400" height="92" fill="#9a9aa0"/>' + c;
    },
    mercure(r) {
      let cr = "";
      for (let i = 0; i < 10; i++) { const x = r() * 400, y = 175 + r() * 70; cr += '<path d="M' + f1(x) + " " + f1(y) + " l" + f1(8 + r() * 14) + " " + f1(r() * 6 - 3) + " l" + f1(6 + r() * 10) + " " + f1(r() * 8 - 4) + '" stroke="#ff7a2a" stroke-width="1.4" fill="none" opacity=".8"/>'; }
      return '<rect width="400" height="250" fill="url(#sk-mercure)"/>' + '<circle cx="200" cy="150" r="120" fill="#fff1c0" opacity=".25"/><circle cx="200" cy="150" r="78" fill="#ffe08a"/><circle cx="200" cy="150" r="60" fill="#fff6d8"/>' +
        ridge(r, 156, 12, 80, "#3a2a24") + '<rect y="165" width="400" height="85" fill="#2b1f1b"/>' + cr;
    },
    caveau(r) {
      let cv = "";
      for (let i = 0; i < 7; i++) { const x = 40 + i * 54; cv += '<rect x="' + (x - 12) + '" y="96" width="24" height="56" rx="12" fill="#1d4a6b" stroke="#7fd8ff" stroke-width="1.5" opacity="' + (i === 6 ? 1 : 0.75) + '"/><rect class="glow" x="' + (x - 7) + '" y="104" width="14" height="40" rx="7" fill="#5ac8ff" opacity=".35"/>'; }
      return '<rect width="400" height="250" fill="url(#sk-caveau)"/>' + '<ellipse cx="200" cy="90" rx="220" ry="80" fill="#3aa8ff" opacity=".12"/>' + cv +
        '<rect y="160" width="400" height="90" fill="#0c1a26"/><path d="M0 160 L400 160" stroke="#7fd8ff" stroke-width="1" opacity=".5"/>' + pebbles(r, 168, 246, 10, ["#16324a", "#1f4560"]);
    }
  };
  function sky(p, day) {
    const c = p === "day" && day ? day : SKY[p];
    return '<rect width="400" height="250" fill="url(#sky)"/>' + (p === "night" ? '<g class="stars">' + stars(rng("ciel"), 50, 120) + "</g>" : "") +
      '<defs>' + grad("sky", [[0, c[0]], [1, c[1]]]) + "</defs>";
  }
  function sun(p, x, y, col) {
    if (p === "night") return '<circle cx="' + x + '" cy="' + (y - 6) + '" r="11" fill="#f4f1e2"/><circle cx="' + (x + 5) + '" cy="' + (y - 9) + '" r="10" fill="#1a2140" opacity=".85"/>';
    const yy = p === "day" ? y : y + 40;
    return '<circle cx="' + x + '" cy="' + yy + '" r="30" fill="' + (col || "#fff2c2") + '" opacity=".25"/><circle cx="' + x + '" cy="' + yy + '" r="15" fill="' + (col || (p === "day" ? "#fff6d6" : "#ffc58a")) + '"/>';
  }
  const DEFS =
    grad("gr-lisiere", [[0, "#4b6b2e"], [1, "#2f4620"]]) + grad("gr-plaine", [[0, "#b8a35a"], [1, "#8a7a3e"]]) + grad("gr-collines", [[0, "#617f3c"], [1, "#3f5a28"]]) +
    grad("wa-riviere", [[0, "#5d93b5"], [1, "#2f5f80"]]) + grad("sk-mine", [[0, "#0d0a08"], [0.6, "#2a1d14"], [1, "#1a130f"]]) +
    grad("sk-mercure", [[0, "#1a0d08"], [0.6, "#6a2a12"], [1, "#2b140c"]]) + grad("sk-caveau", [[0, "#020a12"], [1, "#0b2236"]]) +
    '<radialGradient id="ea-orbite" cx="50%" cy="30%" r="70%"><stop offset="0" stop-color="#3d8ad0"/><stop offset=".7" stop-color="#1f4f8a"/><stop offset="1" stop-color="#0d2a4f"/></radialGradient>';

  const SPACE = { orbite: 1, lune: 1, mercure: 1, mine: 1, caveau: 1 };

  /* le SVG d’une zone, avec le moment de la journée */
  function backdrop(zid, hour) {
    const p = SPACE[zid] ? "day" : daypart(hour === undefined ? new Date().getHours() : hour);
    const art = ART[zid] || ART.lisiere;
    const night = p === "night" ? '<rect width="400" height="250" fill="#0a1030" opacity=".45"/>' : p === "dusk" ? '<rect width="400" height="250" fill="#ff7a3a" opacity=".1"/>' : "";
    const body = art(rng(zid), p).replace(/id="sky"/g, 'id="sky-' + zid + '"').replace(/url\(#sky\)/g, "url(#sky-" + zid + ")");
    return '<svg class="bd" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>' + DEFS + "</defs>" + body + night + "</svg>";
  }

  /* emplacements des ressources dans la scène (en % de la largeur et de la hauteur) */
  const SPOTS = {
    1: [[50, 74]],
    2: [[30, 76], [70, 72]],
    3: [[20, 76], [50, 70], [80, 77]]
  };
  function spots(n) { return SPOTS[n] || SPOTS[3]; }

  window.EclatScenes = { backdrop, spots, daypart, isNightless: (z) => !!SPACE[z] };
})();
