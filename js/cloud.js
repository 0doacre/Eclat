/* ÉCLAT — compte joueur et sauvegarde en ligne.
 * Le mot de passe ne quitte jamais l’appareil : on en dérive (PBKDF2, 400 000
 * tours) une clé de connexion, envoyée au serveur, et une clé de chiffrement,
 * gardée ici. La sauvegarde est compressée puis chiffrée (AES-GCM) avant l’envoi :
 * le serveur ne stocke que du texte illisible.
 * Chaque compte a trois emplacements en ligne (1 à 3). L’un d’eux est l’emplacement
 * actif : c’est là que vont les envois automatiques de cet appareil. */
(function (root) {
  "use strict";
  const ITER = 400000;
  const VER = "eclat/v1/";
  const SLOTS = 3;
  const enc = new TextEncoder(), dec = new TextDecoder();

  const hex = (b) => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  function b64(bytes) {
    let s = "";
    const b = new Uint8Array(bytes);
    for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
    return btoa(s);
  }
  function unb64(s) {
    const t = atob(s), b = new Uint8Array(t.length);
    for (let i = 0; i < t.length; i++) b[i] = t.charCodeAt(i);
    return b;
  }
  async function pipe(bytes, stream) {
    const s = new Blob([bytes]).stream().pipeThrough(stream);
    return new Uint8Array(await new Response(s).arrayBuffer());
  }
  const canZip = () => typeof CompressionStream !== "undefined" && typeof DecompressionStream !== "undefined";
  const normPseudo = (p) => String(p || "").normalize("NFC").trim();

  /* les deux clés tirées du mot de passe */
  async function derive(pseudo, password) {
    const salt = enc.encode(VER + normPseudo(pseudo).toLowerCase());
    const base = await crypto.subtle.importKey("raw", enc.encode(String(password).normalize("NFC")), "PBKDF2", false, ["deriveBits"]);
    const bits = new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: ITER }, base, 512));
    return { auth: hex(bits.slice(0, 32)), key: b64(bits.slice(32)) };
  }
  async function seal(key, text) {
    const k = await crypto.subtle.importKey("raw", unb64(key), "AES-GCM", false, ["encrypt"]);
    const zip = canZip();
    const data = zip ? await pipe(enc.encode(text), new CompressionStream("gzip")) : enc.encode(text);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, k, data);
    return { data: (zip ? "z:" : "") + b64(ct), iv: b64(iv) };
  }
  async function open(key, data, iv) {
    const k = await crypto.subtle.importKey("raw", unb64(key), "AES-GCM", false, ["decrypt"]);
    const zip = data.startsWith("z:");
    let plain;
    try { plain = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(iv) }, k, unb64(zip ? data.slice(2) : data))); }
    catch (e) { throw cloudError(0, "decrypt", "Impossible de déchiffrer la sauvegarde en ligne. Le mot de passe a peut-être changé sur un autre appareil : reconnecte-toi."); }
    return dec.decode(zip ? await pipe(plain, new DecompressionStream("gzip")) : plain);
  }
  function cloudError(status, code, message) {
    const e = new Error(message);
    e.status = status; e.code = code;
    return e;
  }

  /* opts : { server: () => adresse, storage, fetch } */
  function create(opts) {
    const store = opts.storage;
    const KEY = "eclat.account";
    const doFetch = opts.fetch || ((u, o) => root.fetch(u, o));
    const C = {};
    let acc = null;
    try { acc = JSON.parse(store.getItem(KEY) || "null"); } catch (e) { acc = null; }
    function persist() { try { if (acc) store.setItem(KEY, JSON.stringify(acc)); else store.removeItem(KEY); } catch (e) { /* stockage plein ou bloqué */ } }

    /* l’emplacement actif, et ce qu’on sait de chacun (numéro de version et date) */
    const activeSlot = (a) => (a && a.slot >= 1 && a.slot <= SLOTS ? a.slot : 1);
    function revOf(a, slot) {
      if (!a) return 0;
      // ancien compte enregistré avant les emplacements : son unique sauvegarde est la 1
      if (!a.revs) return slot === activeSlot(a) ? a.rev || 0 : 0;
      const m = a.revs[slot];
      return m && typeof m.rev === "number" ? m.rev : 0;
    }
    function updatedOf(a, slot) {
      if (!a) return 0;
      if (!a.revs) return slot === activeSlot(a) ? a.last || 0 : 0;
      const m = a.revs[slot];
      return m && m.updated ? m.updated : 0;
    }
    function remember(a, slot, rev, updated) {
      if (!a) return;
      a.revs = a.revs || {};
      a.revs[slot] = { rev, updated: updated || 0 };
      if (slot === activeSlot(a)) { a.rev = rev; a.last = updated || 0; }
      persist();
    }

    C.server = () => String(opts.server() || "").replace(/\/+$/, "");
    C.configured = () => !!C.server();
    C.account = () => (acc && acc.server === C.server() ? acc : null);
    C.SLOTS = SLOTS;

    async function api(method, path, body, auth) {
      const headers = { "content-type": "application/json" };
      if (auth) headers.authorization = "Bearer " + auth;
      let res;
      try { res = await doFetch(C.server() + path, { method, headers, body: body ? JSON.stringify(body) : undefined, keepalive: !!(body && body.keepalive) }); }
      catch (e) {
        // sans réponse lisible : réseau coupé, serveur arrêté, ou serveur qui refuse l’adresse du jeu (ALLOWED_ORIGIN)
        const adresse = root.location && root.location.origin && root.location.origin !== "null" ? root.location.origin : "";
        throw cloudError(0, "network", "Le serveur ne répond pas. Vérifie ta connexion." + (adresse ? " Si elle va bien, le serveur refuse peut-être cette adresse du jeu : " + adresse + " (réglage ALLOWED_ORIGIN du serveur)." : ""));
      }
      let o = {};
      try { o = await res.json(); } catch (e) { /* réponse vide */ }
      if (!res.ok) {
        const err = cloudError(res.status, o.error || "http", o.message || "Erreur " + res.status + ".");
        err.body = o;
        if (res.status === 401 && o.error === "session" && acc) { acc.token = null; persist(); }
        throw err;
      }
      return o;
    }
    function begin(r, k) {
      // on garde l’emplacement actif et le réglage d’envoi de ce même compte sur cet appareil
      const prev = acc && acc.server === C.server() && String(acc.pseudo).toLowerCase() === String(r.pseudo).toLowerCase() ? acc : null;
      acc = { server: C.server(), pseudo: r.pseudo, token: r.token, key: k.key, slot: prev && prev.slot >= 1 && prev.slot <= SLOTS ? prev.slot : 1, rev: 0, revs: {}, auto: prev ? prev.auto !== false : true, last: 0 };
      persist();
      return acc;
    }
    C.register = async (pseudo, password) => { const k = await derive(pseudo, password); return begin(await api("POST", "/api/register", { pseudo: normPseudo(pseudo), auth: k.auth }), k); };
    C.login = async (pseudo, password) => { const k = await derive(pseudo, password); return begin(await api("POST", "/api/login", { pseudo: normPseudo(pseudo), auth: k.auth }), k); };
    C.logout = async () => {
      const a = C.account();
      acc = null; persist();
      if (a && a.token) try { await api("POST", "/api/logout", null, a.token); } catch (e) { /* tant pis : la session expirera */ }
    };
    const need = () => {
      const a = C.account();
      if (!a || !a.token) throw cloudError(401, "session", "Connecte-toi d’abord.");
      return a;
    };
    /* ce que le serveur garde : { slot, rev, updated } pour chaque emplacement occupé */
    C.slots = async () => {
      const a = need();
      let list;
      try {
        const r = await api("GET", "/api/saves", null, a.token);
        list = (Array.isArray(r.slots) ? r.slots : []).filter((x) => x && x.slot >= 1 && x.slot <= SLOTS);
        a.legacy = false;
      } catch (e) {
        if (e.status !== 404) throw e;
        // serveur installé avant les emplacements : une seule sauvegarde, la 1
        a.legacy = true;
        a.slot = 1;
        const p = await C.pull(1);
        list = p ? [{ slot: 1, rev: p.rev, updated: p.updated }] : [];
      }
      a.revs = {};
      for (const x of list) a.revs[x.slot] = { rev: x.rev || 0, updated: x.updated || 0 };
      a.rev = revOf(a, activeSlot(a));
      a.last = updatedOf(a, activeSlot(a));
      persist();
      return list;
    };
    /* choisis l’emplacement où iront les prochains envois automatiques */
    C.useSlot = (slot) => {
      const a = need();
      const n = Number(slot);
      if (!Number.isInteger(n) || n < 1 || n > SLOTS) throw cloudError(400, "slot", "Emplacement inconnu : 1, 2 ou 3.");
      const rev = revOf(a, n), updated = updatedOf(a, n);
      a.slot = n;
      a.rev = rev;
      a.last = updated;
      persist();
      return n;
    };
    /* une sauvegarde en ligne, déchiffrée (ou null si l’emplacement est vide) */
    C.pull = async (slot) => {
      const a = need();
      const n = slot === undefined || slot === null ? activeSlot(a) : Number(slot);
      if (!Number.isInteger(n) || n < 1 || n > SLOTS) throw cloudError(400, "slot", "Emplacement inconnu : 1, 2 ou 3.");
      let r;
      try { r = await api("GET", "/api/save?slot=" + n, null, a.token); }
      catch (e) { if (e.status === 404) { remember(a, n, 0, 0); return null; } throw e; }
      const text = await open(a.key, r.data, r.iv);
      remember(a, n, r.rev, r.updated);
      return { text, rev: r.rev, updated: r.updated, slot: n };
    };
    /* envoie la sauvegarde dans un emplacement (actif par défaut) ;
     * { conflict } si une autre version est arrivée entre-temps */
    C.push = async (text, o) => {
      const a = need();
      const n = o && o.slot !== undefined ? Number(o.slot) : activeSlot(a);
      if (!Number.isInteger(n) || n < 1 || n > SLOTS) throw cloudError(400, "slot", "Emplacement inconnu : 1, 2 ou 3.");
      const s = await seal(a.key, text);
      try {
        const r = await api("PUT", "/api/save", { slot: n, data: s.data, iv: s.iv, rev: revOf(a, n), force: !!(o && o.force), keepalive: !!(o && o.keepalive) }, a.token);
        remember(a, n, r.rev, r.updated);
        return { ok: true, slot: n, rev: r.rev, updated: r.updated };
      } catch (e) {
        if (e.status === 409) return { conflict: true, slot: n, rev: e.body.rev, updated: e.body.updated };
        throw e;
      }
    };
    /* on a choisi une version en ligne : on repart de son numéro */
    C.adopt = (rev, updated, slot) => {
      const a = need();
      const n = slot === undefined || slot === null ? activeSlot(a) : Number(slot);
      remember(a, n, rev || 0, updated);
    };
    /* vide un emplacement en ligne (la partie de l’appareil n’est pas touchée) */
    C.erase = async (slot) => {
      const a = need();
      const n = slot === undefined || slot === null ? activeSlot(a) : Number(slot);
      if (!Number.isInteger(n) || n < 1 || n > SLOTS) throw cloudError(400, "slot", "Emplacement inconnu : 1, 2 ou 3.");
      await api("DELETE", "/api/save?slot=" + n, null, a.token);
      remember(a, n, 0, 0);
      return n;
    };
    C.setAuto = (v) => { const a = need(); a.auto = !!v; persist(); };
    C.changePassword = async (oldPw, newPw, text) => {
      const a = need();
      const o = await derive(a.pseudo, oldPw), n = await derive(a.pseudo, newPw);
      // les trois emplacements sont relus puis rechiffrés avec la nouvelle clé
      const list = await C.slots();
      const saves = [];
      for (const x of list) {
        const p = await C.pull(x.slot);
        if (!p) continue;
        const s = await seal(n.key, text && x.slot === activeSlot(a) ? text : p.text);
        saves.push({ slot: x.slot, data: s.data, iv: s.iv });
      }
      if (text && !saves.some((s) => s.slot === activeSlot(a))) {
        const s = await seal(n.key, text);
        saves.push({ slot: activeSlot(a), data: s.data, iv: s.iv });
      }
      // data/iv (emplacement actif) : les serveurs d’avant les emplacements ne lisent que ça
      const payload = { auth: o.auth, newAuth: n.auth, saves };
      const act = saves.find((s) => s.slot === activeSlot(a));
      if (act) { payload.data = act.data; payload.iv = act.iv; }
      const r = await api("POST", "/api/password", payload, a.token);
      a.token = r.token; a.key = n.key; persist();
      try { await C.slots(); } catch (e) { /* la liste se rafraîchira plus tard */ }
      return true;
    };
    C.deleteAccount = async (password) => {
      const a = need();
      const k = await derive(a.pseudo, password);
      await api("DELETE", "/api/account", { auth: k.auth }, a.token);
      acc = null; persist();
      return true;
    };
    C.health = () => api("GET", "/api/health");
    return C;
  }

  const API = { create, derive, seal, open, ITER, SLOTS };
  root.EclatCloud = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
