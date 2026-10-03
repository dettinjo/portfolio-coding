import { NextRequest, NextResponse } from "next/server";
import { generateBannerPng } from "@/lib/banner/png-generator";
import { renderBannerSvg } from "@/lib/banner/svg-renderer";
import { DEFAULT_BANNER_DATA } from "@/lib/banner/constants";
import { BannerData, BannerTemplateId, BannerTheme } from "@/types/banner";
import { siteConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

function parseBannerParams(searchParams: URLSearchParams, body?: Partial<BannerData>): BannerData {
  const jobTitle =
    body?.jobTitle ||
    searchParams.get("jobTitle") ||
    searchParams.get("role") ||
    siteConfig.person.headline ||
    DEFAULT_BANNER_DATA.jobTitle;

  const name =
    body?.name ||
    searchParams.get("name") ||
    siteConfig.person.fullName ||
    DEFAULT_BANNER_DATA.name;

  const tagline =
    body?.tagline ||
    searchParams.get("tagline") ||
    DEFAULT_BANNER_DATA.tagline;

  let skills: string[] = DEFAULT_BANNER_DATA.skills;
  if (body?.skills && Array.isArray(body.skills)) {
    skills = body.skills;
  } else if (searchParams.get("skills")) {
    skills = searchParams
      .get("skills")!
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const contactUrl =
    body?.contactUrl ||
    searchParams.get("contactUrl") ||
    siteConfig.site.serverUrl?.replace(/^https?:\/\//, "") ||
    DEFAULT_BANNER_DATA.contactUrl;

  const statusText =
    body?.statusText ||
    searchParams.get("statusText") ||
    DEFAULT_BANNER_DATA.statusText;

  const showStatus =
    body?.showStatus !== undefined
      ? body.showStatus
      : searchParams.get("showStatus") !== null
      ? searchParams.get("showStatus") === "true"
      : true;

  const theme: BannerTheme =
    (body?.theme || searchParams.get("theme") || DEFAULT_BANNER_DATA.theme) === "light"
      ? "light"
      : "dark";

  const templateParam = body?.template || searchParams.get("template");
  const template: BannerTemplateId =
    templateParam === "split" ||
    templateParam === "glow" ||
    templateParam === "framed"
      ? templateParam
      : "terminal";

  return {
    jobTitle,
    name,
    tagline,
    skills,
    contactUrl,
    statusText,
    showStatus,
    theme,
    template,
  };
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const searchParams = req.nextUrl.searchParams;
  const bannerData = parseBannerParams(searchParams);
  const format = searchParams.get("format") || "png";
  const scale = searchParams.get("scale") === "2" ? 2 : 1;
  const showSafeAreas = searchParams.get("safeAreas") === "true";

  try {
    if (format === "svg") {
      const svg = renderBannerSvg(bannerData, { showSafeAreas });
      return new NextResponse(svg, {
        status: 200,
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "public, max-age=3600, s-maxage=3600",
        },
      });
    }

    // Default: PNG
    const result = await generateBannerPng(bannerData, {
      scale,
      svgOptions: { showSafeAreas },
    });

    const safeRole = bannerData.jobTitle.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `LinkedIn_Banner_${safeRole}_${bannerData.theme}${
      scale === 2 ? "@2x" : ""
    }.png`;

    return new NextResponse(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (err) {
    console.error("[Banner API] Generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate banner" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const bannerData = parseBannerParams(new URLSearchParams(), body);
    const format = body.format || "png";
    const scale = body.scale === 2 ? 2 : 1;
    const showSafeAreas = body.showSafeAreas === true;

    if (format === "svg") {
      const svg = renderBannerSvg(bannerData, { showSafeAreas });
      return new NextResponse(svg, {
        status: 200,
        headers: {
          "Content-Type": "image/svg+xml",
        },
      });
    }

    const result = await generateBannerPng(bannerData, {
      scale,
      saveToFile: true,
      svgOptions: { showSafeAreas },
    });

    return NextResponse.json({
      success: true,
      downloadUrl: result.downloadUrl,
      width: result.width,
      height: result.height,
      scale: result.scale,
      data: bannerData,
    });
  } catch (err) {
    console.error("[Banner API POST] Generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate banner" },
      { status: 500 }
    );
  }
}
