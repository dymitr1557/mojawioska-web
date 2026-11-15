# Module demos on the landing page

## Why

The landing page describes the app in text and shows one static screenshot. Visitors should see each module working: a short looping recording of a real flow inside the phone frame from the hero, next to the full list of what that module does.

## Goals

- One recording per module (8), played inside the same phone frame as the hero.
- A complete feature list per module, in Polish and English.
- Recordings can be redone with one command when the app changes.

## Not in scope

- Separate pages per module.
- English-language recordings (the Polish ones are reused on `/en/`).
- Changes to the mobile app or the backend.
- Tests, or a new branch (work happens on the current branch).

## Must not happen

- Private data in a recording. Only the demo account is used.
- A heavy page. Recordings load only when scrolled into view, and the page works without them (poster image).

## Approaches considered

1. **Scripted recording with Playwright (chosen).** A script drives the locally served app at phone size and saves video. Repeatable, sharp, small files. Costs a small recorder folder in this repo.
2. **Manual recording with the Chrome extension's GIF recorder.** Fast to start, but real GIFs are around 10 times larger and blurrier, timing is uneven, and every re-record is manual.
3. **Scripted recording against mocked API responses.** Touches no real data, but shows canned results instead of real AI output, and the mocks go stale when the API changes.

## Recorder

- Lives in `scripts/demos/` with its own `package.json`, so the site keeps its two dependencies. Dependencies: `playwright` and `ffmpeg-static` (both download a binary on install: Chromium and ffmpeg).
- Uses the app already served at `http://localhost:8100`, which talks to the production API.
- Runs Chromium with a saved profile in `scripts/demos/.profile/` (git-ignored). `npm run login` opens that window once so the owner signs in to the demo account by hand. The script never sees the password.
- One file per flow in `scripts/demos/flows/`. `npm run record` runs all, `npm run record -- recipes` runs one.
- Viewport 390 x 684, matching the inner shape of the hero phone frame. Typing and taps are slowed to a human pace. Each flow aims for 8 to 14 seconds; waiting on the AI is trimmed to about 2 seconds.
- Photo flows: the script answers the app's file picker with a prepared image from `scripts/demos/fixtures/` (a handwritten to-do note, a shop receipt). These images are made for this purpose and contain invented data only.
- Output per module in `public/demos/`: `<module>.webm`, `<module>.mp4`, `<module>.jpg` (poster, last frame).
- Each flow leaves its data in the demo account. Before a re-record the flow deletes what it created last time, through the app's own UI.

## Demo data (owner's requirement)

Recordings must show a lived-in app with believable household content, never test entries.

- Owner's decision (2026-11-15): record in the owner's own account. Its existing test entries are left as they are; the scenario below is added next to them.
- `npm run seed` fills the demo account once, through the app's own screens, with one consistent scenario: a family of four (two parents, kids aged 7 and 10) in Kraków, in mid-November. The content is in `scripts/demos/seed-data.ts` so it can be reviewed and edited.
  - Tasks (about 8): dentist visit with date and phone number, parent-teacher meeting with date and school address, pay the kindergarten fee with an account number, call the plumber, return library books, order a birthday cake, car inspection, swimming lessons sign-up link.
  - Recipes (about 7, spread over categories): żurek, pierogi ruskie, rosół, naleśniki, sałatka jarzynowa, szarlotka, owsianka.
  - Shopping list (about 12 products across categories).
  - Notebook: "Wakacje 2027" with subpages "Lista do spakowania" and "Budżet", "Urodziny Zosi", "Remont łazienki".
  - Quizzes (3): "Układ Słoneczny", "Tabliczka mnożenia", "Stolice Europy".
  - Chat: groups "Rodzina" (private) and "Sąsiedzi z Lipowej" (public) with a short history.
- Phone numbers, addresses, account numbers and names are invented and obviously fictional-safe (no real person's or business's details).
- Chat history from other people needs a second demo account. If the owner registers one, the seed posts replies from it; otherwise the chat clip shows the demo user's own messages only.
- Each recorded flow adds one new item on top of this data, so every clip starts from a full screen and ends with a new item appearing in it.

## Flows

| Module | What the recording shows |
| --- | --- |
| Tasks | Add from document, pick the note photo, tasks appear with date and phone chips, tap the phone chip, action sheet opens |
| Recipes | Paste a link, recipe card appears, open it: ingredients and steps |
| Shopping list | Type "mleko, chleb, proszek do prania", items land in categories, tick one off |
| Weather | Type a city, weather and the outfit figure appear, rate "W sam raz" |
| Chat | Open a group, send a message, select text, save to notes |
| Quiz | Type a topic, quiz is generated, answer one question |
| Notebook | New page, type a title and a formatted list, save, subpage visible |
| Timer | Choose the sand timer, set time, start, sand runs |

## Page

- The eight cards in `#funkcje` are replaced by eight rows. Each row: phone frame with the recording on one side, module name, one-line summary and feature list on the other. Sides alternate on desktop; on mobile the phone sits above the text.
- The `#ai` section, hero, stats and download sections stay as they are. Nav anchors do not change.
- New pieces: `src/components/PhoneFrame.astro` (also used by the hero), `src/components/ModuleShowcase.astro`, and `src/data/modules.ts` holding both languages' text, the accent colours already used by the cards, and the media file names. Both index pages render from that data.
- Video is muted, looping, inline, `preload="none"`. A small script plays a video when it enters the viewport and pauses it when it leaves. With `prefers-reduced-motion` only the poster shows.

## Feature lists (source: the app's screens and texts)

- **Tasks:** add by typing; add from a photo or PDF; AI finds dates, phone numbers, addresses, links, e-mails and bank account numbers; one tap to call, text, add to Google Calendar, open in maps, open a link, write an e-mail or copy; edit, delete, reorder by dragging; grid or list view; search; share a task; today's tasks on the home screen.
- **Recipes:** add by link, by pasted text or by asking for a dish; add from a photo or PDF; AI lays out ingredients with amounts and units, steps, prep and cooking time; seven categories; edit by hand; search; link back to the source.
- **Shopping list:** add several products at once; add from a photo or file; automatic categories; search; share the list.
- **Weather and outfit:** weather by city or current location; feels-like temperature; outfit suggestion with an illustrated figure, matched to gender; rate it too cold, just right or too warm and the suggestions adjust.
- **Chat:** private and public groups; add people by profile name; real-time messages; search chats and messages; select text in a message and save it to notes.
- **Quiz:** quiz on any topic; choose the number of questions; instant feedback on each answer; replay; search saved quizzes.
- **Notebook:** pages and subpages; rich text (bold, italic, underline, headings, bullet and numbered lists, links); add a page from a photo or PDF; move pages; search; word count and save status.
- **Timer:** countdown, sand and water modes; 15 seconds to 2 hours; pause, resume, repeat; notification at the end.
- **Whole app (shown as a short strip under the rows):** home screen with reorderable modules, works offline with saved data, notifications, Polish and English.

## Open points for the owner

1. Recipe link, decided by the owner: `https://www.bbc.co.uk/food/recipes/steamed_sponge_pudding_35587`.
2. Weather city: Kraków.

## Left to the builder

Exact selectors and timings per flow, video bitrate, spacing and breakpoints of the rows, wording polish of the feature lists.

## Changes from the owner (2026-11-15)

- Chat is removed from the website (both languages): no row, no recording, no mention in the hero, meta description or module count. The module will come back later. The Terms and Privacy pages still describe chat; whether to change them is the owner's call.
- Module names follow the app's home screen: Zadania, Garnek, Lista zakupów, Pogoda, Quiz, Teczka, Timer. Rows for Garnek and Teczka carry a small descriptive label above the name (Przepisy / Notatki). The English page uses the same names with English labels.
- "Quiz AI" is now "Quiz". Every module that uses AI shows a "Wspierane przez AI" badge (all but Timer).
- Recordings hide the app header, bottom bar and the "Start / <module>" breadcrumb, so a renamed module never needs a new clip.
