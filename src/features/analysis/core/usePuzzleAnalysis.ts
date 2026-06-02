import { useEffect, useState } from 'react';
import { PuzzlePosition } from '../../position/Position';
import { PuzzleResultStatus } from './analysisContext';
import {
  buildAnalysisContext,
  isAnalysisAvailable,
  PuzzleAnalysisContext,
} from './analysisContext';

export const usePuzzleAnalysis = (
  position: PuzzlePosition,
  resultStatus: PuzzleResultStatus,
  puzzleNum: number,
) => {
  const [isOpen, setIsOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<PuzzleAnalysisContext | null>(null);

  const canOpen = isAnalysisAvailable(position, resultStatus);

  useEffect(() => {
    const context = buildAnalysisContext(position);
    console.log('[puzzle-analysis]', {
      puzzleNum,
      resultStatus,
      canOpen,
      solutionMoveCount: context.solutionMoves.length,
      isFinished: position.isFinished(),
    });
  }, [position, resultStatus, canOpen, puzzleNum]);

  useEffect(() => {
    setIsOpen(false);
    setSnapshot(null);
  }, [puzzleNum]);

  const openAnalysis = () => {
    console.log('[puzzle-analysis] openAnalysis clicked', { canOpen, resultStatus });

    if (!canOpen) {
      console.log('[puzzle-analysis] openAnalysis blocked — canOpen is false');
      return;
    }

    setSnapshot(buildAnalysisContext(position));
    setIsOpen(true);
  };

  const closeAnalysis = () => {
    setIsOpen(false);
  };

  return {
    canOpen,
    isOpen,
    snapshot,
    openAnalysis,
    closeAnalysis,
  };
};
