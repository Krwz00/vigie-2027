// Bandeau permanent de la beta, avec la date de derniere execution du modele.
export default function BetaBanner({ date }: { date: string | null }) {
  return (
    <div className="relative z-[60] flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 border-b border-gold/25 bg-[#0a1830] px-3 py-1.5 text-center font-body text-[12px] text-ink-soft">
      <span className="rounded-full bg-gold px-2 py-0.5 text-[11px] font-semibold text-[#04101f]">Version de travail</span>
      <span>Beta interne VIGIE, chiffres provisoires, ne pas diffuser.</span>
      {date && <span className="text-ink-faint">Modele a jour au {date}</span>}
    </div>
  );
}
