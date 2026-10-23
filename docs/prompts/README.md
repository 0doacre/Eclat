# Prompts à confier à un assistant (Gemini, Sonnet…)

Chaque fichier de ce dossier est un prompt prêt à donner tel quel. Colle **toujours** la
consigne de livraison ci-dessous à la fin du prompt : sans elle, l’assistant risque de
travailler dans un dossier à part, sur ton ordinateur, et rien n’arrive sur GitHub.

## Consigne de livraison (à coller à la fin de chaque prompt)

> **Livraison.** Travaille dans un clone du dépôt GitHub `0doacre/craftgame`, à jour
> (`git pull` sur `main` avant de commencer), jamais dans une copie ou un dossier temporaire.
> Crée une nouvelle branche au nom de la tâche (par exemple `gemini-echecs-ages-4-5`).
> Quand `npm test` passe en entier, **ouvre le jeu dans un vrai navigateur** avant de livrer :
> `npx http-server -p 8765 -c-1 .` à la racine du dépôt, puis `http://localhost:8765/` (au
> besoin avec Playwright). Le jeu doit se charger, la console ne doit montrer aucune erreur, et
> ce que tu as changé doit se voir et marcher à l’écran. Les tests ne chargent que le moteur :
> une erreur dans `js/ui.js` ou `js/domaine.js` peut passer les tests et casser tout le jeu
> (c’est arrivé en 5.5). Si tu ne peux pas ouvrir de navigateur, dis-le clairement dans ton
> compte rendu au lieu de livrer comme si c’était vérifié.
> Fais ensuite un commit qui dit ce que tu as changé, puis pousse la
> branche sur GitHub : `git push -u origin <nom-de-la-branche>`. Ne touche pas à `main`, ne
> fusionne rien : la branche sera relue avant d’être intégrée. Termine en donnant le nom de
> la branche, la sortie de `npm test`, ce que tu as vérifié dans le navigateur, et ce que tu
> n’as pas pu faire.
>
> **Secrets.** L’auteur joue à l’aveugle : n’écris jamais une solution de secret, une
> combinaison de recette secrète, un code ou un air dans ton compte rendu, tes messages de
> commit ou `D.CHANGES`. Écris « une recette secrète », « un lieu caché », pas leur contenu.
> N’ouvre pas `docs/coffre/` sauf si le prompt le demande.

## La règle du coffre

Un prompt qui touche au récit (textes, lieux, voix, fins, secrets, clins d’œil) va dans
`docs/coffre/prompts/`, pas ici. Ici, il n’en reste qu’une ligne neutre : « voir le coffre ».

## Ensuite

Dis à Claude le nom de la branche : il la relit, la teste dans le jeu, retouche si besoin,
puis la fusionne.

## Prompts disponibles

- `echecs-ages-2-3.md` : phrases d’échec des âges de la Pierre et du Cuivre (fait, version 4.5.1).
  Sert de modèle pour les âges suivants : change la liste des matières et le nom de l’âge.
- `comptoir-5-4.md` : le Comptoir (écus, vente, achat de Traces), version 5.4.0. La consigne
  de livraison est déjà incluse.
- `machines-5-5.md` : machines à paliers (ingrédients, profondeur) et onglet Machines dans
  l’Atelier, version 5.5.0. La consigne de livraison est déjà incluse.
- `parcours-5-6.md` : première renaissance obligatoire, ruines, scènes d’éveil, version 5.6.0.
  Consigne de livraison (avec la vérification dans le navigateur) incluse.
- `commandes-5-7.md` : les commandes, machines qui aident toutes les fabrications (5.7.0).
- `secrets-5-8.md` : Déchiffrer contre de l’Intuition, énigme des lieux cachés dans le Domaine, chaleur étrange (5.8.0).
- `troqueur-5-9.md` : écus convertis à la relève, demandes du Troqueur (5.9.0).
  Ces trois-là se font **dans l’ordre**, chacune partant de `main` après le merge de la précédente.
- `livre-6-0.md` : moteur du Livre des Semeurs, fragments archivés et revisités, onglet Questions,
  avec un contenu provisoire (6.0.0). Le vrai contenu du récit est écrit par Claude.
- `signes-6-1.md` : moteur des signes (dessin, saisie, empreintes, fiche, onglet Signes), sans
  aucun signe réel (6.1.0).
- `flute-ciel-6-2.md` : moteur de la flûte (airs longs, effets nommés déclaratifs) et animations du Ciel pilotées par données (6.2.0).
- 6.3.0, le terminal : voir le coffre.
- 6.4.0, les lieux : voir le coffre.
- 6.5.0, les fins : voir le coffre.
- 6.6.0, après la fin : voir le coffre.
- `mobile-6-7.md` : mode Veillée (thème sombre), cibles tactiles agrandies, haptique affinée et grand texte (6.7.0).
- 6.8.0, les clins d’œil : voir le coffre.
- `ergonomie-6-9.md` : Lisibilité générale, ergonomie et feedbacks visuels (6.9.0).
- `reserve-filtres-6-10.md` : Ergonomie de la Réserve, filtres par catégorie, tris intelligents et flux en direct (6.10.0).
- 6.11.0, une voix du jeu : voir le coffre.
- [v6.12.0 — Langage naturel & épuration des textes](langage-naturel-6-12.md)
- [v6.13.0 — Ergonomie visuelle : notifications mobiles & progression de l'âge](ergonomie-visuelle-6-13.md)
- [v6.14.0 — Profondeur late-game : résonance stellaire & murmures du temps](lategame-traces-6-14.md)
- [v0.7.0 — Ergonomie : pastilles d'objets interactives & affordance unifiée](item-pills-0-7-0.md)
- [v0.7.1 — Immersion : horodatage du Journal](horodatage-0-7-1.md)
- [v0.8.0 — Ergonomie majeure : Registre de quêtes, rituels des Semeurs, contrats du Troqueur & Codex d'artisanat](ergonomie-majeure-0-8-0.md)
