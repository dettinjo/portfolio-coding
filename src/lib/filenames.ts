// Shared PDF file naming for MCP responses and download routes, so automation
// clients get the same name the browser download uses:
//   <First>_<Last>_CV_<Company>_<Role>.pdf
//   <First>_<Last>_Cover_Letter_<Company>_<Role>.pdf

/** "Allianz SE" → "Allianz_SE", "AI Full-Stack Dev (m/w/d)" → "AI_Full_Stack_Dev_m_w_d". */
export function fileNamePart(value: string | undefined, fallback: string): string {
  const cleaned = (value ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .replace(/ß/g, "ss")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return cleaned || fallback;
}

export function suggestedPdfFileName(params: {
  kind: "cv" | "cover-letter";
  name?: string;
  company: string;
  role: string;
}): string {
  const label = params.kind === "cv" ? "CV" : "Cover_Letter";
  return [
    fileNamePart(params.name, "Resume"),
    label,
    fileNamePart(params.company, "Company"),
    fileNamePart(params.role, "Role"),
  ].join("_") + ".pdf";
}
