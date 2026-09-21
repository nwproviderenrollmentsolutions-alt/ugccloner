export interface ShotGenerationRequest {
  shotId: string;
  prompt: string; // full production prompt, including the avatar identity lock block
  avatarId: string;
  avatarReferenceAssetUrls: string[];
  durationSeconds: number;
  aspectRatio: "9:16" | "1:1" | "16:9";
}

export interface GenerationJobHandle {
  externalJobId: string;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
}

export interface GenerationStatusResult {
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  assetUrl?: string;
  errorMessage?: string;
}

export interface VideoGenerationProvider {
  readonly name: string;
  readonly isMock: boolean;
  /** Whether this provider can actually guarantee presenter identity consistency. Never overstated. */
  readonly identityConsistency: "HIGH" | "LIMITED" | "UNKNOWN";
  generateShot(input: ShotGenerationRequest): Promise<GenerationJobHandle>;
  getJobStatus(externalJobId: string): Promise<GenerationStatusResult>;
}
