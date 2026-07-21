/** Méthodologie — 3 blocs courts + avertissement. */
export default function Methodology() {
  const blocks = [
    {
      title: "Agrégation",
      body: "Moyenne mobile pondérée sur 4 semaines glissantes, tous instituts confondus (40 / 30 / 20 / 10 du plus récent au plus ancien, par institut puis inter-instituts). Les hypothèses de configuration différentes ne sont jamais mélangées sur une même courbe.",
    },
    {
      title: "Instituts & source",
      body: "Ifop, Ipsos, Elabe, OpinionWay, Odoxa, Harris Interactive, Verian… Données extraites de Wikipédia (« Liste de sondages sur l'élection présidentielle française de 2027 » et « Élection présidentielle française de 2027 »), sous licence CC BY-SA 4.0. Le fil d'actualité est alimenté par les flux RSS des médias commanditaires.",
    },
    {
      title: "Avertissement",
      body: "Un sondage n'est pas une prévision. Il mesure un rapport de force à un instant donné, dans les marges d'erreur propres à chaque échantillon. VIGIE 2027 restitue une tendance agrégée, pas un pronostic.",
    },
  ];

  return (
    <section id="methodologie" className="grid grid-cols-1 gap-3 tab:grid-cols-3">
      {blocks.map((b) => (
        <div key={b.title} className="panel p-5">
          <div className="eyebrow mb-2">{b.title}</div>
          <p className="text-[13px] leading-relaxed text-ink-soft">{b.body}</p>
        </div>
      ))}
    </section>
  );
}
