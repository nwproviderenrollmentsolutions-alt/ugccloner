import { db } from "@/lib/db";
import { AVATAR_REQUIRED_MESSAGE, type AvatarLockProfile } from "@/prompts/avatar-lock";

export class AvatarRequiredError extends Error {
  constructor() {
    super(AVATAR_REQUIRED_MESSAGE);
    this.name = "AvatarRequiredError";
  }
}

/**
 * Loads the full avatar identity-lock profile for a project. Throws
 * AvatarRequiredError (never silently invents a presenter) if no avatar is
 * selected or it has zero reference assets.
 */
export async function loadAvatarLockProfile(avatarId: string | null): Promise<AvatarLockProfile> {
  if (!avatarId) throw new AvatarRequiredError();

  const avatar = await db.avatar.findUnique({ where: { id: avatarId }, include: { references: true } });
  if (!avatar) throw new AvatarRequiredError();

  return {
    avatarId: avatar.id,
    name: avatar.name,
    description: avatar.description,
    voiceProvider: avatar.voiceProvider,
    voiceId: avatar.voiceId,
    defaultWardrobe: avatar.defaultWardrobe,
    defaultEnvironment: avatar.defaultEnvironment,
    performanceStyle: avatar.performanceStyle,
    personality: avatar.personality,
    cameraPreferences: avatar.cameraPreferences,
    negativeConstraints: avatar.negativeConstraints,
    identityConsistency: avatar.identityConsistency as AvatarLockProfile["identityConsistency"],
    referenceAssetUrls: avatar.references.map((r) => r.url ?? r.storageKey),
  };
}
