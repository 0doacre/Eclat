#!/usr/bin/env node
// Génère assets/icons.svg (sprite) à partir de tools/icons.json.
// Icônes : game-icons.net (CC BY 3.0), servies par l’API Iconify.
// Cache : tools/icons-cache.json ({ nom: { body, w, h } }). Seules les icônes
// absentes du cache sont téléchargées : hors ligne, tout marche si le cache est complet.
'use strict';
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const MAP = path.join(__dirname, 'icons.json');
const CACHE = path.join(__dirname, 'icons-cache.json');
const OUT = path.join(ROOT, 'assets', 'icons.svg');
const API = 'https://api.iconify.design/game-icons.json?icons=';

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'eclat-icons/1.0' } }, (res) => {
      if (res.statusCode !== 200) { res.resume(); return reject(new Error('HTTP ' + res.statusCode)); }
      let s = '';
      res.setEncoding('utf8');
      res.on('data', (c) => (s += c));
      res.on('end', () => resolve(s));
    }).on('error', reject);
  });
}

function readJSON(f, def) {
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return def; }
}

async function main() {
  const map = readJSON(MAP, null);
  if (!map) throw new Error('tools/icons.json illisible');
  const used = new Set();
  for (const group of Object.values(map)) for (const n of Object.values(group)) used.add(n);
  const names = [...used].sort();

  const cache = readJSON(CACHE, {});
  const missing = names.filter((n) => !cache[n]);
  if (missing.length) {
    console.log('Téléchargement de ' + missing.length + ' icône(s) manquante(s)…');
    for (let i = 0; i < missing.length; i += 40) {
      const chunk = missing.slice(i, i + 40);
      const j = JSON.parse(await get(API + chunk.join(',')));
      const w0 = j.width || 512, h0 = j.height || 512;
      for (const n of chunk) {
        const ic = j.icons && j.icons[n];
        if (!ic) { console.error('Introuvable : ' + n); process.exitCode = 1; continue; }
        cache[n] = { body: ic.body, w: ic.width || w0, h: ic.height || h0 };
      }
    }
    const sorted = {};
    for (const n of Object.keys(cache).sort()) sorted[n] = cache[n];
    fs.writeFileSync(CACHE, JSON.stringify(sorted, null, 1) + '\n');
  }

  const bad = names.filter((n) => !cache[n]);
  if (bad.length) { console.error('Icônes absentes, sprite non écrit : ' + bad.join(', ')); process.exit(1); }

  const symbols = names.map((n) => {
    const c = cache[n];
    return '<symbol id="gi-' + n + '" viewBox="0 0 ' + c.w + ' ' + c.h + '" fill="currentColor">' + c.body + '</symbol>';
  });
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n' + symbols.join('\n') + '\n</svg>\n';
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, svg);
  console.log(names.length + ' icônes, sprite ' + Buffer.byteLength(svg) + ' octets (' + path.relative(ROOT, OUT) + ')');
}

main().catch((e) => { console.error(e.message); process.exit(1); });
