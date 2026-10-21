# Prompts à confier à un assistant (Gemini, Sonnet…)

Chaque fichier de ce dossier est un prompt prêt à donner tel quel. Colle **toujours** la
consigne de livraison ci-dessous à la fin du prompt : sans elle, l’assistant risque de
travailler dans un dossier à part, sur ton ordinateur, et rien n’arrive sur GitHub.

## Consigne de livraison (à coller à la fin de chaque prompt)

> **Livraison.** Travaille dans un clone du dépôt GitHub `0doacre/craftgame`, à jour
> (`git pull` sur `main` avant de commencer), jamais dans une copie ou un dossier temporaire.
> Crée une nouvelle branche au nom de la tâche (par exemple `gemini-echecs-ages-4-5`).
> Quand `node tools/test.js` passe, fais un commit qui dit ce que tu as changé, puis pousse la
> branche sur GitHub : `git push -u origin <nom-de-la-branche>`. Ne touche pas à `main`, ne
> fusionne rien : la branche sera relue avant d’être intégrée. Termine en donnant le nom de
> la branche et la sortie de `node tools/test.js`.

## Ensuite

Dis à Claude le nom de la branche : il la relit, la teste dans le jeu, retouche si besoin,
puis la fusionne.

## Prompts disponibles

- `echecs-ages-2-3.md` : phrases d’échec des âges de la Pierre et du Cuivre (fait, version 4.5.1).
  Sert de modèle pour les âges suivants : change la liste des matières et le nom de l’âge.
- `comptoir-5-4.md` : le Comptoir (écus, vente, achat de Traces), version 5.4.0. La consigne
  de livraison est déjà incluse.
