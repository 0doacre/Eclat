# Éclat 0.37.0 : audit d'équipe (jeu, produit, marketing, joueur) et direction

Rédigé le 30 octobre 2026 par Claude. Version 0.37.0 (`main` et `prewiew-design`). Ce document remplace une première version écrite sur une branche périmée (0.14) : tout ce qui concernait l'entrée de jeu, l'arbre, les fenêtres et le choix « Fabriquer » a été traité depuis et n'y figure plus. Conventions de `docs/STYLE.md` : tutoiement, pas de tiret cadratin.

Étiquettes : **[J]** joué par moi dans la preview, **[M]** mesuré par un outil, **[L]** lu dans le code ou les docs, **[H]** hypothèse à vérifier avec de vrais joueurs.

## 1. Ce que j'ai vu, et ce que je n'ai pas vu

- **[J]** La preview `https://craftgame-wrr.pages.dev/` (branche `prewiew-design`), à 390 × 812, dans les deux styles « Atlas » (sombre) et « Carnet » (papier). Environ 10 minutes en partie neuve (carte d'ouverture, guide « Premiers pas », récolte, premier manche, Domaine, Atelier, Carte, Carnet, Arbre, Journal, menu), puis une visite en **mode test** à l'âge de l'Acier (7/15, recettes et matières données) pour juger la densité du milieu de partie. **Je n'ai pas joué les âges un à un** : le milieu est jugé sur une copie préparée, pas sur une progression vécue.
- **[M]** `npm test` vert sur l'ancienne branche ; `tools/sim.js` et `tools/sim-passages.js` lancés sur cette même branche. Les rythmes cités viennent de `docs/PLAN-ALPHA.md` pour la 0.37 : fin du bot en 1 h 18 (4 appuis/s), plus de 2 h 50 avec les durées manuelles.
- **Non vu** : le jeu au-delà de l'Acier, une progression réelle du milieu, le mode « Classique », le mode test, les comptes, le son, un vrai téléphone, un lecteur d'écran. **Aucun joueur observé.**
- Rien du jeu n'a été modifié. Seuls des documents sont ajoutés.

## 2. Le jeu aujourd'hui

15 âges, 259 objets, 12 terres, 5 fins, 38 fragments, un Atlas peint, des planches illustrées par terre, des objets peints en mode Carnet. Un code sans dépendance, un moteur testé sous Node, des sauvegardes migrées.

**Le mode Carnet est la bonne direction artistique [J].** Papier crème, cadres encrés, bandeau « Tailler » en bois rouge, médaillons de terre, ligne d'ambiance en italique : c'est un vrai carnet de terrain, et il est reconnaissable, ce qui est rare dans l'idle. Il tient la promesse du README. L'entrée est bonne : un objectif nommé avec un bouton « Atelier », un guide en 8 pas qui démarre après la première récolte, un premier manche en 5 gestes et environ une minute, un message « Geste remarqué ».

## 3. Audit « équipe de développement »

**Game design.**
- **Fort** : le craft par le geste et son thermomètre ; les stations qui ouvrent les gestes ; les règles de terre ; passages, relève, Mémoire des mains, maîtrise des terres ; un récit en filigrane.
- **Faible [L]** : le mid-game est très chargé (l'Atelier économique, les équipements, les maîtrises, les reprises familières s'empilent) alors que je n'ai aucune preuve qu'un nouveau joueur le comprend ; les âges de 1 min ou moins (Bois, Os, Acier, Silicium) filent sans enjeu ; le dernier âge pèse 32 min sur 1 h 18 pour le bot ; plusieurs terres tardives n'ont qu'un gisement et un lieu (mesure de la 0.14, à refaire).
- **Risque [H]** : trop de systèmes ajoutés en deux semaines (équipements, maîtrise, reprises, Vivant, mode test) sans une seule séance de joueurs observés.

**Qualité.**
- **Bon** : tests moteur, récit, serveur, compatibilité des sauvegardes, golden de l'interface.
- **Manque** : pas de CI visible ; trois styles à tenir (Atlas, Carnet, Classique) triplent la surface de test visuelle ; la dette de crédits (`docs/CREDITS.md` : auteurs des icônes CC BY 3.0, provenance des illustrations générées) bloque toute publication.

**Défauts relevés en mode Carnet [J].**
1. Le bandeau de récolte flotte au-dessus du contenu et masque les dernières lignes (« Fibres » dans l'Atelier, la ligne sous « Manche » dans le Carnet).
2. Le menu ☰ s'ouvre en thème sombre (panier peint sur fond noir) : les fenêtres ne suivent pas le papier.
3. Le Domaine : un seul gisement visible par écran de 812 px, l'illustration de la terre prend la place de la liste.
4. La fenêtre « Contempler » (vue en Atlas) montre un bandeau de texte tronqué à droite de l'illustration ; à revérifier en Carnet.
5. Barre du haut : un bouton de style qui s'appelle « Carnet » alors qu'un onglet du bas s'appelle aussi « Carnet » ; deux pastilles sans nom (« 0/3 », « 1 »).
6. Onglet Carnet : le texte d'aide prend la moitié de l'écran avant la première recette.
7. Console : des appels `navigator.vibrate` avant le premier appui.

## 3 bis. Le milieu de partie, vu à l'âge de l'Acier [J, mode test]

- **Le haut de l'écran est pris par du « chrome » [J].** À 390 × 812, la zone de contenu ne fait que 588 px quand s'empilent l'en-tête, la ligne d'ambiance, la bannière de mise à jour (temporaire : elle disparaît quand on met à jour) et, en mode test seulement, la barre « Mode test ». Même sans ces deux bandeaux, l'objectif, la carte « Gisement à exploiter », la carte « Relais conseillé » et la ligne d'étape passent avant le premier gisement.
- **Le Domaine est très long [M].** 3 044 px de haut (5 écrans) pour 4 gisements de 130 px : chaque terre déroule une grande planche (ici le Désert de Verre) avant ses ressources. C'est beau, mais on ne voit pas ce qui produit.
- **L'Atelier est très long [M].** 3 071 px. Le poste de travail (Établi, Foyer, Four, Poste de frappe) est sous les cartes « Passer le relais » et « Déchiffrer · 54 ». « Tes matières » énumère tout, y compris les objets à 0 ou à 1.
- **Le Carnet [M].** 1 338 px, 30 recettes apprises, rangées par âge repliables : la structure est bonne. Le texte d'aide en tête reste le défaut déjà noté.
- **Les offres de relève (« Relais conseillé », « Passer le relais ») s'affichent à l'Atelier et au Domaine à l'âge de l'Acier [J].** À ce stade le joueur de mon test n'avait rien fait ; **[H]** un vrai joueur peut l'ignorer ou, pire, la déclencher trop tôt. À observer.
- **Cinq pastilles dans l'en-tête** (style, quêtes « 0/3 », Traces « +30 », Intuition, ☰) : lisibles par icône, mais sans noms.
- **Le Journal [J]** : 2/38 fragments ; les listes « Encore à découvrir » sont claires et donnent envie.
- **La bannière de mise à jour [J]** s'affiche quand une nouvelle version est publiée et disparaît dès qu'on met à jour (vérifié : la partie est conservée). C'est voulu (le joueur garde la main sur la mise à jour). Elle ne devient un défaut que si un joueur la laisse des jours : à observer en test, pas à corriger d'avance.

## 4. Audit « joueur ou joueuse »

**[J]** Les 30 premières secondes sont excellentes : trois phrases, un sourire, « Ouvrir les yeux ». Les deux premières minutes aussi : je sais quoi faire, je le fais, ça répond. Le Carnet en papier donne envie de rester.

**[H]** Je crains trois endroits : la barre de six onglets sur 390 px (Domaine, Carte, Atelier, Arbre, Carnet, Journal) alors que je n'ai encore rien à y faire ; le moment où l'Atelier s'ouvre aux équipements ; et le premier mur (le passage), où le joueur occasionnel peut ne pas comprendre pourquoi il faut « verser » des matières.

**Pourquoi je reviendrais** : le mystère de l'étoile, les secrets, la production hors ligne, les illustrations. **Pourquoi je partirais** : si la dixième minute demande de comprendre quatre systèmes à la fois, et si rien ne me dit de revenir demain.

## 5. Audit « produit » et « marketing »

- **Promesse** : « Du silex aux étoiles. Découvre les recettes par le geste. » Elle tient, et le mode Carnet la porte visuellement.
- **Créneau** : un idle littéraire francophone, en carnet illustré, sans publicité ni achat. Étroit, mais personne ne le tient.
- **Manques** : aucune porte d'entrée publique (page d'accueil, captures, courte vidéo) ; aucun moment partageable (une page du Carnet exportable, une œuvre achevée) ; aucune mesure d'usage (un journal local exportable avec « Signaler un problème » serait suffisant, sans pistage) ; crédits non en règle ; décision de licence ouverte ; pas de décision de distribution (itch.io et GitHub Pages d'abord, boutiques plus tard).
- **Ton** : jamais « addictif », « ressources », « idle ». Aucun secret montré.

## 6. Direction

### Cadre commun

- Le chantier graphique vit sur `prewiew-design` (voir `docs/COORDINATION-DESIGN.md`), le développement sur `main`. **Ne rien fusionner dans `main` sans relecture** ; toute intégration est faite par Claude.
- **Un fichier, un propriétaire.** Gemini : `js/**`, `tools/**`, `server/**`, `sw.js`, `package.json`, `index.html`. Codex : `css/**` (sauf les règles de mise en page listées ci-dessous), `assets/**`, `icons/**`, `manifest.webmanifest`, `docs/art-direction/`. Quand l'un a besoin d'un fichier de l'autre, il l'écrit dans son compte rendu.
- Consigne de livraison de `docs/prompts/README.md` pour les deux : `npm test` entier, jeu ouvert dans un vrai navigateur, console sans erreur, compte rendu honnête, push de la branche, pas de fusion. Le coffre n'est pas ouvert ; aucun secret dans un commit ou un compte rendu.

### Pour Gemini

Ta mission est de fermer les défauts de **structure** du mode Carnet et de rendre le jeu **mesurable**. Dans l'ordre : (1) réserve la hauteur du bandeau de récolte dans la page, sur tous les onglets, pour qu'il ne masque jamais la dernière ligne (et corrige le défaut équivalent en Atlas et Classique) ; (2) renomme le bouton de style (« Aspect ») et fais du Carnet le style par défaut des nouveaux joueurs sans toucher aux sauvegardes ; donne un nom accessible aux deux pastilles de la barre du haut ; (3) rends le texte d'aide du Carnet repliable après sa première lecture ; (4) conditionne `navigator.vibrate` au premier geste du joueur ; (5) ajoute un parcours Playwright « première heure » à 390 × 844 et 320 × 568 dans les trois styles, et une intégration continue (`.github/workflows`) qui lance `npm test` ; (6) un journal de session local (200 événements, hors sauvegarde, aucun envoi) joint au fichier téléchargé par « Signaler un problème ». Tu ne touches ni aux couleurs, ni aux polices, ni aux images ; tu n'ajoutes aucun système de jeu avant le test de joueurs.

### Pour Codex

Ta mission est de **propager le papier** et de **finir le Carnet** sans rien changer à la structure. Dans l'ordre : (1) le menu ☰, toutes les fenêtres (fiches, passage, relève, retour d'absence), la Mémoire des mains et le Journal suivent le style choisi : papier, cadre encré, bouton principal en bois rouge, plus aucun panneau sombre en mode Carnet ; (2) vérifie « Contempler » et toute fenêtre à illustration à 320, 360, 390 et 430 px, en Grand texte, et corrige le bandeau tronqué ; (3) allège la hauteur du bloc de terre du Domaine pour qu'au moins deux gisements soient visibles sur 812 px (réduis l'illustration, ne la supprime pas) ; (4) mesure les contrastes (texte courant 4,5:1, grand texte 3:1) dans les trois styles et les époques ; (5) prépare le gabarit d'une « page du Carnet » (image partageable 1080 × 1350, papier, nom du jeu, une fiche d'objet ou une œuvre) en SVG ou en CSS à zones nommées, sans secret ; (6) mets à jour `docs/CREDITS.md` et le manifeste d'illustrations avec l'outil de génération, la date et le prompt (sans secret) de chaque image. Tu ne modifies ni `js/` ni `tools/` ; tu écris dans ton compte rendu ce que tu attends de Gemini.

### Pour moi (ni l'un ni l'autre)

- **Jouer le milieu et la fin en mode Carnet** : le milieu est vu une première fois (section 3 bis), reste à jouer une vraie progression de l'Acier aux fins, et à relire les offres de relève.
- **Préparer et mener le test de 5 à 8 joueurs observés** (grille, consigne, mesures : premier objet en moins de 2 min sans aide ; ce que la personne dit faire ensuite à la 10e minute ; moment d'arrêt). Cible : 80 % fabriquent leur premier objet en moins de 2 min, la moitié reviennent le lendemain.
- **Relire et fusionner** les branches de Gemini et de Codex, tester chaque lot dans le jeu, jamais sur la foi du compte rendu.
- **Équilibrage et rythme** : relancer `tools/sim-passages.js` sur la 0.37 avec les profils de joueur (lot F), vérifier les âges à une minute, proposer la liste des gestes à rééquilibrer. L'auteur tranche.
- **Texte** : relire tout texte ajouté (ton, STYLE.md, coffre intact).
- **Sortie** : page d'accueil publique, six captures, une vidéo de 20 secondes, texte d'accroche, décision de licence et de lieu de publication. Rien n'est publié sans ton accord.

### À arbitrer par toi

1. **Garder les trois styles ?** Je recommande Carnet seul pour les nouveaux joueurs, Atlas et Classique cachés derrière le mode test, puis supprimés avant la 1.0.
2. **Où publier d'abord** : itch.io et GitHub Pages ; boutiques après les tests.
3. **Licence** du code et des illustrations (séparées).
4. **Qui sont les testeurs.**
5. **Mid-game** : on ne l'élargit pas avant les tests (équipements, maîtrises, reprises restent gelés).

## 7. Mesures de réussite

| Axe | Cible |
|---|---|
| Entrée | premier objet en moins de 2 min pour 80 % des testeurs, sans aide |
| Compréhension | 6 testeurs sur 8 savent dire quoi faire ensuite à la 10e minute |
| Retour | la moitié reviennent le lendemain |
| Qualité | CI verte, aucune erreur console sur 30 min, sauvegardes anciennes rechargées |
| Style | zéro panneau hors thème en mode Carnet ; contrastes conformes dans les trois styles |
| Diffusion | page publique, six captures, crédits complets |
