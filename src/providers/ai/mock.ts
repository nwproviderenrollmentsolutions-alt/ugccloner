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

// MOCK_AI — deterministic, clearly-labeled fake reasoning output so the full
// pipeline can be exercised with zero API cost. Every method here is
// intentionally template-driven, not random guessing dressed up as analysis.

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export class MockAIProvider implements AIProvider {
  readonly name = "MOCK_AI";
  readonly isMock = true;

  async analyzeVideo(input: VideoAnalysisInput): Promise<VideoAnalysisResult> {
    const duration = input.durationSeconds ?? 24;
    const hookEnd = clamp(duration * 0.12, 1.5, 4);
    const problemEnd = clamp(duration * 0.35, hookEnd + 1, duration * 0.5);
    const demoEnd = clamp(duration * 0.75, problemEnd + 1, duration * 0.9);
    const ctaStart = clamp(duration - 3, demoEnd, duration - 1);

    return {
      hook: {
        spokenHook: "Wait — I did not expect this to actually work.",
        visualHook: "Presenter in close-up, holding the product up to camera on the first frame.",
        firstFrameComposition: "Medium close-up, presenter centered, product partially visible in frame.",
        patternInterrupt: "Sudden zoom-in on the presenter's face with a surprised expression.",
        curiosityMechanism: "Implies an unexpected result without revealing it.",
        problem: "A common frustration the target audience recognizes immediately.",
        promise: "A faster, easier way to solve that frustration.",
        emotionalTrigger: "Surprise / disbelief",
        whyItStopsScroll: "Direct eye contact plus an incomplete claim creates an information gap.",
        category: "Curiosity",
      },
      timeline: [
        {
          start: 0,
          end: hookEnd,
          durationSeconds: Math.round((hookEnd - 0) * 10) / 10,
          label: "hook",
          shotType: "talking head",
          cameraAngle: "eye-level, handheld",
          subjectAction: "speaks directly to camera, holds product",
          dialogue: "Wait — I did not expect this to actually work.",
          visualElements: "presenter + product",
          onScreenText: "WAIT FOR IT",
          audio: "voice, no music yet",
          transition: "hard cut",
        },
        {
          start: hookEnd,
          end: problemEnd,
          durationSeconds: Math.round((problemEnd - hookEnd) * 10) / 10,
          label: "problem",
          shotType: "talking head",
          cameraAngle: "eye-level",
          subjectAction: "explains the frustration",
          dialogue: "I was so tired of doing this the slow way.",
          visualElements: "presenter, subtle gesture",
          onScreenText: null,
          audio: "voice, light background music fades in",
          transition: "jump cut",
        },
        {
          start: problemEnd,
          end: demoEnd,
          durationSeconds: Math.round((demoEnd - problemEnd) * 10) / 10,
          label: "demonstration",
          shotType: "b-roll + talking head cutaways",
          cameraAngle: "over-the-shoulder / product close-up",
          subjectAction: "demonstrates the product in use",
          dialogue: "So I tried this instead, and look what happened.",
          visualElements: "product in use, screen capture or close-up demo",
          onScreenText: "THE RESULT",
          audio: "voice + music",
          transition: "quick cut / speed ramp",
        },
        {
          start: demoEnd,
          end: ctaStart,
          durationSeconds: Math.round((ctaStart - demoEnd) * 10) / 10,
          label: "payoff",
          shotType: "talking head",
          cameraAngle: "eye-level, slight punch-in",
          subjectAction: "reacts to the result, restates the benefit",
          dialogue: "Honestly, this changed how I do this completely.",
          visualElements: "presenter, expressive reaction",
          onScreenText: null,
          audio: "voice + music swell",
          transition: "cut",
        },
        {
          start: ctaStart,
          end: duration,
          durationSeconds: Math.round((duration - ctaStart) * 10) / 10,
          label: "cta",
          shotType: "talking head",
          cameraAngle: "eye-level",
          subjectAction: "tells viewer what to do next, points at on-screen text",
          dialogue: "Link's in my bio — go try it.",
          visualElements: "presenter + on-screen CTA text",
          onScreenText: "TRY IT — LINK IN BIO",
          audio: "voice, music tail",
          transition: "end card",
        },
      ],
      performance: {
        energy: "high",
        speakingSpeed: "fast (~3.2 words/sec)",
        sentenceLength: "short, punchy",
        pauseFrequency: "micro-pauses before key claims",
        gestureFrequency: "frequent hand gestures on emphasis words",
        facialExpressionFrequency: "high — visible reaction changes every 2-3 seconds",
        eyeContact: "direct to camera throughout",
        cameraEngagement: "consistently addresses the lens, minimal look-away",
        emotionalProgression: "curiosity -> frustration -> surprise -> confidence -> urgency",
        confidenceLevel: "high",
        conversationalStyle: "casual, first-person, like talking to a friend",
        reusableFrameworkSummary:
          "High-energy, fast delivery, direct eye contact, frequent hand gestures, short sentences, micro-pauses before claims, strong facial emphasis.",
      },
      editing: {
        cuts: 9,
        jumpCuts: 3,
        zoomIns: 2,
        zoomOuts: 0,
        bRollCount: 2,
        captionsPresent: true,
        textOverlays: 3,
        transitions: ["hard cut", "jump cut", "speed ramp", "end card"],
        soundEffects: ["whoosh on pattern interrupt", "subtle click on text pop-in"],
        music: "upbeat lo-fi background track, low volume under dialogue",
        patternInterrupts: 1,
        cutsPerMinute: Math.round((9 / duration) * 60 * 10) / 10,
        averageShotLengthSeconds: Math.round((duration / 5) * 10) / 10,
        hookLengthSeconds: Math.round(hookEnd * 10) / 10,
        ctaLengthSeconds: Math.round((duration - ctaStart) * 10) / 10,
        bRollPercentage: Math.round(((demoEnd - problemEnd) / duration) * 100),
        talkingHeadPercentage: Math.round((1 - (demoEnd - problemEnd) / duration) * 100),
      },
      cta: {
        present: true,
        action: "Follow the link in bio to try the product",
        delivery: "direct verbal ask + on-screen text reinforcement",
        timestampStart: Math.round(ctaStart * 10) / 10,
      },
    };
  }

  async extractFramework(input: FrameworkExtractionInput): Promise<FrameworkResult> {
    const first = input.analyses[0];
    const hookType = first?.hook.category ?? "Curiosity";
    return {
      name: `${hookType} → Problem → Demo → Result → CTA`,
      hookType,
      structure: ["Pattern interrupt", "Problem", "Product discovery", "Demonstration", "Result", "CTA"],
      pacing: "fast",
      visualStrategy: "talking head + product close-up/screen demo cutaways",
      adaptable: true,
      scoring: {
        hookStrength: "HIGH",
        clarity: "HIGH",
        curiosity: "HIGH",
        demonstrationStrength: "MEDIUM",
        visualChangeFrequency: "HIGH",
        pacing: "HIGH",
        productVisibility: "MEDIUM",
        ctaClarity: "HIGH",
        formatReusability: "HIGH",
        evidence: {
          hookStrength: "Hook lands an unresolved claim within the first 2 seconds across analyzed videos.",
          demonstrationStrength: "Demo segment present but proportionally shorter than talking-head time.",
        },
      },
    };
  }

  async generateBlueprint(input: BlueprintInput): Promise<BlueprintResult> {
    return {
      campaignObjective: input.campaignGoal || `Drive trial/signups for ${input.product}`,
      targetAudience: `People actively frustrated by the problem ${input.product} solves, active on ${input.platform}`,
      hookStrategy: {
        approach: `Open on an unresolved claim about ${input.product} in the ${input.framework.hookType} style`,
        adaptedFrom: input.referenceHook,
      },
      storyStructure: { beats: input.framework.structure },
      visualStrategy: {
        camera: "handheld, eye-level, occasional punch-in on key claims",
        bRoll: `Close-up / screen-capture demonstration of ${input.product} in real use`,
        text: "Short caption keywords timed to spoken emphasis words",
        editing: "fast cuts, one pattern interrupt near the hook, jump cuts through the demo",
      },
      performanceStrategy: {
        direction:
          "High energy, direct eye contact, frequent gestures, short punchy sentences, confident delivery — match the avatar's configured performance style",
      },
      bRollStrategy: { plan: `2 short cutaways showing ${input.product} solving the stated problem` },
      editingStrategy: { plan: "9-12 cuts, hook <=3s, CTA in final 2-3s, captions on throughout" },
      ctaStrategy: { action: `Try ${input.product}`, delivery: "verbal ask + on-screen text in final shot" },
    };
  }

  async generateScripts(input: ScriptInput): Promise<ScriptVersion[]> {
    const hookVariants: { label: string; hookType: ScriptVersion["hookType"]; line: string }[] = [
      { label: "Curiosity hook", hookType: "Curiosity", line: `Wait, I didn't think ${input.product} would actually do this...` },
      { label: "Problem hook", hookType: "Problem", line: `If you're still doing this the slow way, you need to see this.` },
      { label: "Demonstration hook", hookType: "Demonstration", line: `Watch what happens when I try ${input.product} for the first time.` },
    ];

    const versions = hookVariants.slice(0, Math.max(1, input.versionCount)).map((variant, i) => {
      const letter = String.fromCharCode(65 + i);
      const segs = [
        { beat: "hook", line: variant.line, approxSeconds: Math.round(input.durationSeconds * 0.12) },
        {
          beat: "problem",
          line: `I used to struggle with this every single day, until I found ${input.product}.`,
          approxSeconds: Math.round(input.durationSeconds * 0.22),
        },
        {
          beat: "demo",
          line: `Here's exactly how it works — you just ${input.product} does the rest.`,
          approxSeconds: Math.round(input.durationSeconds * 0.34),
        },
        {
          beat: "payoff",
          line: `Honestly, this saved me so much time I couldn't believe it.`,
          approxSeconds: Math.round(input.durationSeconds * 0.18),
        },
        {
          beat: "cta",
          line: `Link's in my bio — go try ${input.product} for yourself.`,
          approxSeconds: Math.round(input.durationSeconds * 0.14),
        },
      ];
      return {
        version: letter,
        label: variant.label,
        hookType: variant.hookType,
        durationSeconds: input.durationSeconds,
        content: segs,
      } satisfies ScriptVersion;
    });

    return versions;
  }

  async generateShots(input: ShotGenerationInput): Promise<ShotDraftResult[]> {
    const beatToShot: Record<string, Partial<ShotDraftResult>> = {
      hook: { camera: "handheld, eye-level, slight punch-in", framing: "medium close-up", avatarAction: "looks directly into camera, holds product up", facialExpression: "surprised, energetic", gesture: "raises product toward lens" },
      problem: { camera: "handheld, eye-level", framing: "medium shot", avatarAction: "speaks conversationally, subtle head tilt", facialExpression: "empathetic, slightly frustrated", gesture: "open-hand gesture" },
      demo: { camera: "over-the-shoulder / insert close-up", framing: "close-up on product/action", avatarAction: "demonstrates the product in use", facialExpression: "focused", gesture: "hands actively using the product" },
      payoff: { camera: "eye-level, slow punch-in", framing: "medium close-up", avatarAction: "reacts, nods, smiles", facialExpression: "genuinely impressed", gesture: "hand on chest / thumbs up" },
      cta: { camera: "eye-level, static", framing: "medium shot", avatarAction: "points toward on-screen text", facialExpression: "confident, warm smile", gesture: "points off-frame toward CTA text" },
    };

    return input.script.content.map((beat, i) => {
      const preset = beatToShot[beat.beat] ?? beatToShot.hook;
      return {
        shotNumber: i + 1,
        durationSeconds: beat.approxSeconds,
        dialogue: beat.line,
        visual: `${beat.beat.toUpperCase()} beat — ${preset.avatarAction}`,
        camera: preset.camera!,
        framing: preset.framing!,
        avatarAction: preset.avatarAction!,
        facialExpression: preset.facialExpression!,
        gesture: preset.gesture,
        background: input.avatar.defaultEnvironment || "clean, bright indoor setting consistent with the avatar profile",
        bRoll: beat.beat === "demo" ? "Insert close-up of the product/result" : undefined,
        onScreenText: beat.beat === "hook" ? "WAIT FOR IT" : beat.beat === "cta" ? "TRY IT — LINK IN BIO" : undefined,
        caption: beat.line,
        transition: i === 0 ? "hard cut in" : beat.beat === "demo" ? "quick cut" : "cut",
        sound: beat.beat === "hook" ? "whoosh SFX on pattern interrupt" : "light background music",
      } satisfies ShotDraftResult;
    });
  }

  async checkAvatarConsistency(_input: ConsistencyCheckInput): Promise<ConsistencyResult> {
    // Deliberately honest: this mock has no real vision-based identity
    // comparison capability, so it never invents a confidence score.
    return {
      identityConsistent: null,
      confidence: null,
      issues: [
        "MOCK_AI has no real vision-based identity comparison capability wired up — this is a placeholder result, not a real consistency check.",
      ],
      recommendation: "UNKNOWN",
      method: "MOCK_AI (unsupported)",
    };
  }

  async runQualityControl(input: QualityControlInput): Promise<QualityControlResult> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (input.generatedCount < input.shotCount) {
      issues.push(`${input.shotCount - input.generatedCount} of ${input.shotCount} shots have not finished generating.`);
    }
    if (input.consistencyIssues.length > 0) {
      issues.push(...input.consistencyIssues);
      recommendations.push("Run a real avatar-consistency check before publishing — identity could not be verified.");
    }
    if (!input.analysis) issues.push("No reference video analysis found for this project.");
    if (!input.framework) issues.push("No viral framework attached to this project.");
    if (!input.script) issues.push("No approved script found for this project.");

    const status: QualityControlResult["status"] =
      issues.length === 0 ? "APPROVE" : input.generatedCount === 0 ? "REJECT" : "REVIEW";

    if (status !== "APPROVE" && recommendations.length === 0) {
      recommendations.push("Resolve the listed issues, then re-run quality control before final export.");
    }

    return { status, issues, recommendations };
  }
}
