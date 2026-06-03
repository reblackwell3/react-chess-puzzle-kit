import { Chess } from 'chess.js';

/** Stockfish can trap on finished positions; skip analysis when the game is over. */
export const isAnalyzableFen = (fen: string): boolean => {
  if (!fen.trim()) {
    return false;
  }

  try {
    const chess = new Chess(fen);
    return !chess.isGameOver();
  } catch {
    return false;
  }
};
