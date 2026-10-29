"use strict";
const assert=require('assert/strict'),D=require('../js/data'),W=require('../docs/art-direction/domaine-monde-v2/world-layout');
for(const z of D.ZONES){const r=W.regions[z.id];assert.ok(r,'emplacement pour '+z.id);assert.equal(r.bounds.length,4);assert.ok(r.bounds.every(Number.isFinite));assert.ok(r.bounds[0]<r.bounds[2]&&r.bounds[1]<r.bounds[3]);}
assert.deepEqual(W.origin,{id:'camp',x:750,y:850});
assert.ok(W.layers.every((l,i)=>!i||l.z>W.layers[i-1].z));assert.equal(new Set(W.layers.map(l=>l.id)).size,W.layers.length);
for(const id of ['camp','chene','grotte','sentier','bois','fibre','caillou']){const p=W.anchors[id],r=W.regions.lisiere.bounds;assert.ok(p.x>=r[0]&&p.x<=r[2]&&p.y>=r[1]&&p.y<=r[3],id+' dans sa terre');}
for(const id of ['champ_os','tumulus','os','cuir']){const p=W.anchors[id],r=W.regions.plaine.bounds;assert.ok(p.x>=r[0]&&p.x<=r[2]&&p.y>=r[1]&&p.y<=r[3],id+' dans sa terre');}
assert.ok(['orbite','lune','mercure'].every(id=>W.regions[id].scale==='space'));
assert.equal(W.reference.role,'reference-composite');
console.log('✓ Monde : toutes les terres réservées, repères cohérents et ordre des calques.');
