import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getStorageProvider } from "@/providers/storage";
import { probeVideo } from "@/lib/ffmpeg";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

const ALLOWED_MIME = new Set(["video/mp4", "video/quicktime", "video/webm", "video/x-m4v"]);
const MAX_BYTES = 500 * 1024 * 1024; // 500MB

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const project = await db.project.findFirst({ where: { id, userId: user.id } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Missing file" }, { status: 400 });

  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: `Unsupported file type: ${file.type}. Upload MP4, MOV, or WEBM.` }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: `File too large (${Math.round(file.size / 1024 / 1024)}MB). Max is 500MB.` }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // ffprobe needs a real file on disk — write to a tmp path first.
  const tmpPath = path.join(os.tmpdir(), `upload-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`);
  await fs.writeFile(tmpPath, buffer);
  const metadata = await probeVideo(tmpPath);
  await fs.unlink(tmpPath).catch(() => {});

  const storage = getStorageProvider();
  const key = `projects/${id}/reference/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const { url } = await storage.put(key, buffer, file.type);

  const referenceVideo = await db.referenceVideo.create({
    data: {
      projectId: id,
      storageKey: key,
      url,
      originalFilename: file.name,
      mimeType: file.type,
      fileSizeBytes: file.size,
      durationSeconds: metadata.durationSeconds,
      width: metadata.width,
      height: metadata.height,
      fps: metadata.fps,
      hasAudio: metadata.hasAudio,
      metadataStatus: metadata.status,
      status: "UPLOADED",
    },
  });

  await db.project.update({ where: { id }, data: { status: "UPLOADED" } });

  logger.info("video_uploaded", {
    userId: user.id,
    projectId: id,
    operation: "upload_reference_video",
    status: "ok",
    metadataStatus: metadata.status,
  });

  return NextResponse.json({ referenceVideo });
}
