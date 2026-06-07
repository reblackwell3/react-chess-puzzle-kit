import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AnalysisBoard,
  AnalysisBoardCore,
  AnalysisBoardLayout,
  AnalysisContainerRenderProps,
  AnalysisControls,
  AnalysisErrorBoundary,
  AnalysisLayoutConfig,
  AnalysisMainRenderProps,
  AnalysisSidebarRenderProps,
  DEFAULT_ANALYSIS_LAYOUT,
  EngineEvaluationRenderProps,
  PuzzleResultStatus,
  usePuzzleAnalysis,
} from '../analysis';
import { AnalysisEngineOptions, ThemeProvider } from 'react-chess-core';
import {
  defaultRenderControls,
  type PuzzleControlState,
} from './defaults/DefaultPuzzleControls';
import { PuzzlePlaySurface } from './PuzzlePlaySurface';
import {
  DEFAULT_PUZZLE_BOARD_WIDTH,
  puzzleBoardSlotStyle,
  puzzleControlsSlotStyle,
  puzzlePlayColumnStyle,
} from './puzzleBoardLayout';
import { PuzzlePosition } from '../position/Position';
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
export {
  DefaultPuzzleControls,
  defaultRenderControls,
} from './defaults/DefaultPuzzleControls';
export type {
  PuzzleControlState,
  PuzzleControlsRenderProps,
} from './defaults/DefaultPuzzleControls';

/** Delay before auto-playing the opponent's opening move (ms). */
const OPPONENT_OPENING_MOVE_DELAY_MS = 500;

/** Brief pause so the user sees a correct result before the next card loads. */
const AUTO_ADVANCE_ON_COMPLETE_DELAY_MS = 700;

const SOLUTION_STEP_MS = 500;

export interface PuzzleBoardWithControlsProps {
  theme: 'light' | 'dark';
  apiProxy: {
    onFetch: () => Promise<{ fen: string; moves: string[] }>;
    /** Called when {@link onFetch} rejects (e.g. network / server down). */
    onFetchError?: (error: unknown) => void;
    onFeedback: (feedbackData: {
      index: number;
      guess?: { sourceSquare: string; targetSquare: string; piece: string };
      hintRequested?: boolean;
      solutionShown?: boolean;
      isCorrect?: boolean;
      isFinished?: boolean;
    }) => void;
  };
  /** Omit to use {@link defaultRenderControls} / {@link DefaultPuzzleControls}. */
  renderControls?: (
    showHint: () => void,
    showSolution: () => void,
    nextPuzzle: () => void,
    resultStatus: PuzzleResultStatus,
    analysis: AnalysisControls,
    controlState: PuzzleControlState,
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
  /** After a clean solve (no wrong move, hint, or solution reveal), load the next card. */
  autoAdvanceOnComplete?: boolean;
  /** After a wrong guess, play the correct move and wait for the user to advance. */
  revealAnswerOnIncorrect?: boolean;
}

export const PuzzleBoardWithControls = ({
  theme,
  apiProxy,
  renderControls = defaultRenderControls,
  renderAnalysisSidebar,
  renderAnalysisContainer,
  renderEngineEvaluation,
  puzzleBoardWidth = DEFAULT_PUZZLE_BOARD_WIDTH,
  analysisLayout = DEFAULT_ANALYSIS_LAYOUT,
  renderAnalysisMain,
  engine,
  autoAdvanceOnComplete = false,
  revealAnswerOnIncorrect = false,
}: PuzzleBoardWithControlsProps) => {
  const { onFetch, onFetchError, onFeedback } = apiProxy;

  const [position, setPosition] = useState<PuzzlePosition | null>(null);
  const [puzzleNum, setPuzzleNum] = useState(0);
  const [hasIncorrectAttempt, setHasIncorrectAttempt] = useState(false);
  const [puzzleComplete, setPuzzleComplete] = useState(false);
  const [, setInteractionNum] = useState(0);
  const solutionAnimationRef = useRef<{
    cancelled: boolean;
    timeoutIds: ReturnType<typeof setTimeout>[];
  }>({ cancelled: false, timeoutIds: [] });

  const incInteractionNum = () => {
    setInteractionNum((prev) => prev + 1);
  };

  const clearSolutionAnimation = () => {
    const anim = solutionAnimationRef.current;
    anim.cancelled = true;
    anim.timeoutIds.forEach(clearTimeout);
    solutionAnimationRef.current = { cancelled: false, timeoutIds: [] };
  };

  useEffect(() => {
    let cancelled = false;
    let openingMoveTimeoutId: ReturnType<typeof setTimeout> | undefined;

    setPosition(null);
    setHasIncorrectAttempt(false);
    setPuzzleComplete(false);
    onFetch()
      .then((data) => {
        if (cancelled) {
          return;
        }
        if (!data || !data.fen || !data.moves) {
          console.error('Invalid data fetched:', data);
          return;
        }
        const newPosition = new PuzzlePosition(data.fen, data.moves);
        setPosition(newPosition);
        // Multi-move puzzles lead with an opponent setup ply; single-move lines
        // (e.g. a first-ply opening trainer) are already on the player to move.
        if (data.moves.length > 1) {
          openingMoveTimeoutId = setTimeout(() => {
            if (cancelled) {
              return;
            }
            if (newPosition.next()) {
              incInteractionNum();
            }
          }, OPPONENT_OPENING_MOVE_DELAY_MS);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          onFetchError?.(error);
        }
      });

    return () => {
      cancelled = true;
      clearSolutionAnimation();
      if (openingMoveTimeoutId !== undefined) {
        clearTimeout(openingMoveTimeoutId);
      }
    };
  }, [puzzleNum]);

  const handleFeedback = (feedbackData: {
    index: number;
    guess?: { sourceSquare: string; targetSquare: string; piece: string };
    hintRequested?: boolean;
    solutionShown?: boolean;
    isCorrect?: boolean;
    isFinished?: boolean;
  }) => {
    if (
      feedbackData.hintRequested ||
      feedbackData.solutionShown ||
      feedbackData.isCorrect === false
    ) {
      setHasIncorrectAttempt(true);
    }
    if (feedbackData.isFinished) {
      setPuzzleComplete(true);
    }
    onFeedback(feedbackData);
  };

  const getResultStatus = (): PuzzleResultStatus => {
    if (!position) {
      if (hasIncorrectAttempt) {
        return 'incorrect';
      }
      if (puzzleComplete) {
        return 'complete';
      }
      return 'none';
    }
    if (hasIncorrectAttempt) {
      return 'incorrect';
    }
    if (puzzleComplete || position.isFinished()) {
      return 'complete';
    }
    return 'none';
  };

  const handleHintRequest = () => {
    if (!position) {
      return;
    }
    position.recordHint();
    handleFeedback({ index: position.getIndex(), hintRequested: true });
    position.wantsHint(true);
    incInteractionNum();
    setTimeout(() => {
      position.resetInteractions();
      incInteractionNum();
    }, 500);
  };

  const runSolutionWalkthrough = (
    pos: PuzzlePosition,
    emitFinishFeedback: boolean,
  ) => {
    clearSolutionAnimation();
    const anim = {
      cancelled: false,
      timeoutIds: [] as ReturnType<typeof setTimeout>[],
    };
    solutionAnimationRef.current = anim;

    const schedule = (fn: () => void, ms: number) => {
      const id = setTimeout(() => {
        if (anim.cancelled) {
          return;
        }
        fn();
      }, ms);
      anim.timeoutIds.push(id);
    };

    const finish = () => {
      setPuzzleComplete(true);
      if (emitFinishFeedback) {
        handleFeedback({
          index: pos.getIndex(),
          isFinished: true,
          isCorrect: false,
        });
      }
      incInteractionNum();
    };

    const playNextMove = (): boolean => {
      if (pos.isFinished()) {
        return false;
      }
      const played = pos.next();
      if (played) {
        incInteractionNum();
      }
      return played;
    };

    const advance = () => {
      if (anim.cancelled || pos.isFinished()) {
        if (pos.isFinished()) {
          finish();
        }
        return;
      }

      if (!playNextMove()) {
        if (pos.isFinished()) {
          finish();
        }
        return;
      }

      schedule(() => {
        if (anim.cancelled) {
          return;
        }

        playNextMove();

        if (pos.isFinished()) {
          finish();
          return;
        }

        schedule(advance, SOLUTION_STEP_MS);
      }, SOLUTION_STEP_MS);
    };

    advance();
  };

  const handleShowSolution = () => {
    if (!position) {
      return;
    }

    if (position.isSolutionRevealed()) {
      position.replaySolution();
      setPuzzleComplete(false);
      incInteractionNum();
      runSolutionWalkthrough(position, false);
      return;
    }

    if (position.isFinished()) {
      return;
    }

    position.recordSolutionShown();
    position.setSolutionRevealed(true);
    position.wantsHint(false);
    handleFeedback({
      index: position.getIndex(),
      solutionShown: true,
      isCorrect: false,
    });
    incInteractionNum();
    runSolutionWalkthrough(position, true);
  };

  const handleNextPuzzle = useCallback(() => {
    setPuzzleNum((prevPuzzleNum) => prevPuzzleNum + 1);
  }, []);

  const resultStatus = getResultStatus();

  useEffect(() => {
    if (!autoAdvanceOnComplete) {
      return;
    }
    if (resultStatus !== 'complete' || hasIncorrectAttempt) {
      return;
    }

    const timer = setTimeout(() => {
      handleNextPuzzle();
    }, AUTO_ADVANCE_ON_COMPLETE_DELAY_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [
    autoAdvanceOnComplete,
    resultStatus,
    hasIncorrectAttempt,
    handleNextPuzzle,
    puzzleNum,
  ]);
  const controlState: PuzzleControlState = {
    canShowHint:
      position !== null &&
      resultStatus === 'none' &&
      !position.isSolutionRevealed(),
    canShowSolution:
      position !== null &&
      (position.isSolutionRevealed() || !position.isFinished()),
  };
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
        <AnalysisErrorBoundary onClose={analysis.closeAnalysis}>
          {useHostAnalysisUi ? (
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
              renderEngineEvaluation={renderEngineEvaluation ?? (() => null)}
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
          )}
        </AnalysisErrorBoundary>
      ) : (
        <div style={puzzlePlayColumnStyle(puzzleBoardWidth)}>
          <div style={puzzleBoardSlotStyle()}>
            <PuzzlePlaySurface
              position={position}
              boardWidth={puzzleBoardWidth}
              onFeedback={handleFeedback}
              incInteractionNum={incInteractionNum}
              revealAnswerOnIncorrect={revealAnswerOnIncorrect}
            />
          </div>
          <div style={puzzleControlsSlotStyle()}>
            {renderControls(
              handleHintRequest,
              handleShowSolution,
              handleNextPuzzle,
              resultStatus,
              {
                visible: analysis.canOpen,
                openAnalysis: analysis.openAnalysis,
              },
              controlState,
            )}
          </div>
        </div>
      )}
    </ThemeProvider>
  );
};
