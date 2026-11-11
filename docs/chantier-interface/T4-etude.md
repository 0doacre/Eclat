# T4 · L'Étude en écran fixe

Lis d'abord `docs/chantier-interface/MAITRE.md` : il porte le but, les règles communes et la forme du compte rendu. Réponds en français.

## Pourquoi
L'Étude (onglet `labo`, vue `#v-labo`) est l'écran où le joueur essaie des gestes sur des ressources. Elle tient à 390 × 844 mais défile de 270 px à 320 × 568 (plafonds en tête de `tools/test-ux.js`). Un établi qu'on fait défiler pour atteindre son bouton n'est pas un établi.

## À mesurer d'abord
Ouvre l'Étude avec le réglage `equipmentFilter = "tout"` aux âges 1, 5 et 9 (les états de `tools/test-ux.js`) et relève la hauteur de chaque bloc aux cinq tailles. Mets ce tableau dans ton compte rendu avant toute modification.

## À faire
1. Applique le modèle des Terres : une colonne de la hauteur de la vue ; l'établi et son bouton d'action toujours visibles, en bas, au pouce.
2. La réserve de ressources est une liste : elle seule glisse, dans un cadre qui ne bouge pas, avec `overscroll-behavior: contain`.
3. Ce qui est du texte d'explication passe derrière un appui (pastille ou bulle), comme la règle d'une terre.
4. Écris `tools/test-etude-fixe-ui.js` sur le modèle de `tools/test-terres-fixe-ui.js` : la page ne défile pas, le bouton d'action est entier au-dessus de la barre d'onglets, aucune cible sous 44 px, aux cinq tailles et aux trois âges.
5. Baisse les plafonds « Labo » de `tools/test-ux.js` à ce que tu obtiens.

## Fini quand
- La page de l'Étude ne défile à aucune des cinq tailles ; seule la réserve glisse quand elle est pleine.
- Essayer un geste, poser et retirer une ressource, fabriquer : tout marche comme avant (`node tools/test-labo-qol-ui.js`, `node tools/test-atelier-dessine-ui.js`).
- Tes captures avant et après sont dans ton dossier.

## Limite
Si tenir à 320 × 568 demande de retirer un contrôle ou de changer un texte, ne le fais pas : livre ce qui tient à 360 × 640 et au-dessus, et pose la question au porteur avec une capture.
