import { db } from "@/lib/db";
import { getAIProvider } from "@/providers/ai";
import { loadAvatarLockProfile } from "./avatar.service";
import { logger } from "@/lib/logger";
import { toJson } from "@/lib/json";

/**
 * Checks a completed generation's identity consistency against the locked
 * avatar profile. Never accepts "close enough" — a REJECT recommendation
 * marks the shot REJECTED so it must be regenerated; an honest UNKNOWN
 * (no real comparison capability wired up) routes it to human REVIEW rather
 * than silently approving it.
 */
export async function checkGenerationConsistency(generationId: string) {
  const generation = await db.generation.findUniqueOrThrow({
    where: { id: generationId },
    include: { assets: true, shot: true, project: true },
  });
  const asset = generation.assets[0];
  if (!asset) throw new Error("Generation has no completed asset to check yet.");

  const avatar = await loadAvatarLockProfile(generation.project.avatarId);
  const ai = getAIProvider();
  const result = await ai.checkAvatarConsistency({ generatedVideoUrl: asset.url, avatar });

  const check = await db.avatarConsistencyCheck.create({
    data: {
      generationId,
      identityConsistent: result.identityConsistent,
      confidence: result.confidence,
      issues: toJson(result.issues),
      recommendation: result.recommendation,
      method: result.method,
    },
  });

  const shotStatus = result.recommendation === "REJECT" ? "REJECTED" : "GENERATED";
  await db.shot.update({ where: { id: generation.shotId }, data: { status: shotStatus } });

  logger.info("avatar_consistency_check", {
    projectId: generation.projectId,
    jobId: generationId,
    operation: "check_avatar_consistency",
    provider: ai.name,
    status: "ok",
    recommendation: result.recommendation,
  });

  return check;
}
