/* ÉCLAT — les écouteurs.
 * Ce que le moteur annonce (découvertes, âges, étapes, fins, relève forcée…) devient
 * fêtes, toasts et fenêtres ; ce que le joueur touche (onglets, boutons du haut,
 * clics et appuis dans les vues, clavier) devient appels au moteur. */
(function () {
  "use strict";

  function create(api) {
    const {
      E, A, D, U, Dom, Carte, esc, fmt, zoneName, deZone, icon, fxText, mainIngredient, floater, sparks, fete,
      fireworks, elCenter, toast, vibe, fresh, openModal, closeModal, simpleModal, render, refresh, save, setTab, badge,
      updateBadges, updMini, anchorFor, applyAge, applyUpdate, showOffline, stampHTML, recitInline, recitHTML, loreHTML,
      FOU, explore, goalOpen, openMilestones, openQuestsModal, pour, openSigneModal, confirmFire, listen, skyTap,
      playNote, runTerminal, openMemoire, openDons, openForcedReleve, confirmCycle, showEnding, openStillnessScene,
      openMenu, openAccount, downloadSave, promptCapsuleText, goto, openItemInfo, carnetList, whyNot, putInSlot, forge,
      craftFrom, chainCraft, startHarvest, actBar, skillName, openSkills, openHands, openTree
    } = api;
    const S = () => E.state;
    const I = D.ITEMS;
    const $ = (s, r) => (r || document).querySelector(s);
    /* le retour d’absence, en secondes : en dessous du premier seuil rien, jusqu’au second un message discret, au-delà une fenêtre */
    const ABSENCE_MESSAGE = 60, ABSENCE_FENETRE = 300;

    /* la relève forcée s’ouvre une fois par cycle (sa fenêtre est dans js/memoire.js) */
    let forcedModalShown = false;
    function checkForcedReleve() {
      if (!forcedModalShown && E.canForcedReleve && E.canForcedReleve()) {
        forcedModalShown = true;
        setTimeout(openForcedReleve, 400);
      }
    }

    /* ============================================================ ÉVÉNEMENTS DU MOTEUR */
    function bindEngine() {
      E.on("struct", () => { U.dirty = true; checkForcedReleve(); });
      E.on("cycle", () => { forcedModalShown = false; });
      /* un nouvel âge : un vrai moment, dans la file des fenêtres, après la réminiscence qui l’a amené */
      E.on("age", (a) => {
        const ag = D.AGES[a], miles = (E.milestones()[a] || []).filter((x) => !x.done).length;
        applyAge();
        setTimeout(() => openModal({
          cls: "agecard", persistent: true,
          html: '<div class="kicker center">Tu entres dans</div><h2 class="center">' + esc(ag.n) + '</h2><p class="center q">« ' + esc(ag.q) + " »</p>" +
            '<p class="center small muted">Âge ' + (a + 1) + " sur " + D.AGES.length + (miles ? " · " + miles + " étape" + (miles > 1 ? "s" : "") + " t’attend" + (miles > 1 ? "ent" : "") + " 🏁" : "") + "</p>" +
            '<div class="acts"><button class="btn pri" data-m="close">Continuer</button></div>',
          onOpen: () => { A.age(); sparks(innerWidth / 2, innerHeight * 0.4, 30, ag.c); fireworks(); vibe([20, 60, 20, 60, 40]); }
        }), 700);
      });
      E.on("learn", () => badge("carnet"));
      /* un passage devient possible, puis il est franchi */
      E.on("passage", (z) => {
        badge("domaine");
        setTimeout(() => toast("🚧 <b>" + esc(D.PASSAGES[z].n) + "</b> : pour entrer dans " + esc(zoneName(z)) + ", apporte les ressources nécessaires (dans le Domaine ou sur la Carte).", { key: "pass:" + z, p: 2 }), 900);
      });
      E.on("passdone", (o) => {
        const first = !S().meta.tracesTotal && E.releveGain() === o.tr;
        fete({ ic: "🚧", kick: "Passage franchi", title: D.PASSAGES[o.z].n, sub: "+" + o.tr + " ✦ Traces à ta prochaine relève" });
        if (first) setTimeout(() => simpleModal("Nouveau", "✦ Tu gagnes des Traces",
          "<p><b>Rien ne presse :</b> continue ta partie aussi longtemps que tu veux.</p>" +
          "<p>Chaque passage franchi laisse des Traces ✦. Quand tu le veux, tu peux <b>passer le relais</b> : un nouveau Semeur repart du début, avec tes recettes et les améliorations achetées avec ces Traces.</p>" +
          '<p class="small muted">Touche ✦ en haut de l’écran pour voir ce qu’elles permettent d’acheter.</p>', "Compris"), 2200);
      });
      E.on("zone", (z) => {
        U.zone = z;
        // la nouvelle terre s’allume dans le Domaine
        setTimeout(() => { const el = document.getElementById("dt-" + z); if (el) { el.classList.add("born"); setTimeout(() => el.classList.remove("born"), 1800); } }, 320);
        // la découverte qui ouvre cette terre le dit déjà (« Débloque : … ») : pas de second message
        setTimeout(() => { if (Date.now() - (U.lastDiscover || 0) > 1500) toast("Nouvelle terre : <b>" + esc(zoneName(z)) + "</b>. Ses gisements t’attendent dans le Domaine."); }, 80);
        badge("carte");
        setTimeout(() => { if (U.tab === "domaine") Dom.focusZone(z); else U.domOpen = z; }, 50);
      });
      E.on("discover", (id) => {
        const it = I[id];
        // hors de l’Atelier, la recette était déjà connue : c’est sa première fabrication
        if (!U.forging && !it.sec) fete({ id, kick: "Première fabrication", title: it.n, sub: fxText(id) });
        U.lastDiscover = Date.now();
        if (it.e && it.e.sky) badge("cosmos");
        if (it.t === "mach") badge("domaine");
        updateBadges();
      });
      E.on("event", (ev) => {
        setTimeout(() => simpleModal("Réminiscence", esc(I[ev.id].n), loreHTML(ev.txt)), 500);
      });
      E.on("guidehint", (h) => {
        const it = I[h.id];
        // une variante par objet, pour que deux souvenirs ne se ressemblent pas mot pour mot
        const vs = D.GUIDE.lines[h.lvl - 1], k = Array.from(h.id).reduce((a, c) => a + c.charCodeAt(0), 0);
        const line = vs[k % vs.length]
          .replace("{g}", D.GESTES[it.r[0]].n.toLowerCase())
          .replace("{i}", E.the(mainIngredient(h.id)));
        A.secret();
        toast("💭 <b>" + esc(it.n) + "</b> : " + esc(line));
        badge("domaine");
      });
      E.on("level", (x) => {
        if (!U.live) return;
        const k = E.skill(x.g);
        toast("<b>" + esc(skillName(x.g)) + "</b> niveau " + x.lvl + (x.perk ? " : une chance sur " + Math.round(1 / (E.perkChance(x.g) || 1)) + " d’avoir une pièce en plus." : "."), { key: "lvl:" + x.g });
        if (x.perk) A.discover && A.discover();
        void k;
        if (U.tab === "atelier") render(true);
      });
      E.on("actstop", (x) => {
        const a = x.act, n = a.id ? I[a.id].n : I[a.res].n;
        if (x.why === "missing") toast("⟳ Fabrication en boucle arrêtée (" + esc(n.toLowerCase()) + ") : il manque des ressources.", { key: "act" });
        else if (x.why === "zone") toast("Récolte arrêtée : " + esc(n.toLowerCase()) + ".", { key: "act" });
        render(true);
      });
      E.on("tracked", (id) => { toast("🎯 Fabriqué : <b>" + esc(I[id].n) + "</b>. Suivi terminé.", { key: "it:" + id, p: 2 }); });
      E.on("secret", (id) => {
        badge("journal");
        const it = I[id];
        if (it && it.sec) setTimeout(() => { A.secret(); simpleModal("Secret découvert", esc(it.n), '<div class="row" style="margin-bottom:8px">' + icon(id, "lg") + "</div>" + loreHTML(it.d, it.n) + (fxText(id) ? '<p class="small" style="color:var(--good)">' + esc(fxText(id)) + "</p>" : "")); }, 450);
        else if (id === "caveau" || id === "lune7" || id[0] === "c") setTimeout(() => A.secret(), 300);
      });
      E.on("frag", () => badge("journal"));
      E.on("feuillet", (x) => {
        badge("journal");
        const ui = E.RECIT.ui || {};
        if (x.src === "nuit") setTimeout(() => toast("📄 " + esc(ui.nuit || "")), 1500);
        else if (x.src === "cond") toast("📄 " + esc(ui.comptoir || ""));
        else toast("📄 " + esc(ui.feuillet || ""));
      });
      E.on("page", (p) => {
        badge("journal");
        toast("📖 Une page du Livre : n° " + p.n);
      });
      // une fouille finie : un mot, une pastille sur la Carte ; on la reçoit en la touchant
      E.on("fouillePrete", () => { badge("carte"); if (U.live) toast("🧭 " + esc(FOU().prete || ""), { key: "fouille" }); });
      E.on("fouille", (r) => {
        A.found(); badge("journal");
        const U_ = FOU(), gains = Object.keys(r.butin).map((k) => "+" + fmt(r.butin[k]) + " " + I[k].n.toLowerCase()).concat(r.intu ? ["+" + r.intu + " ✨"] : []);
        openModal({
          html: '<div class="kicker">' + esc(U_.kicker || "") + " · " + esc(zoneName(r.z)) + "</div><h2>" + esc(r.x.n) + '</h2><p class="small muted">' + esc(r.niv.n) + "</p>" +
            loreHTML(r.phrase, zoneName(r.z)) +
            '<p class="small">' + esc(U_.rapporte || "") + " : " + esc(gains.join(", ")) + ".</p>" +
            (r.cote ? '<p class="small" style="color:var(--good)">' + esc(U_.nouveau || "") + " : <b>" + esc(r.cote.n) + "</b>.</p>" : "") +
            '<div class="acts"><button class="btn pri" data-m="close">Continuer</button></div>'
        });
        render(true);
      });
      E.on("expdone", (r) => {
        A.found();
        checkForcedReleve();
        // le lieu est rapporté : une étincelle sur la pastille d’exploration, puis l’histoire
        const ex = $("#expMini");
        if (ex && !ex.classList.contains("hidden")) { const q = elCenter(ex); sparks(q.x, q.y, 12, "#ffd36b"); }
        if (r.frag) badge("journal");
        if (r.silent) return;
        const F = r.frag && D.FRAGS[r.frag];
        const rw = r.x.rw || {};
        const gains = []
          .concat(rw.inv ? Object.keys(rw.inv).map((i) => "+" + rw.inv[i] + " " + I[i].n) : [])
          .concat(rw.item ? Object.keys(rw.item).map((i) => I[i].n) : [])
          .concat(rw.intu ? ["+" + rw.intu + " ✨"] : []);
        if (r.revisit) {
          openModal({
            html: '<div class="kicker">Exploration · ' + esc(zoneName(r.z)) + "</div><h2>" + esc(F ? (F.n || F.titre) : r.x.n) + "</h2>" +
              loreHTML(r.revisit.t, zoneName(r.z)) +
              (gains.length ? '<p class="small muted">Tu rapportes : ' + esc(gains.join(", ")) + "</p>" : "") +
              '<div class="acts"><button class="btn pri" data-m="close">Continuer</button></div>'
          });
          return;
        }
        if (F && !r.fragNew) { toast("🧭 " + esc(r.x.n) + " : déjà raconté dans ton Journal." + (gains.length ? " Tu rapportes : " + esc(gains.join(", ")) + "." : ""), { key: "exp" }); return; }
        openModal({ html: '<div class="kicker">Exploration · ' + esc(zoneName(r.z)) + "</div><h2>" + esc(F ? (F.n || F.titre) : r.x.n) + "</h2>" + (F ? loreHTML(F.t, (F ? (F.n || F.titre) : r.x.n) || zoneName(r.z)) : "") +
          (gains.length ? '<p class="small muted">Tu rapportes : ' + esc(gains.join(", ")) + "</p>" : "") + '<div class="acts"><button class="btn pri" data-m="close">Continuer</button></div>' });
      });
      E.on("arche", (key) => {
        badge("cosmos");
        if (key === "radio") setTimeout(() => {
          openModal({ html: '<div class="kicker">Poste radio</div><h2>Une voix dans le grésillement</h2><div class="term">' + (D.ARCHE.radio || []).map((l) => '<div class="l">' + esc(E.interpolate(l)) + "</div>").join("") +
            '</div><div class="acts"><button class="btn pri" data-m="close">Continuer</button></div>' });
        }, 900);
      });
      /* une pièce sort des mains : le compte monte (le bruit, lui, est celui de l’atelier au travail : js/audio.js, A.work) */
      E.on("handdone", (d) => {
        const el = U.tab === "atelier" ? $("#hands") : null;
        if (el && d.last) { const p = elCenter(el); floater("+" + fmt(d.n) + " " + I[d.id].n, p.x, p.y - 10, "var(--good)"); if (d.bonus) setTimeout(() => floater("★ +" + fmt(d.bonus), p.x, p.y - 26, "var(--intu)"), 200); }
      });
      E.on("hand", (e) => {
        if (e.kind !== "done") return;
        const it = I[e.job.id], n = e.job.s[e.job.s.length - 1][1];
        if (U.tab !== "atelier") toast("✋ Fini : <b>" + esc(it.n) + "</b>" + (E.isUnique(it) ? "" : " ×" + fmt(n)), { key: "it:" + e.job.id, p: 1 });
        else render(); // pas pendant un appui long sur une matière
      });
      E.on("projstep", (x) => {
        const P = D.PROJECTS[x.pid], s = P.steps[x.step];
        A.discover();
        toast("🏗️ " + esc(P.n) + " : étape « " + esc(s.n) + " » terminée.");
        if (U.tab === "cosmos") render(true);
      });
      E.on("crafted", (id) => {
        if (E.cache().pip && (id === "pip" || Math.random() < 0.3)) setTimeout(() => A.pip(), 250);
        if (I[id] && I[id].t === "ext") {
          badge("domaine");
          // déjà posé par les mains (bouton « + cabane ») : rien à dire
          setTimeout(() => { if (E.freeExt(id) >= 1) toast("⛏️ <b>" + esc(I[id].n) + "</b> : touche « + " + esc(I[id].sn || I[id].n) + " » sur un gisement " + esc(deZone(I[id].z)) + ", dans le Domaine.", { key: "it:" + id, p: 4 }); }, 900);
        }
      });
      E.on("decoded", () => {
        setTimeout(() => {
          A.signal();
          openModal({ html: '<div class="kicker">Traducteur</div><h2>' + esc(D.FRAGS.signal.n) + "</h2>" + loreHTML(D.FRAGS.signal.t) +
            '<p class="small muted">Un nouveau Grand Œuvre est apparu dans le Cosmos.</p><div class="acts"><button class="btn pri" data-m="close">Continuer</button></div>' });
          badge("cosmos"); badge("journal");
        }, 600);
      });
      E.on("skyanim", (anim) => {
        if (typeof window !== "undefined" && window.EclatSky && typeof window.EclatSky.trigger === "function") {
          window.EclatSky.trigger(anim);
          if (!window.EclatSky.mounted()) badge("cosmos"); // quelque chose se passe dans le ciel
        }
      });
      E.on("releve_fenetre", () => {
        setTimeout(confirmCycle, 800);
      });
      E.on("halte_jouee", () => { vibe(40); });
      E.on("fx", (k) => { if (k === "fireworks") setTimeout(fireworks, 300); });
      E.on("ending", (r) => { setTimeout(() => showEnding(r), 600); save(); });
      E.on("capsulePrompt", () => { setTimeout(promptCapsuleText, 400); });
      E.on("toast", (msg) => { if (typeof msg === "string") toast(msg); });
      E.on("curio", (id) => {
        const c = D.EASTER && D.EASTER[id];
        if (c) {
          A.secret && A.secret();
          toast((c.ic ? c.ic + " " : "") + "<b>Curiosité :</b> " + esc(c.desc || c.n));
        }
      });
      E.on("offline", (o) => {
        if (o.dt < ABSENCE_MESSAGE) return;
        const top = Object.keys(o.gains).filter((k) => I[k]).sort((a, b) => o.gains[b] - o.gains[a]).slice(0, 10);
        if (o.dt < ABSENCE_FENETRE) {
          // une absence courte (une autre application, l’écran éteint) : un mot, pas une fenêtre qui bloque
          if (top.length) toast("Pendant ton absence : " + top.slice(0, 2).map((k) => "+" + fmt(o.gains[k]) + " " + esc(I[k].n)).join(", "), { key: "absence" });
          if (o.exp) toast("Ton exploration est terminée.", { key: "absence-exp" });
          return;
        }
        if (!top.length && !o.exp && o.dt < 600) return;
        U.offline = { dt: o.dt, top, gains: o.gains, exp: o.exp };
      });
    }

    /* ============================================================ ÉCOUTEURS DOM */
    function bindDom() {
      const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight"];
      let kIdx = 0;
      function triggerKonami() {
        if (E.addCurio("konami")) {
          A.secret && A.secret();
        }
        if (window.EclatSky && window.EclatSky.boostStars) {
          window.EclatSky.boostStars(60000);
        }
        toast("⭐ Trente étoiles de plus brillent dans la nuit.");
      }
      document.addEventListener("keydown", (ev) => {
        if (U.mcur && ev.key === "Escape" && !U.mcur.persistent && !fresh()) { ev.preventDefault(); closeModal(); return; }
        if (U.mcur && ev.key === "Tab") {
          // le focus reste dans la fenêtre ouverte
          const box = $("#modal .modal-box");
          const list = [...box.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter((x) => !x.disabled && x.offsetParent !== null);
          if (!list.length) { ev.preventDefault(); box.focus(); return; }
          const first = list[0], last = list[list.length - 1], cur = document.activeElement;
          if (ev.shiftKey && (cur === first || cur === box || !box.contains(cur))) { ev.preventDefault(); last.focus(); return; }
          if (!ev.shiftKey && (cur === last || !box.contains(cur))) { ev.preventDefault(); first.focus(); return; }
        }
        // la Carte au clavier : un lieu, un passage, une terre ou le camp se touchent d’Entrée ou d’Espace
        if ((ev.key === "Enter" || ev.key === " ") && document.activeElement && document.activeElement.matches("#v-carte svg [tabindex]")) {
          ev.preventDefault();
          Carte.click(document.activeElement);
          return;
        }
        // une ressource au clavier : Entrée pose sur l’établi (voir le clic), « i » ou Maj + Entrée ouvre sa fiche, sans appui long
        if (document.activeElement && document.activeElement.matches(".inv") && (ev.key === "i" || (ev.key === "Enter" && ev.shiftKey))) {
          ev.preventDefault();
          openItemInfo(document.activeElement.dataset.inv);
          return;
        }
        if ((ev.key === "Enter" || ev.key === " ") && document.activeElement && document.activeElement.matches("[data-goto]")) {
          ev.preventDefault();
          goto(document.activeElement.dataset.goto);
          return;
        }
        if (ev.key === KONAMI[kIdx]) {
          kIdx++;
          if (kIdx === KONAMI.length) {
            kIdx = 0;
            triggerKonami();
          }
        } else {
          kIdx = (ev.key === KONAMI[0]) ? 1 : 0;
        }
      });
      document.addEventListener("pointerdown", (ev) => { U.pointer = { x: ev.clientX, y: ev.clientY }; }, true);
      document.addEventListener("wheel", (ev) => {
        const el = ev.target.closest(".ztabs, .filters, .u-tools, .u-free");
        if (el && !ev.shiftKey && Math.abs(ev.deltaY) > Math.abs(ev.deltaX)) {
          if (el.scrollWidth > el.clientWidth) {
            el.scrollLeft += ev.deltaY;
            ev.preventDefault();
          }
        }
      }, { passive: false });
      $("#tabs").addEventListener("click", (ev) => { const b = ev.target.closest("button[data-tab]"); if (b) { A.init(); A.click(); setTab(b.dataset.tab); } });
      const ageEl = $("#ageBtn") || $(".age");
      if (ageEl) ageEl.addEventListener("click", () => { A.init(); A.click(); openMilestones(); });
      const qEl = $("#questBtn");
      if (qEl) qEl.addEventListener("click", () => { A.init(); A.click(); openQuestsModal(); });
      $("#menuBtn").addEventListener("click", () => { A.init(); openMenu(); });
      $("#memBtn").addEventListener("click", () => { A.init(); A.click(); openMemoire(); });
      $("#cloudBtn").addEventListener("click", () => { A.init(); openAccount(); });
      $("#intuBtn").addEventListener("click", () => simpleModal("Intuition", "✨ " + Math.floor(S().intu),
        '<p class="small">L’Intuition s’obtient en découvrant des recettes, des fragments d’histoire et des secrets. Elle sert à étudier une ressource (touche 🔍 Étudier sur sa fiche) et à déchiffrer une recette inconnue étape par étape (touche ✨ Déchiffrer sur sa fiche).</p>' +
        (E.cache().intu ? '<p class="small muted">Gain automatique : +' + E.cache().intu + " ✨ par minute.</p>" : "")));
      $("#expMini").addEventListener("click", () => { const a = S().exp.active; U.zone = a ? a.z : U.zone; setTab("carte"); });
      $("#actbar").addEventListener("click", (ev) => {
        const b = ev.target.closest("[data-ab]");
        if (!b) return;
        A.init();
        if (b.dataset.ab === "stop") { E.stopAct(); A.click(); render(true); actBar(); return; }
        if (b.dataset.ab === "harvest") {
          const a = S().act;
          if (a && a.k === "harv") { U.zone = a.z; setTab("domaine"); Dom.focusZone(a.z); }
          return;
        }
        openHands();
      });
      $("#updBar").addEventListener("click", (ev) => {
        const b = ev.target.closest("[data-u]");
        if (!b) return;
        if (b.dataset.u === "save") downloadSave();
        if (b.dataset.u === "go") applyUpdate();
      });

      const views = $("#views");
      views.addEventListener("pointerdown", (ev) => {
        if (U.tab === "domaine" && Dom.down(ev)) return; // récolte à la main
        // le bouton d’œuvre agit au relâcher, même si l’établi s’est redessiné entre-temps (taper vite)
        if (ev.target.closest("#forge, [data-forge]")) U.fdown = { x: ev.clientX, y: ev.clientY, mini: !!ev.target.closest("[data-forge]") };
        const inv = ev.target.closest(".inv");
        if (inv) {
          const id = inv.dataset.inv;
          U.lp = { id, t: setTimeout(() => { U.lp = null; vibe(15); openItemInfo(id); }, 480) };
        }
      });
      const cancelLp = () => { if (U.lp) { clearTimeout(U.lp.t); U.lp.up = true; } };
      ["pointerup", "pointercancel"].forEach((t) => document.addEventListener(t, cancelLp));
      ["pointerup", "pointercancel"].forEach((t) => document.addEventListener(t, (ev) => Dom.up(ev)));
      views.addEventListener("scroll", () => { if (U.lp) { clearTimeout(U.lp.t); U.lp = null; } updMini(); }, { passive: true });
      views.addEventListener("contextmenu", (ev) => {
        const iv = ev.target.closest(".inv");
        if (iv) { ev.preventDefault(); openItemInfo(iv.dataset.inv); return; } // clic droit ou touche Menu : la fiche
        if (ev.target.closest(".slot, [data-harv]")) ev.preventDefault();
      });

      views.addEventListener("click", (ev) => {
        const t = ev.target;
        let b;
        if (U.tab === "atelier") { U.anchor = anchorFor(t); U.anchorAt = performance.now(); }
        if (U.tab === "carte" && Carte.click(t)) return;
        if (Dom.click(t, ev)) return;
        if ((b = t.closest(".inv"))) {
          // « Fiches » : un appui ouvre la fiche (l’alternative à l’appui long) ; sinon un appui pose sur l’établi
          if (U.lp) { cancelLp(); U.lp = null; if (U.invFiche) openItemInfo(b.dataset.inv); else putInSlot(b.dataset.inv); }
          else if (ev.detail === 0) { if (U.invFiche) openItemInfo(b.dataset.inv); else putInSlot(b.dataset.inv); } // au clavier : pas d’appui, donc pas de minuteur
          return;
        }
        if (t.closest("[data-fichemode]")) { U.invFiche = !U.invFiche; A.click(); render(true); return; }
        if ((b = t.closest("[data-pin]"))) { const on = E.togglePin(b.dataset.pin); A.click(); toast(on ? "★ Épinglée : visible en haut de l’Atelier." : "Recette désépinglée."); render(true); return; }
        if ((b = t.closest(".nope[data-chain], .nope[data-cr]"))) {
          A.fail(0);
          toast(whyNot(b.dataset.chain || b.dataset.cr, b.dataset.n === "max" ? 1 : Number(b.dataset.n) || 1, true), { key: "nope" });
          return;
        }
        if ((b = t.closest("[data-hopen]"))) { A.init(); openHands(); return; }
        if ((b = t.closest("[data-chain]"))) { if (!b.disabled) chainCraft(b, b.dataset.chain, 1); return; }
        if ((b = t.closest("[data-tree]"))) { openTree(b.dataset.tree, 1); return; }
        if ((b = t.closest("[data-track]"))) { E.setTrack(b.dataset.track); A.click(); toast("🎯 Suivi : <b>" + esc(I[b.dataset.track].n) + "</b> (en haut du Domaine)"); render(true); return; }
        if ((b = t.closest("[data-untrack]"))) { E.setTrack(null); render(true); return; }
        if ((b = t.closest("[data-gz]"))) { // « Aller au gisement » : la terre, dans le Domaine
          const z = b.dataset.gz; A.click(); U.zone = z; if (U.mcur) closeModal();
          setTab("domaine"); setTimeout(() => Dom.focusZone(z), 80); return;
        }
        if ((b = t.closest("[data-gotab]"))) { setTab(b.dataset.gotab); return; }
        if (t.closest("[data-open-quests]")) { A.click(); openQuestsModal(); return; }
        if (t.closest("[data-miles]")) { A.click(); openMilestones(); return; }
        if (t.closest("[data-cycle]")) { A.click(); openMemoire(); return; }
        if (t.closest("[data-dons]")) { A.click(); openDons(); return; }
        if ((b = t.closest("[data-pour]"))) { pour(b.dataset.pour, b); return; }
        if ((b = t.closest("[data-gotab]"))) { A.click(); setTab(b.dataset.gotab); return; }
        if ((b = t.closest("[data-hloop]"))) { startHarvest(b.dataset.hloop); return; }
        if (t.closest("[data-skills]")) { A.click(); openSkills(); return; }
        if ((b = t.closest("[data-tab2]"))) { A.click(); setTab(b.dataset.tab2); return; }
        if ((b = t.closest("[data-goalt]"))) {
          const st = S(), open = goalOpen();
          if (st.track && I[st.track.id]) U.goalPeek = !open; else st.settings.goalOpen = !open;
          A.click(); render(true); return;
        }
        if ((b = t.closest("[data-g]"))) { U.geste = b.dataset.g; A.click(); U.last = null; render(true); return; }
        if ((b = t.closest("[data-lock]"))) { toast("Action encore inconnue. Elle se débloque avec sa station : feu, enclume, creuset…"); return; }
        if ((b = t.closest("[data-slot]"))) { const i = Number(b.dataset.slot); if (U.slots[i]) { U.slots[i] = null; A.click(); render(true); } else toast("Touche une ressource ci-dessous pour la poser ici."); return; }
        if ((b = t.closest("[data-qty]"))) { S().flags.carnetQty = b.dataset.qty === "max" ? "max" : Number(b.dataset.qty); A.click(); render(true); return; }
        if (t.closest("[data-resclose]")) { U.last = null; A.click(); render(true); return; }
        if (t.closest("[data-clear]")) { U.slots = [null, null, null]; U.last = null; A.click(); render(true); return; }
        if (t.closest("#forge, [data-forge]") && !t.closest("[data-s]")) {
          if (performance.now() - (U.forgeUp || 0) < 600) return; // déjà fait au relâcher
          U.fromMini = !!t.closest("[data-forge]"); forge(); U.fromMini = false; return;
        }
        if ((b = t.closest("[data-clear-search]"))) {
          const target = b.dataset.clearSearch;
          A.click(); vibe(6);
          if (target === "iq") {
            U.iq = "";
            render(true);
          } else if (target === "cq") {
            U.q = "";
            const l = $("#clist");
            if (l) { l.innerHTML = carnetList(); refresh(); }
            render(true);
          }
          return;
        }
        if ((b = t.closest("[data-cr]"))) { craftFrom(b); return; }
        if ((b = t.closest("[data-study-all]"))) { const n = E.studyAll(); if (n) { toast("🔍 " + n + " ressources étudiées."); A.discover(); } render(true); return; }
        if ((b = t.closest("[data-if]"))) { U.invFilter = b.dataset.if; S().settings.inv = Object.assign({}, S().settings.inv, { filter: U.invFilter }); render(true); return; }
        if ((b = t.closest("[data-cf]"))) { U.carnetFilter = b.dataset.cf; render(true); return; }
        if ((b = t.closest("[data-owned]"))) { U.showOwned = !U.showOwned; render(true); return; }
        if ((b = t.closest("[data-hcancel]"))) {
          const j = S().hand.q[Number(b.dataset.hcancel)];
          if (j && E.cancelJob(Number(b.dataset.hcancel))) { A.click(); toast("Annulé : " + esc(I[j.id].n) + ". Matières restituées."); render(true); }
          return;
        }
        if ((b = t.closest("[data-tip]"))) { S().flags[b.dataset.tip] = true; render(true); return; }
        if ((b = t.closest("[data-exp]"))) { explore(b.dataset.exp); return; }
        if ((b = t.closest("[data-goto]"))) { U.rfrom = null; goto(b.dataset.goto); return; }
        if ((b = t.closest("[data-jt]"))) { U.journalTab = b.dataset.jt; if (b.dataset.jt === "flute") E.clearNotes(); render(true); return; }
        if ((b = t.closest("[data-s]"))) { A.click(); openSigneModal(b.dataset.s); return; }
        if ((b = t.closest("[data-page]"))) {
          const pid = b.dataset.page;
          const c = E.livre ? E.livre().find((x) => x.id === pid) : null;
          if (c && c.page) {
            E.readPage(pid);
            render(true);
            const makeHTML = () => {
              const curC = E.livre ? E.livre().find((x) => x.id === pid) : c;
              const p = curC.page;
              const notesHTML = (curC.notes && curC.notes.length) ?
                '<div class="livre-notes">' + curC.notes.map((n) =>
                  '<div class="livre-note">' + recitHTML(n.t, "Page " + curC.n) +
                  (n.sig ? '<div class="livre-sig">' + recitInline(n.sig, "Page " + curC.n) + '</div>' : '') +
                  '</div>'
                ).join("") + '</div>' : '';
              return '<div class="kicker">Le Livre des Semeurs · n° ' + curC.n + '</div>' +
                '<h2>' + esc(p.titre || ("Page " + curC.n)) + '</h2>' + stampHTML("p:" + pid) +
                '<div class="livre-imprime lore">' + recitHTML(p.imprime, "Page " + curC.n) + '</div>' +
                notesHTML +
                '<div class="acts"><button class="btn pri" data-m="close">Refermer</button></div>';
            };
            openModal({
              html: makeHTML(),
              refresh: makeHTML
            });
          }
          return;
        }
        if ((b = t.closest("[data-askhelp]"))) {
          const qid = b.dataset.askhelp;
          const res = E.askHelp ? E.askHelp(qid) : null;
          if (res && res.ok) {
            A.click();
            render(true);
          }
          return;
        }
        if ((b = t.closest("[data-frag]"))) { const F = D.FRAGS[b.dataset.frag]; simpleModal("Fragment", esc(F.n || F.titre), stampHTML("f:" + b.dataset.frag) + loreHTML(E.interpolate ? E.interpolate(F.t || F.lore) : (F.t || F.lore), F.n || F.titre || "Fragment"), "Refermer"); return; }
        if ((b = t.closest("[data-note]"))) { playNote(Number(b.dataset.note), b); return; }
        if ((b = t.closest("[data-play]"))) {
          A.init();
          const allM = (typeof E.allMelodies === "function") ? E.allMelodies() : D.MELODIES;
          const notes = E.airNotes ? E.airNotes(b.dataset.play) : (allM[b.dataset.play] || {}).notes;
          if (notes) notes.forEach((n, i) => setTimeout(() => playNote(n), i * 420));
          return;
        }
        if ((b = t.closest("[data-ct]"))) { U.cosmosTab = b.dataset.ct; render(true); return; }
        if ((b = t.closest("[data-fgz]"))) { A.click(); U.zone = b.dataset.fgz; setTab("carte"); return; } // une étoile pâle : le lieu, sur la Carte
        if (t.closest("#listen")) { listen(); return; }
        if ((b = t.closest("[data-fire]"))) { confirmFire(b.dataset.fire); return; }
        if ((b = t.closest("[data-proj-act]"))) {
          const pid = b.dataset.projAct;
          if (pid === "chant") {
            const r = E.cutRelay();
            if (r.ok) {
              A.click();
              vibe(30);
              toast("⚡ " + esc(((E.RECIT.chant || {}).scene || {}).debut ? E.RECIT.chant.scene.debut[0] : ""));
              render(true);
            } else {
              A.fail(0);
              toast(esc((E.RECIT.chant || {}).manque || ""));
            }
          }
          return;
        }
        if ((b = t.closest("[data-proj-scene]"))) {
          const pid = b.dataset.projScene;
          if (pid === "chant") {
            A.click();
            openStillnessScene();
          }
          return;
        }
      });
      views.addEventListener("change", (ev) => {
        const t = ev.target;
        if (t.id === "isort") { S().settings.inv = Object.assign({}, S().settings.inv, { sort: t.value }); render(true); }
      });
      views.addEventListener("input", (ev) => {
        if (ev.target.id === "iq") { U.iq = ev.target.value; render(true); return; }
        if (ev.target.id === "cq") {
          U.q = ev.target.value;
          const l = $("#clist");
          if (l) { l.innerHTML = carnetList(); refresh(); }
          const p = ev.target.parentNode;
          let sc = p ? p.querySelector(".search-clear") : null;
          if (U.q && !sc && p) {
            sc = document.createElement("button");
            sc.className = "search-clear";
            sc.dataset.clearSearch = "cq";
            sc.setAttribute("aria-label", "Effacer");
            sc.textContent = "✕";
            p.appendChild(sc);
          } else if (!U.q && sc) {
            sc.remove();
          }
        }
      });
      views.addEventListener("focusin", (ev) => { if (ev.target.id === "cq" || ev.target.id === "iq") ev.target.select(); });
      views.addEventListener("toggle", (ev) => {
        const d = ev.target;
        if (d.matches && d.matches("details[data-age]")) U.openAges[d.dataset.age] = d.open;
      }, true);
      views.addEventListener("submit", (ev) => {
        if (ev.target.id === "termForm") { ev.preventDefault(); runTerminal($("#termIn").value); }
        if (ev.target.id === "nomForm") {
          ev.preventDefault();
          const v = $("#nomIn").value;
          if (!v.trim()) return;
          A.init(); A.click();
          const r = E.nommer(v), NM = (E.RECIT && E.RECIT.nommer) || {};
          toast(esc(r.ok ? (r.revoila ? NM.revoila : NM.oui) : r.why === "deja" ? NM.deja : NM.surnom || ""), { key: "nom" });
          save(); render(true);
        }
      });
      let skyTouch = null;
      views.addEventListener("pointerdown", (ev) => {
        if (ev.target.id === "skyCanvas") {
          skyTouch = { x: ev.clientX, y: ev.clientY, t: Date.now() };
        }
      });
      views.addEventListener("pointerup", (ev) => {
        if (ev.target.id === "skyCanvas") {
          if (skyTouch) {
            const dx = ev.clientX - skyTouch.x;
            const dy = ev.clientY - skyTouch.y;
            const dt = Date.now() - skyTouch.t;
            skyTouch = null;
            if (dt < 1500 && (Math.abs(dx) > 25 || Math.abs(dy) > 25)) {
              let dir = null;
              if (Math.abs(dy) > Math.abs(dx)) dir = dy < 0 ? "ArrowUp" : "ArrowDown";
              else dir = dx < 0 ? "ArrowLeft" : "ArrowRight";
              if (dir) {
                if (dir === KONAMI[kIdx]) {
                  kIdx++;
                  if (kIdx === KONAMI.length) {
                    kIdx = 0;
                    triggerKonami();
                  }
                } else {
                  kIdx = (dir === KONAMI[0]) ? 1 : 0;
                }
              }
              return;
            }
          }
          skyTap(ev);
        }
        const d = U.fdown;
        U.fdown = null;
        // un signe posé sur le bouton ouvre sa fiche au lieu de fabriquer
        if (d && Math.hypot(ev.clientX - d.x, ev.clientY - d.y) < 12 && ev.target.closest("#forge, [data-forge]") && !ev.target.closest("[data-s]")) {
          U.forgeUp = performance.now();
          U.anchor = d.mini ? anchorFor(ev.target) : "#forge"; U.anchorAt = performance.now();
          U.fromMini = d.mini; forge(); U.fromMini = false;
        }
      });

      document.addEventListener("visibilitychange", () => {
        if (document.hidden) save();
        else { E.update(); showOffline(); render(true); }
      });
      window.addEventListener("pagehide", save);
    }

    return { bindEngine, bindDom, checkForcedReleve };
  }

  window.EclatEcouteurs = { create };
})();
