// AVATAR IDENTITY LOCK — the single most important rule in this application.
// The user's approved AI clone/avatar is the ONLY human identity ever allowed
// as the presenter in generated UGC. This module is imported by every prompt
// and service that touches presenter generation (script, shots, video-gen
// requests, consistency checks) so the rule can never be silently dropped.

export const AVATAR_REQUIRED_MESSAGE =
  "AVATAR REQUIRED: The approved AI clone reference is missing. Upload or connect the user's approved avatar reference before generating the presenter.";

export const DEFAULT_NEGATIVE_CONSTRAINTS = [
  "different person",
  "different face",
  "altered identity",
  "random influencer",
  "stock actor",
  "celebrity likeness",
  "generic human",
  "unrelated reference person",
];

export interface AvatarLockProfile {
  avatarId: string;
  name: string;
  description?: string | null;
  voiceProvider?: string | null;
  voiceId?: string | null;
  defaultWardrobe?: string | null;
  defaultEnvironment?: string | null;
  performanceStyle?: string | null;
  personality?: string | null;
  cameraPreferences?: string | null;
  negativeConstraints?: string | null;
  identityConsistency: "HIGH" | "LIMITED" | "UNKNOWN";
  referenceAssetUrls: string[];
}

/** The block embedded verbatim (with the avatar's real values) into every generation prompt. */
export function avatarIdentityLockBlock(avatar: AvatarLockProfile): string {
  const negatives = (avatar.negativeConstraints?.split("\n").filter(Boolean) ?? []).concat(
    DEFAULT_NEGATIVE_CONSTRAINTS
  );
  const uniqueNegatives = Array.from(new Set(negatives));

  return [
    `Use ONLY the approved user AI clone avatar (avatarId=${avatar.avatarId}, name="${avatar.name}").`,
    "Maintain exact avatar identity consistency across every shot: same face, hair, skin, eyes, body, voice, and age appearance as the reference assets.",
    "Do not create a new person. Do not alter facial identity. Do not substitute another actor. Do not introduce another human presenter.",
    avatar.voiceId ? `Voice: use voiceId=${avatar.voiceId} (provider: ${avatar.voiceProvider ?? "unspecified"}).` : "",
    avatar.defaultWardrobe ? `Default wardrobe: ${avatar.defaultWardrobe}.` : "",
    avatar.defaultEnvironment ? `Default environment: ${avatar.defaultEnvironment}.` : "",
    avatar.performanceStyle ? `Performance style: ${avatar.performanceStyle}.` : "",
    avatar.personality ? `Personality: ${avatar.personality}.` : "",
    avatar.cameraPreferences ? `Camera preferences: ${avatar.cameraPreferences}.` : "",
    avatar.referenceAssetUrls.length
      ? `Reference assets (identity ground truth): ${avatar.referenceAssetUrls.join(", ")}.`
      : "WARNING: no reference assets uploaded for this avatar yet — identity lock cannot be visually grounded.",
    `Negative constraints (never generate): ${uniqueNegatives.join(", ")}.`,
    `IDENTITY CONSISTENCY: ${avatar.identityConsistency === "HIGH" ? "the configured provider claims strong identity preservation" : avatar.identityConsistency === "LIMITED" ? "LIMITED — the configured video-generation provider cannot guarantee exact identity preservation; every clip must pass through the avatar consistency check before approval" : "UNKNOWN — the configured provider's identity-preservation capability has not been established"}.`,
  ]
    .filter(Boolean)
    .join("\n");
}

export const IDENTITY_LOCK_FOOTER = [
  "IDENTITY LOCK:",
  "Use only the approved user AI clone avatar.",
  "Do not alter identity.",
  "Do not generate another presenter.",
].join("\n");
