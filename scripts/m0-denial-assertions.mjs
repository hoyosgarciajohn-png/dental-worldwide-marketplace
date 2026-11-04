import assert from 'node:assert/strict';

// Negative tests must distinguish the expected refusal from a broken service.
export function authRejected(error, codes, label) {
  assert.ok(error && Number(error.status) === 400 && codes.includes(error.code), `${label}: expected Auth rejection not observed`);
}

export function storageDenied(error, label) {
  const transport = Number(error?.status);
  const effective = Number(error?.statusCode ?? error?.status);
  const knownCode = ['AccessDenied', 'NoSuchKey', 'NoSuchBucket'].includes(error?.code);
  const legacyDenial = error?.code == null && [403, 404].includes(effective);
  assert.ok(error && [400, 403, 404].includes(transport)
    && (knownCode || legacyDenial)
    && !(Number.isFinite(effective) && effective >= 500), `${label}: expected Storage denial not observed`);
}
