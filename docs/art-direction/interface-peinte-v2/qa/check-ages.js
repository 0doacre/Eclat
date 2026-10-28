"use strict";
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{pathToFileURL}=require('url');
const {chromium}=require(process.env.PW||'playwright'),ROOT=path.resolve(__dirname,'..');
let checks=0;const check=(v,m)=>{assert.ok(v,m);checks++;};
(async()=>{const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM?{executablePath:process.env.CHROMIUM}:{})});let commonPaper,commonButton,commonText;const titleFonts={};
try{for(const width of [320,390,1280])for(const age of ['bois','vapeur','stellaire']){
 const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'}),p=await context.newPage(),errors=[],failures=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('requestfailed',r=>failures.push(r.url()));
 await p.goto(pathToFileURL(path.join(ROOT,'index.html')).href+'?age='+age);await p.evaluate(()=>document.fonts.ready);await p.waitForFunction(()=>[...document.images].every(e=>e.complete&&e.naturalWidth>0));
 const tag=width+'/'+age;
 const geometry=()=>p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,small:[...document.querySelectorAll('button,.age-studies a')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&(r.width<43.9||r.height<43.9);}).map(e=>e.id||e.textContent)}));
 let g=await geometry();check(!g.overflow,tag+' débordement');check(!g.small.length,tag+' cibles '+g.small.join(','));
 check(await p.locator('body').getAttribute('data-age')===age,tag+' âge actif');check(await p.locator('.age-studies [data-age][aria-current]').count()===1,tag+' navigation active');check(await p.locator('#theme').count()===0,tag+' pas de thème clair/sombre');
 const design=await p.evaluate(()=>({paper:getComputedStyle(document.querySelector('.sheet')).backgroundImage,button:getComputedStyle(document.getElementById('harvest'),'::before').backgroundImage,text:getComputedStyle(document.querySelector('.description')).fontFamily,title:getComputedStyle(document.querySelector('h1')).fontFamily}));
 if(!commonPaper){commonPaper=design.paper;commonButton=design.button;commonText=design.text;}
 check(design.paper===commonPaper,tag+' papier permanent');check(design.button===commonButton,tag+' commandes permanentes');check(design.text===commonText,tag+' lecture stable');titleFonts[age]=design.title;
 if(width===1280)await p.addStyleTag({content:'.navigation{position:static;transform:none;margin:22px auto 0}'}).then(async style=>{await p.screenshot({path:path.join(__dirname,age+'-'+width+'.png'),fullPage:true});await style.evaluate(e=>e.remove());});
 if(width===390)await p.screenshot({path:path.join(__dirname,age+'-'+width+'.png'),fullPage:true});
 const original=await p.locator('#stock').textContent();await p.locator('#harvest').click();check((await p.locator('#stock').textContent())!==original,tag+' récolte');check((await p.locator('#status').textContent()).includes('démonstration'),tag+' retour explicite');
 await p.locator('#replicate').click();check((await p.locator('#production-note').textContent()).includes('simulation 1'),tag+' action simulée');
 for(const id of ['places-open','mastery-open','releve-open','caveau']){await p.locator('#'+id).click();check(await p.locator('dialog').isVisible(),tag+' fenêtre '+id);await p.keyboard.press('Escape');check(!await p.locator('dialog').isVisible(),tag+' fermeture clavier');}
 await p.locator('#menu-open').click();await p.locator('#large-text').check();await p.keyboard.press('Escape');check(await p.locator('body').evaluate(e=>e.classList.contains('large')),tag+' grand texte');g=await geometry();check(!g.overflow,tag+' grand texte contenu');
 await p.locator('#harvest').focus();check(await p.locator('#harvest').evaluate(e=>getComputedStyle(e).outlineStyle==='solid'),tag+' focus visible');
 await p.locator('[data-page="atelier"]').click();check(await p.locator('dialog').isVisible(),tag+' navigation');await p.keyboard.press('Escape');
 check(!errors.length,tag+' erreurs JS '+errors.join(';'));check(!failures.length,tag+' ressources '+failures.join(';'));
 const next=age==='bois'?'vapeur':'bois';await p.locator('.age-studies [data-age="'+next+'"]').click();await p.waitForFunction(a=>document.body.dataset.age===a,next);check(await p.locator('body').getAttribute('data-age')===next,tag+' lien de comparaison');
 await context.close();console.log('✓ '+tag);
}
check(new Set(Object.values(titleFonts)).size===3,'trois écritures de titre distinctes');
const p=await browser.newPage({viewport:{width:390,height:1000}});await p.goto(pathToFileURL(path.join(ROOT,'composants.html')).href);check(await p.locator('button:disabled').isDisabled(),'composant indisponible');check(await p.locator('#theme').count()===0,'composants sans thème sombre');await p.close();
fs.writeFileSync(path.join(__dirname,'report.json'),JSON.stringify({checks,widths:[320,390,1280],ages:['bois','vapeur','stellaire'],titleFonts,permanentPaper:true,status:'passed'},null,2));console.log(checks+' contrôles réussis.');}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});

