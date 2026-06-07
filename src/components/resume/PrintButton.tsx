"use client";

import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useUmami } from "@/hooks/useUmami";

interface PrintButtonProps {
  label: string;
  filename?: string;
}

export function PrintButton({ label, filename }: PrintButtonProps) {
  const locale = useLocale();
  const { track } = useUmami();

  const handlePrint = () => {
    track("resume_downloaded", { source: "resume_page", locale });
    if (typeof window !== "undefined") {
      const originalTitle = document.title;
      if (filename) {
        document.title = filename;
      }
      window.print();
      // Restore the original title
      if (filename) {
        document.title = originalTitle;
      }
    }
  };

  return (
    <Button variant="outline" onClick={handlePrint}>
      <Download className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}
