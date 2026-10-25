# Énigmes : passe sur la langue

Cette passe étend la direction du lot pilote approuvée par l’auteur. Elle porte sur
les indices de fabrication et sur les textes par lesquels le joueur enquête : lieux,
Livre, notes, aides progressives, dialogues et fouilles. Base : version 0.15.9.

## Ce qui change

Les indices de fabrication décrivent davantage les propriétés des matériaux et les
rapports entre les pièces. Les noms déjà connus restent disponibles. Les listes
habillées de synonymes (« métal rouge », « métal doré », « cerveaux ») ne servent
plus de modèle aux énigmes. Une partie des indices courts était déjà claire et reste
en place ; leur brièveté ne suffit pas à justifier une réécriture.

Les descriptions de lieux relient les observations sans les découper systématiquement
en fragments. Les documents gardent leur support et leur auteur : les cartes décrivent
leurs dessins, les notes gardent leurs différences de voix, les inscriptions restent
des inscriptions. Les répliques du Troqueur s’appuient davantage sur ce qu’il vend,
pèse et observe, avec moins de conseils formulés comme des maximes.

Les trois niveaux d’aide sont relus ensemble. Une piste doit permettre d’avancer,
puis d’établir un lien, puis d’agir. Une aide qui suggérait d’attendre alors que le
jeu attend des interactions est corrigée. Une phrase cassée dans les fouilles répétées
est également remise en français.

## Périmètre de l’extension

| Famille | Champs réécrits après le pilote |
|---|---:|
| Indices de fabrication | 135 |
| Aides des 16 questions | 41 |
| Fragments et revisites | 21 |
| Pages du Livre : dessins et annotations | 20 |
| Feuillets et notes de nuit | 5 |
| Répliques du Troqueur | 15 |
| Textes de fouille | 21 |
| Descriptions de lieux encore inaccessibles | 8 |
| Texte d’écoute | 1 |

Ces nombres comptent les champs, pas des énigmes différentes. Une page et une note,
ou trois niveaux d’aide, peuvent contribuer à la même énigme. Les onze indices du
pilote et sa description associée s’ajoutent à cette extension.

## Vérification

La comparaison des données avant et après la passe vérifie que les différences
portent sur des textes affichés. Les recettes, quantités, conditions d’accès, coûts,
empreintes des réponses et valeurs de progression sont conservés. Les jetons de
signes et les paramètres interpolés restent dans le même ordre dans chaque texte.

Le catalogue de tests garde les correspondances entre indices et énigmes ; un repère
de formulation est adapté au nouveau texte sans retirer son contrôle. Les parcours
du récit et de ses portes vérifient que les indices restent accessibles et les énigmes
résolubles. Le contrôle mobile porte sur les fiches, le Livre, les Questions, les
fragments, les notes et les dialogues, en petit écran et en grand texte.

Ces contrôles vérifient la cohérence et le rendu. Ils ne mesurent pas la difficulté
ressentie par un joueur découvrant les énigmes. Le présent document reste sans réponses ;
les détails narratifs réservés sont conservés dans `docs/coffre/`.
