// Builds the mobile app (development config, which talks to the production API) into APP_DIR.
// The recorder serves this build itself, so no app dev server has to be running.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { APP_DIR, MOBILE_DIR } from './lib/browser.mjs';

if (!existsSync(MOBILE_DIR)) throw new Error(`Mobile app not found at ${MOBILE_DIR}. Set MOBILE_DIR.`);
const result = spawnSync(
  'npx',
  ['ng', 'build', '--configuration', 'development', '--output-path', APP_DIR, '--no-progress'],
  { cwd: MOBILE_DIR, stdio: 'inherit', shell: true },
);
process.exit(result.status ?? 1);
