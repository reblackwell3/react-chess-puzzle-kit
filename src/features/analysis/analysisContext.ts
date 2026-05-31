import { PuzzleMoveRecord } from '../position/moveHistory';
import { PuzzlePosition } from '../position/Position';

export type PuzzleResultStatus = 'none' | 'incorrect' | 'complete';

export type PuzzleAnalysisContext = {
  initialFen: string;
  solutionMoves: string[];
  moveHistory: PuzzleMoveRecord[];
  currentPly: number;
  boardOrientation: 'white' | 'black';
};

export const emptyAnalysisContext = (): PuzzleAnalysisContext => ({
  initialFen: '',
  solutionMoves: [],
  moveHistory: [],
  currentPly: 0,
  boardOrientation: 'white',
});

export const buildAnalysisContext = (
  position: PuzzlePosition | null,
): PuzzleAnalysisContext => {
  if (!position) {
    return emptyAnalysisContext();
  }

  return {
    initialFen: position.getInitialFen(),
    solutionMoves: position.getSolutionMoves(),
    moveHistory: position.getMoveHistory(),
    currentPly: position.getIndex(),
    boardOrientation: position.getPlayerColor() as 'white' | 'black',
  };
};

export const isAnalysisAvailable = (
  position: PuzzlePosition,
  resultStatus: PuzzleResultStatus,
): boolean => {
  return (
    buildAnalysisContext(position).solutionMoves.length > 0 &&
    resultStatus !== 'none'
  );
};
