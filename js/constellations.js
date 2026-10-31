/* ÉCLAT — les Figures du Cosmos : fragments et signes posés dans le ciel.
 * Module sans état. Entrée : les données du moteur (E.figures()). Sortie : des positions
 * (layout) et le code HTML des étoiles, des traits et des signes (render).
 * Les positions ne dépendent que des identifiants (hash), jamais de l'ordre de découverte.
 * Une étoile pâle ou un signe pas encore compris ne porte jamais de nom ni de réponse. */
(function (root) {
  "use strict";

  const W = 320;            // largeur de référence ; le ciel s’étire, les proportions restent
  const CELL_W = 160, CELL_H = 132;       // une figure de terre
  const SLOT_X = [28, 80, 132], SLOT_Y = [26, 78];
  const SIG_W = 320 / 3, SIG_H = 100;      // un signe
  const SIG_TOP = 12;

  /* FNV-1a, 32 bits */
  function hash(s) {
    let h = 2166136261;
    s = String(s);
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h >>> 0;
  }
  const unit = (s) => hash(s) / 4294967296; // 0 ≤ x < 1
  const jit = (s, amp) => Math.round((unit(s) * 2 - 1) * amp * 10) / 10;

  /* l'ordre des emplacements d'une terre, mêlé par son identifiant */
  function slotOrder(zone) {
    const idx = [0, 1, 2, 3, 4, 5];
    idx.sort((a, b) => hash(zone + "#" + a) - hash(zone + "#" + b) || a - b);
    return idx;
  }

  /* data : { stars: [{ id, z, etat: "allumee"|"pale", rang }], signes: [{ id, h, lu, lieux }] }
   * `rang` est la place de l'étoile dans le catalogue de sa terre (stable d'une partie à l'autre). */
  function layout(data) {
    data = data || {};
    const stars = data.stars || [], signes = data.signes || [];
    const out = { w: W, zones: [], signes: [], liens: [], hZones: 0, hSignes: 0 };

    // les terres, dans l'ordre où le moteur les donne
    const order = [];
    const byZone = {};
    stars.forEach((s) => { if (!byZone[s.z]) { byZone[s.z] = []; order.push(s.z); } byZone[s.z].push(s); });
    order.forEach((z, k) => {
      const ox = (k % 2) * CELL_W, oy = Math.floor(k / 2) * CELL_H;
      const perm = slotOrder(z);
      const pts = byZone[z].map((s) => {
        const slot = perm[(s.rang || 0) % 6];
        const extra = Math.floor((s.rang || 0) / 6) * 14; // au-delà de six : décalé, sans chevaucher
        return {
          id: s.id, etat: s.etat, n: s.n || "",
          x: Math.round((ox + SLOT_X[slot % 3] + jit(s.id + "x", 4) + extra) * 10) / 10,
          y: Math.round((oy + SLOT_Y[Math.floor(slot / 3)] + jit(s.id + "y", 3) + extra) * 10) / 10
        };
      });
      // les traits : de gauche à droite
      const sorted = pts.slice().sort((a, b) => a.x - b.x || a.y - b.y);
      const lines = [];
      for (let i = 1; i < sorted.length; i++) lines.push([sorted[i - 1], sorted[i]]);
      out.zones.push({ z, ox, oy, nom: (data.noms && data.noms[z]) || "", label: { x: ox + CELL_W / 2, y: Math.min(oy + CELL_H - 12, Math.max.apply(null, pts.map((p) => p.y)) + 32) }, stars: pts, lines });
    });
    out.hZones = order.length ? Math.ceil(order.length / 2) * CELL_H : 0;

    // les signes : ceux vus au même endroit se suivent dans la grille, donc se rapprochent
    const par = {};
    const find = (a) => (par[a] === a ? a : (par[a] = find(par[a])));
    signes.forEach((s) => { par[s.id] = s.id; });
    const premier = {};
    signes.forEach((s) => (s.lieux || []).forEach((l) => {
      if (premier[l] === undefined) premier[l] = s.id; else par[find(s.id)] = find(premier[l]);
    }));
    const groupes = {};
    signes.forEach((s) => { (groupes[find(s.id)] = groupes[find(s.id)] || []).push(s); });
    const listes = Object.keys(groupes).map((k) => groupes[k].sort((a, b) => hash(a.id) - hash(b.id) || (a.id < b.id ? -1 : 1)));
    listes.sort((a, b) => hash(a[0].id) - hash(b[0].id) || (a[0].id < b[0].id ? -1 : 1));
    const plat = [];
    listes.forEach((g) => g.forEach((s, i) => plat.push({ s, grp: g, i })));
    plat.forEach((p, k) => {
      const row = Math.floor(k / 3);
      const col = row % 2 ? 2 - (k % 3) : k % 3; // en serpentin : le suivant reste voisin
      p.x = Math.round((col * SIG_W + SIG_W / 2 + jit(p.s.id + "x", 6)) * 10) / 10;
      p.y = Math.round((SIG_TOP + row * SIG_H + 34 + jit(p.s.id + "y", 5)) * 10) / 10;
      out.signes.push({ id: p.s.id, h: p.s.h, lu: !!p.s.lu, mot: p.s.lu ? p.s.mot : "", x: p.x, y: p.y });
    });
    const pos = {};
    out.signes.forEach((s) => { pos[s.id] = s; });
    listes.forEach((g) => { for (let i = 1; i < g.length; i++) out.liens.push([pos[g[i - 1].id], pos[g[i].id]]); });
    out.hSignes = plat.length ? SIG_TOP + Math.ceil(plat.length / 3) * SIG_H : 0;
    return out;
  }

  /* ce que le dessin reçoit : rien d'autre que des positions, des états et, pour un signe compris, son mot */
  function render(lay, o) {
    o = o || {};
    const esc = o.esc || ((s) => String(s));
    const sv = o.signeSVG || (() => "");
    const pct = (v, tot) => (100 * v / tot).toFixed(2) + "%";
    let h = "";
    if (lay.zones.length) {
      const H = lay.hZones;
      h += '<div class="fig-sky" style="padding-bottom:' + (100 * H / W).toFixed(3) + '%"><div class="fig-in">';
      h += '<svg class="fig-lines" viewBox="0 0 ' + W + " " + H + '" aria-hidden="true">';
      lay.zones.forEach((Z) => Z.lines.forEach((l) => {
        const pale = l[0].etat === "pale" || l[1].etat === "pale";
        h += '<line class="' + (pale ? "pale" : "on") + '" x1="' + l[0].x + '" y1="' + l[0].y + '" x2="' + l[1].x + '" y2="' + l[1].y + '"/>';
      }));
      h += "</svg>";
      lay.zones.forEach((Z) => {
        Z.stars.forEach((s) => {
          const st = 'style="left:' + pct(s.x, W) + ";top:" + pct(s.y, H) + '"';
          if (s.etat === "allumee") {
            h += '<button type="button" class="fig-star on" ' + st + ' data-frag="' + esc(s.id) + '" aria-label="' + esc("Fragment : " + s.n) + '"><i></i></button>';
          } else {
            h += '<button type="button" class="fig-star pale" ' + st + ' data-fgz="' + esc(Z.z) + '" aria-label="' + esc(o.txt.pale) + '"><i></i></button>';
          }
        });
        if (Z.nom) h += '<span class="fig-nom" style="left:' + pct(Z.label.x, W) + ";top:" + pct(Z.label.y, H) + '">' + esc(Z.nom) + "</span>";
      });
      h += "</div></div>";
    }
    if (lay.signes.length) {
      const H = lay.hSignes;
      h += '<div class="fig-sky fig-sig" style="padding-bottom:' + (100 * H / W).toFixed(3) + '%"><div class="fig-in">';
      h += '<svg class="fig-lines" viewBox="0 0 ' + W + " " + H + '" aria-hidden="true">';
      lay.liens.forEach((l) => { h += '<line class="lien" x1="' + l[0].x + '" y1="' + l[0].y + '" x2="' + l[1].x + '" y2="' + l[1].y + '"/>'; });
      h += "</svg>";
      lay.signes.forEach((s) => {
        h += '<button type="button" class="fig-signe ' + (s.lu ? "on" : "pale") + '" style="left:' + pct(s.x, W) + ";top:" + pct(s.y, H) + '" data-s="' + esc(s.id) + '" aria-label="' +
          esc(s.lu ? o.txt.compris.replace("{mot}", s.mot) : o.txt.inconnu) + '">' + sv(s.h, 40) + (s.lu ? '<span class="fig-mot">' + esc(s.mot) + "</span>" : "") + "</button>";
      });
      h += "</div></div>";
    }
    return h;
  }

  const Figures = { layout, render, hash, W, CELL_W, CELL_H, SIG_W, SIG_H };
  if (typeof module !== "undefined" && module.exports) module.exports = Figures;
  root.EclatFigures = Figures;
})(typeof globalThis !== "undefined" ? globalThis : this);
