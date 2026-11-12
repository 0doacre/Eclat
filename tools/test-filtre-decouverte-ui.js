"use strict";
const fs=require("fs"),path=require("path"),http=require("http"),assert=require("assert/strict");
const {chromium}=require(process.env.PW||"playwright"),D=require("../js/data"),Core=require("../js/engine");
const ROOT=path.resolve(__dirname,".."),equipped=fs.existsSync(path.join(ROOT,"js/equipements.js"));
const server=http.createServer((req,res)=>{const file=path.resolve(ROOT,"."+new URL(req.url,"http://localhost").pathname.replace(/\/$/,"/index.html"));if(!file.startsWith(ROOT+path.sep))return res.writeHead(403).end();fs.readFile(file,(err,data)=>{if(err)return res.writeHead(404).end();res.setHeader("Content-Type",({".html":"text/html",".js":"text/javascript",".css":"text/css",".svg":"image/svg+xml",".webp":"image/webp",".woff2":"font/woff2"})[path.extname(file)]||"application/octet-stream");res.end(data);});});
let checks=0;const check=(v,n)=>{assert.ok(v,n);checks++;};
function fixture(preview){
  const E=preview?Core.withData(require("../js/equipements").createData(D,{fullGame:true})).createEngine():Core.createEngine(),s=E.state;
  s.age=2;s.cycle=2;s.introSeen=true;s.meta.forcedDone=true;s.flags.ver=D.VERSION;s.stats.crafts=1;s.intu=100;
  Object.assign(s.settings,{tuto:false,sound:false,visiteurs:false,theme:"light"});
  for(const[id,it]of Object.entries(E.D.ITEMS))if(it.r)s.known[id]=1;
  for(const id of preview?["laniere","engrenage_bois"]:["manche","corde","laniere"])delete s.known[id];
  for(const id of ["bois","fibre","caillou","cuir","manche","corde","eclat","os","couteau","racloir_os"])E.add(id,id==="couteau"||id==="racloir_os"?1:20);
  s.studied=preview?{cuir:1,manche:1,bois:1}:{bois:1,fibre:1};
  if(preview)s.flags.equipmentBench={place:"etabli",eq:"couteau",mode:"couper",slots:[]};
  E.recalc();return E.serialize();
}
async function start(p,preview){
  await p.addInitScript(({raw,key})=>{if(!localStorage.getItem(key))localStorage.setItem(key,raw);}, {raw:fixture(preview),key:preview?"eclat.preview.craft.v1":"eclat.save.v1"});
  await p.goto("http://127.0.0.1:"+server.address().port+"/index.html"+(preview?"":"?atelier=classique"));
  await p.waitForFunction(()=>!!window.__eclat);
  for(let i=0;i<10;i++){await p.waitForTimeout(100);await p.evaluate(()=>window.__eclat.closeModal());}
  await p.locator('[data-tab="labo"]').click();
}
async function main(){
  await new Promise(r=>server.listen(0,"127.0.0.1",r));
  const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM?{executablePath:process.env.CHROMIUM}:{})});
  try{
    /* le « classique » (ancien établi de l’Atelier) n’existe plus : l’Atelier est la production, la découverte est à l’Étude */for(const preview of equipped?[true]:[])for(const width of [320,390,980]){
      const context=await browser.newContext({viewport:{width,height:950},serviceWorkers:"block"}),p=await context.newPage(),errors=[];
      p.on("pageerror",e=>errors.push(e.message));await start(p,preview);
      const prefix=(preview?"équipé":"classique")+" "+width;
      /* Étude (atelier-équipe) : trois pastilles de filtre, Utiles (par défaut), Tout, En réserve, au lieu de la case « à découvrir » et du choix du geste. */
      const chip=v=>p.locator('[data-ae="filtre"][data-value="'+v+'"]');
      const ids=()=>p.locator('[data-ae-resource]:visible').evaluateAll(es=>es.map(e=>e.dataset.aeResource).sort());
      check(await chip("utiles").getAttribute("aria-pressed")==="true",prefix+" Utiles est le filtre par défaut");
      assert.deepEqual(await ids(),["manche"]);checks++;
      await p.locator('#ae-item-manche').click();const slots=await p.evaluate(()=>JSON.stringify(window.__eclat.E.state.flags.equipmentBench.slots));
      const tries=await p.evaluate(()=>window.__eclat.E.state.stats.tries);
      await chip("tout").click();await p.waitForTimeout(150);
      check((await ids()).includes("bois")&&(await ids()).includes("cuir"),prefix+" Tout montre toutes les matières vues");
      check(await p.evaluate(n=>window.__eclat.E.state.stats.tries===n,tries),prefix+" changer de filtre ne lance aucun essai");
      check(await p.evaluate(raw=>JSON.stringify(window.__eclat.E.state.flags.equipmentBench.slots)===raw,slots),prefix+" établi conservé");
      await chip("utiles").click();await p.waitForTimeout(150);assert.deepEqual(await ids(),["manche"]);checks++;
      await p.locator('#ae-search').fill('cuir');await p.waitForTimeout(150);assert.deepEqual(await ids(),[]);checks++;
      await p.locator('#ae-search').fill('');
      /* le message « aucune matière à découvrir » n’existe plus : #ae-discovery-empty reste caché (voir rendu-T6.md) */
      await chip("tout").click();await p.waitForTimeout(150);
      await p.evaluate(()=>window.__eclat.save());await p.reload();await p.waitForFunction(()=>!!window.__eclat);
      for(let i=0;i<5;i++){await p.waitForTimeout(100);await p.evaluate(()=>window.__eclat.closeModal());}
      await p.locator('[data-tab="labo"]').click();
      check(await p.evaluate(()=>window.__eclat.E.state.settings.equipmentFilter==="tout"),prefix+" filtre sauvegardé");
      check(await chip("tout").getAttribute("aria-pressed")==="true"&&(await ids()).includes("bois"),prefix+" filtre retrouvé au rechargement");
      check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),prefix+" aucun débordement");
      check(errors.length===0,prefix+" sans erreur : "+errors.join('; '));
      if(process.env.DISCOVERY_SHOTS){fs.mkdirSync(process.env.DISCOVERY_SHOTS,{recursive:true});await p.screenshot({path:path.join(process.env.DISCOVERY_SHOTS,(preview?'equipe':'classique')+'-'+width+'.png')});}
      await context.close();
    }
    console.log(checks+" contrôles du filtre de découverte réussis.");
  }finally{await browser.close();server.close();}
}
main().catch(e=>{console.error(e);server.close();process.exitCode=1;});
