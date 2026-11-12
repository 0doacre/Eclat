# Chantier « un jeu, pas un site » : prompt maître

Ce fichier est lu en premier par chaque agent. Il donne le but, les règles communes, la liste des tâches à cocher et la recette finale. Chaque tâche a son prompt dans ce dossier (`T1-…md` à `T7-…md`) : le porteur en donne un à chaque agent.

## Le projet

Éclat est un jeu incrémental pour téléphone (PWA), en français, en HTML, CSS et JS sans framework. Le moteur (`js/engine.js`) se teste en Node ; l'interface se pilote dans Chromium avec Playwright. Dépôt GitHub : `0doacre/Eclat`. Branche de travail : `claude/sobriete-coherence`.

## Le but

Le porteur veut « l'impression d'avoir affaire à un jeu vidéo, pas à un site web ». Un site empile du contenu et laisse la page s'allonger ; un jeu compose un écran fixe et change d'écran. La règle du chantier :

> Aucune vue ne défile. Le haut et le bas d'un écran sont fixes, ce qui ne tient pas passe derrière un appui, et seules les listes nommées glissent dans un cadre qui ne bouge pas.

L'écran des Terres est fait et sert de modèle : lis `tools/test-terres-fixe-ui.js` (ce qu'on exige) et le bloc « Terres : un écran fixe » de `css/harmonie-sobre.css` (comment c'est tenu). Ses principes :
- une colonne `flex` de la hauteur de la vue ; une seule réserve basse pour la barre d'onglets ;
- les textes d'état deviennent des pastilles, leur texte s'ouvre à la demande ;
- les actions sont en bas, au pouce ;
- si un état rare déborde, seule la zone du milieu défile, jamais la page.

## Règles communes

1. **Ta branche.** Pars de `claude/sobriete-coherence` à jour et crée `chantier/T<n>-<mot>`. Un commit ou plusieurs, puis une pull request vers `claude/sobriete-coherence`. Ne pousse jamais sur `main` ni sur `alpha`, ne force jamais un push.
2. **Ton périmètre.** Ne modifie que les fichiers cités dans ton prompt. Si la tâche en demande un autre, arrête-toi et écris-le dans ton compte rendu. Ne touche jamais à `js/engine.js`. Dans `js/data.js`, rien : la version et la note de version sont posées à l'intégration.
3. **CSS : on retire, on n'ajoute pas.** Les feuilles sont une pile où les dernières gagnent à coups de `#app#app…` et de `!important`. N'ajoute pas une règle plus forte à la fin : corrige ou retire la règle en cause. Le nombre de `!important` de `css/harmonie-sobre.css` et de `css/fin.css` ne doit pas monter (`grep -c '!important'`). Aucun nouveau fichier CSS.
4. **Textes.** Français, peu de mots, des icônes. Pas de calque d'anglais, pas de phrase en trois temps. Ne change aucun texte du jeu et ne retire aucun contrôle sans que ton prompt le demande.
5. **Tests.** Après tout changement : `node tools/build.js`, puis `npm test` (il doit rester vert). `npm test` ne lance aucun test de navigateur : lance aussi ceux que ton prompt nomme, avec Playwright 1.61 (`PW=<chemin>/node_modules/playwright node tools/<test>.js`, à installer hors du dépôt). Cinq tests d'interface sont rouges avant ce chantier (voir T6) : ne les compte pas contre toi, ne les « répare » pas hors de T6.
6. **Tailles.** Vérifie à 320 × 568, 360 × 640, 390 × 700, 390 × 844 et 430 × 932. 390 × 700 est la hauteur utile d'un téléphone de 844 px avec ses barres.
7. **Ne plie pas l'écran pour faire taire un test.** Si une mesure te paraît fausse, dis-le.
8. **Si tu ne peux pas lancer un navigateur**, dis-le en tête de ton compte rendu et ne prétends rien avoir vérifié à l'écran.
9. **`sw.js`.** `node tools/build.js` le régénère : commite-le. S'il entre en conflit avec une autre branche, l'intégrateur le régénère.

## Les tâches

Coche ta ligne dans ta branche, et seulement elle, quand ton compte rendu est écrit.

| | Tâche | Prompt | Fichiers réservés | Dépend de |
|---|---|---|---|---|
| [x] | T0 · Terres en écran fixe | (fait, sert de modèle) | `js/domaine.js`, bloc Terres de `css/harmonie-sobre.css` | |
| [x] | T1 · Fiches : erreur `perTime`, panneau fixe à deux pages | `T1-fiches.md` | `js/atelier.js` (fiches), `css/design-preview.css`, `css/style.css` (règle `.modal-box`), `tools/test-fiches-ui.js` | |
| [x] | T2 · Fenêtre d'ouverture : pied fixé | `T2-ouverture.md` | `js/memoire.js`, `css/fin.css` (bloc « fenêtres »), `tools/test-ouverture-ui.js` | |
| [x] | T3 · Réflexes de navigateur et transitions | `T3-reflexes.md` | `css/style.css` (règles de `html`, `body`, `#views`, `.view`), `js/ui.js` (changement d'onglet), `tools/test-reflexes-ui.js` (nouveau) | |
| [x] | T4 · Étude en écran fixe | `T4-etude.md` | `js/atelier-equipe.js`, `css/labo.css`, `css/atelier-equipe.css`, `tools/test-etude-fixe-ui.js` (nouveau) | |
| [x] | T5 · Atelier : page d'un métier en écran fixe | `T5-metier.md` | `js/atelier.js` (page d'un métier, feuilles), `css/atelier-production.css`, `css/refonte-0-39.css`, `css/sobriete.css` (Atelier) | T1 fusionnée |
| [x] | T6 · Tests d'interface rouges (la commande `npm run test:ui` est faite, reste le tri des rouges) | `T6-tests.md` | `tools/test-*-ui.js` | |
| [x] | T7 · Audit : détecteur et relevé (la section « Après correction » du rapport est écrite) | `T7-audit.md` | `tools/audit-interface.js`, `docs/audit-interface/` | les autres fusionnées |
| [x] | Intégration 0.67.0 (Claude) : recette de T1 à T5, corrections, Carnet et Journal en cadre fixe | `rendu-integration.md` | | |
| [x] | T8 · Un seul aspect : Atlas et Classique retirés | `T8-styles.md` | `index.html` (script d'aspect), branches d'aspect du JS, règles d'aspect du CSS, choix d'aspect des tests | T6 fusionnée |
| [x] | T9 · Grand texte, une seule échelle bien visible | `T9-grand-texte.md` | tailles de texte des feuilles de la refonte, règles `body.large-text`, test du Grand texte | T8 fusionnée |
| [x] | T10 · Thème sombre pour l'aspect Carnet | `T10-theme-sombre.md` | `applyTheme`, rangée Thème du menu, couleurs des feuilles de la refonte, anciennes règles sombres, `tools/test-theme-sombre-ui.js` | T8 fusionnée |

T1 à T5 sont fusionnées et recettées (12 novembre 2026), la 0.67.0 est publiée. T6 et T7 ne touchent qu'aux outils et tournent en même temps. Puis T8, puis T9 et T10 en même temps.

Retours du porteur sur la 0.67.0 (Android, Chrome, 12 novembre) : toucher, encoches, clavier et partie avancée sans défaut ; les cinq choix de l'intégration sont gardés (médaillon, pied de fiche en icônes, gisements à 46 px, bouton Machines retiré, fond de l'Atelier recadré). Grand texte ne se voit presque pas (T9), les anciens aspects doivent partir (T8), il veut un vrai thème sombre (T10). Pas d'iPhone pour essayer Safari.

## Ton compte rendu

Écris `docs/chantier-interface/rendu-T<n>.md`, quarante lignes au plus :
- **État** : fait, partiel ou bloqué.
- **Ce qui change pour le joueur**, en deux phrases.
- **Mesures** : un tableau avant et après (défilement de la page et de la zone du milieu, aux cinq tailles).
- **Tests** : la commande lancée et son résultat, copié tel quel.
- **Ce que je n'ai pas vérifié.**
- **Choix qui reviennent au porteur**, avec le chemin d'une capture pour chacun.

Range tes captures dans `docs/chantier-interface/captures/T<n>/` (JPG, 390 px de large).

## Recette (faite par Claude avant toute fusion)

Pour chaque pull request :
1. Le périmètre : `git diff --stat` ne montre que les fichiers réservés à la tâche.
2. `node tools/build.js`, `npm test`, `node tools/test-terres-fixe-ui.js`, `node tools/test-ux.js`, puis les tests nommés par la tâche.
3. Les compteurs de `!important` n'ont pas monté.
4. Les captures sont regardées une à une, aux cinq tailles.
5. Le compte rendu est comparé aux mesures refaites : tout écart est signalé au porteur.

Puis les branches sont fusionnées une à une dans `claude/sobriete-coherence`, `sw.js` est régénéré, la version et sa note sont posées. Le porteur dit « Alpha » pour essayer sur son téléphone, puis « Publie ».

## Ce que personne ici ne mesure

La sensation au doigt, le clavier virtuel, les encoches, Safari sur iPhone, le réglage Grand texte, le thème sombre. Le porteur les essaie sur son téléphone.
