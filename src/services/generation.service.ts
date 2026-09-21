import { db } from "@/lib/db";
import { getVideoGenerationProvider } from "@/providers/video";
import { loadAvatarLockProfile } from "./avatar.service";
import { checkGenerationConsistency } from "./avatar-consistency.service";
import { PLATFORM_ASPECT_RATIO } from "./platform";
import { logger } from "@/lib/logger";
import { toJson } from "@/lib/json";

export class NoShotsError extends Error {
  constructor() {
    super("Generate a shot list before starting video generation.");
    this.name = "NoShotsError";
  }
}

/** Kicks off a generation job for every PENDING shot in the project. */
export async function startProjectGeneration(projectId: string) {
  const project = await db.project.findUniqueOrThrow({ where: { id: projectId } });
  const shots = await db.shot.findMany({ where: { projectId, status: "PENDING" }, orderBy: { shotNumber: "asc" } });
  if (shots.length === 0) throw new NoShotsError();

  const avatar = await loadAvatarLockProfile(project.avatarId);
  const provider = getVideoGenerationProvider();
  const aspectRatio = PLATFORM_ASPECT_RATIO[project.platform] ?? "9:16";

  await db.project.update({ where: { id: projectId }, data: { status: "GENERATING", errorMessage: null } });

  const generations = [];
  for (const shot of shots) {
    const job = await provider.generateShot({
      shotId: shot.id,
      prompt: shot.generationPrompt,
      avatarId: avatar.avatarId,
      avatarReferenceAssetUrls: avatar.referenceAssetUrls,
      durationSeconds: shot.durationSeconds,
      aspectRatio,
    });

    const generation = await db.generation.create({
      data: {
        projectId,
        shotId: shot.id,
        avatarId: avatar.avatarId,
        provider: provider.name,
        externalJobId: job.externalJobId,
        status: job.status,
        isMock: provider.isMock,
        requestPayload: toJson({ prompt: shot.generationPrompt, aspectRatio }),
      },
    });
    await db.shot.update({ where: { id: shot.id }, data: { status: "GENERATING" } });
    generations.push(generation);
  }

  logger.info("generation_started", {
    projectId,
    operation: "start_generation",
    provider: provider.name,
    status: "ok",
    count: generations.length,
  });

  return generations;
}

/**
 * Polls every in-flight generation for this project against the video
 * provider, persists any status changes, and runs the avatar-consistency
 * check as soon as a shot completes. Safe to call repeatedly (e.g. from a
 * client-side status poll) — a Next.js API route is stateless per request,
 * but this keeps the DB as the source of truth so polling is idempotent.
 */
export async function syncProjectGenerations(projectId: string) {
  const inFlight = await db.generation.findMany({
    where: { projectId, status: { in: ["QUEUED", "PROCESSING"] } },
  });
  if (inFlight.length === 0) return;

  const provider = getVideoGenerationProvider();

  for (const generation of inFlight) {
    if (!generation.externalJobId) continue;
    const result = await provider.getJobStatus(generation.externalJobId);
    if (result.status === generation.status) continue;

    await db.generation.update({ where: { id: generation.id }, data: { status: result.status, errorMessage: result.errorMessage } });

    if (result.status === "COMPLETED" && result.assetUrl) {
      await db.generatedAsset.create({
        data: {
          projectId,
          generationId: generation.id,
          type: "SHOT",
          storageKey: new URL(result.assetUrl, "http://local").pathname.replace(/^\/api\/storage\//, ""),
          url: result.assetUrl,
        },
      });
      await checkGenerationConsistency(generation.id);
      logger.info("generation_completed", { projectId, jobId: generation.id, provider: provider.name, status: "COMPLETED" });
    } else if (result.status === "FAILED") {
      await db.shot.update({ where: { id: generation.shotId }, data: { status: "FAILED" } });
      logger.error("generation_failed", {
        projectId,
        jobId: generation.id,
        provider: provider.name,
        status: "FAILED",
        error: result.errorMessage,
      });
    }
  }

  const remaining = await db.generation.count({ where: { projectId, status: { in: ["QUEUED", "PROCESSING"] } } });
  if (remaining === 0) {
    const project = await db.project.findUnique({ where: { id: projectId } });
    if (project?.status === "GENERATING") {
      await db.project.update({ where: { id: projectId }, data: { status: "REVIEW" } });
    }
  }
}
