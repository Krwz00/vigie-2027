import type { Kpi } from "@/lib/types";

/** Bandeau KPI — 4 tuiles. */
export default function KpiBar({ kpis }: { kpis: Kpi[] }) {
  return (
    <section className="grid grid-cols-2 gap-3 web:grid-cols-4">
      {kpis.map((k) => (
        <div key={k.label} className="panel p-4">
          <div className="eyebrow mb-2">{k.label}</div>
          <div
            className={`display text-2xl font-bold tab:text-3xl ${
              k.accent ? "text-gold" : "text-ink"
            }`}
          >
            {k.value}
          </div>
          <div className="mono mt-1 text-[11px] text-ink-faint">{k.sub}</div>
        </div>
      ))}
    </section>
  );
}
