"use client";

/**
 * Vue Prevision (modele vigie). Etape a : squelette avec la phrase d'articulation,
 * verifie que la bascule fonctionne. Les vues detaillees (classement, courbe,
 * hypotheses, duels, carte) suivent aux etapes b et d.
 */

import { createElement as h, type CSSProperties } from "react";
import type { ForecastData } from "@/lib/forecast";

const st = (s: CSSProperties) => s;

export default function Forecast({ data }: { data: ForecastData | null }) {
  const wrap = (children: React.ReactNode) =>
    h(
      "div",
      {
        style: st({
          position: "relative",
          minHeight: "70vh",
          background:
            "radial-gradient(1300px 720px at 82% -12%, rgba(41,82,146,0.34), transparent 58%), linear-gradient(180deg,#061426,#050f1e 60%)",
          padding: "40px clamp(16px,3vw,24px) 64px",
        }),
      },
      h("div", { style: st({ maxWidth: 1040, margin: "0 auto" }) }, children)
    );

  if (!data) {
    return wrap(
      h(
        "p",
        { style: st({ color: "#a2b4cd", fontFamily: "var(--font-body)" }) },
        "Prevision indisponible pour le moment."
      )
    );
  }

  return wrap([
    h(
      "div",
      {
        key: "eyebrow",
        style: st({
          fontFamily: "var(--font-body)",
          fontSize: 11,
          letterSpacing: "2.5px",
          color: "#d8b24a",
          textTransform: "uppercase",
          marginBottom: 14,
        }),
      },
      "Modele vigie"
    ),
    h(
      "h1",
      {
        key: "h1",
        style: st({
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: "clamp(28px,4.4vw,48px)",
          lineHeight: 1.04,
          letterSpacing: "-1px",
          margin: "0 0 16px",
        }),
      },
      "Prevision du premier tour"
    ),
    h(
      "p",
      {
        key: "phrase",
        style: st({ maxWidth: 640, margin: "0 0 10px", color: "#a2b4cd", fontSize: 15.5, lineHeight: 1.6 }),
      },
      data.phrase
    ),
    h(
      "p",
      { key: "meta", style: st({ color: "#5f748f", fontFamily: "var(--font-body)", fontSize: 12.5 }) },
      `A jour au ${data.updatedAt} · ${data.nSondages} sondages · ${data.hypotheses.length} hypotheses de candidature`
    ),
  ]);
}
