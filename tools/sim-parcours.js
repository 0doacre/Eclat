#!/usr/bin/env node
/* Le vrai premier parcours d’un nouveau joueur, mesuré (le moteur réel, sans écran, horloge virtuelle).
 *
 *   node tools/sim-parcours.js [--minutes 40] [--essai 8] [--graines 9] [--chasse 10] [--ecrire] [--json]
 *
 * Ce que le simulateur fait (tools/sim-passages.js --parcours) :
 *  1. Partie neuve : AUCUNE recette connue d’avance. Le joueur voit chaque matière, puis DÉCOUVRE la recette de l’étape en cours
 *     par des essais (E.attempt du moteur : thermomètre, et souvenirs du guide qui finissent par donner l’action, une matière,
 *     puis la recette). Chaque essai prend du temps (--essai secondes) pendant lequel il ne récolte pas.
 *  2. La relève obligatoire du cycle 1 est prise dès qu’elle se déclenche (E.canForcedReleve : le premier passage, la Plaine, est franchi) : +3 Traces.
 *  3. Un premier achat de Mémoire avec ces Traces (un par colonne : aucun, Mains calleuses, Mains sûres, Mémoire des gisements).
 *  4. Cycle 2 (--minutes) : il ne connaît que ce qu’il a appris au cycle 1. On note la minute où il franchit la Plaine et la Rivière.
 *
 * Trois hypothèses sur la façon de découvrir (c’est la partie incertaine : seul de vrais joueurs la fixeront) :
 *  - énigme : il résout l’énigme d’emblée (la bonne combinaison, 20 s de réflexion). C’est l’ancien modèle : la borne basse.
 *  - guide  : il suit le thermomètre et les indices (un essai par --essai s) ; plusieurs graines de hasard, médiane [min–max].
 *  - hasard : il essaie au hasard (même --essai, mêmes graines) : la borne haute.
 * La vitesse de récolte (4 appuis/s) est celle du type « tapeur » de sim-passages.js ; elle compte pour l’après-relève. Voir le rapport
 * docs/revue/simulation-premier-parcours.md (--ecrire) pour les tableaux. Le moteur n’est jamais modifié. */
"use strict";
const fs = require("fs"), path = require("path"), { execSync } = require("child_process");
const D = require("../js/data.js");
const { play, lire } = require("./sim-passages.js");

const POLITIQUES = [["enigme", "énigme résolue d’emblée"], ["guide", "thermomètre et indices"], ["hasard", "au hasard"]];
const ACHATS = [["aucun", "aucun achat"], ["recolte", "Mains calleuses"], ["mains", "Mains sûres"], ["extr", "Mém. des gisements"]];
const FICHIER = path.join(__dirname, "..", "docs/revue/simulation-premier-parcours.md");

function reglages(argv) {
  const o = { minutes: 40, essai: 8, graines: 9, chasse: 10, ecrire: false, json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i], val = () => argv[++i];
    if (a === "--minutes") o.minutes = +val();
    else if (a === "--essai") o.essai = +val();
    else if (a === "--graines") o.graines = Math.max(1, Math.floor(+val()));
    else if (a === "--chasse") o.chasse = Math.max(1, Math.floor(+val()));
    else if (a === "--ecrire") o.ecrire = true;
    else if (a === "--json") o.json = true;
    else throw new Error("option inconnue : " + a + " (voir l’en-tête de tools/sim-parcours.js)");
  }
  return o;
}

/* une partie du premier parcours ; renvoie ce qu’on en retient */
function une(pol, achat, graine, r, chasse, releve) {
  const o = lire(["--parcours", "--minutes", String(r.minutes), "--decouverte", pol, "--essai", String(r.essai), "--achat", achat, "--graine", String(graine), "--chasse", String(chasse || 0), "--releve", releve || "jeu", "--moteur", "hasard"]);
  const x = play(o);
  const plaine = x.rows.find((y) => y.z === "plaine" && !y.offert), riviere = x.rows.find((y) => y.z === "riviere" && !y.offert);
  const rel = x.rel;
  return {
    releve: rel ? rel.t : null, essais1: rel ? rel.essais : null, pense1: rel ? rel.pense : null, connues: rel ? rel.connues : null,
    pense2: rel ? x.penseTotal / 60 - rel.pense : null, essais2: rel ? x.essais - rel.essais : null, ext2: Object.values(x.ext).reduce((a, b) => a + b, 0),
    plaine2: plaine ? plaine.t : null, riviere2: riviere ? riviere.t : null,
    plaine: rel && plaine ? rel.t + plaine.t : null, riviere: rel && riviere ? rel.t + riviere.t : null
  };
}
const mediane = (a) => { const s = a.slice().sort((x, y) => x - y), m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
/* un résultat chiffré sur plusieurs graines : médiane, bornes, combien l’ont atteint */
function agreger(liste, cle) {
  const v = liste.map((x) => x[cle]).filter((x) => x !== null);
  return { n: v.length, de: liste.length, med: v.length ? mediane(v) : null, min: v.length ? Math.min(...v) : null, max: v.length ? Math.max(...v) : null };
}

function mesurer(r, chasse) {
  const res = {};
  for (const [pol] of POLITIQUES) {
    res[pol] = {};
    const graines = r.graines;
    for (const [achat] of (chasse ? [ACHATS[1]] : ACHATS)) {
      const liste = [];
      for (let g = 1; g <= graines; g++) liste.push(une(pol, achat, g, r, chasse));
      res[pol][achat] = { releve: agreger(liste, "releve"), essais1: agreger(liste, "essais1"), pense1: agreger(liste, "pense1"), connues: agreger(liste, "connues"),
        pense2: agreger(liste, "pense2"), essais2: agreger(liste, "essais2"), ext2: agreger(liste, "ext2"), plaine2: agreger(liste, "plaine2"), riviere2: agreger(liste, "riviere2"), plaine: agreger(liste, "plaine"), riviere: agreger(liste, "riviere") };
    }
  }
  return res;
}

const f1 = (x) => x.toFixed(1);
/* « 5,1 [4,2–6,3] » ; « — » si personne n’y arrive ; « (6/9) » si certaines graines n’y arrivent pas */
function cell(a) {
  if (a.med === null) return "—";
  const partiel = a.n < a.de ? " (" + a.n + "/" + a.de + ")" : "";
  return a.de === 1 ? f1(a.med) : f1(a.med) + " [" + f1(a.min) + "–" + f1(a.max) + "]" + partiel;
}
function tableau(titre, cle, res) {
  const L = [];
  L.push("**" + titre + "**", "");
  L.push("| Hypothèse | " + ACHATS.map((a) => a[1]).join(" | ") + " |", "|---|" + ACHATS.map(() => "---:").join("|") + "|");
  for (const [pol, nom] of POLITIQUES) L.push("| " + nom + " | " + ACHATS.map(([a]) => cell(res[pol][a][cle])).join(" | ") + " |");
  return L;
}
/* l’ancienne règle (cabane posée et première exploration) à côté de la règle du jeu, pour l’achat qui accélère le plus */
function compareRegles(r) {
  const out = {};
  for (const [pol] of POLITIQUES) {
    out[pol] = {};
    for (const regle of ["tot", "jeu"]) {
      const liste = [];
      for (let g = 1; g <= r.graines; g++) liste.push(une(pol, "auto", g, r, 0, regle));
      out[pol][regle] = { releve: agreger(liste, "releve"), plaine2: agreger(liste, "plaine2"), riviere2: agreger(liste, "riviere2"), riviere: agreger(liste, "riviere") };
    }
  }
  return out;
}
function rapport(r, res, resChasse, regles) {
  const L = [];
  L.push("# Le premier parcours d’un nouveau joueur : mesures", "");
  L.push("Simulation sur le moteur réel (`node tools/sim-parcours.js --ecrire`), sans écran. **Ce sont des durées de jeu actif, en minutes**, pour un joueur de type « tapeur » (4 appuis par seconde). Elles comparent des hypothèses ; elles ne remplacent pas l’observation de vrais joueurs.", "");
  L.push("Version du jeu : " + D.VERSION + " · " + r.minutes + " min de cycle 2 · " + r.essai + " s par essai · " + r.graines + " graines de hasard par case (médiane, puis [min–max]).", "");
  L.push("## Ce qui est simulé", "",
    "1. Partie neuve : aucune recette connue d’avance. Le joueur voit chaque matière, puis **découvre** la recette de l’étape en cours par des essais sur le moteur réel (thermomètre, et souvenirs du guide qui donnent l’action, une matière, puis la recette).",
    "2. La relève obligatoire du cycle 1 est prise dès qu’elle se déclenche : une fois le premier passage (la Plaine) franchi, ce qui demande d’explorer la grotte, donc de fabriquer une torche. +3 Traces offertes, en plus de celles du passage.",
    "3. Un premier achat de Mémoire avec ces Traces : une colonne par choix possible, plus « aucun achat ».",
    "4. Cycle 2 : il ne connaît que ce qu’il a appris au cycle 1. On note la minute où il franchit la Plaine, puis la Rivière.", "");
  L.push("## Les trois hypothèses sur la découverte (la partie incertaine)", "",
    "- **énigme résolue d’emblée** : il trouve la bonne combinaison au premier essai (20 s de réflexion). C’est le modèle de l’ancien simulateur : la borne basse.",
    "- **thermomètre et indices** : il essaie, regarde le thermomètre, varie ce qui « chauffe » et suit les indices du guide.",
    "- **au hasard** : il essaie une action et une à trois matières tirées au sort : la borne haute.",
    "Le nombre d’essais vient du moteur (thermomètre, souvenirs du guide) ; seule la manière de choisir l’essai suivant et le temps d’un essai (" + r.essai + " s) sont des hypothèses.", "");
  const base = res.guide.recolte;
  L.push("## Le cycle 1 : jusqu’à la relève obligatoire", "",
    "| Hypothèse | Relève à (min) | Essais | Réflexion (min) | Recettes connues |", "|---|---:|---:|---:|---:|");
  for (const [pol, nom] of POLITIQUES) { const c = res[pol].aucun; L.push("| " + nom + " | " + cell(c.releve) + " | " + cell(c.essais1).replace(/\.\d/g, "") + " | " + cell(c.pense1) + " | " + cell(c.connues).replace(/\.\d/g, "") + " |"); }
  L.push("", "Le cycle 1 ne dépend pas de l’achat : c’est avant la relève.", "");
  L.push("## Quand la relève se déclenche : l’ancienne règle et la règle actuelle", "",
    "Ancienne règle : dès que la première cabane est posée et la première exploration faite. Règle actuelle : une fois la Plaine franchie. Les Traces sont dépensées dans l’ordre habituel de la Mémoire (3 offertes, plus 2 du passage pour la règle actuelle).", "",
    "| Hypothèse | Relève (ancienne) | Relève (actuelle) | Rivière depuis le début (ancienne) | Rivière depuis le début (actuelle) |", "|---|---:|---:|---:|---:|");
  for (const [pol, nom] of POLITIQUES) { const a = regles[pol].tot, b = regles[pol].jeu; L.push("| " + nom + " | " + cell(a.releve) + " | " + cell(b.releve) + " | " + cell(a.riviere) + " | " + cell(b.riviere) + " |"); }
  L.push("");
  L.push("## La Plaine", "");
  tableau("Depuis le début de la partie (cycle 1 + cycle 2), en minutes", "plaine", res).forEach((l) => L.push(l));
  L.push("");
  tableau("Le cycle 2 seul (depuis la relève), en minutes", "plaine2", res).forEach((l) => L.push(l));
  L.push("", "## La Rivière", "");
  tableau("Depuis le début de la partie (cycle 1 + cycle 2), en minutes", "riviere", res).forEach((l) => L.push(l));
  L.push("");
  tableau("Le cycle 2 seul (depuis la relève), en minutes", "riviere2", res).forEach((l) => L.push(l));
  L.push("", "## Si le joueur cherche aussi les recettes hors objectif (achat : Mains calleuses)", "",
    "Par défaut le joueur simulé ne suit que le guide et n’utilise que les recettes qu’il connaît. Ici, au cycle 2, il cherche en plus les extracteurs et outils qui l’intéressent, avec au plus " + r.chasse + " essais par recette, puis abandonne.", "",
    "| Hypothèse | Plaine (depuis le début) | Rivière (depuis le début) | Réflexion cycle 2 (min) | Essais cycle 2 | Extracteurs posés |", "|---|---:|---:|---:|---:|---:|");
  for (const [pol, nom] of POLITIQUES) { const c = resChasse[pol].recolte, s0 = res[pol].recolte; L.push("| " + nom + " | " + cell(c.plaine) + " (sans : " + cell(s0.plaine) + ") | " + cell(c.riviere) + " (sans : " + cell(s0.riviere) + ") | " + cell(c.pense2) + " | " + cell(c.essais2).replace(/\.\d/g, "") + " | " + cell(c.ext2).replace(/\.\d/g, "") + " |"); }
  L.push("", "## Où passe le temps du cycle 2 (achat : Mains calleuses, sans chasse)", "",
    "| Hypothèse | Réflexion (min) | Essais | Extracteurs posés à la fin |", "|---|---:|---:|---:|");
  for (const [pol, nom] of POLITIQUES) { const c = res[pol].recolte; L.push("| " + nom + " | " + cell(c.pense2) + " | " + cell(c.essais2).replace(/\.\d/g, "") + " | " + cell(c.ext2).replace(/\.\d/g, "") + " |"); }
  L.push("", "## Ce que ce modèle ne sait pas faire", "",
    "- **Les recettes hors objectif** (extracteurs, outils d’amélioration) : par défaut le joueur simulé n’en cherche aucune ; avec la section ci-dessus, il en cherche à coups d’essais, au cycle 2 seulement. Un vrai joueur les déduit peut-être de l’énigme du Carnet (l’hypothèse « énigme ») ou n’y pense pas. C’est ce qui fait le plus varier la fin du cycle 2 : regarder les deux versions.",
    "- **La récolte** : 4 appuis par seconde (le type « tapeur »). Un vrai joueur peut utiliser la récolte continue : la vitesse manuelle compte donc moins que dans ces chiffres.",
    "- Ni l’Intuition (étude, déchiffrage), ni les secrets, ni les dialogues, ni la lecture : seulement ce qu’on peut mesurer sur le moteur.",
    "- Le hasard du moteur (coups de chance à la récolte, pièces en plus) varie lui aussi avec la graine : même graine, mêmes nombres.",
    "- Aucun joueur qui s’arrête : tout est en minutes de jeu actif, jusqu’au bout.", "");
  L.push("## Comment lire", "",
    "- **Depuis la 0.17 (un extracteur par ressource)**, le joueur simulé choisit lui-même quel bâtiment construire pour chaque ressource. Ses temps ont bougé de quelques pour cent (la Rivière en énigme : environ 10 % plus tard) : c’est surtout son choix de bâtiments, pas un prix qui a changé, car chaque niveau garde la recette et le taux de l’ancien extracteur.",
    "- **Mains sûres** (les fabrications à la main : 20 % plus rapides et 10 % de chances d’une pièce en plus par niveau) ne change presque rien avant la Rivière, même avec un bonus de 90 % (mesuré une fois : 34,7 contre 30,8 min). Les murs du début se règlent à la récolte, pas aux pièces fabriquées. Mains calleuses (récolte ×2) est le seul achat qui compte au premier relève.",
    "- « — » : la Rivière n’est pas franchie dans la durée simulée ; « (6/9) » : seules 6 graines sur 9 y arrivent.",
    "- Regarder d’abord l’**écart entre les hypothèses** : si les trois donnent à peu près la même durée, la découverte ne fait pas la différence ; sinon, c’est ce qu’il faut observer chez de vrais joueurs.",
    "- Regarder ensuite l’**écart entre les achats** : il dit si le premier choix de Mémoire change vraiment le cycle 2, et ce que coûte de ne rien acheter.",
    "- Pour les seuils de rythme : voir seulement après des essais avec de vrais joueurs ; ce rapport ne fixe aucune cible.");
  void base;
  return L.join("\n").replace(/\n\n\n+/g, "\n\n") + "\n";
}

function commit() { try { return execSync("git rev-parse --short HEAD", { cwd: path.join(__dirname, ".."), stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); } catch (e) { return null; } }

if (require.main === module) {
  try {
    const r = reglages(process.argv.slice(2));
    const res = mesurer(r, 0), resChasse = mesurer(r, r.chasse), regles = compareRegles(r);
    if (r.json) console.log(JSON.stringify({ version: D.VERSION, reglages: r, resultats: res, avecChasse: resChasse, regles }, null, 2));
    else {
      const txt = rapport(r, res, resChasse, regles);
      if (r.ecrire) { fs.writeFileSync(FICHIER, txt + (commit() ? "\n_Mesuré au commit " + commit() + "._\n" : "")); console.log("✓ " + path.relative(process.cwd(), FICHIER) + " écrit."); }
      else console.log(txt);
    }
  } catch (e) { console.error(e.message); process.exitCode = 1; }
}
module.exports = { mesurer, une, rapport, reglages, POLITIQUES, ACHATS };
