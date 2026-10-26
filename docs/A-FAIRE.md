# À faire, idées en attente

Liste tenue à la main, du plus proche au plus lointain. Rien ici n'est un secret du récit.

## Vers l’alpha

Le plan complet, avec le tableau des objets par âge, est dans **`docs/PLAN-ALPHA.md`** (densité, tutoriel exhaustif, relecture, bandeau d’alpha, test à 5 joueurs). Pour ajouter un âge : **`docs/AJOUTER-UN-AGE.md`**.

Premier lot de densité, **0.21** : eau et circuits de vapeur, naphta, soufre et étanchéité, puis refroidissement des machines. Treize objets, deux nouveaux gisements d’extracteur. Détails et mesures : **`docs/revue/densite-ressources.md`**. Attention : les anciennes durées « par âge » étaient décalées d’un âge ; les priorités de rythme sont désormais Acier et Silicium.

## Fait récemment (octobre 2026, 0.22 → 0.29)

Audit indépendant de la 0.21 (Claude et Codex), puis les lots dans l'ordre retenu. Détails dans les PR et dans `docs/revue/`.

- **0.29.0, vocabulaire et ouverture** : un mot par chose (Objectif, Nouvelle recette, Requis, Atelier), le choix du guide dans la première fenêtre, plus de bulle d'accueil sur la carte d'objectif. `docs/revue/vocabulaire.md`.
- **0.28.0, Arbre étape 1** : la frise en pastilles et la feuille de voisinage ; la progression reste l'accueil. Maquettes et pistes B et C : `docs/revue/arbre-vertical.md` et la page de propositions (voir `docs/RELAIS-0.29.md`).
- **0.27.0, friction** : ruines en un bloc replié avec « Tout réparer », réparer compte comme fabriquer, Comptoir dans le menu ; `RELEVE=<âge> node tools/sim.js` mesure le rattrapage d'une relève. `docs/revue/friction.md`.
- **0.26.0, l'appareil** : bouton Retour (ferme la fenêtre, ramène au Domaine, puis quitte), titre de l'onglet, écran allumé, installation, touches 1 à 6.
- **0.25.0, menu et affichage** : sections, interrupteurs Activé / Désactivé, un seul réglage « Affichage compact » (Domaine et Carnet), Carnet sur deux colonnes sur téléphone.
- **0.24.0, le jus** : appuis qui se voient, visiteur qui éclate, curiosités rares en trois paliers (`js/juice.js`).
- **0.23.x** : économie du Comptoir (plafond mou des écus en Traces, demandes du Troqueur selon la production, tournées du Troqueur), guidage (étapes restantes, pièces en Réserve, extracteur arrêté), ciel du Cosmos qui restait noir.
- **Sauvegardes et cache** : un seul onglet enregistre (verrou), un échec d'écriture garde la partie en mémoire avec export, persistance vérifiée ; empreinte du service worker identique sous CRLF et LF, CI sous Linux et Windows.
- **Valeurs** : mesurées, aucun prix changé (`docs/revue/valeurs-debit.md`) ; un test garde l'équilibre.

Avant, et toujours vrai :

- **0.22.1** : le Journal (signes, questions, formulaires) et ses ⏎ nommés pour le lecteur d’écran ; `tools/smoke-ui.js`
  repart d’une sauvegarde déterministe et passe. **0.22.0, tutoriel des boutons** : chaque bouton de l’interface a une info-bulle ou un nom de lecteur
  d’écran ; `tools/boutons.js` inventorie les 207 boutons dans `docs/boutons.md` (Journal et fiche d’aide compris),
  `tools/test-boutons.js` échoue si l’un reste muet ; `tools/smoke-ui.js` vérifie le clavier. Trois chapitres nouveaux (Suivre, Épingler, commander d’un coup) et le guide
  ralenti à une explication toutes les deux ou trois minutes. Textes à relire : `docs/revue/boutons.md`.
- **0.20** : l’Âge de l’Atome (uranium et galène, par extracteur seulement ; centrale à fission). **0.19** : l’Âge de la Vapeur,
  pris sur l’Acier. **0.18** : une recette et un nom pour chaque niveau d’extracteur, filtres Extracteurs / Outils / Machines au Carnet.
  **0.17** : un extracteur par ressource, avec des niveaux. **0.16.2** : Traces dépensées seulement au réveil d’un Semeur.
  **0.16.1** : fenêtre de première relève en langage d’interface, Mains sûres.

- **Onboarding 0.12.0** (DeepSeek, rebasé par Claude) : lieux à explorer avant un passage (premier cycle seulement),
  moins d'écrans au début, relève expliquée en chiffres, retours discrets. Textes à relire : `docs/revue/onboarding.md`.
- **Arbre de connaissance** (0.11.0), **Carnet en onglet** et **Mémoire en arbre** (0.11.1).

## Juste après

Par ordre de valeur. Le détail et la méthode sont dans **`docs/RELAIS-0.29.md`**.

1. **Arbre, étapes 2 et 3.** Le **chemin vers une cible** (piste B : choisir n'importe quel objet, voir toute la route en échelle, chaque marche avec son état, ce qui bloque et son action ; « Suivre » épingle la route), puis le filtre **« à portée »** (piste C : prêt, presque, pas encore) et le point **« nouveau »** sur les pastilles. Réutiliser le plan de fabrication du moteur (`E.plan`, `E.nextStep`) ; ne jamais montrer le nom d'une recette encore inconnue.
2. **Friction, suite.** Relire le guide par lots avec la règle du vocabulaire (Comptoir, signes, relève, extracteurs) ; mémoriser le dernier filtre et la dernière recherche du Carnet ; une quantité libre à côté de ×10 et Max ; un résumé de ce qui est prêt à l'ouverture ; une relève très précoce (âge 4) coûte 156 % de la première fois : à décider (équilibrage).
3. **Réglage « Style : Classique / Atlas vivant »**, pour l'équipe design (`docs/COORDINATION-DESIGN.md`, branche `prewiew-design`) : une entrée dans Menu → Affichage, `body[data-design]` posé au démarrage, un test ; rien ne change tant que le style reste « Classique ». À préparer seulement quand l'équipe le demande, sans fusionner sa branche.
4. **Stabilité de `tools/test-ux.js`.** Deux échecs intermittents jamais élucidés : la bulle du guide (une attente de 600 ms a été ajoutée, hypothèse non prouvée) et « La barre de commande ouvre ses détails » (sous charge). Le lancer seul, jamais en même temps qu'un autre test.
5. **Un essai avec de vrais joueurs** (cinq, voir `docs/PLAN-ALPHA.md`) : la seule vraie mesure de ce qui perturbe un débutant. Les maquettes de l'Arbre et la frise sont des intentions, pas des mesures.
6. **Points de l'audit 0.21 sans lot** (`docs/revue/audit-0.21-claude.md`, constats numérotés C-xx ; la comparaison avec Codex est la PR 90, non fusionnée) :
   - **C-06 (P3)** `E.plan` compte le surplus d'une recette comme du stock : une commande peut créer un peu de matière (naphta, lingots de bronze). Correction : ne compter dans `used` que le stock réel ; un test de conservation.
   - **C-08 (P3)** hors ligne : le plafond de 12 h est affiché comme la durée d'absence ; la production au-delà est perdue sans que le joueur le sache. Afficher « parti 30 h, la production compte jusqu'à 12 h » ; envisager une dégressivité.
   - **C-09 (P3)** le thermomètre et l'étude ignorent la règle d'âge : 18 % des échecs d'un début de partie reçoivent un « bonne piste » trompeur. Filtrer par `ageOK`.
   - **C-10 (P3)** « Déchiffrer » coûte plus que l'Intuition qu'une partie rapporte : diviser les coûts ou assumer un puits de luxe.
   - **C-11 (P3)** ruines : écrasées à la relève suivante si on ne les répare pas ; fusionner `meta.ruins` ; le rabais de 90 % court-circuite le scalage des prix.
   - **C-12 (P3)** `tools/sim.js` offre tous les passages : ses durées (« fin en 1 h 18 ») sont une borne basse ; `tools/sim-passages.js` paie les passages.
   - **C-13 (P3, en partie fait)** Comptoir : pas de confirmation avant une grosse vente ; l'explication des écus est ajoutée (0.23), pas la confirmation.
   - **C-16 (P4)** incohérences de textes et de données : README (six machines au lieu de cinq), `chaudiere.u`, `capsule` jamais remise à zéro, `D.COMPTOIR.traceUp` lu nulle part, `statuette` qui demande du silex, `passPour` sans `avancerAge`.
   - **C-07 (P4)** parties 0.20 : l'avancement recule à la Vapeur, la ligne des nouveautés ne le dit pas.

## Plus tard

- **Ligne d'ambiance** sous l'en-tête (une petite phrase qui change selon l'âge, la terre, l'heure) : à écrire
  avec le plus grand soin, c'est là que « écrit par une IA » se voit le plus.
- **Succès discrets** (« gestes remarqués », sans récompense chiffrée).
- **Deuxième couche de prestige**, liée aux fins.
- Les trois **terres sans règle** n'existent plus (toutes en ont une) ; à régler à l'usage : les dons « Les
  mains pleines » et « La main heureuse » sont à 12 % au lieu de 15 %, la Rivière n'a pas de paliers de
  gisement (sa règle du courant fait l'inverse).
- **Fichiers encore longs** : `js/engine.js` (plus de 4 700 lignes), `js/atelier.js`, `js/ui.js`, `js/recit.js`, `js/data.js`.
- **Notification système** (pas seulement le titre de l'onglet) : demande une permission et un serveur.
- **Les noms de composants** du futur style Atlas prendront le préfixe `atlas-`.
- Relire les textes de `docs/revue/` (dons, jours, seuils, visiteurs, figures, expéditions, onboarding).
