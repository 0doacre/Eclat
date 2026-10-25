/* ÉCLAT — l’écriture de la partie sur l’appareil : un seul onglet à la fois peut enregistrer.
 * Module sans DOM : le stockage, le verrou et les rappels viennent de l’appelant (voir js/ui.js),
 * ce qui permet de le tester avec un faux stockage (tools/test-stockage.js).
 *
 * Trois protections, dans l’ordre :
 *  1. Un verrou du navigateur (Web Locks) tenu pendant toute la vie de la page : seule la page qui
 *     le tient écrit. Une page périmée, y compris à sa fermeture, ne peut donc pas écraser l’autre.
 *     Sans cette API, la protection suivante seule reste (sa fenêtre de course est minuscule, pas nulle).
 *  2. Avant chaque écriture, on relit la clé : si son contenu n’est pas celui que cette page a lu ou
 *     écrit en dernier, une autre page (même d’une ancienne version du jeu, sans verrou) est passée
 *     par là. La page se déclare périmée et n’écrit plus.
 *  3. L’événement `storage` prévient tout de suite les autres pages ouvertes.
 *
 * Une écriture qui échoue (quota, stockage bloqué) laisse la partie en mémoire, le dit (rappel
 * « echec ») et retente à chaque sauvegarde ; la partie déjà enregistrée n’est pas touchée. */
(function (root) {
  "use strict";

  const ETATS = { ok: "ok", attente: "attente", perime: "perime" };

  /* o : { storage, key, locks?, lockName?, liberer?(), notify(evt, info) }
   * liberer() : libère de la place (une copie de secours en moins) ; renvoie vrai s’il a libéré quelque chose. */
  function create(o) {
    const storage = o.storage, key = o.key, notify = o.notify || function () {};
    const locks = o.locks === undefined ? (root.navigator && root.navigator.locks) || null : o.locks;
    const lockName = o.lockName || "eclat-partie";
    let etat = locks ? ETATS.attente : ETATS.ok; // sans verrou possible, on écrit tout de suite
    let detenu = false;
    let lastRaw = null; // ce que cette page a lu ou écrit en dernier
    let echec = null;   // { err, depuis, essais } tant que l’écriture échoue
    let lue = false;

    const dit = (evt, info) => { try { notify(evt, info); } catch (e) { /* l’interface ne doit pas casser l’écriture */ } };
    const perime = (info) => { if (etat !== ETATS.perime) { etat = ETATS.perime; dit("perime", info || {}); } };

    /* ce que la page a lu au démarrage (null : aucune partie enregistrée) */
    function lire(raw) { lastRaw = raw === undefined ? null : raw; lue = true; }

    /* demande le verrou : une seule page l’obtient ; les autres attendent qu’elle se ferme */
    function demanderVerrou() {
      if (!locks) { etat = ETATS.ok; dit("pret", { verrou: false }); return; }
      const tenir = () => new Promise(function () { /* tenu jusqu’à la fermeture de la page */ });
      const obtenu = (apresAttente) => {
        detenu = true;
        if (etat !== ETATS.perime) etat = ETATS.ok;
        // après une attente, la partie lue au démarrage est celle d’avant : l’autre page a écrit en se fermant
        if (apresAttente) { dit("repris", { verrou: true }); return tenir(); }
        // une page d’une ancienne version (sans verrou) a pu écrire entre la lecture et l’obtention du verrou
        let cur = null;
        try { cur = storage.getItem(key); } catch (e) { cur = lastRaw; }
        if (lue && cur !== lastRaw && !(cur === null && lastRaw !== null)) { perime({ stocke: cur }); return tenir(); }
        dit("pret", { verrou: true });
        return tenir();
      };
      try {
        locks.request(lockName, { ifAvailable: true }, function (lock) {
          if (lock) return obtenu(false);
          etat = ETATS.attente;
          dit("attente", {});
          locks.request(lockName, function () { return obtenu(true); }).catch(function () { /* page fermée */ });
          return null;
        }).catch(function () { etat = ETATS.ok; detenu = false; dit("pret", { verrou: false }); });
      } catch (e) { etat = ETATS.ok; dit("pret", { verrou: false }); }
    }

    const peutEcrire = () => etat === ETATS.ok;

    /* écrit la partie. { ok: true } ou { ok: false, why: "attente" | "perime" | "echec", err? } */
    function ecrire(text) {
      if (etat === ETATS.attente) return { ok: false, why: "attente" };
      if (etat === ETATS.perime) return { ok: false, why: "perime" };
      let cur;
      try { cur = storage.getItem(key); } catch (e) { return echouer(e); }
      if (cur !== null && cur !== lastRaw) { perime({ stocke: cur }); return { ok: false, why: "perime" }; }
      let essais = 0;
      for (;;) {
        try {
          storage.setItem(key, text);
          if (storage.getItem(key) !== text) throw new Error("L’écriture n’a pas été relue à l’identique.");
          break;
        } catch (e) {
          // plus de place : on rend celle des copies de secours, une à une, avant de renoncer
          if (essais++ < 8 && o.liberer && o.liberer()) continue;
          return echouer(e);
        }
      }
      lastRaw = text;
      if (echec) { echec = null; dit("retabli", {}); }
      return { ok: true };
    }
    function echouer(e) {
      const nouveau = !echec;
      echec = echec || { err: String((e && e.name) || "") + (e && e.message ? " : " + e.message : ""), depuis: Date.now(), essais: 0 };
      echec.essais++;
      if (nouveau) dit("echec", echec);
      return { ok: false, why: "echec", err: echec.err };
    }

    /* événement `storage` d’une autre page : on regarde ce qui est vraiment enregistré, pas ce que dit l’événement
     * (il peut arriver en retard, après une écriture plus récente de cette page) */
    function surStorage(ev) {
      if (!ev || (ev.key !== null && ev.key !== key)) return;
      if (ev.key === null || ev.newValue === null) return; // vidé à la main : on ne s’en mêle pas
      if (etat === ETATS.attente) return; // la page attend déjà son tour : elle rechargera la partie
      let cur;
      try { cur = storage.getItem(key); } catch (e) { return; }
      if (cur !== null && cur !== lastRaw) perime({ stocke: cur });
    }

    /* choix du joueur sur une page périmée : garder la partie de cette page. L’appelant a déjà mis
     * la partie enregistrée de côté (copie de secours). */
    function reprendreCettePage() {
      try { lastRaw = storage.getItem(key); } catch (e) { /* on réessaiera */ }
      if (etat === ETATS.perime) etat = detenu || !locks ? ETATS.ok : ETATS.attente;
      return peutEcrire();
    }

    return {
      lire, demanderVerrou, ecrire, peutEcrire, surStorage, reprendreCettePage,
      etat: () => etat, echec: () => echec, verrouTenu: () => detenu, dernierContenu: () => lastRaw
    };
  }

  /* Demande au navigateur de ne pas effacer la partie, puis vérifie la réponse (persist() peut répondre
   * vrai sans que persisted() le confirme, et l’inverse). Renvoie "accordee" | "refusee" | "absente" | "inconnue". */
  async function proteger(nav) {
    try {
      const st = nav && nav.storage;
      if (!st || typeof st.persist !== "function" || typeof st.persisted !== "function") return "absente";
      if (await st.persisted()) return "accordee";
      await st.persist();
      return (await st.persisted()) ? "accordee" : "refusee";
    } catch (e) { return "inconnue"; }
  }

  const Stockage = { create, proteger, ETATS };
  root.EclatStockage = Stockage;
  if (typeof module !== "undefined" && module.exports) module.exports = Stockage;
})(typeof window !== "undefined" ? window : globalThis);
