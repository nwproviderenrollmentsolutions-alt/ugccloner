import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getStorageProvider } from "@/providers/storage";
import { getAvatarProvider } from "@/providers/avatar";
import { AVATAR_REFERENCE_TYPES, type AvatarReferenceType } from "@/types/enums";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const avatar = await db.avatar.findFirst({ where: { id, userId: user.id } });
  if (!avatar) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const form = await req.formData();
  const file = form.get("file");
  const type = String(form.get("type") || "FACE_IMAGE") as AvatarReferenceType;
  if (!(file instanceof File)) return NextResponse.json({ error: "Missing file" }, { status: 400 });
  if (!AVATAR_REFERENCE_TYPES.includes(type)) return NextResponse.json({ error: "Invalid reference type" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const storage = getStorageProvider();
  const key = `avatars/${id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const { url } = await storage.put(key, buffer, file.type || "application/octet-stream");

  const reference = await db.avatarReference.create({
    data: { avatarId: id, type, storageKey: key, url },
  });

  // Re-validate the avatar against the provider now that a new reference exists.
  const allReferences = await db.avatarReference.findMany({ where: { avatarId: id } });
  const avatarProvider = getAvatarProvider();
  const validation = await avatarProvider.validateAvatar({
    avatarId: id,
    referenceAssetUrls: allReferences.map((r) => r.url ?? r.storageKey),
    voiceSampleUrl: allReferences.find((r) => r.type === "VOICE_SAMPLE")?.url ?? undefined,
  });
  await db.avatar.update({ where: { id }, data: { identityConsistency: validation.identityConsistencyCapability } });

  logger.info("avatar_reference_uploaded", { userId: user.id, operation: "upload_avatar_reference", status: "ok" });
  return NextResponse.json({ reference, validation });
}
