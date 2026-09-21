import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function LibraryPage() {
  const user = await requireUser();
  const frameworks = await db.viralFramework.findMany({
    where: { userId: user!.id },
    orderBy: { dateAnalyzed: "desc" },
    include: { sourceVideo: true, blueprints: { include: { project: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Viral framework library</h1>
        <p className="text-muted text-sm mt-1">
          Reusable structures extracted from analyzed videos. Frameworks describe structure only — never another
          creator's specific wording, footage, or likeness.
        </p>
      </div>

      {frameworks.length === 0 ? (
        <div className="card text-center py-12 text-muted">
          No frameworks yet. Analyzing a reference video automatically extracts and saves one here.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {frameworks.map((f) => (
            <div key={f.id} className="card space-y-3">
              <div className="flex items-start justify-between">
                <h3 className="font-medium">{f.name}</h3>
                <span className="badge bg-accent/15 text-accent">{f.hookType}</span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-muted">
                <span className="badge bg-panel2">{f.pacing} pacing</span>
                {f.platform && <span className="badge bg-panel2">{f.platform}</span>}
                {f.productType && <span className="badge bg-panel2">{f.productType}</span>}
                <span className="badge bg-panel2">{new Date(f.dateAnalyzed).toLocaleDateString()}</span>
              </div>
              <div>
                <p className="text-xs text-muted mb-1">Structure</p>
                <ol className="text-sm space-y-0.5 list-decimal list-inside">
                  {(f.structure as string[]).map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
              <p className="text-xs text-muted">{f.visualStrategy}</p>
              {f.notes && <p className="text-xs text-muted italic">{f.notes}</p>}
              {f.blueprints.length > 0 && (
                <p className="text-xs text-accent">
                  Used in {f.blueprints.length} project{f.blueprints.length === 1 ? "" : "s"}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
