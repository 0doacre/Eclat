# Écrire les textes d’Éclat

À lire avant d’écrire ou de modifier un texte affiché. Les mots eux-mêmes sont dans
`docs/LEXIQUE.md`.

## Deux couches, séparées

1. **La couche « jeu »** dit ce que fait le joueur et ce que fait l’objet. Elle est très
   explicite et emploie les mots habituels des jeux vidéo : récolter, fabriquer, débloquer,
   augmente, sert à, nécessaire pour. Exemple : « Débloque l’action Chauffer, jusqu’à
   600 °C. » La sorte d’objet (Pièce, Station…) est déjà affichée au-dessus : on ne la répète pas.
   Dans les données, cette ligne est le champ `u` ; le récit est le champ `d`.
2. **La couche « récit »** raconte. Elle est plus littéraire, et s’affiche à part (en
   italique dans les fiches). Exemple : « Le premier feu que tu allumes toi-même. »

On ne les mélange que quand c’est utile, et jamais dans la même phrase.

## Les règles

- **Un français de jeu naturel et fluide.** Le ton recherché est direct, vivant et familier
  aux joueurs, avec des informations explicites pour les joueurs occasionnels. La brièveté
  aide, mais ne suffit pas : couper une explication en plusieurs fragments ne la rend pas
  naturelle. Ne pas imposer un modèle « état, puis précision » à chaque message.
- **Pas de ton scolaire.** Éviter de décrire chaque geste et d’expliquer systématiquement
  ce que le joueur peut faire : « Tu pars, tu fermes le jeu si tu veux », « Tu peux poursuivre
  tes activités pendant ce temps ». Donner l’information nécessaire dans son contexte,
  sans transformer chaque notification en leçon ou en mode d’emploi.
- **Un rythme fluide.** Éviter les successions de petites phrases autonomes, de statuts
  nominaux et de précisions administratives. Un libellé bref comme « Fouille lancée » convient
  à une confirmation ; ce n’est pas un modèle à étendre à tous les textes. Les points,
  points médians et parenthèses ne doivent pas remplacer les liens naturels entre les idées.
- **Des verbes concrets.** Éviter le vocabulaire passif, abstrait ou administratif et
  l’accumulation de noms comme « progression maintenue », « récupération disponible ».
  Préférer une action claire quand elle sert le message. Le problème ne se limite pas à
  la voix passive grammaticale : une phrase peut être grammaticalement active et sembler
  tout aussi mécanique.
- **Écrire en français, sans calquer l’anglais.** « Elle se poursuit même lorsque le jeu
  est fermé » sonne comme la traduction littérale de « continues even when the game is
  closed ». Cette tournure est à éviter, même si l’information est juste. Reformuler à
  partir de ce que le joueur a besoin de savoir, sans conserver la structure anglaise.
  « Hors ligne » peut résumer cette propriété ; l’aide peut préciser « même jeu fermé ».
  « En arrière-plan » ne garantit pas à lui seul une progression après fermeture du jeu.
- **Guider au bon endroit.** Le tutoriel explique les manipulations ; les messages courants
  confirment leur résultat. Citer le nom réel du bouton ou de l’écran (« Tailler », « Carte »),
  plutôt que sa taille ou sa position (« le gros bouton », « là »).
- **Expliquer les blocages.** Dire ce qui manque et comment avancer. Distinguer une liste
  de commandes pleine, une commande qui manque de ressources et une commande qui attend
  des mains ou des machines disponibles. Ne jamais annoncer un travail déjà commencé
  lorsqu’il a seulement été ajouté aux commandes.
- **Respecter la mécanique.** Préciser si le butin doit être récupéré, où, et à quel moment.
  Ne pas promettre un gain automatique ni un délai certain si le moteur ne les garantit pas.
  Pour une commande, employer « fin estimée » lorsque sa durée dépend des ressources ou des machines.
- **Pas d’anglais traduit.** Pas de futur qui prédit (« tu en mettras partout »), pas de
  tournures calquées (« tu le fabriques d’un bouton »).
- **Des tournures simples.** « Ce », « ça » et « c’est » sont permis quand leur référent
  est clair. Éviter les règles de syntaxe qui rendent le français artificiel.
- **Pas d’image pour faire joli.** Une phrase dit une chose concrète : un objet, un geste, un
  chiffre.
- **Le récit se raconte par des gestes.** On montre l’émotion (un sourire), on ne la nomme
  pas.
- **Un clin d’œil de temps en temps**, un peu méta, au plus un par écran : « L’ingrédient de
  base de tout jeu de survie. »
- **Encourager avec mesure.** « Bien joué ! » suffit après une découverte. Une aide précise
  est plus utile qu’une promesse vague comme « ce n’est jamais perdu ».
- Tutoiement quand on s’adresse au joueur. Inutile d’ajouter « tu » ou « tes » à chaque statut.
  Pas de tiret cadratin.

## Exemples validés

| Texte | Version retenue |
|---|---|
| Intro | Tu te réveilles dans l’herbe, au bord d’une forêt. Tu ne te souviens de rien, même pas de ton nom. / Tu regardes autour de toi. Tu ramasses un morceau de bois par terre et commences à l’écorcer. / Un sourire naît au coin de tes lèvres : oui, ça, tu t’en souviens. |
| Bois | Sert dans presque toutes les premières recettes. *Dans une forêt, ce n’est pas ça qui manque.* |
| Manche | Sert dans les outils, l’archet à feu et la cabane. *Un bâton bien droit, écorcé. L’ingrédient de base de tout jeu de survie.* |
| Carnet | Le Carnet garde toutes tes recettes. |
| Tutoriel | Tu ne peux fabriquer qu’un objet à la fois. |

## Repères pour l’interface à relire dans leur contexte

Ces formulations figurent dans la passe actuelle. Elles ne constituent pas toutes des
références éditoriales validées : la préférence exprimée porte aussi sur la fluidité,
le rythme et le vocabulaire, et ne se résume pas à raccourcir les messages.

| Situation | Formulation |
|---|---|
| Fouille disponible | Progression active hors ligne. Butin à récupérer sur la Carte en fin de fouille. |
| Départ | Fouille lancée (continue hors ligne). |
| Fin | Fouille terminée. Butin disponible sur la Carte. |
| Commande ajoutée | Commande ajoutée · Suivi au-dessus des onglets. |
| Limite atteinte | Commandes au maximum. Une place se libère à la fin d’une commande. |

Le lexique fixe les noms des systèmes, pas chaque tournure de phrase. « Tes mains » reste
le nom de la fabrication manuelle ; une confirmation peut simplement dire « Commande ajoutée ».
