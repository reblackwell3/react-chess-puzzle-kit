/** Smallest playable board (still readable on narrow phones). */
export const MIN_BOARD_WIDTH = 240;

export const fitBoardWidth = (
  containerWidth: number,
  maxBoardWidth: number,
  besideControlsReservePx = 0,
  maxBoardHeight?: number,
): number => {
  const available = Math.max(0, containerWidth - besideControlsReservePx);
  let fitted = Math.min(maxBoardWidth, available);
  if (maxBoardHeight != null && maxBoardHeight > 0) {
    fitted = Math.min(fitted, maxBoardHeight);
  }
  return Math.max(MIN_BOARD_WIDTH, Math.floor(fitted));
};
