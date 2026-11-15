// Opens the recorder's own Chromium window so the owner can sign in to the demo account by hand.
// The session stays in the profile under STATE_DIR (see lib/browser.mjs) and is reused by record and probe. No password passes through this script.
import { openApp } from './lib/browser.mjs';

const { page, close } = await openApp({ requireSession: false });
console.log('Sign in to the demo account in the window that just opened. Waiting up to 15 minutes…');
try {
  // The guard redirects /home to /auth a moment after load, so only a /home that holds for 4 s counts.
  const deadline = Date.now() + 15 * 60_000;
  let signedIn = false;
  while (!signedIn && Date.now() < deadline) {
    await page.waitForTimeout(4000);
    if (!new URL(page.url()).pathname.startsWith('/home')) continue;
    await page.waitForTimeout(4000);
    signedIn = new URL(page.url()).pathname.startsWith('/home');
  }
  if (!signedIn) throw new Error('timeout');
  console.log('Signed in');
} catch {
  console.error('No sign-in detected.');
  process.exitCode = 1;
} finally {
  await close();
}
