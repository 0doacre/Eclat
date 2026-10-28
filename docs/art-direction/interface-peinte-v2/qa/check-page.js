"use strict";
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{pathToFileURL}=require('url');
const {chromium}=require(process.env.PW||'playwright'),ROOT=path.resolve(__dirname,'..');
let checks=0;const check=(v,m)=>{assert.ok(v,m);checks++;};
(async()=>{const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM?{executablePath:process.env.CHROMIUM}:{})});
try{for(const width of [320,390,1280])for(const dark of [false,true]){
 const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'}),p=await context.newPage(),errors=[],failures=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('requestfailed',r=>failures.push(r.url()));
 await p.goto(pathToFileURL(path.join(ROOT,'index.html')).href);await p.evaluate(()=>document.fonts.ready);await p.waitForFunction(()=>[...document.images].every(e=>e.complete&&e.naturalWidth>0));
 if(dark)await p.locator('#theme').click();
 const tag=width+'/'+(dark?'veillee':'clair');
 const geometry=()=>p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,small:[...document.querySelectorAll('button')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&(r.width<43.9||r.height<43.9);}).map(e=>e.id||e.textContent)}));
 let g=await geometry();check(!g.overflow,tag+' débordement');check(!g.small.length,tag+' cibles '+g.small.join(','));
 await p.addStyleTag({content:'.navigation{position:static;transform:none;margin:22px auto 0}'}).then(async style=>{await p.screenshot({path:path.join(__dirname,(dark?'veillee':'clair')+'-'+width+'.png'),fullPage:true});await style.evaluate(e=>e.remove());});
 await p.screenshot({path:path.join(__dirname,(dark?'veillee':'clair')+'-'+width+'-ecran.png')});
 const original=await p.locator('#stock').textContent();await p.locator('#harvest').click();check((await p.locator('#stock').textContent())!==original,tag+' récolte');check((await p.locator('#status').textContent()).includes('démonstration'),tag+' retour explicite');
 await p.locator('#replicate').click();check((await p.locator('.production').textContent()).includes('6 réplicateurs'),tag+' construction simulée');
 for(const id of ['places-open','mastery-open','releve-open','caveau']){await p.locator('#'+id).click();check(await p.locator('dialog').isVisible(),tag+' fenêtre '+id);await p.keyboard.press('Escape');check(!await p.locator('dialog').isVisible(),tag+' fermeture clavier');}
 await p.locator('#menu-open').click();await p.locator('#large-text').check();await p.keyboard.press('Escape');check(await p.locator('body').evaluate(e=>e.classList.contains('large')),tag+' grand texte');g=await geometry();check(!g.overflow,tag+' grand texte contenu');
 await p.locator('#harvest').focus();check(await p.locator('#harvest').evaluate(e=>getComputedStyle(e).outlineStyle==='solid'),tag+' focus visible');
 await p.locator('[data-page="atelier"]').click();check(await p.locator('dialog').isVisible(),tag+' navigation');await p.keyboard.press('Escape');
 check(!errors.length,tag+' erreurs JS '+errors.join(';'));check(!failures.length,tag+' ressources '+failures.join(';'));
 await context.close();console.log('✓ '+tag);
}
for(const dark of [false,true]){const p=await browser.newPage({viewport:{width:1100,height:1000}});await p.goto(pathToFileURL(path.join(ROOT,'composants.html')).href);await p.evaluate(()=>document.fonts.ready);if(dark)await p.locator('#theme').click();check(await p.locator('button:disabled').isDisabled(),'état indisponible');check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'composants contenus');await p.screenshot({path:path.join(__dirname,'composants-'+(dark?'veillee':'clair')+'.png'),fullPage:true});await p.close();}
fs.writeFileSync(path.join(__dirname,'report.json'),JSON.stringify({checks,widths:[320,390,1280],themes:['clair','veillee'],status:'passed',fullPageCapture:'Navigation placée en fin de document uniquement pour la planche complète ; captures -ecran et prototype gardent la navigation fixe.'},null,2));console.log(checks+' contrôles réussis.');}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
