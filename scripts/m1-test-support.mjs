import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHmac } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
export const connection = JSON.parse(readFileSync('.supabase-local/connection.json','utf8'));
export const apiURL = connection.API_URL;
export const publicKey = connection.ANON_KEY || connection.PUBLISHABLE_KEY;
export const serviceKey = connection.SERVICE_ROLE_KEY || connection.SECRET_KEY;
assert.equal(new URL(apiURL).hostname,'127.0.0.1');
export function client() {return createClient(apiURL,publicKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});}
export const admin=createClient(apiURL,serviceKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
let sqlIndex=0;
export function sql(query, {failure=false}={}) {
 const result=spawnSync(process.execPath,['node_modules/supabase/dist/supabase.js','db','query',query,'--output-format','json'],{encoding:'utf8',timeout:30000});
 writeFileSync(`.supabase-local/sql-${++sqlIndex}.log`,`${result.stdout||''}${result.stderr||''}`,{mode:0o600});
 if(result.status!==0&&!failure){const diagnostic=((result.stdout||'')+'\n'+(result.stderr||'')).split('\n').filter(l=>/error|failed|syntax|statement/i.test(l)).map(l=>l.replace(/[A-Za-z0-9_\-.]{32,}/g,'[redacted]')).join('\n').slice(-1400);if(diagnostic)console.error(diagnostic);}
 if(failure){assert.notEqual(result.status,0,'Expected SQL denial');return;}
 assert.equal(result.status,0,`SQL probe ${sqlIndex} failed (private diagnostic retained)`);
 return result.stdout;
}
export function dbCheck(expression){sql(`select 1 / ((${expression})::int) as assertion`);}
export const q=value=>"'"+String(value).replaceAll("'","''")+"'";
export function ok(result,label){assert.equal(result.error,null,`${label}: service error ${result.error?.code||result.error?.status||''}`);return result.data;}
export async function call(c,action,payload={}) {return ok(await c.rpc('m1_dispatch',{p_action:action,p_payload:payload}),action);}
export async function allow(c,action,payload={}) {const result=await call(c,action,payload);assert.equal(result.ok,true,`${action}: ${result.code||'denied'}`);return result.data;}
export async function deny(c,action,payload={},codes=['forbidden']) {const result=await call(c,action,payload);assert.equal(result.ok,false,`${action} unexpectedly allowed`);assert.ok(codes.includes(result.code),`${action}: unexpected ${result.code}`);return result;}
export async function login(user){const c=client();const data=ok(await c.auth.signInWithPassword({email:user.email,password:user.password}),'login');assert.equal(data.user.id,user.id);await allow(c,'session.open');return c;}
export function totp(secret,time=Date.now()) {
 const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';let bits='';for(const char of secret.replace(/=+$/,'')) bits+=alphabet.indexOf(char.toUpperCase()).toString(2).padStart(5,'0');
 const key=Buffer.from((bits.match(/.{8}/g)||[]).map(b=>parseInt(b,2)));const counter=Buffer.alloc(8);counter.writeBigUInt64BE(BigInt(Math.floor(time/30000)));
 const h=createHmac('sha1',key).update(counter).digest();const offset=h[19]&15;return String((h.readUInt32BE(offset)&0x7fffffff)%1000000).padStart(6,'0');
}
export async function mfa(c){await new Promise(resolve=>setTimeout(resolve,4100));const f=ok(await c.auth.mfa.enroll({factorType:'totp',friendlyName:'FICTIONAL automated check'}),'MFA enroll');ok(await c.auth.mfa.challengeAndVerify({factorId:f.id,code:totp(f.totp.secret)}),'MFA verify');await allow(c,'mfa.complete');return f;}
export async function api(action,payload={},cookies='',headers={}) {
 const response=await fetch('http://127.0.0.1:3000/api/m1',{method:'POST',headers:{origin:'http://127.0.0.1:3000','content-type':'application/json',...(cookies?{cookie:cookies}:{}),...headers},body:JSON.stringify({action,payload}),redirect:'error'});
 return {status:response.status,body:await response.json(),cookies:response.headers.getSetCookie().map(c=>c.split(';')[0]).join('; '),headers:response.headers};
}
