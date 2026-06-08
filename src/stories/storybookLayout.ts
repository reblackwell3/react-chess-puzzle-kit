import { AnalysisLayoutConfig } from 'react-chess-core';

/** Smaller boards for Storybook previews (production defaults stay at 480+). */
export const STORYBOOK_BOARD_WIDTH = 360;

export const STORYBOOK_ANALYSIS_LAYOUT: AnalysisLayoutConfig = {
  boardWidth: STORYBOOK_BOARD_WIDTH,
  sidebarWidth: 380,
  columnGap: 12,
};
