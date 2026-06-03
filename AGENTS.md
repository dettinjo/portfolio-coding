# AI Agent Guide — Portfolio Data Pipeline

This file gives AI assistants the context needed to set up, update, or generate
content for any repository that feeds into the portfolio at
**codeby.joeldettinger.de**.

---

## How the pipeline works

At build time, `scripts/fetch-portfolio.ts` runs and:

1. Fetches all GitHub repos belonging to `dettinjo` that have the **`portfolio`**
   topic set.
2. Reads the `.portfolio/` folder from each repo to get metadata, descriptions,
   cover image, and gallery images.
3. Calculates skill levels from GitHub language byte counts and tags.
4. Writes `src/data/projects.json` and `src/data/skills.json`.
5. Next.js builds a static site from those files.

A rebuild is triggered automatically when:
- `portfolio-coding/main` is pushed (full rebuild + deploy)
- Any project repo or the config repo pushes to `main` and has the notify
  workflow set up (triggers `repository_dispatch` → rebuild)
- Weekly on Monday 03:00 UTC (safety net)

---

## Setting up a new project repository

### 1. Add the `portfolio` topic

In the repo on GitHub → **About → Topics** → add `portfolio`.

Without this topic the repo is invisible to the pipeline.

### 2. Create the `.portfolio/` folder

The folder must live at the root of the repo:

```
.portfolio/
  metadata.json        ← required
  about.en.md          ← required (English long description)
  about.de.md          ← required (German long description)
  cover.png            ← recommended (or .jpg / .svg / .webp)
  gallery/             ← optional
    screenshot-1.png
    screenshot-2.png
```

### 3. `metadata.json` — full schema

```json
{
  "title": "Project Name",
  "titleDe": "Projektname auf Deutsch",

  "description": "One-sentence English summary shown on the project card.",
  "descriptionDe": "Einzeiler auf Deutsch für die Projektkarte.",

  "projectType": "Web Application",
  "projectTypeDe": "Web-Anwendung",

  "developedAt": "2024-06-01T00:00:00+00:00",

  "weight": 2,

  "tags": [
    "Next.js",
    "TypeScript",
    "PostgreSQL",
    "Docker"
  ],

  "liveUrl": "https://example.com",
  "repoUrl": "https://github.com/dettinjo/repo-name",
  "publishLink": true
}
```

**Field reference:**

| Field | Required | Notes |
|---|---|---|
| `title` | ✅ | Short name shown on the card and detail page |
| `titleDe` | ✅ | German translation |
| `description` | ✅ | ≤ 160 chars; shown on the card |
| `descriptionDe` | ✅ | German translation of `description` |
| `projectType` | ✅ | Category label, e.g. `"Full-Stack Web Application"`, `"Mobile App"`, `"DevOps & IaC"`, `"Data Science"` |
| `projectTypeDe` | ✅ | German translation of `projectType` |
| `developedAt` | ✅ | ISO 8601 date string (when the project was completed/released) |
| `weight` | ✅ | Display priority — higher = earlier in the list. Use `3` for featured, `2` for standard, `1` for minor. |
| `tags` | ✅ | Tech stack tags. Match casing in `src/data/tech-registry.json` when possible so icons resolve automatically. |
| `liveUrl` | optional | URL to the live deployment |
| `repoUrl` | optional | URL to the public repo (overridden to `null` if `publishLink` is `false`) |
| `publishLink` | ✅ | `true` shows the GitHub link; `false` hides it (for private or unpublished projects) |

### 4. `about.en.md` — English long description

Written in Markdown. Shown on the project detail page. Aim for 200–600 words.

**Recommended structure:**

```markdown
## Project Title

One-paragraph overview: what it is, who it's for, what problem it solves.

### Key Features

- **Feature 1**: Brief explanation.
- **Feature 2**: Brief explanation.
- **Feature 3**: Brief explanation.

### Technical Highlights

Describe the interesting engineering decisions, architecture choices, or
challenges solved. Mention specific libraries, patterns, or approaches used.

### Outcome

What was the result? Is it live? Used by real users? A learning project?
```

### 5. `about.de.md` — German long description

Same structure as `about.en.md` but in German. It does **not** need to be a
word-for-word translation — a natural German rewrite is preferred.

### 6. Cover image

- **File:** `cover.png`, `cover.jpg`, `cover.svg`, or `cover.webp`
- **Size:** 1200 × 800 px or similar 3:2 ratio for photos/screenshots
- **SVGs:** Use for logos or icon-based covers (e.g. tech stack icon). Keep
  under 100 KB.
- **Content:** A representative screenshot, mockup, or logo. Avoid large text
  that will be unreadable at small sizes.
- The pipeline converts PNG/JPG to WebP automatically; SVGs are served as-is.

### 7. Gallery images (optional)

- Place in `.portfolio/gallery/`
- Same formats as cover (PNG, JPG, SVG, WebP)
- 2–6 images recommended; more than 8 is too many
- Name them descriptively: `dashboard.png`, `login-screen.png`, etc.
- The first gallery image is used as the lightbox opener

---

## Setting up the rebuild notify workflow

When this file is present in a project repo, a push to `main` automatically
triggers a portfolio rebuild (takes ~6 minutes).

**Step 1** — Add secret in the project repo:  
`github.com/dettinjo/{repo} → Settings → Secrets → Actions → New secret`

- **Name:** `PORTFOLIO_DISPATCH_TOKEN`  
- **Value:** A fine-grained PAT with **Actions: Read and write** on
  `dettinjo/portfolio-coding` only. (Ask the portfolio owner for the token.)

**Step 2** — Create `.github/workflows/notify-portfolio.yml`:

```yaml
on:
  push:
    branches: [main]
jobs:
  notify:
    uses: dettinjo/portfolio-coding/.github/workflows/portfolio-notify.yml@main
    secrets:
      token: ${{ secrets.PORTFOLIO_DISPATCH_TOKEN }}
```

That's the entire file. The actual dispatch logic is maintained centrally in
`portfolio-coding` so nothing needs updating in project repos when the pipeline
changes.

---

## Personal config repository (`portfolio-config`)

This private repo holds personal data used on the resume and hero sections.
It must be tagged with the **`portfolio-config`** topic on GitHub so the
pipeline auto-detects it.

**Expected structure:**

```
.portfolio/
  resume.json      ← resume data (see schema below)
  profile.jpg      ← profile photo (or .png / .webp)
  resume.pdf       ← downloadable PDF resume (optional)
```

### `resume.json` schema

```json
{
  "basics": {
    "name": "Joel Dettinger",
    "headline": "Software Engineer",
    "email": "hello@joeldettinger.de",
    "location": "Germany",
    "url": { "label": "codeby.joeldettinger.de", "href": "https://codeby.joeldettinger.de" }
  },
  "sections": {
    "summary": {
      "name": "Summary", "visible": true,
      "content": "Markdown string with professional summary."
    },
    "experience": {
      "name": "Experience", "visible": true,
      "items": [
        {
          "company": "Company Name",
          "position": "Job Title",
          "location": "City, Country",
          "date": "Jan 2022 — Present",
          "summary": "Markdown bullet points describing responsibilities."
        }
      ]
    },
    "education": {
      "name": "Education", "visible": true,
      "items": [
        {
          "institution": "University Name",
          "studyType": "Bachelor of Science",
          "area": "Computer Science",
          "date": "2019 — 2023",
          "summary": ""
        }
      ]
    },
    "skills": {
      "name": "Skills", "visible": true,
      "items": [
        { "name": "Languages", "keywords": ["TypeScript", "Python", "Kotlin"] },
        { "name": "Frameworks", "keywords": ["Next.js", "FastAPI"] }
      ]
    },
    "languages": {
      "name": "Languages", "visible": true,
      "items": [
        { "language": "German", "fluency": "Native" },
        { "language": "English", "fluency": "Fluent" }
      ]
    }
  }
}
```

The config repo should also have the notify workflow so a push to `main`
triggers a portfolio rebuild — same setup as project repos.

---

## Tag naming and icon resolution

Tags in `metadata.json` are matched against `src/data/tech-registry.json` in
`portfolio-coding` to resolve icons (devicon CSS classes) and documentation
URLs.

**Use exact casing from the registry where possible:**

```
Next.js · TypeScript · JavaScript · Python · Kotlin · Swift · Go · Rust
React · Vue.js · Angular · Node.js · FastAPI · Django · Laravel · Spring Boot
PostgreSQL · MySQL · MongoDB · Redis · SQLite
Docker · Kubernetes · Terraform · GitHub Actions · GitLab CI/CD
Microsoft Azure · AWS · Google Cloud
Tailwind CSS · shadcn/ui · Framer Motion
```

If a tag is not in the registry it still appears as a plain badge (no icon).
New tags can be added to the registry by editing `src/data/tech-registry.json`.

---

## Checklist for a complete project repo

```
[ ] Repository has the `portfolio` topic set on GitHub
[ ] .portfolio/metadata.json — all required fields filled
[ ] .portfolio/about.en.md — English long description (200–600 words)
[ ] .portfolio/about.de.md — German long description
[ ] .portfolio/cover.png (or .jpg/.svg/.webp) — representative image
[ ] .portfolio/gallery/ — 2–6 screenshots (optional but recommended)
[ ] .github/workflows/notify-portfolio.yml — auto-rebuild on push
[ ] PORTFOLIO_DISPATCH_TOKEN secret added to the repo
```
