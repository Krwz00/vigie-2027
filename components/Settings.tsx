"use client";

/**
 * Panneau de parametres de la beta. Trois familles au STATUT distinct, marque
 * clairement : parametres du modele (ajustables, or), hypotheses de scenario
 * (libres, bleu), quantites estimees (lecture seule, gris). Un bandeau distingue
 * en permanence la prevision du modele et le scenario en cours. Le scenario
 * s'encode dans l'URL et s'exporte en JSON.
 */

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { SettingsData, Param, GridPoint } from "@/lib/settings";

const BLOCS = ["GR", "GG", "CE", "DR", "DN"];

function num(n: number, d = 1) {
  return n.toFixed(d).replace(".", ",");
}
function nearest(grid: GridPoint[], v: number) {
  return grid.reduce((a, b) => (Math.abs(b.value - v) < Math.abs(a.value - v) ? b : a), grid[0]);
}

export default function Settings({ data }: { data: SettingsData | null }) {
  const F = data;
  const def = useMemo(
    () =>
      F && {
        tau_delta: F.family1.tau_delta.default,
        tau_theta: F.family1.tau_theta.default,
        tau: F.family1.tau.default,
        g: F.family1.g.default,
      },
    [F]
  );
  const [p, setP] = useState<Record<string, number> | null>(null);
  const [report, setReport] = useState<Record<string, number[]> | null>(null);
  const [probas, setProbas] = useState<number[] | null>(null);
  const [compare, setCompare] = useState(false);
  const [saved, setSaved] = useState<{ name: string; p: Record<string, number>; report: Record<string, number[]> }[]>([]);
  const [scenName, setScenName] = useState("");
  const [shareMsg, setShareMsg] = useState("");

  useEffect(() => {
    if (!F || !def) return;
    const q = new URLSearchParams(window.location.search);
    const read = (k: string, d: number) => (q.has(k) ? parseFloat(q.get(k)!) : d);
    setP({ tau_delta: read("td", def.tau_delta), tau_theta: read("tt", def.tau_theta), tau: read("ta", def.tau), g: read("g", def.g) });
    let rep = JSON.parse(JSON.stringify(F.family2.report)) as Record<string, number[]>;
    if (q.has("r")) {
      try {
        const parsed = JSON.parse(q.get("r")!);
        for (const b of BLOCS) if (parsed[b]) rep[b] = [parsed[b][0], parsed[b][1], Math.max(0, 1 - parsed[b][0] - parsed[b][1])];
      } catch {}
    }
    setReport(rep);
    setProbas(F.family2.hypotheses.map((h) => h.proba));
    try {
      const s = localStorage.getItem("vigie_scenarios");
      if (s) setSaved(JSON.parse(s));
    } catch {}
  }, [F, def]);

  useEffect(() => {
    if (!p || !def || !report || !F) return;
    const q = new URLSearchParams();
    if (p.tau_delta !== def.tau_delta) q.set("td", String(p.tau_delta));
    if (p.tau_theta !== def.tau_theta) q.set("tt", String(p.tau_theta));
    if (p.tau !== def.tau) q.set("ta", String(p.tau));
    if (p.g !== def.g) q.set("g", String(p.g));
    if (JSON.stringify(report) !== JSON.stringify(F.family2.report)) {
      const compact: Record<string, number[]> = {};
      for (const b of BLOCS) compact[b] = [report[b][0], report[b][1]];
      q.set("r", JSON.stringify(compact));
    }
    const s = q.toString();
    window.history.replaceState(null, "", s ? `?${s}` : window.location.pathname);
  }, [p, def, report, F]);

  if (!F || !p || !def || !report || !probas) {
    return <div className="grid min-h-[60vh] place-items-center font-body text-ink-faint">Parametres indisponibles.</div>;
  }

  const changed: string[] = [];
  if (p.tau_delta !== def.tau_delta) changed.push(`retrecissement maison ${num(p.tau_delta)}`);
  if (p.tau_theta !== def.tau_theta) changed.push(`marche aleatoire ${num(p.tau_theta)}`);
  if (p.tau !== def.tau) changed.push(`decote ${num(p.tau, 0)} j`);
  if (p.g !== def.g) changed.push(`largeur ${num(p.g, 2)}`);
  if (JSON.stringify(report) !== JSON.stringify(F.family2.report)) changed.push("matrice de report");
  const isScenario = changed.length > 0;

  const resetAll = () => {
    setP({ ...def });
    setReport(JSON.parse(JSON.stringify(F.family2.report)));
    setProbas(F.family2.hypotheses.map((h) => h.proba));
  };
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ params: p, report, probas }, null, 1)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "scenario_vigie.json"; a.click();
  };
  const share = () => {
    navigator.clipboard?.writeText(window.location.href).then(() => { setShareMsg("Lien copié"); setTimeout(() => setShareMsg(""), 2000); }).catch(() => setShareMsg("Copie impossible"));
  };
  const persist = (list: typeof saved) => { setSaved(list); try { localStorage.setItem("vigie_scenarios", JSON.stringify(list)); } catch {} };
  const saveScenario = () => {
    const nm = scenName.trim(); if (!nm) return;
    persist([...saved.filter((x) => x.name !== nm), { name: nm, p: { ...p }, report: JSON.parse(JSON.stringify(report)) }]);
    setScenName("");
  };
  const loadScenario = (s: (typeof saved)[number]) => { setP({ ...s.p }); setReport(JSON.parse(JSON.stringify(s.report))); };

  // Comparaison modele vs scenario, hypothese 1, via la grille du parametre modifie
  const h1id = F.family2.hypotheses[0]?.id;
  const gridAt = (par: Param, v: number) => (par.grid ? nearest(par.grid, v).forecast?.[h1id] ?? {} : {});
  const modelFc = gridAt(F.family1.tau_delta, F.family1.tau_delta.default);
  const changedKey = (["tau_delta", "tau_theta", "tau"] as const).find((k) => p[k] !== def[k]);
  const scenFc = changedKey ? gridAt(F.family1[changedKey], p[changedKey]) : modelFc;
  const modelMae = F.family1.tau_delta.grid ? nearest(F.family1.tau_delta.grid, F.family1.tau_delta.default).mae3 : undefined;
  const scenMae = changedKey && F.family1[changedKey].grid ? nearest(F.family1[changedKey].grid!, p[changedKey]).mae3 : modelMae;

  // Famille 1 : point de grille le plus proche -> scores H1 + backtest
  const gridInfo = (par: Param, v: number) => {
    if (!par.grid?.length) return null;
    const gp = nearest(par.grid, v);
    const h1 = F.family2.hypotheses[0]?.id;
    const fc = gp.forecast?.[h1] ?? {};
    const top = Object.entries(fc).sort((a, b) => b[1] - a[1]).slice(0, 3);
    return { gp, top };
  };

  // Famille 2 : second tour recalcule a partir de la matrice editee, hypothese 1
  const duel = F.family2.hypotheses[0]?.duel;
  let t2 = null as null | { nonRN: number; lePen: number; name: string };
  if (duel) {
    let toF = duel.nonRN.score, toLP = duel.lePen.score;
    for (const b of BLOCS) {
      const v = duel.blocs[b] || 0;
      toF += v * report[b][0]; toLP += v * report[b][1];
    }
    const tot = toF + toLP;
    if (tot > 0) t2 = { nonRN: (100 * toF) / tot, lePen: (100 * toLP) / tot, name: duel.nonRN.name };
  }

  return (
    <div className="relative min-h-screen bg-[radial-gradient(1300px_720px_at_82%_-12%,rgba(41,82,146,0.34),transparent_58%),linear-gradient(180deg,#061426,#050f1e_60%)]">
      <div className="mx-auto max-w-[900px] px-[clamp(16px,3vw,24px)] pb-20 pt-8">
        <span className="font-body text-[13px]">
          <a href="/" className="text-gold hover:text-gold-hover">Retour au forecast</a>
          <span className="px-2 text-ink-faint">/</span>
          <a href="/guide" className="text-gold hover:text-gold-hover">Guide</a>
        </span>
        <h1 className="mb-1 mt-4 font-display text-[clamp(26px,4vw,40px)] font-bold tracking-[-0.6px] text-ink">Paramètres (bêta)</h1>
        <p className="mb-4 max-w-[640px] font-body text-[15px] leading-[1.6] text-ink-soft">
          Trois familles au statut différent. On ne les confond jamais : de vrais paramètres du modèle, des
          jugements de scénario, et des quantités mesurées qu&apos;on ne modifie pas.
        </p>

        {/* Bandeau prevision vs scenario */}
        <div className={`mb-6 flex flex-wrap items-center gap-3 rounded-panel border px-4 py-3 ${isScenario ? "border-tri-blue/40 bg-tri-blue/[0.08]" : "border-panelBorder bg-panel"}`}>
          <span className={`rounded-full px-2.5 py-1 font-body text-[12px] font-semibold ${isScenario ? "bg-tri-blue text-white" : "bg-gold text-[#04101f]"}`}>
            {isScenario ? "Scénario modifié" : "Prévision du modèle"}
          </span>
          <span className="flex-1 font-body text-[12.5px] text-ink-soft">
            {isScenario ? `Écarts : ${changed.join(" · ")}` : "Aucun paramètre modifié, vous voyez la prévision du modèle."}
          </span>
          <button onClick={() => setCompare((c) => !c)} className={`rounded-full border px-3 py-1 font-body text-[12px] ${compare ? "border-tri-blue bg-tri-blue/20 text-ink" : "border-white/20 text-ink-soft hover:text-ink"}`}>Comparer</button>
          <button onClick={share} className="rounded-full border border-gold/40 px-3 py-1 font-body text-[12px] text-gold hover:text-gold-hover">{shareMsg || "Partager le lien"}</button>
          <button onClick={exportJSON} className="rounded-full border border-white/20 px-3 py-1 font-body text-[12px] text-ink-soft hover:text-ink">Exporter</button>
          <button onClick={resetAll} className="rounded-full border border-white/20 px-3 py-1 font-body text-[12px] text-ink-soft hover:text-ink">Réinitialiser</button>
        </div>

        {/* COMPARER modele vs scenario */}
        {compare && (
          <div className="mb-6 rounded-panel border border-tri-blue/40 bg-tri-blue/[0.06] p-4">
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="font-display text-[16px] font-semibold text-ink">Modèle contre scénario</h2>
              {modelMae != null && scenMae != null && (
                <span className="font-body text-[12px] text-ink-soft">erreur backtest : modèle <b className="tabular-nums">{num(modelMae, 2)}</b> → scénario <b className="tabular-nums text-ink">{num(scenMae, 2)}</b></span>
              )}
            </div>
            <table className="w-full font-body text-[13px]">
              <thead><tr className="text-ink-label"><th className="px-2 py-1 text-left">Candidat (H1)</th><th className="px-2 py-1 text-right">Modèle</th><th className="px-2 py-1 text-right">Scénario</th><th className="px-2 py-1 text-right">Écart</th></tr></thead>
              <tbody>
                {Object.entries(modelFc).sort((a, b) => b[1] - a[1]).map(([id, mv]) => {
                  const sv = scenFc[id] ?? mv; const d = sv - mv;
                  return (
                    <tr key={id}>
                      <td className="px-2 py-1 text-ink">{id}</td>
                      <td className="px-2 py-1 text-right tabular-nums text-ink-soft">{num(mv)}</td>
                      <td className="px-2 py-1 text-right tabular-nums text-ink">{num(sv)}</td>
                      <td className={`px-2 py-1 text-right tabular-nums ${Math.abs(d) < 0.05 ? "text-ink-faint" : d > 0 ? "text-tri-blue" : "text-tri-red"}`}>{d >= 0 ? "+" : ""}{num(d)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-1 font-body text-[11px] text-ink-faint">{changedKey ? "Comparaison sur le paramètre du modèle modifié (grille précalculée)." : "Aucun paramètre du modèle modifié : le premier tour est identique, seuls le second tour et les intervalles changent."}</p>
          </div>
        )}

        {/* SCENARIOS ENREGISTRES */}
        <div className="mb-6 flex flex-wrap items-center gap-2 rounded-panel border border-panelBorder bg-panel px-4 py-3">
          <span className="font-body text-[12.5px] text-ink-soft">Enregistrer ce scénario</span>
          <input value={scenName} onChange={(e) => setScenName(e.target.value)} placeholder="nom du scénario"
            className="w-40 rounded border border-white/15 bg-white/[0.04] px-2 py-1 font-body text-[12.5px] text-ink" />
          <button onClick={saveScenario} className="rounded-full border border-gold/40 px-3 py-1 font-body text-[12px] text-gold hover:text-gold-hover">Enregistrer</button>
          {saved.length > 0 && <span className="ml-2 font-body text-[11px] text-ink-faint">enregistrés :</span>}
          {saved.map((s) => (
            <span key={s.name} className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.03] py-0.5 pl-2.5 pr-1 font-body text-[12px] text-ink-soft">
              <button onClick={() => loadScenario(s)} className="hover:text-ink" title="recharger">{s.name}</button>
              <button onClick={() => persist(saved.filter((x) => x.name !== s.name))} className="px-1 text-ink-faint hover:text-tri-red" title="supprimer">×</button>
            </span>
          ))}
        </div>

        {/* FAMILLE 1 */}
        <Family color="#d8b24a" tag="Paramètres du modèle" sub="Ajustables. L'erreur affichée est celle des notes : erreur sur les 3 premiers candidats, 5 élections rejouées à l'aveugle, tous horizons (3,46 sans correction d'institut, 3,28 au réglage calibré ; ici paramètres globaux, d'où un léger écart).">
          {(["tau_delta", "tau_theta", "tau"] as const).map((key) => {
            const par = F.family1[key]; const info = gridInfo(par, p[key]);
            return (
              <Slider key={key} par={par} value={p[key]} onChange={(v) => setP({ ...p, [key]: v })}
                onReset={() => setP({ ...p, [key]: par.default })} snap={par.grid?.map((g) => g.value)}>
                {info && (
                  <div className="mt-1 font-body text-[11.5px] text-ink-faint">
                    {par.grid![0].mae3 != null ? `erreur ${num(info.gp.mae3!, 2)} pts · ` : `${par.backtest ?? ""} · `}
                    H1 : {info.top.map(([id, s]) => `${id} ${num(s)}`).join(" · ")}
                  </div>
                )}
              </Slider>
            );
          })}
          <Slider par={F.family1.g} value={p.g} onChange={(v) => setP({ ...p, g: v })} onReset={() => setP({ ...p, g: F.family1.g.default })}>
            <div className="mt-1 font-body text-[11.5px] text-ink-faint">
              recalcul immediat · exemple d&apos;intervalle à 25 % : {num(25 - 6.5 * (p.g / F.family1.g.default))} a {num(25 + 6.5 * (p.g / F.family1.g.default))}
            </div>
          </Slider>
        </Family>

        {/* FAMILLE 2 */}
        <Family color="#2f5fd0" tag="Hypothèses de scénario" sub="Libres. Ce sont des jugements, faits pour être modifiés.">
          <div className="mb-2 font-body text-[13px] font-semibold text-ink">Matrice de report du second tour</div>
          <div className="overflow-x-auto">
            <table className="font-body text-[12.5px]">
              <thead>
                <tr className="text-ink-label"><th className="px-2 py-1 text-left">Bloc</th><th className="px-2 py-1">vers non-RN</th><th className="px-2 py-1">vers Le Pen</th><th className="px-2 py-1">abstention</th><th className="px-2 py-1">somme</th></tr>
              </thead>
              <tbody>
                {BLOCS.map((b) => {
                  const row = report[b]; const sum = row[0] + row[1] + row[2];
                  return (
                    <tr key={b}>
                      <td className="px-2 py-1 text-ink">{F.family2.blocLabels[b]}</td>
                      {[0, 1].map((j) => (
                        <td key={j} className="px-2 py-1">
                          <input type="number" step={0.05} min={0} max={1} value={row[j]}
                            onChange={(e) => { const nr = { ...report }; const v = Math.max(0, Math.min(1, parseFloat(e.target.value) || 0)); nr[b] = [...row]; nr[b][j] = v; nr[b][2] = Math.max(0, 1 - nr[b][0] - nr[b][1]); setReport(nr); }}
                            className="w-16 rounded border border-white/15 bg-white/[0.04] px-1.5 py-0.5 text-right tabular-nums text-ink" />
                        </td>
                      ))}
                      <td className="px-2 py-1 text-right tabular-nums text-ink-faint">{num(row[2], 2)}</td>
                      <td className={`px-2 py-1 text-right tabular-nums ${Math.abs(sum - 1) < 0.001 ? "text-ink-faint" : "text-tri-red"}`}>{num(sum, 2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-1 font-body text-[11px] text-ink-faint">Somme forcée à un par ligne, l&apos;abstention absorbe le reste.</p>
          {t2 && (
            <div className="mt-3 rounded-2xl border border-white/[0.06] bg-[rgba(16,35,63,0.4)] px-4 py-3 font-body text-[13px] text-ink">
              Second tour recalculé (hypothèse la plus probable) : <b>{t2.name} {num(t2.nonRN)}</b> contre Le Pen {num(t2.lePen)}
            </div>
          )}
          <div className="mt-3 font-body text-[11.5px] text-ink-faint">
            Probabilités d&apos;hypothèse et exclusion d&apos;institut : dans la bêta, les probabilités s&apos;affichent ci dessous ; la repondération ou l&apos;exclusion d&apos;un institut exige de relancer l&apos;agrégation et n&apos;est pas encore interactive.
            <div className="mt-1 flex flex-wrap gap-x-4">{F.family2.hypotheses.map((h, i) => <span key={h.id}>H{i + 1} : {Math.round(probas[i] * 100)} %</span>)}</div>
          </div>
        </Family>

        {/* FAMILLE 3 */}
        <Family color="#8ba0bd" tag="Quantités estimées" sub="Lecture seule. Les déplacer remplacerait une mesure par une opinion.">
          <div className="mb-2 font-body text-[13px] font-semibold text-ink">Effets de maison par institut (Le Pen)</div>
          <table className="mb-2 font-body text-[12.5px]">
            <thead><tr className="text-ink-label"><th className="px-2 py-1 text-left">Institut</th><th className="px-2 py-1 text-right">penchant</th><th className="px-2 py-1 text-right">incertitude</th><th className="px-2 py-1 text-right">sondages</th></tr></thead>
            <tbody>
              {F.family3.house["Le Pen"]?.map((r) => (
                <tr key={r.institut}><td className="px-2 py-1 text-ink">{r.institut}</td><td className="px-2 py-1 text-right tabular-nums text-ink-soft">{r.value >= 0 ? "+" : ""}{num(r.value)}</td><td className="px-2 py-1 text-right tabular-nums text-ink-faint">± {num(r.se)}</td><td className="px-2 py-1 text-right tabular-nums text-ink-faint">{r.n}</td></tr>
              ))}
            </tbody>
          </table>
          <p className="mb-4 font-body text-[11.5px] leading-[1.5] text-ink-faint">{F.family3.houseNote}</p>
          <div className="grid grid-cols-1 gap-3 web:grid-cols-2">
            <div className="rounded-2xl border border-white/[0.06] bg-[rgba(16,35,63,0.3)] px-4 py-3">
              <div className="font-body text-[12.5px] font-semibold text-ink">Penchant territorial</div>
              <div className="font-body text-[12px] text-ink-soft">de {num(F.family3.penchant.min)} à {num(F.family3.penchant.max)}, mediane {num(F.family3.penchant.median)}</div>
              <div className="mt-1 font-body text-[11px] text-ink-faint">{F.family3.penchant.note}</div>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-[rgba(16,35,63,0.3)] px-4 py-3">
              <div className="font-body text-[12.5px] font-semibold text-ink">Écart type par horizon</div>
              <div className="mt-1 flex flex-wrap gap-x-3 font-body text-[11.5px] tabular-nums text-ink-soft">{F.family3.sdByHorizon.map((s) => <span key={s.horizon}>J-{s.horizon} : {num(s.sd, 1)}</span>)}</div>
              <div className="mt-1 font-body text-[11px] text-ink-faint">{F.family3.sdNote}</div>
            </div>
          </div>
        </Family>
      </div>
    </div>
  );
}

function Family({ color, tag, sub, children }: { color: string; tag: string; sub: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 rounded-panel border bg-panel p-4 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.7)]" style={{ borderColor: color + "44" } as CSSProperties}>
      <div className="mb-1 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
        <h2 className="font-display text-[17px] font-semibold text-ink">{tag}</h2>
      </div>
      <p className="mb-3 font-body text-[12.5px] text-ink-faint">{sub}</p>
      {children}
    </section>
  );
}

function Slider({ par, value, onChange, onReset, snap, children }: { par: Param; value: number; onChange: (v: number) => void; onReset: () => void; snap?: number[]; children?: React.ReactNode }) {
  const changed = value !== par.default;
  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-body text-[13.5px] font-medium text-ink">{par.label}</span>
        <span className="font-body text-[12px] text-ink-faint">
          <b className="tabular-nums text-ink">{num(value, par.max <= 3 ? 1 : 0)}</b> · calibré {num(par.calibrated, par.max <= 3 ? 1 : 0)}
          {changed && <button onClick={onReset} className="ml-2 text-gold hover:text-gold-hover">défaut</button>}
        </span>
      </div>
      <input type="range" min={par.min} max={par.max} step={snap ? undefined : 0.05}
        value={value} list={snap ? `snap-${par.label}` : undefined}
        onChange={(e) => { let v = parseFloat(e.target.value); if (snap) v = snap.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a), snap[0]); onChange(v); }}
        className="mt-1 w-full accent-gold" />
      {snap && <datalist id={`snap-${par.label}`}>{snap.map((s) => <option key={s} value={s} />)}</datalist>}
      <div className="font-body text-[11.5px] leading-[1.4] text-ink-faint">{par.note}</div>
      {children}
    </div>
  );
}
