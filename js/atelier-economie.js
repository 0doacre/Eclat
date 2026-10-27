/* Une chaîne économique expérimentale : établi, ouvrier et marchand de lanières.
 * Aucun accès aux ventes, demandes ou à la réputation du troqueur. */
(function(root){
  "use strict";
  const finite=(v,f=0)=>Number.isFinite(Number(v))?Math.max(0,Number(v)):f;
  const PERIOD=60,MIN_QUOTA=20;
  // Barème marginal : découper une vente ne réduit pas sa taxe.
  function quote(n,sold,quota,price){
    n=Math.max(0,Math.floor(finite(n)));sold=finite(sold);quota=Math.max(1,Math.floor(finite(quota,MIN_QUOTA)));
    let left=n,tax=0,at=sold;
    while(left>0){const band=Math.min(4,Math.floor(at/quota)),rate=(band+1)/10;
      const take=band===4?left:Math.min(left,(band+1)*quota-at);
      tax+=take*price*rate;at+=take;left-=take;
    }
    return {n,gross:n*price,tax,net:n*price-tax};
  }
  function attach(E){
    const price=()=>E.value("laniere"),wage=()=>price()*E.item("laniere").r[2]*.25;
    const hire=()=>price()*20;
    const best=()=>E.equipmentChoices("laniere").find(x=>x.ready);
    const duration=()=>{const c=best();return c?Math.max(.1,E.handTime("laniere",c)*5):Infinity;};
    const capacity=()=>Math.max(MIN_QUOTA,Math.floor((st().hired?60/duration()*E.item("laniere").r[2]:0)+60*Math.max(0,E.production().find(x=>x.id==="laniere")?.in||0)));
    function st(){
      const s=E.state;if(s.atelierEconomy)return s.atelierEconomy;
      return s.atelierEconomy={v:1,hired:false,working:false,budget:0,progress:0,merchant:false,reserve:20,clock:0,saleClock:0,quota:MIN_QUOTA,sold:0,totalSold:0,gross:0,tax:0,net:0,wages:0,produced:0};
    }
    function sanitize(){
      const raw=E.state.atelierEconomy;delete E.state.atelierEconomy;const s=st();
      if(!raw||typeof raw!=="object")return;
      for(const k of ["budget","progress","reserve","clock","saleClock","quota","sold","totalSold","gross","tax","net","wages","produced"])s[k]=finite(raw[k],s[k]);
      for(const k of ["hired","working","merchant"])s[k]=raw[k]===true;
      s.reserve=Math.min(100000,Math.floor(s.reserve));s.clock%=PERIOD;s.saleClock%=5;s.quota=Math.max(MIN_QUOTA,Math.floor(s.quota));s.progress=Math.min(1,s.progress);
      if(!s.hired)s.working=false;
    }
    const loaded=E.load;E.load=function(){const r=loaded.apply(this,arguments);sanitize();return r;};
    E.merchantQuote=n=>quote(n,st().sold,st().quota,price());
    E.merchantSell=function(n){
      const s=st();if(!E.state.known.laniere)return {ok:false,why:"unknown"};
      n=Math.min(Math.floor(finite(n)),Math.max(0,Math.floor(E.count("laniere")-s.reserve)));
      if(!n)return {ok:false,why:"reserve"};
      const q=E.merchantQuote(n);E.add("laniere",-n);E.state.ecus+=q.net;
      s.sold+=n;s.totalSold+=n;s.gross+=q.gross;s.tax+=q.tax;s.net+=q.net;
      return {ok:true,...q};
    };
    E.merchantConfigure=function(on,reserve){const s=st();s.merchant=on===true;s.reserve=Math.min(100000,Math.floor(finite(reserve,s.reserve)));return true;};
    E.workerHire=function(){const s=st();if(s.hired)return {ok:false,why:"hired"};
      if(E.count("etabli_amenage")<1||!E.state.known.laniere||!best())return {ok:false,why:"post"};
      if(E.state.ecus+1e-9<hire())return {ok:false,why:"ecus"};
      E.state.ecus-=hire();s.hired=true;return {ok:true};
    };
    E.workerFund=function(amount){const s=st();amount=finite(amount);if(!s.hired||!amount||E.state.ecus+1e-9<amount)return {ok:false};E.state.ecus-=amount;s.budget+=amount;return {ok:true};};
    E.workerWithdraw=function(){const s=st();if(s.working)return {ok:false};E.state.ecus+=s.budget;s.budget=0;return {ok:true};};
    E.workerSet=function(on){const s=st();s.working=s.hired&&on===true;return s.working;};
    function status(){const s=st();if(!s.hired)return "À recruter";if(!s.working)return "En pause";
      if(E.count("etabli_amenage")<1)return "Établi à aménager";
      if(!E.state.known.laniere||!best())return "Outil ou recette manquant";
      if(s.budget+1e-9<wage())return "Avance de salaire épuisée";
      if(E.missingFor("laniere",1))return "En attente de peaux";
      return "Découpe des lanières";
    }
    E.atelierEconomyInfo=function(){const s=st();return {...s,status:status(),wage:wage(),hire:hire(),price:price(),duration:duration(),tool:best()?.equipment||null,nextRate:Math.min(50,(Math.floor(s.sold/s.quota)+1)*10),period:PERIOD};};
    E.atelierEconomyStep=function(dt){
      const s=st();let left=dt;
      // Même ordre d'opérations en ligne et dans les pas du rattrapage hors ligne.
      while(left>1e-9){const d=Math.min(left,1,PERIOD-s.clock,5-s.saleClock);left-=d;s.clock+=d;s.saleClock+=d;
        if(status()==="Découpe des lanières"){
          s.progress+=d/duration();
          while(s.progress>=1-1e-9&&status()==="Découpe des lanières"){
            const r=E.craft("laniere",1,true);if(!r.ok)break;
            s.budget=Math.max(0,s.budget-wage());s.wages+=wage();s.produced+=r.n;s.progress=Math.max(0,s.progress-1);
          }
          s.progress=Math.min(1,s.progress);
        }
        if(s.saleClock>=5-1e-9){s.saleClock=0;if(s.merchant)E.merchantSell(E.count("laniere"));}
        if(s.clock>=PERIOD-1e-9){s.clock=0;s.sold=0;s.quota=capacity();}
      }
    };
    st();
  }
  const API={attach,quote};root.EclatAtelierEconomy=API;
  if(typeof module!=="undefined"&&module.exports)module.exports=API;
})(typeof window!=="undefined"?window:globalThis);
