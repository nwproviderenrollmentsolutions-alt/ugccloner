import type { IdentityConsistencyCapability } from "@/types/enums";

export interface AvatarValidationInput {
  avatarId: string;
  referenceAssetUrls: string[];
  voiceSampleUrl?: string;
}

export interface AvatarValidationResult {
  valid: boolean;
  issues: string[];
  identityConsistencyCapability: IdentityConsistencyCapability;
  externalAvatarId?: string;
}

export interface AvatarProvider {
  readonly name: string;
  readonly isMock: boolean;
  validateAvatar(input: AvatarValidationInput): Promise<AvatarValidationResult>;
}
