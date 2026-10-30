# Prompt : le Carnet fiable et mesurable (Gemini, lot 0.38.0)

Tu travailles sur **Éclat**, un jeu incrémental de craft en français, pour mobile (PWA, JavaScript sans framework ni dépendance). Dépôt GitHub : `0doacre/Eclat`. Tu es l'équipe **fonctionnalités** ; Codex est l'équipe **art et design**. Pars de la branche `prewiew-design` à jour (`git fetch`, puis `git checkout -b gemini/finitions-carnet-0-38 origin/prewiew-design`) : c'est elle que sert la preview `https://craftgame-wrr.pages.dev/`. Vérifie que le menu ☰ affiche la version 0.37.0 avant de commencer ; sinon arrête-toi et dis-le.

Lis d'abord : `docs/AUDIT-EQUIPE-2026-10-30.md` (surtout la section 6), `docs/COORDINATION-DESIGN.md`, `docs/DIRECTION-ARTISTIQUE.md`, `docs/STYLE.md`, `docs/LEXIQUE.md`, `docs/prompts/README.md`.

## Le contexte

Le jeu a trois styles, choisis par le bouton de la barre du haut (`#atlasToggle`) : « Atlas » (sombre), « Carnet » (papier, c'est la **direction artistique retenue**, mode interne `vivant`) et « Classique ». En jouant la preview sur téléphone (390 × 812) j'ai relevé des défauts de **structure**, listés ci-dessous. Tu ne touches ni aux couleurs, ni aux polices, ni aux images : c'est le territoire de Codex (`css/**` pour l'aspect, `assets/**`). Tu peux écrire des règles CSS **de mise en page seulement** (marges, hauteurs, positions, `padding`) dans la feuille du style concerné, avec les variables existantes, jamais une couleur en dur.

## Ce qu'il faut faire, dans l'ordre

1. **Le bandeau de récolte ne masque plus rien.** Il flotte au-dessus du contenu et recouvre la dernière ligne (« Fibres » dans l'Atelier, la ligne sous « Manche » dans le Carnet). Réserve sa hauteur dans le défilement de chaque onglet (variable CSS posée par le JS quand le bandeau apparaît ou disparaît), dans les trois styles. Test : à 390 × 844 et 320 × 568, le dernier élément de chaque onglet se voit entier avec le bandeau affiché.
2. **Le bouton de style** : renomme-le (« Aspect » ou équivalent, le mot « Carnet » désigne déjà un onglet) et donne un nom accessible aux deux pastilles de la barre du haut (« 0/3 » : quêtes ; « 1 » : traces ou intuition, vérifie). Fais du **Carnet le style par défaut des nouveaux joueurs**, sans changer le style d'un joueur qui a déjà choisi, et sans toucher à `SAVE_VERSION`.
3. **L'aide du Carnet repliable.** Le texte d'aide en tête de l'onglet Carnet (« Retrouve tes recettes… ») prend la moitié de l'écran. Après un appui sur « Compris », il se réduit à une ligne qui peut se rouvrir ; il reste visible tant que le joueur n'a pas cliqué.
4. **Vibrations.** Conditionne `navigator.vibrate` à un premier geste du joueur (plus d'erreur console au chargement).
5. **Mesurer.** (a) Un parcours Playwright « première heure » (nouvelle partie jusqu'à la fabrication du premier objet, passage par chaque onglet, ouverture du menu et d'une fiche) à 390 × 844 et 320 × 568, **dans les trois styles**, sans erreur console, ajouté à `tools/test-ux.js`. (b) Une CI minimale (`.github/workflows/test.yml`, Node 20) qui lance `npm test` à chaque poussée. (c) Un **journal de session local** : 200 événements au plus (ouverture, premier objet, premier échec, onglets visités, fenêtres ouvertes, départ, retour), dans `localStorage`, **hors de la sauvegarde de partie**, vidé par « Recommencer la partie » ; il s'ajoute au fichier que produit « Signaler un problème » avec la version, l'âge, le style et la largeur d'écran. **Rien ne part sans geste du joueur**, aucune requête réseau nouvelle ; le texte de la fenêtre dit ce que contient le fichier.

## Contraintes

- Aucun nouveau système de jeu, aucune règle d'économie modifiée, aucun texte du récit. Tout texte d'interface nouveau suit `docs/STYLE.md` (tutoiement, pas de tiret cadratin) et est **signalé** dans ton compte rendu.
- `js/engine.js` reste sans DOM. Sauvegardes anciennes rechargées (fixtures) : le test de compatibilité reste vert.
- Pas de dépendance, pas de service tiers, pas de pistage.
- Ne lis pas `docs/coffre/`. Aucun secret (solution, code, combinaison, air) dans un commit, `D.CHANGES` ou ton compte rendu.
- Mets à jour `D.VERSION`, `package.json`, `D.CHANGES`, lance `npm run build` (empreinte du service worker).

## Livraison

Travaille dans un clone à jour, jamais dans un dossier temporaire. Quand `npm test` passe en entier, **ouvre le jeu dans un vrai navigateur** (`npx http-server -p 8765 -c-1 .`, puis `http://localhost:8765/`) et vérifie à l'écran chaque point ci-dessus, dans les trois styles, à 390 × 844 et 320 × 568 ; la console ne doit montrer aucune erreur. Si tu ne peux pas ouvrir de navigateur, dis-le clairement au lieu de livrer comme si c'était vérifié. Fais un commit qui dit ce que tu as changé, puis `git push -u origin gemini/finitions-carnet-0-38`. Ne touche pas à `main`, ne fusionne rien. Termine par : le nom de la branche, la sortie de `npm test`, les captures avant/après (390 × 844, style Carnet), ce que tu as vérifié dans le navigateur, **ce que tu n'as pas pu faire**, les textes à relire, et une note pour Codex si tu as besoin de quelque chose dans son territoire.
