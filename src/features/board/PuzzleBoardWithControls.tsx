import React, { useEffect, useState } from 'react';
import {
  AnalysisBoard,
  AnalysisBoardCore,
  AnalysisBoardLayout,
  AnalysisContainerRenderProps,
  AnalysisControls,
  AnalysisLayoutConfig,
  AnalysisMainRenderProps,
  AnalysisSidebarRenderProps,
  DEFAULT_ANALYSIS_LAYOUT,
  EngineEvaluationRenderProps,
  PuzzleResultStatus,
  usePuzzleAnalysis,
} from '../analysis';
import { AnalysisEngineOptions } from '../engine/types';
import { PuzzleBoard } from './PuzzleBoard';
import { DEFAULT_PUZZLE_BOARD_WIDTH } from './puzzleBoardLayout';
import { PuzzlePosition } from '../position/Position';
import { ThemeProvider } from '../theme/ThemeProvider';
export type { PuzzleMoveRecord } from '../position/moveHistory';
export type {
  AnalysisContainerRenderProps,
  AnalysisControls,
  AnalysisLayoutConfig,
  AnalysisMainRenderProps,
  AnalysisSidebarRenderProps,
  EngineEvaluationRenderProps,
  PuzzleAnalysisContext,
  PuzzleResultStatus,
} from '../analysis';
export { DEFAULT_ANALYSIS_LAYOUT } from '../analysis';
export { DEFAULT_PUZZLE_BOARD_WIDTH } from './puzzleBoardLayout';

export interface PuzzleBoardWithControlsProps {
  theme: 'light' | 'dark';
  apiProxy: {
    onFetch: () => Promise<{ fen: string; moves: string[] }>;
    onFeedback: (feedbackData: {
      index: number;
      guess?: { sourceSquare: string; targetSquare: string; piece: string };
      hintRequested?: boolean;
      isCorrect?: boolean;
      isFinished?: boolean;
    }) => void;
  };
  renderControls: (
    showHint: () => void,
    nextPuzzle: () => void,
    resultStatus: PuzzleResultStatus,
    analysis: AnalysisControls,
  ) => React.ReactNode;
  renderAnalysisSidebar?: (
    props: AnalysisSidebarRenderProps,
  ) => React.ReactNode;
  renderAnalysisContainer?: (
    props: AnalysisContainerRenderProps,
  ) => React.ReactNode;
  renderEngineEvaluation?: (
    props: EngineEvaluationRenderProps,
  ) => React.ReactNode;
  /** Pixel width of the live puzzle board (separate from analysis). */
  puzzleBoardWidth?: number;
  /** Board + sidebar grid sizes when analysis is open. */
  analysisLayout?: AnalysisLayoutConfig;
  /** Custom board/sidebar placement (overrides {@link analysisLayout} grid). */
  renderAnalysisMain?: (props: AnalysisMainRenderProps) => React.ReactNode;
  engine?: AnalysisEngineOptions;
}

export const PuzzleBoardWithControls = ({
  theme,
  apiProxy,
  renderControls,
  renderAnalysisSidebar,
  renderAnalysisContainer,
  renderEngineEvaluation,
  puzzleBoardWidth = DEFAULT_PUZZLE_BOARD_WIDTH,
  analysisLayout = DEFAULT_ANALYSIS_LAYOUT,
  renderAnalysisMain,
  engine,
}: PuzzleBoardWithControlsProps) => {
  const { onFetch, onFeedback } = apiProxy;

  const [position, setPosition] = useState(
    () => new PuzzlePosition('8/8/8/7K/k7/8/8/8 w - - 0 1', []),
  );
  const [puzzleNum, setPuzzleNum] = useState(0);
  const [hasIncorrectAttempt, setHasIncorrectAttempt] = useState(false);
  const [puzzleComplete, setPuzzleComplete] = useState(false);
  const [, setInteractionNum] = useState(0);

  const incInteractionNum = () => {
    setInteractionNum((prev) => prev + 1);
  };

  useEffect(() => {
    setHasIncorrectAttempt(false);
    setPuzzleComplete(false);
    onFetch().then((data) => {
      if (!data || !data.fen || !data.moves) {
        console.error('Invalid data fetched:', data);
        return;
      }
      setPosition(() => {
        const newPosition = new PuzzlePosition(data.fen, data.moves);
        setTimeout(() => {
          newPosition.next();
          incInteractionNum();
        }, 500);
        return newPosition;
      });
    });
  }, [puzzleNum]);

  const handleFeedback = (feedbackData: {
    index: number;
    guess?: { sourceSquare: string; targetSquare: string; piece: string };
    hintRequested?: boolean;
    isCorrect?: boolean;
    isFinished?: boolean;
  }) => {
    if (feedbackData.hintRequested || feedbackData.isCorrect === false) {
      setHasIncorrectAttempt(true);
    }
    if (feedbackData.isFinished) {
      setPuzzleComplete(true);
    }
    onFeedback(feedbackData);
  };

  const getResultStatus = (): PuzzleResultStatus => {
    if (hasIncorrectAttempt) {
      return 'incorrect';
    }
    if (puzzleComplete || position.isFinished()) {
      return 'complete';
    }
    return 'none';
  };

  const handleHintRequest = () => {
    position.recordHint();
    handleFeedback({ index: position.getIndex(), hintRequested: true });
    position.wantsHint(true);
    incInteractionNum();
    setTimeout(() => {
      position.resetInteractions();
      incInteractionNum();
    }, 500);
  };

  const handleNextPuzzle = () => {
    setPuzzleNum((prevPuzzleNum) => prevPuzzleNum + 1);
  };

  const resultStatus = getResultStatus();
  const analysis = usePuzzleAnalysis(position, resultStatus, puzzleNum);
  const analysisSnapshot =
    analysis.isOpen && analysis.snapshot ? analysis.snapshot : null;

  const useHostAnalysisUi = Boolean(
    renderAnalysisSidebar &&
      renderAnalysisContainer &&
      (renderEngineEvaluation || engine?.enabled === false),
  );

  return (
    <ThemeProvider theme={theme}>
      {analysisSnapshot ? (
        useHostAnalysisUi ? (
          <AnalysisBoardCore
            analysisContext={analysisSnapshot}
            onClose={analysis.closeAnalysis}
            theme={theme}
            boardWidth={analysisLayout.boardWidth}
            engine={engine}
            renderMain={
              renderAnalysisMain ??
              (({ board, sidebar, model }) => (
                <AnalysisBoardLayout
                  layout={analysisLayout}
                  model={model}
                  board={board}
                  sidebar={sidebar}
                />
              ))
            }
            renderSidebar={renderAnalysisSidebar!}
            renderContainer={renderAnalysisContainer!}
            renderEngineEvaluation={
              renderEngineEvaluation ?? (() => null)
            }
          />
        ) : (
          <AnalysisBoard
            analysisContext={analysisSnapshot}
            onClose={analysis.closeAnalysis}
            theme={theme}
            layout={analysisLayout}
            engine={engine}
            renderMain={renderAnalysisMain}
            renderSidebar={renderAnalysisSidebar}
            renderContainer={renderAnalysisContainer}
            renderEngineEvaluation={renderEngineEvaluation}
          />
        )
      ) : (
        position && (
          <PuzzleBoard
            position={position}
            boardWidth={puzzleBoardWidth}
            onFeedback={handleFeedback}
            incInteractionNum={incInteractionNum}
          />
        )
      )}
      {renderControls(handleHintRequest, handleNextPuzzle, resultStatus, {
        visible: analysis.canOpen,
        openAnalysis: analysis.openAnalysis,
      })}
    </ThemeProvider>
  );
};
