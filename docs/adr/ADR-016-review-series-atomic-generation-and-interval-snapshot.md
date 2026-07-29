# ADR-016: ReviewSeries作成とReminder一括生成のアトミック性、およびintervalDaysスナップショット方針

- Status: Accepted
- Date: 2026-07-28

## Context

- `ReviewSeries`は、`ReviewRecipe`（復習間隔テンプレート）を特定のトピック（例:「【財計】25章」）に適用したインスタンスであり、作成と同時に`intervalDays`の各値に基づいて`Reminder`を一括生成する（Step4要件）。
- `Reminder`生成には、`baseDate`に対する`intervalDays`の日数分のJST日付計算（`addJstDays`）を伴い、`intervalDays`の要素数だけ`Reminder`のINSERTが発生する。
- もし`ReviewSeries`作成後に`Reminder`生成の一部が失敗した場合（DB接続断、制約違反など）、`ReviewSeries`だけが存在して`Reminder`が0件〜N-1件しかない、という不整合な中間状態が生まれうる。復習管理という機能の性質上、`Reminder`が一部欠けることは「復習を忘れる」という実害に直結する。
- `intervalDays`は`ReviewRecipe`というテンプレートから複製される。`ReviewRecipe`は「設定画面で登録・編集できる」（Step4要件）ため、後から`intervalDays`の値が変更されうる。`ReviewSeries`が常に`ReviewRecipe`を参照する設計だと、過去に作成した`ReviewSeries`の意味（いつ復習すべきだったか）が、後からの`ReviewRecipe`編集によって遡って変わってしまう。

## Decision

以下2点を採用する。

1. **`ReviewSeries`作成と`Reminder`一括生成は`prisma.$transaction`内で単一のアトミック操作として扱う**
   - `CreateReviewSeriesUseCase`内で、`ReviewSeries`本体のINSERTと`intervalDays`分の`Reminder`のINSERTを同一トランザクション内で実行する
   - トランザクション内では`repositories`を経由せず、`tx.model.create()`をusecaseから直接呼ぶ（既存の`AdvanceTimerUseCase`が採用している方式をそのまま踏襲）
   - 部分失敗（`ReviewSeries`だけ存在して`Reminder`が一部しかない状態）を許容しない、という設計判断である

2. **`intervalDays`は`ReviewSeries`作成時点で`ReviewRecipe`からコピーし、`ReviewSeries`自身のカラムにスナップショットとして固定する**
   - `ReviewSeries.recipeId`はnullable（`onDelete: SetNull`）とし、`ReviewRecipe`が削除されても`ReviewSeries`および生成済み`Reminder`は残る
   - `ReviewRecipe`を後から編集しても、それ以前に作成済みの`ReviewSeries`の`intervalDays`には影響しない

## Alternatives Considered

- **トランザクションを使わない案**：`ReviewSeries`作成後、`Reminder`をループで個別に作成する方式も考えられたが、途中でエラーが起きた場合に「`ReviewSeries`は存在するが`Reminder`が不完全」という状態がAPIレスポンス上区別できないまま残ってしまう。復習の抜け漏れという実害に直結するため採用しなかった。
- **`intervalDays`をコピーせず`recipeId`経由で都度参照する案**：`ReviewSeries`に`intervalDays`を持たせず、表示のたびに`recipe.intervalDays`を参照する設計も検討したが、`ReviewRecipe`を編集した際に過去の`ReviewSeries`の意味が変わってしまい、要件（「後でRecipeを編集しても過去分に影響させない」）に反するため採用しなかった。

## Consequences

### Pros
- `Reminder`生成の部分失敗によるデータ不整合（`ReviewSeries`だけ存在して`Reminder`が欠けている状態）が起きない
- `ReviewRecipe`を自由に編集・改善しても、過去の`ReviewSeries`の復習スケジュールの意味が変わらない（再現性・説明可能性が保たれる）

### Cons / Risks
- トランザクション内での`Reminder`一括作成は、`intervalDays`の要素数が多いほどトランザクションの実行時間が伸びる（v1のユースケース規模では問題にならない想定）
- `intervalDays`をコピーするため、`ReviewSeries`と元の`ReviewRecipe`の`intervalDays`は将来的に乖離しうる。これは意図した挙動だが、UI側で「このSeriesは元のRecipeから変更されている」ことを示す手段は現状ない

### Notes
- 日付計算は`domain/time.js`の`addJstDays`を使用し、他のJST日付処理と実装を揃えている
- 本ADRはStep1で追加済みのPrismaモデルをそのまま使うため、新たなDBスキーマ変更・マイグレーションは伴わない
