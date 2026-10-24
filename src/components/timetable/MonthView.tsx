import type { Entry } from "@/types";
import { WD_SHORT, addDays, conflictIds, dateInWeek, dayParts, entriesOn } from "./logic";

interface MonthViewProps {
  date: string;
  today: string;
  entries: Entry[];
  onPick: (iso: string) => void;
}

export function MonthView({ date, today, entries, onPick }: MonthViewProps) {
  const first = `${date.slice(0, 8)}01`;
  const start = dateInWeek(first, 0);
  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  const month = date.slice(0, 7);

  return (
    <section className="tt-month" aria-label={dayParts(date).month}>
      <h1 className="tt-month-title">{dayParts(date).month}</h1>
      <div className="tt-month-grid" role="grid">
        {WD_SHORT.map((wd) => (
          <span key={wd} className="tt-month-wd" aria-hidden="true">
            {wd}
          </span>
        ))}
        {days.map((iso) => {
          const list = entriesOn(entries, iso);
          const conflict = conflictIds(list).size > 0;
          return (
            <button
              key={iso}
              type="button"
              className="tt-month-day"
              data-out={iso.slice(0, 7) !== month || undefined}
              data-today={iso === today || undefined}
              aria-current={iso === date ? "date" : undefined}
              aria-label={`${Number(iso.slice(8))}. ${list.length} Termine${conflict ? ", Konflikt" : ""}`}
              onClick={() => onPick(iso)}
            >
              <span>{Number(iso.slice(8))}</span>
              <span className="tt-month-dots" aria-hidden="true">
                {list.slice(0, 4).map((e) => (
                  <i key={e.id} data-type={e.type} />
                ))}
                {conflict && <i data-conflict />}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
