import { Chess } from 'chess.js';
import { applyUciMove, PuzzlePosition } from './Position';

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
