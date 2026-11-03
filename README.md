# wioska-web

Public website for the Wild Child app: a landing page and the legal documents the app links to. Built with [Astro](https://astro.build), no other libraries.

Live at https://dymitr1557.github.io/wioska-web/

## Routes

| Polish (default)        | English        |
| ----------------------- | -------------- |
| `/`                     | `/en/`         |
| `/regulamin`            | `/en/terms`    |
| `/polityka-prywatnosci` | `/en/privacy`  |
| `/polityka-cookies`     | `/en/cookies`  |

The mobile app (`wild-child` repo) opens the Polish paths as `environment.websiteUrl` + path, so do not rename them without updating the app.

Languages use Astro's built-in i18n routing (`astro.config.mjs`). Polish has no prefix, English lives under `src/pages/en/`. Build links with `getRelativeLocaleUrl` from `astro:i18n` so they include the base path.

## Development

Requires Node 22.23.4+.

```bash
npm install
npm run dev      # http://localhost:4321/wioska-web/
npm run build    # static output in dist/
npm run preview
```

## Deployment

`.github/workflows/deploy.yml` builds and publishes the site to GitHub Pages on every push to `main` (it can also be started by hand from the Actions tab). In the repository settings, **Pages → Source** must be set to **GitHub Actions**.

## Adding a custom domain

1. In `astro.config.mjs`, set `site` to the domain (e.g. `https://wildchild.pl`) and remove `base`.
2. Add `public/CNAME` containing just the domain.
3. Point the domain's DNS at GitHub Pages and set it under **Settings → Pages → Custom domain**.
4. Update `websiteUrl` in the mobile app's environment files.

## Legal documents

See [docs/legal.md](docs/legal.md).
