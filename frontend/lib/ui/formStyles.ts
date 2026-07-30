// frontend/lib/ui/formStyles.ts
//
// トグル式の小さな作成/編集フォーム（「+ 追加」ボタン→インラインフォーム）で共通利用するスタイル定数。
// Step7のScheduleForm.styles.tsとして最初に作られたが、Step8で同じパターンのフォームが増えたため
// 共有位置に統合した。新しいフォームもここを使うこと（重複させない）。
import type { CSSProperties } from "react";

export const toggleBtnStyle: CSSProperties = {
  padding: "8px 14px",
  borderRadius: 10,
  border: "1px dashed var(--line)",
  background: "transparent",
  color: "var(--fg)",
  cursor: "pointer",
  fontSize: 13,
};

export const formStyle: CSSProperties = {
  display: "grid",
  gap: 8,
  padding: 12,
  border: "1px solid var(--line)",
  borderRadius: 12,
  background: "rgba(255,255,255,0.02)",
};

export const inputStyle: CSSProperties = {
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid var(--line)",
  background: "rgba(255,255,255,0.04)",
  color: "var(--fg)",
  fontSize: 13,
};

export const submitBtnStyle: CSSProperties = {
  padding: "8px 14px",
  borderRadius: 8,
  border: "1px solid var(--accent)",
  background: "var(--accent)",
  color: "#fff",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
};

export const cancelBtnStyle: CSSProperties = {
  padding: "8px 14px",
  borderRadius: 8,
  border: "1px solid var(--line)",
  background: "transparent",
  color: "var(--fg)",
  cursor: "pointer",
  fontSize: 13,
};
