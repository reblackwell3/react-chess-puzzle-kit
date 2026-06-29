import {
  PUZZLE_ANALYSIS_SIDE_BY_SIDE_MIN_WIDTH,
  puzzleAnalysisDimensionsForViewport,
  puzzleAnalysisSideBySideMinWidth,
} from '../puzzleAnalysisDimensions';
import { VIEWPORT } from '../viewportBreakpoints';

describe('puzzleAnalysisDimensionsForViewport', () => {
  it('stacks on phone widths', () => {
    const dims = puzzleAnalysisDimensionsForViewport(390);
    expect(dims.stackVertically).toBe(true);
    expect(dims.stackEngineBelow).toBe(true);
    expect(dims.boardWidth).toBe(342);
    expect(dims.layout.sidebarWidth).toBe(342);
  });

  it('stacks on iPad portrait', () => {
    const dims = puzzleAnalysisDimensionsForViewport(768);
    expect(dims.stackVertically).toBe(true);
    expect(dims.stackEngineBelow).toBe(true);
    expect(dims.boardWidth).toBeLessThanOrEqual(480);
  });

  it('uses side-by-side layout on wide desktop', () => {
    const dims = puzzleAnalysisDimensionsForViewport(1400);
    expect(dims.stackVertically).toBe(false);
    expect(dims.boardWidth).toBe(480);
    expect(dims.layout.sidebarWidth).toBe(500);
  });

  it('keeps full board width when side-by-side content fits comfortably', () => {
    const viewport =
      PUZZLE_ANALYSIS_SIDE_BY_SIDE_MIN_WIDTH + 48 + 40;
    const dims = puzzleAnalysisDimensionsForViewport(viewport);
    expect(dims.stackVertically).toBe(false);
    expect(dims.boardWidth).toBe(480);
  });

  it('scales board and sidebar on 4K viewports', () => {
    const dims = puzzleAnalysisDimensionsForViewport(
      VIEWPORT.ultraWideMin,
      1440,
    );
    expect(dims.stackVertically).toBe(false);
    expect(dims.boardWidth).toBe(960);
    expect(dims.layout.sidebarWidth).toBe(820);
    expect(puzzleAnalysisSideBySideMinWidth(VIEWPORT.ultraWideMin)).toBe(
      960 + 820 + 16,
    );
  });

  it('shrinks the board when viewport height is constrained', () => {
    const dims = puzzleAnalysisDimensionsForViewport(1400, 500);
    expect(dims.stackVertically).toBe(false);
    expect(dims.boardWidth).toBeLessThan(480);
  });

  it('matches sidebar width to content width when stacked', () => {
    const dims = puzzleAnalysisDimensionsForViewport(390);
    expect(dims.layout.sidebarWidth).toBe(dims.layout.boardWidth);
    expect(dims.stackEngineBelow).toBe(true);
  });

  it('uses side-by-side min width constant at default layout', () => {
    expect(PUZZLE_ANALYSIS_SIDE_BY_SIDE_MIN_WIDTH).toBe(480 + 500 + 16);
  });
});
