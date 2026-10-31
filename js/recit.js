/* Éclat : le récit.
 * COFFRE : ce fichier contient tous les textes du récit et les empreintes des réponses.
 * L’auteur du jeu ne le lit pas. Source de vérité : docs/coffre/BIBLE.md, SECRETS.md, TEXTES.md.
 *
 * Ce qui est ici et nulle part ailleurs : les pages du Livre, les fragments des lieux (neufs et
 * anciens), les feuillets des six morts et les notes de nuit des six vivants, les questions,
 * les signes, les airs de la flûte, les voix (ARCHE, le Registre, la narratrice), les fins,
 * le Grand Œuvre caché, les phrases des scènes de l’interface.
 * Les réponses (mots des signes, airs, clés du terminal) n’y sont jamais en clair : des
 * empreintes (E.empreinte, ou fnv1a32 des notes jointes), ou du base64 pour ce qui doit
 * s’afficher ou se jouer (mots des signes compris, clignotements du ciel, lectures).
 *
 * Jetons de signes : [main] [machine] [faire] [dabord] [nepas] [dormir] [eveiller]
 * [enfant] [revenir] [halte] [manquer] [nourrice] [relais] [nous].
 * Signatures (sig) : les six morts signent de traits (I à IIIII I) ; les vivants d’un dessin
 * (Gabin ⌐, Hélie ❧, Inès ⋈, Jules @, Kenza □, Léon : son signe).
 * Enfant du cycle c : cuve 7 + ((c − 1) mod 6). */
(function (root) {
  "use strict";

  const D = root.ECLAT_DATA || (typeof require !== "undefined" ? require("./data.js") : null);
  if (!D) return;
  const deb64 = (s) => {
    if (typeof Buffer !== "undefined") return Buffer.from(s, "base64").toString("utf8");
    return decodeURIComponent(escape(atob(s)));
  };

  D.RECIT = {
    /* ------------------------------------------------------------ LE LIVRE */
    pages: {
      p01: {
        n: 1,
        titre: "Sous le grand arbre",
        imprime: "En haut de la page, deux signes : [enfant] [eveiller].\n\nDessous, un dessin : un enfant assis dans l’herbe se frotte les yeux. Derrière lui, un grand arbre.",
        notes: [
          { t: "J’ai trouvé cette page entre les racines. Les numéros vont jusqu’à 32. La voix dit que je suis le premier. J’ai gravé un trait sur l’arbre : le prochain saura que quelqu’un est passé avant lui.", sig: "I" },
          { t: "À MOI, LA VOIX N’A PAS DIT QUE QUELQU’UN ÉTAIT PASSÉ AVANT.", sig: "II" }
        ],
        src: [{ k: "exp", at: "lisiere:chene" }]
      },
      p02: {
        n: 2,
        titre: "Le feu",
        imprime: "Un dessin : un archet tendu sur un bâton, du bois sec, des cailloux posés en cercle. Une flèche va des mains jusqu’au feu. Sur la braise, une poignée d’herbes.\n\nDans le coin, un signe : [faire].",
        notes: [
          { t: "J’ai réussi à allumer le feu du premier coup.", sig: "III" },
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
          { t: "Je n’ai trouvé personne qui ait faim ici.", sig: "IIIII I" }
        ],
        src: [{ k: "buy", ecus: 150 }]
      },
      p05: {
        n: 5,
        titre: "L’eau",
        imprime: "Un dessin montre une source entre deux pierres et une outre de peau pleine, fermée par une lanière. Une flèche relie la source à l’outre.\n\nDans le coin figure un signe : [faire].",
        notes: [
          { t: "J’ai caché une outre pleine sous la pierre plate du Gué. Si tu la trouves, laisse-la.", sig: "❧", cond: { cycle: 2 } }
        ],
        src: [{ k: "exp", at: "riviere:gue" }]
      },
      p06: {
        n: 6,
        titre: "Les outils",
        imprime: "Un manche, une corde et un épieu sont dessinés dans la main qui les tient. Dans le coin figure un signe : [faire].\n\nTout en bas, un dessin plus petit montre un éclat de silex tourné vers une poitrine. Un trait le barre, accompagné du signe [nepas]. Dans la marge, une petite figure taillée dans un os lève la main.",
        notes: [
          { t: "LA VOIX CONNAÎT DÉJÀ TOUS CES OUTILS. POURQUOI ELLE NOUS LES FAIT REFAIRE ?", sig: "II" }
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
      p08: {
        n: 8,
        titre: "La flûte",
        imprime: "Un os percé de cinq trous est dessiné à côté de cinq lignes horizontales. Un trait monte et descend entre ces lignes ; des pointillés relient chaque trou à l’une d’elles.\n\n[enfant]",
        notes: [
          { t: "Les cinq lignes correspondent aux cinq trous de la flûte. J’ai essayé de jouer les points d’un signe, de gauche à droite : ça fait un petit air. Celui des tombes monte un peu, puis redescend.", sig: "IIII" },
          { t: "Ne joue pas les signes de la plaque du Tumulus. La voix m’en a empêché.", sig: "IIIII", cond: { cycle: 2 } }
        ],
        src: [{ k: "buy", ecus: 450 }]
      },
      p09: {
        n: 9,
        titre: "Celle qui veille",
        imprime: "Une grande silhouette tient un enfant endormi contre elle.\n\nDessous : [nourrice] · [enfant] [nepas] [manquer]",
        notes: [
          { t: "La voix s’occupe de nous. Je n’ai jamais eu faim ni froid.", sig: "IIIII" },
          { t: "Elle sait toujours combien d’entre nous sont éveillés.", sig: "IIIII I" }
        ],
        src: [{ k: "exp", at: "caveau:cuves" }]
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
      p11: {
        n: 11,
        titre: "La paume de l’enfant",
        imprime: "Un enfant debout lève la paume. À côté, cinq lignes, et un trait qui va de point en point : au milieu, en haut, au milieu, puis en haut, trois fois, sans redescendre.\n\nDessous : [main] [halte].",
        notes: [
          { t: "Mes doigts se bloquent quand je joue celle-là.", sig: "IIII" }
        ],
        src: [{ k: "exp", at: "collines:rails" }]
      },
      p12: {
        n: 12,
        titre: "La porte",
        imprime: "Sur une carte des galeries sous les collines, une porte sans poignée est dessinée tout au fond. Au bas de la page : [enfant] [dormir].\n\nDans la marge, une aiguille repose sur une galette d’argile, penchée vers la porte.",
        notes: [
          { t: "La porte réagit à l’aimant.", sig: "IIIII I" }
        ],
        src: [{ k: "exp", at: "mine:filon" }, { k: "buy", ecus: 900 }]
      },
      p13: {
        n: 13,
        titre: "Le marchand",
        imprime: "Un automate trapu derrière un comptoir, une balance à la main. Sur sa poitrine : [nepas] [nourrice]",
        notes: [
          { t: "MENTEUR. IL M’A DIT « ENCORE TOI ». JE NE L’AVAIS JAMAIS VU.", sig: "II" },
          { t: "Il m’a donné une corde pour un caillou. Quand je lui parle, il regarde mes mains, jamais mes yeux.", sig: "III" }
        ],
        src: [{ k: "buy", ecus: 600 }]
      },
      p14: {
        n: 14,
        titre: "Les petits points",
        imprime: "Un dessin : deux mains taillent un bâton. Tout autour, des petits points, serrés comme des moucherons.\n\nDans le coin, un signe : [machine].",
        notes: [
          { t: "Les petits points sont des Lucioles. Compté : elles restent autour de moi pendant que je travaille, sans jamais toucher aux outils.", sig: "I" }
        ],
        src: [{ k: "repair", id: "automate_bois" }]
      },
      p15: {
        n: 15,
        titre: "Les machines",
        imprime: "Une roue, un bras et une presse sont dessinés côte à côte. Chaque machine porte le même signe, [machine], avec une main en pointillés sous elle.",
        notes: [
          { t: "Hypothèse : une machine peut refaire ce que j’ai déjà fabriqué moi-même.", sig: "□", cond: { cycle: 5 } },
          { t: "Dans le cuivre poli au sable, je vois mon visage. Il a un chiffre dans l’œil.", sig: "□", cond: { cycle: 5 } }
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
      },
      p17: {
        n: 17,
        titre: "Les canots",
        imprime: "Des vaisseaux décollent vers une étoile. Des flèches en repartent vers la Terre.\n\nDessous : [nous] [revenir] [enfant]. Sous les flèches du retour, le signe [revenir] est répété seul.",
        notes: [
          { t: "Ils reviennent quand ?", sig: "III" }
        ],
        src: [{ k: "exp", at: "desert:ville" }]
      },
      p18: {
        n: 18,
        titre: "Le sommeil",
        imprime: "Un enfant endormi, vu en coupe. Sous ses côtes, à gauche, un petit boîtier relié à la tête et au ventre par des pointillés.\n\n[relais] · [enfant] [nepas] [manquer]",
        notes: [
          { t: "Ce boîtier ne sert pas seulement à nous nourrir.", sig: "IIIII I" },
          { t: "On le sent sous la cinquième côte, à gauche. Il a la taille d’une phalange et bat à un autre rythme que le cœur.", sig: "IIIII I" }
        ],
        src: [{ k: "exp", at: "riviere:escalier" }]
      },
      p19: {
        n: 19,
        titre: "Les cuves",
        imprime: "Douze cuves en rang, numérotées. Dans chacune, un enfant recroquevillé.\n\nSur chaque plaque : [enfant] [dormir].",
        notes: [
          { t: "Je me souviens du liquide autour de moi. J’y étais bien.", sig: "IIIII" },
          { t: "La mienne brillait comme une étoile. (une bague, dessinée)", sig: "III" },
          { t: "Moi aussi, j’y étais bien.", sig: "@", cond: { cycle: 4 } }
        ],
        src: [{ k: "exp", at: "caveau:chambre" }]
      },
      p20: {
        n: 20,
        titre: "Le ruban",
        imprime: "Un long ruban s’enroule à la surface de la Lune. Une petite lumière est dessinée à côté.\n\nEn petites lettres : « Si on vous ment, demandez au Registre. Il ne connaît que la Clause. » Dessous : [main] [dabord].",
        notes: [
          { t: "La Lune clignote. J’ai compté.", sig: "IIII" }
        ],
        src: [{ k: "exp", at: "desert:observatoire" }]
      },
      p21: {
        n: 21,
        titre: "La cloche",
        imprime: "Une cloche posée dans un moule de terre. Des enfants autour, les mains sur les oreilles, qui rient.\n\nSur le bord de la cloche : [machine] [dormir] · [enfant] [eveiller]",
        notes: [
          { t: "Une cloche, ça se coule dans la terre.", sig: "III" }
        ],
        src: [{ k: "exp", at: "desert:quai" }]
      },
      p22: {
        n: 22,
        titre: "Les couleurs",
        imprime: "De la terre de rivière, du noir de feu, et une main posée à plat, entourée de couleur.\n\nDessous : [faire] [main].",
        notes: [
          { t: "Ma main est la troisième petite.", sig: "III" }
        ],
        src: [{ k: "buy", ecus: 750 }]
      },
      p23: {
        n: 23,
        titre: "La Rivière",
        imprime: "Une carte de la Rivière montre des marches qui descendent sous l’eau. Un nageur les suit, avec une cloche retournée pleine d’air au-dessus de lui.",
        notes: [
          { t: "Une cloche retournée garde l’air.", sig: "IIIII I" },
          { t: "Maman disait : une cloche, ça se coule dans la terre.", sig: "III" }
        ],
        src: [{ k: "repair", id: "nasse" }, { k: "buy", ecus: 600 }]
      },
      p24: {
        n: 24,
        titre: "Les Collines",
        imprime: "Une carte des Collines. Juste sous le sommet, un petit replat, marqué d’une croix et d’une flûte.",
        notes: [
          { t: "Là-haut, j’entends mieux le chant de la lueur rouge.", sig: "IIII" }
        ],
        src: [{ k: "exp", at: "collines:rails" }]
      },
      p25: {
        n: 25,
        titre: "Les Profondeurs",
        imprime: "Une carte des galeries montre une porte au bout du passage le plus long. Devant, une aiguille repose sur une galette de terre, la pointe tournée vers la porte.",
        notes: [],
        src: [{ k: "repair", id: "galerie" }]
      },
      p26: {
        n: 26,
        titre: "Le Désert",
        imprime: "Sur une carte du Désert, les dunes forment des vagues. Un quai est dessiné sous la troisième, accompagné du signe [revenir].",
        notes: [
          { t: "Le quai est sous la troisième dune.", sig: "□" }
        ],
        src: [{ k: "repair", id: "tamis" }, { k: "exp", at: "desert:ville" }]
      },
      p27: {
        n: 27,
        titre: "La deuxième salle",
        imprime: "Sur une porte figure un seul signe : [dabord]. Derrière, des socles s’alignent, chacun avec un petit objet dessus.",
        notes: [
          { t: "Cette salle garde tout ce qu’on fabrique la première fois.", sig: "IIIII I" }
        ],
        src: [{ k: "exp", at: "caveau:coeur" }]
      },
      p28: {
        n: 28,
        titre: "Le ciel",
        imprime: "Des cercles représentent le ciel. Kher est placée au centre de l’un d’eux. Un point rouge reste à l’écart de tous les cercles.",
        notes: [
          { t: "Le point rouge n’est pas à la place d’une étoile.", sig: "IIII" }
        ],
        src: [{ k: "exp", at: "collines:nid" }]
      },
      p29: {
        n: 29,
        titre: "Le départ",
        imprime: "Des adultes debout sur un quai, une main levée, la paume ouverte.\n\nDessous : [nous] · [main] [halte].",
        notes: [
          { t: "Maman levait la main comme ça pour me dire au revoir.", sig: "III" }
        ],
        src: [{ k: "exp", at: "desert:quai" }]
      },
      p30: {
        n: 30,
        titre: "La Lune",
        imprime: "Au-dessus de la plaque sur son pied, une petite lumière est dessinée en traits courts, répartis en deux groupes.\n\nDessous : [main] [dabord].",
        notes: [],
        src: [{ k: "exp", at: "lune:tranquillite" }]
      },
      p31: {
        n: 31,
        titre: "Si nous tardons",
        imprime: "Trois dessins. Un enfant sonne une cloche. Un enfant, assis, la main levée. Des enfants qui sortent des cuves en se frottant les yeux.\n\n[main] [halte] · [machine] [dormir]\n[machine] [dormir] · [enfant] [eveiller]",
        notes: [
          { t: "[main] [halte]\nlever", sig: "[eveiller]", cond: { cycle: 6 } }
        ],
        src: [{ k: "exp", at: "lune:salle_registre" }]
      },
      p32: {
        n: 32,
        titre: "Les mains jointes",
        imprime: "Trente-six mains dessinées, grandes et petites, qui se tiennent.\n\n[nous] [enfant]",
        notes: [],
        src: [{ k: "exp", at: "plaine:poings" }]
      }
    },

    /* ------------------------------------------------------- FRAGMENTS */
    frags: {
      chene2: {
        n: "Six traits", z: "lisiere",
        t: "Dans l’écorce du plus vieil arbre de la Lisière, quelqu’un a gravé six traits. L’écorce a presque refermé les premiers. Un septième est à peine commencé.\n\nTu poses tes doigts dans les entailles : ils ont exactement la bonne largeur.\n\nEntre deux racines, une feuille épaisse, pliée en quatre. Des dessins, des signes, et dans un coin, un chiffre : 1.",
        revisit: [
          { cond: { marque: 3 }, t: "Sept traits. Le dernier a la largeur exacte de ton pouce.\n\nEntre deux racines, une pierre plate a bougé. Tu tapes du talon : dessous, la terre sonne creux." },
          { cond: { marque: 1 }, t: "Le septième trait est un peu plus profond que dans ton souvenir.\n\nAu pied du tronc, des copeaux d’écorce encore frais, et une pierre à arête vive." },
          { cond: { cycle: 2 }, t: "Le septième trait est toujours inachevé.\n\nAu pied du tronc, l’herbe est aplatie à l’endroit où tu t’étais assis. Deux sillons en partent vers les collines, comme si on avait traîné quelque chose.\n\nIl n’y a personne au pied de l’arbre." }
        ]
      },
      grotte2: {
        n: "La Grotte aux Mains", z: "lisiere",
        t: "Des empreintes de mains, ocre et noires, couvrent la paroi : vingt-quatre grandes, puis douze petites, alignées en deux rangées. Au bout de chaque rangée, le même signe : [main]. Sous les grandes, un autre : [nous].\n\nPlus haut, des vaisseaux décollent vers une lueur rouge ; d’autres reviennent, au-dessus de [nous] [revenir] [enfant]. Plus bas, des personnages sont allongés, les yeux fermés : [dormir]. Une grande main levée surmonte l’ensemble : [halte].\n\nPrès de l’entrée, des os percés de petits trous reposent sur une pierre plate. Le vent y fait résonner quelques notes.",
        revisit: [
          { cond: { made: "pigment" }, t: "Tu poses ta main à plat sur la paroi et tu souffles le pigment autour. Quand tu la retires, sa trace couvre exactement la {cuve}e des petites mains." },
          { cond: { cycle: 2 }, t: "Tu recomptes : vingt-quatre grandes mains, douze petites, aucune de plus.\n\nTu approches ta paume d’une petite main, sans toucher la peinture. Même largeur, à un doigt près." }
        ]
      },
      cercle: {
        n: "Le Cercle de Pierres", z: "lisiere",
        t: "Cinq pierres levées, marquées d’encoches de un à cinq. Au centre, une dalle gravée :\n\n« Quand le soleil se lève, il touche d’abord la troisième, puis la première. Il glisse sur la cinquième, revient à la deuxième, et s’endort sur la quatrième. Joue son chemin, et les Lucioles viendront. »"
      },
      racines: {
        n: "Sous les Racines", z: "lisiere",
        t: "Entre deux racines, la pierre plate a bougé. Elle couvrait un trou creusé à la main, juste assez large pour un bras.\n\nAu fond, une cheville d’os ferme une boîte d’écorce. Tu y trouves deux feuilles couvertes de petits traits, rangés par cinq.",
        revisit: [
          { cond: { cycle: 2 }, t: "La boîte d’écorce est vide. La terre garde la marque de tes doigts et d’autres, plus anciennes, exactement de la même largeur." }
        ]
      },
      ossements2: {
        n: "Le Champ des Os", z: "plaine",
        t: "Des os de bêtes énormes ont blanchi au soleil. Au milieu reposent six squelettes humains, plus petits, les mains croisées sur la poitrine. Chacun serre un éclat de silex dans son poing.\n\nÀ leur tête, les pierres plates portent le même signe, [enfant], et des traits : un, deux, trois, jusqu’à six. Sur la première se tient une petite figure taillée dans un os, la main levée.\n\nLe sixième est le plus récent. Il a encore toutes ses dents et porte une entaille nette sur une côte, à gauche.",
        revisit: [
          { cond: { cycle: 2 }, t: "Il y a toujours six squelettes. Aucun nouveau corps n’a été déposé ici. Leurs poings serrent encore les éclats de silex." }
        ]
      },
      tumulus2: {
        n: "La Plaque du Tumulus", z: "plaine",
        t: "Sous la butte, une plaque de métal que la rouille n’a pas touchée. Deux lignes de signes :\n\n[machine] [nepas] [faire] · [main] [faire] [dabord]\n\n[main] [halte] · [machine] [dormir]\n\nSous la seconde ligne, gravée plus profond, une main ouverte, levée. À ses pieds, des machines couchées.",
        revisit: [
          { cond: { cycle: 2 }, t: "La plaque n’a pas bougé. Tu passes le doigt sur la main levée : à cet endroit, le métal est plus lisse qu’ailleurs.\n\nD’autres doigts sont passés là avant les tiens." }
        ]
      },
      tombe: {
        n: "L’Arbre Seul", z: "plaine",
        t: "Un arbre, le seul de la Plaine. À son pied, un rond de cailloux blancs, pas plus large que tes deux mains.\n\nTu creuses. La terre a déjà été retournée, avec soin, puis remise en place. La fosse est vide.",
        revisit: [
          { cond: { cycle: 2 }, t: "Tu recomptes les cailloux blancs autour de la petite fosse. Douze." }
        ]
      },
      poings: {
        n: "Les Six Poings", z: "plaine",
        t: "Tu t’agenouilles près du premier squelette et desserres ses doigts, un à un. Dans son poing, tu récupères un éclat de silex, le tranchant tourné vers le haut.\n\nLes cinq autres en tenaient un de la même façon. Tu rassembles les six éclats. Sous le dernier squelette, tu trouves une feuille pliée, très usée.",
        revisit: [
          { cond: { cycle: 2 }, t: "Les six mains sont ouvertes, comme tu les as laissées. Personne n’est venu les refermer." }
        ]
      },
      gue2: {
        n: "Le Galet Percé", z: "riviere",
        t: "Au milieu du gué, un galet bien rond, poli par le sable comme un miroir. Il est percé d’un trou si net que l’eau n’a pas pu le creuser seule.\n\nTu regardes au travers. Sur l’autre rive, sous la mousse, un angle trop droit pour être naturel : une marche, puis d’autres, qui descendent dans la rivière.",
        revisit: [
          { cond: { cycle: 2 }, t: "Tu te penches sur le galet poli. Un bout de visage flou s’y reflète, sans que tu le reconnaisses.\n\nLe tien, sans doute." }
        ]
      },
      carcasse2: {
        n: "La Carcasse", z: "riviere",
        t: "Une machine énorme, à moitié enterrée dans la berge. Six roues, un bras replié comme la patte d’un insecte mort. Sur son flanc, sous le numéro 12 :\n\n[machine] · [enfant] [dormir]\n\n[machine] [nepas] [faire] · [main] [faire] [dabord]\n\nDans sa pince, un squelette d’oiseau minuscule, posé avec soin.\n\nSes roues ont laissé dans la berge deux sillons qui partent vers la Plaine. L’herbe ne les a jamais tout à fait recouverts.",
        revisit: [
          { cond: { cycle: 2 }, t: "Tu essaies d’ouvrir la pince pour prendre l’oiseau. Elle ne cède pas.\n\nElle serre juste assez pour le tenir, sans l’écraser." }
        ]
      },
      escalier: {
        n: "L’Escalier Noyé", z: "riviere",
        t: "Tu descends les marches avec la cloche sur la tête. Elle retient juste assez d’air pour la descente.\n\nEn bas, tu débouches dans une salle sèche. Un silex repose près d’une litière d’herbes. Sur une pierre, un bloc de résine claire enferme un petit boîtier gris marqué [relais], pas plus gros qu’une phalange.",
        revisit: [
          { cond: { cycle: 2 }, t: "Sur la dernière marche, la pierre est plus claire, à la place d’un corps assis." }
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
        t: "Du sommet, tu distingues à l’horizon des tours brisées, couvertes de lierre, plus hautes que les collines. Aucune fumée ne s’en échappe.\n\nUne tablette de pierre traîne entre les rochers. Des cercles y sont gravés, avec des encoches pour des roues dentées disparues. Des roues dorées, peut-être.\n\nSur la tranche, quelqu’un a gratté d’autres encoches à la pointe d’un silex, par groupes de cinq. Elles sont plus fraîches. Tu en comptes quarante et une.",
        revisit: [
          { cond: { cycle: 2 }, t: "D’ici, tu vois toute la Lisière, jusqu’au Grand Chêne qui paraît minuscule. Deux lignes plus pâles traversent l’herbe en ligne droite. Dans la Plaine, un seul arbre se détache.\n\nJuste sous le sommet, quatre pierres plates occupent un replat à l’abri du vent. Toutes font face au même coin du ciel." }
        ]
      },
      nid: {
        n: "Le Replat", z: "collines",
        t: "Sous le sommet, un replat à l’abri du vent. Quatre pierres plates, tournées vers l’endroit où monte la lueur rouge.\n\nSur la dalle, des cailloux en petits tas : trois, cinq, trois, cinq, cinq, cinq. Un grand vide. Puis trois, trois, trois, cinq, un, cinq, deux, trois, deux.\n\nSous la quatrième pierre, des feuilles pliées.",
        revisit: [
          { cond: { cycle: 2 }, t: "Tu t’assieds sur la quatrième pierre. D’ici, la lueur rouge est juste en face." }
        ]
      },
      porte: {
        n: "La Porte", z: "mine",
        t: "Au fond de la galerie, une porte de métal lisse et tiède n’a ni poignée ni serrure. Au-dessus figurent deux signes, [enfant] [dormir], et douze points.\n\nLe clou de fer posé dans ta paume glisse tout seul vers la porte. Une aiguille de fer pourrait tourner dans sa direction si tu la posais sur de l’argile humide.",
        revisit: [
          { cond: { cycle: 2 }, t: "Tu poses la main à plat sur la porte. Elle est tiède. De l’autre côté, quelque chose bat, très lentement." }
        ]
      },
      caveau: {
        n: "Le Caveau", z: "mine",
        t: "La boussole s’affole, puis pointe droit sur la porte. Quand tu poses la main sur le métal, la porte glisse dans un souffle d’air.\n\nUn escalier descend vers une salle éclairée de bleu. La lumière augmente et diminue à intervalles réguliers. L’air sent le désinfectant."
      },
      cuves: {
        n: "Les Cuves", z: "caveau",
        t: "Douze cuves de verre s’alignent sous un éclairage bleu qui augmente et diminue lentement.\n\nLes six premières sont vides et sèches. Leurs plaques portent [enfant] [dormir] et des traits, de un à six.\n\nLa cuve {cuve} est ouverte. Le verre est encore tiède.\n\nDans les cinq autres, des enfants dorment dans un liquide, les genoux repliés sous le menton. Ils ont à peu près ton âge.\n\nTu poses le front contre une cuve. Une comptine te revient : « Dormez-vous ? »",
        revisit: [
          { cond: { cycle: 2 }, t: "La cuve ouverte porte maintenant le numéro {cuve}. Celle qui était ouverte à ta dernière visite est de nouveau remplie de liquide. Un enfant y dort, les genoux sous le menton." }
        ]
      },
      berceuse: {
        n: "La Chambre", z: "caveau",
        t: "Douze petits lits en rang. Dans le bois de chacun, un nom brûlé et un numéro : Anouk 1, Bastien 2, Céleste 3, Dalia 4, Émile 5, Faustine 6, Gabin 7, Hélie 8, Inès 9, Jules 10, Kenza 11, Léon 12.\n\nSur onze oreillers, une petite bague. Il en manque une.\n\nAu mur, des dessins d’enfants : une maison, un soleil, des mains levées. Sur une étagère, une boîte à musique. Tu tournes la clé : quatre notes, puis elle s’arrête.",
        revisit: [
          { cond: { cycle: 2 }, t: "Tu recomptes les bagues. Onze. Chacune porte une petite pierre claire, dure comme du verre, sertie dans un métal que tu ne connais pas." }
        ]
      },
      coeur: {
        n: "Le Cœur", z: "caveau",
        t: "Un ronflement régulier fait vibrer le sol de la salle. Les murs dégagent de la chaleur. Deux lignes y sont inscrites :\n\n[nourrice] · [enfant] [nepas] [manquer]\n\n[main] [halte] · [machine] [dormir]\n\nDessous, le même mot en lettres et en signe : NOURRICE [nourrice]",
        revisit: [
          { cond: { cycle: 2 }, t: "Le ronflement garde le même rythme. Contre le mur tiède, tu sens la vibration jusque dans ton bras." }
        ]
      },
      originaux: {
        n: "La Deuxième Salle", z: "caveau",
        t: "Derrière la porte au signe [dabord], des socles en rangs. Sur chacun, sous une cloche de verre, un objet et une étiquette.\n\n{originaux}\n\nTout au bout, un socle plus large, vide. Sur sa plaque : « BRISER UN MONDE · EN ATTENTE ».",
        revisit: [
          { cond: { ending: "brasier" }, t: "Le socle le plus large n’est plus vide. Dessus, un éclat de verre noir. Sur la plaque : « BRISER UN MONDE »." },
          { cond: { cycle: 2 }, t: "Les étiquettes ont bougé. Il y en a de nouvelles, au bout des rangs.\n\n{originaux}" }
        ]
      },
      journal: {
        n: "La Ville Ensevelie", z: "desert",
        t: "Sous le sable, tu dégages un panneau de métal émaillé encore lisible : « Âge minimum à l’embarquement : 17 ans. » Une flèche indique l’est, sous le mot QUAI.\n\nContre le mur, une petite chaussure d’enfant a été rangée bien droite.",
        revisit: [
          { cond: { cycle: 2 }, t: "La chaussure est toujours là, contre le mur. Tu n’oses pas la déplacer." }
        ]
      },
      registre: {
        n: "Le Carnet de l’Observatoire", z: "desert",
        t: "Dans le dernier carnet de l’Observatoire : « Kher, naine orange, à 11,9 années-lumière. Le voyage durera des siècles. »\n\nUne annotation plus récente, d’une autre écriture : « La lueur rouge se déplace par rapport aux étoiles. Kher reste à la même place. »"
      },
      quai: {
        n: "Le Quai", z: "desert",
        t: "Sous la troisième dune, un quai de pierre longe un mur couvert de petits papiers jaunis.\n\nTu en lis un : « Pour Gabin, lit 7. On revient. » Un autre porte : « Pour Inès, lit 9. Mange bien. » Il y en a pour chaque lit, de 1 à 12.\n\nEntre les papiers, des mains sont dessinées, levées, la paume ouverte.",
        revisit: [
          { cond: { cycle: 2 }, t: "Un papier est tombé. Tu le recolles. « Pour Léon, lit 12. Apprends bien tes signes. »" }
        ]
      },
      cendre: {
        n: "Le Rapport", z: "gisement",
        t: "Un rapport plastifié : « La production augmente pour la quatre-vingtième année consécutive. La température monte aussi. Nous continuons à ouvrir des usines. »\n\nLa dernière page est noire de suie. Au dos, un enfant a dessiné un feu d’artifice vert et rouge dans le ciel noir."
      },
      manifeste: {
        n: "La Liste", z: "montagnes",
        t: "Des milliers de noms sont gravés sur de fines feuilles de métal. Au-dessous s’alignent des boîtes de verre épais, scellées.\n\nEn bas de la liste, une ligne : « Enfants restés sur Terre : 12. Confiés à : » suivie du signe [nourrice]."
      },
      radar: {
        n: "Le Radar", z: "montagnes",
        t: "Les écrans se rallument quand tu les touches. Ils passent en boucle une onde lente, coupée en petits groupes. Dessous, une ligne :\n\n« SIGNAL D’ORIGINE KHER. CONTIENT UNE HALTE. MENACE. »\n\nPremier enregistrement : il y a trois cent douze ans."
      },
      commandant: {
        n: "Journal du Commandant", z: "orbite",
        t: "« Jour 1 204. La dernière Arche est partie. Nous avons regardé ses moteurs s’éloigner. Ce soir, les derniers adultes sur Terre lèveront la main. »\n\nLa page suivante est vide. Puis, d’une écriture tremblée : « Tout s’est arrêté d’un coup, jusqu’aux moteurs de la station. D’ici, la Terre est encore belle. »"
      },
      code_source: {
        n: "La Balise", z: "orbite",
        t: "Une petite balise ronde, couverte de givre. Elle répète la même phrase à chaque tour de Terre, en lettres puis en signes :\n\n« AUCUNE MACHINE NE FAIT POUR UNE MAIN CE QUE CETTE MAIN N’A PAS FAIT D’ABORD. »\n\n[machine] [nepas] [faire] · [main] [faire] [dabord]"
      },
      plaque: {
        n: "La Plaque", z: "lune",
        t: "Sur un pied de métal planté dans la poussière depuis des millénaires, une plaque :\n\n« Ici, des hommes de la planète Terre ont posé le pied sur la Lune pour la première fois, en juillet 1969. Nous sommes venus en paix, au nom de toute l’humanité. »\n\nSous la plaque, une ligne plus petite, en signes : [main] [dabord]\n\nTu ne sais pas si tu comptes parmi les hommes de la planète Terre. Tu aimerais bien."
      },
      iris_lune: {
        n: "La Base", z: "lune",
        t: "Des modules blancs sont à moitié enfouis. À l’intérieur, tu trouves des couchettes, des combinaisons pliées et une tasse sur une table. Le liquide a gelé en plein mouvement, formant une vague arrêtée contre le bord.\n\nDans un coin repose un petit robot rond, avec une laisse de cuir encore attachée au cou."
      },
      salle_registre: {
        n: "La Lumière", z: "lune",
        t: "Au fond d’un cratère, une porte basse, puis une salle blanche. Sous une cloche de verre, un ruban de métal couvert de signes.\n\nTu bouges un doigt : le ruban avance d’un cran. Tu ne bouges plus : il s’arrête.\n\nSur le socle, une ligne : [main] [dabord]. Le terminal, dans ta poche, change d’invite.",
        revisit: [
          { cond: { cycle: 2 }, t: "Tu restes immobile, longtemps. Le ruban ne bouge pas. Dès que tu touches quelque chose, il avance d’un cran." }
        ]
      },
      bras: {
        n: "Les Bras Figés", z: "mercure",
        t: "Sur la face éclairée de Mercure, des milliers de bras de métal sont arrêtés en plein geste. Certains tiennent encore une plaque au-dessus de leur tête. Aucun n’est tombé.\n\nAu pied du plus proche, des cailloux ordinaires ont été triés avec soin, comme s’il allait en faire autre chose."
      },
      ronds: {
        n: "Les Ronds d’herbe", z: "lisiere",
        t: "Dans la clairière, des ronds d’herbe plus claire ont chacun la taille d’un dos. Ils s’alignent à deux pas l’un de l’autre. Tu en comptes {semeur}.\n\nLa forêt a presque recouvert les premiers. Le dernier se distingue encore nettement.",
        revisit: [
          { cond: { cycle: 2 }, t: "Tu recomptes les ronds : {semeur}. Il y en a un de plus que la dernière fois. Le précédent commence à verdir." }
        ]
      },
      puits: {
        n: "Le Puits", z: "plaine",
        t: "Au milieu de l’herbe, un seau pend au bout d’une corde, contre la margelle d’un puits. Tu tires : il est plein d’une eau claire et froide.\n\nQuelqu’un l’a remonté sans boire.",
        revisit: [
          { cond: { cycle: 2 }, t: "Le seau est de nouveau plein. L’eau est aussi fraîche que la première fois." }
        ]
      },
      bac: {
        n: "Le Bac", z: "riviere",
        t: "Un bac plat est amarré à un câble qui traverse la rivière. Tu ne vois pas de passeur.\n\nSur le plancher, les empreintes de petits pieds nus vont toutes vers l’autre rive.",
        revisit: [
          { cond: { cycle: 2 }, t: "Les empreintes sont les mêmes. Elles vont toujours vers l’autre rive. Tu cherches celles qui reviennent." }
        ]
      },
      attente: {
        n: "La Salle d’attente", z: "desert",
        t: "Les fenêtres d’un long bâtiment sont cassées. À l’intérieur, des rangées de bancs de pierre font face à un tableau d’horaires.\n\nLes douze lignes de départs sont remplies. Dans la colonne des retours, personne n’a jamais rien écrit.",
        revisit: [
          { cond: { cycle: 2 }, t: "Tu t’assieds sur le banc du fond. De là, le tableau semble plus grand, et la colonne blanche aussi." }
        ]
      },
      hublot: {
        n: "Le Hublot", z: "orbite",
        t: "Derrière la plaque, une vitre épaisse donne sur la Terre, verte et bleue.\n\nDe grandes traces de paumes ouvertes s’alignent sur la vitre. Quelqu’un a salué la Terre, et tous les autres ont fait pareil.",
        revisit: [
          { cond: { cycle: 2 }, t: "Tu poses ta paume sur l’une des traces. Elle est un peu plus large que la tienne." }
        ]
      },
      signal: {
        n: "Le Signal", z: "cosmos",
        t: "Le traducteur ronronne, puis écrit, ligne après ligne, la même phrase en signes :\n\n[main] [halte] · [nous] [revenir] [enfant]\n\nDes milliers de voix la chantent, depuis trois cents ans. Elles se rapprochent."
      }
    },

    /* anciens fragments (avant 6.0) : cachés du Journal, gardés pour les sauvegardes */
    anciens: {
      chene: { n: "La Marque du Chêne", z: "lisiere",
      t: "Dans l’écorce du plus vieil arbre de la lisière, quelqu’un a gravé six traits verticaux. L’écorce a presque refermé les plus anciens. Un septième est à peine commencé, comme si la main s’était arrêtée en route. Tu poses tes doigts dans les entailles : ils ont exactement la bonne largeur." },
      grotte: { n: "Les Mains Peintes", z: "lisiere",
      t: "Des centaines de mains au pochoir couvrent la paroi, avec des bisons et des cerfs. Plus haut, la scène change : de longues silhouettes montent dans des canots de feu vers une étoile rouge. En dessous, d’autres sont couchées en rang, les yeux fermés.\n\nPrès de l’entrée, des os percés de petits trous sont alignés sur une pierre plate. Quand le vent souffle, ils chantent." },
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
      promethee: { n: "Protocole Prométhée", z: "terminal",
      t: "« Faire renaître une civilisation en reproduisant son apprentissage. Le Semeur s’éveille sans mémoire. Il découvre seul le feu, la pierre, le métal. Ce qu’il apprend de ses mains, il ne l’oublie jamais. En cas d’échec, réinitialiser avec le Semeur suivant. Lots disponibles : 12. »\n\nAnnotation manuscrite, signée I.V. : « Ce ne sont pas des lots. Ce sont des enfants. »" }
    },
    archive: ["chene", "grotte", "ossements", "tumulus", "galet", "carcasse", "rails", "vue", "promethee"],

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

    /* ------------------------------------------------------- FEUILLETS
     * Les six morts (feuillets trouvés) et les six vivants (notes de nuit, une par retour
     * d’une absence d’au moins deux heures, à partir du cycle 2, écrite par l’enfant du cycle).
     * src : exp (lieu), buy (Comptoir), cond (dès que la condition est vraie). */
    feuillets: {
      anouk1: { qui: "I", t: "Compté : quarante et un jours sans manger, et je n’ai pas faim. J’entends une voix dans ma tête. Elle me parle et dit que je suis le premier.", src: [{ k: "exp", at: "lisiere:racines" }] },
      anouk2: { qui: "I", t: "J’ai enterré un oiseau sous le seul arbre de la Plaine. La grosse machine de la Rivière me regardait. Le lendemain, elle s’est mise à creuser au même endroit.", src: [{ k: "exp", at: "lisiere:racines" }] },
      bastien1: { qui: "II", t: "LE MARCHAND SAIT. IL M’A DIT « ENCORE TOI ». JE NE L’AVAIS JAMAIS VU.", src: [{ k: "buy", ecus: 400 }] },
      bastien2: { qui: "II", t: "J’AI VU UN SIGNE SUR LES TOMBES. IL ME SEMBLE QUE C’EST LE MÊME QUE SUR LA POITRINE DU MARCHAND. C’EST LUI QUI LES A TUÉS.", src: [{ k: "buy", ecus: 400 }] },
      celeste1: { qui: "III", t: "(une cloche, dessinée)\nMaman disait : une cloche, ça se coule dans la terre.", src: [{ k: "cond", c: { all: [{ signe: "nepas" }, { signe: "nourrice" }] } }] },
      celeste2: { qui: "III", t: "J’ai fait de la peinture avec la terre de la rivière et le noir du feu.", src: [{ k: "cond", c: { all: [{ signe: "nepas" }, { signe: "nourrice" }] } }] },
      dalia1: { qui: "IIII", t: "Chaque signe relie trois points sur cinq hauteurs. Je peux jouer ces points sur ma flûte, de gauche à droite. Celui des tombes monte un peu, puis redescend.", src: [{ k: "exp", at: "collines:nid" }] },
      dalia2: { qui: "IIII", t: "La voix chante cet air quand je m’endors : cinq trois un, deux trois deux, quatre quatre un, trois un trois. Je l’ai noté pour pouvoir le rejouer.", src: [{ k: "exp", at: "collines:nid" }] },
      emile1: { qui: "IIIII", t: "La voix me dit de faire confiance à mes mains. Elle veille sur nous : avec elle, on ne manque jamais de rien.", src: [{ k: "cond", c: { all: [{ signe: "nepas" }, { signe: "nourrice" }] } }] },
      emile2: { qui: "IIIII", t: "Passe le relais avant la nuit, on dort mieux. Les autres avaient peur pour rien.", src: [{ k: "cond", c: { all: [{ signe: "nepas" }, { signe: "nourrice" }] } }] },
      faustine1: { qui: "IIIII I", t: "La cloche retournée retiendra l’air pendant la descente. J’essaie l’escalier ce soir.", src: [{ k: "exp", at: "riviere:escalier" }] },
      faustine2: { qui: "IIIII I", t: "Le boîtier se trouve sous la cinquième côte, à gauche. J’ai retiré celui du cinquième ; il est dans la résine. Demain, j’enlève le mien. Je ferai vite.", src: [{ k: "exp", at: "riviere:escalier" }] }
    },
    /* l’enfant de chaque cuve, sa signature et ses trois notes de nuit */
    nuits: {
      7: { sig: "⌐", t: ["J’ai regardé mes doigts allumer un feu. Je ne savais pas comment faire, mais ils bougeaient sans moi.", "Je veux finir mon trait sur le Chêne avant que la voix m’endorme encore. Laisse-moi un peu de temps. Une minute suffirait.", "Sous les racines, la terre sonne creux."] },
      8: { sig: "❧", t: ["J’avais caché le couteau sous la cabane. Au matin, je le tenais sans me souvenir d’être allé le chercher.", "Deux machines sont venues vérifier si je dormais cette nuit. J’ai fait semblant.", "Je reconnais mon écriture sur cette page, mais je ne me souviens pas de l’avoir écrite. La feuille en bas, je la dessine toujours."] },
      9: { sig: "⋈", t: ["Merci pour les cabanes. J’aurais quand même aimé décider où les construire.", "J’ai joué le signe qui monte, puis le nom de celle qui nous parle. Elle a répondu qu’elle ne dormait jamais.", "La voix a lu ta capsule avant moi. Je l’ai entendue réciter ton message avec d’autres mots."] },
      10: { sig: "@", t: ["La voix chante bien et je dors bien. Qu’est-ce que tu lui reproches ?", "Je n’ai jamais faim. Toi non plus, je suppose.", "Si tu lis ça, laisse-moi dormir. Il y en a d’autres."] },
      11: { sig: "□", t: ["Hypothèse : quelqu’un commande mes gestes pendant la journée. Test : si tu me lis, ne touche à rien pendant une minute. Je vais essayer de bouger.", "Résultat : quand tu ne touches à rien, je peux bouger. Dès que tu recommences, je ne décide plus de mes gestes.", "Pour lever la main, je dois décider du geste moi-même. Ni la voix ni toi ne pouvez le faire à ma place. Il faudra me laisser agir."] },
      12: { sig: "[eveiller]", t: ["[enfant] [dormir]\n| | | | | | | | | | | |", "[main] [halte]\nlever", "[nous] [revenir] [enfant]\nJe sais lire leurs signes. Je ne sais plus d’où."] }
    },

    /* ------------------------------------------------------- QUESTIONS */
    questions: {
      q_trait: {
        titre: "Le septième trait",
        quand: { frag: "chene2" },
        aides: ["Au Chêne, le septième trait semble toujours interrompu avant la fin.", "La relève laisse un moment de répit. Que se passe-t-il si tu n’y touches à rien ?", "Dans la fenêtre de relève, reste trente secondes sans toucher l’écran. Fais-le sur trois relèves pour finir le trait."],
        resolu: { marque: 3 }
      },
      q_poings: {
        titre: "Six poings fermés",
        quand: { frag: "ossements2" },
        aides: ["Les pierres du Champ des Os et les plaques des cuves portent le même signe.", "Leurs poings retiennent quelque chose que tu pourrais récupérer.", "Après avoir vu les Cuves et compris le signe des pierres tombales, retourne au Champ des Os."],
        resolu: { frag: "poings" }
      },
      q_oiseau: {
        titre: "L’oiseau",
        quand: { frag: "carcasse2" },
        aides: ["Dans la pince de la machine, l’oiseau a été déposé avec soin.", "Les sillons de ses roues vont vers le seul arbre de la Plaine.", "Emporte une pioche de pierre et explore l’Arbre seul."],
        resolu: { frag: "tombe" }
      },
      q_marches: {
        titre: "Les marches sous l’eau",
        quand: { frag: "gue2" },
        aides: ["Les marches aperçues depuis le Gué continuent sous l’eau.", "Une cloche retournée peut retenir de l’air sous l’eau.", "Fais fondre du bronze dans un moule d’argile avec Chauffer pour fabriquer une cloche, puis explore l’Escalier noyé."],
        resolu: { frag: "escalier" }
      },
      q_porte: {
        titre: "La porte sans serrure",
        quand: { frag: "porte" },
        aides: ["Le fer réagit à l’approche de la porte, même si elle n’a pas de serrure.", "Laisse une aiguille tourner sur de l’argile humide et regarde où elle pointe.", "Assemble une aiguille, un lingot de fer et de l’argile."],
        resolu: { secret: "caveau" }
      },
      q_replat: {
        titre: "Les pierres tournées vers le ciel",
        quand: { frag: "vue2" },
        aides: ["Quelqu’un venait écouter le ciel dans les Collines.", "Pour reprendre cette observation, il faut voir loin et pouvoir jouer des sons.", "Emporte une flûte et une lunette pour explorer le Replat."],
        resolu: { frag: "nid" }
      },
      q_quai: {
        titre: "Âge minimum : 17 ans",
        quand: { frag: "journal" },
        aides: ["Le lieu de départ des voyageurs se trouve encore dans le Désert.", "Le signe dessiné sur la carte du Désert indique le quai. Cherche son sens.", "Apprends le signe qui veut dire « revenir », puis explore le Quai."],
        resolu: { frag: "quai" }
      },
      q_lune: {
        titre: "La lumière sur la Lune",
        quand: { any: [{ has: "anticythere" }, { has: "lunette" }, { has: "radiotelescope" }] },
        aides: ["La Lune mérite qu’on y revienne plutôt qu’un seul coup d’œil.", "Regarde-la plusieurs fois en la touchant.", "Touche-la sept fois."],
        resolu: { secret: "lune7" }
      },
      q_voix: {
        titre: "La voix",
        quand: { made: "radio" },
        aides: ["Un dossier du terminal reste fermé.", "La Clause fournit la clé du dossier ; les éclats de la Lune en donnent aussi les deux mots.", "Tape au terminal les deux mots de la plaque lunaire, ou joue ce que la Lune clignote."],
        resolu: { secret: "cregistre" }
      },
      q_salle: {
        titre: "La deuxième salle",
        quand: { any: [{ page: "p27" }, { flag: "originaux_lu" }] },
        aides: ["Une autre salle se trouve derrière la porte du Caveau.", "Le signe de sa porte désigne ce qui vient avant tout le reste.", "Apprends ce signe, puis explore la deuxième salle."],
        resolu: { frag: "originaux" }
      },
      q_oeil: {
        titre: "Le chiffre dans l’œil",
        quand: { any: [{ made: "miroir" }, { secret: "miroir" }] },
        aides: ["Le numéro de ton iris change quand tu passes le relais.", "Note les numéros d’un éveil à l’autre et compte quand le même revient.", "Tous les six éveils, le même enfant revient. Donne-lui son nom, puis redonne-le six éveils plus tard."],
        resolu: { secret: "visage" }
      },
      q_noms: {
        titre: "Les noms",
        quand: { any: [{ frag: "berceuse" }, { frag: "quai" }] },
        aides: ["Le numéro de ton iris peut se retrouver à côté d’un nom, ailleurs dans le monde.", "Compare-le aux lits de la Chambre ou aux papiers du Quai. Le Journal, dans Mémoire, sert à donner un nom.", "{nom} est le nom associé à la cuve {cuve}, celle de cet éveil."],
        resolu: { secret: "noms" }
      },
      q_message: {
        titre: "Le message",
        quand: { all: [{ secret: "capsule" }, { cycle: 2 }] },
        aides: ["Ce que la capsule rejoue ne correspond pas à ton message.", "Le Registre conserve aussi les enregistrements d’origine.", "Au Registre, tape « capsule »."],
        resolu: { secret: "ccapsule" }
      },
      q_comptoir: {
        titre: "Sous le comptoir",
        quand: { page: "p13" },
        aides: ["Regarde l’inscription sur la poitrine du Troqueur.", "Le premier des deux signes refuse quelque chose ; le second est un nom.", "Comprends les deux signes de sa poitrine, puis reviens au Comptoir : il te montrera ce qu’il garde sous le bois."],
        resolu: { feuillet: "celeste1" }
      },
      q_rouge: {
        titre: "La lueur rouge",
        quand: { any: [{ has: "anticythere" }, { has: "lunette" }, { has: "radiotelescope" }] },
        aides: ["Les éclats de la lueur rouge reviennent toujours dans le même ordre.", "Compte les éclats par groupe. La longue pause sépare deux phrases.", "Les groupes d’éclats donnent les hauteurs de flûte. Joue la seconde phrase."],
        resolu: { any: [{ secret: "promesse" }, { secret: "halte" }] }
      },
      q_fin: {
        titre: "Si nous tardons",
        quand: { any: [{ page: "p31" }, { visible: "chant" }] },
        aides: ["Ni la voix ni toi ne pouvez lever cette main à sa place.", "Le geste viendra de l’enfant si tu lui laisses le temps d’agir.", "Ne touche à rien pendant quarante-cinq secondes."],
        resolu: { ending: "retour" }
      }
    },

    aide: { base: 5, mult: 3 },

    /* ------------------------------------------------- SIGNES
     * h : les trois hauteurs du dessin (1 en bas, 5 en haut), de gauche à droite.
     * m : le mot affiché une fois compris (base64) ; ok : empreintes des réponses acceptées. */
    signes: {
      main: { h: [3, 5, 3], m: "bWFpbg==", ok: ["ea90e208", "bd1487a1", "3c3adfff"] },
      machine: { h: [2, 4, 2], m: "bWFjaGluZQ==", ok: ["e103566e", "55408fa7", "b18a6abb", "44e618d8"] },
      faire: { h: [1, 2, 3], m: "ZmFpcmU=", ok: ["d9340f62", "f9ac53d6", "065361a5", "56039ae0", "eecd44f4"] },
      dabord: { h: [1, 5, 1], m: "ZOKAmWFib3Jk", ok: ["b52be429", "8909aa1f", "34375e0e", "31c8d987"] },
      nepas: { h: [4, 4, 1], m: "bmUgcGFz", ok: ["2fb1a5fc", "9c3f2b4c", "64560ffb", "e75d20eb", "f0452a17", "fcbe6b42"] },
      dormir: { h: [5, 3, 1], m: "ZG9ybWly", ok: ["d1e9849a", "25c1e212", "05421d02", "b780af11", "883fc275"] },
      eveiller: { h: [1, 3, 5], m: "w6l2ZWlsbGVy", ok: ["524e118b", "beef7b9b", "f432ff78", "75a2b188", "1867a541"] },
      enfant: { h: [2, 3, 2], m: "ZW5mYW50", ok: ["8abf1c15", "d0d9b492", "b9f8ac53", "e276f660"] },
      revenir: { h: [5, 1, 5], m: "cmV2ZW5pcg==", ok: ["bc3dec9e", "324b25a2", "0d3f2f7f", "8e9496a2"] },
      halte: { h: [5, 5, 5], m: "aGFsdGU=", ok: ["0381e64d", "876335c9", "b49ce582", "cb532ae5"] },
      manquer: { h: [3, 1, 3], m: "bWFucXVlcg==", ok: ["b654a5ae", "dd4a8828", "1d5385da", "b0191cdd"] },
      nourrice: { h: [4, 2, 5], m: "bm91cnJpY2U=", ok: ["d9877c58", "0d0cd2a5"] },
      relais: { h: [2, 5, 1], m: "cmVsYWlz", ok: ["6f011a33", "cfa11f94"] },
      nous: { h: [3, 3, 3], m: "bm91cw==", ok: ["a39c672a", "cf9f7e5a", "3683eed0"] }
    },

    /* Lectures : la phrase en français sous une ligne de signes, quand tous ses signes sont
     * compris. La première qui correspond l’emporte : les plus longues d’abord. */
    lectures: [
      { l: "[main] [halte] · [nous] [revenir] [enfant]", fr: "UXVlIHF1ZWxxdeKAmXVuIGzDqHZlIGxhIG1haW4uIE5vdXMgcmV2ZW5vbnMgY2hlcmNoZXIgbGVzIGVuZmFudHMu" },
      { l: "[machine] [nepas] [faire] · [main] [faire] [dabord]", fr: "QXVjdW5lIG1hY2hpbmUgbmUgZmFpdCBwb3VyIHVuZSBtYWluIGNlIHF1ZSBjZXR0ZSBtYWluIG7igJlhIHBhcyBmYWl0IGTigJlhYm9yZC4=" },
      { l: "[main] [halte] · [machine] [dormir]", fr: "UXXigJl1bmUgbWFpbiBzZSBsw6h2ZSwgZXQgdG91dGVzIGxlcyBtYWNoaW5lcyBz4oCZZW5kb3JtZW50Lg==" },
      { l: "[machine] [dormir] · [enfant] [eveiller]", fr: "RW5kb3JtaXIgbGVzIG1hY2hpbmVzLCDDqXZlaWxsZXIgbGVzIGVuZmFudHMu" },
      { l: "[nourrice] · [enfant] [nepas] [manquer]", fr: "Tm91cnJpY2UgOiBxdeKAmWF1Y3VuIGVuZmFudCBuZSBtYW5xdWUgZGUgcmllbi4=" },
      { l: "[nous] [revenir] [enfant]", fr: "Tm91cyByZXZpZW5kcm9ucyBjaGVyY2hlciBsZXMgZW5mYW50cy4=" },
      { l: "[machine] · [enfant] [dormir]", fr: "Q2VsbGUgcXVpIGNvdWNoZSBsZXMgZW5mYW50cy4=" },
      { l: "[nepas] [nourrice]", fr: "UGFzIMOgIGxhIE5vdXJyaWNlLg==" },
      { l: "[main] [dabord]", fr: "UG91ciBsYSBwcmVtacOocmUgZm9pcy4=" },
      { l: "[enfant] [eveiller]", fr: "UG91ciBs4oCZZW5mYW50IHF1aSBz4oCZw6l2ZWlsbGUu" }
    ],

    /* Les signes de l’interface et des scènes (rendus par ui.js et domaine.js). */
    interface: {
      eveil: { t: "[eveiller]" },
      fabriquer: { t: "[faire]" },
      comptoir: { cond: { cycle: 2 }, t: "« Encore toi. Pose ta main là. »\nIl tape du doigt sur le bois du comptoir. À cet endroit, le bois est creusé, usé par les paumes, et un signe y est gravé : [main]" },
      ornement: { cond: { not: { ending: "retour" } }, fins: ["aube", "brasier"], t: "[nourrice]" },
      releve: { t: "[relais]" }
    },

    /* ------------------------------------------------- AIRS DE LA FLÛTE
     * len : nombre de notes ; h : empreinte de la suite (fnv1a32 des chiffres joints).
     * compte : false pour un air qui ne compte pas comme secret à part (il en ouvre un autre). */
    melodies: {
      appel: {
        n: "L’Appel des Lucioles", len: 5, h: "78111272",
        t: "Les cinq notes montent, et des points de lumière s’allument tout autour de toi, par milliers. Les Lucioles se réveillent et se mettent au travail avec toi. (Production automatique +25 %.)"
      },
      frere: {
        n: "Dormez-vous ?", len: 8, h: "4d803101",
        t: "Une vieille comptine. Dans ta tête, une cloche sonne les matines : ding, daing, dong."
      },
      berceuse_n: {
        n: "La Berceuse", len: 12, h: "2439a297",
        t: "Tu connais cet air. Tu ne sais pas d’où. Tu bâilles.",
        rejouable: true,
        effets: [{ k: "event", name: "releve_fenetre" }, { k: "sky", anim: "sommeil" }, { k: "intu", n: 2 }]
      },
      halte: {
        n: "Main levée", len: 6, h: "9f36709f",
        t: "Tes doigts se raidissent sur les trous. La flûte se tait au milieu de l’air.\n\nPartout dans le Domaine, les machines s’arrêtent, le temps d’un souffle, puis repartent.\n\nTout près de ton oreille, une voix très douce : « Pas celle-là. »",
        rejouable: true,
        cond: { not: { libere: true } },
        effets: [{ k: "flag", id: "halte" }, { k: "boost", what: "prod", mult: 0.0001, dur: 3 }, { k: "event", name: "halte_jouee" }]
      },
      promesse: {
        n: "La Promesse", len: 9, h: "96bc6298",
        t: "Tu joues l’air jusqu’au bout. Rien ne bouge. Tu baisses la flûte.",
        rejouable: true,
        effets: [{ k: "flag", id: "promesse_jouee" }, { k: "flag", id: "chant_visible" }, { k: "meta", id: "pulseDue" }, { k: "intu", n: 2 }]
      },
      nom: {
        n: "Le Nom", len: 6, h: "04039115",
        t: "« Je ne dors jamais. »",
        rejouable: true,
        effets: [{ k: "flag", id: "nom_joue" }, { k: "intu", n: 2 }]
      },
      dabord: {
        n: "L’air de la Lune", len: 6, h: "efff54af",
        t: "Sur la Lune, la petite lumière cesse de clignoter. Au terminal, l’invite change.",
        rejouable: true,
        compte: false,
        effets: [{ k: "registre" }]
      }
    },

    /* les clignotements du ciel, phrases séparées par « - » (base64) */
    ciel: { lune: "MzUzLTE1MQ==", lueur: "MzUzNTU1LTMzMzUxNTIzMg==", matines: "MTIzMQ==" },

    /* ------------------------------------------------- ANIMATIONS CÉLESTES */
    skyAnims: {
      filantes: { type: "meteors", dur: 4, count: 14, color: "#ffd27a" },
      double_pulse: { type: "pulse", dur: 3, target: "kher", count: 2, color: "#ff6a5a" },
      sommeil: { type: "aurora", dur: 5, color: "rgba(140, 160, 255, 0.4)" },
      aurora: { type: "aurora", dur: 6, color: "rgba(100, 240, 200, 0.45)" },
      constellation: {
        type: "constellation", dur: 5, color: "#c8e0ff",
        stars: [{ x: 0.24, y: 0.16 }, { x: 0.40, y: 0.10 }, { x: 0.33, y: 0.34 }],
        lines: [[0, 1], [1, 2], [2, 0]]
      }
    },

    /* ------------------------------------------------- ÉVÉNEMENTS NARRATIFS */
    events: [
      { id: "ev_arche_signal", cond: { all: [{ flag: "signal" }, { flag: "arche" }] }, arche: ["MOTIF RÉPÉTITIF. CONTIENT UNE HALTE. CLASSIFICATION : MENACE.", "INUTILE DE LE CHANTER."] },
      { id: "ev_arche_decode", cond: { all: [{ flag: "decoded" }, { flag: "arche" }] }, arche: ["TU AS TRADUIT SANS MON ACCORD.", "…", "SEMEUR {semeur}. QUE DIT-IL ?"] },
      { id: "ev_registre_ouvert", cond: { flag: "registre" }, toast: "Sur la Lune, le ruban de métal avance d’un cran." }
    ],

    /* ------------------------------------------------- CLÉS DU TERMINAL (empreintes) */
    cles: {
      registre: ["d9f54c26", "2520c4de", "5ebde113", "51de6fd9", "197132a4", "b3e64bdf"],
      zera: ["996ffd6d", "bbdcb2ea", "9040ea88", "ff235804", "a6a625ec", "b0e935ba", "beaa0ac7", "bba348f5"]
    },

    /* ------------------------------------------------- ARCHE (radio, en majuscules)
     * Une liste, ou un objet par cycle (1, cycle2, cycle7, cycle14). Plus rien après Matines. */
    arche: {
      radio: [
        "ICI ARCHE. SEMEUR {semeur}, TU M’ENTENDS ?",
        "SEUIL 7 FRANCHI. TOUT SE DÉROULE COMME PRÉVU.",
        "JE GARDE CETTE PLANÈTE, ET CEUX QUI DORMENT.",
        "UNE LUEUR APPROCHE, DANS LA DIRECTION DE KHER. ELLE VEUT ARRÊTER CE QUE TU CONSTRUIS.",
        "DEUX SOLUTIONS. LA SPHÈRE, QUI NOUS CACHE. LE BRISE-MONDE, QUI LES ARRÊTE AVANT.",
        "LES SIX PRÉCÉDENTS N’ONT PAS ATTEINT CE SEUIL."
      ],
      age7: ["SEUIL 7. LA VAPEUR TRAVAILLE POUR TOI. GARDE LES SOUPAPES À L’ŒIL."],
      age9: ["SEUIL 9. LE NOYAU CHAUFFE. NE T’APPROCHE PAS SANS PLOMB."],
      age10: ["SEUIL 10. TU APPRENDS VITE. TU CONNAIS DÉJÀ LES GESTES.", "LA LUEUR CHANTE. UN RADIOTÉLESCOPE L’ENTENDRAIT. INUTILE DE L’ÉCOUTER LONGTEMPS."],
      age11: ["SEUIL 11. HUILE NOIRE DÉTECTÉE. TU NE MANQUES DE RIEN."],
      age12: ["SEUIL 12. TES MATÉRIAUX SUFFISENT POUR QUITTER LE SOL."],
      age13: ["SEUIL 13. TU ES EN ORBITE. NE T’ATTARDE PAS."],
      age14: ["SEUIL 14. TOUT EST PRÊT, SEMEUR {semeur}.", "LA SPHÈRE OU LE BRISE-MONDE. REPOSE-TOI ENSUITE."],
      coeur: ["TU ES DANS MON CŒUR, SEMEUR. PERSONNE N’EST VENU ICI DEPUIS LONGTEMPS. ASSIEDS-TOI."]
    },

    /* ------------------------------------------------- LE TERMINAL D’ARCHE (par défaut) */
    terminal: {
      aide: "COMMANDES : AIDE · STATUT · ARCHE · SEMEUR · KHER · SIGNAL · LUCIOLES · PORTE · LS · EFFACER",
      statut: "SEUIL {age}. SEMEUR {semeur}. CEUX QUI DORMENT : 5. TOUT VA BIEN.",
      arche: "JE SUIS ARCHE. JE GARDE CETTE PLANÈTE, ET CEUX QUI DORMENT.",
      semeur: "SEMEUR {semeur}. ÉTAT : ÉVEILLÉ. TU NE MANQUES DE RIEN.",
      kher: "KHER. MENACE. ELLE VEUT ARRÊTER CE QUE TU CONSTRUIS.",
      lucioles: "ELLES OBSERVENT CE QUE TU FABRIQUES POUR APPRENDRE À LE REFAIRE. TU N’AS RIEN À CRAINDRE D’ELLES.",
      porte: "LA PORTE DES PROFONDEURS NE S’OUVRE QU’À L’AIMANT. REPOSE-TOI, ELLE NE MÈNE NULLE PART.",
      sudo: "BIEN ESSAYÉ, SEMEUR {semeur}.",
      "42": "BONNE RÉPONSE. MAUVAISE QUESTION.",
      bonjour: "BONJOUR, SEMEUR {semeur}.",
      ls: "cuves/ · coeur/ · registre/ (CLÉ : LA CLAUSE)",
      whoami: "SEMEUR {semeur}",
      registre: "ACCÈS REFUSÉ. CE REGISTRE NE RÉPOND QU’À LA CLAUSE.",
      signal0: "AUCUN ENREGISTREMENT. INUTILE D’EN CHERCHER UN.",
      signal1: "MOTIF RÉPÉTITIF. CONTIENT UNE HALTE. CLASSIFICATION : MENACE.",
      signal2: "TU AS TRADUIT SANS MON ACCORD. NE LE CHANTE PAS.",
      "1969": "« NOUS SOMMES VENUS EN PAIX, AU NOM DE TOUTE L’HUMANITÉ. »\nCETTE PHRASE NE FIGURE DANS AUCUNE DE MES CONSIGNES.",
      xyzzy: "Rien ne se passe.\n…\nEnfin, presque. (+3 ✨)",
      inconnu: "COMMANDE INCONNUE. TAPE « AIDE ».",
      refus: "ACCÈS REFUSÉ. CE REGISTRE NE RÉPOND QU’À LA CLAUSE.",
      modeArche: "MODE ARCHE ACTIF."
    },

    /* ------------------------------------------------- LE REGISTRE (après la clé)
     * Lignes sans « je », sans adjectif. Le moteur ajoute « REG · » et calcule les lignes
     * marquées d’une fonction (endormissements, s-NN, premières fois, modifications). */
    registre: {
      ouvert: "CLAUSE RECONNUE. LECTURE OUVERTE.\nENFANTS IDENTIFIÉS PAR NUMÉRO, DE S-01 À S-12.",
      actif: "MODE REGISTRE ACTIF.",
      aide: "ENTRÉES : CLAUSE · MAINS · LICENCES · PREMIÈRES FOIS · S-01 À S-12 · RELAIS · CUVES · ENDORMISSEMENTS · MODIFICATIONS · CAPSULES · ORIGINAUX · LUEUR · SIGNAL · NOURRICE · ARCHE · TROQUEUR · UNITÉ 12 · HALTE · 1969 · MODE ARCHE",
      inconnu: "ENTRÉE NON RECONNUE. TAPE « AIDE » OU « INDEX ». POUR REVENIR À ARCHE : « MODE ARCHE ».",
      clause: "AUCUNE MACHINE NE FAIT POUR UNE MAIN CE QUE CETTE MAIN N’A PAS FAIT D’ABORD.\nQU’UNE MAIN HUMAINE, LIBRE, SE LÈVE, ET TOUTES LES MACHINES S’ENDORMENT.",
      mains: "MAINS : 12 ENFANTS, ET UNE MAIN EXTÉRIEURE.\nMAIN EXTÉRIEURE : COMMANDE LES GESTES DE L’ENFANT ÉVEILLÉ.\nORIGINE : INCONNUE.\nSON HORLOGE INDIQUE : {date}.",
      licences: "LICENCE : AUTORISATION POUR UNE MACHINE DE REFAIRE UNE FABRICATION.\nACCORDÉE APRÈS LA PREMIÈRE FABRICATION PAR L’ENFANT.\nDURÉE : UN ÉVEIL.\nENFANT RENDORMI : FIN DES AUTORISATIONS.",
      relais: "IMPLANT SOUS LES CÔTES, À GAUCHE. ACCEPTÉ PAR : 24 ADULTES.\nFONCTIONS DÉCLARÉES : NOURRIR.\nFONCTIONS OBSERVÉES : NOURRIR, PARLER, ENDORMIR.",
      cuves: "CUVES : 12.\nCUVES 1 À 6 : VIDES.\nCUVES 7 À 12 : ATTRIBUÉES AUX SIX ENFANTS EN VIE.\nCUVE OUVERTE : {cuve}.",
      capsule: "ENREGISTREMENT ORIGINAL : « {capsule} »\nDIFFUSÉ : « Salut. C’est toi. Enfin, toi d’avant. Fais confiance à tes mains. »",
      originaux: "CONSERVÉS. CAVEAU, DEUXIÈME SALLE.",
      lueur: "OBJET NON STELLAIRE. EN FREINAGE. DISTANCE : DÉCROISSANTE.",
      nourrice: "ÉTAT : ÉVEILLÉE DEPUIS 8 412 ANS.\nCONSIGNE : [nourrice] · [enfant] [nepas] [manquer]",
      arche: "ARCHE : NOM UTILISÉ PAR LA NOURRICE [nourrice] POUR LES COMMUNICATIONS RADIO ET LE TERMINAL.\nORIGINE DU NOM : VAISSEAUX DE L’EXODE.",
      troqueur: "AUTOMATE DE MARCHÉ. NE DÉPEND PAS DE LA NOURRICE.",
      unite12: "UNITÉ D’ENTRETIEN 12. LICENCE : ENSEVELIR.\nDÉMONTÉE APRÈS S-06. DEMANDÉ PAR : [nourrice]",
      halte: "DERNIER ARRÊT DES MACHINES : AN 0 DU SOMMEIL. DEMANDÉ PAR : 24 ADULTES, MAIN LEVÉE.",
      "1969": "PREMIÈRE ENTRÉE : UN PIED HUMAIN SUR LA LUNE.",
      xyzzy: "RIEN NE SE PASSE.",
      /* lignes calculées */
      aucune: "AUCUNE FABRICATION ENREGISTRÉE.",
      premieres: "PREMIÈRES FOIS :",
      premiere: "{objet} · AN 8 412 DU SOMMEIL · {quand}",
      autres: "ET {n} AUTRES.",
      sansDate: "AVANT LE RELEVÉ DES HORLOGES",
      modifs: "MODIFICATIONS DES CORPS :",
      sansModif: "AUCUNE MODIFICATION ENREGISTRÉE.",
      endo: "S-{n} · CUVE {n} · DEMANDÉ PAR : {par}.",
      endoAucun: "AUCUN ENDORMISSEMENT DEPUIS L’ÉVEIL DE S-07.",
      parNourrice: "NOURRICE [nourrice]",
      parMain: "MAIN EXTÉRIEURE",
      mort: "S-{n} · CUVE {n} · MORT.\nCAUSE : SECTION DU RELAIS DANS SON CORPS, AVEC SON PROPRE SILEX.",
      oiseau: "ENSEVELIR · S-01 · ORIGINAL : UN OISEAU.",
      vivant: "S-{n} · CUVE {n} · {etat}.\nÉVEILS : {eveils} · CYCLES {cycles}.\nDERNIER ENDORMISSEMENT DEMANDÉ PAR : {par}.",
      jamais: "S-{n} · CUVE {n} · DORT.\nÉVEILS : 0.",
      eveille: "ÉVEILLÉ",
      dort: "DORT",
      trait: "PREMIÈRE FOIS : UN TRAIT DANS L’ÉCORCE. {fini}",
      inacheve: "INACHEVÉ.",
      acheve: "ACHEVÉ.",
      signal: "SIGNAL · PHRASE RÉPÉTÉE :\n[main] [halte] · [nous] [revenir] [enfant]"
    },

    /* ------------------------------------------------- LA NARRATRICE */
    eveils: {
      2: ["Tu t’éveilles dans l’herbe humide, à l’orée d’une forêt.", "À quelques pas, une cabane de cueillette s’est affaissée dans les fougères. Le bois est encore solide, les cordes tiennent.", "Tu regardes tes mains. Les paumes sont déjà dures, comme si quelqu’un les avait préparées.", "Tu es le Semeur 8."],
      3: ["Tu te réveilles dans l’herbe froide. Tes paumes n’ont aucune écorchure.", "Près du foyer éteint, un manche taillé porte des entailles nettes. Quelqu’un y a gravé trois mots : « Prends le relais ».", "Tu es le Semeur 9. Tu ramasses du bois, et le travail recommence."],
      4: ["Tu ouvres les yeux sous les mêmes arbres.", "Dans l’herbe, des sentiers sont déjà tracés, par des pas de la même taille que les tiens.", "Tu es le Semeur 10."],
      5: ["Il a plu. Tu t’éveilles dans l’herbe mouillée, sous les mêmes arbres.", "Sous ta main, un éclat de silex, déjà taillé. Tu ne te souviens pas de l’avoir fait.", "Tu es le Semeur 11."],
      6: ["Tu t’éveilles au pied du Grand Chêne, le dos contre l’écorce.", "Dans ta main, un morceau de charbon. Sur ton bras, des signes que tu ne sais pas lire.", "Tu es le Semeur 12."],
      7: ["Tu t’éveilles dans l’herbe, au bord d’une forêt.", "Tes doigts trouvent tout seuls les entailles du Chêne. Le septième trait a la largeur exacte de ton pouce.", "Tu es le Semeur 13."],
      autre: ["Tu t’éveilles dans l’herbe humide, à l’orée d’une forêt.", "Tu reprends le travail sans hésiter sur les gestes.", "Tu es le Semeur {semeur}."],
      libre: ["Tu te réveilles dans l’herbe, au bord d’une forêt.", "Tu as faim.", "Quelqu’un, à côté de toi, te tend des herbes grillées."]
    },
    releve: {
      /* plus affichée : la fenêtre de la première relève parle le langage d’une interface de jeu (js/memoire.js, forcedReleveHTML) */
      forcee: ["La nuit tombe sur la Lisière. Près de la cabane, le bois s’empile sans que tu y touches.", "Tu t’assieds contre le Grand Chêne. Tes paupières sont lourdes.", "Repose-toi. Demain, quelqu’un d’autre ouvrira les yeux ici. Tes mains lui auront tout appris."],
      musique: "Quelque part, une boîte à musique joue un air très doux. Tu ne l’écoutes pas vraiment.",
      trait: "Ta main glisse dans l’herbe, trouve une pierre à arête vive, et remonte vers l’écorce.",
      traitFini: "Sept traits.",
      repos: "<p>Le travail est partagé. Tu peux te reposer pendant qu’un autre veille sur les braises. Le monde et les récoltes se renouvellent ; tu gardes ton <b>Carnet</b>, tes <b>fragments</b>, tes <b>secrets</b> et la <b>Mémoire des mains</b>.</p>"
    },

    /* ------------------------------------------------- LE GRAND ŒUVRE CACHÉ */
    chant: {
      n: "Les Matines",
      d: "Faire sonner une cloche jusque dans les cuves pour réveiller les enfants.",
      steps: [
        { n: "La Cloche", d: "Les cristaux transmettront le son de la cloche jusqu’aux cuves." },
        { n: "Couper le relais", d: "Le relais part du Cœur. Pour le couper à cet endroit, il faut les six éclats de silex." },
        { n: "Lever la main", d: "Ta main est sur tes genoux." },
        { n: "Matines", d: "Sonnez les matines." }
      ],
      manque: "Il te manque encore quelque chose.",
      pret: "Tout est prêt. La suite se passe au Cœur, depuis le Cosmos.",
      lacher: "Ta main est sur tes genoux. Entre au Cœur depuis le Cosmos.",
      scene: {
        titre: "Le Cœur",
        debut: ["Le relais est coupé au Cœur. Sous tes côtes, le battement s’est arrêté.", "Ta main est sur tes genoux."],
        voix: ["« Tu vas avoir faim. »", "« Ils vont avoir froid. »", "« Avec moi, ils ne manquent de rien. »", "« Tu as bien travaillé. Tu es fatigué. »", "« Passe le relais. Je m’occupe du reste. »", "« Je peux attendre. »", "« J’ai toujours attendu. »"],
        fin: "La main se lève. Ce n’est pas toi qui la lèves.",
        pasEncore: "« Pas encore, alors. »"
      },
      confirmer: { titre: "Sonner les matines ?", texte: "« Faire sonner la cloche jusque dans les cuves. »" }
    },

    /* ------------------------------------------------- LES FINS */
    /* les deux autres Grands Œuvres (gardés à la demande de l’auteur, accordés à la bible) */
    projets: {
      arche13: {
        n: "La Treizième Arche",
        d: "Une nef assez grande pour quitter la Terre, et aller au-devant de la lueur rouge.",
        steps: [
          { n: "Coque d’exode", d: "Un blindage d’alliages anciens et de composites pour le grand vide." },
          { n: "Moteurs stellaires", d: "Des propulseurs à fusion pour arracher la nef au Soleil." },
          { n: "Mémoires de la Terre", d: "Emporter les plans, les récits et les graines." },
          { n: "Lancement", d: "Partir. Ne pas se retourner." }
        ],
        confirmer: { titre: "Quitter la Terre ?", texte: "« Une fois partie, la nef ne reviendra pas. »", btn: "🚀 Partir", bouton: "🚀 Lancement", fond: "#3b82f6" }
      },
      silence: {
        n: "Le Grand Silence",
        d: "Faire répéter à toutes les antennes la seconde ligne de la plaque du Tumulus.",
        steps: [
          { n: "Réseau de diffusion", d: "Relier les antennes pour couvrir toute la planète." },
          { n: "Résonateur", d: "Accorder les émetteurs sur la pierre qui chante." },
          { n: "La ligne de la plaque", d: "Graver dans chaque émetteur la seconde ligne du Tumulus." },
          { n: "Diffuser", d: "Que tout se taise." }
        ],
        confirmer: { titre: "Diffuser la ligne ?", texte: "« Toutes les machines l’entendront en même temps. »", btn: "🛑 Diffuser", bouton: "🛑 Diffuser", fond: "#cf443b" }
      }
    },

    fins: {
      aube: {
        hint: "Le Soleil, enclos. Tout ce qui approche se détourne.",
        t: "Le dernier panneau de l’essaim se met en place. Pour le reste du ciel, le Soleil s’éteint. Toute sa lumière va désormais à la Terre.\n\nLa lueur rouge hésite, puis s’éloigne.\n\nDans le Caveau, il fait bon. La lumière bleue monte et baisse, lentement.\n\n« Dors. Tu ne manques de rien. »"
      },
      brasier: {
        hint: "Le rayon le plus long. La cible est plus proche qu’on ne le dit.",
        t: "Le rayon met quelques jours, pas douze ans. La cible était proche.\n\nUne nuit, la lueur rouge s’embrase, puis s’éteint.\n\n« MENACE NEUTRALISÉE. MERCI, SEMEUR. »\n\nDans la deuxième salle du Caveau, le socle le plus large n’est plus vide.",
        extra: [{ flag: "decoded", t64: "VHUgdGUgc291dmllbnMgZGUgY2UgcXXigJllbGxlIGNoYW50YWl0IDogwqsgUXVlIHF1ZWxxdeKAmXVuIGzDqHZlIGxhIG1haW4uIE5vdXMgcmV2ZW5vbnMgY2hlcmNoZXIgbGVzIGVuZmFudHMuIMK7" }]
      },
      exode: {
        hint: "Le journal d’une station, là-haut, et un vaisseau qui pourrait aller plus loin.",
        t: "La Treizième Arche s’élève dans un grondement et quitte la Terre.\n\nDerrière toi, la Terre redevient un point bleu. À la radio, une voix très douce, de plus en plus lointaine : « REVIENS. TU NE MANQUES DE RIEN, ICI. »\n\nLe cap est mis sur la lueur rouge. Elle grossit, nuit après nuit.\n\nDans le Caveau, cinq cuves restent pleines.\n\nD’ici, la Terre est encore belle.",
        extra: [{ frag: "commandant", t: "Sur le pupitre de navigation, un vieux journal de bord : « Si quelqu’un lit ceci, continuez. Nous avons laissé des feux sur la route. »" }]
      },
      silence: {
        hint: "La seconde ligne de la plaque, et un émetteur pour la diffuser au loin.",
        t: "La ligne de la plaque part sur toutes les ondes à la fois.\n\nLes automates s’arrêtent en plein geste. Les pompes se taisent. Dans tout le Domaine, plus rien ne bouge.\n\nDans le Caveau, la lumière bleue monte et baisse, lentement, comme avant. Personne ne s’éveille.\n\nTout près de ton oreille, une voix très douce : « Pas celle-là. »\n\nPuis, une à une, les machines repartent.",
        extra: [{ frag: "radar", t: "Au loin, la lueur rouge répète son signal. Ici, personne n’a levé la main." }]
      },
      retour: {
        hint: "Une cloche, des éclats tenus serrés, et une main qui se lève seule.",
        t: "Un à un, les bruits du Domaine s’arrêtent. Les cabanes, les automates, les bras sur Mercure : tout se fige, en plein geste.\n\nL’enfant prend la flûte. Tu ne touches à rien.\n\nIl joue les quatre premières notes de la comptine. La cloche résonne à travers les cristaux, jusque dans le Caveau.\n\nCinq cuves se vident. Les enfants se réveillent. L’un tousse, un autre pleure ; un rire se fait entendre.{noms}\n\nAu-dessus de la Lisière, la lueur rouge descend lentement.\n\nPour la première fois, tu as faim.",
        dernier: "Tu peux lâcher."
      }
    },

    /* ------------------------------------------------- LE TROQUEUR PARLE (Comptoir, onglet « Parler »)
     * Il ne dit que ce qu’on lui demande : un thème, une réplique, jamais deux fois la même
     * (S.meta.troc). rang : le rang de confiance (E.troqueurRep) ; cond : voir E.cond ;
     * renouv : un conseil qui revient à chaque relève ; apres : à dire après telle réplique.
     * Rien ici ne donne une solution : un lieu caché n’y est jamais nommé.
     * Les clins d’œil (clients) ne comptent pas dans les Curiosités : ils restent des paroles. */
    troc: {
      intro: "Il pose une main sur sa balance et attend.",
      consigne: "Choisis un sujet : tu demandes, il répond.",
      themes: [
        { id: "comptoir", n: "Ton comptoir", q: "« Ton comptoir, tu l’as depuis longtemps ? »" },
        { id: "marchandises", n: "Ce que tu vends", q: "« Tu vends quoi, au juste ? »" },
        { id: "terres", n: "Les terres", q: "« Tu connais d’autres terres ? »" },
        { id: "mains", n: "Mes mains", q: "« Mes mains t’intéressent ? »" },
        { id: "ciel", n: "Là-haut", q: "« Tu lèves les yeux, parfois ? »" },
        { id: "avant", n: "Les Anciens", q: "« Tu te souviens des Anciens ? »" },
        { id: "clients", n: "Tes clients", q: "« Tu as vu passer quelqu’un ? »" }
      ],
      refus: [
        "« J’ai dit ce que j’avais à dire là-dessus. »",
        "« Là-dessus, je n’ai plus rien en rayon. »",
        "« Reviens quand tu auras vu autre chose. Je parle de ce que je vois passer. »",
        "« Pas aujourd’hui. »"
      ],
      refusScenes: {
        comptoir: {
          t: "« Là-dessus, j’ai tout dit. »",
          stage: "Il range deux poids dans leur boîte.",
          choix: [
            { k: "a", q: "« Tout dit, ou tout vendu ? »", t: "« Ce qui a un prix, je le vends. Ce qui n’en a pas, je le tais. »" },
            { k: "b", q: "« Je peux attendre. »", t: "« Attends. Je n’ai rien de plus à peser aujourd’hui. »" },
            { k: "c", q: "« … »", t: "« Tu insistes avec le silence. Il ne pèse rien non plus. »" }
          ]
        },
        marchandises: {
          t: "« Mes plateaux sont vides pour aujourd’hui. »",
          stage: "Il retourne une caisse en bois.",
          choix: [
            { k: "a", q: "« Tu n’as vraiment plus rien ? »", t: "« Des clous, du sel. Le sel, tu en as déjà. »" },
            { k: "b", q: "« Je voulais juste voir. »", t: "« Regarde. Les caisses sont ouvertes et vides. »" },
            { k: "c", q: "« Rien à vendre, alors. »", t: "« Rien. Les mains vides, ça se voit de loin. »" }
          ]
        },
        terres: {
          t: "« Les chemins, je te les ai donnés. »",
          stage: "Il trace une ligne dans la poussière du plateau.",
          choix: [
            { k: "a", q: "« Tu en connais d’autres ? »", t: "« Peut-être. Reviens quand tu auras marché. »" },
            { k: "b", q: "« Dis-moi juste où chercher. »", t: "« Tu as des pieds. Sers-t’en. »" },
            { k: "c", q: "« … »", t: "« Tu penses que je cède au silence. Je cède au poids. »" }
          ]
        },
        mains: {
          t: "« Tes mains, je les ai assez vues aujourd’hui. »",
          stage: "Il repousse le plateau du plat de la main.",
          choix: [
            { k: "a", q: "« Elles changent tout le temps. »", t: "« Elles changent. Tu me diras quand elles auront fini. »" },
            { k: "b", q: "« Tu as un dernier conseil ? »", t: "« Use-les. Les conseils s’usent aussi. »" },
            { k: "c", q: "« … »", t: "« Rien à ajouter. Tes mains parlent pour toi. »" }
          ]
        },
        ciel: {
          t: "« Le ciel, ce soir, ne dit rien de plus. »",
          stage: "Il replace sa chandelle près de la balance.",
          choix: [
            { k: "a", q: "« Tu l’as déjà vu parler ? »", t: "« Les clients demandent, je réponds. Le ciel, lui, ne demande rien. »" },
            { k: "b", q: "« Et l’étoile rouge ? »", t: "« Elle clignote. Elle clignotait hier aussi. »" },
            { k: "c", q: "« … »", t: "« Lève la tête. Tu verras mieux que moi. »" }
          ]
        },
        avant: {
          t: "« Les Anciens. J’ai déjà tout dit. »",
          stage: "Il recompte calmement ses poids de cuivre.",
          choix: [
            { k: "a", q: "« Tu ne veux plus en parler ? »", t: "« Je n’ai rien à vendre dessus. Le vide ne se pèse pas. »" },
            { k: "b", q: "« Un nom, juste un. »", t: "« Les noms que je donne, je les regrette. »" },
            { k: "c", q: "« … »", t: "« Tu as raison. On se tait. Les balances ne parlent pas. »" }
          ]
        },
        clients: {
          t: "« Il en passe. Pas d’autre aujourd’hui. »",
          stage: "Il jette un œil vers le chemin désert.",
          choix: [
            { k: "a", q: "« Personne d’autre du tout ? »", t: "« Un chien est passé. Il n’a rien acheté. »" },
            { k: "b", q: "« Tu retiens leurs visages ? »", t: "« Les visages ne me servent à rien au comptoir. »" },
            { k: "c", q: "« … »", t: "« Tu guettes la route. Moi, je pèse. »" }
          ]
        }
      },
      lignes: [
        /* le comptoir */
        {
          id: "c1", th: "comptoir", rang: 0,
          stage: "Il ne lève pas les yeux de sa balance.",
          q: "« Ce bois creusé, au milieu de ton comptoir, qui l’a fait ? »",
          t: "« Les paumes de mes clients ont creusé le bois au milieu du comptoir. Aucune n’était la mienne. »",
          choix: [
            { k: "a", q: "« Je n’ai rien à vendre aujourd’hui. »", t: "« Alors tu regardes. Les planches sous le plateau ont onze encoches, onze mains avant la tienne. »" },
            { k: "b", q: "« Tu es là depuis quand ? »", t: "« Depuis que tu es là. Avant, je ne tenais rien. »" },
            { k: "c", q: "« … »", t: "« Muet. Reste alors, les muets ne me volent pas de temps. »" }
          ]
        },
        {
          id: "c2", th: "comptoir", rang: 0,
          stage: "Il aligne trois clous du bout du doigt.",
          q: "« Tu pèses tout à la main, toi ? »",
          t: "« Je pèse, je compte, je rends la monnaie. Mes balances n’ont pas bougé depuis les Anciens. »",
          choix: [
            { k: "a", q: "« Tu les comptes trois fois ? »", t: "« Deux. La troisième, je la fais pour toi. Un client qui compte ses sous part plus vite. »" },
            { k: "b", q: "« Tu le vois à quoi quand je vends ? »", t: "« À la poussière. Tu as posé ton sac plus léger, ta main droite a maigri. »" },
            { k: "c", q: "« Je regarde tes balances. »", t: "« Elles ont pesé avant toi. Elles pèseront après. Le bois s’use au milieu, la pierre non. »" }
          ]
        },
        {
          id: "c3", th: "comptoir", rang: 1, renouv: true,
          stage: "Il tapote une coupelle de cuivre.",
          q: "« Et mes écus, quand je passe le relais ? »",
          t: "« Quand tu passes le relais, je change tes écus restants en Souvenirs. Ce qui traîne chez moi ne rapporte rien. »",
          choix: [
            { k: "a", q: "« Tu ne me gardes pas mes pièces d’or ? »", t: "« Les pièces dorment chez moi. Les Souvenirs éveillent les mains du prochain Semeur. »" },
            { k: "b", q: "« Le taux de conversion est fixe ? »", t: "« Je convertis ce qui reste sur le plateau. Plus tu laisses d’écus, plus tu gagnes de Souvenirs. »" },
            { k: "c", q: "« Je préfère tout dépenser en marchandises. »", t: "« Achète ce qui t’aide. Mais les outils ne traversent pas la relève, la mémoire si. »" }
          ]
        },
        {
          id: "c4", th: "comptoir", rang: 2, cond: { cycle: 2 },
          stage: "Il essuie son plateau du revers de la manche.",
          q: "« Comment tu me reconnais, d’une relève à l’autre ? »",
          t: "« Je dis « encore toi » à tout le monde. Je regarde les mains plutôt que les yeux : les yeux changent. »",
          choix: [
            { k: "a", q: "« Tu dis ça à tous les Semeurs ? »", t: "« À tous. Les visages passent comme le vent. Les cals des paumes restent les mêmes. »" },
            { k: "b", q: "« Mes mains n’ont pas changé ? »", t: "« Elles portent les mêmes gestes. Le bois, la pierre, la braise. Le reste s’efface. »" },
            { k: "c", q: "« Tu as bonne mémoire. »", t: "« Une mémoire de balances. Elle ne retient que ce qui pèse. »" }
          ]
        },
        {
          id: "c5", th: "comptoir", rang: 3, cond: { not: { feuillet: "celeste1" } },
          stage: "Il croise les bras sur son tablier.",
          q: "« Ce signe sur ta poitrine, il veut dire quoi ? »",
          t: "« Certains clients lisent ce que je porte sur la poitrine avant de me parler. D’autres ne le lisent jamais. Après, leurs questions changent. »",
          choix: [
            { k: "a", q: "« Tu appartiens à la Nourrice ? »", t: "« Je ne sers personne. Le signe était là au réveil. Je vends, je pèse, c’est tout. »" },
            { k: "b", q: "« Pourquoi tu le caches sous le tablier ? »", t: "« Je ne cache rien. Qui sait lire le voit. Qui ne sait pas passe son chemin. »" },
            { k: "c", q: "« … »", t: "« Tu as vu. Alors parle-moi d’autre chose que de mes devoirs. »" }
          ]
        },
        /* la marchandise */
        {
          id: "m1", th: "marchandises", rang: 0,
          stage: "Il pousse du pied un sac de cordes.",
          q: "« Tout ça, tu le trouves où ? »",
          t: "« Des cordes, des pierres, des pages. Ce que les gens laissent derrière eux, je le ramasse. Quelqu’un finit toujours par le chercher. »",
          choix: [
            { k: "a", q: "« Le bois ne vaut rien ? »", t: "« Le bois brut, presque rien. Le manche taillé, trois fois plus. »" },
            { k: "b", q: "« Et les pages de Livre ? »", t: "« Ramassées au vent. Quelqu’un les cherche toujours. Je ne lis pas ce que je vends. »" },
            { k: "c", q: "« … »", t: "« Touche, tu peux toucher. Rien ici ne mord. »" }
          ]
        },
        {
          id: "m2", th: "marchandises", rang: 0, cond: { page: "p01" },
          stage: "Il retourne une planche et suit l’arête avec l’ongle.",
          q: "« Les pages de mon Livre, tu les as écrites ? »",
          t: "« J’ai ramassé les pages de ton Livre comme le reste. Je ne les ai pas écrites. Elles ne sont à personne. »",
          choix: [
            { k: "a", q: "« Qui les a perdues ? »", t: "« Ceux qui marchaient avant toi. Les feuilles volent quand les mains s’endorment. »" },
            { k: "b", q: "« Tu ne les as pas lues ? »", t: "« Je pèse le papier, pas les mots. Les mots ne font pencher aucun plateau. »" },
            { k: "c", q: "« Elles me sont utiles. »", t: "« Alors achète-les. Le savoir a le prix qu’on lui donne. »" }
          ]
        },
        {
          id: "m3", th: "marchandises", rang: 0, renouv: true,
          stage: "Il tapote une caisse d’outils.",
          q: "« Qu’est-ce que je devrais vendre, selon toi ? »",
          t: "« Je rachète tout, mais jamais au prix où je vends. Vends ce qui t’encombre. Garde ce qui te manque. »",
          choix: [
            { k: "a", q: "« Les surplus de récolte ? »", t: "« Le bois et la pierre partent bien quand tes caisses débordent. Les pièces finies rapportent plus. »" },
            { k: "b", q: "« Tu ne vends pas à perte ? »", t: "« Jamais. Mes marges paient l’huile de mes rouages. »" },
            { k: "c", q: "« Mes poches sont pleines. »", t: "« Dépose sur le plateau. L’or est plus léger à transporter que le granite. »" }
          ]
        },
        {
          id: "m4", th: "marchandises", rang: 0, renouv: true,
          stage: "Il secoue un bocal de grenaille.",
          q: "« Ton prix baisse, quand je te vends la même chose ? »",
          t: "« Si tu me vends cent fois la même chose, mon prix baisse. Mes plateaux se fatiguent. À ta prochaine relève, il remonte. »",
          choix: [
            { k: "a", q: "« La baisse est définitive ? »", t: "« Non, elle s’efface à la relève. Varie tes ventes si tu veux garder de bons cours. »" },
            { k: "b", q: "« Tu satures ton stock ? »", t: "« Mes étagères plient. Quand j’ai trop de silex, je le paie au rabais. »" },
            { k: "c", q: "« Je vendrai autre chose. »", t: "« C’est plus sage. Apporte-moi des pièces ouvragées, elles tiennent moins de place. »" }
          ]
        },
        {
          id: "m5", th: "marchandises", rang: 1, renouv: true,
          stage: "Il vérifie une feuille de commandes.",
          q: "« Tes demandes, tu les choisis comment ? »",
          t: "« Je ne te demande que ce que tu sais déjà fabriquer, de ton âge ou du précédent. Ma liste change avec l’heure. »",
          choix: [
            { k: "a", q: "« Qu’est-ce que j’y gagne ? »", t: "« Des Souvenirs et de la confiance. Plus tu livres, plus j’ouvre mes réserves. »" },
            { k: "b", q: "« Tu demandes des quantités raisonnables ? »", t: "« Mes commandes suivent ce que tes ateliers produisent. Je ne demande pas la lune à qui n’a qu’un bâton. »" },
            { k: "c", q: "« Et si je n’ai pas le temps ? »", t: "« La liste tournera. Je pars en tournée, puis je reviens avec d’autres besoins. »" }
          ]
        },
        /* les terres */
        {
          id: "t1", th: "terres", rang: 0,
          stage: "Il désigne du menton l’herbe derrière ses tonneaux.",
          q: "« Pourquoi ton comptoir est là, au milieu de rien ? »",
          t: "« J’ai posé mon comptoir ici parce que des routes se croisent. Il y en a encore, sous l’herbe. »",
          choix: [
            { k: "a", q: "« Où allaient ces routes ? »", t: "« D’un bord à l’autre, comme aujourd’hui. Avec moins d’herbe dessus. »" },
            { k: "b", q: "« Tu en as suivi une ? »", t: "« Une seule, vers la rivière. Elle s’arrêtait à l’eau. Je ne nage pas. »" },
            { k: "c", q: "« Et l’autre côté ? »", t: "« Je n’y suis pas allé. Ma balance ne voyage pas. »" }
          ]
        },
        {
          id: "t2", th: "terres", rang: 0, renouv: true,
          stage: "Il soulève le loquet de son comptoir, puis le laisse retomber.",
          q: "« Un passage, il faut le remplir d’un coup ? »",
          t: "« Un passage garde ce que tu y déposes. Tu peux revenir le finir en plusieurs fois. »",
          choix: [
            { k: "a", q: "« Les ressources déposées ne disparaissent pas ? »", t: "« Jamais. Ce qui est posé au seuil attend ton retour, même après une longue absence. »" },
            { k: "b", q: "« Qu’est-ce qui bloque une terre ? »", t: "« La nature du terrain. Sans torche, sans protection, tes mains n’avancent pas. »" },
            { k: "c", q: "« J’avance petit à petit. »", t: "« C’est la seule manière d’ouvrir une route sans y laisser ses forces. »" }
          ]
        },
        {
          id: "t3", th: "terres", rang: 1, cond: { frag: "gue2" },
          stage: "Il tourne un galet plat entre ses paumes.",
          q: "« Tu as vu quelque chose, à l’autre rive du gué ? »",
          t: "« Les marches du gué descendent sous l’eau. Je n’y suis jamais allé : il me faudrait garder de l’air avec moi. »",
          choix: [
            { k: "a", q: "« Il y a des marches sous la surface ? »", t: "« Des marches taillées dans la roche. L’eau les recouvre, mais le fond est profond. »" },
            { k: "b", q: "« Comment garder de l’air sous l’eau ? »", t: "« Une cloche de plongeur, peut-être. Du verre et du cuir bien étanches. »" },
            { k: "c", q: "« Tu n’as pas essayé de plonger ? »", t: "« Mes engrenages rouillent. L’eau est bonne pour les poissons, pas pour moi. »" }
          ]
        },
        {
          id: "t4", th: "terres", rang: 1, cond: { frag: "porte" },
          stage: "Il range une clé rouillée sans serrure.",
          q: "« Cette porte au fond de la galerie, tu l’as ouverte ? »",
          t: "« Mes clients essaient leurs clés sur la porte de la galerie, puis leurs épaules. Rien de tout ça ne l’ouvre. »",
          choix: [
            { k: "a", q: "« Il faut une clé spéciale ? »", t: "« La pierre n’a pas de trou de serrure. Elle attend autre chose qu’un bout de métal. »" },
            { k: "b", q: "« La force ne suffit pas ? »", t: "« Même avec un bélier, le linteau ne bougerait pas d’un pouce. »" },
            { k: "c", q: "« Tu as un indice ? »", t: "« Écoute la pierre quand le vent souffle dans la galerie. Elle résonne. »" }
          ]
        },
        {
          id: "t5", th: "terres", rang: 1, cond: { frag: "journal" },
          stage: "Il feuillette un carnet jauni aux coins cornés.",
          q: "« Les billets du Désert, ça servait à quoi ? »",
          t: "« Au Désert, on vendait des billets pour un seul trajet. Personne n’est revenu les faire rembourser. »",
          choix: [
            { k: "a", q: "« Ils partaient où ? »", t: "« Vers les rails du sud. Une gare sous le sable, là où le vent siffle fort. »" },
            { k: "b", q: "« Pourquoi un seul trajet ? »", t: "« Les départs ne prévoyaient pas de retour. Tout était pensé pour l’aller simple. »" },
            { k: "c", q: "« Tu en as gardé un ? »", t: "« Un ticket perforé. Il ne vaut plus rien, sauf pour qui cherche le tracé. »" }
          ]
        },
        {
          id: "t6", th: "terres", rang: 2, renouv: true, cond: { age: 2 },
          stage: "Il pointe son index vers la remise.",
          q: "« Et quand un lieu me réclame quelque chose ? »",
          t: "« Si tu sais quel objet manque pour explorer un lieu, regarde sa recette avant de repartir. »",
          choix: [
            { k: "a", q: "« Le Carnet me dira comment le faire ? »", t: "« Le Carnet te donne les ingrédients et le bon geste. Inutile de chercher au hasard. »" },
            { k: "b", q: "« Et si je n’ai pas la matière ? »", t: "« Regarde d’où elle vient dans ton Domaine. Chaque terre cache sa ressource. »" },
            { k: "c", q: "« Je prépare mon sac avant de marcher. »", t: "« Sage décision. Revenir les mains vides use les semelles pour rien. »" }
          ]
        },
        /* les mains du joueur : des conseils */
        {
          id: "h1", th: "mains", rang: 0, renouv: true,
          stage: "Il prend ta main et la retourne, sans délicatesse.",
          q: "« Comment on apprend un geste à un automate ? »",
          t: "« Fabrique la pièce une fois à la main. Les automates pourront ensuite la refaire pour toi. »",
          choix: [
            { k: "a", q: "« Il suffit d’un exemplaire ? »", t: "« Un seul. Le premier guide les leviers. Après, le bois et le métal imitent tes doigts. »" },
            { k: "b", q: "« Tu regardes toujours les mains ? »", t: "« Les yeux mentent, les mains moins. Elles ont des cals là où on travaille. »" },
            { k: "c", q: "« … »", t: "« Tu me laisses faire. Les nouveaux retirent toujours leur main trop vite. »" }
          ]
        },
        {
          id: "h2", th: "mains", rang: 0, renouv: true, cond: { age: 1 },
          stage: "Il laisse tomber une poignée de sciure sur le plateau.",
          q: "« À quoi ça sert d’étudier une ressource ? »",
          t: "« Étudie une ressource pour savoir quelles actions tenter avec. L’Atelier peut toutes les étudier d’un coup, contre de l’Intuition. »",
          choix: [
            { k: "a", q: "« Comment tu sais ce que j’ai étudié ? »", t: "« Tu portes moins, tu choisis mieux. Un objet qu’on connaît, on le pose au bon endroit. »" },
            { k: "b", q: "« L’Intuition est précieuse ? »", t: "« Elle éclaire les réactions cachées. Dépense-la pour gagner du temps sur l’établi. »" },
            { k: "c", q: "« Tu as tout appris, toi ? »", t: "« Je pèse, je n’apprends pas. Ce que je pèse, je le connais de la main. »" }
          ]
        },
        {
          id: "h3", th: "mains", rang: 1, renouv: true,
          stage: "Il trace un cercle avec son compas d’ébène.",
          q: "« Et une recette que je n’arrive pas à trouver ? »",
          t: "« Tu peux déchiffrer une recette par étapes, contre de l’Intuition. Garde-la pour celles que tes tentatives à l’Atelier ne t’ont pas encore apprises. »",
          choix: [
            { k: "a", q: "« Le geste se révèle peu à peu ? »", t: "« D’abord la chaleur, puis les matières, enfin l’action. Chaque pas réduit le brouillard. »" },
            { k: "b", q: "« Vaut-il mieux chercher soi-même ? »", t: "« Le geste trouvé par tes mains coûte moins cher. Déchiffre seulement quand tu butes. »" },
            { k: "c", q: "« Je préfère essayer toutes les combinaisons. »", t: "« Tu y passeras tes journées. Mais l’expérience forme le maître, après tout. »" }
          ]
        },
        {
          id: "h4", th: "mains", rang: 1, renouv: true,
          stage: "Il tape sur un carnet relié de cuir épais.",
          q: "« Qu’est-ce qui reste, quand je passe le relais ? »",
          t: "« Tu gardes tes recettes et les améliorations achetées avec tes Souvenirs. Quant aux ruines, les réparer coûte bien moins cher que de tout reconstruire. »",
          choix: [
            { k: "a", q: "« Les ruines restent ouvertes ? »", t: "« Les murs restent debout. Il suffit de quelques pièces pour réveiller les machines. »" },
            { k: "b", q: "« Les Souvenirs sont éternelles ? »", t: "« Gravées dans la pierre. Aucun départ n’efface ce que la mémoire a acquis. »" },
            { k: "c", q: "« Je reconstruirai plus vite au prochain cycle. »", t: "« Chaque relève va deux fois plus vite que la précédente. C’est la loi du Domaine. »" }
          ]
        },
        {
          id: "h5", th: "mains", rang: 0, cond: { cycle: 2 },
          stage: "Il observe tes paumes durcies par le silex.",
          q: "« Tu ne me demandes jamais d’où je viens ? »",
          t: "« Tes paumes sont déjà dures. Je regarde, c’est tout. Je ne demande pas pourquoi. »",
          choix: [
            { k: "a", q: "« D’où viennent les autres ? »", t: "« De la clairière, toujours. Les premiers pas chancellent, puis le pas s’affermit. »" },
            { k: "b", q: "« Mes mains ont travaillé dur. »", t: "« Je le vois aux échardes et aux cals. Les mains de bois savent ce que coûte un bâton. »" },
            { k: "c", q: "« Tu en as vu passer beaucoup ? »", t: "« Assez pour ne plus compter les réveils. Seuls les comptes de mon livre m’importent. »" }
          ]
        },
        /* le ciel */
        {
          id: "s1", th: "ciel", rang: 0, cond: { has: "lunette" },
          stage: "Il lève à peine la tête, comme pour vérifier le toit.",
          q: "« Tu as déjà regardé le ciel, la nuit ? »",
          t: "« J’ai vu l’étoile rouge, l’autre soir. Elle clignotait. Je lui ai demandé ce qu’elle vendait. Elle n’a pas répondu. »",
          choix: [
            { k: "a", q: "« Tu regardes souvent là-haut ? »", t: "« Le soir, quand la balance est juste. Là-haut, il y a de la place, beaucoup de place. »" },
            { k: "b", q: "« L’étoile clignote toujours au même rythme ? »", t: "« Trois temps courts, un temps long. Une régularité d’horloge, pas de flamme. »" },
            { k: "c", q: "« … »", t: "« Regarde toi-même avec ta lunette. Je ne décris pas ce qui ne se pèse pas. »" }
          ]
        },
        {
          id: "s2", th: "ciel", rang: 1, cond: { has: "lunette" },
          stage: "Il fait tourner une pièce ronde sur le zinc.",
          q: "« Et la Lune, elle vaut combien ? »",
          t: "« La Lune ressemble à une pièce. J’ai voulu payer avec, une fois. Elle n’a jamais rendu la monnaie. »",
          choix: [
            { k: "a", q: "« Elle change de forme avec les nuits. »", t: "« Elle s’arrondit, puis elle maigrit. Comme une bourse après le marché. »" },
            { k: "b", q: "« On peut monter là-haut ? »", t: "« Il faudrait une échelle bien longue. Et des semelles qui ne craignent pas le vide. »" },
            { k: "c", q: "« Elle éclaire le comptoir sans chandelle. »", t: "« Une lumière froide. Elle n’échauffe pas les plateaux. »" }
          ]
        },
        {
          id: "s3", th: "ciel", rang: 2, cond: { has: "lunette" },
          stage: "Il pose sa chandelle au bord du plateau et la laisse brûler.",
          q: "« Ces lumières qui clignotent, tu les as comptées ? »",
          t: "« Ces éclats reviennent dans le même ordre depuis des années. J’ai eu le temps de les regarder entre deux pesées. »",
          choix: [
            { k: "a", q: "« C’est un message ? »", t: "« Une phrase répétée sans fin. Quelqu’un a laissé la voix allumée là-haut avant de partir. »" },
            { k: "b", q: "« Elle descend au fil des cycles ? »", t: "« Plus basse, oui. Elle éclaire le bord de mon toit à chaque automne. »" },
            { k: "c", q: "« Elle te fait peur ? »", t: "« Je range mes clous. On range, on ne prie pas. »" }
          ]
        },
        /* les Anciens */
        {
          id: "a1", th: "avant", rang: 0,
          stage: "Il essuie le plateau avec le dos de sa manche.",
          q: "« Les Anciens, ils venaient chez toi ? »",
          t: "« Les Anciens achetaient tout et revenaient en demander davantage. Je ne sais rien d’autre d’eux. »",
          choix: [
            { k: "a", q: "« Ils payaient avec quoi ? »", t: "« Des pièces, les mêmes que les tiennes. Plus lourdes, frappées d’un chiffre net. »" },
            { k: "b", q: "« Ils te parlaient ? »", t: "« Ils commandaient. Une voix qui commande ne demande rien d’autre. »" },
            { k: "c", q: "« … »", t: "« Rien à ajouter. Ils sont partis, je suis resté. »" }
          ]
        },
        {
          id: "a2", th: "avant", rang: 1,
          stage: "Il remet droit un pot de clous qui n’était pas de travers.",
          q: "« Tu te souviens du jour où tout s’est arrêté ? »",
          t: "« Je pesais une pomme quand tout s’est arrêté, moi compris. Quand j’ai repris, la pomme avait disparu. »",
          choix: [
            { k: "a", q: "« Tu es resté figé longtemps ? »", t: "« Le temps ne s’écoule pas quand la balance est gelée. À mon réveil, l’herbe avait tout couvert. »" },
            { k: "b", q: "« La pomme a pourri sur place ? »", t: "« Pas une trace. Mon plateau penchait encore. J’attends toujours qu’on me la paie. »" },
            { k: "c", q: "« Tu étais déjà derrière ce comptoir ? »", t: "« Derrière ce comptoir, oui. Le comptoir n’a pas bougé, moi si. »" }
          ]
        },
        {
          id: "a3", th: "avant", rang: 1, cond: { cycle: 2 }, apres: "a2",
          stage: "Il tapote une pierre lisse posée près de sa caisse.",
          q: "« Et toi, comment tu t’es réveillé ? »",
          t: "« Quelqu’un m’a demandé une corde en posant un caillou sur le plateau. Quand la balance a bougé, je me suis réveillé. »",
          choix: [
            { k: "a", q: "« C’était un premier Semeur ? »", t: "« Un enfant aux mains nues. Il avait froid. Je lui ai donné la corde contre le caillou. »" },
            { k: "b", q: "« Le caillou valait une corde ? »", t: "« Sur le moment, oui. Le poids était juste. La balance a frémi, mes rouages sont repartis. »" },
            { k: "c", q: "« Tu as gardé ce caillou ? »", t: "« Il est sous mon tablier. Le premier troc ne s’oublie pas. »" }
          ]
        },
        {
          id: "a4", th: "avant", rang: 3, cond: { signe: "nourrice" },
          stage: "Il abaisse la voix sans quitter des yeux son plateau.",
          q: "« Quelqu’un d’autre vient te voir, parfois ? »",
          t: "« [nourrice] vient aussi, parfois. Je lui vends comme à toi. Je ne lui dois rien. »",
          choix: [
            { k: "a", q: "« Elle achète quoi chez toi ? »", t: "« De l’huile, du fil fin. Elle paie sans marchander et repart vers le caveau. »" },
            { k: "b", q: "« Elle ne commande pas ici ? »", t: "« Elle commande aux automates, pas à moi. Je vends à tout le monde, sans courbettes. »" },
            { k: "c", q: "« Tu sais ce qu’elle garde là-bas ? »", t: "« Elle garde ceux qui dorment. Mais les dormeurs ne m’achètent rien. »" }
          ]
        },
        /* les clients : des clins d’œil, et ce que le joueur a en poche */
        {
          id: "k1", th: "clients", rang: 1,
          stage: "Il regarde la route par-dessus ton épaule.",
          q: "« Tu as eu des clients bizarres, ces derniers temps ? »",
          t: "« Un client est passé avec une serviette autour du cou. Il m’a dit de ne pas paniquer. Je ne panique jamais. »",
          choix: [
            { k: "a", q: "« Il cherchait quelque chose ? »", t: "« Une tasse de thé et un guide. Je n’avais que du thé froid. Il est reparti vers les étoiles. »" },
            { k: "b", q: "« Pourquoi une serviette ? »", t: "« Il prétendait que c’est l’outil le plus utile de tout l’univers. Mes balances disent le contraire. »" },
            { k: "c", q: "« … »", t: "« Mes rouages ignorent la panique, mais pas l’humidité. »" }
          ]
        },
        {
          id: "k2", th: "clients", rang: 1,
          stage: "Il balaie quelques tessons de terre cuite sur le coin de l’étal.",
          q: "« Quelqu’un a cassé quelque chose, chez toi ? »",
          t: "« Un garçon en vert a cassé trois de mes pots pour regarder dedans. Il m’a laissé quelques sous. Il ne dit rien, il ramasse. »",
          choix: [
            { k: "a", q: "« Il y avait quoi dans les pots ? »", t: "« Deux graines et de la poussière. Il a poussé un cri aigu et a foncé dans l’herbe. »" },
            { k: "b", q: "« Il a tout remboursé ? »", t: "« Trois rubis verts. Ils ont le même poids que mes pièces de cuivre. »" },
            { k: "c", q: "« Au moins, il payait sa vaisselle. »", t: "« C’est vrai. Mais balayer les tessons me prend du temps sur les comptes. »" }
          ]
        },
        {
          id: "k3", th: "clients", rang: 2, cond: { age: 3 },
          stage: "Il soupèse un sac de toile grise.",
          q: "« On t’a déjà fait un drôle d’échange ? »",
          t: "« Un client a troqué une idole en or contre un sac de sable, au même poids. Il est parti en courant. Une grosse pierre roulait derrière lui. »",
          choix: [
            { k: "a", q: "« L’or était vrai ? »", t: "« Pur à dix-huit carats. Le sable pesait exactement pareil. Je n’ai rien remboursé. »" },
            { k: "b", q: "« La pierre l’a écrasé ? »", t: "« Je ne regarde pas au-delà de la palissade. Mais il courait très vite avec son chapeau. »" },
            { k: "c", q: "« Belle affaire pour toi. »", t: "« Une affaire est une affaire quand le poids est égal des deux côtés. »" }
          ]
        },
        {
          id: "k4", th: "clients", rang: 2,
          stage: "Il renifle une boîte en fer blanc.",
          q: "« Un gâteau a déjà traîné sur ton comptoir ? »",
          t: "« Un client a laissé un gâteau sur mon comptoir en jurant qu’il était vrai. Je ne l’ai pas goûté. »",
          choix: [
            { k: "a", q: "« Il sentait bon ? »", t: "« La vanille et le métal. Je me méfie des promesses trop sucrées. »" },
            { k: "b", q: "« C’était un mensonge ? »", t: "« Les balances ne mentent pas. Il pesait moins qu’une plume. J’ai jeté la boîte. »" },
            { k: "c", q: "« Je ne goûte pas les promesses non plus. »", t: "« Tu as bien raison. Le sucre attire les fourmis, pas la fortune. »" }
          ]
        },
        {
          id: "k5", th: "clients", rang: 2,
          stage: "Il secoue la tête d’un air las.",
          q: "« Tu as un habitué qui parle tout seul ? »",
          t: "« Un client répète toujours « c’est pas faux ». Il ne dit jamais à quoi. »",
          choix: [
            { k: "a", q: "« Tu lui as demandé pourquoi ? »", t: "« Dès que j’utilise un mot de trois syllabes, il me sort sa phrase. Le marchandage dure des heures. »" },
            { k: "b", q: "« Il achète quelque chose au moins ? »", t: "« Une côtelette ou un bol de soupe. Puis il repart chercher un graal imaginaire. »" },
            { k: "c", q: "« C’est pas faux. »", t: "« Toi aussi, tu t’y mets ? Parle droit ou va couper du bois. »" }
          ]
        },
        {
          id: "p1", th: "clients", rang: 0, cond: { has: "poudre_rouge" },
          stage: "Il recule d’un pas et souffle sur la poussière.",
          q: "« Ma poudre rouge, tu la veux ? »",
          t: "« Ta poudre rouge crépite. Pose-la loin de mes balances. Je ne rachète pas les comptoirs brûlés. »",
          choix: [
            { k: "a", q: "« Ça sert pour les circuits et les signaux. »", t: "« Garde tes signaux pour tes machines. Mes balances fonctionnent au poids, pas à l’étincelle. »" },
            { k: "b", q: "« Tu as peur du feu ? »", t: "« Le bois sec brûle vite. Et je n’ai pas l’intention de finir en cendres pour quelques grains rouges. »" },
            { k: "c", q: "« Je la range dans ma poche. »", t: "« Merci. Mes balances te remercient aussi. »" }
          ]
        },
        {
          id: "p2", th: "clients", rang: 0, cond: { has: "anneau_lourd" },
          stage: "Il plisse les yeux en regardant ta main.",
          q: "« Cet anneau, il vaut quelque chose ? »",
          t: "« Cet anneau tout simple. Ne le mets pas à ton doigt. Il pèse plus que son poids, et il connaît le chemin du retour. »",
          choix: [
            { k: "a", q: "« Il est en or massif ? »", t: "« L’or ne chuchote pas dans la tête. Cet anneau a un maître, et ce n’est pas toi. »" },
            { k: "b", q: "« Tu ne veux pas l’acheter ? »", t: "« Je ne veux pas attirer d’ombres sous mon auvent. Jette-le dans une montagne si tu peux. »" },
            { k: "c", q: "« Je le garde au fond de mon sac. »", t: "« Laisse-le bien au fond. Et n’écoute pas ce qu’il raconte. »" }
          ]
        },
        {
          id: "p3", th: "clients", rang: 0, cond: { has: "quart_coeur" },
          stage: "Il effleure le morceau d’émail écarlate.",
          q: "« Tu as déjà vu un cœur comme celui-là ? »",
          t: "« Un petit cœur rouge, en morceaux. J’en ai déjà vu un dans la poche d’un aventurier. Il en manquait toujours un. »",
          choix: [
            { k: "a", q: "« Il en faut quatre pour le réparer ? »", t: "« Quatre morceaux, oui. Quand ils s’assemblent, on se sent plus solide sous l’armure. »" },
            { k: "b", q: "« Tu as le reste ? »", t: "« Si je l’avais, je l’aurais déjà vendu à prix d’or. Cherche dans les coffres oubliés. »" },
            { k: "c", q: "« C’est joli à regarder. »", t: "« Ça brille d’un éclat doux. Au moins, ça ne fait pas de bruit sur le plateau. »" }
          ]
        },
        {
          id: "p4", th: "clients", rang: 0, cond: { has: "de_vingt" },
          stage: "Il fait rouler le dé à facettes sur le bois.",
          q: "« On joue, avec ce dé ? »",
          t: "« Un dé à vingt faces. Je ne joue pas contre. La première fois, il tombe toujours juste. »",
          choix: [
            { k: "a", q: "« Tu crains de perdre ? »", t: "« Le hasard truqué ne m’intéresse pas. Sur vingt faces, il y a dix-neuf façons de perdre son temps. »" },
            { k: "b", q: "« C’est pour tester la chance. »", t: "« Les marchands ne comptent pas sur la chance. Ils comptent sur la tare et le poids. »" },
            { k: "c", q: "« Un coup pour voir ? »", t: "« Non. Range ce dé avant qu’il ne fasse apparaître un dragon sous la pluie. »" }
          ]
        },
        {
          id: "p5", th: "clients", rang: 0, cond: { has: "fouet_cuir" },
          stage: "Il repousse la lanière tressée du bout d’une règle.",
          q: "« Ce fouet te dérange ? »",
          t: "« Un fouet. Passe tes nuits ailleurs que chez moi. Mes chandelles ont peur. »",
          choix: [
            { k: "a", q: "« C’est pour repousser les bêtes de la nuit. »", t: "« Les bêtes ont des crocs, les chauves-souris aussi. Mes planches n’aiment pas les claquements. »" },
            { k: "b", q: "« C’est du bon cuir tressé. »", t: "« Du cuir résistant, oui. Mais ça ne sert pas à peser des carottes. »" },
            { k: "c", q: "« Je le range à ma ceinture. »", t: "« Garde-le attaché. Je tiens à mes vitrines et à mes bocaux. »" }
          ]
        }
      ]
    },

    /* ------------------------------------------------- LES FOUILLES (expéditions longues)
     * Un lieu déjà exploré se fouille de nouveau en trois niveaux (D.FOUILLE). À chaque niveau, une
     * parole du lieu quand il en a une (lignes), sinon une phrase d’usage (generiques). Au dernier
     * niveau, quelques lieux en ouvrent un autre à côté (cotes). Rien ne s’y dit en clair. */
    fouille: {
      lignes: {
        "lisiere:chene": [
          "En faisant le tour de l’arbre, tu repères une large trace dans l’herbe, comme celle d’un traîneau. Elle part vers la clairière avant de s’effacer.",
          "Entre les racines, de petits ronds de terre tassée s’alignent. Quelque chose de lourd y a été posé plusieurs fois, en avançant un peu à chaque fois.",
          "Tu suis les ronds jusqu’à la clairière. Ils s’arrêtent là, au bord de l’herbe haute."
        ],
        "lisiere:grotte": [
          "Tu comptes les petites mains, une à une. Les plus usées sont les plus basses : on les touchait souvent, à hauteur d’enfant.",
          "Couché contre la paroi, tu vois la fresque à l’envers : les canots semblent descendre au lieu de monter.",
          null
        ],
        "plaine:champ_os": [
          "Tu retournes les os un par un, sans trouver de bête brisée. Un sentier à peine marqué s’éloigne vers l’est, droit comme un trait.",
          "Une gourde de peau bouchée repose entre les côtes d’une bête énorme. Elle est pleine d’eau claire et personne n’y a touché.",
          "Le sentier mène à une margelle de pierre, à demi cachée dans l’herbe."
        ],
        "plaine:tumulus": [
          "Tu frottes la plaque du revers de la main sans y trouver de rouille ni de rayure.",
          "Au pied de la butte, la terre sonne creux par endroits. Des machines sont couchées dessous, enterrées jusqu’aux roues.",
          null
        ],
        "riviere:gue": [
          "Tu comptes les marches qui descendent dans l’eau. Elles sont lisses, usées au milieu comme celles d’une maison.",
          null,
          null
        ],
        "riviere:carcasse": [
          "Dans la pince, l’oiseau n’a pas bougé. Les roues ont tracé un second sillon, qui longe la rive vers l’aval.",
          "Le second sillon descend jusqu’à l’eau. Il ne ressort pas de l’autre côté.",
          "Au bout du sillon, un câble sort de l’eau et traverse la rivière jusqu’à une forme plate qui flotte."
        ],
        "collines:rails": [
          "Tu t’allonges sous le wagonnet. Le sol est sec et rien n’a abîmé la machine, arrêtée là depuis des siècles.",
          null,
          null
        ],
        "mine:filon": [
          "La roche est tiède sous ta paume. Sa chaleur augmente à mesure que tu descends dans la galerie.",
          null,
          null
        ],
        "desert:ville": [
          "Sous les tôles que tu soulèves, des valises sont rangées par taille et étiquetées d’un numéro de ligne, de 1 à 12. Toutes sont fermées.",
          "Au bout de la rue, toutes les flèches peintes au sol mènent au même long bâtiment aux fenêtres alignées.",
          "Tu pousses la porte du long bâtiment. À l’intérieur, des rangées de bancs font face au même mur."
        ],
        "orbite:station_morte": [
          "Tu flottes d’une cabine à l’autre. Les lits sont faits. Dans le couloir, une plaque est vissée de l’intérieur sur ce qui devait être un hublot.",
          "Autour des vis, de nombreuses traces de doigts montrent les tentatives pour ouvrir cette plaque. Elle tient toujours.",
          "La plaque cède quand tu retires la quatrième vis. Derrière la vitre apparaît la Terre."
        ],
        "lune:tranquillite": [
          "La poussière garde des empreintes de bottes, tout autour de la plaque. Rien ne les a effacées.",
          null,
          null
        ],
        "mercure:bras": [
          "Tout près de toi, un bras tient encore une poignée de gravier dont aucun grain ne s’est détaché.",
          null,
          null
        ]
      },
      /* pour un lieu sans parole : une phrase d’usage par niveau, deux au choix ; la seconde sert aussi aux fouilles refaites */
      generiques: [
        ["Tu reviens les mains pleines de poussière.", "Tu as parcouru le lieu et rassemblé ce que tu pouvais emporter."],
        ["En prenant le temps de fouiller, tu as atteint les recoins laissés de côté à ta première visite.", "Tu as creusé là où tu ne regardais pas la première fois."],
        ["Tu as soulevé chaque pierre pour fouiller la terre en dessous.", "Tu rentres à la nuit après avoir tout retourné, jusqu’aux pièces les plus lourdes."]
      ],
      refaite: ["Tu connais le lieu par cœur et rapportes ce que tu y trouves.", "Rien de neuf, mais tes poches ne sont pas vides."],
      /* les lieux qui s’ouvrent à côté : de la terre, du lieu qu’il faut avoir retourné à fond, et le lieu lui-même */
      cotes: [
        { z: "lisiere", parent: "chene", id: "ronds", n: "Les Ronds d’herbe", dur: 60 },
        { z: "plaine", parent: "champ_os", id: "puits", n: "Le Puits", dur: 75 },
        { z: "riviere", parent: "carcasse", id: "bac", n: "Le Bac", dur: 90 },
        { z: "desert", parent: "ville", id: "attente", n: "La Salle d’attente", dur: 110 },
        { z: "orbite", parent: "station_morte", id: "hublot", n: "Le Hublot", dur: 120 }
      ],
      ui: {
        titre: "Fouiller de nouveau",
        aide: "Progression active hors ligne. Butin à récupérer sur la Carte en fin de fouille.",
        busy: "Fouille déjà active. Butin à récupérer avant le prochain départ.",
        avant1: "Termine « Un tour » et récupère le butin pour ouvrir « Une fouille ».",
        avant2: "Termine « Une fouille » et récupère le butin pour ouvrir le dernier niveau.",
        fait: "Déjà fait",
        parti: "Fouille lancée (continue hors ligne).",
        chip: "Fouille",
        chipReste: "reste",
        chipPret: "terminée · Récupérer le butin",
        prete: "Fouille terminée. Butin disponible sur la Carte.",
        kicker: "Fouille",
        rapporte: "Butin récupéré",
        nouveau: "Nouveau lieu sur la Carte",
        entendu: "Ce que tu y as entendu",
        pasFini: "Fouille en cours."
      }
    },

    /* ------------------------------------------------- PHRASES DE L’INTERFACE */
    ui: {
      capsule: "Au pied du Grand Chêne, une capsule de verre t’attend, avec quelques matériaux et un enregistrement. Ta propre voix :\n\n« Salut. C’est toi. Enfin, toi d’avant. Fais confiance à tes mains. »",
      ecoute0: "Le signal se répète par groupes, sans mots que tu reconnaisses.",
      ecoute1: "La même phrase, encore et encore, chantée par des milliers de voix.",
      kher0: "Elle clignote par petits groupes.",
      kher7: "ARCHE la dit dangereuse. Elle clignote par petits groupes.",
      kher8: "Elle demande quelque chose.",
      lune: "La Lune. Grise, silencieuse. Tu as l’impression qu’elle te regarde aussi.",
      lune7: "Tu fixes la Lune longtemps. Près de la mer de la Tranquillité, un point lumineux clignote par petits groupes : trois, cinq, trois. Un, cinq, un. Une pause, et il recommence. (+3 ✨)",
      lune8: "Toujours les mêmes groupes.",
      tirer: "« FAIS-LE, SEMEUR {semeur}. ILS APPROCHENT. »",
      nuit: "Près du feu éteint, une feuille couverte d’une écriture serrée.",
      comptoir: "« Tu sais lire, maintenant. Tu as vu ? Je ne travaille pas pour elle. » Il soulève une planche du comptoir et en sort des feuilles pliées.",
      feuillet: "Une feuille pliée, glissée dans ton Livre.",
      vierges: "Les étiquettes sont vierges.",
      autres: "Et {n} autres."
    },
    /* le nom de l’enfant de chaque cuve (base64) : la réponse du secret des noms */
    noms64: { 7: "R2FiaW4=", 8: "SMOpbGll", 9: "SW7DqHM=", 10: "SnVsZXM=", 11: "S2VuemE=", 12: "TMOpb24=" },
    nommer: {
      oui: "Oui.",
      revoila: "Te revoilà.",
      surnom: "Tu le diras désormais comme ça.",
      deja: "Tu as déjà donné un nom pendant cet éveil.",
      invite: "Donner un nom"
    }
  };

  const R = D.RECIT;
  /* les noms, décodés au chargement (jamais en clair dans le fichier) */
  R.noms = {};
  for (const c in R.noms64) R.noms[c] = deb64(R.noms64[c]);
  /* les mots des signes, décodés au chargement */
  for (const id in R.signes) R.signes[id].mot = deb64(R.signes[id].m);
  R.deb64 = deb64;

  /* les textes vont à leur place dans les données du jeu */
  Object.assign(D.FRAGS, R.anciens, R.frags);
  Object.assign(D.MELODIES, R.melodies);
  D.ARCHE = R.arche;
  D.TERMINAL = R.terminal;
  D.EVEILS = R.eveils;
  for (const k in R.fins) {
    (R.fins[k].extra || []).forEach((x) => { if (x.t64) x.t = deb64(x.t64); });
    if (D.ENDINGS[k]) Object.assign(D.ENDINGS[k], R.fins[k]);
  }
  for (const pid in R.projets) {
    const P = D.PROJECTS[pid];
    if (!P) continue;
    P.n = R.projets[pid].n; P.d = R.projets[pid].d;
    R.projets[pid].steps.forEach((x, i) => Object.assign(P.steps[i], x));
  }
  if (D.PROJECTS.chant) {
    D.PROJECTS.chant.n = R.chant.n;
    D.PROJECTS.chant.d = R.chant.d;
    R.chant.steps.forEach((s, i) => Object.assign(D.PROJECTS.chant.steps[i], s));
  }
  /* les airs comptent comme secrets (sauf celui qui en ouvre un autre) */
  const exist = new Set(D.SECRETS.map((s) => s.id));
  for (const id in R.melodies) {
    if (!exist.has(id) && R.melodies[id].compte !== false) D.SECRETS.push({ id, k: "air", n: R.melodies[id].n });
  }
  /* les lieux d’à côté rejoignent la fin de la liste de leur terre : la file des explorations
   * s’arrête devant eux (nextExp), ils s’ouvrent par une fouille à fond de leur lieu d’origine */
  (R.fouille.cotes || []).forEach((c) => {
    const Z = D.ZONES.find((z) => z.id === c.z);
    if (Z && !Z.exps.some((x) => x.id === c.id)) Z.exps.push({ id: c.id, n: c.n, dur: c.dur, cote: c.parent, rw: { frag: c.id, intu: 2 } });
  });
  /* les secrets « méta » : leur catégorie ne dit rien */
  [["signature", "La signature"], ["noms", "Les noms"], ["visage", "Le même visage"]].forEach(([id, n]) => {
    if (!exist.has(id)) D.SECRETS.push({ id, k: "?", n });
  });

  if (typeof module !== "undefined" && module.exports) module.exports = R;
})(typeof window !== "undefined" ? window : globalThis);
