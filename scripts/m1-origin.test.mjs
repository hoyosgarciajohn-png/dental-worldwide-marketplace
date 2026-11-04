import {test} from 'node:test';
import assert from 'node:assert/strict';
import {NextRequest} from 'next/server.js';
import {trustedLocalRequest} from '../lib/m1-origin.ts';
const origin='http://127.0.0.1:3000';
const request=(headers={},url=origin+'/api/m1')=>new NextRequest(url,{headers:{host:'127.0.0.1:3000',origin,...headers}});
test('real NextRequest accepts exact loopback Host and Origin despite framework URL normalization',()=>{
 assert.equal(trustedLocalRequest(request(),origin),true);
});
test('foreign, missing, null and loopback-alias origins are rejected',()=>{
 for(const value of ['https://example.test','null','http://localhost:3000','http://127.0.0.1:3001'])assert.equal(trustedLocalRequest(request({origin:value}),origin),false);
 const missing=request();missing.headers.delete('origin');assert.equal(trustedLocalRequest(missing,origin),false);
});
test('foreign authority cannot be repaired with client-selected forwarded headers',()=>{
 for(const host of ['example.test','localhost:3000','127.0.0.1:3001','127.0.0.1:3000,example.test'])assert.equal(trustedLocalRequest(request({host,'x-forwarded-host':'127.0.0.1:3000','forwarded':'host=127.0.0.1:3000'}),origin),false);
 assert.equal(trustedLocalRequest(request(),origin.replace('http:','https:')),false);
 assert.equal(trustedLocalRequest(request(),origin.replace('127.0.0.1','example.test')),false);
});
test('GET callback allows absent Origin but still enforces the exact authority',()=>{
 const callback=request();callback.headers.delete('origin');assert.equal(trustedLocalRequest(callback,origin,false),true);
 callback.headers.set('host','example.test');assert.equal(trustedLocalRequest(callback,origin,false),false);
});
