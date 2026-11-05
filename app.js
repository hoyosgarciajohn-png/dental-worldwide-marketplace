/* =====================================================================
   SITE CONFIG: fill these in before launch (see README setup checklist).
   Any value that starts with "#" is treated as "not configured yet".
   ===================================================================== */
const SUPPORT_EMAIL='support@sonrisaconnect.com';
/* Stripe Payment Links (one per plan and billing period). Paste the https://buy.stripe.com/... URLs here. */
const STRIPE_LINK_BASIC='#stripe-link-pending';
const STRIPE_LINK_GROWTH='#stripe-link-pending';
const STRIPE_LINK_PREMIUM='#stripe-link-pending';
const STRIPE_LINK_BASIC_ANNUAL='#stripe-link-pending';
const STRIPE_LINK_GROWTH_ANNUAL='#stripe-link-pending';
const STRIPE_LINK_PREMIUM_ANNUAL='#stripe-link-pending';
/* Practice onboarding form (join.html). Paste your Formspree URL, e.g. https://formspree.io/f/abcdwxyz */
const FORM_ENDPOINT='#form-endpoint-pending';
/* WhatsApp business number: digits only with country code, e.g. '573001234567' (no +, spaces or dashes) */
const WHATSAPP_NUMBER='#whatsapp-number-pending';
/* Prefilled WhatsApp text per language lives in i18n.js (key js.waMessage). */
const WHATSAPP_MESSAGE=()=>t('js.waMessage');
/* Plans shown on pricing.html and join.html (USD). Keep in sync with pricing.html. */
const PLANS={
  basic:{name:'Basic',monthly:29,annual:276,annualMonthly:23,links:{monthly:()=>STRIPE_LINK_BASIC,annual:()=>STRIPE_LINK_BASIC_ANNUAL}},
  growth:{name:'Growth',monthly:69,annual:660,annualMonthly:55,links:{monthly:()=>STRIPE_LINK_GROWTH,annual:()=>STRIPE_LINK_GROWTH_ANNUAL}},
  premium:{name:'Premium',monthly:149,annual:1428,annualMonthly:119,links:{monthly:()=>STRIPE_LINK_PREMIUM,annual:()=>STRIPE_LINK_PREMIUM_ANNUAL}}
};
const isPending=v=>!v||String(v).charAt(0)==='#';

// All mock data for the SonrisaConnect prototype (v2: local images, no external image hosts).
const TREATMENTS={cleaning:"Cleaning",implants:"Dental implant",veneers:"Porcelain veneer",crowns:"Zirconia crown",rootcanal:"Root canal"};
const mk=(n,c,r,rc,pr,d,cr,rv)=>({name:n,city:c,rating:r,reviews:rc,prices:pr,description:d,credentials:cr,reviewList:rv});
const PRACTICES=[
mk("Clínica Dental Andina","Bogotá",4.9,412,{cleaning:45,implants:950,veneers:320,crowns:290,rootcanal:180},"Full-service clinic in Usaquén specializing in implants and full-mouth rehabilitation.",["Colombian Dental Federation member","ISO 9001 certified","English-speaking staff"],[["Karen M., Texas","Saved over $9,000 on implants. Spotless clinic."],["Mike R., Florida","Dr. Gómez explained everything clearly."],["Linda P., Ohio","Airport pickup and great follow-up."]]),
mk("Sonrisa Bogotá Dental Studio","Bogotá",4.7,268,{cleaning:40,implants:890,veneers:290,crowns:260,rootcanal:160},"Boutique cosmetic studio known for natural-looking veneers.",["Board-certified prosthodontists","Digital smile design","CAD/CAM in-house lab"],[["Ana S., California","My veneers look amazing."],["Tom B., Illinois","Fast and professional."],["Jess K., NY","Worth the trip!"]]),
mk("Medellín Smile Center","Medellín",4.8,530,{cleaning:35,implants:850,veneers:280,crowns:250,rootcanal:150},"Modern center in El Poblado with 3D imaging and sedation options.",["Accredited by Colombian Ministry of Health","Straumann partner clinic","Sedation certified"],[["Rob H., Arizona","Painless implant surgery."],["Maria G., Texas","Beautiful city and great care."],["Dave L., Georgia","Highly recommend."]]),
mk("Odontología Paisa","Medellín",4.6,189,{cleaning:30,implants:780,veneers:250,crowns:230,rootcanal:140},"Family-run practice offering budget-friendly general and restorative dentistry.",["Universidad CES graduates","20+ years in practice","Bilingual coordinator"],[["Pat W., Oregon","Great value and kind staff."],["Sam T., Nevada","Crowns fit perfectly."],["Ellen D., Utah","Felt like family."]]),
mk("Caribe Dental Cartagena","Cartagena",4.9,341,{cleaning:50,implants:990,veneers:340,crowns:300,rootcanal:190},"Seaside clinic in Bocagrande combining premium cosmetics with vacation.",["Invisalign Diamond provider","Nobel Biocare implants","Concierge travel service"],[["Chris J., NY","Dental work plus beach!"],["Nina F., NJ","Luxury experience."],["Paul C., Mass.","Top-notch dentists."]]),
mk("Valle Dental Cali","Cali",4.5,154,{cleaning:28,implants:760,veneers:240,crowns:220,rootcanal:130},"Affordable clinic with digital X-rays and same-week appointments.",["Colombian Dental Association member","Digital radiography","Infection control certified"],[["Gary N., Michigan","Lowest prices I found."],["Rosa V., Texas","Quick root canal, no pain."],["Ken A., Washington","Solid care."]]),
mk("Barranquilla Dental Arts","Barranquilla",4.7,203,{cleaning:32,implants:820,veneers:270,crowns:240,rootcanal:145},"Cosmetic and implant practice with an in-house dental lab.",["Universidad del Norte faculty","In-house lab","English and Spanish"],[["Alice Q., Florida","Short flight from Miami!"],["Ben Y., Carolina","Excellent veneers."],["Sue Z., Virginia","Professional and caring."]]),
mk("Cartagena Implant Institute","Cartagena",4.8,276,{cleaning:55,implants:1050,veneers:360,crowns:310,rootcanal:200},"Specialist implant institute offering All-on-4 and bone grafting.",["Oral surgeons on staff","ICOI fellowship","Guided implant surgery"],[["Larry K., Colorado","All-on-4 changed my life."],["Debbie O., Kansas","Very thorough."],["Joe P., Ohio","Highly skilled team."]])
];
const PHOTO_ALT=[
"Colombian implant dentist standing beside a monitor showing a 3D jaw scan",
"Prosthodontist showing a patient a smile design preview on a tablet",
"Dental operatory with a 3D imaging scanner and a window view over Medellín hills",
"Friendly senior dentist talking with a father and daughter in a family practice",
"Seaside dental clinic room with a Caribbean ocean view and a smiling dentist",
"Dentist reviewing a panoramic digital X-ray with a patient",
"Dental technician crafting a ceramic crown beside a CAD/CAM milling unit",
"Two oral surgeons performing guided implant surgery in a modern surgical suite"];
// shared photos used to fill each profile gallery (rotated per practice)
const SHARED=[
["operatory.jpg","Modern dental operatory with a white chair and teal accent wall"],
["tech.jpg","Intraoral 3D scanner, dental instruments and ceramic crowns"],
["reception.jpg","Bright clinic reception with a smiling receptionist"],
["team.jpg","The clinical team in white coats and teal scrubs"]];
PRACTICES.forEach((p,i)=>{
  p.id=i+1;p.start=Math.min(...Object.values(p.prices));
  p.image=`practice-${i+1}.jpg`;p.imageAlt=`${p.name}: ${PHOTO_ALT[i]}`;
  p.gallery=[[p.image,p.imageAlt],SHARED[i%4].slice(),SHARED[(i+2)%4].slice()];
});
const US={cleaning:120,implants:4000,veneers:1500,crowns:1200,rootcanal:1100};
const CITIES=[
{name:"Cartagena",img:"city-cartagena.jpg",alt:"Colorful colonial houses and flower balconies in Cartagena at sunset",blurb:"Caribbean coast and a walled colonial city."},
{name:"Medellín",img:"city-medellin.jpg",alt:"Medellín skyline with towers among green mountains at dusk",blurb:"The city of eternal spring."},
{name:"Bogotá",img:"city-bogota.jpg",alt:"Bogotá skyline with the Monserrate hill and Andes at sunrise",blurb:"Cosmopolitan capital in the Andes."},
{name:"Cali",img:"city-cali.jpg",alt:"Palm-lined plaza with a white church in Cali",blurb:"Sunny, friendly and very affordable."},
{name:"Barranquilla",img:"city-barranquilla.jpg",alt:"Riverside promenade with palm trees in Barranquilla",blurb:"Riverside port, a short flight from Miami."}];
const AVATARS=[["patient-1.jpg","Smiling woman in her fifties, patient reviewer"],["patient-2.jpg","Smiling man in a blue shirt, patient reviewer"],["patient-3.jpg","Smiling woman with long dark hair, patient reviewer"],["patient-4.jpg","Smiling bearded man with glasses, patient reviewer"]];

/* i18n: swap mock data text (treatments, practice descriptions, reviews, alt text, city blurbs) into the active language. */
I18N.localizeData({TREATMENTS,PRACTICES,CITIES,SHARED,AVATARS});
const planName=k=>t("js.plan_"+k);
const $=s=>document.querySelector(s),qs=new URLSearchParams(location.search);
const stars=r=>"★".repeat(Math.round(r))+"☆".repeat(5-Math.round(r));
const getP=()=>PRACTICES.find(p=>p.id==qs.get("id"))||PRACTICES[0];
const usd=n=>I18N.money(n);
const page=document.body.dataset.page;
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;");

/* scroll fade-in */
const io="IntersectionObserver" in window?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target);if(e.target.dataset.bars)animBars(e.target)}}),{threshold:.12,rootMargin:"0px 0px -40px 0px"}):null;
function reveal(root=document){root.querySelectorAll(".reveal:not(.in)").forEach((el,i)=>{if(!io){el.classList.add("in");animBars(el);return}io.observe(el)})}
function animBars(el){el.querySelectorAll("[data-w]").forEach(b=>b.style.width=b.dataset.w+"%")}

/* nav: burger a11y + close on link click */
(function(){const b=document.querySelector(".burger");if(!b)return;b.setAttribute("aria-expanded","false");b.addEventListener("click",()=>b.setAttribute("aria-expanded",document.body.classList.contains("open")));
document.querySelectorAll(".links a").forEach(a=>a.addEventListener("click",()=>{document.body.classList.remove("open")}));})();

const pcard=(p,i=0)=>`<article class="card pcard reveal" style="--d:${(i%3)*.08}s"><div class="zoom"><img src="${p.image}" alt="${esc(p.imageAlt)}" loading="lazy"><span class="tag">📍 ${p.city}</span><span class="rate"><b>★</b> ${I18N.num(p.rating)} (${I18N.num(p.reviews)})</span></div><div class="in"><h3>${p.name}</h3><span class="price">${t("js.from")} <b>${usd(p.start)}</b> <span class="muted" style="font-weight:400">${t("js.cleaningLc")}</span></span><p class="muted">${p.description}</p><a class="btn" href="practice.html?id=${p.id}">${t("js.viewProfile")}</a></div></article>`;

if(page==="home"){
  $("#searchForm").onsubmit=e=>{e.preventDefault();location.href=`directory.html?treatment=${encodeURIComponent($("#sTreat").value)}&city=${encodeURIComponent($("#sCity").value)}`;};
  // featured practices (top rated)
  $("#featured").innerHTML=[...PRACTICES].sort((a,b)=>b.rating-a.rating||b.reviews-a.reviews).slice(0,3).map(pcard).join("");
  // cities
  $("#cities").innerHTML=CITIES.map((c,i)=>{const ps=PRACTICES.filter(p=>p.city===c.name),from=Math.min(...ps.map(p=>p.prices.implants));
    return `<a class="city reveal" style="--d:${i*.07}s" href="directory.html?city=${encodeURIComponent(c.name)}"><img src="${c.img}" alt="${esc(c.alt)}" loading="lazy"><div class="in"><h3>${c.name}</h3><p>${c.blurb}</p><span class="meta">${t(ps.length===1?"js.practiceOne":"js.practiceMany",{n:ps.length})} · ${t("js.implantsFrom",{p:usd(from)})} →</span></div></a>`}).join("");
  // cost comparison from the mock data
  const avg=k=>Math.round(PRACTICES.reduce((s,p)=>s+p.prices[k],0)/PRACTICES.length);
  $("#costRows").innerHTML=Object.keys(TREATMENTS).map(k=>{const co=avg(k),pct=Math.round((1-co/US[k])*100);
    return `<div class="crow"><div class="crow-h"><span>${TREATMENTS[k]}</span><span class="save">${t("js.saveApprox",{n:pct})}</span></div><div class="bar us"><span>${t("js.us")}</span><i data-w="100"></i><b>${usd(US[k])}</b></div><div class="bar co"><span>${t("js.coAvg")}</span><i data-w="${Math.max(4,Math.round(co/US[k]*100))}"></i><b>${usd(co)}</b></div></div>`}).join("");
  const plan=[["implants",2],["crowns",2],["cleaning",1]],usT=plan.reduce((s,[k,q])=>s+US[k]*q,0),coT=plan.reduce((s,[k,q])=>s+avg(k)*q,0);
  $("#planSave").textContent=usd(usT-coT);$("#planNote").textContent=t("js.planNote",{us:usd(usT),co:usd(coT)});
}

if(page==="directory"){
  const tq=qs.get("treatment"),c=qs.get("city");
  if(tq)document.querySelectorAll("#tChecks input").forEach(i=>{if(i.value===tq)i.checked=true});
  if(c)$("#city").value=c;
  const render=()=>{
    const sel=[...document.querySelectorAll("#tChecks input:checked")].map(i=>i.value),max=+$("#price").value,city=$("#city").value;
    $("#priceVal").textContent=I18N.num(max);
    const list=PRACTICES.filter(p=>(!city||p.city===city)&&p.start<=max&&sel.every(s=>p.prices[s]));
    $("#count").textContent=t(list.length===1?"js.foundOne":"js.foundMany",{n:list.length});
    $("#empty").hidden=list.length>0;
    $("#results").innerHTML=list.map(pcard).join("");reveal($("#results"));
  };
  document.querySelectorAll("#tChecks input,#price,#city").forEach(el=>el.addEventListener("input",render));
  $("#reset").onclick=()=>{document.querySelectorAll("#tChecks input").forEach(i=>i.checked=false);$("#price").value=200;$("#city").value="";render();};
  render();
}

if(page==="practice"){
  const p=getP();document.title=p.name+" · SonrisaConnect";
  const save=Math.round((1-p.prices.implants/US.implants)*100);
  $("#pHero").innerHTML=`<img class="bg" src="${p.image}" alt="${esc(p.imageAlt)}"><div class="wrap"><p><a href="directory.html">← ${t("js.backDir")}</a></p><span class="eyebrow">📍 ${p.city}, Colombia</span><h1>${p.name}</h1><p><span class="stars">${stars(p.rating)}</span> ${I18N.num(p.rating)} · ${t("js.reviewsN",{n:I18N.num(p.reviews)})}</p></div>`;
  $("#profile").innerHTML=`<div class="gallery reveal">${p.gallery.map(([s,a],i)=>`<figure><img src="${s}" alt="${esc(a)}"${i?' loading="lazy"':''}><figcaption>${esc(a.replace(p.name+": ",""))}</figcaption></figure>`).join("")}</div>
  <div class="actions"><a class="btn" href="upload.html?id=${p.id}">${t("js.uploadRecords")}</a><a class="btn navy" href="quote.html?id=${p.id}">${t("js.requestQuote")}</a></div>
  <div class="cols"><div><div class="card reveal"><h2>${t("js.about")}</h2><p>${p.description}</p><h3>${t("js.credentials")}</h3>${p.credentials.map(c=>`<span class="badge">✔ ${c}</span>`).join("")}</div>
  <div class="card reveal" style="margin-top:24px"><h2>${t("js.reviews")}</h2>${p.reviewList.map(([a,t],i)=>{const av=AVATARS[(p.id+i)%4];return `<div class="review"><img src="${av[0]}" alt="${av[1]}" loading="lazy"><div><span class="stars">★★★★★</span><p>“${t}”</p><b>${a}</b></div></div>`}).join("")}</div></div>
  <div class="reveal"><div class="card"><h2>${t("js.priceList")}</h2><table><thead><tr><th>${t("js.treatment")}</th><th>${t("js.price")}</th></tr></thead><tbody>${Object.entries(p.prices).map(([k,v])=>`<tr><td>${TREATMENTS[k]}</td><td>${usd(v)}</td></tr>`).join("")}</tbody></table><p class="muted" style="margin-top:14px">${t("js.usHigher")}</p></div>
  <div class="sidecard"><span class="muted" style="color:#9fb3c9">${t("js.implantVs")}</span><b>${t("js.saveApprox",{n:save})}</b><span>${t("js.hereVs",{a:usd(p.prices.implants),b:usd(US.implants)})}</span></div></div></div>`;
  reveal();
}

if(page==="upload"){
  const p=getP();$("#upFor").textContent=t("js.sendingTo",{n:p.name,c:p.city});$("#toQuote").href="quote.html?id="+p.id;
  $("#photos").onchange=e=>{$("#thumbs").innerHTML="";[...e.target.files].forEach(f=>{const i=new Image();i.src=URL.createObjectURL(f);i.alt=t("js.previewOf",{f:f.name});$("#thumbs").append(i);});};
  $("#upForm").onsubmit=e=>{e.preventDefault();
    const miss=[];if(!$("#uName").value.trim())miss.push(t("js.mName"));if(!/\S+@\S+\.\S+/.test($("#uEmail").value))miss.push(t("js.mEmail"));if(!$("#photos").files.length)miss.push(t("js.mPhoto"));if(!$("#msg").value.trim())miss.push(t("js.mMsg"));
    if(miss.length){$("#err").textContent=t("js.provide",{l:miss.join(", ")});return;}
    $("#uploadBox").hidden=true;$("#upSide").hidden=true;$("#upDone").hidden=false;scrollTo(0,0);};
}

if(page==="quote"){
  const p=getP(),items=[["implants",2],["crowns",2],["cleaning",1]];
  const rows=items.map(([k,q])=>({k,q,u:p.prices[k],t:p.prices[k]*q})),total=rows.reduce((s,r)=>s+r.t,0),us=items.reduce((s,[k,q])=>s+US[k]*q,0);
  $("#quoteBox").innerHTML=`<p><a href="practice.html?id=${p.id}">← ${p.name}</a></p><h1>${t("js.yourQuote")}</h1><p class="muted">${t("js.quoteNo")} #SC-${1000+p.id} · ${p.name}, ${p.city} · ${t("js.mockEst")}</p>
  <div class="card quote-head reveal" style="display:flex;gap:18px;align-items:center;margin-bottom:22px;padding:14px"><img src="${p.image}" alt="${esc(p.imageAlt)}" style="width:120px;height:90px;object-fit:cover;border-radius:12px;flex:none"><div><b>${p.name}</b><br><span class="muted">📍 ${p.city} · <span class="stars">${stars(p.rating)}</span> ${I18N.num(p.rating)}</span></div></div>
  <div class="card reveal"><h3>${t("js.tplan")}</h3><ol><li>${t("js.tp1")}</li><li>${t("js.tp2")}</li><li>${t("js.tp3")}</li></ol>
  <table><thead><tr><th>${t("js.item")}</th><th>${t("js.qty")}</th><th>${t("js.unit")}</th><th>${t("js.subtotal")}</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${TREATMENTS[r.k]}</td><td>${r.q}</td><td>${usd(r.u)}</td><td>${usd(r.t)}</td></tr>`).join("")}</tbody>
  <tfoot><tr><td colspan="3">${t("js.totalUsd")}</td><td>${usd(total)}</td></tr></tfoot></table><p class="price">${t("js.estUs",{us:usd(us),s:usd(us-total),p:Math.round((1-total/us)*100)})}</p>
  <div class="actions"><button class="btn" id="book">${t("js.acceptBook")}</button><button class="btn ghost" id="ask">${t("js.askQ")}</button></div></div>`;
  reveal();
  $("#book").onclick=()=>openModal(`<h2>🎉 ${t("js.bookedH")}</h2><p>${t("js.bookedP",{c:"<b>SC-B"+(Date.now()%100000)+"</b>",n:p.name,city:p.city})}</p><p>${t("js.deposit",{d:usd(Math.round(total*.1))})}</p><button class="btn" onclick="closeModal()">${t("js.done")}</button>`);
  $("#ask").onclick=()=>{openModal(`<h2>${t("js.messageTo",{n:p.name})}</h2><form id="qf"><textarea rows="4" required placeholder="${esc(t("js.typeQ"))}" aria-label="${esc(t("js.typeQ"))}"></textarea><p><button class="btn">${t("js.send")}</button></p></form>`);$("#qf").onsubmit=e=>{e.preventDefault();$("#mbody").innerHTML=`<h2>✉️ ${t("js.sentH")}</h2><p>${t("js.sentP")}</p>`;};};
}
let lastFocus=null;
function ensureModal(){let m=$("#modal");if(!m){m=document.createElement("div");m.className="modal";m.id="modal";m.hidden=true;m.innerHTML='<div class="card mbox"><button class="x" onclick="closeModal()" aria-label="'+t("js.close")+'">\u00d7</button><div id="mbody"></div></div>';document.body.appendChild(m);}
  m.setAttribute("role","dialog");m.setAttribute("aria-modal","true");m.setAttribute("aria-label",t("js.message"));
  if(!m.dataset.bound){m.dataset.bound="1";m.addEventListener("click",e=>{if(e.target===m)closeModal()});}return m;}
function openModal(h){const m=ensureModal();lastFocus=document.activeElement;$("#mbody").innerHTML=h;m.hidden=false;const f=m.querySelector("#mbody a,#mbody button,#mbody input,#mbody textarea")||m.querySelector(".x");if(f)f.focus();}
function closeModal(){const m=$("#modal");if(m)m.hidden=true;if(lastFocus&&lastFocus.focus){lastFocus.focus();lastFocus=null;}}
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&$("#modal")&&!$("#modal").hidden)closeModal()});

if(page==="signin"){$("#signForm").onsubmit=e=>{e.preventDefault();e.target.innerHTML=`<h2>${t("js.welcome")}</h2><p><a class="btn" href="directory.html">${t("js.findPractice")}</a></p>`;};}

/* ---------- open a FAQ item when linked by #hash ---------- */
(function(){const d=location.hash&&document.querySelector("details"+location.hash);if(d)d.open=true;})();

/* ---------- pricing.html ---------- */
function setPressed(a,b,on){a.setAttribute("aria-pressed",on?"false":"true");b.setAttribute("aria-pressed",on?"true":"false");}
if(page==="pricing"){
  const plans=$("#plans"),bM=$("#bMonthly"),bA=$("#bAnnual");
  const setBilling=b=>{plans.dataset.billing=b;setPressed(bM,bA,b==="annual");
    document.querySelectorAll(".trial").forEach(a=>{const pl=PLANS[a.dataset.plan];a.href=pl.links[b]();a.dataset.billing=b;});};
  bM.onclick=()=>setBilling("monthly");bA.onclick=()=>setBilling("annual");
  document.querySelectorAll(".trial").forEach(a=>a.addEventListener("click",e=>{
    if(!isPending(a.getAttribute("href")))return; /* real Stripe link: let the browser follow it */
    e.preventDefault();const b=a.dataset.billing||"monthly";
    openModal(`<h2>${t("js.payH")}</h2><p>${t("js.payP",{p:"<b>"+planName(a.dataset.plan)+"</b>"})}</p><p><a class="btn" href="join.html?plan=${a.dataset.plan}&amp;billing=${b}">${t("js.payCont")}</a> <button class="btn ghost" type="button" onclick="closeModal()">${t("js.close")}</button></p>`);}));
  setBilling(qs.get("billing")==="annual"?"annual":"monthly");
}

/* ---------- join.html: multi-step practice onboarding ---------- */
if(page==="join"){
  const form=$("#joinForm"),steps=[...form.querySelectorAll(".fstep")],bar=[...document.querySelectorAll("#stepper li")];
  const bBack=$("#btnBack"),bNext=$("#btnNext"),bSub=$("#btnSubmit"),N=steps.length;
  let cur=0,billing=qs.get("billing")==="annual"?"annual":"monthly",plan=PLANS[qs.get("plan")]?qs.get("plan"):"growth";
  const err=(n,m)=>{form.querySelector(`[data-err="${n}"]`).textContent=m||"";};
  /* treatments: enable the price field only when the box is ticked */
  form.querySelectorAll("input[data-t]").forEach(c=>c.addEventListener("change",()=>{const p=form.querySelector(`input[data-p="${c.dataset.t}"]`);p.disabled=!c.checked;if(c.checked)p.focus();else p.value="";}));
  /* documents list with image previews */
  const docs=$("#docs");
  docs.onchange=()=>{const box=$("#docList");box.innerHTML="";[...docs.files].forEach(f=>{const it=document.createElement("div");it.className="item";
    if(f.type.startsWith("image/")){const im=new Image();im.src=URL.createObjectURL(f);im.alt=t("js.previewOf",{f:f.name});it.append(im);}
    const sp=document.createElement("span");sp.textContent=f.name+" ("+I18N.num(f.size/1048576,{minimumFractionDigits:1,maximumFractionDigits:1})+" MB)";it.append(sp);box.append(it);});};
  /* plan picker */
  const picks=$("#picks");
  const renderPicks=()=>{picks.innerHTML=Object.entries(PLANS).map(([k,p])=>{const pr=billing==="annual"?`<b>${usd(p.annualMonthly)}</b>${t("js.perMo")}<small>${t("js.billedYearly",{p:usd(p.annual)})}</small>`:`<b>${usd(p.monthly)}</b>${t("js.perMo")}<small>${t("js.billedMonthly")}</small>`;
    return `<label class="pick${k===plan?" sel":""}"><input type="radio" name="plan" value="${k}"${k===plan?" checked":""}><span><b>${planName(k)}</b><small>${t("js.trial30")}</small></span><span class="pr">${pr}</span></label>`}).join("");
    picks.querySelectorAll("input").forEach(r=>r.addEventListener("change",()=>{plan=r.value;renderPicks();}));
    setPressed($("#jMonthly"),$("#jAnnual"),billing==="annual");};
  $("#jMonthly").onclick=()=>{billing="monthly";renderPicks();};$("#jAnnual").onclick=()=>{billing="annual";renderPicks();};
  renderPicks();
  const val=n=>{const f=el=>form.elements[el],v=el=>f(el).value.trim(),miss=[];
    if(n===0){["clinic_name","city","address","license"].forEach(k=>{if(!v(k))miss.push(k)});if(miss.length)return t("js.v0");}
    if(n===1){if(!v("contact_name"))return t("js.v1a");if(v("whatsapp").replace(/\D/g,"").length<8)return t("js.v1b");if(!/^\S+@\S+\.\S+$/.test(v("email")))return t("js.v1c");}
    if(n===2){const ticked=[...form.querySelectorAll("input[data-t]:checked")];const extra=v("other_name")&&v("other_price");
      if(!ticked.length&&!extra)return t("js.v2a");
      for(const c of ticked){const p=form.querySelector(`input[data-p="${c.dataset.t}"]`);if(!(+p.value>0))return t("js.v2b");}
      if((v("other_name")&&!(+v("other_price")>0))||(!v("other_name")&&v("other_price")))return t("js.v2c");}
    if(n===3){if(docs.files.length>10)return t("js.v3a");for(const f of docs.files){if(f.size>25*1048576)return t("js.v3b",{f:f.name});}}
    if(n===4){if(!$("#cTerms").checked||!$("#cData").checked||!$("#cAcc").checked)return t("js.v4");}
    return "";};
  const show=n=>{cur=n;steps.forEach((s,i)=>s.hidden=i!==n);bar.forEach((b,i)=>{b.classList.toggle("on",i===n);b.classList.toggle("done",i<n);});
    bBack.hidden=n===0;bNext.hidden=n===N-1;bSub.hidden=n!==N-1;$("#submitErr").textContent="";
    const top=form.getBoundingClientRect().top+scrollY-110;if(scrollY>top)scrollTo({top,behavior:"smooth"});};
  bNext.onclick=()=>{const m=val(cur);err(cur+1,m);if(!m)show(cur+1);};
  bBack.onclick=()=>show(cur-1);
  const summary=()=>{const t=[...form.querySelectorAll("input[data-t]:checked")].map(c=>{const nm=c.closest("label").textContent.trim();return `${nm}: $${form.querySelector(`input[data-p="${c.dataset.t}"]`).value}`;});
    if(form.elements.other_name.value.trim())t.push(`${form.elements.other_name.value.trim()}: $${form.elements.other_price.value}`);return t.join("; ");};
  const textSummary=()=>{const v=k=>form.elements[k].value.trim();return `Clinic: ${v("clinic_name")}\nCity: ${v("city")}\nAddress: ${v("address")}\nLicense/RETHUS: ${v("license")}\nContact: ${v("contact_name")}\nWhatsApp: ${v("whatsapp")}\nEmail: ${v("email")}\nTreatments: ${summary()}\nPlan: ${PLANS[plan].name} (${billing})\nLanguage: ${I18N.lang}`;};
  const done=(html,warn)=>{$("#joinBox").hidden=true;const d=$("#joinDone");d.className="card success"+(warn?" warn":"");d.innerHTML=html;d.hidden=false;scrollTo(0,0);d.focus();};
  form.onsubmit=async e=>{e.preventDefault();
    for(let i=0;i<N;i++){const m=val(i);if(m){err(i+1,m);show(i);return;}}
    const sub=$("#submitErr");sub.textContent="";
    if(isPending(FORM_ENDPOINT)){
      console.warn("SonrisaConnect: FORM_ENDPOINT is not configured in app.js. Nothing was sent. See README setup checklist.");
      const body=encodeURIComponent(t("js.mailIntro")+"\n\n"+textSummary());
      done(`<h1>${t("js.pendH")}</h1><p>${t("js.pendP1")}</p><p>${t("js.pendP2")}</p><p>${t("js.pendP3")}</p><p><a class="btn" href="mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Practice application: "+form.elements.clinic_name.value.trim())}&amp;body=${body}">${t("js.emailApp")}</a> <a class="btn ghost" href="pricing.html">${t("js.backPricing")}</a></p><div class="sumbox"><b>${t("js.yourEntries")}</b><br>${esc(textSummary()).replace(/\n/g,"<br>")}</div>`,true);
      return;}
    const fd=new FormData(form);fd.set("billing",billing);fd.set("treatments_summary",summary());fd.set("language",I18N.lang);fd.set("_subject","New practice application: "+form.elements.clinic_name.value.trim());
    bSub.disabled=true;bSub.textContent=t("js.sending");
    try{const r=await fetch(FORM_ENDPOINT,{method:"POST",body:fd,headers:{Accept:"application/json"}});
      if(!r.ok){let m=t("js.serverErr");try{const j=await r.json();if(j.errors&&j.errors.length)m=j.errors.map(x=>x.message).join(" ");}catch(_){}throw new Error(m);}
      const link=PLANS[plan].links[billing]();
      done(`<img src="reception.jpg" alt="${esc(t("js.recAlt"))}"><h1>${t("js.thanksH")}</h1><p>${t("js.thanksP",{e:"<b>"+esc(form.elements.email.value.trim())+"</b>"})}</p>${isPending(link)?"":`<p>${t("js.nextTrial",{p:planName(plan)})}</p><p><a class="btn" href="${esc(link)}">${t("js.startTrial")}</a></p>`}<p><a class="btn ghost" href="index.html">${t("js.backHome")}</a></p>`);
    }catch(x){bSub.disabled=false;bSub.textContent=t("js.submitApp");sub.textContent=t("js.sendFail",{m:x.message,e:SUPPORT_EMAIL});}
  };
}

/* ---------- WhatsApp floating button (all pages) ---------- */
(function(){const a=document.createElement("a");a.className="wa";a.setAttribute("aria-label",t("js.waAria"));a.title=t("js.waTitle");
  a.innerHTML='<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16.04 3C9.4 3 4 8.4 4 15.03c0 2.12.55 4.19 1.6 6.02L4 29l8.14-1.56a12 12 0 0 0 3.9.65C22.68 28.09 28 22.69 28 16.06 28 9.4 22.68 3 16.04 3zm0 22.03c-1.2 0-2.38-.3-3.42-.87l-.6-.33-4.84.93.97-4.7-.36-.62a9.9 9.9 0 0 1-1.5-5.2c0-5.5 4.5-9.97 10.05-9.97 5.55 0 10.06 4.47 10.06 9.97s-4.5 9.99-10.36 9.99zm5.5-7.48c-.3-.15-1.78-.88-2.06-.98-.28-.1-.48-.15-.68.15-.2.3-.78.98-.96 1.18-.18.2-.35.22-.65.07-.3-.15-1.28-.47-2.43-1.5-.9-.8-1.5-1.8-1.68-2.1-.18-.3-.02-.46.13-.6.14-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.68-1.64-.93-2.25-.24-.58-.5-.5-.68-.5h-.58c-.2 0-.53.08-.8.38-.28.3-1.05 1.03-1.05 2.5s1.08 2.9 1.23 3.1c.15.2 2.1 3.2 5.1 4.5.7.3 1.27.5 1.7.62.72.23 1.37.2 1.88.12.58-.08 1.78-.73 2.03-1.43.25-.7.25-1.3.18-1.43-.08-.13-.28-.2-.58-.35z"/></svg>';
  if(isPending(WHATSAPP_NUMBER)){a.href="#whatsapp-pending";a.addEventListener("click",e=>{e.preventDefault();console.warn("SonrisaConnect: WHATSAPP_NUMBER is not configured in app.js.");
    openModal(`<h2>${t("js.waSoonH")}</h2><p>${t("js.waSoonP",{e:`<a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>`})}</p><p><button class="btn" type="button" onclick="closeModal()">${t("js.close")}</button></p>`);});}
  else{a.href="https://wa.me/"+String(WHATSAPP_NUMBER).replace(/\D/g,"")+"?text="+encodeURIComponent(WHATSAPP_MESSAGE());a.target="_blank";a.rel="noopener";}
  document.body.appendChild(a);})();

reveal();
