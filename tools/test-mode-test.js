"use strict";
const assert = require('assert/strict'), Core = require('../js/engine'), D = require('../js/data'), T = require('../js/mode-test');
const session = {getItem: () => '1'};
assert.equal(T.config(false,'https://example.com/?mode-test=1',session).key,'eclat.save.v1.test');
assert.equal(T.config(true,'https://example.com/?mode-test=1',session).key,'eclat.preview.craft.v1.test');
assert.equal(T.config(false,'https://example.com/?mode-test=1',{getItem:()=>null}).active,false);
for (let a=0;a<D.AGES.length;a++) {
  const E=Core.createEngine(),c=T.controller(E,D); c.prepare(a); assert.equal(E.state.age,a);
  E.milestones().slice(0,a).flat().forEach(m=>assert.ok(m.done,'préalable '+a+'/'+m.ob.i));
  c.recipes(a); Object.entries(D.ITEMS).filter(([,i])=>i.a===a&&i.r).forEach(([id])=>assert.ok(E.state.known[id],id));
  const ob=E.objective(); if(ob){c.objective();assert.ok(E.milestones().flat().find(m=>m.i===ob.i).done,'objectif '+a);}
  c.resources(a); c.recipes(a,true);
  Object.entries(D.ITEMS).filter(([,i])=>i.a===a&&i.r).forEach(([id])=>assert.ok(E.state.made[id]>0,id));
}
const E=Core.createEngine(),c=T.controller(E,D); c.explore('lisiere'); assert.equal(E.state.exp.done.lisiere,E.ZONES.lisiere.exps.length);c.passage('plaine');assert.ok(E.zoneOpen('plaine'));assert.throws(()=>c.prepare(-1));assert.throws(()=>c.explore('inconnu'));assert.throws(()=>c.finish());
console.log('✓ Mode test : 15 âges, recettes, objectifs, passages et isolation des clés.');
