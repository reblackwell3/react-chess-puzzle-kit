export * from './features/analysis';
export * from './features/engine';
export {
  ChessboardThemeContext,
  HighlightChessboard,
  ThemeProvider,
  boardSquareHighlightColors,
  getStylesForTheme,
  useChessboardTheme,
  useTheme,
} from 'react-chess-core';
export type {
  HighlightChessboardProps,
  ThemeProviderProps,
} from 'react-chess-core';
export * from './features/board/PuzzleBoard';
export * from './features/board/PuzzleBoardWithControls';
export * from './features/analysis/analysisBoardHighlightColors';
export * from './features/position/moveHistory';
export * from './features/position/Position';
export * from './features/position/Traversable';

import { boardSquareHighlightColors } from 'react-chess-core';
import { analysisBoardHighlightColors } from './features/analysis/analysisBoardHighlightColors';

/** @deprecated Use {@link boardSquareHighlightColors} and {@link analysisBoardHighlightColors}. */
export const squareHighlightColors = {
  ...boardSquareHighlightColors,
  ...analysisBoardHighlightColors,
} as const;
