import { useCallback } from 'react';
import {
  fenAtPlyFromStart,
  useSolutionLineRecap,
  type SolutionLineRecapState,
} from 'react-chess-core';

/** Pause on the puzzle setup position before the solution recap animates. */
export const PUZZLE_COMPLETION_RECAP_SETUP_MS = 400;

export type PuzzleCompletionRecapSource = {
  startFen: string;
  movesUci: string[];
  startIndex: number;
  endIndex: number;
  missedIndices: number[];
  setupUci?: string | null;
};

export type PuzzleCompletionRecapState = SolutionLineRecapState;

export const usePuzzleCompletionRecap = ({
  source,
  active,
  onComplete,
}: {
  source: PuzzleCompletionRecapSource | null;
  active: boolean;
  onComplete: () => void;
}): PuzzleCompletionRecapState => {
  const startFen = source?.startFen ?? '';
  const movesUci = source?.movesUci ?? [];
  const startIndex = source?.startIndex ?? 0;
  const endIndex = source?.endIndex ?? 0;
  const missedIndices = source?.missedIndices ?? [];
  const setupUci = source?.setupUci ?? null;

  const resolveFen = useCallback(
    (moveIndex: number, afterMove: boolean) => {
      if (!startFen || movesUci.length === 0) {
        return '';
      }
      return fenAtPlyFromStart(
        startFen,
        movesUci,
        afterMove ? moveIndex + 1 : moveIndex,
      );
    },
    [movesUci, startFen],
  );

  return useSolutionLineRecap({
    active: active && source !== null,
    movesUci,
    startIndex,
    endIndex,
    missedIndices,
    segmentStartFen: startFen,
    setupUci,
    onComplete,
    completeImmediatelyWhenNoMisses: true,
    resolveFen,
  });
};
