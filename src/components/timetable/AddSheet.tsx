"use client";
import { useState } from "react";
import type { Entry } from "@/types";
import { Modal } from "./Modal";
import { toMin, weekdayOf } from "./logic";

interface AddSheetProps {
  date: string;
  onSave: (entry: Omit<Entry, "id">) => void;
  onClose: () => void;
}

function Switch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="tt-row">
      <span id={`sw-${label}`}>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`sw-${label}`}
        className="tt-switch"
        onClick={() => onChange(!checked)}
      />
    </div>
  );
}

export function AddSheet({ date, onSave, onClose }: AddSheetProps) {
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [location, setLocation] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [fixed, setFixed] = useState(false);
  const [weight, setWeight] = useState(3);
  const [error, setError] = useState("");

  const save = () => {
    if (!title.trim()) return setError("Gib dem Termin einen Titel.");
    if (!start || !end || toMin(end) <= toMin(start)) return setError("Das Ende muss nach dem Beginn liegen.");
    onSave({
      title: title.trim(),
      type: "P",
      start,
      end,
      location: location.trim(),
      weight,
      recurring,
      fixed,
      wd: recurring ? weekdayOf(date) : undefined,
      date: recurring ? undefined : date,
    });
  };

  return (
    <Modal label="Termin hinzufügen" variant="sheet" onClose={onClose}>
      <h2 className="tt-h2">Neuer Termin</h2>
      <form
        className="tt-form"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <label className="tt-field">
          <span>Titel</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="z. B. Zahnarzt" autoFocus />
        </label>
        <div className="tt-two">
          <label className="tt-field">
            <span>Von</span>
            <input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
          </label>
          <label className="tt-field">
            <span>Bis</span>
            <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
          </label>
        </div>
        <label className="tt-field">
          <span>Ort</span>
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="optional" />
        </label>
        <Switch label="Wöchentlich wiederholen" checked={recurring} onChange={setRecurring} />
        <Switch label="Nicht verschiebbar" checked={fixed} onChange={setFixed} />
        <fieldset className="tt-weights">
          <legend>Wichtigkeit</legend>
          <div role="radiogroup" aria-label="Wichtigkeit von 1 bis 5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={weight === n}
                className="tt-weight-pick"
                onClick={() => setWeight(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </fieldset>
        {error && (
          <p className="tt-error" role="alert">
            {error}
          </p>
        )}
        <div className="tt-actions">
          <button type="button" className="tt-btn tt-btn-quiet" onClick={onClose}>
            Abbrechen
          </button>
          <button type="submit" className="tt-btn tt-btn-primary">
            Speichern
          </button>
        </div>
      </form>
    </Modal>
  );
}
