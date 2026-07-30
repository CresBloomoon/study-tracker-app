# Step7: 学習スケジュール（ガント）タブ

> **注記**: これは設計判断の記録（ADR）ではなく、作業内容の記録（開発ログ）である。設計判断そのものは`docs/adr/`配下のADRを参照すること。

- 日付: 2026-07-30
- 対象Step: Step7（学習スケジュール／ガントタブ：マイルストーン・科目バー、進捗バッジ、展開パネル、遅延判定表示）

## 概要

`frontend/app/(tabs)/schedule/page.tsx`のプレースホルダーを、マイルストーン・科目バーのガント表示、進捗バッジと展開パネル、遅延判定表示を持つ本実装に置き換えた。着手前に、依頼書に記載されていたPrismaスキーマ変更（`Milestone`/`SubjectTask`/`ReviewRecipe`/`ReviewSeries`の追加）がすでにStep1・Step4で実装済みであることが判明し、スキーマ変更なしで進めた。

## 変更ファイル一覧と責務

### Chunk1: スキーマ確認

新規のPrismaモデル・マイグレーションは不要と判断（詳細は依頼者とのやり取りを参照）。実装対象のモデルはすべてStep1（`Milestone`/`SubjectTask`/`Reminder`の紐付けフィールド）・Step4（`ReviewRecipe`/`ReviewSeries`）で既に存在していた。

### Chunk2: バックエンド（進捗集計・遅延判定・展開パネル用API）

| ファイル | 責務 |
|---|---|
| `backend/src/domain/subjectTaskProgress.js`（新規） | 進捗・遅延判定の純粋関数`computeSubjectTaskProgress()`。5状態（`NO_REMINDERS`/`COMPLETE`/`NO_PACE_DATA`/`ON_TRACK`/`DELAYED`）を判定 |
| `backend/src/repositories/ReminderRepository.js` | `countTotalForSubjectTask`/`countDoneForSubjectTask`/`countRecentlyCompletedForSubjectTask`/`findBySubjectTaskId`を追加 |
| `backend/src/usecases/GetMilestoneUseCase.js` | 各`subjectTasks[]`要素に`progress`（進捗+遅延判定）を追加フィールドとして付与するよう拡張 |
| `backend/src/usecases/ListSubjectTaskRemindersUseCase.js`（新規） | 展開パネル用、期限日を含まないチェックボックス+タイトルのみのリスト取得 |
| `backend/src/routes/subjectTasks.routes.js` | `GET /api/subject-tasks/:id/reminders`を追加 |

実装中に発見・修正した実際のバグ：`totalCount=0`（Reminder未紐付け）のSubjectTaskが「COMPLETE」と誤判定されていたのを、実データでの動作確認で発見し`NO_REMINDERS`状態を独立させて修正した。

### Chunk3: フロントエンドAPI通信層

`frontend/lib/ui/scheduleApi.ts`（新規）：`listMilestones`/`getMilestone`/`createMilestone`/`createSubjectTask`/`listSubjectTaskReminders`。`apiClient.ts`の`apiGet`/`apiPost`を使用し、`reviewApi.ts`と同じパターン。

### Chunk4: マイルストーン/科目バーUI

| ファイル | 責務 |
|---|---|
| `frontend/lib/ui/jstDate.ts` | `dateKeyToTimestamp`を追加（ガントの位置計算用） |
| `features/schedule/hooks/useMilestoneList.ts` | マイルストーン一覧取得＋「直近のアクティブなもの」自動選定（締切日が今日(JST)以降で最も近いもの、無ければ最新にフォールバック、手動切替可） |
| `features/schedule/hooks/useMilestoneDetail.ts` | 選択中マイルストーンの詳細（科目バー+進捗）取得 |
| `features/schedule/components/GanttChart.tsx` | 締切日の赤い縦線、科目バーの位置・幅を日付から算出 |
| `features/schedule/components/SubjectTaskBar.tsx` | 科目バー本体（進捗バッジ表示） |
| `features/schedule/components/MilestoneSelector.tsx` | マイルストーン切替セレクタ |
| `features/schedule/components/CreateMilestoneForm.tsx`／`CreateSubjectTaskForm.tsx` | マイルストーン・科目バーの作成フォーム（本番試験日も同じフォームで登録可能） |
| `features/schedule/components/ScheduleForm.styles.ts` | 上記2フォームで共用するスタイル定数 |
| `features/schedule/components/ScheduleTab.tsx` | 上記を束ねる最上位コンポーネント |

### Chunk5: 進捗バッジの展開パネル

| ファイル | 責務 |
|---|---|
| `features/schedule/hooks/useSubjectTaskReminders.ts`（新規） | 展開時にのみ取得する遅延ロード、トグル後に親（マイルストーン詳細）の進捗再取得をトリガー |
| `features/schedule/components/SubjectTaskExpandPanel.tsx`（新規） | チェックボックス+タイトルのみのリスト。チェックボックスはStep5で共通化済みの`UiCheckbox`をそのまま使用（新規実装なし） |
| `SubjectTaskBar.tsx` | バッジタップで展開/折りたたみできるように変更 |

### Chunk6: 遅延判定表示

| ファイル | 責務 |
|---|---|
| `features/schedule/components/PaceIndicator.tsx`（新規） | `paceStatus`を受動的な色・アイコンで表示（能動的な通知・アラートなし） |
| `SubjectTaskBar.tsx` | 進捗バッジの隣にペースアイコンを追加。科目カラー背景でも視認できるよう白背景の丸チップに乗せる |

## ADRの要否判断とその理由

判断：**必要と判断し、`ADR-017`を追加した**。

Step5・Step6と異なり、今回は以下の3点がドメインロジック・API設計に関わる明示的な決定であり、`docs/adr/`の既存ADR群（ADR-002の派生データ方針、ADR-012〜015のタイマー設計等）と同格の重みがあると判断した。

1. 遅延判定の計算式をbackendの`domain/subjectTaskProgress.js`に純粋関数として実装し、フロントエンドでは再計算しない方針
2. 進捗+遅延判定データを`SubjectTask`ごとの個別エンドポイントではなく、`GET /api/milestones/:id`にバンドルする設計（N+1回避のため）
3. `paceStatus`を2値/3値ではなく5値（`NO_REMINDERS`/`COMPLETE`/`NO_PACE_DATA`/`ON_TRACK`/`DELAYED`）に切り分けた判断（実データ検証で見つけたNO_REMINDERSバグの経緯を含む）

詳細は`docs/adr/ADR-017-subject-task-pace-and-progress-design.md`を参照。

## ビルド確認結果

Chunk4〜6それぞれで`docker compose exec frontend npm run build`が成功。最終状態のルートサイズ:

```
Route (app)                              Size     First Load JS
○ /schedule                             4.31 kB  ...
```

Chunk4→5→6でバンドルサイズが 3.33kB → 4.05kB → 4.31kB と段階的に増加していることを確認済み。他ルート（`/reminders`, `/review`, `/timer`）のサイズは変化なし。バックエンドの新規エンドポイント（`GET /api/milestones/:id`の`progress`拡張、`GET /api/subject-tasks/:id/reminders`）は実データに対して直接叩いて動作確認済み（`NO_REMINDERS`/`NO_PACE_DATA`の実際の分岐を確認）。

## 次のステップ

Step1〜7、すべて実装完了。依頼書の実装順序の希望に記載された機能はこれで一通り揃った。今後の作業（追加機能・改善・リファクタリング等）は別途相談。
