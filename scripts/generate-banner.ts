#!/usr/bin/env tsx
import path from "path";
import fs from "fs";
import { generateBannerPng } from "../src/lib/banner/png-generator";
import { renderBannerSvg } from "../src/lib/banner/svg-renderer";
import {
  LINKEDIN_BANNER_WIDTH,
  LINKEDIN_BANNER_HEIGHT,
} from "../src/lib/banner/constants";
import { BannerData, BannerTemplateId, BannerTheme } from "../src/types/banner";

// Top required skills for AI Engineer role
const DEFAULT_AI_ENGINEER_SKILLS = [
  "Python",
  "PyTorch",
  "LLMs & RAG",
  "LangChain",
  "Vector DBs",
  "Docker",
  "FastAPI",
];

interface BannerCliConfig {
  role: string;
  skills?: string[];
  theme: "dark" | "light" | "both";
  outDir: string;
  withGuides: boolean;
}

function parseArgs(): BannerCliConfig {
  const args = process.argv.slice(2);
  const options: Record<string, string> = {};
  const flags = new Set<string>();

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      if (i + 1 < args.length && !args[i + 1].startsWith("-")) {
        options[key] = args[i + 1];
        i++;
      } else {
        flags.add(key);
      }
    } else if (arg.startsWith("-")) {
      const key = arg.slice(1);
      if (i + 1 < args.length && !args[i + 1].startsWith("-")) {
        options[key] = args[i + 1];
        i++;
      } else {
        flags.add(key);
      }
    }
  }

  const role = options.role || options.r || options.title || "AI Engineer";
  const noSkills = flags.has("no-skills") || flags.has("title-only");
  const skillsRaw = options.skills || options.s;

  let skills: string[] | undefined;
  if (!noSkills) {
    if (skillsRaw) {
      skills = skillsRaw.split(",").map((s) => s.trim()).filter(Boolean);
    } else if (role.toLowerCase().includes("ai")) {
      skills = DEFAULT_AI_ENGINEER_SKILLS;
    } else {
      skills = ["TypeScript", "Next.js", "React", "Node.js", "Docker", "PostgreSQL"];
    }
  }

  const themeRaw = (options.theme || options.t || "both").toLowerCase();
  const theme =
    themeRaw === "dark" || themeRaw === "light" ? themeRaw : "both";

  const outDir = path.resolve(
    process.cwd(),
    options.out || options.o || "banners"
  );

  return {
    role,
    skills,
    theme,
    outDir,
    withGuides: flags.has("guides") || flags.has("safe-guides"),
  };
}

async function main() {
  const config = parseArgs();

  const themes: BannerTheme[] =
    config.theme === "both" ? ["dark", "light"] : [config.theme];

  if (!fs.existsSync(config.outDir)) {
    fs.mkdirSync(config.outDir, { recursive: true });
  }

  console.log("\n================================================================================");
  console.log("             MINIMAL TERMINAL LINKEDIN BANNER GENERATOR                         ");
  console.log("================================================================================");
  console.log(`  Job Title        : ${config.role}`);
  console.log(`  Skill Pills      : ${config.skills && config.skills.length > 0 ? config.skills.join(" · ") : "(None - Title Only)"}`);
  console.log(`  Color Themes     : ${themes.join(" & ")} (exact website tokens: #18181b / #fafafa)`);
  console.log(`  Typography       : Monospace (font-mono, font-bold 700, tracking-tight)`);
  console.log(`  Cursor Style     : Block cursor (█ matching AnimatedGreeting.tsx)`);
  console.log(`  Dimensions       : ${LINKEDIN_BANNER_WIDTH} × ${LINKEDIN_BANNER_HEIGHT} px (4:1 Aspect Ratio)`);
  console.log(`  Safe Clearance   : 380px left margin (guarantees zero avatar collision)`);
  console.log(`  Output Directory : ${config.outDir}`);
  console.log("--------------------------------------------------------------------------------\n");

  const generatedFiles: string[] = [];

  // Variants to produce:
  // 1. Terminal with prompt (> Title █ + skills)
  // 2. Terminal clean (Title █ + skills)
  // 3. Title-only (if skills were specified, also provide the ultra-clean title-only variation)
  const variants: { template: BannerTemplateId; label: string; includeSkills: boolean }[] = [
    { template: "terminal", label: "terminal", includeSkills: true },
    { template: "terminal-clean" as BannerTemplateId, label: "terminal_clean", includeSkills: true },
  ];

  if (config.skills && config.skills.length > 0) {
    variants.push({
      template: "terminal",
      label: "title_only",
      includeSkills: false,
    });
  }

  const safeRole = config.role.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();

  for (const variant of variants) {
    for (const theme of themes) {
      const bannerData: BannerData = {
        jobTitle: config.role,
        name: "",
        tagline: "",
        skills: variant.includeSkills ? config.skills || [] : [],
        theme,
        template: variant.template,
      };

      const baseFilename = `linkedin_banner_${safeRole}_${theme}_${variant.label}`;

      // 1. Standard 1x PNG (1584 × 396 px)
      const res1x = await generateBannerPng(bannerData, {
        scale: 1,
        saveToFile: true,
        outputDir: config.outDir,
      });
      const targetPng1x = path.join(config.outDir, `${baseFilename}.png`);
      if (res1x.outputPath && res1x.outputPath !== targetPng1x) {
        fs.renameSync(res1x.outputPath, targetPng1x);
      }
      generatedFiles.push(`${baseFilename}.png (${LINKEDIN_BANNER_WIDTH}×${LINKEDIN_BANNER_HEIGHT})`);

      // 2. Retina 2x PNG (3168 × 792 px)
      const res2x = await generateBannerPng(bannerData, {
        scale: 2,
        saveToFile: true,
        outputDir: config.outDir,
      });
      const targetPng2x = path.join(config.outDir, `${baseFilename}@2x.png`);
      if (res2x.outputPath && res2x.outputPath !== targetPng2x) {
        fs.renameSync(res2x.outputPath, targetPng2x);
      }
      generatedFiles.push(`${baseFilename}@2x.png (${LINKEDIN_BANNER_WIDTH * 2}×${LINKEDIN_BANNER_HEIGHT * 2})`);

      // 3. Vector SVG
      const svgContent = renderBannerSvg(bannerData, { showSafeAreas: false });
      const svgPath = path.join(config.outDir, `${baseFilename}.svg`);
      fs.writeFileSync(svgPath, svgContent, "utf-8");
      generatedFiles.push(`${baseFilename}.svg (Vector)`);

      // 4. Optional Safe Area Guides Overlay
      if (config.withGuides) {
        const resGuides = await generateBannerPng(bannerData, {
          scale: 1,
          saveToFile: true,
          outputDir: config.outDir,
          svgOptions: { showSafeAreas: true },
        });
        const targetGuides = path.join(config.outDir, `${baseFilename}_guides.png`);
        if (resGuides.outputPath && resGuides.outputPath !== targetGuides) {
          fs.renameSync(resGuides.outputPath, targetGuides);
        }
        generatedFiles.push(`${baseFilename}_guides.png (Guide Overlay)`);
      }
    }
  }

  console.log("  Successfully generated minimal banners:\n");
  generatedFiles.forEach((file) => {
    console.log(`    ✓ ${file}`);
  });

  console.log("\n================================================================================");
  console.log(`  All banners saved to: ${config.outDir}`);
  console.log("  Upload instructions:");
  console.log("  1. Go to your LinkedIn profile → Click the camera icon on the background banner");
  console.log("  2. Select your preferred banner PNG from the banners directory");
  console.log("  3. Dimensions are 100% exact (1584×396 px) — zero cropping required!");
  console.log("================================================================================\n");
}

main().catch((err) => {
  console.error("Banner generation error:", err);
  process.exit(1);
});
