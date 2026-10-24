/** Text-to-Speech for VoiceService.speak: ElevenLabs via /api/speak, falls back to browser speech (no key / offline). */

let current: HTMLAudioElement | null = null;

function stop() {
  current?.pause();
  current = null;
  window.speechSynthesis?.cancel();
}

function browserSpeak(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) return resolve();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "de-DE";
    u.onend = () => resolve();
    u.onerror = () => resolve();
    window.speechSynthesis.speak(u);
  });
}

/** Resolves when playback has finished. A new call stops the previous one. */
export async function speak(text: string): Promise<void> {
  stop();
  if (!text.trim()) return;
  try {
    const res = await fetch("/api/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error(String(res.status));
    const url = URL.createObjectURL(await res.blob());
    const audio = new Audio(url);
    current = audio;
    await new Promise<void>((resolve, reject) => {
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error("audio"));
      audio.play().catch(reject);
    });
    URL.revokeObjectURL(url);
  } catch {
    await browserSpeak(text);
  }
}
