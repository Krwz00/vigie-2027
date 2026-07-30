import type { MetadataRoute } from "next";

// Beta non indexable : aucun robot n'explore quoi que ce soit.
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", disallow: "/" }] };
}
