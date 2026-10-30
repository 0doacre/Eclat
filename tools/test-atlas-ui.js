/* Atlas : vrais états du moteur, profils jetables, aucune sauvegarde personnelle.
 * PW/CHROMIUM facultatifs. ATLAS_SHOTS pour les captures. */
"use strict";
const fs = require("fs"), path = require("path"), http = require("http"), assert = require("assert/strict");
const { chromium } = require(process.env.PW || "playwright");
const D = require("../js/data.js"), { createEngine } = require("../js/engine.js");
const ROOT = path.resolve(__dirname, "..");
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".webp": "image/webp", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  const file = path.resolve(ROOT, "." + new URL(req.url, "http://localhost").pathname.replace(/\/$/, "/index.html"));
  if (!file.startsWith(ROOT + path.sep)) return res.writeHead(403).end();
  fs.readFile(file, (err, buf) => { if (err) return res.writeHead(404).end(); res.setHeader("Content-Type", mime[path.extname(file)] || "application/octet-stream"); res.end(buf); });
});
let browser, checks = 0;
function ok(v, msg) { assert.ok(v, msg); checks++; }
function save(count, large) {
  const E = createEngine(), s = E.state;
  s.zones = Object.fromEntries(D.ZONES.filter(z => !z.secret).slice(0, count).map(z => [z.id, true]));
  s.introSeen = true; s.flags.ver = D.VERSION;
  Object.assign(s.settings, { tuto: false, sound: false, visiteurs: false, theme: large ? "dark" : "light", largeText: large });
  return E.serialize();
}
async function shot(p, name) {
  if (!process.env.ATLAS_SHOTS) return;
  await p.evaluate(() => { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); });
  fs.mkdirSync(process.env.ATLAS_SHOTS, { recursive: true });
  await p.screenshot({ path: path.join(process.env.ATLAS_SHOTS, name + ".png") });
}
async function close(p) {
  await p.evaluate(() => window.__eclat.closeModal());
  await p.waitForFunction(() => !document.getElementById('app').inert);
}
async function run() {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  for (const width of (process.env.ATLAS_STATES_ONLY ? [] : [320, 360, 390, 430])) for (const count of [1, 4, 8, 9, 10, 11]) for (const large of [false, true]) {
    const ctx = await browser.newContext({ viewport: { width, height: width === 320 ? 568 : 844 }, hasTouch: true, reducedMotion: "reduce", serviceWorkers: "block" });
    const p = await ctx.newPage(), errors = [], failed = [];
    p.on("pageerror", e => errors.push(e.message));
    p.on("response", r => { if (r.status() >= 400) failed.push(r.url()); });
    await p.addInitScript(raw => { localStorage.setItem("eclat.save.v1", raw); localStorage.setItem("eclat.style.carnet-defaut","1");localStorage.setItem("eclat.preview.style", "atlas"); }, save(count, large));
    await p.goto("http://127.0.0.1:" + server.address().port);
    await p.waitForFunction(() => !!window.__eclat);
    for (let i = 0; i < 8; i++) { await p.waitForTimeout(100); await p.evaluate(() => window.__eclat.closeModal()); }
    await p.locator('#tabs [data-tab="carte"]').click();
    await p.locator('.atlas-world').waitFor();
    await p.waitForFunction(() => document.fonts.status === "loaded");
    const tag = width + "/" + count + "/" + large;
    const info = await p.evaluate(() => {
      const svg = document.querySelector('.atlas-world'), box = e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; };
      const hits = [...svg.querySelectorAll('.a-hit,.a-frontier-hit,.a-pass-bg')].map(e => box(e));
      return {
        overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) > innerWidth,
        small: hits.filter(r => r.width < 43.9 || r.height < 43.9),
        clips: svg.querySelectorAll('#atlas-known path').length,
        skyBands: [...svg.querySelectorAll('#atlas-sky-known path')].map(e => e.dataset.skyBand),
        regions: [...svg.querySelectorAll('[data-cz]')].map(e => e.dataset.cz),
        badIcons: [...svg.querySelectorAll('use')].map(e => e.getAttribute('href')).filter(id => !document.querySelector(id)),
        camp: box(svg.querySelector('[data-camp]')),
        vb: svg.viewBox.baseVal.height,
        ratio: svg.getBoundingClientRect().width / svg.viewBox.baseVal.width
      };
    });
    ok(!info.overflow, tag + " : débordement");
    ok(!info.small.length, tag + " : cibles insuffisantes " + JSON.stringify(info.small));
    ok(!info.badIcons.length, tag + " : icônes absentes " + info.badIcons);
    ok(info.clips === Math.min(count, 8), tag + " : masque limité aux terres ouvertes");
    ok(info.skyBands.join() === ['orbite','lune','mercure'].slice(0, Math.max(0, count - 8)).join(), tag + ' : seuls les astres ouverts sont révélés');
    ok(await p.locator('.a-celestial-art').count() === (count > 8 ? 1 : 0), tag + ' : illustration céleste réservée aux découvertes spatiales');
    ok(info.regions.length === count, tag + " : noms limités aux terres ouvertes");
    if (count === 1) {
      ok(await p.locator('[data-cl]').count() === 1, "Début : seul le Grand Chêne est visible");
      ok(!await p.locator('[data-cz="caveau"]').count(), "Aucun secret révélé");
    }
    await p.locator('[data-map-go="lisiere"]').click();
    await p.evaluate(() => { const v = document.getElementById('views'); v.scrollTop = v.scrollHeight; });
    const bottom = await p.evaluate(() => {
      const c = document.querySelector('[data-camp]').getBoundingClientRect(), tabs = document.getElementById('tabs').getBoundingClientRect();
      const end = document.querySelector('.atlas-world').getBoundingClientRect();
      return { visible: c.bottom <= tabs.top && c.top >= document.getElementById('views').getBoundingClientRect().top,
        gap: tabs.top - end.bottom };
    });
    ok(bottom.visible, tag + " : camp atteignable au-dessus de la navigation");
    ok(bottom.gap < 150, tag + " : vide inférieur excessif " + bottom.gap);
    if (!large) await shot(p, 'carte-' + width + '-' + count + '-camp');
    await p.locator('[data-map-legend]').click();
    ok(await p.locator('#modal h2').textContent() === "Lire la carte", "Légende fonctionnelle");
    await close(p);
    await p.locator('[data-cl="lisiere:0"]').focus(); await p.keyboard.press('Enter');
    ok(await p.locator('#modal h2').textContent() === "Le Grand Chêne", "Lieu accessible au clavier");
    await close(p);
    await p.locator('[data-map-go="lisiere"]').click();
    // La bascule doit reconstruire la présentation sans toucher à l’état métier.
    const zones = await p.evaluate(() => JSON.stringify(window.__eclat.E.state.zones));
    await p.locator('#atlasToggle').click();
    await p.waitForFunction(() => !document.querySelector('.atlas-world'));
    ok(await p.locator('.c-camp').count() === 1, "Mode classique préservé");
    await p.locator('#atlasToggle').click();
    await p.locator('.atlas-world').waitFor();
    const hitFill = await p.locator('.atlas-world .a-hit').first().evaluate(e => getComputedStyle(e).fill);
    ok(['rgba(0, 0, 0, 0)', 'transparent'].includes(hitFill), 'Bascule Atlas : zones tactiles transparentes dès le retour (' + hitFill + ')');
    ok(await p.evaluate(() => JSON.stringify(window.__eclat.E.state.zones)) === zones, "Bascule sans changement de découverte");
    if (count < 11) {
      await p.locator('[data-map-go]:has-text("Frontière")').click();
      await p.locator('[data-cf]').focus(); await p.keyboard.press('Space');
      ok(await p.locator('#modal .kicker').textContent() === "Sous la brume", "Frontière consultable au clavier");
      await close(p);
    }
    await p.evaluate(() => document.getElementById('views').scrollTop = 0);
    if (!large) await shot(p, 'carte-' + width + '-' + count + '-frontiere');
    ok(!errors.length, tag + " : " + errors.join("; "));
    ok(!failed.length, tag + " : ressources absentes " + failed.join("; "));
    console.log("✓ " + tag);
    await ctx.close();
  }
  // États particuliers et vrai cache hors ligne, dans une nouvelle partie jetable.
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const p = await ctx.newPage(), errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.addInitScript(raw => { localStorage.setItem('eclat.save.v1', raw); localStorage.setItem('eclat.style.carnet-defaut','1');localStorage.setItem('eclat.preview.style', 'atlas'); }, save(1, false));
  await p.goto('http://127.0.0.1:' + server.address().port);
  await p.waitForFunction(() => !!window.__eclat);
  await p.evaluate(() => navigator.serviceWorker.ready);
  for (let i = 0; i < 8; i++) { await p.waitForTimeout(100); await close(p); }
  await p.locator('#tabs [data-tab="carte"]').click();
  const redraw = async fn => { await p.evaluate(fn); await p.evaluate(() => { delete document.getElementById('v-carte').dataset.sig; window.__eclat.render(true); }); };
  await redraw(() => { window.__eclat.E.state.exp.done.lisiere = 1; });
  ok(await p.locator('[data-cl="lisiere:0"].done .a-check').count() === 1, 'Lieu exploré : coche visible');
  ok(await p.locator('[data-cl="lisiere:1"].next').count() === 1, 'Lieu suivant disponible');
  await redraw(() => { window.__eclat.E.state.exp.active = { z: 'lisiere', i: 1, t0: Date.now(), dur: 150000 }; });
  ok(await p.locator('[data-cl="lisiere:1"].active .a-active').count() === 1, 'Exploration en cours : double cercle');
  await redraw(() => { const s = window.__eclat.E.state; s.exp.active = null; s.exp.done.lisiere = 2; });
  ok(await p.locator('[data-cl="lisiere:2"].locked').count() === 1, 'Lieu verrouillé représenté');
  ok((await p.locator('[data-cl="lisiere:2"]').getAttribute('aria-label')).toLowerCase().includes('lieu caché'), 'Nom caché préservé');
  await redraw(() => { window.__eclat.E.state.pass.plaine = { paid: {}, done: false }; });
  await p.locator('[data-cp="plaine"]').focus(); await p.keyboard.press('Enter');
  ok((await p.locator('#modal h2').textContent()).includes('Hautes Herbes'), 'Passage ouvre sa fiche au clavier');
  await close(p);
  await p.evaluate(() => {
    const hit = document.querySelector('[data-cp] .a-pass-bg').getBoundingClientRect();
    const hint = document.querySelector('[data-cf] .a-frontier-hit').getBoundingClientRect();
    window.__atlasPassOverlap = hit.left < hint.right && hint.left < hit.right && hit.top < hint.bottom && hint.top < hit.bottom;
  });
  ok(!await p.evaluate(() => window.__atlasPassOverlap), 'Passage et frontière ont des cibles distinctes');
  await redraw(() => { const s = window.__eclat.E.state; s.zones = { lisiere: true, riviere: true }; s.pass = {}; });
  const bands = await p.locator('#atlas-known path').evaluateAll(nodes => nodes.map(n => { const b = n.getBBox(); return [b.y, b.y + b.height]; }));
  ok(bands.length === 2 && bands.every(b => !(b[0] < 2080 && b[1] > 2080)), 'État non contigu : la plaine fermée reste masquée');
  ok(!await p.locator('[data-cz="plaine"]').count(), 'État non contigu : aucun libellé fermé');
  await redraw(() => { const s = window.__eclat.E.state; Object.assign(s.zones, { plaine: true, collines: true, mine: true, caveau: true }); });
  ok(await p.locator('[data-cz="caveau"]').count() === 1, 'Caveau affiché seulement après découverte');
  ok(await p.locator('[data-cl="caveau:0"]').count() === 1, 'Exploration du Caveau conservée');
  await p.locator('[data-cl="caveau:0"]').focus(); await p.keyboard.press('Enter');
  ok(await p.locator('#modal h2').textContent() === 'Les Cuves', 'Caveau consultable au clavier');
  await close(p);
  ok(await p.evaluate(() => {
    const g = window.__eclat, before = g.E.serialize(); g.Carte.view(); return g.E.serialize() === before;
  }), 'Le rendu ne modifie pas la partie');
  await p.evaluate(() => document.getElementById('views').scrollTop = document.getElementById('views').scrollHeight);
  await shot(p, 'caveau-390');
  for (const [index, zone] of ['orbite', 'lune', 'mercure'].entries()) {
    await p.evaluate(count => {
      const g = window.__eclat, s = g.E.state;
      s.zones = Object.fromEntries(window.ECLAT_DATA.ZONES.filter(z => !z.secret).slice(0, count).map(z => [z.id, true]));
      s.exp.done = {}; s.exp.active = null; s.pass = {};
      delete document.getElementById('v-carte').dataset.sig; g.render(true);
    }, index + 9);
    await p.locator('[data-cl="' + zone + ':0"]').focus(); await p.keyboard.press('Enter');
    ok(await p.locator('#modal h2').textContent() === D.ZONES.find(z => z.id === zone).exps[0].n, zone + ' : lieu spatial accessible au clavier');
    await close(p);
  }
  await p.evaluate(raw => {
    const g = window.__eclat; g.E.load(raw);
    Object.assign(g.E.state.settings, { tuto: false, sound: false, visiteurs: false });
    delete document.getElementById('v-carte').dataset.sig; g.render(true);
  }, fs.readFileSync(path.join(ROOT, 'tools/fixtures/save-v5-age8-usine.json'), 'utf8'));
  ok(await p.locator('.atlas-world').count() === 1 && await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Partie industrielle réelle : carte sans débordement');
  await p.evaluate(() => document.getElementById('views').scrollTop = 0);
  await shot(p, 'partie-industrielle-390');
  await p.reload();
  await p.waitForFunction(() => navigator.serviceWorker.controller && window.__eclat);
  await ctx.setOffline(true);
  await p.reload();
  await p.waitForFunction(() => !!window.__eclat);
  for (let i = 0; i < 5; i++) { await p.waitForTimeout(100); await close(p); }
  await p.locator('#tabs [data-tab="carte"]').click();
  ok(await p.locator('.atlas-world').count() === 1, 'Carte utilisable après rechargement hors ligne');
  for (const url of ['assets/atlas/monde-vivant-v1.webp', 'assets/atlas/brume-v1.webp', 'assets/atlas/feuillet-celeste-v1.webp', 'css/carte-atlas.css', 'assets/terres/lisiere-carte.webp']) {
    ok(await p.evaluate(async url => { const r = await fetch(url); return r.ok && (await r.arrayBuffer()).byteLength > 0; }, url), 'Cache hors ligne : ' + url);
  }
  await p.locator('#atlasToggle').click();
  ok(await p.locator('.c-camp').count() === 1, 'Classique disponible hors ligne');
  ok(!await p.locator('#v-carte .atlas-map-heading').isVisible(), 'La feuille de carte permanente ne révèle pas les commandes Atlas en Classique');
  ok(!errors.length, 'États et hors ligne : aucune erreur ' + errors.join('; '));
  await ctx.close();
  console.log("✓ Atlas : " + checks + " contrôles.");
}
run().catch(e => { console.error(e); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); server.close(); });
