// tools/test-browser-qol.js — Contrôle navigateur automatisé (320px, 390px, 1024px)
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");
const assert = require("assert/strict");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function startServer(root, port) {
  return new Promise((resolve, reject) => {
    const srv = http.createServer((req, res) => {
      let reqPath = decodeURIComponent(req.url.split("?")[0]);
      if (reqPath === "/") reqPath = "/index.html";
      const filePath = path.join(root, reqPath);
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404);
        return res.end("Not Found");
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
      fs.createReadStream(filePath).pipe(res);
    });
    srv.listen(port, "127.0.0.1", () => resolve(srv));
    srv.on("error", reject);
  });
}

async function run() {
  const playwright = require("playwright");
  const root = path.resolve(__dirname, "..");
  const port = 8091 + Math.floor(Math.random() * 100);
  const server = await startServer(root, port);
  const browser = await playwright.chromium.launch({
    channel: "chrome",
    headless: true
  });

  const viewports = [
    { name: "320px (petit mobile)", width: 320, height: 568 },
    { name: "390px (mobile standard)", width: 390, height: 844 },
    { name: "1024px (desktop >= 980px)", width: 1024, height: 768 }
  ];

  try {
    for (const vp of viewports) {
      console.log(`\nTest viewport ${vp.name} :`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height }
      });
      const page = await context.newPage();
      await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(500);

      // Fermer la modale d'éveil de départ si présente
      const initClose = await page.$("#modal [data-m='close']");
      if (initClose && (await initClose.isVisible())) {
        await initClose.click();
        await page.waitForTimeout(300);
      }

      // 1. Contrôle du débordement horizontal
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      assert.strictEqual(overflow, false, `Aucun débordement horizontal à ${vp.width}px`);
      console.log(`  ✓ Aucun débordement horizontal (${vp.width}px)`);

      // 2. Contrôle d'une aide contextuelle et restauration du focus
      const aideBtn = await page.$("[data-aide]");
      if (aideBtn) {
        // Cible tactile
        const box = await aideBtn.boundingBox();
        assert.ok(box, "Le bouton d'aide doit avoir une boîte de rendu");
        // Le bouton ou son pseudo-élément doit couvrir au moins 44px
        const pseudoSize = await page.evaluate((el) => {
          const style = window.getComputedStyle(el, "::after");
          return {
            w: parseFloat(style.minWidth) || parseFloat(style.width) || el.offsetWidth,
            h: parseFloat(style.minHeight) || parseFloat(style.height) || el.offsetHeight
          };
        }, aideBtn);
        assert.ok(pseudoSize.w >= 44 && pseudoSize.h >= 44, `Cible tactile >= 44px (trouvé ${pseudoSize.w}x${pseudoSize.h})`);
        console.log(`  ✓ Cible tactile conforme (zone interactive >= 44px)`);

        // Clic sur l'aide
        await aideBtn.click();
        await page.waitForSelector("#modal:not(.hidden)", { timeout: 2000 });
        const modalVisible = await page.isVisible("#modal");
        assert.ok(modalVisible, "La fenêtre modale d'aide doit s'ouvrir");
        console.log(`  ✓ Ouverture de l'aide contextuelle sur demande`);

        // Fermeture de l'aide
        await page.waitForTimeout(500); // Respecter le délai anti-clic accidentel (fresh = 450ms)
        const closeBtn = await page.$("#modal button[data-m='close']");
        assert.ok(closeBtn, "Bouton fermer présent dans l'aide");
        await closeBtn.click();
        await page.waitForTimeout(200);
        const isClosed = await page.evaluate(() => {
          const m = document.getElementById("modal");
          return !m || m.classList.contains("hidden");
        });
        assert.ok(isClosed, "La modale doit être fermée");
        console.log(`  ✓ Fermeture propre de la modale`);

        // Restauration du focus
        await page.waitForTimeout(100);
        const focusRestored = await page.evaluate((btn) => {
          return document.activeElement === btn;
        }, aideBtn);
        assert.ok(focusRestored, "Le focus doit revenir sur le bouton déclencheur");
        console.log(`  ✓ Focus restauré sur l'élément déclencheur`);
      } else {
        console.log(`  - Aucun bouton data-aide visible immédiatement sur cette vue initiale`);
      }

      await context.close();
    }
    console.log("\nTous les parcours navigateurs simulés ont réussi !");
  } finally {
    await browser.close();
    server.close();
  }
}

run().catch((err) => {
  console.error("Échec des tests navigateur :", err);
  process.exit(1);
});
