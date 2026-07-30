# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

CPA-Dashboard-Core is a study-tracking web app for CPA (公認会計士) exam preparation: a server-authoritative timer plus daily/weekly study log aggregation. Backend: Express 5 + Prisma 7 + PostgreSQL. `frontend/` is a Next.js 15 (App Router) + React 19 app.

**Frontend direction changed:** `frontend/` was built during an early design phase, but the plan has since shifted — the UI will be ported over from the separate `CPA-Dashboard` repo (https://github.com/CresBloomoon/CPA-Dashboard) instead of being built out further here. Treat `frontend/` as provisional/superseded rather than the long-term home for UI work: don't invest in extending its unfinished parts (e.g. the `calendar`/`projects` placeholder tabs, or the empty `DashboardGrid.tsx`/`ReminderSummaryCard.tsx`/`StreakCalendarCard.tsx` files) unless the user specifically asks to. This repo's durable focus is the backend (API, domain rules, migrations); confirm scope with the user before doing significant frontend work.

## Running the app

Everything runs in Docker; there is no host-installed node/npm/prisma workflow.

```bash
docker compose up          # db (5434->5432), backend (3000), frontend (5174->3000)
```

- Backend container bootstraps with `npm ci`, `prisma generate`, then `node index.js`.
- Frontend container bootstraps with `npm install` (no lockfile pinning enforced), then `next dev`.
- Frontend proxies `/api/:path*` to `http://backend:3000/api/:path*` (see `frontend/next.config.js`) — always call the API from the frontend as relative `/api/...` paths, never hardcode the backend origin.

Run one-off commands inside the running containers, e.g.:

```bash
docker compose exec backend npx prisma migrate dev --name <migration_name>
docker compose exec backend npx prisma studio
docker compose exec backend node scripts/seed-subjects.js
```

There is no test suite configured (`backend/package.json`'s `test` script is a stub) and no linter is configured in either package. Don't assume `npm test` / `npm run lint` do anything meaningful.

## Architecture

### Backend layering (strict)

`routes -> usecases -> repositories -> prisma`. Business logic belongs only in UseCase classes; routes/controllers must stay thin (parse/validate input, call one UseCase, format response, `next(e)` on error).

- `backend/src/routes/*.routes.js` — Express routers. Validate input via `backend/src/http/validation.js` helpers (`requireUuid`, `optionalUuid`, `requirePositiveInt`, `optionalDate`), then delegate to a UseCase, then respond via `backend/src/http/respond.js`'s `ok(res, payload)`.
- `backend/src/usecases/*UseCase.js` — one class per use case, `execute(input)` method. Most take `prisma` directly in the constructor and instantiate the Repository classes they need internally (see `GetSubjectsUseCase` for the standard pattern).
- `backend/src/repositories/*Repository.js` — the only layer that talks to Prisma directly.
- `backend/src/domain/` — pure domain logic: `time.js` (JST day rounding, `roundUpMinutes`), `pomodoro.js`, `errors.js` (`ApiError`, thrown with `(status, code, message)` and caught by the central error handler in `app.js`).
- `backend/src/infra/prisma.js` — Prisma client singleton (`getPrisma()`).
- Errors returned to clients are always `{ error: { code, message } }`; `code` is machine-checked, `message` is human-readable. Preserve this shape when adding endpoints.
- API responses are treated as a stable contract: don't remove or rename existing fields, only add new ones (see `docs/projects/PROJECT_GUIDE.md`).

### Timer state machine (core of the app — read ADR-015 before touching timer code)

Server is the single source of truth for timer state and time; the client never computes or trusts its own clock for anything persisted. States are exactly `RUNNING`, `PAUSED`, and the derived `IDLE` (= no unrecorded session exists; not a DB-stored state).

Transitions:
- `POST /api/timer/start` — IDLE → RUNNING
- `POST /api/timer/stop` — RUNNING → PAUSED (this *pauses*, it does not record — despite the name)
- `POST /api/timer/resume` — PAUSED → RUNNING
- `POST /api/timer/record` — PAUSED → IDLE, and is the *only* place a `StudyLog` gets created (ADR-013)
- `GET /api/timer/current` returns the server-evaluated state and includes `serverNow` for any time-dependent UI.

Mutating timer endpoints require a client-supplied `clientRequestId` (UUID) for idempotency — repeated calls with the same id must return the same result rather than double-processing. See `docs/adr/ADR-015-timer-state-machine.md`, `docs/adr/ADR-013-Timer-State-And-Time-Counting-Policy.md`, `docs/adr/ADR-012-Server-Authoritative Timer Design.md`.

### Domain invariants (see `docs/architecture/DOMAIN.md`)

- **StudyLog is append-only** — it is the one piece of primary data that must never be lost, edited, or deleted. There is no update/delete use case for it and none should be added casually.
- `durationMinutes`/`roundedMinutes` are always `ceil(elapsedSeconds / 60)` — round up, never down or nearest.
- A "study day" (`StudyDay`) is a JST (Asia/Tokyo) calendar day, switching at 00:00 JST — never derive it from UTC or server-local time.
- `DailySummary` (daily aggregation) is derived/computed on demand from `StudyLog`, never persisted (v1).
- Pomodoro fields (`mode`, `phase`, `configJson`, `setIndex`, etc.) live on `TimerSession` alongside plain stopwatch fields — `TimerMode` (`POMODORO` / `STOPWATCH`) determines which fields are meaningful.

### Database / migrations

- Prisma schema: `backend/prisma/schema.prisma`; config: `backend/prisma.config.ts`.
- **Always create a real migration for schema changes** (`prisma migrate dev --name ...`); never use `db push`.
- Migrations must preserve backward compatibility with existing data — no destructive changes (`DROP`, new `NOT NULL` without backfill) in a single step. For a breaking-looking change, follow the expand/contract sequence in `docs/architecture/MIGRATION_GUIDE.md`: add nullable column → backfill → switch app to new column (keep old readable) → add `NOT NULL` → drop old column later.
- When a design/schema decision is made, write an ADR under `docs/adr/` at decision time (not after implementing), following the existing ADRs' structure: background / decision / alternatives rejected / impact.

### Frontend (provisional — see note in "What this is")

- Next.js App Router; tab pages live under `frontend/app/(tabs)/{calendar,dashboard,projects,reminders,timer}/page.tsx`.
- Feature code (API clients, components, types) is organized under `frontend/features/<feature>/{api,components,types,utils}`, e.g. `frontend/features/dashboard/`, `frontend/features/reminders/`, `frontend/features/timer/`.
- Cross-feature UI helpers live in `frontend/lib/ui/` (`apiClient.ts`, per-feature `*Api.ts` wrappers, `theme.ts`, `uiTokens.ts`/`dashboardTokens.ts` for design tokens).
- Keep animation/visual tuning values centralized in one file per concern rather than scattered inline (existing project convention).
- Toast notifications should stay visually understated (small, subtle motion) — an explicit product preference, not a default to override.

## Docs worth reading before larger changes

- `docs/architecture/DOMAIN.md` — domain model, terms, invariants (read first).
- `docs/architecture/USECASE.md` — use-case-level contracts for timer/study-log/dashboard flows.
- `docs/architecture/DB_SCHEMA.md` / `DB_SCHEMA.sql` / `ERD.mmd` — schema reference.
- `docs/architecture/TIMER_STATE_MACHINE.mmd` — state diagram companion to ADR-015.
- `docs/adr/` — chronological design decisions; check for one before assuming a design question is still open.
- `docs/api/timer.md`, `docs/api/reminders.md` — endpoint-level API docs.

## 開発ログの運用

- 実装順序の各Step（例：`study-app-implementation-prompt-v3.md`に記載のStep1〜7）を完了したタイミングでは、`docs/dev-log/`配下に、そのStepで行った作業内容をmdファイルとして残すことを提案すること。
- ファイル名は`docs/dev-log/YYYY-MM-stepN-短い説明.md`の形式とする（例: `docs/dev-log/2026-07-step5-timer-reminders-ui.md`）。
- 内容は最低限、以下を含める：
  - 対象Stepと日付
  - 概要（何を目的にした作業か）
  - 変更ファイル一覧と各ファイルの責務
  - ADRの要否判断とその理由（要否に関わらず記載する）
  - ビルド確認結果（該当する場合）
  - 次のステップ
- `docs/adr/`とは役割が異なることを、各devlogファイルの冒頭に明記する（「これは設計判断の記録（ADR）ではなく、作業内容の記録（開発ログ）である」という趣旨）。
- Step完了時にこのdevlog作成をこちらから提案すること。作成するかどうかは依頼者の判断に委ねてよい。

## 作業完了時の確認ルール

- Chunk（意味のある実装の区切り）が完了したら、git statusとファイル中身の両方をセットで確認すること。
  diffの見た目が正しくても、実際にファイルへ反映されているとは限らない
  （過去に一度、承認済みの変更が実際には適用されずに次の作業へ進んでしまった事例あり）。
- フロントエンドとバックエンドをまたぐ実装（APIクライアント関数の追加等）では、
  HTTPメソッド（GET/POST/PATCH/DELETE等）がフロントエンド側の呼び出しとバックエンド側の
  ルート定義で一致しているか、実装完了時に必ず突き合わせて確認すること。

## コミット後のpush運用

- コミットは引き続きClaude Codeが行う。
- git pushは常にユーザー(まーくん)が手動で実行する。Claude Codeはpushを実行しない
  （このコンテナ環境にSSH鍵を置かない方針のため。バイブコーディング全般における
  セキュリティ意識維持のための原則的な判断）。
- コミット完了後は、コミットハッシュとメッセージを報告し、「pushしてください」と
  一言添えること。
