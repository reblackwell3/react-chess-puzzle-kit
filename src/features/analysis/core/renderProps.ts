import type { ReactNode } from 'react';
import { EngineEvaluation } from '../../engine/types';
import {
  AnalysisHistoryRow,
  SolutionMoveDisplay,
} from './AnalysisPosition';
import { AnalysisBoardModel } from './useAnalysisBoardModel';

export type AnalysisControls = {
  visible: boolean;
  openAnalysis: () => void;
};

export type EngineEvaluationRenderProps = {
  fen: string;
  evaluation: EngineEvaluation;
  theme: 'light' | 'dark';
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
  /** Host-rendered engine UI from `renderEngineEvaluation`. */
  engineEvaluationPanel: ReactNode | null;
};

export type AnalysisContainerRenderProps = {
  theme: 'light' | 'dark';
  onClose: () => void;
  children: ReactNode;
  /** Used by {@link DefaultAnalysisContainer} for overlay dismiss (ignored by most hosts). */
  onBackdropMouseDown?: () => void;
};

/** Place board + sidebar inside the analysis shell (host or default grid). */
export type AnalysisMainRenderProps = {
  model: AnalysisBoardModel;
  board: ReactNode;
  sidebar: ReactNode;
};
