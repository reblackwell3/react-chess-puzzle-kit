import { PuzzlePosition } from '../position/Position';
import { isAnalysisAvailable } from './analysisContext';

const TEST_FEN =
  'r6k/pp2r2p/4Rp1Q/3p4/8/1N1P2R1/PqP2bPP/7K b - - 0 24';
const TEST_MOVES = 'f2g3 e6e7 b2b1 b3c1 b1c1 h6c1'.split(' ');

describe('isAnalysisAvailable', () => {
  it('returns false when position is null', () => {
    expect(isAnalysisAvailable(null, 'none')).toBe(false);
  });

  it('returns true when a puzzle with solution moves is loaded', () => {
    const position = new PuzzlePosition(TEST_FEN, TEST_MOVES);

    expect(isAnalysisAvailable(position, 'none')).toBe(true);
  });

  it('returns true before the puzzle is finished', () => {
    const position = new PuzzlePosition(TEST_FEN, TEST_MOVES);

    expect(isAnalysisAvailable(position, 'incorrect')).toBe(true);
    expect(position.isFinished()).toBe(false);
  });

  it('returns true after the puzzle is finished', () => {
    const position = new PuzzlePosition(TEST_FEN, TEST_MOVES);
    while (!position.isFinished()) {
      position.next();
    }

    expect(isAnalysisAvailable(position, 'complete')).toBe(true);
  });
});
