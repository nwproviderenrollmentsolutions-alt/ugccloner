import { db } from "@/lib/db";
import { getAIProvider } from "@/providers/ai";
import { loadAvatarLockProfile } from "./avatar.service";
import { buildShotGenerationPrompt } from "@/prompts/shot-generation";
import type { ScriptVersion } from "@/types/pipeline";
import { logger } from "@/lib/logger";

export class ScriptNotFoundError extends Error {
  constructor() {
    super("Script not found for this project.");
    this.name = "ScriptNotFoundError";
  }
}

export async function generateShotsForScript(projectId: string, scriptId: string) {
  const project = await db.project.findUniqueOrThrow({ where: { id: projectId } });
  const script = await db.script.findFirst({ where: { id: scriptId, projectId } });
  if (!script) throw new ScriptNotFoundError();

  const avatar = await loadAvatarLockProfile(project.avatarId);

  await db.script.updateMany({ where: { projectId }, data: { status: "DRAFT" } });
  await db.script.update({ where: { id: scriptId }, data: { status: "APPROVED" } });

  const ai = getAIProvider();
  const start = Date.now();
  const scriptVersion: ScriptVersion = {
    version: script.version,
    label: script.label,
    hookType: script.hookType as ScriptVersion["hookType"],
    durationSeconds: script.durationSeconds,
    content: script.content as unknown as ScriptVersion["content"],
  };
  const drafts = await ai.generateShots({ script: scriptVersion, avatar, platform: project.platform });

  // Regenerating the shot list for this project replaces the previous one.
  await db.shot.deleteMany({ where: { projectId } });

  const created = await Promise.all(
    drafts.map((d) =>
      db.shot.create({
        data: {
          projectId,
          scriptId,
          shotNumber: d.shotNumber,
          durationSeconds: d.durationSeconds,
          dialogue: d.dialogue,
          visual: d.visual,
          camera: d.camera,
          framing: d.framing,
          avatarAction: d.avatarAction,
          facialExpression: d.facialExpression,
          gesture: d.gesture,
          background: d.background,
          bRoll: d.bRoll,
          onScreenText: d.onScreenText,
          caption: d.caption,
          transition: d.transition,
          sound: d.sound,
          generationPrompt: buildShotGenerationPrompt(d, avatar),
          status: "PENDING",
        },
      })
    )
  );

  await db.project.update({ where: { id: projectId }, data: { status: "SHOTS_READY" } });

  logger.info("shots_generated", {
    projectId,
    scriptId,
    operation: "generate_shots",
    provider: ai.name,
    status: "ok",
    durationMs: Date.now() - start,
    count: created.length,
  });

  return created;
}
