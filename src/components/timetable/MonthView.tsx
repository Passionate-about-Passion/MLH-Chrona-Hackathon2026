"use client";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Entry } from "@/types";
import { LockIcon, PinIcon, RepeatIcon } from "./Icons";
import {
  MONTHS_LONG,
  WD_LONG,
  WD_SHORT,
  addDays,
  addMonths,
  conflictIds,
  dateInWeek,
  dayParts,
  entriesOn,
  range,
  weekdayOf,
} from "./logic";

const SPAN = 12; // months rendered before and after the start month

interface MonthViewProps {
  date: string;
  today: string;
  entries: Entry[];
  /** first tap on a day */
  onSelect: (iso: string) => void;
  /** second tap on the selected day */
  onOpenDay: (iso: string) => void;
  onEntryTap: (e: Entry) => void;
  onMap: (e: Entry) => void;
  onConflictTap: (e: Entry) => void;
}

const firstOfMonth = (iso: string) => `${iso.slice(0, 8)}01`;
const monthIndex = (iso: string) =>
  Number(iso.slice(0, 4)) * 12 + Number(iso.slice(5, 7)) - 1;

/** up to 3 dots: red first on a conflict day, "+" as third when there are more */
function dotsFor(list: Entry[], conflict: boolean): string[] {
  const all = [...(conflict ? ["X"] : []), ...list.map((e) => e.type)];
  const shown = all.slice(0, 3);
  if (all.length > 3) shown[2] = "+";
  return shown;
}

function MonthGrid({
  month,
  date,
  today,
  entries,
  onTap,
}: {
  month: string;
  date: string;
  today: string;
  entries: Entry[];
  onTap: (iso: string) => void;
}) {
  const start = dateInWeek(month, 0);
  const ym = month.slice(0, 7);
  return (
    <div className="tt-mv-month" role="grid" aria-label={dayParts(month).month}>
      {Array.from({ length: 42 }, (_, i) => {
        const iso = addDays(start, i);
        const list = entriesOn(entries, iso);
        const bad =
          conflictIds(list).size > 0
            ? list.filter((e) => conflictIds(list).has(e.id)).length
            : 0;
        const d = Number(iso.slice(8));
        return (
          <button
            key={iso}
            type="button"
            className="tt-mv-day"
            data-out={iso.slice(0, 7) !== ym || undefined}
            data-today={iso === today || undefined}
            data-selected={iso === date || undefined}
            data-weekend={weekdayOf(iso) >= 5 || undefined}
            aria-label={`${d}. ${MONTHS_LONG[Number(iso.slice(5, 7)) - 1]}, ${list.length} ${list.length === 1 ? "Termin" : "Termine"}${bad ? `, davon ${bad} im Konflikt` : ""}`}
            aria-current={iso === date ? "date" : undefined}
            onClick={() => onTap(iso)}
          >
            <span className="tt-mv-num">{d}</span>
            <span className="tt-mv-dots" aria-hidden="true">
              {dotsFor(list, bad > 0).map((t, k) => (
                <i key={k} data-type={t}>
                  {t === "+" ? "+" : null}
                </i>
              ))}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** iPhone-style month view: scrolling month grid on top, the selected day's appointments below. */
export function MonthView({
  date,
  today,
  entries,
  onSelect,
  onOpenDay,
  onEntryTap,
  onMap,
  onConflictTap,
}: MonthViewProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const [base, setBase] = useState(() => firstOfMonth(date));
  const months = useMemo(
    () =>
      Array.from({ length: SPAN * 2 + 1 }, (_, i) => addMonths(base, i - SPAN)),
    [base],
  );
  const [visible, setVisible] = useState(SPAN);

  const idxOf = (iso: string) => monthIndex(iso) - monthIndex(base) + SPAN;

  /** one month block; the scroller is full screen, the grid sits between the two glass bubbles */
  const blockH = (s: HTMLDivElement) =>
    (s.firstElementChild as HTMLElement | null)?.offsetHeight || s.clientHeight;

  const scrollToIdx = (idx: number, smooth: boolean) => {
    const s = scroller.current;
    if (!s) return;
    s.scrollTo({
      top: idx * blockH(s),
      behavior: smooth ? "smooth" : "instant",
    });
  };

  // start on the month of the selected day
  useLayoutEffect(() => {
    scrollToIdx(idxOf(date), false);
    setVisible(idxOf(date));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base]);

  // date changed from outside (slider, "Heute"): follow it
  useEffect(() => {
    const idx = idxOf(date);
    if (idx < 1 || idx > SPAN * 2 - 1) return setBase(firstOfMonth(date));
    if (idx !== visible) scrollToIdx(idx, true);
    // only react to the date, not to scrolling
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const onScroll = () => {
    const s = scroller.current;
    if (!s) return;
    const idx = Math.round(s.scrollTop / blockH(s));
    if (idx !== visible) setVisible(idx);
  };

  const visibleMonth = months[visible] ?? base;
  const todayInView = monthIndex(today) === monthIndex(visibleMonth);

  const dayList = entriesOn(entries, date);
  const bad = conflictIds(dayList);

  const tap = (iso: string) => (iso === date ? onOpenDay(iso) : onSelect(iso));

  return (
    <section className="tt-mv" aria-label="Monatsansicht">
      {/* top glass bubble: month title + weekdays, floating over the grid */}
      <div className="tt-mv-top glass">
        <div className="tt-mv-head">
          <h1 className="tt-month-title" aria-live="polite">
            {dayParts(visibleMonth).month}
          </h1>
          <button
            type="button"
            className="tt-today glass"
            data-hidden={todayInView || undefined}
            tabIndex={todayInView ? -1 : 0}
            aria-hidden={todayInView || undefined}
            onClick={() => {
              // selecting today is enough: the date effect below scrolls to its month
              if (date === today) scrollToIdx(idxOf(today), true);
              else onSelect(today);
            }}
          >
            Heute
          </button>
        </div>
        <div className="tt-mv-wd" aria-hidden="true">
          {WD_SHORT.map((wd) => (
            <span key={wd}>{wd}</span>
          ))}
        </div>
      </div>
      <div className="tt-mv-months" ref={scroller} onScroll={onScroll}>
        {months.map((m) => (
          <MonthGrid
            key={m}
            month={m}
            date={date}
            today={today}
            entries={entries}
            onTap={tap}
          />
        ))}
      </div>
      {/* bottom glass bubble: appointments of the selected day */}
      <div className="tt-mv-list glass">
        <h2 className="tt-mv-list-head">
          {WD_LONG[weekdayOf(date)]},{" "}
          <span>
            {Number(date.slice(8))}. {MONTHS_LONG[Number(date.slice(5, 7)) - 1]}
          </span>
        </h2>
        {dayList.length === 0 ? (
          <p className="tt-mv-empty">Keine Termine</p>
        ) : (
          <ul className="tt-mv-rows">
            {dayList.map((e) => {
              const conflict = bad.has(e.id);
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    className="tt-mv-row"
                    data-type={e.type}
                    data-conflict={conflict || undefined}
                    onClick={() =>
                      conflict && !e.fixed && e.groupId
                        ? onConflictTap(e)
                        : onEntryTap(e)
                    }
                  >
                    <span className="tt-mv-row-main">
                      <span className="tt-mv-row-title">{e.title}</span>
                      <span className="tt-mv-row-meta">
                        <span className="tt-card-time">{range(e)}</span>
                        {e.location && (
                          <span
                            className="tt-mv-row-loc tt-loc-tap"
                            role="button"
                            tabIndex={0}
                            aria-label={`Lageplan: ${e.location}`}
                            onClick={(ev) => { ev.stopPropagation(); onMap(e); }}
                            onKeyDown={(ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); ev.stopPropagation(); onMap(e); } }}
                          >
                            <PinIcon size={13} />
                            {e.location}
                          </span>
                        )}
                      </span>
                    </span>
                    <span className="tt-card-badges">
                      {e.recurring && (
                        <span role="img" aria-label="wiederkehrend">
                          <RepeatIcon size={14} />
                        </span>
                      )}
                      {e.fixed && (
                        <span role="img" aria-label="nicht verschiebbar">
                          <LockIcon size={14} />
                        </span>
                      )}
                      <span
                        className="tt-weight"
                        aria-label={`Wichtigkeit ${e.weight}`}
                      >
                        {e.weight}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
