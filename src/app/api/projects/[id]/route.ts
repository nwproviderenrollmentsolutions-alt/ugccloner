import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const project = await db.project.findFirst({
    where: { id, userId: user.id },
    include: {
      avatar: true,
      referenceVideos: true,
      analyses: true,
      researchJobs: { include: { viralVideos: true } },
      viralVideos: true,
      blueprint: { include: { framework: true } },
      scripts: { include: { shots: true } },
      shots: { include: { generations: { include: { assets: true, consistencyChecks: true } } } },
      generations: { include: { assets: true, consistencyChecks: true } },
      finalAssets: true,
    },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ project });
}
