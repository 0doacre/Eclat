# Atelier par équipements — prototype V1

## Intégration dans le jeu de prévisualisation

L’accueil `index.html`, sur cette branche, ouvre désormais le jeu complet avec l’Atelier par postes et outils. `js/atelier-equipe.js` est un composant du véritable onglet Atelier : il reçoit le moteur, le stock, les sauvegardes, les icônes, le Carnet et les commandes du jeu, sans créer une partie ni une boucle de simulation séparées. Le Domaine et les terres restent la source des ressources. La récolte reste dans le Domaine ; les fiches et l’étude restent accessibles depuis les autres écrans (Carnet et Arbre notamment). Le tutoriel des premiers gestes est adapté.

La partie expérimentale utilise `eclat.preview.craft.v1`, ses propres copies de secours et son propre verrou de navigateur. Au premier lancement, si une partie locale `eclat.save.v1` existe, le jeu en charge une copie migrée et enregistre ensuite uniquement dans la clé de prévisualisation. La sauvegarde d’origine n’est pas réécrite. Les identifiants des comptes sont isolés et la synchronisation en ligne est désactivée pour ce profil. Une ancienne sauvegarde peut aussi être importée par le menu habituel.

Les recettes et postes des quatre premiers âges utilisent les nouveaux outils. Les âges suivants restent jouables avec le bouton « Procédés après le Cuivre », qui donne accès à leur interface historique : leur refonte n’est pas encore réalisée. Le profil `fullGame` résout explicitement la collision entre tunique et gants. Le moteur strict du prototype reste inchangé ; les recettes ultérieures ne sont pas artificiellement attribuées à des outils sans conception.

`index.html?atelier=classique` charge séparément le moteur et la sauvegarde habituels pour comparaison. La page `prototype-equipements.html` reste un bac à sable indépendant, utile aux scénarios accélérés mais désormais facultatif pour tester la nouvelle boucle.

L’Atelier intégré est volontairement dépouillé : matières en lignes pleine largeur, nom sans coupure au milieu des mots, compteur unique et sélection contrastée. Aucun bouton de récolte ou de fiche, ni paragraphe expliquant le clic. La navigation des postes apparaît seulement à partir du deuxième poste disponible. Si l’établi principal sort de la zone visible avec des matières sélectionnées, une barre compacte reprend ces matières et le geste actif ; elle disparaît quand l’établi revient ou est vidé. Les recettes connues proposent la préparation par leur nom et une action directe « Fabriquer ».

`tools/test-atelier-integre-ui.js` vérifie la découverte depuis l’Atelier principal, le partage avec le Carnet/Domaine, la préservation de la sauvegarde historique, le rechargement, l’absence de synchronisation en ligne, la construction du poste, la vente, l’embauche, l’avance, l’amélioration d’outil, une recette après le Cuivre et le retour aux postes. Ces contrôles s’ajoutent aux scénarios du moteur et du prototype ci-dessous.

Branche de travail : `codex/craft-equipements`, issue de l’Atlas V7 à `a45aaa5`. Ce prototype ne remplace ni `main`, ni `prewiew-design`, ni l’Atelier habituel.

## Essayer

Servir le dépôt avec son serveur local habituel, puis ouvrir **`prototype-equipements.html`**.

La page propose une partie neuve et un exemple au Cuivre. Elle utilise exclusivement la clé locale `eclat.prototype.equipements.v1` ; elle ne charge, ne modifie ni n’exporte la partie habituelle. Le bouton de remise à zéro ne remplace que la partie d’essai, après confirmation. Le marqueur `craftProfile: equipements-v1` interdit l’importation silencieuse du prototype par le moteur normal, indépendamment du numéro de version de la sauvegarde.

Le départ fournit un percuteur, dont la recette reste présente. Le joueur choisit son atelier, pose ses matières, prend un outil visible et clique sur un geste. Exemple : Établi → bois → percuteur → Tailler. Le premier atelier est toujours visible ; les autres apparaissent lorsqu’ils sont disponibles.

Les outils de l’atelier sont à droite des matières sur bureau et sous les matières sur mobile. Tous les outils disponibles pour ce poste restent visibles, indépendamment des ingrédients choisis. Chaque outil annonce ses gestes. Le geste courant est le bouton principal ; ses autres gestes sont des boutons d’action voisins, utilisables directement. Il n’y a plus de bouton « Essayer », de résolution automatique de l’outil ni de dialogue après tentative.

Les postes fixes (foyer, four, poste de frappe, dalle de polissage) ne figurent plus parmi les outils portables de l’établi. Chaque poste montre son propre moyen de travail et ses gestes : braises du foyer, chambre de cuisson, enclume et percuteur, dalle de polissage. Les outils qui ne servent jamais d’ingrédients restent hors de la grille des matières.

Cliquer une recette connue prépare ses matières, son atelier, son outil et son geste. Le bouton conserve le verbe correspondant ; une fabrication connue rejoint la file des mains. Le bouton distinct « Commander » conserve la préparation automatique des composants et outils connus par le planificateur. Un outil encore absent est signalé plutôt que remplacé silencieusement.

Une première amélioration est testée : le couteau de silex découpe les lanières deux fois plus vite que le racloir, à coût et quantité produite identiques. Le racloir reste utilisable. Le bénéfice figure sur le couteau ; pour une recette de lanières connue, les matières posées et l’outil choisi affichent une estimation pour la série de l’outil : cinq fabrications au racloir (dix lanières), dix au couteau (vingt lanières). Aucun raccourci de série ne révèle une recette inconnue. Les autres recettes gardent leurs temps antérieurs ; les machines ne reçoivent pas ce bonus.

Une fabrication lancée par un geste conserve son outil dans `equipmentSelection`, y compris après rechargement et changement d’outil dans l’interface. Si cet outil disparaît, elle attend son retour. Les lots explicitement lancés avec des outils différents ne fusionnent pas. Les commandes automatiques et la préparation d’une recette connue privilégient le meilleur outil compatible disponible. Les anciennes commandes d’avant la refonte gardent leur rythme antérieur.

L’interface d’essai n’est pas encore l’intégration graphique dans le jeu : elle n’inclut pas le guide complet, la relève et les écrans des âges suivants. Elle n’est pas une nouvelle version du jeu publiée sur la prévisualisation.

## Lire et sentir le travail de l’atelier

Sur grand écran, le stock est placé à côté du poste de travail et défile dans son propre panneau. Sur les formats étroits, il suit immédiatement le poste ; deux liens permettent de passer des matières à l’établi. Les outils restent accessibles dans un râtelier horizontal sur mobile, indépendamment des ingrédients choisis.

Un clic pose une matière, un second la retire. « Posé », « Prêt à poser », stock vide et établi plein ont des états explicites ; une matière sélectionnée reste activable même si son stock est épuisé. La recherche filtre le stock sans modifier les matières déjà posées. Les recettes préparées indiquent le stock et les quantités manquantes dans les emplacements. Une action est désactivée seulement si aucun ingrédient n’est posé : les combinaisons inconnues restent expérimentables.

Trois panneaux distinguent bourse, ouvrier et marchand. L’objectif d’embauche indique les écus manquants pour recruter et avancer un écu, ainsi que le nombre de lanières à vendre selon le barème actuel (hors réserve). Les jauges reflètent la progression réelle de l’ouvrier et le passage du marchand. Le surplus affiche son brut, sa taxe et son net avant vente ; le gain net réalisé est signalé après vente. Les tranches fiscales et le bilan détaillé sont repliés. L’estimation après salaire précise qu’elle exclut le coût des peaux.

De brèves variations d’opacité accompagnent une sélection, une découverte, une fabrication de l’ouvrier et une vente réelle. Elles respectent la préférence de réduction des animations ; aucun faux cycle ou bruitage automatique n’est ajouté. Les règles de production, de salaire et de taxe restent inchangées dans cette passe.

## Premier circuit économique

Le bouton « Essai ouvrier + marchand » remplace uniquement la partie d’essai après confirmation. Il prépare des terres et des stocks à l’âge 2, sans écus, racloir, établi aménagé ou couteau offerts. Quelques recettes sont connues pour concentrer le test sur la chaîne : racloir → poste aménagé → découpe et vente → recrutement et salaire → couteau. Ce scénario ne mesure pas le rythme normal depuis le Bois.

`js/atelier-economie.js` est attaché uniquement au profil expérimental. Son état `atelierEconomy` est sauvegardé et avancé dans les pas normaux du moteur, y compris le rattrapage hors ligne plafonné.

- Un ouvrier, affecté aux lanières connues, exige un établi aménagé et un outil compatible. Il prend le meilleur outil disponible et travaille en parallèle des mains du joueur. Sa cadence est cinq fois le temps unitaire manuel ; le couteau réduit donc ce temps de moitié.
- L’établi aménagé est une recette : 10 bois, 3 cordes et 4 pierres. Il améliore le poste existant, sans ajouter un onglet supplémentaire.
- Recrutement : valeur brute de vingt lanières, soit 3,125 écus actuellement. Salaire : 25 % du brut d’une fabrication, soit 0,078125 écu pour deux lanières. L’affichage arrondit à deux décimales ; le calcul conserve les fractions.
- L’avance est soustraite de la bourse et mise de côté. Le salaire est débité uniquement après travail achevé. Sans budget ou matières, la production s’arrête : aucune dette. L’avance non utilisée est récupérable en pause et n’est pas réalimentée automatiquement.
- Le marchand vend uniquement le surplus de lanières au-dessus de la réserve choisie, sur activation explicite, toutes les cinq secondes. Une vente immédiate du surplus permet de financer le recrutement. Le prix de référence est `E.value`, sans la saturation des ventes classiques.
- Taxe marginale par périodes de soixante secondes : 10 %, 20 %, 30 %, 40 %, puis 50 % maximum. Une tranche représente au moins vingt lanières ; sa taille est calculée selon la capacité théorique de l’ouvrier embauché et la production automatique de lanières. Ce n’est pas le volume réellement fabriqué pendant la minute. Le seuil reste fixe pendant la période. Fractionner les ventes ou désactiver le marchand ne réinitialise pas le compteur.
- Les ventes alimentent les écus, sans appeler `sell` ni modifier `comptoir.sold`, les demandes ou la réputation du troqueur. Brut, taxes, net et salaires sont suivis séparément.

Tarifs, cadence, réserve et période sont provisoires. Le bilan net moins salaires ne valorise pas le coût d’opportunité des peaux ni le recrutement initial. Rentabilité globale, diversification, plusieurs recettes/ouvriers et effets de la taxe sur une longue partie restent à éprouver.

## Contenu

Les 54 recettes existantes des âges Bois, Os, Pierre et Cuivre sont conservées. Quatre recettes de prototype sont ajoutées :

| Équipement | Âge | Fabrication | Usage |
|---|---:|---|---|
| Percuteur de pierre | Bois | Mains, assembler 2 pierres | Préparer manches, aiguilles et éclats |
| Racloir en os | Os | Percuteur, tailler 3 os + 1 pierre | Couper les premières lanières avant la Rivière |
| Dalle de polissage | Cuivre | Mains, assembler 8 pierres + 4 bois | Polir le miroir avec le sable consommé |
| Établi aménagé | Bois | Mains, assembler 10 bois + 3 cordes + 4 pierres | Accueillir un ouvrier |

Ces prix sont des valeurs de prototype, pas un équilibrage définitif.

Les aiguilles ne sont plus consommées pour les nouvelles fabrications d’outres, tuniques et flûtes : une aiguille possédée sert d’équipement. L’éclat du rouage devient une condition de taille par couteau au lieu d’un ingrédient consommé. Les éclats incorporés aux haches et couteaux restent consommés. Le prix du feu, y compris l’archet, reste inchangé. Le type d’objet des aiguilles et des éclats est conservé ; aucun exemplaire n’est transformé ou supprimé à la migration.

Le poste de frappe réunit l’enclume et le percuteur. Le ciseau sert à refendre le cuivre ; la pioche prépare l’enclume. Le racloir et le couteau sont tous deux compatibles avec les lanières. Le racloir évite la boucle « lanières → outre → Rivière → silex → couteau → lanières ».

Le feu propose chauffe douce, cuisson vive et carbonisation à l’étouffée. Le four propose cuisson et fonte. Leurs compatibilités sont explicites : une brique accepte plusieurs postes, un minerai n’est pas fondu au feu, et un épieu ne se découvre pas dans le mauvais poste simplement parce qu’on possède globalement un four plus chaud. Les modes sont des procédés de jeu qualitatifs, pas des températures physiques validées.

## Moteur et contrat d’intégration

`EclatEquipements.createData(base)` copie les données pour le prototype. Le contenu de base et son index normal ne sont pas mutés. `EclatEngine.withData(data)` crée une fabrique de moteurs indépendante ; `createEngine()` normal conserve ses données et sa version de sauvegarde.

L’option `{ gentleStart: false }` conserve l’amorçage strict pour les tests de dépendances. Par défaut, le percuteur est présent dès le départ sans augmenter les statistiques de fabrication. Une sauvegarde d’essai existante reçoit cet outil s’il lui manque, sans perdre ses stocks ni sa progression.

- `workplaceList()` et `workplaceFor(equipmentId)` : lieux et appartenance des outils.
- `attemptAt(workplaceId, ingredients)` : ancienne résolution automatique conservée dans le moteur expérimental pour comparaison ; l’interface actuelle ne l’utilise plus. Renvoie `choice` si plusieurs résultats sont possibles.
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

- `npm run test:equipements` : 38 scénarios, dont fabrication initiale, distinction des recettes, préparation et partage des outils, migrations, chemin jusqu’à la Rivière et apprentissage progressif. L’amélioration du couteau est vérifiée par la durée réelle et la production, la conservation du choix après chargement, l’attente d’un outil manquant et la non-fusion des lots utilisant des outils différents.
- `npm run test:economie` : 13 scénarios sur les taxes marginales, la réserve, l’indépendance du troqueur, la construction, les salaires, les outils, les sauvegardes et le hors ligne.
- `npm run test:equipements-ui` : parcours complet de fabrication, vente, embauche et amélioration, en plus des contrôles sur 320, 360, 390 et 980 px : outils visibles, gestes annoncés avant essai, premier manche au percuteur, outils propres au poste, aucune résolution automatique ni filtrage par les ingrédients, gestes secondaires directs, disposition mobile/bureau, conservation de l’aiguille, comparaison des outils, séries de découpe et rechargement. Le jeu habituel est ensuite ouvert dans le même profil : son moteur reste en v12, avec ses 267 objets et sans règles d’équipements expérimentales.
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
