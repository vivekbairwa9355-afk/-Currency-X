// country-code : currency-code  (190+ countries)
const PAIRS = "af:AFN,al:ALL,dz:DZD,ad:EUR,ao:AOA,ag:XCD,ar:ARS,am:AMD,au:AUD,at:EUR,az:AZN,bs:BSD,bh:BHD,bd:BDT,bb:BBD,by:BYN,be:EUR,bz:BZD,bj:XOF,bt:BTN,bo:BOB,ba:BAM,bw:BWP,br:BRL,bn:BND,bg:BGN,bf:XOF,bi:BIF,cv:CVE,kh:KHR,cm:XAF,ca:CAD,cf:XAF,td:XAF,cl:CLP,cn:CNY,co:COP,km:KMF,cg:XAF,cd:CDF,cr:CRC,ci:XOF,hr:EUR,cu:CUP,cy:EUR,cz:CZK,dk:DKK,dj:DJF,dm:XCD,do:DOP,ec:USD,eg:EGP,sv:USD,gq:XAF,er:ERN,ee:EUR,sz:SZL,et:ETB,fj:FJD,fi:EUR,fr:EUR,ga:XAF,gm:GMD,ge:GEL,de:EUR,gh:GHS,gr:EUR,gd:XCD,gt:GTQ,gn:GNF,gw:XOF,gy:GYD,ht:HTG,hn:HNL,hk:HKD,hu:HUF,is:ISK,in:INR,id:IDR,ir:IRR,iq:IQD,ie:EUR,il:ILS,it:EUR,jm:JMD,jp:JPY,jo:JOD,kz:KZT,ke:KES,ki:AUD,kp:KPW,kr:KRW,kw:KWD,kg:KGS,la:LAK,lv:EUR,lb:LBP,ls:LSL,lr:LRD,ly:LYD,li:CHF,lt:EUR,lu:EUR,mo:MOP,mg:MGA,mw:MWK,my:MYR,mv:MVR,ml:XOF,mt:EUR,mh:USD,mr:MRU,mu:MUR,mx:MXN,fm:USD,md:MDL,mc:EUR,mn:MNT,me:EUR,ma:MAD,mz:MZN,mm:MMK,na:NAD,nr:AUD,np:NPR,nl:EUR,nz:NZD,ni:NIO,ne:XOF,ng:NGN,mk:MKD,no:NOK,om:OMR,pk:PKR,pw:USD,pa:PAB,pg:PGK,py:PYG,pe:PEN,ph:PHP,pl:PLN,pt:EUR,qa:QAR,ro:RON,ru:RUB,rw:RWF,kn:XCD,lc:XCD,vc:XCD,ws:WST,sm:EUR,st:STN,sa:SAR,sn:XOF,rs:RSD,sc:SCR,sl:SLE,sg:SGD,sk:EUR,si:EUR,sb:SBD,so:SOS,za:ZAR,ss:SSP,es:EUR,lk:LKR,sd:SDG,sr:SRD,se:SEK,ch:CHF,sy:SYP,tw:TWD,tj:TJS,tz:TZS,th:THB,tl:USD,tg:XOF,to:TOP,tt:TTD,tn:TND,tr:TRY,tm:TMT,tv:AUD,ug:UGX,ua:UAH,ae:AED,gb:GBP,us:USD,uy:UYU,uz:UZS,vu:VUV,va:EUR,ve:VES,vn:VND,ye:YER,zm:ZMW,zw:ZWG,eu:EUR";

let regionNames, currencyNames;
try{ regionNames = new Intl.DisplayNames(["en"],{type:"region"}); currencyNames = new Intl.DisplayNames(["en"],{type:"currency"}); }catch(e){}
const safe = (dn,v) => { try{ return (dn && dn.of(v.toUpperCase())) || v.toUpperCase(); }catch(e){ return v.toUpperCase(); } };

const COUNTRIES = PAIRS.split(",").map(p => {
  const [cc,code] = p.split(":");
  return {cc, code, country: safe(regionNames,cc), cur: safe(currencyNames,code)};
}).sort((a,b) => a.country.localeCompare(b.country));
const byCC = cc => COUNTRIES.find(c => c.cc === cc);

// Approximate offline fallback rates per 1 USD (live API overrides these)
let rates = {USD:1,EUR:.92,GBP:.79,INR:83.5,JPY:150,CNY:7.25,AUD:1.53,CAD:1.37,CHF:.88,AED:3.6725,SAR:3.75,KWD:.31,BHD:.376,OMR:.385,QAR:3.64,SGD:1.35,HKD:7.8,NZD:1.66,KRW:1350,THB:36,MYR:4.7,IDR:15700,PKR:278,BDT:110,LKR:320,NPR:133,RUB:92,BRL:5,MXN:17.5,ZAR:18.7,TRY:32,SEK:10.6,NOK:10.8,DKK:6.9,PLN:4,EGP:48,NGN:1500,PHP:56,VND:25000,JOD:.709};
const state = {from:"us", to:"in"};
const $ = id => document.getElementById(id);
const flag = cc => `https://flagcdn.com/w80/${cc}.png`;
const fmt = (n,d=4) => n.toLocaleString(undefined,{maximumFractionDigits:d});

async function loadRates(){
  try{
    const r = await fetch("https://open.er-api.com/v6/latest/USD");
    const d = await r.json();
    if(d.result === "success"){ rates = {...rates, ...d.rates}; $("statUpdated").textContent = new Date(d.time_last_update_utc).toLocaleString(undefined,{dateStyle:"medium",timeStyle:"short"}); }
  }catch(e){ $("statUpdated").textContent = "Offline – saved rates"; }
  buildTicker(); convert();
}

function getRate(){ const a = rates[byCC(state.from).code], b = rates[byCC(state.to).code]; return (a && b) ? b/a : null; }

function convert(save=false){
  const amt = parseFloat($("amount").value) || 0;
  const f = byCC(state.from), t = byCC(state.to), rate = getRate();
  if(rate === null){ $("resLine").textContent = "Rate not available"; $("rateLine").textContent = "Try again when you are online."; return; }
  const out = amt * rate;
  $("resLine").textContent = `${fmt(amt)} ${f.code} = ${fmt(out)} ${t.code}`;
  $("rateLine").textContent = `1 ${f.code} = ${fmt(rate,6)} ${t.code}  ·  1 ${t.code} = ${fmt(1/rate,6)} ${f.code}`;
  $("result").classList.remove("pop"); void $("result").offsetWidth; $("result").classList.add("pop");
  if(save) addHistory(`${f.country} → ${t.country}: ${fmt(amt)} ${f.code} = ${fmt(out)} ${t.code}`);
}

/* ---------- Country pickers with search ---------- */
function buildPicker(el, key){
  el.innerHTML = `<button class="pick-btn"></button><div class="panel"><input placeholder="🔍 Search country or currency..."><div class="list"></div></div>`;
  const btn = el.querySelector(".pick-btn"), panel = el.querySelector(".panel"), search = el.querySelector("input"), list = el.querySelector(".list");
  el.refresh = () => { const c = byCC(state[key]);
    btn.innerHTML = `<img src="${flag(c.cc)}" alt=""><div class="t"><b>${c.country}</b><small>${c.code} · ${c.cur}</small></div><span class="arrow">▾</span>`; };
  function render(q=""){
    q = q.toLowerCase(); list.innerHTML = "";
    const hits = COUNTRIES.filter(c => `${c.country} ${c.code} ${c.cur}`.toLowerCase().includes(q));
    if(!hits.length){ list.innerHTML = `<div class="none">No country found</div>`; return; }
    hits.forEach(c => { const d = document.createElement("div"); d.className = "opt";
      d.innerHTML = `<img src="${flag(c.cc)}" alt="" loading="lazy"><span>${c.country}</span><small>${c.code}<br>${c.cur}</small>`;
      d.onclick = () => { state[key] = c.cc; el.refresh(); panel.classList.remove("open"); convert(); };
      list.appendChild(d); });
  }
  btn.onclick = e => { e.stopPropagation(); document.querySelectorAll(".panel").forEach(p => p !== panel && p.classList.remove("open"));
    panel.classList.toggle("open"); search.value = ""; render(); search.focus(); };
  search.oninput = () => render(search.value);
  el.refresh();
}
buildPicker($("pickFrom"),"from"); buildPicker($("pickTo"),"to");
document.addEventListener("click", e => { if(!e.target.closest(".panel")) document.querySelectorAll(".panel").forEach(p => p.classList.remove("open")); });
const refreshPickers = () => { $("pickFrom").refresh(); $("pickTo").refresh(); };

/* ---------- Buttons ---------- */
$("amount").oninput = () => convert();
$("convertBtn").onclick = () => convert(true);
$("swap").onclick = () => { [state.from,state.to] = [state.to,state.from]; refreshPickers(); convert(); };
$("resetBtn").onclick = () => { state.from="us"; state.to="in"; $("amount").value = 1; refreshPickers(); convert(); };
$("copyBtn").onclick = async () => { try{ await navigator.clipboard.writeText($("resLine").textContent); $("copyBtn").textContent = "✅ Copied"; }catch(e){ $("copyBtn").textContent = "❌ Failed"; }
  setTimeout(() => $("copyBtn").textContent = "📋 Copy", 1500); };
document.querySelectorAll("#amtChips .chip").forEach(b => b.onclick = () => { $("amount").value = b.dataset.amt; convert(true); });
[["us","in"],["eu","us"],["gb","in"],["ae","in"],["jp","in"],["ca","in"]].forEach(([f,t]) => {
  const b = document.createElement("button"); b.className = "chip";
  b.textContent = `${byCC(f).code} → ${byCC(t).code}`;
  b.onclick = () => { state.from=f; state.to=t; refreshPickers(); convert(true); };
  $("pairChips").appendChild(b); });

/* ---------- History (saved in browser) ---------- */
let convHistory = []; try{ convHistory = JSON.parse(localStorage.getItem("cx_hist")||"[]"); }catch(e){}
function renderHistory(){ $("histList").innerHTML = convHistory.length ? convHistory.map(h => `<li>${h}</li>`).join("") : `<li>No conversions yet. Press Convert!</li>`; }
function addHistory(t){ convHistory.unshift(t); convHistory = convHistory.slice(0,5); try{ localStorage.setItem("cx_hist",JSON.stringify(convHistory)); }catch(e){} renderHistory(); }
$("clearHist").onclick = () => { convHistory = []; try{ localStorage.removeItem("cx_hist"); }catch(e){} renderHistory(); };
renderHistory();

/* ---------- Ticker, counters, reveal ---------- */
function buildTicker(){
  const top = ["us","eu","gb","in","jp","cn","au","ca","ch","ae","sa","kw","sg","kr"];
  const html = top.map(cc => { const c = byCC(cc); return rates[c.code] ? `<span><img src="${flag(cc)}" alt="">1 USD = ${fmt(rates[c.code],3)} ${c.code}</span>` : ""; }).join("");
  $("ticker").innerHTML = html + html;
}
document.querySelectorAll("[data-count]").forEach(el => { const end = +el.dataset.count; let n = 0;
  const id = setInterval(() => { n += Math.ceil(end/40); if(n >= end){ n = end; clearInterval(id); } el.textContent = n + "+"; }, 35); });
const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && e.target.classList.add("show")), {threshold:.15});
document.querySelectorAll(".reveal").forEach(el => io.observe(el));

convert(); loadRates();