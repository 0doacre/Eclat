# À faire, idées en attente

Liste tenue à la main, du plus proche au plus lointain. Rien ici n'est un secret du récit.

## Vers l’alpha

Le plan complet, avec le tableau des objets par âge, est dans **`docs/PLAN-ALPHA.md`** (densité, tutoriel exhaustif, relecture, bandeau d’alpha, test à 5 joueurs). Pour ajouter un âge : **`docs/AJOUTER-UN-AGE.md`**.

## Fait récemment

- **0.20** : l’Âge de l’Atome (uranium et galène, par extracteur seulement ; centrale à fission). **0.19** : l’Âge de la Vapeur,
  pris sur l’Acier. **0.18** : une recette et un nom pour chaque niveau d’extracteur, filtres Extracteurs / Outils / Machines au Carnet.
  **0.17** : un extracteur par ressource, avec des niveaux. **0.16.2** : Traces dépensées seulement au réveil d’un Semeur.
  **0.16.1** : fenêtre de première relève en langage d’interface, Mains sûres.

- **Onboarding 0.12.0** (DeepSeek, rebasé par Claude) : lieux à explorer avant un passage (premier cycle seulement),
  moins d'écrans au début, relève expliquée en chiffres, retours discrets. Textes à relire : `docs/revue/onboarding.md`.
- **Arbre de connaissance** (0.11.0), **Carnet en onglet** et **Mémoire en arbre** (0.11.1).

## Juste après

- **Tutoriel exhaustif** (retour de Marion, bêta-testeuse : « ça sert à quoi de faire *suivre* ? »). Aucun bouton
  ne doit rester inexpliqué : Suivre, Épingler, Détail, ×10 / Max, Vue dense, Étudier, Déchiffrer, filtres
  de la Réserve et du Carnet, tris, Fouiller de nouveau, Visiteurs, etc. Principe : **ralentir**, expliquer **un
  élément à la fois**, au moment où il apparaît ou devient utile, une phrase chacun, jamais en rafale ; un
  bouton « Passer » partout ; le guide se coupe dans le menu. À faire une fois l'onboarding 0.10 relu, pour ne
  pas refaire deux fois la même chose.
  Méthode proposée : (1) un outil qui liste tous les boutons de l'interface (`data-*`, classes) et ce qui les
  explique (chapitre du guide, info-bulle, fiche d'aide) ; (2) un test qui échoue quand un bouton n'a aucune
  explication ; (3) un chapitre du guide ou une info-bulle par trou ; (4) relecture des textes par l'auteur.

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
