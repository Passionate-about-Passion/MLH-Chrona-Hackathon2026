"use client";
import type { Entry } from "@/types";
import { Modal } from "./Modal";
import { PinIcon } from "./Icons";
import { range, slotDay } from "./logic";

function Slot({ label, entry, tone }: { label: string; entry: Entry; tone: "old" | "new" }) {
  return (
    <section className="tt-slot" data-tone={tone} aria-label={label}>
      <p className="tt-slot-label">{label}</p>
      <p className="tt-slot-when">
        {slotDay(entry)}, {range(entry)}
      </p>
      <p className="tt-option-where">
        <PinIcon size={13} />
        {entry.location}
      </p>
    </section>
  );
}

interface ChangePreviewProps {
  before: Entry;
  after: Entry;
  onBack: () => void;
  onApply: () => void;
  onClose: () => void;
}

export function ChangePreview({ before, after, onBack, onApply, onClose }: ChangePreviewProps) {
  return (
    <Modal label="Änderung prüfen" onClose={onClose}>
      <h2 className="tt-h2">{before.title}</h2>
      <Slot label="Alt" entry={before} tone="old" />
      <Slot label="Neu" entry={after} tone="new" />
      <div className="tt-actions">
        <button type="button" className="tt-btn tt-btn-quiet" onClick={onBack}>
          Zurück
        </button>
        <button type="button" className="tt-btn tt-btn-primary" onClick={onApply}>
          Übernehmen
        </button>
      </div>
    </Modal>
  );
}
