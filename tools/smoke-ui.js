/* Test de fumée de l’interface, dans un vrai navigateur (hors « npm test » : il demande Playwright).
 *
 *   PW=$(npm root -g)/playwright node tools/smoke-ui.js [sauvegarde.json]
 *
 * Il sert un dossier du dépôt avec http-server (npx http-server -p 8765 -s -c-1 .) déjà lancé, puis vérifie, à 320,
 * 360, 390 et 430 px : pas de débordement horizontal, le nom de l’âge entièrement lisible, le titre d’objectif
 * lisible (au moins 60 px), les boutons du haut de 38 px au moins ; et au clavier : Échap ferme le menu, le focus
 * revient sur le bouton qui l’a ouvert. Code de sortie 1 au premier écart. */
const fs = require("fs");
const { chromium } = require(process.env.PW || "playwright");
const save = process.argv[2] || "tools/fixtures/save-v5-age8-usine.json";
const URL = process.env.URL || "http://localhost:8765/index.html";
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium" });
  const bad = [];
  for (const [w, h] of [[320, 568], [360, 740], [390, 844], [430, 900]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, serviceWorkers: "block", hasTouch: true });
    const p = await ctx.newPage();
    p.on("pageerror", (e) => bad.push(w + " : erreur " + e.message));
    /* la sauvegarde de départ se prépare ici, en Node : nouveautés déjà lues et horodatage
     * d’aujourd’hui, sinon la fenêtre de mise à jour ou celle du retour d’absence reste ouverte,
     * le jeu sous elle est inerte et le clavier ne peut plus rien tester. */
    const seed = JSON.parse(fs.readFileSync(save, "utf8"));
    seed.introSeen = true;
    seed.intu = 50;
    seed.settings = Object.assign(seed.settings || {}, { tuto: false });
    seed.flags = Object.assign(seed.flags || {}, { ver: require("../package.json").version, news: null });
    seed.t = Date.now();
    await p.addInitScript((s) => { if (!sessionStorage.getItem("seeded")) { localStorage.setItem("eclat.save.v1", s); sessionStorage.setItem("seeded", "1"); } }, JSON.stringify(seed));
    await p.goto(URL); await p.waitForTimeout(1200);
    /* ce qui s’ouvre au chargement (une fête, un rappel) se ferme par son bouton principal */
    const closeAll = async () => { for (let k = 0; k < 8; k++) { await p.waitForTimeout(400); if (await p.evaluate(() => document.querySelector("#modal").classList.contains("hidden"))) return; await p.evaluate(() => { const bs = [...document.querySelectorAll("#modal .modal-box button")]; const x = bs.reverse().find((e) => e.dataset.m === "close") || bs[0]; if (x) x.click(); }); } };
    await closeAll();
    const r = await p.evaluate(() => {
      const n = document.querySelector("#ageName"), g = document.querySelector(".goal-card .gname");
      return { over: document.documentElement.scrollWidth - innerWidth, nom: n.scrollWidth - n.clientWidth, obj: g ? g.clientWidth : 999, minH: Math.min(...[...document.querySelectorAll(".top-right button:not(.hidden)")].map((e) => e.getBoundingClientRect().height)) };
    });
    if (r.over > 0) bad.push(w + " : la page déborde de " + r.over + " px");
    if (r.nom > 0) bad.push(w + " : le nom de l’âge est coupé");
    if (r.obj < 60) bad.push(w + " : le titre d’objectif ne tient que sur " + r.obj + " px");
    if (r.minH < 38) bad.push(w + " : un bouton du haut fait " + Math.round(r.minH) + " px");
    if (w === 390) {
      await p.focus("#menuBtn"); await p.keyboard.press("Enter"); await p.waitForTimeout(500);
      if (await p.evaluate(() => document.querySelector("#modal").classList.contains("hidden"))) bad.push("le menu ne s’ouvre pas");
      await p.keyboard.press("Escape"); await p.waitForTimeout(500);
      const st = await p.evaluate(() => ({ closed: document.querySelector("#modal").classList.contains("hidden"), id: document.activeElement.id }));
      if (!st.closed) bad.push("Échap ne ferme pas le menu");
      if (st.id !== "menuBtn") bad.push("le focus ne revient pas sur le bouton du menu (" + st.id + ")");
    }
    await ctx.close();
  }
  await b.close();
  console.log(bad.length ? bad.join("\n") : "Interface : aucun écart.");
  process.exit(bad.length ? 1 : 0);
})();
