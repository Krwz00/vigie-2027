import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Le test de 2022, à l'aveugle · VIGIE 2027",
  description: "Le modèle vigie appliqué à 2022 comme s'il ne la connaissait pas.",
};

// Couleurs par candidat du site pour les membres du roster 2027, tons du même
// registre pour les cinq candidats de 2022 absents du roster (Macron, Pécresse,
// Jadot, Hidalgo, Lassalle). Les couleurs du site priment quand elles existent.
const CANDS: [string, string, string, string][] = [
  ["Emmanuel Macron", "26,2", "27,85", "#e0a53a"],
  ["Marine Le Pen", "23,7", "23,15", "#6f9bff"],
  ["Jean-Luc Mélenchon", "18,3", "21,95", "#e5484d"],
  ["Eric Zemmour", "8,9", "7,07", "#b5544c"],
  ["Valérie Pécresse", "8,0", "4,78", "#7fb3e0"],
  ["Yannick Jadot", "4,2", "4,63", "#6bbf87"],
  ["Jean Lassalle", "2,4", "3,13", "#b0895a"],
  ["Fabien Roussel", "2,5", "2,28", "#d6455a"],
  ["Nicolas Dupont-Aignan", "2,5", "2,06", "#c98a4a"],
  ["Anne Hidalgo", "1,8", "1,75", "#d9548a"],
  ["Philippe Poutou", "1,0", "0,77", "#d05050"],
  ["Nathalie Arthaud", "0,5", "0,56", "#cf3a3a"],
];
const WAVE: [string, string, string, string, string][] = [
  ["90 jours", "6,5", "7,1", "5,9", "5e sur 13"],
  ["60 jours", "6,5", "6,4", "5,6", "16e sur 26"],
  ["30 jours", "5,9", "6,0", "5,2", "18e sur 34"],
  ["15 jours", "3,3", "4,9", "3,5", "1er sur 42"],
  ["7 jours", "2,4", "3,4", "2,9", "1er sur 37"],
  ["la veille", "1,9", "2,9", "1,7", "4e sur 48"],
];

export default function Resultats2022() {
  return (
    <div className="relative min-h-screen bg-[radial-gradient(1300px_720px_at_82%_-12%,rgba(41,82,146,0.34),transparent_58%),linear-gradient(180deg,#061426,#050f1e_60%)]">
      <div className="mx-auto max-w-[760px] px-[clamp(16px,3vw,24px)] pb-20 pt-8">
        <nav className="mb-6 font-body text-[13px] text-ink-label">
          <Link href="/" className="text-gold hover:text-gold-hover">Retour au forecast</Link>
          <span className="px-2 text-ink-faint">/</span>
          <Link href="/methode" className="text-gold hover:text-gold-hover">La méthode</Link>
        </nav>
        <div className="mb-3 font-body text-[11px] uppercase tracking-[2.5px] text-gold">Le test de 2022</div>
        <h1 className="m-0 mb-4 font-display text-[clamp(28px,4.6vw,44px)] font-bold leading-[1.05] tracking-[-0.8px] text-ink">
          Le test de 2022, à l&apos;aveugle
        </h1>
        <p className="m-0 mb-8 font-body text-[16px] leading-[1.6] text-ink-soft">
          Une prévision ne vaut que si on peut la vérifier. Nous avons rejoué l&apos;élection de 2022 avec le
          modèle, comme s&apos;il ne la connaissait pas. Tous ses réglages viennent de 2002 à 2017, et à chaque
          date il ne voit que les sondages publiés avant.
        </p>

        <h2 className="mb-2 font-display text-[22px] font-semibold text-ink">Le résultat principal</h2>
        <p className="mb-3 font-body text-[15.5px] leading-[1.62] text-ink-soft">
          À quinze jours du scrutin, le modèle a fait mieux que les quarante deux sondages publiés. À sept
          jours, mieux que les trente sept. À ces deux échéances il a fait mieux que <b className="text-ink">chaque
          sondage pris isolément</b>. Ce n&apos;est pas vrai à tous les horizons, le tableau le montre en entier.
        </p>
        <figure className="my-4 overflow-hidden rounded-panel border border-panelBorder bg-[rgba(16,35,63,0.4)] p-3">
          <Image src="/forecast_2022.png" alt="2022 à l'aveugle, erreur du modèle et des sondages" width={1600} height={900} className="h-auto w-full" />
        </figure>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse font-body text-[14px]">
            <thead>
              <tr className="text-ink-label">
                <th className="border-b border-panelBorder px-2 py-2 text-left font-semibold">Avant le vote</th>
                <th className="border-b border-panelBorder px-2 py-2 text-right font-semibold">Modèle</th>
                <th className="border-b border-panelBorder px-2 py-2 text-right font-semibold">Médian</th>
                <th className="border-b border-panelBorder px-2 py-2 text-right font-semibold">Meilleur</th>
                <th className="border-b border-panelBorder px-2 py-2 text-right font-semibold">Rang</th>
              </tr>
            </thead>
            <tbody>
              {WAVE.map((r) => (
                <tr key={r[0]} className={r[0] === "15 jours" || r[0] === "7 jours" ? "bg-[rgba(216,178,74,0.06)]" : ""}>
                  <td className="border-b border-white/[0.05] px-2 py-2 text-ink">{r[0]}</td>
                  <td className="border-b border-white/[0.05] px-2 py-2 text-right tabular-nums text-ink">{r[1]}</td>
                  <td className="border-b border-white/[0.05] px-2 py-2 text-right tabular-nums text-ink-soft">{r[2]}</td>
                  <td className="border-b border-white/[0.05] px-2 py-2 text-right tabular-nums text-ink-soft">{r[3]}</td>
                  <td className="border-b border-white/[0.05] px-2 py-2 text-right text-ink-soft">{r[4]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mb-8 mt-3 font-body text-[15.5px] leading-[1.62] text-ink-soft">
          Loin du vote, le modèle se classe au milieu des sondages, la volatilité de la campagne lui échappe
          autant qu&apos;à eux. C&apos;est dans la dernière quinzaine qu&apos;il devance tout le monde. Et il ne
          gagne pas toujours, la veille il est quatrième sur quarante huit, mais il en bat quarante cinq.
        </p>

        <h2 className="mb-2 font-display text-[22px] font-semibold text-ink">Candidat par candidat</h2>
        <p className="mb-3 font-body text-[15px] text-ink-soft">Le score prévu la veille, et le résultat réel.</p>
        <div className="mb-4 flex flex-col gap-1.5">
          {CANDS.map(([name, prev, reel, color]) => (
            <div key={name} className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-[rgba(16,35,63,0.4)] px-4 py-2.5">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: color }} aria-hidden />
              <span className="min-w-0 flex-1 truncate font-body text-[15px] font-medium text-ink">{name}</span>
              <span className="shrink-0 font-body text-[21px] font-semibold tabular-nums text-ink">{prev}</span>
              <span className="w-16 shrink-0 text-right font-body text-[12px] tabular-nums text-ink-faint">réel {reel}</span>
            </div>
          ))}
        </div>
        <p className="mb-8 font-body text-[15.5px] leading-[1.62] text-ink-soft">
          La réussite, Marine Le Pen prévue à 23,7 pour 23,15 réels. L&apos;échec, Jean-Luc Mélenchon prévu à
          18,3 pour 21,95, presque quatre points trop bas, parce qu&apos;aucun sondage de la dernière semaine ne
          portait sa montée finale. Le modèle ne peut pas voir ce que les sondages n&apos;ont pas encore mesuré.
        </p>

        <h2 className="mb-2 font-display text-[22px] font-semibold text-ink">La carte</h2>
        <p className="mb-8 font-body text-[15.5px] leading-[1.62] text-ink-soft">
          Le modèle descend dans chaque département. La veille du vote, son erreur moyenne par département tombe
          à <b className="text-ink">1,4 point</b>. Les départements les moins bien prévus ne révèlent pas un
          défaut de la carte, mais un candidat national mal cadré, la Seine-Saint-Denis et Paris parce que
          Jean-Luc Mélenchon y a surperformé.
        </p>

        <h2 className="mb-2 font-display text-[22px] font-semibold text-ink">Sur les cinq élections</h2>
        <p className="mb-3 font-body text-[15.5px] leading-[1.62] text-ink-soft">
          Sur les cinq présidentielles rejouées, le modèle fait mieux que le sondage médian dans <b className="text-ink">vingt
          trois cas sur vingt neuf</b>, et mieux ou aussi bien que le dernier sondage dans <b className="text-ink">quatre
          élections sur cinq</b>.
        </p>
        <div className="my-4 rounded-panel border-l-[3px] border-l-gold bg-[rgba(216,178,74,0.06)] px-4 py-3 font-body text-[15px] text-ink-soft">
          Une précision qui borne cette réussite. L&apos;avantage vient de la correction des penchants
          d&apos;institut, qui a besoin de beaucoup d&apos;instituts pour être fiable. Elle joue pleinement en
          2017 et 2022, moins sur les élections anciennes où les sondages étaient rares. La présidentielle de
          2027, richement sondée, est dans le régime le plus favorable au modèle.
        </div>
      </div>
    </div>
  );
}
