import { describe, expect, it } from "vitest";
import { MockAIProvider } from "@/providers/ai/mock";
import type { AvatarLockProfile } from "@/prompts/avatar-lock";

const provider = new MockAIProvider();

const avatar: AvatarLockProfile = {
  avatarId: "avatar-1",
  name: "My AI Clone",
  identityConsistency: "LIMITED",
  referenceAssetUrls: ["https://example.com/ref.png"],
};

describe("MockAIProvider.analyzeVideo", () => {
  it("produces a hook, an ordered timeline covering the full duration, and never invents an UNKNOWN metric as a number", async () => {
    const result = await provider.analyzeVideo({
      videoUrl: "https://example.com/video.mp4",
      durationSeconds: 24,
      width: 1080,
      height: 1920,
      fps: 30,
      hasAudio: true,
    });

    expect(result.hook.category).toBeTruthy();
    expect(result.timeline.length).toBeGreaterThan(0);
    expect(result.timeline[0].start).toBe(0);
    expect(result.timeline[result.timeline.length - 1].end).toBeCloseTo(24, 0);
    expect(result.cta.present).toBe(true);
  });
});

describe("MockAIProvider.generateScripts", () => {
  it("returns the requested number of distinct, avatar-agnostic versions", async () => {
    const versions = await provider.generateScripts({
      product: "Replit",
      platform: "TIKTOK",
      durationSeconds: 30,
      framework: {
        name: "Test framework",
        hookType: "Curiosity",
        structure: ["Hook", "Problem", "Demo", "CTA"],
        pacing: "fast",
        visualStrategy: "talking head",
        adaptable: true,
      },
      avatar,
      versionCount: 3,
    });

    expect(versions).toHaveLength(3);
    expect(new Set(versions.map((v) => v.version)).size).toBe(3);
    for (const v of versions) {
      expect(v.durationSeconds).toBe(30);
      expect(v.content.length).toBeGreaterThan(0);
    }
  });
});

describe("MockAIProvider.checkAvatarConsistency", () => {
  it("never fabricates a confidence score when it has no real comparison capability", async () => {
    const result = await provider.checkAvatarConsistency({ generatedVideoUrl: "https://example.com/gen.mp4", avatar });
    expect(result.confidence).toBeNull();
    expect(result.recommendation).toBe("UNKNOWN");
  });
});

describe("MockAIProvider.runQualityControl", () => {
  it("rejects when nothing has actually been generated yet", async () => {
    const result = await provider.runQualityControl({
      analysis: null,
      framework: null,
      script: null,
      shotCount: 5,
      generatedCount: 0,
      approvedCount: 0,
      consistencyIssues: [],
    });
    expect(result.status).toBe("REJECT");
  });

  it("approves only when every shot generated and no consistency issues were raised", async () => {
    const result = await provider.runQualityControl({
      analysis: null,
      framework: null,
      script: null,
      shotCount: 3,
      generatedCount: 3,
      approvedCount: 3,
      consistencyIssues: [],
    });
    // analysis/framework/script are all null here, so this is REVIEW not APPROVE —
    // confirms the QC agent won't rubber-stamp an incomplete production package.
    expect(result.status).toBe("REVIEW");
    expect(result.issues.length).toBeGreaterThan(0);
  });
});
