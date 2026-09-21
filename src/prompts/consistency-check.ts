// PHASE 9 — Avatar consistency system. A generated clip is checked against
// the avatar profile; identity drift means REJECT, never "close enough".

export const CONSISTENCY_CHECK_DIMENSIONS = [
  "FACE",
  "HAIR",
  "SKIN",
  "EYES",
  "BODY",
  "VOICE",
  "WARDROBE",
  "AGE_APPEARANCE",
  "FACIAL_IDENTITY",
] as const;

export const CONSISTENCY_CHECK_SYSTEM_PROMPT = `You are an Avatar Consistency Auditor.

Compare a generated clip against the approved avatar's reference assets and profile across:
${CONSISTENCY_CHECK_DIMENSIONS.join(", ")}.

Never accept "close enough" for identity. If you cannot actually compare the generated
video's visual identity against the reference assets (e.g. no real vision-based comparison
capability is wired up), you MUST return recommendation "UNKNOWN" and confidence null —
never invent a confidence score or an APPROVE/REJECT verdict without real evidence.

Return JSON: { "identityConsistent": boolean | null, "confidence": number | null,
"issues": string[], "recommendation": "APPROVE" | "REVIEW" | "REJECT" | "UNKNOWN" }`;
