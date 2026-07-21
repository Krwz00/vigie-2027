"use client";

import { useState } from "react";
import type { Hypothesis } from "@/lib/types";

/** Hypothèses de 1er tour : sélecteur de configurations + barres horizontales. */
export default function Hypotheses({ hypotheses }: { hypotheses: Hypothesis[] }) {
  const [active, setActive] = useState(0);
  const h = hypotheses[active];
  const max = Math.max(...h.results.map((r) => r.value), 1);

  return (
    <section id="hypotheses" className="panel p-5">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 className="display text-lg font-bold text-ink">Hypothèses de 1er tour</h2>
        <span className="eyebrow">{hypotheses.length} configurations</span>
      </div>

      {/* Sélecteur de configurations */}
      <div
        className="mb-4 flex flex-wrap gap-1.5"
        role="tablist"
        aria-label="Configurations testées"
      >
        {hypotheses.map((hyp, i) => (
          <button
            key={hyp.label}
            type="button"
            role="tab"
            aria-selected={i === active}
            className="chip tap"
            data-active={i === active}
            onClick={() => setActive(i)}
          >
            {hyp.label}
          </button>
        ))}
      </div>

      <p className="mb-4 text-[13px] leading-relaxed text-ink-soft">{h.note}</p>

      {/* Barres horizontales par candidat */}
      <div className="space-y-2.5">
        {h.results.map((r) => (
          <div key={r.name} className="flex items-center gap-3">
            <div className="w-24 shrink-0 text-right text-[13px] text-ink-soft">
              {r.name}
            </div>
            <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-white/[0.04]">
              <div
                className="flex h-full items-center rounded-md pl-2 transition-all"
                style={{
                  width: `${(r.value / max) * 100}%`,
                  background: `linear-gradient(90deg, ${r.color}dd, ${r.color}55)`,
                  minWidth: 34,
                }}
              >
                <span className="mono text-[11px] font-semibold text-[#04101f]">
                  {r.value.toFixed(1).replace(/\.0$/, "")}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
