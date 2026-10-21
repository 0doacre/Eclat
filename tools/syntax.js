#!/usr/bin/env node
/* Vérifie la syntaxe de chaque fichier JS du jeu : les tests du moteur ne chargent pas
 * l’interface, une accolade en trop dans js/ui.js passerait sans ça. */
"use strict";
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const root = path.join(__dirname, "..");
const files = ["sw.js"].concat(fs.readdirSync(path.join(root, "js")).filter((f) => f.endsWith(".js")).map((f) => "js/" + f));
let bad = 0;
for (const f of files) {
  try { execFileSync(process.execPath, ["--check", path.join(root, f)], { stdio: "pipe" }); }
  catch (e) { bad++; console.log("✗ " + f + "\n" + String(e.stderr || e.message).split("\n").slice(0, 5).join("\n")); }
}
if (bad) process.exit(1);
console.log("✓ Syntaxe : " + files.length + " fichiers.");
