import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const email = "demo@ugccloner.dev";
  const passwordHash = await bcrypt.hash("password123", 10);

  const user = await db.user.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash, name: "Demo Creator" },
  });

  const avatar = await db.avatar.upsert({
    where: { id: "seed-avatar-demo" },
    update: {},
    create: {
      id: "seed-avatar-demo",
      userId: user.id,
      name: "My AI Clone",
      description: "Approved AI clone for demo UGC content.",
      voiceProvider: "elevenlabs",
      voiceId: "demo-voice-01",
      defaultWardrobe: "Casual t-shirt, neutral colors",
      defaultEnvironment: "Bright modern home office, plant in background",
      performanceStyle: "High energy, direct eye contact, frequent hand gestures, short punchy sentences",
      personality: "Friendly, confident, conversational",
      cameraPreferences: "Handheld, eye-level, occasional punch-ins on key claims",
      negativeConstraints:
        "different person\ndifferent face\naltered identity\nrandom influencer\nstock actor\ncelebrity likeness",
      identityConsistency: "LIMITED",
    },
  });

  await db.avatarReference.upsert({
    where: { id: "seed-avatar-ref-demo" },
    update: {},
    create: {
      id: "seed-avatar-ref-demo",
      avatarId: avatar.id,
      type: "FACE_IMAGE",
      storageKey: "seed/avatar-face-placeholder.txt",
      url: null,
    },
  });

  const frameworks = [
    {
      id: "seed-framework-1",
      name: "I Didn't Expect This",
      hookType: "Curiosity",
      structure: ["Pattern interrupt", "Problem", "Product discovery", "Demonstration", "Result", "CTA"],
      pacing: "fast",
      visualStrategy: "talking head + product close-up cutaways",
      platform: "TIKTOK",
      category: "SaaS",
      notes: "Seeded example framework for the demo library.",
    },
    {
      id: "seed-framework-2",
      name: "Stop Doing X",
      hookType: "Contrarian",
      structure: ["Pattern interrupt", "Common mistake", "Better solution", "Demonstration", "Result", "CTA"],
      pacing: "fast",
      visualStrategy: "direct address + screen recording demo",
      platform: "SHORTS",
      category: "Productivity tools",
      notes: "Seeded example framework for the demo library.",
    },
    {
      id: "seed-framework-3",
      name: "I Tried It",
      hookType: "Demonstration",
      structure: ["Claim", "Experiment", "Live demonstration", "Reaction", "Result", "Recommendation/CTA"],
      pacing: "moderate",
      visualStrategy: "first-person POV demo with reaction cutaways",
      platform: "REELS",
      category: "Consumer apps",
      notes: "Seeded example framework for the demo library.",
    },
  ];

  for (const f of frameworks) {
    await db.viralFramework.upsert({
      where: { id: f.id },
      update: {},
      create: { ...f, userId: user.id, adaptable: true },
    });
  }

  const project = await db.project.upsert({
    where: { id: "seed-project-demo" },
    update: {},
    create: {
      id: "seed-project-demo",
      userId: user.id,
      name: "Replit UGC clone (demo)",
      product: "Replit",
      productUrl: "https://replit.com",
      platform: "TIKTOK",
      duration: 30,
      campaignGoal: "Drive free-trial signups",
      avatarId: avatar.id,
      status: "CREATED",
    },
  });

  console.log("Seeded:");
  console.log(`  user:      ${user.email} / password123`);
  console.log(`  avatar:    ${avatar.name} (${avatar.id})`);
  console.log(`  frameworks: ${frameworks.length}`);
  console.log(`  project:   ${project.name} (${project.id}) — upload a reference video to it to try the full pipeline`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
