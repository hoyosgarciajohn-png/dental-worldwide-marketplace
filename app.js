// All mock data for the SonrisaConnect prototype.
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
].map((p,i)=>({...p,id:i+1,start:Math.min(...Object.values(p.prices)),image:`https://picsum.photos/seed/clinic${i+1}/600/400`,gallery:[1,2,3].map(g=>`https://picsum.photos/seed/clinic${i+1}g${g}/600/400`)}));
const US={cleaning:120,implants:4000,veneers:1500,crowns:1200,rootcanal:1100};

const $=s=>document.querySelector(s),qs=new URLSearchParams(location.search);
const stars=r=>"★".repeat(Math.round(r))+"☆".repeat(5-Math.round(r));
const getP=()=>PRACTICES.find(p=>p.id==qs.get("id"))||PRACTICES[0];
const usd=n=>"$"+n.toLocaleString("en-US");
const page=document.body.dataset.page;

if(page==="home"){$("#searchForm").onsubmit=e=>{e.preventDefault();location.href=`directory.html?treatment=${encodeURIComponent($("#sTreat").value)}&city=${encodeURIComponent($("#sCity").value)}`;};}

if(page==="directory"){
  const t=qs.get("treatment"),c=qs.get("city");
  if(t)document.querySelectorAll("#tChecks input").forEach(i=>{if(i.value===t)i.checked=true});
  if(c)$("#city").value=c;
  const render=()=>{
    const sel=[...document.querySelectorAll("#tChecks input:checked")].map(i=>i.value),max=+$("#price").value,city=$("#city").value;
    $("#priceVal").textContent=max;
    const list=PRACTICES.filter(p=>(!city||p.city===city)&&p.start<=max&&sel.every(s=>p.prices[s]));
    $("#count").textContent=`${list.length} practice${list.length!==1?"s":""} found`;
    $("#empty").hidden=list.length>0;
    $("#results").innerHTML=list.map(p=>`<article class="card pcard"><img src="${p.image}" alt="${p.name}" loading="lazy"><div class="in"><h3>${p.name}</h3><span class="muted">📍 ${p.city}, Colombia</span><span><span class="stars">${stars(p.rating)}</span> ${p.rating} (${p.reviews})</span><span class="price">From ${usd(p.start)}</span><p class="muted">${p.description}</p><a class="btn" href="practice.html?id=${p.id}">View Profile</a></div></article>`).join("");
  };
  document.querySelectorAll("#tChecks input,#price,#city").forEach(el=>el.addEventListener("input",render));
  $("#reset").onclick=()=>{document.querySelectorAll("#tChecks input").forEach(i=>i.checked=false);$("#price").value=200;$("#city").value="";render();};
  render();
}

if(page==="practice"){
  const p=getP();document.title=p.name+" · SonrisaConnect";
  $("#profile").innerHTML=`<p><a href="directory.html">← Back to directory</a></p><h1>${p.name}</h1><p><span class="stars">${stars(p.rating)}</span> ${p.rating} · ${p.reviews} reviews · 📍 ${p.city}, Colombia</p>
  <div class="gallery">${[p.image,...p.gallery].slice(0,3).map(s=>`<img src="${s}" alt="Clinic photo">`).join("")}</div>
  <div class="actions"><a class="btn" href="upload.html?id=${p.id}">Upload Records</a><a class="btn navy" href="quote.html?id=${p.id}">Request Quote</a></div>
  <div class="cols"><div><div class="card"><h2>About</h2><p>${p.description}</p><h3>Credentials</h3>${p.credentials.map(c=>`<span class="badge">✔ ${c}</span>`).join("")}</div>
  <div class="card" style="margin-top:20px"><h2>Reviews</h2>${p.reviewList.map(([a,t])=>`<div class="review"><span class="stars">★★★★★</span><p>“${t}”</p><b>${a}</b></div>`).join("")}</div></div>
  <div class="card"><h2>Price list (USD)</h2><table><thead><tr><th>Treatment</th><th>Price</th></tr></thead><tbody>${Object.entries(p.prices).map(([k,v])=>`<tr><td>${TREATMENTS[k]}</td><td>${usd(v)}</td></tr>`).join("")}</tbody></table><p class="muted">Typical US prices are 50–70% higher.</p></div></div>`;
}

if(page==="upload"){
  const p=getP();$("#upFor").textContent="Sending to "+p.name+", "+p.city;$("#toQuote").href="quote.html?id="+p.id;
  $("#photos").onchange=e=>{$("#thumbs").innerHTML="";[...e.target.files].forEach(f=>{const i=new Image();i.src=URL.createObjectURL(f);$("#thumbs").append(i);});};
  $("#upForm").onsubmit=e=>{e.preventDefault();
    const miss=[];if(!$("#uName").value.trim())miss.push("name");if(!/\S+@\S+\.\S+/.test($("#uEmail").value))miss.push("valid email");if(!$("#photos").files.length)miss.push("at least one tooth photo");if(!$("#msg").value.trim())miss.push("message");
    if(miss.length){$("#err").textContent="Please provide: "+miss.join(", ")+".";return;}
    $("#uploadBox").hidden=true;$("#upDone").hidden=false;scrollTo(0,0);};
}

if(page==="quote"){
  const p=getP(),items=[["implants",2],["crowns",2],["cleaning",1]];
  const rows=items.map(([k,q])=>({k,q,u:p.prices[k],t:p.prices[k]*q})),total=rows.reduce((s,r)=>s+r.t,0),us=items.reduce((s,[k,q])=>s+US[k]*q,0);
  $("#quoteBox").innerHTML=`<p><a href="practice.html?id=${p.id}">← ${p.name}</a></p><h1>Your treatment quote</h1><p class="muted">Quote #SC-${1000+p.id} · ${p.name}, ${p.city} · Mock estimate</p>
  <div class="card"><h3>Treatment plan</h3><ol><li>Initial exam & cleaning</li><li>Placement of 2 implants (lower molars)</li><li>2 zirconia crowns after healing (~4 months)</li></ol>
  <table><thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Subtotal</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${TREATMENTS[r.k]}</td><td>${r.q}</td><td>${usd(r.u)}</td><td>${usd(r.t)}</td></tr>`).join("")}</tbody>
  <tfoot><tr><td colspan="3">Total (USD)</td><td>${usd(total)}</td></tr></tfoot></table><p class="price">Estimated US cost ${usd(us)}: you save ${usd(us-total)} (${Math.round((1-total/us)*100)}%)</p>
  <div class="actions"><button class="btn" id="book">Accept &amp; Book</button><button class="btn ghost" id="ask">Ask a Question</button></div></div>`;
  $("#book").onclick=()=>openModal(`<h2>🎉 Booking confirmed (mock)</h2><p>Confirmation <b>SC-B${Date.now()%100000}</b>. ${p.name} will contact you to schedule your visit to ${p.city}.</p><p>Deposit due: ${usd(Math.round(total*.1))} (mock, nothing charged).</p><button class="btn" onclick="closeModal()">Done</button>`);
  $("#ask").onclick=()=>{openModal(`<h2>Message ${p.name}</h2><form id="qf"><textarea rows="4" required placeholder="Type your question..."></textarea><p><button class="btn">Send</button></p></form>`);$("#qf").onsubmit=e=>{e.preventDefault();$("#mbody").innerHTML="<h2>✉️ Message sent (mock)</h2><p>The practice typically replies within 24 hours.</p>";};};
}
function openModal(h){$("#mbody").innerHTML=h;$("#modal").hidden=false;}
function closeModal(){$("#modal").hidden=true;}

if(page==="signin"){$("#signForm").onsubmit=e=>{e.preventDefault();e.target.innerHTML='<h2>Welcome back! (mock)</h2><p><a class="btn" href="directory.html">Find a Practice</a></p>';};}
