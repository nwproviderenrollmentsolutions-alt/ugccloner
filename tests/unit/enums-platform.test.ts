import { describe, expect, it } from "vitest";
import { DURATION_PRESETS, PLATFORMS, PROJECT_STATUS } from "@/types/enums";
import { PLATFORM_ASPECT_RATIO } from "@/services/platform";

describe("enums", () => {
  it("defines an aspect ratio for every supported platform", () => {
    for (const platform of PLATFORMS) {
      expect(PLATFORM_ASPECT_RATIO[platform]).toBeDefined();
    }
  });

  it("includes every documented duration preset", () => {
    expect(DURATION_PRESETS).toEqual([15, 20, 30, 45, 60]);
  });

  it("has a terminal COMPLETE and ERROR status for the pipeline", () => {
    expect(PROJECT_STATUS).toContain("COMPLETE");
    expect(PROJECT_STATUS).toContain("ERROR");
  });
});
