"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import type { LibLocation, Meal } from "./campusLive";
import { BUILDINGS, DECOR, ROOM_PREFIX_TO_BUILDING, buildingOf } from "./campusData";

export { buildingOf, ROOM_PREFIX_TO_BUILDING };

const WORLD_W = 848;
const WORLD_H = 510;
const WORLD_Y0 = 80; // viewBox beginnt bei y = 80
const MIN_Z = 1;
const MAX_Z = 5;
const TAP_SLOP = 6;

const NEUTRAL = "#c6cad2";
const STROKE = "#9aa0ab";
const MARK = "#007aff";
const MARK_STROKE = "#0a4fa3";
const PICK = "#ff9f0a";
const PICK_STROKE = "#b36b00";

const MENSA_AT: [number, number] = [70, 465]; // Mensa am Schloss: Mensawiese, südwestlich vom Westflügel (Lageplan Uni)
const MENSA_HALF: [number, number] = [44, 58]; // halbe Breite/Höhe, hochkant wie im Uni-Plan
/** Kurznamen der Bib-Standorte für die Badges */
const LIB_SHORT: Record<string, string> = { W: "Westflügel", A3: "A3", A5: "A5", M: "Ehrenhof", S: "Schneckenhof" };
const libColor = (p: number) => (p < 60 ? "#34c759" : p <= 85 ? "#ffcc00" : "#ff3b30");
type MensaData = { name: string; date: string; url: string; meals: Meal[] };

const buildingName = (k: string) => (k === "S" ? "Schneckenhof Süd" : BUILDINGS[k].text);

/** Bounding-Box eines Gebäudes in Welt-Koordinaten (y ohne viewBox-Offset). */
function bbox(key: string) {
  const rs = BUILDINGS[key].rects;
  const x0 = Math.min(...rs.map((r) => r[0]));
  const y0 = Math.min(...rs.map((r) => r[1]));
  const x1 = Math.max(...rs.map((r) => r[0] + r[2]));
  const y1 = Math.max(...rs.map((r) => r[1] + r[3]));
  return { x0, y0, x1, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
}

const CSS = `
.cmap-root{animation:cmap-in .38s cubic-bezier(.22,1,.36,1)}
@keyframes cmap-in{from{opacity:0;transform:translate3d(0,6%,0)}}
.cmap-card{animation:cmap-rise .55s cubic-bezier(.34,1.4,.64,1) .1s backwards}
@keyframes cmap-rise{from{opacity:0;transform:translate3d(0,40px,0)}}
.cmap-ring{fill:none;stroke:#007aff;stroke-width:3;transform-box:fill-box;transform-origin:center;animation:cmap-pulse 2s ease-out infinite}
.cmap-ring.b{animation-delay:1s}
@keyframes cmap-pulse{from{transform:scale(.4);opacity:.8}to{transform:scale(3.2);opacity:0}}
.cmap-flash{animation:cmap-flash .6s ease-out}
@keyframes cmap-flash{from{opacity:.3}}
.cmap-btn{min-height:44px;min-width:44px;padding:0 18px;border:0;border-radius:22px;font:600 17px/1 var(--font,system-ui,sans-serif);color:#007aff;background:transparent;cursor:pointer;touch-action:manipulation}
.cmap-btn:focus-visible{outline:3px solid #007aff;outline-offset:2px}
@media (prefers-reduced-motion:reduce){.cmap-root,.cmap-card,.cmap-ring,.cmap-flash{animation:none}}
`;

export interface CampusMapProps {
  room: string;
  /** Kursname */
  title: string;
  /** z. B. "Vorlesung" */
  kind: string;
  /** z. B. "10:15–11:45" */
  time: string;
  onClose: () => void;
}

export function CampusMap({ room, title, kind, time, onClose }: CampusMapProps): ReactNode {
  const id = buildingOf(room);
  const target = id ? BUILDINGS[id] : undefined;
  const [selected, setSelected] = useState<string | null>(null);
  const [libs, setLibs] = useState<{ at: string; byB: Record<string, LibLocation> } | null>(null);
  const [mensa, setMensa] = useState<MensaData | null | undefined>(undefined); // undefined = lädt
  const [mensaOpen, setMensaOpen] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openMensaRef = useRef<() => void>(() => {});
  const flyRef = useRef<() => void>(() => {});
  const closingRef = useRef(false);
  const sheetDrag = useRef<{ y0: number; t0: number; dy: number } | null>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const dismiss = () => {
    const root = rootRef.current;
    if (closingRef.current || !root) return;
    closingRef.current = true;
    if (reducedMotion()) return onCloseRef.current();
    root.style.transition = "transform 240ms cubic-bezier(.4,0,1,1), opacity 240ms linear";
    root.style.transform = "translate3d(0,100%,0)";
    root.style.opacity = "0";
    window.setTimeout(() => onCloseRef.current(), 240);
  };
  const dismissRef = useRef(dismiss);
  useEffect(() => {
    openMensaRef.current = openMensa;
  });
  useEffect(() => {
    dismissRef.current = dismiss;
  });

  // Fokus, Escape, Scroll-Sperre
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus({ preventScroll: true });
    const key = (e: KeyboardEvent) => e.key === "Escape" && dismissRef.current();
    document.addEventListener("keydown", key);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = overflow;
      prev?.focus?.({ preventScroll: true });
    };
  }, []);

  // Live-Daten (Bibliothek beim Öffnen); Fehler -> keine Badges
  useEffect(() => {
    let alive = true;
    fetch("/api/campus/library")
      .then((r) => r.json())
      .then((j: { updated?: string; locations?: LibLocation[] }) => {
        if (!alive || !j.locations?.length) return;
        setLibs({ at: j.updated ?? "", byB: Object.fromEntries(j.locations.map((l) => [l.building, l])) });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const openMensa = () => {
    setMensaOpen(true);
    if (mensa !== undefined) return;
    fetch("/api/campus/mensa")
      .then((r) => r.json())
      .then((j: MensaData) => setMensa(j))
      .catch(() => setMensa(null));
  };

  // Karten-Engine: Pan, Pinch, Inertia, Rubber-Band, Flug. Alles direkt per ref, kein React-State pro Frame.
  useEffect(() => {
    const surface = surfaceRef.current!;
    const layer = layerRef.current!;
    const reduce = reducedMotion();
    const S = { tx: 0, ty: 0, z: 1, W: 0, left: 0, top: 0, vh: 0, base: 1 };
    let raf = 0;
    let vx = 0;
    let vy = 0;
    let flyTimer = 0;

    const sc = () => S.base * S.z;
    const apply = () => {
      layer.style.transform = `translate3d(${S.tx}px,${S.ty}px,0) scale(${sc()})`;
    };
    const bx = (s: number): [number, number] => {
      const cw = WORLD_W * s;
      if (cw <= S.W) return [(S.W - cw) / 2, (S.W - cw) / 2];
      // Spielraum: jeder Kartenpunkt darf in die Mitte des sichtbaren Bereichs
      return [Math.min(S.W - cw, S.W / 2 - cw), Math.max(0, S.W / 2)];
    };
    const by = (s: number): [number, number] => {
      const ch = WORLD_H * s;
      if (ch <= S.vh) return [S.top + (S.vh - ch) / 2, S.top + (S.vh - ch) / 2];
      const fy = S.top + S.vh / 2;
      return [Math.min(S.top + S.vh - ch, fy - ch), Math.max(S.top, fy)];
    };
    const clampPt = (tx: number, ty: number, s: number): [number, number] => {
      const [x0, x1] = bx(s);
      const [y0, y1] = by(s);
      return [Math.min(x1, Math.max(x0, tx)), Math.min(y1, Math.max(y0, ty))];
    };
    const clampHard = () => {
      [S.tx, S.ty] = clampPt(S.tx, S.ty, sc());
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      vx = vy = 0;
    };

    /** Schwung + Federn zurück in die Grenzen. */
    const settle = () => {
      cancelAnimationFrame(raf);
      if (reduce) {
        vx = vy = 0;
        clampHard();
        apply();
        return;
      }
      let last = performance.now();
      const axis = (p: number, v: number, lo: number, hi: number, dt: number) => {
        if (p < lo || p > hi) return v + (((p < lo ? lo : hi) - p) * 180 - v * 26) * dt;
        return v * Math.exp(-dt * 4);
      };
      const rest = (p: number, v: number, lo: number, hi: number) =>
        Math.abs(v) < 10 && (p >= lo && p <= hi ? true : Math.abs(p - (p < lo ? lo : hi)) < 0.4);
      const tick = (now: number) => {
        const dt = Math.min(0.032, (now - last) / 1000);
        last = now;
        const s = sc();
        const [x0, x1] = bx(s);
        const [y0, y1] = by(s);
        vx = axis(S.tx, vx, x0, x1, dt);
        vy = axis(S.ty, vy, y0, y1, dt);
        S.tx += vx * dt;
        S.ty += vy * dt;
        if (rest(S.tx, vx, x0, x1) && rest(S.ty, vy, y0, y1)) {
          vx = vy = 0;
          clampHard();
          apply();
          raf = 0;
          return;
        }
        apply();
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    /** Animierte Ansicht; (fx, fy) ist der Bildschirmpunkt, um den sich die Kamera dreht. */
    const animateTo = (tx1: number, ty1: number, z1: number, dur: number, fx: number, fy: number) => {
      stop();
      const z0 = S.z;
      const s0 = sc();
      const s1 = S.base * z1;
      const [t1x, t1y] = clampPt(tx1, ty1, s1);
      if (reduce || dur <= 0) {
        S.tx = t1x;
        S.ty = t1y;
        S.z = z1;
        apply();
        return;
      }
      const c0x = (fx - S.tx) / s0;
      const c0y = (fy - S.ty) / s0;
      const c1x = (fx - t1x) / s1;
      const c1y = (fy - t1y) / s1;
      const start = performance.now();
      const frame = (now: number) => {
        const p = Math.min(1, (now - start) / dur);
        const e = 1 - Math.pow(1 - p, 3);
        S.z = z0 * Math.pow(z1 / z0, e);
        const s = sc();
        S.tx = fx - (c0x + (c1x - c0x) * e) * s;
        S.ty = fy - (c0y + (c1y - c0y) * e) * s;
        apply();
        raf = p < 1 ? requestAnimationFrame(frame) : 0;
      };
      raf = requestAnimationFrame(frame);
    };

    const flyToTarget = () => {
      if (!id) return animateTo(0, 0, 1, 500, S.W / 2, S.top + S.vh / 2);
      const b = bbox(id);
      const z1 = Math.min(3.2, Math.max(1.8, (0.4 * S.W) / ((b.x1 - b.x0) * S.base)));
      const s1 = S.base * z1;
      const fx = S.W / 2;
      const fy = S.top + S.vh / 2;
      animateTo(fx - b.cx * s1, fy - (b.cy - WORLD_Y0) * s1, z1, 700, fx, fy);
    };
    flyRef.current = flyToTarget;

    const measure = () => {
      const r = surface.getBoundingClientRect();
      S.W = r.width;
      S.left = r.left;
      const top = headerRef.current?.offsetHeight ?? 0;
      const bottom = bottomRef.current?.offsetHeight ?? 0;
      S.top = top;
      S.vh = Math.max(120, r.height - top - bottom);
      S.base = Math.min(S.W / WORLD_W, S.vh / WORLD_H);
      clampHard();
      apply();
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(surface);
    // Start: Übersicht, dann Flug zum Ziel (nach dem Einblenden des Sheets)
    S.z = 1;
    [S.tx, S.ty] = clampPt(0, 0, sc());
    apply();
    if (id) flyTimer = window.setTimeout(flyToTarget, reduce ? 0 : 280);

    const local = (e: { clientX: number; clientY: number }) => ({ x: e.clientX - S.left, y: e.clientY - surface.getBoundingClientRect().top });
    const pick = (x: number, y: number) => {
      const s = sc();
      const wx = (x - S.tx) / s;
      const wy = (y - S.ty) / s + WORLD_Y0;
      const pad = 8 / s;
      if (Math.abs(wx - MENSA_AT[0]) < MENSA_HALF[0] + pad && Math.abs(wy - MENSA_AT[1]) < MENSA_HALF[1] + pad) return "MENSA";
      let best: string | null = null;
      let bestArea = Infinity;
      for (const [k, b] of Object.entries(BUILDINGS))
        for (const [rx, ry, rw, rh] of b.rects)
          if (wx >= rx - pad && wx <= rx + rw + pad && wy >= ry - pad && wy <= ry + rh + pad && rw * rh < bestArea) {
            best = k;
            bestArea = rw * rh;
          }
      return best;
    };

    const ptrs = new Map<number, { x: number; y: number }>();
    let mode: "none" | "drag" | "pinch" = "none";
    let moved = false;
    let sx = 0;
    let sy = 0;
    let st = 0;
    let lx = 0;
    let ly = 0;
    let lt = 0;
    let pd0 = 1;
    let pz0 = 1;
    let pwx = 0;
    let pwy = 0;
    let lastTap = { t: 0, x: 0, y: 0 };

    const two = () => {
      const [a, b] = [...ptrs.values()];
      return { mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, d: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)) };
    };
    const beginPinch = () => {
      const { mx, my, d } = two();
      pd0 = d;
      pz0 = S.z;
      pwx = (mx - S.tx) / sc();
      pwy = (my - S.ty) / sc();
      mode = "pinch";
      moved = true;
    };

    const down = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      surface.setPointerCapture(e.pointerId);
      ptrs.set(e.pointerId, local(e));
      stop();
      window.clearTimeout(flyTimer);
      if (ptrs.size === 1) {
        mode = "drag";
        moved = false;
        const p = local(e);
        sx = lx = p.x;
        sy = ly = p.y;
        st = lt = e.timeStamp;
      } else if (ptrs.size === 2) beginPinch();
    };

    const move = (e: PointerEvent) => {
      if (!ptrs.has(e.pointerId)) return;
      const p = local(e);
      ptrs.set(e.pointerId, p);
      if (mode === "pinch" && ptrs.size >= 2) {
        const { mx, my, d } = two();
        S.z = Math.min(MAX_Z, Math.max(MIN_Z, (pz0 * d) / pd0));
        const s = sc();
        S.tx = mx - pwx * s;
        S.ty = my - pwy * s;
        apply();
      } else if (mode === "drag") {
        if (!moved) {
          if (Math.hypot(p.x - sx, p.y - sy) < TAP_SLOP) return;
          moved = true;
        }
        const s = sc();
        const [x0, x1] = bx(s);
        const [y0, y1] = by(s);
        let dx = p.x - lx;
        let dy = p.y - ly;
        if ((S.tx > x1 && dx > 0) || (S.tx < x0 && dx < 0)) dx *= 0.35;
        if ((S.ty > y1 && dy > 0) || (S.ty < y0 && dy < 0)) dy *= 0.35;
        S.tx += dx;
        S.ty += dy;
        const dt = e.timeStamp - lt;
        if (dt > 0) {
          vx = 0.6 * vx + 0.4 * ((p.x - lx) / dt) * 1000;
          vy = 0.6 * vy + 0.4 * ((p.y - ly) / dt) * 1000;
        }
        lx = p.x;
        ly = p.y;
        lt = e.timeStamp;
        apply();
      }
    };

    const tap = (x: number, y: number, now: number) => {
      if (now - lastTap.t < 320 && Math.hypot(x - lastTap.x, y - lastTap.y) < 32) {
        lastTap.t = 0;
        const z1 = S.z >= 3.5 ? MIN_Z : Math.min(MAX_Z, S.z * 2.2);
        const s0 = sc();
        const s1 = S.base * z1;
        animateTo(x - ((x - S.tx) / s0) * s1, y - ((y - S.ty) / s0) * s1, z1, 280, x, y);
        return;
      }
      lastTap = { t: now, x, y };
      const k = pick(x, y);
      setSelected(k && k !== id ? k : null);
      if (k === "MENSA") openMensaRef.current();
    };

    const up = (e: PointerEvent) => {
      if (!ptrs.has(e.pointerId)) return;
      const p = local(e);
      ptrs.delete(e.pointerId);
      if (mode === "pinch") {
        if (ptrs.size === 1) {
          const [r] = [...ptrs.values()];
          mode = "drag";
          lx = r.x;
          ly = r.y;
          lt = e.timeStamp;
          vx = vy = 0;
        } else {
          mode = "none";
          settle();
        }
        return;
      }
      if (mode !== "drag") return;
      mode = "none";
      if (!moved) {
        if (e.type === "pointerup" && e.timeStamp - st < 600) tap(p.x, p.y, e.timeStamp);
        return;
      }
      if (e.timeStamp - lt > 80) vx = vy = 0;
      settle();
    };

    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      stop();
      const p = local(e);
      const k = Math.exp(-e.deltaY * (e.deltaMode === 1 ? 16 : 1) * (e.ctrlKey ? 0.01 : 0.0018));
      const s0 = sc();
      S.z = Math.min(MAX_Z, Math.max(MIN_Z, S.z * k));
      const s1 = sc();
      S.tx = p.x - ((p.x - S.tx) / s0) * s1;
      S.ty = p.y - ((p.y - S.ty) / s0) * s1;
      clampHard();
      apply();
    };

    surface.addEventListener("pointerdown", down);
    surface.addEventListener("pointermove", move);
    surface.addEventListener("pointerup", up);
    surface.addEventListener("pointercancel", up);
    surface.addEventListener("wheel", wheel, { passive: false });
    const eat = (e: Event) => e.stopPropagation();
    surface.addEventListener("click", eat);
    return () => {
      surface.removeEventListener("click", eat);
      stop();
      window.clearTimeout(flyTimer);
      ro.disconnect();
      surface.removeEventListener("pointerdown", down);
      surface.removeEventListener("pointermove", move);
      surface.removeEventListener("pointerup", up);
      surface.removeEventListener("pointercancel", up);
      surface.removeEventListener("wheel", wheel);
    };
  }, [id]);

  // Sheet-Griff: nach unten wischen schließt
  const sheetDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    sheetDrag.current = { y0: e.clientY, t0: e.timeStamp, dy: 0 };
  };
  const sheetMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = sheetDrag.current;
    const root = rootRef.current;
    if (!d || !root) return;
    d.dy = Math.max(0, e.clientY - d.y0);
    root.style.transition = "none";
    root.style.transform = `translate3d(0,${d.dy}px,0)`;
    root.style.opacity = String(Math.max(0.4, 1 - d.dy / 700));
  };
  const sheetUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = sheetDrag.current;
    const root = rootRef.current;
    sheetDrag.current = null;
    if (!d || !root) return;
    const v = d.dy / Math.max(1, e.timeStamp - d.t0);
    if (d.dy > 110 || (d.dy > 40 && v > 0.5)) return dismiss();
    root.style.transition = "transform 320ms cubic-bezier(.34,1.4,.64,1), opacity 200ms";
    root.style.transform = "";
    root.style.opacity = "";
  };

  const sel = selected && selected !== id ? selected : null;
  const selLib = sel && sel !== "MENSA" ? libs?.byB[sel] : id ? libs?.byB[id] : undefined;
  const libTime = libs?.at ? new Date(libs.at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : "";
  const pin = id ? bbox(id) : null;

  return (
    <div
      ref={rootRef}
      className="cmap-root"
      role="dialog"
      aria-modal="true"
      aria-label={`Lageplan: ${title}`}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      style={{ position: "fixed", inset: 0, zIndex: 1000, touchAction: "none", overscrollBehavior: "none", background: "#eef0f3", overflow: "hidden", color: "#1d1d1f", fontFamily: "var(--font, system-ui, sans-serif)" }}
    >
      <style>{CSS}</style>
      <div
        ref={surfaceRef}
        style={{ position: "absolute", inset: 0, touchAction: "none", cursor: "grab", userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none", overflow: "hidden" }}
      >
        <div ref={layerRef} style={{ width: WORLD_W, height: WORLD_H, transformOrigin: "0 0", willChange: "transform", position: "absolute", left: 0, top: 0 }}>
          <svg
            viewBox={`0 ${WORLD_Y0} ${WORLD_W} ${WORLD_H}`}
            width={WORLD_W}
            height={WORLD_H}
            role="img"
            aria-label={target ? `Lageplan, markiert: ${target.text || id}, ${room}` : "Lageplan ohne Markierung"}
            style={{ display: "block", pointerEvents: "none" }}
          >
            {DECOR.greens.map((p, i) => (
              <polygon key={`g${i}`} points={p.map((q) => q.join(",")).join(" ")} fill="#cfe7d5" />
            ))}
            <rect x={DECOR.road[0]} y={DECOR.road[1]} width={DECOR.road[2]} height={DECOR.road[3]} fill="#fbe7a6" />
            <text x="424" y={DECOR.road[1] + 20} textAnchor="middle" fontSize="12" fontStyle="italic" fontFamily="system-ui, sans-serif" fill="#7a6a35">
              Bismarckstraße
            </text>
            {DECOR.courts.map((c, i) => (
              <g key={`c${i}`}>
                <rect x={c.r[0]} y={c.r[1]} width={c.r[2]} height={c.r[3]} rx="3" fill="#e6e8ec" />
                {c.text && (
                  <text x={c.r[0] + c.r[2] / 2} y={c.r[1] + c.r[3] / 2 + 4} textAnchor="middle" fontSize="11" fontFamily="system-ui, sans-serif" fill="#7b818c">
                    {c.text}
                  </text>
                )}
              </g>
            ))}
            <circle cx={DECOR.bastion[0]} cy={DECOR.bastion[1]} r={DECOR.bastion[2]} fill={NEUTRAL} stroke={STROKE} strokeWidth="2" />
            {Object.entries(BUILDINGS).map(([key, b]) => {
              const on = key === id;
              const pk = key === sel;
              return (
                <g key={key}>
                  {b.rects.map((r, i) => (
                    <rect
                      key={i}
                      className={pk ? "cmap-flash" : undefined}
                      x={r[0]}
                      y={r[1]}
                      width={r[2]}
                      height={r[3]}
                      rx="4"
                      fill={on ? MARK : pk ? PICK : NEUTRAL}
                      stroke={on ? MARK_STROKE : pk ? PICK_STROKE : STROKE}
                      strokeWidth="2"
                    />
                  ))}
                  {b.text && (
                    <text x={b.label[0]} y={b.label[1]} textAnchor="middle" fontSize="17" fontWeight="600" fontFamily="system-ui, sans-serif" fill={on || pk ? "#fff" : "#3a3f49"}>
                      {b.text}
                    </text>
                  )}
                </g>
              );
            })}
            {libs &&
              Object.values(libs.byB).map((l) => {
                const b = BUILDINGS[l.building];
                if (!b) return null;
                const bb = bbox(l.building);
                // Auslastung erst beim Antippen; vorher nur ein Punkt in Ampelfarbe als Bib-Hinweis
                if (sel !== l.building)
                  return <circle key={`lib-${l.building}`} cx={bb.cx} cy={bb.y0 - 8} r="6" fill={libColor(l.percent)} stroke="#fff" strokeWidth="2" />;
                const name = `Bib ${LIB_SHORT[l.building] ?? b.text}`;
                const w = Math.max(84, name.length * 7 + 20);
                const c = libColor(l.percent);
                return (
                  <g key={`lib-${l.building}`} transform={`translate(${bb.cx - w / 2},${bb.y0 - 46})`}>
                    <rect width={w} height="42" rx="11" fill="#fff" stroke={c} strokeWidth="2.5" />
                    <text x={w / 2} y="16" textAnchor="middle" fontSize="12" fontWeight="600" fontFamily="system-ui, sans-serif" fill="#3a3f49">
                      {name}
                    </text>
                    <text x={w / 2} y="30" textAnchor="middle" fontSize="12.5" fontWeight="800" fontFamily="system-ui, sans-serif" fill="#1d1d1f">
                      {l.percent} % belegt
                    </text>
                    <rect x="8" y="34" width={w - 16} height="4" rx="2" fill="#e5e7eb" />
                    <rect x="8" y="34" width={((w - 16) * Math.min(100, l.percent)) / 100} height="4" rx="2" fill={c} />
                  </g>
                );
              })}
            <g>
              <rect x={MENSA_AT[0] - MENSA_HALF[0]} y={MENSA_AT[1] - MENSA_HALF[1]} width={MENSA_HALF[0] * 2} height={MENSA_HALF[1] * 2} rx="4" fill={sel === "MENSA" ? PICK : NEUTRAL} stroke={sel === "MENSA" ? PICK_STROKE : STROKE} strokeWidth="2" />
              <text x={MENSA_AT[0]} y={MENSA_AT[1] + 6} textAnchor="middle" fontSize="17" fontWeight="600" fontFamily="system-ui, sans-serif" fill={sel === "MENSA" ? "#fff" : "#3a3f49"}>
                Mensa
              </text>
            </g>
            {pin && (
              <g>
                <circle className="cmap-ring" cx={pin.cx} cy={pin.y0} r="9" />
                <circle className="cmap-ring b" cx={pin.cx} cy={pin.y0} r="9" />
                <circle cx={pin.cx} cy={pin.y0} r="7" fill="#fff" stroke={MARK_STROKE} strokeWidth="3.5" />
              </g>
            )}
          </svg>
        </div>
      </div>

      <div
        ref={headerRef}
        onPointerDown={sheetDown}
        onPointerMove={sheetMove}
        onPointerUp={sheetUp}
        onPointerCancel={sheetUp}
        style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "calc(env(safe-area-inset-top) + 8px) 12px 6px", touchAction: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}
      >
        <div aria-hidden style={{ width: 40, height: 5, borderRadius: 3, background: "rgba(60,60,67,0.3)" }} />
        <div style={{ alignSelf: "stretch", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {libs ? (
            <span className="glass-dense" style={{ borderRadius: 16, padding: "6px 12px", fontSize: 13, fontWeight: 600, color: "#3c3c43" }}>
              Bibliotheken live{libTime ? ` · ${libTime}` : ""}
            </span>
          ) : (
            <span />
          )}
          <button ref={closeRef} type="button" className="cmap-btn glass-dense" onClick={dismiss} aria-label="Lageplan schließen">
            Fertig
          </button>
        </div>
      </div>

      {mensaOpen && (
        <div
          className="cmap-card glass-dense"
          role="region"
          aria-label="Speiseplan Mensa am Schloss"
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          style={{ position: "absolute", left: 12, right: 12, top: "calc(env(safe-area-inset-top) + 64px)", maxWidth: 520, margin: "0 auto", maxHeight: "48vh", display: "flex", flexDirection: "column", borderRadius: 24, padding: "14px 16px", touchAction: "pan-y", zIndex: 5 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ flex: 1, fontSize: 16, fontWeight: 700 }}>
              Mensa am Schloss – Speiseplan{mensa?.meals.length ? ` ${new Date(mensa.date + "T12:00:00").toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "numeric" })}` : ""}
            </div>
            <button type="button" className="cmap-btn" aria-label="Speiseplan schließen" onClick={() => { setMensaOpen(false); setSelected(null); }} style={{ padding: "0 12px" }}>
              Schließen
            </button>
          </div>
          <div style={{ overflowY: "auto", WebkitOverflowScrolling: "touch", fontSize: 14, lineHeight: 1.4 }}>
            {mensa === undefined ? (
              <div>Lädt …</div>
            ) : mensa && mensa.meals.length ? (
              mensa.meals.map((m, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "6px 0", borderTop: i ? "1px solid rgba(60,60,67,0.15)" : "none" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {m.line && <div style={{ fontSize: 12, fontWeight: 600, color: "#6b6b70" }}>{m.line}</div>}
                    <div>{m.title}</div>
                  </div>
                  {m.price && <div style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{m.price}</div>}
                </div>
              ))
            ) : (
              <div>Speiseplan gerade nicht verfügbar</div>
            )}
            <a
              href={mensa?.url ?? "https://www.stw-ma.de/essen-trinken/speiseplaene/mensa-am-schloss/"}
              target="_blank"
              rel="noopener noreferrer"
              className="cmap-btn"
              style={{ display: "inline-flex", alignItems: "center", marginTop: 8, padding: "0 4px", textDecoration: "none" }}
            >
              Speiseplan öffnen
            </a>
          </div>
        </div>
      )}

      <div ref={bottomRef} style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "12px 12px calc(12px + env(safe-area-inset-bottom))", pointerEvents: "none" }}>
        <div className="cmap-card glass-dense" style={{ borderRadius: 24, padding: "14px 14px 14px 18px", display: "flex", alignItems: "center", gap: 12, pointerEvents: "auto", maxWidth: 560, margin: "0 auto" }}>
          <div style={{ flex: 1, minWidth: 0, lineHeight: 1.35 }}>
            <div style={{ fontSize: 17, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
            <div style={{ fontSize: 14, color: "#3c3c43", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {kind} · {time}
            </div>
            <div style={{ fontSize: 14, color: "#3c3c43", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              Raum: {room || "unbekannt"}
              {target ? "" : " (Gebäude unbekannt)"}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: sel ? "#b36b00" : "#0a4fa3", minHeight: "1.35em" }} aria-live="polite">
              {sel === "MENSA" ? "Ausgewählt: Mensa am Schloss" : sel ? `Ausgewählt: Gebäude ${buildingName(sel)}` : id ? `Gebäude ${buildingName(id)}` : " "}
            </div>
            {selLib && (
              <div style={{ fontSize: 14, color: "#3c3c43" }}>
                Bibliothek: {selLib.percent} % belegt von {selLib.seats} Plätzen{libTime ? ` (Stand ${libTime})` : ""}
              </div>
            )}
          </div>
          {target && (
            <button
              type="button"
              className="cmap-btn"
              onClick={() => {
                setSelected(null);
                flyRef.current();
              }}
              style={{ background: MARK, color: "#fff", flexShrink: 0 }}
            >
              Zum Raum
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
