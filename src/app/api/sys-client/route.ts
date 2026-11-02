import "server-only";
import { NextResponse } from "next/server";

// Proxies the Umami tracking script from the internal Umami instance.
// Visitors load this from the portfolio domain — no public Umami URL needed.
// The pages are prerendered without the runtime-only UMAMI_WEBSITE_ID, so the
// script sets it on its own <script> tag before Umami reads the attribute.
export async function GET() {
  const internalUrl = process.env.UMAMI_INTERNAL_URL;
  const websiteId = process.env.UMAMI_WEBSITE_ID;
  if (!internalUrl || !websiteId) {
    return new NextResponse("// analytics not configured", {
      headers: { "Content-Type": "application/javascript" },
    });
  }

  try {
    const res = await fetch(`${internalUrl}/script.js`, {
      next: { revalidate: 3600 }, // cache the script for 1 hour
    });
    const text = await res.text();
    const setWebsiteId = `(function(){var s=document.currentScript;if(s&&!s.getAttribute("data-website-id"))s.setAttribute("data-website-id",${JSON.stringify(websiteId)});})();\n`;
    return new NextResponse(setWebsiteId + text, {
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("// analytics unavailable", {
      headers: { "Content-Type": "application/javascript" },
    });
  }
}
