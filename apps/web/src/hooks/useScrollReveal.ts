// ============================================================
// STAR — useScrollReveal Hook
// Utility wrapper around Framer Motion's useInView
// ============================================================
import { useRef } from "react";
import { useInView } from "framer-motion";

export function useScrollReveal(once: boolean = true, margin: string = "-100px") {
  const ref = useRef<HTMLDivElement>(null);
  // Typecast margin to any because framer-motion types can be strict about margins format
  const isInView = useInView(ref, { once, margin: margin as any });

  return { ref, isInView };
}
