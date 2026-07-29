"use client";

import { useState } from "react";
import { createMilestone } from "@/lib/ui/scheduleApi";
import { toggleBtnStyle, formStyle, inputStyle, submitBtnStyle, cancelBtnStyle } from "./ScheduleForm.styles";

type Props = {
  onCreated: () => void;
};

// 本番試験日のような「最大のマイルストーン」も、通常のマイルストーンとして同じフォームで登録する
export default function CreateMilestoneForm({ onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    if (!name.trim() || !deadlineDate) {
      setErr("名前と締切日を入力してください");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await createMilestone({ name: name.trim(), deadlineDate });
      setName("");
      setDeadlineDate("");
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
        + マイルストーンを追加
      </button>
    );
  }

  return (
    <div style={formStyle}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="名前（例: 本試験、短答式模試）"
        style={inputStyle}
      />
      <input type="date" value={deadlineDate} onChange={(e) => setDeadlineDate(e.target.value)} style={inputStyle} />
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
