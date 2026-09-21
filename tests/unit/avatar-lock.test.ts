import { describe, expect, it } from "vitest";
import { avatarIdentityLockBlock, AVATAR_REQUIRED_MESSAGE, DEFAULT_NEGATIVE_CONSTRAINTS, type AvatarLockProfile } from "@/prompts/avatar-lock";

const baseAvatar: AvatarLockProfile = {
  avatarId: "avatar-123",
  name: "My AI Clone",
  identityConsistency: "LIMITED",
  referenceAssetUrls: ["https://example.com/face.png"],
};

describe("avatarIdentityLockBlock", () => {
  it("always embeds the avatarId and forbids substitution", () => {
    const block = avatarIdentityLockBlock(baseAvatar);
    expect(block).toContain("avatar-123");
    expect(block).toContain("My AI Clone");
    expect(block).toContain("Do not create a new person");
    expect(block).toContain("Do not introduce another human presenter");
  });

  it("always includes the default negative constraints even with none configured", () => {
    const block = avatarIdentityLockBlock(baseAvatar);
    for (const constraint of DEFAULT_NEGATIVE_CONSTRAINTS) {
      expect(block).toContain(constraint);
    }
  });

  it("merges custom negative constraints with the defaults, deduplicated", () => {
    const block = avatarIdentityLockBlock({ ...baseAvatar, negativeConstraints: "different face\nweird lighting" });
    expect(block).toContain("weird lighting");
    // "different face" appears once even though it's both custom and default.
    expect(block.match(/different face/g)?.length).toBe(1);
  });

  it("warns when no reference assets are present instead of silently proceeding", () => {
    const block = avatarIdentityLockBlock({ ...baseAvatar, referenceAssetUrls: [] });
    expect(block).toContain("WARNING: no reference assets uploaded");
  });

  it("never claims exact identity preservation for a LIMITED provider", () => {
    const block = avatarIdentityLockBlock(baseAvatar);
    expect(block).toContain("LIMITED");
    expect(block).toContain("cannot guarantee exact identity preservation");
  });

  it("reports UNKNOWN identity consistency honestly rather than a default claim", () => {
    const block = avatarIdentityLockBlock({ ...baseAvatar, identityConsistency: "UNKNOWN" });
    expect(block).toContain("UNKNOWN — the configured provider's identity-preservation capability has not been established");
  });
});

describe("AVATAR_REQUIRED_MESSAGE", () => {
  it("names the exact requirement rather than inventing a presenter", () => {
    expect(AVATAR_REQUIRED_MESSAGE).toMatch(/^AVATAR REQUIRED:/);
  });
});
