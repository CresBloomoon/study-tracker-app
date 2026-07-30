# ADR-017: SubjectTaskの進捗集計・遅延判定ロジックとAPI設計

- Status: Accepted
- Date: 2026-07-30

## Context

Step7（学習スケジュール／ガントタブ）で、`SubjectTask`（科目バー）ごとに以下を表示する必要があった。

- 進捗バッジ（紐づく`Reminder`の完了数／全体数）
- 「直近14日間の消化ペースから残りの完了見込み日を逆算し、`SubjectTask.endDate`と比較して順調/遅延を示す」という受動的な遅延判定表示

この計算をどこに実装するか（backend/frontendのどちらに寄せるか）、どのAPI形状で配信するか、判定結果として何種類の状態を区別するかは、いずれもコードを書く前に明示的にすり合わせを行った設計判断であり、実装の途中で偶然そうなったものではない。

## Decision

### 1. 計算ロジックの置き場所

進捗集計・遅延判定は`backend/src/domain/subjectTaskProgress.js`の`computeSubjectTaskProgress()`という**純粋関数**として実装した。

- 入力: `{ doneCount, totalCount, recentlyCompletedCount, endDate, now }`（すべて呼び出し側が用意する値。DBアクセスを一切含まない）
- 出力: `{ estimatedFinishDate, paceStatus }`
- 日付計算は既存の`domain/time.js`（`addJstDays`/`toJstDateKey`）をそのまま再利用し、JST変換ロジックを重複実装していない
- `GetMilestoneUseCase`が、`ReminderRepository`から取得した件数（`countTotalForSubjectTask`/`countDoneForSubjectTask`/`countRecentlyCompletedForSubjectTask`、いずれも新規追加）をこの関数に渡してSubjectTaskごとの進捗を組み立てる
- **フロントエンドでの再計算は行わない**。バックエンドが計算済みの`estimatedFinishDate`/`paceStatus`をそのまま返し、フロントは表示するだけ

### 2. API設計：Milestone詳細に進捗をバンドルする

`GET /api/milestones/:id`（既存の`GetMilestoneUseCase`）を拡張し、各`subjectTasks[]`要素に`progress: { doneCount, totalCount, estimatedFinishDate, paceStatus }`を追加フィールドとして含めた。

`SubjectTask`ごとに個別エンドポイント（例: `GET /api/subject-tasks/:id/progress`）を新設する案もあったが、採用しなかった。ガント画面は1つのマイルストーンに属する全SubjectTaskバーを同時に表示するため、個別エンドポイント方式だとフロントエンドがN+1回のAPI呼び出しを行うことになる。既存の`GetDashboardSummaryUseCase`が複数リポジトリ呼び出しを1つの応答に合成する前例（`Promise.all`でのオーケストレーション）に倣い、1回のfetchでガント画面全体を描画できるようにした。

既存の`subjectTasks[]`のフィールド（`id`/`subjectId`/`startDate`/`endDate`/`createdAt`）は変更せず、`progress`を追加フィールドとして載せているだけなので、APIの安定契約（既存フィールドを消さない）は守られている。

### 3. 状態の切り分け：5種類の`paceStatus`

`paceStatus`は次の5値とし、安易に2値（順調/遅延）や3値には圧縮しなかった。

- `NO_REMINDERS`: このSubjectTaskにReminderが1件も紐付いていない
- `COMPLETE`: 1件以上あり、すべて完了済み
- `NO_PACE_DATA`: 未完了のReminderが残っているが、直近14日間の完了実績が0件でペースが算出できない
- `ON_TRACK`: 見込み完了日が`endDate`以前
- `DELAYED`: 見込み完了日が`endDate`より後

`NO_REMINDERS`と`COMPLETE`を区別する理由：実装中に見つけた実際のバグとして、両者を同じ「残件数0」判定に丸めると、Reminderを1件も紐付けていないSubjectTaskが「✓ 完了」と表示されてしまい、「全部やり終えた」のか「まだ何も登録していない」のか判別できなくなる（実データでの動作確認時に発見・修正済み）。

`NO_PACE_DATA`を`DELAYED`に含めない理由：直近14日間ペースが0件（＝計算不能）なのを機械的に「遅延」と断定すると、「本当に遅れている」のか「たまたま直近14日間だけ手を付けていない」のかが見分けられなくなる。ユーザーとの確認の結果、実態に忠実な設計として独立した状態にすることを選んだ。

## Alternatives Considered

- **順調/遅延の2値のみ**：シンプルだが、ペース算出不可の場合を強制的にどちらかに倒すことになり、誤った印象を与えるため不採用。
- **フロントエンドで進捗・ペースを再計算**：`GetStudyLogByDateUseCase`等ですでに確立している「集計ロジックはbackend usecase層に置く」方針（ADR-002）に反するため不採用。
- **SubjectTaskごとの個別進捗エンドポイント**：関心の分離は明確になるが、ガント画面表示のためにN+1回のAPI呼び出しが発生するため不採用。

## Consequences

### Pros
- 進捗・遅延判定の「正しさ」の基準がbackendの1箇所（`subjectTaskProgress.js`）に閉じており、将来ロジックを変更してもfrontendの修正が不要
- ガント画面は`GET /api/milestones/:id`の1回のfetchで完結する
- 5状態を区別することで、UIが誤解を招く表示をしない

### Negative / Trade-offs
- `GetMilestoneUseCase`がSubjectTaskの数だけ`ReminderRepository`への問い合わせ（3クエリ×N件）を行うため、SubjectTask数が非常に多いマイルストーンでは応答が遅くなりうる。個人利用規模のv1では問題にならない想定（`ADR-002`の性能に関するMitigationsと同じ考え方）。
- `paceStatus`が5種類あるため、フロントエンド側の表示分岐（`PaceIndicator`）がやや複雑になる。
