import {test,expect,request,type BrowserContext,type Page} from '@playwright/test';
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
type FixtureSession={access_token:string;refresh_token:string};
const subject=(s:FixtureSession):string=>JSON.parse(Buffer.from(s.access_token.split('.')[1],'base64url').toString()).sub;
async function currentIdentity(page:Page){
 return page.evaluate(async()=>{const r=await fetch('/api/market',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'session.me',payload:{}})});const b=await r.json();return {status:r.status,ok:b.ok,user_id:b.data?.user_id,roles:b.data?.memberships?.map((m:{role:string})=>m.role),code:b.code};});
}
async function assertDeniedForActor(page:Page,s:FixtureSession,role:string){
 const before=await currentIdentity(page);expect(before.status,`${role}: identity lookup must succeed`).toBe(200);expect(before.ok).toBe(true);expect(before.user_id,`${role}: denial must use the intended authenticated actor`).toBe(subject(s));
 const result=await page.evaluate(async id=>{const r=await fetch('/api/market',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'enquiry.read',payload:{id}})});const b=await r.json();return {status:r.status,ok:b.ok,code:b.code,hasData:Object.prototype.hasOwnProperty.call(b,'data'),hasClinicalAggregate:!!b.data?.enquiry};},f.enquiries[0].id);
 const after=await currentIdentity(page);expect(after.user_id,`${role}: actor must remain unchanged across the denied read`).toBe(subject(s));
 expect(result,`${role}: authenticated denial; safe response shape only`).toEqual({status:403,ok:false,code:'forbidden',hasData:false,hasClinicalAggregate:false});
}
test('actual role scopes and inaccessible clinical data remain enforced in connected browser',async({browser},info)=>{
 for(const [role,s] of [['practice',f.staff[0].session],['reviewer',f.reviewer],['platform',f.platform]] as [string,FixtureSession][]){
  // Actors have independent cookie jars. A prior actor's in-flight responses cannot rewrite a later actor's credentials.
  const context=await browser.newContext({viewport:info.project.use.viewport,isMobile:info.project.use.isMobile,hasTouch:info.project.use.hasTouch,baseURL:'http://127.0.0.1:3000'});
  try{
   await identify(context,s);const page=await context.newPage();await page.goto('/workspace');await page.getByRole('button',{name:'Connected test',exact:true}).click();await expect(page.getByRole('heading',{name:'Connected workspace',exact:true})).toBeVisible();await expect(page.getByRole('link',{name:/Account & MFA/})).toBeVisible();
   expect((await currentIdentity(page)).user_id,`${role}: browser must authenticate as the selected fixture`).toBe(subject(s));
   await expect(page.getByRole('heading',{name:'Practice profiles & evidence',exact:true})).toHaveCount(role==='platform'?0:1);await expect(page.getByRole('heading',{name:'Operations — metadata only',exact:true})).toHaveCount(role==='platform'?1:0);
   if(role==='practice'){
    const patientSession=f.patients[10],headers={origin:'http://127.0.0.1:3000',cookie:`dental_access=${patientSession.access_token}; dental_refresh=${patientSession.refresh_token}`};
    const fixtureRequest=await request.newContext({baseURL:'http://127.0.0.1:3000'});
    try{
     const aggregate=await (await fixtureRequest.post('/api/market',{headers,data:{action:'enquiry.read',payload:{id:f.enquiries[10].id}}})).json();expect(aggregate.ok).toBe(true);const quote=aggregate.data.estimates.at(-1);
     const requested=await (await fixtureRequest.post('/api/market',{headers,data:{action:'appointment.request',payload:{key:randomUUID(),enquiry_id:f.enquiries[10].id,estimate_id:quote.id,starts_at:new Date(Date.now()+20*86400000).toISOString(),timezone:'America/Bogota'}}})).json();expect(requested.ok).toBe(true);
    }finally{await fixtureRequest.dispose();}
    await page.getByRole('button',{name:'Refresh',exact:true}).click();await page.getByRole('button',{name:/patient 11 enquiry/}).click();await page.getByLabel('Date and time in Cali',{exact:true}).fill(new Date(Date.now()+21*86400000).toISOString().slice(0,10)+'T10:00');
    const proposed=page.waitForResponse(r=>r.url().endsWith('/api/market')&&r.request().postDataJSON()?.action==='appointment.propose');await page.getByRole('button',{name:'Propose new time',exact:true}).click();expect((await (await proposed).json()).ok).toBe(true);
   }
   if(role==='platform'||role==='reviewer'){await expect(page.getByRole('heading',{name:'Accessible enquiries',exact:true})).toHaveCount(0);await assertDeniedForActor(page,s,role);}
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  }finally{await context.close();}
 }
});

test('delayed ordinary responses cannot replace a newer authenticated actor',async({page,context})=>{
 for(const endpoint of ['/api/market','/api/m1'])for(const scenario of ['valid','invalid'] as const){
  // The invalid old access token deliberately retains a valid old refresh cookie.
  // An ordinary endpoint must reject it, never substitute/refresh the old session.
  const originalSession=scenario==='valid'?f.staff[0].session:{access_token:'invalid-old-access-token',refresh_token:f.staff[0].session.refresh_token};
  await identify(context,originalSession);await page.goto('/');
  let release!:()=>void,entered!:()=>void,captured=false;
  const gate=new Promise<void>(resolve=>{release=resolve;}),intercepted=new Promise<void>(resolve=>{entered=resolve;});
  let cookieNames:string[]=[];
  await page.route(`**${endpoint}`,async route=>{
   if(captured||route.request().postDataJSON()?.action!=='session.me'){await route.continue();return;}
   captured=true;
   // Obtain the real old-actor BFF response before changing the browser cookie jar.
   // WebKit may select its current cookie jar when route.fetch runs, even when
   // request.allHeaders was captured earlier. Delay delivery, not authentication.
   const response=await route.fetch();
   cookieNames=response.headersArray().filter(h=>h.name.toLowerCase()==='set-cookie').map(h=>h.value.split('=',1)[0]);
   entered();await gate;
   await route.fulfill({response});
  });
  try{
   const delayed=page.evaluate(async endpoint=>{const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'session.me',payload:{}})});const b=await r.json();return {status:r.status,ok:b.ok,user_id:b.data?.user_id??null,code:b.code??null};},endpoint);
   await intercepted;await identify(context,f.reviewer);release();
   const originalResponse=await delayed;
   expect(originalResponse).toEqual(scenario==='valid'?{status:200,ok:true,user_id:subject(f.staff[0].session),code:null}:{status:401,ok:false,user_id:null,code:'session_expired'});
   expect(cookieNames.filter(n=>n==='dental_access'||n==='dental_refresh'),`${endpoint}: delayed ${scenario} ordinary response must neither set nor clear credentials`).toEqual([]);
   await assertDeniedForActor(page,f.reviewer,`reviewer after delayed ${scenario} ${endpoint}`);
  }finally{release();await page.unroute(`**${endpoint}`);}
 }
});
