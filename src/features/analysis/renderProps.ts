import type { ReactNode } from 'react';
import {
  AnalysisHistoryRow,
  SolutionMoveDisplay,
} from './AnalysisPosition';

export type AnalysisControls = {
  visible: boolean;
  openAnalysis: () => void;
};

export type AnalysisSidebarRenderProps = {
  /** Main-line moves (legacy; prefer historyRows). */
  moves: SolutionMoveDisplay[];
  historyRows: AnalysisHistoryRow[];
  isHistoryRowSelected: (row: AnalysisHistoryRow) => boolean;
  onSelectHistoryRow: (row: AnalysisHistoryRow) => void;
  ply: number;
  maxPly: number;
  onSelectPly: (ply: number) => void;
  theme: 'light' | 'dark';
};

export type AnalysisContainerRenderProps = {
  theme: 'light' | 'dark';
  onClose: () => void;
  children: ReactNode;
};
