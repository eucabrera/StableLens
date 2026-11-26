import { Suspense } from "react";
import { connection } from "next/server";
import { DominanceBars } from "@/components/dashboard/DominanceBars";
import { MarketCapChart } from "@/components/dashboard/MarketCapChart";
import { MarketTable } from "@/components/dashboard/MarketTable";
import { Delta, StatCard } from "@/components/dashboard/StatCard";
import { formatAgo, formatInt, formatPct, formatUsdCompact } from "@/lib/format";
import { getMarketData } from "@/lib/market/store";
import { dominance, PEG_MIN_MARKET_CAP, summarize, topChains } from "@/lib/market/summary";

/** Cache older than this is flagged: the 5-minute sync has probably stopped. */
const STALE_AFTER_MS = 30 * 60_000;

function isStale(updatedAt: string | null, now = Date.now()) {
  return updatedAt !== null && now - new Date(updatedAt).getTime() > STALE_AFTER_MS;
}

export default function DashboardPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <Suspense fallback={<DashboardSkeleton />}>
        <MarketOverview />
      </Suspense>
    </div>
  );
}

async function MarketOverview() {
  await connection();
  let data;
  try {
    data = await getMarketData();
  } catch (err) {
    console.error("dashboard data failed", err);
    return (
      <>
        <PageHeader />
        <p className="rounded-lg border border-line bg-surface p-6 text-muted">
          Market data is unavailable right now. Please try again in a few minutes.
        </p>
      </>
    );
  }

  const summary = summarize(data.coins, data.hasVolume);
  const stale = isStale(data.updatedAt);

  return (
    <>
      <PageHeader
        status={
          <>
            {data.updatedAt ? `Updated ${formatAgo(data.updatedAt)}` : "Live data"} · Sources: DefiLlama, CoinGecko
            {stale && <span className="ml-2 text-accent-text">⚠ Data may be out of date</span>}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total market cap"
          value={formatUsdCompact(summary.totalMarketCap)}
          detail={
            <>
              <Delta value={summary.marketCapChange24hPct}>{formatPct(summary.marketCapChange24hPct)}</Delta> in 24h
            </>
          }
        />
        <StatCard label="Stablecoins tracked" value={formatInt(summary.count)} detail="Market cap above $1M" />
        <StatCard
          label="Volume 24h"
          value={formatUsdCompact(summary.volume24h)}
          detail={summary.volume24h === null ? "Volume unavailable" : "Trading volume, CoinGecko"}
        />
        <StatCard
          label="Off peg ±0.5%"
          value={
            <>
              {summary.peg.beyond[0.5]}
              <span className="text-base text-muted"> / {summary.peg.checked}</span>
            </>
          }
          detail={
            <span title={`USD stablecoins with market cap above ${formatUsdCompact(PEG_MIN_MARKET_CAP)}`}>
              <span className="font-mono">{summary.peg.beyond[0.1]}</span> beyond ±0.1% ·{" "}
              <span className="font-mono">{summary.peg.beyond[1]}</span> beyond ±1%
            </span>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MarketCapChart history={data.history} />
        </div>
        <DominanceBars slices={dominance(data.coins, 5)} />
      </div>

      <MarketTable coins={data.coins} chainOptions={topChains(data.coins, 12)} />
    </>
  );
}

function PageHeader({ status }: { status?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-3xl font-bold tracking-tight">Market overview</h1>
      <p className="min-h-5 text-sm text-muted">{status}</p>
    </div>
  );
}

function DashboardSkeleton() {
  const block = "animate-pulse rounded-lg border border-line bg-surface";
  return (
    <>
      <PageHeader status="Loading market data…" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`${block} h-28`} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className={`${block} h-96 lg:col-span-2`} />
        <div className={`${block} h-96`} />
      </div>
      <div className={`${block} h-[32rem]`} />
    </>
  );
}
