import { writeFileSync, rmSync } from 'node:fs';

export function cleanupProject({ stop, logPath, connectionPath, write = writeFileSync, remove = rmSync }) {
  try {
    const result = stop();
    write(logPath, `${result.stdout ?? ''}${result.stderr ?? ''}`, { mode: 0o600 });
    if (result.status !== 0) throw new Error('Project stack cleanup failed; inspect ignored local log');
  } finally {
    remove(connectionPath, { force: true });
  }
}
