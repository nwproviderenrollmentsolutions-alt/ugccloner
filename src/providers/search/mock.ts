import type { SearchProvider, VideoSearchResult } from "./types";

// MOCK_SEARCH — realistic, clearly-labeled fake research results so the
// research/framework pipeline can be exercised without a YouTube/web API key.
// Mock view/engagement numbers are plausible placeholders, never presented as
// real data (isMock is threaded through by the caller into ResearchJob rows).

const CHANNEL_NAMES = ["CreatorLab", "GrowthGarage", "TrySoAndSo", "DailyDemo", "BuildInPublic", "TheRealReview"];
const TITLE_TEMPLATES = [
  "I tried {q} for 7 days and this happened",
  "The {q} hack nobody is talking about",
  "Stop doing {q} the slow way",
  "This {q} trick went viral for a reason",
  "{q}: before vs after",
  "Why everyone is switching to {q}",
];

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export class MockSearchProvider implements SearchProvider {
  readonly name = "MOCK_YOUTUBE";
  readonly isMock = true;

  async search(query: string): Promise<VideoSearchResult[]> {
    const rand = seededRandom(hashSeed(query));
    const count = 4 + Math.floor(rand() * 3);
    const results: VideoSearchResult[] = [];

    for (let i = 0; i < count; i++) {
      const seed = `${query}-${i}`;
      const localRand = seededRandom(hashSeed(seed));
      const views = Math.floor(50_000 + localRand() * 4_500_000);
      const template = TITLE_TEMPLATES[Math.floor(localRand() * TITLE_TEMPLATES.length)];
      const daysAgo = Math.floor(localRand() * 90);
      const publishedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

      results.push({
        externalId: `mock_${hashSeed(seed).toString(36)}`,
        platform: "YOUTUBE",
        title: template.replace("{q}", query.split(" ").slice(0, 4).join(" ")),
        channel: CHANNEL_NAMES[Math.floor(localRand() * CHANNEL_NAMES.length)],
        url: `https://www.youtube.com/watch?v=mock_${hashSeed(seed).toString(36)}`,
        publishedAt,
        durationSeconds: 15 + Math.floor(localRand() * 45),
        viewCount: String(views),
        engagementMetrics: {
          likes: String(Math.floor(views * (0.02 + localRand() * 0.06))),
          comments: String(Math.floor(views * (0.001 + localRand() * 0.004))),
        },
        thumbnailUrl: null,
        description: `[MOCK] A short-form video matching the search query "${query}". Metrics are simulated for demo purposes.`,
      });
    }

    return results;
  }
}
