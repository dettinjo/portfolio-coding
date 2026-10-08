"use client";

import { useState, useCallback, useMemo } from "react";
import { BannerData, BannerTemplateId } from "@/types/banner";
import {
  DEFAULT_BANNER_DATA,
  QUICK_ROLE_PRESETS,
  SUGGESTED_SKILLS,
} from "@/lib/banner/constants";
import { renderBannerSvg } from "@/lib/banner/svg-renderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Type,
  FileCode,
  ArrowLeft,
} from "lucide-react";

interface LinkedInBannerGeneratorProps {
  initialData?: Partial<BannerData>;
  locale?: string;
}

export function LinkedInBannerGenerator({
  initialData,
  locale,
}: LinkedInBannerGeneratorProps) {
  const [data, setData] = useState<BannerData>(() => ({
    ...DEFAULT_BANNER_DATA,
    ...(initialData || {}),
  }));

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
    setData({
      ...DEFAULT_BANNER_DATA,
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
        jobTitle: data.jobTitle,
        skills: data.skills.join(","),
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
          {/* Banner Box */}
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

        {/* ─── INSPECTOR SIDEBAR / CONTROLS ──────────────────────────────── */}
        <aside className="w-full lg:w-80 xl:w-[350px] shrink-0 lg:h-full lg:border-l border-border/80 bg-card/40 backdrop-blur-md p-4 flex flex-col justify-between lg:overflow-y-auto space-y-5 lg:space-y-0">
          {/* Controls Group */}
          <div className="space-y-4">
            {/* Section 1: Headline Role */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="banner-job-title" className="text-xs font-semibold">
                  Job Title / Headline
                </Label>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {data.jobTitle.length} chars
                </span>
              </div>
              <div className="relative">
                <Input
                  id="banner-job-title"
                  value={data.jobTitle}
                  onChange={(e) => handleUpdate("jobTitle", e.target.value)}
                  placeholder="e.g. AI Engineer"
                  className="font-mono text-xs pr-7 bg-background/80 h-9 sm:h-8"
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
            </div>

            {/* Section 2: Terminal Style Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Terminal Style</Label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-muted/40 border border-border/60 rounded-lg">
                <button
                  type="button"
                  onClick={() => handleUpdate("template", "terminal")}
                  className={`flex items-center justify-center gap-1 py-1.5 sm:py-1 px-1.5 rounded-md text-[11px] font-mono transition-all ${
                    data.template === "terminal"
                      ? "bg-card text-foreground font-semibold shadow-xs border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Terminal Prompt (> Title█)"
                >
                  <Terminal className="h-3 w-3" />
                  <span>Prompt</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleUpdate("template", "terminal-clean" as BannerTemplateId)
                  }
                  className={`flex items-center justify-center gap-1 py-1.5 sm:py-1 px-1.5 rounded-md text-[11px] font-mono transition-all ${
                    data.template === "terminal-clean"
                      ? "bg-card text-foreground font-semibold shadow-xs border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Clean Title (Title█)"
                >
                  <Type className="h-3 w-3" />
                  <span>Clean</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleUpdate("template", "title-only" as BannerTemplateId)
                  }
                  className={`flex items-center justify-center gap-1 py-1.5 sm:py-1 px-1.5 rounded-md text-[11px] font-mono transition-all ${
                    data.template === "title-only"
                      ? "bg-card text-foreground font-semibold shadow-xs border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Centered Title Only"
                >
                  <span>Title Only</span>
                </button>
              </div>
            </div>

            {/* Section 3: Skills & Tags (only if not title-only) */}
            {data.template !== "title-only" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Skills & Tags</Label>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {data.skills.length}/8
                  </span>
                </div>

                {/* Active Skill Pills */}
                <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-background/60 border border-border/80 min-h-[36px]">
                  {data.skills.length === 0 ? (
                    <span className="text-[11px] text-muted-foreground/60 italic py-0.5 px-1">
                      No tags added
                    </span>
                  ) : (
                    data.skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono bg-secondary text-secondary-foreground border border-border/60"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="hover:text-destructive transition-colors ml-0.5 p-0.5 -mr-1"
                        >
                          <X className="h-3 w-3" />
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
                    className="text-xs font-mono bg-background/80 h-8"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 px-2.5 text-xs"
                    onClick={() => handleAddSkill(newSkillInput)}
                    disabled={!newSkillInput.trim() || data.skills.length >= 8}
                  >
                    <Plus className="h-3.5 w-3.5 mr-0.5" />
                    Add
                  </Button>
                </div>

                {/* Quick Suggestions Chips */}
                {remainingSuggestions.length > 0 && data.skills.length < 8 && (
                  <div className="pt-0.5">
                    <span className="text-[10px] text-muted-foreground block mb-1">
                      Suggestions:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {remainingSuggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => handleAddSkill(suggestion)}
                          className="text-[11px] font-mono px-2 py-0.5 rounded border border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
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

          {/* Bottom Actions & Secondary Formats */}
          <div className="pt-3 border-t border-border/60 space-y-2">
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
              className="w-full text-center text-xs lg:text-[11px] text-muted-foreground hover:text-foreground transition-colors py-1 inline-flex items-center justify-center gap-1.5"
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
