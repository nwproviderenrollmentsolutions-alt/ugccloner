import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { StatusBadge } from "@/components/status-badge";

export default async function ProjectsPage() {
  const user = await requireUser();
  const projects = await db.project.findMany({
    where: { userId: user!.id },
    include: { avatar: true, referenceVideos: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Projects</h1>
        <Link href="/projects/new" className="btn-primary">
          + New UGC Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-muted">No projects yet. Upload a viral UGC video to start your first clone.</p>
          <Link href="/projects/new" className="btn-primary mt-4 inline-flex">
            + New UGC Project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="card flex items-center justify-between hover:border-accent/40 transition-colors"
            >
              <div>
                <h3 className="font-medium">{p.name}</h3>
                <p className="text-xs text-muted mt-0.5">
                  {p.product} · {p.platform} · {p.duration}s · avatar: {p.avatar?.name ?? "none selected"}
                </p>
              </div>
              <StatusBadge status={p.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
