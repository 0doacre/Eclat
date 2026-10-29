/* L’atelier par postes dans le jeu : même moteur, stock, terres et Carnet. */
(function(){
  "use strict";
  function create(api){
    const {E,D,U,A,esc,icon,render,save,toast,fmtTime}=api,I=D.ITEMS;
    let signature="",message="",lastSale=null,observedState=null;
    const money=n=>n.toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:2})+" écus";
    const name=id=>I[id]?.n||id;
    const label=(id,n)=>({doux:"Chauffer doucement",vif:"Cuire",etouffee:"Carboniser",cuisson:"Cuire",fonte:"Fondre"})[id]||n;
    const root=()=>document.getElementById("atelier-equipe");
    const button=(action,value,title,cls="",disabled=false)=>{
      const help={study:"Étudier les matières déjà vues en dépensant l’Intuition indiquée",place:"Choisir ce poste de travail",legacy:"Utiliser les procédés des âges après le Cuivre",slot:"Poser ou retirer une matière dans cet emplacement",prepare:"Préparer les matières, le poste et l’outil pour : "+name(value),order:"Fabriquer : "+name(value)+", en préparant les composants manquants",build:"Aménager l’établi pour accueillir un ouvrier",hire:"Recruter un ouvrier avec les écus de ta bourse",fund:"Réserver un écu pour payer le travail de l’ouvrier",fund5:"Réserver cinq écus pour payer le travail de l’ouvrier",worker:"Démarrer ou mettre en pause le travail de l’ouvrier",withdraw:"Récupérer l’avance non utilisée quand l’ouvrier est en pause",sell:"Vendre les lanières au-delà de ta réserve et recevoir le montant après taxe"};
      const explanation=help[action]||title.replace(/<[^>]*>/g,"");
      return '<button type="button" id="ae-'+action+'-'+esc(value||"0")+'" class="btn '+cls+'" data-ae="'+action+'" data-value="'+esc(value||"")+'" title="'+esc(explanation)+'"'+(disabled?' disabled':'')+'>'+title+'</button>';
    };
    const consumed=new Set(Object.values(I).filter(x=>x.r).flatMap(x=>Object.keys(x.r[1])));
    function grandAtelierTools(){
      return (D.GESTE_ORDER||Object.keys(D.GESTES)).filter(g=>E.gesteOK(g)).map(g=>({
        id:"ga_"+g,
        n:D.GESTES[g].n,
        geste:g,
        ready:true,
        modes:{[g]:D.GESTES[g].n}
      }));
    }
    function work(){
      const s=E.state,f=s.flags;
      if(observedState!==s){signature="";message="";lastSale=null;messageSale="";observedState=s;}
      if(!f.equipmentBench||typeof f.equipmentBench!=="object")f.equipmentBench={place:"etabli",eq:"percuteur_pierre",mode:"tailler",slots:[]};
      const w=f.equipmentBench;
      w.slots=[...new Set((Array.isArray(w.slots)?w.slots:[]).filter(id=>I[id]))].slice(0,3);
      const places=E.workplaceList().filter(x=>x.ready);
      if(s.age>=3)places.push({id:"grand_atelier",n:"Grand Atelier (Âges 4+)",ready:true});
      if(!places.some(x=>x.id===w.place))w.place="etabli";
      const tools=w.place==="grand_atelier"?grandAtelierTools():E.equipmentList().filter(x=>x.ready&&E.workplaceFor(x.id)===w.place);
      if(!tools.some(x=>x.id===w.eq)){w.eq=tools[0].id;w.prepared=null;}
      const tool=tools.find(x=>x.id===w.eq);
      if(!Object.hasOwn(tool.modes,w.mode))w.mode=Object.keys(tool.modes)[0];
      if(!s.known[w.prepared])w.prepared=null;
      U.slots=[0,1,2].map(i=>w.slots[i]||null);
      if(w.place==="grand_atelier"){
        U.geste=w.mode;
        const parts=[...w.slots].sort().join(",");
        const recipe=Object.keys(I).find(id=>I[id].r&&I[id].a>=4&&I[id].r[0]===w.mode&&Object.keys(I[id].r[1]).sort().join(",")===parts)||null;
        return {w,places,tools,tool,recipe};
      }
      const recipe=E.equipmentRecipe(w.eq,w.mode,w.slots);
      const reference=recipe||Object.keys(D.CRAFT_EQUIPMENT.recipes).find(id=>D.CRAFT_EQUIPMENT.recipes[id].some(c=>c.equipment===w.eq&&c.mode===w.mode));
      U.geste=reference?I[reference].r[0]:"assembler";
      return {w,places,tools,tool,recipe};
    }
    function body(){
      const {w,places,tools,tool,recipe}=work(),s=E.state,e=E.atelierEconomyInfo();
      const raw=[...new Set(D.ZONES.filter(z=>E.zoneOpen(z.id)).flatMap(z=>z.res))];
      const ids=Object.keys(I).filter(id=>(raw.includes(id)||s.seen[id]||E.count(id)>0)&&(!E.isEquipmentItem(id)||consumed.has(id)));
      const known=Object.keys(s.known).filter(id=>(w.place==="grand_atelier"?(I[id]?.r&&I[id].a>=4):D.CRAFT_EQUIPMENT.recipes[id]?.some(c=>E.workplaceFor(c.equipment)===w.place))&&(!E.isUnique(I[id])||!(s.made[id]>0)));
      let h='';
      const releve=E.shouldSuggestReleve&&E.shouldSuggestReleve();
      if(releve)h+='<section class="card releve-alerte"><b>✦ Passer le relais · +'+releve.gain+' Traces</b><p class="small">'+esc(releve.texte)+'</p><button class="btn pri small" data-releve title="Voir les gains et les bonus permanents de la prochaine relève">Préparer la relève</button></section>';
      if(places.length>1)h+='<nav class="ae-posts" aria-label="Postes de travail">'+places.map(p=>button("place",p.id,esc(p.n),p.id===w.place?"pri":"")).join("")+'</nav>';
      if(s.age>=3)h+='<p class="small">'+button("legacy","1","Procédés après le Cuivre","ghost")+'</p>';
      h+='<div class="ae-layout"><section class="card ae-bench"><h2>'+esc(places.find(x=>x.id===w.place).n)+'</h2><div class="ae-work"><div><div class="ae-slots">';
      for(let i=0;i<3;i++){const id=w.slots[i],need=w.prepared?I[w.prepared]?.r?.[1][id]:0;
        h+=button("slot",String(i),id?icon(id)+'<span>'+esc(name(id))+'</span><small data-ae-need="'+esc(id)+'" data-need="'+(need||0)+'"></small>':'+',id?"ae-filled":"ae-empty",!id);
      }
      h+='</div>'+(w.prepared?'<p class="ae-prepared">'+esc(name(w.prepared))+'</p>':'')+'<div class="ae-actions">';
      h+=Object.entries(tool.modes).map(([id,n])=>button("forge",id,esc(label(id,n)),id===w.mode?"pri":"",!w.slots.length)).join("");
      if(recipe&&s.known[recipe]&&(tool.batch||1)>1&&!E.isUnique(I[recipe]))h+=button("batch",recipe,esc(label(w.mode,tool.modes[w.mode]))+' ×'+tool.batch+' · '+fmtTime(E.batchTime(recipe,tool.batch,{equipment:w.eq,mode:w.mode})),"",false);
      const toolBenefitText = (t) => {
        if (t.speed) {
          for (const rec in t.speed) {
            if (s.known[rec]) {
              const choices = (typeof E.equipmentChoices === "function" && E.equipmentChoices(rec)) || [];
              const otherChoice = choices.find(c => c.equipment !== t.id && c.ready) || choices.find(c => c.equipment !== t.id);
              if (otherChoice) {
                const curT = E.handTime(rec, otherChoice);
                const projT = E.handTime(rec, { equipment: t.id, mode: Object.keys(t.modes)[0] });
                return label(Object.keys(t.modes)[0], t.modes[Object.keys(t.modes)[0]]) + " ces " + esc(name(rec).toLowerCase()) + " : " + fmtTime(curT) + " → " + fmtTime(projT);
              }
            }
          }
        }
        return t.benefit ? esc(t.benefit) : "";
      };
      h+='</div><p id="ae-result" role="status">'+esc(message)+'</p></div><aside class="ae-tools"><h3>Tes outils <button type="button" class="btn-aide mini" data-aide="outils" title="Comprendre les outils et postes" aria-label="Comprendre les outils et postes">?</button></h3>'+tools.map(t=>{const ben=toolBenefitText(t);return button("tool",t.id,(t.geste?api.gIc(t.geste):t.id==="mains"?api.gIc("assembler"):icon(({percuteur_pierre:"caillou",racloir_os:"os",polissoir:"caillou"})[t.id]||t.item,"sm"))+' '+esc(t.n)+'<small>'+esc(Object.entries(t.modes).map(([m,n])=>label(m,n)).join(" · "))+(ben?' · '+ben:"")+'</small>',t.id===w.eq?"pri":"");}).join("")+'</aside></div></section>';
      h+='<section class="card ae-stock"><h3>Tes matières</h3><input id="ae-search" type="search" aria-label="Chercher une matière" placeholder="Chercher une matière…" value="'+esc(U.equipmentSearch||"")+'">';
      h+='<div class="ae-discovery"><label><input id="ae-discovery-only" type="checkbox"'+(s.settings.equipmentDiscoveryOnly===true?' checked':'')+' title="Montrer uniquement les matières étudiées qui cachent une recette avec cet outil et ce geste"> À découvrir</label>';
      if(Object.keys(tool.modes).length>1)h+='<label class="ae-discovery-mode">Geste <select id="ae-discovery-mode" aria-label="Geste à explorer" title="Choisir le geste du filtre sans lancer de fabrication">'+Object.entries(tool.modes).map(([mode,n])=>'<option value="'+esc(mode)+'"'+(mode===w.mode?' selected':'')+'>'+esc(label(mode,n))+'</option>').join('')+'</select></label>';
      else h+='<span class="small">'+esc(label(w.mode,tool.modes[w.mode]))+'</span>';
      const study=E.studyAllCost();
      if(study.n)h+=button("study","","Étudier les matières · ✨"+api.fmt(study.c),"small ghost",s.intu<study.c)+'<button type="button" class="btn-aide mini" data-aide="etude" title="Comprendre l’étude des matières" aria-label="Comprendre l’étude des matières">?</button>';
      h+='</div><p id="ae-discovery-empty" class="small muted" hidden></p><div class="ae-inventory">';
      for(const id of ids){const picked=w.slots.includes(id);h+='<div class="ae-resource" data-ae-resource="'+esc(id)+'" data-name="'+esc(name(id).toLowerCase())+'">'+button("item",id,icon(id,"sm")+'<span class="ae-item-name">'+esc(name(id))+'</span><b data-ae-count="'+esc(id)+'"></b>',picked?"ae-selected":"",!picked&&E.count(id)<1)+'</div>';
      }
      h+='</div></section></div>';
      h+='<div class="ae-mini" hidden aria-label="Établi compact"><span class="ae-mini-tool">'+esc(tool.n)+'</span>'+[0,1,2].map(i=>'<button type="button" id="ae-mini-slot-'+i+'" class="btn" data-ae="slot" data-value="'+i+'" aria-label="'+esc(w.slots[i]?'Retirer '+name(w.slots[i]):'Emplacement libre')+'"'+(w.slots[i]?'':' disabled')+'>'+(w.slots[i]?icon(w.slots[i],"sm"):'+')+'</button>').join('')+'<button type="button" id="ae-mini-forge" class="btn pri" data-ae="forge" data-value="'+esc(w.mode)+'">'+esc(label(w.mode,tool.modes[w.mode]))+'</button></div>';
      if(known.length)h+='<section class="card"><h3>Recettes</h3><div class="ae-known">'+known.map(id=>'<div>'+button("prepare",id,esc(name(id)))+button("order",id,"Fabriquer","small")+'</div>').join("")+'</div></section>';
      if(s.known.laniere){h+='<section class="card ae-economy"><details class="ae-eco-details" open><summary class="ae-eco-summary" title="Afficher ou replier la bourse, l’ouvrier et les surplus de lanières"><h2>Faire vivre l’atelier</h2><span class="small muted">Bourse, ouvrier &amp; surplus de lanières</span></summary><div class="ae-economy-grid"><section><h3>Ta bourse</h3><strong id="ae-wallet"></strong><p id="ae-sale" role="status"></p><p id="ae-hire-goal" class="small"></p></section><section><h3>Ton ouvrier <button type="button" class="btn-aide mini" data-aide="ouvrier" title="Comprendre le rôle et les salaires de l’ouvrier" aria-label="Comprendre le rôle et les salaires de l’ouvrier">?</button></h3>';
        if(E.count("etabli_amenage")<1)h+=button("build","","Aménager : 10 bois, 3 cordes, 4 pierres");
        h+='<p id="ae-worker-status"></p><progress id="ae-worker-progress" max="1" value="0" aria-label="Fabrication de l’ouvrier"></progress><p id="ae-worker-pay" class="small"></p>';
        h+=e.hired?button("fund","","Avancer 1 écu")+button("fund5","","Avancer 5 écus")+button("worker","",e.working?"Mettre en pause":"Mettre au travail")+button("withdraw","","Récupérer l’avance","",e.working||e.budget<=0)+'<label class="small"><input id="ae-autofund" type="checkbox"'+(e.autoFund?' checked':'')+' title="Prélever automatiquement 1 écu dans ta bourse quand l’avance de l’ouvrier est épuisée"> Réapprovisionner l’avance</label>':button("hire","","Embaucher · "+money(e.hire));
        h+='</section><section><h3>Le marchand de surplus</h3><label><input id="ae-merchant" type="checkbox"'+(e.merchant?' checked':'')+'> Vente automatique</label><label>Garder <input id="ae-reserve" type="number" min="0" max="100000" value="'+e.reserve+'"> lanières</label><progress id="ae-merchant-progress" max="5" value="0" aria-label="Passage du marchand"></progress><p id="ae-quote"></p>'+button("sell","","Vendre le surplus maintenant")+'<details><summary>Taxes et bilan</summary><p id="ae-tax" class="small"></p></details></section></div></details></section>';
      }
      return h;
    }
    function sig(){const {w}=work(),s=E.state,e=E.atelierEconomyInfo(),rel=E.shouldSuggestReleve&&E.shouldSuggestReleve();return JSON.stringify([w,U.equipmentSearch,Object.keys(s.seen),Object.keys(s.known),Object.keys(s.studied),s.settings.equipmentDiscoveryOnly===true,s.intu>=E.studyAllCost().c,E.equipmentList().map(x=>x.ready),E.count("etabli_amenage")>=1,s.age,s.act?.res,e.hired,e.working,e.budget>0,rel&&rel.gain,rel&&rel.reason]);}
    function redraw(){U.dirty=true;render(true);live();save();}
    function view(){signature=sig();return api.subTabs("atelier","machines","Découvrir","Machines")+api.goalHint()+'<div class="atelier-equipe" id="atelier-equipe">'+body()+'</div><div class="card" id="hands">'+api.handsHTML()+'</div>';}
    function live(){const r=root();if(!r||U.tab!=="atelier"||U.equipmentLegacy)return;
      const next=sig();if(next!==signature){const ae=document.activeElement,focus=ae&&r.contains(ae)&&ae.id?{id:ae.id,start:ae.selectionStart,end:ae.selectionEnd}:null;const scroll=r.querySelector(".ae-inventory")?.scrollTop||0;r.innerHTML=body();signature=next;const stock=r.querySelector(".ae-inventory");if(stock)stock.scrollTop=scroll;if(focus){const el=document.getElementById(focus.id);if(el){el.focus({preventScroll:true});try{el.setSelectionRange(focus.start,focus.end);}catch(_){}}}}
      const {w}=work(),e=E.atelierEconomyInfo(),query=(U.equipmentSearch||"").toLocaleLowerCase();
      let visible=0;
      const discoveryOnly=E.state.settings.equipmentDiscoveryOnly===true;
      r.querySelectorAll("[data-ae-resource]").forEach(el=>{const id=el.dataset.aeResource,picked=w.slots.includes(id),b=el.querySelector('[data-ae="item"]'),n=E.count(id);el.hidden=!el.dataset.name.includes(query)||(discoveryOnly&&!E.equipmentHasDiscovery(id,w.eq,w.mode));if(!el.hidden)visible++;b.disabled=!picked&&(n<1||w.slots.length>=3);b.classList.toggle("ae-selected",picked);b.setAttribute("aria-pressed",String(picked));b.setAttribute("aria-label",name(id)+', '+n.toLocaleString('fr-FR')+' en stock'+(picked?', sur l’établi':''));b.title=name(id)+' · '+n.toLocaleString('fr-FR');el.querySelector("[data-ae-count]").textContent=api.fmt(n);});
      const empty=r.querySelector('#ae-discovery-empty');
      if(empty){empty.hidden=visible>0;empty.textContent=discoveryOnly?(query?'Aucune matière ne correspond à cette recherche et à ce geste.':'Aucune matière étudiée ne cache de recette avec cet outil et ce geste, pour l’instant. Étudie d’autres matières ou change de geste.'):'Aucune matière ne correspond à cette recherche.';}
      const bench=r.querySelector('.ae-bench'),views=document.getElementById('views'),mini=r.querySelector('.ae-mini');
      if(mini)mini.hidden=!(w.slots.length&&bench.getBoundingClientRect().bottom<views.getBoundingClientRect().top);
      r.querySelectorAll("[data-ae-need]").forEach(el=>{const n=E.count(el.dataset.aeNeed),need=Number(el.dataset.need);el.textContent=need?'×'+need+' requis · '+Math.floor(n)+' disponibles'+(n<need?' · manque '+Math.ceil(need-n):' · prêt'):Math.floor(n)+' disponibles';});
      const set=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value;};
      set("ae-wallet",money(E.state.ecus));
      const missing=Math.max(0,e.hire+1-E.state.ecus);set("ae-hire-goal",!e.hired?(missing?'Encore '+money(missing)+' pour embaucher et avancer 1 écu.':'Embauche et première avance finançables.'):'');
      set("ae-worker-status",e.status+(e.hired?' · '+name(e.tool||"aucun")+' · '+e.produced+' lanières produites':''));set("ae-worker-pay",'Salaire : '+money(e.wage)+' par fabrication · Avance : '+money(e.budget));
      const wp=document.getElementById("ae-worker-progress");if(wp){wp.hidden=!e.hired;wp.value=e.progress;}
      const mp=document.getElementById("ae-merchant-progress");if(mp)mp.value=e.merchant?e.saleClock:0;
      const surplus=Math.max(0,Math.floor(E.count("laniere")-e.reserve)),quote=E.merchantQuote(surplus);
      set("ae-quote",(e.merchant?'Prochain passage : '+fmtTime(5-e.saleClock)+'. ':'Ventes en pause. ')+surplus+' lanières → '+money(quote.net)+' nets (taxe : '+money(quote.tax)+').');
      set("ae-tax",'Tranches marginales de '+e.quota+' lanières : 10 %, 20 %, 30 %, 40 %, puis 50 %. Tranche actuelle : '+e.nextRate+' %. Nouvelle période dans '+Math.ceil(60-e.clock)+' s. Total net : '+money(e.net)+' ; salaires : '+money(e.wages)+'.');
      if(lastSale&&e.totalSold>lastSale.sold)messageSale='Dernière vente : +'+money(e.net-lastSale.net)+' · '+(e.totalSold-lastSale.sold)+' lanières';
      lastSale={sold:e.totalSold,net:e.net};set("ae-sale",messageSale);
    }
    let messageSale="";
    function prepare(id){if(!E.state.known[id])return;
      if(I[id]?.r&&I[id].a>=4&&!D.CRAFT_EQUIPMENT.recipes[id]){
        const g=I[id].r[0];
        Object.assign(work().w,{place:"grand_atelier",eq:"ga_"+g,mode:g,slots:Object.keys(I[id].r[1]),prepared:id});
        message="Recette préparée : "+name(id);
        return;
      }
      const c=E.equipmentChoices(id).find(c=>c.ready);if(!c){message="Il faut d’abord : "+name(E.equipmentCheck(id)?.required||"un outil adapté");return;}Object.assign(work().w,{eq:c.equipment,mode:c.mode,place:E.workplaceFor(c.equipment),slots:Object.keys(I[id].r[1]),prepared:id});message="Recette préparée : "+name(id);}
    function forge(mode){const {w}=work();if(!w.slots.length)return;w.mode=mode||w.mode;work();U.forging=true;let result;try{result=w.place==="grand_atelier"?E.attempt(w.mode,w.slots):E.attemptWith(w.eq,w.mode,w.slots);}finally{U.forging=false;}U.last=result;
      if(result.kind==="craft"||result.kind==="queued"){message=(result.kind==="craft"?"Fabriqué : ":"En cours : ")+name(result.id);A.craft(U.geste);}
      else if(result.kind==="learn"||result.kind==="blocked"){message="Recette trouvée : "+name(result.id)+(result.missing?" · Il manque "+Object.entries(result.missing).map(([id,n])=>n+' '+name(id)).join(', '):result.info?' · '+api.needText(result.id,result.info):' · Inscrite dans le Carnet');A.discover();}
      else if(result.thermo){message=result.thermo.label+" · "+result.thermo.text;A.fail(result.thermo.heat==="brulant"?3:result.thermo.heat==="chaud"?2:result.thermo.heat==="tiede"?1:0);}
      else if(result.kind==="fail"&&result.heat!==undefined){const hLbl=["❄️ Froid","🌤️ Tiède","🌡️ Chaud","🔥 Brûlant"][result.heat]||"❄️ Froid";message=hLbl+(result.text?" · "+result.text:" · Aucune réaction avec ces matières.");A.fail(result.heat||0);}
      else {message=result.kind==="owned"?"Tu possèdes déjà cet objet.":"Ce geste ne donne rien avec ces matières. Essaie un autre outil ou une autre combinaison.";A.fail(0);}
      if(result.fresh&&(result.kind==="craft"||result.kind==="learn"))api.fete({id:result.id,kick:"Nouvelle découverte",title:name(result.id),sub:I[result.id].u||""});
      redraw();
    }
    document.addEventListener("click",ev=>{const b=ev.target.closest("[data-ae]");if(!b||U.tab!=="atelier"||!document.getElementById("v-atelier").contains(b)||b.disabled)return;const action=b.dataset.ae,id=b.dataset.value;
      if(action==="legacy"){U.equipmentLegacy=id==="1";redraw();return;}
      if(!root()?.contains(b))return;
      const {w,tools,tool}=work();A.init();
      if(action==="place"){w.place=id;w.prepared=null;}
      else if(action==="study"){const n=E.studyAll();message=n?n+' matières étudiées.':'Il manque de l’Intuition pour étudier ces matières.';}
      else if(action==="tool"){w.eq=id;const t=tools.find(x=>x.id===id)||D.CRAFT_EQUIPMENT.equipment[id];if(t)w.mode=Object.keys(t.modes)[0];w.prepared=null;}
      else if(action==="item"){if(w.slots.includes(id))w.slots.splice(w.slots.indexOf(id),1);else if(w.slots.length<3&&E.count(id)>=1)w.slots.push(id);w.prepared=null;}
      else if(action==="slot"){w.slots.splice(Number(id),1);w.prepared=null;}
      else if(action==="forge"){forge(id);return;}
      else if(action==="prepare")prepare(id);
      else if(action==="order"){const result=E.order(id,1);message=result.ok?"Commande lancée : "+name(id):"Il manque une recette ou un équipement : consulte le Carnet.";}
      else if(action==="batch"){const result=E.queue(id,tool.batch||1,false,undefined,{equipment:w.eq,mode:w.mode});message=result.ok?"Série lancée avec "+name(w.eq):"Pas assez de matières ou de place dans les commandes.";}
      else if(action==="build"){E.learn("etabli_amenage",true);message=E.order("etabli_amenage",1).ok?"Aménagement en cours.":"Consulte les matériaux requis dans le Carnet.";}
      else if(action==="hire")message=E.workerHire().ok?"L’ouvrier rejoint ton établi.":"Aménage le poste, prépare l’outil et finance l’embauche avec tes ventes.";
      else if(action==="fund")message=E.workerFund(1).ok?"Un écu réservé aux salaires.":"Il faut un écu disponible.";
      else if(action==="fund5")message=E.workerFund(5).ok?"Cinq écus réservés aux salaires.":"Il faut 5 écus disponibles.";
      else if(action==="worker")E.workerSet(!E.atelierEconomyInfo().working);
      else if(action==="withdraw")E.workerWithdraw();
      else if(action==="sell"){const result=E.merchantSell(E.count("laniere"));message=result.ok?'Vendu : '+money(result.net)+' nets.':'Aucun surplus au-dessus de ta réserve.';}
      redraw();
    });
    document.addEventListener("input",ev=>{if(ev.target.id==="ae-search"){U.equipmentSearch=ev.target.value;live();}});
    document.addEventListener("change",ev=>{
      if(ev.target.id==="ae-discovery-only"){E.state.settings.equipmentDiscoveryOnly=ev.target.checked;redraw();return;}
      if(ev.target.id==="ae-discovery-mode"){const {w,tool}=work();if(Object.hasOwn(tool.modes,ev.target.value)){w.mode=ev.target.value;w.prepared=null;redraw();}return;}
      if(ev.target.id==="ae-autofund"&&E.workerAutoFund){E.workerAutoFund(ev.target.checked);live();save();return;}
      if(ev.target.id==="ae-merchant"||ev.target.id==="ae-reserve"){const on=document.getElementById("ae-merchant"),reserve=document.getElementById("ae-reserve");E.merchantConfigure(on.checked,reserve.value);live();save();}
    });
    return {view,live,forge,prepare};
  }
  window.EclatAtelierEquipe={create};
})();
