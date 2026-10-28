# Les boutons de l’interface

Fichier généré par `node tools/boutons.js` (Playwright, chromium, 390×844 puis 900×900 pour le Carnet à deux colonnes, service worker bloqué) : ne pas le corriger à la main, relancer l’outil.

| | |
|---|---|
| Boutons relevés | 219 |
| Sans explication | 0 |
| Écrans | le Domaine, la Carte, l’Atelier et ses pages, le Carnet, l’Arbre, le Journal et ses onglets, le Cosmos, une fiche, le Comptoir, le menu, la fiche d’aide |
| Parties | une neuve, une avancée (`save-v5-age8-usine`), la même en écran large |

## Aide (25 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| neuve | (sans mot) | `button[data-m="close"].modal-x` | lecteur d’écran : Fermer |
| neuve | Compris | `button[data-m="close"].btn` | fiche Aide |
| avancée | (sans mot) | `button[data-m="close"].modal-x` | lecteur d’écran : Fermer |
| avancée | 🎮 Jeu | `button[data-mjump="jeu"].m-nav-tab` | info-bulle : Aller à la section Jeu |
| avancée | Mémoire des mains 1 Traces disponibles | `button[data-m="mem"].btn.m-card-btn` | info-bulle : Ce que tes Traces t’offrent d’une partie à l’autre |
| avancée | 🪙 Le Comptoir Troc & commandes | `button[data-m="comptoir"].btn.m-card-btn` | info-bulle : Vendre, acheter et répondre aux demandes du Troqueur |
| avancée | Revoir | `button[data-m="tutoAgain"].btn.ghost` | info-bulle : Revoir les explications du guide depuis le début |
| avancée | DÉSACTIVÉ | `button[data-m="tuto"].btn.sw` | info-bulle : Afficher ou masquer les explications du guide |
| avancée | ACTIVÉ | `button[data-m="visiteurs"].btn.sw` | info-bulle : Laisser quelqu’un traverser le Domaine de temps en temps |
| avancée | Auto | `button[data-m="theme"].btn.m-theme-btn` | info-bulle : Changer de thème : clair, sombre ou celui de ton appareil |
| avancée | DÉSACTIVÉ | `button[data-m="largeText"].btn.sw` | info-bulle : Agrandir les textes de tout le jeu |
| avancée | DÉSACTIVÉ | `button[data-m="compact"].btn.sw` | info-bulle : Resserrer le Domaine et le Carnet pour voir plus de choses d’un coup |
| avancée | ACTIVÉ | `button[data-m="carnet2"].btn.sw` | info-bulle : Afficher les recettes du Carnet sur deux colonnes (à partir de 360 px de large) |
| avancée | ACTIVÉ | `button[data-m="ambiance"].btn.sw` | info-bulle : Afficher une petite phrase sous l’en-tête qui change selon l’âge, le lieu et l’heure |
| avancée | DÉSACTIVÉ | `button[data-m="ecran"].btn.sw` | info-bulle : Empêcher la mise en veille de l’écran tant que le jeu est ouvert |
| avancée | ACTIVÉ | `button[data-m="sound"].btn.sw` | info-bulle : Couper ou remettre la musique et les bruitages |
| avancée | ACTIVÉ | `button[data-m="vibe"].btn.sw` | info-bulle : Faire vibrer l’appareil lors des actions importantes |
| avancée | Sauvegardes | `button[data-m="saves"].btn.m-card-btn` | info-bulle : Télécharger ta partie, la recharger ou restaurer une copie |
| avancée | État des productions | `button[data-assistance="diagnostic"].btn.m-card-btn` | info-bulle : Comprendre pourquoi une commande ou un ouvrier attend |
| avancée | Compte en ligne | `button[data-m="account"].btn.m-card-btn` | info-bulle : Retrouver ta partie sur tous tes appareils |
| avancée | Comment jouer | `button[data-m="help"].btn.m-card-btn` | info-bulle : Les mots du jeu et le rôle de chaque écran |
| avancée | 📰 Nouveautés | `button[data-m="news"].btn.m-card-btn` | info-bulle : Ce qui a changé dans cette version |
| avancée | Crédits | `button[data-m="credits"].btn.m-card-btn` | info-bulle : Les icônes, les polices et la musique |
| avancée | Recommencer la partie | `button[data-m="reset"].btn.ghost` | info-bulle : Effacer ta progression et repartir de zéro |
| avancée | Fermer | `button[data-m="close"].btn.m-close-btn` | info-bulle : Fermer le menu et revenir au jeu |

## Domaine (50 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| neuve | Bois ÂGE 1/15 | `button#ageBtn.age` | info-bulle : Toucher pour voir les étapes de cet âge ; lecteur d’écran : Âge du Bois : étapes de l’âge |
| neuve | Atlas | `button#atlasToggle.icon-btn` | info-bulle : Style Atlas actif — toucher pour Vivant ; lecteur d’écran : Activer le style Vivant immersif |
| neuve | 1 | `button#memBtn.chip.mem` | lecteur d’écran : Traces et Mémoire des mains ; guide (#memBtn) |
| neuve | ☰ | `button#menuBtn.icon-btn` | lecteur d’écran : Menu |
| neuve | OBJECTIF Manche ▾ | `button[data-goalt=""].ghead` | guide (.goal-card) |
| neuve | NOUVELLE RECETTE « Une branche bien droite, écorcée au caillou, tient bien en main. » | `div[data-goto="manche"].grow` | guide (.goal-card) |
| neuve | Atelier | `button[data-gotab="atelier"].btn` | guide (.goal-card) |
| neuve | Explorer · Le Grand Chêne | `button[data-exp="lisiere"].btn` | info-bulle : Lancer cette exploration : elle avance toute seule |
| neuve | Maîtrise · 0 % ? | `summary` | info-bulle : Voir les objectifs de cette terre et son bonus à la relève |
| neuve | ? | `button[data-aide="maitrise"].btn-aide.mini` | info-bulle : Comprendre la maîtrise des terres et la transmission ; lecteur d’écran : Comprendre la maîtrise des terres et la transmission |
| neuve | (sans mot) | `button[data-harv="lisiere:bois"].gis-ic.hand` | lecteur d’écran : Récolter : Bois |
| neuve | Bois 🖐️ à la main Tu en as 0 | `button[data-gsheet="lisiere:bois"].gis-body` | lecteur d’écran : Gisement : Bois |
| neuve | Récolter | `button[data-hloop="lisiere:bois"].mini.harvest` | info-bulle : Récolte en continu, même jeu fermé ; lecteur d’écran : Récolter en continu : Bois ; guide ([data-hloop="lisiere:bois"]) |
| neuve | Domaine | `button[data-tab="domaine"]` | info-bulle : Tes terres, tes gisements et ce qu’ils produisent |
| neuve | Carte | `button[data-tab="carte"]` | info-bulle : Le monde, terre par terre, et ce qu’il reste à explorer |
| neuve | Atelier | `button[data-tab="atelier"]` | info-bulle : Poser tes ressources, lancer une action |
| neuve | Journal | `button[data-tab="journal"].born` | info-bulle : Ce que tu as trouvé et compris ; guide (#tabs [data-tab="journal"]) |
| avancée | Électricité ÂGE 9/15 0/3 | `button#ageBtn.age` | info-bulle : Toucher pour voir les étapes de cet âge ; lecteur d’écran : Âge de l’Électricité : étapes de l’âge |
| avancée | Atlas | `button#atlasToggle.icon-btn` | info-bulle : Style Atlas actif — toucher pour Vivant ; lecteur d’écran : Activer le style Vivant immersif |
| avancée | 0/3 | `button#questBtn.chip.quest` | info-bulle : Quêtes : l’objectif, les rituels, le Troqueur ; lecteur d’écran : Quêtes |
| avancée | +18 | `button#memBtn.chip.mem` | lecteur d’écran : Traces et Mémoire des mains ; guide (#memBtn) |
| avancée | 22 | `button#intuBtn.chip.intu` | lecteur d’écran : Intuition ; guide (#intuBtn) |
| avancée | ☰ | `button#menuBtn.icon-btn` | lecteur d’écran : Menu |
| avancée | OBJECTIF Régulateur à boules ▾ | `button[data-goalt=""].ghead` | guide (.goal-card) |
| avancée | Arbre | `button[data-arbre-obj=""].gmiles` | info-bulle : Voir ton objectif dans l’arbre ; guide (.goal-card) |
| avancée | Âge de l’Électricité · 0/3 étapes | `button[data-miles=""].gprog-row` | info-bulle : Les étapes de cet âge : 0/3 faites ; guide (.goal-card) |
| avancée | NOUVELLE RECETTE « Une bande de bronze enroulée en spirale restitue l'effort quand on la relâche. » | `div[data-goto="ressort"].grow` | guide (.goal-card) |
| avancée | Atelier | `button[data-gotab="atelier"].btn` | guide (.goal-card) |
| avancée | Compris | `button[data-tip="tip_site"].btn.ghost` | info-bulle : Fermer cette astuce |
| avancée | Passer le relais (+18 ) | `button[data-m="releve"].btn` | info-bulle : Voir les gains de Traces et les bonus de la prochaine relève |
| avancée | Voir : Torche | `button[data-goto="torche"].btn` | guide (.dom-regle.gene) |
| avancée | Maîtrise · 80 % ? | `summary` | info-bulle : Voir les objectifs de cette terre et son bonus à la relève |
| avancée | ? | `button[data-aide="maitrise"].btn-aide.mini` | info-bulle : Comprendre la maîtrise des terres et la transmission ; lecteur d’écran : Comprendre la maîtrise des terres et la transmission |
| avancée | (sans mot) | `button[data-harv="mine:fer_min"].gis-ic.hand` | lecteur d’écran : Récolter : Minerai de fer |
| avancée | Minerai de fer +48/min Tu en as 544 · 1 mine de fer | `button[data-gsheet="mine:fer_min"].gis-body` | lecteur d’écran : Gisement : Minerai de fer |
| avancée | Récolter | `button[data-hloop="mine:fer_min"].mini.harvest` | info-bulle : Récolte en continu, même jeu fermé ; lecteur d’écran : Récolter en continu : Minerai de fer |
| avancée | + mine de fer | `button[data-xadd="mine:fer_min"][data-n="1"].mini.lbl` | info-bulle : Poser : Mine de fer (débit : 48/min → 96/min) ; lecteur d’écran : Poser : Mine de fer |
| avancée | 3 autre terres · +2,16 k/min en tout voir ▾ | `button[data-dall=""].dom-more` | info-bulle : Afficher ou replier les autres terres |
| avancée | 0 machine au travail · 10 au repos · voir ▸ | `button[data-tab2="machines"][data-dmach=""].dom-more.dom-mach-link` | guide ([data-tab2="machines"]) |
| avancée | Ouvrir le Comptoir | `button[data-comptoir=""].btn` | guide (#dcomptoir) |
| avancée | Supraconducteur 0 / 380 | `div[data-goto="supra"].cost-row` | info-bulle : Supraconducteur (toucher pour inspecter) |
| avancée | Fournir | `button[data-contrib="dyson"].btn` | info-bulle : Déposer depuis ta Réserve ce qu’il demande |
| avancée | Alimenté | `button[data-feed="dyson"].btn` | guide (.dom-oeuvre [data-feed]) |
| avancée | Bois+31/min8,73 k | `div[data-goto="bois"].u-pr` | info-bulle : Bois (toucher pour inspecter) |
| avancée | Domaine | `button[data-tab="domaine"]` | info-bulle : Tes terres, tes gisements et ce qu’ils produisent |
| avancée | Carte | `button[data-tab="carte"]` | info-bulle : Le monde, terre par terre, et ce qu’il reste à explorer |
| avancée | Atelier | `button[data-tab="atelier"]` | info-bulle : Poser tes ressources, lancer une action |
| avancée | Arbre | `button[data-tab="arbre"]` | info-bulle : Qui sert à quoi : une recette, ses ingrédients, ses usages |
| avancée | Carnet | `button[data-tab="carnet"]` | info-bulle : Toutes tes recettes, avec la quantité et les commandes |
| avancée | Journal | `button[data-tab="journal"]` | info-bulle : Ce que tu as trouvé et compris ; guide (#tabs [data-tab="journal"]) |

## Carte (12 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| neuve | Camp | `button[data-map-go="lisiere"]` | info-bulle : Recentrer la carte sur ton camp |
| neuve | Légende | `button[data-map-legend=""]` | lecteur d’écran : Lire la légende de la carte |
| neuve | (sans mot) | `g[data-cf="plaine"].a-button.a-frontier` | lecteur d’écran : des herbes hautes, au loin : découvrir ce qui ouvre le passage |
| neuve | (sans mot) | `g[data-cz="lisiere"].a-button.a-region` | lecteur d’écran : La Lisière : ouvrir dans le Domaine |
| neuve | (sans mot) | `g[data-cl="lisiere:0"].a-button.a-place` | info-bulle : Le Grand Chêne · à explorer ; lecteur d’écran : La Lisière : Le Grand Chêne, à explorer ; guide ([data-cl="lisiere:0"]) |
| neuve | (sans mot) | `g[data-camp=""].a-button.a-camp` | lecteur d’écran : Ton camp : ouvrir le Domaine |
| avancée | Camp | `button[data-map-go="lisiere"]` | info-bulle : Recentrer la carte sur ton camp |
| avancée | Légende | `button[data-map-legend=""]` | lecteur d’écran : Lire la légende de la carte |
| avancée | (sans mot) | `g[data-cf="desert"].a-button.a-frontier` | lecteur d’écran : du sable à perte de vue : découvrir ce qui ouvre le passage |
| avancée | (sans mot) | `g[data-cz="lisiere"].a-button.a-region` | lecteur d’écran : La Lisière : ouvrir dans le Domaine |
| avancée | (sans mot) | `g[data-cl="lisiere:0"].a-button.a-place` | info-bulle : Le Grand Chêne · exploré ; lecteur d’écran : La Lisière : Le Grand Chêne, exploré ; guide ([data-cl="lisiere:0"]) |
| avancée | (sans mot) | `g[data-camp=""].a-button.a-camp` | lecteur d’écran : Ton camp : ouvrir le Domaine |

## Lieu (2 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| neuve | Explorer | `button[data-m="go"].btn` | guide (.modal:not(.hidden) [data-m="go"]) |
| avancée | Un tour · 30 min | `button[data-m="fouille"][data-lvl="1"].btn` | guide (.modal:not(.hidden) .fouille-niv) |

## Atelier (32 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| neuve | Récolter du bois | `button[data-hloop="lisiere:bois"].btn` | guide ([data-hloop="lisiere:bois"]) |
| neuve | Assembler | `button[data-g="assembler"].geste` | guide (.gestes) |
| neuve | Tresser | `button[data-g="tresser"].geste` | guide (.gestes) |
| neuve | Tailler | `button[data-g="tailler"].geste` | guide (.gestes) |
| neuve | ? ??? | `button[data-lock="chauffer"].geste.lock` | guide (.gestes) |
| neuve | + | `button[data-slot="0"].slot` | info-bulle : Poser une ressource ici ; lecteur d’écran : Emplacement libre : poser une ressource |
| neuve | + | `button[data-slot="1"].slot` | info-bulle : Poser une ressource ici ; lecteur d’écran : Emplacement libre : poser une ressource |
| neuve | + | `button[data-slot="2"].slot` | info-bulle : Poser une ressource ici ; lecteur d’écran : Emplacement libre : poser une ressource |
| neuve | TAILLER | `button#forge.forge-btn` | guide (#forge) |
| neuve | ⓘ Fiches | `button[data-fichemode=""].btn.ghost` | info-bulle : Un appui sur une ressource ouvre sa fiche (comme un appui long) |
| avancée | Découvrir | `button[data-tab2="atelier"]` | info-bulle : Fabriquer et découvrir |
| avancée | Machines | `button[data-tab2="machines"]` | info-bulle : Tes machines et ce qu’elles fabriquent ; guide ([data-tab2="machines"]) |
| avancée | Niveaux | `button[data-skills=""].btn.ghost` | info-bulle : Le niveau de chaque action et de la récolte |
| avancée | Assembler 1 | `button[data-g="assembler"].geste` | guide (.gestes) |
| avancée | Tresser 1 | `button[data-g="tresser"].geste` | guide (.gestes) |
| avancée | Tailler 1 | `button[data-g="tailler"].geste` | guide (.gestes) |
| avancée | Chauffer 1 | `button[data-g="chauffer"].geste` | guide (.gestes) |
| avancée | Marteler 1 | `button[data-g="marteler"].geste` | guide (.gestes) |
| avancée | Allier 1 | `button[data-g="allier"].geste` | guide (.gestes) |
| avancée | Tremper 1 | `button[data-g="tremper"].geste` | guide (.gestes) |
| avancée | Usiner 1 | `button[data-g="usiner"].geste` | guide (.gestes) |
| avancée | ? ??? | `button[data-lock="electriser"].geste.lock` | guide (.gestes) |
| avancée | + | `button[data-slot="0"].slot` | info-bulle : Poser une ressource ici ; lecteur d’écran : Emplacement libre : poser une ressource |
| avancée | + | `button[data-slot="1"].slot` | info-bulle : Poser une ressource ici ; lecteur d’écran : Emplacement libre : poser une ressource |
| avancée | + | `button[data-slot="2"].slot` | info-bulle : Poser une ressource ici ; lecteur d’écran : Emplacement libre : poser une ressource |
| avancée | TAILLER | `button#forge.forge-btn` | guide (#forge) |
| avancée | ⓘ Fiches | `button[data-fichemode=""].btn.ghost` | info-bulle : Un appui sur une ressource ouvre sa fiche (comme un appui long) |
| avancée | Filtres ▾ | `button[data-filtres=""].btn.ghost` | lecteur d’écran : Tri et filtres |
| avancée | 8,81 k +810/min Bois | `button[data-inv="bois"].inv` | info-bulle : Bois : ouvrir sa fiche ; lecteur d’écran : Bois : ouvrir sa fiche ; guide ([data-inv="bois"]) |
| avancée | 0 Archet à feu | `button[data-inv="archet"].inv.zero` | info-bulle : Archet à feu : ouvrir sa fiche ; lecteur d’écran : Archet à feu : ouvrir sa fiche |
| avancée | 1 Tablette des astres | `button[data-inv="tablette"].inv.relic` | info-bulle : Tablette des astres : ouvrir sa fiche ; lecteur d’écran : Tablette des astres : ouvrir sa fiche |
| avancée | (sans mot) | `button.toast-x` | lecteur d’écran : Fermer |

## Journal (16 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| neuve | Fragments | `button[data-jt="fragments"]` | info-bulle : Les morceaux d’histoire retrouvés |
| neuve | Signes | `button[data-jt="signes"]` | info-bulle : Les mots des Anciens et leur sens |
| neuve | Secrets | `button[data-jt="secrets"]` | info-bulle : Ce que tu as trouvé, et ce qu’il reste |
| neuve | Gestes • | `button[data-jt="gestes"]` | info-bulle : Les gestes remarqués et accomplis au fil de ta route |
| neuve | Fins | `button[data-jt="fins"]` | info-bulle : Les fins du jeu et ce que tu en sais |
| neuve | Mémoire | `button[data-jt="stats"]` | info-bulle : Ta partie en chiffres |
| avancée | Journal | `button[data-tab2="journal"]` | info-bulle : Ce que tu as trouvé et compris |
| avancée | Cosmos | `button[data-tab2="cosmos"]` | info-bulle : Le ciel, les signes et les Grands Œuvres |
| avancée | Fragments | `button[data-jt="fragments"]` | info-bulle : Les morceaux d’histoire retrouvés |
| avancée | Questions | `button[data-jt="questions"]` | info-bulle : Ce que tu peux demander au Livre |
| avancée | Signes | `button[data-jt="signes"]` | info-bulle : Les mots des Anciens et leur sens |
| avancée | Secrets | `button[data-jt="secrets"]` | info-bulle : Ce que tu as trouvé, et ce qu’il reste |
| avancée | Gestes • | `button[data-jt="gestes"]` | info-bulle : Les gestes remarqués et accomplis au fil de ta route |
| avancée | Fins | `button[data-jt="fins"]` | info-bulle : Les fins du jeu et ce que tu en sais |
| avancée | Mémoire | `button[data-jt="stats"]` | info-bulle : Ta partie en chiffres |
| avancée | La Porte Les Profondeurs | `button[data-frag="porte"].frag` | info-bulle : Lire ce fragment |

## Journal · signes (2 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| neuve | 1 endroit | `button[data-s="faire"].signe-card` | info-bulle : Ouvrir la fiche de ce signe : où tu l’as vu, et ce que tu en sais |
| avancée | 1 endroit | `button[data-s="faire"].signe-card` | info-bulle : Ouvrir la fiche de ce signe : où tu l’as vu, et ce que tu en sais |

## Journal · fins (2 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| neuve | Mémoire des mains | `button[data-cycle=""].btn` | info-bulle : Voir tes améliorations permanentes et préparer la relève |
| avancée | Mémoire des mains | `button[data-cycle=""].btn` | info-bulle : Voir tes améliorations permanentes et préparer la relève |

## Journal · stats (2 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| neuve | ⏎ | `button.btn` | info-bulle : Envoyer ce nom ; lecteur d’écran : Envoyer ce nom |
| avancée | ⏎ | `button.btn` | info-bulle : Envoyer ce nom ; lecteur d’écran : Envoyer ce nom |

## Menu ☰ (21 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| neuve | 🎮 Jeu | `button[data-mjump="jeu"].m-nav-tab` | info-bulle : Aller à la section Jeu |
| neuve | Mémoire des mains 1 Traces disponibles | `button[data-m="mem"].btn.m-card-btn` | info-bulle : Ce que tes Traces t’offrent d’une partie à l’autre |
| neuve | Revoir | `button[data-m="tutoAgain"].btn.ghost` | info-bulle : Revoir les explications du guide depuis le début |
| neuve | DÉSACTIVÉ | `button[data-m="tuto"].btn.sw` | info-bulle : Afficher ou masquer les explications du guide |
| neuve | ACTIVÉ | `button[data-m="visiteurs"].btn.sw` | info-bulle : Laisser quelqu’un traverser le Domaine de temps en temps |
| neuve | Auto | `button[data-m="theme"].btn.m-theme-btn` | info-bulle : Changer de thème : clair, sombre ou celui de ton appareil |
| neuve | DÉSACTIVÉ | `button[data-m="largeText"].btn.sw` | info-bulle : Agrandir les textes de tout le jeu |
| neuve | DÉSACTIVÉ | `button[data-m="compact"].btn.sw` | info-bulle : Resserrer le Domaine et le Carnet pour voir plus de choses d’un coup |
| neuve | ACTIVÉ | `button[data-m="carnet2"].btn.sw` | info-bulle : Afficher les recettes du Carnet sur deux colonnes (à partir de 360 px de large) |
| neuve | ACTIVÉ | `button[data-m="ambiance"].btn.sw` | info-bulle : Afficher une petite phrase sous l’en-tête qui change selon l’âge, le lieu et l’heure |
| neuve | DÉSACTIVÉ | `button[data-m="ecran"].btn.sw` | info-bulle : Empêcher la mise en veille de l’écran tant que le jeu est ouvert |
| neuve | ACTIVÉ | `button[data-m="sound"].btn.sw` | info-bulle : Couper ou remettre la musique et les bruitages |
| neuve | ACTIVÉ | `button[data-m="vibe"].btn.sw` | info-bulle : Faire vibrer l’appareil lors des actions importantes |
| neuve | Sauvegardes | `button[data-m="saves"].btn.m-card-btn` | info-bulle : Télécharger ta partie, la recharger ou restaurer une copie |
| neuve | État des productions | `button[data-assistance="diagnostic"].btn.m-card-btn` | info-bulle : Comprendre pourquoi une commande ou un ouvrier attend |
| neuve | Compte en ligne | `button[data-m="account"].btn.m-card-btn` | info-bulle : Retrouver ta partie sur tous tes appareils |
| neuve | Comment jouer | `button[data-m="help"].btn.m-card-btn` | info-bulle : Les mots du jeu et le rôle de chaque écran |
| neuve | 📰 Nouveautés | `button[data-m="news"].btn.m-card-btn` | info-bulle : Ce qui a changé dans cette version |
| neuve | Crédits | `button[data-m="credits"].btn.m-card-btn` | info-bulle : Les icônes, les polices et la musique |
| neuve | Recommencer la partie | `button[data-m="reset"].btn.ghost` | info-bulle : Effacer ta progression et repartir de zéro |
| neuve | Fermer | `button[data-m="close"].btn.m-close-btn` | info-bulle : Fermer le menu et revenir au jeu |

## Comptoir (9 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| avancée | Vendre | `button[data-m="ctab"][data-t="vendre"]` | info-bulle : Vendre ce qui encombre ta Réserve |
| avancée | Acheter | `button[data-m="ctab"][data-t="acheter"]` | info-bulle : Acheter la ressource qui te manque |
| avancée | Demandes | `button[data-m="ctab"][data-t="demandes"]` | guide (.modal:not(.hidden) [data-t="demandes"]) |
| avancée | Parler | `button[data-m="ctab"][data-t="parler"]` | guide (.modal:not(.hidden) [data-t="parler"]) |
| avancée | Minerai de fer · tu en as 544 9,8 écu l’unité | `div[data-goto="fer_min"].comptoir-head` | info-bulle : Minerai de fer (toucher pour inspecter) |
| avancée | 10 % +520 | `button[data-m="sell"][data-id="fer_min"][data-n="54"].btn.mini` | info-bulle : Vendre 10 % ; guide (.modal:not(.hidden) [data-m="sell"]) |
| avancée | 10 % +201 | `button[data-m="sell"][data-id="aimant"][data-n="1"].btn.mini` | info-bulle : Vendre 10 % ; guide (.modal:not(.hidden) [data-m="sell"]) |
| avancée | La moitié +126 | `button[data-m="sell"][data-id="bobine"][data-n="10"].btn.mini` | info-bulle : Vendre la moitié ; guide (.modal:not(.hidden) [data-m="sell"]) |
| avancée | Fermer | `button[data-m="close"].btn` | fiche Aide |

## Atelier · filtres (10 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| avancée | Par âge Plus nombreuses ⚡ Flux actifs ⚠️ En déficit Nom (A → Z) Dernières trouvées | `select#isort` | info-bulle : Trier les ressources ; lecteur d’écran : Trier les ressources |
| avancée | Tout 46 | `button[data-if="tout"]` | info-bulle : Toutes tes ressources |
| avancée | En flux 12 | `button[data-if="flow"]` | info-bulle : Celles qui entrent ou sortent en ce moment |
| avancée | Brutes 12 | `button[data-if="res"]` | info-bulle : Les ressources brutes, récoltées telles quelles |
| avancée | Pièces 34 | `button[data-if="comp"]` | info-bulle : Les pièces fabriquées à l’Atelier |
| avancée | Action 9 | `button[data-if="geste"]` | info-bulle : Celles qui servent à l’action choisie |
| avancée | Favoris 0 | `button[data-if="fav"]` | info-bulle : Celles que tu as marquées d’un ♥ |
| avancée | Inutilisées 4 | `button[data-if="new"]` | info-bulle : Celles qu’aucune recette connue n’utilise encore |
| avancée | À tenter 0 | `button[data-if="try"]` | info-bulle : Les ressources étudiées qui cachent encore une recette |
| avancée | À découvrir 0 | `button[data-if="tryg"]` | info-bulle : Les matières étudiées qui cachent encore une recette avec le geste choisi |

## Arbre (8 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| avancée | Progression | `button[data-arb="ensemble"].btn` | info-bulle : Ta progression : ton âge, tes étapes et le prochain objectif |
| avancée | Objectif | `button[data-arb="centre"].btn` | info-bulle : Ton objectif du moment, et ce qu’il demande |
| avancée | (sans mot) | `button[data-arb="chercher"].btn.ghost` | lecteur d’écran : Chercher dans l’arbre |
| avancée | Toutes 83 | `button[data-arb-f="tout"]` | info-bulle : Afficher toutes les pastilles |
| avancée | ? Recette à découvrir À découvrir Objectif | `button[data-arbsel="f1"][data-arbn="f1"].arb-card.fantome` | info-bulle : Ouvrir cette branche : ses ingrédients et ses usages |
| avancée | Bois | `button[data-arbsel="bois"][data-arbn="bois"].arb-pas.vu` | info-bulle : Ouvrir : ses ingrédients et ses usages ; lecteur d’écran : Bois, ressource découverte |
| avancée | Charbon | `button[data-arbsel="charbon"][data-arbn="charbon"].arb-pas.allume` | info-bulle : Ouvrir : ses ingrédients et ses usages ; lecteur d’écran : Charbon, déjà fabriqué |
| avancée | ?? | `button[data-arbsel="f1"][data-arbn="f1"].arb-pas.fantome` | info-bulle : Ouvrir : ses ingrédients et ses usages ; lecteur d’écran : Recette à découvrir, à découvrir, objectif |

## Arbre · une branche (1 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| avancée | Chemin | `button[data-chemin="regulateur"].btn` | info-bulle : Chemin : la route complète jusqu’à l’objet |

## Carnet (20 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| avancée | ×1 | `button[data-qty="1"].chipq` | info-bulle : Un seul exemplaire |
| avancée | … | `button[data-qty-custom=""].chipq` | info-bulle : Saisir une quantité libre ; lecteur d’écran : Quantité libre |
| avancée | Apprises | `button[data-cf="tout"]` | info-bulle : Toutes les recettes que tu connais |
| avancée | Prêtes | `button[data-cf="pret"]` | info-bulle : Celles que ta Réserve couvre entièrement, pièces comprises |
| avancée | Réalisables | `button[data-cf="craft"]` | info-bulle : Celles dont les pièces manquantes peuvent encore être fabriquées |
| avancée | À découvrir | `button[data-cf="unk"]` | info-bulle : Celles qu’il te reste à découvrir |
| avancée | Extracteurs | `button[data-cf="ext"]` | info-bulle : Les bâtiments qui récoltent à ta place |
| avancée | Outils | `button[data-cf="tool"]` | info-bulle : Les outils et leurs améliorations |
| avancée | Machines | `button[data-cf="mach"]` | info-bulle : Les machines qui fabriquent seules |
| avancée | Épinglées | `button[data-cf="pin"]` | info-bulle : Tes épingles, en haut de l’Atelier |
| avancée | ▴ Plier | `button[data-age-all=""].age-pill.age-all` | info-bulle : Replier tous les âges ; lecteur d’écran : Replier tous les âges |
| avancée | Âge 1 | `button[data-age-jump="0"].age-pill` | info-bulle : Âge du Bois ; lecteur d’écran : Aller à : Âge du Bois |
| avancée | ☆ | `button[data-pin="bobine"].pinb` | info-bulle : Épingler cette recette en haut de l’Atelier ; lecteur d’écran : Épingler cette recette en haut de l’Atelier ; guide ([data-pin]) |
| avancée | 6 Fil de cuivre | `span[data-need="fil_cuivre"][data-q="6"][data-goto="fil_cuivre"].ing.link` | info-bulle : Ouvrir sa fiche |
| avancée | Fabriquer | `button[data-cr="bobine"][data-n="1"][data-lbl="Fabriquer"].btn.make` | info-bulle : Commander cette quantité, pièces comprises |
| avancée | (sans mot) | `button[data-tree="bobine"][data-n="1"].btn.ghost` | info-bulle : Les étapes de cette commande, et ce qu’il manque ; lecteur d’écran : Détail du lot |
| avancée | (sans mot) | `button[data-track="bobine"].btn.ghost` | info-bulle : Suivre cette recette ; lecteur d’écran : Suivre ; guide ([data-track]) |
| avancée | 🌿 | `button[data-situer="bobine"].btn.ghost` | info-bulle : Situer dans l’Arbre ; lecteur d’écran : Situer dans l’Arbre |
| avancée | 1 Circuit de vapeur | `span[data-goto="circuit_vapeur"].ing.link` | info-bulle : Ouvrir sa fiche |
| avancée | Voir les 19 objets déjà possédés | `button[data-owned=""].btn.ghost` | info-bulle : Masquer ou montrer les objets déjà fabriqués |

## Journal · questions (1 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| avancée | Réfléchir : 45 (manque d’Intuition) | `button[data-askhelp="q_porte"].btn.dis` | info-bulle : Il te manque de l’Intuition : elle vient des recettes, des fragments et des secrets |

## Cosmos (4 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| avancée | Ciel | `button[data-ct="ciel"]` | info-bulle : Le ciel de la nuit |
| avancée | Figures | `button[data-ct="figures"]` | info-bulle : Les étoiles et les signes déjà vus ; guide ([data-ct="figures"]) |
| avancée | ARCHE | `button[data-ct="arche"]` | info-bulle : Le terminal des Anciens |
| avancée | Grands Œuvres | `button[data-ct="oeuvres"]` | info-bulle : Les Grands Œuvres, ce qu’il reste à bâtir |

## (erreur) (2 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| avancée | fmtNum is not defined | `` | erreur console |
| avancée | fmtNum is not defined | `` | erreur console |
