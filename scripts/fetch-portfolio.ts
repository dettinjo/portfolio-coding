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
  coverImage: any | null;
  gallery: any[] | null;
  localizations?: Array<{
    id: string;
    slug: string;
    locale: string;
  }>;
  _weight?: number; // Internal use during build
  _languages?: Record<string, number>; // Internal use during build
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

// Synthesize project metadata from the GitHub repo object when a repo has the
// "portfolio" topic but no curated .portfolio/metadata.json (topic-only setup).
const synthesizeMetadata = (repo: any): ProjectMetadata => ({
  title: prettifyRepoName(repo.name),
  description: repo.description || "",
  projectType: repo.language || "Software Project",
  developedAt: repo.created_at,
  weight: 1,
  // Public repos link to source; private repos show description only.
  publishLink: !repo.private,
  liveUrl: repo.homepage || null,
  repoUrl: repo.private ? null : repo.html_url,
  tags: (repo.topics || []).filter(
    (t: string) => t !== "portfolio" && t !== "portfolio-config"
  ),
});

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

  // Resolve config repo: explicit env var overrides auto-detection.
  // Auto-detection: find the repo tagged with the "portfolio-config" topic.
  let configRepoName: string | null = PORTFOLIO_CONFIG_REPO || null;
  if (!configRepoName && allRepos.length > 0) {
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
  if (fs.existsSync(localProjectsDir)) {
    const localDirs = fs.readdirSync(localProjectsDir);
    for (const dirName of localDirs) {
      const projPath = path.join(localProjectsDir, dirName);
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
  try {
    // Use the repo list fetched in section 0 — no second API call needed.
    const portfolioRepos = allRepos.filter(
      (repo) => repo.topics && repo.topics.includes("portfolio")
    );

    console.log(`Found ${portfolioRepos.length} repositories matching the topic "portfolio".`);

    for (const repo of portfolioRepos) {
      const repoName = repo.name;
      const slug = repoName.toLowerCase();
      console.log(`Syncing repository: ${repoName}...`);

      try {
        // .portfolio/ is optional. When present it curates the project; when
        // absent the project is synthesized from the repo (topic-only setup).
        const contents = await githubFetch(
          `https://api.github.com/repos/${repo.owner.login}/${repoName}/contents/.portfolio`
        ).catch(() => null);
        const hasFolder = Array.isArray(contents);

        // Find file details (only meaningful when a .portfolio/ folder exists)
        const metadataFile = hasFolder ? contents.find((c) => c.name === "metadata.json") : null;
        const enAboutFile = hasFolder ? contents.find((c) => c.name === "about.en.md") : null;
        const deAboutFile = hasFolder ? contents.find((c) => c.name === "about.de.md") : null;
        const coverFile = hasFolder ? contents.find((c) => c.name.startsWith("cover.")) : null;
        const galleryDir = hasFolder ? contents.find((c) => c.name === "gallery" && c.type === "dir") : null;

        // Resolve metadata: curated metadata.json if present, otherwise
        // synthesized from the GitHub repo object.
        let metadata: ProjectMetadata;
        if (metadataFile) {
          const metadataRaw = await githubFetch(metadataFile.url);
          const metadataString = Buffer.from(metadataRaw.content, "base64").toString("utf8");
          metadata = JSON.parse(metadataString);
        } else {
          metadata = synthesizeMetadata(repo);
          console.log(`  ${repoName}: no .portfolio/metadata.json — using repo metadata (topic-only).`);
        }

        // Fetch English description
        let longDescription = "";
        if (enAboutFile) {
          const enAboutRaw = await githubFetch(enAboutFile.url);
          longDescription = Buffer.from(enAboutRaw.content, "base64").toString("utf8");
        }

        // Fetch German description (optional)
        let longDescriptionDe: string | undefined;
        if (deAboutFile) {
          const deAboutRaw = await githubFetch(deAboutFile.url);
          longDescriptionDe = Buffer.from(deAboutRaw.content, "base64").toString("utf8");
        }

        const projectDestMediaDir = path.join(publicMediaDir, repoName);
        fs.mkdirSync(projectDestMediaDir, { recursive: true });

        // Download cover image
        if (coverFile && coverFile.download_url) {
          const ext = path.extname(coverFile.name);
          const destCoverPath = path.join(projectDestMediaDir, `cover${ext}`);
          const buffer = await downloadFileToBuffer(coverFile.download_url);
          await saveAndCompressImage(buffer, destCoverPath);
        }

        // Download gallery files
        if (galleryDir) {
          const galleryContents = await githubFetch(galleryDir.url);
          if (Array.isArray(galleryContents)) {
            const galleryDestDir = path.join(projectDestMediaDir, "gallery");
            fs.mkdirSync(galleryDestDir, { recursive: true });

            for (const item of galleryContents) {
              if (item.type === "file" && item.download_url) {
                const destPath = path.join(galleryDestDir, item.name);
                const buffer = await downloadFileToBuffer(item.download_url);
                await saveAndCompressImage(buffer, destPath);
              }
            }
          }
        }

        // Fetch languages
        let languages: Record<string, number> = {};
        try {
          languages = await githubFetch(
            `https://api.github.com/repos/${repo.owner.login}/${repoName}/languages`
          );
        } catch (e: any) {
          console.warn(`  Warning: Could not fetch languages for ${repoName}:`, e.message);
        }

        // Add or overwrite the project in maps
        projectsMap[slug] = {
          id: slug,
          slug: slug,
          title: metadata.title || repoName,
          titleDe: metadata.titleDe,
          description: metadata.description || repo.description || "",
          descriptionDe: metadata.descriptionDe,
          longDescription,
          longDescriptionDe,
          projectTypeDe: metadata.projectTypeDe,
          projectType: metadata.projectType || repo.language || "Software Project",
          developedAt: metadata.developedAt || repo.created_at,
          liveUrl: metadata.liveUrl || repo.homepage || undefined,
          repoUrl: metadata.publishLink && !repo.private ? (metadata.repoUrl || repo.html_url) : undefined,
          tags:
            metadata.tags && metadata.tags.length > 0
              ? metadata.tags
              : (repo.topics || []).filter(
                  (t: string) => t !== "portfolio" && t !== "portfolio-config"
                ),
          coverImage: null,
          gallery: null,
          _weight: computeEffectiveWeight(metadata.weight || 1, repo),
          _languages: languages,
        };

        // Note: If private repository or publishLink is false, suppress the repo URL
        if (repo.private || !metadata.publishLink) {
          projectsMap[slug].repoUrl = undefined;
        }

        console.log(`  ✓ Successfully synced ${repoName}`);
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

    // Cover Image resolution
    if (fs.existsSync(actualMediaDir)) {
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

    // Gallery Images resolution
    const galleryDir = path.join(actualMediaDir, "gallery");
    if (fs.existsSync(galleryDir)) {
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

  // Save projects.json (strip temporary internal key `_weight` before saving, but keep it in memory for skills)
  const cleanProjectsList = finalProjectsList.map(({ _weight, ...rest }) => rest);
  const dataDir = path.dirname(outputProjectsPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(outputProjectsPath, JSON.stringify(cleanProjectsList, null, 2), "utf8");
  console.log(`Saved ${cleanProjectsList.length} projects to ${outputProjectsPath}`);

  // ─── 4. AGGREGATE SKILLS & CALCULATE LEVELS ───────────────────────────────
  console.log("Aggregating skills levels...");
  const skillScores: Record<string, number> = {};

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

    const processedLanguages = new Set<string>();

    if (totalBytes > 0) {
      for (const [langName, bytes] of Object.entries(projectLanguages)) {
        const percentage = bytes / totalBytes;
        // Ignore languages representing less than 5% of the codebase
        if (percentage < 0.05) continue;

        const cleanLang = langName.trim().toLowerCase();
        const mappedKey = languageMappings[cleanLang] || cleanLang;

        if (techRegistry[mappedKey]) {
          const scoreContribution = percentage * weight;
          skillScores[mappedKey] = (skillScores[mappedKey] || 0) + scoreContribution;
          processedLanguages.add(mappedKey);

          // Dynamically add the language to the project's tags if not already present
          const displayName = techRegistry[mappedKey].name;
          if (!project.tags.includes(displayName)) {
            project.tags.push(displayName);
          }
        }
      }
    }

    // Process all other tags (frameworks, libraries, tools)
    // If a tag is a language that was already processed dynamically above, skip it to avoid double counting
    for (const tag of project.tags) {
      const cleanTag = tag.trim().toLowerCase();
      if (processedLanguages.has(cleanTag)) continue;

      if (techRegistry[cleanTag]) {
        // Frameworks/libraries get full weight contribution
        skillScores[cleanTag] = (skillScores[cleanTag] || 0) + weight;
      } else {
        console.warn(`  Warning: Tag "${tag}" (used in "${project.title}") is not defined in tech-registry.json`);
      }
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

  // Construct final categories list and sort them
  const finalCategories = Object.keys(CATEGORIES).map((catKey) => {
    const catMeta = CATEGORIES[catKey];
    const skills = skillsByCategory[catKey] || [];

    // Sort skills inside the category by level desc, then name asc
    skills.sort((a, b) => {
      if (b.level !== a.level) {
        return b.level - a.level;
      }
      return a.name.localeCompare(b.name);
    });

    return {
      id: catKey,
      name: catMeta.name,
      order: catMeta.order,
      skills,
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
