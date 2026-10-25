/* ÉCLAT — le menu, les réglages, les sauvegardes et le compte en ligne.
 * Exporter, importer, restaurer une copie ; la sauvegarde illisible, les nouveautés ;
 * la connexion, les emplacements et la synchronisation ; le menu, l’aide, la capsule. */
(function () {
  "use strict";

  function create(api) {
    const {
      E, ENGINE, A, D, U, Cloud, Tuto, esc, fmtTime, fmtDate, toast, openModal, closeModal, swapModal, simpleModal,
      save, backups, pushBackup, setTab, applyTheme, applyLargeText, volumes, intro, openMemoire, visiteurFin
    } = api;
    const S = () => E.state;
    const $ = (s, r) => (r || document).querySelector(s);
    const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

    function stamp() {
      const d = new Date(), p = (n) => String(n).padStart(2, "0");
      return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + "_" + p(d.getHours()) + "h" + p(d.getMinutes());
    }
    function download(name, text) {
      const blob = new Blob([text], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = name;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 2000);
    }
    function downloadSave() {
      save();
      download("eclat-sauvegarde-" + stamp() + ".json", E.serialize());
      toast("💾 Sauvegarde téléchargée.");
    }
    /* Remplace la partie actuelle par une autre (fichier, code, copie de sécurité). */
    function replaceWith(raw, why) {
      let txt;
      try { txt = E.decodeSave(raw); E.parseSave(txt); } catch (e) { toast("Fichier illisible : " + esc(e.message)); return false; }
      if (!U.saveLocked) pushBackup(E.serialize(), why);
      E.load(txt);
      U.saveLocked = false; U.badSave = null;
      save();
      U.slots = [null, null, null]; U.last = null;
      setTab("domaine");
      toast("Partie chargée.");
      return true;
    }
    function pickFile(cb) {
      const inp = document.createElement("input");
      inp.type = "file";
      inp.accept = ".json,application/json,text/plain";
      inp.onchange = () => {
        const f = inp.files && inp.files[0];
        if (!f) return;
        const r = new FileReader();
        r.onload = () => cb(String(r.result || ""));
        r.readAsText(f);
      };
      inp.click();
    }
    function openSaves() {
      const list = backups();
      openModal({
        html: "<h2>💾 Sauvegardes</h2><p class=\"small muted\">Sauvegarde automatique sur cet appareil. Télécharge une copie pour la conserver ou la transférer.</p>" +
          '<div class="acts" style="flex-direction:column"><button class="btn pri" data-m="dl">⬇️ Télécharger ma sauvegarde</button><button class="btn" data-m="up">⬆️ Charger un fichier de sauvegarde</button>' +
          '<button class="btn ghost" data-m="code">📋 Code texte (ancien format)</button></div>' +
          (list.length ? '<h3 class="sub">Copies de sécurité automatiques</h3>' + list.map((b, i) =>
            '<div class="bk"><div class="grow"><b>' + esc(b.why) + '</b><div class="tiny muted">' + fmtDate(b.t) + " · format v" + b.v + '</div></div><button class="btn small" data-m="bdl" data-i="' + i + '">⬇️</button><button class="btn small" data-m="brs" data-i="' + i + '">Restaurer</button></div>').join("") : "") +
          '<div class="acts"><button class="btn" data-m="close">Fermer</button></div>',
        on: {
          dl: () => { downloadSave(); return true; },
          up: () => { pickFile((txt) => confirmReplace(txt, "Avant le chargement d’un fichier")); return true; },
          code: () => setTimeout(openCode, 80),
          bdl: (b) => { const k = backups()[Number(b.dataset.i)]; if (k) download("eclat-copie-" + stamp() + ".json", k.data); return true; },
          brs: (b) => { const k = backups()[Number(b.dataset.i)]; if (k) setTimeout(() => confirmReplace(k.data, "Avant la restauration d’une copie"), 80); }
        }
      });
    }
    function confirmReplace(txt, why) {
      let o;
      try { o = E.parseSave(E.decodeSave(txt)); } catch (e) { toast("Fichier illisible : " + esc(e.message)); return; }
      openModal({
        html: "<h2>Charger cette partie ?</h2><p>Âge : <b>" + esc(D.AGES[o.age].n) + "</b> · " + Object.keys(o.known).length + " recettes connues · cycle " + (o.cycle || 1) + ".</p>" +
          '<p class="small muted">Ta partie actuelle sera remplacée. Une copie de sécurité est faite juste avant.</p><div class="acts"><button class="btn" data-m="close">Annuler</button><button class="btn pri" data-m="go">Charger</button></div>',
        on: { go: () => { replaceWith(txt, why); } }
      });
    }
    function openCode() {
      save();
      const code = E.exportSave();
      openModal({
        html: "<h2>Code de sauvegarde</h2><p class=\"small muted\">Copie ce code pour le garder, ou colle un code existant puis charge-le.</p><textarea class=\"save\" id=\"codeTxt\">" + code + "</textarea>" +
          '<div class="acts"><button class="btn" data-m="copy">Copier</button><button class="btn" data-m="load">Charger le code collé</button><button class="btn pri" data-m="close">Fermer</button></div>',
        onOpen: (box) => { const t = $("textarea", box); t.focus(); t.select(); },
        on: {
          copy: () => { try { navigator.clipboard.writeText($("#codeTxt").value); toast("Copié."); } catch (e) { /* ignoré */ } return true; },
          load: () => { const v = $("#codeTxt").value; if (v.trim() === code) { toast("Partie actuelle déjà chargée."); return true; } setTimeout(() => confirmReplace(v, "Avant le chargement d’un code"), 80); }
        }
      });
    }
    function showBadSave() {
      const b = U.badSave;
      openModal({
        persistent: true,
        html: '<div class="kicker">Sauvegarde</div><h2>Ta partie n’a pas pu être lue</h2><p>Elle n’a <b>pas</b> été modifiée et reste sur cet appareil. Télécharge-la pour la garder en lieu sûr.</p>' +
          '<p class="tiny muted">Détail : ' + esc(b.err) + "</p>" +
          '<div class="acts" style="flex-direction:column"><button class="btn pri" data-m="dl">⬇️ Télécharger la sauvegarde illisible</button><button class="btn" data-m="up">⬆️ Charger un autre fichier</button>' +
          '<button class="btn ghost" data-m="fresh">Commencer une nouvelle partie (l’ancienne est mise à l’abri)</button></div>',
        on: {
          dl: () => { download("eclat-sauvegarde-illisible-" + stamp() + ".json", b.raw); return true; },
          up: () => { pickFile((txt) => { if (replaceWith(txt, "Avant le chargement d’un fichier")) closeModal(); }); return true; },
          fresh: () => {
            pushBackup(b.raw, "Sauvegarde illisible mise à l’abri");
            U.saveLocked = false; U.badSave = null;
            E.reset(); save(); setTab("domaine"); setTimeout(intro, 100);
          }
        }
      });
    }
    function showNews() {
      const st = S();
      const hasBackup = backups().some((b) => b.v < ENGINE.SAVE_VERSION);
      openModal({
        html: '<div class="kicker">Mise à jour ' + esc(D.VERSION) + "</div><h2>Ta partie a été conservée</h2>" +
          '<ul class="news">' + D.CHANGES.map((c) => "<li>" + esc(c) + "</li>").join("") + "</ul>" +
          (st.flags.mach57 ? '<p class="small">Tes machines ne sont plus fixées sur une recette : elles sont au repos et aident tes commandes. Les ressources qu’elles utilisaient sont revenues dans ta Réserve.</p>' : "") +
          (st.flags.news === "6" && Object.keys(st.dom.ext).length ? '<p class="small">Les tapis disparaissent : tes extracteurs sont maintenant rangés dans le <b>Domaine</b>, terre par terre. Ils récoltent autant qu’avant, et ce qui se trouvait sur les tapis est revenu dans ta Réserve.</p>' : "") +
          (st.flags.v5proj ? '<p class="small">Ton Grand Œuvre est commencé, et tout ce que tu y as fourni est conservé. Dans le Domaine, touche « Alimenter » pour qu’il se serve seul dans la Réserve.</p>' : "") +
          (hasBackup ? '<p class="small muted">Par précaution, une copie de ton ancienne sauvegarde a été mise de côté. Tu peux la télécharger ici ou plus tard depuis ☰ → Sauvegardes.</p>' : "") +
          '<div class="acts">' + (hasBackup ? '<button class="btn" data-m="old">⬇️ Ancienne sauvegarde</button>' : "") + '<button class="btn pri" data-m="close">Continuer</button></div>',
        on: { old: () => { const k = backups().find((b) => b.v < ENGINE.SAVE_VERSION); if (k) download("eclat-ancienne-sauvegarde-v" + k.v + "-" + stamp() + ".json", k.data); return true; } },
        onClose: () => { st.flags.news = null; st.flags.ver = D.VERSION; delete st.flags.fab3; delete st.flags.fab4; delete st.flags.v5proj; delete st.flags.mach57; save(); }
      });
    }


    const summary = (o) => esc(D.AGES[o.age] ? D.AGES[o.age].n : "?") + " · " + fmtTime((o.stats && o.stats.play) || 0) + " de jeu · " + Object.keys(o.known || {}).length + " recettes";
    const busy = (b, txt) => { if (b) { b.disabled = true; b.dataset.t = b.textContent; b.textContent = txt || "Un instant…"; } };
    const unbusy = (b) => { if (b && b.isConnected) { b.disabled = false; if (b.dataset.t) b.textContent = b.dataset.t; } };
    async function openAccount(msg) {
      if (!Cloud.configured()) {
        simpleModal("Compte", "Pas encore de comptes", "<p>Les comptes en ligne ne sont pas encore ouverts sur ce jeu. En attendant, ta partie reste enregistrée sur cet appareil, et tu peux la télécharger dans ☰ → Sauvegardes.</p>" +
          '<p class="tiny dim">Pour la personne qui publie le jeu : la marche à suivre est dans server/README.md.</p>');
        return;
      }
      const a = Cloud.account();
      if (!a || !a.token) { swapModal(loginModal(msg, a && a.pseudo)); return; }
      try { await Cloud.slots(); U.sync.err = null; } catch (e) { U.sync.err = e.message; }
      swapModal(accountModal(msg));
    }
    function loginModal(msg, pseudo) {
      const up = U.acMode === "up";
      return {
        html: '<div class="kicker">Compte</div><h2>' + (up ? "Créer un compte" : "Se connecter") + "</h2>" +
          '<p class="small muted">Avec un compte, ta partie est aussi gardée en ligne : trois emplacements par compte, à retrouver sur un autre appareil.</p>' +
          '<div class="seg"><button data-m="tin" class="' + (up ? "" : "on") + '">J’ai un compte</button><button data-m="tup" class="' + (up ? "on" : "") + '">Nouveau compte</button></div>' +
          '<label class="fld"><span>Pseudo</span><input id="acP" autocomplete="username" autocapitalize="off" spellcheck="false" maxlength="24" value="' + esc(pseudo || "") + '"></label>' +
          '<label class="fld"><span>Mot de passe</span><input id="acW" type="password" autocomplete="' + (up ? "new-password" : "current-password") + '"></label>' +
          (up ? '<label class="fld"><span>Confirme le mot de passe</span><input id="acW2" type="password" autocomplete="new-password"></label>' : "") +
          '<p class="small err" id="acErr">' + esc(msg || "") + "</p>" +
          '<p class="tiny dim">Ta partie est chiffrée sur ton appareil avant d’être envoyée : sans ton mot de passe, personne ne peut la lire, pas même le serveur. En contrepartie, si tu oublies ton mot de passe, les copies en ligne sont perdues. Celle de cet appareil reste.</p>' +
          '<div class="acts"><button class="btn" data-m="close">Annuler</button><button class="btn pri" data-m="go">' + (up ? "Créer le compte" : "Se connecter") + "</button></div>",
        onOpen: (box) => { const f = $(pseudo ? "#acW" : "#acP", box); if (f) f.focus(); },
        on: {
          tin: () => { U.acMode = "in"; swapModal(loginModal("", $("#acP").value)); return true; },
          tup: () => { U.acMode = "up"; swapModal(loginModal("", $("#acP").value)); return true; },
          go: (b) => { doLogin(b, up); return true; }
        }
      };
    }
    async function doLogin(b, up) {
      const p = $("#acP").value.trim(), w = $("#acW").value, err = $("#acErr");
      const say = (t) => { if (err) err.textContent = t; };
      if (!/^[\p{L}\p{N}_.-]{3,24}$/u.test(p)) return say("Le pseudo doit faire de 3 à 24 caractères : lettres, chiffres, tiret, point ou tiret bas.");
      if (up && w.length < 8) return say("Le mot de passe doit faire au moins 8 caractères.");
      if (up && w !== $("#acW2").value) return say("Les deux mots de passe ne sont pas identiques.");
      if (!w) return say("Il manque le mot de passe.");
      busy(b, up ? "Création…" : "Connexion…");
      say("");
      try {
        if (up) await Cloud.register(p, w); else await Cloud.login(p, w);
        A.discover();
        await afterLogin(up);
      } catch (e) { unbusy(b); say(e.message); }
    }
    async function afterLogin(isNew) {
      let list = [];
      try { if (!isNew) list = await Cloud.slots(); } catch (e) { swapModal(accountModal(e.message)); return; }
      if (!list.length) {
        await cloudPush({ force: true, quiet: true });
        swapModal(accountModal("Voilà : ta partie est maintenant gardée en ligne aussi."));
        updateCloudBtn();
        return;
      }
      const a = Cloud.account();
      const slot = (a && a.slot) || 1;
      if (!list.some((x) => x.slot === slot)) {
        swapModal(accountModal("Ce compte a des parties en ligne. Ouvre un emplacement pour en reprendre une."));
        updateCloudBtn();
        return;
      }
      let cloud = null;
      try { cloud = await Cloud.pull(slot); } catch (e) { swapModal(accountModal(e.message)); return; }
      chooseVersion(cloud, "Il y a déjà une partie dans l’emplacement " + slot + ".");
    }
    /* deux versions de la partie : le joueur choisit, l’autre part dans les copies */
    function chooseVersion(cloud, intro) {
      let o;
      try { o = E.parseSave(cloud.text); } catch (e) { swapModal(accountModal("La partie en ligne est illisible : " + e.message)); return; }
      swapModal({
        persistent: true,
        html: '<div class="kicker">Compte</div><h2>Quelle partie garder ?</h2><p class="small">' + esc(intro) + "</p>" +
          '<div class="vs"><div class="card"><b>📱 Cet appareil</b><div class="small muted">' + summary(S()) + '</div></div><div class="card"><b>☁️ Emplacement ' + cloud.slot + '</b><div class="small muted">' + summary(o) +
          "<br>Envoyée le " + esc(fmtDate(cloud.updated)) + "</div></div></div>" +
          '<p class="tiny dim">Celle que tu ne gardes pas n’est pas perdue : elle va dans les copies de sécurité (☰ → Sauvegardes).</p>' +
          '<div class="acts" style="flex-direction:column"><button class="btn pri" data-m="cloud">Prendre la partie en ligne</button><button class="btn" data-m="local">Garder celle de cet appareil</button></div>',
        on: {
          cloud: () => { if (replaceWith(cloud.text, "Avant de charger la partie du compte")) { Cloud.useSlot(cloud.slot); Cloud.adopt(cloud.rev, cloud.updated, cloud.slot); U.sync.conflict = null; updateCloudBtn(); } },
          local: () => { pushBackup(cloud.text, "Partie du compte, remplacée par celle de l’appareil"); U.sync.conflict = null; cloudPush({ force: true, manual: true, slot: cloud.slot }); }
        }
      });
    }
    function accountModal(msg) {
      const a = Cloud.account() || {};
      const c = U.sync.conflict;
      return {
        html: '<div class="kicker">Compte</div><h2>☁️ ' + esc(a.pseudo || "") + "</h2>" +
          (msg ? '<p class="small">' + esc(msg) + "</p>" : "") +
          (c ? '<div class="card warnc"><b>Une autre version de ta partie est en ligne (emplacement ' + (c.slot || a.slot || 1) + ').</b><div class="small muted">Envoyée le ' + esc(fmtDate(c.updated)) + ', sans doute depuis un autre appareil.</div><button class="btn small pri" data-m="solve" style="margin-top:8px">Choisir la partie à garder</button></div>' : "") +
          '<p class="small muted">' + (a.last ? "Dernier envoi (emplacement " + (a.slot || 1) + ") : " + esc(fmtDate(a.last)) : "Rien n’a encore été envoyé.") + (U.sync.err ? '<br><span class="err">' + esc(U.sync.err) + "</span>" : "") + "</p>" +
          '<h3 class="sub">Trois emplacements en ligne</h3>' +
          '<p class="tiny dim">L’envoi automatique va dans l’emplacement actif. Les autres gardent une partie de côté.</p>' +
          (a.legacy ? '<p class="tiny err">Le serveur des comptes n’est pas encore à jour : seule la première sauvegarde en ligne est disponible.</p>' : "") +
          [1, 2, 3].map(slotLine).join("") +
          '<div class="toggle"><span>Envoi automatique<br><span class="tiny dim">régulièrement, et quand tu quittes le jeu</span></span><button class="btn small" data-m="auto">' + (a.auto ? "Activé" : "Coupé") + "</button></div>" +
          '<div class="acts" style="flex-direction:column"><button class="btn pri" data-m="push">⬆️ Envoyer maintenant (emplacement ' + (a.slot || 1) + ')</button><button class="btn" data-m="pull">⬇️ Récupérer la partie en ligne</button>' +
          '<button class="btn ghost" data-m="pw">🔑 Changer de mot de passe</button><button class="btn ghost" data-m="out">🚪 Se déconnecter</button><button class="btn ghost" data-m="del" style="color:var(--bad)">🗑️ Supprimer le compte</button>' +
          '<button class="btn" data-m="close">Fermer</button></div>',
        on: {
          auto: (b) => { Cloud.setAuto(!a.auto); b.textContent = Cloud.account().auto ? "Activé" : "Coupé"; a.auto = Cloud.account().auto; return true; },
          push: (b) => { busy(b, "Envoi…"); cloudPush({ manual: true }).then(() => swapModal(accountModal(U.sync.conflict ? "" : U.sync.err ? "" : "Partie envoyée."))); return true; },
          pull: (b) => {
            busy(b, "Téléchargement…");
            Cloud.pull().then((cl) => {
              if (!cl) swapModal(accountModal("L’emplacement actif est vide. Ouvre un emplacement ci-dessus pour reprendre une partie."));
              else chooseVersion(cl, "Voici la partie enregistrée en ligne.");
            }).catch((e) => swapModal(accountModal(e.message)));
            return true;
          },
          solve: (b) => { busy(b); Cloud.pull().then((cl) => cl && chooseVersion(cl, "Ta partie a avancé sur un autre appareil.")).catch((e) => swapModal(accountModal(e.message))); return true; },
          slot: (b) => { swapModal(slotModal(Number(b.dataset.i))); return true; },
          pw: () => { swapModal(passwordModal()); return true; },
          out: () => { Cloud.logout().then(updateCloudBtn); toast("Déconnexion effectuée. Partie conservée sur cet appareil."); },
          del: () => { swapModal(deleteModal()); return true; }
        }
      };
    }
    /* une ligne par emplacement dans la fenêtre Compte */
    function slotInfo(n) {
      const a = Cloud.account() || {};
      const m = (a.revs && a.revs[n]) || null;
      const active = (a.slot || 1) === n;
      return {
        slot: n,
        active,
        rev: m ? m.rev : active ? a.rev || 0 : 0,
        updated: m ? m.updated : active ? a.last || 0 : 0
      };
    }
    function slotLine(n) {
      const s = slotInfo(n);
      const off = (Cloud.account() || {}).legacy && n > 1;
      return '<div class="bk"><div class="grow"><b>Emplacement ' + n + (s.active ? ' <span class="tiny dim">actif</span>' : "") +
        '</b><div class="tiny muted">' + (off ? "Serveur à mettre à jour" : s.rev ? "Envoyé le " + esc(fmtDate(s.updated)) : "Vide") + '</div></div>' +
        (off ? "" : '<button class="btn small" data-m="slot" data-i="' + n + '">Gérer</button>') + '</div>';
    }
    function slotModal(n) {
      const s = slotInfo(n);
      return {
        html: '<div class="kicker">Compte</div><h2>Emplacement ' + n + '</h2>' +
          '<p class="small muted">' + (s.rev ? "Partie envoyée le " + esc(fmtDate(s.updated)) + "." : "Cet emplacement est vide.") +
          (s.active ? " C’est l’emplacement actif : les envois automatiques de cet appareil vont ici." : "") + "</p>" +
          '<p class="tiny dim">Prendre une partie la charge sur cet appareil et rend son emplacement actif. Déposer garde celle de cet appareil en ligne sans changer d’emplacement.</p>' +
          '<div class="acts" style="flex-direction:column">' +
          (s.rev ? '<button class="btn pri" data-m="pull">⬇️ Prendre cette partie</button>' : "") +
          '<button class="btn' + (s.rev ? "" : " pri") + '" data-m="push">⬆️ Déposer la partie de cet appareil</button>' +
          '<button class="btn" data-m="fresh">🆕 Nouvelle partie dans cet emplacement</button>' +
          (s.active ? "" : '<button class="btn" data-m="use">Rendre cet emplacement actif</button>') +
          (s.rev && !s.active ? '<button class="btn ghost" data-m="erase" style="color:var(--bad)">🗑️ Vider cet emplacement</button>' : "") +
          '<button class="btn" data-m="back">Retour</button></div>',
        on: {
          use: () => { Cloud.useSlot(n); swapModal(slotModal(n)); return true; },
          pull: (b) => {
            busy(b, "Téléchargement…");
            Cloud.pull(n).then((cl) => {
              if (!cl) swapModal(slotModal(n));
              else chooseVersion(cl, "Voici la partie de l’emplacement " + n + ".");
            }).catch((e) => swapModal(accountModal(e.message)));
            return true;
          },
          push: (b) => {
            if (s.rev) { swapModal(slotOverwriteModal(n, s.updated)); return true; }
            busy(b, "Envoi…");
            cloudPush({ manual: true, slot: n, force: true }).then(() => swapModal(slotModal(n)));
            return true;
          },
          fresh: () => { swapModal(newGameModal(n)); return true; },
          erase: (b) => {
            busy(b, "Suppression…");
            Cloud.erase(n).then(() => { toast("Emplacement " + n + " vidé."); swapModal(slotModal(n)); })
              .catch((e) => { unbusy(b); swapModal(accountModal(e.message)); });
            return true;
          },
          back: () => { swapModal(accountModal()); return true; }
        }
      };
    }
    /* repartir de zéro dans un emplacement : la partie de l’appareil reste dans son emplacement actuel,
     * celle qui occupait l’emplacement choisi part dans les copies de sécurité */
    function newGameModal(n) {
      const s = slotInfo(n);
      const prev = (Cloud.account() || {}).slot || 1;
      return {
        html: '<div class="kicker">Compte</div><h2>Nouvelle partie dans l’emplacement ' + n + ' ?</h2>' +
          (prev !== n ? '<p class="small">La partie de cet appareil est d’abord envoyée dans l’emplacement ' + prev + ', où tu pourras la retrouver.</p>' : "") +
          (s.rev ? '<p class="small err">La partie en ligne de l’emplacement ' + n + ' (envoyée le ' + esc(fmtDate(s.updated)) + ') sera remplacée. Elle est d’abord rangée dans les copies de sécurité de cet appareil (☰ → Sauvegardes).</p>' : "") +
          '<p class="tiny dim">L’emplacement ' + n + ' devient l’emplacement actif. Une copie de la partie de cet appareil est aussi gardée dans ☰ → Sauvegardes.</p>' +
          '<div class="acts"><button class="btn" data-m="back">Annuler</button><button class="btn pri" data-m="go">Commencer</button></div>',
        on: {
          back: () => { swapModal(slotModal(n)); return true; },
          go: (b) => {
            busy(b, "Préparation…");
            (async () => {
              try {
                if (prev !== n) await cloudPush({ quiet: true, slot: prev });
                if (s.rev) {
                  const old = await Cloud.pull(n);
                  if (old) pushBackup(old.text, "Partie en ligne (emplacement " + n + ") remplacée par une nouvelle partie");
                }
                pushBackup(E.serialize(), "Avant une nouvelle partie");
                Cloud.useSlot(n);
                E.reset(); save(); U.slots = [null, null, null]; U.last = null;
                closeModal(); setTab("carte"); intro(); updateCloudBtn();
                cloudPush({ quiet: true, slot: n, force: true });
              } catch (e) { unbusy(b); swapModal(accountModal(e.message)); }
            })();
            return true;
          }
        }
      };
    }
    /* déposer sur un emplacement occupé : l’ancienne partie en ligne part dans les copies */
    function slotOverwriteModal(n, updated) {
      return {
        html: '<div class="kicker">Compte</div><h2>Remplacer l’emplacement ' + n + ' ?</h2>' +
          '<p class="small">La partie en ligne du ' + esc(fmtDate(updated)) + ' sera remplacée par celle de cet appareil.</p>' +
          '<p class="tiny dim">Celle qui est en ligne n’est pas gardée telle quelle : elle sera téléchargée avant d’être remplacée, puis rangée dans les copies de sécurité de cet appareil (☰ → Sauvegardes).</p>' +
          '<div class="acts"><button class="btn" data-m="back">Annuler</button><button class="btn pri" data-m="go">Remplacer</button></div>',
        on: {
          back: () => { swapModal(slotModal(n)); return true; },
          go: (b) => {
            busy(b, "Envoi…");
            (async () => {
              try {
                const old = await Cloud.pull(n);
                if (old) pushBackup(old.text, "Partie en ligne (emplacement " + n + ") remplacée");
                await cloudPush({ manual: true, slot: n, force: true });
                swapModal(slotModal(n));
              } catch (e) { unbusy(b); swapModal(accountModal(e.message)); }
            })();
            return true;
          }
        }
      };
    }
    function passwordModal() {
      return {
        html: '<div class="kicker">Compte</div><h2>Changer de mot de passe</h2>' +
          '<label class="fld"><span>Mot de passe actuel</span><input id="pw0" type="password" autocomplete="current-password"></label>' +
          '<label class="fld"><span>Nouveau mot de passe</span><input id="pw1" type="password" autocomplete="new-password"></label>' +
          '<label class="fld"><span>Confirme le nouveau mot de passe</span><input id="pw2" type="password" autocomplete="new-password"></label>' +
          '<p class="small err" id="pwErr"></p><p class="tiny dim">Tes parties en ligne (les trois emplacements) sont rechiffrées avec le nouveau mot de passe. Tes autres appareils devront se reconnecter.</p>' +
          '<div class="acts"><button class="btn" data-m="back">Retour</button><button class="btn pri" data-m="go">Changer</button></div>',
        on: {
          back: () => { swapModal(accountModal()); return true; },
          go: (b) => {
            const o = $("#pw0").value, n = $("#pw1").value, err = $("#pwErr");
            if (n.length < 8) { err.textContent = "Le nouveau mot de passe doit faire au moins 8 caractères."; return true; }
            if (n !== $("#pw2").value) { err.textContent = "Les deux nouveaux mots de passe ne sont pas identiques."; return true; }
            busy(b, "Chiffrement…");
            save();
            Cloud.changePassword(o, n, E.serialize()).then(() => swapModal(accountModal("Mot de passe changé."))).catch((e) => { unbusy(b); err.textContent = e.message; });
            return true;
          }
        }
      };
    }
    function deleteModal() {
      return {
        html: '<div class="kicker">Compte</div><h2>Supprimer le compte ?</h2><p class="small">Le compte et les parties en ligne seront effacés du serveur. Ta partie reste sur cet appareil.</p>' +
          '<label class="fld"><span>Mot de passe</span><input id="dl0" type="password" autocomplete="current-password"></label><p class="small err" id="dlErr"></p>' +
          '<div class="acts"><button class="btn" data-m="back">Retour</button><button class="btn pri" style="background:var(--bad)" data-m="go">Supprimer</button></div>',
        on: {
          back: () => { swapModal(accountModal()); return true; },
          go: (b) => {
            busy(b, "Suppression…");
            Cloud.deleteAccount($("#dl0").value).then(() => { closeModal(); updateCloudBtn(); toast("Compte supprimé. Partie conservée sur cet appareil."); })
              .catch((e) => { unbusy(b); $("#dlErr").textContent = e.message; });
            return true;
          }
        }
      };
    }
    async function cloudPush(o) {
      o = o || {};
      const a = Cloud.account();
      if (!a || !a.token || U.sync.busy || U.saveLocked) return null;
      U.sync.busy = true;
      try {
        save();
        const r = await Cloud.push(E.serialize(), o);
        if (r.conflict) { U.sync.conflict = r; if (!o.quiet) toast("☁️ Une autre version de ta partie est en ligne (emplacement " + r.slot + "). Ouvre ☁️ pour choisir laquelle garder."); }
        else { U.sync.conflict = null; U.sync.err = null; if (o.manual && !U.mcur) toast("☁️ Partie envoyée."); }
        return r;
      } catch (e) {
        U.sync.err = e.message;
        if (o.manual || e.status === 401) toast("☁️ " + esc(e.message));
        return null;
      } finally {
        U.sync.busy = false;
        updateCloudBtn();
      }
    }
    function updateCloudBtn() {
      const b = $("#cloudBtn"), a = Cloud.account();
      if (!b) return;
      b.classList.toggle("hidden", !a);
      b.classList.toggle("warn", !!(a && (!a.token || U.sync.conflict)));
      b.title = !a ? "" : !a.token ? "Reconnecte-toi" : U.sync.conflict ? "Deux versions de ta partie" : "Compte : " + a.pseudo;
    }
    /* au démarrage : la partie a-t-elle avancé sur un autre appareil ? */
    async function cloudCheck() {
      const a = Cloud.account();
      updateCloudBtn();
      if (!a || !a.token || U.saveLocked) return;
      try {
        const known = a.rev || 0;
        const cl = await Cloud.pull();
        if (!cl || cl.rev === known) return;
        const ask = () => { if (U.mcur) { setTimeout(ask, 1000); return; } chooseVersion(cl, "Ta partie en ligne a changé depuis ton dernier passage ici, sans doute sur un autre appareil."); };
        ask();
      } catch (e) { U.sync.err = e.message; updateCloudBtn(); }
    }
    function cloudTimers() {
      setInterval(() => {
        const a = Cloud.account();
        if (a && a.token && a.auto && !U.sync.conflict && Date.now() - (a.last || 0) > 4 * 60000) cloudPush({ quiet: true });
      }, 60000);
      document.addEventListener("visibilitychange", () => {
        const a = Cloud.account();
        if (document.hidden && a && a.token && a.auto && !U.sync.conflict && Date.now() - (a.last || 0) > 30000) cloudPush({ quiet: true, keepalive: true });
      });
    }

    function openMenu() {
      const st = S();
      const thMode = (st.settings && st.settings.theme) || "auto";
      const thLabels = { auto: "Auto", light: "Jour", dark: "Veillée" };
      const nextTh = { auto: "light", light: "dark", dark: "auto" };
      openModal({
        html: "<h2>Menu</h2>" +
          '<div class="toggle"><span>Thème</span><button class="btn small" data-m="theme">' + thLabels[thMode] + "</button></div>" +
          '<div class="toggle"><span>Grand texte</span><button class="btn small" data-m="largeText">' + (st.settings.largeText ? "Activé" : "Désactivé") + "</button></div>" +
          '<div class="toggle"><span>Son</span><button class="btn small" data-m="sound">' + (st.settings.sound ? "Activé" : "Coupé") + "</button></div>" +
          [["music", "Musique"], ["amb", "Ambiance"], ["sfx", "Bruitages"]].map(([k, n]) => '<label class="toggle vol"><span>' + n + '</span><input type="range" min="0" max="100" step="5" value="' + Math.round(volumes()[k] * 100) + '" data-vol="' + k + '"></label>').join("") +
          '<div class="toggle"><span>Vibrations</span><button class="btn small" data-m="vibe">' + (st.settings.vibe ? "Activées" : "Coupées") + "</button></div>" +
          '<div class="toggle"><span>Visiteurs</span><button class="btn small" data-m="visiteurs">' + (E.visiteurActif() ? "Oui" : "Non") + "</button></div>" +
          '<div class="toggle"><span>Tutoriel <span class="tiny muted">' + Tuto.doneCount() + "/" + Tuto.chapters().length + ' vus</span></span><span class="row"><button class="btn small ghost" data-m="tutoAgain">Revoir</button><button class="btn small" data-m="tuto">' + (Tuto.enabled() ? "Activé" : "Coupé") + "</button></span></div>" +
          '<div class="acts" style="flex-direction:column"><button class="btn" data-m="mem">✦ Mémoire des mains</button><button class="btn" data-m="account">☁️ Compte en ligne</button><button class="btn" data-m="saves">💾 Sauvegardes</button><button class="btn" data-m="help">❓ Comment jouer</button><button class="btn" data-m="news">Nouveautés</button><button class="btn" data-m="credits">Crédits</button>' +
          '<button class="btn" data-m="reset" style="color:var(--bad)">🗑️ Tout recommencer</button><button class="btn pri" data-m="close">Fermer</button></div>' +
          '<p class="tiny dim center" style="margin-top:12px">Éclat, du silex aux étoiles · version ' + esc(D.VERSION) + "</p>",
        onOpen: (box) => {
          $$("[data-vol]", box).forEach((r) => {
            r.addEventListener("input", () => {
              st.settings.vol = Object.assign(volumes(), { [r.dataset.vol]: Number(r.value) / 100 });
              A.init(); A.setVolumes(st.settings.vol);
              if (r.dataset.vol === "sfx") A.click();
            });
            r.addEventListener("change", save);
          });
        },
        on: {
          theme: (b) => {
            st.settings.theme = nextTh[st.settings.theme || "auto"];
            applyTheme();
            b.textContent = thLabels[st.settings.theme];
            save();
            return true;
          },
          largeText: (b) => {
            st.settings.largeText = !st.settings.largeText;
            applyLargeText();
            b.textContent = st.settings.largeText ? "Activé" : "Désactivé";
            save();
            return true;
          },
          sound: (b) => { st.settings.sound = !st.settings.sound; A.init(); A.setEnabled(st.settings.sound); b.textContent = st.settings.sound ? "Activé" : "Coupé"; save(); return true; },
          vibe: (b) => { st.settings.vibe = !st.settings.vibe; b.textContent = st.settings.vibe ? "Activées" : "Coupées"; save(); return true; },
          visiteurs: (b) => { E.setVisiteurs(!E.visiteurActif()); if (!E.visiteurActif()) visiteurFin(); b.textContent = E.visiteurActif() ? "Oui" : "Non"; save(); return true; },
          tuto: (b) => { Tuto.setEnabled(!Tuto.enabled()); b.textContent = Tuto.enabled() ? "Activé" : "Coupé"; return true; },
          tutoAgain: () => { Tuto.restart(); toast("💭 Tutoriel réactivé. Chapitres affichés au fil de la progression."); },
          saves: () => setTimeout(openSaves, 80),
          credits: () => setTimeout(() => simpleModal("Éclat", "Crédits",
            '<div class="small"><p><b>Icônes</b> : <a href="https://game-icons.net" target="_blank" rel="noopener">game-icons.net</a>, par Lorc, Delapouite et leurs contributeurs, sous licence CC BY 3.0. Recolorées, dessin inchangé.</p>' +
            "<p><b>Polices</b> (licence SIL OFL 1.1) : Alegreya Sans, IM Fell English, Cinzel, Playfair Display, Special Elite, Caveat, Space Grotesk, IBM Plex Mono.</p>" +
            "<p>Musique et bruitages synthétisés dans le jeu.</p></div>", "Fermer"), 80),
          account: () => { openAccount(); return true; },
          help: () => setTimeout(openHelp, 80),
          mem: () => setTimeout(openMemoire, 80),
          news: () => setTimeout(() => simpleModal("Version " + esc(D.VERSION), "Nouveautés", '<ul class="news">' + D.CHANGES.map((c) => "<li>" + esc(c) + "</li>").join("") + "</ul>"), 80),
          reset: () => setTimeout(() => {
            openModal({ html: '<h2>Tout recommencer ?</h2><p>Toute ta progression, tes secrets et tes fins seront effacés. Une copie de sécurité est gardée dans ☰ → Sauvegardes.</p><div class="acts"><button class="btn" data-m="close">Non</button><button class="btn pri" style="background:var(--bad)" data-m="go">Effacer</button></div>',
              on: { go: () => { pushBackup(E.serialize(), "Avant de tout recommencer"); E.reset(); save(); U.slots = [null, null, null]; U.last = null; setTab("carte"); intro(); } } });
          }, 80)
        }
      });
    }

    function openHelp() {
      simpleModal("Aide", "Comment jouer",
        '<div class="small">' +
        "<p><b>En bref.</b> Tu récoltes des ressources, tu découvres des recettes à l’Atelier, puis tu poses des extracteurs et des machines qui travaillent pour toi. L’<b>objectif</b>, en haut du Domaine, indique ta prochaine étape.</p>" +
        '<h3 class="sub">Les mots du jeu</h3><dl class="lexique">' +
        "<dt>Réserve</dt><dd>Tout ce que tu possèdes. Ce que tu récoltes ou fabriques y arrive, et chaque fabrication y prend ses ressources.</dd>" +
        "<dt>Terre, gisement</dt><dd>Une terre est un lieu du monde (la Lisière, la Plaine…). Chaque terre a ses gisements : un gisement est une ressource à récolter.</dd>" +
        "<dt>Récolter</dt><dd>Toucher l’icône d’un gisement (garder le doigt dessus pour continuer), ou toucher ▶ pour récolter en continu. Un appui rapporte parfois le double : un coup de chance.</dd>" +
        "<dt>Action, recette</dt><dd>Une recette associe une action (Tailler, Tresser…) à une ou plusieurs ressources. Tu les découvres à l’Atelier, en faisant des tentatives.</dd>" +
        "<dt>Pièce</dt><dd>Un objet fabriqué qui sert à en fabriquer d’autres (manche, corde…).</dd>" +
        "<dt>Outil, amélioration</dt><dd>Ils agissent dès que tu les as : récolte plus forte, terre nouvelle, extracteurs plus rapides. Rien à poser.</dd>" +
        "<dt>Station</dt><dd>Feu, four, enclume, creuset… Elle reste à l’Atelier et débloque une action, ou une chaleur plus forte. Quand une recette en demande une, le jeu la nomme.</dd>" +
        "<dt>Extracteur</dt><dd>Un bâtiment par ressource : le Bûcheron pour le bois, le Carrier pour la pierre, le Tanneur pour la peau… Il se pose sur un gisement de sa ressource (bouton « + cabane » sur le bois) et récolte seul, même quand le jeu est fermé. Il monte de niveau avec les âges : « Améliorer » remplace un exemplaire par le niveau d’après.</dd>" +
        "<dt>Machine</dt><dd>Automate, presse… Elle reste à l’Atelier et accélère tes commandes de pièces (une fois la pièce fabriquée à la main). Un automate de bois fait les recettes à 1 ingrédient, un automate de bronze jusqu’à 2, une presse ou un réacteur jusqu’à 3.</dd>" +
        "<dt>Commande</dt><dd>Ce que tu lances depuis le Carnet (×1, ×10, ×50, ×100, ×1 000, Max). Les ressources sont prises au fur et à mesure dans la Réserve, et les pièces manquantes sont ajoutées avant la pièce demandée.</dd>" +
        "<dt>Tes mains</dt><dd>Tout ce que tu fabriques passe par tes commandes (barre ✋ au-dessus des onglets). Tes machines t’y aident.</dd>" +
        "<dt>Passage</dt><dd>Pour entrer dans une nouvelle terre : il faut l’objet qui y mène, puis apporter ce que le passage demande.</dd>" +
        "<dt>Intuition ✨</dt><dd>Se gagne en découvrant. Sert à étudier une ressource (pour savoir avec quelles actions elle cache des recettes) et à déchiffrer une recette inconnue étape par étape.</dd>" +
        "<dt>Déchiffrer</dt><dd>Révéler une recette inconnue contre de l’Intuition : d’abord l’action, puis une des ressources, puis la recette entière.</dd>" +
        "<dt>Traces ✦, relève</dt><dd>Chaque passage franchi laisse des Traces. La relève recommence le monde en gardant tes recettes. Les Traces servent à acheter des améliorations dans la Mémoire des mains.</dd>" +
        "<dt>Ruine</dt><dd>Ce qu’un Semeur a construit attend le suivant. Une ruine se répare sur place pour une fraction de son coût d’origine, sans repasser par l’Atelier.</dd>" +
        "<dt>Comptoir, écus</dt><dd>Marché tenu par le Troqueur dans la Plaine. On y vend ce qui encombre la Réserve contre des écus, et on y achète des ressources. Les écus restants deviennent des Traces à la relève.</dd>" +
        "<dt>Demande du Troqueur</dt><dd>Le Troqueur demande des objets fabriqués contre des Traces. Livrer prend les objets dans la Réserve et donne les Traces tout de suite. Les demandes se renouvellent régulièrement.</dd>" +
        "<dt>Âge, étapes</dt><dd>Le jeu avance d’âge en âge. 🏁 montre les étapes de l’âge en cours.</dd>" +
        "<dt>Signe</dt><dd>Un mot de l’écriture des Anciens. Tant que tu ne l’as pas compris, il reste dessiné. Touche-le pour proposer ce qu’il veut dire.</dd>" +
        "<dt>Grand Œuvre</dt><dd>Un chantier immense qui mène à une fin du jeu. Tu y verses des ressources de la Réserve, ou tu l’alimentes pour qu’il s’y serve seul.</dd></dl>" +
        '<h3 class="sub">Les écrans</h3>' +
        "<p><b>🏡 Domaine.</b> Tes terres et leurs gisements, les passages et le Grand Œuvre.</p>" +
        "<p><b>🗺️ Carte.</b> Le monde, avec de la brume sur les terres que tu n’as pas encore atteintes. Touche un lieu 🧭 pour l’explorer : chaque lieu raconte un morceau de l’histoire.</p>" +
        "<p><b>🔨 Atelier.</b> Choisis une action, pose jusqu’à trois ressources, lance l’action choisie. Si la tentative échoue, le <b>thermomètre</b> indique si tu approches d’une recette. Le <b>Carnet</b> garde tes recettes : <b>Fabriquer, ×10, ×50, ×100, ×1 000, Max</b> lancent des commandes et fabriquent aussi les pièces qui manquent, <b>🎯 Suivre</b> montre ce qui manque en haut du Domaine. Les <b>Machines</b> aident tes mains sur les commandes.</p>" +
        "<p><b>📜 Journal.</b> Fragments d’histoire, secrets, mélodies. Sa deuxième page, le <b>Cosmos</b>, s’ouvre plus tard.</p>" +
        "<p><b>📈 Niveaux.</b> Chaque action, et la récolte, monte jusqu’au niveau 99 quand tu fabriques ou récoltes toi-même : 1 % plus rapide par niveau, et une chance d’avoir une pièce en plus aux niveaux 10, 25, 50, 75 et 99.</p>" +
        "<p><b>Jeu fermé.</b> Les extracteurs, les commandes et l’exploration continuent pendant 12 h au plus.</p>" +
        "<p><b>💾 Sauvegardes.</b> Menu ☰ : télécharge ta partie dans un fichier pour la garder à l’abri ou changer d’appareil.</p></div>", "Compris");
    }

    function promptCapsuleText() {
      const current = E.getCapsuleText ? E.getCapsuleText() : "";
      const html = '<div class="kicker">Capsule temporelle</div>' +
        '<h2>Ce que tu veux dire à celui qui viendra</h2>' +
        '<p class="small muted">Tu peux graver un message de 140 signes au plus pour le Semeur qui prendra la suite.</p>' +
        '<form id="capsuleForm" class="capsule-form">' +
        '<div class="fld">' +
        '<textarea id="capsuleInput" class="input" maxlength="140" rows="3" placeholder="Garde courage…">' + esc(current) + '</textarea>' +
        '<div class="tiny dim right" id="capsuleCharCount" style="margin-top:4px">' + (140 - current.length) + ' signes restants</div>' +
        '</div>' +
        '<div class="acts" style="margin-top:12px">' +
        '<button type="submit" class="btn pri">Graver</button>' +
        '<button type="button" class="btn" data-m="close">Passer</button>' +
        '</div>' +
        '</form>';
      openModal({
        html,
        onOpen: (box) => {
          const form = box.querySelector("#capsuleForm");
          const input = box.querySelector("#capsuleInput");
          const counter = box.querySelector("#capsuleCharCount");
          if (input) {
            setTimeout(() => { try { input.focus(); } catch (e) {} }, 100);
            input.addEventListener("input", () => {
              const rem = 140 - input.value.length;
              if (counter) counter.textContent = rem + " signes restants";
            });
          }
          if (form) {
            form.addEventListener("submit", (ev) => {
              ev.preventDefault();
              const val = input ? input.value.trim() : "";
              if (E.setCapsuleText) E.setCapsuleText(val);
              closeModal();
              toast("⏳ Ton message est scellé dans la capsule.");
            });
          }
        }
      });
    }

    return { openMenu, openAccount, downloadSave, showBadSave, showNews, cloudTimers, cloudCheck, promptCapsuleText };
  }

  window.EclatCompte = { create };
})();
