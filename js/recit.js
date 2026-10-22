/* Éclat : le récit (versions 6.0, « Le Livre », et 6.1, « Les signes »).
 * COFFRE : ce fichier contient des textes du récit. L’auteur du jeu ne le lit pas.
 * Source de vérité : docs/coffre/BIBLE.md, SECRETS.md, TEXTES.md.
 *
 * Contenu de la 6.0 :
 * - 12 pages du Livre des Semeurs (sources : explorations, premières réparations, Comptoir) ;
 * - les fragments neufs des quatre premières terres, avec leurs revisites ;
 *   les anciens sont archivés (cachés, gardés dans les sauvegardes) ;
 * - les questions dont toute la chaîne d’aide existe déjà dans le jeu.
 * Contenu de la 6.1 : les huit premiers signes (D.RECIT.signes) ; les inscriptions des
 * textes déjà en place, plus un signe sous les pochoirs de la Grotte ; les lectures en
 * français des lignes entièrement comprises ; les signes de l’interface ; la signature de Léon.
 *
 * Jetons de signes : [main] [machine] [faire] [dabord] [nepas] [dormir] [eveiller]
 * [enfant] [revenir] [halte] [manquer] [nourrice] [relais] [nous].
 * Signatures (sig) : les six morts signent de traits (I à IIIII I) ; les vivants d’un
 * dessin (Hélie ❧, Kenza □, Léon : son signe, dessiné comme un jeton).
 * Enfant du cycle c : cuve 7 + ((c − 1) mod 6) ; Hélie = cycle 2, Kenza = 5, Léon = 6.
 *
 * Volontairement absent en 6.0 (mécaniques ou lieux pas encore là, pas de cul-de-sac) :
 * pages 8, 11, 13, 22, 23, 24, 26 (et toutes celles des terres suivantes) ;
 * revisite du Sommet vers le Replat, sillons de la Carcasse vers la Plaine (6.4, en revisite) ;
 * questions autres que q_lune. Le Cercle de Pierres garde son fragment (inchangé). */
(function (root) {
  "use strict";

  const D = root.ECLAT_DATA || (typeof require !== "undefined" ? require("./data.js") : null);
  if (!D) return;

  D.RECIT = {
    /* ------------------------------------------------------------ LE LIVRE */
    pages: {
      p01: {
        n: 1,
        titre: "Sous le grand arbre",
        imprime: "En haut de la page, deux signes : [enfant] [eveiller].\n\nDessous, un dessin : un enfant assis dans l’herbe se frotte les yeux. Derrière lui, un grand arbre.",
        notes: [
          { t: "Trouvée entre les racines. Les numéros vont jusqu’à 32. Elle dit que je suis le premier. J’ai fait un trait sur l’arbre, pour que le deuxième la croie.", sig: "I" },
          { t: "ELLE NE M’A RIEN DIT.", sig: "II" }
        ],
        src: [{ k: "exp", at: "lisiere:chene" }]
      },
      p02: {
        n: 2,
        titre: "Le feu",
        imprime: "Un dessin : un archet tendu sur un bâton, du bois sec, des cailloux posés en cercle. Une flèche va des mains jusqu’au feu.\n\nDans le coin, un signe : [faire].",
        notes: [
          { t: "Du premier coup.", sig: "III" },
          { t: "Fais confiance à tes mains.", sig: "IIIII" }
        ],
        src: [{ k: "repair", id: "cabane" }]
      },
      p03: {
        n: 3,
        titre: "Les mains",
        imprime: "Des mains dessinées en rangs : vingt-quatre grandes, puis douze petites.\n\nSous les grandes : [nous]. Sous les petites : [enfant].",
        notes: [
          { t: "Compté : vingt-quatre et douze. Nous sommes douze ?", sig: "I" }
        ],
        src: [{ k: "exp", at: "lisiere:grotte" }]
      },
      p04: {
        n: 4,
        titre: "Manger",
        imprime: "Un dessin : des herbes posées sur une braise. Dessous, en petites lettres : « Si vous avez faim. » Et un signe : [manquer].\n\nÀ côté, les mêmes herbes, crues, barrées d’un trait : [nepas].",
        notes: [
          { t: "Je n’ai jamais faim. Compté : quarante et un jours.", sig: "I" },
          { t: "Personne.", sig: "IIIII I" }
        ],
        src: [{ k: "buy", ecus: 150 }]
      },
      p05: {
        n: 5,
        titre: "L’eau",
        imprime: "Un dessin : une source sort d’entre deux pierres. Une outre de peau, pleine, fermée par une lanière. Une flèche va de l’une à l’autre.\n\nDans le coin, un signe : [faire].",
        notes: [
          { t: "J’ai caché une outre pleine sous la pierre plate du Gué. Si tu la trouves, laisse-la.", sig: "❧", cond: { cycle: 2 } }
        ],
        src: [{ k: "exp", at: "riviere:gue" }]
      },
      p06: {
        n: 6,
        titre: "Les outils",
        imprime: "Un manche, une corde, un épieu, chacun dessiné dans la main qui le tient. Dans le coin, un signe : [faire].\n\nTout en bas, plus petit : un éclat de silex tourné vers une poitrine, barré d’un trait, et un signe : [nepas].",
        notes: [
          { t: "TOUT ÇA, ELLE LE SAIT DÉJÀ. POURQUOI NOUS ?", sig: "II" }
        ],
        src: [{ k: "repair", id: "collets" }]
      },
      p07: {
        n: 7,
        titre: "Le cercle",
        imprime: "Une carte de la Lisière : la forêt, la rivière en bas, le grand arbre marqué d’une croix. Sous les arbres, cinq points en cercle.\n\nAu-dessus, un cerf-volant. Une ligne pointillée descend de lui jusqu’au cercle.",
        notes: [
          { t: "(un cerf-volant, dessiné de travers)\nMaman en faisait avec deux bâtons et une peau.", sig: "III" }
        ],
        src: [{ k: "buy", ecus: 300 }]
      },
      p10: {
        n: 10,
        titre: "La paume levée",
        imprime: "Un dessin : une grande paume ouverte, levée. À ses pieds, des machines couchées sur le flanc.\n\nDessous, deux lignes de signes :\n[machine] [nepas] [faire] · [main] [faire] [dabord]\n[main] [halte] · [machine] [dormir]",
        notes: [
          { t: "ILLISIBLE.", sig: "II" },
          { t: "[machine] [nepas] [faire] · [main] [faire] [dabord]\n[main] [halte] · [machine] [dormir]", sig: "[eveiller]", cond: { cycle: 6 } }
        ],
        src: [{ k: "exp", at: "plaine:tumulus" }]
      },
      p12: {
        n: 12,
        titre: "La porte",
        imprime: "Une carte des galeries, sous les collines. Tout au fond, une porte dessinée avec soin, sans poignée. Au bas de la page : [enfant] [dormir].\n\nDans la marge, un petit dessin : une aiguille posée sur une galette d’argile. Elle penche vers la porte.",
        notes: [
          { t: "La porte n’aime que l’aimant.", sig: "IIIII I" }
        ],
        src: [{ k: "exp", at: "mine:filon" }]
      },
      p14: {
        n: 14,
        titre: "Les petits points",
        imprime: "Un dessin : deux mains taillent un bâton. Tout autour, des petits points, serrés comme des moucherons.\n\nDans le coin, un signe : [machine].",
        notes: [
          { t: "Elles regardent. Elles ne touchent rien.", sig: "I" }
        ],
        src: [{ k: "repair", id: "automate_bois" }]
      },
      p15: {
        n: 15,
        titre: "Les machines",
        imprime: "Des machines dessinées côte à côte : une roue, un bras, une presse. Chacune porte le même signe, [machine].\n\nSous chacune, une main dessinée en pointillés.",
        notes: [
          { t: "Hypothèse : chaque machine attend un geste.", sig: "□", cond: { cycle: 5 } }
        ],
        src: [{ k: "exp", at: "riviere:carcasse" }]
      },
      p16: {
        n: 16,
        titre: "Compter",
        imprime: "Des traits alignés, de un à douze. Sous chaque groupe, autant de points.",
        notes: [
          { t: "Enfin quelque chose que je sais lire.", sig: "I" }
        ],
        src: [{ k: "exp", at: "collines:sommet" }]
      }
    },

    /* ------------------------------------------------- FRAGMENTS (6.0) */
    frags: {
      chene2: {
        n: "Six traits", z: "lisiere",
        t: "Dans l’écorce du plus vieil arbre de la Lisière, quelqu’un a gravé six traits. L’écorce a presque refermé les premiers. Un septième est à peine commencé.\n\nTu poses tes doigts dans les entailles : ils ont exactement la bonne largeur.\n\nEntre deux racines, une feuille épaisse, pliée en quatre. Des dessins, des signes, et dans un coin, un chiffre : 1.",
        revisit: [
          { cond: { cycle: 2 }, t: "Six traits, et le septième, toujours à peine commencé.\n\nAu pied du tronc, l’herbe garde la forme de quelqu’un d’assis. Deux sillons partent de là, bien droits, vers les collines.\n\nTu cherches un corps. Il n’y en a pas." }
        ]
      },
      grotte2: {
        n: "La Grotte aux Mains", z: "lisiere",
        t: "Des mains au pochoir, ocre et noires, en rangs bien droits : vingt-quatre grandes, puis douze petites. Au bout de chaque rang, peint en noir, le même signe : [main]. Sous les grandes, un autre : [nous].\n\nPlus haut, des canots de feu montent vers une lueur rouge ; d’autres en reviennent, sous [nous] [revenir] [enfant]. Plus bas, des silhouettes couchées, les yeux fermés : [dormir]. Au-dessus de tout, une grande paume levée : [halte].\n\nPrès de l’entrée, des os percés de petits trous sont alignés sur une pierre plate. Quand le vent souffle, ils chantent.",
        revisit: [
          { cond: { cycle: 2 }, t: "Tu recomptes : vingt-quatre grandes mains, douze petites, aucune de plus.\n\nTu approches ta paume d’une petite main, sans toucher la peinture. Même largeur, à un doigt près." }
        ]
      },
      ossements2: {
        n: "Le Champ des Os", z: "plaine",
        t: "Des os de bêtes énormes, blanchis par le soleil. Au milieu, six squelettes plus petits, humains, couchés sur le dos, les mains croisées sur la poitrine. Chacun serre un éclat de silex dans son poing.\n\nÀ la tête de chacun, une pierre plate porte le même signe, [enfant], et des traits : un, deux, trois, jusqu’à six.\n\nLe sixième est le plus récent. Il a encore toutes ses dents. Sur une côte, à gauche, une entaille nette.",
        revisit: [
          { cond: { cycle: 2 }, t: "Tu comptes encore. Six. Personne n’a couché de septième ici." }
        ]
      },
      tumulus2: {
        n: "La Plaque du Tumulus", z: "plaine",
        t: "Sous la butte, une plaque de métal que la rouille n’a pas touchée. Deux lignes de signes :\n\n[machine] [nepas] [faire] · [main] [faire] [dabord]\n\n[main] [halte] · [machine] [dormir]\n\nSous la seconde ligne, gravée plus profond, une main ouverte, levée. À ses pieds, des machines couchées.",
        revisit: [
          { cond: { cycle: 2 }, t: "La plaque n’a pas bougé. Tu passes le doigt sur la main levée : à cet endroit, le métal est plus lisse qu’ailleurs.\n\nD’autres doigts sont passés là avant les tiens." }
        ]
      },
      gue2: {
        n: "Le Galet Percé", z: "riviere",
        t: "Au milieu du gué, un galet bien rond, poli par le sable comme un miroir. Il est percé d’un trou si net que l’eau n’a pas pu le creuser seule.\n\nTu regardes au travers. Sur l’autre rive, sous la mousse, un angle trop droit pour être naturel : une marche, puis d’autres, qui descendent dans la rivière.",
        revisit: [
          { cond: { cycle: 2 }, t: "Tu te penches sur le galet. Dans le poli, un bout de visage, flou, que tu ne reconnais pas.\n\nLe tien, sans doute." }
        ]
      },
      carcasse2: {
        n: "La Carcasse", z: "riviere",
        t: "Une machine énorme, à moitié enterrée dans la berge. Six roues, un bras replié comme la patte d’un insecte mort. Sur son flanc, sous le numéro 12 :\n\n[machine] · [enfant] [dormir]\n\n[machine] [nepas] [faire] · [main] [faire] [dabord]\n\nDans sa pince, un squelette d’oiseau minuscule, posé avec soin.",
        revisit: [
          { cond: { cycle: 2 }, t: "Tu essaies d’ouvrir la pince pour prendre l’oiseau. Elle ne cède pas.\n\nElle serre juste assez pour le tenir, sans l’écraser." }
        ]
      },
      rails2: {
        n: "Le Wagonnet", z: "collines",
        t: "Deux barres de métal rouillé, parallèles, montent à flanc de colline. À mi-pente, un wagonnet chargé de pierres vertes s’est arrêté net.\n\nRien ne le retient : ni cale, ni frein, ni pierre sous les roues. La mousse a poussé sur son chargement.",
        revisit: [
          { cond: { cycle: 2 }, t: "Tu pousses le wagonnet de tout ton poids. Il ne bouge pas.\n\nTu le lâches, en pleine pente : il ne roule pas non plus." }
        ]
      },
      vue2: {
        n: "La Vue du Sommet", z: "collines",
        t: "Du sommet, tu vois des tours à l’horizon, brisées, couvertes de lierre, plus hautes que les collines. Pas une fumée.\n\nDans les rochers traîne une tablette de pierre gravée de cercles, avec des encoches pour des roues dentées qui n’existent plus. Des roues dorées, peut-être.\n\nSur la tranche, d’autres encoches, plus fraîches, grattées à la pointe d’un silex par groupes de cinq. Quarante et une.",
        revisit: [
          { cond: { cycle: 2 }, t: "D’ici, tu vois toute la Lisière, et le Grand Chêne, tout petit.\n\nEntre l’arbre et les collines, deux lignes plus pâles traversent l’herbe, bien droites." }
        ]
      }
    },

    /* anciens fragments remplacés : cachés du Journal, gardés dans les sauvegardes */
    archive: ["chene", "grotte", "ossements", "tumulus", "galet", "carcasse", "rails", "vue"],

    /* les explorations des quatre premières terres donnent désormais les fragments neufs */
    expFrag: {
      "lisiere:chene": "chene2",
      "lisiere:grotte": "grotte2",
      "plaine:champ_os": "ossements2",
      "plaine:tumulus": "tumulus2",
      "riviere:gue": "gue2",
      "riviere:carcasse": "carcasse2",
      "collines:rails": "rails2",
      "collines:sommet": "vue2"
    },

    /* ------------------------------------------------------- QUESTIONS */
    questions: {
      q_lune: {
        titre: "La lumière sur la Lune",
        /* le Ciel est ouvert : la petite lumière clignote sur la Lune */
        quand: { any: [{ has: "anticythere" }, { has: "lunette" }, { has: "radiotelescope" }] },
        aides: [
          "Regarde longtemps la Lune.",
          "Touche-la plusieurs fois.",
          "Touche-la sept fois."
        ],
        resolu: { secret: "lune7" }
      }
    },

    aide: { base: 5, mult: 3 },

    /* ------------------------------------------------- SIGNES (6.1)
     * h : les trois hauteurs du dessin (1 en bas, 5 en haut), de gauche à droite.
     * mot : ce qui s’affiche une fois le signe compris.
     * ok : empreintes (E.empreinte) des réponses acceptées, jamais en clair ici.
     * Les six autres jetons des textes restent volontairement neutres (◇) : leurs
     * signes arrivent en 6.4, avec les lieux qui permettent de les comprendre. */
    signes: {
      main: { h: [3, 5, 3], mot: "main", ok: ["ea90e208", "bd1487a1", "3c3adfff"] },
      machine: { h: [2, 4, 2], mot: "machine", ok: ["e103566e", "55408fa7", "b18a6abb", "44e618d8"] },
      faire: { h: [1, 2, 3], mot: "faire", ok: ["d9340f62", "f9ac53d6", "065361a5", "56039ae0", "eecd44f4"] },
      dabord: { h: [1, 5, 1], mot: "d’abord", ok: ["b52be429", "8909aa1f", "34375e0e", "31c8d987"] },
      nepas: { h: [4, 4, 1], mot: "ne pas", ok: ["2fb1a5fc", "9c3f2b4c", "64560ffb", "e75d20eb", "f0452a17", "fcbe6b42"] },
      dormir: { h: [5, 3, 1], mot: "dormir", ok: ["d1e9849a", "25c1e212", "05421d02", "b780af11", "883fc275"] },
      eveiller: { h: [1, 3, 5], mot: "éveiller", ok: ["524e118b", "beef7b9b", "f432ff78", "75a2b188", "1867a541"] },
      enfant: { h: [2, 3, 2], mot: "enfant", ok: ["8abf1c15", "d0d9b492", "b9f8ac53", "e276f660"] }
    },

    /* Lectures : la phrase en français sous une ligne de signes, affichée seulement quand
     * tous les signes de la ligne sont compris. fr est brouillé (base64) : un coup d’œil au
     * fichier ne donne pas le sens des signes. Seulement les lignes faites de signes de la 6.1. */
    lectures: [
      { l: "[machine] [nepas] [faire] · [main] [faire] [dabord]", fr: "QXVjdW5lIG1hY2hpbmUgbmUgZmFpdCBwb3VyIHVuZSBtYWluIGNlIHF1ZSBjZXR0ZSBtYWluIG7igJlhIHBhcyBmYWl0IGTigJlhYm9yZC4=" },
      { l: "[machine] · [enfant] [dormir]", fr: "Q2VsbGUgcXVpIGNvdWNoZSBsZXMgZW5mYW50cy4=" },
      { l: "[enfant] [eveiller]", fr: "UG91ciBs4oCZZW5mYW50IHF1aSBz4oCZw6l2ZWlsbGUu" }
    ],

    /* Les signes de l’interface et des scènes (rendus par ui.js et domaine.js) :
     * eveil, en tête de chaque éveil (cycle 2 et suivants) ; fabriquer, sur le gros bouton
     * de l’Atelier ; comptoir, à l’ouverture du Comptoir. L’ornement des scènes racontées
     * (clé « ornement », avec « fins ») et le signe près de la relève arrivent en 6.4. */
    interface: {
      eveil: { t: "[eveiller]" },
      fabriquer: { t: "[faire]" },
      comptoir: { cond: { cycle: 2 }, t: "« Encore toi. Pose ta main là. »\nIl tape du doigt sur le bois du comptoir. À cet endroit, le bois est creusé, usé par les paumes, et un signe y est gravé : [main]" }
    }
  };

  if (D.FRAGS && D.RECIT.frags) {
    Object.assign(D.FRAGS, D.RECIT.frags);
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = D.RECIT;
  }
})(typeof window !== "undefined" ? window : globalThis);
