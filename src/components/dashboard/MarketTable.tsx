"use client";

import { useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { formatPct, formatPrice, formatUsdCompact } from "@/lib/format";
import {
  filterCoins,
  filtersToParams,
  marketCapOn,
  parseFilters,
  pegDeviationPct,
  type CoinFilters,
} from "@/lib/market/summary";
import type { PegMechanism, Stablecoin } from "@/lib/market/types";

const TYPE_OPTIONS: { id: PegMechanism; label: string }[] = [
  { id: "fiat-backed", label: "Fiat-backed" },
  { id: "crypto-backed", label: "Crypto-backed" },
  { id: "algorithmic", label: "Algorithmic" },
];

const TYPE_LABEL: Record<PegMechanism, string> = {
  "fiat-backed": "Fiat",
  "crypto-backed": "Crypto",
  algorithmic: "Algo",
  other: "Other",
};

type SortKey = "marketCap" | "price" | "volume24h" | "supplyChange";
const PAGE = 25;

function supplyChange(c: Stablecoin): number | null {
  return c.marketCapPrevDay ? (c.marketCap / c.marketCapPrevDay - 1) * 100 : null;
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1 text-sm ${
        active ? "border-fg bg-fg text-bg" : "border-line text-muted hover:border-line-strong hover:text-fg"
      }`}
    >
      {children}
    </button>
  );
}

type SortState = { key: SortKey; desc: boolean };

function SortHeader({
  k,
  sort,
  onSort,
  children,
}: {
  k: SortKey;
  sort: SortState;
  onSort: (s: SortState) => void;
  children: React.ReactNode;
}) {
  const active = sort.key === k;
  return (
    <th
      scope="col"
      aria-sort={active ? (sort.desc ? "descending" : "ascending") : "none"}
      className="px-3 py-2 text-right font-medium"
    >
      <button
        type="button"
        onClick={() => onSort({ key: k, desc: active ? !sort.desc : true })}
        className={`inline-flex items-center gap-1 hover:text-fg ${active ? "text-fg" : ""}`}
      >
        {children}
        <span aria-hidden="true" className="w-2 text-[10px]">
          {active ? (sort.desc ? "↓" : "↑") : ""}
        </span>
      </button>
    </th>
  );
}

export function MarketTable({ coins, chainOptions }: { coins: Stablecoin[]; chainOptions: string[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = useMemo(() => parseFilters(new URLSearchParams(searchParams.toString())), [searchParams]);
  const [sort, setSort] = useState<SortState>({ key: "marketCap", desc: true });
  const [showAll, setShowAll] = useState(false);

  const rank = useMemo(() => new Map(coins.map((c, i) => [c.id, i + 1])), [coins]);
  const chainFiltered = filters.chains.length > 0;

  const rows = useMemo(() => {
    const value = (c: Stablecoin): number | null => {
      switch (sort.key) {
        case "marketCap":
          return marketCapOn(c, filters.chains);
        case "price":
          return c.price;
        case "volume24h":
          return c.volume24h;
        case "supplyChange":
          return supplyChange(c);
      }
    };
    return filterCoins(coins, filters).sort((a, b) => {
      const va = value(a);
      const vb = value(b);
      if (va === null) return 1;
      if (vb === null) return -1;
      return sort.desc ? vb - va : va - vb;
    });
  }, [coins, filters, sort]);

  function update(next: CoinFilters) {
    const qs = filtersToParams(next, new URLSearchParams(searchParams.toString())).toString();
    // Native history keeps useSearchParams in sync without a server round trip.
    window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
  }

  const visible = showAll ? rows : rows.slice(0, PAGE);
  const hasFilters = filters.types.length > 0 || chainFiltered;

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Stablecoins</h2>
          <p className="text-sm text-muted">
            {rows.length} of {coins.length} with market cap above $1M
          </p>
        </div>
        {hasFilters && (
          <button type="button" onClick={() => update({ types: [], chains: [] })} className="text-sm text-muted underline hover:text-fg">
            Clear filters
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by type">
          <span className="w-14 text-xs font-medium uppercase tracking-wide text-muted">Type</span>
          {TYPE_OPTIONS.map((t) => (
            <Chip key={t.id} active={filters.types.includes(t.id)} onClick={() => update({ ...filters, types: toggle(filters.types, t.id) })}>
              {t.label}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by chain">
          <span className="w-14 text-xs font-medium uppercase tracking-wide text-muted">Chain</span>
          {chainOptions.map((ch) => (
            <Chip key={ch} active={filters.chains.includes(ch)} onClick={() => update({ ...filters, chains: toggle(filters.chains, ch) })}>
              {ch}
            </Chip>
          ))}
        </div>
      </div>

      <div className="-mx-4 overflow-x-auto sm:-mx-5">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-y border-line text-xs text-muted">
            <tr>
              <th scope="col" className="w-10 py-2 pl-4 pr-1 text-left font-medium sm:pl-5">#</th>
              <th scope="col" className="px-3 py-2 text-left font-medium">Name</th>
              <SortHeader sort={sort} onSort={setSort} k="price">Price</SortHeader>
              <SortHeader sort={sort} onSort={setSort} k="marketCap">{chainFiltered ? "Mcap on chains" : "Market cap"}</SortHeader>
              <SortHeader sort={sort} onSort={setSort} k="volume24h">Volume 24h</SortHeader>
              <SortHeader sort={sort} onSort={setSort} k="supplyChange">Supply 24h</SortHeader>
              <th scope="col" className="py-2 pl-3 pr-4 text-left font-medium sm:pr-5">Chains</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((c) => {
              const dev = pegDeviationPct(c);
              const offPeg = dev !== null && Math.abs(dev) > 0.5;
              const change = supplyChange(c);
              return (
                <tr key={c.id} className="border-b border-line last:border-0 hover:bg-surface-2">
                  <td className="py-2.5 pl-4 pr-1 font-mono text-xs text-muted sm:pl-5">{rank.get(c.id)}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{c.symbol}</span>
                      <span className="max-w-[14rem] truncate text-muted">{c.name}</span>
                      <span className="rounded border border-line px-1.5 py-px font-mono text-[10px] uppercase text-muted">
                        {TYPE_LABEL[c.pegMechanism]}
                        {c.pegType !== "USD" ? ` · ${c.pegType}` : ""}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono">
                    {formatPrice(c.price)}
                    {offPeg && (
                      <span
                        title={`${formatPct(dev)} from $1`}
                        className="ml-1.5 rounded bg-accent-soft px-1 py-px text-[10px] text-accent-text"
                      >
                        ⚠ {formatPct(dev, 1)}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono">{formatUsdCompact(marketCapOn(c, filters.chains))}</td>
                  <td className="px-3 py-2.5 text-right font-mono">{formatUsdCompact(c.volume24h)}</td>
                  <td
                    className={`px-3 py-2.5 text-right font-mono ${
                      change === null || Math.abs(change) < 0.005 ? "text-muted" : change > 0 ? "text-good" : "text-accent-text"
                    }`}
                  >
                    {formatPct(change)}
                  </td>
                  <td className="py-2.5 pl-3 pr-4 text-muted sm:pr-5" title={c.chains.join(", ")}>
                    {c.chains.slice(0, 3).join(", ")}
                    {c.chains.length > 3 && <span className="ml-1 font-mono text-xs">+{c.chains.length - 3}</span>}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-muted">
                  No stablecoins match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {rows.length > PAGE && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="self-center rounded-md border border-line px-4 py-1.5 text-sm text-muted hover:border-line-strong hover:text-fg"
        >
          {showAll ? "Show top 25" : `Show all ${rows.length}`}
        </button>
      )}
    </section>
  );
}
