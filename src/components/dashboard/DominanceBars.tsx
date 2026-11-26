import { formatUsdCompact } from "@/lib/format";
import type { DominanceSlice } from "@/lib/market/summary";

/** Market share of the top stablecoins as ranked bars (easier to compare than a donut). */
export function DominanceBars({ slices }: { slices: DominanceSlice[] }) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4 sm:p-5">
      <div>
        <h2 className="text-base font-semibold tracking-tight">Dominance</h2>
        <p className="text-sm text-muted">Share of total stablecoin market cap</p>
      </div>
      <ol className="flex flex-col gap-3">
        {slices.map((s) => (
          <li
            key={s.id}
            title={`${s.label}: ${s.sharePct.toFixed(2)}% · ${formatUsdCompact(s.marketCap)}`}
            className="group grid grid-cols-[4.5rem_1fr_3.5rem] items-center gap-3 text-sm"
          >
            <span className="truncate font-medium">{s.label}</span>
            <span className="h-3 rounded-sm bg-surface-2">
              <span
                className={`block h-full rounded-sm transition-opacity group-hover:opacity-80 ${
                  s.id === "others" ? "bg-line-strong" : "bg-[var(--chart)]"
                }`}
                style={{ width: `${Math.max(s.sharePct, 0.5)}%` }}
              />
            </span>
            <span className="text-right font-mono">{s.sharePct.toFixed(1)}%</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
