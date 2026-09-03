"use client";

import { useState, useEffect } from "react";

const DRAW_INTERVAL = 600; // 10-minute autonomous cadence

export function useEpochCountdown(nextDrawTimeRaw?: bigint | number | string) {
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (nextDrawTimeRaw === undefined || nextDrawTimeRaw === null) return;
    const target = Number(nextDrawTimeRaw);

    const tick = () => {
      const now = Math.floor(Date.now() / 1000);
      let diff = target - now;
      if (diff <= 0) {
        // Continuous rolling autonomous epoch cadence
        const overdue = Math.abs(diff);
        diff = DRAW_INTERVAL - (overdue % DRAW_INTERVAL);
      }
      setSecondsRemaining(diff);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [nextDrawTimeRaw]);

  const formattedCountdown = (() => {
    if (secondsRemaining === null) return "--:--";
    const m = Math.floor(secondsRemaining / 60).toString().padStart(2, '0');
    const s = (secondsRemaining % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  })();

  return {
    secondsRemaining,
    formattedCountdown,
    drawInterval: DRAW_INTERVAL,
  };
}
