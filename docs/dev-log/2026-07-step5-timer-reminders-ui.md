# Step5: タイマー・リマインダーUI移植＋タブ構成変更

> **注記**: これは設計判断の記録（ADR）ではなく、作業内容の記録（開発ログ）である。設計判断そのものは`docs/adr/`配下のADRを参照すること。本ログはあくまで「Step5で何を・なぜ・どう変更したか」の作業記録であり、将来の設計判断の根拠として引用するものではない。

- 日付: 2026-07-29
- 対象Step: Step5（タイマー・リマインダーUI移植＋タブ構成変更）

## 概要

`CPA-Dashboard`のタイマー・リマインダーUIの見た目とインタラクションを`study-tracker-app`のフロントエンドに移植し、Core側APIに接続した。あわせて、`frontend/lib/ui/tabNavConfig.ts`のタブ構成を`[reminders, review, timer, schedule]`に変更し、`/dashboard`・`/calendar`・`/projects`タブを廃止した。実装着手前の調査で、既存のタイマー関連バックエンドコードに実行時エラーとなる複数のバグが見つかったため、その修正もStep5の前提作業として行った。

## 変更ファイル一覧と責務

### バックエンド（Step5着手前提のバグ修正・機能追加）

| ファイル | 責務 |
|---|---|
| `backend/src/repositories/TimerSessionRepository.js` | `pauseRunningById`/`resumePausedById`の引数不整合バグ修正、`TimerSession`に存在しない列（`durationSec`/`roundedMinutes`/`studyLogId`）への書き込み除去、死んでいた`stopRunningById`削除 |
| `backend/src/usecases/StopTimerUseCase.js` | コンストラクタ不整合バグ修正（`{timerSessionRepo,studyLogRepo}`分割代入→`prisma`直接受け取りに統一）、応答値をローカル計算済みの`durationSec`/`roundedMinutes`に変更 |
| `backend/src/usecases/RecordTimerUseCase.js` | 同上コンストラクタ修正、`linkedReminderId`受け取り＋存在チェック配線 |
| `backend/src/repositories/StudyLogRepository.js` | 呼ばれているのに存在しなかった`createFromTimerSession()`を追加 |
| `backend/src/routes/timer.routes.js` | `/timer/record`が`linkedReminderId`を受け取れるように |

### フロントエンド：APIクライアント

| ファイル | 責務 |
|---|---|
| `frontend/lib/ui/timerApi.ts` | 全面書き換え。実際の3状態（RUNNING/PAUSED/IDLE）/5エンドポイントの応答形に正確対応（従来は`STOPPED`/`RUNNING`の2状態を前提にした古いモデルだった） |
| `frontend/lib/ui/studyLogApi.ts`（新規） | 手動記録モード用、`POST /api/study-log`ラッパー |
| `frontend/lib/ui/remindersApi.ts` | `Reminder`型に`isOverdue`/`subjectTaskId`/`reviewSeriesId`追加（Step2/3で追加済みのバックエンド項目がフロント未反映だった） |

### フロントエンド：タイマー機能（すべて新規、`frontend/features/timer/`配下）

| ファイル | 責務 |
|---|---|
| `hooks/useStudyTimer.ts` | データ取得・サーバー状態同期・派生値計算を集約する唯一のロジック層 |
| `components/StudyTimer.tsx` | フックを呼んでUIを組み立てるだけの薄い最上位コンポーネント |
| `components/TimerModeTabs.tsx` | ポモドーロ/ストップウォッチ/手動入力のモード切替 |
| `components/SubjectSelect.tsx` | 科目選択ドロップダウン |
| `components/TimerCircle.tsx` | 円形タイマー本体（進捗リング・中央時刻表示） |
| `components/TimeUnitBox.tsx` | 手動入力の時・分スピンボックス |
| `components/PomodoroConfigField.tsx` | ポモドーロ設定の数値入力欄 |
| `components/NoteAndReminderFields.tsx` | メモ・Todo紐付け入力欄（開始〜記録まで共用） |
| `components/StudyTimer.styles.ts` | `StudyTimer.tsx`直下で使うスタイル定数 |
| `app/(tabs)/timer/page.tsx` | 旧デバッグ用スキャフォールドから`<StudyTimer/>`描画のみの薄いページに置き換え |

### フロントエンド：チェックボックス共通化

| ファイル | 責務 |
|---|---|
| `frontend/components/ui/UiCheckbox.tsx`（新規） | 汎用チェックボックスUIプリミティブ。API呼び出しの知識を持たず、振り返り・ガントタブでも再利用する前提 |
| `frontend/features/reminders/components/AnimatedCheckbox.tsx`（削除） | `UiCheckbox`に統合 |
| `frontend/features/reminders/components/RemindersPanel.tsx` | `UiCheckbox`利用に切替、`status=open`/`done`を個別取得して`isOverdue`を反映、期限超過を赤字表示 |
| `frontend/app/globals.css` | `.rem-check`を削除し、CPA-Dashboard移植の`.ui-checkbox`/`.ui-checkbox-wrapper`に置換 |

### フロントエンド：タブ構成変更

| ファイル | 責務 |
|---|---|
| `frontend/lib/ui/tabNavConfig.ts` | タブ項目を`[reminders, review, timer, schedule]`に変更 |
| `frontend/app/page.tsx` | ルートリダイレクト先を`/dashboard`→`/reminders`に変更 |
| `frontend/app/(tabs)/layout.tsx` | アクティブタブのフォールバック値を`/dashboard`→`/reminders`に修正（付随した小さな一貫性修正） |
| `dashboard/`・`calendar/`・`projects/`配下の`page.tsx`（削除） | タブから撤去。`frontend/features/dashboard/`本体は今回未削除 |
| `review/`・`schedule/`配下の`page.tsx`（新規） | Step6/7実装までのプレースホルダー |

### 設定

| ファイル | 責務 |
|---|---|
| `frontend/package.json`／`package-lock.json` | `framer-motion`追加のみ（Tailwindは導入せず） |

## ADRの要否判断とその理由

判断：**不要**。

理由は、今回の変更が実質的に2種類に分類でき、どちらも「新しい設計判断」ではないためである。

1. **バックエンドのバグ修正群**（`TimerSessionRepository`等）は、ADR-015が既に定めているRUNNING/PAUSED/IDLEの状態機械を、コードが正しく実装できていなかったのを直しただけである。設計自体はADR-015の時点で決まっており、今回は「決定」ではなく「決定への追従」にあたる。
2. **フロントエンドの実装方針**（Tailwind不導入、フルスクリーン/没入モード/トロフィー連携を省略、framer-motionは軽量用途限定、コンポーネントをフック+薄い描画層に分割）は、いずれも今回のセッション内で計画書とやり取りを通じて既に明示的に協議・承認済みで、かつCLAUDE.md自体が`frontend/`を「暫定物、過剰投資しない」と位置づけている領域である。ドメイン設計判断の記録であるこのリポジトリのADR群（StudyLog不変性、タイマー状態機械、マイグレーション方針など）と同列に扱うには重みが軽いと判断した。

強いて言えば「タイマーAPIクライアントを実際のバックエンド契約に合わせて全面書き換えた」という判断は、既存のADR-015を初めてフロント側で正しく実装した、という点で意味はあるが、これも新規決定ではなく「既存決定の初回正しい実装」である。ADRを書くまでもなく、実装時のやり取り自体が記録として十分機能すると考える。

## ビルド確認結果

`docker compose exec frontend npm run build` が成功。

```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (8/8)
✓ Collecting build traces
✓ Finalizing page optimization
```

生成されたルートに`/reminders`・`/review`・`/schedule`・`/timer`が含まれ、`/dashboard`・`/calendar`・`/projects`が含まれないことを確認済み。

なお、この過程で`node_modules/framer-motion`未インストールによるビルドエラーが一度発生した。原因は、フロントコンテナのブートストラップスクリプトが`node_modules/.installed`マーカーの有無でのみ`npm install`実行を判断する仕組みになっており、`docker compose exec`での一時コマンド実行はこのブートストラップを再トリガーしないため。`docker compose exec frontend npm install`を手動実行して解決した。

## 次のステップ

- Step6: 振り返りタブ（日別タイムライン、科目別累計、月次・年次推移グラフ）
- Step7: 学習スケジュール（ガント）タブ（マイルストーン、科目バー、進捗バッジ、展開パネル、遅延判定表示）

どちらから着手するかは次回のセッションで指定する。
