// Screenshots modules of the signed-in app into <STATE_DIR>/raw/probe/. CONTENT_ONLY=1 hides header, nav and breadcrumb.
import { openApp, APP_URL, RAW_DIR } from './lib/browser.mjs';
import path from 'node:path';
const routes = process.argv.slice(2).length ? process.argv.slice(2) : ['home','tasks','recipes','shopping-list','weather','chat','quiz','notebook','timer','settings'];
const { page, close } = await openApp({ headless: true, contentOnly: process.env.CONTENT_ONLY === '1' });
page.on('console', (m) => m.type() === 'error' && console.log('console.error:', m.text().slice(0, 200)));
for (const r of routes) {
  await page.goto(`${APP_URL}/${r}`);
  await page.waitForTimeout(3500);
  await page.screenshot({ path: path.join(RAW_DIR, 'probe', `${r}.png`) });
  const text = (await page.locator('ion-app, body').first().innerText()).replace(/\n+/g, ' | ').slice(0, 400);
  console.log(`== ${r} (${new URL(page.url()).pathname}): ${text}`);
}
await close();
