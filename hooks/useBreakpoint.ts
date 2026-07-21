"use client";

import { useEffect, useState } from "react";

export type Breakpoint = "mobile" | "tablet" | "web";

/**
 * Bascule automatique selon window.innerWidth.
 * < 760 mobile · < 1180 tablette · sinon web. Aucun sélecteur manuel.
 */
export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>("web");

  useEffect(() => {
    const compute = (): Breakpoint => {
      const w = window.innerWidth;
      if (w < 760) return "mobile";
      if (w < 1180) return "tablet";
      return "web";
    };
    const onResize = () => setBp(compute());
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return bp;
}
