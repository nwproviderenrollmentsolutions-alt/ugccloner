import { db } from "@/lib/db";
import { getAIProvider } from "@/providers/ai";
import type { VideoAnalysisResult } from "@/types/pipeline";
import { logger } from "@/lib/logger";
import { toJson } from "@/lib/json";

export class NoAnalysisError extends Error {
  constructor() {
    super("Run video analysis before extracting a framework.");
    this.name = "NoAnalysisError";
  }
}

/**
 * Extracts a reusable viral framework from the project's reference-video
 * analysis. The uploaded video's full structural analysis is real evidence;
 * researched competitor videos (title/metadata only — see research.service)
 * are folded in as supporting titles, not fabricated structural claims.
 */
export async function extractProjectFramework(projectId: string) {
  const analysis = await db.videoAnalysis.findFirst({ where: { projectId }, orderBy: { createdAt: "desc" } });
  if (!analysis) throw new NoAnalysisError();

  const researchVideos = await db.viralVideo.findMany({ where: { projectId }, take: 10 });
  const project = await db.project.findUniqueOrThrow({ where: { id: projectId } });

  const ai = getAIProvider();
  const start = Date.now();
  const result = await ai.extractFramework({
    analyses: [
      {
        hook: analysis.hook as unknown as VideoAnalysisResult["hook"],
        timeline: analysis.timeline as unknown as VideoAnalysisResult["timeline"],
        performance: analysis.performance as unknown as VideoAnalysisResult["performance"],
        editing: analysis.editing as unknown as VideoAnalysisResult["editing"],
        cta: analysis.cta as unknown as VideoAnalysisResult["cta"],
      },
    ],
    videoTitles: researchVideos.map((v) => v.title),
  });

  const framework = await db.viralFramework.create({
    data: {
      userId: project.userId,
      name: result.name,
      hookType: result.hookType,
      structure: toJson(result.structure),
      pacing: result.pacing,
      visualStrategy: result.visualStrategy,
      platform: project.platform,
      productType: project.product,
      adaptable: result.adaptable,
      notes: researchVideos.length
        ? `Cross-referenced against ${researchVideos.length} comparable videos found during research (title/metadata evidence only).`
        : "Derived solely from the uploaded reference video's structural analysis — no comparable research videos were available.",
    },
  });

  logger.info("framework_extracted", {
    projectId,
    operation: "extract_framework",
    provider: ai.name,
    status: "ok",
    durationMs: Date.now() - start,
  });

  return framework;
}
