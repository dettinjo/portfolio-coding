import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const localProjectsDir = path.join(rootDir, "projects-local");
const publicMediaDir = path.join(rootDir, "public", "media", "projects");
const registryPath = path.join(rootDir, "src", "data", "tech-registry.json");
const outputProjectsPath = path.join(rootDir, "src", "data", "projects.json");
const outputSkillsPath = path.join(rootDir, "src", "data", "skills.json");
const outputResumePath = path.join(rootDir, "src", "data", "resume.json");
const outputSiteConfigPath = path.join(rootDir, "src", "data", "site.config.json");
const exampleSiteConfigPath = path.join(rootDir, "config", "site.config.example.json");
const outputAvatarPath = path.join(rootDir, "public", "images", "profile.webp");
const placeholderAvatarPath = path.join(rootDir, "public", "images", "avatar.placeholder.webp");
const outputPdfPath = path.join(rootDir, "public", "media", "resume.pdf");

// Username may be empty — when a token is present we list repos via /user/repos
// (no username needed) and derive the owner from the results. Falls back to the
// public endpoint only when an explicit username is supplied.
let GITHUB_USERNAME =
  process.env.GITHUB_USER || process.env.NEXT_PUBLIC_GITHUB_USERNAME || "";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const PORTFOLIO_CONFIG_REPO = process.env.PORTFOLIO_CONFIG_REPO;

// Category metadata
const CATEGORIES: Record<string, { name: string; order: number }> = {
  frontend: { name: "Frontend", order: 1 },
  backend: { name: "Backend", order: 2 },
  mobile: { name: "Mobile", order: 3 },
  devops: { name: "DevOps", order: 4 },
  ai: { name: "AI", order: 5 },
};

interface TechDetail {
  name: string;
  category: string;
  iconClassName: string | null;
  url: string | null;
  baseScore?: number;
  levelOverride?: number;
}

interface ProjectMetadata {
  title: string;
  description?: string;
  projectType: string;
  developedAt: string;
  weight: number;
  publishLink: boolean;
  liveUrl: string | null;
  repoUrl: string | null;
  tags: string[];
  // German overrides — optional, falls back to EN if absent
  titleDe?: string;
  descriptionDe?: string;
  projectTypeDe?: string;
}

interface SoftwareProject {
  id: string;
  slug: string;
  title: string;
  titleDe?: string;
  description: string;
  descriptionDe?: string;
  longDescription: string;
  longDescriptionDe?: string;
  projectType: string;
  projectTypeDe?: string;
  developedAt?: string;
  liveUrl?: string;
  repoUrl?: string;
  tags: string[];
  categories?: string[];
  coverImage: any | null;
  gallery: any[] | null;
  localizations?: Array<{
    id: string;
    slug: string;
    locale: string;
  }>;
  _weight?: number; // Internal use during build
  _languages?: Record<string, number>; // Internal use during build
  _coverUrl?: string; // Internal: local URL of the cover image (first README image)
  _topicTags?: string[]; // Internal: raw GitHub topic slugs, for skill scoring
}

// Helper to make authenticated GitHub requests
const githubFetch = async (url: string) => {
  const headers: Record<string, string> = {
    "User-Agent": "portfolio-builder",
    Accept: "application/vnd.github.v3+json",
  };

  if (GITHUB_TOKEN) {
    headers["Authorization"] = `token ${GITHUB_TOKEN}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`GitHub API returned ${res.status} for ${url}`);
  }
  return res.json();
};

// Helper to download file as Buffer
const downloadFileToBuffer = async (url: string): Promise<Buffer> => {
  const headers: Record<string, string> = {
    "User-Agent": "portfolio-builder",
  };
  if (GITHUB_TOKEN) {
    headers["Authorization"] = `token ${GITHUB_TOKEN}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`Failed to download ${url}: ${res.statusText}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

// Helper to save and compress image to WebP if needed.
// Preserves alpha channel (transparency) from source PNGs.
const saveAndCompressImage = async (buffer: Buffer, destPath: string): Promise<string> => {
  const ext = path.extname(destPath).toLowerCase();
  const dir = path.dirname(destPath);
  const name = path.basename(destPath, ext);

  if (ext === ".png" || ext === ".jpg" || ext === ".jpeg") {
    const webpPath = path.join(dir, `${name}.webp`);
    const img = sharp(buffer);
    const meta = await img.metadata();
    await img
      .webp({
        quality: 85,
        // Lossless alpha ensures transparent pixels stay fully transparent,
        // not blended to white during lossy compression of the alpha plane.
        alphaQuality: meta.hasAlpha ? 100 : undefined,
      })
      .toFile(webpPath);
    console.log(`    ✓ Compressed and saved as WebP: ${path.basename(webpPath)}`);
    return `${name}.webp`;
  } else {
    // SVG and other formats pass through unchanged
    fs.writeFileSync(destPath, buffer);
    return path.basename(destPath);
  }
};

// Turn a repo name into a human title: "kube-url-shortener" → "Kube Url Shortener".
const prettifyRepoName = (name: string): string =>
  name
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

// Control topics: a repo opts into the portfolio by carrying one of these.
//   portfolio          → displayed WITH a link to the source code
//   portfolio-private  → displayed WITHOUT a code link (proprietary/closed source)
const TOPIC_LINKED = "portfolio";
const TOPIC_UNLINKED = "portfolio-private";
const CONTROL_TOPICS = new Set([TOPIC_LINKED, TOPIC_UNLINKED, "portfolio-config"]);

// Normalize a tech name/topic to a comparison key by stripping everything but
// alphanumerics: "Next.js" / "nextjs" / "next-js" → "nextjs". Lets GitHub topic
// slugs match tech-registry display names regardless of punctuation/casing.
const normalizeTech = (s: string): string =>
  s.toLowerCase().replace(/[^a-z0-9]/g, "");

// Human-friendly label for a topic that has no tech-registry entry:
// "rest-api" → "Rest Api", "core-data" → "Core Data".
const prettifyTag = (topic: string): string =>
  topic
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

// Per-project complexity multiplier derived from signals already present on the
// repo object (no extra API calls): codebase size (repo.size, KB, log-scaled)
// and recency (repo.pushed_at, decaying over ~3 years). Combined with the
// manual `weight` field this feeds the skill-level scoring.
const computeEffectiveWeight = (manualWeight: number, repo: any): number => {
  const sizeKb = repo.size || 0;
  const sizeScore = Math.min(Math.log10(sizeKb + 1) / 3, 1); // ~0..1
  const pushedAt = repo.pushed_at || repo.updated_at || repo.created_at;
  const monthsSincePush = pushedAt
    ? (Date.now() - new Date(pushedAt).getTime()) / (1000 * 60 * 60 * 24 * 30)
    : 36;
  const recencyScore = Math.max(0, 1 - monthsSincePush / 36); // 1 now → 0 at 3y
  return manualWeight * (1 + 0.5 * sizeScore + 0.3 * recencyScore);
};

const main = async () => {
  console.log("Starting portfolio synchronization...");

  // Create media outputs path
  if (!fs.existsSync(publicMediaDir)) {
    fs.mkdirSync(publicMediaDir, { recursive: true });
  }

  // Load tech registry
  let techRegistry: Record<string, TechDetail> = {};
  if (fs.existsSync(registryPath)) {
    techRegistry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
  } else {
    console.warn(`Tech registry not found at ${registryPath}`);
  }

  // Merge devicon's manifest into the registry so ANY technology gets an icon
  // automatically (registry stays as an optional override for url/category).
  const deviconPath = path.join(rootDir, "node_modules", "devicon", "devicon.json");
  if (fs.existsSync(deviconPath)) {
    const devicon: any[] = JSON.parse(fs.readFileSync(deviconPath, "utf8"));
    const prettify = (s: string) =>
      s.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const deviconClass = (e: any): string | null => {
      const fonts: string[] = e.versions?.font ?? [];
      if (!fonts.length) return null;
      const v = fonts.includes("plain") ? "plain" : fonts.includes("original") ? "original" : fonts[0];
      return `devicon-${e.name}-${v}`;
    };
    // Index devicon by name + altnames for lookup.
    const deviconByName: Record<string, any> = {};
    for (const e of devicon) {
      deviconByName[normalizeTech(e.name)] = e;
      for (const a of e.altnames ?? []) deviconByName[normalizeTech(a)] = e;
    }
    // Backfill icons for registry entries that only declare category/url (icon
    // left null) — the icon is resolved dynamically from devicon, so adding a
    // tech needs nothing more than its category and homepage URL.
    for (const k of Object.keys(techRegistry)) {
      const entry = techRegistry[k] as TechDetail;
      if (!entry.iconClassName) {
        const e = deviconByName[normalizeTech(k)] || deviconByName[normalizeTech(entry.name || "")];
        if (e) entry.iconClassName = deviconClass(e);
      }
    }
    const have = new Set(Object.keys(techRegistry).map((k) => normalizeTech(k)));
    for (const k of Object.keys(techRegistry)) {
      const n = (techRegistry[k] as TechDetail).name;
      if (n) have.add(normalizeTech(n));
    }
    for (const e of devicon) {
      const names = [e.name, ...(e.altnames ?? [])];
      if (names.some((nm: string) => have.has(normalizeTech(nm)))) continue;
      const cls = deviconClass(e);
      if (!cls) continue;
      techRegistry[normalizeTech(e.name)] = {
        name: prettify(e.name),
        category: "backend", // default bucket; override in tech-registry.json
        iconClassName: cls,
        url: null,
      };
    }
  }

  // Normalized lookup: maps normalizeTech(key) and normalizeTech(name) → registry
  // entry, so GitHub topic slugs resolve to the canonical registry entry.
  const registryByNorm: Record<string, { key: string; detail: TechDetail }> = {};
  for (const [key, detail] of Object.entries(techRegistry)) {
    registryByNorm[normalizeTech(key)] = { key, detail };
    if (detail.name) registryByNorm[normalizeTech(detail.name)] = { key, detail };
  }
  // A topic → display label (registry name when known, else prettified slug).
  const displayTag = (topic: string): string => {
    const hit = registryByNorm[normalizeTech(topic)];
    return hit ? hit.detail.name : prettifyTag(topic);
  };

  // Fetch a repo file's text content (base64 contents API). Returns null if 404.
  const fetchRepoText = async (
    owner: string,
    repo: string,
    filePath: string
  ): Promise<string | null> => {
    try {
      const res = await githubFetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`
      );
      if (res && res.content) {
        return Buffer.from(res.content, "base64").toString("utf8");
      }
    } catch {
      /* not found */
    }
    return null;
  };

  // Turn a project README into renderable detail markdown:
  //  - drops the language-switcher line and the leading H1 (the site shows the
  //    title itself), returning the H1 text as the resolved title
  //  - downloads every referenced image into public/media/projects/<repo>/ and
  //    rewrites the markdown to the local (optimized) path
  //  - returns the first image's local URL as the cover
  const processReadme = async (
    markdown: string,
    owner: string,
    repoName: string,
    downloaded: Map<string, string>
  ): Promise<{ title: string; body: string; coverUrl: string | null }> => {
    const destDir = path.join(publicMediaDir, repoName);
    let title = "";

    const lines = markdown.replace(/\r\n/g, "\n").split("\n");
    const kept: string[] = [];
    for (const line of lines) {
      // Drop the language-switcher line, e.g. "[English](README.md) · [Deutsch](README.de.md)"
      if (/\]\(README(\.[a-z]{2})?\.md\)/i.test(line) && /^\s*\[/.test(line)) continue;
      // Drop portfolio metadata comments, e.g. "<!-- portfolio:date=2022-07-01 -->"
      if (/^\s*<!--\s*portfolio:/i.test(line)) continue;
      // Capture & drop the first top-level H1 as the title
      const h1 = line.match(/^#\s+(.+?)\s*$/);
      if (h1 && !title) {
        title = h1[1].trim();
        continue;
      }
      kept.push(line);
    }
    let body = kept.join("\n").trim();

    // Download a repo-relative image into public/media and return its local URL.
    const localize = async (srcPath: string): Promise<string | null> => {
      if (/^https?:\/\//i.test(srcPath)) return null; // external — leave as-is
      const cleanPath = srcPath.replace(/^\.?\//, "");
      if (downloaded.has(cleanPath)) return downloaded.get(cleanPath)!;
      try {
        const meta = await githubFetch(
          `https://api.github.com/repos/${owner}/${repoName}/contents/${cleanPath}`
        );
        if (meta && meta.download_url) {
          fs.mkdirSync(destDir, { recursive: true });
          const buffer = await downloadFileToBuffer(meta.download_url);
          const savedName = await saveAndCompressImage(buffer, path.join(destDir, path.basename(cleanPath)));
          const localUrl = `/media/projects/${repoName}/${savedName}`;
          downloaded.set(cleanPath, localUrl);
          return localUrl;
        }
      } catch (e: any) {
        console.warn(`    Could not fetch README image ${cleanPath}:`, e.message);
      }
      return null;
    };

    // Collect image refs from both markdown ![](src) and HTML <img src="src">,
    // in document order, so the cover = the first image in the README.
    const refs: Array<{ src: string; index: number }> = [];
    let m: RegExpExecArray | null;
    const mdRe = /!\[[^\]]*\]\(([^)]+)\)/g;
    while ((m = mdRe.exec(body)) !== null) refs.push({ src: m[1].trim(), index: m.index });
    const htmlRe = /<img\b[^>]*?\ssrc=["']([^"']+)["'][^>]*>/gi;
    while ((m = htmlRe.exec(body)) !== null) refs.push({ src: m[1].trim(), index: m.index });
    refs.sort((a, b) => a.index - b.index);

    let coverUrl: string | null = null;
    const seen = new Set<string>();
    for (const ref of refs) {
      if (/^https?:\/\//i.test(ref.src)) {
        if (!coverUrl) coverUrl = ref.src;
        continue;
      }
      const local = await localize(ref.src);
      if (!local) continue;
      if (!coverUrl) coverUrl = local;
      if (!seen.has(ref.src)) {
        body = body.split(`(${ref.src})`).join(`(${local})`); // markdown
        body = body.split(`"${ref.src}"`).join(`"${local}"`).split(`'${ref.src}'`).join(`'${local}'`); // html
        seen.add(ref.src);
      }
    }

    return { title, body, coverUrl };
  };

  // Optional development-date override embedded in the README as an HTML comment:
  // "<!-- portfolio:date=2022-07-01 -->". Lets a repo created later than the
  // project was actually built report the real date.
  const parseDateOverride = (markdown: string): string | null => {
    const m = markdown.match(/<!--\s*portfolio:date=([0-9]{4}-[0-9]{2}-[0-9]{2})\s*-->/i);
    return m ? m[1] : null;
  };

  // Generate a branded title-card cover for projects whose README has no image,
  // so every card has a consistent visual. Returns the local cover URL.
  const esc = (s: string) =>
    String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const generateProjectCover = async (
    repoName: string,
    title: string,
    tags: string[]
  ): Promise<string> => {
    const destDir = path.join(publicMediaDir, repoName);
    fs.mkdirSync(destDir, { recursive: true });
    // Balance the title across one or two lines (split near the midpoint by
    // word, never dropping words).
    const words = title.split(/\s+/).filter(Boolean);
    let lines: string[] = [title];
    if (title.length > 20 && words.length > 1) {
      let best = 1;
      let bestDiff = Infinity;
      for (let i = 1; i < words.length; i++) {
        const a = words.slice(0, i).join(" ").length;
        const b = words.slice(i).join(" ").length;
        if (Math.abs(a - b) < bestDiff) {
          bestDiff = Math.abs(a - b);
          best = i;
        }
      }
      lines = [words.slice(0, best).join(" "), words.slice(best).join(" ")];
    }
    // Shrink the font for long lines so they always fit the 1104px-wide card.
    const longest = Math.max(...lines.map((l) => l.length));
    const fontSize = longest > 22 ? 52 : longest > 16 ? 62 : 72;
    const lineGap = Math.round(fontSize * 1.25);
    const titleY = lines.length > 1 ? 470 : 510;
    const titleSvg = lines
      .map(
        (l, i) =>
          `<tspan x="600" dy="${i === 0 ? 0 : lineGap}">${esc(l)}</tspan>`
      )
      .join("");
    const techLine = esc(tags.slice(0, 4).join("  ·  "));
    const techY = titleY + (lines.length > 1 ? lineGap + 90 : 110);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#1d1d23"/><stop offset="100%" stop-color="#0e0e12"/>
  </linearGradient></defs>
  <rect width="1200" height="900" fill="url(#g)"/>
  <rect x="48" y="48" width="1104" height="804" rx="24" fill="none" stroke="#ffffff14" stroke-width="2"/>
  <g transform="translate(540, 250) scale(7)">
    <polyline points="4 17 10 11 4 5" fill="none" stroke="#ffffff55" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="12" y1="19" x2="20" y2="19" stroke="#ffffff55" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <text x="600" y="${titleY}" text-anchor="middle" font-family="-apple-system, 'Segoe UI', sans-serif" font-size="${fontSize}" font-weight="700" fill="#FAFAFA">${titleSvg}</text>
  <text x="600" y="${techY}" text-anchor="middle" font-family="-apple-system, 'Segoe UI', sans-serif" font-size="28" font-weight="500" fill="#ffffff66" letter-spacing="1">${techLine}</text>
</svg>`;
    const out = path.join(destDir, "cover.webp");
    await sharp(Buffer.from(svg)).webp({ quality: 90 }).toFile(out);
    return `/media/projects/${repoName}/cover.webp`;
  };

  // ─── 0. FETCH ALL REPOS FROM GITHUB (used for both config and projects) ──────
  let allRepos: any[] = [];
  try {
    console.log("Fetching repositories from GitHub...");
    if (GITHUB_TOKEN) {
      try {
        allRepos = await githubFetch("https://api.github.com/user/repos?per_page=100&type=all");
      } catch {
        if (GITHUB_USERNAME) {
          console.warn("  /user/repos returned an error (token may be scoped to this repo only). Falling back to public endpoint.");
          allRepos = await githubFetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100`);
        } else {
          console.warn("  /user/repos returned an error and no GITHUB_USER is set for the public fallback.");
        }
      }
    } else if (GITHUB_USERNAME) {
      allRepos = await githubFetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100`);
    } else {
      console.warn("  No GITHUB_TOKEN and no GITHUB_USER set — cannot list repositories.");
    }
    console.log(`  Fetched ${allRepos.length} repositories.`);
  } catch (err: any) {
    console.warn("Could not fetch repositories from GitHub. Using local fallback only.", err.message);
  }

  // Resolve the authenticated user's login from /user (the reliable owner
  // identity for the token). Deriving it from the repo list is wrong when the
  // account has collaborator repos owned by others. An explicit GITHUB_USER /
  // NEXT_PUBLIC_GITHUB_USERNAME still takes precedence.
  if (!GITHUB_USERNAME && GITHUB_TOKEN) {
    try {
      const me = await githubFetch("https://api.github.com/user");
      GITHUB_USERNAME = me?.login || "";
      if (GITHUB_USERNAME) {
        console.log(`  Authenticated GitHub user: ${GITHUB_USERNAME}`);
      }
    } catch {
      console.warn("  Could not resolve authenticated user from /user.");
    }
  }

  // Keep only repos owned by this user — collaborator repos (e.g. group
  // assignments) that happen to carry the topic should not appear.
  if (GITHUB_USERNAME) {
    allRepos = allRepos.filter((r) => r.owner?.login === GITHUB_USERNAME);
    console.log(`  ${allRepos.length} repositories owned by ${GITHUB_USERNAME}.`);
  }

  // ─── 1. FETCH CONFIG FROM GITHUB OR LOCAL ──────────────────────────────────
  console.log("Checking portfolio configuration (resume.json, profile image, PDF)...");

  let resumeConfigFetched = false;
  let siteConfigFetched = false;
  const localConfigDir = path.join(rootDir, "config");

  // Demo mode: serve the committed template dataset under demo/ so a public live
  // demo (no secrets) renders a full, realistic site. Triggers on an explicit
  // PORTFOLIO_DEMO flag, or automatically on a clean clone (no token AND no repos
  // discovered). A real build (token present, or a config repo / public repos
  // found) never enters demo mode.
  const demoDir = path.join(rootDir, "demo");
  const DEMO_MODE =
    !!process.env.PORTFOLIO_DEMO || (!GITHUB_TOKEN && allRepos.length === 0);
  if (DEMO_MODE) {
    console.log("DEMO MODE — using bundled template dataset under demo/ (no GitHub data).");
    const demoSiteConfig = path.join(demoDir, "site.config.json");
    if (fs.existsSync(demoSiteConfig)) {
      fs.copyFileSync(demoSiteConfig, outputSiteConfigPath);
      siteConfigFetched = true;
    }
    const demoResume = path.join(demoDir, "resume.json");
    if (fs.existsSync(demoResume)) {
      fs.copyFileSync(demoResume, outputResumePath);
      resumeConfigFetched = true;
    }
    const demoAvatar = path.join(demoDir, "profile.webp");
    if (fs.existsSync(demoAvatar)) {
      fs.mkdirSync(path.dirname(outputAvatarPath), { recursive: true });
      fs.copyFileSync(demoAvatar, outputAvatarPath);
    }
  }

  // Resolve config repo: explicit env var overrides auto-detection.
  // Auto-detection: find the repo tagged with the "portfolio-config" topic.
  let configRepoName: string | null = DEMO_MODE ? null : PORTFOLIO_CONFIG_REPO || null;
  if (!DEMO_MODE && !configRepoName && allRepos.length > 0) {
    const autoDetected = allRepos.find(
      (r) => r.topics && r.topics.includes("portfolio-config")
    );
    if (autoDetected) {
      configRepoName = autoDetected.name;
      console.log(`  Auto-detected config repository: ${configRepoName} (topic: portfolio-config)`);
    }
  }

  if (configRepoName) {
    try {
      console.log(`Fetching configuration from remote repository: ${GITHUB_USERNAME}/${configRepoName}...`);

      const contents = await githubFetch(
        `https://api.github.com/repos/${GITHUB_USERNAME}/${configRepoName}/contents/.portfolio`
      ).catch(() => null);

      if (contents && Array.isArray(contents)) {
        const siteConfigFile = contents.find((c) => c.name === "site.config.json");
        if (siteConfigFile) {
          console.log("  Fetching remote site.config.json...");
          const cfgRaw = await githubFetch(siteConfigFile.url);
          const cfgString = Buffer.from(cfgRaw.content, "base64").toString("utf8");
          JSON.parse(cfgString); // validate JSON
          fs.writeFileSync(outputSiteConfigPath, cfgString, "utf8");
          siteConfigFetched = true;
          console.log("    ✓ Successfully synced remote site.config.json");
        }

        const resumeFile = contents.find((c) => c.name === "resume.json");
        if (resumeFile) {
          console.log("  Fetching remote resume.json...");
          const resumeRaw = await githubFetch(resumeFile.url);
          const resumeString = Buffer.from(resumeRaw.content, "base64").toString("utf8");
          JSON.parse(resumeString); // validate JSON
          fs.writeFileSync(outputResumePath, resumeString, "utf8");
          resumeConfigFetched = true;
          console.log("    ✓ Successfully synced remote resume.json");
        }

        const profileFile = contents.find((c) => c.name.startsWith("profile."));
        if (profileFile && profileFile.download_url) {
          console.log("  Downloading remote profile image...");
          const buffer = await downloadFileToBuffer(profileFile.download_url);
          const imagesDir = path.dirname(outputAvatarPath);
          if (!fs.existsSync(imagesDir)) {
            fs.mkdirSync(imagesDir, { recursive: true });
          }
          const ext = path.extname(profileFile.name).toLowerCase();
          if (ext === ".png" || ext === ".jpg" || ext === ".jpeg") {
            await sharp(buffer).webp({ quality: 90 }).toFile(outputAvatarPath);
            console.log("    ✓ Converted and saved profile image as profile.webp");
          } else {
            fs.writeFileSync(outputAvatarPath, buffer);
            console.log("    ✓ Saved profile image");
          }
        }

        const pdfFile = contents.find((c) => c.name === "resume.pdf");
        if (pdfFile && pdfFile.download_url) {
          console.log("  Downloading remote resume.pdf...");
          const buffer = await downloadFileToBuffer(pdfFile.download_url);
          const mediaDir = path.dirname(outputPdfPath);
          if (!fs.existsSync(mediaDir)) {
            fs.mkdirSync(mediaDir, { recursive: true });
          }
          fs.writeFileSync(outputPdfPath, buffer);
          console.log("    ✓ Successfully downloaded resume.pdf");
        }
      }
    } catch (err: any) {
      console.warn("  Failed to fetch configuration from GitHub. Checking local fallbacks...", err.message);
    }
  }

  if (!resumeConfigFetched && fs.existsSync(localConfigDir)) {
    console.log(`Checking local configuration files in ${localConfigDir}...`);

    const localResume = path.join(localConfigDir, "resume.json");
    if (fs.existsSync(localResume)) {
      fs.copyFileSync(localResume, outputResumePath);
      resumeConfigFetched = true;
      console.log("  ✓ Loaded resume.json from local config folder");
    }

    const localFiles = fs.readdirSync(localConfigDir);
    const localProfileFile = localFiles.find((f) => f.startsWith("profile."));
    if (localProfileFile) {
      const srcPath = path.join(localConfigDir, localProfileFile);
      const buffer = fs.readFileSync(srcPath);
      const imagesDir = path.dirname(outputAvatarPath);
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
      }
      const ext = path.extname(localProfileFile).toLowerCase();
      if (ext === ".png" || ext === ".jpg" || ext === ".jpeg") {
        await sharp(buffer).webp({ quality: 90 }).toFile(outputAvatarPath);
        console.log("  ✓ Converted and saved local profile image as profile.webp");
      } else {
        fs.writeFileSync(outputAvatarPath, buffer);
        console.log("  ✓ Copied local profile image");
      }
    }

    const localPdf = path.join(localConfigDir, "resume.pdf");
    if (fs.existsSync(localPdf)) {
      const mediaDir = path.dirname(outputPdfPath);
      if (!fs.existsSync(mediaDir)) {
        fs.mkdirSync(mediaDir, { recursive: true });
      }
      fs.copyFileSync(localPdf, outputPdfPath);
      console.log("  ✓ Copied resume.pdf from local config folder");
    }
  }

  // Local site.config.json fallback — independent of resume so an offline/local
  // override works even when the resume came from the config repo.
  const localSiteConfig = path.join(localConfigDir, "site.config.json");
  if (!siteConfigFetched && fs.existsSync(localSiteConfig)) {
    fs.copyFileSync(localSiteConfig, outputSiteConfigPath);
    siteConfigFetched = true;
    console.log("  ✓ Loaded site.config.json from local config folder");
  }

  // Guarantee a usable site.config.json exists for the Next.js build. The
  // committed example is the last-resort fallback so a clean clone always builds
  // (with placeholder identity) even without a config repo or local config.
  if (!siteConfigFetched) {
    if (fs.existsSync(exampleSiteConfigPath)) {
      fs.copyFileSync(exampleSiteConfigPath, outputSiteConfigPath);
      console.log("  ✓ Using config/site.config.example.json (no remote/local config found)");
    } else if (!fs.existsSync(outputSiteConfigPath)) {
      console.warn("  No site.config found and no example available — writing minimal defaults.");
      fs.writeFileSync(outputSiteConfigPath, JSON.stringify({ person: {}, site: {}, legal: {}, contact: {} }, null, 2), "utf8");
    }
  }

  // Guarantee a profile image exists so the hero and resume pages always render.
  // Falls back to the committed generic placeholder when no avatar was provided.
  if (!fs.existsSync(outputAvatarPath) && fs.existsSync(placeholderAvatarPath)) {
    const imagesDir = path.dirname(outputAvatarPath);
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }
    fs.copyFileSync(placeholderAvatarPath, outputAvatarPath);
    console.log("  ✓ Using generic placeholder for profile.webp (no avatar provided)");
  }

  // Generate the Open Graph share image from the resolved config so it always
  // matches the deployed identity (no personal name baked into the template).
  try {
    const cfg = JSON.parse(fs.readFileSync(outputSiteConfigPath, "utf8"));
    const esc = (s: string) =>
      String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const ogName = esc(cfg.person?.fullName || "Portfolio");
    const ogTagline = esc(cfg.person?.headline || "Software Developer Portfolio");
    const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#19191F"/>
  <rect x="36" y="36" width="1128" height="558" rx="20" fill="none" stroke="#ffffff18" stroke-width="1.5"/>
  <g transform="translate(490, 130) scale(9.17)">
    <polyline points="4 17 10 11 4 5" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="12" y1="19" x2="20" y2="19" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <text x="600" y="430" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="62" font-weight="700" fill="#FAFAFA" letter-spacing="-1">${ogName}</text>
  <text x="600" y="505" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="30" font-weight="400" fill="#ffffff60" letter-spacing="0.5">${ogTagline}</text>
</svg>`;
    const ogOut = path.join(rootDir, "public", "og-software.png");
    await sharp(Buffer.from(ogSvg)).resize(1200, 630).png({ compressionLevel: 9 }).toFile(ogOut);
    console.log("  ✓ Generated public/og-software.png from site config");
  } catch (e: any) {
    console.warn("  Could not generate OG image:", e.message);
  }

  if (!fs.existsSync(outputResumePath)) {
    console.warn(`resume.json not found. Initializing with empty defaults.`);
    const defaultResume = {
      basics: {
        name: "Developer Portfolio",
        headline: "Software Engineer",
        email: "",
        location: "",
        url: { label: "", href: "" },
      },
      sections: {
        summary: { name: "Summary", visible: true, content: "" },
        education: { name: "Education", visible: true, items: [] },
        experience: { name: "Experience", visible: true, items: [] },
        skills: { name: "Skills", visible: true, items: [] },
        languages: { name: "Languages", visible: true, items: [] },
      },
    };
    fs.writeFileSync(outputResumePath, JSON.stringify(defaultResume, null, 2), "utf8");
  }

  const projectsMap: Record<string, SoftwareProject> = {};

  // ─── 1. LOAD LOCAL PROJECTS ───────────────────────────────────────────────
  // In demo mode the bundled demo/projects tree is the source; otherwise the
  // optional projects-local/ folder is used for hand-authored local projects.
  const effectiveLocalProjectsDir = DEMO_MODE
    ? path.join(demoDir, "projects")
    : localProjectsDir;
  if (fs.existsSync(effectiveLocalProjectsDir)) {
    const localDirs = fs.readdirSync(effectiveLocalProjectsDir);
    for (const dirName of localDirs) {
      const projPath = path.join(effectiveLocalProjectsDir, dirName);
      if (!fs.statSync(projPath).isDirectory()) continue;

      const portfolioPath = path.join(projPath, ".portfolio");
      const metadataPath = path.join(portfolioPath, "metadata.json");
      if (!fs.existsSync(metadataPath)) continue;

      console.log(`Loading local project: ${dirName}...`);

      try {
        const metadata: ProjectMetadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
        const slug = dirName;

        // Read English description
        const enAboutPath = path.join(portfolioPath, "about.en.md");
        const longDescription = fs.existsSync(enAboutPath)
          ? fs.readFileSync(enAboutPath, "utf8")
          : "";

        // Read German description (falls back to English if absent or empty)
        const deAboutPath = path.join(portfolioPath, "about.de.md");
        const deContent = fs.existsSync(deAboutPath) ? fs.readFileSync(deAboutPath, "utf8").trim() : "";
        const longDescriptionDe = deContent.length > 0 ? deContent : undefined;

        const projectDestMediaDir = path.join(publicMediaDir, dirName);
        fs.mkdirSync(projectDestMediaDir, { recursive: true });

        // Copy cover image if exists and compress if needed
        const coverFiles = fs.readdirSync(portfolioPath).filter(f => f.startsWith("cover."));
        if (coverFiles.length > 0) {
          const srcPath = path.join(portfolioPath, coverFiles[0]);
          const buffer = fs.readFileSync(srcPath);
          const destPath = path.join(projectDestMediaDir, coverFiles[0]);
          await saveAndCompressImage(buffer, destPath);
        }

        // Copy gallery if exists and compress if needed
        const gallerySrcDir = path.join(portfolioPath, "gallery");
        if (fs.existsSync(gallerySrcDir)) {
          const galleryDestDir = path.join(projectDestMediaDir, "gallery");
          fs.mkdirSync(galleryDestDir, { recursive: true });
          const galleryFiles = fs.readdirSync(gallerySrcDir);
          for (const file of galleryFiles) {
            const srcPath = path.join(gallerySrcDir, file);
            const buffer = fs.readFileSync(srcPath);
            const destPath = path.join(galleryDestDir, file);
            await saveAndCompressImage(buffer, destPath);
          }
        }

        // Add to map
        projectsMap[slug] = {
          id: slug,
          slug: slug,
          title: metadata.title,
          titleDe: metadata.titleDe,
          description: metadata.description || "",
          descriptionDe: metadata.descriptionDe,
          longDescription,
          longDescriptionDe,
          projectType: metadata.projectType,
          projectTypeDe: metadata.projectTypeDe,
          developedAt: metadata.developedAt,
          liveUrl: metadata.liveUrl || undefined,
          repoUrl: metadata.publishLink ? (metadata.repoUrl || undefined) : undefined,
          tags: metadata.tags,
          coverImage: null,
          gallery: null,
          _weight: metadata.weight || 1,
          _languages: (metadata as any).languages || {},
        };
      } catch (err: any) {
        console.error(`Error loading local project ${dirName}:`, err.message);
      }
    }
  }

  // ─── 2. SYNC PROJECTS FROM GITHUB ────────────────────────────────────────
  // A repo opts in via the "portfolio" (linked) or "portfolio-private" (no code
  // link) topic. Everything is derived from GitHub-native data — no per-repo
  // metadata files. The localized README is the project detail (images inline);
  // the repo description is the card overview; topics are the tags.
  try {
    const portfolioRepos = DEMO_MODE
      ? []
      : allRepos.filter(
          (repo) =>
            repo.topics &&
            (repo.topics.includes(TOPIC_LINKED) || repo.topics.includes(TOPIC_UNLINKED))
        );

    console.log(`Found ${portfolioRepos.length} portfolio repositories (topics: ${TOPIC_LINKED}, ${TOPIC_UNLINKED}).`);

    for (const repo of portfolioRepos) {
      const repoName = repo.name;
      const owner = repo.owner.login;
      const slug = repoName.toLowerCase();
      const linked = (repo.topics || []).includes(TOPIC_LINKED);
      console.log(`Syncing repository: ${repoName} (${linked ? "linked" : "no link"})...`);

      try {
        // Fetch the localized READMEs (de falls back to en).
        const enReadme = await fetchRepoText(owner, repoName, "README.md");
        const deReadme =
          (await fetchRepoText(owner, repoName, "README.de.md")) || enReadme;

        // Process: strip switcher + H1, download images, rewrite paths.
        const downloaded = new Map<string, string>();
        const en = enReadme
          ? await processReadme(enReadme, owner, repoName, downloaded)
          : { title: "", body: "", coverUrl: null };
        const de = deReadme
          ? await processReadme(deReadme, owner, repoName, downloaded)
          : en;

        // Tags from topics (minus control topics), mapped to nice display names.
        const topicTags = (repo.topics || []).filter((t: string) => !CONTROL_TOPICS.has(t));
        const tags = topicTags.map(displayTag);

        // Fetch languages (for skill scoring).
        let languages: Record<string, number> = {};
        try {
          languages = await githubFetch(
            `https://api.github.com/repos/${owner}/${repoName}/languages`
          );
        } catch (e: any) {
          console.warn(`  Warning: Could not fetch languages for ${repoName}:`, e.message);
        }

        const title = en.title || prettifyRepoName(repoName);

        projectsMap[slug] = {
          id: slug,
          slug,
          title,
          titleDe: de.title || undefined,
          description: repo.description || "",
          descriptionDe: repo.description || "",
          longDescription: en.body,
          longDescriptionDe: de.body,
          projectType: repo.language || "Software Project",
          developedAt: parseDateOverride(enReadme || "") || repo.created_at,
          liveUrl: repo.homepage || undefined,
          // The control topic — not repo visibility — decides whether to link.
          repoUrl: linked ? repo.html_url : undefined,
          tags,
          coverImage: null,
          gallery: null,
          _weight: computeEffectiveWeight(1, repo),
          _languages: languages,
          _coverUrl: en.coverUrl || de.coverUrl || undefined,
          _topicTags: topicTags,
        };

        // No screenshot in the README → generate a branded title-card cover.
        if (!projectsMap[slug]._coverUrl) {
          projectsMap[slug]._coverUrl = await generateProjectCover(repoName, title, tags);
        }

        console.log(`  ✓ Successfully synced ${repoName} (${tags.length} tags, cover=${en.coverUrl || de.coverUrl ? "screenshot" : "generated"})`);
      } catch (err: any) {
        console.error(`  Error syncing repository ${repoName}:`, err.message);
      }
    }
  } catch (err: any) {
    console.warn("Could not fetch from GitHub (offline or invalid token). Using local fallback.", err.message);
  }

  // Final pass to build the actual coverImage and gallery objects
  const finalProjectsList: SoftwareProject[] = [];

  for (const slug of Object.keys(projectsMap)) {
    const project = projectsMap[slug];
    const projectDestMediaDir = path.join(publicMediaDir, project.slug);

    let repoName = project.slug;
    if (!fs.existsSync(projectDestMediaDir)) {
      const dirs = fs.existsSync(publicMediaDir) ? fs.readdirSync(publicMediaDir) : [];
      const matchedDir = dirs.find((d) => d.toLowerCase() === project.slug.toLowerCase());
      if (matchedDir) {
        repoName = matchedDir;
      }
    }

    const actualMediaDir = path.join(publicMediaDir, repoName);

    // Cover image: prefer the first README image (GitHub projects); fall back to
    // a cover.* file (local projects).
    const coverUrl = project._coverUrl;
    if (coverUrl) {
      const coverFsPath = path.join(rootDir, "public", coverUrl.replace(/^\//, ""));
      let width = 1200;
      let height = 900;
      let sizeKb: number | null = null;
      if (fs.existsSync(coverFsPath)) {
        sizeKb = Math.round(fs.statSync(coverFsPath).size / 1024);
        try {
          const meta = await sharp(coverFsPath).metadata();
          if (meta.width && meta.height) {
            width = meta.width;
            height = meta.height;
          }
        } catch {
          /* svg without intrinsic size — keep defaults */
        }
      }
      project.coverImage = {
        id: coverUrl.toLowerCase().endsWith(".svg") ? "cover-icon" : "cover",
        url: coverUrl,
        alternativeText: `${project.title} Cover`,
        width,
        height,
        size: sizeKb,
      };
    } else if (fs.existsSync(actualMediaDir)) {
      const files = fs.readdirSync(actualMediaDir);
      const coverFile = files.find((f) => f.startsWith("cover."));
      if (coverFile) {
        const coverPath = path.join(actualMediaDir, coverFile);
        const stats = fs.statSync(coverPath);
        project.coverImage = {
          id: "cover",
          url: `/media/projects/${repoName}/${coverFile}`,
          alternativeText: `${project.title} Cover`,
          width: 1200,
          height: 900,
          size: Math.round(stats.size / 1024),
        };
      }
    }

    // Gallery resolution (local projects only — GitHub projects render images
    // inline in the README body, not as a separate gallery).
    const galleryDir = path.join(actualMediaDir, "gallery");
    if (!coverUrl && fs.existsSync(galleryDir)) {
      const files = fs.readdirSync(galleryDir);
      project.gallery = files.map((filename, index) => {
        const filePath = path.join(galleryDir, filename);
        const stats = fs.statSync(filePath);
        return {
          id: `gallery_${index}`,
          url: `/media/projects/${repoName}/gallery/${filename}`,
          alternativeText: `${project.title} Gallery Image ${index + 1}`,
          width: 1200,
          height: 900,
          size: Math.round(stats.size / 1024),
        };
      });
    }

    // Categories this project spans (from its tags' registry categories),
    // ordered by the CATEGORIES map — used by the front-end filter.
    const catSet = new Set<string>();
    for (const tag of project.tags || []) {
      const hit = registryByNorm[normalizeTech(tag)];
      if (hit?.detail.category) catSet.add(hit.detail.category);
    }
    project.categories = Object.keys(CATEGORIES).filter((c) => catSet.has(c));

    project.localizations = [
      { id: project.slug, slug: project.slug, locale: "en" },
      { id: project.slug, slug: project.slug, locale: "de" },
    ];

    finalProjectsList.push(project);
  }

  // Sort projects by developedAt descending
  finalProjectsList.sort((a, b) => {
    const dateA = a.developedAt ? new Date(a.developedAt).getTime() : 0;
    const dateB = b.developedAt ? new Date(b.developedAt).getTime() : 0;
    return dateB - dateA;
  });

  // Save projects.json — strip internal build-only keys (kept in memory for skills)
  const cleanProjectsList = finalProjectsList.map(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ({ _weight, _languages, _coverUrl, _topicTags, ...rest }) => rest
  );
  const dataDir = path.dirname(outputProjectsPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(outputProjectsPath, JSON.stringify(cleanProjectsList, null, 2), "utf8");
  console.log(`Saved ${cleanProjectsList.length} projects to ${outputProjectsPath}`);

  // ─── 4. AGGREGATE SKILLS & CALCULATE LEVELS ───────────────────────────────
  console.log("Aggregating skills levels...");
  const skillScores: Record<string, number> = {};
  // Richer per-skill signals for relevance ranking (deeper than the 1-5 level):
  //  - projectCount: breadth — how many distinct projects use it
  //  - lastUsed: recency — the most recent project's dev date (ms epoch)
  const skillProjectCount: Record<string, number> = {};
  const skillLastUsed: Record<string, number> = {};
  const noteSkillUse = (key: string, devISO?: string) => {
    skillProjectCount[key] = (skillProjectCount[key] || 0) + 1;
    const ts = devISO ? Date.parse(devISO) : NaN;
    if (!Number.isNaN(ts) && ts > (skillLastUsed[key] || 0)) {
      skillLastUsed[key] = ts;
    }
  };

  // Custom language name mappings from GitHub to registry keys
  const languageMappings: Record<string, string> = {
    hcl: "terraform",
    shell: "shell scripting",
    dockerfile: "docker",
  };

  for (const project of finalProjectsList) {
    const weight = project._weight || 1;
    const projectLanguages = project._languages || {};

    // Calculate total language bytes
    const totalBytes = Object.values(projectLanguages).reduce(
      (sum: number, b: any) => sum + b,
      0
    ) as number;

    const processedKeys = new Set<string>();

    if (totalBytes > 0) {
      for (const [langName, bytes] of Object.entries(projectLanguages)) {
        const percentage = bytes / totalBytes;
        // Ignore languages representing less than 5% of the codebase
        if (percentage < 0.05) continue;

        const cleanLang = langName.trim().toLowerCase();
        const mapped = languageMappings[cleanLang] || cleanLang;
        const hit = registryByNorm[normalizeTech(mapped)];

        if (hit) {
          const scoreContribution = percentage * weight;
          skillScores[hit.key] = (skillScores[hit.key] || 0) + scoreContribution;
          processedKeys.add(hit.key);
          noteSkillUse(hit.key, project.developedAt);

          // Surface the language as a tag if not already present
          if (!project.tags.includes(hit.detail.name)) {
            project.tags.push(hit.detail.name);
          }
        }
      }
    }

    // Process all other tags (frameworks, libraries, tools). Skip ones already
    // counted as a language above to avoid double counting.
    for (const tag of project.tags) {
      const hit = registryByNorm[normalizeTech(tag)];
      if (!hit) {
        console.warn(`  Note: Tag "${tag}" (in "${project.title}") has no tech-registry entry — shown as a plain tag, no icon/score.`);
        continue;
      }
      if (processedKeys.has(hit.key)) continue;
      // Frameworks/libraries get full weight contribution
      skillScores[hit.key] = (skillScores[hit.key] || 0) + weight;
      processedKeys.add(hit.key);
      noteSkillUse(hit.key, project.developedAt);
    }
  }

  // Map scores to skill levels (1-5) and group by category
  const skillsByCategory: Record<string, any[]> = {
    frontend: [],
    backend: [],
    mobile: [],
    devops: [],
    ai: [],
  };

  // Continuous relevance score per skill, used purely to rank within a category
  // and cap it at the top N. Intentionally richer than the 1-5 `level`: it blends
  // depth of use (the existing summed score), breadth (distinct project count),
  // and recency (exponential decay on how long ago it was last used).
  const skillRelevance: Record<string, number> = {};
  const nowMs = Date.now();
  const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;
  const computeRelevance = (key: string, finalScore: number) => {
    const breadth = skillProjectCount[key] || 0;
    const last = skillLastUsed[key];
    const ageYears = last ? (nowMs - last) / YEAR_MS : 6; // unknown date → treat as old
    const recency = Math.exp(-Math.max(0, ageYears) / 2); // ~1.4yr half-life, 0..1
    return finalScore * 1.0 + breadth * 1.5 + recency * 2.0;
  };

  for (const [techKey, score] of Object.entries(skillScores)) {
    const registryEntry = techRegistry[techKey];
    if (!registryEntry) continue;

    // Apply base score if defined in tech registry
    const baseScore = registryEntry.baseScore || 0;
    const finalScore = score + baseScore;

    // Calculate level based on score threshold
    let level = 1;
    if (finalScore >= 6) level = 5;
    else if (finalScore >= 4) level = 4;
    else if (finalScore >= 3) level = 3;
    else if (finalScore >= 2) level = 2;

    // Apply manual level override if defined in tech registry
    if (registryEntry.levelOverride !== undefined) {
      level = registryEntry.levelOverride;
    }

    skillRelevance[techKey] = computeRelevance(techKey, finalScore);

    // Skip skills with no icon — they'd render as blank tiles in the grid.
    // They still contributed to scoring above; just omit them from the output.
    if (!registryEntry.iconClassName) {
      continue;
    }

    const skillObj = {
      id: techKey,
      name: registryEntry.name,
      iconClassName: registryEntry.iconClassName,
      level,
      url: registryEntry.url || "",
    };

    const category = registryEntry.category.toLowerCase();
    if (skillsByCategory[category]) {
      skillsByCategory[category].push(skillObj);
    } else {
      console.warn(`  Warning: Category "${category}" for tech "${techKey}" is not a recognized category.`);
      skillsByCategory.backend.push(skillObj);
    }
  }

  // Keep each category from growing unbounded as more projects are added: rank by
  // the detailed relevance score and surface only the most relevant ones.
  const MAX_SKILLS_PER_CATEGORY = 12; // 6 rows in the 2-column grid

  // Construct final categories list and sort them
  const finalCategories = Object.keys(CATEGORIES).map((catKey) => {
    const catMeta = CATEGORIES[catKey];
    const skills = skillsByCategory[catKey] || [];

    // Sort by relevance desc, then level desc, then name — and cap at the top N.
    skills.sort((a, b) => {
      const ra = skillRelevance[a.id] || 0;
      const rb = skillRelevance[b.id] || 0;
      if (rb !== ra) return rb - ra;
      if (b.level !== a.level) return b.level - a.level;
      return a.name.localeCompare(b.name);
    });
    const topSkills = skills.slice(0, MAX_SKILLS_PER_CATEGORY);

    return {
      id: catKey,
      name: catMeta.name,
      order: catMeta.order,
      skills: topSkills,
    };
  });

  // Sort categories by order asc
  finalCategories.sort((a, b) => a.order - b.order);

  fs.writeFileSync(outputSkillsPath, JSON.stringify(finalCategories, null, 2), "utf8");
  console.log(`Saved aggregated skills to ${outputSkillsPath}`);
  console.log("Portfolio synchronization completed successfully!");
};

main().catch((err) => {
  console.error("Fatal error during synchronization:", err);
  process.exit(1);
});
