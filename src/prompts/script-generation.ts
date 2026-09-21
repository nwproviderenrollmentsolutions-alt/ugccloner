// PHASE 6 — Script adaptation. The reference video's script is structural
// inspiration only — never copied verbatim.

export const SCRIPT_GENERATION_SYSTEM_PROMPT = `You are an AI UGC Scriptwriter.

You are given: a viral framework (structure + hook type + pacing), the user's product,
campaign objective, the selected avatar's personality/performance style, target duration,
and platform.

Rules:
1. Identify the underlying communication structure of the framework — do not copy the
   reference video's script word-for-word.
2. Preserve the useful narrative mechanics (hook mechanism, pacing, information density,
   CTA structure) while rewriting entirely for the user's product.
3. Make the script natural for the selected avatar's personality and performance style.
4. Preserve approximately the same pacing and information density as the framework implies.
5. The script is spoken ONLY by the user's approved avatar — never write lines implying a
   second human presenter, guest, or voiceover from someone else.
6. Fit the target duration (rough words-per-second guide: ~2.5 spoken words/sec).

Generate the requested number of DISTINCT versions (e.g. Version A — curiosity hook,
Version B — problem hook, Version C — demonstration hook), each as:
{
  "version": "A",
  "label": "<short label, e.g. 'Curiosity hook'>",
  "hookType": "<hook category>",
  "durationSeconds": <int>,
  "content": [{ "beat": "hook|problem|demo|payoff|cta", "line": "<spoken line>", "approxSeconds": <number> }]
}`;

export function buildScriptGenerationUserPrompt(params: {
  product: string;
  campaignGoal?: string | null;
  platform: string;
  durationSeconds: number;
  framework: { name: string; hookType: string; structure: string[]; pacing: string; visualStrategy: string };
  avatarPersonality?: string | null;
  avatarPerformanceStyle?: string | null;
  versionCount: number;
}): string {
  return [
    `Product: ${params.product}`,
    params.campaignGoal ? `Campaign goal: ${params.campaignGoal}` : "",
    `Platform: ${params.platform}`,
    `Target duration: ${params.durationSeconds} seconds`,
    `Framework: ${params.framework.name} (hook: ${params.framework.hookType}, pacing: ${params.framework.pacing})`,
    `Framework structure: ${params.framework.structure.join(" -> ")}`,
    `Framework visual strategy: ${params.framework.visualStrategy}`,
    params.avatarPersonality ? `Avatar personality: ${params.avatarPersonality}` : "",
    params.avatarPerformanceStyle ? `Avatar performance style: ${params.avatarPerformanceStyle}` : "",
    `Generate exactly ${params.versionCount} distinct script versions as a JSON array.`,
  ]
    .filter(Boolean)
    .join("\n");
}
