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
  const resolveFen = useCallback(
    (moveIndex: number, afterMove: boolean) => {
      if (!source) {
        return '';
      }
      return fenAtPlyFromStart(
        source.startFen,
        source.movesUci,
        afterMove ? moveIndex + 1 : moveIndex,
      );
    },
    [source],
  );

  return useSolutionLineRecap({
    active: active && source !== null,
    movesUci: source?.movesUci ?? [],
    startIndex: source?.startIndex ?? 0,
    endIndex: source?.endIndex ?? 0,
    missedIndices: source?.missedIndices ?? [],
    segmentStartFen: source?.startFen ?? '',
    setupUci: source?.setupUci ?? null,
    onComplete,
    resolveFen,
  });
};
