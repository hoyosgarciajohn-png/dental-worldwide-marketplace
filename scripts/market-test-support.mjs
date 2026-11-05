import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {client,ok,sql,q,login,allow as m1allow} from './m1-test-support.mjs';
export * from './m1-test-support.mjs';
export const key=()=>randomUUID();
export const fixtures=()=>JSON.parse(readFileSync('.supabase-local/market-fixtures.json','utf8'));
export const m1fixtures=()=>JSON.parse(readFileSync('.supabase-local/m1-fixtures.json','utf8'));
export const save=(name,data)=>writeFileSync(`.supabase-local/${name}.json`,JSON.stringify(data,null,2),{mode:0o600});
export const evidence=(name,data)=>save(name,{...data,fictionalOnly:true,externalCharges:0});
export const subject=s=>JSON.parse(Buffer.from(s.access_token.split('.')[1],'base64url')).sub;
export async function session(c){return ok(await c.auth.getSession(),'session').session;}
export async function restore(s){const c=client();ok(await c.auth.setSession(s),'restore session');return c;}
export async function freshPatients(){return Promise.all(m1fixtures().patients.map(login));}
export async function market(c,action,payload={}){return ok(await c.rpc('market_dispatch',{p_action:action,p_payload:payload}),action);}
export async function yes(c,action,payload={}){const r=await market(c,action,payload);assert.equal(r.ok,true,`${action}: ${r.code||'denied'}`);return r.data;}
export async function no(c,action,payload={},codes){const r=await market(c,action,payload);assert.equal(r.ok,false,`${action} unexpectedly allowed`);if(codes)assert.ok(codes.includes(r.code),`${action}: unexpected ${r.code}`);return r;}
export function resetRates(){sql('truncate table market.rate_buckets');sql('truncate table m1.rate_buckets');}
export async function cookie(c){const s=await session(c);return `dental_access=${s.access_token}; dental_refresh=${s.refresh_token}`;}
export async function http(action,payload={},c='',headers={}){const cookies=typeof c==='string'?c:await cookie(c);const r=await fetch('http://127.0.0.1:3000/api/market',{method:'POST',headers:{origin:'http://127.0.0.1:3000','content-type':'application/json',...(cookies?{cookie:cookies}:{}),...headers},body:JSON.stringify({action,payload})});const type=r.headers.get('content-type')||'';return {status:r.status,body:type.includes('json')?await r.json():Buffer.from(await r.arrayBuffer()),headers:r.headers};}
// Read only SQL fixture extraction; values never go to stdout or sanitized evidence.
export function value(expression){const raw=sql(`select (${expression}) as fixture_value`);const parsed=JSON.parse(raw);const walk=x=>{if(x&&typeof x==='object'){if(Object.hasOwn(x,'fixture_value'))return {found:true,value:x.fixture_value};for(const v of Object.values(x)){const r=walk(v);if(r?.found)return r;}}};const result=walk(parsed);assert.ok(result?.found,'CLI SQL JSON fixture result missing');return result.value;}
export const future=(days=10)=>new Date(Date.now()+days*86400000).toISOString();
export async function authenticateFixturePersona(role){const f=m1fixtures();return restore(f.personas[role]);}
