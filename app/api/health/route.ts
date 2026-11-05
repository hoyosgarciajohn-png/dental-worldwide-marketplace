import {NextRequest,NextResponse} from 'next/server';
import {client,config} from '../../../lib/m1-server';
import {trustedLocalRequest} from '../../../lib/m1-origin';
export const dynamic='force-dynamic';export const runtime='nodejs';
export async function GET(req:NextRequest){const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};try{
 if(!trustedLocalRequest(req,config().origin,false))return NextResponse.json({ready:false},{status:403,headers});
 const r=await client(true).rpc('market_health');if(r.error||r.data?.ready!==true)return NextResponse.json({ready:false},{status:503,headers});
 return NextResponse.json({ready:true,mode:'fictional-local'},{headers});
}catch{return NextResponse.json({ready:false},{status:503,headers});}}
