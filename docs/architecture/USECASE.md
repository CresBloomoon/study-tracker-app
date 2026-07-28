# USECASE.md  
CPA-Dashboard-Core｜ユースケース定義（v1）

## 目的
本ドキュメントは、CPA-Dashboard-Core v1 における  
**アプリケーション層の責務（ユースケース）**を明確化し、  
実装時の判断ブレ・責務混入を防ぐことを目的とする。

本書に記載のユースケースは、  
ドメイン定義（DOMAIN.md）を前提とする。

---

## ユースケース一覧（v1）

1. StartTimer  
2. StopTimerAndCreateStudyLog  
3. RetryCreateStudyLog  
4. GetDailySummary  

---

## 1. StartTimer

### 概要
指定された科目で学習タイマーを開始する。

### 入力
- subjectId

### 前提条件
- アクティブな TimerSession が存在しないこと

### 処理
1. 現在時刻を startedAt として取得
2. TimerSession を生成
3. TimerSession を localStorage に保存
4. UI にタイマー実行中状態を反映

### 出力
- 成功：タイマー開始状態

### 失敗・例外
- 既に TimerSession が存在する場合：
  - 新規開始は行わない
  - ユーザに「現在のタイマーを先に記録してください」と通知

---

## 2. StopTimerAndCreateStudyLog

### 概要
実行中のタイマーを停止し、学習ログを作成する。

### 入力
- なし（TimerSession から取得）

### 前提条件
- TimerSession が running 状態で存在すること

### 処理
1. 現在時刻を取得し elapsedSeconds を算出
2. durationMinutes を以下のルールで算出  
durationMinutes = ceil(elapsedSeconds / 60)

yaml
コードをコピーする
3. clientRequestId（UUID）を生成（未生成の場合）
4. CreateStudyLog を実行
5. DB保存を試行

### 出力
- 成功：
- StudyLog がDBに保存される
- TimerSession を削除
- 成功トーストを表示
- 失敗：
- TimerSession を stopped_unsaved 状態で保持
- 再試行可能なUIを表示

### 失敗・例外
- DB保存失敗時：
- 一次データは未作成
- 計測結果は localStorage に保持
- ユーザは RetryCreateStudyLog を実行可能

---

## 3. RetryCreateStudyLog

### 概要
保存に失敗した学習ログの再登録を行う。

### 入力
- clientRequestId（TimerSession 由来）

### 前提条件
- stopped_unsaved 状態の TimerSession が存在すること

### 処理
1. TimerSession から StudyLog 作成情報を取得
2. clientRequestId を用いて CreateStudyLog を再試行
3. DBの冪等制約により二重登録を防止

### 出力
- 成功：
- StudyLog がDBに保存される
- TimerSession を削除
- 失敗：
- TimerSession を保持
- 再試行可能状態を維持

---

## 4. GetDailySummary

### 概要
指定期間の日次学習集計を取得する。

### 入力
- dateRange（from, to）

### 処理
1. StudyLog を期間指定で取得
2. occurredAt を JST に変換
3. StudyDay ごとに以下を集計
- totalMinutes
- subject別 minutes
4. DailySummary として整形

### 出力
- DailySummary の配列

### 備考
- DailySummary は派生データ
- DBには保存しない（v1）

---

## ユースケース共通ルール

### 冪等性
- StudyLog 作成は clientRequestId により冪等性を保証する
- 同一 clientRequestId の重複登録は発生しない

### データ保護
- DB一次データの削除・更新を行うユースケースは存在しない
- 表示や集計の失敗は許容するが、データ消失は許容しない

---

## v1で扱わない事項
- 学習ログの編集・削除
- 日付の手動指定
- 複数タイマーの同時実行
- 端末間タイマー同期
- 週次・月次専用集計


## API UseCases

### CreateStudyLogUseCase
目的:
- 手入力で StudyLog を1件作成する（編集/削除はしない）

入力:
- subjectId: UUID
- durationSec: number (>0)
- date?: YYYY-MM-DD (JST) ※任意
- clientRequestId: UUID（冪等キー）

事前条件:
- subjectId が存在すること
- durationSec が正の整数であること

処理:
- date が指定された場合:
  - JSTのその日付に紐づく endedAt をサーバ側で決める（例: 23:59:59 JST）
  - startedAt = endedAt - durationSec
- date が未指定の場合:
  - endedAt = サーバ現在時刻
  - startedAt = endedAt - durationSec
- StudyLog を作成する
  - clientRequestId はユニークとして扱い、重複時は同一結果を返す（冪等）

出力:
- 作成された StudyLog（id, subjectId, startedAt, endedAt, durationSec, studyDateJst）

失敗:
- 400: バリデーションエラー（durationSec不正 / date形式不正）
- 404: subjectId が存在しない
- 409: clientRequestId 重複（ただし冪等として同一結果返却でも良い）


### GetStudyLogByDateUseCase
目的:
- JST日付で StudyLog を取得し、日次集計（合計・科目別）を返す

入力:
- date: YYYY-MM-DD (JST)

処理:
- DBの generated column `study_date_jst` で対象日を絞り込み取得
- minutesRoundedUp = ceil(durationSec / 60) で分に切り上げ
- totalMinutesRoundedUp と bySubjectMinutesRoundedUp を算出

出力:
- items: StudyLog[]
- totalMinutesRoundedUp: number
- bySubjectMinutesRoundedUp: { subjectId, minutes }[]


### StartTimerUseCase
目的:
- タイマー開始（サーバが唯一の真実）。1ユーザにつき RUNNING は同時に1つ。

入力:
- subjectId: UUID

処理:
- 既存の RUNNING TimerSession が存在するか確認
  - 存在する場合は 409（開始できない）
- TimerSession を RUNNING として作成する（startedAt = サーバ現在時刻）

出力:
- sessionId, state=RUNNING, subjectId, startedAt

失敗:
- 404: subjectId が存在しない
- 409: 既に RUNNING が存在


### StopTimerUseCase
目的:
- タイマー停止（冪等）。RUNNING があれば STOPPED にし、StudyLog を作成する。

入力:
- clientRequestId: UUID（冪等キー）

処理:
- RUNNING TimerSession を取得
  - 存在しない場合は 200 で `NO_RUNNING_SESSION` を返す（冪等）
- endedAt = サーバ現在時刻
- TimerSession を STOPPED に更新
- durationSec = floor((endedAt - startedAt) / 1000)
- StudyLog を作成する
  - startedAt/endedAt は TimerSession の値を使用
  - clientRequestId はユニークとして扱い、重複時は同一結果を返す（冪等）
- roundedMinutes = ceil(durationSec / 60)

出力（RUNNINGあり）:
- status=STOPPED
- sessionId, startedAt, endedAt, durationSec, roundedMinutes, studyLogId

出力（RUNNINGなし）:
- status=NO_RUNNING_SESSION
