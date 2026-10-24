import { BookIcon, CalendarIcon, MicIcon } from "./Icons";

export type Tab = "cal" | "plan";

interface TabBarProps {
  tab: Tab;
  onTab: (t: Tab) => void;
  onVoice: () => void;
}

export function TabBar({ tab, onTab, onVoice }: TabBarProps) {
  return (
    <nav className="tt-tabbar" aria-label="Hauptnavigation">
      <button
        type="button"
        className="tt-tab"
        aria-current={tab === "cal" ? "page" : undefined}
        onClick={() => onTab("cal")}
      >
        <CalendarIcon />
        <span>Kalender</span>
      </button>
      <button type="button" className="tt-ai" onClick={onVoice} aria-label="Per Sprache planen">
        <MicIcon />
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
