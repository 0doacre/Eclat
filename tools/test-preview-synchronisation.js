"use strict";
const assert=require("assert/strict"),D=require("../js/data"),Core=require("../js/engine"),Eq=require("../js/equipements");
const E=Core.withData(Eq.createData(D,{fullGame:true})).createEngine();
for(const id of ["racloir_os","couteau"]){E.add(id,1);E.state.made[id]=1;}
E.state.age=2;
const slow=E.handTime("laniere",{equipment:"racloir_os",mode:"couper"});
const fast=E.handTime("laniere",{equipment:"couteau",mode:"couper"});
assert.ok(Math.abs(slow/fast-2)<1e-8,"le couteau garde son avantage propre");
E.state.meta.terres.plaine=10;
assert.ok(Math.abs(E.handTime("laniere",{equipment:"couteau",mode:"couper"})-fast/1.5)<1e-8,"le territoire multiplie le bénéfice de l'outil");
E.state.age=7;const before=E.handTime("circuit_vapeur");E.state.pass.plaine={done:true,paid:{}};
assert.ok(E.handTime("circuit_vapeur")>before,"la fatigue de Gemini reste active dans le profil équipé");
assert.ok(E.shouldSuggestReleve(),"la proposition de relève reste disponible");
const comp=E.machRate("chaine","circuit_vapeur");E.state.meta.terres.desert=10;
assert.ok(Math.abs(E.machRate("chaine","circuit_vapeur")-comp*1.5)<1e-8,"la chaîne bénéficie aussi du bonus territorial");
console.log("5 contrôles de synchronisation preview réussis.");
