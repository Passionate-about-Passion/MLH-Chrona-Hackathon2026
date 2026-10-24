"use client";
import { useEffect, useRef, useState } from "react";
import type { Course } from "@/types";
import { voice, type ParsedIntent } from "@/voice";
import { CloseIcon, SendIcon, WaveformIcon } from "./Icons";
import { WD_LONG, weekdayOf } from "./logic";

/** stop the microphone without sending the recording anywhere */
const stopWithoutTranscript = async () => {
  if (voice.cancelListening) await voice.cancelListening();
  else await voice.stopListening();
};

type Phase =
  | { k: "listening" }
  | { k: "thinking"; text: string }
  | { k: "confirm"; text: string; intent: ParsedIntent; question: string }
  | { k: "unknown"; text: string }
  | { k: "error" };

function questionFor(intent: ParsedIntent, courses: Course[]): string | null {
  if (intent.type === "block_time") {
    return `Ich blockiere ${WD_LONG[weekdayOf(intent.date)]}, ${intent.start}–${intent.end} Uhr als festen Termin. Stimmt das?`;
  }
  if (intent.type === "free_wish") {
    return `Ich halte ${WD_LONG[weekdayOf(intent.date)]} von ${intent.start} bis ${intent.end} Uhr möglichst frei. Stimmt das?`;
  }
  if (intent.type === "set_course_weight") {
    const c = courses.find((x) => x.id === intent.courseId);
    return c ? `Ich setze die Wichtigkeit von ${c.name} auf ${intent.weight}. Stimmt das?` : null;
  }
  return null;
}

/** holding the mic longer than this = push-to-talk (release sends); shorter = tap to start, tap again to send */
const HOLD_MS = 350;

interface VoiceOverlayProps {
  courses: Course[];
  /** performance.now() of the press on the mic button; undefined when opened by keyboard */
  pressedAt?: number;
  /** increases when the mic button is tapped again while listening: stop and send */
  stopSignal?: number;
  /** called only after the user said "Ja" */
  onConfirm: (intent: ParsedIntent) => void;
  onClose: () => void;
}

/**
 * Listening: only a slim glass input bar above the tab bar (speak, or type).
 * After sending: a compact glass card; the confirmation always comes before the plan changes.
 */
export function VoiceOverlay({ courses, pressedAt, stopSignal = 0, onConfirm, onClose }: VoiceOverlayProps) {
  const [phase, setPhase] = useState<Phase>({ k: "listening" });
  const [speakAnswer, setSpeakAnswer] = useState(true);
  const [typed, setTyped] = useState("");
  const [holding, setHolding] = useState(pressedAt != null);
  const alive = useRef(true);
  const finishRef = useRef<() => Promise<void>>(async () => {});

  const listen = () => {
    setTyped("");
    setPhase({ k: "listening" });
    voice.startListening().catch(() => alive.current && setPhase({ k: "error" }));
  };

  useEffect(() => {
    alive.current = true;
    listen();
    return () => {
      alive.current = false;
    };
    // start once when the overlay opens
  }, []);

  const finish = async () => {
    try {
      // typed text wins: the microphone may be blocked or noisy during the demo
      setPhase({ k: "thinking", text: typed.trim() || "…" });
      const transcript = typed.trim()
        ? (await stopWithoutTranscript(), { text: typed.trim(), lang: "de" as const })
        : await voice.stopListening();
      if (!alive.current) return;
      if (!transcript.text) return setPhase({ k: "unknown", text: "" });
      setPhase({ k: "thinking", text: transcript.text });
      const intent = await voice.parseIntent(transcript);
      if (!alive.current) return;
      // a question changes nothing in the plan, so it needs no confirmation
      if (intent.type === "query") return onConfirm(intent);
      const question = questionFor(intent, courses);
      if (!question) return setPhase({ k: "unknown", text: transcript.text });
      setPhase({ k: "confirm", text: transcript.text, intent, question });
      if (speakAnswer) voice.speak(question).catch(() => {});
    } catch {
      if (alive.current) setPhase({ k: "error" });
    }
  };

  finishRef.current = finish;

  // push-to-talk: the finger is still on the mic button when the bar appears
  useEffect(() => {
    if (pressedAt == null) return;
    const up = () => {
      setHolding(false);
      if (performance.now() - pressedAt > HOLD_MS) void finishRef.current();
    };
    window.addEventListener("pointerup", up, { once: true });
    window.addEventListener("pointercancel", up, { once: true });
    return () => {
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [pressedAt]);

  // second tap on the mic while listening = stop and send (like Voice Memos)
  const firstSignal = useRef(stopSignal);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  useEffect(() => {
    if (stopSignal !== firstSignal.current && phaseRef.current.k === "listening") void finishRef.current();
  }, [stopSignal]);

  const cancel = () => {
    stopWithoutTranscript().catch(() => {});
    onClose();
  };

  // Esc closes, like the sheets
  const cancelRef = useRef(cancel);
  cancelRef.current = cancel;
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") cancelRef.current();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

  if (phase.k === "listening") {
    return (
      <form
        className="tt-voicebar glass"
        role="dialog"
        aria-label="Spracheingabe"
        onSubmit={(e) => {
          e.preventDefault();
          void finish();
        }}
      >
        <span className="tt-voicebar-wave" aria-hidden="true">
          <WaveformIcon size={22} />
        </span>
        <input
          className="tt-voicebar-input"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={holding ? "Loslassen zum Senden" : "Ich höre zu … oder tippen"}
          aria-label="Was soll sich ändern?"
        />
        <button type="submit" className="tt-voicebar-btn tt-voicebar-send" aria-label="Senden">
          <SendIcon />
        </button>
        <button type="button" className="tt-voicebar-btn" aria-label="Abbrechen" onClick={cancel}>
          <CloseIcon />
        </button>
      </form>
    );
  }

  return (
    <div className="tt-voicecard glass-dense" role="dialog" aria-label="Sprachsteuerung" aria-live="polite">
      {phase.k === "thinking" && (
        <>
          <p className="tt-sub">„{phase.text}“</p>
          <p className="tt-question" role="status">
            Ich überlege …
          </p>
        </>
      )}
      {phase.k === "confirm" && (
        <>
          <p className="tt-sub">Du hast gesagt: „{phase.text}“</p>
          <p className="tt-question">{phase.question}</p>
          <div className="tt-actions">
            <button type="button" className="tt-btn tt-btn-quiet" onClick={cancel}>
              Nein
            </button>
            <button type="button" className="tt-btn tt-btn-primary" onClick={() => onConfirm(phase.intent)}>
              Ja
            </button>
          </div>
        </>
      )}
      {phase.k === "unknown" && (
        <>
          <p className="tt-question">{phase.text ? "Das habe ich nicht verstanden." : "Ich habe nichts gehört."}</p>
          {phase.text && <p className="tt-sub">Du hast gesagt: „{phase.text}“</p>}
          <div className="tt-actions">
            <button type="button" className="tt-btn tt-btn-quiet" onClick={cancel}>
              Schließen
            </button>
            <button type="button" className="tt-btn tt-btn-primary" onClick={listen}>
              Nochmal
            </button>
          </div>
        </>
      )}
      {phase.k === "error" && (
        <>
          <p className="tt-question">Die Sprachfunktion ist gerade nicht erreichbar.</p>
          <div className="tt-actions">
            <button type="button" className="tt-btn tt-btn-quiet" onClick={cancel}>
              Schließen
            </button>
            <button type="button" className="tt-btn tt-btn-primary" onClick={listen}>
              Nochmal
            </button>
          </div>
        </>
      )}
      {phase.k !== "thinking" && (
        <div className="tt-row">
          <span id="tts-label">Antwort vorlesen</span>
          <button
            type="button"
            role="switch"
            aria-checked={speakAnswer}
            aria-labelledby="tts-label"
            className="tt-switch"
            onClick={() => setSpeakAnswer((v) => !v)}
          />
        </div>
      )}
    </div>
  );
}
