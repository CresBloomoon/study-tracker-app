"use client";

import { useState } from "react";
import { formStyle, inputStyle, submitBtnStyle, cancelBtnStyle } from "@/lib/ui/formStyles";

type Props = {
  initialName?: string;
  initialIntervalDays?: number[];
  submitLabel: string;
  onSubmit: (params: { name: string; intervalDays: number[] }) => Promise<void>;
  onCancel?: () => void;
};

// "1, 3, 7, 20" のようなカンマ区切りテキストを正の整数配列に変換する。不正な入力はnull
function parseIntervalDays(text: string): number[] | null {
  const parts = text
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (parts.length === 0) return null;
  const nums = parts.map((s) => Number(s));
  if (nums.some((n) => !Number.isInteger(n) || n <= 0)) return null;
  return nums;
}

// ReviewRecipeの新規作成・編集で共用するフォーム（intervalDaysの配列⇔テキスト変換を担う）
export default function ReviewRecipeForm({ initialName = "", initialIntervalDays, submitLabel, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initialName);
  const [intervalDaysText, setIntervalDaysText] = useState(initialIntervalDays?.join(", ") ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    const intervalDays = parseIntervalDays(intervalDaysText);
    if (!name.trim() || !intervalDays) {
      setErr("名前と間隔日数（例: 1, 3, 7, 20）を正しく入力してください");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await onSubmit({ name: name.trim(), intervalDays });
    } catch (e: any) {
      setErr(e?.message ?? "保存に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={formStyle}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="名前（例: レギュラー講義受講後）"
        style={inputStyle}
      />
      <input
        value={intervalDaysText}
        onChange={(e) => setIntervalDaysText(e.target.value)}
        placeholder="間隔日数（例: 1, 3, 7, 20）"
        style={inputStyle}
      />
      {err && <div style={{ color: "#fca5a5", fontSize: 12 }}>{err}</div>}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" onClick={submit} disabled={busy} style={submitBtnStyle}>
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} style={cancelBtnStyle}>
            キャンセル
          </button>
        )}
      </div>
    </div>
  );
}
