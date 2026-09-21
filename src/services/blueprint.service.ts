import { db } from "@/lib/db";
import { getAIProvider } from "@/providers/ai";
import type { HookAnalysis } from "@/types/pipeline";
import { extractProjectFramework, NoAnalysisError } from "./framework.service";
import { logger } from "@/lib/logger";
import { toJson } from "@/lib/json";

export { NoAnalysisError };

export async function generateProjectBlueprint(projectId: string) {
  const project = await db.project.findUniqueOrThrow({ where: { id: projectId } });
  const analysis = await db.videoAnalysis.findFirst({ where: { projectId }, orderBy: { createdAt: "desc" } });
  if (!analysis) throw new NoAnalysisError();

  const framework = await extractProjectFramework(projectId);

  const ai = getAIProvider();
  const start = Date.now();
  const hook = analysis.hook as unknown as HookAnalysis;
  const result = await ai.generateBlueprint({
    product: project.product,
    campaignGoal: project.campaignGoal,
    platform: project.platform,
    framework: {
      name: framework.name,
      hookType: framework.hookType as HookAnalysis["category"],
      structure: framework.structure as string[],
      pacing: framework.pacing as "fast" | "moderate" | "slow",
      visualStrategy: framework.visualStrategy,
      adaptable: framework.adaptable,
    },
    referenceHook: hook.spokenHook || hook.visualHook,
  });

  const blueprint = await db.creativeBlueprint.upsert({
    where: { projectId },
    create: {
      projectId,
      frameworkId: framework.id,
      campaignObjective: result.campaignObjective,
      targetAudience: result.targetAudience,
      hookStrategy: toJson(result.hookStrategy),
      storyStructure: toJson(result.storyStructure),
      visualStrategy: toJson(result.visualStrategy),
      performanceStrategy: toJson(result.performanceStrategy),
      bRollStrategy: toJson(result.bRollStrategy),
      editingStrategy: toJson(result.editingStrategy),
      ctaStrategy: toJson(result.ctaStrategy),
    },
    update: {
      frameworkId: framework.id,
      campaignObjective: result.campaignObjective,
      targetAudience: result.targetAudience,
      hookStrategy: toJson(result.hookStrategy),
      storyStructure: toJson(result.storyStructure),
      visualStrategy: toJson(result.visualStrategy),
      performanceStrategy: toJson(result.performanceStrategy),
      bRollStrategy: toJson(result.bRollStrategy),
      editingStrategy: toJson(result.editingStrategy),
      ctaStrategy: toJson(result.ctaStrategy),
    },
  });

  await db.project.update({ where: { id: projectId }, data: { status: "BLUEPRINT_READY" } });

  logger.info("blueprint_generated", {
    projectId,
    operation: "generate_blueprint",
    provider: ai.name,
    status: "ok",
    durationMs: Date.now() - start,
  });

  return { blueprint, framework };
}
