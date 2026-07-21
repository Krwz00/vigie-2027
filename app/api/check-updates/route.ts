import { NextResponse } from "next/server";
import { checkForUpdates } from "@/lib/updates";

// Toujours dynamique : la vérification interroge la source à chaque appel.
export const dynamic = "force-dynamic";

export async function GET() {
  const result = await checkForUpdates();
  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}
