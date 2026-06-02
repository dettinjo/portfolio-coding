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
const outputAvatarPath = path.join(rootDir, "public", "images", "profile.webp");
const outputPdfPath = path.join(rootDir, "public", "media", "resume.pdf");

const GITHUB_USERNAME = process.env.NEXT_PUBLIC_GITHUB_USERNAME || "dettinjo";
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
}

interface SoftwareProject {
  id: string;
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  longDescriptionDe?: string;
  projectType: string;
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

// Helper to save and compress image to WebP if needed
const saveAndCompressImage = async (buffer: Buffer, destPath: string): Promise<string> => {
  const ext = path.extname(destPath).toLowerCase();
  const dir = path.dirname(destPath);
  const name = path.basename(destPath, ext);

  if (ext === ".png" || ext === ".jpg" || ext === ".jpeg") {
    const webpPath = path.join(dir, `${name}.webp`);
    await sharp(buffer)
      .webp({ quality: 85 })
      .toFile(webpPath);
    console.log(`    ✓ Compressed and saved as WebP: ${path.basename(webpPath)}`);
    return `${name}.webp`;
  } else {
    fs.writeFileSync(destPath, buffer);
    return path.basename(destPath);
  }
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

  // ─── 0. FETCH CONFIG FROM GITHUB OR LOCAL ──────────────────────────────────
  console.log("Checking portfolio configuration (resume.json, profile image, PDF)...");
  
  let resumeConfigFetched = false;

  const localConfigDir = path.join(rootDir, "config");

  if (PORTFOLIO_CONFIG_REPO) {
    try {
      console.log(`Fetching configuration from remote repository: ${GITHUB_USERNAME}/${PORTFOLIO_CONFIG_REPO}...`);
      
      const contents = await githubFetch(
        `https://api.github.com/repos/${GITHUB_USERNAME}/${PORTFOLIO_CONFIG_REPO}/contents/.portfolio`
      ).catch(() => null);

      if (contents && Array.isArray(contents)) {
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
          description: metadata.description || "",
          longDescription,
          longDescriptionDe,
          projectType: metadata.projectType,
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

  // ─── 2. FETCH FROM GITHUB ──────────────────────────────────────────────────
  try {
    console.log("Fetching repositories from GitHub...");
    let repos: any[] = [];
    if (GITHUB_TOKEN) {
      repos = await githubFetch("https://api.github.com/user/repos?per_page=100&type=all");
    } else {
      repos = await githubFetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100`);
    }

    const portfolioRepos = repos.filter(
      (repo) => repo.topics && repo.topics.includes("portfolio")
    );

    console.log(`Found ${portfolioRepos.length} repositories matching the topic "portfolio".`);

    for (const repo of portfolioRepos) {
      const repoName = repo.name;
      const slug = repoName.toLowerCase();
      console.log(`Syncing repository: ${repoName}...`);

      try {
        // Query the contents of .portfolio/
        const contents = await githubFetch(
          `https://api.github.com/repos/${repo.owner.login}/${repoName}/contents/.portfolio`
        ).catch(() => null);

        if (!contents || !Array.isArray(contents)) {
          console.log(`  Skipping ${repoName}: .portfolio/ folder not found or accessible.`);
          continue;
        }

        // Find file details
        const metadataFile = contents.find((c) => c.name === "metadata.json");
        const enAboutFile = contents.find((c) => c.name === "about.en.md");
        const deAboutFile = contents.find((c) => c.name === "about.de.md");
        const coverFile = contents.find((c) => c.name.startsWith("cover."));
        const galleryDir = contents.find((c) => c.name === "gallery" && c.type === "dir");

        if (!metadataFile) {
          console.warn(`  Skipping ${repoName}: metadata.json not found in .portfolio/`);
          continue;
        }

        // Fetch metadata
        const metadataRaw = await githubFetch(metadataFile.url);
        const metadataString = Buffer.from(metadataRaw.content, "base64").toString("utf8");
        const metadata: ProjectMetadata = JSON.parse(metadataString);

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
          description: metadata.description || repo.description || "",
          longDescription,
          longDescriptionDe,
          projectType: metadata.projectType || repo.language || "Software Project",
          developedAt: metadata.developedAt || repo.created_at,
          liveUrl: metadata.liveUrl || repo.homepage || undefined,
          repoUrl: metadata.publishLink && !repo.private ? (metadata.repoUrl || repo.html_url) : undefined,
          tags: metadata.tags && metadata.tags.length > 0 ? metadata.tags : (repo.topics || []),
          coverImage: null,
          gallery: null,
          _weight: metadata.weight || 1,
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

    const skillObj = {
      id: techKey,
      name: registryEntry.name,
      iconClassName: registryEntry.iconClassName || "",
      level,
      url: registryEntry.url || "",
    };

    const category = registryEntry.category.toLowerCase();
    if (skillsByCategory[category]) {
      skillsByCategory[category].push(skillObj);
    } else {
      console.warn(`  Warning: Category "${category}" for tech "${techKey}" is not a recognized category.`);
      // Add to backend as fallback
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
