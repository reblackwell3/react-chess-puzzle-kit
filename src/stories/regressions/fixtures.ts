export interface PuzzleRegression {
  /** Story name shown in Storybook. */
  name: string;
  /** The edge case and the expected behavior, for the story docs. */
  description: string;
  /** Source puzzle id (endchess) for traceability. */
  sourceId: string;
  /** Starting FEN as stored for the puzzle. */
  fen: string;
  /** Space-separated UCI solution moves (first move is played automatically). */
  moves: string;
}

/**
 * Real puzzles that previously exposed bugs, captured so the scenarios can be
 * reproduced in Storybook. Add an entry here and a matching story export in
 * `PuzzleRegressions.stories.tsx`.
 */
export const PUZZLE_REGRESSIONS: Record<string, PuzzleRegression> = {
  wrongLegalCaptureShouldFail: {
    name: 'Wrong legal capture should fail',
    description:
      'Black to move, not in check. The solution is b2c3 (Qxc3), but the b7 pawn ' +
      'is capturable by the queen (Qxb7) and the c8 bishop (Bxb7). Those moves are ' +
      'legal but wrong, so they must mark the puzzle incorrect instead of being ' +
      'silently ignored like an illegal drag.',
    sourceId: '66abad1dcb8d6163fd6eaa07',
    fen: 'rnb1r1k1/pp3ppp/2Pb1n2/6B1/3P4/2N2N2/Pq2BPPP/R2QK2R w KQ - 0 11',
    moves: 'c6b7 b2c3 g5d2 e8e2',
  },
  dualCheckmateAccepted: {
    name: 'Dual checkmate is accepted',
    description:
      'mateIn3 for White. The solution ends with f1f8 (Rxf8#), but at the final ' +
      'position both rooks mate on f8, so d8f8 (Rdxf8#) is an equally valid mate. ' +
      'A checkmating move that differs from the solution line must still be ' +
      'accepted as a correct, finishing move.',
    sourceId: '66abad1ccb8d6163fd6e80b2',
    fen: '1r3rk1/Q4ppp/4p3/4q3/8/8/PP4PP/3R1RK1 b - - 0 21',
    moves: 'b8b2 a7f7 f8f7 d1d8 f7f8 f1f8',
  },
  wrongCaptureWhileInCheckShouldFail: {
    name: 'Wrong capture while in check should fail',
    description:
      'The auto first move g4e3 is Ne3+, so White is in check with only two legal ' +
      'moves: the solution Qc3xe3 (c3e3) and the alternative knight capture ' +
      'Nc4xe3 (c4e3). The knight capture is legal but not the solution, so it must ' +
      'mark the puzzle incorrect rather than being silently rejected as an invalid move.',
    sourceId: '66abad19cb8d6163fd6d93a1',
    fen: '8/5pk1/2Pp2p1/2qPp2p/2N1P1nP/1BQ5/2K5/r7 b - - 5 43',
    moves: 'g4e3 c3e3 c5e3 c4e3',
  },
  stockfishAnalysisMove3Ke6: {
    name: 'Stockfish survives rapid analysis nav',
    description:
      'Endgame pawn puzzle (1784). Opening analysis at the final ply, then clicking ' +
      'through every main-line move in the sidebar while Stockfish is searching used to ' +
      'crash the WASM worker with RuntimeError: unreachable.',
    sourceId: '66abad1bcb8d6163fd6e172a',
    fen: '8/6p1/4k2p/2pp3P/5PP1/1KP5/8/8 b - - 6 46',
    moves: 'e6f6 b3a4 f6e6 a4b5 d5d4 c3d4 c5d4 b5c4 e6d6 c4d4',
  },
};
