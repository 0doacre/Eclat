/* Contrat de composition du prototype. Les régions réservées ne sont pas
 * révélées au joueur. Le fond V2 reste une étude aplatie, pas le terrain final. */
(function(root){
  'use strict';
  const layout={
    version:1,
    projection:'carnet-oblique',
    origin:{id:'camp',x:750,y:850},
    reference:{path:'docs/art-direction/domaine-monde-v2/assets/monde.webp',width:1500,height:1000,role:'reference-composite'},
    layers:[
      {id:'paper',z:0},
      {id:'terrain',z:10},
      {id:'water',z:20},
      {id:'vegetation',z:30},
      {id:'paths',z:40},
      {id:'places',z:50},
      {id:'camp',z:60},
      {id:'installations',z:70},
      {id:'annotations',z:80},
      {id:'interaction',z:90}
    ],
    regions:{
      lisiere:{scale:'ground',status:'prototype',bounds:[200,430,1300,990]},
      plaine:{scale:'ground',status:'prototype',bounds:[90,90,650,560]},
      riviere:{scale:'ground',status:'reserved',bounds:[650,80,1130,440]},
      collines:{scale:'ground',status:'reserved',bounds:[1100,-40,1680,450]},
      mine:{scale:'ground',status:'reserved',bounds:[1350,-550,2050,120]},
      caveau:{scale:'underground',status:'reserved',parent:'mine',bounds:[1470,-310,1770,-30]},
      desert:{scale:'ground',status:'reserved',bounds:[150,-1500,1350,-450]},
      gisement:{scale:'ground',status:'reserved',bounds:[-1200,-1900,50,-500]},
      montagnes:{scale:'ground',status:'reserved',bounds:[950,-2850,2800,-1150]},
      orbite:{scale:'space',status:'reserved',parent:'ground',bounds:[-1000,-700,1000,700]},
      lune:{scale:'space',status:'reserved',parent:'orbite',bounds:[900,-1500,2300,-100]},
      mercure:{scale:'space',status:'reserved',parent:'orbite',bounds:[-2600,-2200,-800,-400]}
    },
    anchors:{
      camp:{x:750,y:850},
      chene:{x:735,y:558},
      grotte:{x:435,y:662},
      sentier:{x:486,y:602},
      champ_os:{x:390,y:280},
      tumulus:{x:250,y:150},
      bois:{x:980,y:650},
      fibre:{x:598,y:855},
      caillou:{x:910,y:753},
      os:{x:435,y:345},
      cuir:{x:245,y:450}
    }
  };
  if(typeof module!=='undefined'&&module.exports)module.exports=layout;
  else root.EclatWorldLayout=layout;
})(typeof window!=='undefined'?window:globalThis);
