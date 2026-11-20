import { getMasterResume } from "@/lib/resume/variants";
import { validateResumeLayout } from "@/lib/resume/validator";
import { loadRoleProfiles } from "./data";
import { hasKeyword } from "./keywords";
import { getCareerProjects, toResumeItem } from "./projects";
import { queryCourses, getTheses, RankedCourse } from "./coursework";
import type { CareerProject, RoleProfileConfig } from "@/types/career";
import type { ResumeData, ResumeItem, ResumeSection } from "@/types/resume";

const MAX_RESUME_PROJECTS = 4;
const MAX_EXPERIENCE = 4;
const MAX_EDUCATION = 2;
const MAX_SKILLS = 6;
const EXPERIENCE_SUMMARY_MAX = 200;

export function listRoleConfigs(): RoleProfileConfig[] {
  return loadRoleProfiles().roles ?? [];
}

export function getRoleConfig(roleId: string): RoleProfileConfig | undefined {
  return listRoleConfigs().find((r) => r.roleId === roleId);
}

const norm = (s: string) => s.toLowerCase();

/** Track weight: the role's primary track counts most, secondary tracks less. */
function trackScore(itemTracks: string[], cfg: RoleProfileConfig): number {
  return cfg.tracks.reduce(
    (sum, t, i) => sum + (itemTracks.includes(t) ? (i === 0 ? 10 : 4) : 0),
    0
  );
}

function keywordScore(text: string, cfg: RoleProfileConfig): number {
  return cfg.keywords.reduce((sum, k) => sum + (hasKeyword(text, k) ? 1 : 0), 0);
}

export interface RankedProject extends CareerProject {
  relevance: number;
}

export function rankProjects(cfg: RoleProfileConfig): RankedProject[] {
  const pins = (cfg.featuredProjects ?? []).map(norm);
  return getCareerProjects()
    .map((p) => {
      const pin = pins.indexOf(norm(p.id));
      const text = [p.name, p.summary, ...p.highlights, ...p.technologies].join(" ");
      const relevance =
        (pin >= 0 ? 100 - pin * 5 : 0) + trackScore(p.tracks, cfg) + keywordScore(text, cfg);
      return { ...p, relevance };
    })
    .filter((p) => p.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance || (b.date ?? "").localeCompare(a.date ?? ""));
}

export function rankCourses(cfg: RoleProfileConfig): RankedCourse[] {
  const pins = (cfg.featuredCourses ?? []).map(norm);
  return queryCourses({})
    .map((c) => {
      const pin = pins.indexOf(norm(c.name));
      const text = [c.name, c.summary ?? "", ...c.keywords].join(" ");
      const relevance =
        (pin >= 0 ? 100 - pin * 5 : 0) + trackScore(c.tracks, cfg) + keywordScore(text, cfg);
      return { ...c, relevance };
    })
    .filter((c) => c.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance || (b.grade ?? -1) - (a.grade ?? -1));
}

const asHtml = (text: string) => (/^\s*</.test(text) ? text : `<p>${text}</p>`);
const plainLength = (html: string) => html.replace(/<[^>]*>/g, "").trim().length;

function orderById(items: ResumeItem[], order: string[] = []): ResumeItem[] {
  const rank = (id: string) => {
    const i = order.indexOf(id);
    return i < 0 ? order.length : i;
  };
  return items
    .map((item, idx) => ({ item, idx }))
    .sort((a, b) => rank(a.item.id) - rank(b.item.id) || a.idx - b.idx)
    .map(({ item }) => item);
}

/** Reorders the master skill groups by overlap with the role's keywords. */
function fallbackSkills(master: ResumeSection, cfg: RoleProfileConfig): ResumeItem[] {
  return [...master.items]
    .filter((s) => s.visible !== false)
    .sort(
      (a, b) =>
        keywordScore([b.name ?? "", ...(b.keywords ?? [])].join(" "), cfg) -
        keywordScore([a.name ?? "", ...(a.keywords ?? [])].join(" "), cfg)
    )
    .slice(0, MAX_SKILLS);
}

/** Builds a single-page-safe ResumeData tailored to the role. */
export function buildRoleResume(cfg: RoleProfileConfig, projects: CareerProject[]): ResumeData {
  const master = getMasterResume();
  const s = master.sections;

  const experience = orderById(
    (s.experience?.items ?? []).filter((i) => i.visible !== false),
    cfg.experienceOrder
  )
    .slice(0, MAX_EXPERIENCE)
    .map((item) => {
      const override = cfg.experienceSummaries?.[item.id];
      const summary = override ? asHtml(override) : item.summary;
      return {
        ...item,
        visible: true,
        ...(summary && plainLength(summary) <= EXPERIENCE_SUMMARY_MAX ? { summary } : { summary: "" }),
      };
    });

  const eduVisible = (s.education?.items ?? []).filter((i) => i.visible !== false);
  const education = (cfg.education?.length
    ? cfg.education
        .map((id) => eduVisible.find((e) => e.id === id))
        .filter((e): e is ResumeItem => Boolean(e))
    : eduVisible
  ).slice(0, MAX_EDUCATION);

  const skills: ResumeItem[] = cfg.skills.length
    ? cfg.skills.slice(0, MAX_SKILLS).map((sk, i) => ({
        id: `${cfg.roleId}-skill-${i + 1}`,
        visible: true,
        name: sk.name,
        keywords: sk.keywords ?? [],
      }))
    : fallbackSkills(s.skills, cfg);

  const languages = (s.languages?.items ?? []).filter((i) => i.visible !== false).slice(0, 3);

  return {
    basics: { ...master.basics, headline: cfg.headline },
    display: { experience: experience.length, education: education.length },
    sections: {
      summary: { ...s.summary, content: asHtml(cfg.positioning) },
      experience: { ...s.experience, visible: true, items: experience },
      education: { ...s.education, visible: true, items: education },
      skills: { ...s.skills, visible: true, items: skills },
      languages: { ...s.languages, items: languages },
      profiles: s.profiles,
      projects: {
        name: "Projects",
        visible: true,
        items: projects.slice(0, MAX_RESUME_PROJECTS).map(toResumeItem),
      },
    },
  };
}

/**
 * Projects for the CV itself: pinned ones and those on the role's primary
 * track (a secondary-track match alone is too weak for a one-page CV), topped
 * up from the ranked list to at least 3.
 */
function pickResumeProjects(
  cfg: RoleProfileConfig,
  ranked: RankedProject[],
  max: number
): RankedProject[] {
  const pins = (cfg.featuredProjects ?? []).map(norm);
  const strong = ranked.filter((p) => pins.includes(norm(p.id)) || p.tracks.includes(cfg.tracks[0]));
  const picked = strong.slice(0, max);
  for (const p of ranked) {
    if (picked.length >= Math.min(3, max)) break;
    if (!picked.includes(p)) picked.push(p);
  }
  return picked;
}

export function buildRoleProfile(
  roleId: string,
  opts: { maxProjects?: number; maxCourses?: number } = {}
) {
  const cfg = getRoleConfig(roleId);
  if (!cfg) return null;

  const resumeProjectCount = Math.min(Math.max(opts.maxProjects ?? MAX_RESUME_PROJECTS, 1), MAX_RESUME_PROJECTS);
  const maxCourses = Math.max(opts.maxCourses ?? 6, 1);

  const projects = rankProjects(cfg);
  const courses = rankCourses(cfg);
  let resumeData = buildRoleResume(cfg, pickResumeProjects(cfg, projects, resumeProjectCount));

  // Safety net: if a config edit overflows the page, drop the oldest experience.
  let validation = validateResumeLayout(resumeData);
  while (!validation.valid && resumeData.sections.experience.items.length > 2) {
    const items = resumeData.sections.experience.items.slice(0, -1);
    resumeData = {
      ...resumeData,
      display: { ...resumeData.display, experience: items.length },
      sections: { ...resumeData.sections, experience: { ...resumeData.sections.experience, items } },
    };
    validation = validateResumeLayout(resumeData);
  }

  return {
    roleId: cfg.roleId,
    title: cfg.title,
    positioning: cfg.positioning,
    topSkills: cfg.skills.map((sk) => sk.name),
    resumeData,
    layoutValidation: {
      valid: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings,
      budgetMetrics: validation.budget,
      note: "The CV template renders experience, education, skills and languages; sections.projects is carried as data (selected projects for the agent and the cover letter) and is not drawn on the PDF.",
    },
    relevantCoursework: courses.slice(0, maxCourses).map((c) => ({
      name: c.name,
      grade: c.grade ?? null,
      ects: c.ects,
      program: c.program,
      institution: c.institution,
      summary: c.summary,
      relevance: c.relevance,
    })),
    theses: getTheses().filter((t) => cfg.tracks.some((tr) => t.tracks.includes(tr))),
    allMatchingProjects: projects,
  };
}

export function listRoleProfiles() {
  return listRoleConfigs().map((cfg) => ({
    roleId: cfg.roleId,
    title: cfg.title,
    positioning: cfg.positioning,
    topSkills: cfg.skills.map((s) => s.name),
    projectCount: rankProjects(cfg).length,
    courseCount: rankCourses(cfg).length,
  }));
}
