import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { StatusBadge } from "@/components/status-badge";

export default async function DashboardPage() {
  const user = await requireUser();

  const [projects, avatars, frameworks] = await Promise.all([
    db.project.findMany({ where: { userId: user!.id }, orderBy: { createdAt: "desc" }, take: 5, include: { avatar: true } }),
    db.avatar.findMany({ where: { userId: user!.id, status: "ACTIVE" } }),
    db.viralFramework.findMany({ where: { userId: user!.id }, take: 5, orderBy: { dateAnalyzed: "desc" } }),
  ]);

  const completed = await db.project.count({ where: { userId: user!.id, status: "COMPLETE" } });
  const inProgress = await db.project.count({ where: { userId: user!.id, status: { notIn: ["COMPLETE", "ERROR"] } } });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-muted text-sm mt-1">Your AI UGC production company, operated by software.</p>
        </div>
        <Link href="/projects/new" className="btn-primary">
          + New UGC Project
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-muted text-xs">Projects in progress</p>
          <p className="text-2xl font-semibold mt-1">{inProgress}</p>
        </div>
        <div className="card">
          <p className="text-muted text-xs">Completed videos</p>
          <p className="text-2xl font-semibold mt-1">{completed}</p>
        </div>
        <div className="card">
          <p className="text-muted text-xs">Approved avatars</p>
          <p className="text-2xl font-semibold mt-1">{avatars.length}</p>
        </div>
        <div className="card">
          <p className="text-muted text-xs">Saved frameworks</p>
          <p className="text-2xl font-semibold mt-1">{frameworks.length}</p>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Recent projects</h2>
          <Link href="/projects" className="text-sm text-accent hover:underline">
            View all
          </Link>
        </div>
        {projects.length === 0 ? (
          <div className="card text-center py-10 text-muted">No projects yet — create your first UGC clone.</div>
        ) : (
          <div className="space-y-2">
            {projects.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`} className="card flex items-center justify-between hover:border-accent/40">
                <div>
                  <p className="font-medium text-sm">{p.name}</p>
                  <p className="text-xs text-muted">
                    {p.product} · avatar: {p.avatar?.name ?? "none"}
                  </p>
                </div>
                <StatusBadge status={p.status} />
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Viral framework library</h2>
          <Link href="/library" className="text-sm text-accent hover:underline">
            View all
          </Link>
        </div>
        {frameworks.length === 0 ? (
          <div className="card text-center py-10 text-muted">
            No frameworks saved yet — frameworks are extracted automatically as you analyze reference videos.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {frameworks.map((f) => (
              <div key={f.id} className="card">
                <p className="font-medium text-sm">{f.name}</p>
                <p className="text-xs text-muted mt-1">
                  {f.hookType} · {f.pacing} pacing · {f.platform ?? "any platform"}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">Avatar status</h2>
        {avatars.length === 0 ? (
          <div className="card text-center py-10 text-muted">
            No approved avatars yet.{" "}
            <Link href="/avatars/new" className="text-accent hover:underline">
              Create one
            </Link>{" "}
            before generating any video.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {avatars.map((a) => (
              <div key={a.id} className="card flex items-center justify-between">
                <span className="text-sm font-medium">{a.name}</span>
                <StatusBadge status={a.identityConsistency} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
