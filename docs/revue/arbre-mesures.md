# L’arbre des connaissances : mesures

État des lieux chiffré de la vue « Arbre » du Carnet (`node tools/arbre-mesures.js --ecrire`).

Version du jeu : 0.13.2 · commit : c81b292 · date : 2026-10-24.

Les mesures sont celles de la mise en page à l’échelle 1, sans navigateur. « Nœuds par écran » compte les centres de nœuds dans une fenêtre glissée par pas de 20 px entre le premier et le dernier nœud. Les trois états : une partie neuve, `tools/fixtures/save-v5-age8-usine.json`, et une partie où toutes les recettes sont apprises (âge maximal).

<!-- mesures:debut -->
| Mesure | neuve | avancée | tout connu |
|---|---:|---:|---:|
| Nœuds (total) | 1 | 74 | 181 |
| dont allumés / vus / fantômes | 0 / 0 / 1 | 62 / 11 / 1 | 159 / 22 / 0 |
| Traits (total) | 0 | 126 | 363 |
| Traits visibles sans toucher | 0 | 84 | 239 |
| Traits cachés (sautent plus d’un âge) | 0 | 42 | 124 |
| Monde à l’échelle 1 (L × H, px) | 346 × 198 | 346 × 3090 | 346 × 5428 |
| Bandes d’âge | 2 | 9 | 13 |
| Nœuds par écran de 390×510 (min / moy / max) | 1 / 1 / 1 | 8 / 12.9 / 17 | 12 / 17.2 / 23 |
| Longueur verticale des traits (moy / max, px) | 0 / 0 | 480 / 2630 | 583 / 4214 |
| Traits droits (tous / visibles, %) | 0 / 0 | 31.7 / 34.5 | 30.9 / 33.5 |
| Traits qui traversent une bande entière (tous / visibles, %) | 0 / 0 | 33.3 / 0 | 34.2 / 0 |
| Croisements de traits visibles | 0 | 33 | 248 |
| Mise en page : graphe, à froid, à chaud (ms) | 0.5 / 1.6 / 0.01 | 0.3 / 1.2 / 0.1 | 0.3 / 0.8 / 0.13 |

Lu dans `css/arbre.css` et `js/arbre.js` :

| Valeur | Mesure |
|---|---:|
| Côté d’un nœud (`Arbre.NODE`) | 48 px |
| Police des étiquettes de nœud (`.arb-l`) | 10.5 px, sur 64 px de large |
| Police des noms d’âge (`.arb-age`) | 12 px |
| Traits (`.arb-t`) | 1.6 px, 30 % |
| Bouton du haut de l’arbre (`.arb-tete .btn`) | 44 px de haut au moins |
| Interrupteur Liste / Arbre | 44 px de haut au moins |
| Hauteur de la vue (`.arb-vue`) | écran moins l’en-tête, la barre d’onglets et 190 px de marges (300 px au moins : 300) |
<!-- mesures:fin -->

## Dans le navigateur

Chromium, sauvegarde `tools/fixtures/save-v5-age8-usine.json`, Carnet puis Arbre, à l’échelle d’ouverture (`node tools/arbre-mesures-ui.js --ecrire`).

<!-- mesures-ui:debut -->
| Mesure dans le navigateur | 390×844 | 320×568 |
|---|---:|---:|
| Surface utile de l’arbre (`.arb-vue`, px) | 538 sur 844 (63.7 %) | 300 sur 568 (52.8 %) |
| Bande libre entre l’en-tête et les onglets (px) | 728 | 407 |
| Titre, interrupteur et compteur au-dessus (px) | 44 + 44 | 44 + 44 |
| Échelle à l’ouverture | 1 | 1 |
| Nœuds entièrement dans la vue / dans l’arbre | 15 / 74 | 7 / 74 |
| Plus petite police d’étiquette, à l’écran (px) | 10.5 | 10.5 |
| Plus petite police de nom d’âge, à l’écran (px) | 12 | 12 |
| Plus petite cible (px) et laquelle | 44 (BUTTON) | 44 (BUTTON) |
| Cibles de moins de 44 px | 0 | 0 |
| Erreurs de console | 0 | 0 |
<!-- mesures-ui:fin -->

## Lecture

- L'arbre le plus dense est celui d'une partie où tout est connu : 181 nœuds, 363 traits, 248 croisements entre traits visibles. Sur la partie avancée : 74 nœuds, 126 traits, 33 croisements.
- Un trait sur trois seulement est à peu près vertical (31 à 35 %). Un trait mesure en moyenne 480 à 583 px de haut, soit autant que la fenêtre de l'arbre (538 px sur 844).
- Un trait sur trois (33 à 34 %) saute au moins deux âges : ils sont cachés tant qu'on ne touche pas un de leurs bouts (42 cachés sur la partie avancée), ce qui laisse des nœuds sans trait visible.
- À l'ouverture, 15 nœuds sur 74 sont entièrement dans la vue à 390 × 844, et 7 à 320 × 568, où la fenêtre n'a que 300 px (le plancher de `.arb-vue`) et l'en-tête passe sur deux lignes.
- Le monde complet fait 5 428 px de haut, environ dix fois la fenêtre : rien ne permet de passer d'un âge à l'autre.
- Les étiquettes (10,5 px) et les traits (1,6 px à 30 %) sont faits pour l'échelle 1 : à l'échelle 0,6, une étiquette se lit à 6,3 px.
- Au plus 159 recettes se montrent : 175 recettes au total, dont 16 secrètes que l'arbre ne dessine pas avant qu'elles soient connues.
- La mise en page prend 1 à 2 ms à froid : la vitesse ne limite pas une autre structure.

