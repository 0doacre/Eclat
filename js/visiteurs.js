/* ÉCLAT — les visiteurs de passage : une petite silhouette traverse le Domaine.
 * On la touche, elle laisse un petit lot ; manquée, elle s’en va sans un mot. */
(function () {
  "use strict";

  function create(api) {
    const { E, A, D, U, esc, fmt, toast, Tuto } = api;
    const S = () => E.state;
    const I = D.ITEMS;
    const $ = (s, r) => (r || document).querySelector(s);

    /* ===== VISITEURS DE PASSAGE (début) =====
     * Une petite silhouette traverse le Domaine. C'est un bouton : on le touche, ou on l'atteint au clavier.
     * Il s'arrête quand le doigt, la souris ou le focus est dessus. Avec « réduire les animations »,
     * il apparaît sans glisser et reste quelques secondes. Manqué, il disparaît sans un mot. */
    function visiteurFin() {
      const v = U.vis;
      if (!v) return;
      clearTimeout(v.to);
      if (v.el && v.el.parentNode) v.el.remove();
      U.vis = null;
      E.visiteurPartir();
    }
    function visiteurPhrase(lot, def) {
      const parts = [];
      if (lot.res) parts.push(fmt(lot.qty) + " " + I[lot.res].n);
      if (lot.intu) parts.push(lot.intu + " Intuition");
      if (lot.objet) parts.push("1 " + I[lot.objet].n);
      let h = esc(def.t) + (parts.length ? " Tu reçois : <b>" + esc(parts.join(", ")) + "</b>." : "");
      if (lot.page) h += " " + esc(D.VISITEURS.txt.page);
      if (lot.clin) h += "<br><i>" + esc(lot.clin) + "</i>";
      return h;
    }
    function visiteurToucher() {
      const v = U.vis;
      if (!v) return;
      const lot = E.visiteurToucher(v.id);
      visiteurFin();
      if (!lot) return;
      A.click();
      const def = D.VISITEURS.liste.find((x) => x.id === lot.id);
      toast(visiteurPhrase(lot, def), { key: "visiteur", p: 1 });
      U.dirty = true;
    }
    function visiteurTick() {
      if (U.vis) {
        // une fenêtre s'ouvre ou l'on change d'écran : il s'en va
        if (U.mcur || U.tab !== "domaine" || document.hidden) visiteurFin();
        return;
      }
      const bloque = !U.live || performance.now() < 6000 || !S().introSeen || !!U.offline || !!U.mcur || document.hidden || U.tab !== "domaine" ||
        !!Tuto.active() || !!$(".cele") || !!$("#modal:not(.hidden)") || !!$(".tuto:not(.hidden)");
      const z = U.zone && E.zoneOpen(U.zone) ? U.zone : "lisiere";
      const v = E.visiteurPoll({ bloque, zone: z });
      if (!v) return;
      let layer = $("#visiteurs");
      if (!layer) { layer = document.createElement("div"); layer.id = "visiteurs"; document.body.appendChild(layer); }
      const calme = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      const b = document.createElement("button");
      b.type = "button";
      b.className = "visiteur" + (calme ? " fixe" : "");
      b.setAttribute("aria-label", v.aria);
      b.innerHTML = v.css ? '<span class="vis-' + v.css + '" aria-hidden="true"></span>' : '<span class="vis-ic" aria-hidden="true">' + v.ic + "</span>";
      b.style.setProperty("--dur", v.dur + "s");
      b.style.setProperty("--y", (22 + Math.random() * 30).toFixed(1) + "%");
      b.style.setProperty("--x", (20 + Math.random() * 55).toFixed(1) + "%");
      b.addEventListener("click", (ev) => { ev.stopPropagation(); visiteurToucher(); });
      layer.appendChild(b);
      U.vis = { id: v.id, el: b, to: setTimeout(visiteurFin, (calme ? 10 : v.dur) * 1000 + 300) };
    }
    /* ===== VISITEURS DE PASSAGE (fin) ===== */

    return { visiteurTick, visiteurFin };
  }

  window.EclatVisiteurs = { create };
})();
