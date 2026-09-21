import { env } from "@/lib/env";
import { MockSearchProvider } from "./mock";
import type { SearchProvider } from "./types";

let instance: SearchProvider | null = null;

export function getSearchProvider(): SearchProvider {
  if (!instance) {
    if (env.mockSearch || !env.youtubeApiKey) {
      instance = new MockSearchProvider();
    } else {
      const { YouTubeSearchProvider } = require("./youtube") as typeof import("./youtube");
      instance = new YouTubeSearchProvider();
    }
  }
  return instance;
}

export type { SearchProvider, VideoSearchResult } from "./types";
