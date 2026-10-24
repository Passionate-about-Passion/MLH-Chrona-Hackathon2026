"use client";
import type { Entry } from "@/types";
import { Modal } from "./Modal";
import { PinIcon } from "./Icons";
import {
  WD_LONG,
  conflictIds,
  entriesOn,
  layoutDay,
  range,
  sessionDate,
  toMin,
  fromMin,
  weekdayOf,
  type Alternative,
} from "./logic";

const MINI_PX = 30;
const PAD_MIN = 120;

interface MiniDayProps {
  alt: Alternative;
  date: string;
  /** all entries except the one being moved */
  others: Entry[];
  title: string;
  weight: number;
}

/** Day excerpt: two hours before to two hours after the new slot. */
function MiniDay({ alt, date, others, title, weight }: MiniDayProps) {
  const { session } = alt;
  const winStart = Math.max(toMin(session.start) - PAD_MIN, 0);
  const winEnd = Math.min(toMin(session.end) + PAD_MIN, 24 * 60);
  const fresh: Entry = {
    id: "new",
    title,
    type: "U",
    start: session.start,
    end: session.end,
    location: session.location,
    weight,
    recurring: false,
    fixed: false,
  };
  const visible = entriesOn(others, date).filter((e) => toMin(e.start) < winEnd && toMin(e.end) > winStart);
  const all = [...visible, fresh];
  const bad = conflictIds(all);
  const placed = layoutDay(all);
  const firstHour = Math.ceil(winStart / 60);
  const hourMarks: number[] = [];
  for (let h = firstHour; h * 60 <= winEnd; h++) hourMarks.push(h);

  return (
    <div className="tt-mini" style={{ height: ((winEnd - winStart) / 60) * MINI_PX }}>
      {hourMarks.map((h) => (
        <div key={h} className="tt-mini-hour" style={{ top: ((h * 60 - winStart) / 60) * MINI_PX }}>
          <span>{fromMin(h * 60)}</span>
        </div>
      ))}
      <div className="tt-mini-lane">
        {placed.map(({ entry, col, cols }) => {
          const top = ((Math.max(toMin(entry.start), winStart) - winStart) / 60) * MINI_PX + 1;
          const bottom = ((Math.min(toMin(entry.end), winEnd) - winStart) / 60) * MINI_PX - 1;
          const isNew = entry.id === "new";
          return (
            <div
              key={entry.id}
              className="tt-mini-item"
              data-type={isNew ? "new" : entry.type}
              data-new={isNew || undefined}
              data-conflict={bad.has(entry.id) || undefined}
              style={{
                top,
                height: Math.max(bottom - top, 14),
                left: `calc(${col} * 100% / ${cols})`,
                width: `calc(100% / ${cols} - 3px)`,
              }}
            >
              {isNew ? "Neu: " : ""}
              {entry.title}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ConflictDialogProps {
  entry: Entry;
  entries: Entry[];
  alternatives: Alternative[];
  shownDate: string;
  onChoose: (alt: Alternative) => void;
  onClose: () => void;
}

export function ConflictDialog({ entry, entries, alternatives, shownDate, onChoose, onClose }: ConflictDialogProps) {
  const others = entries.filter((e) => e.id !== entry.id);
  return (
    <Modal label="Alternativen für den Termin" onClose={onClose}>
      <h2 className="tt-h2">{entry.title} verschieben</h2>
      <p className="tt-sub">
        Jetzt: {WD_LONG[entry.recurring ? (entry.wd ?? 0) : weekdayOf(entry.date ?? shownDate)]}, {range(entry)}
      </p>
      {alternatives.length === 0 ? (
        <p className="tt-sub">Für diesen Termin gibt es keine Alternative.</p>
      ) : (
        <ul className="tt-options" aria-label="Alternativen, seitlich wischen">
          {alternatives.map((alt) => {
            const date = sessionDate(alt.session, shownDate);
            return (
              <li key={alt.group.id} className="tt-option">
                <p className="tt-option-title">{alt.group.name}</p>
                <p className="tt-option-when">
                  {WD_LONG[weekdayOf(date)]}, {range(alt.session)}
                </p>
                <p className="tt-option-where">
                  <PinIcon size={13} />
                  {alt.session.location}
                </p>
                <MiniDay alt={alt} date={date} others={others} title={entry.title} weight={entry.weight} />
                <button type="button" className="tt-btn tt-btn-primary" onClick={() => onChoose(alt)}>
                  Wählen
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <button type="button" className="tt-btn tt-btn-quiet" onClick={onClose}>
        Schließen
      </button>
    </Modal>
  );
}
