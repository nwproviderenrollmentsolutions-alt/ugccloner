import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PLATFORMS } from "@/types/enums";
import { logger } from "@/lib/logger";

const schema = z.object({
  name: z.string().min(1),
  product: z.string().min(1),
  productUrl: z.string().url().optional().or(z.literal("")),
  platform: z.enum(PLATFORMS),
  duration: z.number().int().min(5).max(180),
  campaignGoal: z.string().optional(),
  avatarId: z.string().optional(),
});

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projects = await db.project.findMany({
    where: { userId: user.id },
    include: { avatar: true, referenceVideos: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { productUrl, ...rest } = parsed.data;
  const project = await db.project.create({
    data: { userId: user.id, ...rest, productUrl: productUrl || null, status: "CREATED" },
  });

  logger.info("project_created", { userId: user.id, projectId: project.id, operation: "create_project", status: "ok" });
  return NextResponse.json({ project });
}
