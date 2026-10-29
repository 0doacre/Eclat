/* Le monde du Carnet. Même partie et mêmes règles que le Domaine classique.
 * Le rendu reste monté pendant les mises à jour et les appuis de récolte. */
(function(root){
  'use strict';
  const W=root.EclatWorldLayout||(typeof require==='function'?require('./world-layout'):null);
  const PLATES={chene:'lands/lisiere',grotte:'discoveries/grotte',cercle:'discoveries/cercle',champ_os:'lands/plaine',tumulus:'discoveries/tumulus'};
  function area(z){
    const r=W.regions[z],b=r?r.bounds:[200,430,1300,990];
    return r&&r.scale==='space'?[b[0]+750,b[1]-6000,b[2]+750,b[3]-6000]:b.slice();
  }
  function acquired(E,z,x,i){
    const s=E.state,f=E.RECIT&&E.RECIT.expFrag&&E.RECIT.expFrag[z+':'+x.id];
    return (s.exp.done[z]||0)>i||!!(s.frags[x.id]||(x.rw&&s.frags[x.rw.frag])||(f&&s.frags[f]))||
      Object.entries(E.RECIT&&E.RECIT.pages||{}).some(([id,p])=>s.livre&&s.livre.p&&s.livre.p[id]&&(p.src||[]).some(src=>src.k==='exp'&&src.at===z+':'+x.id));
  }
  function model(E,D){
    const s=E.state,nodes=[],zones=D.ZONES.filter(z=>E.zoneOpen(z.id)).map(z=>z.id);
    nodes.push({key:'camp',kind:'camp',z:'lisiere',x:750,y:920,n:'Le camp'});
    for(const z of zones){
      const b=area(z),width=b[2]-b[0],height=b[3]-b[1],cx=(b[0]+b[2])/2,cy=(b[1]+b[3])/2,Z=E.ZONES[z];
      nodes.push({key:'z:'+z,kind:'land',z,x:z==='lisiere'?1000:cx,y:z==='plaine'?190:b[1]+height*.14,n:Z.n});
      const deps=E.zoneDeps(z).filter(d=>d.hand||E.domExt(z,d.res)||E.extFor(d.res,z).some(t=>s.known[t]||E.count(t)>0));
      deps.forEach((d,i)=>{
        const a=['lisiere','plaine'].includes(z)&&W.anchors[d.res];
        nodes.push({key:'r:'+z+':'+d.res,kind:'resource',z,res:d.res,hand:!!d.hand,n:D.ITEMS[d.res].n,x:a?a.x:cx+(i-(deps.length-1)/2)*Math.min(width*.23,width/(deps.length+1)),y:a?a.y:cy+height*.26});
      });
      const next=E.nextExp(z);
      (Z.exps||[]).forEach((x,i)=>{
        const side=x.cote&&E.coteEtat?E.coteEtat(z,x.id):0,complete=(s.exp.done[z]||0)>i||side===2,act=s.exp.active&&s.exp.active.z===z&&s.exp.active.i===i;
        const cote=side===1,remembered=acquired(E,z,x,i);
        if(!complete&&!act&&!cote&&!remembered&&(!next||next.i!==i))return;
        if(!complete&&!remembered&&x.show&&!E.cond(x.show))return;
        const a=['lisiere','plaine'].includes(z)&&W.anchors[x.id],angles=[[-.25,-.22],[.24,-.18],[.1,.04],[-.2,.08],[0,-.35]],p=angles[i%angles.length];
        nodes.push({key:'p:'+z+':'+i,kind:'place',z,id:x.id,i,cote:!!x.cote,canStart:!!cote||!!(next&&next.i===i),complete,acquired:remembered,hidden:!complete&&!!x.hidden&&!!(next&&next.i===i&&next.locked),n:!complete&&x.hidden&&next&&next.locked?'Un lieu à découvrir':x.n,x:a?a.x:cx+p[0]*width,y:a?a.y:cy+p[1]*height,rx:a?x.id==='chene'?120:78:width*.1,ry:a?x.id==='chene'?112:60:height*.1});
      });
    }
    for(const z of E.passPending()){
      const p=E.passInfo(z);if(!p||!p.ready||(p.lieux&&p.lieux.left.length))continue;
      const b=area(z),x=z==='plaine'?486:(b[0]+b[2])/2,y=z==='plaine'?602:b[3]-60;
      const origin=D.ZONES[Math.max(0,D.ZONES.findIndex(t=>t.id===z)-1)].id;
      nodes.push({key:'gate:'+z,kind:'pass',z:origin,target:z,x,y,rx:55,ry:55,n:p.P.n});
    }
    return {nodes,zones};
  }
  function create(api){
    const {E,D,U,A,esc,fmt,fmtTime,toast,openModal,render}=api,S=()=>E.state;
    let host=null,el=null,viewport=null,world=null,fx=null,canvas=null,ctx=null,observer=null,frame=0;
    let data={nodes:[],zones:[]},byKey={},view=[400,300,700,700],camera='camp',selected=null,resource=null,drawer=null,drawerSig='',signature='';
    let drag=null,draggedAt=-1000,changedState=null,lastCycle=0,pencilStop=null,discovery=null,discoveryAt=0,lastAnnounce=0,lastSound=0;
    let particles=[],particleFrame=0,particleAt=0,dpr=1,gains=new Map();
    const reduced=()=>root.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const $=s=>el&&el.querySelector(s);
    const active=()=>U.tab==='domaine'&&root.EclatStyleMode==='vivant';
    const nodeId=k=>'mw-'+k.replace(/[^a-z0-9_-]/gi,'-');
    const plate=n=>n&&PLATES[n.id]?'assets/carnet/'+PLATES[n.id]+'.webp':null;
    function html(){return '<div class="monde" id="monde"><div class="monde-viewport" tabindex="0" aria-label="Monde du Semeur : déplacer la carte en glissant ou avec les flèches">'+
      '<svg class="monde-world" preserveAspectRatio="none" aria-hidden="true"><defs><radialGradient id="mw-soft"><stop offset="60%" stop-color="white"/><stop offset="100%" stop-color="black"/></radialGradient><mask id="mw-ronces"><ellipse cx="490" cy="570" rx="115" ry="70" fill="url(#mw-soft)"/></mask><mask id="mw-forest"><ellipse cx="780" cy="765" rx="590" ry="460" fill="url(#mw-soft)"/></mask><mask id="mw-plaine"><ellipse cx="360" cy="365" rx="470" ry="390" fill="url(#mw-soft)"/></mask></defs><image class="mw-sketch" href="assets/carnet/world/first-lands.webp" width="1500" height="1000"/><image class="mw-forest" href="assets/carnet/world/first-lands.webp" width="1500" height="1000" mask="url(#mw-forest)"/><image class="mw-plaine" href="assets/carnet/world/first-lands.webp" width="1500" height="1000" mask="url(#mw-plaine)"/><g class="mw-lands"></g><g class="mw-land-hits"></g><path class="mw-trail" d="M733 841C650 814 603 773 564 721S522 646 487 612S433 529 422 470S401 399 400 369" pathLength="1"/><g class="mw-brambles" mask="url(#mw-ronces)"><image href="assets/carnet/passages/ronces-gauche.webp" x="405" y="508" width="143" height="96"/><image href="assets/carnet/passages/ronces-droite.webp" x="472" y="517" width="136" height="91"/></g><image href="assets/carnet/discoveries/camp.webp" x="650" y="746" width="210" height="142"/><g class="mw-camp-growth"><image href="assets/carnet/items/outre.webp" x="839" y="826" width="45" height="44"/></g><g class="mw-buildings"></g><g class="mw-contours"></g><path class="mw-pencil" fill="none" pathLength="1"/></svg>'+
      '<div class="mw-heading"><span class="mw-title">La Lisière</span><span class="mw-subtitle">Le monde autour du camp</span></div><div class="mw-markers"></div><svg class="mw-leaders" aria-hidden="true"></svg><canvas class="mw-matter" aria-hidden="true"></canvas><div class="mw-feedback" aria-hidden="true"></div>'+
      '<div class="mw-place" hidden><button data-world-close-place title="Fermer le lieu" aria-label="Fermer les détails du lieu">✕</button><p class="kicker"></p><h3></h3><p class="mw-place-info"></p><button class="btn pri" data-world-act title="Agir sur ce lieu"></button></div>'+
      '<div class="mw-tools"><button data-world-goal title="Voir l’objectif et retrouver le prochain lieu" aria-label="Objectif et prochaine trace">◇</button><button data-world-zone-list title="Choisir une terre connue et régler le cadrage" aria-label="Terres connues et cadrage">⌘</button><button data-world-camera="camp" title="Revenir au camp" aria-label="Revenir au camp">⌂</button><button data-world-panel="gestion" title="Installations, ruines, Comptoir et Grands Œuvres" aria-label="Gestion du Domaine">⚒</button></div>'+
      '<aside class="mw-drawer" hidden aria-labelledby="mw-drawer-title"><header><h3 id="mw-drawer-title"></h3><button data-world-close-drawer title="Fermer les détails" aria-label="Fermer les détails">✕</button></header><div class="mw-drawer-body"></div></aside><button class="mw-discovery" hidden title="Ouvrir l’illustration découverte"><img alt=""><span></span></button><span class="sr-only mw-announcement" role="status" aria-live="polite"></span></div></div>';}
    function shape(n){return `M${n.x-n.rx} ${n.y+4}C${n.x-n.rx-7} ${n.y-n.ry*.6} ${n.x-n.rx*.45} ${n.y-n.ry-4} ${n.x} ${n.y-n.ry}S${n.x+n.rx+9} ${n.y-n.ry*.35} ${n.x+n.rx} ${n.y+8}S${n.x+n.rx*.32} ${n.y+n.ry+7} ${n.x-12} ${n.y+n.ry}S${n.x-n.rx+3} ${n.y+n.ry*.5} ${n.x-n.rx} ${n.y+4}Z`;}
    function imageFor(res){const art=root.ECLAT_ILLUSTRATIONS;return art&&art.getItem(res);}
    function itemArt(res){const src=imageFor(res);return src?'<img src="'+esc(src)+'" alt="" draggable="false">':api.icon(res);}
    function structural(){return JSON.stringify([S().cycle,S().age,data.zones,S().exp.done,S().exp.active&&[S().exp.active.z,S().exp.active.i],S().dom.ext,Object.keys(S().known),E.passPending(),S().pass,E.ruins(),S().flags]);}
    function refreshModel(){data=model(E,D);byKey=Object.fromEntries(data.nodes.map(n=>[n.key,n]));}
    function rebuild(){
      const a=S().exp.active;
      $('.mw-markers').innerHTML=data.nodes.map(n=>{
        const id=nodeId(n.key),k=esc(n.key);
        if(n.kind==='resource')return `<div class="mw-marker mw-resource" id="${id}"><button class="mw-gather" ${n.hand?'data-harv="'+n.z+':'+n.res+'"':'data-world-manage="'+n.z+':'+n.res+'"'} title="${esc(n.n)}${n.hand?' · maintenir pour récolter':' · gérer les extracteurs'}" aria-label="${esc(n.n)}">${itemArt(n.res)}</button><button class="mw-manage" data-world-manage="${n.z}:${n.res}" title="Installer ou améliorer les extracteurs : ${esc(n.n)}" aria-label="Gérer les extracteurs : ${esc(n.n)}">+</button></div>`;
        if(n.kind==='place'||n.kind==='pass')return `<button class="mw-marker mw-place-hit ${n.complete?'complete':''}" id="${id}" data-world-place="${k}" title="${esc(n.n)}" aria-label="${esc(n.n)}"><span aria-hidden="true">${n.complete?'✓':n.kind==='pass'?'↗':'◇'}</span></button>`;
        return `<button class="mw-marker mw-${n.kind}-label" id="${id}" data-world-camera="${n.kind==='camp'?'camp':n.z}" title="Se rapprocher : ${esc(n.n)}">${esc(n.n)}</button>`;
      }).join('');
      $('.mw-contours').innerHTML=data.nodes.filter(n=>n.rx).map(n=>`<g data-world-shape="${esc(n.key)}" class="${n.complete?'complete':''}"><path class="mw-outline" data-world-hit="${esc(n.key)}" d="${shape(n)}"/><path class="mw-ring" d="${shape(n)}" pathLength="1"/></g>`).join('');
      $('.mw-lands').innerHTML=data.zones.filter(z=>!['lisiere','plaine'].includes(z)).map(z=>{const b=area(z);return `<image href="assets/carnet/lands/${z==='riviere'&&S().age>=7?'riviere-vapeur':z}.webp" x="${b[0]}" y="${b[1]}" width="${b[2]-b[0]}" height="${b[3]-b[1]}" preserveAspectRatio="xMidYMid meet"/>`;}).join('');
      $('.mw-land-hits').innerHTML=data.zones.map(z=>{const b=area(z);const d=z==='lisiere'?'M280 708C298 570 467 471 660 441S1152 457 1231 680Q1284 865 1090 935Q748 1006 418 925Q257 871 280 708Z':z==='plaine'?'M128 316C149 186 278 149 434 176S666 296 576 465Q528 558 332 563Q82 545 128 316Z':`M${b[0]+30} ${(b[1]+b[3])/2}Q${b[0]} ${b[1]} ${(b[0]+b[2])/2} ${b[1]}T${b[2]-30} ${(b[1]+b[3])/2}Q${b[2]} ${b[3]} ${(b[0]+b[2])/2} ${b[3]}T${b[0]+30} ${(b[1]+b[3])/2}Z`;return `<path class="mw-land-outline" data-world-terrain="${z}" d="${d}"/>`;}).join('');
      const forest=E.ZONES.lisiere.exps[0];el.classList.toggle('mw-known',acquired(E,'lisiere',forest,0));el.classList.toggle('mw-plaine-open',E.zoneOpen('plaine'));el.classList.toggle('mw-grown',S().age>=1);
      const p=E.passInfo('plaine');$('.mw-trail').style.strokeDashoffset=1-p.frac;$('.mw-brambles').style.opacity=1-p.frac;
      $('.mw-buildings').innerHTML=data.nodes.filter(n=>n.kind==='resource'&&E.domExt(n.z,n.res)).map(n=>{const e=E.domExt(n.z,n.res),types=Object.keys(e.u).filter(t=>e.u[t]>0),t=types[types.length-1];if(!t)return '';const source=imageFor(t)||imageFor(E.extNiveaux(n.res)[0]);return source?`<image href="${esc(source)}" x="${n.x+28}" y="${n.y-115}" width="${types.some(t=>D.ITEMS[t].lv>1)?130:98}" height="110"/>`:'';}).join('');
      if(a){const n=data.nodes.find(n=>n.kind==='place'&&n.z===a.z&&n.i===a.i);if(n)$('.mw-pencil').setAttribute('d',`M750 850Q${(750+n.x)/2+35} ${(850+n.y)/2+24} ${n.x} ${n.y}`);}
      if(selected&&!byKey[selected]){$('.mw-place').hidden=true;selected=null;}
      layout();updateCard();
    }
    function saveCamera(){if(!active()||!view.every(Number.isFinite))return;S().settings.worldCamera={cycle:S().cycle,camera,view:view.slice(),zone:U.zone||'lisiere'};}
    function cameraBounds(name){
      const ratio=viewport.clientHeight/viewport.clientWidth;let cx=750,cy,w;
      if(name==='camp'){w=Math.max((S().exp.done.lisiere||0)>0?850:620,530/ratio);cy=1000-w*ratio/2;}
      else if(name==='all'){
        if(data.zones.every(z=>['lisiere','plaine'].includes(z))){w=Math.max(ratio>1?900:1480,640/ratio);cx=ratio>1?700:750;cy=1000-w*ratio/2;}
        else{const boxes=data.zones.map(area),left=Math.min(...boxes.map(b=>b[0])),right=Math.max(...boxes.map(b=>b[2])),top=Math.min(...boxes.map(b=>b[1])),bottom=Math.max(...boxes.map(b=>b[3]));w=Math.max(right-left+150,(bottom-top+150)/ratio);cx=(left+right)/2;cy=(top+bottom)/2;}
      }else if(byKey[name]){const n=byKey[name];w=Math.max(560,450/ratio);cx=n.x;cy=n.y+65;}
      else{const b=area(name);w=Math.max((b[2]-b[0])*.9,(b[3]-b[1]+80)/ratio);cx=(b[0]+b[2])/2;cy=(b[1]+b[3])/2;}
      return [cx-w/2,cy-w*ratio/2,w,w*ratio];
    }
    function focus(name,instant){
      if(!el||!viewport.clientWidth)return;
      if(name!=='camp'&&name!=='all'&&!byKey[name]&&!E.zoneOpen(name))return;
      cancelAnimationFrame(frame);camera=name;const node=byKey[name],z=node?node.z:data.zones.includes(name)?name:'lisiere';U.zone=z;
      $('.mw-title').textContent=name==='all'?'Autour du camp':E.ZONES[z].n;
      const from=view.slice(),to=cameraBounds(name),start=performance.now();
      const draw=t=>{if(!active()||!viewport.clientWidth)return;const p=instant||reduced()?1:Math.min(1,(t-start)/1050),k=p*p*(3-2*p);view=to.map((v,i)=>from[i]+(v-from[i])*k);layout();if(p<1)frame=requestAnimationFrame(draw);else saveCamera();};frame=requestAnimationFrame(draw);
    }
    function point(n){return{x:(n.x-view[0])/view[2]*viewport.clientWidth,y:(n.y-view[1])/view[3]*viewport.clientHeight};}
    function layout(){
      if(!viewport||!viewport.clientWidth||!view[2])return;world.setAttribute('viewBox',view.join(' '));
      const width=viewport.clientWidth,height=viewport.clientHeight,used=[],leaders=[];
      const ordered=data.nodes.filter(n=>n.kind!=='resource').concat(data.nodes.filter(n=>n.kind==='resource'));
      for(const n of ordered){
        const element=$('#'+nodeId(n.key)),p=point(n);if(!element)continue;
        const overview=camera==='all',hidden=p.x<30||p.x>width-30||p.y<65||p.y>height-30||(overview&&!['land','camp'].includes(n.kind))||(!overview&&n.kind==='land');
        element.classList.toggle('mw-offscreen',hidden);if(hidden)continue;
        let x=p.x,y=p.y;
        if(n.kind==='resource'){
          const collides=(xx,yy)=>xx<40||xx>width-40||yy<95||yy>height-45||(xx>width-110&&yy>height-110)||used.some(b=>Math.abs(b.x-xx)<70&&Math.abs(b.y-yy)<66);
          if(collides(x,y)){let found=false;for(const r of [20,36,52,68,84]){for(let i=0;i<8;i++){const xx=p.x+Math.cos(i*Math.PI/4)*r,yy=p.y+Math.sin(i*Math.PI/4)*r;if(!collides(xx,yy)){x=xx;y=yy;found=true;break;}}if(found)break;}}
          used.push({x,y});if(Math.hypot(x-p.x,y-p.y)>10)leaders.push(`<path d="M${p.x} ${p.y}L${x} ${y}"/>`);
        }else if(['place','pass','camp'].includes(n.kind))used.push({x,y});
        if(n.kind==='land')x=Math.max(80,Math.min(width-80,x));
        element.style.left=x+'px';element.style.top=y+'px';
      }
      $('.mw-leaders').setAttribute('viewBox',`0 0 ${width} ${height}`);$('.mw-leaders').innerHTML=leaders.join('');positionCard();
    }
    function positionCard(){
      const card=$('.mw-place'),n=byKey[selected];if(!n||card.hidden)return;
      const p=point(n),w=card.offsetWidth,h=card.offsetHeight,width=viewport.clientWidth,height=viewport.clientHeight;
      if(p.x<-40||p.x>width+40||p.y<-40||p.y>height+40){card.style.visibility='hidden';return;}card.style.visibility='';
      let top=p.y-60-h;if(top<65)top=p.y+50;card.style.top=Math.max(65,Math.min(height-h-10,top))+'px';card.style.left=Math.max(10,Math.min(width-w-10,p.x-w/2))+'px';
    }
    function choose(key,bring){
      const n=byKey[key];if(!n)return;selected=key;closeDrawer();$('.mw-place').hidden=false;resource=null;
      const p=point(n);if(bring||p.x<55||p.x>viewport.clientWidth-55||p.y<90||p.y>viewport.clientHeight-65)focus(key);
      updateCard();highlight();
    }
    function highlight(){
      for(const n of data.nodes){const e=$('#'+nodeId(n.key));if(e)e.classList.toggle('selected',n.key===resource);}
      el.querySelectorAll('[data-world-shape]').forEach(g=>g.classList.toggle('selected',g.dataset.worldShape===selected&&!$('.mw-place').hidden));
    }
    function updateCard(){
      const n=byKey[selected];if(!n||$('.mw-place').hidden)return;
      $('.mw-place h3').textContent=n.n;const button=$('[data-world-act]'),info=$('.mw-place-info');button.disabled=false;
      if(n.kind==='pass'){const p=E.passInfo(n.target),left=Object.entries(p.left).map(([id,q])=>fmt(q)+' '+D.ITEMS[id].n.toLowerCase()).join(', ');$('.mw-place .kicker').textContent='Ouvrir un chemin';info.textContent=p.lieux&&p.lieux.left.length?'Explore d’abord les lieux de la terre précédente.':left?'Il reste : '+left: 'Le passage est prêt.';button.textContent='Frayer le chemin · '+Math.round(p.frac*100)+' %';button.disabled=!p.can||!!(p.lieux&&p.lieux.left.length);}
      else{const x=E.ZONES[n.z].exps[n.i],a=S().exp.active,busy=a&&a.z===n.z&&a.i===n.i;$('.mw-place .kicker').textContent=n.complete?'Une trace découverte':busy?'Le crayon suit tes pas':'Une trace à suivre';
        if(n.complete||(n.acquired&&!n.canStart)){info.textContent='Ce lieu est conservé dans le carnet.';button.textContent=plate(n)?'Ouvrir l’illustration':'Voir le Journal';}
        else{const need=x.need?typeof x.need==='string'&&D.ITEMS[x.need]?D.ITEMS[x.need].n:x.hidden||'Un prérequis reste à découvrir.':'';const cost=x.cost?Object.entries(x.cost).map(([id,q])=>q+' '+D.ITEMS[id].n.toLowerCase()).join(', '):'';info.textContent=busy?'La progression se dessine autour du lieu.':[need,cost,fmtTime(x.dur/E.expMult())].filter(Boolean).join(' · ');button.textContent=busy?'Exploration en cours…':'Explorer →';button.disabled=!!a||!n.canStart||!E.canExplore(n.z,n.i);}
      }positionCard();
    }
    function openDrawer(kind,title,content){drawer=kind;$('.mw-drawer').hidden=false;$('.mw-drawer h3').textContent=title;$('.mw-drawer-body').innerHTML=content;$('.mw-place').hidden=true;drawerSig=api.legacySig();$('[data-world-close-drawer]').focus({preventScroll:true});}
    function closeDrawer(){if(!el)return;$('.mw-drawer').hidden=true;drawer=null;}
    function legacyContent(){return '<div class="mw-drawer-nav"><button class="btn" data-world-pages title="Consulter les illustrations découvertes">Illustrations</button><button class="btn" data-world-camera="all" title="Voir les terres connues">Vue d’ensemble</button><button class="btn" data-world-zoom="in" title="Se rapprocher" aria-label="Se rapprocher">+</button><button class="btn" data-world-zoom="out" title="Prendre du recul" aria-label="Prendre du recul">−</button></div>'+api.legacyView();}
    function details(kind){openDrawer('legacy',kind==='gestion'?'Le Domaine':'Objectif et progression',legacyContent());}
    function zones(){openDrawer('zones','Les terres connues','<button class="btn mw-zone-link" data-world-camera="all" title="Voir l’ensemble des terres connues">Vue d’ensemble ↗</button>'+data.zones.map(z=>`<button class="btn mw-zone-link" data-world-camera="${z}" title="Se rapprocher : ${esc(E.ZONES[z].n)}">${esc(E.ZONES[z].n)}</button>`).join(''));}
    function pages(){
      const list=data.nodes.filter(n=>n.kind==='place'&&n.acquired&&plate(n));openDrawer('pages','Les pages rapportées',list.length?list.map(n=>`<button class="mw-study" data-world-study="${esc(n.key)}" title="Ouvrir : ${esc(n.n)}"><img src="${plate(n)}" alt=""><span>${esc(n.n)}</span></button>`).join(''):'<p>Le carnet attend ses premières découvertes.</p>');
    }
    function study(n){if(!n||!n.acquired||!plate(n))return;openModal({html:'<div class="kicker">Une page du Carnet</div><h2>'+esc(n.n)+'</h2><img class="carnet-plate-detail" src="'+plate(n)+'" alt="'+esc(n.n)+'"><div class="acts"><button class="btn pri" data-m="close">Refermer</button></div>'});}
    function nextTrace(){
      const a=S().exp.active;let n=a&&data.nodes.find(n=>n.kind==='place'&&n.z===a.z&&n.i===a.i);
      const g=E.guide(),ob=g&&g.ob;
      if(!n&&ob&&ob.k==='exp')n=data.nodes.find(n=>n.kind==='place'&&n.z===ob.z&&n.id===ob.x);
      if(!n&&ob&&ob.k==='pass')n=data.nodes.find(n=>n.kind==='pass'&&n.target===ob.z);
      if(n)choose(n.key,true);else details('objectif');
    }
    function act(){
      const n=byKey[selected];if(!n)return;
      if(n.kind==='pass'){api.pour(n.target,$('[data-world-act]'));return;}
      if(n.complete||(n.acquired&&!n.canStart)){if(plate(n))study(n);else api.setTab('journal');return;}
      api.explore(n.z,n.cote?n.id:undefined);
      if(S().exp.active){$('.mw-place').hidden=true;stopWriting();if(S().settings.sound&&A.pencil)pencilStop=A.pencil(Math.min(8,S().exp.active.dur/1000));}signature='';live();
    }
    function stopWriting(){if(pencilStop){pencilStop();pencilStop=null;}}
    function resizeCanvas(){if(!viewport.clientWidth)return;dpr=Math.min(2,root.devicePixelRatio||1);canvas.width=Math.round(viewport.clientWidth*dpr);canvas.height=Math.round(viewport.clientHeight*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);}
    const COLORS={bois:['#775132','#af8956','#c1a87a'],fibre:['#6e7545','#9a9b66','#b3a879'],caillou:['#6f6b60','#969083','#b7ad97'],os:['#aaa08b','#cbbd9e','#8b8069'],cuir:['#8c6a49','#b08f66','#6b5038']};
    function drawMatter(t){
      if(!active()||!canvas.isConnected){particles=[];particleFrame=0;return;}
      const dt=Math.min(.04,(t-particleAt)/1000);particleAt=t;ctx.clearRect(0,0,viewport.clientWidth,viewport.clientHeight);particles=particles.filter(p=>p.age<p.life);
      for(const p of particles){p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=180*dt;p.a+=p.spin*dt;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.a);ctx.globalAlpha=Math.max(0,1-p.age/p.life)*.85;ctx.fillStyle=p.c;ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);ctx.restore();}
      if(particles.length)particleFrame=requestAnimationFrame(drawMatter);else{particleFrame=0;ctx.clearRect(0,0,viewport.clientWidth,viewport.clientHeight);}
    }
    function harvest(button,amount,crit){
      if(!el||!button.closest('.mw-resource'))return false;
      const key=button.dataset.harv,i=key.indexOf(':'),res=key.slice(i+1),z=key.slice(0,i),target=button.querySelector('img,svg'),rc=button.getBoundingClientRect(),vr=viewport.getBoundingClientRect(),p={x:rc.left+rc.width/2-vr.left,y:rc.top+rc.height/2-vr.top};resource='r:'+z+':'+res;
      if(performance.now()-lastSound>55){A.tap(res);lastSound=performance.now();}if(!reduced())api.vibe(crit?12:5);
      if(target){target.getAnimations().forEach(a=>a.cancel());if(!reduced())target.animate([{transform:'scale(1) rotate(0)'},{transform:'translateY(2px) scale(.9) rotate(-5deg)',offset:.16},{transform:'translateY(-3px) scale('+ (crit?1.2:1.12)+') rotate(3deg)',offset:.5},{transform:'scale(1) rotate(0)'}],{duration:crit?330:240,easing:'ease-out'});}
      const now=performance.now();let g=gains.get(key);
      if(g&&now-g.at<160&&g.element.isConnected){g.n+=amount;g.at=now;g.element.textContent='+'+fmt(g.n);if(reduced()){clearTimeout(g.timer);g.timer=setTimeout(()=>g.element.remove(),650);}}
      else{while(fx.children.length>=8)fx.firstElementChild.remove();const span=document.createElement('span');span.className='mw-gain'+(crit?' critical':'');span.textContent='+'+fmt(amount);span.style.left=(p.x-12)+'px';span.style.top=(p.y-42)+'px';fx.append(span);g={element:span,n:amount,at:now};gains.set(key,g);if(reduced())g.timer=setTimeout(()=>span.remove(),650);else{const a=span.animate([{opacity:0,transform:'translateY(0) scale(.85)'},{opacity:1,transform:'translateY(-8px) scale(1.08)',offset:.18},{opacity:1,transform:'translateY(-23px) scale(1)',offset:.68},{opacity:0,transform:'translateY(-44px)'}],{duration:850,easing:'ease-out'});a.onfinish=()=>span.remove();}}
      if(!reduced()){
        const colors=COLORS[res]||COLORS.caillou,count=crit?12:7;for(let j=0;j<count;j++){const a=j/count*Math.PI*2+Math.random()*.3,speed=45+Math.random()*65;particles.push({x:p.x,y:p.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed-32,age:0,life:.4+Math.random()*.2,w:res==='fibre'?2:3+Math.random()*3,h:res==='fibre'?8:3,a:Math.random()*Math.PI,spin:Math.random()*5-2.5,c:colors[j%colors.length]});}if(particles.length>90)particles.splice(0,particles.length-90);if(!particleFrame){particleAt=performance.now();particleFrame=requestAnimationFrame(drawMatter);}
      }
      if(now-lastAnnounce>600){$('.mw-announcement').textContent=D.ITEMS[res].n+' : +'+fmt(amount);lastAnnounce=now;}highlight();return true;
    }
    function bind(){
      el.addEventListener('click',ev=>{
        if(ev.detail&&performance.now()-draggedAt<180){ev.stopPropagation();return;}
        const b=ev.target.closest('button');let handled=true;
        if(b&&b.dataset.worldPlace)choose(b.dataset.worldPlace);
        else if(b&&b.dataset.worldManage){resource='r:'+b.dataset.worldManage;api.stopHold();api.extSheet(b.dataset.worldManage);highlight();}
        else if(b&&b.dataset.worldCamera){$('.mw-place').hidden=true;closeDrawer();focus(b.dataset.worldCamera);}
        else if(b&&b.dataset.worldZoom){closeDrawer();cancelAnimationFrame(frame);const cx=view[0]+view[2]/2,cy=view[1]+view[3]/2,w=Math.max(420,Math.min(16000,view[2]*(b.dataset.worldZoom==='in'?.8:1.25)));view=[cx-w/2,cy-w*viewport.clientHeight/viewport.clientWidth/2,w,w*viewport.clientHeight/viewport.clientWidth];camera='free';$('.mw-place').hidden=true;layout();saveCamera();}
        else if(b&&b.hasAttribute('data-world-goal'))nextTrace();
        else if(b&&b.hasAttribute('data-world-zone-list'))zones();
        else if(b&&b.dataset.worldPanel)details(b.dataset.worldPanel);
        else if(b&&b.hasAttribute('data-world-pages'))pages();
        else if(b&&b.hasAttribute('data-world-close-drawer'))closeDrawer();
        else if(b&&b.hasAttribute('data-world-close-place')){$('.mw-place').hidden=true;selected=null;highlight();}
        else if(b&&b.hasAttribute('data-world-act'))act();
        else if(b&&b.dataset.worldStudy)study(byKey[b.dataset.worldStudy]);
        else if(b&&b.classList.contains('mw-discovery'))study(discovery);
        else if(ev.target.closest('[data-world-hit]'))choose(ev.target.closest('[data-world-hit]').dataset.worldHit);
        else if(ev.target.closest('[data-world-terrain]')){selected=null;$('.mw-place').hidden=true;focus(ev.target.closest('[data-world-terrain]').dataset.worldTerrain);}
        else handled=false;
        if(handled)ev.stopPropagation();
      });
      for(const event of ['pointerover','focusin','pointerout','focusout'])el.addEventListener(event,ev=>{
        const on=event==='pointerover'||event==='focusin',target=ev.target.closest('[data-world-place],[data-world-hit]');
        if(target){const key=target.dataset.worldPlace||target.dataset.worldHit,g=Array.from(el.querySelectorAll('[data-world-shape]')).find(g=>g.dataset.worldShape===key);if(g)g.classList.toggle('hovered',on);}
        const land=ev.target.closest('[data-world-terrain]');if(land)land.classList.toggle('hovered',on);
      });
      viewport.addEventListener('pointerdown',ev=>{if(ev.button!==0||ev.target.closest('button,.mw-drawer,.mw-place'))return;cancelAnimationFrame(frame);drag={x:ev.clientX,y:ev.clientY,view:view.slice(),id:ev.pointerId,moved:false};});
      viewport.addEventListener('pointermove',ev=>{if(!drag)return;const dx=ev.clientX-drag.x,dy=ev.clientY-drag.y;if(!drag.moved&&Math.hypot(dx,dy)<7)return;if(!drag.moved){drag.moved=true;viewport.setPointerCapture(ev.pointerId);$('.mw-place').hidden=true;}const v=drag.view;view=[Math.max(-9000,Math.min(9000,v[0]-dx*v[2]/viewport.clientWidth)),Math.max(-12000,Math.min(2500,v[1]-dy*v[3]/viewport.clientHeight)),v[2],v[3]];camera='free';layout();});
      const release=()=>{if(drag&&drag.moved){draggedAt=performance.now();saveCamera();}drag=null;};viewport.addEventListener('pointerup',release);viewport.addEventListener('pointercancel',release);
      viewport.addEventListener('keydown',ev=>{if(ev.target!==viewport)return;const d={ArrowLeft:[-45,0],ArrowRight:[45,0],ArrowUp:[0,-45],ArrowDown:[0,45]}[ev.key];if(!d)return;ev.preventDefault();cancelAnimationFrame(frame);view[0]+=d[0];view[1]+=d[1];camera='free';layout();saveCamera();});
    }
    function mount(container){
      host=container;if(!container.querySelector('#monde')){suspend();if(observer)observer.disconnect();container.innerHTML=html();el=container.querySelector('#monde');viewport=$('.monde-viewport');world=$('.monde-world');fx=$('.mw-feedback');canvas=$('.mw-matter');ctx=canvas.getContext('2d');bind();signature='';refreshModel();rebuild();
        const saved=S().settings.worldCamera;if(saved&&saved.cycle===S().cycle&&Array.isArray(saved.view)&&saved.view.length===4&&saved.view.every(Number.isFinite)&&saved.view[2]>=400&&saved.view[2]<=20000){camera=saved.camera||'free';if(!['camp','all','free'].includes(camera)&&!byKey[camera]&&!data.zones.includes(camera))camera='camp';view=camera==='free'?saved.view.slice():cameraBounds(camera);}else{camera=data.zones.length>2?data.zones[data.zones.length-1]:'camp';view=cameraBounds(camera);}
        observer=new ResizeObserver(()=>{if(!viewport.clientWidth||!active())return;if(camera!=='free')view=cameraBounds(camera);else{const cx=view[0]+view[2]/2,cy=view[1]+view[3]/2;view[3]=view[2]*viewport.clientHeight/viewport.clientWidth;view[0]=cx-view[2]/2;view[1]=cy-view[3]/2;}resizeCanvas();layout();});observer.observe(viewport);resizeCanvas();layout();
      }live();
    }
    function live(){
      if(!el||!el.isConnected||!active()||!viewport.clientWidth)return;
      if(changedState!==S()||lastCycle!==S().cycle){if(changedState)api.stopHold();changedState=S();lastCycle=S().cycle;signature='';selected=null;resource=null;closeDrawer();$('.mw-place').hidden=true;refreshModel();const saved=S().settings.worldCamera;if(!saved||saved.cycle!==S().cycle)focus(data.zones.length>2?data.zones[data.zones.length-1]:'camp',true);}
      refreshModel();const sig=structural();if(sig!==signature&&!U.holding){signature=sig;rebuild();}
      const a=S().exp.active;el.classList.toggle('mw-exploring',!!a);
      for(const n of data.nodes.filter(n=>n.kind==='place')){const g=el.querySelector('[data-world-shape="'+n.key+'"]'),button=$('#'+nodeId(n.key));if(!g||!button)continue;const running=a&&a.z===n.z&&a.i===n.i;g.classList.toggle('active',!!running);button.classList.toggle('active',!!running);if(running){const p=Math.min(1,Math.max(0,(Date.now()-a.t0)/a.dur));g.querySelector('.mw-ring').style.strokeDashoffset=1-p;button.querySelector('span').textContent=fmtTime(Math.max(0,(a.dur-Date.now()+a.t0)/1000));$('.mw-pencil').style.strokeDashoffset=1-p;}}
      if(!a){$('.mw-pencil').style.strokeDashoffset=1;stopWriting();}
      for(const n of data.nodes.filter(n=>n.kind==='resource')){const b=$('#'+nodeId(n.key)+' .mw-gather');if(b)b.setAttribute('aria-label',(n.hand?'Récolter ':'Gérer ')+n.n+' · '+fmt(E.count(n.res))+' en réserve');}
      if(drawer==='legacy'&&!U.holding&&drawerSig!==api.legacySig()){const body=$('.mw-drawer-body'),sc=$('.mw-drawer').scrollTop;body.innerHTML=legacyContent();$('.mw-drawer').scrollTop=sc;drawerSig=api.legacySig();}
      if(discovery&&performance.now()-discoveryAt>4400){$('.mw-discovery').hidden=true;discovery=null;}
      if(selected&&!$('.mw-place').hidden)updateCard();
    }
    function suspend(){cancelAnimationFrame(frame);cancelAnimationFrame(particleFrame);particleFrame=0;particles=[];gains.clear();if(fx)fx.replaceChildren();if(ctx&&canvas)ctx.clearRect(0,0,canvas.width,canvas.height);stopWriting();drag=null;}
    E.on('expdone',r=>{signature='';stopWriting();if(!active()||!el||r.silent)return;refreshModel();const n=data.nodes.find(n=>n.kind==='place'&&n.z===r.z&&n.id===r.x.id);if(n&&plate(n)){discovery=n;discoveryAt=performance.now();const b=$('.mw-discovery');b.querySelector('img').src=plate(n);b.querySelector('span').textContent=n.n;b.hidden=false;}if(n&&n.id==='chene')focus('camp');});
    E.on('zone',z=>{signature='';if(active()&&el){refreshModel();rebuild();$('.mw-place').hidden=true;selected=null;focus(z==='plaine'?'all':z);}});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();});root.addEventListener('blur',()=>api.stopHold());
    return {html,mount,live,focus,harvest,suspend,model:()=>data,get camera(){return camera;},get view(){return view.slice();},get particleCount(){return particles.length;}};
  }
  const API={create,model,area,acquired};if(typeof module!=='undefined'&&module.exports)module.exports=API;else root.EclatMonde=API;
})(typeof window!=='undefined'?window:globalThis);
