import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const fixtures=JSON.parse(readFileSync('.supabase-local/m1-fixtures.json','utf8'));
test('bilingual navigation, keyboard, registration/recovery forms and responsive width',async({page})=>{
 await page.goto('/account');await expect(page.getByRole('heading',{name:'Your account workspace'})).toBeVisible();
 await page.keyboard.press('Tab');await expect(page.getByRole('link',{name:'Home',exact:true})).toBeFocused();
 await page.getByRole('button',{name:'Create account',exact:true}).click();await expect(page.getByRole('heading',{name:'Create account',exact:true})).toBeVisible();await expect(page.getByLabel('Password',{exact:true})).toHaveAttribute('minlength','12');
 await page.getByRole('button',{name:'Recover account',exact:true}).click();await expect(page.getByLabel('Password',{exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Español',exact:true}).click();await expect(page.getByRole('heading',{name:'Tu espacio de cuenta'})).toBeVisible();await expect(page.locator('html')).toHaveAttribute('lang','es');await expect(page.getByLabel('Correo electrónico')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await page.reload();await expect(page.getByRole('heading',{name:'Tu espacio de cuenta'})).toBeVisible();
});
test('actual patient sign-in, fixture scope, private cookies and sign-out',async({page})=>{
 const u=fixtures.patients[19];await page.goto('/account');await page.getByLabel('Email address',{exact:true}).fill(u.email);await page.getByLabel('Password',{exact:true}).fill(u.password);await page.getByRole('button',{name:'Continue',exact:true}).click();await expect(page.getByText('Account active',{exact:false})).toBeVisible();
 await page.getByRole('button',{name:'Refresh records',exact:true}).click();await expect(page.getByText('FICTIONAL record 20',{exact:true})).toBeVisible();await expect(page.getByText('FICTIONAL record 1',{exact:true})).toHaveCount(0);
 expect(await page.evaluate(()=>document.cookie)).not.toContain('dental_access');expect(await page.evaluate(()=>Object.keys(localStorage))).toEqual(['dental_language']);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await page.getByRole('button',{name:'Security',exact:true}).click();await expect(page.getByRole('heading',{name:'Authenticator protection'})).toBeVisible();
 await page.getByRole('button',{name:'Español',exact:true}).click();await expect(page.getByRole('heading',{name:'Protección con autenticador'})).toBeVisible();
 await page.getByRole('button',{name:'Cerrar todas las sesiones',exact:true}).click();await expect(page.getByRole('heading',{name:'Ingresar',exact:true})).toBeVisible();await page.reload();await expect(page.getByRole('heading',{name:'Ingresar',exact:true})).toBeVisible();
});

test('all seven role workspaces enforce visible control scope with actual authenticated sessions',async({page,context})=>{
 for(const [role,session] of Object.entries(fixtures.personas) as [string,{access_token:string;refresh_token:string}][]){
  await context.clearCookies();await context.addCookies([{name:'dental_access',value:session.access_token,url:'http://127.0.0.1:3000',httpOnly:true,sameSite:'Strict'},{name:'dental_refresh',value:session.refresh_token,url:'http://127.0.0.1:3000',httpOnly:true,sameSite:'Strict'}]);
  await page.goto('/account');await expect(page.getByText('Account active',{exact:false})).toBeVisible();
  await expect(page.getByRole('button',{name:'Audit',exact:true})).toHaveCount(role==='security_auditor'?1:0);
  await page.getByRole('button',{name:'Access',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Membership permissions',exact:true})).toHaveCount(['platform_admin','practice_admin'].includes(role)?1:0);
  await expect(page.getByRole('heading',{name:'Account status',exact:true})).toHaveCount(role==='platform_admin'?1:0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 }
});
