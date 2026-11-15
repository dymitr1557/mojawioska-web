import { tap, pause } from '../lib/browser.mjs';
import { goto, addRecipe, listedTitles } from '../lib/modules.mjs';
import { cleanRecipe, readRecorded, setRecorded, scrollBy, scrollRemaining, scrollToSlow } from '../lib/flowutil.mjs';
import { demo } from '../demo-data.mjs';

export const id = 'recipes';

export async function cleanup(page) {
  const { recipes } = await readRecorded();
  // An interrupted run can leave a second copy with the same title, so delete until none is left.
  let deleted = 0;
  while (recipes && deleted < 5 && (await cleanRecipe(page, recipes))) deleted++;
  console.log(`  cleanup: previous recipe ${recipes ? `"${recipes}" deleted ×${deleted}` : 'none recorded'}`);
  await setRecorded('recipes', undefined);
}

export async function run(page, mark) {
  await goto(page, 'recipes');
  mark('start');
  await pause(page, 900);
  let title = await addRecipe(page, demo.recipeUrl, { mark });
  // Never record (and later delete) a title that is not the imported pudding.
  if (!/pudding|biszkopt/i.test(title)) {
    const all = await listedTitles(page);
    title = all.find((t) => /pudding|biszkopt/i.test(t));
    if (!title) throw new Error('Imported recipe not recognised in the list');
  }
  await setRecorded('recipes', title);
  await pause(page, 400);
  const card = page.locator('.recipe-card__title').filter({ hasText: title }).first();
  await scrollToSlow(page, card, { ms: 900, targetFraction: 0.5 });
  mark('cut-start');
  await tap(page, card);
  await page.locator('.recipe__card').waitFor({ state: 'visible', timeout: 15_000 });
  mark('cut-end');
  await pause(page, 1000);
  // Slowly through ingredients and steps.
  for (let i = 0; i < 2; i++) {
    const left = await scrollRemaining(page);
    if (left < 20) break;
    await scrollBy(page, Math.min(420, left), 1300);
    await pause(page, 500);
  }
  await pause(page, 400);
}
