"use client";

import { useState } from "react";
import { markDone, markUndone } from "@/lib/ui/remindersApi";

type Props = {
  id: string;
  isDone: boolean;
  onChanged?: () => void; // 成功後に一覧refreshしたい時に使う
};

export default function AnimatedCheckbox({ id, isDone, onChanged }: Props) {
  const [busy, setBusy] = useState(false);
  const [bump, setBump] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);

    // 主張小さめバウンド（押した瞬間だけ）
    setBump(true);
    window.setTimeout(() => setBump(false), 160);

    try {
      if (isDone) await markUndone(id);
      else await markDone(id);

      onChanged?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-label="toggle done"
      className={[
        "rem-check",
        isDone ? "is-done" : "",
        bump ? "is-bump" : "",
      ].join(" ")}
    >
      {isDone ? "●" : "○"}
    </button>
  );
}
