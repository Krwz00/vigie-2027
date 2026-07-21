import { NextResponse } from "next/server";
import { fetchNewsFeed } from "@/lib/feed";

// Revalidation ISR horaire du fil d'actualité RSS.
export const revalidate = 3600;

export async function GET() {
  const items = await fetchNewsFeed(Date.now());
  return NextResponse.json(
    { items },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
