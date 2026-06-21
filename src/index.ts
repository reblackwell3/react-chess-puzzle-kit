/**
 * Puzzle-kit public API — puzzle play and post-puzzle analysis glue.
 * Board theme, analysis UI, and Stockfish: import from `react-chess-core`.
 */
export * from './features/analysis';
export * from './features/board/PuzzleBoard';
export * from './features/board/PuzzleBoardWithControls';
export * from './features/board/LineBoard';
export * from './features/board/LineBoardWithControls';
export {
  DefaultPuzzleControls,
  defaultRenderControls,
} from './features/board/defaults/DefaultPuzzleControls';
export {
  DefaultLineControls,
  defaultRenderLineControls,
} from './features/board/defaults/DefaultLineControls';
export type {
  PuzzleControlState,
  PuzzleControlsRenderProps,
} from './features/board/defaults/DefaultPuzzleControls';
export type { PuzzleAutoAdvanceState } from './features/board/usePuzzleAutoAdvanceCountdown';
export {
  DEFAULT_PUZZLE_BOARD_WIDTH,
  PUZZLE_CONTROLS_BESIDE_RESERVE_PX,
  PUZZLE_CONTROLS_STACK_BREAKPOINT_PX,
} from './features/board/puzzleBoardLayout';
export * from './features/position/moveHistory';
export * from './features/position/Position';
export * from './features/position/Traversable';

import {
  analysisBoardHighlightColors,
  boardSquareHighlightColors,
} from 'react-chess-core';

/** @deprecated Import {@link boardSquareHighlightColors} and {@link analysisBoardHighlightColors} from `react-chess-core`. */
export const squareHighlightColors = {
  ...boardSquareHighlightColors,
  ...analysisBoardHighlightColors,
} as const;
