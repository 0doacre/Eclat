# Éclat — Carte « Atlas vivant » : bilan et direction artistique V1

**Date :** 26 octobre 2026  
**Statut :** documentation de conception, **écran non validé**  
**Branche :** `prewiew-design` (orthographe historique conservée)  
**Périmètre :** interface et représentation cartographique ; pas de modification des mécaniques de progression.

## 1. Diagnostic après retour utilisateur

La capture mobile du 26 octobre montre une carte lisible sur le plan technique, mais **visuellement insuffisante**. Le titre, les boutons « Mon camp » / « La frontière », la rose des vents et la légende sont présents ; La Lisière est illustrée et visible. Pourtant l'écran n'évoque pas une carte de monde fantasy à explorer.

Défauts observables :

1. **Aucun paysage continu.** L'illustration de La Lisière flotte sur une bande de papier ; les régions à venir sont des silhouettes géométriques détachées du monde.
2. **Brouillard peu convaincant.** Deux masses hachurées en pointillés signalent le verrouillage, mais pas l'inconnu. Le joueur ne peut pas imaginer la géographie sous-jacente.
3. **Textures répétitives.** Le beige, les hachures et les courbes de niveau envahissent le fond ; les informations importantes manquent de contraste et de rythme.
4. **Énorme espace inutilisé sous la carte.** La légende apparaît bien avant la navigation basse, laissant une zone vide qui ressemble à un défaut de mise en page.
5. **Échelle incohérente.** La Lisière, les masses inconnues, la rose des vents et les marqueurs n'appartiennent pas au même langage graphique.
6. **Hiérarchie perfectible.** L'en-tête et les deux gros boutons prennent beaucoup de place avant la carte elle-même ; les noms des territoires et les points d'intérêt devraient dominer.
7. **Ergonomie à vérifier.** Le problème historique de La Lisière coupée n'est pas définitivement validé sur les petits écrans. Le scroll, les zones tactiles et le bas de carte doivent être testés en situation.

**Conclusion :** une V1 technique a été construite, mais pas une V1 artistique livrable. Ne pas annoncer l'écran comme terminé.

## 2. Ce qui a été implémenté

- Une carte SVG verticale de 400 × 1900 unités, avec géométrie `GEO` pour les terres.
- Un cadrage dynamique du `viewBox` sur les terres découvertes et les deux prochaines terres pressenties.
- Des illustrations `assets/terres/*-carte.webp` placées sur les terres ouvertes.
- Les interactions existantes : accès au Domaine, aux lieux d'exploration, aux passages et au camp.
- Un brouillard de découverte sur les régions futures.
- Des chemins, courbes de niveau, silhouettes de végétation, reliefs, dunes et cours d'eau SVG.
- Une rose des vents, une légende, une progression chiffrée et des raccourcis de navigation.
- Un thème expérimental `css/design-preview.css`, commutable avec le mode Classique.
- Des ajustements de scroll et d'espace inférieur, **sans validation finale sur appareil**.

Ces réalisations constituent une base de code réutilisable, non une direction visuelle aboutie.

## 3. Vision cible

> Ouvrir la Carte doit donner envie d'explorer un monde inconnu, comme dans un jeu d'aventure, et non de consulter une liste de territoires illustrés.

### Principes non négociables

**Un seul monde.** Les régions appartiennent à une géographie continue : forêt qui devient plaine, rivière qui traverse plusieurs zones, collines qui montent vers les montagnes. Les limites des régions ne doivent pas apparaître comme des ovales indépendants.

**La découverte est spatiale.** Les terres inconnues sont dissimulées par un véritable voile cartographique, avec une frontière irrégulière et progressive. On devine des silhouettes, des routes interrompues ou des indices, sans voir prématurément le contenu.

**Une illustration cohérente.** Définir une grammaire commune : carte fantasy dessinée à la main, textures de terrain discrètes, couleurs naturelles désaturées, encrage maîtrisé, points d'intérêt nets. Les images existantes restent des références, mais leur intégration doit être pensée à l'échelle du monde.

**L'interaction prime sur l'ornement.** Noms, marqueurs, chemins et destinations doivent rester compréhensibles et utilisables au doigt. La décoration ne doit jamais masquer un point d'intérêt.

**Une carte qui évolue.** La représentation peut s'enrichir selon les ères du jeu, mais la V1 doit déjà fonctionner au stade initial, avec une seule terre découverte.

## 4. Proposition de composition V1

### Structure de l'écran

1. **En-tête compact :** nom de l'Atlas et progression discrète ; limiter la hauteur consommée.
2. **Carte immersive :** une grande surface continue, sans encadrement visuel étroit au milieu de la page ; privilégier l'occupation réelle de la largeur disponible.
3. **Navigation discrète :** raccourcis « Camp » et « Frontière » accessibles sans transformer l'écran en tableau de bord.
4. **Légende minimale :** éventuellement repliable ou intégrée dans un angle, pas une barre interrompant le paysage.
5. **Bas de carte maîtrisé :** pas de vide artificiel ; espace de sécurité mesuré en fonction de la barre inférieure.

### Géographie

Conserver les identifiants et l'ordre de progression actuels pour la logique du jeu. Recomposer **uniquement leur représentation** :

- La Lisière est un territoire forestier dans une masse terrestre continue, pas un autocollant flottant.
- La Plaine s'ouvre naturellement depuis la forêt ; la Rivière dessine un lien géographique.
- Les Collines, Mine, Désert, Gisement et Montagnes forment des biomes raccordés.
- Le Caveau conserve sa spécificité de lieu secret, sans casser la continuité de la carte.
- Le passage vers l'Orbite, la Lune et Mercure doit assumer une rupture d'échelle et de registre visuel plutôt que prolonger artificiellement le même terrain.

### Fog of war

Trois états lisibles : **exploré**, **frontière pressentie**, **inconnu**. Éviter les ellipses hachurées autonomes. Utiliser un masque de révélation progressif à la frontière du terrain, avec un rendu stable, performant et sans animation obligatoire.

## 5. Production graphique

### Assets existants

Auditer les illustrations `assets/terres/*-carte.webp` : transparence, bordures, lumière, perspective, colorimétrie, poids. Déterminer lesquelles peuvent être intégrées dans un fond commun sans effet de collage.

### Illustrations originales

Créer en priorité **un fond de carte cohérent**, et non une accumulation de pictogrammes. Si des images générées sont utilisées : cadrage et raccords définis avant génération, palette et perspective constantes, exports WebP optimisés, transparence vérifiée lorsque nécessaire.

### Assets externes

Privilégier CC0 / domaine public ; pour toute autre licence, consigner auteur, source, version, licence et obligations de crédit dans un registre d'attribution. Ne pas intégrer d'asset externe non vérifié.

### Budget technique

Le rendu doit rester fluide sur Android : éviter filtres SVG coûteux, textures très lourdes, animations permanentes et changements de taille provoquant des sauts de scroll. Garder les ressources utiles disponibles hors ligne via le service worker.

## 6. Architecture et coordination

Fichiers concernés :

- `js/carte.js` : géographie, affichage, états, interactions et cadrage ;
- `css/design-preview.css` : style Atlas expérimental ;
- `css/style.css` : style de base à préserver autant que possible ;
- `index.html` : bascule Atlas / Classique ;
- `assets/terres/` : illustrations ;
- `sw.js` et `tools/build.js` : manifeste/cache et empreinte de build.

**Claude travaille sur `main`.** Ne pas fusionner ni écraser ses changements sans coordination. Conserver le mode Classique comme référence fonctionnelle. Ne pas modifier les sauvegardes, les règles de découverte, les expéditions, les coûts ou les états métier. Le nom `prewiew-design` reste inchangé pour éviter de casser les références existantes.

Attention : la valeur temporaire de `BUILD` dans `sw.js` doit être recalculée avec `node tools/build.js` avant livraison. Ne pas la corriger à la main.

## 7. Plan d'exécution recommandé

**Étape A — Composition de référence.** Dessiner une maquette de l'état initial (La Lisière seule ouverte) à 360 px et un état avancé avec plusieurs terres. Valider d'abord la continuité, les proportions et la place du contenu.

**Étape B — Fond géographique.** Remplacer les masses décoratives indépendantes par un terrain continu, intégrant relief, végétation, eau et chemins. Ne pas multiplier les textures tant que la composition ne fonctionne pas.

**Étape C — Révélation.** Développer le masque de découverte progressif avec trois états visuels ; tester l'absence de fuites graphiques des zones verrouillées.

**Étape D — Interactions.** Réintégrer noms, lieux, passages, camp, raccourcis, focus clavier et navigation tactile au-dessus de la carte.

**Étape E — Finition et recette.** Contraste, taille des cibles, performance, scroll, rendu selon les ères, bascule Classique et mise en cache.

## 8. Critères d'acceptation de la V1

- [ ] La carte évoque immédiatement un **monde continu** ; aucune terre ne ressemble à un îlot collé sur un fond neutre.
- [ ] La Lisière et tous ses points d'intérêt sont entièrement visibles et atteignables par défilement.
- [ ] Aucun vide massif inutile entre la carte, sa légende et la barre de navigation.
- [ ] États initial, intermédiaire et avancé cohérents ; aucune région verrouillée révélée par erreur.
- [ ] Utilisable à **320, 360, 390 et 430 px** sur Android, sans débordement horizontal ni élément sous la navigation.
- [ ] Raccourcis Camp / Frontière fonctionnels ; zones tactiles suffisantes.
- [ ] Navigation au clavier, noms accessibles et prise en compte de `prefers-reduced-motion`.
- [ ] Le mode Classique reste utilisable ; bascule sans rupture visuelle ou perte d'état.
- [ ] Pas de modification des mécaniques du jeu ni des sauvegardes.
- [ ] Assets optimisés, licences tracées, cache hors ligne et `tools/build.js --check` validés.
- [ ] Captures de contrôle comparables à l'état initial et à un état avancé, revues avant déclaration « terminé ».

## 9. Décision

**Ne pas passer cet écran en « terminé » sur la base de la capture actuelle.** Le socle interactif est prometteur, mais il manque le travail central de composition et d'intégration artistique. La prochaine passe doit porter sur le **monde lui-même**, pas sur l'ajout de nouvelles bordures, textures ou petits ornements.
