import { useEffect, useRef, useState } from 'react';

const TIMER_TICK_MS = 1000;

/**
 * Tracks whole elapsed seconds while a puzzle is playable.
 *
 * Disabling the timer freezes its current value. Changing resetKey starts a
 * fresh timer at zero the next time running becomes true.
 */
export const usePuzzleElapsedTimer = (
  running: boolean,
  resetKey: unknown,
): number => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    startedAtRef.current = null;
    setElapsedSeconds(0);
  }, [resetKey]);

  useEffect(() => {
    if (!running) {
      return;
    }

    if (startedAtRef.current === null) {
      startedAtRef.current = Date.now();
    }

    const updateElapsed = () => {
      if (startedAtRef.current === null) {
        return;
      }
      setElapsedSeconds(
        Math.floor((Date.now() - startedAtRef.current) / TIMER_TICK_MS),
      );
    };

    const interval = window.setInterval(updateElapsed, TIMER_TICK_MS);
    return () => {
      window.clearInterval(interval);
    };
  }, [running, resetKey]);

  return elapsedSeconds;
};
