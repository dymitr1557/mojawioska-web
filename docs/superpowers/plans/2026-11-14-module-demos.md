# Module Demos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show each of the 8 app modules on the landing page as a looping recording inside the hero's phone frame, next to that module's full feature list, in Polish and English.

**Architecture:** A recorder in `scripts/demos/` drives the locally served mobile app with Playwright in a saved Chromium profile, seeds a demo account with a household scenario, and writes one video per module to `public/demos/`. The landing pages render eight showcase rows from one data file through two small Astro components.

**Tech Stack:** Astro 5 (site), Node 22 + Playwright + ffmpeg-static (recorder, isolated `package.json`).

**Spec:** `docs/superpowers/specs/2026-11-14-module-demos-design.md`

## Global Constraints

- Work on the current branch. No test runner is added. No commits unless the owner asks.
- Site `package.json` dependencies stay as they are; recorder dependencies live only in `scripts/demos/package.json`.
- App under recording: `http://localhost:8100` (already served; talks to the production API).
- Only the fresh demo account is used. The script never types or stores a password.
- All seeded names, phone numbers, addresses and account numbers are invented.
- Viewport 390 x 684. Clips 8 to 14 seconds. AI waits trimmed to about 2 seconds.
- Output per module: `public/demos/<id>.webm`, `<id>.mp4`, `<id>.jpg`.
- Module ids: `tasks`, `recipes`, `shopping`, `weather`, `chat`, `quiz`, `notebook`, `timer`.
- Videos: `muted loop playsinline preload="none"`; poster only under `prefers-reduced-motion`.
- Nav anchors `#funkcje`, `#ai`, `#pobierz` and the README routes do not change.

## Review Focus

No test runner exists, so each line is checked by hand in the task named.

1. A clip shows a test entry or an error toast. Expected: every clip reviewed frame by frame before it ships (Task 5).
2. AI returns something different on a re-record (recipe layout, quiz text). Expected: flows wait on the result appearing, never on fixed text (Task 4).
3. Session in the saved profile has expired. Expected: `record` and `seed` stop with "Run npm run login" instead of recording the login screen (Task 1).
4. Videos missing or blocked. Expected: the row shows the poster and the layout does not jump (Task 6).
5. Narrow phones (320 px) and the English page with longer text. Expected: no horizontal scroll, phone above text (Task 7).

---

### Task 1: Recorder scaffold and login

**Files:**
- Create: `scripts/demos/package.json`, `scripts/demos/lib/browser.mjs`, `scripts/demos/login.mjs`
- Modify: `.gitignore` (add `scripts/demos/.profile/`, `scripts/demos/.raw/`, `scripts/demos/node_modules/`)

**Interfaces:**
- Produces: `openApp({ record?: string }): Promise<{ context, page, close(): Promise<string|null> }>` in `lib/browser.mjs`. Launches a persistent context from `.profile/`, viewport 390 x 684, mobile user agent, touch enabled; when `record` is set, video goes to `.raw/<record>/` and `close()` returns the video path. Throws `Error('Run npm run login')` if the app lands on `/auth` after load.
- Produces: `APP_URL = 'http://localhost:8100'`, `human` helpers `tap(page, locator)`, `type(page, locator, text)` (about 60 ms per key), `pause(page, ms)`.
- Scripts: `login`, `seed`, `record`.

- [ ] Step 1: Create `package.json` (`"type": "module"`, deps `playwright`, `ffmpeg-static`) and run `npm install` then `npx playwright install chromium` in `scripts/demos/`. Expected: both exit 0.
- [ ] Step 2: Write `lib/browser.mjs` to the interface above.
- [ ] Step 3: Write `login.mjs`: opens the app headed with no recording and waits until the URL is `/home`, then closes. Prints "Signed in" on success.
- [ ] Step 4: Run `npm run login`. The owner registers and signs in to the demo account in that window. Expected: "Signed in"; a second run reaches `/home` without a prompt.

### Task 2: Fixtures

**Files:**
- Create: `scripts/demos/fixtures/note.html`, `receipt.html`, `make-fixtures.mjs`; output `note.jpg`, `receipt.jpg`

- [ ] Step 1: `note.html`: a handwriting-font to-do note on lined paper with four lines containing a date, an invented phone number and an invented address. `receipt.html`: a shop-receipt layout with eight grocery lines.
- [ ] Step 2: `make-fixtures.mjs` screenshots each page to JPEG (1200 px wide, slight rotation and paper shadow so it reads as a photo).
- [ ] Step 3: Run it and open both images. Expected: legible, photo-like, no real data.

### Task 3: Seed the demo account

**Files:**
- Create: `scripts/demos/seed-data.mjs`, `scripts/demos/seed.mjs`, `scripts/demos/lib/modules.mjs`

**Interfaces:**
- Consumes: `openApp`, `human` helpers.
- Produces in `lib/modules.mjs`, one function per module action, reused by the flows: `addTask(page, text)`, `addTaskFromDocument(page, file)`, `addRecipe(page, text)`, `addProducts(page, text)`, `searchCity(page, city)`, `openRoom(page, name)`, `sendMessage(page, text)`, `createRoom(page, name, visibility)`, `addQuiz(page, topic)`, `addNotebookPage(page, { title, body, parent? })`, `setTimer(page, type, seconds)`. Selectors are taken from the app's templates in `mojawioska-mobile/src/app/*/` and prefer roles and the Polish labels in `src/assets/i18n/pl.json`.
- Produces: `seed-data.mjs` exporting `tasks`, `recipes`, `products`, `notebook`, `quizzes`, `rooms` with exactly the content listed under "Demo data" in the spec.

- [ ] Step 1: Write `seed-data.mjs` from the spec's scenario.
- [ ] Step 2: Write `lib/modules.mjs`, reading each module's page template for selectors.
- [ ] Step 3: Write `seed.mjs`: for each module, skip items whose title is already on screen, add the rest, wait for each to appear.
- [ ] Step 4: Run `npm run seed`, then open each module in the recorder window. Expected: every screen shows the scenario content and nothing else; a second run adds nothing.

### Task 4: Flows and recording

**Files:**
- Create: `scripts/demos/flows/<id>.mjs` (8 files), `scripts/demos/record.mjs`, `scripts/demos/lib/encode.mjs`

**Interfaces:**
- Each flow exports `id`, `async cleanup(page)` (removes what the previous run added, through the UI) and `async run(page, mark)` where `mark('cut-start')` / `mark('cut-end')` bracket an AI wait to be shortened.
- `encode({ input, marks, id }): Promise<void>` in `lib/encode.mjs`: cuts marked waits down to 2 seconds, writes `public/demos/<id>.webm` (VP9), `<id>.mp4` (H.264, yuv420p, faststart) and `<id>.jpg` (last frame).
- `record.mjs [ids...]`: for each flow, runs `cleanup` unrecorded, then `run` recorded, then `encode`.

- [ ] Step 1: Write `encode.mjs` and `record.mjs`.
- [ ] Step 2: Write the eight flows exactly as the spec's "Flows" table describes, each starting on the module's seeded screen. Recipes uses the link the owner supplies; Weather uses Kraków.
- [ ] Step 3: Run `npm run record -- timer` first (no AI, no data). Expected: three files in `public/demos/`, clip between 8 and 14 seconds.
- [ ] Step 4: Run `npm run record`. Expected: 24 files; each `.mp4` under 1.5 MB.

### Task 5: Review the clips

- [ ] Step 1: Extract frames at 1 per second from each clip and look at every frame. Expected: no test data, no error toast, no login screen, no real personal data, action readable at phone-frame size.
- [ ] Step 2: Re-record any flow that fails, adjusting pacing in its flow file.

### Task 6: Showcase components and data

**Files:**
- Create: `src/components/PhoneFrame.astro`, `src/components/ModuleShowcase.astro`, `src/data/modules.ts`
- Modify: `src/pages/index.astro`, `src/pages/en/index.astro`

**Interfaces:**
- `modules.ts` exports `modules: Module[]` and `appWide: Record<'pl'|'en', string[]>`, with `type Module = { id: string; accent: string; bg: string; icon: string; pl: Copy; en: Copy }` and `type Copy = { name: string; summary: string; features: string[]; videoLabel: string }`. Accent, background and icon come from the existing cards; feature lists from the spec.
- `PhoneFrame.astro`: default slot; props `float?: boolean`. Carries the `.phone-mockup` / `.phone-screen` styles moved out of the index pages.
- `ModuleShowcase.astro`: props `module: Module`, `locale: 'pl'|'en'`, `flip: boolean`. Renders the frame with `<video poster>` holding webm then mp4 sources, plus name, summary and feature list.

- [ ] Step 1: Write `modules.ts` with both languages.
- [ ] Step 2: Write `PhoneFrame.astro` and switch the hero in both index pages to it. Expected: hero looks unchanged.
- [ ] Step 3: Write `ModuleShowcase.astro`, including the inline script: `IntersectionObserver` plays a video at 50% visibility and pauses it otherwise; under `prefers-reduced-motion` it never plays.
- [ ] Step 4: Replace the `.features-grid` block in both index pages with the eight rows (alternating `flip`) and the app-wide strip; remove the now-unused card styles.
- [ ] Step 5: `npm run build`. Expected: exit 0.

### Task 7: Verify in the browser

- [ ] Step 1: Start the Astro dev server and open `/` and `/en/`. Expected: no console errors; each video starts when scrolled to and stops when scrolled away; only visible videos are requested on the network.
- [ ] Step 2: Check at 320, 390, 768 and 1280 px wide. Expected: no horizontal scroll; phone above text below 900 px, alternating sides above.
- [ ] Step 3: Rename `public/demos` temporarily and reload. Expected: layout holds with empty frames; restore the folder.
- [ ] Step 4: Add a "Re-recording the demos" section to `README.md` (login, seed, record commands).
