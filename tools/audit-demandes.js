/* Mesure toutes les demandes éligibles ; --avance ouvre une terre supplémentaire.
 * Audit en lecture seule des règles du jeu ; résultats JSON sur stdout. */
const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..'),D=require(path.join(root,'js/data.js')),{createEngine}=require(path.join(root,'js/engine.js'));
const out=[];
for(const age of [10,12]){
 const E=createEngine({now:()=>2e12,rand:()=>0.99});E.state.age=age;
 for(const z of ['lisiere','plaine','riviere','collines','mine','desert','gisement',...(age>=11?['montagnes']:[])])E.state.zones[z]=true;
 if(process.argv.includes('--avance'))E.state.zones[age===10?'montagnes':'orbite']=true;
 for(const[id,it]of Object.entries(D.ITEMS))if(it.a<=age&&!it.sec&&!it.path){if(it.r){E.learn(id,true);E.state.made[id]=1;}if(it.t==='stat')E.add(id,1);}
 E.recalc();const base=E.traceBasePrice(),tr=E.troqueurReward(),rows=[];
 for(const id of E.troqueurEligibleItems()){
  const n=E.roundNice(D.TROQUEUR.size*base*tr/E.value(id)),p=E.plan(id,n),raw=Object.values(p.missing).reduce((a,b)=>a+b,0),sell=E.sellQuote(id,n)/base;
  rows.push({id,n,tr,raw,sellTraces:sell,deliverRank0:tr,deliverRank4:tr+5,sellWinsRank0:sell>=tr,sellWinsRank4:sell>=tr+5,locked:p.locked,blocked:p.blocked});
 }
 const sorted=rows.map(r=>r.raw).sort((a,b)=>a-b),middle=sorted.length/2,median=sorted.length%2?sorted[Math.floor(middle)]:(sorted[middle-1]+sorted[middle])/2;
 out.push({age,base,tr,count:rows.length,over100k:rows.filter(r=>r.raw>100000).length,medianRaw:median,sellWinsRank0:rows.filter(r=>r.sellWinsRank0).length,sellWinsRank4:rows.filter(r=>r.sellWinsRank4).length,rows});
}
console.log(JSON.stringify(out,null,2));
