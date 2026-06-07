import { buildAnalysisContext } from '../../features/analysis/core/analysisContext';
import { applyUciMove, PuzzlePosition } from '../../features/position/Position';
import { Chess } from 'chess.js';
import { PuzzleRegression } from './fixtures';

/** Main-line sidebar labels (`Start`, `1. e4`, …) for a regression puzzle. */
export const getRegressionMainLineLabels = (
  regression: PuzzleRegression,
): string[] => {
  const moves = regression.moves.split(' ').filter(Boolean);
  const chess = new Chess(regression.fen);
  const labels = ['Start'];

  moves.forEach((uci, index) => {
    if (applyUciMove(chess, uci)) {
      const san = chess.history().at(-1) ?? uci;
      labels.push(`${index + 1}. ${san}`);
    }
  });

  return labels;
};

/** Completed puzzle snapshot for analysis regression stories. */
export const createRegressionAnalysisContext = (regression: PuzzleRegression) => {
  const position = new PuzzlePosition(
    regression.fen,
    regression.moves.split(' ').filter(Boolean),
  );

  while (position.next()) {}

  return buildAnalysisContext(position);
};
