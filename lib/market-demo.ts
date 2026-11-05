// Browser-local UX simulation. Connected authorization is enforced by the server.
export type DemoRole = 'patient' | 'practice' | 'reviewer' | 'admin';
export type Clinic = {id:string;name:string;district:string;languages:string[];services:string[];status:'draft'|'submitted'|'accepted'|'suspended'|'rejected';checked:string;expires:string;version:number;summary:string;tone:string};
export type Estimate = {id:string;version:number;currency:'USD'|'COP';items:{label:string;amount:number|null}[];exclusions:string;visits:number;trip:string;expires:string;accepted:boolean};
export type Appointment = {id:string;at:string;zone:string;status:'requested'|'proposed'|'confirmed'|'attended'|'cancelled';version:number;estimate_id:string;patientAccepted:boolean};
export type Case = {id:string;site_id:string;patient_id:string;summary:string;service:string;active:boolean;grants:string[];consent_version:string;version:number;continuity:boolean;created:string;messages:{id:string;sender:DemoRole;text:string;at:string}[];files:{id:string;name:string;state:'quarantine'|'clean'|'rejected'|'error'}[];estimates:Estimate[];appointment?:Appointment;handoff?:{text:string;contact:string;followUp:string;ack:boolean};support:{id:string;category:string;status:string;text:string}[];review?:{rating:number;text:string;conflict:string;status:string;reason?:string};deletion?:{status:string;reason:string}};
export type DemoState = {schema:5;clinics:Clinic[];cases:Case[];invoices:{id:string;site_id:string;amount:number;currency:string;period:string}[];outbox:{id:string;case_id:string;state:string}[];audit:{id:string;action:string;at:string}[]};
export const DEMO_KEY='dental-marketplace-fictional-v5';
export const POLICY='preview-policy-2026-11-05';
const id=()=>crypto.randomUUID();
const sid=(n:number)=>`90000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
export const fictional=(v:string)=>v.startsWith('FICTIONAL')?v:`FICTIONAL · ${v}`;
export const initialDemo=():DemoState=>({schema:5,clinics:[
 {id:sid(1),name:'FICTIONAL · Luma Dental',district:'Granada · Cali',languages:['English','Español'],services:['examination','crown'],status:'accepted',checked:'2026-11-01',expires:'2030-11-01',version:1,summary:'FICTIONAL site, practitioner and service evidence. Simulation only.',tone:'mint'},
 {id:sid(2),name:'FICTIONAL · Río Dental Studio',district:'Ciudad Jardín · Cali',languages:['English','Español'],services:['examination','crown'],status:'accepted',checked:'2026-11-02',expires:'2030-11-01',version:1,summary:'FICTIONAL site and service evidence. Simulation only.',tone:'sand'},
 {id:sid(3),name:'FICTIONAL · Alba Dental',district:'San Fernando · Cali',languages:['Español'],services:['examination'],status:'accepted',checked:'2026-11-01',expires:'2030-11-01',version:1,summary:'FICTIONAL examination-only scope. Simulation only.',tone:'lilac'},
 {id:sid(4),name:'FICTIONAL · Valle Dental',district:'El Peñón · Cali',languages:['English','Español'],services:['examination'],status:'submitted',checked:'',expires:'2030-11-01',version:1,summary:'FICTIONAL evidence submitted for review.',tone:'mint'},
 {id:sid(5),name:'FICTIONAL · Sol Dental',district:'Pance · Cali',languages:['Español'],services:['examination','crown'],status:'suspended',checked:'2026-10-01',expires:'2030-11-01',version:1,summary:'FICTIONAL suspended practice. No new enquiries.',tone:'sand'}
],cases:[],invoices:[],outbox:[],audit:[]});
export const eligible=(c:Clinic)=>c.status==='accepted'&&Date.parse(c.expires+'T23:59:59Z')>Date.now();
export const visibleCases=(s:DemoState,r:DemoRole,site:string)=>s.cases.filter(c=>r==='patient'?c.patient_id==='fictional-patient-01':r==='practice'?c.site_id===site&&c.active&&(eligible(s.clinics.find(p=>p.id===site)!)||c.continuity):false);
export function restoreDemo(v:unknown):DemoState|null{
 if(!v||typeof v!=='object')return null;const s=v as DemoState;
 if(s.schema!==5||!Array.isArray(s.clinics)||s.clinics.length!==5||!Array.isArray(s.cases)||s.cases.length>100||!Array.isArray(s.invoices)||!Array.isArray(s.outbox)||!Array.isArray(s.audit))return null;
 if(s.clinics.some(c=>!c.id||!c.name?.startsWith('FICTIONAL')||!Array.isArray(c.services)||!Array.isArray(c.languages)))return null;
 if(s.cases.some(c=>typeof c.id!=='string'||!s.clinics.some(p=>p.id===c.site_id)||c.patient_id!=='fictional-patient-01'||!c.summary?.startsWith('FICTIONAL')||!Array.isArray(c.grants)||!Array.isArray(c.messages)||!Array.isArray(c.files)||!Array.isArray(c.estimates)||!Array.isArray(c.support)))return null;
 return s;
}
const text=(v:unknown)=>{if(typeof v!=='string'||!v.startsWith('FICTIONAL')||v.length>2000)throw Error('fictional_text_required');return v;};
const date=(v:unknown)=>{const d=new Date(String(v));if(!Number.isFinite(+d))throw Error('invalid_date');return d.toISOString();};
const latest=(c:Case)=>c.estimates.at(-1);
export const total=(e:Estimate)=>e.items.reduce((n,x)=>n+(x.amount??0),0);
export function demoAction(state:DemoState,role:DemoRole,site:string,action:string,p:Record<string,any>={}):DemoState{
 const s=structuredClone(state),now=new Date().toISOString();
 const clinic=s.clinics.find(x=>x.id===(p.site_id||site));
 const c=s.cases.find(x=>x.id===(p.id||p.enquiry_id));
 const own=!!c&&role==='patient'&&c.patient_id==='fictional-patient-01';
 const staff=!!c&&role==='practice'&&c.site_id===site&&c.active&&(eligible(s.clinics.find(x=>x.id===site)!)||c.continuity);
 const can=(category:string)=>own||(staff&&c!.grants.includes(category));
 if(c&&p.version!==undefined&&p.version!==c.version)throw Error('stale_version');
 if(action==='enquiry.create'){
  if(role!=='patient'||!clinic||!eligible(clinic)||!clinic.services.includes(p.service))throw Error('scope_unavailable');
  if(p.consent!==true||p.policy!==POLICY||!Array.isArray(p.grants)||!p.grants.includes('contact')||!p.grants.includes('care')||p.grants.some((g:string)=>!['contact','care','files'].includes(g)))throw Error('consent_required');
  if(s.cases.some(x=>x.site_id===clinic.id&&x.service===p.service&&x.active))throw Error('duplicate_enquiry');
  s.cases.unshift({id:id(),site_id:clinic.id,patient_id:'fictional-patient-01',summary:text(p.summary),service:p.service,active:true,grants:p.grants,consent_version:POLICY,version:1,continuity:false,created:now,messages:[],files:[],estimates:[],support:[]});
 }else if(action==='profile.review'){
  if(role!=='reviewer'||!clinic||!['accepted','suspended','rejected'].includes(p.status))throw Error('forbidden');
  clinic.status=p.status;clinic.checked=now.slice(0,10);clinic.summary=text(p.reason);clinic.expires=String(p.expires||clinic.expires);clinic.version++;
 }else if(action==='profile.submit'){
  if(role!=='practice'||!clinic||clinic.id!==site)throw Error('forbidden');clinic.summary=text(p.summary);clinic.status='submitted';clinic.version++;
 }else if(action==='review.moderate'){
  if(role!=='reviewer'||!c?.review||!['published','rejected'].includes(p.status))throw Error('forbidden');c.review.status=p.status;c.review.reason=text(p.reason);c.version++;
 }else if(action==='invoice.create'){
  if(role!=='admin'||!clinic||!/^[0-9]{4}-[0-9]{2}$/.test(p.period))throw Error('forbidden');
  if(s.invoices.some(i=>i.site_id===clinic.id&&i.period===p.period))throw Error('duplicate_invoice');
  s.invoices.push({id:id(),site_id:clinic.id,period:p.period,amount:9900,currency:'USD'});
 }else if(action==='outbox.process'){
  if(role!=='admin')throw Error('forbidden');s.outbox.forEach(x=>{if(x.state==='queued'){const item=s.cases.find(c=>c.id===x.case_id);x.state=item?.active?'captured':'denied';}});
 }else if(action==='enquiry.continuity'){
  if(role!=='admin'||!c)throw Error('forbidden');c.continuity=p.enabled===true;c.version++;
 }else if(action==='governance.review'){
  if(role!=='admin'||!c?.deletion||!['held','reviewed'].includes(p.status))throw Error('forbidden');c.deletion={status:p.status,reason:text(p.reason)};
 }else{
  if(!c||(!own&&!staff))throw Error('forbidden');
  if(action==='enquiry.withdraw'){if(!own)throw Error('forbidden');c.active=false;c.grants=[];}
  else if(action==='message.send'){
   if(!c.active||!can('care'))throw Error('sharing_withdrawn');c.messages.push({id:id(),sender:role,text:text(p.text),at:now});s.outbox.push({id:id(),case_id:c.id,state:'queued'});
  }else if(action==='file.register'){
   if(!own||!c.active||!c.grants.includes('files'))throw Error('files_not_shared');c.files.push({id:id(),name:'FICTIONAL-preview-note.pdf',state:'quarantine'});
  }else if(action==='file.scan'){
   const f=c.files.find(f=>f.id===p.file_id);if(!own||!c.active||!f||f.state!=='quarantine'||!['clean','rejected','error'].includes(p.result))throw Error('invalid_transition');f.state=p.result;
  }else if(action==='estimate.issue'){
   if(!staff||!can('care')||!eligible(s.clinics.find(x=>x.id===site)!))throw Error('forbidden');
   if(!Number.isInteger(p.amount)||p.amount<1||p.amount>1e9||!['USD','COP'].includes(p.currency)||!Number.isInteger(p.visits)||p.visits<1||p.visits>10)throw Error('invalid_amount');
   const expires=date(p.expires);if(Date.parse(expires)<=Date.now())throw Error('estimate_expired');
   c.estimates.push({id:id(),version:c.estimates.length+1,currency:p.currency,items:[{label:'FICTIONAL planned care',amount:p.amount},...(p.unknown?[{label:'FICTIONAL additional care if needed',amount:null}]:[])],exclusions:text(p.exclusions),trip:text(p.trip),visits:p.visits,expires,accepted:false});
  }else if(action==='estimate.accept'){
   const e=latest(c);if(!own||!c.active||!e||e.id!==p.estimate_id||e.items.some(i=>i.amount===null)||Date.parse(e.expires)<=Date.now())throw Error('estimate_expired');e.accepted=true;
  }else if(action==='appointment.request'){
   const e=latest(c);if(!own||!c.active||!e?.accepted||Date.parse(e.expires)<=Date.now()||!eligible(s.clinics.find(x=>x.id===c.site_id)!))throw Error('accepted_estimate_required');
   if(c.appointment&&c.appointment.status!=='cancelled')throw Error('duplicate_appointment');
   const at=date(p.at);if(Date.parse(at)<=Date.now())throw Error('future_date_required');c.appointment={id:id(),at,zone:'America/Bogota',status:'requested',version:1,estimate_id:e.id,patientAccepted:true};
  }else if(action==='appointment.accept'){
   const a=c.appointment;if(!own||!c.active||!a||a.status!=='proposed')throw Error('invalid_transition');a.patientAccepted=true;a.version++;
  }else if(action==='appointment.update'){
   const a=c.appointment,e=latest(c);if(!a||!c.active)throw Error('invalid_transition');
   if(p.status==='cancelled'&&['requested','proposed','confirmed'].includes(a.status))a.status='cancelled';
   else if(staff&&p.status==='proposed'&&['requested','proposed'].includes(a.status)){a.at=date(p.at||a.at);if(Date.parse(a.at)<=Date.now())throw Error('future_date_required');a.patientAccepted=false;a.status='proposed';}
   else if(staff&&p.status==='confirmed'&&['requested','proposed'].includes(a.status)){
    if(!e?.accepted||e.id!==a.estimate_id||Date.parse(e.expires)<=Date.now()||!a.patientAccepted||!eligible(s.clinics.find(x=>x.id===site)!))throw Error('accepted_estimate_required');
    if(s.cases.some(x=>x.id!==c.id&&x.site_id===site&&x.appointment?.status==='confirmed'&&Math.abs(Date.parse(x.appointment.at)-Date.parse(a.at))<3600000))throw Error('slot_conflict');a.status='confirmed';
   }else if(staff&&p.status==='attended'&&a.status==='confirmed')a.status='attended'; // Explicit demo clock simulation in UI.
   else throw Error('invalid_transition');a.version++;
  }else if(action==='handoff.save'){
   if(!staff||c.appointment?.status!=='attended')throw Error('attendance_required');c.handoff={text:text(p.text),contact:'fictional-support@example.test',followUp:date(p.followUp),ack:false};
  }else if(action==='handoff.ack'){if(!own||!c.handoff)throw Error('forbidden');c.handoff.ack=true;}
  else if(action==='support.create'){
   if(!['administrative','financial','clinical'].includes(p.category))throw Error('invalid_request');c.support.push({id:id(),category:p.category,status:p.category==='clinical'?'escalated':'open',text:text(p.text)});
  }else if(action==='support.update'){
   const t=c.support.find(t=>t.id===p.ticket_id);if(!staff||!t||t.category==='clinical')throw Error('qualified_review_required');t.status='closed';
  }else if(action==='review.submit'){
   if(!own||c.review||c.appointment?.status!=='attended'||!Number.isInteger(p.rating)||p.rating<1||p.rating>5)throw Error('attendance_required');c.review={rating:p.rating,text:text(p.text),conflict:text(p.conflict),status:'pending'};
  }else if(action==='review.appeal'){if(!own||c.review?.status!=='rejected')throw Error('forbidden');c.review.status='appealed';c.review.reason=text(p.reason);}
  else if(action==='governance.deletion'){if(!own)throw Error('forbidden');c.deletion={status:'pending_review',reason:text(p.reason)};}
  else throw Error('invalid_request');c.version++;
 }
 s.audit.unshift({id:id(),action,at:now});return s;
}
