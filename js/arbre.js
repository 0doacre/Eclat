/* ÉCLAT — l’arbre des connaissances (Carnet, vue « Arbre »).
 * Module sans état, sur le modèle de js/constellations.js :
 *   graphe(E, D)          ce qui se voit, et rien d’autre (la seule fonction qui en décide) ;
 *   mise_en_page(g, D)    des positions déterministes, sans DOM ;
 *   rendu(lay, o)         le code HTML (SVG pour le fond et les traits, boutons pour les nœuds).
 * Un fantôme (recette pas encore trouvée) n’a ni nom, ni icône, ni identifiant d’objet :
 * seulement un numéro d’ordre, son âge, et le trait pointillé qui y mène.
 * Fantômes montrés : celui de l’objectif en cours, et ceux des ressources étudiées. */
(function (root) {
  "use strict";

  const COLS = 5;            // colonnes d’une bande d’âge (tient en largeur sur un téléphone)
  const PX = 66, PY = 84;    // pas horizontal et vertical d’une case
  const NODE = 48;           // côté d’un nœud (≥ 44 px au zoom normal)
  const M = 8;               // marge à gauche et à droite
  const HEAD = 30;           // hauteur de l’étiquette d’âge en haut de chaque bande

  /* FNV-1a, 32 bits (comme constellations.js) */
  function hash(s) {
    let h = 2166136261;
    s = String(s);
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h >>> 0;
  }
  const unit = (s) => hash(s) / 4294967296;
  const RARE = { curio: 1, relic: 1 };

  /* ------------------------------------------------------------ le catalogue
   * Une place fixe pour chaque objet du jeu, calculée sur les données seules :
   * un nœud ne bouge jamais quand un autre apparaît. Dans une bande, les objets qui
   * dépendent d’un autre du même âge montent d’un cran ; dans un cran, l’ordre des
   * colonnes suit la moyenne des colonnes des ingrédients (moins de croisements). */
  const CACHE = typeof WeakMap !== "undefined" ? new WeakMap() : null;
  function catalogue(D) {
    if (CACHE && CACHE.has(D)) return CACHE.get(D);
    const I = D.ITEMS, nA = D.AGES.length;
    const place = {}, col = {}, rows = [];
    const parAge = [];
    for (const id in I) { if (I[id].path) continue; const a = I[id].a || 0; (parAge[a] = parAge[a] || []).push(id); }
    const depth = {};
    function prof(id, a, pile) {
      if (depth[id] !== undefined) return depth[id];
      const it = I[id];
      let d = 0;
      if (it.r && !pile[id]) {
        pile[id] = 1;
        for (const g in it.r[1]) if (I[g] && (I[g].a || 0) === a && !I[g].path && g !== id) d = Math.max(d, 1 + prof(g, a, pile));
        delete pile[id];
      }
      return (depth[id] = Math.min(d, 6));
    }
    for (let a = 0; a < nA; a++) {
      const ids = (parAge[a] || []).slice();
      ids.forEach((id) => prof(id, a, {}));
      const occ = {};
      let haut = 0;
      for (let d = 0; d <= 6; d++) {
        const lv = ids.filter((id) => depth[id] === d);
        if (!lv.length) continue;
        const bary = {};
        lv.forEach((id) => {
          const it = I[id], xs = [];
          if (it.r) for (const g in it.r[1]) if (col[g] !== undefined) xs.push(col[g]);
          bary[id] = xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : unit(id) * (COLS - 1);
        });
        lv.sort((x, y) => bary[x] - bary[y] || hash(x) - hash(y));
        const n = lv.length;
        let prev = -1;
        lv.forEach((id, i) => {
          let c;
          if (n >= COLS) c = Math.floor(i * COLS / n);
          else { c = Math.max(prev + 1, Math.min(COLS - (n - i), Math.round(bary[id]))); prev = c; }
          // au-dessus de ses ingrédients du même âge, au plus bas dans sa colonne
          let r = 0;
          const it = I[id];
          if (it.r) for (const g in it.r[1]) if (place[g] && place[g].a === a) r = Math.max(r, place[g].row + 1);
          while (occ[c + ":" + r]) r++;
          occ[c + ":" + r] = 1;
          haut = Math.max(haut, r + 1);
          place[id] = { a, row: r, col: c };
          col[id] = c;
        });
      }
      rows[a] = haut + 1; // une rangée de plus, pour les fantômes
    }
    // la hauteur de chaque bande ne dépend que des données : rien ne bouge en cours de partie
    const y = [];
    let acc = 0;
    for (let a = nA - 1; a >= 0; a--) { y[a] = acc; acc += HEAD + (rows[a] || 1) * PY; }
    const out = { place, rows, y, h: acc };
    if (CACHE) CACHE.set(D, out);
    return out;
  }
  /* index : recettes par ingrédient (sur les données seules) */
  const USES = typeof WeakMap !== "undefined" ? new WeakMap() : null;
  function usages(D) {
    if (USES && USES.has(D)) return USES.get(D);
    const u = {};
    for (const id in D.ITEMS) { const it = D.ITEMS[id]; if (it.r) for (const g in it.r[1]) (u[g] = u[g] || []).push(id); }
    if (USES) USES.set(D, u);
    return u;
  }
  const mainIngredient = (it) => { const ing = it.r[1]; return Object.keys(ing).sort((a, b) => ing[b] - ing[a])[0]; };

  /* ------------------------------------------------------------ ce qui se voit */
  function graphe(E, D) {
    const S = E.state, I = D.ITEMS;
    const maxA = Math.min((S.age || 0) + 1, D.AGES.length - 1);
    const dansLesAges = (id) => (I[id].a || 0) <= maxA;
    const noeuds = [], traits = [], par = {};
    const ajoute = (n) => { par[n.cle] = n; noeuds.push(n); return n; };
    // les recettes trouvées
    for (const id in S.known) {
      const it = I[id];
      if (!it || !it.r || it.path || !dansLesAges(id)) continue;
      ajoute({ cle: id, etat: "allume", id, n: it.n, age: it.a || 0 });
    }
    // les ressources déjà vues (matières brutes, ou objets reçus sans en connaître la recette)
    for (const id in S.seen) {
      const it = I[id];
      if (!it || par[id] || it.path || it.sec || RARE[it.t] || !dansLesAges(id)) continue;
      ajoute({ cle: id, etat: "vu", id, n: it.n, age: it.a || 0 });
    }
    // les traits pleins : une recette trouvée vers ses ingrédients visibles
    noeuds.slice().forEach((n) => {
      const it = I[n.id];
      if (n.etat !== "allume") return;
      for (const g in it.r[1]) if (par[g] && g !== n.id) traits.push({ de: g, a: n.cle });
    });
    let serie = 0;
    const fantome = (age, objectif) => ajoute({ cle: "f" + (++serie), etat: "fantome", age, objectif: !!objectif });
    const cachee = (id) => { const it = I[id]; return !it || !it.r || it.path || it.sec || RARE[it.t] || !dansLesAges(id) || (E.ageOK && !E.ageOK(id)); };
    // l’objectif en cours
    const g = E.guide && E.guide();
    if (g && g.ob && g.ob.k === "craft" && g.step && I[g.step]) {
      const id = g.step;
      if (par[id]) par[id].objectif = true;
      else if (!S.known[id] && !cachee(id)) {
        const f = fantome(I[id].a || 0, true);
        // un trait seulement si un indice a déjà dit d’où part la recette
        if ((S.hints[id] || 0) >= 2) { const m = mainIngredient(I[id]); if (par[m]) traits.push({ de: m, a: f.cle, pointille: true }); }
      }
    }
    // les ressources étudiées : autant de fantômes que de recettes qu’elles cachent encore
    const U = usages(D);
    const etudiees = Object.keys(S.studied || {}).filter((id) => par[id] && par[id].etat !== "fantome").sort((x, y) => hash(x) - hash(y) || (x < y ? -1 : 1));
    for (const x of etudiees) {
      const liste = (U[x] || []).filter((r) => {
        const it = I[r];
        if (S.known[r] || cachee(r)) return false;
        if (E.gesteOK && !E.gesteOK(it.r[0])) return false;
        return Object.keys(it.r[1]).every((i) => S.seen[i]);
      }).sort((p, q) => hash(p + "|" + x) - hash(q + "|" + x));
      par[x].etude = liste.length;
      liste.forEach((r) => { const f = fantome(I[r].a || 0, false); traits.push({ de: x, a: f.cle, pointille: true }); });
    }
    const compte = Object.keys(S.known).filter((id) => I[id] && I[id].r && !I[id].sec).length;
    const dernier = Object.keys(S.known).filter((id) => par[id]).pop() || null;
    return { age: S.age || 0, max: maxA, noeuds, traits, compte, dernier };
  }
  /* une empreinte : on ne redessine que si elle change */
  function sig(g) {
    return g.age + "|" + g.compte + "|" + g.noeuds.map((n) => n.cle + (n.etat[0]) + (n.objectif ? "!" : "") + (n.etude || "") + ":" + n.age).join(",") + "|" + g.traits.length;
  }

  /* ------------------------------------------------------------ les positions */
  function mise_en_page(g, D) {
    const cat = catalogue(D), nA = D.AGES.length;
    const Rof = (a) => cat.rows[a] || 1;
    const yBande = (a) => cat.y[a];                       // l’Âge du Bois en bas, l’Âge Stellaire en haut
    const cx = (c) => M + c * PX + PX / 2;
    const cy = (a, r) => yBande(a) + HEAD + (Rof(a) - 1 - r) * PY + NODE / 2 + 6;
    const pris = {}, pos = {};
    let maxCol = COLS - 1;
    const out = [];
    g.noeuds.forEach((n) => {
      if (n.etat === "fantome") return;
      const p = cat.place[n.id];
      if (!p) return;
      pris[p.a + ":" + p.row + ":" + p.col] = 1;
      pos[n.cle] = { x: cx(p.col), y: cy(p.a, p.row) };
    });
    // les fantômes : la case libre la plus proche de la ressource d’où part leur trait
    const source = {};
    g.traits.forEach((t) => { if (t.pointille && source[t.a] === undefined) source[t.a] = t.de; });
    const parBande = {};
    g.noeuds.forEach((n) => { if (n.etat === "fantome") parBande[n.age] = (parBande[n.age] || 0) + 1; });
    g.noeuds.forEach((n) => {
      if (n.etat !== "fantome") return;
      const a = n.age, s = pos[source[n.cle]];
      const tx = s ? s.x : cx((COLS - 1) / 2), ty = s ? s.y : cy(a, 0);
      const R = Rof(a), extra = Math.ceil((parBande[a] || 0) / R);
      let best = null, bd = Infinity;
      for (let c = 0; c < COLS + extra; c++) for (let r = 0; r < R; r++) {
        if (pris[a + ":" + r + ":" + c]) continue;
        const d = Math.hypot(cx(c) - tx, cy(a, r) - ty) + (c >= COLS ? 4 * PX : 0);
        if (d < bd - 1e-6) { bd = d; best = [r, c]; }
      }
      pris[a + ":" + best[0] + ":" + best[1]] = 1;
      maxCol = Math.max(maxCol, best[1]);
      pos[n.cle] = { x: cx(best[1]), y: cy(a, best[0]) };
    });
    g.noeuds.forEach((n) => { if (pos[n.cle]) out.push(Object.assign({}, n, pos[n.cle], { w: NODE, h: NODE })); });
    const traits = g.traits.filter((t) => pos[t.de] && pos[t.a]).map((t) => {
      const p = pos[t.de], q = pos[t.a];
      const haut = q.y < p.y;
      return { de: t.de, a: t.a, pointille: !!t.pointille,
        x1: p.x, y1: p.y + (haut ? -NODE / 2 : NODE / 2 + 18), x2: q.x, y2: q.y + (haut ? NODE / 2 + 18 : -NODE / 2) };
    });
    const bandes = D.AGES.map((ag, a) => ({ age: a, y: yBande(a), h: HEAD + Rof(a) * PY, c: ag.c, nom: ag.n,
      etat: a <= g.age ? "atteint" : a <= g.max ? "suivant" : "futur" }));
    return { w: 2 * M + (maxCol + 1) * PX, h: cat.h, noeuds: out, traits, bandes, node: NODE };
  }

  /* le point où la vue s’ouvre : l’objectif, sinon la dernière découverte */
  function centre(lay, g) {
    const obj = lay.noeuds.find((n) => n.objectif);
    const der = g && g.dernier && lay.noeuds.find((n) => n.cle === g.dernier);
    const n = obj || der || lay.noeuds[0];
    return n ? { x: n.x, y: n.y } : { x: lay.w / 2, y: lay.h - 100 };
  }

  /* ------------------------------------------------------------ le rendu */
  function rendu(lay, o) {
    const esc = o.esc || ((s) => String(s));
    const txt = o.txt || {};
    const r1 = (v) => Math.round(v * 10) / 10;
    let h = '<div class="arb-monde" style="width:' + lay.w + "px;height:" + lay.h + 'px">';
    h += '<svg class="arb-fond" width="' + lay.w + '" height="' + lay.h + '" viewBox="0 0 ' + lay.w + " " + lay.h + '" aria-hidden="true">';
    lay.bandes.forEach((b) => {
      h += '<rect class="arb-bande ' + b.etat + '" x="0" y="' + b.y + '" width="' + lay.w + '" height="' + b.h + '" style="--ac:' + esc(b.c) + '"/>';
      h += '<line class="arb-sep" x1="0" y1="' + b.y + '" x2="' + lay.w + '" y2="' + b.y + '"/>';
    });
    lay.traits.forEach((t) => {
      const my = r1((t.y1 + t.y2) / 2);
      h += '<path class="arb-t' + (t.pointille ? " pointille" : "") + (o.neuf && t.a === o.neuf ? " neuf" : "") + '" d="M' + r1(t.x1) + " " + r1(t.y1) + " C" + r1(t.x1) + " " + my + " " + r1(t.x2) + " " + my + " " + r1(t.x2) + " " + r1(t.y2) + '"/>';
    });
    h += "</svg>";
    // les étiquettes d’âge, en HTML pour rester nettes ; rien sur un âge encore lointain
    lay.bandes.forEach((b) => {
      const nom = (b.age + 1) + (b.etat === "futur" ? "" : " · " + esc(b.nom));
      h += '<div class="arb-age ' + b.etat + '" style="top:' + (b.y + 6) + "px;--ac:" + esc(b.c) + '">' + nom + "</div>";
      h += '<div class="arb-age bas ' + b.etat + '" style="top:' + (b.y + b.h - 20) + "px;--ac:" + esc(b.c) + '" aria-hidden="true">' + nom + "</div>";
    });
    lay.noeuds.forEach((n) => {
      const st = "left:" + (n.x - n.w / 2) + "px;top:" + (n.y - n.h / 2) + "px;--ac:" + esc(lay.bandes[n.age].c);
      if (n.etat === "fantome") {
        h += '<button type="button" class="arb-n fantome' + (n.objectif ? " obj" : "") + '" data-fantome="' + n.cle + '" style="' + st + '" aria-label="' + esc(txt.fantome || "") + '"></button>';
        return;
      }
      h += '<button type="button" class="arb-n ' + n.etat + (n.objectif ? " obj" : "") + (o.neuf === n.cle ? " neuf" : "") + '" data-goto="' + esc(n.id) + '" style="' + st + '" aria-label="' + esc(n.n) + '">' +
        (o.icon ? o.icon(n.id) : "") + '<span class="arb-l">' + esc(n.n) + "</span>" + (n.etude ? '<span class="arb-e">✦ ' + n.etude + "</span>" : "") + "</button>";
    });
    return h + "</div>";
  }

  const Arbre = { graphe, mise_en_page, rendu, centre, sig, catalogue, hash, NODE, COLS, PX, PY };
  if (typeof module !== "undefined" && module.exports) module.exports = Arbre;
  root.EclatArbre = Arbre;
})(typeof globalThis !== "undefined" ? globalThis : this);
