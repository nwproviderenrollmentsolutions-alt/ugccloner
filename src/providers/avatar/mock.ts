import type { AvatarProvider, AvatarValidationInput, AvatarValidationResult } from "./types";

export class MockAvatarProvider implements AvatarProvider {
  readonly name = "MOCK_AVATAR";
  readonly isMock = true;

  async validateAvatar(input: AvatarValidationInput): Promise<AvatarValidationResult> {
    const issues: string[] = [];
    if (input.referenceAssetUrls.length === 0) {
      issues.push("No reference assets uploaded — at least one face image or reference video is required.");
    }
    return {
      valid: input.referenceAssetUrls.length > 0,
      issues,
      // Honest: MOCK_AVATAR performs no real identity-preservation analysis.
      identityConsistencyCapability: "UNKNOWN",
      externalAvatarId: input.referenceAssetUrls.length > 0 ? `mock_avatar_${input.avatarId.slice(0, 8)}` : undefined,
    };
  }
}
