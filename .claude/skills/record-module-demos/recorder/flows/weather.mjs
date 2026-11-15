import { type, tap, pause } from '../lib/browser.mjs';
import { goto } from '../lib/modules.mjs';
import { scrollToSlow } from '../lib/flowutil.mjs';
import { demo } from '../demo-data.mjs';

export const id = 'weather';

export async function run(page, mark) {
  await goto(page, 'weather');
  // The app remembers the last city; clear it before the clip starts.
  const input = page.locator('.weather__search-input');
  await input.fill('');
  await pause(page, 300);
  mark('start');
  await pause(page, 900);
  await type(page, input, demo.city);
  const search = page.locator('.weather__round-btn--primary');
  mark('cut-start');
  await tap(page, search);
  await pause(page, 500);
  await page.waitForFunction(() => !document.querySelector('.weather__round-btn--primary')?.disabled, null, { timeout: 30_000 });
  await page.locator('.weather__temp').first().waitFor({ state: 'visible', timeout: 30_000 });
  mark('cut-end');
  await pause(page, 1800);
  const ok = page.locator('.weather__fb-btn').filter({ hasText: 'W sam raz' });
  await scrollToSlow(page, ok, { ms: 1100, targetFraction: 0.55 });
  await pause(page, 500);
  await tap(page, ok, { after: 300 });
  await page.locator('.weather__thanks').waitFor({ state: 'visible', timeout: 15_000 });
  await pause(page, 1500);
}
