"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CategoryScale,
  Chart,
  Filler,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  type Plugin,
} from "chart.js";
import { formatPct, formatUsdCompact } from "@/lib/format";
import { sliceHistory, type HistoryRange } from "@/lib/market/summary";
import type { MarketPoint } from "@/lib/market/types";
import { useTheme } from "@/lib/useTheme";

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip);

const RANGES: { id: HistoryRange; label: string }[] = [
  { id: "6m", label: "6M" },
  { id: "1y", label: "1Y" },
];

const monthFmt = new Intl.DateTimeFormat("en-US", { month: "short", year: "2-digit", timeZone: "UTC" });
const dayFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const toDate = (iso: string) => new Date(`${iso}T00:00:00Z`);

/** Vertical guide line under the hovered point. */
const crosshair: Plugin<"line"> = {
  id: "crosshair",
  afterDatasetsDraw(chart) {
    const active = chart.tooltip?.getActiveElements();
    if (!active?.length) return;
    const { ctx, chartArea } = chart;
    const x = active[0].element.x;
    ctx.save();
    ctx.strokeStyle = cssVar("--line-strong");
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, chartArea.top);
    ctx.lineTo(x, chartArea.bottom);
    ctx.stroke();
    ctx.restore();
  },
};

function cssVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function withAlpha(hex: string, alpha: number) {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export function MarketCapChart({ history }: { history: MarketPoint[] }) {
  const [range, setRange] = useState<HistoryRange>("1y");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const theme = useTheme();
  const points = useMemo(() => sliceHistory(history, range), [history, range]);

  const first = points[0];
  const last = points[points.length - 1];
  const change = first && last ? (last.totalMarketCap / first.totalMarketCap - 1) * 100 : null;

  useEffect(() => {
    if (!canvasRef.current || points.length === 0 || theme === null) return;
    const line = cssVar("--chart");
    const muted = cssVar("--muted");
    const grid = cssVar("--line");
    const surface = cssVar("--surface");
    const font = { family: getComputedStyle(document.body).getPropertyValue("--font-dm-mono") || "monospace", size: 11 };

    const chart = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels: points.map((p) => p.date),
        datasets: [
          {
            data: points.map((p) => p.totalMarketCap),
            borderColor: line,
            borderWidth: 2,
            fill: true,
            backgroundColor: (ctx) => {
              const area = ctx.chart.chartArea;
              if (!area) return withAlpha(line, 0.1);
              const g = ctx.chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
              g.addColorStop(0, withAlpha(line, 0.18));
              g.addColorStop(1, withAlpha(line, 0));
              return g;
            },
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: line,
            pointHoverBorderColor: surface,
            pointHoverBorderWidth: 2,
            tension: 0.25,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: { mode: "index", intersect: false },
        layout: { padding: { top: 8 } },
        scales: {
          x: {
            grid: { display: false },
            border: { color: grid },
            ticks: {
              color: muted,
              font,
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 6,
              callback(_, i) {
                return monthFmt.format(toDate(points[i].date));
              },
            },
          },
          y: {
            grid: { color: grid },
            border: { display: false },
            ticks: { color: muted, font, maxTicksLimit: 5, callback: (v) => formatUsdCompact(Number(v)) },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            displayColors: false,
            backgroundColor: cssVar("--fg"),
            titleColor: cssVar("--bg"),
            bodyColor: cssVar("--bg"),
            titleFont: { ...font, weight: "normal" },
            bodyFont: { ...font, size: 13, weight: "bold" },
            padding: 10,
            callbacks: {
              title: (items) => dayFmt.format(toDate(points[items[0].dataIndex].date)),
              label: (item) => formatUsdCompact(item.parsed.y),
            },
          },
        },
      },
      plugins: [crosshair],
    });
    return () => chart.destroy();
  }, [points, theme]);

  const monthly = useMemo(() => points.filter((p, i) => i === points.length - 1 || p.date.slice(0, 7) !== points[i + 1].date.slice(0, 7)), [points]);

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Total market cap</h2>
          <p className="text-sm text-muted">
            <span className="font-mono text-fg">{formatUsdCompact(last?.totalMarketCap)}</span>
            {change !== null && (
              <>
                {" "}
                <span className={`font-mono ${change >= 0 ? "text-good" : "text-accent-text"}`}>{formatPct(change)}</span>{" "}
                over {range === "6m" ? "6 months" : "1 year"}
              </>
            )}
          </p>
        </div>
        <div role="group" aria-label="Period" className="flex rounded-md border border-line p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRange(r.id)}
              aria-pressed={range === r.id}
              className={`rounded px-3 py-1 font-mono text-xs ${
                range === r.id ? "bg-fg text-bg" : "text-muted hover:text-fg"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div className="relative h-64 sm:h-72">
        {points.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-muted">No history yet.</p>
        ) : (
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={`Total stablecoin market cap, ${range === "6m" ? "last 6 months" : "last year"}: ${formatUsdCompact(first?.totalMarketCap)} to ${formatUsdCompact(last?.totalMarketCap)}.`}
          />
        )}
      </div>
      {monthly.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-muted hover:text-fg">View as table</summary>
          <table className="mt-2 w-full max-w-sm font-mono text-xs">
            <thead>
              <tr className="text-left text-muted">
                <th className="py-1 font-normal">Month end</th>
                <th className="py-1 text-right font-normal">Market cap</th>
              </tr>
            </thead>
            <tbody>
              {monthly.map((p) => (
                <tr key={p.date} className="border-t border-line">
                  <td className="py-1">{p.date}</td>
                  <td className="py-1 text-right">{formatUsdCompact(p.totalMarketCap)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </section>
  );
}
