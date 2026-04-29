"use client";

// Long-press-deteksjon for touch-enheter (mobil/iPad).
// Trigger en callback når brukeren holder fingeren på et element i `delay` ms.
//
// Bruk:
//   const longPress = useLongPress((e) => openMenu(...));
//   <div {...longPress}>...</div>

import { useCallback, useRef } from "react";

interface UseLongPressOptions {
  /** Hvor lenge brukeren må holde (ms). Default: 500. */
  delay?: number;
  /** Hvor mange piksler fingeren får bevege seg før vi kansellerer. Default: 10. */
  moveThreshold?: number;
}

export function useLongPress(
  onLongPress: (e: React.TouchEvent) => void,
  options: UseLongPressOptions = {},
) {
  const { delay = 500, moveThreshold = 10 } = options;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const triggeredRef = useRef(false);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startPosRef.current = null;
  }, []);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      startPosRef.current = { x: touch.clientX, y: touch.clientY };
      triggeredRef.current = false;
      timerRef.current = setTimeout(() => {
        triggeredRef.current = true;
        onLongPress(e);
      }, delay);
    },
    [onLongPress, delay],
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      const start = startPosRef.current;
      if (!touch || !start) return;
      const dx = Math.abs(touch.clientX - start.x);
      const dy = Math.abs(touch.clientY - start.y);
      if (dx > moveThreshold || dy > moveThreshold) clear();
    },
    [clear, moveThreshold],
  );

  const onTouchEnd = useCallback(() => {
    clear();
  }, [clear]);

  const onTouchCancel = useCallback(() => {
    clear();
  }, [clear]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTouchCancel,
    /** Hvis true, ble long-press akkurat trigget — bruk for å swallowe påfølgende click */
    wasTriggered: () => triggeredRef.current,
  };
}
