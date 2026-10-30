# Le Domaine peint dans le jeu

Le monde peint est temporairement désactivé en production et en preview. Le thème Carnet utilise à nouveau le Domaine en pages, avec ses illustrations et ses découvertes. Le code et les assets du monde restent conservés pour les prochains essais ; aucune sauvegarde n’est réinitialisée.

Le thème Carnet (identifiant historique `vivant`) utilise `js/monde.js`. Le Domaine classique reste disponible dans les autres styles. Le rendu du monde reste monté pendant la mise à jour du jeu : on ne remplace pas les cibles pendant un appui de récolte.

## Gestes

- Toucher une matière récolte immédiatement. Maintenir répète après 380 ms, puis toutes les 140 ms, comme le Domaine d’origine. Relâchement, annulation du pointeur, changement d’onglet, ouverture d’une fenêtre ou sortie de l’application arrêtent l’appui.
- Le + ouvre la fiche existante du gisement : fabrication, pose, amélioration et pause passent par les fonctions normales du jeu. L’appui long n’ouvre plus cette fiche, afin de conserver l’appui continu.
- Le lieu se sélectionne sur le paysage, puis Explorer lance la vraie exploration : aucun temps abrégé ni ressource fournie. Les contours et la trace de graphite suivent son avancement.
- Le sentier devient actionnable après ses prérequis. Sa construction paie les vrais matériaux du passage, sans ajout de stock.
- Gestion du Domaine : le tiroir conserve les objectifs, suivis, ruines, reprise, machines, Comptoir, projets et productions. Les commandes existantes sont déléguées aux mêmes gestionnaires.

## Rendu et sauvegardes

Les gains et les particules utilisent la palette de la matière, avec une réaction de l’illustration plutôt qu’un déplacement de sa cible. Au plus huit gains et 90 particules ; la boucle graphique s’arrête après leur disparition. La réduction des animations garde un retour textuel sans déplacement ni particules.

Les préférences de cadrage sont enregistrées dans `settings.worldCamera`, sans changement de version de sauvegarde. Un cadrage nommé se réadapte à la taille de l’écran ; un déplacement libre conserve son centre. La relève réinitialise le cadrage selon le cycle, tout en conservant les illustrations acquises dans le carnet.

`js/world-layout.js` réserve les terres et leurs repères. La Lisière et la Plaine partagent la peinture validée du prototype ; les terres suivantes utilisent leurs illustrations existantes dans le même repère, en attendant les prochains assets. Les échelles spatiales sont séparées du sol par leurs coordonnées. Aucun lieu ou gisement conditionnel n’est révélé avant sa disponibilité.

Le fond des premières terres reste une composition aplatie ; terrain, eau, végétation et lieux devront progressivement être remplacés par des assets séparés, suivant l’ordre de calques du registre. Chemins, camp, installations, annotations et interactions sont déjà indépendants du fond. Les images et scripts de production sont dans le cache hors ligne.

## Vérifications

`npm test` inclut le modèle : nouveaux joueurs, lieux cachés, mémoire des découvertes, lieux d’à côté achevés, ressources supplémentaires automatisées, terres avancées et sauvegarde.

`npm run test:monde-ui` vérifie le jeu réel à 320, 390 et 1200 px : appui continu et arrêt, retour visuel, sélection des lieux, durées/coûts réels, paiement incomplet et complet du passage, gestion, navigation et rechargement. Les tests utilisent des parties jetables, jamais la partie du joueur.
