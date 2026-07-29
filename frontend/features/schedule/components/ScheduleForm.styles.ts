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
