import { requireUser } from "@/lib/auth";
import { env } from "@/lib/env";

function ProviderRow({ label, mocked, providerName }: { label: string; mocked: boolean; providerName: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted mt-0.5">{mocked ? "Running on the mock adapter — no external API calls." : `Live: ${providerName}`}</p>
      </div>
      <span className={`badge ${mocked ? "bg-warn/15 text-warn" : "bg-ok/15 text-ok"}`}>{mocked ? "MOCK" : "LIVE"}</span>
    </div>
  );
}

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-muted text-sm mt-1">Account and provider configuration.</p>
      </div>

      <div className="card">
        <h2 className="font-medium mb-3">Account</h2>
        <p className="text-sm text-muted">Signed in as {user!.email}</p>
      </div>

      <div className="card">
        <h2 className="font-medium mb-1">Providers</h2>
        <p className="text-xs text-muted mb-3">
          Configured via environment variables (.env) — never exposed to the browser. See README "Provider
          configuration" for how to add a new adapter.
        </p>
        <ProviderRow label="AI (analysis, scripts, blueprints, QC)" mocked={env.mockAI} providerName="Anthropic" />
        <ProviderRow label="Video generation" mocked={env.mockVideo} providerName="Generic HTTP video provider" />
        <ProviderRow label="Avatar validation" mocked={env.mockAvatar} providerName="Generic HTTP avatar provider" />
        <ProviderRow label="Viral research / search" mocked={env.mockSearch} providerName="YouTube Data API" />
      </div>
    </div>
  );
}
