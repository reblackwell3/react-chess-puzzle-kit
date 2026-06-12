import { CSSProperties } from 'react';

/** Default pixel width for the live puzzle board (analysis uses {@link DEFAULT_ANALYSIS_LAYOUT}). */
export const DEFAULT_PUZZLE_BOARD_WIDTH = 480;

/** Width reserved for the vertical controls column beside the board. */
export const PUZZLE_CONTROLS_COLUMN_WIDTH = 160;

/** Gap between the board column and controls column. */
export const PUZZLE_BOARD_CONTROLS_GAP = 16;

/** Viewports at or below this width stack controls under the board. */
export const PUZZLE_CONTROLS_STACK_BREAKPOINT_PX = 600;

/** Minimum height reserved above the board so the caption slot does not shift between loads. */
export const PUZZLE_BOARD_CAPTION_MIN_HEIGHT = 24;

export type PuzzleControlsPlacement = 'beside' | 'below';

export const puzzlePlayRowStyle = (
  placement: PuzzleControlsPlacement = 'beside',
): CSSProperties => ({
  display: 'flex',
  flexDirection: placement === 'below' ? 'column' : 'row',
  alignItems: placement === 'below' ? 'stretch' : 'flex-start',
  gap: PUZZLE_BOARD_CONTROLS_GAP,
  width: placement === 'below' ? '100%' : 'fit-content',
  maxWidth: '100%',
});

export const puzzleBoardColumnStyle = (
  boardWidth: number,
  placement: PuzzleControlsPlacement = 'beside',
): CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  width: boardWidth,
  maxWidth: '100%',
  flexShrink: 0,
  alignSelf: placement === 'below' ? 'center' : undefined,
});

export const puzzleBoardCaptionSlotStyle = (): CSSProperties => ({
  width: '100%',
  minHeight: PUZZLE_BOARD_CAPTION_MIN_HEIGHT,
  flexShrink: 0,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 4,
});

export const puzzleBoardSlotWrapperStyle = (): CSSProperties => ({
  position: 'relative',
  width: '100%',
  flexShrink: 0,
});

export const puzzleBoardSlotStyle = (): CSSProperties => ({
  width: '100%',
  aspectRatio: '1 / 1',
  flexShrink: 0,
});

export const puzzleControlsFeedbackStyle = (
  placement: PuzzleControlsPlacement = 'beside',
): CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: placement === 'below' ? 'center' : 'flex-end',
  gap: 4,
  marginTop: placement === 'below' ? 0 : 'auto',
  pointerEvents: 'none',
});

export const puzzleControlsSlotStyle = (
  placement: PuzzleControlsPlacement = 'beside',
): CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  gap: 8,
  flexShrink: 0,
  minWidth: placement === 'below' ? undefined : PUZZLE_CONTROLS_COLUMN_WIDTH,
  width: placement === 'below' ? '100%' : undefined,
  alignSelf: 'stretch',
});
