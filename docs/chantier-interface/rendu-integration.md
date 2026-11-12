# Intégration · recette de T1 à T5, corrections, version 0.67.0

**État** : fait. Branche `chantier/integration-0-67`, fusionnée dans `claude/sobriete-coherence`. Rien n'est parti sur `alpha` ni sur `main`.

## Recette des cinq tâches

Les cinq branches étaient déjà fusionnées. `npm test` vert, aucun défilement de page sur les Terres, l'Étude, l'Atelier et les fiches aux cinq tailles : les comptes rendus disent vrai. Les compteurs de `!important` n'ont pas monté (107 et 148). Un écart au périmètre : T4 a rangé ses règles dans `css/sobriete.css` et pas dans `css/labo.css`, sans dégât.

Ce que les captures ont montré, et qui est corrigé ici :

| Défaut | Cause | Correction |
|---|---|---|
| Bande grise au-dessus des onglets, feuilles qui s'arrêtent 16 px trop haut | `--nav` valait 72 px pour une barre de 56 px | `--nav` suit la barre : 16 px rendus à chaque vue |
| Fiche presque vide à 320 × 568 (150 px pour le contenu) | épingles sur leur propre ligne, pied sur trois rangées | épingles dans la rangée des pages, pied sur une ligne, un seul bouton principal |
| Page d'un métier creuse sur grand téléphone, rangée de raccourcis flottante | le milieu prenait la place sans rien y mettre | l'objet choisi en médaillon, une seule barre d'actions |
| Quantités cachées à 320 × 568 sur la page d'un métier | milieu de 97 px pour une fiche de 162 px | la rangée de raccourcis rend sa place : plus de défilement |
| Derniers métiers coupés et inatteignables en partie avancée | `.atel-liste` en `overflow: hidden` | la liste glisse dans son cadre |
| Une liste revenait en haut après chaque appui | la vue est redessinée en entier | les cadres qui glissent gardent leur place (`js/ui.js`) |
| Carnet et Journal défilaient en entier (888 px à 320 × 568) | aucune tâche ne les couvrait | onglets, recherche et âges fixes, la liste glisse |
| Terres à 320 px : l'extracteur passait sous l'icône du gisement | ligne trop large de 2 px | la ligne tient sur une rangée |
| « Fermer » en mot sur deux feuilles, en croix sur les deux autres | | la croix partout |

## Ce qui change pour le joueur

Plus aucune vue ne défile : chaque écran est un cadre fixe, avec ses actions en bas. À l'Atelier, l'objet à fabriquer est posé en grand sur l'établi et il réagit quand on appuie sur Fabriquer.

## Mesures (défilement de la page, puis de la zone du milieu)

| Écran | 320 × 568 | 360 × 640 | 390 × 700 | 390 × 844 | 430 × 932 |
|---|---|---|---|---|---|
| Page d'un métier, avant | 0, milieu 76 | 0, milieu 8 | 0, 0 | 0, 0 | 0, 0 |
| Page d'un métier, après | 0, 0 | 0, 0 | 0, 0 | 0, 0 | 0, 0 |
| Carnet, avant | 888 | | 701 | 557 | |
| Carnet, après | 0 | 0 | 0 | 0 | 0 |
| Fiche du Manche, page Objet, avant | 321 | | 43 | 0 | |
| Fiche du Manche, page Objet, après | 167 | | 0 | 0 | |

## Tests

- `npm test` : vert en 0.67.0.
- `node tools/test-ecrans-fixes-ui.js` (nouveau) : « 146 contrôles des écrans fixes (métier, Carnet, listes) réussis. » Lancé sur la branche d'avant, il échoue dès le premier contrôle.
- `npm run test:ui` (nouveau, tous les tests de navigateur) : 20 verts et 16 rouges sur 36. Les 16 rouges sont les mêmes qu'avant l'intégration, lancés sur une copie de la branche de départ : ce sont des tests qui décrivent une interface plus ancienne (liste et première erreur dans `T6-tests.md`). `test-fiches-ui` : « 1142 contrôles », `test-terres-fixe-ui` : « 264 contrôles », `test-etude-fixe-ui` : « 124 contrôles », `test-ux` : « 66 contrôles ».
- Essai sur un vrai téléphone : non fait.

## Ce que je n'ai pas vérifié

Le toucher réel, Safari, les encoches, le clavier virtuel, Grand texte et le thème sombre. Sur grand écran, seules la page d'un métier et le Journal ont été regardés.

## Choix qui reviennent au porteur

- **Le médaillon de l'objet** sur la page d'un métier : `captures/integration/usine-metier.jpg`. Il s'efface quand il reste moins de 96 px de haut.
- **Le pied de fiche en icônes** sur téléphone (Carnet et Progression sans leur mot, le nom reste pour les lecteurs d'écran) : `captures/integration/usine-fiche-manche.jpg`.
- **Les icônes des gisements** passent de 54 à 46 px pour rester dans leur ligne.
- **Le bouton « Machines »** de la barre d'actions est retiré : il existe déjà dans la plaque du métier, en haut.
- **Le fond de l'Atelier** est recadré sur téléphone pour cacher la marge de papier de l'aquarelle.
