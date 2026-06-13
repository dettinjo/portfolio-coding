// Smooth in-page navigation that works with the sticky header.
// Card sections (resume/skills/contact) are centered in the viewport; the
// projects list aligns to its top (so the search bar + first cards are visible).
//
// We do NOT use the native `scrollIntoView({behavior:"smooth"})`: browsers abort
// a native smooth scroll the moment the document height changes underneath it,
// and our page shifts constantly mid-scroll. Two things fight the scroll:
//   1. A skill the cursor sits over expands (framer-motion `layout` hover), and a
//      stationary mouse keeps it expanded for the whole animation.
//   2. Browser scroll-anchoring nudges the position when content *above* the
//      viewport resizes (e.g. the project list shrinks after a filter is added).
// So while we drive the scroll we (a) publish an `isScrolling` flag that skill
// items subscribe to and use to force-disable their hover, (b) lock pointer
// events as a second line of defence, and (c) disable scroll-anchoring. On top
// of that the rAF loop re-reads the target's position every frame so it always
// lands on the element regardless of any remaining shift.
import { useEffect, useState, type MouseEvent } from "react";

// Sticky header is h-14 (56px); leave a little breathing room below it.
const HEADER_OFFSET = 96;
const DURATION = 500;

let rafId = 0;

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

// ── scrolling flag (subscribable) ───────────────────────────────────────────
let scrolling = false;
const listeners = new Set<(v: boolean) => void>();

function setScrolling(v: boolean) {
  if (scrolling === v) return;
  scrolling = v;
  listeners.forEach((l) => l(v));
}

/** Subscribe to programmatic-scroll state — true while an animated scroll runs. */
export function useIsScrolling() {
  const [v, setV] = useState(scrolling);
  useEffect(() => {
    listeners.add(setV);
    setV(scrolling);
    return () => {
      listeners.delete(setV);
    };
  }, []);
  return v;
}

// ── the scroll itself ────────────────────────────────────────────────────────
function lockInteractions(locked: boolean) {
  setScrolling(locked);
  document.body.style.pointerEvents = locked ? "none" : "";
  document.documentElement.style.overflowAnchor = locked ? "none" : "";
}

export function scrollToElement(id: string) {
  if (typeof document === "undefined") return;
  if (rafId) cancelAnimationFrame(rafId);
  lockInteractions(true);

  const block: ScrollLogicalPosition = id === "projekte" ? "start" : "center";
  const startY = window.scrollY;
  const startTime = performance.now();

  // Recomputed every frame so the destination tracks the element even as
  // content above it grows or shrinks during the scroll.
  const targetFor = () => {
    const el = document.getElementById(id);
    if (!el) return startY;
    const rect = el.getBoundingClientRect();
    const absoluteTop = rect.top + window.scrollY;
    const dest =
      block === "start"
        ? absoluteTop - HEADER_OFFSET
        : absoluteTop - (window.innerHeight - rect.height) / 2;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return Math.max(0, Math.min(dest, max));
  };

  // Each frame must be an *instant* jump. Plain scrollTo defers to the global
  // `html { scroll-behavior: smooth }`, which would turn every one of our ~60
  // per-frame calls into its own competing smooth scroll — they stack and fight,
  // producing the stutter/interruption. `behavior:"instant"` opts out; the
  // easing below is what makes the motion smooth.
  const jumpTo = (y: number) =>
    window.scrollTo({ top: y, left: 0, behavior: "instant" as ScrollBehavior });

  const step = (now: number) => {
    const t = Math.min(1, (now - startTime) / DURATION);
    const dest = targetFor();
    jumpTo(startY + (dest - startY) * easeOutCubic(t));
    if (t < 1) {
      rafId = requestAnimationFrame(step);
    } else {
      jumpTo(targetFor()); // final settle in case layout shifted late
      rafId = 0;
      lockInteractions(false);
    }
  };
  rafId = requestAnimationFrame(step);
}

export function smoothScrollToHash(hash: string) {
  scrollToElement(hash.replace(/^#/, ""));
}

export function handleHashNav(e: MouseEvent<HTMLAnchorElement>, hash: string) {
  if (!hash.startsWith("#")) return;
  e.preventDefault();
  smoothScrollToHash(hash);
}
