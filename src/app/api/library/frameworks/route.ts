import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const platform = req.nextUrl.searchParams.get("platform");
  const hookType = req.nextUrl.searchParams.get("hookType");

  const frameworks = await db.viralFramework.findMany({
    where: {
      userId: user.id,
      ...(platform ? { platform } : {}),
      ...(hookType ? { hookType } : {}),
    },
    include: { sourceVideo: true },
    orderBy: { dateAnalyzed: "desc" },
  });

  return NextResponse.json({ frameworks });
}
