"use strict";
const assert = require('assert/strict'), fs = require('fs'), path = require('path');
const D = require('../js/data.js'), {createEngine} = require('../js/engine.js'), {lot} = require('../js/carnet.js');
let passed = 0;
function test(n, f) { try { f(); passed++; console.log('  ✓ '+n); } catch(e) { process.exitCode=1;console.error('  ✗ '+n+'\n'+e.stack); } }
const mk = () => createEngine({now:()=>3e12,rand:()=>0.5});
test('lot : les ingrédients et la commande correspondent, sans mutation pendant la lecture', () => {
 const E=mk();E.learn('manche',true);const before=E.serialize(),v=lot(E,D,'manche',10);
 assert.equal(E.serialize(),before);assert.equal(v.n,10);assert.equal(v.sortie,10);assert.deepEqual(v.cout,{bois:30});
 const r=E.order('manche',10);assert.ok(r.ok);assert.deepEqual(r.job.s,v.plan.steps);assert.deepEqual(r.missing,v.plan.missing);
});
test('lot : le rendement d’une recette compte dans la production annoncée', () => {
 const E=mk();E.learn('fil_cuivre',true);const v=lot(E,D,'fil_cuivre',10);
 assert.equal(v.sortie,30);assert.deepEqual(v.cout,{plaque_cuivre:10});
});
test('lot : les pièces intermédiaires utilisent le stock avant de se fabriquer', () => {
 const E=mk();for(const id of ['manche','corde','archet'])E.learn(id,true);
 Object.assign(E.state.inv,{bois:100,fibre:100,manche:1});const v=lot(E,D,'archet',10),r=E.order('archet',10);
 assert.ok(r.ok);assert.ok(v.plan.steps.length>1);assert.deepEqual(r.job.s,v.plan.steps);
 assert.equal(v.plan.used.manche,1);assert.deepEqual(r.missing||{},v.plan.missing);
});
test('lot : les prix croissants incluent les constructions déjà commandées', () => {
 const E=mk();E.load(fs.readFileSync(path.join(__dirname,'fixtures/save-v5-age8-usine.json'),'utf8'));
 Object.assign(E.state.inv,{manche:1e8,corde:1e8,fibre:1e8});assert.ok(E.order('cabane',2).ok);
 const start=E.count('cabane')+E.queued('cabane'),v=lot(E,D,'cabane',1000);
 assert.equal(v.n,10);assert.deepEqual(v.cout,E.totalCost('cabane',10,start));
 assert.notDeepEqual(v.cout,E.totalCost('cabane',10,E.count('cabane')));
});
test('lot : les objets uniques restent à une fabrication', () => {
 const E=mk();E.learn('hache_pierre',true);assert.equal(lot(E,D,'hache_pierre',1000).n,1);
});
test('lot : Max suit la Réserve et ne transforme jamais zéro en une commande', () => {
 const E=mk();E.learn('manche',true);E.state.inv.bois=24;
 assert.equal(lot(E,D,'manche','max').n,8);E.state.inv.bois=20;assert.equal(lot(E,D,'manche','max').n,6);
 E.state.inv.bois=0;const v=lot(E,D,'manche','max');assert.equal(v.n,0);assert.equal(v.plan,null);assert.deepEqual(v.cout,{});
});
test('lot : une recette inconnue n’a pas de devis', () => {
 const E=mk();assert.equal(lot(E,D,'radio',10),null);
});
console.log(passed+' tests du Carnet réussis'+(process.exitCode?', des échecs.':'.'));
