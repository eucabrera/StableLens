const UNITS: [number, string][] = [
  [1e12, "T"],
  [1e9, "B"],
  [1e6, "M"],
  [1e3, "K"],
];

/** $173.55B, $1.20M, $950. */
export function formatUsdCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  for (const [size, unit] of UNITS) {
    if (abs >= size) return `${value < 0 ? "-" : ""}$${(abs / size).toFixed(2)}${unit}`;
  }
  return `${value < 0 ? "-" : ""}$${abs.toFixed(0)}`;
}

/** Stablecoin prices need 4 decimals to show peg deviations. */
export function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return `$${value.toFixed(value >= 100 ? 2 : 4)}`;
}

/** +0.12%, -1.50%. */
export function formatPct(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  const rounded = Number(value.toFixed(digits));
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded.toFixed(digits)}%`;
}

export function formatInt(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

/** "3 min ago", "2 h ago", "4 d ago". */
export function formatAgo(iso: string, now = Date.now()): string {
  const mins = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}
