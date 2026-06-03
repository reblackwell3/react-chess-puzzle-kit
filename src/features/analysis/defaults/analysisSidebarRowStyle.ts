import { AnalysisHistoryRow } from '../core/AnalysisPosition';
import { analysisSidebarColors } from './analysisSidebarColors';

export type SidebarRowBandCounters = {
  main: number;
  variation: number;
};

export const createSidebarRowBandCounters = (): SidebarRowBandCounters => ({
  main: 0,
  variation: 0,
});

/** Background for one analysis history row; mutates `bands` while iterating rows in order. */
export const getSidebarRowBackground = (
  theme: 'light' | 'dark',
  row: AnalysisHistoryRow,
  bands: SidebarRowBandCounters,
): string => {
  if (row.kind === 'start') {
    return analysisSidebarColors.start[theme];
  }

  if (row.kind === 'main') {
    bands.variation = 0;
    const stripe = bands.main % 2;
    bands.main += 1;
    return analysisSidebarColors.mainStripe[stripe][theme];
  }

  const stripe = bands.variation % 2;
  bands.variation += 1;
  return analysisSidebarColors.variationStripe[stripe][theme];
};
