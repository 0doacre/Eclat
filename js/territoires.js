/* Maîtrise des terres : objectifs de cycle, transmission et débit permanent.
 * Les secrets et les recettes facultatives ne font jamais partie des 100 %.
 * Une recette appartient à une seule terre ; ses ingrédients ne propagent pas le bonus. */
(function (root) {
  "use strict";
  const RULES = {
    lisiere: { outils: ["panier", "cabane"], lieux: ["chene", "grotte"], ouvrage: ["feu", "epieu"], serie: "corde", quantite: 10, production: 120,
      recettes: ["manche", "corde", "panier", "archet", "feu", "charbon", "epieu", "cabane", "torche", "fibre_1", "caillou_1", "hutte", "scierie", "fibre_2", "fibre_3", "caillou_2", "caillou_3"] },
    plaine: { outils: ["arc", "collets"], lieux: ["champ_os", "tumulus"], ouvrage: ["outre"], serie: "laniere", quantite: 10, production: 80,
      recettes: ["aiguille", "laniere", "colle_os", "arc", "fronde", "outre", "pic_os", "collets", "tunique", "gants", "cuir_1", "cuir_2", "enclos"] },
    riviere: { outils: ["hache_pierre", "silex_1"], lieux: ["gue", "carcasse"], ouvrage: ["four", "automate_bois"], serie: "brique", quantite: 10, production: 100,
      recettes: ["eclat", "engrenage_bois", "automate_bois", "hache_pierre", "couteau", "pioche_pierre", "brique", "four", "nasse", "silex_1", "silex_2", "sable_1", "sable_2", "sable_3", "sable_4", "drague"] },
    collines: { outils: ["enclume_pierre", "puits"], lieux: ["rails", "sommet"], ouvrage: ["creuset", "pioche_bronze"], serie: "plaque_bronze", quantite: 10, production: 100,
      recettes: ["lingot_cuivre", "enclume_pierre", "plaque_cuivre", "fil_cuivre", "lingot_etain", "creuset", "puits", "cassiterite_1", "cassiterite_2", "lingot_bronze", "plaque_bronze", "engrenage", "ressort", "automate_bronze", "hache_bronze", "pioche_bronze", "enclume_bronze", "roue", "treuil", "galene_1", "galene_2", "soufre_1"] },
    mine: { outils: ["bas_fourneau", "galerie"], lieux: ["filon"], ouvrage: ["outils_fer"], serie: "plaque_fer", quantite: 10, production: 120,
      recettes: ["bas_fourneau", "loupe", "lingot_fer", "plaque_fer", "clous", "chainon", "outils_fer", "galerie", "haut_fourneau", "lingot_acier", "bac_trempe", "acier_trempe", "lame", "tour", "engrenage_acier", "vis", "roulement", "outils_acier", "foreuse_elec", "charbon_2", "charbon_3", "uranium_1", "uranium_2", "pastille_uranium", "barre_combustible"] },
    desert: { outils: ["tamis", "lunette"], lieux: ["ville", "observatoire"], ouvrage: ["lentille"], serie: "verre", quantite: 10, production: 120,
      recettes: ["tamis", "verre", "poudre_quartz", "lentille", "lunette", "brique_refr", "verre_trempe", "excavatrice", "silicium", "wafer", "lithographe", "puce", "processeur", "cellule", "circuit", "ordinateur", "radiotelescope", "piston", "chaudiere", "moteur_vapeur", "presse_vapeur", "tuyau_cuivre", "circuit_vapeur", "condenseur", "recuperation_vapeur", "soupape", "manometre", "regulateur", "chaudiere_tubulaire", "marteau_pilon", "bobine", "aimant", "dynamo", "cuivre_pur", "batterie", "ampoule", "cable", "telegraphe", "eclairage", "radio", "moteur_elec", "four_arc", "reseau", "chaine", "foreuse", "capteurs", "robots"],
      retours: [{ rang: 1, age: 6, n: "La précision", ouvrage: "acier_trempe", serie: "verre_trempe" }, { rang: 4, age: 7, n: "La vapeur", ouvrage: "moteur_vapeur", serie: "circuit_vapeur" }, { rang: 7, age: 10, n: "Les circuits", ouvrage: "ordinateur", serie: "puce" }] },
    gisement: { outils: ["derrick", "reacteur"], lieux: ["plateforme_r"], ouvrage: ["refroidissement"], serie: "plastique", quantite: 10, production: 150,
      recettes: ["derrick", "masque", "naphta", "reacteur", "plastique", "resine", "caoutchouc", "joint_souple", "tuyau_souple", "echangeur", "refroidissement", "dynamite", "convoyeurs", "plateforme", "fibre_carbone", "tissu_carbone"] },
    montagnes: { outils: ["carriere", "outillage"], lieux: ["silo", "radar"], ouvrage: ["autoclave"], serie: "composite", quantite: 10, production: 180,
      recettes: ["bouteille", "aluminium", "titane", "aimant_neo", "outillage", "carriere", "ilmenite_1", "ilmenite_2", "terres_1", "terres_2", "autoclave", "composite", "ceramique", "bouclier_th", "moteur_fusee", "fusee", "excavateur"] },
    orbite: { outils: ["station_orbitale"], lieux: ["station_morte", "arche0"], ouvrage: ["alunisseur"], serie: "alliage_ancien", quantite: 10, production: 160,
      recettes: ["station_orbitale", "alliage_ancien", "alunisseur"] },
    lune: { outils: ["base_lunaire"], lieux: ["tranquillite", "base_vahl"], ouvrage: ["reacteur_fusion"], serie: "propulseur", quantite: 5, production: 180,
      recettes: ["base_lunaire", "regolithe_1", "propulseur", "reacteur_fusion", "vaisseau"] },
    mercure: { outils: ["replicateur", "forge_stellaire"], lieux: ["bras"], ouvrage: ["metamateriau"], serie: "panneau_dyson", quantite: 5, production: 200,
      recettes: ["replicateur", "forge_stellaire", "metamateriau", "matiere_exotique", "antimatiere", "panneau_dyson"] }
  };
  const MAX = 10, STEP = 5;
  const PHASES = ["Premiers équipements", "Exploration", "Ouvrage", "Production", "Maîtrise"];
  const obj = v => !!v && typeof v === "object" && !Array.isArray(v);
  function normalize(s) {
    s.meta = obj(s.meta) ? s.meta : {};
    const ranks = obj(s.meta.terres) ? s.meta.terres : {};
    s.meta.terres = Object.fromEntries(Object.keys(RULES).map(z => [z, Math.max(0, Math.min(MAX, Number.isFinite(ranks[z]) ? Math.floor(ranks[z]) : 0))]));
    const t = obj(s.territoires) ? s.territoires : {};
    const produced = obj(t.produit) ? t.produit : {}, done = obj(t.accompli) ? t.accompli : {};
    s.territoires = { produit: {}, accompli: {} };
    for (const z of Object.keys(RULES)) {
      s.territoires.produit[z] = Number.isFinite(produced[z]) ? Math.max(0, Math.min(1e9, produced[z])) : 0;
      if (done[z] === true) s.territoires.accompli[z] = true;
    }
  }
  function attach(E) {
    const D = E.D, I = D.ITEMS, ownership = {};
    for (const z in RULES) for (const id of RULES[z].recettes) {
      if (!I[id] || !I[id].r || ownership[id]) throw new Error("Recette territoriale invalide : " + id);
      ownership[id] = z;
    }
    normalize(E.state);
    const state = () => E.state;
    const rank = z => Math.max(0, Math.min(MAX, (state().meta.terres || {})[z] || 0));
    E.terreBonus = z => Object.hasOwn(RULES, z) ? 1 + rank(z) * STEP / 100 : 1;
    E.recetteTerre = id => ownership[id] || null;
    E.recetteTerreBonus = id => E.terreBonus(ownership[id]);
    E.terreProduire = (z, n) => {
      if (Object.hasOwn(RULES, z) && E.zoneOpen(z) && Number.isFinite(n) && n > 0) state().territoires.produit[z] = Math.min(1e9, (state().territoires.produit[z] || 0) + n);
    };
    function info(z, latch) {
      if (!Object.hasOwn(RULES, z)) return null;
      const s = state(), r = RULES[z], level = rank(z), open = E.zoneOpen(z);
      const retour = (r.retours || []).filter(x => level >= x.rang).slice(-1)[0];
      const scale = 1 + Math.min(2, Math.floor(level / 4));
      const series = retour ? retour.serie : r.serie, qty = r.quantite * scale;
      const made = id => (s.made[id] || 0) > 0;
      const build = retour ? [retour.ouvrage] : r.ouvrage;
      const phases = [
        { n: PHASES[0], done: r.outils.every(made), texte: "Fabriquer ou réparer : " + r.outils.map(id => I[id].n).join(", "), ids: r.outils },
        { n: PHASES[1], done: r.lieux.every(x => (s.exp.done[z] || 0) > E.ZONES[z].exps.findIndex(e => e.id === x)), texte: r.lieux.length > 1 ? "Explorer les " + r.lieux.length + " lieux principaux" : "Explorer le lieu principal", lieux: r.lieux },
        { n: PHASES[2], done: build.every(made), texte: "Réaliser : " + build.map(id => I[id].n).join(", "), ids: build },
        { n: PHASES[3], done: (s.territoires.produit[z] || 0) >= r.production * scale, texte: "Extraire automatiquement " + r.production * scale + " matières dans cette terre", actuel: Math.min(r.production * scale, Math.floor(s.territoires.produit[z] || 0)), cible: r.production * scale },
        { n: PHASES[4], done: (s.made[series] || 0) >= qty, texte: "Achever " + qty + " fabrications : " + I[series].n, actuel: Math.min(qty, Math.floor(s.made[series] || 0)), cible: qty, ids: [series] }
      ];
      const complete = open && phases.every(p => p.done);
      if (complete && latch && !s.territoires.accompli[z]) { s.territoires.accompli[z] = true; E.emit("terreMaitrisee", { z }); }
      const ready = open && (complete || s.territoires.accompli[z] === true);
      const order = Object.keys(RULES), next = order[order.indexOf(z) + 1];
      const percent = ready ? 100 : Math.floor(phases.filter(p => p.done).length / phases.length * 100);
      return { z, n: E.ZONES[z].n, ouvert: open, rang: level, bonus: level * STEP, prochainBonus: Math.min(MAX, level + 1) * STEP,
        chapitre: retour ? retour.n : "Première installation", phases, pourcent: open ? percent : 0, pret: ready, gagne: ready && level < MAX,
        prochaine: next || null, apercu: ready && !!next, frontiere: !!next && E.zoneOpen(next) };
    }
    E.terreMaitrise = z => info(z, true);
    E.terresMaitrise = () => Object.keys(RULES).map(z => info(z, true));
    E.terresTransmission = () => E.terresMaitrise().filter(x => x.gagne);
    E.terresCheck = () => { for (const z in RULES) if (E.zoneOpen(z)) info(z, true); };
    const newCycle = E.newCycle;
    E.newCycle = function () {
      const earned = E.canReleve() ? E.terresTransmission() : [];
      state().meta.terres = state().meta.terres || {};
      for (const t of earned) state().meta.terres[t.z] = t.rang + 1;
      newCycle();
    };
    // Les vues et le bilan de relève utilisent les mêmes objectifs et les mêmes gains.
    E.terresSignature = () => E.terresMaitrise().filter(t => t.ouvert).map(t => t.z + ":" + t.pourcent + ":" + t.rang + ":" + t.phases.map(p => p.done ? 1 : 0).join("")).join("|");
    E.territoiresHTML = (z, esc, open) => html(E, z, esc, open);
    E.territoiresTransmissionHTML = esc => transmissionHTML(E, esc);
  }
  function html(E, z, esc, open) {
    const t = E.terreMaitrise(z);
    if (!t || !t.ouvert) return "";
    let h = '<details class="terre-maitrise" data-terre-maitrise="' + z + '"' + (open ? ' open' : '') + '><summary title="Voir les objectifs de cette terre et son bonus à la relève">Maîtrise · ' + t.pourcent + ' %' + (t.bonus ? ' · Débit +' + t.bonus + ' %' : '') + (t.gagne ? ' · +5 % à la relève' : '') + ' <button type="button" class="btn-aide mini" data-aide="maitrise" title="Comprendre la maîtrise des terres et la transmission" aria-label="Comprendre la maîtrise des terres et la transmission">?</button></summary>';
    h += '<p class="small">' + esc(t.chapitre) + ' · Les secrets sont facultatifs. Les objectifs peuvent avancer en parallèle.</p><ol>';
    for (const p of t.phases) {
      h += '<li' + (p.done || t.pret ? ' class="done"' : '') + '><b>' + esc(p.n) + (p.done || t.pret ? ' · accompli' : '') + '</b><span>' + esc(p.texte) + (p.cible ? ' · <span data-terre-compteur="' + z + ':' + (p.n === PHASES[3] ? 'production' : 'serie') + '">' + p.actuel + '</span> / ' + p.cible : '') + '</span></li>';
    }
    h += '</ol>';
    if (t.pret && t.rang < MAX) h += '<p class="small"><b>À la relève : débit +' + t.bonus + ' % → +' + t.prochainBonus + ' %.</b> Bonus permanent aux extracteurs de cette terre et à ses recettes associées, aux mains comme aux machines.</p>';
    else if (t.rang === MAX) h += '<p class="small">Bonus permanent au plafond : +50 % de débit.</p>';
    else h += '<p class="small">À 100 %, la prochaine relève transmet +5 % de débit (plafond +50 %). Reconstruis et exploite la terre à chaque cycle pour gagner le palier suivant.</p>';
    if (t.apercu) {
      const next = E.ZONES[t.prochaine], pass = E.passInfo(t.prochaine);
      h += '<p class="small"><b>Horizon · ' + esc(next.n) + '</b> — ' + esc(next.d) + '</p><p class="small">Frontière · ' + (t.frontiere ? 'franchie' : pass && pass.ready ? Math.floor(pass.frac * 100) + ' % du passage fourni' : 'préparer le moyen de passage') + '. La maîtrise ne conditionne pas le passage.</p>';
    }
    const known = RULES[z].recettes.filter(id => E.state.known[id] || E.state.made[id] > 0);
    if (known.length) h += '<details><summary title="Voir les recettes connues qui bénéficient du bonus de cette terre">Recettes associées déjà connues · ' + known.length + '</summary><p class="small">' + known.map(id => esc(E.D.ITEMS[id].n)).join(', ') + '</p></details>';
    return h + '</details>';
  }
  function transmissionHTML(E, esc) {
    const list = E.terresMaitrise().filter(t => t.bonus || t.gagne);
    if (!list.length) return "";
    return '<section class="terres-transmission"><h3>Terres transmises <button type="button" class="btn-aide mini" data-aide="maitrise" title="Comprendre la maîtrise des terres et la transmission" aria-label="Comprendre la maîtrise des terres et la transmission">?</button></h3><p class="small">Bonus permanents de débit : extraction locale et recettes associées, aux mains et aux machines. +5 points par terre maîtrisée et par relève, jusqu’à +50 %.</p><ul>' + list.map(t => '<li>' + esc(t.n) + ' : <b>+' + t.bonus + ' %' + (t.gagne ? ' → +' + t.prochainBonus + ' % à cette relève' : '') + '</b>' + (!t.gagne && t.rang < MAX ? ' · maîtrise à refaire dans ce cycle' : '') + '</li>').join('') + '</ul></section>';
  }
  const API = { RULES, MAX, STEP, normalize, attach, html, transmissionHTML };
  root.EclatTerritoires = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
