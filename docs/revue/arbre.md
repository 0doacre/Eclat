# L’arbre des connaissances (0.11.0) : les textes affichés

> Document historique des vues 0.11 à 0.15. La présentation actuelle est décrite
> dans [Arbre : lecture verticale sur téléphone](arbre-vertical.md).

Ce que la joueuse lit, tel quel, à relire. Une ligne par texte, avec l’endroit où il apparaît.
`{n}` est remplacé par le jeu. Les noms des âges et des objets viennent des données, rien de neuf.

## Carnet, en haut

| Texte | Où |
|---|---|
| Liste | L’interrupteur en haut du Carnet (`js/atelier.js`, `arbreBascule`). |
| Arbre | Le même interrupteur. |
| Affichage du Carnet | Le nom du groupe de l’interrupteur, lu par un lecteur d’écran seulement. |

## Vue Arbre

| Texte | Où |
|---|---|
| {n} recettes trouvées / 1 recette trouvée | Le compteur au-dessus de l’arbre, sans total (`arbreHTML`). |
| Aucune recette trouvée pour l’instant | Le même compteur, à zéro. |
| − | Bouton pour voir de plus loin ; lecteur d’écran : « Éloigner ». |
| + | Bouton pour voir de plus près ; lecteur d’écran : « Rapprocher ». |
| Centrer | Bouton qui ramène la vue sur l’objectif ou la dernière découverte. |
| Recette pas encore trouvée | Le nom d’une case vide (fantôme), lu par un lecteur d’écran seulement. |
| Pas encore trouvée. Essaie avec ce qui est autour. | Le petit message quand on touche une case vide. |
| ✦ {n} | La pastille d’une ressource étudiée : le nombre de cases vides qui en partent. |
| {numéro} · {nom de l’âge} | L’étiquette de chaque bande d’âge, en haut à gauche et en bas à droite. Un âge encore lointain n’a que son numéro. |

## Nouveautés (`D.CHANGES`)

| Texte | Où |
|---|---|
| 🌳 Le Carnet a maintenant un Arbre : touche « Arbre » en haut du Carnet. Tes recettes trouvées s’y relient à leurs ressources, âge par âge. | Fenêtre des nouveautés. |
| 👆 Glisse pour te déplacer, pince ou touche + et − pour voir de plus près. Touche une case pour ouvrir sa fiche. | Fenêtre des nouveautés. |
| ✦ Les cases vides en pointillé sont des recettes pas encore trouvées : celle de ton objectif, et celles que cachent les ressources que tu as étudiées. | Fenêtre des nouveautés. |

## 0.14.0 : l’arbre en plein écran

Textes ajoutés ou changés, un par ligne, avec l’endroit (`js/atelier.js` sauf mention).

| Texte | Où |
|---|---|
| Arbre des connaissances | Nom accessible de la vue plein écran (`ARB_TXT.plein`). |
| Fermer l’arbre | Nom accessible du bouton ← de la barre du haut. |
| {n} recette(s) trouvée(s) · Aucune recette trouvée pour l’instant | Compteur de la barre du haut. Jamais de total. Le mot « recettes trouvées » disparaît sous 360 px de large, le nombre reste. |
| Éloigner · Rapprocher | Noms accessibles de − et +. |
| Centrer | Bouton de la barre : revient sur l’objectif, ou la dernière découverte. |
| ? · Légende | Bouton de la légende (nom accessible « Légende »). |
| Une recette trouvée. · Une matière que tu as déjà vue. · Une recette pas encore trouvée. · Ton objectif. · Un trait qui saute des âges : touche une case pour le voir. | Les cinq lignes de la légende, chacune avec le vrai symbole (mêmes classes CSS que l’arbre). |
| Aller à un âge | Nom accessible de la colonne des âges, à droite. |
| {nom de l’âge} | Nom accessible de chacun des 13 repères de la colonne (« Âge de l’Acier »…). Pendant le glissement, une pastille écrit « {numéro} · {nom} ». |
| {numéro} · {nom de l’âge} · {n} recette(s) trouvée(s) | Une bande du niveau de loin. Un âge sans recette trouvée n’écrit pas de compte. |
| Âges {de} à {a} · encore loin | La dernière ligne du niveau de loin, pour les âges au-delà de l’âge atteint plus un. |
| 🌳 Voir dans l’arbre | Bouton de la fiche d’un objet (fenêtre de `goto`), seulement pour un objet dont tu connais la recette. |
| 🌳 Dans l’arbre (et « Voir ton objectif dans l’arbre » en info-bulle) | Puce de la carte d’objectif du Domaine (`js/quetes.js`), pour un objectif de fabrication. |
| 🌳 L’arbre prend tout l’écran : une barre fine en haut, et le reste pour l’arbre. Un bouton « Voir dans l’arbre » sur la fiche d’un objet, et « Dans l’arbre » sur ton objectif, t’y emmènent tout droit. | Nouveautés (`D.CHANGES`). |
| 📜 Une colonne d’âges sur le bord de l’écran : touche un âge, ou glisse le doigt dessus, et l’arbre s’y rend. | Nouveautés. |
| 🔍 De plus loin, l’arbre se lit par âge : le nom de chaque âge et le nombre de recettes que tu y as trouvées. De plus près, les noms et les traits sont plus gros. | Nouveautés. |

### Mesures, avant et après

Chromium, sauvegarde `tools/fixtures/save-v5-age8-usine.json`, à l’échelle d’ouverture (`node tools/arbre-mesures-ui.js`). « Avant » vient de `docs/revue/arbre-mesures.md`.

| Mesure | 390×844 avant | 390×844 après | 320×568 avant | 320×568 après |
|---|---:|---:|---:|---:|
| Surface utile de l’arbre (px) | 538 | 799 | 300 | 523 |
| Barre au-dessus de l’arbre (px) | 44 + 44 | 45 | 44 + 44 | 45 |
| Nœuds entièrement dans la vue | 15 | 20 | 7 | 13 |
| Plus petite étiquette, à l’écran (px) | 10,5 | 11,5 | 10,5 | 11,5 |
| Plus petit nom d’âge, à l’écran (px) | 12 | 13 | 12 | 13 |
| Plus petite cible de la barre (px) | 44 | 44 | 44 | 44 |
| Erreurs de console | 0 | 0 | 0 | 0 |

### Choix faits

- **Fermer** revient au Carnet en liste : l’arbre n’est plus une vue du Carnet, l’interrupteur « Arbre » ouvre la vue plein écran, « Liste » est le Carnet lui-même (`U.carnetVue` vaut toujours « liste »).
- **Seuils du zoom** (`ARB_LOIN` 0,5 et `ARB_PRES` 1) : à 0,5 un nœud de 48 px mesure 24 px, un nom ne tient plus sous l’icône ; sous 1, les étiquettes de 11,5 px seraient réduites sous 11 px à l’écran. Le niveau de loin tombe à l’échelle 0,3, le milieu à 0,7 ; la molette et le pincement restent continus.
- **Niveau de loin** : un calque HTML à part (`.arb-loin`), pas des étiquettes à contre-échelle. Le texte reste net à 12 px et plus, quelle que soit l’échelle du monde, et les 13 âges tiennent sans défilement.
- **Étiquettes du niveau du milieu** : seulement l’objectif et les carrefours (objets qui entrent dans au moins 4 recettes, calculés sur `D.ITEMS`, indépendants de la partie).
- **Geste « retour » du téléphone** : non branché. Le jeu n’utilise pas `history`, et en ajouter un pour cette seule vue changerait le comportement du retour partout ailleurs. Échap ferme, et le focus revient au bouton qui a ouvert.
- **Échap** est écouté sur le document tant que la vue est ouverte : quand on touche une bande, le bouton touché se cache et le focus tombe sur la page, ce que `test:ux` a montré.
