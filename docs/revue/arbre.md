# L’arbre des connaissances (0.11.0) : les textes affichés

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
