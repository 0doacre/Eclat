# Structure des écrans : Domaine et Carte, Atelier, Arbre et Carnet

Étude du 31 octobre 2026, à partir de la 0.38 (preview) et de `main` 0.37.1. Elle prépare un choix : l'auteur et Claude décident ensemble d'une direction avant qu'aucun lot ne parte chez Gemini ou Codex. Rien n'est modifié dans le jeu. Conventions de `docs/STYLE.md`.

Étiquettes : **[M]** mesuré dans le jeu ou ses données, **[S]** lu dans une source consultée aujourd'hui (liens en fin de document), **[Mém]** ma connaissance d'un jeu, non revérifiée aujourd'hui, **[H]** hypothèse à tester avec de vrais joueurs.

## 0. Limites de l'étude de marché

La recherche web disponible ici est faible : elle ramène surtout des fiches de boutiques et des guides, presque jamais l'organisation des écrans. Ce que je peux citer est **mince**. J'ai donc séparé ce qui vient d'une source ([S]) de ce que je sais d'un jeu sans l'avoir revérifié ([Mém]). Une vraie étude de marché demande de **jouer** à cinq ou six jeux voisins avec une grille commune (voir la section 8) : je propose de la faire, mais je ne la présente pas comme faite.

## 1. L'existant, mesuré [M]

| | |
|---|---|
| Onglets | 6 : Domaine, Carte, Atelier, Arbre, Carnet, Journal, plus 5 pastilles dans l'en-tête |
| Hauteur de page à l'âge de l'Acier, 390 px | Domaine 3 044 px, Atelier 3 071 px, Carte 1 466 px, Carnet 1 338 px, pour une zone utile de 588 à 680 px |
| Terres | 12 ; **au plus 4 gisements** par terre (Lisière, Rivière, Collines), 1 à 3 pour les autres ; 1 à 5 lieux à explorer |
| Contenu de l'Atelier | 14 gestes, établi à 3 cases, 45 matières, 8 commandes en file au plus, 5 machines, 50 extracteurs |
| Ce que le Domaine porte | objectif, relève, gisement à exploiter, une carte par terre (illustration, règle, maîtrise, gisements, extracteurs), passage, Grand Œuvre, Comptoir, visiteurs, tableau de production, machines au repos |
| Ce que la Carte porte | l'atlas peint, les terres nommées, les lieux à explorer, les passages, la frontière |

Constat : **le Domaine et la Carte décrivent les mêmes douze terres**, l'un pour *gérer*, l'autre pour *se repérer et explorer*. C'est la source du doublon que tu ressens. Et les deux défilent sur plusieurs écrans, alors que chaque terre, prise seule, tient en moins de 600 px.

## 2. Pourquoi ça défile, et pourquoi c'est un problème sur téléphone

1. **Le modèle de données est une liste de terres**, et l'interface l'a traduit en une page. Un site web fait pareil. Un jeu mobile range plutôt l'information par *lieu* ou par *verbe*, pas par table.
2. **La boucle la plus fréquente** (toucher « Récolter ») est aujourd'hui au milieu d'une page de 3 000 px : le joueur cherche son geste avant de le faire.
3. Les repères habituels sont absents : rien ne dit « tu es ici », « il reste ceci ». Le défilement fait perdre la position.
4. [S] Les guides d'interface recommandent **trois à cinq onglets** en bas, réservés aux vues de premier niveau, et l'usage de tiroirs ou feuilles pour le reste. Éclat en a six, plus des pastilles, et met des listes entières dans ses vues principales.

## 3. Ce que font les jeux voisins

| Jeu | Ce qu'il fait | Ce qu'on peut en retenir |
|---|---|---|
| **A Dark Room** | un écran presque vide, un seul bouton ; l'interface grandit quand le joueur progresse ; des ouvriers (cueilleurs, bâtisseurs) arrivent en cours de route [S] | la révélation progressive tient sur un écran ; les « ouvriers » sont un bon modèle d'apprentis |
| **Kittens Game** | onglets séparés : feu de camp (construire), village (affecter des chatons à des métiers), atelier (fabriquer), sciences, commerce [Mém] ; les onglets se changent si souvent que l'auteur a ajouté des raccourcis clavier [S] | séparer *construire*, *affecter des ouvriers* et *fabriquer* est un schéma éprouvé ; mais c'est un jeu de bureau qui défile |
| **Idle Crafting Master** | des apprentis tiennent les forges et honorent les commandes, des spécialistes automatisent, trois parcours en parallèle (avatar, guilde, atelier) [S, fiche de boutique] | proche de ton idée d'apprentis au pluriel ; la fiche ne dit pas comment l'écran est organisé |
| **Idle Miner Tycoon** | un gérant par veine et par transport, la production continue fermée [S] ; la mine est une colonne qui descend [Mém] ; un test dit l'interface propre mais encombrée d'offres [S] | un gérant par poste est lisible ; l'encombrement vient du reste, pas du principe |
| **Egg, Inc.** | la ferme est la scène et le menu, avec des onglets Ferme et Poules, et une recherche en deux niveaux (commune et épique) [S] | une scène unique peut servir de hub ; les arbres de recherche se rangent en onglets |
| **Little Alchemy 2** | on part de quatre éléments, on les combine, une encyclopédie suit les trouvailles, des indices aident [S] ; l'établi est un espace unique [Mém] | un laboratoire doit être **un seul espace**, sans stock à gérer, avec des indices et une mémoire des trouvailles |
| **Infinite Craft** | on combine des éléments ; les nouvelles combinaisons sont générées ; une « première découverte » est signalée [S] ; glisser-déposer sur un espace unique [Mém] | la joie de la découverte vient de la rapidité de l'essai ; la reconnaissance d'une *première* est un bon retour |
| **Cell to Singularity** | arbre d'évolution et jardins (scènes), voir `AUDIT-CELL-TO-SINGULARITY.md` [A] | des scènes pour montrer la progression, des arbres pour la choisir |
| **IdlePixel** (mod mobile) | une barre d'onglets en bas, des tiroirs pour le reste, des en-têtes compacts [S] | schéma courant dans l'idle mobile |
| **Hay Day, Township** | une scène défilante et zoomable, avec des feuilles par bâtiment [Mém] | un monde unique et des feuilles : le modèle d'une carte qui sert de hub |

Ce qui ressort de ces jeux, sans en faire une loi :

- **Un lieu unique pour essayer** (Little Alchemy, Infinite Craft), séparé du lieu où l'on **produit** (Kittens Game, Idle Crafting Master). Ta séparation Labo / Atelier est donc dans la tradition du genre.
- **Les ouvriers sont des unités affectées à un poste** (A Dark Room, Kittens Game, Idle Crafting Master, Idle Miner Tycoon). Pas des multiplicateurs abstraits.
- **Les écrans principaux ne défilent pas** ; ce qui est long (listes, recherche, boutique) vit dans une feuille ou un onglet de deuxième niveau.

## 4. Principes proposés (le « budget d'écran »)

1. **P1. La boucle principale tient sur un écran** de 390 × 844, sans défilement de page : récolter, fabriquer, essayer.
2. **P2. Une page, un verbe** : voyager, essayer, produire, progresser.
3. **P3. Les listes longues vivent dans une feuille ou un conteneur interne**, jamais dans la page.
4. **P4. Révélation progressive** : un écran n'affiche que ce qui sert maintenant (déjà vrai en partie).
5. **P5. Le monde est un menu** : on passe d'une terre à l'autre par un geste spatial, pas par une liste.
6. **Test automatique** : une vérification de `scrollHeight ≤ clientHeight` pour les vues principales, à 390 × 844 et 320 × 568, dans `tools/test-ux.js`.

## 5. Première question : Domaine et Carte

### Options

**A0. Réduire sans changer.** Replier les terres traversées (fait par Gemini), alléger les cartes (fait par Codex). Le Domaine passe de 3 044 px (âge de l'Acier, 0.37) à 2 172 px (âge de la Vapeur, preview fusionnée) **[M]**, sans que les deux mesures soient au même âge. Coût : fait. Défaut : la Carte et le Domaine restent deux écrans, et ça défile toujours.

**A1. La carte est le hub.** Un seul onglet « Monde » : l'atlas peint plein écran (zoom et déplacement). On touche une terre, une feuille s'ouvre avec ses gisements, ses extracteurs et son passage. Le Domaine disparaît en tant que page.
- Pour : un seul monde, l'atlas devient la vedette ; modèle de Hay Day et de Township [Mém].
- Contre : **récolter coûte deux gestes** (ouvrir la feuille, toucher) alors que c'est l'action la plus fréquente ; douze terres sur un atlas portrait, ça ne tient pas sans déplacement ; la Carte actuelle défile déjà sur 1 466 px.
- Coût : L (nouvelle vue, nouvelles feuilles). Les images de carte existent.

**A2. Une terre par écran, la carte comme sélecteur.** L'onglet « Terres » montre **une terre à la fois**, pleine page : illustration (environ un quart de l'écran), règle de la terre, au plus 4 gisements en lignes de 68 px, bouton de passage ou lieux à explorer en bas. On passe d'une terre à l'autre en **glissant** ou par une rangée d'icônes de terres en haut. La Carte devient une feuille « Atlas » qu'on ouvre depuis cette rangée, pour la vue d'ensemble et les passages. Objectif, relève, production, Comptoir passent en feuilles ou en pastilles de l'en-tête.
- Pour : tient sur un écran **par construction** (4 gisements × 68 px = 272 px) **[M]** ; récolter reste un geste ; garde l'illustration par terre déjà peinte ; la terre devient un lieu ; marche avec la règle propre à chaque terre.
- Contre : on perd la vue de toutes les terres à la fois (d'où un résumé de production à garder) ; le glissement horizontal doit être découvert ; douze pages à tenir.
- Coût : L en interface (Gemini), M en art (Codex : vignettes, rangée d'icônes, transitions).

**A3. Le Domaine devient un tableau de bord, la Carte reste le voyage.** Le Domaine : une ligne par terre ouverte (vignette, nom, flux, une pastille par matière que l'on touche pour récolter), pas d'illustration. La Carte garde l'exploration et les passages.
- Pour : coût modéré, réutilise ce qui existe, tient sur un écran jusqu'à environ huit terres.
- Contre : deux écrans qui parlent encore des mêmes terres ; plus froid ; tient mal en fin de partie (douze lignes).
- Coût : M.

### Mon avis

**A2 comme cible, A0 comme palier, A3 écartée, A1 gardée en réserve.** A1 est séduisante pour l'image, mais elle ralentit la récolte. A2 est la seule qui garantisse « un écran » avec les données actuelles (au plus 4 gisements). A0 est un bon début (déjà livré), A3 est un détour qu'on regretterait.

## 6. Seconde question : Atelier, Arbre, Carnet

### Lecture de ta proposition

Tu proposes trois lieux, un par verbe :

- **Labo** : découvrir. Un établi simple, peu d'informations, des essais rapides, et la première pièce offerte (ingrédients gratuits, ou fabrication automatique des éléments inférieurs).
- **Arbre** : voir ce qui est fait, ce qui reste, avec des indices sur les secrets.
- **Production** (que tu appelles « le Carnet ») : fabriquer à la main ou avec des **apprentis**, et une vue de toute l'automatisation.

Je la trouve **bonne** : elle suit la division du genre ([S] Little Alchemy et Infinite Craft d'un côté, Kittens Game et Idle Crafting Master de l'autre) et elle sépare trois besoins qui se gênent dans l'Atelier actuel (45 matières, 14 gestes, commandes, machines, étude, rapide, tout dans 3 000 px).

### Le Labo, précisé

Le jeu a déjà la bonne idée : « *une petite découverte (6 matières au plus) sort tout de suite ; une grosse s'inscrit au Carnet sans rien prendre* » (README). Le Labo la généralise :

1. **Échantillons.** Pour essayer, on pose des *échantillons* de toute matière déjà rencontrée, **sans prélever la réserve**, comme les éléments inépuisables de Little Alchemy [S]. Un objet fabriqué au moins une fois devient lui aussi un échantillon.
2. **La première pièce est offerte.** Une trouvaille donne la recette et **une pièce**. La production réelle (quantités, extracteurs, temps) se fait ailleurs.
3. **Chaîne manquante.** Si la recette demande un objet intermédiaire jamais fabriqué, le Labo le dit (« à découvrir d'abord ») : la progression par la découverte reste ordonnée.
4. **Un seul espace.** L'établi, trois cases, le geste (l'outil posé sur l'établi, ce que fait déjà l'Atelier à 0.38), un bouton, le thermomètre. En dessous, **une rangée** de matières récentes et favorites, plus une feuille de recherche. Pas de liste de 45.
5. **Mémoire des trouvailles.** Un petit compteur et un accès à la liste des recettes trouvées, avec « première découverte » mise en avant [S, Infinite Craft].
6. **Indices.** Le thermomètre reste (froid à brûlant) ; l'Intuition ✨ sert à acheter un indice. Aucun changement d'économie.

Risques : si les échantillons sont gratuits, **la découverte ne coûte plus rien**. C'est voulu : la difficulté bascule vers *la production* (quantités, temps, extracteurs, apprentis). Il faut s'assurer que cette seconde moitié est assez intéressante pour porter le jeu, d'où la prochaine partie.

### La Production, précisée

Nom provisoire : **Atelier** (tu l'appelles Carnet ; voir la section 7 sur les noms).

1. **Choisir quoi produire** : une liste de recettes connues, rangée par âge et favoris, avec une quantité choisie une fois (×1, ×10, Max). Une pièce se fabrique à la main d'un appui, ou se confie.
2. **Des apprentis, au pluriel.** Un apprenti est une **unité affectée à une recette** (ou à un geste) qui produit tout seul jusqu'à une quantité cible en réserve. Plusieurs apprentis, une cible chacun. Ils montent de niveau avec le geste (les niveaux de gestes existent déjà). Les machines (automate de bois, de bronze, presse à vapeur, chaîne, assembleur) deviennent **des apprentis de paliers supérieurs** : on garde les 5 paliers et le plafond d'ingrédients (1, 2, 3), mais ils prennent un visage.
3. **Une vue d'ensemble de l'automatisation** : une ligne par apprenti ou machine, l'état (produit, manque tel ingrédient, plein), le débit, un bouton pour relancer ce qui est bloqué. Les chaînes se lisent d'un coup.
4. **Les extracteurs restent aux terres** (les ressources) ; les apprentis et machines sont à l'Atelier (les recettes). C'est la distinction que tu proposes, et elle est lisible.

Risques : c'est **un système nouveau** pour le moteur (ordres permanents). Il faut un simulateur à jour (`tools/sim-passages.js` joue déjà des profils) et un test de joueurs avant de dépenser plus. Une version légère existe : renommer et réafficher les machines et la file des commandes existantes sous la forme d'apprentis, sans changer le moteur (voir B3).

### L'Arbre, précisé

Aujourd'hui (0.38) : une page de progression par âge. Ce qu'il peut devenir : **la carte de ce qui est fait et de ce qui reste**, avec :
- les recettes trouvées, les pistes (fantômes) et les âges à venir, déjà là ;
- des **indices de secrets** : des cases « ? » qui portent une phrase cryptique et apparaissent quand leur condition est remplie, sans rien révéler (règle du coffre) ;
- un lien direct vers le Labo : toucher une piste ouvre le Labo avec le geste et les matières pré-sélectionnés, **sans donner la solution** (seulement ce que l'Intuition aurait déjà montré).

Le Journal (fragments, signes, fins) garde le récit.

### Options

**B1. Les trois lieux (ta proposition).** Labo, Atelier (production et apprentis), Arbre. Onglets : Monde (A2), Labo, Atelier, Arbre, Journal : **cinq**, dans la plage conseillée [S]. Coût : XL au total, par étapes.

**B2. Deux lieux, l'Arbre dans le Labo.** Le Labo s'ouvre sur l'arbre des pistes ; on touche une piste, l'établi se prépare. L'Atelier produit. Onglets : Monde, Labo (avec l'Arbre), Atelier, Journal : **quatre**. Pour : moins d'onglets, l'arbre devient une porte d'entrée de la découverte (Cell to Singularity a un arbre qui sert d'achat [A]). Contre : la vue « ce qui est fait, ce qui reste » est cachée derrière l'essai ; un joueur qui veut juste *voir sa progression* ne la trouve plus d'un geste.

**B3. Évolution douce.** Le Labo est un *mode* de l'Atelier (bascule Essayer / Produire), les échantillons gratuits s'ajoutent au moteur (petit), les machines sont ré-affichées en apprentis, le tableau d'automatisation est une feuille de l'Atelier. Arbre et Carnet inchangés. Coût : M. Pour : tout se teste vite. Contre : la confusion Atelier/Carnet/Arbre demeure en partie.

### Mon avis

**B1 comme cible, B3 comme première marche.** B2 est élégante mais déplace la progression ; je la garde en alternative si les tests montrent que l'Arbre n'est presque pas ouvert.

## 7. Noms

Le mot « Carnet » désigne déjà un **style** (le papier), un **onglet** (la liste des recettes) et, dans ta proposition, un **lieu de production**. Trois sens pour un mot, c'est de la confusion garantie. Je propose :

- **Labo** (ou *L'établi d'essai*) : essayer.
- **Atelier** : produire, avec ses apprentis.
- **Carnet** : le *livre* des recettes, ouvert depuis le Labo (pour revoir) et l'Atelier (pour choisir quoi produire), pas un onglet.
- **Arbre** ou **Chemin** : progresser.
- Le style de papier s'appelle **Aspect**, déjà fait.

À décider ensemble.

## 8. Scénarios

| | Contenu | Onglets | Coût | Ce qu'on teste |
|---|---|---|---|---|
| **S1. Marche par étapes** (recommandé) | B3, puis A2, puis B1 par morceaux | 6 puis 5 | M, puis L, puis XL | à chaque étape, 5 à 8 joueurs |
| **S2. Refonte directe** | A2 + B1 en un lot | 5 | XL | une seule fois, tard |
| **S3. Retouche** | A0 + B3, rien d'autre | 6 | S à M | mesure du gain réel avant d'aller plus loin |

Étapes de S1, chacune livrable, testable et réversible :

1. **0.39 : Labo en mode de l'Atelier.** Échantillons gratuits, première pièce offerte, chaîne manquante signalée, rangée de matières récentes ; machines ré-affichées en apprentis ; vue d'automatisation en feuille. Moteur : petit (une règle de découverte, un compteur d'échantillons).
2. **0.40 : « Terres » en pager (A2)**, Atlas en feuille, objectif et relève en pastilles. Test d'écran unique.
3. **0.41 : Atelier de production et vraie affectation d'apprentis** (ordres permanents), simulateur à profils.
4. **0.42 : Arbre avec indices de secrets** et lien vers le Labo.
5. **Entre chaque étape : test de joueurs** (`docs/TEST-JOUEURS.md`) avec les mesures de la section 4.

## 9. Ce que j'écarte, et pourquoi

- **Une scène plein écran sans listes** (style Hay Day) pour tout : trop cher et trop lent pour la récolte.
- **Génération de recettes par IA** (Infinite Craft [S]) : le jeu est écrit à la main, ton compris ; une recette générée ne peut pas porter un secret.
- **Tapis et logistique** : déjà abandonnés en 5.0 (`docs/REFONTE.md`), toujours vrai sur téléphone.
- **Emplacements sur les terres** (Q5 du plan arbre) : une grille de plus, avant d'avoir réglé l'écran.
- **Plus d'onglets** : on en retire un, on n'en ajoute pas.

## 10. Étude de marché à faire (plutôt qu'à citer)

Je propose une session de jeu, de 30 minutes par titre, avec une grille commune : nombre d'onglets, défilement de la page principale, geste le plus fréquent et son nombre d'appuis, place de la découverte, place de l'automatisation, révélation progressive, hauteur de la zone utile. Titres : Kittens Game, A Dark Room, Egg, Inc., Idle Miner Tycoon, Little Alchemy 2, Infinite Craft, Cell to Singularity, Idle Crafting Master, un jeu de ferme à scène (Hay Day ou Township). Résultat : un tableau de faits, pas d'avis.

## Sources

- [A Dark Room, analyses (PopMatters, GDC)](https://www.popmatters.com/183319-a-dark-room-the-most-fun-youll-ever-have-with-a-spreadsheet-2495645232.html)
- [Idle Crafting Master, fiche App Store](https://apps.apple.com/us/app/-/id6752571848)
- [Idle Miner Tycoon, guide BlueStacks](https://www.bluestacks.com/blog/game-guides/idle-miner-tycoon/idt-beginner-guide-en.html)
- [Egg, Inc., fiche et wiki](https://apps.apple.com/gb/app/egg-inc/id993492744)
- [Little Alchemy 2, critique KeenGamer](https://www.keengamer.com/articles/reviews/mobile-reviews/the-little-alchemy-2-review-discoveries-and-experimentations-littlealchemy2-com/)
- [Infinite Craft (Wikipédia)](https://www.wikipedia.org/wiki/Infinite_Craft)
- [Bottom tab bar : bonnes pratiques (UX Planet)](https://uxplanet.org/bottom-tab-bar-navigation-design-best-practices-48d46a3b0c36)
- [Kittens Game, raccourcis d'onglets (Incremental Musings)](https://zinsho.github.io/incremental_musings/scripts/kittensgame/2018/02/19/kg-tabswitch)
- Internes : `AUDIT-CELL-TO-SINGULARITY.md`, `AUDIT-CLICKY-ISLANDS.md`, `PLAN-ARBRE-ERGONOMIE-NIVEAUX.md`, `docs/REFONTE.md`, `docs/revue/rythme-0-37.md`.
