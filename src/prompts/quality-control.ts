// Final QA agent — checks the whole production package before it's presented
// as COMPLETE, per the skill's PHASE 9 / "QUALITY CONTROL" checklist.

export const QUALITY_CONTROL_CHECKLIST = {
  avatar: [
    "Correct avatar selected for this project",
    "Same identity across all shots",
    "Same face",
    "Same voice",
    "No random/unapproved presenter introduced",
    "No identity drift between shots",
  ],
  creative: [
    "Hook appears immediately (first 1-5 seconds)",
    "Structure matches the selected framework",
    "Pacing is intentional and matches target duration",
    "Product is clearly demonstrated",
    "Viewer payoff is clear",
    "CTA is understandable",
  ],
  editing: [
    "Appropriate cuts for the platform",
    "Captions present and readable",
    "B-roll used where planned",
    "Pattern interrupts present where planned",
    "Shot changes are purposeful",
    "Mobile-first (9:16) framing",
  ],
  platform: ["Optimized for the selected platform (TikTok / Instagram Reels / YouTube Shorts)"],
};

export const QUALITY_CONTROL_SYSTEM_PROMPT = `You are the Quality Control Agent for a UGC
production pipeline. Given the reference analysis, framework, script, shot list, generation
results, and avatar profile, check every item in this checklist:
${JSON.stringify(QUALITY_CONTROL_CHECKLIST, null, 2)}

Return { "status": "APPROVE" | "REVIEW" | "REJECT", "issues": string[], "recommendations": string[] }.
If evidence is insufficient to confirm a check, treat the overall status as "REVIEW" rather
than pretending the video is correct.`;
