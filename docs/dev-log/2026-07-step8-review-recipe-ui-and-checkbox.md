# Step8: 復習レシピ(ReviewRecipe/ReviewSeries)のフロントエンドUI + 振り返りタブのUiCheckbox統合

> **注記**: これは設計判断の記録（ADR）ではなく、作業内容の記録（開発ログ）である。設計判断そのものは`docs/adr/`配下のADRを参照すること。

- 日付: 2026-07-31
- 対象Step: Step8（1. 復習レシピ（ReviewRecipe/ReviewSeries）のフロントエンドUI、2. 振り返りタブでのUiCheckbox使用）

## 概要

Step4までにバックエンドが完成していた`ReviewRecipe`/`ReviewSeries`に対し、フロントエンドの設定画面・作成画面を新規実装した（Part1）。あわせて、振り返りタブの日別タイムラインで`StudyLog.linkedReminderId`が設定されているログに、紐づくReminderのタイトルと完了状態トグル（`UiCheckbox`）を表示できるようにした（Part2）。

着手前の前提整備として、ReviewRecipeの削除（DELETE）機能がバックエンド側に存在しないことを確認し、既存の`routes → usecases → repositories`の層構造に従って`DeleteReviewRecipeUseCase`と`DELETE /api/review-recipes/:id`を追加した（このリポジトリ・`CPA-Dashboard-Core`ともに初めてのDELETE実装であり、他リソースへの展開は`docs/specs/study-app-implementation-prompt-v3.md`のStep9として着手時期未定のまま切り出した）。

## 変更ファイル一覧と責務

### 前提整備: ReviewRecipeのDELETE機能（バックエンド）

| ファイル | 責務 |
|---|---|
| `backend/src/repositories/ReviewRecipeRepository.js` | `deleteById(id)`を追加 |
| `backend/src/usecases/DeleteReviewRecipeUseCase.js`（新規） | 存在チェック後に削除。`ReviewSeries.recipeId`は`onDelete: SetNull`のため連鎖削除なし |
| `backend/src/routes/reviewRecipes.routes.js` | `DELETE /api/review-recipes/:id`を追加 |

### Part1: 復習レシピ/復習シリーズのフロントエンドUI

| ファイル | 責務 |
|---|---|
| `frontend/lib/ui/apiClient.ts` | `apiPatch`/`apiDelete`ヘルパーを追加 |
| `frontend/lib/ui/reviewRecipesApi.ts`（新規） | ReviewRecipeのCRUD薄ラッパー |
| `frontend/lib/ui/reviewSeriesApi.ts`（新規） | ReviewSeriesの一覧取得・作成薄ラッパー |
| `frontend/lib/ui/formStyles.ts`（新規） | Step7の`features/schedule/components/ScheduleForm.styles.ts`を統合・共通化したフォームスタイル定数（`CreateMilestoneForm.tsx`/`CreateSubjectTaskForm.tsx`のimportもあわせて更新） |
| `frontend/features/reviewRecipes/hooks/useReviewRecipes.ts`（新規） | レシピ一覧の取得・再取得状態管理 |
| `frontend/features/reviewRecipes/components/ReviewRecipeForm.tsx`（新規） | 名前＋間隔日数（カンマ区切りテキスト⇔配列変換）の新規/編集共用フォーム |
| `frontend/features/reviewRecipes/components/ReviewRecipeRow.tsx`（新規） | レシピ1件の表示、編集モード切替、削除（確認ダイアログあり） |
| `frontend/features/reviewRecipes/components/ReviewRecipeSettings.tsx`（新規） | 設定画面オーケストレータ |
| `frontend/features/reviewSeries/hooks/useCreateReviewSeriesForm.ts`（新規） | レシピ/科目/マイルストーン一覧取得、マイルストーン選択時の科目バー取得、科目バー選択時の科目自動連動、送信ロジック |
| `frontend/features/reviewSeries/components/CreateReviewSeriesForm.tsx`（新規） | シリーズ作成フォーム（レシピ・タイトル・科目・起点日・任意でマイルストーン/科目バー） |
| `frontend/features/reviewSeries/components/GeneratedRemindersList.tsx`（新規） | 作成成功後に自動生成されたReminder一覧を表示 |
| `frontend/app/(tabs)/reminders/recipes/page.tsx`（新規） | `ReviewRecipeSettings`のページ |
| `frontend/app/(tabs)/reminders/series/new/page.tsx`（新規） | `CreateReviewSeriesForm`のページ |
| `frontend/features/reminders/components/RemindersPanel.tsx` | サイドバー下部に「復習レシピ設定」「復習シリーズを作成」の2リンクを追加（導線） |

配置・導線: トップレベルタブ（`TAB_NAV`）は4つ固定のため増やさず、リマインダータブ（`/reminders`）のサイドバーからネストしたサブページ（`/reminders/recipes`、`/reminders/series/new`）として遷移する構成にした。

### Part2: 振り返りタブでのUiCheckbox使用

| ファイル | 責務 |
|---|---|
| `frontend/features/review/hooks/useDailyTimeline.ts` | マウント時に一度だけ`listReminders("all")`を取得し`reminderMap`（id→Reminder）を構築。`toggleReminderDone`が既存の`markDone`/`markUndone`を呼び、返却値でローカル状態を更新 |
| `frontend/features/review/components/DailyTimeline.tsx` | `reminderMap`/`toggleReminderDone`を`StudyLogEntryRow`に橋渡し |
| `frontend/features/review/components/StudyLogEntryRow.tsx` | `item.linkedReminderId`が解決できた場合のみ、Reminderのタイトルと`UiCheckbox`（Step5でCPA-Dashboardから移植したiOSライクなコンポーネント）を並べて表示 |

新規バックエンドAPIは追加していない。既存の`remindersApi.ts`（`listReminders`/`markDone`/`markUndone`）をそのまま再利用した。

## ADRの要否判断とその理由

判断：**不要**。

- 前提整備のDELETE機能は、既存の`routes → usecases → repositories`層構造をそのまま踏襲した実装であり、新しい設計判断ではない（他リソースへの展開方針自体は`docs/specs/study-app-implementation-prompt-v3.md`のStep9に文書化済み）。
- Part1は、既存のAPIクライアント層・フォームコンポーネントの慣習（Step7の`CreateSubjectTaskForm.tsx`等）を踏襲したフロントエンド実装であり、新しいドメイン/API設計判断は発生していない。マイルストーン選択→科目バー選択時にReviewSeriesの`subjectId`をそのタスクの`subjectId`へ自動連動させる挙動は、UX上の簡便化でありドメインルールの変更ではない。
- Part2は「リマインダーを日付非依存としてマウント時に一度だけ取得する」という選択のみで、フロントエンドのデータ取得方針の範囲内の判断。バックエンドAPIの追加・変更は一切ない。

## ビルド確認結果

`docker compose exec frontend npm run build`をまーくんの手元環境で実施し、成功を確認。

```
Compiled successfully in 43s
Linting and checking validity of types ✓
Collecting page data ✓
Generating static pages (10/10) ✓
```

エラー・警告なし。`/reminders/recipes`、`/reminders/series/new`を含む全10ルートが正常にビルドされていることを確認済み。

バックエンドのDELETEエンドポイントは`node --check`と`createApp()`の起動テストで構文・起動を確認したのみで、実際のHTTPリクエストによる動作確認は未実施。

## 次のステップ

Step1〜8が実装完了。バックエンドのReviewRecipe DELETE機能（前提整備分）は本devlog作成時点でまだ未コミット。他リソース（Subject/Milestone/SubjectTask/Reminder）へのDELETE機能展開は、`docs/specs/study-app-implementation-prompt-v3.md`のStep9として着手時期未定のまま残っている。
