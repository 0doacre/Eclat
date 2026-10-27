/* Régression mobile : le plomb se découvre puis s’extrait avant le Gisement Noir.
 * Lance un serveur local sur 8080, puis node tools/test-progression-ui.js. */
'use strict';
const assert = require('assert/strict');
const { chromium } = require(process.env.PW || 'playwright');
const D = require('../js/data');
const { createEngine } = require('../js/engine');
function partie(mode) {
  const E = createEngine(), S = E.state;
  S.age = 9; S.cycle = 2; S.introSeen = true; S.flags.ver = D.VERSION;
  Object.assign(S.settings, { tuto: false, sound: false, visiteurs: false });
  for (const z of D.ZONES) { S.zones[z.id] = true; if (z.id === 'desert') break; }
  for (const [id, it] of Object.entries(D.ITEMS)) {
    if (it.a > 9 || it.sec || it.path || !it.r) continue;
    E.learn(id, true);
    if (it.t === 'stat') { E.add(id, 1); S.made[id] = 1; }
  }
  for (const o of D.OBJECTIVES) {
    if (Array.isArray(o) && o[0] === 'galene_1') break;
    if (Array.isArray(o)) S.made[o[0]] = 1;
    else if (o.k === 'pass') S.pass[o.z] = { done: true, paid: {} };
    else if (o.k === 'exp') S.exp.done[o.z] = D.ZONES.find(z => z.id === o.z).exps.findIndex(x => x.id === o.x) + 1;
    else if (o.k === 'ext') S.flags.extDone = true;
    else if (o.k === 'line') S.flags.lineDone = true;
  }
  for (const [id, n] of Object.entries(D.ITEMS.galene_1.r[1])) E.add(id, n);
  E.recalc();
  if (mode === 'inconnue') delete S.known.galene_1;
  if (mode === 'libre') assert.equal(E.craft('galene_1', 1).ok, true);
  return E.serialize();
}
(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}) });
  try {
    for (const mode of ['inconnue', 'prete', 'libre']) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, serviceWorkers: 'block' });
      const p = await context.newPage(), errors = [];
      p.on('pageerror', e => errors.push(e.message));
      await p.addInitScript(raw => localStorage.setItem('eclat.save.v1', raw), partie(mode));
      await p.goto(process.env.URL_ECLAT || 'http://127.0.0.1:8080');
      await p.waitForFunction(() => !!window.__eclat);
      for (let i = 0; i < 12; i++) {
        await p.waitForTimeout(150);
        await p.evaluate(() => window.__eclat.closeModal());
      }
      await p.locator('#questBtn').click();
      await p.waitForTimeout(400);
      const box = p.locator('#modal .modal-box');
      if (mode === 'inconnue') {
        assert.match(await box.innerText(), /Mine de plomb/);
        await box.locator('[data-m="qresume"][data-tab="atelier"]').click();
        assert.equal(await p.evaluate(() => window.__eclat.U.tab), 'atelier');
        assert.equal(await p.locator('#modal').evaluate(e => e.classList.contains('hidden')), true);
      } else if (mode === 'prete') {
        assert.equal(await box.locator('[data-m="qmake"]').getAttribute('data-id'), 'galene_1');
        await box.locator('[data-m="qmake"]').click();
        await p.waitForFunction(() => window.__eclat.E.queued('galene_1') > 0 || window.__eclat.E.state.made.galene_1 > 0);
      } else {
        assert.match(await box.innerText(), /attend d’être posé/);
        await box.locator('[data-gz="collines"]').click();
        await p.waitForTimeout(400);
        assert.equal(await p.evaluate(() => window.__eclat.U.tab), 'domaine');
        await p.locator('[data-xadd="collines:galene"]').first().click();
        await p.waitForFunction(() => window.__eclat.E.rate('galene') > 0);
        assert.equal(await p.evaluate(() => !!window.__eclat.E.state.zones.gisement), false);
      }
      assert.deepEqual(errors, []);
      console.log('✓ Quêtes mobile : mine de plomb ' + mode);
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
