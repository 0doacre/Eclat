/* Observe deux pages et une erreur de quota dans un profil Chrome jetable.
 * Audit en lecture seule des règles du jeu ; résultats JSON sur stdout. */
const http=require('http'),fs=require('fs'),path=require('path'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),D=require(path.join(root,'js/data.js')),{createEngine}=require(path.join(root,'js/engine.js'));
const E=createEngine(),s=E.state;s.t=Date.now();s.introSeen=true;s.cycle=2;s.flags.ver=D.VERSION;
Object.assign(s.settings,{tuto:false,sound:false,visiteurs:false});E.add('bois',100);const seed=E.serialize();
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{const f=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(f,(e,b)=>{if(e){res.writeHead(404).end();return;}res.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream');res.end(b);});});
(async()=>{
 let browser;try{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));browser=await chromium.launch({executablePath:process.env.CHROMIUM});
  const ctx=await browser.newContext({serviceWorkers:'block',reducedMotion:'reduce'});
  await ctx.addInitScript(raw=>{if(!localStorage.getItem('eclat.save.v1'))localStorage.setItem('eclat.save.v1',raw);const old=setInterval;window.setInterval=(f,n,...args)=>n===10000?0:old(f,n,...args);},seed);
  const url='http://127.0.0.1:'+server.address().port;
  const a=await ctx.newPage();await a.goto(url);await a.waitForFunction(()=>!!window.__eclat);
  const b=await ctx.newPage();await b.goto(url);await b.waitForFunction(()=>!!window.__eclat);
  const initial=await a.evaluate(()=>window.__eclat.E.count('bois'));
  const writtenB=await b.evaluate(()=>{window.__eclat.E.add('bois',32);window.__eclat.save();return JSON.parse(localStorage.getItem('eclat.save.v1')).inv.bois;});
  await a.waitForTimeout(250);
  const staleA=await a.evaluate(()=>window.__eclat.E.count('bois'));
  const afterA=await a.evaluate(()=>{window.__eclat.save();return JSON.parse(localStorage.getItem('eclat.save.v1')).inv.bois;});
  const quota=await b.evaluate(()=>{const before=localStorage.getItem('eclat.save.v1');window.__eclat.E.add('bois',17);let failures=0;const old=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='eclat.save.v1'){failures++;throw new DOMException('quota test','QuotaExceededError');}return old.call(this,k,v);};let escaped=false;try{window.__eclat.save();}catch(e){escaped=true;}const after=localStorage.getItem('eclat.save.v1');Storage.prototype.setItem=old;return {failures,escaped,unchanged:before===after,live:window.__eclat.E.count('bois'),stored:JSON.parse(after).inv.bois};});
  const result={twoTabs:{initial,writtenB,staleA,afterA},quota};
  console.log(JSON.stringify(result,null,2));
 }finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
