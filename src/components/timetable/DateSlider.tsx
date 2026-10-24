"use client";
import { useEffect, useRef, useState } from "react";
import { addDays, addMonths, clampDate, dayParts } from "./logic";
import { useSquish } from "./useSquish";

export type Mode = "W" | "M";

interface DateSliderProps {
  mode: Mode;
  onMode: (m: Mode) => void;
  date: string;
  onDate: (iso: string) => void;
  min: string;
  max: string;
  /** fade to 40 % after 3 s without touch (month view, so it does not hide numbers) */
  autoDim?: boolean;
}

const STEP_PX = 22;
const TAP_SLOP = 6;
const DIM_AFTER_MS = 3000;

/**
 * Jog dial: drag the pill up or down to change the day (W) or the month (M). Tap W or M to switch;
 * a filled thumb slides between the two labels.
 */
export function DateSlider({ mode, onMode, date, onDate, min, max, autoDim = false }: DateSliderProps) {
  const drag = useRef<{ y: number; base: string; active: boolean } | null>(null);
  const [offset, setOffset] = useState(0);
  const [bubble, setBubble] = useState<string | null>(null);
  const [dim, setDim] = useState(false);
  const dimTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moving = useSquish(mode);

  const wake = () => {
    setDim(false);
    if (dimTimer.current) clearTimeout(dimTimer.current);
    if (autoDim) dimTimer.current = setTimeout(() => setDim(true), DIM_AFTER_MS);
  };

  useEffect(() => {
    wake();
    return () => {
      if (dimTimer.current) clearTimeout(dimTimer.current);
    };
    // restart the timer when the view changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDim]);

  const shift = (base: string, steps: number) =>
    clampDate(mode === "W" ? addDays(base, steps) : addMonths(base, steps), min, max);

  const label = (iso: string) => {
    const p = dayParts(iso);
    return mode === "W" ? `${p.wd} ${p.day}` : p.month;
  };

  const end = () => {
    drag.current = null;
    setOffset(0);
    setBubble(null);
    wake();
  };

  return (
    <div
      className="tt-slider glass"
      data-mode={mode}
      data-dim={(autoDim && dim && !bubble) || undefined}
      role="group"
      aria-label={`Datum wechseln, ${mode === "W" ? "tageweise" : "monatsweise"}. Pfeil hoch und runter zum Blättern.`}
      style={{ touchAction: "none", ["--nudge" as string]: `${offset / 4}px` }}
      onPointerEnter={wake}
      onFocus={wake}
      onPointerDown={(e) => {
        wake();
        drag.current = { y: e.clientY, base: date, active: false };
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d) return;
        const dy = e.clientY - d.y;
        if (!d.active && Math.abs(dy) > TAP_SLOP) {
          d.active = true;
          e.currentTarget.setPointerCapture(e.pointerId);
        }
        if (d.active) {
          const target = shift(d.base, Math.trunc(dy / STEP_PX));
          onDate(target);
          setBubble(label(target));
          setOffset(Math.max(-40, Math.min(40, dy)));
        }
      }}
      onPointerUp={end}
      onPointerCancel={end}
      onKeyDown={(e) => {
        wake();
        if (e.key === "ArrowUp") {
          e.preventDefault();
          onDate(shift(date, -1));
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          onDate(shift(date, 1));
        }
      }}
    >
      <span className="tt-slider-thumb" data-moving={moving || undefined} aria-hidden="true" />
      <button
        type="button"
        className="tt-slider-key"
        data-active={mode === "W" || undefined}
        aria-pressed={mode === "W"}
        aria-label="Wochenansicht, tageweise blättern"
        onClick={() => onMode("W")}
      >
        Wo
      </button>
      <button
        type="button"
        className="tt-slider-key"
        data-active={mode === "M" || undefined}
        aria-pressed={mode === "M"}
        aria-label="Monatsansicht, monatsweise blättern"
        onClick={() => onMode("M")}
      >
        Mon
      </button>
      {bubble && (
        <div className="tt-bubble glass-dense" role="status">
          {bubble}
        </div>
      )}
    </div>
  );
}
