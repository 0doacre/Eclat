#!/usr/bin/env node
/* Recalcule l’empreinte BUILD du service worker à partir des fichiers du jeu.
 * Sans changement d’empreinte, les joueurs ne recevraient jamais la mise à jour.
 *   node tools/build.js          met à jour sw.js
 *   node tools/build.js --check  échoue si sw.js n’est pas à jour (utilisé par npm test) */
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");
const swPath = path.join(ROOT, "sw.js");
const sw = fs.readFileSync(swPath, "utf8");
const files = JSON.parse("[" + sw.match(/const FILES = \[([\s\S]*?)\];/)[1].replace(/\s+/g, "") + "]").filter((f) => f !== "./");

// tout ce que la page charge doit être mis en cache
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const refs = [...html.matchAll(/(?:src|href)="([^"#:]+)"/g)].map((m) => m[1]);
const missing = refs.filter((r) => !files.includes(r));
if (missing.length) { console.error("✗ Fichiers chargés par index.html absents de sw.js : " + missing.join(", ")); process.exit(1); }

const h = crypto.createHash("sha256");
for (const f of files) h.update(f + "\n").update(fs.readFileSync(path.join(ROOT, f)));
const build = h.digest("hex").slice(0, 10);
const current = sw.match(/const BUILD = "([^"]*)";/)[1];

if (process.argv.includes("--check")) {
  if (current !== build) { console.error("✗ sw.js n’est pas à jour (BUILD " + current + " ≠ " + build + ") : lance « node tools/build.js »."); process.exit(1); }
  console.log("✓ Service worker à jour (build " + build + ").");
} else {
  fs.writeFileSync(swPath, sw.replace(/const BUILD = "[^"]*";/, 'const BUILD = "' + build + '";'));
  console.log("Build " + build + (current === build ? " (inchangé)" : " (était " + current + ")"));
}
