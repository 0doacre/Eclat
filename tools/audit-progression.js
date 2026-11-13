/* Audit 0.21 : lecture du contenu et scénarios moteur jetables, sans modifier une partie ni les règles.
 * node tools/audit-progression.js > audit.json
 * Les observations sont décrites dans docs/revue/audit-progression-codex.md. */
const path=require('path'), fs=require('fs'), cp=require('child_process');
const root=path.resolve(__dirname,'..'), D=require(path.join(root,'js/data.js')), {createEngine}=require(path.join(root,'js/engine.js'));
const I=D.ITEMS, pub=([id,i])=>!i.sec&&!i.path&&!i.old&&!i.curio, raw=new Set(D.ZONES.flatMap(z=>z.res));
const out={commit:cp.execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),version:D.VERSION};
out.counts={items:Object.keys(I).length,recipes:Object.values(I).filter(i=>i.r).length,publicRecipes:Object.entries(I).filter(([id,i])=>pub([id,i])&&i.r).length,resources:Object.values(I).filter(i=>i.t==='res').length};
out.invalidIngredients=[];out.laterIngredients=[];out.fractionalRecipes=[];out.noSource=[];
for(const [id,i]of Object.entries(I).filter(pub)){
 if(i.r)for(const [k,n]of Object.entries(i.r[1])){
  if(!I[k]||!Number.isFinite(n)||n<=0)out.invalidIngredients.push([id,k,n]);
  if(I[k]&&I[k].a>i.a)out.laterIngredients.push([id,k]);
 }
 if(i.r&&(!Number.isInteger(i.r[2])||Object.values(i.r[1]).some(n=>!Number.isInteger(n))))out.fractionalRecipes.push(id);
 if(i.t==='res'&&!raw.has(id)&&!i.r&&!D.LIGNES.some(l=>l.res===id)&&!D.ZONES.some(z=>z.exps.some(x=>x.rw?.inv?.[id]||x.rw?.item?.[id])))out.noSource.push(id);
}
const used={};for(const [id,i]of Object.entries(I))if(i.r)for(const k in i.r[1])(used[k]??=[]).push(id);
out.unusedPublic=Object.entries(I).filter(pub).filter(([id,i])=>['res','comp'].includes(i.t)&&!used[id]&&!Object.values(D.PROJECTS).some(p=>p.steps.some(s=>s.cost?.[id]))&&!Object.values(D.PASSAGES).some(p=>p.cost?.[id])&&!Object.values(D.REGLES).some(r=>JSON.stringify(r).includes('"'+id+'"'))&&!D.ZONES.some(z=>z.exps.some(x=>x.cost?.[id]))).map(([id])=>id);
out.ages=D.AGES.map((a,n)=>({id:a.id,objects:Object.entries(I).filter(([,i])=>i.a===n).length,resources:Object.entries(I).filter(([,i])=>i.a===n&&i.t==='res').map(([id])=>id),milestones:createEngine().milestones()[n]?.length||0}));
const graph={},base=new Set(['assembler','tresser','tailler']);out.stationProblems=[];
for(const[id,it]of Object.entries(I).filter(pub)){
 graph[id]=it.r?Object.keys(it.r[1]):[];
 if(it.r){const[g,,,_o]=it.r,o=_o||{};
  const exigences=[];if(!base.has(g)||o.lvl)exigences.push(x=>x.g===g&&(!o.lvl||(x.lvl||1)>=o.lvl));if(o.heat)exigences.push(x=>x.g==='chauffer'&&x.heat>=o.heat);
  for(const condition of exigences){const stations=Object.entries(I).filter(pub).filter(([,s])=>(s.e?.st||[]).some(condition)).sort((a,b)=>a[1].a-b[1].a);
   if(!stations.length||stations[0][1].a>it.a)out.stationProblems.push(id);else graph[id].push(stations[0][0]);
  }
 }else if(it.t==='res'){
  const zones=D.ZONES.filter(z=>z.res.includes(id)).sort((a,b)=>(I[a.req]?.a||0)-(I[b.req]?.a||0));
  if(zones.length){if(I[zones[0].req])graph[id].push(zones[0].req);}
  else {const l=D.LIGNES.find(l=>l.res===id);if(l)graph[id].push(l.niv[0].id);}
 }
}
const visited=new Set(),stack=[];out.dependencyCycles=[];
function visit(id){if(stack.includes(id)){out.dependencyCycles.push([...stack.slice(stack.indexOf(id)),id]);return;}if(visited.has(id)||!graph[id])return;stack.push(id);for(const k of graph[id])visit(k);stack.pop();visited.add(id);}
for(const id in graph)visit(id);
function setup(age){const E=createEngine({now:()=>2e12,rand:()=>0.99});E.state.age=age;E.state.cycle=2;for(const z of D.ZONES)E.state.zones[z.id]=true;for(const[id,i]of Object.entries(I).filter(pub)){if(i.a>age)continue;if(i.r)E.learn(id,true);if(i.t==='stat'){E.add(id,1);E.state.made[id]=1;}}E.recalc();return E;}
// Reproduction : un objet du dernier âge fabriqué avant la fin des étapes spatiales.
{
 const E=setup(13);E.state.zones.mercure=false;
 E.milestones()[13].forEach(x=>{if(x.ob.k==='craft'&&x.ob.id!=='vaisseau')E.state.made[x.ob.id]=1;else if(x.ob.k==='pass'&&x.ob.z!=='mercure')E.state.pass[x.ob.z]={paid:{},done:true};});
 E.learn('forge_stellaire',true);for(const[k,n]of Object.entries(I.forge_stellaire.r[1]))E.add(k,n);
 const before=E.objective();const result=E.craft('forge_stellaire',1);
 out.finalGoal={before:before?.id||before?.k,craft:result,age:E.state.age,objective:E.objective(),guide:E.guide(),missing:E.milestones()[13].filter(x=>!x.done).map(x=>x.ob.id||x.ob.z)};
}
// Reproduction : la Réserve suffit, mais le guide cherche les sous-recettes absentes.
{
 const E=setup(7);E.state.age=8;for(const[id,it]of Object.entries(I).filter(pub))if(it.r&&it.a<=8)E.learn(id,true);for(const[k,n]of Object.entries(I.dynamo.r[1]))E.add(k,n);
 for(const id of ['eau_1','tuyau_cuivre','circuit_vapeur','eau']){delete E.state.known[id];delete E.state.inv[id];}
 out.stockGuide={planOK:E.plan('dynamo',1).ok,next:E.nextStep('dynamo'),craft:E.craft('dynamo',1)};
}
// L’extracteur connu, mais non posé ou arrêté, est-il mentionné par le guide ?
out.extractorGuide=[];
for(const mode of ['absent','libre','arrêté']){
 const E=setup(7);if(mode!=='absent')E.add('eau_1',1);if(mode==='arrêté'){E.domExtSet('riviere','eau','eau_1',1);E.state.dom.ext['riviere:eau'].on=false;E.recalc();}
 out.extractorGuide.push({mode,rate:E.rate('eau'),next:E.nextStep('circuit_vapeur')});
}
// Prix bruts pour comparer les ingrédients et leurs rendements, hors stations et prix croissants.
function cost(id,n=1,seen=new Set()){
 if(seen.has(id))throw Error('cycle '+id);const it=I[id];if(it.t==='res'&&createEngine().RES_ZONE[id])return {[id]:n};
 if(!it.r)return {[id]:n};const next=new Set(seen);next.add(id);const v={};for(const[k,q]of Object.entries(it.r[1]))for(const[r,x]of Object.entries(cost(k,q*n/it.r[2],next)))v[r]=(v[r]||0)+x;return v;
}
out.costs=Object.fromEntries(['moteur_vapeur','recuperation_vapeur','plastique','caoutchouc','refroidissement','ordinateur','centrale_fission'].map(id=>[id,cost(id)]));
out.market=[];
for(const [age,res,ext,z]of [[7,'eau','eau_1','riviere'],[7,'malachite','treuil','collines'],[11,'soufre','soufre_1','collines'],[11,'bauxite','carriere','montagnes']]){
 const E=createEngine({now:()=>2e12,rand:()=>0.99});E.state.age=age;E.state.cycle=2;E.state.zones.plaine=true;E.state.zones[z]=true;
 E.state.pass.plaine={paid:{},done:true};E.add(ext,1);E.domExtSet(z,res,ext,1);E.catchUp(12*3600);
 const n=Math.floor(E.count(res)),ecus=E.sellQuote(res,n),traces=E.ecusToTraces(ecus,age);
 E.sell(res,n);const avant=E.state.meta.traces;E.newCycle();
 out.market.push({age,res,rate:I[ext].p[res],value:E.value(res),quantity:n,ecus,traces,actualReleveGain:E.state.meta.traces-avant});
}
console.log(JSON.stringify(out,null,2));
