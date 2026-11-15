---
name: record-module-demos
description: Re-record or update the short module demo videos on the Moja Wioska landing page (the clips inside the phone frame next to each module's feature list), add a clip for a new module, or update a module's feature list. Use when the app's UI changed, a module was added or renamed, or a clip looks outdated. Does not re-create the account's demo data; that already exists.
---

# Module demo videos

The landing page (`src/pages/index.astro`, `src/pages/en/index.astro`) shows one row per app module: a looping clip inside a phone frame, plus the module's name, summary and feature list. This skill re-records those clips from the real app with Playwright.

## What lives where

| Thing | Location |
| --- | --- |
| Module names, summaries, feature lists (PL + EN), AI badge, accent colours | `src/data/modules.ts` |
| Row and phone frame | `src/components/ModuleShowcase.astro`, `src/components/PhoneFrame.astro` |
| Finished clips | `public/demos/<id>.webm`, `<id>.mp4`, `<id>.jpg` (poster = last frame) |
| Recorder | `recorder/` in this skill folder |
| One file per clip | `recorder/flows/<id>.mjs` |
| What each clip types or pastes | `recorder/demo-data.mjs` |
| Local state, never committed | `~/.mojawioska-demos/` (`profile/` signed-in Chrome, `app/` app build, `raw/` raw videos and `recorded.json`) |

Module ids: `tasks`, `recipes`, `shopping`, `weather`, `quiz`, `notebook`, `timer`. Chat is deliberately not on the website (it launches later); don't record or list it until the owner asks.

## Rules

- **The account is the owner's real account on the production API.** It already holds a household scenario (a family of four in Kraków: tasks, recipes, shopping list, notebook pages, quizzes) plus the owner's own test entries. **Never seed, never re-create that data**, and never delete or edit anything except what a flow's `cleanup` names: the items that flow itself added on its previous run.
- Never open Settings, log out, or touch chat.
- The owner signs in by hand (`npm run login`). Never type a password.
- Clips show only the module's content: `openApp({ record })` hides the app header, bottom bar and the "Start / <module>" breadcrumb, so a renamed module needs no new clip. Keep it that way.
- Recordings are in Polish; the English page reuses them.
- Review every clip yourself before calling it done (see step 5).

## Steps

Run everything from `recorder/` (Windows, Git Bash; Google Chrome must be installed, since Playwright's bundled Chromium doesn't start on this machine).

1. **Install** (first time only): `npm install`. If `node_modules/ffmpeg-static/ffmpeg.exe` is missing (npm blocks its install script), run `node node_modules/ffmpeg-static/install.js`.
2. **Build the app**: `npm run build-app`. This builds `../mojawioska-mobile` (or `MOBILE_DIR`) into `~/.mojawioska-demos/app`. The recorder serves that build itself as `http://localhost:8100`, the origin the API's CORS accepts, so no dev server is needed. Rebuild whenever the app changed.
3. **Sign in** (only if a run says "Not signed in"): `npm run login` opens a Chrome window. Ask the owner to sign in there, then wait for "Signed in".
4. **Record**: `npm run record` (all), or `npm run record -- recipes timer` (some). Each flow runs its `cleanup` unrecorded first, then records. A clip whose cleanup fails is skipped, not recorded, so a duplicate never shows; run it again on its own later.
5. **Review every clip** frame by frame: make one sheet per clip and look at it.
   ```bash
   FF=node_modules/ffmpeg-static/ffmpeg.exe
   $FF -y -loglevel error -i ../../../../public/demos/<id>.mp4 -vf "fps=1,scale=150:-2,tile=8x2:padding=4:color=white" -frames:v 1 ~/.mojawioska-demos/raw/<id>-sheet.png
   ```
   Check: the page fills the whole frame (no grey area), no header/bottom bar/module name, no error toast, no login screen, no duplicate items, nothing left over from a previous run in the first second, the action and its result clearly visible. Clips should run 8–16 s; each `.mp4` under 1.5 MB.
6. **Check the page**: start the Astro dev server (`npm run dev` in the repo root) and confirm each video plays when scrolled into view, at desktop and phone width.

`npm run probe -- tasks recipes` (with `CONTENT_ONLY=1` to hide the chrome) screenshots modules into `~/.mojawioska-demos/raw/probe/` without recording. Use it to look at a screen before writing or fixing a flow.

## Writing or changing a flow

A flow exports `id`, an optional `async cleanup(page)`, and `async run(page, mark)`.

- Start on the module's list screen (`goto(page, route)`), show one action, and end with its result visible for about 1.5 s.
- Use the helpers in `recorder/lib/`:
  - `browser.mjs` has `tap`, `type`, `paste` and `pause`. They are human-paced, and `tap` draws a touch dot, because taps are otherwise invisible in video.
  - `modules.mjs` has one helper per user action.
  - `flowutil.mjs` has smooth scrolling, `recorded.json` and the cleanups.
- Wrap every AI wait: `mark('cut-start')` right before submitting, `mark('cut-end')` once the result is on screen. The encoder shortens the wait to 2 s.
- If something must be reset before the clip starts, do it and then call `mark('start')`; the last `start` mark wins.
- Cleanup deletes only what this flow added. Remember AI-generated titles in `recorded.json` (`setRecorded`), and match exact texts for the rest.
- For a new module, also add its entry to `src/data/modules.ts` (both languages; `ai: true` if it uses AI; `kicker` when the app's name alone doesn't say what it is).
- Take the feature list from the app's screens and `src/assets/i18n/pl.json` in the mobile repo, not from memory.

## Known pitfalls

- **Grey area around the page in the video:** a visible Chrome window renders at the Windows display scale (125% here). `browser.mjs` passes `--force-device-scale-factor=2` to stop this. If grey ever comes back, check that flag first.
- **Slow deletes:** the API's DELETE for recipes and quizzes sometimes takes minutes. The cleanups wait up to 180 s, and the delete usually goes through even after a timeout. Check the list with `probe` before re-running, so you don't record on top of a duplicate.
- **Button names:** submit buttons need `exact: true` ("Dodaj zadanie", "Dodaj przepis", "Dodaj produkt", "Utwórz quiz"), because the camera button's aria-label is similar.
- **Recipe links:** a link is treated as a link only when it is the whole input. The backend fetches it and writes the recipe in Polish itself, so don't add any text next to it.
- **New items:** detect them by list count, not by title, since quiz titles can repeat. The app opens a newly generated quiz by itself.
- **Leftover state:** the weather field remembers the last city, and a finished timer keeps showing "Koniec!". The flows clear both before `mark('start')`.
- **Photo upload:** in a browser, the document import's "Wybierz plik z urządzenia" fires a file chooser. `pickDocument` answers it with `fixtures/note.jpg`, a made-up handwritten note.
