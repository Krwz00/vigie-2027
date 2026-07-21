import type { Duel } from "@/lib/types";

/** Duels de 2nd tour : barres à deux camps (Le Pen / Bardella vs adversaire). */
export default function Duels({ duels }: { duels: Duel[] }) {
  return (
    <section className="panel p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="display text-lg font-bold text-ink">Duels de 2nd tour</h2>
        <span className="eyebrow">Hypothèses de qualification</span>
      </div>

      <div className="space-y-3">
        {duels.map((d, i) => {
          const aWins = d.a.value >= d.b.value;
          return (
            <div key={i}>
              <div className="mono mb-1 flex justify-between text-[11px]">
                <span style={{ color: d.a.color }}>
                  {d.a.name} <b className="text-ink">{d.a.value}</b>
                </span>
                <span style={{ color: d.b.color }}>
                  <b className="text-ink">{d.b.value}</b> {d.b.name}
                </span>
              </div>
              <div className="flex h-6 overflow-hidden rounded-md">
                <div
                  className="flex items-center pl-2"
                  style={{
                    width: `${d.a.value}%`,
                    background: `linear-gradient(90deg, ${d.a.color}, ${d.a.color}bb)`,
                  }}
                >
                  {aWins && (
                    <span className="mono text-[10px] font-semibold text-[#04101f]">
                      ✓
                    </span>
                  )}
                </div>
                <div
                  className="flex items-center justify-end pr-2"
                  style={{
                    width: `${d.b.value}%`,
                    background: `linear-gradient(90deg, ${d.b.color}bb, ${d.b.color})`,
                  }}
                >
                  {!aWins && (
                    <span className="mono text-[10px] font-semibold text-[#04101f]">
                      ✓
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
