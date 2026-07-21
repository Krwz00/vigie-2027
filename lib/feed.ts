/**
 * Fil d'actualité « nouveaux sondages publiés » — flux RSS des instituts & médias.
 * Parse les items, filtre sur les mots-clés (sondage / intentions de vote /
 * présidentielle 2027), déduplique par titre normalisé, tri antéchronologique.
 * Parser maison (sans dépendance) ; tout flux indisponible est simplement ignoré.
 */

export interface NewsItem {
  title: string;
  link: string;
  source: string;
  publishedAt: string; // ISO
  isNew: boolean;
}

const FEEDS: { source: string; url: string }[] = [
  { source: "BFMTV", url: "https://www.bfmtv.com/rss/politique/" },
  { source: "Le Figaro", url: "https://www.lefigaro.fr/rss/figaro_politique.xml" },
  { source: "Les Échos", url: "https://services.lesechos.fr/rss/les-echos-politique.xml" },
  { source: "France Info", url: "https://www.francetvinfo.fr/politique.rss" },
];

const KEYWORDS =
  /(sondage|intentions?\s+de\s+vote|pr[ée]sidentielle|baromètre|2027|le\s+pen|bardella|philippe)/i;

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/<[^>]+>/g, "")
    .trim();
}

function pick(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? decodeEntities(m[1]) : "";
}

function toISO(dateStr: string): string {
  if (!dateStr) return "";
  const t = Date.parse(dateStr);
  if (Number.isNaN(t)) return "";
  return new Date(t).toISOString();
}

function parseFeed(xml: string, source: string, nowMs: number): NewsItem[] {
  const items: NewsItem[] = [];
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  for (const block of blocks) {
    const title = pick(block, "title");
    if (!title || !KEYWORDS.test(title + " " + pick(block, "description"))) continue;
    const publishedAt = toISO(pick(block, "pubData") || pick(block, "pubDate"));
    items.push({
      title,
      link: pick(block, "link"),
      source,
      publishedAt,
      isNew: publishedAt
        ? nowMs - Date.parse(publishedAt) < 7 * 86400000
        : false,
    });
  }
  return items;
}

export async function fetchNewsFeed(nowMs: number): Promise<NewsItem[]> {
  const results = await Promise.allSettled(
    FEEDS.map(async ({ source, url }) => {
      const res = await fetch(url, {
        next: { revalidate: 3600 },
        headers: { "user-agent": "VigieBot/1.0 (+lemillenaire.org)" },
      });
      if (!res.ok) return [];
      return parseFeed(await res.text(), source, nowMs);
    }),
  );

  const all = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));

  // Déduplication par titre normalisé.
  const seen = new Set<string>();
  const deduped = all.filter((item) => {
    const key = item.title.toLowerCase().replace(/\s+/g, " ").slice(0, 80);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return deduped
    .filter((i) => i.publishedAt)
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
    .slice(0, 12);
}
