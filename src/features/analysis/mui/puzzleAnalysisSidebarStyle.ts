import type { AnalysisHistoryRow } from 'react-chess-core';

type AnalysisTheme = 'light' | 'dark';

/** EndChess analysis move-list colors (host sidebar only). */
export const puzzleAnalysisSidebarColors = {
  activeMove: {
    light: 'rgba(119, 177, 212, 1)',
    dark: 'rgba(90, 159, 190, 1)',
  },
  start: {
    light: 'rgba(232, 232, 232, 1)',
    dark: 'rgba(38, 38, 38, 1)',
  },
  mainStripe: [
    { light: 'rgba(201, 201, 201, 1)', dark: 'rgba(28, 28, 28, 1)' },
    { light: 'rgba(242, 242, 242, 1)', dark: 'rgba(56, 56, 56, 1)' },
  ],
  /** User-explored variation rows: light grey / white striping. */
  variationStripe: [
    { light: 'rgba(216, 216, 216, 1)', dark: 'rgba(200, 200, 200, 1)' },
    { light: 'rgba(255, 255, 255, 1)', dark: 'rgba(255, 255, 255, 1)' },
  ],
  /** Text on variation rows (light backgrounds need dark type). */
  variationText: {
    light: 'rgba(0, 0, 0, 0.87)',
    dark: 'rgba(0, 0, 0, 0.87)',
  },
} as const;

type RowBandCounters = {
  main: number;
  variation: number;
};

export const createPuzzleAnalysisRowBands = (): RowBandCounters => ({
  main: 0,
  variation: 0,
});

export const getPuzzleAnalysisRowBackground = (
  theme: AnalysisTheme,
  row: AnalysisHistoryRow,
  bands: RowBandCounters,
): string => {
  if (row.kind === 'start') {
    return puzzleAnalysisSidebarColors.start[theme];
  }

  if (row.kind === 'main') {
    bands.variation = 0;
    const stripe = bands.main % 2;
    bands.main += 1;
    return puzzleAnalysisSidebarColors.mainStripe[stripe][theme];
  }

  const stripe = bands.variation % 2;
  bands.variation += 1;
  return puzzleAnalysisSidebarColors.variationStripe[stripe][theme];
};
