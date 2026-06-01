/**
 * Square overlay colors for puzzle + analysis boards.
 * Tweak values here when iterating on highlights.
 */
export const squareHighlightColors = {
  /** King in check */
  check: '#e53935',
  /** Hint square (puzzle) */
  hint: 'rgba(119, 177, 212, 0.75)',
  /** Wrong guess square (puzzle) */
  incorrect: 'rgba(255, 127, 127, 0.8)',
  /** Last move from/to (analysis replay) */
  lastMove: {
    light: 'rgba(253, 216, 53, 0.55)',
    dark: 'rgba(144, 202, 249, 0.5)',
  },
  /** DefaultAnalysisSidebar selected move chip */
  sidebarActiveMove: {
    light: 'rgba(119, 177, 212, 1)', // #77b1d4
    dark: 'rgba(90, 159, 190, 1)', // #5a9fbe
  },
  sidebarMove: {
    light: 'rgba(240, 240, 240, 1)', // #f0f0f0
    dark: 'rgba(45, 45, 45, 1)', // #2d2d2d
  },
} as const;

export const getLastMoveSquareStyles = (
  from: string,
  to: string,
  theme: 'light' | 'dark',
): Record<string, { backgroundColor: string }> => {
  const backgroundColor = squareHighlightColors.lastMove[theme];
  return {
    [from]: { backgroundColor },
    [to]: { backgroundColor },
  };
};
