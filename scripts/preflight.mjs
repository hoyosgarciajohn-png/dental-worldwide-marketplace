import { spawnSync } from "node:child_process";
const checks = [ ["node", ["--version"]], ["npm", ["--version"]], ["git", ["--version"]], ["npx", ["--no-install", "supabase", "--version"]] ];
let failed = false;
for (const [command,args] of checks) {
 const result=spawnSync(command,args,{encoding:"utf8",shell:process.platform==="win32"});
 console.log(`${command}: ${result.status===0 ? result.stdout.trim() : "BLOCKED"}`);
 failed ||= result.status!==0;
}
process.exitCode=failed?1:0;
