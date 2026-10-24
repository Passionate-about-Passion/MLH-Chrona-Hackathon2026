"use client";
import { useEffect, useRef, type ReactNode } from "react";

interface ModalProps {
  label: string;
  variant?: "center" | "sheet";
  onClose: () => void;
  children: ReactNode;
}

/** Native <dialog>: focus trap, Esc and inert background come for free. Mount it to open, unmount to close. */
export function Modal({ label, variant = "center", onClose, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      className="tt-dialog"
      data-variant={variant}
      aria-label={label}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="tt-panel glass-dense">{children}</div>
    </dialog>
  );
}
