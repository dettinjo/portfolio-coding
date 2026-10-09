import path from "path";
import fs from "fs";
import sharp from "sharp";
import { BannerData } from "@/types/banner";
import { renderBannerSvg, SvgRenderOptions } from "./svg-renderer";
import { LINKEDIN_BANNER_WIDTH, LINKEDIN_BANNER_HEIGHT } from "./constants";

export interface PngGenerationResult {
  buffer: Buffer;
  width: number;
  height: number;
  scale: 1 | 2;
  outputPath?: string;
  downloadUrl?: string;
}

export function getBannerOutputDir(): string {
  const preferred = path.join(process.cwd(), "public", "downloads", "banners");
  try {
    if (!fs.existsSync(preferred)) {
      fs.mkdirSync(preferred, { recursive: true });
    }
    fs.accessSync(preferred, fs.constants.W_OK);
    return preferred;
  } catch {
    const fallback = path.join("/tmp", "banners", "downloads");
    if (!fs.existsSync(fallback)) {
      fs.mkdirSync(fallback, { recursive: true });
    }
    return fallback;
  }
}

export async function generateBannerPng(
  data: BannerData,
  options: {
    scale?: 1 | 2;
    saveToFile?: boolean;
    outputDir?: string;
    svgOptions?: SvgRenderOptions;
  } = {}
): Promise<PngGenerationResult> {
  const scale = options.scale ?? 1;
  const width = LINKEDIN_BANNER_WIDTH * scale;
  const height = LINKEDIN_BANNER_HEIGHT * scale;

  const svgString = renderBannerSvg(data, options.svgOptions);
  const svgBuffer = Buffer.from(svgString, "utf-8");

  // Render high-fidelity PNG using sharp
  const pngBuffer = await sharp(svgBuffer, { density: scale === 2 ? 144 : 72 })
    .resize(width, height, { fit: "contain" })
    .png({ compressionLevel: 9, quality: 100 })
    .toBuffer();

  let outputPath: string | undefined;
  let downloadUrl: string | undefined;

  if (options.saveToFile) {
    const outputDir = options.outputDir || getBannerOutputDir();
    const safeName = (data.name || "LinkedIn_Banner")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .toLowerCase();
    const safeRole = (data.jobTitle || "Engineer")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .toLowerCase();
    const filename = `banner_${safeName}_${safeRole}_${data.theme}_${data.template}${
      scale === 2 ? "@2x" : ""
    }.png`;

    outputPath = path.join(outputDir, filename);
    fs.writeFileSync(outputPath, pngBuffer);
    downloadUrl = `/downloads/banners/${filename}`;
  }

  return {
    buffer: pngBuffer,
    width,
    height,
    scale,
    outputPath,
    downloadUrl,
  };
}
