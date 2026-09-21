export interface VideoSearchResult {
  externalId: string;
  platform: string; // YOUTUBE | WEB
  title: string;
  channel: string | null;
  url: string;
  publishedAt: string | null; // ISO date, or null if UNKNOWN
  durationSeconds: number | null;
  viewCount: string; // numeric string, or "UNKNOWN" — never fabricated
  engagementMetrics: Record<string, string> | null;
  thumbnailUrl: string | null;
  description: string | null;
}

export interface SearchProvider {
  readonly name: string;
  readonly isMock: boolean;
  search(query: string): Promise<VideoSearchResult[]>;
}
