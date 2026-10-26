/* Journal / Cosmos : parties de contrôle jetables, jamais la partie du joueur.
 * PW, CHROMIUM, ARCHIVES_SHOTS ; ARCHIVES_BASELINE=1 pour les captures avant. */
"use strict";
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const {chromium}=require(process.env.PW||'playwright');
const D=require('../js/data.js'),{createEngine}=require('../js/engine.js');
const ROOT=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
  const file=path.resolve(ROOT,'.'+new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));
  if(!file.startsWith(ROOT+path.sep))return res.writeHead(403).end();
  const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.webp':'image/webp','.woff2':'font/woff2'};
  fs.readFile(file,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(b);});
});
let browser,checks=0;
function ok(v,m){assert.ok(v,m);checks++;}
function seed(stage,dark){
  const E=createEngine();
  if(stage!=='debut')E.load(fs.readFileSync(path.join(ROOT,'tools/fixtures/save-v5-age8-usine.json'),'utf8'));
  const s=E.state;
  if(stage==='debut'){s.frags.chene=1;s.exp.done.lisiere=1;}
  if(stage==='riche'){
    s.age=13;s.inv.ordinateur=1;s.inv.radiotelescope=1;s.inv.flute=1;
    s.made.ordinateur=1;s.made.radiotelescope=1;s.made.flute=1;
    E.givePage('p01','test');E.givePage('p02','test');
    s.signes.main={vu:{'La Lisière':1},lu:false};
    s.term=['> aide','Message de contrôle : les commandes existantes restent disponibles.'];
    E.recalc();
  }
  s.introSeen=true;s.t=Date.now();s.flags.ver=D.VERSION;
  Object.assign(s.settings,{tuto:false,sound:false,visiteurs:false,largeText:dark,theme:dark?'dark':'light'});
  return E.serialize();
}
async function close(p){await p.evaluate(()=>window.__eclat.closeModal());await p.waitForFunction(()=>!document.getElementById('app').inert);}
async function shot(p,name){
  if(!process.env.ARCHIVES_SHOTS)return;
  fs.mkdirSync(process.env.ARCHIVES_SHOTS,{recursive:true});
  await p.evaluate(()=>{document.activeElement?.blur();document.getElementById('views').scrollTop=0;});
  await p.evaluate(async()=>{await Promise.all([...document.querySelectorAll('.view.on img')].filter(e=>{const r=e.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0;}).map(e=>e.decode().catch(()=>{})));});
  await p.screenshot({path:path.join(process.env.ARCHIVES_SHOTS,name+'.png')});
}
async function layout(p,tag,baseline){
  const r=await p.evaluate(()=>{
    const view=document.querySelector('.view.on');
    const small=[...view.querySelectorAll('button')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&(r.width<43.9||r.height<43.9);}).map(e=>e.textContent.trim());
    const overflow=[...view.querySelectorAll('*')].filter(e=>{
      if(e.closest('.filters,.fig-sky'))return false;
      const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&(r.left<-.5||r.right>innerWidth+.5);
    }).slice(0,8).map(e=>e.tagName+'.'+e.className);
    return {page:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)>innerWidth,small,overflow};
  });
  ok(!r.page,tag+': page contenue');
  if(!baseline){ok(!r.small.length,tag+': cibles trop petites '+r.small);ok(!r.overflow.length,tag+': débordement '+r.overflow);}
}
async function run(){
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  browser=await chromium.launch(process.env.CHROMIUM?{executablePath:process.env.CHROMIUM}:{});
  const baseline=!!process.env.ARCHIVES_BASELINE;
  for(const width of(baseline?[390]:[320,360,390,430]))for(const stage of['debut','avance','riche'])for(const dark of(baseline?[false]:[false,true])){
    const ctx=await browser.newContext({viewport:{width,height:width===320?568:844},hasTouch:true,serviceWorkers:'block',reducedMotion:'reduce'});
    const p=await ctx.newPage(),errors=[];
    p.on('pageerror',e=>errors.push(e.message));
    await p.addInitScript(raw=>{localStorage.setItem('eclat.save.v1',raw);localStorage.setItem('eclat.preview.style','atlas');},seed(stage,dark));
    await p.goto('http://127.0.0.1:'+server.address().port);await p.waitForFunction(()=>!!window.__eclat);
    for(let i=0;i<7;i++){await p.waitForTimeout(100);await close(p);}
    await p.evaluate(stage=>{
      const g=window.__eclat,D=window.ECLAT_DATA;
      g.E.visibleFrags().filter(id=>D.FRAGS[id]&&g.E.zoneOpen(D.FRAGS[id].z)&&!g.E.ZONES[D.FRAGS[id].z]?.secret).slice(0,stage==='debut'?1:3).forEach(id=>{g.E.state.frags[id]=1;});
      g.render(true);
    },stage);
    await p.locator('#tabs [data-tab="journal"]').click();
    await p.waitForFunction(()=>document.fonts.status==='loaded');
    const prefix=stage+(dark?'-veillee':'');
    const tabs=await p.locator('#v-journal [data-jt]').evaluateAll(es=>es.map(e=>e.dataset.jt));
    for(const tab of tabs){
      await p.locator('[data-jt="'+tab+'"]').click();
      await layout(p,width+'/'+stage+'/'+dark+'/'+tab,baseline);
      if(width===390)await shot(p,prefix+'-'+tab);
      if(tab==='fragments'){
        ok(await p.locator('[data-frag]').count()>0,'Fragments retrouvés accessibles');
        const expected=await p.locator('[data-frag]').first().locator('b').textContent();
        await p.locator('[data-frag]').first().focus();await p.keyboard.press('Enter');
        ok(await p.locator('#modal h2').textContent()===expected,'Lecture du fragment au clavier');
        if(width===390&&stage==='debut')await shot(p,prefix+'-lecture');
        await close(p);
      }
      if(tab==='livre'){
        ok(await p.locator('[data-page]').count()===2,'Seulement les pages retrouvées sont proposées');
        ok(await p.locator('.livre-cell.empty [data-page]').count()===0,'Pages manquantes non interactives');
        ok(await p.locator('.livre-cell.empty').evaluateAll(es=>es.every(e=>/^\d+$/.test(e.textContent.trim()))),'Les pages absentes ne montrent aucun titre');
        await p.locator('[data-page]').first().focus();await p.keyboard.press('Enter');
        ok(await p.locator('.livre-imprime').count()===1,'Livre lisible au clavier');await close(p);
      }
      if(tab==='secrets')ok(await p.locator('.sec.unk').evaluateAll(es=>es.every(e=>e.textContent.includes('???'))),'Noms des secrets fermés préservés');
      if(tab==='flute'){
        await p.locator('[data-note="1"]').click();
        ok((await p.locator('#notes').textContent()).includes('1'),'La flûte répond');
      }
    }
    if(stage==='debut'){
      ok(!tabs.includes('livre')&&!tabs.includes('signes'),'Aucun onglet futur ajouté au début');
      ok(!await p.locator('[data-tab2="cosmos"]').count(),'Cosmos indisponible avant son déblocage');
    }else{
      await p.locator('[data-tab2="cosmos"]').click();
      const cTabs=await p.locator('#v-cosmos [data-ct]').evaluateAll(es=>es.map(e=>e.dataset.ct));
      for(const tab of cTabs){
        await p.locator('[data-ct="'+tab+'"]').click();
        await layout(p,width+'/'+stage+'/'+dark+'/cosmos-'+tab,baseline);
        if(width===390)await shot(p,prefix+'-cosmos-'+tab);
        if(tab==='ciel'){
          const canvas=p.locator('#skyCanvas');
          const before=await p.locator('#skyInfo').textContent();
          const box=await canvas.boundingBox();
          await p.mouse.click(box.x+box.width*.24,box.y+box.height*.16);
          ok(await p.locator('#skyInfo').textContent()==='Véga.','Le ciel garde ses coordonnées et ses interactions');
          ok(await p.evaluate(()=>window.EclatSky.mounted()),'Le ciel dynamique reste monté');
          ok(before.length>0,'Consigne du ciel conservée');
        }else ok(await p.evaluate(()=>!window.EclatSky.mounted()),'Le ciel est démonté hors de son onglet');
        if(tab==='figures'){
          const star=p.locator('.fig-star.on').first();
          if(await star.count()){await star.focus();await p.keyboard.press('Enter');ok(await p.locator('#modal:not(.hidden)').count()===1,'Figure consultable au clavier');await close(p);}
        }
        if(tab==='arche'&&stage==='riche'){
          await p.locator('#termIn').fill('aide');await p.locator('#termForm button').click();
          ok((await p.locator('#term').textContent()).toLowerCase().includes('aide'),'Le terminal reçoit une commande');
        }
      }
    }
    await p.locator('#atlasToggle').click();ok(await p.locator('#atlasToggle').getAttribute('aria-pressed')==='false','Bascule Classique');
    await p.locator('#atlasToggle').click();ok(await p.locator('#atlasToggle').getAttribute('aria-pressed')==='true','Bascule Atlas');
    ok(!errors.length,'Aucune erreur : '+errors.join(';'));
    console.log('✓ '+width+'/'+stage+'/'+dark);
    await ctx.close();
  }
  if(!baseline){
    const ctx=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),p=await ctx.newPage();
    await p.addInitScript(raw=>{localStorage.setItem('eclat.save.v1',raw);localStorage.setItem('eclat.preview.style','atlas');},seed('riche',false));
    await p.goto('http://127.0.0.1:'+server.address().port);await p.waitForFunction(()=>!!window.__eclat);
    await p.evaluate(()=>navigator.serviceWorker.ready);await p.reload();
    await p.waitForFunction(()=>navigator.serviceWorker.controller&&window.__eclat);
    await ctx.setOffline(true);await p.reload();await p.waitForFunction(()=>!!window.__eclat);
    for(let i=0;i<7;i++){await p.waitForTimeout(100);await close(p);}
    await p.locator('#tabs [data-tab="journal"]').click();await p.locator('[data-jt="livre"]').click();
    await p.locator('[data-page]').first().click();ok(await p.locator('.livre-imprime').count()===1,'Lecture du Livre après rechargement hors ligne');await close(p);
    await p.locator('[data-tab2="cosmos"]').click();
    ok(await p.locator('#skyCanvas').count()===1&&await p.evaluate(()=>window.EclatSky.mounted()),'Ciel interactif disponible hors ligne');
    ok(await p.evaluate(async()=>{const r=await fetch('assets/oeuvres/dyson.webp');return r.ok&&(await r.arrayBuffer()).byteLength>0;}),'Illustration des Grands Œuvres disponible hors ligne avant ouverture');
    await ctx.close();
  }
  console.log('✓ Archives / Cosmos : '+checks+' contrôles.');
}
run().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.close();});
