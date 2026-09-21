import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { syncProjectGenerations } from "@/services/generation.service";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const owned = await db.project.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Every status poll also advances any in-flight generation jobs — this is
  // the app's "live job status" mechanism (see README) in lieu of a
  // separate background worker process.
  await syncProjectGenerations(id).catch(() => {});

  const project = await db.project.findFirst({
    where: { id, userId: user.id },
    select: {
      status: true,
      errorMessage: true,
      shots: { select: { id: true, status: true } },
      generations: { select: { id: true, status: true, isMock: true } },
    },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const shotTotal = project.shots.length;
  const shotGenerated = project.shots.filter((s) => s.status === "GENERATED" || s.status === "APPROVED").length;
  const generationsProcessing = project.generations.filter((g) => g.status === "PROCESSING" || g.status === "QUEUED").length;

  return NextResponse.json({
    status: project.status,
    errorMessage: project.errorMessage,
    shots: { total: shotTotal, generated: shotGenerated },
    generationsProcessing,
  });
}
