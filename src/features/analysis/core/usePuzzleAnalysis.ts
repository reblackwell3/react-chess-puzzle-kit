import { useEffect, useState } from 'react';
import { PuzzlePosition } from '../../position/Position';
import { PuzzleResultStatus } from './analysisContext';
import {
  buildAnalysisContext,
  isAnalysisAvailable,
  PuzzleAnalysisContext,
} from './analysisContext';

export const usePuzzleAnalysis = (
  position: PuzzlePosition | null,
  resultStatus: PuzzleResultStatus,
  puzzleNum: number,
) => {
  const [isOpen, setIsOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<PuzzleAnalysisContext | null>(null);

  const canOpen = isAnalysisAvailable(position, resultStatus);

  useEffect(() => {
    setIsOpen(false);
    setSnapshot(null);
  }, [puzzleNum]);

  const openAnalysis = () => {
    if (!canOpen || !position) {
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
