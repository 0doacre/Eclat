/* ÉCLAT — la file des fenêtres que le jeu ouvre tout seul (sauvegarde illisible, présentation,
 * nouveautés, retour d’absence). Une seule à la fois, dans l’ordre de leur priorité, avec une
 * courte pause entre deux ; une même fenêtre n’attend jamais deux fois.
 * Module sans DOM : `libre()` dit s’il n’y a ni fenêtre ouverte ni fenêtre en file (c’est ui.js
 * qui le sait), `now()` donne l’heure en millisecondes. Les fenêtres que le joueur ouvre d’un
 * appui ne passent pas par ici. */
(function (root) {
  "use strict";

  const PAUSE = 250; // entre la fermeture d’une fenêtre et l’ouverture de la suivante (ms)
  // du plus pressé au moins pressé
  const PRIO = { sauvegarde: 0, intro: 1, nouveautes: 2, retour: 3, autre: 4 };

  function create(o) {
    const libre = o.libre, now = o.now || Date.now;
    const attente = [];
    let ferme = -Infinity, rang = 0;
    function pomper() {
      if (!attente.length || !libre() || now() - ferme < PAUSE) return false;
      attente.shift().ouvre();
      return true;
    }
    return {
      /* demande l’ouverture d’une fenêtre ; sans effet si la même (cle) attend déjà */
      demande(prio, cle, ouvre) {
        if (attente.some((w) => w.cle === cle)) return false;
        attente.push({ prio, cle, ouvre, rang: rang++ });
        attente.sort((a, b) => a.prio - b.prio || a.rang - b.rang);
        pomper();
        return true;
      },
      /* à appeler quand une fenêtre se ferme */
      ferme() { ferme = now(); },
      pomper,
      attente: () => attente.map((w) => w.cle)
    };
  }

  const Fenetres = { create, PAUSE, PRIO };
  if (typeof module !== "undefined" && module.exports) module.exports = Fenetres;
  root.EclatFenetres = Fenetres;
})(typeof globalThis !== "undefined" ? globalThis : this);
