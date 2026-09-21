function bool(v: string | undefined, fallback: boolean): boolean {
  if (v === undefined || v === "") return fallback;
  return v === "true" || v === "1";
}

export const env = {
  authSecret: process.env.AUTH_SECRET || "dev-only-insecure-secret-change-me",
  appBaseUrl: process.env.APP_BASE_URL || "http://localhost:3000",

  mockAI: bool(process.env.MOCK_AI, !process.env.ANTHROPIC_API_KEY),
  mockVideo: bool(process.env.MOCK_VIDEO, !process.env.VIDEO_PROVIDER_API_KEY),
  mockSearch: bool(process.env.MOCK_SEARCH, !process.env.YOUTUBE_API_KEY && !process.env.SEARCH_API_KEY),
  mockAvatar: bool(process.env.MOCK_AVATAR, !process.env.AVATAR_PROVIDER_API_KEY),

  anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
  anthropicModel: process.env.ANTHROPIC_MODEL || "claude-opus-5",

  youtubeApiKey: process.env.YOUTUBE_API_KEY || "",
  searchApiKey: process.env.SEARCH_API_KEY || "",
  searchBaseUrl: process.env.SEARCH_BASE_URL || "",

  storageEndpoint: process.env.STORAGE_ENDPOINT || "",
  storageRegion: process.env.STORAGE_REGION || "auto",
  storageAccessKey: process.env.STORAGE_ACCESS_KEY || "",
  storageSecretKey: process.env.STORAGE_SECRET_KEY || "",
  storageBucket: process.env.STORAGE_BUCKET || "",
  storagePublicBaseUrl: process.env.STORAGE_PUBLIC_BASE_URL || "",

  videoProviderApiKey: process.env.VIDEO_PROVIDER_API_KEY || "",
  videoProviderBaseUrl: process.env.VIDEO_PROVIDER_BASE_URL || "",

  avatarProviderApiKey: process.env.AVATAR_PROVIDER_API_KEY || "",
  avatarProviderBaseUrl: process.env.AVATAR_PROVIDER_BASE_URL || "",
};

export const isStorageConfigured = () =>
  Boolean(env.storageEndpoint && env.storageAccessKey && env.storageSecretKey && env.storageBucket);
