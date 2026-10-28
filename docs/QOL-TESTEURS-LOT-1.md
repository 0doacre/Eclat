# Confort des testeurs — lot 1

28 octobre 2026. Les mêmes aides sont disponibles dans l'Atelier classique et la preview équipée.

## Accès

- **Menu → État des productions** : diagnostic des commandes et de l'ouvrier de preview. Un accès est aussi ajouté sous les commandes de l'Atelier lorsqu'une production existe.
- **Menu → Signaler un problème** : ce qui était attendu, ce qui s'est passé (requis), étapes de reproduction, puis téléchargement ou copie du rapport.
- **Bon retour** : commandes terminées, production qui continue, attentes, état de l'ouvrier et objectif à reprendre.

Le signalement ne contacte aucun serveur. Le rapport JSON contient la version du jeu, le profil d'Atelier, l'âge, le cycle, le contexte d'affichage, le navigateur, le diagnostic actuel et au plus vingt actions de jeu conservées en mémoire pour cette session. Le numéro de build vient du service worker qui contrôle réellement la page ; s'il ne répond pas ou si aucun worker ne la contrôle, ce champ reste inconnu plutôt que d'être inventé à partir d'une nouvelle version sur le réseau.

La sauvegarde est exclue par défaut. La joindre est un choix explicite : elle contient la progression et les notes. Le code du rapport ne lit pas les comptes ou les identifiants du stockage du navigateur ; un nettoyage récursif retire aussi les champs d'authentification éventuels de la copie exportée. Les textes saisis sont conservés entre les ouvertures du formulaire pendant cette session. Ils ne sont pas envoyés automatiquement.

## Diagnostic

Une commande qui progresse reste présentée comme active, même si elle aura besoin de matières supplémentaires plus tard. Une commande arrêtée distingue poste/chaleur/geste manquant, outil indisponible, manque de ressource ou composant et attente d'une commande précédente. Les informations réutilisent le moteur, ses réservations et le contrôle d'équipement de la commande.

Pour une ressource extraite, l'aide indique le manque et le débit réel lorsque disponibles. Le temps proposé concerne cette seule ressource et exclut les autres consommations ; il n'est pas présenté comme une durée de fin de commande. Les actions ouvrent le gisement, la fiche d'un élément déjà connu, la carte, les commandes ou l'ouvrier. Aucune ressource n'est dépensée et aucune priorité de commande n'est modifiée par ces aides.

Le diagnostic de preview sépare notamment pause volontaire, poste absent, outil absent, avance de salaire épuisée et manque de peaux. L'accès à l'ouvrier revient à l'Atelier équipé si les procédés historiques étaient ouverts.

## Reprise après absence

Le module prend une photographie légère des commandes et de l'objectif avant le rattrapage. Les commandes achevées sont identifiées par leur disparition de la file et leur progression finale, pas par le seul solde de la Réserve : une fabrication peut être terminée même si ses produits sont ensuite utilisés. Une annulation n'est pas une fabrication achevée.

Pour les absences courtes, un message peut annoncer la première commande terminée. Le bilan détaillé conserve les seuils et la file de fenêtres existants. Les reprises avec commandes bloquées ou ouvrier arrêté restent visibles même sans gain net de stock. Le temps hors ligne maximal et l'économie ne sont pas modifiés.

## Coordination du lot 2

Le module est `js/assistance.js`, son style `css/assistance.css`. Le menu et le retour d'absence comportent de petits raccords. Le lot 2 doit conserver ces accès et le champ `resume` des événements d'absence. Il peut faire évoluer les comparaisons, la file et les aides contextuelles sans réimplémenter le signalement ou le bilan.

Le prompt complet pour Gemini se trouve dans [prompts/qol-testeurs-lot-2.md](prompts/qol-testeurs-lot-2.md).

## Vérifications

- `npm test` inclut les tests de diagnostic, de reprise et de rapport.
- `npm run test:assistance-ui` teste les deux ateliers, les téléchargements avec/sans sauvegarde, l'absence d'envoi automatique, les accès aux productions et les bilans d'absence en 320, 390 et 980 px.
- Les boutons sont inventoriés et le cache est recalculé avant publication.
