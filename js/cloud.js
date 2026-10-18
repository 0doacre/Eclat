/* ÉCLAT — compte joueur et sauvegarde en ligne.
 * Le mot de passe ne quitte jamais l’appareil : on en dérive (PBKDF2, 400 000
 * tours) une clé de connexion, envoyée au serveur, et une clé de chiffrement,
 * gardée ici. La sauvegarde est compressée puis chiffrée (AES-GCM) avant l’envoi :
 * le serveur ne stocke que du texte illisible. */
(function (root) {
  "use strict";
  const ITER = 400000;
  const VER = "eclat/v1/";
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

    C.server = () => String(opts.server() || "").replace(/\/+$/, "");
    C.configured = () => !!C.server();
    C.account = () => (acc && acc.server === C.server() ? acc : null);

    async function api(method, path, body, auth) {
      const headers = { "content-type": "application/json" };
      if (auth) headers.authorization = "Bearer " + auth;
      let res;
      try { res = await doFetch(C.server() + path, { method, headers, body: body ? JSON.stringify(body) : undefined, keepalive: !!(body && body.keepalive) }); }
      catch (e) { throw cloudError(0, "network", "Le serveur ne répond pas. Vérifie ta connexion."); }
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
      acc = { server: C.server(), pseudo: r.pseudo, token: r.token, key: k.key, rev: 0, auto: acc && acc.server === C.server() ? acc.auto !== false : true, last: 0 };
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
    /* la sauvegarde en ligne, déchiffrée (ou null s’il n’y en a pas) */
    C.pull = async () => {
      const a = need();
      let r;
      try { r = await api("GET", "/api/save", null, a.token); }
      catch (e) { if (e.status === 404) { a.rev = 0; persist(); return null; } throw e; }
      const text = await open(a.key, r.data, r.iv);
      return { text, rev: r.rev, updated: r.updated };
    };
    /* envoie la sauvegarde ; { conflict } si une autre version est arrivée entre-temps */
    C.push = async (text, o) => {
      const a = need();
      const s = await seal(a.key, text);
      try {
        const r = await api("PUT", "/api/save", { data: s.data, iv: s.iv, rev: a.rev, force: !!(o && o.force), keepalive: !!(o && o.keepalive) }, a.token);
        a.rev = r.rev; a.last = r.updated; persist();
        return { ok: true, rev: r.rev, updated: r.updated };
      } catch (e) {
        if (e.status === 409) return { conflict: true, rev: e.body.rev, updated: e.body.updated };
        throw e;
      }
    };
    /* on a choisi la version en ligne : on repart de son numéro */
    C.adopt = (rev, updated) => { const a = need(); a.rev = rev; a.last = updated || Date.now(); persist(); };
    C.setAuto = (v) => { const a = need(); a.auto = !!v; persist(); };
    C.changePassword = async (oldPw, newPw, text) => {
      const a = need();
      const o = await derive(a.pseudo, oldPw), n = await derive(a.pseudo, newPw);
      const s = text ? await seal(n.key, text) : {};
      const r = await api("POST", "/api/password", { auth: o.auth, newAuth: n.auth, data: s.data, iv: s.iv }, a.token);
      a.token = r.token; a.key = n.key; a.rev = text ? a.rev + 1 : a.rev; persist();
      try { const p = await api("GET", "/api/save", null, a.token); a.rev = p.rev; a.last = p.updated; persist(); } catch (e) { /* pas de sauvegarde */ }
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

  const API = { create, derive, seal, open, ITER };
  root.EclatCloud = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
