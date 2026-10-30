# Refonte 0.39 — lot art Codex

Base : `claude/refonte-ecrans-0-39` (`bad9b41`). Livraison : `codex/refonte-ecrans-0-39`. Aucune fusion, aucun HTML ou JS modifié, aucune dépendance.

## Livré

- `css/terres.css` : illustration masquée vers le bas, voile de papier à 98 % sous les gisements, médaillons de 36 px dans des cibles de 44 px, sélection soulignée par contour et point, terres fermées grises et bordure discontinue, Atlas plein cadre à défilement interne.
- `css/labo.css` : paillasse claire, trois cases arrondies, geste, essai, thermomètre natif avec libellés attendus, badge échantillon et chaîne manquante.
- `css/atelier-production.css` : registre ligné, fiche, choix du travailleur, file interne, ordres avec bordures pleine / discontinue / double. Les états doivent aussi être nommés par le HTML.
- `assets/refonte-0-39/onglets.svg` : cinq symboles existants réexportés ; identifiants `gi-terres-039`, `gi-labo-039`, `gi-atelier-039`, `gi-arbre-039`, `gi-journal-039`. Insertion par Gemini dans le sprite, `viewBox="0 0 512 512"`, rendu 24 px contrôlé dans les captures. Sources et licence dans les crédits.

Assets supplémentaires : **10 268 octets** (SVG), aucun raster supplémentaire ; bien sous 800 Ko. Les images WebP existantes sont réutilisées. Aucun `!important` ajouté.

## Opacités, cadrages et contrastes

| Terre | Opacité | Cadrage |
|---|---:|---|
| Lisière | 0,32 | décor portrait, 50 % 40 % |
| Plaine | 0,32 | décor portrait, 50 % 40 % |
| Rivière | 0,32 | décor portrait, 50 % 40 % |
| Collines | 0,32 | décor portrait, 50 % 40 % |
| Profondeurs | 0,32 | décor portrait, 50 % 40 % |
| Désert | 0,32 | décor portrait, 50 % 40 % |
| Gisement | 0,32 | décor portrait, 50 % 40 % |
| Montagnes | 0,32 | décor portrait, 50 % 40 % |
| Orbite | 0,32 | décor portrait, 50 % 40 % |
| Lune | 0,32 | décor portrait, 50 % 40 % |
| Mercure | 0,32 | décor portrait, 50 % 40 % |
| Caveau | 0,32 | carte entière, `contain`, centrée en haut |

Les onze décors sont déjà au format portrait. Aucun recadrage binaire nécessaire à 390 × 844. Le Caveau n'a pas de `caveau-decor.webp` : Gemini doit fournir `caveau-carte.webp` à `.terre-fond` ; le CSS préserve cette image entière sans agrandissement destructeur par recadrage. Un vrai décor portrait du Caveau reste souhaitable ultérieurement, aucun visuel nouveau inventé.

Mesures : minimum sur chaque pixel RGBA des douze sources, composition sRGB avec opacité 0,32 sur papier #f4ecda puis voile papier 0,98. Le masque est pris à son maximum (1), borne conservatrice indépendante de la taille du cadrage. Texte des gisements : **≥ 12,277:1** ; secondaire : **≥ 6,414:1**. Labo : texte 13,840:1, badge 7,230:1, chaîne 7,415:1 ; Atelier bloqué 10,977:1, bouton actif 7,415:1. Palette Carnet fixe dans ces nouveaux lieux, y compris Veillée. Résultats par terre dans `mesures-terres.json`, cas ajoutés à `docs/art-direction/papier-partout-0-38/contrastes.json`.

## Raccords attendus de Gemini

Aucun CSS existant modifié, aucun chargement ajouté : charger les trois nouveaux CSS après les styles existants et inscrire ces ressources dans le cache du service worker lors de l'intégration (empreinte à recalculer). Les tests du lot vérifient la base ; ces nouveaux styles ne sont pas encore chargés dans le jeu.

Le contrat n'offre pas d'état « traversée » : demander **`.terres-icone.is-traversee`**, avec un libellé accessible, puis ajouter sa finition distincte. Cette classe n'est pas inventée dans le CSS. Ouverte est l'état par défaut, fermée `is-fermee`, courante `is-courante`.

Le pager n'a pas de classe de piste dans le contrat. La transition `transform` de 240 ms est prête sur `.terre-page`, avec arrêt de transition sous `prefers-reduced-motion`. Gemini peut déplacer les pages elles-mêmes ; si son implémentation déplace une piste, fournir sa classe pour déplacer la règle de transition sur cette piste. Les gestes et le changement de page restent du JS Gemini.

Pour marquer la terre courante dans l'Atlas, poser `aria-current="location"` sur le groupe existant du repère : le CSS habille sa `.a-pin` et sa `.a-name`. Le camp existant reste distinct de cette position. Le thermomètre attend un `<meter>` dans `.labo-thermo`, avec valeur accessible et texte « froid / tiède / brûlant » ; les états des apprentis attendent également leur texte explicite.

## Contrôles

`npm test` : **vert**, service worker de la base à jour. Contrôle Chromium des trois planches principales et de la feuille Atlas à **390 × 844** : aucun débordement de document ; Atlas défile dans sa feuille. Les captures montrent les icônes d'onglets à 24 px et les médaillons à 36 px.

Les quinze PNG de ce dossier sont des **planches CSS provisoires**, produites avec un montage HTML temporaire hors dépôt : douze terres, Labo, Atelier, Atlas. Les lignes de matières y sont des exemples de mise en page, pas les données de chaque terre. Elles ne prouvent ni les interactions finales, ni R1 aux âges 1/5/9 et à 320 × 568. La branche `gemini/refonte-ecrans-0-39` n'existait pas lors de la lecture des branches distantes ; la recette finale `tools/test-ux.js` et les captures de l'interface intégrée restent à faire par Gemini / Claude.
