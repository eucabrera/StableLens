export const PEG_MECHANISMS = ["fiat-backed", "crypto-backed", "algorithmic"] as const;
export type PegMechanism = (typeof PEG_MECHANISMS)[number] | "other";

export interface Stablecoin {
  /** DefiLlama stablecoin id (stable across syncs). */
  id: string;
  symbol: string;
  name: string;
  geckoId: string | null;
  /** Peg currency, e.g. "USD", "EUR", or "VAR" for variable pegs. */
  pegType: string;
  pegMechanism: PegMechanism;
  /** Price in USD. */
  price: number | null;
  /** Market cap (circulating supply) in USD. */
  marketCap: number;
  marketCapPrevDay: number | null;
  volume24h: number | null;
  priceChange24hPct: number | null;
  /** Chains ordered by circulating supply, largest first. */
  chains: string[];
  /** Circulating supply per chain, in USD. */
  chainCirculating: Record<string, number>;
}

export interface MarketPoint {
  /** ISO date, yyyy-mm-dd (UTC). */
  date: string;
  /** Total stablecoin market cap in USD. */
  totalMarketCap: number;
}

export interface MarketSnapshot {
  coins: Stablecoin[];
  history: MarketPoint[];
  /** False when CoinGecko failed and volume/price change are missing. */
  hasVolume: boolean;
}

export interface MarketData extends MarketSnapshot {
  /** ISO timestamp of the last sync, or null for live data. */
  updatedAt: string | null;
  source: "cache" | "live";
}
