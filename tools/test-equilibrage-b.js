/* Fer et quartz, jalons du Cuivre, compatibilité des commandes avant la 0.36. */
'use strict';
const assert = require('assert/strict');
const D = require('../js/data');
const { createEngine, SAVE_VERSION } = require('../js/engine');
const I = D.ITEMS;
const OLD = { lentille: { verre: 1 }, brique_refr: { argile: 2, sable: 2 } };
const mk = () => createEngine({ now: () => 2e12, rand: () => 0.99 });
let passed = 0;
function test(n, fn) { try { fn(); passed++; console.log('  ✓ ' + n); } catch (e) { console.error('  ✗ ' + n + '\n' + e.stack); process.exitCode = 1; } }
function setup(age = 6) {
  const E = mk(); E.state.age = age; E.state.cycle = 2;
  for (const z of D.ZONES) E.state.zones[z.id] = true;
  for (const [id, it] of Object.entries(I)) {
    if (it.a > age || it.sec || it.path || !it.r) continue;
    E.learn(id, true);
    if (it.t === 'stat') { E.add(id, 1); E.state.made[id] = 1; }
  }
  E.recalc(); return E;
}
function oldQueue(id, chain = false, waiting = false) {
  const E = setup();
  if (waiting) { E.add('bois', 3); E.queue('manche', 1, false); }
  const previous = Object.fromEntries(Object.keys(OLD).map(k => [k, I[k].r[1]]));
  try {
    for (const k in OLD) I[k].r[1] = OLD[k];
    if (chain) { E.add('sable', 100); E.add('plaque_bronze', 20); assert.ok(E.order('lunette', 1).ok); }
    else { for (const [k, n] of Object.entries(OLD[id])) E.add(k, n * 3); assert.ok(E.queue(id, 3, false).ok); }
    const raw = JSON.parse(E.serialize()); raw.v = 11;
    for (const key of ['known', 'seen', 'made', 'inv']) delete raw[key].poudre_quartz;
    const job = raw.hand.q[waiting ? 1 : 0];
    job.sp[0] = 0.4;
    return raw;
  } finally { for (const k in previous) I[k].r[1] = previous[k]; }
}
console.log('Équilibrage B et sauvegardes 0.36');
test('les jalons suivent les âges et introduisent le quartz après le chariot', () => {
  const E = mk(), ms = E.milestones();
  assert.deepEqual(ms[3].map(x => x.ob.id), ['lingot_cuivre', 'enclume_pierre', 'plaque_cuivre', 'lingot_etain', 'charbonniere', 'creuset']);
  assert.ok(!ms[4].some(x => x.ob.z === 'desert' || x.ob.id === 'chariot'));
  assert.deepEqual(ms[5].map(x => x.ob.id || x.ob.z), ['bas_fourneau', 'lingot_fer', 'chariot', 'desert', 'poudre_quartz', 'lunette']);
  let age = 0;
  for (const o of D.OBJECTIVES) if (Array.isArray(o)) { assert.ok(I[o[0]].a >= age, o[0]); age = I[o[0]].a; }
  const ids = D.OBJECTIVES.filter(Array.isArray).map(o => o[0]);
  assert.ok(ids.indexOf('ordinateur') < ids.indexOf('chaine') && ids.indexOf('chaine') < ids.indexOf('radiotelescope'));
  for (const id of ['chariot', 'quartz', 'tamis']) assert.equal(I[id].a, 5);
});
test('la nouvelle poudre et ses deux usages se découvrent par les gestes existants', () => {
  const E = mk(); E.state.age = 5; E.add('quartz', 2);
  const p = E.attempt('tailler', ['quartz']);
  assert.equal(p.kind, 'craft'); assert.equal(p.id, 'poudre_quartz'); assert.equal(E.count('poudre_quartz'), 4);
  E.add('verre', 1);
  assert.equal(E.attempt('tailler', ['verre', 'poudre_quartz']).id, 'lentille');
  E.add('four', 1); E.recalc(); E.add('argile', 2); E.add('sable', 1);
  assert.equal(E.attempt('chauffer', ['argile', 'sable', 'poudre_quartz']).id, 'brique_refr');
  assert.equal(E.count('lentille'), 1); assert.equal(E.count('brique_refr'), 1);
  assert.equal(E.count('poudre_quartz'), 2);
});
test('la variante B conserve les volumes spatiaux, sans appliquer la variante C', () => {
  assert.equal(I.fusee.r[1].composite, 400);
  assert.equal(D.PASSAGES.orbite.cost.composite, 900);
  assert.equal(D.PASSAGES.lune.cost.composite, 2700);
});
test('le chariot et le bas-fourneau se construisent avant le quartz ; le Désert débloque l’optique et l’Acier', () => {
  const E = setup(5); E.state.zones.desert = false;
  for (const [id, it] of Object.entries(I)) if (it.t === 'res' && it.a <= 5 && id !== 'quartz') E.add(id, 100000);
  assert.ok(E.plan('chariot', 1).ok);
  assert.ok(E.plan('bas_fourneau', 1).blocked.bas_fourneau?.why === 'owned', 'station déjà construite dans cette préparation');
  delete E.state.made.bas_fourneau; delete E.state.inv.bas_fourneau; E.recalc();
  assert.ok(E.plan('bas_fourneau', 1).ok, 'pas de brique réfractaire ni quartz pour le bas-fourneau');
  E.add('bas_fourneau', 1); E.state.made.bas_fourneau = 1; E.recalc();
  assert.equal(E.plan('lunette', 1).missing.quartz > 0, true);
  E.state.zones.desert = true; E.add('quartz', 10000);
  assert.equal(E.craftPlan('lunette', 1).done, true);
  assert.equal(E.craftPlan('brique_refr', 3).done, true);
  E.learn('haut_fourneau', true);
  assert.equal(E.craftPlan('haut_fourneau', 1).done, true);
});
for (const id of Object.keys(OLD)) {
  test(id + ' : ancien lot, avance et réserves conservées après deux chargements, sans poudre', () => {
    const raw = oldQueue(id), E = mk(); assert.equal(E.load(raw), true);
    const j = E.state.hand.q[0];
    assert.equal(E.state.v, SAVE_VERSION); assert.equal(j.recettes035, true); assert.equal(j.sp[0], 0.4);
    assert.deepEqual(j.b, raw.hand.q[0].b); assert.equal(E.count('poudre_quartz'), 0);
    const F = mk(); assert.equal(F.load(E.serialize()), true); assert.equal(F.state.hand.q[0].recettes035, true);
    F.catchUp(60); assert.equal(F.count(id), 3); assert.equal(F.state.hand.q.length, 0);
    assert.equal(F.count('poudre_quartz'), 0);
  });
  test(id + ' : annuler rend les anciens ingrédients réservés', () => {
    const raw = oldQueue(id), E = mk(); E.load(raw); E.cancelJob(0);
    for (const [k, n] of Object.entries(OLD[id])) assert.equal(E.count(k), (raw.inv[k] || 0) + 3 * n);
    assert.equal(E.count('poudre_quartz'), 0);
  });
  for (const mode of ['queue', 'order']) test(id + ' : une nouvelle commande ne fusionne pas avec l’ancien prix (' + mode + ')', () => {
    const E = mk(); E.load(oldQueue(id, false, true));
    E.learn('poudre_quartz', true);
    for (const [k, n] of Object.entries(I[id].r[1])) E.add(k, n);
    const r = mode === 'queue' ? E.queue(id, 1, false) : E.order(id, 1);
    assert.equal(r.ok, true); assert.ok(!r.merged); assert.equal(E.state.hand.q.length, 3);
    assert.ok(!E.state.hand.q[2].recettes035);
    E.catchUp(120); assert.equal(E.count(id), 4);
  });
}
test('une ancienne commande en chaîne conserve les lentilles, les sous-pièces et la progression', () => {
  const raw = oldQueue('lunette', true), E = mk(); assert.equal(E.load(raw), true);
  assert.ok(E.state.hand.q[0].s.some(s => s[0] === 'lentille'));
  assert.equal(E.state.hand.q[0].recettes035, true); E.catchUp(120);
  assert.equal(E.count('lunette'), 1); assert.equal(E.state.hand.q.length, 0);
});
test('les nouveaux lots nécessitent la poudre et n’héritent pas de l’ancienne recette', () => {
  const E = setup(5); E.add('verre', 1); E.add('argile', 2); E.add('sable', 2);
  assert.equal(E.queue('lentille', 1, false).ok, false);
  assert.equal(E.queue('brique_refr', 1, false).ok, false);
  E.add('poudre_quartz', 2);
  assert.equal(E.queue('lentille', 1, false).ok, true);
  assert.equal(E.queue('brique_refr', 1, false).ok, true);
  E.catchUp(60); assert.equal(E.count('lentille'), 1); assert.equal(E.count('brique_refr'), 1);
  assert.equal(E.count('poudre_quartz'), 0); assert.equal(E.count('sable'), 1);
});
test('les anciens âges, stocks, traces et terres acquises sont conservés', () => {
  for (const age of [4, 5, 9, 12]) {
    const E = setup(age); E.add('chariot', 1); E.state.made.chariot = 1;
    E.add('tamis', 2); E.add('lentille', 10); E.add('brique_refr', 50); E.state.meta.traces = 37;
    E.state.pass.desert = { paid: {}, done: true };
    const raw = JSON.parse(E.serialize()); raw.v = 11;
    const F = mk(); assert.equal(F.load(raw), true);
    assert.equal(F.state.age, age); assert.equal(F.count('tamis'), 2); assert.equal(F.count('lentille'), 10);
    assert.equal(F.count('brique_refr'), 50); assert.equal(F.state.meta.traces, 37);
    assert.equal(F.state.zones.desert, true); assert.equal(F.state.pass.desert.done, true);
  }
});
test('un ancien passage du Désert partiellement payé garde ses dépôts', () => {
  const E = setup(4); E.state.zones.desert = false; E.add('chariot', 1); E.state.made.chariot = 1;
  E.state.pass.desert = { paid: { bois: 123, plaque_bronze: 15 }, done: false };
  const raw = JSON.parse(E.serialize()); raw.v = 11;
  const F = mk(); F.load(raw);
  assert.equal(F.state.age, 4); assert.equal(F.zoneOpen('desert'), false);
  assert.deepEqual(F.state.pass.desert.paid, raw.pass.desert.paid);
  assert.equal(F.passInfo('desert').ready, true);
});
test('une ligne construite propose un premier lot avec une action de navigation existante', () => {
  const fs = require('fs'), vm = require('vm');
  const ctx = { window: {}, URL, document: { baseURI: 'http://localhost/', addEventListener() {} } };
  vm.runInNewContext(fs.readFileSync(require.resolve('../js/decouvertes-carnet'), 'utf8'), ctx);
  vm.runInNewContext(fs.readFileSync(require.resolve('../js/domaine'), 'utf8'), ctx);
  const E = setup(10); E.add('chaine', 1); E.state.made.chaine = 1;
  const api = new Proxy({ E, D, U: { compact: () => false }, top: () => '', esc: String, icon: () => '', fmt: String, perMin: String, fmtTime: String, itemPill: id => id }, { get: (o, k) => k in o ? o[k] : () => '' });
  const Dom = ctx.window.EclatDomaine.create(api);
  assert.match(Dom.view(), /data-gotab="atelier">Préparer un lot/);
  E.state.flags.tip_chaine = true;
  assert.doesNotMatch(Dom.view(), /Préparer un lot/);
});
console.log(passed + ' tests d’équilibrage B réussis.');
