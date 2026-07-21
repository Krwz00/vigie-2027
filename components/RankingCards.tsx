import type { Aggregate } from "@/lib/types";
import { CANDIDATES } from "@/lib/candidates";
import Avatar from "./Avatar";
import Sparkline from "./Sparkline";

function Delta({ delta }: { delta: number }) {
  const up = delta > 0;
  const flat = delta === 0;
  return (
    <div
      className="mono text-[11px] font-semibold"
      style={{ color: flat ? "#5f748f" : up ? "#3fae6b" : "#e5484d" }}
    >
      {flat ? "±0" : `${up ? "▲" : "▼"} ${Math.abs(delta).toFixed(1)}`}
    </div>
  );
}

/** Classement des candidats — duo de tête mis en avant, puis grille. */
export default function RankingCards({ aggregates }: { aggregates: Aggregate[] }) {
  const ranked = [...aggregates]
    .filter((a) => a.current > 0)
    .sort((a, b) => b.current - a.current);
  const top = ranked.slice(0, 2);
  const rest = ranked.slice(2);

  return (
    <section id="candidats" className="space-y-3">
      {/* Duo de tête — cartes larges, accent or */}
      <div className="grid grid-cols-1 gap-3 tab:grid-cols-2">
        {top.map((agg, i) => {
          const c = CANDIDATES[agg.candidate];
          return (
            <div
              key={agg.candidate}
              className="panel relative flex items-center gap-4 p-4"
              style={{
                borderColor: "rgba(216,178,74,.45)",
                background:
                  "linear-gradient(180deg, rgba(216,178,74,.06), rgba(9,21,40,.9))",
              }}
            >
              <div
                className="mono absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-bold text-[#04101f]"
                style={{ background: "#d8b24a" }}
              >
                {i === 0 ? "1ᵉʳ" : "2ᵉ"}
              </div>
              <div className="relative">
                <Avatar candidate={c} size={64} />
                <span
                  className="mono absolute -bottom-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-[#04101f]"
                  style={{ background: "#d8b24a", boxShadow: "0 0 0 2px #061426" }}
                >
                  {i + 1}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-base font-bold text-ink">{c.name}</div>
                <div className="truncate text-[12px] text-ink-faint">{c.party}</div>
                <div className="mt-1.5">
                  <Sparkline
                    values={agg.series.map((p) => p.value)}
                    color={c.color}
                    width={120}
                    height={26}
                  />
                </div>
              </div>
              <div className="text-right">
                <div className="mono text-3xl font-bold text-gold">
                  {agg.current.toFixed(0)}
                </div>
                <Delta delta={agg.delta} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Suite du classement */}
      <div className="grid grid-cols-1 gap-3 tab:grid-cols-2 web:grid-cols-3">
        {rest.map((agg, i) => {
          const c = CANDIDATES[agg.candidate];
          return (
            <div key={agg.candidate} className="panel flex items-center gap-3 p-3.5">
              <div className="mono w-6 text-center text-lg font-semibold text-ink-faint">
                {i + 3}
              </div>
              <Avatar candidate={c} size={44} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-ink">{c.name}</div>
                <div className="truncate text-[11px] text-ink-faint">{c.party}</div>
              </div>
              <Sparkline values={agg.series.map((p) => p.value)} color={c.color} />
              <div className="w-14 text-right">
                <div className="mono text-xl font-bold text-ink">
                  {agg.current.toFixed(0)}
                </div>
                <Delta delta={agg.delta} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
