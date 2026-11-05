import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('home and workspace: accessibility, keyboard and responsive layout',async({page},info)=>{
 const outbound:string[]=[];page.on('request',r=>{if(!/^(127\.0\.0\.1|localhost)$/.test(new URL(r.url()).hostname))outbound.push(new URL(r.url()).origin);});
 for(const path of ['/','/workspace']){
  await page.goto(path);await expect(page.locator('h1')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.keyboard.press('Tab');expect(await page.evaluate(()=>document.activeElement?.tagName!=='BODY')).toBe(true);
  if(info.project.name==='chromium-1440'){
   const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
   expect(result.violations.filter(v=>['critical','serious'].includes(v.impact||'')).map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
   await page.evaluate(()=>{document.documentElement.style.zoom='2';});
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
   await page.evaluate(()=>{document.documentElement.style.zoom='';});
  }
 }
 expect(outbound).toEqual([]);
});
