# Timer UI Spec（Central Button / Record）

## 前提
- タイマー状態はサーバ返却の `state` を唯一の真実とする
- `state` は `RUNNING | PAUSED | IDLE`
- `session` は IDLE の場合 `null`

---

## 中央ボタン（Primary Action）

### 表示ルール
| state   | 表示ラベル | 活性 |
|---------|------------|------|
| IDLE    | Start      | 有効 |
| RUNNING| Pause      | 有効 |
| PAUSED | Resume     | 有効 |

### 動作
- IDLE → Start → `POST /timer/start`
- RUNNING → Pause → `POST /timer/pause`
- PAUSED → Resume → `POST /timer/resume`

### 非責務（中央ボタンではやらない）
- PAUSED → IDLE（Record のみ）
- RUNNING → IDLE
- IDLE → PAUSED

---

## Record ボタン（Secondary Action）

### 表示・活性ルール
| state   | 表示 | 活性 |
|---------|------|------|
| PAUSED  | 表示 | 有効 |
| RUNNING| 非表示 | - |
| IDLE    | 非表示 | - |

### 動作
- PAUSED → Record → `POST /timer/record`
- 成功後、`state: IDLE` が返る

---

## 表示補足
- `serverNow` を基準に経過時間・残り時間を計算する
- クライアント時刻は一切信用しない
- state が変わったら UI は即時再描画（楽観更新しない）

---

## エラーハンドリング
- API エラー時は state を変更しない
- トーストでエラー表示（詳細はトースト仕様に従う）


## 科目（subject）変更ルール
- `session === null`（IDLE）のときのみ変更可能
- `session !== null`（RUNNING / PAUSED / REST待ち含む）の間は変更不可
  - UIは透過＋ポインタ禁止で表現する
  - サーバ側に subject 変更APIは用意しない（セッション不変）


### Subject 固定
- `POST /timer/start` で指定した `subjectId` は、その未記録セッションが Record されるまで変更できない
- セッション途中の subject 変更 API は提供しない
