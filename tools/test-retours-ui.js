/* Retours visuels V7 et synchronisation 0.37.0. Profils et parties jetables. */
"use strict";
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const {chromium}=require(process.env.PW||'playwright');
const D=require('../js/data.js'),{createEngine}=require('../js/engine.js');
const ROOT=path.resolve(__dirname,'..'),SHOTS=process.env.RETOURS_SHOTS;
const server=http.createServer((req,res)=>{
  const file=path.resolve(ROOT,'.'+new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));
  if(!file.startsWith(ROOT+path.sep))return res.writeHead(403).end();
  fs.readFile(file,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream');res.end(b);});
});
let browser,checks=0;
const ok=(v,m)=>{assert.ok(v,m);checks++;};
function seed(dark){
  const E=createEngine(),s=E.state;
  s.age=1;s.zones.plaine=true;s.seen.os=true;s.seen.cuir=true;s.inv.os=206;s.inv.cuir=339;s.inv.bois=50;
  s.known.manche=true;s.made.manche=10;s.stats.crafts=10;
  s.introSeen=true;s.flags.ver=D.VERSION;s.t=Date.now();
  Object.assign(s.settings,{tuto:false,sound:false,visiteurs:false,largeText:dark,theme:dark?'dark':'light'});
  return E.serialize();
}
async function close(p){await p.evaluate(()=>window.__eclat.closeModal());await p.waitForFunction(()=>!document.getElementById('app').inert);}
async function shot(p,name,width,dark){
  if(!SHOTS||dark||width===320)return;
  fs.mkdirSync(SHOTS,{recursive:true});await p.evaluate(()=>document.activeElement?.blur());
  await p.screenshot({path:path.join(SHOTS,name+'-'+width+'.png')});
}
async function run(){
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  browser=await chromium.launch(process.env.CHROMIUM?{executablePath:process.env.CHROMIUM}:{});
  for(const width of [320,390,980])for(const dark of [false,true]){
    const ctx=await browser.newContext({viewport:{width,height:width===320?568:900},serviceWorkers:'block',reducedMotion:'reduce'});
    const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
    await p.addInitScript(raw=>{localStorage.setItem('eclat.save.v1',raw);localStorage.setItem('eclat.preview.style','atlas');},seed(dark));
    await p.goto('http://127.0.0.1:'+server.address().port);await p.waitForFunction(()=>!!window.__eclat);
    for(let i=0;i<8;i++){await p.waitForTimeout(100);await close(p);}
    const tag=width+'/'+dark;
    await p.locator('#tabs [data-tab="domaine"]').click();
    const zone=p.locator('#dt-plaine');await zone.scrollIntoViewIfNeeded();
    const band=await zone.evaluate(e=>({padding:getComputedStyle(e).paddingTop,top:getComputedStyle(e,'::after').top,before:getComputedStyle(e,'::before').display}));
    ok(band.padding==='0px'&&band.top==='0px'&&band.before==='none',tag+' : décor au bord supérieur');await shot(p,'domaine',width,dark);
    await p.locator('#tabs [data-tab="atelier"]').click();
    ok(await p.locator('[data-tip="tip_niveaux"],[data-tip="tip_inv_lp"]').count()===0,tag+' : astuces fixes retirées');
    ok(await p.locator('[data-skills]').count()===1,tag+' : niveaux accessibles');
    await p.locator('[data-g="tailler"]').click();if(await p.locator('#iq').count())await p.locator('#iq').fill('Os');
    await p.locator('[data-inv="os"]').click();
    const label=await p.locator('.slot.full .sn').evaluate(e=>({text:e.textContent,size:parseFloat(getComputedStyle(e).fontSize),height:e.getBoundingClientRect().height,scroll:e.scrollHeight}));
    ok(label.text==='Os'&&label.size>=16&&label.scroll<=label.height+1,tag+' : Os lisible et entier');
    const radii=await p.locator('.slot.full').evaluate(e=>[getComputedStyle(e).borderRadius,getComputedStyle(document.querySelector('.inv')).borderRadius,getComputedStyle(document.querySelector('.forge-btn')).borderRadius]);
    ok(radii.every(r=>r==='8px'),tag+' : arrondis des commandes cohérents');
    await shot(p,'atelier',width,dark);
    await p.locator('[data-skills]').click();await p.waitForTimeout(650);ok((await p.locator('.modal-box').innerText()).includes('Actions et récolte'),tag+' : fiche des niveaux');await close(p);
    await p.locator('#tabs [data-tab="arbre"]').click();
    const ghost=p.locator('.arb-pas.fantome.obj').first();
    ok(await ghost.count()>0,tag+' : recette inconnue de l’objectif présente');
    const stroke=await ghost.evaluate(e=>({width:parseFloat(getComputedStyle(e).borderWidth),shadow:getComputedStyle(e).boxShadow,dot:getComputedStyle(e,'::after').backgroundColor}));
    ok(stroke.width<=1&&stroke.shadow==='none'&&stroke.dot!=='rgba(0, 0, 0, 0)',tag+' : objectif indiqué sans liseré épais');await shot(p,'arbre',width,dark);
    await p.locator('#tabs [data-tab="carte"]').click();
    ok(await p.locator('.a-fog-edge').first().evaluate(e=>getComputedStyle(e).animationName)==='none',tag+' : brume immobile en mouvements réduits');
    await p.emulateMedia({reducedMotion:'no-preference'});
    const motion=await p.locator('.a-fog-edge').first().evaluate(async e=>{const a=e.getAnimations()[0];if(!a)return false;a.pause();a.currentTime=1000;const first=getComputedStyle(e).transform;a.currentTime=10000;return first!==getComputedStyle(e).transform;});
    ok(motion,tag+' : dérive réelle de la brume');
    ok(await p.locator('.a-fog-ground').evaluate(e=>getComputedStyle(e).fill)==='rgb(207, 215, 211)',tag+' : voile opaque conservé');
    await shot(p,'carte',width,dark);
    ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.body.scrollWidth<=innerWidth),tag+' : pas de débordement');
    ok(!errors.length,tag+' : erreurs '+errors.join(';'));console.log('✓ '+tag);await ctx.close();
  }
  console.log('✓ Retours V7 : '+checks+' contrôles.');
}
run().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.close();});
