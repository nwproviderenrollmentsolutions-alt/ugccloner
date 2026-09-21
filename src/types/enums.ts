// Plain-string "enums" (see prisma/schema.prisma header for why). Centralized
// here so the whole app shares one source of truth for valid state values.

export const PROJECT_STATUS = [
  "CREATED",
  "UPLOADED",
  "ANALYZING",
  "RESEARCHING",
  "BLUEPRINT_READY",
  "SCRIPT_READY",
  "SHOTS_READY",
  "GENERATING",
  "REVIEW",
  "COMPLETE",
  "ERROR",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUS)[number];

export const PLATFORMS = ["TIKTOK", "REELS", "SHORTS"] as const;
export type Platform = (typeof PLATFORMS)[number];

export const HOOK_TYPES = [
  "Curiosity",
  "Shock",
  "Contrarian",
  "Problem",
  "Transformation",
  "Demonstration",
  "Confession",
  "Story",
  "Question",
  "Unexpected result",
  "Before/After",
  "Secret",
  "List",
  "Challenge",
] as const;
export type HookType = (typeof HOOK_TYPES)[number];

export const GENERATION_STATUS = ["QUEUED", "PROCESSING", "COMPLETED", "FAILED"] as const;
export type GenerationStatus = (typeof GENERATION_STATUS)[number];

export const SHOT_STATUS = ["PENDING", "GENERATING", "GENERATED", "APPROVED", "REJECTED", "FAILED"] as const;
export type ShotStatus = (typeof SHOT_STATUS)[number];

export const CONSISTENCY_RECOMMENDATION = ["APPROVE", "REVIEW", "REJECT", "UNKNOWN"] as const;
export type ConsistencyRecommendation = (typeof CONSISTENCY_RECOMMENDATION)[number];

export const IDENTITY_CONSISTENCY_CAPABILITY = ["HIGH", "LIMITED", "UNKNOWN"] as const;
export type IdentityConsistencyCapability = (typeof IDENTITY_CONSISTENCY_CAPABILITY)[number];

export const AVATAR_REFERENCE_TYPES = ["FACE_IMAGE", "REFERENCE_VIDEO", "VOICE_SAMPLE"] as const;
export type AvatarReferenceType = (typeof AVATAR_REFERENCE_TYPES)[number];

export const ASSET_TYPES = ["SHOT", "FINAL_VIDEO"] as const;
export type AssetType = (typeof ASSET_TYPES)[number];

export const DURATION_PRESETS = [15, 20, 30, 45, 60] as const;
