import assert from "node:assert/strict";
import { spawn } from "node:child_process";
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3100"], { stdio: ["ignore", "pipe", "pipe"] });
try {
  await new Promise((resolve, reject) => {
    server.stdout.on("data", chunk => { if (chunk.toString().includes("Ready")) resolve(); });
    server.on("error", reject);
    server.on("exit", code => reject(new Error(`Server exit ${code}`)));
    setTimeout(() => reject(new Error("Startup timeout")), 15000).unref();
  });
  const response = await fetch("http://127.0.0.1:3100");
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /Fictional data only/);
  assert.match(html, /Solo datos ficticios/);
  assert.match(html, /noindex/);
  assert.equal(response.headers.get("x-powered-by"), null);
  assert.equal((await fetch("http://127.0.0.1:3100/missing")).status, 404);
  console.log("PASS: foundation production HTTP smoke (not browser or database acceptance)");
} finally { server.kill("SIGTERM"); }
