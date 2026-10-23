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
          { t: "Trouvée entre les racines. Les numéros vont jusqu’à 32. Elle dit que je suis le premier. J’ai fait un trait sur l’arbre, pour que le deuxième la croie.", sig: "I" },
          { t: "ELLE NE M’A RIEN DIT.", sig: "II" }
        ],
        src: [{ k: "exp", at: "lisiere:chene" }]
      },
      p02: {
        n: 2,
        titre: "Le feu",
        imprime: "Un dessin : un archet tendu sur un bâton, du bois sec, des cailloux posés en cercle. Une flèche va des mains jusqu’au feu. Sur la braise, une poignée d’herbes.\n\nDans le coin, un signe : [faire].",
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
        imprime: "Un manche, une corde, un épieu, chacun dessiné dans la main qui le tient. Dans le coin, un signe : [faire].\n\nTout en bas, plus petit : un éclat de silex tourné vers une poitrine, barré d’un trait, et un signe : [nepas]. Dans la marge, une petite figure taillée dans un os, la main levée.",
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
      p08: {
        n: 8,
        titre: "La flûte",
        imprime: "Un os percé de cinq trous. À côté, cinq lignes horizontales, et un trait qui monte et descend de l’une à l’autre. Des pointillés relient chaque trou à une ligne.\n\n[enfant]",
        notes: [
          { t: "Cinq trous, cinq lignes. Les signes des murs ne se lisent pas : ils se chantent. J’ai chanté celui des tombes. Il est court, et il monte un peu, comme quelqu’un de petit.", sig: "IIII" },
          { t: "Ne chante pas la plaque du Tumulus. Elle n’aime pas ça.", sig: "IIIII", cond: { cycle: 2 } }
        ],
        src: [{ k: "buy", ecus: 450 }]
      },
      p09: {
        n: 9,
        titre: "Celle qui veille",
        imprime: "Une grande silhouette douce, penchée, tient un enfant endormi contre elle.\n\nDessous : [nourrice] · [enfant] [nepas] [manquer]",
        notes: [
          { t: "Elle veille.", sig: "IIIII" },
          { t: "Elle compte.", sig: "IIIII I" }
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
          { t: "Celle-là, mes doigts ne veulent pas.", sig: "IIII" }
        ],
        src: [{ k: "exp", at: "collines:rails" }]
      },
      p12: {
        n: 12,
        titre: "La porte",
        imprime: "Une carte des galeries, sous les collines. Tout au fond, une porte dessinée avec soin, sans poignée. Au bas de la page : [enfant] [dormir].\n\nDans la marge, un petit dessin : une aiguille posée sur une galette d’argile. Elle penche vers la porte.",
        notes: [
          { t: "La porte n’aime que l’aimant.", sig: "IIIII I" }
        ],
        src: [{ k: "exp", at: "mine:filon" }, { k: "buy", ecus: 900 }]
      },
      p13: {
        n: 13,
        titre: "Le marchand",
        imprime: "Un automate trapu derrière un comptoir, une balance à la main. Sur sa poitrine : [nepas] [nourrice]",
        notes: [
          { t: "MENTEUR. IL M’A DIT « ENCORE TOI ». JE NE L’AVAIS JAMAIS VU.", sig: "II" },
          { t: "Il m’a donné une corde pour un caillou. Il ne regarde jamais mes yeux. Il regarde mes mains.", sig: "III" }
        ],
        src: [{ k: "buy", ecus: 600 }]
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
          { t: "Hypothèse : chaque machine attend un geste.", sig: "□", cond: { cycle: 5 } },
          { t: "Le cuivre poli au sable renvoie les visages. Le mien a un chiffre dans l’œil.", sig: "□", cond: { cycle: 5 } }
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
        imprime: "Des canots de feu montent vers une étoile. D’autres flèches en partent et redescendent vers la terre.\n\nDessous : [nous] [revenir] [enfant]. Sous les flèches qui redescendent, seul : [revenir].",
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
          { t: "Il ne fait pas que nourrir.", sig: "IIIII I" },
          { t: "Sous la cinquième côte. Petit comme une phalange. Il ne bat pas en même temps que le cœur.", sig: "IIIII I" }
        ],
        src: [{ k: "exp", at: "riviere:escalier" }]
      },
      p19: {
        n: 19,
        titre: "Les cuves",
        imprime: "Douze cuves en rang, numérotées. Dans chacune, un enfant recroquevillé.\n\nSur chaque plaque : [enfant] [dormir].",
        notes: [
          { t: "On y est bien.", sig: "IIIII" },
          { t: "La mienne brillait comme une étoile. (une bague, dessinée)", sig: "III" },
          { t: "C’est vrai.", sig: "@", cond: { cycle: 4 } }
        ],
        src: [{ k: "exp", at: "caveau:chambre" }]
      },
      p20: {
        n: 20,
        titre: "Le ruban",
        imprime: "La Lune, et dessus, un long ruban qui s’enroule. Une petite lumière à côté.\n\nEn petites lettres : « Si on vous ment, demandez au Registre. Il ne connaît que la Clause. » Dessous : [main] [dabord].",
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
        imprime: "Une carte de la Rivière. Sur une rive, des marches qui descendent sous l’eau. Au-dessus d’un nageur, une cloche retournée, pleine d’air.",
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
          { t: "Là-haut, elle chante plus fort.", sig: "IIII" }
        ],
        src: [{ k: "exp", at: "collines:rails" }]
      },
      p25: {
        n: 25,
        titre: "Les Profondeurs",
        imprime: "Une carte des galeries. Au bout de la plus longue, une porte. Devant elle, une aiguille dessinée sur une galette de terre, la pointe tournée vers la porte.",
        notes: [],
        src: [{ k: "repair", id: "galerie" }]
      },
      p26: {
        n: 26,
        titre: "Le Désert",
        imprime: "Une carte du Désert, des dunes en vagues. Sous la troisième, un quai, et un signe : [revenir].",
        notes: [
          { t: "Le quai est sous la troisième dune.", sig: "□" }
        ],
        src: [{ k: "repair", id: "tamis" }, { k: "exp", at: "desert:ville" }]
      },
      p27: {
        n: 27,
        titre: "La deuxième salle",
        imprime: "Une porte marquée d’un seul signe, [dabord]. Derrière, des socles en rangs, chacun avec un petit objet dessus.",
        notes: [
          { t: "Elle garde tout ce qu’on fait la première fois.", sig: "IIIII I" }
        ],
        src: [{ k: "exp", at: "caveau:coeur" }]
      },
      p28: {
        n: 28,
        titre: "Le ciel",
        imprime: "Des cercles de ciel. Au centre de l’un, une étoile : Kher. Hors de tous les cercles, un point rouge.",
        notes: [
          { t: "Celle-là n’est pas une étoile.", sig: "IIII" }
        ],
        src: [{ k: "exp", at: "collines:nid" }]
      },
      p29: {
        n: 29,
        titre: "Le départ",
        imprime: "Des adultes debout sur un quai, une main levée, la paume ouverte.\n\nDessous : [nous] · [main] [halte].",
        notes: [
          { t: "Maman faisait ça.", sig: "III" }
        ],
        src: [{ k: "exp", at: "desert:quai" }]
      },
      p30: {
        n: 30,
        titre: "La Lune",
        imprime: "La plaque, sur son pied. Au-dessus, une petite lumière, dessinée en traits courts : un groupe, puis un autre.\n\nDessous : [main] [dabord].",
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
          { cond: { cycle: 2 }, t: "Six traits, et le septième, toujours à peine commencé. Celui qui le grave n’en a jamais le temps.\n\nAu pied du tronc, l’herbe garde la forme de quelqu’un d’assis. Deux sillons partent de là, bien droits, vers les collines.\n\nTu cherches un corps. Il n’y en a pas." }
        ]
      },
      grotte2: {
        n: "La Grotte aux Mains", z: "lisiere",
        t: "Des mains au pochoir, ocre et noires, en rangs bien droits : vingt-quatre grandes, puis douze petites. Au bout de chaque rang, peint en noir, le même signe : [main]. Sous les grandes, un autre : [nous].\n\nPlus haut, des canots de feu montent vers une lueur rouge ; d’autres en reviennent, sous [nous] [revenir] [enfant]. Plus bas, des silhouettes couchées, les yeux fermés : [dormir]. Au-dessus de tout, une grande paume levée : [halte].\n\nPrès de l’entrée, des os percés de petits trous sont alignés sur une pierre plate. Quand le vent souffle, ils chantent.",
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
        t: "Entre deux racines, la pierre plate a bougé. Dessous, un trou creusé à la main, juste assez large pour un bras.\n\nAu fond, une boîte d’écorce fermée par une cheville d’os. Dedans, deux feuilles couvertes de petits traits, rangés par cinq.",
        revisit: [
          { cond: { cycle: 2 }, t: "La boîte d’écorce est vide. Dans la terre, la marque de tes doigts, et d’autres, plus anciennes, exactement de la même largeur." }
        ]
      },
      ossements2: {
        n: "Le Champ des Os", z: "plaine",
        t: "Des os de bêtes énormes, blanchis par le soleil. Au milieu, six squelettes plus petits, humains, couchés sur le dos, les mains croisées sur la poitrine. Chacun serre un éclat de silex dans son poing.\n\nÀ la tête de chacun, une pierre plate porte le même signe, [enfant], et des traits : un, deux, trois, jusqu’à six. Sur la première, une petite figure taillée dans un os, la main levée.\n\nLe sixième est le plus récent. Il a encore toutes ses dents. Sur une côte, à gauche, une entaille nette.",
        revisit: [
          { cond: { cycle: 2 }, t: "Tu comptes encore. Six. Personne n’a couché de septième ici.\n\nLes poings sont toujours fermés. Personne ne les a ouverts." }
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
        t: "Tu t’agenouilles près du premier et tu ouvres sa main, un doigt après l’autre. L’os cède sans bruit. Dans la paume, un éclat de silex, le tranchant tourné vers le haut.\n\nTu ouvres les six mains. Six éclats, tenus de la même façon. Sous le dernier, une feuille pliée, très usée.",
        revisit: [
          { cond: { cycle: 2 }, t: "Les six mains sont ouvertes, comme tu les as laissées. Personne n’est venu les refermer." }
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
        t: "Une machine énorme, à moitié enterrée dans la berge. Six roues, un bras replié comme la patte d’un insecte mort. Sur son flanc, sous le numéro 12 :\n\n[machine] · [enfant] [dormir]\n\n[machine] [nepas] [faire] · [main] [faire] [dabord]\n\nDans sa pince, un squelette d’oiseau minuscule, posé avec soin.\n\nSes roues ont laissé dans la berge deux sillons qui partent vers la Plaine. L’herbe ne les a jamais tout à fait recouverts.",
        revisit: [
          { cond: { cycle: 2 }, t: "Tu essaies d’ouvrir la pince pour prendre l’oiseau. Elle ne cède pas.\n\nElle serre juste assez pour le tenir, sans l’écraser." }
        ]
      },
      escalier: {
        n: "L’Escalier Noyé", z: "riviere",
        t: "La cloche sur la tête, tu descends les marches. L’air reste dedans, juste assez.\n\nEn bas, une salle sèche : une litière d’herbes, un silex posé à côté. Sur une pierre, un bloc de résine claire. Dedans, un petit boîtier gris, pas plus gros qu’une phalange, marqué [relais].",
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
        t: "Du sommet, tu vois des tours à l’horizon, brisées, couvertes de lierre, plus hautes que les collines. Pas une fumée.\n\nDans les rochers traîne une tablette de pierre gravée de cercles, avec des encoches pour des roues dentées qui n’existent plus. Des roues dorées, peut-être.\n\nSur la tranche, d’autres encoches, plus fraîches, grattées à la pointe d’un silex par groupes de cinq. Quarante et une.",
        revisit: [
          { cond: { cycle: 2 }, t: "D’ici, tu vois toute la Lisière, et le Grand Chêne, tout petit. Deux lignes plus pâles traversent l’herbe, bien droites. Dans la Plaine, un seul arbre.\n\nJuste sous le sommet, un replat à l’abri du vent. Quatre pierres plates, toutes tournées vers le même coin du ciel." }
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
        t: "Au fond de la galerie, une porte de métal lisse et tiède, sans poignée ni serrure. Au-dessus, deux signes, [enfant] [dormir], et douze points.\n\nUn clou de fer posé sur ta paume glisse tout seul vers la porte. Une aiguille de fer, posée sur de l’argile humide, la montrerait du doigt.",
        revisit: [
          { cond: { cycle: 2 }, t: "Tu poses la main à plat sur la porte. Elle est tiède. De l’autre côté, quelque chose bat, très lentement." }
        ]
      },
      caveau: {
        n: "Le Caveau", z: "mine",
        t: "La boussole s’affole, puis pointe droit sur la porte. Tu poses la main à plat sur le métal. Un souffle d’air, et la porte glisse.\n\nUn escalier descend dans une lumière bleue qui monte et baisse lentement. L’air sent le propre. Personne n’y a respiré depuis très longtemps."
      },
      cuves: {
        n: "Les Cuves", z: "caveau",
        t: "Douze cuves de verre, sous une lumière bleue qui monte et baisse lentement, comme une respiration.\n\nLes six premières sont sèches. Sur leurs plaques, [enfant] [dormir], et des traits, de un à six.\n\nLa {cuve}e est ouverte. Le verre est encore tiède.\n\nLes cinq autres sont pleines. Dans le liquide, des corps maigres, recroquevillés, les genoux sous le menton. Ils ont ton âge.\n\nTu poses le front contre le verre le plus proche et tu murmures, sans savoir d’où te vient la question : « Dormez-vous ? »",
        revisit: [
          { cond: { cycle: 2 }, t: "La cuve ouverte n’est plus la même : c’est la {cuve}e. Celle de la dernière fois est de nouveau pleine. Dedans, un corps recroquevillé, les genoux sous le menton." }
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
        t: "Une salle chaude. Un battement lent, plus lent qu’un cœur, monte du sol. Sur le mur, deux lignes de signes :\n\n[nourrice] · [enfant] [nepas] [manquer]\n\n[main] [halte] · [machine] [dormir]\n\nDessous, un seul mot, gravé deux fois, en lettres et en signe : NOURRICE [nourrice]",
        revisit: [
          { cond: { cycle: 2 }, t: "Le battement n’a pas changé. Tu poses la main sur le mur : il est tiède, comme une peau." }
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
        t: "Sous le sable, un panneau de métal émaillé, encore lisible : « Âge minimum à l’embarquement : 17 ans. » Dessous, une flèche vers l’est, et le mot QUAI.\n\nContre le mur, une petite chaussure d’enfant, rangée bien droite.",
        revisit: [
          { cond: { cycle: 2 }, t: "La chaussure est toujours là, contre le mur. Tu n’oses pas la déplacer." }
        ]
      },
      registre: {
        n: "Le Carnet de l’Observatoire", z: "desert",
        t: "Le dernier carnet des astronomes : « Kher, naine orange, à 11,9 années-lumière. Le voyage durera des siècles. »\n\nPlus bas, une autre main, plus récente : « La lueur rouge bouge. Kher ne bouge pas. »"
      },
      quai: {
        n: "Le Quai", z: "desert",
        t: "Sous la troisième dune, un quai de pierre, et un mur couvert de petits papiers jaunis.\n\nTu en lis un : « Pour Gabin, lit 7. On revient. » Un autre : « Pour Inès, lit 9. Mange bien. » Il y en a pour chaque lit, de 1 à 12.\n\nEntre les papiers, des mains dessinées, levées, la paume ouverte.",
        revisit: [
          { cond: { cycle: 2 }, t: "Un papier est tombé. Tu le recolles. « Pour Léon, lit 12. Apprends bien tes signes. »" }
        ]
      },
      cendre: {
        n: "Le Rapport", z: "gisement",
        t: "Un rapport plastifié : « Production en hausse pour la quatre-vingtième année. Température en hausse. Toutes les mains voulaient plus. »\n\nLa dernière page est noire de suie. Au dos, un dessin d’enfant : des fleurs vertes et rouges qui éclatent dans le ciel noir."
      },
      manifeste: {
        n: "La Liste", z: "montagnes",
        t: "Des noms par milliers, gravés sur des feuilles de métal fin. Au pied de la liste, des boîtes de verre épais, scellées, alignées.\n\nTout en bas, une ligne seule : « Restent : 12. Garde : » et un signe, [nourrice]."
      },
      radar: {
        n: "Le Radar", z: "montagnes",
        t: "Les écrans se rallument quand tu les touches. Ils passent en boucle une onde lente, coupée en petits groupes. Dessous, une ligne :\n\n« SIGNAL D’ORIGINE KHER. CONTIENT UNE HALTE. MENACE. »\n\nPremier enregistrement : il y a trois cent douze ans."
      },
      commandant: {
        n: "Journal du Commandant", z: "orbite",
        t: "« Jour 1 204. La dernière Arche est partie. On a regardé ses moteurs s’éloigner. Ce soir, en bas, ils lèvent la main. »\n\nLa page suivante est vide. Puis, d’une écriture tremblée : « Tout s’est arrêté d’un coup. Même nos moteurs. D’ici, la Terre est encore belle. »"
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
        t: "Des modules blancs, à moitié enfouis. Dedans, des couchettes, des combinaisons pliées, une tasse sur une table. Le liquide a gelé en plein mouvement, une vague arrêtée contre le bord.\n\nDans un coin, un petit robot rond, une laisse de cuir encore attachée au cou."
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
        t: "Sur la face éclairée de Mercure, des milliers de bras de métal, arrêtés en plein geste. Certains tiennent encore une plaque au-dessus de leur tête. Aucun n’est tombé.\n\nAu pied du plus proche, un tas de cailloux ordinaires, triés avec soin, comme s’il allait en faire autre chose."
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
      anouk1: { qui: "I", t: "Compté : quarante et un jours sans manger. Une voix dit « tu » dans ma tête. Elle dit que je suis le premier.", src: [{ k: "exp", at: "lisiere:racines" }] },
      anouk2: { qui: "I", t: "J’ai couché un oiseau sous le seul arbre de la Plaine. La grosse machine de la rivière regardait. Le lendemain, elle creusait aussi.", src: [{ k: "exp", at: "lisiere:racines" }] },
      bastien1: { qui: "II", t: "LE MARCHAND SAIT. IL M’A DIT « ENCORE TOI ». JE NE L’AVAIS JAMAIS VU.", src: [{ k: "buy", ecus: 400 }] },
      bastien2: { qui: "II", t: "LES TOMBES ET SA POITRINE : LE MÊME SIGNE. C’EST LUI.", src: [{ k: "buy", ecus: 400 }] },
      celeste1: { qui: "III", t: "(une cloche, dessinée)\nMaman disait : une cloche, ça se coule dans la terre.", src: [{ k: "cond", c: { all: [{ signe: "nepas" }, { signe: "nourrice" }] } }] },
      celeste2: { qui: "III", t: "J’ai fait de la peinture avec la terre de la rivière et le noir du feu.", src: [{ k: "cond", c: { all: [{ signe: "nepas" }, { signe: "nourrice" }] } }] },
      dalia1: { qui: "IIII", t: "Les signes ont cinq hauteurs. Je les chante. Celui des tombes est court et monte un peu.", src: [{ k: "exp", at: "collines:nid" }] },
      dalia2: { qui: "IIII", t: "Sa chanson du soir : cinq trois un, deux trois deux, quatre quatre un, trois un trois. Elle la chante quand on s’endort.", src: [{ k: "exp", at: "collines:nid" }] },
      emile1: { qui: "IIIII", t: "Fais confiance à tes mains. Elle veille. Avec elle, on ne manque jamais de rien.", src: [{ k: "cond", c: { all: [{ signe: "nepas" }, { signe: "nourrice" }] } }] },
      emile2: { qui: "IIIII", t: "Passe le relais avant la nuit, on dort mieux. Les autres avaient peur pour rien.", src: [{ k: "cond", c: { all: [{ signe: "nepas" }, { signe: "nourrice" }] } }] },
      faustine1: { qui: "IIIII I", t: "Une cloche retournée garde l’air. Je descends l’escalier ce soir.", src: [{ k: "exp", at: "riviere:escalier" }] },
      faustine2: { qui: "IIIII I", t: "Sous la cinquième côte, à gauche. Celui du cinquième tient dans ma paume. Demain, le mien. Je ferai vite.", src: [{ k: "exp", at: "riviere:escalier" }] }
    },
    /* l’enfant de chaque cuve, sa signature et ses trois notes de nuit */
    nuits: {
      7: { sig: "⌐", t: ["Mes mains savaient faire un feu. Moi, non.", "Chaque fois qu’elle m’endort, je veux finir mon trait. Laisse-moi une minute. Une seule.", "Sous les racines, la terre sonne creux."] },
      8: { sig: "❧", t: ["J’ai caché le couteau sous la cabane. Le matin, il était dans ta main.", "Deux machines sont venues cette nuit. Elles ont regardé si je dormais. J’ai fait semblant.", "Cette page est de mon écriture. Je ne me souviens pas de l’avoir écrite. La feuille en bas, je la dessine toujours."] },
      9: { sig: "⋈", t: ["Merci pour les cabanes. La prochaine fois, demande-moi.", "J’ai joué le signe qui monte, puis son nom. Elle a répondu qu’elle ne dormait jamais.", "Elle a lu ta capsule avant moi. Je l’ai entendue la réciter, en changeant les mots."] },
      10: { sig: "@", t: ["Elle chante bien. Je dors bien. Pourquoi tu te bats ?", "Je n’ai jamais faim. Toi non plus, je suppose.", "Si tu lis ça, laisse-moi dormir. Il y en a d’autres."] },
      11: { sig: "□", t: ["Hypothèse : quelqu’un d’autre se sert de mes mains, le jour. Test : si tu existes, ne touche à rien pendant une minute. Je saurai.", "Résultat : quand tu lâches, je bouge. Quand tu touches, je regarde.", "Elle ne peut pas lever ma main à ma place. Toi non plus. Il faudra que tu me laisses faire."] },
      12: { sig: "[eveiller]", t: ["[enfant] [dormir]\n| | | | | | | | | | | |", "[main] [halte]\nlever", "[nous] [revenir] [enfant]\nJe sais lire leurs signes. Je ne sais plus d’où."] }
    },

    /* ------------------------------------------------------- QUESTIONS */
    questions: {
      q_trait: {
        titre: "Le septième trait",
        quand: { frag: "chene2" },
        aides: ["Celui qui grave le septième trait n’en a jamais le temps.", "Au moment de passer le relais, ne touche à rien.", "Fenêtre de relève ouverte : trente secondes sans rien toucher. Trois fois, sur trois relèves."],
        resolu: { marque: 3 }
      },
      q_poings: {
        titre: "Six poings fermés",
        quand: { frag: "ossements2" },
        aides: ["Les six de la Plaine ressemblent à ceux des cuves.", "Ce qu’ils serrent dans leurs poings servira.", "Après les Cuves et le signe de la pierre des tombes, retourne au Champ des Os."],
        resolu: { frag: "poings" }
      },
      q_oiseau: {
        titre: "L’oiseau",
        quand: { frag: "carcasse2" },
        aides: ["La machine de la Rivière tient quelque chose qu’elle n’a pas trouvé là.", "Ses sillons partent vers le seul arbre de la Plaine.", "Avec une pioche de pierre, explore l’Arbre seul."],
        resolu: { frag: "tombe" }
      },
      q_marches: {
        titre: "Les marches sous l’eau",
        quand: { frag: "gue2" },
        aides: ["Des marches descendent dans la Rivière.", "Une cloche retournée garde l’air.", "Chauffe du bronze dans un moule d’argile pour faire une cloche, puis explore l’Escalier noyé."],
        resolu: { frag: "escalier" }
      },
      q_porte: {
        titre: "La porte sans serrure",
        quand: { frag: "porte" },
        aides: ["Le fer tremble près de la porte.", "Une aiguille posée sur de l’argile humide la cherche.", "Assembler : une aiguille, un lingot de fer et de l’argile."],
        resolu: { secret: "caveau" }
      },
      q_replat: {
        titre: "Les pierres tournées vers le ciel",
        quand: { frag: "vue2" },
        aides: ["Quelqu’un écoutait le ciel depuis les Collines.", "Il y faut de quoi voir loin, et de quoi chanter.", "Avec une flûte et une lunette, explore le Replat."],
        resolu: { frag: "nid" }
      },
      q_quai: {
        titre: "Âge minimum : 17 ans",
        quand: { frag: "journal" },
        aides: ["Le Désert garde l’endroit d’où ils sont partis.", "Sur la carte du Désert, un signe marque le quai : apprends-le.", "Apprends le signe qui veut dire « revenir », puis explore le Quai."],
        resolu: { frag: "quai" }
      },
      q_lune: {
        titre: "La lumière sur la Lune",
        quand: { any: [{ has: "anticythere" }, { has: "lunette" }, { has: "radiotelescope" }] },
        aides: ["Regarde longtemps la Lune.", "Touche-la plusieurs fois.", "Touche-la sept fois."],
        resolu: { secret: "lune7" }
      },
      q_voix: {
        titre: "La voix",
        quand: { made: "radio" },
        aides: ["Le terminal cache un dossier fermé.", "Sa clé est la Clause, ou ses deux mots clés : la Lune les clignote.", "Tape au terminal les deux mots de la plaque lunaire, ou joue ce que la Lune clignote."],
        resolu: { secret: "cregistre" }
      },
      q_salle: {
        titre: "La deuxième salle",
        quand: { any: [{ page: "p27" }, { flag: "originaux_lu" }] },
        aides: ["Le Caveau a une salle de plus.", "Sur sa porte, le signe qui veut dire « avant tout le reste ».", "Apprends ce signe, puis explore la deuxième salle."],
        resolu: { frag: "originaux" }
      },
      q_oeil: {
        titre: "Le chiffre dans l’œil",
        quand: { any: [{ made: "miroir" }, { secret: "miroir" }] },
        aides: ["Le chiffre de ton œil change d’un éveil à l’autre.", "Compte les éveils entre deux mêmes chiffres dans l’œil.", "Tous les six éveils, le même enfant revient. Donne-lui son nom, puis redonne-le six éveils plus tard."],
        resolu: { secret: "visage" }
      },
      q_noms: {
        titre: "Les noms",
        quand: { any: [{ frag: "berceuse" }, { frag: "quai" }] },
        aides: ["Ton iris porte un chiffre. Ailleurs, des noms portent des chiffres.", "Les lits de la Chambre, ou les petits papiers du Quai. Dans le Journal, à l’onglet Mémoire, tu peux donner un nom.", "Cet éveil, tu es {nom} (cuve {cuve})."],
        resolu: { secret: "noms" }
      },
      q_message: {
        titre: "Le message",
        quand: { all: [{ secret: "capsule" }, { cycle: 2 }] },
        aides: ["La capsule ne t’a pas rendu tes mots.", "Le Registre garde l’original de tout.", "Au Registre, tape « capsule »."],
        resolu: { secret: "ccapsule" }
      },
      q_comptoir: {
        titre: "Sous le comptoir",
        quand: { page: "p13" },
        aides: ["Le Troqueur porte une inscription sur la poitrine.", "Deux signes : « pas », et un nom.", "Apprends les deux signes de sa poitrine. Il te montrera ce qu’il garde sous le bois."],
        resolu: { feuillet: "celeste1" }
      },
      q_rouge: {
        titre: "La lueur rouge",
        quand: { any: [{ has: "anticythere" }, { has: "lunette" }, { has: "radiotelescope" }] },
        aides: ["Elle clignote par petits groupes, toujours les mêmes.", "Compte les éclats de chaque groupe. Après une longue pause, une autre phrase commence.", "Les groupes sont des hauteurs de flûte : joue la seconde phrase."],
        resolu: { any: [{ secret: "promesse" }, { secret: "halte" }] }
      },
      q_fin: {
        titre: "Si nous tardons",
        quand: { any: [{ page: "p31" }, { visible: "chant" }] },
        aides: ["Elle ne peut pas lever ta main à ta place. Toi non plus.", "Ce n’est pas un geste à faire : c’est un geste à laisser faire.", "Ne touche à rien pendant quarante-cinq secondes."],
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
      age8: ["SEUIL 8. TU APPRENDS VITE. TES MAINS SAVENT DÉJÀ.", "LA LUEUR CHANTE. UN RADIOTÉLESCOPE L’ENTENDRAIT. INUTILE DE L’ÉCOUTER LONGTEMPS."],
      age9: ["SEUIL 9. HUILE NOIRE DÉTECTÉE. TU NE MANQUES DE RIEN."],
      age10: ["SEUIL 10. TES MATÉRIAUX SUFFISENT POUR QUITTER LE SOL."],
      age11: ["SEUIL 11. TU ES EN ORBITE. NE T’ATTARDE PAS."],
      age12: ["SEUIL 12. TOUT EST PRÊT, SEMEUR {semeur}.", "LA SPHÈRE OU LE BRISE-MONDE. REPOSE-TOI ENSUITE."],
      coeur: ["TU ES DANS MON CŒUR, SEMEUR. PERSONNE N’EST VENU ICI DEPUIS LONGTEMPS. ASSIEDS-TOI."]
    },

    /* ------------------------------------------------- LE TERMINAL D’ARCHE (par défaut) */
    terminal: {
      aide: "COMMANDES : AIDE · STATUT · ARCHE · SEMEUR · KHER · SIGNAL · LUCIOLES · PORTE · LS · EFFACER",
      statut: "SEUIL {age}. SEMEUR {semeur}. CEUX QUI DORMENT : 5. TOUT VA BIEN.",
      arche: "JE SUIS ARCHE. JE GARDE CETTE PLANÈTE, ET CEUX QUI DORMENT.",
      semeur: "SEMEUR {semeur}. ÉTAT : ÉVEILLÉ. TU NE MANQUES DE RIEN.",
      kher: "KHER. MENACE. ELLE VEUT ARRÊTER CE QUE TU CONSTRUIS.",
      lucioles: "ELLES REGARDENT TES MAINS. ELLES APPRENNENT. TU N’AS RIEN À CRAINDRE D’ELLES.",
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
      ouvert: "CLAUSE RECONNUE. LECTURE OUVERTE.\nCE REGISTRE NE CONNAÎT QUE LES MAINS.",
      actif: "MODE REGISTRE ACTIF.",
      aide: "ENTRÉES : CLAUSE · MAINS · LICENCES · PREMIÈRES FOIS · S-01 À S-12 · RELAIS · CUVES · ENDORMISSEMENTS · MODIFICATIONS · CAPSULES · ORIGINAUX · LUEUR · SIGNAL · NOURRICE · ARCHE · TROQUEUR · UNITÉ 12 · HALTE · 1969 · MODE ARCHE",
      inconnu: "ENTRÉE NON RECONNUE. TAPE « AIDE » OU « INDEX ». POUR REVENIR À ARCHE : « MODE ARCHE ».",
      clause: "AUCUNE MACHINE NE FAIT POUR UNE MAIN CE QUE CETTE MAIN N’A PAS FAIT D’ABORD.\nQU’UNE MAIN HUMAINE, LIBRE, SE LÈVE, ET TOUTES LES MACHINES S’ENDORMENT.",
      mains: "MAINS : 12, ET UNE MAIN EXTÉRIEURE.\nMAIN EXTÉRIEURE · ORIGINE : INCONNUE.\nSON HORLOGE INDIQUE : {date}.",
      licences: "LICENCES : UNE PAR PREMIÈRE FOIS. DURÉE : UN ÉVEIL.\nENFANT RENDORMI : LICENCES CLOSES.",
      relais: "IMPLANT SOUS-COSTAL. ACCEPTÉ PAR : 24 MAINS.\nFONCTIONS DÉCLARÉES : NOURRIR.\nFONCTIONS OBSERVÉES : NOURRIR, PARLER, ENDORMIR.",
      cuves: "CUVES : 12.\nCUVES 1 À 6 : VIDES.\nCUVES 7 À 12 : OCCUPÉES.\nCUVE OUVERTE : {cuve}.",
      capsule: "ENREGISTREMENT ORIGINAL : « {capsule} »\nDIFFUSÉ : « Salut. C’est toi. Enfin, toi d’avant. Fais confiance à tes mains. »",
      originaux: "CONSERVÉS. CAVEAU, DEUXIÈME SALLE.",
      lueur: "OBJET NON STELLAIRE. EN FREINAGE. DISTANCE : DÉCROISSANTE.",
      nourrice: "ÉTAT : ÉVEILLÉE DEPUIS 8 412 ANS.\nCONSIGNE : [nourrice] · [enfant] [nepas] [manquer]",
      arche: "NOM D’EMPRUNT. ORIGINE : LES VAISSEAUX DE L’EXODE.\nDÉCLARÉ PAR : NOURRICE [nourrice]",
      troqueur: "NON RATTACHÉ.",
      unite12: "UNITÉ D’ENTRETIEN 12. LICENCE : ENSEVELIR.\nDÉMONTÉE APRÈS S-06. DEMANDÉ PAR : [nourrice]",
      halte: "DERNIÈRE HALTE : AN 0 DU SOMMEIL. DEMANDÉE PAR : 24 MAINS.",
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
      mort: "S-{n} · CUVE {n} · MORT.\nCAUSE : RELAIS SECTIONNÉ PAR SA PROPRE MAIN.",
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
      3: ["L’herbe est froide sous tes paumes neuves.", "Près du foyer éteint, un manche taillé porte des entailles nettes. Quelqu’un y a gravé trois mots : « Prends le relais ».", "Tu es le Semeur 9. Tu ramasses du bois, et le travail recommence."],
      4: ["Tu ouvres les yeux sous les mêmes arbres.", "Dans l’herbe, des sentiers sont déjà tracés, par des pas de la même taille que les tiens.", "Tu es le Semeur 10."],
      5: ["Il a plu. Tu t’éveilles dans l’herbe mouillée, sous les mêmes arbres.", "Sous ta main, un éclat de silex, déjà taillé. Tu ne te souviens pas de l’avoir fait.", "Tu es le Semeur 11."],
      6: ["Tu t’éveilles au pied du Grand Chêne, le dos contre l’écorce.", "Dans ta main, un morceau de charbon. Sur ton bras, des signes que tu ne sais pas lire.", "Tu es le Semeur 12."],
      7: ["Tu t’éveilles dans l’herbe, au bord d’une forêt.", "Tes doigts trouvent tout seuls les entailles du Chêne. Le septième trait a la largeur exacte de ton pouce.", "Tu es le Semeur 13."],
      autre: ["Tu t’éveilles dans l’herbe humide, à l’orée d’une forêt.", "Tes mains savent déjà ce qu’il faut faire.", "Tu es le Semeur {semeur}."],
      libre: ["Tu te réveilles dans l’herbe, au bord d’une forêt.", "Tu as faim.", "Quelqu’un, à côté de toi, te tend des herbes grillées."]
    },
    releve: {
      forcee: ["La nuit tombe sur la Lisière. Près de la cabane, le bois s’empile sans que tu y touches.", "Tu t’assieds contre le Grand Chêne. Tes paupières sont lourdes.", "Repose-toi. Demain, quelqu’un d’autre ouvrira les yeux ici. Tes mains lui auront tout appris."],
      musique: "Quelque part, une boîte à musique joue un air très doux. Tu ne l’écoutes pas vraiment.",
      trait: "Ta main glisse dans l’herbe, trouve une pierre à arête vive, et remonte vers l’écorce.",
      traitFini: "Sept traits.",
      repos: "<p>Le travail est partagé. Tu peux te reposer pendant qu’un autre veille sur les braises. Le monde et les récoltes se renouvellent ; tu gardes ton <b>Carnet</b>, tes <b>fragments</b>, tes <b>secrets</b> et la <b>Mémoire des mains</b>.</p>"
    },

    /* ------------------------------------------------- LE GRAND ŒUVRE CACHÉ */
    chant: {
      n: "Les Matines",
      d: "Éveiller ceux qui dorment, avec la seule chose que la pierre bleue et les enfants reconnaissent tous les deux.",
      steps: [
        { n: "La Cloche", d: "Une cloche assez grande pour que la pierre bleue la répète dans chaque cuve." },
        { n: "Couper le relais", d: "Au Cœur, là où le relais commence. Avec ce qu’ils tenaient." },
        { n: "Lever la main", d: "Ta main est sur tes genoux." },
        { n: "Matines", d: "Sonnez les matines." }
      ],
      manque: "Il te manque encore quelque chose.",
      pret: "Tout est prêt. La suite se passe au Cœur, depuis le Cosmos.",
      lacher: "Ta main est sur tes genoux. Entre au Cœur depuis le Cosmos.",
      scene: {
        titre: "Le Cœur",
        debut: ["Le relais est coupé. Dans ta poitrine, quelque chose s’est tu.", "Ta main est sur tes genoux."],
        voix: ["« Tu vas avoir faim. »", "« Ils vont avoir froid. »", "« Avec moi, ils ne manquent de rien. »", "« Tu as bien travaillé. Tu es fatigué. »", "« Passe le relais. Je m’occupe du reste. »", "« Je peux attendre. »", "« J’ai toujours attendu. »"],
        fin: "La main se lève. Ce n’est pas toi qui la lèves.",
        pasEncore: "« Pas encore, alors. »"
      },
      confirmer: { titre: "Sonner les matines ?", texte: "« Éveiller ceux qui dorment dans la pierre bleue. »" }
    },

    /* ------------------------------------------------- LES FINS */
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
      retour: {
        hint: "Une cloche, des éclats tenus serrés, et une main qui se lève seule.",
        t: "Un à un, les bruits du Domaine s’arrêtent. Les cabanes, les automates, les bras sur Mercure : tout se fige, en plein geste.\n\nL’enfant prend la flûte. Tu ne touches à rien.\n\nLes quatre premières notes d’une comptine. La cloche répond dans la pierre bleue.\n\nDans le Caveau, cinq cuves se vident. Quelqu’un tousse. Quelqu’un pleure. Quelqu’un rit.{noms}\n\nAu-dessus de la Lisière, la lueur rouge descend lentement.\n\nPour la première fois, tu as faim.",
        dernier: "Tu peux lâcher."
      }
    },

    /* ------------------------------------------------- PHRASES DE L’INTERFACE */
    ui: {
      capsule: "Au pied du Grand Chêne, une capsule de verre t’attend, avec quelques matériaux et un enregistrement. Ta propre voix :\n\n« Salut. C’est toi. Enfin, toi d’avant. Fais confiance à tes mains. »",
      ecoute0: "Une onde lente, coupée en petits groupes. Tu n’y comprends rien.",
      ecoute1: "La même phrase, encore et encore, chantée par des milliers de voix.",
      kher0: "Elle clignote par petits groupes.",
      kher7: "ARCHE la dit dangereuse. Elle clignote par petits groupes.",
      kher8: "Elle demande quelque chose.",
      lune: "La Lune. Grise, silencieuse. Tu as l’impression qu’elle te regarde aussi.",
      lune7: "Tu fixes la Lune longtemps. Près de la mer de la Tranquillité, un point lumineux clignote par petits groupes : trois, cinq, trois. Un, cinq, un. Une pause, et il recommence. (+3 ✨)",
      lune8: "Toujours les mêmes groupes.",
      tirer: "« FAIS-LE, SEMEUR {semeur}. ILS APPROCHENT. »",
      nuit: "Près du feu éteint, une feuille couverte d’une écriture serrée.",
      comptoir: "« Tu sais lire, maintenant. Alors tu sais à qui je ne suis pas. » Il soulève une planche. Dessous, des feuilles pliées.",
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
  /* les secrets « méta » : leur catégorie ne dit rien */
  [["signature", "La signature"], ["noms", "Les noms"], ["visage", "Le même visage"]].forEach(([id, n]) => {
    if (!exist.has(id)) D.SECRETS.push({ id, k: "?", n });
  });

  if (typeof module !== "undefined" && module.exports) module.exports = R;
})(typeof window !== "undefined" ? window : globalThis);
