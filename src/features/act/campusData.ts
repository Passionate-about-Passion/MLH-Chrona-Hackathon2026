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
/** Grundriss nach dem Uni-Lageplan „Campus West / Schloss“ (Bildpunkt × 0,424, y + 62). */
export const BUILDINGS: Record<string, { label: [number, number]; text: string; rects: Rect[] }> = {
  B6: { label: [193, 147], text: "B 6", rects: [[149, 99, 16, 52], [149, 135, 88, 16], [178, 115, 21, 21], [200, 114, 38, 12], [246, 117, 19, 34], [246, 135, 70, 16], [299, 117, 17, 34]] },
  A5: { label: [150, 190], text: "A 5", rects: [[26, 168, 31, 49], [56, 200, 75, 17], [107, 169, 85, 31], [55, 215, 28, 25]] },
  A3: { label: [289, 226], text: "A 3", rects: [[269, 203, 39, 34]] },
  W: { label: [134, 358], text: "Westflügel (W)", rects: [[15, 328, 235, 48]] },
  EW: { label: [273, 440], text: "EW", rects: [[250, 362, 47, 145]] },
  M: { label: [350, 541], text: "Mittelbau (M)", rects: [[221, 506, 257, 59], [322, 491, 83, 17], [322, 550, 57, 16]] },
  EO: { label: [423, 440], text: "EO", rects: [[398, 362, 51, 144]] },
  O: { label: [583, 351], text: "Ostflügel (O)", rects: [[449, 323, 217, 45], [449, 361, 34, 34]] },
  SN: { label: [566, 388], text: "SN", rects: [[483, 367, 160, 30]] },
  SW: { label: [505, 430], text: "SW", rects: [[483, 397, 45, 85], [483, 444, 127, 38]] },
  SO: { label: [624, 430], text: "SO", rects: [[604, 397, 40, 85], [642, 365, 23, 81]] },
  L7: { label: [718, 400], text: "L 7", rects: [[704, 359, 29, 59], [724, 376, 14, 19]] },
  L9: { label: [764, 480], text: "L 9", rects: [[747, 359, 21, 33], [770, 359, 13, 33], [784, 359, 21, 33], [747, 451, 34, 46], [781, 473, 25, 24]] },
};

/** Hintergrund: Bismarckstraße, Grünflächen, Höfe (Ehrenhof, Stiler Hof, Schneckenhof), Bastion am Ehrenhof West. */
export const DECOR = {
  road: [0, 260, 848, 31] as Rect,
  greens: [
    [[0, 377], [214, 377], [214, 506], [221, 589], [0, 589]],
    [[478, 482], [644, 482], [670, 446], [670, 550], [636, 589], [478, 589]],
  ] as [number, number][][],
  courts: [
    { r: [297, 363, 101, 143] as Rect, text: "Ehrenhof" },
    { r: [450, 395, 34, 96] as Rect, text: "" },
    { r: [528, 397, 76, 47] as Rect, text: "Schneckenhof" },
  ],
  bastion: [237, 409, 25] as [number, number, number],
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
