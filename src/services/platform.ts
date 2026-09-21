export const PLATFORM_ASPECT_RATIO: Record<string, "9:16" | "1:1" | "16:9"> = {
  TIKTOK: "9:16",
  REELS: "9:16",
  SHORTS: "9:16",
};

export const PLATFORM_RESOLUTION: Record<"9:16" | "1:1" | "16:9", { width: number; height: number }> = {
  "9:16": { width: 1080, height: 1920 },
  "1:1": { width: 1080, height: 1080 },
  "16:9": { width: 1920, height: 1080 },
};
