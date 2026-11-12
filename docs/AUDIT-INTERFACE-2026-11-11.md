# Audit de l'interface : défilements, hauteurs figées, fenêtres

Premier relevé du 11 novembre 2026 sur la version 0.66.4 (branche `claude/sobriete-coherence`), puis relevé rejoué le 12 novembre sur la version 0.67.0 avec le détecteur corrigé (section « Après correction »). Les sections qui précèdent « Après correction » décrivent l'état de 0.66.4 et gardent leurs chiffres d'alors. Aucun fichier du jeu n'a été modifié. Le script `tools/audit-interface.js` refait tout le relevé en une commande (voir « Rejouer »).

## Résumé

1. 31 cas (15 écrans ou feuilles, 16 fenêtres) × 4 tailles (320 × 568, 390 × 844, 430 × 932, 1280 × 800) : 294 relevés bruts, 41 lignes distinctes.
2. Par type, en lignes distinctes : défilements imbriqués 2 · hauteurs figées 16 (15 sont le plafond des fenêtres) · fenêtres 1 · chaînage 5 · cibles sous 44 px 10 · défilement horizontal 5 · contenu masqué par la barre d'onglets ou la plaque **0** · erreur de script 2.
3. Par gravité : 2 bloquantes (la même erreur de script, vue de deux endroits), 15 gênantes, 24 cosmétiques.
4. **Bloquant, hors des sept types : toucher la fiche d'un extracteur (Cabane de bûcheron, depuis « À construire » ou depuis une tuile du Journal) lève `perTime is not defined` dans `js/atelier.js:1581` ; la fenêtre ne s'ouvre pas.** Reproduit aux quatre tailles : c'est un défaut que le joueur voit.
5. Les trois endroits les plus touchés : les **Terres** (10 lignes, dont le vide et un défilement dans le défilement), l'**Atelier** (feuilles À construire, Équipe, Ce qui tourne, page d'un métier : 11 lignes) et le **Comptoir** (cibles de 30 px).
6. Cause 1 : `css/harmonie-sobre.css` (lignes 290 à 343) pose sept fois de suite `max-height` ou `min-height` en `calc(… + 100dvh)` sur `.terre-gisements`, avec un `!important`. Résultat : un défilement dans la page (118 px à 320 px de large, 5 px ailleurs) et, avec la carte « Gisement à exploiter », un vide de 521 px.
7. Cause 2 : toutes les fenêtres sont plafonnées par `max-height: min(88vh, 88dvh)` (`css/design-preview.css:1005`). Les fiches d'une ressource et d'une recette défilent donc de 68 et 77 px à 390 px : ce sont les « petits scrolls ». Le Comptoir défile de 949 px, l'Aide de 3 266 px.
8. Cause 3 : `overflow-y: auto` rend aussi `overflow-x` automatique. La page Fins de la Progression défile de 24 px sur le côté, la rangée des terres de 28 px à 320 px.
9. Ce qui est propre : aucune fenêtre plus haute que l'écran, aucun débordement de la page en largeur, rien de caché sous la barre d'onglets ou la plaque du nom (le détecteur a été éprouvé par un cas truqué). Seule la fenêtre d'ouverture, à 320 px, n'a pas son bouton à l'écran sans défiler.
10. Le rail à gauche à 1280 × 800 tient ; une seule ligne lui est propre : la scène du Sentier, rognée de 161 px à droite.

## Les défauts à retenir

| # | Gravité | Où | Quoi | Source probable |
|---|---|---|---|---|
| 1 | bloquant | Atelier › À construire › Cabane de bûcheron ; Journal, tuile d'un extracteur | `perTime` n'existe pas dans `atelier.js` (il est défini dans `domaine.js:22`) ; la fenêtre ne s'ouvre pas | `js/atelier.js:1581` |
| 2 | gênant | Terres, Gisement Noir avec la carte « Gisement à exploiter » | vide de 521 px entre la rangée des terres et la carte (540 px à 320) ; la carte n'apparaît qu'en défilant | `harmonie-sobre.css:315-319`, `fin.css:238` |
| 3 | gênant | Terres, Lisière à 320 px | la liste des gisements défile de 118 px dans la page, sans `overscroll-behavior` : la page suit | `harmonie-sobre.css:290-293` |
| 4 | gênant | fiches d'une ressource et d'une recette (390 px : 68 et 77 px de défilement) | le plafond à 88 % de l'écran coupe une fenêtre qui n'avait besoin que de peu | `design-preview.css:1005` |
| 5 | gênant | fenêtre d'ouverture, 320 × 568 | « Ouvrir les yeux » est sous la ligne de flottaison (162 px à défiler) et la fenêtre n'a pas de croix | `design-preview.css:1005`, `js/memoire.js:69` |
| 6 | gênant | Progression › Fins ; Terres à 320 px ; Atelier › Équipe ; page d'un métier | défilement horizontal de 24, 28, 243 et 388 px | `refonte-0-39.css:150`, `terres.css:11`, `sobriete.css:33` |
| 7 | gênant | Comptoir ; feuille À construire | cibles de 30 px de haut (lignes de vente), 22 px (« Déjà fait »), 18 px (signes) | `style.css:1259`, `js/atelier.js:1902` |

## Plan de correction proposé

**A. En retirant ou en regroupant du CSS (petit, sans risque pour la structure)**
- Les sept règles de `.terre-gisements` dans `harmonie-sobre.css` (290 à 343) se réduisent à une : une seule hauteur de corps de terre, calculée une fois, sans `min-height` en `dvh`. Cela règle les défauts 2 et 3.
- `overscroll-behavior: contain` sur `.terre-gisements` et `.auto-corps` : ce sont les deux seuls défilements internes qui n'en ont pas.
- `overflow-x: hidden` sur les conteneurs en `overflow-y: auto` qui ne doivent pas défiler de côté (`.prog-corps`, la rangée des terres à 320 px), après avoir trouvé ce qui les élargit de 24 px.
- `.prod-choix` est déclaré quatre fois (`atelier-production.css`, `refonte-0-39.css` deux fois, `sobriete.css`) : n'en garder qu'une.
- Cibles : `min-height: 44px` sur `.ing.link`, le bouton retour (44 × 40), le `summary` du « Déjà fait » et celui de la Mémoire, la ligne `.comptoir-head`.

**B. Ce qui demande de refaire la structure d'une fenêtre**
- Le plafond à 88 % sur `#modal .modal-box` : une feuille du bas qui monte jusqu'à la taille de son contenu, avec une poignée, et se ferme au glissement, remplacerait Comptoir, Mémoire des mains, Aide, fiches et Menu. Aujourd'hui l'Aide défile de 3 266 px dans un cadre.
- La fenêtre d'ouverture : le bouton fixé en pied de fenêtre, le texte qui défile au-dessus.
- Les feuilles de l'Atelier (`.auto-feuille`) ont déjà `overscroll-behavior: contain` ; elles gagneraient à partager le composant des fenêtres.
- À corriger avant tout : le défaut 1, qui est un défaut de script, sans rapport avec la mise en page.

**C. Cosmétique**
- Cibles de 38 à 42 px (`ing.link` 50 × 38, retour 44 × 40), `overscroll-behavior` sur les défilements isolés, la scène du Sentier à 1280 px.

## Après correction (12 novembre 2026, version 0.67.0)

Le chantier « un jeu, pas un site » (`docs/chantier-interface/`) a repris les écrans un par un. La règle tenue : aucune vue ne défile, seules les listes glissent dans un cadre qui ne bouge pas.

Défilement de la page, en pixels, avant puis après :

| Écran | 320 × 568 | 390 × 700 | 390 × 844 |
|---|---|---|---|
| Terres | 70 → 0 | 0 → 0 | 0 → 0 |
| Étude (âges 1, 5 et 9) | 113 à 263 → 0 | 0 à 72 → 0 | 0 → 0 |
| Page d'un métier | 186 → 0 | 58 → 0 | 0 → 0 |
| Carnet | 888 → 0 | 701 → 0 | 557 → 0 |
| Fenêtre d'une fiche (Bois, puis Manche) | 472 et 1801 → 0 | 195 et 1136 → 0 | 68 et 1009 → 0 |

Sources : les comptes rendus `rendu-T1.md`, `rendu-T4.md` et `rendu-T5.md`, puis les mesures de l'intégration (`rendu-integration.md`). Quatre tests gardent ces zéros : `test-ux.js`, `test-terres-fixe-ui.js`, `test-etude-fixe-ui.js` et `test-ecrans-fixes-ui.js`.

### Ce qui glisse encore, dans son cadre

- La page Objet d'une fiche longue : 349 px pour la Cabane de bûcheron à 320 × 568, 130 px à 390 × 700.
- La liste « Sert à fabriquer » d'une fiche, la liste des recettes du Carnet, la liste des métiers en partie avancée.
- Le milieu des Terres dans un état rare (une carte de gisement à poser), et l'arbre de la Progression, qui est une carte.

### Deux diagnostics du premier rapport étaient faux

- **Le vide des Terres.** Le détecteur comparait un bloc à son voisin dans le document, pas à celui qui le précède à l'écran : il a compté 333 px de contenu comme du vide. La vraie cause était la plaque du nom fixée en bas et une grille aux hauteurs figées.
- **La feuille du bas comme réponse aux fiches.** Le défilement venait de la hauteur du contenu sous un plafond de 88 % de l'écran. La réponse retenue est un panneau fixe à deux pages, Objet et Usages.

### Le détecteur corrigé, et le relevé rejoué

Quatre corrections dans `tools/audit-interface.js` :
1. **Le vide** se mesure entre un bloc et le plus bas des blocs qui le précèdent à l'écran, et non plus de son voisin dans le document.
2. **Les rangées qui glissent de côté exprès** (`.prod-choix`, `.filters`, `.terres-rangee`) forment le type 9, classé à part (« voulu »), hors décompte des défauts et sans capture. Toute autre zone qui glisse de côté reste un type 7.
3. **Les tailles** passent à six : 320 × 568, 360 × 640, 390 × 700, 390 × 844, 430 × 932, 1280 × 800.
4. **Les erreurs de page** sont vidées avant l'ouverture de chaque cas : une erreur levée en fermant le cas précédent ne lui est plus imputée.

Nouveau contrôle, type 10 : aucune vue principale ne défile (Terres sur la Lisière et au Gisement Noir, Étude, liste des métiers, page d'un métier). Il lit le défilement de la page, de `body`, de `#views` et de la vue courante ; il est bloquant. Résultat aux six tailles : aucune ligne de type 10, donc aucune de ces vues ne défile. Essai truqué (`--inject "document.querySelector('.view.on').style.minHeight='2400px'"`) : le contrôle signale « la vue défile : views 1768 px » sur les cinq cas et le script sort avec le code 1.

Avant et après, en lignes distinctes (premier relevé : quatre tailles, détecteur d'origine ; second : six tailles, détecteur corrigé) :

| | 0.66.4 | 0.67.0 |
|---|---|---|
| Relevés bruts | 294 | 135 |
| Lignes distinctes | 41 | 18 |
| Bloquantes | 2 | 0 |
| Gênantes | 15 | 5 |
| Cosmétiques | 24 | 11 |
| Rangées voulues (type 9) | comptées gênantes | 2 |
| Vue principale qui défile (type 10) | non mesuré | 0 |
| Erreur de script | 2 (`perTime`) | 0 |
| Cas en échec | non relevé | 0 |

Le script sort avec le code 0. Disparus : l'erreur `perTime`, le vide des Terres, les défilements imbriqués des Terres, le chaînage sans `overscroll-behavior`, la fenêtre d'ouverture sans bouton à l'écran, les défilements horizontaux de l'Équipe et de la page d'un métier (ce dernier passe en type 9).

### Ce qui reste, et pourquoi

- **Gênantes (5).** Cibles sous 44 px de la ligne de vente du Comptoir (30 px) et du signe de la main (24 × 18), du signe de la fenêtre de relève (26 × 18) : le chantier n'a pas touché au Comptoir ni à la relève. L'écran Fins de la Progression défile de 24 px de côté (`.prog-corps`, aux quatre tailles de téléphone) : non traité. La scène du Sentier, rognée de 161 px à 1280 × 800 : propre au rail de bureau, non traitée.
- **Cosmétiques (11).** Neuf fenêtres (Aide, Comptoir, Mémoire des mains, cinq rubriques du Menu, relève) défilent sous le plafond `max-height` de `#modal .modal-box` (`design-preview.css`) : ce sont des fenêtres, pas des vues ; seuls les petits écrans y défilent beaucoup, l'Aide de 4 179 px à 320 px. Deux lignes de cibles de 41 à 42 px et de 32 px (lignes de « À construire », résumé de la Mémoire).
- **Voulues (2).** La rangée des métiers de la page d'un métier (`.prod-choix`, 442 px de glissement à 320) et la rangée des terres à 320 (28 px).

### Ce qui n'est pas fait

- Seize tests d'interface sur trente-six sont rouges parce qu'ils décrivent une interface plus ancienne (tâche T6, tableau dans `rendu-integration.md`).
- Rien n'a été essayé sur un vrai téléphone.

## Ce que le script ne mesure pas

- La sensation au doigt : inertie, rebond, accroche entre deux défilements, vitesse. Le porteur teste sur son téléphone et complétera.
- Le clavier virtuel (champ de recherche de l'Étude, code du mode test), les encoches et zones de sécurité (`env(safe-area-inset-*)`), la barre d'adresse mobile qui fait varier `100dvh`, Safari sur iPhone.
- Les réglages « Grand texte » et le thème sombre ; les styles Atlas et Classique ; les âges autres que le Bronze et le Gisement Noir ; les listes très remplies.
- Deux boutons collés dont chacun fait plus de 44 px.

La gravité est un classement du script (règles dans `gravite()`), pas un jugement final. Le détecteur de contenu masqué (type 6) a été éprouvé en posant un cache sur le bouton d'œuvre de l'Étude (option `--inject`) : il l'a trouvé. Le contrôle de vue qui défile (type 10) l'a été de même (voir plus haut).

## Rejouer

```
node tools/audit-interface.js --json docs/audit-interface/releve.json --md docs/audit-interface/tableau.md --shots docs/audit-interface
node tools/audit-interface.js --w 390 --cas terres,menu
node tools/audit-interface.js --liste
```

Le code de sortie est 1 s'il reste un défaut bloquant ou un cas en échec, 0 sinon (0 sur la version 0.67.0). Playwright : la variable `PW`, ou le dossier habituel du scratchpad. Une exécution complète (six tailles) prend environ huit minutes.

## Tableau complet de 0.67.0 (une ligne par défaut distinct, classé par gravité)

Relevé du 12 novembre 2026, six tailles, détecteur corrigé. Les lignes de type 2 qui visent `#modal .modal-box` ont toutes la même source (plafond de hauteur des fenêtres). Les rangées voulues sont de type 9. Captures dans `docs/audit-interface/` (JPG ; les éléments fautifs sont cerclés). Le tableau du premier relevé (0.66.4) reste dans l'historique git de ce fichier.

| Gravité | Écran ou fenêtre | Type | Largeurs | Sélecteur | Mesure | Source probable | Capture |
|---|---|---|---|---|---|---|---|
| gênant | Comptoir | 5 | 320 · 360 · 390 · 430 · 1280 | `#modal div.modal-box > div.comptoir-signe > span.signe[data-s="main"]` (6) | 320 : zone 24 × 18 px (dessin 23 × 17) ; 360 : zone 24 × 18 px (dessin 23 × 17) ; 390 : 2 × zone 24 × 18 px (dessin 23 × 17) ; 430 : zone 24 × 18 px (dessin 23 × 17) ; 1280 : zone 24 × 18 px (dessin 23 × 17) |  | [comptoir-320.jpg](audit-interface/comptoir-320.jpg) |
| gênant | Comptoir | 5 | 320 · 360 · 390 · 430 · 1280 | `#sell-list div.comptoir-row > div.comptoir-head[data-goto="argile"]` (43) | 320 : 3 × zone 236 × 30 px (dessin 235 × 30) ; 360 : 5 × zone 270 × 30 px (dessin 270 × 30) ; 390 : 16 × zone 300 × 30 px (dessin 300 × 30) ; 430 : 11 × zone 340 × 30 px (dessin 338 × 30) ; 1280 : 8 × zone 462 × 30 px (dessin 462 × 30) |  | [comptoir-320.jpg](audit-interface/comptoir-320.jpg) |
| gênant | Fenêtre de relève | 5 | 320 · 360 · 390 · 430 · 1280 | `div.acts > span.releve-signe > span.signe[data-s="relais"]` (6) | 320 : zone 26 × 18 px (dessin 24 × 18) ; 360 : zone 26 × 18 px (dessin 24 × 18) ; 390 : 2 × zone 26 × 18 px (dessin 24 × 18) ; 430 : zone 26 × 18 px (dessin 24 × 18) ; 1280 : zone 26 × 18 px (dessin 24 × 18) |  | [releve-320.jpg](audit-interface/releve-320.jpg) |
| gênant | Progression · Fins | 7 | 320 · 360 · 390 · 430 | `#v-arbre div.prog-corps` (5) | 320 : défile en largeur de 24 px (auto) ; 360 : défile en largeur de 24 px (auto) ; 390 : 2 × défile en largeur de 24 px (auto) ; 430 : défile en largeur de 24 px (auto) |  | [progression-fins-320.jpg](audit-interface/progression-fins-320.jpg) |
| gênant | Terres · Lisière | 7 | 1280 | `div.sentier-retained > figure.sentier-chantier > div.sentier-scene` | 1280 : rogne 1 enfant(s) à droite (dépasse de 161.2 px) |  | [terres-lisiere-1280.jpg](audit-interface/terres-lisiere-1280.jpg) |
| cosmétique | Aide | 2 | 320 · 360 · 390 · 430 · 1280 | `#modal div.modal-box` (6) | 320 : défile de 4179 px sous une hauteur fixée (544 px) · max-height:calc(min(100vh, 100dvh) - 24px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)) (design-preview.css) ; 360 : défile de 3708 px sous une hauteur fixée (616 px) · max-height:calc(min(100vh, 100dvh) - 24px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)) (design-preview.css) ; 390 : 2 × défile de 3333 px sous une hauteur fixée (676 px) · max-height:calc(min(100vh, 100dvh) - 24px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)) (design-preview.css) ; 430 : défile de 2891 px sous une hauteur fixée (908 px) · max-height:calc(min(100vh, 100dvh) - 24px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)) (design-preview.css) ; 1280 : défile de 2398 px sous une hauteur fixée (776 px) · max-height:calc(min(100vh, 100dvh) - 24px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)) (design-preview.css) | `design-preview.css` |  |
| cosmétique | Comptoir | 2 | 320 · 360 · 390 · 430 · 1280 | `#modal div.modal-box` (6) | 320 : défile de 1404 px sous une hauteur fixée (544 px) · max-height:calc(min(100vh, 100dvh) - 24px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)) (design-preview.css) ; 360 : défile de 1076 px sous une hauteur fixée (616 px) · max-height:calc(min(100vh, 100dvh) - 24px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)) (design-preview.css) ; 390 : 2 × défile de 1016 px sous une hauteur fixée (676 px) · max-height:calc(min(100vh, 100dvh) - 24px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)) (design-preview.css) ; 430 : défile de 765 px sous une hauteur fixée (908 px) · max-height:calc(min(100vh, 100dvh) - 24px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)) (design-preview.css) ; 1280 : défile de 792 px sous une hauteur fixée (776 px) · max-height:calc(min(100vh, 100dvh) - 24px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)) (design-preview.css) | `design-preview.css` |  |
| cosmétique | Mémoire des mains | 2 | 320 · 360 · 390 · 1280 | `#modal div.modal-box` (5) | 320 : défile de 505 px sous une hauteur fixée (544 px) · max-height:calc(min(100vh, 100dvh) - 24px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)) (design-preview.css) ; 360 : défile de 336 px sous une hauteur fixée (616 px) · max-height:calc(min(100vh, 100dvh) - 24px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)) (design-preview.css) ; 390 : 2 × défile de 257 px sous une hauteur fixée (676 px) · max-height:calc(min(100vh, 100dvh) - 24px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)) (design-preview.css) ; 1280 : défile de 90 px sous une hauteur fixée (776 px) · max-height:calc(min(100vh, 100dvh) - 24px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)) (design-preview.css) | `design-preview.css` |  |
| cosmétique | Menu · affichage | 2 | 320 · 360 | `#modal div.modal-box` (2) | 320 : défile de 108 px sous une hauteur fixée (544 px) · max-height:calc(min(100vh, 100dvh) - 24px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)) (design-preview.css) ; 360 : défile de 17 px sous une hauteur fixée (616 px) · max-height:calc(min(100vh, 100dvh) - 24px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)) (design-preview.css) | `design-preview.css` |  |
| cosmétique | Menu · aide | 2 | 320 · 360 | `#modal div.modal-box` (2) | 320 : défile de 195 px sous une hauteur fixée (544 px) · max-height:calc(min(100vh, 100dvh) - 24px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)) (design-preview.css) ; 360 : défile de 104 px sous une hauteur fixée (616 px) · max-height:calc(min(100vh, 100dvh) - 24px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)) (design-preview.css) | `design-preview.css` |  |
| cosmétique | Menu · ouverture (haut) | 2 | 320 · 360 | `#modal div.modal-box` (2) | 320 : défile de 195 px sous une hauteur fixée (544 px) · max-height:calc(min(100vh, 100dvh) - 24px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)) (design-preview.css) ; 360 : défile de 104 px sous une hauteur fixée (616 px) · max-height:calc(min(100vh, 100dvh) - 24px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)) (design-preview.css) | `design-preview.css` |  |
| cosmétique | Menu · jeu | 2 | 320 · 360 | `#modal div.modal-box` (2) | 320 : défile de 136 px sous une hauteur fixée (544 px) · max-height:calc(min(100vh, 100dvh) - 24px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)) (design-preview.css) ; 360 : défile de 45 px sous une hauteur fixée (616 px) · max-height:calc(min(100vh, 100dvh) - 24px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)) (design-preview.css) | `design-preview.css` |  |
| cosmétique | Menu · systeme | 2 | 320 · 360 | `#modal div.modal-box` (2) | 320 : défile de 155 px sous une hauteur fixée (544 px) · max-height:calc(min(100vh, 100dvh) - 24px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)) (design-preview.css) ; 360 : défile de 64 px sous une hauteur fixée (616 px) · max-height:calc(min(100vh, 100dvh) - 24px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)) (design-preview.css) | `design-preview.css` |  |
| cosmétique | Fenêtre de relève | 2 | 320 | `#modal div.modal-box` | 320 : défile de 127 px sous une hauteur fixée (544 px) · max-height:calc(min(100vh, 100dvh) - 24px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)) (design-preview.css) | `design-preview.css` |  |
| cosmétique | Atelier · feuille À construire | 5 | 360 · 390 · 430 · 1280 | `div.a-construire-ligne > div.row > div.grow[data-goto="cabane"]` (33) | 360 : 3 × zone 270 × 42 px (dessin 270 × 41) ; 390 : 13 × zone 300 × 42 px (dessin 300 × 41) ; 430 : 6 × zone 340 × 42 px (dessin 340 × 41) ; 1280 : 11 × zone 1084 × 42 px (dessin 1084 × 41) |  |  |
| cosmétique | Mémoire des mains | 5 | 320 · 360 · 390 · 430 · 1280 | `#modal div.modal-box > details.mem-liste > summary` (6) | 320 : zone 258 × 32 px (dessin 257 × 32) ; 360 : zone 292 × 32 px (dessin 292 × 32) ; 390 : 2 × zone 322 × 32 px (dessin 322 × 32) ; 430 : zone 362 × 32 px (dessin 360 × 32) ; 1280 : zone 484 × 32 px (dessin 484 × 32) |  |  |
| voulu | Atelier · page d'un métier | 9 | 320 · 360 · 390 · 430 · 1280 | `#v-atelier div.prod > div.prod-choix` (6) | 320 : rangée qui glisse de côté, voulue (442 px) ; 360 : rangée qui glisse de côté, voulue (402 px) ; 390 : 2 × rangée qui glisse de côté, voulue (372 px) ; 430 : rangée qui glisse de côté, voulue (348 px) ; 1280 : rangée qui glisse de côté, voulue (258 px) |  |  |
| voulu | Terres · Gisement Noir (âge 9) | 9 | 320 | `#v-domaine div.dom > nav.terres-rangee` | 320 : rangée qui glisse de côté, voulue (28 px) |  |  |
