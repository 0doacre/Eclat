/* Apports réels au Sentier des Herbes : aucune nouvelle règle de passage. */
"use strict";
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const{chromium}=require(process.env.PW||'playwright'),Core=require('../js/engine'),D=require('../js/data');
const ROOT=path.resolve(__dirname,'..');let browser,checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++;};
const server=http.createServer((req,res)=>{const file=path.resolve(ROOT,'.'+new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));if(!file.startsWith(ROOT+path.sep))return res.writeHead(403).end();fs.readFile(file,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.mp3':'audio/mpeg','.svg':'image/svg+xml','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream');res.end(b);});});

async function run(){await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=(process.env.TEST_URL||'http://127.0.0.1:'+server.address().port+'/')+'docs/art-direction/domaine-monde-v1/';browser=await chromium.launch({executablePath:process.env.CHROMIUM,headless:true});
for(const width of [390,1200,320]){
 const c=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block',reducedMotion:'reduce'}),p=await c.newPage(),errors=[],missing=[];p.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});p.on('response',r=>{if(r.status()===404)missing.push(r.url());});
 await p.addInitScript(()=>{localStorage.setItem('eclat.save.v1','partie-intacte');localStorage.setItem('eclat.preview.craft.v1','preview-intacte');});await p.goto(url);await p.waitForFunction(()=>!!window.__monde);await p.waitForTimeout(100);ok(await p.locator('body').getAttribute('data-stage')==='0','camp initial');
 await p.locator('#world image').first().evaluate(e=>new Promise((resolve,reject)=>{const img=new Image();img.onload=resolve;img.onerror=reject;img.src=e.getAttribute('href');}));
 if(process.env.PATH_SHOTS){fs.mkdirSync(process.env.PATH_SHOTS,{recursive:true});await p.screenshot({path:path.join(process.env.PATH_SHOTS,'camp-'+width+'.png'),fullPage:true});}
 const before=await p.evaluate(()=>window.__monde.E.count('bois'));await p.locator('[data-gather="bois"]').click();ok(await p.evaluate(()=>window.__monde.E.count('bois'))>before,'récolte moteur');
 const fibre=await p.evaluate(()=>window.__monde.E.count('fibre'));await p.locator('[data-gather="fibre"]').dispatchEvent('pointerdown',{pointerId:7,clientX:10,clientY:10});await p.waitForTimeout(620);await p.locator('[data-gather="fibre"]').dispatchEvent('pointerup',{pointerId:7});ok(await p.locator('#sheetTitle').textContent()==='Fibres','appui long ouvre la fiche');ok(await p.evaluate(()=>window.__monde.E.count('fibre'))===fibre,'appui long sans récolte');
 await p.locator('[data-gather="bois"]').click();await p.locator('[data-manage="bois"]').click();await p.locator('[data-action="install"]').click();ok(await p.evaluate(()=>window.__monde.E.domExt('lisiere','bois').u.cabane)===1,'extracteur posé');ok(await p.locator('#installation image').count()===1,'extracteur dessiné');
 await p.locator('[data-action="upgrade"]').click();ok(await p.evaluate(()=>window.__monde.E.domExt('lisiere','bois').u.hutte)===1,'amélioration moteur');
 const stock=await p.evaluate(()=>window.__monde.E.count('bois'));await p.waitForTimeout(700);ok(await p.evaluate(()=>window.__monde.E.count('bois'))>stock,'production réelle');
 await p.locator('#advance').click();await p.waitForTimeout(6500);ok(await p.locator('body').getAttribute('data-stage')==='1','chêne découvert');ok(await p.locator('[data-study="chene"]').count()>0,'planche conservée');
 await p.locator('#advance').click();await p.waitForTimeout(6500);ok(await p.locator('body').getAttribute('data-stage')==='2','grotte découverte');
 for(let i=0;i<3;i++)await p.locator('#advance').click();await p.waitForTimeout(200);ok(await p.locator('body').getAttribute('data-stage')==='3','passage ouvert');ok(await p.evaluate(()=>window.__monde.E.zoneOpen('plaine')),'vraie terre ouverte');ok(await p.locator('[data-camera="all"]').getAttribute('aria-pressed')==='true','dézoom de découverte');
 await p.locator('[data-camera="plaine"]').click();await p.waitForTimeout(100);ok(await p.locator('[data-gather="os"]').isVisible(),'ressource Plaine accessible');
 await p.locator('#advance').click();await p.waitForTimeout(6500);ok(await p.evaluate(()=>window.__monde.E.state.exp.done.plaine)===1,'champ des os découvert');
 await p.locator('#advance').click();await p.waitForTimeout(6500);ok(await p.evaluate(()=>window.__monde.E.state.exp.done.plaine)===2,'tumulus découvert');
 await p.locator('.collection [data-study="tumulus"]').click();ok(await p.locator('dialog').isVisible(),'collection consultable');await p.locator('dialog button').click();
 if(process.env.PATH_SHOTS){await p.locator('[data-camera="all"]').click();await p.waitForTimeout(150);await p.screenshot({path:path.join(process.env.PATH_SHOTS,'monde-'+width+'.png'),fullPage:true});}
 await p.reload();await p.waitForFunction(()=>!!window.__monde);ok(await p.evaluate(()=>window.__monde.E.zoneOpen('plaine')),'démo persistée');ok(await p.evaluate(()=>localStorage.getItem('eclat.save.v1'))==='partie-intacte','main intacte');ok(await p.evaluate(()=>localStorage.getItem('eclat.preview.craft.v1'))==='preview-intacte','preview intacte');ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'sans débordement '+width);ok(!errors.length,errors.join(';'));ok(!missing.length,missing.join(';'));await c.close();console.log('✓ Domaine continu '+width);
}
console.log(checks+' contrôles du Domaine continu.');}
run().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.close();});
