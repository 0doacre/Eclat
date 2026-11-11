# T3 · Réflexes de navigateur et transitions entre écrans

Lis d'abord `docs/chantier-interface/MAITRE.md` : il porte le but, les règles communes et la forme du compte rendu. Réponds en français.

## Pourquoi
Ce qui trahit un site sous le doigt : la page qui rebondit en bout de course, le texte qui se sélectionne, le halo gris à l'appui, le zoom au double appui, l'écran qui change d'un coup. Un jeu ne fait rien de cela.

## Faits vérifiés
- Toutes les vues vivent dans `#views` (`css/style.css:147`), seul conteneur de page, avec `overscroll-behavior: contain`.
- Rien n'est posé sur `html` ni sur `body` contre le rebond. `user-select`, `-webkit-tap-highlight-color`, `touch-action` et `-webkit-touch-callout` existent par endroits (26, 6, 13 et 3 emplois dans `css/`), pas de façon générale.
- Le manifeste est en `standalone`, portrait. La balise viewport n'interdit pas le zoom : laisse-la, pour l'accessibilité.
- Aucune transition entre onglets : le rendu est instantané.

## À faire
1. Une règle générale, posée une fois dans `css/style.css` : pas de rebond de page (`overscroll-behavior: none` sur `html` et `body`), pas de halo d'appui, pas de menu d'appui long sur les images et les boutons, `touch-action: manipulation` sur les contrôles.
2. La sélection de texte est coupée sur l'interface, mais gardée là où le joueur peut vouloir copier : les champs de saisie, le code de sauvegarde (`textarea.save`), les textes du Livre et de l'Aide.
3. Retire les emplois locaux que ta règle générale rend inutiles, dans `css/style.css` seulement, et compte-les.
4. Une transition courte au changement d'onglet (150 ms au plus, fondu ou léger glissement), coupée par `prefers-reduced-motion`. Elle ne retarde aucun appui.
5. Écris `tools/test-reflexes-ui.js` : il vérifie les valeurs calculées sur `html`, `body`, un bouton, un champ et `textarea.save`, et qu'un changement d'onglet aboutit avec et sans mouvement réduit.

## Fini quand
- Ton test passe ; `npm test`, `node tools/test-ux.js` et `node tools/test-terres-fixe-ui.js` restent verts.
- Ton compte rendu dit que le rebond, le halo et le zoom ne se jugent que sur un vrai téléphone, et liste ce que le porteur doit essayer, geste par geste.
