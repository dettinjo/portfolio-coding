import fs from "fs";
import path from "path";
import projectsBundled from "@/data/projects.json";
import techRegistry from "@/data/tech-registry.json";
import { loadExtraProjects } from "./data";
import {
  extractFirstParagraph,
  extractHighlights,
  parseDateOverride,
  summarize,
} from "@/lib/projects/readme";
import type { CareerProject, ProjectOverride, TrackId } from "@/types/career";
import type { ResumeItem } from "@/types/resume";

// ─── Source data ─────────────────────────────────────────────────────────────
//
// Projects come from the same GitHub ingestion as the website: repos owned by
// the account and tagged `portfolio` (linked) or `portfolio-private` (no link).
//
//  1. Build-time artifact — src/data/projects.json, written by
//     scripts/fetch-portfolio.ts on every deploy. Used by default; serving the
//     MCP never calls GitHub.
//  2. On-demand sync — `sync_github_projects` re-reads the repos live and
//     caches the result in memory and in /tmp (container-local, so a redeploy
//     falls back to the fresher build artifact).
//
// extra-projects.json (private config repo) then overrides fields or adds
// non-GitHub projects.

export interface RawProject {
  id: string;
  title: string;
  description: string;
  readme: string;
  url?: string;
  language?: string;
  tags: string[];
  date?: string;
}

interface BuildProject {
  slug: string;
  title: string;
  description?: string;
  longDescription?: string;
  repoUrl?: string;
  projectType?: string;
  developedAt?: string;
  tags?: string[];
}

export interface GithubSyncState {
  source: "build" | "github-sync";
  syncedAt: string | null;
  projects: RawProject[];
}

const SYNC_CACHE_FILE = path.join("/tmp", "career-hub", "github-projects.json");
let syncCache: GithubSyncState | null = null;

function fromBuildArtifact(): RawProject[] {
  let list: BuildProject[] = projectsBundled as unknown as BuildProject[];
  const filePath = path.join(process.cwd(), "src", "data", "projects.json");
  try {
    if (fs.existsSync(filePath)) list = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    // keep bundled
  }
  return (Array.isArray(list) ? list : []).map((p) => ({
    id: p.slug.toLowerCase(),
    title: p.title,
    description: p.description || "",
    readme: p.longDescription || "",
    url: p.repoUrl || undefined,
    language: p.projectType && p.projectType !== "Software Project" ? p.projectType : undefined,
    tags: p.tags || [],
    date: p.developedAt,
  }));
}

function readSyncCache(): GithubSyncState | null {
  if (syncCache) return syncCache;
  try {
    if (fs.existsSync(SYNC_CACHE_FILE)) {
      syncCache = JSON.parse(fs.readFileSync(SYNC_CACHE_FILE, "utf8")) as GithubSyncState;
      return syncCache;
    }
  } catch {
    // ignore a corrupt cache
  }
  return null;
}

function currentSource(): GithubSyncState {
  return readSyncCache() ?? { source: "build", syncedAt: null, projects: fromBuildArtifact() };
}

// ─── Runtime GitHub sync ─────────────────────────────────────────────────────

export const CONTROL_TOPICS = new Set(["portfolio", "portfolio-private", "portfolio-config"]);
const normalizeTech = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const registryByNorm: Record<string, string> = {};
for (const [key, detail] of Object.entries(techRegistry as Record<string, { name?: string }>)) {
  const name = detail.name || key;
  registryByNorm[normalizeTech(key)] = name;
  registryByNorm[normalizeTech(name)] = name;
}
/** True when the topic matches a curated tech-registry entry (icon + skill scoring). */
export const isRegisteredTech = (topic: string): boolean => normalizeTech(topic) in registryByNorm;

/** Display names of every curated tech-registry entry. */
export const registeredTechNames = (): string[] =>
  Array.from(new Set(Object.values(registryByNorm))).sort((a, b) => a.localeCompare(b));

export const displayTag = (topic: string): string =>
  registryByNorm[normalizeTech(topic)] ??
  topic.replace(/[-_]+/g, " ").trim().replace(/\b\w/g, (c) => c.toUpperCase());

/** Drops the language switcher, portfolio comments and the first H1 (→ title). */
export function stripReadme(markdown: string): { title: string; body: string } {
  let title = "";
  const kept: string[] = [];
  for (const line of markdown.replace(/\r\n/g, "\n").split("\n")) {
    if (/\]\(README(\.[a-z]{2})?\.md\)/i.test(line) && /^\s*[[<]/.test(line)) continue;
    if (/^\s*<!--\s*portfolio:/i.test(line)) continue;
    const h1 = line.match(/^#\s+(.+?)\s*$/);
    if (h1 && !title) {
      title = h1[1].trim();
      continue;
    }
    kept.push(line);
  }
  return { title, body: kept.join("\n").trim() };
}

interface GithubRepo {
  name: string;
  owner?: { login?: string };
  topics?: string[];
  description?: string | null;
  html_url: string;
  language?: string | null;
  created_at?: string;
}

/**
 * Re-reads all `portfolio` / `portfolio-private` repos from GitHub (README,
 * topics, primary language) and replaces the project cache.
 */
export async function syncGithubProjects(): Promise<{
  count: number;
  syncedAt: string;
  owner: string;
  projects: string[];
  errors: string[];
}> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN is not set on the server — cannot sync from GitHub.");
  }
  const headers = {
    "User-Agent": "portfolio-career-hub",
    Accept: "application/vnd.github.v3+json",
    Authorization: `token ${token}`,
  };
  const gh = async <T>(url: string): Promise<T> => {
    const res = await fetch(url, { headers, cache: "no-store" });
    if (!res.ok) throw new Error(`GitHub API ${res.status} for ${url}`);
    return (await res.json()) as T;
  };

  const owner =
    process.env.GITHUB_USER ||
    process.env.NEXT_PUBLIC_GITHUB_USERNAME ||
    (await gh<{ login: string }>("https://api.github.com/user")).login;

  const repos: GithubRepo[] = [];
  for (let page = 1; page <= 5; page++) {
    const batch = await gh<GithubRepo[]>(
      `https://api.github.com/user/repos?per_page=100&type=all&page=${page}`
    );
    repos.push(...batch);
    if (batch.length < 100) break;
  }

  const selected = repos.filter(
    (r) =>
      r.owner?.login === owner &&
      (r.topics || []).some((t) => t === "portfolio" || t === "portfolio-private")
  );

  const errors: string[] = [];
  const projects = await Promise.all(
    selected.map(async (repo): Promise<RawProject> => {
      const linked = (repo.topics || []).includes("portfolio");
      let readmeRaw = "";
      try {
        const file = await gh<{ content?: string }>(
          `https://api.github.com/repos/${owner}/${repo.name}/contents/README.md`
        );
        readmeRaw = file.content ? Buffer.from(file.content, "base64").toString("utf8") : "";
      } catch (e) {
        errors.push(`${repo.name}: README not readable (${e instanceof Error ? e.message : e})`);
      }
      const { title, body } = stripReadme(readmeRaw);
      const tags = (repo.topics || []).filter((t) => !CONTROL_TOPICS.has(t)).map(displayTag);
      return {
        id: repo.name.toLowerCase(),
        title: title || repo.name.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        description: extractFirstParagraph(body) || repo.description || "",
        readme: body,
        url: linked ? repo.html_url : undefined,
        language: repo.language || undefined,
        tags,
        date: parseDateOverride(readmeRaw) || repo.created_at,
      };
    })
  );

  const syncedAt = new Date().toISOString();
  syncCache = { source: "github-sync", syncedAt, projects };
  try {
    fs.mkdirSync(path.dirname(SYNC_CACHE_FILE), { recursive: true });
    fs.writeFileSync(SYNC_CACHE_FILE, JSON.stringify(syncCache), "utf8");
  } catch (e) {
    errors.push(`Could not persist sync cache: ${e instanceof Error ? e.message : e}`);
  }

  return { count: projects.length, syncedAt, owner, projects: projects.map((p) => p.id), errors };
}

export function getProjectSourceInfo(): { source: string; syncedAt: string | null; count: number } {
  const s = currentSource();
  return { source: s.source, syncedAt: s.syncedAt, count: s.projects.length };
}

// ─── Track inference ─────────────────────────────────────────────────────────

/**
 * Built-in signals per track. A project joins a track at ≥ 2 points:
 * each matching technology = 1 point, each matching text pattern (in the
 * summary and highlights) = 1 point.
 */
const TRACK_SIGNALS: Record<TrackId, { tech: string[]; text: RegExp[] }> = {
  ai_engineer: {
    tech: ["PyTorch", "Hugging Face", "Transformers", "spaCy", "Stanza", "LLM", "NLP", "TensorFlow", "scikit-learn", "Meta Llama", "Machine Learning", "OpenAI", "MCP"],
    text: [/\bLLMs?\b/i, /machine learning/i, /\bNLP\b/i, /\bXAI\b|explainab/i, /neural|deep learning/i, /\bAI\b/],
  },
  fullstack_engineer: {
    tech: ["Next.js", "React", "TypeScript", "Node.js", "Express.js", "GraphQL", "Laravel", "Tailwind CSS", "Strapi", "Vue.js", "Angular", "Full-Stack", "PHP", "JavaScript"],
    text: [/full[- ]stack/i, /frontend|front-end/i, /\bweb app/i, /dashboard/i],
  },
  backend_distributed: {
    tech: ["FastAPI", "Fastapi", "PostgreSQL", "Redis", "MongoDB", "MySQL", "Flask", "Express.js", "GraphQL", "REST API", "Microservices", "Python", "Node.js", "SQLite", "Kubernetes"],
    text: [/\bAPI\b/, /background (sync|worker|job)/i, /rate limit/i, /distributed/i, /microservice/i, /queue/i],
  },
  data_analyst_engineer: {
    tech: ["Pandas", "R", "SQL", "PostgreSQL", "Wikidata", "Data Processing", "Jupyter", "NumPy"],
    text: [/\bdata\b/i, /\bSPARQL\b/i, /analys(is|e)/i, /statistic/i, /dataset/i, /knowledge graph/i],
  },
  cloud_devops_engineer: {
    tech: ["Docker", "Kubernetes", "Terraform", "Terragrunt", "Ansible", "GitLab CI/CD", "GitHub Actions", "NGINX", "cert-manager", "Prometheus", "Grafana", "Tailscale", "Coolify", "Komodo", "Microsoft Azure", "AWS", "Caddy", "GitOps", "Infrastructure as Code", "Infrastructure as Code (IaC)", "DevOps", "Cloud Infrastructure", "Shell Scripting", "Ingress"],
    text: [/\bIaC\b|infrastructure as code/i, /\bCI\/CD\b/i, /deploy/i, /kubernetes|\bk8s\b/i, /disaster recovery/i, /observability|monitor/i],
  },
  security_ml_engineer: {
    tech: ["JWT", "SSL/TLS", "SOPS", "age", "OAuth"],
    text: [/encrypt/i, /\bAES/i, /\bJWT\b/i, /secret/i, /\bGDPR\b/i, /security|secure/i, /authenticat/i, /privacy/i, /adversarial/i],
  },
};

export const KNOWN_TRACKS = Object.keys(TRACK_SIGNALS);

function inferTracks(technologies: string[], text: string): TrackId[] {
  const techNorm = new Set(technologies.map(normalizeTech));
  const out: TrackId[] = [];
  for (const [track, sig] of Object.entries(TRACK_SIGNALS)) {
    const techHits = new Set(sig.tech.map(normalizeTech).filter((t) => techNorm.has(t))).size;
    const textHits = sig.text.filter((re) => re.test(text)).length;
    if (techHits + textHits >= 2) out.push(track);
  }
  return out;
}

// ─── Assembly ────────────────────────────────────────────────────────────────

const unique = <T,>(xs: T[]) => Array.from(new Set(xs));

export function buildProject(raw: RawProject | null, id: string, o: ProjectOverride = {}): CareerProject {
  const technologies =
    o.technologies ??
    unique([...(raw?.language ? [raw.language] : []), ...(raw?.tags ?? [])]).slice(0, 12);
  const summary = o.summary ?? summarize(raw?.description || "");
  const highlights = o.highlights ?? (raw ? extractHighlights(raw.readme, 2) : []);
  // Summary + highlights only: a whole README mentions "data", "deploy" or
  // "secure" somewhere almost always, which made every project match every track.
  const textForTracks = [summary, ...highlights].join("\n");
  const tracks =
    o.tracks ?? unique([...inferTracks(technologies, textForTracks), ...(o.extraTracks ?? [])]);
  const url = o.url === null ? undefined : (o.url ?? raw?.url);
  const date = (o.date ?? raw?.date)?.slice(0, 10);

  return {
    id,
    name: o.name ?? raw?.title ?? id,
    ...(url ? { url } : {}),
    technologies,
    ...(date ? { date } : {}),
    summary,
    highlights,
    tracks,
    source: raw ? "github" : "manual",
    ...(o.context ? { context: o.context } : {}),
  };
}

/** All resume projects (GitHub + overrides + manual), newest first. */
export function getCareerProjects(): CareerProject[] {
  const overrides = loadExtraProjects().projects ?? {};
  const raws = currentSource().projects;
  const byId = new Map(raws.map((r) => [r.id, r]));

  const out: CareerProject[] = [];
  for (const raw of raws) {
    const o = overrides[raw.id];
    if (o?.hidden) continue;
    out.push(buildProject(raw, raw.id, o));
  }
  for (const [id, o] of Object.entries(overrides)) {
    if (byId.has(id.toLowerCase()) || o.hidden) continue;
    if (!o.name || !o.summary) continue; // a manual entry needs at least name + summary
    out.push(buildProject(null, id, o));
  }
  return out.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "2025-03-01" → "March, 2025" (matches the experience date style). */
export function formatProjectDate(iso?: string): string | undefined {
  if (!iso) return undefined;
  const [y, m] = iso.split("-").map(Number);
  if (!y) return undefined;
  return m ? `${MONTHS[m - 1]}, ${y}` : String(y);
}

/** Maps a CareerProject to a ResumeData `projects` item. */
export function toResumeItem(p: CareerProject): ResumeItem & Record<string, unknown> {
  return {
    id: p.id,
    visible: true,
    name: p.name,
    description: p.context ?? p.technologies.slice(0, 4).join(" · "),
    date: formatProjectDate(p.date),
    summary: p.summary,
    keywords: p.technologies,
    ...(p.url ? { url: { href: p.url } } : {}),
    highlights: p.highlights,
    tracks: p.tracks,
  };
}
