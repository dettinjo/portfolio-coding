"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

export function ResumeAutoPrint() {
  const searchParams = useSearchParams();
  const hasPrinted = useRef(false);

  useEffect(() => {
    const shouldPrint = searchParams.get("print") === "true";

    if (shouldPrint && !hasPrinted.current) {
      hasPrinted.current = true;
      // Small delay to ensure rendering is complete before printing.
      setTimeout(() => window.print(), 500);
    }
  }, [searchParams]);

  return null;
}
