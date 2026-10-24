# Audit de Clicky Islands Demo, et ce qu'il peut apporter à Éclat

Rédigé le 24 octobre 2026. Cible : la démo Steam `Clicky Islands Demo` (Karrot Games, Godot 4.5.2) installée dans `D:\SteamLibrary\steamapps\common\Clicky Islands Demo`. Destinataire : le dépôt `0doacre/craftgame` (Éclat). Le ton et les conventions suivent `docs/STYLE.md` : tutoiement, pas de tiret cadratin.

## 1. Résumé

Clicky Islands est un incrémental de session à cliquer, mélangé à un petit city-builder sur une île générée. On bâtit, on recrute des unités, on expédie des marchandises par bateau, on monte l'île de stade en stade (Camp, Settlement, Village, Town, City, Capital, Kingdom), puis on repart sur une nouvelle île. La méta-progression (Réputation, arbre de perks, fossiles, artefacts équipables, défis) survit au départ.

Éclat n'a pas besoin de copier ses systèmes. Il a déjà une boucle plus originale (le geste, la relève, le récit) et plusieurs mécaniques que Clicky n'a pas. Ce que Clicky fait mieux, et qui se transpose bien :

1. **Le toucher.** Retour visuel et sonore très travaillé sur chaque clic (texte flottant en quatre temps, trois à sept variantes sonores par matière, secousses d'écran dosées, bouton à maintenir avec anneau de progression). Coût faible, effet immédiat.
2. **Les défis volontaires.** « Finis l'île sans tour de guet » rapporte de la Réputation en plus. C'est le moteur de rejouabilité de Clicky et il manque à Éclat (`docs/A-FAIRE.md` ne prévoit que des succès sans récompense).
3. **Un puits à doublement qui ouvre un choix.** Le Chaudron absorbe des ressources, son seuil double à chaque usage, puis il propose trois bénédictions de rareté tirée. Éclat n'a pas de décision en cours de cycle, hors dons de la relève.
4. **Des objets qui changent une règle** (artefacts équipables), plutôt que des pourcentages.

Ce qui ne se transpose pas : tout ce qui suppose une souris et une grille (info-bulles au survol, clic droit, routes, adjacences), la machine à sous du Scarecrow, les vidéos de tutoriel, le combat.

## 2. Méthode et limites

Ce que j'ai fait :

- Lu l'archive `Clicky Islands Demo.pck` (format 3, Godot 4.5.2, non chiffrée, 5 066 entrées) avec un lecteur d'en-tête écrit pour l'occasion.
- Récupéré le projet complet (scripts GDScript, scènes, ressources, textes) avec GDRE Tools v2.7.4 (`GDRETools/gdsdecomp`, binaire officiel de la release GitHub), en lecture seule sur le `.pck`. Le projet récupéré est dans `%TEMP%\clicky-recovered`.
- Lu les 1 050 textes anglais, une vingtaine de scripts de gameplay et de gamefeel, et les ressources de progression.
- Lu dans Éclat : `README.md`, `docs/AUDIT-INSPIRATIONS.md`, `docs/A-FAIRE.md`, `docs/PROGRESSION.md`, `docs/STYLE.md`, et vérifié par recherche dans `js/` et `css/` ce qui existe déjà.

Ce que je n'ai pas fait :

- **Je n'ai pas joué.** Tout ce qui touche au ressenti vient du code (durées, courbes, bruitages listés), pas d'une session de jeu. Les écarts de rythme ou de lisibilité réels restent à confirmer en jouant 15 minutes.
- **C'est une démo.** Elle ne couvre pas tous les stades ni tous les artefacts (dix sur quarante-cinq). Certains chiffres de coût ont l'air incohérents entre fichiers (voir l'annexe) : je ne tire aucune conclusion de ceux-là.
- **Je n'ai pas lu le moteur d'Éclat en entier.** `engine.js` fait plus de 4 600 lignes. Les points marqués « à vérifier » le sont pour cette raison.
- **Je n'ai pas vérifié le contrat de licence Steam de la démo.** Les recommandations ci-dessous portent sur des idées de conception, jamais sur du code, des textes, des images ou des sons. Rien du projet récupéré ne doit entrer dans le dépôt d'Éclat. Les polices et sons de Clicky ont leurs propres licences.

REA est installé, mais il n'a pas servi : la démo est un moteur Godot dont la logique est du GDScript compilé, que GDRE sait restituer, et non du code natif que Ghidra aurait fallu décompiler.

## 3. Fiche de Clicky Islands

| | |
|---|---|
| Genre | Clicker plus city-builder, run par île, méta-progression |
| Vue / entrée | 2D en tuiles de 16 px, 1920×1080, souris et clavier (maintenir clic gauche, clic droit, raccourcis remappables) |
| Contenu repéré | 76 structures, 50 ressources, 7 unités, 155 perks, 45 artefacts (10 dans la démo), 10 bénédictions, 21 tâches, une cinquantaine de défis en quatre paliers, 12 stades d'île |
| Ton | Humour pince-sans-rire (le Roi veut un nouveau royaume, tu es le Gouverneur qui paie) |
| Langues | 9 (en, de, es, ja, kr, pl, pt-BR, zh-Hans, zh-Hant) |

### La boucle d'une île

1. **Cliquer** sur des ressources (baies, bois, ambre). Maintenir le bouton répète le geste toutes les 0,5 s, divisé par `1 + bonus%` de cadence.
2. **Vendre** : on charge le bateau au port, il part et revient avec de l'or. La capacité et la durée sont des axes d'amélioration.
3. **Recruter** des unités : elles coûtent de la nourriture (30 + n^3,2, réduit par le confort) et il faut une maison libre. On les assigne au clic droit sur un bâtiment ou une ressource.
4. **Bâtir** : chaque bâtiment renchérit le suivant (multiplicateur visible). Démolir ne rembourse pas mais baisse le multiplicateur. Les champs ne le font pas monter. Placement contraint : à côté de montagnes ou d'arbres (+25 % par voisin), pas à côté d'un autre bâtiment du même type, relié par route au port.
5. **Monter l'île de stade** en payant de l'or : 1 000, 14 000, 140 000, 1,2 M, 9,2 M, 36 M, 186 M, 620 M. Chaque stade débloque des bâtiments et rapporte de la Réputation (100, 200, 300, 500, 700, 1 200, 1 800, 2 400).
6. **Explorer** : des tours de guet dissipent la brume (de la Réputation par tuile). Elles révèlent des ruines à casser en maintenant le clic, qui donnent des fossiles. Un médaillon transforme les ruines en nids de monstres.
7. **Partir** (« Set sail ») : l'île est perdue, la Réputation et les fossiles restent.

### Entre deux îles

- **Arbre de perks** (155) acheté en Réputation, remboursable au clic droit (« reset perks » gratuit : on peut expérimenter).
- **Fossiles** : on les brise en cliquant vite sur la table de recherche ; ils donnent un artefact. Un doublon est converti en Réputation.
- **Artefacts** : équipés dans un nombre limité d'emplacements (extensible via l'arbre). Ils changent une règle : « les unités sont remplacées par des chats dont la force alimente tes clics », « chaque clic transforme la cible en or », « commence chaque run avec un volcan à nourrir avant la fin d'un minuteur, sinon la partie est perdue ».
- **Défis** : contraintes volontaires (« sans tour de guet », « sans recruter », « sans bateau ») qui paient plus de Réputation. Plusieurs peuvent être actifs, plafonné par un perk. On les valide en **maintenant** un bouton.
- **Aperçu de la prochaine île** : taille et ressources approximatives.

### Puits et hasard

- **Chaudron / Volcan** : on y verse des ressources jusqu'à un seuil (250 000 au départ, doublé après chaque usage), puis on « remue » : l'écran se fige, trois cartes de bénédiction (Common 50 %, Rare 30 %, Epic 15 %, Legendary 5 %), on en garde une.
- **Scarecrow** : on échange de l'ambre contre des jetons, on les met dans une machine à sous (huit types de gains : or, coffre, poisson, fossile, golem, bénédiction, réputation, jeton). L'animation est calée sur un tempo fixe (126 BPM).
- **Tâches du Roi** (bureau de poste) : une lettre demande d'expédier une ressource en quantité croissante (50 000 jusqu'à 5 000 000), récompense en Réputation (500 jusqu'à 7 000). Douze lettres, un court texte comique chacune.

## 4. Où en est Éclat, face à Clicky

Légende : ✔ déjà là, ◐ partiel, ✘ absent.

| Axe | Clicky Islands | Éclat | État |
|---|---|---|---|
| Récolte au doigt maintenu | répétition 0,5 s, augmentée par perks, double clic 0,1 s plus tard, zone 3×3 | répétition 380 puis 140 ms (`domaine.js:675`), récolte double par « Coup d'œil » | ✔ (réglage différent) |
| Production passive | unités assignées, marchés, tours | extracteurs, machines, hors ligne jusqu'à 12 h | ✔ |
| Méta-progression | Réputation, 155 perks, remboursable | Traces, Mémoire des mains (9 améliorations), Résonances | ✔ |
| Choix variés par cycle | artefacts équipés, bénédictions | dons de la relève (trois cartes, un gardé) | ◐ |
| Décisions en cours de cycle | Chaudron, volcan | aucune | ✘ |
| Objets qui changent une règle | artefacts | « règles par terre », Échos (+50 %) | ◐ |
| Défis volontaires récompensés | ~55 défis, quatre paliers | « succès discrets » prévus, sans récompense | ✘ |
| Récompense du didacticiel | chaque étape rapporte de la Réputation | chapitres sans récompense chiffrée (à vérifier) | ✘ |
| Événement qui récompense l'attention | coffres sur la côte (pirate map), corbeaux | visiteurs de passage | ✔ |
| Livraisons à objectif | Tâches du Roi | Troqueur, Comptoir | ◐ |
| Bilan par cycle | résumé d'île, liste des îles colonisées | stats globales dans Journal → Mémoire | ◐ |
| Retour visuel d'un geste | texte flottant quatre temps, particules, secousse, 29 scènes de particules | flotteur linéaire 900 ms, étincelles, secousse de l'établi 350 ms | ◐ |
| Retour sonore | 3 à 7 variantes par matière, sons de survol et de clic sur tous les boutons | audio synthétisé, une ambiance par lieu | ◐ |
| Confirmation d'un acte lourd | maintenir 1 s avec anneau | confirmation par boîte (à vérifier) | ◐ |
| Accessibilité | clic auto, échelle de l'interface, FPS max, nom d'île aléatoire, remappage clavier | `prefers-reduced-motion`, vibrations réglables | ◐ |
| Récit | lettres humoristiques, peu de lore | récit dense (26 fragments, 21 secrets, 3 fins) | ✔ (Éclat est très au-dessus) |
| Monde | île générée aléatoirement, carte spatiale | carte dessinée, terres fixes | ✘ (choix de conception) |

## 5. Ce qu'on peut reprendre, par domaine

Pour chaque élément : ce que fait Clicky, ce qui est transférable, et à quelles conditions.

### 5.1 Gamefeel

**Texte flottant en quatre temps** (`entities/floating_text/floating_text.gd`)
Apparition de 0 à 1 en 0,15 s en montant de 8 px, dépassement à 1,25 en 0,15 s, retour à 1 en 0,25 s en montant à 48 px et en s'effaçant. Total 0,55 s. Une variante « refus » fait tanguer le texte de ±12 px quatre fois. Un pool d'instances évite la création répétée de nœuds.
- **Transfert : oui, direct.** `floater()` (`ui.js:264`) fait aujourd'hui un fondu sur 900 ms. Une animation CSS en quatre images clés, plus une classe `.float.refus`, suffit.
- **Conditions** : respecter `motionOK()` ; un pool de six à dix éléments si la récolte maintenue (140 ms) en crée plus de sept par seconde ; vérifier le rendu avec `tools/golden-ui.js`.

**Banque de variantes sonores par matière** (`assets/audio`, `interact_*`)
Chaque ressource a son bruit (bois, mine, verre, hydromel, perle, etc.) avec trois à sept variantes tirées au hasard. Les boutons ont un son de survol et un son de clic via un petit nœud réutilisable (`ButtonFeedback`).
- **Transfert : oui, sans fichier audio.** Éclat synthétise tout (`audio.js` : `tone()` et `noise()`). Définir six familles de timbre (bois, pierre, métal, verre, tissu, organique), tirer à chaque coup une hauteur, un filtre et une enveloppe légèrement différents.
- **Conditions** : le projet s'interdit les fichiers audio, donc pas de paquet d'échantillons ; garder l'arrêt de la musique par moments ; un réglage « bruitages » existe déjà. À tester au casque et sur haut-parleur de téléphone : de petites variations de hauteur disparaissent sur un mauvais haut-parleur, il faut des variations de timbre.

**Secousses d'écran dosées** (`camera_shake.gd`, appel `camera_shake(amplitude, fréquence, durée)`)
Petit coup pour un bâtiment posé (2, 4, 0,1 s) ou un coup sur une ruine (1, 4, 0,1 s). Grand coup pour une montée de stade : un grondement long (1,5, 150, 4 s) qui se termine par un choc (20, 3, 0,15 s). Le volcan : (2, 200, 10 s). Une cinématique peut être passée (« SKIP ANIMATION »).
- **Transfert : oui, pour les grands moments seulement** (passage franchi, âge accompli, fin). Sur mobile, associer à `navigator.vibrate([…])` (le motif grondement puis choc est transposable en tableau de durées).
- **Conditions** : jamais pour le geste courant ; désactivé par `prefers-reduced-motion` ; un bouton « Passer » ; ne bloque rien (comme les fêtes actuelles).

**Bouton à maintenir** (`ui/common/hold_button/hold_button.gd`)
L'anneau monte de 0 à 100 en 1 s. Pendant l'appui le bouton tremble (dix mouvements de ±1 à 3° toutes les 75 ms) puis grossit à 1,05. À la validation : particules d'étoiles et son. Au relâchement : retour en 0,1 s. Sert pour acheter une amélioration, prendre un défi, quitter l'île.
- **Transfert : oui, pour les actes lourds et irréversibles** (relève, versement d'un passage entier, remise à zéro).
- **Conditions** : durée de 600 à 700 ms sur mobile (1 s est long au pouce) ; alternative accessible dans les réglages (simple appui avec confirmation) ; vibration brève à la validation. Ne pas l'étendre aux achats courants : Éclat veut des gestes rapides.

**Tempo global** (`beat_manager.gd`, 0,476 s par temps, signal juste avant le temps)
Utilisé uniquement par la machine à sous. Intérêt réduit pour Éclat (voir 7.1). On retient seulement l'idée d'un signal d'anticipation 250 ms avant un événement fort, utile pour préparer une fête.

**Cadence de clic comme axe de progression**
Chez Clicky, la cadence, le double clic et le clic de zone sont des améliorations et des artefacts. Éclat a déjà « Mains calleuses » (multiplicateur) et « Coup d'œil » (récolte double). Une amélioration de **cadence** (réduire les 140 ms de répétition) est possible, mais elle demande de vérifier la charge CPU et la batterie d'un rendu toutes les 100 ms sur téléphone. À mesurer avant.

### 5.2 Gameplay

**Défis volontaires** (`entities/achievement_container`, `resources/achievements`)
Chaque défi est une contrainte (ne pas bâtir de tour, ne pas recruter, ne pas expédier, ne manger que des baies) avec un but à atteindre. Le joueur en active plusieurs avant de partir ; réussis, ils paient de la Réputation. Un perk plafonne le nombre actif. Trois familles de résolveurs côté code : communs, personnalisés, démo.
- **Transfert : oui, c'est la plus forte idée de cette liste.** Appelons-les « Vœux ». Exemples dans la voix d'Éclat : « Passe l'âge de la Pierre sans machine », « Aucune récolte à la main au-delà de l'âge du Cuivre », « Ouvre la Rivière sans avoir étudié une seule matière ».
- **Conditions** : (1) le moteur doit pouvoir poser des drapeaux de contrainte par cycle (`S.voeux`) et les tester là où l'action a lieu ; (2) les Vœux paient des Traces supplémentaires, jamais des Échos ; (3) plafond de Vœux actifs lié à la Mémoire des mains ; (4) un simulateur : `sim-passages.js --voeux` pour vérifier qu'aucun Vœu n'allonge un cycle de plus de 25 % sans le payer ; (5) un test qui vérifie que **toute** contrainte reste franchissable (le validateur actuel fait déjà ce genre de vérification d'atteignabilité) ; (6) ne pas casser les sauvegardes : champ nouveau avec valeur par défaut, migration testée contre `tools/fixtures`.

**Puits à doublement et choix de trois** (`cauldron_manager.gd`, `blessings_manager.gd`)
Objectif de versement qui double à chaque usage, écran de choix qui fige le reste, rareté tirée (50/30/15/5), choix d'une carte sur trois. Il existe aussi un perk qui réduit le coût du puits.
- **Transfert : oui, en réutilisant les dons.** Éclat tire déjà trois dons « reproductibles par graine » à la relève (`D.DONS`, `S.donsOffre`). Une **Offrande** en cours de cycle ouvre un deuxième tirage de trois, avec le même moteur, mais avec des dons plus courts (valables jusqu'à la prochaine relève, ou un âge).
- **Conditions** : (1) coût qui double (garder le même schéma que Clicky : la progression est lisible, le joueur sent le mur) ; (2) le simulateur compare chaque don « sans / avec » comme pour les dons actuels (consigne existante : rester entre −15 % et 0 % sur les temps de passage) ; (3) choix présenté sans bloquer l'écran plus de quelques secondes d'animation ; (4) rareté à quatre niveaux seulement si on a au moins douze effets distincts, sinon trois niveaux ; (5) ne pas confondre avec la fête du passage : deux écrans de récompense consécutifs fatiguent.

**Artefacts équipables** (`globals/artifacts_store`, `resources/artifacts`)
Objets obtenus en brisant des fossiles, équipés dans un nombre limité d'emplacements, avec une description narrative et une règle changée. Raretés Common, Rare, Epic, Legendary. Doublon converti en Réputation.
- **Transfert : oui, plus tard.** Éclat a le matériau narratif (objets à fiche, énigmes, souvenirs). Appelons-les « Reliques ».
- **Conditions** : (1) livrer d'abord les Vœux et l'Offrande, pour voir si la variété manque encore ; (2) chaque relique doit **modifier une règle**, pas ajouter un pourcentage (les pourcentages existent déjà dans la Mémoire des mains) ; (3) pas plus de douze au départ ; (4) deux ou trois emplacements au maximum, avec une fenêtre d'équipement lisible au doigt (touch cibles de 44 px) ; (5) un test qui joue chaque relique pendant le simulateur ; (6) l'obtention doit passer par les explorations déjà présentes, pas par un système parallèle.

**Tâches à objectif croissant** (`tasks_manager.gd`)
Lettres du Roi (50 000 à 5 000 000), récompense croissante (500 à 7 000), tirage aléatoire parmi les ressources produisibles à ce stade.
- **Transfert : partiel.** Le mécanisme (commande à quantité croissante, tirée parmi ce que le joueur sait produire) recoupe le Troqueur et le Comptoir d'Éclat. À examiner ensemble, sans ajouter un troisième système. Le **ton de lettre** (une scène en trois phrases, sans dialogue) est la partie utile, mais le pastiche comique ne colle pas à la voix d'Éclat.
- **Conditions** : si on fusionne avec le Troqueur, écrire les textes avec les règles de `docs/STYLE.md` (deux couches, jeu puis récit).

**Récompense de didacticiel** (`tutorials_manager.gd`, `TutorialResource.reputation_reward`)
Chaque étape terminée donne de la Réputation après une seconde de délai (un petit temps d'anticipation). Un compteur « (n/N) » est affiché dans l'objectif.
- **Transfert : oui, coût minimal.** Une petite quantité d'Intuition ✨ à chaque chapitre du tutoriel, une fois par sauvegarde, pas par relève (sinon on récompense de revoir le didacticiel).
- **Conditions** : ne rien donner qui change la boucle (quelques points seulement) ; ne pas pousser à terminer le didacticiel si le joueur veut passer : « Passer » doit rester sans pénalité.

**Courbe de confort comme paramètre unique** (`units_comfort_resolver.gd`)
Une moyenne unique (confort des maisons) est lue à travers trois courbes (temps de recrutement, force des unités, coût en nourriture). Les réglages d'équilibre vivent dans des `Curve` éditables, pas dans des formules.
- **Transfert : un patron, pas une fonctionnalité.** Les barèmes d'Éclat sont dans `data.js` (coûts des passages ×4 à ×6, Mémoire ×1,8 par niveau, Résonances ×2,3 à ×2,5). Sortir quelques barèmes en tables de points interpolées rendrait le réglage plus visuel dans `tools/sim-passages.js`. Faible priorité.

### 5.3 UI/UX

**Résumé de vie** (« Island summary », liste des îles colonisées)
À la fin d'une île, un récapitulatif ; dans les statistiques, la liste des îles.
- **Transfert : oui.** Un **bilan du Semeur** à la relève (durée, terres ouvertes, passage atteint, Traces gagnées, matière la plus produite) et un **Livre des Semeurs** : une ligne par cycle. La structure narrative colle (« un nouveau Semeur s'éveille »).
- **Conditions** : stocker une ligne compacte par cycle dans `S.meta` (champ nouveau avec défaut) ; borner à 50 lignes ; un texte court par cycle écrit en deux couches (chiffres, puis une phrase).

**Aperçu avant de partir** (« Next island settings »)
Écran qui montre taille et ressources approximatives de la prochaine île.
- **Transfert : partiel.** Éclat montre déjà « ce que rapporterait une relève » dans la Mémoire des mains. Ajouter ce que le **prochain Semeur** emportera (paquetage, terres déjà ouvertes, don choisi) avant de confirmer.
- **Conditions** : ne pas ajouter d'écran : enrichir la fenêtre existante.

**Étiquettes d'état sur les objets** (`NO ROAD`, `NO UNIT`, `BLOCKED`, `NEED BUILDING`, `NO STONE`)
Un mot en majuscules directement sur ce qui ne fonctionne pas, plus un message qui dit quoi faire.
- **Transfert : déjà fait**, selon le README (« les messages de blocage nomment toujours ce qu'il faut »). À valider sur les lignes du Domaine : tout gisement ou machine à l'arrêt doit afficher sa cause sans toucher.

**Pastille d'indicateur d'onglet** (`side_tab_indicator`, `available_fossil_indicator`)
Un point sur un onglet quand quelque chose de nouveau y attend.
- **Transfert : oui, si absent.** À vérifier sur les quatre onglets (Domaine, Carte, Atelier, Journal) : une pastille quand une recette est étudiable, un passage payable, un don à choisir. Ne pas multiplier les points : deux couleurs au plus.

**Mode « inspecter »** (touche maintenue pour afficher plus d'informations ; acheter d'un coup tous les niveaux abordables)
- **Transfert : en partie.** Les boutons ×10, ×50, ×100, ×1 000 et Max existent déjà. L'affichage détaillé au survol n'a pas de sens au doigt ; l'équivalent mobile est le basculement « Vue dense » déjà présent.

**Infobulles à épingler** (clic droit)
- **Écarté pour l'interaction, déjà couvert dans l'esprit** : Éclat a les épingles ☆ dans le Carnet et les fiches cliquables. Pas de clic droit sur mobile.

**Tutoriel en objectifs avec compteurs** (« Collect {goal} Wood ({current}/{goal}) »)
Chaque étape a un but chiffré et un compteur.
- **Transfert : oui, partiellement.** L'objectif d'Éclat « dit une seule chose à faire ». Ajouter un compteur quand l'objectif est une quantité, et éviter les phrases de rappel qui répètent le tutoriel.

**Verrou de saisie** : tout bouton important est plus gros que les autres, et les fenêtres de récompense ont un seul bouton (« Claim », « Continue »).
- **Transfert : oui, règle de conception.** Une fenêtre de récompense = un bouton principal.

### 5.4 Level design

Clicky génère une île aléatoire (16×16 au départ, jusqu'à dix niveaux d'agrandissement via un perk), avec une carte de falaises et des poids par type de ressource. Une île peut manquer d'une ressource : un tag « NO STONE » / « NO WATER » prévient à l'écran. Des coffres apparaissent sur la côte (artefact « carte au trésor »), un volcan impose un minuteur (artefact « masque »).

- **Transfert : léger.** Éclat a des terres dessinées à la main, c'est son parti pris. En revanche, la **variation d'un cycle à l'autre** est un vrai besoin d'un jeu à relèves. Proposition : un **aléa de terre par cycle** (par exemple « La Rivière est à sec : sans nasse » ou « Les Collines sont riches : +25 % de cuivre »), tiré avec la graine du cycle, affiché sur la Carte avant la relève.
- **Conditions** : Éclat a déjà des « règles par terre » (`D.PASSAGES`, règle du courant). Un aléa s'ajoute comme une règle de plus ; il doit être **toujours franchissable** (test d'atteignabilité) et jamais punitif au premier cycle. À étudier après les dons et l'Offrande pour ne pas empiler les sources de variété.
- **Non transférable** : le placement sur grille, les adjacences, le réseau de routes et la brume tuile par tuile. Éclat est une page qui défile, jouable d'un pouce.

### 5.5 Ergonomie

| Constat chez Clicky | Éclat |
|---|---|
| Maintenir le clic gauche, clic droit pour assigner ou rembourser | Mobile : appui long à la place du clic droit, jamais requis pour une action essentielle |
| Raccourcis clavier remappables, caméra aux flèches | Le clavier existe déjà (`ecouteurs.js:252`). Un tableau des raccourcis dans le menu suffit |
| Échelle de l'interface, FPS max, plein écran | Une **échelle de texte** (réglage) est à vérifier ; le reste n'a pas de sens sur PWA |
| Clic automatique en option (accessibilité) | Éclat a déjà la récolte continue ▶ |
| « Ouvrir tous les fossiles d'un coup » | Même idée à garder pour tout empilement de récompenses : une case « tout ouvrir » |
| Noms d'îles aléatoires (case « toujours » dans les réglages) | À retenir si Éclat nomme un jour les Semeurs |
| Fenêtre de départ qui dit ce qu'on perd et ce qu'on garde | Éclat le fait déjà avec des chiffres |

## 6. Ce qui manque à Éclat (après Clicky)

Par ordre de valeur sur coût, avec ce que cela touche.

1. **Défis volontaires récompensés** (Vœux). Rejouabilité, sens de la maîtrise. Coût moyen (moteur plus simulateur).
2. **Retour de geste soigné** : flotteur en quatre temps, variantes sonores synthétisées, secousse et vibration pour les grands moments. Coût faible, tous les joueurs le perçoivent.
3. **Décision en cours de cycle** : l'Offrande, avec un choix de trois. Réutilise les dons.
4. **Bilan et Livre des Semeurs.** Donne un sens narratif aux cycles. Coût faible.
5. **Récompense symbolique du didacticiel** et compteurs sur les objectifs chiffrés. Coût très faible.
6. **Geste lourd à maintenir** (relève, gros versement). Évite les erreurs de pouce. Coût faible.
7. **Reliques équipables.** Forte rejouabilité, coût élevé : à décider après les points 1 et 3.
8. **Aléa de terre par cycle.** Coût moyen, à décider après le point 3.

À vérifier avant de s'engager : le comportement réel de la confirmation d'une relève, la présence d'une pastille sur chaque onglet, une échelle de texte, et le coût réel des extracteurs (pour savoir si un « multiplicateur lisible » aurait un sens).

## 7. Ce que j'écarte, et pourquoi

### 7.1 Machine à sous du Scarecrow
Échange d'ambre contre des jetons, huit gains tirés au hasard, animation sur tempo fixe.
- C'est un mécanisme de jeu de hasard avec une monnaie intermédiaire. Éclat refuse les pubs récompensées, les énergies et les monnaies en plus (`AUDIT-INSPIRATIONS.md`, section 5). Ça ouvre aussi un risque de classement d'âge ou de refus en boutique pour une application destinée à un public large.
- **Ce qu'on garde** : l'idée que l'anticipation (un signal juste avant l'événement) rend une récompense plus savoureuse. Elle sert aux fêtes, sans hasard payant.

### 7.2 Vidéos de tutoriel
57 fichiers vidéo, 55 Mo dans l'archive du jeu (versions japonaise et chinoises comprises), lancés à chaque étape.
- Poids incompatible avec un jeu installable qui « fonctionne sans dépendance » et hors ligne. Les bulles qui pointent l'endroit à toucher d'Éclat sont plus adaptées à un écran de 6 pouces.

### 7.3 Info-bulles au survol, clic droit, raccourcis de souris
- Pas de survol ni de clic droit sur un téléphone. Remplacés par l'appui long et les fiches cliquables, déjà là.

### 7.4 Grille, routes, adjacences, brume par tuile, placement
- Cœur de Clicky, étranger à Éclat. Le geste (appliquer une action à des matières) est une autre idée de jeu. Les copier ferait un second jeu.

### 7.5 Unités, maisons, confort, nourriture
- Le système demande une population visible et des tâches assignées. Éclat n'a pas d'équipage : le Semeur travaille seul, avec ses « mains » et des extracteurs. Introduire des habitants changerait le récit (« pourquoi es-tu seul ? »).

### 7.6 Combat : tours de guet, monstres, golems, pals
- Hors sujet pour un jeu de craft contemplatif. Les nids de monstres sont une manière de transformer une exploration en risque ; Éclat obtient cet effet par ses explorations de 15 s à 5 min.

### 7.7 Multiplicateur de coût de construction que la démolition abaisse
- Éclat récompense l'accumulation (seuils à 10, 25, 50, 100 extracteurs, ×1,25 chacun). La démolition qui baisse le prix pousse à l'inverse. Les deux règles se contredisent.

### 7.8 Style 1-bit, CRT, éclairage
- Éclat a une identité (carnet de terrain, papier, encre, ornement par époque). Un filtre CRT la casserait.

### 7.9 Intégration Steam, traductions en neuf langues, fenêtre de liste de souhaits
- Hors périmètre. La traduction pourra être traitée plus tard ; c'est une décision de produit.

### 7.10 Nombres jusqu'à 100 milliards
- Le dernier stade de Clicky coûte 100 000 000 000 d'or. Éclat a déjà tranché : pas de « chiffres énormes pour eux-mêmes ».

### 7.11 Humour pastiche (lettres du Roi, descriptions d'artefacts)
- Le style de Clicky est drôle mais d'une autre famille. `docs/STYLE.md` demande au plus un clin d'œil par écran, sans pastiche ni tournure traduite. Je ne reprends aucun texte.

## 8. Plan d'intégration

Chaque version est livrée seule, avec le simulateur pour l'équilibre et un test dans le navigateur, comme le recommande `AUDIT-INSPIRATIONS.md`. Les numéros sont indicatifs : Éclat en est à 0.12.

### Version A : le toucher (effort faible)

Objectif : même mécanique, meilleur ressenti.

| Tâche | Fichiers | Critère d'acceptation |
|---|---|---|
| Flotteur en quatre temps et variante « refus » | `js/ui.js` (`floater`), `css/style.css` | ≤ 0,6 s de vie, aucun saut visuel à 140 ms de répétition, rien si `prefers-reduced-motion` |
| Banque de variantes sonores par famille de matière | `js/audio.js`, `js/data.js` (famille par objet) | six familles, au moins trois variantes audibles, aucun fichier audio ajouté |
| Secousse et vibration des grands moments | `js/ui.js` (`fete`, `vibe`), `css/style.css` | uniquement passage, âge, fin ; bouton Passer ; désactivé par réglage |
| Geste à maintenir pour relève et gros versement | `js/memoire.js`, `js/domaine.js` | 600 à 700 ms, anneau visible, alternative accessible, annulation en relâchant |
| Compteurs sur les objectifs chiffrés | `js/quetes.js` | « (n/N) » affiché, jamais pour un objectif sans quantité |

Tests : `npm test`, `tools/golden-ui.js` (mettre à jour les références volontairement), essai sur un vrai téléphone (rendu et batterie).
Risque : la répétition de la récolte maintenue crée beaucoup d'éléments ; mesurer.

### Version B : mémoire des cycles (effort faible)

| Tâche | Fichiers | Critère |
|---|---|---|
| Bilan du Semeur à la relève | `js/memoire.js`, `js/engine.js` (`S.meta.vies`) | une ligne par cycle, bornée à 50, migration sans perte |
| Livre des Semeurs | `js/journal.js` | liste lisible, une phrase de récit par cycle écrite avec `STYLE.md` |
| Récompense symbolique du didacticiel | `js/tuto.js`, `js/engine.js` | une fois par sauvegarde, quantité négligeable |
| Pastilles d'onglet manquantes | `js/ui.js` | deux couleurs, jamais sur plus de deux onglets à la fois |

Tests : fixture de sauvegarde v6 dans `tools/fixtures/`, test de migration.

### Version C : les Vœux (effort moyen, la pièce maîtresse)

1. **Spécifier** dans un document `docs/VOEUX.md` : liste de douze Vœux, contrainte, but, Traces. Appliquer `docs/STYLE.md`. Relecture par l'auteur avant tout code.
2. **Moteur** : `S.voeux = { actifs: [], faits: [] }`, un point d'entrée `voeuOk(action)` appelé aux endroits où la contrainte peut être violée (fabrication à la main, usage d'une machine, étude d'une matière).
3. **Données** : `D.VOEUX` dans `data.js` avec une contrainte déclarative, pas du code.
4. **Interface** : choix des Vœux dans la fenêtre de relève (avec confirmation à maintenir), pastille « Vœu en cours » dans l'objectif.
5. **Équilibre** : `tools/sim-passages.js --voeux`, un joueur automatique qui respecte la contrainte, pour chaque Vœu.
6. **Validation** : `tools/validate.js` vérifie que chaque Vœu laisse au moins un chemin vers le passage visé.

Critère d'arrêt : si plus de deux Vœux sur douze sont jugés « frustrants » en essai, on en retire ou on assouplit avant de publier. Un Vœu raté ne retire rien, il ne rapporte seulement pas.

### Version D : l'Offrande (effort moyen)

1. Un lieu dans le Domaine (une carte « Offrande ») qui absorbe des matières choisies jusqu'à un seuil (la base se règle au simulateur ; le doublement de Clicky est le point de départ).
2. À la fin du versement, trois dons de cycle tirés avec la graine existante ; le joueur en garde un.
3. Réutiliser `D.DONS` en ajoutant une durée (jusqu'à la relève ou jusqu'à l'âge suivant).
4. Une fête, puis un seul écran de choix. Pas de rareté à quatre niveaux tant qu'on a moins de douze effets.

Tests : `node tools/sim-passages.js --dons` étendu ; contrôle d'atteignabilité ; essai de la file d'écrans (pas de fête et de choix consécutifs).

### Version E : décisions futures (à ne décider qu'après C et D)

- **Reliques équipables.** Trois emplacements au plus, douze reliques au départ, chacune change une règle.
- **Aléa de terre par cycle**, affiché sur la Carte avant la relève.
- **Cadence de récolte** comme axe d'amélioration, si la mesure de batterie est bonne.

### Ordre conseillé et dépendances

```
A (toucher) ──┬─> C (Vœux) ──┐
              │              ├─> E (Reliques, aléa de terre)
B (cycles) ───┴─> D (Offrande) ┘
```

A et B sont indépendantes et peuvent partir tout de suite. C et D peuvent se faire en parallèle si deux personnes travaillent sur des fichiers différents (`data.js` et `engine.js` sont partagés : attention aux conflits, `engine.js` fait déjà 4 600 lignes).

### Mesures de succès

- Temps de passage inchangé (±15 %) pour un joueur sans Vœu ni don.
- Au moins un joueur de test sur trois choisit un Vœu à la deuxième relève.
- Aucune plainte sur le son répétitif après dix minutes de récolte maintenue.
- Aucune sauvegarde existante cassée (fixtures v1 à v5 rejouées).

### Risques généraux

- **Empilement de nouveautés** : Éclat a déjà dons, visiteurs, seuils, jours, arbre de connaissance, Mémoire en arbre. Chaque ajout doit en remplacer un usage, pas s'y ajouter. D'où l'ordre : retours de geste d'abord (aucune règle nouvelle), puis un seul système de variété à la fois.
- **Mobile d'abord** : tout ce qui est testé à la souris doit l'être aussi au pouce, sur un petit écran et sur un téléphone moyen.
- **Écriture** : « c'est exactement l'endroit où "écrit par une IA" se voit » (note d'`AUDIT-INSPIRATIONS.md`). Les textes des Vœux et des dons demandent une relecture humaine.

## Annexe A. Chiffres relevés dans la démo

Coûts de stade d'île (or) et Réputation associée, tels qu'enregistrés dans `resources/island_progress_stage` :

| Stade | Coût | Réputation |
|---|---:|---:|
| Settlement | 1 000 | 100 |
| Settlement II | 14 000 | 200 |
| Village | 140 000 | 300 |
| Village II | 1 200 000 | 500 |
| Town | 9 200 000 | 700 |
| Town II | 36 000 000 | 1 200 |
| City | 186 000 000 | 1 800 |
| City II | 620 000 000 | 2 400 |
| Capital | 4 800 000 000 | 5 200 |
| Capital II | 860 000 000 | 7 699 |
| Kingdom | 100 000 000 000 | 10 000 |

Capital II (860 M) est inférieur à Capital (4,8 G) alors qu'il vient après : valeurs probablement en cours de réglage dans la démo. Le rapport entre deux stades passe de ×14 au début à ×3 à ×5 ensuite ; la Réputation, elle, ne fait que doubler à peu près. Éclat a un ordre de grandeur comparable (×4 à ×6 entre passages).

Autres formules :

- Coût de recrutement : `30 + n^3,2` en nourriture, multiplié par le pourcentage de nourriture du confort (plancher à 25 %).
- `GameUtils` contient quatre formules de coût de la forme `valeur + (n × m)^p × c` (p entre 1,6 et 3,2). Je n'ai pas relié chacune à son usage (bâtiments, améliorations) : à vérifier si on veut les comparer aux barèmes d'Éclat.
- Cadence de clic : intervalle `0,5 / (1 + bonus% / 100)` secondes.
- Rareté des bénédictions : Common 50, Rare 30, Epic 15, Legendary 5.
- Tâches : buts 50 000, 75 000, 100 000, 150 000, 200 000, 300 000, 600 000, 1 M, 1,5 M, 2 M, 3 M, 5 M ; récompenses 500, 750, 1 000, 1 250, 1 500, 2 000, 2 500, 3 000, 3 500, 4 000, 5 000, 7 000.

## Annexe B. Fichiers de Clicky qui m'ont servi

Dans le projet récupéré (`%TEMP%\clicky-recovered`, à supprimer une fois cet audit exploité) :

- Gamefeel : `entities/floating_text/floating_text.gd`, `common/camera_shake/camera_shake.gd`, `ui/common/hold_button/hold_button.gd`, `ui/common/button_feedback.gd`, `globals/beat_manager/beat_manager.gd`, `common/cutscene/instances/*.gd`.
- Gameplay : `entities/player_controller/states/idle_state.gd`, `entities/units_manager/resolvers/*.gd`, `entities/cauldron_manager/cauldron_manager.gd`, `entities/blessings_manager/blessings_manager.gd`, `entities/tasks_manager/tasks_manager.gd`, `globals/tutorials_manager/tutorials_manager.gd`, `globals/game/game_utils.gd`.
- Données : `resources/island_progress_stage`, `resources/upgrade`, `resources/skills`, `resources/artifacts`, `locale/locale.csv` (colonne `en`).

## Annexe C. Questions ouvertes

1. Veux-tu que je joue la démo (captures d'écran et notes de ressenti) avant d'engager la version A ? C'est la seule manière de confirmer ce qui est ici déduit du code.
2. Les Vœux doivent-ils payer des Traces, des Échos, ou une troisième chose ? Les Échos sont réservés aux fins : je propose les Traces.
3. Où ranger ce document : `docs/AUDIT-CLICKY-ISLANDS.md` dans le dépôt ? Il ne contient aucun secret du récit.
