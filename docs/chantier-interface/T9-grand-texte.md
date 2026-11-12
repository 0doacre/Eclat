# T9 · Grand texte, pour de vrai

Lis d'abord `docs/chantier-interface/MAITRE.md` : il porte le but, les règles communes et la forme du compte rendu. Réponds en français.

Passe après la fusion de T8. Tu peux tourner en même temps que T10 : vous n'avez pas les mêmes fichiers.

## Pourquoi
Le porteur l'a constaté le 12 novembre 2026 sur son téléphone : avec « Grand texte », l'écran est « presque indiscernable » de la taille normale.

## Faits vérifiés (version 0.67.0)
- Le réglage `st.settings.largeText` pose la classe `large-text` sur `body` (`applyLargeText`, `js/ui.js` vers la ligne 1263). On le règle dans Menu › Affichage et dans la fenêtre d'ouverture (`js/memoire.js`).
- Les règles `body.large-text` sont dans `css/theme.css` (16), `css/arbre.css` (9), `css/design-preview.css` (8) et `css/carte-atlas.css` (3). Chacune fixe une taille en px pour quelques sélecteurs.
- Aucune règle `large-text` dans les feuilles de la refonte, chargées après les autres et qui gagnent : `sobriete.css`, `harmonie-sobre.css`, `fin.css`, `atelier-production.css`, `labo.css`, `refonte-0-39.css`. C'est la cause.

## À faire
1. Remplace ces règles éparses par **une seule échelle** : par exemple une variable de taille sur `:root`, que `body.large-text` fait passer à environ 1,15, et qui sert aux tailles de texte des feuilles de la refonte. Le résultat doit se voir au premier coup d'œil : environ +15 % sur tous les textes lus (listes, fiches, pastilles, boutons à texte, Carnet, Journal). Les icônes et les illustrations ne grandissent pas.
2. Retire les anciennes règles `body.large-text` devenues inutiles. Le nombre de `!important` ne monte pas.
3. Les écrans restent fixes. À 320 × 568 et 360 × 640 avec Grand texte, rien ne défile en entier : un texte trop long passe à la ligne ou se coupe avec « … », et seule la zone du milieu peut glisser. Si un écran ne tient pas, dis lequel plutôt que de rapetisser le texte en douce.
4. Ajoute à `tools/test-ecrans-fixes-ui.js` (ou dans un nouveau `tools/test-grand-texte-ui.js`) un contrôle : avec Grand texte, la taille calculée d'un texte de liste, de fiche et de bouton grandit d'au moins 12 %, et aucune vue ne défile, aux cinq tailles.

## Fichiers réservés
Les règles de taille de texte de `css/harmonie-sobre.css`, `css/fin.css`, `css/sobriete.css`, `css/atelier-production.css`, `css/labo.css` et `css/refonte-0-39.css`, les règles `body.large-text` de `css/theme.css`, `css/arbre.css`, `css/design-preview.css` et `css/carte-atlas.css`, et le test cité. Pas de couleur : c'est T10.

## Fini quand
- Captures à 390 × 844, sans puis avec Grand texte, des Terres, de l'Atelier, d'une fiche, du Carnet et du Journal (dans `captures/T9/`).
- `npm test` est vert, le nouveau contrôle passe, `node tools/audit-interface.js` sort avec le code 0, et le même audit lancé avec Grand texte activé n'a pas de ligne bloquante.
