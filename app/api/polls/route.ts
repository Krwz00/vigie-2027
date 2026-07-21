import { NextResponse } from "next/server";
import { getVigieData } from "@/lib/data";

// Revalidation ISR horaire : rafraîchit sans redéploiement.
export const revalidate = 3600;

export async function GET() {
  const data = await getVigieData();
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
