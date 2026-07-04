import type { AnalysisLayoutConfig } from 'react-chess-core';
import { fitBoardWidth } from './fitBoardWidth';
import {
  puzzleAnalysisLayout,
  puzzleAnalysisLayoutForViewport,
} from './puzzleAnalysisLayout';

/** Dialog padding, dividers, and scrollbar slack. */
export const PUZZLE_ANALYSIS_DIALOG_INSET_PX = 48;

/** App bar, dialog title, and vertical padding when fitting board height. */
export const PUZZLE_ANALYSIS_VERTICAL_INSET_PX = 140;

export const PUZZLE_ANALYSIS_SIDE_BY_SIDE_MIN_WIDTH =
  puzzleAnalysisLayout.boardWidth +
  puzzleAnalysisLayout.sidebarWidth +
  puzzleAnalysisLayout.columnGap;

export const puzzleAnalysisSideBySideMinWidth = (
  viewportWidth: number,
): number => {
  const layout = puzzleAnalysisLayoutForViewport(viewportWidth);
  return layout.boardWidth + layout.sidebarWidth + layout.columnGap;
};

export type ResponsivePuzzleAnalysisDimensions = {
  layout: AnalysisLayoutConfig;
  boardWidth: number;
  stackVertically: boolean;
  stackEngineBelow: boolean;
};

export const puzzleAnalysisDimensionsForViewport = (
  viewportWidth: number,
  viewportHeight?: number,
): ResponsivePuzzleAnalysisDimensions => {
  const baseLayout = puzzleAnalysisLayoutForViewport(viewportWidth);
  const contentWidth = Math.max(0, viewportWidth - PUZZLE_ANALYSIS_DIALOG_INSET_PX);
  const stackVertically =
    contentWidth < puzzleAnalysisSideBySideMinWidth(viewportWidth);
  // When the board stacks above the sidebar, keep engine lines in a column too.
  const stackEngineBelow = stackVertically;
  const maxBoardHeight =
    viewportHeight != null && viewportHeight > PUZZLE_ANALYSIS_VERTICAL_INSET_PX
      ? viewportHeight - PUZZLE_ANALYSIS_VERTICAL_INSET_PX
      : undefined;

  const boardWidth = stackVertically
    ? fitBoardWidth(contentWidth, baseLayout.boardWidth, 0, maxBoardHeight)
    : fitBoardWidth(
        contentWidth - baseLayout.sidebarWidth - baseLayout.columnGap,
        baseLayout.boardWidth,
        0,
        maxBoardHeight,
      );

  const sidebarWidth = stackVertically ? contentWidth : baseLayout.sidebarWidth;

  return {
    layout: {
      ...baseLayout,
      boardWidth,
      sidebarWidth,
    },
    boardWidth,
    stackVertically,
    stackEngineBelow,
  };
};
