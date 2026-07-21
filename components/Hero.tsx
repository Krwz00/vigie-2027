/** Hero court : accroche + une phrase. Pas de pavé de texte. */
export default function Hero({
  principalLabel,
  latestPollDate,
  available,
}: {
  principalLabel: string;
  latestPollDate: string | null;
  available: boolean;
}) {
  const fmt = latestPollDate
    ? new Date(latestPollDate + "T00:00:00Z").toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      })
    : null;

  return (
    <section className="pb-2 pt-8 tab:pt-12">
      <div className="eyebrow mb-3">Observatoire des sondages · Présidentielle 2027</div>
      <h1 className="display max-w-3xl text-3xl font-bold leading-[1.08] tracking-tight text-ink tab:text-5xl">
        Tous les sondages de 2027,{" "}
        <span className="text-gold">agrégés et lissés</span>.
      </h1>
      <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-soft">
        Une lecture d&apos;ensemble, tous instituts confondus — moyenne mobile
        pondérée sur quatre semaines glissantes.
      </p>
      <div className="mono mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-ink-faint">
        <span>
          Source :{" "}
          <a
            href="https://github.com/MieuxVoter/presidentielle2027"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold hover:text-gold-hover"
          >
            MieuxVoter · presidentielle2027
          </a>
        </span>
        {available && (
          <>
            <span>· courbe : {principalLabel}</span>
            {fmt && <span>· dernier terrain : {fmt}</span>}
          </>
        )}
      </div>
    </section>
  );
}
