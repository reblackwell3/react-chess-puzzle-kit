export * from './features/analysis';
export * from './features/engine';
export * from './features/board/HighlightChessboard';
export * from './features/board/PuzzleBoard';
export * from './features/board/PuzzleBoardWithControls';
export * from './features/board/chessboardTheme';
export * from './features/board/boardSquareHighlightColors';
export * from './features/analysis/analysisBoardHighlightColors';
export * from './features/position/moveHistory';
export * from './features/position/Position';
export * from './features/position/Traversable';

import { boardSquareHighlightColors } from './features/board/boardSquareHighlightColors';
import { analysisBoardHighlightColors } from './features/analysis/analysisBoardHighlightColors';

/** @deprecated Use {@link boardSquareHighlightColors} and {@link analysisBoardHighlightColors}. */
export const squareHighlightColors = {
  ...boardSquareHighlightColors,
  ...analysisBoardHighlightColors,
} as const;
