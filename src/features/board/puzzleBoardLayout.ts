import { CSSProperties } from 'react';

/** Default pixel width for the live puzzle board (analysis uses {@link DEFAULT_ANALYSIS_LAYOUT}). */
export const DEFAULT_PUZZLE_BOARD_WIDTH = 480;

/** Minimum height reserved below the board so controls do not shift when status changes. */
export const PUZZLE_CONTROLS_MIN_HEIGHT = 96;

export const puzzlePlayColumnStyle = (boardWidth: number): CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  width: boardWidth,
  maxWidth: '100%',
});

export const puzzleBoardSlotStyle = (): CSSProperties => ({
  width: '100%',
  aspectRatio: '1 / 1',
  flexShrink: 0,
});

export const puzzleControlsSlotStyle = (): CSSProperties => ({
  minHeight: PUZZLE_CONTROLS_MIN_HEIGHT,
  flexShrink: 0,
  display: 'flex',
  alignItems: 'flex-start',
  marginTop: 8,
});