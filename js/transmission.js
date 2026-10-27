/* Mémoire documentaire : locale, facultative et limitée aux pages déjà trouvées. */
(function (root) {
  'use strict';
  const IDS = ['encre', 'papyrus', 'papier', 'presse_imprimer', 'serveur_archives', 'radio', 'ordinateur', 'ia'];
  function attach(E) {
    function state() {
      const S = E.state;
      let t = S.meta.transmission;
      if (!t || typeof t !== 'object' || Array.isArray(t)) t = {};
      const acquis = {};
      for (const id of IDS) if ((t.acquis && t.acquis[id] === true) || S.made[id] > 0) acquis[id] = true;
      const notes = (Array.isArray(t.notes) ? t.notes : []).filter(n => n && typeof n.texte === 'string').slice(-50).map(n => ({ texte: n.texte.slice(0, 500), cycle: Math.max(1, Math.floor(Number(n.cycle)) || 1) }));
      const copies = {};
      for (const c of E.livre()) if (c.id && t.copies && t.copies[c.id] === true) copies[c.id] = true;
      S.meta.transmission = { acquis, notes, copies };
      return S.meta.transmission;
    }
    E.transmission = () => {
      const t = state(), a = t.acquis;
      return { acquis: { ...a }, notes: t.notes.map(n => ({ ...n })), copies: Object.keys(t.copies).length,
        ecrire: !!a.papyrus, imprimer: !!a.presse_imprimer, chercher: !!a.serveur_archives,
        reseau: !!(a.serveur_archives && a.radio), rapprocher: !!(a.serveur_archives && a.ia) };
    };
    E.transmissionNote = texte => {
      const t = state();
      if (!t.acquis.papyrus) return { ok: false, why: 'support' };
      if (typeof texte !== 'string' || !texte.trim() || texte.length > 500) return { ok: false, why: 'texte' };
      if (t.notes.length >= 50) return { ok: false, why: 'plein' };
      t.notes.push({ texte: texte.trim(), cycle: E.state.cycle }); E.emit('struct'); return { ok: true };
    };
    E.transmissionCopier = () => {
      const t = state(); if (!t.acquis.presse_imprimer) return { ok: false, why: 'presse' };
      let n = 0;
      for (const c of E.livre()) if (c.id && !t.copies[c.id]) { t.copies[c.id] = true; n++; }
      E.emit('struct'); return { ok: true, n };
    };
    E.transmissionChercher = q => {
      if (!state().acquis.serveur_archives || typeof q !== 'string') return [];
      const norm = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const vides = new Set('le la les de des du un une et ou au aux que qui est sont dans pour avec je tu nous il elle ce ces se'.split(' '));
      const mots = (norm(q.slice(0, 100)).match(/[a-z0-9_]+/g) || []).filter(m => m.length > 1 && !vides.has(m));
      if (!mots.length) return [];
      // c.notes est filtré par les conditions du récit ; ne jamais lire page.notes.
      return E.livre().filter(c => c.page).map(c => {
        const texte = [c.page.titre, c.page.imprime, ...c.notes.map(n => n.t)].filter(Boolean).join('\n');
        const lisible = norm(texte.replace(/\[[^\]]*\]/g, ''));
        const score = mots.filter(m => lisible.includes(m)).length;
        return { id: c.id, n: c.n, titre: c.page.titre, score };
      }).filter(c => c.score > 0).sort((a, b) => b.score - a.score || a.n - b.n).slice(0, 8);
    };
    const cycle = E.newCycle, serialize = E.serialize;
    E.newCycle = function () { state(); return cycle.apply(E, arguments); };
    E.serialize = function () { state(); return serialize.apply(E, arguments); };
    E.transmissionEffacerNote = index => {
      const t = state();
      if (!Number.isInteger(index) || index < 0 || index >= t.notes.length) return false;
      t.notes.splice(index, 1); E.emit('struct'); return true;
    };
    E.on('discover', () => state());
    E.on('cycle', () => state());
  }
  function html(E, U, esc) {
    const t = E.transmission(), D = E.D, stages = D.TRANSMISSION;
    let h = '<section class="card transmission"><h3>Ce qui passe d’un Semeur à l’autre</h3><p class="small">Les mains gardent les gestes. Le Livre conserve les témoignages. Tes notes gardent ce que tu en as compris.</p>';
    h += '<details><summary>Écrire, copier, relier</summary><p class="tiny muted">Cette voie est facultative. Les pages et les recettes déjà acquises restent conservées, quel que soit ton équipement.</p>';
    for (const x of stages) {
      const connu = x.ids.every(id => t.acquis[id]);
      const visible = connu || x.ids.some(id => E.state.known[id] || E.state.seen[id]) || x.age <= E.state.age;
      if (!visible) continue;
      h += '<div class="card"><b>' + (connu ? '✓ ' : '') + esc(x.n) + '</b><p class="small">' + esc(x.d) + '</p>';
      if (!connu) h += '<p class="tiny">À fabriquer : ' + x.ids.filter(id => !t.acquis[id]).map(id => '<button class="btn small ghost" data-goto="' + id + '">' + esc(D.ITEMS[id].n) + '</button>').join(' ') + '</p>';
      h += '<details><summary>Comprendre la technique</summary><p class="small">' + esc(x.tech) + '</p></details></div>';
    }
    h += '</details>';
    if (t.ecrire) {
      h += '<details><summary>Notes des Semeurs (' + t.notes.length + ')</summary><form data-trans-note><label class="small">Une observation pour la suite<textarea name="note" maxlength="500" rows="3" style="width:100%;box-sizing:border-box" required></textarea></label><button class="btn small" type="submit">Laisser une note</button><span class="tiny muted"> ' + t.notes.length + '/50 · 500 caractères au plus</span></form>';
      for (const [i, n] of t.notes.entries()) h += '<p class="small" style="white-space:pre-wrap">' + esc(n.texte) + '<br><span class="tiny muted">Semeur du cycle ' + n.cycle + '</span> <button class="btn small ghost" data-trans-delete="' + i + '">Effacer cette note</button></p>';
      h += '</details>';
    }
    if (t.imprimer) h += '<p class="small">' + t.copies + ' pages retrouvées ont une copie dans ton registre.</p><button class="btn small" data-trans-copy>Copier les pages retrouvées</button>';
    if (t.chercher) {
      h += '<h4>' + (t.rapprocher ? 'Interroger les archives' : 'Retrouver un passage') + '</h4><form data-trans-search><label class="small">Mots à rechercher<input name="query" maxlength="100" value="' + esc(U.transQuery || '') + '" style="width:100%;box-sizing:border-box"></label><button class="btn small" type="submit">Chercher dans mes pages</button></form>';
      if (t.reseau) h += '<p class="tiny muted">Le poste radio et le serveur relient les provenances de tes documents ; aucune page inconnue n’est récupérée automatiquement.</p>';
      if (t.rapprocher) h += '<p class="small">La voix propose des rapprochements. Lis les documents pour les vérifier. Ici, les résultats sont retrouvés localement par mots-clés, sans réponse générée.</p>';
      if (U.transQuery) {
        const res = E.transmissionChercher(U.transQuery);
        h += res.length ? '<p class="tiny muted">Documents retrouvés dans les pages déjà acquises :</p>' + res.map(c => '<button class="btn small ghost" data-page="' + c.id + '">Page ' + c.n + ' · ' + esc(c.titre) + '</button>').join(' ') : '<p class="small">Aucun passage retrouvé dans tes pages avec ces mots.</p>';
      }
    }
    return h + '</section>';
  }
  const API = { attach, html }; root.EclatTransmission = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
