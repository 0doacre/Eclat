# Renaissances, Comptoir et méta-progression

Document de conception des versions 5.4 à 5.7. Il complète `docs/PROGRESSION.md`
(passages, relève, Mémoire des mains), qui reste valable pour tout ce qu’il ne
contredit pas. Les chiffres marqués « cible » se règlent au simulateur
(`tools/sim-passages.js`), pas à l’intuition.

Décisions déjà prises :
- le Comptoir est un **marché classique**, avec une monnaie : les **écus** ;
- la **première renaissance est obligatoire** : c’est la fin du tutoriel ;
- les suivantes sont libres, mais le jeu doit rendre plusieurs renaissances
  **quasi nécessaires**.

## 1. Le constat

Simulation de la 5.3 : une seule partie de 3 h, sans relève, joueur automatique
(4 appuis/s, 20 s de réflexion par recette nouvelle).

| Passage | Minute | Durée de la terre |
|---|---|---|
| Plaine | 3 | 3 |
| Rivière | 10 | 7 |
| Collines | 19 | 9 |
| Profondeurs | 39 | 20 |
| Désert | 48 | 9 |
| Gisement Noir | 81 | 33 |
| Pics | 120 | 39 |

Une seule partie atteint les Pics en 2 h. Le temps par terre grandit à peu près
linéairement : rien n’oblige à renaître, la relève reste une option d’expert.
Et le joueur découvre tout en même temps (gestes, extracteurs, machines,
passages, étude, niveaux), ce que la relecture « joueuse occasionnelle » de la
5.3 confirme.

## 2. Le principe : un mur doux

- **Sans méta-progression**, le temps pour franchir la terre suivante **double à
  peu près** à chaque terre (cible : ×1,8 à ×2,2). On n’est jamais bloqué : on
  peut toujours insister. Mais au bout de deux ou trois terres, insister coûte des
  heures.
- **Avec la méta**, les terres déjà connues se retraversent vite, et la nouvelle
  terre redevient raisonnable.
- **Le jeu montre le calcul.** La fenêtre de relève affiche : « Prochaine terre :
  environ 45 min à ce rythme. Après une relève : environ 12 min. » C’est ce qui
  rend la renaissance évidente, sans l’imposer.

Les trois leviers, à régler ensemble :
1. le coût des passages (aujourd’hui ×4 à ×6 d’une terre à l’autre) ;
2. ce que rapporte une relève (Traces des passages + écus convertis) ;
3. la force des améliorations de la Mémoire.

## 3. Le premier parcours : une mécanique par cycle

La première heure apprend le jeu, cycle par cycle. Chaque cycle introduit une
ou deux mécaniques ; le cycle suivant les rend rapides et en ajoute une.

| Cycle | Semeur | Terres | Ce qu’on apprend | Fin du cycle | Durée cible (humain) |
|---|---|---|---|---|---|
| 1 | 7 | Lisière | récolter, Atelier, gestes, recettes, feu, cabane (première automatisation) | **renaissance obligatoire**, scène | 8–12 min |
| 2 | 8 | Lisière → Plaine | outils, exploration et histoire, niveaux, **Comptoir** | relève proposée au passage de la Rivière | 15 min |
| 3 | 9 | → Rivière | passages, chaleur et four, étude ✨, premier automate (machine) | relève proposée | 20 min |
| 4 | 10 | → Collines | métal, stations à niveaux, machines en série, Mémoire en arbre | jeu libre | 25 min |

Au bout d’une heure environ, le joueur a fait trois renaissances et vu toutes
les mécaniques de base. Ensuite, le rythme est celui du mur doux (§2).

**Ce que le cycle 1 change dans le contenu.** Aujourd’hui, le premier automate
demande une lame de pierre (silex de la Rivière) : il est hors de portée de la
Lisière. La première automatisation du cycle 1 est donc la **cabane** : « elle
récolte à ta place ». C’est elle qui déclenche la fin du cycle, après une courte
exploration du Grand Chêne qui pose l’histoire.

**Rejouer vite.** C’est le point le plus risqué : refaire la Lisière quatre fois
peut lasser. Cibles : Lisière en 3 min au cycle 2, 2 min au cycle 3, 1 min au
cycle 4. Ce qui l’accélère : le Carnet (Fabriquer, ×10, Max fabriquent les pièces),
les ruines (§4), le paquetage de la Mémoire.

## 4. Les ruines : les traces des ancêtres

Ce qu’un Semeur a construit reste dans le monde, en ruine, pour le suivant.

- À la relève, chaque extracteur et chaque machine possédés laissent une
  **ruine** dans leur terre (plafond par sorte, cible : 3 au début, plus avec la
  Mémoire).
- Au cycle suivant, une ruine se **répare** pour une fraction du prix (cible :
  10 %), sur sa ligne du Domaine : « Cabane effondrée · réparer (4 manches) ».
- Les ruines des Semeurs 1 à 6 existent aussi, dans les terres lointaines :
  des machines inconnues, rouillées, qu’on ne sait pas encore réparer. Elles
  donnent une raison de revenir, et de l’histoire.
- Diégétiquement, c’est le « tu retrouves les traces de tes ancêtres » : la
  cabane effondrée au pied du Chêne est la tienne.

Sauvegarde : `S.meta.ruins = { id: n }`, rempli par `newCycle()`.

## 5. Le Comptoir

Un marché classique : on vend ce qui encombre la Réserve contre des **écus**,
on achète avec les écus. Il s’ouvre au cycle 2, dans la Plaine.

Personnage : un vieil automate des Anciens, le **Troqueur**, qui achète tout et ne
pose pas de questions. Il ne contredit pas l’histoire (le Semeur reste le seul
humain éveillé) et il peut parler un peu de ce qu’il a vu passer.

**Vendre**
- Toute matière, pièce ou objet non unique se vend. Prix de base calculé par le
  moteur : valeur des ingrédients, plus un bonus de travail par étape de recette,
  plus un bonus d’âge. Rien à saisir à la main dans `data.js`.
- **Saturation** : plus on vend d’une même chose pendant un cycle, plus son prix
  baisse (cible : prix × 1 / (1 + vendu / 5 000 unités de base)). Vendre un million
  de bois rapporte, mais moins que vendre ce qu’on a fabriqué.
- Boutons : Vendre 10 %, Vendre la moitié, Tout sauf 100. Option « vendre
  automatiquement au-delà de N » par matière, plus tard.

**Acheter**
- **Des Traces**, à un prix qui monte à chaque achat **pendant le cycle**
  (cible : P × 1,6ᵏ, P selon l’âge atteint). C’est le lien avec la méta : on
  convertit son surplus avant de renaître.
- Des matières premières des terres ouvertes, plus chères qu’à la vente (cible : ×3).
- Plus tard : un lieu exploré tout de suite, une place de plus dans la file des
  mains.

**Les écus repartent de zéro à chaque relève.** Seules les Traces restent. Ça
crée la vraie décision du Comptoir : « je convertis maintenant, ou j’achète de
quoi aller plus loin ? »

Sauvegarde : `S.ecus` (nombre), `S.comptoir = { sold: { id: n }, traces: k }`,
remis à zéro par `newCycle()`.

Tutoriel : un chapitre « Le Comptoir » à son ouverture (vendre une fois, voir le
prix baisser, acheter une Trace).

## 6. La méta, plus dense

La Mémoire des mains devient un **arbre** en branches, qui se découvre de
renaissance en renaissance (c’est la « découverte de la méta entre deux
renaissances ») :

| Branche | S’ouvre | Exemples |
|---|---|---|
| Mains | cycle 2 | récolte à la main, gestes plus rapides, place de plus dans la file |
| Gisements | cycle 2 | extracteurs plus forts, **ruines** plus nombreuses et moins chères à réparer |
| Commerce | cycle 3 | meilleurs prix au Comptoir, saturation plus lente, Traces moins chères |
| Rouages | cycle 3 | machines plus rapides, départ avec un automate réparé |
| Chemins | cycle 4 | passages moins chers, terres déjà ouvertes, hors ligne plus long |

Les huit améliorations actuelles s’y rangent sans changer de niveau ni de prix :
aucune partie ne perd ce qu’elle a acheté.

À chaque relève, la fenêtre montre ce qui vient de s’ouvrir (« Nouvelle branche :
Commerce »).

## 7. L’histoire à chaque renaissance

- Chaque cycle du premier parcours a sa scène d’éveil : le Semeur 8 trouve la
  cabane effondrée du 7, le 9 trouve un message gravé par le 8, etc.
- La capsule « Fais confiance à tes mains » existe déjà : elle devient le
  fil rouge (un message de plus par cycle, enregistré par le Semeur précédent).
- **Énigmes entre cycles** : un code ou un air trouvé dans un cycle ne sert
  qu’au cycle suivant. Exemple : le Semeur 8 trouve un code gravé sur une ruine,
  le 9 l’utilise sur un mécanisme du Tumulus.
- Les ruines des Semeurs 1 à 6 racontent pourquoi ils ont échoué, une ruine à
  la fois.

## 8. Les parties existantes

- Les nouvelles règles du premier parcours (renaissance obligatoire, cycles
  guidés) ne s’appliquent qu’aux **nouvelles parties** : `freshState()` pose
  `S.flags.parcours = 1`. Une sauvegarde sans ce drapeau n’est jamais forcée à
  renaître.
- Le Comptoir, les ruines et l’arbre de la Mémoire arrivent pour tout le monde.
  Les ruines d’une partie en cours apparaîtront à sa prochaine relève.
- Les champs nouveaux (`ecus`, `comptoir`, `meta.ruins`) ont une valeur par
  défaut : pas de changement de version de sauvegarde. Copie de sécurité avant
  la mise à jour, comme toujours.
- Le rééquilibrage des passages (§2) rend les parties en cours plus lentes sur
  les terres non encore ouvertes. Les terres déjà ouvertes le restent.

## 9. Validation au simulateur

Le simulateur apprend à : faire la renaissance obligatoire, réparer les ruines,
vendre au Comptoir et convertir en Traces, acheter dans l’arbre. Cibles à tenir :

| Mesure | Cible |
|---|---|
| Cycle 1 (humain, réflexion 30 s par recette) | 8–12 min |
| Lisière rejouée au cycle 2 / 3 / 4 | ≤ 3 / 2 / 1 min |
| Fin du cycle 4 | 60–80 min de jeu cumulé |
| Temps par terre nouvelle, sans relève | ×1,8 à ×2,2 d’une terre à l’autre |
| Gain d’une relève au mur | la terre suivante 3 à 4 fois plus vite |
| Part des Traces venant du Comptoir | 20 à 35 % |

## 10. Découpage

1. **5.4 : le Comptoir.** Fait.
2. (5.5 : machines à paliers et onglet Machines, hors de ce document. Fait.)
3. **5.6 : le premier parcours.** Renaissance obligatoire du cycle 1, ruines, scènes
   d’éveil. Le réglage des passages au mur doux (§2) se fait juste après, au
   simulateur.
4. **5.7 : la méta en arbre.** Branches, projection « avant / après relève »,
   énigmes entre cycles, ruines des Semeurs 1 à 6.

## 11. Questions ouvertes

- Le Troqueur : un automate des Anciens (proposé), ou un marchand humain malgré
  l’histoire ?
- Les écus remis à zéro à chaque relève (proposé), ou une petite part gardée ?
- La fin du cycle 1 : à la cabane posée (proposé), ou faut-il avancer un premier
  automate dans la Lisière ?
