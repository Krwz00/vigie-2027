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
      <div
        className="mb-3.5 font-body uppercase text-gold"
        style={{ fontSize: 11, letterSpacing: "2.5px" }}
      >
        Présidentielle française 2027
      </div>
      <h1
        className="display font-bold text-ink"
        style={{
          fontSize: "clamp(30px, 5vw, 56px)",
          lineHeight: 1.02,
          letterSpacing: "-1.2px",
          textWrap: "balance",
        }}
      >
        Tous les sondages de la présidentielle sur{" "}
        <span className="text-gold">une seule courbe.</span>
      </h1>
      <p className="mt-3.5 max-w-[580px] text-[15.5px] leading-[1.55] text-ink-soft">
        La moyenne agrégée de tous les instituts, posée sur chaque sondage brut.
        Survolez la courbe pour lire le détail, point par point.
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
