'use strict';
const assert = require('assert/strict'), fs = require('fs'), vm = require('vm');
const D = require('../js/data'), { createEngine } = require('../js/engine');
const T = require('../js/transmission');
let n = 0;
const test = (nom, f) => { try { f(); n++; console.log('  ✓ ' + nom); } catch (e) { console.error('  ✗ ' + nom, e); process.exitCode = 1; } };
const mk = () => createEngine({ now: () => 2e12, rand: () => .99 });
function acquis(E, ids) { for (const id of ids) E.state.made[id] = 1; }
const page = E => { const id = Object.keys(E.RECIT.pages)[0]; E.givePage(id, 'test'); return id; };
test('cinq recettes nouvelles, aucune ne bloque les étapes principales', () => {
  const ids = ['encre','papyrus','papier','presse_imprimer','serveur_archives'];
  for (const id of ids) { assert.ok(D.ITEMS[id].r); assert.ok(!D.OBJECTIVES.some(o => Array.isArray(o) && o[0] === id)); }
  assert.equal(Object.keys(D.ITEMS).length, 271); assert.equal(Object.values(D.ITEMS).filter(it=>it.r).length, 238);
});
test('écriture : verrou, limites, suppression et persistance après relève et deux chargements', () => {
  const E = mk(); assert.equal(E.transmissionNote('note').ok, false);
  acquis(E, ['papyrus']); assert.equal(E.transmissionNote(' ').ok, false); assert.equal(E.transmissionNote('x'.repeat(501)).ok, false);
  assert.equal(E.transmissionNote('<script>un souvenir</script>').ok, true);
  E.newCycle(); const F = mk(); F.load(E.serialize()); const G=mk(); G.load(F.serialize());
  assert.equal(G.transmission().notes[0].cycle, 1); assert.equal(G.transmission().ecrire, true);
  assert.equal(G.transmissionEffacerNote(-1), false); assert.equal(G.transmissionEffacerNote(0), true);
  for(let i=0;i<50;i++) assert.equal(G.transmissionNote('note '+i).ok,true);
  assert.equal(G.transmissionNote('de trop').ok, false);
});
test('la presse ne crée, ne consomme et ne révèle aucune page', () => {
  const E=mk(); const id=page(E); const before=JSON.stringify(E.state.livre);
  assert.equal(E.transmissionCopier().ok,false); acquis(E,['presse_imprimer']);
  assert.equal(E.transmissionCopier().n,1); assert.equal(E.transmissionCopier().n,0);
  assert.equal(JSON.stringify(E.state.livre),before); E.newCycle(); assert.equal(E.transmission().copies,1);
  assert.ok(E.livre().filter(c=>!c.page).every(c=>c.id===null)); assert.equal(E.livre().find(c=>c.id===id).page!==null,true);
});
test('recherche : exclusivement les pages acquises et les annotations actuellement visibles', () => {
  const E=mk(); const id=page(E); acquis(E,['serveur_archives']);
  const p=E.RECIT.pages[id], old=p.notes;
  try {
    p.notes=[{t:'visible_testmot'},{t:'secret_testmot',cond:{age:14}}];
    assert.equal(E.transmissionChercher('visible_testmot')[0].id,id);
    assert.equal(E.transmissionChercher('secret_testmot').length,0);
    const hidden=Object.keys(E.RECIT.pages).find(k=>!E.state.livre.p[k]);
    const titre=E.RECIT.pages[hidden].titre;
    assert.ok(E.transmissionChercher(titre).every(r=>r.id!==hidden));
    assert.equal(E.transmissionChercher('').length,0);
  } finally { p.notes=old; }
});
test('réseau et rapprochement exigent leurs équipements, sans requête externe',()=>{
  const E=mk();acquis(E,['serveur_archives']);assert.equal(E.transmission().reseau,false);assert.equal(E.transmission().rapprocher,false);
  acquis(E,['radio','ia']);assert.equal(E.transmission().reseau,true);assert.equal(E.transmission().rapprocher,true);
});
test('anciennes sauvegardes et données déformées se normalisent sans changer les acquis',()=>{
  const E=mk();const raw=JSON.parse(E.serialize());delete raw.meta.transmission;const F=mk();assert.equal(F.load(raw),true);assert.equal(F.transmission().notes.length,0);
  F.state.meta.transmission={notes:[null,{texte:'x'.repeat(800),cycle:-4}],copies:{page_inconnue:true},acquis:{ia:'true'}};
  assert.equal(F.transmission().notes[0].texte.length,500);assert.equal(F.transmission().notes[0].cycle,1);assert.equal(F.transmission().copies,0);assert.equal(F.transmission().rapprocher,false);
});
test('HTML : les notes et les recherches sont échappées, les titres inconnus restent absents',()=>{
  const E=mk();acquis(E,['papyrus','serveur_archives','ia']);E.transmissionNote('<img src=x onerror=alert(1)>');
  const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const h=T.html(E,{transQuery:'" onfocus="alert(1)'},esc);
  assert.ok(!h.includes('<img'));assert.ok(h.includes('&lt;img'));assert.ok(!h.includes('value="" onfocus='));
  for(const id of Object.keys(E.RECIT.pages)) assert.ok(!h.includes('data-page="'+id+'"'));
  for(const mark of ['data-trans-note','data-trans-search','data-trans-delete']) assert.ok(h.includes(mark));
});
test('le Livre reste accessible sans page après fabrication du papyrus',()=>{
  const E=mk();acquis(E,['papyrus']);
  const ctx={window:{EclatTransmission:T},setTimeout:()=>{}};
  vm.runInNewContext(fs.readFileSync(require.resolve('../js/journal'),'utf8'),ctx);
  const api=new Proxy({E,D,U:{journalTab:'livre'},esc:String,subTabs:()=>'',tabAvailable:()=>false,stampHTML:()=>''},{get:(o,k)=>k in o?o[k]:()=>''});
  const h=ctx.window.EclatJournal.create(api).viewJournal();
  assert.ok(h.includes('data-trans-note'));assert.ok(h.includes('livre-grid'));
});
console.log(n+' tests de transmission réussis.');
