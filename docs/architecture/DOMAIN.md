# DOMAIN.md  
CPA-Dashboard-Core｜ドメイン定義（v1）

## 目的
本ドキュメントは、CPA-Dashboard-Core v1 における  
**概念（ドメイン）・用語・不変条件**を明文化し、  
将来の仕様変更や実装判断における後戻りを防ぐことを目的とする。

---

## 最上位原則（ドメイン憲法）

### 憲法第1条
**学習データ（一次データ）は絶対に消えない**

- 表示や集計が壊れることは許容
- DBに保存された一次データ（StudyLog）の消失は不可
- 派生データは常に再生成可能であること

---

## 用語一覧（v1）

| 用語 | 意味 |
|---|---|
| StudyLog | 学習セッション1回分の一次データ |
| Subject | 学習科目（分類） |
| StudyDay | JST基準の日付（集計単位） |
| DailySummary | StudyLogから生成される日次集計（派生） |
| TimerSession | ブラウザ上で動作する未保存の計測状態（UI状態） |

---

## ドメインモデル定義

### StudyLog（学習ログ / 一次データ）
**意味**  
ある1回の学習セッションを表す、編集不能な一次データ。

**特徴**
- ストップウォッチ1回 = StudyLog 1件
- 作成のみ（編集・削除・無効化なし）
- 学習事実の改ざんを防ぐため、後から変更できない

**主な属性（概念レベル）**
- userId
- subjectId
- durationMinutes
- occurredAt（計測終了時刻）
- clientRequestId（UUID）

**不変条件**
- StudyLogは作成後に変更されない
- durationMinutes は **切り上げで算出**
durationMinutes = ceil(elapsedSeconds / 60)

yaml
コードをコピーする
- occurredAt は JST基準で StudyDay に紐づく
- clientRequestId により冪等性が保証される

---

### Subject（科目）
**意味**  
学習内容を分類するためのカテゴリ。

**特徴**
- ユーザが定義可能
- 表示・集計の単位として使用

**主な属性**
- name
- color
- displayOrder

---

### StudyDay（学習日）
**意味**  
学習を集計するための「日付」概念。

**定義**
- Asia/Tokyo（JST）の暦日
- 日付の切り替わりは **00:00 JST**

**不変条件**
- StudyLogは必ず1つのStudyDayに属する
- サーバ時刻やUTCに依存しない

---

### DailySummary（日次集計 / 派生データ）
**意味**  
ある StudyDay における学習結果を表示用に集計したもの。

**特徴**
- StudyLogからオンデマンドで生成
- DBに保存しない（v1）
- 壊れても再生成可能

**内容**
- date（StudyDay）
- totalMinutes
- bySubjectMinutes（科目別内訳）

**不変条件**
- DailySummaryは一次データではない
- 表示が壊れても StudyLog が残っていれば復元可能

---

### TimerSession（UI状態 / localStorage）
**意味**  
DBに保存される前の、計測中または未保存の学習状態。

**保存場所**
- ブラウザの localStorage

**主な属性**
- status（running / stopped_unsaved）
- subjectId
- startedAt
- elapsedSeconds
- clientRequestId
- version

**ルール**
- アクティブな TimerSession は常に1つ
- 複数端末間の同期は v1 では考慮しない
- StudyLog保存成功時に削除される
- version不一致時は安全に破棄してよい

---

## 時間計測ルール

### 表示
- タイマーは **秒単位**で表示

### 保存
- 保存時に **分単位へ切り上げ**
- 最大誤差は +1分まで許容

---

## 設計方針まとめ（v1）

- StudyLogは「追加のみ台帳」
- 編集・削除・日付変更なし
- 集計は派生データとして扱う
- UIの利便性と一次データの堅牢性を分離する

---

## 将来拡張（v1では未対応）
- 週次・月次集計（DailySummaryの集計で対応可能）
- 答練・得点管理
- サーバ側アクティブタイマーロック
- 集計データのキャッシュ保存