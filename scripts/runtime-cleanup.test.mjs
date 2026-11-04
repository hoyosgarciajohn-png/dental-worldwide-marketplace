import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { cleanupProject } from './runtime-cleanup.mjs';

for (const scenario of ['success', 'nonzero', 'timeout', 'spawn failure', 'log write failure']) {
  test(`cleanup removes credentials and reports ${scenario}`, () => {
    const dir = mkdtempSync(join(tmpdir(), 'dental-cleanup-'));
    const connectionPath = join(dir, 'connection.json');
    writeFileSync(connectionPath, '{"fictional":true}');
    const operation = () => cleanupProject({ connectionPath, logPath: join(dir, 'stop.log'),
      stop: () => { if (scenario === 'spawn failure') throw new Error('injected'); return { status: scenario === 'nonzero' ? 1 : scenario === 'timeout' ? null : 0 }; },
      ...(scenario === 'log write failure' ? { write: () => { throw new Error('injected'); } } : {}) });
    try {
      if (scenario === 'success') assert.doesNotThrow(operation); else assert.throws(operation);
      assert.equal(existsSync(connectionPath), false);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
}
