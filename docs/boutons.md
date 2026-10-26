# Les boutons de l’interface

Fichier généré par `node tools/boutons.js` (Playwright, chromium, 390×844 puis 900×900 pour le Carnet à deux colonnes, service worker bloqué) : ne pas le corriger à la main, relancer l’outil.

| | |
|---|---|
| Boutons relevés | 212 |
| Sans explication | 0 |
| Écrans | le Domaine, la Carte, l’Atelier et ses pages, le Carnet, l’Arbre, le Journal et ses onglets, le Cosmos, une fiche, le Comptoir, le menu, la fiche d’aide |
| Parties | une neuve, une avancée (`save-v5-age8-usine`), la même en écran large |

## Aide (39 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| neuve | ✕ | `button[data-m="close"].modal-x` | lecteur d’écran : Fermer |
| neuve | Auto | `button[data-m="theme"].btn` | info-bulle : Changer de thème : clair, sombre ou celui de ton appareil |
| neuve | Désactivé | `button[data-m="largeText"].btn.sw` | info-bulle : Agrandir les textes de tout le jeu |
| neuve | Désactivé | `button[data-m="compact"].btn.sw` | info-bulle : Resserrer le Domaine et le Carnet pour voir plus de choses d’un coup |
| neuve | Activé | `button[data-m="carnet2"].btn.sw` | info-bulle : Afficher les recettes du Carnet sur deux colonnes (à partir de 360 px de large) |
| neuve | Désactivé | `button[data-m="ecran"].btn.sw` | info-bulle : Empêcher la mise en veille de l’écran tant que le jeu est ouvert |
| neuve | Activé | `button[data-m="sound"].btn.sw` | info-bulle : Couper ou remettre la musique et les bruitages |
| neuve | Activé | `button[data-m="vibe"].btn.sw` | info-bulle : Faire vibrer l’appareil lors des actions importantes |
| neuve | Activé | `button[data-m="visiteurs"].btn.sw` | info-bulle : Laisser quelqu’un traverser le Domaine de temps en temps |
| neuve | Revoir | `button[data-m="tutoAgain"].btn.ghost` | info-bulle : Revoir les explications du guide depuis le début |
| neuve | Désactivé | `button[data-m="tuto"].btn.sw` | info-bulle : Afficher ou masquer les explications du guide |
| neuve | ✦ Mémoire des mains | `button[data-m="mem"].btn` | info-bulle : Ce que tes Traces t’offrent d’une partie à l’autre |
| neuve | Sauvegardes | `button[data-m="saves"].btn` | info-bulle : Télécharger ta partie, la recharger ou restaurer une copie |
| neuve | Compte en ligne | `button[data-m="account"].btn` | info-bulle : Retrouver ta partie sur tous tes appareils |
| neuve | Comment jouer | `button[data-m="help"].btn` | info-bulle : Les mots du jeu et le rôle de chaque écran |
| neuve | 📰 Nouveautés | `button[data-m="news"].btn` | info-bulle : Ce qui a changé dans cette version |
| neuve | Crédits | `button[data-m="credits"].btn` | info-bulle : Les icônes, les polices et la musique |
| neuve | Recommencer la partie | `button[data-m="reset"].btn.ghost` | info-bulle : Effacer ta progression et repartir de zéro |
| neuve | Fermer | `button[data-m="close"].btn` | fiche Aide |
| avancée | ✕ | `button[data-m="close"].modal-x` | lecteur d’écran : Fermer |
| avancée | Auto | `button[data-m="theme"].btn` | info-bulle : Changer de thème : clair, sombre ou celui de ton appareil |
| avancée | Désactivé | `button[data-m="largeText"].btn.sw` | info-bulle : Agrandir les textes de tout le jeu |
| avancée | Désactivé | `button[data-m="compact"].btn.sw` | info-bulle : Resserrer le Domaine et le Carnet pour voir plus de choses d’un coup |
| avancée | Activé | `button[data-m="carnet2"].btn.sw` | info-bulle : Afficher les recettes du Carnet sur deux colonnes (à partir de 360 px de large) |
| avancée | Désactivé | `button[data-m="ecran"].btn.sw` | info-bulle : Empêcher la mise en veille de l’écran tant que le jeu est ouvert |
| avancée | Activé | `button[data-m="sound"].btn.sw` | info-bulle : Couper ou remettre la musique et les bruitages |
| avancée | Activé | `button[data-m="vibe"].btn.sw` | info-bulle : Faire vibrer l’appareil lors des actions importantes |
| avancée | Activé | `button[data-m="visiteurs"].btn.sw` | info-bulle : Laisser quelqu’un traverser le Domaine de temps en temps |
| avancée | Revoir | `button[data-m="tutoAgain"].btn.ghost` | info-bulle : Revoir les explications du guide depuis le début |
| avancée | Désactivé | `button[data-m="tuto"].btn.sw` | info-bulle : Afficher ou masquer les explications du guide |
| avancée | ✦ Mémoire des mains | `button[data-m="mem"].btn` | info-bulle : Ce que tes Traces t’offrent d’une partie à l’autre |
| avancée | 🪙 Le Comptoir | `button[data-m="comptoir"].btn` | info-bulle : Vendre, acheter et répondre aux demandes du Troqueur |
| avancée | Sauvegardes | `button[data-m="saves"].btn` | info-bulle : Télécharger ta partie, la recharger ou restaurer une copie |
| avancée | Compte en ligne | `button[data-m="account"].btn` | info-bulle : Retrouver ta partie sur tous tes appareils |
| avancée | Comment jouer | `button[data-m="help"].btn` | info-bulle : Les mots du jeu et le rôle de chaque écran |
| avancée | 📰 Nouveautés | `button[data-m="news"].btn` | info-bulle : Ce qui a changé dans cette version |
| avancée | Crédits | `button[data-m="credits"].btn` | info-bulle : Les icônes, les polices et la musique |
| avancée | Recommencer la partie | `button[data-m="reset"].btn.ghost` | info-bulle : Effacer ta progression et repartir de zéro |
| avancée | Fermer | `button[data-m="close"].btn` | fiche Aide |

## Domaine (44 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| neuve | Bois ÂGE 1/15 | `button#ageBtn.age` | info-bulle : Toucher pour voir les étapes de cet âge ; lecteur d’écran : Âge du Bois : étapes de l’âge |
| neuve | ✦ 1 | `button#memBtn.chip.mem` | lecteur d’écran : Traces et Mémoire des mains ; guide (#memBtn) |
| neuve | ☰ | `button#menuBtn.icon-btn` | lecteur d’écran : Menu |
| neuve | OBJECTIF Manche ▾ | `button[data-goalt=""].ghead` | guide (.goal-card) |
| neuve | ✦ NOUVELLE RECETTE « Prends du bois et retire tout ce qui dépasse. » | `div[data-goto="manche"].grow` | guide (.goal-card) |
| neuve | Atelier | `button[data-gotab="atelier"].btn` | guide (.goal-card) |
| neuve | Explorer · Le Grand Chêne | `button[data-exp="lisiere"].btn` | info-bulle : Lancer cette exploration : elle avance toute seule |
| neuve | (sans mot) | `button[data-harv="lisiere:bois"].gis-ic.hand` | lecteur d’écran : Récolter : Bois |
| neuve | Bois 🖐️ à la main Tu en as 0 | `button[data-gsheet="lisiere:bois"].gis-body` | lecteur d’écran : Gisement : Bois |
| neuve | ▶ Récolter | `button[data-hloop="lisiere:bois"].mini.harvest` | info-bulle : Récolte en continu, même jeu fermé ; lecteur d’écran : Récolter en continu : Bois ; guide ([data-hloop="lisiere:bois"]) |
| neuve | Domaine | `button[data-tab="domaine"]` | info-bulle : Tes terres, tes gisements et ce qu’ils produisent |
| neuve | Carte | `button[data-tab="carte"]` | info-bulle : Le monde, terre par terre, et ce qu’il reste à explorer |
| neuve | Atelier | `button[data-tab="atelier"]` | info-bulle : Poser tes ressources, lancer une action |
| neuve | Journal | `button[data-tab="journal"].born` | info-bulle : Ce que tu as trouvé et compris ; guide (#tabs [data-tab="journal"]) |
| avancée | Électricité ÂGE 9/15 0/3 | `button#ageBtn.age` | info-bulle : Toucher pour voir les étapes de cet âge ; lecteur d’écran : Âge de l’Électricité : étapes de l’âge |
| avancée | 0/3 | `button#questBtn.chip.quest` | info-bulle : Quêtes : l’objectif, les rituels, le Troqueur ; lecteur d’écran : Quêtes |
| avancée | ✦ +18 | `button#memBtn.chip.mem` | lecteur d’écran : Traces et Mémoire des mains ; guide (#memBtn) |
| avancée | 22 | `button#intuBtn.chip.intu` | lecteur d’écran : Intuition ; guide (#intuBtn) |
| avancée | ☰ | `button#menuBtn.icon-btn` | lecteur d’écran : Menu |
| avancée | OBJECTIF Régulateur à boules ▾ | `button[data-goalt=""].ghead` | guide (.goal-card) |
| avancée | Arbre | `button[data-arbre-obj=""].gmiles` | info-bulle : Voir ton objectif dans l’arbre ; guide (.goal-card) |
| avancée | Âge de l’Électricité · 0/3 étapes | `button[data-miles=""].gprog-row` | info-bulle : Les étapes de cet âge : 0/3 faites ; guide (.goal-card) |
| avancée | ✦ NOUVELLE RECETTE « En battant le bronze autour d’un fil de cuivre, tu pourrais former une spirale qui reprend sa forme après un effort. » | `div[data-goto="ressort"].grow` | guide (.goal-card) |
| avancée | Atelier | `button[data-gotab="atelier"].btn` | guide (.goal-card) |
| avancée | Compris | `button[data-tip="tip_site"].btn.ghost` | info-bulle : Fermer cette astuce |
| avancée | Voir : Torche | `button[data-goto="torche"].btn` | guide (.dom-regle.gene) |
| avancée | (sans mot) | `button[data-harv="mine:fer_min"].gis-ic.hand` | lecteur d’écran : Récolter : Minerai de fer |
| avancée | Minerai de fer +48/min Tu en as 543 · 1 mine de fer | `button[data-gsheet="mine:fer_min"].gis-body` | lecteur d’écran : Gisement : Minerai de fer |
| avancée | ▶ Récolter | `button[data-hloop="mine:fer_min"].mini.harvest` | info-bulle : Récolte en continu, même jeu fermé ; lecteur d’écran : Récolter en continu : Minerai de fer |
| avancée | + mine de fer | `button[data-xadd="mine:fer_min"][data-n="1"].mini.lbl` | info-bulle : Poser : Mine de fer ; lecteur d’écran : Poser : Mine de fer |
| avancée | 3 autre terres · +2,16 k/min en tout voir ▾ | `button[data-dall=""].dom-more` | info-bulle : Afficher ou replier les autres terres |
| avancée | 0 machine au travail · 10 au repos · voir ▸ | `button[data-tab2="machines"][data-dmach=""].dom-more.dom-mach-link` | guide ([data-tab2="machines"]) |
| avancée | Ouvrir le Comptoir | `button[data-comptoir=""].btn` | guide (#dcomptoir) |
| avancée | Supraconducteur 0 / 380 | `div[data-goto="supra"].cost-row` | info-bulle : Supraconducteur (toucher pour inspecter) |
| avancée | Fournir | `button[data-contrib="dyson"].btn` | info-bulle : Déposer depuis ta Réserve ce qu’il demande |
| avancée | Alimenté ✓ | `button[data-feed="dyson"].btn` | guide (.dom-oeuvre [data-feed]) |
| avancée | Tout ce qui entre et sort, par ressource | `summary` | info-bulle : Plier ou déplier le tableau |
| avancée | Bois+20/min8,73 k | `div[data-goto="bois"].u-pr` | info-bulle : Bois (toucher pour inspecter) |
| avancée | Domaine | `button[data-tab="domaine"]` | info-bulle : Tes terres, tes gisements et ce qu’ils produisent |
| avancée | Carte | `button[data-tab="carte"]` | info-bulle : Le monde, terre par terre, et ce qu’il reste à explorer |
| avancée | Atelier | `button[data-tab="atelier"]` | info-bulle : Poser tes ressources, lancer une action |
| avancée | Arbre | `button[data-tab="arbre"]` | info-bulle : Qui sert à quoi : une recette, ses ingrédients, ses usages |
| avancée | Carnet | `button[data-tab="carnet"]` | info-bulle : Toutes tes recettes, avec la quantité et les commandes |
| avancée | Journal | `button[data-tab="journal"]` | info-bulle : Ce que tu as trouvé et compris ; guide (#tabs [data-tab="journal"]) |

## Carte (12 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| neuve | (sans mot) | `g[data-cf="plaine"].c-ahead` | lecteur d’écran : des herbes hautes, au loin |
| neuve | (sans mot) | `g[data-cf="riviere"].c-ahead` | lecteur d’écran : Une terre inconnue |
| neuve | (sans mot) | `text.c-name` | lecteur d’écran : La Lisière : ouvrir dans le Domaine |
| neuve | (sans mot) | `g[data-camp=""].c-camp` | lecteur d’écran : Ton camp : ouvrir le Domaine |
| neuve | (sans mot) | `g[data-cl="lisiere:0"].c-lieu.next` | lecteur d’écran : La Lisière : Le Grand Chêne, à explorer ; guide ([data-cl="lisiere:0"]) |
| avancée | (sans mot) | `g[data-cf="desert"].c-ahead` | lecteur d’écran : du sable à perte de vue |
| avancée | (sans mot) | `g[data-cf="gisement"].c-ahead` | lecteur d’écran : Une terre inconnue |
| avancée | (sans mot) | `text.c-name` | lecteur d’écran : La Lisière : ouvrir dans le Domaine |
| avancée | (sans mot) | `g[data-camp=""].c-camp` | lecteur d’écran : Ton camp : ouvrir le Domaine |
| avancée | (sans mot) | `g[data-cl="lisiere:0"].c-lieu.done` | lecteur d’écran : La Lisière : Le Grand Chêne, exploré ; guide ([data-cl="lisiere:0"]) |
| avancée | (sans mot) | `g[data-cl="lisiere:2"].c-lieu.locked` | lecteur d’écran : La Lisière : lieu caché, verrouillé |
| avancée | (sans mot) | `g[data-cl="plaine:2"].c-lieu.next` | lecteur d’écran : La Plaine des Hautes Herbes : lieu caché, à explorer |

## Lieu (2 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| neuve | Explorer | `button[data-m="go"].btn` | guide (.modal:not(.hidden) [data-m="go"]) |
| avancée | Un tour · 30 min | `button[data-m="fouille"][data-lvl="1"].btn` | guide (.modal:not(.hidden) .fouille-niv) |

## Atelier (31 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| neuve | ▶ Récolter du bois | `button[data-hloop="lisiere:bois"].btn` | guide ([data-hloop="lisiere:bois"]) |
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
| avancée | 8,80 k +810/min Bois | `button[data-inv="bois"].inv` | info-bulle : Bois : ouvrir sa fiche ; lecteur d’écran : Bois : ouvrir sa fiche ; guide ([data-inv="bois"]) |
| avancée | 0 Archet à feu | `button[data-inv="archet"].inv.zero` | info-bulle : Archet à feu : ouvrir sa fiche ; lecteur d’écran : Archet à feu : ouvrir sa fiche |
| avancée | 1 Tablette des astres | `button[data-inv="tablette"].inv.relic` | info-bulle : Tablette des astres : ouvrir sa fiche ; lecteur d’écran : Tablette des astres : ouvrir sa fiche |

## Journal (14 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| neuve | Fragments | `button[data-jt="fragments"]` | info-bulle : Les morceaux d’histoire retrouvés |
| neuve | Signes | `button[data-jt="signes"]` | info-bulle : Les mots des Anciens et leur sens |
| neuve | Secrets | `button[data-jt="secrets"]` | info-bulle : Ce que tu as trouvé, et ce qu’il reste |
| neuve | Fins | `button[data-jt="fins"]` | info-bulle : Les fins du jeu et ce que tu en sais |
| neuve | Mémoire | `button[data-jt="stats"]` | info-bulle : Ta partie en chiffres |
| avancée | Journal | `button[data-tab2="journal"]` | info-bulle : Ce que tu as trouvé et compris |
| avancée | Cosmos | `button[data-tab2="cosmos"]` | info-bulle : Le ciel, les signes et les Grands Œuvres |
| avancée | Fragments | `button[data-jt="fragments"]` | info-bulle : Les morceaux d’histoire retrouvés |
| avancée | Questions | `button[data-jt="questions"]` | info-bulle : Ce que tu peux demander au Livre |
| avancée | Signes | `button[data-jt="signes"]` | info-bulle : Les mots des Anciens et leur sens |
| avancée | Secrets | `button[data-jt="secrets"]` | info-bulle : Ce que tu as trouvé, et ce qu’il reste |
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
| neuve | ✦ Mémoire des mains | `button[data-cycle=""].btn` | fiche Aide |
| avancée | ✦ Mémoire des mains | `button[data-cycle=""].btn` | fiche Aide |

## Journal · stats (2 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| neuve | ⏎ | `button.btn` | info-bulle : Envoyer ce nom ; lecteur d’écran : Envoyer ce nom |
| avancée | ⏎ | `button.btn` | info-bulle : Envoyer ce nom ; lecteur d’écran : Envoyer ce nom |

## Comptoir (8 boutons, 0 sans explication)

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

## Atelier · filtres (10 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| avancée | Par âge Plus nombreuses ⚡ Flux actifs ⚠️ En déficit Nom (A → Z) Dernières trouvées | `select#isort` | info-bulle : Trier les ressources ; lecteur d’écran : Trier les ressources |
| avancée | Tout 46 | `button[data-if="tout"]` | info-bulle : Toutes tes ressources |
| avancée | En flux 12 | `button[data-if="flow"]` | info-bulle : Celles qui entrent ou sortent en ce moment |
| avancée | 🪨 Brutes 12 | `button[data-if="res"]` | info-bulle : Les ressources brutes, récoltées telles quelles |
| avancée | Pièces 34 | `button[data-if="comp"]` | info-bulle : Les pièces fabriquées à l’Atelier |
| avancée | ✦ Action 9 | `button[data-if="geste"]` | info-bulle : Celles qui servent à l’action choisie |
| avancée | ♥ Favoris 0 | `button[data-if="fav"]` | info-bulle : Celles que tu as marquées d’un ♥ |
| avancée | Inutilisées 4 | `button[data-if="new"]` | info-bulle : Celles qu’aucune recette connue n’utilise encore |
| avancée | À tenter 0 | `button[data-if="try"]` | info-bulle : Les ressources étudiées qui cachent encore une recette |
| avancée | ✕ | `button.toast-x` | lecteur d’écran : Fermer |

## Arbre (7 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| avancée | Progression | `button[data-arb="ensemble"].btn` | info-bulle : Ta progression : ton âge, tes étapes et le prochain objectif |
| avancée | Objectif | `button[data-arb="centre"].btn` | info-bulle : Ton objectif du moment, et ce qu’il demande |
| avancée | (sans mot) | `button[data-arb="chercher"].btn.ghost` | lecteur d’écran : Chercher dans l’arbre |
| avancée | ? Recette à découvrir À découvrir Objectif | `button[data-arbsel="f1"][data-arbn="f1"].arb-card.fantome` | info-bulle : Ouvrir cette branche : ses ingrédients et ses usages |
| avancée | Bois | `button[data-arbsel="bois"][data-arbn="bois"].arb-pas.vu` | info-bulle : Ouvrir : ses ingrédients et ses usages ; lecteur d’écran : Bois, ressource découverte |
| avancée | Charbon | `button[data-arbsel="charbon"][data-arbn="charbon"].arb-pas.allume` | info-bulle : Ouvrir : ses ingrédients et ses usages ; lecteur d’écran : Charbon, déjà fabriqué |
| avancée | ?? | `button[data-arbsel="f1"][data-arbn="f1"].arb-pas.fantome` | info-bulle : Ouvrir : ses ingrédients et ses usages ; lecteur d’écran : Recette à découvrir, à découvrir, objectif |

## Carnet (19 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| avancée | ×1 | `button[data-qty="1"].chipq` | info-bulle : Un seul exemplaire |
| avancée | Apprises | `button[data-cf="tout"]` | info-bulle : Toutes les recettes que tu connais |
| avancée | Prêtes | `button[data-cf="pret"]` | info-bulle : Celles que ta Réserve couvre entièrement, pièces comprises |
| avancée | Réalisables | `button[data-cf="craft"]` | info-bulle : Celles dont les pièces manquantes peuvent encore être fabriquées |
| avancée | À découvrir | `button[data-cf="unk"]` | info-bulle : Celles qu’il te reste à découvrir |
| avancée | Extracteurs | `button[data-cf="ext"]` | info-bulle : Les bâtiments qui récoltent à ta place |
| avancée | Outils | `button[data-cf="tool"]` | info-bulle : Les outils et leurs améliorations |
| avancée | Machines | `button[data-cf="mach"]` | info-bulle : Les machines qui fabriquent seules |
| avancée | ★ Épinglées | `button[data-cf="pin"]` | info-bulle : Tes épingles, en haut de l’Atelier |
| avancée | ▴ Plier | `button[data-age-all=""].age-pill.age-all` | info-bulle : Replier tous les âges ; lecteur d’écran : Replier tous les âges |
| avancée | Âge 1 | `button[data-age-jump="0"].age-pill` | info-bulle : Âge du Bois ; lecteur d’écran : Aller à : Âge du Bois |
| avancée | ☆ | `button[data-pin="bobine"].pinb` | info-bulle : Épingler cette recette en haut de l’Atelier ; lecteur d’écran : Épingler cette recette en haut de l’Atelier ; guide ([data-pin]) |
| avancée | 6 Fil de cuivre | `span[data-need="fil_cuivre"][data-q="6"][data-goto="fil_cuivre"].ing.link` | info-bulle : Ouvrir sa fiche |
| avancée | Fabriquer | `button[data-cr="bobine"][data-n="1"][data-lbl="Fabriquer"].btn.make` | info-bulle : Commander cette quantité, pièces comprises |
| avancée | (sans mot) | `button[data-tree="bobine"][data-n="1"].btn.ghost` | info-bulle : Les étapes de cette commande, et ce qu’il manque ; lecteur d’écran : Détail du lot |
| avancée | (sans mot) | `button[data-track="bobine"].btn.ghost` | info-bulle : Suivre cette recette ; lecteur d’écran : Suivre ; guide ([data-track]) |
| avancée | 🌿 | `button[data-situer="bobine"].btn.ghost` | info-bulle : Situer dans l’Arbre ; lecteur d’écran : Situer dans l’Arbre |
| avancée | ♨1 Circuit de vapeur | `span[data-goto="circuit_vapeur"].ing.link` | info-bulle : Ouvrir sa fiche |
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

## Fiche d’un objet (15 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| avancée | ♡ | `button[data-m="fav"].pinb.fav` | info-bulle : Ressource favorite (en tête de liste à l’Atelier) ; lecteur d’écran : Ressource favorite |
| avancée | ☆ | `button[data-m="pin"].pinb` | info-bulle : Épingler la recette en haut de l’Atelier ; lecteur d’écran : Épingler la recette en haut de l’Atelier |
| avancée | Fil de cuivre (prêt à fabriquer) 3 / 6 › | `button[data-m="nav"][data-id="fil_cuivre"].ring` | info-bulle : Ouvrir sa fiche : ce qu’il faut, et ce que tu as |
| avancée | Fabriquer | `button[data-m="cr"][data-cr="bobine"][data-n="1"].btn` | info-bulle : Commander 1 exemplaire, pièces comprises |
| avancée | ×10 | `button[data-m="cr"][data-cr="bobine"][data-n="10"].btn` | info-bulle : Commander 10 exemplaires d’un coup, pièces comprises |
| avancée | ×50 | `button[data-m="cr"][data-cr="bobine"][data-n="50"].btn` | info-bulle : Commander 50 exemplaires d’un coup, pièces comprises |
| avancée | ×100 | `button[data-m="cr"][data-cr="bobine"][data-n="100"].btn` | info-bulle : Commander 100 exemplaires d’un coup, pièces comprises |
| avancée | ×1000 | `button[data-m="cr"][data-cr="bobine"][data-n="1000"].btn` | info-bulle : Commander 1000 exemplaires d’un coup, pièces comprises |
| avancée | Max | `button[data-m="cr"][data-cr="bobine"][data-n="max"].btn` | info-bulle : Tout ce que ta Réserve permet, pièces comprises |
| avancée | Détail | `button[data-m="tree"].btn.ghost` | info-bulle : Détail : les étapes de la commande et ce qu’il manque |
| avancée | Suivre | `button[data-m="track"].btn.ghost` | info-bulle : Suivre : ce qui manque s’affiche en haut du Domaine, avec le temps estimé |
| avancée | Aimant | `button[data-m="nav"][data-id="aimant"].ing.link` | info-bulle : Ouvrir sa fiche |
| avancée | Étudier · 3 | `button[data-m="study"].btn` | guide (.modal:not(.hidden) [data-m="study"]) |
| avancée | Carnet | `button[data-m="carnet"].btn.ghost` | info-bulle : Voir sa recette dans le Carnet |
| avancée | Voir dans l’arbre | `button[data-m="arbre"].btn.ghost` | info-bulle : Voir ses ingrédients et ses usages dans l’arbre |
