import type { Entry } from "@/types";
import { WD_SHORT, addDays, dateInWeek, entriesOn } from "./logic";

interface WeekStripProps {
  date: string;
  today: string;
  entries: Entry[];
  onDate: (iso: string) => void;
}

/** Mo–So of the shown week. Replaces the old date heading. */
export function WeekStrip({ date, today, entries, onDate }: WeekStripProps) {
  const monday = dateInWeek(date, 0);
  return (
    <nav className="tt-week" aria-label="Woche">
      {WD_SHORT.map((wd, i) => {
        const iso = addDays(monday, i);
        const busy = entriesOn(entries, iso).length > 0;
        return (
          <button
            key={iso}
            type="button"
            className="tt-week-day"
            aria-current={iso === date ? "date" : undefined}
            data-today={iso === today || undefined}
            aria-label={`${wd} ${Number(iso.slice(8))}.${busy ? ", Termine" : ""}`}
            onClick={() => onDate(iso)}
          >
            <span className="tt-week-wd">{wd}</span>
            <span className="tt-week-num">{Number(iso.slice(8))}</span>
            <span className="tt-week-dot" data-on={busy || undefined} aria-hidden="true" />
          </button>
        );
      })}
    </nav>
  );
}
