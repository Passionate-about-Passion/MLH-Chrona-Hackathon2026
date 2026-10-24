"use client";
import type { Entry } from "@/types";
import { Modal } from "./Modal";
import { PinIcon } from "./Icons";
import { WD_LONG, range, weekdayOf } from "./logic";

interface OverlapConfirmProps {
  title: string;
  date: string;
  start: string;
  end: string;
  /** appointments the new one would overlap; none of them can move to another group */
  hits: Entry[];
  onConfirm: () => void;
  onClose: () => void;
}

/** Asked before a new appointment is saved when it collides with something that has no alternative. */
export function OverlapConfirm({ title, date, start, end, hits, onConfirm, onClose }: OverlapConfirmProps) {
  return (
    <Modal label="Überschneidung" onClose={onClose}>
      <h2 className="tt-h2">Trotzdem eintragen?</h2>
      <p className="tt-sub">
        „{title}“ am {WD_LONG[weekdayOf(date)]}, {start}–{end} Uhr überschneidet sich mit:
      </p>
      <ul className="tt-mv-rows">
        {hits.map((e) => (
          <li key={e.id}>
            <div className="tt-mv-row" data-type={e.type} data-conflict>
              <span className="tt-mv-row-main">
                <span className="tt-mv-row-title">{e.title}</span>
                <span className="tt-mv-row-meta">
                  <span className="tt-card-time">{range(e)}</span>
                  {e.location && (
                    <span className="tt-mv-row-loc">
                      <PinIcon size={13} />
                      {e.location}
                    </span>
                  )}
                </span>
              </span>
            </div>
          </li>
        ))}
      </ul>
      <p className="tt-sub tt-overlap-note">Für {hits.length === 1 ? "diesen Termin" : "diese Termine"} gibt es keine andere Gruppe.</p>
      <div className="tt-actions">
        <button type="button" className="tt-btn tt-btn-quiet" onClick={onClose}>
          Abbrechen
        </button>
        <button type="button" className="tt-btn tt-btn-primary" onClick={onConfirm}>
          Eintragen
        </button>
      </div>
    </Modal>
  );
}
