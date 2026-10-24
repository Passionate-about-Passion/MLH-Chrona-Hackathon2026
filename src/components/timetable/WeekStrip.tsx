"use client";
import { WD_SHORT, addDays, dateInWeek, weekdayOf } from "./logic";
import { useSquish } from "./useSquish";

interface WeekStripProps {
  date: string;
  today: string;
  onDate: (iso: string) => void;
}

/** Glass capsule with Mo–So of the shown week. A tinted glass pill slides to the selected day. */
export function WeekStrip({ date, today, onDate }: WeekStripProps) {
  const monday = dateInWeek(date, 0);
  const idx = weekdayOf(date);
  const moving = useSquish(date);
  return (
    <nav className="tt-week glass" aria-label="Woche">
      <span
        className="tt-week-pill glass"
        data-moving={moving || undefined}
        style={{ ["--i" as string]: idx }}
        aria-hidden="true"
      />
      {WD_SHORT.map((wd, i) => {
        const iso = addDays(monday, i);
        return (
          <button
            key={iso}
            type="button"
            className="tt-week-day"
            aria-current={iso === date ? "date" : undefined}
            data-today={iso === today || undefined}
            aria-label={`${wd} ${Number(iso.slice(8))}.${iso === today ? ", heute" : ""}`}
            onClick={() => onDate(iso)}
          >
            <span className="tt-week-wd">{wd}</span>
            <span className="tt-week-num">{Number(iso.slice(8))}</span>
            <span className="tt-week-dot" aria-hidden="true" />
          </button>
        );
      })}
    </nav>
  );
}
