import { describe, expect, it } from "vitest";
import { buildShotGenerationPrompt, type ShotDraft } from "@/prompts/shot-generation";
import { IDENTITY_LOCK_FOOTER, type AvatarLockProfile } from "@/prompts/avatar-lock";

const avatar: AvatarLockProfile = {
  avatarId: "avatar-abc",
  name: "My AI Clone",
  identityConsistency: "LIMITED",
  referenceAssetUrls: ["https://example.com/ref.mp4"],
};

const shot: ShotDraft = {
  shotNumber: 1,
  durationSeconds: 4,
  dialogue: "Wait, this actually worked.",
  visual: "Presenter holds product up",
  camera: "handheld eye-level",
  framing: "medium close-up",
  avatarAction: "raises product",
  facialExpression: "surprised",
  background: "bright home office",
};

describe("buildShotGenerationPrompt", () => {
  it("includes the shot number, dialogue, and the full identity lock footer", () => {
    const prompt = buildShotGenerationPrompt(shot, avatar);
    expect(prompt).toContain("SHOT 1");
    expect(prompt).toContain(shot.dialogue!);
    expect(prompt).toContain(avatar.avatarId);
    expect(prompt.endsWith(IDENTITY_LOCK_FOOTER)).toBe(true);
  });

  it("marks visual-only shots as having no dialogue rather than omitting the field", () => {
    const prompt = buildShotGenerationPrompt({ ...shot, dialogue: undefined }, avatar);
    expect(prompt).toContain("Dialogue: (none — visual/b-roll shot)");
  });
});
