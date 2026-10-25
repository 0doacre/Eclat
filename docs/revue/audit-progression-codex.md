# Audit recettes, ressources et progression, Codex

25 octobre 2026. Base figée : **0.21.0, `4a761845f88be5d46163ca318241044ea207b6be`**, après fusion de la PR 89. Comparaison avec les données 0.20.1 : `9d143e1`. Aucune règle du jeu modifiée pendant cette passe. Ce rapport précède la contre-vérification de Claude.

## Avis

Les chaînes de recettes fonctionnent et l’idée de ressources qui donnent un sens aux techniques tient. L’eau relie vapeur et refroidissement ; le pétrole raffiné et le soufre expliquent les usages du caoutchouc. En revanche, **il faut dissocier l’âge technique d’une ressource de sa valeur marchande** avant de généraliser ce modèle. Trois cas de guidage demandent aussi une correction. La réussite des tests existants et du bot ne couvrait pas ces scénarios.

## Résultats classés

### C01, priorité 1 : eau et soufre survalorisés au Comptoir

**Effet nouveau d’une règle antérieure, confirmé en 0.21.** `valueOf` attribue à une ressource brute `0,1 × 2,5^âge` écus. Il ne distingue ni abondance, ni débit, ni difficulté de récolte. Une eau introduite à la Vapeur vaut donc 61,035 écus l’unité ; la malachite vaut 1,5625 ; le soufre 2 384,186.

Scénario moteur : un seul extracteur, aucun outil, bonus, Mémoire ni don, aucune vente précédente, 12 h de récolte. Le prix de vente ci-dessous **inclut déjà la saturation**. La colonne Traces isole la conversion des écus à la relève, au rang d’âge indiqué, sans les Traces des passages.

| Ressource et extracteur | Âge (rang interne) | Débit initial | Quantité en 12 h | Vente totale | Traces des écus |
|---|---:|---:|---:|---:|---:|
| Eau, pompe à bras | Vapeur (7) | 3/s | 129 600 | 511 062 écus | **83** |
| Malachite, mine de cuivre à vapeur | Vapeur (7) | 2,4/s | 103 680 | 12 398 écus | **2** |
| Soufre, soufrière | Polymères (11) | 1,5/s | 64 800 | 16 730 098 écus | **260** |
| Bauxite, carrière à ciel ouvert (témoin antérieur) | Polymères (11) | 3/s | 129 600 | 19 963 359 écus | **310** |

La conversion a aussi été exécutée par `newCycle`, pas seulement calculée : avec le seul passage de la Plaine ajouté au scénario, elle donne respectivement 85, 4, 262 et 312 Traces, soit les montants du tableau plus 2. Ce sont des états isolés pour comparer les débits ; une vraie partie possède en général d’autres bonus et passages.

**Effet :** une pompe bon marché produit une ressource environ 39 fois plus chère que le minerai de cuivre, à un débit supérieur, ce qui favorise fortement sa vente et sa conversion en Mémoire. Pour le soufre, il faut nuancer : la bauxite permettait déjà de gros revenus au même âge. Le montant de 260 n’établit pas à lui seul une régression ; le soufre offre surtout un accès à cette tranche de prix dans les Collines, sans avoir encore ouvert les Pics. La priorité 1 est mon appréciation du risque de généraliser cette règle, pas la preuve d’une boucle infinie. Les simulateurs utilisés pour mesurer les recettes ne vendent pas ces excédents : leur réussite ne valide pas le marché.

**Proposition à comparer :** valeur marchande explicite par ressource, distincte de son âge d’apparition, ou exclusion commerciale justifiée de certaines ressources de service. Évaluer ensuite débit, saturation, prix des produits dérivés, demandes du Troqueur et Traces de relève ensemble. Ne pas simplement réduire la production d’eau pour masquer son prix : cela toucherait aussi les commandes de moteurs.

Sources du code : `js/engine.js`, `valueOf`, `sellQuote`, `ecusToTraces`, `newCycle` ; `js/data.js`, `D.COMPTOIR`, niveaux `eau_1` et `soufre_1`.

### C02, priorité 2 : la fabrication anticipée de la forge stellaire efface le guidage

**Reproduit, mécanisme antérieur à la 0.21.** Dans une partie à l’âge Spatial, terminer la forge stellaire est autorisé par la règle « âge courant ou suivant ». Ses ingrédients sont déjà accessibles au Spatial. Si le vaisseau et le passage vers Mercure restent à faire, fabriquer la forge laisse l’âge à 13, mais `E.objective()` et `E.guide()` deviennent `null`.

`E.objective` prend l’étape accomplie la plus avancée, puis cherche uniquement après elle. La forge est la dernière entrée de `D.OBJECTIVES` : la boucle ne s’exécute plus. Le rattrapage des étapes de l’âge courant, placé dans la boucle, ne s’applique donc pas.

**Effet :** les étapes existent encore et le joueur peut les retrouver manuellement ; ce n’est pas une impossibilité de fabriquer. Mais l’objectif et la prochaine étape disparaissent alors qu’ils sont encore nécessaires à la progression. C’est particulièrement gênant pour la cible occasionnelle.

**Proposition :** conserver une recherche des étapes inachevées de l’âge courant, même lorsque la dernière entrée globale a été faite. Tester la forge anticipée et les autres fabrications faites dans le désordre. Ne pas empêcher arbitrairement toute fabrication anticipée pour contourner le problème.

Source : `js/engine.js`, `E.objective`, `avancerAge`.

### C03, priorité 2 : le guide ignore les pièces déjà réunies

**Reproduit, comportement antérieur rendu plus visible par les nouvelles sous-recettes.** Réserve : 10 aimants, 20 bobines, 4 moteurs à vapeur ; stations antérieures disponibles ; dynamo connue, tuyau de cuivre et circuit encore inconnus. Résultats : `E.plan('dynamo', 1).ok === true`, `E.craft('dynamo', 1).ok === true`, mais `E.nextStep('dynamo')` demande de découvrir le tuyau de cuivre.

Le guide descend les recettes de tous les ingrédients sans vérifier quelles quantités doivent réellement être fabriquées. Une ancienne partie qui conserve ses moteurs peut donc recevoir une consigne inutile concernant la nouvelle chaîne de l’eau.

**Proposition :** fonder la prochaine étape sur les besoins réels du plan et la Réserve, y compris les pièces déjà présentes. Couvrir aussi les stocks partiels : posséder une seule pièce ne suffit pas toujours à satisfaire le lot. Conserver l’accès aux énigmes des recettes qui restent réellement à fabriquer.

Source : `js/engine.js`, `nextStep`, `E.plan`.

### C04, priorité 2 : posséder un extracteur ne garantit pas la récolte

**Reproduit ; pas un blocage systématique.** Pour le circuit de vapeur, avec toutes les recettes nécessaires connues et aucun débit d’eau : sans pompe, le guide vise `eau_1`. Si la pompe est libre en Réserve ou si le gisement est arrêté, il vise le circuit lui-même. La condition teste le nombre de pompes possédées, pas leur pose ni leur activité.

Une commande peut poser une pompe libre automatiquement, donc le cas « libre » bénéficie déjà d’un rattrapage. Une pompe arrêtée reste cependant sans débit : le besoin concret est de reprendre la récolte. Le même contrôle mérite d’être étendu aux mines d’uranium et de plomb et à la soufrière.

**Proposition :** distinguer fabriquer, poser et reprendre un extracteur ; vérifier le stock de ressource et l’état des gisements avant d’ajouter une consigne. Ne pas créer une obligation de récolter si la Réserve suffit déjà.

Sources : `js/engine.js`, `nextStep`, `pullOrderInputs`, `domExtSet` ; affichage dans `js/domaine.js`.

### C05, priorité 3 : le périmètre des bonus de vitesse est incomplet dans le texte

Récupération de vapeur et refroidissement annoncent +25 % et +50 % à la vitesse des machines. Leur effet `aspd` multiplie aussi `E.siteRate`, donc le débit des chantiers. Les deux bonus se cumulent à ×1,875. Le comportement est documenté dans le lot technique, mais ce bénéfice supplémentaire n’apparaît pas dans leurs descriptions de jeu.

**À décider :** conserver ce bénéfice et le rendre compréhensible au bon moment, ou limiter ces améliorations aux machines. Ce n’est pas un défaut d’ingrédients ou une recette inaccessible.

## Recettes, ingrédients et ressources

La version contient 259 objets, 226 recettes et 27 objets de type ressource, dont des éléments de curiosité. La revue structurelle des chaînes ordinaires est complétée par la validation globale déjà présente dans le dépôt.

- Pas de référence d’ingrédient manquante, de coût négatif ou nul, ni de recette dépassant les trois ingrédients.
- Pas de doublon de combinaison action/ingrédients détecté par l’index du moteur.
- Pas d’ingrédient ordinaire situé à un âge ultérieur à sa recette.
- Pas de station de geste, de niveau ou de chaleur obligatoirement située après la recette qui en a besoin. L’action et la chaleur sont contrôlées séparément, comme dans le moteur.
- Pas de cycle dans le graphe ordinaire des ingrédients, stations et premiers moyens d’accès aux ressources. Le charbon conserve sa voie de fabrication, ce qui évite de confondre accès à la mine et disponibilité du charbon.
- Pas de ressource ordinaire sans moyen d’accès. L’eau et le soufre ont bien leurs extracteurs ; leurs recettes n’exigent pas la ressource qu’ils doivent commencer à récolter.
- Pas de pièce ordinaire totalement sans usage après prise en compte des recettes, passages, explorations, chantiers et règles de terre.

Les alertes existantes sur **gants, masque et bouteille d’air sont des faux positifs du validateur d’utilité** : ces objets suppriment respectivement la pénalité des mains au Désert, au Gisement et aux Pics. Il ne faut pas leur ajouter une recette consommatrice pour faire taire ces avertissements. En revanche, le validateur et la liste alpha pourraient reconnaître cet usage.

### Rendements et coût du nouveau lot

Le raffinage produit 3 naphtas pour 4 pétroles. Le plastique passe donc de 1,5 à **2 pétroles par pièce** en moyenne sur un grand lot, soit +33 %. Le caoutchouc utilise environ **1,333 pétrole et 0,5 soufre par pièce**, au lieu de 1 pétrole et 0,5 charbon. Les arrondis rendent les tout petits lots un peu différents. Ce n’est pas un ingrédient gratuit ou une conservation de coût : la chaîne devient plus chère en pétrole et demande un nouvel extracteur.

Un moteur consomme désormais 12 eaux et un circuit de vapeur ; le circuit n’est pas repris à chaque seconde de fonctionnement. C’est cohérent avec les autres constructions permanentes du jeu. Les condenseurs améliorent le travail sans produire une seconde ressource d’eau : simplification de jeu explicite dans la documentation du lot.

### Logique des transformations

Le circuit eau/vapeur/condensation et le rôle du soufre dans les propriétés du caoutchouc ont un appui technique. Les recettes restent des raccourcis : le réacteur regroupe plusieurs traitements pétrochimiques et il n’existe pas de simulation des bilans d’énergie. Le fonctionnement du condenseur séparé est décrit par le [Science Museum](https://collection.sciencemuseumgroup.org.uk/objects/co50928) ; les effets du soufre sur le caoutchouc par la [RSC](https://pubs.rsc.org/en/content/articlehtml/2021/ra/d0ra10507d). Ces références appuient les propriétés choisies, pas les quantités ni les bonus chiffrés du jeu.

Je conserverais cette échelle de simplification. Un contrôle de cohérence n’est pas une raison de transformer Éclat en simulateur industriel. En revanche, un nouvel âge devrait introduire une propriété et des usages, et non valoriser une ressource ordinaire comme un minerai rare du seul fait de sa date d’apparition.

## Courbe de progression

### Bot de fin, mêmes règles et plusieurs réglages

| Fabrication | Appuis simulés/s | Graine | Fin Dyson |
|---|---:|---:|---:|
| Instantanée | 4 | 1 | 1 h 18 min 15 |
| Instantanée | 4 | 2 | 1 h 15 min 54 |
| Instantanée | 1 | 1 | 1 h 25 min 15 |
| Durée estimée, `MAINS=1` | 4 | 1 | 2 h 50 min 47 |
| Durée estimée, `MAINS=1` | 4 | 2 | 2 h 49 min 13 |
| Durée estimée, `MAINS=1` | 1 | 1 | 2 h 53 min 22 |

Les six parcours terminent. Ce bot connaît les recettes, marque les passages franchis sans en payer réellement tous les coûts et estime seulement le temps de fabrication en mode MAINS. Il ne valide ni le marché, ni l’apprentissage humain, ni une durée cible de partie.

### Modèle des passages et des commandes réelles

`tools/sim-passages.js`, profil tapeur, recettes connues avec 20 s de réflexion par première fabrication, aucune Mémoire configurée, même moteur et même simulateur pour les deux jeux de données :

| Passage | Données 0.20.1 | Données 0.21.0 |
|---|---:|---:|
| Plaine | 5,84 min | 5,84 min |
| Rivière | 17,49 min | 17,49 min |
| Collines | 33,88 min | 33,88 min |
| Profondeurs | 55,25 min | 55,25 min |
| Désert | 62,04 min | 62,04 min |
| Gisement | 96,48 min | 96,45 min |
| Pics | 128,44 min | 134,52 min |

À 240 minutes, les deux simulations sont aux Composites : la 0.20.1 attend le passage en orbite, la 0.21 fabrique encore la fusée. Aucune annulation de commande pour gel dans ces deux parcours. Le lot ne dégrade pas les premiers passages ; il ajoute environ **6,08 minutes jusqu’aux Pics** dans ce modèle, pas seulement les deux minutes suggérées par le bot idéal.

Avec le profil veilleur (séances de 5 min, absences de 4 h), la 0.21 ouvre les Pics à 111,65 minutes actives ; à 120 minutes actives, 94 h se sont écoulées et il vise l’autoclave. Il reste aux Polymères. Cela montre le poids de la production hors ligne, pas qu’un joueur réel progressera à cette vitesse.

Le mode premier parcours, sans recettes connues d’avance, a également été comparé sur 60 minutes avec les deux données : même âge Pierre, mêmes passages du cycle observé et même nombre d’actions simulées. Les nouvelles chaînes ne touchent donc pas le début dans ce scénario. Les actions simulées ne sont pas nécessairement autant de pressions physiques : le jeu offre une récolte continue.

### Lecture de conception

Les durées corrigées du plan alpha restent justes pour le bot idéal. Mais un âge de 29 secondes dans ce bot n’est pas une preuve suffisante de manque de contenu : des composants peuvent avoir été préparés avant, et le modèle omet le coût des passages. L’Acier et le Silicium méritent une observation ciblée avant d’ajouter leurs ressources.

La Vapeur a maintenant six étapes, les Polymères huit. Les nouvelles pièces forment des chaînes utiles, mais récupération de vapeur et refroidissement sont imposés par les objectifs de progression. Ils ne constituent pas deux choix de spécialisation. Avant d’ajouter encore des chaînes obligatoires, tester si ces améliorations doivent rester des étapes ou devenir des options utiles. Il faut mesurer la compréhension et la fatigue d’un joueur occasionnel, pas chercher à faire monter la durée du bot.

## Vérifications et reproductibilité

- `npm test` réussi : 217 tests principaux, plus suites spécialisées dont 8 densité, 7 Carnet, 16 Arbre, 19 simulateur, 60 récit et 14 serveur ; syntaxe, validation du contenu et cache vérifiés.
- `node tools/audit-progression.js > audit.json` reproduit les contrôles structurels et les cas C01 à C04 sur des états jetables. Il décrit des observations, il ne modifie pas les règles pour faire passer les résultats.
- `node tools/sim.js 4 dyson 1`, puis variantes graine 2 et 1 appui/s ; mêmes commandes avec la variable d’environnement `MAINS=1`.
- `node tools/sim-passages.js --joueur tapeur --minutes 240 --json` et `--joueur veilleur --minutes 120 --json` pour les profils de la version courante.
- `node tools/audit-simulations.js baseline --joueur tapeur --minutes 240` charge les données de `9d143e1` dans le même moteur/simulateur. Remplacer `baseline` par `current` pour la 0.21. Ajouter `--parcours --minutes 60` pour le test de début sans recettes acquises.

Les 480 contrôles mobiles ont réussi sur le lot 0.21 lors de son intégration ; ils ne sont pas une nouvelle mesure d’équilibrage de cette passe. Aucun prétendu test à cinq joueurs n’a été effectué. Les secrets ont été soumis aux tests existants sans reproduire leurs solutions dans ce rapport.

## Comparaison avec Claude

La demande neutre est dans `demande-audit-claude.md`. Le résumé indépendant de Claude a été transmis par l’auteur. La confrontation et les reproductions complémentaires se trouvent dans **`comparaison-audits-codex-claude.md`** : elles ajoutent les problèmes de sauvegarde et la cause de l’écart Windows/Linux du service worker, confirment le problème de marché et nuancent les corrections proposées. Le rapport intégral et les scripts du scratchpad de Claude n’ont pas été fournis ; les tests seulement annoncés y restent distingués des cas rejoués ici.

Ordre proposé après confrontation : marché et Traces, disparition des objectifs, guide fondé sur la Réserve et la production réelle, puis décisions sur les bonus et les étapes obligatoires. Ne pas ajouter tout de suite de nouvelles ressources aux autres âges sur la seule base du temps du bot.
