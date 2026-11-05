import {test,expect,type BrowserContext} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
test.beforeEach(()=>{execFileSync(process.execPath,['node_modules/supabase/dist/supabase.js','db','query','truncate table market.rate_buckets'],{stdio:'ignore',timeout:30000});});
const f=JSON.parse(readFileSync('.supabase-local/market-fixtures.json','utf8'));
async function identify(context:BrowserContext,s:{access_token:string;refresh_token:string}){await context.clearCookies();await context.addCookies([{name:'dental_access',value:s.access_token,url:'http://127.0.0.1:3000',httpOnly:true,sameSite:'Strict'},{name:'dental_refresh',value:s.refresh_token,url:'http://127.0.0.1:3000',httpOnly:true,sameSite:'Strict'}]);}
test('actual patient browser journey, persistence, recipient consent and bilingual connected identity',async({page,context},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await identify(context,f.patients[2]);await page.goto('/workspace');await page.getByRole('button',{name:'Connected test',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Connected workspace',exact:true})).toBeVisible();await expect(page.getByRole('heading',{name:'Practices in the test directory',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Start enquiry',exact:true}).first().click();const marker=`browser ${info.project.name} ${Date.now()}`;
 await page.getByLabel('Fictional enquiry',{exact:true}).fill(marker);await page.getByLabel('Share contact details with this practice',{exact:true}).check();await page.getByLabel('Share this enquiry and conversations',{exact:true}).check();await page.getByLabel('Share generated sample files (optional)',{exact:true}).check();await page.getByLabel('I agree to recipient-specific sharing under policy 2026-11-04.',{exact:true}).check();
 await page.getByRole('button',{name:'Create fictional enquiry',exact:true}).click();await expect(page.getByRole('heading',{name:'Conversation',exact:true})).toBeVisible();await expect(page.locator('.dwm-journey-summary')).toContainText(marker);
 await page.getByLabel('Fictional message',{exact:true}).fill(`message ${marker}`);await page.getByRole('button',{name:'Send message',exact:true}).click();await expect(page.locator('.dwm-message')).toContainText(`message ${marker}`);
 await page.getByRole('button',{name:'Upload generated sample',exact:true}).click();await expect(page.getByText('Simulated clean',{exact:true})).toBeVisible();const download=page.waitForEvent('download');await page.getByRole('button',{name:/Download authorized sample/}).click();expect((await download).suggestedFilename()).toContain('FICTIONAL');
 await page.getByLabel('Allow this practice access',{exact:true}).uncheck();await page.getByRole('button',{name:'Save sharing choices',exact:true}).click();await expect(page.locator('.dwm-journey-summary')).toContainText('Practice sharing withdrawn');
 const exported=page.waitForEvent('download');await page.getByRole('button',{name:/Export my current records/}).click();expect((await exported).suggestedFilename()).toContain('FICTIONAL-connected-export');
 expect(await page.evaluate(()=>document.cookie)).not.toContain('dental_access');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 // Verify database persistence with a fresh page mount, not a local reducer.
 await page.reload();await page.getByRole('button',{name:'Connected test',exact:true}).click();await page.getByRole('button',{name:new RegExp(marker)}).click();await expect(page.locator('.dwm-message')).toContainText(`message ${marker}`);
 await page.getByRole('button',{name:'Switch to Spanish',exact:true}).click();await expect(page.getByRole('heading',{name:'Espacio conectado',exact:true})).toBeVisible();await expect(page.locator('html')).toHaveAttribute('lang','es');expect(errors).toEqual([]);
});
test('actual role scopes and inaccessible clinical data remain enforced in connected browser',async({page,context})=>{
 for(const [role,s] of [['practice',f.staff[0].session],['reviewer',f.reviewer],['platform',f.platform]] as [string,{access_token:string;refresh_token:string}][]){
  await identify(context,s);await page.goto('/workspace');await page.getByRole('button',{name:'Connected test',exact:true}).click();await expect(page.getByRole('heading',{name:'Connected workspace',exact:true})).toBeVisible();await expect(page.getByRole('link',{name:/Account & MFA/})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Practice profiles & evidence',exact:true})).toHaveCount(role==='platform'?0:1);await expect(page.getByRole('heading',{name:'Operations — metadata only',exact:true})).toHaveCount(role==='platform'?1:0);
  if(role==='practice'){
   const patientSession=f.patients[10],headers={origin:'http://127.0.0.1:3000',cookie:`dental_access=${patientSession.access_token}; dental_refresh=${patientSession.refresh_token}`};
   const aggregate=await (await page.request.post('/api/market',{headers,data:{action:'enquiry.read',payload:{id:f.enquiries[10].id}}})).json();expect(aggregate.ok).toBe(true);const quote=aggregate.data.estimates.at(-1);
   const requested=await (await page.request.post('/api/market',{headers,data:{action:'appointment.request',payload:{key:randomUUID(),enquiry_id:f.enquiries[10].id,estimate_id:quote.id,starts_at:new Date(Date.now()+20*86400000).toISOString(),timezone:'America/Bogota'}}})).json();expect(requested.ok).toBe(true);
   await page.getByRole('button',{name:'Refresh',exact:true}).click();await page.getByRole('button',{name:/patient 11 enquiry/}).click();await page.getByLabel('Date and time in Cali',{exact:true}).fill(new Date(Date.now()+21*86400000).toISOString().slice(0,10)+'T10:00');
   const proposed=page.waitForResponse(r=>r.url().endsWith('/api/market')&&r.request().postDataJSON()?.action==='appointment.propose');await page.getByRole('button',{name:'Propose new time',exact:true}).click();expect((await (await proposed).json()).ok).toBe(true);
  }
  if(role==='platform'||role==='reviewer'){await expect(page.getByRole('heading',{name:'Accessible enquiries',exact:true})).toHaveCount(0);const result=await page.evaluate(async id=>{const r=await fetch('/api/market',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'enquiry.read',payload:{id}})});return {status:r.status,body:await r.json()};},f.enquiries[0].id);expect(result.status).toBe(403);expect(result.body.ok).toBe(false);}
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 }
});
