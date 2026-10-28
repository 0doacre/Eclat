"use strict";
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const {chromium}=require(process.env.PW||'playwright'),D=require('../js/data'),Core=require('../js/engine');
const ROOT=path.resolve(__dirname,'..'),equipped=fs.existsSync(path.join(ROOT,'js/equipements.js'));
const server=http.createServer((req,res)=>{const f=path.resolve(ROOT,'.'+new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));if(!f.startsWith(ROOT+path.sep))return res.writeHead(403).end();fs.readFile(f,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.woff2':'font/woff2'})[path.extname(f)]||'application/octet-stream');res.end(b);});});
let checks=0;const check=(v,n)=>{assert.ok(v,n);checks++;};
function fixture(preview,mode){
  const E=preview?Core.withData(require('../js/equipements').createData(D,{fullGame:true})).createEngine():Core.createEngine(),s=E.state;
  s.introSeen=true;s.cycle=2;s.meta.forcedDone=true;s.flags.ver=D.VERSION;s.stats.crafts=1;
  Object.assign(s.settings,{tuto:false,sound:false,visiteurs:false,theme:'light',account:{token:'CRED_ASSIST_TEST'}});
  if(mode==='worker'){for(const id of ['racloir_os','etabli_amenage'])E.add(id,1);E.learn('laniere',true);Object.assign(s.atelierEconomy,{hired:true,working:true,budget:0});}
  else{E.learn('manche',true);if(mode==='completed')E.add('bois',6);assert.equal(E.order('manche',2).ok,true);}
  if(mode==='completed')s.t=Date.now()-600000;
  E.recalc();return E.serialize();
}
async function ready(p,preview,mode){
  await p.addInitScript(({raw,key})=>{if(!localStorage.getItem(key))localStorage.setItem(key,raw);},{raw:fixture(preview,mode),key:preview?'eclat.preview.craft.v1':'eclat.save.v1'});
  await p.goto('http://127.0.0.1:'+server.address().port+'/index.html'+(preview?'':'?atelier=classique'));
  await p.waitForFunction(()=>!!window.__eclat);
  for(let i=0;i<15;i++){await p.waitForTimeout(120);if(mode==='completed'&&await p.locator('#modal h2').textContent().catch(()=>null)==='Bon retour !')return;await p.evaluate(()=>window.__eclat.closeModal());}
}
async function menu(p,action){await p.locator('#menuBtn').click();await p.locator('#modal [data-assistance="'+action+'"]').click();await p.waitForTimeout(200);}
async function main(){
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM?{executablePath:process.env.CHROMIUM}:{})});
  try{
    for(const preview of equipped?[false,true]:[false])for(const width of [320,390,980]){
      const ctx=await browser.newContext({viewport:{width,height:950},serviceWorkers:'block',acceptDownloads:true}),p=await ctx.newPage(),errors=[],posts=[];
      p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(r.method()==='POST')posts.push(r.url());});await ready(p,preview,'blocked');
      await menu(p,'diagnostic');await p.waitForSelector('#modal h2:text-is("Qu’est-ce qui attend ?")');
      check((await p.locator('#modal').innerText()).includes('Aucune extraction active'),width+' manque expliqué');
      await p.locator('#modal [data-kind="zone"]').first().click();await p.waitForFunction(()=>window.__eclat.U.tab==='domaine'&&!window.__eclat.U.mcur);
      check(await p.locator('#dt-lisiere').isVisible(),width+' accès au gisement');
      await menu(p,'report');await p.waitForSelector('#report-observed');
      check(!(await p.locator('#report-save').isChecked()),width+' sauvegarde opt-in');
      await p.locator('[data-assistance="download"]').click();check((await p.locator('#report-status').innerText()).includes('Décris'),width+' description requise');
      await p.locator('#report-expected').fill('Fabriquer les manches');await p.locator('#report-observed').fill('<img src=x onerror=alert(1)> La commande attend.');await p.locator('#report-steps').fill('Commander deux manches sans bois.');
      const download=p.waitForEvent('download');await p.locator('[data-assistance="download"]').click();const data=JSON.parse(fs.readFileSync(await(await download).path(),'utf8'));
      check(data.jeu.profil===(preview?'atelier-equipe':'classique'),width+' profil dans le rapport');check(!('sauvegarde'in data),width+' rapport sans partie par défaut');check(data.diagnostic.jobs[0].state==='resource',width+' contexte du blocage joint');
      check(!JSON.stringify(data).includes('CRED_ASSIST_TEST'),width+' aucun identifiant');
      await p.locator('#report-save').check();const withSave=p.waitForEvent('download');await p.locator('[data-assistance="download"]').click();const full=JSON.parse(fs.readFileSync(await(await withSave).path(),'utf8'));
      check(!!full.sauvegarde.hand.q.length,width+' sauvegarde jointe sur demande');check(!JSON.stringify(full).includes('CRED_ASSIST_TEST'),width+' sauvegarde exportée sans compte');
      check(await p.locator('#report-observed').inputValue()==='<img src=x onerror=alert(1)> La commande attend.',width+' texte conservé sans HTML exécuté');
      check(await p.locator('#modal .modal-box').evaluate(el=>el.scrollWidth<=el.clientWidth+1),width+' formulaire contenu');check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),width+' page contenue');
      if(process.env.ASSIST_SHOTS){fs.mkdirSync(process.env.ASSIST_SHOTS,{recursive:true});await p.locator('#modal').screenshot({path:path.join(process.env.ASSIST_SHOTS,(preview?'equipe':'classique')+'-rapport-'+width+'.png')});}
      check(!errors.length,errors.join(';'));check(!posts.length,'aucun envoi automatique');await ctx.close();
      const c=await browser.newContext({viewport:{width,height:950},serviceWorkers:'block'}),q=await c.newPage(),errs=[];q.on('pageerror',e=>errs.push(e.message));await ready(q,preview,'completed');
      await q.waitForSelector('#modal h2:text-is("Bon retour !")');const text=await q.locator('#modal').innerText();
      check(text.includes('Reprendre le fil')&&text.includes('Commandes terminées')&&text.includes('Manche'),width+' commandes terminées au retour');
      check(text.includes('Objectif à reprendre'),width+' objectif au retour');check(!errs.length,errs.join(';'));await c.close();
    }
    if(equipped){const c=await browser.newContext({viewport:{width:390,height:950},serviceWorkers:'block'}),p=await c.newPage();await ready(p,true,'worker');await menu(p,'diagnostic');check((await p.locator('#modal').innerText()).includes('Avance de salaire épuisée'),'salaire expliqué dans la preview');await p.locator('[data-kind="worker"]').click();await p.waitForFunction(()=>window.__eclat.U.tab==='atelier'&&!window.__eclat.U.mcur);check(await p.locator('#ae-worker-status').isVisible(),'accès à l’ouvrier');await c.close();}
    console.log(checks+' contrôles navigateur du lot 1 réussis.');
  }finally{await browser.close();server.close();}
}
main().catch(e=>{console.error(e);server.close();process.exitCode=1;});
