import type { MarketPoint, MarketSnapshot, PegMechanism, Stablecoin } from "./types";

/** Coins below this market cap are dropped: mostly dust and dead tokens. */
export const MIN_MARKET_CAP = 1_000_000;
/** Daily history kept for the charts (1Y plus margin). */
export const HISTORY_DAYS = 400;

const LLAMA_ASSETS_URL = "https://stablecoins.llama.fi/stablecoins?includePrices=true";
const LLAMA_HISTORY_URL = "https://stablecoins.llama.fi/stablecoincharts/all";
const COINGECKO_MARKETS_URL =
  "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=stablecoins&order=market_cap_desc&per_page=250&page=1";

// ---- Raw API shapes (only the fields we use) ----

type PeggedAmounts = Record<string, number | undefined>;

export interface LlamaAsset {
  id: string;
  name: string;
  symbol: string;
  gecko_id: string | null;
  pegType: string;
  pegMechanism: string;
  price: number | null;
  circulating: PeggedAmounts;
  circulatingPrevDay?: PeggedAmounts;
  chainCirculating?: Record<string, { current?: PeggedAmounts }>;
}

export interface LlamaHistoryPoint {
  date: string;
  totalCirculatingUSD?: PeggedAmounts;
}

export interface GeckoMarket {
  id: string;
  current_price: number | null;
  total_volume: number | null;
  price_change_percentage_24h: number | null;
}

// ---- Transforms (pure) ----

export function normalizeMechanism(raw: string | null | undefined): PegMechanism {
  const v = (raw ?? "").toLowerCase();
  if (v === "fiat-backed") return "fiat-backed";
  // DefiLlama has at least one "crytpo-backed" typo.
  if (v === "crypto-backed" || v === "crytpo-backed") return "crypto-backed";
  if (v === "algorithmic") return "algorithmic";
  return "other";
}

/** "peggedUSD" → "USD". */
export function pegCurrency(pegType: string): string {
  return pegType.replace(/^pegged/, "") || pegType;
}

function finite(n: unknown): number | null {
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

/**
 * Builds the stablecoin list. Amounts from DefiLlama are in units of the peg
 * currency and are converted with the coin's USD price; non-USD coins without
 * a price are skipped.
 */
export function buildStablecoins(assets: LlamaAsset[], gecko: GeckoMarket[] = []): Stablecoin[] {
  const geckoById = new Map(gecko.map((g) => [g.id, g]));
  const coins: Stablecoin[] = [];

  for (const a of assets) {
    const isUsd = a.pegType === "peggedUSD";
    const g = a.gecko_id ? geckoById.get(a.gecko_id) : undefined;
    const price = finite(g?.current_price) ?? finite(a.price);
    // Value supply at market price (as DefiLlama's USD history does), so a
    // depegged coin isn't counted at $1. USD coins without a price count at par.
    const toUsd = price ?? (isUsd ? 1 : null);
    if (toUsd === null) continue;

    const units = finite(a.circulating?.[a.pegType]);
    if (units === null) continue;
    const marketCap = units * toUsd;
    if (marketCap < MIN_MARKET_CAP) continue;

    const prevUnits = finite(a.circulatingPrevDay?.[a.pegType]);
    const chainCirculating: Record<string, number> = {};
    for (const [chain, v] of Object.entries(a.chainCirculating ?? {})) {
      const amount = finite(v.current?.[a.pegType]);
      if (amount !== null && amount > 0) chainCirculating[chain] = amount * toUsd;
    }
    const chains = Object.keys(chainCirculating).sort(
      (x, y) => chainCirculating[y] - chainCirculating[x],
    );

    coins.push({
      id: String(a.id),
      symbol: a.symbol,
      name: a.name,
      geckoId: a.gecko_id || null,
      pegType: pegCurrency(a.pegType),
      pegMechanism: normalizeMechanism(a.pegMechanism),
      price,
      marketCap,
      marketCapPrevDay: prevUnits === null ? null : prevUnits * toUsd,
      volume24h: finite(g?.total_volume),
      priceChange24hPct: finite(g?.price_change_percentage_24h),
      chains,
      chainCirculating,
    });
  }

  return coins.sort((x, y) => y.marketCap - x.marketCap);
}

/** Daily total market cap (all pegs, in USD) for the last `days` days. */
export function buildHistory(points: LlamaHistoryPoint[], days = HISTORY_DAYS): MarketPoint[] {
  const out: MarketPoint[] = [];
  for (const p of points) {
    const ts = Number(p.date);
    if (!Number.isFinite(ts)) continue;
    const total = Object.values(p.totalCirculatingUSD ?? {}).reduce<number>(
      (sum, v) => sum + (finite(v) ?? 0),
      0,
    );
    if (total <= 0) continue;
    out.push({ date: new Date(ts * 1000).toISOString().slice(0, 10), totalMarketCap: total });
  }
  out.sort((a, b) => a.date.localeCompare(b.date));
  return out.slice(-days);
}

// ---- Fetchers ----

async function getJson<T>(url: string, headers: Record<string, string> = {}): Promise<T> {
  const res = await fetch(url, {
    headers: { accept: "application/json", ...headers },
    signal: AbortSignal.timeout(20_000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${new URL(url).host} responded ${res.status}`);
  return (await res.json()) as T;
}

export async function fetchGeckoMarkets(): Promise<GeckoMarket[]> {
  const key = process.env.COINGECKO_API_KEY;
  // Demo keys go in this header; without a key the public (rate-limited) API is used.
  return getJson<GeckoMarket[]>(COINGECKO_MARKETS_URL, key ? { "x-cg-demo-api-key": key } : {});
}

/**
 * Fetches everything the dashboard needs from DefiLlama (supply, chains,
 * history) and CoinGecko (volume, price change). CoinGecko is optional: if it
 * fails the snapshot is still built, flagged with `hasVolume: false`.
 */
export async function fetchMarketSnapshot(): Promise<MarketSnapshot> {
  const [assets, history, gecko] = await Promise.all([
    getJson<{ peggedAssets: LlamaAsset[] }>(LLAMA_ASSETS_URL),
    getJson<LlamaHistoryPoint[]>(LLAMA_HISTORY_URL),
    fetchGeckoMarkets().catch((err) => {
      console.error("coingecko fetch failed", err);
      return null;
    }),
  ]);
  return {
    coins: buildStablecoins(assets.peggedAssets, gecko ?? []),
    history: buildHistory(history),
    hasVolume: gecko !== null,
  };
}
