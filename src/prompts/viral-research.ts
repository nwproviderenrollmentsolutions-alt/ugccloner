// PHASE 2 — Viral research. Builds the search-query set and the evidence
// rules used by the research service and search providers.

export function buildResearchQueries(product: string, category: string, platform: string): string[] {
  const base = [
    "viral UGC",
    "viral shorts",
    "best performing shorts",
    "UGC ads",
    "product demo",
    "creator ads",
    "TikTok style UGC",
    `viral UGC ${category}`,
    `viral TikTok ${category}`,
    `viral YouTube Shorts ${category}`,
    `best performing UGC hooks ${category}`,
    `UGC ad creative trends ${category}`,
    `viral creator ads ${category}`,
    `TikTok hooks ${category}`,
    `short form video frameworks ${category}`,
  ];
  return Array.from(new Set(base.map((q) => `${q} ${product}`.trim()))).slice(0, 12).concat([`${platform} ${product} UGC`]);
}

export const RESEARCH_EVIDENCE_RULES = [
  "Do not assume a video is viral merely because it appears popular.",
  "Record available evidence: views, likes, comments, shares, upload date, engagement signals, format, hook, duration.",
  'Always distinguish OBSERVED (directly from provider data), INFERRED (reasoned from context), and UNKNOWN (not available).',
  "Never fabricate view counts, engagement metrics, or dates. Missing data is reported as UNKNOWN, not estimated.",
].join("\n");
