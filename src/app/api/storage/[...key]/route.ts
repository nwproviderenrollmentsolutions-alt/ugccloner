import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStorageProvider } from "@/providers/storage";

export const runtime = "nodejs";

const CONTENT_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
};

/**
 * Serves locally-stored files. Every private avatar/project asset stays
 * behind session auth (see middleware.ts — this path is deliberately NOT
 * whitelisted as public) and is additionally checked against ownership here,
 * so one signed-in user can never fetch another user's storage key by
 * guessing it.
 */
async function isOwnedByUser(storageKey: string, userId: string): Promise<boolean> {
  const [avatarRef, refVideo, asset] = await Promise.all([
    db.avatarReference.findFirst({ where: { storageKey }, include: { avatar: true } }),
    db.referenceVideo.findFirst({ where: { storageKey }, include: { project: true } }),
    db.generatedAsset.findFirst({ where: { storageKey }, include: { project: true } }),
  ]);
  if (avatarRef) return avatarRef.avatar.userId === userId;
  if (refVideo) return refVideo.project.userId === userId;
  if (asset) return asset.project.userId === userId;
  return false;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ key: string[] }> }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { key } = await params;
  const storageKey = key.join("/");

  if (!(await isOwnedByUser(storageKey, user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const storage = getStorageProvider();
  const localPath = storage.getLocalPath?.(storageKey);
  if (!localPath) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const data = await fs.readFile(localPath);
    const ext = path.extname(localPath).toLowerCase();
    return new NextResponse(data as unknown as BodyInit, {
      headers: {
        "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
