import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import {
  VIDEO_ANALYSIS_SYSTEM_PROMPT,
  buildVideoAnalysisUserPrompt,
} from "@/prompts/video-analysis";
import { FRAMEWORK_EXTRACTION_SYSTEM_PROMPT } from "@/prompts/framework-extraction";
import { SCRIPT_GENERATION_SYSTEM_PROMPT, buildScriptGenerationUserPrompt } from "@/prompts/script-generation";
import { SHOT_GENERATION_SYSTEM_PROMPT } from "@/prompts/shot-generation";
import { CONSISTENCY_CHECK_SYSTEM_PROMPT } from "@/prompts/consistency-check";
import { QUALITY_CONTROL_SYSTEM_PROMPT } from "@/prompts/quality-control";
import { avatarIdentityLockBlock } from "@/prompts/avatar-lock";
import type {
  BlueprintResult,
  ConsistencyResult,
  FrameworkResult,
  QualityControlResult,
  ScriptVersion,
  ShotDraftResult,
  VideoAnalysisResult,
} from "@/types/pipeline";
import type {
  AIProvider,
  BlueprintInput,
  ConsistencyCheckInput,
  FrameworkExtractionInput,
  QualityControlInput,
  ScriptInput,
  ShotGenerationInput,
  VideoAnalysisInput,
} from "./types";

/**
 * Real AI provider backed by the Anthropic API. Note on video: the Messages
 * API reasons over text (metadata + any transcript/frame descriptions passed
 * in), not raw video bytes — this adapter is honest about that limitation
 * rather than pretending to "watch" the file. A future VideoAnalysisProvider
 * (e.g. a vision-capable frame-sampling pipeline) can be swapped in via this
 * same AIProvider interface without touching callers.
 */
export class AnthropicAIProvider implements AIProvider {
  readonly name = "ANTHROPIC";
  readonly isMock = false;
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: env.anthropicApiKey });
  }

  private async callJSON<T>(system: string, user: string, operation: string): Promise<T> {
    const start = Date.now();
    try {
      const res = await this.client.messages.create({
        model: env.anthropicModel,
        max_tokens: 4096,
        system: `${system}\n\nRespond with ONLY valid JSON. No prose, no markdown fences.`,
        messages: [{ role: "user", content: user }],
      });
      const text = res.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      const jsonStart = Math.min(...[text.indexOf("{"), text.indexOf("[")].filter((i) => i >= 0));
      const jsonEnd = Math.max(text.lastIndexOf("}"), text.lastIndexOf("]"));
      const jsonText = jsonStart >= 0 && jsonEnd >= 0 ? text.slice(jsonStart, jsonEnd + 1) : text;
      const parsed = JSON.parse(jsonText) as T;
      logger.info("ai_provider_call", { provider: this.name, operation, status: "ok", durationMs: Date.now() - start });
      return parsed;
    } catch (error) {
      logger.error("ai_provider_call", {
        provider: this.name,
        operation,
        status: "error",
        durationMs: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  analyzeVideo(input: VideoAnalysisInput): Promise<VideoAnalysisResult> {
    return this.callJSON<VideoAnalysisResult>(
      VIDEO_ANALYSIS_SYSTEM_PROMPT,
      buildVideoAnalysisUserPrompt(input),
      "analyzeVideo"
    );
  }

  extractFramework(input: FrameworkExtractionInput): Promise<FrameworkResult> {
    return this.callJSON<FrameworkResult>(
      FRAMEWORK_EXTRACTION_SYSTEM_PROMPT,
      JSON.stringify(input, null, 2),
      "extractFramework"
    );
  }

  generateBlueprint(input: BlueprintInput): Promise<BlueprintResult> {
    return this.callJSON<BlueprintResult>(
      "You are a Creative Director producing a Creative Blueprint from a viral framework and a product.",
      JSON.stringify(input, null, 2),
      "generateBlueprint"
    );
  }

  async generateScripts(input: ScriptInput): Promise<ScriptVersion[]> {
    const result = await this.callJSON<ScriptVersion[] | { scripts: ScriptVersion[] }>(
      SCRIPT_GENERATION_SYSTEM_PROMPT,
      buildScriptGenerationUserPrompt({
        product: input.product,
        campaignGoal: input.campaignGoal,
        platform: input.platform,
        durationSeconds: input.durationSeconds,
        framework: input.framework,
        avatarPersonality: input.avatar.personality,
        avatarPerformanceStyle: input.avatar.performanceStyle,
        versionCount: input.versionCount,
      }),
      "generateScripts"
    );
    return Array.isArray(result) ? result : result.scripts;
  }

  async generateShots(input: ShotGenerationInput): Promise<ShotDraftResult[]> {
    const user = [
      `Script (${input.script.label}, ${input.script.durationSeconds}s):`,
      JSON.stringify(input.script.content, null, 2),
      "",
      "Avatar identity lock (must be respected in every shot's avatarAction/facialExpression/background):",
      avatarIdentityLockBlock(input.avatar),
      "",
      `Platform: ${input.platform}`,
      "Return a JSON array of shots, one per script beat (or split further if a beat needs multiple shots).",
    ].join("\n");
    const result = await this.callJSON<ShotDraftResult[] | { shots: ShotDraftResult[] }>(
      SHOT_GENERATION_SYSTEM_PROMPT,
      user,
      "generateShots"
    );
    return Array.isArray(result) ? result : result.shots;
  }

  checkAvatarConsistency(input: ConsistencyCheckInput): Promise<ConsistencyResult> {
    // Honest limitation: the Anthropic Messages API text path used here does
    // not perform real frame-by-frame visual identity comparison. Rather than
    // fabricate a confidence score, this returns UNKNOWN unless/until a real
    // vision-based comparison capability is wired in.
    return Promise.resolve({
      identityConsistent: null,
      confidence: null,
      issues: [
        "No vision-based identity comparison capability is configured for this AnthropicAIProvider instance — cannot verify identity from pixels.",
      ],
      recommendation: "UNKNOWN",
      method: "ANTHROPIC (text-only, unsupported for visual identity comparison)",
    });
  }

  runQualityControl(input: QualityControlInput): Promise<QualityControlResult> {
    return this.callJSON<QualityControlResult>(
      QUALITY_CONTROL_SYSTEM_PROMPT,
      JSON.stringify(input, null, 2),
      "runQualityControl"
    );
  }
}
