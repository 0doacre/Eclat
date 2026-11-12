# Audit de l'interface : défilements, hauteurs figées, fenêtres

Relevé du 11 novembre 2026 sur la version 0.66.4 (branche `claude/sobriete-coherence`). Aucun fichier du jeu n'a été modifié. Le script `tools/audit-interface.js` refait tout le relevé en une commande (voir « Rejouer »).

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

### Ce qui n'est pas fait

- Le détecteur de `tools/audit-interface.js` garde ses quatre défauts (tâche T7) : le tableau complet plus bas date d'avant les corrections et n'a pas été rejoué.
- Seize tests d'interface sur trente-six sont rouges parce qu'ils décrivent une interface plus ancienne (tâche T6, tableau dans `rendu-integration.md`).
- Rien n'a été essayé sur un vrai téléphone.

## Ce que le script ne mesure pas

- La sensation au doigt : inertie, rebond, accroche entre deux défilements, vitesse. Le porteur teste sur son téléphone et complétera.
- Le clavier virtuel (champ de recherche de l'Étude, code du mode test), les encoches et zones de sécurité (`env(safe-area-inset-*)`), la barre d'adresse mobile qui fait varier `100dvh`, Safari sur iPhone.
- Les réglages « Grand texte » et le thème sombre ; les styles Atlas et Classique ; les âges autres que le Bronze et le Gisement Noir ; les listes très remplies.
- Deux boutons collés dont chacun fait plus de 44 px.

La gravité est un classement du script (règles dans `gravite()`), pas un jugement final. Le détecteur de contenu masqué (type 6) a été éprouvé en posant un cache sur le bouton d'œuvre de l'Étude (option `--inject`) : il l'a trouvé.

## Rejouer

```
node tools/audit-interface.js --json docs/audit-interface/releve.json --md docs/audit-interface/tableau.md --shots docs/audit-interface
node tools/audit-interface.js --w 390 --cas terres,menu
node tools/audit-interface.js --liste
```

Le code de sortie est 1 s'il reste un défaut bloquant (le défaut 1 aujourd'hui). Playwright : la variable `PW`, ou le dossier habituel du scratchpad. Une exécution complète prend environ huit minutes.

## Tableau complet (une ligne par défaut distinct, classé par gravité)

Les lignes de type 2 qui visent `#modal .modal-box` (`max-height: min(88vh, 88dvh)`) ont toutes la même source. Captures dans `docs/audit-interface/` (JPG ; les éléments fautifs sont cerclés : orange défilement imbriqué, jaune hauteur, rouge fenêtre, violet chaînage, bleu cible, rose masqué, orange foncé horizontal).

| Gravité | Écran ou fenêtre | Type | Largeurs | Sélecteur | Mesure | Source probable | Capture |
|---|---|---|---|---|---|---|---|
| bloquant | Atelier · feuille Ce qui tourne | 8 | 390 | `(page)` | 390 : perTime is not defined |  |  |
| bloquant | Fiche d'un extracteur (touche sur la Cabane de bûcheron) | 8 | 320 · 390 · 430 · 1280 | `(page)` (4) | 320 : perTime is not defined ; 390 : perTime is not defined ; 430 : perTime is not defined ; 1280 : perTime is not defined |  |  |
| gênant | Terres · Gisement Noir (âge 9) | 1 | 320 · 390 · 430 · 1280 | `#dt-gisement div.terre-corps > div.terre-gisements` (4) | 320 : défile de 5 px dans 1 autre(s) ; 390 : défile de 5 px dans 1 autre(s) ; 430 : défile de 5 px dans 1 autre(s) ; 1280 : défile de 5 px dans 1 autre(s) |  | [terres-gisement-320.jpg](audit-interface/terres-gisement-320.jpg) |
| gênant | Terres · Lisière | 1 | 320 · 1280 | `#dt-lisiere div.terre-corps > div.terre-gisements` (2) | 320 : défile de 118 px dans 1 autre(s) ; 1280 : défile de 5 px dans 1 autre(s) |  | [terres-lisiere-320.jpg](audit-interface/terres-lisiere-320.jpg) |
| gênant | Terres · Gisement Noir (âge 9) | 2 | 320 · 390 · 430 · 1280 | `#v-domaine div.dom > section.dom-card.dom-nouveau-gisement[data-new-deposit="collines:soufre"]` (4) | 320 : vide de 540 px au-dessus (entre nav.terres-rangee et section.dom-card.dom-nouveau-gisement) ; 390 : vide de 521 px au-dessus (entre nav.terres-rangee et section.dom-card.dom-nouveau-gisement) ; 430 : vide de 521 px au-dessus (entre nav.terres-rangee et section.dom-card.dom-nouveau-gisement) ; 1280 : vide de 465 px au-dessus (entre nav.terres-rangee et section.dom-card.dom-nouveau-gisement) |  | [terres-gisement-320.jpg](audit-interface/terres-gisement-320.jpg) |
| gênant | Fenêtre d'ouverture (Ouvrir les yeux) | 3 | 320 | `#modal div.modal-box` | 320 : aucun bouton de fermeture touchable à l'écran sans défiler |  | [ouverture-320.jpg](audit-interface/ouverture-320.jpg) |
| gênant | Terres · Gisement Noir (âge 9) | 4 | 320 · 390 · 430 · 1280 | `#dt-gisement div.terre-corps > div.terre-gisements` (4) | 320 : overscroll-behavior-y: auto sous main#views ; 390 : overscroll-behavior-y: auto sous main#views ; 430 : overscroll-behavior-y: auto sous main#views ; 1280 : overscroll-behavior-y: auto sous main#views |  | [terres-gisement-320.jpg](audit-interface/terres-gisement-320.jpg) |
| gênant | Terres · Lisière | 4 | 320 · 1280 | `#dt-lisiere div.terre-corps > div.terre-gisements` (2) | 320 : overscroll-behavior-y: auto sous main#views ; 1280 : overscroll-behavior-y: auto sous main#views |  | [terres-lisiere-320.jpg](audit-interface/terres-lisiere-320.jpg) |
| gênant | Atelier · feuille À construire | 5 | 320 · 390 · 430 · 1280 | `div.auto-corps > details.construits-faits > summary.small` (4) | 320 : zone 272 × 22 px (dessin 272 × 22) ; 390 : zone 342 × 22 px (dessin 342 × 22) ; 430 : zone 382 × 22 px (dessin 382 × 22) ; 1280 : zone 1126 × 22 px (dessin 1126 × 22) |  | [atelier-construire-320.jpg](audit-interface/atelier-construire-320.jpg) |
| gênant | Comptoir | 5 | 320 · 390 · 430 · 1280 | `#modal div.modal-box > div.comptoir-signe > span.signe[data-s="main"]` (4) | 320 : zone 24 × 18 px (dessin 23 × 17) ; 390 : zone 24 × 18 px (dessin 23 × 17) ; 430 : zone 24 × 18 px (dessin 23 × 17) ; 1280 : zone 24 × 18 px (dessin 23 × 17) |  | [comptoir-320.jpg](audit-interface/comptoir-320.jpg) |
| gênant | Comptoir | 5 | 320 · 390 · 430 · 1280 | `#sell-list div.comptoir-row > div.comptoir-head[data-goto="argile"]` (28) | 320 : 4 × zone 236 × 30 px (dessin 235 × 30) ; 390 : 8 × zone 300 × 30 px (dessin 300 × 30) ; 430 : 8 × zone 340 × 30 px (dessin 338 × 30) ; 1280 : 8 × zone 462 × 30 px (dessin 462 × 30) |  | [comptoir-320.jpg](audit-interface/comptoir-320.jpg) |
| gênant | Fenêtre de relève | 5 | 320 · 390 · 430 · 1280 | `div.acts > span.releve-signe > span.signe[data-s="relais"]` (4) | 320 : zone 26 × 18 px (dessin 24 × 18) ; 390 : zone 26 × 18 px (dessin 24 × 18) ; 430 : zone 26 × 18 px (dessin 24 × 18) ; 1280 : zone 26 × 18 px (dessin 24 × 18) |  | [releve-320.jpg](audit-interface/releve-320.jpg) |
| gênant | Atelier · feuille Équipe | 7 | 320 · 390 · 430 | `div.auto-corps > div.atel-seuil > div.filters.wrap.more` (3) | 320 : défile en largeur de 243 px (auto) ; 390 : défile en largeur de 173 px (auto) ; 430 : défile en largeur de 133 px (auto) |  | [atelier-equipe-320.jpg](audit-interface/atelier-equipe-320.jpg) |
| gênant | Atelier · page d'un métier | 7 | 320 · 390 · 430 · 1280 | `#v-atelier div.prod > div.prod-choix` (4) | 320 : défile en largeur de 442 px (auto) ; 390 : défile en largeur de 388 px (auto) ; 430 : défile en largeur de 348 px (auto) ; 1280 : défile en largeur de 258 px (auto) |  | [atelier-metier-320.jpg](audit-interface/atelier-metier-320.jpg) |
| gênant | Progression · Fins | 7 | 320 · 390 · 430 | `#v-arbre div.prog-corps` (3) | 320 : défile en largeur de 24 px (auto) ; 390 : défile en largeur de 24 px (auto) ; 430 : défile en largeur de 24 px (auto) |  | [progression-fins-320.jpg](audit-interface/progression-fins-320.jpg) |
| gênant | Terres · Gisement Noir (âge 9) | 7 | 320 | `#v-domaine div.dom > nav.terres-rangee` | 320 : défile en largeur de 28 px (auto) |  | [terres-gisement-320.jpg](audit-interface/terres-gisement-320.jpg) |
| gênant | Terres · Lisière | 7 | 1280 | `div.sentier-retained > figure.sentier-chantier > div.sentier-scene` | 1280 : rogne 1 enfant(s) à droite (dépasse de 161.2 px) |  | [terres-lisiere-1280.jpg](audit-interface/terres-lisiere-1280.jpg) |
| cosmétique | Aide | 2 | 320 · 390 · 430 · 1280 | `#modal div.modal-box` (4) | 320 : défile de 4223 px sous une hauteur fixée (499.8 px) · max-height:min(88vh, 88dvh) (design-preview.css) ; 390 : défile de 3266 px sous une hauteur fixée (742.7 px) · max-height:min(88vh, 88dvh) (design-preview.css) ; 430 : défile de 2979 px sous une hauteur fixée (820.2 px) · max-height:min(88vh, 88dvh) (design-preview.css) ; 1280 : défile de 2470 px sous une hauteur fixée (704 px) · max-height:min(88vh, 88dvh) (design-preview.css) | `design-preview.css` |  |
| cosmétique | Comptoir | 2 | 320 · 390 · 430 · 1280 | `#modal div.modal-box` (4) | 320 : défile de 1448 px sous une hauteur fixée (499.8 px) · max-height:min(88vh, 88dvh) (design-preview.css) ; 390 : défile de 949 px sous une hauteur fixée (742.7 px) · max-height:min(88vh, 88dvh) (design-preview.css) ; 430 : défile de 853 px sous une hauteur fixée (820.2 px) · max-height:min(88vh, 88dvh) (design-preview.css) ; 1280 : défile de 864 px sous une hauteur fixée (704 px) · max-height:min(88vh, 88dvh) (design-preview.css) | `design-preview.css` |  |
| cosmétique | Fiche d'une recette (appui long) | 2 | 320 · 390 · 1280 | `#modal div.modal-box` (3) | 320 : défile de 370 px sous une hauteur fixée (499.8 px) · max-height:min(88vh, 88dvh) (design-preview.css) ; 390 : défile de 77 px sous une hauteur fixée (742.7 px) · max-height:min(88vh, 88dvh) (design-preview.css) ; 1280 : défile de 29 px sous une hauteur fixée (704 px) · max-height:min(88vh, 88dvh) (design-preview.css) | `design-preview.css` |  |
| cosmétique | Fiche d'une ressource (appui long) | 2 | 320 · 390 · 1280 | `#modal div.modal-box` (3) | 320 : défile de 472 px sous une hauteur fixée (499.8 px) · max-height:min(88vh, 88dvh) (design-preview.css) ; 390 : défile de 68 px sous une hauteur fixée (742.7 px) · max-height:min(88vh, 88dvh) (design-preview.css) ; 1280 : défile de 29 px sous une hauteur fixée (704 px) · max-height:min(88vh, 88dvh) (design-preview.css) | `design-preview.css` |  |
| cosmétique | Mémoire des mains | 2 | 320 · 390 · 430 · 1280 | `#modal div.modal-box` (4) | 320 : défile de 549 px sous une hauteur fixée (499.8 px) · max-height:min(88vh, 88dvh) (design-preview.css) ; 390 : défile de 190 px sous une hauteur fixée (742.7 px) · max-height:min(88vh, 88dvh) (design-preview.css) ; 430 : défile de 81 px sous une hauteur fixée (820.2 px) · max-height:min(88vh, 88dvh) (design-preview.css) ; 1280 : défile de 162 px sous une hauteur fixée (704 px) · max-height:min(88vh, 88dvh) (design-preview.css) | `design-preview.css` |  |
| cosmétique | Menu · affichage | 2 | 320 | `#modal div.modal-box` | 320 : défile de 152 px sous une hauteur fixée (499.8 px) · max-height:min(88vh, 88dvh) (design-preview.css) | `design-preview.css` |  |
| cosmétique | Menu · aide | 2 | 320 | `#modal div.modal-box` | 320 : défile de 239 px sous une hauteur fixée (499.8 px) · max-height:min(88vh, 88dvh) (design-preview.css) | `design-preview.css` |  |
| cosmétique | Menu · audio | 2 | 320 | `#modal div.modal-box` | 320 : défile de 46 px sous une hauteur fixée (499.8 px) · max-height:min(88vh, 88dvh) (design-preview.css) | `design-preview.css` |  |
| cosmétique | Menu · ouverture (haut) | 2 | 320 | `#modal div.modal-box` | 320 : défile de 239 px sous une hauteur fixée (499.8 px) · max-height:min(88vh, 88dvh) (design-preview.css) | `design-preview.css` |  |
| cosmétique | Menu · jeu | 2 | 320 | `#modal div.modal-box` | 320 : défile de 180 px sous une hauteur fixée (499.8 px) · max-height:min(88vh, 88dvh) (design-preview.css) | `design-preview.css` |  |
| cosmétique | Menu · systeme | 2 | 320 | `#modal div.modal-box` | 320 : défile de 199 px sous une hauteur fixée (499.8 px) · max-height:min(88vh, 88dvh) (design-preview.css) | `design-preview.css` |  |
| cosmétique | Fenêtre d'ouverture (Ouvrir les yeux) | 2 | 320 | `#modal div.modal-box` | 320 : défile de 162 px sous une hauteur fixée (499.8 px) · max-height:min(88vh, 88dvh) (design-preview.css) | `design-preview.css` |  |
| cosmétique | Fenêtre de relève | 2 | 320 | `#modal div.modal-box` | 320 : défile de 171 px sous une hauteur fixée (499.8 px) · max-height:min(88vh, 88dvh) (design-preview.css) | `design-preview.css` |  |
| cosmétique | Terres · Gisement Noir (âge 9) | 2 | 320 · 390 · 430 · 1280 | `#dt-gisement div.terre-corps > div.terre-gisements` (4) | 320 : défile de 5 px sous une hauteur fixée (46 px) · max-height:calc(-500px + 100dvh) !important (harmonie-sobre.css) ; min-height:calc(-600px + 100dvh) (harmonie-sobre.css) ; 390 : défile de 5 px sous une hauteur fixée (46 px) · max-height:calc(-500px + 100dvh) !important (harmonie-sobre.css) ; min-height:calc(-600px + 100dvh) (harmonie-sobre.css) ; 430 : défile de 5 px sous une hauteur fixée (46 px) · max-height:calc(-500px + 100dvh) !important (harmonie-sobre.css) ; min-height:calc(-600px + 100dvh) (harmonie-sobre.css) ; 1280 : défile de 5 px sous une hauteur fixée (46 px) · max-height:calc(-500px + 100dvh) !important (harmonie-sobre.css) ; min-height:calc(-600px + 100dvh) (harmonie-sobre.css) | `harmonie-sobre.css` |  |
| cosmétique | Terres · Lisière | 2 | 320 · 390 · 430 · 1280 | `#dt-lisiere div.terre-corps > div.terre-gisements` (4) | 320 : défile de 118 px sous une hauteur fixée (68 px) · max-height:calc(-500px + 100dvh) !important (harmonie-sobre.css) ; min-height:calc(-505px + 100dvh) (harmonie-sobre.css) ; 390 : défile de 5 px sous une hauteur fixée (181 px) · max-height:calc(-500px + 100dvh) !important (harmonie-sobre.css) ; min-height:calc(-505px + 100dvh) (harmonie-sobre.css) ; 430 : défile de 5 px sous une hauteur fixée (181 px) · max-height:calc(-500px + 100dvh) !important (harmonie-sobre.css) ; min-height:calc(-505px + 100dvh) (harmonie-sobre.css) ; 1280 : défile de 5 px sous une hauteur fixée (181 px) · max-height:calc(-500px + 100dvh) !important (harmonie-sobre.css) ; min-height:calc(-505px + 100dvh) (harmonie-sobre.css) | `harmonie-sobre.css` |  |
| cosmétique | Atelier · feuille À construire | 4 | 320 · 390 · 430 · 1280 | `#v-atelier div.auto-feuille > div.auto-corps` (4) | 320 : overscroll-behavior-y: auto, défilement seul (la page derrière suit) ; 390 : overscroll-behavior-y: auto, défilement seul (la page derrière suit) ; 430 : overscroll-behavior-y: auto, défilement seul (la page derrière suit) ; 1280 : overscroll-behavior-y: auto, défilement seul (la page derrière suit) |  |  |
| cosmétique | Atelier · feuille Équipe | 4 | 320 | `#v-atelier div.auto-feuille > div.auto-corps` | 320 : overscroll-behavior-y: auto, défilement seul (la page derrière suit) |  |  |
| cosmétique | Terres · Lisière | 4 | 390 · 430 | `#dt-lisiere div.terre-corps > div.terre-gisements` (2) | 390 : overscroll-behavior-y: auto, défilement seul (la page derrière suit) ; 430 : overscroll-behavior-y: auto, défilement seul (la page derrière suit) |  |  |
| cosmétique | Atelier · feuille À construire | 5 | 320 · 390 · 430 · 1280 | `div.a-ligne-bas > div.row > span.ing.lack.link[data-need="manche"]` (119) | 320 : 9 × zone 50 × 38 px (dessin 49 × 38) ; 390 : 35 × zone 50 × 38 px (dessin 49 × 38) ; 430 : 41 × zone 50 × 38 px (dessin 49 × 38) ; 1280 : 34 × zone 50 × 38 px (dessin 49 × 38) |  |  |
| cosmétique | Atelier · feuille À construire | 5 | 320 · 390 · 430 · 1280 | `div.a-ligne-bas > div.row > span.ing.link[data-need="fibre"]` (19) | 320 : 4 × zone 56 × 38 px (dessin 55 × 38) ; 390 : 5 × zone 56 × 38 px (dessin 55 × 38) ; 430 : 5 × zone 56 × 38 px (dessin 55 × 38) ; 1280 : 5 × zone 56 × 38 px (dessin 55 × 38) |  |  |
| cosmétique | Atelier · feuille À construire | 5 | 390 · 430 · 1280 | `div.a-construire-ligne > div.row > div.grow[data-goto="cabane"]` (29) | 390 : 9 × zone 300 × 42 px (dessin 300 × 41) ; 430 : 11 × zone 340 × 42 px (dessin 340 × 41) ; 1280 : 9 × zone 1084 × 42 px (dessin 1084 × 41) |  |  |
| cosmétique | Atelier · page d'un métier | 5 | 320 · 390 · 430 · 1280 | `#v-atelier div.prod > div.subtabs > button.ico-seule.atl-retour[data-atelier-retour]` (4) | 320 : zone 44 × 40 px (dessin 44 × 40) ; 390 : zone 44 × 40 px (dessin 44 × 40) ; 430 : zone 44 × 40 px (dessin 44 × 40) ; 1280 : zone 44 × 40 px (dessin 44 × 40) |  |  |
| cosmétique | Atelier · page d'un métier | 5 | 320 · 390 · 430 · 1280 | `section.prod-fiche > div.row > span.ing.link[data-need="silex"]` (4) | 320 : zone 50 × 42 px (dessin 50 × 42) ; 390 : zone 50 × 38 px (dessin 50 × 38) ; 430 : zone 50 × 38 px (dessin 50 × 38) ; 1280 : zone 52 × 38 px (dessin 50 × 38) |  |  |
| cosmétique | Mémoire des mains | 5 | 320 · 390 · 430 · 1280 | `#modal div.modal-box > details.mem-liste > summary` (4) | 320 : zone 258 × 32 px (dessin 257 × 32) ; 390 : zone 322 × 32 px (dessin 322 × 32) ; 430 : zone 362 × 32 px (dessin 360 × 32) ; 1280 : zone 484 × 32 px (dessin 484 × 32) |  |  |
