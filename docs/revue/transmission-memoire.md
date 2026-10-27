# Transmission et mémoire — version 0.37.0

Cette passe prolonge la variante B (PR #123). Elle ajoute une voie facultative au Livre sans modifier les 32 pages du récit, leurs conditions, les énigmes ou les étapes principales. Elle est portée par la branche `feat/transmission-memoire` ; elle doit être intégrée après B.

## Intention et expérience

Le joueur passe du geste à la trace, puis à la copie et à l’archive interrogeable. Les mains gardent le savoir-faire, le Livre conserve les témoignages, les notes personnelles conservent ce que le joueur en comprend. Ces dimensions ne sont pas de nouvelles monnaies et ne conditionnent pas la conservation des découvertes existantes.

Dans le Livre, un encart « Ce qui passe d’un Semeur à l’autre » présente les étapes accessibles. Les étapes lointaines ne sont pas annoncées avant leur âge ou la découverte de leur équipement. Les liens mènent aux fiches des objets par la navigation existante.

- Un feuillet de papyrus ouvre les notes personnelles : 50 notes de 500 caractères au plus, attribuées au cycle de rédaction, conservées après relève et rechargement, effaçables individuellement. Les notes sont repliées pour laisser les pages accessibles.
- Papier et presse introduisent un registre de copies. Le bouton inscrit les pages déjà retrouvées, sans consommer les originaux ni créer de page inconnue. Il n’accorde pas de récompense et ne fabrique pas un second exemplaire du texte : il s’agit d’un marquage documentaire persistant.
- Le serveur permet une recherche locale dans les titres, le texte principal et les annotations actuellement visibles des pages acquises. Les résultats ouvrent les documents originaux avec leur numéro et les informations de lecture existantes. La recherche est limitée à 100 caractères et huit résultats.
- La radio et le serveur font apparaître le thème des archives reliées. Cette étape est narrative : aucun réseau Internet habité, service externe ou récupération automatique de pages n’est simulé.
- L’IA existante ouvre la présentation « Interroger les archives ». Le fonctionnement reste une recherche documentaire locale par mots-clés, explicitement annoncée. Aucun LLM n’est exécuté, aucune réponse n’est générée, et aucune interprétation inventée ne prend la place d’un témoignage.

L’apprentissage demeure à la demande : chaque étape propose « Comprendre la technique ». Les textes distinguent support, copie, transmission, stockage et modèle de langage. Papyrus et papier sont distingués ; l’âge du papier suit la disponibilité de l’eau dans le jeu et ne prétend pas dater son invention. La dimension LLM pose la question de la provenance des affirmations sans résoudre ni réécrire les mystères du récit.

## Budget et recettes

Cinq recettes sont ajoutées à celle de poudre de quartz : six nouvelles recettes au total, aucune nouvelle ressource brute.

| Objet | Âge | Recette | Fonction |
|---|---|---|---|
| Encre | Os | Chauffer 1 charbon + 1 colle d’os → 2 encres | Composant des supports et de la presse |
| Feuillet de papyrus | Pierre | Assembler 12 fibres + 2 encres | Notes dans le Livre |
| Papier | Vapeur | Assembler 6 fibres + 2 eaux → 4 papiers | Préparation de la presse |
| Presse d’imprimerie | Vapeur | Assembler 20 papiers + 4 encres + 12 vis | Registre des pages copiées |
| Serveur d’archives | Silicium | Assembler 8 processeurs + 20 circuits + 10 verres trempés | Recherche documentaire |

Les recettes sont des abstractions de jeu. Les fibres du feuillet représentent les végétaux du support ; le papyrus réel se fabrique à partir de la moelle d’une plante particulière. Les étapes de mise en forme et de séchage du papier sont évoquées dans les textes, sans ajouter un nouveau geste. La presse réutilise les pièces mécaniques disponibles. Radio, ordinateur et IA réemploient le contenu existant.

## Architecture et sauvegardes

`js/transmission.js` est partagé entre le moteur sans DOM et le navigateur. Il ajoute les fonctions `transmission`, `transmissionNote`, `transmissionEffacerNote`, `transmissionCopier`, `transmissionChercher` et le rendu du panneau. Le module est chargé avant le moteur dans `index.html` et mis en cache par le service worker.

Les données se trouvent dans `meta.transmission` : équipements fabriqués, notes et identifiants des copies. Elles sont validées et bornées à chaque accès. Les anciennes parties sans ce champ fonctionnent avec un état vide. Les équipements déjà fabriqués sont reconnus avant sauvegarde et avant relève. Le reset explicite du jeu remet cette mémoire à zéro.

La sauvegarde conserve son schéma v12 introduit par B ; il s’agit d’un ajout facultatif dans `meta`. Les anciennes migrations de recettes restent inchangées. Les notes saisies et les recherches sont échappées dans le rendu HTML. La recherche utilise uniquement les annotations filtrées par `E.livre()`, jamais les annotations brutes dont les conditions narratives ne sont pas remplies. Les titres et identifiants des pages inconnues ne sont pas retournés.

## Validation et limites

- Validation des données : 267 objets, 234 recettes, aucune référence invalide ou recette inatteignable.
- Huit tests dédiés : budget, caractère facultatif, verrous, limites des notes, suppression, deux rechargements, relève, copies, recherche sans fuite narrative, normalisation des anciennes parties, échappement et rendu réel du Livre sans page retrouvée.
- Tests généraux : syntaxe, moteur, variante B, guidage, arbre, simulateur et serveur.
- Les empreintes de contenu de l’arbre sont recalées pour les cinq nouveaux objets ; les tests d’anonymat et d’absence de chevauchement restent inchangés.
- Adaptation mobile du panneau : sections repliables, champs bornés à la largeur disponible, texte de saisie à 16 px, libellés pouvant revenir à la ligne.
- Aucun contrôle visuel sur un appareil ou navigateur mobile n’a pu être effectué dans cet environnement ; les contrôles du HTML et les tests moteur ne le remplacent pas.

Cette version fournit les outils d’écriture et de recherche, une progression explicative et de courts textes d’ambiance. Elle ne comprend ni dialogue généré, ni véritable Internet, ni diffusion des notes entre joueurs. Ces fonctionnalités ne sont pas nécessaires à la première version et ne sont pas annoncées comme présentes dans l’interface.

## Repères documentaires

- Supports matériels de l’écrit : ressource BnF référencée par le ministère de la Culture, https://histoiredesarts.culture.gouv.fr/Toutes-les-ressources/Bibliotheque-nationale-de-France-BnF/Les-supports-de-l-ecrit2
- Fabrication du papyrus : publication universitaire, https://hicsa.pantheonsorbonne.fr/sites/default/files/2023-09/livre_atours_des_papiers_asiatiques_02.pdf
- Modèle et mémoire documentaire : Lewis et al., *Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks*, NeurIPS 2020, https://papers.neurips.cc/paper/2020/hash/6b493230205f780e1bc26945df7481e5-Abstract.html
