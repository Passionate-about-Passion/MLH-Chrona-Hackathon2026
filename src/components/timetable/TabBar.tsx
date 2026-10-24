import { BookIcon, CalendarIcon, MicIcon, WaveformIcon } from "./Icons";

export type Tab = "cal" | "plan";

interface TabBarProps {
  tab: Tab;
  onTab: (t: Tab) => void;
  onVoice: () => void;
  /** recording is running (voice overlay open) */
  voiceActive?: boolean;
}

export function TabBar({ tab, onTab, onVoice, voiceActive = false }: TabBarProps) {
  return (
    <nav className="tt-tabbar glass" aria-label="Hauptnavigation">
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
        onClick={onVoice}
        aria-label={voiceActive ? "Aufnahme läuft" : "Per Sprache planen"}
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
