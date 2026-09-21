"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewAvatarPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    description: "",
    voiceProvider: "",
    voiceId: "",
    defaultWardrobe: "",
    defaultEnvironment: "",
    performanceStyle: "",
    personality: "",
    cameraPreferences: "",
    negativeConstraints: "different person\ndifferent face\naltered identity\nrandom influencer\nstock actor\ncelebrity likeness",
  });
  const [files, setFiles] = useState<FileList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/avatars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to create avatar");
      }
      const { avatar } = await res.json();

      if (files && files.length > 0) {
        for (const file of Array.from(files)) {
          const fd = new FormData();
          fd.append("file", file);
          fd.append("type", file.type.startsWith("video") ? "REFERENCE_VIDEO" : "FACE_IMAGE");
          await fetch(`/api/avatars/${avatar.id}/references`, { method: "POST", body: fd });
        }
      }

      router.push("/avatars");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">New avatar</h1>
        <p className="text-muted text-sm mt-1">
          This is your approved AI clone's identity profile — the source of truth used to lock every generation
          request to this exact presenter.
        </p>
      </div>

      <form onSubmit={onSubmit} className="card space-y-4">
        {error && <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">{error}</div>}

        <div>
          <label className="label">Name *</label>
          <input className="input" required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="My AI Clone" />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input" rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Voice provider</label>
            <input className="input" value={form.voiceProvider} onChange={(e) => set("voiceProvider", e.target.value)} placeholder="e.g. elevenlabs" />
          </div>
          <div>
            <label className="label">Voice ID</label>
            <input className="input" value={form.voiceId} onChange={(e) => set("voiceId", e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Default wardrobe</label>
            <input className="input" value={form.defaultWardrobe} onChange={(e) => set("defaultWardrobe", e.target.value)} placeholder="Casual t-shirt, neutral colors" />
          </div>
          <div>
            <label className="label">Default environment</label>
            <input className="input" value={form.defaultEnvironment} onChange={(e) => set("defaultEnvironment", e.target.value)} placeholder="Bright modern home office" />
          </div>
        </div>

        <div>
          <label className="label">Performance style</label>
          <input className="input" value={form.performanceStyle} onChange={(e) => set("performanceStyle", e.target.value)} placeholder="High energy, direct eye contact, frequent gestures" />
        </div>
        <div>
          <label className="label">Personality</label>
          <input className="input" value={form.personality} onChange={(e) => set("personality", e.target.value)} placeholder="Friendly, confident, conversational" />
        </div>
        <div>
          <label className="label">Camera preferences</label>
          <input className="input" value={form.cameraPreferences} onChange={(e) => set("cameraPreferences", e.target.value)} placeholder="Handheld, eye-level, occasional punch-ins" />
        </div>
        <div>
          <label className="label">Negative constraints (one per line)</label>
          <textarea className="input font-mono text-xs" rows={4} value={form.negativeConstraints} onChange={(e) => set("negativeConstraints", e.target.value)} />
        </div>

        <div>
          <label className="label">Reference images / video</label>
          <input
            className="input"
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={(e) => setFiles(e.target.files)}
          />
          <p className="text-xs text-muted mt-1">
            At least one face reference is required before this avatar can be used as a presenter — without it,
            generation requests will be blocked with "AVATAR REQUIRED".
          </p>
        </div>

        <button className="btn-primary w-full" type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create avatar"}
        </button>
      </form>
    </div>
  );
}
