# AI Agent Guide — Portfolio Data Pipeline

This file gives AI assistants the context needed to set up or update any
repository that feeds into a portfolio built from this template. The template is
**config-driven and GitHub-native**: it contains zero personal data, and
everything is injected at build time from your GitHub repositories and a private
config repo.

---

## How the pipeline works

At build time, `scripts/fetch-portfolio.ts` runs and:

1. Lists the GitHub repos owned by the authenticated user (via `GITHUB_TOKEN`).
2. Selects repos by **topic**: `portfolio` (shown with a code link) or
   `portfolio-private` (shown without a link). For each, it reads the localized
   **READMEs** (`README.md` + optional `README.de.md`), the repo **description**
   (card overview) and **topics** (tags).
3. Pulls personalization from the **config repo** (auto-detected via the
   `portfolio-config` topic): `site.config.json`, `resume.json`, profile image,
   optional `resume.pdf`.
4. Calculates a relevance score per technology from each project's GitHub
   language byte counts, tags, breadth (distinct projects) and recency; writes
   `src/data/projects.json` and `src/data/skills.json`.
5. Next.js builds a static site from those files. There is **no runtime
   fetching** — a rebuild refreshes everything.

If no `GITHUB_TOKEN` is present (clean clone) or `PORTFOLIO_DEMO=1` is set, the
build instead serves the committed **demo dataset** under `demo/` (see below).

---

## Setting up a project repository (GitHub-native, README-based)

### 1. Add a topic

On GitHub → **About → Topics**:
- `portfolio` — the project is shown with a link to the repo, **or**
- `portfolio-private` — the project is shown without any code link.

Without one of these topics the repo is invisible to the pipeline. Other topics
become the project's **tags** (match them to `src/data/tech-registry.json` keys
so an icon resolves; unknown tags still show as plain badges).

### 2. Write the README(s)

The repo's **`README.md`** is the project detail page. Add **`README.de.md`**
for a German version (falls back to English if absent). The pipeline:

- drops the first H1 and any language-switcher links,
- downloads images referenced in the README (Markdown or `<img>`) and rewrites
  the paths, converting rasters to WebP,
- uses the **repo description** as the short card overview.

Recommended README structure (the same content reads well on GitHub and on the
detail page):

```markdown
# Project Title           ← H1 is stripped from the detail page

## Overview
One-paragraph summary: what it is, who it's for, the problem it solves.

<p align="center">         ← image-only paragraph renders as a screenshot grid
  <img src="docs/shot1.png" width="32%" />
  <img src="docs/shot2.png" width="32%" />
  <img src="docs/shot3.png" width="32%" />
</p>

## Features
- **Feature** — brief explanation.

## Tech stack
Next.js · TypeScript · Docker
```

### 3. Optional: override the date

The pipeline dates a project from the repo, which is often wrong (repos are
created long after the work). Pin the real date with an HTML comment anywhere in
the README (invisible on GitHub):

```html
<!-- portfolio:date=2024-06-01 -->
```

---

## Config repository (`portfolio-config`, private)

Holds all personalization. Tag it with the **`portfolio-config`** topic so the
pipeline auto-detects it (or set `PORTFOLIO_CONFIG_REPO`).

```
.portfolio/
  site.config.json   ← identity, SEO, legal hosting/analytics (see config/site.config.example.json)
  resume.json        ← CV data for the /resume page
  profile.png        ← avatar (.jpg / .webp also accepted)
  resume.pdf         ← downloadable CV (optional)
```

`site.config.json` is the single source of personalization — name, headline,
email, address, socials, serverUrl, SEO descriptions, and the legal hosting /
analytics text that the imprint and privacy pages render.

---

## Demo / local projects (`metadata.json` model)

For the bundled **demo** dataset (and any hand-authored local projects placed in
`projects-local/`), the pipeline reads a self-contained folder instead of GitHub:

```
<slug>/.portfolio/
  metadata.json      ← title/tags/dates/languages/links
  about.en.md        ← English long description (Markdown, screenshot grid)
  about.de.md        ← German long description
  cover.webp         ← card cover
  gallery/*.webp     ← screenshots referenced from about.*.md
```

`metadata.json` carries a `languages` byte map so demo/local projects drive the
same skill scoring as real GitHub language stats. The demo dataset is generated
by `scripts/generate-demo-assets.ts` and committed under `demo/`. Regenerate it
with `npx tsx scripts/generate-demo-assets.ts`.

---

## Tag naming and icon resolution

Tags (GitHub topics, or `metadata.json` tags) resolve to icons (devicon CSS
classes) and documentation URLs via `src/data/tech-registry.json`, merged with
the full devicon manifest so most technologies get an icon automatically. Use
recognizable names, e.g.:

```
Next.js · TypeScript · JavaScript · Python · Kotlin · Swift · Go · Rust
React · Vue.js · Node.js · Express.js · Flask · Laravel · Spring Boot
PostgreSQL · MySQL · MongoDB · Redis · SQLite
Docker · Kubernetes · Terraform · GitLab CI/CD · Microsoft Azure
Tailwind CSS · Framer Motion · next-intl
```

Add or override an entry (category, icon, URL) by editing
`src/data/tech-registry.json`.

---

## Automatic rebuilds (optional)

A push that should refresh the live site can trigger a rebuild via a
`repository_dispatch`. Add a notify workflow to a project or config repo that
calls the central reusable workflow in the portfolio repo, passing a fine-grained
PAT with **Actions: Read and write** on the portfolio repo as a secret. The
dispatch logic stays centralized so project repos need no updates when the
pipeline changes.

---

## Checklist for a project repo

```
[ ] Repository has the `portfolio` or `portfolio-private` topic
[ ] README.md present (detail page); README.de.md for German (optional)
[ ] Screenshots committed and referenced in the README (grid)
[ ] Other topics set as tech tags (match tech-registry keys where possible)
[ ] <!-- portfolio:date=YYYY-MM-DD --> if the repo date is misleading
```
