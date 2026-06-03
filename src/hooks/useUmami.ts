"use client";

declare global {
  interface Window {
    umami?: {
      track: (
        eventName: string,
        props?: Record<string, string | number | boolean>
      ) => void;
    };
  }
}

type UmamiProps = Record<string, string | number | boolean>;

export function useUmami() {
  const track = (name: string, props?: UmamiProps) => {
    window.umami?.track(name, props);
  };
  return { track };
}
