# À faire, idées en attente

Liste tenue à la main, du plus proche au plus lointain. Rien ici n'est un secret du récit.

## Vers l’alpha

Le plan complet, avec le tableau des objets par âge, est dans **`docs/PLAN-ALPHA.md`** (densité, tutoriel exhaustif, relecture, bandeau d’alpha, test à 5 joueurs). Pour ajouter un âge : **`docs/AJOUTER-UN-AGE.md`**.

Premier lot de densité, **0.21** : eau et circuits de vapeur, naphta, soufre et étanchéité, puis refroidissement des machines. Treize objets, deux nouveaux gisements d’extracteur. Détails et mesures : **`docs/revue/densite-ressources.md`**. Attention : les anciennes durées « par âge » étaient décalées d’un âge ; les priorités de rythme sont désormais Acier et Silicium.

## Fait récemment

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

1. **Arbre, étape 3.** Le filtre **« à portée »** (prêt, presque avec ce qui manque, pas encore) et le point **« nouveau »** sur les pastilles.
2. **Friction, suite.** Relire le guide par lots avec la règle du vocabulaire ; mémoriser le dernier filtre et la dernière recherche du Carnet ; une quantité libre à côté de ×10 et Max.

## Plus tard

- **Ligne d'ambiance** sous l'en-tête (une petite phrase qui change selon l'âge, la terre, l'heure) : à écrire
  avec le plus grand soin, c'est là que « écrit par une IA » se voit le plus.
- **Succès discrets** (« gestes remarqués », sans récompense chiffrée).
- **Deuxième couche de prestige**, liée aux fins.
- Les trois **terres sans règle** n'existent plus (toutes en ont une) ; à régler à l'usage : les dons « Les
  mains pleines » et « La main heureuse » sont à 12 % au lieu de 15 %, la Rivière n'a pas de paliers de
  gisement (sa règle du courant fait l'inverse).
- **Fichiers encore longs** : `js/engine.js` (4 600 lignes), `js/recit.js` (1 286), `js/data.js` (1 279).
- Relire les textes de `docs/revue/` (dons, jours, seuils, visiteurs, figures, expéditions, onboarding).
