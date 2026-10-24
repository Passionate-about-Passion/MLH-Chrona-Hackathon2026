"use client";
import { useEffect, useRef, useState } from "react";
import type { Course } from "@/types";
import { voice, type ParsedIntent } from "@/voice";
import { Modal } from "./Modal";
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

/** holding the mic longer than this = push-to-talk (release sends); shorter = tap to start, tap stop to send */
const HOLD_MS = 350;

interface VoiceOverlayProps {
  courses: Course[];
  /** performance.now() of the press on the mic button; undefined when opened by keyboard */
  pressedAt?: number;
  /** called only after the user said "Ja" */
  onConfirm: (intent: ParsedIntent) => void;
  onClose: () => void;
}

export function VoiceOverlay({ courses, pressedAt, onConfirm, onClose }: VoiceOverlayProps) {
  const [phase, setPhase] = useState<Phase>({ k: "listening" });
  const [speakAnswer, setSpeakAnswer] = useState(true);
  const [typed, setTyped] = useState("");
  const [holding, setHolding] = useState(pressedAt != null);
  const alive = useRef(true);
  const finishRef = useRef<() => Promise<void>>(async () => {});

  const listen = () => {
    setPhase({ k: "listening" });
    voice.startListening().catch(() => alive.current && setPhase({ k: "error" }));
  };

  useEffect(() => {
    alive.current = true;
    listen();
    return () => {
      alive.current = false;
    };
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

  // push-to-talk: the finger is still on the mic button when the overlay opens
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

  const cancel = () => {
    stopWithoutTranscript().catch(() => {});
    onClose();
  };

  return (
    <Modal label="Sprachsteuerung" variant="sheet" onClose={cancel}>
      <div className="tt-voice">
        {phase.k === "listening" && (
          <>
            <div className="tt-wave" aria-hidden="true">
              {Array.from({ length: 21 }, (_, i) => (
                <span key={i} style={{ animationDelay: `${(i % 7) * 90}ms` }} />
              ))}
            </div>
            <p className="tt-transcript" aria-live="polite">
              Ich höre zu …
            </p>
            <p className="tt-sub">
              {holding ? "Loslassen zum Senden" : "Zum Beispiel: „Donnerstag 14 bis 16 Uhr habe ich einen festen Termin“"}
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void finish();
              }}
            >
              <label className="tt-field">
                <span>Oder tippen</span>
                <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Was soll sich ändern?" />
              </label>
            </form>
            {/* like Voice Memos: one round button that stops the recording and sends it */}
            <div className="tt-rec-row">
              <button type="button" className="tt-btn tt-btn-quiet" onClick={cancel}>
                Abbrechen
              </button>
              <button
                type="button"
                className="tt-rec-stop"
                aria-label={typed.trim() ? "Senden" : "Aufnahme stoppen und senden"}
                onClick={() => void finish()}
              >
                <span aria-hidden="true" />
              </button>
              <span className="tt-rec-hint" aria-hidden="true">
                {typed.trim() ? "Senden" : "Stopp"}
              </span>
            </div>
          </>
        )}
        {phase.k === "thinking" && (
          <>
            <p className="tt-transcript">„{phase.text}“</p>
            <p className="tt-sub" role="status">
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
                Nochmal sprechen
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
                Nochmal versuchen
              </button>
            </div>
          </>
        )}
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
      </div>
    </Modal>
  );
}
