import assert from 'node:assert/strict';
import {spawnSync,spawn} from 'node:child_process';
import {mkdirSync,writeFileSync,readFileSync,rmSync,existsSync,readdirSync} from 'node:fs';
import {cleanupProject} from './runtime-cleanup.mjs';
mkdirSync('.supabase-local',{recursive:true,mode:0o700});const cli='node_modules/supabase/dist/supabase.js',phase=process.env.MARKET_PHASE||'full';assert.ok(['full','load'].includes(phase));
let server,ready=false,failure,cleanup=false,m1Browser='NOT PERFORMED',marketBrowser='NOT PERFORMED';const phases={};
function sanitize(s){return s.replace(/(?:eyJ|sb_secret_|sb_publishable_)[A-Za-z0-9_.-]+/g,'[REDACTED]').replace(/[A-Za-z0-9_.%+-]+@example\.test/g,'[FICTIONAL EMAIL]');}
function command(args,name,timeout=240000){const r=spawnSync(process.execPath,[cli,...args],{encoding:'utf8',timeout});writeFileSync(`.supabase-local/${name}.log`,`${r.stdout||''}${r.stderr||''}`,{mode:0o600});if(r.status!==0){console.error(sanitize((r.stderr||'').slice(-1500)));throw new Error(`${name} failed; private diagnostics retained until cleanup`);}console.log(`PASS ${name}`);return r.stdout;}
function run(script,timeout=240000){const r=spawnSync(process.execPath,[script],{encoding:'utf8',timeout});const out=sanitize(`${r.stdout||''}${r.stderr||''}`);writeFileSync(`.supabase-local/${script.split('/').at(-1)}.sanitized.log`,out);console.log(out);phases[script]=r.status===0?'PASS':'FAIL';assert.equal(r.status,0,`${script} failed`);}
function browser(config,file){const args=['node_modules/@playwright/test/cli.js','test','--config',config,...(file?[file]:[])];const r=spawnSync(process.execPath,args,{encoding:'utf8',timeout:240000});const out=sanitize(`${r.stdout||''}${r.stderr||''}`);writeFileSync(`.supabase-local/${config}.sanitized.log`,out);console.log(out);return r.status===0?'PASS':'FAIL';}
const before=Date.now();try{
 assert.equal(spawnSync('docker',['version','--format','{{.Server.Version}}'],{encoding:'utf8',timeout:15000}).status,0,'Docker engine required');
 command(['start','--runtime','docker','--eager','--frozen','--exclude','studio,functions,realtime,analytics,pooler'],'market-start',360000);ready=true;
 const raw=command(['status','--env','--output-format','text'],'market-status'),cfg={};for(const line of raw.split(/\r?\n/)){const m=/^([A-Z_]+)=(.*)$/.exec(line);if(m)cfg[m[1]]=m[2].replace(/^['"]|['"]$/g,'');}
 assert.equal(new URL(cfg.API_URL).hostname,'127.0.0.1');assert.ok(cfg.ANON_KEY||cfg.PUBLISHABLE_KEY);assert.ok(cfg.SERVICE_ROLE_KEY||cfg.SECRET_KEY);writeFileSync('.supabase-local/connection.json',JSON.stringify(cfg),{mode:0o600});
 command(['db','query','--read-only',"select 1 / (exists(select 1 from pg_namespace where nspname='market')::int) as market_schema",'--output-format','json'],'market-migration-check');
 command(['db','advisors','--type','security','--fail-on','error','--output-format','json'],'market-security-advisors');
 const env={...process.env,SUPABASE_URL:cfg.API_URL,SUPABASE_ANON_KEY:cfg.ANON_KEY||cfg.PUBLISHABLE_KEY,SUPABASE_SERVICE_ROLE_KEY:cfg.SERVICE_ROLE_KEY||cfg.SECRET_KEY,APP_ORIGIN:'http://127.0.0.1:3000',MARKET_ALLOW_SIMULATED_SCAN:'1'};
 server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3000'],{env,stdio:['ignore','pipe','pipe']});
 await new Promise((resolve,reject)=>{server.stdout.on('data',b=>{if(b.toString().includes('Ready'))resolve();});server.on('error',reject);server.on('exit',()=>reject(new Error('Local web server exited')));setTimeout(()=>reject(new Error('Local web server timeout')),20000).unref();});
 if(phase==='full'){
  run('scripts/m0-services-smoke.mjs',120000);run('scripts/m1-services-test.mjs',360000);run('scripts/m1-api-test.mjs',180000);
  // Explicit untouched M1 browser suite MUST precede all marketplace mutations.
  m1Browser=browser('playwright.config.ts','tests/m1-account.spec.ts');assert.equal(m1Browser,'PASS','M1 original regression failed');
  run('scripts/market-services-test.mjs',300000);run('scripts/market-api-test.mjs',180000);
  marketBrowser=browser('playwright.market.config.ts');assert.equal(marketBrowser,'PASS','Marketplace connected browser/accessibility checks failed');
  run('scripts/market-recovery-test.mjs',300000);
 }else run('scripts/market-load-test.mjs',660000);
}catch(e){failure=e;console.error(`FAIL ${sanitize(e.message)}`);}
finally{
 server?.kill('SIGTERM');
 try{if(ready){command(['db','reset','--no-seed','--yes'],'market-fixture-reset');command(['db','query','--read-only',"select 1 / ((not exists(select 1 from auth.users) and not exists(select 1 from m1.fixture_records) and not exists(select 1 from market.enquiries) and not exists(select 1 from storage.objects))::int) as empty_after_reset",'--output-format','json'],'market-empty-after-reset');cleanup=true;}}
 catch(e){failure??=e;console.error(`FAIL fixture cleanup: ${e.message}`);}
 try{cleanupProject({stop:()=>spawnSync(process.execPath,[cli,'stop'],{encoding:'utf8',timeout:30000}),logPath:'.supabase-local/market-stop.log',connectionPath:'.supabase-local/connection.json'});}catch(e){failure??=e;console.error(`FAIL stack stop: ${e.message}`);}
 // Private raw SQL/status logs may contain identifiers, credentials or snapshot rows.
 // Only explicit evidence JSON and sanitized test output survive cleanup.
 for(const file of readdirSync('.supabase-local'))if(!file.endsWith('-evidence.json')&&!file.endsWith('.sanitized.log'))rmSync(`.supabase-local/${file}`,{recursive:true,force:true});rmSync('.env.local',{force:true});
 for(const name of ['connection.json','m1-fixtures.json','market-fixtures.json','recovery-private-snapshot.json','recovery-private-object.bin'])assert.equal(existsSync(`.supabase-local/${name}`),false);
 const read=name=>existsSync(`.supabase-local/${name}.json`)?JSON.parse(readFileSync(`.supabase-local/${name}.json`,'utf8')):null;
 const evidence={result:failure?'FAIL':'PASS',phase,durationSeconds:Math.round((Date.now()-before)/1000),phases,m1:{services:read('m1-services-evidence'),api:read('m1-api-evidence'),browser:m1Browser},market:{services:read('market-services-evidence'),api:read('market-api-evidence'),browser:marketBrowser,recovery:read('market-recovery-evidence'),load:read('market-load-evidence')},cleanup:{fixtures:cleanup?'PASS':'NOT VERIFIED',privateCredentialsAndSnapshots:'REMOVED'},realPatientData:false,outboundMessages:false,externalCharges:0,human:'DEFERRED TO M7',productionLaunch:'NOT AUTHORIZED'};
 writeFileSync(`.supabase-local/market-${phase}-evidence.json`,JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence,null,2));
}
if(failure)process.exitCode=1;
