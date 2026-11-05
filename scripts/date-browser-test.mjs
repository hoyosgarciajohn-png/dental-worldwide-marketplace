import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync,rmSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
const output='.date-validation';mkdirSync(output,{recursive:true,mode:0o700});
const expectedProjects=['chromium-1440','chromium-768','chromium-360','firefox-1440','webkit-360'];
let server,failure,serverStopped=false,browserProjects=[],expected=0,unexpected=0;const start=Date.now();
try{
 server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3000'],{env:{...process.env,NEXT_TELEMETRY_DISABLED:'1'},stdio:['ignore','pipe','pipe']});
 const ready=new Promise((done,reject)=>{const timer=setTimeout(()=>reject(Error('Local date-test server startup timed out')),20000);server.stdout.on('data',chunk=>{if(chunk.toString().includes('Ready')){clearTimeout(timer);done();}});server.on('error',error=>{clearTimeout(timer);reject(error);});server.on('exit',code=>{clearTimeout(timer);reject(Error(`Local date-test server exited during startup (${code})`));});});
 await ready;assert.equal((await fetch('http://127.0.0.1:3000/workspace',{signal:AbortSignal.timeout(10000)})).status,200);
 const browser=spawnSync(process.execPath,['node_modules/@playwright/test/cli.js','test','--config','playwright.market.config.ts','tests/market-dates.spec.ts','--reporter=line,json'],{env:{...process.env,PLAYWRIGHT_JSON_OUTPUT_FILE:resolve(output,'results.json')},stdio:'inherit',timeout:300000});
 assert.equal(browser.status,0,'Date browser regression failed');
 const report=JSON.parse(readFileSync(`${output}/results.json`,'utf8'));expected=report.stats.expected;unexpected=report.stats.unexpected;assert.equal(expected,15,'All three date cases must execute in all five projects');assert.equal(unexpected,0);assert.equal(report.stats.skipped,0);
 function inspect(suites){for(const suite of suites){for(const spec of suite.specs||[]){if(spec.title==='saved handoff dates display correctly across browser timezones, languages and legacy reloads')for(const test of spec.tests){assert.equal(test.results.at(-1)?.status,'passed');browserProjects.push(test.projectName);}}inspect(suite.suites||[]);}}
 inspect(report.suites);assert.deepEqual([...browserProjects].sort(),[...expectedProjects].sort(),'Actual browser date journey must run once in every configured project');
}catch(error){failure=error;console.error(`FAIL ${error.message}`);}
finally{
 if(server){if(server.exitCode===null&&server.signalCode===null){server.kill('SIGTERM');await new Promise(done=>{const timer=setTimeout(()=>{server.kill('SIGKILL');done();},5000);server.once('exit',()=>{clearTimeout(timer);done();});});}serverStopped=server.exitCode!==null||server.signalCode!==null;if(!serverStopped){await new Promise(done=>server.once('exit',done));serverStopped=true;}}
 if(!serverStopped)failure??=Error('Local date-test server cleanup not verified');
 const evidence={result:failure?'FAIL':'PASS',source:process.env.GITHUB_SHA||'local',durationSeconds:Math.round((Date.now()-start)/1000),expectedTests:expected,unexpectedTests:unexpected,actualBrowserProjects:browserProjects,timezones:['America/Bogota','Pacific/Kiritimati'],languages:['en','es'],legacyReload:true,server:{origin:'http://127.0.0.1:3000',stopped:serverStopped},scope:'UI date regression only; no database, Auth, Storage, recovery or load service phase'};
 writeFileSync(`${output}/evidence.json`,JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence,null,2));
 rmSync(`${output}/results.json`,{force:true});
}
if(failure)process.exitCode=1;
