# Reminder API

Base URL: `/api`

## 共通
- Content-Type: `application/json; charset=utf-8`
- 日時は ISO8601（UTC, `Z` 付き）を推奨
- エラーレスポンス（例）
  ```json
  { "error": { "code": "NOT_FOUND", "message": "Not Found" } }
1) Create Reminder
POST /reminders
Request Body
json
コードをコピーする
{
  "title": "string",
  "dueAt": "2026-01-08T05:26:51.820Z"
}
Validation
title 必須（空文字NG）

dueAt 必須（ISO8601として解釈可能）

Response 201
json
コードをコピーする
{
  "id": "uuid",
  "title": "テストReminder",
  "dueAt": "2026-01-08T05:26:51.820Z",
  "isDone": false,
  "doneAt": null,
  "createdAt": "2026-01-08T05:26:51.819Z",
  "updatedAt": "2026-01-08T05:26:51.819Z"
}
2) List Reminders
GET /reminders?status=open|done|all
Query
status:

open (default)

done

all

Sort
dueAt asc

createdAt asc

Response 200
json
コードをコピーする
[
  {
    "id": "uuid",
    "title": "テストReminder",
    "dueAt": "2026-01-08T05:26:51.820Z",
    "isDone": false,
    "doneAt": null,
    "createdAt": "2026-01-08T05:26:51.819Z",
    "updatedAt": "2026-01-08T05:26:51.819Z"
  }
]
3) Mark Done
PATCH /reminders/:id/done
Path Params
id: UUID

Behavior
isDone = true

doneAt = now

Response 200
json
コードをコピーする
{
  "id": "uuid",
  "title": "テストReminder",
  "dueAt": "2026-01-08T05:26:51.820Z",
  "isDone": true,
  "doneAt": "2026-01-08T05:32:28.246Z",
  "createdAt": "2026-01-08T05:26:51.819Z",
  "updatedAt": "2026-01-08T05:32:28.253Z"
}
4) Mark Undone
PATCH /reminders/:id/undone
Path Params
id: UUID

Behavior
isDone = false

doneAt = null

Response 200
json
コードをコピーする
{
  "id": "uuid",
  "title": "テストReminder",
  "dueAt": "2026-01-08T05:26:51.820Z",
  "isDone": false,
  "doneAt": null,
  "createdAt": "2026-01-08T05:26:51.819Z",
  "updatedAt": "2026-01-08T05:32:28.301Z"
}
5) Summary
GET /reminders/summary
Response 200
json
コードをコピーする
{
  "dueTodayOpenCount": 0,
  "openCount": 0,
  "doneCount": 0,
  "ranges": {
    "todayJst": "2026-01-08",
    "todayStartUtc": "2026-01-07T15:00:00.000Z",
    "todayEndUtc": "2026-01-08T15:00:00.000Z"
  }
}
PowerShell Examples
Create
powershell
コードをコピーする
$body = @{
  title = "テストReminder"
  dueAt = (Get-Date).ToUniversalTime().ToString("o")
} | ConvertTo-Json -Depth 10

Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3000/api/reminders" `
  -ContentType "application/json; charset=utf-8" `
  -Body ([System.Text.Encoding]::UTF8.GetBytes($body))
List
powershell
コードをコピーする
Invoke-RestMethod -Method Get -Uri "http://localhost:3000/api/reminders"
Invoke-RestMethod -Method Get -Uri "http://localhost:3000/api/reminders?status=done"
Invoke-RestMethod -Method Get -Uri "http://localhost:3000/api/reminders?status=all"
Done / Undone
powershell
コードをコピーする
$id = "uuid-here"
Invoke-RestMethod -Method Patch -Uri "http://localhost:3000/api/reminders/$id/done"
Invoke-RestMethod -Method Patch -Uri "http://localhost:3000/api/reminders/$id/undo