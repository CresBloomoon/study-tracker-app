"use client";

import { TOAST_CONFIG } from "@/lib/ui/uiConfig";

type Props = {
  message: string;
  onUndo?: () => void;
  undoLabel?: string;
};

// 単一トースト1件の見た目のみを持つプリミティブ。表示/非表示のタイミング管理は呼び出し側（useToast）が担う。
export default function Toast({ message, onUndo, undoLabel = "元に戻す" }: Props) {
  return (
    <div style={wrapperStyle} role="status">
      <span style={messageStyle}>{message}</span>
      {onUndo && (
        <button type="button" onClick={onUndo} style={undoBtnStyle}>
          {undoLabel}
        </button>
      )}
    </div>
  );
}

const wrapperStyle: React.CSSProperties = {
  position: "fixed",
  left: "50%",
  bottom: 24,
  transform: "translate(-50%, -6px)",
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "10px 14px",
  border: "1px solid var(--line)",
  borderRadius: 16,
  background: "rgba(15,20,35,0.96)",
  backdropFilter: "blur(10px)",
  boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
  color: "var(--fg)",
  fontSize: 13,
  zIndex: 60,
  animation: `toast-in ${TOAST_CONFIG.fadeMs}ms ease-out`,
};

const messageStyle: React.CSSProperties = {
  whiteSpace: "nowrap",
};

const undoBtnStyle: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: 8,
  border: "1px solid var(--accent)",
  background: "var(--accent)",
  color: "#fff",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
  whiteSpace: "nowrap",
};
