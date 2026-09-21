import type {
  BlueprintResult,
  ConsistencyResult,
  FrameworkResult,
  QualityControlResult,
  ScriptVersion,
  ShotDraftResult,
  VideoAnalysisResult,
} from "@/types/pipeline";
import type { AvatarLockProfile } from "@/prompts/avatar-lock";

export interface VideoAnalysisInput {
  videoUrl: string;
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
  fps: number | null;
  hasAudio: boolean | null;
}

export interface FrameworkExtractionInput {
  analyses: VideoAnalysisResult[];
  videoTitles?: string[];
}

export interface BlueprintInput {
  product: string;
  campaignGoal?: string | null;
  platform: string;
  framework: FrameworkResult;
  referenceHook: string;
}

export interface ScriptInput {
  product: string;
  campaignGoal?: string | null;
  platform: string;
  durationSeconds: number;
  framework: FrameworkResult;
  avatar: AvatarLockProfile;
  versionCount: number;
}

export interface ShotGenerationInput {
  script: ScriptVersion;
  avatar: AvatarLockProfile;
  platform: string;
}

export interface ConsistencyCheckInput {
  generatedVideoUrl: string;
  avatar: AvatarLockProfile;
}

export interface QualityControlInput {
  analysis: VideoAnalysisResult | null;
  framework: FrameworkResult | null;
  script: ScriptVersion | null;
  shotCount: number;
  generatedCount: number;
  approvedCount: number;
  consistencyIssues: string[];
}

export interface AIProvider {
  readonly name: string;
  readonly isMock: boolean;
  analyzeVideo(input: VideoAnalysisInput): Promise<VideoAnalysisResult>;
  extractFramework(input: FrameworkExtractionInput): Promise<FrameworkResult>;
  generateBlueprint(input: BlueprintInput): Promise<BlueprintResult>;
  generateScripts(input: ScriptInput): Promise<ScriptVersion[]>;
  generateShots(input: ShotGenerationInput): Promise<ShotDraftResult[]>;
  checkAvatarConsistency(input: ConsistencyCheckInput): Promise<ConsistencyResult>;
  runQualityControl(input: QualityControlInput): Promise<QualityControlResult>;
}
