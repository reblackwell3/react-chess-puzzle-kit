import React from 'react';
import { EngineEvaluationPanel } from '../../engine/EngineEvaluationPanel';
import {
  AnalysisBoardCore,
  AnalysisBoardCoreProps,
} from '../core/AnalysisBoardCore';
import { AnalysisLayoutConfig } from '../core/analysisLayoutConfig';
import {
  AnalysisContainerRenderProps,
  AnalysisMainRenderProps,
  AnalysisSidebarRenderProps,
  EngineEvaluationRenderProps,
} from '../core/renderProps';
import { DEFAULT_ANALYSIS_LAYOUT } from './analysisLayout';
import { AnalysisBoardLayout } from './AnalysisBoardLayout';
import { DefaultAnalysisContainer } from './DefaultAnalysisContainer';
import { DefaultAnalysisSidebar } from './DefaultAnalysisSidebar';

export interface AnalysisBoardProps
  extends Omit<
    AnalysisBoardCoreProps,
    | 'renderContainer'
    | 'renderMain'
    | 'renderSidebar'
    | 'renderEngineEvaluation'
    | 'boardWidth'
  > {
  layout?: AnalysisLayoutConfig;
  renderContainer?: (props: AnalysisContainerRenderProps) => React.ReactNode;
  renderMain?: (props: AnalysisMainRenderProps) => React.ReactNode;
  renderSidebar?: (props: AnalysisSidebarRenderProps) => React.ReactNode;
  renderEngineEvaluation?: (
    props: EngineEvaluationRenderProps,
  ) => React.ReactNode;
}

const createDefaultRenderMain =
  (layout: AnalysisLayoutConfig) =>
  (props: AnalysisMainRenderProps) => (
    <AnalysisBoardLayout
      layout={layout}
      model={props.model}
      board={props.board}
      sidebar={props.sidebar}
    />
  );

/**
 * Full analysis UI with library defaults: modal shell, grid layout, sidebar, engine panel.
 * For host-owned UI only, use {@link AnalysisBoardCore} and pass all render props.
 */
export const AnalysisBoard = ({
  layout = DEFAULT_ANALYSIS_LAYOUT,
  renderContainer,
  renderMain,
  renderSidebar,
  renderEngineEvaluation,
  engine,
  ...modelArgs
}: AnalysisBoardProps) => {
  const engineEnabled = engine?.enabled ?? true;

  return (
    <AnalysisBoardCore
      {...modelArgs}
      boardWidth={layout.boardWidth}
      engine={engine}
      renderContainer={renderContainer ?? DefaultAnalysisContainer}
      renderMain={renderMain ?? createDefaultRenderMain(layout)}
      renderSidebar={renderSidebar ?? DefaultAnalysisSidebar}
      renderEngineEvaluation={
        renderEngineEvaluation ??
        (engineEnabled
          ? (props) => <EngineEvaluationPanel {...props} />
          : () => null)
      }
    />
  );
};
