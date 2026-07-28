# ADR-015: Timer State Machine (RUNNING / PAUSED / IDLE)

## 背景（なぜ必要か）
タイマーの状態遷移がコード・UI・会話ログに散在すると、フロント実装時に解釈が揺れやすく、バグと仕様ブレの温床になる。
また、本プロジェクトは「サーバが Single Source of Truth」であり、時刻や状態はサーバ判断で一貫させる必要がある。

## 決定（何を決めたか）

### 1. 状態の定義
タイマー状態（TimerState）は以下の3つに限定する。

- RUNNING: タイマーが進行中
- PAUSED: タイマーが一時停止中（未記録セッションが存在する）
- IDLE: 「未記録セッションが存在しない」ことを表すUI状態（＝実質的にタイマーが動作していない状態）

> 注意: IDLE は「未記録セッションがない」ことを意味するため、直前にPAUSEDだったかどうかは問わない。
> サーバが current を評価した結果として返される状態である。

### 2. 遷移トリガー（ユーザ操作）
ユーザ操作による状態遷移は次の通りとする。

- Start:
  - IDLE → RUNNING
- Pause（中央ボタン）:
  - RUNNING → PAUSED
- Resume（中央ボタン）:
  - PAUSED → RUNNING
- Record（記録ボタン）:
  - PAUSED → IDLE

### 3. 中央ボタンの責務
中央ボタンは「トグル」ではあるが、対象は次に限定する。

- RUNNING ↔ PAUSED の切り替えのみ

以下は中央ボタンでは行わない。

- PAUSED → IDLE（これは Record のみ）
- IDLE → PAUSED（存在しない）
- RUNNING → IDLE（存在しない）

### 4. サーバ権威（Single Source of Truth）
- タイマー状態の正当性・現在時刻はサーバが決定する
- クライアント時刻は信頼しない
- `GET /api/timer/current` はサーバが判断した状態を返す
- 時刻依存UIのために、レスポンスには `serverNow` を含める（ルール）

## 代替案（なぜ他案を捨てたか）

### 案A: 状態を増やす（STOPPED / COMPLETED / BREAK 等）
- 状態が増えるほどフロント表示条件とAPI分岐が増え、保守コストが爆増する
- 本プロジェクトの初期段階では、まず「記録単位（未記録セッション）」を軸に単純化する方が安全

### 案B: IDLE を状態として持たず、フロントが推論する
- 「未記録セッション無し」をフロント推論にすると、クラッシュ・通信遅延・多端末利用時に矛盾が発生しやすい
- サーバ権威の原則（Server Source of Truth）と矛盾するため不採用

## 影響範囲（何が変わるか）
- フロントは `TimerState` に応じて表示・活性を決める
- 中央ボタンの押下は RUNNING/PAUSED のみを対象にする
- PAUSED→IDLEは Record のみ（仕様として固定）
- APIやUseCaseは命名変更時に追従が必要（Repository/UseCaseの整合性を維持する）

## 補足（実装メモ）
- `IDLE` は「未記録セッションが存在しない」状態として `current` が返す
- 既存の丸め処理（`roundUpMinutes`）等は本ADRの対象外（別ADRで管理）
