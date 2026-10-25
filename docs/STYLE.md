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

- **Un ton d’interface compact.** L’interface nomme une action, un état ou un résultat :
  « Fouille lancée », « Commande ajoutée », « Ressources manquantes ».
  Statuts, confirmations et notifications privilégient les formulations courtes, nominales
  ou entre parenthèses. Exemple : « Fouille lancée (continue hors ligne). »
  Ne pas raconter chaque clic (« tu pars, tu fermes le jeu si tu veux ») ni personnifier
  systématiquement les mécanismes (« tes mains s’y mettent »).
- **État puis précision.** Donner d’abord le résultat ou l’état, puis la condition utile :
  « Fouille en cours. Progression active hors ligne. » Éviter les phrases explicatives
  dans les statuts, notamment « Elle se poursuit… » ou « Tu peux poursuivre tes activités… ».
  « Hors ligne » est le terme retenu pour la progression pendant l’absence ; l’aide peut
  préciser une fois « même jeu fermé ». Réserver les explications détaillées au tutoriel
  et aux aides. « En arrière-plan » ne remplace pas « hors ligne » pour annoncer une
  progression qui fonctionne aussi après fermeture du jeu.
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

## Repères pour l’interface

| Situation | Formulation |
|---|---|
| Fouille disponible | Progression active hors ligne. Butin à récupérer sur la Carte en fin de fouille. |
| Départ | Fouille lancée (continue hors ligne). |
| Fin | Fouille terminée. Butin disponible sur la Carte. |
| Commande ajoutée | Commande ajoutée · Suivi au-dessus des onglets. |
| Limite atteinte | Commandes au maximum. Une place se libère à la fin d’une commande. |

Le lexique fixe les noms des systèmes, pas chaque tournure de phrase. « Tes mains » reste
le nom de la fabrication manuelle ; une confirmation peut simplement dire « Commande ajoutée ».
