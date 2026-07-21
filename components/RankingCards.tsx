import type { Aggregate } from "@/lib/types";
import { CANDIDATES } from "@/lib/candidates";
import Avatar from "./Avatar";
import Sparkline from "./Sparkline";

/** Classement des candidats — cartes rang / avatar / sparkline / score / delta. */
export default function RankingCards({ aggregates }: { aggregates: Aggregate[] }) {
  const ranked = [...aggregates]
    .filter((a) => a.current > 0)
    .sort((a, b) => b.current - a.current);

  return (
    <section id="candidats" className="grid grid-cols-1 gap-3 tab:grid-cols-2 web:grid-cols-3">
      {ranked.map((agg, i) => {
        const c = CANDIDATES[agg.candidate];
        const up = agg.delta > 0;
        const flat = agg.delta === 0;
        return (
          <div key={agg.candidate} className="panel flex items-center gap-3 p-3.5">
            <div className="mono w-6 text-center text-lg font-semibold text-ink-faint">
              {i + 1}
            </div>
            <Avatar candidate={c} size={44} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-ink">{c.name}</div>
              <div className="truncate text-[11px] text-ink-faint">{c.party}</div>
            </div>
            <Sparkline values={agg.series.map((p) => p.value)} color={c.color} />
            <div className="w-14 text-right">
              <div className="mono text-xl font-bold text-ink">{agg.current.toFixed(0)}</div>
              <div
                className="mono text-[11px] font-semibold"
                style={{
                  color: flat ? "#5f748f" : up ? "#3fae6b" : "#e5484d",
                }}
              >
                {flat ? "±0" : `${up ? "▲" : "▼"} ${Math.abs(agg.delta).toFixed(1)}`}
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
