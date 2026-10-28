"use strict";
const assert=require("assert/strict"),Base=require("../js/data"),Eq=require("../js/equipements"),Core=require("../js/engine"),Eco=require("../js/atelier-economie");
let checks=0;const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} ≠ ${b}`);
function test(n,f){try{f();checks++;console.log("✓ "+n);}catch(e){process.exitCode=1;console.error(n,e);}}
function mk(){let t=2e12;const E=Core.withData(Eq.createData(Base)).createEngine({now:()=>t,rand:()=>.99});E.tick=dt=>{t+=dt*1000;E.update();};return E;}
function ready(){const E=mk();E.state.age=2;for(const id of ["racloir_os","etabli_amenage"]){E.add(id,1);E.state.made[id]=1;E.learn(id,true);}E.learn("laniere",true);E.add("cuir",100);E.state.ecus=10;return E;}
test("taxes marginales et absence de seuil brutal",()=>{const q=Eco.quote(30,0,20,1);close(q.gross,30);close(q.tax,4);close(q.net,26);close(Eco.quote(20,0,20,1).net,18);close(Eco.quote(21,0,20,1).net,18.8);});
test("fractionner une vente ne contourne pas la taxe",()=>{const a=Eco.quote(75,0,20,1),b=Eco.quote(25,0,20,1),c=Eco.quote(50,25,20,1);close(a.net,b.net+c.net);close(Eco.quote(200,0,20,1).tax,80);});
test("la réserve est respectée et le troqueur reste intact",()=>{const E=ready();E.add("laniere",50);const before=JSON.stringify([E.state.comptoir,E.state.meta.troqueurDelivered]);const r=E.merchantSell(100);assert.equal(r.n,30);assert.equal(E.count("laniere"),20);assert.equal(JSON.stringify([E.state.comptoir,E.state.meta.troqueurDelivered]),before);close(E.state.ecus,10+r.net);});
test("vente automatique opt-in et pas de vente des matières ou outils",()=>{const E=ready();E.add("laniere",30);E.tick(5);assert.equal(E.count("laniere"),30);E.merchantConfigure(true,20);E.tick(5);assert.equal(E.count("laniere"),20);assert.equal(E.count("cuir"),100);assert.equal(E.count("racloir_os"),1);});
test("l’aménagement est une vraie recette et ne crée pas un second poste",()=>{const E=mk();E.learn("etabli_amenage",true);E.add("bois",10);E.add("corde",3);E.add("caillou",4);assert.equal(E.order("etabli_amenage",1).ok,true);E.tick(10);assert.equal(E.count("etabli_amenage"),1);assert.equal(E.count("bois"),0);assert.equal(E.workplaceList().filter(x=>x.id==="etabli").length,1);assert.equal(E.workplaceList()[0].n,"Établi aménagé");});
test("embauche et avance consomment des écus ; salaire uniquement sur travail achevé",()=>{const E=ready();const h=E.atelierEconomyInfo().hire;assert.equal(E.workerHire().ok,true);close(E.state.ecus,10-h);assert.equal(E.workerFund(1).ok,true);const purse=E.state.ecus;E.workerSet(true);E.tick(10);const s=E.atelierEconomyInfo();assert.ok(s.produced>0);close(s.wages+s.budget,1);assert.equal(E.state.ecus,purse);assert.ok(s.budget>=0);assert.equal(E.count("racloir_os"),1);});
test("pas d’embauche sans poste ni de production sans avance ou peaux",()=>{const E=mk();assert.equal(E.workerHire().why,"post");const R=ready();R.workerHire();R.workerSet(true);R.tick(10);assert.equal(R.count("laniere"),0);R.workerFund(1);R.add("cuir",-100);R.tick(10);close(R.atelierEconomyInfo().budget,1);assert.equal(R.count("laniere"),0);});
test("avance récupérable seulement en pause, aucune dette",()=>{const E=ready();E.workerHire();E.workerFund(1);E.workerSet(true);assert.equal(E.workerWithdraw().ok,false);E.tick(100);assert.ok(E.atelierEconomyInfo().budget>=0);const old=E.state.ecus;E.workerSet(false);const remaining=E.atelierEconomyInfo().budget;assert.equal(E.workerWithdraw().ok,true);close(E.state.ecus,old+remaining);});
test("le couteau accélère aussi l’ouvrier et élargit la série manuelle",()=>{const E=ready();const slow=E.atelierEconomyInfo().duration;E.add("couteau",1);close(E.atelierEconomyInfo().duration,slow/2);assert.equal(E.equipmentList().find(x=>x.id==="racloir_os").batch,5);assert.equal(E.equipmentList().find(x=>x.id==="couteau").batch,10);});
test("le seuil se renouvelle par période, pas en désactivant le marchand",()=>{const E=ready();E.add("laniere",100);E.merchantSell(30);assert.equal(E.atelierEconomyInfo().sold,30);E.merchantConfigure(false,20);E.merchantConfigure(true,20);assert.equal(E.atelierEconomyInfo().sold,30);E.merchantConfigure(false,20);E.workerHire();const quota=E.atelierEconomyInfo().quota;E.tick(60);assert.equal(E.atelierEconomyInfo().sold,0);assert.ok(E.atelierEconomyInfo().quota>quota);});
test("rechargement conserve budget, taxes et commandes ; ancienne sauvegarde acceptée",()=>{const E=ready();E.workerHire();E.workerFund(1);E.workerSet(true);E.merchantConfigure(true,20);E.tick(8);const R=mk();R.load(E.serialize());assert.deepEqual(R.atelierEconomyInfo(),E.atelierEconomyInfo());const old=JSON.parse(E.serialize());delete old.atelierEconomy;R.load(JSON.stringify(old));assert.equal(R.atelierEconomyInfo().hired,false);});
test("rattrapage hors ligne limité par les stocks et l’avance",()=>{const E=ready();E.workerHire();E.workerFund(1);E.workerSet(true);E.merchantConfigure(true,0);E.tick(3600);const s=E.atelierEconomyInfo();assert.ok(s.produced>0&&s.produced<=26);assert.ok(E.count("cuir")>=87);close(s.budget+s.wages,1);assert.ok(s.net>=0);});
test("production, vente et salaire forment une boucle rentable sans crédit gratuit",()=>{const E=ready();E.state.ecus=0;E.add("laniere",50);E.merchantConfigure(true,10);assert.equal(E.merchantSell(50).ok,true);assert.equal(E.workerHire().ok,true);assert.equal(E.workerFund(1).ok,true);E.workerSet(true);E.tick(60);assert.ok(E.atelierEconomyInfo().produced>0);assert.ok(E.atelierEconomyInfo().net>E.atelierEconomyInfo().wages);assert.ok(E.state.ecus>=0);});
test("le bonus territorial se combine avec le couteau et accélère la production réelle de l’ouvrier",()=>{
  const A=ready(),B=ready();A.add("couteau",1);B.add("couteau",1);
  const base=A.atelierEconomyInfo().duration;B.state.meta.terres.plaine=10;
  close(B.atelierEconomyInfo().duration,base/1.5);
  for(const E of [A,B]){E.workerHire();E.workerFund(1);E.workerSet(true);E.tick(base*2.1);}
  assert.ok(B.atelierEconomyInfo().produced>A.atelierEconomyInfo().produced);
  assert.equal(B.count("couteau"),1);assert.ok(B.atelierEconomyInfo().budget>=0);
});
test("les bonus territoriaux survivent à la sauvegarde équipée et à son nouveau cycle",()=>{
  const E=ready();E.state.meta.terres.plaine=3;const raw=E.serialize(),F=mk();F.load(raw);
  close(F.terreBonus("plaine"),1.15);assert.equal(F.SAVE_VERSION,13);
  F.newCycle();close(F.terreBonus("plaine"),1.15);assert.ok(F.equipmentList().some(x=>x.id==="percuteur_pierre"&&x.ready));
});
console.log(checks+" scénarios économiques réussis.");
