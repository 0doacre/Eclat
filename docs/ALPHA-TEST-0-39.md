# Vers l'alpha testée : dossier de préparation (0.39)

Préparé le 30 octobre 2026 pour le point « roadmap Alpha » demandé par le porteur du projet. Il complète `docs/TEST-JOUEURS.md` (consigne, feuille, synthèse, déjà prêts, à reprendre tels quels) et `docs/PLAN-ALPHA.md` (dont la mise à jour du 28 octobre dit que la priorité est de valider le rythme, les reprises et l'intérêt des relèves). Ce document ne modifie ni l'un ni l'autre : il dit **quand** on peut tester, **quoi** ajouter à la grille pour la refonte 0.39, et **ce qu'il faut avoir réglé avant**.

## 1. Quand peut-on faire tester ?

Pas avant que la refonte 0.39 soit fusionnée dans `prewiew-design` et que tu l'aies jouée. Tester l'ancienne structure (six onglets, Domaine de 3 000 px) ferait mesurer ce qu'on est en train de remplacer. Ordre proposé :

1. Gemini et Codex rendent leurs lots → revue de Claude à 390 px → fusion dans `prewiew-design`.
2. **Toi** : tu joues la preview, tu retouches avec nous (la « retouche » prévue après le scénario S2).
3. **Portes d'entrée de l'alpha** (section 2), à cocher.
4. **Séances observées** de 5 à 8 joueurs (section 4), sur une version figée.
5. Synthèse, trois décisions, puis seulement ensuite une alpha ouverte plus largement.

Je ne donne pas de dates : elles dépendent du retour des deux lots et de tes disponibilités. Compter une semaine de calendrier entre la fusion et la première séance est raisonnable (jouer, retoucher, figer).

## 2. Portes d'entrée : à avoir avant la première séance

| # | Porte | État au 30 octobre | Qui |
|---|---|---|---|
| P1 | La refonte 0.39 fusionnée, jouée par l'auteur, retouchée | en cours | Gemini, Codex, Claude, toi |
| P2 | `npm test` et Playwright verts en CI | tests verts en local ; Playwright jamais exécuté en local | Gemini |
| P3 | Les vues principales ne défilent pas (R4, `tools/test-ux.js`) | à créer | Gemini |
| P4 | Un message d'alpha dans le jeu : « alpha, les sauvegardes peuvent encore migrer », sobre, avec export de sauvegarde mis en avant | pas fait (PLAN-ALPHA, point 4) | Gemini (texte validé par toi) |
| P5 | Un moyen simple de **nous écrire** depuis le jeu (lien de retour, adresse ou formulaire) | pas fait | toi (où ? qui reçoit ?) |
| P6 | Aide : chaque bouton de l'interface a une explication (tutoriel exhaustif) | pas fait (A-FAIRE) | Gemini, texte relu par toi |
| P7 | Les textes relus : `docs/revue/`, les 23 recettes d'extracteurs | pas fait | toi, avec Claude |
| P8 | Une version **figée** pour la durée des séances : même adresse, même build, noté dans la feuille | à décider | Claude |
| P9 | Un second appareil prêt (téléphone qui n'est pas celui de l'auteur) | à prévoir | toi |
| P10 | Les terres 0.37.1 (`data/terres-ages-0-37-1`) : décider si elles entrent dans la version testée | en attente (PR non ouverte, `gh` non connecté) | toi |

Sur P10 : si les testeurs jouent 20 à 30 minutes, ils ne verront pas le Désert ni le Gisement. La décision compte surtout pour le test de rythme (section 6), pas pour les séances de découverte.

## 3. Ce que la grille actuelle mesure déjà

Premier objet en moins de 2 minutes sans aide, savoir dire quoi faire à la 10ᵉ minute, réouverture le lendemain, comprendre à quoi sert le jeu, comprendre la relève, envie de continuer. Garder ces six mesures **inchangées** : elles permettent de comparer avec Marion et avec les tests suivants.

## 4. Ce qu'il faut ajouter pour la refonte 0.39

Quatre questions de conception que seule l'observation tranche. À ajouter à la feuille d'observation, section « SANS LE DIRE AU TESTEUR » :

```
REFONTE 0.39
  Trouve de lui-même qu'on glisse d'une terre à l'autre (sans aide) :  oui / non   temps :
  Récolte en un appui, dès l'ouverture de l'onglet Terres :          oui / non
  Ouvre le Labo de lui-même :                       oui / non   à la minute :
  Dit à quoi sert le Labo, avec ses mots :                       ____________________
  Dit à quoi sert l'Atelier, avec ses mots :                     ____________________
  Confond Labo et Atelier (essaie de produire au Labo, ou d'essayer à l'Atelier) : oui / non
  Comprend qu'il garde la première pièce :           oui / non / n'a pas vu
  Confie une recette à un apprenti sans aide :       oui / non / n'a pas atteint
  Ouvre l'Atlas, et pourquoi :                       oui / non
  Dit que l'illustration en fond de terre l'aide / le gêne / ne la remarque pas : ________
  Nombre de fois où il cherche une chose qu'il avait vue ailleurs :  ___
```

Trois questions de fin à ajouter :
10. « Si tu devais expliquer à un ami la différence entre le Labo et l'Atelier, tu dirais quoi ? »
11. « Tu as trouvé facilement où récolter ? Où fabriquer ? Où essayer de nouvelles choses ? »
12. « Qu'est-ce que tu aurais voulu voir tout de suite, sans chercher ? »

Seuils de lecture (même règle que le reste : un point touchant au moins deux testeurs devient une tâche) :

| Signal | Seuil d'alerte |
|---|---|
| Ne découvre pas le glissement entre terres | 3 testeurs sur 8 → ajouter une indication visible |
| Confond Labo et Atelier | 3 sur 8 → revoir les noms ou fusionner en un onglet à deux modes (option B3 de l'étude) |
| Ne comprend pas qu'il garde la première pièce | 3 sur 8 → texte plus clair |
| N'ouvre jamais le Labo avant la 15ᵉ minute | 4 sur 8 → le Labo n'est pas assez appelé par le guide |

## 5. Qui tester

Reprendre la liste de `TEST-JOUEURS.md` (idle, Little Alchemy ou Infinite Craft, peu de téléphone, Marion, grand lecteur). Ajouter, pour la refonte :

- **une personne qui connaît la version précédente** (Marion, si possible) : elle dira ce qui lui manque et ce qui l'aide ;
- **une personne qui n'a jamais vu aucune version** : c'est le test des nouveaux noms.

Cinq séances suffisent pour voir les gros défauts. Huit permettent de séparer les profils. Ne pas dépasser huit avant d'avoir corrigé : au-delà, on revoit les mêmes défauts.

## 6. Deux tests qui ne sont pas des séances de 30 minutes

- **Le rythme sur la durée** : deux ou trois joueurs motivés jouent une semaine en notant leur âge et leur terre chaque jour (modèle : une ligne par jour dans un message). On y vérifie la sensation « bloqué en Collines » et le plan 0.37.1. À lancer après les séances de découverte, pas avant.
- **Le retour le lendemain** (section 5 de `TEST-JOUEURS.md`) : à faire pour chaque séance, message neutre à J+1.

## 7. Ce qu'on ne fera pas avant les séances

Éclater la mesure en outils d'analyse automatique, écrire les indices de secrets, rééquilibrer les âges. On observe d'abord, on décide ensuite. La seule exception possible : un bug bloquant trouvé en P1 à P3.

## 8. Ce que je prépare, ce que je te demande

**Je prépare :** la feuille d'observation fusionnée (section 4 intégrée à `docs/TEST-JOUEURS.md` quand la version testée est figée), un script de relevé d'état de partie à copier depuis le menu ☰ (version, âge, terre, temps de jeu) pour ne pas dépendre de ce que dit le testeur, et la synthèse vide.

**Je te demande, quand tu as le temps :**
1. Où doivent arriver les retours (P5) : adresse, formulaire, ou rien dans le jeu et seulement des séances en personne pour cette première série.
2. Qui tu peux solliciter (cinq prénoms ou profils), pour que je dise lesquels manquent.
3. Si l'alpha reste « invitation seulement » après les séances, ou si tu veux déjà une liste d'attente.
4. Le texte du message d'alpha (P4) : je peux proposer trois formulations sobres.
