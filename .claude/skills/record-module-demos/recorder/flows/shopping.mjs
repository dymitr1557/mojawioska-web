import { pause } from '../lib/browser.mjs';
import { goto, addProducts } from '../lib/modules.mjs';
import { cleanShopping, scrollBy } from '../lib/flowutil.mjs';
import { demo } from '../demo-data.mjs';

export const id = 'shopping';

export async function cleanup(page) {
  const removed = await cleanShopping(page, ['Pomidory', 'Ser żółty', 'Płyn do naczyń']);
  console.log(`  cleanup: removed ${removed.length} item(s)`, removed);
}

export async function run(page, mark) {
  await goto(page, 'shopping-list');
  mark('start');
  await pause(page, 900);
  await addProducts(page, demo.products, { mark });
  // Make sure a new item is in view.
  const chip = page
    .locator('.category__chip-label')
    .filter({ hasText: /^\s*(pomidory|ser żółty|płyn do naczyń)\s*$/i })
    .first();
  const box = await chip.boundingBox().catch(() => null);
  if (box && box.y > 450) await scrollBy(page, box.y - 300, 1000);
  await pause(page, 1500);
}
