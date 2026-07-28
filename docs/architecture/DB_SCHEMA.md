# DBスキーマ（Postgres） v1

このドキュメントは CPA-Dashboard-Core のDBスキーマ設計（v1）を定義する。
実装は別途行い、スキーマ変更は必ずマイグレーションで管理する。

---

## 最上位原則（絶対）
- StudyLog（一次データ）は **追加のみ（不変）**。更新・削除しない（DBでも禁止する）
- DBモデル変更時は **必ずマイグレーション** を作成する
- 変更前DBを読める **互換性維持** もしくは **明示的な移行手順（backfill等）** を必ず用意する
- DailySummary は派生データであり **DBに保存しない**
- 冪等性は `clientRequestId(UUID)` により担保する
- 日付の区切りは **JST（Asia/Tokyo）00:00**

---

## テーブル一覧（v1）
- subjects：科目マスタ（辞書）
- timer_sessions：タイマーの途中状態（未確定データの退避）
- study_logs：学習ログ（一次データ・不変）

---

## 各テーブルの目的と責務

### 1. subjects（科目マスタ）
**目的：**
- 学習ログ（study_logs）を安定して分類するための「科目の辞書（マスタ）」を提供する
- 表記ゆれを防ぎ、集計・表示を一貫させる
- UI都合の属性（色、並び順、無効化）を集中管理する

**このテーブルが無いと壊れること：**
- 科目名をログに直書きすることになり、表記ゆれで集計が壊れる
- 科目名変更・色変更の影響が過去ログ全体に波及しやすくなる

**主なカラム：**
- id（UUID, PK）
- name（科目名, UNIQUE）
- color_hex（表示色）
- sort_order（表示順）
- is_active（論理的な有効/無効）

**主な制約：**
- UNIQUE(name)
- color_hex の形式チェック（例：#RRGGBB）

---

### 2. timer_sessions（タイマー途中状態）
**目的：**
- StartTimer〜StopTimerの間に発生する「途中状態」を安全に保持する
- ブラウザ終了・通信断・クラッシュなどがあっても「開始した事実」を失わない
- 未確定データを隔離し、study_logs（一次データ）を汚染しない

**このテーブルが無いと壊れること：**
- Start後に落ちた場合、開始状態が消え「タイマーが信用できない機能」になる
- 未確定データを study_logs に書き始める必要が出て、一次データの純度が落ちる

**主なカラム：**
- id（UUID, PK）
- subject_id（FK -> subjects.id）
- client_request_id（UUID, UNIQUE）※ StartTimer の冪等性キー
- started_at（開始時刻）
- stopped_at（停止時刻, nullable）
- status（0: running, 1: stopped）

**主な制約：**
- UNIQUE(client_request_id)
- status の値チェック（0/1）
- 時刻の整合性（stopped_at があるなら started_at より後）

---

### 3. study_logs（学習ログ：一次データ）
**目的：**
- 「確定した学習事実」を永続に保存する（一次データ）
- DailySummary などの集計はここから再計算できるようにする

**このテーブルが無いと壊れること：**
- 集計の根拠がなくなり、再計算・復旧ができない（アプリが成立しない）

**主なカラム：**
- id（UUID, PK）
- subject_id（FK -> subjects.id）
- client_request_id（UUID, UNIQUE）※ StopTimerAndCreateStudyLog の冪等性キー
- timer_session_id（FK -> timer_sessions.id, nullable）
- started_at（開始時刻）
- ended_at（終了時刻）
- duration_minutes（保存は分単位、切り上げ）
- study_date_jst（JST日付。started_atから生成して集計に使う）

**主な制約：**
- UNIQUE(client_request_id)
- ended_at > started_at
- duration_minutes は 1〜1440（1日以内）

**不変性（DBで保証）：**
- UPDATE/DELETE をDBトリガーで禁止する（append-only）

---

## 派生データ（保存しない）
### DailySummary
- `study_logs` を JST日付（study_date_jst）で集計して生成する
- DBには保存せず、必要時に再計算する（ADR-002）

---

## マイグレーション運用方針
- スキーマ変更はすべて migration として管理する
- 破壊的変更（カラム削除・型変更）は原則避ける
  - 追加 → backfill → 並行稼働 → 切替 → 削除 の順で進める
- 旧DB互換（読み取り可能）か、明示的移行手順を必ず用意する


## タイマー同時起動（v1方針）
- v1ではタイマーの同時起動を許可しない
- `timer_sessions` において `status=running` のレコードは常に1件まで（DB制約で保証）
- 既に running が存在する場合、StartTimer は失敗として扱う（UIでメッセージ表示可能）
