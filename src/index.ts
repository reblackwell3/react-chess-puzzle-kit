/**
 * Puzzle-kit public API — puzzle play and post-puzzle analysis only.
 * Board theme, highlights, and Stockfish hooks: import from `react-chess-core`.
 */
export * from './features/analysis';
export * from './features/board/PuzzleBoard';
export * from './features/board/PuzzleBoardWithControls';
export {
  DefaultPuzzleControls,
  defaultRenderControls,
} from './features/board/defaults/DefaultPuzzleControls';
export type { PuzzleControlsRenderProps } from './features/board/defaults/DefaultPuzzleControls';
export { DEFAULT_PUZZLE_BOARD_WIDTH } from './features/board/puzzleBoardLayout';
export {
  EngineEvaluationPanel,
  type EngineEvaluationPanelProps,
} from './features/engine/EngineEvaluationPanel';
export * from './features/position/moveHistory';
export * from './features/position/Position';
export * from './features/position/Traversable';

import { boardSquareHighlightColors } from 'react-chess-core';
import { analysisBoardHighlightColors } from './features/analysis/analysisBoardHighlightColors';

/** @deprecated Import {@link boardSquareHighlightColors} and {@link analysisBoardHighlightColors} from their modules or use react-chess-core for board colors. */
export const squareHighlightColors = {
  ...boardSquareHighlightColors,
  ...analysisBoardHighlightColors,
} as const;
