/**
 * Generates og-software.png and converts large SVG screenshots to WebP.
 * Run with: node scripts/generate-assets.mjs
 */

import sharp from "sharp";
import { readFile, writeFile, unlink } from "fs/promises";
import { existsSync } from "fs";
import { execSync } from "child_process";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const CHROME =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

// ─── 1. OG Image ─────────────────────────────────────────────────────────────

const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#19191F"/>
  <rect x="36" y="36" width="1128" height="558" rx="20" fill="none" stroke="#ffffff18" stroke-width="1.5"/>
  <!-- Code icon: same paths as favicon-dark.svg, scaled to ~220px and centered -->
  <g transform="translate(490, 130) scale(9.17)">
    <polyline points="4 17 10 11 4 5" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="12" y1="19" x2="20" y2="19" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <text x="600" y="430" text-anchor="middle"
    font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    font-size="62" font-weight="700" fill="#FAFAFA" letter-spacing="-1">Joel Dettinger</text>
  <text x="600" y="505" text-anchor="middle"
    font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    font-size="30" font-weight="400" fill="#ffffff60" letter-spacing="0.5">Software Developer Portfolio</text>
</svg>`;

const ogOut = path.join(root, "public", "og-software.png");
await sharp(Buffer.from(ogSvg))
  .resize(1200, 630)
  .png({ compressionLevel: 9 })
  .toFile(ogOut);
console.log("✓ Generated public/og-software.png");

// ─── 2. SVG → WebP via Chrome headless ───────────────────────────────────────

const toConvert = [
  "co2_tracker_challenge.svg",
  "co2_tracker_history.svg",
  "co2_tracker_history_detail.svg",
  "co2_tracker_home.svg",
  "co2_tracker_scoreboard.svg",
  "contact_diary_add.svg",
  "contact_diary_encounter.svg",
  "contact_diary_locations.svg",
  "contact_diary_persons.svg",
  "Link24_History.svg",
  "Link24_Home.svg",
  "Link24_SignUp.svg",
  "portfolio_home.svg",
];

const mediaDir = path.join(root, "public", "media");

for (const file of toConvert) {
  const svgPath = path.join(mediaDir, file);
  if (!existsSync(svgPath)) {
    console.warn(`  ⚠ Skipped (not found): ${file}`);
    continue;
  }

  // Read SVG to extract width/height for the viewport
  const svgText = await readFile(svgPath, "utf8");
  const wMatch = svgText.match(/width="(\d+)"/);
  const hMatch = svgText.match(/height="(\d+)"/);
  const svgW = wMatch ? parseInt(wMatch[1]) : 1200;
  const svgH = hMatch ? parseInt(hMatch[1]) : 900;

  // Scale down to max 1200px wide while preserving aspect ratio
  const scale = Math.min(1, 1200 / svgW);
  const viewW = Math.round(svgW * scale);
  const viewH = Math.round(svgH * scale);

  const tmpPng = path.join(os.tmpdir(), `svg_conv_${Date.now()}.png`);

  // Chrome headless renders foreignObject correctly
  execSync(
    `"${CHROME}" \
      --headless=new \
      --disable-gpu \
      --no-sandbox \
      --hide-scrollbars \
      --screenshot="${tmpPng}" \
      --window-size=${svgW},${svgH} \
      --force-device-scale-factor=${scale} \
      "file://${svgPath}"`,
    { stdio: "pipe" }
  );

  const webpPath = path.join(mediaDir, file.replace(".svg", ".webp"));
  await sharp(tmpPng)
    .resize(viewW, viewH)
    .webp({ quality: 85 })
    .toFile(webpPath);

  await unlink(tmpPng);

  const svgSize = (svgText.length / 1024).toFixed(0);
  const { size: webpBytes } = await (await import("fs")).promises.stat(webpPath);
  const webpSize = (webpBytes / 1024).toFixed(0);
  const savings = (
    ((svgText.length - webpBytes) / svgText.length) *
    100
  ).toFixed(0);

  console.log(
    `✓ ${file.padEnd(35)} ${svgSize.padStart(5)}KB → ${webpSize.padStart(4)}KB webp  (−${savings}%)`
  );
}

console.log(
  "\nDone. Update Payload CMS media references from .svg → .webp for the converted files."
);
