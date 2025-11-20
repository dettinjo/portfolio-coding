"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export function ResumeAutoPrint() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasPrinted = useRef(false);

  useEffect(() => {
    const shouldPrint = searchParams.get("print") === "true";

    if (shouldPrint && !hasPrinted.current) {
      hasPrinted.current = true;
      
      // Small delay to ensure rendering is complete
      setTimeout(() => {
        window.print();
        
        // Optional: Remove the query param after printing
        // const newParams = new URLSearchParams(searchParams.toString());
        // newParams.delete("print");
        // router.replace(`?${newParams.toString()}`, { scroll: false });
      }, 500);
    }
  }, [searchParams, router]);

  return null;
}
