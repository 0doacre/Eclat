# Prompt v6.11.0 : Réactivité narrative d'ARCHE & Mémoire des Cycles

> **Version visée** : 6.11.0  
> **Branche de travail** : `gemini-arche-cycles-6-11`

---

## Contexte & Objectif

Dans Éclat, le joueur incarne les Semeurs successifs au fil des cycles (le Semeur 7 au cycle 1, le Semeur 8 au cycle 2, le Semeur 13 au cycle 7, le Semeur 20 au cycle 14...).
Jusqu'alors, les dialogues d'ARCHE et les événements radio/ordinateur avaient figé la mention `SEMEUR 7` en dur, ignorant le cycle réel du joueur.

Ce chantier apporte :
1. **Interpolation dynamique complète** :
   - `{semeur}` : identifiant du Semeur actuel (`cycle + 6`).
   - `{semeur_prev}` : identifiant du Semeur précédent.
   - `{semeur_pad}` : numéro préfixé d'un zéro si inférieur à 10 (`07`, `08`, `13`, `20`).
   - `{cycle}` : cycle actuel (`S.cycle`).
   - `{cuve}` : numéro de la cuve active (`7 + ((cycle - 1) % 6)`).
   - `{precedents}` : nombre total de prédécesseurs.
   - `{cycles_precedents}` : nombre de cycles déjà franchis par le joueur.
2. **Réactivité narrative d'ARCHE selon le cycle** :
   - Cycle 1 : Découverte clinique et protocole initial Prométhée.
   - Cycles 2 à 6 : Succession notée, traces des prédécesseurs intégrées.
   - Cycles 7 à 13 : Trouble d'ARCHE face au recommencement et à la saturation des cuves.
   - Cycles 14+ : Glitch, vertige et effarement face à l'obstination infinie du joueur.
3. **Scènes d'éveil étendues** :
   - Éveils écrits pour les cycles 5, 6, 7 et texte d'éveil dynamique pour les cycles 8+.
4. **Cohérence du Caveau et des terminaux** :
   - Le fragment du Caveau reflète la cuve et le numéro du Semeur éveillé.
   - Les commandes `whoami`, `statut` et `semeur` affichent des données exactes.

---

## Consigne de livraison

> **Livraison.** Travaille dans un clone du dépôt GitHub `0doacre/craftgame`, à jour
> (`git pull` sur `main` avant de commencer).
> Crée une nouvelle branche au nom de la tâche (`gemini-arche-cycles-6-11`).
> Quand `npm test` passe en entier, **ouvre le jeu dans un vrai navigateur** avant de livrer :
> `npx http-server -p 8765 -c-1 .` à la racine du dépôt, puis `http://localhost:8765/`.
> Fais ensuite un commit qui dit ce que tu as changé, puis pousse la
> branche sur GitHub : `git push -u origin <nom-de-la-branche>`.
>
> **Secrets.** N'écris jamais une solution de secret, un code ou un air dans ton compte rendu,
> tes messages de commit ou `D.CHANGES`. Écris « une recette secrète », « un lieu caché »,
> pas leur contenu.
