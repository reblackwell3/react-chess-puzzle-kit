import { useEffect, useState } from 'react';

export type PuzzleAutoAdvanceState = {
  active: boolean;
  secondsRemaining: number;
};

const inactiveAutoAdvance: PuzzleAutoAdvanceState = {
  active: false,
  secondsRemaining: -1,
};

/** Countdown overlay state while waiting to auto-load the next puzzle card. */
export function usePuzzleAutoAdvanceCountdown(
  enabled: boolean,
  delayMs: number,
  onAdvance: () => void,
): PuzzleAutoAdvanceState {
  const [secondsRemaining, setSecondsRemaining] = useState(-1);

  useEffect(() => {
    if (!enabled || delayMs <= 0) {
      setSecondsRemaining(-1);
      return;
    }

    const startedAt = Date.now();
    const updateCountdown = () => {
      const elapsed = Date.now() - startedAt;
      setSecondsRemaining(Math.max(0, Math.ceil((delayMs - elapsed) / 1000)));
    };

    updateCountdown();
    const intervalId = window.setInterval(updateCountdown, 200);
    const timeoutId = window.setTimeout(() => {
      window.clearInterval(intervalId);
      setSecondsRemaining(-1);
      onAdvance();
    }, delayMs);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
      setSecondsRemaining(-1);
    };
  }, [delayMs, enabled, onAdvance]);

  if (!enabled || secondsRemaining < 0) {
    return inactiveAutoAdvance;
  }

  return {
    active: true,
    secondsRemaining,
  };
}
