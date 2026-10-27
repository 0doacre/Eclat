/* Interface autonome : sélection, appui long, recettes et séparation des parties. */
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
    ok(await p.locator("#equipment-details").isHidden(),width+" : aucun réglage au départ");
    ok(await p.locator("#workplaces").isHidden(),width+" : aucun choix de lieu prématuré");
    ok(await p.locator('[data-item="percuteur_pierre"]').count()===0,width+" : outil séparé des matières");
    ok(await p.evaluate(()=>window.__eclatEquipmentPrototype.E.count("percuteur_pierre"))===1,width+" : outil de départ disponible");
    await p.evaluate(()=>{const g=window.__eclatEquipmentPrototype;g.E.add("bois",3);g.draw();});
    await p.locator('[data-item="bois"]').click();await p.locator("#forge").click();
    ok(await p.evaluate(()=>window.__eclatEquipmentPrototype.E.count("manche"))===1,width+" : premier manche sans choisir un outil");
    ok(!(await p.locator("#equipment-details").evaluate(e=>e.open)),width+" : détails fermés après la première fabrication");
    await p.evaluate(()=>{const g=window.__eclatEquipmentPrototype;g.E.add("feu",1);g.E.state.made.feu=1;g.E.learn("feu",true);g.E.add("manche",2);g.E.recalc();g.draw();});
    ok(await p.locator('[data-workplace]').count()===2,width+" : établi et feu révélés ensemble");
    await p.locator('[aria-label="Retirer : Bois"]').click();await p.locator('[data-item="manche"]').click();await p.locator('[data-workplace="feu"]').click();await p.locator("#forge").click();
    ok(await p.evaluate(()=>window.__eclatEquipmentPrototype.E.count("epieu"))===1,width+" : épieu sans choisir la température");
    await p.locator("#demo").click();
    ok(await p.locator('[data-workplace]').count()===3,width+" : four débloqué au Cuivre");
    await p.locator('[data-item="os"]').click();await p.locator("#forge").click();
    ok(await p.locator("#choices button").count()===2,width+" : choix proposé seulement quand il est utile");
    ok(!(await p.locator("#choices").textContent()).includes("Flûte"),width+" : résultat inconnu non révélé");
    const os=await p.evaluate(()=>window.__eclatEquipmentPrototype.E.count("os"));
    await p.locator("#choices button").filter({hasText:"Percer"}).click();
    ok(await p.evaluate(()=>window.__eclatEquipmentPrototype.E.count("os"))<=os,width+" : choix de percer accepté");
    await p.locator("#equipment-details summary").click();
    await p.locator("#all-tools").click();await p.locator('#alternatives [data-equipment="couteau"]').click();await p.locator("#family").click();
    ok(await p.locator("#tool-dialog").evaluate(e=>e.open),width+" : accès visible aux variantes");
    ok(await p.locator("#alternatives button").count()===2,width+" : outils de la même famille");
    await p.locator("#alternatives button").filter({hasText:"Racloir en os"}).click();
    ok(await p.locator("#current").textContent()==="Racloir en os",width+" : remplacement de l’outil");
    await p.locator("#current").scrollIntoViewIfNeeded();await p.locator("#current").dispatchEvent("pointerdown",{button:0});await p.waitForTimeout(600);await p.locator("#current").dispatchEvent("pointerup");
    ok(await p.locator("#tool-dialog").evaluate(e=>e.open),width+" : appui long équivalent");await p.locator("#close-dialog").click();
    await p.evaluate(()=>window.__eclatEquipmentPrototype.prepare("epieu"));await p.locator('[data-mode="vif"]').click();
    const sticks=await p.evaluate(()=>window.__eclatEquipmentPrototype.E.count("manche"));await p.locator("#forge").click();
    ok((await p.locator("#notice").textContent()).includes("ne donnent rien"),width+" : erreur de mode compréhensible");
    ok(await p.evaluate(()=>window.__eclatEquipmentPrototype.E.count("manche"))===sticks,width+" : erreur sans perte de matière");
    const bricks=await p.evaluate(()=>window.__eclatEquipmentPrototype.E.count("brique"));await p.evaluate(()=>window.__eclatEquipmentPrototype.prepare("brique"));await p.locator("#forge").click();
    await p.waitForFunction(n=>window.__eclatEquipmentPrototype.E.count("brique")>n,bricks);checks++;
    await p.evaluate(()=>{const g=window.__eclatEquipmentPrototype;g.E.state.made.flute=0;g.E.state.inv.flute=0;g.prepare("flute");});
    ok((await p.locator("#forge").textContent()).includes("Fabriquer"),width+" : recette connue préparée automatiquement");
    const needles=await p.evaluate(()=>window.__eclatEquipmentPrototype.E.count("aiguille"));await p.locator("#forge").click();
    await p.waitForFunction(()=>window.__eclatEquipmentPrototype.E.count("flute")===1);checks++;
    ok(await p.evaluate(()=>window.__eclatEquipmentPrototype.E.count("aiguille"))===needles,width+" : outil conservé");
    await geometry(p,width+"/Cuivre");
    if(process.env.EQUIPMENT_SHOTS&&width===390){fs.mkdirSync(process.env.EQUIPMENT_SHOTS,{recursive:true});await p.evaluate(()=>{document.activeElement?.blur();window.scrollTo(0,0);});await p.screenshot({path:path.join(process.env.EQUIPMENT_SHOTS,"cuivre-390.png")});}
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
