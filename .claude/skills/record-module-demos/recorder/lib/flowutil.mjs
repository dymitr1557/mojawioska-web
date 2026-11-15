// Helpers shared by the flows: smooth scrolling, the record of what clips created, and UI-driven cleanups.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { RAW_DIR, tap, pause } from './browser.mjs';
import { goto } from './modules.mjs';

const RECORDED = path.join(RAW_DIR, 'recorded.json');
const norm = (s) => s.replace(/\s+/g, ' ').trim();
const lower = (s) => norm(s).toLowerCase();

export async function readRecorded() {
  try {
    return JSON.parse(await readFile(RECORDED, 'utf8'));
  } catch {
    return {};
  }
}

export async function setRecorded(key, value) {
  const data = await readRecorded();
  if (value === undefined) delete data[key];
  else data[key] = value;
  await mkdir(RAW_DIR, { recursive: true });
  await writeFile(RECORDED, JSON.stringify(data, null, 2));
}

/** Pixels the visible page can still scroll down. */
export async function scrollRemaining(page) {
  return page.evaluate(async () => {
    const cs = [...document.querySelectorAll('ion-content')].filter(
      (c) => c.getBoundingClientRect().width > 0 && !c.closest('.ion-page-hidden'),
    );
    const el = await cs.at(-1).getScrollElement();
    return el.scrollHeight - el.clientHeight - el.scrollTop;
  });
}

/** Scrolls the visible page by `dy` px over `ms`, eased, like a thumb swipe. */
export async function scrollBy(page, dy, ms = 1200) {
  await page.evaluate(
    async ({ dy, ms }) => {
      const cs = [...document.querySelectorAll('ion-content')].filter(
        (c) => c.getBoundingClientRect().width > 0 && !c.closest('.ion-page-hidden'),
      );
      const el = await cs.at(-1).getScrollElement();
      const start = el.scrollTop;
      const t0 = performance.now();
      await new Promise((resolve) => {
        const step = (now) => {
          const k = Math.min(1, (now - t0) / ms);
          el.scrollTop = start + dy * (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
          k < 1 ? requestAnimationFrame(step) : resolve();
        };
        requestAnimationFrame(step);
      });
    },
    { dy, ms },
  );
  await pause(page, 250);
}

/** Scrolls smoothly until `locator` sits at `targetFraction` of the screen height (only ever downwards). */
export async function scrollToSlow(page, locator, { ms = 1000, targetFraction = 0.6 } = {}) {
  const box = await locator.boundingBox();
  const vh = page.viewportSize().height;
  if (!box) return;
  const dy = box.y + box.height / 2 - vh * targetFraction;
  if (box.y + box.height < vh - 20 && dy < 40) return;
  if (dy > 0) await scrollBy(page, dy, ms);
}

/** Presses the destructive button of an Ionic alert or of the ui-kit confirm dialog. */
async function confirmDelete(page) {
  const btn = page.locator('ion-alert .alert-button-role-destructive').or(page.locator('.ui-confirm-dialog__button--confirm')).first();
  await btn.waitFor({ state: 'visible', timeout: 10_000 });
  await pause(page, 400);
  await tap(page, btn, { after: 800 });
}

// ------------------------------------------------------------- cleanups

export async function cleanTasks(page, needles) {
  await goto(page, 'tasks');
  const removed = [];
  for (let guard = 0; guard < 20; guard++) {
    const cards = page.locator('app-task-card');
    const n = await cards.count();
    let hit = -1;
    for (let i = 0; i < n; i++) {
      const text = norm(await cards.nth(i).locator('.task-card__text').innerText());
      if (needles.some((x) => text.toLowerCase().includes(x.toLowerCase()))) {
        hit = i;
        removed.push(text);
        break;
      }
    }
    if (hit < 0) break;
    await cards.nth(hit).getByRole('button', { name: 'Usuń zadanie' }).click();
    await page.waitForFunction((c) => document.querySelectorAll('app-task-card').length < c, n, { timeout: 15_000 });
    await pause(page, 400);
  }
  return removed;
}

export async function cleanShopping(page, names) {
  await goto(page, 'shopping-list');
  const wanted = names.map(lower);
  const removed = [];
  for (let guard = 0; guard < 20; guard++) {
    const chips = page.locator('.category__chip');
    const n = await chips.count();
    let hit = -1;
    for (let i = 0; i < n; i++) {
      const label = lower(await chips.nth(i).locator('.category__chip-label').innerText());
      if (wanted.includes(label)) {
        hit = i;
        removed.push(label);
        break;
      }
    }
    if (hit < 0) break;
    await chips.nth(hit).locator('.category__chip-remove').click();
    await page.waitForFunction((c) => document.querySelectorAll('.category__chip').length < c, n, { timeout: 15_000 });
    await pause(page, 400);
  }
  return removed;
}

export async function cleanRecipe(page, title) {
  if (!title) return false;
  await goto(page, 'recipes');
  const titles = (await page.locator('.recipe-card__title').allInnerTexts()).map(norm);
  const idx = titles.indexOf(norm(title));
  if (idx < 0) return false;
  await page.locator('.recipe-card__title').nth(idx).click();
  await page.locator('.recipe__card').waitFor({ state: 'visible', timeout: 15_000 });
  await page.locator('.recipe__actions').getByText('Usuń', { exact: true }).click();
  await confirmDelete(page);
  // The API's DELETE is sometimes very slow (see cleanQuiz).
  await page.locator('.recipes').waitFor({ state: 'visible', timeout: 180_000 });
  await pause(page, 1500);
  return true;
}

/**
 * Deletes every quiz with this title (a flow that failed half-way can leave a second copy behind).
 * The API's DELETE is sometimes slow, so after each one the list is reloaded until the server agrees.
 */
export async function cleanQuiz(page, title) {
  if (!title) return false;
  const count = async () => (await page.locator('.quiz-card__title').allInnerTexts()).filter((t) => norm(t) === norm(title)).length;
  await goto(page, 'quiz');
  let removed = 0;
  for (let guard = 0; guard < 5 && (await count()) > 0; guard++) {
    const titles = (await page.locator('.quiz-card__title').allInnerTexts()).map(norm);
    const n = titles.length;
    await page.locator('.quiz-card').nth(titles.indexOf(norm(title))).getByRole('button', { name: 'Usuń', exact: true }).click();
    await confirmDelete(page);
    await page.waitForFunction((c) => document.querySelectorAll('.quiz-card').length < c, n, { timeout: 180_000 });
    removed++;
    await pause(page, 1500);
    await goto(page, 'quiz');
  }
  return removed > 0;
}

export async function cleanNotebook(page, title) {
  await goto(page, 'notebook');
  let removed = 0;
  for (let guard = 0; guard < 5; guard++) {
    const rows = page.locator('.notebook__row');
    const n = await rows.count();
    let hit = -1;
    for (let i = 0; i < n; i++) {
      if (norm(await rows.nth(i).locator('.notebook__row-title').innerText()) === title) {
        hit = i;
        break;
      }
    }
    if (hit < 0) break;
    await rows.nth(hit).getByRole('button', { name: 'Akcje strony' }).click();
    await page.locator('.ui-action-sheet__panel').getByRole('button', { name: 'Usuń', exact: true }).click();
    await confirmDelete(page);
    await page.waitForFunction((c) => document.querySelectorAll('.notebook__row').length < c, n, { timeout: 15_000 });
    removed++;
  }
  return removed;
}

export async function resetTimer(page) {
  await goto(page, 'timer');
  const reset = page.getByRole('button', { name: 'Wyzeruj czas' });
  if (await reset.isEnabled().catch(() => false)) {
    await reset.click();
    await pause(page, 600);
    return true;
  }
  return false;
}
