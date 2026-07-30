import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Guide de la beta · VIGIE 2027" };

export default function Guide() {
  return (
    <div className="relative min-h-screen bg-[radial-gradient(1300px_720px_at_82%_-12%,rgba(41,82,146,0.34),transparent_58%),linear-gradient(180deg,#061426,#050f1e_60%)]">
      <div className="mx-auto max-w-[720px] px-[clamp(16px,3vw,24px)] pb-20 pt-8">
        <nav className="mb-6 font-body text-[13px] text-ink-label">
          <Link href="/parametres" className="text-gold hover:text-gold-hover">Aller au panneau</Link>
          <span className="px-2 text-ink-faint">/</span>
          <Link href="/" className="text-gold hover:text-gold-hover">Voir la prévision</Link>
        </nav>
        <div className="mb-3 font-body text-[11px] uppercase tracking-[2.5px] text-gold">Guide</div>
        <h1 className="m-0 mb-4 font-display text-[clamp(26px,4.4vw,40px)] font-bold tracking-[-0.6px] text-ink">Prendre la main sur le modèle</h1>
        <p className="m-0 mb-6 font-body text-[15.5px] leading-[1.6] text-ink-soft">
          Le panneau de paramètres est l&apos;outil principal. Il permet de jouer avec les réglages du modèle
          et de tester des scénarios de candidature. Voici l&apos;essentiel, en une page.
        </p>

        <Sec title="Les curseurs, en une phrase">
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            <Li><b className="text-ink">Rétrécissement des effets de maison</b> : corrige le penchant propre de chaque institut. À zéro, le modèle redevient une simple moyenne et l&apos;erreur passe de 3,31 à 3,44 ; c&apos;est la démonstration de ce qui fait sa valeur. Laissez-le au réglage calibré.</Li>
            <Li><b className="text-ink">Vitesse de la marche aléatoire</b> : autorise l&apos;opinion à bouger plus ou moins vite entre deux dates.</Li>
            <Li><b className="text-ink">Décote temporelle</b> : plus elle est grande, plus les sondages anciens comptent.</Li>
            <Li><b className="text-ink">Largeur d&apos;intervalle</b> : resserre ou élargit toutes les fourchettes, sans changer le point.</Li>
          </ul>
        </Sec>

        <Sec title="Ce que vous pouvez fixer, ce qu&apos;il vaut mieux laisser">
          <p>Deux natures, jamais confondues dans le panneau.</p>
          <p><b className="text-tri-blue">Des jugements, libres à fixer</b> (famille bleue) : les probabilités de chaque hypothèse de candidature, et la matrice de report du second tour. Ce sont des paris, faits pour être modifiés.</p>
          <p><b className="text-ink-soft">Des mesures, à ne pas déplacer sans raison</b> : les paramètres du modèle (famille or) sont calibrés ; les quantités estimées (famille grise, penchants d&apos;institut et de territoire) sont en lecture seule. Les déplacer remplacerait une mesure par une opinion. Pour agir sur un institut, on l&apos;exclut ou on le repondère en famille bleue, ce qui est une décision de méthode.</p>
        </Sec>

        <Sec title="Enregistrer et partager un scénario">
          <p><b className="text-ink">Enregistrer</b> : donnez un nom, le scénario est gardé dans votre navigateur, rechargeable en un clic. <b className="text-ink">Exporter</b> le télécharge en fichier pour le transmettre.</p>
          <p><b className="text-ink">Partager</b> copie un lien qui encode tout le scénario : quiconque l&apos;ouvre retrouve exactement la même configuration. <b className="text-ink">Comparer</b> affiche côte à côte la prévision du modèle et votre scénario, candidat par candidat, avec l&apos;écart.</p>
        </Sec>

        <Sec title="Ce qui se met à jour tout seul">
          <p>La prévision se recalcule chaque jour à partir des nouveaux sondages, la courbe d&apos;évolution se remplit d&apos;elle même. La date de dernière exécution est dans le bandeau en haut. Vos réglages, eux, ne bougent que si vous les changez.</p>
        </Sec>

        <div className="mt-6 rounded-panel border-l-[3px] border-l-gold bg-[rgba(216,178,74,0.06)] px-4 py-3 font-body text-[14px] text-ink-soft">
          À tester en premier : mettez le rétrécissement des effets de maison à zéro, puis activez Comparer.
          Vous voyez d&apos;un coup ce que la correction des instituts apporte, chiffre à l&apos;appui.
        </div>
      </div>
    </div>
  );
}

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 font-display text-[20px] font-semibold text-ink">{title}</h2>
      <div className="flex flex-col gap-2 font-body text-[15px] leading-[1.6] text-ink-soft [&_p]:m-0">{children}</div>
    </section>
  );
}
function Li({ children }: { children: React.ReactNode }) {
  return <li className="border-l-2 border-white/10 pl-3 font-body text-[14.5px] leading-[1.55] text-ink-soft">{children}</li>;
}
