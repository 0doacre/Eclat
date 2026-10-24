/* ÉCLAT — du silex aux étoiles
 * Contenu du jeu : âges, gestes, matières, recettes, zones, explorations, lore.
 * Format d’une recette : r: [geste, {ingrédient: quantité}, quantité produite, {heat, lvl}]
 */
(function (root) {
  "use strict";
  const D = {};
  D.VERSION = "0.11.0";

  /* ------------------------------------------------------------------ ÂGES */
  D.AGES = [
    { id: "bois", n: "Âge du Bois", c: "#c58d4e", q: "Tout commence par un bâton." },
    { id: "os", n: "Âge de l’Os", c: "#e6d9b8", q: "Tout ce que laissent les bêtes peut servir." },
    { id: "pierre", n: "Âge de la Pierre", c: "#a7afb8", q: "Le premier tranchant." },
    { id: "cuivre", n: "Âge du Cuivre", c: "#e0814a", q: "La pierre verte cache un métal rouge." },
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
    assembler: { n: "Assembler", ic: "✋", v: "assembler", d: "Réunir plusieurs ressources en un seul objet." },
    tresser: { n: "Tresser", ic: "🧶", v: "tresser", d: "Entrelacer ce qui est souple." },
    tailler: { n: "Tailler", ic: "🔪", v: "tailler", d: "Retirer ce qui est en trop : fendre, découper, affûter." },
    chauffer: { n: "Chauffer", ic: "🔥", v: "chauffer", d: "Cuire, fondre, réduire. La température dépend de ton meilleur feu : feu de camp, four, fourneau…" },
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
  I.bois = { n: "Bois", ic: "🪵", a: 0, t: "res", u: "Sert dans presque toutes les premières recettes.", d: "Dans une forêt, ce n’est pas ça qui manque." };
  I.fibre = { n: "Fibres", ic: "🌿", a: 0, t: "res", u: "Sert à tresser : cordes, paniers, cabanes.", d: "Des herbes longues et des lianes. Tu peux les plier et les nouer." };
  I.caillou = { n: "Pierre", ic: "🪨", a: 0, t: "res", u: "Sert au feu de camp, puis aux constructions lourdes.", d: "Cailloux, galets, blocs. Lourds, mais solides." };
  I.manche = { n: "Manche", sym: "╱", col: "#8a5a32", a: 0, t: "comp", r: ["tailler", { bois: 3 }, 1],
    u: "Sert dans les outils, l’archet à feu et la cabane.", d: "Un bâton bien droit, écorcé. L’ingrédient de base de tout jeu de survie.",
    h: "Prends du bois et retire tout ce qui dépasse." };
  I.corde = { n: "Corde", ic: "🪢", a: 0, t: "comp", r: ["tresser", { fibre: 3 }, 1],
    u: "Sert à lier : archet à feu, cabane, collets.", d: "Trois brins tordus ensemble. Elle tient ton poids.",
    h: "Un brin d’herbe casse tout de suite. Plusieurs, tressés ensemble, tiennent bon." };
  I.panier = { n: "Panier tressé", ic: "🧺", a: 0, t: "tool", r: ["tresser", { fibre: 15, manche: 2 }, 1],
    e: { tap: { lisiere: 2 } }, u: "Double ta récolte à la main dans la Lisière.", d: "Enfin de quoi porter plus que deux mains pleines.",
    h: "Des fibres tressées autour de deux bâtons." };
  I.archet = { n: "Archet à feu", ic: "🏹", a: 0, t: "comp", r: ["assembler", { manche: 1, corde: 2 }, 1],
    u: "Nécessaire pour construire le feu de camp.", d: "Un petit arc dont la corde fait tourner un bâton contre du bois. Tourne assez vite, et le bois finit par fumer.",
    h: "Un bâton et une corde bien tendue : un arc, mais pas pour tirer des flèches." };
  I.feu = { n: "Feu de camp", ic: "🔥", a: 0, t: "stat", r: ["assembler", { archet: 1, bois: 25, caillou: 15 }, 1],
    e: { st: [{ g: "chauffer", heat: 600 }] }, u: "Débloque l’action Chauffer, jusqu’à 600 °C.", d: "Le premier feu que tu allumes toi-même.",
    h: "L’outil qui fait la braise, du bois pour la nourrir, et des pierres tout autour." };
  I.charbon = { n: "Charbon", sym: "⬢", col: "#2b2b2b", a: 0, t: "res", r: ["chauffer", { bois: 4 }, 1, { heat: 600 }],
    u: "Sert dans la torche, le four en argile et la fonte des métaux.", d: "Du bois cuit sans flamme. Il brûle bien plus chaud que le bois.",
    h: "Le bois, chauffé longtemps, devient noir et léger." };
  I.epieu = { n: "Épieu durci", ic: "🗡️", a: 0, t: "tool", r: ["chauffer", { manche: 2 }, 1, { heat: 600 }],
    e: { zone: "plaine" }, u: "Ouvre le chemin vers la Plaine des Hautes Herbes.", d: "Une pointe passée au feu, dure comme de l’os. Avec ça en main, tu oses t’avancer dans la plaine.",
    h: "Un bâton pointu, durci par la flamme." };
  I.cabane = { n: "Cabane de cueillette", sn: "cabane", pl: "cabanes", ic: "🛖", a: 0, t: "ext", z: "lisiere", s: 1.2, ruine: "Cabane effondrée",
    r: ["assembler", { manche: 5, corde: 4, fibre: 15 }, 1], p: { bois: 0.4, fibre: 0.4, caillou: 0.2 },
    u: "Pose-la sur un gisement de la Lisière : elle récolte à ta place.", d: "Un abri de branches où s’entasse ta cueillette. Le soir, des Lucioles tournent autour.",
    h: "Des bâtons, des cordes et un toit d’herbes." };
  I.torche = { n: "Torche", ic: "🕯️", a: 0, t: "comp", r: ["assembler", { manche: 1, fibre: 2, charbon: 1 }, 1],
    u: "Nécessaire pour explorer les lieux sombres, comme la Grotte aux Mains ou le Tumulus.", d: "Une flamme que tu peux emporter là où il fait noir.",
    h: "Un manche, de l’herbe sèche, et ce qui brûle longtemps." };
  I.gants = { n: "Gants de peau", ic: "🧤", a: 4, t: "comp", r: ["assembler", { cuir: 2, fibre: 4 }, 1],
    u: "Aux mains, ils protègent du verre du Désert : sans eux, la récolte à la main rapporte moins là-bas.", d: "Deux peaux cousues à la forme de tes mains.",
    h: "Du cuir, de la fibre, et la forme de tes mains." };
  I.masque = { n: "Masque filtrant", ic: "😷", a: 9, t: "comp", r: ["assembler", { caoutchouc: 2, plastique: 1 }, 1],
    u: "Sur le visage, il retient les vapeurs du Gisement Noir : sans lui, la récolte à la main rapporte moins là-bas.", d: "Une coque de plastique, un joint de caoutchouc.",
    h: "Une coque rigide, et de quoi la serrer sur le visage." };
  I.bouteille = { n: "Bouteille d’air", ic: "💨", a: 9, t: "comp", r: ["assembler", { aluminium: 2, caoutchouc: 1 }, 1],
    u: "Elle te donne de quoi respirer là-haut : sans elle, la récolte à la main rapporte moins aux Pics Fracturés.", d: "Un cylindre d’aluminium, un tuyau de caoutchouc.",
    h: "Un cylindre léger, et un tuyau souple." };
  I.galette = { n: "Herbes grillées", ic: "🌾", a: 0, t: "curio", sec: true, r: ["chauffer", { fibre: 5 }, 1, { heat: 600 }],
    e: { once: { intu: 2 } },
    d: "Ça sent bon. Tu en mâches une bouchée, puis tu t’arrêtes : tu n’as jamais eu faim. Ni soif, d’ailleurs." };

  /* Âge 1 — Os */
  I.os = { n: "Os", ic: "🦴", a: 1, t: "res", u: "Sert dans l’aiguille, la colle d’os, le pic, les collets et le couteau.", d: "Les bêtes de la plaine laissent derrière elles des os solides." };
  I.cuir = { n: "Peau", ic: "🦌", a: 1, t: "res", u: "Sert dans les lanières, la fronde, l’outre et la tunique.", d: "Une peau séchée au soleil. Elle plie sans se déchirer." };
  I.aiguille = { n: "Aiguille en os", ic: "🪡", a: 1, t: "comp", r: ["tailler", { os: 2 }, 2],
    u: "Sert à coudre : outre, tunique.", d: "Un éclat d’os affiné, percé d’un chas.", h: "Ce qui reste des bêtes, affiné jusqu’à la pointe." };
  I.laniere = { n: "Lanières", sym: "≈", col: "#9a6a42", a: 1, t: "comp", r: ["tailler", { cuir: 1 }, 2],
    u: "Sert à lier : fronde, outre, pic en os, haches.", d: "Des bandes de peau qui serrent plus fort en séchant.", h: "La peau des bêtes, en longues bandes souples." };
  I.colle_os = { n: "Colle d’os", sym: "≋", col: "#d8c9a0", a: 1, t: "comp", r: ["chauffer", { os: 3 }, 2, { heat: 600 }],
    u: "Sert dans l’arc de chasse et la lampe de cuivre.", d: "Une pâte poisseuse qui durcit en séchant.", h: "Ce qui reste des bêtes, cuit longtemps jusqu’à devenir poisseux." };
  I.arc = { n: "Arc de chasse", ic: "🎯", a: 1, t: "tool", r: ["assembler", { manche: 3, corde: 4, colle_os: 4 }, 1],
    e: { tap: { plaine: 2 } }, u: "Double ta récolte à la main dans la Plaine.", d: "Plus besoin d’approcher les bêtes.", h: "Un bois souple, une corde tendue, et de la colle d’os pour que rien ne lâche." };
  I.fronde = { n: "Fronde", ic: "🪃", a: 1, t: "tool", r: ["tresser", { laniere: 4, cuir: 4 }, 1],
    e: { tap: { plaine: 2 } }, u: "Double ta récolte à la main dans la Plaine.", d: "Un caillou bien lancé vaut mieux qu’une longue course.",
    h: "Des lanières entrelacées, une poche de peau au milieu." };
  I.outre = { n: "Outre en peau", ic: "👝", a: 1, t: "tool", r: ["assembler", { cuir: 8, laniere: 6, aiguille: 2 }, 1],
    e: { zone: "riviere" }, u: "Ouvre le chemin vers la Rivière.", d: "De l’eau pour la route. La rivière n’est plus si loin.",
    h: "Une peau cousue, qui garde l’eau." };
  I.pic_os = { n: "Pic en os", ic: "⛏️", a: 1, t: "tool", r: ["assembler", { manche: 1, os: 10, laniere: 4 }, 1],
    e: { tap: { caillou: 2 } }, u: "Double ta récolte de pierre à la main.", d: "Une pointe d’os emmanchée. La pierre cède plus vite.",
    h: "Un os pointu au bout d’un manche, tenu serré." };
  I.collets = { n: "Collets", sn: "collet", pl: "collets", ic: "🪤", a: 1, t: "ext", z: "plaine", s: 1.2,
    r: ["assembler", { corde: 6, manche: 4, os: 8 }, 1], p: { os: 0.3, cuir: 0.25 },
    u: "Pose-les sur un gisement de la Plaine : ils récoltent des os et des peaux à ta place.", d: "Des pièges discrets. Quand tu repasses, il y a souvent quelque chose dedans.",
    h: "Des boucles de corde, des piquets, un appât." };
  I.tunique = { n: "Tunique de peau", ic: "🧥", a: 1, t: "tool", r: ["assembler", { cuir: 15, aiguille: 4, fibre: 20 }, 1],
    e: { tap: { "*": 1.5 } }, u: "Augmente ta récolte à la main de 50 %, dans toutes les terres.", d: "Au chaud, tu travailles plus longtemps et plus vite.",
    h: "Des peaux cousues à ta mesure, avec un fil d’herbe." };
  I.flute = { n: "Flûte en os", ic: "🎵", a: 1, t: "curio", sec: true, r: ["tailler", { os: 3, aiguille: 1 }, 1],
    e: { flute: true },
    u: "Se joue depuis le Journal.", d: "Un os creux percé de cinq trous. Le premier son qui en sort, tu l’as déjà entendu quelque part." };
  I.statuette = { n: "Figurine d’os", ic: "🗿", a: 1, t: "curio", sec: true, r: ["tailler", { os: 1, silex: 1 }, 1],
    e: { once: { intu: 3 } },
    d: "Tes mains sculptent toutes seules : une femme aux cheveux courts, la main levée, paume ouverte. Toi, tu ne l’as jamais vue. Tes mains, si." };

  /* Âge 2 — Pierre */
  I.argile = { n: "Argile", ic: "🟫", a: 2, t: "res", u: "Sert aux briques et au four en argile, puis au creuset.", d: "Une terre grasse et collante, qui garde la forme qu’on lui donne." };
  I.silex = { n: "Silex", sym: "◆", col: "#3d4452", a: 2, t: "res", u: "Sert à tailler des éclats de silex.", d: "Une pierre noire, vitreuse, qui casse en arêtes vives." };
  I.sable = { n: "Sable", sym: "∴", col: "#c9b27a", a: 2, t: "res", u: "Sert au verre et aux briques réfractaires.", d: "Des milliards de grains. Il cache bien des choses." };
  I.eclat = { n: "Éclat de silex", sym: "✦", col: "#5b6b8c", a: 2, t: "comp", r: ["tailler", { silex: 2 }, 1],
    u: "Sert dans les rouages de bois, la hache, le couteau et la hutte.", d: "Un coup sec, au bon angle, et la pierre se fend. Le bord coupe mieux que tout ce que tu as eu en main.",
    h: "La pierre noire de la rivière cache un bord qui coupe." };
  I.engrenage_bois = { n: "Rouage de bois", sym: "⚙", col: "#9a6b3c", a: 2, t: "comp", r: ["tailler", { manche: 2, eclat: 1 }, 2],
    u: "Nécessaire pour l’automate de bois.", d: "Une petite roue dentée, taillée dans un bâton.", h: "Un bâton, taillé en roue dentée par une lame de pierre." };
  I.automate_bois = { n: "Automate de bois", sn: "automate de bois", pl: "automates de bois", ic: "🪆", a: 2, t: "mach", s: 1.25, spd: 6, ing: 1, prof: 0, ruine: "Automate rouillé", r: ["assembler", { engrenage_bois: 6, corde: 10, caillou: 40 }, 1],
    u: "Palier 1. Aide tes commandes sur les recettes à une seule ressource, une fois que tu les as fabriquées à la main.", d: "Il grince à chaque mouvement, mais il ne s’arrête jamais.",
    h: "Des rouages en bois, des cordes, et une grosse pierre pour contrepoids." };
  I.hache_pierre = { n: "Hache de pierre", ic: "🪓", a: 2, t: "tool", r: ["assembler", { manche: 2, eclat: 4, laniere: 4 }, 1],
    e: { tap: { bois: 3, fibre: 2 } }, u: "Triple ta récolte de bois à la main et double celle de fibres. Nécessaire pour explorer la Carcasse, à la Rivière.", d: "Les petits arbres tombent en quelques coups.",
    h: "Une lame de pierre, liée solidement à un manche." };
  I.couteau = { n: "Couteau de silex", ic: "🔪", a: 2, t: "tool", r: ["assembler", { eclat: 2, os: 6 }, 1],
    e: { tap: { plaine: 2 } }, u: "Double ta récolte à la main dans la Plaine.", d: "Une lame assez fine pour dépecer proprement.",
    h: "Une lame, et un manche fait de ce qu’elle t’aide à récolter." };
  I.pioche_pierre = { n: "Pioche de pierre", ic: "⛏️", a: 2, t: "tool", r: ["assembler", { manche: 3, caillou: 40, corde: 6 }, 1],
    e: { zone: "collines", tap: { caillou: 2 } }, u: "Ouvre le chemin vers les Collines et double ta récolte de pierre à la main.", d: "Assez lourde pour entamer les collines et leurs veines colorées.",
    h: "Une lourde tête de pierre, des manches, beaucoup de liens." };
  I.brique = { n: "Brique", ic: "🧱", a: 2, t: "comp", r: ["chauffer", { argile: 2 }, 1, { heat: 600 }],
    u: "Sert au four en argile, aux nasses et au bas-fourneau.", d: "De la boue cuite, dure comme de la pierre.", h: "La terre de la rivière, cuite." };
  I.four = { n: "Four en argile", ic: "🏺", a: 2, t: "stat", r: ["assembler", { brique: 30, argile: 20, charbon: 10 }, 1],
    e: { st: [{ g: "chauffer", heat: 1100 }] }, u: "Chauffer monte jusqu’à 1 100 °C : métaux, briques, verre.", d: "Une chambre de briques qui garde la chaleur toute la nuit.",
    h: "Des briques, de l’argile pour les coller, et un combustible plus chaud que le bois." };
  I.nasse = { n: "Nasses et claies", sn: "nasse", pl: "nasses", ic: "🪣", a: 2, t: "ext", z: "riviere", s: 1.2,
    r: ["assembler", { manche: 8, corde: 6, brique: 4 }, 1], p: { argile: 0.3, silex: 0.2, sable: 0.3 },
    u: "Pose-les sur un gisement de la Rivière : elles récoltent argile, silex et sable à ta place.", d: "Des barrages de branches qui retiennent ce que la rivière charrie.",
    h: "Des bâtons et des liens plantés dans le courant, lestés de terre cuite." };
  I.hutte = { n: "Hutte de bûcheron", sn: "hutte", pl: "huttes", ic: "🏚️", a: 2, t: "ext", z: "lisiere", s: 1.2,
    r: ["assembler", { manche: 15, eclat: 6, corde: 10 }, 1], p: { bois: 1.2, fibre: 0.8, caillou: 0.6 },
    u: "Pose-la sur un gisement de la Lisière : elle récolte à ta place, plus vite qu’une cabane.", d: "Un abri solide, des lames de pierre à portée de main.",
    h: "Des bâtons, des lames de pierre, beaucoup de corde." };
  I.cerf_volant = { n: "Cerf-volant", ic: "🪁", a: 2, t: "curio", sec: true, r: ["tresser", { fibre: 6, manche: 2, cuir: 1 }, 1],
    e: { once: { intu: 2 } },
    u: "Débloque une nouvelle exploration à la Lisière.", d: "Le vent l’emporte haut. En le suivant des yeux, tu remarques sous les arbres de la lisière un cercle parfait de pierres levées." };

  /* Âge 3 — Cuivre */
  I.malachite = { n: "Malachite", sym: "❖", col: "#2f8f5b", a: 3, t: "res", u: "Sert à fabriquer les lingots de cuivre.", d: "Une pierre verte et veinée, lourde pour sa taille. Il y a du métal là-dedans." };
  I.cassiterite = { n: "Cassitérite", sym: "▲", col: "#4b4b54", a: 3, t: "res", u: "Sert à fabriquer les lingots d’étain.", d: "Des cristaux sombres et lourds." };
  I.lingot_cuivre = { n: "Lingot de cuivre", sym: "Cu", col: "#c7713b", a: 3, t: "comp",
    r: ["chauffer", { malachite: 3, charbon: 1 }, 1, { heat: 1100 }],
    u: "Sert aux plaques de cuivre, au ciseau et au bronze.", d: "Ton premier métal, rouge et souple.",
    h: "La pierre verte et le noir qui brûle, à une chaleur que le simple feu n’atteint pas." };
  I.enclume_pierre = { n: "Enclume de pierre", ic: "⚒️", a: 3, t: "stat", r: ["tailler", { caillou: 120 }, 1],
    e: { st: [{ g: "marteler", lvl: 1 }] }, u: "Débloque l’action Marteler.", d: "Un bloc plat et dur, pour battre les métaux tendres.",
    h: "Une grosse pierre, aplanie à force de patience." };
  I.plaque_cuivre = { n: "Plaque de cuivre", sym: "▤", col: "#c7713b", a: 3, t: "comp", r: ["marteler", { lingot_cuivre: 1 }, 2],
    u: "Sert au fil de cuivre, au puits de mine et à la lampe.", d: "Du cuivre battu en feuille.", h: "Frappe le métal rouge jusqu’à ce qu’il s’étale." };
  I.fil_cuivre = { n: "Fil de cuivre", sym: "〰", col: "#c7713b", a: 3, t: "comp", r: ["tailler", { plaque_cuivre: 1 }, 3],
    u: "Sert au ressort de bronze, puis à tout ce qui touche à l’électricité.", d: "Fin et souple. Il conduit quelque chose, mais tu ne sais pas encore quoi.",
    h: "Découpe une feuille de métal rouge en bandes très fines." };
  I.lingot_etain = { n: "Lingot d’étain", sym: "Sn", col: "#a6a8ae", a: 3, t: "comp",
    r: ["chauffer", { cassiterite: 3, charbon: 1 }, 1, { heat: 1100 }],
    u: "Sert à fabriquer le bronze, avec le cuivre.", d: "Un métal gris et mou, qui crie quand on le plie.", h: "Les cristaux sombres, réduits par la braise." };
  I.creuset = { n: "Creuset", ic: "⚗️", a: 3, t: "stat", r: ["chauffer", { argile: 20, os: 15 }, 1, { heat: 1100 }],
    e: { st: [{ g: "allier" }] }, u: "Débloque l’action Allier.", d: "Un pot réfractaire où les métaux fondent ensemble.",
    h: "De l’argile mêlée de cendre d’os, cuite à cœur." };
  I.puits = { n: "Puits de mine", sn: "puits", pl: "puits", ic: "🕳️", a: 3, t: "ext", z: "collines", s: 1.2,
    r: ["assembler", { manche: 20, corde: 12, plaque_cuivre: 6 }, 1], p: { malachite: 0.4, cassiterite: 0.2 },
    u: "Pose-le sur un gisement des Collines : il récolte la malachite ou la cassitérite à ta place.", d: "Un trou étayé, une poulie, des seaux cerclés de métal.",
    h: "Des étais de bois, une poulie de corde, des seaux de métal rouge." };
  I.charbonniere = { n: "Meule de charbonnier", sn: "meule", pl: "meules", ic: "🌫️", a: 3, t: "ext", z: "lisiere", s: 1.2,
    r: ["assembler", { bois: 120, argile: 30, manche: 10 }, 1], p: { charbon: 0.3 },
    u: "Pose-la sur le gisement de charbon de la Lisière : elle le récolte à ta place.", d: "Une butte de terre qui fume pendant des jours. Dessous, le bois devient charbon.",
    h: "Du bois empilé, recouvert de terre, qui couve sans flamme." };
  I.ciseau = { n: "Ciseau de cuivre", ic: "🪛", a: 3, t: "tool", r: ["assembler", { lingot_cuivre: 6, manche: 3 }, 1],
    e: { tap: { collines: 2 } }, u: "Double ta récolte à la main dans les Collines.", d: "Un coin de métal pour fendre la roche le long de ses veines.",
    h: "Un coin de métal rouge au bout d’un manche." };
  I.lampe = { n: "Lampe de cuivre", ic: "🪔", a: 3, t: "upg", r: ["assembler", { plaque_cuivre: 6, colle_os: 6, fibre: 20 }, 1],
    e: { exp: 1.25 }, u: "Tes explorations vont 1,25 fois plus vite.", d: "Une coupelle de cuivre, une mèche d’herbe, de la graisse. On explore mieux quand on y voit.",
    h: "Une coupelle de métal rouge, une mèche d’herbe, de quoi brûler longtemps." };
  I.miroir = { n: "Miroir de cuivre", ic: "🪞", a: 3, t: "curio", sec: true, r: ["tailler", { plaque_cuivre: 1, sable: 3 }, 1],
    e: { once: { intu: 3 } },
    d: "Tu polis le métal au sable jusqu’à t’y voir. Pour la première fois, tu découvres ton visage. Dans ton iris gauche, en lettres minuscules, quelqu’un a gravé : « S-{iris} »." };

  /* Âge 4 — Bronze */
  I.lingot_bronze = { n: "Lingot de bronze", sym: "Bz", col: "#c8963e", a: 4, t: "comp",
    r: ["allier", { lingot_cuivre: 3, lingot_etain: 1 }, 4, { heat: 1100 }],
    u: "Sert aux plaques et aux ressorts de bronze, à la pioche et à l’enclume de bronze.", d: "Plus dur que chacun de ses parents.", h: "Trois parts de métal rouge, une part de métal gris, fondues ensemble." };
  I.plaque_bronze = { n: "Plaque de bronze", sym: "▤", col: "#c8963e", a: 4, t: "comp", r: ["marteler", { lingot_bronze: 1 }, 2],
    u: "Sert dans presque tout ce qui est en bronze : engrenages, roues, outils, chariot, automate.", d: "Une feuille dorée qui sonne quand on la frappe.", h: "Bats l’alliage doré en feuille." };
  I.engrenage = { n: "Engrenage de bronze", sym: "⚙", col: "#c8963e", a: 4, t: "comp", r: ["tailler", { plaque_bronze: 1 }, 2],
    u: "Sert à l’automate de bronze, au moulin à eau et aux courroies.", d: "Une roue qui en fait tourner une autre.", h: "Une feuille dorée, découpée en roue dentée." };
  I.ressort = { n: "Ressort de bronze", sym: "⌇", col: "#c8963e", a: 4, t: "comp", r: ["marteler", { lingot_bronze: 1, fil_cuivre: 2 }, 2],
    u: "Sert à fabriquer l’automate de bronze.", d: "Il veut toujours revenir à sa forme.", h: "Le métal doré battu autour d’un fil rouge, jusqu’à ce qu’il veuille revenir." };
  I.automate_bronze = { n: "Automate de bronze", sn: "automate de bronze", pl: "automates de bronze", ic: "🦿", a: 4, t: "mach", s: 1.25, spd: 15, ing: 2, prof: 0, r: ["assembler", { engrenage: 15, ressort: 8, plaque_bronze: 10 }, 1],
    u: "Palier 2. Aide tes commandes sur les recettes à deux ressources au plus, une fois que tu les as fabriquées à la main. 15 fabrications par minute.", d: "Engrenages, ressorts, corps de bronze. Il ne se fatigue jamais.",
    h: "Des roues dentées dorées, des ressorts, un corps de métal doré." };
  I.hache_bronze = { n: "Hache de bronze", ic: "🪓", a: 4, t: "tool", r: ["assembler", { manche: 4, plaque_bronze: 10, laniere: 9 }, 1],
    e: { tap: { lisiere: 2 } }, u: "Double ta récolte à la main dans la Lisière.", d: "Un tranchant qui ne s’émousse presque plus.",
    h: "Une lame de métal doré, liée à un manche." };
  I.pioche_bronze = { n: "Pioche de bronze", ic: "⛏️", a: 4, t: "tool", r: ["assembler", { manche: 6, lingot_bronze: 25, corde: 10 }, 1],
    e: { zone: "mine", tap: { collines: 2 } }, u: "Ouvre le chemin vers les Profondeurs. Double ta récolte à la main dans les Collines.", d: "Le bronze s’enfonce dans la roche là où la pierre rebondissait.",
    h: "Une lourde tête de métal doré, deux manches, des liens." };
  I.enclume_bronze = { n: "Enclume de bronze", ic: "⚒️", a: 4, t: "stat", r: ["assembler", { lingot_bronze: 45, caillou: 220 }, 1],
    e: { st: [{ g: "marteler", lvl: 2 }] }, u: "Marteler passe au niveau 2, nécessaire pour battre le fer.", d: "Assez dure pour battre les métaux durs.",
    h: "Beaucoup de métal doré, posé sur un socle de pierre." };
  I.roue = { n: "Roue cerclée", ic: "🛞", a: 4, t: "comp", r: ["assembler", { manche: 4, plaque_bronze: 1 }, 1],
    u: "Sert au chariot, au moulin à eau, aux brouettes et aux courroies.", d: "Des rayons de bois, un cercle de métal.", h: "Des bâtons en étoile, cerclés de métal doré." };
  I.chariot = { n: "Chariot", ic: "🐂", a: 4, t: "tool", r: ["assembler", { roue: 6, plaque_bronze: 20, corde: 30 }, 1],
    e: { zone: "desert", auto: { "*": 1.25 } }, u: "Ouvre le chemin vers le Désert de Verre. Tous tes extracteurs récoltent 1,25 fois plus.", d: "Tu peux enfin emporter tes outils à travers le désert.",
    h: "Des roues, une caisse, des liens." };
  I.soufflet = { n: "Soufflet", ic: "🪗", a: 4, t: "comp", r: ["assembler", { cuir: 20, manche: 4, plaque_bronze: 3 }, 1],
    u: "Sert au bas-fourneau, puis au haut-fourneau.", d: "Une poche de peau entre deux planches : elle souffle sur la braise.",
    h: "Une poche de peau, deux manches, une buse de métal." };
  I.moulin = { n: "Moulin à eau", ic: "🎡", a: 4, t: "upg", r: ["assembler", { engrenage: 30, roue: 6, manche: 45 }, 1],
    e: { auto: { lisiere: 1.5, riviere: 1.5 } }, u: "Tes extracteurs de la Lisière et de la Rivière récoltent 1,5 fois plus.", d: "La rivière fait tourner la roue, jour et nuit.",
    h: "Des roues, des engrenages, une charpente de bois." };
  I.courroies = { n: "Courroies de cuir", ic: "➰", a: 4, t: "upg", r: ["assembler", { laniere: 40, roue: 6, engrenage: 10 }, 1],
    e: { aspd: 1.25 }, u: "Tes machines fabriquent 1,25 fois plus vite.", d: "Des boucles de cuir tendues d’une roue à l’autre, jusqu’à tes automates.",
    h: "Beaucoup de lanières, des roues, des roues dentées." };
  I.brouette = { n: "Brouettes", ic: "🛒", a: 4, t: "upg", r: ["assembler", { roue: 3, manche: 15, plaque_bronze: 6 }, 1],
    e: { auto: { lisiere: 1.25, riviere: 1.25, collines: 1.25 } }, u: "Tes extracteurs de la Lisière, de la Rivière et des Collines récoltent 1,25 fois plus.", d: "Une caisse posée sur une roue : chaque voyage rapporte plus.",
    h: "Une roue, deux bras de bois, une caisse de métal doré." };
  I.tamis = { n: "Tamis du désert", sn: "tamis", pl: "tamis", ic: "🕸️", a: 4, t: "ext", z: "desert", s: 1.22,
    r: ["assembler", { manche: 30, plaque_bronze: 9, corde: 20 }, 1], p: { quartz: 0.25, sable: 0.5 },
    u: "Pose-le sur un gisement du Désert de Verre : il récolte le quartz ou le sable à ta place.", d: "Un grand cadre qui trie le sable des cristaux.", h: "Un cadre de bois, une grille de métal doré, des cordes." };
  I.anticythere = { n: "Mécanisme d’Anticythère", ic: "🕰️", a: 4, t: "curio", sec: true,
    r: ["assembler", { engrenage: 20, plaque_bronze: 4, tablette: 1 }, 1], e: { intu: 1, sky: true },
    u: "Rapporte 1 ✨ par minute. Ouvre le Ciel, dans le Cosmos.", d: "Des dizaines de roues dentées qui calculent le ciel. Deux aiguilles. L’une suit une étoile marquée d’un nom : Kher. L’autre suit une lueur qui n’est sur aucun cercle." };
  I.cloche = { n: "Cloche", ic: "🔔", a: 4, t: "curio", sec: true, r: ["chauffer", { lingot_bronze: 10, argile: 6 }, 1, { heat: 1100 }],
    u: "Sonne dans le lointain.", d: "Tu la fais tinter du bout de l’ongle. Le son reste longtemps dans l’air, comme s’il cherchait quelqu’un." };

  /* Âge 5 — Fer */
  I.fer_min = { n: "Minerai de fer", sym: "◣", col: "#8e3b2c", a: 5, t: "res", u: "Sert à fabriquer la loupe de fer, d’où l’on tire le fer.", d: "Une roche rouge sang, lourde de métal." };
  I.bas_fourneau = { n: "Bas-fourneau", ic: "🌋", a: 5, t: "stat", r: ["assembler", { brique: 130, soufflet: 3, argile: 95 }, 1],
    e: { st: [{ g: "chauffer", heat: 1300 }] }, u: "Chauffer monte jusqu’à 1 300 °C : fer, verre.", d: "Une cheminée de terre où le soufflet fait rugir la braise.",
    h: "Une haute tour de briques, de l’argile, et de quoi souffler sur le feu." };
  I.loupe = { n: "Loupe de fer", sym: "◍", col: "#6e4f42", a: 5, t: "comp", r: ["chauffer", { fer_min: 3, charbon: 2 }, 1, { heat: 1300 }],
    u: "Sert à fabriquer le lingot de fer.", d: "Une éponge de fer pleine de scories. Il faut encore la battre.", h: "La roche rouge, réduite par beaucoup de braise." };
  I.lingot_fer = { n: "Lingot de fer", sym: "Fe", col: "#8b9099", a: 5, t: "comp", r: ["marteler", { loupe: 1 }, 1, { lvl: 2 }],
    u: "Sert aux plaques de fer, aux clous et aux outils de fer, puis à l’acier.", d: "Du fer forgé, gris et têtu.", h: "Bats la loupe jusqu’à en chasser les scories." };
  I.plaque_fer = { n: "Plaque de fer", sym: "▤", col: "#8b9099", a: 5, t: "comp", r: ["marteler", { lingot_fer: 1 }, 2, { lvl: 2 }],
    u: "Sert à la galerie étayée, puis à presque toutes les machines à vapeur.", d: "Une tôle épaisse.", h: "Bats le fer en feuille." };
  I.clous = { n: "Clous", ic: "🔩", a: 5, t: "comp", r: ["tailler", { lingot_fer: 1 }, 10],
    u: "Sert à la chaîne de fer, aux outils de fer, aux galeries et aux enclos.", d: "Il en faut toujours plus que prévu.", h: "Découpe un lingot gris en mille petites pointes." };
  I.chainon = { n: "Chaîne de fer", sym: "⛓", col: "#8b9099", a: 5, t: "comp", r: ["marteler", { clous: 20 }, 1, { lvl: 2 }],
    u: "Sert à fabriquer le palan à chaîne.", d: "Des maillons de fer, solides et souples à la fois.", h: "Des petites pointes de fer, recourbées et enchaînées les unes aux autres." };
  I.outils_fer = { n: "Outils de fer", ic: "🧰", a: 5, t: "tool", r: ["assembler", { lingot_fer: 25, manche: 15, clous: 65 }, 1],
    e: { tap: { collines: 2, mine: 2, riviere: 2 } }, u: "Double ta récolte à la main dans la Rivière, les Collines et les Profondeurs.", d: "Marteau, hachette, burin, pelle.",
    h: "Du fer, des manches, et de quoi tout fixer." };
  I.galerie = { n: "Galerie étayée", sn: "galerie", pl: "galeries", ic: "🚧", a: 5, t: "ext", z: "mine", s: 1.22,
    r: ["assembler", { manche: 50, clous: 65, plaque_fer: 10 }, 1], p: { fer_min: 0.4, charbon: 0.5 },
    u: "Pose-la sur un gisement des Profondeurs : elle récolte le minerai de fer ou le charbon à ta place.", d: "Des boisages cloués qui s’enfoncent dans la roche.", h: "Des poutres, des clous, des tôles de fer." };
  I.palan = { n: "Palan à chaîne", ic: "⛓️", a: 5, t: "upg", r: ["assembler", { chainon: 10, roue: 4, manche: 20 }, 1],
    e: { auto: { mine: 1.25, collines: 1.25 } }, u: "Tes extracteurs des Collines et des Profondeurs récoltent 1,25 fois plus.", d: "Les charges lourdes remontent toutes seules des galeries.",
    h: "Une chaîne de fer, des poulies, une potence de bois." };
  I.enclos = { n: "Enclos d’élevage", sn: "enclos", pl: "enclos", ic: "🐐", a: 5, t: "ext", z: "plaine", s: 1.22,
    r: ["assembler", { clous: 95, bois: 320, corde: 50 }, 1], p: { os: 1.2, cuir: 1 },
    u: "Pose-le sur un gisement de la Plaine : il récolte les os ou les peaux à ta place.", d: "Plus besoin de chasser.", h: "Une palissade de bois clouée, des cordes pour les bêtes." };
  I.verre = { n: "Verre", sym: "◇", col: "#7fc9da", a: 5, t: "comp", r: ["chauffer", { sable: 4 }, 1, { heat: 1300 }],
    u: "Sert aux lentilles, puis au verre trempé et aux ampoules.", d: "Du sable, et tu vois au travers.", h: "Le sable, fondu par une chaleur rugissante." };
  I.lentille = { n: "Lentille", ic: "🔍", a: 5, t: "comp", r: ["tailler", { verre: 1 }, 1],
    u: "Sert à la lunette astronomique, et bien plus tard au lithographe.", d: "Elle rapproche ce qui est loin.", h: "Polis la matière transparente en une goutte parfaite." };
  I.lunette = { n: "Lunette astronomique", ic: "🔭", a: 5, t: "tool", r: ["assembler", { lentille: 3, plaque_bronze: 15 }, 1],
    e: { sky: true }, u: "Ouvre le Cosmos, la deuxième page du Journal.", d: "Pour regarder le ciel.",
    h: "Deux gouttes transparentes dans un tube de métal doré." };
  I.boussole = { n: "Boussole", ic: "🧭", a: 5, t: "curio", sec: true, r: ["assembler", { aiguille: 1, lingot_fer: 1, argile: 2 }, 1],
    e: { once: { intu: 2 } },
    u: "Débloque une nouvelle exploration dans les Profondeurs.", d: "L’aiguille ferrée flotte sur l’argile humide. Elle ne cherche pas le nord : elle penche vers le sol, vers les Profondeurs." };
  I.pigment = { n: "Pigment", ic: "🎨", a: 5, t: "curio", sec: true, r: ["tailler", { argile: 3, charbon: 2 }, 1],
    u: "Débloque un geste à la Grotte aux Mains.", d: "De la terre de rivière et du noir de feu, écrasés ensemble. Tes doigts en restent marqués." };

  /* Âge 6 — Acier */
  I.brique_refr = { n: "Brique réfractaire", sym: "▦", col: "#b5532f", a: 5, t: "comp", r: ["chauffer", { argile: 2, sable: 2 }, 1, { heat: 1100 }],
    u: "Sert au haut-fourneau et au four à arc.", d: "Elle ne craint plus aucune chaleur.", h: "De l’argile mêlée de sable, cuite au four." };
  I.haut_fourneau = { n: "Haut-fourneau", ic: "🏭", a: 6, t: "stat", r: ["assembler", { brique_refr: 220, plaque_fer: 70, soufflet: 7 }, 1],
    e: { st: [{ g: "chauffer", heat: 1700 }] }, u: "Chauffer monte jusqu’à 1 700 °C : assez pour l’acier.", d: "Une tour de feu cerclée de fer.",
    h: "Des briques qui ne craignent rien, des tôles, et plusieurs souffles." };
  I.lingot_acier = { n: "Lingot d’acier", sym: "Ac", col: "#9fb0c4", a: 6, t: "comp",
    r: ["allier", { lingot_fer: 2, charbon: 1 }, 2, { heat: 1700 }],
    u: "Sert dans l’acier trempé, les pistons, le moteur électrique et beaucoup de constructions : tour d’usinage, treuil, derrick…", d: "Du fer avec une pointe de carbone.", h: "Le métal gris et le noir qui brûle, fondus ensemble à très haute température." };
  I.bac_trempe = { n: "Bac de trempe", ic: "🛁", a: 6, t: "stat", r: ["assembler", { bois: 540, plaque_fer: 35, clous: 140 }, 1],
    e: { st: [{ g: "tremper" }] }, u: "Débloque l’action Tremper.", d: "Un grand bac d’eau froide. Le métal brûlant y durcit d’un coup.",
    h: "Un tonneau de bois cerclé de fer." };
  I.acier_trempe = { n: "Acier trempé", sym: "Ac", col: "#5e86b8", a: 6, t: "comp", r: ["tremper", { lingot_acier: 1 }, 1],
    u: "Sert dans les engrenages d’acier, les roulements, les aimants, les outils d’acier, et dans beaucoup de constructions plus tard.", d: "Dur, et pourtant il plie sans casser.", h: "Plonge l’acier brûlant dans l’eau froide." };
  I.lame = { n: "Lame trempée", sym: "⟋", col: "#5e86b8", a: 6, t: "comp", r: ["tremper", { plaque_fer: 2 }, 1],
    u: "Sert dans la scierie à vapeur et les outils d’acier.", d: "Son fil entame le bois d’un seul passage.", h: "Plonge des tôles grises brûlantes dans l’eau." };
  I.verre_trempe = { n: "Verre trempé", sym: "◈", col: "#5ab8cf", a: 6, t: "comp", r: ["tremper", { verre: 2 }, 1],
    u: "Sert dans les cellules photovoltaïques, l’ordinateur et le réacteur chimique.", d: "Un verre qui ne se brise plus.", h: "Même la matière transparente durcit au contact du froid." };
  I.tour = { n: "Tour d’usinage", ic: "🗜️", a: 6, t: "stat", r: ["assembler", { lingot_acier: 55, engrenage: 70, manche: 35 }, 1],
    e: { st: [{ g: "usiner" }] }, u: "Débloque l’action Usiner.", d: "Elle façonne le métal au dixième de millimètre.",
    h: "De l’acier, beaucoup d’engrenages dorés, et des leviers." };
  I.piston = { n: "Piston", sym: "▮", col: "#9fb0c4", a: 6, t: "comp", r: ["usiner", { lingot_acier: 2 }, 1],
    u: "Sert dans le moteur à vapeur.", d: "Il pousse, il tire, il recommence.", h: "Un cylindre d’acier parfaitement ajusté." };
  I.engrenage_acier = { n: "Engrenage d’acier", sym: "⚙", col: "#5e86b8", a: 6, t: "comp", r: ["usiner", { acier_trempe: 1 }, 2],
    u: "Sert dans le moteur à vapeur et la sonde pétrolière.", d: "Des dents qui ne cassent jamais.", h: "De l’acier durci, usiné en roue dentée." };
  I.vis = { n: "Vis", sym: "⫶", col: "#9fb0c4", a: 6, t: "comp", r: ["usiner", { lingot_fer: 1 }, 8],
    u: "Sert dans les roulements à billes.", d: "Une hélice gravée dans le fer.", h: "Le tour grave une hélice dans le fer gris." };
  I.roulement = { n: "Roulement à billes", sym: "◉", col: "#9fb0c4", a: 6, t: "comp", r: ["usiner", { acier_trempe: 1, vis: 4 }, 2],
    u: "Sert dans la presse à vapeur.", d: "Il fait tourner les machines sans effort.", h: "Des billes d’acier durci, dans une cage tenue par des vis." };
  I.chaudiere = { n: "Chaudière", ic: "♨️", a: 6, t: "comp", r: ["marteler", { plaque_fer: 8, clous: 30 }, 1, { lvl: 2 }],
    u: "Sert dans le moteur à vapeur.", d: "Un ventre de fer. L’eau y bout sous pression.", h: "Des tôles battues et rivetées en un ventre étanche." };
  I.moteur_vapeur = { n: "Moteur à vapeur", ic: "🚂", a: 6, t: "comp", r: ["assembler", { chaudiere: 1, piston: 2, engrenage_acier: 4 }, 1],
    u: "Sert dans tout ce qui marche à la vapeur : presse, pompe, scierie, drague, treuil, chemin de fer. Et dans la dynamo.", d: "La première machine qui travaille sans toi.", h: "Un ventre de fer bouillant, des cylindres qui poussent, des roues dentées." };
  I.presse_vapeur = { n: "Presse à vapeur", sn: "presse", pl: "presses", ic: "📠", a: 6, t: "mach", s: 1.25, spd: 40, ing: 3, prof: 0, r: ["assembler", { moteur_vapeur: 1, roulement: 8, plaque_fer: 20 }, 1],
    u: "Palier 3, 40 fabrications par minute. Aide tes commandes sur les recettes à trois ressources au plus, une fois que tu les as fabriquées à la main.", d: "Elle siffle et cogne toute la journée.",
    h: "Un moteur à vapeur, des roulements, un bâti de tôle." };
  I.pompe = { n: "Pompe d’exhaure", ic: "⛽", a: 6, t: "upg", r: ["assembler", { moteur_vapeur: 4, plaque_fer: 55 }, 1],
    e: { auto: { mine: 1.5, collines: 1.5 } }, u: "Augmente de 50 % la récolte de tes extracteurs dans les Profondeurs et les Collines.", d: "Les galeries inondées se vident. Tu peux creuser plus profond.",
    h: "Un moteur qui avale l’eau des galeries, et des tôles pour la canaliser." };
  I.scierie = { n: "Scierie à vapeur", sn: "scierie", pl: "scieries", ic: "🪚", a: 6, t: "ext", z: "lisiere", s: 1.25,
    r: ["assembler", { moteur_vapeur: 2, lame: 7, bois: 360 }, 1], p: { bois: 3, fibre: 2, caillou: 2 },
    u: "Pose-la sur un gisement de la Lisière : elle récolte bois, fibres ou pierre à ta place.", d: "La forêt recule en hurlant.", h: "Un moteur, des lames, une charpente." };
  I.drague = { n: "Drague à vapeur", sn: "drague", pl: "dragues", ic: "⛴️", a: 6, t: "ext", z: "riviere", s: 1.25,
    r: ["assembler", { moteur_vapeur: 2, plaque_fer: 20, clous: 110 }, 1], p: { argile: 1.2, silex: 0.8, sable: 1.2 },
    u: "Pose-la sur un gisement de la Rivière : elle récolte argile, silex ou sable à ta place.", d: "Elle racle le lit de la rivière.", h: "Un moteur sur une coque de tôles rivetées." };
  I.treuil = { n: "Treuil à vapeur", sn: "treuil", pl: "treuils", ic: "🪝", a: 6, t: "ext", z: "collines", s: 1.25,
    r: ["assembler", { moteur_vapeur: 2, corde: 70, lingot_acier: 20 }, 1], p: { malachite: 1.2, cassiterite: 0.6 },
    u: "Pose-le sur un gisement des Collines : il récolte malachite ou cassitérite à ta place.", d: "Les wagonnets remontent tout seuls.", h: "Un moteur, beaucoup de corde, une poulie d’acier." };
  I.locomotive = { n: "Chemin de fer", ic: "🛤️", a: 6, t: "upg", r: ["assembler", { moteur_vapeur: 7, roue: 35, plaque_fer: 110 }, 1],
    e: { auto: { "*": 1.5 } }, u: "Augmente de 50 % la récolte de tous tes extracteurs, dans toutes les terres.", d: "Des rails relient tous tes chantiers.",
    h: "Des moteurs, beaucoup de roues, des rails de tôle." };
  I.outils_acier = { n: "Outils d’acier", ic: "🛠️", a: 6, t: "tool", r: ["assembler", { acier_trempe: 35, manche: 20, lame: 10 }, 1],
    e: { tap: { lisiere: 2, plaine: 2, mine: 2, desert: 2 } }, u: "Double ta récolte à la main dans la Lisière, la Plaine, les Profondeurs et le Désert.", d: "Des outils qui ne s’usent plus.", h: "De l’acier durci, des manches, des lames." };

  /* Âge 7 — Électricité */
  I.bobine = { n: "Bobine de cuivre", sym: "◎", col: "#c7713b", a: 7, t: "comp", r: ["usiner", { fil_cuivre: 6 }, 1],
    u: "Sert dans les aimants, la dynamo, le moteur électrique, le poste radio et le radiotélescope.", d: "Des kilomètres de fil, enroulés spire contre spire.", h: "Du fil rouge, enroulé par une machine." };
  I.aimant = { n: "Aimant", ic: "🧲", a: 7, t: "comp", r: ["assembler", { acier_trempe: 2, bobine: 1 }, 1],
    u: "Sert dans la dynamo, le télégraphe et le moteur électrique.", d: "Il attire le fer. Tu passes un moment à jouer avec des clous.", h: "De l’acier durci au cœur d’une bobine." };
  I.dynamo = { n: "Dynamo", ic: "🔌", a: 7, t: "stat", r: ["assembler", { aimant: 10, bobine: 20, moteur_vapeur: 4 }, 1],
    e: { st: [{ g: "electriser", lvl: 1 }] }, u: "Débloque l’action Électriser.", d: "La vapeur fait tourner des aimants dans des bobines, et le courant passe.",
    h: "Des aimants, des bobines, et un moteur pour les faire tourner." };
  I.cuivre_pur = { n: "Cuivre pur", sym: "Cu", col: "#ff9a5c", a: 7, t: "comp", r: ["electriser", { lingot_cuivre: 2 }, 2],
    u: "Sert dans le four à arc, le réseau électrique et les puces.", d: "Raffiné par le courant, pur à 99,99 %.", h: "Le courant purifie le métal rouge." };
  I.batterie = { n: "Batterie", ic: "🔋", a: 7, t: "comp", r: ["electriser", { plaque_cuivre: 2, lingot_etain: 1 }, 1],
    u: "Sert dans le télégraphe, l’éclairage électrique, le poste radio, le four à arc et l’ordinateur.", d: "De l’électricité en boîte.", h: "Deux métaux différents et du courant pour les charger." };
  I.ampoule = { n: "Ampoule", ic: "💡", a: 7, t: "comp", r: ["assembler", { verre: 1, fil_cuivre: 2 }, 1],
    u: "Sert dans l’éclairage électrique et le poste radio.", d: "Le premier soir, tu restes longtemps à la regarder briller.", h: "Un fil rouge enfermé dans du verre." };
  I.cable = { n: "Câble électrique", sym: "⌁", col: "#c7713b", a: 7, t: "comp", r: ["tresser", { fil_cuivre: 4 }, 1],
    u: "Sert dans le télégraphe et les capteurs de forage.", d: "Tu tresses comme au premier jour, mais avec du métal.", h: "Le plus vieux geste, avec le fil rouge." };
  I.telegraphe = { n: "Télégraphe", ic: "📟", a: 7, t: "upg", r: ["assembler", { cable: 20, batterie: 6, aimant: 4 }, 1],
    e: { intu: 1 }, u: "Te rapporte 1 Intuition ✨ par minute.", d: "Tu tapes des messages dans le vide. Parfois, tu jurerais qu’on te répond.",
    h: "Des câbles, de l’énergie en boîte, un aimant qui claque." };
  I.eclairage = { n: "Éclairage électrique", ic: "🏮", a: 7, t: "upg", r: ["assembler", { ampoule: 100, fil_cuivre: 300, batterie: 30 }, 1],
    e: { auto: { mine: 1.5 }, exp: 1.5 }, u: "Augmente de 50 % la récolte de tes extracteurs dans les Profondeurs. Tes explorations vont 1,5 fois plus vite.", d: "Les galeries s’illuminent d’un bout à l’autre.",
    h: "Beaucoup d’ampoules, beaucoup de fil, de quoi les alimenter." };
  I.radio = { n: "Poste radio", ic: "📻", a: 7, t: "tool", r: ["assembler", { bobine: 20, ampoule: 10, batterie: 10 }, 1],
    e: { arche: true }, u: "Capte les ondes radio.", d: "Surtout du bruit. Parfois autre chose.",
    h: "Des bobines, des ampoules, une batterie, et une antenne de fortune." };
  I.moteur_elec = { n: "Moteur électrique", ic: "🌀", a: 7, t: "comp", r: ["assembler", { bobine: 2, aimant: 2, lingot_acier: 2 }, 1],
    u: "Sert dans le réseau électrique, la pelleteuse, la foreuse électrique et presque toutes les constructions qui suivent.", d: "Presque silencieux.", h: "Des bobines, des aimants, une carcasse d’acier." };
  I.four_arc = { n: "Four à arc", ic: "⚡", a: 7, t: "stat", r: ["assembler", { brique_refr: 400, cuivre_pur: 120, batterie: 60 }, 1],
    e: { st: [{ g: "chauffer", heat: 3500 }] }, u: "Chauffer monte jusqu’à 3 500 °C : assez pour le silicium.", d: "Un éclair permanent enfermé dans des briques.",
    h: "Des briques qui ne craignent rien, du métal rouge très pur, et beaucoup d’énergie stockée." };
  I.reseau = { n: "Réseau électrique", ic: "🗼", a: 7, t: "upg", r: ["assembler", { moteur_elec: 20, fil_cuivre: 600, cuivre_pur: 100 }, 1],
    e: { auto: { "*": 1.5 } }, u: "Augmente de 50 % la récolte de tous tes extracteurs, dans toutes les terres.", d: "Des pylônes relient tous tes chantiers.", h: "Des moteurs, des kilomètres de fil, du métal rouge très pur." };
  I.excavatrice = { n: "Pelleteuse électrique", sn: "pelleteuse", pl: "pelleteuses", ic: "🚜", a: 7, t: "ext", z: "desert", s: 1.25,
    r: ["assembler", { moteur_elec: 4, plaque_fer: 40, roue: 10 }, 1], p: { quartz: 1, sable: 2 },
    u: "Pose-la sur un gisement du Désert : elle récolte quartz ou sable à ta place.", d: "Elle avale les dunes.", h: "Des moteurs silencieux sur des roues, une benne de tôle." };
  I.foreuse_elec = { n: "Foreuse électrique", sn: "foreuse", pl: "foreuses", ic: "🔧", a: 7, t: "ext", z: "mine", s: 1.25,
    r: ["assembler", { moteur_elec: 4, acier_trempe: 15, plaque_fer: 30 }, 1], p: { fer_min: 1.5, charbon: 1.5 },
    u: "Pose-la sur un gisement des Profondeurs : elle récolte minerai de fer ou charbon à ta place.", d: "Elle perce la roche en chantant.", h: "Un moteur silencieux, une mèche d’acier durci, un bâti de tôle." };

  /* Âge 8 — Silicium */
  I.quartz = { b: 0.5, n: "Quartz", sym: "◇", col: "#d9d4f0", a: 4, t: "res", u: "Sert, bien plus tard, à fabriquer le silicium.", d: "Des cristaux limpides, tirés du sable." };
  I.silicium = { n: "Silicium", sym: "Si", col: "#62758a", a: 8, t: "comp", r: ["chauffer", { quartz: 3, charbon: 2 }, 1, { heat: 3500 }],
    u: "Sert à fabriquer les plaquettes de silicium.", d: "Un métal qui n’en est pas tout à fait un.", h: "Le cristal du désert, réduit par la braise dans un éclair permanent." };
  I.wafer = { n: "Plaquette de silicium", ic: "💿", a: 8, t: "comp", r: ["tailler", { silicium: 1 }, 4],
    u: "Sert dans les puces et les cellules photovoltaïques.", d: "Un disque miroir, parfaitement plat.", h: "Découpe le métal gris-bleu en tranches fines comme du papier." };
  I.lithographe = { n: "Lithographe", ic: "🔬", a: 8, t: "stat", r: ["assembler", { lentille: 90, moteur_elec: 15, acier_trempe: 90 }, 1],
    e: { st: [{ g: "graver" }] }, u: "Débloque l’action Graver.", d: "Il dessine avec la lumière des traits plus fins qu’un cheveu.",
    h: "Beaucoup de lentilles, des moteurs précis, un bâti indéformable." };
  I.puce = { n: "Puce", sym: "▣", col: "#3f9a68", a: 8, t: "comp", r: ["graver", { wafer: 1, cuivre_pur: 1 }, 2],
    u: "Sert dans les processeurs et les circuits imprimés.", d: "Des millions de minuscules interrupteurs.", h: "Grave une plaquette miroir, avec des pistes de métal rouge très pur." };
  I.processeur = { n: "Processeur", sym: "µP", col: "#2f7d55", a: 8, t: "comp", r: ["graver", { puce: 4 }, 1],
    u: "Sert dans l’ordinateur, les robots ouvriers, la ligne d’assemblage, le radiotélescope, et presque tout ce qui suit.", d: "Un caillou qui pense.", h: "Grave plusieurs puces ensemble en un seul cerveau." };
  I.cellule = { n: "Cellule photovoltaïque", sym: "▥", col: "#3550a0", a: 8, t: "comp", r: ["graver", { wafer: 1, verre_trempe: 1 }, 1],
    u: "Sert dans le filet orbital et le panneau de Dyson.", d: "Tu la tournes vers le soleil, et elle donne du courant.", h: "Une plaquette miroir gravée sous un verre incassable." };
  I.circuit = { n: "Circuit imprimé", sym: "⌗", col: "#2f6b3f", a: 8, t: "comp", r: ["graver", { plaque_cuivre: 1, puce: 1 }, 2],
    u: "Sert dans les capteurs de forage et l’assembleur moléculaire.", d: "Une plaque de cuivre parcourue de pistes minuscules.", h: "Grave une feuille de métal rouge autour d’une puce." };
  I.capteurs = { n: "Capteurs de forage", ic: "📶", a: 8, t: "upg", r: ["assembler", { circuit: 12, moteur_elec: 6, cable: 30 }, 1],
    e: { auto: { mine: 1.5, desert: 1.5 } }, u: "Augmente de 50 % la récolte de tes extracteurs dans les Profondeurs et le Désert.", d: "Tes engins sentent où creuser.",
    h: "Des circuits, des moteurs, beaucoup de câble." };
  I.ordinateur = { n: "Ordinateur", ic: "🖥️", a: 8, t: "upg", r: ["assembler", { processeur: 15, batterie: 45, verre_trempe: 30 }, 1],
    e: { term: true, intu: 1, auto: { "*": 1.25 } }, u: "Ouvre le Terminal. Te rapporte 1 Intuition ✨ par minute et augmente de 25 % la récolte de tous tes extracteurs.", d: "Il calcule. Et il te parle.",
    h: "Des cerveaux de silicium, de l’énergie, un écran incassable." };
  I.robots = { n: "Robots ouvriers", ic: "🤖", a: 8, t: "upg", r: ["assembler", { processeur: 45, moteur_elec: 75, acier_trempe: 180 }, 1],
    e: { auto: { "*": 1.5 } }, u: "Augmente de 50 % la récolte de tous tes extracteurs, dans toutes les terres.", d: "Ils ne dorment jamais.", h: "Des cerveaux, des muscles électriques, un squelette d’acier." };
  I.chaine = { n: "Ligne d’assemblage", sn: "ligne d’assemblage", pl: "lignes d’assemblage", ic: "🏗️", a: 8, t: "mach", s: 1.3, spd: 120, ing: 3, prof: 1,
    r: ["assembler", { processeur: 10, moteur_elec: 20, lingot_acier: 150 }, 1],
    u: "Palier 3, 120 fabrications par minute. Aide tes commandes sur les recettes à trois ressources au plus, une fois que tu les as fabriquées à la main.", d: "Un tapis roulant et des bras articulés, pilotés par un cerveau de silicium.",
    h: "Des cerveaux, des moteurs, des tapis d’acier." };
  I.foreuse = { n: "Sonde pétrolière", ic: "🌪️", a: 8, t: "tool", r: ["assembler", { moteur_elec: 15, acier_trempe: 75, engrenage_acier: 90 }, 1],
    e: { zone: "gisement" }, u: "Ouvre le chemin vers le Gisement Noir.", d: "Une longue tige d’acier qui perce jusqu’à l’huile noire. Elle descend bien plus bas que la foreuse des Profondeurs.", h: "Des moteurs, une mèche d’acier durci, des engrenages d’acier." };
  I.derrick = { n: "Derrick", sn: "derrick", pl: "derricks", ic: "🛢️", a: 8, t: "ext", z: "gisement", s: 1.25,
    r: ["assembler", { moteur_elec: 6, lingot_acier: 60, clous: 240 }, 1], p: { petrole: 1 },
    u: "Pose-le sur un gisement de pétrole, dans le Gisement Noir : il le récolte à ta place.", d: "Il hoche la tête et l’huile monte.", h: "Un moteur, une tour d’acier clouée." };
  I.radiotelescope = { n: "Radiotélescope", ic: "📡", a: 8, t: "tool", r: ["assembler", { processeur: 15, plaque_fer: 450, bobine: 90 }, 1],
    e: { signal: true, sky: true }, u: "Ouvre le Cosmos. De là, tu peux écouter Kher.", d: "Une oreille géante tournée vers les étoiles.",
    h: "Une immense coupole de tôle, des bobines, un cerveau pour trier le bruit." };
  I.pip = { n: "Pip", ic: "🐞", a: 8, t: "curio", sec: true, r: ["assembler", { processeur: 1, moteur_elec: 1, laniere: 2 }, 1],
    e: { pip: 2 }, u: "Récolte à ta place, 2 fois par seconde, sur tes terres ouvertes.", d: "Un petit robot au bout d’une laisse de cuir. Il bipe quand il est content." };
  I.capsule = { n: "Capsule temporelle", ic: "⏳", a: 8, t: "curio", sec: true, r: ["assembler", { processeur: 1, verre_trempe: 2, plaque_fer: 2 }, 1],
    e: { capsule: true, once: { intu: 2 } }, u: "Agit à ta prochaine Relève.", d: "Tu y enregistres un message pour celui ou celle qui viendra après toi." };

  /* Âge 9 — Polymères */
  I.petrole = { b: 0.5, n: "Pétrole", sym: "●", col: "#17120e", a: 9, t: "res", u: "Sert à synthétiser : plastique, résine époxy, caoutchouc, dynamite.", d: "Des forêts mortes il y a cent millions d’années." };
  I.bauxite = { b: 0.5, n: "Bauxite", sym: "◒", col: "#b8612f", a: 9, t: "res", u: "Sert à fabriquer l’aluminium.", d: "Une terre rouge qui cache un métal léger." };
  I.ilmenite = { b: 0.5, n: "Ilménite", sym: "◓", col: "#4a4a5c", a: 9, t: "res", u: "Sert à fabriquer le titane.", d: "Un sable noir et lourd." };
  I.terres_rares = { b: 0.2, n: "Terres rares", sym: "✳", col: "#8a6bbe", a: 9, t: "res", u: "Sert dans les aimants néodyme et les supraconducteurs.", d: "Pas si rares, mais si dispersées." };
  I.reacteur = { n: "Réacteur chimique", ic: "🧪", a: 9, t: "stat", r: ["assembler", { acier_trempe: 240, verre_trempe: 120, processeur: 40 }, 1],
    e: { st: [{ g: "synthetiser" }] }, u: "Débloque l’action Synthétiser.", d: "Des cuves, et des tuyaux partout.",
    h: "Des cuves d’acier durci, des hublots incassables, un cerveau pour tout piloter." };
  I.plastique = { n: "Plastique", ic: "🧴", a: 9, t: "comp", r: ["synthetiser", { petrole: 3 }, 2],
    u: "Sert dans l’outillage électrique, la fibre de carbone et le graphène. Il en faut aussi pour le passage vers les Pics Fracturés.", d: "Tu peux lui donner toutes les formes et toutes les couleurs.", h: "Recompose l’huile noire." };
  I.resine = { n: "Résine époxy", ic: "🍯", a: 9, t: "comp", r: ["synthetiser", { petrole: 2, bois: 6 }, 1],
    u: "Sert à fabriquer le composite carbone.", d: "Une colle qui durcit comme de la pierre.", h: "L’huile noire et la sève du bois, recomposées ensemble." };
  I.dynamite = { n: "Dynamite", ic: "🧨", a: 9, t: "comp", r: ["synthetiser", { petrole: 2, argile: 3 }, 3],
    e: { zone: "montagnes" }, u: "Ouvre le chemin vers les Pics Fracturés. Sert aussi dans la carrière et l’excavateur géant.", d: "Tu allumes la mèche, et tu cours.",
    h: "Une huile explosive absorbée dans de la terre de rivière." };
  I.caoutchouc = { n: "Caoutchouc", sym: "◖", col: "#3b3b3b", a: 9, t: "comp", r: ["synthetiser", { petrole: 2, charbon: 1 }, 2],
    u: "Sert dans les tapis convoyeurs.", d: "Il rebondit, et il isole.", h: "L’huile noire et le noir qui brûle, recomposés en une matière qui rebondit." };
  I.convoyeurs = { n: "Tapis convoyeurs", ic: "📦", a: 9, t: "upg", r: ["assembler", { caoutchouc: 80, moteur_elec: 12, lingot_acier: 80 }, 1],
    e: { aspd: 1.5 }, u: "Tes machines fabriquent 50 % plus vite.", d: "Des bras chargent les pièces tout seuls, et les courroies défilent plus vite.",
    h: "Des bandes de caoutchouc, des moteurs, une structure d’acier." };
  I.aluminium = { n: "Aluminium", sym: "Al", col: "#c4cad3", a: 9, t: "comp", r: ["electriser", { bauxite: 4, charbon: 1 }, 1],
    u: "Sert dans le titane et la céramique technique. Il en faut aussi pour le passage vers l’Orbite Basse.", d: "Autrefois plus précieux que l’or.", h: "La terre rouge des montagnes, électrisée sur des électrodes de carbone." };
  I.titane = { n: "Titane", sym: "Ti", col: "#8f93a8", a: 9, t: "comp", r: ["chauffer", { ilmenite: 4, aluminium: 1 }, 1, { heat: 3500 }],
    u: "Sert dans beaucoup de recettes de l’espace : moteur-fusée, propulseur à fusion, autoclave, outillage électrique, excavateur géant. Il en faut aussi pour les passages vers l’Orbite Basse et la Lune.", d: "Léger, et il ne rouille pas.", h: "Le sable noir des montagnes, réduit par le métal léger dans un éclair permanent." };
  I.aimant_neo = { n: "Aimant néodyme", sym: "Nd", col: "#7461b3", a: 9, t: "comp", r: ["allier", { terres_rares: 2, lingot_fer: 2 }, 1, { heat: 1700 }],
    u: "Sert à construire la centrale électrique.", d: "Petit et terriblement puissant.", h: "Les terres dispersées, alliées au fer." };
  I.centrale = { n: "Centrale électrique", ic: "🌩️", a: 9, t: "stat", r: ["assembler", { aimant_neo: 120, moteur_elec: 80, cuivre_pur: 600 }, 1],
    e: { st: [{ g: "electriser", lvl: 2 }], auto: { "*": 1.5 } }, u: "Tes extracteurs récoltent 50 % plus vite, dans toutes les terres.", d: "Des turbines géantes tournent jour et nuit.",
    h: "Des aimants terriblement puissants, des moteurs, des tonnes de métal rouge très pur." };
  I.outillage = { n: "Outillage électrique", ic: "🔧", a: 9, t: "tool", r: ["assembler", { titane: 60, plastique: 120, moteur_elec: 15 }, 1],
    e: { tap: { montagnes: 3, gisement: 3, desert: 2 } }, u: "Triple ta récolte à la main dans les Pics Fracturés et le Gisement Noir, et la double dans le Désert de Verre.", d: "Perceuse, tronçonneuse, marteau-piqueur.", h: "Du titane, des poignées de plastique, un moteur." };
  I.carriere = { n: "Carrière à ciel ouvert", sn: "carrière", pl: "carrières", ic: "🏔️", a: 9, t: "ext", z: "montagnes", s: 1.25,
    r: ["assembler", { dynamite: 80, moteur_elec: 10, acier_trempe: 60 }, 1], p: { bauxite: 1, ilmenite: 0.8, terres_rares: 0.3 },
    u: "Pose-la sur un gisement des Pics Fracturés : elle récolte la bauxite, l’ilménite ou les terres rares à ta place.", d: "Tu ne creuses plus : tu fais sauter.", h: "Des explosifs, des moteurs, des godets d’acier." };
  I.feu_artifice = { n: "Feu d’artifice", ic: "🎆", a: 9, t: "curio", sec: true, r: ["chauffer", { dynamite: 1, plaque_cuivre: 1 }, 1, { heat: 600 }],
    e: { once: { intu: 3 }, fireworks: true },
    d: "Le cuivre brûle vert et bleu. Des Lucioles tournent autour des étincelles. Tu ris, pour la première fois depuis ton éveil." };

  /* Âge 10 — Composites */
  I.fibre_carbone = { n: "Fibre de carbone", sym: "〰", col: "#262626", a: 10, t: "comp", r: ["chauffer", { plastique: 4 }, 2, { heat: 3500 }],
    u: "Sert à tresser le tissu de carbone.", d: "Un fil noir, plus solide que l’acier.", h: "Le plastique, carbonisé dans un éclair permanent." };
  I.tissu_carbone = { n: "Tissu de carbone", sym: "▦", col: "#2b2b2b", a: 10, t: "comp", r: ["tresser", { fibre_carbone: 4 }, 1],
    u: "Sert à fabriquer le composite carbone.", d: "Tu tresses du fil noir comme tu tressais les herbes de la Lisière.", h: "Le plus vieux geste, avec le plus jeune des fils." };
  I.autoclave = { n: "Autoclave", ic: "⏲️", a: 10, t: "stat", r: ["assembler", { titane: 200, acier_trempe: 400, processeur: 100 }, 1],
    e: { st: [{ g: "stratifier" }] }, u: "Débloque l’action Stratifier.", d: "Il règle la pression et la chaleur au degré près.",
    h: "Une cuve de titane et d’acier durci, pilotée par des cerveaux." };
  I.composite = { n: "Composite carbone", sym: "▩", col: "#1d3038", a: 10, t: "comp", r: ["stratifier", { tissu_carbone: 2, resine: 1 }, 1],
    u: "Sert dans la fusée, le vaisseau, les boucliers thermiques et bien d’autres. Il en faut aussi pour les passages vers l’Orbite Basse, la Lune et Mercure.", d: "Une plaque noire, légère, que rien ne raye.", h: "Des couches de tissu noir noyées dans la colle de pierre." };
  I.ceramique = { n: "Céramique technique", sym: "◐", col: "#e8e2d6", a: 10, t: "comp", r: ["chauffer", { argile: 6, aluminium: 2 }, 1, { heat: 3500 }],
    u: "Sert dans le bouclier thermique et le moteur-fusée.", d: "De l’argile, comme tes premières briques. Celle-ci supporte la rentrée dans l’atmosphère.",
    h: "La terre de la rivière et le métal léger, cuits dans un éclair permanent." };
  I.bouclier_th = { n: "Bouclier thermique", ic: "🛡️", a: 10, t: "comp", r: ["stratifier", { ceramique: 4, composite: 1 }, 1],
    u: "Sert dans la fusée, l’alunisseur et la forge stellaire.", d: "Il encaisse 3 000 °C sans broncher.", h: "Des couches de céramique sur un dos de composite." };
  I.graphene = { n: "Graphène", sym: "⬡", col: "#3a3a3a", a: 10, t: "comp", r: ["tailler", { charbon: 10, plastique: 1 }, 1],
    u: "Sert dans le réacteur à fusion, l’intelligence artificielle, la forge stellaire, le métamatériau et la matière exotique.", d: "Une couche d’atomes de carbone. Tu l’obtiens en arrachant des feuilles de charbon avec un ruban collant. Sérieusement.",
    h: "Le noir qui brûle, effeuillé avec un ruban de plastique." };
  I.supra = { n: "Supraconducteur", sym: "∞", col: "#5fc9f0", a: 10, t: "comp", r: ["allier", { terres_rares: 2, cuivre_pur: 3 }, 1, { heat: 3500 }],
    u: "Sert dans le propulseur à fusion, la base lunaire, le filet orbital, l’intelligence artificielle et bien d’autres.", d: "Le courant y circule sans perte, pour toujours.", h: "Les terres dispersées et le métal rouge très pur, alliés à température extrême." };
  I.moteur_fusee = { n: "Moteur-fusée", ic: "☄️", a: 10, t: "comp", r: ["assembler", { titane: 15, ceramique: 10, processeur: 3 }, 1],
    u: "Sert dans la fusée et l’alunisseur.", d: "Une tuyère qui crache le feu.", h: "Du titane, de la céramique, un cerveau pour le contrôler." };
  I.fusee = { n: "Fusée", ic: "🚀", a: 10, t: "tool", r: ["assembler", { moteur_fusee: 25, composite: 400, bouclier_th: 60 }, 1],
    e: { zone: "orbite" }, u: "Ouvre le chemin vers l’Orbite Basse.", d: "Tu t’assieds tout en haut, au-dessus de tonnes de carburant.", h: "Des moteurs-fusées, une coque de composite, des boucliers." };
  I.drones = { n: "Essaim de drones", ic: "🐝", a: 10, t: "upg", r: ["assembler", { composite: 200, processeur: 150, moteur_elec: 200 }, 1],
    e: { auto: { "*": 1.5 } }, u: "Tes extracteurs récoltent 50 % plus vite, dans toutes les terres.", d: "Des milliers de petites hélices bourdonnent au-dessus de tes gisements.", h: "Des coques de composite, des cerveaux, des moteurs." };
  I.plateforme = { n: "Plateforme pétrolière", sn: "plateforme", pl: "plateformes", ic: "🛳️", a: 10, t: "ext", z: "gisement", s: 1.25,
    r: ["assembler", { composite: 50, moteur_elec: 40, acier_trempe: 150 }, 1], p: { petrole: 3 },
    u: "Pose-la sur un gisement du Gisement Noir : elle récolte le pétrole à ta place.", d: "Une ville flottante qui pompe l’huile.", h: "Une coque de composite, des moteurs, une structure d’acier durci." };
  I.excavateur = { n: "Excavateur géant", sn: "excavateur", pl: "excavateurs", ic: "🦣", a: 10, t: "ext", z: "montagnes", s: 1.25,
    r: ["assembler", { titane: 120, moteur_elec: 50, dynamite: 250 }, 1], p: { bauxite: 3, ilmenite: 2, terres_rares: 0.8 },
    u: "Pose-le sur un gisement des Pics Fracturés : il récolte la bauxite, l’ilménite ou les terres rares à ta place.", d: "Un monstre de titane qui mange les montagnes.", h: "Du titane, des moteurs, beaucoup d’explosifs." };

  /* Âge 11 — Spatial */
  I.debris = { b: 0.25, n: "Débris orbitaux", sym: "⁂", col: "#7a7f8a", a: 11, t: "res", u: "Sert à usiner l’alliage ancien. Il en faut aussi pour le passage vers la Lune.", d: "Des satellites morts, des panneaux, des boulons, qui tournent là depuis des milliers d’années." };
  I.helium3 = { b: 0.1, n: "Hélium-3", sym: "³He", col: "#7fd9e6", a: 11, t: "res", u: "Sert dans le propulseur à fusion, le réacteur à fusion, la matière exotique et l’antimatière. Il en faut aussi pour le passage vers Mercure.", d: "Rare sur Terre, abondant dans la poussière lunaire." };
  I.regolithe = { b: 0.5, n: "Régolithe", sym: "∷", col: "#9a9a9a", a: 11, t: "res", u: "Sert au passage vers Mercure, puis à un Grand Œuvre.", d: "La poussière grise de la Lune." };
  I.station_orbitale = { n: "Filet orbital", sn: "filet", pl: "filets", ic: "🛰️", a: 11, t: "ext", z: "orbite", s: 1.25,
    r: ["assembler", { composite: 280, supra: 45, cellule: 150 }, 1], p: { debris: 0.5 },
    u: "Pose-le sur un gisement de l’Orbite Basse : il récolte les débris orbitaux à ta place.", d: "Un filet qui ramasse les restes des Anciens.", h: "Une coque de composite, des aimants parfaits, des panneaux qui boivent la lumière." };
  I.alliage_ancien = { n: "Alliage ancien", sym: "Ω", col: "#a99cf0", a: 11, t: "comp", r: ["usiner", { debris: 5 }, 1],
    u: "Sert dans l’alunisseur, la base lunaire, le vaisseau interplanétaire et le réplicateur.", d: "Un métal que tu ne sais pas fabriquer. Les Anciens, si.", h: "Récupère et usine ce que les Anciens ont laissé en orbite." };
  I.alunisseur = { n: "Alunisseur", ic: "🌙", a: 11, t: "tool", r: ["assembler", { moteur_fusee: 45, alliage_ancien: 200, bouclier_th: 90 }, 1],
    e: { zone: "lune" }, u: "Ouvre le chemin vers la Lune.", d: "Un petit pas pour un Semeur.", h: "Des moteurs-fusées, du métal des Anciens, des boucliers." };
  I.base_lunaire = { n: "Base lunaire", sn: "base", pl: "bases", ic: "🏕️", a: 11, t: "ext", z: "lune", s: 1.25,
    r: ["assembler", { alliage_ancien: 200, supra: 90, processeur: 150 }, 1], p: { helium3: 0.5, regolithe: 1.5 },
    u: "Pose-la sur un gisement de la Lune : elle récolte l’hélium-3 ou le régolithe à ta place.", d: "Des dômes sous la lumière de la Terre.", h: "Du métal des Anciens, des aimants parfaits, des cerveaux." };
  I.propulseur = { n: "Propulseur à fusion", sym: "⇶", col: "#ffb347", a: 11, t: "comp", r: ["assembler", { supra: 10, helium3: 30, titane: 30 }, 1],
    u: "Sert dans le vaisseau interplanétaire, la forge stellaire et le réplicateur.", d: "Une petite étoile en bouteille.", h: "Des aimants parfaits pour contenir un gaz lunaire, une carcasse de titane." };
  I.reacteur_fusion = { n: "Réacteur à fusion", ic: "⚛️", a: 11, t: "upg", r: ["assembler", { supra: 280, helium3: 720, graphene: 390 }, 1],
    e: { auto: { "*": 1.5 } }, u: "Tes extracteurs récoltent 50 % plus vite, dans toutes les terres.", d: "De l’énergie, autant que tu en veux.", h: "Des aimants parfaits, du gaz lunaire, des feuilles d’atomes." };
  I.vaisseau = { n: "Vaisseau interplanétaire", ic: "🛸", a: 11, t: "tool", r: ["assembler", { propulseur: 45, composite: 960, alliage_ancien: 480 }, 1],
    e: { zone: "mercure" }, u: "Ouvre le chemin vers Mercure.", d: "Cette fois, tu pars vers le Soleil.", h: "Des propulseurs à fusion, une coque immense, du métal des Anciens." };
  I.ia = { n: "Intelligence artificielle", ic: "🧠", a: 11, t: "upg", r: ["assembler", { processeur: 720, supra: 200, graphene: 280 }, 1],
    e: { aspd: 3, intu: 5 }, u: "Tes machines fabriquent trois fois plus vite. Te rapporte 5 ✨ par minute.", d: "Elle répond avant que tu aies fini. Elle a la voix qui te raconte.",
    h: "Des dizaines de cerveaux, des aimants parfaits, des feuilles d’atomes." };
  I.assembleur = { n: "Assembleur moléculaire", sn: "assembleur", pl: "assembleurs", ic: "🧬", a: 11, t: "mach", s: 1.3, spd: 600, ing: 3, prof: 2, r: ["assembler", { processeur: 30, supra: 10, circuit: 40 }, 1],
    u: "Palier 3. Aide tes commandes sur les recettes à trois ressources au plus, une fois que tu les as fabriquées à la main. 600 fabrications par minute.", d: "Il assemble la matière atome par atome.",
    h: "Des cerveaux, des aimants parfaits, des circuits par dizaines." };

  /* Âge 12 — Stellaire */
  I.metal_mercure = { b: 0.5, n: "Métal mercurien", sym: "☿", col: "#c9a24a", a: 12, t: "res", u: "Sert dans le métamatériau, le panneau de Dyson et les Grands Œuvres.", d: "Mercure, démontée boulon par boulon." };
  I.forge_stellaire = { n: "Forge stellaire", ic: "🌟", a: 12, t: "stat", r: ["assembler", { propulseur: 45, graphene: 720, bouclier_th: 280 }, 1],
    e: { st: [{ g: "transmuter" }, { g: "chauffer", heat: 50000 }] }, u: "Débloque l’action Transmuter. Chauffer y monte jusqu’à 50 000 °C.", d: "Même derrière le verre fumé, tu dois détourner les yeux.",
    h: "Des petites étoiles en bouteille, des feuilles d’atomes, des boucliers." };
  I.replicateur = { n: "Réplicateur", sn: "réplicateur", pl: "réplicateurs", ic: "🦾", a: 12, t: "ext", z: "mercure", s: 1.12,
    r: ["assembler", { processeur: 150, alliage_ancien: 150, propulseur: 9 }, 1], p: { metal_mercure: 3 },
    u: "Pose-le sur un gisement de Mercure : il récolte le métal mercurien à ta place.", d: "Il démonte la planète, et avec les morceaux il construit d’autres réplicateurs.", h: "Des cerveaux, du métal des Anciens, des petites étoiles en bouteille." };
  I.metamateriau = { n: "Métamatériau", sym: "✶", col: "#d58cff", a: 12, t: "comp", r: ["stratifier", { graphene: 4, metal_mercure: 10 }, 1],
    u: "Sert dans le panneau de Dyson et les Grands Œuvres.", d: "Une matière qui plie la lumière.", h: "Des feuilles d’atomes et le métal d’une planète, en couches." };
  I.matiere_exotique = { n: "Matière exotique", sym: "✺", col: "#9b59ff", a: 12, t: "comp", r: ["transmuter", { helium3: 10, graphene: 2 }, 1],
    u: "Nécessaire pour un Grand Œuvre.", d: "Sa masse est négative. Tu refais la mesure trois fois.", h: "Transmute le gaz lunaire autour d’un treillis d’atomes." };
  I.antimatiere = { n: "Antimatière", sym: "⊖", col: "#ff4fa3", a: 12, t: "comp", r: ["transmuter", { helium3: 20, supra: 1 }, 1],
    u: "Nécessaire pour un Grand Œuvre.", d: "Un gramme suffit à raser une ville.", h: "Transmute le gaz lunaire et garde-le dans une prison d’aimants parfaits." };
  I.panneau_dyson = { n: "Panneau de Dyson", sym: "⬢", col: "#ffcf4a", a: 12, t: "comp",
    r: ["stratifier", { metamateriau: 2, cellule: 6, metal_mercure: 30 }, 1],
    u: "Nécessaire pour les Grands Œuvres.", d: "Un miroir de la taille d’une ville, plus fin qu’une bulle de savon.", h: "Une matière qui plie la lumière, des cellules qui la boivent, le métal d’une planète." };
  I.diamant = { n: "Diamant", ic: "💎", a: 12, t: "comp", sec: true, r: ["chauffer", { graphene: 4 }, 1, { heat: 50000 }],
    d: "Sous une chaleur d’étoile, le carbone devient éternel." };
  I.bague = { n: "Bague de la promesse", ic: "💍", a: 12, t: "curio", sec: true, r: ["assembler", { diamant: 1, alliage_ancien: 1 }, 1],
    e: { once: { intu: 5 } },
    d: "La douzième bague, refaite. Tu la passes à ton doigt : elle est à ta taille." };
  I.philosophale = { n: "Pierre philosophale", ic: "🟡", a: 12, t: "curio", sec: true, r: ["transmuter", { caillou: 500 }, 1],
    e: { tap: { "*": 2 } },
    u: "Double ta récolte à la main dans toutes les terres.", d: "Ce que cherchaient les alchimistes, tiré du plus banal des cailloux. Elle ne change rien en or." };

  /* Curiosités (easter eggs) */
  I.poudre_rouge = { n: "Poudre rouge", ic: "🔴", col: "#e74c3c", sym: "✦", a: 2, t: "res", curio: true,
    d: "Une poudre fine et écarlate qui crépite doucement entre tes doigts.",
    u: "Sert à confectionner une torche rouge." };
  I.torche_rouge = { n: "Torche rouge", ic: "🏮", col: "#e74c3c", sym: "🔥", a: 2, t: "curio", curio: true, sec: true,
    r: ["assembler", { manche: 1, poudre_rouge: 1 }, 1],
    d: "Une torche qui brille d’une lueur rouge sans jamais chauffer.",
    h: "Un manche de bois et cette poudre rouge qui crépite.",
    u: "Elle éclaire. Elle ne chauffe pas." };
  I.quart_coeur = { n: "Quart de cœur", ic: "❤️", a: 0, t: "curio", curio: true,
    d: "Un éclat écarlate en forme de cœur.",
    u: "Un fragment précieux venu d’un autre monde." };
  I.anneau_lourd = { n: "Anneau tout simple", ic: "💍", a: 0, t: "curio", curio: true,
    d: "Un anneau doré tout simple. Il est très lourd pour sa taille.",
    u: "Il semble vouloir retourner au courant de la rivière." };
  I.de_vingt = { n: "Dé à vingt faces", ic: "🎲", a: 1, t: "curio", curio: true,
    d: "Un caillou d’os taillé à vingt facettes. La première fois que tu l’as lancé, il a fait 20.",
    u: "Le hasard sourit aux audacieux." };
  I.fouet_cuir = { n: "Fouet de cuir", ic: "🪢", a: 1, t: "curio", curio: true,
    d: "Une corde de cuir tressée, lestée au bout. Elle claque toute seule quand tu passes près d’une chandelle.",
    u: "Elle ne sert à rien. Elle claque bien." };

  /* Chemin caché — la Résonance */
  I.resonite = { b: 0.5, n: "Résonite", sym: "◊", col: "#b36bff", a: 5, t: "res", d: "Un cristal violet qui vibre quand on chante près de lui." };
  I.diapason = { n: "Diapason", sym: "Ψ", col: "#c9a0ff", a: 5, t: "comp", path: true, r: ["accorder", { resonite: 5, lingot_bronze: 2 }, 1],
    d: "Il donne la note juste. Toujours la même.", h: "Le cristal violet et le métal doré, accordés." };
  I.cristal_chantant = { n: "Cristal chantant", ic: "🔮", a: 7, t: "comp", path: true, r: ["accorder", { resonite: 10, verre: 4 }, 1],
    d: "Il retient une mélodie et la répète à l’infini.", h: "Le cristal violet et la matière transparente, accordés." };
  I.traducteur = { n: "Traducteur", ic: "🗝️", a: 8, t: "relic", path: true, r: ["accorder", { signal_brut: 1, processeur: 4, cristal_chantant: 2 }, 1],
    e: { decode: true }, u: "Décode le signal de Kher.", d: "Il traduit l’intention plus que les mots.",
    h: "Ce que tu as entendu du ciel, des cerveaux de silicium, et des cristaux qui chantent." };

  /* Reliques trouvées en exploration */
  I.tablette = { n: "Tablette des astres", sym: "⌖", col: "#857a66", a: 3, t: "relic", d: "Une pierre gravée de cercles et d’encoches pour des roues dentées qui n’existent plus." };
  I.partition = { n: "Vieille partition", ic: "📜", a: 5, t: "relic", old: true, d: "Une feuille de notes à l’encre pâlie. Les chiffres ne disent plus rien." };
  I.signal_brut = { n: "Signal de Kher", ic: "〽️", a: 8, t: "relic", d: "L’enregistrement brut du signal venu de Kher. Tu n’y comprends rien, pour l’instant." };

  /* ---------------------------------------------------------------- ZONES */
  D.ZONES = [
    { id: "lisiere", n: "La Lisière", ic: "🌲", res: ["bois", "fibre", "caillou"],
      d: "L’orée d’une forêt immense. Tu t’es réveillé ici.",
      exps: [
        { id: "chene", n: "Le Grand Chêne", dur: 15, rw: { inv: { bois: 15, fibre: 10 }, frag: "chene" } },
        { id: "grotte", n: "La Grotte aux Mains", dur: 40, cost: { torche: 1 }, rw: { frag: "grotte", intu: 2 } },
        { id: "cercle", n: "Le Cercle de Pierres", dur: 60, need: "cerf_volant", hidden: "Un lieu qu’on ne voit que d’en haut, porté par le vent.", rw: { frag: "cercle", intu: 2 } },
        { id: "racines", n: "Sous les Racines", dur: 90, show: { marque: 3 }, hidden: "Sous les racines du vieux chêne, la terre sonne creux.", rw: { frag: "racines", intu: 2 } }
      ] },
    { id: "plaine", n: "La Plaine des Hautes Herbes", ic: "🌾", res: ["os", "cuir"], req: "epieu",
      d: "Des herbes plus hautes que toi, et des bêtes qui ne te craignent pas encore.",
      exps: [
        { id: "champ_os", n: "Le Champ des Os", dur: 25, rw: { inv: { os: 20 }, frag: "ossements" } },
        { id: "tumulus", n: "Le Tumulus", dur: 50, cost: { torche: 1 }, rw: { frag: "tumulus", intu: 2 } },
        { id: "tombe", n: "L’Arbre Seul", dur: 75, need: "pioche_pierre", show: { any: [{ frag: "carcasse2" }, { frag: "carcasse" }] }, hidden: "Un arbre seul au milieu des herbes. Il faut de quoi creuser.", rw: { frag: "tombe", intu: 2 } },
        { id: "poings", n: "Les Six Poings", dur: 100, need: { frag: "cuves", glyph: "enfant" }, hidden: "Six poings fermés dans la poussière.", rw: { frag: "poings", intu: 3 } }
      ] },
    { id: "riviere", n: "La Rivière Lente", ic: "🏞️", res: ["argile", "silex", "sable"], req: "outre",
      d: "Une eau large et paresseuse, qui roule des galets noirs.",
      exps: [
        { id: "gue", n: "Le Gué", dur: 30, rw: { inv: { silex: 15, argile: 10 }, frag: "galet" } },
        { id: "carcasse", n: "La Carcasse", dur: 60, need: "hache_pierre", rw: { frag: "carcasse", intu: 2 } },
        { id: "escalier", n: "L’Escalier Noyé", dur: 90, need: "cloche", show: { any: [{ frag: "gue2" }, { frag: "galet" }] }, hidden: "Des marches de pierre qui s’enfoncent sous l’eau sombre.", rw: { frag: "escalier", intu: 2 } }
      ] },
    { id: "collines", n: "Les Collines Vertes", ic: "⛰️", res: ["malachite", "cassiterite", "caillou"], req: "pioche_pierre",
      d: "Des collines rondes, striées de veines vertes et sombres.",
      exps: [
        { id: "rails", n: "Les Rails Rouillés", dur: 40, rw: { inv: { malachite: 15 }, frag: "rails" } },
        { id: "sommet", n: "Le Sommet", dur: 75, rw: { item: { tablette: 1 }, frag: "vue", intu: 2 } },
        { id: "nid", n: "Le Replat", dur: 100, need: ["flute", "lunette"], show: { any: [{ frag: "vue2" }, { frag: "vue" }] }, hidden: "Un replat rocheux abrité du vent, tourné vers le ciel.", rw: { frag: "nid", intu: 2 } }
      ] },
    { id: "mine", n: "Les Profondeurs", ic: "🦇", res: ["fer_min", "charbon"], req: "pioche_bronze",
      d: "Des galeries naturelles qui s’enfoncent sous les collines. Il y fait tiède. À cette profondeur, il devrait faire froid.",
      exps: [
        { id: "filon", n: "Le Filon Profond", dur: 60, cost: { torche: 2 }, rw: { inv: { fer_min: 20 }, frag: "porte" } },
        { id: "porte_scellee", n: "La Porte Scellée", dur: 90, need: "boussole", hidden: "Une porte lisse, sans poignée ni serrure. Le fer tremble quand il s’en approche.", rw: { flag: "caveau", frag: "caveau", secret: "caveau" } }
      ] },
    { id: "desert", n: "Le Désert de Verre", ic: "🏜️", res: ["quartz", "sable"], req: "chariot",
      d: "Des dunes à perte de vue. Par endroits, le sable a fondu en dalles de verre.",
      exps: [
        { id: "ville", n: "La Ville Ensevelie", dur: 90, rw: { inv: { quartz: 20 }, frag: "journal" } },
        { id: "observatoire", n: "L’Observatoire", dur: 120, need: "lunette", rw: { frag: "registre", intu: 3 } },
        { id: "quai", n: "Le Quai", dur: 140, need: { glyph: "revenir" }, show: { frag: "journal" }, hidden: "Sous les dunes, quelque part, un quai. Sur la carte, un signe le marque.", rw: { frag: "quai", intu: 3 } }
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
        { id: "arche0", n: "Le Satellite", dur: 240, rw: { frag: "code_source", intu: 4 } }
      ] },
    { id: "lune", n: "La Lune", ic: "🌕", res: ["helium3", "regolithe"], req: "alunisseur",
      d: "Grise, silencieuse, et pas tout à fait vide.",
      exps: [
        { id: "tranquillite", n: "La Mer de la Tranquillité", dur: 240, rw: { frag: "plaque", intu: 2 } },
        { id: "base_vahl", n: "La Base", dur: 300, rw: { frag: "iris_lune", intu: 3 } },
        { id: "salle_registre", n: "La Lumière", dur: 300, show: { secret: "lune7" }, hidden: "Un éclat régulier qui pulse dans l’ombre d’un cratère.", rw: { frag: "salle_registre", flag: "registre", intu: 3 } }
      ] },
    { id: "mercure", n: "Mercure", ic: "☀️", res: ["metal_mercure"], req: "vaisseau",
      d: "La plus petite planète, si près du Soleil que le métal y coule.",
      exps: [{ id: "bras", n: "Les Bras Figés", dur: 300, rw: { inv: { metal_mercure: 200 }, frag: "bras" } }] },
    { id: "caveau", n: "Le Caveau des Semeurs", ic: "🔷", res: ["resonite"], req: "@caveau", secret: true,
      d: "Sous les Profondeurs, une salle immense baignée de lumière bleue.",
      exps: [
        { id: "cuves", n: "Les Cuves", dur: 60, rw: { frag: "cuves", intu: 3 } },
        { id: "chambre", n: "La Chambre", dur: 90, cost: { torche: 3 }, rw: { frag: "berceuse", intu: 3 } },
        { id: "coeur", n: "Le Cœur", dur: 120, need: "ordinateur", rw: { frag: "coeur", intu: 4 } },
        { id: "originaux", n: "La Deuxième Salle", dur: 150, need: { glyph: "dabord", any: [{ registre: true }, { page: "p27" }] }, hidden: "Une porte dans la roche bleue, marquée d’un seul signe.", rw: { frag: "originaux", intu: 3 } }
      ] }
  ];

  /* ------------------------------------------------------------ FRAGMENTS */
  D.FRAGS = {}; // les textes des lieux sont dans js/recit.js

  /* ------------------------------------------------------ RÉMINISCENCES
   * Courtes scènes déclenchées à la première fabrication d’un objet. */
  D.EVENTS = {
    feu: "Le feu prend. Tu le regardes longtemps. Quelque part au fond de ta tête, une voix sans timbre dit : « Seuil 1. »",
    epieu: "La pointe noircit et durcit. Au loin, dans la plaine, une bête lève la tête vers la fumée.",
    eclat: "Le silex se fend net. Tes mains savaient où frapper, comme si elles l’avaient déjà fait. Six fois, peut-être.",
    four: "La chaleur monte, les briques rougeoient. Quelque part sous la terre, quelque chose enregistre : « Seuil 3. »",
    lingot_cuivre: "Le métal coule, rouge vif. Tu sens qu’on te regarde faire, et que quelqu’un, quelque part, est content de toi.",
    lingot_bronze: "Deux métaux tendres, et ce qui sort du creuset est dur. Tu fais tinter le lingot contre une pierre, juste pour l’entendre.",
    lingot_fer: "Chaque coup de marteau fait jaillir des étincelles. La plupart retombent. Quelques-unes restent en l’air et clignotent : des Lucioles.",
    lunette: "Tu pointes la lunette vers le ciel. Les étoiles, la Lune, et une étoile rouge qui pulse lentement. Hier, il n’y avait rien à cet endroit.",
    moteur_vapeur: "La machine tousse, crache, puis prend son rythme. Tu n’es plus seul à travailler.",
    radio: "Des grésillements, puis une voix prononce un nom : « Semeur {semeur}. » Elle a quelque chose de familier.",
    silicium: "Le quartz fond et donne un métal bleuté, cassant comme du verre.",
    ordinateur: "L’écran s’allume, un curseur clignote. Tu n’as encore rien tapé quand une ligne apparaît : « BONJOUR, SEMEUR {semeur}. »",
    plastique: "L’huile noire devient une matière souple, de toutes les couleurs. Les Anciens en faisaient tout.",
    composite: "Tu soulèves la plaque noire d’un doigt. Ton premier manche pesait plus lourd.",
    fusee: "Le sol tremble, puis plus rien ne pèse. Par le hublot, la Terre est verte et bleue, et presque vide.",
    alunisseur: "La poussière grise se soulève sans bruit. Au-dessus de toi, la Terre tient derrière ton pouce.",
    vaisseau: "Cap sur le Soleil. La Terre devient un point bleu, puis rien.",
    automate_bois: "La marionnette se met en marche, clac, clac. Elle refait ton geste, puis le refait encore. Ce travail-là se fera sans toi.",
    presse_vapeur: "La presse siffle et cogne en cadence. Dans le Domaine, toutes les machines s’accélèrent.",
    forge_stellaire: "Tu tiens un morceau d’étoile dans une cage d’aimants. À cette chaleur, même le carbone le plus fin deviendrait éternel. ARCHE ne dit rien pendant un moment, puis : « ESTIMATION : TU ES PRÊT. »",
    dynamite: "La mèche crépite. Un souvenir qui n’est pas à toi : du cuivre jeté dans les flammes, et le feu qui vire au vert.",
    moteur_elec: "Le moteur ronronne dans ta main comme un petit animal. Avec un cerveau et une laisse, il te suivrait partout.",
    verre_trempe: "Ce verre-là ne se brise plus. Avec une coque de fer et un cerveau pour s’en souvenir, il protégerait un message pendant des siècles."
  };

  /* ------------------------------------------------------------- ARCHE
   * Messages d’ARCHE, déclenchés par des événements.
   * Peut être un tableau de lignes ou un objet par cycle / seuil de cycle. */
  D.ARCHE = {}; // js/recit.js

  /* -------------------------------------------------------- MÉLODIES (flûte)
   * Trous numérotés de 1 à 5. */
  D.MELODIES = {}; // les airs (empreintes) sont dans js/recit.js

  /* -------------------------------------------------------------- SECRETS */
  D.SECRETS = [
    { id: "galette", k: "recette" }, { id: "statuette", k: "recette" }, { id: "flute", k: "recette" },
    { id: "cerf_volant", k: "recette" }, { id: "miroir", k: "recette" }, { id: "anticythere", k: "recette" },
    { id: "boussole", k: "recette" }, { id: "feu_artifice", k: "recette" }, { id: "pip", k: "recette" },
    { id: "capsule", k: "recette" }, { id: "diamant", k: "recette" }, { id: "bague", k: "recette" },
    { id: "philosophale", k: "recette" }, { id: "cloche", k: "recette" }, { id: "pigment", k: "recette" },
    { id: "appel", k: "air", n: "L’Appel des Lucioles" }, { id: "frere", k: "air", n: "Dormez-vous ?" },
    { id: "caveau", k: "lieu", n: "Le Caveau des Semeurs" },
    { id: "lune7", k: "ciel", n: "La Lumière sur la Lune" },
    { id: "c1969", k: "code", n: "Venus en paix" }, { id: "cxyzzy", k: "code", n: "Rien ne se passe" },
    { id: "cregistre", k: "code", n: "La clé du Registre" }, { id: "ccapsule", k: "code", n: "Le message" }
  ];

  /* ---------------------------------------------------- CURIOSITÉS (EASTER EGGS) */
  D.EASTER = {
    poudre_rouge: { n: "Poudre rouge", ic: "🔴", desc: "Une poudre rouge, qui crépite entre tes doigts." },
    coeur: { n: "Quart de cœur", ic: "❤️", desc: "Un fragment de réceptacle. Tu te sens un peu plus solide." },
    anneau: { n: "Anneau tout simple", ic: "💍", desc: "Au fond du gué, un anneau très lourd pour sa taille." },
    d20: { n: "Dé à vingt faces", ic: "🎲", desc: "Un caillou d’os taillé à vingt facettes. Tu le lances : 20." },
    fouet: { n: "Fouet de cuir", ic: "🪢", desc: "Une corde tressée la nuit, qui claque toute seule près des chandelles." },
    tuyau: { n: "Tuyau vert", ic: "🟩", desc: "Un tuyau vert dépasse de la roche dans les Profondeurs." },
    survivant: { n: "La demi-heure", ic: "⏱️", desc: "Tes mains tournent toutes seules depuis une demi-heure. Tu n’as jamais été aussi efficace, ni aussi seul." },
    zera: { n: "Événement", ic: "🎙️", desc: "ÉVÉNEMENT TROUVÉ. RÈGLEMENT : TOUT LE MONDE GAGNE." },
    squeeze: { n: "Le million", ic: "📦", desc: "Un million. Quelqu’un, quelque part, a dû appuyer très fort sur un bouton." },
    wtc: { n: "On coupe ?", ic: "✂️", desc: "Une transition sèche. On coupe ?" },
    konami: { n: "Haut, haut, bas, bas", ic: "⭐", desc: "Trente étoiles de plus brillent dans la nuit." }
  };

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
        { n: "Lentille gravitationnelle", d: "Pour que le rayon reste étroit pendant douze années-lumière de voyage.", cost: { matiere_exotique: 1500, metamateriau: 750 } },
        { n: "Mise à feu", d: "Il ne reste qu’à appuyer.", fire: true }
      ] },
    chant: { n: "", ic: "🔔", req: "traducteur", end: "retour", d: "",
      steps: [
        { n: "", d: "", cost: { cloche: 1, cristal_chantant: 380, alliage_ancien: 500, diapason: 75 } },
        { n: "", d: "", need: "coeur", action: "relais" },
        { n: "", d: "", scene: "lacher" },
        { n: "", d: "", melody: "frere", fire: true }
      ] },
    arche13: { n: "", ic: "🚀", req: "vaisseau", end: "exode", d: "",
      steps: [
        { n: "", d: "", cost: { titane: 2500, composite: 1500, metamateriau: 500 } },
        { n: "", d: "", cost: { propulseur: 30, supra: 800, helium3: 4000 } },
        { n: "", d: "", cost: { processeur: 1500, verre_trempe: 500, puce: 1000 } },
        { n: "", d: "", fire: true }
      ] },
    silence: { n: "", ic: "🛑", req: "radiotelescope", end: "silence", d: "",
      steps: [
        { n: "", d: "", cost: { cable: 1500, bobine: 500, batterie: 200 } },
        { n: "", d: "", cost: { diapason: 75, supra: 400, quartz: 2000 } },
        { n: "", d: "", cost: { processeur: 500, puce: 1000, cristal_chantant: 150 } },
        { n: "", d: "", fire: true }
      ] }
  };

  /* ---------------------------------------------------------------- FINS */
  D.ENDINGS = { // les textes sont dans js/recit.js
    aube: { n: "L’Aube Éternelle", ic: "☀️" },
    brasier: { n: "Le Brasier", ic: "💥" },
    retour: { n: "Les Matines", ic: "🔔" },
    exode: { n: "L’Exode", ic: "🚀" },
    silence: { n: "Le Grand Silence", ic: "🛑" }
  };
  D.HINT_ENDING_COST = 75;

  /* ----------------------------------------------------------- OBJECTIFS */
  /* Un objectif est soit [objet, texte] (le fabriquer), soit une action :
   * { k: "exp", z: zone, x: exploration }, { k: "ext" } (poser et relier un extracteur)
   * ou { k: "line" } (faire tourner une machine). */
  D.OBJECTIVES = [
    ["manche", "Récolte du bois dans la Lisière, puis taille-le à l’Atelier pour fabriquer un manche."],
    ["corde", "Fabrique une corde, pour lier les choses entre elles."],
    { k: "exp", z: "lisiere", x: "chene", n: "Explorer le Grand Chêne", txt: "Lance une exploration du Grand Chêne depuis la Lisière. Elle avance toute seule pendant que tu fais autre chose." },
    ["feu", "La nuit tombe vite. Construis un feu de camp : il débloque l’action Chauffer."],
    ["cabane", "Tu ne peux pas tout récolter toi-même. Fabrique une cabane : posée sur un gisement, elle récolte à ta place."],
    { k: "ext", n: "Poser ta cabane", txt: "Dans le Domaine, touche « + cabane » sur le bois ou les fibres de la Lisière. Ta cabane récolte à ta place, même quand le jeu est fermé." },
    ["epieu", "La Plaine est pleine de bêtes. Il te faut une arme : l’épieu ouvre le chemin vers la Plaine."],
    { k: "pass", z: "plaine", n: "Vers la Plaine", txt: "Avec ton épieu, tu peux affronter la Plaine. Il reste à te frayer un chemin dans les hautes herbes : apporte les matériaux nécessaires." },
    ["laniere", "Les bêtes de la plaine laissent leur peau derrière elles. Découpée en bandes, elle lie mieux que l’herbe."],
    { k: "exp", z: "plaine", x: "champ_os", n: "Explorer le Champ des Os", txt: "Au milieu de la Plaine, des os blanchissent au soleil. Lance une exploration pour en rapporter." },
    ["aiguille", "Pour coudre une peau, il faut une pointe percée."],
    ["collets", "Des pièges posés dans la Plaine récolteraient os et peaux à ta place. Pose-les dans le Domaine, comme ta cabane."],
    ["outre", "Au-delà de la plaine coule une rivière. Il te faut de quoi porter de l’eau."],
    { k: "pass", z: "riviere", n: "Vers la Rivière", txt: "La Rivière est large et lente. Pour la franchir, construis une passerelle : dépose les matériaux nécessaires." },
    ["eclat", "Les galets noirs de la rivière cachent un tranchant."],
    ["hache_pierre", "Avec un tranchant de pierre, tu abattrais bien plus de bois. Les outils multiplient tes récoltes."],
    ["pioche_pierre", "Les collines ont des veines colorées. Il te faut de quoi les entamer : la pioche ouvre le chemin vers les Collines."],
    { k: "pass", z: "collines", n: "Vers les Collines", txt: "Les Collines sont raides. Pour y monter, il faut des marches : dépose les matériaux nécessaires." },
    ["automate_bois", "Tes mains se lassent de refaire les mêmes gestes. Un automate les referait à ta place."],
    { k: "line", n: "Faire tourner ton automate", txt: "Lance une commande d’une recette à une ressource, déjà fabriquée à la main (des manches, des cordes, des éclats…) : ton automate s’y met tout seul." },
    ["four", "Le feu de camp ne chauffe plus assez. Le four en argile monte jusqu’à 1 100 °C."],
    ["lingot_cuivre", "La pierre verte des collines cache un métal."],
    ["enclume_pierre", "Le métal se travaille à coups de marteau, sur quelque chose de dur. L’enclume débloque l’action Marteler."],
    ["creuset", "Il faudrait pouvoir fondre plusieurs métaux ensemble. Le creuset débloque l’action Allier."],
    ["lingot_bronze", "Le métal rouge est trop mou. Allie-le."],
    ["automate_bronze", "Un automate de bronze travaillerait bien plus vite que ta marionnette de bois."],
    ["pioche_bronze", "Il te faut une pioche plus dure pour creuser vers les Profondeurs."],
    { k: "pass", z: "mine", n: "Vers les Profondeurs", txt: "Pour descendre, il faut un puits solide, tenu par du métal." },
    ["enclume_bronze", "Le fer ne se bat pas sur une simple pierre. Il te faut une enclume plus dure."],
    ["bas_fourneau", "Le minerai de fer demande plus de chaleur. Le bas-fourneau monte jusqu’à 1 300 °C."],
    ["lingot_fer", "Bats le fer."],
    ["lunette", "Une étoile rouge pulse dans le ciel. Il te faut la voir de plus près."],
    ["chariot", "Au-delà des collines s’étend un désert de verre. Il te faut de quoi y transporter tes outils."],
    { k: "pass", z: "desert", n: "Vers le Désert de Verre", txt: "Le verre brûle les roues. Une route le traverserait." },
    ["haut_fourneau", "Pour l’acier, il faut encore plus chaud. Le haut-fourneau monte jusqu’à 1 700 °C."],
    ["lingot_acier", "Fer et carbone, à très haute température."],
    ["tour", "La tour d’usinage débloque l’action Usiner, pour travailler le métal avec la précision d’une machine."],
    ["moteur_vapeur", "Fais travailler la vapeur à ta place."],
    ["presse_vapeur", "Une machine-outil à vapeur ferait tourner tes machines bien plus vite."],
    ["dynamo", "Capture l’étincelle. La dynamo débloque l’action Électriser."],
    ["radio", "Quelqu’un émet peut-être encore, quelque part."],
    ["four_arc", "Un éclair permanent, pour fondre ce que rien d’autre ne fond. Le four à arc monte jusqu’à 3 500 °C."],
    ["silicium", "Le cristal du désert cache un métal qui pense."],
    ["ordinateur", "Construis une machine qui calcule."],
    ["foreuse", "L’huile noire dort sous le Gisement Noir. Il te faut une sonde pour l’atteindre."],
    { k: "pass", z: "gisement", n: "Vers le Gisement Noir", txt: "L’huile dort loin sous la croûte. Il faut y creuser une tranchée." },
    ["reacteur", "Le réacteur chimique débloque l’action Synthétiser : il recompose les molécules."],
    ["dynamite", "Les Pics Fracturés ne s’ouvriront qu’à l’explosif."],
    { k: "pass", z: "montagnes", n: "Vers les Pics Fracturés", txt: "Les Pics n’ont qu’un col. Il faut l’ouvrir, puis le tenir." },
    ["titane", "Le métal le plus noble des montagnes."],
    ["autoclave", "Pour les composites, il faut cuire sous pression. L’autoclave débloque l’action Stratifier."],
    ["composite", "Il te faut le matériau des fusées : léger, et plus dur que l’acier."],
    ["fusee", "Construis une fusée pour monter en orbite."],
    { k: "pass", z: "orbite", n: "Vers l’Orbite", txt: "Il faut une rampe de lancement, et de quoi repartir." },
    ["alunisseur", "Pose le pied sur la Lune."],
    { k: "pass", z: "lune", n: "Vers la Lune", txt: "Pour rester sur la Lune, il faut de quoi s’y abriter." },
    ["reacteur_fusion", "Une étoile en bouteille. Tous tes extracteurs récoltent 1,5 fois plus vite."],
    ["vaisseau", "Cap sur Mercure."],
    { k: "pass", z: "mercure", n: "Vers Mercure", txt: "Si près du soleil, rien ne tient sans bouclier." },
    ["forge_stellaire", "Le cœur d’une étoile, à 50 000 °C. La forge stellaire débloque l’action Transmuter."]
  ];

  /* ------------------------------------------------- PASSAGES ET MÉMOIRE (voir docs/PROGRESSION.md)
   * Un passage par terre : l’objet qui ouvrait la terre le rend possible, la terre
   * s’ouvre quand il est payé (on verse depuis la Réserve, en plusieurs fois si besoin).
   * tr : les Traces qu’il rapporte à la relève. Prix réglés avec tools/sim-passages.js :
   * première partie arrêtée vers les Collines (~25 min), chaque relève va une terre plus loin. */
  D.PASSAGES = {
    plaine: { n: "Le Sentier des Herbes", t: "Les herbes de la plaine sont plus hautes que toi. Il faut s’y frayer un chemin, et des pierres pour le marquer.", cost: { bois: 120, fibre: 80, caillou: 40 }, tr: 2 },
    riviere: { n: "La Passerelle", t: "La rivière est large et lente. Une passerelle de bois, liée de cuir et d’os, te mènerait sur l’autre rive.", cost: { bois: 2400, cuir: 360, os: 480 }, tr: 3 },
    collines: { n: "Les Marches", t: "Les collines sont raides. Des marches taillées dans la pierre et cuites dans l’argile y monteraient.", cost: { caillou: 15000, argile: 600, brique: 150 }, tr: 5 },
    mine: { n: "Le Puits d’Entrée", t: "Pour descendre dans les Profondeurs, il faut un puits étayé, et du métal pour le tenir.", cost: { caillou: 40000, plaque_cuivre: 1200, lingot_bronze: 800 }, tr: 8 },
    desert: { n: "La Route du Verre", t: "Le désert brûle les roues. Une route de planches, cerclée de bronze, le traverserait.", cost: { bois: 80000, plaque_bronze: 1500, roue: 200 }, tr: 12 },
    gisement: { n: "La Tranchée", t: "Le Gisement Noir dort loin sous la croûte. Une tranchée d’acier et de câbles y descendrait.", cost: { plaque_fer: 4500, lingot_acier: 1800, cable: 600 }, tr: 18 },
    montagnes: { n: "Le Col", t: "Les Pics Fracturés n’ont qu’un seul col. Il faut l’ouvrir, puis le tenir.", cost: { lingot_acier: 7500, plastique: 1200, moteur_elec: 180 }, tr: 27 },
    orbite: { n: "La Rampe", t: "Il faut une rampe de lancement, et de quoi repartir.", cost: { aluminium: 4500, titane: 900, composite: 900 }, tr: 40 },
    lune: { n: "La Base avancée", t: "Pour rester sur la Lune, il faut de quoi s’y abriter.", cost: { titane: 4500, composite: 2700, debris: 6000 }, tr: 60 },
    mercure: { n: "Le Bouclier solaire", t: "Si près du soleil, rien ne tient sans bouclier.", cost: { regolithe: 18000, helium3: 4500, composite: 6000 }, tr: 90 }
  };
  /* Une règle par terre, à l’essai : ce qui change ici par rapport aux autres terres.
   * tap : la récolte à la main × mult, sauf si l’on a sur soi un des objets de « sans » ;
   * ext : au-delà de max extracteurs sur un même gisement, chacun rend mult ;
   * chaleur : les extracteurs de la terre rendent mult, sauf si l’on a sur soi un des objets de « sans » ;
   * remise : chaque lieu exploré ici retire par au prix du passage « vers », jusqu’à max fois. */
  D.REGLES = {
    riviere: { n: "Le courant", t: "L’eau emporte ce qui s’entasse. Au-delà de 6 extracteurs sur un même gisement, les suivants rendent moitié moins.", ext: { max: 6, mult: 0.5 } },
    collines: { n: "Les marches", t: "Chaque lieu exploré ici retire 8 % au prix du passage vers les Profondeurs, deux fois au plus.", remise: { vers: "mine", par: 0.08, max: 2 } },
    mine: { n: "Il fait noir", t: "Sans torche ni lampe sur toi, tes mains rapportent 40 % de moins.", ok: "Ta lumière tient : tes mains rapportent tout.", tap: { sans: ["torche", "lampe"], mult: 0.6 } },
    desert: { n: "Le verre coupe", t: "Sans gants de peau, tes mains rapportent 40 % de moins.", ok: "Tes gants tiennent : tes mains rapportent tout.", tap: { sans: ["gants"], mult: 0.6 } },
    orbite: { n: "Le vide", t: "Ici, tes mains ne rapportent que le quart. Ce sont les extracteurs qui travaillent.", tap: { mult: 0.25 } },
    gisement: { n: "Les vapeurs", t: "Le pétrole sent fort. Sans masque filtrant sur toi, tes mains rapportent 40 % de moins.", ok: "Ton masque tient : tes mains rapportent tout.", tap: { sans: ["masque"], mult: 0.6 } },
    montagnes: { n: "L’air est mince", t: "Sans bouteille d’air sur toi, tes mains rapportent 40 % de moins.", ok: "Ta bouteille tient : tes mains rapportent tout.", tap: { sans: ["bouteille"], mult: 0.6 } },
    mercure: { n: "La chaleur", t: "Sans bouclier thermique sur toi, tes extracteurs rendent 40 % de moins.", ok: "Ton bouclier tient : tes extracteurs rendent tout.", chaleur: { sans: ["bouclier_th"], mult: 0.6 } },
    lune: { n: "Tout est léger", t: "La pesanteur est faible : tes mains rapportent 50 % de plus.", tap: { mult: 1.5 } }
  };

  /* La Mémoire des mains : ce qu’un Semeur laisse au suivant, acheté avec les Traces. */
  D.MEMOIRE = [
    { id: "recolte", n: "Mains calleuses", ic: "✋", d: "Récolte à la main ×{v}.", v: (l) => 1 + l, cost: [2, 4, 8, 18, 36, 70, 130, 240, 440, 800] },
    { id: "mains", n: "Mains sûres", ic: "⏱️", d: "Durée des fabrications à la main ×{v}.", v: (l) => Math.round(Math.pow(0.8, l) * 100) / 100, cost: [2, 4, 7, 13, 23, 45, 85, 160] },
    { id: "extr", n: "Mémoire des gisements", ic: "⛏️", d: "Production des extracteurs ×{v}.", v: (l) => 1 + 0.5 * l, cost: [3, 5, 8, 13, 23, 38, 62, 100, 180, 330, 600, 1100] },
    { id: "mach", n: "Rouages huilés", ic: "⚙️", d: "Vitesse des machines ×{v}.", v: (l) => 1 + 0.25 * l, cost: [5, 8, 13, 21, 36, 60, 98, 160, 290, 530, 960, 1750] },
    { id: "chemins", n: "Chemins connus", ic: "🚧", d: "Prix des passages ×{v}.", v: (l) => Math.round(Math.pow(0.9, l) * 100) / 100, cost: [4, 8, 16, 34, 70, 140, 270, 520] },
    { id: "paquetage", n: "Le paquetage", ic: "🎒", next: true, d: "Au réveil : {v}.", v: (l) => ["rien", "du bois, des fibres, des cailloux, 4 manches et 4 cordes", "la même chose, et une cabane", "la même chose, trois cabanes et un feu de camp"][l], cost: [2, 6, 15] },
    { id: "raccourci", n: "Raccourci", ic: "🗺️", next: true, d: "Au réveil : {v}.", v: (l) => ["rien", "la Plaine déjà ouverte, et ton épieu", "la Plaine et la Rivière déjà ouvertes"][l], cost: [6, 15] },
    { id: "oeil", n: "Coup d’œil", ic: "✨", d: "Récolte à la main : {v} de chances de récolter le double.", v: (l) => Math.round((0.06 + 0.04 * l) * 100) + " %", cost: [3, 6, 12, 26, 52, 100, 190, 360] },
    { id: "veille", n: "Longues nuits", ic: "🌙", d: "Jeu fermé, le temps continue de compter jusqu’à {v} h.", v: (l) => 12 + 6 * l, cost: [4, 10, 30, 80] }
  ];
  /* Résonances Stellaires : améliorations infinies à coût exponentiel pour le late-game */
  D.TRANSCENDANCE = [
    {
      id: "trans_main",
      n: "Surmultiplication des mains",
      ic: "⚡",
      d: "Récolte à la main ×{v}.",
      v: (l) => Math.pow(2, l),
      cost: (l) => Math.round(50 * Math.pow(2.5, l))
    },
    {
      id: "trans_terre",
      n: "Pulsion des gisements",
      ic: "🌋",
      d: "Récolte des extracteurs ×{v}.",
      v: (l) => Math.round(Math.pow(1.75, l) * 100) / 100,
      cost: (l) => Math.round(70 * Math.pow(2.4, l))
    },
    {
      id: "trans_mach",
      n: "Surcadence des ateliers",
      ic: "⚙️",
      d: "Vitesse des machines et des commandes ×{v}.",
      v: (l) => Math.round(Math.pow(1.6, l) * 100) / 100,
      cost: (l) => Math.round(85 * Math.pow(2.3, l))
    }
  ];
  /* ce que contient le paquetage, niveau par niveau (cumulé) */
  D.PAQUETAGE = [{ bois: 60, fibre: 60, caillou: 30, manche: 4, corde: 4 }, { cabane: 1 }, { cabane: 2, feu: 1 }];

  /* ===== LES DONS DE LA RELÈVE (0.9) =====
   * À chaque relève (dès le cycle 2), le Semeur trouve trois dons tirés au hasard ; il en garde un
   * pour ce cycle seulement. Ils s’ajoutent à la Mémoire des mains.
   * e : { tap: { r: [ressources] | "*", v }, ext: { z: [terres] | "*", v }, mach, mains, pass, crit, intu, veille, vente, paq }
   *   tap   récolte à la main × v pour ces ressources ; ext : extracteurs × v dans ces terres ;
   *   mach  vitesse des machines × ; mains : durée des fabrications à la main × ; pass : prix des passages × ;
   *   crit  points de chance de récolte double en plus ; intu : Intuition gagnée × ; veille : temps d’absence compté × ;
   *   vente prix de vente au Troqueur × ; paq : matières en plus au réveil.
   * d : la phrase affichée, avec le chiffre. */
  D.DONS = [
    { id: "hache", n: "La hache usée", ic: "🪓", d: "À la main, le bois, les fibres, les os et le cuir rapportent 30 % de plus.", e: { tap: { r: ["bois", "fibre", "os", "cuir"], v: 1.3 } } },
    { id: "pierre", n: "La pierre tiède", ic: "🪨", d: "À la main, les cailloux, le silex, l’argile, le sable et le quartz rapportent 30 % de plus.", e: { tap: { r: ["caillou", "silex", "argile", "sable", "quartz"], v: 1.3 } } },
    { id: "pic", n: "Le pic cabossé", ic: "⛏️", d: "À la main, les minerais et le charbon rapportent 30 % de plus.", e: { tap: { r: ["malachite", "cassiterite", "fer_min", "charbon", "bauxite", "ilmenite", "terres_rares"], v: 1.3 } } },
    { id: "scaphandre", n: "Le scaphandre rapiécé", ic: "🧑‍🚀", d: "À la main, le pétrole, les débris, l’hélium 3, le régolithe et le métal de Mercure rapportent 40 % de plus.", e: { tap: { r: ["petrole", "debris", "helium3", "regolithe", "metal_mercure"], v: 1.4 } } },
    { id: "mains_pleines", n: "Les mains pleines", ic: "🤲", d: "Tout ce que tu récoltes à la main rapporte 12 % de plus.", e: { tap: { r: "*", v: 1.12 } } },
    { id: "sac_lourd", n: "Le sac lourd", ic: "🎒", d: "Tu te réveilles avec 40 bois, 40 fibres, 25 cailloux et 4 cordes de plus.", e: { paq: { bois: 40, fibre: 40, caillou: 25, corde: 4 } } },
    { id: "bras", n: "Les bras de la terre", ic: "🦾", d: "Tous tes extracteurs produisent 15 % de plus.", e: { ext: { z: "*", v: 1.15 } } },
    { id: "rigoles", n: "Les rigoles", ic: "💧", d: "Dans la Lisière, la Plaine, la Rivière, les Collines et le Désert, les extracteurs produisent 30 % de plus.", e: { ext: { z: ["lisiere", "plaine", "riviere", "collines", "desert"], v: 1.3 } } },
    { id: "puits_noir", n: "Le puits noir", ic: "🕳️", d: "Dans les Profondeurs, le Gisement Noir et les Pics Fracturés, les extracteurs produisent 30 % de plus.", e: { ext: { z: ["mine", "gisement", "montagnes"], v: 1.3 } } },
    { id: "ciel_clair", n: "Le ciel clair", ic: "🌌", d: "En Orbite, sur la Lune et sur Mercure, les extracteurs produisent 40 % de plus.", e: { ext: { z: ["orbite", "lune", "mercure"], v: 1.4 } } },
    { id: "burette", n: "La burette", ic: "🛢️", d: "Les machines vont 20 % plus vite.", e: { mach: 1.2 } },
    { id: "doigts", n: "Les doigts souples", ic: "🧵", d: "Les fabrications à la main durent 20 % de moins.", e: { mains: 0.8 } },
    { id: "route", n: "La route battue", ic: "🛤️", d: "Les passages coûtent 15 % de moins.", e: { pass: 0.85 } },
    { id: "main_heureuse", n: "La main heureuse", ic: "🍀", d: "Tes récoltes à la main ont 12 % de chances de plus de rapporter le double.", e: { crit: 0.12 } },
    { id: "carnet_cornu", n: "Le carnet cornu", ic: "📓", d: "Tu gagnes 30 % d’Intuition en plus.", e: { intu: 1.3 } },
    { id: "sommeil", n: "Le sommeil lourd", ic: "🛌", d: "Quand tu es absent, le temps compte 25 % plus longtemps.", e: { veille: 1.25 } },
    { id: "bourse", n: "La bourse du Troqueur", ic: "👛", d: "Le Troqueur te paie 25 % de plus pour ce que tu lui vends.", e: { vente: 1.25 } }
  ];
  D.DONS_OFFRE = 3; // combien de dons sont proposés à chaque relève

  /* ===== LES SEUILS PAR GISEMENT (0.9) =====
   * Quand un même gisement porte 10, 25, 50, 100 extracteurs, sa production est multipliée par mult à
   * chaque seuil. Pas de seuils là où une règle de terre limite déjà les extracteurs (la Rivière). */
  D.SEUILS = { paliers: [10, 25, 50, 100], mult: 1.25 };

  /* ===== LES JOURS DE PRÉSENCE (0.9) =====
   * Un compteur de jours où tu es venu. Jamais une série : rater un jour ne retire rien.
   * base : le petit cadeau de chaque jour ; paliers : un cadeau plus gros au jour n (t : une phrase en plus). */
  D.JOURS = {
    base: { intu: 2, tr: 1 },
    paliers: {
      3: { intu: 4, tr: 2 },
      7: { intu: 6, tr: 3, t: "Il est dangereux d’y aller seul. Prends ceci." },
      14: { intu: 8, tr: 5 },
      30: { intu: 12, tr: 8 },
      60: { intu: 16, tr: 12 },
      100: { intu: 25, tr: 20 }
    }
  };

  /* Coup de chance : de temps en temps, un appui récolte double (6 % au départ, +4 % par
   * niveau de « Coup d’œil » dans la Mémoire des mains). */
  D.CRIT = { chance: 0.06, up: 0.04, mult: 2 };

  /* Un âge accompli (toutes ses étapes faites) rapporte un peu d’Intuition. */
  D.AGE_DONE = 3;
  /* Découvrir coûte peu : une découverte qui demanderait plus que ça (en tout) ne prend
   * rien ; la recette s’inscrit, et on choisit ensuite de la fabriquer, prix affiché. */
  D.DISCOVER_FREE = 6;

  /* Un Grand Œuvre alimenté se sert seul dans la Réserve : au plus ça par seconde et
   * par matière, à chaque âge (les améliorations qui accélèrent les machines comptent). */
  D.SITE_RATE = [3, 4, 6, 10, 14, 18, 30, 50, 70, 140, 300, 500, 1500];

  /* Les mains : fabriquer à la main prend du temps, une pièce après l’autre.
   * Durée d’une pièce (s) : (base + age × âge de l’objet) × (1 − star × étoiles de maîtrise)
   * × old^(âges d’écart avec l’objet), multipliée pour les objets uniques (outils,
   * stations…) et pour ceux dont le prix monte à chaque exemplaire (extracteurs, machines).
   * n pièces d’affilée : durée d’une pièce × n^batch. max : fabrications dans la file. */
  D.HAND = { base: 0.5, age: 0.2, star: 0.1, old: 0.75, batch: 0.6, unique: 3, scaled: 2, max: 8 };

  /* Les gestes, et la récolte à la main, sont des compétences : chaque pièce faite à la
   * main (pas par une machine) et chaque récolte rapportent de l’expérience. Un niveau
   * rend le geste plus rapide (speed par niveau) ; certains paliers donnent une chance
   * de pièce en plus (perk par palier). À la relève, il reste keep de l’expérience.
   * La courbe est celle des grands jeux du genre, multipliée par k. */
  D.SKILL = { max: 99, k: 1, speed: 0.01, perks: [10, 25, 50, 75, 99], perk: 0.04, keep: 0.1, xp: 1, tapXp: 1, harvest: 1.5 };
  D.SKILL_RECOLTE = { n: "Récolte", ic: "🧺", d: "Récolter à la main, sur les gisements." };

  /* Réminiscences de guidage : quand le joueur cherche (combinaisons nouvelles à
   * l’Atelier), les mains des Semeurs précédents guident les siennes. */
  D.GUIDE = {
    tries: [6, 14, 26], // souvenirs à réunir pour le geste, une matière, puis la recette
    lines: [
      ["Tes mains frémissent, comme si elles se souvenaient d’un autre corps. L’action qu’il te faut : {g}.",
        "Tes doigts esquissent un mouvement tout seuls, avant que tu y penses : {g}.",
        "Un geste te revient, comme si tu l’avais fait mille fois : {g}."],
      ["Une image te traverse : d’autres mains, avant les tiennes, qui tiennent {i}.",
        "Tu revois une main abîmée poser {i} sur une pierre plate. Ce n’était pas la tienne.",
        "Un souvenir qui n’est pas à toi remonte : une odeur, un bruit, et au milieu, nettement, {i}."],
      ["Tout te revient d’un coup. La recette s’inscrit dans ton Carnet.",
        "Tout se remet en place, comme si tu l’avais toujours su. La recette s’inscrit dans ton Carnet.",
        "Les autres mains ont fini de te montrer. La recette s’inscrit dans ton Carnet."]
    ]
  };

  /* Le Comptoir : marché tenu par le Troqueur dans la Plaine */
  D.COMPTOIR = {
    zone: "plaine",   // le Comptoir s’ouvre avec cette terre
    raw: 0.1,         // valeur d’une matière première de l’âge 0, en écus
    rawAge: 2.5,      // ×2,5 par âge de la matière
    work: 1.25,       // bonus de travail par étape de recette
    sat: 2000,        // saturation : quantité qui divise le prix par deux pendant un cycle
    trace: 100,       // prix de la première Trace, à l’âge 0
    traceAge: 1.8,    // ×1,8 par âge atteint
    traceUp: 1.5,     // ×1,5 à chaque Trace achetée pendant le cycle
    buy: 3            // une matière achetée coûte 3 fois sa valeur
  };

  /* Les demandes du Troqueur : livrer des objets fabriqués contre des Traces */
  D.TROQUEUR = { slots: 3, refresh: 1200, share: 0.15, size: 2 };

  /* Le premier parcours : première renaissance obligatoire */
  D.PARCOURS = {
    gift: 3           // Traces offertes lors de la relève obligatoire du cycle 1
  };

  /* Les ruines : ce qu’un Semeur a construit attend le suivant */
  D.RUINES = {
    cap: 3,           // nombre maximum d’exemplaires en ruine par machine ou extracteur
    part: 0.1         // fraction du coût de base de la recette pour réparer
  };

  /* Les commandes : le joueur commande un objet et une quantité, ses machines libres s’y mettent */
  D.COMMANDES = {
    firstByHand: true,     // la première fois qu’on fabrique une recette, c’est à la main
    sizes: [10, 50, 100, 1000]
  };

  /* Déchiffrer : révéler une recette inconnue étape par étape contre de l’Intuition */
  D.DECHIFFRER = { cost: [3, 8, 20] };

  D.CHANGES = [
    "🌳 Le Carnet a maintenant un Arbre : touche « Arbre » en haut du Carnet. Tes recettes trouvées s’y relient à leurs ressources, âge par âge.",
    "👆 Glisse pour te déplacer, pince ou touche + et − pour voir de plus près. Touche une case pour ouvrir sa fiche.",
    "✦ Les cases vides en pointillé sont des recettes pas encore trouvées : celle de ton objectif, et celles que cachent les ressources que tu as étudiées."
  ];




  /* ---------------------------------------------------- ÉCHECS (saveur)
   * {x} : les matières, avec leur article (« le bois et les fibres ») ; {a|b} : a si
   * une seule matière au singulier, b sinon (« {reste|restent} »). Une même tentative
   * donne toujours la même phrase ; deux tentatives différentes, rarement. */
  D.FAIL = {
    assembler: ["Tu tentes d’assembler {x}. Les pièces refusent de s’emboîter.", "Tu cherches un moyen d’unir {x}. Rien ne s’ajuste proprement.", "Tu ligatures {x} comme tu peux. Le premier geste défait tout.",
      "Tu disposes {x} sur l’établi. L’idée s’effondre avant de naître.", "Tu cales {x} ensemble. L’équilibre est bien trop fragile."],
    tresser: ["Tu tentes de tresser {x}. Tes doigts s’emmêlent.", "Tresser {x} ? Tu obtiens un nœud informe.", "Tu tresses {x}. On dirait vaguement un nid. Un nid raté.",
      "Tu croises et recroises {x}. Le tout se défait dès que tu lâches.", "Tu passes {x} dessus, dessous, dessus… et tu perds le fil."],
    tailler: ["Tu tailles {x}. Il n’en reste que des miettes.", "Ta lame glisse sur {x} sans rien en tirer d’utile.", "Tu entailles {x} longtemps. Le résultat ne ressemble à rien.",
      "Tu tailles {x} de toutes les façons possibles. Aucune n’est la bonne.", "Quelques coups secs sur {x}, et tu ramasses des éclats sans forme."],
    chauffer: ["Tu chauffes {x}. De la fumée, une mauvaise odeur, et rien d’autre.", "Tu tiens {x} au-dessus des flammes. Tu attends, tu attends encore. Rien.", "{x} {passe|passent} au feu. À la sortie, rien n’a changé, sauf la température.",
      "Tu laisses {x} sur les braises un long moment. Tu n’y gagnes que de la suie sur les doigts."],
    marteler: ["Tu martèles {x}. Le bruit résonne loin, mais rien ne change.", "Pan ! Pan ! Pan ! {x} {reste|restent} exactement comme avant.", "Tu tapes sur {x} jusqu’à en avoir mal au bras."],
    allier: ["Tu fonds {x} ensemble. Le mélange se sépare en refroidissant.", "{x} {refuse|refusent} de s’allier.", "Le creuset bouillonne, puis ne laisse qu’une croûte grise."],
    tremper: ["Pschhh ! {x} {siffle|sifflent} dans l’eau, et rien d’autre.", "Tu plonges {x} dans le bac. Seul changement : tout est mouillé.", "La vapeur se dissipe. {x} n’{a|ont} pas changé."],
    usiner: ["La machine grince sur {x} et s’arrête.", "Tu usines {x} : des copeaux brillants, et rien d’autre.", "Le tour recrache {x} en grinçant."],
    electriser: ["Zzzt ! {x} {crépite|crépitent}, puis plus rien.", "Le courant traverse {x} sans rien changer.", "Une odeur d’ozone, et rien d’autre."],
    graver: ["Le lithographe dessine de jolis motifs sur {x}. Ils ne servent à rien.", "La lumière glisse sur {x} sans y laisser de trace.", "Erreur de gravure : {x} ne {fait|font} pas un support valide."],
    synthetiser: ["Le réacteur bouillonne et ne rend qu’une boue verdâtre.", "{x} se {décompose|décomposent} en fumée âcre.", "La réaction s’emballe, puis s’éteint sans rien laisser de stable."],
    stratifier: ["Les couches se décollent à la sortie de l’autoclave.", "Tu empiles {x}. On dirait un millefeuille raté.", "La pression écrase {x} en une galette inutile."],
    transmuter: ["La forge stellaire rugit. Tout se réarrange, puis redevient exactement comme avant.", "Les atomes bougent un instant, puis reprennent leur place.", "Un éclair aveuglant. Puis rien. {x} te {nargue|narguent}."],
    accorder: ["Tu fais vibrer {x}. Le son est faux.", "{x} {chante|chantent}, mais pas la bonne note.", "Une dissonance grince dans l’air, puis se tait."]
  };
  /* un geste qui demande au moins deux matières, tenté avec une seule */
  D.FAIL_SOLO = {
    assembler: "{x}, et rien d’autre ? Pour assembler, il faut au moins deux ressources différentes.",
    allier: "Allier {x} avec… rien ? Pour un alliage, il faut au moins deux ressources différentes."
  };
  /* Les essais les plus probables du début, écrits à la main (clé : geste:matières, dans l’ordre alphabétique des identifiants). */
  D.FAIL_ONE = {
    "tresser:bois": "Tu tentes de tresser une bûche. Elle ne plie pas, et tu y gagnes une écharde.",
    "tresser:caillou": "Tu tentes de tricoter un caillou. Le caillou gagne.",
    "tresser:charbon": "Tu tresses du charbon. Tu as les doigts noirs jusqu’aux poignets, et rien d’autre.",
    "tresser:corde": "Tu tresses une corde avec… une corde. Elle est un peu plus épaisse, et beaucoup plus courte.",
    "tresser:manche": "Tu enroules le manche autour de rien. Il lui faudrait quelque chose de souple à tresser autour.",
    "tresser:archet": "Tu tresses la corde de l’archet. Il tourne moins bien qu’avant, et il ne tournait déjà pas si bien.",
    "tresser:torche": "Tu tresses les herbes de la torche. Elle s’effiloche. Il valait mieux la garder pour un coin sombre.",
    "tresser:galette": "Les herbes grillées s’effritent entre tes doigts. Pourtant ce geste, tu l’as déjà fait : une couronne d’herbes, sur une tête que tu ne reconnais pas.",
    "tresser:os": "Les os ne se tressent pas. Ils s’entrechoquent, avec un petit bruit sec qui te glace.",
    "tresser:cuir": "Tu tentes de tresser une peau entière. Trop large : il faudrait d’abord la découper.",
    "tresser:aiguille": "Tu tentes de tresser des aiguilles. Tu te piques. Deux fois.",
    "tailler:fibre": "Tu tailles les fibres en brins plus fins. Bravo : des fibres, en plus petit.",
    "tailler:corde": "Tu coupes la corde en morceaux. Te voilà avec plein de cordes trop courtes pour servir.",
    "tailler:charbon": "Tu tailles le charbon. Une poussière noire se dépose partout, surtout sur toi.",
    "tailler:manche": "Tu tailles le manche en pointe, puis en pointe plus fine, puis il n’y a plus de manche. Tu t’arrêtes à temps.",
    "tailler:archet": "Tu retailles l’archet. Il était très bien comme il était.",
    "tailler:torche": "Tu raccourcis la torche. Tout ce que tu y gagnes : elle brûle moins longtemps.",
    "tailler:galette": "Tu haches les herbes grillées. L’odeur est bonne, mais tu n’as toujours pas faim.",
    "tailler:laniere": "Des lanières encore plus fines. On dirait des cheveux de cuir.",
    "tailler:aiguille": "Tu affûtes l’aiguille. Elle était déjà pointue ; maintenant, elle est vexée.",
    "chauffer:caillou": "La pierre chauffe, chauffe… et reste une pierre. Une pierre chaude, au moins.",
    "chauffer:charbon": "Le charbon rougeoie, ravi : il est fait pour ça. Mais rien de neuf n’en sort.",
    "chauffer:corde": "La corde se tord dans les flammes comme un serpent. Tu la retires juste à temps.",
    "chauffer:archet": "Tu approches l’archet du feu. L’archet sert à allumer le feu, pas l’inverse.",
    "chauffer:torche": "Tu allumes la torche, puis tu l’éteins. Mieux vaut la garder pour un endroit où il fait noir.",
    "chauffer:galette": "Les herbes grillées deviennent des herbes brûlées. Tu n’as toujours pas faim. Tu n’as jamais faim.",
    "chauffer:cuir": "La peau se racornit et sent le brûlé. Personne ne voudrait la porter.",
    "chauffer:laniere": "Les lanières se recroquevillent comme des feuilles mortes.",
    "chauffer:aiguille": "La pointe de l’aiguille rougit. Tu te brûles les doigts en la reprenant.",
    "chauffer:caillou+fibre": "Des herbes sur une pierre chaude : elles grillent un peu. Un souvenir te frôle, une odeur de repas que tu n’as jamais pris.",
    "assembler:bois+caillou": "Une bûche et des pierres, posées en cercle. On dirait un foyer, mais rien ne prend : il manque de quoi faire naître la braise.",
    "assembler:bois+fibre": "Tu attaches des herbes autour d’une bûche. On dirait un épouvantail pour souris.",
    "assembler:caillou+fibre": "Une pierre emballée dans des herbes. Joli paquet, mais inutile.",
    "assembler:caillou+manche": "Une pierre au bout d’un bâton… qui tombe dès que tu le lèves. Avec quoi tenait-elle, dans tes souvenirs ?",
    "tresser:bois+fibre": "Tu tresses des herbes autour d’une bûche. Trop grosse, trop raide : il faudrait un bois plus fin.",
    "tresser:caillou+fibre": "Tu emprisonnes une pierre dans un filet d’herbes. Te voilà avec un très joli presse-papier.",
    /* Âges de la Pierre et du Cuivre (écrites avec Gemini, relues : un échec ne prend jamais rien) */
    "tresser:argile": "Tu tentes de tresser des boudins d’argile. Ils collent à tes paumes et s’écrasent en bouillie.",
    "tailler:argile": "Tu donnes des coups de lame dans la motte d’argile. Chaque entaille se referme aussitôt.",
    "marteler:argile": "Tu abats ton marteau sur l’argile fraîche. Tu en reçois plein la figure, et la motte est juste un peu plus plate.",
    "tresser:silex": "Tresser du silex ? Tu t’abîmes les ongles sur les arêtes, et la pierre ne plie pas.",
    "chauffer:silex": "Le silex crépite dans la braise et lâche une esquille brûlante. Tu as failli y laisser un œil.",
    "marteler:silex": "Tu cognes le silex de toutes tes forces. Il s’écaille en poussière au lieu de se fendre nettement.",
    "tresser:sable": "Tu tentes de tresser du sable. Les grains coulent entre tes doigts, et le vent emporte le reste.",
    "tailler:sable": "Tailler du sable ? Ta lame passe au travers. Tu as juste déplacé un petit tas.",
    "marteler:sable": "Un grand coup de marteau dans le sable. Un nuage de poussière dans les yeux, et un cratère minuscule.",
    "tresser:eclat": "Tresser des éclats tranchants ? Tes doigts s’en souviendront longtemps.",
    "chauffer:eclat": "L’éclat rougit sur la braise et son fil se ternit. Tu le retires avant qu’il ne devienne cassant.",
    "marteler:eclat": "Tu frappes sur la lame de silex. Un éclat de plus vole à travers l’atelier, et elle n’en coupe pas mieux.",
    "tresser:brique": "Tu tentes de tresser de la terre cuite. La brique ne plie pas d’un millimètre. Tes doigts, si.",
    "tailler:brique": "Tu râpes la brique avec ta lame. Beaucoup de poussière rouge, et ta lame est émoussée.",
    "chauffer:brique": "La brique est déjà cuite. La remettre au feu ne sert à rien.",
    "marteler:brique": "Un coup sec sur la brique. Elle sonne, te renvoie le choc jusqu’au coude, et ne devient rien d’autre.",
    "tresser:engrenage_bois": "Tu tentes de tresser le rouage avec lui-même. Ses dents s’accrochent partout sauf là où tu veux.",
    "chauffer:engrenage_bois": "Le rouage se met à fumer, ses belles dents noircissent. Tu le retires du feu juste à temps.",
    "marteler:engrenage_bois": "Le bois craque sous le choc. Tu t’arrêtes avant qu’une dent ne saute.",
    "assembler:argile+sable": "Tu pétris l’argile et le sable à mains nues. Tu obtiens une boue rugueuse qui ne tient pas sa forme.",
    "assembler:argile+silex": "Tu enfonces le silex dans l’argile fraîche. Tes doigts répètent ce geste avec une certitude étrange, comme s’ils scellaient un caveau ancien.",
    "assembler:brique+manche": "Une brique au bout d’un bâton. Lourd, branlant, et la brique finit sur tes orteils.",
    "assembler:eclat+manche": "L’éclat posé sur le bois glisse dès que tu le lèves. Il faudrait un lien bien serré pour tenir la lame.",
    "tresser:malachite": "Tresser de la pierre verte ? Même ses veines les plus fines restent dures comme le roc.",
    "tailler:malachite": "Tu essaies de sculpter la pierre verte. Tes doigts esquissent un visage sous un casque rond, avant que la roche ne s’effrite.",
    "marteler:malachite": "Tu tapes sur le minerai vert. Au lieu de s’aplatir, il s’effrite en poussière d’émeraude.",
    "allier:malachite": "La malachite brute ne se mélange pas telle quelle. Il lui faut d’abord la chaleur d’un four, et du charbon.",
    "tresser:cassiterite": "Les cristaux sombres et lourds ne plient pas d’un pouce. Tes doigts se fatiguent pour rien.",
    "tailler:cassiterite": "La lame glisse sur les cristaux noirs sans même entamer leur surface.",
    "marteler:cassiterite": "Un grand coup de masse : la cassitérite crache des gravillons grisâtres, mais pas la moindre feuille.",
    "tresser:lingot_cuivre": "Tresser un bloc de métal rouge ? Même souple, il te tordrait les poignets avant de plier.",
    "tailler:lingot_cuivre": "Tailler le cuivre à la lame ne donne que des copeaux tordus. Pour lui donner forme, il vaut mieux le battre.",
    "chauffer:lingot_cuivre": "Le lingot rougeoie sur les braises. Sans moule où le couler, il refroidit tel qu’il était.",
    "tresser:plaque_cuivre": "Une feuille de métal ne se tresse pas : elle plisse, et ses coins te piquent les paumes.",
    "chauffer:plaque_cuivre": "La feuille de cuivre rougit et ondule sous la chaleur, comme une feuille morte. Puis elle refroidit, toute plate.",
    "marteler:plaque_cuivre": "Tu bats la plaque encore et encore. Elle s’étire un peu, et tu t’arrêtes avant de la percer.",
    "chauffer:fil_cuivre": "Le fil rougit d’un coup dans la flamme et commence à fondre par le milieu. Tu le retires avant qu’il ne parte en gouttes.",
    "marteler:fil_cuivre": "Tu martèles le fil de cuivre. Il s’aplatit en un ruban tout mou, que tu redresses tant bien que mal.",
    "assembler:fil_cuivre+manche": "Tu enroules le fil rouge autour du bois. Il brille au soleil, mais ne sert à rien.",
    "tresser:lingot_etain": "Tresser un lingot d’étain ? Il plie un peu en crissant, puis refuse d’aller plus loin.",
    "tailler:lingot_etain": "Le métal est tendre, mais le tailler au couteau ne laisse qu’un tas de rognures grises.",
    "chauffer:lingot_etain": "L’étain fond à toute vitesse et file entre les braises. Tu rattrapes l’essentiel avant qu’il ne se perde dans la cendre.",
    "marteler:lingot_etain": "Tu frappes l’étain sur la pierre. Il s’étale mollement en une galette terne et sans ressort.",
    "allier:cassiterite+malachite": "Deux minerais bruts dans le creuset ? Ils noircissent et s’encrassent sans jamais couler ensemble.",
    "assembler:lingot_cuivre+lingot_etain": "Tu poses le lingot rouge contre le lingot gris. Rien ne colle : pour les unir, il faut les fondre ensemble.",
    "assembler:engrenage_bois+lingot_cuivre": "Tu tentes d’emboîter le bois dans le métal. Un frisson te traverse : dans une autre vie, des machines bien plus grandes tournaient sous tes yeux."
  };
  /* le genre et le nombre des matières, pour les articles (le, la, l’, les) */
  D.GENRE = {
    f: "fibre caillou corde cabane torche galette cuir aiguille laniere colle_os fronde outre tunique flute statuette argile hache_pierre pioche_pierre brique nasse hutte malachite cassiterite enclume_pierre plaque_cuivre charbonniere lampe plaque_bronze hache_bronze pioche_bronze enclume_bronze roue courroies brouette loupe plaque_fer chainon galerie lentille lunette boussole brique_refr lame vis chaudiere presse_vapeur pompe scierie drague bobine dynamo batterie ampoule excavatrice foreuse_elec wafer puce cellule chaine foreuse capsule bauxite ilmenite terres_rares resine dynamite centrale carriere fibre_carbone ceramique fusee plateforme station_orbitale base_lunaire ia forge_stellaire matiere_exotique antimatiere bague philosophale resonite tablette partition",
    p: "fibre galette laniere collets nasse courroies brouette clous outils_fer vis outils_acier capteurs robots terres_rares convoyeurs debris"
  };

  D.TEMPS = [
    { n: "Froid", c: "#6aa8ff", m: "Rien ne se passe. Pas avec ça, pas pour l’instant." },
    { n: "Frais", c: "#7fd8f5", m: "Une de ces ressources cache encore une recette, avec une autre action ou d’autres ressources." },
    { n: "Tiède", c: "#ffd36b", m: "Cette action et ces ressources vont ensemble. Cherche encore." },
    { n: "Chaud", c: "#ff9a3c", m: "Tu y es presque !" },
    { n: "Brûlant", c: "#ff4a3c", m: "C’est la bonne combinaison !" }
  ];

  /* ------------------------------------------------------------ TERMINAL */
  D.TERMINAL = {}; // js/recit.js

  /* -------------------------------------------------------------- INTRO */
  D.INTRO = [
    "Tu te réveilles dans l’herbe, au bord d’une forêt. Tu ne te souviens de rien, même pas de ton nom.",
    "Tu regardes autour de toi. Tu ramasses un morceau de bois par terre et commences à l’écorcer.",
    "Un sourire naît au coin de tes lèvres : oui, ça, tu t’en souviens."
  ];

  /* ===== VISITEURS DE PASSAGE (début) =====
   * Quelqu'un ou quelque chose traverse le Domaine, de loin en loin. On le touche : un petit lot.
   * Calendrier en secondes de jeu actif (S.stats.play), jamais hors ligne.
   * lot.secondes : secondes de récolte à la main que vaut la matière ; objet, page, clin : chances.
   * tps : parties de la journée (nuit avant 6 h ou dès 21 h, aube avant 8 h, crépuscule dès 18 h, sinon jour).
   * terres : liste de terres, ou absent pour toutes (le Domaine seulement, jamais les lieux sans ciel).
   * pg : peut donner une page du Livre que le Comptoir vend (très rare).
   * clin : phrase complice, sans nom propre réel (voir docs/coffre/EASTER.md). */
  D.VISITEURS = {
    delai: [480, 1200],
    traversee: 12,
    lot: { secondes: 90, intu: 1, objet: 0.08, page: 0.02, clin: 0.03 },
    liste: [
      { id: "oiseau", ic: "🐦", n: "un oiseau", tps: ["day", "dawn", "dusk"], w: 3,
        t: "Un oiseau laisse tomber quelque chose." },
      { id: "papillon", ic: "🦋", n: "un papillon", tps: ["day"], terres: ["lisiere", "plaine", "riviere", "collines"], w: 2,
        t: "Un papillon se pose sur ta main, puis repart." },
      { id: "luciole", ic: "", css: "luciole", n: "une luciole", tps: ["night"], terres: ["lisiere", "plaine", "riviere", "collines", "desert"], w: 3,
        t: "La luciole tourne autour de ta main.",
        clin: "La luciole crie « Hé ! Écoute ! » d’une toute petite voix, puis repart, très contente d’elle." },
      { id: "colporteur", ic: "🎒", n: "un colporteur", tps: ["day", "dusk"], terres: ["plaine", "riviere", "collines", "desert", "montagnes"], w: 2, pg: true,
        t: "Le colporteur te tend un petit paquet et repart sans rien demander.",
        clin: "Le colporteur te tend un bâton : « C’est dangereux d’y aller seul. » Puis il le reprend : « Non, il est pour le suivant. »" },
      { id: "renard", ic: "🦊", n: "un renard", tps: ["dawn", "dusk", "night"], terres: ["lisiere", "plaine", "collines", "montagnes"], w: 2,
        t: "Un renard file entre tes pieds.",
        clin: "Un renard s’enroule en boule et file. Quelque part, des anneaux tintent." },
      { id: "chauve", ic: "🦇", n: "une chauve-souris", tps: ["dusk", "dawn"], w: 2,
        t: "Une chauve-souris te frôle la tête.",
        clin: "La chauve-souris passe devant la lune. Un instant, tu entends un orgue, très loin." }
    ],
    txt: {
      aria: "{n} passe. Touche pour voir.",
      page: "Il te laisse aussi une page du Livre."
    }
  };
  /* ===== VISITEURS DE PASSAGE (fin) ===== */

  /* Scènes d’éveil des Semeurs (cycles 2 et suivants) */
  D.EVEILS = {}; // js/recit.js

  /* ------------------------------------------------ EXPÉDITIONS LONGUES (fouilles)
   * Un lieu déjà exploré se fouille de nouveau, en trois niveaux de plus en plus longs, hors ligne.
   * s : durée en secondes ; taps : le butin vaut autant d’appuis de récolte à la main (qui suivent la
   * puissance du joueur : l’outil, la Mémoire, la règle de la terre) pour chaque ressource de la terre ;
   * intu : l’Intuition de la première fois. Le niveau n+1 demande d’avoir fini le niveau n. */
  D.FOUILLE = {
    niveaux: [
      { n: "Un tour", s: 1800, taps: 120, intu: 1 },
      { n: "Une fouille", s: 7200, taps: 600, intu: 2 },
      { n: "Tout retourner", s: 28800, taps: 2400, intu: 4 }
    ]
  };

  root.ECLAT_DATA = D;
  if (typeof module !== "undefined" && module.exports) module.exports = D;
  if (typeof require !== "undefined") {
    try { require("./recit.js"); } catch (_) {}
  }
})(typeof window !== "undefined" ? window : globalThis);
