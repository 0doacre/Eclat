# Relais Refonte Écrans 0.39 : Note pour Claude

## Contexte
- Branche de travail : `gemini/refonte-ecrans-0-39` (créée à partir de `claude/refonte-ecrans-0-39`).
- Spécification de référence : `docs/REFONTE-ECRANS-0-39.md` et `docs/prompts/refonte-ecrans-0-39-gemini.md`.
- Objectif : Passage de 6 onglets à 5 : **Terres · Labo · Atelier · Arbre · Journal**.

## Ce qui est déjà prêt côté moteur (fait par Claude)
- `E.attempt(...)` renvoie `offered: true` pour la première pièce offerte.
- `E.chaineManquante(id)` : liste des intermédiaires jamais découverts.
- `E.apprentis()` : structure `{ ordres, machines, bloques, eligible }`.
- `tools/test-refonte-0-39.js` valide à 100%.

## Architecture de l'interface à livrer (Feuille de route précise)

### 1. `index.html`
- Mettre à jour `<nav id="tabs">` :
  - `terres` (« Terres », icône village ou globe, remplace `domaine` et `carte`)
  - `labo` (« Labo », icône fiole/geste, établi d'essai)
  - `atelier` (« Atelier », icône marteau/enclume, production pure)
  - `arbre` (« Arbre », inchangé)
  - `journal` (« Journal », inchangé)
- Vues `<section id="v-...">` :
  - Remplacer `#v-domaine` et `#v-carte` par `#v-terres`
  - Ajouter `#v-labo`
  - Adapter `#v-atelier`
  - Retirer `#v-carnet` (le Carnet devient une feuille modale ouverte via `Atl.openCarnet()` depuis Labo et Atelier)

### 2. Terres (`js/terres.js` ou `js/domaine.js` adapté)
- Contrat de classes : `.terres`, `.terres-rangee`, `.terres-icone[.is-courante|.is-fermee]`, `.terre-page`, `.terre-fond`, `.terre-regle`, `.terre-gisements`, `.terre-bas`, `.terres-pastilles`, `.feuille-atlas`.
- Affichage : 1 seule terre à la fois.
  - En haut : `.terres-rangee` (icônes des terres découvertes + bouton ouvrant la feuille Atlas `Carte.view()`). Boutons précédent/suivant $\leftarrow / \rightarrow$ pour clavier et accessibilité.
  - Arrière-plan : `.terre-fond` (`assets/carnet/lands/{zone}.webp` ou `assets/terres/{zone}-decor.webp`).
  - Lignes de gisements : au plus 4 lignes compactes. **Un seul appui récolte immédiatement** (`data-harv`).
  - Bas : lieux à explorer / passage vers la terre suivante.
  - Pastilles en-tête : Objectif, relève, Comptoir, production totale.

### 3. Labo (`js/labo.js`)
- Contrat de classes : `.labo`, `.labo-etabli`, `.labo-case`, `.labo-geste`, `.labo-bouton`, `.labo-thermo`, `.labo-matieres`, `.labo-echantillon`, `.labo-chaine`, `.labo-compteur`.
- Contenu :
  - Établi seul : 3 cases (slots), choix du geste compatible, bouton « Essayer » (`E.attempt`), thermomètre (froid / tiède / brûlant), bouton Intuition ✨.
  - Rangée horizontale de matières (récentes + favorites), défilement horizontal.
  - Échantillons : toute matière dans `state.seen` est posable même avec stock 0 (badge `.labo-echantillon`).
  - Affichage `offered: true` : message « Tu gardes la première pièce ».
  - Affichage `E.chaineManquante(id)` : « à découvrir d'abord : ... ».
  - Compteur : « Recettes trouvées X / Y » ouvrant la feuille Carnet.

### 4. Atelier de production (`js/atelier.js`)
- Règle R1 : **Ne défile pas dans la page principale**.
- Contrat de classes : `.prod`, `.prod-choix`, `.prod-fiche`, `.prod-qui`, `.prod-file`, `.prod-pastille-auto`, `.auto-feuille`, `.auto-ligne[.is-ok|.is-bloque|.is-plein]`, `.apprenti`.
- En haut : rangée de recettes connues réalisables (favoris puis âge) + bouton « Carnet » pour ouvrir le livre des recettes.
- Fiche de recette sélectionnée : coût, temps, choix quantité (×1, ×10, ×Max).
- 3 modes d'exécution :
  - « À la main » $\to$ `E.order(id, n)`
  - « Confier à un apprenti » $\to$ `E.setCadence(id, cap, true)`
  - « Machine » $\to$ assigne une machine disponible.
- Pastille « Ce qui tourne » avec le nombre de blocages (`bloques`), ouvrant la feuille `.auto-feuille` listant les ordres permanents et machines libres.

### 5. Arbre (`js/arbre.js`)
- Ajout du gabarit `.indice[.is-verrouille|.is-visible|.is-resolu]`.
- Emplacement `D.INDICES = []` dans `js/data.js`.
- Bouton sur piste / fantôme vers le Labo pré-remplissant geste et matière.

### 6. Migration & Tests
- Migration automatique au chargement (`js/ui.js` / `loadSave`) : si l'ancien onglet mémorisé est `domaine` ou `carte`, basculer vers `terres` ; si `carnet`, basculer vers `atelier`.
- `tools/test-ux.js` :
  - Vérifier R1 (`scrollHeight <= clientHeight`) aux résolutions 390×844 et 320×568 sur les 5 onglets.
  - Vérifier critère 3 : Récolte en 1 appui.
  - Vérifier critère 4 : Trouvaille Labo en < 5 appuis.
  - Vérifier critère 5 : Ordre apprenti en < 4 appuis.
- Monter la version à `0.39.0` dans `package.json`, `js/data.js` (`D.VERSION`) et ajouter l'entrée dans `D.CHANGES`.
