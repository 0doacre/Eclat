# Atelier de test

Menu → Système & Sauvegardes → Mode test. Code : `ECLAT-ATELIER`.

L’activation sauvegarde la partie normale, conserve une copie avant test et ouvre une copie de travail locale. La synchronisation du compte est désactivée pour cette copie. Le bandeau permet d’ouvrir les commandes ou de revenir à la partie normale. Un nouvel accès depuis la partie normale recrée la copie de travail ; recharger une session de test conserve ses modifications.

- Recommencer à un âge : recrée la copie à cet âge avec les jalons antérieurs validés.
- Apprendre les recettes / obtenir les objets : agit sur l’âge choisi dans la liste.
- Ajouter des matières : +10 000 par matière jusqu’à l’âge choisi.
- Valider l’objectif actuel : valide le jalon affiché par le moteur.
- Ouvrir un passage / révéler les lieux : agit sur la terre choisie.
- Terminer l’exploration en cours : laisse le moteur produire son événement et son animation habituels.

Les emplacements main et preview restent distincts. Le code est un raccourci local public, sans rôle sur le serveur des comptes. L’URL seule ne suffit pas : une activation dans l’onglet est requise.

Validation : `node tools/test-mode-test.js`, `npm run test:mode-test-ui` (Playwright et Chromium via PW / CHROMIUM si nécessaire), `npm test`.
