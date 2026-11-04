import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {request} from 'node:http';
const origin='http://127.0.0.1:3101';
// Sentinel strings configure the request guard only; no service connection is attempted.
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3101'],{env:{...process.env,APP_ORIGIN:origin,SUPABASE_URL:'http://127.0.0.1:54321',SUPABASE_ANON_KEY:'fictional-origin-probe',SUPABASE_SERVICE_ROLE_KEY:'fictional-origin-probe'},stdio:['ignore','pipe','pipe']});
try{
 await new Promise((resolve,reject)=>{server.stdout.on('data',b=>{if(b.toString().includes('Ready'))resolve();});server.on('error',reject);server.on('exit',()=>reject(new Error('Server exited')));setTimeout(()=>reject(new Error('Startup timeout')),15000).unref();});
 async function probe(headers,status,code,action='session.me'){
  const r=await fetch(origin+'/api/m1',{method:'POST',headers:{origin,'content-type':'application/json',...headers},body:JSON.stringify({action,payload:{}})});
  assert.equal(r.status,status);assert.equal((await r.json()).code,code);assert.match(r.headers.get('cache-control'),/no-store/);
 }
 await probe({},401,'unauthenticated');
 await probe({origin:'https://example.test'},403,'origin_rejected');
 // Native HTTP preserves the deliberately hostile Host; fetch may replace it.
 await new Promise((resolve,reject)=>{const req=request(origin+'/api/m1',{method:'POST',headers:{host:'example.test',origin,'x-forwarded-host':'127.0.0.1:3101','content-type':'application/json'}},res=>{let body='';res.on('data',chunk=>body+=chunk);res.on('end',()=>{try{assert.equal(res.statusCode,403);assert.equal(JSON.parse(body).code,'origin_rejected');resolve();}catch(error){reject(error);}});});req.on('error',reject);req.end(JSON.stringify({action:'session.me',payload:{}}));});
 await probe({origin:'null'},403,'origin_rejected');
 await probe({},400,'invalid_request','unknown.action');
 const callback=await fetch(origin+'/auth/callback',{redirect:'manual'});assert.equal(callback.status,303);assert.equal(callback.headers.get('location'),origin+'/account#notice=link_invalid');
 console.log('PASS M1 production HTTP request-origin regression: valid unauthenticated requests reach 401; foreign Origin/Host denied; missing callback rejected. No database/auth/mail/browser acceptance.');
}finally{server.kill('SIGTERM');}
