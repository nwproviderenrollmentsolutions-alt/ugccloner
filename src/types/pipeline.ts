// Shared structured shapes produced/consumed across the pipeline. These are
// the JSON contracts providers must satisfy (real or mock).

export interface HookAnalysis {
  spokenHook: string | null;
  visualHook: string;
  firstFrameComposition: string;
  patternInterrupt: string | null;
  curiosityMechanism: string | null;
  problem: string | null;
  promise: string | null;
  emotionalTrigger: string | null;
  whyItStopsScroll: string;
  category:
    | "Curiosity"
    | "Shock"
    | "Contrarian"
    | "Problem"
    | "Transformation"
    | "Demonstration"
    | "Confession"
    | "Story"
    | "Question"
    | "Unexpected result"
    | "Before/After"
    | "Secret"
    | "List"
    | "Challenge";
}

export interface TimelineSegment {
  start: number;
  end: number;
  durationSeconds: number;
  label: string; // hook | problem | demonstration | payoff | cta | ...
  shotType: string;
  cameraAngle: string;
  subjectAction: string;
  dialogue: string | null;
  visualElements: string;
  onScreenText: string | null;
  audio: string;
  transition: string | null;
}

export interface PerformanceAnalysis {
  energy: string;
  speakingSpeed: string;
  sentenceLength: string;
  pauseFrequency: string;
  gestureFrequency: string;
  facialExpressionFrequency: string;
  eyeContact: string;
  cameraEngagement: string;
  emotionalProgression: string;
  confidenceLevel: string;
  conversationalStyle: string;
  reusableFrameworkSummary: string;
}

export interface EditingAnalysis {
  cuts: number | "UNKNOWN";
  jumpCuts: number | "UNKNOWN";
  zoomIns: number | "UNKNOWN";
  zoomOuts: number | "UNKNOWN";
  bRollCount: number | "UNKNOWN";
  captionsPresent: boolean | "UNKNOWN";
  textOverlays: number | "UNKNOWN";
  transitions: string[];
  soundEffects: string[];
  music: string | "UNKNOWN";
  patternInterrupts: number | "UNKNOWN";
  cutsPerMinute: number | "UNKNOWN";
  averageShotLengthSeconds: number | "UNKNOWN";
  hookLengthSeconds: number | "UNKNOWN";
  ctaLengthSeconds: number | "UNKNOWN";
  bRollPercentage: number | "UNKNOWN";
  talkingHeadPercentage: number | "UNKNOWN";
}

export interface CTAAnalysis {
  present: boolean;
  action: string | null;
  delivery: string | null;
  timestampStart: number | "UNKNOWN";
}

export interface VideoAnalysisResult {
  hook: HookAnalysis;
  timeline: TimelineSegment[];
  performance: PerformanceAnalysis;
  editing: EditingAnalysis;
  cta: CTAAnalysis;
}

export type ScoreLevel = "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";

export interface CreativeScoring {
  hookStrength: ScoreLevel;
  clarity: ScoreLevel;
  curiosity: ScoreLevel;
  demonstrationStrength: ScoreLevel;
  visualChangeFrequency: ScoreLevel;
  pacing: ScoreLevel;
  productVisibility: ScoreLevel;
  ctaClarity: ScoreLevel;
  formatReusability: ScoreLevel;
  evidence: Record<string, string>;
}

export interface FrameworkResult {
  name: string;
  hookType: HookAnalysis["category"];
  structure: string[];
  pacing: "fast" | "moderate" | "slow";
  visualStrategy: string;
  adaptable: boolean;
  scoring?: CreativeScoring;
}

export interface BlueprintResult {
  campaignObjective: string;
  targetAudience: string;
  hookStrategy: { approach: string; adaptedFrom: string };
  storyStructure: { beats: string[] };
  visualStrategy: { camera: string; bRoll: string; text: string; editing: string };
  performanceStrategy: { direction: string };
  bRollStrategy: { plan: string };
  editingStrategy: { plan: string };
  ctaStrategy: { action: string; delivery: string };
}

export interface ScriptBeat {
  beat: string;
  line: string;
  approxSeconds: number;
}

export interface ScriptVersion {
  version: string;
  label: string;
  hookType: HookAnalysis["category"];
  durationSeconds: number;
  content: ScriptBeat[];
}

export interface ShotDraftResult {
  shotNumber: number;
  durationSeconds: number;
  dialogue?: string;
  visual: string;
  camera: string;
  framing: string;
  avatarAction: string;
  facialExpression: string;
  gesture?: string;
  background: string;
  bRoll?: string;
  onScreenText?: string;
  caption?: string;
  transition?: string;
  sound?: string;
}

export interface ConsistencyResult {
  identityConsistent: boolean | null;
  confidence: number | null;
  issues: string[];
  recommendation: "APPROVE" | "REVIEW" | "REJECT" | "UNKNOWN";
  method: string;
}

export interface QualityControlResult {
  status: "APPROVE" | "REVIEW" | "REJECT";
  issues: string[];
  recommendations: string[];
}
