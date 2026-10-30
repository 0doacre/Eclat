# Le papier partout, lot 0.38

Branche : `codex/papier-partout-0-38`. Base : `prewiew-design`, commit `4c0341352f712933bafc6cec0534ba71333c8a4f`.
Le menu de la preview publique affichait bien **v0.37.0** avant le travail. La version du jeu reste 0.37.0 : sa montée de version appartient au lot fonctionnel de Gemini.

## Examiner le lot

- [Galerie avant/après](index.html), quatre largeurs et Grand texte.
- [Deux pages de partage à zones nommées](page-carnet.html), 1080 × 1350 chacune.
- [360 mesures de contraste](CONTRASTES.md), avec les couleurs résolues dans [le relevé JSON](contrastes.json).
- [Exports WebP optimisés](optimisation.json).
- [Provenances encore à confirmer](PROVENANCE-A-CONFIRMER.md).

## Modifications

Les fenêtres du Carnet héritent explicitement du papier et de ses encres : menu, Jeu, Affichage, Audio, Système, Sauvegardes, fiches, passages, relève, retour d'absence et Mémoire des mains. Le menu était déjà en papier sur cette base fraîche ; cette passe consolide notamment les couleurs héritées en sombre forcé et les anciens styles d'interrupteur. Les interrupteurs actifs utilisent le bois rouge et gardent leur libellé Activé ; les autres gardent le papier et Désactivé. La croix existante mesure 44 × 44 px.

Journal et Cosmos retrouvent une page de papier. **Exception volontaire : le champ d'observation du ciel et les figures astronomiques restent nocturnes**, comme une illustration insérée dans la page. Leurs légendes utilisent une encre claire. Le terminal et les chantiers restent en papier.

« Contempler » réservait implicitement une colonne au bouton, qui était comprimé à droite de l'image. Le bouton dispose désormais de son rang ; les images et textes peuvent se réduire et revenir à la ligne. La même protection de largeur couvre les autres fenêtres illustrées. Le zoom conserve son défilement interne intentionnel.

Sur téléphone, le titre et la vignette de terre se partagent l'en-tête dès 361 px. Les annotations restent présentes ; les découvertes deviennent des études compactes consultables en grand. Les gisements placent leurs commandes à côté du nom, sans modifier la récolte. **Au moins deux gisements tiennent à 390 × 812 dans l'état courant sans chantier d'objectif déplié.** L'objectif de passage déplié conserve ses apports et son explication ; il repousse encore les gisements. Cet état est capturé séparément et reste à traiter avec Gemini si la garantie doit s'appliquer à chaque objectif ouvert.

Les gains de Traces et de récolte abandonnent les anciennes encres pâles sur papier. Les états prêt/manque gardent une surface permettant le contraste mesuré, leurs libellés ou quantités et les coches existantes. Les titres posés sur un décor en Atlas/Classique disposent d'un fond de lecture. L'accent sombre est légèrement rapproché de l'encre claire.

## Jetons

Définis dans `css/theme.css` : `--finish-paper`, `--finish-paper-deep`, `--finish-ink`, `--finish-secondary`, `--finish-pigment`, `--finish-on-pigment`, `--finish-success`, `--finish-danger`, `--finish-rule`, `--finish-night`, `--finish-stars`, `--finish-overlay`, `--finish-radius`, `--finish-shadow`, `--finish-window-shadow`, `--finish-ink-shadow`, `--finish-clear`.

Ils ne créent pas une nouvelle bascule clair/sombre pour le Carnet. Le papier permanent et les différences typographiques d'âge sont conservés. Les nouveaux styles consomment des variables pour leurs couleurs, rayons et ombres. Les transitions d'illustration sont désactivées avec `prefers-reduced-motion` ; le défilement explicitement demandé en JavaScript par les onglets du menu est signalé ci-dessous.

## Assets et provenance

`assets/` passe d'environ **21,2 Mo à 5,76 Mo** (octets détaillés dans le contrôle de livraison). Les 162 WebP restent sous 120 000 octets, maximum 88 686 octets. 85 exports ont été recompressés et, pour les grandes planches, réduits. Les sept calques/états des passages restent tous à 512 × 341 afin de préserver leur alignement. La granularité du grand zoom est moins fine : les PNG maîtres et archives restent disponibles. Aucun dessin n'a été régénéré.

Les deux illustrations de partage proviennent des PNG publics panier/cabane des archives Bois et sont exportées séparément en 768 px dans `sources-partage/`, hors cache du jeu, sous 120 Ko. Il ne s'agit pas d'une liste d'objets autorisés au partage. La cabane démontre seulement le gabarit d'un ouvrage achevé ; elle n'est pas déclarée Grand Œuvre par le moteur.

Les **329 icônes** de `tools/icons.json` ont une attribution individuelle dans `docs/CREDITS.md`. Les doublons du dossier `badges/` sont exclus ; douze autres homonymes ont été départagés par comparaison de leur silhouette avec le sprite embarqué. [Relevé de comparaison](icones-homonymes.json). Special Elite est attribuée à Astigmatic sous Apache 2.0 ; les sept autres familles restent attribuées sous OFL.

Le manifeste couvre les **162 illustrations** : 78 prompts individuels retrouvés, les consignes communes Bois/Os conservées comme telles, et 22 dates de génération documentées. Les dates de commit ne sont pas présentées comme dates de génération. Les 159 entrées incomplètes et les autres fichiers sans attribution établie sont listés pour l'auteur. Les trois illustrations Atlas disposent du prompt et de la date dans leur attribution existante. Rien n'a été inventé pour combler une lacune.

## Vérification et résultats

`npm test` passe en entier, code de sortie 0. Fin de sortie :

```text
14 tests réussis.
✓ Service worker à jour (build 350e2f8772).
```

Le journal complet est conservé localement dans `../output/papier-npm-test-final.log`, hors publication des documents de jeu. Le test navigateur existant `tools/test-illustrations-raccord-ui.js` passe **275 contrôles**, à 320, 390 et 1280 px : vraies explorations, apports de passerelle, conservation des découvertes, récolte maintenue et arrêt au relâchement, sauvegarde et images.

Le pilote [verification.cjs](verification.cjs) ouvre le vrai jeu dans **Chromium**, sur HTTP local port 8765, dans des contextes jetables. Il utilise les modules et écrans existants, pas une maquette. Formats : 320 × 568, 360 × 844, 390 × 844 et 430 × 844 ; contrôle de densité supplémentaire à 390 × 812. Grand texte activé partout ; papier clair et classe sombre forcée afin de détecter les restes de styles nocturnes. Aucun accès à la partie du navigateur utilisateur.

Les captures couvrent Domaine, objectif de passage ouvert, menu et ses quatre catégories, Sauvegardes, Mémoire, Contempler, fiche Bois, lieu exploré, passage, confirmation de relève, retour d'absence, Journal et ciel du Cosmos. La fiche Bois est appelée par le gestionnaire existant de fiche d'inventaire dans la fixture. Le Cosmos est débloqué dans la partie jetable par une lunette, puis ouvert par son vrai onglet. Les notifications de la fixture sont retirées des captures afin de ne pas masquer les fenêtres.

Les mesures de largeur du document et des fenêtres ne montrent pas de débordement horizontal. **La console n'est pas entièrement propre : la fiche de recette Manche déclenche déjà `ReferenceError: fmtNum is not defined` sur la base avant, comme après.** Sa capture d'erreur est conservée ; la fiche de ressource Bois est examinée séparément. Les autres parcours sont poursuivis. La limitation n'est pas masquée par un correctif JavaScript hors périmètre.

Chromium signale également les appels de vibration précédant le premier appui dans cette fixture automatisée. Ils figurent dans les journaux de console ; les vibrations sur appareil ne sont pas validées par ce contrôle de mise en page.

Les 360 ratios sont calculés sur les couleurs CSS résolues, pour trois styles, deux thèmes et six papiers. Minimum mesuré du texte : **4,70:1** ; minimum des rôles à seuil 3:1 : **5,82:1**. Ce relevé vérifie les encres et fonds nominalement associés ; il ne certifie pas chaque pixel des aquarelles, la transparence des animations ni tous les états du jeu. Les captures complètent le contrôle. Aucun téléphone physique n'a été piloté.

Pour reproduire, utiliser le runtime Playwright habituel de l'équipe (`PW` et éventuellement `CHROMIUM`), puis :

```text
node docs/art-direction/papier-partout-0-38/verification.cjs apres
node docs/art-direction/papier-partout-0-38/verification.cjs avant
```

Le mode avant sert les CSS/images depuis la base Git épinglée, les autres sources restant celles du clone. Le pilote démarre son serveur local intégré, sans installation d'une dépendance du jeu. Il remplace la commande `npx http-server` par cet équivalent local. Il ne faut pas le lancer pendant qu'un autre service utilise le port 8765.

## Textes ajoutés à relire

Les seuls nouveaux textes destinés à un rendu de jeu sont ceux des gabarits : « Une fabrication du Carnet », « Ouvrage achevé », « Le premier abri », « Une cabane fabriquée. ». Les phrases jeu/récit du panier sont reprises des données publiques ; la ligne récit de la cabane est un extrait public. Aucun texte du jeu réel n'a été changé.

## Notes pour Gemini

1. **Corriger `fmtNum`** : `js/atelier.js` l'appelle aux lignes 1492 et 1525 sans le recevoir dans la déstructuration de `create(api)`. L'appel `EclatAtelier.create` dans `js/ui.js` ne l'injecte pas non plus. Fournir ce formateur aux deux endroits, puis vérifier l'ouverture réelle d'une recette automatisable et d'une fiche machine.
2. Le bloc d'objectif de passage ouvert reste volumineux. Une présentation repliable des apports, avec résumé explicite et accès au détail, nécessite un travail de structure/logique ; cette passe ne le cache pas en CSS. Le bandeau de récolte qui masque la dernière ligne reste votre chantier.
3. Le menu appelle `scrollIntoView({behavior:'smooth'})` explicitement. Respecter `prefers-reduced-motion` dans cet appel, la CSS seule ne peut pas annuler son option JavaScript.
4. Monter les versions et écrire les notes de version du lot 0.38 si vous le retenez ; la version de démarrage 0.37.0 n'a pas été changée ici.
5. Brancher plus tard les zones nommées des gabarits et votre liste blanche de partage. Pas de rendu, URL publique, collecte ou bouton de partage ajouté au jeu.
6. Demander à l'auteur les dates/prompts manquants dans la liste de provenance, notamment les anciens décors fournis et les consignes individuelles Bois/Os.
7. **Régénérer les références pertinentes** : Domaine mobile, fenêtres du menu et fiches, Contempler, relève/absence, Mémoire, Journal, Cosmos et états des trois styles. `tools/golden-ui.js` compare aujourd'hui le HTML : une correction purement CSS peut ne produire aucun écart. Compléter sa référence par la galerie visuelle et conserver vos fixtures fonctionnelles. Aucun fichier de `tools/` n'a été modifié.
8. Adapter l'assertion de grille du test optionnel `tools/test-carnet-mobile-ui.js` : il attend deux colonnes, alors que le gisement compact place maintenant illustration, texte et commande sur trois colonnes. Ce test optionnel n'est pas lancé par `npm test` ; le nouveau pilote vérifie la largeur réelle et les contrôles existants de récolte passent.

Le document demandé `docs/AUDIT-EQUIPE-2026-10-30.md` est absent de la base récupérée : sa section 6 n'a donc pas pu être lue. Les autres consignes demandées ont été consultées. `docs/coffre/` n'a pas été lu.

Le changement de `sw.js` se limite à l'empreinte BUILD calculée par l'outil existant. Aucun changement dans `js/`, `tools/`, `server/` ou `index.html`. Livraison sur la branche dédiée, sans fusion.
