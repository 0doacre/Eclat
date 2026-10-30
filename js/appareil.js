/* ÉCLAT — le jeu dans l’appareil : le bouton Retour, l’installation, le titre de l’onglet, l’écran qui reste allumé,
 * les raccourcis du clavier. Rien ici ne change une règle du jeu ; chaque morceau se tait quand l’appareil ne le permet pas. */
(function (root) {
  "use strict";

  /* L’ordre des onglets pour les raccourcis : 1 = Terres… (les onglets cachés sont sautés) */
  const ONGLETS = ["domaine", "labo", "atelier", "arbre", "journal"];

  /* Que fait le bouton Retour ? Une fonction pure, pour la tester sans navigateur.
   *   fenetre : { ouverte, fermable } ; onglet : l’onglet courant ; dernierRetour / maintenant : en ms. */
  function decisionRetour(s) {
    if (s.fenetre && s.fenetre.ouverte) return s.fenetre.fermable ? "fermer" : "rester";
    if (s.onglet !== "domaine") return "domaine";
    if (s.maintenant - (s.dernierRetour || 0) < 2500) return "quitter";
    return "prevenir";
  }

  function create(api) {
    const { E, U, toast, closeModal, setTab, tabVisible } = api;
    const win = root, doc = root.document;
    const S = () => E.state;

    /* ---------------------------------------------------------- le bouton Retour */
    /* Sur téléphone ou une fois installé, Retour ferme la fenêtre, puis ramène au Domaine, puis demande confirmation
     * en prévenant, avant de quitter. Sur un ordinateur, le bouton Retour du navigateur reste le sien. */
    function retour() {
      if (!win.history || !win.history.pushState) return false;
      const tactile = win.matchMedia && (win.matchMedia("(pointer: coarse)").matches || win.matchMedia("(display-mode: standalone)").matches);
      if (!tactile) return false;
      let dernier = 0;
      const poser = () => win.history.pushState({ eclat: "jeu" }, "");
      win.history.replaceState({ eclat: "base" }, "");
      poser();
      win.addEventListener("popstate", () => {
        const f = U.mcur ? { ouverte: true, fermable: !U.mcur.persistent } : { ouverte: false };
        const d = decisionRetour({ fenetre: f, onglet: U.tab, dernierRetour: dernier, maintenant: Date.now() });
        if (d === "quitter") { win.history.back(); return; }
        if (d === "fermer") closeModal();
        else if (d === "domaine") setTab("domaine");
        else if (d === "prevenir") { dernier = Date.now(); toast("Touche Retour encore une fois pour quitter.", { key: "retour" }); }
        poser();
      });
      return true;
    }

    /* ---------------------------------------------------------- installer le jeu */
    function installation() {
      win.addEventListener("beforeinstallprompt", (ev) => { ev.preventDefault(); U.installEvt = ev; });
      win.addEventListener("appinstalled", () => { U.installEvt = null; toast("📲 Éclat est installé sur ton appareil."); });
    }
    function installer() {
      const ev = U.installEvt;
      if (!ev) return Promise.resolve(false);
      U.installEvt = null;
      ev.prompt();
      return ev.userChoice.then((c) => c && c.outcome === "accepted").catch(() => false);
    }

    /* ---------------------------------------------------------- le titre de l’onglet */
    /* Quelque chose est fini pendant que le jeu est caché : le titre le dit, et se tait au retour. */
    const TITRE = doc ? doc.title : "Éclat";
    function attention(n) {
      if (!doc || !doc.hidden) return;
      U.attente = (U.attente || 0) + (n || 1);
      doc.title = "(" + U.attente + ") " + TITRE;
    }
    function attentionVue() { U.attente = 0; if (doc) doc.title = TITRE; }

    /* ---------------------------------------------------------- l’écran allumé */
    let verrou = null;
    async function ecranAllume() {
      const on = !!(S().settings && S().settings.ecranAllume);
      const wl = win.navigator && win.navigator.wakeLock;
      if (!wl) return false;
      try {
        if (on && !verrou && !doc.hidden) {
          verrou = await wl.request("screen");
          verrou.addEventListener("release", () => { verrou = null; });
        } else if (!on && verrou) { await verrou.release(); verrou = null; }
      } catch (e) { verrou = null; }
      return !!verrou;
    }
    const ecranPossible = () => !!(win.navigator && win.navigator.wakeLock);

    /* ---------------------------------------------------------- les raccourcis du clavier */
    function raccourcis() {
      doc.addEventListener("keydown", (ev) => {
        if (ev.ctrlKey || ev.metaKey || ev.altKey || ev.shiftKey || U.mcur) return;
        const t = ev.target;
        if (t && t.matches && t.matches("input, textarea, select, [contenteditable]")) return;
        const i = ev.key >= "1" && ev.key <= "9" ? Number(ev.key) - 1 : -1;
        if (i < 0) return;
        const ouverts = ONGLETS.filter((o) => tabVisible(o));
        if (ouverts[i]) { ev.preventDefault(); setTab(ouverts[i]); }
      });
    }

    function demarrer() {
      retour();
      installation();
      raccourcis();
      doc.addEventListener("visibilitychange", () => {
        if (!doc.hidden) { attentionVue(); ecranAllume(); }
      });
      ecranAllume();
    }
    return { demarrer, retour, installer, attention, ecranAllume, ecranPossible, installable: () => !!U.installEvt };
  }

  const Appareil = { ONGLETS, decisionRetour, create };
  root.EclatAppareil = Appareil;
  if (typeof module !== "undefined" && module.exports) module.exports = Appareil;
})(typeof window !== "undefined" ? window : globalThis);
