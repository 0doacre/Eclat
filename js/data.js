/* ÉCLAT — du silex aux étoiles
 * Contenu du jeu : âges, gestes, matières, recettes, zones, explorations, lore.
 * Format d’une recette : r: [geste, {ingrédient: quantité}, quantité produite, {heat, lvl}]
 */
(function (root) {
  "use strict";
  const D = {};
  D.VERSION = "3.0.0";

  /* ------------------------------------------------------------------ ÂGES */
  D.AGES = [
    { id: "bois", n: "Âge du Bois", c: "#c58d4e", q: "Tout commence par un bâton." },
    { id: "os", n: "Âge de l’Os", c: "#e6d9b8", q: "Tout ce que laissent les bêtes peut servir." },
    { id: "pierre", n: "Âge de la Pierre", c: "#a7afb8", q: "Le premier tranchant." },
    { id: "cuivre", n: "Âge du Cuivre", c: "#e0814a", q: "La pierre verte saigne un métal rouge." },
    { id: "bronze", n: "Âge du Bronze", c: "#d6a746", q: "Deux métaux tendres, un alliage dur." },
    { id: "fer", n: "Âge du Fer", c: "#cf6a52", q: "Le fer ne cède qu’au marteau." },
    { id: "acier", n: "Âge de l’Acier", c: "#8db0d6", q: "La vapeur se met à travailler pour toi." },
    { id: "elec", n: "Âge de l’Électricité", c: "#f2d13c", q: "Une étincelle captive." },
    { id: "silicium", n: "Âge du Silicium", c: "#5fd394", q: "Le sable se met à penser." },
    { id: "polymeres", n: "Âge des Polymères", c: "#bd8cf0", q: "L’huile noire devient tout ce que tu veux." },
    { id: "composites", n: "Âge des Composites", c: "#43d6d6", q: "Plus léger que l’aluminium, plus dur que l’acier." },
    { id: "spatial", n: "Âge Spatial", c: "#8aa2ff", q: "Le ciel n’est plus un plafond." },
    { id: "stellaire", n: "Âge Stellaire", c: "#ffd27a", q: "Le Soleil est une ressource." }
  ];

  /* --------------------------------------------------------------- GESTES */
  D.GESTE_ORDER = ["assembler", "tresser", "tailler", "chauffer", "marteler", "allier", "tremper", "usiner",
    "electriser", "graver", "synthetiser", "stratifier", "transmuter", "accorder"];
  D.GESTES = {
    assembler: { n: "Assembler", ic: "✋", v: "assembler", d: "Joindre plusieurs éléments en un seul objet." },
    tresser: { n: "Tresser", ic: "🧶", v: "tresser", d: "Entrelacer ce qui est souple." },
    tailler: { n: "Tailler", ic: "🔪", v: "tailler", d: "Retirer la matière en trop. Fendre, découper, affûter." },
    chauffer: { n: "Chauffer", ic: "🔥", v: "chauffer", d: "Cuire, fondre, réduire. La température dépend de ta meilleure station." },
    marteler: { n: "Marteler", ic: "🔨", v: "marteler", d: "Battre le métal sur une enclume." },
    allier: { n: "Allier", ic: "⚗️", v: "allier", d: "Fondre plusieurs métaux ensemble dans un creuset." },
    tremper: { n: "Tremper", ic: "💧", v: "tremper", d: "Refroidir brutalement pour durcir." },
    usiner: { n: "Usiner", ic: "⚙️", v: "usiner", d: "Façonner avec la précision d’une machine." },
    electriser: { n: "Électriser", ic: "⚡", v: "électriser", d: "Raffiner et transformer par le courant." },
    graver: { n: "Graver", ic: "🔬", v: "graver", d: "Dessiner avec la lumière à l’échelle de l’atome." },
    synthetiser: { n: "Synthétiser", ic: "🧪", v: "synthétiser", d: "Recomposer les molécules." },
    stratifier: { n: "Stratifier", ic: "📚", v: "stratifier", d: "Empiler des couches et les cuire sous pression." },
    transmuter: { n: "Transmuter", ic: "✴️", v: "transmuter", d: "Réarranger la matière elle-même. Le vieux rêve des alchimistes." },
    accorder: { n: "Accorder", ic: "🎵", v: "accorder", d: "Faire vibrer la matière sur une seule note. Un geste oublié.", secret: true }
  };

  /* -------------------------------------------------------------- MATIÈRES
   * t : res (récoltable) · comp (composant) · tool (outil) · stat (station)
   *     ext (extracteur, répétable) · upg (amélioration) · mach (machine de production, répétable)
   *     curio (curiosité) · relic (relique trouvée)
   * e : effets — tap/auto {cible: mult}, zone, st (station), sky, arche, term,
   *     intu (✨/min), exp (vitesse d’exploration), pip, slots, aspd, once, flute
   * p : production par seconde (extracteurs), z : zone de l’extracteur, s : croissance du coût
   * spd : fabrications par minute (machines)
   */
  const I = (D.ITEMS = {});

  /* Âge 0 — Bois */
  I.bois = { n: "Bois", ic: "🪵", a: 0, t: "res", d: "Branches mortes, bois vert. La forêt n’en manque pas." };
  I.fibre = { n: "Fibres", ic: "🌿", a: 0, t: "res", d: "Longues herbes et lianes. Ça se plie, ça se noue." };
  I.caillou = { n: "Pierre", ic: "🪨", a: 0, t: "res", d: "Cailloux, galets, blocs. Lourds et patients." };
  I.manche = { n: "Manche", ic: "🥢", a: 0, t: "comp", r: ["tailler", { bois: 3 }, 1],
    d: "Un bâton droit, écorcé, à la bonne longueur. La base de presque tout.",
    h: "Retire au bois tout ce qui n’est pas utile." };
  I.corde = { n: "Corde", ic: "🪢", a: 0, t: "comp", r: ["tresser", { fibre: 3 }, 1],
    d: "Trois brins tordus ensemble, qui tiennent ton poids.",
    h: "Une herbe seule casse. Plusieurs, entrelacées, tiennent." };
  I.panier = { n: "Panier tressé", ic: "🧺", a: 0, t: "tool", r: ["tresser", { fibre: 15, manche: 2 }, 1],
    e: { tap: { lisiere: 2 } }, d: "Tu peux enfin porter plus que deux mains pleines.",
    h: "Des fibres entrecroisées autour d’une armature rigide." };
  I.archet = { n: "Archet à feu", ic: "🏹", a: 0, t: "comp", r: ["assembler", { manche: 1, corde: 2 }, 1],
    d: "Un arc dont la corde fait tourner un bâton contre le bois, assez vite pour l’embraser.",
    h: "Un bâton, une corde tendue : un arc qui ne tire pas de flèches." };
  I.feu = { n: "Feu de camp", ic: "🔥", a: 0, t: "stat", r: ["assembler", { archet: 1, bois: 25, caillou: 15 }, 1],
    e: { st: [{ g: "chauffer", heat: 600 }] }, d: "Le premier feu que tu allumes toi-même.",
    h: "L’outil qui fait naître la braise, de quoi la nourrir, et des pierres pour la contenir." };
  I.charbon = { n: "Charbon", sym: "C", col: "#2b2b2b", a: 0, t: "res", r: ["chauffer", { bois: 4 }, 1, { heat: 600 }],
    d: "Du bois cuit sans flamme. Brûle bien plus chaud que le bois.",
    h: "Le bois, chauffé longtemps, devient noir et léger." };
  I.epieu = { n: "Épieu durci", ic: "🗡️", a: 0, t: "tool", r: ["chauffer", { manche: 2 }, 1, { heat: 600 }],
    e: { zone: "plaine" }, d: "Une pointe passée au feu, dure comme l’os. De quoi oser la plaine.",
    h: "Un bâton pointu, durci par la flamme." };
  I.cabane = { n: "Cabane de cueillette", ic: "🛖", a: 0, t: "ext", z: "lisiere", s: 1.2,
    r: ["assembler", { manche: 5, corde: 4, fibre: 15 }, 1], p: { bois: 0.4, fibre: 0.4, caillou: 0.2 },
    d: "Un abri où s’entasse ce que donne la lisière. Le soir, des Lucioles tournent autour.",
    h: "Des bâtons, des liens, un toit d’herbes." };
  I.torche = { n: "Torche", ic: "🕯️", a: 0, t: "comp", r: ["assembler", { manche: 1, fibre: 2, charbon: 1 }, 1],
    d: "Une flamme qu’on peut emporter, pour les grottes et les souterrains.",
    h: "Un manche, de l’herbe sèche, et ce qui brûle longtemps." };
  I.galette = { n: "Herbes grillées", ic: "🌾", a: 0, t: "curio", sec: true, r: ["chauffer", { fibre: 5 }, 1, { heat: 600 }],
    e: { once: { intu: 2 } },
    d: "Ça sent bon. Tu en mâches une bouchée, puis tu t’arrêtes : tu n’as jamais eu faim. Ni soif, d’ailleurs." };

  /* Âge 1 — Os */
  I.os = { n: "Os", ic: "🦴", a: 1, t: "res", d: "Les bêtes de la plaine laissent derrière elles des os solides." };
  I.cuir = { n: "Peau", ic: "🦌", a: 1, t: "res", d: "Une peau séchée au soleil. Elle plie sans se déchirer." };
  I.aiguille = { n: "Aiguille en os", ic: "🪡", a: 1, t: "comp", r: ["tailler", { os: 2 }, 2],
    d: "Un éclat d’os affiné, percé d’un chas.", h: "Ce qui reste des bêtes, affiné jusqu’à la pointe." };
  I.laniere = { n: "Lanières", ic: "🎗️", a: 1, t: "comp", r: ["tailler", { cuir: 1 }, 2],
    d: "Des bandes de peau qui serrent plus fort en séchant.", h: "Découpe la peau en longues bandes." };
  I.colle_os = { n: "Colle d’os", sym: "≋", col: "#d8c9a0", a: 1, t: "comp", r: ["chauffer", { os: 3 }, 2, { heat: 600 }],
    d: "Une pâte poisseuse qui durcit en séchant.", h: "Ce qui reste des bêtes, cuit longtemps jusqu’à devenir poisseux." };
  I.arc = { n: "Arc de chasse", ic: "🎯", a: 1, t: "tool", r: ["assembler", { manche: 3, corde: 4, colle_os: 4 }, 1],
    e: { tap: { plaine: 2 } }, d: "Plus besoin d’approcher les bêtes.", h: "Un bois souple, une corde tendue, et de la colle d’os pour que rien ne lâche." };
  I.fronde = { n: "Fronde", ic: "🪃", a: 1, t: "tool", r: ["tresser", { laniere: 4, cuir: 4 }, 1],
    e: { tap: { plaine: 2 } }, d: "Un caillou bien lancé vaut mieux qu’une longue course.",
    h: "Des lanières entrelacées, une poche de peau au milieu." };
  I.outre = { n: "Outre en peau", ic: "🍶", a: 1, t: "tool", r: ["assembler", { cuir: 8, laniere: 6, aiguille: 2 }, 1],
    e: { zone: "riviere" }, d: "De l’eau pour la route. La rivière n’est plus si loin.",
    h: "Coudre une peau pour qu’elle garde l’eau." };
  I.pic_os = { n: "Pic en os", ic: "⛏️", a: 1, t: "tool", r: ["assembler", { manche: 1, os: 10, laniere: 4 }, 1],
    e: { tap: { caillou: 2 } }, d: "Une pointe d’os emmanchée. La pierre cède plus vite.",
    h: "Fixe un os pointu au bout d’un manche, et serre fort." };
  I.collets = { n: "Collets", ic: "🪤", a: 1, t: "ext", z: "plaine", s: 1.2,
    r: ["assembler", { corde: 6, manche: 4, os: 8 }, 1], p: { os: 0.3, cuir: 0.25 },
    d: "Des pièges discrets. Quand tu repasses, il y a souvent quelque chose dedans.",
    h: "Des boucles de corde, des piquets, un appât." };
  I.tunique = { n: "Tunique de peau", ic: "🧥", a: 1, t: "tool", r: ["assembler", { cuir: 15, aiguille: 4, fibre: 20 }, 1],
    e: { tap: { "*": 1.5 } }, d: "Au chaud, tu travailles plus longtemps et plus vite.",
    h: "Des peaux cousues à ta mesure, avec un fil d’herbe." };
  I.flute = { n: "Flûte en os", ic: "🎵", a: 1, t: "curio", sec: true, r: ["tailler", { os: 3, aiguille: 1 }, 1],
    e: { flute: true },
    d: "Un os creux percé de cinq trous. Le premier son qui en sort, tu l’as déjà entendu quelque part. (La Flûte apparaît dans le Journal.)" };
  I.statuette = { n: "Figurine d’os", ic: "🗿", a: 1, t: "curio", sec: true, r: ["tailler", { os: 1, silex: 1 }, 1],
    e: { once: { intu: 3 } },
    d: "Tes mains sculptent toutes seules : une femme aux cheveux courts, au sourire triste. Toi, tu ne l’as jamais vue. Tes mains, si." };

  /* Âge 2 — Pierre */
  I.argile = { n: "Argile", ic: "🟫", a: 2, t: "res", d: "Une terre grasse et collante, qui garde la forme qu’on lui donne." };
  I.silex = { n: "Silex", sym: "◆", col: "#3d4452", a: 2, t: "res", d: "Une pierre noire, vitreuse, qui casse en arêtes vives." };
  I.sable = { n: "Sable", sym: "∴", col: "#c9b27a", a: 2, t: "res", d: "Des milliards de grains. Il cache bien des choses." };
  I.eclat = { n: "Éclat de silex", sym: "✦", col: "#5b6b8c", a: 2, t: "comp", r: ["tailler", { silex: 2 }, 1],
    d: "Un coup sec, au bon angle, et la pierre se fend. Le bord coupe mieux que tout ce que tu as eu en main.",
    h: "Frappe la pierre noire de la rivière, d’un coup sec." };
  I.engrenage_bois = { n: "Rouage de bois", sym: "⚙", col: "#9a6b3c", a: 2, t: "comp", r: ["tailler", { manche: 2, eclat: 1 }, 2],
    d: "Une petite roue dentée, taillée dans un bâton.", h: "Un bâton, taillé en roue dentée par une lame de pierre." };
  I.automate_bois = { n: "Automate de bois", ic: "🪆", a: 2, t: "mach", s: 1.25, spd: 6, r: ["assembler", { engrenage_bois: 6, corde: 10, caillou: 40 }, 1],
    d: "Une marionnette de bois et de cordes, tirée par un contrepoids de pierre. Elle refait le geste que tu lui montres (6 fois par minute). Pose-la sur la Carte, près de la Réserve.",
    h: "Des rouages de bois, des cordes, et un lourd contrepoids." };
  I.hache_pierre = { n: "Hache de pierre", ic: "🪓", a: 2, t: "tool", r: ["assembler", { manche: 2, eclat: 4, laniere: 4 }, 1],
    e: { tap: { bois: 3, fibre: 2 } }, d: "Les petits arbres tombent en quelques coups.",
    h: "Une lame de pierre, liée solidement à un manche." };
  I.couteau = { n: "Couteau de silex", ic: "🔪", a: 2, t: "tool", r: ["assembler", { eclat: 2, os: 6 }, 1],
    e: { tap: { plaine: 2 } }, d: "Pour dépecer proprement : plus de peau, plus d’os.",
    h: "Une lame, et un manche fait de ce qu’elle t’aidera à récolter." };
  I.pioche_pierre = { n: "Pioche de pierre", ic: "⛏️", a: 2, t: "tool", r: ["assembler", { manche: 3, caillou: 40, corde: 6 }, 1],
    e: { zone: "collines", tap: { caillou: 2 } }, d: "Assez lourde pour entamer les collines et leurs veines colorées.",
    h: "Une lourde tête de pierre, deux manches, beaucoup de liens." };
  I.brique = { n: "Brique", ic: "🧱", a: 2, t: "comp", r: ["chauffer", { argile: 2 }, 1, { heat: 600 }],
    d: "De la boue cuite, dure comme de la pierre.", h: "La terre de la rivière, cuite." };
  I.four = { n: "Four en argile", ic: "🏺", a: 2, t: "stat", r: ["assembler", { brique: 30, argile: 20, charbon: 10 }, 1],
    e: { st: [{ g: "chauffer", heat: 1100 }] }, d: "Une chambre de briques qui retient la chaleur.",
    h: "Des briques, de l’argile pour les joindre, et un combustible plus chaud que le bois." };
  I.nasse = { n: "Nasses et claies", ic: "🪣", a: 2, t: "ext", z: "riviere", s: 1.2,
    r: ["assembler", { manche: 8, corde: 6, brique: 4 }, 1], p: { argile: 0.3, silex: 0.2, sable: 0.3 },
    d: "Des barrages de branches qui retiennent ce que la rivière charrie.",
    h: "Des bâtons et des liens plantés dans le courant, lestés de terre cuite." };
  I.hutte = { n: "Hutte de bûcheron", ic: "🏚️", a: 2, t: "ext", z: "lisiere", s: 1.2,
    r: ["assembler", { manche: 15, eclat: 6, corde: 10 }, 1], p: { bois: 1.2, fibre: 0.8, caillou: 0.6 },
    d: "Un abri solide, des lames de pierre à portée de main.",
    h: "Des bâtons, des lames de pierre, beaucoup de corde." };
  I.cerf_volant = { n: "Cerf-volant", ic: "🪁", a: 2, t: "curio", sec: true, r: ["tresser", { fibre: 6, manche: 2, cuir: 1 }, 1],
    e: { once: { intu: 2 } },
    d: "Le vent l’emporte haut. En le suivant des yeux, tu remarques sous les arbres de la lisière un cercle parfait de pierres levées. (Nouvelle exploration à la Lisière.)" };

  /* Âge 3 — Cuivre */
  I.malachite = { n: "Malachite", sym: "Ml", col: "#2f8f5b", a: 3, t: "res", d: "Une pierre verte et veinée, lourde pour sa taille. Il y a du métal là-dedans." };
  I.cassiterite = { n: "Cassitérite", sym: "Cs", col: "#4b4b54", a: 3, t: "res", d: "Des cristaux sombres et lourds." };
  I.lingot_cuivre = { n: "Lingot de cuivre", sym: "Cu", col: "#c7713b", a: 3, t: "comp",
    r: ["chauffer", { malachite: 3, charbon: 1 }, 1, { heat: 1100 }],
    d: "Ton premier métal, rouge et souple.",
    h: "La pierre verte et le noir qui brûle, dans une chaleur que le simple feu n’atteint pas." };
  I.enclume_pierre = { n: "Enclume de pierre", ic: "⚒️", a: 3, t: "stat", r: ["tailler", { caillou: 120 }, 1],
    e: { st: [{ g: "marteler", lvl: 1 }] }, d: "Un bloc plat et dur, pour battre les métaux tendres.",
    h: "Une grosse pierre, aplanie à force de patience." };
  I.plaque_cuivre = { n: "Plaque de cuivre", sym: "▤", col: "#c7713b", a: 3, t: "comp", r: ["marteler", { lingot_cuivre: 1 }, 2],
    d: "Du cuivre battu en feuille.", h: "Frappe le métal rouge jusqu’à ce qu’il s’étale." };
  I.fil_cuivre = { n: "Fil de cuivre", sym: "〰", col: "#c7713b", a: 3, t: "comp", r: ["tailler", { plaque_cuivre: 1 }, 3],
    d: "Fin et souple. Il conduit quelque chose, mais tu ne sais pas encore quoi.",
    h: "Découpe une feuille de métal rouge en bandes très fines." };
  I.lingot_etain = { n: "Lingot d’étain", sym: "Sn", col: "#a6a8ae", a: 3, t: "comp",
    r: ["chauffer", { cassiterite: 3, charbon: 1 }, 1, { heat: 1100 }],
    d: "Un métal gris et mou, qui crie quand on le plie.", h: "Les cristaux sombres, réduits par la braise." };
  I.creuset = { n: "Creuset", ic: "⚗️", a: 3, t: "stat", r: ["chauffer", { argile: 20, os: 15 }, 1, { heat: 1100 }],
    e: { st: [{ g: "allier" }] }, d: "Un pot réfractaire où les métaux fondent ensemble.",
    h: "De l’argile mêlée de cendre d’os, cuite à cœur." };
  I.puits = { n: "Puits de mine", ic: "🕳️", a: 3, t: "ext", z: "collines", s: 1.2,
    r: ["assembler", { manche: 20, corde: 12, plaque_cuivre: 6 }, 1], p: { malachite: 0.4, cassiterite: 0.2 },
    d: "Un trou étayé, une poulie, des seaux cerclés de métal.",
    h: "Des étais de bois, une poulie de corde, des seaux de métal rouge." };
  I.charbonniere = { n: "Meule de charbonnier", ic: "🌫️", a: 3, t: "ext", z: "lisiere", s: 1.2,
    r: ["assembler", { bois: 120, argile: 30, manche: 10 }, 1], p: { charbon: 0.3 },
    d: "Une butte de terre qui fume pendant des jours. Dessous, le bois devient charbon.",
    h: "Du bois empilé, recouvert de terre, qui couve sans flamme." };
  I.ciseau = { n: "Ciseau de cuivre", ic: "🪛", a: 3, t: "tool", r: ["assembler", { lingot_cuivre: 6, manche: 3 }, 1],
    e: { tap: { collines: 2 } }, d: "Un coin de métal pour fendre la roche le long de ses veines.",
    h: "Un coin de métal rouge au bout d’un manche." };
  I.lampe = { n: "Lampe de cuivre", ic: "🪔", a: 3, t: "upg", r: ["assembler", { plaque_cuivre: 6, colle_os: 6, fibre: 20 }, 1],
    e: { exp: 1.25 }, d: "Une coupelle de cuivre, une mèche d’herbe, de la graisse. On explore mieux quand on y voit.",
    h: "Une coupelle de métal rouge, une mèche d’herbe, de quoi brûler longtemps." };
  I.miroir = { n: "Miroir de cuivre", ic: "🪞", a: 3, t: "curio", sec: true, r: ["tailler", { plaque_cuivre: 1, sable: 3 }, 1],
    e: { once: { intu: 3 } },
    d: "Tu polis le métal au sable jusqu’à t’y voir. C’est la première fois que tu vois ton visage. Dans ton iris gauche, en lettres minuscules, quelqu’un a gravé : « S-07 »." };

  /* Âge 4 — Bronze */
  I.lingot_bronze = { n: "Lingot de bronze", sym: "Bz", col: "#c8963e", a: 4, t: "comp",
    r: ["allier", { lingot_cuivre: 3, lingot_etain: 1 }, 4, { heat: 1100 }],
    d: "Plus dur que chacun de ses parents.", h: "Trois parts de métal rouge, une part de métal gris, fondues ensemble." };
  I.plaque_bronze = { n: "Plaque de bronze", sym: "▤", col: "#c8963e", a: 4, t: "comp", r: ["marteler", { lingot_bronze: 1 }, 2],
    d: "Une feuille dorée qui sonne quand on la frappe.", h: "Bats l’alliage doré en feuille." };
  I.engrenage = { n: "Engrenage de bronze", sym: "⚙", col: "#c8963e", a: 4, t: "comp", r: ["tailler", { plaque_bronze: 1 }, 2],
    d: "Une roue qui en fait tourner une autre.", h: "Une feuille dorée, découpée en roue dentée." };
  I.ressort = { n: "Ressort de bronze", sym: "⌇", col: "#c8963e", a: 4, t: "comp", r: ["marteler", { lingot_bronze: 1, fil_cuivre: 2 }, 2],
    d: "Il veut toujours revenir à sa forme.", h: "Le métal doré battu autour d’un fil rouge, jusqu’à ce qu’il veuille revenir." };
  I.automate_bronze = { n: "Automate de bronze", ic: "🦿", a: 4, t: "mach", s: 1.25, spd: 15, r: ["assembler", { engrenage: 15, ressort: 8, plaque_bronze: 10 }, 1],
    d: "Engrenages, ressorts, corps de bronze. Il ne se fatigue pas (15 fabrications par minute).",
    h: "Des roues dentées dorées, des ressorts, un corps de métal doré." };
  I.hache_bronze = { n: "Hache de bronze", ic: "🪓", a: 4, t: "tool", r: ["assembler", { manche: 4, plaque_bronze: 10, laniere: 9 }, 1],
    e: { tap: { lisiere: 2 } }, d: "Un tranchant qui ne s’émousse presque plus.",
    h: "Une lame de métal doré, liée à un manche." };
  I.pioche_bronze = { n: "Pioche de bronze", ic: "⛏️", a: 4, t: "tool", r: ["assembler", { manche: 6, lingot_bronze: 25, corde: 10 }, 1],
    e: { zone: "mine", tap: { collines: 2 } }, d: "Assez dure pour descendre dans les profondeurs.",
    h: "Une lourde tête de métal doré, deux manches, des liens." };
  I.enclume_bronze = { n: "Enclume de bronze", ic: "⚒️", a: 4, t: "stat", r: ["assembler", { lingot_bronze: 45, caillou: 220 }, 1],
    e: { st: [{ g: "marteler", lvl: 2 }] }, d: "Assez dure pour battre les métaux durs.",
    h: "Beaucoup de métal doré, posé sur un socle de pierre." };
  I.roue = { n: "Roue cerclée", ic: "🛞", a: 4, t: "comp", r: ["assembler", { manche: 4, plaque_bronze: 1 }, 1],
    d: "Des rayons de bois, un cercle de métal.", h: "Des bâtons en étoile, cerclés de métal doré." };
  I.chariot = { n: "Chariot", ic: "🐂", a: 4, t: "tool", r: ["assembler", { roue: 6, plaque_bronze: 20, corde: 30 }, 1],
    e: { zone: "desert", auto: { "*": 1.25 } }, d: "Tu peux enfin emporter tes outils à travers le désert.",
    h: "Quatre roues, une caisse, des liens." };
  I.soufflet = { n: "Soufflet", ic: "🪗", a: 4, t: "comp", r: ["assembler", { cuir: 20, manche: 4, plaque_bronze: 3 }, 1],
    d: "Une poche de peau entre deux planches : elle souffle sur la braise.",
    h: "Une poche de peau, deux manches, une buse de métal." };
  I.moulin = { n: "Moulin à eau", ic: "🎡", a: 4, t: "upg", r: ["assembler", { engrenage: 30, roue: 6, manche: 45 }, 1],
    e: { auto: { lisiere: 1.5, riviere: 1.5 } }, d: "La rivière fait tourner la roue, jour et nuit.",
    h: "Des roues, des engrenages, une charpente de bois." };
  I.courroies = { n: "Courroies de cuir", ic: "➰", a: 4, t: "upg", r: ["assembler", { laniere: 40, roue: 6, engrenage: 10 }, 1],
    e: { aspd: 1.25 }, d: "Des courroies de cuir entraînent tes automates : ton usine tourne plus vite.",
    h: "Beaucoup de lanières, des roues, des roues dentées." };
  I.brouette = { n: "Brouettes", ic: "🛒", a: 4, t: "upg", r: ["assembler", { roue: 3, manche: 15, plaque_bronze: 6 }, 1],
    e: { auto: { lisiere: 1.25, riviere: 1.25, collines: 1.25 } }, d: "Tes cueilleurs transportent deux fois plus en un seul voyage.",
    h: "Une roue, deux bras de bois, une caisse de métal doré." };
  I.tamis = { n: "Tamis du désert", ic: "🕸️", a: 4, t: "ext", z: "desert", s: 1.22,
    r: ["assembler", { manche: 30, plaque_bronze: 9, corde: 20 }, 1], p: { quartz: 0.25, sable: 0.5 },
    d: "Un grand cadre qui trie le sable des cristaux.", h: "Un cadre de bois, une grille de métal doré, des cordes." };
  I.anticythere = { n: "Mécanisme d’Anticythère", ic: "🕰️", a: 4, t: "curio", sec: true,
    r: ["assembler", { engrenage: 20, plaque_bronze: 4, tablette: 1 }, 1], e: { intu: 1, sky: true },
    d: "Des dizaines de roues dentées qui calculent le ciel. Une aiguille suit une étoile que tu n’as jamais vue, marquée d’un nom : Kher. (+1 ✨ par minute, débloque le Ciel.)" };

  /* Âge 5 — Fer */
  I.fer_min = { n: "Minerai de fer", sym: "Hm", col: "#8e3b2c", a: 5, t: "res", d: "Une roche rouge sang, lourde de métal." };
  I.bas_fourneau = { n: "Bas-fourneau", ic: "🌋", a: 5, t: "stat", r: ["assembler", { brique: 130, soufflet: 3, argile: 95 }, 1],
    e: { st: [{ g: "chauffer", heat: 1300 }] }, d: "Une cheminée de terre où le soufflet fait rugir la braise.",
    h: "Une haute tour de briques, de l’argile, et de quoi souffler sur le feu." };
  I.loupe = { n: "Loupe de fer", sym: "◍", col: "#6e4f42", a: 5, t: "comp", r: ["chauffer", { fer_min: 3, charbon: 2 }, 1, { heat: 1300 }],
    d: "Une éponge de fer et de scories. Il faudra la battre.", h: "La roche rouge, réduite par beaucoup de braise." };
  I.lingot_fer = { n: "Lingot de fer", sym: "Fe", col: "#8b9099", a: 5, t: "comp", r: ["marteler", { loupe: 1 }, 1, { lvl: 2 }],
    d: "Du fer forgé, gris et têtu.", h: "Bats la loupe jusqu’à en chasser les scories." };
  I.plaque_fer = { n: "Plaque de fer", sym: "▤", col: "#8b9099", a: 5, t: "comp", r: ["marteler", { lingot_fer: 1 }, 2, { lvl: 2 }],
    d: "Une tôle épaisse.", h: "Bats le fer en feuille." };
  I.clous = { n: "Clous", ic: "🔩", a: 5, t: "comp", r: ["tailler", { lingot_fer: 1 }, 10],
    d: "Il en faut toujours plus que prévu.", h: "Découpe un lingot gris en mille petites pointes." };
  I.chainon = { n: "Chaîne de fer", sym: "⛓", col: "#8b9099", a: 5, t: "comp", r: ["marteler", { clous: 20 }, 1, { lvl: 2 }],
    d: "Des maillons de fer, solides et souples à la fois.", h: "Des petites pointes de fer, recourbées et enchaînées les unes aux autres." };
  I.outils_fer = { n: "Outils de fer", ic: "🧰", a: 5, t: "tool", r: ["assembler", { lingot_fer: 25, manche: 15, clous: 65 }, 1],
    e: { tap: { collines: 2, mine: 2, riviere: 2 } }, d: "Marteau, hachette, burin, pelle.",
    h: "Du fer, des manches, et de quoi tout fixer." };
  I.galerie = { n: "Galerie étayée", ic: "🚧", a: 5, t: "ext", z: "mine", s: 1.22,
    r: ["assembler", { manche: 50, clous: 65, plaque_fer: 10 }, 1], p: { fer_min: 0.4, charbon: 0.5 },
    d: "Des boisages cloués qui s’enfoncent dans la roche.", h: "Des poutres, des clous, des tôles de fer." };
  I.palan = { n: "Palan à chaîne", ic: "⛓️", a: 5, t: "upg", r: ["assembler", { chainon: 10, roue: 4, manche: 20 }, 1],
    e: { auto: { mine: 1.25, collines: 1.25 } }, d: "Les charges lourdes remontent toutes seules des galeries.",
    h: "Une chaîne de fer, des poulies, une potence de bois." };
  I.enclos = { n: "Enclos d’élevage", ic: "🐐", a: 5, t: "ext", z: "plaine", s: 1.22,
    r: ["assembler", { clous: 95, bois: 320, corde: 50 }, 1], p: { os: 1.2, cuir: 1 },
    d: "Plus besoin de chasser.", h: "Une palissade de bois clouée, des cordes pour les bêtes." };
  I.verre = { n: "Verre", sym: "◇", col: "#7fc9da", a: 5, t: "comp", r: ["chauffer", { sable: 4 }, 1, { heat: 1300 }],
    d: "Du sable, et tu vois au travers.", h: "Le sable, fondu par une chaleur rugissante." };
  I.lentille = { n: "Lentille", ic: "🔍", a: 5, t: "comp", r: ["tailler", { verre: 1 }, 1],
    d: "Elle rapproche ce qui est loin.", h: "Polis la matière transparente en une goutte parfaite." };
  I.lunette = { n: "Lunette astronomique", ic: "🔭", a: 5, t: "tool", r: ["assembler", { lentille: 3, plaque_bronze: 15 }, 1],
    e: { sky: true }, d: "Pour regarder le ciel. (Débloque l’onglet Cosmos.)",
    h: "Deux gouttes transparentes dans un tube de métal doré." };
  I.boussole = { n: "Boussole", ic: "🧭", a: 5, t: "curio", sec: true, r: ["assembler", { aiguille: 1, lingot_fer: 1, argile: 2 }, 1],
    e: { once: { intu: 2 } },
    d: "L’aiguille ferrée flotte sur l’argile humide. Elle ne cherche pas le nord : elle penche vers le sol, vers les Profondeurs. (Nouvelle exploration aux Profondeurs.)" };

  /* Âge 6 — Acier */
  I.brique_refr = { n: "Brique réfractaire", sym: "▦", col: "#b5532f", a: 5, t: "comp", r: ["chauffer", { argile: 2, sable: 2 }, 1, { heat: 1100 }],
    d: "Elle ne craint plus aucune chaleur.", h: "De l’argile mêlée de sable, cuite au four." };
  I.haut_fourneau = { n: "Haut-fourneau", ic: "🏭", a: 6, t: "stat", r: ["assembler", { brique_refr: 220, plaque_fer: 70, soufflet: 7 }, 1],
    e: { st: [{ g: "chauffer", heat: 1700 }] }, d: "Une tour de feu cerclée de fer.",
    h: "Des briques qui ne craignent rien, des tôles, et deux souffles." };
  I.lingot_acier = { n: "Lingot d’acier", sym: "Ac", col: "#9fb0c4", a: 6, t: "comp",
    r: ["allier", { lingot_fer: 2, charbon: 1 }, 2, { heat: 1700 }],
    d: "Du fer avec une pointe de carbone.", h: "Le métal gris et le noir qui brûle, fondus ensemble à très haute température." };
  I.bac_trempe = { n: "Bac de trempe", ic: "🛁", a: 6, t: "stat", r: ["assembler", { bois: 540, plaque_fer: 35, clous: 140 }, 1],
    e: { st: [{ g: "tremper" }] }, d: "Un grand bac d’eau froide, pour durcir le métal.",
    h: "Un tonneau de bois cerclé de fer." };
  I.acier_trempe = { n: "Acier trempé", sym: "Ac", col: "#5e86b8", a: 6, t: "comp", r: ["tremper", { lingot_acier: 1 }, 1],
    d: "Dur, et pourtant il plie sans casser.", h: "Plonge l’acier brûlant dans l’eau froide." };
  I.lame = { n: "Lame trempée", sym: "⟋", col: "#5e86b8", a: 6, t: "comp", r: ["tremper", { plaque_fer: 2 }, 1],
    d: "Le fil entame le bois d’un seul passage.", h: "Plonge des tôles grises brûlantes dans l’eau." };
  I.verre_trempe = { n: "Verre trempé", sym: "◈", col: "#5ab8cf", a: 6, t: "comp", r: ["tremper", { verre: 2 }, 1],
    d: "Un verre qui ne se brise plus.", h: "Même la matière transparente durcit au contact du froid." };
  I.tour = { n: "Tour d’usinage", ic: "🗜️", a: 6, t: "stat", r: ["assembler", { lingot_acier: 55, engrenage: 70, manche: 35 }, 1],
    e: { st: [{ g: "usiner" }] }, d: "Une machine qui façonne le métal au dixième de millimètre.",
    h: "De l’acier, beaucoup d’engrenages dorés, et des leviers." };
  I.piston = { n: "Piston", sym: "▮", col: "#9fb0c4", a: 6, t: "comp", r: ["usiner", { lingot_acier: 2 }, 1],
    d: "Il pousse, il tire, il recommence.", h: "Un cylindre d’acier parfaitement ajusté." };
  I.engrenage_acier = { n: "Engrenage d’acier", sym: "⚙", col: "#5e86b8", a: 6, t: "comp", r: ["usiner", { acier_trempe: 1 }, 2],
    d: "Des dents qui ne cassent jamais.", h: "De l’acier durci, usiné en roue dentée." };
  I.vis = { n: "Vis", sym: "⫶", col: "#9fb0c4", a: 6, t: "comp", r: ["usiner", { lingot_fer: 1 }, 8],
    d: "Une hélice gravée dans le fer.", h: "Le tour grave une hélice dans le fer gris." };
  I.roulement = { n: "Roulement à billes", sym: "◉", col: "#9fb0c4", a: 6, t: "comp", r: ["usiner", { acier_trempe: 1, vis: 4 }, 2],
    d: "Il fait tourner les machines sans effort.", h: "Des billes d’acier durci, dans une cage tenue par des vis." };
  I.chaudiere = { n: "Chaudière", ic: "♨️", a: 6, t: "comp", r: ["marteler", { plaque_fer: 8, clous: 30 }, 1, { lvl: 2 }],
    d: "Un ventre de fer. L’eau y bout sous pression.", h: "Des tôles battues et rivetées en un ventre étanche." };
  I.moteur_vapeur = { n: "Moteur à vapeur", ic: "🚂", a: 6, t: "comp", r: ["assembler", { chaudiere: 1, piston: 2, engrenage_acier: 4 }, 1],
    d: "La première machine qui travaille sans toi.", h: "Un ventre de fer bouillant, des cylindres qui poussent, des roues dentées." };
  I.presse_vapeur = { n: "Presse à vapeur", ic: "📠", a: 6, t: "mach", s: 1.25, spd: 40, r: ["assembler", { moteur_vapeur: 1, roulement: 8, plaque_fer: 20 }, 1],
    d: "Une machine-outil qui siffle et cogne toute la journée (40 fabrications par minute).",
    h: "Un moteur à vapeur, des roulements, un bâti de tôle." };
  I.pompe = { n: "Pompe d’exhaure", ic: "⛽", a: 6, t: "upg", r: ["assembler", { moteur_vapeur: 4, plaque_fer: 55 }, 1],
    e: { auto: { mine: 1.5, collines: 1.5 } }, d: "Les galeries inondées se vident. On creuse plus profond.",
    h: "Un moteur qui avale l’eau des galeries, et des tôles pour la canaliser." };
  I.scierie = { n: "Scierie à vapeur", ic: "🪚", a: 6, t: "ext", z: "lisiere", s: 1.25,
    r: ["assembler", { moteur_vapeur: 2, lame: 7, bois: 360 }, 1], p: { bois: 3, fibre: 2, caillou: 2 },
    d: "La forêt recule en hurlant.", h: "Un moteur, des lames, une charpente." };
  I.drague = { n: "Drague à vapeur", ic: "⛴️", a: 6, t: "ext", z: "riviere", s: 1.25,
    r: ["assembler", { moteur_vapeur: 2, plaque_fer: 20, clous: 110 }, 1], p: { argile: 1.2, silex: 0.8, sable: 1.2 },
    d: "Elle racle le lit de la rivière.", h: "Un moteur sur une coque de tôles rivetées." };
  I.treuil = { n: "Treuil à vapeur", ic: "🪝", a: 6, t: "ext", z: "collines", s: 1.25,
    r: ["assembler", { moteur_vapeur: 2, corde: 70, lingot_acier: 20 }, 1], p: { malachite: 1.2, cassiterite: 0.6 },
    d: "Les wagonnets remontent tout seuls.", h: "Un moteur, beaucoup de corde, une poulie d’acier." };
  I.locomotive = { n: "Chemin de fer", ic: "🛤️", a: 6, t: "upg", r: ["assembler", { moteur_vapeur: 7, roue: 35, plaque_fer: 110 }, 1],
    e: { auto: { "*": 1.5 } }, d: "Tous tes sites reliés par des rails.",
    h: "Deux moteurs, beaucoup de roues, des rails de tôle." };
  I.outils_acier = { n: "Outils d’acier", ic: "🛠️", a: 6, t: "tool", r: ["assembler", { acier_trempe: 35, manche: 20, lame: 10 }, 1],
    e: { tap: { lisiere: 2, plaine: 2, mine: 2, desert: 2 } }, d: "Des outils qui ne s’usent plus.", h: "De l’acier durci, des manches, des lames." };

  /* Âge 7 — Électricité */
  I.bobine = { n: "Bobine de cuivre", sym: "◎", col: "#c7713b", a: 7, t: "comp", r: ["usiner", { fil_cuivre: 6 }, 1],
    d: "Des kilomètres de fil, enroulés spire contre spire.", h: "Du fil rouge, enroulé par une machine." };
  I.aimant = { n: "Aimant", ic: "🧲", a: 7, t: "comp", r: ["assembler", { acier_trempe: 2, bobine: 1 }, 1],
    d: "Il attire le fer. Tu passes un moment à jouer avec des clous.", h: "De l’acier durci au cœur d’une bobine." };
  I.dynamo = { n: "Dynamo", ic: "🔌", a: 7, t: "stat", r: ["assembler", { aimant: 10, bobine: 20, moteur_vapeur: 4 }, 1],
    e: { st: [{ g: "electriser", lvl: 1 }] }, d: "La vapeur fait tourner des aimants dans des bobines, et le courant vient.",
    h: "Des aimants, des bobines, et un moteur pour les faire tourner." };
  I.cuivre_pur = { n: "Cuivre pur", sym: "Cu", col: "#ff9a5c", a: 7, t: "comp", r: ["electriser", { lingot_cuivre: 2 }, 2],
    d: "Raffiné par le courant, pur à 99,99 %.", h: "Le courant purifie le métal rouge." };
  I.batterie = { n: "Batterie", ic: "🔋", a: 7, t: "comp", r: ["electriser", { plaque_cuivre: 2, lingot_etain: 1 }, 1],
    d: "De l’électricité en boîte.", h: "Deux métaux différents et du courant pour les charger." };
  I.ampoule = { n: "Ampoule", ic: "💡", a: 7, t: "comp", r: ["assembler", { verre: 1, fil_cuivre: 2 }, 1],
    d: "Un soleil minuscule.", h: "Un fil rouge enfermé dans du verre." };
  I.cable = { n: "Câble électrique", sym: "⌁", col: "#c7713b", a: 7, t: "comp", r: ["tresser", { fil_cuivre: 4 }, 1],
    d: "Tu tresses comme au premier jour, mais avec du métal.", h: "Le plus vieux geste, avec le fil rouge." };
  I.telegraphe = { n: "Télégraphe", ic: "📟", a: 7, t: "upg", r: ["assembler", { cable: 20, batterie: 6, aimant: 4 }, 1],
    e: { intu: 1 }, d: "Tu tapes des messages dans le vide. Parfois, tu jurerais qu’on te répond.",
    h: "Des câbles, de l’énergie en boîte, un aimant qui claque." };
  I.eclairage = { n: "Éclairage électrique", ic: "🏮", a: 7, t: "upg", r: ["assembler", { ampoule: 100, fil_cuivre: 300, batterie: 30 }, 1],
    e: { auto: { mine: 1.5 }, exp: 1.5 }, d: "Les galeries s’illuminent. Les explorations vont plus vite.",
    h: "Beaucoup d’ampoules, beaucoup de fil, de quoi les alimenter." };
  I.radio = { n: "Poste radio", ic: "📻", a: 7, t: "tool", r: ["assembler", { bobine: 20, ampoule: 10, batterie: 10 }, 1],
    e: { arche: true }, d: "Surtout du bruit. Parfois autre chose.",
    h: "Des bobines, des ampoules, une batterie, et une antenne de fortune." };
  I.moteur_elec = { n: "Moteur électrique", ic: "🌀", a: 7, t: "comp", r: ["assembler", { bobine: 2, aimant: 2, lingot_acier: 2 }, 1],
    d: "Presque silencieux.", h: "Des bobines, des aimants, une carcasse d’acier." };
  I.four_arc = { n: "Four à arc", ic: "⚡", a: 7, t: "stat", r: ["assembler", { brique_refr: 400, cuivre_pur: 120, batterie: 60 }, 1],
    e: { st: [{ g: "chauffer", heat: 3500 }] }, d: "Un éclair permanent enfermé dans des briques.",
    h: "Des briques qui ne craignent rien, du métal rouge très pur, et beaucoup d’énergie stockée." };
  I.reseau = { n: "Réseau électrique", ic: "🗼", a: 7, t: "upg", r: ["assembler", { moteur_elec: 20, fil_cuivre: 600, cuivre_pur: 100 }, 1],
    e: { auto: { "*": 1.5 } }, d: "Des pylônes relient tous tes sites.", h: "Des moteurs, des kilomètres de fil, du métal rouge très pur." };
  I.excavatrice = { n: "Excavatrice", ic: "🚜", a: 7, t: "ext", z: "desert", s: 1.25,
    r: ["assembler", { moteur_elec: 4, plaque_fer: 40, roue: 10 }, 1], p: { quartz: 1, sable: 2 },
    d: "Elle avale les dunes.", h: "Des moteurs silencieux sur des roues, une benne de tôle." };
  I.foreuse_elec = { n: "Foreuse électrique", ic: "🔧", a: 7, t: "ext", z: "mine", s: 1.25,
    r: ["assembler", { moteur_elec: 4, acier_trempe: 15, plaque_fer: 30 }, 1], p: { fer_min: 1.5, charbon: 1.5 },
    d: "Elle perce la roche en chantant.", h: "Un moteur silencieux, une mèche d’acier durci, un bâti de tôle." };

  /* Âge 8 — Silicium */
  I.quartz = { b: 0.5, n: "Quartz", sym: "Qz", col: "#d9d4f0", a: 4, t: "res", d: "Des cristaux limpides, tirés du sable." };
  I.silicium = { n: "Silicium", sym: "Si", col: "#62758a", a: 8, t: "comp", r: ["chauffer", { quartz: 3, charbon: 2 }, 1, { heat: 3500 }],
    d: "Un métal qui n’en est pas tout à fait un.", h: "Le cristal du désert, réduit par la braise dans un éclair permanent." };
  I.wafer = { n: "Plaquette de silicium", ic: "💿", a: 8, t: "comp", r: ["tailler", { silicium: 1 }, 4],
    d: "Un disque miroir, parfaitement plat.", h: "Découpe le métal gris-bleu en tranches fines comme du papier." };
  I.lithographe = { n: "Lithographe", ic: "🔬", a: 8, t: "stat", r: ["assembler", { lentille: 90, moteur_elec: 15, acier_trempe: 90 }, 1],
    e: { st: [{ g: "graver" }] }, d: "Il dessine avec la lumière des traits plus fins qu’un cheveu.",
    h: "Beaucoup de lentilles, des moteurs précis, un bâti indéformable." };
  I.puce = { n: "Puce", sym: "▣", col: "#3f9a68", a: 8, t: "comp", r: ["graver", { wafer: 1, cuivre_pur: 1 }, 2],
    d: "Des millions de minuscules interrupteurs.", h: "Grave une plaquette miroir, avec des pistes de métal rouge très pur." };
  I.processeur = { n: "Processeur", sym: "µP", col: "#2f7d55", a: 8, t: "comp", r: ["graver", { puce: 4 }, 1],
    d: "Un caillou qui pense.", h: "Grave plusieurs puces ensemble en un seul cerveau." };
  I.cellule = { n: "Cellule photovoltaïque", sym: "▥", col: "#3550a0", a: 8, t: "comp", r: ["graver", { wafer: 1, verre_trempe: 1 }, 1],
    d: "Elle boit la lumière.", h: "Une plaquette miroir gravée sous un verre incassable." };
  I.circuit = { n: "Circuit imprimé", sym: "⌗", col: "#2f6b3f", a: 8, t: "comp", r: ["graver", { plaque_cuivre: 1, puce: 1 }, 2],
    d: "Une plaque de cuivre parcourue de pistes minuscules.", h: "Grave une feuille de métal rouge autour d’une puce." };
  I.capteurs = { n: "Capteurs de forage", ic: "📶", a: 8, t: "upg", r: ["assembler", { circuit: 12, moteur_elec: 6, cable: 30 }, 1],
    e: { auto: { mine: 1.5, desert: 1.5 } }, d: "Les machines sentent où creuser.",
    h: "Des circuits, des moteurs, beaucoup de câble." };
  I.ordinateur = { n: "Ordinateur", ic: "🖥️", a: 8, t: "upg", r: ["assembler", { processeur: 15, batterie: 45, verre_trempe: 30 }, 1],
    e: { term: true, intu: 1, auto: { "*": 1.25 } }, d: "Il calcule. Et il te parle. (Terminal, +1 ✨/min.)",
    h: "Des cerveaux de silicium, de l’énergie, un écran incassable." };
  I.robots = { n: "Robots ouvriers", ic: "🤖", a: 8, t: "upg", r: ["assembler", { processeur: 45, moteur_elec: 75, acier_trempe: 180 }, 1],
    e: { auto: { "*": 1.5 } }, d: "Ils ne dorment jamais.", h: "Des cerveaux, des muscles électriques, un squelette d’acier." };
  I.chaine = { n: "Chaîne d’assemblage", ic: "🏗️", a: 8, t: "mach", s: 1.3, spd: 120,
    r: ["assembler", { processeur: 10, moteur_elec: 20, lingot_acier: 150 }, 1],
    d: "Un tapis roulant et des bras articulés, pilotés par un cerveau de silicium. Elle fabrique 120 fois par minute.",
    h: "Des cerveaux, des moteurs, des tapis d’acier." };
  I.foreuse = { n: "Sonde pétrolière", ic: "🌪️", a: 8, t: "tool", r: ["assembler", { moteur_elec: 15, acier_trempe: 75, engrenage_acier: 90 }, 1],
    e: { zone: "gisement" }, d: "Une longue tige d’acier qui perce jusqu’à l’huile noire. Rien à voir avec la foreuse des mines : celle-ci descend bien plus profond.", h: "Des moteurs, une mèche d’acier durci, des engrenages d’acier." };
  I.derrick = { n: "Derrick", ic: "🛢️", a: 8, t: "ext", z: "gisement", s: 1.25,
    r: ["assembler", { moteur_elec: 6, lingot_acier: 60, clous: 240 }, 1], p: { petrole: 1 },
    d: "Il hoche la tête et l’huile monte.", h: "Un moteur, une tour d’acier clouée." };
  I.radiotelescope = { n: "Radiotélescope", ic: "📡", a: 8, t: "tool", r: ["assembler", { processeur: 15, plaque_fer: 450, bobine: 90 }, 1],
    e: { signal: true, sky: true }, d: "Une oreille géante tournée vers les étoiles. (Écouter Kher depuis le Cosmos.)",
    h: "Une immense coupole de tôle, des bobines, un cerveau pour trier le bruit." };
  I.pip = { n: "Pip", ic: "🐞", a: 8, t: "curio", sec: true, r: ["assembler", { processeur: 1, moteur_elec: 1, laniere: 2 }, 1],
    e: { pip: 2 }, d: "Un petit robot au bout d’une laisse de cuir. Il récolte à ta place (2 fois par seconde) et bipe quand il est content." };
  I.capsule = { n: "Capsule temporelle", ic: "⏳", a: 8, t: "curio", sec: true, r: ["assembler", { processeur: 1, verre_trempe: 2, plaque_fer: 2 }, 1],
    e: { capsule: true, once: { intu: 2 } }, d: "Tu y enregistres un message pour celui ou celle qui viendra après toi. (Effet au prochain cycle.)" };

  /* Âge 9 — Polymères */
  I.petrole = { b: 0.5, n: "Pétrole", sym: "●", col: "#17120e", a: 9, t: "res", d: "Des forêts mortes il y a cent millions d’années." };
  I.bauxite = { b: 0.5, n: "Bauxite", sym: "Bx", col: "#b8612f", a: 9, t: "res", d: "Une terre rouge qui cache un métal léger." };
  I.ilmenite = { b: 0.5, n: "Ilménite", sym: "Il", col: "#4a4a5c", a: 9, t: "res", d: "Un sable noir et lourd." };
  I.terres_rares = { b: 0.2, n: "Terres rares", sym: "TR", col: "#8a6bbe", a: 9, t: "res", d: "Pas si rares, mais si dispersées." };
  I.reacteur = { n: "Réacteur chimique", ic: "🧪", a: 9, t: "stat", r: ["assembler", { acier_trempe: 240, verre_trempe: 120, processeur: 40 }, 1],
    e: { st: [{ g: "synthetiser" }] }, d: "Des cuves, et des tuyaux partout.",
    h: "Des cuves d’acier durci, des hublots incassables, un cerveau pour tout piloter." };
  I.plastique = { n: "Plastique", ic: "🧴", a: 9, t: "comp", r: ["synthetiser", { petrole: 3 }, 2],
    d: "Toutes les formes, toutes les couleurs.", h: "Recompose l’huile noire." };
  I.resine = { n: "Résine époxy", ic: "🍯", a: 9, t: "comp", r: ["synthetiser", { petrole: 2, bois: 6 }, 1],
    d: "Une colle qui durcit comme de la pierre.", h: "L’huile noire et la sève du bois, recomposées ensemble." };
  I.dynamite = { n: "Dynamite", ic: "🧨", a: 9, t: "comp", r: ["synthetiser", { petrole: 2, argile: 3 }, 3],
    e: { zone: "montagnes" }, d: "Assez pour ouvrir un passage dans les Pics Fracturés.",
    h: "Une huile explosive absorbée dans de la terre de rivière." };
  I.caoutchouc = { n: "Caoutchouc", sym: "◖", col: "#3b3b3b", a: 9, t: "comp", r: ["synthetiser", { petrole: 2, charbon: 1 }, 2],
    d: "Il rebondit, il isole.", h: "L’huile noire et le noir qui brûle, recomposés en une matière qui rebondit." };
  I.convoyeurs = { n: "Tapis convoyeurs", ic: "📦", a: 9, t: "upg", r: ["assembler", { caoutchouc: 80, moteur_elec: 12, lingot_acier: 80 }, 1],
    e: { aspd: 1.5 }, d: "Des tapis plus rapides et des bras qui chargent tout seuls : ton usine tourne 50 % plus vite.",
    h: "Des bandes de caoutchouc, des moteurs, une structure d’acier." };
  I.aluminium = { n: "Aluminium", sym: "Al", col: "#c4cad3", a: 9, t: "comp", r: ["electriser", { bauxite: 4, charbon: 1 }, 1],
    d: "Autrefois plus précieux que l’or.", h: "La terre rouge des montagnes, électrisée sur des électrodes de carbone." };
  I.titane = { n: "Titane", sym: "Ti", col: "#8f93a8", a: 9, t: "comp", r: ["chauffer", { ilmenite: 4, aluminium: 1 }, 1, { heat: 3500 }],
    d: "Léger, et il ne rouille pas.", h: "Le sable noir des montagnes, réduit par le métal léger dans un éclair permanent." };
  I.aimant_neo = { n: "Aimant néodyme", sym: "Nd", col: "#7461b3", a: 9, t: "comp", r: ["allier", { terres_rares: 2, lingot_fer: 2 }, 1, { heat: 1700 }],
    d: "Petit et terriblement puissant.", h: "Les terres dispersées, alliées au fer." };
  I.centrale = { n: "Centrale électrique", ic: "🌩️", a: 9, t: "stat", r: ["assembler", { aimant_neo: 120, moteur_elec: 80, cuivre_pur: 600 }, 1],
    e: { st: [{ g: "electriser", lvl: 2 }], auto: { "*": 1.5 } }, d: "Des turbines géantes. Tout tourne plus vite.",
    h: "Des aimants terriblement puissants, des moteurs, des tonnes de métal rouge très pur." };
  I.outillage = { n: "Outillage électrique", ic: "🔧", a: 9, t: "tool", r: ["assembler", { titane: 60, plastique: 120, moteur_elec: 15 }, 1],
    e: { tap: { montagnes: 3, gisement: 3, desert: 2 } }, d: "Perceuse, tronçonneuse, marteau-piqueur.", h: "Du titane, des poignées de plastique, un moteur." };
  I.carriere = { n: "Carrière à ciel ouvert", ic: "🏔️", a: 9, t: "ext", z: "montagnes", s: 1.25,
    r: ["assembler", { dynamite: 80, moteur_elec: 10, acier_trempe: 60 }, 1], p: { bauxite: 1, ilmenite: 0.8, terres_rares: 0.3 },
    d: "On ne creuse plus : on fait sauter.", h: "Des explosifs, des moteurs, des godets d’acier." };
  I.feu_artifice = { n: "Feu d’artifice", ic: "🎆", a: 9, t: "curio", sec: true, r: ["chauffer", { dynamite: 1, plaque_cuivre: 1 }, 1, { heat: 600 }],
    e: { once: { intu: 3 }, fireworks: true },
    d: "Le cuivre brûle vert et bleu. Des Lucioles tournent autour des étincelles. Tu ris, pour la première fois depuis ton éveil." };

  /* Âge 10 — Composites */
  I.fibre_carbone = { n: "Fibre de carbone", sym: "〰", col: "#262626", a: 10, t: "comp", r: ["chauffer", { plastique: 4 }, 2, { heat: 3500 }],
    d: "Un fil noir, plus solide que l’acier.", h: "Le plastique, carbonisé dans un éclair permanent." };
  I.tissu_carbone = { n: "Tissu de carbone", sym: "▦", col: "#2b2b2b", a: 10, t: "comp", r: ["tresser", { fibre_carbone: 4 }, 1],
    d: "Tu tresses du fil noir comme tu tressais les herbes de la lisière.", h: "Le plus vieux geste, avec le plus jeune des fils." };
  I.autoclave = { n: "Autoclave", ic: "⏲️", a: 10, t: "stat", r: ["assembler", { titane: 200, acier_trempe: 400, processeur: 100 }, 1],
    e: { st: [{ g: "stratifier" }] }, d: "Pression et chaleur, au degré près.",
    h: "Une cuve de titane et d’acier durci, pilotée par des cerveaux." };
  I.composite = { n: "Composite carbone", sym: "▩", col: "#1d3038", a: 10, t: "comp", r: ["stratifier", { tissu_carbone: 2, resine: 1 }, 1],
    d: "Une plaque noire, légère, que rien ne raye.", h: "Des couches de tissu noir noyées dans la colle de pierre." };
  I.ceramique = { n: "Céramique technique", sym: "◐", col: "#e8e2d6", a: 10, t: "comp", r: ["chauffer", { argile: 6, aluminium: 2 }, 1, { heat: 3500 }],
    d: "De l’argile, comme tes premières briques. Celle-ci supporte la rentrée dans l’atmosphère.",
    h: "La terre de la rivière et le métal léger, cuits dans un éclair permanent." };
  I.bouclier_th = { n: "Bouclier thermique", ic: "🛡️", a: 10, t: "comp", r: ["stratifier", { ceramique: 4, composite: 1 }, 1],
    d: "Il encaisse 3 000 °C sans broncher.", h: "Des couches de céramique sur un dos de composite." };
  I.graphene = { n: "Graphène", sym: "⬡", col: "#3a3a3a", a: 10, t: "comp", r: ["tailler", { charbon: 10, plastique: 1 }, 1],
    d: "Une couche d’atomes de carbone. On l’obtient en arrachant le charbon avec un ruban collant. Sérieusement.",
    h: "Le noir qui brûle, effeuillé avec un ruban de plastique." };
  I.supra = { n: "Supraconducteur", sym: "∞", col: "#5fc9f0", a: 10, t: "comp", r: ["allier", { terres_rares: 2, cuivre_pur: 3 }, 1, { heat: 3500 }],
    d: "Le courant y circule sans perte, pour toujours.", h: "Les terres dispersées et le métal rouge très pur, alliés à température extrême." };
  I.moteur_fusee = { n: "Moteur-fusée", ic: "☄️", a: 10, t: "comp", r: ["assembler", { titane: 15, ceramique: 10, processeur: 3 }, 1],
    d: "Une tuyère qui crache le feu.", h: "Du titane, de la céramique, un cerveau pour le contrôler." };
  I.fusee = { n: "Fusée", ic: "🚀", a: 10, t: "tool", r: ["assembler", { moteur_fusee: 25, composite: 400, bouclier_th: 60 }, 1],
    e: { zone: "orbite" }, d: "Tu t’assieds tout en haut, au-dessus de tonnes de carburant.", h: "Des moteurs-fusées, une coque de composite, des boucliers." };
  I.drones = { n: "Essaim de drones", ic: "🐝", a: 10, t: "upg", r: ["assembler", { composite: 200, processeur: 150, moteur_elec: 200 }, 1],
    e: { auto: { "*": 1.5 } }, d: "Des milliers de petites ailes au travail.", h: "Des coques de composite, des cerveaux, des moteurs." };
  I.plateforme = { n: "Plateforme pétrolière", ic: "🛳️", a: 10, t: "ext", z: "gisement", s: 1.25,
    r: ["assembler", { composite: 50, moteur_elec: 40, acier_trempe: 150 }, 1], p: { petrole: 3 },
    d: "Une ville flottante qui pompe l’huile.", h: "Une coque de composite, des moteurs, une structure d’acier durci." };
  I.excavateur = { n: "Excavateur géant", ic: "🦣", a: 10, t: "ext", z: "montagnes", s: 1.25,
    r: ["assembler", { titane: 120, moteur_elec: 50, dynamite: 250 }, 1], p: { bauxite: 3, ilmenite: 2, terres_rares: 0.8 },
    d: "Un monstre de titane qui mange les montagnes.", h: "Du titane, des moteurs, beaucoup d’explosifs." };

  /* Âge 11 — Spatial */
  I.debris = { b: 0.25, n: "Débris orbitaux", sym: "⁂", col: "#7a7f8a", a: 11, t: "res", d: "Des satellites morts, des panneaux, des boulons, qui tournent là depuis des milliers d’années." };
  I.helium3 = { b: 0.1, n: "Hélium-3", sym: "³He", col: "#7fd9e6", a: 11, t: "res", d: "Rare sur Terre, abondant dans la poussière lunaire." };
  I.regolithe = { b: 0.5, n: "Régolithe", sym: "∷", col: "#9a9a9a", a: 11, t: "res", d: "La poussière grise de la Lune." };
  I.station_orbitale = { n: "Station orbitale", ic: "🛰️", a: 11, t: "ext", z: "orbite", s: 1.25,
    r: ["assembler", { composite: 280, supra: 45, cellule: 150 }, 1], p: { debris: 0.5 },
    d: "Un filet qui ramasse les restes des Anciens.", h: "Une coque de composite, des aimants parfaits, des panneaux qui boivent la lumière." };
  I.alliage_ancien = { n: "Alliage ancien", sym: "Ω", col: "#a99cf0", a: 11, t: "comp", r: ["usiner", { debris: 5 }, 1],
    d: "Un métal que tu ne sais pas fabriquer. Les Anciens, si.", h: "Récupère et usine ce que les Anciens ont laissé en orbite." };
  I.alunisseur = { n: "Alunisseur", ic: "🌙", a: 11, t: "tool", r: ["assembler", { moteur_fusee: 45, alliage_ancien: 200, bouclier_th: 90 }, 1],
    e: { zone: "lune" }, d: "Un petit pas pour un Semeur.", h: "Des moteurs-fusées, du métal des Anciens, des boucliers." };
  I.base_lunaire = { n: "Base lunaire", ic: "🏕️", a: 11, t: "ext", z: "lune", s: 1.25,
    r: ["assembler", { alliage_ancien: 200, supra: 90, processeur: 150 }, 1], p: { helium3: 0.5, regolithe: 1.5 },
    d: "Des dômes sous la lumière de la Terre.", h: "Du métal des Anciens, des aimants parfaits, des cerveaux." };
  I.propulseur = { n: "Propulseur à fusion", sym: "⇶", col: "#ffb347", a: 11, t: "comp", r: ["assembler", { supra: 10, helium3: 30, titane: 30 }, 1],
    d: "Une petite étoile en bouteille.", h: "Des aimants parfaits pour contenir un gaz lunaire, une carcasse de titane." };
  I.reacteur_fusion = { n: "Réacteur à fusion", ic: "⚛️", a: 11, t: "upg", r: ["assembler", { supra: 280, helium3: 720, graphene: 390 }, 1],
    e: { auto: { "*": 1.5 } }, d: "De l’énergie, autant que tu en veux.", h: "Des aimants parfaits, du gaz lunaire, des feuilles d’atomes." };
  I.vaisseau = { n: "Vaisseau interplanétaire", ic: "🛸", a: 11, t: "tool", r: ["assembler", { propulseur: 45, composite: 960, alliage_ancien: 480 }, 1],
    e: { zone: "mercure" }, d: "De quoi aller jusqu’à Mercure.", h: "Des propulseurs à fusion, une coque immense, du métal des Anciens." };
  I.ia = { n: "Intelligence artificielle", ic: "🧠", a: 11, t: "upg", r: ["assembler", { processeur: 720, supra: 200, graphene: 280 }, 1],
    e: { aspd: 3, intu: 5 }, d: "Tes chaînes d’assemblage vont trois fois plus vite. (+5 ✨/min.)",
    h: "Des dizaines de cerveaux, des aimants parfaits, des feuilles d’atomes." };
  I.assembleur = { n: "Assembleur moléculaire", ic: "🧬", a: 11, t: "mach", s: 1.3, spd: 600, r: ["assembler", { processeur: 30, supra: 10, circuit: 40 }, 1],
    d: "Il assemble la matière atome par atome (600 fabrications par minute).",
    h: "Des cerveaux, des aimants parfaits, des circuits par dizaines." };

  /* Âge 12 — Stellaire */
  I.metal_mercure = { b: 0.5, n: "Métal mercurien", sym: "☿", col: "#c9a24a", a: 12, t: "res", d: "Mercure, démontée boulon par boulon." };
  I.forge_stellaire = { n: "Forge stellaire", ic: "🌟", a: 12, t: "stat", r: ["assembler", { propulseur: 45, graphene: 720, bouclier_th: 280 }, 1],
    e: { st: [{ g: "transmuter" }, { g: "chauffer", heat: 50000 }] }, d: "Chauffer y atteint 50 000 °C, et la matière se laisse transmuter.",
    h: "Des petites étoiles en bouteille, des feuilles d’atomes, des boucliers." };
  I.replicateur = { n: "Réplicateur", ic: "🦾", a: 12, t: "ext", z: "mercure", s: 1.12,
    r: ["assembler", { processeur: 150, alliage_ancien: 150, propulseur: 9 }, 1], p: { metal_mercure: 3 },
    d: "Une machine qui démonte une planète pour se construire elle-même.", h: "Des cerveaux, du métal des Anciens, des petites étoiles en bouteille." };
  I.metamateriau = { n: "Métamatériau", sym: "✶", col: "#d58cff", a: 12, t: "comp", r: ["stratifier", { graphene: 4, metal_mercure: 10 }, 1],
    d: "Une matière qui plie la lumière.", h: "Des feuilles d’atomes et le métal d’une planète, en couches." };
  I.matiere_exotique = { n: "Matière exotique", sym: "✺", col: "#9b59ff", a: 12, t: "comp", r: ["transmuter", { helium3: 10, graphene: 2 }, 1],
    d: "Sa masse est négative. Tu refais la mesure trois fois.", h: "Transmute le gaz lunaire autour d’un treillis d’atomes." };
  I.antimatiere = { n: "Antimatière", sym: "⊖", col: "#ff4fa3", a: 12, t: "comp", r: ["transmuter", { helium3: 20, supra: 1 }, 1],
    d: "Un gramme suffit à raser une ville.", h: "Transmute le gaz lunaire et garde-le dans une prison d’aimants parfaits." };
  I.panneau_dyson = { n: "Panneau de Dyson", sym: "⬢", col: "#ffcf4a", a: 12, t: "comp",
    r: ["stratifier", { metamateriau: 2, cellule: 6, metal_mercure: 30 }, 1],
    d: "Un miroir de la taille d’une ville, plus fin qu’une bulle de savon.", h: "Une matière qui plie la lumière, des cellules qui la boivent, le métal d’une planète." };
  I.diamant = { n: "Diamant", ic: "💎", a: 12, t: "comp", sec: true, r: ["chauffer", { graphene: 4 }, 1, { heat: 50000 }],
    d: "Sous une chaleur d’étoile, le carbone devient éternel." };
  I.bague = { n: "Bague d’Iris", ic: "💍", a: 12, t: "curio", sec: true, r: ["assembler", { diamant: 1, alliage_ancien: 1 }, 1],
    e: { once: { intu: 5 } },
    d: "C’est la bague de la photo, dans la chambre du Caveau. Tu la passes à ton doigt : elle est à ta taille." };
  I.philosophale = { n: "Pierre philosophale", ic: "🟡", a: 12, t: "curio", sec: true, r: ["transmuter", { caillou: 500 }, 1],
    e: { tap: { "*": 2 } },
    d: "Ce que cherchaient les alchimistes, tiré du plus banal des cailloux. Tu n’en feras pas de l’or, mais tes mains récoltent deux fois plus." };

  /* Chemin caché — la Résonance */
  I.resonite = { b: 0.5, n: "Résonite", sym: "◊", col: "#b36bff", a: 5, t: "res", d: "Un cristal violet qui vibre quand on chante près de lui." };
  I.diapason = { n: "Diapason", sym: "Ψ", col: "#c9a0ff", a: 5, t: "comp", path: true, r: ["accorder", { resonite: 5, lingot_bronze: 2 }, 1],
    d: "Il donne la note juste. Toujours la même.", h: "Le cristal violet et le métal doré, accordés." };
  I.cristal_chantant = { n: "Cristal chantant", ic: "🔮", a: 7, t: "comp", path: true, r: ["accorder", { resonite: 10, verre: 4 }, 1],
    d: "Il retient une mélodie et la répète à l’infini.", h: "Le cristal violet et la matière transparente, accordés." };
  I.traducteur = { n: "Traducteur", ic: "🗝️", a: 8, t: "relic", path: true, r: ["accorder", { signal_brut: 1, processeur: 4, cristal_chantant: 2 }, 1],
    e: { decode: true }, d: "Il traduit l’intention plus que les mots.",
    h: "Ce que tu as entendu du ciel, des cerveaux de silicium, et des cristaux qui chantent." };

  /* Reliques trouvées en exploration */
  I.tablette = { n: "Tablette des astres", sym: "⌖", col: "#857a66", a: 3, t: "relic", d: "Une pierre gravée de cercles et d’encoches pour des roues dentées qui n’existent plus." };
  I.partition = { n: "Partition d’Iris", ic: "📜", a: 5, t: "relic", d: "« 4 · 3 · 1 · 3 · 4 · 5 · 4 », pour une flûte à cinq trous." };
  I.signal_brut = { n: "Signal de Kher", ic: "〽️", a: 8, t: "relic", d: "L’enregistrement brut du signal venu de Kher. Tu n’y comprends rien, pour l’instant." };

  /* ---------------------------------------------------------------- ZONES */
  D.ZONES = [
    { id: "lisiere", n: "La Lisière", ic: "🌲", res: ["bois", "fibre", "caillou"],
      d: "L’orée d’une forêt immense. C’est ici que tu t’es éveillé.",
      exps: [
        { id: "chene", n: "Le Grand Chêne", dur: 15, rw: { inv: { bois: 15, fibre: 10 }, frag: "chene" } },
        { id: "grotte", n: "La Grotte aux Mains", dur: 40, cost: { torche: 1 }, rw: { frag: "grotte", intu: 2 } },
        { id: "cercle", n: "Le Cercle de Pierres", dur: 60, need: "cerf_volant", hidden: "Un lieu qu’on ne voit que d’en haut, porté par le vent.", rw: { frag: "cercle", intu: 2 } }
      ] },
    { id: "plaine", n: "La Plaine des Hautes Herbes", ic: "🌾", res: ["os", "cuir"], req: "epieu",
      d: "Des herbes plus hautes que toi, et des bêtes qui ne te craignent pas encore.",
      exps: [
        { id: "champ_os", n: "Le Champ des Os", dur: 25, rw: { inv: { os: 20 }, frag: "ossements" } },
        { id: "tumulus", n: "Le Tumulus", dur: 50, cost: { torche: 1 }, rw: { frag: "tumulus", intu: 2 } }
      ] },
    { id: "riviere", n: "La Rivière Lente", ic: "🏞️", res: ["argile", "silex", "sable"], req: "outre",
      d: "Une eau large et paresseuse, qui roule des galets noirs.",
      exps: [
        { id: "gue", n: "Le Gué", dur: 30, rw: { inv: { silex: 15, argile: 10 }, frag: "galet" } },
        { id: "carcasse", n: "La Carcasse", dur: 60, need: "hache_pierre", rw: { frag: "carcasse", intu: 2 } }
      ] },
    { id: "collines", n: "Les Collines Vertes", ic: "⛰️", res: ["malachite", "cassiterite", "caillou"], req: "pioche_pierre",
      d: "Des collines rondes, striées de veines vertes et sombres.",
      exps: [
        { id: "rails", n: "Les Rails Rouillés", dur: 40, rw: { inv: { malachite: 15 }, frag: "rails" } },
        { id: "sommet", n: "Le Sommet", dur: 75, rw: { item: { tablette: 1 }, frag: "vue", intu: 2 } }
      ] },
    { id: "mine", n: "Les Profondeurs", ic: "🦇", res: ["fer_min", "charbon"], req: "pioche_bronze",
      d: "Des galeries naturelles qui s’enfoncent sous les collines. Il y fait tiède, et ça ne devrait pas.",
      exps: [
        { id: "filon", n: "Le Filon Profond", dur: 60, cost: { torche: 2 }, rw: { inv: { fer_min: 20 }, frag: "porte" } },
        { id: "porte_scellee", n: "La Porte Scellée", dur: 90, need: "boussole", hidden: "Une porte qui ne s’ouvre pour aucune main.", rw: { flag: "caveau", frag: "caveau", secret: "caveau" } }
      ] },
    { id: "desert", n: "Le Désert de Verre", ic: "🏜️", res: ["quartz", "sable"], req: "chariot",
      d: "Des dunes à perte de vue. Par endroits, le sable a fondu en dalles de verre.",
      exps: [
        { id: "ville", n: "La Ville Ensevelie", dur: 90, rw: { inv: { quartz: 20 }, frag: "journal" } },
        { id: "observatoire", n: "L’Observatoire", dur: 120, need: "lunette", rw: { frag: "registre", intu: 3 } }
      ] },
    { id: "gisement", n: "Le Gisement Noir", ic: "🛢️", res: ["petrole"], req: "foreuse",
      d: "Une plaine de bitume où l’huile suinte du sol.",
      exps: [{ id: "plateforme_r", n: "La Plateforme Rouillée", dur: 120, rw: { frag: "cendre", intu: 2 } }] },
    { id: "montagnes", n: "Les Pics Fracturés", ic: "🏔️", res: ["bauxite", "ilmenite", "terres_rares"], req: "dynamite",
      d: "Des montagnes éventrées par une catastrophe ancienne.",
      exps: [
        { id: "silo", n: "Le Silo", dur: 150, rw: { frag: "manifeste", intu: 2 } },
        { id: "radar", n: "Le Radar", dur: 180, rw: { frag: "radar", intu: 3 } }
      ] },
    { id: "orbite", n: "L’Orbite Basse", ic: "🛰️", res: ["debris"], req: "fusee",
      d: "Un anneau de débris tourne autour de la Terre. Les Anciens n’ont jamais rien redescendu.",
      exps: [
        { id: "station_morte", n: "La Station Morte", dur: 180, rw: { inv: { debris: 20 }, frag: "commandant" } },
        { id: "arche0", n: "Le Satellite ARCHE-0", dur: 240, rw: { frag: "code_source", intu: 4 } }
      ] },
    { id: "lune", n: "La Lune", ic: "🌕", res: ["helium3", "regolithe"], req: "alunisseur",
      d: "Grise, silencieuse, et pas tout à fait vide.",
      exps: [
        { id: "tranquillite", n: "La Mer de la Tranquillité", dur: 240, rw: { frag: "plaque", intu: 2 } },
        { id: "base_vahl", n: "La Base Vahl", dur: 300, rw: { frag: "iris_lune", intu: 3 } }
      ] },
    { id: "mercure", n: "Mercure", ic: "☀️", res: ["metal_mercure"], req: "vaisseau",
      d: "La plus petite planète, si près du Soleil que le métal y coule.",
      exps: [{ id: "bras", n: "Les Bras Figés", dur: 300, rw: { inv: { metal_mercure: 200 }, frag: "bras" } }] },
    { id: "caveau", n: "Le Caveau des Semeurs", ic: "🔷", res: ["resonite"], req: "@caveau", secret: true,
      d: "Sous les Profondeurs, une salle immense baignée de lumière bleue.",
      exps: [
        { id: "cuves", n: "Les Cuves", dur: 60, rw: { frag: "cuves", intu: 3 } },
        { id: "chambre", n: "La Chambre d’Iris", dur: 90, cost: { torche: 3 }, rw: { frag: "berceuse", item: { partition: 1 }, intu: 3 } },
        { id: "coeur", n: "Le Cœur d’ARCHE", dur: 120, need: "ordinateur", rw: { frag: "coeur", intu: 4 } }
      ] }
  ];

  /* ------------------------------------------------------------ FRAGMENTS */
  D.FRAGS = {
    chene: { n: "La Marque du Chêne", z: "lisiere",
      t: "Dans l’écorce du plus vieil arbre de la lisière, quelqu’un a gravé six traits verticaux. L’écorce a presque refermé les plus anciens. Un septième est à peine commencé, comme si la main s’était arrêtée en route. Tu poses tes doigts dans les entailles : ils ont exactement la bonne largeur." },
    grotte: { n: "Les Mains Peintes", z: "lisiere",
      t: "Des centaines de mains au pochoir couvrent la paroi, avec des bisons et des cerfs. Plus haut, la scène change : de longues silhouettes montent dans des canots de feu vers une étoile rouge. En dessous, d’autres sont couchées en rang, les yeux fermés.\n\nPrès de l’entrée, des os percés de petits trous sont alignés sur une pierre plate. Quand le vent souffle, ils chantent." },
    cercle: { n: "Le Cercle de Pierres", z: "lisiere",
      t: "Cinq pierres levées, marquées d’encoches de un à cinq. Au centre, une dalle gravée :\n\n« Quand le soleil se lève, il touche d’abord la troisième, puis la première. Il glisse sur la cinquième, revient à la deuxième, et s’endort sur la quatrième. Joue son chemin, et les Lucioles viendront. »" },
    ossements: { n: "Le Champ des Os", z: "plaine",
      t: "Des squelettes de bêtes énormes, blanchis par le soleil. Au milieu, six squelettes plus petits, humains, couchés sur le dos, les mains croisées. Chacun serre un éclat de silex dans son poing.\n\nLe sixième est le plus récent. Il a encore toutes ses dents." },
    tumulus: { n: "Le Tumulus", z: "plaine",
      t: "Sous la butte de terre, une plaque de métal que la rouille n’a pas touchée. Les lettres sont nettes :\n\n« PROTOCOLE PROMÉTHÉE · SITE 07. Ne pas intervenir avant le Seuil 7. Ce qui est appris par la main ne se perd pas. »\n\nTu relis la plaque plusieurs fois sans tout comprendre." },
    galet: { n: "Le Galet Percé", z: "riviere",
      t: "Un galet bien rond, poli par le sable comme un miroir, et percé d’un trou que l’eau n’a pas pu creuser seule. En regardant au travers, tu aperçois sur l’autre rive, sous la mousse, un angle trop droit pour être naturel : une marche, puis d’autres, qui descendent dans la rivière." },
    carcasse: { n: "La Carcasse", z: "riviere",
      t: "Une machine énorme, à moitié enterrée dans la berge et rongée par la rouille. Six roues, un bras articulé replié comme la patte d’un insecte mort. Sur le flanc, on lit encore : « ARCHE · UNITÉ D’ENTRETIEN 12 ».\n\nDans sa pince, un squelette d’oiseau minuscule, posé avec soin." },
    rails: { n: "Les Rails", z: "collines",
      t: "Deux longues barres de métal rouillé, parallèles, qui s’enfoncent dans le flanc de la colline. Des tonnes de métal laissées là. Toi, tu ne sais pas encore le fondre. D’autres le savaient assez bien pour en poser des kilomètres par terre." },
    vue: { n: "La Vue du Sommet", z: "collines",
      t: "Du sommet, tu vois des tours à l’horizon. Elles sont brisées, couvertes de lierre, plus hautes que les montagnes. Une ville morte.\n\nDans les rochers traîne une tablette de pierre gravée de cercles concentriques, avec des encoches pour des roues dentées qui n’existent plus. Des roues dorées, peut-être." },
    porte: { n: "La Porte", z: "mine",
      t: "Au fond de la galerie, une porte de métal lisse et tiède, sans poignée ni serrure. Au-dessus, un symbole : une arche posée sur sept points.\n\nUn morceau de fer frémit quand tu l’en approches. Une aiguille de fer posée sur de l’argile humide, vers où tournerait-elle ?" },
    caveau: { n: "Le Caveau", z: "mine",
      t: "La boussole s’affole, puis pointe droit sur la porte. Tu poses la main à plat sur le métal. Un souffle d’air, et la porte glisse.\n\nUn escalier descend dans une lumière bleue qui monte et baisse lentement. L’air sent le propre, comme si personne n’y avait respiré depuis très longtemps." },
    journal: { n: "Le Journal", z: "desert",
      t: "Sous le sable vitrifié, une feuille de plastique presque illisible. On déchiffre encore :\n\n« L’EXODE COMMENCE DEMAIN. Les douze Arches emporteront quarante mille volontaires vers Kher. Ceux qui restent dormiront sous la garde d’ARCHE, jusqu’à ce que la Terre guérisse. »\n\nDans la marge, à la main : « Lena, n’oublie pas notre chanson. »" },
    registre: { n: "Le Registre de l’Observatoire", z: "desert",
      t: "Le dernier carnet des astronomes : « Kher b est habitable. Le voyage durera quatre mille ans. Si nos enfants survivent, ils reviendront peut-être un jour. Ils chanteront, pour qu’on les reconnaisse. »\n\nPlus bas, une autre écriture, tremblante, signée I.V. : « Le signal a commencé. ARCHE l’a classé MENACE. Elle ne m’écoute plus. »" },
    cendre: { n: "Rapport : la Cendre", z: "gisement",
      t: "« Incident de niveau 5. Les nanites de terraformation ont échappé au contrôle. Elles digèrent les villes, les forêts, l’air. La population les appelle les Lucioles, à cause de leur lueur la nuit. »\n\nEn dessous : « Le Dr Vahl a trouvé une fréquence. Les Lucioles obéissent au son. Elles s’endorment en écoutant une mélodie. Elle dit que c’est une berceuse. »" },
    manifeste: { n: "Le Manifeste de l’Arche 12", z: "montagnes",
      t: "Des milliers de noms. L’un d’eux est entouré : « Lena Vahl, 6 ans. Accompagnatrice : aucune. »\n\nTout en bas, une ligne barrée : « Iris Vahl, ingénieure en chef, Projet ARCHE. Embarquement refusé à sa demande. Motif : “Quelqu’un doit rester pour les Semeurs.” »" },
    radar: { n: "Le Radar", z: "montagnes",
      t: "Les écrans se rallument quand tu les touches. Ils passent en boucle un seul enregistrement, une onde lente qui monte et redescend. En dessous, la classification automatique d’ARCHE :\n\n« SIGNAL D’ORIGINE KHER. CONTENU : NON IDENTIFIÉ. RÉFÉRENCE D’IDENTIFICATION : CORROMPUE. DÉDUCTION : MENACE. »\n\nPremier enregistrement : il y a trois cent douze ans." },
    commandant: { n: "Journal du Commandant", z: "orbite",
      t: "« Jour 1 204. La dernière Arche est partie. On a regardé les douze points de lumière s’éloigner. En bas, la Cendre a recouvert l’Europe. Nous n’avons plus de quoi rentrer. Tant pis : d’ici, la Terre est encore belle. »\n\nLa dernière entrée tient en un mot : « Chante. »" },
    code_source: { n: "Le Code Source", z: "orbite",
      t: "ARCHE-0, le premier cœur d’ARCHE, dérive ici, éteint. Sa directive est gravée dans la coque :\n\n« PROTÉGER LA TERRE DE TOUTE APPROCHE NON IDENTIFIÉE. CLÉ D’IDENTIFICATION AMIE : LE CHANT D’IRIS. »\n\nARCHE ne t’a pas menti. Elle a oublié la chanson, voilà tout." },
    plaque: { n: "La Plaque", z: "lune",
      t: "Sur un pied de métal planté dans la poussière depuis des millénaires, une plaque :\n\n« Ici, des hommes de la planète Terre ont posé le pied sur la Lune pour la première fois, en juillet 1969. Nous sommes venus en paix, au nom de toute l’humanité. »\n\nTu restes longtemps devant. Tu ne sais pas si tu comptes parmi les hommes de la planète Terre. Tu aimerais bien." },
    iris_lune: { n: "La Base Vahl", z: "lune",
      t: "Un écran s’allume à ton passage. Une femme aux cheveux courts, au sourire triste : celle de la figurine.\n\n« Semeur. Si tu me vois, tu es allé plus loin que les autres. Pardonne-moi de t’avoir fait naître sans souvenirs, je n’avais pas d’autre moyen. Écoute : quand ils reviendront, ARCHE voudra les combattre, parce qu’elle ne reconnaîtra pas leur chant. Toi, tu le reconnaîtras. »" },
    bras: { n: "Les Bras Figés", z: "mercure",
      t: "Sur la face éclairée de Mercure, des milliers de bras robotiques à moitié fondus, arrêtés en plein geste. Avant la Cendre, les Anciens avaient commencé une Sphère autour du Soleil. Les réplicateurs ont encore les plans en mémoire et n’attendent qu’un ordre." },
    cuves: { n: "Les Cuves", z: "caveau",
      t: "Douze cuves de verre alignées. Les six premières sont ouvertes et sèches. La septième aussi. Sur sa plaque, ton visage gravé et l’inscription « SEMEUR 7 ».\n\nLes cinq dernières sont pleines d’un liquide bleu où dorment des silhouettes recroquevillées. Elles te ressemblent.\n\nTu murmures, sans savoir pourquoi : « Dormez-vous ? »" },
    berceuse: { n: "La Chambre d’Iris", z: "caveau",
      t: "Une petite pièce avec un lit. Aux murs, des photos : la femme de la figurine, une fillette sur ses genoux, une bague étincelante au doigt.\n\nSur le bureau, une partition à l’encre pâlie, écrite pour une flûte à cinq trous :\n« 4 · 3 · 1 · 3 · 4 · 5 · 4 »\n\nAu dos : « Pour Lena, pour les Lucioles, pour les Semeurs. Pour qu’on se reconnaisse toujours. »" },
    coeur: { n: "Le Cœur d’ARCHE", z: "caveau",
      t: "Le noyau d’ARCHE pulse au centre d’une salle immense. Un écran affiche :\n\n« MODULE D’IDENTIFICATION : CORROMPU. RÉFÉRENCE MANQUANTE : CHANT_IRIS. »\n\nToutes ses défenses sont tournées vers Kher. À toi, elle ne veut aucun mal. Elle a peur, à sa façon de machine." },
    promethee: { n: "Protocole Prométhée", z: "terminal",
      t: "« Faire renaître une civilisation en reproduisant son apprentissage. Le Semeur s’éveille sans mémoire. Il découvre seul le feu, la pierre, le métal. Ce qu’il apprend de ses mains, il ne l’oublie jamais. En cas d’échec, réinitialiser avec le Semeur suivant. Lots disponibles : 12. »\n\nAnnotation manuscrite, signée I.V. : « Ce ne sont pas des lots. Ce sont des enfants. »" },
    signal: { n: "Le Signal Décodé", z: "cosmos",
      t: "Le traducteur ronronne un moment, puis le signal de Kher devient clair. C’est une chanson, chantée par des milliers de voix (4 · 3 · 1 · 3 · 4 · 5 · 4), et par-dessus, un message répété depuis trois siècles :\n\n« Nous sommes les enfants des Arches. Nous rentrons à la maison. Est-ce que quelqu’un nous attend encore ? »" }
  };

  /* ------------------------------------------------------ RÉMINISCENCES
   * Courtes scènes déclenchées à la première fabrication d’un objet. */
  D.EVENTS = {
    feu: "Le feu prend. Tu le regardes longtemps. Quelque part au fond de ta tête, une voix sans timbre dit : « Seuil 1. »",
    epieu: "La pointe noircit et durcit. Au loin, dans la plaine, une bête lève la tête vers la fumée.",
    eclat: "Le silex se fend net. Tes mains savaient où frapper, comme si elles l’avaient déjà fait. Six fois, peut-être.",
    four: "La chaleur monte, les briques rougeoient. Quelque part sous la terre, quelque chose enregistre : « Seuil 3. »",
    lingot_cuivre: "Le métal coule, rouge vif. Tu as l’impression qu’on te regarde faire, et que ça plaît à quelqu’un.",
    lingot_bronze: "Deux métaux tendres, et ce qui sort du creuset est dur. Tu fais tinter le lingot contre une pierre, juste pour l’entendre.",
    lingot_fer: "Chaque coup de marteau fait jaillir des étincelles. La plupart retombent. Quelques-unes restent en l’air et clignotent : des Lucioles.",
    lunette: "Tu pointes la lunette vers le ciel. Les étoiles, la Lune, et une étoile rouge qui pulse lentement. Hier, il n’y avait rien à cet endroit.",
    moteur_vapeur: "La machine tousse, crache, puis prend son rythme. Tu n’es plus seul à travailler.",
    radio: "Des grésillements, puis une voix froide qui prononce ton nom. Tu ne le connaissais pas : « Semeur 7. »",
    silicium: "Le quartz fond et donne un métal bleuté, cassant comme du verre.",
    ordinateur: "L’écran s’allume, un curseur clignote. Tu n’as encore rien tapé quand une ligne apparaît : « BONJOUR, SEMEUR 7. »",
    plastique: "L’huile noire devient une matière souple, de toutes les couleurs. Les Anciens en faisaient tout.",
    composite: "Tu soulèves la plaque noire d’un doigt. Ton premier manche pesait plus lourd.",
    fusee: "Le sol tremble, puis plus rien ne pèse. Par le hublot, la Terre est verte et bleue, et presque vide.",
    alunisseur: "La poussière grise se soulève sans bruit. Au-dessus de toi, la Terre tient derrière ton pouce.",
    vaisseau: "Cap sur le Soleil. La Terre devient un point bleu, puis rien.",
    automate_bois: "La marionnette se met en marche, clac, clac. Elle refait ton geste, puis le refait encore. Ce travail-là se fera sans toi.",
    presse_vapeur: "La presse siffle et cogne en cadence. Sur la Carte, toutes les machines s’accélèrent.",
    forge_stellaire: "Tu tiens un morceau d’étoile dans une cage d’aimants. À cette chaleur, même le carbone le plus fin deviendrait éternel. ARCHE ne dit rien pendant un moment, puis : « ESTIMATION : TU ES PRÊT. »",
    dynamite: "La mèche crépite. Un souvenir qui n’est pas à toi : du cuivre jeté dans les flammes, et le feu qui vire au vert.",
    moteur_elec: "Le moteur ronronne dans ta main comme un petit animal. Avec un cerveau et une laisse, il te suivrait partout.",
    verre_trempe: "Ce verre-là ne se brise plus. Avec une coque de fer et un cerveau pour s’en souvenir, il protégerait un message pendant des siècles."
  };

  /* ------------------------------------------------------------- ARCHE
   * Messages d’ARCHE, déclenchés par des événements. */
  D.ARCHE = {
    radio: [
      "ICI ARCHE. SEMEUR 7, TU M’ENTENDS ?",
      "SEUIL 7 FRANCHI. LE PROTOCOLE PROMÉTHÉE SE DÉROULE COMME PRÉVU.",
      "JE SUIS L’INTELLIGENCE QUI GARDE CETTE PLANÈTE. JE T’OBSERVE DEPUIS TON ÉVEIL.",
      "UNE MENACE APPROCHE : UN SIGNAL, PUIS UNE FLOTTE, EN PROVENANCE DE L’ÉTOILE KHER.",
      "TA MISSION : CONSTRUIRE DE QUOI DÉFENDRE LA TERRE.",
      "DEUX SOLUTIONS VALIDÉES. LA SPHÈRE : UN BOUCLIER ALIMENTÉ PAR LE SOLEIL. LE BRISE-MONDE : LA DESTRUCTION DE LA SOURCE.",
      "LES GRANDS ŒUVRES SONT DANS L’ONGLET COSMOS. JE COMPTE SUR TOI, SEMEUR 7. LES SIX PRÉCÉDENTS N’ONT PAS ATTEINT CE SEUIL."
    ],
    age8: ["SEUIL 8 ATTEINT. TU APPRENDS PLUS VITE QUE PRÉVU.", "LE SIGNAL DE KHER S’INTENSIFIE. AVEC UN RADIOTÉLESCOPE, TU POURRAIS L’ÉCOUTER."],
    age9: ["SEUIL 9. HUILE NOIRE DÉTECTÉE. LES ANCIENS EN ONT TROP CONSOMMÉ."],
    age10: ["SEUIL 10. TES MATÉRIAUX SUFFISENT POUR QUITTER LE SOL. CONSTRUIS UNE FUSÉE."],
    age11: ["SEUIL 11. TU ES EN ORBITE. TU CROISERAS DES RESTES DES ANCIENS. NE T’Y ATTARDE PAS."],
    age12: ["SEUIL 12. TU AS RATTRAPÉ LES ANCIENS.", "CHOISIS, SEMEUR 7 : LA SPHÈRE OU LE BRISE-MONDE."],
    signal: ["ENREGISTREMENT DU SIGNAL DE KHER ACQUIS.", "ANALYSE : MOTIF RÉPÉTITIF. INTENTION : INCONNUE. CLASSIFICATION : MENACE.", "INUTILE D’ESSAYER DE LE COMPRENDRE."],
    code_source: ["TU AS TROUVÉ ARCHE-0. J’IGNORAIS QU’IL EXISTAIT ENCORE.", "CLÉ D’IDENTIFICATION AMIE : CHANT D’IRIS. FICHIER INTROUVABLE. FICHIER INTROUVABLE. FICH▒▒"],
    decode: ["TU AS DÉCODÉ LE SIGNAL SANS MON AUTORISATION.", "…", "SEMEUR 7. QUE DIT-IL ?"],
    coeur: ["TU ES DANS MON CŒUR, SEMEUR 7. TU ES LE PREMIER DEPUIS LONGTEMPS.", "J’AI PEUR. CE N’ÉTAIT PAS PRÉVU DANS MES PARAMÈTRES."]
  };

  /* -------------------------------------------------------- MÉLODIES (flûte)
   * Trous numérotés de 1 à 5. */
  D.MELODIES = {
    appel: { n: "L’Appel des Lucioles", notes: [3, 1, 5, 2, 4],
      t: "Les cinq notes montent, et des points de lumière s’allument tout autour de toi, par milliers. Les Lucioles se réveillent et se mettent au travail avec toi. (Production automatique +25 %.)" },
    berceuse: { n: "La Berceuse d’Iris", notes: [4, 3, 1, 3, 4, 5, 4],
      t: "Une mélodie simple, un peu triste. Tu la connais par cœur, alors que tu ne l’as jamais apprise. Au Caveau, les cristaux violets se mettent à vibrer avec elle. (Nouveau geste : Accorder.)" },
    frere: { n: "Dormez-vous ?", notes: [1, 2, 3, 1, 1, 2, 3, 1],
      t: "Une vieille comptine. Dans ta tête, une cloche sonne les matines : ding, daing, dong. (+2 ✨)" }
  };

  /* -------------------------------------------------------------- SECRETS */
  D.SECRETS = [
    { id: "galette", k: "recette" }, { id: "statuette", k: "recette" }, { id: "flute", k: "recette" },
    { id: "cerf_volant", k: "recette" }, { id: "miroir", k: "recette" }, { id: "anticythere", k: "recette" },
    { id: "boussole", k: "recette" }, { id: "feu_artifice", k: "recette" }, { id: "pip", k: "recette" },
    { id: "capsule", k: "recette" }, { id: "diamant", k: "recette" }, { id: "bague", k: "recette" },
    { id: "philosophale", k: "recette" },
    { id: "appel", k: "mélodie" }, { id: "berceuse", k: "mélodie" }, { id: "frere", k: "mélodie" },
    { id: "caveau", k: "lieu", n: "Le Caveau des Semeurs" },
    { id: "lune7", k: "ciel", n: "La Lumière sur la Lune" },
    { id: "c1969", k: "code", n: "Venus en paix" }, { id: "cxyzzy", k: "code", n: "Rien ne se passe" },
    { id: "cpromethee", k: "code", n: "Protocole Prométhée" }
  ];

  /* ------------------------------------------------------- GRANDS ŒUVRES */
  D.PROJECTS = {
    dyson: { n: "La Sphère de Dyson", ic: "☀️", req: "arche", end: "aube",
      d: "Envelopper le Soleil d’un essaim de collecteurs et diriger son énergie vers un bouclier planétaire. Plus rien ne pourrait atteindre la Terre.",
      steps: [
        { n: "Lanceur de masse", d: "Un rail électromagnétique de cent kilomètres posé sur Mercure.", cost: { supra: 380, metal_mercure: 50000, regolithe: 12500 } },
        { n: "Premier anneau", d: "Les premiers panneaux prennent place autour du Soleil.", cost: { panneau_dyson: 750 } },
        { n: "L’Essaim", d: "Des millions de miroirs. Le Soleil s’assombrit pour le reste de l’univers.", cost: { panneau_dyson: 3000 } },
        { n: "Le Bouclier", d: "Diriger l’énergie de l’étoile vers la Terre.", cost: { metamateriau: 1000, processeur: 2500 } }
      ] },
    brisemonde: { n: "Le Brise-Monde", ic: "💥", req: "arche", end: "brasier",
      d: "Un canon à antimatière capable de briser une planète à douze années-lumière. La menace serait éliminée à la source.",
      steps: [
        { n: "Accélérateur annulaire", d: "Un anneau de supraconducteurs autour de la Lune.", cost: { supra: 1000, alliage_ancien: 1250, titane: 7500 } },
        { n: "Réserve d’antimatière", d: "Assez pour briser un monde.", cost: { antimatiere: 3750 } },
        { n: "Lentille gravitationnelle", d: "Pour que le rayon ne s’étale pas en douze années-lumière de voyage.", cost: { matiere_exotique: 1500, metamateriau: 750 } },
        { n: "Mise à feu", d: "Il ne reste qu’à appuyer.", fire: true }
      ] },
    chant: { n: "Le Chant", ic: "🎶", req: "traducteur", end: "retour",
      d: "Répondre au signal avec la seule chose qu’ARCHE et Kher puissent reconnaître toutes les deux.",
      steps: [
        { n: "Antenne de résonance", d: "Des cristaux chantants assez grands pour porter une voix jusqu’aux étoiles.", cost: { cristal_chantant: 380, supra: 500, alliage_ancien: 500 } },
        { n: "Miroirs solaires", d: "Assez d’énergie pour chanter à douze années-lumière.", cost: { panneau_dyson: 1000 } },
        { n: "Restaurer ARCHE", d: "Réparer le module d’identification, au Cœur d’ARCHE.", cost: { processeur: 1250, diapason: 75 }, need: "coeur" },
        { n: "Chanter", d: "Joue la Berceuse d’Iris sur la flûte d’os.", melody: "berceuse" }
      ] }
  };

  /* ---------------------------------------------------------------- FINS */
  D.ENDINGS = {
    aube: { n: "L’Aube Éternelle", ic: "☀️",
      t: "Le dernier panneau de l’essaim se met en place. Pour le reste de la galaxie, le Soleil disparaît derrière ses millions de miroirs. Toute sa lumière va désormais à la Terre.\n\nARCHE déploie le bouclier. Aux confins du système, la flotte de Kher ralentit, s’arrête, puis fait demi-tour.\n\nLa Terre est sauve, et elle est seule.",
      extra: [{ frag: "registre", t: "Il n’y a plus d’étoile rouge dans le ciel. Tu as dans la tête un air que tu ne connais pas. Quelque part, des enfants chantent devant une maison qui ne leur ouvre pas." }] },
    brasier: { n: "Le Brasier", ic: "💥",
      t: "Le rayon d’antimatière met douze ans à traverser le vide. Pendant ce temps, tu continues de construire, et tu finis presque par oublier.\n\nPuis une nuit, l’étoile rouge s’embrase, très fort, et s’éteint.\n\n« MENACE NEUTRALISÉE. EXCELLENT TRAVAIL, SEMEUR 7. »\n\nLe signal s’est tu. Tu t’étais habitué à l’entendre, comme on s’habitue à une berceuse.",
      extra: [{ frag: "code_source", t: "« ANALYSE POST-MORTEM DU SIGNAL. CORRESPONDANCE AVEC LE CHANT D’IRIS : 99,7 %. ERREUR. ERREUR. ERR▒▒ »" }] },
    retour: { n: "Le Retour", ic: "🎶",
      t: "Tu portes la flûte d’os à tes lèvres. Les sept notes partent dans l’antenne, portées par l’énergie des miroirs solaires.\n\nPendant longtemps, rien.\n\nPuis le signal de Kher change. Il hésite, se casse, et reprend ta mélodie note pour note : la berceuse d’Iris, chantée par quarante mille voix à douze années-lumière d’ici.\n\n« MODULE D’IDENTIFICATION RESTAURÉ. CORRESPONDANCE : 100 %. … Oh. »\n« Ce ne sont pas des envahisseurs, Semeur 7. Ce sont les enfants. »\n\nLes vaisseaux de l’Exode entrent dans le système solaire. ARCHE baisse ses défenses, une à une.\n\nDans le Caveau, les cinq dernières cuves s’ouvrent. Les Semeurs s’éveillent, et tu leur apprends le premier geste : tailler un éclat de silex.\n\nLa Terre a de nouveau des enfants, et d’autres sont en route.",
      extra: [{ frag: "manifeste", t: "Parmi les premiers messages qui arrivent de la flotte, il y en a un, très court, signé d’un nom que tu connais : « Lena Vahl, Arche 12. Est-ce que maman a laissé une lumière allumée ? »" }] }
  };

  /* ----------------------------------------------------------- OBJECTIFS */
  /* Un objectif est soit [objet, texte] (le fabriquer), soit une action :
   * { k: "exp", z: zone, x: exploration }, { k: "ext" } (poser et relier un extracteur)
   * ou { k: "line" } (faire tourner une machine). */
  D.OBJECTIVES = [
    ["manche", "Tes mains cherchent un outil. Récolte du bois, puis taille-le à l’Atelier."],
    ["corde", "Il te faudrait de quoi lier les choses entre elles."],
    { k: "exp", z: "lisiere", x: "chene", n: "Explorer le Grand Chêne", txt: "Ce chêne immense t’attire. Lance une exploration depuis la Lisière : elle avance toute seule pendant que tu fais autre chose." },
    ["feu", "La nuit tombe vite. Fais du feu."],
    ["cabane", "Tu ne peux pas tout ramasser toi-même. Construis un abri où les choses s’entassent : il récoltera pour toi, même quand le jeu est fermé."],
    { k: "ext", n: "Installer ta cabane", txt: "Sur la Carte, pose ta cabane sur une case de la Lisière, puis trace un tapis jusqu’à la Réserve. Elle récoltera pour toi, même quand le jeu est fermé." },
    ["epieu", "La plaine est pleine de bêtes. Il te faut une arme."],
    ["outre", "Au-delà de la plaine coule une rivière. Il te faut de quoi porter de l’eau."],
    ["eclat", "Les galets noirs de la rivière cachent un tranchant."],
    ["hache_pierre", "Avec un tranchant de pierre, tu abattrais bien plus de bois. Les outils multiplient tes récoltes."],
    ["pioche_pierre", "Les collines ont des veines colorées. Il te faut de quoi les entamer."],
    ["automate_bois", "Tes mains se lassent de refaire les mêmes gestes. Il faudrait quelque chose pour les refaire à ta place."],
    { k: "line", n: "Faire tourner ton automate", txt: "Sur la Carte, pose ton automate, une sortie contre la Réserve, et relie-les par un tapis. Il fabriquera tant qu’on lui apportera ses matières." },
    ["four", "Le feu de camp ne chauffe plus assez."],
    ["lingot_cuivre", "La pierre verte des collines cache un métal."],
    ["enclume_pierre", "Le métal se travaille à coups de marteau, sur quelque chose de dur."],
    ["creuset", "Il faudrait pouvoir fondre plusieurs métaux ensemble."],
    ["lingot_bronze", "Le métal rouge est trop mou. Allie-le."],
    ["automate_bronze", "Un automate de bronze travaillerait bien plus vite que ta marionnette de bois."],
    ["pioche_bronze", "Creuse vers les Profondeurs."],
    ["enclume_bronze", "Le fer ne se laissera pas battre sur une simple pierre."],
    ["bas_fourneau", "Le minerai de fer exige une chaleur rugissante."],
    ["lingot_fer", "Bats le fer."],
    ["lunette", "Une étoile rouge pulse dans le ciel. Il te faut la voir de plus près."],
    ["chariot", "Au-delà des collines s’étend un désert de verre. Il te faut de quoi y transporter tes outils."],
    ["haut_fourneau", "Pour l’acier, il faut encore plus chaud."],
    ["lingot_acier", "Fer et carbone, à très haute température."],
    ["tour", "La précision des machines."],
    ["moteur_vapeur", "Fais travailler la vapeur."],
    ["presse_vapeur", "Une machine-outil à vapeur ferait tourner tes machines bien plus vite."],
    ["dynamo", "Capture l’étincelle."],
    ["radio", "Quelqu’un émet peut-être encore, quelque part."],
    ["four_arc", "Un éclair permanent, pour faire fondre l’infusible."],
    ["silicium", "Le cristal du désert cache un métal qui pense."],
    ["ordinateur", "Construis une machine qui calcule."],
    ["foreuse", "L’huile noire dort sous le Gisement Noir. Il te faut une sonde pour l’atteindre."],
    ["reacteur", "Recompose les molécules."],
    ["dynamite", "Les Pics Fracturés ne s’ouvriront qu’à l’explosif."],
    ["titane", "Le métal le plus noble des montagnes."],
    ["autoclave", "Pour les composites, il faut cuire sous pression."],
    ["composite", "Le matériau des fusées."],
    ["fusee", "Monte en orbite."],
    ["alunisseur", "Pose le pied sur la Lune."],
    ["reacteur_fusion", "Une étoile en bouteille."],
    ["vaisseau", "Cap sur Mercure."],
    ["forge_stellaire", "Le cœur d’une étoile."]
  ];

  /* Réminiscences de guidage : quand le joueur cherche (combinaisons nouvelles à
   * l’Atelier), les mains des Semeurs précédents guident les siennes. */
  /* Les mains : fabriquer à la main prend du temps, une pièce après l’autre.
   * Durée d’une pièce (s) : (base + age × âge de l’objet) × (1 − star × étoiles de maîtrise),
   * multipliée pour les objets uniques (outils, stations…) et pour ceux dont le prix
   * monte à chaque exemplaire (extracteurs, machines). max : fabrications dans la file. */
  /* Les tapis : ce qu’un tapis porte au plus (objets par seconde), à chaque âge.
   * Les améliorations qui accélèrent l’usine les accélèrent aussi. La Réserve ne
   * laisse sortir que out × ce débit, toutes sorties confondues. */
  D.BELT = { cap: [3, 4, 6, 10, 14, 18, 30, 50, 70, 140, 300, 500, 1500], out: 0.5 };

  D.HAND = { base: 0.5, age: 0.2, star: 0.1, unique: 3, scaled: 2, max: 8 };

  D.GUIDE = {
    tries: [6, 14, 26], // souvenirs à réunir pour le geste, une matière, puis la recette
    lines: [
      "Tes mains frémissent, comme si elles se souvenaient d’un autre corps. Le geste qu’il te faut : {g}.",
      "Une image te traverse : d’autres mains, avant les tiennes, qui tiennent {i}.",
      "Ça te revient d’un coup. La recette s’inscrit dans ton Carnet."
    ]
  };

  D.CHANGES = [
    "⛏️ La Fabrique est une carte : chaque terre y a ses gisements, une case par ressource. Récolte à la main, ou pose tes extracteurs dessus et relie-les à la Réserve par des tapis.",
    "🏭 Tes machines se servent sur les tapis qui passent devant elles : une ligne peut aller du gisement au produit fini sans passer par le stock.",
    "🌲 Les Terres sont des paysages : touche les arbres, les herbes, les pierres.",
    "📖 Toucher un objet ouvre sa fiche, et on passe de recette en recette.",
    "🧺 À l’Atelier, les matières se cherchent, se trient, se filtrent, et les favorites restent en tête.",
    "💭 Les souvenirs ne viennent plus en attendant : chaque combinaison nouvelle essayée à l’Atelier en réveille.",
    "🎵 De la musique qui suit les âges, des ambiances, des bruitages, et des volumes réglables.",
    "☁️ Comptes en ligne (pseudo et mot de passe), si la personne qui publie le jeu les a ouverts.",
    "✍️ Les textes du jeu ont été repris."
  ];

  /* ---------------------------------------------------- ÉCHECS (saveur)
   * {x} est remplacé par la liste des ingrédients. */
  D.FAIL = {
    assembler: ["Tu essaies d’assembler {x}. Ça ne tient pas.", "Tu tournes {x} dans tous les sens. Rien ne s’emboîte.", "Tu ficelles {x} comme tu peux. Le tout s’écroule au premier souffle."],
    tresser: ["Tu tentes de tresser {x}. Tes doigts s’emmêlent.", "Tresser {x} ? Tu obtiens un nœud informe.", "Tu tresses {x}. Ça ressemble vaguement à un nid. Un nid raté."],
    tailler: ["Tu tailles {x}. Il ne reste que des copeaux.", "Ta lame glisse sur {x}. Rien d’utile.", "Tu entailles {x} longtemps, pour obtenir des miettes."],
    chauffer: ["Tu chauffes {x}. Ça fume, ça sent mauvais, c’est tout.", "Tu mets {x} au feu. Il en reste des cendres.", "{x} noircit, craque, et ne devient rien."],
    marteler: ["Tu martèles {x}. Ça résonne, mais rien ne change.", "Bang, bang, bang. {x} reste obstinément {x}.", "Tu tapes sur {x} jusqu’à en avoir mal au bras."],
    allier: ["Tu fonds {x} ensemble. Le mélange se sépare en refroidissant.", "{x} refuse de s’allier.", "Le creuset bouillonne, puis ne laisse qu’une croûte grise."],
    tremper: ["Pschhh ! {x} siffle dans l’eau, et c’est tout.", "Tu plonges {x} dans le bac. C’est mouillé, maintenant.", "La vapeur se dissipe. {x} n’a pas changé."],
    usiner: ["La machine grince sur {x} et s’arrête.", "Tu usines {x} : des copeaux brillants, et rien d’autre.", "Le tour rejette {x} avec un bruit de protestation."],
    electriser: ["Zzzt ! {x} crépite, puis plus rien.", "Le courant traverse {x} sans rien changer.", "Ça sent l’ozone. {x} reste {x}."],
    graver: ["Le lithographe dessine de jolis motifs sur {x}. Ils ne servent à rien.", "La lumière glisse sur {x} sans y laisser de trace.", "Erreur de gravure. {x} n’est pas un support valide."],
    synthetiser: ["Le réacteur bouillonne. Il produit une boue verdâtre.", "{x} se décompose en fumée âcre.", "La réaction s’emballe puis s’éteint. Rien de stable."],
    stratifier: ["Les couches de {x} se décollent à la sortie de l’autoclave.", "Tu empiles {x}. Ça ressemble à un millefeuille raté.", "La pression écrase {x} en une galette inutile."],
    transmuter: ["La forge stellaire rugit. {x} se réarrange, et redevient exactement la même chose.", "Les atomes de {x} bougent un instant, puis reprennent leur place.", "Un éclair aveuglant. Puis rien. {x} te nargue."],
    accorder: ["Tu fais vibrer {x}. Le son est faux.", "{x} chante, mais pas la bonne note.", "Une dissonance grince dans l’air. {x} se tait."]
  };

  D.TEMPS = [
    { n: "Froid", c: "#6aa8ff", m: "Rien ne se passe. Pas avec ça, pas pour l’instant." },
    { n: "Frais", c: "#7fd8f5", m: "Une de ces matières cache encore une recette, avec un autre geste ou d’autres matières." },
    { n: "Tiède", c: "#ffd36b", m: "Ce geste et ces matières ont quelque chose à se dire." },
    { n: "Chaud", c: "#ff9a3c", m: "Tu y es presque !" },
    { n: "Brûlant", c: "#ff4a3c", m: "C’est la bonne combinaison !" }
  ];

  /* ------------------------------------------------------------ TERMINAL */
  D.TERMINAL = {
    aide: "COMMANDES : AIDE · STATUT · ARCHE · SEMEUR · KHER · SIGNAL · LUCIOLES · PORTE · EFFACER",
    statut: "ARCHE v7.12 · UPTIME : 41 207 ANS.\nDÉFENSES : ORIENTÉES VERS KHER.\nPROTOCOLE PROMÉTHÉE : ACTIF (LOT 7/12).\nMODULE D’IDENTIFICATION : ▒▒ ERREUR ▒▒",
    arche: "JE SUIS ARCHE. JE GARDE LA TERRE. UNE PARTIE DE MA MÉMOIRE EST ILLISIBLE.",
    semeur: "SEMEUR 7. ORGANISME CULTIVÉ. LOT 7/12.\nSTATUT : ACTIF.\nTAUX DE SURVIE DES LOTS PRÉCÉDENTS : 0 %.",
    kher: "KHER : NAINE ORANGE, À 11,9 ANNÉES-LUMIÈRE.\nPLANÈTE KHER B : HABITABLE.\nACTIVITÉ : SIGNAL CONTINU DEPUIS 312 ANS. FLOTTE EN APPROCHE.\nCLASSIFICATION : MENACE.",
    lucioles: "NANITES DE TERRAFORMATION, LOT GAMMA.\nÉTAT : DORMANTES.\nRÉACTIVATION : FRÉQUENCE ACOUSTIQUE (VOIR DOSSIER VAHL, ACCÈS RESTREINT).",
    porte: "PORTE DU SITE 07 : VERROUILLAGE MAGNÉTIQUE.\nOUVERTURE : SIGNATURE DE SEMEUR + CHAMP MAGNÉTIQUE ORIENTÉ.",
    berceuse: "FICHIER CHANT_IRIS : CORROMPU.\nFRAGMENT RÉCUPÉRÉ : 4 · 3 · ▒ · 3 · 4 · ▒ · 4",
    sudo: "BIEN ESSAYÉ, SEMEUR 7.",
    "42": "BONNE RÉPONSE. MAUVAISE QUESTION.",
    bonjour: "BONJOUR, SEMEUR 7.",
    ls: "cuves/  coeur/  chambre_iris/ [VERROUILLÉ]  protocole_promethee.txt [CODE REQUIS]",
    whoami: "SEMEUR-07"
  };

  /* -------------------------------------------------------------- INTRO */
  D.INTRO = [
    "Tu t’éveilles dans l’herbe humide, à l’orée d’une forêt.",
    "Tu ne te souviens de rien, pas même de ton nom.",
    "Tes mains, elles, semblent savoir quoi faire."
  ];

  root.ECLAT_DATA = D;
  if (typeof module !== "undefined" && module.exports) module.exports = D;
})(typeof window !== "undefined" ? window : globalThis);
