import { describe, expect, it } from "vitest";
import { formatAgo, formatPct, formatPrice, formatUsdCompact } from "./format";

describe("format", () => {
  it("formats compact USD", () => {
    expect(formatUsdCompact(173_554_164_711)).toBe("$173.55B");
    expect(formatUsdCompact(1_200_000)).toBe("$1.20M");
    expect(formatUsdCompact(2.1e12)).toBe("$2.10T");
    expect(formatUsdCompact(950)).toBe("$950");
    expect(formatUsdCompact(null)).toBe("—");
  });
  it("formats prices and percentages", () => {
    expect(formatPrice(0.99873)).toBe("$0.9987");
    expect(formatPct(0.1234)).toBe("+0.12%");
    expect(formatPct(-1.5)).toBe("-1.50%");
    expect(formatPct(-0.001)).toBe("0.00%");
  });
  it("formats relative time", () => {
    const now = Date.parse("2026-01-01T12:00:00Z");
    expect(formatAgo("2026-01-01T11:57:00Z", now)).toBe("3 min ago");
    expect(formatAgo("2026-01-01T09:00:00Z", now)).toBe("3 h ago");
  });
});
