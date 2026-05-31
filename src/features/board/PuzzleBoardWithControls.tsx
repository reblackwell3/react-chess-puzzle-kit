import React, { useEffect, useState } from 'react';
import {
  AnalysisBoard,
  AnalysisContainerRenderProps,
  AnalysisSidebarRenderProps,
  PuzzleResultStatus,
  usePuzzleAnalysis,
} from '../analysis';
import { AnalysisControls } from '../analysis/renderProps';
import { PuzzleBoard } from './PuzzleBoard';
import { PuzzlePosition } from '../position/Position';
import { ThemeProvider } from '../theme/ThemeProvider';
export type { PuzzleMoveRecord } from '../position/moveHistory';
export type {
  AnalysisContainerRenderProps,
  AnalysisControls,
  AnalysisSidebarRenderProps,
  PuzzleAnalysisContext,
  PuzzleResultStatus,
} from '../analysis';

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
}

export const PuzzleBoardWithControls = ({
  theme,
  apiProxy,
  renderControls,
  renderAnalysisSidebar,
  renderAnalysisContainer,
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

  return (
    <ThemeProvider theme={theme}>
      {analysisSnapshot ? (
        <AnalysisBoard
          analysisContext={analysisSnapshot}
          onClose={analysis.closeAnalysis}
          theme={theme}
          renderSidebar={renderAnalysisSidebar}
          renderContainer={renderAnalysisContainer}
        />
      ) : (
        position && (
          <PuzzleBoard
            position={position}
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
