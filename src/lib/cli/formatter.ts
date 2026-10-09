import { siteConfig } from "@/lib/config";
import projectsData from "@/data/projects.json";
import skillsData from "@/data/skills.json";
import resumeData from "@/data/resume.json";
import type { SoftwareProject, SkillCategory } from "@/lib/types";
import type { ResumeData } from "@/types/resume";
import {
  c,
  terminalLink,
  skillBar,
  divider,
  stripAnsi,
  wrapText,
  renderCard,
} from "./ansi";

const projects = projectsData as unknown as SoftwareProject[];
const skills = skillsData as unknown as SkillCategory[];
const resume = resumeData as unknown as ResumeData;

export interface CliRenderOptions {
  lang?: "en" | "de";
  isPlain?: boolean;
  origin?: string;
  projectLimit?: number;
}

/**
 * Format project developedAt ISO date into clean "Mon YYYY" string.
 */
function formatProjectDate(isoDate?: string, lang: "en" | "de" = "en"): string {
  if (!isoDate) return "";
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString(lang === "de" ? "de-DE" : "en-US", {
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

/**
 * Format markdown text (e.g. from README/longDescription) into clean terminal text.
 */
export function formatMarkdownForTerminal(md: string): string {
  if (!md) return "";

  return md
    // Strip image tags & markdown image links
    .replace(/<img[^>]*>/gi, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    // Strip HTML tags like <p align="...">
    .replace(/<\/?[^>]+(>|$)/g, "")
    // Convert headings
    .replace(/^### (.*$)/gim, `\n${c.bold}${c.brightYellow}▸ $1${c.reset}`)
    .replace(/^## (.*$)/gim, `\n${c.bold}${c.brightCyan}◆ $1${c.reset}\n`)
    .replace(/^# (.*$)/gim, `\n${c.bold}${c.brightCyan}══ $1 ══${c.reset}\n`)
    // Convert bullet lists
    .replace(/^[\*\-] (.*$)/gim, `  ${c.brightCyan}•${c.reset} $1`)
    // Convert bold & italic
    .replace(/\*\*(.*?)\*\*/g, `${c.bold}$1${c.reset}`)
    .replace(/\*(.*?)\*/g, `${c.italic}$1${c.reset}`)
    // Convert inline code
    .replace(/`([^`]+)`/g, `${c.brightYellow}$1${c.reset}`)
    // Convert markdown links [text](url) -> terminalLink or text (url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, text, url) => {
      return `${c.brightBlue}${terminalLink(text, url)}${c.reset} ${c.gray}(${url})${c.reset}`;
    })
    // Collapse excess blank lines
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Render stylized ASCII / Ghostty prompt header.
 */
export function renderHeader(options: CliRenderOptions = {}): string {
  const lang = options.lang || "en";
  const p = siteConfig.person;
  const origin = options.origin || siteConfig.site.serverUrl || "https://example.com";
  const name = p.fullName || resume.basics.name;
  const isJoel = /joel/i.test(name);
  const isAlex = /alex/i.test(name);

  let asciiArt = "";
  if (isJoel) {
    asciiArt = `${c.brightCyan}${c.bold}
       _            _   ____       _   _   _                    
      | |          | | |  _ \\     | | | | (_)                   
      | | ___   ___| | | | | | ___| |_| |_ _ _ __   __ _  ___ _ __ 
   _  | |/ _ \\ / _ \\ | | | | |/ _ \\ __| __| | '_ \\ / _\` |/ _ \\ '__|
  | |_| | (_) |  __/ | | |_| |  __/ |_| |_| | | | | (_| |  __/ |   
   \\___/ \\___/ \\___|_| |____/ \\___|\\__|\\__|_|_| |_|\\__, |\\___|_|   
                                                   __/ |          
                                                  |___/           ${c.reset}`;
  } else if (isAlex) {
    asciiArt = `${c.brightCyan}${c.bold}
      _   _            ___  _                     
     /_\\ | |_____ __  | _ \\(_)_ _____ _ _ __ _    
    / _ \\| / -_) \\ /  |   /| \\ V / -_) '_/ _\` |   
   /_/ \\_\\_\\___/_\\_\\  |_|_\\|_|\\_/\\___|_| \\__,_|   ${c.reset}`;
  } else {
    asciiArt = `${c.brightCyan}${c.bold}   ${name.toUpperCase()}${c.reset}`;
  }

  // Location resolution: site.config.json person.address -> resume.json location fallback
  const locationCity = p.address?.city || "";
  const locationCountry = p.address?.country || "";
  const location =
    locationCity && locationCountry
      ? `${locationCity}, ${locationCountry}`
      : locationCity || locationCountry || resume.basics?.location || "Remote";

  // Status badge resolution: person.status / availability override or default
  const customStatus = (p as { status?: string; availability?: string }).status ||
    (p as { status?: string; availability?: string }).availability;
  const statusBadge = customStatus
    ? `${c.brightGreen}● ${customStatus}${c.reset}`
    : lang === "de"
    ? `${c.brightGreen}● Verfügbar für Projekte${c.reset}`
    : `${c.brightGreen}● Available for opportunities${c.reset}`;

  const webLink = terminalLink(origin, origin);

  const promptLine = `${c.gray}╭─${c.reset} ${c.brightGreen}${name.toLowerCase().replace(/\s+/g, "")}${c.gray}@${c.brightBlue}terminal${c.reset} ${c.gray}in${c.reset} ${c.brightYellow}~${c.reset} ${c.gray}on${c.reset} ${c.brightMagenta}main${c.reset}
${c.gray}╰─${c.reset} ${c.brightCyan}❯${c.reset} ${c.bold}${name}${c.reset} ${c.gray}—${c.reset} ${c.brightYellow}${p.headline}${c.reset}`;

  const metaPill = `${c.gray}📍 ${location}  ${c.gray}│${c.reset}  ${statusBadge}  ${c.gray}│${c.reset}  🌐 ${c.brightBlue}${webLink}${c.reset}`;

  return `${asciiArt}\n\n${promptLine}\n${metaPill}\n${divider()}`;
}

/**
 * Render a route header banner pill (for subroutes).
 */
export function renderRoutePill(route: string, subtitle?: string, width = 74): string {
  const top = `${c.gray}╭─${c.reset} ${c.brightGreen}~${c.reset} ${c.brightCyan}${route}${c.reset} ${c.gray}${"─".repeat(Math.max(1, width - stripAnsi(route).length - 6))}╮${c.reset}`;
  const lines = [top];

  if (subtitle) {
    const visibleSub = stripAnsi(subtitle);
    const pad = Math.max(0, width - visibleSub.length - 4);
    lines.push(`${c.gray}│${c.reset}  ${c.dim}${subtitle}${c.reset}${" ".repeat(pad)}${c.gray}│${c.reset}`);
  }

  lines.push(`${c.gray}╰${"─".repeat(width - 2)}╯${c.reset}`);
  return lines.join("\n");
}

/**
 * Render a single project inside a styled rounded card box.
 */
export function renderProjectCard(proj: SoftwareProject, options: CliRenderOptions = {}): string {
  const lang = options.lang || "en";
  const origin = options.origin || siteConfig.site.serverUrl || "https://example.com";

  const title = lang === "de" && proj.titleDe ? proj.titleDe : proj.title;
  const desc = lang === "de" && proj.descriptionDe ? proj.descriptionDe : proj.description;
  const projectType =
    lang === "de" && proj.projectTypeDe ? proj.projectTypeDe : proj.projectType || proj.categories?.[0] || "Project";
  const dateStr = formatProjectDate(proj.developedAt, lang);
  const projectUrl = `${origin}/${proj.slug}`;
  const clickUrl = terminalLink(projectUrl, projectUrl);

  const tags = proj.tags.map((t) => `${c.gray}[${c.brightCyan}${t}${c.gray}]${c.reset}`).join(" ");

  const lines: string[] = [""];

  // Date & Tech stack with safe line wrapping
  if (dateStr) {
    lines.push(`  ${c.gray}Date:${c.reset}   ${c.dim}${dateStr}${c.reset}`);
  }
  if (tags) {
    const wrappedTags = wrapText(tags, 58);
    if (wrappedTags.length > 0) {
      lines.push(`  ${c.gray}Stack:${c.reset}  ${wrappedTags[0]}`);
      for (let j = 1; j < wrappedTags.length; j++) {
        lines.push(`          ${wrappedTags[j]}`);
      }
    }
  }

  // Description with word-wrap
  const wrappedDesc = wrapText(desc, 58);
  if (wrappedDesc.length > 0) {
    lines.push(`  ${c.gray}About:${c.reset} ${wrappedDesc[0]}`);
    for (let j = 1; j < wrappedDesc.length; j++) {
      lines.push(`         ${wrappedDesc[j]}`);
    }
  }

  // Link
  lines.push("");
  lines.push(`  ${c.gray}Link:${c.reset}  ${c.brightBlue}${clickUrl}${c.reset}`);
  lines.push("");

  const rightBadge = `${c.dim}[${c.brightYellow}${projectType}${c.reset}${c.dim}]${c.reset}`;

  return renderCard({
    title: `${c.bold}${c.brightWhite}${title}${c.reset}`,
    rightBadge,
    lines,
    width: 74,
    borderColor: c.gray,
  });
}

/**
 * Render About and Bio focus rotations.
 */
export function renderAbout(options: CliRenderOptions = {}): string {
  const lang = options.lang || "en";
  const summary = resume.sections.summary?.content || "";
  const rotations = siteConfig.person.bioRotations?.[lang] || siteConfig.person.bioRotations?.en || [];

  const sectionTitle = lang === "de" ? "ÜBERBLICK & FOKUS" : "ABOUT & FOCUS";
  let out = `\n${divider(sectionTitle)}\n`;

  if (summary) {
    const wrappedSummary = wrapText(summary, 70);
    out += `\n${wrappedSummary.join("\n")}\n`;
  }

  if (rotations.length > 0) {
    out += `\n${c.bold}${c.brightCyan}Core Focus Areas:${c.reset}\n`;
    for (const item of rotations) {
      const roleStr = `${c.brightYellow}${item.role.padEnd(22)}${c.reset}`;
      const adjectives = item.adjectives?.length ? item.adjectives.join(", ") : "";
      const desc = adjectives ? `${adjectives} ${item.artifacts || ""}` : item.artifacts || "";
      out += `  ${c.cyan}▸${c.reset} ${roleStr} ${c.dim}${desc}${c.reset}\n`;
    }
  }

  return out;
}

/**
 * Render Projects Section (featured subset or full).
 */
export function renderProjects(options: CliRenderOptions = {}): string {
  const lang = options.lang || "en";
  const limit = options.projectLimit ?? projects.length;
  const list = projects.slice(0, limit);
  const origin = options.origin || siteConfig.site.serverUrl || "https://example.com";

  const sectionTitle =
    lang === "de"
      ? limit < projects.length
        ? "AUSGEWÄHLTE PROJEKTE"
        : "ALLE PROJEKTE"
      : limit < projects.length
      ? "FEATURED PROJECTS"
      : "ALL PROJECTS";

  let out = `\n${divider(sectionTitle)}\n\n`;

  for (let i = 0; i < list.length; i++) {
    out += renderProjectCard(list[i], options);
    if (i < list.length - 1) {
      out += `\n\n`;
    }
  }

  if (limit < projects.length) {
    const remaining = projects.length - limit;
    const moreText =
      lang === "de"
        ? `... und ${remaining} weitere Projekte.`
        : `... and ${remaining} more projects.`;
    out += `\n\n  ${c.dim}${moreText} Run: ${c.brightCyan}curl ${origin}/projects${c.reset}${c.dim} to see all.${c.reset}\n`;
  }

  return out;
}

/**
 * Render full dedicated `/projects` subroute view.
 */
export function renderProjectsSubroute(options: CliRenderOptions = {}): string {
  const lang = options.lang || "en";
  const origin = options.origin || siteConfig.site.serverUrl || "https://example.com";
  const subtitle =
    lang === "de"
      ? `Alle Software-Projekte & Repositories (${projects.length} insgesamt)`
      : `All Software Projects & Repositories (${projects.length} total)`;

  let out = renderHeader(options);
  out += `\n\n${renderRoutePill(`${origin.replace(/^https?:\/\//, "")}/projects`, subtitle)}\n\n`;

  for (let i = 0; i < projects.length; i++) {
    out += renderProjectCard(projects[i], options);
    if (i < projects.length - 1) {
      out += `\n\n`;
    }
  }

  out += `\n\n${divider()}\n`;
  const tipText =
    lang === "de"
      ? `Tipp: Detaillierte README zu einem Projekt ansehen: curl ${origin}/<slug>`
      : `Tip: View detailed README for any project: curl ${origin}/<slug>`;
  out += `${c.dim}${tipText}${c.reset}\n`;
  out += `${c.dim}Example: ${c.brightCyan}curl ${origin}/${projects[0]?.slug || "nexus-cli"}${c.reset}\n`;

  return out;
}

/**
 * Render a single project's deep-dive details.
 */
export function renderProjectDetail(slug: string, options: CliRenderOptions = {}): string {
  const lang = options.lang || "en";
  const origin = options.origin || siteConfig.site.serverUrl || "https://example.com";

  const proj = projects.find(
    (p) => p.slug.toLowerCase() === slug.toLowerCase() || String(p.id).toLowerCase() === slug.toLowerCase()
  );

  if (!proj) {
    return `\n${c.brightRed}Error:${c.reset} Project '${slug}' not found.\nRun ${c.brightCyan}curl ${origin}/projects${c.reset} to see available projects.\n`;
  }

  const title = lang === "de" && proj.titleDe ? proj.titleDe : proj.title;
  const projectType =
    lang === "de" && proj.projectTypeDe ? proj.projectTypeDe : proj.projectType || "Software Project";
  const dateStr = formatProjectDate(proj.developedAt, lang);
  const tags = proj.tags.map((t) => `${c.gray}[${c.brightCyan}${t}${c.gray}]${c.reset}`).join(" ");
  const projectUrl = `${origin}/${proj.slug}`;

  let out = renderHeader(options);
  out += `\n\n${renderRoutePill(`${origin.replace(/^https?:\/\//, "")}/${proj.slug}`, `Project Deep Dive: ${title}`)}\n\n`;

  // Top summary card
  const summaryLines = [
    "",
    `  ${c.gray}Stack:${c.reset}  ${tags}${dateStr ? `  ${c.gray}•${c.reset} ${c.dim}${dateStr}${c.reset}` : ""}`,
    `  ${c.gray}URL:${c.reset}    ${c.brightBlue}${terminalLink(projectUrl, projectUrl)}${c.reset}`,
    "",
  ];
  out += renderCard({
    title: `${c.bold}${c.brightWhite}${title}${c.reset}`,
    rightBadge: `${c.dim}[${c.brightYellow}${projectType}${c.reset}${c.dim}]${c.reset}`,
    lines: summaryLines,
    width: 74,
  });

  out += `\n\n`;

  const mdContent =
    lang === "de" && (proj as { longDescriptionDe?: string }).longDescriptionDe
      ? (proj as { longDescriptionDe?: string }).longDescriptionDe!
      : proj.longDescription || proj.description || "";

  out += formatMarkdownForTerminal(mdContent);
  out += `\n\n${divider()}\n`;
  out += `${c.dim}Back to all projects: ${c.brightCyan}curl ${origin}/projects${c.reset}\n`;

  return out;
}

/**
 * Render categorized skills with boxed cards and visual proficiency meters.
 */
export function renderSkills(options: CliRenderOptions = {}): string {
  const lang = options.lang || "en";
  const sectionTitle = lang === "de" ? "FÄHIGKEITEN & TECHNOLOGIEN" : "SKILLS & TECHNOLOGIES";

  let out = `\n${divider(sectionTitle)}\n\n`;

  for (const cat of skills) {
    const lines: string[] = [""];

    // Format skills in clean 2-column layout inside the card
    const items = cat.skills.map((s) => ({
      name: s.name,
      bar: skillBar(s.level),
      level: s.level,
    }));

    for (let i = 0; i < items.length; i += 2) {
      const left = items[i];
      const right = items[i + 1];

      const leftCol = `  ${c.brightWhite}${left.name.padEnd(14)}${c.reset} ${left.bar}`;
      if (right) {
        const rightCol = `    ${c.brightWhite}${right.name.padEnd(14)}${c.reset} ${right.bar}`;
        lines.push(`${leftCol}${rightCol}`);
      } else {
        lines.push(`${leftCol}`);
      }
    }

    lines.push("");

    out += renderCard({
      title: `${c.bold}${c.brightYellow}${cat.name}${c.reset}`,
      rightBadge: `${c.dim}[${cat.skills.length} ${lang === "de" ? "Technologien" : "Skills"}]${c.reset}`,
      lines,
      width: 74,
    });
    out += "\n\n";
  }

  // Legend
  const legend = `${c.dim}Legend: ${c.brightCyan}■■■■■${c.reset} Expert  ${c.brightCyan}■■■■□${c.reset} Advanced  ${c.brightCyan}■■■□□${c.reset} Proficient  ${c.brightCyan}■■□□□${c.reset} Familiar`;
  out += `  ${legend}\n`;

  return out;
}

/**
 * Render full dedicated `/skills` subroute view.
 */
export function renderSkillsSubroute(options: CliRenderOptions = {}): string {
  const lang = options.lang || "en";
  const origin = options.origin || siteConfig.site.serverUrl || "https://example.com";
  const subtitle =
    lang === "de"
      ? "Technische Fähigkeiten & Kompetenzmatrix"
      : "Technical Skills & Competency Matrix";

  let out = renderHeader(options);
  out += `\n\n${renderRoutePill(`${origin.replace(/^https?:\/\//, "")}/skills`, subtitle)}\n\n`;
  out += renderSkills(options);
  out += `\n${renderCommands(options)}`;
  return out;
}

/**
 * Render Experience & Education from Resume data with boxed cards.
 */
export function renderResume(options: CliRenderOptions = {}): string {
  const lang = options.lang || "en";
  const expTitle = lang === "de" ? "BERUFSERFAHRUNG" : "WORK EXPERIENCE";
  const eduTitle = lang === "de" ? "AUSBILDUNG" : "EDUCATION";

  let out = `\n${divider(expTitle)}\n\n`;

  const items = resume.sections.experience?.items || [];
  for (let i = 0; i < items.length; i++) {
    const exp = items[i];
    if (exp.visible === false) continue;

    const loc = (exp as { location?: string }).location;
    const lines: string[] = [""];

    if (loc) {
      lines.push(`  ${c.gray}Location:${c.reset} ${loc}`);
    }

    if (exp.summary) {
      const wrapped = wrapText(exp.summary, 62);
      lines.push(`  ${c.gray}Summary:${c.reset}  ${wrapped[0]}`);
      for (let j = 1; j < wrapped.length; j++) {
        lines.push(`            ${wrapped[j]}`);
      }
    }
    lines.push("");

    out += renderCard({
      title: `${c.bold}${c.brightWhite}${exp.position}${c.reset} ${c.yellow}@ ${exp.company}${c.reset}`,
      rightBadge: `${c.dim}[${exp.date}]${c.reset}`,
      lines,
      width: 74,
    });

    if (i < items.length - 1) {
      out += `\n\n`;
    }
  }

  const education = resume.sections.education?.items || [];
  if (education.length > 0) {
    out += `\n\n${divider(eduTitle)}\n\n`;
    for (let i = 0; i < education.length; i++) {
      const edu = education[i];
      if (edu.visible === false) continue;

      const lines: string[] = [""];
      const degree = `${edu.studyType ? `${edu.studyType} in ` : ""}${edu.area}`;
      lines.push(`  ${c.brightWhite}${degree}${c.reset}`);
      lines.push("");

      out += renderCard({
        title: `${c.bold}${c.brightYellow}${edu.institution}${c.reset}`,
        rightBadge: `${c.dim}[${edu.date}]${c.reset}`,
        lines,
        width: 74,
      });

      if (i < education.length - 1) {
        out += `\n\n`;
      }
    }
  }

  return out;
}

/**
 * Render full dedicated `/resume` subroute view.
 */
export function renderResumeSubroute(options: CliRenderOptions = {}): string {
  const lang = options.lang || "en";
  const origin = options.origin || siteConfig.site.serverUrl || "https://example.com";
  const p = siteConfig.person;
  const subtitle =
    lang === "de"
      ? `Lebenslauf & Karriereübersicht — ${p.fullName || resume.basics.name}`
      : `Curriculum Vitae & Career History — ${p.fullName || resume.basics.name}`;

  let out = renderHeader(options);
  out += `\n\n${renderRoutePill(`${origin.replace(/^https?:\/\//, "")}/resume`, subtitle)}\n\n`;
  out += renderResume(options);
  out += `\n\n${renderCommands(options)}`;
  return out;
}

/**
 * Render Contact information & Social links inside a styled card.
 */
export function renderContact(options: CliRenderOptions = {}): string {
  const lang = options.lang || "en";
  const p = siteConfig.person;
  const origin = options.origin || siteConfig.site.serverUrl || "https://example.com";
  const sectionTitle = lang === "de" ? "KONTAKT & LINKS" : "CONTACT & SOCIALS";

  let out = `\n${divider(sectionTitle)}\n\n`;

  const contactItems: [string, string, string][] = [];

  if (p.email) {
    contactItems.push(["Email", p.email, `mailto:${p.email}`]);
  }
  if (p.socials?.github) {
    const ghUrl = `https://github.com/${p.socials.github}`;
    contactItems.push(["GitHub", ghUrl, ghUrl]);
  }
  if (p.socials?.linkedin) {
    const liUrl = `https://linkedin.com/in/${p.socials.linkedin}`;
    contactItems.push(["LinkedIn", liUrl, liUrl]);
  }
  contactItems.push(["Website", origin, origin]);
  contactItems.push(["MCP Server", `${origin}/api/mcp`, `${origin}/api/mcp`]);

  const lines: string[] = [""];
  for (const [label, display, link] of contactItems) {
    lines.push(`  ${c.gray}${label.padEnd(12)}:${c.reset} ${c.brightBlue}${terminalLink(display, link)}${c.reset}`);
  }
  lines.push("");

  out += renderCard({
    title: `${c.bold}${c.brightWhite}Contact Card${c.reset}`,
    rightBadge: `${c.dim}[${p.fullName || resume.basics.name}]${c.reset}`,
    lines,
    width: 74,
  });

  return out;
}

/**
 * Render full dedicated `/contact` subroute view.
 */
export function renderContactSubroute(options: CliRenderOptions = {}): string {
  const lang = options.lang || "en";
  const origin = options.origin || siteConfig.site.serverUrl || "https://example.com";
  const subtitle =
    lang === "de"
      ? "Direkte Kontaktdaten & soziale Profile"
      : "Direct Contact Details & Social Profiles";

  let out = renderHeader(options);
  out += `\n\n${renderRoutePill(`${origin.replace(/^https?:\/\//, "")}/contact`, subtitle)}\n\n`;
  out += renderContact(options);
  out += `\n\n${renderCommands(options)}`;
  return out;
}

/**
 * Render Interactive CLI Command hints.
 */
export function renderCommands(options: CliRenderOptions = {}): string {
  const lang = options.lang || "en";
  const origin = options.origin || siteConfig.site.serverUrl || "https://example.com";
  const domain = origin.replace(/^https?:\/\//, "");

  const sectionTitle = lang === "de" ? "TERMINAL BEFEHLE" : "TERMINAL COMMANDS";

  let out = `\n${divider(sectionTitle)}\n\n`;

  const commands = [
    [`curl ${domain}/projects`, lang === "de" ? "Alle Projekte durchsuchen" : "Explore all projects"],
    [`curl ${domain}/${projects[0]?.slug || "nexus-cli"}`, lang === "de" ? "Projektdetails anzeigen" : "View single project deep dive"],
    [`curl ${domain}/skills`, lang === "de" ? "Fähigkeiten-Matrix anzeigen" : "View full skill matrix"],
    [`curl ${domain}/resume`, lang === "de" ? "Vollständigen Lebenslauf ansehen" : "View full CV & career timeline"],
    [`curl ${domain}/contact`, lang === "de" ? "Kontaktdaten abrufen" : "Get direct contact details"],
    [`curl ${domain}?lang=de`, lang === "de" ? "Auf Deutsch anzeigen" : "Switch language to German"],
    [`curl ${domain}?plain=1`, lang === "de" ? "Farbloser Plaintext (für Pipes/Grep)" : "Raw plaintext (strip ANSI)"],
    [`curl ${domain}?json=1`, lang === "de" ? "Maschinenlesbare JSON-Zusammenfassung" : "Structured JSON payload"],
  ];

  for (const [cmd, desc] of commands) {
    out += `  ${c.brightCyan}${cmd.padEnd(42)}${c.reset} ${c.dim}# ${desc}${c.reset}\n`;
  }

  out += `\n${divider()}\n`;
  return out;
}

/**
 * Render full portfolio terminal view (default root view).
 */
export function renderFullPortfolio(options: CliRenderOptions = {}): string {
  let out = "";
  out += renderHeader(options);
  out += renderAbout(options);
  out += renderProjects({ ...options, projectLimit: 3 });
  out += renderSkills(options);
  out += renderResume(options);
  out += renderContact(options);
  out += renderCommands(options);
  return out;
}

/**
 * Render machine-readable JSON representation.
 */
export function renderJsonSummary(options: CliRenderOptions = {}): string {
  const origin = options.origin || siteConfig.site.serverUrl || "https://example.com";
  const p = siteConfig.person;

  const data = {
    name: p.fullName || resume.basics.name,
    headline: p.headline,
    location: `${p.address.city}, ${p.address.country}`,
    website: origin,
    email: p.email,
    socials: {
      github: p.socials.github ? `https://github.com/${p.socials.github}` : null,
      linkedin: p.socials.linkedin ? `https://linkedin.com/in/${p.socials.linkedin}` : null,
    },
    summary: resume.sections.summary?.content || "",
    featuredProjects: projects.map((proj) => ({
      id: proj.id,
      slug: proj.slug,
      title: proj.title,
      description: proj.description,
      tags: proj.tags,
      categories: proj.categories,
      url: `${origin}/${proj.slug}`,
    })),
    skills: skills.map((cat) => ({
      category: cat.name,
      skills: cat.skills.map((s) => ({ name: s.name, level: s.level })),
    })),
    experience: resume.sections.experience.items
      .filter((e) => e.visible !== false)
      .map((e) => ({
        company: e.company,
        position: e.position,
        date: e.date,
        summary: e.summary,
      })),
  };

  return JSON.stringify(data, null, 2);
}
