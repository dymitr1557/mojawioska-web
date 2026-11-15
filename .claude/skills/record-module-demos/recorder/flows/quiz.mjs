import { tap, pause } from '../lib/browser.mjs';
import { goto, addQuiz } from '../lib/modules.mjs';
import { cleanQuiz, readRecorded, setRecorded } from '../lib/flowutil.mjs';
import { demo } from '../demo-data.mjs';

export const id = 'quiz';

export async function cleanup(page) {
  const { quiz } = await readRecorded();
  const done = await cleanQuiz(page, quiz);
  console.log(`  cleanup: previous quiz ${quiz ? `"${quiz}" ${done ? 'deleted' : 'not found'}` : 'none recorded'}`);
  if (!quiz || done) await setRecorded('quiz', undefined);
}

export async function run(page, mark) {
  // The generated quiz comes back with its answers; knowing the right one lets the clip show one wrong try, then the right one.
  let correct = null;
  page.on('response', async (r) => {
    if (r.request().method() !== 'POST' || !/quiz/i.test(r.url())) return;
    const body = await r.json().catch(() => null);
    const q0 = (body?.data ?? body)?.questions?.[0];
    if (q0 && Number.isInteger(q0.correctIndex)) correct = q0.correctIndex;
  });
  await goto(page, 'quiz');
  mark('start');
  await pause(page, 900);
  const title = await addQuiz(page, demo.quizTopic, { mark });
  await setRecorded('quiz', title);
  await pause(page, 300);
  // The app opens the new quiz by itself; open it from the list only if it did not.
  if (!(await page.locator('.quiz-play__question').isVisible().catch(() => false))) {
    await tap(page, page.locator('.quiz-card__title').filter({ hasText: title }).first());
  }
  await page.locator('.quiz-play__question').waitFor({ state: 'visible', timeout: 15_000 });
  await pause(page, 800);
  const tryOption = async (i) => {
    await tap(page, page.locator('.quiz-option').nth(i), { after: 350 });
    await tap(page, page.getByRole('button', { name: 'Sprawdź odpowiedź' }), { after: 700 });
  };
  if (correct !== null) {
    if (correct !== 0) await tryOption(0); // a wrong answer first, then the right one
    await tryOption(correct);
  } else {
    for (let attempt = 0; attempt < 4; attempt++) {
      await tap(page, page.locator('.quiz-option:not([disabled])').first(), { after: 350 });
      await tap(page, page.getByRole('button', { name: 'Sprawdź odpowiedź' }), { after: 700 });
      if (await page.locator('.quiz-option--correct').count()) break;
    }
  }
  await page.getByRole('button', { name: 'Następne pytanie' }).waitFor({ state: 'visible', timeout: 10_000 });
  await pause(page, 1300);
}
