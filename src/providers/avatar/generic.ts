import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import type { AvatarProvider, AvatarValidationInput, AvatarValidationResult } from "./types";

/**
 * Generic adapter for an HTTP avatar/talking-head provider exposing:
 *   POST {baseUrl}/avatars/validate
 *     Authorization: Bearer {apiKey}
 *     body: { referenceAssets, voiceSampleUrl }
 *     -> { valid, issues, identityConsistency, externalAvatarId }
 */
export class GenericAvatarProvider implements AvatarProvider {
  readonly name = "GENERIC_HTTP_AVATAR";
  readonly isMock = false;

  private baseUrl = env.avatarProviderBaseUrl.replace(/\/$/, "");
  private apiKey = env.avatarProviderApiKey;

  async validateAvatar(input: AvatarValidationInput): Promise<AvatarValidationResult> {
    const start = Date.now();
    try {
      const res = await fetch(`${this.baseUrl}/avatars/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify({ referenceAssets: input.referenceAssetUrls, voiceSampleUrl: input.voiceSampleUrl }),
      });
      if (!res.ok) throw new Error(`Avatar provider returned ${res.status}`);
      const data = (await res.json()) as {
        valid: boolean;
        issues?: string[];
        identityConsistency?: "HIGH" | "LIMITED" | "UNKNOWN";
        externalAvatarId?: string;
      };
      logger.info("avatar_provider_call", { provider: this.name, operation: "validateAvatar", status: "ok", durationMs: Date.now() - start });
      return {
        valid: data.valid,
        issues: data.issues ?? [],
        // Never upgrade a provider's own claim — only pass through what it explicitly reports.
        identityConsistencyCapability: data.identityConsistency ?? "LIMITED",
        externalAvatarId: data.externalAvatarId,
      };
    } catch (error) {
      logger.error("avatar_provider_call", {
        provider: this.name,
        operation: "validateAvatar",
        status: "error",
        durationMs: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      });
      return { valid: false, issues: [error instanceof Error ? error.message : String(error)], identityConsistencyCapability: "UNKNOWN" };
    }
  }
}
