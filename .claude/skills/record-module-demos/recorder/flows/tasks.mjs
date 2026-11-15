import path from 'node:path';
import { FIXTURES, tap, pause } from '../lib/browser.mjs';
import { goto, addTaskFromDocument } from '../lib/modules.mjs';
import { cleanTasks } from '../lib/flowutil.mjs';

export const id = 'tasks';

export async function cleanup(page) {
  const removed = await cleanTasks(page, ['Dentysta', 'Zebranie w szkole', 'tort', 'biblioteki']);
  console.log(`  cleanup: removed ${removed.length} task(s)`, removed);
}

export async function run(page, mark) {
  await goto(page, 'tasks');
  mark('start');
  await pause(page, 900);
  await addTaskFromDocument(page, path.join(FIXTURES, 'note.jpg'), { mark });
  // The new tasks are listed; tap the phone number in the dentist task.
  const chip = page
    .locator('app-task-card')
    .filter({ hasText: 'Dentysta' })
    .locator('[role="button"][aria-label*="600 100 200"]')
    .first();
  await chip.waitFor({ state: 'visible', timeout: 10_000 });
  await pause(page, 700);
  await tap(page, chip, { after: 300 });
  await page.locator('.ui-action-sheet__panel').getByRole('button', { name: 'Zadzwoń' }).waitFor({ state: 'visible' });
  await pause(page, 1500);
}
