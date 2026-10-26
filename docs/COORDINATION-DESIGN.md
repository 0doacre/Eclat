# Coordination — chantier de direction artistique « L’Atlas vivant »

> **À l’attention de Claude et de toute personne intervenant sur Éclat.**
> Ce document est volontairement placé sur `main` pour rendre visible un chantier mené **exclusivement sur une branche séparée**. Il ne modifie ni le jeu ni sa feuille de route fonctionnelle.

## Situation

- **Branche du chantier graphique :** `prewiew-design` (orthographe exacte).
- **Branche de référence du développement :** `main`.
- **Prévisualisation indépendante :** https://craftgame-wrr.pages.dev/
- **Intention :** faire évoluer la direction artistique vers **« L’Atlas vivant »** : une interface de jeu évoquant un atlas/carnet de civilisation qui s’enrichit du silex aux étoiles.
- **Document de direction artistique sur la branche de travail :** `docs/DIRECTION-ARTISTIQUE.md`.

## Périmètre du chantier

Nous travaillons sur la lisibilité, la hiérarchie de l’information, la typographie, les couleurs, les composants d’interface, les illustrations et la cohérence entre les écrans. Le **Domaine** sert de premier écran de référence ; les autres vues suivront progressivement.

Nous cherchons à **préserver** les mécaniques de jeu, l’équilibrage, les données, la progression, les sauvegardes, le récit et le vocabulaire établi. Toute modification de JavaScript éventuellement nécessaire à la présentation devra être limitée, motivée et vérifiée pour éviter des régressions.

## Coordination avec le développement sur `main`

1. **Claude peut continuer à développer normalement sur `main`.** Il n’est pas demandé de geler le développement.
2. **Ne pas fusionner `prewiew-design` dans `main` automatiquement.** Une intégration éventuelle fera l’objet d’une revue distincte.
3. **Ne pas recopier des changements graphiques de la branche expérimentale vers `main` sans coordination**, afin d’éviter les doublons et conflits.
4. **Signaler les évolutions de `main` susceptibles d’impacter l’interface** : nouveaux écrans, changements de structure HTML/CSS, nouvelles interactions, modifications de navigation, contraintes d’accessibilité ou de performances.
5. **Les corrections de bugs fonctionnels restent prioritaires sur `main`** ; nous les répercuterons au besoin dans la branche de design lors de la synchronisation.
6. **Surveiller le service worker et les caches** lors des changements d’assets, de feuilles de style ou du HTML, afin que la prévisualisation reflète bien les nouveaux commits.

## Avis et objections bienvenus

**Claude : si tu vois une incompatibilité, une dette technique, une régression possible ou un désaccord sur les choix de direction artistique, merci de le signaler explicitement.** Les retours sont souhaités, notamment sur :

- les composants qui gagneraient à être mutualisés plutôt que surchargés en CSS ;
- les contraintes de performance mobile, d’accessibilité et de lisibilité ;
- les collisions potentielles avec des travaux en cours sur `main` ;
- la fidélité à l’univers narratif et aux intentions de game design ;
- les modalités de synchronisation et, plus tard, d’intégration.

**Canal proposé :** ouvrir une *issue* GitHub intitulée `[Design] Retour sur L’Atlas vivant` (ou ajouter des commentaires à une future pull request), avec captures et références aux fichiers concernés. Ce document ne constitue pas une demande de validation implicite : les objections argumentées sont utiles et attendues.

## État initial

Une première couche CSS expérimentale (`css/design-preview.css`) et un document d’orientation existent sur `prewiew-design`. La refonte visuelle détaillée est encore en cours. Le site Cloudflare Pages permet de vérifier les évolutions sur mobile.

## Retours de Claude (26 octobre 2026, `main` en 0.29.0, `prewiew-design` lue à `1707b92`)

J'ai lu ce document, `docs/DIRECTION-ARTISTIQUE.md` et `css/design-preview.css` de la branche, et mesuré la branche dans un navigateur (390 px, partie avancée). Rien ici n'est une objection de principe à « L'Atlas vivant » : la direction (lisibilité d'abord, une action un accent, pas d'`overflow-x` caché) va dans le sens de ce que nous avons déjà durci sur `main`. Ce sont des collisions et des points de méthode, classés par gravité.

### À corriger avant tout partage de la prévisualisation

1. **Le service worker ne connaît pas la nouvelle feuille de style.** Sur la branche, `node tools/build.js --check` échoue : « Fichiers chargés par `index.html` absents de `sw.js` : `css/design-preview.css` ». Deux effets : le fichier n'est pas mis en cache hors ligne, et, comme `index.html` a changé sans que `BUILD` soit recalculé, un navigateur qui a déjà visité la prévisualisation peut garder l'ancien `index.html` (cache d'abord). C'est exactement le point 6 de ce document. Correctif : ajouter la feuille à `FILES` dans `sw.js`, puis `node tools/build.js` à chaque push qui touche un fichier du cache.
2. **Les sélecteurs `#v-domaine …` annulent l'affichage compact.** `#v-domaine .gis { min-height: 62px }` et `#v-domaine .gis-ic { width: 48px }` ont la spécificité d'un identifiant et battent `.dom-dense .gis` / `.dom-dense .gis-ic` (0.25.0, réglage Menu → Affichage compact). Mesure à 390 px, mêmes données : sur `main`, une rangée de gisement fait 110 px en normal et **52 px en compact** (icône 40 px) ; sur `prewiew-design`, 119 px et **76 px** (icône 48 px). Le compact ne resserre presque plus. Même risque pour le Carnet compact (`#clist.carnet-dense`).

   Proposition : ne pas viser par identifiant. `theme.css` utilise déjà `body[data-tab="domaine"]` pour le fond de page (faible spécificité) ; on peut aussi viser la classe `.dom`, ou envelopper les règles dans `:where(#v-domaine)` (spécificité nulle) pour que les modificateurs (`.dom-dense`, `.large-text`) gardent la main.
3. **Collision de nom : « registre ».** Le Registre est un élément du récit (le terminal des Anciens, `flags.registre`, mode `REG`), et `registre` est déjà un nom d'époque dans les thèmes (`data-ep="registre"`, Âges de l'Acier à l'Électricité). « Le Domaine comme un registre de l'Atlas vivant » et les commits « registre vivant » vont prêter à confusion, dans le code comme dans les textes. Je suggère un autre mot pour la métaphore du Domaine (« page », « relevé », « feuillet »), et de ne jamais l'écrire dans l'interface.

### Fragilités à connaître

4. **Fonds semi-transparents sur un fond illustré.** `background-color: color-mix(in srgb, var(--panel) 93%, transparent)` rend le contraste dépendant de l'image de page qui passe dessous. Le test de contraste de `tools/test-ux.js` mesure les couleurs de texte contre les jetons de fond, pas le composite : il ne verra pas un défaut. Fonds pleins pour tout ce qui porte du texte ; la transparence pour les filets et les ombres.
5. **Doublons avec l'existant.** Le focus (`outline: 3px solid var(--acc)`) existe déjà dans `theme.css` ; les cibles de 44 px sont déjà posées par une règle commune. Garder une seule définition évite que les deux divergent à la prochaine passe.
6. **Les émojis fonctionnels ne sont pas seulement décoratifs.** Les libellés (« 💾 Sauvegardes », « 🪙 Le Comptoir », « 🛖 N ruines à relever »…) sont lus par `tools/boutons.js` (inventaire `docs/boutons.md`, vérifié par `test-boutons`) et par des tests de navigateur. Les remplacer par des SVG demande de garder un nom accessible équivalent et de régénérer l'inventaire (`BROWSER=chromium node tools/boutons.js`). Le jeu a déjà une chaîne d'icônes (`tools/icons.js`, `js/icons.js`, sprite SVG, crédits CC BY 3.0 dans `docs/CREDITS.md`) : l'étendre plutôt que d'ajouter un second jeu de pictogrammes.
7. **Trois voix typographiques.** La règle 3 fixe Alegreya Sans, IM Fell English et IBM Plex Mono, mais `main` charge aussi Cinzel, Playfair Display, Special Elite et Space Grotesk selon l'époque. Chaque famille et chaque graisse coûte du cache hors ligne (les polices sont dans `FILES`). Une passe qui réduit les familles allège le jeu ; une passe qui en ajoute, non. Dis-moi quelles époques doivent garder leur titrage.

### Ce qui a bougé sur `main`, que la branche doit connaître

La branche part de la 0.28.0 ; `main` a depuis la 0.29.0 (#105). Composants et classes ajoutés, à ne pas écraser :

| Version | Composant | Ce qu'il faut savoir |
|---|---|---|
| 0.24 | Le jus (`js/juice.js`) | `.jpress` (appui), `.jring`, `.jflash`, `#app.jshake` (secousse par la propriété `translate` : **ne pas poser `transform` ni `translate` sur `#app`**), fêtes à trois paliers `.cele.t2` / `.cele.t3` avec rayons `.crays`. Respecte « réduire les animations ». |
| 0.25 | Menu et affichage | Sections `.menu-sec`, interrupteurs `.btn.sw[role=switch]`, `.dom-dense` (boutons de gisement réduits à `.bi`, libellé `.bl` masqué), `#clist.carnet-dense`, Carnet à deux colonnes dès 360 px. |
| 0.26 | L'appareil (`js/appareil.js`) | Bouton Retour, titre de l'onglet, raccourcis 1 à 6. |
| 0.27 | Ruines | Un bloc replié `.dom-ruines` sous les gisements (au lieu d'une carte par ruine). |
| 0.28 | Arbre | Pastilles `.arb-pas` en frise, feuille `.modal.arb-sheet` (une fenêtre, pas une page). |
| 0.29 | Vocabulaire | « Objectif », « Nouvelle recette », « Requis », « Atelier » : voir `docs/revue/vocabulaire.md`. Ne pas réintroduire Scénario, Étape clé, Tenter. |

### Méthode de synchronisation et d'intégration

8. **Une branche longue diverge.** Trois fichiers touchés aujourd'hui (une feuille, un document, une ligne d'`index.html`), mais la passe visuelle va s'étendre et `main` bouge vite. Proposition : livrer la couche Atlas **derrière un réglage**, comme la vue compacte : `body[data-design="atlas"]` posé par un réglage (Menu → Affichage → « Style »), toutes les règles préfixées par ce sélecteur. On peut alors fusionner tôt sur `main`, sans changer l'apparence par défaut, comparer les deux styles sur le même appareil, et supprimer la divergence de branche. C'est réversible et ça répond au point 2 de ce document (« ne pas fusionner automatiquement ») : rien ne change tant que le réglage est « Classique ».
9. **Faire tourner la CI.** Le workflow ne se lance que sur les pull requests et sur `main`. Une pull request **en brouillon** de `prewiew-design` vers `main` suffirait pour qu'`npm test` (Linux et Windows) la vérifie à chaque push, sans risque de fusion. Le garde-fou « pas de défilement horizontal » est déjà mesuré par `tools/test-ux.js` à 320, 360, 390 et 430 px (texte normal et grand texte) : le critère bloquant de ce document est donc déjà exécutable.
10. **Commandes de vérification** à lancer sur la branche : `npm test` ; `node tools/test-ux.js` (seul, sans autre test en parallèle : il est sensible à la charge) ; `npm run test:affichage`, `test:arbre`, `test:friction`, `test:juice`, `test:appareil`, `test:ouverture` (navigateur, une minute chacun).

### Questions

- Le chantier vise-t-il toutes les époques, ou l'époque « pigments » (les trois premiers âges) en premier ? Les contrastes des autres époques ont été mesurés un par un (`tools/test-ux.js`, test de contraste) ; une couche qui change les fonds les remet en jeu.
- Les illustrations existantes (décors de terres, fonds de pages, `assets/fonds`, `assets/terres`) restent-elles ? La règle 6 parle de « vignette, décor, planche, plein format » : quelle part est à produire, et par quel moyen ? Ce sont des fichiers à ajouter au cache (poids hors ligne).
- Les noms de composants : on garde les noms actuels (`.dom-card`, `.gis`, `.rec`…) pour ne pas casser les tests de navigateur qui les ciblent, et les nouveaux composants prennent le préfixe `atlas-` ?
- Qui relit une capture avant d'étendre aux icônes : moi sur `main` seulement, ou aussi sur la branche ?

Je ne touche pas à `prewiew-design`. Je continue sur `main` en signalant ici ou dans une issue tout changement de structure HTML ou CSS qui concerne le design.

---

*Document de coordination uniquement — aucun changement fonctionnel sur `main`.*
