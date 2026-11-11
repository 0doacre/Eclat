#!/usr/bin/env node
/* Audit de l'interface : défilements imbriqués, hauteurs figées, fenêtres, chaînage, cibles tactiles, contenu masqué, défilement horizontal.
 * Ne modifie aucun fichier du jeu : il ouvre chaque écran et chaque fenêtre dans Chromium (Playwright), mesure dans la page, imprime un tableau.
 *
 *   PW=<dossier>/node_modules/playwright node tools/audit-interface.js [options]
 *     --w 320,390,430,1280x800   tailles (largeur seule = hauteur de téléphone : 320x568, 390x844, 430x932)
 *     --cas terres,menu           ne passer que les cas dont l'identifiant contient un de ces mots
 *     --json docs/audit-interface/releve.json   écrit les anomalies brutes
 *     --md docs/audit-interface/tableau.md      écrit le tableau classé par gravité
 *     --shots docs/audit-interface              dossier des captures JPG (rien si absent)
 *     --inject "code JS"          exécuté dans la page avant la mesure (essai à blanc d'une correction, sans modifier de fichier)
 *     --liste                     liste les cas et s'arrête
 *
 * Types relevés : 1 défilements imbriqués · 2 hauteurs figées (rognent, ou imposent un vide) · 3 fenêtres (plus hautes que l'écran, bas masqué, sans fermeture)
 *   4 chaînage (overscroll-behavior absent sur un défilement interne) · 5 cibles tactiles sous 44 × 44 px (zone réellement cliquable)
 *   6 contenu masqué par la barre d'onglets ou par une plaque fixe · 7 défilement horizontal ou contenu qui dépasse en largeur.
 * Code de sortie : 0 si aucun défaut bloquant, 1 sinon (le script sert de contrôle de régression).
 * Ce qu'il ne mesure pas : la sensation au doigt (inertie, rebond, accroche), le clavier virtuel, les encoches et zones de sécurité. */
"use strict";
const fs = require("fs"), path = require("path"), http = require("http");
const ROOT = path.resolve(__dirname, "..");
const PW_DEFAUT = "C:/Users/sylva/AppData/Local/Temp/claude/C--Users-sylva-AppData-Local-Temp-craftgame-src/ba4a3d35-8759-4193-a4d5-b1ac39849e40/scratchpad/pw/node_modules/playwright";
const { chromium } = require(process.env.PW || (fs.existsSync(PW_DEFAUT) ? PW_DEFAUT : "playwright"));
const D = require("../js/data.js");
const { createEngine } = require("../js/engine.js");
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".webp": "image/webp", ".woff2": "font/woff2", ".json": "application/json", ".jpg": "image/jpeg", ".png": "image/png" };
const arg = (n, d) => { const i = process.argv.indexOf("--" + n); return i > 0 ? process.argv[i + 1] : d; };
const flag = (n) => process.argv.includes("--" + n);

/* ------------------------------------------------------------------ états de partie */
function partie(etat) {
  const E = createEngine(), s = E.state;
  const age = etat === "gisement" ? 8 : 4, jusqua = etat === "gisement" ? "gisement" : "desert";
  s.age = age; s.cycle = 2; s.meta.forcedDone = true; s.introSeen = true; s.flags.ver = D.VERSION; s.stats.crafts = 12;
  Object.assign(s.settings, { tuto: false, sound: false, visiteurs: false });
  for (const z of D.ZONES) { s.zones[z.id] = true; if (z.id === jusqua) break; }
  for (const [id, it] of Object.entries(D.ITEMS)) {
    if (it.t === "res" && it.a <= age) { s.seen[id] = true; s.inv[id] = 20; }
    if (it.r && it.a <= age && !it.sec && !it.path) { s.known[id] = true; s.made[id] = 1; }
  }
  s.ecus = 1500; s.intu = 40;
  if (etat === "gisement") { s.known.soufre_1 = true; s.seen.soufre_1 = true; s.inv.soufre_1 = 1; } /* un extracteur de soufre qui attend d'être posé aux Collines : la carte « Gisement à exploiter » apparaît sur les Terres */
  if (etat === "releve") { /* de quoi passer le relais : un passage franchi et payé */
    const z = Object.keys(D.PASSAGES || {})[0]; if (z) { s.pass = s.pass || {}; s.pass[z] = { done: true, free: false }; }
    s.meta.traces = 12;
  }
  if (etat === "neuve") { const N = createEngine(); return N.serialize(); }
  E.recalc(); return E.serialize();
}

/* ------------------------------------------------------------------ la mesure, exécutée dans la page */
/* Fonction autonome (Playwright la sérialise) : rien d'extérieur n'y est lu. Renvoie des anomalies sous forme de données. */
function mesurePage(o) {
  const portee = o.fenetre ? document.querySelector(o.fenetre.racine) : document.body;
  if (!portee) return { erreur: "portée introuvable : " + (o.fenetre ? o.fenetre.racine : "body") };
  const VW = innerWidth, VH = innerHeight;
  const out = [], els = (window.__auditEls = []);
  const num = (v) => Math.round(v * 10) / 10;
  const cs = (e) => getComputedStyle(e);
  const visible = (e) => { const r = e.getBoundingClientRect(); if (r.width <= 0 || r.height <= 0) return false; try { return e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }); } catch (_) { const c = cs(e); return c.display !== "none" && c.visibility !== "hidden"; } };
  const decrit = (e) => {
    const tag = e.tagName.toLowerCase();
    const cl = [...e.classList].filter((c) => !/^(on|off|is-|cur|open|hidden|nope|vu|fresh)/.test(c)).slice(0, 3).map((c) => "." + c).join("");
    const data = [...e.attributes].filter((a) => a.name.startsWith("data-")).slice(0, 1).map((a) => "[" + a.name + (a.value && a.value.length < 20 ? '="' + a.value + '"' : "") + "]").join("");
    let sel = tag + (e.id ? "#" + e.id : "") + cl + data;
    let up = e.parentElement, n = 0;
    while (up && n < 2 && up !== document.body && !up.id) { const c2 = [...up.classList].slice(0, 1).map((c) => "." + c).join(""); sel = up.tagName.toLowerCase() + c2 + " > " + sel; up = up.parentElement; n++; }
    if (up && up.id && up !== e) sel = "#" + up.id + " " + sel;
    return sel;
  };
  const sig = (e) => { const t = e.tagName.toLowerCase(); const cl = [...e.classList].filter((c) => !/^(on|off|is-|cur|open|hidden|nope|vu|fresh|p-)/.test(c)).slice(0, 3).map((c) => "." + c).join(""); const d = [...e.attributes].filter((a) => a.name.startsWith("data-")).slice(0, 1).map((a) => "[" + a.name + "]").join(""); return t + cl + d; };
  const cadre = (e) => !!e.closest("#top, #tabs, #actbar, #navPoignee, #ambianceBar, #testModeBar");
  const ajoute = (type, e, valeur, extra) => { const i = els.push(e) - 1; out.push(Object.assign({ type, sel: decrit(e), sig: sig(e), valeur, idx: i, cadre: cadre(e), texte: (e.textContent || e.getAttribute("aria-label") || e.title || "").trim().replace(/\s+/g, " ").slice(0, 30) }, extra || {})); };
  const tous = [...portee.querySelectorAll("*")].filter((e) => !/^(SCRIPT|STYLE|PATH|CIRCLE|RECT|G|USE|DEFS|LINE|POLYGON|ELLIPSE|TEXT|TSPAN|LINEARGRADIENT|STOP|CLIPPATH|FILTER|MASK|PATTERN|SYMBOL|SVG|IMAGE)$/i.test(e.tagName) && !e.closest("svg"));
  const vus = tous.filter(visible);

  /* -------- défilements */
  const defile = (e, axe) => { const c = cs(e), ov = axe === "y" ? c.overflowY : c.overflowX; if (!/(auto|scroll|overlay)/.test(ov)) return false; return axe === "y" ? e.scrollHeight - e.clientHeight > 1 : e.scrollWidth - e.clientWidth > 1; };
  const racineDefile = document.scrollingElement && document.scrollingElement.scrollHeight - document.scrollingElement.clientHeight > 1;
  const peutDefiler = (e) => /(auto|scroll|overlay)/.test(cs(e).overflowY);
  const scrollers = [portee, ...vus].filter((e) => defile(e, "y"));
  /* la chaîne des ancêtres qui défilent : c'est eux qui reçoivent le chaînage ; la fenêtre en cours (#modal) est la limite d'une fenêtre */
  const chaine = (e) => { const c = []; let p = e.parentElement; const stop = o.fenetre ? document.querySelector(o.fenetre.racine).parentElement : null; while (p && p !== stop) { if (defile(p, "y")) c.push(p); p = p.parentElement; } return c; };
  const nom = (e) => e.tagName.toLowerCase() + (e.id ? "#" + e.id : "") + [...e.classList].slice(0, 2).map((c) => "." + c).join("");

  /* le scroller d'un écran : #views, ou la vue courante */
  const principaux = [document.querySelector("#views"), document.querySelector(".view.on")].filter(Boolean);
  const defilables = o.fenetre ? [] : principaux;
  const hautDeFenetre = o.fenetre ? [document.querySelector(o.fenetre.boite || o.fenetre.racine)].filter(Boolean) : [];
  const reinit = () => { for (const e of [...scrollers, ...principaux, ...hautDeFenetre]) { try { e.scrollTop = 0; } catch (_) { /* rien */ } } };
  if (!o.garderDefilement) reinit();

  // type 1 et 4
  for (const e of scrollers) {
    const ch = chaine(e);
    const ov = cs(e).overscrollBehaviorY;
    const racine = e === portee || e === document.querySelector("#views") || e === document.querySelector(".view.on") || e.classList.contains("modal-box");
    if (ch.length) {
      ajoute(1, e, "défile de " + (e.scrollHeight - e.clientHeight) + " px dans " + ch.length + " autre(s)", { chaine: ch.map(nom).reverse().join(" › "), hauteur: Math.round(e.clientHeight) });
      if (ov === "auto") ajoute(4, e, "overscroll-behavior-y: auto sous " + nom(ch[0]), { chaine: ch.map(nom).reverse().join(" › ") });
    } else if (ov === "auto" && !racine) {
      ajoute(4, e, "overscroll-behavior-y: auto, défilement seul (la page derrière suit)", { benin: true });
    }
  }
  // un défilement de plus que deux niveaux est dit en tête de chaîne seulement ; compte global
  // type 7 : horizontal
  const de = document.documentElement;
  if (!o.fenetre && de.scrollWidth > VW + 1) ajoute(7, document.body, "la page déborde de " + (de.scrollWidth - VW) + " px en largeur", { page: true });
  for (const e of [portee, ...vus]) {
    const c = cs(e);
    const sw = e.scrollWidth - e.clientWidth;
    if (sw > 1 && /(auto|scroll|overlay)/.test(c.overflowX) && e.clientWidth > 0) ajoute(7, e, "défile en largeur de " + sw + " px (" + c.overflowX + ")", { carrousel: true });
    else if (sw > 2 && /(hidden|clip)/.test(c.overflowX) && e.clientWidth > 0 && e.clientHeight > 0 && !/^(IMG|VIDEO|CANVAS)$/.test(e.tagName)) {
      /* un contenu rogné à droite : seulement si un enfant visible dépasse le bord */
      const r = e.getBoundingClientRect();
      const coupe = [...e.children].filter((k) => { const kr = k.getBoundingClientRect(); return kr.width > 0 && kr.height > 0 && kr.right > r.right + 2 && kr.left < r.right; });
      if (coupe.length) ajoute(7, e, "rogne " + coupe.length + " enfant(s) à droite (dépasse de " + num(Math.max(...coupe.map((k) => k.getBoundingClientRect().right - r.right))) + " px)", { rogne: true });
    }
  }
  /* un élément qui sort de l'écran et que rien ne rogne */
  for (const e of vus) {
    const r = e.getBoundingClientRect();
    if (r.right <= VW + 1 && r.left >= -1) continue;
    if (r.right < 0 || r.left > VW) continue; // hors écran voulu (hors-champ)
    const c = cs(e); if (c.position === "fixed" && (r.left > VW - 2 || r.right < 2)) continue;
    let rogne = false;
    for (let p = e.parentElement; p; p = p.parentElement) { const pc = cs(p), pr = p.getBoundingClientRect(); if (/(hidden|clip|auto|scroll)/.test(pc.overflowX) && pr.right <= VW + 1 && pr.left >= -1) { rogne = true; break; } }
    if (!rogne && !e.closest("svg") && (e.children.length === 0 || e.textContent.trim())) { if (![...e.children].some((k) => k.getBoundingClientRect().right > VW + 1)) ajoute(7, e, "sort de l'écran : " + num(r.left) + " à " + num(r.right) + " sur " + VW, { sortie: true }); }
  }

  /* -------- type 2 : hauteurs figées (lues dans les feuilles de style, pas seulement la valeur finale) */
  const unites = /(\d(px|vh|dvh|svh|lvh|vmin)\b|calc\()/;
  const props = ["height", "max-height", "min-height"];
  const decls = new Map(); // élément -> [{prop, val, file, sel, important}]
  const parcourt = (regles, fichier) => {
    for (const r of regles) {
      try {
        if (r.type === 1) {
          const st = r.style, trouve = [];
          for (const p of props) { const v = st.getPropertyValue(p); if (v && unites.test(v) && !/^(0|0px)$/.test(v.trim())) trouve.push({ prop: p, val: v.trim(), important: st.getPropertyPriority(p) === "important" }); }
          if (!trouve.length) continue;
          if (/::?(before|after|placeholder|-webkit|backdrop|marker|first-)/.test(r.selectorText)) continue;
          let m; try { m = [...document.querySelectorAll(r.selectorText)]; } catch (_) { continue; }
          for (const e of m) { if (!portee.contains(e) && e !== portee) continue; const l = decls.get(e) || []; for (const t of trouve) l.push(Object.assign({ file: fichier, sel: r.selectorText.slice(0, 90) }, t)); decls.set(e, l); }
        } else if (r.type === 4) { if (!r.media || matchMedia(r.media.mediaText).matches) parcourt(r.cssRules, fichier); }
        else if (r.cssRules && (r.type === 12 || r.type === 7 || r.constructor.name === "CSSLayerBlockRule" || r.constructor.name === "CSSContainerRule")) parcourt(r.cssRules, fichier);
      } catch (_) { /* règle illisible */ }
    }
  };
  for (const ss of document.styleSheets) { try { parcourt(ss.cssRules, (ss.href || "style en ligne").split("/").pop()); } catch (_) { /* feuille externe */ } }
  for (const [e, l] of decls) {
    if (!visible(e)) continue;
    if (e.getBoundingClientRect().height <= 2 || e.getBoundingClientRect().width <= 2) continue; /* étiquette cachée à l'œil (lecteur d'écran) */
    const c = cs(e), r = e.getBoundingClientRect(), exces = e.scrollHeight - e.clientHeight, oy = c.overflowY;
    // le dernier déclaré gagne (ordre des feuilles) ; on garde la dernière règle de chaque propriété
    const derniere = {}; for (const d of l) derniere[d.prop] = d;
    const dd = Object.values(derniere).map((d) => d.prop + ":" + d.val + (d.important ? " !important" : "") + " (" + d.file + ")").join(" ; ");
    const fichiers = [...new Set(Object.values(derniere).map((d) => d.file))].join(", ");
    const selRegle = Object.values(derniere).map((d) => d.sel)[0];
    const contenuUtile = [...e.children].some((k) => visible(k));
    if (exces > 2 && /(hidden|clip)/.test(oy) && contenuUtile && c.maxHeight !== "none" || exces > 2 && /(hidden|clip)/.test(oy) && c.height !== "auto" && derniere.height) {
      if (!/^(IMG|VIDEO|CANVAS)$/.test(e.tagName)) ajoute(2, e, "rogne " + exces + " px de contenu (hauteur " + num(r.height) + " px) · " + dd, { fichier: fichiers, regle: selRegle, effet: "rogne" });
    } else if (exces > 2 && /(auto|scroll)/.test(oy) && (derniere["max-height"] || derniere.height) && (c.maxHeight !== "none" || derniere.height)) {
      ajoute(2, e, "défile de " + exces + " px sous une hauteur fixée (" + num(r.height) + " px) · " + dd, { fichier: fichiers, regle: selRegle, effet: "defile" });
    } else if (derniere["min-height"] && r.height > 1) {
      /* min-height qui impose un vide : la hauteur utilisée est celle du plancher et le contenu n'en remplit pas la moitié */
      const enf = [...e.children].filter(visible), bas = enf.length ? Math.max(...enf.map((k) => k.getBoundingClientRect().bottom)) : r.top;
      const libre = r.bottom - bas - parseFloat(c.paddingBottom || 0);
      const min = parseFloat(c.minHeight);
      if (min > 0 && Math.abs(r.height - min) < 2 && libre > 70 && enf.length) ajoute(2, e, "vide de " + Math.round(libre) + " px sous le contenu, imposé par min-height " + derniere["min-height"].val + " · " + dd, { fichier: fichiers, regle: selRegle, effet: "vide" });
    }
  }
  /* des vides entre blocs successifs d'une colonne (le corps de la terre qui garde sa hauteur) */
  if (!o.fenetre) {
    const colonnes = vus.filter((e) => { const c = cs(e); return (c.display === "block" || c.display === "flex" || c.display === "grid") && !/(row)/.test(c.flexDirection) && e.children.length >= 2 && e.getBoundingClientRect().width > VW * .5; });
    for (const col of colonnes) {
      const enf = [...col.children].filter((k) => visible(k) && cs(k).position !== "absolute" && cs(k).position !== "fixed").sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
      for (let i = 1; i < enf.length; i++) {
        const a = enf[i - 1].getBoundingClientRect(), b = enf[i].getBoundingClientRect();
        const trou = b.top - a.bottom;
        if (trou > 80 && b.top < VH + 600) ajoute(2, enf[i], "vide de " + Math.round(trou) + " px au-dessus (entre " + nom(enf[i - 1]) + " et " + nom(enf[i]) + ")", { effet: "trou", fichier: "", regle: "" });
      }
    }
  }

  /* -------- type 5 : cibles tactiles (zone réellement cliquable, sondée avec elementFromPoint) */
  const interactif = (e) => {
    if (e.disabled) return false;
    const c = cs(e); if (c.pointerEvents === "none") return false;
    if (e.matches("button, a[href], input:not([type=hidden]), select, textarea, summary, [role=button], [role=tab], [role=switch], [role=checkbox], [role=radio], [role=link], [tabindex]:not([tabindex='-1']), label[for]")) return true;
    if (c.cursor === "pointer") { const pc = e.parentElement ? cs(e.parentElement).cursor : ""; return pc !== "pointer"; }
    return false;
  };
  const sonde = (e) => {
    const r = e.getBoundingClientRect();
    if (r.bottom < 0 || r.top > VH || r.right < 0 || r.left > VW) return null;
    const x0 = Math.max(-1, r.left - 30), x1 = Math.min(VW + 1, r.right + 30), y0 = Math.max(-1, r.top - 30), y1 = Math.min(VH + 1, r.bottom + 30);
    let mnx = 1e9, mxx = -1e9, mny = 1e9, mxy = -1e9, n = 0;
    for (let y = Math.max(0, y0); y <= y1; y += 2) for (let x = Math.max(0, x0); x <= x1; x += 2) {
      const h = document.elementFromPoint(x, y);
      if (h && (h === e || e.contains(h))) { n++; if (x < mnx) mnx = x; if (x > mxx) mxx = x; if (y < mny) mny = y; if (y > mxy) mxy = y; }
    }
    return n ? { w: mxx - mnx + 2, h: mxy - mny + 2 } : { w: 0, h: 0 };
  };
  const nbInteractifs = vus.filter(interactif).length;
  const petites = vus.filter(interactif).filter((e) => { const r = e.getBoundingClientRect(); return r.width < 44 || r.height < 44; });
  const vues5 = new Set();
  for (const e of petites) {
    if (e.closest(".modal-box") && !o.fenetre) continue;
    const r0 = e.getBoundingClientRect();
    /* amène l'élément à l'écran sans changer l'état : défile le plus proche ancêtre qui défile */
    if (!e.closest("#top, #tabs, #actbar, .modal-x") && (r0.bottom < 70 || r0.top > VH - 110)) { try { e.scrollIntoView({ block: "center", inline: "nearest" }); } catch (_) { /* rien */ } }
    const h = sonde(e);
    if (!h) continue;
    const r = e.getBoundingClientRect();
    const clef = Math.round(r.left) + "," + Math.round(r.top) + sig(e); if (vues5.has(clef)) continue; vues5.add(clef);
    if (h.w === 0 && h.h === 0) { /* recouvert : rien ne reçoit le toucher ici ; on ne compte pas */ continue; }
    if (h.w < 43.9 || h.h < 43.9) ajoute(5, e, "zone " + Math.round(h.w) + " × " + Math.round(h.h) + " px (dessin " + Math.round(r.width) + " × " + Math.round(r.height) + ")", { zone: [Math.round(h.w), Math.round(h.h)], dessin: [Math.round(r.width), Math.round(r.height)] });
  }
  if (!o.garderDefilement) reinit();

  /* -------- type 6 : contenu masqué par les éléments fixés (barre d'onglets, plaque du nom de la terre, …) */
  const fixes = [...document.querySelectorAll("body *")].filter((e) => { if (!visible(e)) return false; const c = cs(e); if (c.position !== "fixed" && c.position !== "sticky") return false; if (o.fenetre && !e.closest(o.fenetre.racine)) return false; if (!o.fenetre && e.closest("#modal, #toasts, #fx")) return false; return true; })
    .filter((e) => { const r = e.getBoundingClientRect(); return r.width > 20 && r.height > 12 && r.width * r.height < VW * VH * .9; });
  /* l'élément racine d'un groupe fixé suffit (les enfants d'un fixe sont couverts avec lui) */
  const racinesFixes = fixes.filter((e) => !fixes.some((f) => f !== e && f.contains(e)));
  const couvre = (e, f) => {
    const r = e.getBoundingClientRect();
    const x0 = Math.max(0, r.left), x1 = Math.min(VW, r.right), y0 = Math.max(0, r.top), y1 = Math.min(VH, r.bottom);
    if (x1 - x0 < 4 || y1 - y0 < 4) return 0;
    let n = 0, t = 0;
    for (const fx of [.15, .5, .85]) for (const fy of [.15, .5, .85]) { const x = x0 + (x1 - x0) * fx, y = y0 + (y1 - y0) * fy; t++; const h = document.elementFromPoint(x, y); if (h && h !== e && !e.contains(h) && !h.contains(e) && f.some((g) => g === h || g.contains(h))) n++; }
    return n / t;
  };
  const contenus = vus.filter((e) => { if (racinesFixes.some((f) => f === e || f.contains(e))) return false; if (e.children.length && !(e.matches("button, a, [role=button]"))) { const propre = [...e.childNodes].some((nd) => nd.nodeType === 3 && nd.textContent.trim()); if (!propre) return false; } return true; });
  const verifie = (bandeHaute) => {
    const f = racinesFixes.filter((x) => { const r = x.getBoundingClientRect(); return (r.top + r.height / 2 < VH / 2) === bandeHaute; });
    if (!f.length) return;
    for (const e of contenus) {
      const k = couvre(e, f);
      if (k >= .34) { const t = e.matches("button, a, input, select, [role=button], [role=tab]") || !!e.closest("button, a, [role=button]"); ajoute(6, e, Math.round(k * 100) + " % de l'élément est sous " + nom(f.find((g) => { const h = document.elementFromPoint(e.getBoundingClientRect().left + e.getBoundingClientRect().width / 2, Math.min(VH - 1, e.getBoundingClientRect().top + e.getBoundingClientRect().height / 2)); return h && (g === h || g.contains(h)); }) || f[0]) + (bandeHaute ? " (en haut de défilement)" : " (en bas de défilement)"), { actionnable: t, partie: k < .99, bande: bandeHaute ? "haut" : "bas" });
    }
    }
  };
  const aucunDefilement = () => !principaux.some((e) => e.scrollHeight - e.clientHeight > 1) && !hautDeFenetre.some((e) => e.scrollHeight - e.clientHeight > 1);
  reinit(); verifie(true);
  const maxi = [...principaux, ...hautDeFenetre, ...scrollers.filter((e) => !chaine(e).length)];
  for (const e of maxi) { try { e.scrollTop = e.scrollHeight; } catch (_) { /* rien */ } }
  verifie(false);
  if (!o.garderDefilement) reinit();
  /* le doublon du haut et du bas : un élément compté deux fois n'est gardé qu'une fois */
  const vus6 = new Set(); for (let i = out.length - 1; i >= 0; i--) { if (out[i].type !== 6) continue; const k = out[i].idx + out[i].bande; if (vus6.has(out[i].idx)) out.splice(i, 1); else vus6.add(out[i].idx); }

  /* -------- type 3 : la fenêtre elle-même (fenêtre modale ou feuille) */
  if (o.fenetre) {
    const boite = document.querySelector(o.fenetre.boite || o.fenetre.racine);
    if (boite) {
      const r = boite.getBoundingClientRect(), exces = boite.scrollHeight - boite.clientHeight;
      const info = { hauteur: Math.round(r.height), bas: Math.round(r.bottom), haut: Math.round(r.top), ecran: VH, defile: exces > 1 ? exces : 0, largeur: Math.round(r.width) };
      if (r.height > VH + 1 || r.top < -1) ajoute(3, boite, "plus haute que l'écran : " + Math.round(r.height) + " px pour " + VH + " (haut " + Math.round(r.top) + ")", Object.assign({ sub: "haute" }, info));
      else if (r.bottom > VH + 1) ajoute(3, boite, "le bas dépasse de l'écran de " + Math.round(r.bottom - VH) + " px", Object.assign({ sub: "bas-hors" }, info));
      if (r.width > VW + 1 || r.right > VW + 1 || r.left < -1) ajoute(3, boite, "sort de l'écran en largeur : " + Math.round(r.left) + " à " + Math.round(r.right) + " sur " + VW, Object.assign({ sub: "large" }, info));
      /* le bas est-il atteignable ? un point du bord bas doit appartenir à la fenêtre (rien d'autre par-dessus : barre d'onglets, plaque) */
      const bas = Math.min(VH - 2, r.bottom - 3), pts = [r.left + r.width * .2, r.left + r.width * .5, r.left + r.width * .8].filter((x) => x > 0 && x < VW);
      const masques = pts.map((x) => document.elementFromPoint(x, bas)).filter((h) => h && !boite.contains(h) && h.closest("#tabs, #actbar, #navPoignee, #top, .tuto"));
      if (masques.length) ajoute(3, boite, "le bas de la fenêtre est recouvert par " + nom(masques[0].closest("#tabs, #actbar, #navPoignee, #top, .tuto")), Object.assign({ sub: "masquee" }, info));
      /* un moyen de fermer, visible et touchable sans défiler */
      const ferme = [...boite.querySelectorAll(".modal-x, [data-m='close'], [data-equipesheet='0'], [data-autosheet='0'], [data-construiresheet='0'], [data-energiesheet='0'], [aria-label='Fermer']")].filter(visible);
      const touchable = ferme.filter((b) => { const q = b.getBoundingClientRect(); const x = Math.min(VW - 1, Math.max(0, q.left + q.width / 2)), y = Math.min(VH - 1, Math.max(0, q.top + q.height / 2)); if (q.bottom < 0 || q.top > VH) return false; const h = document.elementFromPoint(x, y); return h && (h === b || b.contains(h)); });
      const persistant = !boite.querySelector(".modal-x");
      if (!touchable.length) ajoute(3, boite, persistant ? "aucun bouton de fermeture touchable à l'écran sans défiler" : "bouton de fermeture introuvable ou recouvert", Object.assign({ sub: "sans-fermeture", persistant, fermeurs: ferme.length }, info));
      else {
        /* le bouton de fermeture suit-il le défilement ? (position sticky/fixed/absolute dans une boîte qui défile, il s'en va) */
        const x = touchable[0], pos = cs(x).position;
        if (exces > 1 && pos !== "sticky" && pos !== "fixed" && x.classList.contains("modal-x")) ajoute(3, x, "la croix de fermeture défile avec le contenu (position " + pos + ")", Object.assign({ sub: "croix-defile" }, info));
      }
    }
  }
  return { anomalies: out, vue: { VW, VH, scrollW: de.scrollWidth, racineDefile: !!racineDefile, nbInteractifs, nbPetites: petites.length, nbElements: vus.length } };
}

/* surligne les éléments fautifs avant une capture (couleur par type) */
function surligne(a) {
  const C = { 1: "#d4380d", 2: "#d48806", 3: "#cf1322", 4: "#7c3aed", 5: "#0b7285", 6: "#c2255c", 7: "#e8590c" };
  for (const x of a) { const e = (window.__auditEls || [])[x.idx]; if (e && e.style) { e.style.setProperty("outline", "2px solid " + C[x.type], "important"); e.style.setProperty("outline-offset", "-1px", "important"); } }
}

/* ------------------------------------------------------------------ pilotage */
const pause = (p, ms) => p.waitForTimeout(ms);
async function onglet(p, t) { await p.locator('#tabs [data-tab="' + t + '"]').click({ force: true }); await pause(p, 450); }
async function ferme(p) { for (let i = 0; i < 4; i++) { await p.evaluate(() => { const g = window.__eclat; g.U.mq = []; g.closeModal(); }); await pause(p, 120); } await p.evaluate(() => { const g = window.__eclat; g.U.autoSheet = false; g.U.equipeSheet = false; g.U.construireSheet = false; g.U.energieSheet = false; }); }
const cliquer = async (p, sel, ms) => { const l = p.locator(sel).first(); await l.click({ force: true, timeout: 3000 }); await pause(p, ms || 500); };
const menu = async (p, rub) => { await cliquer(p, "#menuBtn", 700); if (rub) await cliquer(p, '#modal [data-mjump="' + rub + '"]', 500); };
const idRecette = Object.entries(D.ITEMS).find(([id, it]) => it.r && it.a <= 4 && !it.sec && !it.path && D.ITEMS[id].t !== "res");
const metier = async (p, m) => { await p.evaluate(() => { const g = window.__eclat; g.U.atelierSel = null; g.U.prodSel = null; }); await onglet(p, "atelier"); await p.evaluate(() => window.__eclat.render(true)); await pause(p, 300); await cliquer(p, "[data-atelier=" + (m || "artisanat") + "]", 600); };
const etude = async (p) => { await p.evaluate(() => { window.__eclat.E.state.settings.equipmentFilter = "tout"; }); await onglet(p, "labo"); await p.evaluate(() => window.__eclat.render(true)); await pause(p, 400); };
const MODALE = { racine: "#modal", boite: "#modal .modal-box" };

const CAS = [
  /* ---- écrans */
  { id: "terres-lisiere", nom: "Terres · Lisière", ecran: true, ouvre: async (p) => { await onglet(p, "domaine"); await p.evaluate(() => { const g = window.__eclat; g.U.zone = "lisiere"; g.render(true); }); await pause(p, 500); } },
  { id: "terres-gisement", nom: "Terres · Gisement Noir (âge 9)", etat: "gisement", ecran: true, ouvre: async (p) => { await onglet(p, "domaine"); await p.evaluate(() => { const g = window.__eclat; g.U.zone = "gisement"; g.render(true); }); await pause(p, 600); } },
  { id: "etude", nom: "Étude (ressources « tout »)", ecran: true, ouvre: async (p) => { await etude(p); } },
  { id: "atelier-liste", nom: "Atelier · liste des métiers", ecran: true, ouvre: async (p) => { await p.evaluate(() => { const g = window.__eclat; g.U.atelierSel = null; g.U.prodSel = null; }); await onglet(p, "atelier"); await p.evaluate(() => window.__eclat.render(true)); await pause(p, 400); } },
  { id: "atelier-metier", nom: "Atelier · page d'un métier", ecran: true, ouvre: async (p) => { await metier(p); } },
  { id: "atelier-equipe", nom: "Atelier · feuille Équipe", ecran: true, feuille: ".auto-feuille", ouvre: async (p) => { await metier(p); await cliquer(p, '[data-equipesheet="1"]', 600); } },
  { id: "atelier-construire", nom: "Atelier · feuille À construire", ecran: true, feuille: ".auto-feuille", ouvre: async (p) => { for (const m of ["construction", "metallurgie", "centrales", "elevage", "artisanat", "artistique"]) { await metier(p, m); if (await p.locator('[data-construiresheet="1"]').count()) break; } await cliquer(p, '[data-construiresheet="1"]', 600); } },
  { id: "atelier-tourne", nom: "Atelier · feuille Ce qui tourne", ecran: true, feuille: ".auto-feuille", ouvre: async (p) => { await metier(p); await cliquer(p, '[data-autosheet="1"]', 600); } },
  { id: "fiche-extracteur", nom: "Fiche d'un extracteur (touche sur la Cabane de bûcheron)", fenetre: MODALE, ouvre: async (p) => { await onglet(p, "journal"); await p.evaluate(() => { const b = document.createElement("button"); b.dataset.goto = "cabane"; b.textContent = "x"; document.querySelector(".view.on").appendChild(b); b.click(); b.remove(); }); await pause(p, 900); } },
  { id: "journal-recettes", nom: "Journal · Recettes", ecran: true, ouvre: async (p) => { await onglet(p, "journal"); await cliquer(p, ".view.on button:has-text('Recettes')", 500); } },
  { id: "journal-fragments", nom: "Journal · Fragments", ecran: true, ouvre: async (p) => { await onglet(p, "journal"); await cliquer(p, '.view.on [data-jt="fragments"]', 500); } },
  { id: "journal-livre", nom: "Journal · Livre", ecran: true, ouvre: async (p) => { await onglet(p, "journal"); await cliquer(p, '.view.on [data-jt="livre"]', 500); } },
  ...["chemin", "secrets", "gestes", "fins", "stats"].map((k) => ({ id: "progression-" + k, nom: "Progression · " + ({ stats: "Mémoire" }[k] || k[0].toUpperCase() + k.slice(1)), ecran: true, ouvre: async (p) => { await onglet(p, "arbre"); await cliquer(p, '.view.on [data-pt="' + k + '"]', 600); } })),
  /* ---- fenêtres */
  ...["jeu", "affichage", "audio", "systeme", "aide"].map((k) => ({ id: "menu-" + k, nom: "Menu · " + k, fenetre: MODALE, garderDefilement: true, ouvre: async (p) => { await onglet(p, "domaine"); await menu(p, k); } })),
  { id: "menu-haut", nom: "Menu · ouverture (haut)", fenetre: MODALE, ouvre: async (p) => { await onglet(p, "domaine"); await menu(p); } },
  { id: "quetes", nom: "Quêtes", fenetre: MODALE, ouvre: async (p) => { await onglet(p, "domaine"); await cliquer(p, "#questBtn:visible, [data-quetes]:visible", 700); } },
  { id: "memoire", nom: "Mémoire des mains", fenetre: MODALE, ouvre: async (p) => { await p.evaluate(() => window.__eclat.openMemoire()); await pause(p, 700); } },
  { id: "comptoir", nom: "Comptoir", fenetre: MODALE, ouvre: async (p) => { await p.evaluate(() => window.__eclat.Dom.comptoirSheet()); await pause(p, 700); } },
  { id: "fiche-ressource", nom: "Fiche d'une ressource (appui long)", fenetre: MODALE, ouvre: async (p) => { await etude(p); await p.locator("#v-labo [data-ae-resource]:visible").first().click({ button: "right", force: true, timeout: 3000 }); await pause(p, 800); if (await p.evaluate(() => document.querySelector("#modal").classList.contains("hidden"))) { await p.evaluate(() => { const e = document.querySelector("#v-labo [data-ae-resource]"); e.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true })); }); await pause(p, 800); } } },
  { id: "fiche-recette", nom: "Fiche d'une recette (appui long)", fenetre: MODALE, ouvre: async (p) => { await etude(p); const l = p.locator("#v-labo [data-ae-resource='" + (idRecette ? idRecette[0] : "") + "']"); if (await l.count()) await l.first().click({ button: "right", force: true, timeout: 3000 }); else await p.locator("#v-labo [data-ae-resource]:visible").nth(5).click({ button: "right", force: true, timeout: 3000 }); await pause(p, 800); } },
  { id: "releve", nom: "Fenêtre de relève", etat: "releve", fenetre: MODALE, ouvre: async (p) => { await p.evaluate(() => window.__eclat.openMemoire()); await pause(p, 700); await cliquer(p, '#modal [data-m="releve"]', 800); } },
  { id: "ouverture", nom: "Fenêtre d'ouverture (Ouvrir les yeux)", etat: "neuve", fenetre: MODALE, ouvre: async (p) => { await pause(p, 2800); } },
  { id: "aide", nom: "Aide", fenetre: MODALE, ouvre: async (p) => { await onglet(p, "domaine"); await menu(p); await cliquer(p, '#modal [data-m="help"]', 900); } }
];

const TAILLES = (arg("w", "320,390,430,1280x800")).split(",").map((s) => { const m = s.match(/^(\d+)x(\d+)$/); if (m) return [+m[1], +m[2]]; const w = +s; return [w, w <= 320 ? 568 : w <= 390 ? 844 : 932]; });

/* gravité : bloquant, gênant, cosmétique */
function gravite(a) {
  if (a.type === 3) return a.sub === "sans-fermeture" ? (a.persistant ? "gênant" : "bloquant") : ["masquee", "bas-hors", "large"].includes(a.sub) ? "bloquant" : "gênant";
  if (a.type === 8) return "bloquant";
  if (a.type === 6) return a.actionnable ? "bloquant" : "gênant";
  if (a.type === 7) return a.page || a.sortie ? "bloquant" : "gênant";
  if (a.type === 1) return "gênant";
  if (a.type === 2) return a.effet === "rogne" || a.effet === "trou" || a.effet === "vide" ? "gênant" : "cosmétique";
  if (a.type === 4) return a.benin ? "cosmétique" : "gênant";
  if (a.type === 5) return Math.min(...(a.zone || [0])) < 32 ? "gênant" : "cosmétique";
  return "cosmétique";
}

async function lance() {
  const filtre = (arg("cas", "") || "").split(",").filter(Boolean);
  const cas = CAS.filter((c) => !filtre.length || filtre.some((f) => c.id.includes(f)));
  if (flag("liste")) { console.log(cas.map((c) => c.id + "\t" + c.nom).join("\n")); return 0; }
  const server = http.createServer((req, res) => {
    const f = path.resolve(ROOT, "." + new URL(req.url, "http://x").pathname.replace(/\/$/, "/index.html"));
    if (!f.startsWith(ROOT + path.sep)) { res.writeHead(403).end(); return; }
    fs.readFile(f, (e, d) => { if (e) { res.writeHead(404).end(); return; } res.setHeader("Content-Type", MIME[path.extname(f)] || "application/octet-stream"); res.end(d); });
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const b = await chromium.launch();
  const shotsDir = arg("shots", ""), toutesCaptures = flag("toutes-captures");
  if (shotsDir) fs.mkdirSync(path.resolve(ROOT, shotsDir), { recursive: true });
  const toutes = [], vusCadre = new Set(), echecs = [];
  for (const [W, H] of TAILLES) {
    const etats = [...new Set(cas.map((c) => c.etat || "bronze"))];
    for (const etat of etats) {
      let ctx, p, erreurs;
      const ouvrePage = async () => {
        if (ctx) await ctx.close();
        ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, hasTouch: W < 700, isMobile: W < 700, serviceWorkers: "block", reducedMotion: "reduce" });
        p = await ctx.newPage(); erreurs = [];
        p.on("pageerror", (e) => erreurs.push(e.message.slice(0, 160) + (flag("pile") ? " | " + String(e.stack).replace(/s+/g, " ").slice(0, 600) : "")));
        await p.addInitScript((r) => { localStorage.setItem("eclat.save.v1", r); localStorage.setItem("eclat.style.carnet-defaut", "1"); }, partie(etat));
        await p.goto("http://127.0.0.1:" + server.address().port + "/index.html");
        await p.waitForFunction(() => !!window.__eclat);
        if (etat !== "neuve") { for (let i = 0; i < 6; i++) { await pause(p, 100); await p.evaluate(() => window.__eclat.closeModal()); } } else await pause(p, 300);
      };
      await ouvrePage();
      for (const c of cas.filter((x) => (x.etat || "bronze") === etat)) {
        const tag = c.id + " @" + W + "x" + H;
        let sale = false;
        try {
          if (etat !== "neuve") await ferme(p);
          await c.ouvre(p);
          if (arg("inject", "")) { await p.evaluate(arg("inject", "")); await pause(p, 200); } /* essai à blanc : du CSS ou du JS ajouté avant la mesure (ne touche aucun fichier) */
          const opt = { fenetre: c.fenetre || (c.feuille ? { racine: c.feuille, boite: c.feuille } : null), garderDefilement: !!c.garderDefilement };
          const r = await p.evaluate(mesurePage, opt);
          if (r.erreur) { echecs.push(tag + " : " + r.erreur); sale = true; continue; }
          let anos = r.anomalies.filter((a) => !(a.cadre && vusCadre.has(W + a.type + a.sig)));
          for (const a of anos) if (a.cadre) vusCadre.add(W + a.type + a.sig);
          for (const a of anos) { a.cas = c.id; a.casNom = c.nom; a.largeur = W; a.hauteurEcran = H; a.gravite = gravite(a); }
          /* capture si un défaut gênant ou bloquant */
          const graves = anos.filter((a) => a.gravite !== "cosmétique");
          if (flag("stats")) console.log(tag, JSON.stringify(r.vue));
          if (shotsDir && (graves.length || toutesCaptures)) {
            const f = c.id + "-" + W + ".jpg";
            await p.evaluate(surligne, graves);
            await p.screenshot({ path: path.resolve(ROOT, shotsDir, f), type: "jpeg", quality: 55 });
            for (const a of graves) a.capture = f;
          }
          if (c.fenetre && c.fenetre.racine === "#modal" && await p.evaluate(() => document.querySelector("#modal").classList.contains("hidden")) && !erreurs.length) { echecs.push(tag + " : la fenêtre ne s'est pas ouverte (cas non mesuré)"); sale = true; continue; }
          if (erreurs.length) { const m = erreurs.splice(0).join(" ; "); toutes.push({ type: 8, sel: "(page)", sig: "erreur-js", valeur: m, cas: c.id, casNom: c.nom, largeur: W, hauteurEcran: H, gravite: "bloquant", cadre: false }); sale = true; }
          toutes.push(...anos);
        } catch (e) { echecs.push(tag + " : " + e.message.split("\n")[0] + (erreurs.length ? " · erreur JS " + erreurs.join(" ; ") : "")); sale = true; }
        if (sale) await ouvrePage(); /* une erreur de rendu laisse la page à moitié morte : on repart d'une page neuve */
      }
      await ctx.close();
    }
  }
  await b.close(); server.close();

  { const t8 = new Set(toutes.filter((a) => a.type === 8).map((a) => a.cas + a.largeur)); for (let i = toutes.length - 1; i >= 0; i--) if (toutes[i].type !== 8 && t8.has(toutes[i].cas + toutes[i].largeur)) toutes.splice(i, 1); }
  /* ---- tableau */
  const ordre = { bloquant: 0, "gênant": 1, "cosmétique": 2 };
  const groupes = new Map();
  for (const a of toutes) {
    const k = [a.gravite, a.type, a.cas, a.sig, a.type === 6 ? a.bande : "", a.type === 3 ? a.sub : "", a.type === 2 ? a.effet : ""].join("|");
    const g = groupes.get(k) || { a, par: new Map(), n: 0 };
    const l = g.par.get(a.largeur) || []; l.push(a); g.par.set(a.largeur, l); g.n++; groupes.set(k, g);
  }
  const lignes = [...groupes.values()].sort((x, y) => ordre[x.a.gravite] - ordre[y.a.gravite] || x.a.type - y.a.type || x.a.cas.localeCompare(y.a.cas));
  const resume = (g) => [...g.par.entries()].map(([w, l]) => w + " : " + (l.length > 1 ? l.length + " × " : "") + l[0].valeur.replace(/\|/g, "/")).join(" ; ");
  const compte = {}; for (const a of toutes) { compte[a.gravite] = (compte[a.gravite] || 0) + 1; }
  console.log("\n=== " + toutes.length + " anomalies brutes, " + lignes.length + " lignes ===  " + JSON.stringify(compte));
  for (const g of lignes) console.log("[" + g.a.gravite.slice(0, 3) + "] T" + g.a.type + " · " + g.a.casNom + " · " + g.a.sel + " · " + resume(g).slice(0, 220) + (g.a.fichier ? " · " + g.a.fichier : ""));
  if (echecs.length) console.log("\nCas en échec :\n" + echecs.join("\n"));
  if (arg("json", "")) { fs.mkdirSync(path.dirname(path.resolve(ROOT, arg("json"))), { recursive: true }); fs.writeFileSync(path.resolve(ROOT, arg("json")), JSON.stringify({ date: new Date().toISOString(), version: D.VERSION, tailles: TAILLES, anomalies: toutes, echecs }, null, 1)); }
  if (arg("md", "")) {
    const md = ["| Gravité | Écran ou fenêtre | Type | Largeurs | Sélecteur | Mesure | Source probable | Capture |", "|---|---|---|---|---|---|---|---|"];
    for (const g of lignes) md.push("| " + [g.a.gravite, g.a.casNom, g.a.type, [...g.par.keys()].join(" · "), "`" + g.a.sel.replace(/\|/g, "/") + "`" + (g.n > 1 ? " (" + g.n + ")" : ""), resume(g), g.a.fichier ? "`" + g.a.fichier + "`" : "", g.a.capture ? "[" + g.a.capture + "](audit-interface/" + g.a.capture + ")" : ""].join(" | ") + " |");
    fs.writeFileSync(path.resolve(ROOT, arg("md")), md.join("\n") + "\n");
  }
  return toutes.some((a) => a.gravite === "bloquant") || echecs.length ? 1 : 0;
}
lance().then((c) => process.exit(c)).catch((e) => { console.error(e); process.exit(2); });
