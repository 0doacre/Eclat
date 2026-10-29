/* ÉCLAT — la relève et la Mémoire des mains.
 * L’éveil (et le premier réveil), la scène du chant, les fins, la fenêtre de relève
 * (et la relève forcée), les dons du Semeur d’avant, la Mémoire des mains et sa puce. */
(function () {
  "use strict";

  function create(api) {
    const {
      E, A, D, U, esc, fmt, fmtNum, fmtTime, perMin, zoneName, toast, vibe, openModal, closeModal, swapModal, simpleModal,
      render, save, setTab, pushBackup, recitInline, loreHTML, uiSigne, ornementHTML, playNote, Tuto, applyLargeText
    } = api;
    const S = () => E.state;
    const I = D.ITEMS;
    const $ = (s, r) => (r || document).querySelector(s);

    function fmtDur(s) {
      if (typeof fmtTime === "function") return fmtTime(s);
      s = Math.max(0, Math.round(s || 0));
      if (s < 60) return s + " s";
      const m = Math.floor(s / 60), r = s % 60;
      if (m < 60) return m + " min" + (r ? " " + r + " s" : "");
      const h = Math.floor(m / 60), rm = m % 60;
      return h + " h" + (rm ? " " + rm + " min" : "");
    }
    function cycleMirrorHTML() {
      if (typeof E.cycleMirror !== "function") return "";
      const cm = E.cycleMirror();
      if (!cm || !cm.rows || !cm.rows.length) return "";
      const shown = cm.rows.filter((r) => r.cur > 0 || r.prev > 0);
      if (!shown.length) return "";
      const title = cm.isJustWoken
        ? "⏱️ Bilan du Semeur " + (cm.cycle + 6)
        : "⏱️ Miroir du cycle · Semeur " + (cm.cycle + 6);
      const items = shown.map((r) => {
        const curTxt = r.cur > 0 ? "<b>" + esc(fmtDur(r.cur)) + "</b>" : '<span class="muted">non franchi</span>';
        const cmp = [];
        if (r.prev > 0 && r.cur > 0) {
          const diff = r.prev - r.cur;
          if (diff > 5) {
            const mult = r.speedup >= 1.2 ? " (×" + String(r.speedup).replace(".", ",") + ")" : "";
            cmp.push('<span class="good">−' + esc(fmtDur(diff)) + mult + " vs cycle précédent</span>");
          } else if (diff < -5) {
            cmp.push('<span class="muted">cycle précédent : ' + esc(fmtDur(r.prev)) + "</span>");
          } else {
            cmp.push('<span class="muted">même rythme (' + esc(fmtDur(r.prev)) + ")</span>");
          }
        } else if (r.prev > 0 && !r.cur) {
          cmp.push('<span class="muted">cycle précédent : ' + esc(fmtDur(r.prev)) + "</span>");
        }
        if (r.isRecord) cmp.push('<span class="badge-rec">★ Record</span>');
        return '<div class="cm-row"><span class="cm-zone">' + esc(r.n) + '</span><span class="cm-val">' + curTxt + (cmp.length ? " · " + cmp.join(" ") : "") + "</span></div>";
      }).join("");
      return '<div class="card cycle-mirror"><div class="small"><b>' + title + '</b></div><div class="cm-list">' + items + "</div></div>";
    }

    function intro(onDone) {
      const st = S();
      const isLibere = (typeof E.isLibere === "function" && E.isLibere()) || (st.meta && st.meta.endings && st.meta.endings.retour);
      const EV = D.EVEILS || {};
      const linesRaw = isLibere ? (EV.libre || []) : (EV[st.cycle] || (st.cycle > 1 ? (EV.autre || []) : D.INTRO));
      const lines = linesRaw.map((l) => (E.interpolate ? E.interpolate(l) : l));
      // en tête des éveils, un signe ; à la fin de la scène, l’ornement (s’il est dans les données)
      const lieu = isLibere ? "Le réveil libre" : (st.cycle > 1 ? "Les éveils" : "Le premier réveil");
      const firstWake = !isLibere && st.cycle === 1 && !st.stats.crafts;
      const html = () => '<div class="lore" style="padding:10px 0">' +
        (!isLibere && st.cycle > 1 && uiSigne("eveil") ? '<p class="scene-signe" style="opacity:0;animation:fadeup 1.2s 0.1s forwards">' + uiSigne("eveil", lieu) + "</p>" : "") +
        lines.map((l, i) => '<p style="opacity:0;animation:fadeup 1.2s ' + (0.3 + i * 1.1) + 's forwards">' + recitInline(l, lieu) + "</p>").join("") +
        (!isLibere ? ornementHTML(lieu, 0.3 + lines.length * 1.1) : "") +
        '</div><div class="acts"><button class="btn pri wide" data-m="close">Ouvrir les yeux</button>' +
        (firstWake ? '<button class="btn ghost wide" data-m="largetext" title="Agrandir les textes de tout le jeu pour une lecture plus confortable (modifiable dans le Menu)">Aa Grand texte : ' + (st.settings && st.settings.largeText ? "Activé" : "Désactivé") + '</button>' : "") +
        (firstWake ? '<button class="btn ghost wide" data-m="sansguide" title="Jouer sans les bulles d’explication (réactivable dans le Menu)">Sans guide</button>' : "") + "</div>";
      openModal({
        persistent: true,
        html: html(),
        refresh: html,
        on: {
          largetext: (b) => {
            st.settings = st.settings || {};
            st.settings.largeText = !st.settings.largeText;
            if (typeof applyLargeText === "function") applyLargeText();
            else if (U && typeof U.applyLargeText === "function") U.applyLargeText();
            if (b) b.textContent = "Aa Grand texte : " + (st.settings.largeText ? "Activé" : "Désactivé");
            save();
            return true;
          },
          sansguide: () => { Tuto.setEnabled(false); }
        },
        onClose: () => {
          st.introSeen = true; st.flags.news = null; st.flags.ver = D.VERSION; save(); A.init();
          if (st.flags.capsuleMsg) {
            st.flags.capsuleMsg = false;
            simpleModal("Capsule temporelle", "Un message de toi-même",
              loreHTML((E.RECIT.ui || {}).capsule || ""));
          }
          if (onDone) setTimeout(onDone, 120);
        }
      });
    }

    let stillnessTimer = null;
    let stillnessStart = 0;
    let stillnessElapsed = 0;
    let stillnessActive = false;
    let stillnessDone = false;

    function openStillnessScene() {
      if (stillnessActive) return;
      stillnessActive = true;
      stillnessDone = false;
      stillnessElapsed = 0;
      stillnessStart = Date.now();

      const SC = ((E.RECIT && E.RECIT.chant) || {}).scene || { voix: [], debut: [] };
      const whispers = SC.voix.map((t, i) => [6 * (i + 1), t]);
      const totalDuration = (D.STILLNESS_DUR !== undefined) ? D.STILLNESS_DUR : ((S().settings && S().settings.gestesLongs) ? 20 : 45);
      const spoken = new Set();

      function renderWhispers() {
        const container = $("#stillnessWhispers");
        if (!container) return;
        whispers.forEach(([sec, txt]) => {
          const targetSec = (totalDuration < 45) ? (sec * totalDuration / 45) : sec;
          if (stillnessElapsed >= targetSec && !spoken.has(sec)) {
            spoken.add(sec);
            const p = document.createElement("p");
            p.className = "whisper";
            p.style.opacity = "0";
            p.style.animation = "fadeup 1.2s forwards";
            p.style.fontStyle = "italic";
            p.style.color = "var(--muted)";
            p.textContent = txt;
            container.appendChild(p);
          }
        });
      }

      function tick() {
        if (!stillnessActive || stillnessDone) return;
        if (document.hidden) {
          stillnessStart = Date.now() - stillnessElapsed * 1000;
          return;
        }
        stillnessElapsed = (Date.now() - stillnessStart) / 1000;
        renderWhispers();

        if (stillnessElapsed >= totalDuration) {
          stillnessDone = true;
          clearInterval(stillnessTimer);
          const container = $("#stillnessWhispers");
          if (container) {
            const finalP = document.createElement("p");
            finalP.style.fontWeight = "bold";
            finalP.style.color = "var(--accent, #e5a93c)";
            finalP.style.marginTop = "16px";
            finalP.style.animation = "fadeup 1.2s forwards";
            finalP.textContent = SC.fin || "";
            container.appendChild(finalP);
          }
          if (E.releaseHand) E.releaseHand();
          setTimeout(() => {
            closeModal();
            stillnessActive = false;
            const notes = (E.airNotes && E.airNotes("frere")) || [];
            notes.forEach((n, idx) => {
              setTimeout(() => {
                if (typeof playNote === "function") playNote(n);
              }, idx * 400);
            });
            setTimeout(() => {
              E.fire("chant");
            }, notes.length * 400 + 800);
          }, 2200);
        }
      }

      function resetTimer(e) {
        if (!stillnessActive || stillnessDone) return;
        if (e && e.target && e.target.closest && e.target.closest("#stillnessRelayBtn")) return;
        stillnessStart = Date.now();
        stillnessElapsed = 0;
        spoken.clear();
        const container = $("#stillnessWhispers");
        if (container) container.innerHTML = "";
      }

      openModal({
        persistent: true,
        cls: "stillness-scene",
        html: '<h2>' + esc(SC.titre || "") + '</h2>' +
          '<div class="lore" id="stillnessLore">' +
          SC.debut.map((t, i) => '<p style="opacity:0;animation:fadeup 1.2s ' + (0.2 + i) + 's forwards">' + esc(t) + "</p>").join("") +
          '<div id="stillnessWhispers" style="margin-top:12px"></div>' +
          '</div>' +
          '<div class="acts" style="margin-top:24px">' +
          '<button class="btn pri wide" id="stillnessRelayBtn">Passer le relais ✦</button>' +
          '</div>',
        onClose: () => {
          stillnessActive = false;
          clearInterval(stillnessTimer);
          document.removeEventListener("pointerdown", resetTimer);
          document.removeEventListener("keydown", resetTimer);
        }
      });

      stillnessTimer = setInterval(tick, 250);
      document.addEventListener("pointerdown", resetTimer);
      document.addEventListener("keydown", resetTimer);

      setTimeout(() => {
        const relayBtn = $("#stillnessRelayBtn");
        if (relayBtn) {
          relayBtn.onclick = () => {
            toast(esc(SC.pasEncore || ""));
            closeModal();
          };
        }
      }, 50);
    }

    function showEnding(r) {
      const en = D.ENDINGS[r.id];
      A.ending(r.id);
      const paras = E.interpolate(en.t).split("\n\n").concat(r.extra);
      const st = S();
      const n = Object.keys(st.meta.endings).length;
      const dernier = () => { if (en.dernier) openModal({ cls: "ending", persistent: true, html: '<div style="min-height:50vh;display:flex;align-items:center;justify-content:center"><h2 class="center serif" style="opacity:0;animation:fadeup 2s 0.6s forwards">' + esc(en.dernier) + '</h2></div><div class="acts" style="opacity:0;animation:fadeup 1s 3s forwards"><button class="btn" data-m="close">Continuer ce cycle</button><button class="btn pri" data-m="cycle">Nouveau cycle ✦</button></div>', on: { cycle: () => setTimeout(confirmCycle, 100) } }); };
      openModal({
        cls: "ending", persistent: true,
        html: '<div class="kicker center">Fin</div><h2 class="center" style="font-size:32px">' + en.ic + " " + esc(en.n) + "</h2>" +
          '<div class="lore">' + paras.map((p, i) => '<p style="animation-delay:' + (0.6 + i * 1.6) + 's">' + p.split("\n").map((l) => recitInline(l, "Fin : " + en.n)).join("<br>") + "</p>").join("") +
          ornementHTML("Fin : " + en.n, 0.6 + paras.length * 1.6, r.id) + "</div>" +
          '<p class="center small muted" style="margin-top:24px;opacity:0;animation:fadeup 1s ' + (1 + paras.length * 1.6) + 's forwards">Fins découvertes : ' + n + "</p>" +
          (en.dernier ? '<div class="acts" style="opacity:0;animation:fadeup 1s ' + (1.4 + paras.length * 1.6) + 's forwards"><button class="btn pri" data-m="last">…</button></div>'
            : '<div class="acts" style="opacity:0;animation:fadeup 1s ' + (1.4 + paras.length * 1.6) + 's forwards"><button class="btn" data-m="close">Continuer ce cycle</button><button class="btn pri" data-m="cycle">Nouveau cycle ✦</button></div>'),
        on: { cycle: () => setTimeout(confirmCycle, 100), last: () => { setTimeout(dernier, 120); } }
      });
    }
    function confirmCycle() {
      const st = S();
      const ech = Object.values(st.meta.endings).reduce((a, b) => a + b, 0), gain = E.releveGain();
      const ecus = Math.floor(st.ecus || 0);
      const det = E.ecusDetail(ecus);
      const ecusTr = det.trace;
      const totalGain = gain + ecusTr;
      // au-delà de ce que les passages ont rapporté, le Troqueur ne rachète plus qu’un quart : on le dit
      const plafond = det.plafonne ? " Il les rachète à plein tarif jusqu’à " + det.seuil + " ✦, ce que tes passages ont rapporté, puis à un quart : sans cela, " + det.brut + " ✦." : "";
      const ecusMsg = ecus > 0 ? '<p class="small">Tes ' + fmt(ecus) + ' écus deviennent ' + ecusTr + ' ✦ Trace' + (ecusTr > 1 ? 's' : '') + '.' + plafond + '</p>' : '';
      const isLibere = (typeof E.isLibere === "function" && E.isLibere()) || (st.meta && st.meta.endings && st.meta.endings.retour);
      const kicker = isLibere ? "Le repos partagé" : "La relève";
      const title = isLibere ? "Passer le relais près du feu ?" : "Éveiller le Semeur " + (st.cycle + 7) + " ?";
      const desc = isLibere
        ? ((E.RECIT.releve || {}).repos || "")
        : '<p class="small">Le Semeur ' + (st.cycle + 7) + " s’éveille à la Lisière. Il retrouve ton Carnet, ton Journal et la Mémoire des mains.</p>";
      const backupLabel = isLibere
        ? "Avant le repos (Semeur " + (st.cycle + 7) + ")"
        : "Avant la relève (Semeur " + (st.cycle + 7) + ")";
      openModal({
        html: '<div class="kicker">' + kicker + "</div><h2>" + title + "</h2>" + desc +
          (isLibere
            ? "<p>Tu gagnes <b>" + totalGain + " ✦ Trace" + (totalGain > 1 ? "s" : "") + "</b>, à dépenser dans la Mémoire des mains." + (ech ? " Échos : <b>" + ech + "</b>, soit <b>+" + ech * 50 + " %</b> de récolte et de production." : "") + "</p>" + ecusMsg
            : leftHTML(totalGain, ecus, ecusTr)) +
          cycleMirrorHTML() +
          '<p class="small"><b>💾 Une copie de ta partie est mise de côté avant</b> (Menu → Sauvegardes) : tu pourras toujours revenir en arrière.</p>' +
          E.territoiresTransmissionHTML(esc) +
          releveExtrasHTML() +
          '<div class="acts"><button class="btn" data-m="close">Pas encore</button><button class="btn pri" data-m="go">Passer le relais ✦</button>' + releveBtnSigne() + '</div>',
        onOpen: armTrait,
        onClose: disarmTrait,
        on: {
          go: () => {
            pushBackup(E.serialize(), backupLabel);
            E.newCycle();
            save();
            U.slots = [null, null, null];
            U.last = null;
            U.memAfter = true;
            U.zone = "lisiere";
            U.domAll = false;
            U.domOpen = null;
            setTab("domaine");
            openMemoire(() => { setTimeout(() => suivreReleve(), 200); });
          }
        }
      });
    }
    /* l’éveil du nouveau Semeur, puis la carte qui dit ce qu’il retrouve, puis les dons */
    function suivreReleve() {
      intro(() => accueil(() => { if (E.donsOffre().length) openDons(); }));
    }
    /* ------------------------------------------------------------ LES DONS DE LA RELÈVE
     * Trois dons à l’éveil du nouveau cycle, on en prend un. Fermer sans choisir ne bloque rien :
     * une pastille sur le Menu et une ligne en haut du Domaine permettent d’y revenir. */
    function donsHTML() {
      const ids = E.donsOffre();
      return '<div class="kicker">Ce que le Semeur d’avant a laissé</div><h2>Trois dons</h2>' +
        '<p class="small">Tu en prends un, pour ce cycle seulement. Le Semeur suivant en trouvera d’autres.</p>' +
        '<div class="dons">' + ids.map((id) => {
          const d = E.donDef(id);
          return '<div class="don"><span class="mic">' + d.ic + '</span><div class="grow"><div class="small"><b>' + esc(d.n) + '</b></div><div class="tiny muted">' + esc(d.d) + "</div></div>" +
            '<button class="btn small pri" data-m="don" data-id="' + id + '">Prendre</button></div>';
        }).join("") + "</div>" +
        '<div class="acts"><button class="btn" data-m="close">Plus tard</button></div>' +
        '<p class="tiny dim center">Tu peux y revenir depuis le Domaine ou la Mémoire des mains.</p>';
    }
    function openDons(onClose) {
      if (!E.donsOffre().length) { if (onClose) onClose(); return; }
      openModal({
        html: donsHTML(),
        onClose,
        on: {
          don: (b) => {
            const id = b.dataset.id;
            if (!E.donChoose(id)) return false;
            A.secret ? A.secret() : A.click(); vibe([10, 30, 10]);
            toast("Tu prends : " + esc(E.donDef(id).n) + ".", { key: "don" });
            save(); render(true);
          }
        }
      });
    }
    /* la ligne du Domaine tant qu’aucun don n’est pris */
    function donsRepere() {
      return E.donsOffre().length ? '<button class="dom-tip dom-don" data-dons>🎁 Le Semeur d’avant a laissé trois dons. Tu en prends un. <span>voir ▸</span></button>' : "";
    }
    /* après la relève obligatoire : un rappel en haut du Domaine, qui s’efface quand les Traces sont dépensées (ou au bout de quinze minutes) */
    const REVEIL_MIN = 15;
    function reveilRepere() {
      const st = S(), m = st.meta;
      if (!m.forcedDone || st.cycle !== 2 || !(m.traces > 0) || !E.achatsOuverts() || !m.reveilAt || Date.now() - m.reveilAt > REVEIL_MIN * 60000) return "";
      const rec = Object.keys(st.known).length;
      return '<button class="dom-tip dom-reveil" data-cycle>🌅 Un autre Semeur a pris le relais. Il a gardé tes ' + rec + " recette" + (rec > 1 ? "s" : "") +
        " et dispose de <b>" + fmt(m.traces) + " ✦ Traces</b> à dépenser dans la Mémoire des mains. <span>dépenser ▸</span></button>";
    }
    /* le don du cycle, dans la Mémoire des mains */
    function donCycleHTML() {
      const d = E.don();
      if (d) return '<div class="card memdon"><div class="tiny muted">Le don de ce cycle</div><div class="small"><span class="mic">' + d.ic + "</span> <b>" + esc(d.n) + '</b></div><div class="tiny muted">' + esc(d.d) + "</div></div>";
      if (E.donsOffre().length) return '<div class="card memdon"><div class="row between"><span class="small">Trois dons t’attendent.</span><button class="btn small pri" data-m="dons">Choisir</button></div></div>';
      return "";
    }
    /* ===== ARBRE DE LA MÉMOIRE (0.11) =====
     * Les mêmes améliorations, présentées en branches qui montent depuis le Semeur. Rien ne change des coûts
     * ni des effets : on touche un nœud, sa fiche s’affiche dessous, avec le même bouton d’achat que la liste. */
    const MEM_BRANCHES = [
      { id: "mains", n: "Les mains", ids: ["recolte", "oeil", "mains"] },
      { id: "terre", n: "La terre", ids: ["extr", "chemins"] },
      { id: "machines", n: "Les machines", ids: ["mach"] },
      { id: "depart", n: "Le départ", ids: ["paquetage", "raccourci", "veille"] }
    ];
    const memNode = (id) => D.MEMOIRE.find((x) => x.id === id) || (D.TRANSCENDANCE || []).find((x) => x.id === id) || null;
    function memArbreHTML() {
      const st = S(), m = st.meta, can = E.canReleve(), gain = E.releveGain();
      const branches = MEM_BRANCHES.map((b) => ({ n: b.n, ids: b.ids.filter((id) => D.MEMOIRE.some((x) => x.id === id)) }));
      if (D.TRANSCENDANCE && D.TRANSCENDANCE.length) branches.push({ n: "Les résonances", ids: D.TRANSCENDANCE.map((x) => x.id), inf: true });
      if (!memNode(U.memSel)) U.memSel = null;
      if (!U.memSel && E.achatsOuverts() && E.memLvl("recolte") === 0 && m.traces >= (E.memCost("recolte") || 0)) U.memSel = "recolte";
      const info = (id) => {
        const x = memNode(id), inf = (D.TRANSCENDANCE || []).some((t) => t.id === id);
        const l = inf ? E.transLvl(id) : E.memLvl(id), c = inf ? E.transCost(id) : E.memCost(id), max = !inf && c === undefined;
        return { x, inf, l, c, max, ok: !max && E.achatsOuverts() && m.traces >= c, soon: !max && can && m.traces + gain >= c && (!E.achatsOuverts() || m.traces < c) };
      };
      let h = '<div class="mtree" role="group" aria-label="Arbre de la Mémoire des mains">';
      for (const b of branches) {
        h += '<div class="mbr' + (b.inf ? " inf" : "") + '"><div class="mbn">' + esc(b.n) + "</div>";
        // le premier nœud est en bas, au plus près du tronc ; la colonne se lit de bas en haut
        h += '<div class="mchain">' + b.ids.map((id) => {
          const n = info(id), cur = U.memSel === id;
          const pips = n.inf ? "" : '<span class="mbar"><i style="width:' + Math.round((n.l / n.x.cost.length) * 100) + '%"></i></span>';
          return '<button class="mnode' + (n.l ? " on" : "") + (n.max ? " max" : "") + (n.ok ? " can" : "") + (n.soon ? " soon" : "") + (cur ? " sel" : "") + '" data-m="memsel" data-id="' + id + '" aria-label="' + esc(n.x.n) + (n.inf ? ", niveau " + n.l : ", niveau " + n.l + " sur " + n.x.cost.length) + '"><span class="mic">' + n.x.ic + "</span>" + pips + (n.inf ? '<span class="mpips">' + n.l + "</span>" : "") + "</button>";
        }).join("") + "</div></div>";
      }
      h += '</div><div class="mroot"><span>✦ ' + fmt(m.traces) + " Trace" + (m.traces > 1 ? "s" : "") + "</span></div>";
      const id = U.memSel;
      if (!id) return h + '<p class="tiny muted center">Sélectionne une amélioration pour consulter ses effets.</p>';
      const n = info(id), x = n.x;
      const now = memDesc(x, n.l).replace(/\.$/, ""), next = n.max ? "" : memDesc(x, n.l + 1).replace(/\.$/, "");
      const tip1 = id === "recolte" && E.achatsOuverts() && n.l === 0 ? ' <span class="tiny good">✦ Conseillé au 1er éveil</span>' : "";
      h += '<div class="mem sel"><span class="mic">' + x.ic + '</span><div class="grow"><div class="small"><b>' + esc(x.n) + '</b> <span class="tiny muted">' + (n.inf ? "Niveau " + n.l : n.l + "/" + x.cost.length) + "</span>" + tip1 + "</div>" +
        '<div class="tiny muted">' + (n.l ? esc(now) : "") + (n.l && !n.max ? " → " : "") + (n.max ? "" : esc(next)) + "</div>" +
        (x.next ? '<div class="tiny dim">S’applique au prochain Semeur, après la relève.</div>' : "") + "</div>" +
        (n.max ? '<span class="tiny muted">max</span>' : '<button class="btn small' + (n.ok ? " pri" : " nope") + (n.soon ? " soon" : "") + '" data-m="' + (n.inf ? "buytrans" : "buy") + '" data-id="' + id + '">' + fmt(n.c) + " ✦" + (n.soon ? '<small class="tiny">après la relève</small>' : "") + "</button>") + "</div>";
      return h;
    }
    /* ------------------------------------------------------------ MÉMOIRE DES MAINS
     * La relève, ce qu’elle rapporte, et les améliorations achetées avec les Traces. */
    const ACHATS_FERMES = "Les Traces se dépensent au réveil d’un nouveau Semeur : passe le relais, puis achète ici.";
    function memHTML() {
      const st = S(), m = st.meta, gain = E.releveGain(), can = E.canReleve();
      let h = '<div class="kicker">✦ La Mémoire des mains <button type="button" class="btn-aide mini" data-aide="releve" title="Comprendre la relève des Semeurs" aria-label="Comprendre la relève des Semeurs">?</button></div><h2>' + fmt(m.traces) + " Trace" + (m.traces > 1 ? "s" : "") + (can && gain ? ' <span class="small mgain">+' + gain + " à la relève</span>" : "") + "</h2>" +
        '<p class="small">Chaque passage franchi laisse des <b>Traces</b>. Quand tu passes le relais, un nouveau Semeur s’éveille : le monde repart de zéro, mais il garde ton Carnet et tout ce que tu as acheté ici.</p>';
      h += donCycleHTML();
      h += E.achatsOuverts()
        ? '<p class="small mem-achats">C’est le moment de dépenser tes Traces. Les achats se ferment quand tu touches « Terminé », ou au premier passage franchi. Les Traces non dépensées attendent la prochaine relève.</p>'
        : '<p class="small muted mem-achats">Les achats sont fermés en cours de partie. Ils rouvrent au réveil du prochain Semeur, après la relève. Tu peux consulter tes améliorations ici.</p>';
      const catchingUp = E.isCatchingUp && E.isCatchingUp();
      const catchUpNote = catchingUp && m.maxAge > 0
        ? '<p class="tiny good" style="margin:6px 0 0">✦ Mémoire fraîche active : façonnage et passages déjà connus accélérés jusqu’à l’Âge ' + m.maxAge + '.</p>'
        : "";
      h += '<div class="card memrel">' + (can
        ? '<div class="row between"><span class="small">Passer le relais maintenant</span><b class="mgain">+' + gain + " ✦</b></div>" + '<div class="row" style="margin-top:8px;align-items:center"><button class="btn' + (catchingUp ? "" : " pri") + ' grow" data-m="releve">Passer le relais ✦</button>' + releveBtnSigne() + "</div>"
        : '<p class="small muted">Franchis un passage vers une nouvelle terre (🚧) pour pouvoir passer le relais.</p>') +
        catchUpNote +
        (E.passPending().length ? '<p class="tiny muted">Un passage en cours rapporterait +' + E.passPending().map((z) => D.PASSAGES[z].tr).join(", +") + " ✦ de plus.</p>" : nextPassHTML()) + "</div>";
      h += cycleMirrorHTML();
      h += memArbreHTML();
      h += E.territoiresTransmissionHTML(esc);
      h += '<details class="mem-liste"><summary>Voir en liste</summary>';
      h += '<div class="mems">' + D.MEMOIRE.map((x) => {
        const l = E.memLvl(x.id), c = E.memCost(x.id), max = c === undefined;
        const now = memDesc(x, l), next = max ? "" : memDesc(x, l + 1);
        const soon = !max && can && m.traces + gain >= c && (!E.achatsOuverts() || m.traces < c); // possible juste après la relève
        const tip1 = x.id === "recolte" && E.achatsOuverts() && l === 0 ? ' <span class="tiny good">✦ Conseillé au 1er éveil</span>' : "";
        return '<div class="mem' + (l ? " on" : "") + '"><span class="mic">' + x.ic + '</span><div class="grow"><div class="small"><b>' + esc(x.n) + '</b> <span class="tiny muted">' + l + "/" + x.cost.length + "</span>" + tip1 + "</div>" +
          '<div class="tiny muted">' + (l ? esc(now) : "") + (l && !max ? " → " : "") + (max ? "" : esc(next)) + "</div>" +
          (x.next ? '<div class="tiny dim">S’applique au prochain Semeur, après la relève.</div>' : (max ? "" : (memPreview(x) ? '<div class="tiny dim">' + memPreview(x) + "</div>" : ""))) + "</div>" +
          (max ? '<span class="tiny muted">max</span>' : '<button class="btn small' + (E.achatsOuverts() && m.traces >= c ? " pri" : " nope") + (soon ? " soon" : "") + '" data-m="buy" data-id="' + x.id + '">' + c + " ✦" + (soon ? '<small class="tiny">après la relève</small>' : "") + "</button>") + "</div>";
      }).join("") + "</div>";

      if (D.TRANSCENDANCE && D.TRANSCENDANCE.length) {
        h += '<h3 class="sub" style="margin-top:16px">✨ Résonances Stellaires</h3>';
        h += '<p class="tiny muted">Paliers infinis à coût exponentiel. Leurs multiplicateurs traversent les relèves et décuplent la puissance du monde.</p>';
        h += '<div class="mems">' + D.TRANSCENDANCE.map((x) => {
          const l = E.transLvl(x.id), c = E.transCost(x.id);
          const curV = x.v(l), nextV = x.v(l + 1);
          const soon = can && m.traces + gain >= c && (!E.achatsOuverts() || m.traces < c);
          return '<div class="mem' + (l ? " on" : "") + '"><span class="mic">' + x.ic + '</span><div class="grow"><div class="small"><b>' + esc(x.n) + '</b> <span class="tiny muted">Niveau ' + l + "</span></div>" +
            '<div class="tiny muted">' + esc(x.d.replace("{v}", String(curV).replace(".", ",")).replace(/\.$/, "")) + ' → <b style="color:var(--good)">×' + String(nextV).replace(".", ",") + '</b></div></div>' +
            '<button class="btn small' + (E.achatsOuverts() && m.traces >= c ? " pri" : " nope") + (soon ? " soon" : "") + '" data-m="buytrans" data-id="' + x.id + '">' + fmt(c) + " ✦" + (soon ? '<small class="tiny">après la relève</small>' : "") + "</button></div>";
        }).join("") + "</div>";
      }

      h += "</details>";
      const ech = Object.values(m.endings || {}).reduce((a, b) => a + b, 0);
      // une case par fin atteinte, ou dont le Grand Œuvre est en vue : rien ne dit combien il y en a
      const endKeys = Object.keys(D.ENDINGS).filter((k) => (m.endings || {})[k] || Object.keys(D.PROJECTS).some((p) => D.PROJECTS[p].end === k && E.projVisible(p)));
      h += '<h3 class="sub" style="margin-top:16px">Dénouements &amp; Échos</h3>';
      h += '<p class="tiny muted">Chaque fin atteinte dépose un Écho immuable (+50 % récolte &amp; production) et éveille une <b>Règle d’Écho majeure</b> pour toujours.' + (ech ? ' Total : <b>+' + (ech * 50) + ' %</b> (' + ech + ' Écho' + (ech > 1 ? 's' : '') + ').' : '') + '</p>';
      h += '<div class="mems mem-endings">' + endKeys.map((k) => {
        const en = D.ENDINGS[k], got = (m.endings || {})[k] || 0, echoRule = D.ECHOS_FINS && D.ECHOS_FINS[k];
        if (got) {
          return '<div class="mem on"><span class="mic">' + en.ic + '</span><div class="grow"><div class="small"><b>' + esc(en.n) + '</b> <span class="tiny muted">×' + got + '</span></div><div class="tiny muted">Écho actif : +' + (got * 50) + ' %</div>' +
            (echoRule ? '<div class="tiny" style="color:var(--pri);margin-top:2px">✦ <b>' + esc(echoRule.n) + '</b> : ' + esc(echoRule.d) + '</div>' : '') +
            '</div><span class="tiny ok">✦ Atteint</span></div>';
        }
        const hasHint = E.hasEndingHint(k);
        if (hasHint) {
          return '<div class="mem on" style="border-left-color:var(--intu)"><span class="mic">✨</span><div class="grow"><div class="small"><b>Dénouement secret · Murmure céleste</b></div><div class="tiny" style="color:var(--text);font-style:italic">« ' + esc(en.hint || "Le destin attend.") + ' »</div></div><span class="tiny muted" style="color:var(--intu)">Murmure acquis</span></div>';
        }
        const hintCost = D.HINT_ENDING_COST || 75;
        const canHint = E.achatsOuverts() && m.traces >= hintCost;
        const soonHint = can && m.traces + gain >= hintCost && (!E.achatsOuverts() || m.traces < hintCost);
        return '<div class="mem dim" style="opacity:0.85"><span class="mic" style="filter:grayscale(1)">❔</span><div class="grow"><div class="small"><b>Dénouement inconnu</b></div><div class="tiny muted">Écouter un murmure du destin…</div></div><button class="btn small' + (canHint ? " pri" : " nope") + (soonHint ? " soon" : "") + '" data-m="buyhint" data-k="' + k + '">Murmure · ' + hintCost + ' ✦' + (soonHint ? '<small class="tiny">après la relève</small>' : "") + '</button></div>';
      }).join("") + "</div>";

      return h + '<div class="acts"><button class="btn" data-m="close">Fermer</button>' + (E.achatsOuverts() ? '<button class="btn pri" data-m="fin">Terminé : commencer le cycle</button>' : "") + "</div>";
    }
    U.memHTML = memHTML;
    /* deux colonnes de chiffres : ce qui est conservé, ce qui est remis à zéro */
    /* ce qui est conservé et ce qui repart de zéro, en listes (la relève libre et la relève obligatoire les montrent) */
    function releveListes(gain) {
      const st = S(), n = (k) => (k === "ext" ? Object.values(st.dom.ext).reduce((a, e) => a + Object.values(e.u).reduce((x, y) => x + y, 0), 0) : E.MACHINES.reduce((a, m) => a + Math.floor(st.inv[m] || 0), 0));
      const paid = Object.keys(st.pass).filter((z) => !st.pass[z].done && D.PASSAGES[z]);
      const m = st.meta;
      const rec = Object.keys(st.known).length;
      const pages = Object.keys((st.livre && st.livre.p) || {}).length;
      const frags = Object.keys(st.frags || {}).length;
      const signes = Object.values(st.signes || {}).filter((x) => x && x.lu).length;
      const memLv = D.MEMOIRE.reduce((a, x) => a + E.memLvl(x.id), 0);
      const ech = Object.values(m.endings || {}).reduce((a, b) => a + b, 0);
      const traces = m.traces + (gain || 0);
      const keep = [];
      if (rec) keep.push("<b>" + rec + "</b> recette" + (rec > 1 ? "s" : "") + " au Carnet");
      if (pages || frags) keep.push("Le Journal" + (pages ? " : <b>" + pages + "</b> page" + (pages > 1 ? "s" : "") : "") + (frags ? (pages ? ", " : " : ") + "<b>" + frags + "</b> morceau" + (frags > 1 ? "x" : "") + " d’histoire" : ""));
      if (signes) keep.push("<b>" + signes + "</b> signe" + (signes > 1 ? "s" : "") + " compris");
      if (memLv) keep.push("<b>" + memLv + "</b> niveau" + (memLv > 1 ? "x" : "") + " de la Mémoire des mains");
      if (ech) keep.push("<b>" + ech + "</b> Écho" + (ech > 1 ? "s" : "") + " : +" + ech * 50 + " % de récolte et de production");
      const reset = ["Ta Réserve"];
      if (n("ext")) reset.push("Tes <b>" + n("ext") + "</b> extracteur" + (n("ext") > 1 ? "s" : "") + " : ils restent en ruine, à réparer pour une fraction de leur coût");
      if (n("mach")) reset.push("Tes <b>" + n("mach") + "</b> machine" + (n("mach") > 1 ? "s" : "") + " : elles restent aussi en ruine");
      reset.push("Tes terres : tu repars de la Lisière");
      if (paid.length) reset.push("Le passage vers " + paid.map((z) => esc(zoneName(z))).join(" et ") + ", payé à " + Math.floor((E.passInfo(paid[0]).frac || 0) * 100) + " %");
      if (st.hand.q.length) reset.push("Tes <b>" + st.hand.q.length + "</b> commande" + (st.hand.q.length > 1 ? "s" : "") + " en cours");
      return { keep, reset, traces, rec };
    }
    const listeHTML = (cls, items) => '<ul class="rel-list ' + cls + '">' + items.map((x) => "<li>" + x + "</li>").join("") + "</ul>";
    /* deux colonnes de chiffres : ce qui est conservé, ce qui est remis à zéro */
    function leftHTML(gain, ecus, ecusTr) {
      const { keep, reset, traces, rec } = releveListes(gain);
      if (traces > 0) keep.splice(rec ? 1 : 0, 0, "<b>" + fmt(traces) + " ✦</b> Traces disponibles à dépenser");
      return '<div class="rel-cols"><div class="rel-h">Acquis conservés</div>' + listeHTML("rel-keep", keep) +
        '<div class="rel-h">Remis à zéro</div>' + listeHTML("rel-reset", reset) + "</div>" +
        '<p class="rel-gain">La relève donne <b>+' + fmt(gain || 0) + " ✦</b> Trace" + ((gain || 0) > 1 ? "s" : "") + (ecusTr ? " (" + fmt(ecus) + " écus convertis en " + ecusTr + " ✦)" : "") + " (à dépenser dans la Mémoire des mains au réveil : aucun achat n’est fait d’avance).</p>";
    }
    /* la fenêtre de la première relève : ce qu’on gagne, ce qu’on garde, ce qui repart de zéro, pourquoi. Le langage d’une interface de jeu, sans récit. */
    function forcedReleveHTML() {
      const gift = (D.PARCOURS && D.PARCOURS.gift) || 3, pass = E.releveGain(), { keep, reset } = releveListes(0);
      const total = gift + pass;
      return '<div class="kicker">Relève</div><h2>Fin du premier cycle</h2>' +
        '<p class="small">Tu as franchi ton premier passage. C’est le moment de la relève : le monde recommence de zéro, mais tu gardes tes recettes.</p>' +
        '<div class="rel-cols"><div class="rel-h">Tu gagnes</div>' +
        listeHTML("rel-gagne", ["<b>" + fmt(total) + " ✦ Traces</b> (" + gift + " offertes" + (pass ? ", " + pass + " pour le passage" : "") + ")", "À dépenser tout de suite dans la Mémoire des mains : ce sont des améliorations permanentes"]) +
        '<div class="rel-h">Tu gardes</div>' + listeHTML("rel-keep", keep) +
        '<div class="rel-h">Repart de zéro</div>' + listeHTML("rel-reset", reset) + "</div>" +
        '<p class="small">À chaque relève, tu repars plus vite : tu connais déjà tes recettes, et la Mémoire des mains garde tes améliorations.</p>' +
        E.territoiresTransmissionHTML(esc) +
        releveExtrasHTML() +
        '<div class="acts"><button class="btn pri wide" data-m="go">Passer le relais</button>' + releveBtnSigne() + "</div>";
    }
    /* la carte de l’éveil : trois faits, un bouton */
    function accueil(onClose) {
      const st = S(), m = st.meta, rec = Object.keys(st.known).length;
      const rows = [];
      if (rec) rows.push("Le Carnet garde tes <b>" + rec + "</b> recettes.");
      if (Object.keys(E.ruins()).length) rows.push("Des ruines peuvent être réparées pour une fraction de leur coût de construction.");
      if (m.traces > 0) rows.push("Tes <b>" + fmt(m.traces) + " ✦</b> Traces sont dans la Mémoire des mains.");
      if (!rows.length) { if (onClose) onClose(); return; }
      openModal({
        html: '<div class="kicker">Semeur ' + (st.cycle + 6) + "</div><h2>Tu te réveilles à la Lisière</h2>" +
          rows.map((x) => '<p class="small">' + x + "</p>").join("") +
          '<div class="acts"><button class="btn pri wide" data-m="close">Commencer</button></div>',
        onClose
      });
    }
    /* l’effet d’un niveau, en toutes lettres : {v} la valeur, {p} la chance de pièce en plus (Mains sûres) */
    function memDesc(x, l) {
      return x.d.replace("{v}", String(x.v(l)).replace(".", ",")).replace("{p}", x.bonus ? Math.round(x.bonus(l) * 100) + " %" : "");
    }
    /* un aperçu concret de la prochaine amélioration */
    function memPreview(x) {
      const l = E.memLvl(x.id), a = x.v(l), b = x.v(l + 1);
      if (b === undefined || typeof a !== "number") return "";
      if (x.id === "extr") { const r = E.production().reduce((s, p) => s + (I[p.id] && I[p.id].t === "res" ? p.in : 0), 0); return r > 0 ? "Tes extracteurs : " + perMin(r) + " → " + perMin(r * b / a) : ""; }
      if (x.id === "recolte") return "Un appui sur le bois : " + fmtNum(E.tapYieldOf("bois") || a) + " → " + fmtNum((E.tapYieldOf("bois") || a) * b / a);
      if (x.id === "chemins") { const z = D.ZONES.map((y) => y.id).find((id) => D.PASSAGES[id] && !E.zoneOpen(id)); if (!z) return ""; const c = E.passCost(z), k = Object.keys(c)[0]; return esc(D.PASSAGES[z].n) + " : " + fmt(c[k]) + " → " + fmt(Math.ceil(c[k] * b / a)) + " " + esc(I[k].n.toLowerCase()); }
      if (x.id === "mains") return "100 fabrications à la main : environ " + Math.round(100 * (1 + x.bonus(l + 1))) + " pièces" + (l ? " (" + Math.round(100 * (1 + x.bonus(l))) + " aujourd’hui)" : "") + ", " + Math.round((1 - b / a) * 100) + " % plus vite.";
      if (x.id === "mach") { const n = E.MACHINES.reduce((acc, m) => acc + Math.floor(S().inv[m] || 0), 0); return n ? "Tes " + n + " machine" + (n > 1 ? "s" : "") + " : +" + Math.round((b / a - 1) * 100) + " %" : ""; }
      return "";
    }
    /* le prochain passage : ce qu’il rapporte, et l’objet qui le rend possible */
    function nextPassHTML() {
      const z = D.ZONES.map((x) => x.id).find((id) => D.PASSAGES[id] && !E.zoneOpen(id) && !(S().pass[id] && S().pass[id].done));
      if (!z) return "";
      const P = D.PASSAGES[z], req = E.ZONES[z].req, ready = S().pass[z];
      return '<p class="tiny muted">Prochain passage : <b>' + esc(P.n) + "</b> vers " + esc(zoneName(z)) + " (+" + P.tr + " ✦)" + (ready ? "." : I[req] ? ", après " + esc(I[req].n) + "." : ".") + "</p>";
    }
    function openMemoire(onClose) {
      const o = {
        html: memHTML(),
        onClose,
        on: {
          memsel: (b) => { U.memSel = b.dataset.id; A.click(); swapModal(Object.assign(o, { html: memHTML() })); return true; },
          buy: (b) => {
            if (E.memBuy(b.dataset.id)) { A.secret ? A.secret() : A.click(); vibe([10, 30, 10]); save(); }
            else if (!E.achatsOuverts()) { A.fail(0); toast(ACHATS_FERMES, { key: "mem" }); }
            else {
              A.fail(0);
              const c = E.memCost(b.dataset.id), m = S().meta;
              toast(c !== undefined && E.canReleve() && m.traces + E.releveGain() >= c ? "Tu pourras l’acheter juste après la relève, avec les Traces qu’elle rapporte." : "Il te faut plus de Traces : franchis des passages, puis passe le relais.", { key: "mem" });
            }
            swapModal(Object.assign(o, { html: memHTML() }));
            return true;
          },
          buytrans: (b) => {
            if (E.transBuy(b.dataset.id)) { A.secret ? A.secret() : A.click(); vibe([15, 40, 15]); save(); }
            else if (!E.achatsOuverts()) { A.fail(0); toast(ACHATS_FERMES, { key: "trans" }); }
            else {
              A.fail(0);
              const c = E.transCost(b.dataset.id), m = S().meta;
              toast(E.canReleve() && m.traces + E.releveGain() >= c ? "Tu pourras franchir ce palier stellaire juste après la relève." : "Il te faut plus de Traces pour franchir ce palier stellaire.", { key: "trans" });
            }
            swapModal(Object.assign(o, { html: memHTML() }));
            return true;
          },
          buyhint: (b) => {
            if (E.buyEndingHint(b.dataset.k)) { A.secret ? A.secret() : A.click(); vibe([20, 50, 20]); save(); toast("✨ Un murmure du destin résonne dans ta mémoire…", { key: "hint" }); }
            else if (!E.achatsOuverts()) { A.fail(0); toast(ACHATS_FERMES, { key: "hint" }); }
            else {
              A.fail(0);
              const cost = D.HINT_ENDING_COST || 75, m = S().meta;
              toast(E.canReleve() && m.traces + E.releveGain() >= cost ? "Tu pourras écouter ce murmure juste après la relève." : "Il te faut 75 Traces pour écouter ce murmure.", { key: "hint" });
            }
            swapModal(Object.assign(o, { html: memHTML() }));
            return true;
          },
          fin: (btn) => {
            const m = S().meta;
            const zeroBought = Object.values(m.mem || {}).every((v) => !v);
            const canAfford = D.MEMOIRE.some((x) => { const c = E.memCost(x.id); return c !== undefined && m.traces >= c; });
            if (E.achatsOuverts() && zeroBought && canAfford && !(btn && btn.dataset && btn.dataset.confirm === "1")) {
              if (btn && btn.dataset) btn.dataset.confirm = "1";
              toast("Tu peux déjà acheter une amélioration (ex. Mains calleuses). Touche à nouveau « Terminé » si tu préfères garder tes Traces.", { key: "mem_fin" });
              return true;
            }
            E.fermerAchats(); save(); return false;
          },
          dons: () => { setTimeout(() => openDons(), 80); },
          releve: () => { setTimeout(confirmCycle, 80); }
        }
      };
      openModal(o);
    }

    /* la fenêtre de relève : la boîte à musique, le signe près du bouton, et la main qui,
     * si l’on ne touche à rien pendant trente secondes, va graver un peu plus le septième trait */
    const traitT = { id: null, t0: 0, off: null };
    function releveExtrasHTML() {
      const RL = E.RECIT.releve || {};
      if (E.isLibere && E.isLibere()) return "";
      return '<p class="small muted serif"><i>' + esc(RL.musique || "") + "</i></p>" + '<p class="lore" id="traitLine"></p>';
    }
    function releveBtnSigne() {
      const sg = uiSigne("releve", "La relève");
      return sg ? '<span class="releve-signe" style="margin-left:8px;align-self:center">' + sg + "</span>" : "";
    }
    function armTrait() {
      disarmTrait();
      if ((E.isLibere && E.isLibere()) || !E.graverTrait) return;
      const RL = E.RECIT.releve || {};
      const reset = () => { traitT.t0 = Date.now(); };
      traitT.t0 = Date.now();
      document.addEventListener("pointerdown", reset, true);
      document.addEventListener("keydown", reset, true);
      traitT.off = () => { document.removeEventListener("pointerdown", reset, true); document.removeEventListener("keydown", reset, true); };
      let last = Date.now();
      traitT.id = setInterval(() => {
        const t = Date.now();
        if (document.hidden) traitT.t0 += t - last; // le minuteur s’arrête si la page est cachée
        last = t;
        if (t - traitT.t0 < 30000) return;
        disarmTrait();
        const n = E.graverTrait();
        const el = $("#traitLine");
        if (n && el) {
          el.innerHTML = '<span style="opacity:0;animation:fadeup 1.6s forwards">' + esc(RL.trait || "") + (n >= 3 ? " " + esc(RL.traitFini || "") : "") + "</span>";
          save();
        }
      }, 500);
    }
    function disarmTrait() {
      if (traitT.id) clearInterval(traitT.id);
      traitT.id = null;
      if (traitT.off) traitT.off();
      traitT.off = null;
    }

    function openForcedReleve() {
      openModal({
        persistent: true,
        html: forcedReleveHTML(),
        onOpen: armTrait,
        onClose: disarmTrait,
        on: {
          go: () => {
            pushBackup(E.serialize(), "Avant la relève (Semeur 7)");
            E.forcedReleve();
            save();
            U.slots = [null, null, null];
            U.last = null;
            U.zone = "lisiere";
            U.domAll = false;
            U.domOpen = null;
            setTab("domaine");
            openMemoire(() => { setTimeout(() => suivreReleve(), 200); });
          }
        }
      });
    }


    function memChip() {
      const m = S().meta, b = $("#memBtn"), can = E.canReleve(), gain = E.releveGain();
      const show = can || m.traces > 0 || m.tracesTotal > 0;
      b.classList.toggle("hidden", !show);
      if (!show) return;
      const txt = can && gain ? "+" + gain : fmt(m.traces);
      const n = $("#memN");
      if (n.textContent !== txt) n.textContent = txt;

      // Calcul si un achat réel est possible (maintenant ou après la relève)
      const pot = E.achatsOuverts() ? m.traces : can && gain ? m.traces + gain : 0;
      const canBuyBase = D.MEMOIRE.some((x) => { const c = E.memCost(x.id); return c !== undefined && pot >= c; });
      const canBuyTrans = (D.TRANSCENDANCE || []).some((x) => pot >= E.transCost(x.id));
      const canBuyHint = Object.keys(D.ENDINGS || {}).some((k) => !((m.endings || {})[k]) && !E.hasEndingHint(k) && pot >= (D.HINT_ENDING_COST || 75) && Object.keys(D.PROJECTS).some((p) => D.PROJECTS[p].end === k && E.projVisible(p)));
      const hasPurchase = canBuyBase || canBuyTrans || canBuyHint;

      const suggest = E.achatsOuverts()
        ? m.traces > 0
        : Boolean(can && gain > 0 && E.shouldSuggestReleve && E.shouldSuggestReleve());
      b.classList.toggle("ready", Boolean(hasPurchase && suggest));
    }

    return { intro, openStillnessScene, showEnding, confirmCycle, donsRepere, reveilRepere, openDons, openMemoire, openForcedReleve, memChip };
  }

  window.EclatMemoire = { create };
})();
