# Les fenêtres automatiques et le retour d'absence (0.13.3)

## Textes ajoutés

| Texte | Où |
|---|---|
| Pendant ton absence : +{quantité} {objet}, +{quantité} {objet} | Message discret (toast, clé `absence`) quand l'absence dure de 60 secondes à moins de 5 minutes et qu'il y a eu des gains : les deux plus grands (`js/ecouteurs.js`, évènement `offline`). |
| Ton exploration est terminée. | Message discret (clé `absence-exp`), même cas, quand une exploration s'est terminée pendant l'absence. |
| ⏳ Revenir après moins de cinq minutes n'ouvre plus de fenêtre : un petit message dit ce qui a été récolté. Au lancement, les fenêtres passent une à une, et le guide attend qu'elles soient fermées. | Une ligne de plus dans `D.CHANGES` (fenêtre des nouveautés). |

## Ce qui change

- **Retour d'absence** : sous 60 secondes, rien ; de 60 secondes à 5 minutes (300 s), un message discret ; à partir de 5 minutes, la fenêtre « Bon retour ! ». Les seuils sont `ABSENCE_MESSAGE` et `ABSENCE_FENETRE`, en tête de `js/ecouteurs.js`. La règle d'avant sur les absences sans gain (rien de dit sous 10 minutes) reste.
- **Une fenêtre automatique à la fois, par priorité** (`js/fenetres.js`) : sauvegarde illisible, présentation, nouveautés, retour d'absence. Une pause de 250 ms sépare deux fenêtres. Une même fenêtre n'attend jamais deux fois.
- **Le guide (les bulles de tutoriel) attend** : tant qu'une fenêtre automatique est en attente, aucune bulle ne se montre, qu'un chapitre soit commencé ou non ; à l'ouverture d'une fenêtre, la bulle se retire tout de suite (avant, elle restait jusqu'au pas de temps suivant, 250 ms).
- **La bulle reste dans la bande libre** entre l'en-tête et la barre d'onglets, quand la bande peut la contenir.

## Inventaire des fenêtres

Fenêtres que **le joueur ouvre d'un appui** (elles s'ouvrent tout de suite, comme avant) : le menu, les comptes, les sauvegardes, les crédits, l'aide, la remise à zéro, la Mémoire, les dons, les fiches et listes (`js/atelier.js`, `js/carte.js`, `js/compte.js`, `js/domaine.js`, `js/journal.js`, `js/quetes.js`, `js/memoire.js`), la confirmation de relève, le Comptoir et le Troqueur.

Fenêtres que **le jeu ouvre tout seul** :

- **Au lancement, dans la file** : sauvegarde illisible (`showBadSave`), présentation (`intro`), nouveautés d'une version (`showNews`), retour d'absence (`showOffline`, aussi quand le jeu revient au premier plan).
- **À la suite d'un évènement du moteur, sans passer par la file** (`js/ecouteurs.js`, `js/memoire.js`) : la carte d'un nouvel âge, la première Trace, une réminiscence, un secret découvert, la fin d'une exploration ou d'une fouille, le poste radio, le traducteur, les fins. Elles passent par la file ordinaire d'`openModal` (une à la fois, dans l'ordre d'arrivée). Elles suivent un geste ou une durée écoulée, et peuvent arriver en nombre au retour d'une très longue absence : le lot suivant pourra les ranger elles aussi.

## Le défaut des onglets pendant une bulle

Observé à la main : avec la bulle « Un morceau d'histoire » affichée, un appui sur l'onglet Carnet n'a rien fait. **Je n'ai pas pu le reproduire** dans Chromium (390 × 844 et 320 × 568, toucher et souris, son activé ou non) : les cinq onglets répondent pendant la bulle, et le test de `tools/test-ux.js` le vérifie. Le projecteur a `pointer-events: none` et la bulle ne recouvre pas la barre dans les cas essayés ; la cause de l'observation reste inconnue (peut-être un appui reçu pendant la fermeture d'une fenêtre : la barre est inerte tant qu'une fenêtre est ouverte). Les garde-fous ajoutés (la bulle dans la bande libre, le guide qui attend les fenêtres, le test) évitent au moins les cas où elle serait en cause.
