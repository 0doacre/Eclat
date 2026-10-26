# Gestes remarqués (0.34.0)

> Conception et recueil des succès discrets d’Éclat.

---

## 1. Intention et philosophie de conception

Comme l'ont souligné `docs/AUDIT-INSPIRATIONS.md` et `docs/AUDIT-CELL-TO-SINGULARITY.md` :
> *« Des petits faits qui se cochent tout seuls, en pastilles, sans récompense chiffrée... On l’évite si ça fait "tableau de chasse". »*

Les jeux incrémentaux et mobiles souffrent souvent de listes de succès standardisées, bruyantes et administratives (« Tuer 1 000 monstres », « Dépenser 10 000 000 de pièces »).

Dans **Éclat**, les **gestes remarqués** suivent une philosophie radicalement différente :
1. **Zéro récompense chiffrée** : Pas de bonus de +X %, pas d’écus en plus, pas de monnaie ajoutée. La progression et l’équilibrage du simulateur restent purs et intacts.
2. **Discrétion absolue** : Aucune fenêtre surgissante intrusive (« POPUP : SUCCÈS DÉBLOQUÉ ! »). Un toast sobre d’une ligne et un point discret sur l’onglet *Gestes* du Journal.
3. **Mémoire diégétique** : Chaque geste accompli est horodaté avec précision via le système `stamp("g:" + id)` : il retient le cycle (`Cycle 1`), l’âge atteint (`Âge du Bois`) et la date réelle du joueur (`26 oct.`).
4. **Persistance** : Les gestes accomplis sont conservés dans les métadonnées (`S.meta.gestes`) et traversent toutes les relèves de Semeurs.
5. **Autonomie par rapport au guide** : Que le joueur suive le guide ou joue « Sans guide », les gestes se valident de manière organique dès que l'action ou l'état de jeu est constaté.

---

## 2. Recueil des 20 gestes remarqués

Les 20 gestes sont répartis en deux temps : les jalons de découverte (l'éveil de la technique) et les accomplissements de maîtrise (la traversée du monde).

| # | Identifiant | Nom | Icône | Description du fait | Indice si inconnu |
|---:|---|---|:---:|---|---|
| 1 | `premiers_pas` | Premiers pas | 🪵 | Tailler un manche en bois dans la Lisière. | Retirer ce qui dépasse d’un bâton. |
| 2 | `premier_feu` | La première flamme | 🔥 | Allumer un feu de camp avant la nuit. | Réunir de quoi chauffer la matière. |
| 3 | `premiere_cabane` | L’abri du gisement | 🛖 | Poser un premier extracteur pour récolter à ta place. | Laisser un abri récolter sur un filon. |
| 4 | `premiere_plaine` | La première frontière | 🌾 | Franchir le passage de la Plaine avec un épieu. | S’armer pour ouvrir l’accès aux hautes herbes. |
| 5 | `premiere_releve` | La relève des mains | ✦ | Passer le relais et confier le savoir au Semeur suivant. | Laisser quelqu’un d’autre reprendre la route. |
| 6 | `premier_automate` | Le souffle mécanique | ⚙️ | Faire tourner une commande avec une machine. | Confier une tâche répétitive à un automate. |
| 7 | `premier_troc` | Le premier troc | 🪙 | Honorer une commande du Troqueur au Comptoir. | Répondre à la demande d’un marchand. |
| 8 | `premier_signe` | La parole gravée | ✍️ | Comprendre un premier signe des Anciens. | Trouver le sens d’un symbole dans la roche. |
| 9 | `premiere_etude` | L’œil attentif | 🔍 | Étudier une matière à la loupe avec de l’Intuition. | Regarder une matière de plus près. |
| 10 | `premier_dechiffrage` | L’énigme percée | ✨ | Déchiffrer une recette inconnue pas à pas. | Éclairer une recette que tu n’as pas encore trouvée. |
| 11 | `premier_visiteur` | La silhouette fugitive | 🦋 | Surprendre un visiteur qui traverse le Domaine. | Toucher quelqu’un qui ne fait que passer. |
| 12 | `premier_don` | Le don du réveil | 🤲 | Recevoir la bénédiction d’un don au réveil d’un cycle. | Choisir une faveur pour le prochain Semeur. |
| 13 | `premier_air` | Le chant dans l’os | 🎶 | Retrouver une mélodie sur la flûte à cinq trous. | Jouer les bonnes notes dans le silence. |
| 14 | `premiere_constellation` | Le dessin du ciel | 🌌 | Relier les étoiles d’une constellation dans le Cosmos. | Relier ce qui brille dans la nuit. |
| 15 | `ruines_relevees` | L’héritage relevé | 🔨 | Tout réparer d’un coup sur les ruines d’un cycle passé. | Relever ce que le précédent Semeur a laissé. |
| 16 | `chef_doeuvre` | Le geste parfait | 🏆 | Réaliser un chef-d’œuvre à l’Atelier. | Façonner un objet sans le moindre défaut. |
| 17 | `douze_terres` | Le tour du monde | 🗺️ | Atteindre les douze terres, du sous-sol aux étoiles. | Fouler chaque contrée du monde connu. |
| 18 | `toutes_matieres` | L’encyclopédie des mains | 🔬 | Avoir étudié chaque matière première du monde. | Ne laisser aucune ressource brute inexplorée. |
| 19 | `livre_complet` | Le Livre des Semeurs | 📖 | Retrouver les 32 pages du Livre des Semeurs. | Rassembler toutes les pages éparpillées. |
| 20 | `cinq_fins` | Les cinq horizons | 🌅 | Avoir contemplé les cinq fins d’Éclat. | Voir où chaque grand chemin conduit le monde. |

---

## 3. Intégration dans l'interface

- **Onglet dans le Journal** : Un nouvel onglet `Gestes` prend place entre `Secrets` et `Flûte`.
- **Indicateur de nouveau** : Si un geste a été validé mais n’a pas encore été consulté dans cet onglet, l’intitulé affiche `Gestes •` et le Journal s’allume.
- **Rendu** : Composants `.frag.geste` adaptatifs, réutilisant le style sobre des cartes de fragments avec un repère d’accomplissement `✓` vert et l'horodatage tabulaire `.stamp`.
