"use client";
import { useEffect } from "react";

export interface ToastState {
  id: number;
  message: string;
  undo?: () => void;
}

interface ToastProps {
  toast: ToastState | null;
  onDismiss: () => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 6000);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  return (
    <div className="tt-toast-slot" role="status" aria-live="polite">
      {toast && (
        <div className="tt-toast" key={toast.id}>
          <span>{toast.message}</span>
          {toast.undo && (
            <button
              type="button"
              onClick={() => {
                toast.undo?.();
                onDismiss();
              }}
            >
              Rückgängig
            </button>
          )}
        </div>
      )}
    </div>
  );
}
