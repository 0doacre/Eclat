# Le début de partie (0.10) : les textes affichés

Ce que la joueuse lit, tel quel, à relire. Une ligne par texte, avec l’endroit où il apparaît.
Les textes du récit (fragments, Livre, signes, fins) ne sont pas ici.

## 1. Les premiers objectifs (`D.OBJECTIVES`, carte « Scénario » en haut du Domaine)

| Texte | Où |
|---|---|
| Récolte du bois, puis taille un manche à l’Atelier. | Premier objectif. |
| Tresse des fibres pour faire une corde. | Deuxième. |
| Explore le Grand Chêne depuis la Lisière. L’exploration avance seule. | Troisième (nouvel ordre : l’exploration arrive avant le feu). |
| La nuit tombe. Construis un feu de camp : il débloque Chauffer. | Quatrième. |
| Une cabane posée sur un gisement récolte à ta place. | Cinquième. |
| Dans le Domaine, touche « + cabane » sur le bois : elle récolte même quand le jeu est fermé. | Étape clé du même objectif. |
| L’épieu ouvre le chemin vers la Plaine. | Sixième. |
| Apporte les matières du passage, en plusieurs fois si besoin. | Étape clé du passage vers la Plaine. |
| Découpe une peau en bandes. | Septième. |
| Explore le Champ des Os, au milieu de la Plaine. | Huitième. |
| Pour coudre une peau, il faut une aiguille. | Neuvième. |
| Des collets dans la Plaine récoltent os et peaux sans toi. | Dixième. |
| Une outre pour porter de l’eau jusqu’à la Rivière. | Onzième. |
| Apporte les matières de la passerelle. | Étape clé du passage vers la Rivière. |

## 2. La fenêtre d’un passage (`js/quetes.js`, en bas du Domaine)

| Texte | Où |
|---|---|
| Il reste 2 lieux à explorer dans La Lisière. | Sous la barre du passage, tant qu’il manque des lieux. |
| Explorer | Bouton qui lance l’exploration du premier lieu manquant. |
| 🧭 En route… | À la place du bouton pendant l’exploration. |
| Le Grand Chêne · 0 sur 2 | Nom du prochain lieu et avancement (lieux faits sur le total). |
| Il reste un lieu à explorer dans La Lisière avant ce passage. | Message en bas, si on essaie de déposer avant. |
| Il reste 2 lieux à explorer dans La Lisière avant ce passage. | Le même, au pluriel. |

## 3. La relève, avant (`js/memoire.js`, fenêtre « Éveiller le Semeur N ? »)

| Texte | Où |
|---|---|
| Le Semeur 8 s’éveille à la Lisière. Il retrouve ton Carnet, ton Journal et la Mémoire des mains. | Sous le titre. |
| Conservé | En-tête de la première colonne. |
| 62 recettes au Carnet | Ligne de la colonne « Conservé ». |
| 19 ✦ Traces à dépenser dans la Mémoire des mains | Idem. |
| Le Journal : 9 morceaux d’histoire | Idem (la page n’apparaît que si elle existe). |
| 3 signes compris | Idem, s’il y en a. |
| 5 niveaux de la Mémoire des mains | Idem, s’il y en a. |
| 2 Échos : +100 % de récolte et de production | Idem, s’il y en a. |
| Remis à zéro | En-tête de la seconde colonne. |
| La Réserve, ses 20 extracteurs et 10 machines | Ligne de la colonne « Remis à zéro ». |
| Les terres : retour à la Lisière | Idem. |
| Le passage vers La Plaine des Hautes Herbes, payé à 40 % | Idem, s’il y a un passage commencé. |
| Les 3 commandes en cours | Idem, s’il y en a. |
| La relève donne +18 ✦ Traces, à dépenser dans la Mémoire des mains. | Sous les colonnes. |
| La relève donne +18 ✦ Traces (400 écus en font 4), à dépenser dans la Mémoire des mains. | Le même, quand des écus se convertissent. |
| Aucune recette à retrouver : le Carnet est complet. | Dernière ligne, s’il y a au moins une recette. |

## 4. La relève, après (`js/memoire.js`, carte de l’éveil)

| Texte | Où |
|---|---|
| Semeur 8 | Petit titre. |
| Tu te réveilles à la Lisière | Titre de la carte. |
| Le Carnet garde tes 62 recettes. | Première ligne. |
| Des ruines t’attendent : les réparer coûte presque rien. | Deuxième ligne, s’il y a des ruines. |
| Tes 19 ✦ Traces sont dans la Mémoire des mains. | Troisième ligne, s’il y a des Traces. |
| Commencer | Seul bouton. |

## 5. Le guide (`js/tuto.js`)

| Texte | Où |
|---|---|
| La relève recommence le monde en gardant ce que tu sais. Touche ✦ pour voir les chiffres. | Bulle du chapitre « La relève », montrée une fois, au cycle 1, quand la relève est possible. |

## 6. Les changements annoncés (`D.CHANGES`, fenêtre « Quoi de neuf »)

| Texte | Où |
|---|---|
| 🌱 Les premières terres prennent plus de temps : avant d’ouvrir un passage, il faut avoir exploré les lieux de la terre où tu es. | Fenêtre des nouveautés. |
| 🧭 La fenêtre d’un passage dit alors ce qu’il reste à explorer, avec un bouton pour lancer l’exploration. | Idem. |
| ✨ Des retours discrets quand une chose réussit : une étincelle au thermomètre quand il passe à « brûlant », la nouvelle terre qui s’allume, la pastille d’Intuition qui apparaît. | Idem. |
| ✦ Avant la relève, une liste dit ce qui est conservé et ce qui est remis à zéro, avec les Traces gagnées ; au réveil, la partie commence par ce que le Semeur retrouve. | Idem. |
| 🔇 Moins de choses d’un coup au début : les Quêtes et le compteur d’étapes arrivent avec le premier âge, et les messages s’espacent. | Idem. |

## 7. Les bulles du guide et l’établi, réécrites (passe de style)

| Texte | Où |
|---|---|
| Je peux te guider pour tes premiers objets. Le guide se coupe dans le menu, quand tu veux. | Bulle « Bienvenue », avant le premier geste. |
| Tu as de quoi tailler. Ouvre l’Atelier. | Bulle, après la première récolte de bois. |
| Chaque recette demande une action et des matières. Tu as trois actions au départ : Tailler, Tresser et Assembler. Tailler est déjà sélectionnée. | Bulle, dans l’Atelier. |
| Touche le gros bouton pour fabriquer. | Bulle, devant le bouton. |
| Tu as fabriqué un manche. Sa recette s’ajoute à ton Carnet. Tu ne peux fabriquer qu’un objet à la fois. | Bulle, après la première fabrication. |
| L’objectif, en haut, dit quelle recette chercher. Le 🏁 montre les étapes de cet âge. | Bulle, de retour au Domaine. |
| Bien joué. L’objectif dit la suite ; le ❓ explique le reste. | Bulle, fin du chapitre. |
| Ce que tu viens de lire rejoint le Journal. Tu n’as pas à tout comprendre tout de suite. | Bulle, à la première lecture d’un morceau d’histoire. |
| L’Intuition ✨ vient quand tu découvres quelque chose. Elle paie l’étude des ressources et le déchiffrage des recettes. | Bulle, au premier gain d’Intuition. |
| Ta cabane récolte à ta place, même quand le jeu est fermé. Touche « + cabane » sur le bois pour la poser. / Sa récolte va directement dans ta Réserve. Le bouton sert aussi pour les cabanes d’après. S’il ne t’en reste plus, tes mains en fabriquent une, puis la posent. | Chapitre « Ta première cabane ». |
| 🚧 Derrière ce passage, une autre terre. Avant de l’ouvrir, explore les lieux de celle où tu es ; ensuite, apporte les matières. | Chapitre « Un passage ». |
| Explore, récolte, fabrique, puis reviens déposer les matières. Chaque passage franchi te donne des ✦ Traces. Elles paieront la Mémoire des mains du prochain Semeur. | Chapitre « Un passage », 2ᵉ étape. |
| Tes commandes en cours sont là, au-dessus des onglets. Touche la barre pour les voir ou en annuler une. | Chapitre « Tes mains ». |
| Choisis une action, pose jusqu’à trois matières, puis touche le gros bouton. Le thermomètre dit si tu t’approches d’une recette. | Établi, avant la première tentative. |
| ✋ Tes mains s’y mettent. La recette attend dans tes commandes. | Établi, quand une recette part en fabrication. |
| Tu as tout ce qu’il faut. Il te faut : | Établi, avant de fabriquer une recette connue. |
| Le thermomètre dit si tu t’approches. | Bulle du nouvel objectif (la corde). |
| Compris : partout où ce signe apparaît, il se lit désormais en mot. Les autres se trouvent dans le Journal, onglet Signes. | Bulle, après le premier signe compris. |
| Une ressource étudiée porte un ✦ quand elle réagit avec l’action choisie. À toi de trouver la bonne combinaison. | Bulle, après la première étude de ressource. |
| 🎯 Suivre montre ce qui manque en haut du Domaine. | Conseil du Carnet, et aide du menu (❓). |
| Tant que tu ne l’as pas compris, il reste dessiné. | Aide du menu (❓), entrée « Signe ». |

## 8. Carnet et Machines (passe de style, hors début de partie)

| Texte | Où |
|---|---|
| Voir les 12 objets déjà possédés / Cacher les objets déjà possédés | Bas du Carnet, pour montrer ou cacher les pièces uniques déjà construites. |
| Construits : 3 | Carnet, sous un extracteur ou une machine (avant : « Possédés : 3 »). |
| Tes machines | Machines, titre de la liste des machines en ta possession. |
| Tu n’as pas encore de machine. La première se découvre à l’Atelier : l’automate de bois. | Machines, tant qu’il n’y en a aucune. |
| Tes mains sont occupées : 4 commandes au maximum. | Message en bas, si les commandes sont déjà au complet (avant : « File pleine : 4 commandes en attente au maximum »). |
| Tailler est déjà choisie. | Bulle du premier passage à l’Atelier (avant : « déjà sélectionnée »). |
| Tu en as 12 | Fiche d’un objet : ce que tu as dans la Réserve (avant : « Disponible : 12 »). |
| attend une main ou une machine | Fenêtre des commandes, pour une commande que personne ne peut encore faire (avant : « en attente »). |
| … : au repos, jusqu’à ta prochaine commande. | Message en bas, quand une machine n’a plus de travail. |

## 9. Le vocabulaire des commandes, partout

Quatre mots, et rien d’autre à l’écran : **tes mains**, une **commande**, **en cours**, **au repos** (la règle est écrite dans `docs/LEXIQUE.md`, section « Tes mains et tes machines »).

| Texte retenu | Où | Avant |
|---|---|---|
| Tes mains sont occupées. Attends la fin de la commande en cours. | Atelier et Domaine, quand une commande ne peut pas partir | « Tes mains sont déjà bien occupées. Attends qu’une fabrication se termine. » |
| Tes mains sont occupées : 4 commandes au maximum. | Message en bas, commandes au complet | « Tes mains sont pleines : … » |
| Déjà en cours. | Atelier, fiche d’un objet déjà lancé | « Déjà en cours de fabrication. » |
| ✋ Tes mains s’y mettent. La recette est dans tes commandes. | Fiche d’un objet qu’on vient de lancer | « … La recette attend dans tes commandes. » : « attendre » veut maintenant dire que personne ne peut avancer |
| ✋ En cours : planche · ✋ En cours… | Quêtes et Domaine, objet en cours | « ✋ En cours de fabrication » |
| Tu en as 12 · 3 en cours | Domaine, ligne d’un gisement | « 3 en fabrication » |
| attend une main ou une machine | Barre ✋ au-dessus des onglets, et carte d’une commande dans Machines | « il manque des ressources », faux quand une machine libre existe ; « En attente… » |
| Commande · Manche ×30 · 4 automates de bois | Barre ✋ au-dessus des onglets, nom de la commande en tête | « Fabrication · … » |
| fini dans ~4 s · Fini dans ~2 min | Fenêtre des commandes, une commande et le lot | « prête dans ~ » / « prêt dans » / « Fini dans ~ » |
| Tes mains s’y mettent. Fini dans 4 s. | Résultat d’un essai à l’Atelier | « Prêt dans 4 s. » |
| Tout ce que tu fabriques passe par tes commandes | Aide du compte | « la file des commandes » |
| elles sont au repos et aident tes commandes | Aide du compte, machines | « elles attendent au repos » |
| Elle est au repos, dans l’onglet Machines. | Réparation d’une machine | « Elle attend au repos » |
| Machine : au repos, jusqu’à ta prochaine commande. | Machines, réglage d’une machine | inchangé (l’« au repos » y prend trois mots de plus) |
| Aucune demande pour l’instant. Le Troqueur en prépare d’autres. | Quêtes du Troqueur | « Aucune commande… » : le mot « commande » pour une demande |
| Établi : pose jusqu’à trois ressources | Bulle du guide | « trois matières » |
| apporte les ressources du passage / nécessaires | Objectifs, guide, message de passage | « les matières », mot banni à l’écran par le lexique |

## Ce qui n’apparaît plus au début

| Élément | Quand il apparaît maintenant |
|---|---|
| Pastille « 📜 Quêtes » du haut | Au premier âge, ou dès qu’une quête est prête. |
| Compteur d’étapes « 0/5 » et sa barre | Au premier âge, ou dès la première étape faite. |
| Bouton « Vue dense » du Domaine | À partir de deux terres ouvertes. |
| Messages en rafale | Un toutes les 800 ms au plus ; deux au plus attendent leur tour. |
