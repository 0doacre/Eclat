/* Recette graphique Atelier / Carnet. Profils et parties jetables.
 * PW, CHROMIUM, DESIGN_SHOTS facultatifs ; DESIGN_BASELINE=1 pour les captures avant. */
"use strict";
const fs = require('fs'), path = require('path'), http = require('http'), assert = require('assert/strict');
const { chromium } = require(process.env.PW || 'playwright');
const D = require('../js/data.js'), { createEngine } = require('../js/engine.js');
const ROOT = path.resolve(__dirname, '..');
const server = http.createServer((req, res) => {
  const file = path.resolve(ROOT, '.' + new URL(req.url, 'http://localhost').pathname.replace(/\/$/, '/index.html'));
  if (!file.startsWith(ROOT + path.sep)) return res.writeHead(403).end();
  const mime = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.webp':'image/webp', '.svg':'image/svg+xml', '.woff2':'font/woff2' };
  fs.readFile(file, (e, b) => { if(e) return res.writeHead(404).end(); res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream'); res.end(b); });
});
let browser, checks = 0;
function ok(v, message) { assert.ok(v, message); checks++; }
function save(stage, dark) {
  const E = createEngine();
  if (stage !== 'debut') E.load(fs.readFileSync(path.join(ROOT, 'tools/fixtures/save-v5-age8-usine.json'), 'utf8'));
  const s = E.state;
  if (stage === 'espace') s.age = 13;
  s.introSeen = true; s.t = Date.now(); s.flags.ver = D.VERSION;
  Object.assign(s.settings, { tuto:false, sound:false, visiteurs:false, largeText:dark, theme:dark?'dark':'light' });
  return E.serialize();
}
async function close(p) { await p.evaluate(() => window.__eclat.closeModal()); await p.waitForFunction(() => !document.getElementById('app').inert); }
async function shot(p, name) {
  if (!process.env.DESIGN_SHOTS) return;
  fs.mkdirSync(process.env.DESIGN_SHOTS, {recursive:true});
  await p.evaluate(() => { document.activeElement?.blur(); document.getElementById('views').scrollTop = 0; });
  await p.screenshot({path:path.join(process.env.DESIGN_SHOTS, name+'.png')});
}
async function contrast(p, fg, bg) {
  return p.evaluate(([fg,bg])=>{
    const canvas=document.createElement('canvas'), c=canvas.getContext('2d');
    const rgb=s=>{c.clearRect(0,0,1,1);c.fillStyle=s;c.fillRect(0,0,1,1);return [...c.getImageData(0,0,1,1).data].slice(0,3);};
    const lum=rgb=>rgb.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
    const a=lum(rgb(fg)),b=lum(rgb(bg));return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
  },[fg,bg]);
}
async function run() {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  browser = await chromium.launch(process.env.CHROMIUM?{executablePath:process.env.CHROMIUM}:{});
  const baseline = !!process.env.DESIGN_BASELINE;
  for (const width of (baseline?[390]:[320,360,390,430])) for (const stage of ['debut','industrie','espace']) for (const dark of (baseline?[false]:[false,true])) {
    const ctx = await browser.newContext({viewport:{width,height:width===320?568:844},hasTouch:true,serviceWorkers:'block',reducedMotion:'reduce'});
    const p = await ctx.newPage(), errors=[];
    p.on('pageerror', e=>errors.push(e.message));
    await p.addInitScript(raw=>{localStorage.setItem('eclat.save.v1',raw);localStorage.setItem('eclat.preview.style','atlas');}, save(stage,dark));
    await p.goto('http://127.0.0.1:'+server.address().port);
    await p.waitForFunction(()=>!!window.__eclat);
    for(let i=0;i<8;i++){await p.waitForTimeout(100);await close(p);}
    for (const tab of ['atelier','carnet']) {
      if(tab==='carnet' && stage==='debut') {
        await p.evaluate(()=>{ const g=window.__eclat; g.E.state.known.manche=true;g.E.state.seen.bois=true;g.E.state.inv.bois=12;g.render(true); });
      }
      await p.locator('#tabs [data-tab="'+tab+'"]').click();
      await p.waitForFunction(()=>document.fonts.status==='loaded');
      const tag = width+'/'+stage+'/'+dark+'/'+tab;
      const layout = await p.evaluate(()=>{
        const scope=document.querySelector('.view.on');
        const small=[...scope.querySelectorAll('button')].filter(e=>{const b=e.getBoundingClientRect();return b.height>0 && (b.height<43.9||b.width<43.9);}).map(e=>e.textContent.trim());
        const overflow=[...scope.querySelectorAll('*')].filter(e=>{
          if(e.closest('.gestes,.filters,.age-nav,.pins,.mbench'))return false;
          const b=e.getBoundingClientRect(); return b.width>0 && b.height>0 && (b.left<-.5||b.right>innerWidth+.5);
        }).slice(0,10).map(e=>e.tagName+'.'+e.className);
        return {pageOverflow:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)>innerWidth,overflow,small};
      });
      ok(!layout.pageOverflow,tag+': débordement de page');
      if(!baseline) {
        ok(!layout.overflow.length,tag+': contenu débordant '+layout.overflow.join(','));
        ok(!layout.small.length,tag+': cibles trop petites '+layout.small.join(','));
      }
      if(width===390 || baseline) await shot(p,stage+'-'+tab+(dark?'-veillee':''));
      if(tab==='atelier') {
        if(!baseline) {
          const colors=await p.locator('.bench').evaluate(e=>({fg:getComputedStyle(e.querySelector('.heat')).color,bg:getComputedStyle(e).getPropertyValue('--work-top')}));
          ok(await contrast(p,colors.fg,colors.bg)>=4.5,tag+': contraste des instructions de l’établi');
        }
        await p.locator('[data-g="tailler"]').click();
        if(stage!=='debut') {
          await p.evaluate(()=>{const g=window.__eclat;g.E.state.inv.bois=Math.max(20,g.E.state.inv.bois||0);g.E.state.seen.bois=true;g.render(true);});
          await p.locator('#iq').fill('Bois');
          await p.locator('[data-inv="bois"]').click();
          ok(await p.locator('.slot.full').count()===1,tag+': poser une matière');
          if(width===320 && !baseline) {
            await p.locator('[data-inv="bois"]').scrollIntoViewIfNeeded();
            const mini=await p.locator('#mbench').evaluate(e=>({hidden:e.classList.contains('hidden'),top:e.getBoundingClientRect().top,head:document.getElementById('top').getBoundingClientRect().bottom}));
            ok(!mini.hidden && mini.top>=mini.head+5,tag+': petit établi sous l’en-tête réel');
          }
          if(width===390) await shot(p,stage+'-atelier-matiere'+(dark?'-veillee':''));
          if(!baseline) {
            const colors=await p.locator('#forge').evaluate(e=>({fg:getComputedStyle(e).color,bg:getComputedStyle(e).backgroundColor}));
            ok(await contrast(p,colors.fg,colors.bg)>=4.5,tag+': contraste de l’action principale');
          }
          await p.locator('[data-clear]').click();
          ok(await p.locator('.slot.full').count()===0,tag+': vider l’établi');
        }
      } else {
        if(!baseline && await p.locator('#clist .rec .rt').count()) {
          const colors=await p.locator('#clist .rec .rt').first().evaluate(e=>({fg:getComputedStyle(e).color,bg:getComputedStyle(e.closest('.rec')).backgroundColor}));
          ok(await contrast(p,colors.fg,colors.bg)>=4.5,tag+': contraste du nom de recette');
        }
        await p.locator('#cq').fill('zzzintrouvable');
        ok(await p.locator('#clist .rec').count()===0,tag+': recherche vide');
        await p.locator('#cq').fill('');
        await p.locator('[data-cf="unk"]').click();
        ok(await p.locator('[data-cf="unk"].on').count()===1,tag+': filtre à découvrir');
        if(width===390 || baseline) await shot(p,stage+'-indices'+(dark?'-veillee':''));
        await p.locator('[data-cf="tout"]').click();
      }
      await p.locator('#atlasToggle').click();
      ok(await p.locator('#atlasToggle').getAttribute('aria-pressed')==='false',tag+': retour Classique');
      await p.locator('#atlasToggle').click();
      ok(await p.locator('#atlasToggle').getAttribute('aria-pressed')==='true',tag+': retour Atlas');
      ok(!errors.length,tag+': erreurs '+errors.join(';'));
      console.log('✓ '+tag);
    }
    await ctx.close();
  }
  if(!baseline) {
    const ctx=await browser.newContext({viewport:{width:900,height:900},serviceWorkers:'block',reducedMotion:'reduce'});
    const p=await ctx.newPage();
    await p.addInitScript(raw=>{localStorage.setItem('eclat.save.v1',raw);localStorage.setItem('eclat.preview.style','atlas');},save('industrie',false));
    await p.goto('http://127.0.0.1:'+server.address().port);
    await p.waitForFunction(()=>!!window.__eclat);
    for(let i=0;i<8;i++){await p.waitForTimeout(100);await close(p);}
    await p.locator('#tabs [data-tab="carnet"]').click();
    for(const compact of [false,true]) for(const one of [false,true]) {
      const r=await p.evaluate(([compact,one])=>{
        const g=window.__eclat;
        Object.assign(g.E.state.settings,{compact,carnet1Col:one});
        const before=g.E.serialize();g.render(true);
        const list=document.querySelector('#clist .age-sec[open] > .list')||document.querySelector('#clist > .list.flat');
        return {display:getComputedStyle(list).display,cols:getComputedStyle(list).gridTemplateColumns,
          dense:document.getElementById('clist').classList.contains('carnet-dense'),stable:before===g.E.serialize()};
      },[compact,one]);
      ok(r.dense===compact,'Le réglage compact est conservé');
      ok(one?r.display==='flex':r.display==='grid'&&r.cols.split(' ').length===2,'Le choix une / deux colonnes reste respecté sur grand écran');
      ok(r.stable,'Le rendu ne modifie pas la sauvegarde');
    }
    await ctx.close();
  }
  console.log('✓ Design : '+checks+' contrôles.');
}
run().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.close();});
