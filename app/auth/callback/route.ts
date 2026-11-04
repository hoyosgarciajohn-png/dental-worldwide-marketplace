import {NextRequest,NextResponse} from 'next/server';
import {client,config,audit} from '../../../lib/m1-server';
import {trustedLocalRequest} from '../../../lib/m1-origin';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest){
 const cfg=config(); const secure=new URL(cfg.origin).protocol==='https:';
 let destination='/account#notice=link_invalid';let recovery:{access_token:string;refresh_token:string}|null=null;
 try{
  if(!trustedLocalRequest(req,cfg.origin,false))throw new Error('invalid_origin');
  const code=req.nextUrl.searchParams.get('code');const verifier=req.cookies.get('dental_pkce')?.value;
  if(!code||code.length>300||!verifier||verifier.length>1000)throw new Error('invalid_callback');
  const c=client(false,{initial:verifier,onValue:()=>{}});
  let recoveryFlow=false;
  const listener=c.auth.onAuthStateChange(event=>{if(event==='PASSWORD_RECOVERY')recoveryFlow=true;});
  const result=await c.auth.exchangeCodeForSession(code);
  listener.data.subscription.unsubscribe();
  await audit('auth.verify',result.data.user?.id||null,!result.error);
  if(result.error||!result.data.session)throw new Error('invalid_callback');
  if(recoveryFlow){recovery=result.data.session;destination='/account#recovery=ready';}
  else {await c.auth.signOut({scope:'global'});destination='/account#notice=sign_in_again';}
 }catch{}
 const response=NextResponse.redirect(new URL(destination,cfg.origin),303);
 response.headers.set('Cache-Control','no-store, private');response.headers.set('Referrer-Policy','no-referrer');
 response.cookies.set('dental_pkce','',{httpOnly:true,sameSite:'lax',secure,path:'/',maxAge:0});
 for(const [name,value] of [['dental_recovery_access',recovery?.access_token||''],['dental_recovery_refresh',recovery?.refresh_token||'']])response.cookies.set(name,value,{httpOnly:true,sameSite:'strict',secure,path:'/',maxAge:recovery?900:0});
 return response;
}
