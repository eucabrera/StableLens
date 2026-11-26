import { describe, expect, it } from "vitest";
import { buildHistory, buildStablecoins, normalizeMechanism, type LlamaAsset } from "./sources";
import {
  dominance,
  filterCoins,
  filtersToParams,
  marketCapOn,
  parseFilters,
  pegDeviationPct,
  sliceHistory,
  summarize,
  topChains,
} from "./summary";

const asset = (over: Partial<LlamaAsset>): LlamaAsset => ({
  id: "1",
  name: "Tether",
  symbol: "USDT",
  gecko_id: "tether",
  pegType: "peggedUSD",
  pegMechanism: "fiat-backed",
  price: 0.999,
  circulating: { peggedUSD: 100e6 },
  circulatingPrevDay: { peggedUSD: 99e6 },
  chainCirculating: {
    Ethereum: { current: { peggedUSD: 60e6 } },
    Tron: { current: { peggedUSD: 40e6 } },
    Dead: { current: { peggedUSD: 0 } },
  },
  ...over,
});

describe("buildStablecoins", () => {
  it("maps DefiLlama assets and merges CoinGecko volume", () => {
    const [c] = buildStablecoins(
      [asset({})],
      [{ id: "tether", current_price: 1, total_volume: 5e6, price_change_percentage_24h: -0.01 }],
    );
    expect(c).toMatchObject({
      id: "1",
      pegType: "USD",
      pegMechanism: "fiat-backed",
      price: 1,
      marketCap: 100e6,
      marketCapPrevDay: 99e6,
      volume24h: 5e6,
      chains: ["Ethereum", "Tron"],
    });
    expect(c.chainCirculating).toEqual({ Ethereum: 60e6, Tron: 40e6 });
  });

  it("converts non-USD pegs with the USD price and drops what it can't value", () => {
    const coins = buildStablecoins([
      asset({ id: "2", symbol: "EURC", pegType: "peggedEUR", price: 1.1, circulating: { peggedEUR: 10e6 }, chainCirculating: {} }),
      asset({ id: "3", symbol: "NOPRICE", pegType: "peggedEUR", price: null, circulating: { peggedEUR: 10e6 } }),
      asset({ id: "4", symbol: "DUST", circulating: { peggedUSD: 500 } }),
    ]);
    expect(coins.map((c) => c.symbol)).toEqual(["EURC"]);
    expect(coins[0].marketCap).toBeCloseTo(11e6);
    expect(coins[0].pegType).toBe("EUR");
  });

  it("values a depegged USD coin at its price, and an unpriced one at par", () => {
    const coins = buildStablecoins([
      asset({ id: "d", price: 0.5, circulating: { peggedUSD: 10e6 }, circulatingPrevDay: { peggedUSD: 10e6 } }),
      asset({ id: "p", price: null, circulating: { peggedUSD: 2e6 } }),
    ], []);
    expect(coins.map((c) => [c.id, c.marketCap, c.marketCapPrevDay])).toEqual([
      ["d", 5e6, 5e6],
      ["p", 2e6, 99e6],
    ]);
  });

  it("sorts by market cap", () => {
    const coins = buildStablecoins([
      asset({ id: "a", circulating: { peggedUSD: 2e6 } }),
      asset({ id: "b", circulating: { peggedUSD: 9e6 } }),
    ]);
    expect(coins.map((c) => c.id)).toEqual(["b", "a"]);
  });
});

describe("normalizeMechanism", () => {
  it("handles the DefiLlama typo and unknown values", () => {
    expect(normalizeMechanism("crytpo-backed")).toBe("crypto-backed");
    expect(normalizeMechanism("Algorithmic")).toBe("algorithmic");
    expect(normalizeMechanism(undefined)).toBe("other");
  });
});

describe("buildHistory", () => {
  it("sums all pegs per day and keeps the last N days", () => {
    const day = (d: string, usd: number, eur = 0) => ({
      date: String(Date.parse(`${d}T00:00:00Z`) / 1000),
      totalCirculatingUSD: { peggedUSD: usd, peggedEUR: eur },
    });
    const h = buildHistory([day("2026-01-02", 10, 1), day("2026-01-01", 5), day("2026-01-03", 0)], 1);
    expect(h).toEqual([{ date: "2026-01-02", totalMarketCap: 11 }]);
  });
});

const coins = buildStablecoins([
  asset({ id: "1", symbol: "USDT", price: 0.999, circulating: { peggedUSD: 600e6 }, circulatingPrevDay: { peggedUSD: 590e6 } }),
  asset({
    id: "2",
    symbol: "DAI",
    pegMechanism: "crypto-backed",
    price: 0.993,
    circulating: { peggedUSD: 300e6 },
    circulatingPrevDay: { peggedUSD: 310e6 },
    chainCirculating: { Ethereum: { current: { peggedUSD: 300e6 } } },
  }),
  asset({
    id: "3",
    symbol: "ALGO",
    pegMechanism: "algorithmic",
    price: 0.98,
    circulating: { peggedUSD: 100e6 },
    circulatingPrevDay: { peggedUSD: 100e6 },
    chainCirculating: { Solana: { current: { peggedUSD: 100e6 } } },
  }),
]);

describe("summarize", () => {
  it("totals market cap, 24h change and peg deviations", () => {
    const s = summarize(coins);
    expect(s.totalMarketCap).toBeCloseTo(599.4e6 + 297.9e6 + 98e6);
    // (599.4 + 297.9 + 98) / (589.41 + 307.83 + 98) - 1
    expect(s.marketCapChange24hPct).toBeCloseTo(0.00603, 4);
    expect(s.count).toBe(3);
    expect(s.peg.checked).toBe(3);
    // USDT sits exactly at -0.1%, which is not "beyond".
    expect(s.peg.beyond).toEqual({ 0.1: 2, 0.5: 2, 1: 1 });
  });

  it("computes the 24h change only over coins with yesterday's figure", () => {
    const s = summarize([{ ...coins[0], marketCap: 110, marketCapPrevDay: 100 }, { ...coins[1], marketCapPrevDay: null }]);
    expect(s.marketCapChange24hPct).toBeCloseTo(10);
  });

  it("reports unknown volume when CoinGecko failed", () => {
    expect(summarize(coins, false).volume24h).toBeNull();
  });
});

describe("pegDeviationPct", () => {
  it("only applies to USD pegs with a price", () => {
    expect(pegDeviationPct({ pegType: "USD", price: 1.005 })).toBe(0.5);
    expect(pegDeviationPct({ pegType: "USD", price: 0.999 })).toBe(-0.1);
    expect(pegDeviationPct({ pegType: "EUR", price: 1.1 })).toBeNull();
    expect(pegDeviationPct({ pegType: "USD", price: null })).toBeNull();
  });
});

describe("dominance", () => {
  it("returns the top N and an Others slice", () => {
    const d = dominance(coins, 2);
    expect(d.map((s) => [s.label, Math.round(s.sharePct)])).toEqual([
      ["USDT", 60],
      ["DAI", 30],
      ["Others", 10],
    ]);
  });
});

describe("topChains", () => {
  it("ranks chains by total supply", () => {
    expect(topChains(coins)).toEqual(["Ethereum", "Solana", "Tron"]);
  });
});

describe("filters", () => {
  it("round-trips through URL params and ignores unknown types", () => {
    const f = parseFilters(new URLSearchParams("type=fiat-backed,bogus&chain=Ethereum,Solana"));
    expect(f).toEqual({ types: ["fiat-backed"], chains: ["Ethereum", "Solana"] });
    const p = filtersToParams({ types: [], chains: ["Tron"] }, new URLSearchParams("type=algorithmic&x=1"));
    expect(p.toString()).toBe("x=1&chain=Tron");
  });

  it("filters by type and chain", () => {
    expect(filterCoins(coins, { types: ["crypto-backed", "algorithmic"], chains: [] }).map((c) => c.symbol)).toEqual(["DAI", "ALGO"]);
    expect(filterCoins(coins, { types: [], chains: ["Solana"] }).map((c) => c.symbol)).toEqual(["ALGO"]);
    expect(marketCapOn(coins[0], ["Tron"])).toBeCloseTo(40e6 * 0.999);
  });
});

describe("sliceHistory", () => {
  it("keeps the last 6 months or year", () => {
    const h = ["2025-01-15", "2025-06-01", "2025-09-01", "2026-01-15"].map((date) => ({ date, totalMarketCap: 1 }));
    expect(sliceHistory(h, "6m").map((p) => p.date)).toEqual(["2025-09-01", "2026-01-15"]);
    expect(sliceHistory(h, "1y").map((p) => p.date)).toEqual(["2025-01-15", "2025-06-01", "2025-09-01", "2026-01-15"]);
  });
});
