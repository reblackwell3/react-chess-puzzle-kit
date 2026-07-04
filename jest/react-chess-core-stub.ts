/** Minimal react-chess-core surface for node unit tests (avoids MUI/chessboard dist). */
export const lastMoveUciAtPly = (
  movesUci: readonly string[],
  plyIndex: number,
): string | null => {
  if (plyIndex <= 0) {
    return null;
  }
  return movesUci[plyIndex - 1] ?? null;
};
