# Langage de l’interface

Cette passe vise les messages fonctionnels : fouilles, explorations, Atelier, commandes,
tutoriel, extracteurs, sauvegardes et relève. Les voix du récit et les indices restent
distincts de ces messages.

## Direction

- Naturel et fluide : un français direct, vivant, qui sonne comme un jeu écrit en français.
- Familier aux joueurs : action nommée, état visible, résultat annoncé.
- Accessible : expliquer les automatismes, le lieu où agir et la cause d’un blocage.

Les noms propres à Éclat restent les repères du joueur. Le tutoiement reste utile dans
les consignes ; il n’est pas nécessaire dans chaque statut. La concision est un moyen,
pas une définition du ton recherché. Une succession de fragments courts peut rester
scolaire, hachée et artificielle.

## Préférence éditoriale précisée le 25 octobre 2026

Le retour de l’auteur porte sur quatre défauts liés :

- **Le ton trop scolaire** : expliquer chaque geste ou chaque possibilité donne
  l’impression d’un mode d’emploi récité, même lorsque l’information est utile.
- **Le rythme haché** : enchaîner de petites phrases et des libellés indépendants casse
  la fluidité. Remplacer la prose par des points médians ou des parenthèses ne résout
  pas automatiquement ce problème.
- **Le vocabulaire passif** : les états abstraits, les nominalisations et les formulations
  administratives éloignent le texte de l’action. Ce ressenti dépasse la seule voix
  passive grammaticale ; privilégier des mots concrets et des verbes utiles.
- **Le français traduit de l’anglais** : « Elle se poursuit même lorsque le jeu est fermé »
  évoque le calque de « continues even when the game is closed ». L’objection concerne
  la tournure et le ton, pas seulement la longueur de la phrase.

Les exemples proposés par l’auteur (« Fouille lancée (continue hors ligne) », « Fouille
en cours. Progression active hors ligne », « Fouille lancée. Progression maintenue en
arrière-plan ») indiquent une recherche de langage d’interface familier aux joueurs.
Ils ne justifient pas une règle générale imposant des phrases nominales, un vocabulaire
passif ou un rythme télégraphique à tout le jeu. La clarification ci-dessus guide les
prochaines relectures.

Conserver l’objectif d’explicitation pour les joueurs occasionnels : on peut alléger
la tournure sans supprimer la durée, la cause d’un blocage ou le lieu de récupération.
La cible est un texte facile à comprendre, naturel à lire et cohérent avec l’univers.

Ne pas confondre concision et suppression des informations utiles : conserver le lieu
de récupération du butin, la cause du blocage et les conditions de progression.

## Références consultées le 25 octobre 2026

- [Melvor Idle, guide débutant](https://wiki.melvoridle.com/index.php?title=Beginners_Guide) :
  référence proche pour la récolte, la fabrication et la progression pendant l’absence.
  Le guide décrit l’action active, les gains et le bilan de retour.
- [Shakes & Fidget, expéditions](https://playa-games.helpshift.com/hc/fr/4-shakes-fidget-1653988985/faq/237-expeditions/?p=web) :
  référence française pour la présentation d’une activité, de ses conditions et de son butin.
  La mécanique diffère de celle d’Éclat ; les récompenses et règles ne sont pas transposées.

Ces sources documentent des principes de présentation et de vocabulaire. Elles ne constituent
pas un relevé exhaustif des textes affichés dans ces jeux. Les formulations proposées sont
originales et les consignes durables figurent dans STYLE.md et LEXIQUE.md.

## Exemples appliqués dans la passe actuelle

Ce tableau décrit les changements de code déjà faits. Il ne vaut pas validation
définitive du ton : les formulations restent à relire selon la préférence précisée ci-dessus.

| Avant | Après |
|---|---|
| Tu pars, tu fermes le jeu si tu veux. Le butin t’attend à ton retour. | Progression active hors ligne. Butin à récupérer sur la Carte en fin de fouille. |
| Tu pars fouiller. Le butin t’attendra, même jeu fermé. | Fouille lancée (continue hors ligne). |
| Tes mains s’y mettent. La recette est dans tes commandes. | Commande ajoutée · Suivi au-dessus des onglets. |
| Tes mains sont occupées : attends la fin de la commande en cours. | Commandes au maximum. Une place se libère à la fin d’une commande. |
| Touche le gros bouton pour fabriquer. | Touche « Tailler » sous l’établi pour fabriquer ton premier objet. |

Le moteur confirme que le butin des fouilles doit être récupéré sur la Carte avant de
relancer une fouille. Une commande ajoutée peut attendre des ressources ou des machines :
son ajout n’est donc pas annoncé comme un démarrage immédiat.

## Relecture des prochaines modifications

Lire le message dans son écran et vérifier trois points : ce qui vient de se passer est-il
clair, le joueur sait-il quoi faire ensuite, et la phrase correspond-elle exactement à la
mécanique ? Garder les précisions qui répondent à une question réelle, puis retirer les
répétitions. Relire aussi le rythme de l’ensemble : le texte ressemble-t-il à du français
écrit pour ce jeu, ou à une traduction, un formulaire ou une leçon découpée en fragments ?
Une validation avec des joueurs occasionnels reste nécessaire pour mesurer
la compréhension et le naturel perçu.
