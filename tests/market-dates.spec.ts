import {test,expect} from '@playwright/test';
import {formatCalendarDate,formatCaliDate} from '../lib/market-dates';
import {DEMO_KEY,POLICY,initialDemo,demoAction} from '../lib/market-demo';

test('calendar follow-up dates retain the chosen day in western and eastern timezones',()=>{
 const prior=process.env.TZ;
 try{
  for(const zone of ['America/Bogota','America/Los_Angeles','Pacific/Kiritimati']){
   process.env.TZ=zone;
   expect(formatCalendarDate('2026-11-19','en')).toBe('11/19/2026');
   expect(formatCalendarDate('2026-11-19','es')).toBe('19/11/2026');
   // Existing schema-5 records remain readable without reinterpreting their calendar date.
   expect(formatCalendarDate('2026-11-19T00:00:00.000Z','en')).toBe('11/19/2026');
   expect(formatCalendarDate('2028-02-29','en')).toBe('2/29/2028');
   expect(formatCalendarDate('2026-02-30','en')).toBe('—');
  }
 }finally{if(prior===undefined)delete process.env.TZ;else process.env.TZ=prior;}
});

test('connected handoff and expiry timestamps keep their instant and display the Cali date',()=>{
 // The first instant is still November 18 in Cali, unlike a date-only November 19.
 expect(formatCaliDate('2026-11-19T00:00:00Z','en')).toBe('11/18/2026');
 expect(formatCaliDate('2026-11-19T05:00:00Z','en')).toBe('11/19/2026');
 expect(formatCaliDate('2026-11-19T12:00:00-05:00','es')).toBe('19/11/2026');
 expect(formatCaliDate('2026-11-19T23:59:00Z','en')).toBe('11/19/2026');
 expect(formatCaliDate('2026-11-20T04:59:00Z','en')).toBe('11/19/2026');
});

test('saved handoff dates display correctly across browser timezones, languages and legacy reloads',async({browser},info)=>{
 let seed=initialDemo();const site=seed.clinics[0].id;
 seed=demoAction(seed,'patient',site,'enquiry.create',{site_id:site,service:'examination',summary:'FICTIONAL calendar regression',grants:['contact','care'],consent:true,policy:POLICY});
 const id=seed.cases[0].id;
 seed=demoAction(seed,'practice',site,'estimate.issue',{id,amount:39000,currency:'USD',visits:2,expires:'2030-11-19T23:59:00Z',exclusions:'FICTIONAL travel excluded',trip:'FICTIONAL travel unknown'});
 seed=demoAction(seed,'patient',site,'estimate.accept',{id,estimate_id:seed.cases[0].estimates[0].id});
 seed=demoAction(seed,'patient',site,'appointment.request',{id,at:new Date(Date.now()+86400000*7).toISOString()});
 seed=demoAction(seed,'practice',site,'appointment.update',{id,status:'confirmed'});
 seed=demoAction(seed,'practice',site,'appointment.update',{id,status:'attended'});
 for(const timezoneId of ['America/Bogota','Pacific/Kiritimati']){
  const context=await browser.newContext({baseURL:'http://127.0.0.1:3000',viewport:info.project.use.viewport,isMobile:info.project.use.isMobile,hasTouch:info.project.use.hasTouch,timezoneId});
  try{
   await context.addInitScript(({key,state})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(state));},{key:DEMO_KEY,state:seed});
   const page=await context.newPage();await page.goto('/workspace');
   await page.getByLabel('Preview as',{exact:true}).selectOption('practice');
   await page.getByLabel('Follow-up date',{exact:true}).fill('2026-11-19');
   await page.getByRole('button',{name:'Save fictional handoff',exact:true}).click();
   await expect(page.getByText('Follow-up: 11/19/2026',{exact:true})).toBeVisible();
   expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).cases[0].handoff.followUp,DEMO_KEY)).toBe('2026-11-19');
   await expect(page.locator('.dwm-estimate-notes')).toContainText('11/19/2030');
   await page.getByRole('button',{name:'Switch to Spanish',exact:true}).click();
   await expect(page.getByText('Seguimiento: 19/11/2026',{exact:true})).toBeVisible();
   // Verify the stored representation used by already-published previews too.
   await page.evaluate(key=>{const s=JSON.parse(localStorage.getItem(key)!);s.cases[0].handoff.followUp='2026-11-19T00:00:00.000Z';localStorage.setItem(key,JSON.stringify(s));},DEMO_KEY);
   await page.reload();await page.getByRole('button',{name:/Mi recorrido/}).click();
   await expect(page.getByText('Seguimiento: 19/11/2026',{exact:true})).toBeVisible();
  }finally{await context.close();}
 }
});
