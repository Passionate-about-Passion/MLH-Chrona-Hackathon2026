"use client";
import { useEffect, useRef, useState } from "react";

/**
 * true for a moment after `value` changes. A sliding glass pill uses it to stretch while it moves,
 * like the liquid indicators in iOS.
 */
export function useSquish(value: unknown, ms = 320) {
  const [moving, setMoving] = useState(false);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setMoving(true);
    const t = setTimeout(() => setMoving(false), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return moving;
}
