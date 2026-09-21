import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { startProjectGeneration } from "@/services/generation.service";
import { AvatarRequiredError } from "@/services/avatar.service";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const project = await db.project.findFirst({ where: { id, userId: user.id } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const generations = await startProjectGeneration(id);
    return NextResponse.json({ generations });
  } catch (error) {
    const status = error instanceof AvatarRequiredError ? 422 : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Generation failed to start" }, { status });
  }
}
