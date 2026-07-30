# 実装依頼：学習管理アプリ（Core基盤の拡張＋UI移植）

## 背景・対象リポジトリ（2つ）

- **バックエンド基盤**：`CresBloomoon/CPA-Dashboard-Core`
  - Node.js/Express + Prisma(v7) + PostgreSQL16。`backend/src/`配下は`routes/ → usecases/ → repositories/ → domain/`という層構造で、ADR（`docs/adr/`）に設計判断が記録されている。
  - Docker Compose構成済み（db: postgres:16 / backend: node:20-alpine / frontend: node:20-alpine, Next.js dev server）。
  - `TimerSession`はサーバー側で状態を持つ設計（ADR-004, ADR-012：Server-Authoritative）。タイマーの開始・停止は必ずサーバーで管理し、稼働中セッションはユーザーごとに最大1件。
  - `StudyLog`が学習記録の本体（`subjectId`, `startedAt`, `endedAt`, `durationSec`, `note`, `clientRequestId`, `createdAt`）。ADR-001により**作成のみ・編集削除不可**。
  - `Subject`は独立したエンティティ（`id`, `name`, `colorHex`, `sortOrder`, `isArchived`）。
  - `Reminder`は既存（`id`, `title`, `dueAt`, `doneAt`, `isDone`, `createdAt`, `updatedAt`）。
  - このリポジトリを**そのまま拡張のベースとする**。既存の`TimerSession`/`StudyLog`/`Subject`/`Reminder`のモデル・ADRの設計思想は変更しない。
  - 現状このリポジトリには`frontend/`（Next.js App Router + React 19）が既に同居しているが、これは初期設計段階のもので方針転換済み。**UIは`CPA-Dashboard`から移植する前提とし、Core側の`frontend/`は暫定物として扱う**（`calendar`/`projects`タブなど未実装部分を安易に拡張しないこと）。

- **UI移植元**：`CresBloomoon/CPA-Dashboard`
  - Python/FastAPI + React(Vite)。技術的には使わないが、**タイマー画面・リマインダー画面の見た目とインタラクション（UI/UX）だけを移植する**。
  - 移植対象：`frontend/src/features/timer/components/StudyTimer.tsx`とその周辺の見た目、既存のiOSライクなリマインダーのチェックボックス操作感。
  - API呼び出し部分はこのリポジトリの形をそのまま使わず、`CPA-Dashboard-Core`側のAPI仕様（Express + Prismaベース）に合わせて書き換えること。

## 開発者について（実装スタイルの前提）

- C#でのテスト駆動開発・ドメイン駆動設計の実務経験5年。Web開発（TypeScript/React/Next.js/Express/Prisma）は初心者。
- **コードはコメントで説明するのではなく、関数・クラス・コンポーネントの責務を細かく分割することで可読性を確保すること。** `Core`の既存の`usecases/repositories/domain`という層分けの流儀を踏襲し、新規追加分もこのパターンに厳密に従うこと。
- 依頼者自身がコードを読んで理解できることを重視する。既存のADR運用（`docs/adr/`に設計判断を記録する文化）があるので、大きな設計判断を伴う実装をした場合はADRを1本追加すること。
- 推測でのトラブルシューティングは行わないこと。エラー発生時は原因特定に必要なログ・ファイル・実行環境の情報を具体的に確認してから対処すること。

## 概念フレームワーク（設計の一貫性を保つための軸）

- **目的**：公認会計士試験に合格すること。「今のペースで間に合っているか」を感覚でなくファクトで判断できる状態を作る。
- **満たすべき質的特性**
  1. 即時性：今日何をすべきかが一発でわかる
  2. 蓄積性：日々の努力が消えず積み上がり、振り返れる（自信の源泉）
  3. 予測可能性：過去の所要時間データから、残り時間で間に合うかを見積れる

## 機能要件

### 1. タイマー（既存`TimerSession`/`StudyLog`を拡張）
- `StudyLog`に`note`（自由記述メモ、既存フィールドをそのまま使用、必須にしない）と、`linkedReminderId`（nullable、`Reminder`への任意リンク）を追加する。
- タイマー開始時・手動記録時に、両方任意で入力できるUIにする（`CPA-Dashboard`のタイマーUIをベースに、メモ入力欄とTodo選択欄を追加）。
- 手動入力モードにも同じ入力欄を用意する。

### 2. 振り返り（新規タブ、既存`StudyLog`を活用）
- 日別タイムライン：JST基準で日を区切り、`StudyLog`をその日の`startedAt`昇順で一覧表示。日付ナビゲーション（前日/翌日）で全期間を遡れるようにする（無限スクロールは不要）。
- 科目別累計棒グラフ（既存`SubjectChart`の見た目を移植）。
- 月次・年次の累計時間推移グラフも追加する。
- 日別タイムラインで`StudyLog.linkedReminderId`が設定されているログには、紐づく`Reminder`のタイトルと`UiCheckbox`（完了状態の表示・トグル）を並べて表示する。チェック操作は既存の`remindersApi.ts`のトグル処理を流用し、新規APIは追加しない（リマインダー・振り返り・ガントでの共通コンポーネント利用を徹底するための追記、2026-07-30）。

### 3. リマインダー（既存`Reminder`を拡張、デフォルトタブ）
- `Reminder`に`subjectTaskId`（nullable, 後述の`SubjectTask`への紐付け）と`reviewSeriesId`（nullable, 後述の`ReviewSeries`への紐付け）を追加する。
- 一覧は「今日期限のものを先頭」に並び替える。期限超過のリマインダーは日付を赤字にするなど視覚的に警告する。自動先送りは行わない。
- チェックボックスのUI/UXは、既存`Core`の`AnimatedCheckbox.tsx`ではなく、`CPA-Dashboard`側のiOSライクなチェックボックスを移植して使う。このコンポーネントは振り返りタブ・ガントタブでも共通して使い回すこと。

### 4. 学習スケジュール（ガント、新規タブ）
新規Prismaモデルを追加する。

```prisma
model Milestone {
  id           String   @id @default(uuid()) @db.Uuid
  name         String   @db.VarChar(200)
  deadlineDate DateTime @db.Date
  createdAt    DateTime @default(now())

  subjectTasks SubjectTask[]
}

model SubjectTask {
  id          String    @id @default(uuid()) @db.Uuid
  milestoneId String    @db.Uuid
  milestone   Milestone @relation(fields: [milestoneId], references: [id], onDelete: Cascade)
  subjectId   String    @db.Uuid
  subject     Subject   @relation(fields: [subjectId], references: [id])
  startDate   DateTime  @db.Date
  endDate     DateTime  @db.Date
  createdAt   DateTime  @default(now())

  reminders    Reminder[]
  reviewSeries ReviewSeries[]

  @@index([milestoneId])
  @@index([subjectId])
}

model ReviewRecipe {
  id           String   @id @default(uuid()) @db.Uuid
  name         String   @db.VarChar(200)
  intervalDays Int[]
  createdAt    DateTime @default(now())

  reviewSeries ReviewSeries[]
}

model ReviewSeries {
  id            String        @id @default(uuid()) @db.Uuid
  title         String        @db.VarChar(200)
  subjectId     String        @db.Uuid
  subject       Subject       @relation(fields: [subjectId], references: [id])
  baseDate      DateTime      @db.Date
  intervalDays  Int[]         // 作成時にRecipeからコピーして固定（後でRecipeを編集しても過去分に影響させない）
  recipeId      String?       @db.Uuid
  recipe        ReviewRecipe? @relation(fields: [recipeId], references: [id], onDelete: SetNull)
  subjectTaskId String?       @db.Uuid
  subjectTask   SubjectTask?  @relation(fields: [subjectTaskId], references: [id], onDelete: SetNull)
  createdAt     DateTime      @default(now())

  reminders Reminder[]
}
```

`Reminder`, `Subject`, `StudyLog`側にも逆方向のリレーションを追加すること（Prismaの作法に従う）。

**機能仕様**
- マイルストーンは複数登録できるが、運用上は「1つが終わったら次」という使い方が実態。UIは全マイルストーンを横並びで見れる必要はなく、直近のアクティブなものを中心に据えてよい。
- 本番の公認会計士試験の日付も、最大のマイルストーンとして登録できるようにする。
- `Milestone`ごとに`SubjectTask`（科目バー）を複数持てる。各`SubjectTask`は独自の`startDate`/`endDate`を持ち、マイルストーンの期限をまたいでもよい。依存関係（あるタスクが終わらないと次に進めない、等）は実装しない。
- 締切日は赤い縦線でガント上に明示する。
- `SubjectTask`に紐づく`Reminder`は、畳んだ状態では「完了数／全体数」のバッジ（例：3/5）のみ表示する。バーをタップすると展開し、チェックボックス＋タイトルのみのリストが出る（期限日はここには表示しない。期限日はリマインダータブでのみ表示）。
- 進捗率（完了数／全体数）に加えて、**直近の消化ペースから残りの完了見込み日を計算し、`SubjectTask.endDate`と比較して「順調/遅延」を受動的な色・アイコンで示す**機能を追加する。計算方法：直近14日間で完了させたリマインダー件数の1日あたり平均 × 残件数の逆算で見込み日数を出し、`endDate`と比較する。能動的な通知やアラートは不要（バーを見た時に気づける程度でよい）。

### 5. 復習レシピ（新規、Anki的な間隔反復をリマインダーで実現）
- `ReviewRecipe`の設定画面：名前（自由記述）＋間隔日数の配列（例：[1, 3, 7, 20]）を登録・編集できる。
- `ReviewSeries`作成画面：レシピを選択し、タイトル（例：「【財計】25章」）・科目・起点日（`baseDate`）・（任意で）紐付ける`SubjectTask`を指定すると、選んだレシピの`intervalDays`をコピーして`ReviewSeries`を作成し、同時に`baseDate + 各interval日数`の日付で`Reminder`を一括生成する（`reviewSeriesId`で紐付け、`subjectTaskId`があれば併せて設定）。日付計算は既存の`backend/src/domain/time.js`の`addJstDays`を使うこと。

## 事前準備（Claude Code起動前）

- 参照元の2つのリポジトリは、既にコンテナ内`/workspace/CPA-Dashboard`と`/workspace/CPA-Dashboard-Core`にクローン済み（ホスト側の実体は`/mnt/files/repos/`配下）。
- 新規の実装用リポジトリ`study-tracker-app`も、GitHub上に作成の上、同じ`/workspace/`配下にcloneし、そのディレクトリでClaude Codeを起動する。
- 起動時、参照用の2リポジトリを`--add-dir`で追加すること：

```bash
cd /workspace/study-tracker-app
claude --add-dir /workspace/CPA-Dashboard-Core --add-dir /workspace/CPA-Dashboard
```

- `CPA-Dashboard-Core`と`CPA-Dashboard`は**参照専用**として扱うこと。実装・編集はすべて新規リポジトリ（`study-tracker-app`）側で行い、参照元2リポジトリの内容は変更しない。

## フロントエンドのルーティング・タブ構成の具体的な変更

- 認証機能は実装しない。単一ユーザー（依頼者本人のみ）が使うことを前提とし、ログイン画面・ユーザーモデル・セッション管理は一切追加しないこと。
- `frontend/lib/ui/tabNavConfig.ts`の`TAB_NAV.items`を以下のように変更する。

```ts
items: [
  { href: "/reminders", label: "リマインダ" },   // デフォルトタブとして先頭に
  { href: "/review", label: "振り返り" },        // 新規
  { href: "/timer", label: "タイマー" },
  { href: "/schedule", label: "学習スケジュール" }, // 新規（ガント）
] as const,
```
  - `/dashboard`（既存の学習時間タブ）、`/calendar`、`/projects`は削除する（対応する`frontend/app/(tabs)/dashboard`, `calendar`, `projects`配下のページも削除、または`review`/`schedule`に置き換える）。
  - アプリのルート（`frontend/app/page.tsx`など、`/`へのアクセス時の挙動）を`/reminders`へのリダイレクトに変更し、リマインダータブがデフォルトで開くようにする。
- 新規ページは、既存の`frontend/app/(tabs)/`配下の構成に倣い、`frontend/app/(tabs)/review/page.tsx`と`frontend/app/(tabs)/schedule/page.tsx`として追加する。
- 新規APIとの通信は、既存の`frontend/lib/ui/apiClient.ts`や`frontend/lib/ui/remindersApi.ts`と同じパターン（同様のヘルパー関数構成）に倣って、`reviewApi.ts`・`scheduleApi.ts`のような形で追加すること。
- `CPA-Dashboard`側のタイマー・リマインダーUIコンポーネントを移植する際は、内部のAPI呼び出し部分をこの`apiClient.ts`ベースの通信層に差し替えること（`CPA-Dashboard`側のFastAPI向けの呼び出しコードはそのまま使わない）。

## 明示的にスコープ外とするもの
- タスク単位の見積時間・実績時間の差異分析
- 科目別・日別の時間ベースの目標設定
- ストリーク機能
- プロジェクト管理機能
- 個別カレンダータブ（ガントに統合済み）
- Google Calendar / Google Tasks連携
- トロフィー・実績機能
- プッシュ通知
- 既存Anki自動生成アプリとの連携
- `StudyLog`の編集・削除機能
- 認証・ユーザー管理機能（単一ユーザー前提）

## 実装順序の希望
1. Prismaスキーマへのモデル追加（`Milestone`, `SubjectTask`, `ReviewRecipe`, `ReviewSeries`、および`StudyLog`/`Reminder`へのフィールド追加）とマイグレーション作成
2. 対応する`repositories/`・`usecases/`・`routes/`の追加（既存の`StudyLogRepository`/`CreateStudyLogUseCase`/`studyLog.routes.js`の実装パターンを踏襲）
3. リマインダー一覧の並び替え（今日期限優先）と期限超過表示
4. `ReviewRecipe`/`ReviewSeries`のCRUDと一括Reminder生成ロジック
5. フロントエンド：`CPA-Dashboard`のタイマー・リマインダーUIを移植し、Core側のAPIに接続
6. 振り返りタブ（日別タイムライン、科目別累計、月次・年次推移グラフ）
7. 学習スケジュール（ガント）タブ（マイルストーン、科目バー、進捗バッジ、展開パネル、遅延判定表示）

**Step8**：復習レシピ（`ReviewRecipe`/`ReviewSeries`）のフロントエンドUI（設定画面・ReviewSeries作成画面）
   - 機能要件5には元々UI要件が明記されていたが、実装順序リストへの記載漏れがあったため、Step8として追加（2026-07-30）

各ステップの実装後、何を実装したか・どのファイルにどんな責務を持たせたか・大きな設計判断をした場合はADRの要否も含めて簡潔に説明すること。

