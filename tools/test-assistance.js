"use strict";
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),D=require('../js/data'),Core=require('../js/engine'),A=require('../js/assistance');
let n=0;function test(title,fn){try{fn();n++;console.log('  ✓ '+title);}catch(e){console.error('  ✗ '+title,e);process.exitCode=1;}}
const mk=()=>Core.createEngine({now:()=>2e12,rand:()=>.99});
test('le service worker indique la version réellement contrôlée au rapport',()=>{const code=fs.readFileSync(path.join(__dirname,'../sw.js'),'utf8'),handlers={};require('vm').runInNewContext(code,{self:{addEventListener:(type,fn)=>handlers[type]=fn}});let actual;handlers.message({data:{type:'ECLAT_BUILD'},ports:[{postMessage:v=>actual=v.build}]});assert.equal(actual,/const BUILD = "([^"]+)"/.exec(code)[1]);assert.doesNotThrow(()=>handlers.message({data:{type:'ECLAT_BUILD'}}));});
function order(E,id='manche',qty=2,stock=0){E.learn(id,true);if(stock)E.add('bois',stock);assert.equal(E.order(id,qty).ok,true);}
test('une commande sans bois explique le manque et mène au gisement',()=>{const E=mk();order(E);const d=A.diagnostics(E);assert.equal(d.jobs[0].state,'resource');assert.equal(d.jobs[0].resource,'bois');assert.equal(d.jobs[0].missing,6);assert.equal(d.jobs[0].action.kind,'zone');assert.equal(d.jobs[0].action.id,'lisiere');});
test('une fabrication active ne devient pas un faux blocage',()=>{const E=mk();order(E,'manche',2,6);assert.equal(A.diagnostics(E).jobs[0].state,'active');});
test('la commande suivante distingue une attente de son tour',()=>{const E=mk();E.learn('corde',true);E.add('fibre',20);order(E,'manche',20,60);assert.equal(E.order('corde',2).ok,true);assert.equal(A.diagnostics(E).jobs[1].state,'queue');});
test('un poste disparu est distingué des matières manquantes',()=>{const E=mk();E.state.age=2;E.add('feu',1);E.add('argile',4);E.learn('brique',true);E.recalc();assert.equal(E.order('brique',2).ok,true);E.add('feu',-1);E.recalc();assert.equal(A.diagnostics(E).jobs[0].state,'station');});
test('le débit et le temps concernent uniquement la matière manquante',()=>{const E=mk();E.add('cabane',1);E.state.known.cabane=1;E.domExtAdd('lisiere','bois',1,'cabane');E.step(1);order(E,'manche',100);const j=A.diagnostics(E).jobs[0];assert.equal(j.state,'resource');assert.ok(j.rate>0);assert.ok(j.eta>0);assert.equal(j.eta,j.missing/j.rate);});
test('les commandes réellement terminées sont distinguées des commandes annulées',()=>{const E=mk();order(E,'manche',2,6);const before=A.snapshot(E);E.catchUp(60);const r=A.resume(E,before);assert.deepEqual(r.completed.map(x=>[x.id,x.n]),[['manche',2]]);assert.equal(r.ongoing.length,0);const F=mk();order(F);const b=A.snapshot(F);F.cancelJob(0);assert.equal(A.resume(F,b).completed.length,0);});
test('le bilan distingue ce qui reste actif et ce qui attend',()=>{const E=mk();order(E);const before=A.snapshot(E);E.catchUp(600);const r=A.resume(E,before);assert.equal(r.completed.length,0);assert.equal(r.waiting[0].resource,'bois');assert.ok(r.currentGoal);});
test('le rapport exige une description et ne joint pas de sauvegarde par défaut',()=>{const E=mk();assert.throws(()=>A.report(E,{}, {observed:' '},[],null),/Décris/);const r=A.report(E,{tab:'atelier'},{observed:'La commande attend.'},[],null);assert.equal(r.format,'eclat-rapport-v1');assert.equal(r.jeu.profil,'classique');assert.ok(!('sauvegarde'in r));assert.equal(r.jeu.build,null);});
test('la sauvegarde jointe conserve la progression et retire les données de compte',()=>{const E=mk();E.add('bois',17);E.state.settings.account={token:'IDENTIFIANT_TEST',email:'IDENTIFIANT_TEST@example.test'};E.state.meta.extra={password:'IDENTIFIANT_TEST',utile:1};const r=A.report(E,{tab:'atelier'},{observed:'Un problème',includeSave:true},[],'abc123');assert.equal(r.sauvegarde.inv.bois,17);assert.equal(r.sauvegarde.settings.account,undefined);assert.equal(r.sauvegarde.meta.extra.password,undefined);assert.equal(r.sauvegarde.meta.extra.utile,1);assert.ok(!JSON.stringify(r).includes('IDENTIFIANT_TEST'));const F=mk();assert.equal(F.load(r.sauvegarde),true);assert.equal(F.count('bois'),17);});
test('les textes sont limités et le journal du rapport est borné',()=>{const E=mk(),r=A.report(E,{}, {observed:'x'.repeat(8000)},Array.from({length:50},(_,i)=>({type:'crafted',i})),null);assert.equal(r.observe.length,4000);assert.equal(r.actionsRecentes.length,20);assert.equal(r.actionsRecentes[0].i,30);});
test('le journal de session est borné à 200 événements et inclus dans le rapport',()=>{
  const mem={};global.localStorage={getItem:k=>mem[k]||null,setItem:(k,v)=>{mem[k]=String(v);},removeItem:k=>{delete mem[k];}};
  A.clearSessionLog();
  for(let i=0;i<250;i++)A.logSession('test',{i});
  const log=A.getSessionLog();
  assert.equal(log.length,200);
  assert.equal(log[0].i,50);
  assert.equal(log[199].i,249);
  const E=mk();
  const r=A.report(E,{tab:'domaine',style:'vivant',width:390},{observed:'Test journal'},[]);
  assert.equal(r.jeu.style,'vivant');
  assert.equal(r.journalSession.length,200);
  A.clearSessionLog();
  assert.equal(A.getSessionLog().length,0);
});
if(fs.existsSync(path.join(__dirname,'../js/equipements.js'))){
  const equipped=()=>Core.withData(require('../js/equipements').createData(D,{fullGame:true})).createEngine({now:()=>2e12,rand:()=>.99});
  test('la preview distingue une avance de salaire épuisée et une pause volontaire',()=>{const E=equipped();for(const id of ['racloir_os','etabli_amenage'])E.add(id,1);E.learn('laniere',true);Object.assign(E.state.atelierEconomy,{hired:true,working:true,budget:0});assert.equal(A.diagnostics(E).worker.state,'wage');E.workerSet(false);assert.equal(A.diagnostics(E).worker.state,'paused');});
  test('un outil perdu garde son diagnostic propre dans une ancienne commande équipée',()=>{const E=equipped();E.add('racloir_os',1);E.add('cuir',10);E.learn('laniere',true);assert.equal(E.queue('laniere',2,false,undefined,{equipment:'racloir_os',mode:'couper'}).ok,true);E.add('racloir_os',-1);E.recalc();assert.equal(A.diagnostics(E).jobs[0].state,'equipment');});
}
console.log(n+' tests d’assistance réussis.');
