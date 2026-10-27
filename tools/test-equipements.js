/* Profil de craft isolé : recettes, dépendances, file réelle et anciennes parties. */
"use strict";
const assert = require("assert/strict"), fs = require("fs"), path = require("path");
const Base = require("../js/data"), Normal = require("../js/engine"), Eq = require("../js/equipements");
const D = Eq.createData(Base, { gentleStart: false }), Proto = Normal.withData(D);
let checks = 0;
function test(name, f) { try { f(); checks++; console.log("  ✓ " + name); } catch(e) { process.exitCode = 1; console.error("  ✗ " + name + "\n" + e.stack); } }
function mk(api = Proto) {
  let time = 2e12;
  const E = api.createEngine({ now: () => time, rand: () => 0.99 });
  E.tick = seconds => { for (let n = 0; n < Math.ceil(seconds * 10); n++) { time += 100; E.update(); } };
  return E;
}
function stock(E, values) { for (const [id,n] of Object.entries(values)) E.add(id,n); }
function owns(E, id) { E.add(id,1); E.state.made[id] = 1; E.learn(id,true); E.recalc(); }
function prepared(api = Proto) {
  const E = mk(api); E.state.age = 3; E.state.cycle = 2;
  for (const id of Object.keys(E.D.ITEMS)) if (E.D.ITEMS[id].r) E.learn(id,true);
  for (const id of ["feu", "four", "enclume_pierre"]) owns(E,id);
  if (E.D.CRAFT_EQUIPMENT) for (const id of ["percuteur_pierre","racloir_os","couteau","ciseau","polissoir","pioche_pierre"]) owns(E,id);
  return E;
}

test("le profil conserve toutes les recettes et isole ses transformations", () => {
  assert.equal(Object.keys(Base.ITEMS).length,267); assert.equal(Object.keys(D.ITEMS).length,270);
  const before = Object.keys(Base.ITEMS).filter(id=>Base.ITEMS[id].r&&Base.ITEMS[id].a<=3);
  assert.equal(before.length,54);
  for (const id of before) { assert.ok(D.ITEMS[id].r); assert.ok(D.CRAFT_EQUIPMENT.recipes[id]?.length); }
  assert.equal(Base.ITEMS.outre.r[1].aiguille,2); assert.equal(D.ITEMS.outre.r[1].aiguille,undefined);
  assert.equal(Base.ITEMS.engrenage_bois.r[1].eclat,1);
  assert.equal(Normal.SAVE_VERSION,12); assert.equal(Proto.SAVE_VERSION,13);
});
test("le moteur normal et deux profils ne partagent pas les recettes modifiées", () => {
  const second = Eq.createData(Base); second.ITEMS.outre.r[1].cuir = 99;
  assert.equal(D.ITEMS.outre.r[1].cuir,8); assert.equal(Base.ITEMS.outre.r[1].cuir,8);
  assert.equal(Normal.createEngine().equipmentChoices,undefined);
});
test("le percuteur démarre avec les cailloux de la Lisière", () => {
  const E=mk();stock(E,{caillou:2,bois:3});
  assert.equal(E.attemptWith("mains","assembler",["caillou"]).id,"percuteur_pierre");
  assert.equal(E.count("percuteur_pierre"),1);
  assert.equal(E.attemptWith("percuteur_pierre","tailler",["bois"]).id,"manche");
  assert.equal(E.count("manche"),1);assert.equal(E.count("percuteur_pierre"),1);
});
test("la mauvaise station ou le mauvais mode ne révèle ni ne consomme", () => {
  const E=mk();owns(E,"feu");stock(E,{manche:2,bois:4});
  const before=JSON.stringify({inv:E.state.inv,known:E.state.known,tries:E.state.stats.tries});
  assert.equal(E.attemptWith("feu","vif",["manche"]).why,"incompatible");
  assert.equal(E.attemptWith("feu","doux",["bois"]).why,"incompatible");
  assert.equal(JSON.stringify({inv:E.state.inv,known:E.state.known,tries:E.state.stats.tries}),before);
  assert.equal(E.attempt("chauffer",["manche"]).why,"selection");
});
test("le mode adapté permet l’épieu sans transformer le réglage en température globale", () => {
  const E=mk();owns(E,"feu");stock(E,{manche:2});
  assert.equal(E.attemptWith("feu","doux",["manche"]).id,"epieu");
  assert.equal(E.count("epieu"),1);
});
test("aiguille et flûte restent distinctes avec les mêmes matières", () => {
  const E=mk();E.state.age=1;owns(E,"percuteur_pierre");stock(E,{os:5});
  assert.equal(E.attemptWith("percuteur_pierre","tailler",["os"]).id,"aiguille");
  assert.equal(E.count("aiguille"),2);
  assert.equal(E.attemptWith("aiguille","percer",["os"]).id,"flute");
  assert.equal(E.count("aiguille"),2);assert.equal(E.count("flute"),1);
});
test("tunique et gants ont des identités distinctes après retrait de l’outil des ingrédients", () => {
  const E=prepared();owns(E,"aiguille");stock(E,{cuir:15,fibre:20});
  assert.equal(E.equipmentRecipe("aiguille","coudre",["cuir","fibre"]),"tunique");
  assert.equal(E.equipmentRecipe("mains","assembler",["cuir","fibre"]),null);
});
test("le guide prépare le racloir avant l’outre et ne demande pas le silex", () => {
  const E=mk();E.state.age=1;E.state.zones.plaine=true;owns(E,"percuteur_pierre");
  E.learn("laniere",true);stock(E,{cuir:1,os:3,caillou:1});
  assert.equal(E.nextStep("laniere").id,"racloir_os");
  E.learn("racloir_os",true);
  const p=E.plan("laniere",1);assert.equal(p.ok,true);assert.deepEqual(p.steps,[["racloir_os",1],["laniere",1]]);
  assert.equal(E.queue("laniere",1,true).ok,true);E.tick(20);
  assert.equal(E.count("laniere"),2);assert.equal(E.count("racloir_os"),1);assert.equal(E.count("silex"),0);
});
test("la chaîne fabrique le percuteur avant le manche et le conserve", () => {
  const E=mk();for(const id of ["percuteur_pierre","manche"])E.learn(id,true);stock(E,{caillou:2,bois:3});
  assert.deepEqual(E.plan("manche",1).steps,[["percuteur_pierre",1],["manche",1]]);
  E.queue("manche",1,true);E.tick(10);assert.equal(E.count("manche"),1);assert.equal(E.count("percuteur_pierre"),1);
});
test("une matière disponible ne contourne pas l’équipement encore en attente", () => {
  const E=mk();for(const id of ["percuteur_pierre","manche"])E.learn(id,true);stock(E,{bois:3});
  assert.equal(E.order("manche",1).ok,true);E.tick(10);
  assert.equal(E.count("manche"),0);assert.equal(E.count("percuteur_pierre"),0);
  E.add("caillou",2);E.tick(10);assert.equal(E.count("manche"),1);
});
test("une aiguille préparée dans la commande rejoint la Réserve et sert d’outil", () => {
  const E=mk();E.state.age=1;owns(E,"percuteur_pierre");E.state.zones.plaine=true;
  for(const id of ["aiguille","flute"])E.learn(id,true);stock(E,{os:5});
  const p=E.plan("flute",1);assert.equal(p.ok,true);assert.deepEqual(p.steps,[["aiguille",1],["flute",1]]);
  E.queue("flute",1,true);E.tick(20);assert.equal(E.count("flute"),1);assert.equal(E.count("aiguille"),2);
});
test("une aiguille fabriquée reste partagée si sa première commande attend des peaux", () => {
  const E=mk();E.state.age=1;E.state.zones.plaine=true;owns(E,"percuteur_pierre");
  for(const id of ["aiguille","outre","flute"])E.learn(id,true);
  stock(E,{os:2,laniere:6});assert.equal(E.order("outre",1).ok,true);E.tick(5);
  assert.equal(E.count("outre"),0);assert.equal(E.count("aiguille"),2);
  assert.equal(E.state.hand.q[0].b.aiguille||0,0);
  const resumed=mk();resumed.load(E.serialize());resumed.add("os",3);
  assert.equal(resumed.order("flute",1).ok,true);resumed.tick(10);
  assert.equal(resumed.count("flute"),1);assert.equal(resumed.count("outre"),0);assert.equal(resumed.count("aiguille"),2);
});
test("une seule aiguille suffit aux nouvelles coutures et n’entre pas dans leur réserve", () => {
  const E=prepared();E.add("aiguille",1);stock(E,{cuir:8,laniere:6});
  assert.equal(E.queue("outre",1,false).ok,true);assert.equal(E.state.hand.q[0].b.aiguille,undefined);E.tick(10);
  assert.equal(E.count("outre"),1);assert.equal(E.count("aiguille"),1);
  stock(E,{cuir:15,fibre:20});assert.equal(E.queue("tunique",1,false).ok,true);E.tick(10);
  assert.equal(E.count("tunique"),1);assert.equal(E.count("aiguille"),1);
});
test("le four ne remplace pas automatiquement les procédés du foyer", () => {
  const E=mk();E.state.age=3;owns(E,"four");
  assert.equal(E.equipmentCheck("brique"),null);
  assert.equal(E.equipmentCheck("charbon").required,"feu");
  assert.equal(E.equipmentCheck("colle_os").required,"feu");
  assert.equal(E.equipmentRecipe("four","cuisson",["argile"]),"brique");
  assert.equal(E.equipmentRecipe("four","cuisson",["bois"]),null);
});
test("les trente premières briques cuisent au feu puis permettent de construire le four", () => {
  const E=mk();E.state.age=2;owns(E,"feu");for(const id of ["brique","four"])E.learn(id,true);
  stock(E,{argile:80,charbon:10});assert.equal(E.queue("brique",30,false).ok,true);E.tick(30);
  assert.equal(E.count("brique"),30);assert.equal(E.count("four"),0);
  assert.equal(E.craft("four",1,true).ok,true);assert.equal(E.count("four"),1);assert.equal(E.count("feu"),1);
});
test("la pioche prépare l’enclume avant la première utilisation du poste de frappe", () => {
  const E=mk();E.state.age=3;owns(E,"percuteur_pierre");E.learn("enclume_pierre",true);
  assert.equal(E.equipmentCheck("enclume_pierre").required,"pioche_pierre");
  owns(E,"pioche_pierre");stock(E,{caillou:120,lingot_cuivre:2});
  assert.equal(E.craft("enclume_pierre",1,true).ok,true);E.learn("plaque_cuivre",true);
  assert.equal(E.equipmentRecipe("enclume_pierre","marteler",["lingot_cuivre"]),"plaque_cuivre");
  assert.equal(E.queue("plaque_cuivre",2,false).ok,true);E.tick(10);
  assert.equal(E.count("plaque_cuivre"),4);assert.equal(E.count("enclume_pierre"),1);assert.equal(E.count("percuteur_pierre"),1);
});
test("les outils incorporés restent consommés", () => {
  const E=prepared();stock(E,{manche:2,eclat:4,laniere:4});
  assert.equal(E.craft("hache_pierre",1,true).ok,true);assert.equal(E.count("eclat"),0);
});
test("une brique accepte le feu ou le four ; un minerai n’accepte pas le feu", () => {
  const E=prepared();stock(E,{argile:2,malachite:3,charbon:1});
  assert.ok(E.equipmentChoices("brique").every(c=>c.ready));
  assert.equal(E.attemptWith("feu","vif",["malachite","charbon"]).why,"incompatible");
  assert.equal(E.equipmentRecipe("four","fonte",["malachite","charbon"]),"lingot_cuivre");
});

function oldOrder(id, n=1) {
  const E=prepared(Normal);stock(E,{bois:200,os:100,aiguille:20,cuir:100,laniere:100,manche:100,eclat:100});
  assert.equal(E.queue(id,n,false).ok,true);return E;
}
test("une ancienne commande conserve ses aiguilles réservées et ses remboursements", () => {
  const old=oldOrder("outre"), needles=old.count("aiguille"), inventory=JSON.parse(old.serialize()).inv;
  const E=mk();E.load(old.serialize());
  assert.equal(E.state.hand.q[0].ancienAtelier,true);assert.equal(E.state.hand.q[0].recettesEquipements,true);
  assert.equal(E.count("aiguille"),needles);assert.equal(E.count("cuir"),inventory.cuir);
  E.cancelJob(0);assert.equal(E.count("aiguille"),needles+2);assert.equal(E.count("cuir"),inventory.cuir+8);
});
test("une ancienne commande termine avec son ancien prix après deux chargements", () => {
  const old=oldOrder("outre"), E=mk();E.load(old.serialize());
  const again=mk();again.load(E.serialize());const needles=again.count("aiguille");
  again.tick(30);assert.equal(again.count("outre"),1);assert.equal(again.count("aiguille"),needles);assert.equal(again.state.hand.q.length,0);
});
test("les aiguilles préparées pour une ancienne couture restent ses matières réservées", () => {
  const old=prepared(Normal);stock(old,{os:2,laniere:6});assert.equal(old.order("outre",1).ok,true);
  const E=mk();E.load(old.serialize());E.tick(5);
  assert.equal(E.count("aiguille"),0);assert.equal(E.state.hand.q[0].b.aiguille,2);
  const resumed=mk();resumed.load(E.serialize());resumed.add("cuir",8);resumed.tick(10);
  assert.equal(resumed.count("outre"),1);assert.equal(resumed.count("aiguille"),0);
});
test("les anciens rouages ne gagnent pas la capacité de la machine à une ressource", () => {
  const old=oldOrder("engrenage_bois",20);owns(old,"automate_bois");
  const E=mk();E.load(old.serialize());
  assert.deepEqual(E.handInfo().jobs[0].machs,{});
});
test("une commande neuve n’est pas fusionnée à un ancien prix", () => {
  const old=oldOrder("manche",50);stock(old,{manche:20,eclat:20});assert.equal(old.queue("engrenage_bois",2,false).ok,true);
  const E=mk();E.load(old.serialize());owns(E,"couteau");stock(E,{manche:4});
  const q=E.queue("engrenage_bois",2,false);assert.equal(q.ok,true);assert.notEqual(q.merged,true);assert.equal(E.state.hand.q.length,3);
});
test("les sauvegardes expérimentales ne sont pas importées silencieusement dans le jeu normal", () => {
  const E=mk();assert.throws(()=>mk(Normal).load(E.serialize()),/partie d’essai/);
  const sameVersion=JSON.parse(E.serialize());sameVersion.v=12;
  assert.throws(()=>mk(Normal).load(sameVersion),/partie d’essai/);
});
test("l’ancienne usine conserve ses âges, terres et stocks en recevant les outils d’amorçage", () => {
  const raw=fs.readFileSync(path.join(__dirname,"fixtures/save-v5-age8-usine.json"),"utf8");
  const old=mk(Normal);old.load(raw);const snapshot=JSON.parse(old.serialize());
  const E=mk();E.load(old.serialize());assert.equal(E.state.age,snapshot.age);assert.deepEqual(E.state.zones,snapshot.zones);
  for(const [id,n]of Object.entries(snapshot.inv))assert.equal(E.count(id),n,id);
  assert.equal(E.count("percuteur_pierre"),1);assert.equal(E.count("racloir_os"),1);
});

test("partie neuve : toutes les fabrications jusqu’à l’outre utilisent des matières accessibles", () => {
  const E=mk(),busy=new Set();
  function produce(id, qty) {
    if(E.count(id)>=qty)return;
    assert.ok(!busy.has(id),"cycle : "+id);busy.add(id);
    const it=D.ITEMS[id],zone=E.RES_ZONE[id];
    if(it.t==="res"&&zone&&E.zoneOpen(zone)){E.add(id,qty-E.count(id));busy.delete(id);return;}
    assert.ok(it.r,"matière inaccessible : "+id);E.learn(id,true);
    let b=E.blocker(id);if(b&&b.why!=="owned"){const station=E.blockStation(id,b);assert.ok(station,"blocage : "+id);produce(station,1);}
    const n=E.isUnique(it)?1:Math.ceil((qty-E.count(id))/it.r[2]);
    for(let round=0;E.missingFor(id,n)&&round<20;round++)for(const[k,v]of Object.entries(E.totalCost(id,n)))produce(k,v);
    assert.equal(E.ageOK(id),true,"âge inaccessible : "+id);
    const made=E.craft(id,n,true);assert.equal(made.ok,true,id+" "+JSON.stringify(made));busy.delete(id);
  }
  function open(z) {
    while(E.passLieux(z)?.left.length){const from=D.ZONES[D.ZONES.findIndex(x=>x.id===z)-1].id;const n=E.nextExp(from);assert.ok(n);for(const[k,v]of Object.entries(n.x.cost||{}))produce(k,v);assert.equal(E.startExp(from).ok,true);E.tick(n.x.dur+1);}
    for(const [id,n]of Object.entries(E.passCost(z)))produce(id,n);
    assert.equal(E.passPour(z).done,true);
  }
  for(const id of ["percuteur_pierre","manche","corde","archet","feu","cabane","epieu"]){produce(id,1);if(id==="cabane")assert.ok(E.domAutoExt(id));}
  open("plaine");
  for(const id of ["aiguille","racloir_os","laniere","collets","outre"])produce(id,1);
  assert.equal(E.count("outre"),1);assert.equal(E.count("silex"),0);open("riviere");assert.equal(E.zoneOpen("riviere"),true);assert.equal(E.state.age,1);
});
const Gentle = Normal.withData(Eq.createData(Base));
test("départ progressif : percuteur fourni, premier objectif inchangé, aucune fabrication comptée", () => {
  const E=mk(Gentle);assert.equal(E.count("percuteur_pierre"),1);assert.equal(E.state.stats.crafts,0);
  assert.equal(E.guide().step,"manche");stock(E,{bois:3});
  assert.equal(E.attemptAt("etabli",["bois"]).id,"manche");assert.equal(E.count("manche"),1);
  E.reset();assert.equal(E.count("percuteur_pierre"),1);assert.equal(E.count("manche"),0);
  assert.deepEqual(mk(Normal).state.inv,{});
});
test("une ancienne partie d’essai reçoit le percuteur sans perdre sa progression", () => {
  const old=mk();stock(old,{bois:12});const E=mk(Gentle);E.load(old.serialize());
  assert.equal(E.count("percuteur_pierre"),1);assert.equal(E.count("bois"),12);
  E.load(E.serialize());assert.equal(E.count("percuteur_pierre"),1);
});
test("le feu apparaît après sa construction et choisit seul la chauffe adaptée", () => {
  const E=mk(Gentle);stock(E,{bois:20,manche:2});
  assert.deepEqual(E.workplaceList().filter(x=>x.ready).map(x=>x.id),["etabli"]);
  assert.equal(E.attemptAt("feu",["bois"]).why,"missing");owns(E,"feu");
  assert.deepEqual(E.workplaceList().filter(x=>x.ready).map(x=>x.id),["etabli","feu"]);
  const r=E.attemptAt("feu",["manche"]);assert.equal(r.id,"epieu");assert.equal(r.mode,"doux");
  const c=E.attemptAt("feu",["bois"]);assert.equal(c.id,"charbon");assert.equal(c.mode,"etouffee");
});
test("une ambiguïté demande un geste sans révélation ni dépense", () => {
  const E=mk(Gentle);E.state.age=1;stock(E,{os:20});owns(E,"aiguille");
  const before=E.serialize(),r=E.attemptAt("etabli",["os"]);
  assert.equal(r.kind,"choice");assert.equal(E.serialize(),before);
  assert.deepEqual(r.options.map(x=>x.action),["Tailler","Percer"]);
  assert.ok(!JSON.stringify(r).includes("flute"));
  assert.equal(E.attemptWith(r.options[1].equipment,r.options[1].mode,["os"]).id,"flute");
  assert.equal(E.count("aiguille"),1);
});
test("deux outils pour le même résultat ne créent pas un choix artificiel", () => {
  const E=prepared(Gentle);owns(E,"aiguille");stock(E,{cuir:20});
  assert.equal(E.workplaceOptions("etabli",["cuir"]).filter(x=>x.recipe==="laniere").length,1);
  assert.equal(E.attemptAt("etabli",["cuir"]).id,"laniere");
});
test("le lieu automatique ne substitue pas le four au feu et ne révèle pas les recettes lointaines", () => {
  const E=mk(Gentle);owns(E,"four");stock(E,{manche:3});
  const before=E.serialize();assert.equal(E.attemptAt("four",["manche"]).why,"incompatible");assert.equal(E.serialize(),before);
  assert.equal(E.workplaceOptions("etabli",["cuivre"]).length,0);
});
const cut = equipment => ({equipment,mode:"couper"});
test("le couteau divise réellement le temps de découpe par deux à coût et production identiques", () => {
  const slow=prepared(),fast=prepared();stock(slow,{cuir:100});stock(fast,{cuir:100});
  const a=slow.queue("laniere",10,false,undefined,cut("racloir_os"));
  const b=fast.queue("laniere",10,false,undefined,cut("couteau"));
  assert.equal(a.ok,true);assert.equal(b.ok,true);assert.equal(a.time,b.time*2);
  assert.deepEqual(a.job.b,b.job.b);const duration=b.time;
  slow.tick(duration+.1);fast.tick(duration+.1);
  assert.equal(fast.count("laniere"),20);assert.ok(slow.count("laniere")<20);
  slow.tick(a.time+1);assert.equal(slow.count("laniere"),20);
  assert.equal(slow.count("cuir"),fast.count("cuir"));assert.equal(fast.count("couteau"),1);
});
test("le choix explicite du racloir est respecté malgré le couteau possédé, y compris après rechargement", () => {
  const E=prepared();stock(E,{cuir:100});const r=E.attemptWith("racloir_os","couper",["cuir"]);
  assert.equal(r.kind,"queued");assert.deepEqual(E.state.hand.q[0].equipmentSelection,cut("racloir_os"));
  const copy=mk();copy.load(E.serialize());assert.deepEqual(copy.state.hand.q[0].equipmentSelection,cut("racloir_os"));
  assert.equal(copy.handInfo().jobs[0].left,E.handInfo().jobs[0].left);
});
test("une commande au couteau attend cet outil s’il disparaît au lieu d’emprunter le racloir", () => {
  const E=prepared();stock(E,{cuir:100});E.queue("laniere",10,false,undefined,cut("couteau"));
  E.add("couteau",-1);E.tick(4);assert.equal(E.count("laniere"),0);assert.equal(E.handInfo().jobs[0].wait,true);
  E.add("couteau",1);E.tick(10);assert.equal(E.count("laniere"),20);
});
test("les lots de découpe avec des outils différents ne fusionnent pas", () => {
  const E=prepared();stock(E,{cuir:100,bois:100});E.queue("manche",20);
  E.queue("laniere",1,false,undefined,cut("racloir_os"));const r=E.queue("laniere",1,false,undefined,cut("couteau"));
  assert.notEqual(r.merged,true);assert.equal(E.state.hand.q.length,3);
  assert.equal(E.queue("laniere",1,false,undefined,cut("couteau")).merged,true);
});
test("les commandes et recettes préparées peuvent préférer le meilleur outil compatible", () => {
  const E=prepared();stock(E,{cuir:100});
  assert.equal(E.equipmentChoices("laniere").find(c=>c.ready).equipment,"couteau");
  assert.equal(E.handTime("laniere"),E.handTime("laniere",cut("racloir_os"))/2);
  const r=E.order("laniere",10);assert.equal(r.ok,true);
  assert.equal(r.time,E.batchTime("laniere",10));
});
test("l’amélioration ne s’applique pas aux anciens lots, aux autres gestes ou à un outil indisponible", () => {
  const E=prepared();
  assert.equal(E.equipmentSpeed("laniere",false),1);
  assert.equal(E.equipmentSpeed("statuette",{equipment:"couteau",mode:"entailler"}),1);
  E.add("couteau",-1);assert.equal(E.equipmentSpeed("laniere",cut("couteau")),1);
  assert.equal(E.queue("laniere",1,false,undefined,cut("couteau")).why,"equipment");
});
console.log(checks+" contrôles du profil équipements réussis.");
