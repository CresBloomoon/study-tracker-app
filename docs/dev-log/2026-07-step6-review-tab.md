# Step6: 振り返りタブ

> **注記**: これは設計判断の記録（ADR）ではなく、作業内容の記録（開発ログ）である。設計判断そのものは`docs/adr/`配下のADRを参照すること。

- 日付: 2026-07-29
- 対象Step: Step6（振り返りタブ：日別タイムライン、科目別累計棒グラフ、月次・年次推移グラフ）

## 概要

`frontend/app/(tabs)/review/page.tsx`のプレースホルダーを、日別タイムライン・科目別累計棒グラフ・月次年次推移グラフの3機能を持つ本実装に置き換えた。集計ロジックはすべてバックエンドのusecase層に寄せ、フロントエンドは受け取ったデータをそのまま描画するだけにした。

## 変更ファイル一覧と責務

### バックエンド

| ファイル | 責務 |
|---|---|
| `backend/src/domain/time.js` | `toJstMonthKey`/`toJstYearKey`を追加。既存`toJstDateKey`の薄いラッパーで、JST変換ロジックの重複なし |
| `backend/src/repositories/StudyLogRepository.js` | `sumRoundedMinutesBySubjectAllTime()`（全期間版の科目別集計）、`findAllStartedAtAndDuration()`（月次・年次バケット化の元データ取得）を追加 |
| `backend/src/usecases/GetSubjectBreakdownUseCase.js`（新規） | 科目別累計時間の集計、科目名/色の解決（`GetDashboardSummaryUseCase`と同じ解決パターン） |
| `backend/src/usecases/GetMonthlyStudyTrendUseCase.js`（新規） | 月次推移（記録開始月〜現在月まで、データが無い月も0で埋めて欠損なく並べる） |
| `backend/src/usecases/GetYearlyStudyTrendUseCase.js`（新規） | 年次推移（同上、年単位） |
| `backend/src/routes/review.routes.js`（新規） | `GET /api/review/subject-breakdown`, `/monthly-trend`, `/yearly-trend` |
| `backend/src/app.js` | `reviewRouter`を登録 |

日別タイムラインは既存の`GET /api/study-log?date=...`（`GetStudyLogByDateUseCase`、`startedAt`昇順で返す）をそのまま利用しており、バックエンドの新規追加はない。

### フロントエンド

| ファイル | 責務 |
|---|---|
| `frontend/lib/ui/reviewApi.ts`（新規） | 上記3エンドポイント＋既存`/api/study-log`のラッパー、`listAllSubjects` |
| `frontend/lib/ui/jstDate.ts`（新規） | フロント側でJST暦日を扱う最小限のヘルパー（`jstDateKeyOf`/`shiftDateKey`）。`RemindersPanel.tsx`にあった重複ロジックもここに統合した |
| `frontend/features/reminders/components/RemindersPanel.tsx` | ローカル実装していた`jstDateKey`を`jstDate.ts`の`jstDateKeyOf`に置き換え |
| `frontend/features/review/hooks/useDailyTimeline.ts`（新規） | 日別タイムラインのデータ取得・日付ナビゲーション状態を集約 |
| `frontend/features/review/components/DailyTimeline.tsx`／`DailyTimelineHeader.tsx`／`StudyLogEntryRow.tsx`（新規） | 日別タイムラインUI（前日/翌日ナビゲーション付き） |
| `frontend/features/review/hooks/useSubjectBreakdown.ts`（新規） | 科目別累計データ取得 |
| `frontend/features/review/components/SubjectBreakdownChart.tsx`（新規） | 科目別累計棒グラフ。CPA-Dashboardの`SubjectChart`の見た目を移植し、色は科目ごとの実データ（`colorHex`）をそのまま使用（ハードコードされた科目名→Tailwindクラスのマッピングは踏襲しない） |
| `frontend/features/review/hooks/useStudyTrend.ts`（新規） | 月次・年次推移データ取得。共通ロジック1つ＋2つの薄いラッパー（`useMonthlyTrend`/`useYearlyTrend`） |
| `frontend/features/review/components/TrendBarChart.tsx`（新規） | 月次・年次で共用する縦棒グラフ（単一系列のため色は`--accent`固定） |
| `frontend/features/review/components/MonthlyTrendSection.tsx`／`YearlyTrendSection.tsx`（新規） | `TrendBarChart`の薄いラッパー |
| `frontend/app/(tabs)/review/page.tsx` | プレースホルダーから、上記4コンポーネントを並べた本実装に置き換え |

## ADRの要否判断とその理由

判断：**不要**。

集計ロジックをどこに置くか（バックエンドのusecase層に寄せる／DBに保存せずStudyLogから毎回オンデマンド計算する）という、今回の実装で最も設計判断らしい部分は、**既に`ADR-002`（DailySummaryはDBに保存せず派生データとして扱う）が明示的にカバーしている**。ADR-002は「週次・月次の集計についても、DailySummaryまたはStudyLogの再集計で対応する」「集計ロジックはアプリケーション層（UseCase）に置く」と既に決定しており、Step6の月次・年次推移機能はこの決定をそのまま新しいユースケース（月次・年次）に適用しただけで、新しい決定を行っていない。

その他の選択（科目別累計を全期間累計として扱う、フロント側のJSTヘルパーを共通化する、コンポーネントをフック＋薄い描画層に分割する等）は、Step5と同様に製品スコープ上の選択やフロントエンドのコード整理であり、ドメイン設計判断の記録であるADR群と同列に扱う重みではないと判断した。

## ビルド確認結果

`docker compose exec frontend npm run build` が3回（チャンクごと）とも成功。最終状態のルートサイズ:

```
Route (app)                              Size     First Load JS
○ /review                               3.14 kB  105 kB
```

日別タイムライン→科目別累計棒グラフ→月次・年次推移グラフの追加に伴い、`/review`のバンドルサイズが 2.1kB → 2.6kB → 3.14kB と段階的に増加していることを確認済み。バックエンドの新規3エンドポイント（`/api/review/subject-breakdown`, `/monthly-trend`, `/yearly-trend`）は実データに対して直接叩いて動作確認済み。

## 次のステップ

- Step7: 学習スケジュール（ガント）タブ（マイルストーン、科目バー、進捗バッジ、展開パネル、遅延判定表示）
