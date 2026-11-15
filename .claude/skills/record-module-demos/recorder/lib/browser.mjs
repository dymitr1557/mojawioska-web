import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { existsSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import os from 'node:os';

/** The recorder folder (.claude/skills/record-module-demos/recorder). */
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
/** The website repository: four levels up from the recorder folder. */
export const REPO_DIR = path.resolve(root, '..', '..', '..', '..');
/** The mobile app's repository, next to the website by default. */
export const MOBILE_DIR = process.env.MOBILE_DIR ?? path.resolve(REPO_DIR, '..', 'mojawioska-mobile');
/**
 * Local state lives outside the repo: the signed-in Chrome profile, the app build and raw videos.
 * Keeping it out means it can never be committed and Astro's dev server never watches it.
 */
export const STATE_DIR = process.env.DEMO_STATE_DIR ?? path.join(os.homedir(), '.mojawioska-demos');
export const APP_DIR = path.join(STATE_DIR, 'app');
const PROFILE_DIR = path.join(STATE_DIR, 'profile');

export const APP_URL = process.env.APP_URL ?? 'http://localhost:8100';
export const VIEWPORT = { width: 390, height: 684 };
export const RAW_DIR = path.join(STATE_DIR, 'raw');
export const OUT_DIR = path.join(REPO_DIR, 'public', 'demos');
export const FIXTURES = path.join(root, 'fixtures');

/**
 * Recordings show only a module's own content: no app header, no bottom bar, and no "Start / <module name>"
 * breadcrumb, so a renamed module never needs its clip recorded again.
 */
const CONTENT_ONLY_CSS = `
  app-header, app-footer, app-ui-breadcrumb { display: none !important; }
`;

export async function openApp({ record, requireSession = true, headless = false, contentOnly = Boolean(record) } = {}) {
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless,
    // The installed Chrome, with its own profile folder; Playwright's bundled Chromium does not start on this machine.
    channel: process.env.DEMO_BROWSER ?? 'chrome',
    // A visible window otherwise renders at the Windows display scale (e.g. 125%), and the video then holds
    // the page in its top-left corner with grey padding around it. 2x fills the 2x video frame exactly.
    args: ['--force-device-scale-factor=2'],
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true,
    locale: 'pl-PL',
    timezoneId: 'Europe/Warsaw',
    geolocation: { latitude: 50.0647, longitude: 19.945 },
    permissions: ['geolocation'],
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
    recordVideo: record
      ? { dir: path.join(RAW_DIR, record), size: { width: VIEWPORT.width * 2, height: VIEWPORT.height * 2 } }
      : undefined,
  });
  await serveBuild(context);
  if (contentOnly) {
    await context.addInitScript((css) => {
      const add = () => {
        const style = document.createElement('style');
        style.dataset.demo = 'content-only';
        style.textContent = css;
        document.head.appendChild(style);
      };
      if (document.head) add();
      else document.addEventListener('DOMContentLoaded', add, { once: true });
    }, CONTENT_ONLY_CSS);
  }
  const page = context.pages()[0] ?? (await context.newPage());
  await page.goto(`${APP_URL}/home`, { waitUntil: 'domcontentloaded' });

  if (requireSession) {
    await page.waitForURL(/\/(home|auth)/, { timeout: 30_000 });
    await page.waitForTimeout(1500);
    if (new URL(page.url()).pathname.startsWith('/auth')) {
      await context.close();
      throw new Error('Not signed in. Run: npm run login');
    }
  }

  return {
    context,
    page,
    async close() {
      const video = page.video();
      await context.close();
      return video ? await video.path() : null;
    },
  };
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

/**
 * Answers every request for APP_URL from the app build in APP_DIR (see `npm run build-app`), so no dev server
 * is needed. The page still has the origin localhost:8100, which the API's CORS list accepts.
 */
async function serveBuild(context) {
  if (!existsSync(path.join(APP_DIR, 'index.html'))) {
    throw new Error(`No app build in ${APP_DIR}. Run: npm run build-app`);
  }
  await context.route(`${APP_URL}/**`, async (route) => {
    const { pathname } = new URL(route.request().url());
    let file = path.join(APP_DIR, decodeURIComponent(pathname));
    // Unknown paths are app routes: the single-page app handles them from index.html.
    if (!file.startsWith(APP_DIR) || !existsSync(file) || statSync(file).isDirectory()) {
      if (path.extname(pathname)) return route.fulfill({ status: 404, body: '' });
      file = path.join(APP_DIR, 'index.html');
    }
    await route.fulfill({
      status: 200,
      contentType: MIME[path.extname(file)] ?? 'application/octet-stream',
      body: await readFile(file),
    });
  });
}

/** Human-paced input, so recordings read as a person using the app. */
export const pause = (page, ms) => page.waitForTimeout(ms);

export async function tap(page, locator, { after = 450 } = {}) {
  await locator.scrollIntoViewIfNeeded();
  await showTouch(page, locator);
  await locator.click();
  await pause(page, after);
}

export async function type(page, locator, text, { delay = 55, after = 400 } = {}) {
  await locator.click();
  await page.keyboard.type(text, { delay });
  await pause(page, after);
}

/** Pastes text in one go, the way a copied link arrives. */
export async function paste(page, locator, text, { after = 600 } = {}) {
  await locator.click();
  await pause(page, 250);
  await page.keyboard.insertText(text);
  await pause(page, after);
}

/** Draws a short fading dot where a tap lands; without it taps are invisible in video. */
async function showTouch(page, locator) {
  const box = await locator.boundingBox();
  if (!box) return;
  await page.evaluate(
    ({ x, y }) => {
      const dot = document.createElement('div');
      dot.style.cssText = `position:fixed;left:${x - 18}px;top:${y - 18}px;width:36px;height:36px;border-radius:50%;
        background:rgba(86,120,102,.28);border:2px solid rgba(86,120,102,.55);z-index:2147483647;pointer-events:none;
        transition:transform .45s ease-out,opacity .45s ease-out;transform:scale(.6);opacity:1`;
      document.body.appendChild(dot);
      requestAnimationFrame(() => {
        dot.style.transform = 'scale(1.25)';
        dot.style.opacity = '0';
      });
      setTimeout(() => dot.remove(), 600);
    },
    { x: box.x + box.width / 2, y: box.y + box.height / 2 },
  );
  await page.waitForTimeout(140);
}
