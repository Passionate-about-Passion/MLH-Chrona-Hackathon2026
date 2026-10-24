import type { ReactNode } from "react";

/** Schloss-Präfix (erstes Wort, Großbuchstaben) -> Gebäude-id. Hier anpassen, wenn die Raumdaten sich ändern. */
export const ROOM_PREFIX_TO_BUILDING: Record<string, string> = {
  O: "O",
  AULA: "O", // Aula = O 102, Ostflügel
  SN: "SN",
  S: "SO", // geraten: "S 031" steht nur mit "L 7" davor in den Daten
  EO: "EO",
  EW: "EW",
  W: "W",
  M: "M",
};

/** Zuerst Quadrat vorn ("A 3 …", "A 5 B144", "B 6 A001", "L 7 001", "L 9 1-2"), sonst Schloss-Präfix.
 *  Kurzformen ohne Quadrat ("A 101", "B 201", "C 12") bleiben unmarkiert. */
export function buildingOf(room: string): string | null {
  const r = room.trim();
  const square = /^([A-Z])\s*(\d)(?!\d)/i.exec(r);
  const sq = square && `${square[1].toUpperCase()}${square[2]}`;
  if (sq && BUILDINGS[sq]) return sq;
  return ROOM_PREFIX_TO_BUILDING[r.split(/[\s.]+/)[0].toUpperCase()] ?? null;
}

type Rect = [x: number, y: number, w: number, h: number];
/** Vereinfachter Grundriss in Koordinaten des Uni-PDFs (848 x 601). */
const BUILDINGS: Record<string, { label: [number, number]; text: string; rects: Rect[] }> = {
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

const NEUTRAL = "#c6cad2";
const STROKE = "#9aa0ab";
const MARK = "#007aff";
const BOX = "#0a4fa3";

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export interface CampusMapProps {
  room: string;
  /** Kursname */
  title: string;
  /** z. B. "Vorlesung" */
  kind: string;
  /** z. B. "10:15–11:45" */
  time: string;
}

export function CampusMap({ room, title, kind, time }: CampusMapProps): ReactNode {
  const id = buildingOf(room);
  const target = id ? BUILDINGS[id] : undefined;
  const [lx, ly] = target?.label ?? [0, 0];
  return (
    <figure style={{ margin: 0 }}>
      <svg
        viewBox="0 80 848 480"
        width="100%"
        role="img"
        aria-label={target ? `Lageplan, markiert: ${target.text || id}, ${room}` : "Lageplan ohne Markierung"}
        style={{ display: "block", borderRadius: 16, background: "#eef0f3" }}
      >
        <rect x="0" y="262" width="848" height="28" fill="#fff" opacity="0.8" />
        {Object.entries(BUILDINGS).map(([key, b]) => {
          const on = key === id;
          return (
            <g key={key}>
              {b.rects.map((r, i) => (
                <rect key={i} x={r[0]} y={r[1]} width={r[2]} height={r[3]} rx="4" fill={on ? MARK : NEUTRAL} stroke={on ? BOX : STROKE} strokeWidth="2" />
              ))}
              {b.text && (
                <text x={b.label[0]} y={b.label[1]} textAnchor="middle" fontSize="17" fontWeight="600" fontFamily="system-ui, sans-serif" fill={on ? "#fff" : "#3a3f49"}>
                  {b.text}
                </text>
              )}
            </g>
          );
        })}
        {target && (
          <g fontFamily="system-ui, sans-serif" fill="#fff">
            <line x1={lx} y1={ly - 6} x2="500" y2="200" stroke={BOX} strokeWidth="3" />
            <circle cx={lx} cy={ly - 6} r="5" fill={BOX} />
            <rect x="400" y="96" width="436" height="118" rx="18" fill={BOX} />
            <text x="420" y="134" fontSize="27" fontWeight="700">{clip(title, 27)}</text>
            <text x="420" y="168" fontSize="23">{kind} · {time}</text>
            <text x="420" y="198" fontSize="23">Raum: {clip(room, 24)}</text>
          </g>
        )}
      </svg>
      {!target && <figcaption style={{ marginTop: 10, fontSize: 15 }}>Raum: {room || "unbekannt"}</figcaption>}
    </figure>
  );
}
