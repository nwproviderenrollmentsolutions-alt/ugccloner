import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { logger } from "@/lib/logger";

const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  voiceProvider: z.string().optional(),
  voiceId: z.string().optional(),
  defaultWardrobe: z.string().optional(),
  defaultEnvironment: z.string().optional(),
  performanceStyle: z.string().optional(),
  personality: z.string().optional(),
  cameraPreferences: z.string().optional(),
  negativeConstraints: z.string().optional(),
});

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const avatars = await db.avatar.findMany({
    where: { userId: user.id },
    include: { references: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ avatars });
}

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const avatar = await db.avatar.create({
    data: { userId: user.id, ...parsed.data, identityConsistency: "LIMITED" },
  });

  logger.info("avatar_created", { userId: user.id, operation: "create_avatar", status: "ok" });
  return NextResponse.json({ avatar });
}
