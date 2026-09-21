import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { StatusBadge } from "@/components/status-badge";

export default async function AvatarsPage() {
  const user = await requireUser();
  const avatars = await db.avatar.findMany({
    where: { userId: user!.id, status: "ACTIVE" },
    include: { references: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Avatars</h1>
          <p className="text-muted text-sm mt-1">
            Your approved AI clones. Every generated video uses one of these as the presenter — never a random
            person.
          </p>
        </div>
        <Link href="/avatars/new" className="btn-primary">
          + New avatar
        </Link>
      </div>

      {avatars.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-muted">No avatars yet. Create your first approved AI clone to start producing UGC.</p>
          <Link href="/avatars/new" className="btn-primary mt-4 inline-flex">
            + New avatar
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {avatars.map((a) => (
            <div key={a.id} className="card space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">{a.name}</h3>
                  <p className="text-xs text-muted mt-0.5">{a.description || "No description"}</p>
                </div>
                <StatusBadge status={a.identityConsistency} />
              </div>
              <div className="text-xs text-muted space-y-1">
                <p>References: {a.references.length}</p>
                {a.voiceId && <p>Voice: {a.voiceId}</p>}
              </div>
              <div className="text-xs text-muted">
                Identity consistency: <span className="text-slate-200">{a.identityConsistency}</span>
                {a.identityConsistency === "LIMITED" && (
                  <span className="block mt-1">
                    The configured video-generation provider cannot guarantee exact identity preservation — every
                    clip is checked before approval.
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
