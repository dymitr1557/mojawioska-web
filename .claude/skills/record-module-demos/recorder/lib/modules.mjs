// One function per user action in the app. Used by the recording flows (and once by a seeding script), so every
// action is paced like a person (tap/type/paste) and ends only when the app has visibly finished.
import { APP_URL, tap, type, paste, pause } from './browser.mjs';

const ROUTE = {
  tasks: { block: 'tasks', title: '.task-card__text', spinner: '.tasks__spinner' },
  recipes: { block: 'recipes', title: '.recipe-card__title', spinner: '.recipes__spinner' },
  'shopping-list': { block: 'shopping', title: '.category__chip-label', spinner: '.shopping__spinner' },
  quiz: { block: 'quiz', title: '.quiz-card__title', spinner: '.quiz__spinner' },
  notebook: { block: 'notebook', title: '.notebook__row-title', spinner: '.notebook__spinner' },
  chat: { block: 'chat', title: '.room-item__title', spinner: '.room-list__spinner' },
  weather: { block: 'weather', title: null, spinner: null },
  timer: { block: 'timer', title: null, spinner: null },
};

const EDITOR = '.ui-rich-editor__host .ProseMirror';
const norm = (s) => s.replace(/\s+/g, ' ').trim();

function routeOf(page) {
  const seg = new URL(page.url()).pathname.split('/')[1];
  return ROUTE[seg] ? seg : null;
}

/** Navigates to a module and waits until its list has loaded (spinner gone). */
export async function goto(page, route) {
  const r = ROUTE[route];
  if (!r) throw new Error(`Unknown route: ${route}`);
  await page.goto(`${APP_URL}/${route}`, { waitUntil: 'domcontentloaded' });
  await page.locator(`.${r.block}`).first().waitFor({ state: 'visible', timeout: 30_000 });
  await waitSpinnerGone(page, r.spinner);
  await pause(page, 500);
}

async function waitSpinnerGone(page, selector) {
  if (!selector) return;
  await pause(page, 300); // the spinner can render a tick after the page shell
  await page.locator(selector).first().waitFor({ state: 'detached', timeout: 60_000 }).catch(() => {});
}

/** Titles of the items currently shown on the module's list page. */
export async function listedTitles(page) {
  const route = routeOf(page);
  if (!route || !ROUTE[route].title) return [];
  const texts = await page.locator(ROUTE[route].title).allInnerTexts();
  return texts.map(norm).filter(Boolean);
}

/** Opens the "add" form of a list page if it is not open yet. */
async function openForm(page, { toolbar, label, ready }) {
  const field = page.locator(ready).first();
  if (await field.isVisible().catch(() => false)) return;
  await tap(page, page.locator(toolbar).getByRole('button', { name: label, exact: true }));
  await field.waitFor({ state: 'visible', timeout: 10_000 });
}

/** Reads the error banner of a form, if any. */
async function bannerError(page, scope) {
  const msg = page.locator(`${scope} app-ui-message`).first();
  if (await msg.isVisible().catch(() => false)) return norm(await msg.innerText());
  return null;
}

// ---------------------------------------------------------------- tasks

async function openTaskForm(page) {
  await openForm(page, { toolbar: '.tasks__toolbar', label: 'Dodaj', ready: `.tasks__add-form ${EDITOR}` });
}

function taskKey(text) {
  return norm(text).slice(0, 24);
}

async function waitTaskListed(page, text, timeout = 30_000) {
  const key = taskKey(text);
  await page.waitForFunction(
    (k) => [...document.querySelectorAll('.task-card__text')].some((e) => e.innerText.replace(/\s+/g, ' ').includes(k)),
    key,
    { timeout },
  );
}

export async function addTask(page, text) {
  await openTaskForm(page);
  const editor = page.locator(`.tasks__add-form ${EDITOR}`);
  await type(page, editor, text);
  await tap(page, page.locator('.tasks__add-form').getByRole('button', { name: 'Dodaj zadanie', exact: true }));
  await waitTaskListed(page, text);
  await pause(page, 600);
}

export async function addTaskFromDocument(page, filePath, { mark } = {}) {
  await openTaskForm(page);
  const before = (await listedTitles(page)).length;
  await pickDocument(page, '.tasks__add-form', 'Dodaj zadania ze zdjęcia lub pliku', filePath, {
    beforeSet: () => mark?.('cut-start'),
  });
  // The AI reads the document; new task cards appear when it is done.
  await page.waitForFunction(
    (n) => document.querySelectorAll('.task-card__text').length > n,
    before,
    { timeout: 120_000 },
  );
  mark?.('cut-end');
  await pause(page, 600);
}

/** Camera button -> action sheet -> "Wybierz plik z urządzenia" -> file chooser. */
export async function pickDocument(page, scope, buttonLabel, filePath, { beforeSet } = {}) {
  await tap(page, page.locator(scope).getByRole('button', { name: buttonLabel }));
  const sheet = page.locator('.ui-action-sheet__panel');
  await sheet.waitFor({ state: 'visible', timeout: 10_000 });
  await pause(page, 500);
  const chooser = page.waitForEvent('filechooser', { timeout: 15_000 });
  await tap(page, sheet.getByRole('button', { name: 'Wybierz plik z urządzenia' }), { after: 200 });
  beforeSet?.();
  await (await chooser).setFiles(filePath);
  await sheet.waitFor({ state: 'detached', timeout: 10_000 }).catch(() => {});
}

// -------------------------------------------------------------- recipes

/** Types (or pastes, for a link) a recipe request and waits for the AI to add it. Returns the new title. */
export async function addRecipe(page, text, { timeout = 180_000, mark } = {}) {
  await openForm(page, { toolbar: '.recipes__toolbar', label: 'Dodaj', ready: `.recipes__add-form ${EDITOR}` });
  const beforeList = await listedTitles(page);
  const before = new Set(beforeList);
  const editor = page.locator(`.recipes__add-form ${EDITOR}`);
  if (/^https?:\/\//.test(text.trim())) await paste(page, editor, text);
  else await type(page, editor, text);
  // Re-read right before submitting, so the list is the one the new recipe is compared with.
  beforeList.splice(0, beforeList.length, ...(await listedTitles(page)));
  before.clear();
  beforeList.forEach((t) => before.add(t));
  mark?.('cut-start');
  await tap(page, page.locator('.recipes__add-form').getByRole('button', { name: 'Dodaj przepis', exact: true }));

  const started = Date.now();
  while (Date.now() - started < timeout) {
    await pause(page, 1000);
    const error = await bannerError(page, '.recipes__add-form');
    if (error) throw new Error(error);
    const now = await listedTitles(page);
    const fresh = now.find((t) => !before.has(t)) ?? (now.length > beforeList.length ? now[0] : null);
    if (fresh) {
      mark?.('cut-end');
      await pause(page, 800);
      return fresh;
    }
  }
  throw new Error(`Recipe did not appear within ${timeout / 1000}s`);
}

// ------------------------------------------------------------- products

export async function addProducts(page, text, { mark } = {}) {
  await openForm(page, {
    toolbar: '.shopping__toolbar',
    label: 'Dodaj',
    ready: '.shopping__add-form textarea',
  });
  const before = (await listedTitles(page)).length;
  await type(page, page.locator('.shopping__add-form textarea'), text);
  mark?.('cut-start');
  await tap(page, page.locator('.shopping__add-form').getByRole('button', { name: 'Dodaj produkt', exact: true }));
  await page.waitForFunction(
    (n) => document.querySelectorAll('.category__chip-label').length > n,
    before,
    { timeout: 60_000 },
  );
  mark?.('cut-end');
  await pause(page, 800);
}

// ----------------------------------------------------------------- quiz

/** Asks the AI for a quiz and waits for it. Returns the new quiz title (its topic). */
export async function addQuiz(page, topic, { timeout = 150_000, mark } = {}) {
  await openForm(page, { toolbar: '.quiz__toolbar', label: 'Dodaj quiz', ready: '.quiz__add-form textarea' });
  const beforeList = await listedTitles(page);
  const before = new Set(beforeList);
  await type(page, page.locator('.quiz__add-form textarea'), topic, { delay: 32 });
  mark?.('cut-start');
  await tap(page, page.locator('.quiz__add-form').getByRole('button', { name: 'Utwórz quiz', exact: true }));

  const started = Date.now();
  let idleSince = null;
  while (Date.now() - started < timeout) {
    await pause(page, 1000);
    // The app opens a freshly generated quiz at once; then the list is gone and the title is in the breadcrumb.
    if (await page.locator('.quiz-play, .quiz-finish').first().isVisible().catch(() => false)) {
      mark?.('cut-end');
      const crumbs = await page.locator('.ui-breadcrumb__current').first().textContent().catch(() => '');
      await pause(page, 800);
      return norm(crumbs ?? '') || topic;
    }
    const now = await listedTitles(page);
    const fresh = now.find((t) => !before.has(t)) ?? (now.length > beforeList.length ? now[0] : null);
    if (fresh) {
      mark?.('cut-end');
      await pause(page, 800);
      return fresh;
    }
    const error = await bannerError(page, '.quiz__add-form');
    if (error) throw new Error(error);
    const generating = await page.locator('.quiz__generating').isVisible().catch(() => false);
    if (generating) idleSince = null;
    else if (idleSince ??= Date.now(), Date.now() - idleSince > 20_000) {
      // Generation ended without a new card: the app reports it as a toast.
      const toast = await page.locator('ion-toast, .toast, [role="alert"]').allInnerTexts().catch(() => []);
      throw new Error(`Quiz was not created${toast.length ? `: ${norm(toast.join(' '))}` : ''}`);
    }
  }
  throw new Error(`Quiz did not appear within ${timeout / 1000}s`);
}

// ------------------------------------------------------------- notebook

/**
 * Creates a notebook page. The first editor line is the title, `body` lines become a bullet list.
 * With `parent` (title of a page on the current list) it is created via that page's "Nowa podstrona" action.
 */
export async function addNotebookPage(page, { title, body = [], parent }) {
  if (!(await page.locator('.notebook__toolbar').isVisible().catch(() => false))) await goto(page, 'notebook');

  if (parent) {
    const row = page.locator('.notebook__row').filter({ has: page.locator('.notebook__row-title', { hasText: parent }) }).first();
    await row.waitFor({ state: 'visible', timeout: 10_000 });
    await tap(page, row.getByRole('button', { name: 'Akcje strony' }));
    await tap(page, page.locator('.ui-action-sheet__panel').getByRole('button', { name: 'Nowa podstrona' }));
  } else {
    await tap(page, page.locator('.notebook__toolbar').getByRole('button', { name: 'Nowa strona', exact: true }));
  }

  const editor = page.locator(EDITOR).first();
  await editor.waitFor({ state: 'visible', timeout: 10_000 });
  await type(page, editor, title, { delay: 40 });
  if (body.length) {
    await page.keyboard.press('Enter');
    await pause(page, 200);
    await page.keyboard.type('- ', { delay: 55 }); // markdown shortcut starts a bullet list
    for (let i = 0; i < body.length; i++) {
      await page.keyboard.type(body[i], { delay: 28 });
      if (i < body.length - 1) await page.keyboard.press('Enter');
    }
    await pause(page, 500);
  }
  await tap(page, page.getByRole('button', { name: 'Zapisz stronę' }));
  await page.locator('.notebook-sheet--edit').waitFor({ state: 'detached', timeout: 30_000 });
  await pause(page, 800);
}

// ----------------------------------------------------------------- chat

async function showTab(page, visibility) {
  const label = visibility === 'public' ? 'Publiczne' : 'Prywatne';
  const tab = page.locator('.chat__tabs').getByRole('tab', { name: label, exact: true });
  if ((await tab.getAttribute('aria-selected')) !== 'true') {
    await tap(page, tab);
    await pause(page, 600);
  }
}

export async function createRoom(page, name, visibility = 'private') {
  await openForm(page, { toolbar: '.chat__toolbar', label: 'Nowa rozmowa', ready: '.create-room textarea' });
  await type(page, page.locator('.create-room textarea').first(), name);
  const select = page.locator('.create-room').getByRole('combobox');
  await tap(page, select);
  await tap(page, page.getByRole('option', { name: visibility === 'public' ? 'Publiczna' : 'Prywatna', exact: true }));
  await tap(page, page.locator('.create-room').getByRole('button', { name: 'Utwórz', exact: true }));
  await page.locator('.create-room').waitFor({ state: 'detached', timeout: 30_000 });
  await showTab(page, visibility);
  await page.locator('.room-item__title', { hasText: name }).first().waitFor({ state: 'visible', timeout: 15_000 });
  await pause(page, 600);
}

/** Opens a room from the list (looks in the private tab, then the public one) and waits for its messages. */
export async function openRoom(page, name) {
  const title = (n) => page.locator('.room-item__title').filter({ hasText: new RegExp(`^\\s*${escapeRe(n)}\\s*$`) }).first();
  let target = title(name);
  for (const vis of ['private', 'public']) {
    await showTab(page, vis);
    await pause(page, 500);
    if (await target.isVisible().catch(() => false)) break;
  }
  await tap(page, target);
  await page.locator('.thread__title', { hasText: name }).waitFor({ state: 'visible', timeout: 15_000 });
  await page.locator('.thread__spinner').waitFor({ state: 'detached', timeout: 30_000 }).catch(() => {});
  await pause(page, 500);
}

export async function sendMessage(page, text) {
  const before = await page.locator('.thread__messages .message__text').count();
  await type(page, page.locator('.thread__composer textarea'), text);
  await tap(page, page.locator('.thread__composer').getByRole('button', { name: 'Wyślij' }));
  await page.waitForFunction(
    (n) => document.querySelectorAll('.thread__messages .message__text').length > n,
    before,
    { timeout: 30_000 },
  );
  await pause(page, 700);
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// -------------------------------------------------------------- weather

export async function searchCity(page, city) {
  const input = page.locator('.weather__search-input');
  await input.fill('');
  await type(page, input, city);
  await tap(page, page.getByRole('button', { name: 'Szukaj', exact: true }));
  await page.locator('.weather__temp').first().waitFor({ state: 'visible', timeout: 30_000 });
  await pause(page, 800);
}

// ---------------------------------------------------------------- timer

/** type: 'sand' | 'water' | 'countdown'. Sets the duration through the range's own events, then leaves it idle. */
export async function setTimer(page, timerType, seconds) {
  const label = { sand: 'Piasek', water: 'Woda', countdown: 'Odliczanie' }[timerType];
  if (!label) throw new Error(`Unknown timer type: ${timerType}`);
  const tab = page.locator('.timer__types').getByRole('tab', { name: label, exact: true });
  if ((await tab.getAttribute('aria-selected')) !== 'true') await tap(page, tab);
  // Dragging a 15 s-step slider precisely is not worth imitating; emit what the slider would.
  await page.evaluate((value) => {
    const range = document.querySelector('ion-range.timer__range');
    range.value = value;
    range.dispatchEvent(new CustomEvent('ionInput', { detail: { value }, bubbles: true }));
    range.dispatchEvent(new CustomEvent('ionChange', { detail: { value }, bubbles: true }));
  }, seconds);
  await pause(page, 600);
}
