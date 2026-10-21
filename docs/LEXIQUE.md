# Lexique d’Éclat

Un mot par idée, partout : interface, tutoriel, aide, objectifs, messages.
Avant d’écrire un texte affiché, vérifier ici le mot à employer.

## Actions

| Idée | Mot | À éviter |
|---|---|---|
| Prendre une matière sur un gisement | **récolter** | ramasser, cueillir, collecter |
| Créer un objet (à la main ou par machine) | **fabriquer** | œuvrer, faire, produire, crafter |
| Trouver une recette à l’Atelier | **découvrir** | inventer |
| Mettre un extracteur sur un gisement | **poser** | installer, placer |
| Donner une recette à une machine | **mettre au travail** | nouvelle chaîne, affecter |
| Payer un passage ou un Grand Œuvre | **verser** | donner, payer |
| Laisser un Grand Œuvre puiser seul | **alimenter** | |

## Lieux et écrans

| Mot | Sens |
|---|---|
| **Réserve** | Tout ce que le joueur possède. « en réserve » (jamais « stock »). |
| **Terre** | Un lieu du monde : la Lisière, la Plaine… (jamais « zone » à l’écran). |
| **Gisement** | Une matière dans une terre. Se récolte à la main, ou par extracteur. |
| **Domaine** | L’écran de ce qui produit. |
| **Atelier** | L’écran où l’on découvre. L’**établi** y reçoit trois matières. |
| **Carnet** | Les recettes connues (deuxième page de l’Atelier). |

## Sortes d’objets

Chaque fiche affiche la sorte d’objet et une phrase qui dit à quoi elle sert (`TYPE_HINT` dans `js/ui.js`).

| Mot | Sens |
|---|---|
| **Matière** | Matière première, récoltée sur un gisement. Au pluriel, « matières » désigne aussi tout ce qu’on pose sur l’établi. |
| **Pièce** | Objet fabriqué qui sert à en fabriquer d’autres (manche, corde). |
| **Outil** | Agit dès qu’on l’a : récolte à la main plus forte, ou chemin vers une terre. |
| **Amélioration** | Agit dès qu’on l’a : extracteurs ou machines plus rapides. |
| **Station** | Reste à l’Atelier, ouvre un geste ou une chaleur. Un message de blocage la **nomme toujours** : « il faut : Four en argile (1 100 °C) ». |
| **Extracteur** | Se pose sur un gisement **de sa terre** et récolte seul. Son nom court (`sn`, `pl` dans `data.js`) sert aux boutons : « + cabane ». |
| **Machine** | Refait une recette en boucle avec la Réserve. Nom court aussi : « 2 automates de bois ». |

## Progression

| Mot | Sens |
|---|---|
| **Âge**, **étapes** | Le jeu avance d’âge en âge ; 🏁 montre les étapes (jamais « jalons » à l’écran). |
| **Objectif** | La prochaine chose à faire, en haut du Domaine. |
| **Passage** | Ce qu’il faut verser pour entrer dans une nouvelle terre. |
| **Intuition ✨** | Se gagne en découvrant ; sert à étudier une matière. |
| **Traces ✦** | Laissées par chaque passage franchi ; achètent la Mémoire des mains. |
| **Comptoir, écus** | Marché tenu par le Troqueur dans la Plaine. On y vend ce qui encombre la Réserve contre des écus, et on y achète des Traces et des matières premières. |
| **Relève** | Recommencer le monde en gardant ses recettes. Le bouton dit « Passer le relais ». |
| **Grand Œuvre** | Chantier final qui mène à une fin. |

## Chiffres

- Un débit se lit **par minute** (`perMin` dans `js/ui.js`), par heure s’il est infime. Jamais « /s ».
- Une chaleur s’écrit « 1 100 °C » (`fmtHeat`).
- Un bouton dit ce qu’il fait ou ce qu’il pose. Pas de « +1 » nu.
