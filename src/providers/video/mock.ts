import { v4 as uuid } from "uuid";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { isFfmpegAvailable } from "@/lib/ffmpeg";
import { getStorageProvider } from "@/providers/storage";
import { logger } from "@/lib/logger";
import type { GenerationJobHandle, GenerationStatusResult, ShotGenerationRequest, VideoGenerationProvider } from "./types";

const execFileAsync = promisify(execFile);

// MOCK_VIDEO — synthesizes a real, playable short clip (via ffmpeg lavfi) that
// visibly labels itself "MOCK GENERATION — no real AI video model was called"
// with the shot's duration/prompt burned in as text. This is never presented
// as an actual AI-generated presenter: it exists purely so the rest of the
// pipeline (assembly, preview, status polling) can be exercised end-to-end.
// If ffmpeg isn't available in this environment, jobs fail explicitly rather
// than silently pretending to succeed.
//
// Job state is persisted to disk (not an in-memory Map) because Next.js can
// compile route handlers into separate module instances even within one dev
// server process, so a POST /generate and a later GET /status poll are not
// guaranteed to share module-scoped memory. Disk state is also what makes
// this safe under a real multi-instance/serverless deployment.

const JOBS_DIR = path.join(os.tmpdir(), "ugc-cloner-mock-jobs");

interface JobState {
  status: GenerationStatusResult["status"];
  assetUrl?: string;
  errorMessage?: string;
}

async function writeJobState(externalJobId: string, state: JobState) {
  await fs.mkdir(JOBS_DIR, { recursive: true });
  await fs.writeFile(path.join(JOBS_DIR, `${externalJobId}.json`), JSON.stringify(state));
}

async function readJobState(externalJobId: string): Promise<JobState | null> {
  try {
    const raw = await fs.readFile(path.join(JOBS_DIR, `${externalJobId}.json`), "utf-8");
    return JSON.parse(raw) as JobState;
  } catch {
    return null;
  }
}

const PROCESSING_DELAY_MS = 1200;

function escapeDrawtext(s: string): string {
  return s.replace(/[\\:']/g, "\\$&").replace(/\n/g, " ").slice(0, 90);
}

export class MockVideoGenerationProvider implements VideoGenerationProvider {
  readonly name = "MOCK_VIDEO";
  readonly isMock = true;
  readonly identityConsistency = "UNKNOWN" as const; // no real identity is generated at all

  async generateShot(input: ShotGenerationRequest): Promise<GenerationJobHandle> {
    const externalJobId = `mock_${uuid()}`;
    await writeJobState(externalJobId, { status: "QUEUED" });

    // Fire and forget the synthetic render; getJobStatus polls the job file.
    this.render(externalJobId, input).catch((error) => {
      writeJobState(externalJobId, {
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    });

    return { externalJobId, status: "QUEUED" };
  }

  private async render(externalJobId: string, input: ShotGenerationRequest) {
    await writeJobState(externalJobId, { status: "PROCESSING" });
    await new Promise((r) => setTimeout(r, PROCESSING_DELAY_MS));

    if (!(await isFfmpegAvailable())) {
      await writeJobState(externalJobId, {
        status: "FAILED",
        errorMessage: "ffmpeg is not installed in this environment — MOCK_VIDEO cannot synthesize a placeholder clip.",
      });
      return;
    }

    const [w, h] =
      input.aspectRatio === "9:16" ? [720, 1280] : input.aspectRatio === "1:1" ? [1080, 1080] : [1280, 720];
    const duration = Math.max(1, Math.round(input.durationSeconds));
    const tmpPath = path.join(os.tmpdir(), `${externalJobId}.mp4`);
    const label1 = escapeDrawtext(`MOCK GENERATION — shot ${input.shotId.slice(0, 8)}`);
    const label2 = escapeDrawtext(`avatar ${input.avatarId.slice(0, 8)} — no real AI video model was called`);

    try {
      await execFileAsync("ffmpeg", [
        "-y",
        "-f",
        "lavfi",
        "-i",
        `color=c=0x12151c:s=${w}x${h}:d=${duration}`,
        "-vf",
        [
          `drawtext=text='${label1}':fontcolor=white:fontsize=${Math.round(w / 18)}:x=(w-text_w)/2:y=(h/2)-60`,
          `drawtext=text='${label2}':fontcolor=0xff5c8a:fontsize=${Math.round(w / 30)}:x=(w-text_w)/2:y=(h/2)+20`,
        ].join(","),
        "-c:v",
        "libx264",
        "-t",
        String(duration),
        "-pix_fmt",
        "yuv420p",
        tmpPath,
      ]);

      const data = await fs.readFile(tmpPath);
      const storage = getStorageProvider();
      const { url } = await storage.put(`generations/${externalJobId}.mp4`, data, "video/mp4");
      await fs.unlink(tmpPath).catch(() => {});

      await writeJobState(externalJobId, { status: "COMPLETED", assetUrl: url });
      logger.info("mock_video_generation", { provider: this.name, jobId: externalJobId, status: "COMPLETED" });
    } catch (error) {
      await writeJobState(externalJobId, {
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      logger.error("mock_video_generation", {
        provider: this.name,
        jobId: externalJobId,
        status: "FAILED",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async getJobStatus(externalJobId: string): Promise<GenerationStatusResult> {
    const job = await readJobState(externalJobId);
    // Not-yet-visible state (race between the write above and a very fast
    // poll) is reported as QUEUED, not a hard failure — it always resolves
    // on the next poll rather than permanently marking the shot FAILED.
    if (!job) return { status: "QUEUED" };
    return { status: job.status, assetUrl: job.assetUrl, errorMessage: job.errorMessage };
  }
}
