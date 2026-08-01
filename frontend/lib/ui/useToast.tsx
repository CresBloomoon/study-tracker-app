"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import Toast from "@/components/ui/Toast";
import { TOAST_CONFIG } from "./uiConfig";

type ToastOptions = {
  onUndo?: () => void;
  undoLabel?: string;
  // 省略時は TOAST_CONFIG.durationMs。「元に戻す」を伴うトーストは、
  // 呼び出し側が TOAST_CONFIG.undoGraceSec * 1000 等を明示的に渡す想定
  // （このフック自体は undo の意味を知らない汎用実装のため）
  durationMs?: number;
};

type ToastState = {
  message: string;
  onUndo?: () => void;
  undoLabel?: string;
  leaving: boolean;
};

type ToastContextValue = {
  showToast: (message: string, options?: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const removeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, options: ToastOptions = {}) => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (removeTimerRef.current) clearTimeout(removeTimerRef.current);

    setToast({ message, onUndo: options.onUndo, undoLabel: options.undoLabel, leaving: false });

    const durationMs = options.durationMs ?? TOAST_CONFIG.durationMs;

    // durationMs表示後にフェードアウトを開始し、TOAST_CONFIG.fadeMs経過後に実際に取り除く
    hideTimerRef.current = setTimeout(() => {
      setToast((prev) => (prev ? { ...prev, leaving: true } : prev));
      removeTimerRef.current = setTimeout(() => setToast(null), TOAST_CONFIG.fadeMs);
    }, durationMs);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div
          style={{
            opacity: toast.leaving ? 0 : 1,
            transition: `opacity ${TOAST_CONFIG.fadeMs}ms ease-in`,
          }}
        >
          <Toast message={toast.message} onUndo={toast.onUndo} undoLabel={toast.undoLabel} />
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
