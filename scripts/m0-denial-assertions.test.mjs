import assert from 'node:assert/strict';
import test from 'node:test';
import { authRejected, storageDenied } from './m0-denial-assertions.mjs';

test('Auth requires the expected service code and client-error status', () => {
  authRejected({ status: 400, code: 'invalid_credentials' }, ['invalid_credentials'], 'login');
  authRejected({ status: 400, code: 'refresh_token_not_found' }, ['refresh_token_not_found', 'refresh_token_already_used'], 'revocation');
  for (const error of [null, new TypeError('network'), { status: 500, code: 'invalid_credentials' }, { status: 400, code: 'unexpected_failure' }, { status: 429, code: 'over_request_rate_limit' }]) {
    assert.throws(() => authRejected(error, ['invalid_credentials'], 'login'));
  }
});

test('Storage accepts explicit or legacy masked denials', () => {
  for (const error of [{ status: 400, statusCode: '404', code: 'NoSuchKey' }, { status: 400, statusCode: '403', code: 'AccessDenied' }, { status: 404, code: 'NoSuchBucket' }, { status: 400, statusCode: '404' }]) {
    storageDenied(error, 'download');
  }
});

test('Storage never treats network, server, throttling or malformed-request failures as denials', () => {
  for (const error of [null, new TypeError('network'), { status: 503, code: 'NoSuchKey' }, { status: 400, statusCode: '500', code: 'NoSuchKey' }, { status: 429 }, { status: 400, statusCode: '400', code: 'InvalidRequest' }, { status: 404, code: 'TenantNotFound' }, { status: 200, code: 'AccessDenied' }, { status: 400 }]) {
    assert.throws(() => storageDenied(error, 'download'));
  }
});
