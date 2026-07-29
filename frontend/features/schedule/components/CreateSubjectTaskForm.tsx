"use client";

import { useEffect, useState } from "react";
import { createSubjectTask } from "@/lib/ui/scheduleApi";
import { listAllSubjects, type SubjectMeta } from "@/lib/ui/reviewApi";
import { toggleBtnStyle, formStyle, inputStyle, submitBtnStyle, cancelBtnStyle } from "./ScheduleForm.styles";

type Props = {
  milestoneId: string;
  onCreated: () => void;
};

export default function CreateSubjectTaskForm({ milestoneId, onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [subjects, setSubjects] = useState<SubjectMeta[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open || subjects.length > 0) return;
    listAllSubjects()
      .then((list) => {
        setSubjects(list);
        if (list.length > 0) setSubjectId(list[0].id);
      })
      .catch(() => {});
  }, [open, subjects.length]);

  async function submit() {
    if (!subjectId || !startDate || !endDate) {
      setErr("科目・開始日・終了日を入力してください");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await createSubjectTask({ milestoneId, subjectId, startDate, endDate });
      setStartDate("");
      setEndDate("");
      setOpen(false);
      onCreated();
    } catch (e: any) {
      setErr(e?.message ?? "作成に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} style={toggleBtnStyle}>
        + 科目バーを追加
      </button>
    );
  }

  return (
    <div style={formStyle}>
      <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} style={inputStyle}>
        {subjects.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
      <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
      {err && <div style={{ color: "#fca5a5", fontSize: 12 }}>{err}</div>}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" onClick={submit} disabled={busy} style={submitBtnStyle}>
          追加する
        </button>
        <button type="button" onClick={() => setOpen(false)} style={cancelBtnStyle}>
          キャンセル
        </button>
      </div>
    </div>
  );
}
