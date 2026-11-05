import {NextRequest,NextResponse} from 'next/server';
import {createHash} from 'node:crypto';
import {client,config,SafeFailure,type Tokens} from '../../../lib/m1-server';
import {trustedLocalRequest} from '../../../lib/m1-origin';
import {inspectFictionalFile,simulatedScan} from '../../../lib/market-files';
export const runtime='nodejs';export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store, private','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
const actions=new Set(['directory.list','operations.list','coordinator.list','session.me','profile.list','profile.save','profile.submit','profile.review','profile.suspend','enquiry.create','enquiry.list','enquiry.read','consent.set','coordinator.assign','coordinator.grant','continuity.set','message.send','file.upload','file.download','estimate.issue','estimate.accept','appointment.request','appointment.propose','appointment.accept','appointment.confirm','appointment.cancel','appointment.attend','handoff.create','handoff.ack','support.create','support.close','clinical.assign','review.create','review.list','review.moderate','review.appeal','invoice.create','invoice.list','export.create','governance.list','deletion.request','deletion.review','outbox.list','outbox.process']);
export async function POST(req:NextRequest){
 let tokens:Tokens|null|undefined,secure=false;
 const finish=(response:NextResponse)=>{if(tokens!==undefined)for(const [k,v] of [['dental_access',tokens?.access_token||''],['dental_refresh',tokens?.refresh_token||'']])response.cookies.set(k,v,{httpOnly:true,sameSite:'strict',secure,path:'/',maxAge:tokens?43200:0});return response;};
 const reply=(body:object,status=200)=>finish(NextResponse.json(body,{status,headers}));
 try{
  const cfg=config();secure=new URL(cfg.origin).protocol==='https:';
  if(!trustedLocalRequest(req,cfg.origin))throw new SafeFailure('origin_rejected',403);
  if(req.headers.get('content-type')?.split(';')[0].trim()!=='application/json')throw new SafeFailure('invalid_request',400);
  const reader=req.body?.getReader();if(!reader)throw new SafeFailure('invalid_request',400);
  let size=0;const chunks:Uint8Array[]=[];
  for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>7*1024*1024){await reader.cancel();throw new SafeFailure('request_too_large',413);}chunks.push(value);}
  let input;try{input=JSON.parse(Buffer.concat(chunks).toString());}catch{throw new SafeFailure('invalid_request',400);}
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['action','payload'].includes(k)))throw new SafeFailure('invalid_request',400);
  const {action,payload={}}=input;
  if(typeof action!=='string'||!actions.has(action)||!payload||typeof payload!=='object'||Array.isArray(payload)||(action!=='file.upload'&&size>65536))throw new SafeFailure('invalid_request',400);
  const c=client();
  if(action!=='directory.list'){
   const access_token=req.cookies.get('dental_access')?.value,refresh_token=req.cookies.get('dental_refresh')?.value;
   if(!access_token||!refresh_token)throw new SafeFailure('unauthenticated',401);
   const restored=await c.auth.setSession({access_token,refresh_token});
   if(restored.error||!restored.data.session||(await c.auth.getUser()).error){tokens=null;throw new SafeFailure('session_expired',401);}tokens=restored.data.session;
  }
  const dispatch=async(name:string,args:object)=>{
   const r=await c.rpc('market_dispatch',{p_action:name,p_payload:args});if(r.error)throw new SafeFailure('service_unavailable',503);
   if(!r.data?.ok){const code=r.data?.code||'forbidden';if(['session_expired','account_unavailable','unauthenticated'].includes(code))tokens=null;throw new SafeFailure(code,code==='invalid_request'?400:code==='rate_limited'?429:['conflict','stale_version','slot_conflict','idempotency_conflict'].includes(code)?409:403);}return r.data.data;
  };
  if(action==='file.upload'){
   let f;try{f=inspectFictionalFile(payload);}catch(e){throw new SafeFailure(e instanceof Error?e.message:'file_invalid',400);}
   const args={enquiry_id:payload.enquiry_id,name:f.name,mime:f.mime,size:f.size,sha256:f.sha256,key:payload.key};
   const m=await dispatch('file.register',args),admin=client(true);let state=m.state||'quarantine';
   if(state==='quarantine'){
    const up=await admin.storage.from('market-private').upload(m.object_path,f.bytes,{contentType:f.mime,upsert:false});
    if(up.error){const prior=await admin.storage.from('market-private').download(m.object_path);if(prior.error||createHash('sha256').update(Buffer.from(await prior.data.arrayBuffer())).digest('hex')!==f.sha256)throw new SafeFailure('upload_failed',503);}
    // Recheck the exact original write permission after object I/O.
    await dispatch('file.register',args);
    if(process.env.MARKET_ALLOW_SIMULATED_SCAN==='1'){
     state=simulatedScan(f.bytes);const scan=await admin.rpc('market_scan_result',{p_file_id:m.id,p_sha256:f.sha256,p_state:state,p_method:'simulated'});
     if(scan.error||scan.data?.ok===false)throw new SafeFailure('scan_unavailable',503);
    }
   }
   return reply({ok:true,data:{id:m.id,name:f.name,mime:f.mime,size:f.size,state,scan_method:process.env.MARKET_ALLOW_SIMULATED_SCAN==='1'?'simulated':'not_performed'}});
  }
  if(action==='file.download'){
   const m=await dispatch('file.authorize',payload),r=await client(true).storage.from('market-private').download(m.object_path);
   if(r.error)throw new SafeFailure('file_unavailable',503);await dispatch('file.authorize',payload);
   return finish(new NextResponse(await r.data.arrayBuffer(),{headers:{...headers,'Content-Type':'application/octet-stream','Content-Disposition':'attachment; filename="FICTIONAL-document"','Content-Security-Policy':"default-src 'none'; sandbox"}}));
  }
  const data=await dispatch(action,payload);return reply({ok:true,data});
 }catch(e){const safe=e instanceof SafeFailure?e:new SafeFailure('service_unavailable',503);return reply({ok:false,code:safe.code},safe.status);}
}
