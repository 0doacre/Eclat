# Audit de la langue des énigmes d’Éclat

25 octobre 2026 · version 0.15.8 · état audité : `8ebfd3505502eb1bbf1bd7e725cc6925a7906521`.

Audit documentaire et éditorial. Aucun texte de jeu, indice, mécanisme ou coût modifié.
Les exemples ci-dessous concernent les recettes ordinaires ; les solutions des secrets
et les révélations du récit ne sont pas reproduites.

## 1. Avis sur le diagnostic de départ

Le reproche d’un « agrégat de stéréotypes et de phrases IA » décrit un effet de lecture
réel : des procédés censés donner du caractère deviennent des automatismes. Le texte
alterne recettes paraphrasées, petites maximes, personnifications et fragments mystérieux.
Ces procédés ne composent pas encore une voix suffisamment maîtrisée.

Il serait néanmoins excessif de conclure qu’Éclat n’a aucune voix. Les gestes, la
transformation des matériaux et les traces de ceux qui ont précédé le joueur forment
déjà un terrain singulier. Plusieurs indices sont simples, précis et évocateurs.
L’enjeu est de sélectionner et de développer cette matière, plutôt que d’ajouter une
nouvelle couche de style « jeu à énigmes ».

« IA slop » est ici un jugement éditorial, pas un diagnostic de provenance. La syntaxe
ou les répétitions ne permettent pas d’établir qui a écrit une phrase. Les défauts
observables sont décrits ci-dessous sans supposer leur origine.

## 2. Corpus et limites

Lecture de l’ensemble des 163 champs `h` des objets à recette dans `js/data.js`, des
16 Questions et de leurs 48 aides dans `js/recit.js`, des 10 descriptions `hidden` des
lieux dans `js/data.js`, des 32 pages du Livre et des 38 fragments actuels dans
`js/recit.js`. Consultation des descriptions d’objets associées aux cas examinés, des
consignes de style et des fonctions qui présentent ou déchiffrent les indices.

Sur 178 recettes, 159 recettes ordinaires ont un champ `h`. Quatre autres champs `h`
appartiennent à un objet marqué `sec` et à trois objets marqués `path`. Les 15 recettes
sans champ `h` sont marquées `sec` : cette absence n’est donc pas signalée comme une
lacune éditoriale. Les indices de secrets peuvent passer par d’autres supports.

La comparaison avec les jeux de référence repose sur des présentations officielles et
des propos de développeurs. Ce n’est ni une analyse exhaustive de leurs traductions
françaises, ni un nouveau parcours intégral de ces jeux. Le rapport distingue leurs
principes documentés des recommandations que j’en tire pour Éclat.

Cet audit ne valide pas la difficulté réelle, l’ordre de lecture de chaque partie ou
la compréhension par des joueurs débutants. Les dialogues, terminaux, fins et notes
individuelles ne font pas l’objet d’une revue exhaustive. Les problèmes de voix dans
ces ensembles demanderaient un chantier complémentaire.

## 3. Ce que les références apportent

| Référence | Principe documenté | Application proposée à Éclat | Limite de la comparaison |
|---|---|---|---|
| The Case of the Golden Idol | Les concepteurs articulent déduction, logique de la situation et récit. Ils ont ajusté la quantité d’informations et les retours sur les hypothèses après des essais avec des joueurs. | Écrire d’abord ce qui permet d’inférer la solution, puis choisir la forme qui le sert. Un indice doit apporter une relation exploitable. | Une recette courte ne peut pas porter la densité d’une scène d’enquête. |
| Myst | L’observation de lieux et de dispositifs s’inscrit dans une histoire et une question de confiance. | Rattacher une formulation à un objet, une fonction, une personne ou une trace concrète du monde. | Le mystère ne justifie pas de rendre les consignes obscures. |
| The Witness | La présentation du développeur revendique des énigmes qui apportent chacune une idée, sans remplissage. | Examiner ce que chaque indice apporte de nouveau ; distinguer un rappel utile d’une variation décorative. | Ce n’est pas un modèle de prose à imiter. Le dispositif essentiellement visuel ne se transpose pas directement à des recettes textuelles. |
| TUNIC | Le manuel incomplet associe indices et illustrations ; l’éditeur oriente les joueurs vers ce support pour trouver des réponses. | Penser le Carnet comme un ensemble dont les éléments peuvent se répondre et se relire. | L’opacité d’une langue inventée n’est pas une justification pour un français imprécis. |
| Outer Wilds | Mobius décrit un réseau de fragments qui renvoient à d’autres indices et lieux, puis des prototypes destinés à tester la compréhension narrative. | Vérifier qu’un texte ouvre une hypothèse ou une piste repérable. Tester ce réseau séparément de la production et des déplacements. | La curiosité et le temps disponible des joueurs d’Éclat ne sont pas acquis ; les aides restent nécessaires. |

Sources : [entretien avec Andrejs Klavins, Golden Idol](https://www.gamedeveloper.com/design/case-of-the-golden-idol),
[présentation de Myst par Cyan](https://cyan.com/games/myst/),
[présentation de The Witness par Thekla](https://store.steampowered.com/app/210970/The_Witness/),
[présentation de TUNIC par Finji](https://finji.co/games/tunic/),
[conception des indices d’Outer Wilds par Mobius](https://www.mobiusdigitalgames.com/news/demaking-outer-wilds).
Les applications et limites du tableau sont mon analyse, pas des prescriptions de ces studios.

## 4. Constats sur la langue

### 4.1. Un moule syntaxique trop fréquent

Parmi les 159 indices ordinaires, 106 commencent par « Des », « Du », « De la »,
« De l’ », « Un » ou « Une » ; 49 commencent exactement par « Des ».
Ce comptage de débuts de chaînes n’est pas une analyse grammaticale automatique et ne
mesure pas la qualité des phrases. Il matérialise cependant une impression confirmée
par la lecture : beaucoup d’indices suivent le même inventaire nominal.

Exemple : `chaine.h`, « Des cerveaux, des moteurs, des tapis d’acier. » Le texte donne
une série de correspondances avec les ingrédients. L’action ou le rapport entre ces
éléments est peu développé. Ce procédé est efficace ponctuellement ; répété, il fait
du Carnet un catalogue de paraphrases.

L’impératif apparaît ailleurs, par exemple dans `manche.h`, puis cède à une description
d’objet, une opération technique ou une maxime. La variété est souhaitable ; ici,
le changement de registre n’est pas toujours motivé par le rôle de l’indice.

**Conséquence :** une même cadence se répète tandis que le statut de la parole varie.
Ajouter des verbes partout ou raccourcir toutes les phrases ne réglerait pas ce problème.

### 4.2. Les périphrases deviennent un dictionnaire parallèle

Dans ces mêmes 159 indices, « métal rouge » figure dans 13 textes, la séquence
« cerveau » dans 13, « aimants parfaits » dans 7 et « éclair permanent » dans 4.
Il s’agit de nombres d’indices contenant la séquence, pas d’un compte de tous les mots.

Ces associations peuvent aider à reconnaître une matière. « Métal rouge » possède
notamment une propriété observable. Mais les expressions continuent à remplacer les
noms jusque dans les derniers âges : le joueur doit décoder un vocabulaire installé
par le rédacteur plutôt que comprendre une nouvelle transformation.

Le problème devient plus net lorsque la propriété est abstraite : « parfaits » ne dit
pas ce qui importe dans le matériau. Une propriété physique, un usage et une image ne
sont pas des indices équivalents.

**Conséquence :** une partie de la difficulté relève du déchiffrement des synonymes.
La progression technique du joueur ne se retrouve pas suffisamment dans le langage.

### 4.3. Les images ne sont pas toutes à supprimer

`ressort.h` décrit un métal « jusqu’à ce qu’il veuille revenir ». La personnification
renvoie ici à un comportement utile à identifier : retrouver sa forme. Elle porte
une information, même si toute la phrase mérite une relecture de fluidité.

À l’inverse, `tissu_carbone.h`, « Le plus vieux geste, avec le plus jeune des fils »,
repose surtout sur une symétrie rhétorique. Le rapprochement avec les premières fibres
est pertinent pour Éclat, mais « jeune » ne distingue pas concrètement ce fil d’un autre.
Le rappel risque de tenir lieu de piste.

`lentille.h`, « Polis la matière transparente en une goutte parfaite », mêle une opération
identifiable à une forme imprécise. « Parfaite » n’ajoute aucun critère exploitable ;
« goutte » peut faire imaginer une forme différente de celle à fabriquer.

**Critère proposé :** conserver l’image lorsqu’elle rend une propriété plus intelligible
ou qu’elle appartient à une perception précise du monde. La revoir lorsqu’elle ne fait
qu’embellir le texte ou brouille l’opération attendue.

### 4.4. Des relations mal exprimées ou trop implicites

Le corpus est globalement grammatical. Les problèmes majeurs sont la référence des mots,
les relations entre éléments et certaines ellipses, davantage que les accords.

- `composite.h` parle de « colle de pierre ». La description de la résine dit qu’elle
  durcit **comme** de la pierre : l’indice transforme cette comparaison en nom de matière.
  Le joueur peut légitimement chercher un ingrédient minéral.
- `collets.h` finit par « un appât » alors que la recette utilise des os. L’usage est
  plausible dans la fiction, mais la relation avec l’ingrédient disponible mérite d’être
  vérifiée du point de vue d’un joueur qui ne connaît pas déjà la réponse.
- `creuset.h` évoque de la « cendre d’os », tandis que la recette prend directement des
  os. L’opération intermédiaire est implicite. Il faut vérifier si le joueur est conduit
  à chercher une ressource ou une recette de cendre qui n’existe pas.
- Des aides narratives font agir des objets ou phénomènes avec des verbes peu naturels.
  Une vérification ciblée des référents et des verbes transitifs est nécessaire, en
  tenant compte du texte auquel l’aide répond. Les exemples sensibles ne sont pas cités ici.

Ces points ne commandent pas de rendre la simulation scientifiquement exacte. Ils
concernent la cohérence entre les mots de l’indice, les ressources du jeu et l’action
que l’interface permet effectivement d’essayer.

### 4.5. Une connaissance technique supposée, puis masquée

`lingot_fer.h` emploie « loupe » et « scories ». Ces mots sont pertinents ; leur présence
n’est pas un défaut. Il faut vérifier que le joueur les a rencontrés et que le contexte
permet de comprendre l’action. À l’inverse, employer « cerveaux » pour les processeurs
et « aimants parfaits » pour les supraconducteurs évite leurs noms sans nécessairement
faciliter leur compréhension.

**Conséquence :** un mélange de vocabulaire spécialisé et de substitutions enfantines
ou poétiques rend le niveau de langue instable. La cible occasionnelle appelle une
introduction progressive des mots, pas leur évitement permanent.

## 5. Le rôle de l’énigme est parfois indécis

Le champ `h` peut être une recette presque complète, une observation, un rappel d’un
ancien geste ou une description du résultat. Ces fonctions peuvent coexister dans un
jeu, mais leur succession doit être volontaire.

Le système propose déjà plusieurs niveaux d’aide : pour les recettes ordinaires,
Déchiffrer révèle l’action, puis une ressource, puis apprend la recette. Les Questions
narratives possèdent trois aides écrites. Les indices sont visibles dans les objectifs,
le Carnet et l’Atelier ; il faut donc les relire dans ces contextes, pas seulement dans
leur ligne de données.

Un indice initial qui donne presque tout peut convenir au début. Ce n’est pas une
preuve de mauvaise écriture. Il devient problématique si le palier d’aide suivant
n’apporte presque rien, ou si la découverte est présentée comme une déduction alors
qu’il suffit de remplacer les périphrases par les noms des ingrédients.

Pour chaque texte, la prochaine passe devra noter :

1. Ce que le joueur sait déjà à ce moment-là.
2. Ce que ce texte ajoute.
3. L’inférence ou l’essai qu’il rend raisonnable.
4. Ce que chaque aide supplémentaire révèle réellement.

Une formulation vague n’est pas automatiquement une énigme difficile. Une formulation
claire n’est pas automatiquement une solution donnée.

## 6. Où une voix propre à Éclat existe déjà

`manche.h`, « Prends du bois et retire tout ce qui dépasse », conduit à un geste concret.
`charbon.h` relie chauffage, couleur et légèreté. `corde.h` met en relation la fragilité
d’un brin isolé et la résistance de plusieurs brins. Ces indices rendent une transformation
imaginable, avec peu de mots et sans registre solennel.

Dans les supports narratifs, certains détails matériels et écarts observables entre
deux traces permettent de formuler une hypothèse. Ils donnent davantage de présence au
monde que la seule annonce d’une absence ou d’un secret. Le Livre porte également
plusieurs écritures et des réactions différentes : il ne faut pas les uniformiser sous
prétexte de cohérence.

Une hypothèse de direction, à éprouver plutôt qu’à imposer : **partir de ce que le Semeur
voit, manipule et apprend**. Le vocabulaire peut gagner en précision avec sa connaissance
des matériaux. La voix se reconnaîtrait à son attention et à ses associations, pas à un
petit stock de mots mystérieux. Les différents auteurs du Livre garderaient leurs raisons
de parler, leurs limites et leurs manières de comprendre.

Les motifs des mains, de la transmission ou du retour restent légitimes. Leur fréquence
ne suffit pas à les condamner : il faut vérifier si chaque retour apporte un sens,
une information ou un changement de perspective.

## 7. Cas de travail prioritaires

P1 : risque de détourner l’interprétation. P2 : effet cumulatif de langue ou de rythme.
« À préserver » désigne une qualité observée, pas une exemption de relecture.

| Champ dans `js/data.js` | Priorité | Diagnostic et question de reprise |
|---|---|---|
| `composite.h` | P1 | « Colle de pierre » transforme une comparaison en matériau. Quelle relation peut réellement inférer le joueur ? |
| `creuset.h` | P1 | Une cendre est nommée, mais pas manipulable comme ingrédient. L’opération implicite est-elle compréhensible ? |
| `collets.h` | P1 | L’appât ne nomme pas directement la ressource utilisée. Le lien est-il suffisamment préparé ? |
| `lentille.h` | P1 | La « goutte parfaite » manque de précision sur la forme ; séparer l’information de l’ornement. |
| `lampe.h` et `.d` | P1 | La description évoque de la graisse, la recette utilise de la colle d’os. Vérifier le contrat entre description, indice et ingrédients. |
| `batterie.h` | P1 | « Deux métaux différents » ouvre beaucoup de combinaisons ; vérifier les propriétés disponibles pour les distinguer. |
| `propulseur.h`, `reacteur_fusion.h`, `ia.h`, `assembleur.h` | P2 | « Aimants parfaits » revient comme code lexical. Identifier la propriété ou le rapport utile selon la recette. |
| `robots.h`, `ordinateur.h`, `chaine.h`, `drones.h` | P2 | Les cerveaux et corps mécaniques composent une même métaphore répétée ; différencier les fonctions. |
| `silicium.h`, `titane.h`, `fibre_carbone.h`, `ceramique.h` | P2 | L’« éclair permanent » rappelle une station, mais devient une formule. Préserver la condition technique sans une même clausule. |
| `tissu_carbone.h`, `cable.h` | P2 | Le rappel des premiers gestes a du sens ; le transformer en véritable reconnaissance, sans maximiser l’effet de maxime. |
| `moteur_vapeur.h`, `chaudiere.h` | P2 | Le « ventre » peut décrire une forme, mais l’image doit rester au service du fonctionnement. |
| `lingot_fer.h` | P2 | Garder les termes techniques, vérifier leur apprentissage avant usage dans un indice. |
| `manche.h`, `charbon.h`, `corde.h`, `ressort.h` | À préserver | Gestes ou propriétés perceptibles ; garder cette capacité à faire imaginer l’opération. |

Les P1 sont des risques éditoriaux argumentés, pas des blocages reproduits en test.
Les graphes de recettes et leurs solutions restent inchangés.

## 8. Ce que les consignes actuelles favorisent malgré elles

`docs/STYLE.md` distingue utilement les informations de jeu et le récit. Mais des
prescriptions comme « une phrase dit une chose concrète » ou « le récit se raconte par
des gestes » peuvent devenir mécaniques lorsqu’elles sont appliquées à chaque ligne.
Une succession de petites observations, de mains qui se posent et de regards ne crée
pas, à elle seule, une voix.

Les préférences récentes sur le français fluide corrigent déjà une partie de ce biais.
La prochaine passe devra distinguer explicitement notification, indice, aide et parole
d’un personnage. Les formulations nominales adaptées à un statut ne sont pas un modèle
d’écriture des énigmes. L’interdiction générale d’une forme grammaticale serait aussi
contre-productive que son emploi systématique.

Le manque principal est une définition des points de vue : qui formule l’indice, avec
quelle connaissance, dans quelle intention ? Sans cette décision, une correction de
syntaxe risque seulement de lisser le même ensemble.

## 9. Ordre de reprise recommandé

1. **Fixer le rôle des textes.** Définir ce que font les indices de recettes, les aides
   et les documents du monde. Préciser la place de leur éventuel locuteur.
2. **Traiter les risques P1.** Lever les faux ingrédients, les référents ambigus et les
   écarts entre descriptions et recettes, sans ajouter de révélations.
3. **Préparer un petit lot contrasté.** Choisir des recettes du début, du milieu et des
   derniers âges. Fixer l’information à conserver avant d’écrire ; proposer quelques
   variantes pour juger le ton. Ne pas reprendre les 159 indices d’un seul mouvement.
4. **Tester à l’aveugle.** Montrer l’état de connaissance et l’indice sans sa réponse.
   Demander ce que le joueur comprend, ce qu’il essaierait et pourquoi. Observer le besoin
   d’aide et les mauvaises pistes ; ne pas se limiter à « est-ce joli ? ».
5. **Étendre le vocabulaire et les rythmes retenus.** Vérifier ensuite les niveaux d’aide
   et les recoupements narratifs. Conserver des voix distinctes pour les documents signés.

Critères d’acceptation : français naturel ; référents identifiables ; mots techniques
introduits ou compréhensibles en contexte ; information utile ; pas de solution révélée
involontairement ; aide qui ajoute un véritable degré d’information ; rythme lisible dans
la succession des écrans. Aucun quota de phrases courtes ou de métaphores.

## 10. Vérifications de cet audit

- Comptages relus sur les données chargées par Node, avec exclusion de `sec` et `path`
  pour les statistiques des recettes ordinaires.
- Recoupement des cas P1 avec les champs `r`, `h` et `d` correspondants.
- Consultation de `E.decipherCost`, `E.decipher`, des présentations d’indices dans
  `js/quetes.js` et `js/atelier.js`, et des trois niveaux des Questions narratives.
- Aucun fichier de jeu modifié. Pas de nouvelle mesure de compréhension ni de test
  joueur présenté comme réalisé. Un audit de langue ne remplace pas ces observations.

Pour reproduire les volumes : charger `js/data.js`, puis `js/recit.js` ; compter les
objets avec `r`, puis ceux avec `h`. Pour les indices ordinaires, exclure `sec` et `path`.
Les motifs de début comptés sont `/^(Des |Du |De la |De l’|Une? )/`. Les autres comptages
cherchent les séquences indiquées sans distinction de casse, une occurrence au plus
par indice.
