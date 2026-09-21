"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { StatusBadge } from "@/components/status-badge";

// Loose types matching the API's include-heavy project payload — kept
// permissive (unknown/any at the JSON-shape boundary) since this is a UI
// rendering layer, not a validation boundary (routes already validate input).
interface Project {
  id: string;
  name: string;
  product: string;
  platform: string;
  duration: number;
  campaignGoal: string | null;
  status: string;
  errorMessage: string | null;
  avatar: { id: string; name: string; identityConsistency: string } | null;
  referenceVideos: RefVideo[];
  analyses: Analysis[];
  researchJobs: { id: string; status: string; provider: string; isMock: boolean; viralVideos: ViralVideo[] }[];
  viralVideos: ViralVideo[];
  blueprint: Blueprint | null;
  scripts: ScriptRow[];
  shots: ShotRow[];
  finalAssets: { id: string; url: string; type: string; durationSeconds: number | null }[];
}

interface RefVideo {
  id: string;
  url: string | null;
  originalFilename: string;
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
  metadataStatus: string;
}

interface Analysis {
  id: string;
  hook: Record<string, unknown>;
  timeline: Array<Record<string, unknown>>;
  performance: Record<string, unknown>;
  editing: Record<string, unknown>;
  cta: Record<string, unknown>;
  provider: string;
  isMock: boolean;
}

interface ViralVideo {
  id: string;
  title: string;
  channel: string | null;
  url: string;
  viewCount: string;
  durationSeconds: number | null;
  platform: string;
}

interface Blueprint {
  id: string;
  campaignObjective: string;
  targetAudience: string;
  hookStrategy: Record<string, unknown>;
  storyStructure: { beats?: string[] };
  visualStrategy: Record<string, unknown>;
  performanceStrategy: Record<string, unknown>;
  bRollStrategy: Record<string, unknown>;
  editingStrategy: Record<string, unknown>;
  ctaStrategy: Record<string, unknown>;
  framework: { name: string; hookType: string; pacing: string; structure: string[]; visualStrategy: string } | null;
}

interface ScriptBeat {
  beat: string;
  line: string;
  approxSeconds: number;
}

interface ScriptRow {
  id: string;
  version: string;
  label: string;
  hookType: string;
  durationSeconds: number;
  status: string;
  content: ScriptBeat[];
}

interface ShotRow {
  id: string;
  shotNumber: number;
  durationSeconds: number;
  dialogue: string | null;
  visual: string;
  camera: string;
  framing: string;
  avatarAction: string;
  facialExpression: string;
  background: string;
  bRoll: string | null;
  onScreenText: string | null;
  caption: string | null;
  transition: string | null;
  status: string;
  generationPrompt: string;
  generations: {
    id: string;
    status: string;
    isMock: boolean;
    assets: { id: string; url: string }[];
    consistencyChecks: { recommendation: string; confidence: number | null; issues: unknown }[];
  }[];
}

const TRANSIENT_STATUSES = new Set(["ANALYZING", "RESEARCHING", "GENERATING"]);

export function ProjectDetail({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [progressText, setProgressText] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}`);
    if (!res.ok) return;
    const data = await res.json();
    setProject(data.project);
    return data.project as Project;
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  // Poll while anything is in a transient/processing state.
  useEffect(() => {
    const hasProcessingGeneration = project?.shots.some((s) =>
      s.generations.some((g) => g.status === "QUEUED" || g.status === "PROCESSING")
    );
    const shouldPoll = project && (TRANSIENT_STATUSES.has(project.status) || hasProcessingGeneration);

    if (shouldPoll && !pollRef.current) {
      pollRef.current = setInterval(async () => {
        await fetch(`/api/projects/${projectId}/status`);
        load();
      }, 2500);
    }
    if (!shouldPoll && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [project, projectId, load]);

  async function runAction(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
      setProgressText(null);
    }
  }

  async function postJSON(url: string, body?: unknown) {
    const res = await fetch(url, {
      method: "POST",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? `Request failed (${res.status})`);
    }
    return res.json();
  }

  const handleAnalyze = () =>
    runAction(async () => {
      setProgressText("Analyzing video...");
      await postJSON(`/api/projects/${projectId}/analyze`);
      setProgressText("Researching viral formats...");
      await postJSON(`/api/projects/${projectId}/research`);
      setProgressText("Extracting framework & building blueprint...");
      await postJSON(`/api/projects/${projectId}/blueprint`);
      await load();
    });

  const handleScripts = () =>
    runAction(async () => {
      setProgressText("Writing script versions...");
      await postJSON(`/api/projects/${projectId}/script`);
      await load();
    });

  const handleShots = () =>
    runAction(async () => {
      if (!selectedScriptId) throw new Error("Select a script version first.");
      setProgressText("Building shot list...");
      await postJSON(`/api/projects/${projectId}/shots`, { scriptId: selectedScriptId });
      await load();
    });

  const handleGenerate = () =>
    runAction(async () => {
      setProgressText("Starting shot generation...");
      await postJSON(`/api/projects/${projectId}/generate`);
      await load();
    });

  const handleAssemble = () =>
    runAction(async () => {
      setProgressText("Assembling final video & running quality control...");
      await postJSON(`/api/projects/${projectId}/assemble`);
      await load();
    });

  if (!project) return <div className="text-muted">Loading...</div>;

  const analysis = project.analyses[0];
  const generatedShotCount = project.shots.filter((s) => s.status === "GENERATED" || s.status === "APPROVED").length;
  const finalVideo = project.finalAssets.find((a) => a.type === "FINAL_VIDEO");

  return (
    <div className="space-y-8 pb-16">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">{project.name}</h1>
          <p className="text-muted text-sm mt-1">
            {project.product} · {project.platform} · {project.duration}s · avatar:{" "}
            {project.avatar ? project.avatar.name : <span className="text-warn">none selected</span>}
          </p>
        </div>
        <StatusBadge status={project.status} />
      </div>

      {project.errorMessage && (
        <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">
          {project.errorMessage}
        </div>
      )}
      {error && <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">{error}</div>}
      {progressText && (
        <div className="text-sm text-warn bg-warn/10 border border-warn/30 rounded-lg px-3 py-2 flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-warn animate-pulse" />
          {progressText}
        </div>
      )}

      {/* Reference video */}
      <section className="card space-y-3">
        <h2 className="font-medium">Reference video</h2>
        {project.referenceVideos[0] ? (
          <div className="flex flex-col sm:flex-row gap-4">
            {project.referenceVideos[0].url && (
              <video src={project.referenceVideos[0].url} controls className="w-full sm:w-56 rounded-lg bg-black" />
            )}
            <div className="text-sm text-muted space-y-1">
              <p>{project.referenceVideos[0].originalFilename}</p>
              <p>
                Duration:{" "}
                {project.referenceVideos[0].durationSeconds !== null ? `${project.referenceVideos[0].durationSeconds}s` : "UNKNOWN"}
              </p>
              <p>
                Resolution:{" "}
                {project.referenceVideos[0].width ? `${project.referenceVideos[0].width}x${project.referenceVideos[0].height}` : "UNKNOWN"}
              </p>
              <p>Metadata: {project.referenceVideos[0].metadataStatus}</p>
            </div>
          </div>
        ) : (
          <p className="text-muted text-sm">No reference video uploaded.</p>
        )}
      </section>

      {/* Stage 1: Analyze */}
      {!analysis && (
        <button className="btn-primary" disabled={busy} onClick={handleAnalyze}>
          Analyze Video
        </button>
      )}

      {analysis && <AnalysisSection analysis={analysis} />}
      {project.viralVideos.length > 0 && <ResearchSection videos={project.viralVideos} isMock={project.researchJobs[0]?.isMock} />}
      {project.blueprint && <BlueprintSection blueprint={project.blueprint} />}

      {/* Stage 2: Script */}
      {project.blueprint && (
        <section className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Script</h2>
            <button className="btn-secondary text-sm" disabled={busy} onClick={handleScripts}>
              {project.scripts.length > 0 ? "Regenerate versions" : "Create Script"}
            </button>
          </div>
          {project.scripts.length > 0 && (
            <div className="space-y-3">
              {project.scripts.map((s) => (
                <label
                  key={s.id}
                  className={`block rounded-lg border p-3 cursor-pointer transition-colors ${
                    (selectedScriptId ?? project.scripts.find((x) => x.status === "APPROVED")?.id) === s.id
                      ? "border-accent bg-accent/5"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="script"
                      checked={(selectedScriptId ?? project.scripts.find((x) => x.status === "APPROVED")?.id) === s.id}
                      onChange={() => setSelectedScriptId(s.id)}
                    />
                    <span className="font-medium text-sm">
                      Version {s.version} — {s.label}
                    </span>
                    <StatusBadge status={s.status} />
                  </div>
                  <ul className="mt-2 ml-6 text-sm text-muted space-y-1 list-disc">
                    {s.content.map((beat, i) => (
                      <li key={i}>
                        <span className="text-slate-300">[{beat.beat}]</span> {beat.line}
                      </li>
                    ))}
                  </ul>
                </label>
              ))}
              <button className="btn-primary" disabled={busy || !(selectedScriptId || project.scripts.some((s) => s.status === "APPROVED"))} onClick={handleShots}>
                Create Shot List
              </button>
            </div>
          )}
        </section>
      )}

      {/* Stage 3: Shot board */}
      {project.shots.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Shot board</h2>
            {generatedShotCount === 0 && (
              <button className="btn-primary" disabled={busy || !project.avatar} onClick={handleGenerate}>
                Generate Video
              </button>
            )}
          </div>
          {!project.avatar && (
            <p className="text-xs text-warn">Select an avatar for this project before generating — AVATAR REQUIRED.</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {project.shots.map((shot) => (
              <ShotCard key={shot.id} shot={shot} />
            ))}
          </div>
        </section>
      )}

      {/* Stage 4: Assemble */}
      {project.shots.length > 0 && generatedShotCount > 0 && !finalVideo && (
        <button className="btn-primary" disabled={busy} onClick={handleAssemble}>
          Assemble Final Video
        </button>
      )}

      {/* Final video */}
      {finalVideo && (
        <section className="card space-y-3">
          <h2 className="font-medium">Final video</h2>
          <video src={finalVideo.url} controls className="w-full max-w-xs rounded-lg bg-black" />
          <div className="text-xs text-muted">
            Duration: {finalVideo.durationSeconds ?? "UNKNOWN"}s
          </div>
          <div className="flex gap-2">
            <a href={finalVideo.url} download className="btn-secondary text-sm">
              Export
            </a>
            <button className="btn-secondary text-sm" disabled={busy} onClick={handleGenerate}>
              Regenerate all shots
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function AnalysisSection({ analysis }: { analysis: Analysis }) {
  const hook = analysis.hook as { category?: string; spokenHook?: string; whyItStopsScroll?: string };
  const editing = analysis.editing as Record<string, unknown>;
  const cta = analysis.cta as { action?: string; delivery?: string };

  return (
    <section className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Video analysis</h2>
        <span className="text-xs text-muted">
          {analysis.isMock ? "MOCK_AI" : analysis.provider}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="label">Hook</p>
          <p className="text-sm">
            <span className="badge bg-accent/15 text-accent mr-2">{hook.category}</span>
            {hook.spokenHook}
          </p>
          <p className="text-xs text-muted mt-1">{hook.whyItStopsScroll}</p>
        </div>
        <div>
          <p className="label">CTA</p>
          <p className="text-sm">{cta.action}</p>
          <p className="text-xs text-muted mt-1">{cta.delivery}</p>
        </div>
      </div>

      <div>
        <p className="label">Timeline</p>
        <div className="flex rounded-lg overflow-hidden border border-border h-8">
          {analysis.timeline.map((seg, i) => {
            const s = seg as { durationSeconds?: number; label?: string };
            return (
              <div
                key={i}
                className="flex items-center justify-center text-[10px] uppercase tracking-wide border-r border-border last:border-r-0 bg-panel2"
                style={{ flexGrow: s.durationSeconds ?? 1 }}
                title={s.label}
              >
                {s.label}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <p className="label">Editing metrics</p>
        <div className="flex flex-wrap gap-2 text-xs">
          {Object.entries(editing)
            .filter(([k]) => ["cutsPerMinute", "averageShotLengthSeconds", "bRollPercentage", "talkingHeadPercentage", "hookLengthSeconds", "ctaLengthSeconds"].includes(k))
            .map(([k, v]) => (
              <span key={k} className="badge bg-panel2">
                {k}: {String(v)}
              </span>
            ))}
        </div>
      </div>
    </section>
  );
}

function ResearchSection({ videos, isMock }: { videos: ViralVideo[]; isMock?: boolean }) {
  return (
    <section className="card space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Viral research</h2>
        <span className="text-xs text-muted">{isMock ? "MOCK_YOUTUBE" : "YouTube Data API"}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {videos.slice(0, 8).map((v) => (
          <a key={v.id} href={v.url} target="_blank" rel="noreferrer" className="rounded-lg border border-border p-3 hover:border-accent/40 text-sm">
            <p className="font-medium line-clamp-2">{v.title}</p>
            <p className="text-xs text-muted mt-1">
              {v.channel ?? "Unknown channel"} · {v.viewCount === "UNKNOWN" ? "views: UNKNOWN" : `${Number(v.viewCount).toLocaleString()} views`}
            </p>
          </a>
        ))}
      </div>
    </section>
  );
}

function BlueprintSection({ blueprint }: { blueprint: Blueprint }) {
  return (
    <section className="card space-y-3">
      <h2 className="font-medium">Creative blueprint</h2>
      {blueprint.framework && (
        <p className="text-xs text-muted">
          Framework: <span className="text-slate-200">{blueprint.framework.name}</span> ({blueprint.framework.hookType},{" "}
          {blueprint.framework.pacing} pacing)
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div>
          <p className="label">Objective</p>
          <p>{blueprint.campaignObjective}</p>
        </div>
        <div>
          <p className="label">Target audience</p>
          <p>{blueprint.targetAudience}</p>
        </div>
      </div>
      {blueprint.storyStructure?.beats && (
        <div>
          <p className="label">Story structure</p>
          <ol className="list-decimal list-inside text-sm space-y-0.5">
            {blueprint.storyStructure.beats.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}

function ShotCard({ shot }: { shot: ShotRow }) {
  const latestGen = shot.generations[shot.generations.length - 1];
  const asset = latestGen?.assets[0];
  const consistency = latestGen?.consistencyChecks[latestGen.consistencyChecks.length - 1];

  return (
    <div className="card space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">SHOT {shot.shotNumber}</span>
        <StatusBadge status={shot.status} />
      </div>
      <p className="text-xs text-muted">{shot.durationSeconds}s · {shot.framing}</p>
      {shot.dialogue && <p className="text-sm italic">&ldquo;{shot.dialogue}&rdquo;</p>}
      <p className="text-xs text-muted">{shot.visual}</p>
      {asset && <video src={asset.url} controls className="w-full rounded-lg bg-black mt-2" />}
      {latestGen && !asset && <p className="text-xs text-warn">Generation {latestGen.status.toLowerCase()}...</p>}
      {consistency && (
        <div className="text-xs">
          Avatar consistency: <StatusBadge status={consistency.recommendation} />
        </div>
      )}
    </div>
  );
}
