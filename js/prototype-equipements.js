/* Interface d'essai autonome. Ne jamais utiliser la clé eclat.save.v1 ici. */
(function () {
  "use strict";
  const D = window.EclatEquipements.createData(window.ECLAT_DATA);
  const Engine = window.EclatEngine.withData(D), KEY = "eclat.prototype.equipements.v1";
  let E = Engine.createEngine(), eq = "mains", mode = "assembler", slots = [], signature = "", saveOK = true;
  const $ = s => document.querySelector(s), name = id => D.ITEMS[id]?.n || id;
  const text = (tag, value, cls) => { const e = document.createElement(tag); e.textContent = value; if (cls) e.className = cls; return e; };
  function button(label, fn, cls, disabled) { const e=text("button",label,cls);e.type="button";e.disabled=!!disabled;e.onclick=fn;return e; }
  function notice(value) { $("#notice").textContent=value; }
  function save() {
    if(!saveOK)return;
    try { localStorage.setItem(KEY,JSON.stringify({save:E.serialize(),eq,mode,slots})); }
    catch (_) { saveOK=false;notice("La partie d’essai ne peut pas être enregistrée sur cet appareil."); }
  }
  try {
    const stored=JSON.parse(localStorage.getItem(KEY)||"null");
    if(stored){E.load(stored.save);eq=stored.eq;mode=stored.mode;slots=Array.isArray(stored.slots)?stored.slots.filter(id=>D.ITEMS[id]).slice(0,3):[];}
  } catch (_) {saveOK=false;notice("La partie d’essai enregistrée est illisible. Elle reste conservée ; tu peux démarrer un nouvel essai.");}
  function reset(demo) {
    if(!confirm("Remplacer uniquement cette partie d’essai ?"))return;
    E=Engine.createEngine();eq="mains";mode="assembler";slots=[];saveOK=true;
    if(demo){
      const s=E.state;s.age=3;s.cycle=2;s.flags.extDone=true;s.flags.lineDone=true;s.introSeen=true;
      for(const z of ["plaine","riviere","collines"]){s.zones[z]=true;s.pass[z]={done:true,paid:{}};}
      for(const[id,it]of Object.entries(D.ITEMS))if(it.a<=3){if(it.r)E.learn(id,true);E.add(id,["res","comp"].includes(it.t)?100:1);if(it.r)s.made[id]=1;}
      E.recalc();
    }
    signature="";notice(demo?"Exemple au Cuivre chargé.":"Nouvelle partie d’essai.");draw(true);save();
  }
  $("#fresh").onclick=()=>reset(false);$("#demo").onclick=()=>reset(true);
  function select(id,nextMode) {
    const item=E.equipmentList().find(x=>x.id===id&&x.ready);if(!item)return;
    eq=id;mode=Object.hasOwn(item.modes,nextMode)?nextMode:Object.keys(item.modes)[0];
    draw(true);save();
  }
  function family(all) {
    const available=E.equipmentList(),current=available.find(x=>x.id===eq);
    const choices=available.filter(x=>x.ready&&(all||x.family===current.family));
    $("#dialog-title").textContent=all?"Tous les équipements":"Changer d’outil";
    $("#alternatives").replaceChildren(...choices.map(x=>{const b=button(x.n,()=>{select(x.id);$("#tool-dialog").close();},x.id===eq?"on":"");b.dataset.equipment=x.id;return b;}));
    $("#tool-dialog").showModal();
  }
  $("#family").onclick=()=>family(false);$("#all-tools").onclick=()=>family(true);$("#close-dialog").onclick=()=>$("#tool-dialog").close();
  let press=null;
  $("#current").onpointerdown=event=>{if(event.button===0)press=setTimeout(()=>{press=null;family();},550);};
  for(const event of ["pointerup","pointercancel","pointerleave"])$("#current").addEventListener(event,()=>{clearTimeout(press);press=null;});
  function prepare(id) {
    const choices=E.equipmentChoices(id),choice=choices.find(x=>x.ready);
    if(!choice){const b=E.equipmentCheck(id);notice(b?"Prépare d’abord : "+name(b.required)+".":"Cette recette est hors de la tranche d’essai.");return;}
    slots=Object.keys(D.ITEMS[id].r[1]);select(choice.equipment,choice.mode);notice("Prêt à essayer : "+name(id)+".");
  }
  $("#forge").onclick=()=>{
    const result=E.attemptWith(eq,mode,slots);
    if(result.kind==="equipment")notice(result.why==="missing"?"Cet équipement n’est plus disponible.":"Cet équipement et ce mode ne conviennent pas à cette combinaison.");
    else if(result.kind==="empty")notice("Pose des matières sur l’établi.");
    else if(result.kind==="craft")notice("Fabriqué : "+name(result.id)+".");
    else if(result.kind==="queued")notice("En cours : "+name(result.id)+".");
    else if(result.kind==="learn")notice("Recette trouvée : "+name(result.id)+(result.missing?". Il manque : "+Object.entries(result.missing).map(([k,n])=>n+" "+name(k)).join(", ")+".":". Tu peux la commander ci-dessous."));
    else if(result.kind==="owned")notice("Tu possèdes déjà cet objet.");
    else if(result.kind==="blocked")notice("Recette trouvée : "+name(result.id)+". Prépare d’abord "+name(E.blockStation(result.id,result.info))+".");
    else notice("Cette fabrication ne peut pas encore être lancée.");
    draw(true);save();
  };
  function draw(force) {
    const available=E.equipmentList(),ready=available.filter(x=>x.ready);
    if(!ready.some(x=>x.id===eq)){eq="mains";mode="assembler";}
    const selected=ready.find(x=>x.id===eq);if(!Object.hasOwn(selected.modes,mode))mode=Object.keys(selected.modes)[0];
    const s=E.state,info=E.handInfo();
    const structural=[eq,mode,slots.join(),s.age,Object.keys(s.seen).join(),Object.keys(s.known).join(),ready.map(x=>x.id).join(),info.jobs.map(j=>j.id).join(),JSON.stringify(s.zones),JSON.stringify(s.pass),s.exp.active?.z,s.exp.done&&JSON.stringify(s.exp.done)].join("|");
    if(force||structural!==signature){
      signature=structural;
      const goal=E.guide(),id=goal?.step;
      const hint=id&&id!==goal?.ob?.id?D.ITEMS[id].h:null;
      const end=id&&D.ITEMS[id].a>3;
      $("#goal").replaceChildren(text("b",end?"Atelier au Cuivre":id?name(id):D.AGES[s.age].n),text("p",end?"Le prototype s’arrête au Cuivre. Tu peux explorer les recettes et les équipements de ces quatre âges.":hint||goal?.ob?.txt||"Explore les possibilités de ton atelier."));
      const quick=[selected,...ready.filter(x=>x.id!==eq)].slice(0,2);
      $("#tools").replaceChildren(...quick.map(x=>{const b=button(x.n,()=>select(x.id),x.id===eq?"on":"");b.dataset.equipment=x.id;b.setAttribute("aria-pressed",String(x.id===eq));return b;}));
      $("#current").textContent=selected.n;
      $("#modes").replaceChildren(...Object.entries(selected.modes).map(([id,n])=>{const b=button(n,()=>select(eq,id),id===mode?"on":"");b.dataset.mode=id;b.setAttribute("aria-pressed",String(id===mode));return b;}));
      $("#slots").replaceChildren(...[0,1,2].map(i=>{const b=button(slots[i]?name(slots[i]):"+",()=>{slots.splice(i,1);draw(true);save();});b.setAttribute("aria-label",slots[i]?"Retirer : "+name(slots[i]):"Emplacement libre");return b;}));
      $("#forge").textContent=selected.modes[mode];
      const raw=[...new Set(D.ZONES.filter(z=>E.zoneOpen(z.id)).flatMap(z=>z.res))];
      const items=Object.keys(D.ITEMS).filter(id=>raw.includes(id)||s.seen[id]||E.count(id)>0);
      $("#inventory").replaceChildren(...items.map(id=>{
        const box=text("div","","resource"),b=button(name(id),()=>{if(!slots.includes(id)&&slots.length<3){slots.push(id);draw(true);save();}},"wide",E.count(id)<1||slots.includes(id));b.dataset.item=id;
        const count=text("b","0");count.dataset.count=id;b.append(count);box.append(b);
        if(raw.includes(id))box.append(button(s.act?.res===id?"Arrêter":"Récolter",()=>{if(E.state.act?.res===id)E.stopAct();else E.startAct({k:"harv",z:E.RES_ZONE[id],res:id});draw(true);save();}));
        if(D.ITEMS[id].t==="ext"&&E.count(id)>0)box.append(button("Installer",()=>{notice(E.domAutoExt(id)?"Exploitation installée.":"Aucun emplacement disponible.");draw(true);save();}));
        return box;
      }));
      const known=Object.keys(s.known).filter(id=>D.ITEMS[id]?.r&&D.ITEMS[id].a<=3);
      $("#recipes").replaceChildren(...known.map(id=>{const row=text("div","","row");row.append(button(name(id),()=>prepare(id)),button("Commander",()=>{const r=E.order(id,1);notice(r.ok?"Commande lancée : "+name(id)+".":"Prépare d’abord les équipements ou les recettes intermédiaires.");draw(true);save();}));return row;}));
      if(!known.length)$("#recipes").append(text("p","Tes découvertes apparaîtront ici.","muted"));
      const world=[];
      for(const z of D.ZONES.filter(z=>E.zoneOpen(z.id))){const next=E.nextExp(z.id);if(next){const b=button("Explorer · "+next.x.n,()=>{const r=E.startExp(z.id);notice(r.ok?"Exploration lancée.":"Cette exploration attend encore des préparatifs.");draw(true);save();},"",!!s.exp.active);world.push(b);}}
      for(const z of E.passPending()){const p=E.passInfo(z),box=text("div",p.P.n+" · "+Object.entries(p.left).map(([id,n])=>Math.ceil(n)+" "+name(id)).join(", "));box.append(button("Déposer",()=>{const r=E.passPour(z);notice(r.done?"Nouvelle terre ouverte.":r.why==="lieux"?"Explore d’abord les lieux de la terre précédente.":"Ressources déposées.");draw(true);save();}));world.push(box);}
      $("#world").replaceChildren(...world);
    }
    document.querySelectorAll("[data-count]").forEach(e=>{e.textContent=Math.floor(E.count(e.dataset.count)).toLocaleString("fr-FR");e.parentElement.disabled=E.count(e.dataset.count)<1||slots.includes(e.dataset.count);});
    $("#job-card").hidden=!info.jobs.length;
    $("#jobs").replaceChildren(...info.jobs.map((j,i)=>{const box=text("div",name(j.id)+" · "+(j.wait?"En attente":"En cours"),"job"),p=document.createElement("progress");p.max=1;p.value=j.frac;p.setAttribute("aria-label","Avancement de "+name(j.id));box.append(p,button("Annuler",()=>{E.cancelJob(i);draw(true);save();}));return box;}));
  }
  draw(true);setInterval(()=>{E.update();draw(false);},250);setInterval(save,5000);
  window.addEventListener("pagehide",save);
  // Exposé uniquement pour les vérifications du prototype, jamais dans la page normale.
  window.__eclatEquipmentPrototype={get E(){return E;},D,prepare,draw:()=>draw(true)};
})();
