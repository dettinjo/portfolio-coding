// src/components/resume/PrintButton.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface PrintButtonProps {
  label: string;
  filename?: string;
}

export function PrintButton({ label, filename }: PrintButtonProps) {
  return (
    <Button
      variant="outline"
      onClick={() => {
        // Triggers the browser's print dialog (Save as PDF)
        if (typeof window !== "undefined") {
          const originalTitle = document.title;
          if (filename) {
            document.title = filename;
          }
          window.print();
          // Restore the original title after the print dialog closes (or immediately, as print() is blocking)
          if (filename) {
            document.title = originalTitle;
          }
        }
      }}
    >
      <Download className="mr-2 h-4 w-4" /> {label}
    </Button>
  );
}
