"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DURATION_PRESETS, PLATFORMS } from "@/types/enums";

interface AvatarOption {
  id: string;
  name: string;
  identityConsistency: string;
  references: { id: string }[];
}

export default function NewProjectPage() {
  const router = useRouter();
  const [avatars, setAvatars] = useState<AvatarOption[]>([]);
  const [name, setName] = useState("");
  const [product, setProduct] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]>("TIKTOK");
  const [duration, setDuration] = useState<number>(30);
  const [campaignGoal, setCampaignGoal] = useState("");
  const [avatarId, setAvatarId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "uploading">("form");

  useEffect(() => {
    fetch("/api/avatars")
      .then((r) => r.json())
      .then((d) => setAvatars(d.avatars ?? []));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError("Upload a reference UGC video to analyze.");
      return;
    }
    setLoading(true);
    setStep("uploading");
    try {
      const createRes = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, product, productUrl, platform, duration, campaignGoal, avatarId: avatarId || undefined }),
      });
      if (!createRes.ok) {
        const d = await createRes.json().catch(() => ({}));
        throw new Error(d.error ?? "Failed to create project");
      }
      const { project } = await createRes.json();

      const fd = new FormData();
      fd.append("file", file);
      const uploadRes = await fetch(`/api/projects/${project.id}/upload`, { method: "POST", body: fd });
      if (!uploadRes.ok) {
        const d = await uploadRes.json().catch(() => ({}));
        throw new Error(d.error ?? "Failed to upload video");
      }

      router.push(`/projects/${project.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("form");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Create UGC project</h1>
        <p className="text-muted text-sm mt-1">Upload a viral UGC video → AI reverse-engineers it → AI recreates it with your avatar.</p>
      </div>

      <form onSubmit={onSubmit} className="card space-y-5">
        {error && <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">{error}</div>}

        <div>
          <label className="label">Upload a viral UGC video *</label>
          <input
            className="input"
            type="file"
            accept="video/mp4,video/quicktime,video/webm"
            required
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <p className="text-xs text-muted mt-1">MP4, MOV, or WEBM. Max 500MB.</p>
        </div>

        <div>
          <label className="label">Project name *</label>
          <input className="input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Replit UGC clone v1" />
        </div>

        <div>
          <label className="label">What are you promoting? *</label>
          <input className="input" required value={product} onChange={(e) => setProduct(e.target.value)} placeholder="Replit" />
        </div>

        <div>
          <label className="label">Product URL</label>
          <input className="input" type="url" value={productUrl} onChange={(e) => setProductUrl(e.target.value)} placeholder="https://replit.com" />
        </div>

        <div>
          <label className="label">Which avatar?</label>
          <select className="input" value={avatarId} onChange={(e) => setAvatarId(e.target.value)}>
            <option value="">Select an approved avatar...</option>
            {avatars.map((a) => (
              <option key={a.id} value={a.id} disabled={a.references.length === 0}>
                {a.name} {a.references.length === 0 ? "(no reference assets — upload first)" : ""}
              </option>
            ))}
          </select>
          {avatars.length === 0 && (
            <p className="text-xs text-warn mt-1">
              No avatars yet. <a href="/avatars/new" className="underline">Create one first</a> — generation is blocked without an
              approved avatar.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Platform</label>
            <select className="input" value={platform} onChange={(e) => setPlatform(e.target.value as typeof platform)}>
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p === "TIKTOK" ? "TikTok" : p === "REELS" ? "Instagram Reels" : "YouTube Shorts"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Duration</label>
            <select className="input" value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
              {DURATION_PRESETS.map((d) => (
                <option key={d} value={d}>
                  {d} sec
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Campaign goal</label>
          <textarea className="input" rows={2} value={campaignGoal} onChange={(e) => setCampaignGoal(e.target.value)} placeholder="Drive free-trial signups" />
        </div>

        <button className="btn-primary w-full" type="submit" disabled={loading}>
          {step === "uploading" ? "Uploading & creating project..." : "Analyze Video"}
        </button>
      </form>
    </div>
  );
}
