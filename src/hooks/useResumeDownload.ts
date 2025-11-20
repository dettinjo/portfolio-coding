"use client";

import { useCallback } from "react";

export function useResumeDownload() {
  const downloadResume = useCallback(() => {
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = "/resume?print=true";
    document.body.appendChild(iframe);

    // Clean up the iframe after a reasonable amount of time
    // The printing itself is handled by the page inside the iframe
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 5000); // 5 seconds should be enough for the print dialog to appear and the print to start
  }, []);

  return { downloadResume };
}
