"use client";
import { useState } from "react";
import type { Entry } from "@/types";
import { CampusMap } from "@/features/act/CampusMap";
import { Modal } from "./Modal";
import { PinIcon } from "./Icons";
import { mapsUrl, range, toMin } from "./logic";

export type EditKind = "course" | "private" | "readonly";

export interface EditValues {
  title: string;
  start: string;
  end: string;
  location: string;
  weight: number;
  fixed: boolean;
}

interface EditSheetProps {
  entry: Entry;
  kind: EditKind;
  conflict: boolean;
  /** e.g. "Montag" */
  dayName: string;
  /** e.g. "Übung 2" for course entries */
  groupName?: string;
  onSave: (v: EditValues) => void;
  onAlternatives: () => void;
  onDelete: () => void;
  onClose: () => void;
}

const KIND_NAME = { V: "Vorlesung", U: "Übung", T: "Tutorium", P: "Privat" } as const;

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="tt-group-row">
      <span className="tt-group-label">{label}</span>
      <span className="tt-group-value">{children}</span>
    </div>
  );
}

/** Event details like the Apple calendar: grouped rows, "Abbrechen" and "Fertig" in the header. */
export function EditSheet({
  entry,
  kind,
  conflict,
  dayName,
  groupName,
  onSave,
  onAlternatives,
  onDelete,
  onClose,
}: EditSheetProps) {
  const [v, setV] = useState<EditValues>({
    title: entry.title,
    start: entry.start,
    end: entry.end,
    location: entry.location,
    weight: entry.weight,
    fixed: entry.fixed,
  });
  const [error, setError] = useState("");
  const set = (patch: Partial<EditValues>) => setV({ ...v, ...patch });
  const own = kind === "private";

  const done = () => {
    if (own && !v.title.trim()) return setError("Gib dem Termin einen Titel.");
    if (own && toMin(v.end) <= toMin(v.start)) return setError("Das Ende muss nach dem Beginn liegen.");
    onSave({ ...v, title: v.title.trim(), location: v.location.trim() });
  };

  return (
    <Modal label="Termin bearbeiten" variant="sheet" onClose={onClose}>
      <div className="tt-sheet-bar">
        <button type="button" className="tt-link-btn tt-link-quiet" onClick={onClose}>
          Abbrechen
        </button>
        <h2 className="tt-sheet-title">{kind === "readonly" ? "Termin" : "Termin bearbeiten"}</h2>
        <button type="button" className="tt-link-btn" onClick={kind === "readonly" ? onClose : done}>
          Fertig
        </button>
      </div>

      {conflict && (
        <div className="tt-conflict-note">
          <span>Überschneidet sich mit einem anderen Termin.</span>
          {kind === "course" && (
            <button type="button" className="tt-link-btn" onClick={onAlternatives}>
              Alternativen
            </button>
          )}
        </div>
      )}

      <div className="tt-group">
        {own ? (
          <>
            <label className="tt-group-row">
              <span className="tt-group-label">Titel</span>
              <input className="tt-group-input" value={v.title} onChange={(e) => set({ title: e.target.value })} />
            </label>
            <label className="tt-group-row">
              <span className="tt-group-label">Ort</span>
              <input
                className="tt-group-input"
                value={v.location}
                placeholder="optional"
                onChange={(e) => set({ location: e.target.value })}
              />
            </label>
          </>
        ) : (
          <>
            <Row label="Titel">{entry.title}</Row>
            <Row label="Ort">{entry.location || "–"}</Row>
          </>
        )}
      </div>

      {entry.location && (
        <div className="tt-group tt-group-map">
          {/* campus site plan (Lenny, TASK-022) */}
          <CampusMap room={entry.location} title={entry.title} kind={KIND_NAME[entry.type]} time={range(entry)} />
          <a
            className="tt-group-row tt-group-action"
            href={mapsUrl(entry.location)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <PinIcon size={14} />
            In Google Maps öffnen
          </a>
        </div>
      )}

      <div className="tt-group">
        <Row label="Tag">{dayName}</Row>
        {own ? (
          <>
            <label className="tt-group-row">
              <span className="tt-group-label">Beginn</span>
              <input
                className="tt-group-input tt-group-time"
                type="time"
                value={v.start}
                onChange={(e) => set({ start: e.target.value })}
              />
            </label>
            <label className="tt-group-row">
              <span className="tt-group-label">Ende</span>
              <input
                className="tt-group-input tt-group-time"
                type="time"
                value={v.end}
                onChange={(e) => set({ end: e.target.value })}
              />
            </label>
          </>
        ) : (
          <Row label="Zeit">{range(entry)}</Row>
        )}
        <Row label="Art">{KIND_NAME[entry.type]}</Row>
        {kind === "course" && (
          <div className="tt-group-row">
            <span className="tt-group-label">Gruppe</span>
            <span className="tt-group-value">
              {groupName}
              <button type="button" className="tt-link-btn" onClick={onAlternatives}>
                Ändern
              </button>
            </span>
          </div>
        )}
      </div>

      <div className="tt-group">
        <Row label="Wiederholen">Jede Woche</Row>
        {own && (
          <div className="tt-group-row">
            <span className="tt-group-label" id="edit-fixed">
              Nicht verschiebbar
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={v.fixed}
              aria-labelledby="edit-fixed"
              className="tt-switch"
              onClick={() => set({ fixed: !v.fixed })}
            />
          </div>
        )}
        {kind !== "readonly" ? (
          <div className="tt-group-row tt-group-stack">
            <span className="tt-group-label">Wichtigkeit</span>
            <div className="tt-weight-row" role="radiogroup" aria-label="Wichtigkeit von 1 bis 5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={v.weight === n}
                  className="tt-weight-pick"
                  onClick={() => set({ weight: n })}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <Row label="Wichtigkeit">{entry.weight}</Row>
        )}
      </div>

      {kind === "readonly" && <p className="tt-sub tt-sheet-note">Dieser Termin kommt aus den Daten des Studiengangs.</p>}

      {error && (
        <p className="tt-error" role="alert">
          {error}
        </p>
      )}

      {own && (
        <div className="tt-group">
          <button type="button" className="tt-group-row tt-group-action" onClick={onDelete}>
            Termin löschen
          </button>
        </div>
      )}
    </Modal>
  );
}
