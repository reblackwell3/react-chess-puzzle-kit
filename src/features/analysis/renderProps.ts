import type { ReactNode } from 'react';
import { SolutionMoveDisplay } from './AnalysisPosition';

export type AnalysisControls = {
  visible: boolean;
  openAnalysis: () => void;
};

export type AnalysisSidebarRenderProps = {
  moves: SolutionMoveDisplay[];
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
