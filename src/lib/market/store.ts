import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchMarketSnapshot, HISTORY_DAYS } from "./sources";
import type { MarketData, MarketSnapshot, PegMechanism, Stablecoin } from "./types";

interface StablecoinRow {
  id: string;
  symbol: string;
  name: string;
  gecko_id: string | null;
  peg_type: string | null;
  peg_mechanism: string | null;
  price: number | null;
  market_cap: number | null;
  market_cap_prev_day: number | null;
  volume_24h: number | null;
  price_change_24h_pct: number | null;
  chains: string[] | null;
  chain_circulating: Record<string, number> | null;
  updated_at: string;
}

function toRow(c: Stablecoin, now: string, hasVolume: boolean) {
  return {
    id: c.id,
    symbol: c.symbol,
    name: c.name,
    gecko_id: c.geckoId,
    peg_type: c.pegType,
    peg_mechanism: c.pegMechanism,
    price: c.price,
    market_cap: c.marketCap,
    market_cap_prev_day: c.marketCapPrevDay,
    chains: c.chains,
    chain_circulating: c.chainCirculating,
    listed: true,
    updated_at: now,
    // If CoinGecko failed, leave the last known volume untouched.
    ...(hasVolume ? { volume_24h: c.volume24h, price_change_24h_pct: c.priceChange24hPct } : {}),
  };
}

function fromRow(r: StablecoinRow): Stablecoin {
  const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));
  return {
    id: r.id,
    symbol: r.symbol,
    name: r.name,
    geckoId: r.gecko_id,
    pegType: r.peg_type ?? "USD",
    pegMechanism: (r.peg_mechanism ?? "other") as PegMechanism,
    price: num(r.price),
    marketCap: Number(r.market_cap ?? 0),
    marketCapPrevDay: num(r.market_cap_prev_day),
    volume24h: num(r.volume_24h),
    priceChange24hPct: num(r.price_change_24h_pct),
    chains: r.chains ?? [],
    chainCirculating: r.chain_circulating ?? {},
  };
}

/** Writes a snapshot to Supabase. Coins that dropped out are unlisted, not deleted (alerts reference them). */
export async function saveSnapshot(snapshot: MarketSnapshot) {
  const db = createAdminClient();
  const now = new Date().toISOString();

  const rows = snapshot.coins.map((c) => toRow(c, now, snapshot.hasVolume));
  const { error: upsertError } = await db.from("stablecoins").upsert(rows, { onConflict: "id" });
  if (upsertError) throw upsertError;

  if (rows.length > 0) {
    const ids = rows.map((r) => `"${r.id.replace(/"/g, "")}"`).join(",");
    const { error } = await db
      .from("stablecoins")
      .update({ listed: false })
      .eq("listed", true)
      .not("id", "in", `(${ids})`);
    if (error) throw error;
  }

  const historyRows = snapshot.history.map((p) => ({
    date: p.date,
    total_market_cap: p.totalMarketCap,
    updated_at: now,
  }));
  const { error: historyError } = await db.from("market_history").upsert(historyRows, { onConflict: "date" });
  if (historyError) throw historyError;

  return { coins: rows.length, historyDays: historyRows.length, hasVolume: snapshot.hasVolume, at: now };
}

/** Fetches from the APIs and stores the result. Used by the cron route. */
export async function syncMarkets() {
  return saveSnapshot(await fetchMarketSnapshot());
}

async function readCache(): Promise<MarketData | null> {
  const db = createAdminClient();
  const [coinsRes, historyRes] = await Promise.all([
    db.from("stablecoins").select("*").eq("listed", true).order("market_cap", { ascending: false }),
    db
      .from("market_history")
      .select("date, total_market_cap")
      .order("date", { ascending: false })
      .limit(HISTORY_DAYS),
  ]);
  if (coinsRes.error) throw coinsRes.error;
  if (historyRes.error) throw historyRes.error;

  const rows = (coinsRes.data ?? []) as StablecoinRow[];
  if (rows.length === 0) return null;

  const updatedAt = rows.reduce((max, r) => (r.updated_at > max ? r.updated_at : max), rows[0].updated_at);
  return {
    coins: rows.map(fromRow),
    history: (historyRes.data ?? [])
      .map((h) => ({ date: String(h.date), totalMarketCap: Number(h.total_market_cap) }))
      .reverse(),
    hasVolume: rows.some((r) => r.volume_24h !== null),
    updatedAt,
    source: "cache",
  };
}

/**
 * Dashboard data: the Supabase cache filled by the cron job. Falls back to the
 * live APIs when the cache is empty or Supabase isn't configured (local dev).
 */
export async function getMarketData(): Promise<MarketData> {
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (configured) {
    try {
      const cached = await readCache();
      if (cached) return cached;
    } catch (err) {
      console.error("market cache read failed, using live data", err);
    }
  }
  const live = await fetchMarketSnapshot();
  return { ...live, updatedAt: null, source: "live" };
}
