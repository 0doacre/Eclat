# Audit de Cell to Singularity, et ce qu'il peut apporter à Éclat

Rédigé le 24 octobre 2026. Cible : `C:\Program Files (x86)\Steam\steamapps\common\Cell to Singularity` (Computer Lunch, Unity, build Mono, jeu complet avec l'extension Reality Reboot). Destinataire : le dépôt `0doacre/craftgame` (Éclat). Mêmes conventions que `docs/STYLE.md` : tutoiement, pas de tiret cadratin. Ce document complète `AUDIT-CLICKY-ISLANDS.md` et en reprend les versions A à E.

## 1. Résumé

Cell to Singularity est le cousin le plus proche d'Éclat parmi les deux jeux audités : un incrémental qui traverse l'histoire de la vie puis de la technique, de la cellule à la singularité, comme Éclat va du silex à la sphère de Dyson. Il a aussi une relève (le « Reboot ») et une méta-monnaie (les Metabits). C'est donc un bon étalon.

Il est en revanche l'opposé d'Éclat sur l'économie du jeu : au moins dix monnaies ou ressources nommées, des publicités récompensées, des offres spéciales, des classements, des événements à durée limitée. Tout cela est écarté. Ce qui se transpose tient en peu de choses, mais certaines sont précieuses :

1. **Un compteur de prestige qui se remplit en direct.** Les Metabits s'accumulent pendant la partie, avec une barre vers le prochain, et le joueur choisit son moment pour redémarrer. Éclat ne crédite les Traces qu'aux passages.
2. **Un simulateur d'équilibrage à profils de joueurs.** Le jeu embarque son propre `AutoSim` (modes, profils, sessions en ligne et hors ligne). Les versions C et D de l'audit Clicky en dépendent ; le simulateur d'Éclat n'a qu'un paramètre (les tapes par seconde).
3. **Un rebond au relâchement des boutons principaux** (réduction à l'appui, dépassement au relâchement). Éclat réduit déjà à l'appui, il manque la seconde moitié.
4. **Une couche de savoir réel** attachée aux objets et aux succès. Le plus gros chantier, et le plus risqué : il engage le ton du jeu.
5. **Des petites choses utiles** : un cadeau de temps accéléré, des tutoriels qui sont aussi les premiers succès, un mode photo, un canal de retour joueur.

## 2. Méthode et limites

Outils utilisés, tous installés avec ton accord dans `%TEMP%\c2s-tools` (rien d'installé globalement) :

- **REA** (`inspect_managed_artifact`) : identification de `Assembly-CSharp.dll` (5,7 Mo, runtime `unity-mono`, 4 519 types, métadonnées complètes). REA ne décompile pas le C# ; il a servi à confirmer la nature de la cible.
- **ilspycmd 9.1.0.7988** (NuGet) : décompilation. Elle s'est interrompue par un dépassement de pile : **1 299 classes** ont été produites sur les quelque 4 500 types. `Calculator` a été reprise à part ; d'autres classes (par exemple `UIButtonBounce`) sont absentes ou vides.
- **UnityPy 1.25.4** (PyPI) : lecture des `.assets`. Le texte vient de la source de localisation I2 (`LanguageSourceAsset`, 23 Mo). La lecture structurée a échoué ; j'ai fait un balayage d'octets des chaînes, ce qui donne environ 16 700 couples terme/valeur, avec du bruit venant des autres langues.

Ce que je n'ai pas fait :

- **Je n'ai pas joué.** Le ressenti vient du code et des textes.
- **Je n'ai pas lu les scènes ni les sprites.** Les écrans (disposition, tailles, couleurs hors `Constants`) ne sont pas décrits ici.
- **Les chiffres d'équilibrage des générateurs** (coûts, rendements) sont dans des assets de données que je n'ai pas déchiffrés. Seules les formules du code (prestige, expérience) sont citées.
- **Je n'ai pas vérifié les conditions d'utilisation** du jeu. Comme pour Clicky : des idées de conception uniquement. Aucun texte, son, image ni code ne doit entrer dans le dépôt d'Éclat. Les textes éducatifs de Cell to Singularity sont protégés ; si une couche de savoir réel est écrite pour Éclat, elle repart de sources publiques citées.

## 3. Fiche de Cell to Singularity

| | |
|---|---|
| Genre | Incrémental à taper, arbre d'évolution, relève par « Reboot » |
| Plateforme | Mobile d'abord, aussi sur PC (souris et manette via Rewired) |
| Modèle économique | Service en ligne : publicités récompensées, offres spéciales, boutique de cosmétiques, classements, événements |
| Langues | Une vingtaine, d'après l'extraction (dont l'anglais, le français, l'allemand, le portugais, le russe, le chinois, le japonais, le vietnamien, l'indonésien, le polonais, l'italien, l'ukrainien) |
| Contenu repéré | 391 termes de technologies et 636 termes d'objets de l'arbre (descriptions comprises, donc environ 200 et 300 éléments), plusieurs centaines de succès, 12 « jardins », une phase spatiale (« The Beyond »), une phase dinosaures, au moins une quinzaine d'événements thématiques |

### Le cœur du jeu

- **Entropie** : produite en tapant et par des générateurs. **Idées** : débloquées par le nœud « Première idée » (cerveau de singe), avec leur propre geste de tape et leur propre branche. Les deux sont les monnaies de dépense courantes.
- **Arbre de la Reality Engine** : chaque nœud (cellule eucaryote, queue en panache, œil à pigment, cerveau humain, puis technologies : feu, imprimerie, circuit intégré, singularité) se débloque contre des monnaies et en révèle d'autres.
- **Jardins** : douze scènes (micro, océan, terre, humains, âges moyens, atome, singularité, Mars, dinosaures, simulacre, constellation, interstellaire) où les nœuds achetés apparaissent comme des êtres ou des objets. Le joueur « explore le jardin pour voir la progression de sa simulation ».
- **Reboot** : l'Entropie cumulée est convertie en **Metabits** qu'on dépense pour améliorer la simulation. La relève dévoile aussi de nouveaux nœuds.
- **Niveau de recherche** (expérience globale) : gagné en collectant les monnaies, il rapporte des **puces de recherche** à dépenser dans un panneau de simulation, et verrouille des portes (« Atteins le niveau de recherche N »).
- **Nanobots** : un auxiliaire qui tape à 3 coups par seconde ou qui achète des générateurs à ta place. Quatre charges, jusqu'à douze emplacements, un temps de recharge de 300 s à 900 s, rechargeable en regardant une publicité ou en payant.
- **Flux de temps** : un consommable qui avance la simulation de plusieurs heures. Boost « overdrive » plafonné à 4 h.
- **Missions** : objectifs à verbe (Collecter, Chercher, Photographier, Monter de rang, Sauvegarder, Taper, Déclencher, Acheter, Utiliser, Redémarrer, Remplir, Avoir, Dépenser, Percer).
- **Succès** : plusieurs centaines. Chacun a un titre, un fait réel (souvent avec une blague) et une condition notée à la fin de la description.
- **Phases dédiées** : les dinosaures (cartes de traits rares et épiques, rang, prestige qui garde les cartes, doublons convertis en monnaie) et **The Beyond** (envoi de missions d'astronomie vers des astres, séries de cartes, constellations).
- **Événements thématiques** (champignons, télescope Webb, thé, pollen, philosophie, musique, chats, etc.) : chacun est un mini-chapitre avec 80 à 150 textes, un classement par division et une fin.

### La conception qu'on peut regarder de près

- **Formule du prestige** (`Calculator.cs`) : rang = `⌊ racine cubique(total cumulé) / 10 000 − 1 ⌋`, et le coût du rang suivant est `((rang+1) × 10 000)^3`. Doubler les Metabits demande donc de multiplier par huit la production cumulée. C'est une courbe classique, à rendements décroissants.
- **Le crédit est en direct.** `AscensionBank` recalcule le gain à chaque tick, l'ajoute à la banque du convertisseur, affiche « +N » et une barre pour la fraction du prochain. Le tutoriel dit « tu peux mettre à niveau la simulation quand tu veux pour extraire les Metabits de ton convertisseur ».
- **Expérience globale** : l'objectif du niveau L vaut `10¹⁰ × L^(2,08 + 1,79 × L)`, multiplié par des puissances qui s'enclenchent à 45, 70, 80, 100, 150, 200, 250, 300, 400, 500, 600, 700… Croissance sur-exponentielle, hors de portée de tout équilibrage lisible.
- **Simulateur embarqué** (`AutoSim`) : modes `COMPLETE`, `SKIP`, `OFFLINE`, `REALITY`; profils de joueur et de reboot; tapes par seconde; durée en ligne maximale (4 h) et hors ligne (4 h); achat « optimal » ou « moins cher »; boosts nuls, de base ou maximaux; départ à `item_sun`, arrivée à `tech_singularity`. Ses rapports alimentent un jeu de données de réglage (achats principaux, achats d'événements).
- **Sauvegarde** : la conversion de la sauvegarde pour le Reality Reboot fait une copie `BeforeRealityRebootSaveConversion.gd` avant de commencer et reprend là où elle s'est arrêtée (étapes `Started`, `InitialConversion`, `WaitingForSim`, `ConversionComplete`).

## 4. Où en est Éclat, face à Cell to Singularity

Légende : ✔ déjà là, ◐ partiel, ✘ absent.

| Axe | Cell to Singularity | Éclat | État |
|---|---|---|---|
| Progression de la préhistoire au futur | arbre d'évolution puis de technologies | treize âges de la technique | ✔ |
| Relève avec méta-monnaie | Reboot, Metabits | relève, Traces, Mémoire des mains | ✔ |
| Gain de prestige visible en direct | convertisseur qui se remplit, barre vers le suivant | pastille ✦ à partir d'un passage, « ce que rapporterait une relève » | ◐ |
| Production hors ligne | « Bon retour, Architecte », taux hors ligne | « Pendant ton absence », jusqu'à 12 h | ✔ |
| Consommable de temps accéléré | Flux de temps | aucun | ✘ |
| Automatisation | nanobots (charges, recharge payante) | extracteurs, machines, file des mains | ✔ (sans attente payante) |
| Objectifs guidés | missions à verbe, succès-tutoriels | objectif unique, tutoriel en chapitres | ✔ |
| Tutoriel qui rapporte | succès `Tut_*` (DNA, Darwin, photo, sauvegarde…) | chapitres sans récompense | ✘ |
| Succès | plusieurs centaines | « succès discrets » prévus | ✘ |
| Couche de savoir réel | fait vrai sur presque chaque nœud et succès | énigme et récit, rien de réel | ✘ |
| Visualisation de la progression | 12 jardins | carte dessinée, paysages par terre, Cosmos | ◐ |
| Partage | mode photo | aucun | ✘ |
| Retour des joueurs | fenêtre « Donne ton avis » | aucun lien trouvé dans le code | ✘ |
| Retour visuel au tap | rebond (appui, relâchement) | réduction à l'appui seulement | ◐ |
| Équilibrage outillé | `AutoSim` à profils | `tools/sim.js` à un paramètre, `sim-passages.js` | ◐ |
| Notation des grands nombres | réglable, expliquée au premier seuil | unités jusqu'à 1e24 puis exposant | ◐ |
| Événements aléatoires | astéroïdes d'or, géodes, naines rouges, comètes | visiteurs de passage | ✔ |

## 5. Ce qu'on peut reprendre, par domaine

### 5.1 Gameplay

**Compteur de prestige vivant** (`AscensionBank.cs`, textes `tut_entropy_con_*`)
Pendant la partie, les Metabits sont crédités au fil de l'eau, une barre montre la fraction du prochain, le gain par seconde est affiché. Le joueur décide donc du moment, sans avoir à calculer.
- **Transfert : oui, adapté.** Les Traces d'Éclat tombent par paliers (2, 3, 5, 8, 12…) quand un passage est franchi, pas en continu. L'équivalent honnête est une jauge qui montre **le prochain palier** : « 62 % du passage vers la Rivière : +5 Traces à la relève ». Pas de calcul nouveau, seulement une lecture du versement déjà tenu dans `S.pass[zone].paid`.
- **Conditions** : ne pas inventer de gain fractionnaire (rien ne se crédite avant le franchissement) ; la jauge est en lecture seule ; elle remplace une information existante (la pastille ✦) au lieu de s'y ajouter ; test : la jauge n'affiche jamais plus que ce que la relève donnerait.

**Flux de temps** (`w_boost_time`, `tut_time_flux_*`, `MAX_OVERDRIVE_BOOST = 14 400 s`)
Un objet qui avance la partie de quelques heures d'un coup, plafonné.
- **Transfert : oui, comme cadeau uniquement.** Éclat a déjà le calcul d'absence ; un cadeau « une veillée de 2 h » n'est qu'un appel à ce calcul. Il trouve sa place parmi les cadeaux des jours de présence (3, 7, 14, 30, 60, 100) ou d'un visiteur rare.
- **Conditions** : jamais en vente, jamais lié à une pause d'attente (chez Cell to Singularity, les boosts font partie du forfait « sans pub ») ; plafond à deux heures ; compter dans `stats.play` à part pour ne pas fausser le simulateur ; texte clair (« Tu as dormi deux heures de plus »).

**Tutoriel qui est aussi un succès** (`Achievement_Tut_*`, `Achievement_tut_dashboard`, `…_tut_photo`, `…_tut_save`)
Terminer une étape du tutoriel débloque un succès avec une petite récompense. Les missions à verbe (Taper, Acheter, Sauvegarder…) guident les premières minutes.
- **Transfert : oui.** Rejoint ce que l'audit Clicky propose (une récompense symbolique d'Intuition ✨ par chapitre). Les chapitres de `js/tuto.js` deviennent aussi les premiers « gestes remarqués » de `docs/A-FAIRE.md`.
- **Conditions** : une fois par sauvegarde, pas par relève ; aucun chapitre ne devient obligatoire ; « Passer » reste sans effet sur le reste.

**Doublon converti en monnaie** (`d_warning` : « certaines cartes sont converties en Mutagen »)
Quand une carte est au niveau maximum, l'excédent est converti. Clicky Islands fait la même chose avec les fossiles (doublon en Réputation).
- **Transfert : oui, pour les Reliques de l'audit Clicky.** Deux jeux, deux auteurs, même règle : c'est un bon signe. À retenir pour la version E.

### 5.2 Gamefeel

**Rebond d'un bouton** (`EarthBounce.cs`)
À l'appui, l'objet rétrécit de `0,03 × 6` (18 %) en 0,10 s. Au relâchement, il passe à `+0,04 × 6` (24 %) puis revient en 0,07 s (aller-retour). Sans effet du temps de jeu (il rebondit même en pause). Les tweens précédents sont annulés pour éviter l'empilement.
- **Transfert : oui, simple.** Éclat réduit déjà à l'appui (`.btn:active { transform: scale(.96) }`, `style.css:219`). Il manque le dépassement au relâchement. Une animation CSS déclenchée sur `pointerup` pour les actions principales (récolter, fabriquer) suffit.
- **Conditions** : garder les amplitudes d'Éclat (3 à 6 %, pas 18 à 24 %, les cibles sont déjà petites) ; seulement sur les boutons qui déclenchent le geste de base ; pas de rebond sur les listes ; `prefers-reduced-motion` respecté.

**Secousse de caméra bruitée** (`CamShake.cs`)
Une intensité et une amplitude qui passent progressivement d'une valeur à l'autre sur une durée donnée (Perlin), au lieu d'une oscillation fixe.
- **Transfert : en renfort de la version A de l'audit Clicky.** Pour les grandes fêtes, une courbe qui monte puis retombe se lit mieux qu'un tremblement constant.
- **Conditions** : mêmes que pour Clicky (seulement les grands moments, bouton Passer, `prefers-reduced-motion`).

**Collectibles flottants à délai aléatoire** (`Floater_Reward_Spawner.cs`)
Des astéroïdes, comètes, géodes traversent l'écran à intervalle tiré entre un minimum et un maximum, sur une profondeur propre à chaque scène.
- **Déjà là** : les visiteurs de passage d'Éclat font cela. Rien à reprendre, sinon une comparaison de réglage si leur fréquence paraît trop basse en essai.

**Mode « Non disponible » parlant** (`AudioController.PlaySfx("locked")`, `ShowNotEnoughSciencePopup`)
Appuyer sur un achat impossible joue un son bref et ouvre une explication.
- **Déjà couvert dans l'esprit** par les messages de blocage d'Éclat. À vérifier : un son d'échec discret (Éclat a le geste « raté » à l'Atelier) pour les achats refusés ailleurs.

### 5.3 UI/UX

**Mode photo** (`PhotoManager.cs`, `Achievement_photo_booth`, `tut_photo`)
Un mode qui permet de prendre une capture de la scène et de la partager. Il est présenté comme une étape du tutoriel et son déblocage est un succès.
- **Transfert : oui, avec une version restreinte.** Un bouton « Partager cette page » sur les fiches d'objets et les paysages de terre (`scenes.js`), qui produit une image à partir du SVG et la passe à l'API de partage du navigateur ou la télécharge.
- **Conditions** : (1) **jamais** une page qui révèle un secret du récit ou une recette cachée ; seules les fiches d'objets connus et les paysages ; (2) aucun service externe, aucun envoi de données, génération locale ; (3) polices embarquées (déjà le cas) pour que l'image soit fidèle ; (4) essai sur iOS Safari, où le partage de fichier est capricieux ; (5) un marquage discret (nom du jeu) et rien d'autre.

**Retour des joueurs** (`FeedbackManager.cs`, `tut_feedback_popup_title`)
Une fenêtre « Donne ton avis » reliée à un canal.
- **Transfert : oui.** Un lien « Signaler un souci » dans le menu ☰ qui ouvre un modèle de ticket sur le dépôt ou une fenêtre à copier, avec la version du jeu et l'âge atteint.
- **Conditions** : **aucune donnée dans l'adresse** (ni sauvegarde, ni identifiant) ; un texte de diagnostic à copier à la main, sans envoi automatique ; cohérent avec la remarque d'une bêta-testeuse déjà notée dans `docs/A-FAIRE.md`.

**Notation des grands nombres** (`tut_sci_notation_*`)
Au premier seuil, une fenêtre dit « la production s'affiche maintenant en notation scientifique, tu peux changer dans les réglages ». Le jeu propose le choix.
- **Transfert : léger.** Éclat passe de « 1,5 M » à `1,5e24` au-delà de 1e24 sans le dire. Une phrase au premier passage de ce seuil et un réglage « Grands nombres » (unités / scientifique) évitent la surprise.
- **Conditions** : à ne faire que si le jeu atteint réellement ces valeurs en partie normale (à vérifier avec `tools/sim.js`).

**Jardins** (douze scènes qui se peuplent)
Chaque nœud acheté apparaît dans une scène.
- **Transfert : partiel, par le Carnet.** Éclat montre la progression dans la Carte (terres) et le Cosmos (ciel), et le Carnet affiche des silhouettes d'objets inconnus. Un décor qui se remplit à chaque objet ferait un chantier d'illustrations très lourd. On le laisse de côté.

**Chapitres nommés** (`sty_chap_*` : « L'expérience commence », « Plus haute ambition », « L'ascension des machines »…)
Un titre de chapitre à chaque grande transition.
- **Déjà couvert** par les âges et les fêtes d'Éclat. Rien à reprendre.

### 5.4 Contenu et ton

**Couche de savoir réel** (`ac_*_desc`, `item_*_desc`, `man_*_desc`, `k_*_desc`, `stat_*_desc`)
Presque chaque nœud et chaque succès porte un fait vérifiable (une date, un lieu, un ordre de grandeur) et le plus souvent une plaisanterie. La condition du succès est notée à la fin.
- **Transfert : possible, en optionnel et en petit.** Éclat va « du silex aux étoiles » : le terrain est proche. Une **troisième couche** « Dans le monde réel » sur les fiches, après le jeu (`u`) et le récit (`d`), pour une soixantaine d'objets clés (stations, objets qui ouvrent un âge).
- **Conditions** : (1) chaque fait **sourcé** (source publique citée dans un fichier à part), relu par une personne ; (2) **écrit par nous**, jamais repris de Cell to Singularity ; (3) réglage pour la masquer ; (4) respect strict de `docs/STYLE.md` : phrases concrètes, pas de blague par défaut (Cell to Singularity en met partout, Éclat veut « au plus un clin d'œil par écran ») ; (5) pilote d'abord sur un seul âge (une vingtaine d'entrées), puis décision ; (6) ne pas contredire le récit (qui parle d'un monde recommencé : la phrase doit rester juste dans la fiction).
- **Risque** : c'est précisément là que l'écriture automatique se voit le plus. Sans relecture humaine, on s'abstient.

**Succès avec fait et condition**
Titre, fait réel, condition à la fin. Éclat prévoit des « gestes remarqués » sans récompense.
- **Transfert : possible une fois la couche de savoir validée.** Une ligne de fait, une ligne de condition, pas de blague. Synergie avec les chapitres du tutoriel.

### 5.5 Outillage

**Simulateur à profils de joueurs** (`AutoSim.cs`, `AutoMode`, `PurchaseMode`, `BoostLevel`)
Un seul programme sait jouer la partie avec plusieurs types de joueurs et plusieurs rythmes de présence. Paramètres relevés : tapes par seconde, présence en ligne maximale et hors ligne (4 h chacune), amélioration minimale avant d'acheter, mode d'achat optimal ou le moins cher, niveau de boost, objet de départ et d'arrivée.
- **Transfert : oui, et avant les versions C et D.** Les Vœux et l'Offrande de l'audit Clicky se règlent « au simulateur ». Or `tools/sim.js` prend `tapsParSeconde`, `projet`, `graine`. Profils proposés : **tapeur** (4 tapes par seconde en continu), **veilleur** (sessions de 5 minutes, absences de 4 h, production hors ligne), **explorateur** (lit, explore, ne cherche pas l'optimum), **paresseux** (une session par jour).
- **Conditions** : sortie comparable d'un profil à l'autre (temps jusqu'à chaque passage, jusqu'à chaque fin) ; un test qui échoue si un profil met plus de deux fois le temps du profil de référence ; mêmes graines pour les comparaisons « avec / sans don ».

## 6. Ce qui manque à Éclat (après Cell to Singularity)

1. **Simulateur à profils** : débloque l'équilibrage des Vœux et de l'Offrande. Coût faible à moyen.
2. **Jauge du prochain palier de relève.** Coût faible.
3. **Rebond au relâchement** des boutons principaux. Coût très faible.
4. **Tutoriel = premiers succès.** Coût faible, avec l'audit Clicky.
5. **Canal de retour joueur.** Coût faible.
6. **Veillée en cadeau** (temps accéléré borné). Coût faible.
7. **Partage d'une page du Carnet.** Coût moyen.
8. **Couche de savoir réel**, en pilote. Coût élevé en écriture, faible en code.

À vérifier avant de s'engager : la fréquence réelle des visiteurs de passage, le seuil où l'on passe à l'exposant, et la présence d'un son d'échec sur les achats refusés.

## 7. Ce que j'écarte, et pourquoi

### 7.1 Publicités récompensées, recharges payantes, « sans pub », offres spéciales
Pour recharger les nanobots, doubler la récompense quotidienne, doubler le revenu hors ligne. Un forfait « sans pub » en liste les effets.
- Éclat l'écarte noir sur blanc (`AUDIT-INSPIRATIONS.md`, section 5). Ces mécanismes organisent la progression autour de l'attente et de l'achat.

### 7.2 Temps de recharge à attendre ou à payer (nanobots, 300 s à 900 s)
- Même raison. Ce qu'on garde des nanobots : l'idée d'un auxiliaire qui joue à ta place, qu'Éclat a déjà avec ses extracteurs et ses machines, sans minuteur.

### 7.3 Au moins dix monnaies
Entropie, Idées, Metabits, puces de recherche, Darwinium, Mutagène, Logits, Sentience, Poussière d'étoiles, matière noire, Science, Connaissance…
- Éclat a trois monnaies (Traces, Intuition, écus) et les trouve déjà trop nombreuses. Chaque monnaie ajoutée demande un écran, une explication et un équilibrage.

### 7.4 Classements, cohortes, amis, divisions
- Exigent un serveur (PlayFab chez Cell to Singularity), des comptes et de la modération. Éclat a des comptes facultatifs et chiffrés sur l'appareil, pas de classement, par choix.

### 7.5 Événements à durée limitée
Au moins une quinzaine de chapitres thématiques, chacun avec son classement.
- Calendrier, serveur, pression de revenir à heure fixe : c'est le contraire du rythme d'Éclat. L'idée d'un **chapitre thématique indépendant** reste bonne pour une extension un jour ; pas maintenant.

### 7.6 Séries de cartes et paquets (The Beyond, dinosaures)
- Tirages de cartes de rareté, séries à ouvrir : c'est du loot box adouci. Même verdict que pour la machine à sous de Clicky.

### 7.7 Expérience globale à croissance sur-exponentielle
Objectif du niveau L : `10¹⁰ × L^(2,08 + 1,79 × L)` avec des puissances qui s'ajoutent.
- Illisible, inéquilibrable sans simulateur, et c'est une monnaie de plus. Éclat refuse les chiffres énormes pour eux-mêmes.

### 7.8 Boutique de cosmétiques (peaux de nanobot, tenues, packs sonores)
- Hors périmètre (pas de boutique).

### 7.9 Mesures et régies publicitaires (analytique, SDK de pubs, réseau social d'entreprise)
- Incompatible avec « fonctionne sans serveur et sans dépendance ». Éclat n'embarque rien de cela.

### 7.10 Manette (Rewired)
- Une PWA tactile n'en a pas besoin. Le clavier d'Éclat suffit.

### 7.11 Obligation d'être en ligne et d'avoir l'horloge juste pour la récompense quotidienne
- Éclat fonctionne hors ligne, et ses jours de présence n'enlèvent jamais rien.

### 7.12 Blagues partout dans les descriptions
- Voir 5.4. Un ton qui plaît chez eux ne se plaque pas sur le récit d'Éclat.

## 8. Plan d'intégration

Ce plan **s'ajoute** à celui de l'audit Clicky (versions A à E). Il ajoute des tâches aux versions A et B et crée trois versions nouvelles, F, G et H.

### Ajouts aux versions existantes

| Version | Tâche ajoutée | Fichiers | Critère |
|---|---|---|---|
| A (toucher) | Rebond au relâchement des boutons principaux | `css/style.css`, `js/ecouteurs.js` | 3 à 6 %, sur récolter et fabriquer seulement, inactif avec `prefers-reduced-motion` |
| A | Courbe de montée puis retombée pour la secousse des grandes fêtes | `js/ui.js` (`fete`) | uniquement passage, âge, fin ; bouton Passer |
| B (mémoire des cycles) | Jauge « prochain palier de relève » | `js/memoire.js`, `js/ui.js` (pastille ✦) | n'affiche jamais plus que ce que donnerait la relève ; test dédié |
| B | Chapitres du tutoriel = premiers « gestes remarqués » | `js/tuto.js`, `js/engine.js` | une fois par sauvegarde, aucune récompense qui change la boucle |
| B | Lien « Signaler un souci » | `js/compte.js` | aucune donnée dans l'adresse, texte à copier |
| B | Cadeau « veillée de 2 h » dans les jours de présence | `js/data.js` (`D.JOURS`), `js/engine.js` | plafonné, comptabilisé à part dans `stats` |

### Version F : simulateur à profils (effort faible à moyen, **à faire avant C et D**)

1. Refactorer `tools/sim.js` pour accepter `--profil tapeur|veilleur|explorateur|paresseux` et `--sessions` (durée en ligne, durée hors ligne).
2. Sortie en tableau comparable : temps jusqu'à chaque âge, chaque passage, chaque fin.
3. Brancher `tools/sim-passages.js` sur les mêmes profils.
4. Critère : le profil « paresseux » atteint la première fin en moins de **trois fois** le temps du « tapeur » ; sinon la production hors ligne ou les extracteurs sont à revoir.

Tests : `npm test` inchangé ; un test qui lance deux profils sur la même graine et vérifie qu'ils sont déterministes.

### Version G : le savoir réel, en pilote (effort élevé en écriture)

1. Choisir **un âge** (suggestion : Bois ou Pierre, la matière la plus sûre à sourcer).
2. Rédiger vingt entrées sourcées dans `docs/SAVOIRS.md` (fait, source, formulation, relue par l'auteur).
3. Ajouter un champ `r` (réel) dans `D.ITEMS` pour ces vingt objets seulement.
4. Afficher dans la fiche, après le récit, dans une zone repliable. Réglage « Savoirs » dans le menu.
5. Décision après essai : on étend, on garde au niveau pilote, ou on abandonne.

Critère d'arrêt : si les entrées ne passent pas la relecture à la première écriture, on s'arrête. Ce n'est pas un chantier à confier à l'automatique.

### Version H : partager une page (effort moyen)

1. Fonction de rendu d'une fiche ou d'un paysage en image (SVG vers canvas), avec polices embarquées.
2. Bouton « Partager » via l'API de partage, repli en téléchargement.
3. Liste blanche des pages partageables ; test qui échoue si une page contenant un secret du récit est proposée.

Tests : essai sur iOS Safari et Chrome Android ; poids de l'image (cible inférieure à 500 Ko).

### Ordre et dépendances

```
F (simulateur) ──> C (Vœux) ──┐
                  D (Offrande) ┴─> E (Reliques, aléa de terre)
A (toucher + rebond) ──┐
B (cycles + jauge + tuto + retour + veillée) ──┘
G (savoir réel, pilote)   indépendant, à lancer seulement avec relecture humaine
H (partage)               indépendant, après A
```

F est le seul vrai verrou : sans lui, les audits Clicky et celui-ci promettent des réglages que rien ne mesure.

### Mesures de succès

- Le profil « paresseux » rattrape le « tapeur » sans dépasser trois fois son temps.
- La jauge de relève ne donne jamais un chiffre que la relève ne tient pas.
- Aucune entrée de savoir réel sans source.
- Aucune page secrète partageable.
- Aucune sauvegarde existante cassée (fixtures v1 à v5 rejouées).

### Risques

- **Empilement** : cet audit ajoute huit idées à celles de l'audit Clicky. Ne pas tout lancer. L'ordre conseillé : F, puis A et B, puis C ou D, puis G en pilote.
- **Veillée** : un cadeau de temps est facile à banaliser. Un seul canal d'obtention au départ.
- **Savoir réel** : un fait faux ou mal tourné fait plus de tort qu'un manque. La relecture humaine n'est pas facultative.
- **Partage** : le moindre secret affiché hors du jeu est un spoil définitif.

## Annexe A. Chiffres et formules relevés

- Prestige : rang `= ⌊ ∛(total) / 10 000 − 1 ⌋`, coût du rang `n = ((n + 1) × 10 000)³`.
- Expérience globale : `10¹⁰ × L^(2,08 + 1,79·L)`, multiplié par `(L − 44)^10` à partir de 45, `(L − 69)^40` à partir de 70, `(L − 79)^10` à partir de 80, `(L − 99)^100` à partir de 100, puis des puissances de plus en plus grandes jusqu'à 700 et au-delà. Niveaux 1 à 5 : valeurs fixes.
- Nanobots : 4 charges, 12 emplacements, 300 s de recharge par défaut, 900 s en gratuit, 3 tapes par seconde, niveau d'automatisation maximal 25.
- Boost : plafond de 14 400 s (4 h).
- Bouton : appui −18 % en 0,10 s ; relâchement +24 % puis retour en 0,07 s.
- Simulation : présence en ligne maximale 14 400 s, hors ligne 14 400 s, seuil d'amélioration minimale 5 %, départ à l'objet `item_sun`, arrivée à `tech_singularity`, 20 000 tours maximum.

## Annexe B. Fichiers qui m'ont servi

Dans le code récupéré (`%TEMP%\c2s-src2` et `%TEMP%\c2s-calc`, à supprimer une fois l'audit exploité) : `Constants.cs`, `Calculator.cs`, `AscensionBank.cs`, `AscensionController.cs`, `PlayerLevel.cs`, `AutomationManager.cs`, `BoostTimerManager.cs`, `AutoTapper.cs`, `AutoSim.cs`, `EarthBounce.cs`, `CamShake.cs`, `Floater_Reward_Spawner.cs`, `RealityRebootConversion.cs`, `GameViewID.cs`, `TuningData.cs`.
Textes : `%TEMP%\c2s-loc\en_terms.txt` (couples terme/valeur extraits, avec du bruit).

## Annexe C. Questions ouvertes

1. Veux-tu que je commence par la version F (simulateur à profils) ? C'est la seule qui rende les autres mesurables.
2. Souhaites-tu un pilote de savoir réel, et sur quel âge ? Il faut quelqu'un pour relire les sources.
3. Ce document et `AUDIT-CLICKY-ISLANDS.md` vont-ils dans `docs/` du dépôt ? Aucun secret du récit dedans.
