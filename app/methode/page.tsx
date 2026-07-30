import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Comment vigie lit les sondages · VIGIE 2027",
  description: "La méthode du modèle vigie, en français et sans équations.",
};

export default function MethodePage() {
  return (
    <div className="relative min-h-screen bg-[radial-gradient(1300px_720px_at_82%_-12%,rgba(41,82,146,0.34),transparent_58%),linear-gradient(180deg,#061426,#050f1e_60%)]">
      <div className="mx-auto max-w-[760px] px-[clamp(16px,3vw,24px)] pb-20 pt-8">
        <nav className="mb-6 font-body text-[13px] text-ink-label">
          <Link href="/" className="text-gold hover:text-gold-hover">Retour au forecast</Link>
        </nav>
        <div className="mb-3 font-body text-[11px] uppercase tracking-[2.5px] text-gold">La méthode</div>
        <h1 className="m-0 mb-4 font-display text-[clamp(28px,4.6vw,44px)] font-bold leading-[1.05] tracking-[-0.8px] text-ink">
          Comment vigie lit les sondages
        </h1>
        <p className="m-0 mb-8 font-body text-[16px] leading-[1.6] text-ink-soft">
          Le site publie déjà une moyenne des sondages. Le modèle vigie fait autre chose, il corrige ce qui
          fausse chaque sondage avant de les combiner. Voici comment, sans équations.
        </p>

        <Section title="Ce que le modèle prévoit">
          <p>Le premier tour, candidat par candidat, au niveau national et dans chacun des départements
          métropolitains. La probabilité que chaque candidat se qualifie pour le second tour. Et le second
          tour lui même, selon les duels possibles.</p>
          <p>Chaque prévision est <b className="text-ink">un chiffre unique</b>, le score le plus probable,
          mis en avant partout. Une fourchette l&apos;accompagne, plus discrète.</p>
        </Section>

        <Section title="Ce sur quoi il s&apos;appuie">
          <p>Les sondages publiés, avec leur date, leur institut et leur taille d&apos;échantillon. Les
          résultats des élections précédentes, jusqu&apos;au bureau de vote. Un socle de données électorales
          et démographiques qui couvre six décennies.</p>
          <p>Il n&apos;utilise <b className="text-ink">ni</b> la conjoncture économique, <b className="text-ink">ni</b> la
          cote de popularité du président, <b className="text-ink">ni</b> le temps de parole. Non par principe,
          mais parce que nous avons vérifié qu&apos;une fois les sondages pris en compte, ces éléments
          n&apos;améliorent pas la prévision.</p>
        </Section>

        <Section title="Comment il fonctionne">
          <p>C&apos;est ici que le modèle se distingue d&apos;une simple moyenne.</p>
          <p>Un sondage se trompe pour deux raisons. D&apos;abord parce qu&apos;il interroge un millier de
          personnes et non toute la population, une erreur de hasard qui <b className="text-ink">s&apos;atténue
          quand on en moyenne plusieurs</b>. Ensuite parce que chaque institut a ses méthodes, qui le font
          pencher toujours un peu dans le même sens, une erreur qu&apos;<b className="text-ink">une moyenne ne
          corrige pas, elle la conserve</b>.</p>
          <p>Le modèle s&apos;attaque à la seconde. Il estime en même temps l&apos;état réel de l&apos;opinion et
          le penchant propre de chaque institut, en observant comment les instituts se contredisent à une même
          date, puis il retire ces penchants. C&apos;est ce qui lui permet, certaines semaines, d&apos;être plus
          proche du résultat que n&apos;importe quel sondage pris seul, non parce qu&apos;il devine, mais parce
          qu&apos;il corrige un biais commun que le meilleur sondage porte lui aussi.</p>
          <p>Trois règles complètent le calcul. Les sondages récents comptent beaucoup plus que les anciens.
          La carte départementale se déduit du national en proportion. Et le second tour se calcule en estimant,
          pour chaque candidat éliminé, qui reporte sa voix vers l&apos;un des finalistes, vers l&apos;autre, ou
          vers l&apos;abstention. Chaque prévision porte une marge d&apos;erreur, calibrée sur les élections passées.</p>
        </Section>

        <Section title="Sa valeur, en une image">
          <p>Appliqué aux cinq dernières présidentielles sans jamais connaître le résultat, le modèle suit le
          dernier sondage publié et le devance dans la dernière ligne droite, là où la prévision compte le plus.
          Le détail est dans la note <Link href="/resultats-2022" className="text-gold hover:text-gold-hover">Le test de 2022</Link>.</p>
          <figure className="my-5 overflow-hidden rounded-panel border border-panelBorder bg-[rgba(16,35,63,0.4)] p-3">
            <Image src="/forecast_5cycles.png" alt="Cinq élections à l'aveugle, le modèle et le dernier sondage" width={1600} height={900} className="h-auto w-full" />
            <figcaption className="mt-2 font-body text-[12.5px] text-ink-faint">Erreur moyenne sur les trois premiers candidats, cinq présidentielles rejouées à l&apos;aveugle. Plus la courbe est basse, meilleure est la prévision.</figcaption>
          </figure>
        </Section>

        <Section title="Ce que le modèle ne sait pas faire">
          <p>Cette section compte autant que les autres, elle borne tout ce qui précède.</p>
          <p>Au delà de trois mois du scrutin, il ne prévoit rien d&apos;utile, aucune méthode ne fait alors mieux
          que de reconduire l&apos;élection précédente. Il ne voit pas un mouvement que les sondages n&apos;ont
          pas encore mesuré, en 2022 la montée tardive de Jean-Luc Mélenchon lui a échappé comme elle avait
          échappé aux sondages. Le second tour reste le plus incertain, les reports de voix ne se reproduisant
          pas fidèlement d&apos;une élection à l&apos;autre.</p>
          <div className="my-4 rounded-panel border-l-[3px] border-l-gold bg-[rgba(216,178,74,0.06)] px-4 py-3 font-body text-[15px] text-ink">
            En un mot, le modèle ne sait rien que les sondages ne disent pas. Il les lit mieux.
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-7">
      <h2 className="mb-2 font-display text-[22px] font-semibold text-ink" dangerouslySetInnerHTML={{ __html: title }} />
      <div className="flex flex-col gap-3 font-body text-[15.5px] leading-[1.62] text-ink-soft [&_p]:m-0">{children}</div>
    </section>
  );
}
