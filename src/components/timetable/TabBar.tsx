"use client";
import { BookIcon, CalendarIcon, MicIcon, WaveformIcon } from "./Icons";
import { useSquish } from "./useSquish";

export type Tab = "cal" | "plan";

interface TabBarProps {
  tab: Tab;
  onTab: (t: Tab) => void;
  /** pressedAt = performance.now() of the press (push-to-talk), undefined for keyboard */
  onVoice: (pressedAt?: number) => void;
  /** recording is running (voice overlay open) */
  voiceActive?: boolean;
}

export function TabBar({ tab, onTab, onVoice, voiceActive = false }: TabBarProps) {
  const moving = useSquish(tab);
  return (
    <nav className="tt-tabbar glass" aria-label="Hauptnavigation">
      {/* light glass pill that slides to the active tab */}
      <span className="tt-tab-pill glass" data-tab={tab} data-moving={moving || undefined} aria-hidden="true" />
      <button
        type="button"
        className="tt-tab"
        aria-current={tab === "cal" ? "page" : undefined}
        onClick={() => onTab("cal")}
      >
        <CalendarIcon />
        <span>Kalender</span>
      </button>
      <button
        type="button"
        className="tt-mic glass"
        data-active={voiceActive || undefined}
        // recording starts on press: hold to talk, or tap and stop in the overlay
        onPointerDown={(e) => {
          if (e.button === 0) onVoice(performance.now());
        }}
        onClick={(e) => {
          if (e.detail === 0) onVoice(); // keyboard (Enter/Space)
        }}
        aria-label={voiceActive ? "Aufnahme läuft" : "Per Sprache planen, gedrückt halten oder tippen"}
      >
        {voiceActive ? <WaveformIcon /> : <MicIcon size={24} />}
      </button>
      <button
        type="button"
        className="tt-tab"
        aria-current={tab === "plan" ? "page" : undefined}
        onClick={() => onTab("plan")}
      >
        <BookIcon />
        <span>Lernplan</span>
      </button>
    </nav>
  );
}
