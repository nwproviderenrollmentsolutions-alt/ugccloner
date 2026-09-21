# AI UGC Viral Cloner

Upload a viral UGC video → AI reverse-engineers its hook, structure, pacing, and editing →
AI researches comparable viral formats → AI extracts a reusable framework → AI adapts it to
your product → AI recreates it with **your approved AI avatar** as the presenter → AI
produces the shot-by-shot video and assembles the final export.

The avatar is a hard lock: the system never substitutes a random person, stock actor, or
generic influencer for your approved clone. If no avatar is selected or it has no reference
assets, generation is refused with `AVATAR REQUIRED` rather than silently inventing a
presenter.

## Product flow

```
Dashboard → New Project → Upload reference UGC → Enter product → Select avatar
  → Analyze Video (analysis → research → framework → blueprint)
  → Create Script (multiple hook-variant versions) → pick one
  → Create Shot List → Generate Video (per-shot jobs, avatar identity lock on every prompt)
  → Avatar Consistency Check (per shot) → Assemble Final Video → Quality Control → Review/Export
```

## Architecture

- **Frontend/backend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS. API routes
  under `src/app/api/*`; server components read the DB directly for initial page loads,
  client components poll for live pipeline status.
- **Database**: PostgreSQL + Prisma (`prisma/schema.prisma`). See "Why Postgres, not SQLite"
  below.
- **Auth**: email/password, bcrypt-hashed, signed JWT session cookie (`jose`). No external
  auth provider dependency for the MVP.
- **Storage**: `StorageProvider` interface — local filesystem by default, S3-compatible
  (`@aws-sdk/client-s3`) when `STORAGE_*` env vars are set. Files are served through an
  authenticated, ownership-checked route (`/api/storage/[...key]`), never a public bucket
  URL, unless you point `STORAGE_PUBLIC_BASE_URL` at a CDN yourself.
- **Video processing**: `ffmpeg`/`ffprobe` via `src/lib/ffmpeg.ts` — real metadata extraction
  on upload, real concatenation for final assembly. Every function degrades to `"UNKNOWN"`
  rather than fabricating a number if ffmpeg isn't installed.
- **AI**: `AIProvider` interface (`src/providers/ai`) — `AnthropicAIProvider` (real) or
  `MockAIProvider` (default). Drives analysis, framework extraction, blueprint, scripts,
  shots, avatar-consistency checks, and quality control from centralized prompts in
  `src/prompts/*`.
- **Video generation**: `VideoGenerationProvider` interface (`src/providers/video`) —
  `GenericVideoGenerationProvider` (any HTTP job-submission API) or `MockVideoGenerationProvider`
  (synthesizes a real, clearly-labeled placeholder clip via ffmpeg so the pipeline is fully
  exercisable with zero paid APIs).
- **Avatar validation**: `AvatarProvider` interface (`src/providers/avatar`).
- **Search / viral research**: `SearchProvider` interface (`src/providers/search`) —
  `YouTubeSearchProvider` (YouTube Data API v3) or `MockSearchProvider`.

None of the business logic imports a concrete provider directly — everything goes through
`getXProvider()` factory functions in each provider's `index.ts`, which pick the mock or real
adapter based on env vars. See "How to add a new provider" below.

### Why Postgres, not SQLite

The schema leans on Prisma `Json` columns for structured analysis/blueprint/script/shot
payloads (hook analysis, timelines, editing metrics, scripts, etc.) — this is the correct
type for data whose shape is defined in TypeScript (`src/types/pipeline.ts`), not a fixed SQL
schema. Prisma's SQLite connector doesn't support `Json`, so the schema targets
`provider = "postgresql"`. Status/type "enums" are still plain `String` columns backed by TS
union types (`src/types/enums.ts`) rather than native Prisma enums — there's no need for a
second connector-specific feature here, and it keeps a future multi-database story simple.

### Folder structure

```
src/
├── app/                    # Next.js routes (pages + API)
│   ├── (app)/               dashboard, projects, avatars, library, settings (auth-gated)
│   ├── login/ register/     public auth pages
│   └── api/                 REST endpoints (see below)
├── components/              shared React components (nav, project detail, status badges...)
├── lib/                     db client, auth, env, logger, ffmpeg wrapper, json helper
├── prompts/                 centralized AI system prompts (one file per pipeline phase)
├── providers/                provider interfaces + mock/real adapters, one folder per capability
│   ├── ai/ video/ avatar/ search/ storage/
├── services/                 orchestration logic — one file per pipeline stage
└── types/                    shared TS contracts (pipeline payloads, enums)
prisma/                     schema.prisma, seed.ts
tests/unit/                 vitest unit tests (no external services required)
```

## Installation

```bash
npm install
cp .env.example .env
# Local Postgres:
docker compose up -d postgres
# (or point DATABASE_URL at any Postgres you already have)
npm run db:push     # applies the schema (no migration history needed for the MVP)
npm run db:seed      # demo user, avatar, 3 library frameworks, 1 empty demo project
npm run dev
```

Or all at once: `npm run setup && npm run dev`.

Demo login: `demo@ugccloner.dev` / `password123`.

## Environment variables

See `.env.example` for the full list with comments. Nothing here is required to run the app
— every provider has a mock fallback.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `AUTH_SECRET` | Session JWT signing secret — set a real random value outside dev |
| `MOCK_AI` / `MOCK_VIDEO` / `MOCK_SEARCH` / `MOCK_AVATAR` | Force mock mode regardless of API keys (default: mocked unless the matching key is present) |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` | Real AI provider |
| `YOUTUBE_API_KEY` | Real viral-research provider |
| `STORAGE_ENDPOINT` / `STORAGE_ACCESS_KEY` / `STORAGE_SECRET_KEY` / `STORAGE_BUCKET` / `STORAGE_PUBLIC_BASE_URL` | S3-compatible storage — omit all to use local disk |
| `VIDEO_PROVIDER_API_KEY` / `VIDEO_PROVIDER_BASE_URL` | Real video-generation provider (generic job API — see contract in `src/providers/video/generic.ts`) |
| `AVATAR_PROVIDER_API_KEY` / `AVATAR_PROVIDER_BASE_URL` | Real avatar-validation provider |

API keys are read only on the server (`src/lib/env.ts`) and never sent to the browser.

## Mock mode

With every `MOCK_*` flag on (the default with no API keys configured), the entire pipeline —
upload → analyze → research → blueprint → script → shots → generate → consistency check →
assemble → QC — runs for real, end to end, with:

- **Video analysis**: template-driven but structurally complete hook/timeline/performance/
  editing/CTA output, computed from the real uploaded video's actual duration.
- **Research**: seeded-random but realistic-looking YouTube-shaped results, every row tagged
  `provider: "MOCK_YOUTUBE"` / `isMock: true`.
- **Video generation**: `ffmpeg` synthesizes a real, playable clip per shot with
  "MOCK GENERATION — no real AI video model was called" burned into the frame — never a fake
  claim of AI-generated footage.
- **Avatar consistency**: honestly returns `UNKNOWN` with an explanatory issue, never an
  invented confidence score — see "Avatar identity lock" below.
- **Final assembly**: real `ffmpeg` concatenation of the (mock) shots into one MP4.

## Provider configuration

### How to add a new provider

Each capability is an interface in `src/providers/<capability>/types.ts`. To add a real
adapter:

1. Create `src/providers/<capability>/your-provider.ts` implementing that interface.
2. Wire it into `src/providers/<capability>/index.ts`'s `get<Capability>Provider()` factory
   (env-var gated, same pattern as the existing adapters).
3. Add any new env vars to `.env.example` and `src/lib/env.ts`.

No caller ever imports a concrete provider class — only the `get*Provider()` factory — so
business logic in `src/services/*` never needs to change.

### Video generation contract

`GenericVideoGenerationProvider` (`src/providers/video/generic.ts`) targets a simple
submit-job/poll-status REST shape documented in that file's comment. Point
`VIDEO_PROVIDER_BASE_URL` at any service matching that contract, or write a dedicated adapter
for one that doesn't.

## Avatar identity lock

This is the core constraint of the product (see `src/prompts/avatar-lock.ts`):

- Every script, shot, and generation-prompt build path resolves the project's `Avatar` +
  `AvatarReference` rows into an `AvatarLockProfile` (`src/services/avatar.service.ts`) and
  throws `AvatarRequiredError` — surfaced to the UI as the literal message
  `AVATAR REQUIRED: ...` — if none is selected or it has zero reference assets. Nothing
  downstream can silently fall back to a generic presenter.
- Every AI video-generation prompt embeds `avatarIdentityLockBlock()`: the avatar's ID, name,
  voice, wardrobe, environment, performance style, reference asset URLs, and negative
  constraints (`different person`, `stock actor`, `celebrity likeness`, ...), plus an explicit
  `IDENTITY LOCK` footer forbidding a new/altered/substituted presenter.
- **`identityConsistency`** on the `Avatar` model is `HIGH | LIMITED | UNKNOWN` — always taken
  from what the configured provider actually reports, never upgraded by the app. The seeded
  demo avatar and both the mock and generic real video providers default to `LIMITED`/
  `UNKNOWN` because this MVP has no real vision-based identity-preservation guarantee wired
  up; the UI surfaces this honestly instead of claiming exact identity preservation.
- **`AvatarConsistencyCheck`** rows never contain an invented confidence score.
  `MockAIProvider.checkAvatarConsistency` and the equivalent path in `AnthropicAIProvider`
  both return `recommendation: "UNKNOWN"` with `confidence: null` and an explanatory issue,
  because neither has a real frame-level face-comparison capability in this MVP. A real
  comparison capability (e.g. a face-embedding API) can be dropped in behind the same
  `AIProvider.checkAvatarConsistency` method without touching any caller. `REJECT` is only
  ever returned by a provider that can actually detect drift — it is never downgraded to
  "close enough".

## How generation works

1. `POST /api/projects/:id/generate` loads every `PENDING` shot, resolves the avatar lock
   profile, and calls `VideoGenerationProvider.generateShot()` once per shot — each call
   creates a `Generation` row keyed by the provider's `externalJobId`.
2. Any request to `GET /api/projects/:id/status` (the UI polls this every ~2.5s while
   anything is in flight) calls `syncProjectGenerations()`, which polls
   `getJobStatus()` for every in-flight job, persists status transitions, creates the
   `GeneratedAsset` row on completion, and immediately runs the avatar consistency check.
   Job state itself is **not** kept in process memory — `MockVideoGenerationProvider`
   persists it to a per-job file under the OS temp dir, since Next.js can compile route
   handlers into separate module instances even within one dev server process, and a
   real multi-instance/serverless deployment would break the same way with an in-memory
   Map.
3. Once every generation for a project leaves `QUEUED`/`PROCESSING`, the project status
   moves to `REVIEW`.
4. `POST /api/projects/:id/assemble` concatenates every `GENERATED`/`APPROVED` shot's asset
   with `ffmpeg`, uploads the result as a `FINAL_VIDEO` `GeneratedAsset`, runs
   `runProjectQualityControl()`, and sets the project to `COMPLETE` (QC approved) or `REVIEW`
   (issues found — e.g. unresolved `UNKNOWN` avatar-consistency checks).

## How to create an avatar

`/avatars/new` — name + description + voice/wardrobe/environment/performance/camera
preferences + negative constraints, then upload at least one face image or reference video.
Uploading a reference re-runs `AvatarProvider.validateAvatar()` and updates
`identityConsistency` from whatever that provider actually reports.

## How to create a project

`/projects/new` — upload the reference UGC video, name the project, enter the product,
select an approved avatar, pick platform + duration, submit. This creates the `Project` row
and uploads the reference video (real `ffprobe` metadata extraction) in one step, then lands
on the project detail page to run the rest of the pipeline.

## Testing

```bash
npm run typecheck   # tsc --noEmit
npm run build        # production build (also type-checks + lints)
npm test              # vitest — provider/prompt/enum unit tests, no external services required
```

`tests/unit/` covers: the avatar identity-lock block (never drops constraints, never invents
a confidence claim), shot-prompt generation, the mock AI provider's structural
guarantees (bounded timeline, honest `UNKNOWN` consistency result, QC never rubber-stamps an
incomplete package), the mock search provider, `ffprobe` metadata extraction (real when
ffmpeg is present, `UNKNOWN` otherwise), and platform/enum config sanity.

The full pipeline (auth → project → upload → analyze → research → blueprint → script →
shots → generate → poll → assemble → QC) was additionally exercised end-to-end against a
running dev server + local Postgres + local ffmpeg during development — see "Known
limitations" for what that run did and didn't cover.

## Troubleshooting

- **`Json` schema validation error on `prisma db push`**: you're pointed at SQLite. Use
  Postgres (see "Why Postgres, not SQLite").
- **Video generation jobs stuck at `QUEUED`**: confirm `ffmpeg`/`ffprobe` are installed
  (`ffmpeg -version`) if using `MOCK_VIDEO`; a real provider needs `VIDEO_PROVIDER_BASE_URL`
  reachable from the server.
- **`AVATAR REQUIRED` on script/shot/generate**: the selected avatar has no
  `AvatarReference` rows yet — upload a face image or reference video on `/avatars/new` (or
  to an existing avatar) first.
- **Assembly says "Assembly unavailable"**: `ffmpeg` isn't installed in this environment —
  install it (`apt-get install -y ffmpeg` on Debian/Ubuntu) rather than the app pretending to
  stitch a video it didn't.

## Deployment

- **App**: any Vercel-compatible Next.js host. Set every env var from `.env.example` that
  applies to your chosen providers.
- **Database**: any managed Postgres (Neon, RDS, Supabase, Railway, ...).
- **Storage**: an S3-compatible bucket (`STORAGE_*` vars) — local filesystem storage does not
  survive across serverless instances/deploys and is dev-only.
- **ffmpeg**: the assembly step and `MOCK_VIDEO` both shell out to `ffmpeg`/`ffprobe` — make
  sure your deployment target has them on `PATH` (they are not bundled).

## Known limitations

- **Avatar identity verification is honestly unverified in this MVP.** No wired-up provider
  in this codebase has real frame-level face-comparison capability, so every
  `AvatarConsistencyCheck` is `UNKNOWN`, not `APPROVE`. This is a deliberate "never fabricate"
  choice, not an oversight — see "Avatar identity lock" above.
- **Researched competitor videos are analyzed from metadata only** (title/channel/description/
  view count from the search provider), not from their actual video content — downloading and
  deep-analyzing arbitrary third-party videos (yt-dlp + vision) was out of scope for this MVP.
  Framework extraction is driven primarily by the uploaded reference video's real, full
  analysis; researched titles are folded in as supporting context, never fabricated structural
  claims about videos the app never actually watched.
- **No background worker/queue.** Pipeline stages run synchronously inside their API route
  (fast enough for mock/typical real-AI-call latency); only video generation is genuinely
  asynchronous, via the provider job-polling pattern described in "How generation works".
  The "live job status" requirement is met through client-side polling, not a websocket/worker.
- **Storage ownership checks are best-effort.** `/api/storage/[...key]` resolves ownership by
  looking up the key against `AvatarReference`/`ReferenceVideo`/`GeneratedAsset`; a storage key
  with no matching row is denied by default, but this is not a signed-URL scheme.
- **No rate limiting** is implemented yet — add a middleware-level limiter before any public
  deployment.
- **Local filesystem storage is the default** for zero-config dev; switch to the S3 adapter
  before deploying anywhere without a persistent, shared filesystem.

## Next recommended implementation

1. Wire a real vision-based avatar-consistency capability (e.g. a face-embedding comparison
   API) behind `AIProvider.checkAvatarConsistency` so consistency checks can genuinely
   `APPROVE`/`REJECT`, not just `UNKNOWN`.
2. Background job queue (e.g. a `worker` process + Postgres-backed queue) so long-running
   stages don't block an HTTP request and can retry with backoff.
3. Real per-video research analysis: download + sample frames from top research results and
   run them through the video-analysis path for genuine structural comparison, not just
   title/metadata.
4. Rate limiting + per-request cost/budget guards on AI and video-generation calls.
5. Multi-variation generation (Version A–E in one batch) and a proper diff/compare UI across
   variations.
