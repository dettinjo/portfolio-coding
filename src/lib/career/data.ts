import fs from "fs";
import path from "path";
import courseworkBundled from "@/data/coursework.json";
import extraProjectsBundled from "@/data/extra-projects.json";
import roleProfilesBundled from "@/data/role-profiles.json";
import type { CourseworkFile, ExtraProjectsFile, RoleProfilesFile } from "@/types/career";

// Reads a staged data file fresh from disk when available (dev server, or a
// container that mounts src/data), falling back to the copy bundled at build
// time (Next.js standalone output has no src/ directory).
function load<T>(fileName: string, bundled: unknown): T {
  const filePath = path.join(process.cwd(), "src", "data", fileName);
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
    }
  } catch {
    // fall through to the bundled copy
  }
  return JSON.parse(JSON.stringify(bundled)) as T;
}

export const loadCoursework = (): CourseworkFile =>
  load<CourseworkFile>("coursework.json", courseworkBundled);

export const loadExtraProjects = (): ExtraProjectsFile =>
  load<ExtraProjectsFile>("extra-projects.json", extraProjectsBundled);

export const loadRoleProfiles = (): RoleProfilesFile =>
  load<RoleProfilesFile>("role-profiles.json", roleProfilesBundled);
