// Usage: node check-i18n.js  -> lists any translation key used in the HTML or app.js that is missing in EN or ES.
const fs=require("fs"),vm=require("vm"),path=require("path");const dir=__dirname;
const src=fs.readFileSync(path.join(dir,"i18n.js"),"utf8").split("/* ---- Engine ---- */")[0];
const ctx={};vm.createContext(ctx);vm.runInContext(src+";this.R={HTML_EN,HTML_ES,JS_EN,JS_ES};",ctx);
const EN=Object.assign({},ctx.R.HTML_EN,ctx.R.JS_EN),ES=Object.assign({},ctx.R.HTML_ES,ctx.R.JS_ES);
const used=new Map();const add=(k,f)=>{if(!used.has(k))used.set(k,new Set());used.get(k).add(f);};
for(const f of fs.readdirSync(dir).filter(f=>f.endsWith(".html"))){const h=fs.readFileSync(path.join(dir,f),"utf8");
  for(const m of h.matchAll(/data-i18n(?:-html|-placeholder|-aria|-alt|-title|-content)?="([^"]+)"/g))add(m[1],f);}
for(const jf of ["app.js","auth.js","api.js","dashboard.js"]){
  if(!fs.existsSync(path.join(dir,jf)))continue;
  const js=fs.readFileSync(path.join(dir,jf),"utf8");
  for(const m of js.matchAll(/\bt\(\s*"([^"]*[^"_])"/g))add(m[1],jf);
  for(const m of js.matchAll(/"(js\.[\w]*[a-zA-Z0-9])"/g))add(m[1],jf);
}
["js.plan_free","js.plan_basic","js.plan_growth","js.plan_premium","js.langLabel","js.switchTo"].forEach(k=>add(k,"i18n.js"));
let bad=0;for(const [k,fs_] of used){const miss=[!(k in EN)&&"EN",!(k in ES)&&"ES"].filter(Boolean);
  if(miss.length){bad++;console.log(`MISSING ${miss.join("+")}: ${k}  (${[...fs_].join(", ")})`);}}
const unused=Object.keys(EN).filter(k=>!used.has(k));
const onlyOne=[...Object.keys(EN).filter(k=>!(k in ES)),...Object.keys(ES).filter(k=>!(k in EN))];
console.log(`${used.size} keys used, ${bad} missing, ${onlyOne.length} defined in one language only, ${unused.length} unused.`);
if(onlyOne.length)console.log("One-language keys:",onlyOne.join(", "));
process.exit(bad||onlyOne.length?1:0);
