"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  getTimerCurrent,
  listSubjects,
  startTimer,
  stopTimer,
  type Subject,
  type TimerCurrent,
} from "@/lib/ui/timerApi";

function fmtHMS(totalSec: number) {
  const s = Math.max(0, Math.floor(totalSec));
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export default function TimerPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");

  // 初期値は「STOPPED」扱いにしておく（/timer/current を取りに行くので仮）
  const [current, setCurrent] = useState<TimerCurrent>({
    state: "STOPPED",
    serverNow: new Date().toISOString(),
  });

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  const [elapsedSec, setElapsedSec] = useState(0);
  const tickRef = useRef<number | null>(null);

  // clientNow - serverNow（ms）
  // serverNow基準の「いま」を作るためのズレ
  const serverOffsetMsRef = useRef<number>(0);

  const applyCurrent = (cur: TimerCurrent) => {
    // serverNow がある時だけ offset 更新
    if (cur?.serverNow) {
      const serverNowMs = new Date(cur.serverNow).getTime();
      if (!Number.isNaN(serverNowMs)) {
        serverOffsetMsRef.current = Date.now() - serverNowMs;
      }
    }

    setCurrent(cur);

    // RUNNINGなら、選択科目も追従（復元時の体験が良い）
    if (cur.state === "RUNNING") {
      if (cur.subjectId) setSelectedSubjectId(cur.subjectId);
    }
  };

  const startedAtMs = useMemo(() => {
    if (current.state !== "RUNNING") return null;
    const ms = new Date(current.startedAt).getTime();
    return Number.isNaN(ms) ? null : ms;
  }, [current]);

  // 初期ロード：科目 + current
  useEffect(() => {
    (async () => {
      try {
        setErr("");
        const [subs, cur] = await Promise.all([listSubjects(), getTimerCurrent()]);
        setSubjects(subs);
        applyCurrent(cur);

        // まだ何も選んでない時だけ先頭をセット（RUNNINGはapplyCurrentが優先）
        if (subs.length > 0 && !selectedSubjectId && cur.state !== "RUNNING") {
          setSelectedSubjectId(subs[0].id);
        }
      } catch (e: any) {
        setErr(e?.message ?? "failed to load");
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    })();
    // selectedSubjectId は「初回だけ先頭セット」のために参照するが、依存に入れると挙動が揺れるので入れない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // RUNNING のときだけ経過時間を更新（serverNow基準）
  useEffect(() => {
    if (tickRef.current) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }

    if (current.state !== "RUNNING" || !startedAtMs) {
      setElapsedSec(0);
      return;
    }

    const update = () => {
      const nowServerMs = Date.now() - serverOffsetMsRef.current;
      setElapsedSec(Math.floor((nowServerMs - startedAtMs) / 1000));
    };

    update();
    tickRef.current = window.setInterval(update, 1000);

    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
      tickRef.current = null;
    };
  }, [current, startedAtMs]);

  async function onStart() {
    try {
      setLoading(true);
      setErr("");

      const subjectId = selectedSubjectId || null;

      // ※Startの「同一IDでリトライ」は次タスクでやる（ここでは毎回生成でOK）
      const clientRequestId = crypto.randomUUID();

      const res = await startTimer({ subjectId, clientRequestId });

      // startのレスポンス自体に serverNow は無いので current を取り直すのが安全
      const cur = await getTimerCurrent();
      applyCurrent(cur);

      // 念のため：start直後はRUNNINGの情報も即座に反映しておく
      if (cur.state !== "RUNNING") {
        setCurrent({
          state: "RUNNING",
          sessionId: res.sessionId,
          subjectId: res.subjectId,
          startedAt: res.startedAt,
          serverNow: new Date().toISOString(),
        });
      }
    } catch (e: any) {
      setErr(e?.message ?? "start failed");
    } finally {
      setLoading(false);
    }
  }

  async function onStop() {
    try {
      setLoading(true);
      setErr("");

      // 冪等のため：リトライ時は同じIDを使う
      const key = "timer.pendingStopClientRequestId";
      let clientRequestId = sessionStorage.getItem(key);
      if (!clientRequestId) {
        clientRequestId = crypto.randomUUID();
        sessionStorage.setItem(key, clientRequestId);
      }

      const res = await stopTimer({ clientRequestId });

      // 成功したら pending を消す
      sessionStorage.removeItem(key);

      // current を取り直す（serverNow/offset更新込みで復元が正確）
      const cur = await getTimerCurrent();
      applyCurrent(cur);

      if (res.status === "STOPPED") {
        console.log("saved StudyLog:", res.studyLogId, "minutes:", res.roundedMinutes);
      }
    } catch (e: any) {
      setErr(e?.message ?? "stop failed");
    } finally {
      setLoading(false);
    }
  }

  const runningSubjectName = useMemo(() => {
    if (current.state !== "RUNNING") return "";
    const s = subjects.find((x) => x.id === current.subjectId);
    return s?.name ?? (current.subjectId ? "（不明な科目）" : "未分類");
  }, [current, subjects]);

  return (
    <div style={{ padding: 16, display: "grid", gap: 12 }}>
      <h1 style={{ fontSize: 18, fontWeight: 700 }}>Timer</h1>

      {err ? (
        <div style={{ padding: 12, border: "1px solid rgba(255,255,255,0.2)", borderRadius: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>エラー</div>
          <div style={{ opacity: 0.9 }}>{err}</div>
        </div>
      ) : null}

      <div style={{ padding: 12, border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, display: "grid", gap: 10 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>科目</div>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            disabled={loading || current.state === "RUNNING"} // RUNNING中は固定（後で仕様変えてもOK）
            style={{ padding: "8px 10px", borderRadius: 10 }}
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <div style={{ marginLeft: "auto", fontSize: 12, opacity: 0.7 }}>
            state: <b>{current.state}</b>
          </div>
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: 1 }}>{fmtHMS(elapsedSec)}</div>
          {current.state === "RUNNING" ? (
            <div style={{ fontSize: 12, opacity: 0.75 }}>
              {runningSubjectName} / startedAt: {current.startedAt}
            </div>
          ) : (
            <div style={{ fontSize: 12, opacity: 0.75 }}>stopped</div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {current.state === "RUNNING" ? (
            <button
              onClick={onStop}
              disabled={loading}
              style={{ padding: "10px 14px", borderRadius: 12, fontWeight: 700 }}
            >
              Stop
            </button>
          ) : (
            <button
              onClick={onStart}
              disabled={loading || subjects.length === 0}
              style={{ padding: "10px 14px", borderRadius: 12, fontWeight: 700 }}
            >
              Start
            </button>
          )}

          <button
            onClick={async () => {
              try {
                setLoading(true);
                setErr("");
                const cur = await getTimerCurrent();
                applyCurrent(cur);
              } catch (e: any) {
                setErr(e?.message ?? "refresh failed");
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            style={{ padding: "10px 14px", borderRadius: 12 }}
          >
            Refresh
          </button>
        </div>
      </div>

      <div style={{ opacity: 0.7, fontSize: 12 }}>
        経過時間は serverNow を基準に復元（端末時計のズレに強い）。Stop は clientRequestId で冪等。
      </div>
    </div>
  );
}
