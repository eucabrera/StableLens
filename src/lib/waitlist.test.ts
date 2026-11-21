import { describe, expect, it } from "vitest";
import { normalizeEmail, normalizeSource, parseAllowedOrigins } from "./waitlist";

describe("normalizeEmail", () => {
  it("accepts and lowercases valid emails", () => {
    expect(normalizeEmail("  Eu@Example.COM ")).toBe("eu@example.com");
  });
  it("rejects invalid input", () => {
    for (const bad of ["", "no-at", "a@b", "a @b.com", 42, null, undefined, "x".repeat(250) + "@a.com"]) {
      expect(normalizeEmail(bad)).toBeNull();
    }
  });
});

describe("normalizeSource", () => {
  it("strips unsafe characters and defaults", () => {
    expect(normalizeSource("Landing<script>")).toBe("landingscript");
    expect(normalizeSource(undefined)).toBe("unknown");
    expect(normalizeSource("!!!")).toBe("unknown");
  });
});

describe("parseAllowedOrigins", () => {
  it("splits, trims and drops trailing slashes", () => {
    expect(parseAllowedOrigins(" https://a.app/ ,https://b.app,")).toEqual(["https://a.app", "https://b.app"]);
    expect(parseAllowedOrigins(undefined)).toEqual([]);
  });
});
