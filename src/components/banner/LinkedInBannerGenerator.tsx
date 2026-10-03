"use client";

import { useState, useCallback } from "react";
import { BannerData, BannerTemplateId } from "@/types/banner";
import {
  BANNER_TEMPLATES,
  DEFAULT_BANNER_DATA,
  LINKEDIN_BANNER_HEIGHT,
  LINKEDIN_BANNER_WIDTH,
  PRESET_JOB_TITLES,
  SUGGESTED_SKILLS,
} from "@/lib/banner/constants";
import { renderBannerSvg } from "@/lib/banner/svg-renderer";
import { LinkedInBannerPreview } from "./LinkedInBannerPreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Download,
  Copy,
  Check,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Sparkles,
  Terminal,
  Columns,
  Layers,
  SquareDashed,
  Plus,
  X,
  RotateCcw,
} from "lucide-react";
import { siteConfig } from "@/lib/config";

interface LinkedInBannerGeneratorProps {
  initialData?: Partial<BannerData>;
  locale?: string;
}

export function LinkedInBannerGenerator({
  initialData,
}: LinkedInBannerGeneratorProps) {
  const [data, setData] = useState<BannerData>(() => ({
    ...DEFAULT_BANNER_DATA,
    name: siteConfig.person.fullName || DEFAULT_BANNER_DATA.name,
    jobTitle: siteConfig.person.headline || DEFAULT_BANNER_DATA.jobTitle,
    contactUrl:
      siteConfig.site.serverUrl?.replace(/^https?:\/\//, "") ||
      DEFAULT_BANNER_DATA.contactUrl,
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
        alert("Maximum 8 skills recommended to maintain clean banner layout.");
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

  const handleReset = () => {
    setData({
      ...DEFAULT_BANNER_DATA,
      name: siteConfig.person.fullName || DEFAULT_BANNER_DATA.name,
      jobTitle: siteConfig.person.headline || DEFAULT_BANNER_DATA.jobTitle,
      contactUrl:
        siteConfig.site.serverUrl?.replace(/^https?:\/\//, "") ||
        DEFAULT_BANNER_DATA.contactUrl,
    });
  };

  // Canvas-based client-side export
  const exportToPng = async (scale: 1 | 2 = 1) => {
    setDownloading(scale === 2 ? "png-2x" : "png-1x");
    try {
      const svgString = renderBannerSvg(data, { showSafeAreas: false });
      const svgBlob = new Blob([svgString], {
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
      canvas.width = LINKEDIN_BANNER_WIDTH * scale;
      canvas.height = LINKEDIN_BANNER_HEIGHT * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not create canvas 2D context");

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const safeRole = data.jobTitle.replace(/[^a-zA-Z0-9_-]/g, "_");
        a.download = `LinkedIn_Banner_${safeRole}_${data.theme}_${data.template}${
          scale === 2 ? "@2x" : ""
        }.png`;
        a.href = blobUrl;
        a.click();
        URL.revokeObjectURL(blobUrl);
      }, "image/png");
    } catch (err) {
      console.error("Export PNG failed:", err);
      alert("Failed to export image. Please try again.");
    } finally {
      setDownloading(null);
    }
  };

  const exportToSvg = () => {
    try {
      const svgString = renderBannerSvg(data, { showSafeAreas: false });
      const blob = new Blob([svgString], {
        type: "image/svg+xml;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const safeRole = data.jobTitle.replace(/[^a-zA-Z0-9_-]/g, "_");
      a.download = `LinkedIn_Banner_${safeRole}_${data.theme}_${data.template}.svg`;
      a.href = url;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export SVG failed:", err);
    }
  };

  const copyImageToClipboard = async () => {
    try {
      const svgString = renderBannerSvg(data, { showSafeAreas: false });
      const svgBlob = new Blob([svgString], {
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
      canvas.width = LINKEDIN_BANNER_WIDTH;
      canvas.height = LINKEDIN_BANNER_HEIGHT;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not create canvas 2D context");

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          const item = new ClipboardItem({ "image/png": blob });
          await navigator.clipboard.write([item]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        } catch {
          alert("Direct clipboard image copying is not supported by your browser. Please use Download PNG.");
        }
      }, "image/png");
    } catch (err) {
      console.error("Copy to clipboard failed:", err);
    }
  };

  const templateIcons: Record<BannerTemplateId, React.ReactNode> = {
    terminal: <Terminal className="h-4 w-4" />,
    split: <Columns className="h-4 w-4" />,
    glow: <Sparkles className="h-4 w-4" />,
    framed: <SquareDashed className="h-4 w-4" />,
  };

  return (
    <div className="w-full space-y-8">
      {/* ─── LIVE PREVIEW CANVAS ────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight">Banner Live Preview</h2>
            <Badge variant="outline" className="text-xs font-mono">
              1584 × 396 px (4:1)
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowSafeAreas(!showSafeAreas)}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-border bg-card hover:bg-muted/50 transition-colors"
            >
              {showSafeAreas ? (
                <>
                  <EyeOff className="h-3.5 w-3.5 text-amber-500" />
                  <span>Hide Safe Area Overlay</span>
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Show Safe Area Overlay</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-border bg-card hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* The Live Banner Preview */}
        <LinkedInBannerPreview
          data={data}
          showSafeAreas={showSafeAreas}
          className="ring-1 ring-border shadow-md"
        />

        {/* Overlay Explainer Guide Note */}
        {showSafeAreas && (
          <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground bg-muted/40 p-3 rounded-lg border gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-red-500/30 border border-red-500" />
              <span>
                <strong>Desktop Avatar Zone:</strong> Profile photo covers the bottom-left corner. Content is positioned safely outside this zone.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 border border-dashed border-amber-500 bg-amber-500/10" />
              <span>
                <strong>Mobile Safe Zone (1260 × 316):</strong> Inner rectangle visible on narrow mobile screens.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ─── EXPORT ACTION TOOLBAR ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border bg-card/60 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-sm font-semibold">Ready to upload?</h3>
            <p className="text-xs text-muted-foreground">
              Official 1584×396px resolution, optimized for LinkedIn profiles.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => exportToPng(1)}
            disabled={downloading !== null}
            className="gap-1.5"
          >
            <Download className="h-4 w-4" />
            {downloading === "png-1x" ? "Exporting..." : "Download PNG"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => exportToPng(2)}
            disabled={downloading !== null}
            className="gap-1.5"
            title="Double-resolution 3168×792px for ultra-sharp Retina screens"
          >
            <Download className="h-4 w-4" />
            {downloading === "png-2x" ? "Exporting..." : "Retina 2x PNG"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={exportToSvg}
            className="gap-1.5"
          >
            <Download className="h-4 w-4" />
            SVG
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={copyImageToClipboard}
            className="gap-1.5"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-500" />
                <span className="text-emerald-500 font-medium">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copy Image</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ─── CONTROLS & CUSTOMIZATION GRID ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Design & Layout Choice */}
        <div className="lg:col-span-5 space-y-6">
          {/* Template Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Design Layout Template</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BANNER_TEMPLATES.map((tmpl) => {
                const isSelected = data.template === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => handleUpdate("template", tmpl.id)}
                    className={`flex flex-col text-left p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? "border-foreground bg-primary/5 ring-1 ring-foreground"
                        : "border-border bg-card hover:border-foreground/50"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className="flex items-center gap-2 font-semibold text-sm">
                        {templateIcons[tmpl.id]}
                        <span>{tmpl.name}</span>
                      </div>
                      <Badge variant={isSelected ? "default" : "outline"} className="text-[10px] px-1.5 py-0">
                        {tmpl.tag}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {tmpl.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Theme Mode Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Color Mode</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleUpdate("theme", "dark")}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-sm font-medium transition-all ${
                  data.theme === "dark"
                    ? "border-foreground bg-zinc-900 text-zinc-100 ring-1 ring-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                <Moon className="h-4 w-4" />
                <span>Dark Mode</span>
              </button>

              <button
                type="button"
                onClick={() => handleUpdate("theme", "light")}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-sm font-medium transition-all ${
                  data.theme === "light"
                    ? "border-foreground bg-zinc-100 text-zinc-900 ring-1 ring-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sun className="h-4 w-4" />
                <span>Light Mode</span>
              </button>
            </div>
          </div>

          {/* Status Badge Toggle */}
          <div className="p-4 rounded-xl border bg-card space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-semibold">Status Indicator Badge</Label>
                <p className="text-xs text-muted-foreground">
                  Displays a green indicator dot with your current status.
                </p>
              </div>
              <Switch
                checked={data.showStatus}
                onCheckedChange={(checked) => handleUpdate("showStatus", checked)}
              />
            </div>

            {data.showStatus && (
              <Input
                value={data.statusText || ""}
                onChange={(e) => handleUpdate("statusText", e.target.value)}
                placeholder="e.g. Available for select roles"
                className="text-xs"
              />
            )}
          </div>
        </div>

        {/* Right Column: Content & Typography Customization */}
        <div className="lg:col-span-7 space-y-6">
          {/* Job Title Setting */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="jobTitle" className="text-sm font-semibold">
                Job Title / Primary Role <span className="text-red-500">*</span>
              </Label>
              <span className="text-xs text-muted-foreground">
                Headline centered safely
              </span>
            </div>

            <Input
              id="jobTitle"
              value={data.jobTitle}
              onChange={(e) => handleUpdate("jobTitle", e.target.value)}
              placeholder="e.g. Senior Full-Stack Engineer"
              className="text-base font-semibold"
            />

            {/* Quick Job Title Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-xs text-muted-foreground self-center mr-1">Presets:</span>
              {PRESET_JOB_TITLES.slice(0, 5).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleUpdate("jobTitle", preset)}
                  className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                    data.jobTitle === preset
                      ? "bg-foreground text-background border-foreground font-medium"
                      : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-border"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Full Name & Tagline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-sm font-semibold">
                Full Name
              </Label>
              <Input
                id="fullName"
                value={data.name}
                onChange={(e) => handleUpdate("name", e.target.value)}
                placeholder="e.g. Alex Rivera"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contactUrl" className="text-sm font-semibold">
                Portfolio / GitHub Link
              </Label>
              <Input
                id="contactUrl"
                value={data.contactUrl || ""}
                onChange={(e) => handleUpdate("contactUrl", e.target.value)}
                placeholder="e.g. alexrivera.dev"
              />
            </div>
          </div>

          {/* Tagline */}
          <div className="space-y-1.5">
            <Label htmlFor="tagline" className="text-sm font-semibold">
              Tagline / Value Proposition
            </Label>
            <Input
              id="tagline"
              value={data.tagline}
              onChange={(e) => handleUpdate("tagline", e.target.value)}
              placeholder="e.g. Building resilient distributed systems & modern web architectures."
            />
          </div>

          {/* Tech Stack & Skills */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">
                Core Technologies & Skills ({data.skills.length}/8)
              </Label>
              <span className="text-xs text-muted-foreground">
                Displayed as technical badge pills
              </span>
            </div>

            {/* Current Active Skills Chips */}
            <div className="flex flex-wrap gap-1.5 min-h-10 p-2.5 rounded-lg border bg-muted/20">
              {data.skills.map((skill) => (
                <Badge
                  key={skill}
                  variant="secondary"
                  className="gap-1 pl-2.5 pr-1.5 py-1 font-mono text-xs"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="hover:bg-muted rounded-full p-0.5 text-muted-foreground hover:text-foreground"
                    title={`Remove ${skill}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}

              {data.skills.length === 0 && (
                <span className="text-xs text-muted-foreground self-center italic">
                  No skills selected. Add some below.
                </span>
              )}
            </div>

            {/* Add Custom Skill */}
            <div className="flex gap-2">
              <Input
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSkill(newSkillInput);
                  }
                }}
                placeholder="Add custom skill (e.g. Rust, GraphQL)..."
                className="text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAddSkill(newSkillInput)}
                disabled={!newSkillInput.trim()}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add
              </Button>
            </div>

            {/* Suggested Skills Quick-Add */}
            <div className="space-y-1 pt-1">
              <span className="text-xs text-muted-foreground">Quick-add suggestions:</span>
              <div className="flex flex-wrap gap-1">
                {SUGGESTED_SKILLS.map((skill) => {
                  const isAdded = data.skills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      disabled={isAdded}
                      onClick={() => handleAddSkill(skill)}
                      className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                        isAdded
                          ? "opacity-40 cursor-default bg-muted/20 text-muted-foreground border-transparent"
                          : "bg-background hover:bg-muted border-border text-foreground"
                      }`}
                    >
                      {isAdded ? `✓ ${skill}` : `+ ${skill}`}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
