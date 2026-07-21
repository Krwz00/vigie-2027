"use client";

import { useEffect, useRef } from "react";

/**
 * Marque le fil des sondages comme « vu » dès qu'il entre dans le viewport :
 * POST /api/seen (remet le compteur serveur à zéro) + événement « vigie:seen »
 * pour réinitialiser le badge du header. Ne s'exécute qu'une fois.
 */
export default function SeenBeacon() {
  const ref = useRef<HTMLSpanElement>(null);
  const done = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (done.current) return;
        if (entries.some((e) => e.isIntersecting)) {
          done.current = true;
          obs.disconnect();
          fetch("/api/seen", { method: "POST" }).catch(() => {});
          window.dispatchEvent(new Event("vigie:seen"));
        }
      },
      { threshold: 0.2 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return <span ref={ref} aria-hidden="true" />;
}
