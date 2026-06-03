/**
 * Square overlay colors for analysis board replay (last move highlight).
 */
export const analysisBoardHighlightColors = {
  lastMove: {
    light: 'rgba(253, 216, 53, 0.55)',
    dark: 'rgba(144, 202, 249, 0.5)',
  },
} as const;

export const getLastMoveSquareStyles = (
  from: string,
  to: string,
  theme: 'light' | 'dark',
): Record<string, { backgroundColor: string }> => {
  const backgroundColor = analysisBoardHighlightColors.lastMove[theme];
  return {
    [from]: { backgroundColor },
    [to]: { backgroundColor },
  };
};
