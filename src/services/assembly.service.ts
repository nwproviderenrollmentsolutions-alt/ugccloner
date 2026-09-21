import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";
import { db } from "@/lib/db";
import { concatVideos, isFfmpegAvailable, probeVideo } from "@/lib/ffmpeg";
import { getStorageProvider } from "@/providers/storage";
import { runProjectQualityControl } from "./qa.service";
import { logger } from "@/lib/logger";

export class AssemblyUnavailableError extends Error {
  constructor(reason: string) {
    super(`Assembly unavailable: ${reason}`);
    this.name = "AssemblyUnavailableError";
  }
}

export class NoApprovedShotsError extends Error {
  constructor() {
    super("No generated shots are ready to assemble yet.");
    this.name = "NoApprovedShotsError";
  }
}

async function resolveLocalPath(storageKey: string, url: string, tmpDir: string): Promise<string> {
  const storage = getStorageProvider();
  const local = storage.getLocalPath?.(storageKey);
  if (local) return local;

  // Remote (S3-compatible) storage — download to a tmp file for ffmpeg.
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not download shot asset: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const tmpPath = path.join(tmpDir, `${path.basename(storageKey)}`);
  await fs.writeFile(tmpPath, buffer);
  return tmpPath;
}

/** Concatenates every usable shot asset into the final export and runs QC. */
export async function assembleProject(projectId: string) {
  if (!(await isFfmpegAvailable())) {
    throw new AssemblyUnavailableError("ffmpeg is not installed in this environment.");
  }

  const shots = await db.shot.findMany({
    where: { projectId, status: { in: ["GENERATED", "APPROVED"] } },
    orderBy: { shotNumber: "asc" },
    include: { generations: { include: { assets: true }, orderBy: { createdAt: "desc" }, take: 1 } },
  });
  const usable = shots.filter((s) => s.generations[0]?.assets[0]);
  if (usable.length === 0) throw new NoApprovedShotsError();

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "assembly-"));
  const start = Date.now();
  try {
    const localPaths = await Promise.all(
      usable.map((s) => {
        const asset = s.generations[0].assets[0];
        return resolveLocalPath(asset.storageKey, asset.url, tmpDir);
      })
    );

    const outPath = path.join(tmpDir, `final-${projectId}.mp4`);
    const ok = await concatVideos(localPaths, outPath);
    if (!ok) throw new AssemblyUnavailableError("ffmpeg concat failed.");

    const finalMeta = await probeVideo(outPath);
    const buffer = await fs.readFile(outPath);
    const storage = getStorageProvider();
    const key = `projects/${projectId}/final/${Date.now()}.mp4`;
    const { url } = await storage.put(key, buffer, "video/mp4");

    const finalAsset = await db.generatedAsset.create({
      data: {
        projectId,
        type: "FINAL_VIDEO",
        storageKey: key,
        url,
        durationSeconds: finalMeta.durationSeconds,
        width: finalMeta.width,
        height: finalMeta.height,
        aspectRatio: finalMeta.width && finalMeta.height ? `${finalMeta.width}:${finalMeta.height}` : null,
      },
    });

    const qc = await runProjectQualityControl(projectId);
    await db.project.update({ where: { id: projectId }, data: { status: qc.status === "APPROVE" ? "COMPLETE" : "REVIEW" } });

    logger.info("assembly_complete", {
      projectId,
      operation: "assemble",
      status: "ok",
      durationMs: Date.now() - start,
      shotCount: usable.length,
    });

    return { finalAsset, qc };
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}
