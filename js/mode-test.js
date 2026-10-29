/* Éclat — bac à sable local, isolé de la partie et du compte. */
(function (root) {
  "use strict";
  const CODE = "ECLAT-ATELIER";
  function config(preview, url, session) {
    const regular = preview ? "eclat.preview.craft.v1" : "eclat.save.v1";
    let active = false;
    try { active = new URL(url).searchParams.get("mode-test") === "1" && (session || root.sessionStorage).getItem(regular + ".test-authorized") === "1"; } catch (_) {}
    return {regular, active, key: active ? regular + ".test" : regular,
      backups: (preview ? "eclat.preview.craft.backups" : "eclat.backups") + (active ? ".test" : ""),
      lock: (preview ? "eclat-preview-craft" : "eclat-partie") + (active ? "-test" : "")};
  }
  function controller(E, D) {
    function age(a) { a = Number(a); if (!Number.isInteger(a) || a < 0 || a >= D.AGES.length) throw Error("Âge invalide."); return a; }
    function make(s, id) { if (!D.ITEMS[id]) return; s.known[id] = true; s.seen[id] = true; s.made[id] = Math.max(1, s.made[id] || 0); s.inv[id] = Math.max(1, s.inv[id] || 0); }
    function explore(s, z, n) {
      const zone = E.ZONES[z]; if (!zone) throw Error("Terre inconnue.");
      s.exp.done[z] = Math.max(s.exp.done[z] || 0, n);
      zone.exps.slice(0, n).forEach(x => {
        const frag = x.rw && x.rw.frag; if (frag) s.frags[frag] = true;
        const current = E.RECIT && E.RECIT.expFrag && E.RECIT.expFrag[z + ":" + x.id]; if (current) s.frags[current] = true;
      });
    }
    function passage(s, z) {
      const zone = E.ZONES[z]; if (!zone) throw Error("Terre inconnue.");
      if (zone.req && zone.req[0] !== "@") make(s, zone.req);
      s.pass[z] = {done: true, paid: D.PASSAGES[z] ? E.passCost(z) : {}}; s.zones[z] = true;
    }
    function complete(s, ob) {
      if (!ob) return;
      if (ob.k === "craft") make(s, ob.id);
      else if (ob.k === "exp") explore(s, ob.z, E.ZONES[ob.z].exps.findIndex(x => x.id === ob.x) + 1);
      else if (ob.k === "pass") passage(s, ob.z);
      else if (ob.k === "ext") s.flags.extDone = true;
      else if (ob.k === "line") s.flags.lineDone = true;
    }
    function apply(fn) {
      const s = JSON.parse(E.serialize()); fn(s);
      s.introSeen = true; s.meta.forcedDone = true; s.settings.tuto = false; s.settings.visiteurs = false;
      s.flags.ver = D.VERSION; if (s.made.gants) s.flags.ageGants = 1;
      s.t = Date.now(); E.load(s); E.emit("struct");
    }
    return {
      prepare(a) {
        a = age(a); const settings = JSON.parse(JSON.stringify(E.state.settings)); E.reset();
        apply(s => {
          s.settings = settings;
          E.milestones().slice(0, a).forEach(list => list.forEach(m => complete(s, m.ob)));
          Object.entries(E.ZONES).forEach(([z, zone]) => {
            if (!zone.secret && D.ITEMS[zone.req] && D.ITEMS[zone.req].a < a) passage(s, z);
          });
          s.age = a;
        });
      },
      recipes(a, manufactured) { a = age(a); apply(s => Object.entries(D.ITEMS).forEach(([id, it]) => {
        if (it.a === a && it.r) { s.known[id] = true; s.seen[id] = true; if (manufactured) make(s, id); }
      })); },
      resources(a) { a = age(a); apply(s => Object.entries(D.ITEMS).forEach(([id, it]) => { if (it.t === "res" && it.a <= a) s.inv[id] = Math.min(1e12, (s.inv[id] || 0) + 10000); })); },
      objective() { const ob = E.objective(); apply(s => complete(s, ob)); },
      passage(z) { apply(s => passage(s, z)); },
      explore(z) { apply(s => { passage(s, z); explore(s, z, E.ZONES[z].exps.length); }); },
      finish() { const x = E.state.exp.active; if (!x) throw Error("Aucune exploration en cours."); x.t0 = Date.now() - x.dur - 100; }
    };
  }
  function create(api) {
    const {E, D, config: cfg, esc, openModal, closeModal, save, render, setTab, canWrite} = api;
    const commands = controller(E, D);
    function quit() { save(); sessionStorage.removeItem(cfg.regular + ".test-authorized"); const u = new URL(location.href); u.searchParams.delete("mode-test"); location.assign(u.href); }
    function open() {
      if (!cfg.active) {
        openModal({html: '<h2>Mode test</h2><p>Crée une copie locale de ta partie pour essayer librement les nouveautés. Ta partie normale reste conservée.</p><label>Code de test <input id="testCode" autocomplete="off" autocapitalize="characters"></label><p id="testError" role="status"></p><div class="acts"><button class="btn pri" data-m="activate">Créer la copie</button><button class="btn" data-m="close">Annuler</button></div>', on: {activate: () => {
          try {
            if (document.getElementById("testCode").value.trim().toUpperCase() !== CODE) throw Error("Code incorrect.");
            if (!canWrite() || !save()) throw Error("La sauvegarde doit être disponible avant de créer la copie.");
            const raw = E.serialize();
            localStorage.setItem(cfg.regular + ".before-test", raw);
            localStorage.setItem(cfg.regular + ".test", raw);
            if (localStorage.getItem(cfg.regular + ".test") !== raw || localStorage.getItem(cfg.regular + ".before-test") !== raw) throw Error("La copie n’a pas pu être enregistrée.");
            sessionStorage.setItem(cfg.regular + ".test-authorized", "1");
            const u = new URL(location.href); u.searchParams.set("mode-test", "1"); location.assign(u.href);
          } catch (e) { document.getElementById("testError").textContent = e.message; }
          return true;
        }}}); return;
      }
      const ob = E.objective();
      openModal({html: '<h2>Atelier de test</h2><p>Copie locale · aucun envoi au compte en ligne.</p><div class="test-controls"><label>Âge à examiner<select id="testAge">' + D.AGES.map((a,i) => '<option value="'+i+'"'+(i===E.state.age?' selected':'')+'>'+esc((i+1)+' · '+(a.n || a.name || a))+'</option>').join('') + '</select></label><button class="btn" data-m="prepare">Recommencer à cet âge</button><small>Recrée la copie au début de cet âge, avec les étapes précédentes validées.</small><button class="btn" data-m="recipes">Apprendre toutes ses recettes</button><button class="btn" data-m="made">Obtenir tous ses objets</button><button class="btn" data-m="resources">+10 000 matières des âges atteints</button><p>Objectif : '+esc(ob ? ob.txt || ob.id || ob.k : 'tout est terminé')+'</p><button class="btn" data-m="objective">Valider l’objectif actuel</button><label>Terre<select id="testZone">'+Object.entries(E.ZONES).filter(([,z])=>!z.secret).map(([id,z])=>'<option value="'+esc(id)+'">'+esc(z.n || id)+'</option>').join('')+'</select></label><button class="btn" data-m="passage">Ouvrir son passage</button><button class="btn" data-m="explore">Révéler tous ses lieux</button><button class="btn" data-m="finish">Terminer l’exploration en cours</button><p id="testError" role="status"></p><button class="btn pri" data-m="quit">Revenir à ma partie</button><button class="btn" data-m="close">Fermer</button></div>', on: Object.fromEntries(['prepare','recipes','made','resources','objective','passage','explore','finish','quit'].map(k=>[k,()=>{
        try {
          if (!canWrite()) throw Error("Cette copie est ouverte en lecture seule.");
          const a = document.getElementById('testAge').value, z = document.getElementById('testZone').value;
          if (k === 'quit') { quit(); return true; }
          if (k === 'made') commands.recipes(a,true);
          else if (['passage','explore'].includes(k)) commands[k](z);
          else commands[k](a);
          save(); closeModal(); setTab('domaine'); render(true);
        } catch (e) { document.getElementById('testError').textContent = e.message; }
        return true;
      }]))});
    }
    function mount() {
      if (!cfg.active) return;
      const bar = document.getElementById('testModeBar'); bar.classList.remove('hidden');
      bar.innerHTML = '<b>Mode test · copie locale</b><button class="btn" id="testCommands">Commandes</button><button class="btn" id="testQuit">Ma partie</button>';
      document.getElementById('testCommands').onclick = open; document.getElementById('testQuit').onclick = quit;
    }
    return {open, mount};
  }
  const api = {config, controller, create};
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.EclatModeTest = api;
})(typeof window !== "undefined" ? window : globalThis);
