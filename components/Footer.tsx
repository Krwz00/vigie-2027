import Logo from "./Logo";

/** Pied de page — signature Le Millénaire + touches tricolore discrètes. */
export default function Footer() {
  return (
    <footer className="mt-4 border-t border-white/5 pt-6">
      {/* Touches tricolore discrètes */}
      <div className="mb-6 flex h-0.5 w-24 overflow-hidden rounded-full">
        <span className="flex-1 bg-tri-blue" />
        <span className="flex-1 bg-tri-white" />
        <span className="flex-1 bg-tri-red" />
      </div>

      <div className="flex flex-col justify-between gap-6 pb-10 tab:flex-row tab:items-end">
        <div>
          <Logo />
          <p className="mt-3 max-w-md text-[13px] leading-relaxed text-ink-soft">
            VIGIE 2027 est un observatoire indépendant des sondages de la
            présidentielle française, édité par le think tank Le Millénaire.
          </p>
        </div>
        <div className="mono text-[11px] leading-relaxed text-ink-faint tab:text-right">
          <div>Le Millénaire · think tank indépendant</div>
          <a href="mailto:contact@lemillenaire.org" className="text-gold hover:text-gold-hover">
            contact@lemillenaire.org
          </a>
          <div className="mt-2">Un sondage n&apos;est pas une prévision.</div>
        </div>
      </div>
    </footer>
  );
}
