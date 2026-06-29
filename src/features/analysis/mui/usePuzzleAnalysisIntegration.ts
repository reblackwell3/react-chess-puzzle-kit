import { createElement, useCallback } from 'react';
import type { AnalysisMainRenderProps, AnalysisSidebarRenderProps } from 'react-chess-core';
import { PuzzleAnalysisMain } from './PuzzleAnalysisMain';
import { PuzzleAnalysisSidebar } from './PuzzleAnalysisSidebar';
import { useResponsivePuzzleAnalysis } from './useResponsivePuzzleAnalysis';

/** Props to wire responsive analysis into {@link PuzzleBoardWithControls}. */
export const usePuzzleAnalysisIntegration = () => {
  const { layout, boardWidth, stackVertically, stackEngineBelow } =
    useResponsivePuzzleAnalysis();

  const renderAnalysisMain = useCallback(
    (props: AnalysisMainRenderProps) =>
      createElement(PuzzleAnalysisMain, {
        ...props,
        layout,
        stackVertically,
      }),
    [layout, stackVertically],
  );

  const renderAnalysisSidebar = useCallback(
    (props: AnalysisSidebarRenderProps) =>
      createElement(PuzzleAnalysisSidebar, {
        ...props,
        stackEngineBelow,
      }),
    [stackEngineBelow],
  );

  return {
    analysisLayout: layout,
    analysisBoardWidth: boardWidth,
    renderAnalysisMain,
    renderAnalysisSidebar,
  };
};
