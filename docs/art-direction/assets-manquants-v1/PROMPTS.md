# Assets manquants : prompts pour Gemini (planches)

Rédigé le 8 novembre 2026, version 0.66.0 publiée. **Règle : toujours des planches, jamais une image par objet** (économie de jetons). Une planche = une seule image qui contient plusieurs sujets en grille ; je la découpe ensuite.

## 1. Les objets sans illustration (161 sur 271)

Ces objets s'affichent aujourd'hui avec un glyphe monochrome de secours au lieu d'une illustration peinte. Il en faut une par objet, dans le style des 104 existantes (`assets/carnet/items/`).

### Format de chaque planche
- **Une image 2560 × 2560, grille 4 × 4 (16 objets)**, fond uni **vert chroma #00ff00** (aucun vert dans les sujets) pour que je détoure.
- Chaque objet **centré dans sa case de 640 × 640**, marge d'au moins 60 px, sans empiéter sur la case voisine, sans ombre portée au sol, sans numéro ni texte dans l'image.
- L'ordre des cases est celui du tableau (de gauche à droite, puis ligne par ligne). Une case vide reste unie.
- J'exporte chaque objet en WebP 256 px.

### Bloc de style commun (à coller au début de chaque planche)
```
Use case: stylized-concept. One sheet, 4x4 grid of 16 separate isolated inventory illustrations for Éclat's hand-painted explorer's notebook. Every object is centered in its own square cell with generous margins, on a flat pure green #00ff00 background, no shadows on the ground, no text, no numbers, no letters, no frame, no paper. Match the existing painted items: brown-black organic ink contours, muted natural watercolor washes, sparse broad hatching, tactile handmade materials, soft upper-left light, three-quarter view, strong readable silhouette at 48 and 32 pixels. Same line weight and same level of finish in all 16 cells. No photorealism, no 3D render, no glossy fantasy, no neon, no glow.
```

### Style par âge (à ajouter après le bloc commun)
- **Bois à Acier :** matières brutes et outils artisanaux (bois, os, cuir, pierre, cuivre, bronze, fer), patine, traces d'usage.
- **Vapeur :** laiton, fonte noire, rivets, manomètres, tuyaux ; palette brune et cuivrée.
- **Électricité, Atome :** cuivre, verre, bakélite ; plomb gris, vert d'uranium discret (jamais lumineux).
- **Silicium, Polymères, Composites :** plus sobre, toujours dessiné à la main : verts de circuits, plastiques mats, fibres noires.
- **Spatial, Stellaire :** métal sombre, céramiques blanches, bleu nuit ; l'exotique reste un dessin d'encre, sans effet lumineux.

### Planche 1 / 11 · Âge du Bois · Âge de l’Os · Âge du Bronze

| Case | Id | Objet | Sorte |
|---|---|---|---|
| 1 | `anneau_lourd` | Anneau tout simple | curio |
| 2 | `quart_coeur` | Quart de cœur | curio |
| 3 | `de_vingt` | Dé à vingt faces | curio |
| 4 | `fouet_cuir` | Fouet de cuir | curio |
| 5 | `automate_bronze` | Automate de bronze | machine |
| 6 | `brouette` | Brouettes | amélioration |
| 7 | `courroies` | Courroies de cuir | amélioration |
| 8 | `enclume_bronze` | Enclume de bronze | station |
| 9 | `engrenage` | Engrenage de bronze | composant |
| 10 | `gants` | Gants de peau | composant |
| 11 | `hache_bronze` | Hache de bronze | outil |
| 12 | `lingot_bronze` | Lingot de bronze | composant |
| 13 | `moulin` | Moulin à eau | amélioration |
| 14 | `pioche_bronze` | Pioche de bronze | outil |
| 15 | `plaque_bronze` | Plaque de bronze | composant |
| 16 | `ressort` | Ressort de bronze | composant |

### Planche 2 / 11 · Âge du Bronze · Âge du Fer · Âge de l’Acier · Âge de la Vapeur

| Case | Id | Objet | Sorte |
|---|---|---|---|
| 1 | `roue` | Roue cerclée | composant |
| 2 | `soufflet` | Soufflet | composant |
| 3 | `charbon_2` | Mine de charbon | extracteur (bâtiment) |
| 4 | `sable_2` | Tamis à sable | extracteur (bâtiment) |
| 5 | `cuir_2` | Tannerie | extracteur (bâtiment) |
| 6 | `martinet` | Martinet hydraulique | machine |
| 7 | `caillou_3` | Carrière à vapeur | extracteur (bâtiment) |
| 8 | `chaudiere` | Chaudière | composant |
| 9 | `chaudiere_tubulaire` | Chaudière tubulaire | amélioration |
| 10 | `locomotive` | Chemin de fer | amélioration |
| 11 | `circuit_vapeur` | Circuit de vapeur | composant |
| 12 | `condenseur` | Condenseur | composant |
| 13 | `drague` | Drague à godets | extracteur (bâtiment) |
| 14 | `eau` | Eau | ressource |
| 15 | `fibre_3` | Filature à vapeur | extracteur (bâtiment) |
| 16 | `manometre` | Manomètre | composant |

### Planche 3 / 11 · Âge de la Vapeur

| Case | Id | Objet | Sorte |
|---|---|---|---|
| 1 | `marteau_pilon` | Marteau-pilon | outil |
| 2 | `cassiterite_2` | Mine d’étain à vapeur | extracteur (bâtiment) |
| 3 | `treuil` | Mine de cuivre à vapeur | extracteur (bâtiment) |
| 4 | `silex_2` | Minière à silex | extracteur (bâtiment) |
| 5 | `moteur_vapeur` | Moteur à vapeur | composant |
| 6 | `papier` | Papier | composant |
| 7 | `piston` | Piston | composant |
| 8 | `eau_1` | Pompe à bras | extracteur (bâtiment) |
| 9 | `sable_3` | Pompe à sable | extracteur (bâtiment) |
| 10 | `pompe` | Pompe d’exhaure | amélioration |
| 11 | `presse_vapeur` | Presse à vapeur | machine |
| 12 | `presse_imprimer` | Presse d’imprimerie | amélioration |
| 13 | `recuperation_vapeur` | Récupération de vapeur | amélioration |
| 14 | `regulateur` | Régulateur à boules | composant |
| 15 | `scierie` | Scierie à vapeur | extracteur (bâtiment) |
| 16 | `soupape` | Soupape de sûreté | composant |

### Planche 4 / 11 · Âge de la Vapeur · Âge de l’Électricité

| Case | Id | Objet | Sorte |
|---|---|---|---|
| 1 | `tuyau_cuivre` | Tuyau de cuivre | composant |
| 2 | `aimant` | Aimant | composant |
| 3 | `ampoule` | Ampoule | composant |
| 4 | `batterie` | Batterie | composant |
| 5 | `bobine` | Bobine de cuivre | composant |
| 6 | `cable` | Câble électrique | composant |
| 7 | `excavatrice` | Carrière de quartz mécanisée | extracteur (bâtiment) |
| 8 | `cristal_chantant` | Cristal chantant | composant |
| 9 | `cuivre_pur` | Cuivre pur | composant |
| 10 | `dynamo` | Dynamo | station |
| 11 | `eclairage` | Éclairage électrique | amélioration |
| 12 | `four_arc` | Four à arc | station |
| 13 | `charbon_3` | Mine de charbon électrique | extracteur (bâtiment) |
| 14 | `foreuse_elec` | Mine de fer électrique | extracteur (bâtiment) |
| 15 | `moteur_elec` | Moteur électrique | composant |
| 16 | `sable_4` | Pelleteuse à sable | extracteur (bâtiment) |

### Planche 5 / 11 · Âge de l’Électricité · Âge de l’Atome

| Case | Id | Objet | Sorte |
|---|---|---|---|
| 1 | `poste_elec` | Poste à moteur électrique | machine |
| 2 | `radio` | Poste radio | outil |
| 3 | `reseau` | Réseau électrique | amélioration |
| 4 | `foreuse` | Sonde pétrolière | outil |
| 5 | `telegraphe` | Télégraphe | amélioration |
| 6 | `barre_combustible` | Barre de combustible | composant |
| 7 | `centrale_fission` | Centrale à fission | amélioration |
| 8 | `compteur_geiger` | Compteur Geiger | amélioration |
| 9 | `galene` | Galène | ressource |
| 10 | `graphite` | Graphite | composant |
| 11 | `lingot_plomb` | Lingot de plomb | composant |
| 12 | `uranium_1` | Mine d’uranium | extracteur (bâtiment) |
| 13 | `galene_1` | Mine de plomb | extracteur (bâtiment) |
| 14 | `uranium` | Minerai d’uranium | ressource |
| 15 | `pastille_uranium` | Pastille d’uranium | composant |
| 16 | `plaque_plomb` | Plaque de plomb | composant |

### Planche 6 / 11 · Âge du Silicium

| Case | Id | Objet | Sorte |
|---|---|---|---|
| 1 | `capteurs` | Capteurs de forage | amélioration |
| 2 | `cellule` | Cellule photovoltaïque | composant |
| 3 | `circuit` | Circuit imprimé | composant |
| 4 | `derrick` | Derrick | extracteur (bâtiment) |
| 5 | `chaine` | Ligne d’assemblage | machine |
| 6 | `lithographe` | Lithographe | station |
| 7 | `ordinateur` | Ordinateur | amélioration |
| 8 | `wafer` | Plaquette de silicium | composant |
| 9 | `processeur` | Processeur | composant |
| 10 | `puce` | Puce | composant |
| 11 | `radiotelescope` | Radiotélescope | outil |
| 12 | `robots` | Robots ouvriers | amélioration |
| 13 | `serveur_archives` | Serveur d’archives | amélioration |
| 14 | `signal_brut` | Signal de Kher | relic |
| 15 | `silicium` | Silicium | composant |
| 16 | `traducteur` | Traducteur | relic |

### Planche 7 / 11 · Âge des Polymères

| Case | Id | Objet | Sorte |
|---|---|---|---|
| 1 | `aimant_neo` | Aimant néodyme | composant |
| 2 | `aluminium` | Aluminium | composant |
| 3 | `bauxite` | Bauxite | ressource |
| 4 | `bouteille` | Bouteille d’air | composant |
| 5 | `caoutchouc` | Caoutchouc | composant |
| 6 | `centrale` | Centrale électrique | station |
| 7 | `dynamite` | Dynamite | composant |
| 8 | `echangeur` | Échangeur thermique | composant |
| 9 | `ilmenite` | Ilménite | ressource |
| 10 | `joint_souple` | Joint d’étanchéité | composant |
| 11 | `masque` | Masque filtrant | composant |
| 12 | `ilmenite_1` | Mine d’ilménite | extracteur (bâtiment) |
| 13 | `carriere` | Mine de bauxite | extracteur (bâtiment) |
| 14 | `galene_2` | Mine de plomb mécanisée | extracteur (bâtiment) |
| 15 | `terres_1` | Mine de terres rares | extracteur (bâtiment) |
| 16 | `naphta` | Naphta | composant |

### Planche 8 / 11 · Âge des Polymères · Âge des Composites

| Case | Id | Objet | Sorte |
|---|---|---|---|
| 1 | `outillage` | Outillage électrique | outil |
| 2 | `petrole` | Pétrole | ressource |
| 3 | `plastique` | Plastique | composant |
| 4 | `uranium_2` | Puits d’uranium blindé | extracteur (bâtiment) |
| 5 | `reacteur` | Réacteur chimique | station |
| 6 | `refroidissement` | Refroidissement des machines | amélioration |
| 7 | `resine` | Résine époxy | composant |
| 8 | `soufre` | Soufre | ressource |
| 9 | `soufre_1` | Soufrière | extracteur (bâtiment) |
| 10 | `convoyeurs` | Tapis convoyeurs | amélioration |
| 11 | `terres_rares` | Terres rares | ressource |
| 12 | `titane` | Titane | composant |
| 13 | `tuyau_souple` | Tuyau souple | composant |
| 14 | `autoclave` | Autoclave | station |
| 15 | `bouclier_th` | Bouclier thermique | composant |
| 16 | `centre_num` | Centre d’usinage numérique | machine |

### Planche 9 / 11 · Âge des Composites · Âge Spatial

| Case | Id | Objet | Sorte |
|---|---|---|---|
| 1 | `ceramique` | Céramique technique | composant |
| 2 | `composite` | Composite carbone | composant |
| 3 | `drones` | Essaim de drones | amélioration |
| 4 | `fibre_carbone` | Fibre de carbone | composant |
| 5 | `fusee` | Fusée | outil |
| 6 | `graphene` | Graphène | composant |
| 7 | `ilmenite_2` | Mine d’ilménite géante | extracteur (bâtiment) |
| 8 | `excavateur` | Mine de bauxite géante | extracteur (bâtiment) |
| 9 | `terres_2` | Mine de terres rares géante | extracteur (bâtiment) |
| 10 | `moteur_fusee` | Moteur-fusée | composant |
| 11 | `plateforme` | Plateforme pétrolière | extracteur (bâtiment) |
| 12 | `supra` | Supraconducteur | composant |
| 13 | `tissu_carbone` | Tissu de carbone | composant |
| 14 | `alliage_ancien` | Alliage ancien | composant |
| 15 | `alunisseur` | Alunisseur | outil |
| 16 | `assembleur` | Assembleur moléculaire | machine |

### Planche 10 / 11 · Âge Spatial · Âge Stellaire

| Case | Id | Objet | Sorte |
|---|---|---|---|
| 1 | `base_lunaire` | Base d’hélium-3 | extracteur (bâtiment) |
| 2 | `debris` | Débris orbitaux | ressource |
| 3 | `regolithe_1` | Excavatrice lunaire | extracteur (bâtiment) |
| 4 | `station_orbitale` | Filet orbital | extracteur (bâtiment) |
| 5 | `helium3` | Hélium-3 | ressource |
| 6 | `ia` | Intelligence artificielle | amélioration |
| 7 | `propulseur` | Propulseur à fusion | composant |
| 8 | `reacteur_fusion` | Réacteur à fusion | amélioration |
| 9 | `regolithe` | Régolithe | ressource |
| 10 | `vaisseau` | Vaisseau interplanétaire | outil |
| 11 | `antimatiere` | Antimatière | composant |
| 12 | `forge_stellaire` | Forge stellaire | station |
| 13 | `matiere_exotique` | Matière exotique | composant |
| 14 | `matrice` | Matrice de fabrication | machine |
| 15 | `metamateriau` | Métamatériau | composant |
| 16 | `panneau_dyson` | Panneau de Dyson | composant |

### Planche 11 / 11 · Âge Stellaire

| Case | Id | Objet | Sorte |
|---|---|---|---|
| 1 | `replicateur` | Réplicateur | extracteur (bâtiment) |

## 2. Orbite Basse : le fond à refaire (1 image)

`assets/terres/orbite-fond.webp` a deux coutures verticales nettes (vers 21 % et 87 % de la largeur) : le noir et le fond changent d'un coup, comme trois bandes collées. À régénérer en **2560 × 1440**, **une seule image continue**, mêmes consignes que les autres fonds (sujet dans les 28 % centraux, haut et bas calmes, plein cadre, pas de marge de papier). Ajouter : `one continuous image, no seams, no vertical bands, no panel borders`.

## 3. Fonds de scène pour les autres écrans (esquisses en planche d'abord)

L'Étude, l'Atelier, le Journal, la Progression, la Mémoire et la Veillée ont des textures **1080 × 1920 portrait**, trop petites sur ordinateur. Il faut des versions **paysage 2560 × 1440**.

**Pour économiser :** d'abord **une seule planche d'esquisses** (2 colonnes × 3 lignes, une case par écran, 1920 × 1620 au total), je choisis ce qui convient, puis seulement les finales retenues en pleine taille.

| Écran | Sujet | Ambiance |
|---|---|---|
| Étude | un établi d'explorateur vu de dessus : loupe, plume, bougie, fioles, papiers | bois chaud, lumière de bougie à gauche |
| Atelier | un établi de métier : outils accrochés, copeaux, pièces en cours | bois et fer, lumière de fenêtre |
| Journal | la page d'un vieux carnet ouvert, bords brunis, un coin de carte | papier crème, encre, rien de trop chargé |
| Progression | un ciel de nuit étoilé avec des constellations dessinées à l'encre | bleu nuit profond, étoiles dorées discrètes |
| Mémoire | un feu de camp lointain qui s'éteint, silhouette de collines | braise, brume |
| Veillée | un feu de camp au premier plan, ciel de nuit | chaud au centre, froid au bord |

Contrainte commune : **le sujet reste dans le tiers central**, les bords sont calmes, car des plaques de papier couvrent la colonne de gauche.

## 4. Planche de glyphes d'interface (1 image)

La grammaire des contrôles (`docs/GRAMMAIRE-V2.md`) repose sur des glyphes **monochromes** qui se lisent seuls. Certains que j'ai pris dans une bibliothèque générique ne se devinent pas. **Une planche 2560 × 1920, grille 6 × 4 (24 glyphes), fond blanc uni, trait noir épais et régulier, aucune couleur, aucun dégradé, angles arrondis.** Chaque glyphe doit rester lisible à 24 px.

| Case | Id | Sens | Idée de dessin |
|---|---|---|---|
| 1 | `filtre-utiles` | ressources qui peuvent encore donner une recette | une main qui tend une pièce vers un point d'interrogation |
| 2 | `filtre-tout` | toutes les ressources vues | trois pierres empilées |
| 3 | `filtre-reserve` | seulement ce qui est en stock | un sac noué |
| 4 | `equipe` | l'équipe d'un métier | deux silhouettes côte à côte |
| 5 | `a-construire` | ce qu'il reste à bâtir | une truelle posée sur trois briques |
| 6 | `ce-qui-tourne` | commandes en cours | un engrenage avec une flèche circulaire |
| 7 | `sentier` | emprunter le sentier | une borne de chemin avec une flèche |
| 8 | `travaux` | revoir les travaux | un marteau et une scie croisés |
| 9 | `relire` | relire un âge du Carnet | un livre ouvert avec une flèche de retour |
| 10 | `tout-relire` | relire tous les âges | trois livres empilés avec une flèche |
| 11 | `etudier` | étudier une ressource | une loupe devant une pierre |
| 12 | `fabriquer-un` | fabriquer une pièce ici | une main qui tient une pièce, avec le chiffre 1 |
| 13 | `explorer` | explorer | une boussole |
| 14 | `retour` | revenir | une flèche vers la gauche |
| 15 | `fermer` | fermer | une croix nette |
| 16 | `objectif` | l'objectif en cours | une cible avec une flèche plantée |
| 17 | `comptoir` | le Comptoir | une balance à deux plateaux |
| 18 | `production` | la production | un engrenage et une cheminée |
| 19 | `recolte-continue` | récolter en continu | un triangle de lecture dans un cercle de flèches |
| 20 | `poser-batiment` | poser un bâtiment | une maison avec un signe + |
| 21 | `souvenirs` | les Souvenirs | une empreinte de pas |
| 22 | `intuition` | l'Intuition | une étoile à cinq branches |
| 23 | `ecus` | les écus | une pièce percée |
| 24 | `menu` | le menu | trois traits égaux |

## 5. Icône de l'application (planche de propositions, puis une finale)

Fichier `assets/icon-source.png` à fournir : **1024 × 1024, carré plein cadre, sans coins arrondis** (le système arrondit). **Planche de six propositions** en 3 × 2, chacune lisible à 64 px : un éclat de silex ; un éclat de silex et une étoile ; une main qui tient une étincelle ; une étincelle sur un carnet ; un éclat dans un cercle d'aquarelle ; une silhouette de colline avec une étoile. Palette : crème, brun-noir, brique #a8402b. Pas de texte. Je choisis une proposition, puis la seule finale est produite en pleine taille.

## Ordre de travail proposé

1. Planches d'objets 1 à 11 (une planche par envoi).
2. Planche de glyphes d'interface.
3. Planche d'esquisses des fonds de scène, puis les finales retenues.
4. Orbite Basse.
5. Planche d'icônes d'application, puis la finale.

À chaque planche livrée : la déposer dans `assets/planches/` avec son numéro ; j'intègre.
