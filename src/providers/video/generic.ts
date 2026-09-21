import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import type { GenerationJobHandle, GenerationStatusResult, ShotGenerationRequest, VideoGenerationProvider } from "./types";

/**
 * Generic adapter for any HTTP video-generation provider that exposes a
 * simple "submit job / poll status" REST contract:
 *
 *   POST {baseUrl}/generations
 *     Authorization: Bearer {apiKey}
 *     body: { prompt, avatarId, referenceAssets, durationSeconds, aspectRatio }
 *     -> { id: string, status: "queued" | "processing" | "completed" | "failed" }
 *
 *   GET {baseUrl}/generations/{id}
 *     Authorization: Bearer {apiKey}
 *     -> { status, assetUrl?, error? }
 *
 * Swap in a provider-specific adapter implementing VideoGenerationProvider
 * for anything that doesn't match this shape — see README "How to add a new
 * provider".
 */
export class GenericVideoGenerationProvider implements VideoGenerationProvider {
  readonly name = "GENERIC_HTTP_VIDEO";
  readonly isMock = false;
  // Never claim exact identity preservation for an unverified third-party
  // provider — this is the honest default per the architecture rules.
  readonly identityConsistency = "LIMITED" as const;

  private baseUrl = env.videoProviderBaseUrl.replace(/\/$/, "");
  private apiKey = env.videoProviderApiKey;

  async generateShot(input: ShotGenerationRequest): Promise<GenerationJobHandle> {
    const start = Date.now();
    try {
      const res = await fetch(`${this.baseUrl}/generations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify({
          prompt: input.prompt,
          avatarId: input.avatarId,
          referenceAssets: input.avatarReferenceAssetUrls,
          durationSeconds: input.durationSeconds,
          aspectRatio: input.aspectRatio,
        }),
      });
      if (!res.ok) throw new Error(`Video provider returned ${res.status}`);
      const data = (await res.json()) as { id: string; status: string };
      logger.info("video_provider_call", { provider: this.name, operation: "generateShot", status: "ok", durationMs: Date.now() - start });
      return { externalJobId: data.id, status: this.normalizeStatus(data.status) };
    } catch (error) {
      logger.error("video_provider_call", {
        provider: this.name,
        operation: "generateShot",
        status: "error",
        durationMs: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async getJobStatus(externalJobId: string): Promise<GenerationStatusResult> {
    try {
      const res = await fetch(`${this.baseUrl}/generations/${externalJobId}`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      if (!res.ok) throw new Error(`Video provider returned ${res.status}`);
      const data = (await res.json()) as { status: string; assetUrl?: string; error?: string };
      return { status: this.normalizeStatus(data.status), assetUrl: data.assetUrl, errorMessage: data.error };
    } catch (error) {
      return { status: "FAILED", errorMessage: error instanceof Error ? error.message : String(error) };
    }
  }

  private normalizeStatus(s: string): GenerationStatusResult["status"] {
    const up = s.toUpperCase();
    if (up === "QUEUED" || up === "PROCESSING" || up === "COMPLETED" || up === "FAILED") return up;
    return "PROCESSING";
  }
}
