# À faire, idées en attente

Liste tenue à la main, du plus proche au plus lointain. Rien ici n'est un secret du récit.

## Vers l’alpha

Le plan complet, avec le tableau des objets par âge, est dans **`docs/PLAN-ALPHA.md`** (densité, tutoriel exhaustif, relecture, bandeau d’alpha, test à 5 joueurs). Pour ajouter un âge : **`docs/AJOUTER-UN-AGE.md`**.

Premier lot de densité, **0.21** : eau et circuits de vapeur, naphta, soufre et étanchéité, puis refroidissement des machines. Treize objets, deux nouveaux gisements d’extracteur. Détails et mesures : **`docs/revue/densite-ressources.md`**. Attention : les anciennes durées « par âge » étaient décalées d’un âge ; les priorités de rythme sont désormais Acier et Silicium.

## Fait récemment

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
