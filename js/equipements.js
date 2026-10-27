/* Atelier par équipements — profil expérimental isolé, Bois à Cuivre.
 * Aucun changement du contenu normal : createData retourne une copie indépendante.
 * Le navigateur normal ne charge pas ce module. */
(function (root) {
  "use strict";
  const clone = (x) => Array.isArray(x) ? x.map(clone) : x && typeof x === "object"
    ? Object.fromEntries(Object.entries(x).map(([k, v]) => [k, clone(v)])) : x;

  function createData(base) {
    const D = clone(base), I = D.ITEMS;
    const legacyInputs = {};
    for (const id of ["outre", "tunique", "flute", "engrenage_bois"]) legacyInputs[id] = clone(I[id].r[1]);
    // Ces objets deviennent des outils requis, pas des matériaux incorporés.
    for (const id of ["outre", "tunique", "flute"]) delete I[id].r[1].aiguille;
    delete I.engrenage_bois.r[1].eclat;
    // Prix de prototype explicites ; aucune recette existante n'est supprimée.
    I.percuteur_pierre = { n: "Percuteur de pierre", a: 0, t: "tool", ic: "🪨",
      r: ["assembler", { caillou: 2 }, 1], u: "Prépare le bois, l’os et les éclats de silex.",
      h: "Deux galets de la Lisière : garde celui qui tient bien dans ta main." };
    I.racloir_os = { n: "Racloir en os", a: 1, t: "tool", ic: "🦴",
      r: ["tailler", { os: 3, caillou: 1 }, 1], u: "Découpe les peaux avant l’arrivée du silex.",
      h: "Une esquille d’os, amincie contre la pierre, pourrait séparer la peau en bandes." };
    I.polissoir = { n: "Dalle de polissage", a: 3, t: "tool", ic: "🪨",
      r: ["assembler", { caillou: 8, bois: 4 }, 1], u: "Travaille les surfaces avec du sable, consommé comme abrasif.",
      h: "Une pierre stable sur un support de bois : le sable fera le reste." };

    const equipment = {
      mains: { n: "Mains", family: "main", modes: { assembler: "Assembler", tresser: "Tresser" } },
      percuteur_pierre: { n: "Percuteur de pierre", item: "percuteur_pierre", family: "taille", modes: { tailler: "Tailler" } },
      racloir_os: { n: "Racloir en os", item: "racloir_os", family: "coupe", modes: { couper: "Couper" } },
      couteau: { n: "Couteau de silex", item: "couteau", family: "coupe", modes: { couper: "Couper", entailler: "Entailler" } },
      aiguille: { n: "Aiguille en os", item: "aiguille", family: "couture", modes: { coudre: "Coudre", percer: "Percer" } },
      feu: { n: "Feu de camp", item: "feu", family: "chauffe", modes: { doux: "Chauffe douce", vif: "Cuisson vive", etouffee: "À l’étouffée" } },
      four: { n: "Four en argile", item: "four", family: "chauffe", modes: { cuisson: "Cuisson", fonte: "Fonte" } },
      pioche_pierre: { n: "Pioche de pierre", item: "pioche_pierre", family: "taille", modes: { equarrir: "Équarrir" } },
      enclume_pierre: { n: "Poste de frappe", item: "enclume_pierre", requires: { percuteur_pierre: 1 }, family: "frappe", modes: { marteler: "Marteler" } },
      ciseau: { n: "Ciseau de cuivre", item: "ciseau", family: "taille", modes: { refendre: "Refendre" } },
      polissoir: { n: "Dalle de polissage", item: "polissoir", family: "abrasion", modes: { polir: "Polir" } }
    };
    const recipes = {};
    const put = (ids, eq, mode) => ids.split(" ").forEach(id => { (recipes[id] || (recipes[id] = [])).push({ equipment: eq, mode }); });
    for (const [id, it] of Object.entries(I)) if (it.r && it.a <= 3 && ["assembler", "tresser"].includes(it.r[0])) put(id, "mains", it.r[0]);
    // Remplacer les choix par défaut, sans modifier le geste des recettes.
    for (const id of ["outre", "tunique"]) recipes[id] = [{ equipment: "aiguille", mode: "coudre" }];
    put("manche aiguille eclat racloir_os", "percuteur_pierre", "tailler");
    put("laniere", "racloir_os", "couper"); put("laniere", "couteau", "couper");
    put("engrenage_bois", "couteau", "entailler"); put("statuette", "couteau", "entailler");
    put("flute", "aiguille", "percer");
    put("charbon", "feu", "etouffee"); put("epieu galette colle_os encre", "feu", "doux");
    put("brique", "feu", "vif"); put("brique creuset", "four", "cuisson");
    put("lingot_cuivre lingot_etain", "four", "fonte");
    put("enclume_pierre", "pioche_pierre", "equarrir");
    put("plaque_cuivre", "enclume_pierre", "marteler"); put("fil_cuivre", "ciseau", "refendre");
    put("miroir", "polissoir", "polir");
    const keys = new Set();
    for (const [id, choices] of Object.entries(recipes)) for (const choice of choices) {
      if (!equipment[choice.equipment] || !Object.hasOwn(equipment[choice.equipment].modes, choice.mode)) throw new Error("Équipement inconnu : " + id);
      const key = choice.equipment + ":" + choice.mode + ":" + Object.keys(I[id].r[1]).sort().join(",");
      if (keys.has(key)) throw new Error("Recettes ambiguës pour cet équipement : " + key);
      keys.add(key);
    }
    D.CRAFT_EQUIPMENT = { equipment, recipes, legacyInputs };
    // Le premier objectif conduit au nouvel outil ; le racloir sera indiqué
    // comme prérequis des lanières, pas comme un détour dans une terre future.
    D.OBJECTIVES.unshift(["percuteur_pierre", "Assemble deux cailloux de la Lisière pour préparer ton percuteur."]);
    return D;
  }

  function attach(E) {
    const cfg = E.D.CRAFT_EQUIPMENT;
    if (!cfg) return;
    const equipmentItems = new Set(Object.values(cfg.equipment).map(eq => eq.item).filter(Boolean));
    E.isEquipmentItem = id => equipmentItems.has(id);
    const requirements = (id) => {
      const eq = cfg.equipment[id];
      if (!eq) return null;
      return Object.assign({}, eq.item ? { [eq.item]: 1 } : {}, eq.requires || {});
    };
    const missing = (id, available) => {
      const req = requirements(id);
      if (!req) return null;
      return Object.fromEntries(Object.entries(req).filter(([k, n]) => available(k) < n));
    };
    E.equipmentChoices = (recipe, available) => (cfg.recipes[recipe] || []).map(choice => {
      const lacks = missing(choice.equipment, available || E.count);
      return Object.assign({}, choice, { n: cfg.equipment[choice.equipment].n, missing: lacks, ready: Object.keys(lacks).length === 0 });
    });
    E.equipmentCheck = (recipe, available) => {
      const choices = E.equipmentChoices(recipe, available);
      if (!choices.length || choices.some(c => c.ready)) return null;
      // Préférer l'équipement le plus précoce pour ne pas guider vers le
      // couteau de la Rivière avant d'avoir fabriqué l'outre.
      choices.sort((a, b) => Math.max(...Object.keys(a.missing).map(k => E.item(k).a)) - Math.max(...Object.keys(b.missing).map(k => E.item(k).a)));
      const c = choices[0];
      return { why: "equipment", equipment: c.equipment, required: Object.keys(c.missing)[0], missing: c.missing };
    };
    E.equipmentList = () => Object.entries(cfg.equipment).map(([id, eq]) => Object.assign({ id, ready: Object.keys(missing(id, E.count)).length === 0 }, eq));
    E.equipmentRecipe = (equipment, mode, ids) => {
      const eq = cfg.equipment[equipment];
      if (!eq || !Object.hasOwn(eq.modes, mode) || Object.keys(missing(equipment, E.count)).length) return null;
      const parts = Array.from(new Set(ids.filter(Boolean))).sort().join(",");
      return Object.keys(cfg.recipes).find(id => cfg.recipes[id].some(c => c.equipment === equipment && c.mode === mode) && Object.keys(E.item(id).r[1]).sort().join(",") === parts) || null;
    };
    E.attemptWith = (equipment, mode, ids) => {
      const eq = cfg.equipment[equipment];
      if (!eq || !Object.hasOwn(eq.modes, mode)) return { kind: "equipment", why: "mode" };
      if (Object.keys(missing(equipment, E.count)).length) return { kind: "equipment", why: "missing", equipment };
      const parts = Array.from(new Set(ids.filter(Boolean))).sort();
      if (!parts.length) return { kind: "empty" };
      const recipe = E.equipmentRecipe(equipment, mode, parts);
      if (!recipe) return { kind: "equipment", why: "incompatible", equipment, mode };
      // Une mauvaise sélection ne doit ni révéler une recette incompatible,
      // ni dépenser de matière, ni contaminer les souvenirs du geste.
      return E.attempt(E.item(recipe).r[0], parts, { equipment, mode });
    };
  }
  const API = { createData, attach };
  root.EclatEquipements = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
