# Densité : Acier, Silicium, extracteurs et protections (0.35.1)

> Revue de l’équilibrage des âges creux, de l’intégration des protections de terre et des extracteurs de niveau 2.

---

## 1. Intention et constats

L'audit de préparation à l’Alpha ([`docs/PLAN-ALPHA.md`](../PLAN-ALPHA.md)) mettait en évidence trois fragilités dans la progression du jeu :
1. **L’Âge du Silicium (Âge 11)** était le plus court de tout le jeu : franchi en seulement 28 secondes au simulateur en sautant directement du quartz à l'ordinateur, sans que le joueur ne vive la chaîne microélectronique.
2. **L’Âge de l’Acier (Âge 7)** manquait d'étapes d'outillage intermédiaire pour asseoir la transition vers la mécanique de précision.
3. **Trois objets orphelins** : les `gants de peau`, le `masque filtrant` et la `bouteille d’air`, bien que codés comme protections de terres dans `D.REGLES`, n'étaient requis par aucune recette ni exploration, générant des alertes de composants inutilisés.
4. **Uranium et galène** n’avaient qu’un seul niveau d'extracteur, freinant le mid-game nucléaire et chimique.

---

## 2. Ajustements réalisés

### A. Valorisation des équipements de protection
Les trois protections deviennent indispensables pour fouiller les terres hostiles et obtenir leurs fragments narratifs :
- **Gants de peau** (`I.gants`) : requis pour explorer *La Ville Ensevelie* dans le Désert de Verre (`desert.exps[0]`), où les éclats de verre coupent les mains sans protection.
- **Masque filtrant** (`I.masque`) : requis pour monter sur *La Plateforme Rouillée* dans le Gisement Noir (`gisement.exps[0]`), au milieu des vapeurs toxiques de bitume.
- **Bouteille d’air** (`I.bouteille`) : requise pour atteindre *Le Radar* sur les hauts sommets des Pics Fracturés (`montagnes.exps[1]`), où l’atmosphère est trop raréfiée.

*Résultat* : `tools/validate.js` valide désormais 100 % des 261 objets sans aucun avertissement.

### B. Extracteurs niveau 2 (Uranium et Galène)
Ajoutés dans `D.LIGNES` :
- `uranium_2` : **Puits d’uranium blindé** (Âge 11, taux 2.4/s, coût 40 lingots de plomb, 6 processeurs, 20 verres trempés). Sas de plomb et parois épaisses pour un approvisionnement stable du réacteur à fission.
- `galene_2` : **Mine de plomb mécanisée** (Âge 11, taux 3.6/s, coût 12 moteurs électriques, 80 lingots d’acier, 60 câbles). Treuils et convoyeurs pour l’extraction continue du minerai lourd.

### C. Jalons de l’Âge de l’Acier (`D.OBJECTIVES`)
Le passage de l'Acier à la Vapeur intègre les étapes d'usinage mécanique :
1. `haut_fourneau` : Chauffer monte à 1 700 °C.
2. `lingot_acier` : Alliage fer et charbon.
3. `bac_trempe` : Déblocage de l'action **Tremper**.
4. `acier_trempe` : Trempe de l'acier brûlant.
5. `tour` : Déblocage de l'action **Usiner**.
6. `engrenage_acier` : Engrenages haute résistance.
7. `roulement` : Roulements à billes anti-friction.

### D. Jalons de l’Âge du Silicium (`D.OBJECTIVES`)
La révolution numérique est maintenant jalonnée étape par étape :
1. `silicium` : Réduction du quartz au four à arc.
2. `lithographe` : Déblocage de l'action **Graver**.
3. `wafer` : Découpe des plaquettes miroirs.
4. `puce` : Gravure des pistes de cuivre.
5. `processeur` : Assemblage du processeur central.
6. `ordinateur` : Machine de calcul et ouverture du Terminal.
7. `radiotelescope` : Déploiement de la grande antenne et écoute du Cosmos.
8. `foreuse` : Sonde pétrolière et ouverture vers le Gisement Noir.

---

## 3. Mesures comparatives (`tools/sim.js`)

| Âge | Ancien temps (0.35.0) | Nouveau temps (0.35.1 instantané) | Nouveau temps avec `MAINS=1` |
|---|---:|---:|---:|
| **Âge de l’Acier** | 1 min 36 s | 1 min 39 s | **2 min 29 s** |
| **Âge du Silicium** | **0 min 28 s** | **1 min 06 s** | **5 min 36 s** |
| **Âge de l’Atome** | 1 min 45 s | 1 min 45 s | **3 min 34 s** |
| **Partie complète** | 1 h 19 min 38 s | 1 h 18 min 34 s | **2 h 52 min 43 s** |

- L’Âge du Silicium passe d'un sprint artificiel de 28 s à un véritable chapitre de gameplay d'environ 5 minutes avec fabrication manuelle.
- Les extracteurs niveau 2 fiabilisent la fin de partie (production d'uranium x2.2, galène x4).
- 100 % de conformité : `node tools/validate.js`, `tools/test.js`, `tools/test-arbre.js`, `tools/test-boutons.js` et `npm test` passent à 100 %.
