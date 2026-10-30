"use strict";
const assert=require("assert/strict"),fs=require("fs"),path=require("path"),D=require("../js/data"),Core=require("../js/engine");
let checks=0;const test=(n,f)=>{try{f();checks++;console.log("  ✓ "+n);}catch(e){console.error("  ✗ "+n,e);process.exitCode=1;}};
function ready(preview=false){const E=preview?Core.withData(require("../js/equipements").createData(D,{fullGame:true})).createEngine():Core.createEngine();
  for(const[id,it]of Object.entries(E.D.ITEMS))if(it.r)E.state.known[id]=1;
  for(const id of ["bois","cuir","manche","corde","eclat"])E.add(id,20);
  return E;
}
test("l'étude distingue les gestes et retire une recette dès sa découverte",()=>{
  const E=ready();delete E.state.known.manche;delete E.state.known.laniere;
  assert.equal(E.reactions("bois").tailler,1);assert.equal(E.reactions("bois").tresser,undefined);
  E.learn("manche",true);assert.deepEqual(E.reactions("bois"),{});assert.equal(E.reactions("cuir").tailler,1);
});
test("restreindre les réactions ne modifie ni la partie ni les résultats classiques",()=>{
  const E=ready();delete E.state.known.manche;const before=E.serialize();
  assert.deepEqual(E.reactions("bois",()=>false),{});assert.deepEqual(E.reactions("bois",id=>id==="manche"),{tailler:1});
  assert.equal(E.serialize(),before);assert.deepEqual(E.reactions("bois"),{tailler:1});
});
test("un ingrédient jamais vu ne révèle pas une combinaison par le filtre",()=>{
  const E=ready();delete E.state.known.arc;
  for(const id of Object.keys(D.ITEMS.arc.r[1]))if(id!=="colle_os")E.add(id,1);
  assert.deepEqual(E.reactions("manche",id=>id==="arc"),{});
  E.add("colle_os",1);assert.deepEqual(E.reactions("manche",id=>id==="arc"),{[D.ITEMS.arc.r[0]]:1});
});
test("l'étude et le choix de filtre traversent la sauvegarde et la relève",()=>{
  const E=ready();E.state.intu=100;assert.equal(E.study("bois"),true);E.state.settings.inv={filter:"tryg"};
  const F=Core.createEngine();F.load(E.serialize());assert.equal(F.state.settings.inv.filter,"tryg");assert.equal(F.state.studied.bois,1);
  F.newCycle();assert.equal(F.state.settings.inv.filter,"tryg");assert.equal(F.state.studied.bois,1);
});
if(fs.existsSync(path.join(__dirname,"../js/equipements.js"))){
  test("le filtre équipé exige l'étude et ne montre que les gestes de l'outil",()=>{
    const E=ready(true);E.add("couteau",1);delete E.state.known.laniere;delete E.state.known.engrenage_bois;
    assert.equal(E.equipmentHasDiscovery("cuir","couteau","tailler"),false);
    E.state.studied.cuir=1;E.state.studied.manche=1;
    assert.equal(E.equipmentHasDiscovery("cuir","couteau","tailler"),true);
    assert.equal(E.equipmentHasDiscovery("manche","couteau","tailler"),true);
    assert.equal(E.equipmentHasDiscovery("cuir","couteau","assembler"),false,"un geste que le couteau n'a pas ne donne aucune piste");
    E.learn("laniere",true);assert.equal(E.equipmentHasDiscovery("cuir","couteau","tailler"),false);
  });
  test("le feu n'a qu'un geste, un outil absent ne donne aucune piste",()=>{
    const E=ready(true);E.add("feu",1);E.recalc();E.state.studied.bois=1;delete E.state.known.charbon;
    assert.equal(E.equipmentHasDiscovery("bois","feu","chauffer"),true);
    assert.equal(E.equipmentHasDiscovery("bois","feu","doux"),true,"les anciens modes restent compris");
    assert.equal(E.equipmentHasDiscovery("bois","four","chauffer"),false,"le four n'est pas posé");
    assert.equal(E.equipmentHasDiscovery("bois","inconnu","tailler"),false);
  });
}
console.log(checks+" tests des filtres de découverte réussis.");
