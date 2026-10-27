# Atelier par équipements — prototype V1

Branche de travail : `codex/craft-equipements`, issue de l’Atlas V7 à `a45aaa5`. Ce prototype ne remplace ni `main`, ni `prewiew-design`, ni l’Atelier habituel.

## Essayer

Servir le dépôt avec son serveur local habituel, puis ouvrir **`prototype-equipements.html`**.

La page propose une partie neuve et un exemple au Cuivre. Elle utilise exclusivement la clé locale `eclat.prototype.equipements.v1` ; elle ne charge, ne modifie ni n’exporte la partie habituelle. Le bouton de remise à zéro ne remplace que la partie d’essai, après confirmation. Le marqueur `craftProfile: equipements-v1` interdit l’importation silencieuse du prototype par le moteur normal, indépendamment du numéro de version de la sauvegarde.

Le départ fournit un percuteur : le premier manche demande seulement de poser du bois et d’essayer. La recette du percuteur reste présente. Le choix du lieu apparaît avec le premier feu, puis le four devient un troisième lieu après sa construction. Les outils et réglages restent automatiques lorsqu’une combinaison ne donne qu’un résultat compatible avec le lieu choisi.

Lorsque plusieurs résultats sont possibles, le bouton « Essayer » propose les gestes correspondants, sans nommer les recettes à découvrir et sans consommer de matière avant le choix. Deux outils donnant le même résultat ne provoquent pas de choix supplémentaire. Une recette déjà connue prépare sa commande, y compris les outils et composants connus nécessaires.

Après la première fabrication, un volet replié « Les outils de l’atelier » donne accès à la sélection manuelle. L’appui long sur le nom de l’équipement actif et le bouton « Changer d’outil » ouvrent les mêmes variantes de sa famille. Le catalogue permet de changer de famille. Le retour au choix automatique est explicite. Les outils qui ne servent jamais d’ingrédients sont retirés de la grille des matières, mais restent dans ce catalogue et les recettes connues.

L’interface d’essai n’est pas encore l’intégration graphique dans le jeu : elle n’inclut pas le guide complet, la relève et les écrans des âges suivants. Elle n’est pas une nouvelle version du jeu publiée sur la prévisualisation.

## Contenu

Les 54 recettes existantes des âges Bois, Os, Pierre et Cuivre sont conservées. Trois recettes de prototype sont ajoutées :

| Équipement | Âge | Fabrication | Usage |
|---|---:|---|---|
| Percuteur de pierre | Bois | Mains, assembler 2 pierres | Préparer manches, aiguilles et éclats |
| Racloir en os | Os | Percuteur, tailler 3 os + 1 pierre | Couper les premières lanières avant la Rivière |
| Dalle de polissage | Cuivre | Mains, assembler 8 pierres + 4 bois | Polir le miroir avec le sable consommé |

Ces prix sont des valeurs de prototype, pas un équilibrage définitif.

Les aiguilles ne sont plus consommées pour les nouvelles fabrications d’outres, tuniques et flûtes : une aiguille possédée sert d’équipement. L’éclat du rouage devient une condition de taille par couteau au lieu d’un ingrédient consommé. Les éclats incorporés aux haches et couteaux restent consommés. Le prix du feu, y compris l’archet, reste inchangé. Le type d’objet des aiguilles et des éclats est conservé ; aucun exemplaire n’est transformé ou supprimé à la migration.

Le poste de frappe réunit l’enclume et le percuteur. Le ciseau sert à refendre le cuivre ; la pioche prépare l’enclume. Le racloir et le couteau sont tous deux compatibles avec les lanières. Le racloir évite la boucle « lanières → outre → Rivière → silex → couteau → lanières ».

Le feu propose chauffe douce, cuisson vive et carbonisation à l’étouffée. Le four propose cuisson et fonte. Leurs compatibilités sont explicites : une brique accepte plusieurs postes, un minerai n’est pas fondu au feu, et un épieu ne se découvre pas dans le mauvais poste simplement parce qu’on possède globalement un four plus chaud. Les modes sont des procédés de jeu qualitatifs, pas des températures physiques validées.

## Moteur et contrat d’intégration

`EclatEquipements.createData(base)` copie les données pour le prototype. Le contenu de base et son index normal ne sont pas mutés. `EclatEngine.withData(data)` crée une fabrique de moteurs indépendante ; `createEngine()` normal conserve ses données et sa version de sauvegarde.

L’option `{ gentleStart: false }` conserve l’amorçage strict pour les tests de dépendances. Par défaut, le percuteur est présent dès le départ sans augmenter les statistiques de fabrication. Une sauvegarde d’essai existante reçoit cet outil s’il lui manque, sans perdre ses stocks ni sa progression.

- `workplaceList()` et `workplaceFor(equipmentId)` : lieux et appartenance des outils.
- `attemptAt(workplaceId, ingredients)` : résolution automatique dans le seul lieu choisi ; renvoie `choice` si plusieurs résultats sont possibles. Les options publiques ne contiennent que l’équipement, le mode et le nom du geste.
- `workplaceOptions(workplaceId, ingredients)` : candidats internes utilisables, dédoublonnés par résultat ; leurs identifiants de recettes ne sont pas affichés avant découverte.

Le moteur du profil expose :

- `equipmentList()` : équipements, modes et disponibilité ;
- `equipmentChoices(recipeId)` : équipements compatibles et prérequis manquants ;
- `equipmentCheck(recipeId)` : blocage et objet préalable concret ;
- `equipmentRecipe(equipmentId, modeId, ingredients)` : identité de la recette ;
- `attemptWith(equipmentId, modeId, ingredients)` : essai avec contrôle du poste et du mode.

Une sélection incompatible ne révèle pas une recette étrangère, ne consomme pas d’ingrédients et ne remplit pas artificiellement ses souvenirs. L’API du geste seul ne contourne pas ce contrôle dans le profil.

Le choix du poste et du mode participe à l’identité d’une recette. C’est nécessaire après le retrait des outils consommés : les aiguilles et la flûte demandent toutes deux de l’os ; la tunique et les gants demandent peau et fibres. Leurs équipements les distinguent. Le catalogue vérifie l’absence de collisions à équipement, mode et ingrédients identiques.

`blocker`, `blockStation` et `nextStep` signalent les nouveaux outils requis. Le planificateur insère les outils fabriquables avant leurs usages ; les commandes ne travaillent pas sans eux quand des matières arrivent dans un ordre différent. Un nouvel outil préparé par une commande rejoint immédiatement la Réserve et reste utilisable par les autres commandes, même si la première attend encore des matières. Les outils consommables des anciens lots restent au contraire leurs ingrédients réservés. La disponibilité n’introduit pas de réservation exclusive, d’usure ou de nouveau carburant.

## Anciennes commandes et parties

Le profil possède sa propre version de sauvegarde, v13. Une partie antérieure importée par l’API garde ses stocks, terres et âges. Une partie déjà jouée reçoit un percuteur d’amorçage et, si la Plaine est ouverte, un racloir. Ce rattrapage est explicite, sans prélèvement sur ses anciens stocks.

Les commandes en cours sont marquées comme provenant de l’ancien atelier. Elles gardent leurs ingrédients d’origine, les ressources réservées, l’avancement et leurs conditions antérieures d’équipement. Les anciens rouages ne deviennent pas soudain compatibles avec un automate à une ressource après la modification de leur recette. Les marqueurs survivent au rechargement. Une nouvelle commande ne fusionne pas avec un ancien lot de coût différent. Annuler restitue les véritables ressources réservées.

Les migrations de recettes 0.20 et 0.35 restent distinctes et prises en charge.

## Vérifications

- `npm run test:equipements` : 32 scénarios, dont fabrication initiale, distinction des recettes, mauvais outil/mode sans consommation ni révélation, préparation et partage des outils, migrations, anciennes machines, chemin jusqu’à la Rivière et apprentissage progressif (départ, lieux, ambiguïtés et dédoublonnage).
- `npm run test:equipements-ui` : 120 contrôles sur 320, 360, 390 et 980 px : départ sans réglages, révélation des lieux, fabrication automatique, choix contextuel, modes facultatifs, catalogue, appui long, commandes, conservation de l’aiguille, rechargement de l’essai et partie habituelle inchangée. Le jeu habituel est ensuite ouvert dans le même profil : son moteur reste en v12, avec ses 267 objets et sans règles d’équipements expérimentales.
- `npm test` : suite du jeu normal et nouveaux contrôles moteur. Le profil ne modifie pas les recettes ni les comptes de contenu de la partie normale.

## Prochain travail

Le retour de Gemini est confronté au prototype dans la revue ci-dessous. Vérifier l’ergonomie et l’apprentissage avant d’intégrer cette sélection dans l’Atelier principal. Les recettes après le Cuivre restent disponibles dans le moteur normal, mais leurs équipements ne sont pas encore conçus dans ce profil. L’étude et les souvenirs d’échec devront aussi être adaptés à la sélection d’équipement ; le prototype ne remplace pas leur interface complète.

## Revue des dépendances proposée par Gemini

Les points d’amorçage du manche, de l’aiguille, des briques et de l’enclume sont valides comme risques de conception ; ils ne décrivent pas tous des défauts présents dans ce prototype. Les tests couvrent le percuteur de la Lisière, le racloir antérieur à la Rivière, les briques au feu avant le four et la préparation des outils par le planificateur.

Quatre précisions sur les scénarios :

- Le racloir du prototype consomme 3 os **et 1 pierre** ; le scénario qui ne fournit que des os doit ajouter cette pierre.
- L’enclume est préparée avec la **pioche de pierre**, déjà disponible avant le Cuivre. Le poste de frappe combine ensuite enclume et percuteur ; il n’exige pas deux sélections actives.
- Fabriquer l’outre rend le passage de la Rivière possible, mais **n’ouvre pas la terre immédiatement** : les explorations requises et le paiement sont conservés.
- Pour les nouvelles coutures, **une aiguille possédée** suffit et n’est pas consommée. Les coûts historiques de 2 ou 4 aiguilles ne deviennent pas des exigences de possession artificielles. Les anciens lots consomment les quantités effectivement engagées.

La compatibilité descendante est décidée recette par recette : le four accepte les briques, mais ne remplace pas automatiquement le feu pour la colle ou le charbon. Aucune règle globale « meilleur équipement pour tout » n’est introduite.

Le retour identifie un cas réel, reproduit avant correction : l’aiguille fabriquée comme préalable pouvait rester dans l’établi de sa première commande, bloquant les autres usages si cette couture attendait des peaux. Les nouveaux outils rejoignent désormais la Réserve dès leur production. Un test de concurrence et rechargement vérifie leur partage ; un autre protège le comportement opposé pour les anciens lots où l’aiguille était encore un ingrédient consommable.
