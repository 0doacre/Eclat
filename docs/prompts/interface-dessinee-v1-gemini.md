# Gemini — Première intégration de l'interface dessinée

La direction retenue pour Éclat évolue vers une **interface dont les composants sont dessinés**, dans le langage du Carnet du Semeur. Codex a produit un moodboard avec une page témoin et commencé une base fonctionnelle : tracés SVG, menu, page de La Lisière, composants et interactions natives.

Le premier lot d'illustrations est maintenant intégré dans `main` par la PR #145 (`961cac5`). **Conserver cette intégration**, notamment `js/illustrations.js` et les variantes WebP de `assets/carnet/`. Le nouveau lot fournit l'habillage de l'interface autour de ces illustrations.

## Récupérer la base

Archive : `docs/art-direction/interface-dessinee-v1/da-interface-dessinee-v1.zip`.

- Taille : **17 268 049 octets**.
- SHA-256 : `dfcb31ef065f95ca8d42ecd29ff1d65dca4d2400b3556b769741e18cb1fc6708`.
- Dossier contenu : `da-interface-dessinee-v1/`.

Lire `README-GEMINI.md`, regarder `moodboard-interface-dessinee-v1.png`, puis ouvrir `index.html` dans un navigateur. Le prototype fonctionne directement en local. Les fichiers sont inventoriés et contrôlables dans `manifest.json`.

## Ce qui est fourni

- Une planche d'intention ImageGen avec composants dessinés, menu et Domaine illustré ; son prompt est inclus.
- **10 SVG éditables** : cadres, boutons, filets, contours de cases, marque de coche et lavis.
- Des bordures en neuf parties pour préserver les coins quand la taille d'un composant change ; paramètres dans `composants.json`.
- Des états de boutons, de vrais onglets accessibles au clavier, des cases, un dialogue d'aide, le grand texte et les deux thèmes.
- Une page de La Lisière avec des illustrations originales et une récolte locale de démonstration.
- Huit PNG maîtres inchangés pour l'étude. Pour le jeu, continuer à utiliser les variantes WebP déjà intégrées.
- 120 contrôles du prototype à 320, 390 et 980 px, en clair et sombre ; rapport et captures dans `qa/`.

## Travail à commencer

1. **Intégrer d'abord le menu**, puis les contrôles de récolte du Domaine, dans le mode Vivant. Créer des composants réutilisables : feuille/fenêtre, bouton, onglet, case, filet et lavis. Les SVG sont les sources éditables ; le moodboard ne doit pas être découpé pour fabriquer des boutons ou du texte.
2. Les tracés dessinent l'habillage. Garder les libellés, nombres, champs et interactions natifs. Raccorder les actions aux fonctions existantes du jeu, en conservant les attributs utilisés par les gestionnaires d'événements. Le JavaScript du prototype sert uniquement à démontrer des états locaux ; il ne remplace pas le moteur ni la sauvegarde.
3. Préserver les fonctions et le contenu du menu réel. Le prototype montre un sous-ensemble du menu, pas une liste de fonctions à conserver ou supprimer. Si l'on adopte de vrais panneaux d'onglets exclusifs, vérifier l'accès à toutes les rubriques et la navigation clavier.
4. Garder les irrégularités discrètes : quelques variations de plume et un lavis, sans tremblement continu, surcharge d'ornements ou texture sous chaque ligne de texte. Les dessins ne doivent pas déformer le texte, gêner le focus, intercepter les clics ou déplacer les contrôles.
5. Réutiliser les couleurs et conventions du jeu. Adapter les thèmes existants aux variantes d'encre : dans le jeu, `data-style-mode` est porté par `html`, et la classe `theme-dark` par `body`. Ne pas copier les attributs de thème du prototype sans les raccorder au système réel.
6. Continuer la distinction entre sources et objets : arbre dans le Domaine, bûche dans la Réserve et les recettes. Garder la couleur de matière et les replis SVG pour les éléments non illustrés. Le papier et les cadres appartiennent à l'interface.
7. Garder la compatibilité avec les autres modes et l'atelier équipé. L'habillage nouveau s'applique d'abord à Vivant. Les règles de production, de découverte et de relève ne changent pas dans ce travail.
8. Ajouter au cache hors ligne seulement les petits SVG et les ressources réellement consommées par le jeu, puis recalculer le service worker. Exclure l'archive de travail, le moodboard, les PNG maîtres et les captures.

## Vérification et bilan

Vérifier les thèmes, les petits écrans, les textes longs, le grand texte, le clavier, les états désactivés et actifs, les fenêtres et leurs retours de focus. Les dessins doivent supporter les tailles variables sans étirer les coins ou les illustrations.

Lancer `npm test`, les contrôles navigateur adaptés et l'inventaire des boutons si les actions ou libellés évoluent. Les tests du prototype ne constituent pas une validation du jeu après intégration.

Terminer par un commit d'intégration et un bilan avec les écrans raccordés, le poids des ressources, les tests et les affinages graphiques encore nécessaires. Cette première base pose les composants et leurs interactions ; le grain pictural et les variations de trait pourront être affinés à partir de la planche.
