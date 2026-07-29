import { Chess } from 'chess.js';
import {
  applyUciMove,
  advanceToPlayerTurn,
  normalizePuzzleResumeConfig,
  puzzlePositionFromFetch,
  PuzzlePosition,
  sideToMoveFromFen,
} from './Position';

const YQSZL_FEN =
  'r3r1k1/p1pb2pp/1p1p4/3P1p2/2P5/1P6/Pq2BPPP/R2QR1K1 w - - 1 17';
const YQSZL_MOVES = 'd1c1 e8e2 c1b2 e2b2'.split(' ');

const PROMOTION_FEN = '5k2/4P3/8/8/8/8/8/4K3 w - - 0 1';
const DUAL_CHECKMATE_FEN =
  '1r3rk1/Q4ppp/4p3/4q3/8/8/PP4PP/3R1RK1 b - - 0 21';
const DUAL_CHECKMATE_MOVES =
  'b8b2 a7f7 f8f7 d1d8 f7f8 f1f8'.split(' ');

const playSolutionLine = (position: PuzzlePosition): void => {
  while (!position.isFinished()) {
    expect(position.next()).toBe(true);
  }
};

describe('applyUciMove', () => {
  it('applies promotion UCI without throwing', () => {
    const chess = new Chess(PROMOTION_FEN);

    expect(() => {
      expect(applyUciMove(chess, 'e7e8q')).toBe(true);
    }).not.toThrow();
    expect(chess.fen()).toBe('4Qk2/8/8/8/8/8/8/4K3 b - - 0 1');
  });

  it('does not throw when a second apply is attempted on the same position', () => {
    const chess = new Chess(PROMOTION_FEN);
    applyUciMove(chess, 'e7e8q');

    expect(() => applyUciMove(chess, 'e7e8q')).not.toThrow();
    expect(applyUciMove(chess, 'e7e8q')).toBe(false);
  });

  it('still accepts LAN-style strings chess.js parses directly', () => {
    const chess = new Chess(
      'rnb1r1k1/pp3ppp/2Pb1n2/6B1/3P4/2N2N2/Pq2BPPP/R2QK2R w KQ - 0 11',
    );

    expect(applyUciMove(chess, 'c6b7')).toBe(true);
    expect(chess.history().at(-1)).toBe('cxb7');
  });

  it('returns false for invalid UCI without throwing', () => {
    const chess = new Chess(PROMOTION_FEN);

    expect(() => applyUciMove(chess, 'e7e9q')).not.toThrow();
    expect(applyUciMove(chess, 'e7e9q')).toBe(false);
    expect(chess.fen()).toBe(PROMOTION_FEN);
  });
});

describe('PuzzlePosition getLastMoveUci', () => {
  it('returns the setup move after advancing to the trainer ply', () => {
    const position = new PuzzlePosition(
      'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
      ['e7e5', 'e2e4'],
    );
    position.next();

    expect(position.getIndex()).toBe(1);
    expect(position.getLastMoveUci()).toBe('e7e5');
  });

  it('returns null at the initial ply', () => {
    const position = new PuzzlePosition(
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      ['e2e4'],
    );

    expect(position.getLastMoveUci()).toBeNull();
  });
});

describe('PuzzlePosition getSideToMove', () => {
  it('reflects the active side from the current FEN', () => {
    const position = new PuzzlePosition(PROMOTION_FEN, ['e7e8q']);

    expect(position.getSideToMove()).toBe('white');
    position.next();
    expect(position.getSideToMove()).toBe('black');
  });
});

describe('advanceToPlayerTurn', () => {
  it('plays further opponent plies after the first setup move', () => {
    const position = new PuzzlePosition(
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      ['e2e4', 'e7e5', 'd1h5'],
    );
    position.next();

    advanceToPlayerTurn(position);

    expect(position.getIndex()).toBe(2);
    expect(position.getSideToMove()).toBe('white');
    expect(position.getPlayerColor()).toBe('white');
  });

  it('matches puzzlePositionFromFetch setup for a black-to-move opening ply', () => {
    const fen =
      'r1bq1rk1/pp3pp1/1nnbp2p/2p5/3P4/2P1B3/PPB1NPPP/RN1Q1RK1 b - - 2 11';
    const moves = ['b6c4', 'd1d3', 'f7f5', 'd3c4'];
    const position = new PuzzlePosition(fen, moves);
    position.next();

    advanceToPlayerTurn(position);

    expect(position.getIndex()).toBe(1);
    expect(position.getSideToMove()).toBe('white');
    expect(position.getPlayerColor()).toBe('white');
  });
});

describe('PuzzlePosition resume review', () => {
  it('starts at the missed ply and only accepts input on quiz indices', () => {
    const position = new PuzzlePosition(DUAL_CHECKMATE_FEN, DUAL_CHECKMATE_MOVES, {
      startIndex: 3,
      quizAtIndices: [3],
    });

    expect(position.getIndex()).toBe(3);
    expect(position.isQuizIndex()).toBe(true);
    expect(
      position.tryGuess('d1', 'd8', 'Q').accepted,
    ).toBe(true);
  });

  it('finishes at the segment boundary before the next quiz card', () => {
    const position = new PuzzlePosition(DUAL_CHECKMATE_FEN, DUAL_CHECKMATE_MOVES, {
      startIndex: 1,
      endIndex: 5,
      quizAtIndices: [1],
    });

    expect(position.tryGuess('a7', 'f7', 'Q').accepted).toBe(true);
    position.next();

    while (!position.isFinished()) {
      expect(position.next()).toBe(true);
    }

    expect(position.getIndex()).toBe(5);
    expect(position.isQuizIndex()).toBe(false);
  });

  it('opens resume review on the solver side when metadata starts on an opponent ply', () => {
    const fen =
      'r1bq1rk1/pp3pp1/1nnbp2p/2p5/3P4/2P1B3/PPB1NPPP/RN1Q1RK1 b - - 2 11';
    const moves = ['b6c4', 'd1d3', 'f7f5', 'd3c4'];
    const position = new PuzzlePosition(fen, moves, {
      startIndex: 0,
      quizAtIndices: [0],
    });

    advanceToPlayerTurn(position);

    expect(position.getIndex()).toBe(1);
    expect(position.getSideToMove()).toBe('white');
    expect(position.getPlayerColor()).toBe('white');
  });
});

describe('PuzzlePosition solution walkthrough', () => {
  it('plays a promotion finishing move through next()', () => {
    const position = new PuzzlePosition(PROMOTION_FEN, ['e7e8q']);

    expect(position.next()).toBe(true);
    expect(position.isFinished()).toBe(true);
    expect(position.fen()).toContain('4Qk2');
  });

  it('plays a full mate line including the final move', () => {
    const position = new PuzzlePosition(DUAL_CHECKMATE_FEN, DUAL_CHECKMATE_MOVES);

    playSolutionLine(position);

    expect(new Chess(position.fen()).isGameOver()).toBe(true);
  });

  it('can replay a revealed solution from the start', () => {
    const position = new PuzzlePosition(DUAL_CHECKMATE_FEN, DUAL_CHECKMATE_MOVES);

    position.recordSolutionShown();
    position.setSolutionRevealed(true);
    playSolutionLine(position);

    position.replaySolution();

    expect(position.getIndex()).toBe(0);
    expect(position.isSolutionRevealed()).toBe(true);
    expect(position.isFinished()).toBe(false);

    playSolutionLine(position);

    expect(new Chess(position.fen()).isGameOver()).toBe(true);
  });
});

describe('sideToMoveFromFen', () => {
  it('reads the side-to-move field from a FEN string', () => {
    expect(
      sideToMoveFromFen(
        'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
      ),
    ).toBe('black');
    expect(
      sideToMoveFromFen(
        'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e3 0 1',
      ),
    ).toBe('white');
  });
});

describe('normalizePuzzleResumeConfig YQSzL', () => {
  it('remaps opponent ply 0 to solver ply 1', () => {
    expect(
      normalizePuzzleResumeConfig(YQSZL_FEN, YQSZL_MOVES, {
        startIndex: 0,
        quizAtIndices: [0],
      }),
    ).toEqual({
      startIndex: 1,
      endIndex: 4,
      quizAtIndices: [1],
    });
  });

  it('loads a draggable black-to-move quiz after resume normalization', () => {
    const resume = normalizePuzzleResumeConfig(YQSZL_FEN, YQSZL_MOVES, {
      startIndex: 0,
      quizAtIndices: [0],
    });
    const position = new PuzzlePosition(YQSZL_FEN, YQSZL_MOVES, resume);
    advanceToPlayerTurn(position);

    expect(position.getIndex()).toBe(1);
    expect(position.getSideToMove()).toBe('black');
    expect(position.getPlayerColor()).toBe('black');
    expect(position.isQuizIndex()).toBe(true);
  });
});

describe('puzzlePositionFromFetch', () => {
  const setupFen =
    'r1bq1rk1/pp3pp1/1nnbp2p/2p5/3P4/2P1B3/PPB1NPPP/RN1Q1RK1 b - - 2 11';
  const setupMoves = ['b6c4', 'd1d3', 'f7f5', 'd3c4'];

  it('leaves fresh puzzles on the stored FEN for setup intro', () => {
    const position = puzzlePositionFromFetch(setupFen, setupMoves);

    expect(position.getIndex()).toBe(0);
    expect(position.getSideToMove()).toBe('black');
    expect(position.getPlayerColor()).toBe('white');
    expect(position.hasResumeConfig()).toBe(false);
  });

  it('lands one ply early on resume so the opponent lead-in can animate', () => {
    const position = puzzlePositionFromFetch(setupFen, setupMoves, {
      startIndex: 0,
      quizAtIndices: [0],
    });

    expect(position.getIndex()).toBe(0);
    expect(position.getSideToMove()).toBe('black');
    expect(position.getPlayerColor()).toBe('white');
    expect(position.isQuizIndex()).toBe(false);

    expect(position.next()).toBe(true);
    expect(position.getIndex()).toBe(1);
    expect(position.getSideToMove()).toBe('white');
    expect(position.isQuizIndex()).toBe(true);
  });

  it('animates into a mid-line resume quiz after the preceding opponent ply', () => {
    const position = puzzlePositionFromFetch(YQSZL_FEN, YQSZL_MOVES, {
      startIndex: 3,
      endIndex: 4,
      quizAtIndices: [3],
    });

    expect(position.getIndex()).toBe(2);
    expect(position.getSideToMove()).toBe('white');
    expect(position.isQuizIndex()).toBe(false);

    expect(position.next()).toBe(true);
    expect(position.getIndex()).toBe(3);
    expect(position.getSideToMove()).toBe('black');
    expect(position.isQuizIndex()).toBe(true);
  });
});
