"use client";

import { useState } from "react";
import type { Subject } from "@/lib/ui/timerApi";

type Props = {
  subjects: Subject[];
  selectedSubjectId: string;
  onChange: (id: string) => void;
  disabled?: boolean;
};

export default function SubjectSelect({ subjects, selectedSubjectId, onChange, disabled = false }: Props) {
  const [open, setOpen] = useState(false);
  const selected = subjects.find((s) => s.id === selectedSubjectId);

  if (subjects.length === 0) {
    return <div style={emptyStyle}>科目が未登録です</div>;
  }

  return (
    <div style={{ position: "relative", marginBottom: 24 }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        style={{ ...buttonStyle, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1 }}
      >
        {selected && <span style={{ ...dotStyle, background: selected.colorHex }} />}
        <span>{selected ? selected.name : "科目を選択"}</span>
      </button>

      {open && !disabled && (
        <>
          <div style={overlayStyle} onClick={() => setOpen(false)} />
          <div style={menuStyle}>
            {subjects.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  onChange(s.id);
                  setOpen(false);
                }}
                style={{
                  ...menuItemStyle,
                  background: s.id === selectedSubjectId ? "rgba(255,255,255,0.08)" : "transparent",
                }}
              >
                <span style={{ ...dotStyle, background: s.colorHex }} />
                <span>{s.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: 999,
  border: "1px solid rgba(186,230,253,0.15)",
  background: "rgba(15,23,42,0.5)",
  color: "#eaf0ff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  fontSize: 13,
};

const emptyStyle: React.CSSProperties = {
  marginBottom: 24,
  padding: "12px 16px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.15)",
  color: "rgba(234,240,255,0.7)",
  fontSize: 13,
  textAlign: "center",
};

const dotStyle: React.CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: "50%",
  display: "inline-block",
};

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 10,
};

const menuStyle: React.CSSProperties = {
  position: "absolute",
  zIndex: 20,
  width: "100%",
  marginTop: 8,
  maxHeight: 240,
  overflowY: "auto",
  borderRadius: 16,
  border: "1px solid rgba(186,230,253,0.15)",
  background: "rgba(15,23,42,0.9)",
  backdropFilter: "blur(10px)",
  boxShadow: "0 18px 40px rgba(0,0,0,0.45)",
};

const menuItemStyle: React.CSSProperties = {
  width: "100%",
  textAlign: "left",
  padding: "10px 16px",
  display: "flex",
  alignItems: "center",
  gap: 10,
  border: "none",
  color: "#eaf0ff",
  fontSize: 13,
};
