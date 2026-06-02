import React from 'react';
import { AnalysisChessboardView } from './AnalysisChessboardView';
import {
  AnalysisContainerRenderProps,
  AnalysisMainRenderProps,
  AnalysisSidebarRenderProps,
  EngineEvaluationRenderProps,
} from './renderProps';
import { AnalysisEngineOptions } from '../../engine/types';
import {
  AnalysisBoardModel,
  useAnalysisBoardModel,
  UseAnalysisBoardModelArgs,
} from './useAnalysisBoardModel';

export type AnalysisBoardCoreProps = UseAnalysisBoardModelArgs & {
  engine?: AnalysisEngineOptions;
  /** Host-owned shell (modal, page layout, etc.). */
  renderContainer: (props: AnalysisContainerRenderProps) => React.ReactNode;
  /** Host-owned grid/placement of board + sidebar (no library default). */
  renderMain: (props: AnalysisMainRenderProps) => React.ReactNode;
  renderSidebar: (props: AnalysisSidebarRenderProps) => React.ReactNode;
  renderEngineEvaluation: (
    props: EngineEvaluationRenderProps,
  ) => React.ReactNode;
};

/**
 * Analysis logic + composition only: hook, board node, sidebar/engine slots.
 * No layout divs — use {@link renderMain} (e.g. `AnalysisBoardLayout` from `analysis/defaults` or a host layout).
 */
export const AnalysisBoardCore = ({
  renderContainer,
  renderMain,
  renderSidebar,
  renderEngineEvaluation,
  ...modelArgs
}: AnalysisBoardCoreProps) => {
  const model = useAnalysisBoardModel(modelArgs);
  return (
    <AnalysisBoardCoreView
      model={model}
      renderContainer={renderContainer}
      renderMain={renderMain}
      renderSidebar={renderSidebar}
      renderEngineEvaluation={renderEngineEvaluation}
    />
  );
};

type AnalysisBoardCoreViewProps = {
  model: AnalysisBoardModel;
  renderContainer: AnalysisBoardCoreProps['renderContainer'];
  renderMain: AnalysisBoardCoreProps['renderMain'];
  renderSidebar: AnalysisBoardCoreProps['renderSidebar'];
  renderEngineEvaluation: AnalysisBoardCoreProps['renderEngineEvaluation'];
};

/** Pure composition (no layout styles) for testing and reuse. */
export const AnalysisBoardCoreView = ({
  model,
  renderContainer,
  renderMain,
  renderSidebar,
  renderEngineEvaluation,
}: AnalysisBoardCoreViewProps) => {
  const board = <AnalysisChessboardView model={model} />;
  const engineEvaluationPanel = model.engineEnabled
    ? renderEngineEvaluation({
        fen: model.fen,
        evaluation: model.engineEvaluation,
        theme: model.theme,
      })
    : null;

  const sidebar = renderSidebar({
    moves: model.solutionSans,
    historyRows: model.historyRows,
    isHistoryRowSelected: model.isHistoryRowSelected,
    onSelectHistoryRow: model.onSelectHistoryRow,
    ply: model.ply,
    maxPly: model.maxPly,
    onSelectPly: model.onSelectPly,
    theme: model.theme,
    engineEvaluationPanel,
  });

  const main = renderMain({ model, board, sidebar });

  return renderContainer({
    theme: model.theme,
    onClose: model.onClose,
    children: main,
    onBackdropMouseDown: model.onBackdropMouseDown,
  });
};

export type { AnalysisBoardModel, UseAnalysisBoardModelArgs };
