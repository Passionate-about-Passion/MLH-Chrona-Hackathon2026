import { WD_SHORT, addDays, dateInWeek } from "./logic";

interface WeekStripProps {
  date: string;
  today: string;
  onDate: (iso: string) => void;
}

/** Glass capsule with Mo–So of the shown week. */
export function WeekStrip({ date, today, onDate }: WeekStripProps) {
  const monday = dateInWeek(date, 0);
  return (
    <nav className="tt-week glass" aria-label="Woche">
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
