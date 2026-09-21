import { db } from "@/lib/db";
import { getAIProvider } from "@/providers/ai";
import { logger } from "@/lib/logger";
import { toJson } from "@/lib/json";

export class NoReferenceVideoError extends Error {
  constructor() {
    super("No reference video has been uploaded for this project yet.");
    this.name = "NoReferenceVideoError";
  }
}

export async function analyzeProjectVideo(projectId: string) {
  const referenceVideo = await db.referenceVideo.findFirst({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });
  if (!referenceVideo) throw new NoReferenceVideoError();

  await db.project.update({ where: { id: projectId }, data: { status: "ANALYZING", errorMessage: null } });

  const ai = getAIProvider();
  const start = Date.now();
  try {
    const result = await ai.analyzeVideo({
      videoUrl: referenceVideo.url ?? referenceVideo.storageKey,
      durationSeconds: referenceVideo.durationSeconds,
      width: referenceVideo.width,
      height: referenceVideo.height,
      fps: referenceVideo.fps,
      hasAudio: referenceVideo.hasAudio,
    });

    const analysis = await db.videoAnalysis.create({
      data: {
        projectId,
        referenceVideoId: referenceVideo.id,
        hook: toJson(result.hook),
        timeline: toJson(result.timeline),
        performance: toJson(result.performance),
        editing: toJson(result.editing),
        cta: toJson(result.cta),
        provider: ai.name,
        isMock: ai.isMock,
      },
    });

    logger.info("video_analysis_complete", {
      projectId,
      operation: "analyze_video",
      provider: ai.name,
      status: "ok",
      durationMs: Date.now() - start,
    });

    return analysis;
  } catch (error) {
    await db.project.update({
      where: { id: projectId },
      data: { status: "ERROR", errorMessage: error instanceof Error ? error.message : "Video analysis failed" },
    });
    logger.error("video_analysis_failed", {
      projectId,
      operation: "analyze_video",
      provider: ai.name,
      status: "error",
      durationMs: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
