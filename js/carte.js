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
  const SPOTS = [[-0.55, -0.35], [0.5, -0.4], [0.05, 0.42], [-0.2, 0.05]];
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
      const top = Math.min.apply(null, seen.map((z) => GEO[z].y - GEO[z].ry - 60));
      let s = '<div class="carte"><svg class="carte-svg" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Carte du monde">' +
        "<defs>" +
        '<pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><line x1="0" y1="0" x2="0" y2="7" class="c-hatch"/></pattern>' +
        '<linearGradient id="fogEdge" x1="0" y1="0" x2="0" y2="1"><stop offset="0.75" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
        '<mask id="fogMask"><rect x="0" y="0" width="' + W + '" height="' + Math.max(0, top + 90) + '" fill="url(#fogEdge)"/></mask>' +
        "</defs>";
      // le ciel commence au-dessus des montagnes : quelques étoiles
      s += '<g class="c-stars">' + Array.from({ length: 46 }, (_, i) => { const x = (i * 97.3) % W, y = (i * 53.7) % 560; return '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (i % 3 ? 0.9 : 1.5) + '"/>'; }).join("") + "</g>";
      s += '<path class="c-horizon" d="M0 560 Q 100 548 200 556 T 400 552"/>';
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
      s += "</svg></div>";
      return s;
    }
    function road(a, b) {
      const A = GEO[a], B = GEO[b], mx = (A.x + B.x) / 2 + (A.x < B.x ? -30 : 30), my = (A.y + B.y) / 2;
      return "M" + A.x + " " + (A.y - A.ry * 0.5) + " Q" + mx + " " + my + " " + B.x + " " + (B.y + B.ry * 0.5);
    }
    function zoneArt(z) {
      const g = GEO[z], Z = E.ZONES[z], i = D.ZONES.indexOf(Z);
      if (!g) return "";
      let s = '<g class="c-zone" data-cz="' + z + '">';
      if (g.sky === "disc") s += '<circle class="c-land" cx="' + g.x + '" cy="' + g.y + '" r="' + g.rx + '" style="--zc:' + g.c + '"/>' + craters(g, i);
      else if (g.sky === "ring") s += '<ellipse class="c-ring" cx="' + g.x + '" cy="' + g.y + '" rx="' + g.rx + '" ry="' + g.ry + '"/><circle class="c-land" cx="' + (g.x - g.rx * 0.9) + '" cy="' + (g.y + 30) + '" r="70" style="--zc:#9fc1d9"/>';
      else s += '<path class="c-land" d="' + blob(g, i + 1) + '" style="--zc:' + g.c + '"/>';
      if (z === "riviere") s += '<path class="c-river" d="M' + (g.x - g.rx * 1.05) + " " + (g.y + 10) + " C " + (g.x - 40) + " " + (g.y - 40) + ", " + (g.x + 30) + " " + (g.y + 50) + ", " + (g.x + g.rx * 1.05) + " " + (g.y - 6) + '"/>';
      const n = DECO[z] || 0, dz = GI.zones[z];
      for (let k = 0; k < n; k++) {
        const a = (k / Math.max(1, n)) * Math.PI * 2 + i, r = 0.5 + 0.2 * ((k * 37) % 3) / 2;
        s += use(dz, g.x + Math.cos(a) * g.rx * r, g.y + Math.sin(a) * g.ry * r * 0.8, 16 + (k % 2) * 6, "c-deco");
      }
      s += '<text class="c-name" x="' + g.x + '" y="' + (g.y - g.ry - 10) + '">' + esc(Z.n) + "</text>";
      if (z === "lisiere") s += '<g class="c-camp" data-camp>' + use(GI.items.feu || "campfire", g.x + 4, g.y + 26, 26) + '<text class="c-small" x="' + (g.x + 4) + '" y="' + (g.y + 52) + '">ton camp</text></g>';
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
      return '<g class="c-lieu ' + stt + '" data-cl="' + z + ":" + k + '"><circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="16"/>' + use(ic, x, y, 20) +
        (stt === "done" ? '<circle class="c-tick" cx="' + (x + 12).toFixed(1) + '" cy="' + (y - 12).toFixed(1) + '" r="5"/>' : "") +
        (stt === "active" ? '<circle class="c-pulse" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="20"/>' : "") + "</g>";
    }
    function fogZone(z, first) {
      const g = GEO[z];
      if (!g) return "";
      const i = D.ZONES.findIndex((x) => x.id === z);
      const shape = g.sky === "disc" ? '<circle cx="' + g.x + '" cy="' + g.y + '" r="' + g.rx + '"' : g.sky === "ring" ? '<ellipse cx="' + g.x + '" cy="' + g.y + '" rx="' + g.rx + '" ry="' + g.ry + '"' : '<path d="' + blob(g, i + 1) + '"';
      return '<g class="c-ahead" data-cf="' + z + '">' + shape + ' class="c-mist"/>' + shape + ' class="c-mist-h" fill="url(#hatch)"/>' +
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
        '<g class="c-pass" data-cp="' + z + '"><rect x="' + (x - w / 2).toFixed(1) + '" y="' + (y - 15) + '" width="' + w.toFixed(1) + '" height="30" rx="15"/>' +
        '<text x="' + x.toFixed(1) + '" y="' + (y + 5) + '" data-cpl="' + z + '">' + label + "</text></g>";
    }

    /* ------------------------------------------------------------ fiches */
    function lieuSheet(z, i) {
      const st = S(), Z = E.ZONES[z], x = Z.exps[i], stt = lieuState(z, i);
      const hidden = x.hidden && stt !== "done" && stt !== "active";
      let h = '<div class="kicker">' + esc(Z.n) + "</div><h2>" + (hidden ? "???" : esc(x.n)) + "</h2>";
      if (stt === "done") {
        const f = x.rw && x.rw.frag && D.FRAGS[x.rw.frag];
        h += '<p class="small">Exploré.' + (f ? " Tu en as rapporté « " + esc(f.n) + " » (Journal)." : "") + "</p>";
      } else if (stt === "active") {
        const p = E.expProgress();
        h += '<p class="small">En route… <b data-xl>' + (p ? fmtTime(p.left) : "") + '</b></p><div class="bar"><i data-xp style="width:' + (p ? (p.p * 100).toFixed(1) : 0) + '%"></i></div>';
      } else if (stt === "locked") {
        const n = E.nextExp(z);
        h += '<p class="small">' + (x.hidden ? esc(x.hidden) : "Il te faut : " + esc(I[n.x.need].n) + ".") + "</p>";
      } else {
        const lack = x.cost ? Object.keys(x.cost).filter((k) => (st.inv[k] || 0) < x.cost[k]) : [];
        h += '<p class="small">' + fmtTime(x.dur / E.expMult()) + " de marche" + (x.cost ? ", et il faut " + Object.keys(x.cost).map((k) => x.cost[k] + " " + esc(I[k].n.toLowerCase())).join(", ") : "") + ".</p>";
        if (lack.length) h += '<p class="small why">Il te manque : ' + lack.map((k) => fmt(x.cost[k] - Math.floor(st.inv[k] || 0)) + " " + esc(I[k].n.toLowerCase())).join(", ") + ".</p>";
      }
      openModal({
        html: h + '<div class="acts">' + (stt === "next" ? '<button class="btn pri' + (expWhy(z) ? " nope" : "") + '" data-m="go">Explorer</button>' : "") + '<button class="btn" data-m="close">Fermer</button></div>',
        on: { go: () => { api.explore(z); } }
      });
    }
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
      if ((b = t.closest("[data-cl]"))) { const [z, i] = b.dataset.cl.split(":"); api.A.click(); lieuSheet(z, Number(i)); return true; }
      if ((b = t.closest("[data-cp]"))) { api.A.click(); passSheet(b.dataset.cp); return true; }
      if ((b = t.closest("[data-cf]"))) { api.A.click(); fogSheet(b.dataset.cf); return true; }
      if (t.closest("[data-camp]")) { api.A.click(); goDomaine("lisiere"); return true; }
      if ((b = t.closest("[data-cz]"))) { api.A.click(); goDomaine(b.dataset.cz); return true; }
      return false;
    }
    function live(root) {
      if (!root) return;
      root.querySelectorAll("[data-cpl]").forEach((el) => { const p = E.passInfo(el.dataset.cpl); if (p) el.textContent = "Passage · " + Math.floor(p.frac * 100) + " %"; });
    }
    function sig() {
      const st = S();
      return [D.ZONES.filter((z) => E.zoneOpen(z.id)).map((z) => z.id).join(), JSON.stringify(st.exp.done), st.exp.active ? st.exp.active.z + st.exp.active.i : "",
        E.passPending().map((z) => { const p = E.passInfo(z); return z + (p && p.ready ? 1 : 0); }).join(), D.ZONES.map((z) => { const n = E.nextExp(z.id); return n && n.locked ? 1 : 0; }).join("")].join("|");
    }
    /* la terre à montrer en arrivant : celle qu’on demande, sinon la dernière ouverte */
    function focusY(z) {
      const open = D.ZONES.filter((x) => E.zoneOpen(x.id)).map((x) => x.id);
      const g = GEO[z] || GEO[open[open.length - 1]] || GEO.lisiere;
      return g.y / H;
    }
    return { view, live, sig, click, focusY };
  }

  window.EclatCarte = { create };
})();
