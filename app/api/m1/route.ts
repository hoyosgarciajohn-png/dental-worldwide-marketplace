import { NextRequest, NextResponse } from 'next/server';
import { audit, client, config, emailValue, passwordValue, rateLimit, rpc, SafeFailure, validate, type Tokens } from '../../../lib/m1-server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let tokens: Tokens | null | undefined;
  let secure = false;
  const reply = (body: object, status = 200) => {
    const response = NextResponse.json(body, { status, headers: { 'Cache-Control':'no-store, private','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff' } });
    if (tokens !== undefined) {
      for (const [name,value] of [['dental_access', tokens?.access_token || ''], ['dental_refresh', tokens?.refresh_token || '']]) {
        response.cookies.set(name, value, { httpOnly:true, sameSite:'strict', secure, path:'/', maxAge:tokens ? 43200 : 0 });
      }
    }
    return response;
  };
  try {
    const cfg = config(); secure = new URL(cfg.origin).protocol === 'https:';
    if (req.headers.get('origin') !== cfg.origin || new URL(req.url).origin !== cfg.origin) throw new SafeFailure('origin_rejected', 403);
    if (!req.headers.get('content-type')?.startsWith('application/json')) throw new SafeFailure('invalid_request',400);
    const reader = req.body?.getReader();
    if (!reader) throw new SafeFailure('invalid_request',400);
    const chunks: Uint8Array[] = []; let size = 0;
    for (;;) { const {done,value} = await reader.read(); if (done) break; size += value.length; if (size > 16384) { await reader.cancel(); throw new SafeFailure('invalid_request',413); } chunks.push(value); }
    const raw = Buffer.concat(chunks).toString('utf8');
    let input; try { input = JSON.parse(raw); } catch { throw new SafeFailure('invalid_request',400); }
    const { action, payload = {} } = input;
    validate(action, payload);
    const c = client();
    if (['auth.signup','auth.signin','auth.recovery'].includes(action)) {
      const email = emailValue(payload.email);
      await rateLimit(email);
      if (action === 'auth.recovery') {
        const result = await c.auth.resetPasswordForEmail(email, { redirectTo: cfg.origin + '/account' });
        await audit(action, null, !result.error);
        // Same public result for existing and absent accounts, including provider refusals.
        return reply({ ok:true, message:'check_local_mail' });
      }
      const password = passwordValue(payload.password);
      if (action === 'auth.signup') {
        const result = await c.auth.signUp({ email,password });
        await audit(action, null, !result.error);
        return reply({ ok:true, message:'check_local_mail' });
      }
      const result = await c.auth.signInWithPassword({email,password});
      await audit(action, result.error ? null : result.data.user?.id || null, !result.error);
      if (result.error || !result.data.session) throw new SafeFailure('login_failed',401);
      const data = await rpc(c,'session.open');
      tokens = result.data.session;
      return reply({ok:true,data});
    }
    if (action === 'auth.verify' || action === 'auth.password') {
      if (typeof payload.token_hash !== 'string' || !/^[a-f0-9]{40,128}$/i.test(payload.token_hash)) throw new SafeFailure('link_invalid',400);
      const password = action === 'auth.password' ? passwordValue(payload.password) : null;
      const result = await c.auth.verifyOtp({ token_hash:payload.token_hash, type:action==='auth.verify'?'signup':'recovery' });
      await audit(action, result.error ? null : result.data.user?.id || null, !result.error);
      if (result.error) throw new SafeFailure('link_invalid',400);
      if (password) {
        const update = await c.auth.updateUser({password});
        if (update.error) throw new SafeFailure('recovery_failed',400);
        await audit('auth.password',result.data.user.id,true);
      }
      await c.auth.signOut({scope:'global'});
      tokens = null;
      return reply({ok:true,message:'sign_in_again'});
    }
    const access_token = req.cookies.get('dental_access')?.value;
    const refresh_token = req.cookies.get('dental_refresh')?.value;
    if (!access_token || !refresh_token) throw new SafeFailure('unauthenticated',401);
    const restored = await c.auth.setSession({access_token,refresh_token});
    if (restored.error || !restored.data.session) { tokens=null; throw new SafeFailure('session_expired',401); }
    const validated = await c.auth.getUser();
    if (validated.error) { tokens=null; throw new SafeFailure('session_expired',401); }
    tokens=restored.data.session;
    if (action === 'auth.signout') {
      await rpc(c,'session.revoke');
      await c.auth.signOut({scope:'global'});
      tokens=null;
      return reply({ok:true});
    }
    if (action.startsWith('mfa.')) {
      await rpc(c,'session.me');
      if (action === 'mfa.enroll') {
        const result = await c.auth.mfa.enroll({factorType:'totp',friendlyName:'Dental fictional test'});
        await audit('auth.mfa',validated.data.user.id,!result.error);
        if (result.error) throw new SafeFailure('mfa_failed',400);
        return reply({ok:true,data:{id:result.data.id,secret:result.data.totp.secret,qr_code:result.data.totp.qr_code}});
      }
      if (action === 'mfa.list') {
        const result = await c.auth.mfa.listFactors();
        if (result.error) throw new SafeFailure('mfa_failed',400);
        return reply({ok:true,data:result.data.totp.map(f=>({id:f.id,status:f.status}))});
      }
      if (!/^\d{6}$/.test(payload.code || '') || !payload.factor_id) throw new SafeFailure('mfa_failed',400);
      const result = await c.auth.mfa.challengeAndVerify({factorId:payload.factor_id,code:payload.code});
      await audit('auth.mfa',validated.data.user.id,!result.error);
      if (result.error) throw new SafeFailure('mfa_failed',400);
      tokens=(await c.auth.getSession()).data.session;
      await rpc(c,'mfa.complete');
      return reply({ok:true,data:await rpc(c,'session.me')});
    }
    const data = await rpc(c,action,payload);
    if (action === 'factor.reset') {
      const admin = client(true);
      const factors = await admin.auth.admin.mfa.listFactors({userId:data.reset_target});
      if (factors.error) throw new SafeFailure('service_unavailable',503);
      for (const factor of factors.data.factors) {
        const removed = await admin.auth.admin.mfa.deleteFactor({userId:data.reset_target,id:factor.id});
        if (removed.error) throw new SafeFailure('service_unavailable',503);
      }
    }
    return reply({ok:true,data});
  } catch (error) {
    const safe = error instanceof SafeFailure ? error : new SafeFailure('service_unavailable',503);
    if (['session_expired','account_unavailable','unauthenticated'].includes(safe.code)) tokens=null;
    return reply({ok:false,code:safe.code},safe.status);
  }
}
