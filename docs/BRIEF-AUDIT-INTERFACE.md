# Brief : audit des défilements, des hauteurs figées et des fenêtres (à coller dans une nouvelle conversation)

Rédigé le 11 novembre 2026, version 0.66.4 publiée. Modèle conseillé pour l'audit : **Sonnet 5.5** (c'est de la mesure et du relevé). La refonte qui suivra, si elle est décidée, se fera avec un modèle plus fort, après lecture de la liste.

## Le projet en trois lignes

Éclat est une application mobile (PWA) de jeu incrémental en français, en HTML, CSS et JS sans framework. Le moteur (`js/engine.js`) est testable en Node ; l'interface (`js/ui.js` et les fichiers voisins) se pilote dans un vrai Chromium avec Playwright. Dépôt : `0doacre/craftgame`, dossier local `C:\Users\sylva\AppData\Local\Temp\craftgame-sobre`.

## Règles de travail (à respecter)

- **Rien ne se publie sans le mot « Publie »** du porteur. `main` est la version publique (GitHub Pages) ; la branche de travail est `claude/sobriete-coherence` ; `alpha` sert aux essais sur téléphone (https://alpha.craftgame-wrr.pages.dev). Ne jamais forcer un push ; avant de pousser sur `main`, vérifier que c'est une simple avance (`git merge-base --is-ancestor origin/main HEAD`).
- **Cette mission est un audit : ne modifier aucun fichier du jeu.** Seuls fichiers à écrire : le rapport et ses captures (voir « Livrable »).
- Après tout changement de fichier livré (hors audit) : `node tools/build.js`, puis `npm test`.
- Les textes du jeu évitent les calques d'anglais et les constructions en trois temps (voir la mémoire du projet). Le porteur préfère peu de mots et des icônes.
- Le porteur répond en français ; répondre en français.

## Outils déjà en place

- **Playwright 1.61.0** est installé hors du dépôt. Chemin à donner : `PW=C:/Users/sylva/AppData/Local/Temp/claude/C--Users-sylva-AppData-Local-Temp-craftgame-src/ba4a3d35-8759-4193-a4d5-b1ac39849e40/scratchpad/pw/node_modules/playwright`. Si ce dossier n'existe plus : `npm install playwright@1.61.0` dans un dossier à part avec `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` (le Chromium de la révision 1228 est déjà dans `%LOCALAPPDATA%\ms-playwright`).
- `tools/capture-pw.js` : une capture d'un écran ou d'une fenêtre. `node tools/capture-pw.js <sortie.png> --tab domaine --clic "#menuBtn" --w 390 --h 844 --js "code"`. Les options `--dump "<sélecteur>"` listent des éléments.
- `tools/test-ux.js` : mesure le défilement vertical de chaque vue à 390 × 844 et 320 × 568 (plafonds en tête de fichier).
- `tools/test-echelle-ui.js --rapport` : relève polices, tailles et graisses sur dix écrans.
- Quatorze tests d'interface passent (`tools/test-*-ui.js`) ; `npm test` passe. Certains veulent un serveur local : `node tools/serve.js 8080`.
- Documents à lire d'abord : `docs/GRAMMAIRE-V2.md` (les contrôles), `docs/GRANDS-ECRANS.md` (le rail à gauche au-dessus de 900 px), `docs/A-FAIRE.md`.

## Ce qu'il faut savoir du CSS (c'est la cause probable des défauts)

Le style est une pile de couches chargées dans cet ordre : `style.css` → `theme.css` → … → `boutons.css` → `carnet-peint.css` → `sobriete.css` → `harmonie-sobre.css` → `fin.css`. Les dernières règles gagnent avec des sélecteurs comme `html[data-style-mode="vivant"] #app#app#app#app #v-xxx …` et des `!important` (environ 150 dans `fin.css`, 130 dans `harmonie-sobre.css`). Une règle d'une couche ancienne peut donc réapparaître dans un recoin que les nouvelles n'ont pas prévu. Les écrans sont `#v-domaine` (Terres), `#v-labo` (Étude), `#v-atelier`, `#v-arbre` (Progression), `#v-journal` et `#v-carnet`. Les fenêtres sont `#modal` (hors de `#app`), avec `.modal-box`.

## La mission

Faire la liste **mesurée** de ce qui rend l'interface « rigide » pour le porteur : fenêtres raides, petits défilements parasites.

Pour **chaque écran et chaque fenêtre** ci-dessous, à **320 × 568, 390 × 844 et 430 × 932**, dans l'état de partie de `tools/capture-pw.js` (Bronze, recettes connues, ressources en réserve), relever :

1. **Défilements imbriqués** : tout élément qui défile (`overflow-y` auto ou scroll avec `scrollHeight > clientHeight`) à l'intérieur d'un autre élément qui défile. Donner la chaîne d'ancêtres.
2. **Hauteurs figées** : éléments avec `height`, `max-height` ou `min-height` en pixels ou en `vh`/`dvh` qui coupent ou rognent leur contenu.
3. **Fenêtres plus hautes que l'écran** ou dont le bas est masqué (barre d'onglets, clavier) ; fenêtres sans moyen visible de fermer.
4. **Défilement qui « s'accroche »** : `overscroll-behavior` absent sur un défilement interne, ce qui fait défiler la page derrière (chaînage).
5. **Cibles tactiles sous 44 × 44 px** (zone cliquable réelle, pas seulement le dessin).
6. **Contenu masqué par la barre d'onglets du bas ou la plaque du nom de la terre** (éléments fixés par-dessus).
7. **Défilement horizontal** quel qu'il soit (il ne doit y en avoir aucun).

### Écrans à passer
Terres (une terre avec carte « nouveau gisement » : le Gisement Noir, âge 9 ; et la Lisière), Étude (avec ressources affichées : réglage `equipmentFilter = "tout"`), Atelier (liste des métiers, page d'un métier, feuilles Équipe, À construire et « Ce qui tourne »), Journal (Recettes, Fragments, Livre), Progression (Chemin, Secrets, Gestes, Fins, Mémoire).

### Fenêtres à passer
Menu (les cinq onglets), Quêtes, Mémoire des mains, Comptoir, fiche d'un objet (appui long sur une ressource ou une recette), fenêtre de relève, fenêtre d'ouverture (« Ouvrir les yeux »), Aide.

### Méthode conseillée
Écrire **un script de relevé** unique (`tools/audit-interface.js`, à garder dans le dépôt) qui ouvre chaque cas dans Chromium, exécute dans la page une fonction qui parcourt tous les éléments visibles et renvoie les anomalies 1 à 7 sous forme de données, puis imprime un tableau. Prendre une capture de chaque cas fautif avec `tools/capture-pw.js` ou depuis le script. Le script sert de contrôle de régression pour la suite : il doit pouvoir tourner en une commande.

## Livrable

1. `docs/AUDIT-INTERFACE-<date>.md` : un tableau **classé par gravité** (bloquant, gênant, cosmétique). Une ligne par défaut : écran ou fenêtre, largeur, type (1 à 7), sélecteur de l'élément, valeur mesurée, fichier CSS ou JS d'où vient probablement la règle (`grep` sur le sélecteur ou la propriété), capture.
2. Les captures dans `docs/audit-interface/` (JPG, largeur 390 px de préférence, légères).
3. En tête du rapport : un **résumé de dix lignes** (combien de défauts par type, les trois écrans les plus touchés, les deux ou trois causes qui reviennent), puis **une proposition de plan de correction** : quels défauts se règlent en retirant du CSS mort, lesquels demandent de refaire la structure d'une fenêtre (feuille du bas qui monte et se ferme au glissement), lesquels sont cosmétiques. Ne rien corriger.
4. Un commit sur la branche de travail avec le script, le rapport et les captures. **Pas de push sur `main`, pas de 0.66.5.**
5. Dire en fin de mission ce que le script ne peut pas mesurer : la sensation au doigt (inertie, rebond, accroche). Le porteur teste sur son téléphone et complétera.

## Ce que le porteur a déjà remarqué (pour orienter les relevés)

- « Des fenêtres un peu rigides, des petits scrolls. »
- Sur les Terres, un grand vide entre le panneau Maîtrise et la carte « nouveau gisement » (le corps de la terre garde sa hauteur).
- Au-dessus de 900 px de large, la mise en page à rail (onglets à gauche, colonne de 520 px) est récente : la vérifier aussi à 1280 × 800.

## Hors périmètre

Les textes, les illustrations, l'équilibrage du jeu, la version et la publication. Ne pas toucher à `js/engine.js` ni à `js/data.js`.
