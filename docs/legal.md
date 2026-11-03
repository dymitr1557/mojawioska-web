# Legal documents

The site hosts three documents, each as one Astro page per language:

| Document             | Polish                                  | English                     |
| -------------------- | --------------------------------------- | --------------------------- |
| Regulamin            | `src/pages/regulamin.astro`             | `src/pages/en/terms.astro`   |
| Polityka prywatności | `src/pages/polityka-prywatnosci.astro`  | `src/pages/en/privacy.astro` |
| Polityka cookies     | `src/pages/polityka-cookies.astro`      | `src/pages/en/cookies.astro` |

Each page wraps its text in `src/layouts/Layout.astro`, which takes the page `title` and `alternatePath` (the same document's path in the other language, used for the language switch link). Write the text as plain HTML inside the layout. When you change a document, change both language versions.

## What each document must cover

The texts are placeholders right now. The full versions must follow Polish law:

- **Regulamin**: ustawa o świadczeniu usług drogą elektroniczną, art. 8 (scope of the service, technical requirements, how the contract starts and ends, ban on unlawful content, complaints).
- **Polityka prywatności**: RODO art. 13 (controller, purposes and legal bases, recipients, transfers outside the EEA, retention, user rights, complaint to UODO).
- **Polityka cookies**: Prawo komunikacji elektronicznej, art. 399 (information stored on the device; strictly necessary storage needs no consent).

Have the texts checked by a lawyer before publishing them. Update the cookie policy (and add a consent banner) if analytics or marketing tools are added to the app or this site.
