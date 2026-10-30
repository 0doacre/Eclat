# Codex : la refonte des écrans 0.39 (art et design)

Tu pars de la branche `claude/refonte-ecrans-0-39` (tirée de `prewiew-design`, 0.38.0). Crée `codex/refonte-ecrans-0-39` et pousse-y ton lot. **Ne fusionne rien.** Lis d'abord `docs/REFONTE-ECRANS-0-39.md` : surtout le chapitre 1 (règles d'écran), les chapitres 2, 3, 4 pour l'esprit de chaque lieu, et le chapitre 7 pour les classes. Gemini construit l'interface en même temps que toi ; **tu ne touches ni au HTML ni au JS**, tu habilles avec des **CSS nouveaux** (`css/terres.css`, `css/labo.css`, `css/atelier-production.css`) et tu livres des **assets**. Direction : le Carnet (papier partout), contrastes validés dans `docs/art-direction/papier-partout-0-38/contrastes.json`.

## Ta mission

1. **Terres : l'illustration en fond.** Chaque terre a déjà son illustration. Elle devient le fond de la page de la terre (`.terre-fond`), **translucide** pour la valoriser sans gêner la lecture : opacité à régler (point de départ 0,28 à 0,40), dégradé qui s'éteint vers le bas, voile de papier sous les lignes de gisement. Le texte des lignes reste ≥ 4,5:1. Prépare les recadrages portrait si une illustration ne se cadre pas bien à 390 × 844 (indique lesquelles).
2. **La rangée d'icônes des douze terres** (`.terres-rangee`, `.terres-icone`) : vignettes rondes ou en médaillon, états courante, ouverte, fermée (grisée, discrète), traversée. Elles servent aussi à l'Atlas. Lisibles à 36 px.
3. **Le Labo** (`css/labo.css`) : une paillasse claire, sobre, peu d'ornements : l'établi (`.labo-etabli`, `.labo-case`), le geste, le thermomètre (`.labo-thermo`, froid → brûlant, lisible sans couleur seule), le badge d'échantillon (`.labo-echantillon`), la ligne de chaîne manquante (`.labo-chaine`). On doit sentir un lieu où l'on **essaie**, pas où l'on gère.
4. **L'Atelier de production** (`css/atelier-production.css`) : un registre, plus dense et plus « administratif » que le Labo : fiche de recette, choix de qui la fait, ordres des apprentis (`.apprenti`, `.auto-ligne` avec états `is-ok`, `is-bloque`, `is-plein`), pastille de blocages (`.prod-pastille-auto`). Les deux lieux doivent se distinguer **au premier coup d'œil**.
5. **Les icônes des cinq onglets** : Terres, Labo, Atelier, Arbre, Journal, dans le style existant (jeu `gi-*`), fournies en symboles SVG prêts à insérer dans `index.html` par Gemini, avec leurs `id`. Vérifie la lisibilité à 24 px.
6. **La feuille Atlas** (`.feuille-atlas`) : l'atlas peint dans une feuille plein cadre, avec une marque sur la terre courante.
7. **Transitions du pager** (CSS seul) : glissement doux, `prefers-reduced-motion` respecté.

## Règles

- Aucun `!important` nouveau ; pas de modification des CSS existants hors ajout d'un `@import` ou d'une ligne de chargement si Gemini ne l'a pas fait (dis-le dans le rapport).
- Poids : les assets ajoutés restent sous 800 Ko en tout (WebP, optimisés comme au lot 0.38) ; mets à jour `assets/ILLUSTRATIONS-MANIFEST.json` et `docs/CREDITS.md`.
- Contrastes : mets à jour `contrastes.json` pour les nouveaux fonds.
- Pas de nouvelle police, pas de dépendance.
- Si une classe du contrat te manque, ne l'invente pas dans le code : demande-la dans ton rapport, Gemini l'ajoutera.

## Ce que tu dois rendre

Le code CSS, les assets, un rapport court : ce qui est fait, les valeurs d'opacité retenues par terre, les contrastes mesurés, les recadrages demandés, et des captures à 390 px (dans `docs/revue/refonte-0-39/`). Tu ne peux pas voir l'interface finale tant que Gemini n'a pas poussé : si tu veux vérifier visuellement, pars de sa branche `gemini/refonte-ecrans-0-39` quand elle existe.
