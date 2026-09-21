// Thin wrapper around ffprobe/ffmpeg. If the binaries aren't installed in
// this environment, every function degrades to reporting UNKNOWN rather than
// fabricating metadata — per the "never fabricate measurements" rule.

import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

let ffmpegAvailability: boolean | null = null;

export async function isFfmpegAvailable(): Promise<boolean> {
  if (ffmpegAvailability !== null) return ffmpegAvailability;
  try {
    await execFileAsync("ffprobe", ["-version"]);
    ffmpegAvailability = true;
  } catch {
    ffmpegAvailability = false;
  }
  return ffmpegAvailability;
}

export type ProbedMetadata = {
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
  fps: number | null;
  hasAudio: boolean | null;
  status: "EXTRACTED" | "UNKNOWN";
};

export async function probeVideo(filePath: string): Promise<ProbedMetadata> {
  const unknown: ProbedMetadata = {
    durationSeconds: null,
    width: null,
    height: null,
    fps: null,
    hasAudio: null,
    status: "UNKNOWN",
  };

  if (!(await isFfmpegAvailable())) return unknown;

  try {
    const { stdout } = await execFileAsync("ffprobe", [
      "-v",
      "error",
      "-print_format",
      "json",
      "-show_format",
      "-show_streams",
      filePath,
    ]);
    const data = JSON.parse(stdout);
    const videoStream = (data.streams || []).find((s: { codec_type: string }) => s.codec_type === "video");
    const audioStream = (data.streams || []).find((s: { codec_type: string }) => s.codec_type === "audio");

    let fps: number | null = null;
    if (videoStream?.r_frame_rate) {
      const [num, den] = String(videoStream.r_frame_rate).split("/").map(Number);
      if (den) fps = Math.round((num / den) * 100) / 100;
    }

    return {
      durationSeconds: data.format?.duration ? Math.round(parseFloat(data.format.duration) * 100) / 100 : null,
      width: videoStream?.width ?? null,
      height: videoStream?.height ?? null,
      fps,
      hasAudio: Boolean(audioStream),
      status: "EXTRACTED",
    };
  } catch {
    return unknown;
  }
}

export async function extractFrame(filePath: string, timeSeconds: number, outPath: string): Promise<boolean> {
  if (!(await isFfmpegAvailable())) return false;
  try {
    await execFileAsync("ffmpeg", ["-y", "-ss", String(timeSeconds), "-i", filePath, "-frames:v", "1", outPath]);
    return true;
  } catch {
    return false;
  }
}

export async function concatVideos(inputPaths: string[], outPath: string): Promise<boolean> {
  if (!(await isFfmpegAvailable()) || inputPaths.length === 0) return false;
  const listFile = `${outPath}.txt`;
  try {
    const fs = await import("node:fs/promises");
    await fs.writeFile(listFile, inputPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n"));
    await execFileAsync("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", outPath]);
    await fs.unlink(listFile).catch(() => {});
    return true;
  } catch {
    return false;
  }
}
