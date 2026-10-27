#!/usr/bin/env node
/* Comparaison de propositions, sans éditer js/data.js ni les sauvegardes.
 * Chaque processus applique une variante uniquement à sa copie mémoire du contenu.
 * node tools/essai-equilibrage.js B memoire > mesures.json
 * VALIDATE=1 node tools/essai-equilibrage.js B : cohérence du contenu expérimental.
 * A : jalons et quartz direct ; B : abrasif de quartz ; C : B + volumes spatiaux réduits.
 * Voir docs/revue/propositions-equilibrage.md pour les hypothèses et leurs limites. */
'use strict';
const path=require('path'); const root=path.resolve(__dirname,'..'),D=require(root+'/js/data');
const variante=process.argv[2]||'actuel',profil=process.argv[3]||'memoire';
if(!['base','memoire'].includes(profil))throw Error('profil : base ou memoire');
if(!['actuel','A','B','C'].includes(variante))throw Error('variante');
if(variante!=='actuel'){
 D.ITEMS.chariot.a=5;D.ITEMS.quartz.a=5;D.ITEMS.tamis.a=5;
 const O=D.OBJECTIVES,blocks=[];
 for(let i=O.length-1;i>=0;i--) if(Array.isArray(O[i])&&O[i][0]==='chariot'||O[i].k==='pass'&&O[i].z==='desert') blocks.unshift(...O.splice(i,1));
 let j=O.findIndex(o=>Array.isArray(o)&&o[0]==='lingot_fer');O.splice(j+1,0,...blocks);
 j=O.findIndex(o=>Array.isArray(o)&&o[0]==='enclume_pierre');O.splice(j+1,0,['plaque_cuivre','Martèle une première plaque de cuivre.'],['lingot_etain','Fonds la cassitérite pour obtenir de l’étain.'],['charbonniere','Construis une meule de charbonnier pour alimenter les fontes.']);
 j=O.findIndex(o=>Array.isArray(o)&&o[0]==='ordinateur');O.splice(j+1,0,['chaine','Construis une ligne d’assemblage avant les grands chantiers.']);
 if(variante==='A')D.ITEMS.lentille.r[1]={verre:1,quartz:1};
 else{
  D.ITEMS.poudre_quartz={n:'Poudre de quartz',sym:'⋄',col:'#d9d4f0',a:5,t:'comp',r:['tailler',{quartz:2},4],u:'Sert au polissage des lentilles et aux briques réfractaires.',d:'Un abrasif minéral fin.',h:'Réduis les cristaux en grains fins pour polir le verre.'};
  D.ITEMS.lentille.r[1]={verre:1,poudre_quartz:1};
  D.ITEMS.brique_refr.r[1]={argile:2,sable:1,poudre_quartz:1};
  j=O.findIndex(o=>Array.isArray(o)&&o[0]==='lunette');O.splice(j,0,['poudre_quartz','Prépare un abrasif pour polir les lentilles.']);
 }
 if(variante==='C'){
  D.ITEMS.fusee.r[1].composite=300;
  D.PASSAGES.orbite.cost.composite=600;
  D.PASSAGES.lune.cost.composite=1800;
 }
}
if(process.env.VALIDATE==='1') { require('./validate'); process.exit(0); }
const engine=require(root+'/js/engine'),original=engine.createEngine,events=[];
engine.createEngine=(...a)=>{const E=original(...a);E.on('age',age=>events.push({age,t:E.state.stats.play/60}));return E;};
const {play,lire}=require(root+'/tools/sim-passages');
const args=profil==='memoire'?['--minutes','240','--mem','recolte=2,extr=2,mains=2']:['--minutes','360'];
const r=play(lire(args)),entrees=[{age:0,t:0},...events];
const out={variante,profil,options:args,ages:entrees.map((e,i)=>({age:D.AGES[e.age].id,entree:e.t,duree:(entrees[i+1]?entrees[i+1].t:r.minutes)-e.t,termine:!!entrees[i+1]})),passages:r.rows.map(x=>({z:x.z,t:x.t,age:D.AGES[x.age].id})),mur:r.mur,objectif:r.E.objective(),gels:r.gels};
console.log(JSON.stringify(out,null,2));
