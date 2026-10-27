/* Atelier visible : postes, outils, gestes explicites et séparation des parties. */
"use strict";
const fs=require("fs"),path=require("path"),http=require("http"),assert=require("assert/strict");
const {chromium}=require(process.env.PW||"playwright");
const ROOT=path.resolve(__dirname,".."),normal=require("../js/engine").createEngine().serialize();
const server=http.createServer((req,res)=>{
  const file=path.resolve(ROOT,"."+new URL(req.url,"http://localhost").pathname);
  if(!file.startsWith(ROOT+path.sep))return res.writeHead(403).end();
  fs.readFile(file,(err,bytes)=>{if(err)return res.writeHead(404).end();res.setHeader("Content-Type",({".html":"text/html",".js":"text/javascript",".css":"text/css",".woff2":"font/woff2"})[path.extname(file)]||"application/octet-stream");res.end(bytes);});
});
let browser,checks=0;
const ok=(value,msg)=>{assert.ok(value,msg);checks++;};
async function geometry(p,tag){
  const bad=await p.evaluate(()=>[...document.querySelectorAll("main button")].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&(r.width<43.9||r.height<43.9||r.left<-.5||r.right>innerWidth+.5);}).map(e=>e.textContent));
  ok(!bad.length,tag+" : cibles et débordements "+bad.join(","));
  ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),tag+" : largeur de page");
}
async function run(){
  await new Promise(r=>server.listen(0,"127.0.0.1",r));browser=await chromium.launch(process.env.CHROMIUM?{executablePath:process.env.CHROMIUM}:{});
  for(const width of [320,360,390,980]){
    const ctx=await browser.newContext({viewport:{width,height:900},serviceWorkers:"block",reducedMotion:"reduce",hasTouch:true}),p=await ctx.newPage(),errors=[];
    p.on("pageerror",e=>errors.push(e.message));p.on("dialog",d=>d.accept());
    await p.addInitScript(raw=>localStorage.setItem("eclat.save.v1",raw),normal);
    await p.goto("http://127.0.0.1:"+server.address().port+"/prototype-equipements.html");await p.waitForFunction(()=>!!window.__eclatEquipmentPrototype);
    await geometry(p,width+"/départ");
    ok(await p.locator('[data-workplace="etabli"]').isVisible(),width+" : atelier visible dès le départ");
    ok(await p.locator('[data-equipment="mains"]').isVisible(),width+" : mains visibles");
    ok(await p.locator('[data-equipment="percuteur_pierre"]').isVisible(),width+" : percuteur visible");
    ok(await p.locator('[data-item="percuteur_pierre"]').count()===0,width+" : outil séparé des matières");
    ok(await p.locator("#forge").textContent()==="Assembler",width+" : geste explicite au départ");
    ok(await p.locator('[data-mode="tresser"]').isVisible(),width+" : second geste des mains accessible");
    await p.evaluate(()=>{const g=window.__eclatEquipmentPrototype;g.E.add("bois",3);g.draw();});
    await p.locator('[data-item="bois"]').click();
    const snapshot=await p.evaluate(()=>{const s=window.__eclatEquipmentPrototype.E.state;return JSON.stringify([s.inv,s.known,s.hand.q]);});
    await p.locator("#forge").click();
    ok(await p.evaluate(()=>{const s=window.__eclatEquipmentPrototype.E.state;return JSON.stringify([s.inv,s.known,s.hand.q]);})===snapshot,width+" : pas de résolution automatique après un mauvais geste");
    ok(await p.locator('[data-equipment="mains"]').getAttribute("aria-pressed")==="true",width+" : outil choisi conservé");
    await p.locator('[data-equipment="percuteur_pierre"]').click();
    ok(await p.locator("#forge").textContent()==="Tailler",width+" : outil change le geste");
    await p.locator("#forge").click();
    ok(await p.evaluate(()=>window.__eclatEquipmentPrototype.E.count("manche"))===1,width+" : premier manche au percuteur");
    await p.evaluate(()=>{const g=window.__eclatEquipmentPrototype;g.E.add("feu",1);g.E.state.made.feu=1;g.E.learn("feu",true);g.E.add("manche",2);g.E.recalc();g.draw();});
    await p.locator('[aria-label="Retirer : Bois"]').click();await p.locator('[data-item="manche"]').click();
    await p.locator('[data-workplace="feu"]').click();
    ok(await p.locator('[data-equipment="percuteur_pierre"]').count()===0,width+" : outils propres à chaque atelier");
    ok(await p.locator("#forge").textContent()==="Chauffer doucement",width+" : geste du foyer explicite");
    await p.locator("#forge").click();
    ok(await p.evaluate(()=>window.__eclatEquipmentPrototype.E.count("epieu"))===1,width+" : épieu au foyer");
    await p.locator("#demo").click();
    ok(await p.locator('[data-workplace]').count()===5,width+" : postes construits accessibles");
    const tools=await p.locator("#tools").textContent();
    await p.locator('[data-item="os"]').click();
    ok(await p.locator("#tools").textContent()===tools,width+" : matières ne filtrent pas les outils");
    await p.locator('[data-equipment="couteau"]').click();
    ok(await p.locator('[data-mode="couper"]').isVisible()&&await p.locator('[data-mode="entailler"]').isVisible(),width+" : deux gestes du couteau visibles avant essai");
    await p.locator('[data-equipment="racloir_os"]').click();
    ok(await p.locator("#forge").textContent()==="Couper",width+" : changement direct de l’outil");
    await p.evaluate(()=>window.__eclatEquipmentPrototype.prepare("epieu"));
    const sticks=await p.evaluate(()=>window.__eclatEquipmentPrototype.E.count("manche"));
    await p.locator('[data-mode="vif"]').click();
    ok((await p.locator("#notice").textContent()).includes("ne donnent rien"),width+" : geste incompatible expliqué");
    ok(await p.evaluate(()=>window.__eclatEquipmentPrototype.E.count("manche"))===sticks,width+" : erreur sans perte de matière");
    const bricks=await p.evaluate(()=>window.__eclatEquipmentPrototype.E.count("brique"));await p.evaluate(()=>window.__eclatEquipmentPrototype.prepare("brique"));
    ok(await p.locator("#forge").textContent()==="Cuire",width+" : recette préparée garde un verbe d’action");
    await p.locator("#forge").click();await p.waitForFunction(n=>window.__eclatEquipmentPrototype.E.count("brique")>n,bricks);checks++;
    await p.evaluate(()=>{const g=window.__eclatEquipmentPrototype;g.E.state.made.flute=0;g.E.state.inv.flute=0;g.prepare("flute");});
    ok(await p.locator('[data-equipment="aiguille"]').getAttribute("aria-pressed")==="true",width+" : recette connue prépare l’outil");
    ok(await p.locator("#forge").textContent()==="Percer",width+" : geste de la flûte");
    const needles=await p.evaluate(()=>window.__eclatEquipmentPrototype.E.count("aiguille"));await p.locator("#forge").click();
    await p.waitForFunction(()=>window.__eclatEquipmentPrototype.E.count("flute")===1);checks++;
    ok(await p.evaluate(()=>window.__eclatEquipmentPrototype.E.count("aiguille"))===needles,width+" : outil conservé");
    const rack=await p.locator(".tool-rack").boundingBox(),slots=await p.locator("#slots").boundingBox();
    ok(width>600?rack.x>slots.x+slots.width:rack.y>=slots.y+slots.height,width+" : outils à droite sur bureau et sous les matières sur mobile");
    await geometry(p,width+"/Cuivre");
    if(process.env.EQUIPMENT_SHOTS&&(width===390||width===980)){fs.mkdirSync(process.env.EQUIPMENT_SHOTS,{recursive:true});await p.evaluate(()=>{document.activeElement?.blur();window.scrollTo(0,0);});await p.screenshot({path:path.join(process.env.EQUIPMENT_SHOTS,"atelier-"+width+".png")});}
    ok(await p.evaluate(raw=>localStorage.getItem("eclat.save.v1")===raw,normal),width+" : partie habituelle intacte");
    await p.evaluate(()=>window.dispatchEvent(new Event("pagehide")));await p.reload();await p.waitForFunction(()=>!!window.__eclatEquipmentPrototype);
    ok(await p.evaluate(()=>window.__eclatEquipmentPrototype.E.count("flute"))===1,width+" : partie d’essai rechargée");
    await p.goto("http://127.0.0.1:"+server.address().port+"/index.html");await p.waitForFunction(()=>!!window.__eclat);
    ok(await p.evaluate(()=>window.__eclat.E.SAVE_VERSION===12&&window.__eclat.E.equipmentChoices===undefined&&Object.keys(window.__eclat.E.D.ITEMS).length===267),width+" : jeu habituel distinct et fonctionnel");
    ok(!errors.length,width+" : erreurs "+errors.join(";"));console.log("✓ "+width);await ctx.close();
  }
  console.log("✓ Prototype équipements : "+checks+" contrôles navigateur.");
}
run().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.close();});
