/* L’écriture de la partie dans un vrai navigateur : deux pages, écritures rapprochées, sauvegarde
 * automatique, fermeture de la page périmée, exception de stockage, persistance refusée.
 *   node tools/test-stockage-ui.js        (PW=chemin vers Playwright ; CHROMIUM=facultatif)
 * Serveur local et profils jetables, aucune partie personnelle. Compter une quarantaine de secondes
 * (la sauvegarde automatique se déclenche toutes les 10 s). */
"use strict";
const fs = require("fs"), path = require("path"), http = require("http"), assert = require("assert/strict");
const { chromium } = require(process.env.PW || "playwright");
const ROOT = path.resolve(__dirname, "..");
const D = require("../js/data.js");
const { createEngine } = require("../js/engine.js");
const KEY = "eclat.save.v1";
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".webp": "image/webp", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  const file = path.resolve(ROOT, "." + new URL(req.url, "http://localhost").pathname.replace(/\/$/, "/index.html"));
  if (!file.startsWith(ROOT + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (err, data) => { if (err) { res.writeHead(404).end(); return; } res.setHeader("Content-Type", MIME[path.extname(file)] || "application/octet-stream"); res.end(data); });
});
let browser, passed = 0;
async function test(nom, fn) {
  try { await fn(); passed++; console.log("  ✓ " + nom); }
  catch (e) { console.log("  ✗ " + nom + "\n    " + (e.stack || e)); process.exitCode = 1; }
}
/* une partie à 100 bois, introduction et nouveautés déjà vues, son et visiteurs coupés */
function graine() {
  const E = createEngine();
  const st = E.state;
  st.t = Date.now(); st.introSeen = true; st.flags.ver = D.VERSION;
  Object.assign(st.settings, { tuto: false, sound: false, visiteurs: false });
  E.add("bois", 100);
  return E.serialize();
}
const SEED = graine();
/* un profil jeté ; `avant` : un script exécuté dans chaque page avant le jeu */
async function profil(avant) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block", reducedMotion: "reduce", acceptDownloads: true });
  await ctx.addInitScript((raw) => {
    if (!localStorage.getItem("eclat.save.v1")) localStorage.setItem("eclat.save.v1", raw);
    // combien de fois cette page écrit la partie (pour prouver qu’une page périmée n’écrit plus du tout)
    window.__ecrit = 0;
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) { if (k === "eclat.save.v1") window.__ecrit++; return set.call(this, k, v); };
  }, SEED);
  if (avant) await ctx.addInitScript(avant);
  return ctx;
}
async function ouvre(ctx) {
  const p = await ctx.newPage();
  p.errors = []; p.on("pageerror", (e) => p.errors.push(e.message));
  await p.goto("http://127.0.0.1:" + server.address().port);
  await p.waitForFunction(() => !!window.__eclat);
  await p.waitForTimeout(300);
  return p;
}
const stocke = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("eclat.save.v1")).inv.bois);
const brut = (p) => p.evaluate(() => localStorage.getItem("eclat.save.v1"));
const vivant = (p) => p.evaluate(() => window.__eclat.E.count("bois"));
const etat = (p) => p.evaluate(() => window.__eclat.Stk.etat());
const ecrit = (p) => p.evaluate(() => window.__ecrit);
const titre = (p) => p.evaluate(() => { const m = document.querySelector("#modal"); return m.classList.contains("hidden") ? "" : (m.querySelector("h2") || {}).textContent || ""; });
/* une fenêtre qui vient de s’ouvrir sous le doigt ignore les appuis pendant 450 ms (js/ui.js, fresh) */
const attendreFenetre = (p) => p.waitForTimeout(550);
const ajoute = (p, n) => p.evaluate((k) => { window.__eclat.E.add("bois", k); }, n);

(async () => {
  browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  console.log("Enregistrement de la partie dans un navigateur");

  await test("deux pages : la seconde attend, n’écrit rien (sauvegarde automatique, pagehide, fermeture) et l’autre ne perd rien", async () => {
    const ctx = await profil();
    const A = await ouvre(ctx), B = await ouvre(ctx);
    assert.equal(await etat(A), "ok");
    assert.equal(await etat(B), "attente");
    assert.equal(await titre(B), "Partie ouverte ailleurs");
    // A progresse : 32 bois, enregistrés à la main puis 5 de plus que seule la sauvegarde automatique prendra
    await ajoute(A, 32);
    await A.evaluate(() => window.__eclat.save());
    assert.equal(await stocke(A), 132);
    const avantB = await ecrit(B);
    // B tente tout ce qu’une page périmée peut tenter
    assert.equal(await B.evaluate(() => window.__eclat.save()), false);
    await B.evaluate(() => { window.dispatchEvent(new Event("pagehide")); Object.defineProperty(document, "hidden", { value: true, configurable: true }); document.dispatchEvent(new Event("visibilitychange")); });
    assert.equal(await stocke(A), 132, "rien n’a bougé après pagehide et passage en arrière-plan de B");
    await ajoute(A, 5);
    await A.waitForTimeout(10600); // une sauvegarde automatique de chaque page
    assert.equal(await stocke(A), 137, "A enregistre seule, automatiquement");
    assert.equal(await ecrit(B), avantB, "B n’a écrit aucune fois");
    // fermeture de la page périmée
    await B.close({ runBeforeUnload: true });
    assert.equal(await stocke(A), 137);
    assert.deepEqual(A.errors, []);
    await ctx.close();
  });

  await test("écritures rapprochées avec verrou : le stockage ne suit que la page qui écrit, sans retour en arrière", async () => {
    const ctx = await profil();
    const A = await ouvre(ctx), B = await ouvre(ctx);
    const vus = [];
    for (let i = 1; i <= 25; i++) {
      await ajoute(A, 1);
      await Promise.all([A.evaluate(() => window.__eclat.save()), B.evaluate(() => window.__eclat.save())]);
      vus.push(await stocke(A));
    }
    assert.deepEqual(vus, Array.from({ length: 25 }, (_, i) => 101 + i));
    assert.equal(await ecrit(B), 0);
    await ctx.close();
  });

  await test("la page qui attendait reprend la partie quand l’autre se ferme, avec ses dernières avancées", async () => {
    const ctx = await profil();
    const A = await ouvre(ctx), B = await ouvre(ctx);
    assert.equal(await etat(B), "attente");
    await ajoute(A, 9); // jamais enregistré à la main : c’est la fermeture de A qui l’enregistre
    await A.close({ runBeforeUnload: true });
    await B.waitForFunction(() => window.__eclat && window.__eclat.Stk.etat() === "ok" && window.__eclat.E.count("bois") >= 109, null, { timeout: 8000 });
    assert.equal(await vivant(B), 109);
    assert.equal(await stocke(B), 109);
    await ctx.close();
  });

  await test("sans verrou du navigateur : la page périmée se déclare, n’écrit plus, et le joueur choisit", async () => {
    const ctx = await profil(() => { Object.defineProperty(navigator, "locks", { value: undefined, configurable: true }); });
    const A = await ouvre(ctx), B = await ouvre(ctx);
    assert.equal(await etat(A), "ok"); assert.equal(await etat(B), "ok");
    await ajoute(B, 32);
    assert.equal(await B.evaluate(() => window.__eclat.save()), true);
    assert.equal(await stocke(B), 132);
    // la page A (restée à 100) apprend le changement par l’événement storage, puis refuse toute écriture
    await A.waitForFunction(() => window.__eclat.Stk.etat() === "perime", null, { timeout: 3000 });
    assert.equal(await titre(A), "Cette page n’est plus à jour");
    assert.equal(await A.evaluate(() => window.__eclat.save()), false);
    await A.evaluate(() => window.dispatchEvent(new Event("pagehide")));
    assert.equal(await ecrit(A), 0, "A n’a jamais écrit");
    assert.equal(await stocke(B), 132);
    // « Garder celle de cette page » demande confirmation, met l’autre de côté, puis écrit
    await attendreFenetre(A);
    await A.locator('[data-m="keep"]').click();
    await A.waitForFunction(() => /Remplacer la partie/.test(document.querySelector("#modal h2").textContent));
    await attendreFenetre(A);
    await A.locator('[data-m="go"]').click();
    assert.equal(await stocke(A), 100, "la partie de A (100) remplace celle de B");
    const copies = await A.evaluate(() => JSON.parse(localStorage.getItem("eclat.backups") || "[]"));
    assert.ok(copies.some((c) => /autre onglet/.test(c.why) && JSON.parse(c.data).inv.bois === 132), "la partie de B est mise de côté");
    await ctx.close();
  });

  await test("sans verrou : « Recharger » reprend la partie enregistrée par l’autre page", async () => {
    const ctx = await profil(() => { Object.defineProperty(navigator, "locks", { value: undefined, configurable: true }); });
    const A = await ouvre(ctx), B = await ouvre(ctx);
    await ajoute(B, 40); await B.evaluate(() => window.__eclat.save());
    await A.waitForFunction(() => window.__eclat.Stk.etat() === "perime", null, { timeout: 3000 });
    await attendreFenetre(A);
    await Promise.all([A.waitForNavigation(), A.locator('[data-m="reload"]').click()]);
    await A.waitForFunction(() => !!window.__eclat);
    assert.equal(await vivant(A), 140);
    assert.equal(await etat(A), "ok");
    await ctx.close();
  });

  await test("sans verrou, écritures rapprochées : jamais de retour en arrière, une page au plus continue d’écrire", async () => {
    const ctx = await profil(() => { Object.defineProperty(navigator, "locks", { value: undefined, configurable: true }); });
    const A = await ouvre(ctx), B = await ouvre(ctx);
    for (let i = 0; i < 20; i++) {
      await Promise.all([
        A.evaluate(() => { window.__eclat.E.add("bois", 1); window.__eclat.save(); }),
        B.evaluate(() => { window.__eclat.E.add("bois", 1); window.__eclat.save(); })
      ]);
    }
    // une dernière sauvegarde de chacune lève toute course restante
    await A.evaluate(() => window.__eclat.save()); await B.evaluate(() => window.__eclat.save());
    const [ea, eb] = [await etat(A), await etat(B)];
    assert.ok(ea === "perime" || eb === "perime", "au moins une page s’est déclarée périmée : " + ea + "/" + eb);
    const ok = ea === "ok" ? A : B;
    assert.equal(await stocke(ok), await vivant(ok), "le stockage est la partie de la page qui écrit encore");
    await ctx.close();
  });

  const sansVerrou = () => { Object.defineProperty(navigator, "locks", { value: undefined, configurable: true }); };
  /* une écriture d’une autre page que celle-ci ne voit pas passer (aucun événement storage n’arrive dans la page qui écrit) */
  const ecritureEtrangere = (p, bois) => p.evaluate((n) => { const o = JSON.parse(localStorage.getItem("eclat.save.v1")); o.inv.bois = n; localStorage.setItem("eclat.save.v1", JSON.stringify(o)); }, bois);

  await test("« Garder celle de cette page » : sans copie de secours enregistrée, l’autre partie n’est pas écrasée et rien n’est annoncé comme réussi", async () => {
    const ctx = await profil(sansVerrou);
    const A = await ouvre(ctx);
    await ecritureEtrangere(A, 132);
    assert.equal(await A.evaluate(() => window.__eclat.save()), false);
    assert.equal(await etat(A), "perime");
    await attendreFenetre(A);
    // les copies de secours ne s’enregistrent plus
    await A.evaluate(() => { const set = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (k === "eclat.backups") throw new DOMException("quota", "QuotaExceededError"); return set.call(this, k, v); }; });
    await A.locator('[data-m="keep"]').click();
    await A.waitForFunction(() => /Remplacer la partie/.test(document.querySelector("#modal h2").textContent));
    await attendreFenetre(A);
    await A.locator('[data-m="go"]').click();
    await A.waitForFunction(() => /n’est plus à jour/.test(document.querySelector("#modal h2").textContent));
    assert.equal(await stocke(A), 132, "la partie de l’autre onglet est intacte");
    assert.equal(await A.evaluate(() => (JSON.parse(localStorage.getItem("eclat.backups") || "[]")).length), 0);
    assert.match(await A.locator("#toasts").innerText(), /copie de secours .* n’a pas pu être enregistrée/);
    assert.doesNotMatch(await A.locator("#toasts").innerText(), /Partie de cette page enregistrée/);
    assert.equal(await etat(A), "perime");
    await ctx.close();
  });

  await test("« Garder celle de cette page » : si l’écriture finale échoue, l’échec est dit et l’autre partie reste dans les copies", async () => {
    const ctx = await profil(sansVerrou);
    const A = await ouvre(ctx);
    await ecritureEtrangere(A, 132);
    await A.evaluate(() => window.__eclat.save());
    await attendreFenetre(A);
    await A.evaluate(() => { const set = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (k === "eclat.save.v1") throw new DOMException("quota", "QuotaExceededError"); return set.call(this, k, v); }; });
    await A.locator('[data-m="keep"]').click();
    await A.waitForFunction(() => /Remplacer la partie/.test(document.querySelector("#modal h2").textContent));
    await attendreFenetre(A);
    await A.locator('[data-m="go"]').click();
    await A.waitForFunction(() => /n’est plus à jour|ouverte ailleurs/.test(document.querySelector("#modal h2").textContent) || !!document.querySelector("#saveBar:not(.hidden)"));
    assert.equal(await stocke(A), 132);
    const copies = await A.evaluate(() => JSON.parse(localStorage.getItem("eclat.backups") || "[]"));
    assert.ok(copies.some((c) => JSON.parse(c.data).inv.bois === 132), "l’autre partie est dans les copies de secours");
    assert.doesNotMatch(await A.locator("#toasts").innerText(), /Partie de cette page enregistrée/);
    await ctx.close();
  });

  await test("compte en ligne : une page que save() découvre périmée n’envoie pas sa partie", async () => {
    const ctx = await profil(sansVerrou);
    const A = await ouvre(ctx);
    await A.evaluate(() => {
      const C = window.__eclat.Cloud;
      window.__envois = [];
      C.account = () => ({ token: "t", auto: true, slot: 1, last: 0, pseudo: "x" });
      C.push = async (text) => { window.__envois.push(JSON.parse(text).inv.bois); return { ok: true, slot: 1, rev: 1, updated: 1 }; };
    });
    // contrôle : une page à jour envoie bien (la sauvegarde en arrière-plan appelle cloudPush)
    const quitter = () => A.evaluate(() => { Object.defineProperty(document, "hidden", { value: true, configurable: true }); document.dispatchEvent(new Event("visibilitychange")); });
    await quitter();
    await A.waitForFunction(() => window.__envois.length === 1, null, { timeout: 3000 });
    // une autre page écrit sans que celle-ci le sache ; l’envoi suivant doit être refusé après save()
    await ecritureEtrangere(A, 132);
    await A.evaluate(() => { window.__envois.length = 0; });
    await quitter();
    await A.waitForTimeout(600);
    assert.equal(await etat(A), "perime", "save() a découvert la page périmée");
    assert.deepEqual(await A.evaluate(() => window.__envois), [], "aucun envoi de la partie périmée");
    await ctx.close();
  });

  await test("exception de stockage : la partie reste en mémoire, l’alerte s’affiche, l’export marche, puis tout se rétablit", async () => {
    const ctx = await profil();
    const p = await ouvre(ctx);
    await p.evaluate(() => {
      window.__quota = true;
      const set = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k, v) { if (window.__quota && (k === "eclat.save.v1" || k === "eclat.backups")) throw new DOMException("quota", "QuotaExceededError"); return set.call(this, k, v); };
    });
    const avant = await brut(p);
    await ajoute(p, 17);
    assert.equal(await p.evaluate(() => window.__eclat.save()), false);
    assert.equal(await vivant(p), 117, "la partie est toujours en mémoire");
    assert.equal(await brut(p), avant, "la partie déjà enregistrée n’a pas été touchée");
    assert.equal(await p.locator("#saveBar").isVisible(), true);
    assert.match(await p.locator("#saveBar").innerText(), /pas enregistrée/);
    const [dl] = await Promise.all([p.waitForEvent("download"), p.locator('#saveBar [data-u="export"]').click()]);
    const contenu = JSON.parse(fs.readFileSync(await dl.path(), "utf8"));
    assert.equal(contenu.inv.bois, 117, "le fichier exporté contient les 17 bois non enregistrés");
    // le stockage revient : « Réessayer » enregistre et retire l’alerte
    await p.evaluate(() => { window.__quota = false; });
    await p.locator('#saveBar [data-u="retry"]').click();
    await p.waitForFunction(() => document.querySelector("#saveBar").classList.contains("hidden"));
    assert.equal(await stocke(p), 117);
    assert.deepEqual(p.errors, []);
    await ctx.close();
  });

  const stockageSimule = (corps) => () => { Object.defineProperty(navigator, "storage", { value: Object.assign({ estimate: async () => ({}) }, corps()), configurable: true }); };
  async function persistance(nom, avant, attendu, texteSauvegardes, jeu) {
    await test("persistance " + nom, async () => {
      const ctx = await profil(avant);
      const p = await ouvre(ctx);
      const etatRendu = await p.evaluate(() => window.__eclat.demanderPersistance());
      assert.equal(etatRendu, attendu);
      assert.equal(await p.evaluate(() => JSON.parse(localStorage.getItem("eclat.persist")).etat), attendu);
      await p.locator("#menuBtn").click();
      await attendreFenetre(p);
      await p.locator('[data-m="saves"]').click();
      await p.waitForFunction(() => /Sauvegardes/.test(document.querySelector("#modal h2").textContent));
      assert.match(await p.locator("#modal .modal-box").innerText(), texteSauvegardes);
      if (jeu) await jeu(p);
      await ctx.close();
    });
  }
  await persistance("refusée : avertissement, une seule demande, redemandée au plus une fois par semaine",
    () => { window.__demandes = 0; Object.defineProperty(navigator, "storage", { value: { persisted: async () => false, persist: async () => { window.__demandes++; return false; } }, configurable: true }); },
    "refusee", /ne garantit pas la conservation/, async (p) => {
      assert.match(await p.locator("#toasts").innerText().catch(() => ""), /ne garantit pas/);
      assert.equal(await p.evaluate(() => window.__eclat.demanderPersistance()), "refusee");
      assert.equal(await p.evaluate(() => window.__demandes), 1, "pas de seconde demande");
    });
  await persistance("accordée et confirmée",
    () => { let ok = false; Object.defineProperty(navigator, "storage", { value: { persisted: async () => ok, persist: async () => { ok = true; return true; } }, configurable: true }); },
    "accordee", /s’est engagé à garder/);
  await persistance("réponse « oui » que le navigateur ne confirme pas : traitée comme refusée",
    () => { Object.defineProperty(navigator, "storage", { value: { persisted: async () => false, persist: async () => true }, configurable: true }); },
    "refusee", /ne garantit pas la conservation/);
  await persistance("indisponible dans ce navigateur",
    () => { Object.defineProperty(navigator, "storage", { value: {}, configurable: true }); },
    "absente", /ne permet pas de protéger/);
  void stockageSimule;

  await test("la demande de persistance part toute seule après dix minutes de jeu, pas avant", async () => {
    const ctx = await profil(() => { window.__demandes = 0; Object.defineProperty(navigator, "storage", { value: { persisted: async () => false, persist: async () => { window.__demandes++; return false; } }, configurable: true }); });
    const p = await ouvre(ctx);
    await p.waitForTimeout(10600);
    assert.equal(await p.evaluate(() => window.__demandes), 0, "rien à l’arrivée");
    await p.evaluate(() => { window.__eclat.E.state.stats.play = 601; });
    await p.waitForFunction(() => window.__demandes === 1, null, { timeout: 11500 });
    await ctx.close();
  });

  await browser.close(); server.close();
  console.log(passed + " scénarios d’enregistrement réussis.");
})().catch((e) => { console.error(e); process.exitCode = 1; if (browser) browser.close(); server.close(); });
