# Éclat : audit ergonomie, UI/UX et progression casual

Audit du 24 octobre 2026. Base : `main`, commit `b5abe2e10b671f2b7aa071423e02839319fd4388` (version affichée 0.13.2). La branche par défaut GitHub était moins récente ; les illustrations et le nouvel arbre de `main` ont été conservés.

## Demande reformulée

Auditer tous les écrans et les parcours essentiels d’Éclat pour réduire les manipulations répétitives, rendre la prochaine action compréhensible et faciliter la lecture sur téléphone. Comparer les principes utiles des incremental, idle, clicker et jeux mobiles à interactions simples. Examiner le démarrage, la récolte, la découverte, les commandes, les objectifs, les passages, le retour d’absence, la relève, le récit et les réglages. Associer chaque constat à une preuve, un impact, une priorité et une solution. Implémenter les corrections prioritaires vérifiables, préserver les décisions intéressantes et l’économie, tester les parcours et publier les changements après validation.

## Méthode et limites

- Lecture du code des interfaces et de la documentation de progression, du lexique et du style rédactionnel.
- Inspection dans Chromium de parties neuves et d’une sauvegarde migrée de l’âge de l’Électricité ; captures à 390 × 844 px.
- Contrôles automatisés à 320, 360, 390 et 430 px, en thème Jour puis Veillée avec grand texte. Test de l’en-tête avec tous ses boutons affichés. Réduction des mouvements activée dans le navigateur de test.
- Parcours du premier manche, de la récolte, de la navigation, du Carnet liste/arbre, d’une commande ×10, des détails de commande, de la confirmation de relève et de l’export JSON réimporté dans le moteur.
- Simulation de 30 minutes pour repérer les ruptures de rythme. Aucun participant humain : les temps de compréhension, le plaisir, la rétention et le taux d’erreur des joueurs ne sont pas mesurés.

Le benchmark ci-dessous repose sur des documents des créateurs/plateformes et le wiki officiel de Melvor, pas sur une campagne de jeu comparatif des versions mobiles actuelles. Les parcours secrets, toutes les combinaisons des treize âges, VoiceOver, TalkBack, Safari iOS, le matériel Android et les achats/connexions à un vrai compte ne sont pas couverts par les tests navigateur. Ce rapport n’est pas une certification d’accessibilité.

## Références et principes transférables

| Référence consultée | Principe documenté | Application à Éclat |
|---|---|---|
| [Idle Miner Tycoon, Kolibri : évolution des managers](https://www.kolibrigames.com/blog/introducing-super-manager-2-0/) | Les managers automatisent les travailleurs ; le joueur organise leur utilisation. | Rendre la récolte continue explicite. Les extracteurs et les commandes en chaîne existent déjà : améliorer leur découverte avant d’ajouter un système. |
| [Egg, Inc., fiche publiée par Auxbrain](https://play.google.com/store/apps/details?id=com.auxbrain.egginc) | Une ferme visible accompagne les investissements et l’équilibrage des ressources ; expérience conçue aussi pour les casual. | Garder les illustrations et la progression perceptible, mais rapprocher ressource, quantité et action pour éviter la navigation dans des menus. |
| [Melvor Idle, guide débutant du wiki officiel](https://wiki.melvoridle.com/index.php?title=Beginners_Guide) | L’activité choisie progresse en continu et peut continuer hors ligne ; le retour résume les gains. | Une activité doit avoir un nom, un état, un arrêt explicite et un accès à son contexte. La barre de récolte doit montrer son gisement. |
| [Monument Valley, intervention de l’équipe ustwo](https://nicertuesdays.itsnicethat.com/talks/ustwo-games-06-05-2025-london) | L’équipe décrit un petit ensemble d’interactions tactiles simples, et un travail conjoint sur les puzzles et le rendu. | Préserver la découverte des recettes tout en expliquant les commandes. Une difficulté d’énigme peut être voulue ; une commande ambiguë ne l’est pas. |
| [Apple, conception de jeux tactiles](https://developer.apple.com/videos/play/wwdc2024/10085/) et [Google, bonnes pratiques Playables](https://developers.google.com/youtube/gaming/playables/certification/best_practices_design) | Contrôles confortables, adaptation à l’écran, lisibilité et états perceptibles. Apple vise couramment 44 points ; Google recommande 48 dp. | Seuil de contrôle retenu ici : 44 × 44 pixels CSS pour les commandes usuelles. Les unités natives ne sont pas équivalentes à une certification web ; vérifier ensuite sur appareils physiques. |

Les adaptations dans la dernière colonne sont des recommandations pour Éclat. La popularité de ces jeux n’est pas une preuve que tous leurs choix conviennent au projet.

## Diagnostic et corrections livrées

P1 : friction fréquente ou obstacle à l’accès. P2 : confort et compréhension.

| Priorité | Constat et preuve dans la base auditée | Effet pour le joueur | Correction |
|---|---|---|---|
| P1 | `index.html` interdisait le zoom avec `user-scalable=no`. | Le joueur ne pouvait pas demander un agrandissement normal au navigateur. | Restriction supprimée ; le réglage Grand texte existant est conservé. |
| P1 | Mesures à 390 px : menu 38 × 38, récolte 44 × 40, petits boutons 34 px de haut, filtres du Journal 32 px. `css/style.css`, `css/theme.css`. | Précision excessive demandée au pouce, surtout pour des actions répétées. | Cibles usuelles à 44 px minimum, y compris petits boutons, filtres, fermeture, barre d’activité et bascule Liste/Arbre. |
| P1 | `viewAtelier()` présentait un établi vide et « Va récolter dans le Domaine ». Un manche demande 3 bois (`ITEMS.manche.r`). | Aller-retour d’onglets et tentative prématurée avec une quantité insuffisante. | Récolte continue du bois directement dans le premier Atelier ; coût nécessaire et progression d’attente explicites. |
| P1 | `actBar()` utilisait toujours `data-ab="hands"`, même pour une récolte seule. | Toucher « Récolte » ouvrait « Aucune commande en cours ». | La récolte renvoie au Domaine et à sa terre ; une commande conserve son accès à la liste des commandes. |
| P1 | Les boutons du haut utilisaient une largeur sans rétrécissement. Le test d’en-tête complet révélait encore un débordement de 123 px à 320 px lors de la première correction. | Des commandes pouvaient sortir de l’écran. | En-tête à hauteur adaptable, retour à la ligne des boutons, espace réservé au nom de l’âge. |
| P1 | `Dom.click()` ignorait tous les clics sur les icônes de récolte, car seule la pression du pointeur récoltait. Les fiches de gisements étaient des `div` cliquables. | Récolte manuelle et ouverture de fiche difficiles ou impossibles au clavier. | Activation clavier de la récolte sans doubler les clics du pointeur ; fiches sous forme de boutons natifs nommés. |
| P2 | `gisHTML()` présentait uniquement ▶ ou ■. Trois commandes identiques avaient le même nom accessible. | Le mode continu et la ressource ciblée n’étaient pas explicites. | « Récolter » / « Arrêter », état pressé et nom accessible incluant la ressource. |
| P2 | `setTab()` remettait systématiquement le défilement à zéro. | Retrouver une ressource ou une recette exigeait de redéfiler après chaque détour. | Position mémorisée par écran pendant la session. Retoucher l’onglet actif ramène toujours en haut ; une destination explicite conserve son recentrage. |
| P2 | Noms de ressources en 10,5 px sur une ligne dans `.inv .n`. | Noms longs tronqués et lecture difficile. | 12 px, retour à la ligne ; 14 px avec Grand texte. |
| P2 | Les fenêtres avaient un focus piégé mais l’application derrière restait disponible aux technologies d’assistance. La barre de progression entière était une région live. | Navigation hors de la fenêtre et annonces répétées possibles. | Arrière-plan `inert` pendant les fenêtres, restauré à leur fermeture ; retrait de la région live constamment actualisée. Le risque d’annonces est déduit du DOM, pas mesuré avec un lecteur d’écran. |

L’agrandissement est accompagné d’une disposition des gisements qui garde ressource et actions côte à côte sur téléphone. Les boutons d’un même gisement se rangent verticalement lorsqu’ils sont plusieurs. Le jeu conserve son identité de carnet illustré.

## Parcours et gains

| Situation de départ | Avant | Après | Portée de la mesure |
|---|---|---|---|
| Atelier vide, Tailler déjà sélectionné, tutoriel coupé | Domaine → lancer la récolte → Atelier → bois → Tailler : 5 interactions | Récolter du bois → bois → Tailler : 3 interactions | Attendre les 3 bois reste nécessaire. Chemin initial reconstitué depuis l’interface ; nouveau chemin vérifié dans Chromium. Le coût et la vitesse sont inchangés. |
| Retour à un écran long | Recommencer le défilement depuis le haut | Retrouver la position précédente | Aller-retour testé à une position de 420 px. Le nombre de balayages économisés dépend de la position du joueur. |
| Toucher une récolte en cours | Fenêtre de commandes vide, à fermer | Accès à la terre correspondante | Test fonctionnel automatisé ; une commande reste consultable par sa propre barre. |
| Lancer une commande de 10 objets connus | Bouton ×10 déjà disponible | Toujours une action | Fonction existante vérifiée et préservée, pas présentée comme un gain nouveau. |

## Revue des autres systèmes

| Partie | État observé | Suite recommandée |
|---|---|---|
| Objectif et onboarding | Objectif unique, énigme, action contextuelle, tutoriel déclenché par l’état du jeu. Les détails descriptifs sont souvent repliés ; plusieurs premières découvertes révèlent de nouvelles commandes. | Tester cinq premières minutes avec des débutants ; mesurer le nombre de demandes d’aide et de changements d’onglet avant le manche et la cabane. |
| Domaine et automatisation | Récolte continue, extracteurs, anciennes terres repliées, accès aux machines et vue dense déjà présents. | Faire comprendre tôt la différence entre récolte continue, extracteurs et commandes. Une partie ne doit pas dépendre de centaines de tapotements. |
| Atelier et découverte | Énigmes, thermomètre, ressources étudiées, favoris et fabrication répétée. Sur une partie avancée, actions, établi, résultats et filtres repoussent les ressources sous le premier écran. | P1 à tester : réduire la place des explications déjà assimilées ; préserver l’établi compact existant. Proposer un accès explicite aux fiches en complément de l’appui long. |
| Carnet et commandes | Commandes en chaîne, tailles de lots, Max, suivi, recherche et nouvelle vue Arbre. | P2 à tester : ne montrer que les quantités réellement utiles à chaque stade, avec un accès aux autres. Les sept actions d’une recette sont une charge visuelle, mais les masquer peut aussi ajouter des clics. |
| Carte et explorations | Carte centrée sur la terre, brouillard, passages et lieux contextuels. | Vérifier les cibles SVG, le focus et les équivalents textuels sur lecteur d’écran. Le contrôle des boutons HTML ne couvre pas tout le SVG. |
| Retour d’absence | `showOffline()` résume les ressources et signale l’exploration terminée. | P2 : proposer un accès direct à la découverte ou au blocage en cours depuis le résumé, en évitant l’empilement de fenêtres de retour. |
| Relève et Mémoire | Confirmation détaillée : conservé, remis à zéro, gain et copie de sécurité. Vérifiée à l’écran. | Conserver cette confirmation malgré l’objectif de réduction des clics : elle protège une décision majeure. Tester la compréhension du gain de Traces, plutôt que supprimer l’étape. |
| Journal et Cosmos | Plusieurs sous-sections, fragments, questions, secrets et fins. | Lisibilité des textes longs et disponibilité au clavier à étendre aux mini-jeux/constellations. Une découverte facultative ne doit pas être confondue avec une obligation de progression. |
| Comptoir, rituels, visiteurs | Systèmes parallèles, monnaies et récompenses supplémentaires. | P2 : mesurer s’ils détournent trop tôt de l’objectif principal. Éviter d’ajouter des alertes ou des récompenses à réclamer sans bénéfice clair. |
| Réglages et sauvegardes | Jour/Veillée, Grand texte, volumes séparés, tutoriel désactivable, export et copies de sécurité. | Export vérifié. Mesurer les contrastes sur tous les fonds et thèmes ; vérifier la lecture à fort zoom et sur appareils physiques. Ne pas déclarer tous les contrastes conformes sans mesure. |

## Rythme et level design

Exécution : `node tools/sim-passages.js --minutes 30 --taps 1 --reflexion 20 --journal`.

Le bot place la première cabane vers 2,7 minutes, vise la Plaine vers 3 minutes et la franchit vers 9,7 minutes. À 30 minutes, le passage de la Rivière est payé à 95 %. Il a effectué 1 459 appuis et 179 fabrications. Il anticipe et investit selon les règles du simulateur ; ses 20 secondes de réflexion sont un paramètre artificiel, pas une mesure humaine. Il ne représente pas le parcours à récolte continue testé dans l’interface.

**Hypothèse prioritaire :** le premier passage peut être vécu comme un palier long après des découvertes rapides. Vérifier si le joueur comprend qu’il peut lancer une activité puis quitter le jeu, et s’il voit un objectif intermédiaire utile. Ne pas diminuer tous les coûts à partir d’un bot : cela pourrait supprimer l’intérêt des extracteurs et de la relève. Le README décrit aussi des rythmes et une navigation plus anciens ; prendre les écrans et les simulations de la version actuelle comme preuves.

Protocole proposé : 5 à 8 joueurs peu familiers du genre, première session sans explication orale puis retour le lendemain. Relever première récolte continue, premier manche, première cabane, première décision de fermer le jeu, compréhension du passage et de la relève. Noter les hésitations, erreurs et gestes ; une cible de compréhension doit être fixée avant le test. Aucun résultat de ce protocole n’est revendiqué ici.

## Vérification reproductible

Résultat : **184 contrôles UX réussis**, suite `npm test` réussie, `git diff --check` sans erreur. Les captures finales ont été relues visuellement. L’illustration Dyson étape 2 publiée entre-temps sur `main` (`a825dba`) a été intégrée ; la suite du projet a été relancée après cette intégration. Empreinte finale du service worker : `90c40311c2`.

- `npm run build` puis `npm test` : syntaxe, contenu, moteur, migrations des sauvegardes, récit, comptes et empreinte du service worker.
- `npm run test:ux` : Playwright requis ; `PW` peut désigner son installation, `CHROMIUM` un navigateur de test, `UX_SHOTS` un dossier de captures. Le script sert sa propre copie locale sur un port libre et utilise des profils jetables.
- `git diff --check` : absence d’erreurs d’espacement.

Le moteur, les prix, les rendements, les récompenses et le format des sauvegardes ne sont pas modifiés. Le changement de taille des commandes peut augmenter la hauteur de certaines vues ; la conservation du défilement et la disposition des gisements compensent une partie de ce coût. Les essais matériels et les tests utilisateurs restent nécessaires pour confirmer les bénéfices de lisibilité et de compréhension.
