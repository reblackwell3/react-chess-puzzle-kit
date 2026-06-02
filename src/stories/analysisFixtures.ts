import { buildAnalysisContext } from '../features/analysis/core/analysisContext';
import { PuzzlePosition } from '../features/position/Position';

export const samplePuzzleFen =
  'r6k/pp2r2p/4Rp1Q/3p4/8/1N1P2R1/PqP2bPP/7K b - - 0 24';

export const samplePuzzleMoves = 'f2g3 e6e7 b2b1 b3c1 b1c1 h6c1'.split(' ');

/** Completed puzzle snapshot for analysis stories. */
export const createSampleAnalysisContext = () => {
  const position = new PuzzlePosition(samplePuzzleFen, samplePuzzleMoves);
  while (position.next()) {}
  return buildAnalysisContext(position);
};
