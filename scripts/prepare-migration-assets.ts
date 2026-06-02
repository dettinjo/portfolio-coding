import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const dumpPath = path.join(__dirname, "projects_locales_dump.json");
const outputDir = path.join(rootDir, "migration-assets");

// Map of media ID to filename in public/media
const mediaMap: Record<number, string> = {
  1: "Spacy.svg",
  3: "GraphQL.svg",
  6: "Laravel.svg",
  8: "Python.svg",
  9: "Kotlin.svg",
  10: "huggingface.svg",
  15: "Kubernetes.svg",
  18: "Terraform.svg",
  21: "openai.svg",
  23: "strapi_icon.svg",
  2: "co2_tracker_home.webp",
  5: "co2_tracker_challenge.webp",
  7: "co2_tracker_history_detail.webp",
  14: "co2_tracker_history.webp",
  16: "co2_tracker_scoreboard.webp",
  19: "contact_diary_add.webp",
  11: "contact_diary_encounter.webp",
  12: "contact_diary_persons.webp",
  4: "contact_diary_locations.webp",
  13: "Link24_SignUp.webp",
  17: "Link24_Home.webp",
  22: "Link24_History.webp",
  20: "portfolio_home.webp",
};

// Map of project ID to list of gallery media IDs
const galleryMap: Record<number, number[]> = {
  1: [18],
  2: [13, 17, 22],
  3: [8],
  4: [2, 5, 7, 14, 16],
  5: [3],
  6: [9],
  7: [15],
  8: [6],
  9: [19, 11, 12, 4],
  10: [20],
};

// Estimated complexity weights for the projects
const projectWeights: Record<number, number> = {
  1: 3, // Bachelor thesis (large)
  2: 2, // Link24 (medium)
  3: 3, // LLM Fact Auditor (large/complex)
  4: 3, // CO2 tracker (large/client)
  5: 2, // Competition app (medium)
  6: 2, // MyFavLocation (medium)
  7: 3, // Kubernetes shortener (large)
  8: 2, // Laravel blog (medium)
  9: 2, // Contact log (medium)
  10: 3, // Dual portfolio (large)
};

const getRepoName = (repoUrl: string | undefined, slug: string): string => {
  if (!repoUrl) return slug;
  const parts = repoUrl.split("/");
  return parts[parts.length - 1];
};

const main = () => {
  if (!fs.existsSync(dumpPath)) {
    console.error(`Dump file not found at ${dumpPath}`);
    process.exit(1);
  }

  // Load and repair the JSON from double backslashes
  const rawDump = fs.readFileSync(dumpPath, "utf8");
  const repairedDump = rawDump.replace(/\\\\"/g, '\\"');
  let projects: any[];
  try {
    projects = JSON.parse(repairedDump);
  } catch (error: any) {
    console.error("Failed to parse repaired JSON dump:", error.message);
    process.exit(1);
  }

  console.log(`Loaded ${projects.length} project records from dump.`);

  // Create base migration output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const record of projects) {
    const id = record.id;
    const slug = record.slug;
    const repoUrl = record.repo_url;
    const repoName = getRepoName(repoUrl, slug);
    const projDir = path.join(outputDir, repoName);
    const portfolioDir = path.join(projDir, ".portfolio");

    console.log(`Processing project ${id}: "${record.title}" -> ${repoName}`);

    // Create directory structure
    fs.mkdirSync(portfolioDir, { recursive: true });

    // 1. Write Description files (English is default in database)
    const enAboutPath = path.join(portfolioDir, "about.en.md");
    const deAboutPath = path.join(portfolioDir, "about.de.md");

    // The long description contains markdown, so write it directly as .md
    const longDesc = record.long_description || "";
    fs.writeFileSync(enAboutPath, longDesc, "utf8");
    // Write an empty or placeholder DE about file for completeness
    fs.writeFileSync(deAboutPath, "", "utf8");

    // 2. Determine cover image name and details
    let coverFilename = "";
    if (record.cover_image_id && mediaMap[record.cover_image_id]) {
      coverFilename = mediaMap[record.cover_image_id];
      const srcCoverPath = path.join(rootDir, "public", "media", coverFilename);
      if (fs.existsSync(srcCoverPath)) {
        const coverExt = path.extname(coverFilename);
        const destCoverPath = path.join(portfolioDir, `cover${coverExt}`);
        fs.copyFileSync(srcCoverPath, destCoverPath);
        console.log(`  ✓ Copied cover image: ${coverFilename} -> cover${coverExt}`);
      } else {
        console.warn(`  ⚠ Cover image file not found locally: ${srcCoverPath}`);
      }
    }

    // 3. Process Gallery images
    const galleryIds = galleryMap[id] || [];
    if (galleryIds.length > 0) {
      const galleryDestDir = path.join(portfolioDir, "gallery");
      fs.mkdirSync(galleryDestDir, { recursive: true });

      for (const mediaId of galleryIds) {
        const filename = mediaMap[mediaId];
        if (!filename) continue;
        const srcPath = path.join(rootDir, "public", "media", filename);
        if (fs.existsSync(srcPath)) {
          const destPath = path.join(galleryDestDir, filename);
          fs.copyFileSync(srcPath, destPath);
          console.log(`  ✓ Copied gallery image: ${filename}`);
        } else {
          console.warn(`  ⚠ Gallery image file not found locally: ${srcPath}`);
        }
      }
    }

    // 4. Create metadata.json
    const metadata = {
      title: record.title,
      projectType: record.project_type,
      developedAt: record.developed_at,
      weight: projectWeights[id] || 1,
      publishLink: repoUrl ? true : false, // False if it was private/unpublished (e.g. bachelor thesis)
      liveUrl: record.live_url || null,
      repoUrl: repoUrl || null,
      tags: record.tags || [],
    };

    const metadataPath = path.join(portfolioDir, "metadata.json");
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), "utf8");
    console.log(`  ✓ Wrote metadata.json`);
  }

  console.log(`\nSuccess! All migration assets prepared in: ${outputDir}`);
};

main();
