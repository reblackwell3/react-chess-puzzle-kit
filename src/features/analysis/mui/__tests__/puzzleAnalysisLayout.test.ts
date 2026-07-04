import {
  puzzleAnalysisLayout,
  puzzleAnalysisDialogMaxWidthForViewport,
  puzzleAnalysisLayoutForViewport,
} from '../puzzleAnalysisLayout';
import { MUI_BREAKPOINT_VALUES, VIEWPORT } from '../viewportBreakpoints';

describe('puzzleAnalysisLayoutForViewport', () => {
  it('uses the default layout below the xl breakpoint', () => {
    expect(puzzleAnalysisLayoutForViewport(1200)).toEqual({
      boardWidth: 480,
      sidebarWidth: 500,
      columnGap: puzzleAnalysisLayout.columnGap,
    });
  });

  it('scales board and sidebar at xl', () => {
    expect(puzzleAnalysisLayoutForViewport(MUI_BREAKPOINT_VALUES.xl)).toEqual({
      boardWidth: 580,
      sidebarWidth: 560,
      columnGap: 16,
    });
  });

  it('scales board and sidebar at wide desktop', () => {
    expect(
      puzzleAnalysisLayoutForViewport(VIEWPORT.wideDesktopMin),
    ).toEqual({
      boardWidth: 720,
      sidebarWidth: 640,
      columnGap: 16,
    });
  });

  it('scales board and sidebar on ultra-wide viewports', () => {
    expect(puzzleAnalysisLayoutForViewport(VIEWPORT.ultraWideMin)).toEqual({
      boardWidth: 960,
      sidebarWidth: 820,
      columnGap: 16,
    });
  });
});

describe('puzzleAnalysisDialogMaxWidthForViewport', () => {
  it('includes board, sidebar, gap, inset, and chrome slack', () => {
    const viewport = 1200;
    const inset = 48;
    const layout = puzzleAnalysisLayoutForViewport(viewport);
    expect(puzzleAnalysisDialogMaxWidthForViewport(viewport, inset)).toBe(
      layout.boardWidth + layout.sidebarWidth + layout.columnGap + inset + 32,
    );
  });
});
