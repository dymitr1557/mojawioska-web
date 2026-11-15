import { tap, pause } from '../lib/browser.mjs';
import { goto, setTimer } from '../lib/modules.mjs';
import { resetTimer } from '../lib/flowutil.mjs';
import { demo } from '../demo-data.mjs';

export const id = 'timer';

export async function cleanup(page) {
  console.log(`  cleanup: timer ${(await resetTimer(page)) ? 'reset' : 'was idle'}`);
}

export async function run(page, mark) {
  await goto(page, 'timer');
  // A finished timer keeps showing "Koniec!" and reset is disabled then; changing the time clears it.
  await setTimer(page, 'countdown', 60);
  await pause(page, 400);
  mark('start');
  await pause(page, 900);
  await setTimer(page, 'sand', demo.timerSeconds);
  await tap(page, page.getByRole('button', { name: 'Start', exact: true }));
  await pause(page, 5500);
}
