"use client";
import { useEffect, useMemo, useRef } from "react";
import type { Entry } from "@/types";
import { EntryCard } from "./EntryCard";
import { HOUR_END, HOUR_START, conflictIds, layoutDay, toMin } from "./logic";

export const HOUR_PX = 76;
const hours = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);

interface DayViewProps {
  date: string;
  entries: Entry[];
  onConflictTap: (entry: Entry) => void;
}

export function DayView({ date, entries, onConflictTap }: DayViewProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const conflicts = useMemo(() => conflictIds(entries), [entries]);
  const placed = useMemo(() => layoutDay(entries), [entries]);

  useEffect(() => {
    const first = entries[0];
    const from = first ? Math.max(toMin(first.start) - 60, HOUR_START * 60) : HOUR_START * 60;
    scroller.current?.scrollTo({ top: ((from - HOUR_START * 60) / 60) * HOUR_PX });
    // only re-scroll when the day changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  return (
    <div className="tt-scroll" ref={scroller} tabIndex={0} role="region" aria-label="Tagesansicht">
      <div className="tt-grid" style={{ height: (HOUR_END - HOUR_START) * HOUR_PX + 24 }}>
        {hours.map((h) => (
          <div key={h} className="tt-hour" style={{ top: (h - HOUR_START) * HOUR_PX + 12 }}>
            <span>{String(h).padStart(2, "0")}:00</span>
          </div>
        ))}
        <div className="tt-lane" style={{ top: 12 }}>
          {placed.map(({ entry, col, cols }) => {
            const conflict = conflicts.has(entry.id);
            const top = ((toMin(entry.start) - HOUR_START * 60) / 60) * HOUR_PX + 2;
            const height = ((toMin(entry.end) - toMin(entry.start)) / 60) * HOUR_PX - 4;
            return (
              <EntryCard
                key={entry.id}
                entry={entry}
                col={col}
                cols={cols}
                conflict={conflict}
                onTap={conflict ? () => onConflictTap(entry) : undefined}
                style={{ top, height }}
              />
            );
          })}
        </div>
        {entries.length === 0 && (
          <p className="tt-empty">Keine Termine an diesem Tag. Mit „+“ legst du einen an.</p>
        )}
      </div>
    </div>
  );
}
