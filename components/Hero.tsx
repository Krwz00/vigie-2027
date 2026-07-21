/** Hero court : accroche + une phrase. Pas de pavé de texte. */
export default function Hero({
  principalLabel,
  lastPollInstitute,
  lastPollDates,
  updatedAt,
  available,
}: {
  principalLabel: string;
  lastPollInstitute: string | null;
  lastPollDates: string | null;
  updatedAt: string;
  available: boolean;
}) {
  const fmtRange = (label: string | null) => {
    if (!label) return null;
    const [a, b] = label.split(" → ");
    const f = (iso: string) =>
      new Date(iso + "T00:00:00Z").toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      });
    return a && b ? `${f(a).replace(/ \d{4}$/, "")} – ${f(b)}` : f(label);
  };
  const refresh = new Date(updatedAt).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

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

      {/* Double date : dernier sondage réel + fraîcheur des données (plus de faux LIVE) */}
      {available && (
        <div className="mono mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-faint">
          {lastPollInstitute && (
            <span>
              Dernier sondage :{" "}
              <span className="text-ink-soft">
                {lastPollInstitute}, {fmtRange(lastPollDates)}
              </span>
            </span>
          )}
          <span>· Données à jour au {refresh}</span>
          <span>· courbe : {principalLabel}</span>
        </div>
      )}

      <div className="mono mt-1.5 text-[11px] text-ink-faint">
        Source :{" "}
        <a
          href="https://fr.wikipedia.org/wiki/Liste_de_sondages_sur_l%27%C3%A9lection_pr%C3%A9sidentielle_fran%C3%A7aise_de_2027"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold hover:text-gold-hover"
        >
          Wikipédia
        </a>{" "}
        · CC BY-SA 4.0
      </div>
    </section>
  );
}
