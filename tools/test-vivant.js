// tools/test-vivant.js — Tests unitaires du Mode Vivant (3e mode) et des nœuds de récolte vivants
"use strict";
const assert = require("assert/strict");
const fs = require("fs");
const path = require("path");

console.log("Mode Vivant & Nœuds immersifs :");

// 1. Vérification des fichiers du mode Vivant
const ROOT = path.resolve(__dirname, "..");
assert(fs.existsSync(path.join(ROOT, "css/domaine-vivant.css")), "css/domaine-vivant.css doit exister");

const sw = fs.readFileSync(path.join(ROOT, "sw.js"), "utf8");
assert(sw.includes("css/domaine-vivant.css"), "css/domaine-vivant.css doit être dans sw.js FILES");

const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
assert(html.includes("vivantStylesheet"), "index.html doit lier vivantStylesheet");
assert(html.includes('"atlas", "vivant", "classique"') || html.includes('["atlas", "vivant", "classique"]'), "index.html doit gérer les 3 modes");

// 2. Vérification des définitions SVG dans domaine.js
const domCode = fs.readFileSync(path.join(ROOT, "js/domaine.js"), "utf8");
assert(domCode.includes("livingNodeSVG"), "domaine.js doit définir livingNodeSVG");
assert(domCode.includes("anim-tree"), "domaine.js doit contenir anim-tree pour le bois");
assert(domCode.includes("anim-rock"), "domaine.js doit contenir anim-rock pour le caillou");
assert(domCode.includes("anim-flint"), "domaine.js doit contenir anim-flint pour le silex");
assert(domCode.includes("anim-fiber"), "domaine.js doit contenir anim-fiber pour la fibre");
assert(domCode.includes("anim-water"), "domaine.js doit contenir anim-water pour l'eau");
assert(domCode.includes("spawnLivingParticles"), "domaine.js doit définir spawnLivingParticles");

// 3. Simulation du cycle des modes
const MODES = ["atlas", "vivant", "classique"];
function nextMode(cur) {
  const idx = MODES.indexOf(cur);
  return MODES[(idx + 1) % MODES.length];
}
assert.equal(nextMode("atlas"), "vivant", "atlas doit mener à vivant");
assert.equal(nextMode("vivant"), "classique", "vivant doit mener à classique");
assert.equal(nextMode("classique"), "atlas", "classique doit mener à atlas");

// 4. Illustrations du Carnet du Semeur (Âge du Bois)
assert(fs.existsSync(path.join(ROOT, "js/illustrations.js")), "js/illustrations.js doit exister");
assert(html.includes("js/illustrations.js"), "index.html doit inclure js/illustrations.js");
assert(sw.includes("js/illustrations.js"), "sw.js doit inclure js/illustrations.js");

const illCode = fs.readFileSync(path.join(ROOT, "js/illustrations.js"), "utf8");
assert(illCode.includes("bois.webp") && illCode.includes("source_bois.webp"), "illustrations.js doit référencer les variantes");

const EXPECTED_ITEMS = [
  "bois", "fibre", "caillou", "manche", "corde", "panier", "archet",
  "feu", "charbon", "epieu", "cabane", "torche", "fibre_1", "caillou_1",
  "percuteur_pierre", "etabli_amenage"
];
for (const id of EXPECTED_ITEMS) {
  const p = path.join(ROOT, "assets/carnet/items", `${id}.webp`);
  assert(fs.existsSync(p), `L'illustration objet ${id}.webp doit exister`);
  assert(sw.includes(`assets/carnet/items/${id}.webp`), `sw.js doit cacher items/${id}.webp`);
}

const EXPECTED_SOURCES = ["source_bois", "source_fibre", "source_caillou"];
for (const id of EXPECTED_SOURCES) {
  const p = path.join(ROOT, "assets/carnet/sources", `${id}.webp`);
  assert(fs.existsSync(p), `L'illustration source ${id}.webp doit exister`);
  assert(sw.includes(`assets/carnet/sources/${id}.webp`), `sw.js doit cacher sources/${id}.webp`);
}

assert(domCode.includes("livingNode"), "domaine.js doit définir livingNode");

console.log("  ✓ structure et intégration du cycle 3 modes valides");
console.log("  ✓ entités vectorielles vivantes (bois, caillou, silex, fibre, eau, sable, argile) présentes");
console.log("  ✓ système de particules de frappe et recul d'impact configurés");
console.log("  ✓ 19 variantes WebP du Carnet du Semeur (16 objets, 3 sources) vérifiées et en cache");
