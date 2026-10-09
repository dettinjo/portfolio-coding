"use client";

import { useState, useCallback, useMemo } from "react";
import {
  BannerData,
  TerminalTagStyle,
  TerminalPrompt,
} from "@/types/banner";
import {
  DEFAULT_BANNER_DATA,
  QUICK_ROLE_PRESETS,
  SUGGESTED_SKILLS,
} from "@/lib/banner/constants";
import { renderBannerSvg } from "@/lib/banner/svg-renderer";
import { siteConfig } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import {
  Download,
  Copy,
  Check,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Plus,
  X,
  RotateCcw,
  Sparkles,
  Terminal,
  FileCode,
  ArrowLeft,
  User,
  Briefcase,
  Globe,
  Hash,
  Activity,
  Layers,
} from "lucide-react";

interface LinkedInBannerGeneratorProps {
  initialData?: Partial<BannerData>;
  locale?: string;
}

export function LinkedInBannerGenerator({
  initialData,
  locale,
}: LinkedInBannerGeneratorProps) {
  // Pre-fill name and clean portfolio URL from siteConfig
  const [data, setData] = useState<BannerData>(() => {
    const defaultName = siteConfig.person.fullName || DEFAULT_BANNER_DATA.name;
    const defaultUrl = siteConfig.site.serverUrl
      ? siteConfig.site.serverUrl
          .replace(/^https?:\/\//, "")
          .replace(/\/$/, "")
          .replace(/^localhost:\d+/, "dettinger.dev")
      : DEFAULT_BANNER_DATA.contactUrl;

    return {
      ...DEFAULT_BANNER_DATA,
      name: defaultName,
      contactUrl: defaultUrl,
      ...(initialData || {}),
    };
  });

  const [showSafeAreas, setShowSafeAreas] = useState<boolean>(true);
  const [newSkillInput, setNewSkillInput] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleUpdate = useCallback(
    <K extends keyof BannerData>(field: K, value: BannerData[K]) => {
      setData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleAddSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !data.skills.includes(trimmed)) {
      if (data.skills.length >= 8) {
        return;
      }
      handleUpdate("skills", [...data.skills, trimmed]);
      setNewSkillInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    handleUpdate(
      "skills",
      data.skills.filter((s) => s !== skillToRemove)
    );
  };

  const handleApplyPreset = (preset: { title: string; skills: string[] }) => {
    setData((prev) => ({
      ...prev,
      jobTitle: preset.title,
      skills: [...preset.skills],
    }));
  };

  const handleReset = () => {
    const defaultName = siteConfig.person.fullName || DEFAULT_BANNER_DATA.name;
    const defaultUrl = siteConfig.site.serverUrl
      ? siteConfig.site.serverUrl
          .replace(/^https?:\/\//, "")
          .replace(/\/$/, "")
          .replace(/^localhost:\d+/, "dettinger.dev")
      : DEFAULT_BANNER_DATA.contactUrl;

    setData({
      ...DEFAULT_BANNER_DATA,
      name: defaultName,
      contactUrl: defaultUrl,
    });
  };

  // Live SVG string
  const previewSvg = useMemo(() => {
    return renderBannerSvg(data, { showSafeAreas });
  }, [data, showSafeAreas]);

  const cleanSvgForExport = useMemo(() => {
    return renderBannerSvg(data, { showSafeAreas: false });
  }, [data]);

  // Export handlers
  const downloadPng = async (scale: 1 | 2 = 1) => {
    const key = scale === 2 ? "retina" : "png";
    setDownloading(key);
    const safeRole = (data.jobTitle || "AI_Engineer").replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `LinkedIn_Banner_${safeRole}_${data.theme}${scale === 2 ? "@2x" : ""}.png`;

    try {
      // 1. Server-side sharp generation for razor-sharp antialiased typography
      const params = new URLSearchParams({
        name: data.name || "",
        showName: String(Boolean(data.showName)),
        nameStyle: data.nameStyle || "path",

        jobTitle: data.jobTitle || "",
        showJobTitle: String(Boolean(data.showJobTitle)),
        promptSymbol: data.promptSymbol || ">",

        contactUrl: data.contactUrl || "",
        showContact: String(Boolean(data.showContact)),
        linkPosition: data.linkPosition || "below",

        skills: data.skills.join(","),
        showSkills: String(Boolean(data.showSkills)),
        tagStyle: data.tagStyle || "block",

        showTagline: String(Boolean(data.showTagline)),
        tagline: data.tagline || "",

        showStatus: String(Boolean(data.showStatus)),
        statusText: data.statusText || "",

        theme: data.theme,
        template: data.template,
        scale: String(scale),
        format: "png",
      });

      const response = await fetch(`/api/banner/generate?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }

      // 2. Fallback: Client-side canvas export
      const svgBlob = new Blob([cleanSvgForExport], {
        type: "image/svg+xml;charset=utf-8",
      });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = url;
      });

      const canvas = document.createElement("canvas");
      canvas.width = 1584 * scale;
      canvas.height = 396 * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context unavailable");

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.download = filename;
        a.click();
        URL.revokeObjectURL(blobUrl);
      }, "image/png");
    } catch (err) {
      console.error("Export PNG failed:", err);
    } finally {
      setDownloading(null);
    }
  };

  const downloadSvg = () => {
    const safeRole = (data.jobTitle || "AI_Engineer").replace(/[^a-zA-Z0-9_-]/g, "_");
    const blob = new Blob([cleanSvgForExport], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `LinkedIn_Banner_${safeRole}_${data.theme}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copySvg = async () => {
    try {
      await navigator.clipboard.writeText(cleanSvgForExport);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  // Filter suggestion skills to only those not yet added
  const remainingSuggestions = useMemo(() => {
    return SUGGESTED_SKILLS.filter((s) => !data.skills.includes(s)).slice(0, 6);
  }, [data.skills]);

  return (
    <div className="h-screen max-h-screen w-screen overflow-hidden flex flex-col bg-background text-foreground select-none">
      {/* ─── COMPACT STUDIO TOPBAR (48px) ─────────────────────────────────── */}
      <header className="h-12 shrink-0 border-b border-border/80 px-3 sm:px-4 flex items-center justify-between bg-card/60 backdrop-blur-md z-30">
        {/* Left: Home link, title & canvas info */}
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href="/"
            locale={locale}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group p-1 -ml-1 rounded-md"
            title="Return to Portfolio"
          >
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <Terminal className="h-4 w-4 text-primary" />
          </Link>
          <span className="text-muted-foreground/30 text-sm hidden xs:inline">/</span>
          <span className="font-semibold text-xs sm:text-sm tracking-tight text-foreground truncate">
            Banner Studio
          </span>
          <span className="hidden md:inline-flex text-[11px] font-mono text-muted-foreground bg-muted/60 px-2 py-0.5 rounded border border-border/50">
            1584 × 396 px (4:1)
          </span>
        </div>

        {/* Right: Studio actions & primary export */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Safe Zones Toggle */}
          <button
            type="button"
            onClick={() => setShowSafeAreas((v) => !v)}
            className={`inline-flex items-center gap-1 text-xs font-medium p-1.5 sm:px-2.5 sm:py-1 rounded-md border transition-colors ${
              showSafeAreas
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                : "bg-muted/40 text-muted-foreground border-border hover:text-foreground"
            }`}
            title="Toggle LinkedIn safe zones (avatar collision & mobile crop)"
          >
            {showSafeAreas ? (
              <Eye className="h-3.5 w-3.5" />
            ) : (
              <EyeOff className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">
              Safe Zones {showSafeAreas ? "On" : "Off"}
            </span>
          </button>

          {/* Banner Theme Toggle */}
          <button
            type="button"
            onClick={() =>
              handleUpdate("theme", data.theme === "dark" ? "light" : "dark")
            }
            className="inline-flex items-center gap-1 text-xs font-medium p-1.5 sm:px-2.5 sm:py-1 rounded-md border border-border bg-card hover:bg-muted/60 transition-colors"
            title="Toggle Light / Dark mode for banner"
          >
            {data.theme === "dark" ? (
              <>
                <Moon className="h-3.5 w-3.5 text-zinc-400" />
                <span className="hidden sm:inline">Dark</span>
              </>
            ) : (
              <>
                <Sun className="h-3.5 w-3.5 text-amber-500" />
                <span className="hidden sm:inline">Light</span>
              </>
            )}
          </button>

          {/* Reset button */}
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            title="Reset to defaults"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          <div className="h-4 w-[1px] bg-border mx-0.5 sm:mx-1" />

          {/* Primary Export Button */}
          <Button
            type="button"
            size="sm"
            className="h-8 px-2.5 sm:px-3 text-xs font-semibold shadow-xs"
            onClick={() => downloadPng(1)}
            disabled={downloading !== null}
          >
            <Download className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden xs:inline">
              {downloading === "png" ? "Rendering..." : "Export"}
            </span>
          </Button>
        </div>
      </header>

      {/* ─── WORKSPACE (MOBILE: FLUID SCROLL WITH STICKY PREVIEW; DESKTOP: 2-COLUMN ZERO-SCROLL) ──── */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
        {/* ─── ARTBOARD / CANVAS STAGE ───────────────────────────────────── */}
        <section className="sticky top-0 lg:static z-20 bg-background/95 lg:bg-zinc-950/20 backdrop-blur-md lg:backdrop-blur-none border-b lg:border-b-0 border-border/80 lg:flex-1 lg:min-h-0 lg:h-full flex flex-col items-center justify-center p-3 sm:p-4 lg:p-6 shadow-xs lg:shadow-none">
          {/* Banner Box: Pure minimal canvas with zero window parts */}
          <div className="w-full max-w-4xl aspect-[4/1] rounded-lg sm:rounded-xl overflow-hidden border border-border/80 shadow-md lg:shadow-2xl bg-zinc-950 flex items-center justify-center ring-1 ring-border/20 select-none">
            <div
              className="w-full h-full flex items-center justify-center select-none"
              dangerouslySetInnerHTML={{ __html: previewSvg }}
            />
          </div>

          {/* Presets Row: Smooth horizontal swipe row on mobile, centered on desktop */}
          <div className="w-full max-w-4xl flex items-center gap-1.5 pt-2 sm:pt-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden justify-start sm:justify-center">
            <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground flex items-center gap-1 shrink-0 mr-0.5">
              <Sparkles className="h-3 w-3 text-primary" />
              Presets:
            </span>
            {QUICK_ROLE_PRESETS.map((preset) => {
              const isActive = data.jobTitle === preset.title;
              return (
                <button
                  key={preset.title}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className={`text-xs px-2.5 py-0.5 rounded-md border shrink-0 transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                      : "bg-card text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
                  }`}
                >
                  {preset.title}
                </button>
              );
            })}
          </div>
        </section>

        {/* ─── INSPECTOR SIDEBAR / MODULAR BUILDING BLOCKS ──────────────── */}
        <aside className="w-full lg:w-80 xl:w-[360px] shrink-0 lg:h-full lg:border-l border-border/80 bg-card/40 backdrop-blur-md p-4 flex flex-col justify-between lg:overflow-y-auto space-y-4 lg:space-y-0">
          {/* Building Blocks Container */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-1 border-b border-border/60">
              <div className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold tracking-tight">
                  Building Blocks
                </span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">
                Terminal Blocks
              </span>
            </div>

            {/* ─── BLOCK 1: NAME (IDENTITY) ─────────────────────────────── */}
            <div className="space-y-1.5 p-2 rounded-lg bg-background/50 border border-border/70">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-foreground">
                  <input
                    type="checkbox"
                    checked={data.showName !== false}
                    onChange={(e) => handleUpdate("showName", e.target.checked)}
                    className="rounded border-border h-3.5 w-3.5 text-primary"
                  />
                  <User className="h-3.5 w-3.5 text-primary" />
                  <span>Name</span>
                </label>
                {data.showName !== false && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleUpdate("nameStyle", "path")}
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border transition-all ${
                        (data.nameStyle || "path") === "path"
                          ? "bg-primary text-primary-foreground border-primary font-bold"
                          : "text-muted-foreground border-border/60 hover:text-foreground"
                      }`}
                      title="Prefix with ~/ (terminal path)"
                    >
                      ~/ Name
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdate("nameStyle", "plain")}
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border transition-all ${
                        data.nameStyle === "plain"
                          ? "bg-primary text-primary-foreground border-primary font-bold"
                          : "text-muted-foreground border-border/60 hover:text-foreground"
                      }`}
                      title="Plain text name"
                    >
                      Plain
                    </button>
                  </div>
                )}
              </div>

              {data.showName !== false && (
                <div className="relative pt-0.5">
                  <Input
                    value={data.name || ""}
                    onChange={(e) => handleUpdate("name", e.target.value)}
                    placeholder="e.g. Joel Dettinger"
                    className="font-mono text-xs pr-7 bg-background h-7"
                  />
                  {data.name && (
                    <button
                      type="button"
                      onClick={() => handleUpdate("name", "")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ─── BLOCK 2: JOB TITLE (ROLE) ────────────────────────────── */}
            <div className="space-y-1.5 p-2 rounded-lg bg-background/50 border border-border/70">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-foreground">
                  <input
                    type="checkbox"
                    checked={data.showJobTitle !== false}
                    onChange={(e) =>
                      handleUpdate("showJobTitle", e.target.checked)
                    }
                    className="rounded border-border h-3.5 w-3.5 text-primary"
                  />
                  <Briefcase className="h-3.5 w-3.5 text-primary" />
                  <span>Job Title / Role</span>
                </label>
                {data.showJobTitle !== false && (
                  <div className="flex items-center gap-1">
                    {(
                      [
                        { id: ">", label: "> " },
                        { id: "❯", label: "❯ " },
                        { id: "$", label: "$ " },
                        { id: "none", label: "None" },
                      ] as const
                    ).map((p) => {
                      const isSel = (data.promptSymbol || ">") === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() =>
                            handleUpdate("promptSymbol", p.id as TerminalPrompt)
                          }
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono border transition-all ${
                            isSel
                              ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                              : "border-border/60 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {data.showJobTitle !== false && (
                <div className="relative pt-0.5">
                  <Input
                    value={data.jobTitle || ""}
                    onChange={(e) => handleUpdate("jobTitle", e.target.value)}
                    placeholder="e.g. AI Engineer"
                    className="font-mono text-xs pr-7 bg-background h-8"
                  />
                  {data.jobTitle && (
                    <button
                      type="button"
                      onClick={() => handleUpdate("jobTitle", "")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ─── BLOCK 3: PORTFOLIO LINK / WEBSITE ─────────────────────── */}
            <div className="space-y-1.5 p-2 rounded-lg bg-background/50 border border-border/70">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-foreground">
                  <input
                    type="checkbox"
                    checked={Boolean(data.showContact)}
                    onChange={(e) =>
                      handleUpdate("showContact", e.target.checked)
                    }
                    className="rounded border-border h-3.5 w-3.5 text-primary"
                  />
                  <Globe className="h-3.5 w-3.5 text-primary" />
                  <span>Portfolio Link / Website</span>
                </label>
                {Boolean(data.showContact) && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleUpdate("linkPosition", "below")}
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border transition-all ${
                        (data.linkPosition || "below") === "below"
                          ? "bg-primary text-primary-foreground border-primary font-bold"
                          : "text-muted-foreground border-border/60 hover:text-foreground"
                      }`}
                      title="Place link right below skills stack"
                    >
                      Below
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdate("linkPosition", "corner")}
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border transition-all ${
                        data.linkPosition === "corner"
                          ? "bg-primary text-primary-foreground border-primary font-bold"
                          : "text-muted-foreground border-border/60 hover:text-foreground"
                      }`}
                      title="Place link in bottom-right corner"
                    >
                      Corner
                    </button>
                  </div>
                )}
              </div>

              {Boolean(data.showContact) && (
                <div className="relative pt-0.5">
                  <Input
                    value={data.contactUrl || ""}
                    onChange={(e) => handleUpdate("contactUrl", e.target.value)}
                    placeholder="e.g. joeldettinger.com"
                    className="font-mono text-xs pr-7 bg-background h-7"
                  />
                  {data.contactUrl && (
                    <button
                      type="button"
                      onClick={() => handleUpdate("contactUrl", "")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ─── BLOCK 4: SKILLS & TECH STACK ─────────────────────────── */}
            <div className="space-y-1.5 p-2 rounded-lg bg-background/50 border border-border/70">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-foreground">
                  <input
                    type="checkbox"
                    checked={data.showSkills !== false}
                    onChange={(e) =>
                      handleUpdate("showSkills", e.target.checked)
                    }
                    className="rounded border-border h-3.5 w-3.5 text-primary"
                  />
                  <Terminal className="h-3.5 w-3.5 text-primary" />
                  <span>Skills & Tech Stack</span>
                </label>
                {data.showSkills !== false && (
                  <div className="flex items-center gap-1">
                    {(
                      [
                        { id: "block", label: "Blocks" },
                        { id: "bracket", label: "[ ]" },
                        { id: "inline", label: "· Inline" },
                      ] as const
                    ).map((ts) => {
                      const isSel = (data.tagStyle || "block") === ts.id;
                      return (
                        <button
                          key={ts.id}
                          type="button"
                          onClick={() =>
                            handleUpdate("tagStyle", ts.id as TerminalTagStyle)
                          }
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded border transition-all ${
                            isSel
                              ? "bg-primary text-primary-foreground border-primary font-bold"
                              : "text-muted-foreground border-border/60 hover:text-foreground"
                          }`}
                        >
                          {ts.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {data.showSkills !== false && (
                <div className="space-y-2 pt-0.5">
                  {/* Active Skill Tags */}
                  <div className="flex flex-wrap gap-1 p-1.5 rounded bg-background border border-border/70 min-h-[32px]">
                    {data.skills.length === 0 ? (
                      <span className="text-[10px] text-muted-foreground/60 italic py-0.5 px-1">
                        No tags added
                      </span>
                    ) : (
                      data.skills.map((skill) => (
                        <span
                          key={skill}
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-mono border border-border/70 ${
                            data.tagStyle === "block"
                              ? "rounded-[3px] bg-secondary text-secondary-foreground"
                              : data.tagStyle === "bracket"
                              ? "rounded bg-transparent text-foreground border-transparent"
                              : "rounded bg-muted/40 text-foreground"
                          }`}
                        >
                          {data.tagStyle === "bracket" ? (
                            <span className="text-muted-foreground">[</span>
                          ) : null}
                          <span>{skill}</span>
                          {data.tagStyle === "bracket" ? (
                            <span className="text-muted-foreground">]</span>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill)}
                            className="hover:text-destructive transition-colors ml-0.5 p-0.5 -mr-0.5"
                            title={`Remove ${skill}`}
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  {/* Add Skill Input */}
                  <div className="flex gap-1.5">
                    <Input
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddSkill(newSkillInput);
                        }
                      }}
                      placeholder="Add skill (e.g. PyTorch)..."
                      className="text-xs font-mono bg-background h-7"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs"
                      onClick={() => handleAddSkill(newSkillInput)}
                      disabled={!newSkillInput.trim() || data.skills.length >= 8}
                    >
                      <Plus className="h-3 w-3 mr-0.5" />
                      Add
                    </Button>
                  </div>

                  {/* Suggestions Chips */}
                  {remainingSuggestions.length > 0 && data.skills.length < 8 && (
                    <div className="pt-0.5">
                      <div className="flex flex-wrap gap-1">
                        {remainingSuggestions.slice(0, 5).map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => handleAddSkill(suggestion)}
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                          >
                            + {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ─── BLOCK 5: TAGLINE & STATUSLINE (OPTIONAL) ──────────────── */}
            <div className="space-y-2 p-2 rounded-lg bg-background/50 border border-border/70">
              <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <span>Extra Terminal Annotations</span>
              </span>

              {/* Tagline Comment */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-foreground">
                    <input
                      type="checkbox"
                      checked={Boolean(data.showTagline)}
                      onChange={(e) =>
                        handleUpdate("showTagline", e.target.checked)
                      }
                      className="rounded border-border h-3 w-3 text-primary"
                    />
                    <Hash className="h-3 w-3 text-muted-foreground" />
                    <span>Tagline (# comment)</span>
                  </label>
                </div>
                {Boolean(data.showTagline) && (
                  <Input
                    value={data.tagline || ""}
                    onChange={(e) => handleUpdate("tagline", e.target.value)}
                    placeholder="e.g. Building scalable agentic AI systems"
                    className="font-mono text-[11px] bg-background h-7"
                  />
                )}
              </div>

              {/* Status Indicator */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-foreground">
                    <input
                      type="checkbox"
                      checked={Boolean(data.showStatus)}
                      onChange={(e) =>
                        handleUpdate("showStatus", e.target.checked)
                      }
                      className="rounded border-border h-3 w-3 text-primary"
                    />
                    <Activity className="h-3 w-3 text-emerald-500" />
                    <span>Statusline (● availability)</span>
                  </label>
                </div>
                {Boolean(data.showStatus) && (
                  <Input
                    value={data.statusText || ""}
                    onChange={(e) => handleUpdate("statusText", e.target.value)}
                    placeholder="e.g. open to work"
                    className="font-mono text-[11px] bg-background h-7"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Bottom Actions & Secondary Formats */}
          <div className="pt-2 border-t border-border/60 space-y-1.5">
            {/* Prominent Export Button on Mobile */}
            <Button
              type="button"
              className="w-full lg:hidden h-10 font-semibold text-xs shadow-xs"
              onClick={() => downloadPng(1)}
              disabled={downloading !== null}
            >
              <Download className="h-4 w-4 mr-2" />
              {downloading === "png"
                ? "Rendering PNG..."
                : "Download Banner PNG (1584×396)"}
            </Button>

            <div className="grid grid-cols-2 gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 lg:h-7 text-xs lg:text-[11px] font-mono px-2"
                onClick={() => downloadPng(2)}
                disabled={downloading !== null}
              >
                {downloading === "retina" ? "Rendering..." : "Retina 2x"}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 lg:h-7 text-xs lg:text-[11px] font-mono px-2"
                onClick={downloadSvg}
              >
                <FileCode className="h-3.5 w-3.5 mr-1" />
                Vector SVG
              </Button>
            </div>

            <button
              type="button"
              onClick={copySvg}
              className="w-full text-center text-xs lg:text-[11px] text-muted-foreground hover:text-foreground transition-colors py-0.5 inline-flex items-center justify-center gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-emerald-500 font-medium">SVG Copied to Clipboard</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy raw SVG</span>
                </>
              )}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
