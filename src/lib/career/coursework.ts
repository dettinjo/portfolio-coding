import { loadCoursework } from "./data";
import { hasKeyword } from "./keywords";
import type { Course, Thesis, TrackId } from "@/types/career";

export interface RankedCourse extends Course {
  program: string;
  institution: string;
  relevance: number;
}

export interface CourseworkQuery {
  /** A track / role id, e.g. "ai_engineer". */
  track?: TrackId;
  /** Only graded courses at or above this grade (ungraded modules are excluded). */
  minGrade?: number;
  /** Extra keywords that raise relevance (used by role profiles). */
  keywords?: string[];
  /** Course names pinned to the top. */
  featured?: string[];
}

const norm = (s: string) => s.toLowerCase().trim();

function relevanceOf(course: Course, q: CourseworkQuery): number {
  let score = 0;
  if (q.track && course.tracks.includes(q.track)) score += 10;
  if (q.keywords?.length) {
    const hay = [course.name, course.summary ?? "", ...course.keywords].join(" ");
    for (const k of q.keywords) if (hasKeyword(hay, k)) score += 1;
  }
  const pin = q.featured?.findIndex((f) => norm(f) === norm(course.name)) ?? -1;
  if (pin >= 0) score += 100 - pin;
  return score;
}

/**
 * Courses matching the query, sorted by relevance (pinned → track → keywords)
 * when a track/keywords are given, otherwise by grade. Ties break on grade.
 */
export function queryCourses(q: CourseworkQuery = {}): RankedCourse[] {
  const data = loadCoursework();
  const all: RankedCourse[] = [];
  for (const program of data.programs ?? []) {
    for (const course of program.courses ?? []) {
      all.push({
        ...course,
        tracks: course.tracks ?? [],
        keywords: course.keywords ?? [],
        program: program.degree,
        institution: program.institution,
        relevance: 0,
      });
    }
  }

  const filtered = all
    .map((c) => ({ ...c, relevance: relevanceOf(c, q) }))
    .filter((c) => (q.track ? c.tracks.includes(q.track) || c.relevance >= 100 : true))
    .filter((c) => (q.minGrade !== undefined ? (c.grade ?? -1) >= q.minGrade : true));

  const ranked = Boolean(q.track || q.keywords?.length || q.featured?.length);
  return filtered.sort((a, b) => {
    if (ranked && b.relevance !== a.relevance) return b.relevance - a.relevance;
    return (b.grade ?? -1) - (a.grade ?? -1);
  });
}

export function getTheses(track?: TrackId): Thesis[] {
  const theses = loadCoursework().theses ?? [];
  return track ? theses.filter((t) => t.tracks.includes(track)) : theses;
}

export function getCourseworkPayload(q: CourseworkQuery = {}) {
  const data = loadCoursework();
  const courses = queryCourses(q);
  return {
    query: { track: q.track ?? null, minGrade: q.minGrade ?? null },
    gradingScale: data.gradingScale,
    programs: (data.programs ?? []).map((p) => ({
      id: p.id,
      institution: p.institution,
      degree: p.degree,
      gpa: p.gpa,
      ects: p.ects,
      note: p.note,
      courseCount: p.courses?.length ?? 0,
    })),
    courseCount: courses.length,
    courses: courses.map((c) => ({
      name: c.name,
      grade: c.grade ?? null,
      ects: c.ects,
      level: c.level,
      date: c.date,
      program: c.program,
      institution: c.institution,
      summary: c.summary,
      tracks: c.tracks,
      keywords: c.keywords,
    })),
    // All theses, the ones matching the track first.
    theses: getTheses()
      .map((t) => ({ ...t, matchesTrack: q.track ? t.tracks.includes(q.track) : true }))
      .sort((a, b) => Number(b.matchesTrack) - Number(a.matchesTrack)),
  };
}
