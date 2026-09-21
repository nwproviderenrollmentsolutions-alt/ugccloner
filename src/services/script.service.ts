import { db } from "@/lib/db";
import { getAIProvider } from "@/providers/ai";
import { loadAvatarLockProfile } from "./avatar.service";
import type { HookAnalysis } from "@/types/pipeline";
import { logger } from "@/lib/logger";
import { toJson } from "@/lib/json";

export class NoBlueprintError extends Error {
  constructor() {
    super("Generate a creative blueprint before writing a script.");
    this.name = "NoBlueprintError";
  }
}

export async function generateProjectScripts(projectId: string, versionCount = 3) {
  const project = await db.project.findUniqueOrThrow({ where: { id: projectId } });
  const blueprint = await db.creativeBlueprint.findUnique({ where: { projectId }, include: { framework: true } });
  if (!blueprint || !blueprint.framework) throw new NoBlueprintError();

  // Throws AvatarRequiredError if no avatar/reference assets — the script is
  // always written for a specific approved presenter, never a placeholder.
  const avatar = await loadAvatarLockProfile(project.avatarId);

  const ai = getAIProvider();
  const start = Date.now();
  const versions = await ai.generateScripts({
    product: project.product,
    campaignGoal: project.campaignGoal,
    platform: project.platform,
    durationSeconds: project.duration,
    framework: {
      name: blueprint.framework.name,
      hookType: blueprint.framework.hookType as HookAnalysis["category"],
      structure: blueprint.framework.structure as string[],
      pacing: blueprint.framework.pacing as "fast" | "moderate" | "slow",
      visualStrategy: blueprint.framework.visualStrategy,
      adaptable: blueprint.framework.adaptable,
    },
    avatar,
    versionCount,
  });

  // Replace any previous draft versions for this project (re-generation).
  await db.script.deleteMany({ where: { projectId, status: "DRAFT" } });

  const created = await Promise.all(
    versions.map((v) =>
      db.script.create({
        data: {
          projectId,
          blueprintId: blueprint.id,
          version: v.version,
          label: v.label,
          hookType: v.hookType,
          durationSeconds: v.durationSeconds,
          content: toJson(v.content),
          status: "DRAFT",
        },
      })
    )
  );

  await db.project.update({ where: { id: projectId }, data: { status: "SCRIPT_READY" } });

  logger.info("scripts_generated", {
    projectId,
    operation: "generate_scripts",
    provider: ai.name,
    status: "ok",
    durationMs: Date.now() - start,
  });

  return created;
}
