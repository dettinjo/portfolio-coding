"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// Shared, in-memory filter state for the projects list. Lives at the page level
// so the Skills section can push a technology token that the Projects section
// reads (click a skill → see the projects that use it).
export interface ProjectFilterState {
  categories: string[]; // active category tokens (e.g. "mobile")
  techs: string[]; // active technology tokens (display names, e.g. "Swift")
  query: string; // free-text search
  addCategory: (c: string) => void;
  removeCategory: (c: string) => void;
  toggleCategory: (c: string) => void;
  addTech: (t: string) => void;
  removeTech: (t: string) => void;
  setQuery: (q: string) => void;
  reset: () => void;
  active: boolean;
  // Bumped to ask the Projects section to scroll itself into view *after* the
  // filtered list has re-rendered (used by skill clicks in the Skills section).
  scrollNonce: number;
  requestScroll: () => void;
}

const noop = () => {};
const ProjectFilterCtx = createContext<ProjectFilterState>({
  categories: [],
  techs: [],
  query: "",
  addCategory: noop,
  removeCategory: noop,
  toggleCategory: noop,
  addTech: noop,
  removeTech: noop,
  setQuery: noop,
  reset: noop,
  active: false,
  scrollNonce: 0,
  requestScroll: noop,
});

export function ProjectFilterProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<string[]>([]);
  const [techs, setTechs] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [scrollNonce, setScrollNonce] = useState(0);
  const requestScroll = useCallback(() => setScrollNonce((n) => n + 1), []);

  const addCategory = useCallback(
    (c: string) => setCategories((p) => (p.includes(c) ? p : [...p, c])),
    []
  );
  const removeCategory = useCallback(
    (c: string) => setCategories((p) => p.filter((x) => x !== c)),
    []
  );
  const toggleCategory = useCallback(
    (c: string) =>
      setCategories((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c])),
    []
  );
  const addTech = useCallback(
    (t: string) =>
      setTechs((p) =>
        p.some((x) => x.toLowerCase() === t.toLowerCase()) ? p : [...p, t]
      ),
    []
  );
  const removeTech = useCallback(
    (t: string) => setTechs((p) => p.filter((x) => x !== t)),
    []
  );
  const reset = useCallback(() => {
    setCategories([]);
    setTechs([]);
    setQuery("");
  }, []);

  const value = useMemo<ProjectFilterState>(
    () => ({
      categories,
      techs,
      query,
      addCategory,
      removeCategory,
      toggleCategory,
      addTech,
      removeTech,
      setQuery,
      reset,
      active: categories.length > 0 || techs.length > 0 || query.trim().length > 0,
      scrollNonce,
      requestScroll,
    }),
    [categories, techs, query, addCategory, removeCategory, toggleCategory, addTech, removeTech, reset, scrollNonce, requestScroll]
  );

  return (
    <ProjectFilterCtx.Provider value={value}>{children}</ProjectFilterCtx.Provider>
  );
}

export const useProjectFilter = () => useContext(ProjectFilterCtx);
