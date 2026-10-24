/** Schloss-Präfix (erstes Wort, Großbuchstaben) -> Gebäude-id. Hier anpassen, wenn die Raumdaten sich ändern. */
export const ROOM_PREFIX_TO_BUILDING: Record<string, string> = {
  O: "O",
  AULA: "O", // Aula = O 102, Ostflügel
  SN: "SN",
  SO: "SO",
  SW: "SW",
  S: "SO", // geraten: "S 031" steht nur mit "L 7" davor in den Daten
  EO: "EO",
  EW: "EW",
  W: "W",
  M: "M",
};

export type Rect = [x: number, y: number, w: number, h: number];
/** Vereinfachter Grundriss in Koordinaten des Uni-PDFs (848 x 601). */
export const BUILDINGS: Record<string, { label: [number, number]; text: string; rects: Rect[] }> = {
  B6: { label: [200, 142], text: "B 6", rects: [[155, 100, 85, 52], [207, 114, 36, 12], [252, 118, 70, 35]] },
  A5: { label: [95, 213], text: "A 5", rects: [[33, 170, 40, 32], [45, 198, 78, 34], [113, 170, 90, 30]] },
  A3: { label: [290, 222], text: "A 3", rects: [[265, 203, 50, 32]] },
  W: { label: [140, 358], text: "W", rects: [[22, 328, 235, 55]] },
  EW: { label: [278, 450], text: "EW", rects: [[258, 365, 40, 170]] },
  M: { label: [370, 518], text: "M", rects: [[258, 490, 228, 52]] },
  EO: { label: [428, 450], text: "EO", rects: [[403, 365, 48, 170]] },
  O: { label: [560, 350], text: "O", rects: [[455, 325, 200, 62], [455, 385, 35, 55]] },
  SN: { label: [575, 400], text: "SN", rects: [[490, 387, 170, 28]] },
  SW: { label: [507, 460], text: "SW", rects: [[490, 415, 35, 70]] },
  SO: { label: [640, 460], text: "SO", rects: [[620, 415, 40, 70]] },
  S: { label: [575, 472], text: "", rects: [[525, 450, 95, 35]] },
  L7: { label: [720, 392], text: "L 7", rects: [[708, 365, 36, 48]] },
  L9: { label: [790, 390], text: "L 9", rects: [[748, 360, 80, 52], [752, 452, 62, 40]] },
};

/** Zuerst Quadrat vorn ("A 3 …", "A 5 B144", "B 6 A001", "L 7 001", "L 9 1-2"), sonst Schloss-Präfix.
 *  Führendes "Schloss " wird ignoriert. Kurzformen ohne Quadrat ("A 101", "B 201", "C 12") bleiben unmarkiert. */
export function buildingOf(room: string): string | null {
  const r = room.trim().replace(/^schloss\s+/i, "");
  const square = /^([A-Z])\s*(\d)(?!\d)/i.exec(r);
  const sq = square && `${square[1].toUpperCase()}${square[2]}`;
  if (sq && Object.hasOwn(BUILDINGS, sq)) return sq;
  return ROOM_PREFIX_TO_BUILDING[r.split(/[\s.]+/)[0].toUpperCase()] ?? null;
}
