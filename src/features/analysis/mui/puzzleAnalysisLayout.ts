import type { AnalysisLayoutConfig } from 'react-chess-core';
import { MUI_BREAKPOINT_VALUES, VIEWPORT } from './viewportBreakpoints';

/** Analysis dialog: smaller board + move list + engine columns. */
export const puzzleAnalysisLayout: AnalysisLayoutConfig = {
  boardWidth: 480,
  sidebarWidth: 500,
  columnGap: 16,
};

/** Target board width by viewport band — analysis modal fills more space than play boards. */
const analysisBoardWidthForViewport = (viewportWidth: number): number => {
  if (viewportWidth >= VIEWPORT.ultraWideMin) {
    return 960;
  }
  if (viewportWidth >= VIEWPORT.wideDesktopMin) {
    return 720;
  }
  if (viewportWidth >= MUI_BREAKPOINT_VALUES.xl) {
    return 580;
  }
  return puzzleAnalysisLayout.boardWidth;
};

const analysisSidebarWidthForViewport = (viewportWidth: number): number => {
  if (viewportWidth >= VIEWPORT.ultraWideMin) {
    return 820;
  }
  if (viewportWidth >= VIEWPORT.wideDesktopMin) {
    return 640;
  }
  if (viewportWidth >= MUI_BREAKPOINT_VALUES.xl) {
    return 560;
  }
  return puzzleAnalysisLayout.sidebarWidth;
};

export const puzzleAnalysisLayoutForViewport = (
  viewportWidth: number,
): AnalysisLayoutConfig => ({
  boardWidth: analysisBoardWidthForViewport(viewportWidth),
  sidebarWidth: analysisSidebarWidthForViewport(viewportWidth),
  columnGap: puzzleAnalysisLayout.columnGap,
});

/** Dialog paper max width — board + sidebar + chrome slack. */
export const puzzleAnalysisDialogMaxWidthForViewport = (
  viewportWidth: number,
  dialogInsetPx: number,
): number => {
  const layout = puzzleAnalysisLayoutForViewport(viewportWidth);
  return (
    layout.boardWidth +
    layout.sidebarWidth +
    layout.columnGap +
    dialogInsetPx +
    32
  );
};
