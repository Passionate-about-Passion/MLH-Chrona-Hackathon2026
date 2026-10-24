"use client";
/**
 * SLICE D – SPRECHEN (frontend)
 * Reads text aloud via /api/speak (ElevenLabs); falls back to the browser's speech synthesis.
 */
import { useRef, useState } from "react";

export function SpeakButton({
  text,
  lang = "de",
  label = "🔊 Vorlesen",
}: {
  text: string;
  lang?: string;
  label?: string;
}) {
  const [state, setState] = useState<"idle" | "loading" | "playing">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function speak() {
    if (state === "playing") {
      audioRef.current?.pause();
      window.speechSynthesis?.cancel();
      setState("idle");
      return;
    }
    setState("loading");
    try {
      const res = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const url = URL.createObjectURL(await res.blob());
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setState("idle");
      await audio.play();
      setState("playing");
    } catch {
      // Fallback: browser TTS (works offline, no key needed)
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      u.onend = () => setState("idle");
      window.speechSynthesis.speak(u);
      setState("playing");
    }
  }

  return (
    <button onClick={speak} className="rounded-full border border-neutral-300 px-3 py-1 text-sm dark:border-neutral-700">
      {state === "loading" ? "…" : state === "playing" ? "⏹ Stopp" : label}
    </button>
  );
}
