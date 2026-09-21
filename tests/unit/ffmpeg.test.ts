import { describe, expect, it } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { probeVideo, isFfmpegAvailable } from "@/lib/ffmpeg";

const execFileAsync = promisify(execFile);

describe("probeVideo", () => {
  it("extracts real metadata when ffmpeg is available, or reports UNKNOWN rather than a guess", async () => {
    const available = await isFfmpegAvailable();
    if (!available) {
      const result = await probeVideo("/nonexistent/path.mp4");
      expect(result.status).toBe("UNKNOWN");
      expect(result.durationSeconds).toBeNull();
      return;
    }

    const tmpPath = path.join(os.tmpdir(), `probe-test-${Date.now()}.mp4`);
    await execFileAsync("ffmpeg", [
      "-y",
      "-f",
      "lavfi",
      "-i",
      "color=c=red:s=320x240:d=2",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      tmpPath,
    ]);

    const result = await probeVideo(tmpPath);
    expect(result.status).toBe("EXTRACTED");
    expect(result.width).toBe(320);
    expect(result.height).toBe(240);
    expect(result.durationSeconds).toBeGreaterThan(1.5);

    await fs.unlink(tmpPath).catch(() => {});
  });

  it("reports UNKNOWN for a file that cannot be probed instead of fabricating metadata", async () => {
    const result = await probeVideo("/definitely/does/not/exist.mp4");
    expect(result.status).toBe("UNKNOWN");
    expect(result.durationSeconds).toBeNull();
    expect(result.width).toBeNull();
  });
});
