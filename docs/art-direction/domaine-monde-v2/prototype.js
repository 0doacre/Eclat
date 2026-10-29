/* Domaine V2 — prototype isolé. Les règles de récolte, d’exploration et
 * d’installation restent celles du moteur ; seules les durées de démo changent. */
(function () {
  'use strict';
  const E=window.EclatEngine.createEngine(),D=window.ECLAT_DATA,A=window.EclatAudio,W=window.EclatWorldLayout;
  const KEY='eclat.prototype.monde.v2',$=s=>document.querySelector(s),S=()=>E.state;
  const viewport=$('#viewport'),world=$('#world'),hotspots=$('#hotspots'),feedback=$('#feedback');
  const canvas=$('#matter'),ctx=canvas.getContext('2d');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=n=>n>=1000?(n/1000).toFixed(1).replace('.',',')+' k':Number.isInteger(n)?String(n):n.toFixed(1).replace('.',',');
  const nodes=[
    {id:'lisiere',kind:'land',x:1000,y:733,z:'lisiere',n:'La Lisière'},
    {id:'plaine',kind:'land',x:350,y:175,z:'plaine',n:'La Plaine'},
    {id:'camp',kind:'camp',x:759,y:912,z:'lisiere',n:'Le camp'},
    {id:'bois',kind:'resource',x:872,y:674,z:'lisiere'},
    {id:'fibre',kind:'resource',x:598,y:875,z:'lisiere'},
    {id:'caillou',kind:'resource',x:950,y:836,z:'lisiere'},
    {id:'os',kind:'resource',x:420,y:400,z:'plaine'},
    {id:'cuir',kind:'resource',x:245,y:465,z:'plaine'},
    {id:'chene',kind:'place',x:720,y:520,rx:124,ry:116,z:'lisiere',index:0,n:'Le Grand Chêne',note:'Le premier repère, au-dessus du camp.'},
    {id:'grotte',kind:'place',x:450,y:687,rx:85,ry:66,z:'lisiere',index:1,n:'La Grotte aux Mains',note:'Sous la roche, une mémoire à l’ocre.'},
    {id:'sentier',kind:'pass',x:486,y:602,rx:55,ry:60,z:'lisiere',n:'Le Sentier des Herbes'},
    {id:'champ_os',kind:'place',x:405,y:354,rx:88,ry:64,z:'plaine',index:0,n:'Le Champ des Os',note:'Des ossements pâles dans les hautes herbes.'},
    {id:'tumulus',kind:'place',x:255,y:242,rx:82,ry:62,z:'plaine',index:1,n:'Le Tumulus',note:'Deux pierres veillent sur une entrée basse.'}
  ];
  nodes.forEach(n=>{if(W.anchors[n.id]&&n.id!=='camp')Object.assign(n,W.anchors[n.id]);});
  const byId=Object.fromEntries(nodes.map(n=>[n.id,n]));
  let camera='camp',view=[400,300,700,700],selected=null,resourceSelected=null,drawerKind=null,drawerOpener=null;
  let cameraFrame=0,toastTimer=0,discoveryTimer=0,pressTimer=0,press=null,suppressGather=false,drag=null,draggedAt=-1000;
  let soundOn=false,audioStarted=false,stopPencil=null,lastSound=0,lastAnnounce=0;
  let particles=[],particleFrame=0,particleTime=0,dpr=1,gainGroups=new Map(),lastSignature='',saveFailed=false;
  const pageById={chene:'lands/lisiere',grotte:'discoveries/grotte',champ_os:'lands/plaine',tumulus:'discoveries/tumulus'};
  const stage=()=>E.zoneOpen('plaine')?3:Math.min(2,S().exp.done.lisiere||0);
  const done=n=>n.kind==='pass'?E.zoneOpen('plaine'):n.kind==='place'&&(S().exp.done[n.z]||0)>n.index;
  const activeNode=()=>{const a=S().exp.active;return a&&nodes.find(n=>n.kind==='place'&&n.z===a.z&&n.index===a.i);};
  const art=id=>'assets/carnet/'+pageById[id]+'.webp';
  function save(){
    try{localStorage.setItem(KEY,JSON.stringify({v:1,game:E.serialize(),camera,view,sound:soundOn}));saveFailed=false;}
    catch(_){if(!saveFailed){tell('La démonstration reste jouable, mais son enregistrement est indisponible.');saveFailed=true;}}
  }
  function tell(text){clearTimeout(toastTimer);$('#toast').textContent=text;$('#toast').classList.add('visible');toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),2900);}
  function stopWriting(){if(stopPencil){stopPencil();stopPencil=null;}}
  function audio(){if(soundOn&&!audioStarted){A.setEnabled(true);A.init();A.setVolumes({music:.12,amb:.19,sfx:.62});audioStarted=true;}}
  function tapSound(id){if(soundOn&&performance.now()-lastSound>55){audio();A.tap(id);lastSound=performance.now();}}
  function clearEffects(){
    cancelAnimationFrame(particleFrame);particleFrame=0;particles=[];ctx.clearRect(0,0,canvas.width,canvas.height);
    feedback.replaceChildren();gainGroups.clear();clearTimeout(discoveryTimer);$('#discovery').hidden=true;stopWriting();
  }
  function seed(n){
    clearEffects();E.reset();const s=S();s.introSeen=true;s.meta.forcedDone=true;s.flags.ver=D.VERSION;
    Object.assign(s.settings,{sound:false,tuto:false,visiteurs:false});
    Object.assign(s.inv,{bois:30,fibre:20,caillou:12,torche:3,epieu:1,cabane:3,hutte:1,fibre_1:2,caillou_1:2,collets:2,cuir_1:2});
    for(const id of Object.keys(s.inv)){s.known[id]=true;s.seen[id]=true;s.made[id]=1;}
    s.pass.plaine={done:n>=3,paid:n>=3?E.passCost('plaine'):{}};s.exp.done.lisiere=Math.min(2,n);
    if(n>=3){s.zones.plaine=true;s.age=1;}E.load(E.serialize());selected=null;resourceSelected=null;
    closeDrawer(false);$('#placeCard').hidden=true;lastSignature='';render();focus(n>=3?'all':'camp',true);save();
  }
  function bounds(name){
    const ratio=viewport.clientHeight/viewport.clientWidth;
    let width=Math.max(stage()?850:620,560/ratio),cx=750,cy;
    if(name==='all'){width=Math.max(ratio>1?900:(stage()>=3?1480:1120),650/ratio);cx=ratio>1?700:750;}
    if(name==='lisiere'){width=Math.max(960,650/ratio);cx=760;}
    if(name==='plaine'){width=Math.max(690,500/ratio);cx=355;cy=350;}
    if(byId[name]&&byId[name].kind!=='land'&&name!=='camp'){
      const n=byId[name];width=Math.max(n.kind==='pass'?650:560,480/ratio);cx=n.x;cy=n.y+70;
    }
    const height=width*ratio;
    if(cy===undefined)cy=1000-height/2;
    return[cx-width/2,cy-height/2,width,height];
  }
  function project(n){return{x:(n.x-view[0])/view[2]*viewport.clientWidth,y:(n.y-view[1])/view[3]*viewport.clientHeight};}
  function usable(n){
    if(n.z==='plaine'&&!E.zoneOpen('plaine'))return false;
    if(n.id==='sentier')return stage()>=2;
    if(n.kind==='place'){const next=E.nextExp(n.z);return done(n)||!!(next&&next.i===n.index)||activeNode()===n;}
    return true;
  }
  function layout(){
    world.setAttribute('viewBox',view.join(' '));
    for(const n of nodes){
      const el=document.getElementById('node-'+n.id),p=project(n);if(!el)continue;
      const edge=n.kind==='resource'?38:30;
      const hidden=!usable(n)||p.x<edge||p.x>viewport.clientWidth-edge||p.y<70||p.y>viewport.clientHeight-24||
        (camera==='all'&&n.kind!=='land'&&n.kind!=='camp')||(camera!=='all'&&n.kind==='land');
      el.classList.toggle('offscreen',hidden);el.style.left=p.x+'px';el.style.top=p.y+'px';
    }
    positionCard();
  }
  function focus(name,instant=false){
    if(name==='plaine'&&!E.zoneOpen('plaine'))return tell('Le sentier reste à dégager.');
    cancelAnimationFrame(cameraFrame);camera=name;
    const n=byId[name];$('#mapTitle').textContent=name==='all'?'Autour du camp':name==='plaine'||(n&&n.z==='plaine')?'La Plaine des Hautes Herbes':'La Lisière';
    $('#mapCaption').textContent=name==='all'?'Le monde s’ouvre, le camp demeure.':name==='camp'?'Auprès du camp':n&&n.note?n.note:'Un chemin de plus dans le carnet.';
    const from=view.slice(),to=bounds(name),start=performance.now();
    function frame(t){const p=instant||reduced.matches?1:Math.min(1,(t-start)/1250),k=p*p*(3-2*p);view=to.map((v,i)=>from[i]+(v-from[i])*k);layout();if(p<1)cameraFrame=requestAnimationFrame(frame);else save();}
    cameraFrame=requestAnimationFrame(frame);
    A.setScene({zone:n?n.z:name==='plaine'?'plaine':'lisiere',age:S().age});
  }
  function zoom(factor){
    cancelAnimationFrame(cameraFrame);const cx=view[0]+view[2]/2,cy=view[1]+view[3]/2,w=Math.max(420,Math.min(1900,view[2]*factor)),h=w*viewport.clientHeight/viewport.clientWidth;
    view=[cx-w/2,cy-h/2,w,h];camera='free';layout();save();
  }
  function contour(n){
    const x=n.x,y=n.y,rx=n.rx,ry=n.ry;
    return `M${x-rx} ${y+4} C${x-rx-7} ${y-ry*.6} ${x-rx*.45} ${y-ry-4} ${x} ${y-ry} S${x+rx+9} ${y-ry*.35} ${x+rx} ${y+8} S${x+rx*.32} ${y+ry+7} ${x-12} ${y+ry} S${x-rx+3} ${y+ry*.5} ${x-rx} ${y+4}Z`;
  }
  function makeNodes(){
    hotspots.innerHTML=nodes.map(n=>{
      if(n.kind==='resource')return `<div class="marker resource" id="node-${n.id}"><button class="gather" data-gather="${n.id}" aria-label="Récolter ${esc(D.ITEMS[n.id].n)}" title="${esc(D.ITEMS[n.id].n)} · toucher pour récolter"><img src="assets/carnet/items/${n.id}.webp" alt=""></button><button class="manage" data-manage="${n.id}" aria-label="Gérer les installations : ${esc(D.ITEMS[n.id].n)}" title="Installer ou améliorer">+</button></div>`;
      if(n.kind==='place'||n.kind==='pass')return `<button class="marker place-marker" id="node-${n.id}" data-place="${n.id}" aria-label="${esc(n.n)}" title="${esc(n.n)}"><span class="annotation" aria-hidden="true">◇</span></button>`;
      return `<button class="marker ${n.kind==='land'?'land-marker':'camp-marker'}" id="node-${n.id}" data-camera="${n.id}" title="Se rapprocher : ${esc(n.n)}">${esc(n.n)}</button>`;
    }).join('');
    $('#placeContours').innerHTML=nodes.filter(n=>n.rx).map(n=>`<g class="place-shape" id="shape-${n.id}"><path class="place-outline" data-hitplace="${n.id}" d="${contour(n)}"/><path class="place-progress" id="ring-${n.id}" d="${contour(n)}" pathLength="1"/></g>`).join('');
  }
  function positionCard(){
    if(!selected||$('#placeCard').hidden)return;
    const n=byId[selected],p=project(n),card=$('#placeCard'),w=card.offsetWidth,h=card.offsetHeight;
    if(p.x<-40||p.x>viewport.clientWidth+40||p.y<-40||p.y>viewport.clientHeight+40){card.style.visibility='hidden';return;}
    card.style.visibility='';
    const left=Math.max(12,Math.min(viewport.clientWidth-w-12,p.x-w/2));
    let top=p.y-65-h;if(top<70)top=p.y+56;
    top=Math.max(72,Math.min(viewport.clientHeight-h-12,top));card.style.left=left+'px';card.style.top=top+'px';
  }
  function choosePlace(id,bring=false){
    const n=byId[id];if(!n||!usable(n))return;
    closeDrawer(false);resourceSelected=null;selected=id;
    const p=project(n);if(bring||p.x<60||p.x>viewport.clientWidth-60||p.y<100||p.y>viewport.clientHeight-75)focus(id);
    $('#placeCard').hidden=false;renderCard();render();
  }
  function renderCard(){
    if(!selected)return;const n=byId[selected],a=activeNode();
    $('#placeName').textContent=n.n;
    $('#placeKicker').textContent=n.kind==='pass'?'Ouvrir un chemin':done(n)?'Une page du carnet':a===n?'Le crayon suit tes pas':'Une trace à suivre';
    const btn=$('#explore');btn.disabled=false;
    if(n.kind==='pass'){
      const p=E.passInfo('plaine');$('#placeDetail').textContent=p.done?'La route rejoint la Plaine.':'Les ronces cèdent, les pierres marquent le passage. Matériaux fournis pour l’étude.';
      btn.textContent=p.done?'Emprunter le sentier →':'Dégager les ronces · '+Math.round(p.frac*100)+' %';
    }else if(done(n)){$('#placeDetail').textContent=n.note;btn.textContent='Ouvrir la page →';}
    else if(a===n){$('#placeDetail').textContent='La progression se dessine autour du lieu.';btn.textContent='Exploration en cours…';btn.disabled=true;}
    else{const exp=E.ZONES[n.z].exps[n.index];$('#placeDetail').textContent=(exp.cost?'1 torche · prête · ':'')+'6 s dans cette étude';btn.textContent='Explorer →';btn.disabled=!!a;}
    positionCard();
  }
  function nextTrace(){
    if(activeNode())return choosePlace(activeNode().id,true);
    const n=stage()<2?byId[stage()?'grotte':'chene']:stage()===2?byId.sentier:(S().exp.done.plaine||0)<2?byId[(S().exp.done.plaine||0)?'tumulus':'champ_os']:null;
    if(n)choosePlace(n.id,true);else{focus('all');tell('Les pages de ces deux terres sont dans le carnet.');}
  }
  function startExploration(n){
    if(S().exp.active)return;
    const next=E.nextExp(n.z);if(!next||next.i!==n.index)return tell('Ce lieu n’est pas encore accessible.');
    const result=E.startExp(n.z);if(!result.ok)return tell('Il manque une torche pour cette exploration.');
    S().exp.active.dur=6000;const x=750,y=850;
    $('#pencilRoute').setAttribute('d',`M${x} ${y} C${x-45} ${y-55} ${(x+n.x)/2+38} ${(y+n.y)/2+28} ${(x+n.x)/2} ${(y+n.y)/2} S${n.x-31} ${n.y+36} ${n.x} ${n.y}`);
    $('#placeCard').hidden=true;stopWriting();if(soundOn){audio();stopPencil=A.pencil(6);}
    save();render();
  }
  function build(){
    const p=E.passInfo('plaine');for(const [id,left] of Object.entries(p.left))S().inv[id]=Math.max(S().inv[id]||0,Math.min(left,Math.ceil(p.cost[id]/3)));
    const result=E.passPour('plaine');if(!result.ok)return tell('Le Grand Chêne et la grotte sont à explorer d’abord.');
    if(soundOn){audio();A.craft('tailler');}burst(byId.sentier,'bois',1,false);arrival(byId.sentier);
    save();render();if(!result.done)renderCard();
  }
  function countExt(n){const e=E.domExt(n.z,n.id);return e?Object.values(e.u).reduce((a,b)=>a+b,0):0;}
  function openDrawer(kind,title,kicker,html,opener){
    $('#placeCard').hidden=true;drawerKind=kind;drawerOpener=opener||document.activeElement;
    $('#drawerTitle').textContent=title;$('#drawerKicker').textContent=kicker;$('#drawerContent').innerHTML=html;$('#drawer').hidden=false;
    $('#closeDrawer').focus({preventScroll:true});
  }
  function closeDrawer(restore=true){
    $('#drawer').hidden=true;drawerKind=null;
    if(restore&&drawerOpener&&drawerOpener.isConnected)drawerOpener.focus({preventScroll:true});
  }
  function resourceSheet(id,preserveFocus=false){
    const n=byId[id],e=E.domExt(n.z,id),from=e&&Object.keys(e.u).find(t=>E.extNext(t)),next=from&&E.extNext(from);
    resourceSelected=id;
    const html=`<img class="resource-detail-art" src="assets/carnet/items/${id}.webp" alt=""><div class="metric"><span>En réserve</span><strong id="sheetStock">${fmt(E.count(id))}</strong></div><div class="metric"><span>Installations</span><strong>${countExt(n)}</strong></div><div class="metric"><span>Production</span><strong id="sheetRate">${e?(E.extOut(e)*60).toFixed(1).replace('.',','):'0'} / min</strong></div><div class="actions"><button class="paint-button" data-install="${id}">${countExt(n)?'Ajouter une installation':'Installer un extracteur'}</button>${next&&S().known[next]?`<button data-upgrade="${id}" data-from="${from}">Améliorer → ${esc(D.ITEMS[next].n)}</button>`:''}</div><p class="drawer-note">Quelques exemplaires sont déjà fabriqués pour cette étude. Pose, amélioration et production utilisent le moteur du jeu.</p>`;
    if(preserveFocus){$('#drawerContent').innerHTML=html;}else openDrawer('resource',D.ITEMS[id].n,'Gisement · '+E.ZONES[n.z].n,html,document.getElementById('node-'+id).querySelector('.manage'));
    render();
  }
  function collection(){
    resourceSelected=null;const pages=nodes.filter(n=>n.kind==='place'&&done(n));
    openDrawer('collection','Les pages rapportées','Le Carnet du Semeur',pages.length?'<div class="study-list">'+pages.map(n=>`<button class="study-item" data-study="${n.id}"><img src="${art(n.id)}" alt=""><span>${esc(n.n)}<small>Étude conservée au carnet</small></span></button>`).join('')+'</div>':'<p>Quelques pages encore blanches. La première trace t’attend près du Grand Chêne.</p>');render();
  }
  function instructions(){openDrawer('help','Quelques repères','Une étude jouable',`<p><b>Toucher une matière</b> : récolter, avec une réaction propre à sa matière.</p><p><b>Appui long ou petit +</b> : installer et améliorer un extracteur.</p><p><b>Toucher un lieu esquissé</b> : faire apparaître son nom, puis explorer. Le contour se dessine pendant la découverte.</p><p><b>Toucher une terre</b> : s’en rapprocher. Le camp reste ton point d’origine.</p><p class="drawer-note">La carte tient dans l’écran. Les détails se ferment avec ✕. Dans le menu : chapitres de démonstration et comparaison avec la V1.</p>`);}
  function study(id){if(!byId[id]||!done(byId[id]))return;$('#studyTitle').textContent=byId[id].n;$('#studyArt').src=art(id);$('#studyArt').alt=byId[id].n;$('#studyNote').textContent=byId[id].note;if(!$('#study').open)$('#study').showModal();}
  function discovery(n){
    $('#discoveryArt').src=art(n.id);$('#discoveryName').textContent=n.n;$('#discovery').dataset.study=n.id;$('#discovery').hidden=false;
    clearTimeout(discoveryTimer);discoveryTimer=setTimeout(()=>$('#discovery').hidden=true,4200);
    if(soundOn){audio();A.discover();}arrival(n);
  }
  function arrival(n){
    if(reduced.matches||!n.rx)return;
    const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',contour(n));path.setAttribute('class','arrival');$('#placeContours').append(path);setTimeout(()=>path.remove(),1300);
  }
  function resizeCanvas(){
    dpr=Math.min(2,devicePixelRatio||1);canvas.width=Math.round(viewport.clientWidth*dpr);canvas.height=Math.round(viewport.clientHeight*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  const matterColors={bois:['#775132','#af8956','#c1a87a'],fibre:['#6e7545','#9a9b66','#b3a879'],caillou:['#6f6b60','#969083','#b7ad97'],os:['#aaa08b','#d0c4a6','#8b8069'],cuir:['#8c6a49','#b08f66','#6b5038']};
  function burst(n,id,amount,critical){
    const p=project(n);if(reduced.matches)return;
    const colors=matterColors[id]||matterColors.bois,count=critical?12:7;
    for(let i=0;i<count;i++){
      const a=(i/count)*Math.PI*2+Math.random()*.35,speed=45+Math.random()*65;
      particles.push({x:p.x,y:p.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed-32,age:0,life:.36+Math.random()*.25,w:id==='fibre'?2:3+Math.random()*3,h:id==='fibre'?8:2+Math.random()*2,angle:Math.random()*Math.PI,spin:Math.random()*5-2.5,color:colors[i%colors.length]});
    }
    if(particles.length>90)particles.splice(0,particles.length-90);
    if(!particleFrame){particleTime=performance.now();particleFrame=requestAnimationFrame(drawMatter);}
  }
  function drawMatter(t){
    const dt=Math.min(.04,(t-particleTime)/1000);particleTime=t;ctx.clearRect(0,0,viewport.clientWidth,viewport.clientHeight);
    particles=particles.filter(p=>p.age<p.life);
    for(const p of particles){p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=180*dt;p.angle+=p.spin*dt;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.globalAlpha=Math.max(0,1-p.age/p.life)*.85;ctx.fillStyle=p.color;ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);ctx.restore();}
    if(particles.length)particleFrame=requestAnimationFrame(drawMatter);else{particleFrame=0;ctx.clearRect(0,0,viewport.clientWidth,viewport.clientHeight);}
  }
  function gain(n,amount,critical){
    const p=project(n),now=performance.now();let g=gainGroups.get(n.id);
    if(g&&now-g.at<160&&g.el.isConnected){g.amount+=amount;g.at=now;g.el.textContent='+'+fmt(g.amount);return;}
    while(feedback.children.length>=8){const first=feedback.firstElementChild;first.getAnimations().forEach(a=>a.cancel());first.remove();}
    const el=document.createElement('span');el.className='gain'+(critical?' critical':'');el.textContent='+'+fmt(amount);el.style.left=(p.x-12)+'px';el.style.top=(p.y-40)+'px';feedback.append(el);g={el,amount,at:now};gainGroups.set(n.id,g);
    if(reduced.matches)setTimeout(()=>el.remove(),650);
    else{const a=el.animate([{opacity:0,transform:'translateY(2px) scale(.85)'},{opacity:1,transform:'translateY(-8px) scale(1.08)',offset:.18},{opacity:1,transform:'translateY(-23px) scale(1)',offset:.68},{opacity:0,transform:'translateY(-44px) scale(.98)'}],{duration:850,easing:'ease-out'});a.onfinish=()=>el.remove();}
  }
  function harvest(id){
    const n=byId[id],amount=E.tap(id,n.z);if(!(amount>0))return;
    resourceSelected=id;$('#placeCard').hidden=true;const critical=!!E.lastCrit,img=document.querySelector(`#node-${id} .gather img`);
    img.getAnimations().forEach(a=>a.cancel());
    if(!reduced.matches)img.animate([{transform:'translate(0,0) rotate(0) scale(1)'},{transform:'translate(0,2px) rotate(-5deg) scale(.9)',offset:.16},{transform:'translate(0,-3px) rotate(3deg) scale('+(critical?1.2:1.12)+')',offset:.5},{transform:'translate(0,0) rotate(0) scale(1)'}],{duration:critical?330:245,easing:'ease-out'});
    burst(n,id,amount,critical);gain(n,amount,critical);tapSound(id);
    if(!reduced.matches&&navigator.vibrate)navigator.vibrate(critical?12:5);
    if(performance.now()-lastAnnounce>500){$('#a11yGain').textContent=D.ITEMS[id].n+' : +'+fmt(amount);lastAnnounce=performance.now();}
    highlight();live();save();
  }
  function highlight(){
    for(const n of nodes){const el=document.getElementById('node-'+n.id);el.classList.toggle('selected',n.kind==='resource'?resourceSelected===n.id:selected===n.id);if(n.rx){$('#shape-'+n.id).classList.toggle('selected',selected===n.id&&!$('#placeCard').hidden);}}
  }
  function renderInstallations(){
    $('#installations').innerHTML=nodes.filter(n=>n.kind==='resource'&&countExt(n)>0).map(n=>{
      const e=E.domExt(n.z,n.id),up=n.id==='bois'&&!!e.u.hutte,icon={bois:'cabane',fibre:'fibre_1',caillou:'caillou_1',os:'collets',cuir:'cuir_1'}[n.id];
      return `<g data-building="${n.id}"><image href="assets/carnet/items/${icon}.webp" x="${n.x+35}" y="${n.y-115}" width="${up?130:96}" height="${up?118:90}"/>${n.id==='bois'?`<path class="smoke" d="M${n.x+82} ${n.y-95}q-7-13 1-23t1-19"/>`:''}</g>`;
    }).join('');
  }
  function render(){
    document.body.dataset.stage=stage();document.body.classList.toggle('exploring',!!S().exp.active);
    $('#era').textContent=S().age>=1?'Âge de l’Os':'Âge du Bois';$('#pageCount').textContent=nodes.filter(n=>n.kind==='place'&&done(n)).length;
    const a=activeNode();for(const n of nodes.filter(n=>n.rx)){
      const el=$('#node-'+n.id),shape=$('#shape-'+n.id),complete=done(n),isActive=a===n;
      const next=n.kind==='place'?E.nextExp(n.z):null;
      el.classList.toggle('complete',complete);el.classList.toggle('active',isActive);el.classList.toggle('ready',!complete&&!isActive&&!!(n.kind==='pass'?stage()===2:next&&next.i===n.index));
      shape.classList.toggle('complete',complete);shape.classList.toggle('active',isActive);shape.style.display=usable(n)?'':'none';
      el.querySelector('.annotation').textContent=complete?'✓':n.kind==='pass'?'↗':'◇';
    }
    $('#trail').style.strokeDashoffset=1-E.passInfo('plaine').frac;$('#brambles').style.opacity=1-E.passInfo('plaine').frac;
    renderInstallations();highlight();layout();live();
    if(selected&&!$('#placeCard').hidden)renderCard();
  }
  function live(){
    const n=activeNode(),a=S().exp.active;
    if(n&&a){const p=Math.min(1,Math.max(0,(Date.now()-a.t0)/a.dur));$('#ring-'+n.id).style.strokeDashoffset=1-p;$('#node-'+n.id+' .annotation').textContent=Math.max(0,Math.ceil((a.dur-Date.now()+a.t0)/1000))+' s';$('#pencilRoute').style.strokeDashoffset=1-p;}
    else $('#pencilRoute').style.strokeDashoffset=1;
    if(drawerKind==='resource'&&resourceSelected){const n=byId[resourceSelected],e=E.domExt(n.z,n.id);$('#sheetStock').textContent=fmt(E.count(n.id));$('#sheetRate').textContent=(e?(E.extOut(e)*60).toFixed(1).replace('.',','):'0')+' / min';}
    for(const n of nodes.filter(n=>n.kind==='resource'))$('#node-'+n.id+' .gather').setAttribute('aria-label','Récolter '+D.ITEMS[n.id].n+' · '+fmt(E.count(n.id))+' en réserve');
  }
  function structuralSignature(){return stage()+'|'+JSON.stringify(S().exp.done)+'|'+(S().exp.active?S().exp.active.z+S().exp.active.i:'')+'|'+JSON.stringify(S().dom.ext);}
  function hoverPlace(id,on){const shape=$('#shape-'+id);if(shape)shape.classList.toggle('hovered',on);}
  function setSound(on){soundOn=on;A.setEnabled(on);if(on){audio();A.click();if(S().exp.active){stopWriting();stopPencil=A.pencil(6);}}else{stopWriting();audioStarted=false;}$('#sound').setAttribute('aria-pressed',String(on));$('#sound').setAttribute('aria-label',on?'Couper le son':'Activer le son');$('#sound').title=on?'Couper les sons du jeu':'Activer les sons du jeu';save();}
  makeNodes();
  document.addEventListener('click',ev=>{
    if(ev.detail&&performance.now()-draggedAt<160)return;
    const button=ev.target.closest('button');
    if(button){audio();
      if(button.dataset.gather){if(suppressGather){suppressGather=false;return;}return harvest(button.dataset.gather);}
      if(button.dataset.manage)return resourceSheet(button.dataset.manage);
      if(button.dataset.place)return choosePlace(button.dataset.place);
      if(button.dataset.camera){$('#placeCard').hidden=true;selected=null;highlight();return focus(button.dataset.camera);}
      if(button.dataset.zoom){$('#placeCard').hidden=true;return zoom(button.dataset.zoom==='in'?.8:1.25);}
      if(button.dataset.install){const id=button.dataset.install,n=byId[id],r=E.domExtAdd(n.z,id,1,E.extFor(id,n.z)[0]);if(r.ok){if(soundOn)A.craft('assembler');burst(n,id,1,false);tell(r.placed?'Une installation prend place dans le paysage.':'La fabrication de l’installation est lancée.');}else tell('Les matériaux manquent pour une autre installation.');resourceSheet(id,true);render();save();return;}
      if(button.dataset.upgrade){const id=button.dataset.upgrade,n=byId[id],r=E.domExtUp(n.z,id,button.dataset.from);if(r.ok){if(soundOn)A.craft('assembler');burst(n,id,1,true);tell('L’installation se transforme.');}else tell('Cette amélioration n’est pas encore disponible.');resourceSheet(id,true);render();save();return;}
      if(button.dataset.study)return study(button.dataset.study);
      if(button.dataset.stage!==undefined){seed(Number(button.dataset.stage));$('#options').close();return;}
      if(button.hasAttribute('data-close-dialog'))return button.closest('dialog').close();
    }
    const hit=ev.target.closest('[data-hitplace]');if(hit)return choosePlace(hit.dataset.hitplace);
    const terrain=ev.target.closest('[data-terrain]');if(terrain){$('#placeCard').hidden=true;selected=null;highlight();focus(terrain.dataset.terrain);}
  });
  $('#explore').onclick=()=>{const n=byId[selected];if(!n)return;if(n.kind==='pass'){if(E.zoneOpen('plaine')){$('#placeCard').hidden=true;focus('plaine');}else build();}else if(done(n))study(n.id);else startExploration(n);};
  $('#dismissPlace').onclick=()=>{$('#placeCard').hidden=true;selected=null;highlight();};
  $('#goal').onclick=nextTrace;$('#sound').onclick=()=>setSound(!soundOn);$('#menu').onclick=()=>$('#options').showModal();
  $('#closeDrawer').onclick=()=>closeDrawer();$('#notebook').onclick=collection;$('#instructions').onclick=instructions;
  $('#domainTab').onclick=()=>{closeDrawer();$('#placeCard').hidden=true;selected=null;highlight();};
  hotspots.addEventListener('pointerdown',ev=>{
    const button=ev.target.closest('[data-gather]');if(!button||ev.button!==0)return;
    clearTimeout(pressTimer);suppressGather=false;press={x:ev.clientX,y:ev.clientY};
    pressTimer=setTimeout(()=>{suppressGather=true;resourceSheet(button.dataset.gather);if(!reduced.matches&&navigator.vibrate)navigator.vibrate(9);},520);
  });
  for(const event of ['pointerup','pointercancel','pointerleave'])hotspots.addEventListener(event,()=>clearTimeout(pressTimer));
  hotspots.addEventListener('pointermove',ev=>{if(press&&Math.hypot(ev.clientX-press.x,ev.clientY-press.y)>10)clearTimeout(pressTimer);});
  hotspots.addEventListener('contextmenu',ev=>{if(ev.target.closest('[data-gather]'))ev.preventDefault();});
  for(const n of nodes.filter(n=>n.rx)){
    const el=$('#node-'+n.id),path=$('#shape-'+n.id+' .place-outline');path.style.pointerEvents='fill';
    for(const target of [el,path]){target.addEventListener('pointerenter',()=>hoverPlace(n.id,true));target.addEventListener('pointerleave',()=>hoverPlace(n.id,false));target.addEventListener('focus',()=>hoverPlace(n.id,true));target.addEventListener('blur',()=>hoverPlace(n.id,false));}
  }
  for(const path of world.querySelectorAll('[data-terrain]')){path.addEventListener('pointerenter',()=>document.body.dataset.hover=path.dataset.terrain);path.addEventListener('pointerleave',()=>delete document.body.dataset.hover);}
  for(const el of hotspots.querySelectorAll('[data-camera]')){el.addEventListener('pointerenter',()=>document.body.dataset.hover=el.dataset.camera);el.addEventListener('pointerleave',()=>delete document.body.dataset.hover);el.addEventListener('focus',()=>document.body.dataset.hover=el.dataset.camera);el.addEventListener('blur',()=>delete document.body.dataset.hover);}
  viewport.addEventListener('pointerdown',ev=>{
    if(ev.button!==0||ev.target.closest('button,#drawer,#placeCard'))return;
    cancelAnimationFrame(cameraFrame);drag={x:ev.clientX,y:ev.clientY,view:view.slice(),id:ev.pointerId,moved:false};
  });
  viewport.addEventListener('pointermove',ev=>{
    if(!drag)return;const dx=ev.clientX-drag.x,dy=ev.clientY-drag.y;if(!drag.moved&&Math.hypot(dx,dy)<6)return;
    if(!drag.moved){drag.moved=true;viewport.setPointerCapture(ev.pointerId);$('#placeCard').hidden=true;}
    const v=drag.view;view=[Math.max(-600,Math.min(1450,v[0]-dx*v[2]/viewport.clientWidth)),Math.max(-1800,Math.min(900,v[1]-dy*v[3]/viewport.clientHeight)),v[2],v[3]];camera='free';layout();
  });
  function stopDrag(){if(drag&&drag.moved){draggedAt=performance.now();save();}drag=null;}
  viewport.addEventListener('pointerup',stopDrag);viewport.addEventListener('pointercancel',stopDrag);
  viewport.addEventListener('keydown',ev=>{if(ev.target!==viewport)return;const d={ArrowLeft:[-45,0],ArrowRight:[45,0],ArrowUp:[0,-45],ArrowDown:[0,45]}[ev.key];if(!d)return;ev.preventDefault();cancelAnimationFrame(cameraFrame);view[0]+=d[0];view[1]+=d[1];camera='free';layout();save();});
  E.on('expdone',r=>{stopWriting();render();save();const n=nodes.find(n=>n.kind==='place'&&n.z===r.z&&n.index===r.i)||nodes.find(n=>n.id===r.x.id);if(n&&!r.silent){discovery(n);if(n.id==='chene')focus('camp');}if(selected&&!$('#placeCard').hidden)renderCard();});
  E.on('zone',z=>{if(z!=='plaine')return;$('#placeCard').hidden=true;selected=null;render();focus('all');if(soundOn){audio();A.age();}tell('Les ronces cèdent. Au-delà, la Plaine.');save();});
  E.on('handdone',()=>{render();if(drawerKind==='resource'&&resourceSelected)resourceSheet(resourceSelected,true);});
  A.setEnabled(false);let loaded=false;
  try{const raw=JSON.parse(localStorage.getItem(KEY)||'null');if(raw&&raw.v===1&&typeof raw.game==='string'){E.load(raw.game);soundOn=!!raw.sound;if(Array.isArray(raw.view)&&raw.view.length===4&&raw.view.every(Number.isFinite)&&raw.view[2]>=420&&raw.view[2]<=2500&&raw.view[3]>0){view=raw.view;camera=raw.camera||'free';loaded=true;}}}catch(_){}
  if(!loaded)seed(0);else render();
  $('#sound').setAttribute('aria-pressed',String(soundOn));$('#sound').setAttribute('aria-label',soundOn?'Couper le son':'Activer le son');
  let sizeReady=false,lastW=0,lastH=0;
  new ResizeObserver(()=>{resizeCanvas();const w=viewport.clientWidth,h=viewport.clientHeight;if(sizeReady&&lastW&&lastH){const cx=view[0]+view[2]/2,cy=view[1]+view[3]/2;view[3]=view[2]*h/w;view[0]=cx-view[2]/2;view[1]=cy-view[3]/2;layout();}else if(!loaded)focus('camp',true);else{view[3]=view[2]*h/w;layout();}lastW=w;lastH=h;sizeReady=true;}).observe(viewport);
  setInterval(()=>{if(document.hidden)return;E.update();const sig=structuralSignature();if(sig!==lastSignature){lastSignature=sig;render();}else live();},100);
  setInterval(save,3000);document.addEventListener('visibilitychange',()=>{if(document.hidden){save();clearEffects();}else{E.update();render();}});
  window.addEventListener('pagehide',()=>{save();stopWriting();});
  window.__mondeV2={E,seed,stage,focus,save,get camera(){return camera;},get view(){return view.slice();},get particleCount(){return particles.length;},get sound(){return soundOn;}};
  setTimeout(()=>{if(stage()===0)tell('Touche une matière pour récolter. Une trace attend près du Chêne.');},500);
})();
