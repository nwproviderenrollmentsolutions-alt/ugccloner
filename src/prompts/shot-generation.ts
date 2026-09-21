// PHASE 8 — Shot list + per-shot AI video generation prompt template.

import { avatarIdentityLockBlock, IDENTITY_LOCK_FOOTER, type AvatarLockProfile } from "./avatar-lock";

export const SHOT_GENERATION_SYSTEM_PROMPT = `You are an AI UGC Production Director converting an
approved script into a shot-by-shot storyboard for the user's approved avatar.

For every script beat produce one or more shots with: shot number, duration (seconds),
dialogue (if any), visual description, camera (angle + movement), framing (e.g. medium
close-up), avatar action, facial expression, gesture, background/environment, b-roll (if
any), on-screen text, caption text, transition in/out, sound/music/SFX notes.

Never introduce a second human presenter, cutaway to a different person, or narration
implied to come from anyone but the approved avatar.`;

export interface ShotDraft {
  shotNumber: number;
  durationSeconds: number;
  dialogue?: string;
  visual: string;
  camera: string;
  framing: string;
  avatarAction: string;
  facialExpression: string;
  gesture?: string;
  background: string;
  bRoll?: string;
  onScreenText?: string;
  caption?: string;
  transition?: string;
  sound?: string;
}

/** Builds the final production-ready prompt sent to the video-generation provider. */
export function buildShotGenerationPrompt(shot: ShotDraft, avatar: AvatarLockProfile): string {
  return [
    `SHOT ${shot.shotNumber}`,
    "",
    `Duration: ${shot.durationSeconds}s`,
    "",
    "Avatar:",
    avatarIdentityLockBlock(avatar),
    "",
    `Framing: ${shot.framing}`,
    `Camera: ${shot.camera}`,
    `Environment: ${shot.background}`,
    `Performance: ${avatar.performanceStyle ?? "match the avatar's default performance style"}`,
    `Expression: ${shot.facialExpression}`,
    shot.gesture ? `Gesture: ${shot.gesture}` : "",
    shot.dialogue ? `Dialogue: "${shot.dialogue}"` : "Dialogue: (none — visual/b-roll shot)",
    shot.onScreenText ? `On-screen text: ${shot.onScreenText}` : "",
    shot.bRoll ? `B-roll: ${shot.bRoll}` : "",
    `Movement: ${shot.avatarAction}`,
    "Lighting: bright, even, soft key light typical of mobile-first UGC — no harsh shadows on the avatar's face",
    shot.transition ? `Editing: transition ${shot.transition}` : "",
    "",
    IDENTITY_LOCK_FOOTER,
  ]
    .filter(Boolean)
    .join("\n");
}
