/* Parcours jetables : habillage Vivant, matières, découverte, clavier et recettes.
 * PW, CHROMIUM facultatifs ; DRAWN_SHOTS pour les captures de revue. */
"use strict";
const fs=require("fs"),path=require("path"),http=require("http"),assert=require("assert/strict");
const {chromium}=require(process.env.PW||"playwright");
const D=require("../js/data"),Core=require("../js/engine");
const Equip=fs.existsSync(path.join(__dirname,"../js/equipements.js"))?require("../js/equipements"):null;
const ROOT=path.resolve(__dirname,".."),MIME={".html":"text/html",".js":"text/javascript",".css":"text/css",".svg":"image/svg+xml",".webp":"image/webp",".woff2":"font/woff2"};
const server=http.createServer((req,res)=>{
  const file=path.resolve(ROOT,"."+new URL(req.url,"http://localhost").pathname.replace(/\/$/,"/index.html"));
  if(!file.startsWith(ROOT+path.sep))return res.writeHead(403).end();
  fs.readFile(file,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader("Content-Type",MIME[path.extname(file)]||"application/octet-stream");res.end(b);});
});
let browser,checks=0;
function ok(v,msg){assert.ok(v,msg);checks++;}
function fixture(equipped,dark){
  const E=(equipped?Core.withData(Equip.createData(D,{fullGame:true})):Core).createEngine(),s=E.state;
  s.age=2;s.cycle=2;s.meta.forcedDone=true;s.introSeen=true;s.flags.ver=D.VERSION;s.stats.crafts=1;
  Object.assign(s.settings,{tuto:false,sound:false,visiteurs:false,theme:dark?"dark":"light",largeText:dark});
  for(const id of ["manche","corde","panier","laniere"])E.learn(id,true);
  for(const [id,n]of Object.entries({bois:50,fibre:30,caillou:20,cuir:60,os:15,corde:4}))E.add(id,n);
  s.studied={bois:1,fibre:1,cuir:1};E.recalc();return E.serialize();
}
async function layout(p,tag){
  await p.waitForFunction(()=>[...document.querySelectorAll('.view.on img')].every(e=>{const r=e.getBoundingClientRect();return !r.height||r.top>=innerHeight||r.bottom<=0||(e.complete&&e.naturalWidth>0);}));
  const r=await p.evaluate(()=>{
    const scope=document.querySelector('.view.on');
    const c=document.createElement('canvas').getContext('2d');
    const lum=color=>{c.clearRect(0,0,1,1);c.fillStyle=color;c.fillRect(0,0,1,1);return [...c.getImageData(0,0,1,1).data].slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);};
    const contrasts=[...scope.querySelectorAll('button.pri:not(:disabled)')].filter(e=>e.getBoundingClientRect().height).map(e=>{const s=getComputedStyle(e),a=lum(s.color),b=lum(s.backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);});
    return {overflow:document.documentElement.scrollWidth>innerWidth,
      contrasts,
      small:[...scope.querySelectorAll('button')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&(r.width<43.9||r.height<43.9);}).map(e=>e.textContent.trim()),
      images:[...scope.querySelectorAll('img')].every(e=>{const r=e.getBoundingClientRect();return !r.height||r.top>=innerHeight||r.bottom<=0||(e.complete&&e.naturalWidth>0);})};
  });
  ok(!r.overflow,tag+" : débordement");ok(!r.small.length,tag+" : cibles <44 px "+r.small.join(","));ok(r.images,tag+" : illustrations chargées");
  ok(r.contrasts.every(v=>v>=4.5),tag+' : contraste des actions '+r.contrasts.join(','));
}
async function shot(p,name,reset=true){if(!process.env.DRAWN_SHOTS)return;fs.mkdirSync(process.env.DRAWN_SHOTS,{recursive:true});await p.evaluate(reset=>{document.activeElement?.blur();if(reset)document.getElementById('views').scrollTop=0;},reset);await p.screenshot({path:path.join(process.env.DRAWN_SHOTS,name+'.png')});}
async function run(){
  await new Promise(r=>server.listen(0,"127.0.0.1",r));
  browser=await chromium.launch(process.env.CHROMIUM?{executablePath:process.env.CHROMIUM}:{});
  for(const width of [320,390,1280])for(const dark of [false,true])for(const equipped of (Equip?[true,false]:[false])){
    const ctx=await browser.newContext({viewport:{width,height:950},serviceWorkers:"block",reducedMotion:"reduce"}),p=await ctx.newPage(),errors=[],missing=[];
    p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()===404)missing.push(r.url());});
    await p.addInitScript(({raw,equipped})=>{const key=equipped?'eclat.preview.craft.v1':'eclat.save.v1';if(!localStorage.getItem(key))localStorage.setItem(key,raw);if(!localStorage.getItem('eclat.preview.style'))localStorage.setItem('eclat.preview.style','vivant');Math.random=()=>.99;},{raw:fixture(equipped,dark),equipped});
    await p.goto('http://127.0.0.1:'+server.address().port+'/index.html'+(equipped?'':'?atelier=classique'));
    await p.waitForFunction(()=>!!window.__eclat);
    for(let i=0;i<5;i++){await p.waitForTimeout(100);await p.evaluate(()=>window.__eclat.closeModal());}
    await p.locator('[data-tab="atelier"]').click();await p.evaluate(()=>document.fonts.ready);
    const tag=width+'/'+(dark?'veillee':'clair')+'/'+(equipped?'equipe':'historique');
    await layout(p,tag+'/atelier');
    if(equipped){
      const item=p.locator('#ae-item-bois');await item.click();
      ok(await item.getAttribute('aria-pressed')==='true',tag+' : sélection de matière');
      await p.locator('#ae-slot-0').click();ok(await p.locator('#ae-slot-0').isDisabled(),tag+' : retrait');
      await p.locator('#ae-search').fill('peau');
      ok(await p.locator('.ae-resource:visible').count()===1,tag+' : recherche Peau');
      await p.locator('#ae-search').fill('');
      await p.locator('#ae-discovery-only').check();ok(await p.locator('#ae-discovery-only').isChecked(),tag+' : filtre natif');
      await p.locator('#ae-discovery-only').uncheck();
      await p.locator('#ae-search').focus();
      ok(await p.locator('#ae-search').evaluate(e=>getComputedStyle(e).outlineStyle==='solid'),tag+' : focus visible');
      await p.locator('#ae-item-bois').click();await p.locator('#ae-forge-tailler').click();
      await p.waitForFunction(()=>window.__eclat.E.count('manche')>=1);checks++;
      await shot(p,'atelier-'+width+(dark?'-veillee':''));
    }else {
      await p.locator('[data-g="tailler"]').click();await p.locator('[data-inv="bois"]').click();
      ok(await p.locator('.slot.full').count()===1,tag+' : poser du bois');
      await p.locator('#forge').click();await p.waitForFunction(()=>window.__eclat.E.count('manche')>=1);checks++;
      await shot(p,'procedes-'+width+(dark?'-veillee':''));
    }
    await p.locator('[data-tab="carnet"]').click();await p.waitForSelector('[data-rec="manche"]',{state:'attached'});
    const age=p.locator('.age-sec').filter({has:p.locator('[data-rec="manche"]')});
    if(!await age.evaluate(e=>e.open))await age.locator('summary').click();
    await layout(p,tag+'/carnet');await shot(p,'carnet-'+width+(dark?'-veillee':'')+(equipped?'':'-historique'));
    if(equipped){
      await p.locator('[data-rec="manche"]').scrollIntoViewIfNeeded();
      await shot(p,'recettes-'+width+(dark?'-veillee':''),false);
      for(const age of [0,5,10,14]){
        await p.evaluate(age=>{const g=window.__eclat;g.E.state.age=age;g.render(true);},age);
        await layout(p,tag+'/age-'+age);
      }
    }
    const before=await p.evaluate(()=>window.__eclat.E.state.settings.theme);
    await p.evaluate(()=>{localStorage.setItem('eclat.preview.style','classique');});
    await p.reload();await p.waitForFunction(()=>!!window.__eclat);
    ok(await p.evaluate(()=>window.__eclat.E.state.settings.theme)===before,tag+' : thème conservé');
    ok(await p.locator('html').getAttribute('data-style-mode')==='classique',tag+' : retour au style classique');
    ok(!errors.length,tag+' : erreurs JS '+errors.join(';'));ok(!missing.length,tag+' : ressources absentes '+missing.join(';'));
    await ctx.close();console.log('✓ '+tag);
  }
  console.log(checks+' contrôles de l’interface dessinée réussis.');
}
run().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.close();});
