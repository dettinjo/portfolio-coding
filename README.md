# Portfolio — config-driven, GitHub-powered

A fast, SEO-optimized, fully bilingual (EN/DE) developer portfolio built with
Next.js (App Router) and `next-intl`. The template contains **zero personal
data** — everything is injected at build time from a single config source and
from your GitHub repositories.

## How it works

```
portfolio-config repo (private, topic: "portfolio-config")   ← the ONE place you personalize
  .portfolio/site.config.json   name, email, address, socials, serverUrl, SEO, legal
  .portfolio/profile.png        avatar
  .portfolio/resume.json        CV data for the /resume page
  .portfolio/resume.pdf         downloadable CV (optional)
        │  (fetched at build time, never committed to this repo)
        ▼
this template repo  ──►  npm run build  ──►  static, personalized site
        ▲
        │  project repos: just add the GitHub topic "portfolio"
```

At build time `scripts/fetch-portfolio.ts`:

1. Reads `site.config.json` (config repo → local `config/site.config.json` →
   committed `config/site.config.example.json` fallback) into
   `src/data/site.config.json`. `src/lib/config.ts` exposes it as `siteConfig`.
2. Lists your GitHub repos and builds the project list from every repo tagged
   **`portfolio`**.
3. Aggregates skills from each project's languages, size, and recency.

Re-running the build (or a redeploy) refreshes everything — there is no runtime
fetching.

## Personalizing

Edit **`site.config.json`** — see [`config/site.config.example.json`](config/site.config.example.json)
for the full schema (person, site/SEO, legal hosting + analytics, contact).
Keep the real file in your private `portfolio-config` repo, or locally at
`config/site.config.json` (gitignored). Secrets stay in env vars — see
[`.env.example`](.env.example).

## Adding a project

**Minimum:** add the GitHub topic **`portfolio`** to any repo. It appears using
the repo's description and tags derived from its languages/topics (English).
Private repos show the description but no source link.

**Optional enrichment** — add a `.portfolio/` folder to the repo:

```
.portfolio/
  metadata.json     title, projectType, tags, weight, developedAt, liveUrl, …
  about.en.md       long description (English)
  about.de.md       long description (German)
  cover.png         cover image (any raster → webp, or .svg)
  gallery/          additional screenshots
```

`metadata.json` (all fields optional — they override the synthesized defaults):

```json
{
  "title": "My Project",
  "titleDe": "Mein Projekt",
  "description": "Short summary",
  "descriptionDe": "Kurzbeschreibung",
  "projectType": "Full-Stack Web Application",
  "projectTypeDe": "Full-Stack Webanwendung",
  "developedAt": "2024-01-01T00:00:00Z",
  "weight": 1,
  "publishLink": true,
  "liveUrl": "https://example.com",
  "repoUrl": "https://github.com/you/my-project",
  "tags": ["Next.js", "TypeScript"]
}
```

Tags should match keys in [`src/data/tech-registry.json`](src/data/tech-registry.json)
to contribute to skill scoring and render an icon.

## Local development

```bash
cp .env.example .env.local        # add GITHUB_TOKEN (+ SMTP/UMAMI if needed)
npm install
npm run build                     # runs fetch-portfolio.ts, then next build
npm run dev
```

Without a token the build falls back to the public GitHub API and the committed
example config, so a clean clone always builds (with placeholder identity).

## Deployment

GitHub Actions builds the image, pushes it to GHCR, and triggers a Coolify
redeploy ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)). The
`portfolio-watcher` service polls for pushes to `portfolio`-tagged repos and
fires a rebuild automatically. `GITHUB_TOKEN` is passed only as a BuildKit
secret — never baked into an image layer.

## Tech stack

Next.js 15 · React 19 · TypeScript · Tailwind CSS · next-intl · Framer Motion ·
sharp · nodemailer · Umami (analytics) · Docker.

## License

Distributed under the CC BY-NC 4.0 License. See `LICENSE` for details.
