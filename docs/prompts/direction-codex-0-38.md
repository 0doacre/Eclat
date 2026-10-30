# Prompt : le papier partout, le Carnet fini (Codex, lot 0.38.0)

Tu travailles sur **Éclat**, un jeu incrémental de craft en français, pour mobile (PWA, JavaScript sans framework ni dépendance). Dépôt GitHub : `0doacre/Eclat`. Tu es l'équipe **art et design** ; Gemini est l'équipe **fonctionnalités**. Pars de la branche `prewiew-design` à jour (`git fetch`, puis `git checkout -b codex/papier-partout-0-38 origin/prewiew-design`) : c'est elle que sert la preview `https://craftgame-wrr.pages.dev/`. Vérifie que le menu ☰ affiche la version 0.37.0 avant de commencer ; sinon arrête-toi et dis-le.

Lis d'abord : `docs/AUDIT-EQUIPE-2026-10-30.md` (surtout la section 6), `docs/COORDINATION-DESIGN.md`, `docs/DIRECTION-ARTISTIQUE.md`, `docs/art-direction/`, `docs/STYLE.md`, `docs/CREDITS.md`, `assets/README-ILLUSTRATIONS.md`.

## Le contexte

Le jeu a trois styles, choisis par le bouton de la barre du haut : « Atlas » (sombre), « Carnet » (papier, c'est la **direction artistique retenue**, mode interne `vivant`) et « Classique ». Le Carnet est très réussi sur le Domaine, l'Atelier, la Carte et le Carnet : papier crème, cadres encrés, bandeau « Tailler » en bois rouge, médaillons de terre, ligne d'ambiance en italique. En jouant la preview (390 × 812) j'ai relevé les endroits où il se casse. Tu ne touches ni à `js/`, ni à `tools/`, ni à `server/`, ni à `index.html` : tout ce dont tu as besoin côté logique, tu l'écris dans ton compte rendu pour Gemini. Tu ne modifies pas la mise en page (hauteurs, positions) au-delà de ce qui est demandé ci-dessous : le bandeau de récolte qui masque la dernière ligne est le chantier de Gemini.

## Ce qu'il faut faire, dans l'ordre

1. **Le papier partout en mode Carnet.** Le menu ☰ s'ouvre en thème sombre (un panier peint sur fond noir) : les fenêtres ne suivent pas le style. Mets au papier le menu et tous ses sous-écrans (Jeu, Affichage, Audio, Système, Sauvegardes), les fiches d'objet et de terre, les fenêtres de passage, de relève et de retour d'absence, la Mémoire des mains, le Journal et le Cosmos. Même cadre encré, même bouton principal en bois rouge, une seule croix de fermeture de 44 px. Plus aucun panneau sombre en mode Carnet, sauf le Cosmos si le ciel de nuit l'exige (dis-le).
2. **« Contempler » et les fenêtres à illustration.** La planche d'une terre montre, en Atlas, un bandeau de texte tronqué à droite de l'illustration. Vérifie-la en Carnet, puis toutes les fenêtres à illustration, à 320, 360, 390 et 430 px, thèmes clair et sombre, **avec « Grand texte »**. Corrige ce qui déborde ou se tronque.
3. **Le Domaine respire.** Le bloc de la terre (illustration, ambiance, bouton « Explorer ») laisse un seul gisement visible sur 812 px. Allège-le pour qu'au moins deux gisements se voient sans défiler : illustration plus basse, texte resserré, jamais supprimée. La hiérarchie reste : objectif, terre, gisements.
4. **Contrastes.** Mesure et corrige (texte courant ≥ 4,5:1, grand texte et icônes porteuses de sens ≥ 3:1) dans les trois styles, thèmes clair et sombre, pour les six époques de papier : texte sur papier, étiquettes en petites capitales, pastilles d'état (manque, prêt, suivi), bouton principal, bordures actives, texte sur illustration. Joins le tableau des valeurs mesurées. Un état ne dépend jamais de la couleur seule.
5. **Le gabarit « page du Carnet ».** Dessine (SVG ou HTML/CSS à zones nommées, 1080 × 1350) une page partageable : papier, cadre, icône grande, nom, une phrase de la couche « jeu », une ligne de la couche « récit », le nom du jeu et l'âge ; un deuxième gabarit pour une œuvre achevée. Gemini fera plus tard le rendu et la liste blanche des objets partageables : ne présume rien de la logique. **Aucun secret** : travaille avec des objets publics des premiers âges.
6. **Crédits et provenance.** Mets à jour `docs/CREDITS.md` : auteurs des icônes game-icons.net un par un (CC BY 3.0, voir le TODO du fichier), polices, et pour chaque illustration l'outil de génération, la date et le prompt **sans secret** dans `assets/ILLUSTRATIONS-MANIFEST.json`. Tout fichier d'`assets/` sans provenance connue est listé à part pour l'auteur.

## Contraintes

- Des variables, pas des valeurs : aucune couleur, ombre ou rayon en dur ; ajoute les jetons manquants dans les feuilles de thème et décris-les dans ton compte rendu.
- Respecte `prefers-reduced-motion`. Les illustrations restent en WebP, moins de 120 Ko ; budget total des `assets/` sous 6 Mo.
- Aucun secret dans un prompt d'image, un nom de fichier, un texte ou une légende. Ne lis pas `docs/coffre/`.
- Les textes que tu ajoutes suivent `docs/STYLE.md` (tutoiement, pas de tiret cadratin) et sont signalés pour relecture.
- Pas de dépendance externe (CDN, police distante).
- Le golden de l'interface (`tools/golden-ui.js`) change : dis quels écrans et pourquoi, et demande à Gemini de le régénérer si ce n'est pas dans ton territoire.

## Livraison

Travaille dans un clone à jour, jamais dans un dossier temporaire. Quand `npm test` passe en entier, **ouvre le jeu dans un vrai navigateur** (`npx http-server -p 8765 -c-1 .`, puis `http://localhost:8765/`) et vérifie à l'écran chaque point ci-dessus, en style Carnet, à 390 × 844 et 320 × 568, thème clair et sombre, avec « Grand texte » ; la console ne doit montrer aucune erreur. Si tu ne peux pas ouvrir de navigateur, dis-le clairement. Fais un commit qui dit ce que tu as changé, puis `git push -u origin codex/papier-partout-0-38`. Ne touche pas à `main`, ne fusionne rien. Termine par : le nom de la branche, la sortie de `npm test`, des captures avant/après de chaque écran modifié, le tableau des contrastes, ce que tu as vérifié dans le navigateur, **ce que tu n'as pas pu faire**, les textes à relire, et tes notes pour Gemini.
