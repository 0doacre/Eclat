/* ÉCLAT — l’arbre des connaissances.
 * L’interface verticale utilise graphe() et voisinage() dans js/atelier.js.
 * Le catalogue et le rendu géométrique restent disponibles pour les comparaisons historiques.
 * Module sans état, sur le modèle de js/constellations.js :
 *   graphe(E, D)          ce qui se voit, et rien d’autre (la seule fonction qui en décide) ;
 *   mise_en_page(g, D)    des positions déterministes, sans DOM ;
 *   rendu(lay, o)         le code HTML (SVG pour le fond et les traits, boutons pour les nœuds) ;
 *   liens(lay, cle)       ce qu’un nœud touché met en lumière (ses ingrédients, ses usages).
 * Lisibilité (0.13.2) : une bande d’âge ne prend que les rangées où quelque chose se voit,
 * les âges lointains tiennent en un bandeau, et un trait qui saute plus d’un âge reste caché
 * tant qu’on ne touche pas l’un de ses deux bouts.
 * 0.14 : carrefours(D) (les objets qui servent à au moins 4 recettes : leurs noms restent écrits quand on
 * s’éloigne) et loin(g, D) (un compte de recettes trouvées par âge, pour le niveau « loin » du zoom).
 * Un fantôme (recette pas encore trouvée) n’a ni nom, ni icône, ni identifiant d’objet :
 * seulement un numéro d’ordre, son âge, et le trait pointillé qui y mène.
 * Fantômes montrés : celui de l’objectif en cours, et ceux des ressources étudiées. */
(function (root) {
  "use strict";

  const COLS = 5;            // colonnes d’une bande d’âge (tient en largeur sur un téléphone)
  const PX = 66, PY = 80;    // pas horizontal et vertical d’une case
  const NODE = 48;           // côté d’un nœud (≥ 44 px au zoom normal)
  const M = 8;               // marge à gauche et à droite
  const HEAD = 28;           // hauteur de l’étiquette d’âge en haut de chaque bande
  const PAD = 8;             // et un peu d’air en bas
  const FUTUR = 40;          // le bandeau des âges encore lointains

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
   * Une place pour chaque objet du jeu, calculée sur les données seules : la colonne d’un nœud
   * ne change jamais, et l’ordre des rangées non plus (seules les rangées vides se replient,
   * voir mise_en_page). Dans une bande, les objets qui
   * dépendent d’un autre du même âge montent d’un cran ; dans un cran, l’ordre des
   * colonnes suit la moyenne des colonnes des ingrédients (moins de croisements). */
  const CACHE = typeof WeakMap !== "undefined" ? new WeakMap() : null;
  function catalogue(D) {
    if (CACHE && CACHE.has(D)) return CACHE.get(D);
    const I = D.ITEMS, nA = D.AGES.length;
    const place = {}, col = {}, rows = [];
    const parAge = [];
    for (const id in I) { if (I[id].path || I[id].sib) continue; const a = I[id].a || 0; (parAge[a] = parAge[a] || []).push(id); }
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
      rows[a] = haut;
    }
    const out = { place, rows };
    if (CACHE) CACHE.set(D, out);
    return out;
  }
  /* index : recettes par ingrédient (sur les données seules) */
  const USES = typeof WeakMap !== "undefined" ? new WeakMap() : null;
  function usages(D) {
    if (USES && USES.has(D)) return USES.get(D);
    const u = {};
    for (const id in D.ITEMS) { const it = D.ITEMS[id]; if (it.r && !it.sib) for (const g in it.r[1]) (u[g] = u[g] || []).push(id); }
    if (USES) USES.set(D, u);
    return u;
  }
  const mainIngredient = (it) => { const ing = it.r[1]; return Object.keys(ing).sort((a, b) => ing[b] - ing[a])[0]; };

  /* les carrefours : un objet qui entre dans au moins CARREFOUR recettes. Calculé sur les données seules : il ne dépend
   * pas de la partie, donc ne dit rien de ce que la joueuse ne sait pas. */
  const CARREFOUR = 4;
  const CAR = typeof WeakMap !== "undefined" ? new WeakMap() : null;
  function carrefours(D) {
    if (CAR && CAR.has(D)) return CAR.get(D);
    const u = usages(D), out = {};
    for (const id in u) if (D.ITEMS[id] && !D.ITEMS[id].path && u[id].length >= CARREFOUR) out[id] = 1;
    if (CAR) CAR.set(D, out);
    return out;
  }
  /* le niveau « loin » : pour chaque âge à portée, du plus récent au plus ancien, son nom et le nombre de recettes
   * TROUVÉES (jamais un total, jamais ce qui reste). Ne porte ni identifiant ni nom d’objet. */
  function loin(g, D) {
    const compte = {};
    g.noeuds.forEach((n) => { if (n.etat === "allume") compte[n.age] = (compte[n.age] || 0) + 1; });
    const obj = g.noeuds.find((n) => n.objectif);
    const bandes = [];
    for (let a = g.max; a >= 0; a--) bandes.push({ age: a, nom: D.AGES[a].n, c: D.AGES[a].c, trouvees: compte[a] || 0, atteint: a <= g.age, objectif: !!obj && obj.age === a });
    return { bandes, futur: g.max < D.AGES.length - 1 ? { de: g.max + 2, a: D.AGES.length } : null };
  }

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
      if (!it || !it.r || it.path || it.sib || !dansLesAges(id)) continue;
      ajoute({ cle: id, etat: "allume", id, n: it.n, age: it.a || 0 });
    }
    // les ressources déjà vues (matières brutes, ou objets reçus sans en connaître la recette)
    for (const id in S.seen) {
      const it = I[id];
      if (!it || par[id] || it.path || it.sib || it.sec || RARE[it.t] || !dansLesAges(id)) continue;
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
    const compte = Object.keys(S.known).filter((id) => I[id] && I[id].r && !I[id].sec && !I[id].sib).length;
    const dernier = Object.keys(S.known).filter((id) => par[id]).pop() || null;
    return { age: S.age || 0, max: maxA, noeuds, traits, compte, dernier };
  }
  /* une empreinte : on ne redessine que si elle change */
  function sig(g) {
    return g.age + "|" + g.compte + "|" + g.noeuds.map((n) => n.cle + (n.etat[0]) + (n.objectif ? "!" : "") + (n.etude || "") + ":" + n.age).join(",") + "|" + g.traits.length;
  }

  /* ------------------------------------------------------------ les positions
   * Les colonnes et l’ordre des rangées viennent du catalogue ; une bande ne garde que les rangées
   * où un nœud se voit (plus ce qu’il faut pour ses fantômes). De bas en haut : l’Âge du Bois,
   * puis chaque âge jusqu’au suivant, puis un bandeau pour tous ceux qui restent loin. */
  function mise_en_page(g, D) {
    const cat = catalogue(D), nA = D.AGES.length;
    const cx = (c) => M + c * PX + PX / 2;
    // les rangées du catalogue où quelque chose se voit, dans leur ordre
    const vus = {}, fant = {};
    g.noeuds.forEach((n) => {
      if (n.etat === "fantome") { fant[n.age] = (fant[n.age] || 0) + 1; return; }
      const p = cat.place[n.id];
      if (p) (vus[p.a] = vus[p.a] || {})[p.row] = 1;
    });
    const rang = [], nR = [];
    for (let a = 0; a <= g.max; a++) {
      const lignes = Object.keys(vus[a] || {}).map(Number).sort((x, y) => x - y);
      rang[a] = {};
      lignes.forEach((r, i) => { rang[a][r] = i; });
      const libres = lignes.length * COLS - g.noeuds.filter((n) => n.etat !== "fantome" && n.age === a).length;
      nR[a] = lignes.length + Math.ceil(Math.max(0, (fant[a] || 0) - libres) / COLS);
    }
    const hBande = (a) => HEAD + nR[a] * PY + PAD + (nR[a] ? 0 : 6); // un âge où rien ne se voit encore : sa seule étiquette
    const yB = [];
    let acc = g.max < nA - 1 ? FUTUR : 0;
    for (let a = g.max; a >= 0; a--) { yB[a] = acc; acc += hBande(a); }
    const H = acc;
    const cy = (a, i) => yB[a] + HEAD + (nR[a] - 1 - i) * PY + NODE / 2 + 4;
    const pris = {}, pos = {}, ageDe = {};
    g.noeuds.forEach((n) => {
      ageDe[n.cle] = n.age;
      if (n.etat === "fantome") return;
      const p = cat.place[n.id];
      if (!p || n.age > g.max) return;
      const i = rang[p.a][p.row];
      pris[p.a + ":" + i + ":" + p.col] = 1;
      pos[n.cle] = { x: cx(p.col), y: cy(p.a, i) };
    });
    // les fantômes : la case libre la plus proche de la ressource d’où part leur trait
    const source = {};
    g.traits.forEach((t) => { if (t.pointille && source[t.a] === undefined) source[t.a] = t.de; });
    g.noeuds.forEach((n) => {
      if (n.etat !== "fantome" || n.age > g.max) return;
      const a = n.age, s = pos[source[n.cle]];
      const tx = s ? s.x : cx((COLS - 1) / 2), ty = s ? s.y : cy(a, 0);
      let best = null, bd = Infinity;
      for (let c = 0; c < COLS; c++) for (let r = 0; r < nR[a]; r++) {
        if (pris[a + ":" + r + ":" + c]) continue;
        const d = Math.hypot(cx(c) - tx, cy(a, r) - ty);
        if (d < bd - 1e-6) { bd = d; best = [r, c]; }
      }
      if (!best) return;
      pris[a + ":" + best[0] + ":" + best[1]] = 1;
      pos[n.cle] = { x: cx(best[1]), y: cy(a, best[0]) };
    });
    const out = [];
    g.noeuds.forEach((n) => { if (pos[n.cle]) out.push(Object.assign({}, n, pos[n.cle], { w: NODE, h: NODE })); });
    const obj = {};
    g.noeuds.forEach((n) => { if (n.objectif) obj[n.cle] = 1; });
    const traits = g.traits.filter((t) => pos[t.de] && pos[t.a]).map((t) => {
      const p = pos[t.de], q = pos[t.a];
      const haut = q.y < p.y;
      // un trait qui saute plus d’un âge traverserait tout l’arbre : caché tant qu’on ne touche pas l’un de ses bouts
      const loin = Math.abs(ageDe[t.a] - ageDe[t.de]) > 1 && !obj[t.a];
      return { de: t.de, a: t.a, pointille: !!t.pointille, loin,
        x1: p.x, y1: p.y + (haut ? -NODE / 2 : NODE / 2 + 18), x2: q.x, y2: q.y + (haut ? NODE / 2 + 18 : -NODE / 2) };
    });
    const bandes = [];
    for (let a = 0; a <= g.max; a++) {
      const ag = D.AGES[a];
      bandes.push({ age: a, y: yB[a], h: hBande(a), c: ag.c, nom: ag.n, etat: a <= g.age ? "atteint" : "suivant" });
    }
    const futur = g.max < nA - 1 ? { y: 0, h: FUTUR, de: g.max + 2, a: nA } : null;
    return { w: 2 * M + COLS * PX, h: H, noeuds: out, traits, bandes, futur, node: NODE };
  }

  /* ce qu’un nœud touché met en lumière : les traits qui y arrivent (ses ingrédients)
   * et ceux qui en partent (ce qu’il sert à faire, et ses fantômes) */
  function liens(lay, cle) {
    const amont = [], aval = [], traits = [];
    lay.traits.forEach((t, i) => {
      if (t.a === cle) { amont.push(t.de); traits.push(i); }
      else if (t.de === cle) { aval.push(t.a); traits.push(i); }
    });
    return { amont, aval, traits };
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
    // les bandes débordent à gauche et à droite : elles remplissent la vue, même éloignée
    const bx = -2000, bw = lay.w + 4000;
    if (lay.futur) h += '<rect class="arb-bande futur" x="' + bx + '" y="0" width="' + bw + '" height="' + lay.futur.h + '"/>';
    lay.bandes.forEach((b) => {
      h += '<rect class="arb-bande ' + b.etat + '" x="' + bx + '" y="' + b.y + '" width="' + bw + '" height="' + b.h + '" style="--ac:' + esc(b.c) + '"/>';
      h += '<line class="arb-sep" x1="' + bx + '" y1="' + b.y + '" x2="' + (bx + bw) + '" y2="' + b.y + '"/>';
    });
    // les traits lointains d’abord : allumés, ils passent sous les autres sans les cacher
    const ordre = lay.traits.map((t, i) => i).sort((x, y) => (lay.traits[y].loin ? 1 : 0) - (lay.traits[x].loin ? 1 : 0) || x - y);
    ordre.forEach((i) => {
      const t = lay.traits[i];
      const my = r1((t.y1 + t.y2) / 2);
      h += '<path class="arb-t' + (t.pointille ? " pointille" : "") + (t.loin ? " loin" : "") + (o.neuf && t.a === o.neuf ? " neuf" : "") + '" data-t="' + i + '" d="M' + r1(t.x1) + " " + r1(t.y1) + " C" + r1(t.x1) + " " + my + " " + r1(t.x2) + " " + my + " " + r1(t.x2) + " " + r1(t.y2) + '"/>';
    });
    h += "</svg>";
    // les étiquettes d’âge, en HTML pour rester nettes ; rien sur un âge encore lointain
    if (lay.futur) h += '<div class="arb-age futur" style="top:12px">' + esc(txt.futur ? txt.futur(lay.futur.de, lay.futur.a) : lay.futur.de + "–" + lay.futur.a) + "</div>";
    lay.bandes.forEach((b) => {
      h += '<div class="arb-age ' + b.etat + '" style="top:' + (b.y + 7) + "px;--ac:" + esc(b.c) + '">' + (b.age + 1) + " · " + esc(b.nom) + "</div>";
    });
    lay.noeuds.forEach((n) => {
      const st = "left:" + (n.x - n.w / 2) + "px;top:" + (n.y - n.h / 2) + "px;--ac:" + esc(lay.bandes[n.age].c);
      if (n.etat === "fantome") {
        h += '<button type="button" class="arb-n fantome' + (n.objectif ? " obj" : "") + '" data-fantome="' + n.cle + '" data-arbn="' + n.cle + '" style="' + st + '" aria-label="' + esc(txt.fantome || "") + '"></button>';
        return;
      }
      h += '<button type="button" class="arb-n ' + n.etat + (n.objectif ? " obj" : "") + (o.car && o.car[n.id] ? " car" : "") + (o.neuf === n.cle ? " neuf" : "") + '" data-arbn="' + esc(n.cle) + '" style="' + st + '" aria-label="' + esc(n.n) + '">' +
        (o.icon ? o.icon(n.id) : "") + '<span class="arb-l">' + esc(n.n) + "</span>" + (n.etude ? '<span class="arb-e">✦ ' + n.etude + "</span>" : "") + "</button>";
    });
    return h + "</div>";
  }

  /* la bande d’âge sous une hauteur du monde (pour l’étiquette qui suit la vue) */
  function bandeA(lay, y) {
    for (const b of lay.bandes) if (y >= b.y && y < b.y + b.h) return b;
    return null;
  }

  /* La vue de lecture ne reçoit que le graphe visible : elle ne peut pas révéler une recette cachée. */
  function voisinage(g, cle) {
    const par = new Map(g.noeuds.map((n) => [n.cle, n]));
    const n = par.get(cle);
    if (!n) return null;
    const L = liens(g, cle);
    const nodes = (ids) => [...new Set(ids)].map((id) => par.get(id)).filter(Boolean);
    return { centre: n, amont: nodes(L.amont), aval: nodes(L.aval) };
  }

  const Arbre = { graphe, mise_en_page, rendu, liens, voisinage, bandeA, centre, sig, catalogue, carrefours, loin, hash, NODE, COLS, PX, PY, CARREFOUR };
  if (typeof module !== "undefined" && module.exports) module.exports = Arbre;
  root.EclatArbre = Arbre;
})(typeof globalThis !== "undefined" ? globalThis : this);
