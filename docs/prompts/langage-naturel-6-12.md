# Prompt v6.12.0 : Épuration des Textes & Chasse aux Scories IA

> **Version visée** : 6.12.0  
> **Branche de travail** : `gemini-langage-6-12`

---

## Contexte & Objectif

Le jeu contenait plusieurs scories de rédaction issues de prompts ou de calques de traduction rigides :
1. **L'abus du verbe « verser » pour des solides** : Imposé par une ancienne consigne de lexique (« pour into »), le jeu demandait de « verser du bois », « verser du granit », « verser les ressources » pour ouvrir un passage ou un Grand Œuvre.
2. **La répétition mécanique de « en réserve »** : Présent sur presque chaque bouton, toast et ligne d'inventaire (« 50 en réserve », « +10 en réserve »), alourdissant inutilement l'interface.
3. **Les formules de remplissage et tournures impersonnelles** : « Rien à tirer de ce mélange » (alors qu'on taille une branche), « Rien ne tient », « L'assemblage tient trois secondes », descriptions robotiques d'outils et d'améliorations (« elle agit dès que tu l'as, rien à poser »).

Ce chantier apporte :
- Le remplacement de « verser » par du vocabulaire français naturel, précis et varié selon l'action : **apporter**, **déposer**, **fournir**, **sceller**, **approvisionner**.
- L'allègement des occurrences de « en réserve » au profit de désignations sobres et directes (**disponible**, **en poche**, **au total**, ou simplement la quantité).
- La réécriture des retours d'échecs de l'Atelier (`WHY` et `D.FAIL.assembler`) pour donner du corps, du relief et du style littéraire.
- L'actualisation de `docs/LEXIQUE.md` pour fixer ces bonnes pratiques pour les futures versions.

---

## Consigne de livraison

> **Livraison.** Travaille dans un clone du dépôt GitHub `0doacre/craftgame`, à jour
> (`git pull` sur `main` avant de commencer).
> Crée une nouvelle branche au nom de la tâche (`gemini-langage-6-12`).
> Quand `npm test` passe en entier, **ouvre le jeu dans un vrai navigateur** avant de livrer :
> `npx http-server -p 8765 -c-1 .` à la racine du dépôt, puis `http://localhost:8765/`.
> Fais ensuite un commit qui dit ce que tu as changé, puis pousse la
> branche sur GitHub : `git push -u origin <nom-de-la-branche>`.
>
> **Secrets.** N'écris jamais une solution de secret, un code ou un air dans ton compte rendu,
> tes messages de commit ou `D.CHANGES`. Écris « une recette secrète », « un lieu caché »,
> pas leur contenu.
