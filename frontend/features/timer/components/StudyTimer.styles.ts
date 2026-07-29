import type { CSSProperties } from "react";

export const outerStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  minHeight: 620,
  borderRadius: 24,
  padding: 32,
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#0f172a",
};

export const backgroundGlowStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "radial-gradient(circle at 25% 20%, rgba(56,189,248,0.22), transparent 58%), radial-gradient(circle at 75% 70%, rgba(96,165,250,0.16), transparent 62%), linear-gradient(135deg,#152243,#2C3C57)",
};

export const errStyle: CSSProperties = {
  marginTop: 8,
  padding: "8px 12px",
  borderRadius: 10,
  background: "rgba(239,68,68,0.15)",
  color: "#fca5a5",
  fontSize: 12,
};

export function recordButtonStyle(disabled: boolean): CSSProperties {
  return {
    width: "100%",
    marginTop: 16,
    padding: "12px 24px",
    borderRadius: 999,
    border: "1px solid rgba(186,230,253,0.15)",
    background: "rgba(30,41,59,0.5)",
    color: "#eaf0ff",
    fontWeight: 600,
    fontSize: 14,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
  };
}
