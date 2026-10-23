/* ÉCLAT — serveur des comptes joueurs (Cloudflare Worker + base D1).
 *
 * Ce que le serveur voit : un pseudo, une « clé de connexion » dérivée du mot de
 * passe par le jeu (jamais le mot de passe lui-même), et la sauvegarde chiffrée
 * par le jeu avant l’envoi. Il ne peut pas la lire.
 *
 * Routes (toutes en JSON) :
 *   POST   /api/register   { pseudo, auth }            → { token, pseudo }
 *   POST   /api/login      { pseudo, auth }            → { token, pseudo }
 *   POST   /api/logout                                 → { ok }
 *   GET    /api/saves                                  → { slots: [{ slot, rev, updated }] }
 *   GET    /api/save?slot=1                            → { slot, data, iv, rev, updated } | 404
 *   PUT    /api/save       { slot, data, iv, rev }     → { slot, rev, updated } | 409 { rev, updated }
 *   DELETE /api/save?slot=1                            → { ok }
 *   POST   /api/password   { auth, newAuth,
 *                            saves: [{ slot, data, iv }] } → { token }
 *   DELETE /api/account    { auth }                    → { ok }
 *   GET    /api/health                                 → { ok, version }
 * Les routes de sauvegarde demandent l’en-tête « Authorization: Bearer <jeton> ».
 * Chaque compte a trois emplacements (slot 1 à 3) ; sans précision, c’est le 1.
 *
 * Variables : DB (base D1, obligatoire), ALLOWED_ORIGIN (adresse du jeu, par
 * exemple https://pseudo.github.io ; plusieurs adresses séparées par des virgules). */

const VERSION = 2;
const MAX_SAVE = 1024 * 1024; // 1 Mo de texte chiffré par emplacement
const SLOTS = 3;
const SESSION_DAYS = 60;
const MAX_FAILS = 8; // essais ratés avant blocage
const BLOCK_MIN = 15;
const MAX_SIGNUPS = 5; // comptes créés par heure et par adresse IP

export default {
  async fetch(req, env) {
    const cors = corsHeaders(req, env);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    try {
      const res = await route(req, env);
      for (const k in cors) res.headers.set(k, cors[k]);
      return res;
    } catch (e) {
      // base pas encore migrée : le message doit dire quoi faire au propriétaire
      const stale = !e.expose && /no such (column|table)/i.test(String(e.message || ""));
      const res = json({
        error: stale ? "schema" : e.code || "server",
        message: e.expose ? e.message : stale ? "La base des comptes doit être mise à jour : exécute server/migration-2.sql dans sa console." : "Erreur du serveur."
      }, e.status || 500);
      for (const k in cors) res.headers.set(k, cors[k]);
      return res;
    }
  }
};

/* ------------------------------------------------------------ outils */
function fail(status, code, message) {
  const e = new Error(message);
  e.status = status; e.code = code; e.expose = true;
  return e;
}
const json = (o, status) => new Response(JSON.stringify(o), { status: status || 200, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
function corsHeaders(req, env) {
  const origin = req.headers.get("origin") || "";
  const allowed = String(env.ALLOWED_ORIGIN || "").split(",").map((s) => s.trim()).filter(Boolean);
  const local = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  const ok = allowed.includes("*") || allowed.includes(origin) || local;
  return ok && origin ? {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
    "access-control-allow-headers": "content-type, authorization",
    "access-control-max-age": "86400",
    vary: "origin"
  } : { vary: "origin" };
}
const enc = new TextEncoder();
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
async function sha256(str) { return hex(await crypto.subtle.digest("SHA-256", enc.encode(str))); }
function randomHex(n) { const b = new Uint8Array(n); crypto.getRandomValues(b); return hex(b); }
function sameText(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
async function body(req) {
  const t = await req.text();
  // un changement de mot de passe renvoie les trois emplacements d’un coup
  if (t.length > MAX_SAVE * SLOTS + 65536) throw fail(413, "too_big", "Sauvegarde trop lourde.");
  try { return t ? JSON.parse(t) : {}; } catch (e) { throw fail(400, "bad_json", "Requête illisible."); }
}
/* l’emplacement demandé (1 à 3) ; par défaut le 1 */
function slotOf(v) {
  const n = v === undefined || v === null || v === "" ? 1 : Number(v);
  if (!Number.isInteger(n) || n < 1 || n > SLOTS) throw fail(400, "slot", "Emplacement inconnu : 1, 2 ou 3.");
  return n;
}
/* un pseudo : 3 à 24 lettres, chiffres, tirets, points ou soulignés ; la casse ne compte pas */
function pseudoOf(p) {
  const display = String(p || "").normalize("NFC").trim();
  if (!/^[\p{L}\p{N}_.-]{3,24}$/u.test(display)) throw fail(400, "pseudo", "Le pseudo doit faire 3 à 24 caractères : lettres, chiffres, tiret, point ou souligné.");
  return { key: display.toLowerCase(), display };
}
/* la clé de connexion envoyée par le jeu : 64 caractères hexadécimaux */
function authOf(a) {
  if (typeof a !== "string" || !/^[0-9a-f]{64}$/.test(a)) throw fail(400, "auth", "Clé de connexion invalide.");
  return a;
}
const now = () => Date.now();
const ipOf = (req) => req.headers.get("cf-connecting-ip") || "local";

/* ------------------------------------------------------------ anti-force brute */
async function blocked(env, key) {
  const r = await env.DB.prepare("SELECT n, reset FROM attempts WHERE key = ?").bind(key).first();
  return !!(r && r.reset > now() && r.n >= MAX_FAILS);
}
async function failed(env, key) {
  const r = await env.DB.prepare("SELECT n, reset FROM attempts WHERE key = ?").bind(key).first();
  const t = now(), reset = t + BLOCK_MIN * 60000;
  if (!r || r.reset <= t) await env.DB.prepare("INSERT OR REPLACE INTO attempts (key, n, reset) VALUES (?, 1, ?)").bind(key, reset).run();
  else await env.DB.prepare("UPDATE attempts SET n = n + 1, reset = ? WHERE key = ?").bind(reset, key).run();
}
async function clearFails(env, key) { await env.DB.prepare("DELETE FROM attempts WHERE key = ?").bind(key).run(); }

/* ------------------------------------------------------------ sessions */
async function newSession(env, user) {
  const token = randomHex(32);
  await env.DB.prepare("INSERT INTO sessions (token, user, expires) VALUES (?, ?, ?)").bind(await sha256(token), user, now() + SESSION_DAYS * 86400000).run();
  // ménage : les sessions expirées
  await env.DB.prepare("DELETE FROM sessions WHERE expires < ?").bind(now()).run();
  return token;
}
async function sessionUser(req, env) {
  const m = /^Bearer ([0-9a-f]{64})$/.exec(req.headers.get("authorization") || "");
  if (!m) throw fail(401, "session", "Connexion nécessaire.");
  const h = await sha256(m[1]);
  const s = await env.DB.prepare("SELECT user, expires FROM sessions WHERE token = ?").bind(h).first();
  if (!s || s.expires < now()) throw fail(401, "session", "Ta session a expiré. Reconnecte-toi.");
  if (s.expires - now() < (SESSION_DAYS - 1) * 86400000) {
    await env.DB.prepare("UPDATE sessions SET expires = ? WHERE token = ?").bind(now() + SESSION_DAYS * 86400000, h).run();
  }
  return { id: s.user, token: h };
}
async function checkAuth(env, user, auth) {
  const u = await env.DB.prepare("SELECT id, auth, salt FROM users WHERE id = ?").bind(user).first();
  if (!u || !sameText(await sha256(auth + u.salt), u.auth)) throw fail(403, "auth", "Mot de passe incorrect.");
  return u;
}

/* ------------------------------------------------------------ routes */
async function route(req, env) {
  const url = new URL(req.url);
  const p = url.pathname.replace(/\/+$/, "");
  const M = req.method;
  if (!env.DB) throw fail(500, "config", "La base de données n’est pas reliée au serveur (liaison « DB »).");

  if (p === "/api/health" && M === "GET") return json({ ok: true, version: VERSION });

  if (p === "/api/register" && M === "POST") {
    const b = await body(req);
    const ps = pseudoOf(b.pseudo), auth = authOf(b.auth);
    const ipKey = "signup:" + ipOf(req);
    const r = await env.DB.prepare("SELECT n, reset FROM attempts WHERE key = ?").bind(ipKey).first();
    if (r && r.reset > now() && r.n >= MAX_SIGNUPS) throw fail(429, "slow", "Trop de comptes créés depuis cet endroit. Réessaie dans une heure.");
    const exists = await env.DB.prepare("SELECT id FROM users WHERE pseudo = ?").bind(ps.key).first();
    if (exists) throw fail(409, "taken", "Ce pseudo est déjà pris.");
    const salt = randomHex(16);
    const res = await env.DB.prepare("INSERT INTO users (pseudo, display, auth, salt, created) VALUES (?, ?, ?, ?, ?)")
      .bind(ps.key, ps.display, await sha256(auth + salt), salt, now()).run();
    const id = res.meta && res.meta.last_row_id;
    if (!r || r.reset <= now()) await env.DB.prepare("INSERT OR REPLACE INTO attempts (key, n, reset) VALUES (?, 1, ?)").bind(ipKey, now() + 3600000).run();
    else await env.DB.prepare("UPDATE attempts SET n = n + 1 WHERE key = ?").bind(ipKey).run();
    return json({ token: await newSession(env, id), pseudo: ps.display }, 201);
  }

  if (p === "/api/login" && M === "POST") {
    const b = await body(req);
    const ps = pseudoOf(b.pseudo), auth = authOf(b.auth);
    const uKey = "login:" + ps.key, ipKey = "ip:" + ipOf(req);
    if (await blocked(env, uKey) || await blocked(env, ipKey)) throw fail(429, "slow", "Trop d’essais. Attends un quart d’heure avant de réessayer.");
    const u = await env.DB.prepare("SELECT id, display, auth, salt FROM users WHERE pseudo = ?").bind(ps.key).first();
    // même réponse que le pseudo existe ou non
    if (!u || !sameText(await sha256(auth + u.salt), u.auth)) {
      await failed(env, uKey); await failed(env, ipKey);
      throw fail(401, "login", "Pseudo ou mot de passe incorrect.");
    }
    await clearFails(env, uKey);
    return json({ token: await newSession(env, u.id), pseudo: u.display });
  }

  if (p === "/api/logout" && M === "POST") {
    const s = await sessionUser(req, env);
    await env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(s.token).run();
    return json({ ok: true });
  }

  if (p === "/api/saves" && M === "GET") {
    const s = await sessionUser(req, env);
    const r = await env.DB.prepare("SELECT slot, rev, updated FROM saves WHERE user = ? ORDER BY slot").bind(s.id).all();
    return json({ slots: r.results || [] });
  }

  if (p === "/api/save" && M === "GET") {
    const s = await sessionUser(req, env);
    const slot = slotOf(url.searchParams.get("slot"));
    const r = await env.DB.prepare("SELECT slot, data, iv, rev, updated FROM saves WHERE user = ? AND slot = ?").bind(s.id, slot).first();
    if (!r) return json({ error: "none", message: slot === 1 ? "Aucune sauvegarde en ligne." : "Cet emplacement est vide." }, 404);
    return json(r);
  }

  if (p === "/api/save" && M === "DELETE") {
    const s = await sessionUser(req, env);
    const slot = slotOf(url.searchParams.get("slot"));
    await env.DB.prepare("DELETE FROM saves WHERE user = ? AND slot = ?").bind(s.id, slot).run();
    return json({ ok: true, slot });
  }

  if (p === "/api/save" && M === "PUT") {
    const s = await sessionUser(req, env);
    const b = await body(req);
    const slot = slotOf(b.slot);
    if (typeof b.data !== "string" || typeof b.iv !== "string" || b.data.length > MAX_SAVE || b.iv.length > 64) throw fail(400, "data", "Sauvegarde invalide.");
    const cur = await env.DB.prepare("SELECT rev, updated FROM saves WHERE user = ? AND slot = ?").bind(s.id, slot).first();
    const expect = Number(b.rev) || 0;
    // quelqu’un a envoyé une autre version entre-temps : on ne l’écrase pas
    if ((cur ? cur.rev : 0) !== expect && !b.force) return json({ error: "conflict", message: "La sauvegarde en ligne a changé depuis.", slot, rev: cur ? cur.rev : 0, updated: cur ? cur.updated : 0 }, 409);
    const rev = (cur ? cur.rev : 0) + 1, t = now();
    await env.DB.prepare("INSERT OR REPLACE INTO saves (user, slot, data, iv, rev, updated) VALUES (?, ?, ?, ?, ?, ?)").bind(s.id, slot, b.data, b.iv, rev, t).run();
    return json({ slot, rev, updated: t });
  }

  if (p === "/api/password" && M === "POST") {
    const s = await sessionUser(req, env);
    const b = await body(req);
    await checkAuth(env, s.id, authOf(b.auth));
    const newAuth = authOf(b.newAuth);
    // le jeu renvoie les trois emplacements rechiffrés avec la nouvelle clé ;
    // l’ancien format ({ data, iv } seuls) ne concerne que l’emplacement 1
    const rows = Array.isArray(b.saves) ? b.saves : typeof b.data === "string" ? [{ slot: 1, data: b.data, iv: b.iv }] : [];
    const seen = new Set();
    for (const r of rows) {
      const slot = slotOf(r && r.slot);
      if (seen.has(slot) || typeof r.data !== "string" || typeof r.iv !== "string" || !r.data.length || r.data.length > MAX_SAVE || r.iv.length > 64) throw fail(400, "data", "Sauvegarde invalide.");
      seen.add(slot);
    }
    const salt = randomHex(16);
    await env.DB.prepare("UPDATE users SET auth = ?, salt = ? WHERE id = ?").bind(await sha256(newAuth + salt), salt, s.id).run();
    if (rows.length) {
      const cur = await env.DB.prepare("SELECT slot, rev FROM saves WHERE user = ?").bind(s.id).all();
      const revs = {};
      for (const x of cur.results || []) revs[x.slot] = x.rev;
      const t = now();
      await env.DB.batch(rows.map((r) => env.DB.prepare("INSERT OR REPLACE INTO saves (user, slot, data, iv, rev, updated) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(s.id, slotOf(r.slot), r.data, r.iv, (revs[slotOf(r.slot)] || 0) + 1, t)));
    }
    // les autres appareils devront se reconnecter
    await env.DB.prepare("DELETE FROM sessions WHERE user = ?").bind(s.id).run();
    return json({ token: await newSession(env, s.id) });
  }

  if (p === "/api/account" && M === "DELETE") {
    const s = await sessionUser(req, env);
    const b = await body(req);
    await checkAuth(env, s.id, authOf(b.auth));
    await env.DB.batch([
      env.DB.prepare("DELETE FROM saves WHERE user = ?").bind(s.id),
      env.DB.prepare("DELETE FROM sessions WHERE user = ?").bind(s.id),
      env.DB.prepare("DELETE FROM users WHERE id = ?").bind(s.id)
    ]);
    return json({ ok: true });
  }

  throw fail(404, "route", "Adresse inconnue.");
}
