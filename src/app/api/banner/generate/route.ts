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

  const showTagline =
    body?.showTagline !== undefined
      ? body.showTagline
      : searchParams.get("showTagline") !== null
      ? searchParams.get("showTagline") === "true"
      : DEFAULT_BANNER_DATA.showTagline;

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

  const showContact =
    body?.showContact !== undefined
      ? body.showContact
      : searchParams.get("showContact") !== null
      ? searchParams.get("showContact") === "true"
      : DEFAULT_BANNER_DATA.showContact;

  const statusText =
    body?.statusText ||
    searchParams.get("statusText") ||
    DEFAULT_BANNER_DATA.statusText;

  const showStatus =
    body?.showStatus !== undefined
      ? body.showStatus
      : searchParams.get("showStatus") !== null
      ? searchParams.get("showStatus") === "true"
      : DEFAULT_BANNER_DATA.showStatus;

  const theme: BannerTheme =
    (body?.theme || searchParams.get("theme") || DEFAULT_BANNER_DATA.theme) === "light"
      ? "light"
      : "dark";

  const templateParam = body?.template || searchParams.get("template");
  const template: BannerTemplateId =
    templateParam === "terminal-clean" ||
    templateParam === "title-only" ||
    templateParam === "split" ||
    templateParam === "glow" ||
    templateParam === "framed"
      ? (templateParam as BannerTemplateId)
      : "terminal";

  const tagStyleParam = body?.tagStyle || searchParams.get("tagStyle");
  const tagStyle =
    tagStyleParam === "bracket" ||
    tagStyleParam === "inline" ||
    tagStyleParam === "pipe" ||
    tagStyleParam === "kv"
      ? tagStyleParam
      : "block";

  const promptParam = body?.promptSymbol || searchParams.get("promptSymbol");
  const promptSymbol =
    promptParam === "$" || promptParam === "❯" || promptParam === "none"
      ? promptParam
      : ">";

  const showCursor =
    body?.showCursor !== undefined
      ? body.showCursor
      : searchParams.get("showCursor") !== null
      ? searchParams.get("showCursor") === "true"
      : true;

  const showName =
    body?.showName !== undefined
      ? body.showName
      : searchParams.get("showName") !== null
      ? searchParams.get("showName") === "true"
      : true;

  const nameStyle =
    (body?.nameStyle || searchParams.get("nameStyle")) === "plain"
      ? "plain"
      : "path";

  const showJobTitle =
    body?.showJobTitle !== undefined
      ? body.showJobTitle
      : searchParams.get("showJobTitle") !== null
      ? searchParams.get("showJobTitle") === "true"
      : true;

  const showSkills =
    body?.showSkills !== undefined
      ? body.showSkills
      : searchParams.get("showSkills") !== null
      ? searchParams.get("showSkills") === "true"
      : true;

  const linkPosition =
    (body?.linkPosition || searchParams.get("linkPosition")) === "corner"
      ? "corner"
      : "below";

  const linkStyleParam = body?.linkStyle || searchParams.get("linkStyle");
  const linkStyle =
    linkStyleParam === "curl" ||
    linkStyleParam === "kv" ||
    linkStyleParam === "plain"
      ? linkStyleParam
      : "arrow";

  const taglineStyle =
    (body?.taglineStyle || searchParams.get("taglineStyle")) === "comment"
      ? "comment"
      : "plain";

  const statusIconParam = body?.statusIcon || searchParams.get("statusIcon");
  const statusIcon =
    statusIconParam === "dot-amber" ||
    statusIconParam === "dot-blue" ||
    statusIconParam === "sparkle" ||
    statusIconParam === "bolt" ||
    statusIconParam === "chevron" ||
    statusIconParam === "ring" ||
    statusIconParam === "none"
      ? statusIconParam
      : "dot-green";

  return {
    jobTitle,
    showJobTitle,
    promptSymbol,
    showCursor,
    name,
    showName,
    nameStyle,
    tagline,
    showTagline,
    taglineStyle,
    skills,
    showSkills,
    tagStyle,
    contactUrl,
    showContact,
    linkPosition,
    linkStyle,
    statusText,
    showStatus,
    statusIcon,
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

    const safeRole = (bannerData.jobTitle || "AI_Engineer").replace(/[^a-zA-Z0-9_-]/g, "_");
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
