import type { MarketPoint, PegMechanism, Stablecoin } from "./types";

/** Peg alert thresholds (in %) used across the product. */
export const PEG_THRESHOLDS = [0.1, 0.5, 1] as const;
/** Coins smaller than this are ignored for peg stats: thin markets, noisy prices. */
export const PEG_MIN_MARKET_CAP = 10_000_000;

/** Deviation from $1 in %, only for USD-pegged coins with a price. */
export function pegDeviationPct(coin: Pick<Stablecoin, "pegType" | "price">): number | null {
  if (coin.pegType !== "USD" || coin.price === null) return null;
  // Round away float noise so $0.9990 reads as exactly -0.1%.
  return Math.round((coin.price - 1) * 1e5) / 1e3;
}

export interface MarketSummary {
  totalMarketCap: number;
  /** Change of total market cap over 24h in %, or null if unknown. */
  marketCapChange24hPct: number | null;
  count: number;
  volume24h: number | null;
  peg: {
    /** USD coins checked (≥ PEG_MIN_MARKET_CAP, with a price). */
    checked: number;
    /** Coins strictly beyond each threshold, keyed by threshold. */
    beyond: Record<(typeof PEG_THRESHOLDS)[number], number>;
  };
}

export function summarize(coins: Stablecoin[], hasVolume = true): MarketSummary {
  let total = 0;
  // 24h change compares only coins that have yesterday's figure.
  let prevTotal = 0;
  let prevComparable = 0;
  let volume = 0;
  const beyond = { 0.1: 0, 0.5: 0, 1: 0 };
  let checked = 0;

  for (const c of coins) {
    total += c.marketCap;
    if (c.marketCapPrevDay !== null) {
      prevTotal += c.marketCapPrevDay;
      prevComparable += c.marketCap;
    }
    volume += c.volume24h ?? 0;

    const dev = pegDeviationPct(c);
    if (dev !== null && c.marketCap >= PEG_MIN_MARKET_CAP) {
      checked++;
      for (const t of PEG_THRESHOLDS) if (Math.abs(dev) > t) beyond[t]++;
    }
  }

  return {
    totalMarketCap: total,
    marketCapChange24hPct: prevTotal > 0 ? (prevComparable / prevTotal - 1) * 100 : null,
    count: coins.length,
    volume24h: hasVolume ? volume : null,
    peg: { checked, beyond },
  };
}

export interface DominanceSlice {
  id: string;
  label: string;
  marketCap: number;
  sharePct: number;
}

/** Top `n` coins by market cap plus an "Others" slice. */
export function dominance(coins: Stablecoin[], n = 5): DominanceSlice[] {
  const total = coins.reduce((s, c) => s + c.marketCap, 0);
  if (total <= 0) return [];
  const sorted = [...coins].sort((a, b) => b.marketCap - a.marketCap);
  const slices: DominanceSlice[] = sorted.slice(0, n).map((c) => ({
    id: c.id,
    label: c.symbol,
    marketCap: c.marketCap,
    sharePct: (c.marketCap / total) * 100,
  }));
  const rest = sorted.slice(n).reduce((s, c) => s + c.marketCap, 0);
  if (rest > 0) slices.push({ id: "others", label: "Others", marketCap: rest, sharePct: (rest / total) * 100 });
  return slices;
}

/** Chains ranked by total stablecoin supply. */
export function topChains(coins: Stablecoin[], n = 12): string[] {
  const totals = new Map<string, number>();
  for (const c of coins) {
    for (const [chain, v] of Object.entries(c.chainCirculating)) {
      totals.set(chain, (totals.get(chain) ?? 0) + v);
    }
  }
  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([chain]) => chain);
}

export type HistoryRange = "6m" | "1y";

export function sliceHistory(history: MarketPoint[], range: HistoryRange): MarketPoint[] {
  if (history.length === 0) return [];
  const last = new Date(history[history.length - 1].date + "T00:00:00Z");
  const from = new Date(last);
  from.setUTCMonth(from.getUTCMonth() - (range === "6m" ? 6 : 12));
  const fromIso = from.toISOString().slice(0, 10);
  return history.filter((p) => p.date >= fromIso);
}

// ---- Table filters (state lives in the URL) ----

export interface CoinFilters {
  types: PegMechanism[];
  chains: string[];
}

const VALID_TYPES = new Set<PegMechanism>(["fiat-backed", "crypto-backed", "algorithmic", "other"]);

function splitParam(value: string | null): string[] {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseFilters(params: URLSearchParams): CoinFilters {
  return {
    types: splitParam(params.get("type")).filter((t): t is PegMechanism => VALID_TYPES.has(t as PegMechanism)),
    chains: splitParam(params.get("chain")),
  };
}

/** Writes filters into a copy of `params`, dropping empty ones. */
export function filtersToParams(filters: CoinFilters, params: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(params);
  for (const [key, values] of [
    ["type", filters.types],
    ["chain", filters.chains],
  ] as const) {
    if (values.length) next.set(key, values.join(","));
    else next.delete(key);
  }
  return next;
}

/** Market cap of a coin restricted to the given chains (all chains if none). */
export function marketCapOn(coin: Stablecoin, chains: string[]): number {
  if (chains.length === 0) return coin.marketCap;
  return chains.reduce((s, ch) => s + (coin.chainCirculating[ch] ?? 0), 0);
}

export function filterCoins(coins: Stablecoin[], filters: CoinFilters): Stablecoin[] {
  return coins.filter(
    (c) =>
      (filters.types.length === 0 || filters.types.includes(c.pegMechanism)) &&
      (filters.chains.length === 0 || marketCapOn(c, filters.chains) > 0),
  );
}
