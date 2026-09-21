import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateShotsForScript } from "@/services/shot.service";
import { AvatarRequiredError } from "@/services/avatar.service";

const schema = z.object({ scriptId: z.string() });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const project = await db.project.findFirst({ where: { id, userId: user.id } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "scriptId is required" }, { status: 400 });

  try {
    const shots = await generateShotsForScript(id, parsed.data.scriptId);
    return NextResponse.json({ shots });
  } catch (error) {
    const status = error instanceof AvatarRequiredError ? 422 : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Shot generation failed" }, { status });
  }
}
