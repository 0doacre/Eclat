/* Fiches et fenêtres Atlas : navigation réelle, profils jetables, aucun compte distant.
 * PW, CHROMIUM et FICHES_SHOTS facultatifs. */
"use strict";
const fs=require('fs'), path=require('path'), http=require('http'), assert=require('assert/strict');
const {chromium}=require(process.env.PW||'playwright');
const D=require('../js/data.js'), {createEngine}=require('../js/engine.js');
const ROOT=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
  const file=path.resolve(ROOT,'.'+new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));
  if(!file.startsWith(ROOT+path.sep))return res.writeHead(403).end();
  fs.readFile(file,(err,data)=>{if(err)return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream');res.end(data);});
});
let browser,checks=0;
const ok=(v,msg)=>{assert.ok(v,msg);checks++;};
function seed(advanced,dark){
  const E=createEngine();
  if(advanced)E.load(fs.readFileSync(path.join(ROOT,'tools/fixtures/save-v5-age8-usine.json'),'utf8'));
  const s=E.state;s.introSeen=true;s.t=Date.now();s.flags.ver=D.VERSION;
  // Arrêter l'usine de contrôle : les états « manque / disponible » restent stables.
  for(const group of [s.dom.ext,s.dom.mach])for(const e of Object.values(group||{}))e.on=false;
  s.known.manche=true;s.seen.bois=true;s.inv.bois=0;
  Object.assign(s.settings,{tuto:false,sound:false,visiteurs:false,largeText:dark,theme:dark?'dark':'light'});
  return E.serialize();
}
async function close(p){await p.evaluate(()=>window.__eclat.closeModal());await p.waitForFunction(()=>!document.getElementById('app').inert);}
// Les sous-fenêtres s'ouvrent après 80 ms puis ignorent les appuis pendant 450 ms.
async function settled(p){await p.waitForTimeout(650);}
async function allTypes(p, errors){
  const types = new Map();
  for (const [id, item] of Object.entries(D.ITEMS)) {
    if (!types.has(item.t)) types.set(item.t, id);
  }
  types.set('ext', 'cabane'); // son gisement est ouvert dans la partie de départ
  for (const [type, id] of types) {
    await p.evaluate(id => {
      const g = window.__eclat;
      g.E.state.known[id] = true;
      g.E.state.seen[id] = true;
      const button = document.createElement('button');
      button.dataset.goto = id;
      document.querySelector('.view.on').append(button);
      button.click();
      button.remove();
    }, id);
    await settled(p);
    ok(!errors.length, type + ' : ' + errors.join(', '));
    ok(await p.locator('.rwin h2').textContent({timeout: 2000}) === D.ITEMS[id].n, type + ' : fiche ouverte');
    if (type === 'ext') ok(await p.locator('.rwin .proj-box').count() > 0, 'projection de l’extracteur');
    await close(p);
  }
}
async function layout(p,tag){
  const s=await p.locator('#modal .modal-box').evaluate(box=>{
    const b=box.getBoundingClientRect(),x=box.querySelector('.modal-x')?.getBoundingClientRect();
    const bad=[...box.querySelectorAll('*')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&(r.left<b.left-.5||r.right>b.right+.5);}).map(e=>e.tagName+'.'+e.className);
    const small=[...box.querySelectorAll('button')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&(r.width<43.9||r.height<43.9);}).map(e=>e.textContent);
    const heading=box.querySelector('h2'),range=document.createRange();
    if(heading)range.selectNodeContents(heading);
    const title=heading?range.getBoundingClientRect():null;
    return {bad,small,inside:b.left>=0&&b.right<=innerWidth&&b.top>=0&&b.bottom<=innerHeight+.5,scroll:box.scrollWidth<=box.clientWidth+1,titleClear:!x||!title||title.right<=x.left+.5||title.top>=x.bottom||title.bottom<=x.top};
  });
  ok(!s.bad.length,tag+' : contenu débordant '+s.bad);ok(!s.small.length,tag+' : petites cibles '+s.small);
  ok(s.inside&&s.scroll,tag+' : fenêtre dans l’écran');ok(s.titleClear,tag+' : titre et fermeture distincts');
  ok(await p.locator('#app').evaluate(e=>e.inert),tag+' : arrière-plan inactif');
  ok(await p.locator('.modal-box').getAttribute('aria-labelledby')==='modalTitle',tag+' : titre accessible');
}
async function shot(p,name,width,dark){
  if(width!==390||!process.env.FICHES_SHOTS)return;
  fs.mkdirSync(process.env.FICHES_SHOTS,{recursive:true});
  await p.evaluate(()=>{document.activeElement?.blur();document.querySelector('.modal-box').scrollTop=0;});
  await p.screenshot({path:path.join(process.env.FICHES_SHOTS,name+(dark?'-veillee':'')+'.png')});
}
async function run(){
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  browser=await chromium.launch(process.env.CHROMIUM?{executablePath:process.env.CHROMIUM}:{});
  for(const width of [320,360,390,430])for(const advanced of [false,true])for(const dark of [false,true]){
    const ctx=await browser.newContext({viewport:{width,height:width===320?568:844},serviceWorkers:'block',reducedMotion:'reduce',acceptDownloads:true});
    const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
    await p.addInitScript(raw=>{localStorage.setItem('eclat.save.v1',raw);localStorage.setItem('eclat.style.carnet-defaut','1');localStorage.setItem('eclat.preview.style','atlas');},seed(advanced,dark));
    await p.goto('http://127.0.0.1:'+server.address().port);await p.waitForFunction(()=>!!window.__eclat);
    for(let i=0;i<8;i++){await p.waitForTimeout(100);await close(p);}
    const tag=width+'/'+advanced+'/'+dark;
    if (width === 320 && !advanced && !dark) await allTypes(p, errors);
    await p.locator('#tabs [data-tab="journal"]').click(); /* 0.66 : le Carnet est le premier feuillet du Journal : il s’ouvre seul */ await p.waitForTimeout(300);if(!await p.locator('#cq').count())await p.locator('[data-tab2="carnet"]').click();await p.locator('#cq').fill('Manche');
    const opener=p.locator('[data-rec="manche"][data-goto="manche"]').first();
    await opener.click();await settled(p);await layout(p,tag+'/recette-manque');
    ok(await p.locator('.rwin .ring.lack').count()>0,tag+' : ingrédients manquants distingués');
    await shot(p,(advanced?'avance-':'')+'recette',width,dark);
    await p.locator('.ring[data-id="bois"]').click();await settled(p);await layout(p,tag+'/matiere');
    ok(await p.locator('.rwin h2').textContent()==='Bois',tag+' : navigation vers la matière');
    await p.locator('[data-m="back"]').click();await settled(p);
    ok(await p.locator('.rwin h2').textContent()==='Manche',tag+' : retour à la recette');
    await p.keyboard.press('Escape');await p.waitForFunction(()=>!document.getElementById('app').inert);
    ok(await p.locator('#modal').evaluate(e=>e.classList.contains('hidden')),tag+' : fermeture au clavier');
    await p.evaluate(()=>{const g=window.__eclat;g.E.state.inv.bois=100;g.render(true);});
    await opener.click();await settled(p);await layout(p,tag+'/recette-prete');
    ok(await p.locator('.rwin .ring.ok').count()>0,tag+' : ingrédients disponibles distingués');await close(p);
    await p.locator('#cq').fill('');if(!await p.locator('[data-cf="unk"]').count())await p.locator('[data-cpanel="filtres"]').click(); /* 0.66 : les filtres sont derrière l’entonnoir */ await p.locator('[data-cf="unk"]').click();
    const unknown=p.locator('.rec.unknown [data-goto]').first();
    if(await unknown.count()){
      await unknown.click();await settled(p);await layout(p,tag+'/inconnue');
      await shot(p,(advanced?'avance-':'')+'inconnue',width,dark);await close(p);
    }
    await p.locator('#menuBtn').focus();await p.keyboard.press('Enter');await settled(p);await layout(p,tag+'/menu');
    ok(await p.locator('.menu-grid .gi').count()>0,tag+' : pictogrammes SVG existants');
    await shot(p,(advanced?'avance-':'')+'menu',width,dark);
    await p.locator('.m-nav-tab:has-text("Système")').click();await p.waitForTimeout(200); /* 0.66 : les sauvegardes sont sous l’onglet Système du menu */ await p.locator('[data-m="saves"]').click();await settled(p);await layout(p,tag+'/sauvegardes');
    await shot(p,(advanced?'avance-':'')+'sauvegardes',width,dark);
    const downloadPromise=p.waitForEvent('download',{timeout:10000});await p.locator('[data-m="dl"]').click();
    const download=await downloadPromise.catch(async e=>{console.log(await p.locator('#modal').innerText());await p.screenshot({path:path.join(ROOT,'../output/atlas-vivant/fiches-echec.png')});throw e;});const exported=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
    ok(exported.known.manche&&exported.inv.bois===100,tag+' : export de la partie intact');
    await close(p);
    await p.locator('#menuBtn').click();await settled(p);await p.locator('[data-mjump="aide"]').click();await p.locator('[data-m="help"]').click();await settled(p);await layout(p,tag+'/aide');await close(p);
    await p.locator('#menuBtn').focus();await p.keyboard.press('Enter');await settled(p);await p.keyboard.press('Escape');await p.waitForFunction(()=>!document.getElementById('app').inert);
    ok(await p.locator('#menuBtn').evaluate(e=>document.activeElement===e),tag+' : retour du focus au Menu');
    ok(!errors.length,tag+' : erreurs '+errors.join(';'));console.log('✓ '+tag);await ctx.close();
  }
  console.log('✓ Fiches / fenêtres : '+checks+' contrôles.');
}
run().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.close();});
