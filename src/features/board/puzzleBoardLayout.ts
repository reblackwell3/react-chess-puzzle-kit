import { CSSProperties } from 'react';

/** Default pixel width for the live puzzle board (analysis uses {@link DEFAULT_ANALYSIS_LAYOUT}). */
export const DEFAULT_PUZZLE_BOARD_WIDTH = 480;

/** Width reserved for the vertical controls column beside the board. */
export const PUZZLE_CONTROLS_COLUMN_WIDTH = 160;

/** Gap between the board column and controls column. */
export const PUZZLE_BOARD_CONTROLS_GAP = 16;

/** Minimum height reserved above the board so the caption slot does not shift between loads. */
export const PUZZLE_BOARD_CAPTION_MIN_HEIGHT = 24;

export const puzzlePlayRowStyle = (): CSSProperties => ({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'flex-start',
  gap: PUZZLE_BOARD_CONTROLS_GAP,
  width: 'fit-content',
  maxWidth: '100%',
});

export const puzzleBoardColumnStyle = (boardWidth: number): CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  width: boardWidth,
  maxWidth: '100%',
  flexShrink: 0,
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

export const puzzleBoardSlotStyle = (): CSSProperties => ({
  width: '100%',
  aspectRatio: '1 / 1',
  flexShrink: 0,
});

export const puzzleControlsSlotStyle = (): CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  gap: 8,
  flexShrink: 0,
  minWidth: PUZZLE_CONTROLS_COLUMN_WIDTH,
});
