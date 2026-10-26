# À faire, idées en attente

Liste tenue à la main, du plus proche au plus lointain. Rien ici n'est un secret du récit.

## Vers l’alpha

Le plan complet, avec le tableau des objets par âge, est dans **`docs/PLAN-ALPHA.md`** (densité, tutoriel exhaustif, relecture, bandeau d’alpha, test à 5 joueurs). Pour ajouter un âge : **`docs/AJOUTER-UN-AGE.md`**.

Premier lot de densité, **0.21** : eau et circuits de vapeur, naphta, soufre et étanchéité, puis refroidissement des machines. Treize objets, deux nouveaux gisements d’extracteur. Détails et mesures : **`docs/revue/densite-ressources.md`**. Attention : les anciennes durées « par âge » étaient décalées d’un âge ; les priorités de rythme sont désormais Acier et Silicium.

## Fait récemment

- **0.34.0, gestes remarqués** : 20 succès discrets jalonnent désormais la route dans le Journal (onglet Gestes), sans récompense chiffrée, avec l’horodatage diégétique de chaque accomplissement (cycle, âge, date), pastilles d'état (accompli ou à découvrir) et persistance à la relève. Documenté dans `docs/revue/gestes-remarques.md`.
- **0.33.0, ligne d’ambiance sous l’en-tête** : une petite phrase diégétique et sobre sous l’en-tête donne à voir et à sentir le monde vivant selon la terre active (12 terres), l’âge atteint (15 âges) et l’heure réelle (aube, jour, crépuscule, nuit). Concrète et sensorielle (odeur d’écorce, résonite, balancier de vapeur, goutte d’eau), elle se renouvelle chaque minute ou au clic, et se coupe dans Menu → Affichage. Table complète et charte dans `docs/revue/ambiance.md`.
- **0.32.0, friction Carnet & quantités** : mémorisation du dernier filtre et de la dernière recherche du Carnet dans les réglages sauvegardés, bouton de quantité libre à côté de ×10 et Max pour commander le volume exact souhaité, harmonisation des filtres de l'Arbre en 4 termes de jeu vidéo (Toutes, À portée, Prêtes, Verrouillées), et relecture du guide par lots.
- **0.31.0, Arbre étape 3** : filtres de portée (Toutes, À portée, Prêtes, Presque, Pas encore) avec compteurs en temps réel, qualification sans état (`Arbre.portee`), et point « nouveau » discret sur les pastilles de recettes découvertes jamais fabriquées.
- **0.30.0, le chemin vers une cible dans l'Arbre** : échelle verticale des marches depuis une pastille ou l'objectif du Domaine (fait, en cours, à trouver, bloquée), action directe pour chaque marche (Fabriquer, Récolter, Voir la recette), anonymat strict des recettes inconnues (« Recette à trouver »), « Tout fabriquer » et « Suivre ».
- **0.29.0, vocabulaire et ouverture** : un mot par chose (Objectif, Nouvelle recette, Requis, Atelier), le choix du guide dans la première fenêtre, plus de bulle d'accueil sur la carte d'objectif. `docs/revue/vocabulaire.md`.
- **0.28.0, Arbre étape 1** : la frise en pastilles et la feuille de voisinage ; la progression reste l'accueil.
- **0.27.0, friction** : ruines en un bloc replié avec « Tout réparer », réparer compte comme fabriquer, Comptoir dans le menu.
- **0.26.0, l'appareil** : bouton Retour, titre de l'onglet, écran allumé, installation, touches 1 à 6.
- **0.25.0, menu et affichage** : sections, interrupteurs Activé / Désactivé, un seul réglage « Affichage compact », Carnet sur deux colonnes sur téléphone.
- **0.24.0, le jus** : appuis qui se voient, visiteur qui éclate, curiosités rares en trois paliers (`js/juice.js`).
- **0.23.x** : économie du Comptoir, guidage, ciel du Cosmos.
- **Sauvegardes et cache** : verrou d'enregistrement, persistance vérifiée, CI Linux et Windows.
- **Valeurs** : mesurées, aucun prix changé (`docs/revue/valeurs-debit.md`).

## Juste après

1. **Deuxième couche de prestige**, liée aux fins.
2. **Densité des âges de l'Acier et du Silicium** (rythmes corrigés du simulateur, `docs/PLAN-ALPHA.md`).

## Plus tard

- Les trois **terres sans règle** n'existent plus (toutes en ont une) ; à régler à l'usage : les dons « Les
  mains pleines » et « La main heureuse » sont à 12 % au lieu de 15 %, la Rivière n'a pas de paliers de
  gisement (sa règle du courant fait l'inverse).
- **Fichiers encore longs** : `js/engine.js` (4 600 lignes), `js/recit.js` (1 286), `js/data.js` (1 279).
- Relire les textes de `docs/revue/` (dons, jours, seuils, visiteurs, figures, expéditions, onboarding).
