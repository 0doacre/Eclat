# Tester Éclat avec de vrais joueurs

Ce fichier sert à mener une séance d'alpha : quoi dire, quoi préparer, quoi regarder, quoi noter. Il complète `docs/ALPHA-TEST-0-39.md` (les portes d'entrée de l'alpha) et `docs/PLAN-ALPHA.md` (les réglages figés pour l'alpha). Les numéros P1 à P10 renvoient au premier.

## 1. Avant la séance (10 minutes)

À cocher, à chaque séance.

- [ ] **Adresse figée** : le testeur joue sur l'adresse de la branche `alpha` (P8), jamais sur `main`. Noter le numéro de version et de build (menu ☰, en bas).
- [ ] **Partie neuve** : appareil sans sauvegarde d'Éclat (P9). Sur un téléphone déjà utilisé : navigation privée, ou menu ☰, Système, « Recommencer la partie ».
- [ ] **Téléphone, pas ordinateur** : le jeu est pensé pour 390 px de large. Écran allumé, son activé ou coupé, au choix du testeur.
- [ ] **Chronomètre** et feuille d'observation (section 4) à portée de main.
- [ ] **Mail de retour** (P5) connu de l'observateur : le lien « Nous écrire » est dans le menu ☰, Aide.
- [ ] **Aucun réglage touché** : ne pas modifier `D.PARCOURS` ni les prix pendant la série. Les réglages de l'alpha sont notés dans `docs/PLAN-ALPHA.md`.

## 2. La consigne (à dire, mot pour mot)

> « Je teste un jeu, pas toi. Joue comme tu le ferais chez toi. Je ne t'aiderai pas : si tu bloques, c'est une information pour moi. Dis à voix haute ce que tu fais et ce que tu comprends, même si ça te paraît bête. Tu peux t'arrêter quand tu veux. »

Ne rien expliquer du jeu avant. Ne pas dire « Labo », « Atelier » ni « relève ».

**Quand le testeur demande de l'aide**, répondre : « Qu'est-ce que tu essaies de faire ? » Noter la question. Ne donner la réponse qu'après deux minutes de blocage, et le noter aussi.

## 3. Le déroulé (30 minutes)

| Minute | Ce qui se passe | Ce qu'on regarde |
|---:|---|---|
| 0 | Le testeur ouvre le jeu | Premier geste : récolte, lecture, exploration ? |
| 0 à 2 | Premier objet | Y arrive-t-il sans aide en moins de 2 minutes ? |
| 2 à 10 | Récolte, essais au Labo | Comprend-il à quoi sert chaque écran ? |
| 10 | On demande : « Qu'est-ce que tu comptes faire maintenant ? » | Sait-il quoi faire à la 10ᵉ minute ? |
| 10 à 25 | Jeu libre, premier passage, Atelier | Où bloque-t-il, que cherche-t-il ? |
| 25 à 30 | La première relève, si elle arrive | La comprend-il ? Que dépense-t-il ? |
| 30 | Fin, questions (section 5) | |

Ne jamais interrompre avant la minute 30 sauf si le testeur le demande. Si la première relève n'est pas arrivée à la minute 30, continuer jusqu'à 45 puis arrêter.

## 4. La feuille d'observation

À remplir pendant la séance, sans le dire au testeur. Une feuille par séance.

```
SÉANCE
  Testeur (prénom ou profil) :            Date :
  Appareil :                              Version / build :
  Habitude de jeu : idle / craft / peu / jamais

LES SIX MESURES (inchangées, pour comparer avec les séances précédentes)
  1. Premier objet en moins de 2 minutes, sans aide :      oui / non   temps :
  2. Sait dire quoi faire à la 10e minute :                oui / non   (ses mots : ________)
  3. Rouvre le jeu le lendemain (message à J+1) :          oui / non / pas encore demandé
  4. Comprend à quoi sert le jeu :                         oui / non   (ses mots : ________)
  5. Comprend la relève :                                  oui / non / n'a pas atteint
  6. Envie de continuer (échelle de 1 à 5) :               ___

REFONTE 0.39 (terres, Labo, Atelier)
  Trouve de lui-même qu'on glisse d'une terre à l'autre :  oui / non   temps :
  Récolte en un appui, dès l'ouverture de l'onglet Terres : oui / non
  Ouvre le Labo de lui-même :                              oui / non   à la minute :
  Dit à quoi sert le Labo, avec ses mots :                 ________________
  Dit à quoi sert l'Atelier, avec ses mots :               ________________
  Confond Labo et Atelier :                                oui / non
  Comprend qu'il garde la première pièce offerte :         oui / non / n'a pas vu
  Confie une recette à un apprenti sans aide :             oui / non / n'a pas atteint
  Ouvre l'Atlas, et pourquoi :                             oui / non
  Nombre de fois où il cherche une chose vue ailleurs :    ___

LABO, ATELIER, CARNET (0.64 et 0.65)
  Après avoir trouvé une recette, fabrique-t-il tout de suite :   oui / non
  Utilise « Fabriquer » sous « Recette trouvée » :                oui / non / n'a pas vu
  Lit le message « Recette déjà connue » et suit le bouton Atelier : oui / non / n'a pas vu
  Ouvre le Journal pour chercher ses recettes :                   oui / non   (où les cherche-t-il d'abord : ________)
  Comprend que le Carnet se lit et que l'Atelier fabrique :       oui / non
  Trouve la section « À construire » d'un métier :                oui / non / n'a pas vu
  Texte ou icône qui se chevauche, coupé, illisible :             ________________ (écran)

RELÈVE ET RETOUR DE MÉMOIRE
  Minute de la première relève :                                  ___   (écart avec le simulateur : 23 à 34 min)
  Réaction à la relève forcée (frustration, curiosité, agacement) : ________________
  Dépense ses Souvenirs : Mains calleuses / Mains sûres / gisements / autre : ________
  Comprend ce que fait chaque amélioration de la Mémoire :        oui / non
  Retrouve son front précédent plus vite (sensation de ×3) :      oui / non   (ses mots : ________)
  Retour de mémoire : lit les phrases de chaque âge :             oui / non / « Tout relire »
  Frustration au retour de mémoire (un seul appui par âge) :      ________________

BLOCAGES (une ligne par blocage : minute, écran, ce qu'il essaie, ce qui l'arrête, aide donnée ou non)
  ______________________________________________
  ______________________________________________
```

## 5. Les questions de fin (à poser dans cet ordre)

1. « Raconte-moi ce que tu as fait. »
2. « À quoi sert ce jeu, selon toi ? »
3. « Qu'est-ce qui t'a plu ? »
4. « Qu'est-ce qui t'a gêné ou agacé ? »
5. « À quel moment tu as hésité ? »
6. « Qu'est-ce que tu ferais la prochaine fois que tu y joues ? »
7. « Tu y rejouerais ? Pourquoi, ou pourquoi pas ? »
8. « Que veut dire passer le relais, pour toi ? »
9. « Qu'est-ce que tu as gardé, et qu'est-ce que tu as perdu en passant le relais ? »
10. « Si tu devais expliquer à un ami la différence entre le Labo et l'Atelier, tu dirais quoi ? »
11. « Tu as trouvé facilement où récolter ? Où fabriquer ? Où essayer de nouvelles choses ? »
12. « Qu'est-ce que tu aurais voulu voir tout de suite, sans chercher ? »
13. « Où irais-tu chercher une recette que tu as déjà trouvée ? »
14. « La première relève est arrivée : c'était trop tôt, au bon moment, ou trop tard ? »

## 6. Le retour le lendemain (J+1)

Le lendemain, un message neutre : « Si tu as 5 minutes, dis-moi ce dont tu te souviens du jeu. » Ne pas le relancer.

On note : a-t-il rouvert le jeu de lui-même (oui ou non), ce qu'il en raconte, ce qu'il a oublié.

## 7. Après la séance

1. **Dans l'heure** : recopier la feuille au propre, ajouter le numéro de build, noter trois choses marquantes.
2. **Après chaque série de cinq à huit séances** : une ligne par signal.

| Signal | Seuil d'alerte | Que faire |
|---|---|---|
| Ne découvre pas le glissement entre terres | 3 testeurs sur 8 | Ajouter une indication visible |
| Confond Labo et Atelier | 3 sur 8 | Revoir les noms |
| Ne comprend pas qu'il garde la première pièce | 3 sur 8 | Texte plus clair |
| N'ouvre jamais le Labo avant la 15ᵉ minute | 4 sur 8 | Le guide n'appelle pas assez le Labo |
| Cherche ses recettes ailleurs que dans le Journal | 3 sur 8 | Une entrée plus visible vers le Carnet |
| Trouve la première relève trop tôt ou trop tard | 3 sur 8 | Déplacer `D.PARCOURS.passage` d'une terre |
| Ne ressent pas un gain de ×3 après la relève | 3 sur 8 | Augmenter `D.PARCOURS.gift` ou conseiller des achats |
| Frustration au retour de mémoire | 3 sur 8 | Proposer « Tout relire » plus tôt |

3. **Trois décisions** à rendre après la série : ce qu'on change tout de suite, ce qu'on change après la deuxième série, ce qu'on laisse.
4. Un point touchant au moins deux testeurs devient une tâche dans `docs/A-FAIRE.md`. Un point isolé reste une note.

## 8. Qui tester

Cinq séances suffisent pour voir les gros défauts, huit pour séparer les profils. Ne pas dépasser huit avant d'avoir corrigé : au-delà, on revoit les mêmes défauts. Varier :

- une personne qui joue à des jeux incrémentaux (clicker, idle) ;
- une personne qui connaît Little Alchemy ou Infinite Craft ;
- une personne qui joue peu sur téléphone ;
- une personne qui connaît une version précédente d'Éclat ;
- une personne qui n'a jamais vu aucune version ;
- une grande lectrice ou un grand lecteur, pour les textes.

## 9. Ce qu'on ne fait pas pendant les séances

Pas de correction sur la branche `alpha` entre deux séances d'une même série. Pas de réglage des prix, des relèves ou des âges. Les corrections se font sur `main`, et passent sur `alpha` entre deux séries, avec le numéro de build noté.
