import {
  AnalysisBoardCore,
  AnalysisContainerRenderProps,
  EngineEvaluationRenderProps,
  type AnalysisContext,
  type AnalysisEngineOptions,
} from 'react-chess-core';
import { PuzzleAnalysisDialog } from './PuzzleAnalysisDialog';
import { PuzzleAnalysisMain } from './PuzzleAnalysisMain';
import { PuzzleAnalysisSidebar, type PuzzleAnalysisSidebarProps } from './PuzzleAnalysisSidebar';
import { PuzzleEngineEvaluation } from './PuzzleEngineEvaluation';
import { useResponsivePuzzleAnalysis } from './useResponsivePuzzleAnalysis';

export type PuzzleAnalysisBoardProps = {
  analysisContext: AnalysisContext;
  onClose: () => void;
  theme: 'light' | 'dark';
  engine?: AnalysisEngineOptions;
  title?: string;
  renderSidebar?: (props: PuzzleAnalysisSidebarProps) => React.ReactNode;
  renderContainer?: (props: AnalysisContainerRenderProps) => React.ReactNode;
  renderEngineEvaluation?: (
    props: EngineEvaluationRenderProps,
  ) => React.ReactNode;
};

/** Responsive analysis modal used by replay, courses, and other trainers. */
export const PuzzleAnalysisBoard = ({
  analysisContext,
  onClose,
  theme,
  engine,
  title = 'Puzzle analysis',
  renderSidebar = (props) => <PuzzleAnalysisSidebar {...props} />,
  renderContainer = (props) => <PuzzleAnalysisDialog {...props} title={title} />,
  renderEngineEvaluation = (props) => <PuzzleEngineEvaluation {...props} />,
}: PuzzleAnalysisBoardProps) => {
  const { layout, boardWidth, stackVertically, stackEngineBelow } =
    useResponsivePuzzleAnalysis();

  return (
    <AnalysisBoardCore
      analysisContext={analysisContext}
      onClose={onClose}
      theme={theme}
      boardWidth={boardWidth}
      engine={engine}
      renderMain={(props) => (
        <PuzzleAnalysisMain
          {...props}
          layout={layout}
          stackVertically={stackVertically}
        />
      )}
      renderSidebar={(props) =>
        renderSidebar({
          ...props,
          stackEngineBelow,
        })
      }
      renderContainer={renderContainer}
      renderEngineEvaluation={renderEngineEvaluation}
    />
  );
};

export default PuzzleAnalysisBoard;
