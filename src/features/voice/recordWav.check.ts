// node src/features/voice/recordWav.check.ts
import assert from "node:assert";
import { encodeWav } from "./recordWav.ts";

const w = encodeWav(new Float32Array(48000).fill(0.5), 48000); // 1 s @ 48 kHz -> 16000 Samples
const v = new DataView(w.buffer);
assert.equal(String.fromCharCode(...w.subarray(0, 4)), "RIFF");
assert.equal(String.fromCharCode(...w.subarray(8, 12)), "WAVE");
assert.equal(v.getUint32(24, true), 16000);
assert.equal(v.getUint16(22, true), 1);
assert.equal(v.getUint32(40, true), 32000);
assert.equal(w.length, 44 + 32000);
assert.ok(Math.abs(v.getInt16(100, true) - 16383) < 2);
