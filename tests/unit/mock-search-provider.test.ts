import { describe, expect, it } from "vitest";
import { MockSearchProvider } from "@/providers/search/mock";
import { buildResearchQueries } from "@/prompts/viral-research";

describe("MockSearchProvider", () => {
  it("returns results with view counts as strings and no fabricated real-looking IDs", async () => {
    const provider = new MockSearchProvider();
    const results = await provider.search("viral UGC Replit");
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(typeof r.viewCount).toBe("string");
      expect(r.externalId.startsWith("mock_")).toBe(true);
      expect(r.description).toContain("[MOCK]");
    }
  });

  it("is deterministic for the same query (seeded, not truly random)", async () => {
    const provider = new MockSearchProvider();
    const first = await provider.search("viral UGC Replit");
    const second = await provider.search("viral UGC Replit");
    expect(first.map((r) => r.externalId)).toEqual(second.map((r) => r.externalId));
  });
});

describe("buildResearchQueries", () => {
  it("returns a deduplicated, bounded list of queries including the product name", () => {
    const queries = buildResearchQueries("Replit", "AI coding tools", "TIKTOK");
    expect(queries.length).toBeGreaterThan(0);
    expect(new Set(queries).size).toBe(queries.length);
    expect(queries.some((q) => q.includes("Replit"))).toBe(true);
  });
});
