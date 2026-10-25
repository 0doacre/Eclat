# Comparaison des audits de la 0.21.0

25 octobre 2026. Jeu examiné : **`4a761845f88be5d46163ca318241044ea207b6be`**, 0.21.0. Les ajouts de la branche d’audit n’altèrent aucune règle du jeu.

La comparaison porte sur le rapport Codex du dépôt et sur **le résumé de Claude transmis par l’auteur**. Le rapport intégral de 301 lignes et ses scripts, situés dans un scratchpad Linux de Claude, ne sont pas présents ici. Les points ci-dessous distinguent donc les reproductions effectuées ici des tests seulement déclarés par Claude. Ses numéros C-01 à C-05 ne correspondent pas aux numéros C01 à C05 du rapport Codex.

## Conclusion commune et ordre de travail

Les chaînes ordinaires sont atteignables et les nouvelles ressources donnent des usages aux recettes. Les tests de migration des anciennes commandes passent. Les audits n’établissent pas une durée réaliste de partie humaine et ne valident pas l’économie à eux seuls.

Les vérifications complémentaires changent l’ordre proposé :

1. **Protéger les sauvegardes** contre une autre page périmée et rendre les échecs d’écriture visibles.
2. **Rendre l’empreinte du cache reproductible entre systèmes** et la contrôler sur les octets déployés.
3. **Recalibrer ensemble prix, ventes, demandes et Traces**, avant d’étendre les ressources à d’autres âges.
4. **Corriger les trois cas ciblés de guidage**, puis tester les étapes obligatoires et la courbe avec des joueurs.

Il s’agit d’un ordre de correction proposé, pas de modifications déjà réalisées.

## Tableau de confrontation

| Sujet | Codex initial | Claude, résumé reçu | Résultat de la confrontation |
|---|---|---|---|
| Références, ressources, stations, atteignabilité | Contrôles structurels positifs ; six parcours finissent | Tous les objets non secrets atteignables ; 25 parcours guidés | Accord sur la cohérence générale. Ces parcours ne couvrent pas tous les ordres de fabrication. |
| Commandes 0.20 après migration | Testées avec prix d’origine et rechargements | Annonce le même résultat | Accord ; les prix des nouveaux lots restent distincts. |
| Deux onglets, sauvegarde périmée | Hors des scénarios du premier audit | C-01, P1 : écrasement reproduit | **Ajout majeur de Claude, reproduit ici dans Chrome.** Prioritaire. |
| Échec de sauvegarde | Hors des scénarios du premier audit | C-05, P2 : exception ignorée, absence de persistance | **Ajout confirmé** par une erreur de quota injectée. Le risque d’éviction sur appareils reste à mesurer. |
| BUILD du service worker | `npm test` passait sous Windows | C-02, P2 : test rouge sous Linux | **Claude a raison.** La cause vérifiée est l’écart CRLF/LF entre le checkout Windows et les blobs Git. |
| Eau, soufre, écus et Traces | C01, P1 : âge technique confondu avec valeur ; eau 83 Traces | C-03, P2 : même mesure, autres extracteurs et progression de prix | Accord sur les faits économiques. Les modifications proposées doivent respecter les décisions de conception plus récentes. |
| Demandes du Troqueur | Pas étudiées quantitativement au premier audit | C-04, P2 : quantités et intérêt très irréguliers | **Ajout confirmé.** Pourcentage et rentabilité dépendent aussi de la prochaine terre, du rang et de la saturation. |
| Dernier objectif fabriqué trop tôt | C02, P2 : objectif et guide deviennent nuls | Pas signalé ; les parcours aléatoires annoncés finissent | Pas de contradiction : le cas ciblé reste reproductible. Les parcours annoncés ne prouvent pas qu’il est impossible. |
| Guide et pièces déjà en Réserve | C03, P2 : sous-recette demandée alors que la cible est fabricable | Pas signalé | Reproduction Codex maintenue. |
| Extracteur possédé mais arrêté | C04, P2 : pas de distinction dans le guide | Pas signalé | Reproduction maintenue ; le cas d’un extracteur libre bénéficie déjà d’une pose automatique par commande. |
| Bonus appliqués aussi aux chantiers | C05, P3 : description incomplète | Pas signalé | Point de lisibilité maintenu, moins urgent que sauvegardes et économie. |
| Fuzz, non-négativité, égalité en ligne/hors ligne | Suites existantes et sondes ciblées | Environ 900 cas de fuzz et égalité en ligne/hors ligne | Tests **annoncés par Claude**, non rejoués à l’identique faute de ses scripts. Pas de motif pour les invalider ; ne pas les présenter comme refaits ici. |

## Sauvegardes : deux confirmations nouvelles

### Écrasement entre pages

Deux pages Chrome partagent le même profil et le même stockage local. A et B chargent 100 bois. B gagne 32 bois et sauvegarde : le stockage contient 132. A reste à 100 et appelle `save()` : le stockage revient à **100**.

Reproduction sans attendre la sauvegarde automatique : `tools/audit-sauvegarde-navigateur.js`. Un seul profil jetable, service worker bloqué, intervalles de sauvegarde désactivés pour isoler les appels explicites. Les règles de sauvegarde exécutées sont celles du jeu.

La proposition de Claude va dans la bonne direction : détecter une écriture concurrente, protéger la partie périmée et conserver un secours. Une simple révision relue avant écriture n’est cependant pas une transaction atomique entre deux pages. La correction devra définir **un seul rédacteur autorisé**, une détection de conflit et la manière de reprendre la bonne partie. Ne pas fusionner automatiquement des inventaires ou des commandes divergents.

L’événement [`storage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/storage_event) informe les autres documents de même origine ; il n’est pas déclenché dans celui qui a écrit. C’est un moyen de notification, pas à lui seul une garantie contre toute course d’écriture.

### Erreur de quota

Le même script remplace temporairement l’écriture de la clé du jeu par une exception `QuotaExceededError`. Résultat : un essai d’écriture, aucune erreur propagée par `save`, ancienne sauvegarde inchangée à 100 bois, partie vivante à 149. Le `catch` de `save()` ignore l’échec ; il ne donne pas au joueur de signal pour conserver ses nouveaux progrès.

**À faire :** état d’enregistrement en erreur, message compréhensible, export accessible tant que la partie vit encore en mémoire, et reprise contrôlée des écritures. Les secours dans le même stockage ne remplacent pas un export.

`navigator.storage.persist()` est absent. Sa demande et son résultat peuvent améliorer la rétention, mais ne constituent pas une garantie d’acceptation ni une protection contre un effacement volontaire. La [documentation de `persist()`](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist) le précise. L’éviction réelle après plusieurs jours, notamment sur téléphone, n’a pas été reproduite dans cette confrontation.

## Service worker : résolution du désaccord Windows/Linux

Claude trouve `a4ddd3b89b ≠ 960245df44`. Les deux valeurs sont reproductibles sur le même code :

| Calcul pour le commit 4a76184 | Empreinte |
|---|---|
| `BUILD` enregistré dans `sw.js` | `a4ddd3b89b` |
| Fichiers du checkout Windows avec leurs CRLF | `a4ddd3b89b` |
| Blobs Git du commit, avec leurs LF | **`960245df44`** |
| Checkout Windows après normalisation CRLF → LF pour les fichiers texte | **`960245df44`** |

`core.autocrlf=true` vient ici de la configuration Git Windows. `tools/build.js` hache les octets tels que lus sur disque. Le rapport de Claude ne montre donc pas un échec intermittent : **le contrôle dépend de la représentation locale des fichiers**. Mon contrôle Windows passait réellement, mais j’avais conclu trop largement à la validité du BUILD pour le dépôt déployé.

Correction proposée : choisir des fins de ligne canoniques pour les fichiers texte, rendre le calcul reproductible et régénérer l’empreinte ; ajouter un contrôle sur checkout propre en intégration continue. Les images, fontes et autres fichiers binaires doivent rester inchangés. Relancer seulement `node tools/build.js` avec une configuration différente déplacera le problème d’un système à l’autre.

Cela ne prouve pas qu’une sauvegarde ou qu’un cache joueur est déjà endommagé. Le problème confirmé est le contrôle de livraison et la reproductibilité de l’empreinte.

Reproduction : `node tools/audit-build-portabilite.js`. Le script lit le commit de référence dans Git et le compare au checkout, sans réécrire le service worker.

## Comptoir : accord sur le problème, corrections à départager

Le prix initial d’une ressource augmente en `2,5^âge`, alors que le coût de base d’une Trace augmente en `1,8^âge`. À volume comparable d’une ressource brute de l’âge courant, l’écart augmente donc d’un facteur `(2,5 / 1,8)^âge`. La saturation par objet réduit la vente répétée d’un même objet, mais laisse des saturations distinctes aux autres produits.

Nos mesures concordent : 83 Traces pour 12 h d’une pompe à l’âge 7 ; 310 pour la bauxite à l’âge 11. Le soufre à 260 ne doit pas être présenté comme le seul problème nouveau : la bauxite donnait déjà davantage au même âge. Le nouvel accès au soufre dans les Collines change néanmoins le moment où ce type de revenu devient disponible.

### La hausse « par achat » n’a pas été oubliée par hasard

Le prompt 5.4 prévoyait bien `traceAge: 2.5` et une hausse à chaque achat de Trace. Mais le prompt **5.9**, plus récent, supprime l’achat unitaire et demande explicitement une conversion à la relève **« sans la hausse par achat »**. `traceUp` est aujourd’hui un paramètre mort à nettoyer, pas une preuve suffisante d’un mécanisme perdu par erreur.

Ainsi :

- **Aligner `traceAge` et `rawAge`** est une piste d’équilibrage à simuler. Cela ne règle pas à lui seul le prix relatif de l’eau par rapport au cuivre ni le calibrage des demandes.
- **Rétablir `traceUp`** changerait une décision de conception explicite. Ce n’est pas une correction technique à appliquer automatiquement.
- **Limiter les Traces du Comptoir par les Traces des passages** peut servir de scénario d’essai. En faire un invariant universel modifierait aussi le jeu hors ligne et les cycles de vente ; l’auteur doit choisir la part souhaitée de chaque source.
- La Mémoire coûte bien **10 459 Traces** au total. En déduire qu’elle sera entièrement acquise « vite » demanderait encore un modèle qui vend, convertit, recommence et reconstruit, avec les coûts et les temps correspondants.

Je recommande de mesurer séparément l’effet d’une valeur marchande explicite des ressources, du prix de conversion et de la saturation. Le scénario de référence doit inclure ventes et relèves, ce que ne faisait pas notre bot de fin.

## Demandes du Troqueur : ce que les mesures confirment

Les demandes portent sur des pièces connues et déjà fabriquées, d’un âge entre `âge-1` et l’âge courant. La récompense dépend du **prochain passage**, pas seulement de l’âge. La quantité découle d’une valeur monétaire : `size × prixTrace × récompense / E.value(objet)`, puis arrondi.

Avec les pièces ordinaires de ces âges marquées connues et fabriquées et les stations correspondantes disponibles :

| État isolé | Pièces éligibles | Demandes dépassant 100 000 unités brutes | Médiane brute | Exemple graphite |
|---|---:|---:|---:|---|
| Âge 10, prochain passage Pics | 11 | 5/11, soit 45,5 % | 90 000 | 57 000 pièces, soit 456 000 charbons |
| Âge 10, prochain passage Orbite | 11 | **7/11, soit 63,6 %** | 135 000 | **86 000 pièces**, soit 688 000 charbons |
| Âge 12, prochain passage Orbite | 21 | 0 | 721 | Non éligible |
| Âge 12, prochain passage Lune | 21 | 0 | 1 120 | Non éligible |

Le chiffre de **63 %** et l’exemple « graphite ×86 000 » de Claude sont donc reproduits en précisant l’état du prochain passage. Sa médiane de 1 093 à l’âge 12 n’est pas retrouvée exactement avec ces états ; le changement d’échelle est confirmé. Il faudrait ses scripts et son état exact pour expliquer l’écart restant. La somme d’unités brutes est ici un indicateur de volume, pas une mesure universelle de temps : une unité de charbon et une unité d’un minerai rare ne demandent pas le même effort.

### Deux nuances pour choisir la correction

**Les ingrédients sont déjà pris en compte.** `E.value` additionne récursivement leur valeur et ajoute un coefficient de travail. Le problème n’est donc pas une absence de coût des matières. La quantité ne dépend cependant pas de la production réelle du joueur, de sa Réserve ni de la durée des fabrications. La formulation utile est « calibrer sur une charge de production raisonnable », plutôt que simplement « calculer sur les matières ».

**Vente et livraison doivent être comparées après saturation et selon le rang.** À l’âge 10, prochain passage Orbite, livrer les 86 000 graphites rapporte 6 Traces de base ; les vendre, sans vente préalable de graphite, donne environ **1,06 Trace** d’écus. La vente n’est pas meilleure dans ce cas. À l’âge 12, prochain passage Orbite et au rang initial, la vente est en revanche plus avantageuse pour les 21 pièces éligibles ; au rang maximal, pour 19/21. Le déséquilibre relevé par Claude est réel, mais sa direction n’est pas uniforme.

Correction proposée : déterminer une durée/charge cible de demande, borner son volume à ce que le joueur peut raisonnablement fournir, puis vérifier l’intérêt de la livraison face à une vente saturée, avec rang et gains immédiats. Une ressource toujours utile au craft ne doit pas devenir rentable seulement parce qu’on la vend.

Reproductions : `node tools/audit-demandes.js` et `node tools/audit-demandes.js --avance`.

## Progression et couverture des parcours

Le profil paresseux, séances de 3 min séparées de 12 h, retrouve bien les ordres de grandeur cités : Collines après environ **6 jours** et Gisement après **26 jours**, dans ce simulateur aux recettes déjà connues. Sur 180 minutes actives, la 0.21 reste aux Polymères et attend le passage des Pics. Il ne s’agit ni d’un essai sur appareil réel ni d’un résultat de joueur humain.

Les 25 parcours guidés, fabrications anticipées aléatoires et quelque 900 cas de fuzz annoncés par Claude complètent utilement les tests ciblés. Mais le contre-exemple déterministe « forge avant vaisseau/passage Mercure » reste reproductible avec `tools/audit-progression.js` : la fabrication réussit, l’âge reste Spatial et objectif/guide deviennent nuls. Le guide demandant des tuyaux malgré des moteurs déjà réunis et le cas d’un extracteur arrêté restent également présents.

La bonne suite est d’ajouter ces cas ciblés aux scénarios de non-régression, puis d’élargir les parcours aléatoires. Les réussites aléatoires et les échecs ciblés ne s’annulent pas.

## Ce qui est vérifié et ce qui reste ouvert

Reproduits ici : sauvegardes à deux pages, exception de quota, calcul Git/Windows/LF du BUILD, prix et conversion, profils des demandes, cas de guidage et profil paresseux. Les nouveaux outils sont des sondes en lecture seule des règles ; ils observent les défauts au lieu de les masquer.

Non reproduits à l’identique : rapport intégral et scripts de Claude, ses 25 parcours, ses 900 fuzz, l’incident ponctuel de son test mobile et son profil de ventes complet 0.20 → 0.21. Aucun test humain, aucune éviction de stockage sur appareil, aucune conclusion XSS n’est revendiquée.

La comparaison est maintenant suffisante pour choisir les corrections prioritaires. L’ajout de ressources aux autres âges peut attendre que sauvegardes, livraison et revenus de progression aient ces garde-fous.
