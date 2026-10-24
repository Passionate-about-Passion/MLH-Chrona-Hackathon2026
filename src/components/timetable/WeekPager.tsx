"use client";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import type { Entry } from "@/types";
import { EntryCard } from "./EntryCard";
import { DAY_OPEN_HOUR, HOUR_END, HOUR_START, addDays, conflictIds, entriesOn, layoutDay, toMin } from "./logic";

export const HOUR_PX = 72;
/** the hour labels sit over the previous day; must match scroll-padding-left of .tt-pager */
const LABEL_PX = 40;
const SPAN = 3; // days rendered on each side of the selected one
const hours = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);

interface WeekPagerProps {
  date: string;
  entries: Entry[];
  onDate: (iso: string) => void;
  onConflictTap: (entry: Entry) => void;
  /** space for the overlays on top and bottom */
  padTop: number;
  padBottom: number;
}

function DayColumn({ iso, entries, onConflictTap }: { iso: string; entries: Entry[]; onConflictTap: (e: Entry) => void }) {
  const list = useMemo(() => entriesOn(entries, iso), [entries, iso]);
  const conflicts = useMemo(() => conflictIds(list), [list]);
  return (
    <>
      {layoutDay(list).map(({ entry, col, cols }) => {
        const conflict = conflicts.has(entry.id);
        return (
          <EntryCard
            key={entry.id}
            entry={entry}
            col={col}
            cols={cols}
            conflict={conflict}
            onTap={conflict ? () => onConflictTap(entry) : undefined}
            style={{
              top: ((toMin(entry.start) - HOUR_START * 60) / 60) * HOUR_PX + 2,
              height: ((toMin(entry.end) - toMin(entry.start)) / 60) * HOUR_PX - 4,
            }}
          />
        );
      })}
    </>
  );
}

/** Full-screen day paging like the iPhone calendar: one day centred, the neighbours peek in at the edges. */
export function WeekPager({ date, entries, onDate, onConflictTap, padTop, padBottom }: WeekPagerProps) {
  const vertical = useRef<HTMLDivElement>(null);
  const pager = useRef<HTMLDivElement>(null);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const days = useMemo(() => Array.from({ length: SPAN * 2 + 1 }, (_, i) => addDays(date, i - SPAN)), [date]);
  const gridH = (HOUR_END - HOUR_START) * HOUR_PX;

  const centre = (idx: number, smooth = false) => {
    const p = pager.current;
    const col = p?.children[idx] as HTMLElement | undefined;
    if (!p || !col) return;
    const left = col.offsetLeft - LABEL_PX - (p.clientWidth - LABEL_PX - col.offsetWidth) / 2;
    p.scrollTo({ left, behavior: smooth ? "smooth" : "instant" });
  };

  // keep the selected day in the middle after every date change
  useLayoutEffect(() => centre(SPAN), [date]);

  // start near the first appointment of the day
  useEffect(() => {
    const first = entriesOn(entries, date)[0];
    const from = first ? Math.max(toMin(first.start) - 60, HOUR_START * 60) : DAY_OPEN_HOUR * 60;
    vertical.current?.scrollTo({ top: ((from - HOUR_START * 60) / 60) * HOUR_PX });
    // only once, the vertical position is shared by all days afterwards
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries.length > 0]);

  const onScroll = () => {
    if (settle.current) clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      const p = pager.current;
      if (!p) return;
      const mid = p.scrollLeft + LABEL_PX + (p.clientWidth - LABEL_PX) / 2;
      let best = SPAN;
      let dist = Infinity;
      Array.from(p.children).forEach((c, i) => {
        const el = c as HTMLElement;
        const d = Math.abs(el.offsetLeft + el.offsetWidth / 2 - mid);
        if (d < dist) {
          dist = d;
          best = i;
        }
      });
      if (best !== SPAN) onDate(days[best]);
    }, 120);
  };

  return (
    <div className="tt-cal" ref={vertical} tabIndex={0} role="region" aria-label="Tagesansicht">
      <div className="tt-cal-content" style={{ height: padTop + gridH + padBottom }}>
        {hours.map((h) => (
          <div key={h} className="tt-hour" style={{ top: padTop + (h - HOUR_START) * HOUR_PX }}>
            <span>{String(h % 24).padStart(2, "0")}:00</span>
          </div>
        ))}
        <div className="tt-pager" ref={pager} style={{ top: padTop, height: gridH }} onScroll={onScroll}>
          {days.map((iso, i) => (
            <div
              key={iso}
              className="tt-day"
              data-current={i === SPAN || undefined}
              onClickCapture={(e) => {
                if (i === SPAN) return;
                // tapping a peeking neighbour switches to it instead of opening a card
                e.preventDefault();
                e.stopPropagation();
                centre(i, true);
              }}
            >
              <DayColumn iso={iso} entries={entries} onConflictTap={onConflictTap} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
