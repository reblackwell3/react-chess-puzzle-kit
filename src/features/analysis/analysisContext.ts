import type { AnalysisContext } from 'react-chess-core';
import { PuzzlePosition } from '../position/Position';

export type PuzzleResultStatus = 'none' | 'incorrect' | 'complete';

/** @deprecated Use {@link AnalysisContext} from `react-chess-core`. */
export type PuzzleAnalysisContext = AnalysisContext;

export const emptyAnalysisContext = (): AnalysisContext => ({
  initialFen: '',
  solutionMoves: [],
  currentPly: 0,
  boardOrientation: 'white',
});

export const buildAnalysisContext = (
  position: PuzzlePosition | null,
): AnalysisContext => {
  if (!position) {
    return emptyAnalysisContext();
  }

  return {
    initialFen: position.getInitialFen(),
    solutionMoves: position.getSolutionMoves(),
    currentPly: position.getIndex(),
    boardOrientation: position.getPlayerColor() as 'white' | 'black',
  };
};

export const isAnalysisAvailable = (
  position: PuzzlePosition | null,
  resultStatus: PuzzleResultStatus,
): boolean => {
  if (!position) {
    return false;
  }

  return (
    buildAnalysisContext(position).solutionMoves.length > 0 &&
    resultStatus !== 'none'
  );
};
