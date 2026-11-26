import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { syncMarkets } from "@/lib/market/store";

function authorized(request: NextRequest, secret: string): boolean {
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** Refreshes the market cache. Called every 5 min by netlify/functions/sync-markets.mts. */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  if (!authorized(request, secret)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const result = await syncMarkets();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("market sync failed", err);
    return NextResponse.json({ error: "sync_failed" }, { status: 500 });
  }
}
