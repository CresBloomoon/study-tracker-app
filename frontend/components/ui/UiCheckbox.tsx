"use client";

import { useState } from "react";

type Props = {
  checked: boolean;
  onToggle: () => void | Promise<void>;
  disabled?: boolean;
  ariaLabel?: string;
};

/**
 * 汎用の丸チェックボックス（iOSライク、CPA-Dashboardのui-checkboxを移植）。
 * リマインダー・振り返り・学習スケジュール(ガント)タブで共通利用する前提の
 * 見た目/インタラクションのみを持つプリミティブ。実際のAPI呼び出しは呼び出し側が担う。
 */
export default function UiCheckbox({ checked, onToggle, disabled = false, ariaLabel = "toggle" }: Props) {
  const [busy, setBusy] = useState(false);

  async function handleChange() {
    if (busy || disabled) return;
    setBusy(true);
    try {
      await onToggle();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ui-checkbox-wrapper">
      <input
        type="checkbox"
        className="ui-checkbox"
        checked={checked}
        disabled={disabled || busy}
        onChange={handleChange}
        aria-label={ariaLabel}
      />
    </div>
  );
}
