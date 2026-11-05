import {test,expect} from '@playwright/test';
import {initialDemo,demoAction,visibleCases,restoreDemo,POLICY,type DemoRole,type DemoState} from '../lib/market-demo';

test('fictional state gates unknown prices, revisions, appointment acceptance and withdrawal',()=>{
 let s=initialDemo();const site=s.clinics[0].id;
 const act=(role:DemoRole,action:string,p:Record<string,unknown>={})=>{s=demoAction(s,role,site,action,{id:s.cases[0]?.id,...p});};
 act('patient','enquiry.create',{site_id:site,service:'examination',summary:'FICTIONAL initial question',grants:['contact','care','files'],consent:true,policy:POLICY});
 const quote={amount:39000,currency:'USD',visits:2,expires:new Date(Date.now()+86400000*30).toISOString(),exclusions:'FICTIONAL travel excluded',trip:'FICTIONAL unknown travel costs'};
 act('practice','estimate.issue',{...quote,unknown:true});
 expect(()=>act('patient','estimate.accept',{estimate_id:s.cases[0].estimates[0].id})).toThrow();
 const original=structuredClone(s.cases[0].estimates[0]);act('practice','estimate.issue',quote);
 expect(s.cases[0].estimates[0]).toEqual(original);expect(()=>act('patient','estimate.accept',{estimate_id:original.id})).toThrow();
 act('patient','estimate.accept',{estimate_id:s.cases[0].estimates[1].id});
 act('patient','appointment.request',{at:new Date(Date.now()+86400000*7).toISOString()});
 act('practice','appointment.update',{status:'proposed',at:new Date(Date.now()+86400000*8).toISOString()});
 expect(()=>act('practice','appointment.update',{status:'confirmed'})).toThrow();
 act('patient','appointment.accept');act('practice','appointment.update',{status:'confirmed'});act('practice','appointment.update',{status:'attended'});
 act('practice','handoff.save',{text:'FICTIONAL no care instructions',followUp:new Date(Date.now()+86400000*14).toISOString()});act('patient','handoff.ack');
 act('patient','review.submit',{rating:4,text:'FICTIONAL experience',conflict:'FICTIONAL no conflict'});act('reviewer','review.moderate',{status:'rejected',reason:'FICTIONAL needs more context'});act('patient','review.appeal',{reason:'FICTIONAL additional context'});expect(s.cases[0].review?.status).toBe('appealed');
 act('patient','message.send',{text:'FICTIONAL queued before withdrawal'});act('patient','enquiry.withdraw');
 expect(visibleCases(s,'practice',site)).toEqual([]);expect(visibleCases(s,'patient',site)).toHaveLength(1);
 act('admin','enquiry.continuity',{enabled:true});expect(visibleCases(s,'practice',site)).toEqual([]);
 act('admin','outbox.process');expect(s.outbox[0].state).toBe('denied');
 expect(()=>act('practice','message.send',{text:'FICTIONAL blocked'})).toThrow();expect(restoreDemo(s)).not.toBeNull();expect(restoreDemo({...s,schema:4})).toBeNull();const malformed=structuredClone(s);malformed.cases[0].estimates=[null] as any;expect(restoreDemo(malformed)).toBeNull();const badInvoice=structuredClone(s);badInvoice.invoices=[{id:'bad',site_id:'missing',amount:9900,currency:'USD',period:'2026-11'}];expect(restoreDemo(badInvoice)).toBeNull();
});

test('fictional practice boundaries, quarantine and clinical escalation stay explicit',()=>{
 let s=initialDemo();const site=s.clinics[0].id;
 s=demoAction(s,'patient',site,'enquiry.create',{site_id:site,service:'examination',summary:'FICTIONAL test',grants:['contact','care','files'],consent:true,policy:POLICY});const id=s.cases[0].id;
 expect(visibleCases(s,'reviewer',site)).toEqual([]);expect(visibleCases(s,'admin',site)).toEqual([]);expect(visibleCases(s,'practice',s.clinics[1].id)).toEqual([]);
 s=demoAction(s,'patient',site,'file.register',{id});expect(s.cases[0].files[0].state).toBe('quarantine');
 s=demoAction(s,'patient',site,'file.scan',{id,file_id:s.cases[0].files[0].id,result:'error'});expect(s.cases[0].files[0].state).toBe('error');
 s=demoAction(s,'patient',site,'support.create',{id,category:'clinical',text:'FICTIONAL escalation'});expect(s.cases[0].support[0].status).toBe('escalated');
 expect(()=>demoAction(s,'practice',site,'support.update',{id,ticket_id:s.cases[0].support[0].id})).toThrow();
 s=demoAction(s,'reviewer',site,'profile.review',{site_id:site,status:'suspended',reason:'FICTIONAL suspension'});expect(visibleCases(s,'practice',site)).toEqual([]);
 expect(()=>demoAction(s,'patient',site,'enquiry.create',{site_id:site,service:'crown',summary:'FICTIONAL new question',grants:['care','contact'],consent:true,policy:POLICY})).toThrow();
 s=demoAction(s,'admin',site,'invoice.create',{site_id:site,period:'2026-11'});expect(s.invoices[0].amount).toBe(9900);
 expect(()=>demoAction(s,'admin',site,'invoice.create',{site_id:site,period:'2026-11'})).toThrow();
});

test('browser demo: enquiry, practice quote, patient acceptance, local persistence and withdrawal',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/workspace');
 await page.getByRole('button',{name:'Start enquiry',exact:false}).first().click();
 await page.getByLabel('Fictional enquiry',{exact:true}).fill('Fictional question for this practice');
 await page.getByLabel('Fictional contact details',{exact:true}).check();await page.getByLabel('This enquiry and conversations',{exact:true}).check();await page.getByLabel('Fictional files (optional)',{exact:true}).check();await page.getByLabel('I understand this is fictional and agree to the preview sharing policy.',{exact:true}).check();
 await page.getByRole('button',{name:/Create fictional enquiry/}).click();await expect(page.getByRole('heading',{name:'A conversation worth keeping.',exact:true})).toBeVisible();
 await page.getByLabel('Fictional message',{exact:true}).fill('Please clarify the fictional quote');await page.getByRole('button',{name:/Send fictional message/}).click();await expect(page.locator('.dwm-message')).toContainText('Please clarify');
 await page.getByRole('button',{name:'Add generated fictional sample',exact:true}).click();await expect(page.getByText('Quarantined',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Simulate Simulated clean',exact:true}).click();await expect(page.getByRole('button',{name:/Download sample metadata/})).toBeVisible();
 await page.getByLabel('Preview as',{exact:true}).selectOption('practice');await page.getByText('Prepare fictional estimate',{exact:true}).click();await page.getByRole('button',{name:'Issue fictional estimate',exact:true}).click();
 await page.getByLabel('Preview as',{exact:true}).selectOption('patient');await page.getByRole('button',{name:/My journey/}).click();await page.getByRole('button',{name:'Accept this revision',exact:true}).click();await page.getByRole('button',{name:'Request appointment',exact:true}).click();await expect(page.getByText('Requested',{exact:true})).toBeVisible();
 await page.getByLabel('Preview as',{exact:true}).selectOption('practice');await page.getByRole('button',{name:'Confirm appointment',exact:true}).click();await page.getByRole('button',{name:'Simulate attendance',exact:true}).click();await expect(page.getByText('Attendance simulated',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Save fictional handoff',exact:true}).click();
 await page.getByLabel('Preview as',{exact:true}).selectOption('patient');await page.getByRole('button',{name:/My journey/}).click();await page.getByRole('button',{name:'Acknowledge handoff',exact:true}).click();await expect(page.getByText('Acknowledged',{exact:true})).toBeVisible();
 await page.reload();await page.getByRole('button',{name:/My journey/}).click();await expect(page.locator('.dwm-message')).toContainText('Please clarify');await page.getByRole('button',{name:'Withdraw practice access',exact:true}).click();await expect(page.getByText('Sharing withdrawn',{exact:true})).toBeVisible();
 await page.getByLabel('Preview as',{exact:true}).selectOption('practice');await expect(page.getByRole('heading',{name:'Conversation',exact:true})).toHaveCount(0);
 expect(errors).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});

test('Spanish content and fictional disclosure persist between home and workspace',async({page})=>{
 await page.goto('/');await expect(page.getByText(/Fictional data only/)).toBeVisible();await expect(page.getByText(/Solo datos ficticios/)).toBeVisible();await page.getByRole('button',{name:'Switch to Spanish',exact:true}).click();await expect(page.locator('html')).toHaveAttribute('lang','es');await page.getByRole('link',{name:/Explorar el mercado ficticio/}).click();await expect(page.getByRole('heading',{name:'Encuentra tu próximo paso.',exact:true})).toBeVisible();await page.getByRole('button',{name:/Privacidad y acceso/}).click();await expect(page.getByRole('heading',{name:'Comparte con intención.',exact:true})).toBeVisible();await page.reload();await expect(page.locator('html')).toHaveAttribute('lang','es');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
