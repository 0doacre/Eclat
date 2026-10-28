# Lot 2 de confort avant ouverture aux testeurs — prompt pour Gemini

Tu travailles sur Éclat (`0doacre/Eclat`). Implémente le deuxième lot de confort pour les testeurs, dans l'Atelier classique et dans la preview par postes et outils.

## Contexte et coordination

Le lot 1 est pris en charge séparément par Codex : rapport de problème téléchargé localement, diagnostic des productions bloquées et bilan de reprise après absence. Son code est regroupé dans `js/assistance.js` et `css/assistance.css`, avec de petits points d'intégration dans le menu, le rafraîchissement de l'interface et le retour d'absence. **Ne refais pas ces fonctions.** Les rapports ne sont pas envoyés automatiquement et n'incluent une sauvegarde que sur choix explicite du joueur.

Commence par récupérer les derniers états de `main` et de `prewiew-design` (orthographe exacte). Lis les documents de coordination et les instructions du dépôt. Travaille sur une branche issue de `main`, puis adapte et teste séparément sur une branche issue de `prewiew-design`. Ne fusionne pas la refonte expérimentale de l'Atelier dans `main`. Prépare des PR distinctes ; conserve les règles de publication du projet et signale leurs URLs.

La preview possède un moteur par équipements et une sauvegarde distincte (`eclat.preview.craft.v1`). Après le Cuivre, elle conserve les procédés classiques. Les ouvriers, leurs salaires et le marchand sont expérimentaux. Les filtres de découverte distinguent le geste classique, puis le poste, l'outil et le mode exact dans la preview.

La fatigue, les durées croissantes et l'élan des Semeurs sont déjà intégrés, de même que la maîtrise territoriale : +5 points de débit après maîtrise et relève, plafond +50 %. Ces mécanismes ne font pas l'objet de ce lot. Les valeurs affichées doivent en tenir compte.

## 1. Comparer avant d'investir

Permets au joueur de comprendre le bénéfice réel d'une construction ou d'une amélioration avant de payer : débit actuel → débit après investissement, coût réel pour cet exemplaire et éventuelles conditions manquantes. Commence par les extracteurs, les améliorations de niveau et les outils ayant un effet mesurable ; ajoute les machines lorsque leur bénéfice peut être exprimé honnêtement pour la recette concernée.

Exemples de présentation à adapter au vrai calcul : « Bois : 12 → 18/min » ; « Couper ces lanières : 8 → 4 s ». Ce sont des exemples d'interface, pas des valeurs cibles à coder.

Utilise les fonctions du moteur : durée réelle de fabrication, coût avec croissance des exemplaires, bonus de terre, Mémoire, Échos, règle locale, compétence et équipement choisi. Respecte le rendement de la recette, les lots et leur compression temporelle. Ne confonds pas opérations de fabrication et quantité d'objets produits. Une vitesse +50 % ne signifie pas une durée −50 %.

Les projections sont en lecture seule : aucune dépense, aucun gain, aucune fabrication simulée dans la vraie partie. Si un rendement dépend de la recette, de l'affectation ou d'une condition, présente ce contexte. N'invente pas un temps d'amortissement ou de franchissement de terre.

Dans le bilan de relève, distingue les gains effectivement acquis à cette relève des améliorations que les Traces permettront éventuellement d'acheter. Les bonus territoriaux déjà annoncés ne doivent pas être comptés deux fois. Ne promets pas une récolte doublée si aucun achat correspondant n'est encore fait.

## 2. Mieux contrôler la file de fabrication

Ajoute **Mettre en pause / Reprendre** et **Passer en priorité** pour une commande. Garde l'interface compacte et utilisable sur téléphone ; annonce clairement l'état en pause.

Une pause conserve les ingrédients réservés et toute la progression de la commande. Elle libère les mains et les machines pour les autres commandes. Reprendre continue au même point, en ligne comme hors ligne. Une commande en pause ne doit pas empêcher toutes les suivantes de progresser. Le temps restant affiché ne doit pas promettre la fin d'une commande en pause.

Changer la priorité conserve la progression, les sous-recettes, le choix d'outil et les réservations exactes. Cela ne duplique ni ne restitue des matières. Les commandes déjà planifiées restent valides ; ne les reconstruis pas à partir des recettes actuelles pour les déplacer. Annuler conserve le remboursement des seules matières réellement réservées.

Évite qu'un clic après un rafraîchissement cible une autre commande : utilise une identité stable ou un mécanisme équivalent. Les anciennes sauvegardes sans état de pause restent actives par défaut. Respecte les anciennes recettes, les lots de l'ancien Atelier, la non-fusion des sélections d'outils différentes et les sauvegardes des deux profils. N'ajoute pas une contrainte ou un prix pour utiliser ces commandes.

Préserve le contrat de `E.handInfo()` autant que possible ; expose explicitement l'état de pause. Le diagnostic du lot 1 sait lire `job.paused` ou le champ `paused` de la commande. Si ton modèle exige une autre forme, documente le changement et adapte ce raccord minimal sans réécrire `js/assistance.js`.

## 3. Pouvoir rouvrir une explication

Ajoute une aide contextuelle courte et accessible près des notions qui demandent une compréhension : étude des matières, commandes et réservations, maîtrise des terres et transmission, salaires de l'ouvrier, relève. Réutilise les termes et les mécanismes existants.

Un petit bouton « ? » ou « Comprendre » ouvre une explication à la demande ; aucune nouvelle série de fenêtres automatiques. Fermer rend le focus à l'élément déclencheur. N'efface ni l'établi, ni le filtre, ni la recherche. Pas de révélation des recettes, lieux ou solutions encore inconnus. Dans la preview, explique le geste exact de l'outil et la séparation entre ouvrier, marchand et troqueur lorsque c'est pertinent.

## Validation et livraison

- Lance `npm test` et les contrôles adaptés au moteur et à l'interface ; actualise le service worker et l'inventaire des boutons après les changements d'interface.
- Vérifie les calculs affichés contre les résultats réels du moteur, avec et sans bonus territoriaux/Mémoire/outil.
- Teste pause/reprise et priorité avec plusieurs commandes, ingrédients réservés, sous-recettes, machines en parallèle, fabrication manuelle, annulation, changement d'outil, anciennes commandes et rechargement. Vérifie aussi le rattrapage hors ligne.
- Fais un parcours navigateur en 320, 390 et au moins 980 px sur les deux ateliers. Contrôle cibles tactiles, largeur, focus, fermeture des aides et conservation de l'établi.
- Documente ce qui est livré et toute limite concrète. N'affirme pas qu'un test humain ou un appareil physique a été testé si tu n'as utilisé que le navigateur ou un simulateur.

Hors périmètre : rééquilibrer les coûts/durées/fatigue, ajouter du contenu, refaire le signalement ou le bilan d'absence, ajouter de la télémétrie ou un envoi automatique, fusionner la refonte de preview dans main. Le maintien des repères de navigation constitue une amélioration ultérieure et n'est pas nécessaire pour terminer ce lot.
