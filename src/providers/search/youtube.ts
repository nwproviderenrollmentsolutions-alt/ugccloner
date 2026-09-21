import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import type { SearchProvider, VideoSearchResult } from "./types";

interface YTSearchItem {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    publishedAt: string;
    description: string;
    thumbnails?: { medium?: { url: string } };
  };
}

interface YTVideoDetail {
  id: string;
  contentDetails: { duration: string };
  statistics?: { viewCount?: string; likeCount?: string; commentCount?: string };
}

function parseIsoDuration(iso: string): number | null {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return null;
  const [, h, mnt, s] = m;
  return (Number(h || 0) * 3600) + (Number(mnt || 0) * 60) + Number(s || 0);
}

export class YouTubeSearchProvider implements SearchProvider {
  readonly name = "YOUTUBE_DATA_API";
  readonly isMock = false;

  async search(query: string): Promise<VideoSearchResult[]> {
    const start = Date.now();
    try {
      const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
      searchUrl.searchParams.set("part", "snippet");
      searchUrl.searchParams.set("q", query);
      searchUrl.searchParams.set("type", "video");
      searchUrl.searchParams.set("maxResults", "8");
      searchUrl.searchParams.set("order", "relevance");
      searchUrl.searchParams.set("key", env.youtubeApiKey);

      const searchRes = await fetch(searchUrl.toString());
      if (!searchRes.ok) throw new Error(`YouTube search failed: ${searchRes.status}`);
      const searchData = (await searchRes.json()) as { items: YTSearchItem[] };
      const ids = searchData.items.map((i) => i.id.videoId).filter(Boolean);
      if (ids.length === 0) return [];

      const detailsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
      detailsUrl.searchParams.set("part", "contentDetails,statistics");
      detailsUrl.searchParams.set("id", ids.join(","));
      detailsUrl.searchParams.set("key", env.youtubeApiKey);
      const detailsRes = await fetch(detailsUrl.toString());
      const detailsData = detailsRes.ok
        ? ((await detailsRes.json()) as { items: YTVideoDetail[] })
        : { items: [] as YTVideoDetail[] };
      const detailsById = new Map(detailsData.items.map((d) => [d.id, d]));

      const results = searchData.items.map((item): VideoSearchResult => {
        const detail = detailsById.get(item.id.videoId);
        return {
          externalId: item.id.videoId,
          platform: "YOUTUBE",
          title: item.snippet.title,
          channel: item.snippet.channelTitle ?? null,
          url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
          publishedAt: item.snippet.publishedAt ?? null,
          durationSeconds: detail ? parseIsoDuration(detail.contentDetails.duration) : null,
          viewCount: detail?.statistics?.viewCount ?? "UNKNOWN",
          engagementMetrics: detail?.statistics
            ? {
                likes: detail.statistics.likeCount ?? "UNKNOWN",
                comments: detail.statistics.commentCount ?? "UNKNOWN",
              }
            : null,
          thumbnailUrl: item.snippet.thumbnails?.medium?.url ?? null,
          description: item.snippet.description ?? null,
        };
      });

      logger.info("search_provider_call", { provider: this.name, operation: "search", status: "ok", durationMs: Date.now() - start });
      return results;
    } catch (error) {
      logger.error("search_provider_call", {
        provider: this.name,
        operation: "search",
        status: "error",
        durationMs: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
