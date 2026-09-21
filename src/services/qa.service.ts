import { db } from "@/lib/db";
import { getAIProvider } from "@/providers/ai";
import type { VideoAnalysisResult, FrameworkResult, ScriptVersion, HookAnalysis } from "@/types/pipeline";
import { logger } from "@/lib/logger";

export async function runProjectQualityControl(projectId: string) {
  const [analysis, blueprint, approvedScript, shots, generations, consistencyChecks] = await Promise.all([
    db.videoAnalysis.findFirst({ where: { projectId }, orderBy: { createdAt: "desc" } }),
    db.creativeBlueprint.findUnique({ where: { projectId }, include: { framework: true } }),
    db.script.findFirst({ where: { projectId, status: "APPROVED" } }),
    db.shot.findMany({ where: { projectId } }),
    db.generation.findMany({ where: { projectId } }),
    db.avatarConsistencyCheck.findMany({ where: { generation: { projectId } } }),
  ]);

  const consistencyIssues = consistencyChecks
    .filter((c) => c.recommendation !== "APPROVE")
    .map((c) => `Shot consistency check: ${c.recommendation}${c.issues ? ` — ${JSON.stringify(c.issues)}` : ""}`);

  const ai = getAIProvider();
  const result = await ai.runQualityControl({
    analysis: analysis
      ? ({
          hook: analysis.hook,
          timeline: analysis.timeline,
          performance: analysis.performance,
          editing: analysis.editing,
          cta: analysis.cta,
        } as unknown as VideoAnalysisResult)
      : null,
    framework: blueprint?.framework
      ? ({
          name: blueprint.framework.name,
          hookType: blueprint.framework.hookType as HookAnalysis["category"],
          structure: blueprint.framework.structure as string[],
          pacing: blueprint.framework.pacing as FrameworkResult["pacing"],
          visualStrategy: blueprint.framework.visualStrategy,
          adaptable: blueprint.framework.adaptable,
        } as FrameworkResult)
      : null,
    script: approvedScript
      ? ({
          version: approvedScript.version,
          label: approvedScript.label,
          hookType: approvedScript.hookType as HookAnalysis["category"],
          durationSeconds: approvedScript.durationSeconds,
          content: approvedScript.content,
        } as unknown as ScriptVersion)
      : null,
    shotCount: shots.length,
    generatedCount: generations.filter((g) => g.status === "COMPLETED").length,
    approvedCount: shots.filter((s) => s.status === "APPROVED" || s.status === "GENERATED").length,
    consistencyIssues,
  });

  logger.info("quality_control_run", { projectId, operation: "run_qc", provider: ai.name, status: result.status });

  return result;
}
