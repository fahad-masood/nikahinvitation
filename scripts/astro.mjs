import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

// Portable CLI entry: avoid telemetry config writes outside the cloud workspace.
const require = createRequire(import.meta.url);
const manifestPath = require.resolve('astro/package.json');
const cli = resolve(dirname(manifestPath), require('astro/package.json').bin.astro);
const result = spawnSync(process.execPath, [cli, ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
});
if (result.error) console.error(result.error.message);
process.exitCode = result.status ?? (result.signal === 'SIGINT' ? 130 : 1);
