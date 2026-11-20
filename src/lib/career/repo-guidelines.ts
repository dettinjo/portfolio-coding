// What a GitHub repository needs to show up well on the portfolio website and
// in the MCP career hub — as static guidelines and as a live audit of one repo.
// Both are served by the MCP server so a coding session working inside any
// repository can ask "what does this repo need?" and then fix README, topics
// and GitHub settings itself.

import { loadExtraProjects } from "./data";
import {
  buildProject,
  CONTROL_TOPICS,
  displayTag,
  isRegisteredTech,
  registeredTechNames,
  stripReadme,
  type RawProject,
} from "./projects";
import { extractFirstParagraph, extractHighlights, parseDateOverride } from "@/lib/projects/readme";
import { siteConfig } from "@/lib/config";
import devicon from "devicon/devicon.json";

// The build merges devicon's manifest into the tech registry, so any devicon
// name/altname also gets an icon and skill scoring.
const normTech = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const deviconNames = new Set(
  (devicon as Array<{ name: string; altnames?: string[] }>).flatMap((e) =>
    [e.name, ...(e.altnames ?? [])].map(normTech)
  )
);
const isKnownTech = (topic: string) => isRegisteredTech(topic) || deviconNames.has(normTech(topic));

const CARD_TEXT_MAX = 260;

export function getRepoGuidelines() {
  const siteUrl = siteConfig.site?.serverUrl || process.env.NEXT_PUBLIC_SERVER_URL || "";
  return {
    purpose:
      "Requirements for a GitHub repository to appear on the portfolio website and in the MCP career hub (get_master_resume projects, get_role_profile). Everything is read from GitHub: topics, the About box and README.md / README.de.md. There is no per-repo metadata file — do NOT add a .portfolio folder to project repos (that folder only exists in the private portfolio-config repo).",
    workflow: [
      "1. Call audit_portfolio_repo with this repo's name to see what is missing and a preview of what the site will derive.",
      "2. Fix the README (structure below) and add screenshots under docs/screenshots/.",
      "3. Fix GitHub settings (topics, description, website) — the audit returns ready-to-run `gh repo edit` commands.",
      "4. Commit/merge the README changes in this repo.",
      "5. Run audit_portfolio_repo again until it reports no errors.",
      "6. Publish: call sync_github_projects (MCP/CV data refresh immediately). The website itself only updates on a rebuild of the portfolio-coding repo (push to its main branch or run its 'Build & Deploy' workflow).",
    ],
    githubSettings: {
      ownership: "The repository must be owned by the portfolio account; collaborator/org repos are ignored.",
      controlTopic: {
        portfolio: "Shown on the site WITH a link to the source code.",
        "portfolio-private": "Shown WITHOUT a code link (private or proprietary work). Works for private repos.",
        rule: "Exactly one of the two is required, otherwise the repo is invisible.",
      },
      techTopics:
        "Every other topic becomes a tag. Use technology slugs that match the tech registry (e.g. fastapi, flutter, postgresql, kubernetes, terraform) so the tag gets an icon and counts toward the skills ranking. Unknown topics still show, as plain badges without scoring. Aim for 5–12 tags; avoid generic ones (app, project, code).",
      description:
        "About → Description: one plain sentence. Only used when the README has no usable first paragraph, but keep it current — it is visible on GitHub.",
      website: "About → Website: the live URL; shown as the project's live link.",
      primaryLanguage:
        "GitHub's detected primary language becomes the project type label and feeds skill scoring. If it is wrong (e.g. HTML from generated docs), add a .gitattributes with `docs/** linguist-documentation` or `*.html linguist-vendored`.",
    },
    readme: {
      title: "The first `# H1` becomes the project title and is removed from the detail page.",
      languageSwitcher:
        "Optional, as Markdown so it is stripped: `**[English](README.md) · [Deutsch](README.de.md)**`. An HTML <a href=README.de.md> switcher stays visible.",
      cardText: `The first plain-text paragraph (after title, badges, images and HTML lines) is the card text, the CV project summary and the MCP summary. 1–2 sentences, ≤ ${CARD_TEXT_MAX} characters, plain prose — what it is, for whom, the key technical idea. Do not start it with HTML.`,
      highlights:
        "The first two bullet points (≥ 40 characters each) become the project's highlights in the CV tools and cover-letter grounding. Format: `- **Lead** — concrete technical fact (tech, scale, design decision)`. Put the two strongest engineering points first.",
      date: "Add `<!-- portfolio:date=YYYY-MM-DD -->` anywhere (invisible on GitHub) when the repo was created later than the work started; otherwise the repo creation date is used.",
      german: "Optional README.de.md with the same structure; the German site falls back to English.",
      roleTracks:
        "Role tracks (ai_engineer, fullstack_engineer, backend_distributed, data_analyst_engineer, cloud_devops_engineer, security_ml_engineer) are inferred from topics + card text + highlights. Name the relevant technologies there explicitly.",
      publicSafety:
        "The README of a `portfolio` repo is published verbatim on the website. Remove internal IPs, tailnet hostnames, secret names, personal paths and anything you would not show an employer.",
    },
    screenshots: {
      location: "Commit images to the repo, e.g. docs/screenshots/*.png|.jpg|.webp, and reference them with RELATIVE paths.",
      processing: "At build time they are downloaded (private repos too), converted to WebP and scaled to ≤ 1920px wide. SVGs pass through unchanged. External URLs are left as-is.",
      cover:
        "The FIRST image in the README becomes the card cover. Put the best screenshot (≈4:3 or 16:10, ≥ 1200px wide) before any shields.io badges, otherwise a badge becomes the cover. No image at all → a generated title-card cover.",
      grid: 'A paragraph containing only images renders as a screenshot grid: <p align="center"> with 2–3 <img width="49%"> or width="32%">.',
    },
    readmeTemplate: [
      "<!-- portfolio:date=2026-04-01 -->",
      "# Project Title",
      "",
      "**[English](README.md) · [Deutsch](README.de.md)**",
      "",
      '<p align="center"><img src="docs/screenshots/hero.png" alt="Main screen" width="100%" /></p>',
      "",
      "One or two sentences: what it is, who it is for, and the key technical idea (≤ 260 chars).",
      "",
      "## Highlights",
      "- **Strongest point** — concrete technical detail (stack, scale, design decision).",
      "- **Second point** — another concrete, verifiable engineering fact.",
      "- **Third point** — …",
      "",
      '<p align="center">',
      '  <img src="docs/screenshots/a.png" width="32%" /> <img src="docs/screenshots/b.png" width="32%" /> <img src="docs/screenshots/c.png" width="32%" />',
      "</p>",
      "",
      "## Architecture",
      "…",
      "",
      "## Tech stack",
      "FastAPI · PostgreSQL · Docker",
    ].join("\n"),
    cvOverrides:
      "Name, summary, highlights, technologies, tracks, a context line (e.g. 'Client project with …') or hidden: true can be overridden for the CV/MCP only in portfolio-config/.portfolio/extra-projects.json, keyed by the lower-case repo name. The website ignores that file. Prefer fixing the README.",
    registeredTechTopics: registeredTechNames(),
    registeredTechTopicsNote:
      "Curated entries (with category and docs link). Any devicon technology name (devicon.dev, ~580 entries, e.g. fastapi, flutter, dart) is also recognised.",
    siteUrl,
  };
}

// ─── Live audit ──────────────────────────────────────────────────────────────

type Severity = "error" | "warning" | "info";
interface Finding {
  severity: Severity;
  area: "github-settings" | "readme" | "screenshots" | "content";
  message: string;
  fix?: string;
}

const auditCache = new Map<string, { at: number; result: unknown }>();
const AUDIT_CACHE_MS = 30_000;

const SUSPICIOUS_LANGUAGES = new Set(["HTML", "CSS", "Jupyter Notebook", "Makefile", "Dockerfile", "Shell", "Roff", "TeX"]);

/** Image refs (markdown + <img>) in document order. */
function imageRefs(markdown: string): string[] {
  const refs: Array<{ src: string; index: number }> = [];
  let m: RegExpExecArray | null;
  const md = /!\[[^\]]*\]\(([^)\s]+)[^)]*\)/g;
  while ((m = md.exec(markdown)) !== null) refs.push({ src: m[1], index: m.index });
  const html = /<img\b[^>]*?\ssrc=["']([^"']+)["'][^>]*>/gi;
  while ((m = html.exec(markdown)) !== null) refs.push({ src: m[1], index: m.index });
  return refs.sort((a, b) => a.index - b.index).map((r) => r.src);
}

const isBadge = (src: string) => /shields\.io|badge|badgen\.net|img\.shields/i.test(src);

const PRIVATE_PATTERNS: Array<[RegExp, string]> = [
  [/\b(10\.\d{1,3}|192\.168|172\.(1[6-9]|2\d|3[01])|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7]))\.\d{1,3}\.\d{1,3}\b/, "a private/tailnet IP address"],
  [/\b[\w-]+\.ts\.net\b/i, "a Tailscale (ts.net) hostname"],
  [/\binfisical-get\b|\bINFISICAL_[A-Z_]+/, "secret-manager commands/variables"],
  [/\/home\/[a-z][\w-]*\//, "a personal filesystem path"],
];

export async function auditPortfolioRepo(repo: string, ownerArg?: string) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is not set on the server — cannot read GitHub.");
  const headers = {
    "User-Agent": "portfolio-career-hub",
    Accept: "application/vnd.github.v3+json",
    Authorization: `token ${token}`,
  };
  const gh = async <T>(url: string): Promise<{ ok: boolean; status: number; data: T | null }> => {
    const res = await fetch(url, { headers, cache: "no-store" });
    return { ok: res.ok, status: res.status, data: res.ok ? ((await res.json()) as T) : null };
  };
  const readFile = async (owner: string, name: string, file: string): Promise<string | null> => {
    const r = await gh<{ content?: string }>(`https://api.github.com/repos/${owner}/${name}/contents/${file}`);
    return r.data?.content ? Buffer.from(r.data.content, "base64").toString("utf8") : null;
  };

  // Accept "name", "owner/name" or a GitHub URL.
  const cleaned = repo.trim().replace(/^https?:\/\/github\.com\//i, "").replace(/\.git$/, "").replace(/\/$/, "");
  const [maybeOwner, maybeName] = cleaned.includes("/") ? cleaned.split("/") : [undefined, cleaned];
  const portfolioOwner =
    process.env.GITHUB_USER ||
    process.env.NEXT_PUBLIC_GITHUB_USERNAME ||
    (await gh<{ login: string }>("https://api.github.com/user")).data?.login ||
    "";
  const owner = ownerArg || maybeOwner || portfolioOwner;
  const name = maybeName!;

  const cacheKey = `${owner}/${name}`.toLowerCase();
  const cached = auditCache.get(cacheKey);
  if (cached && Date.now() - cached.at < AUDIT_CACHE_MS) return cached.result;

  const repoRes = await gh<{
    name: string;
    owner: { login: string };
    private: boolean;
    description: string | null;
    homepage: string | null;
    topics?: string[];
    language: string | null;
    created_at: string;
    html_url: string;
  }>(`https://api.github.com/repos/${owner}/${name}`);
  if (!repoRes.data) {
    throw new Error(`Repository ${owner}/${name} not found or not readable with the server token (HTTP ${repoRes.status}).`);
  }
  const r = repoRes.data;
  const findings: Finding[] = [];
  const add = (severity: Severity, area: Finding["area"], message: string, fix?: string) =>
    findings.push({ severity, area, message, ...(fix ? { fix } : {}) });

  // ── GitHub settings ──
  const topics = r.topics ?? [];
  const linked = topics.includes("portfolio");
  const unlinked = topics.includes("portfolio-private");
  const fullName = `${r.owner.login}/${r.name}`;
  const ghCommands: string[] = [];

  if (portfolioOwner && r.owner.login !== portfolioOwner) {
    add("error", "github-settings", `Owned by ${r.owner.login}, but the portfolio only lists repos owned by ${portfolioOwner}.`, "Transfer or fork the repository to the portfolio account.");
  }
  if (!linked && !unlinked) {
    const suggested = r.private ? "portfolio-private" : "portfolio";
    add("error", "github-settings", "No control topic — the repo is invisible on the portfolio.", `Add the topic '${suggested}' ('portfolio' = with code link, 'portfolio-private' = without).`);
    ghCommands.push(`gh repo edit ${fullName} --add-topic ${suggested}`);
  } else if (linked && unlinked) {
    add("warning", "github-settings", "Both 'portfolio' and 'portfolio-private' are set; the code link is shown.", "Keep only one.");
  } else if (linked && r.private) {
    add("info", "github-settings", "Tagged 'portfolio' (code link shown) but the repo is private — visitors will get a 404 on the code link.", "Use 'portfolio-private' or make the repo public.");
  }

  const techTopics = topics.filter((t) => !CONTROL_TOPICS.has(t));
  const unknown = techTopics.filter((t) => !isKnownTech(t));
  if (techTopics.length < 4) {
    add("warning", "github-settings", `Only ${techTopics.length} technology topic(s); tags and skill scoring come from topics.`, "Add 5–12 technology topics (see registeredTechTopics in get_portfolio_repo_guidelines).");
  }
  if (unknown.length) {
    add("info", "github-settings", `Topics with no tech-registry or devicon match (shown as plain tags, no icon/skill score): ${unknown.join(", ")}.`, "Prefer registry slugs where one exists; otherwise fine for descriptive tags.");
  }
  if (!r.description) {
    add("warning", "github-settings", "No About description.", "Set a one-sentence description (gh repo edit --description).");
  }
  if (!r.homepage) {
    add("info", "github-settings", "No About website — no live link on the project page.", "Set it if the project is deployed (gh repo edit --homepage <url>).");
  }
  if (r.language && SUSPICIOUS_LANGUAGES.has(r.language)) {
    add("warning", "github-settings", `GitHub reports the primary language as '${r.language}', which becomes the project type label.`, "Add a .gitattributes marking generated/docs files (`docs/** linguist-documentation`, `*.html linguist-vendored`).");
  }

  // ── README ──
  const readmeRaw = await readFile(r.owner.login, r.name, "README.md");
  const readmeDe = await readFile(r.owner.login, r.name, "README.de.md");
  let preview: ReturnType<typeof buildProject> | null = null;
  let cover: string | null = null;
  let cardText = "";

  if (!readmeRaw) {
    add("error", "readme", "No README.md — the README is the project detail page and the source of the card text and highlights.", "Create README.md following readmeTemplate in get_portfolio_repo_guidelines.");
  } else {
    const { title, body } = stripReadme(readmeRaw);
    if (!title) add("warning", "readme", "No '# H1' title; the repo name is prettified instead.", "Start the README with '# Project Title'.");

    cardText = extractFirstParagraph(body, 10_000);
    if (!cardText) {
      add("error", "readme", "No plain-text paragraph found — the card falls back to the GitHub description and the CV summary is empty.", "Add a 1–2 sentence intro paragraph right after the title/images.");
    } else if (cardText.length > CARD_TEXT_MAX) {
      add("warning", "readme", `First paragraph is ${cardText.length} chars; the card cuts it at ${CARD_TEXT_MAX}.`, "Shorten the intro to 1–2 sentences.");
    }

    const highlights = extractHighlights(body, 5);
    if (highlights.length < 2) {
      add("warning", "readme", `Only ${highlights.length} usable bullet point(s) for CV highlights.`, "Add a bullet list with '- **Lead** — concrete technical fact' items (≥ 40 chars each) near the top.");
    }

    if (/<a[^>]+href=["']README(\.[a-z]{2})?\.md["']/i.test(readmeRaw)) {
      add("warning", "readme", "Language switcher is HTML, so it stays visible on the detail page.", "Use Markdown: **[English](README.md) · [Deutsch](README.de.md)**");
    }

    const date = parseDateOverride(readmeRaw);
    if (!date) {
      add("info", "readme", `No date override; the repo creation date (${r.created_at.slice(0, 10)}) is shown.`, "Add <!-- portfolio:date=YYYY-MM-DD --> if the work started earlier.");
    }
    if (!readmeDe) add("info", "readme", "No README.de.md; the German site shows the English README.", "Optional: add a German translation.");

    // Topics that the README never mentions are often stale (e.g. a replaced framework).
    const readmeLower = readmeRaw.toLowerCase();
    const notMentioned = techTopics.filter((t) => {
      const words = [t, displayTag(t), t.replace(/-/g, " ")].map((w) => w.toLowerCase());
      return !words.some((w) => readmeLower.includes(w));
    });
    if (notMentioned.length) {
      add("info", "content", `Topics not mentioned anywhere in the README (possibly outdated): ${notMentioned.join(", ")}.`, "Remove stale topics (gh repo edit --remove-topic) or mention the technology in the README.");
    }

    // Screenshots
    const imgs = imageRefs(body);
    const isScreenshot = (src: string) => !isBadge(src) && /\.(png|jpe?g|webp|gif)(\?|$)/i.test(src);
    const screenshots = imgs.filter(isScreenshot);
    cover = imgs[0] ?? null;
    if (!imgs.length) {
      add("warning", "screenshots", "No images — the card gets a generated title-card cover.", "Add screenshots under docs/screenshots/ and reference them with relative paths; the first one becomes the cover.");
    } else if (isBadge(imgs[0])) {
      add("error", "screenshots", `The first image is a badge (${imgs[0]}), so it becomes the card cover.`, "Move the main screenshot above the badges.");
    } else if (/^https?:/i.test(imgs[0])) {
      add("info", "screenshots", "The cover image is an external URL; it is not optimised to WebP.", "Commit it to the repo and use a relative path.");
    }
    if (cover && !isBadge(cover) && !isScreenshot(cover)) {
      add("info", "screenshots", `The cover is a logo/diagram (${cover}), not a screenshot.`, "Fine for infrastructure projects; for apps put a real screenshot first.");
    }
    if (imgs.length && screenshots.length < 2) {
      add("warning", "screenshots", `${screenshots.length} raster screenshot(s) found.`, "Add 2–4 screenshots (PNG/JPG/WebP) in an image-only paragraph; they render as a grid.");
    }

    // Public safety
    if (!r.private || linked) {
      for (const [re, label] of PRIVATE_PATTERNS) {
        const hit = readmeRaw.match(re);
        if (hit) add("warning", "content", `README contains ${label} ('${hit[0]}'); it is published on the website.`, "Remove internal details from the README.");
      }
    }

    const raw: RawProject = {
      id: r.name.toLowerCase(),
      title: title || r.name,
      description: cardText || r.description || "",
      readme: body,
      url: linked ? r.html_url : undefined,
      language: r.language || undefined,
      tags: techTopics.map(displayTag),
      date: date || r.created_at,
    };
    preview = buildProject(raw, raw.id, loadExtraProjects().projects?.[raw.id] ?? {});
  }

  // gh command for missing metadata
  const editParts: string[] = [];
  if (!r.description) editParts.push(`--description "<one sentence>"`);
  if (techTopics.length < 4) editParts.push(`--add-topic <tech1> --add-topic <tech2>`);
  if (editParts.length) ghCommands.push(`gh repo edit ${fullName} ${editParts.join(" ")}`);

  const order: Record<Severity, number> = { error: 0, warning: 1, info: 2 };
  findings.sort((a, b) => order[a.severity] - order[b.severity]);
  const errors = findings.filter((f) => f.severity === "error").length;

  const result = {
    repo: fullName,
    private: r.private,
    readyForPortfolio: errors === 0,
    visibleOnSite: (linked || unlinked) && (!portfolioOwner || r.owner.login === portfolioOwner),
    summary: {
      errors,
      warnings: findings.filter((f) => f.severity === "warning").length,
      info: findings.filter((f) => f.severity === "info").length,
    },
    findings,
    githubCommands: ghCommands,
    current: {
      topics,
      description: r.description,
      homepage: r.homepage,
      primaryLanguage: r.language,
      hasReadme: Boolean(readmeRaw),
      hasGermanReadme: Boolean(readmeDe),
    },
    preview: preview && {
      note: "What the website card and the MCP/CV project entry will show after the next build/sync.",
      title: preview.name,
      cardText: cardText.slice(0, CARD_TEXT_MAX),
      cvSummary: preview.summary,
      highlights: preview.highlights,
      technologies: preview.technologies,
      inferredTracks: preview.tracks,
      cover,
      codeLink: preview.url ?? null,
      liveLink: r.homepage || null,
      date: preview.date,
    },
    nextSteps:
      "Fix errors first, then warnings. Re-run audit_portfolio_repo; then call sync_github_projects (MCP/CV) and rebuild portfolio-coding for the website.",
  };
  auditCache.set(cacheKey, { at: Date.now(), result });
  return result;
}
