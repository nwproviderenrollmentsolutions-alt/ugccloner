import clsx from "clsx";

const COLOR_MAP: Record<string, string> = {
  // project pipeline
  CREATED: "bg-slate-500/15 text-slate-300",
  UPLOADED: "bg-slate-500/15 text-slate-300",
  ANALYZING: "bg-warn/15 text-warn",
  RESEARCHING: "bg-warn/15 text-warn",
  BLUEPRINT_READY: "bg-accent/15 text-accent",
  SCRIPT_READY: "bg-accent/15 text-accent",
  SHOTS_READY: "bg-accent/15 text-accent",
  GENERATING: "bg-warn/15 text-warn",
  REVIEW: "bg-warn/15 text-warn",
  COMPLETE: "bg-ok/15 text-ok",
  ERROR: "bg-danger/15 text-danger",
  // generation / shot status
  PENDING: "bg-slate-500/15 text-slate-300",
  QUEUED: "bg-slate-500/15 text-slate-300",
  PROCESSING: "bg-warn/15 text-warn",
  GENERATED: "bg-ok/15 text-ok",
  COMPLETED: "bg-ok/15 text-ok",
  APPROVED: "bg-ok/15 text-ok",
  REJECTED: "bg-danger/15 text-danger",
  FAILED: "bg-danger/15 text-danger",
  // consistency
  APPROVE: "bg-ok/15 text-ok",
  UNKNOWN: "bg-slate-500/15 text-slate-300",
  // identity capability
  HIGH: "bg-ok/15 text-ok",
  LIMITED: "bg-warn/15 text-warn",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={clsx("badge", COLOR_MAP[status] ?? "bg-slate-500/15 text-slate-300")}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
