import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import { authRejected, storageDenied } from './m0-denial-assertions.mjs';

// Test-only local service checks. This does not implement application authentication or authorization.
const config = JSON.parse(await readFile(new URL('../.supabase-local/connection.json', import.meta.url), 'utf8'));
const url = config.API_URL ?? config.SUPABASE_URL;
assert.equal(new URL(url).hostname, '127.0.0.1', 'M0 only permits loopback services');
const secret = config.SERVICE_ROLE_KEY ?? config.SECRET_KEY;
const publicKey = config.ANON_KEY ?? config.PUBLISHABLE_KEY;
assert.ok(secret && publicKey, 'Local keys required');
const localFetch = (input, init) => {
  const target = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
  assert.equal(target.origin, new URL(url).origin, 'No outbound service requests allowed');
  return fetch(input, { ...init, redirect: 'error', signal: AbortSignal.timeout(20000) });
};
const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }, global: { fetch: localFetch } };
const admin = createClient(url, secret, options);
const member = createClient(url, publicKey, options);
const anonymous = createClient(url, publicKey, options);
const suffix = randomUUID();
const bucket = `m0-fictional-${suffix}`;
const email = `m0-${suffix}@example.test`;
const password = `M0!${randomBytes(24).toString('hex')}`;
const objectPath = 'fictional.txt';
const bytes = Buffer.from('FICTIONAL M0 STORAGE PROBE — NO PATIENT DATA\n');
const checks = [];
let userId; let bucketCreated = false; let objectCreated = false;
function pass(name) { checks.push({ check: name, result: 'PASS' }); console.log(`PASS ${name}`); }
function ok(result, label) { if (result.error) throw new Error(`${label} failed (${result.error.status ?? result.error.code ?? 'service error'})`); return result.data; }
let failure;
try {
  const created = ok(await admin.auth.admin.createUser({ email, password, email_confirm: true }), 'create fictional identity');
  userId = created.user.id;
  pass('Auth: fictional confirmed identity created without invitation/email');
  authRejected((await member.auth.signInWithPassword({ email, password: `${password}-wrong` })).error, ['invalid_credentials'], 'invalid password');
  pass('Auth: invalid password rejected');
  const signedIn = ok(await member.auth.signInWithPassword({ email, password }), 'password login');
  assert.equal(signedIn.user.id, userId);
  assert.equal(ok(await member.auth.getUser(), 'server user validation').user.id, userId);
  pass('Auth: password login and server validation');
  const refreshed = ok(await member.auth.refreshSession(), 'refresh session');
  assert.ok(refreshed.session?.refresh_token);
  const refreshToken = refreshed.session.refresh_token;
  pass('Auth: session refresh');
  ok(await admin.storage.createBucket(bucket, { public: false, fileSizeLimit: 1024, allowedMimeTypes: ['text/plain'] }), 'private bucket create');
  bucketCreated = true;
  assert.equal(ok(await admin.storage.getBucket(bucket), 'bucket metadata').public, false);
  ok(await admin.storage.from(bucket).upload(objectPath, bytes, { contentType: 'text/plain', upsert: false }), 'private object upload');
  objectCreated = true;
  const downloaded = ok(await admin.storage.from(bucket).download(objectPath), 'private object download');
  assert.deepEqual(Buffer.from(await downloaded.arrayBuffer()), bytes);
  pass('Storage: private bucket and exact-byte upload/download');
  storageDenied((await anonymous.storage.from(bucket).download(objectPath)).error, 'anonymous read');
  storageDenied((await member.storage.from(bucket).download(objectPath)).error, 'ungranted user read');
  const publicAttempt = await localFetch(`${url}/storage/v1/object/public/${bucket}/${objectPath}`);
  const publicError = await publicAttempt.json();
  storageDenied({ ...publicError, status: publicAttempt.status }, 'public URL read');
  pass('Storage: anonymous, public URL and ungranted user reads denied');
  const signed = ok(await admin.storage.from(bucket).createSignedUrl(objectPath, 60), 'temporary signed URL');
  const signedResponse = await localFetch(signed.signedUrl);
  assert.equal(signedResponse.status, 200);
  assert.deepEqual(Buffer.from(await signedResponse.arrayBuffer()), bytes);
  pass('Storage: short-lived signed download round trip');
  ok(await member.auth.signOut({ scope: 'global' }), 'sign out');
  const replay = await anonymous.auth.refreshSession({ refresh_token: refreshToken });
  authRejected(replay.error, ['refresh_token_not_found', 'refresh_token_already_used'], 'revoked refresh credential');
  pass('Auth: sign out rejects refresh-token reuse');
} catch (error) { failure = error; }
finally {
  try {
    if (objectCreated) ok(await admin.storage.from(bucket).remove([objectPath]), 'object cleanup');
    if (bucketCreated) ok(await admin.storage.deleteBucket(bucket), 'bucket cleanup');
    if (userId) { await member.auth.signOut({ scope: 'global' }); ok(await admin.auth.admin.deleteUser(userId), 'identity cleanup'); }
    pass('Cleanup: fictional object, bucket and identity removed');
  } catch (error) { failure ??= error; }
  const report = { scope: 'M0 local service integration only', data: 'fictional', checks, result: failure ? 'FAIL' : 'PASS', limitation: 'No application roles, clinical schema, tenant policies, UI acceptance or live readiness tested' };
  await writeFile(new URL('../.supabase-local/service-smoke-evidence.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
}
if (failure) { console.error(failure.message); process.exitCode = 1; }
