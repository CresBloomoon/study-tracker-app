# Timer API

Base URL: `/api`

## 共通
- Content-Type: `application/json; charset=utf-8`
- 日時は ISO8601（UTC, `Z` 付き）
- サーバ時刻は `serverNow` として常に返す（クライアント時刻は信頼しない）
- エラーレスポンス（例）
```json
{ "error": { "code": "NOT_FOUND", "message": "Not Found" } }
```

---

## TimerState
- RUNNING: タイマー進行中
- PAUSED: 未記録セッションが一時停止中
- IDLE: 未記録セッションが存在しない（UI上の待機状態）

---

## レスポンス共通形（推奨）
`GET /timer/current` など、タイマー状態を返すAPIは次を返す。

- state: RUNNING | PAUSED | IDLE
- serverNow: 現在のUTC時刻（ISO8601）
- session: 現在の未記録セッション（無い場合は null）

```json
{
  "state": "IDLE",
  "serverNow": "2026-01-13T12:34:56.789Z",
  "session": null
}
```

---

## 1) Get Current
GET /timer/current

### Behavior
1. RUNNING が存在する場合、それを current とする
2. RUNNING が無く、未記録で最新が存在する場合、それを current とする（通常は PAUSED）
3. どちらも無い場合は IDLE（session: null）

### Response 200
```json
{
  "state": "RUNNING",
  "serverNow": "2026-01-13T12:34:56.789Z",
  "session": {
    "id": "uuid",
    "state": "RUNNING",
    "subjectId": "uuid",
    "mode": "FOCUS",
    "phase": "FOCUS",
    "setIndex": 1,
    "totalSets": 3,
    "startedAt": "2026-01-13T12:30:00.000Z",
    "pausedAt": null,
    "endedAt": null,
    "recordedAt": null
  }
}
```

---

## 2) Start
POST /timer/start

### Request Body
```json
{
  "subjectId": "uuid",
  "mode": "FOCUS",
  "configJson": {}
}
```

### Behavior
- IDLE → RUNNING

### Response 201
```json
{
  "state": "RUNNING",
  "serverNow": "2026-01-13T12:34:56.789Z",
  "session": {
    "id": "uuid",
    "state": "RUNNING",
    "subjectId": "uuid",
    "mode": "FOCUS",
    "phase": "FOCUS",
    "setIndex": 1,
    "totalSets": 3,
    "startedAt": "2026-01-13T12:34:56.700Z",
    "pausedAt": null,
    "endedAt": null,
    "recordedAt": null
  }
}
```

---

## 3) Pause
POST /timer/pause

### Behavior
- RUNNING → PAUSED

### Response 200
```json
{
  "state": "PAUSED",
  "serverNow": "2026-01-13T12:40:00.000Z",
  "session": {
    "id": "uuid",
    "state": "PAUSED",
    "pausedAt": "2026-01-13T12:39:59.900Z"
  }
}
```

---

## 4) Resume
POST /timer/resume

### Behavior
- PAUSED → RUNNING

### Response 200
```json
{
  "state": "RUNNING",
  "serverNow": "2026-01-13T12:41:00.000Z",
  "session": {
    "id": "uuid",
    "state": "RUNNING",
    "pausedAt": null
  }
}
```

---

## 5) Record
POST /timer/record

### Behavior
- PAUSED → IDLE
- 記録後は未記録セッションが存在しないため session は null

### Response 200
```json
{
  "state": "IDLE",
  "serverNow": "2026-01-13T12:45:00.000Z",
  "session": null
}
```

---

## PowerShell Examples

### Current
```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:3000/api/timer/current"
```

### Start
```powershell
$body = @{
  subjectId = "uuid-here"
  mode = "FOCUS"
  configJson = @{}
} | ConvertTo-Json -Depth 10

Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3000/api/timer/start" `
  -ContentType "application/json; charset=utf-8" `
  -Body ([System.Text.Encoding]::UTF8.GetBytes($body))
```

### Pause / Resume / Record
```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/timer/pause"
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/timer/resume"
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/timer/record"
```
