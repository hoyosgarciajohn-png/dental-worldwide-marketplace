import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const local = new URL('../.supabase-local/', import.meta.url);
mkdirSync(local, { recursive: true, mode: 0o700 });
const cli = fileURLToPath(new URL('../node_modules/supabase/dist/supabase.js', import.meta.url));
function command(args, name) {
  const result = spawnSync(process.execPath, [cli, ...args], { cwd: root, encoding: 'utf8', timeout: 240000 });
  writeFileSync(new URL(`${name}.log`, local), `${result.stdout ?? ''}${result.stderr ?? ''}`, { mode: 0o600 });
  assert.equal(result.status, 0, `${name} failed; check ignored local log and redact keys before sharing`);
  console.log(`PASS ${name}`);
  return result.stdout;
}
const docker = spawnSync('docker', ['version', '--format', '{{.Server.Version}}'], { encoding: 'utf8', timeout: 15000 });
assert.equal(docker.status, 0, 'BLOCKED: a running Docker engine is required');
console.log('Docker engine available');
try {
  command(['start', '--runtime', 'docker', '--eager', '--frozen', '--exclude', 'studio,functions,realtime,analytics,pooler,mail'], 'docker-start');
  const raw = command(['status', '--env', '--output-format', 'text'], 'docker-status');
  const config = {};
  for (const line of raw.split(/\r?\n/)) {
    const match = /^([A-Z_]+)=(.*)$/.exec(line);
    if (match) config[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
  assert.equal(new URL(config.API_URL).hostname, '127.0.0.1', 'M0 requires loopback services');
  writeFileSync(new URL('connection.json', local), JSON.stringify(config), { mode: 0o600 });
  const db = command(['db', 'query', '--read-only', "select 1 as m0_probe, current_database() as database, 1 / (exists(select 1 from pg_namespace where nspname = 'auth')::int) as auth_schema, 1 / (exists(select 1 from pg_namespace where nspname = 'storage')::int) as storage_schema", '--output-format', 'json'], 'database-probe');
  console.log(db);
  const services = spawnSync(process.execPath, ['scripts/m0-services-smoke.mjs'], { cwd: root, stdio: 'inherit', timeout: 120000 });
  assert.equal(services.status, 0, 'Local Auth/Storage smoke failed');
} finally {
  const stopped = spawnSync(process.execPath, [cli, 'stop'], { cwd: root, encoding: 'utf8', timeout: 30000 });
  writeFileSync(new URL('docker-stop.log', local), `${stopped.stdout ?? ''}${stopped.stderr ?? ''}`, { mode: 0o600 });
  rmSync(new URL('connection.json', local), { force: true });
  assert.equal(stopped.status, 0, 'Project stack cleanup failed; check ignored local log');
  console.log('PASS docker-stop and local credential removal');
}
