/* T3 : Réflexes de navigateur et transitions entre écrans.
 * Vérifie les styles calculés (overscroll-behavior, user-select, tap-highlight, touch-callout, touch-action)
 * sur html, body, boutons, champs, textarea.save, Livre et Aide.
 * Vérifie que le changement d'onglet aboutit avec et sans prefers-reduced-motion. */
"use strict";
const fs = require("fs"), path = require("path"), http = require("http"), assert = require("assert/strict");
const { chromium } = require(process.env.PW || "playwright"), D = require("../js/data"), Core = require("../js/engine");
const ROOT = path.resolve(__dirname, ".."), MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".webp": "image/webp", ".woff2": "font/woff2", ".png": "image/png" };

const server = http.createServer((req, res) => {
  const file = path.resolve(ROOT, "." + new URL(req.url, "http://localhost").pathname.replace(/\/$/, "/index.html"));
  if (!file.startsWith(ROOT + path.sep)) return res.writeHead(403).end();
  fs.readFile(file, (e, b) => {
    if (e) return res.writeHead(404).end();
    res.setHeader("Content-Type", MIME[path.extname(file)] || "application/octet-stream");
    res.end(b);
  });
});

let browser, checks = 0;
const ok = (v, m) => { assert.ok(v, m); checks++; };

function partieSimple() {
  const E = Core.createEngine(), s = E.state;
  s.age = 2; s.cycle = 1; s.meta.forcedDone = true; s.introSeen = true; s.flags.ver = D.VERSION;
  Object.assign(s.settings, { tuto: false, sound: false, visiteurs: false });
  E.recalc();
  return E.serialize();
}

async function run() {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  const URL_JEU = "http://127.0.0.1:" + port + "/index.html";
  browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});

  const save = partieSimple();
  const cssSource = fs.readFileSync(path.join(ROOT, "css", "style.css"), "utf8");
  const hasCssCallout = (tag) => {
    return new RegExp("(?:^|[\\s,}])" + tag + "(?:[\\s,{])[^{]*\\{[^}]*-webkit-touch-callout:\\s*none", "m").test(cssSource);
  };

  /* 1. Vérification des styles calculés sans mouvement réduit */
  {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 700 },
      hasTouch: true,
      isMobile: true,
      serviceWorkers: "block",
      reducedMotion: "no-preference"
    });
    const page = await ctx.newPage();
    await page.addInitScript((r) => {
      localStorage.setItem("eclat.save.v1", r);
      localStorage.setItem("eclat.style.carnet-defaut", "1");
    }, save);
    await page.goto(URL_JEU);
    await page.waitForFunction(() => !!window.__eclat);

    const styles = await page.evaluate(() => {
      const gcs = (el) => el ? window.getComputedStyle(el) : null;
      const html = document.documentElement;
      const body = document.body;
      const btn = document.querySelector("#tabs button") || document.querySelector("button");

      // Création temporaire pour vérifier les sélecteurs généraux
      const input = document.createElement("input");
      const txtSave = document.createElement("textarea");
      txtSave.className = "save";
      const livreNote = document.createElement("div");
      livreNote.className = "livre-note";
      const lexique = document.createElement("div");
      lexique.className = "lexique";

      body.append(input, txtSave, livreNote, lexique);

      const res = {
        htmlOverscrollY: gcs(html).overscrollBehaviorY || gcs(html).overscrollBehavior,
        htmlOverscrollX: gcs(html).overscrollBehaviorX || gcs(html).overscrollBehavior,
        htmlTapHighlight: gcs(html).webkitTapHighlightColor || gcs(html).getPropertyValue("-webkit-tap-highlight-color"),

        bodyOverscrollY: gcs(body).overscrollBehaviorY || gcs(body).overscrollBehavior,
        bodyOverscrollX: gcs(body).overscrollBehaviorX || gcs(body).overscrollBehavior,
        bodyUserSelect: gcs(body).userSelect || gcs(body).webkitUserSelect,
        bodyTapHighlight: gcs(body).webkitTapHighlightColor || gcs(body).getPropertyValue("-webkit-tap-highlight-color"),
        bodyTouchCallout: gcs(body).getPropertyValue("-webkit-touch-callout"),

        btnTouchAction: gcs(btn).touchAction,
        btnUserSelect: gcs(btn).userSelect || gcs(btn).webkitUserSelect,
        btnTouchCallout: gcs(btn).getPropertyValue("-webkit-touch-callout"),

        inputUserSelect: gcs(input).userSelect || gcs(input).webkitUserSelect,
        inputTouchAction: gcs(input).touchAction,

        saveUserSelect: gcs(txtSave).userSelect || gcs(txtSave).webkitUserSelect,
        livreUserSelect: gcs(livreNote).userSelect || gcs(livreNote).webkitUserSelect,
        lexiqueUserSelect: gcs(lexique).userSelect || gcs(lexique).webkitUserSelect,

        activeViewAnimation: gcs(document.querySelector(".view.on"))?.animationName
      };

      input.remove();
      txtSave.remove();
      livreNote.remove();
      lexique.remove();

      return res;
    });

    ok(styles.htmlOverscrollY === "none", "html overscroll-behavior-y est none (" + styles.htmlOverscrollY + ")");
    ok(styles.htmlOverscrollX === "none", "html overscroll-behavior-x est none (" + styles.htmlOverscrollX + ")");
    ok(styles.bodyOverscrollY === "none", "body overscroll-behavior-y est none (" + styles.bodyOverscrollY + ")");
    ok(styles.bodyOverscrollX === "none", "body overscroll-behavior-x est none (" + styles.bodyOverscrollX + ")");
    ok(styles.bodyUserSelect === "none", "body user-select est none (" + styles.bodyUserSelect + ")");
    ok(styles.bodyTapHighlight === "rgba(0, 0, 0, 0)", "body tap-highlight est transparent (" + styles.bodyTapHighlight + ")");
    ok(styles.bodyTouchCallout === "none" || hasCssCallout("body"), "body touch-callout est posé à none");

    ok(styles.btnTouchAction === "manipulation", "bouton touch-action est manipulation (" + styles.btnTouchAction + ")");
    ok(styles.btnUserSelect === "none", "bouton user-select est none (" + styles.btnUserSelect + ")");
    ok(styles.btnTouchCallout === "none" || hasCssCallout("button"), "bouton touch-callout est posé à none");

    ok(styles.inputUserSelect === "text", "champ input user-select est text (" + styles.inputUserSelect + ")");
    ok(styles.inputTouchAction === "manipulation", "champ input touch-action est manipulation (" + styles.inputTouchAction + ")");

    ok(styles.saveUserSelect === "text", "textarea.save user-select est text (" + styles.saveUserSelect + ")");
    ok(styles.livreUserSelect === "text", "texte du Livre user-select est text (" + styles.livreUserSelect + ")");
    ok(styles.lexiqueUserSelect === "text", "texte de l'Aide user-select est text (" + styles.lexiqueUserSelect + ")");

    ok(styles.activeViewAnimation && styles.activeViewAnimation !== "none", "vue active anime sa transition sans reduced-motion (" + styles.activeViewAnimation + ")");

    // Test transition d'onglet sans reduced-motion
    const laboTab = page.locator('#tabs [data-tab="labo"]');
    await laboTab.click();
    await page.waitForFunction(() => document.querySelector("#v-labo")?.classList.contains("on"));
    const laboActive = await page.evaluate(() => {
      const v = document.querySelector("#v-labo");
      return v && v.classList.contains("on") && window.getComputedStyle(v).display !== "none";
    });
    ok(laboActive, "changement d'onglet vers labo aboutit");

    await ctx.close();
  }

  /* 2. Changement d'onglet avec mouvement réduit (prefers-reduced-motion: reduce) */
  {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 700 },
      hasTouch: true,
      isMobile: true,
      serviceWorkers: "block",
      reducedMotion: "reduce"
    });
    const page = await ctx.newPage();
    await page.addInitScript((r) => {
      localStorage.setItem("eclat.save.v1", r);
      localStorage.setItem("eclat.style.carnet-defaut", "1");
    }, save);
    await page.goto(URL_JEU);
    await page.waitForFunction(() => !!window.__eclat);

    const animWithReduced = await page.evaluate(() => {
      const v = document.querySelector(".view.on");
      return v ? window.getComputedStyle(v).animationName : null;
    });
    ok(animWithReduced === "none", "animation coupée avec prefers-reduced-motion: reduce (" + animWithReduced + ")");

    const laboTab = page.locator('#tabs [data-tab="labo"]');
    await laboTab.click();
    await page.waitForFunction(() => document.querySelector("#v-labo")?.classList.contains("on"));
    const laboActive = await page.evaluate(() => {
      const v = document.querySelector("#v-labo");
      return v && v.classList.contains("on") && window.getComputedStyle(v).display !== "none";
    });
    ok(laboActive, "changement d'onglet avec reduced-motion aboutit immédiatement");

    await ctx.close();
  }

  await browser.close();
  server.close();
  console.log(checks + " contrôles des réflexes de navigateur et transitions réussis.");
}

run().catch((e) => {
  console.error(e);
  if (browser) browser.close();
  server.close();
  process.exit(1);
});
