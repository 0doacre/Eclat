/* Apports réels au Sentier des Herbes : aucune nouvelle règle de passage. */
"use strict";
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const{chromium}=require(process.env.PW||'playwright'),Core=require('../js/engine'),D=require('../js/data');
const ROOT=path.resolve(__dirname,'..');let browser,checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++;};
const server=http.createServer((req,res)=>{const file=path.resolve(ROOT,'.'+new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));if(!file.startsWith(ROOT+path.sep))return res.writeHead(403).end();fs.readFile(file,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.mp3':'audio/mpeg','.svg':'image/svg+xml','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream');res.end(b);});});

async function run(){await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=process.env.TEST_URL||'http://127.0.0.1:'+server.address().port+'/';browser=await chromium.launch({executablePath:process.env.CHROMIUM,headless:true});
for(const width of[320,390,1200]){
 const c=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{Math.random=()=>.99;});await p.goto(url);await p.waitForFunction(()=>!!window.__eclat);await p.evaluate(()=>{const g=window.__eclat;g.E.state.introSeen=true;g.E.state.settings.tuto=false;g.E.state.settings.visiteurs=false;g.E.state.flags.ver=window.ECLAT_DATA.VERSION;g.E.state.meta.forcedDone=true;g.save();});await p.reload();await p.waitForFunction(()=>!!window.__eclat);
 async function close(){for(let i=0;i<5;i++){await p.evaluate(()=>window.__eclat.closeModal());await p.waitForTimeout(80);}}
 await close();await p.locator('#menuBtn').click();await p.locator('[data-m="modeTest"]').click();await p.locator('#testCode').fill('faux');await p.locator('[data-m="activate"]').click();ok((await p.locator('#testError').textContent()).includes('incorrect'),'mauvais code');
 await p.locator('#testCode').fill('ECLAT-ATELIER');await p.locator('[data-m="activate"]').click();await p.waitForURL(/mode-test=1/);await p.waitForFunction(()=>!!window.__eclat);await close();ok(await p.locator('#testModeBar').isVisible(),'bandeau');
 const cfg=await p.evaluate(()=>window.EclatModeTest.config(window.ECLAT_CRAFT_PREVIEW===true,location.href,sessionStorage));const original=await p.evaluate(k=>localStorage.getItem(k),cfg.regular);
 await p.locator('#testCommands').click();await p.waitForTimeout(180);await p.locator('[data-m="resources"]').click();await close();ok(await p.evaluate(()=>window.__eclat.E.state.inv.bois)>=10000,'matières ajoutées');
 ok(await p.evaluate(()=>window.__eclat.E.startExp('lisiere').ok),'exploration démarrée');let discovered=0;await p.exposeFunction('onTestDiscovery',()=>{discovered++;});await p.evaluate(()=>window.__eclat.E.on('expdone',()=>window.onTestDiscovery()));
 await p.locator('#testCommands').click();await p.waitForTimeout(180);await p.locator('[data-m="finish"]').click();await close();await p.waitForTimeout(350);ok(discovered===1,'véritable événement de découverte');await close();
 await p.locator('#testCommands').click();await p.waitForTimeout(180);await p.locator('#testAge').selectOption('1');await p.locator('[data-m="prepare"]').click();await close();ok(await p.evaluate(()=>window.__eclat.E.state.age)===1,'âge Os');
 await p.locator('#testCommands').click();await p.waitForTimeout(180);await p.locator('[data-m="recipes"]').click();await close();ok(await p.evaluate(()=>window.__eclat.E.state.known.laniere),'recette connue');
 await p.locator('#testCommands').click();await p.waitForTimeout(180);await p.locator('[data-m="objective"]').click();await close();ok(await p.evaluate(()=>window.__eclat.E.state.made.laniere)>0,'objectif validé');
 await p.locator('#testCommands').click();await p.waitForTimeout(180);await p.locator('#testZone').selectOption('lisiere');await p.locator('[data-m="explore"]').click();await close();ok(await p.evaluate(()=>window.__eclat.E.state.exp.done.lisiere===window.__eclat.E.ZONES.lisiere.exps.length),'lieux');
 await p.reload();await p.waitForFunction(()=>!!window.__eclat);await close();ok(await p.evaluate(()=>window.__eclat.E.state.age)===1,'copie persistée');ok(await p.evaluate(k=>localStorage.getItem(k),cfg.regular)===original,'partie normale intacte');ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'sans débordement '+width);
 await p.locator('#testQuit').click();await p.waitForURL(u=>!u.searchParams.has('mode-test'));await p.waitForFunction(()=>!!window.__eclat);await close();ok(await p.evaluate(()=>window.__eclat.E.state.age)===0,'retour partie originale');ok(!(await p.locator('#testModeBar').isVisible()),'bandeau retiré');ok(!errors.length,errors.join(';'));await c.close();console.log('✓ Mode test navigateur '+width);
}
console.log(checks+' contrôles du mode test.');}
run().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.close();});
