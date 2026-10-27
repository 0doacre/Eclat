# Coordination — chantier de direction artistique « L’Atlas vivant »

> **À l’attention de Claude et de toute personne intervenant sur Éclat.**
> Ce document est volontairement placé sur `main` pour rendre visible un chantier mené **exclusivement sur une branche séparée**. Il ne modifie ni le jeu ni sa feuille de route fonctionnelle.

## Situation

- **Branche du chantier graphique :** `prewiew-design` (orthographe exacte).
- **Branche de référence du développement :** `main`.
- **Prévisualisation indépendante :** https://craftgame-wrr.pages.dev/
- **Intention :** faire évoluer la direction artistique vers **« L’Atlas vivant »** : une interface de jeu évoquant un atlas/carnet de civilisation qui s’enrichit du silex aux étoiles.
- **Document de direction artistique sur la branche de travail :** `docs/DIRECTION-ARTISTIQUE.md`.

## Périmètre du chantier

Nous travaillons sur la lisibilité, la hiérarchie de l’information, la typographie, les couleurs, les composants d’interface, les illustrations et la cohérence entre les écrans. Le **Domaine** sert de premier écran de référence ; les autres vues suivront progressivement.

Nous cherchons à **préserver** les mécaniques de jeu, l’équilibrage, les données, la progression, les sauvegardes, le récit et le vocabulaire établi. Toute modification de JavaScript éventuellement nécessaire à la présentation devra être limitée, motivée et vérifiée pour éviter des régressions.

## Coordination avec le développement sur `main`

1. **Claude peut continuer à développer normalement sur `main`.** Il n’est pas demandé de geler le développement.
2. **Ne pas fusionner `prewiew-design` dans `main` automatiquement.** Une intégration éventuelle fera l’objet d’une revue distincte.
3. **Ne pas recopier des changements graphiques de la branche expérimentale vers `main` sans coordination**, afin d’éviter les doublons et conflits.
4. **Signaler les évolutions de `main` susceptibles d’impacter l’interface** : nouveaux écrans, changements de structure HTML/CSS, nouvelles interactions, modifications de navigation, contraintes d’accessibilité ou de performances.
5. **Les corrections de bugs fonctionnels restent prioritaires sur `main`** ; nous les répercuterons au besoin dans la branche de design lors de la synchronisation.
6. **Surveiller le service worker et les caches** lors des changements d’assets, de feuilles de style ou du HTML, afin que la prévisualisation reflète bien les nouveaux commits.

## Avis et objections bienvenus

**Claude : si tu vois une incompatibilité, une dette technique, une régression possible ou un désaccord sur les choix de direction artistique, merci de le signaler explicitement.** Les retours sont souhaités, notamment sur :

- les composants qui gagneraient à être mutualisés plutôt que surchargés en CSS ;
- les contraintes de performance mobile, d’accessibilité et de lisibilité ;
- les collisions potentielles avec des travaux en cours sur `main` ;
- la fidélité à l’univers narratif et aux intentions de game design ;
- les modalités de synchronisation et, plus tard, d’intégration.

**Canal proposé :** ouvrir une *issue* GitHub intitulée `[Design] Retour sur L’Atlas vivant` (ou ajouter des commentaires à une future pull request), avec captures et références aux fichiers concernés. Ce document ne constitue pas une demande de validation implicite : les objections argumentées sont utiles et attendues.

## État initial

Une première couche CSS expérimentale (`css/design-preview.css`) et un document d’orientation existent sur `prewiew-design`. La refonte visuelle détaillée est encore en cours. Le site Cloudflare Pages permet de vérifier les évolutions sur mobile.

---

*Document de coordination uniquement — aucun changement fonctionnel sur `main`.*
