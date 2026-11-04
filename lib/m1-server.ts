import { createClient, type SupabaseClient, type Session } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';

export class SafeFailure extends Error {
  constructor(public code: string, public status = 403) { super(code); }
}
export function config() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const origin = process.env.APP_ORIGIN || 'http://127.0.0.1:3000';
  if (!url || !key || !secret || new URL(url).hostname !== '127.0.0.1' || new URL(origin).hostname !== '127.0.0.1') throw new SafeFailure('service_unavailable', 503);
  return { url, key, secret, origin };
}
export function client(privileged = false, pkce?: { initial?: string; onValue: (value: string | null) => void }): SupabaseClient {
  const c = config();
  const memory = new Map<string,string>();
  const verifierKey = 'dental-m1-pkce-code-verifier';
  if (pkce?.initial) memory.set(verifierKey,pkce.initial);
  return createClient(c.url, privileged ? c.secret : c.key, {
    auth: { persistSession: !!pkce, autoRefreshToken: false, detectSessionInUrl: false,
      ...(pkce ? {flowType:'pkce' as const,storageKey:'dental-m1-pkce',storage:{
        getItem:(key:string)=>memory.get(key)??null,
        setItem:(key:string,value:string)=>{memory.set(key,value);if(key===verifierKey)pkce.onValue(value);},
        removeItem:(key:string)=>{memory.delete(key);if(key===verifierKey)pkce.onValue(null);}
      }} : {})
    },
    global: { fetch: (input, init) => {
      const target = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
      if (target.origin !== new URL(c.url).origin) throw new SafeFailure('service_unavailable', 503);
      return fetch(input, { ...init, redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(15000) });
    } },
  });
}
export async function rpc(c: SupabaseClient, action: string, payload = {}) {
  const result = await c.rpc('m1_dispatch', { p_action: action, p_payload: payload });
  if (result.error) throw new SafeFailure('service_unavailable', 503);
  if (!result.data?.ok) throw new SafeFailure(result.data?.code || 'forbidden');
  return result.data.data;
}
export async function audit(action: string, actor: string | null, allowed: boolean) {
  const { error } = await client(true).rpc('m1_auth_event', { p_action: action, p_actor: actor, p_allowed: allowed });
  if (error) throw new SafeFailure('service_unavailable', 503);
}
export async function rateLimit(email: string) {
  const hash = (v: string) => createHash('sha256').update(v).digest('hex');
  // M1 listens on loopback. Client-controlled proxy headers never select a bucket.
  const { data, error } = await client(true).rpc('m1_auth_attempt', { p_account: hash(email), p_ip: hash('m1-loopback-peer') });
  if (error) throw new SafeFailure('service_unavailable', 503);
  if (!data) throw new SafeFailure('try_later', 429);
}
export function emailValue(value: unknown) {
  if (typeof value !== 'string' || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@example\.test$/i.test(value) || value.length > 200) throw new SafeFailure('fictional_email_required', 400);
  return value.toLowerCase();
}
export function passwordValue(value: unknown) {
  if (typeof value !== 'string' || value.length < 12 || value.length > 128) throw new SafeFailure('password_length', 400);
  return value;
}
export const fields: Record<string, string[]> = {
  'auth.signup': ['email','password'], 'auth.signin': ['email','password'], 'auth.recovery': ['email'],
  'auth.password': ['password'], 'auth.signout': [],
  'mfa.enroll': [], 'mfa.verify': ['factor_id','code'], 'mfa.list': [],
  'session.me': [], 'access.directory': [], 'grant.list': [], 'membership.list': [], 'fixture.list': [], 'fixture.read': ['id'], 'fixture.export': ['id'], 'fixture.enqueue': ['id'], 'fixture.run': ['id'], 'fixture.create': ['site_id','category','body'],
  'fixture.update': ['id','body'], 'grant.set': ['id','organization_id','user_id','category','actions'],
  'grant.withdraw': ['id'], 'membership.set': ['user_id','role','organization_id','site_id','active','permissions'],
  'assignment.set': ['id','user_id','active'], 'account.state': ['user_id','active'], 'factor.reset': ['user_id'], 'audit.list': [],
};
export function validate(action: unknown, payload: unknown): asserts action is string {
  if (typeof action !== 'string' || !fields[action] || !payload || typeof payload !== 'object' || Array.isArray(payload)) throw new SafeFailure('invalid_request', 400);
  if (Object.keys(payload).some(k => !fields[action].includes(k))) throw new SafeFailure('invalid_request', 400);
  for (const [k,v] of Object.entries(payload)) {
    if (k === 'active' && typeof v !== 'boolean') throw new SafeFailure('invalid_request', 400);
    if (['actions','permissions'].includes(k)) {
      if (!Array.isArray(v) || !v.length || v.length > 2 || v.some(x => !['read','write'].includes(x))) throw new SafeFailure('invalid_request', 400);
    } else if (k !== 'active' && (typeof v !== 'string' || v.length > 500)) throw new SafeFailure('invalid_request', 400);
    if (['id','user_id','organization_id','site_id','factor_id'].includes(k) && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v))) throw new SafeFailure('invalid_request', 400);
  }
}
export type Tokens = Pick<Session, 'access_token' | 'refresh_token'>;
