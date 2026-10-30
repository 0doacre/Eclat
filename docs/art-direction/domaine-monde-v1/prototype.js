/* Étude isolée : même moteur, une sauvegarde de démonstration distincte. */
(function () {
  'use strict';
  const E = window.EclatEngine.createEngine(), D = window.ECLAT_DATA;
  const KEY = 'eclat.prototype.monde.v1', $ = s => document.querySelector(s);
  const viewport = $('#viewport'), world = $('#world'), hotspots = $('#hotspots');
  const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const short = n => n >= 1000 ? (n/1000).toFixed(1)+' k' : Math.floor(n).toString();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let press = null;
  let view = [100, 250, 1050, 700], camera = 'camp', selected = null, lastStage = -1, moving = 0, notice = 0, longTimer = 0, suppressed = false, drag = null;
  const nodes = [
    {id:'lisiere',kind:'land',x:360,y:415,z:'lisiere',n:'La Lisière'},
    {id:'plaine',kind:'land',x:1130,y:150,z:'plaine',n:'La Plaine'},
    {id:'camp',kind:'camp',x:790,y:685,z:'lisiere',n:'Le camp'},
    {id:'bois',kind:'resource',x:385,y:570,z:'lisiere'},
    {id:'fibre',kind:'resource',x:460,y:900,z:'lisiere'},
    {id:'caillou',kind:'resource',x:580,y:735,z:'lisiere'},
    {id:'os',kind:'resource',x:1090,y:325,z:'plaine'},
    {id:'cuir',kind:'resource',x:1260,y:470,z:'plaine'},
    {id:'chene',kind:'place',x:265,y:458,z:'lisiere',n:'Le Grand Chêne',index:0},
    {id:'grotte',kind:'place',x:180,y:680,z:'lisiere',n:'La Grotte aux Mains',index:1},
    {id:'champ_os',kind:'place',x:1020,y:255,z:'plaine',n:'Le Champ des Os',index:0},
    {id:'tumulus',kind:'place',x:1260,y:200,z:'plaine',n:'Le Tumulus',index:1}
  ];
  const S = () => E.state;
  const stage = () => E.zoneOpen('plaine') ? 3 : Math.min(2, S().exp.done.lisiere || 0);
  function save() { try { localStorage.setItem(KEY,E.serialize()); } catch (_) { /* La démo reste jouable sans stockage. */ } }
  function tell(text) { clearTimeout(notice); $('#toast').textContent=text; $('#toast').classList.add('show'); notice=setTimeout(()=>$('#toast').classList.remove('show'),2800); }
  function seed(n) {
    E.reset(); const s=S();
    Object.assign(s.settings,{sound:false,tuto:false,visiteurs:false}); s.introSeen=true; s.meta.forcedDone=true; s.flags.ver=D.VERSION;
    Object.assign(s.inv,{bois:30,fibre:20,caillou:12,torche:3,epieu:1,cabane:3,hutte:1,fibre_1:2,caillou_1:2,collets:2,cuir_1:2});
    for(const id of Object.keys(s.inv)){s.known[id]=true;s.seen[id]=true;s.made[id]=1;}
    s.pass.plaine={done:false,paid:{}}; s.known.hutte=true; s.exp.done.lisiere=Math.min(n,2);
    if(n>=3){s.pass.plaine={done:true,paid:E.passCost('plaine')};s.zones.plaine=true;s.age=1;}
    E.load(E.serialize()); selected=null; save(); render(); focus(n>=3?'all':'camp',true); campSheet();
  }
  function bounds(name) {
    const ratio=viewport.clientHeight/viewport.clientWidth;
    let cx=650,cy=650,w=1000;
    if(name==='lisiere'){cx=430;cy=650;w=870;}
    if(name==='plaine'){cx=1110;cy=335;w=740;}
    if(name==='all'){cx=760;cy=510;w=stage()>=3?1530:1150;}
    const h=w*ratio;return[cx-w/2,cy-h/2,w,h];
  }
  function drawCamera() {
    world.setAttribute('viewBox',view.join(' '));
    nodes.forEach(node=>{
      const el=document.getElementById('node-'+node.id);if(!el)return;
      const x=(node.x-view[0])/view[2]*100,y=(node.y-view[1])/view[3]*100;
      const hidden=x<7||x>93||y<10||y>94||(node.z==='plaine'&&!E.zoneOpen('plaine'))||(camera==='all'&&node.kind!=='land'&&node.kind!=='camp')||(camera!=='all'&&node.kind==='land');
      el.classList.toggle('offscreen',hidden);el.style.left=x+'%';el.style.top=y+'%';
    });
  }
  function focus(name, instant) {
    if(name==='plaine'&&!E.zoneOpen('plaine'))return tell('Le sentier reste à ouvrir.');
    cancelAnimationFrame(moving);camera=name;
    $('#mapTitle').textContent= name==='all'?'Les terres connues':name==='plaine'?'La Plaine des Hautes Herbes':'La Lisière';
    document.querySelectorAll('[data-camera]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.camera===name)));
    const dest=bounds(name),start=view.slice(),at=performance.now();
    function frame(t){const p=instant||reduced?1:Math.min(1,(t-at)/1800),ease=p*p*(3-2*p);view=dest.map((v,i)=>start[i]+(v-start[i])*ease);drawCamera();if(p<1)moving=requestAnimationFrame(frame);}
    moving=requestAnimationFrame(frame);
  }
  function makeNodes(){
    hotspots.innerHTML=nodes.map(node=>{
      if(node.kind==='resource')return '<div class="hotspot resource" id="node-'+node.id+'"><button class="gather" data-gather="'+node.id+'" title="'+esc(D.ITEMS[node.id].n)+' · toucher pour récolter" aria-label="Récolter '+esc(D.ITEMS[node.id].n)+'"><img src="../../../assets/carnet/items/'+node.id+'.webp" alt=""><span>'+esc(D.ITEMS[node.id].n)+'<span class="quantity" id="qty-'+node.id+'"></span></span></button><button class="manage" data-manage="'+node.id+'" aria-label="Gérer les extracteurs : '+esc(D.ITEMS[node.id].n)+'" title="Installer ou améliorer un extracteur">+</button></div>';
      return '<button class="hotspot '+node.kind+'" id="node-'+node.id+'" data-node="'+node.id+'" title="'+esc(node.kind==='land'?'Se rapprocher de '+node.n:node.n)+'">'+esc(node.n)+'</button>';
    }).join('');
  }
  function countExt(res,z){const e=E.domExt(z,res);return e?Object.values(e.u).reduce((a,b)=>a+b,0):0;}
  function select(id){selected=id;document.querySelectorAll('.hotspot').forEach(e=>e.classList.toggle('chosen',e.id==='node-'+id));}
  function sheet(kicker,title,html){$('#sheetKicker').textContent=kicker;$('#sheetTitle').textContent=title;$('#sheetContent').innerHTML=html;}
  function campSheet(){select('camp');sheet('Le camp du Semeur',stage()>=3?'Un point d’attache.':'Tout commence ici.',
    '<img class="sheet-art" src="../../../assets/carnet/discoveries/camp.webp" alt="L’abri et le feu de camp"><p>Le monde s’étend. Le camp reste le lieu où revenir.</p><p>'+ (stage()>=3?'Un feu entretenu, des réserves et les premiers outils en os.':'Un abri de branches. Au-delà, une forêt dont tu ne connais pas encore les chemins.')+'</p><div class="sheet-actions"><button data-action="camp" title="Recentrer le paysage sur le camp">Revenir au camp</button><button data-action="all" title="Voir les terres découvertes">Voir le monde ↗</button></div><p class="hint">Touche une ressource pour récolter. Le petit + ouvre ses installations ; un appui long fait la même chose.</p>');}
  function resourceSheet(id){
    const node=nodes.find(n=>n.id===id),e=E.domExt(node.z,id),count=countExt(id,node.z),types=e?Object.keys(e.u):[],from=types.find(t=>E.extNext(t)),next=from&&E.extNext(from);
    select(id);
    sheet('Gisement · '+E.ZONES[node.z].n,D.ITEMS[id].n,
      '<img class="sheet-art" src="../../../assets/carnet/items/'+id+'.webp" alt="'+esc(D.ITEMS[id].n)+'"><div class="metric"><span>En réserve</span><strong id="sheetStock">'+short(E.count(id))+'</strong></div><div class="metric"><span>Installations</span><strong>'+count+'</strong></div><div class="metric"><span>Production</span><strong id="sheetRate">'+(e?(E.extOut(e)*60).toFixed(1):'0')+' / min</strong></div><div class="sheet-actions"><button class="primary" data-action="gather" data-id="'+id+'">Récolter</button><button data-action="install" data-id="'+id+'">'+(count?'Ajouter un extracteur':'Installer un extracteur')+'</button>'+(next?'<button data-action="upgrade" data-id="'+id+'" data-from="'+from+'">Améliorer → '+esc(D.ITEMS[next].n)+'</button>':'')+'</div><p class="hint">Pour cette étude, quelques extracteurs et une amélioration sont déjà fabriqués. Leur pose et leur production passent par le moteur du jeu.</p>');
  }
  function placeSheet(node){
    select(node.id);const done=(S().exp.done[node.z]||0)>node.index,ready=E.nextExp(node.z);
    sheet('Lieu à explorer',node.n,'<p>'+(done?'Ce lieu a trouvé sa place dans le carnet.':node.id==='grotte'?'Sous la roche, une paroi garde la mémoire des mains.':node.id==='tumulus'?'Une entrée de pierre disparaît sous les hautes herbes.':'Quelques pas pour donner un nom à ce qui nous entoure.')+'</p><div class="sheet-actions"><button class="primary" data-action="explore" data-zone="'+node.z+'" '+(done||!ready||ready.i!==node.index||S().exp.active?'disabled':'')+'>'+(done?'Lieu découvert':'Explorer · 6 s')+'</button>'+(done?'<button data-study="'+node.id+'">Ouvrir la page</button>':'')+'</div>');
  }
  function start(z){
    if(S().exp.active)return tell('Une exploration est déjà en cours.');
    const r=E.startExp(z);if(!r.ok)return tell('Ce lieu n’est pas encore accessible.');
    const target=nodes.find(n=>n.kind==='place'&&n.z===z&&n.index===S().exp.active.i);
    if(target){const x=z==='plaine'?1050:736,y=z==='plaine'?445:608;$('#pencilRoute').setAttribute('d','M'+x+' '+y+' Q'+(x-55)+' '+(y+35)+' '+((x+target.x)/2)+' '+((y+target.y)/2)+' T'+target.x+' '+target.y);}
    S().exp.active.dur=6000;document.body.classList.add('exploring');save();render();
    tell('Le crayon suit les premiers pas…');
  }
  function build(){
    const p=E.passInfo('plaine');for(const [id,n] of Object.entries(p.left))S().inv[id]=Math.max(S().inv[id]||0,Math.min(n,Math.ceil(p.cost[id]/3)));
    const r=E.passPour('plaine');if(!r.ok){tell('Explore d’abord les deux premiers lieux de la Lisière.');return;}
    save();render();if(!E.zoneOpen('plaine'))tell('Le sentier prend forme · '+Math.round(E.passInfo('plaine').frac*100)+' %');
  }
  function render(){
    const n=stage();document.body.dataset.stage=n;$('#plaineCamera').disabled=n<3;
    $('#campEra').textContent=n>=3?'Le camp s’établit · Âge de l’Os':'Un abri dans les bois';
    document.querySelectorAll('[data-stage]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.stage)===n)));
    nodes.filter(x=>x.kind==='place').forEach(x=>$('#node-'+x.id).classList.toggle('done',(S().exp.done[x.z]||0)>x.index));
    const installed=nodes.filter(x=>x.kind==='resource'&&countExt(x.id,x.z)>0);
    $('#installation').innerHTML=installed.map(x=>{const e=E.domExt(x.z,x.id),up=x.id==='bois'&&e.u.hutte;const icon={bois:'cabane',fibre:'fibre_1',caillou:'caillou_1',os:'collets',cuir:'cuir_1'}[x.id];return '<image href="../../../assets/carnet/items/'+icon+'.webp" x="'+(x.x+30)+'" y="'+(x.y-110)+'" width="'+(up?145:100)+'" height="'+(up?130:90)+'"/>';}).join('');
    $('#installation').classList.toggle('visible',installed.length>0);
    $('#campSprite').setAttribute('width',n>=3?'260':'200');$('#campSprite').setAttribute('height',n>=3?'175':'135');
    $('#mapNote').textContent=n===0?'Au-delà du camp, quelques traits à peine…':n<3?'Chaque découverte laisse une trace.':'Le monde a grandi. Le camp est toujours là.';
    $('#journeyTitle').textContent=['Reconnaître les alentours','Sous la roche, une autre mémoire','Se frayer un chemin','Au-delà des hautes herbes'][n];
    $('#journeyText').textContent=['Explore le Grand Chêne pour préciser les contours de la Lisière.','Le Grand Chêne est découvert. La Grotte aux Mains attend maintenant ton passage.','Les ronces cèdent peu à peu. Trois apports de matériaux ouvrent la route vers la Plaine.','La Plaine rejoint le même paysage. Approche-toi pour explorer le Champ des Os, puis le Tumulus.'][n];
    const p=E.passInfo('plaine'),exp=S().exp.active,plDone=S().exp.done.plaine||0;
    $('#advance').textContent=exp?'Exploration en cours…':n===0?'Explorer le Grand Chêne →':n===1?'Explorer la Grotte →':n===2?'Frayer le sentier · '+Math.round(p.frac*100)+' % →':plDone<2?'Explorer '+(plDone?'le Tumulus':'le Champ des Os')+' →':'Les deux terres sont découvertes ✓';
    $('#advance').disabled=!!exp||(n===3&&plDone>=2);
    $('#studies').innerHTML=nodes.filter(x=>x.kind==='place'&&(S().exp.done[x.z]||0)>x.index).map(x=>'<button class="study" data-study="'+x.id+'" title="Ouvrir l’illustration de '+esc(x.n)+'"><img src="'+art(x.id)+'" alt=""><span>'+esc(x.n)+'<small>Étude conservée au carnet</small></span></button>').join('')||'<p class="empty-study">Le carnet attend ses premières découvertes.</p>';
    if(n!==lastStage){lastStage=n;if(selected==='camp')campSheet();}
    live();drawCamera();
  }
  function art(id){return '../../../assets/carnet/'+(id==='chene'?'lands/lisiere':id==='champ_os'?'lands/plaine':'discoveries/'+id)+'.webp';}
  function study(id){const node=nodes.find(x=>x.id===id);if(!node||(S().exp.done[node.z]||0)<=node.index)return;
    const d=document.createElement('dialog');d.innerHTML='<button aria-label="Fermer l’étude">✕</button><p class="eyebrow">Une page du carnet</p><h2>'+esc(node.n)+'</h2><img src="'+art(id)+'" alt="'+esc(node.n)+'"><p>Une découverte de plus, un monde un peu moins inconnu.</p>';document.body.append(d);d.querySelector('button').onclick=()=>d.close();d.addEventListener('close',()=>d.remove());d.showModal();}
  function live(){
    nodes.filter(x=>x.kind==='resource').forEach(x=>{$('#qty-'+x.id).textContent=' · '+short(E.count(x.id));});
    if(selected&&D.ITEMS[selected]&&$('#sheetStock')){$('#sheetStock').textContent=short(E.count(selected));}
    const exp=S().exp.active;$('#exploreProgress').hidden=!exp;
    if(exp){const p=Math.min(1,(Date.now()-exp.t0)/exp.dur);$('#exploreProgress').value=p;$('#activity').textContent=E.ZONES[exp.z].exps[exp.i].n+' · '+Math.max(0,Math.ceil((exp.dur-Date.now()+exp.t0)/1000))+' s';}
    else $('#activity').textContent=stage()===2?'Les matériaux nécessaires sont fournis dans ce prototype.':'';
  }
  function act(button){
    const action=button.dataset.action,id=button.dataset.id,node=nodes.find(x=>x.id===id);
    if(action==='camp'||action==='all'){focus(action);return;}
    if(action==='explore')return start(button.dataset.zone);
    if(action==='gather'){const got=E.tap(id,node.z);tell('+'+short(got)+' '+D.ITEMS[id].n.toLowerCase());}
    if(action==='install'){const r=E.domExtAdd(node.z,id,1,E.extFor(id,node.z)[0]);tell(r.ok?r.placed?'L’installation trouve sa place dans le paysage.':'Fabrication de l’extracteur en cours.':'Il manque des matériaux pour cette installation.');}
    if(action==='upgrade'){const r=E.domExtUp(node.z,id,button.dataset.from);tell(r.ok?'L’installation se transforme.':'Cette amélioration n’est pas encore disponible.');}
    save();resourceSheet(id);render();
  }
  document.addEventListener('click',ev=>{
    const b=ev.target.closest('button');if(!b)return;
    if(b.dataset.stage!==undefined){seed(Number(b.dataset.stage));return;}
    if(b.dataset.camera)return focus(b.dataset.camera);
    if(b.dataset.manage)return resourceSheet(b.dataset.manage);
    if(b.dataset.gather){if(suppressed){suppressed=false;return;}const node=nodes.find(x=>x.id===b.dataset.gather);E.tap(node.id,node.z);resourceSheet(node.id);live();save();return;}
    if(b.dataset.action)return act(b);
    if(b.dataset.study)return study(b.dataset.study);
    if(b.dataset.node){const node=nodes.find(x=>x.id===b.dataset.node);if(node.kind==='land'){focus(node.z);campSheet();}else if(node.kind==='camp')campSheet();else placeSheet(node);}
  });
  hotspots.addEventListener('pointerdown',ev=>{
    const b=ev.target.closest('[data-gather]');if(!b)return;clearTimeout(longTimer);suppressed=false;press={x:ev.clientX,y:ev.clientY};
    longTimer=setTimeout(()=>{suppressed=true;resourceSheet(b.dataset.gather);tell('Installations du gisement');},550);
  });
  for(const type of ['pointerup','pointercancel','pointerleave'])hotspots.addEventListener(type,()=>clearTimeout(longTimer));
  hotspots.addEventListener('pointermove',ev=>{if(press&&Math.hypot(ev.clientX-press.x,ev.clientY-press.y)>10)clearTimeout(longTimer);});
  hotspots.addEventListener('contextmenu',ev=>{if(ev.target.closest('[data-gather]'))ev.preventDefault();});
  world.querySelectorAll('.territory').forEach((path,i)=>{const z=i?'plaine':'lisiere';path.addEventListener('pointerenter',()=>{document.body.dataset.hover=z;});path.addEventListener('pointerleave',()=>{delete document.body.dataset.hover;});path.addEventListener('click',()=>focus(z));});
  hotspots.addEventListener('pointerover',ev=>{const b=ev.target.closest('[data-node]');if(b){const n=nodes.find(x=>x.id===b.dataset.node);document.body.dataset.hover=n.z;}});
  hotspots.addEventListener('pointerout',()=>{delete document.body.dataset.hover;});
  hotspots.addEventListener('focusin',ev=>{const b=ev.target.closest('[data-node]');if(b)document.body.dataset.hover=nodes.find(x=>x.id===b.dataset.node).z;});
  hotspots.addEventListener('focusout',()=>{delete document.body.dataset.hover;});
  viewport.addEventListener('pointerdown',ev=>{if(ev.target.closest('button'))return;cancelAnimationFrame(moving);drag={x:ev.clientX,y:ev.clientY,v:view.slice(),id:ev.pointerId};viewport.setPointerCapture(ev.pointerId);viewport.classList.add('dragging');});
  viewport.addEventListener('pointermove',ev=>{if(!drag)return;view=[drag.v[0]-(ev.clientX-drag.x)*view[2]/viewport.clientWidth,drag.v[1]-(ev.clientY-drag.y)*view[3]/viewport.clientHeight,view[2],view[3]];view[0]=Math.max(-450,Math.min(1250,view[0]));view[1]=Math.max(-600,Math.min(800,view[1]));drawCamera();});
  function stopDrag(){drag=null;viewport.classList.remove('dragging');}
  viewport.addEventListener('pointerup',stopDrag);viewport.addEventListener('pointercancel',stopDrag);
  viewport.addEventListener('keydown',ev=>{if(ev.target!==viewport)return;const dirs={ArrowLeft:[-45,0],ArrowRight:[45,0],ArrowUp:[0,-45],ArrowDown:[0,45]};if(!dirs[ev.key])return;ev.preventDefault();cancelAnimationFrame(moving);view[0]+=dirs[ev.key][0];view[1]+=dirs[ev.key][1];drawCamera();});
  $('#advance').onclick=()=>{if(stage()===2)build();else start(stage()===3?'plaine':'lisiere');};
  $('#restart').onclick=()=>seed(0);
  E.on('expdone',r=>{document.body.classList.remove('exploring');render();save();tell(r.x.n+' rejoint le carnet.');if(selected===r.x.id)placeSheet(nodes.find(n=>n.id===selected));});
  E.on('zone',z=>{if(z!=='plaine'||!E.zoneOpen('plaine'))return;render();focus('all');campSheet();tell('Au-delà des ronces, la Plaine. Le monde s’agrandit.');save();});
  E.on('handdone',()=>{render();if(selected&&D.ITEMS[selected])resourceSheet(selected);});
  makeNodes();let loaded=false;try{const raw=localStorage.getItem(KEY);if(raw){E.load(raw);loaded=true;}}catch(_){}
  if(!loaded)seed(0);else{render();focus(stage()>=3?'all':'camp',true);campSheet();}
  if(S().exp.active)document.body.classList.add('exploring');
  new ResizeObserver(()=>focus(camera,true)).observe(viewport);
  setInterval(()=>{E.update();live();},100);setInterval(save,3000);
  window.__monde={E,seed,stage,focus,save};
})();
