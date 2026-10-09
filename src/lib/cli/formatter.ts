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
    .replace(/^### (.*$)/gim, `\n${c.bold}${c.yellow}▸ $1${c.reset}`)
    .replace(/^## (.*$)/gim, `\n${c.bold}${c.brightCyan}◆ $1${c.reset}\n`)
    .replace(/^# (.*$)/gim, `\n${c.bold}${c.brightCyan}══ $1 ══${c.reset}\n`)
    // Convert bullet lists
    .replace(/^[\*\-] (.*$)/gim, `  ${c.cyan}•${c.reset} $1`)
    // Convert bold & italic
    .replace(/\*\*(.*?)\*\*/g, `${c.bold}$1${c.reset}`)
    .replace(/\*(.*?)\*/g, `${c.italic}$1${c.reset}`)
    // Convert inline code
    .replace(/`([^`]+)`/g, `${c.yellow}$1${c.reset}`)
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
  const p = siteConfig.person;
  const origin = options.origin || siteConfig.site.serverUrl || "https://codeby.joeldettinger.de";
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

  const location = `${p.address.city}${p.address.city && p.address.country ? ", " : ""}${p.address.country}`;
  const webLink = terminalLink(origin, origin);

  const promptLine = `${c.gray}╭─${c.reset} ${c.brightGreen}${name.toLowerCase().replace(/\s+/g, "")}${c.gray}@${c.brightBlue}terminal${c.reset} ${c.gray}in${c.reset} ${c.yellow}~${c.reset} ${c.gray}on${c.reset} ${c.brightMagenta}main${c.reset}
${c.gray}╰─${c.reset} ${c.brightCyan}❯${c.reset} ${c.bold}${name}${c.reset} ${c.gray}—${c.reset} ${c.brightYellow}${p.headline}${c.reset}`;

  const metaPill = `${c.gray}📍 ${location || "Remote"}  ${c.gray}│${c.reset}  ${c.brightGreen}● Available for hire${c.reset}  ${c.gray}│${c.reset}  🌐 ${c.brightBlue}${webLink}${c.reset}`;

  return `${asciiArt}\n\n${promptLine}\n${metaPill}\n${divider()}`;
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
    out += `\n${summary}\n`;
  }

  if (rotations.length > 0) {
    out += `\n${c.bold}${c.brightCyan}Core Focus Areas:${c.reset}\n`;
    for (const item of rotations) {
      const roleStr = `${c.brightYellow}${item.role.padEnd(22)}${c.reset}`;
      const adjectives = item.adjectives?.length ? item.adjectives.join(", ") : "";
      const desc = adjectives ? `${adjectives} ${item.artifacts || ""}` : (item.artifacts || "");
      out += `  ${c.cyan}▸${c.reset} ${roleStr} ${c.dim}${desc}${c.reset}\n`;
    }
  }

  return out;
}

/**
 * Render Projects Section (all or limited).
 */
export function renderProjects(options: CliRenderOptions = {}): string {
  const lang = options.lang || "en";
  const limit = options.projectLimit ?? projects.length;
  const list = projects.slice(0, limit);
  const origin = options.origin || siteConfig.site.serverUrl || "https://codeby.joeldettinger.de";

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
    const proj = list[i];
    const title = lang === "de" && proj.titleDe ? proj.titleDe : proj.title;
    const desc = lang === "de" && proj.descriptionDe ? proj.descriptionDe : proj.description;
    const projectType =
      lang === "de" && proj.projectTypeDe ? proj.projectTypeDe : proj.projectType || proj.categories?.[0] || "Project";
    const projectUrl = `${origin}/${proj.slug}`;
    const clickUrl = terminalLink(projectUrl, projectUrl);

    const tagBadges = proj.tags.map((t) => `${c.gray}[${c.cyan}${t}${c.gray}]${c.reset}`).join(" ");

    out += `  ${c.bold}${c.brightWhite}${title}${c.reset}  ${c.dim}(${projectType})${c.reset}\n`;
    if (tagBadges) {
      out += `  ${tagBadges}\n`;
    }
    out += `  ${desc}\n`;
    out += `  ${c.gray}Link:${c.reset} ${c.brightBlue}${clickUrl}${c.reset}\n`;

    if (i < list.length - 1) {
      out += `\n`;
    }
  }

  if (limit < projects.length) {
    const remaining = projects.length - limit;
    const moreText =
      lang === "de"
        ? `... und ${remaining} weitere Projekte.`
        : `... and ${remaining} more projects.`;
    out += `\n  ${c.dim}${moreText} Run: ${c.brightCyan}curl ${origin}/projects${c.reset}${c.dim} to see all.${c.reset}\n`;
  }

  return out;
}

/**
 * Render a single project's deep-dive details.
 */
export function renderProjectDetail(slug: string, options: CliRenderOptions = {}): string {
  const lang = options.lang || "en";
  const origin = options.origin || siteConfig.site.serverUrl || "https://codeby.joeldettinger.de";

  const proj = projects.find(
    (p) => p.slug.toLowerCase() === slug.toLowerCase() || String(p.id).toLowerCase() === slug.toLowerCase()
  );

  if (!proj) {
    return `\n${c.brightRed}Error:${c.reset} Project '${slug}' not found.\nRun ${c.brightCyan}curl ${origin}/projects${c.reset} to see available projects.\n`;
  }

  const title = lang === "de" && proj.titleDe ? proj.titleDe : proj.title;
  const projectType =
    lang === "de" && proj.projectTypeDe ? proj.projectTypeDe : proj.projectType || "Software Project";
  const tags = proj.tags.map((t) => `${c.gray}[${c.cyan}${t}${c.gray}]${c.reset}`).join(" ");
  const projectUrl = `${origin}/${proj.slug}`;

  let out = renderHeader(options);
  out += `\n${divider(title.toUpperCase())}\n\n`;
  out += `  ${c.bold}${c.brightWhite}${title}${c.reset} ${c.dim}(${projectType})${c.reset}\n`;
  out += `  ${tags}\n`;
  out += `  ${c.gray}URL:${c.reset} ${c.brightBlue}${terminalLink(projectUrl, projectUrl)}${c.reset}\n\n`;

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
 * Render categorized skills with visual proficiency meters.
 */
export function renderSkills(options: CliRenderOptions = {}): string {
  const lang = options.lang || "en";
  const sectionTitle = lang === "de" ? "FÄHIGKEITEN & TECHNOLOGIEN" : "SKILLS & TECHNOLOGIES";

  let out = `\n${divider(sectionTitle)}\n\n`;

  for (const cat of skills) {
    out += `  ${c.bold}${c.brightYellow}${cat.name}${c.reset}\n`;

    // Format skills neatly with rating meters
    const lineItems: string[] = [];
    for (const s of cat.skills) {
      lineItems.push(`${s.name} ${skillBar(s.level)}`);
    }

    // Wrap items across lines nicely
    let currentLine = "    ";
    for (const item of lineItems) {
      if (stripAnsi(currentLine).length + stripAnsi(item).length + 4 > 74) {
        out += `${currentLine}\n`;
        currentLine = `    ${item}    `;
      } else {
        currentLine += `${item}    `;
      }
    }
    if (currentLine.trim()) {
      out += `${currentLine}\n`;
    }
    out += `\n`;
  }

  return out;
}

/**
 * Render Experience & Education from Resume data.
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

    out += `  ${c.bold}${c.brightWhite}${exp.position}${c.reset}  ${c.brightYellow}@ ${exp.company}${c.reset}\n`;
    const loc = (exp as { location?: string }).location;
    out += `  ${c.dim}${exp.date}${loc ? `  •  ${loc}` : ""}${c.reset}\n`;
    if (exp.summary) {
      out += `  ${exp.summary}\n`;
    }
    if (i < items.length - 1) {
      out += `\n`;
    }
  }

  const education = resume.sections.education?.items || [];
  if (education.length > 0) {
    out += `\n\n${divider(eduTitle)}\n\n`;
    for (let i = 0; i < education.length; i++) {
      const edu = education[i];
      if (edu.visible === false) continue;
      out += `  ${c.bold}${c.brightWhite}${edu.studyType ? `${edu.studyType} in ` : ""}${edu.area}${c.reset}\n`;
      out += `  ${c.yellow}${edu.institution}${c.reset}  ${c.dim}(${edu.date})${c.reset}\n`;
      if (i < education.length - 1) {
        out += `\n`;
      }
    }
  }

  return out;
}

/**
 * Render Contact information & Social links.
 */
export function renderContact(options: CliRenderOptions = {}): string {
  const lang = options.lang || "en";
  const p = siteConfig.person;
  const origin = options.origin || siteConfig.site.serverUrl || "https://codeby.joeldettinger.de";
  const sectionTitle = lang === "de" ? "KONTAKT & LINKS" : "CONTACT & SOCIALS";

  let out = `\n${divider(sectionTitle)}\n\n`;

  const items: [string, string, string][] = [];

  if (p.email) {
    items.push(["Email", p.email, `mailto:${p.email}`]);
  }
  if (p.socials?.github) {
    const ghUrl = `https://github.com/${p.socials.github}`;
    items.push(["GitHub", ghUrl, ghUrl]);
  }
  if (p.socials?.linkedin) {
    const liUrl = `https://linkedin.com/in/${p.socials.linkedin}`;
    items.push(["LinkedIn", liUrl, liUrl]);
  }
  if (resume.basics?.url?.href) {
    items.push(["Website", origin, origin]);
  }
  items.push(["MCP Server", `${origin}/api/mcp`, `${origin}/api/mcp`]);

  for (const [label, display, link] of items) {
    const padded = `${label}:`.padEnd(14);
    out += `  ${c.gray}${padded}${c.reset} ${c.brightBlue}${terminalLink(display, link)}${c.reset}\n`;
  }

  return out;
}

/**
 * Render Interactive CLI Command hints.
 */
export function renderCommands(options: CliRenderOptions = {}): string {
  const lang = options.lang || "en";
  const origin = options.origin || siteConfig.site.serverUrl || "https://codeby.joeldettinger.de";
  const domain = origin.replace(/^https?:\/\//, "");

  const sectionTitle = lang === "de" ? "TERMINAL BEFEHLE" : "TERMINAL COMMANDS";

  let out = `\n${divider(sectionTitle)}\n\n`;

  const commands = [
    [`curl ${domain}/projects`, lang === "de" ? "Alle Projekte durchsuchen" : "Explore all projects"],
    [`curl ${domain}/nexus-cli`, lang === "de" ? "Projektdetails anzeigen" : "View single project deep dive"],
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
  const origin = options.origin || siteConfig.site.serverUrl || "https://codeby.joeldettinger.de";
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
