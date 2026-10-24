"use client";
import { useRef, useState } from "react";
import { addDays, addMonths, clampDate, dayParts } from "./logic";

export type Mode = "W" | "M";

interface DateSliderProps {
  mode: Mode;
  onMode: (m: Mode) => void;
  date: string;
  onDate: (iso: string) => void;
  min: string;
  max: string;
}

const STEP_PX = 22;
const TAP_SLOP = 6;

/** Jog dial: drag the pill up or down to change the day (W) or the month (M). Tap W or M to switch. */
export function DateSlider({ mode, onMode, date, onDate, min, max }: DateSliderProps) {
  const drag = useRef<{ y: number; base: string; active: boolean } | null>(null);
  const [offset, setOffset] = useState(0);
  const [bubble, setBubble] = useState<string | null>(null);

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
  };

  return (
    <div
      className="tt-slider"
      role="group"
      aria-label={`Datum wechseln, ${mode === "W" ? "tageweise" : "monatsweise"}. Pfeil hoch und runter zum Blättern.`}
      style={{ touchAction: "none" }}
      onPointerDown={(e) => {
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
      <button
        type="button"
        className="tt-slider-key"
        data-active={mode === "W" || undefined}
        aria-pressed={mode === "W"}
        aria-label="Tageweise blättern"
        onClick={() => onMode("W")}
      >
        W
      </button>
      <div className="tt-slider-track" aria-hidden="true">
        <span className="tt-slider-knob" style={{ transform: `translateY(${offset}px)` }} />
      </div>
      <button
        type="button"
        className="tt-slider-key"
        data-active={mode === "M" || undefined}
        aria-pressed={mode === "M"}
        aria-label="Monatsweise blättern"
        onClick={() => onMode("M")}
      >
        M
      </button>
      {bubble && (
        <div className="tt-bubble" role="status">
          {bubble}
        </div>
      )}
    </div>
  );
}
