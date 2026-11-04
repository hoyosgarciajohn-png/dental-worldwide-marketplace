import assert from 'node:assert/strict';
import {spawnSync,spawn} from 'node:child_process';
import {mkdirSync,writeFileSync,readFileSync,rmSync,existsSync} from 'node:fs';
import {cleanupProject} from './runtime-cleanup.mjs';
mkdirSync('.supabase-local',{recursive:true,mode:0o700});
const cli='node_modules/supabase/dist/supabase.js';let server,ready=false,failure,cleanup=false;
function command(args,name,timeout=240000){const r=spawnSync(process.execPath,[cli,...args],{encoding:'utf8',timeout});writeFileSync(`.supabase-local/${name}.log`,`${r.stdout||''}${r.stderr||''}`,{mode:0o600});if(r.status!==0){const diagnostic=(r.stderr||'').split('\n').filter(l=>/error|failed|syntax|migration/i.test(l)).map(l=>l.replace(/[A-Za-z0-9_\-.]{32,}/g,'[redacted]')).join('\n').slice(-1800);if(diagnostic)console.error(diagnostic);throw new Error(`${name} failed (private log retained)`);}console.log(`PASS ${name}`);return r.stdout;}
function run(script,timeout=240000){const r=spawnSync(process.execPath,[script],{stdio:'inherit',timeout});assert.equal(r.status,0,`${script} failed`);}
try{
 assert.equal(spawnSync('docker',['version','--format','{{.Server.Version}}'],{encoding:'utf8',timeout:15000}).status,0,'Docker engine required');
 command(['start','--runtime','docker','--eager','--frozen','--exclude','studio,functions,realtime,analytics,pooler'],'m1-start',360000);ready=true;
 const raw=command(['status','--env','--output-format','text'],'m1-status');const cfg={};for(const line of raw.split(/\r?\n/)){const m=/^([A-Z_]+)=(.*)$/.exec(line);if(m)cfg[m[1]]=m[2].replace(/^['"]|['"]$/g,'');}
 assert.equal(new URL(cfg.API_URL).hostname,'127.0.0.1');assert.ok(cfg.ANON_KEY||cfg.PUBLISHABLE_KEY);assert.ok(cfg.SERVICE_ROLE_KEY||cfg.SECRET_KEY);
 writeFileSync('.supabase-local/connection.json',JSON.stringify(cfg),{mode:0o600});
 command(['db','query','--read-only',"select 1 / (exists(select 1 from pg_namespace where nspname='m1')::int) as m1_schema",'--output-format','json'],'m1-migration-check');
 const advisor=command(['db','advisors','--type','security','--fail-on','error','--output-format','json'],'m1-security-advisors');console.log('Security advisor result:',advisor.slice(0,10000));
 run('scripts/m0-services-smoke.mjs',120000);
 run('scripts/m1-services-test.mjs',360000);
 const env={...process.env,SUPABASE_URL:cfg.API_URL,SUPABASE_ANON_KEY:cfg.ANON_KEY||cfg.PUBLISHABLE_KEY,SUPABASE_SERVICE_ROLE_KEY:cfg.SERVICE_ROLE_KEY||cfg.SECRET_KEY,APP_ORIGIN:'http://127.0.0.1:3000'};
 server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3000'],{env,stdio:['ignore','pipe','pipe']});
 await new Promise((resolve,reject)=>{server.stdout.on('data',b=>{if(b.toString().includes('Ready'))resolve();});server.on('error',reject);server.on('exit',()=>reject(new Error('Local web server exited')));setTimeout(()=>reject(new Error('Local web server timeout')),20000).unref();});
 run('scripts/m1-api-test.mjs',180000);
 const browser=spawnSync(process.execPath,['node_modules/@playwright/test/cli.js','test'],{stdio:'inherit',timeout:180000});assert.equal(browser.status,0,'M1 browser checks failed');console.log('PASS M1-07 six desktop/mobile bilingual and role browser cases');
}catch(e){failure=e;console.error(`FAIL ${e.message}`);}
finally{
 server?.kill('SIGTERM');
 try{if(ready){command(['db','reset','--no-seed','--yes'],'m1-fixture-reset');command(['db','query','--read-only',"select 1 / ((not exists(select 1 from auth.users) and not exists(select 1 from m1.fixture_records) and not exists(select 1 from storage.objects))::int) as empty_after_reset",'--output-format','json'],'m1-empty-after-reset');cleanup=true;}}
 catch(e){failure??=e;console.error(`FAIL cleanup: ${e.message}`);}
 try{cleanupProject({stop:()=>spawnSync(process.execPath,[cli,'stop'],{encoding:'utf8',timeout:30000}),logPath:'.supabase-local/m1-stop.log',connectionPath:'.supabase-local/connection.json'});console.log('PASS M1 project stack stopped');}catch(e){failure??=e;console.error(`FAIL stop: ${e.message}`);}
 finally{rmSync('.supabase-local/m1-fixtures.json',{force:true});rmSync('.env.local',{force:true});}
 assert.equal(existsSync('.supabase-local/connection.json'),false);assert.equal(existsSync('.supabase-local/m1-fixtures.json'),false);
 const read=path=>existsSync(path)?JSON.parse(readFileSync(path,'utf8')):null;
 const evidence={result:failure?'FAIL':'PASS',database:read('.supabase-local/m1-services-evidence.json'),api:read('.supabase-local/m1-api-evidence.json'),cleanup:{fixtures:cleanup?'PASS':'NOT VERIFIED',credentialFiles:'REMOVED'},human:'DEFERRED TO M7',independentAcceptance:'PENDING CHAT 06'};
 writeFileSync('.supabase-local/m1-evidence.json',JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence,null,2));
}
if(failure)process.exitCode=1;
