# Éclat — Interface peinte v2

Page témoin autonome du Domaine, avec des assets raster peints et de vrais contrôles HTML. Travail de direction artistique avant généralisation dans le jeu. Les valeurs de partie sont des données de démonstration inspirées de l’écran avancé fourni ; aucune sauvegarde du jeu n’est lue ou modifiée.

## Ouvrir

Ouvrir `index.html` pour le Domaine de Mercure, et `composants.html` pour éprouver les boutons et les pièces. Les pages fonctionnent depuis un dossier local et un serveur statique. Aucun service externe ni dépendance à installer pour les consulter.

Le bouton **Veillée** change le support et les encres. **Le carnet** ouvre le menu et le réglage de grand texte. Récolte, ajout de réplicateur, maîtrise, relève et navigation ouvrent des interactions explicites de démonstration ; aucune partie réelle n’est chargée. Échap ferme les fenêtres, Tab parcourt les contrôles.

## Dessin et composition

Neuf PNG originaux ont été produits avec l’outil intégré imagegen : trois fonds de boutons (pigment, papier clair, papier de veillée), deux cadres à centre transparent, deux papiers, une vignette de paysage de Mercure et un spécimen de métal. Les fichiers sous `assets/` sont des copies intactes des sorties générées. Les prompts exacts sont dans `prompts.json` ; les dimensions, empreintes et informations alpha dans `manifest.json`.

Les boutons peints portent du texte HTML. Leurs états de survol et d’appui modulent la luminosité et la position ; l’état indisponible est désaturé et utilise l’attribut natif `disabled`. Ces états ne sont pas des illustrations générées séparément. Les cadres utilisent une bordure en neuf parties, les papiers restent continus, et les images de paysage et de matière gardent leur ratio. Une teinte légère réduit le contraste du grain nocturne ; les PNG eux-mêmes ne sont pas retouchés.

La proposition réserve une grande feuille à une terre, ses matières et ses annotations. Elle rassemble l’information de maîtrise et la note de relève sans reproduire la pile de cartes de l’écran courant. Le Caveau reste présent comme rappel d’une terre traversée. Ce choix de composition est à juger avant de définir l’affichage simultané de toutes les terres.

## Contrôles et limites

`qa/check-page.js` vérifie les deux thèmes à 320, 390 et 1280 px, les chargements, l’absence de débordement, les cibles d’au moins 44 px, le clavier, les fenêtres, la récolte et la construction simulées, ainsi que le grand texte. Le résultat est dans `qa/report.json`. Les captures `*-ecran.png` montrent le comportement normal avec navigation fixe ; pour les grandes planches `clair-*.png` et `veillee-*.png`, la navigation est temporairement placée en fin de document uniquement le temps de la capture.

Ces contrôles concernent le prototype autonome. Ils ne sont pas une validation du moteur du jeu ou du rendu de chaque terre. Les PNG maîtres sont volontairement lourds (environ 19 Mo au total) ; prévoir des exports de diffusion comparés visuellement avant intégration et mise en cache. Les textes d’ambiance de cette étude ne remplacent pas les textes du jeu.

## Intégration après revue artistique

Conserver la même composition de référence, les matières peintes et le texte natif. Préparer les variantes web et leurs tranches sans déformer les coins ni aplatir les irrégularités. Raccorder chaque contrôle aux valeurs et interactions existantes du moteur. Étudier les états de production en cours, les longues listes, les autres terres et la densité en fin de partie. Ne pas appliquer cette étude par une simple surcharge globale de cadres.

Reporter ensuite le rendu commun sur `main` et `prewiew-design`, en conservant les différences de leurs ateliers et de leurs sauvegardes. Les deux branches jouables restent intactes pendant cette phase de proposition.

## Polices

Fichiers locaux issus du dépôt Éclat, sous SIL Open Font License 1.1 : IM Fell English — Igino Marini ; Caveat — Impallari Type ; Alegreya Sans — Juan Pablo del Peral / Huerta Tipográfica. Crédits de référence : `docs/CREDITS.md` du jeu.
