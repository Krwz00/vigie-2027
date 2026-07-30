"use client";

/**
 * Bascule Sondages / Prevision en tete de page. Deux vues, deux sources, une
 * seule verite pour chacune. La phrase d'articulation dit la difference. Vigie
 * (agregateur) reste intact ; Forecast (modele) est une vue distincte.
 */

import { createElement as h, useState, type CSSProperties } from "react";
import type { VigieData } from "@/lib/types";
import type { ForecastData } from "@/lib/forecast";
import Vigie from "./Vigie";
import Forecast from "./Forecast";

const st = (s: CSSProperties) => s;

export default function Shell({ data, forecast }: { data: VigieData; forecast: ForecastData | null }) {
  const [tab, setTab] = useState<"sondages" | "prevision">("sondages");

  const btn = (id: "sondages" | "prevision", label: string) => {
    const on = tab === id;
    return h(
      "button",
      {
        key: id,
        onClick: () => setTab(id),
        style: st({
          fontFamily: "var(--font-display)",
          fontSize: 13.5,
          fontWeight: 600,
          letterSpacing: "0.3px",
          padding: "7px 18px",
          borderRadius: 999,
          border: "none",
          cursor: "pointer",
          color: on ? "#04101f" : "#cdd9ea",
          background: on ? "linear-gradient(145deg,#ecd08a,#d8b24a)" : "transparent",
          transition: "background .15s, color .15s",
        }),
      },
      label
    );
  };

  const bar = h(
    "div",
    {
      style: st({
        position: "relative",
        zIndex: 50,
        background: "#050f1e",
        borderBottom: "1px solid rgba(216,178,74,0.16)",
        padding: "9px clamp(16px,3vw,24px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        flexWrap: "wrap",
      }),
    },
    h(
      "div",
      {
        style: st({
          display: "inline-flex",
          gap: 4,
          padding: 4,
          borderRadius: 999,
          border: "1px solid rgba(216,178,74,0.22)",
          background: "rgba(16,35,63,0.5)",
        }),
      },
      btn("sondages", "Sondages"),
      btn("prevision", "Prévision")
    ),
    h(
      "span",
      {
        style: st({
          fontFamily: "var(--font-body)",
          fontSize: 11.5,
          color: "#8ba0bd",
          maxWidth: 620,
          lineHeight: 1.4,
        }),
      },
      tab === "sondages"
        ? "Ce que disent les sondages, moyenne sur quatre semaines."
        : "Le penchant des instituts corrigé, projeté au jour du scrutin."
    ),
    h(
      "span",
      { style: st({ display: "inline-flex", gap: 14, fontFamily: "var(--font-body)", fontSize: 12 }) },
      h("a", { href: "/methode", style: st({ color: "#d8b24a" }) }, "Méthode"),
      h("a", { href: "/resultats-2022", style: st({ color: "#d8b24a" }) }, "Test 2022"),
      h("a", { href: "/parametres", style: st({ color: "#8ba0bd" }) }, "Paramètres bêta")
    )
  );

  return h(
    "div",
    { style: st({ position: "relative" }) },
    bar,
    tab === "sondages" ? h(Vigie, { data }) : h(Forecast, { data: forecast })
  );
}
