// src/components/sections/ProjectsSection.tsx
"use client";

import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useTranslations, useLocale } from "next-intl";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import type { SoftwareProject } from "@/lib/types";
import { AnimatedProjectCard } from "./AnimatedProjectCard";
import { useProjectFilter } from "./ProjectFilterContext";
import { normalizeTech } from "@/lib/tech";
import { scrollToElement } from "@/lib/scroll";
import { cn } from "@/lib/utils";

interface ProjectsSectionProps {
  projects: SoftwareProject[] | null;
}

const PAGE_SIZE = 4;
const CATEGORY_ORDER = ["frontend", "backend", "mobile", "devops", "ai"];

type Suggestion = {
  type: "category" | "tech";
  value: string; // category id or tech display name
  label: string;
  starts: number;
  count: number;
};

export function ProjectsSection({ projects }: ProjectsSectionProps) {
  const t = useTranslations("software.SoftwareProjectsSection");
  const locale = useLocale();
  const filter = useProjectFilter();
  const { categories, techs, query, active } = filter;

  const catLabel = useCallback((c: string) => t(`category_${c}`), [t]);
  const formatMonth = useCallback(
    (iso?: string) => {
      if (!iso) return "";
      try {
        return new Intl.DateTimeFormat(locale, {
          year: "numeric",
          month: "long",
        }).format(new Date(iso));
      } catch {
        return iso.slice(0, 7);
      }
    },
    [locale]
  );

  // ── available facets ──────────────────────────────────────────────────────
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    (projects || []).forEach((p) => (p.categories || []).forEach((c) => set.add(c)));
    return CATEGORY_ORDER.filter((c) => set.has(c));
  }, [projects]);

  const categoryCounts = useMemo(() => {
    const m: Record<string, number> = {};
    (projects || []).forEach((p) =>
      (p.categories || []).forEach((c) => (m[c] = (m[c] || 0) + 1))
    );
    return m;
  }, [projects]);

  const techCounts = useMemo(() => {
    const m = new Map<string, number>();
    (projects || []).forEach((p) =>
      (p.tags || []).forEach((tag) => m.set(tag, (m.get(tag) || 0) + 1))
    );
    return m;
  }, [projects]);

  // ── filtered results (OR within a facet, AND across facets + free text) ────
  const filtered = useMemo(() => {
    if (!projects) return [];
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      // Categories: OR (project is in any selected area).
      if (categories.length && !categories.some((c) => (p.categories || []).includes(c)))
        return false;
      // Technologies: AND (project must use every selected technology) — adding a
      // skill narrows to projects that combine them.
      if (
        techs.length &&
        !techs.every((tk) =>
          (p.tags || []).some((tag) => normalizeTech(tag) === normalizeTech(tk))
        )
      )
        return false;
      if (q) {
        const hay = [
          p.title,
          p.titleDe,
          p.description,
          p.descriptionDe,
          p.projectType,
          ...(p.tags || []),
          ...(p.categories || []).map(catLabel),
          (p.developedAt || "").slice(0, 7),
          formatMonth(p.developedAt),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [projects, categories, techs, query, catLabel, formatMonth]);

  // ── pagination ─────────────────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const filterKey = `${categories.join(",")}|${techs.join(",")}|${query.trim()}`;
  useEffect(() => {
    setPage(1);
  }, [filterKey]);
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // ── scroll-driven active-card inversion ────────────────────────────────────
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const scrollProgressRef = useRef<Record<string, number>>({});
  const ticking = useRef(false);

  const recomputeActive = useCallback(() => {
    const progressValues = scrollProgressRef.current;
    let closestId: string | null = null;
    let minDistance = Infinity;
    for (const id in progressValues) {
      const distance = Math.abs(progressValues[id] - 0.5);
      if (distance < minDistance) {
        minDistance = distance;
        closestId = id;
      }
    }
    setActiveCardId((prev) => (prev !== closestId ? closestId : prev));
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          recomputeActive();
          ticking.current = false;
        });
        ticking.current = true;
      }
    };
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [recomputeActive]);

  // When the visible set changes (filter/page), drop stale progress and recompute.
  const pageKey = `${filterKey}|${safePage}`;
  useEffect(() => {
    scrollProgressRef.current = {};
    setActiveCardId(null);
    const id = window.requestAnimationFrame(() => recomputeActive());
    return () => window.cancelAnimationFrame(id);
  }, [pageKey, recomputeActive]);

  const goToPage = (n: number) => {
    setPage(n);
    scrollToElement("projekte");
  };

  // Scroll the projects into view when requested externally (e.g. a skill click)
  // — runs after the filtered list has rendered, so it lands at the top. The
  // rAF scroll re-targets every frame, so adding a token (which re-renders and
  // changes page height) can't abort it the way a native smooth scroll would.
  const { scrollNonce } = filter;
  useEffect(() => {
    if (scrollNonce > 0) scrollToElement("projekte");
  }, [scrollNonce]);

  return (
    <section id="projekte" className="scroll-mt-24">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-bold tracking-tight">{t("title")}</h2>
        <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      {projects !== null && projects.length > 0 && (
        <ProjectSearch
          availableCategories={availableCategories}
          categoryCounts={categoryCounts}
          techCounts={techCounts}
          catLabel={catLabel}
          resultCount={filtered.length}
        />
      )}

      {projects === null ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
          <h3 className="text-xl font-semibold text-destructive">
            {t("connectionFailedTitle")}
          </h3>
          <p className="mt-2 text-muted-foreground">{t("connectionFailedMessage")}</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <h3 className="text-xl font-semibold">{t("emptyTitle")}</h3>
          <p className="mt-2 text-muted-foreground">{t("emptyMessage")}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-muted-foreground">{t("noResults")}</p>
          {active && (
            <button
              onClick={filter.reset}
              className="mt-3 text-sm font-semibold underline-offset-4 hover:underline"
            >
              {t("filter_reset")}
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-16">
            {pageItems.map((project, index) => (
              <AnimatedProjectCard
                key={project.id}
                project={project}
                index={index}
                isActive={String(project.id) === activeCardId}
                onScrollProgressChange={(progress) => {
                  scrollProgressRef.current[String(project.id)] = progress;
                }}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination
              page={safePage}
              totalPages={totalPages}
              onChange={goToPage}
              prevLabel={t("prev_page")}
              nextLabel={t("next_page")}
            />
          )}
        </>
      )}
    </section>
  );
}

// ── Search bar with category/tech tokens + ranked autocomplete ───────────────
function ProjectSearch({
  availableCategories,
  categoryCounts,
  techCounts,
  catLabel,
  resultCount,
}: {
  availableCategories: string[];
  categoryCounts: Record<string, number>;
  techCounts: Map<string, number>;
  catLabel: (c: string) => string;
  resultCount: number;
}) {
  const t = useTranslations("software.SoftwareProjectsSection");
  const filter = useProjectFilter();
  const { categories, techs, query, active, scrollNonce } = filter;
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Open automatically when a filter is applied (e.g. from clicking a skill).
  useEffect(() => {
    if (active) setOpen(true);
  }, [active]);
  // Re-open whenever a skill is clicked (even if a filter was already active).
  useEffect(() => {
    if (scrollNonce > 0) setOpen(true);
  }, [scrollNonce]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Collapse when clicking outside — but only while the bar is empty. Once it
  // holds tokens or text, an outside click shouldn't throw that work away.
  useEffect(() => {
    if (!open || active) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, active]);

  const suggestions = useMemo<Suggestion[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // empty + focused → recommend categories
      return availableCategories
        .filter((c) => !categories.includes(c))
        .map((c) => ({
          type: "category" as const,
          value: c,
          label: catLabel(c),
          starts: 0,
          count: categoryCounts[c] || 0,
        }));
    }
    const out: Suggestion[] = [];
    for (const c of availableCategories) {
      if (categories.includes(c)) continue;
      const label = catLabel(c);
      const ln = label.toLowerCase();
      if (ln.includes(q))
        out.push({ type: "category", value: c, label, starts: ln.startsWith(q) ? 0 : 1, count: categoryCounts[c] || 0 });
    }
    for (const [name, count] of techCounts) {
      if (techs.some((x) => x.toLowerCase() === name.toLowerCase())) continue;
      const ln = name.toLowerCase();
      if (ln.includes(q))
        out.push({ type: "tech", value: name, label: name, starts: ln.startsWith(q) ? 0 : 1, count });
    }
    out.sort((a, b) => a.starts - b.starts || b.count - a.count || a.label.localeCompare(b.label));
    return out.slice(0, 6);
  }, [query, availableCategories, categories, techs, techCounts, categoryCounts, catLabel]);

  const pickSuggestion = (s: Suggestion) => {
    if (s.type === "category") filter.addCategory(s.value);
    else filter.addTech(s.value);
    filter.setQuery("");
    inputRef.current?.focus();
  };

  // Backspace on an empty input removes the last token (techs first, then
  // categories) — the usual chip-input convention.
  const handleKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Backspace" || query.length > 0) return;
    if (techs.length) filter.removeTech(techs[techs.length - 1]);
    else if (categories.length) filter.removeCategory(categories[categories.length - 1]);
  };

  if (!open) {
    return (
      <div className="mb-12 flex justify-center">
        <button
          onClick={() => setOpen(true)}
          aria-label={t("search_label")}
          className="relative inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
        >
          <Search className="h-4 w-4" />
          <span>{t("search_label")}</span>
          {active && (
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-foreground" />
          )}
        </button>
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="mb-12 mx-auto w-full max-w-xl">
      {/* Outer row never wraps, so the reset (×) stays pinned top-right. The
          middle column wraps tokens; the input keeps a comfortable min width, so
          when tokens fill a row it drops to its own full-width line instead of
          being squeezed — you always see the full text you're typing. */}
      <div className="flex items-start gap-2 rounded-2xl border border-border bg-background px-3 py-2 focus-within:border-foreground transition-colors">
        <Search className="mt-1.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {categories.map((c) => (
            <Token key={`c-${c}`} label={catLabel(c)} onRemove={() => filter.removeCategory(c)} />
          ))}
          {techs.map((tk) => (
            <Token key={`t-${tk}`} label={tk} onRemove={() => filter.removeTech(tk)} />
          ))}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => filter.setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              categories.length + techs.length === 0 ? t("search_placeholder") : ""
            }
            className="min-w-[8rem] flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        {active && (
          <button
            onClick={filter.reset}
            aria-label={t("filter_reset")}
            className="mt-1 shrink-0 rounded-full p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {suggestions.map((s) => (
            <button
              key={`${s.type}-${s.value}`}
              onClick={() => pickSuggestion(s)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
            >
              <span>{s.label}</span>
              <span className="text-[10px] opacity-50">{s.count}</span>
            </button>
          ))}
        </div>
      )}

      {active && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          {t("result_count", { count: resultCount })}
        </p>
      )}
    </div>
  );
}

function Token({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-foreground px-2.5 py-1 text-xs font-medium text-background">
      {label}
      <button onClick={onRemove} aria-label={`Remove ${label}`} className="hover:opacity-70">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

function Pagination({
  page,
  totalPages,
  onChange,
  prevLabel,
  nextLabel,
}: {
  page: number;
  totalPages: number;
  onChange: (n: number) => void;
  prevLabel: string;
  nextLabel: string;
}) {
  return (
    <div className="mt-16 flex items-center justify-center gap-2">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label={prevLabel}
        className="rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          aria-current={n === page ? "page" : undefined}
          className={cn(
            "h-8 w-8 rounded-full text-sm tabular-nums transition-colors",
            n === page
              ? "bg-foreground font-semibold text-background"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {n}
        </button>
      ))}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label={nextLabel}
        className="rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
