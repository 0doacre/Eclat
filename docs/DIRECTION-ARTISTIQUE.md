# Direction artistique — Atlas vivant (branche `prewiew-design`)

## Intention
Éclat est le carnet d'une civilisation qui réapprend à fabriquer le monde, des premiers gestes jusqu'aux étoiles. Les interfaces fonctionnelles restent immédiatement compréhensibles ; les documents et les illustrations portent le mystère.

## Règles de conception
1. **La lecture d'abord.** Corps 15–16 px, secondaire 13–14 px, chiffres et actions jamais sacrifiés aux ornements. Vérifier 320, 360, 390 et 430 px et le mode Grand texte.
2. **Une action, un accent.** L'accent de l'époque identifie la sélection et l'action principale ; l'état ne dépend jamais de la couleur seule.
3. **Trois voix typographiques.** Alegreya Sans pour l'interface ; IM Fell English pour le récit ; IBM Plex Mono pour les relevés. Caveat reste réservé aux annotations. Les variantes d'époque existantes sont conservées pendant l'expérimentation.
4. **Des objets du monde, pas des skins arbitraires.** Domaine = registre, Carte = atlas, Carnet = savoir-faire, Journal = archives, Cosmos = instrument d'observation.
5. **La forme suit le savoir.** Le papier et les pigments peuvent devenir plans, grilles et relevés ; la place des commandes ne change pas d'âge en âge.
6. **Illustrations à rôle défini.** Vignette pour reconnaître, décor pour situer, planche pour comprendre, image plein format pour célébrer. Aucun montage ou planche-contact en tant qu'illustration de jeu.
7. **Un langage d'icônes.** Privilégier des pictogrammes SVG monochromes à silhouette lisible ; éliminer progressivement les émojis fonctionnels sans perdre les libellés accessibles.
8. **L'exception est rare.** Découvertes et Grands Œuvres peuvent occuper davantage d'espace ; la gestion quotidienne reste compacte.

## Premier lot expérimental
`css/design-preview.css` ajuste l'échelle des petits textes, les états de focus, la distinction des surfaces et les barres, sans changer les mécaniques ni les assets. Chargé après les CSS existants uniquement dans cette branche.

## Contrôles avant validation
- Parcours Domaine → Carte → Atelier → Carnet → Cosmos ; états vides, chargés et chantier avancé.
- Comparer thèmes Jour/Veillée et les différentes époques.
- Vérifier les débordements de l'en-tête à 320 px et la navigation inférieure.
- Tester clavier, focus visible, mouvement réduit et Grand texte.
- Vérifier qu'aucun décor ne réduit le contraste des informations.
- Valider les captures réelles avant d'étendre la passe aux icônes et aux illustrations.

## Décisions ouvertes
- Conserver les titres d'époque très typés ou les réserver aux pages narratives.
- Uniformiser les symboles de navigation avec un set de gravures.
- Définir un cadre documentaire réutilisable pour les Grands Œuvres.


## Garde-fou impératif — aucune navigation horizontale

**La largeur totale de chaque écran doit rester inférieure ou égale à la largeur utile du viewport, à tout instant.** Le joueur ne doit jamais pouvoir faire défiler la page latéralement, ni voir des cartes, boutons ou textes déborder hors écran.

- Tester les largeurs **320, 360, 390 et 430 px**, avec les textes longs et les états chargés.
- Tout conteneur flex/grid réductible doit pouvoir rétrécir (`min-width: 0`) ; les contenus textuels doivent se couper ou revenir à la ligne sans masquer les actions.
- Les listes défilant horizontalement **à l'intérieur d'un composant intentionnel** (par exemple le sélecteur de gestes de l'Atelier) sont tolérées seulement si le viewport principal reste fixe et si le geste est explicite.
- Ne jamais se contenter d'un `overflow-x: hidden` global pour cacher un défaut : corriger aussi le composant qui déborde. Une protection globale peut s'ajouter en défense.
- **Critère bloquant avant fusion** : `document.documentElement.scrollWidth <= window.innerWidth` et `document.body.scrollWidth <= window.innerWidth` sur les tailles cibles, dans les écrans et états testés.

## Deuxième passe — expérimentation visible
La branche de test assume une identité plus forte : filets de reliure, titrage éditorial, cartes à contours d'encre, objectif en marge colorée, séparateurs de registre et ressources plus aérées. Les changements sont concentrés sur le Domaine et restent réversibles.
