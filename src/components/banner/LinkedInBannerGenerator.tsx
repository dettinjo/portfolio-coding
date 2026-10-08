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
} from "lucide-react";

interface LinkedInBannerGeneratorProps {
  initialData?: Partial<BannerData>;
  locale?: string;
}

export function LinkedInBannerGenerator({
  initialData,
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
      // 1. Try server-side sharp generation for razor-sharp rendering
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
        a.href = blobUrl;
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
    return SUGGESTED_SKILLS.filter((s) => !data.skills.includes(s)).slice(0, 8);
  }, [data.skills]);

  return (
    <div className="w-full space-y-6">
      {/* ─── MAIN STUDIO WORKSPACE (TWO-COLUMN DESKTOP, STACKED MOBILE) ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ─── LEFT: LIVE CANVAS STAGE (7 COLS) ─────────────────────────── */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
          {/* Canvas Toolbar */}
          <div className="flex items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-medium text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-md border border-border/50">
                1584 × 396 px · 4:1
              </span>
              <button
                type="button"
                onClick={() => setShowSafeAreas((v) => !v)}
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md border transition-colors ${
                  showSafeAreas
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                    : "bg-muted/40 text-muted-foreground border-border hover:text-foreground"
                }`}
                title="Toggle LinkedIn avatar collision circle and mobile crop zone"
              >
                {showSafeAreas ? (
                  <Eye className="h-3.5 w-3.5" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5" />
                )}
                <span>Safe Zones {showSafeAreas ? "On" : "Off"}</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Theme Toggle */}
              <button
                type="button"
                onClick={() =>
                  handleUpdate(
                    "theme",
                    data.theme === "dark" ? "light" : "dark"
                  )
                }
                className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md border border-border bg-card hover:bg-muted/60 transition-colors"
                title="Toggle Light / Dark mode"
              >
                {data.theme === "dark" ? (
                  <>
                    <Moon className="h-3.5 w-3.5 text-zinc-400" />
                    <span>Dark</span>
                  </>
                ) : (
                  <>
                    <Sun className="h-3.5 w-3.5 text-amber-500" />
                    <span>Light</span>
                  </>
                )}
              </button>

              {/* Reset Button */}
              <button
                type="button"
                onClick={handleReset}
                className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                title="Reset to defaults"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Canvas Box */}
          <div className="relative w-full aspect-[4/1] rounded-xl overflow-hidden border border-border shadow-lg bg-zinc-950/80 flex items-center justify-center ring-1 ring-border/20">
            <div
              className="w-full h-full flex items-center justify-center select-none"
              dangerouslySetInnerHTML={{ __html: previewSvg }}
            />
          </div>

          {/* Quick Role Presets Bar */}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Presets:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {QUICK_ROLE_PRESETS.map((preset) => {
                const isActive = data.jobTitle === preset.title;
                return (
                  <button
                    key={preset.title}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={`text-xs px-2.5 py-1 rounded-md border transition-all ${
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
          </div>
        </div>

        {/* ─── RIGHT: CONTROLS & INSPECTOR (5 COLS) ───────────────────────── */}
        <div className="lg:col-span-5 xl:col-span-4 bg-card/60 backdrop-blur-sm border border-border rounded-xl p-5 space-y-5 shadow-xs">
          {/* Section 1: Headline Role */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="banner-job-title" className="text-xs font-semibold">
                Job Title / Headline
              </Label>
              <span className="text-[11px] font-mono text-muted-foreground">
                {data.jobTitle.length} chars
              </span>
            </div>
            <div className="relative">
              <Input
                id="banner-job-title"
                value={data.jobTitle}
                onChange={(e) => handleUpdate("jobTitle", e.target.value)}
                placeholder="e.g. AI Engineer"
                className="font-mono text-sm pr-8 bg-background/80"
              />
              {data.jobTitle && (
                <button
                  type="button"
                  onClick={() => handleUpdate("jobTitle", "")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Section 2: Skills Pills */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">Skills & Tags</Label>
              <span className="text-[11px] font-mono text-muted-foreground">
                {data.skills.length}/8
              </span>
            </div>

            {/* Current Active Skills */}
            <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 rounded-lg bg-background/60 border border-border/80">
              {data.skills.length === 0 ? (
                <span className="text-xs text-muted-foreground/60 italic py-0.5">
                  No skill tags (Title-only view)
                </span>
              ) : (
                data.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono bg-secondary text-secondary-foreground border border-border/60"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="hover:text-destructive transition-colors ml-0.5"
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
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add
              </Button>
            </div>

            {/* Quick Suggestions Chips */}
            {remainingSuggestions.length > 0 && data.skills.length < 8 && (
              <div className="pt-1">
                <span className="text-[11px] text-muted-foreground block mb-1.5">
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

          {/* Section 3: Style Variant */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Terminal Style</Label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted/40 border border-border/60 rounded-lg">
              <button
                type="button"
                onClick={() => handleUpdate("template", "terminal")}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-mono transition-all ${
                  data.template === "terminal"
                    ? "bg-card text-foreground font-semibold shadow-xs border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Signature prompt (> Title█)"
              >
                <Terminal className="h-3 w-3" />
                <span>Prompt</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleUpdate("template", "terminal-clean" as BannerTemplateId)
                }
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-mono transition-all ${
                  data.template === "terminal-clean"
                    ? "bg-card text-foreground font-semibold shadow-xs border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Minimal title (Title█)"
              >
                <Type className="h-3 w-3" />
                <span>Clean</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleUpdate("template", "title-only" as BannerTemplateId)
                }
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-mono transition-all ${
                  data.template === "title-only"
                    ? "bg-card text-foreground font-semibold shadow-xs border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Centered title only, no skill pills"
              >
                <span>Title Only</span>
              </button>
            </div>
          </div>

          {/* Section 4: Export Buttons */}
          <div className="space-y-2 pt-2 border-t border-border">
            <Button
              type="button"
              className="w-full font-semibold shadow-xs h-9"
              onClick={() => downloadPng(1)}
              disabled={downloading !== null}
            >
              <Download className="h-4 w-4 mr-2" />
              {downloading === "png"
                ? "Rendering PNG..."
                : "Download Banner PNG (1584×396)"}
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs font-mono"
                onClick={() => downloadPng(2)}
                disabled={downloading !== null}
              >
                {downloading === "retina" ? "Rendering..." : "Retina 2x (3168×792)"}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs font-mono"
                onClick={downloadSvg}
              >
                <FileCode className="h-3.5 w-3.5 mr-1" />
                Vector SVG
              </Button>
            </div>

            <button
              type="button"
              onClick={copySvg}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors pt-1 inline-flex items-center justify-center gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-500" />
                  <span className="text-emerald-500 font-medium">SVG Copied to Clipboard</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy SVG code</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
