#!/usr/bin/env node
/* Simulateur d’équilibrage : un joueur automatique joue le VRAI moteur, sans écran,
 * avec une horloge virtuelle (pas de 100 ms), pour mesurer en combien de minutes de
 * jeu actif il franchit chaque passage (Plaine, Rivière, Collines…), avec ou sans
 * améliorations de la Mémoire des mains. Sert à régler D.PASSAGES[z].cost et .tr.
 * (tools/sim.js, lui, est l’ancien bot qui joue une partie complète jusqu’à une fin.)
 *
 *   node tools/sim-passages.js [--minutes 120] [--mem recolte=1,extr=2,…]
 *                     [--offline H] [--compare] [--reflexion 20] [--carnet N]
 *                     [--taps 4] [--retour 120] [--journal] [--cout riviere=2,collines=3] [--cycles N]
 *
 *   --mem       niveaux de la Mémoire (ids de D.MEMOIRE) ; la relève est simulée (newCycle)
 *   --offline H après chaque passage, une absence de H heures (le jeu tourne seul, E.catchUp)
 *   --compare   4 profils côte à côte : aucune mémoire · recolte=1 · recolte=2,extr=2,mains=2 ·
 *               recolte=3,extr=4,mains=3,paquetage=2,raccourci=1
 *   --reflexion secondes de réflexion par recette jamais faite (20) ; --carnet N : les recettes
 *               des âges ≤ N sont déjà connues (−1 : aucune ; avec une mémoire : 4, car une
 *               relève a déjà eu lieu) ; --taps : appuis par seconde (4) ; --retour : voir ci-dessous
 *   --journal   affiche l’heure de chaque objectif atteint (pour voir où le joueur coince)
 *   --cout z=k  multiplie par k le prix du passage z (en mémoire seulement : data.js reste intact)
 *   --don id    joue avec ce don de la relève (ids de D.DONS) ; --dons : un jeu par don, écart de chaque
 *               passage au jeu sans don (avec la mémoire de --mem, ou r2 e2 m2 par défaut)
 *   --cycles N  enchaîne N cycles de --minutes chacun : relève (newCycle) puis achats de Mémoire
 *               automatiques dans l’ordre ACHATS, avec les Traces gagnées ; le Carnet reste acquis
 *   --sessions A/H  des séances : A minutes de jeu actif, puis H heures d’absence (le jeu tourne seul,
 *               E.catchUp), et ainsi de suite ; remplace --offline (qui n’absente qu’après chaque passage).
 *               À chaque relève, la séance repart de zéro
 *   --joueur nom   joue un type de joueur de JOUEURS (tapeur, veilleur, explorateur, paresseux) : appuis par
 *               seconde, réflexion, retour sur investissement, séances, fouilles. Les options données à
 *               côté (--taps, --reflexion, --retour, --sessions, --fouilles) l’emportent sur le profil
 *   --joueurs   les types de joueur côte à côte : pour chaque passage le temps ACTIF (jeu) et le temps ÉCOULÉ
 *               (jeu + absences, à l’horloge), puis l’écart à « tapeur » (calculé, sans jugement)
 *   --json      avec --joueur ou --joueurs : le même résultat, lisible par un autre programme
 *
 * Le joueur simulé (simple, réaliste, pas optimal) :
 *  - il connaît toutes les recettes (E.learn), mais perd --reflexion secondes (sans récolter) à
 *    chaque recette qu’il fait pour la première fois, sous-pièces comprises ;
 *  - il récolte à la main --taps fois par seconde, sur la matière brute qui lui manque le plus
 *    pour son but (sinon bois, fibres, pierre à tour de rôle), dans la terre qui rend le plus ;
 *  - il suit l’objectif du jeu (E.objective) : il met en file ce qu’il faut (E.queue en chaîne),
 *    lance les explorations, verse dans les passages dès qu’il peut ; il prépare l’objectif suivant
 *    quand le sien est entièrement réuni ; les étapes « automate » sont ignorées (pas de machines) ;
 *  - il investit : extracteur, outil ou amélioration de récolte, un à la fois, quand l’achat
 *    se rembourse en moins de --retour secondes (coût en secondes de récolte à la main ÷ gain)
 *    et qu’il reste assez à récolter ; l’extracteur va sur le gisement de la matière demandée ;
 *    les matières de cet achat passent avant le gros besoin, et un achat trop long est abandonné ;
 *  - une fabrication en chaîne que le moteur fige (voir brain) est annulée puis refaite pièce par pièce ;
 *  - il joue sans interruption (hors --offline). La « minute » des tableaux est du jeu actif.
 *   --parcours  le VRAI premier parcours (voir tools/sim-parcours.js) : partie neuve, aucune recette connue d’avance ; le joueur
 *               DÉCOUVRE chaque recette par des essais (E.attempt, avec le thermomètre et les souvenirs du guide), la relève
 *               obligatoire du cycle 1 est prise dès qu’elle se déclenche (+3 Traces), il fait un premier achat de Mémoire (--achat),
 *               puis joue le cycle 2 (--minutes, ici la durée du cycle 2) en ne connaissant que ce qu’il a appris
 *   --chasse N  au cycle 2, le joueur cherche aussi les recettes HORS objectif qui l’intéressent (extracteurs…), avec au plus N essais
 *               chacune (0 par défaut : il ne suit que le guide et n’utilise que les recettes qu’il connaît)
 *   --decouverte enigme (il résout l’énigme d’un coup : 1 essai de --reflexion s) · guide (il suit le thermomètre et les indices,
 *               --essai s par essai) · hasard (il essaie au hasard) ; --graine N : le hasard du joueur (le moteur, lui, est fixe)
 * Le moteur n’est jamais modifié. Le fichier s’importe aussi : { play, lire, PROFILS, JOUEURS }. */
"use strict";
const D = require("../js/data.js");
const { createEngine } = require("../js/engine.js");
const I = D.ITEMS;

/* le hasard du joueur : mulberry32, reproductible */
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const PROFILS = [
  { nom: "aucune", mem: {} },
  { nom: "recolte=1", mem: { recolte: 1 } },
  { nom: "r2 e2 m2", mem: { recolte: 2, extr: 2, mains: 2 } },
  { nom: "r3 e4 m3 p2 rac1", mem: { recolte: 3, extr: 4, mains: 3, paquetage: 2, raccourci: 1 } }
];

/* Les types de joueur de --joueur et --joueurs. Valeurs de départ, à régler avec l’auteur : on peut en changer une
 * sans toucher au reste. `sessions` : A minutes de jeu actif puis H heures d’absence, répétées (null : il joue sans
 * interruption). `reflexion` : secondes perdues à la première fois qu’on fait une recette. `retour` : il investit
 * quand l’achat se rembourse en moins de ce nombre de secondes de récolte à la main. */
const JOUEURS = {
  tapeur: { desc: "joue sans s’arrêter, vite et attentif", taps: 4, reflexion: 20, retour: 120, sessions: null, fouilles: false },
  veilleur: { desc: "quelques minutes, puis il range le téléphone pour quatre heures", taps: 3, reflexion: 20, retour: 120, sessions: { actif: 5, absent: 4 }, fouilles: false },
  explorateur: { desc: "lit, essaie, lance les fouilles avant de partir pour la journée", taps: 2, reflexion: 45, retour: 180, sessions: { actif: 20, absent: 8 }, fouilles: true },
  paresseux: { desc: "une courte séance, puis une longue absence", taps: 1, reflexion: 20, retour: 300, sessions: { actif: 3, absent: 12 }, fouilles: true }
};

/* Ordre des achats de Mémoire avec --cycles (strict : si les Traces ne suffisent pas, on économise) */
const ACHATS = ["recolte", "mains", "recolte", "paquetage", "extr", "mains", "raccourci", "recolte", "extr", "paquetage", "raccourci",
  "mains", "recolte", "extr", "extr", "chemins", "recolte", "mains", "extr", "chemins", "chemins", "mains", "recolte", "extr"];

/* ------------------------------------------------------------------ options */
function lire(argv) {
  const donne = {}; // les options données à la main : elles l’emportent sur un profil
  const o = { parcours: false, decouverte: "guide", essai: 8, achat: "recolte", graine: 1, chasse: 0, releve: "jeu", minutes: 120, mem: {}, offline: 0, compare: false, reflexion: 20, carnet: null, taps: 4, retour: 120, journal: false, cout: {}, cycles: 1, fouilles: false, sessions: null, joueur: null, joueurs: false, json: false, don: null, dons: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i], val = () => argv[++i];
    if (a === "--minutes") o.minutes = +val();
    else if (a === "--mem") {
      val().split(",").filter(Boolean).forEach((p) => {
        const [k, v] = p.split("="), m = D.MEMOIRE.find((x) => x.id === k);
        if (!m || !(+v >= 0) || +v > m.cost.length) throw new Error("--mem : « " + p + " » inconnu (ids : " + D.MEMOIRE.map((x) => x.id + "≤" + x.cost.length).join(" ") + ")");
        if (+v > 0) o.mem[k] = +v;
      });
    }
    else if (a === "--don") { o.don = val(); if (!D.DONS.some((d) => d.id === o.don)) throw new Error("--don : « " + o.don + " » inconnu (ids : " + D.DONS.map((d) => d.id).join(" ") + ")"); }
    else if (a === "--dons") o.dons = true;
    else if (a === "--offline") o.offline = +val();
    else if (a === "--sessions") {
      const m = /^([0-9.]+)\/([0-9.]+)$/.exec(val() || "");
      if (!m || !(+m[1] > 0) || !(+m[2] > 0)) throw new Error("--sessions : attendu A/H, minutes de jeu actif puis heures d’absence (par exemple 5/4)");
      o.sessions = { actif: +m[1], absent: +m[2] }; donne.sessions = true;
    }
    else if (a === "--joueur") { o.joueur = val(); if (!JOUEURS[o.joueur]) throw new Error("--joueur : « " + o.joueur + " » inconnu (types : " + Object.keys(JOUEURS).join(" ") + ")"); }
    else if (a === "--joueurs") o.joueurs = true;
    else if (a === "--json") o.json = true;
    else if (a === "--fouilles") { o.fouilles = true; donne.fouilles = true; }
    else if (a === "--compare") o.compare = true;
    else if (a === "--reflexion") { o.reflexion = +val(); donne.reflexion = true; }
    else if (a === "--carnet") o.carnet = +val();
    else if (a === "--taps") { o.taps = +val(); donne.taps = true; }
    else if (a === "--retour") { o.retour = +val(); donne.retour = true; }
    else if (a === "--journal") o.journal = true;
    else if (a === "--parcours") o.parcours = true;
    else if (a === "--decouverte") { o.decouverte = val(); if (!["enigme", "guide", "hasard"].includes(o.decouverte)) throw new Error("--decouverte : enigme, guide ou hasard"); }
    else if (a === "--essai") { o.essai = +val(); if (!(o.essai > 0)) throw new Error("--essai : des secondes par essai (8)"); }
    else if (a === "--achat") { o.achat = val(); if (o.achat !== "aucun" && o.achat !== "auto" && !D.MEMOIRE.some((m) => m.id === o.achat)) throw new Error("--achat : aucun ou un id de la Mémoire"); }
    else if (a === "--graine") o.graine = +val();
    else if (a === "--chasse") { o.chasse = Math.max(0, Math.floor(+val())); }
    else if (a === "--releve") { o.releve = val(); if (!["jeu", "tot", "epieu", "plaine", "age1"].includes(o.releve) && !/^min\d+$/.test(o.releve)) throw new Error("--releve : jeu (la règle du jeu, par défaut), tot (l’ancienne : cabane et première exploration), epieu, plaine, age1 ou minN (essais de déclenchement)"); }
    else if (a === "--cycles") o.cycles = Math.max(1, Math.floor(+val()));
    else if (a === "--cout") val().split(",").filter(Boolean).forEach((p) => { // --cout riviere=2,collines=3
      const [z, v] = p.split("=");
      if (!D.PASSAGES[z] || !(+v > 0)) throw new Error("--cout : « " + p + " » inconnu (passages : " + Object.keys(D.PASSAGES).join(" ") + ")");
      o.cout[z] = +v;
    });
    else throw new Error("option inconnue : " + a + " (voir l’en-tête de tools/sim-passages.js)");
  }
  if (o.joueur) appliquerJoueur(o, o.joueur, donne);
  o.donne = donne;
  return o;
}
/* un type de joueur : ses réglages, sauf ceux qu’on a donnés à la main */
function appliquerJoueur(o, nom, donne) {
  const j = JOUEURS[nom];
  for (const k of ["taps", "reflexion", "retour", "fouilles"]) if (!donne[k]) o[k] = j[k];
  if (!donne.sessions) o.sessions = j.sessions ? Object.assign({}, j.sessions) : null;
  o.joueur = nom;
  return o;
}

/* ------------------------------------------------------------------ une partie */
function play(o) {
  let T = 1e12;
  const T0 = T, E = createEngine({ now: () => T, rand: () => 0.5 }), S = () => E.state;
  const parc = !!o.parcours; // le vrai premier parcours : partie neuve, il découvre tout par des essais
  if (!parc) for (const id in I) if (I[id].r && !I[id].sec && !I[id].path) E.learn(id, true); // il connaît tout
  const avecMem = Object.keys(o.mem).length > 0;
  if (avecMem) { S().meta.mem = Object.assign({}, o.mem); E.recalc(); E.newCycle(); } // paquetage, raccourci
  const R = rng(o.graine || 1); // le hasard du joueur (reproductible) ; le moteur garde son rand fixe
  const pioche = (a) => a[Math.floor(R() * a.length)];
  const prendreDon = () => { if (o.don) { S().donsOffre = [o.don]; E.donChoose(o.don); } };
  prendreDon();
  const carnet = o.carnet === null ? (avecMem ? 4 : -1) : o.carnet;
  const decouvert = new Set(Object.keys(I).filter((id) => I[id].r && I[id].a <= carnet)); // recettes déjà faites

  let rows = [], traces = 0, prete = {}, debut = 0, pense0 = 0; // le cycle en cours (prete : minute où l’objet-clé rend le passage possible)
  let absent = 0, partir = false, pense = 0, penseTotal = 0, absDebut = 0, sesDebut = 0; // absent : ms d’absence cumulées ; sesDebut : minutes actives au début de la séance
  const minutes = () => (T - T0 - absent) / 60000, cyc = () => minutes() - debut;
  const ouverts = () => { for (const z in S().pass) if (S().pass[z].done) rows.push({ z, t: 0, age: S().age, traces: 0, offert: true }); };
  ouverts();
  E.on("passage", (z) => { if (prete[z] === undefined) prete[z] = cyc(); });
  E.on("passdone", ({ z, tr }) => {
    traces += tr; rows.push({ z, t: cyc(), ecoule: cyc() + (absent - absDebut) / 60000, age: S().age, traces, prete: prete[z], pense: penseTotal / 60 - pense0 });
    if (o.offline > 0 && !o.sessions) partir = true;
  });

  /* objectifs du jeu, avec leur indice (E.objective ne sait pas regarder plus loin) */
  const objs = D.OBJECTIVES.map((x, i) => (Array.isArray(x) ? { i, k: "craft", id: x[0] } : Object.assign({ i }, x)));
  const fait = (x) => x.k === "craft" ? S().made[x.id] > 0
    : x.k === "pass" ? !!(S().pass[x.z] && S().pass[x.z].done)
    : x.k === "exp" ? (S().exp.done[x.z] || 0) > E.ZONES[x.z].exps.findIndex((e) => e.id === x.x)
    : x.k === "line" ? !!S().flags.lineDone : !!S().flags.extDone;
  /* l’objectif en cours puis le suivant ; on saute les machines et la pose de l’extracteur
   * (elle se fait toute seule), et l’exploration qui avance déjà */
  function etapes() {
    const ob = E.objective(), out = [];
    for (let i = ob ? ob.i : objs.length; i < objs.length && out.length < 2; i++) {
      const x = objs[i];
      if (fait(x) || x.k === "line" || x.k === "ext" || (x.k === "exp" && S().exp.active)) continue;
      out.push(x);
    }
    return out;
  }

  /* ---- matières : où récolter, combien ça coûte en secondes de main ---- */
  let need = {}, urgent = {}, planned = {}, invest = null, rr = 0, tapAcc = 0, attente = 0, gels = 0;
  let evite = new Set(); // investissements abandonnés (trop longs à réunir) pour ce cycle
  const plat = new Set(); // objets dont la fabrication en chaîne s’est figée
  function bestZone(r) {
    let best = null, by = 0;
    for (const z of E.openZones()) if (z.res.includes(r) && E.tapYield(r, z.id) > by) { by = E.tapYield(r, z.id); best = z.id; }
    return best;
  }
  const handRate = (r) => (bestZone(r) ? o.taps * E.tapYield(r, bestZone(r)) : 0); // unités par seconde à la main
  const gathered = (id) => I[id].t === "res" && E.RES_ZONE[id] && E.zoneOpen(E.RES_ZONE[id]);
  /* matières brutes d’un objet fabriqué de zéro */
  function leaves(id, qty, out, d) {
    out = out || {}; d = d || 0;
    if (!I[id].r || gathered(id) || d > 12) { out[id] = (out[id] || 0) + qty; return out; }
    const n = Math.ceil(qty / I[id].r[2]), cost = E.isScaled(I[id]) ? E.totalCost(id, n) : null;
    for (const i in I[id].r[1]) leaves(i, cost ? cost[i] : I[id].r[1][i] * n, out, d + 1);
    return out;
  }
  const secs = (lv) => Object.keys(lv).reduce((a, r) => a + (handRate(r) ? lv[r] / handRate(r) : Infinity), 0);

  /* ---- ordres : ce qu’il faut avoir (id, qty) → récolte à faire, ou mise en file ---- */
  function queue(id, k, chaine) {
    const frais = (chaine === false ? [id] : E.plan(id, k).steps.map((s) => s[0])).filter((x) => !decouvert.has(x));
    if (!E.queue(id, k, chaine !== false).ok) return;
    frais.forEach((x) => decouvert.add(x));
    if (parc) return; // le vrai parcours compte la découverte à part (decouvrir) ; fabriquer ensuite ne demande plus de réfléchir
    pense += frais.length * o.reflexion; penseTotal += frais.length * o.reflexion;
  }

  /* ---- le vrai parcours : voir chaque matière, puis découvrir la recette de l’étape en cours par des essais ---- */
  let essais = 0, essaisPar = {};
  function voirTout() { // un joueur touche chaque tuile de la terre : la matière est « vue » (le thermomètre et l’étude en ont besoin)
    for (const z of E.openZones()) for (const r of z.res) if (!S().seen[r] && gathered(r)) E.tap(r, z.id);
  }
  /* un essai de plus : quoi essayer, selon l’hypothèse sur le joueur.
   *  enigme : la bonne combinaison d’emblée (il a résolu l’énigme) ;
   *  hasard : une action et une à trois matières vues, tirées au sort, jamais deux fois la même ;
   *  guide  : il lit le thermomètre comme le moteur le donne (« why ») : « geste » = les bonnes matières, mauvaise action, donc il change d’action ;
   *           « manque » = il lui faut une matière de plus ; « trop » = une de trop ; « tiède » = bonne action, il varie les matières ;
   *           « frais » = une matière sert ailleurs, il change d’action ; « froid » = il tire au sort. Il suit aussi les indices du guide (l’action). */
  function prochainEssai(cible, tried, best) {
    const T0 = I[cible], vues = Object.keys(S().seen).filter((i) => I[i] && !I[i].sec);
    if (o.decouverte === "enigme") return { ge: T0.r[0], ids: Object.keys(T0.r[1]) };
    const gestes = (S().hints[cible] >= 1 && D.GESTE_ORDER.includes(T0.r[0]) ? [T0.r[0]] : D.GESTE_ORDER).filter((g) => E.gesteOK(g));
    // une combinaison déjà essayée dans la partie ne rapporte plus de souvenirs au guide (S.tried) : un joueur ne la refait pas
    const cle = (ge, ids) => E.keyOf(ge, ids);
    const deja = (ge, ids) => tried.has(cle(ge, ids)) || !!S().tried[cle(ge, ids)];
    const alea = () => { // deux matières le plus souvent, parfois une ou trois
      const pool = vues.slice(), ids = [], r = R();
      for (let n = r < 0.2 ? 1 : r < 0.75 ? 2 : 3; n > 0 && pool.length; n--) ids.push(pool.splice(Math.floor(R() * pool.length), 1)[0]);
      return { ge: pioche(gestes), ids };
    };
    const voisins = () => {
      const { ge, ids, why } = best, autres = vues.filter((x) => !ids.includes(x)), out = [];
      const autreGeste = gestes.filter((g) => g !== ge).map((g) => ({ ge: g, ids }));
      const ajoute = ids.length < 3 ? autres.map((x) => ({ ge, ids: ids.concat(x) })) : [];
      const retire = ids.length > 1 ? ids.map((x) => ({ ge, ids: ids.filter((y) => y !== x) })) : [];
      const echange = ids.flatMap((x) => autres.map((y) => ({ ge, ids: ids.map((z) => (z === x ? y : z)) })));
      if (why === "geste" || why === "frais") out.push(...autreGeste, ...echange);
      else if (why === "manque") out.push(...ajoute, ...echange);
      else if (why === "trop") out.push(...retire, ...echange);
      else out.push(...echange, ...ajoute, ...retire); // tiède
      return out.filter((c) => !deja(c.ge, c.ids));
    };
    let c = null;
    if (o.decouverte === "guide" && best.ids && best.t >= 1) { const v = voisins(); if (v.length) c = v[Math.floor(R() * Math.min(v.length, 6))]; }
    for (let tr = 0; !c && tr < 200; tr++) { const x = alea(); if (!deja(x.ge, x.ids)) c = x; }
    c = c || alea();
    tried.add(cle(c.ge, c.ids));
    return c;
  }
  /* découvrir la recette de « cible » par des essais ; renvoie vrai si trouvée. Le temps des essais est du temps de réflexion (pas de récolte). */
  function decouvrirId(cible, plafond) {
    const tried = new Set(), best = { t: -1 };
    let n = 0;
    while (!S().known[cible] && n < plafond) {
      const c = prochainEssai(cible, tried, best), r = E.attempt(c.ge, c.ids);
      n++;
      if (r.kind === "fail" && r.temp >= best.t) { best.t = r.temp; best.ge = c.ge; best.ids = c.ids; best.why = r.why; }
    }
    const sec = n * (o.decouverte === "enigme" ? o.reflexion : o.essai);
    pense += sec; penseTotal += sec; essais += n; essaisPar[cible] = (essaisPar[cible] || 0) + n;
    return !!S().known[cible];
  }
  /* un objet dont on a besoin (le coût d’un lieu à explorer, d’un passage…) sans que le guide en parle : il le cherche, trois fois au plus (40 essais), puis il continue d’autres choses */
  const requis = {};
  function decouvrirRequis(id, prof) {
    // une matière pas encore vue : s’il sait la fabriquer, il la fabrique ; sinon il cherche d’abord sa recette (le charbon pour la torche)
    const manque = Object.keys(I[id].r[1]).filter((i) => !S().seen[i]);
    for (const i of manque) {
      if (!I[i].r || I[i].sec || I[i].path) continue;
      if (S().known[i]) { if (!E.queued(i)) order(i, 1); }
      else if ((prof || 0) < 3) decouvrirRequis(i, (prof || 0) + 1);
    }
    if (manque.length) return true; // pas encore prêt : on réessaiera quand tout sera vu
    if ((requis[id] || 0) >= 3) return false;
    requis[id] = (requis[id] || 0) + 1;
    return !decouvrirId(id, 40) ? true : false;
  }
  /* l’étape en cours de l’objectif : le guide la souffle (souvenirs), donc elle finit toujours par se trouver */
  function decouvrir() {
    const g = E.guide(), step = g && g.step;
    if (!step || !I[step] || !I[step].r || S().known[step] || I[step].sec || I[step].path) return;
    const inconnues = Object.keys(I[step].r[1]).filter((i) => !S().seen[i]);
    if (inconnues.length) { // il lui manque encore de voir une matière : il la récolte, ou fabrique la pièce qu’il connaît déjà (l’archet pour le feu)
      inconnues.forEach((i) => { if (I[i].r && S().known[i] && !E.queued(i)) order(i, 1); });
      return;
    }
    decouvrirId(step, 80);
  }

  /* ---- ordres : ce qu’il faut avoir (id, qty) → récolte à faire, ou mise en file ---- */
  function order(id, qty, depth) {
    const it = I[id], d = Math.ceil(qty - E.count(id) - E.queued(id) - 1e-9);
    if (d <= 0) return;
    if (gathered(id)) { need[id] = (need[id] || 0) + d; return; }
    if (!it.r) return; // matière d’une terre fermée : le passage ou l’objet-clé s’en occupe
    const s = E.nextStep(id); // station, objet-clé d’une terre… à faire d’abord
    if (s.why === "pass") return;
    if (s.id !== id) { if ((depth || 0) < 8) order(s.id, 1, (depth || 0) + 1); return; }
    const times = E.isUnique(it) ? 1 : d;
    if (plat.has(id)) { // chaîne figée : les ingrédients d’abord, puis la pièce quand ils sont en stock
      const c = E.totalCost(id, times);
      if ((depth || 0) < 10) for (const i in c) order(i, c[i], (depth || 0) + 1);
      const k = Math.min(times, E.maxCraftable(id, times));
      if (k >= Math.min(times, 6)) queue(id, k, false);
      return;
    }
    const p = E.plan(id, times);
    for (const m in p.missing) if (gathered(m)) need[m] = (need[m] || 0) + p.missing[m];
    if (p.ok) return queue(id, times);
    const k = E.isUnique(it) ? 0 : E.maxPlan(id, times); // en plusieurs fois s’il y en a beaucoup
    if (k >= Math.min(times, 6)) queue(id, k);
  }
  function souhaits(x) {
    if (!x) return [];
    // l’objectif demande de FABRIQUER l’objet (S.made) : le stock du paquetage ne compte pas
    if (x.k === "craft") return [[x.id, S().made[x.id] > 0 ? 1 : E.count(x.id) + 1]];
    const n = x.k === "exp" && E.nextExp(x.z);
    return n && n.x.id === x.x ? Object.entries(n.x.cost || {}) : [];
  }

  /* ---- investir : extracteurs, outils et améliorations de récolte ---- */
  function gain(id, total) { // secondes de main économisées par seconde (et la matière visée)
    const it = I[id], e = it.e || {};
    let g = 0, res = null;
    if (it.t === "ext") {
      for (const r in it.p) {
        const dep = E.deposits().find((d) => d.z === it.z && d.res === r);
        if (!need[r] || !dep || !handRate(r)) continue;
        const v = E.extOut({ u: { [id]: 1 }, res: r }) / handRate(r);
        if (v > g) { g = v; res = r; }
      }
      return { g, res };
    }
    for (const r in need) {
      const h = handRate(r), z = bestZone(r);
      if (!h) continue;
      const mt = e.tap ? (e.tap[r] || 1) * (e.tap[z] || 1) * (e.tap["*"] || 1) : 1;
      const ma = e.auto ? (e.auto[E.RES_ZONE[r]] || 1) * (e.auto["*"] || 1) : 1;
      g += (mt - 1) * (need[r] / h / total) + (ma - 1) * E.rate(r) / h;
    }
    return { g, res: null };
  }
  function chooseInvest() {
    const total = Object.keys(need).reduce((a, r) => a + (handRate(r) ? need[r] / handRate(r) : 0), 0); // reste à récolter, en s
    let best = null;
    if (total < 10) return null;
    for (const id in I) {
      const it = I[id];
      if (!it.r || it.sec || it.path || it.a > S().age || (it.e && it.e.zone) || !["ext", "tool", "upg"].includes(it.t)) continue;
      if (it.t !== "ext" && (!it.e || !(it.e.tap || it.e.auto))) continue;
      if (E.isUnique(it) && S().made[id] > 0 || evite.has(id)) continue;
      const g = gain(id, total);
      if (!(g.g > 0) || E.nextStep(id).id !== id) continue;
      const pb = secs(leaves(id, 1)) / g.g; // temps de remboursement
      if (pb <= o.retour && total >= pb && (!best || pb < best.pb)) best = { id, pb, base: E.count(id), t0: minutes() };
      if (best && best.id === id) planned[id] = g.res;
    }
    // un joueur lit son Carnet : une recette inconnue dont l’effet l’intéresse, il la cherche (sans l’aide du guide, qui ne souffle que l’étape en cours)
    // (au cycle 1, il ne fait que suivre le guide : il n’a pas encore compris que le Carnet lui montre les recettes à chercher)
    if (parc && best && !S().known[best.id] && (!rel || !(o.chasse > 0))) { evite.add(best.id); return chooseInvest(); } // par défaut (--chasse 0) : seulement les recettes qu’il connaît
    if (parc && best && !S().known[best.id]) {
      const vues = Object.keys(I[best.id].r[1]).every((i) => S().seen[i]);
      if (!vues || !decouvrirId(best.id, o.chasse)) { evite.add(best.id); return chooseInvest(); }
    }
    return best;
  }
  /* un extracteur fabriqué se pose sur le gisement de la matière demandée */
  function place() {
    const U = E.extUnits();
    for (const t of E.EXTS) {
      const n = U[t].own - U[t].used;
      if (n < 1) continue;
      const deps = E.deposits().filter((d) => d.z === I[t].z && E.extRate(t, d.res) > 0)
        .sort((a, b) => (b.res === planned[t]) - (a.res === planned[t]) || (need[b.res] || 0) - (need[a.res] || 0) || E.extRate(t, b.res) - E.extRate(t, a.res));
      if (deps.length) E.domExtSet(deps[0].z, deps[0].res, t, ((E.domExt(deps[0].z, deps[0].res) || { u: {} }).u[t] || 0) + n);
    }
  }

  /* ---- la tête du joueur : une fois par demi-seconde ---- */
  function brain() {
    need = {};
    if (parc) { voirTout(); decouvrir(); }
    /* défaut du moteur : une fabrication en chaîne peut se figer (étape placée avant sa sous-pièce).
     * Comme un joueur, il l’annule au bout de 5 s et la refait pièce par pièce. */
    const j0 = S().hand.q[0];
    attente = j0 && j0.w ? attente + 0.5 : 0;
    if (attente >= 5) { plat.add(j0.id); E.cancelJob(0); attente = 0; gels++; }
    const [a, b] = etapes();
    if (invest && (E.count(invest.id) > invest.base || minutes() - invest.t0 > 4)) { // fait, ou abandonné au bout de 4 min
      if (E.count(invest.id) <= invest.base) evite.add(invest.id);
      invest = null;
    }
    const W = [];
    E.passPending().forEach((z) => { const p = E.passInfo(z); for (const i in p.left) W.push([i, p.left[i]]); });
    souhaits(a).forEach((w) => W.push(w));
    W.forEach(([id, q]) => order(id, q));
    const gros = need;
    need = {};
    if (invest) order(invest.id, invest.base + 1); // petit achat : ses besoins passent avant le gros besoin
    urgent = need;
    need = gros;
    for (const r in urgent) need[r] = (need[r] || 0) + urgent[r];
    if (!Object.keys(need).length && !E.passPending().length) souhaits(b).forEach(([id, q]) => order(id, q)); // il prépare la suite
    if (a && a.k === "exp" && !S().exp.active) E.startExp(a.z);
    // les lieux de la terre d’avant, à explorer avant de franchir un passage :
    // il prépare ce qu’ils coûtent (une torche, par exemple), puis les lance
    E.passPending().forEach((z) => {
      const p = E.passInfo(z);
      if (!p.lieux || !p.lieux.left.length) return;
      const n = E.nextExp(p.lieux.z);
      if (!n || n.locked) return;
      const c = n.x.cost || {};
      // le lieu demande un objet qu’il ne sait pas encore faire (une torche) : il le cherche. Avant la relève du jeu actuel (--releve tot), ce n’est pas sur son chemin : il suit le guide.
      if (parc && (rel || !["tot", "epieu"].includes(o.releve))) for (const i in c) if (I[i] && I[i].r && !S().known[i] && !I[i].sec && !I[i].path) decouvrirRequis(i);
      for (const i in c) order(i, Math.ceil(c[i]));
      if (!S().exp.active && !Object.keys(c).some((i) => (S().inv[i] || 0) < c[i])) E.startExp(p.lieux.z);
    });
    E.passPending().forEach((z) => E.passPour(z)); // il verse dès qu’il peut
    place();
    if (!invest) invest = chooseInvest();
  }
  function tapOnce() {
    let best = null, sc = -Infinity;
    const pick = (src) => {
      for (const r in src) {
        const y = bestZone(r) && E.tapYield(r, bestZone(r));
        if (src[r] <= 0 || !y) continue;
        const s = (src[r] - E.rate(r) * 15) / y; // ce que les extracteurs apporteront n’est pas à récolter
        if (s > sc) { sc = s; best = r; }
      }
    };
    pick(urgent);
    if (!best) pick(need);
    if (!best) { best = ["bois", "fibre", "caillou"][rr++ % 3]; } // à tour de rôle
    const g = E.tap(best, bestZone(best));
    if (need[best] > 0) need[best] -= g;
    if (urgent[best] > 0) urgent[best] -= g;
  }

  /* ---- le mur : le prochain passage, versé en partie ou pas encore possible ---- */
  function mur() {
    const ob = E.objective(), pend = E.passPending()[0], z = pend || (objs.find((x) => x.k === "pass" && !fait(x)) || {}).z;
    return z && { z, info: E.passInfo(z), objectif: ob && (ob.n || ob.id) };
  }
  /* la relève : Traces gagnées, puis achats de Mémoire dans l’ordre, tant que les Traces suffisent */
  function releve() {
    E.newCycle();
    prendreDon();
    for (const id of ACHATS) if (!E.memBuy(id) && E.memCost(id) !== undefined) break;
    need = {}; urgent = {}; planned = {}; invest = null; evite = new Set(); rows = []; traces = 0; prete = {}; debut = minutes(); pense0 = penseTotal / 60; absDebut = absent; sesDebut = minutes();
    ouverts();
  }

  /* la relève obligatoire du premier parcours : +3 Traces, un premier achat de Mémoire, et le cycle 2 repart */
  let rel = null;
  /* quand la relève obligatoire se déclenche : le jeu actuel (cabane posée et première exploration), ou, pour comparer, une fois la Plaine franchie / l’Âge de l’Os atteint */
  const declencheur = () => {
    if (o.releve === "jeu") return E.canForcedReleve(); // la règle du jeu
    // les autres : des déclenchements d’essai, sur la partie du cycle 1 (parcours en cours)
    if (!(S().meta.parcours && !S().meta.forcedDone && S().cycle === 1)) return false;
    if (o.releve === "tot") return !!(S().flags.extDone && S().exp.done.lisiere >= 1); // l’ancienne règle : cabane posée et première exploration faite
    if (o.releve === "epieu") return S().flags.extDone && S().exp.done.lisiere >= 1 && S().made.epieu > 0;
    if (/^min\d+$/.test(o.releve)) return S().flags.extDone && S().exp.done.lisiere >= 1 && minutes() >= +o.releve.slice(3);
    if (o.releve === "plaine") return !!(S().pass.plaine && S().pass.plaine.done);
    if (o.releve === "age1") return S().age >= 1;
    return true;
  };
  function releveForcee() {
    rel = { t: minutes(), pense: penseTotal / 60, essais, essaisPar: Object.assign({}, essaisPar), connues: Object.keys(S().known).length };
    E.forcedReleve();
    if (o.achat === "auto") { for (const id of ACHATS) if (!E.memBuy(id) && E.memCost(id) !== undefined) break; } // il dépense ses Traces dans l'ordre habituel
    else if (o.achat && o.achat !== "aucun") E.memBuy(o.achat);
    need = {}; urgent = {}; planned = {}; invest = null; evite = new Set(); rows = []; traces = 0; prete = {}; debut = minutes(); pense0 = penseTotal / 60; absDebut = absent; sesDebut = minutes();
    ouverts();
  }

  /* ---- la boucle : pas de 100 ms, 4 appuis par seconde ---- */
  const cycles = [];
  /* --fouilles : la plus haute terre où un lieu déjà exploré a un niveau de fouille à faire qui tient dans l’absence */
  function lancerFouille(heures) {
    for (let k = D.ZONES.length - 1; k >= 0; k--) {
      const z = D.ZONES[k];
      for (let i = 0; i < z.exps.length; i++) {
        if (!E.fouilleLieuOk(z.id, i)) continue;
        const lvl = E.fouilleNiveau(z.id, z.exps[i].id) + 1;
        if (lvl <= D.FOUILLE.niveaux.length && D.FOUILLE.niveaux[lvl - 1].s <= heures * 3600 && E.fouilleLancer(z.id, i, lvl).ok) return;
      }
    }
  }
  let objPrec = -1;
  for (let c = 1; ; c++) {
    for (let step = 0; cyc() < o.minutes; step++) {
      T += 100;
      E.update();
      if (parc && !rel && step % 5 === 0 && declencheur()) releveForcee();
      if (o.journal && step % 10 === 0) { // --journal : l’heure de chaque objectif franchi
        const ob = E.objective();
        if (ob && ob.i !== objPrec) { objPrec = ob.i; console.log("  " + mm(cyc()) + " min  objectif " + String(ob.i).padStart(2) + " : " + (ob.id || ob.n)); }
      }
      if (o.sessions && !partir && minutes() - sesDebut >= o.sessions.actif && cyc() < o.minutes) partir = true; // la séance est finie : il range le téléphone (pas d’absence après la toute dernière minute)
      if (partir) { // absence : E.catchUp ; avec --fouilles, il part fouiller (le meilleur niveau qui tient dans l’absence) et reçoit le butin au retour
        partir = false;
        const heures = o.sessions ? o.sessions.absent : o.offline;
        if (o.fouilles) lancerFouille(heures);
        T += heures * 3600e3; absent += heures * 3600e3; E.update();
        if (o.fouilles) E.fouilleRecolter();
        sesDebut = minutes();
      }
      if (pense > 0) { pense -= 0.1; continue; } // il réfléchit à l’Atelier : ni décision ni récolte
      if (step % 5 === 0) brain();
      tapAcc += o.taps / 10;
      for (; tapAcc >= 1; tapAcc--) tapOnce();
    }
    cycles.push({ rows, traces, mem: Object.assign({}, S().meta.mem), mur: mur() });
    if (c >= o.cycles || !E.canReleve()) break;
    if (o.journal) console.log("  --- relève " + c + " : +" + E.releveGain() + " Traces");
    releve();
  }

  /* ---- bilan (fin du dernier cycle) ---- */
  const ext = {};
  E.EXTS.forEach((t) => { if (E.count(t) >= 1) ext[t] = Math.floor(E.count(t)); });
  const stocks = Object.keys(S().inv).filter((i) => I[i] && I[i].t === "res" && S().inv[i] >= 1).sort((a, b) => S().inv[b] - S().inv[a]).slice(0, 8).map((i) => i + " " + Math.floor(S().inv[i]));
  const rend = ["bois", "fibre", "caillou", "os", "cuir", "argile", "silex", "sable", "malachite", "fer_min"].filter((i) => gathered(i) && bestZone(i))
    .map((i) => i + " " + Math.round(handRate(i)) + "|" + Math.round(E.rate(i)));
  const last = cycles[cycles.length - 1];
  return { rel, essais, essaisPar, E, cycles, rows: last.rows, traces: last.traces, mur: last.mur, ext, stocks, rend, age: S().age, minutes: cyc(), ecoule: cyc() + (absent - absDebut) / 60000, absent: absent / 3.6e6, penseTotal, gels, taps: S().stats.taps, crafts: S().stats.crafts };
}

/* ------------------------------------------------------------------ affichage */
const nomPass = (z) => D.PASSAGES[z].n + " (" + z + ")";
const mm = (t) => t.toFixed(1).padStart(6);
const hm = (min) => { const m = Math.round(min); return Math.floor(m / 60) + ":" + String(m % 60).padStart(2, "0"); }; // des minutes en h:mm
const memTxt = (m) => (Object.keys(m).length ? Object.keys(m).map((k) => k + "=" + m[k]).join(",") : "aucune");
function murTxt(r) {
  if (!r.mur) return "aucun passage en vue";
  const p = r.mur.info, left = p && p.ready ? Object.entries(p.left).map(([i, q]) => i + " " + q).join(", ") : "";
  return nomPass(r.mur.z) + (p && p.ready ? " versé à " + Math.round(p.frac * 100) + " %, reste : " + left : " pas encore possible, objectif : " + r.mur.objectif);
}
function afficher(o, r) {
  console.log("Joueur simulé : " + (o.joueur ? o.joueur + " · " : "") + o.taps + " appuis/s · réflexion " + o.reflexion + " s" +
    " · mémoire : " + memTxt(o.mem) + " · " + o.minutes + " min de jeu actif" + (o.offline && !o.sessions ? " · absence de " + o.offline + " h après chaque passage" : "") +
    (o.sessions ? " · séances de " + o.sessions.actif + " min, absences de " + o.sessions.absent + " h" : ""));
  console.log("\n  Passage                         Minute  Durée dont réfl. Versé en  Âge                   Traces" + (o.sessions ? "  Écoulé" : ""));
  let prev = 0, prevP = 0;
  r.rows.forEach((x) => {
    console.log("  " + nomPass(x.z).padEnd(32) + (x.offert ? "offert".padStart(6) : mm(x.t)) + (x.offert ? "".padStart(21) : mm(x.t - prev) + mm(x.pense - prevP) + "  " + mm(x.t - x.prete)) + "  " +
      D.AGES[x.age].n.padEnd(22) + String(x.traces).padStart(4) + (x.offert ? "  (raccourci : pas de Traces)" : (o.sessions ? "  " + hm(x.ecoule).padStart(6) : "")));
    if (!x.offert) { prev = x.t; prevP = x.pense; }
  });
  if (!r.rows.length) console.log("  (aucun passage franchi)");
  console.log("\n  Mur à " + r.minutes.toFixed(0) + " min : " + murTxt(r));
  console.log("  Stocks : " + r.stocks.join(", "));
  console.log("  Récolte par seconde (main|extracteurs) : " + r.rend.join(", "));
  console.log("  Extracteurs : " + (Object.keys(r.ext).map((t) => t + "×" + r.ext[t]).join(", ") || "aucun") + " · Traces gagnées par les passages : " + r.traces);
  console.log("  Réflexion cumulée : " + (r.penseTotal / 60).toFixed(1) + " min · appuis : " + r.taps + " · fabrications : " + r.crafts + (r.absent ? " · absences : " + r.absent.toFixed(0) + " h" : "") +
    (r.gels ? " · chaînes figées par le moteur, refaites pièce par pièce : " + r.gels : ""));
}
function afficherCycles(o, r) {
  console.log("Joueur simulé : " + o.cycles + " cycles de " + o.minutes + " min de jeu actif · réflexion " + o.reflexion + " s (une fois par recette, le Carnet reste acquis)");
  r.cycles.forEach((c, i) => {
    console.log("\n  Cycle " + (i + 1) + " · mémoire : " + memTxt(c.mem) + " · Traces gagnées : " + c.traces);
    console.log("    " + (c.rows.map((x) => x.z + " " + (x.offert ? "offert" : x.t.toFixed(1))).join(" · ") || "aucun passage franchi"));
    console.log("    mur : " + murTxt(c));
  });
}
/* un jeu par don : le temps de chaque passage, et l’écart avec le jeu sans don (mêmes réglages) */
function comparerDons(o) {
  if (!Object.keys(o.mem).length) o.mem = { recolte: 2, extr: 2, mains: 2 };
  const base = play(Object.assign({}, o, { don: null, cycles: 1 }));
  const zs = Object.keys(D.PASSAGES).filter((z) => base.rows.some((x) => x.z === z && !x.offert));
  const t = (r, z) => { const x = r.rows.find((y) => y.z === z); return x && !x.offert ? x.t : null; };
  console.log("Dons, un par un (" + o.minutes + " min, mémoire : " + memTxt(o.mem) + "). Écart du temps de chaque passage avec le jeu sans don, en %.\n");
  console.log("  " + "don".padEnd(15) + zs.map((z) => z.slice(0, 7).padStart(8)).join("") + "   moyenne  dernier");
  console.log("  " + "(sans don, min)".padEnd(15) + zs.map((z) => mm(t(base, z)).padStart(8)).join(""));
  D.DONS.forEach((d) => {
    const r = play(Object.assign({}, o, { don: d.id, cycles: 1 }));
    const ec = zs.map((z) => (t(r, z) === null ? null : (t(r, z) / t(base, z) - 1) * 100));
    const ok = ec.filter((x) => x !== null), moy = ok.reduce((a, b) => a + b, 0) / (ok.length || 1);
    console.log("  " + d.id.padEnd(15) + ec.map((x) => (x === null ? "—" : (x > 0 ? "+" : "") + x.toFixed(1)).padStart(8)).join("") + (moy > 0 ? "   +" : "   ") + moy.toFixed(1).padStart(6) + (ok.length ? (ec[ok.length - 1] > 0 ? "  +" : "  ") + ok[ok.length - 1].toFixed(1) : ""));
  });
}
/* ---- les types de joueur : un jeu par profil, mêmes réglages, côte à côte ---- */
function lancerJoueurs(o, noms) {
  return noms.map((nom) => {
    const oo = appliquerJoueur(Object.assign({}, o, { mem: Object.assign({}, o.mem), joueurs: false, json: false }), nom, o.donne || {});
    return { nom, o: oo, r: play(oo) };
  });
}
const reglageTxt = (x) => x.o.taps + " appuis/s · réflexion " + x.o.reflexion + " s · retour " + x.o.retour + " s · " +
  (x.o.sessions ? "séances de " + x.o.sessions.actif + " min, absences de " + x.o.sessions.absent + " h" : "sans interruption") + (x.o.fouilles ? " · fouilles" : "");
/* le résultat d'un profil, sous une forme qu'un autre programme peut lire */
function exporter(o, x) {
  const R = x.r;
  return {
    reglages: { taps: x.o.taps, reflexion: x.o.reflexion, retour: x.o.retour, sessions: x.o.sessions, fouilles: x.o.fouilles, desc: x.nom && JOUEURS[x.nom] ? JOUEURS[x.nom].desc : null },
    cycles: R.cycles.map((c) => ({ traces: c.traces, mem: c.mem, mur: c.mur ? c.mur.z : null,
      passages: c.rows.map((y) => ({ z: y.z, actif: Math.round(y.t * 100) / 100, ecoule: Math.round(y.ecoule * 100) / 100, traces: y.traces, offert: !!y.offert })) })),
    bilan: { minutesActives: Math.round(R.minutes * 100) / 100, minutesEcoulees: Math.round(R.ecoule * 100) / 100, absenceHeures: Math.round(R.absent * 100) / 100,
      appuis: R.taps, fabrications: R.crafts, reflexionMin: Math.round(R.penseTotal / 6) / 10, extracteurs: Object.values(R.ext).reduce((a, b) => a + b, 0), age: D.AGES[R.age].id,
      mur: R.mur ? R.mur.z : null }
  };
}
function comparerJoueurs(o) {
  const noms = Object.keys(JOUEURS), res = lancerJoueurs(o, noms), ref = res[0];
  const nC = Math.max(...res.map((x) => x.r.cycles.length));
  const cell = (x, c, z) => { const cy = x.r.cycles[c]; const y = cy && cy.rows.find((q) => q.z === z); return y && !y.offert ? y : null; };
  const zs = (c) => Object.keys(D.PASSAGES).filter((z) => res.some((x) => cell(x, c, z)));
  const rapport = (a, b) => (a && b && b.t > 0 ? { actif: a.t / b.t, ecoule: a.ecoule / b.ecoule } : null);
  if (o.json) {
    const ecarts = {};
    res.slice(1).forEach((x) => { ecarts[x.nom] = {}; for (let c = 0; c < nC; c++) zs(c).forEach((z) => { const q = rapport(cell(x, c, z), cell(ref, c, z)); if (q) ecarts[x.nom][c + 1 + ":" + z] = { actif: Math.round(q.actif * 100) / 100, ecoule: Math.round(q.ecoule * 100) / 100 }; }); });
    const joueurs = {};
    res.forEach((x) => { joueurs[x.nom] = exporter(o, x); });
    console.log(JSON.stringify({ version: D.VERSION, minutes: o.minutes, cycles: o.cycles, mem: o.mem, referenceEcarts: ref.nom, joueurs, ecarts }, null, 2));
    return;
  }
  console.log("Types de joueur (" + o.minutes + " min de jeu actif" + (o.cycles > 1 ? " par cycle, " + o.cycles + " cycles" : "") + " · mémoire : " + memTxt(o.mem) + ")");
  res.forEach((x) => console.log("  " + x.nom.padEnd(12) + reglageTxt(x) + "\n  " + "".padEnd(12) + JOUEURS[x.nom].desc));
  for (let c = 0; c < nC; c++) {
    console.log("\n" + (nC > 1 ? "Cycle " + (c + 1) + "\n" : "") + "  " + "Passage".padEnd(30) + noms.map((n) => n.padStart(16)).join(""));
    console.log("  " + "".padEnd(30) + noms.map(() => "actif".padStart(8) + "écoulé".padStart(8)).join(""));
    zs(c).forEach((z) => {
      console.log("  " + (z + " (+" + D.PASSAGES[z].tr + ")").padEnd(30) + res.map((x) => { const y = cell(x, c, z); return y ? (y.t.toFixed(1).padStart(8) + hm(y.ecoule).padStart(8)) : "—".padStart(8) + "—".padStart(8); }).join(""));
    });
    console.log("  " + "Traces gagnées".padEnd(30) + res.map((x) => (x.r.cycles[c] ? String(x.r.cycles[c].traces) : "—").padStart(16)).join(""));
  }
  console.log("\nÉcarts à " + ref.nom + " : rapport du temps de chaque passage au sien (× 1,00 = le même). Temps actif ; temps écoulé.");
  console.log("  " + "".padEnd(30) + noms.slice(1).map((n) => n.padStart(20)).join(""));
  const manques = [];
  for (let c = 0; c < nC; c++) {
    zs(c).forEach((z) => {
      const base = cell(ref, c, z);
      const l = res.slice(1).map((x) => { const y = cell(x, c, z), q = rapport(y, base); if (!y && base) manques.push(x.nom + " ne franchit pas " + z + (nC > 1 ? " (cycle " + (c + 1) + ")" : "")); return q ? ("×" + q.actif.toFixed(2) + " ; ×" + q.ecoule.toFixed(2)).padStart(20) : "—".padStart(20); });
      if (base) console.log("  " + ((nC > 1 ? c + 1 + " " : "") + z).padEnd(30) + l.join(""));
    });
  }
  if (manques.length) console.log("\nPas franchis dans la durée simulée : " + manques.join(" ; "));
  console.log("\nBilan à la fin :");
  console.log("  " + "".padEnd(30) + noms.map((n) => n.padStart(16)).join(""));
  const ligne = (nom, f) => console.log("  " + nom.padEnd(30) + res.map((x) => String(f(x.r)).padStart(16)).join(""));
  ligne("Minutes de jeu actif", (r) => r.minutes.toFixed(0));
  ligne("Temps écoulé (h:mm)", (r) => hm(r.ecoule));
  ligne("Absences (h)", (r) => r.absent.toFixed(0));
  ligne("Appuis", (r) => r.taps);
  ligne("Fabrications", (r) => r.crafts);
  ligne("Réflexion (min)", (r) => (r.penseTotal / 60).toFixed(1));
  ligne("Extracteurs posés", (r) => Object.values(r.ext).reduce((a, b) => a + b, 0));
  ligne("Âge atteint", (r) => D.AGES[r.age].id);
  ligne("Prochain mur", (r) => (r.mur ? r.mur.z : "aucun"));
}
function comparer(o) {
  const res = PROFILS.map((p) => play(Object.assign({}, o, { mem: p.mem, cycles: 1 })));
  console.log("Comparaison (" + o.minutes + " min de jeu actif" + (o.offline ? " · absence " + o.offline + " h après chaque passage" : "") + " · réflexion " + o.reflexion + " s, carnet connu jusqu’à l’âge 4 avec une mémoire)\n");
  console.log("  " + "Minute du passage".padEnd(30) + PROFILS.map((p) => p.nom.padStart(18)).join(""));
  Object.keys(D.PASSAGES).forEach((z) => {
    if (!res.some((r) => r.rows.some((x) => x.z === z))) return;
    console.log("  " + (z + " (+" + D.PASSAGES[z].tr + ")").padEnd(30) + res.map((r) => { const x = r.rows.find((y) => y.z === z); return (x ? (x.offert ? "offert" : x.t.toFixed(1)) : "—").padStart(18); }).join(""));
  });
  const ligne = (nom, f) => console.log("  " + nom.padEnd(30) + res.map((r) => String(f(r)).padStart(18)).join(""));
  ligne("Traces gagnées (passages)", (r) => r.traces);
  ligne("Âge atteint", (r) => D.AGES[r.age].id);
  ligne("Extracteurs posés", (r) => Object.values(r.ext).reduce((a, b) => a + b, 0));
  ligne("Réflexion (min)", (r) => (r.penseTotal / 60).toFixed(1));
  console.log("\n  Mur à " + o.minutes + " min :");
  res.forEach((r, i) => console.log("   " + PROFILS[i].nom.padEnd(18) + murTxt(r)));
}

if (require.main === module) {
  try {
    const o = lire(process.argv.slice(2));
    for (const z in o.cout) for (const i in D.PASSAGES[z].cost) D.PASSAGES[z].cost[i] = Math.max(1, Math.round(D.PASSAGES[z].cost[i] * o.cout[z]));
    if (o.dons) comparerDons(o);
    else if (o.compare) comparer(o);
    else if (o.joueurs) comparerJoueurs(o);
    else if (o.json) console.log(JSON.stringify({ version: D.VERSION, joueur: o.joueur, resultat: exporter(o, { nom: o.joueur, o, r: play(o) }) }, null, 2));
    else if (o.cycles > 1) afficherCycles(o, play(o));
    else afficher(o, play(o));
  } catch (e) { console.error(e.message); process.exitCode = 1; }
}
module.exports = { play, lire, PROFILS, JOUEURS, appliquerJoueur, comparerJoueurs };
