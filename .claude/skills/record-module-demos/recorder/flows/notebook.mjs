import { pause } from '../lib/browser.mjs';
import { goto, addNotebookPage } from '../lib/modules.mjs';
import { cleanNotebook } from '../lib/flowutil.mjs';
import { demo } from '../demo-data.mjs';

export const id = 'notebook';

export async function cleanup(page) {
  const n = await cleanNotebook(page, demo.notebookPage.title);
  console.log(`  cleanup: removed ${n} page(s)`);
}

export async function run(page, mark) {
  await goto(page, 'notebook');
  mark('start');
  await pause(page, 900);
  await addNotebookPage(page, demo.notebookPage);
  await pause(page, 1500);
}
