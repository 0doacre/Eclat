#!/usr/bin/env node
/* Recalcule l’empreinte BUILD du service worker à partir des fichiers du jeu.
 * Sans changement d’empreinte, les joueurs ne recevraient jamais la mise à jour.
 *   node tools/build.js          met à jour sw.js
 *   node tools/build.js --check  échoue si sw.js n’est pas à jour (utilisé par npm test)
 *   --root <dossier>             calcule dans un autre dossier (les tests)
 *
 * L’empreinte est portable : pour les fichiers texte, les fins de ligne CRLF sont comptées comme LF, car ce
 * qui part en ligne est le contenu du dépôt (LF) et non celui d’un poste Windows qui aurait converti les
 * fichiers à l’extraction. Les fichiers binaires (polices, images) sont hachés tels quels. */
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const iRoot = process.argv.indexOf("--root");
const ROOT = iRoot > 0 ? path.resolve(process.argv[iRoot + 1]) : path.join(__dirname, "..");
const TEXTE = /\.(html|js|css|svg|webmanifest|json|txt|md)$/i;
/* retire le CR des fins de ligne CRLF ; un CR seul est conservé */
function enLF(buf) {
  const out = Buffer.allocUnsafe(buf.length);
  let n = 0;
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] === 0x0d && buf[i + 1] === 0x0a) continue;
    out[n++] = buf[i];
  }
  return out.subarray(0, n);
}
const contenu = (f) => { const b = fs.readFileSync(path.join(ROOT, f)); return TEXTE.test(f) ? enLF(b) : b; };
const swPath = path.join(ROOT, "sw.js");
const sw = fs.readFileSync(swPath, "utf8");
const files = JSON.parse("[" + sw.match(/const FILES = \[([\s\S]*?)\];/)[1].replace(/\s+/g, "") + "]").filter((f) => f !== "./");

// tout ce que la page charge doit être mis en cache
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const refs = [...html.matchAll(/(?:src|href)="([^"#:]+)"/g)].map((m) => m[1]);
const missing = refs.filter((r) => !files.includes(r));
if (missing.length) { console.error("✗ Fichiers chargés par index.html absents de sw.js : " + missing.join(", ")); process.exit(1); }

const h = crypto.createHash("sha256");
for (const f of files) h.update(f + "\n").update(contenu(f));
const build = h.digest("hex").slice(0, 10);
const current = sw.match(/const BUILD = "([^"]*)";/)[1];

if (process.argv.includes("--check")) {
  if (current !== build) { console.error("✗ sw.js n’est pas à jour (BUILD " + current + " ≠ " + build + ") : lance « node tools/build.js »."); process.exit(1); }
  console.log("✓ Service worker à jour (build " + build + ").");
} else {
  fs.writeFileSync(swPath, sw.replace(/const BUILD = "[^"]*";/, 'const BUILD = "' + build + '";'));
  console.log("Build " + build + (current === build ? " (inchangé)" : " (était " + current + ")"));
}
