// Records the module demos. `npm run record` records all flows; `npm run record -- tasks recipes` records some.
// Each flow file in flows/ exports: id, cleanup(page) (optional, runs unrecorded first) and run(page, mark).
// Inside run, mark('cut-start') / mark('cut-end') bracket an AI wait that the encoder shortens to 2 seconds,
// and mark('start') / mark('end') optionally trim the clip's head and tail.
import { readdir, rm, stat } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { openApp, RAW_DIR } from './lib/browser.mjs';
import { encode } from './lib/encode.mjs';

const flowsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'flows');
const wanted = process.argv.slice(2);
const files = (await readdir(flowsDir)).filter((f) => f.endsWith('.mjs'));
const flows = [];
for (const file of files) {
  const flow = await import(pathToFileURL(path.join(flowsDir, file)).href);
  if (!wanted.length || wanted.includes(flow.id)) flows.push(flow);
}
if (!flows.length) throw new Error(`No flows match: ${wanted.join(', ')}`);

for (const flow of flows) {
  console.log(`\n▶ ${flow.id}`);
  if (flow.cleanup) {
    const prep = await openApp({ headless: true });
    try {
      await flow.cleanup(prep.page);
    } catch (error) {
      // Recording on top of a failed cleanup could show a duplicate, so skip this flow and go on with the rest.
      console.error(`✗ ${flow.id}: cleanup failed, not recorded: ${error.message.split('\n')[0]}`);
      process.exitCode = 1;
      continue;
    } finally {
      await prep.close();
    }
  }

  await rm(path.join(RAW_DIR, flow.id), { recursive: true, force: true });
  const session = await openApp({ record: flow.id });
  // The video starts with the context; openApp has already loaded the app, so time starts from here.
  const t0 = Date.now() - (await session.page.evaluate(() => performance.now()));
  const marks = [];
  const mark = (name) => marks.push([name, Date.now() - t0]);

  let failed = null;
  try {
    mark('start');
    await flow.run(session.page, mark);
    await session.page.waitForTimeout(1200);
    mark('end');
  } catch (error) {
    failed = error;
  }
  const raw = await session.close();
  if (failed) {
    console.error(`✗ ${flow.id}: ${failed.message}\n  raw video kept at ${raw}`);
    process.exitCode = 1;
    continue;
  }

  const at = (name) => marks.filter(([n]) => n === name).map(([, ms]) => ms);
  const starts = at('cut-start');
  const ends = at('cut-end');
  const cuts = starts.map((s, i) => [s, ends[i]]).filter(([, e]) => e !== undefined);
  const from = (at('start').at(-1) ?? 0) / 1000;
  const to = (at('end').at(-1) ?? 0) / 1000;
  const result = await encode({ input: raw, id: flow.id, cuts, from, to });
  const sizes = await Promise.all(result.files.map(async (f) => `${path.basename(f)} ${(await stat(f)).size >> 10} KB`));
  console.log(`✓ ${flow.id}: ${result.seconds}s · ${sizes.join(' · ')}`);
}
