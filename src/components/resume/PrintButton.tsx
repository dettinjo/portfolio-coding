"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useUmami } from "@/hooks/useUmami";

interface PrintButtonProps {
  label: string;
  filename?: string;
}

export function PrintButton({ label }: PrintButtonProps) {
  const [loading, setLoading] = useState(false);
  const locale = useLocale();
  const { track } = useUmami();

  const handleDownload = async () => {
    setLoading(true);
    track("resume_downloaded", { source: "resume_page", locale });
    try {
      const response = await fetch("/api/resume/download");
      if (!response.ok) {
        throw new Error(`Server responded ${response.status}`);
      }
      const blob = await response.blob();

      // Extract filename from Content-Disposition header if present.
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="?([^"]+)"?/);
      const downloadName = match?.[1] ?? "Resume.pdf";

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download resume PDF:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleDownload} disabled={loading}>
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      {loading ? "Generating PDF…" : label}
    </Button>
  );
}
