/**
 * Mikrofon -> base64 WAV (16 kHz, mono, PCM16) für POST /api/analyze { audio }.
 * Nutzung (nur Client, localhost/HTTPS):
 *   const rec = await startRecording();      // fragt Mikro-Erlaubnis
 *   const audio = await rec.stop();          // base64 WAV
 *   fetch("/api/analyze", { method: "POST", body: JSON.stringify({ audio }) });
 * Wirft bei fehlendem Mikro/Erlaubnis -> Fallback Web Speech API bzw. Textfeld.
 */

const RATE = 16000;

/** Float-Samples (beliebige Rate) -> WAV-Bytes 16 kHz mono PCM16 (lineares Downsampling). */
export function encodeWav(samples: Float32Array, rate: number): Uint8Array {
  const n = Math.floor((samples.length * RATE) / rate);
  const buf = new ArrayBuffer(44 + n * 2);
  const v = new DataView(buf);
  const str = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); str(8, "WAVE"); str(12, "fmt ");
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, RATE, true); v.setUint32(28, RATE * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  str(36, "data"); v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) {
    const pos = (i * rate) / RATE;
    const a = Math.floor(pos);
    const s = samples[a] + ((samples[Math.min(a + 1, samples.length - 1)] - samples[a]) * (pos - a));
    v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, s)) * 0x7fff, true);
  }
  return new Uint8Array(buf);
}

export async function startRecording(): Promise<{ stop(): Promise<string> }> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const ctx = new AudioContext();
  const src = ctx.createMediaStreamSource(stream);
  const chunks: Float32Array[] = [];
  // ponytail: ScriptProcessor ist deprecated, läuft aber überall und ist kürzer als AudioWorklet
  const proc = ctx.createScriptProcessor(4096, 1, 1);
  proc.onaudioprocess = (e) => chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
  src.connect(proc);
  proc.connect(ctx.destination);

  return {
    async stop() {
      proc.disconnect();
      src.disconnect();
      stream.getTracks().forEach((t) => t.stop());
      const rate = ctx.sampleRate;
      await ctx.close();
      const all = new Float32Array(chunks.reduce((n, c) => n + c.length, 0));
      let o = 0;
      for (const c of chunks) { all.set(c, o); o += c.length; }
      const bytes = encodeWav(all, rate);
      let bin = "";
      for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      return btoa(bin);
    },
  };
}
