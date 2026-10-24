/* ÉCLAT — le Journal et le Cosmos.
 * Les onglets du Journal (fragments, Livre, Signes, Questions, secrets, flûte,
 * curiosités, Fins, mémoire), la fiche d’un signe, le Cosmos (ciel, Figures,
 * ARCHE, Grands Œuvres), le terminal, l’écoute et la mise à feu. */
(function () {
  "use strict";

  function create(api) {
    const {
      E, A, D, U, Sky, esc, fmt, fmtTime, icon, iconize, zoneName, toast, vibe, openModal, swapModal, render, save,
      subTabs, tabAvailable, stampTxt, stampHTML, recitInline, recitHTML, loreHTML, lectureHTML
    } = api;
    const S = () => E.state;
    const I = D.ITEMS;
    const $ = (s, r) => (r || document).querySelector(s);

    /* ------------------------------------------------------------- SIGNES (modale) */
    function openSigneModal(id) {
      const rec = E.RECIT || D.RECIT || {};
      const sDef = rec.signes && rec.signes[id];
      if (!sDef) return;
      const st = S();
      st.signes = st.signes || {};
      st.signes[id] = st.signes[id] || { vu: {} };
      const stSigne = st.signes[id];

      const parentModal = (U.mcur && U.mcur.signeId !== id) ? U.mcur : null;

      const renderContent = (feedbackText, feedbackCls) => {
        const places = (stSigne && stSigne.vu && typeof stSigne.vu === "object") ? Object.keys(stSigne.vu) : [];
        let h = '<div class="kicker">Écriture des Anciens</div>';
        h += '<h2>' + (stSigne.lu ? "Signe déchiffré" : "Signe inconnu") + '</h2>';
        h += '<div class="signe-hero">' + (window.signeSVG ? window.signeSVG(sDef.h, 72) : "") + '</div>';

        if (stSigne.lu) {
          h += '<div class="signe-mot-decouvert">' + esc(sDef.mot) + '</div>';
        }

        if (places.length > 0) {
          h += '<div class="signe-lieux"><span class="dim">Aperçu à :</span> ' + places.map(esc).join(", ") + '</div>';
        } else {
          h += '<div class="signe-lieux dim">Pas encore aperçu ailleurs.</div>';
        }

        if (stSigne.lu) {
          h += '<p class="small muted center">Tu as compris ce signe.</p>';
          h += '<div class="acts"><button class="btn pri" data-m="close">Refermer</button></div>';
        } else if (sDef.cond && !E.cond(sDef.cond)) {
          h += '<p class="small muted center">Quelque chose t’échappe encore pour percer ce signe.</p>';
          h += '<div class="acts"><button class="btn pri" data-m="close">Refermer</button></div>';
        } else {
          h += '<form id="signeForm" class="signe-form">' +
            '<div class="signe-input-row">' +
            '<input type="text" id="signeInput" class="input" placeholder="Ce qu’il veut dire…" autocomplete="off" autocapitalize="off" spellcheck="false" />' +
            '<button type="submit" id="signeBtn" class="btn pri">Proposer</button>' +
            '</div>' +
            '<div id="signeFeedback" class="signe-feedback ' + (feedbackCls || "") + '" aria-live="polite">' + (feedbackText ? esc(feedbackText) : "") + '</div>' +
            '</form>' +
            '<div class="acts"><button class="btn" data-m="close">Refermer</button></div>';
        }
        return h;
      };

      const bindEvents = (box) => {
        const form = box.querySelector("#signeForm");
        if (!form) return;
        const input = box.querySelector("#signeInput");
        const fb = box.querySelector("#signeFeedback");
        const btn = box.querySelector("#signeBtn");
        if (input) setTimeout(() => { try { input.focus(); } catch (e) {} }, 100);

        const submitAttempt = () => {
          const val = (input.value || "").trim();
          if (!val) return;
          const res = E.essaiSigne(id, val);
          if (res.delai) {
            A.err();
            vibe(40);
            fb.className = "signe-feedback delai";
            fb.textContent = "Attends " + res.left + " s avant de retenter.";
            return;
          }
          if (res.ok) {
            A.secret();
            save();
            render(true);
            box.innerHTML = renderContent();
            iconize(box);
            return;
          }
          if (res.proche) {
            A.err();
            vibe(40);
            fb.className = "signe-feedback proche";
            fb.textContent = "« Presque. »";
            input.select();
            return;
          }
          A.err();
          vibe(40);
          fb.className = "signe-feedback non";
          fb.textContent = "« Non. »";
          input.select();
        };

        form.addEventListener("submit", (ev) => {
          ev.preventDefault();
          submitAttempt();
        });
        if (btn) {
          btn.addEventListener("click", (ev) => {
            ev.preventDefault();
            submitAttempt();
          });
        }
      };

      const modalObj = {
        signeId: id,
        cls: "modal-signe",
        html: renderContent(),
        onOpen: bindEvents,
        onClose: () => {
          if (parentModal) {
            setTimeout(() => {
              if (parentModal.refresh) parentModal.html = parentModal.refresh();
              openModal(parentModal);
            }, 80);
          }
        }
      };

      if (parentModal) {
        swapModal(modalObj);
      } else {
        openModal(modalObj);
      }
    }

    /* ------------------------------------------------------------ JOURNAL */
    function viewJournal() {
      const st = S();
      const tabs = [["fragments", "Fragments"]];
      const livreNew = E.hasNewLivre ? E.hasNewLivre() : false;
      if (E.hasLivre && E.hasLivre()) tabs.push(["livre", "Livre" + (livreNew ? " •" : "")]);
      if (E.hasQuestions && E.hasQuestions()) tabs.push(["questions", "Questions"]);
      if (E.hasSignes && E.hasSignes()) tabs.push(["signes", "Signes"]);
      tabs.push(["secrets", "Secrets"]);
      if (E.has("flute")) tabs.push(["flute", "Flûte"]);
      if (E.curiosCount && E.curiosCount() > 0) tabs.push(["curios", "Clins d’œil"]);
      tabs.push(["fins", "Fins"], ["stats", "Mémoire"]);
      if (!tabs.find((t) => t[0] === U.journalTab)) U.journalTab = "fragments";
      let h = (tabAvailable("cosmos") ? subTabs("journal", "cosmos", "Journal", "Cosmos") : '<h2 class="title">Journal</h2>') + '<div class="filters">' + tabs.map(([k, n]) => '<button data-jt="' + k + '" class="' + (U.journalTab === k ? "on" : "") + '">' + n + "</button>").join("") + "</div>";
      if (U.journalTab === "fragments") {
        const ids = E.visibleFrags ? E.visibleFrags() : Object.keys(D.FRAGS);
        const n = ids.filter((f) => st.frags[f]).length;
        h += '<p class="small muted">' + n + "/" + ids.length + " fragments de l’histoire retrouvés.</p>";
        const miss = {};
        ids.forEach((f) => {
          const F = D.FRAGS[f];
          if (!F) return;
          if (st.frags[f]) h += '<button class="frag" data-frag="' + f + '"><span class="fi">📜</span><div class="grow"><b>' + esc(F.n || F.titre) + '</b><div class="tiny muted">' + esc(fragPlace(F.z)) + "</div>" + stampHTML("f:" + f) + "</div></button>";
          else { const k = unkPlace(F.z); miss[k] = (miss[k] || 0) + 1; }
        });
        if (Object.keys(miss).length) {
          h += '<h3 class="sub">Encore à découvrir</h3>';
          for (const k in miss) h += '<div class="frag unk"><span class="fi">❔</span><div class="grow">' + esc(k) + '<div class="tiny muted">' + miss[k] + " fragment" + (miss[k] > 1 ? "s" : "") + "</div></div></div>";
        }
      } else if (U.journalTab === "livre") {
        const cases = E.livre ? E.livre() : [];
        const foundCount = cases.filter((c) => c.page).length;
        h += '<p class="small muted">' + foundCount + "/32 pages retrouvées dans le Livre des Semeurs.</p>";
        h += '<div class="livre-grid">';
        cases.forEach((c) => {
          if (c.page) {
            h += '<button class="livre-cell found' + (c.nouveau ? ' has-new' : '') + '" data-page="' + esc(c.id) + '">';
            h += '<span class="livre-num">' + c.n + '</span>';
            if (c.nouveau) h += '<span class="livre-dot">●</span>';
            h += '<span class="livre-titre">' + esc(c.page.titre || ("Page " + c.n)) + '</span>';
            h += stampHTML("p:" + c.id, true);
            h += '</button>';
          } else {
            h += '<div class="livre-cell empty"><span class="livre-num">' + c.n + '</span></div>';
          }
        });
        h += '</div>';
        const fs = E.feuillets ? E.feuillets() : [];
        if (fs.length) {
          h += '<h3 class="sub">Feuilles volantes</h3>';
          fs.forEach((x) => { h += '<div class="card feuillet' + (x.nouveau ? " has-new" : "") + '"><div class="lore note-main" style="font-family:Caveat,cursive;font-size:19px">' + recitHTML(x.t, "Une feuille volante") + '</div><div class="tiny muted" style="text-align:right">' + recitInline(x.sig, "Une feuille volante") + "</div>" + stampHTML("l:" + x.id, true) + "</div>"; });
          if (fs.some((x) => x.nouveau) && E.readFeuillets) setTimeout(() => E.readFeuillets(), 1500);
        }
      } else if (U.journalTab === "questions") {
        const list = E.questions ? E.questions() : [];
        const sorted = list.slice().sort((a, b) => (a.resolu === b.resolu ? 0 : a.resolu ? 1 : -1));
        if (!sorted.length) {
          h += '<p class="small muted center" style="padding:20px 0">Aucune question pour l’instant.</p>';
        } else {
          h += '<div class="questions-list">';
          sorted.forEach((q) => {
            const isResolu = q.resolu;
            h += '<div class="card question-card' + (isResolu ? ' resolu' : '') + '">';
            h += '<div class="question-title' + (isResolu ? ' strikethrough' : '') + '">' + esc(q.titre) + '</div>';
            const qs = stampTxt("q:" + q.id), qr = isResolu ? stampTxt("qr:" + q.id, true) : "";
            if (qs || qr) h += '<div class="stamp">' + esc(qs ? "Posée : " + qs : "") + (qs && qr ? " · " : "") + esc(qr ? "résolue : " + qr : "") + "</div>";
            if (q.aides && q.aides.length) {
              h += '<div class="question-aides">';
              q.aides.forEach((aide, idx) => {
                h += '<div class="question-aide"><span class="aide-num">Piste ' + (idx + 1) + ' :</span> ' + recitHTML(aide, q.titre || "Question") + '</div>';
              });
              h += '</div>';
            }
            if (!isResolu && q.cost !== null) {
              const canAfford = (st.intu || 0) >= q.cost;
              const whyText = canAfford ? "" : " (manque d’Intuition)";
              h += '<div class="acts" style="margin-top:8px">';
              h += '<button class="btn' + (canAfford ? ' pri' : ' dis') + '" data-askhelp="' + esc(q.id) + '"' + (canAfford ? '' : ' disabled') + '>';
              h += '💭 Réfléchir : ' + q.cost + ' ✨' + (canAfford ? '' : ' <span class="tiny muted">' + whyText + '</span>');
              h += '</button></div>';
            }
            h += '</div>';
          });
          h += '</div>';
        }
      } else if (U.journalTab === "signes") {
        const seen = E.seenSignes ? E.seenSignes() : [];
        const compris = seen.filter((s) => s.lu).length;
        h += '<p class="small muted">' + compris + "/" + seen.length + " signes compris.</p>";
        if (!seen.length) {
          h += '<p class="small muted center" style="padding:20px 0">Aucun signe aperçu pour l’instant.</p>';
        } else {
          h += '<div class="signes-grid">';
          seen.forEach((s) => {
            const count = s.count || 0;
            const countTxt = count === 1 ? "1 endroit" : count + " endroits";
            h += '<button class="signe-card' + (s.lu ? ' lu' : '') + '" data-s="' + esc(s.id) + '">' +
              (s.lu
                ? '<div class="signe-card-mot">' + esc(s.def.mot) + '</div>'
                : '<div class="signe-card-dessin">' + (window.signeSVG ? window.signeSVG(s.def.h, 36) : '') + '</div>') +
              '<div class="signe-card-lieux">' + countTxt + '</div>' + (s.lu ? stampHTML("s:" + s.id, true) : "") +
              '</button>';
          });
          h += '</div>';
        }
      } else if (U.journalTab === "secrets") {
        const n = D.SECRETS.filter((s) => st.secrets[s.id]).length;
        h += '<p class="small muted">' + n + "/" + D.SECRETS.length + " secrets découverts. Relis les fragments : certains cachent un code.</p><div class=\"secret-grid\">";
        const allM = (typeof E.allMelodies === "function") ? E.allMelodies() : D.MELODIES;
        D.SECRETS.forEach((s) => {
          const found = st.secrets[s.id];
          const name = s.n || (I[s.id] ? I[s.id].n : allM[s.id] ? allM[s.id].n : s.id);
          h += '<div class="sec' + (found ? "" : " unk") + '"><div class="k">' + s.k + "</div>" + (found ? esc(name) : "???") + "</div>";
        });
        h += "</div>";
      } else if (U.journalTab === "flute") {
        h += '<div class="card"><p class="small muted center">Un os creux percé de cinq trous. Touche-les pour jouer. Une pause de quelques secondes, et l’air recommence à zéro.</p><div class="flute-body"><div class="flute">' +
          [1, 2, 3, 4, 5].map((n) => '<button class="hole" data-note="' + n + '">' + n + "</button>").join("") + '</div></div><div class="notes" id="notes">' + st.notes.join(" · ") + "</div></div>";
        const known = (typeof E.melodies === "function") ? E.melodies() : Object.keys(D.MELODIES).filter((m) => st.secrets[m]).map((m) => ({ id: m, n: D.MELODIES[m].n, notes: D.MELODIES[m].notes }));
        if (known.length) {
          h += '<h3 class="sub">Mélodies connues</h3><p class="tiny muted">Touche une mélodie pour la rejouer sur ta flûte.</p>';
          known.forEach((m) => { h += '<button class="frag" data-play="' + m.id + '"><span class="fi">🎶</span><div class="grow"><b>' + esc(m.n) + '</b><div class="tiny muted">' + (m.notes ? m.notes.join(" · ") : "Rejoue-le une fois pour retrouver ses notes.") + "</div></div></button>"; });
        } else h += '<p class="small muted">Tu ne connais encore aucune mélodie. Le monde t’en a peut-être déjà appris une sans que tu y fasses attention.</p>';
      } else if (U.journalTab === "curios") {
        h += '<p class="small muted">Des clins d’œil trouvés au fil de tes voyages. Ils ne servent à rien.</p><div class="curio-grid">';
        let rest = false;
        for (const id in D.EASTER) {
          const item = D.EASTER[id];
          if (E.hasCurio && E.hasCurio(id)) h += '<div class="frag"><span class="fi">' + (item.ic || "✨") + '</span><div class="grow"><b>' + esc(item.n) + '</b><div class="tiny muted">' + esc(item.desc) + '</div></div></div>';
          else rest = true;
        }
        if (rest) h += '<div class="frag unk"><span class="fi">❔</span><div class="grow"><b>?</b><div class="tiny muted">Il y en a peut-être d’autres.</div></div></div>';
        h += '</div>';
      } else if (U.journalTab === "fins") {
        // le prestige, dit simplement : ce qu’on garde, ce qu’on gagne
        const ech = Object.values(st.meta.endings).reduce((a, b) => a + b, 0);
        h += '<div class="card cyc"><b>✦ Relève, Traces et Échos</b><p class="small">Dès qu’un passage vers une nouvelle terre est franchi, tu peux passer le relais : un nouveau Semeur s’éveille. ' +
          "Le monde, tes ressources, tes machines et les terres repartent de zéro, mais tu gardes ton Carnet, tes fragments, tes secrets et la <b>Mémoire des mains</b>, achetée avec les <b>Traces</b> que laissent les passages.</p>" +
          '<p class="small">Chaque fin atteinte laisse en plus un <b>Écho</b>, pour toujours : +50 % de récolte et de production par Écho, dès la relève suivante.</p>' +
          '<div class="stat"><span class="muted">Ce Semeur</span><b>' + (st.cycle + 6) + "e · " + st.echoes + " Écho" + (st.echoes > 1 ? "s" : "") + (st.echoes ? " (+" + st.echoes * 50 + " %)" : "") + "</b></div>" +
          '<div class="stat"><span class="muted">À la relève</span><b>+' + E.releveGain() + " ✦ · " + ech + " Écho" + (ech > 1 ? "s" : "") + "</b></div>" +
          '<button class="btn small pri" data-cycle style="margin-top:8px">✦ Mémoire des mains</button></div>';
        let reste = false;
        Object.keys(D.ENDINGS).forEach((k) => {
          const en = D.ENDINGS[k], got = st.meta.endings[k];
          if (got) h += '<div class="frag"><span class="fi">' + en.ic + '</span><div class="grow"><b>' + esc(en.n) + '</b><div class="tiny muted">Atteinte ' + got + " fois</div></div></div>";
          else reste = true;
        });
        if (reste) h += '<div class="frag unk"><span class="fi">❔</span><div class="grow"><b>???</b><div class="tiny muted">Une fin encore inconnue.</div></div></div>';
      } else {
        const evs = Object.keys(D.EVENTS).filter((id) => st.made[id] > 0);
        h += '<div class="card">' + [["Temps de jeu", fmtTime(st.stats.play)], ["Récoltes à la main", fmt(st.stats.taps)], ["Fabrications", fmt(st.stats.crafts)],
          ["Tentatives à l’Atelier", fmt(st.stats.tries)], ["Recettes connues", Object.keys(st.known).length], ["Semeur", st.cycle + 6 + "e"]].map(([a, b]) => '<div class="stat"><span class="muted">' + a + "</span><b>" + b + "</b></div>").join("") + "</div>";
        // donner un nom au Semeur de cet éveil (un essai par éveil)
        const NM = (E.RECIT && E.RECIT.nommer) || {};
        const nom = E.nomDuCycle ? E.nomDuCycle() : null;
        h += '<div class="card"><div class="stat"><span class="muted">Semeur ' + (st.cycle + 6) + "</span><b>" + (nom ? esc(nom) : "—") + "</b></div>" +
          (E.peutNommer && E.peutNommer() ? '<form class="term-in" id="nomForm" autocomplete="off" style="margin-top:8px"><input id="nomIn" maxlength="24" placeholder="' + esc(NM.invite || "") + '" autocapitalize="words" spellcheck="false"><button class="btn" type="submit">⏎</button></form>' : "") + "</div>";
        if (evs.length) {
          h += '<h3 class="sub">Réminiscences</h3>';
          evs.forEach((id) => { h += '<div class="card small serif" style="font-size:15px">' + icon(id, "sm") + " " + esc(D.EVENTS[id]) + "</div>"; });
        }
      }
      return h;
    }
    function fragPlace(z) { return z === "terminal" ? "Terminal d’ARCHE" : z === "cosmos" ? "Le signal de Kher" : zoneName(z); }
    function unkPlace(z) {
      if (z === "terminal" || z === "cosmos") return "Quelque part, hors du monde";
      if (E.ZONES[z] && E.ZONES[z].secret) return "Un lieu caché";
      return E.zoneOpen(z) ? zoneName(z) : "Une terre que tu n’as pas encore foulée";
    }

    /* ===== FIGURES DU COSMOS (début) ===== */
    const FIG_TXT = {
      intro: "Chaque fragment du Journal est une étoile. Une étoile pâle est un lieu repéré, pas encore exploré.",
      signes: "Un signe compris s’allume et donne son mot. Ceux que tu as vus au même endroit se tiennent près l’un de l’autre.",
      vide: "Le ciel est vide pour l’instant. Un fragment retrouvé ou un signe aperçu y laisse une étoile.",
      pale: "Un lieu repéré, pas encore exploré. Touche pour le voir sur la Carte.",
      compris: "Signe compris : {mot}",
      inconnu: "Signe pas encore compris"
    };
    function figuresSig() {
      const fg = E.figures(), st = S();
      return JSON.stringify([fg.stars.map((s) => s.id + s.etat), fg.signes.map((s) => s.id + (s.lu ? 1 : 0) + s.lieux.length), !!st.flags.arche, !!E.cache().term, Object.keys(D.PROJECTS).some(E.projVisible), st.termMode]);
    }
    function figuresHTML() {
      const fg = E.figures();
      Object.keys(fg.noms).forEach((z) => { fg.noms[z] = fragPlace(z); });
      const lay = window.EclatFigures.layout(fg);
      const rendu = window.EclatFigures.render(lay, { esc, signeSVG: window.signeSVG, txt: FIG_TXT });
      if (!fg.stars.length && !fg.signes.length) return '<p class="small muted center" style="padding:20px 0">' + esc(FIG_TXT.vide) + "</p>";
      const on = fg.stars.filter((s) => s.etat === "allumee").length, pale = fg.stars.length - on;
      let h = "";
      if (fg.stars.length) {
        h += '<h3 class="sub">Les fragments</h3><p class="small muted">' + esc(FIG_TXT.intro) + " " + on + (on > 1 ? " étoiles allumées" : " étoile allumée") + (pale ? ", " + pale + (pale > 1 ? " pâles" : " pâle") : "") + ".</p>";
      }
      const cut = rendu.indexOf('<div class="fig-sky fig-sig"');
      if (fg.stars.length) h += '<div class="fig-wrap">' + (cut < 0 ? rendu : rendu.slice(0, cut)) + "</div>";
      if (fg.signes.length) {
        h += '<h3 class="sub">Les signes</h3><p class="small muted">' + esc(FIG_TXT.signes) + "</p>";
        h += '<div class="fig-wrap">' + (cut < 0 ? rendu : rendu.slice(cut)) + "</div>";
      }
      return h;
    }
    /* ===== FIGURES DU COSMOS (fin) ===== */

    /* ------------------------------------------------------------ COSMOS */
    function viewCosmos() {
      const st = S();
      const isReg = !!(st.flags.registre && st.termMode !== "arche");
      const tabs = [["ciel", "Ciel"]];
      { const fg = E.figures(); if (fg.stars.length || fg.signes.length) tabs.push(["figures", "Figures"]); }
      if (st.flags.arche || E.cache().term) tabs.push(["arche", isReg ? "REGISTRE" : "ARCHE"]);
      if (Object.keys(D.PROJECTS).some(E.projVisible)) tabs.push(["oeuvres", "Grands Œuvres"]);
      if (!tabs.find((t) => t[0] === U.cosmosTab)) U.cosmosTab = "ciel";
      let h = subTabs("journal", "cosmos", "Journal", "Cosmos") + '<div class="filters" style="margin-top:4px">' + tabs.map(([k, n]) => '<button data-ct="' + k + '" class="' + (U.cosmosTab === k ? "on" : "") + '">' + n + "</button>").join("") + "</div>";
      if (U.cosmosTab === "figures") {
        h += figuresHTML();
      } else if (U.cosmosTab === "ciel") {
        h += '<div class="sky-wrap"><canvas id="skyCanvas"></canvas><div class="sky-info" id="skyInfo">Touche le ciel.</div></div>';
        if (E.cache().signal) h += '<button class="btn wide pri" id="listen">📡 Écouter Kher</button>';
        else h += '<p class="small muted">Avec une oreille assez grande, tu pourrais peut-être entendre ce que dit l’étoile rouge.</p>';
      } else if (U.cosmosTab === "arche") {
        const pfx = isReg ? "REG > " : "ARCHE > ";
        h += '<div class="term" id="term">';
        if (!st.flags.arche) h += '<div class="l">Aucun signal radio.</div>';
        st.arche.forEach((l) => { h += '<div class="l">' + esc(l.txt) + "</div>"; });
        if (st.term.length) h += '<div class="l">────────</div>' + st.term.map((l) => '<div class="l' + (l.startsWith("> ") || l.startsWith("REG > ") || l.startsWith("ARCHE > ") ? " u" : "") + '">' + (l.startsWith("REG · ") ? recitInline(l, "Le Registre") + lectureHTML(l) : esc(l)) + "</div>").join("");
        h += "</div>";
        if (E.cache().term) h += '<form class="term-in" id="termForm" autocomplete="off"><span class="term-pfx">' + esc(pfx) + '</span><input id="termIn" placeholder="tape une commande…" autocapitalize="off" spellcheck="false"><button class="btn" type="submit">⏎</button></form>';
        else h += '<p class="small muted">Un ordinateur te permettrait de dialoguer avec ' + (isReg ? "le Registre" : "ARCHE") + '.</p>';
      } else {
        h += '<p class="small muted">Un Grand Œuvre se bâtit avec ce que tu verses depuis la Réserve, ou ce qu’il y prend seul quand tu l’alimentes. Il en demande des quantités énormes.</p>';
        for (const pid in D.PROJECTS) if (E.projVisible(pid)) h += projCard(pid);
      }
      return h;
    }
    function projCard(pid) {
      const P = D.PROJECTS[pid], ps = E.projState(pid), st = S();
      const art = (pid === "dyson" || pid === "brisemonde") ? pid + "-" + Math.min(ps.step + 1, 4) : pid;
      let h = '<div class="card proj"><div class="ph"><span class="pi">' + P.ic + '</span><div class="grow"><div class="pn">' + esc(P.n) + '</div><div class="small muted">' + esc(P.d) + "</div></div></div>" + '<img class="oeuvre-art oeuvre-art-compact" src="assets/oeuvres/' + art + '.webp" alt="" loading="lazy" decoding="async">';
      P.steps.forEach((s, i) => {
        const cls = i < ps.step ? " done" : i === ps.step ? " cur" : "";
        h += '<div class="step' + cls + '">' + (["dyson", "brisemonde"].includes(pid) ? '' : "") + '<div class="sn">' + (i < ps.step ? "✓ " : i + 1 + ". ") + esc(s.n) + '</div><div class="tiny muted">' + esc(s.d || "") + "</div>";
        if (i === ps.step) {
          if (s.cost) {
            for (const k in s.cost) {
              const paid = ps.paid[k] || 0;
              h += '<div class="cost-row" data-goto="' + k + '">' + icon(k, "sm") + '<span class="grow">' + esc(I[k].n) + '</span><span class="tiny">' + fmt(paid) + "/" + fmt(s.cost[k]) + '</span><div class="bar"><i style="width:' + (100 * paid / s.cost[k]).toFixed(1) + '%"></i></div></div>';
            }
            if (s.need && !st.frags[s.need]) h += '<div class="why">Il faut d’abord atteindre ' + esc(D.FRAGS[s.need].n) + ".</div>";
            if (!(s.need && !st.frags[s.need])) h += '<div class="row wrap" style="margin-top:8px"><button class="btn small pri" data-contrib="' + pid + '">Fournir</button><button class="btn small' + (E.siteOn(pid) ? " on" : "") + '" data-feed="' + pid + '">' + (E.siteOn(pid) ? "Alimenté ✓" : "Alimenter") + "</button></div>";
          } else if (s.action === "relais") {
            if (st.frags.coeur && st.frags.poings) h += '<button class="btn wide pri" style="margin-top:8px" data-proj-act="' + pid + '">⚡ Couper le relais</button>';
            else h += '<div class="why">' + esc((E.RECIT.chant || {}).manque || "") + '</div>';
          } else if (s.scene === "lacher") {
            h += '<button class="btn wide pri" style="margin-top:8px" data-proj-scene="' + pid + '">✋ Lever la main</button>';
          } else if (s.fire) {
            let btnTxt = "💥 Mise à feu";
            let btnBg = "background:#ff5a3c";
            if (pid === "chant") { btnTxt = "🔔 Sonner les matines"; btnBg = "background:#d97706"; }
            const PC = ((E.RECIT.projets || {})[pid] || {}).confirmer;
            if (PC) { btnTxt = PC.bouton; btnBg = "background:" + PC.fond; }
            h += '<button class="btn wide pri" style="margin-top:8px;' + btnBg + '" data-fire="' + pid + '">' + btnTxt + "</button>";
          } else if (s.melody) {
            const allM = (typeof E.allMelodies === "function") ? E.allMelodies() : D.MELODIES;
            const mName = allM[s.melody] ? allM[s.melody].n : s.melody;
            h += '<p class="small" style="margin-top:6px">🎶 Prends ta flûte (Journal) et joue <b>' + esc(mName) + "</b>.</p>";
          }
        }
        h += "</div>";
      });
      if (ps.step >= P.steps.length) h += '<p class="small" style="color:var(--good);margin-top:8px">Œuvre accomplie.</p>';
      return h + "</div>";
    }
    function mountCosmos() {
      const cv = $("#skyCanvas");
      if (cv) Sky.mount(cv, { age: S().age, dish: E.cache().signal, decoded: !!S().flags.decoded });
      // la Promesse jouée : la lueur répond, la prochaine fois que le Ciel s’ouvre
      if (cv && S().meta.pulseDue && window.EclatSky && window.EclatSky.trigger) { delete S().meta.pulseDue; setTimeout(() => window.EclatSky.trigger("double_pulse"), 1800); }
      else Sky.unmount();
      const t = $("#term");
      if (t) t.scrollTop = t.scrollHeight;
    }

    function confirmFire(pid) {
      let kicker = "Mise à feu";
      let title = "Mise à feu ?";
      let prompt = E.interpolate((E.RECIT.ui || {}).tirer || "");
      let btnTxt = "💥 Tirer";
      let btnBg = "background:#ff5a3c";
      const warn = "";

      const PC = ((E.RECIT.projets || {})[pid] || {}).confirmer;
      if (pid === "brisemonde") {
        kicker = "Brise-Monde";
      } else if (PC) {
        kicker = D.PROJECTS[pid].n;
        title = PC.titre;
        prompt = PC.texte;
        btnTxt = PC.btn;
        btnBg = "background:" + PC.fond;
      } else if (pid === "chant") {
        const c = (E.RECIT.chant || {}).confirmer || {};
        kicker = (E.RECIT.chant || {}).n || "";
        title = c.titre || title;
        prompt = c.texte || "";
        btnTxt = "🔔 Sonner";
        btnBg = "background:#d97706";
      }

      openModal({
        persistent: true,
        html: '<div class="kicker">' + esc(kicker) + '</div><h2>' + esc(title) + '</h2><p style="font-family:var(--mono);color:#8cffb0">' + esc(prompt) + '</p>' + warn +
          '<div class="acts"><button class="btn" data-m="close">Attendre</button><button class="btn pri" style="' + btnBg + '" data-m="fire">' + esc(btnTxt) + '</button></div>',
        on: { fire: () => { setTimeout(() => E.fire(pid), 250); } }
      });
    }

    function listen() {
      A.init();
      const r = E.listen();
      if (!r.ok) return;
      A.signal();
      Sky.set({ listenUntil: Date.now() + 7000 });
      const info = $("#skyInfo");
      const ui = E.RECIT.ui || {};
      if (info) info.textContent = r.decoded ? ui.ecoute1 : ui.ecoute0;
      if (r.fresh) toast("Tu as enregistré le <b>Signal de Kher</b>.");
    }
    function skyTap(ev) {
      const cv = ev.target, rc = cv.getBoundingClientRect();
      const hit = Sky.hit(ev.clientX - rc.left, ev.clientY - rc.top);
      const info = $("#skyInfo");
      if (!hit || !info) return;
      A.init(); A.click();
      if (hit.k === "moon") {
        const msg = E.tapMoon();
        info.textContent = msg || (E.RECIT.ui || {}).lune;
      } else if (hit.k === "kher") {
        const ui = E.RECIT.ui || {};
        info.textContent = (S().inv.traducteur || S().flags.decoded) ? ui.kher8 : S().age >= 7 ? ui.kher7 : ui.kher0;
      } else info.textContent = hit.n + ".";
    }

    function playNote(n, btn) {
      A.init();
      A.note(n);
      if (btn) { btn.classList.add("ping"); setTimeout(() => btn.classList.remove("ping"), 160); }
      const r = E.playNote(n);
      const el = $("#notes");
      if (el) { el.textContent = S().notes.join(" · "); el.classList.remove("fade"); }
      // après une pause, l’air recommence : les notes s’effacent
      clearTimeout(U.noteT);
      U.noteT = setTimeout(() => { E.clearNotes(); const e2 = $("#notes"); if (e2) { e2.classList.add("fade"); setTimeout(() => { if (!S().notes.length) e2.textContent = ""; e2.classList.remove("fade"); }, 400); } }, 2500);
      if (r) {
        const allM = (typeof E.allMelodies === "function") ? E.allMelodies() : D.MELODIES;
        const M = allM[r.id];
        setTimeout(() => {
          if (r.fresh) A.secret();
          if (M && !r.ending) {
            if (r.fresh || !r.rejouable) {
              openModal({ html: '<div class="kicker">' + (r.fresh ? "Secret découvert" : "Mélodie") + "</div><h2>" + esc(M.n) + "</h2>" + loreHTML(M.t) +
                '<div class="acts"><button class="btn pri" data-m="close">Continuer</button></div>' });
            } else {
              toast("🎶 " + esc(M.n));
            }
          }
        }, 350);
        render(true);
      }
    }

    function runTerminal(txt) {
      if (!txt.trim()) return;
      A.init(); A.click();
      E.terminal(txt);
      render(true);
      const inp = $("#termIn"); if (inp) { inp.value = ""; inp.focus(); }
    }

    return { openSigneModal, viewJournal, figuresSig, viewCosmos, mountCosmos, confirmFire, listen, skyTap, playNote, runTerminal };
  }

  window.EclatJournal = { create };
})();
